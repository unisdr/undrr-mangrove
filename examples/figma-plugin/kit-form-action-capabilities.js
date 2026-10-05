/* global figma, mgReadIdentity, mgWriteIdentity */
// Four explicit source diagnostics. No canonical foundation or component writes.
async function mgFormActionJoiningPreflight(
  doc,
  brandId,
  collection,
  mode,
  report
) {
  const packet = doc?.capabilities?.formActionJoining;
  const fail = message => {
    throw new Error(`FormAction joining: ${message}`);
  };
  const equal = (a, b) =>
    typeof b === 'number'
      ? Number.isFinite(a) && Math.abs(a - b) <= 1e-6
      : b && typeof b === 'object'
        ? Object.keys(b).every(key => equal(a?.[key], b[key]))
        : a === b;
  const types = {
    fontFamily: 'STRING',
    inputFontSize: 'FLOAT',
    actionFontSize: 'FLOAT',
    bodyFontSize: 'FLOAT',
    helpFontSize: 'FLOAT',
    controlHeight: 'FLOAT',
    controlPadding: 'FLOAT',
    controlBorder: 'FLOAT',
    controlRadius: 'FLOAT',
    actionPaddingBlock: 'FLOAT',
    actionPaddingInline: 'FLOAT',
    actionBorder: 'FLOAT',
    actionRadius: 'FLOAT',
    gap: 'FLOAT',
    stackGap: 'FLOAT',
    outerMargin: 'FLOAT',
    selectPaddingEnd: 'FLOAT',
    focusOffset: 'FLOAT',
    focusWidth: 'FLOAT',
    focusColor: 'COLOR',
    separatorColor: 'COLOR',
    inputBackground: 'COLOR',
    inputFocusedBackground: 'COLOR',
    inputBorder: 'COLOR',
    inputFocusedBorder: 'COLOR',
    inputValue: 'COLOR',
    placeholder: 'COLOR',
    disabledText: 'COLOR',
    white: 'COLOR',
    actionBackground: 'COLOR',
    actionHoverBackground: 'COLOR',
    actionStroke: 'COLOR',
    actionText: 'COLOR',
    bodyText: 'COLOR',
    errorText: 'COLOR',
  };
  const names = {
    fontFamily: 'font-family/text',
    inputFontSize: 'font-size/form-input',
    actionFontSize: 'font-size/button',
    bodyFontSize: 'font-size/300',
    helpFontSize: 'font-size/200',
    controlHeight: 'form-input/block-size',
    controlPadding: 'form-input/padding',
    controlBorder: 'form-input/border-width',
    controlRadius: 'radius/form-input',
    actionPaddingBlock: 'padding/button/block',
    actionPaddingInline: 'padding/button/inline',
    actionBorder: 'border-width/button',
    actionRadius: 'radius/button',
    gap: 'spacing/25',
    stackGap: 'spacing/50',
    outerMargin: 'spacing/100',
    selectPaddingEnd: 'spacing/200',
    focusOffset: 'focus-ring/offset',
    focusWidth: 'focus-ring/width',
    focusColor: 'color/focus-ring',
    separatorColor: 'color/neutral-0',
    inputBackground: 'form-input/background',
    inputFocusedBackground: 'form-input/background--focus',
    inputBorder: 'form-input/border-color',
    inputFocusedBorder: 'color/form-focus',
    inputValue: 'component/text-input/browser-fieldtext',
    placeholder: 'color/neutral-500',
    disabledText: 'color/neutral-400',
    white: 'color/white',
    actionBackground: 'color/button-background',
    actionHoverBackground: 'color/button-background--hover',
    actionStroke: 'border-color/button-primary',
    actionText: 'color/button',
    bodyText: 'color/text',
    errorText: 'color/red-900',
  };
  const source = packet?.brands?.[brandId];
  if (packet?.version !== 1 || packet.kind !== 'form-action-joining' || !source)
    fail('missing or unsupported guarded source packet.');
  if (brandId !== 'undrr' || packet.cases?.sourceBrandId !== brandId)
    fail('measured fixtures currently require UNDRR.');
  if (
    collection?.name !== doc.collection ||
    !collection.modes?.some(
      m =>
        m.modeId === mode?.modeId &&
        m.name === doc.modes?.find(m => m.id === brandId)?.name
    )
  )
    fail('incompatible collection or selected mode.');
  const hashes = {
    'stories/Components/Forms/FormAction/FormAction.jsx':
      '3b8463c4b126b4408f88faed9ac44885df6f120835f61790fa375203fc4c7b60',
    'stories/Components/Forms/FormAction/FormAction.stories.jsx':
      'bbd0d4b15e61fbf09ce1a959aa2fd452c1e82d2d39d6ee592dfda0ebab4b26f0',
    'stories/Components/Forms/FormAction/form-action.scss':
      'af4ddbf45761581744646e85999efed0eea4fb8ed58309cb6d6e68076841f53f',
    'stories/Components/Forms/_form-base.scss':
      'de147bf1ffd565f11ab434fb85c853c0772fa30ad858761deadbb730da06e663',
    'stories/Components/Buttons/CtaButton/cta-button.scss':
      'be087e0b62d4b7558307307ba8f574c7d1298fb2228656e5bce3f0cabb6712bc',
  };
  for (const [file, hash] of Object.entries(hashes)) {
    const refs = packet.sourceRefs?.filter(
      ref => ref.file === file && ref.normalizedSha256
    );
    if (
      refs?.length !== 1 ||
      refs[0].normalizedSha256 !== hash ||
      !Number.isInteger(refs[0].line) ||
      refs[0].line < 1
    )
      fail(
        `source guard changed for ${file}. Rebuild and remeasure the packet.`
      );
  }
  if (
    Object.keys(packet.roles || {}).length !== 35 ||
    Object.keys(types).some(key => !packet.roles[key])
  )
    fail('exactly 35 typed source roles are required.');
  const definitions = doc.variables || [];
  const variables = await figma.variables.getLocalVariablesAsync();
  function value(item, native, type, seen = new Set()) {
    if (seen.has(item.id)) fail('role alias cycle.');
    seen.add(item.id);
    if (
      native &&
      (item.variableCollectionId !== collection.id ||
        item.resolvedType !== type)
    )
      fail('foreign or incompatible native alias.');
    const result = native
      ? item.valuesByMode?.[mode.modeId]
      : item.values?.[brandId];
    const alias = native ? result?.type === 'VARIABLE_ALIAS' : !!result?.alias;
    if (!alias) return result;
    const matches = (native ? variables : definitions).filter(target =>
      native ? target.id === result.id : target.name === result.alias
    );
    if (matches.length !== 1 || (!native && matches[0].type !== type))
      fail('missing or ambiguous role alias.');
    return value(matches[0], native, type, seen);
  }
  const roles = {};
  for (const [key, type] of Object.entries(types)) {
    const role = packet.roles[key];
    const matches = definitions.filter(
      item => item.id === role.id && item.name === role.name
    );
    const native = variables.filter(
      item => mgReadIdentity(item, 'mgId') === role.id
    );
    if (
      role.type !== type ||
      role.name !== names[key] ||
      matches.length !== 1 ||
      matches[0].type !== type ||
      definitions.filter(item => item.id === role.id).length !== 1 ||
      definitions.filter(item => item.name === role.name).length !== 1 ||
      native.length !== 1 ||
      native[0].name !== role.name ||
      variables.filter(
        item =>
          item.name === role.name && item.variableCollectionId === collection.id
      ).length !== 1
    )
      fail(`ambiguous or incompatible ${key}.`);
    const expected = value(matches[0], false, type);
    if (
      (type === 'FLOAT' && (!Number.isFinite(expected) || expected < 0)) ||
      (type === 'STRING' && (typeof expected !== 'string' || !expected)) ||
      (type === 'COLOR' &&
        !['r', 'g', 'b', 'a'].every(
          k =>
            Number.isFinite(expected?.[k]) &&
            expected[k] >= 0 &&
            expected[k] <= 1
        )) ||
      !equal(expected, source.resolvedRoles?.[key]) ||
      !equal(value(native[0], true, type), expected)
    )
      fail(`selected source/native ${key} values differ.`);
    roles[key] = { ...role, expected, variable: native[0] };
  }
  const g = source.geometry;
  const fixed = {
    actionMinHeight: 46,
    controlHeight: 46,
    rowMinHeight: 46,
    seam: -1,
    focusZIndex: 1,
    controlPadding: 6.25,
    actionPaddingBlock: 10,
    actionPaddingInline: 15,
    controlBorder: 1,
    actionBorder: 1,
    gap: 2.5,
    stackGap: 5,
    outerMargin: 10,
    focusOffset: 2,
    focusWidth: 2,
  };
  for (const [key, expected] of Object.entries(fixed))
    if (
      !equal(g?.[key], expected) ||
      (roles[key] && !equal(g[key], roles[key].expected))
    )
      fail(`source geometry ${key} changed.`);
  const cornerFields = [
    'topLeftRadius',
    'topRightRadius',
    'bottomLeftRadius',
    'bottomRightRadius',
  ];
  if (
    JSON.stringify(packet.cornersOrder) !== JSON.stringify(cornerFields) ||
    packet.seamDerivation?.value !== -1 ||
    packet.seamDerivation.independentOfBrandBorder !== true ||
    packet.stackViewport?.maxPx !== 480 ||
    packet.stackViewport.inclusive !== true ||
    packet.stackViewport.requiresStackOnMobile !== true ||
    packet.stackViewport.belowOrEqual !== 'Stacked' ||
    packet.stackViewport.above !== 'Joined'
  )
    fail('unsupported seam, corner order or viewport preset.');
  for (const [part, pattern, radius] of [
    ['control', [1, 0, 1, 0], roles.controlRadius.expected],
    ['action', [0, 1, 0, 1], roles.actionRadius.expected],
  ]) {
    if (
      !equal(
        g.corners?.[part],
        pattern.map(v => v * radius)
      ) ||
      !equal(
        g.focusOuterCorners?.[part],
        pattern.map(v => v * (radius + g.focusOffset))
      ) ||
      !equal(g.stackedCorners?.[part], [radius, radius, radius, radius])
    )
      fail(`source ${part} corners changed.`);
  }
  const byName = new Map(Object.values(roles).map(role => [role.name, role]));
  const paintStates = {
    inputDefault: ['inputBackground', 'inputBorder', 'inputValue'],
    inputFilled: ['inputFocusedBackground', 'inputBorder', 'inputValue'],
    inputFocus: ['inputFocusedBackground', 'inputFocusedBorder', 'inputValue'],
    inputModifierDisabled: ['white', 'disabledText', 'disabledText'],
    actionDefault: ['actionBackground', 'actionStroke', 'actionText'],
    actionHover: ['actionHoverBackground', 'actionStroke', 'actionText'],
    actionHtmlDisabled: ['actionBackground', 'actionStroke', 'actionText'],
  };
  for (const [state, keys] of Object.entries(paintStates))
    for (const [i, field] of ['fill', 'stroke', 'text'].entries())
      if (source.paints?.[state]?.[field] !== roles[keys[i]].name)
        fail(`source ${state} ${field} changed.`);
  if (
    source.paints.errorText?.text !== roles.errorText.name ||
    source.paints.errorText.inputStroke !== roles.inputBorder.name ||
    source.paints.placeholder !== roles.placeholder.name ||
    source.paints.label !== roles.bodyText.name ||
    source.paints.help !== roles.placeholder.name ||
    ['actionDefault', 'actionHover', 'actionHtmlDisabled'].some(
      state => source.paints[state].opacity !== 1
    )
  )
    fail('unsupported independent error/disabled semantics.');
  const styles = await figma.getLocalTextStylesAsync();
  const aliasIs = (alias, role) => {
    const list = Array.isArray(alias) ? alias : alias ? [alias] : [];
    return (
      list.length === 1 &&
      list[0]?.type === 'VARIABLE_ALIAS' &&
      list[0].id === roles[role].variable.id
    );
  };
  const fonts = {};
  for (const [kind, styleId, sizeRole, face, unit, height] of [
    ['input', 'component.input', 'inputFontSize', 'Regular', 'PERCENT', 115],
    ['action', 'component.button', 'actionFontSize', 'Bold', 'PERCENT', 100],
  ]) {
    const sourceStyles = doc.styles?.text?.filter(s => s.id === styleId) || [];
    const nativeStyles = styles.filter(
      s => mgReadIdentity(s, 'mgStyleId') === styleId
    );
    const typography = source.typography?.[kind];
    if (
      sourceStyles.length !== 1 ||
      nativeStyles.length !== 1 ||
      typography?.sourceFontStyleId !== styleId ||
      typography.fontName?.family !== roles.fontFamily.expected ||
      typography.fontName.style !== face ||
      typography.fontSize !== roles[sizeRole].expected ||
      !equal(typography.lineHeight, { unit, value: height })
    )
      fail(`source ${kind} font template changed.`);
    for (const style of [sourceStyles[0].values?.[brandId], nativeStyles[0]])
      if (
        style?.fontName?.family !== typography.fontName.family ||
        style.fontName.style !== face ||
        style.fontSize !== typography.fontSize ||
        style.lineHeight?.unit !== unit ||
        ![height, Math.fround(height / 100) * 100].some(
          value => Math.abs(style.lineHeight.value - value) <= 1e-6
        )
      )
        fail(`import one exact ${kind} font template first.`);
    if (
      !aliasIs(nativeStyles[0].boundVariables?.fontFamily, 'fontFamily') ||
      !aliasIs(nativeStyles[0].boundVariables?.fontSize, sizeRole)
    )
      fail(`native ${kind} font template aliases differ.`);
    fonts[kind] = JSON.parse(JSON.stringify(nativeStyles[0].fontName));
  }
  for (const [kind, sizeRole] of [
    ['label', 'bodyFontSize'],
    ['help', 'helpFontSize'],
    ['error', 'bodyFontSize'],
  ])
    if (
      source.typography?.[kind]?.fontName?.family !==
        roles.fontFamily.expected ||
      source.typography[kind].fontName.style !== 'Regular' ||
      source.typography[kind].fontSize !== roles[sizeRole].expected ||
      !equal(source.typography[kind].lineHeight, { unit: 'PIXELS', value: 24 })
    )
      fail(`source ${kind} typography changed.`);
  for (const name of ['Search', 'Subscribe', 'StackedOnMobile', 'Long']) {
    const label = packet.cases.labels?.[name];
    if (
      !label ||
      ['label', 'action'].some(
        key => typeof label[key] !== 'string' || !label[key]
      ) ||
      typeof (label.value || label.placeholder) !== 'string'
    )
      fail(`missing source labels ${name}.`);
  }
  for (const width of [240, 390, 480, 481])
    for (const name of [
      'Search',
      'Subscribe',
      'StackedOnMobile',
      'Invalid',
      'Long',
    ]) {
      const measurement = packet.cases.views?.[width]?.[name];
      if (
        !measurement ||
        [
          'fieldHeight',
          'rowHeight',
          'inputWidth',
          'inputHeight',
          'actionWidth',
          'actionHeight',
          'labelHeight',
          'helpHeight',
          'errorHeight',
          'actionX',
          'actionY',
          'rowY',
        ].some(
          key => !Number.isFinite(measurement[key]) || measurement[key] < 0
        )
      )
        fail(`malformed source measurement ${width}/${name}.`);
    }
  if (
    packet.cases.views[480].StackedOnMobile.rowHeight !== 97 ||
    packet.cases.views[481].StackedOnMobile.rowHeight !== 46
  )
    fail('source stacked viewport evidence changed.');
  for (const font of Object.values(fonts)) {
    report.fonts.requested.push(font);
    await figma.loadFontAsync(font);
    report.fonts.loaded.push(font);
  }
  report.preflight.formActionJoining = {
    version: 1,
    sourceRefs: packet.sourceRefs,
    sourceBrandId: brandId,
    fonts,
    typography: source.typography,
    roleIds: Object.fromEntries(
      Object.entries(roles).map(([key, role]) => [
        key,
        {
          id: role.variable.id,
          sourceId: role.id,
          name: role.name,
          type: role.type,
          expected: role.expected,
        },
      ])
    ),
    seam: { value: -1, bound: false, independentOfBrandBorder: true },
    minimumInlineSize: {
      css: 0,
      native: null,
      representation: 'Native minimum unset; not a zero-valued binding.',
    },
  };
  report.limitations = [
    ...(packet.limits || []),
    'Four isolated UNDRR fixtures with direct source typography and read-only font templates; shared style association remains untested.',
    'Two private-master reapplications are diagnostic mutations, not ordinary canonical component rebuilds.',
    'Focus rectangle positions and dimensions are authored only on private masters. Consumer rings use inherited STRETCH constraints; geometry discrepancies are reported without consumer resize or relative-transform repairs.',
    'Each fixture uses one private outer master with raw control/action frames. Separate nested control/action masters, exposed properties and their resize inheritance are not tested.',
    'Source viewport480/481 is an explicit preset, not an automatic native consumer-width breakpoint. Native nested row mode writes may be ignored; actual mode, axes and spacing are required by the geometry criterion.',
    'Hidden optional paragraph TEXT is excluded from paragraph geometry. Visible Label/Help/Error requires positive outer-consumer width with FILL/HUG/HEIGHT; zero-width native inheritance is a failed finding, not repaired.',
    'Font file metrics, focus occlusion, glyph rasterisation and all-brand/RTL behavior require native visual evidence.',
    'CSS min-inline-size:0 is represented by native minWidth:null on the control and value viewport. Figma rejects zero; null unsets its minimum. Actual finite-width/clipping behavior remains a native diagnostic gate.',
  ];
  return { packet, source, roles, byName, fonts, cornerFields, equal, aliasIs };
}

async function mgRunFormActionJoiningProbes(context, plan) {
  const {
    report,
    root,
    record,
    create,
    instance,
    test,
    bounds,
    collection,
    mode,
  } = context;
  const { packet, source, roles, byName, fonts, cornerFields, equal, aliasIs } =
    plan;
  const g = source.geometry;
  const copy = value => JSON.parse(JSON.stringify(value));
  const strokeAliasIs = (node, role) =>
    aliasIs(node.boundVariables?.strokeWeight, role) ||
    [
      'strokeTopWeight',
      'strokeRightWeight',
      'strokeBottomWeight',
      'strokeLeftWeight',
    ].every(field => aliasIs(node.boundVariables?.[field], role));
  function bodyBindings(node, kind, stacked) {
    const padding =
      kind === 'control'
        ? [
            ['paddingLeft', 'controlPadding'],
            ['paddingRight', 'controlPadding'],
            ['paddingTop', 'controlPadding'],
            ['paddingBottom', 'controlPadding'],
          ]
        : [
            ['paddingLeft', 'actionPaddingInline'],
            ['paddingRight', 'actionPaddingInline'],
            ['paddingTop', 'actionPaddingBlock'],
            ['paddingBottom', 'actionPaddingBlock'],
          ];
    return (
      strokeAliasIs(
        node,
        kind === 'control' ? 'controlBorder' : 'actionBorder'
      ) &&
      padding.every(([field, role]) =>
        aliasIs(node.boundVariables?.[field], role)
      ) &&
      (kind !== 'control' ||
        aliasIs(node.boundVariables?.height, 'controlHeight')) &&
      cornerFields.every((field, i) =>
        (stacked ? g.stackedCorners[kind] : g.corners[kind])[i] === 0
          ? near(node[field], 0)
          : aliasIs(
              node.boundVariables?.[field],
              kind === 'control' ? 'controlRadius' : 'actionRadius'
            )
      )
    );
  }
  function ringGeometry(node, kind, stacked) {
    return ['separator', 'focus'].every(name => {
      const ring = part(node, `${kind}/${name}`),
        offset = name === 'focus' ? g.focusOffset : 0;
      const values = stacked
        ? g.stackedCorners[kind].map(v => v + offset)
        : name === 'focus'
          ? g.focusOuterCorners[kind]
          : g.corners[kind];
      return (
        near(ring.x, -offset) &&
        near(ring.y, -offset) &&
        near(ring.width, node.width + 2 * offset) &&
        near(ring.height, node.height + 2 * offset) &&
        cornerFields.every((field, i) => near(ring[field], values[i]))
      );
    });
  }
  const near = (a, b) =>
    Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 0.02;
  const key = suffix => `capability/${report.runId}/form-action/${suffix}`;
  const own = (node, suffix) => {
    mgWriteIdentity(node, 'mgKitId', key(suffix));
    return node;
  };
  const bind = (node, field, role) =>
    node.setBoundVariable(field, roles[role].variable);
  const paint = name => {
    const role = byName.get(name);
    return figma.variables.setBoundVariableForPaint(
      {
        type: 'SOLID',
        color: { r: role.expected.r, g: role.expected.g, b: role.expected.b },
        opacity: role.expected.a,
      },
      'color',
      role.variable
    );
  };
  function textPaint(node, name) {
    node.fills = [paint(name)];
    if (node.characters.length)
      node.setRangeFills(0, node.characters.length, node.fills);
  }
  function frame(parent, name, fixture, layout = 'HORIZONTAL') {
    const node = own(create('createFrame', parent), `${fixture}/${name}`);
    node.name = name;
    node.layoutMode = layout;
    node.fills = [];
    node.clipsContent = false;
    node.layoutSizingHorizontal = 'HUG';
    node.layoutSizingVertical = 'HUG';
    return node;
  }
  function type(node, kind) {
    const typography = source.typography[kind];
    node.fontName = fonts[kind === 'action' ? 'action' : 'input'];
    node.fontSize = typography.fontSize;
    node.lineHeight = copy(typography.lineHeight);
    node.textDecoration = 'NONE';
    node.textWrapStyle = 'AUTO';
    bind(node, 'fontFamily', 'fontFamily');
    bind(
      node,
      'fontSize',
      kind === 'action'
        ? 'actionFontSize'
        : kind === 'input'
          ? 'inputFontSize'
          : kind === 'help'
            ? 'helpFontSize'
            : 'bodyFontSize'
    );
  }
  function text(parent, name, value, kind, fixture, master) {
    const node = own(record(figma.createText()), `${fixture}/${name}`);
    node.name = name;
    type(node, kind);
    node.characters = value;
    parent.appendChild(node);
    node.textAutoResize =
      kind === 'input' || kind === 'action' ? 'WIDTH_AND_HEIGHT' : 'HEIGHT';
    node.layoutSizingHorizontal =
      kind === 'input' || kind === 'action' ? 'HUG' : 'FILL';
    node.layoutSizingVertical = 'HUG';
    const property = master.addComponentProperty(name, 'TEXT', value);
    node.componentPropertyReferences = { characters: property };
    return { node, property, kind };
  }
  function corners(node, part, stacked, outer = false) {
    const values = stacked
      ? g.stackedCorners[part].map(v => v + (outer ? g.focusOffset : 0))
      : outer
        ? g.focusOuterCorners[part]
        : g.corners[part];
    cornerFields.forEach((field, i) => {
      node.setBoundVariable(field, null);
      node[field] = values[i];
      if (!outer && values[i])
        bind(
          node,
          field,
          part === 'control' ? 'controlRadius' : 'actionRadius'
        );
    });
  }
  function rings(parent, part, fixture) {
    return ['separator', 'focus'].map(name => {
      const ring = own(
        create('createRectangle', parent),
        `${fixture}/${part}/${name}`
      );
      ring.name = `${part}/${name}`;
      ring.layoutPositioning = 'ABSOLUTE';
      ring.fills = [];
      ring.strokeAlign = 'OUTSIDE';
      ring.strokeWeight = name === 'focus' ? g.focusWidth : g.focusOffset;
      bind(
        ring,
        'strokeWeight',
        name === 'focus' ? 'focusWidth' : 'focusOffset'
      );
      ring.strokes = [
        paint(roles[name === 'focus' ? 'focusColor' : 'separatorColor'].name),
      ];
      ring.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' };
      ring.visible = false;
      return ring;
    });
  }
  const walk = node => [node, ...(node.children || []).flatMap(walk)];
  const part = (node, name) => {
    const matches = walk(node).filter(n => n.name === name);
    if (matches.length !== 1)
      throw new Error(`Ambiguous diagnostic anatomy ${name}`);
    return matches[0];
  };
  function appearance(
    node,
    inputState = 'inputDefault',
    actionState = 'actionDefault',
    valueRole = roles.placeholder.name
  ) {
    for (const [name, state] of [
      ['Control', inputState],
      ['Action surface', actionState],
    ]) {
      const p = source.paints[state];
      const n = part(node, name);
      n.fills = [paint(p.fill)];
      n.strokes = [paint(p.stroke)];
      n.opacity = 1;
      textPaint(
        part(n, name === 'Control' ? 'Value' : 'Action'),
        name === 'Control' ? valueRole : p.text
      );
    }
  }
  function layout(node, width, stacked, focus = null) {
    node.resize(width, node.height);
    node.layoutSizingHorizontal = 'FIXED';
    node.layoutSizingVertical = 'HUG';
    node.clipsContent = false;
    const row = part(node, 'Control/action row');
    row.layoutMode = stacked ? 'VERTICAL' : 'HORIZONTAL';
    row.layoutSizingHorizontal = 'FILL';
    row.layoutSizingVertical = 'HUG';
    row.itemSpacing = stacked ? g.stackGap : g.seam;
    row.itemReverseZIndex = focus === 'control';
    const control = part(node, 'Control'),
      action = part(node, 'Action surface');
    control.resize(control.width, g.controlHeight);
    control.layoutSizingHorizontal = 'FILL';
    control.layoutSizingVertical = 'FIXED';
    bind(control, 'height', 'controlHeight');
    action.layoutSizingHorizontal = stacked ? 'FILL' : 'HUG';
    action.layoutSizingVertical = stacked ? 'HUG' : 'FILL';
    action.minHeight = g.actionMinHeight;
    for (const [name, parent] of [
      ['control', control],
      ['action', action],
    ]) {
      corners(parent, name, stacked);
      for (const ringName of ['separator', 'focus']) {
        const ring = part(parent, `${name}/${ringName}`);
        const offset = ringName === 'focus' ? g.focusOffset : 0;
        // Inherited relative transforms cannot be overridden on instances.
        if (node.type !== 'INSTANCE') {
          ring.resize(parent.width + 2 * offset, parent.height + 2 * offset);
          ring.x = -offset;
          ring.y = -offset;
        }
        corners(ring, name, stacked, ringName === 'focus');
        ring.visible = focus === name;
      }
    }
    return { stacked, focus, width };
  }
  function fixture(index, sourceName, width, stacked = false, error = '') {
    const data = packet.cases.labels[sourceName];
    const master = own(create('createComponent'), `${index}/source`);
    master.name = `Form Action diagnostic / ${index} / ${sourceName}`;
    master.x = 780;
    master.y = 40 + index * 340;
    master.layoutMode = 'VERTICAL';
    master.fills = [];
    master.clipsContent = false;
    master.itemSpacing = g.gap;
    bind(master, 'itemSpacing', 'gap');
    master.primaryAxisAlignItems = 'MIN';
    master.counterAxisAlignItems = 'MIN';
    master.layoutSizingHorizontal = 'FIXED';
    master.layoutSizingVertical = 'HUG';
    master.setExplicitVariableModeForCollection(collection, mode.modeId);
    const fields = {};
    fields.Label = text(master, 'Label', data.label, 'label', index, master);
    const row = frame(master, 'Control/action row', index);
    row.layoutSizingHorizontal = 'FILL';
    const control = frame(row, 'Control', index);
    control.counterAxisAlignItems = 'CENTER';
    control.strokesIncludedInLayout = true;
    control.strokeAlign = 'INSIDE';
    control.strokeWeight = g.controlBorder;
    bind(control, 'strokeWeight', 'controlBorder');
    control.minWidth = null;
    for (const field of [
      'paddingLeft',
      'paddingRight',
      'paddingTop',
      'paddingBottom',
    ]) {
      control[field] = g.controlPadding;
      bind(control, field, 'controlPadding');
    }
    bind(control, 'height', 'controlHeight');
    const viewport = frame(control, 'Value clipping viewport', index);
    viewport.layoutSizingHorizontal = 'FILL';
    viewport.layoutSizingVertical = 'HUG';
    viewport.minWidth = null;
    viewport.clipsContent = true;
    fields.Value = text(
      viewport,
      'Value',
      data.value || data.placeholder,
      'input',
      index,
      master
    );
    rings(control, 'control', index);
    const action = frame(row, 'Action surface', index);
    action.primaryAxisAlignItems = 'CENTER';
    action.counterAxisAlignItems = 'CENTER';
    action.strokesIncludedInLayout = true;
    action.strokeAlign = 'INSIDE';
    action.strokeWeight = g.actionBorder;
    bind(action, 'strokeWeight', 'actionBorder');
    for (const [field, role] of [
      ['paddingLeft', 'actionPaddingInline'],
      ['paddingRight', 'actionPaddingInline'],
      ['paddingTop', 'actionPaddingBlock'],
      ['paddingBottom', 'actionPaddingBlock'],
    ]) {
      action[field] = g[role];
      bind(action, field, role);
    }
    fields.Action = text(
      action,
      'Action',
      data.action,
      'action',
      index,
      master
    );
    rings(action, 'action', index);
    fields.Help = text(master, 'Help', data.help || '', 'help', index, master);
    fields.Error = text(master, 'Error', error, 'error', index, master);
    const visibility = {
      Label: !data.hideLabel,
      Help: !!data.help,
      Error: !!error,
    };
    for (const [name, visible] of Object.entries(visibility)) {
      fields[name].node.visible = visible;
      const boolean = master.addComponentProperty(
        `Show ${name.toLowerCase()}`,
        'BOOLEAN',
        visible
      );
      fields[name].visibilityProperty = boolean;
      fields[name].node.componentPropertyReferences = {
        characters: fields[name].property,
        visible: boolean,
      };
    }
    textPaint(fields.Label.node, source.paints.label);
    textPaint(fields.Help.node, source.paints.help);
    textPaint(fields.Error.node, source.paints.errorText.text);
    appearance(master);
    layout(master, width, stacked);
    const consumer = instance(master);
    own(consumer, `${index}/consumer/${consumer.id}`);
    consumer.name = `Form Action consumer / ${index} / ${sourceName}`;
    consumer.x = 40;
    consumer.y = 40 + index * 340;
    return {
      index,
      master,
      consumer,
      fields,
      sourceName,
      expected: Object.fromEntries(
        Object.entries(fields).map(([name, item]) => [
          name,
          item.node.characters,
        ])
      ),
      view: layout(consumer, width, stacked),
      inputState: 'inputDefault',
      actionState: 'actionDefault',
      valueRole: roles.placeholder.name,
    };
  }
  const resolvePaints = (paints, node) =>
    (Array.isArray(paints) ? paints : paints ? [{ mixed: true }] : []).map(
      p => {
        const alias = p.boundVariables?.color;
        const role = Object.values(roles).find(
          r => r.variable.id === alias?.id
        );
        return {
          paint: p,
          variableId: alias?.id || null,
          sourceRole: role?.name || null,
          resolved: role?.variable.resolveForConsumer(node)?.value ?? null,
        };
      }
    );
  function nodeRead(node) {
    return {
      ...bounds(node),
      mgKitId: mgReadIdentity(node, 'mgKitId'),
      parentId: node.parent?.id || null,
      visible: node.visible,
      opacity: node.opacity,
      clipsContent: node.clipsContent,
      layoutMode: node.layoutMode,
      horizontal: node.layoutSizingHorizontal,
      vertical: node.layoutSizingVertical,
      itemSpacing: node.itemSpacing,
      itemReverseZIndex: node.itemReverseZIndex,
      childIds: node.children?.map(n => n.id),
      corners: cornerFields.map(f => node[f] ?? null),
      padding: [
        node.paddingTop,
        node.paddingRight,
        node.paddingBottom,
        node.paddingLeft,
      ],
      strokeWeight: node.strokeWeight,
      strokeAlign: node.strokeAlign,
      strokesIncludedInLayout: node.strokesIncludedInLayout,
      constraints: node.constraints,
      minWidth: node.minWidth,
      minHeight: node.minHeight,
      boundVariables: node.boundVariables,
      fills: resolvePaints(node.fills, node),
      strokes: resolvePaints(node.strokes, node),
    };
  }
  function textRead(node, kind) {
    const wanted = source.typography[kind];
    const sizeRole =
      kind === 'input'
        ? 'inputFontSize'
        : kind === 'action'
          ? 'actionFontSize'
          : kind === 'help'
            ? 'helpFontSize'
            : 'bodyFontSize';
    return {
      ...nodeRead(node),
      characters: node.characters,
      fontName: node.fontName,
      fontSize: node.fontSize,
      lineHeight: node.lineHeight,
      textStyleId: node.textStyleId || '',
      textAutoResize: node.textAutoResize,
      textTruncation: node.textTruncation,
      textAlignHorizontal: node.textAlignHorizontal,
      propertyReferences: node.componentPropertyReferences,
      rangePaints: resolvePaints(
        node.characters.length
          ? node.getRangeFills(0, node.characters.length)
          : [],
        node
      ),
      sourceTypographyMatch:
        JSON.stringify(node.fontName) ===
          JSON.stringify(fonts[kind === 'action' ? 'action' : 'input']) &&
        equal(node.fontSize, wanted.fontSize) &&
        node.lineHeight?.unit === wanted.lineHeight.unit &&
        Math.abs(node.lineHeight.value - wanted.lineHeight.value) < 0.00002,
      typographyAliasesMatch:
        aliasIs(node.boundVariables?.fontFamily, 'fontFamily') &&
        aliasIs(node.boundVariables?.fontSize, sizeRole),
    };
  }
  async function capture(f, phase) {
    const node = await figma.getNodeByIdAsync(f.consumer.id);
    const actualMain = await node.getMainComponentAsync();
    const row = part(node, 'Control/action row');
    const control = part(node, 'Control');
    const action = part(node, 'Action surface');
    const fields = Object.fromEntries(
      Object.entries(f.fields).map(([name, item]) => {
        const text = part(node, name);
        return [
          name,
          {
            ...textRead(text, item.kind),
            propertyId: item.property,
            property: node.componentProperties[item.property],
            bindingMatches:
              text.componentPropertyReferences?.characters === item.property &&
              node.componentProperties[item.property]?.type === 'TEXT' &&
              node.componentProperties[item.property].value === text.characters,
            expectedCharacters: f.expected[name],
          },
        ];
      })
    );
    const rangesMatch = Object.entries(fields).every(([name, item]) => {
      const required =
        name === 'Value'
          ? f.valueRole
          : name === 'Action'
            ? source.paints[f.actionState].text
            : name === 'Label'
              ? source.paints.label
              : name === 'Help'
                ? source.paints.help
                : source.paints.errorText.text;
      const p = item.rangePaints;
      if (!item.characters.length) return true;
      return (
        p.length === 1 &&
        p[0].sourceRole === required &&
        equal(p[0].resolved, byName.get(required).expected) &&
        p[0].paint.visible !== false &&
        (p[0].paint.opacity ?? 1) === 1
      );
    });
    return {
      phase,
      sourceName: f.sourceName,
      sourceViewport: f.view.stacked ? 480 : 481,
      expectedView: f.view,
      ringGeometrySource:
        'Native inheritance of private-master geometry with STRETCH constraints; no consumer resize/x/y writes.',
      consumer: nodeRead(node),
      mainComponentId: actualMain?.id || null,
      expectedMainComponentId: f.master.id,
      propertyDefinitions: f.master.componentPropertyDefinitions,
      properties: node.componentProperties,
      row: nodeRead(row),
      control: nodeRead(control),
      viewport: nodeRead(part(control, 'Value clipping viewport')),
      action: nodeRead(action),
      rings: ['control', 'action'].flatMap(name =>
        ['separator', 'focus'].map(r => nodeRead(part(node, `${name}/${r}`)))
      ),
      fields,
      mainFields: Object.fromEntries(
        Object.entries(f.fields).map(([name, item]) => [
          name,
          textRead(item.node, item.kind),
        ])
      ),
      semanticOrderPreserved:
        row.children.length === 2 &&
        row.children[0].id === control.id &&
        row.children[1].id === action.id,
      sourceTypographyAndAliasesMatch: Object.values(fields).every(
        item => item.sourceTypographyMatch && item.typographyAliasesMatch
      ),
      effectiveTextPaintsMatch: rangesMatch,
      bodyRoleBindingsMatch:
        bodyBindings(control, 'control', f.view.stacked) &&
        bodyBindings(action, 'action', f.view.stacked),
      ringStrokeBindingsMatch: ['control', 'action'].every(kind =>
        ['separator', 'focus'].every(name => {
          const ring = part(node, `${kind}/${name}`);
          const color =
            roles[name === 'focus' ? 'focusColor' : 'separatorColor'];
          const p = resolvePaints(ring.strokes, ring);
          return (
            strokeAliasIs(
              ring,
              name === 'focus' ? 'focusWidth' : 'focusOffset'
            ) &&
            p.length === 1 &&
            p[0].variableId === color.variable.id &&
            equal(p[0].resolved, color.expected) &&
            (p[0].paint.opacity ?? 1) === 1 &&
            p[0].paint.visible !== false
          );
        })
      ),
      editedCharactersPreserved: Object.entries(fields).every(
        ([name, item]) => item.characters === f.expected[name]
      ),
      sourceGeometry: {
        paintOrderGetterMatches:
          row.itemReverseZIndex === (f.view.focus === 'control'),
        ringConstraintsMatch: ['control', 'action'].every(kind =>
          ['separator', 'focus'].every(name => {
            const ring = part(node, `${kind}/${name}`);
            return (
              ring.constraints?.horizontal === 'STRETCH' &&
              ring.constraints?.vertical === 'STRETCH' &&
              ring.strokeAlign === 'OUTSIDE' &&
              ring.visible === (f.view.focus === kind)
            );
          })
        ),
        joinedAllocation: f.view.stacked
          ? null
          : near(control.width + action.width + g.seam, row.width) &&
            near(action.x, control.width + g.seam),
        controlHeight: near(control.height, g.controlHeight),
        actionMinimumHeight: action.height >= g.actionMinHeight - 0.02,
        outerFocusUnclipped:
          node.clipsContent === false &&
          row.clipsContent === false &&
          control.clipsContent === false &&
          action.clipsContent === false,
        focusRectangleGeometryMatches:
          ringGeometry(control, 'control', f.view.stacked) &&
          ringGeometry(action, 'action', f.view.stacked),
        innerValueClipped:
          part(control, 'Value clipping viewport').clipsContent === true,
        // Hidden optional native TEXT can report FIXED/FIXED and takes no space.
        paragraphsHug: ['Label', 'Help', 'Error'].every(name => {
          const item = fields[name];
          return (
            item.visible === false ||
            (item.width > 0 &&
              near(item.width, node.width) &&
              item.horizontal === 'FILL' &&
              item.vertical === 'HUG' &&
              item.textAutoResize === 'HEIGHT')
          );
        }),
        rowModeAxesAndSpacingMatch:
          row.layoutMode === (f.view.stacked ? 'VERTICAL' : 'HORIZONTAL') &&
          row.layoutSizingHorizontal === 'FILL' &&
          row.layoutSizingVertical === 'HUG' &&
          row.itemSpacing === (f.view.stacked ? g.stackGap : g.seam) &&
          control.layoutSizingHorizontal === 'FILL' &&
          control.layoutSizingVertical === 'FIXED' &&
          action.layoutSizingHorizontal === (f.view.stacked ? 'FILL' : 'HUG') &&
          action.layoutSizingVertical === (f.view.stacked ? 'HUG' : 'FILL'),
        stackedGap: f.view.stacked ? near(row.itemSpacing, g.stackGap) : null,
      },
    };
  }
  async function observe(result, f, phase) {
    const value = await capture(f, phase);
    result.observations.push(value);
    return value;
  }
  function edit(f, values) {
    f.consumer.setProperties(
      Object.fromEntries(
        Object.entries(values).map(([name, value]) => [
          f.fields[name].property,
          value,
        ])
      )
    );
    Object.assign(f.expected, values);
  }
  function setView(
    f,
    width,
    stacked = f.view.stacked,
    focus = null,
    inputState = f.inputState,
    actionState = f.actionState,
    valueRole = f.valueRole
  ) {
    f.inputState = inputState;
    f.actionState = actionState;
    f.valueRole = valueRole;
    appearance(f.consumer, inputState, actionState, valueRole);
    f.view = layout(f.consumer, width, stacked, focus);
  }
  function reapply(f) {
    for (const [name, item] of Object.entries(f.fields)) {
      type(item.node, item.kind);
      textPaint(
        item.node,
        name === 'Value'
          ? roles.placeholder.name
          : name === 'Action'
            ? source.paints.actionDefault.text
            : name === 'Label'
              ? source.paints.label
              : name === 'Help'
                ? source.paints.help
                : source.paints.errorText.text
      );
    }
    appearance(f.master);
    layout(f.master, 390, f.sourceName === 'StackedOnMobile');
  }
  async function repeat(result, f) {
    const before = await observe(
      result,
      f,
      'edited before diagnostic reapplications'
    );
    for (let pass = 1; pass <= 2; pass++) {
      reapply(f);
      const after = await observe(
        result,
        f,
        `after private-master reapplication ${pass}`
      );
      const identity = item => ({
        id: item.consumer.id,
        main: item.mainComponentId,
        probe: item.consumer.mgKitId,
        fields: Object.fromEntries(
          Object.entries(item.fields).map(([name, n]) => [
            name,
            {
              id: n.id,
              sourceKey: n.mgKitId,
              property: n.propertyId,
              characters: n.characters,
              visible: n.visible,
              refs: n.propertyReferences,
            },
          ])
        ),
        properties: item.properties,
        width: item.consumer.width,
      });
      after.repeatIdentityAndEditsPreserved =
        JSON.stringify(identity(before)) === JSON.stringify(identity(after));
    }
  }
  function verdict(result) {
    result.findings = {
      allPhaseIdentityAndEdits:
        result.observations.every(
          o =>
            o.mainComponentId === o.expectedMainComponentId &&
            o.semanticOrderPreserved &&
            o.editedCharactersPreserved &&
            Object.values(o.fields).every(f => f.bindingMatches)
        ) &&
        result.observations
          .filter(o => o.phase.startsWith('after private'))
          .every(o => o.repeatIdentityAndEditsPreserved),
      allPhaseTypographyAliases: result.observations.every(
        o =>
          o.sourceTypographyAndAliasesMatch &&
          o.bodyRoleBindingsMatch &&
          o.ringStrokeBindingsMatch
      ),
      allPhaseEffectiveTextPaints: result.observations.every(
        o => o.effectiveTextPaintsMatch
      ),
      allPhaseGeometry: result.observations.every(o =>
        Object.values(o.sourceGeometry).every(v => v === null || v === true)
      ),
      visualFocusOcclusionVerified: false,
    };
    result.supported = false;
    result.supportedGeometryAndBindings = Object.values(result.findings)
      .slice(0, 4)
      .every(Boolean);
  }
  report.formActionJoining = {
    fixtureCount: 4,
    sharedStyleAssociationSatisfied: false,
    ordinaryCanonicalAcceptance: false,
    errorText: 'Enter a valid email address.',
    errorTextProvenance:
      'Supplied Invalid browser fixture, not an exported story default.',
    sourceCriteria: {
      views: packet.cases.views,
      widthAllocation: packet.cases.widthAllocation,
      stackViewport: packet.stackViewport,
      seamDerivation: packet.seamDerivation,
      typography: source.typography,
      paints: source.paints,
    },
  };
  await test('formActionSearch', async result => {
    const f = fixture(0, 'Search', 390);
    await observe(result, f, 'Search default390');
    setView(f, 390, false, null, 'inputDefault', 'actionHover');
    await observe(result, f, 'Action hover390');
    setView(f, 390, false, 'control', 'inputFocus', 'actionDefault');
    await observe(result, f, 'Control focus390');
    setView(f, 390, false, 'action', 'inputDefault', 'actionDefault');
    await observe(result, f, 'Action focus390');
    setView(f, 240, false);
    await observe(result, f, 'Search240');
    setView(f, 390, false);
    await observe(result, f, 'Search restored390');
    await repeat(result, f);
    verdict(result);
  });
  await test('formActionGrowth', async result => {
    const f = fixture(1, 'Subscribe', 390);
    await observe(result, f, 'Subscribe default390');
    const long = packet.cases.labels.Long;
    edit(f, {
      Label: long.label,
      Value: long.value,
      Action: long.action,
      Help: long.help,
    });
    setView(
      f,
      240,
      false,
      null,
      'inputFilled',
      'actionDefault',
      roles.inputValue.name
    );
    await observe(result, f, 'Long edits240');
    setView(f, 390, false, 'control', 'inputFocus');
    await observe(result, f, 'Long value control focus390');
    await repeat(result, f);
    verdict(result);
  });
  await test('formActionErrorDisabled', async result => {
    const f = fixture(
      2,
      'Subscribe',
      240,
      false,
      report.formActionJoining.errorText
    );
    await observe(result, f, 'Supplied error240 normal border');
    setView(f, 240, false, 'control', 'inputFocus');
    await observe(result, f, 'Supplied error control focus240');
    setView(f, 390, false, null, 'inputDefault', 'actionHtmlDisabled');
    await observe(result, f, 'HTML disabled action390 default paint');
    setView(
      f,
      240,
      false,
      null,
      'inputModifierDisabled',
      'actionHtmlDisabled',
      roles.disabledText.name
    );
    await observe(result, f, 'Explicit input disabled240');
    f.consumer.setProperties({
      [f.fields.Help.visibilityProperty]: false,
      [f.fields.Error.visibilityProperty]: false,
    });
    await observe(result, f, 'Independent help/error visibility overrides');
    await repeat(result, f);
    verdict(result);
  });
  await test('formActionStacked', async result => {
    const f = fixture(3, 'StackedOnMobile', 390, true);
    await observe(result, f, 'Viewport480 stacked390');
    setView(f, 240, true);
    await observe(result, f, 'Viewport480 stacked240');
    setView(f, 390, false);
    await observe(result, f, 'Viewport481 joined390');
    setView(f, 390, true);
    await observe(result, f, 'Viewport480 restored stacked390');
    const long = packet.cases.labels.Long;
    edit(f, {
      Label: long.label,
      Value: long.value,
      Help: long.help,
      Error: report.formActionJoining.errorText,
    });
    f.consumer.setProperties({
      [f.fields.Help.visibilityProperty]: true,
      [f.fields.Error.visibilityProperty]: true,
    });
    setView(
      f,
      240,
      true,
      'control',
      'inputFocus',
      'actionDefault',
      roles.inputValue.name
    );
    await observe(result, f, 'Stacked long editable paragraphs240');
    await repeat(result, f);
    verdict(result);
  });
  root.clipsContent = false;
}
