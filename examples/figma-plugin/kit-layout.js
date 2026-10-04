/* global figma, mgReadIdentity, mgWriteIdentity */
/** Versioned presentation only. Canonical component anatomy remains source-owned. */
const MG_LAYOUT_VERSION = '1';
const MG_LAYOUT_DESTINATIONS = [
  ['start', '00 Start here'],
  ['foundations', '01 Foundations'],
  ['components', '02 Components'],
  ['compositions', '03 Compositions (organisms)'],
  ['patterns', '04 Page patterns'],
  ['pending', '90 Diagnostics and pending work'],
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

function mgLayoutGrid(set, family) {
  const nodes = set.children.filter(node => node.type === 'COMPONENT');
  if (!nodes.length) return;
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
              node.x = x;
              node.y = top;
              x += node.width + 48;
            }
            width = Math.max(width, x - 24);
            top += Math.max(...row.map(node => node.height)) + 48;
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
    widths[i % columns] = Math.max(widths[i % columns], node.width);
    heights[Math.floor(i / columns)] = Math.max(
      heights[Math.floor(i / columns)],
      node.height
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
    node.x = xs[i % columns];
    node.y = ys[Math.floor(i / columns)];
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
      if (key === 'main' || key === 'review' || key.startsWith('layout/')) {
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
  if (MG_LAYOUT_DESTINATIONS.some(([id]) => key === `layout/${id}`))
    return 'SECTION';
  if (!key.startsWith('layout/')) return null;
  if (/\/(title|body|label|sample)$/.test(key)) return 'TEXT';
  if (/\/(swatch|bar)$/.test(key)) return 'RECTANGLE';
  return 'FRAME';
}

async function mgLayoutPreflight(doc, { allowProbes = false } = {}) {
  if (doc?.components?.version !== 1 || !doc.components.families?.length)
    throw new Error(
      'Organisation needs the complete supported token document.'
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
    [...index.keys()].some(
      key =>
        key.startsWith('acceptance/') ||
        key.startsWith('capability/') ||
        key.startsWith('capabilities/')
    )
  )
    throw new Error(
      'Remove recorded temporary acceptance checks before reorganizing the kit.'
    );
  const start = index.get('layout/start');
  const partial =
    start && mgReadIdentity(start, 'mgLayoutPhase') === 'migrating';
  if (start && mgReadIdentity(start, 'mgLayoutVersion') !== MG_LAYOUT_VERSION)
    throw new Error(
      'Unsupported kit layout version; an explicit migration is required.'
    );
  for (const [key, node] of index) {
    const type = mgLayoutExpectedType(key);
    if (type && node.type !== type)
      throw new Error(`Layout ownership ${key} must be ${type}.`);
  }
  const registry = new Map(
    doc.components.families.map(family => [family.id, family])
  );
  if (registry.size !== doc.components.families.length)
    throw new Error('Duplicate source family identifiers.');
  for (const [key, node] of index) {
    const variant = /^family\/([^/]+)\/variant\/([^/]+)$/.exec(key);
    if (variant) {
      const family = registry.get(variant[1]);
      const set = index.get(`family/${variant[1]}`);
      if (!family || !set || node.type !== 'COMPONENT' || node.parent !== set)
        throw new Error(
          `Orphan or conflicting canonical variant ${key}; explicit migration required.`
        );
      if (!family.variants.some(item => item.id === variant[2]))
        throw new Error(`Retired variant ${key}; explicit migration required.`);
    }
    const match = /^family\/([^/]+)$/.exec(key);
    if (match) {
      if (!registry.has(match[1]))
        throw new Error(
          `Missing family ${match[1]}: use the complete document or supply a migration.`
        );
      if (node.type !== 'COMPONENT_SET')
        throw new Error(`Canonical ${key} must remain a component set.`);
      const expectedParent = start ? `layout/family/${match[1]}/main` : 'main';
      const staged =
        start &&
        (partial || !index.has(expectedParent)) &&
        mgReadIdentity(node.parent, 'mgKitId') === 'main';
      if (!staged && mgReadIdentity(node.parent, 'mgKitId') !== expectedParent)
        throw new Error(
          `Canonical ${key} has an unexpected parent; migration refused.`
        );
    }
    const reviewMatch = /^review\/([^/]+)$/.exec(key);
    if (reviewMatch) {
      if (!registry.has(reviewMatch[1]) || node.type !== 'FRAME')
        throw new Error(`Review ${key} needs its original family and frame.`);
      const area = mgLayoutDestination(reviewMatch[1]);
      const expectedParent =
        !start || area === 'components' ? 'review' : `layout/${area}/review`;
      if (
        !(partial && mgReadIdentity(node.parent, 'mgKitId') === 'review') &&
        mgReadIdentity(node.parent, 'mgKitId') !== expectedParent
      )
        throw new Error(
          `Review ${key} has an unexpected parent; migration refused.`
        );
    }
  }
  for (const key of ['main', 'review']) {
    const root = index.get(key);
    if (!root || root.type !== 'FRAME')
      throw new Error(`Organisation requires the existing ${key} frame.`);
    const expectedParent = start
      ? index.get('layout/components')
      : figma.currentPage;
    if (
      root.parent !== expectedParent &&
      !(partial && root.parent === figma.currentPage)
    )
      throw new Error(
        `The existing ${key} frame is outside its migration scope.`
      );
    const allowedChild = node => {
      const childKey = mgReadIdentity(node, 'mgKitId');
      if (index.get(childKey) !== node) return false;
      if (key === 'review')
        return (
          node.type === 'FRAME' &&
          /^review\/[^/]+$/.test(childKey) &&
          registry.has(childKey.slice(7))
        );
      if (!start || partial) {
        if (
          node.type === 'COMPONENT_SET' &&
          /^family\/[^/]+$/.test(childKey) &&
          registry.has(childKey.slice(7))
        )
          return true;
      }
      const match = /^layout\/family\/([^/]+)\/main$/.exec(childKey);
      return (
        node.type === 'FRAME' &&
        !!match &&
        registry.has(match[1]) &&
        mgLayoutDestination(match[1]) === 'components'
      );
    };
    if (root.children.some(node => !allowedChild(node)))
      throw new Error(
        `Manual content in ${key}: preserve it explicitly before migrating the generated container.`
      );
  }
  for (const [key, node] of index) {
    const match = /^layout\/family\/([^/]+)\/main$/.exec(key);
    if (!match) continue;
    const allowed = new Set([
      `${key}/title`,
      `${key}/body`,
      `family/${match[1]}`,
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
  }
  if (start) {
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
  }
  return index;
}

function mgLayoutContainerParent(key) {
  const matches = figma.currentPage.findAll(
    node => mgReadIdentity(node, 'mgKitId') === 'layout/components'
  );
  return ['main', 'review'].includes(key) && matches.length === 1
    ? matches[0]
    : figma.currentPage;
}

function mgLayoutReviewParent(key, fallback) {
  const match = /^review\/([^/]+)$/.exec(key);
  if (!match || !mgKitLayoutInstalled()) return fallback;
  const area = mgLayoutDestination(match[1]);
  if (area === 'components') return fallback;
  const nodes = figma.currentPage.findAll(
    node => mgReadIdentity(node, 'mgKitId') === `layout/${area}/review`
  );
  if (nodes.length !== 1) throw new Error(`Missing ${area} review container.`);
  return nodes[0];
}

async function organizeMangroveKit(
  doc,
  brandId,
  { zoom = true, allowProbes = false } = {}
) {
  // Complete read-only validation and font preparation precede migration writes.
  const index = await mgLayoutPreflight(doc, { allowProbes });
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
  const variables = new Map(
    (await figma.variables.getLocalVariablesAsync())
      .filter(item => item.variableCollectionId === collection.id)
      .map(item => [item.name, item])
  );
  for (const name of ['color/text', 'color/neutral-0', 'color/interactive'])
    if (!variables.has(name)) throw new Error(`Missing foundation ${name}.`);
  const created = new Set();
  const updated = new Set();
  const migrated =
    !index.has('layout/start') ||
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
  const solid = name =>
    figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0, g: 0, b: 0 } },
      'color',
      variables.get(name)
    );
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
    node.layoutSizingHorizontal = 'FIXED';
    node.layoutSizingVertical = 'HUG';
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
        mgWriteIdentity(section, 'mgLayoutVersion', MG_LAYOUT_VERSION);
        mgWriteIdentity(section, 'mgLayoutPhase', 'migrating');
      }
      section.fills = [solid('color/neutral-0')];
      // Generated FRAME ancestors carry the existing brand mode independently
      // of the section's presentation and manual additions.
      sections.set(id, section);
    }
    // Store a public schema identifier, not workflow evidence or private file data.
    mgWriteIdentity(
      sections.get('start'),
      'mgLayoutVersion',
      MG_LAYOUT_VERSION
    );
    const intro = frame(
      'layout/start/intro',
      sections.get('start'),
      'Welcome and visual index'
    );
    await text('layout/start/intro/title', intro, 'Mangrove design kit', 36);
    await text(
      'layout/start/intro/body',
      intro,
      `${brand.name} · Exploratory local core\n\n01 Foundations: colour roles, typography and spacing.\n02 Components: controls and reusable content, with their usage examples.\n03 Compositions: components assembled into Table, ComboBox, Text CTA, TOC and Segmented control.\n04 Page patterns: your page examples and the remaining catalogue.\n90 Diagnostics: unsupported assets and temporary checks.\n\nInsert components from Assets. Edit the exposed properties on instances. Main components are source-owned; usage examples remain editable. Ordinary updates retain existing identities and edited examples.`,
      18
    );
    await text(
      'layout/start/update/title',
      intro,
      'Keeping the kit up to date',
      24
    );
    await text(
      'layout/start/update/body',
      intro,
      'Load the current mangrove-variables.json, import the chosen brand without pruning, then build the affected families. The generated layout reconciles automatically after organisation.\n\nPut your notes and page compositions outside the generated main/review containers. Section-local placement of manual additions is preserved; section positions can move as generated content grows. Renames and removals require a reviewed migration.\n\nBounded acceptance is recorded in CORE-KIT-STATUS.md. Full catalogue coverage, fonts, other brands/RTL and Professional publishing remain separate work.'
    );
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
    const pattern = frame(
      'layout/patterns/intro',
      sections.get('patterns'),
      'Page patterns and designer workspace'
    );
    await text('layout/patterns/intro/title', pattern, 'Page patterns', 32);
    await text(
      'layout/patterns/intro/body',
      pattern,
      'Page-level examples are not yet accepted. Planned scopes include article/reading layout, landing page, search/results and forms.\n\nYou can place designer-owned linked instances and notes beside this generated introduction. They are preserved by the importer. Do not detach components to create an example.'
    );
    const areaRoots = new Map();
    for (const area of ['components', 'compositions', 'pending']) {
      const section = sections.get(area);
      const info = frame(
        `layout/${area}/intro`,
        section,
        'Purpose and acceptance'
      );
      await text(
        `layout/${area}/intro/title`,
        info,
        area === 'components'
          ? 'Reusable components'
          : area === 'compositions'
            ? 'Compositions (organisms)'
            : 'Diagnostics and pending work',
        32
      );
      await text(
        `layout/${area}/intro/body`,
        info,
        area === 'pending'
          ? 'Tabs and Editorial CTA remain outside core acceptance. Exact Condensed fonts and the CTA style repair are still open. Diagnostics are construction aids, not publishable components.'
          : 'Main components on the left are source-owned. Usage and state examples on the right are linked, editable instances. Use the exposed properties and documented sizing presets. Native examples are accepted only within their recorded contracts.'
      );
      const mainKey = area === 'components' ? 'main' : `layout/${area}/main`;
      const reviewKey =
        area === 'components' ? 'review' : `layout/${area}/review`;
      const main =
        area === 'components'
          ? index.get(mainKey)
          : frame(mainKey, section, 'Main components');
      const review =
        area === 'components'
          ? index.get(reviewKey)
          : frame(reviewKey, section, 'Usage and states');
      for (const [node, key, name] of [
        [main, mainKey, 'Main components'],
        [review, reviewKey, 'Usage and states'],
      ]) {
        if (node.parent !== section) section.appendChild(node);
        mark(node, key, false);
        node.name = name;
        node.layoutMode = 'VERTICAL';
        node.paddingTop =
          node.paddingBottom =
          node.paddingLeft =
          node.paddingRight =
            32;
        node.itemSpacing = 48;
        node.clipsContent = false;
        node.fills = [solid('color/neutral-0')];
        node.setExplicitVariableModeForCollection(collection, mode.modeId);
      }
      areaRoots.set(area, { main, review, info });
    }
    for (const family of doc.components.families) {
      const set = index.get(`family/${family.id}`);
      if (!set) continue;
      const area = areaRoots.get(mgLayoutDestination(family.id));
      updated.add(set.id);
      for (const node of set.children) updated.add(node.id);
      // Measure before sizing the heading, so the initial migration and later
      // reconciliation use the same presentation dimensions.
      mgLayoutGrid(set, family);
      const board = frame(
        `layout/family/${family.id}/main`,
        area.main,
        family.name
      );
      await text(
        `layout/family/${family.id}/main/title`,
        board,
        family.name,
        24,
        Math.max(850, Math.min(1400, set.width))
      );
      await text(
        `layout/family/${family.id}/main/body`,
        board,
        `${MG_LAYOUT_PENDING.has(family.id) ? 'Pending acceptance' : 'Source scaffold: see core status for accepted scope'} · ${set.children.length} variants\n${typeof family.source === 'string' ? family.source : family.source?.file || ''}`
      );
      if (set.parent !== board) board.appendChild(set);
      const review = index.get(`review/${family.id}`);
      if (review && review.parent !== area.review) {
        updated.add(review.id);
        area.review.appendChild(review);
      }
    }
    const diagnostics = index.get('diagnostics.focus-ring');
    if (diagnostics) {
      updated.add(diagnostics.id);
      if (diagnostics.parent !== sections.get('pending'))
        sections.get('pending').appendChild(diagnostics);
    }
    // Fit generated flows from actual local/rendered child extents without
    // resizing canonical components or instance descendants.
    function fitFlow(node, minWidth = 900) {
      const children = node.children.filter(child => child.visible !== false);
      const width = Math.max(
        minWidth,
        ...children.map(child => {
          const bounds = child.absoluteRenderBounds;
          const extra =
            bounds && child.absoluteBoundingBox
              ? Math.max(
                  0,
                  bounds.x +
                    bounds.width -
                    child.absoluteBoundingBox.x -
                    child.width
                )
              : 0;
          return child.width + extra + node.paddingLeft + node.paddingRight;
        })
      );
      node.resizeWithoutConstraints(width, Math.max(40, node.height));
      node.primaryAxisSizingMode = 'AUTO';
      node.counterAxisSizingMode = 'FIXED';
    }
    for (const [key, node] of index)
      if (/^layout\/family\/[^/]+\/main$/.test(key)) fitFlow(node);
    for (const { main, review } of areaRoots.values()) {
      fitFlow(main);
      fitFlow(review);
    }
    for (const [area, { main, review, info }] of areaRoots) {
      info.x = info.y = 32;
      main.x = 32;
      main.y = info.y + info.height + 48;
      review.x = main.x + main.width + 80;
      review.y = main.y;
      const section = sections.get(area);
      if (area === 'pending' && diagnostics) {
        diagnostics.x = 32;
        diagnostics.y =
          Math.max(main.y + main.height, review.y + review.height) + 80;
      }
      updated.add(section.id);
    }
    for (const [id, section] of sections) {
      if (!areaRoots.has(id)) {
        const first = section.children.find(
          child => mgReadIdentity(child, 'mgKitId') === `layout/${id}/intro`
        );
        if (first) first.x = first.y = 32;
      }
      const bounds = section.children.filter(node => node.visible !== false);
      section.resizeWithoutConstraints(
        Math.max(1000, ...bounds.map(node => node.x + node.width + 32)),
        Math.max(300, ...bounds.map(node => node.y + node.height + 32))
      );
    }
    let x = anchor;
    for (const [id] of MG_LAYOUT_DESTINATIONS) {
      const section = sections.get(id);
      section.x = x;
      section.y = 160;
      x += section.width + 160;
    }
    for (const [id] of [...MG_LAYOUT_DESTINATIONS].reverse())
      page.insertChild(page.children.length, sections.get(id));
    mgWriteIdentity(sections.get('start'), 'mgLayoutPhase', 'complete');
    if (zoom) figma.viewport.scrollAndZoomIntoView([sections.get('start')]);
    return {
      operation: 'kit-layout',
      version: MG_LAYOUT_VERSION,
      migrated,
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
      errors: [],
    };
  } catch (error) {
    return {
      operation: 'kit-layout',
      version: MG_LAYOUT_VERSION,
      migrated,
      phase: 'migrating',
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
  const nodes = figma.currentPage.findAll(
    node => mgReadIdentity(node, 'mgKitId') === `layout/${destination}`
  );
  if (nodes.length !== 1 || nodes[0].type !== 'SECTION')
    throw new Error('Organize the kit before using its navigation.');
  figma.viewport.scrollAndZoomIntoView(nodes);
  figma.currentPage.selection = nodes;
  return {
    operation: 'kit-navigation',
    destination,
    nodeId: nodes[0].id,
    errors: [],
  };
}
