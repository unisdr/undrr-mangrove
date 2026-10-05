/* global figma, mgReadIdentity, mgWriteIdentity, createMangroveWelcome, readMangroveMaintenancePolicies */
/** Versioned presentation only. Canonical component anatomy remains source-owned. */
const MG_LAYOUT_VERSION = '2';
const MG_LAYOUT_DESTINATIONS = [
  ['start', '00 Start here'],
  ['foundations', '01 Foundations'],
  ['components', '02 Components'],
  ['compositions', '03 Examples and templates'],
  ['patterns', '04 Your workspace'],
  ['pending', '90 Maintenance'],
];
const MG_LAYOUT_COMPOSITIONS = new Set([
  'combobox',
  'table',
  'text-cta',
  'table-of-contents',
  'segmented-control.full-width-below-medium',
]);
const MG_LAYOUT_PENDING = new Set(['tabs-trigger', 'tabs', 'editorial-cta']);

function mgLayoutDestination(id) {
  return MG_LAYOUT_PENDING.has(id)
    ? 'pending'
    : MG_LAYOUT_COMPOSITIONS.has(id)
      ? 'compositions'
      : 'components';
}

function mgKitLayoutInstalled() {
  return (
    figma.currentPage.findAll(
      node => mgReadIdentity(node, 'mgKitId') === 'layout/start'
    ).length > 0
  );
}

function mgLayoutFootprint(node) {
  const box = node.absoluteBoundingBox;
  const paint = node.absoluteRenderBounds;
  const left = box && paint ? Math.min(0, paint.x - box.x) : 0;
  const top = box && paint ? Math.min(0, paint.y - box.y) : 0;
  const right =
    box && paint
      ? Math.max(node.width, paint.x + paint.width - box.x)
      : node.width;
  const bottom =
    box && paint
      ? Math.max(node.height, paint.y + paint.height - box.y)
      : node.height;
  return { left, top, width: right - left, height: bottom - top };
}

// Figma Layers reverses paint order. Reorder only the named generated siblings
// in their existing slots; unrelated children keep their slots and local fields.
function mgLayoutLayerOrder(parent, readingOrder) {
  if (parent.type === 'FRAME' && parent.layoutMode !== 'NONE')
    throw new Error(
      'Semantic layer ordering requires a free-positioned presentation parent.'
    );
  const nodes = readingOrder.filter(Boolean);
  const ids = new Set(nodes.map(node => node.id));
  if (ids.size !== nodes.length || nodes.some(node => node.parent !== parent))
    throw new Error('Conflicting generated presentation reading order.');
  const paintOrder = [...nodes].reverse();
  let next = 0;
  const desired = parent.children.map(node =>
    ids.has(node.id) ? paintOrder[next++] : node
  );
  desired.forEach((target, index) => {
    let moves = 0;
    while (parent.children[index] !== target) {
      if (++moves > desired.length)
        throw new Error('Could not preserve manual sibling slots.');
      if (ids.has(target.id)) parent.insertChild(index, target);
      else {
        const displaced = parent.children[index];
        if (!ids.has(displaced.id))
          throw new Error('Unrelated sibling order changed unexpectedly.');
        parent.insertChild(desired.indexOf(displaced), displaced);
      }
    }
  });
}

// Presentation-only geometry. Source children and their inherited descendants
// retain their widths/heights and every internal field.
function mgLayoutBrowseFlow(parent, headers, items, columns = 1) {
  parent.layoutMode = 'NONE';
  let y = parent.paddingTop;
  let headingWidth = 0;
  for (const node of headers) {
    const footprint = mgLayoutFootprint(node);
    node.x = parent.paddingLeft - footprint.left;
    node.y = y - footprint.top;
    y += footprint.height + parent.itemSpacing;
    headingWidth = Math.max(headingWidth, footprint.width);
  }
  const widths = Array(columns).fill(0);
  const measured = items.map(mgLayoutFootprint);
  measured.forEach((size, i) => {
    widths[i % columns] = Math.max(widths[i % columns], size.width);
  });
  const xs = widths.map(
    (_, column) =>
      parent.paddingLeft +
      widths.slice(0, column).reduce((sum, width) => sum + width + 48, 0)
  );
  for (let i = 0; i < items.length; i += columns) {
    const row = items.slice(i, i + columns);
    row.forEach((node, j) => {
      node.x = xs[j] - measured[i + j].left;
      node.y = y - measured[i + j].top;
    });
    y +=
      Math.max(...row.map((_, j) => measured[i + j].height)) +
      parent.itemSpacing;
  }
  const width = Math.max(
    900,
    headingWidth + parent.paddingLeft + parent.paddingRight,
    widths.reduce((sum, value) => sum + value, 0) +
      48 * (columns - 1) +
      parent.paddingLeft +
      parent.paddingRight
  );
  parent.resizeWithoutConstraints(
    width,
    Math.max(
      40,
      y -
        (headers.length || items.length ? parent.itemSpacing : 0) +
        parent.paddingBottom
    )
  );
  mgLayoutLayerOrder(parent, [...headers, ...items]);
}

function mgLayoutGrid(set, family) {
  const nodes = set.children.filter(node => node.type === 'COMPONENT');
  if (!nodes.length) return;
  const sizes = new Map(nodes.map(node => [node.id, mgLayoutFootprint(node)]));
  if (family?.id === 'table') {
    const byKey = new Map(
      family.variants.map(variant => [
        `family/table/variant/${variant.id}`,
        variant,
      ])
    );
    const matched = nodes.map(node =>
      byKey.get(mgReadIdentity(node, 'mgKitId'))
    );
    if (matched.every(Boolean)) {
      const short = nodes.filter(
        (_, i) => matched[i].properties.Content === 'Short'
      );
      const content = nodes.filter(
        (_, i) => matched[i].properties.Content !== 'Short'
      );
      if (short.length && content.length) {
        const placeRows = (items, top) => {
          let width = 0;
          for (let i = 0; i < items.length; i += 3) {
            const row = items.slice(i, i + 3);
            let x = 24;
            for (const node of row) {
              const size = sizes.get(node.id);
              node.x = x - size.left;
              node.y = top - size.top;
              x += size.width + 48;
            }
            width = Math.max(width, x - 24);
            top += Math.max(...row.map(node => sizes.get(node.id).height)) + 48;
          }
          return { width, next: top };
        };
        // Keep short state rows compact. Story presets occupy their own rows
        // and cannot impose wide empty columns on the six short tables.
        const first = placeRows(short, 24);
        const second = placeRows(content, first.next);
        set.resizeWithoutConstraints(
          Math.max(first.width, second.width),
          second.next - 24
        );
        return;
      }
    }
  }
  const columns = Math.min(3, nodes.length);
  const widths = Array(columns).fill(0);
  const heights = Array(Math.ceil(nodes.length / columns)).fill(0);
  nodes.forEach((node, i) => {
    widths[i % columns] = Math.max(
      widths[i % columns],
      sizes.get(node.id).width
    );
    heights[Math.floor(i / columns)] = Math.max(
      heights[Math.floor(i / columns)],
      sizes.get(node.id).height
    );
  });
  const offsets = values => {
    let next = 24;
    return values.map(value => {
      const offset = next;
      next += value + 48;
      return offset;
    });
  };
  const xs = offsets(widths);
  const ys = offsets(heights);
  nodes.forEach((node, i) => {
    node.x = xs[i % columns] - sizes.get(node.id).left;
    node.y = ys[Math.floor(i / columns)] - sizes.get(node.id).top;
  });
  set.resizeWithoutConstraints(
    48 + widths.reduce((sum, width) => sum + width, 0) + 48 * (columns - 1),
    48 +
      heights.reduce((sum, height) => sum + height, 0) +
      48 * (heights.length - 1)
  );
}

function mgLayoutLegacySpacing(main, review) {
  // Presentation-only correction while the section migration is blocked.
  // Retain nominal frame sizes, component geometry and consumer local positions.
  const renderRight = main.absoluteRenderBounds
    ? main.absoluteRenderBounds.x + main.absoluteRenderBounds.width - main.x
    : 0;
  const width = Math.max(
    main.width,
    renderRight,
    ...main.children.map(child => child.x + child.width + main.paddingRight)
  );
  const x = main.x + width + 80;
  const changed = review.x !== x;
  review.x = x;
  return { changed, mainExtent: width, gap: 80 };
}

async function mgLayoutLoadExistingFonts() {
  // Reparenting an existing auto-layout subtree requires its exact fonts in
  // the current plugin session. Loading does not reassign any text.
  const faces = new Map();
  for (const node of figma.currentPage.findAll(node => node.type === 'TEXT')) {
    let owner = node;
    while (owner && owner !== figma.currentPage) {
      const key = mgReadIdentity(owner, 'mgKitId');
      if (
        key === 'main' ||
        key === 'review' ||
        key === 'welcome' ||
        key.startsWith('layout/')
      ) {
        for (const run of node.getStyledTextSegments(['fontName']))
          faces.set(JSON.stringify(run.fontName), run.fontName);
        break;
      }
      owner = owner.parent;
    }
  }
  for (const face of faces.values()) await figma.loadFontAsync(face);
}

async function mgLayoutIndex() {
  const page = figma.currentPage;
  const index = new Map();
  for (const node of page.findAll(() => true)) {
    let inside = false;
    for (
      let parent = node.parent;
      parent && parent !== page;
      parent = parent.parent
    )
      if (parent.type === 'INSTANCE') inside = true;
    if (inside) continue;
    const key = mgReadIdentity(node, 'mgKitId');
    if (!key) continue;
    if (
      node.type === 'INSTANCE' &&
      /^family\/[^/]+\/variant\/[^/]+$/.test(key)
    ) {
      const main = await node.getMainComponentAsync();
      if (!main || mgReadIdentity(main, 'mgKitId') !== key)
        throw new Error(
          'Inherited variant identity has no matching canonical main.'
        );
      continue;
    }
    if (index.has(key))
      throw new Error(`Duplicate Mangrove ownership key ${key}`);
    index.set(key, node);
  }
  return index;
}

function mgLayoutExpectedType(key) {
  if (key === 'layout/reference') return 'SECTION';
  if (/^layout\/entry\/[^/]+\/instance$/.test(key)) return 'INSTANCE';
  if (MG_LAYOUT_DESTINATIONS.some(([id]) => key === `layout/${id}`))
    return 'SECTION';
  if (!key.startsWith('layout/')) return null;
  if (/\/(title|body|label|sample)$/.test(key)) return 'TEXT';
  if (/\/(swatch|bar)$/.test(key)) return 'RECTANGLE';
  return 'FRAME';
}

function mgLayoutGuidance(doc) {
  const guidance = doc?.kitGuidance;
  if (
    guidance?.version !== 1 ||
    !Array.isArray(guidance.groups) ||
    !Array.isArray(guidance.families)
  )
    throw new Error('Organisation needs the current task-based kit guidance.');
  const registry = new Map(
    doc.components.families.map(family => [family.id, family])
  );
  const families = new Map();
  const groups = new Map();
  for (const group of guidance.groups) {
    if (
      !/^[a-z][a-z0-9-]*$/.test(group.id) ||
      groups.has(group.id) ||
      typeof group.label !== 'string' ||
      !group.label.trim() ||
      !Array.isArray(group.familyIds)
    )
      throw new Error('Conflicting task-group guidance.');
    groups.set(group.id, group);
  }
  for (const family of guidance.families) {
    if (
      !registry.has(family.id) ||
      families.has(family.id) ||
      !groups.has(family.groupId) ||
      !['primary', 'support'].includes(family.kind) ||
      !['bounded-draft', 'source-scaffold', 'outside-core'].includes(
        family.status
      ) ||
      ['label', 'purpose', 'usage'].some(
        field => typeof family[field] !== 'string' || !family[field].trim()
      ) ||
      ['supported', 'limitations'].some(
        field =>
          !Array.isArray(family[field]) ||
          family[field].some(value => typeof value !== 'string')
      )
    )
      throw new Error(`Invalid family guidance ${family.id}.`);
    families.set(family.id, family);
  }
  if (families.size !== registry.size)
    throw new Error('Guidance must cover every source family.');
  const primaryIds = [];
  for (const group of groups.values()) {
    for (const id of group.familyIds) {
      const family = families.get(id);
      if (
        !family ||
        family.kind !== 'primary' ||
        family.groupId !== group.id ||
        primaryIds.includes(id)
      )
        throw new Error(
          'Task groups must list each primary family exactly once.'
        );
      primaryIds.push(id);
    }
  }
  for (const family of families.values()) {
    if (family.kind === 'primary' && !primaryIds.includes(family.id))
      throw new Error(`Missing browsing family ${family.id}.`);
    if (family.kind === 'support') {
      const parent = families.get(family.parentFamilyId);
      if (
        !parent ||
        parent.kind !== 'primary' ||
        parent.groupId !== family.groupId ||
        parent.status !== family.status
      )
        throw new Error(`Invalid advanced-part parent ${family.id}.`);
    }
  }
  return { groups, families, registry };
}

async function mgLayoutPreflight(
  doc,
  { allowProbes = false, allowVersion1Migration = false, compact = false } = {}
) {
  if (doc?.components?.version !== 1 || !doc.components.families?.length)
    throw new Error(
      'Organisation needs the complete supported token document.'
    );
  const guidance = mgLayoutGuidance(doc);
  if (typeof readMangroveMaintenancePolicies !== 'function')
    throw new Error(
      'Rebuild the desktop plugin with maintenance ownership guards.'
    );
  const maintenance = await readMangroveMaintenancePolicies(doc);
  if (maintenance.errors.length)
    throw new Error(
      `Maintenance ownership refused: ${maintenance.errors.join('; ')}`
    );
  if (
    !allowProbes &&
    figma.currentPage.findAll(node =>
      Boolean(mgReadIdentity(node, 'mgCapabilityProbeId'))
    ).length
  )
    throw new Error(
      'Remove recorded temporary capability checks before reorganizing the kit.'
    );
  const index = await mgLayoutIndex();
  if (
    !allowProbes &&
    [...index.keys()].some(key =>
      /^(acceptance|capability|capabilities)\//.test(key)
    )
  )
    throw new Error(
      'Remove recorded temporary acceptance checks before reorganizing the kit.'
    );
  const start = index.get('layout/start');
  const flow = start && mgReadIdentity(start, 'mgLayoutFlowVersion');
  if (flow && flow !== '1') throw new Error('Unsupported canvas flow version.');
  const flowPartial =
    start && mgReadIdentity(start, 'mgLayoutFlowPhase') === 'migrating';
  const compactFlow = compact || flow === '1';
  const manual = maintenance.families.filter(
    family => family.setId && family.policy.owner === 'manual'
  );
  if (manual.length) {
    if (
      !start ||
      mgReadIdentity(start, 'mgLayoutVersion') !== MG_LAYOUT_VERSION ||
      mgReadIdentity(start, 'mgLayoutPhase') !== 'complete' ||
      (compact && flow !== '1') ||
      (flow && mgReadIdentity(start, 'mgLayoutFlowPhase') !== 'complete')
    )
      throw new Error(
        'Manual mains require their existing completed presentation layout; explicit migration cannot preserve them safely.'
      );
    for (const { familyId } of manual)
      for (const suffix of [
        'main',
        'overview',
        'overview/title',
        'overview/body',
      ]) {
        const node = index.get(`layout/family/${familyId}/${suffix}`);
        const expected = suffix.includes('/') ? 'TEXT' : 'FRAME';
        if (!node || node.type !== expected)
          throw new Error(
            `Manual family ${familyId} requires its unchanged owned ${suffix}.`
          );
      }
  }
  if (
    flow === '1' &&
    !['migrating', 'complete'].includes(
      mgReadIdentity(start, 'mgLayoutFlowPhase')
    )
  )
    throw new Error('Unsupported canvas flow phase.');
  const version = start && mgReadIdentity(start, 'mgLayoutVersion');
  const partial =
    start && mgReadIdentity(start, 'mgLayoutPhase') === 'migrating';
  if (start && !['1', MG_LAYOUT_VERSION].includes(version))
    throw new Error(
      'Unsupported kit layout version; an explicit migration is required.'
    );
  if (version === '1' && !allowVersion1Migration)
    throw new Error(
      'Use Organize file explicitly to migrate layout version 1 to version 2 before ordinary builds.'
    );
  const legacy =
    version === '1' ||
    (partial && mgReadIdentity(start, 'mgLayoutFromVersion') === '1');
  const { registry, families } = guidance;
  const planned = doc.plannedInventory;
  if (
    planned &&
    (planned.version !== 1 ||
      planned.representation !== 'documentation-only' ||
      !Array.isArray(planned.entries) ||
      new Set(planned.entries.map(entry => entry.id)).size !==
        planned.entries.length)
  )
    throw new Error(
      'Planned catalogue requires a unique documentation-only source inventory.'
    );
  for (const [key, node] of index) {
    if (!key.startsWith('layout/compositions/catalogue')) continue;
    const entry = planned?.entries.find(
      item => key === `layout/compositions/catalogue/entry/${item.id}`
    );
    const expected =
      key === 'layout/compositions/catalogue'
        ? 'layout/compositions'
        : entry
          ? 'layout/compositions/catalogue'
          : null;
    if (expected && mgReadIdentity(node.parent, 'mgKitId') !== expected)
      throw new Error(
        `Planned catalogue ${key} was moved; preserve it before updating.`
      );
    if (key === 'layout/compositions/catalogue' || entry) {
      const allowed = new Set(
        key === 'layout/compositions/catalogue'
          ? [
              `${key}/title`,
              `${key}/body`,
              ...(planned?.entries || []).map(
                item => `${key}/entry/${item.id}`
              ),
            ]
          : [`${key}/title`, `${key}/body`]
      );
      if (
        node.children.some(
          child => !allowed.has(mgReadIdentity(child, 'mgKitId'))
        )
      )
        throw new Error(
          `Manual or retired content in ${key}; keep notes beside generated catalogue rows.`
        );
    }
  }
  if (registry.size !== doc.components.families.length)
    throw new Error('Duplicate source family identifiers.');
  for (const [key, node] of index) {
    const type = mgLayoutExpectedType(key);
    if (type && node.type !== type)
      throw new Error(`Layout ownership ${key} must be ${type}.`);
    const variant = /^family\/([^/]+)\/variant\/([^/]+)$/.exec(key);
    if (variant) {
      const family = registry.get(variant[1]);
      if (
        !family ||
        node.type !== 'COMPONENT' ||
        node.parent !== index.get(`family/${variant[1]}`) ||
        !family.variants.some(item => item.id === variant[2])
      )
        throw new Error(
          `Orphan or conflicting canonical variant ${key}; explicit migration required.`
        );
    }
    const familyMatch = /^family\/([^/]+)$/.exec(key);
    if (familyMatch) {
      if (!registry.has(familyMatch[1]) || node.type !== 'COMPONENT_SET')
        throw new Error(`Missing or conflicting family ${familyMatch[1]}.`);
      const expected = start ? `layout/family/${familyMatch[1]}/main` : 'main';
      const staged =
        start &&
        (partial || !index.has(expected)) &&
        mgReadIdentity(node.parent, 'mgKitId') === 'main';
      if (!staged && mgReadIdentity(node.parent, 'mgKitId') !== expected)
        throw new Error(
          `Canonical ${key} has an unexpected parent; migration refused.`
        );
    }
    const reviewMatch = /^review\/([^/]+)$/.exec(key);
    if (reviewMatch) {
      const id = reviewMatch[1];
      if (!registry.has(id) || node.type !== 'FRAME')
        throw new Error(`Review ${key} needs its original family and frame.`);
      const current = mgReadIdentity(node.parent, 'mgKitId');
      const expected =
        start && version === MG_LAYOUT_VERSION
          ? `layout/family/${id}/overview`
          : !start || mgLayoutDestination(id) === 'components'
            ? 'review'
            : `layout/${mgLayoutDestination(id)}/review`;
      const oldParents = [
        'review',
        'layout/compositions/review',
        'layout/pending/review',
      ];
      if (
        current !== expected &&
        !(partial && oldParents.includes(current)) &&
        !(
          version === MG_LAYOUT_VERSION &&
          current === 'review' &&
          !index.has(expected)
        )
      )
        throw new Error(
          `Review ${key} has an unexpected parent; migration refused.`
        );
    }
    const sourceBoard = /^layout\/family\/([^/]+)\/main$/.exec(key);
    if (sourceBoard) {
      if (!registry.has(sourceBoard[1]))
        throw new Error(`Unknown source board ${key}.`);
      const allowed = new Set([
        `${key}/title`,
        `${key}/body`,
        `family/${sourceBoard[1]}`,
      ]);
      if (
        node.children.some(
          child =>
            !allowed.has(mgReadIdentity(child, 'mgKitId')) ||
            index.get(mgReadIdentity(child, 'mgKitId')) !== child
        )
      )
        throw new Error(
          `Manual or conflicting content in ${key}; preserve it before updating generated layout.`
        );
      if (
        version === MG_LAYOUT_VERSION &&
        !partial &&
        mgReadIdentity(node.parent, 'mgKitId') !==
          `layout/family/${sourceBoard[1]}/overview`
      )
        throw new Error(`Source board ${key} was moved.`);
    }
    const overview = /^layout\/family\/([^/]+)\/overview$/.exec(key);
    if (overview) {
      const meta = families.get(overview[1]);
      if (!meta) throw new Error(`Unknown family overview ${key}.`);
      const expected =
        meta.kind === 'support'
          ? `layout/family/${meta.parentFamilyId}/advanced`
          : meta.status === 'outside-core'
            ? 'layout/pending/browse'
            : flow === '1'
              ? `layout/reference/group/${meta.groupId}`
              : `layout/group/${meta.groupId}`;
      const actualParent = mgReadIdentity(node.parent, 'mgKitId');
      const movingPrimary =
        meta.kind === 'primary' &&
        meta.status !== 'outside-core' &&
        compactFlow &&
        (compact || flowPartial) &&
        [
          `layout/group/${meta.groupId}`,
          `layout/reference/group/${meta.groupId}`,
        ].includes(actualParent);
      if (actualParent !== expected && !movingPrimary)
        throw new Error(`Family overview ${key} was moved.`);
      const allowed = new Set([
        `${key}/title`,
        `${key}/body`,
        `layout/family/${meta.id}/main`,
        `review/${meta.id}`,
        `layout/family/${meta.id}/advanced`,
      ]);
      if (
        node.children.some(
          child =>
            !allowed.has(mgReadIdentity(child, 'mgKitId')) ||
            index.get(mgReadIdentity(child, 'mgKitId')) !== child
        )
      )
        throw new Error(`Manual content in generated overview ${key}.`);
    }
  }
  // The compact flow has a closed presentation schema. Inherited instance
  // descendants are excluded by mgLayoutIndex; canonical ownership is separate.
  for (const [key, node] of index) {
    if (!key.startsWith('layout/entry/') && !key.startsWith('layout/reference'))
      continue;
    if (!compactFlow)
      throw new Error(`Canvas flow requires explicit Organize file: ${key}.`);
    if (key === 'layout/reference') {
      if (node.parent !== figma.currentPage)
        throw new Error('Reference catalogue was moved.');
      const allowed = new Set([
        'layout/reference/title',
        'layout/reference/body',
        ...[...guidance.groups.keys()].map(
          id => `layout/reference/group/${id}`
        ),
      ]);
      if (
        node.children.some(
          child =>
            !allowed.has(mgReadIdentity(child, 'mgKitId')) ||
            index.get(mgReadIdentity(child, 'mgKitId')) !== child
        )
      )
        throw new Error('Manual content in generated reference catalogue.');
      continue;
    }
    const refGroup = /^layout\/reference\/group\/([^/]+)$/.exec(key);
    if (refGroup) {
      const group = guidance.groups.get(refGroup[1]);
      if (!group || node.parent !== index.get('layout/reference'))
        throw new Error(`Conflicting reference group ${key}.`);
      const allowed = new Set([
        `${key}/title`,
        ...group.familyIds
          .filter(id => families.get(id).status !== 'outside-core')
          .map(id => `layout/family/${id}/overview`),
      ]);
      if (
        node.children.some(
          child =>
            !allowed.has(mgReadIdentity(child, 'mgKitId')) ||
            index.get(mgReadIdentity(child, 'mgKitId')) !== child
        )
      )
        throw new Error(`Manual content in ${key}.`);
      continue;
    }
    if (['layout/reference/title', 'layout/reference/body'].includes(key)) {
      if (node.parent !== index.get('layout/reference'))
        throw new Error(`Moved reference text ${key}.`);
      continue;
    }
    const refTitle = /^layout\/reference\/group\/([^/]+)\/title$/.exec(key);
    if (
      refTitle &&
      guidance.groups.has(refTitle[1]) &&
      node.parent === index.get(key.replace(/\/title$/, ''))
    )
      continue;
    const entry =
      /^layout\/entry\/([^/]+)(?:\/(title|body|label|instance))?$/.exec(key);
    const meta = entry && families.get(entry[1]);
    if (!meta || meta.kind !== 'primary' || meta.status === 'outside-core')
      throw new Error(`Unknown canvas flow ownership ${key}.`);
    const ownerKey = `layout/entry/${meta.id}`;
    if (
      node.parent !==
      index.get(entry[2] ? ownerKey : `layout/group/${meta.groupId}`)
    )
      throw new Error(`Moved compact entry ${key}.`);
    if (!entry[2]) {
      const allowed = new Set(
        ['title', 'body', 'label', 'instance'].map(id => `${ownerKey}/${id}`)
      );
      if (
        node.children.some(
          child =>
            !allowed.has(mgReadIdentity(child, 'mgKitId')) ||
            index.get(mgReadIdentity(child, 'mgKitId')) !== child
        )
      )
        throw new Error(`Manual content in compact entry ${key}.`);
    } else if (entry[2] === 'instance') {
      const main = await node.getMainComponentAsync();
      const exemplar = index
        .get(`review/${meta.id}`)
        ?.findAll(child => child.type === 'INSTANCE')[0];
      const expectedMain = exemplar && (await exemplar.getMainComponentAsync());
      if (
        !main ||
        main.id !== expectedMain?.id ||
        main.parent !== index.get(`family/${meta.id}`) ||
        index.get(mgReadIdentity(main, 'mgKitId')) !== main
      )
        throw new Error(`Conflicting compact entry main ${key}.`);
    }
  }
  for (const key of ['main', 'review']) {
    const root = index.get(key);
    if (!root || root.type !== 'FRAME')
      throw new Error(`Organisation requires the existing ${key} frame.`);
    const expected = start
      ? index.get(
          version === MG_LAYOUT_VERSION ? 'layout/pending' : 'layout/components'
        )
      : figma.currentPage;
    if (
      root.parent !== expected &&
      !(
        partial &&
        [figma.currentPage, index.get('layout/components')].includes(
          root.parent
        )
      )
    )
      throw new Error(
        `The existing ${key} frame is outside its migration scope.`
      );
    if (
      !start &&
      root.children.some(child => {
        const childKey = mgReadIdentity(child, 'mgKitId');
        return (
          index.get(childKey) !== child ||
          !(key === 'main'
            ? child.type === 'COMPONENT_SET' &&
              /^family\/[^/]+$/.test(childKey) &&
              registry.has(childKey.slice(7))
            : child.type === 'FRAME' &&
              /^review\/[^/]+$/.test(childKey) &&
              registry.has(childKey.slice(7)))
        );
      })
    )
      throw new Error(
        `Manual content in ${key}: preserve it explicitly before migrating the generated container.`
      );
  }
  if (start)
    for (const [id] of MG_LAYOUT_DESTINATIONS) {
      const section = index.get(`layout/${id}`);
      if (
        (!section && !partial) ||
        (section && section.parent !== figma.currentPage)
      )
        throw new Error(
          `Layout section ${id} is missing or moved; explicit migration required.`
        );
    }
  for (const [key, node] of index) {
    const groupMatch = /^layout\/group\/([^/]+)$/.exec(key);
    const advancedMatch = /^layout\/family\/([^/]+)\/advanced$/.exec(key);
    let allowed;
    let expectedParent;
    if (groupMatch) {
      const group = guidance.groups.get(groupMatch[1]);
      if (!group) throw new Error(`Unknown task group ${key}.`);
      allowed = new Set([
        `${key}/title`,
        ...group.familyIds
          .filter(id => families.get(id).status !== 'outside-core')
          .map(id => `layout/family/${id}/overview`),
        ...(compactFlow
          ? group.familyIds
              .filter(id => families.get(id).status !== 'outside-core')
              .map(id => `layout/entry/${id}`)
          : []),
      ]);
      expectedParent = 'layout/components';
    } else if (advancedMatch) {
      const parent = families.get(advancedMatch[1]);
      if (!parent || parent.kind !== 'primary')
        throw new Error(`Invalid advanced-parts board ${key}.`);
      allowed = new Set([
        `${key}/title`,
        `${key}/body`,
        ...[...families.values()]
          .filter(meta => meta.parentFamilyId === parent.id)
          .map(meta => `layout/family/${meta.id}/overview`),
      ]);
      expectedParent = `layout/family/${parent.id}/overview`;
    } else if (key === 'layout/pending/browse') {
      allowed = new Set([
        `${key}/title`,
        ...[...families.values()]
          .filter(
            meta => meta.kind === 'primary' && meta.status === 'outside-core'
          )
          .map(meta => `layout/family/${meta.id}/overview`),
      ]);
      expectedParent = 'layout/pending';
    }
    if (
      allowed &&
      (mgReadIdentity(node.parent, 'mgKitId') !== expectedParent ||
        node.children.some(
          child =>
            !allowed.has(mgReadIdentity(child, 'mgKitId')) ||
            index.get(mgReadIdentity(child, 'mgKitId')) !== child
        ))
    )
      throw new Error(
        `Manual or moved content in generated task board ${key}.`
      );
  }
  // Historical v1 containers retain any manual contents; no deletion or adoption.
  if (!legacy && version === MG_LAYOUT_VERSION && !partial) {
    for (const [key, node] of index)
      if (
        /^layout\/(compositions|pending)\/(main|review)$/.test(key) &&
        node.parent !== index.get('layout/pending')
      )
        throw new Error(`Historical staging container ${key} was moved.`);
  }
  if (compactFlow)
    for (const meta of families.values()) {
      if (meta.kind !== 'primary' || meta.status === 'outside-core') continue;
      const exemplar = index
        .get(`review/${meta.id}`)
        ?.findAll(node => node.type === 'INSTANCE')[0];
      if (!index.has(`family/${meta.id}`)) continue;
      if (!exemplar)
        throw new Error(
          `Representative ${meta.id} needs its installed usage review.`
        );
      const main = await exemplar.getMainComponentAsync();
      if (
        !main ||
        main.parent !== index.get(`family/${meta.id}`) ||
        index.get(mgReadIdentity(main, 'mgKitId')) !== main
      )
        throw new Error(
          `Representative ${meta.id} needs its exact canonical main.`
        );
    }
  return index;
}

function mgLayoutContainerParent(key) {
  const page = figma.currentPage;
  const start = page.findAll(
    node => mgReadIdentity(node, 'mgKitId') === 'layout/start'
  )[0];
  const destination =
    start && mgReadIdentity(start, 'mgLayoutVersion') === '2'
      ? 'layout/pending'
      : 'layout/components';
  const matches = page.findAll(
    node => mgReadIdentity(node, 'mgKitId') === destination
  );
  return ['main', 'review'].includes(key) && matches.length === 1
    ? matches[0]
    : page;
}

function mgLayoutReviewParent(key, fallback) {
  const match = /^review\/([^/]+)$/.exec(key);
  if (!match || !mgKitLayoutInstalled()) return fallback;
  const page = figma.currentPage;
  const start = page.findAll(
    node => mgReadIdentity(node, 'mgKitId') === 'layout/start'
  )[0];
  if (mgReadIdentity(start, 'mgLayoutVersion') === '2') {
    const existing = page.findAll(
      node => mgReadIdentity(node, 'mgKitId') === key
    );
    if (existing.length > 1) throw new Error(`Duplicate review ${key}.`);
    if (
      existing.length &&
      ['review', `layout/family/${match[1]}/overview`].includes(
        mgReadIdentity(existing[0].parent, 'mgKitId')
      )
    )
      return existing[0].parent;
    const overview = page.findAll(
      node =>
        mgReadIdentity(node, 'mgKitId') === `layout/family/${match[1]}/overview`
    );
    return overview.length === 1 ? overview[0] : fallback;
  }
  const area = mgLayoutDestination(match[1]);
  if (area === 'components') return fallback;
  const nodes = page.findAll(
    node => mgReadIdentity(node, 'mgKitId') === `layout/${area}/review`
  );
  if (nodes.length !== 1) throw new Error(`Missing ${area} review container.`);
  return nodes[0];
}

async function organizeMangroveKit(
  doc,
  brandId,
  { zoom = true, allowProbes = false, compact = false } = {}
) {
  // Complete read-only validation and font preparation precede migration writes.
  if (typeof createMangroveWelcome !== 'function')
    throw new Error(
      'Rebuild the desktop plugin with the Welcome module before organizing.'
    );
  const index = await mgLayoutPreflight(doc, {
    allowProbes,
    allowVersion1Migration: true,
    compact,
  });
  const compactFlow =
    compact ||
    mgReadIdentity(
      index.get('layout/start') || figma.currentPage,
      'mgLayoutFlowVersion'
    ) === '1';
  const guidance = mgLayoutGuidance(doc);
  if (doc.kitGuidance.scope?.brandId !== brandId)
    throw new Error('Layout guidance is bounded to its documented brand.');
  const maintenance = await readMangroveMaintenancePolicies(doc);
  if (maintenance.errors.length)
    throw new Error(
      `Maintenance ownership refused: ${maintenance.errors.join('; ')}`
    );
  const manualFamilyIds = new Set(
    maintenance.families
      .filter(family => family.setId && family.policy.owner === 'manual')
      .map(family => family.familyId)
  );
  const previousVersion = index.has('layout/start')
    ? mgReadIdentity(index.get('layout/start'), 'mgLayoutVersion')
    : '';
  const brand = doc.modes.find(mode => mode.id === brandId);
  const collection = (
    await figma.variables.getLocalVariableCollectionsAsync()
  ).find(item => item.name === doc.collection);
  const mode = collection?.modes.find(item => item.name === brand?.name);
  if (!brand || !mode)
    throw new Error('Import the selected brand before organizing the kit.');
  for (const key of ['main', 'review']) {
    const root = index.get(key);
    const existingMode =
      root.explicitVariableModes[collection.id] ||
      root.resolvedVariableModes?.[collection.id] ||
      collection.defaultModeId;
    if (existingMode !== mode.modeId)
      throw new Error(
        'Organisation is presentation-only; use the existing kit brand. Re-theme separately.'
      );
  }
  const fontSpec = doc.styles.text.find(
    spec => spec.id === 'text.text.300.regular'
  );
  const font = fontSpec?.values[brandId]?.fontName;
  if (!font)
    throw new Error('Source body font is missing from the complete document.');
  await figma.loadFontAsync(font);
  const typographyIds = [
    'text.text.300.regular',
    'text.text.button.regular',
    'text.text.form-input.regular',
    'text.heading.400.regular',
    'text.heading.600.regular',
  ];
  const styles = await figma.getLocalTextStylesAsync();
  for (const style of styles)
    if (typographyIds.includes(mgReadIdentity(style, 'mgStyleId')))
      await figma.loadFontAsync(style.fontName);
  for (const [key, node] of index)
    if (key.startsWith('layout/') && node.type === 'TEXT')
      for (const run of node.getStyledTextSegments(['fontName']))
        await figma.loadFontAsync(run.fontName);
  await mgLayoutLoadExistingFonts();
  if (typeof createMangroveWelcome === 'function')
    await createMangroveWelcome(doc, brandId, {
      validateOnly: true,
      zoom: false,
    });
  const variables = new Map(
    (await figma.variables.getLocalVariablesAsync())
      .filter(item => item.variableCollectionId === collection.id)
      .map(item => [item.name, item])
  );
  for (const name of ['color/text', 'color/neutral-0', 'color/interactive'])
    if (variables.get(name)?.resolvedType !== 'COLOR')
      throw new Error(`Missing typed foundation ${name}.`);
  for (const [name, variable] of variables) {
    if (
      [
        'color/text',
        'color/interactive',
        'color/neutral-0',
        'color/neutral-25',
        'color/neutral-100',
        'color/neutral-400',
        'color/neutral-900',
      ].includes(name)
    ) {
      const value = variable.resolveForConsumer(index.get('main')).value;
      if (
        variable.resolvedType !== 'COLOR' ||
        !value ||
        ['r', 'g', 'b'].some(
          channel =>
            !Number.isFinite(value[channel]) ||
            value[channel] < 0 ||
            value[channel] > 1
        ) ||
        (value.a !== undefined &&
          (!Number.isFinite(value.a) || value.a < 0 || value.a > 1))
      )
        throw new Error(`Foundation ${name} needs a resolved source colour.`);
    }
    if (
      [
        'spacing/50',
        'spacing/100',
        'spacing/150',
        'spacing/200',
        'spacing/300',
        'spacing/400',
      ].includes(name)
    ) {
      const value = variable.resolveForConsumer(index.get('main')).value;
      if (
        variable.resolvedType !== 'FLOAT' ||
        !Number.isFinite(value) ||
        value <= 0
      )
        throw new Error(
          `Spacing specimen ${name} needs a positive source value.`
        );
    }
  }
  const created = new Set();
  const updated = new Set();
  const migrated =
    !index.has('layout/start') ||
    previousVersion !== MG_LAYOUT_VERSION ||
    mgReadIdentity(index.get('layout/start'), 'mgLayoutPhase') === 'migrating';
  const page = figma.currentPage;
  const anchor = !index.has('layout/start')
    ? Math.max(0, ...page.children.map(node => node.x + node.width)) + 240
    : index.get('layout/start').x;
  const mark = (node, key, fresh) => {
    mgWriteIdentity(node, 'mgKitId', key);
    index.set(key, node);
    (fresh ? created : updated).add(node.id);
  };
  const solid = name => {
    const variable = variables.get(name);
    // Main's existing mode was validated above. Seed new presentation paints
    // from that brand so repeated aliases cannot retain a black placeholder.
    const value = variable.resolveForConsumer(index.get('main')).value;
    return figma.variables.setBoundVariableForPaint(
      {
        type: 'SOLID',
        color: { r: value.r, g: value.g, b: value.b },
        opacity: value.a ?? 1,
      },
      'color',
      variable
    );
  };
  function ensure(key, type, parent, name) {
    let node = index.get(key);
    const fresh = !node;
    if (!node)
      node =
        figma[
          `create${type === 'SECTION' ? 'Section' : type === 'TEXT' ? 'Text' : type === 'RECTANGLE' ? 'Rectangle' : 'Frame'}`
        ]();
    mark(node, key, fresh);
    if (node.parent !== parent) parent.appendChild(node);
    node.name = name;
    return node;
  }
  function frame(key, parent, name, width = 900) {
    const node = ensure(key, 'FRAME', parent, name);
    node.layoutMode = 'VERTICAL';
    node.resizeWithoutConstraints(width, Math.max(40, node.height));
    node.primaryAxisSizingMode = 'AUTO';
    node.counterAxisSizingMode = 'FIXED';
    node.paddingTop =
      node.paddingBottom =
      node.paddingLeft =
      node.paddingRight =
        24;
    node.itemSpacing = 24;
    node.clipsContent = false;
    node.fills = [solid('color/neutral-0')];
    node.setExplicitVariableModeForCollection(collection, mode.modeId);
    return node;
  }
  async function text(key, parent, content, size = 16, width = 850) {
    let node = index.get(key);
    if (node) {
      const faces = node.getStyledTextSegments(['fontName']);
      for (const face of faces) await figma.loadFontAsync(face.fontName);
    }
    node = ensure(key, 'TEXT', parent, content.split('\n')[0]);
    node.fontName = font;
    node.fontSize = size;
    node.lineHeight = { unit: 'PIXELS', value: size * 1.5 };
    node.characters = content;
    node.textAutoResize = 'HEIGHT';
    node.resize(width, Math.max(1, node.height));
    if (parent.type === 'FRAME' && parent.layoutMode !== 'NONE') {
      node.layoutSizingHorizontal = 'FIXED';
      node.layoutSizingVertical = 'HUG';
    }
    node.fills = [solid('color/text')];
    return node;
  }
  const sections = new Map();
  try {
    for (const [id, title] of MG_LAYOUT_DESTINATIONS) {
      const section = ensure(`layout/${id}`, 'SECTION', page, title);
      if (id === 'start') {
        section.x = anchor;
        section.y = 160;
        if (previousVersion === '1')
          mgWriteIdentity(section, 'mgLayoutFromVersion', '1');
        mgWriteIdentity(section, 'mgLayoutVersion', MG_LAYOUT_VERSION);
        mgWriteIdentity(section, 'mgLayoutPhase', 'migrating');
      }
      section.fills = [solid('color/neutral-0')];
      // Generated FRAME ancestors carry the existing brand mode independently
      // of the section's presentation and manual additions.
      sections.set(id, section);
    }
    if (compactFlow) {
      mgWriteIdentity(sections.get('start'), 'mgLayoutFlowVersion', '1');
      mgWriteIdentity(sections.get('start'), 'mgLayoutFlowPhase', 'migrating');
      sections.get('components').fills = [];
      const reference = ensure(
        'layout/reference',
        'SECTION',
        page,
        'Component reference catalogue'
      );
      reference.fills = [];
      sections.set('reference', reference);
    }
    // Store a public schema identifier, not workflow evidence or private file data.
    mgWriteIdentity(
      sections.get('start'),
      'mgLayoutVersion',
      MG_LAYOUT_VERSION
    );
    const welcome = await createMangroveWelcome(doc, brandId, {
      zoom: false,
      parent: sections.get('start'),
    });
    for (const id of welcome.createdNodeIds) created.add(id);
    for (const id of welcome.updatedNodeIds) updated.add(id);
    if (welcome.errors.length) throw new Error(welcome.errors.join('; '));
    const foundations = frame(
      'layout/foundations/intro',
      sections.get('foundations'),
      'Source-bound foundations'
    );
    await text(
      'layout/foundations/intro/title',
      foundations,
      'Foundations and design tokens',
      32
    );
    await text(
      'layout/foundations/intro/body',
      foundations,
      'Use Variables for the full token collection. These specimens use the same imported semantic roles. Aliases and CSS syntax remain in the variables. Typography shows loaded source styles; missing Condensed faces are not substituted.'
    );
    const palette = [
      'color/interactive',
      'color/text',
      'color/neutral-0',
      'color/neutral-25',
      'color/neutral-100',
      'color/neutral-400',
      'color/neutral-900',
    ];
    for (const name of palette) {
      if (!variables.has(name)) continue;
      const row = frame(
        `layout/foundations/colour/${name.replace(/\//g, '.')}`,
        foundations,
        name
      );
      const key = mgReadIdentity(row, 'mgKitId');
      await text(`${key}/label`, row, name);
      const swatch = ensure(
        `${key}/swatch`,
        'RECTANGLE',
        row,
        'Bound colour specimen'
      );
      swatch.resize(850, 48);
      swatch.fills = [solid(name)];
    }
    for (const name of [
      'spacing/50',
      'spacing/100',
      'spacing/150',
      'spacing/200',
      'spacing/300',
      'spacing/400',
    ]) {
      const variable = variables.get(name);
      if (!variable) continue;
      const key = `layout/foundations/spacing/${name.replace(/\//g, '.')}`;
      const row = frame(key, foundations, name);
      const value = variable.resolveForConsumer(row).value;
      if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0)
        throw new Error(
          `Spacing specimen ${name} needs a positive source value.`
        );
      await text(`${key}/label`, row, `${name}: ${value}px`);
      const bar = ensure(
        `${key}/bar`,
        'RECTANGLE',
        row,
        'Bound spacing specimen'
      );
      bar.resize(value, 8);
      bar.fills = [solid('color/interactive')];
      bar.setBoundVariable('width', variable);
    }
    for (const id of typographyIds) {
      const spec = doc.styles.text.find(item => item.id === id);
      const style = styles.find(
        item => mgReadIdentity(item, 'mgStyleId') === id
      );
      if (!spec || !style) continue;
      await figma.loadFontAsync(style.fontName);
      const row = frame(
        `layout/foundations/type/${id}`,
        foundations,
        spec.name
      );
      const key = mgReadIdentity(row, 'mgKitId');
      await text(`${key}/label`, row, spec.name);
      const sample = await text(
        `${key}/sample`,
        row,
        'Designing for resilient communities'
      );
      await sample.setTextStyleIdAsync(style.id);
    }
    const info = async (area, title, body) => {
      const node = frame(`layout/${area}/intro`, sections.get(area), title);
      await text(`layout/${area}/intro/title`, node, title, 32);
      await text(`layout/${area}/intro/body`, node, body);
      node.x = node.y = 32;
      return node;
    };
    const componentsIntro = await info(
      'components',
      'Find a component by task',
      compactFlow
        ? 'Choose a task group, select a component introduction in Layers and press Shift+2. Each entry shows its purpose and a linked instance. For states and limits, expand Component reference catalogue > matching group > family in Layers and press Shift+2. No plugin is needed; maintainers can also use Browse component. Bounded draft use applies only to documented brand, content and sizing contracts.'
        : 'Browse complete controls and content. Each family pairs its usage and states with source components. Advanced parts belong to their complete component. Bounded draft use applies only to the documented brand, content and sizing contracts.'
    );
    const examplesIntro = await info(
      'compositions',
      'Examples and templates',
      'Accepted page templates are not available yet. ' +
        (compactFlow
          ? 'Representative component entries live in Components; full usage examples live in the Component reference catalogue. '
          : 'Component usage examples live beside their families in Components. ') +
        'Published desktop/mobile pilot: https://www.figma.com/design/wOTLILmiXUI3uzG2BdPUxB?node-id=7-16\nThe pilot uses declared presets, not accepted responsive templates or interactions. The planned catalogue below records remaining source coverage. Entries are documentation, not usable Assets. Select a row in Layers and press Shift+2 to read it.'
    );
    let catalogue;
    if (doc.plannedInventory) {
      catalogue = frame(
        'layout/compositions/catalogue',
        sections.get('compositions'),
        'Planned catalogue / documentation only',
        2800
      );
      const title = await text(
        'layout/compositions/catalogue/title',
        catalogue,
        'Not yet implemented and source examples still to verify',
        28,
        2736
      );
      const body = await text(
        'layout/compositions/catalogue/body',
        catalogue,
        `${doc.plannedInventory.entries.length} source catalogue entries. A scaffold does not imply that every source example is implemented or accepted. These stubs never appear as components in Assets. See COMPONENT-INVENTORY.md and the generated plannedInventory for full source names and coverage.`,
        16,
        2736
      );
      const rows = [];
      for (const entry of doc.plannedInventory.entries) {
        const key = `layout/compositions/catalogue/entry/${entry.id}`;
        const row = frame(
          key,
          catalogue,
          `${entry.scaffoldFamilyIds.length ? 'Partial scaffold' : 'Not yet implemented'} / ${entry.label}`,
          880
        );
        await text(
          `${key}/title`,
          row,
          `${entry.label} · ${entry.scaffoldFamilyIds.length ? 'Scaffold exists; remaining scope' : 'Not yet implemented'}`,
          18,
          832
        );
        const examples = entry.remainingExamples || [];
        const preview = examples
          .slice(0, 6)
          .map(item => item.label)
          .join(', ');
        await text(
          `${key}/body`,
          row,
          `${entry.catalogueTitle}\n${entry.source}\n${entry.scaffoldFamilyIds.length ? `Related families: ${entry.scaffoldFamilyIds.join(', ')}.\n` : ''}Source examples still to map or verify: ${preview || 'Declared mappings need native verification'}${examples.length > 6 ? `; plus ${examples.length - 6} more in the source inventory` : ''}.\n${entry.pendingVariantScopes?.length ? `Planned scope: ${entry.pendingVariantScopes.join('; ')}.\n` : ''}Static source stories can also describe browser behaviour, not a distinct visual variant.`,
          14,
          832
        );
        rows.push(row);
      }
      mgLayoutBrowseFlow(catalogue, [title, body], rows, 3);
      catalogue.x = 32;
      catalogue.y = examplesIntro.y + examplesIntro.height + 48;
      mgLayoutLayerOrder(sections.get('compositions'), [
        examplesIntro,
        catalogue,
      ]);
    }
    await info(
      'patterns',
      'Your workspace',
      'For local/Free experiments, draw My design beside this guide (F). Drag this file’s Mangrove/Button from Assets into it and edit Label. Card/Hero are local unpublished drafts. For paid library use, create your design in a separate file and enable Mangrove kit in Assets > Libraries. Keep personal frames and notes outside generated boards; ordinary importer updates preserve these areas. Review published updates in consuming files.'
    );
    const maintenanceIntro = await info(
      'pending',
      'Maintenance and outside-core assets',
      'Card and Hero are new draft components with their own limits. Tabs, Tab trigger and Editorial CTA remain outside core scope. Read each family’s exact limitations before use. Historical diagnostics and operational staging are construction assets. Source imports and component rebuilds preserve identities; removals and renames require an explicit migration.'
    );
    const staging = [];
    for (const key of [
      'main',
      'review',
      'layout/compositions/main',
      'layout/compositions/review',
      'layout/pending/main',
      'layout/pending/review',
    ]) {
      const node = index.get(key);
      if (!node) continue;
      mark(node, key, false);
      if (node.parent !== sections.get('pending'))
        sections.get('pending').appendChild(node);
      node.name =
        key === 'main'
          ? 'Source staging / Main components'
          : key === 'review'
            ? 'Usage staging / Review'
            : `Historical staging / ${key}`;
      staging.push(node);
    }
    const groupBoards = new Map();
    const referenceBoards = new Map();
    const entryBoards = new Map();
    if (compactFlow) {
      await text(
        'layout/reference/title',
        sections.get('reference'),
        'Component reference catalogue',
        32
      );
      await text(
        'layout/reference/body',
        sections.get('reference'),
        'Full usage and states, canonical source components and advanced parts. Start with the compact entries in 02 Components. Select one family in Layers and use Zoom to selection to read it. These boards belong to the kit maintainer.',
        16,
        720
      );
    }
    for (const group of guidance.groups.values()) {
      const board = frame(
        `layout/group/${group.id}`,
        sections.get('components'),
        group.label
      );
      await text(`layout/group/${group.id}/title`, board, group.label, 28);
      groupBoards.set(group.id, board);
      if (compactFlow) {
        const reference = frame(
          `layout/reference/group/${group.id}`,
          sections.get('reference'),
          `${group.label} / Full reference`
        );
        await text(
          `layout/reference/group/${group.id}/title`,
          reference,
          `${group.label} / Full reference`,
          28
        );
        referenceBoards.set(group.id, reference);
      }
    }
    const pendingBrowse = frame(
      'layout/pending/browse',
      sections.get('pending'),
      'Families outside core scope'
    );
    await text(
      'layout/pending/browse/title',
      pendingBrowse,
      'Not in core scope',
      28
    );
    const familyBoards = new Map();
    const advancedBoards = new Map();
    const buildOverview = async (meta, owner) => {
      const family = guidance.registry.get(meta.id);
      const set = index.get(`family/${meta.id}`);
      if (!set) return null;
      if (manualFamilyIds.has(meta.id)) {
        // Keep the entire existing family presentation subtree. Resizing an
        // auto-layout source board could indirectly reposition a manual main.
        const overview = index.get(`layout/family/${meta.id}/overview`);
        if (overview.parent !== owner)
          throw new Error(`Manual family ${meta.id} cannot be reparented.`);
        familyBoards.set(meta.id, {
          overview,
          board: index.get(`layout/family/${meta.id}/main`),
          review: index.get(`review/${meta.id}`),
          title: index.get(`layout/family/${meta.id}/overview/title`),
          body: index.get(`layout/family/${meta.id}/overview/body`),
          manual: true,
        });
        return overview;
      }
      updated.add(set.id);
      for (const node of set.children) updated.add(node.id);
      mgLayoutGrid(set, family);
      const overview = ensure(
        `layout/family/${meta.id}/overview`,
        'FRAME',
        owner,
        meta.label
      );
      overview.layoutMode = 'NONE';
      overview.clipsContent = false;
      overview.fills = [solid('color/neutral-0')];
      overview.setExplicitVariableModeForCollection(collection, mode.modeId);
      const board = frame(
        `layout/family/${meta.id}/main`,
        overview,
        'Source components'
      );
      await text(
        `layout/family/${meta.id}/main/title`,
        board,
        'Source components',
        24,
        Math.max(850, Math.min(1400, set.width))
      );
      await text(
        `layout/family/${meta.id}/main/body`,
        board,
        `${meta.label} · ${set.children.length} source variants\n${typeof family.source === 'string' ? family.source : family.source?.file || ''}`
      );
      if (set.parent !== board) board.appendChild(set);
      const review = index.get(`review/${meta.id}`);
      if (review) {
        updated.add(review.id);
        if (review.parent !== overview) overview.appendChild(review);
        review.name = 'Usage and states';
      }
      const width = Math.max(
        900,
        board.width + (review ? review.width + 80 : 0) + 64
      );
      const title = await text(
        `layout/family/${meta.id}/overview/title`,
        overview,
        meta.label,
        28,
        Math.min(850, width - 64)
      );
      const body = await text(
        `layout/family/${meta.id}/overview/body`,
        overview,
        `${meta.status === 'bounded-draft' ? 'Bounded draft use' : meta.status === 'source-scaffold' ? 'Draft component, acceptance pending' : 'Not in core scope'}\n${meta.purpose}\n${meta.usage}\nSupported: ${meta.supported.join('; ')}\nLimits: ${meta.limitations.join('; ')}`,
        16,
        Math.min(720, width - 64)
      );
      title.x = title.y = 32;
      body.x = 32;
      body.y = title.y + title.height + 16;
      familyBoards.set(meta.id, { overview, board, review, title, body });
      return overview;
    };
    for (const group of guidance.groups.values())
      for (const id of group.familyIds) {
        const meta = guidance.families.get(id);
        const overview = await buildOverview(
          meta,
          meta.status === 'outside-core'
            ? pendingBrowse
            : compactFlow
              ? referenceBoards.get(group.id)
              : groupBoards.get(group.id)
        );
        if (!overview) continue;
        const supports = [...guidance.families.values()].filter(
          item => item.parentFamilyId === id && index.has(`family/${item.id}`)
        );
        if (supports.length) {
          const advanced = frame(
            `layout/family/${id}/advanced`,
            overview,
            'Advanced parts'
          );
          await text(
            `layout/family/${id}/advanced/title`,
            advanced,
            'Advanced parts',
            24
          );
          await text(
            `layout/family/${id}/advanced/body`,
            advanced,
            'Supporting source components and size alternatives. Start with the complete component above. These parts do not establish an arbitrary composition or slot contract.'
          );
          advancedBoards.set(id, advanced);
          for (const support of supports)
            await buildOverview(support, advanced);
        }
        if (compactFlow && meta.status !== 'outside-core') {
          const key = `layout/entry/${id}`;
          const entry = ensure(
            key,
            'FRAME',
            groupBoards.get(group.id),
            meta.label
          );
          entry.layoutMode = 'NONE';
          entry.clipsContent = false;
          entry.fills = [solid('color/neutral-0')];
          entry.setExplicitVariableModeForCollection(collection, mode.modeId);
          const heading = await text(
            `${key}/title`,
            entry,
            meta.label,
            28,
            720
          );
          const body = await text(
            `${key}/body`,
            entry,
            `${meta.status === 'source-scaffold' ? 'Draft component, acceptance pending' : 'Bounded draft use'}\n${meta.purpose}\n${meta.usage}`,
            16,
            720
          );
          const label = await text(
            `${key}/label`,
            entry,
            `Full reference: Component reference catalogue > ${group.label} / Full reference > ${meta.label}. Select that family in Layers and press Shift+2 for states and limits. Maintainers can also use Browse component in the plugin.`,
            14,
            720
          );
          heading.x = heading.y = 24;
          body.x = 24;
          body.y = heading.y + heading.height + 16;
          const review = index.get(`review/${id}`);
          const exemplar = review?.findAll(node => node.type === 'INSTANCE')[0];
          let instance = index.get(`${key}/instance`);
          if (!instance && exemplar) {
            // Create from the exact exemplar's main without inserting into its
            // review auto-layout; copy exposed overrides, never resize/detach.
            const main = await exemplar.getMainComponentAsync();
            instance = main.createInstance();
            instance.setProperties(
              Object.fromEntries(
                Object.entries(exemplar.componentProperties).map(
                  ([name, prop]) => [name, prop.value]
                )
              )
            );
            mark(instance, `${key}/instance`, true);
            for (const child of instance.findAll(() => true))
              created.add(child.id);
            entry.appendChild(instance);
          } else if (instance) {
            updated.add(instance.id);
          }
          let bottom = body.y + body.height + 24;
          let width = 900;
          if (instance) {
            // Match the existing demonstrated preset at the instance root.
            // createInstance inherits the main's width, which can differ from
            // the bounded review specimen (for example the 720px Table).
            instance.resize(exemplar.width, exemplar.height);
            const footprint = mgLayoutFootprint(instance);
            instance.name = `${meta.label} / Representative instance`;
            instance.x = 24 - footprint.left;
            instance.y = bottom - footprint.top;
            bottom += footprint.height + 24;
            width = Math.max(width, footprint.width + 48);
          }
          label.x = 24;
          label.y = bottom;
          entry.resizeWithoutConstraints(width, bottom + label.height + 24);
          mgLayoutLayerOrder(entry, [heading, body, instance, label]);
          entryBoards.set(id, entry);
        }
      }
    const diagnostics = index.get('diagnostics.focus-ring');
    if (diagnostics) {
      updated.add(diagnostics.id);
      if (diagnostics.parent !== sections.get('pending'))
        sections.get('pending').appendChild(diagnostics);
    }
    // Actual rendered extents account for focus/shadow overflow. Internal
    // component and consumer geometry is never resized by presentation fitting.
    const rightExtent = node => {
      const bounds = node.absoluteRenderBounds,
        box = node.absoluteBoundingBox;
      return (
        node.width +
        (bounds && box
          ? Math.max(0, bounds.x + bounds.width - box.x - node.width)
          : 0)
      );
    };
    function fitFlow(node, minWidth = 900) {
      const children = node.children.filter(child => child.visible !== false);
      node.resizeWithoutConstraints(
        Math.max(
          minWidth,
          ...children.map(
            child => rightExtent(child) + node.paddingLeft + node.paddingRight
          )
        ),
        Math.max(40, node.height)
      );
      node.primaryAxisSizingMode = 'AUTO';
      node.counterAxisSizingMode = 'FIXED';
    }
    for (const { board, review, manual } of familyBoards.values()) {
      if (manual) continue;
      fitFlow(board);
      if (review) {
        // Fit the generated presentation frame to its specimens. A desktop
        // example can be wider than the original 720px states grid. Keep
        // every instance and specimen row's existing sizing and content.
        const grid = index.get(`${mgReadIdentity(review, 'mgKitId')}/grid`);
        if (grid) {
          updated.add(grid.id);
          updated.add(review.id);
          const width = Math.max(
            720,
            ...grid.children
              .filter(child => child.visible !== false)
              .map(
                child =>
                  rightExtent(child) + grid.paddingLeft + grid.paddingRight
              )
          );
          grid.resizeWithoutConstraints(width, Math.max(40, grid.height));
          review.resizeWithoutConstraints(
            Math.max(
              736,
              rightExtent(grid) + review.paddingLeft + review.paddingRight
            ),
            Math.max(40, review.height)
          );
        }
      }
    }
    const bottomExtent = node => {
      const bounds = node.absoluteRenderBounds,
        box = node.absoluteBoundingBox;
      return (
        node.height +
        (bounds && box
          ? Math.max(0, bounds.y + bounds.height - box.y - node.height)
          : 0)
      );
    };
    const fitOverview = id => {
      const item = familyBoards.get(id);
      if (!item) return;
      if (item.manual) return;
      const { overview, board, review, title, body } = item;
      const advanced = advancedBoards.get(id);
      if (advanced) {
        const supports = [...guidance.families.values()]
          .filter(meta => meta.parentFamilyId === id)
          .map(meta => familyBoards.get(meta.id)?.overview)
          .filter(Boolean);
        mgLayoutBrowseFlow(
          advanced,
          [
            index.get(`layout/family/${id}/advanced/title`),
            index.get(`layout/family/${id}/advanced/body`),
          ],
          supports
        );
      }
      const boardX = review ? 32 + rightExtent(review) + 80 : 32;
      const width = Math.max(
        900,
        boardX + rightExtent(board) + 32,
        advanced ? 64 + rightExtent(advanced) : 0
      );
      title.resize(Math.min(850, width - 64), Math.max(1, title.height));
      body.resize(Math.min(720, width - 64), Math.max(1, body.height));
      body.y = title.y + title.height + 16;
      const y = body.y + body.height + 32;
      if (review) {
        review.x = 32;
        review.y = y;
      }
      board.x = boardX;
      board.y = y;
      let bottom = Math.max(
        board.y + bottomExtent(board),
        review ? review.y + bottomExtent(review) : 0
      );
      if (advanced) {
        advanced.x = 32;
        advanced.y = bottom + 48;
        bottom = advanced.y + bottomExtent(advanced);
      }
      overview.resizeWithoutConstraints(width, bottom + 32);
      mgLayoutLayerOrder(overview, [title, body, review, board, advanced]);
    };
    for (const meta of guidance.families.values())
      if (meta.kind === 'support') fitOverview(meta.id);
    for (const meta of guidance.families.values())
      if (meta.kind === 'primary') fitOverview(meta.id);
    for (const group of guidance.groups.values()) {
      const board = groupBoards.get(group.id);
      const items = group.familyIds
        .map(id =>
          compactFlow ? entryBoards.get(id) : familyBoards.get(id)?.overview
        )
        .filter(node => node?.parent === board);
      mgLayoutBrowseFlow(
        board,
        [index.get(`layout/group/${group.id}/title`)],
        items,
        group.id === 'forms-selection' ||
          (compactFlow && group.id !== 'actions')
          ? 2
          : 1
      );
      if (compactFlow) {
        const reference = referenceBoards.get(group.id);
        const items = group.familyIds
          .map(id => familyBoards.get(id)?.overview)
          .filter(node => node?.parent === reference);
        mgLayoutBrowseFlow(
          reference,
          [index.get(`layout/reference/group/${group.id}/title`)],
          items,
          group.id === 'forms-selection' ? 2 : 1
        );
      }
    }
    const pendingItems = [...guidance.families.values()]
      .filter(meta => meta.kind === 'primary' && meta.status === 'outside-core')
      .map(meta => familyBoards.get(meta.id)?.overview)
      .filter(Boolean);
    mgLayoutBrowseFlow(
      pendingBrowse,
      [index.get('layout/pending/browse/title')],
      pendingItems
    );
    const groups = [...groupBoards.values()];
    const leftWidth = Math.max(
      900,
      ...groups.filter((_, i) => i % 2 === 0).map(rightExtent)
    );
    let rowY = componentsIntro.y + componentsIntro.height + 48;
    for (let i = 0; i < groups.length; i += 2) {
      for (let j = 0; j < 2 && groups[i + j]; j++) {
        groups[i + j].x = j
          ? 32 + (compactFlow ? rightExtent(groups[i]) : leftWidth) + 80
          : 32;
        groups[i + j].y = rowY;
      }
      rowY += Math.max(...groups.slice(i, i + 2).map(node => node.height)) + 80;
    }
    if (compactFlow) {
      const reference = sections.get('reference');
      const title = index.get('layout/reference/title');
      const body = index.get('layout/reference/body');
      title.x = title.y = 32;
      body.x = 32;
      body.y = title.y + title.height + 16;
      const groups = [...referenceBoards.values()];
      let y = body.y + body.height + 48;
      for (let i = 0; i < groups.length; i += 2) {
        groups[i].x = 32;
        groups[i].y = y;
        if (groups[i + 1]) {
          groups[i + 1].x = 32 + rightExtent(groups[i]) + 80;
          groups[i + 1].y = y;
        }
        y += Math.max(...groups.slice(i, i + 2).map(bottomExtent)) + 80;
      }
      mgLayoutLayerOrder(reference, [title, body, ...groups]);
    }
    pendingBrowse.x = 32;
    pendingBrowse.y = maintenanceIntro.y + maintenanceIntro.height + 48;
    let maintenanceY = pendingBrowse.y + pendingBrowse.height + 80;
    for (const node of [...staging, ...(diagnostics ? [diagnostics] : [])]) {
      updated.add(node.id);
      node.x = 32;
      node.y = maintenanceY;
      maintenanceY += bottomExtent(node) + 80;
    }
    for (const [id, section] of sections) {
      if (id === 'foundations') foundations.x = foundations.y = 32;
      const bounds = section.children.filter(node => node.visible !== false);
      section.resizeWithoutConstraints(
        Math.max(1000, ...bounds.map(node => node.x + rightExtent(node) + 32)),
        Math.max(300, ...bounds.map(node => node.y + bottomExtent(node) + 32))
      );
    }
    // Reading order: introduction/foundations, components, examples/workspace,
    // maintenance last. Manual section children keep their exact local positions.
    const rows = [
      compactFlow
        ? ['start', 'foundations', 'patterns']
        : ['start', 'foundations'],
      ['components'],
      compactFlow ? ['compositions'] : ['compositions', 'patterns'],
      ['pending'],
    ];
    let y = 160;
    for (const row of rows) {
      let x = anchor;
      for (const id of row) {
        const section = sections.get(id);
        section.x = x;
        section.y = y;
        x += section.width + 160;
      }
      y += Math.max(...row.map(id => sections.get(id).height)) + 160;
    }
    if (compactFlow) {
      sections.get('reference').x =
        sections.get('components').x + sections.get('components').width + 240;
      sections.get('reference').y = sections.get('components').y;
    }
    mgLayoutLayerOrder(sections.get('components'), [
      componentsIntro,
      ...groups,
    ]);
    mgLayoutLayerOrder(sections.get('pending'), [
      maintenanceIntro,
      pendingBrowse,
      ...staging,
      diagnostics,
    ]);
    mgLayoutLayerOrder(page, [
      ...MG_LAYOUT_DESTINATIONS.map(([id]) => sections.get(id)),
      ...(compactFlow ? [sections.get('reference')] : []),
    ]);
    mgWriteIdentity(sections.get('start'), 'mgLayoutPhase', 'complete');
    if (compactFlow)
      mgWriteIdentity(sections.get('start'), 'mgLayoutFlowPhase', 'complete');
    if (zoom) figma.viewport.scrollAndZoomIntoView([sections.get('start')]);
    return {
      operation: 'kit-layout',
      version: MG_LAYOUT_VERSION,
      flowVersion: compactFlow ? '1' : null,
      migrated,
      previousVersion: previousVersion || null,
      phase: 'complete',
      createdNodeIds: [...created],
      updatedNodeIds: [...updated].filter(id => !created.has(id)),
      sections: [...sections].map(([id, node]) => ({
        id,
        nodeId: node.id,
        name: node.name,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
      })),
      preservedCanonicalIds: [...index]
        .filter(([key]) => /^family\//.test(key))
        .map(([, node]) => node.id),
      preservedManualFamilyIds: [...manualFamilyIds],
      errors: [],
    };
  } catch (error) {
    return {
      operation: 'kit-layout',
      version: MG_LAYOUT_VERSION,
      migrated,
      phase: 'migrating',
      previousVersion: previousVersion || null,
      createdNodeIds: [...created],
      updatedNodeIds: [...updated].filter(id => !created.has(id)),
      sections: [...sections].map(([id, node]) => ({ id, nodeId: node.id })),
      errors: [
        `Partial organisation retained for an explicit retry: ${error.message || String(error)}`,
      ],
    };
  }
}

function navigateMangroveKit(destination = 'start') {
  if (!MG_LAYOUT_DESTINATIONS.some(([id]) => id === destination))
    throw new Error('Unknown kit destination.');
  let nodes = figma.currentPage.findAll(
    node => mgReadIdentity(node, 'mgKitId') === `layout/${destination}`
  );
  if (!nodes.length && destination === 'start')
    nodes = figma.currentPage.findAll(
      node =>
        mgReadIdentity(node, 'mgKitId') === 'welcome' && node.type === 'FRAME'
    );
  if (
    nodes.length !== 1 ||
    nodes[0].parent !== figma.currentPage ||
    (nodes[0].type !== 'SECTION' &&
      !(
        destination === 'start' &&
        nodes[0].type === 'FRAME' &&
        mgReadIdentity(nodes[0], 'mgKitId') === 'welcome'
      ))
  )
    throw new Error(
      'Create the welcome board for Start here. Other destinations need Organize file.'
    );
  figma.viewport.scrollAndZoomIntoView(nodes);
  figma.currentPage.selection = nodes;
  return {
    operation: 'kit-navigation',
    destination,
    nodeId: nodes[0].id,
    errors: [],
  };
}
