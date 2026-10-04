/* global figma, mgLayoutIndex, MG_KIT_GUIDANCE */
// Presentation navigation is read-only and never loads or substitutes fonts.
function mgConsumerGuidance(doc) {
  const guidance =
    doc?.kitGuidance ||
    (typeof MG_KIT_GUIDANCE !== 'undefined' ? MG_KIT_GUIDANCE : null);
  if (!guidance || guidance.version !== 1 || !Array.isArray(guidance.families))
    throw new Error('Rebuild the plugin and token file to load kit guidance.');
  return guidance;
}

async function inspectMangroveNavigation(doc) {
  const index = await mgLayoutIndex();
  const destinations = [];
  const sectionKeys = [
    'start',
    'foundations',
    'components',
    'compositions',
    'patterns',
    'pending',
  ];
  for (const id of sectionKeys) {
    const node =
      index.get(`layout/${id}`) ||
      (id === 'start' ? index.get('welcome') : null);
    if (
      node &&
      node.parent === figma.currentPage &&
      (node.type === 'SECTION' || (id === 'start' && node.type === 'FRAME'))
    )
      destinations.push({ id, label: node.name });
  }
  for (const [id, key] of [
    ['legacy-review', 'review'],
    ['legacy-main', 'main'],
    ['legacy-diagnostics', 'diagnostics.focus-ring'],
  ]) {
    const node = index.get(key);
    if (node && node.parent === figma.currentPage && node.type === 'FRAME')
      destinations.push({ id, label: node.name });
  }
  let guidance;
  try {
    guidance = mgConsumerGuidance(doc);
  } catch {
    guidance = null;
  }
  const families = (guidance?.families || [])
    .filter(
      item =>
        item.kind === 'primary' &&
        item.status === 'bounded-draft' &&
        index.has(`family/${item.id}`)
    )
    .map(item => ({
      id: item.id,
      label: item.label,
      group:
        guidance.groups.find(group => group.id === item.groupId)?.label || '',
      hasExamples: index.has(`review/${item.id}`),
    }));
  return { destinations, families, errors: [] };
}

function mgNavigateUsageEntry(node, familyId, index) {
  // bounds uses page coordinates; multiplying by the current zoom preserves
  // screen capacity when setting a new zoom. Only viewport/selection changes.
  // https://developers.figma.com/docs/plugins/api/figma-viewport/
  const viewport = figma.viewport;
  const bounds = viewport.bounds;
  const box = node.absoluteBoundingBox;
  const validRect = rect =>
    rect &&
    ['x', 'y', 'width', 'height'].every(field =>
      Number.isFinite(rect[field])
    ) &&
    rect.width > 0 &&
    rect.height > 0;
  if (
    !validRect(bounds) ||
    !validRect(box) ||
    !Number.isFinite(viewport.zoom) ||
    viewport.zoom <= 0
  )
    return false;
  const screenWidth = bounds.width * viewport.zoom;
  const screenHeight = bounds.height * viewport.zoom;
  const margin = 48;
  const first = node.children.find(child => child.type === 'INSTANCE');
  const firstBox = first?.absoluteBoundingBox;
  const width = Math.max(box.width, validRect(firstBox) ? firstBox.width : 0);
  const widthZoom = Math.min(1, screenWidth / (width + margin * 2));
  if (box.height + margin * 2 <= screenHeight / widthZoom) return false;
  const heading = index.get(`layout/family/${familyId}/overview/title`);
  const headingBox = heading?.absoluteBoundingBox;
  // Include the existing family heading and purpose above the normal examples.
  // Never navigate to a detached heading or invent a temporary focus frame.
  const top =
    validRect(headingBox) && heading.parent === node.parent
      ? Math.min(box.y, headingBox.y)
      : box.y;
  const firstChunk = validRect(firstBox)
    ? Math.min(box.height, Math.max(256, firstBox.y - box.y + firstBox.height))
    : Math.min(box.height, 320);
  const zoom = Math.min(
    widthZoom,
    screenHeight / (box.y - top + firstChunk + margin * 2)
  );
  viewport.zoom = zoom;
  viewport.center = {
    x: box.x - margin + screenWidth / (2 * zoom),
    y: top - margin + screenHeight / (2 * zoom),
  };
  return true;
}

async function navigateMangroveInstalled(destination) {
  const state = await inspectMangroveNavigation();
  const index = await mgLayoutIndex();
  let key;
  if (destination.startsWith('example:') || destination.startsWith('source:')) {
    const [view, id] = destination.split(':');
    if (!state.families.some(item => item.id === id))
      throw new Error(
        'This component is not an installed core browsing destination.'
      );
    key = `${view === 'example' ? 'review' : 'family'}/${id}`;
  } else {
    if (!state.destinations.some(item => item.id === destination))
      throw new Error(
        'This destination is not installed on the current page. Refresh navigation.'
      );
    key =
      {
        'legacy-main': 'main',
        'legacy-review': 'review',
        'legacy-diagnostics': 'diagnostics.focus-ring',
      }[destination] || `layout/${destination}`;
    if (destination === 'start' && !index.has(key)) key = 'welcome';
  }
  const node = index.get(key);
  if (!node)
    throw new Error(
      'No installed example exists for this component. Choose Source components.'
    );
  const usageEntry =
    destination.startsWith('example:') &&
    mgNavigateUsageEntry(node, destination.split(':')[1], index);
  if (!usageEntry) figma.viewport.scrollAndZoomIntoView([node]);
  figma.currentPage.selection = [node];
  return {
    operation: 'kit-navigation',
    destination,
    nodeId: node.id,
    viewportMode: usageEntry ? 'usage-entry' : 'fit',
    errors: [],
  };
}

async function refreshMangroveGuidance(doc) {
  const guidance = mgConsumerGuidance(doc);
  if (
    !doc?.components?.families ||
    guidance.families.length !== doc.components.families.length
  )
    throw new Error(
      'Guidance requires the complete current component inventory.'
    );
  const known = new Set(doc.components.families.map(item => item.id));
  const seen = new Set();
  const index = await mgLayoutIndex();
  const changes = [];
  for (const item of guidance.families) {
    if (
      !known.has(item.id) ||
      seen.has(item.id) ||
      !item.description ||
      !['bounded-draft', 'outside-core'].includes(item.status)
    )
      throw new Error('Invalid or incomplete consumer guidance.');
    seen.add(item.id);
    const set = index.get(`family/${item.id}`);
    if (!set) continue;
    if (set.type !== 'COMPONENT_SET')
      throw new Error(`Source family ${item.id} changed type.`);
    const variants = set.children.filter(node => node.type === 'COMPONENT');
    for (const node of [set, ...variants])
      if (node.description !== item.description)
        changes.push({ node, description: item.description });
  }
  const updatedNodeIds = [];
  try {
    for (const { node, description } of changes) {
      node.description = description;
      updatedNodeIds.push(node.id);
    }
  } catch (error) {
    return {
      operation: 'kit-guidance',
      phase: 'partial',
      createdNodeIds: [],
      updatedNodeIds,
      errors: [error.message || String(error)],
    };
  }
  return {
    operation: 'kit-guidance',
    phase: 'complete',
    createdNodeIds: [],
    updatedNodeIds,
    scope: guidance.scope,
    errors: [],
  };
}
