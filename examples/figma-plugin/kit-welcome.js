/* global figma, mgReadIdentity, mgWriteIdentity, mgLayoutIndex, mgKitLayoutInstalled, MG_LAYOUT_DESTINATIONS */
// A plan-independent entry point. It does not install the section hierarchy.
function mgWelcomeBounds(node) {
  const b = node.absoluteRenderBounds;
  return {
    left: Math.min(node.x, b?.x ?? node.x),
    right: Math.max(node.x + node.width, b ? b.x + b.width : 0),
    top: Math.min(node.y, b?.y ?? node.y),
  };
}

async function mgWelcomeLegacySpacing(
  main,
  review,
  { validateOnly = false } = {}
) {
  const page = figma.currentPage;
  const roots = page.children.filter(node =>
    ['main', 'review', 'welcome'].includes(mgReadIdentity(node, 'mgKitId'))
  );
  if (main.parent !== page || review.parent !== page)
    return { updatedNodeIds: [] };
  const diagnostics = page.children.filter(
    node => mgReadIdentity(node, 'mgKitId') === 'diagnostics.focus-ring'
  );
  if (diagnostics.length > 1)
    throw new Error('Duplicate historical focus diagnostics.');
  const diagnostic = diagnostics[0];
  if (diagnostic && diagnostic.type !== 'FRAME')
    throw new Error(
      'Historical focus diagnostics must retain their original frame.'
    );
  const reorder = diagnostic && page.children[0] !== diagnostic;
  if (reorder) {
    const fonts = new Map();
    for (const node of diagnostic.findAll(node => node.type === 'TEXT'))
      for (const run of node.getStyledTextSegments(['fontName']))
        fonts.set(JSON.stringify(run.fontName), run.fontName);
    for (const font of fonts.values()) await figma.loadFontAsync(font);
  }
  if (validateOnly) return { updatedNodeIds: [] };
  const updatedNodeIds = [];
  const x = Math.max(...roots.map(node => mgWelcomeBounds(node).right)) + 160;
  const y = Math.min(...roots.map(node => mgWelcomeBounds(node).top));
  for (const node of diagnostics) {
    let changed = false;
    if (reorder) {
      // Index zero is the backmost child, shown last in the Layers panel.
      // Only the diagnostic moves; the other page roots keep their order.
      page.insertChild(0, node);
      changed = true;
    }
    if (node.x !== x || node.y !== y) {
      node.x = x;
      node.y = y;
      changed = true;
    }
    if (changed) updatedNodeIds.push(node.id);
  }
  return { updatedNodeIds, gap: 160 };
}

async function createMangroveWelcome(
  doc,
  brandId,
  { zoom = true, parent, validateOnly = false } = {}
) {
  const brand = doc?.modes?.find(item => item.id === brandId);
  const font = doc?.styles?.text?.find(
    item => item.id === 'text.text.300.regular'
  )?.values?.[brandId]?.fontName;
  if (!brand || !font)
    throw new Error(
      'Welcome needs the current source document and its body font.'
    );
  const index = await mgLayoutIndex();
  const page = figma.currentPage;
  const start = index.get('layout/start');
  if (
    start &&
    mgReadIdentity(start, 'mgLayoutPhase') !== 'complete' &&
    !parent &&
    !validateOnly
  )
    throw new Error(
      'Complete or recover the partial hierarchy before updating Welcome.'
    );
  const destination = parent || start || page;
  if (
    destination !== page &&
    (destination !== index.get('layout/start') ||
      destination.parent !== page ||
      destination.type !== 'SECTION' ||
      mgReadIdentity(destination, 'mgKitId') !== 'layout/start')
  )
    throw new Error(
      'Welcome must belong to this page or its Start here section.'
    );
  const schema = new Map([
    ['welcome', ['FRAME', null]],
    ['welcome/content', ['FRAME', 'welcome']],
    ['welcome/content/hero', ['FRAME', 'welcome/content']],
    ['welcome/content/hero/label', ['TEXT', 'welcome/content/hero']],
    ['welcome/content/hero/title', ['TEXT', 'welcome/content/hero']],
    ['welcome/content/hero/body', ['TEXT', 'welcome/content/hero']],
    ['welcome/content/index', ['FRAME', 'welcome/content']],
    ['welcome/content/index/title', ['TEXT', 'welcome/content/index']],
    ['welcome/content/index/body', ['TEXT', 'welcome/content/index']],
  ]);
  for (const row of ['use', 'maintain']) {
    schema.set(`welcome/content/${row}`, ['FRAME', 'welcome/content']);
    for (const card of [0, 1]) {
      const key = `welcome/content/${row}/${card}`;
      schema.set(key, ['FRAME', `welcome/content/${row}`]);
      schema.set(`${key}/title`, ['TEXT', key]);
      schema.set(`${key}/body`, ['TEXT', key]);
    }
  }
  const existing = index.get('welcome');
  if (index.has('layout/start/intro'))
    throw new Error(
      'The older generated introduction needs an explicit migration before Welcome.'
    );
  const historical = index.get('diagnostics.focus-ring');
  if (historical && historical.type !== 'FRAME')
    throw new Error(
      'Historical focus diagnostics must retain their original frame.'
    );
  for (const [key, node] of index) {
    if (key !== 'welcome' && !key.startsWith('welcome/')) continue;
    const expected = schema.get(key);
    if (!expected || node.type !== expected[0])
      throw new Error(`Conflicting Welcome ownership ${key}.`);
    if (key === 'welcome') {
      if (node.layoutMode !== 'NONE')
        throw new Error(
          'Welcome must retain its free-positioned manual-note boundary.'
        );
      if (node.parent !== page && node.parent !== start)
        throw new Error('Welcome has an unexpected parent.');
    } else if (node.parent !== index.get(expected[1]))
      throw new Error(`Conflicting Welcome parent ${key}.`);
    if (
      key !== 'welcome' &&
      node.children?.some(
        child => !schema.has(mgReadIdentity(child, 'mgKitId'))
      )
    )
      throw new Error(
        'Keep manual notes outside the generated Welcome content.'
      );
  }
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const collection = collections.find(item => item.name === 'Mangrove');
  const mode = collection?.modes.find(item => item.name === brand.name);
  if (!mode)
    throw new Error('Import the selected brand before creating Welcome.');
  for (const key of ['main', 'review', 'welcome']) {
    const node = index.get(key);
    if (!node) continue;
    const active =
      node.explicitVariableModes?.[collection.id] ||
      node.resolvedVariableModes?.[collection.id] ||
      collection.defaultModeId;
    if (active !== mode.modeId)
      throw new Error(
        'Welcome must use the existing kit brand; re-theme separately.'
      );
  }
  const variables = new Map(
    (await figma.variables.getLocalVariablesAsync())
      .filter(v => v.variableCollectionId === collection.id)
      .map(v => [v.name, v])
  );
  for (const name of [
    'color/text',
    'color/neutral-0',
    'color/neutral-25',
    'color/interactive',
  ])
    if (variables.get(name)?.resolvedType !== 'COLOR')
      throw new Error(`Missing colour role ${name}.`);
  // Complete the exact font preflight before creating or moving anything.
  const fonts = new Map([[JSON.stringify(font), font]]);
  for (const [key, node] of index)
    if (key.startsWith('welcome/') && node.type === 'TEXT')
      for (const run of node.getStyledTextSegments(['fontName']))
        fonts.set(JSON.stringify(run.fontName), run.fontName);
  if (existing && existing.parent !== destination)
    for (const node of existing.findAll(node => node.type === 'TEXT'))
      for (const run of node.getStyledTextSegments(['fontName']))
        fonts.set(JSON.stringify(run.fontName), run.fontName);
  for (const face of fonts.values()) await figma.loadFontAsync(face);
  if (destination === page && index.get('main') && index.get('review'))
    await mgWelcomeLegacySpacing(index.get('main'), index.get('review'), {
      validateOnly: true,
    });
  if (validateOnly) return { operation: 'kit-welcome-preflight', errors: [] };
  const created = new Set();
  const updated = new Set();
  const solid = (name, consumer) => {
    const variable = variables.get(name);
    const value = variable.resolveForConsumer(consumer).value;
    // Native repeated bindings can retain a replacement paint's literal value.
    // Seed it from the current resolved token while preserving the live alias.
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
  function ensure(key, owner) {
    let node = index.get(key);
    if (!node) {
      node =
        schema.get(key)[0] === 'TEXT'
          ? figma.createText()
          : figma.createFrame();
      if (node.type === 'TEXT') node.fontName = font;
      created.add(node.id);
      mgWriteIdentity(node, 'mgKitId', key);
      index.set(key, node);
    } else updated.add(node.id);
    if (node.parent !== owner) owner.appendChild(node);
    return node;
  }
  function frame(
    key,
    owner,
    width,
    { horizontal = false, padding = 32, fill = 'color/neutral-25' } = {}
  ) {
    const node = ensure(key, owner);
    node.name = key.split('/').pop();
    node.layoutMode = horizontal ? 'HORIZONTAL' : 'VERTICAL';
    node.resizeWithoutConstraints(width, Math.max(1, node.height));
    node.primaryAxisSizingMode = horizontal ? 'FIXED' : 'AUTO';
    node.counterAxisSizingMode = horizontal ? 'AUTO' : 'FIXED';
    node.paddingTop =
      node.paddingBottom =
      node.paddingLeft =
      node.paddingRight =
        padding;
    node.itemSpacing = horizontal ? 24 : 16;
    node.clipsContent = false;
    node.fills = fill ? [solid(fill, node)] : [];
    return node;
  }
  function text(key, owner, content, size, width, colour = 'color/text') {
    const node = ensure(key, owner);
    node.name = content.split('\n')[0];
    node.fontName = font;
    node.fontSize = size;
    node.lineHeight = { unit: 'PIXELS', value: size * 1.5 };
    node.characters = content;
    node.textAutoResize = 'HEIGHT';
    node.resize(width, Math.max(1, node.height));
    node.layoutSizingHorizontal = 'FIXED';
    node.layoutSizingVertical = 'HUG';
    node.fills = [solid(colour, node)];
  }
  try {
    const root = ensure('welcome', destination);
    root.name = '00 Start here / Mangrove';
    root.clipsContent = false;
    root.setExplicitVariableModeForCollection(collection, mode.modeId);
    root.fills = [solid('color/neutral-0', root)];
    if (destination === page && index.get('main') && index.get('review'))
      for (const id of (
        await mgWelcomeLegacySpacing(index.get('main'), index.get('review'))
      ).updatedNodeIds)
        updated.add(id);
    const content = frame('welcome/content', root, 1328, {
      padding: 0,
      fill: null,
    });
    content.x = content.y = 56;
    const hero = frame('welcome/content/hero', content, 1328, {
      padding: 40,
      fill: 'color/interactive',
    });
    text(
      'welcome/content/hero/label',
      hero,
      `${brand.name} · Exploratory core kit`,
      18,
      1248,
      'color/neutral-0'
    );
    text(
      'welcome/content/hero/title',
      hero,
      'Welcome to Mangrove',
      48,
      1248,
      'color/neutral-0'
    );
    text(
      'welcome/content/hero/body',
      hero,
      'A shared design language for resilient, accessible websites. Start with the foundations, then assemble a page from reusable components.',
      22,
      1248,
      'color/neutral-0'
    );
    const guide = frame('welcome/content/index', content, 1328);
    text(
      'welcome/content/index/title',
      guide,
      'Find your way around',
      28,
      1264
    );
    text(
      'welcome/content/index/body',
      guide,
      'On this page, use the matching names in Layers:\n' +
        (mgKitLayoutInstalled()
          ? MG_LAYOUT_DESTINATIONS.map(([id]) => index.get(`layout/${id}`))
          : figma.currentPage.children
              .slice()
              .reverse()
              .filter(node =>
                [
                  'welcome',
                  'main',
                  'review',
                  'diagnostics.focus-ring',
                ].includes(mgReadIdentity(node, 'mgKitId'))
              )
        )
          .filter(Boolean)
          .map(node => node.name)
          .join('\n') +
        '\n\nFor foundations, open Variables in the left sidebar or use local text and effect styles in the right sidebar.',
      18,
      1264
    );
    const cards = [
      [
        'use',
        'Make your first design',
        (start && mgReadIdentity(start, 'mgLayoutVersion') === '2'
          ? '1. Open Your workspace, press F and draw a frame beside the guide. '
          : '1. Press F and draw a frame outside the generated boards. ') +
          'Name it My design. 2. Open Assets, find Mangrove/Button under this file and drag it into My design. Clicking an asset inserts at the current view centre and can cover a guide. 3. Select your instance and edit Label in the right sidebar. Keep it linked.',
      ],
      [
        'use',
        'Understand the canvas',
        start && mgReadIdentity(start, 'mgLayoutVersion') === '2'
          ? 'Browse complete widgets in Components. Usage and states sit beside their Source components and advanced parts. Examples and templates records pending page-pattern coverage. Your workspace is for your designs; Maintenance is for kit upkeep.'
          : start
            ? 'This file still uses the earlier section layout. The maintainer must apply Organize file before grouped component browsing and Your workspace are available. Use the actual destinations above and keep My design outside generated boards.'
            : 'Use Browse component in the plugin to open an installed example. Review contains linked usage examples; Main components supplies their source assets. The contents above match this page. Foundations are in Variables and local styles. The grouped layout is still pending.',
      ],
      [
        'maintain',
        'What is ready, what is next',
        'The core set supports bounded draft use in UNDRR. Read each component description for supported presets, edits and limits. Card and Hero are new draft components with limited tested presets. Tabs and Editorial CTA remain outside core scope. Page templates, other brands and right-to-left layouts still need review. On Free, work in one brand at a time.',
      ],
      [
        'maintain',
        'Keep your own designs safe',
        'Keep My design and your notes outside generated boards, or in Your workspace when available. Update linked instances using supported properties. Generated examples belong to the kit maintainer and may be refreshed. Source, limits and maintenance: github.com/unisdr/undrr-mangrove · examples/figma-plugin/CORE-KIT-STATUS.md',
      ],
    ];
    for (const rowId of ['use', 'maintain']) {
      const row = frame(`welcome/content/${rowId}`, content, 1328, {
        horizontal: true,
        padding: 0,
        fill: null,
      });
      cards
        .filter(item => item[0] === rowId)
        .forEach(([, title, body], i) => {
          const key = `welcome/content/${rowId}/${i}`;
          const card = frame(key, row, 652);
          text(`${key}/title`, card, title, 24, 588);
          text(`${key}/body`, card, body, 18, 588);
        });
    }
    root.resizeWithoutConstraints(1440, content.y + content.height + 56);
    if (destination === page) {
      const others = page.children.filter(
        node =>
          node !== root &&
          mgReadIdentity(node, 'mgKitId') !== 'diagnostics.focus-ring'
      );
      root.x =
        Math.min(0, ...others.map(node => mgWelcomeBounds(node).left)) -
        root.width -
        160;
      root.y = index.get('main')?.y ?? 160;
      const main = index.get('main');
      const review = index.get('review');
      if (main && review)
        for (const id of (await mgWelcomeLegacySpacing(main, review))
          .updatedNodeIds)
          updated.add(id);
    } else root.x = root.y = 32;
    if (zoom) {
      figma.currentPage.selection = [root];
      figma.viewport.scrollAndZoomIntoView([root]);
    }
    return {
      operation: 'kit-welcome',
      rootId: root.id,
      createdNodeIds: [...created],
      updatedNodeIds: [...updated].filter(id => !created.has(id)),
      errors: [],
    };
  } catch (error) {
    return {
      operation: 'kit-welcome',
      phase: 'partial',
      createdNodeIds: [...created],
      updatedNodeIds: [...updated].filter(id => !created.has(id)),
      errors: [error.message || String(error)],
    };
  }
}
