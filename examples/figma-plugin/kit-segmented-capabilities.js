/* global figma, mgReadIdentity */
// Isolated procedural diagnostics. No production foundation or component writes.
async function mgSegmentedJoiningPreflight(
  doc,
  brandId,
  collection,
  mode,
  report
) {
  const packet = doc?.capabilities?.segmentedJoining;
  const fail = message => {
    throw new Error(`Segmented joining: ${message}`);
  };
  if (packet?.version !== 1 || packet.kind !== 'segmented-joining')
    fail('unsupported or missing source packet.');
  if (brandId !== packet.cases?.sourceBrandId || brandId !== 'undrr')
    fail('measured joining diagnostics are currently UNDRR only.');
  const source = packet.brands?.[brandId];
  if (!source || !Array.isArray(packet.sourceRefs) || !packet.sourceRefs.length)
    fail('source provenance or brand values are missing.');
  for (const labels of [packet.labels?.default, packet.labels?.long])
    if (
      !Array.isArray(labels) ||
      labels.length !== 3 ||
      labels.some(value => typeof value !== 'string' || !value)
    )
      fail('three exact short and long source labels are required.');
  const types = {
    fontFamily: 'STRING',
    fontSize: 'FLOAT',
    legendFontSize: 'FLOAT',
    legendMediumFontSize: 'FLOAT',
    paddingBlock: 'FLOAT',
    paddingInline: 'FLOAT',
    border: 'FLOAT',
    radius: 'FLOAT',
    zero: 'FLOAT',
    focusOffset: 'FLOAT',
    focusWidth: 'FLOAT',
    focusColor: 'COLOR',
    separatorColor: 'COLOR',
    outline: 'COLOR',
    outlineHover: 'COLOR',
    background: 'COLOR',
    backgroundHover: 'COLOR',
    text: 'COLOR',
    disabledBorder: 'COLOR',
    disabledSelected: 'COLOR',
    legendColor: 'COLOR',
  };
  const definitions = doc.variables || [];
  const variables = await figma.variables.getLocalVariablesAsync();
  const equal = (actual, expected) => {
    if (typeof expected === 'number')
      return Number.isFinite(actual) && Math.abs(actual - expected) <= 1e-6;
    if (expected && typeof expected === 'object')
      return Object.keys(expected).every(key =>
        equal(actual?.[key], expected[key])
      );
    return actual === expected;
  };
  const sourceValue = (definition, seen = new Set()) => {
    if (seen.has(definition.id)) fail('source role alias cycle.');
    seen.add(definition.id);
    const value = definition.values?.[brandId];
    if (!value?.alias) return value;
    const targets = definitions.filter(item => item.name === value.alias);
    if (targets.length !== 1 || targets[0].type !== definition.type)
      fail('missing or incompatible source alias.');
    return sourceValue(targets[0], seen);
  };
  const nativeValue = (variable, type, seen = new Set()) => {
    if (seen.has(variable.id)) fail('native role alias cycle.');
    seen.add(variable.id);
    if (
      variable.variableCollectionId !== collection.id ||
      variable.resolvedType !== type
    )
      fail('foreign collection or incompatible native role.');
    const value = variable.valuesByMode?.[mode.modeId];
    if (value?.type !== 'VARIABLE_ALIAS') return value;
    const targets = variables.filter(item => item.id === value.id);
    if (targets.length !== 1) fail('missing or ambiguous native alias.');
    return nativeValue(targets[0], type, seen);
  };
  const roles = {};
  for (const [key, type] of Object.entries(types)) {
    const role = packet.roles?.[key];
    if (
      role?.type !== type ||
      typeof role.id !== 'string' ||
      typeof role.name !== 'string'
    )
      fail(`missing typed role ${key}.`);
    const sourceMatches = definitions.filter(
      item => item.id === role.id && item.name === role.name
    );
    const nativeMatches = variables.filter(
      item => mgReadIdentity(item, 'mgId') === role.id
    );
    if (
      sourceMatches.length !== 1 ||
      definitions.filter(item => item.id === role.id).length !== 1 ||
      definitions.filter(item => item.name === role.name).length !== 1 ||
      variables.filter(
        item =>
          item.name === role.name && item.variableCollectionId === collection.id
      ).length !== 1 ||
      sourceMatches[0].type !== type ||
      nativeMatches.length !== 1 ||
      nativeMatches[0].name !== role.name
    )
      fail(`ambiguous or incompatible identity ${key}.`);
    const expected = sourceValue(sourceMatches[0]);
    const actual = nativeValue(nativeMatches[0], type);
    if (
      !equal(actual, expected) ||
      (type === 'FLOAT' && !Number.isFinite(expected)) ||
      (type === 'STRING' && typeof expected !== 'string') ||
      (type === 'COLOR' &&
        !['r', 'g', 'b', 'a'].every(channel =>
          Number.isFinite(expected?.[channel])
        ))
    )
      fail(`native ${key} does not match the selected source mode.`);
    roles[key] = { ...role, variable: nativeMatches[0], expected };
  }
  const geometry = source.geometry;
  if (
    !geometry ||
    !Number.isFinite(geometry.minHeight) ||
    geometry.minHeight <= 0 ||
    geometry.seam !== -roles.border.expected ||
    geometry.counterGap !== 0
  )
    fail('incompatible source seam, height or wrap gap.');
  for (const key of [
    'paddingBlock',
    'paddingInline',
    'border',
    'radius',
    'focusOffset',
    'focusWidth',
  ])
    if (!equal(geometry[key], roles[key].expected) || geometry[key] < 0)
      fail(`geometry ${key} does not match its role.`);
  if (
    roles.zero.expected !== 0 ||
    packet.seamDerivation?.role !== roles.border.name ||
    packet.seamDerivation.scale !== -1
  )
    fail('source seam derivation is incompatible.');
  const cornerFields = [
    'topLeftRadius',
    'topRightRadius',
    'bottomLeftRadius',
    'bottomRightRadius',
  ];
  if (JSON.stringify(packet.cornersOrder) !== JSON.stringify(cornerFields))
    fail('unsupported corner order.');
  for (const [position, pattern] of Object.entries({
    First: [1, 0, 1, 0],
    Middle: [0, 0, 0, 0],
    Last: [0, 1, 0, 1],
  })) {
    for (const [field, amount] of [
      ['corners', geometry.radius],
      ['focusOuterCorners', geometry.radius + geometry.focusOffset],
    ])
      if (
        !Array.isArray(geometry[field]?.[position]) ||
        !geometry[field][position].every(
          (value, index) => value === pattern[index] * amount
        ) ||
        geometry[field][position].length !== 4
      )
        fail(`invalid ${position} ${field}.`);
  }
  const segment = source.typography?.segment;
  if (
    !segment ||
    segment.fontName?.family !== roles.fontFamily.expected ||
    segment.fontSize !== roles.fontSize.expected ||
    segment.fontName.style !== 'Bold' ||
    segment.lineHeight?.unit !== 'PERCENT' ||
    !equal(segment.lineHeight.value, 120) ||
    segment.requestedWeight !== 600 ||
    segment.bundledWeight !== 700
  )
    fail('unsupported source segment typography.');
  const sourceStyles = (doc.styles?.text || []).filter(
    style => style.id === segment.sourceFontStyleId
  );
  const nativeStyles = (await figma.getLocalTextStylesAsync()).filter(
    style => mgReadIdentity(style, 'mgStyleId') === segment.sourceFontStyleId
  );
  if (
    sourceStyles.length !== 1 ||
    sourceStyles[0].values?.[brandId]?.fontName?.family !==
      segment.fontName.family ||
    sourceStyles[0].values?.[brandId]?.fontName?.style !==
      segment.fontName.style ||
    sourceStyles[0].values?.[brandId]?.fontSize !== segment.fontSize ||
    nativeStyles.length !== 1 ||
    nativeStyles[0].fontName?.family !== segment.fontName.family ||
    nativeStyles[0].fontName.style !== segment.fontName.style ||
    nativeStyles[0].fontSize !== segment.fontSize
  )
    fail('import one exact segment font source style first.');
  const byName = new Map(Object.values(roles).map(role => [role.name, role]));
  for (const state of [
    'default',
    'selected',
    'hover',
    'selectedHover',
    'disabled',
    'selectedDisabled',
  ]) {
    const paint = source.paints?.[state];
    if (
      !paint ||
      (paint.fill !== null && byName.get(paint.fill)?.type !== 'COLOR') ||
      byName.get(paint.stroke)?.type !== 'COLOR' ||
      byName.get(paint.text)?.type !== 'COLOR'
    )
      fail(`unsupported source paints ${state}.`);
  }
  for (const caseName of ['short390', 'default240', 'fullWidth240'])
    if (
      !Number.isFinite(packet.cases?.[caseName]?.width) ||
      packet.cases[caseName].width <= 0
    )
      fail(`missing source case ${caseName}.`);
  const short = packet.cases.short390;
  const wrap = packet.cases.default240;
  const full = packet.cases.fullWidth240;
  if (
    !Array.isArray(short.widths) ||
    short.widths.length !== 3 ||
    short.widths.some(value => !Number.isFinite(value) || value <= 0) ||
    !Array.isArray(short.x) ||
    short.x.length !== 3 ||
    short.x.some(value => !Number.isFinite(value)) ||
    short.groupHeight !== geometry.minHeight ||
    wrap.thirdX !== geometry.seam ||
    wrap.thirdY !== geometry.minHeight ||
    wrap.groupHeight !== 2 * geometry.minHeight ||
    !Number.isFinite(full.groupHeight) ||
    full.groupHeight <= 0 ||
    full.allocation?.count !== 3 ||
    full.allocation.seams !== 2
  )
    fail('malformed or inconsistent measured source geometry.');
  const font = { ...nativeStyles[0].fontName };
  report.fonts.requested.push(font);
  await figma.loadFontAsync(font);
  report.fonts.loaded.push(font);
  report.preflight.segmentedJoining = {
    version: packet.version,
    sourceBrandId: packet.cases.sourceBrandId,
    sourceRefs: packet.sourceRefs,
    fontSourceStyleId: nativeStyles[0].id,
    fontName: font,
    sourceTypography: segment,
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
    seam: {
      value: geometry.seam,
      sourceRole: roles.border.name,
      scale: -1,
      bound: false,
    },
  };
  report.limitations = [
    'Four isolated UNDRR geometry fixtures only; production assets and foundations are unchanged.',
    'Direct source typography120% uses the existing Bold font source. It does not satisfy canonical shared text style association.',
    'Source CSS requests600 while the bundled font resolves Bold700. Actual native font records are retained, not equated to browser font files.',
    'Negative spacing is the source-derived literal minus border; it has no live negative variable binding.',
    'itemReverseZIndex cannot raise the middle semantic child above both neighbours. Native wrap origins and tallest-child stretch require observed evidence.',
    'Geometry support does not establish focus occlusion, glyph rasterisation, arbitrary brand/RTL layouts or production consumer acceptance.',
  ];
  return { packet, source, roles, byName, font, cornerFields, equal };
}

async function mgRunSegmentedJoiningProbes(context, plan) {
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
  const { packet, source, roles, byName, font, cornerFields } = plan;
  const g = source.geometry;
  const near = (a, b) =>
    Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 0.02;
  const bind = (node, field, key) =>
    node.setBoundVariable(field, roles[key].variable);
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
  const textPaint = (node, name) => {
    node.fills = [paint(name)];
    node.setRangeFills(0, node.characters.length, node.fills);
  };
  const corners = (node, values, outer = false) =>
    cornerFields.forEach((field, index) => {
      node[field] = values[index];
      if (!outer || values[index] === 0)
        bind(node, field, values[index] === 0 ? 'zero' : 'radius');
    });
  const flow = node => {
    node.layoutMode = 'HORIZONTAL';
    node.primaryAxisAlignItems = 'CENTER';
    node.counterAxisAlignItems = 'CENTER';
    node.clipsContent = false;
    node.fills = [];
    node.layoutSizingHorizontal = 'HUG';
    node.layoutSizingVertical = 'HUG';
  };
  function textNode(parent, value) {
    const node = record(figma.createText());
    node.fontName = font;
    node.fontSize = source.typography.segment.fontSize;
    node.lineHeight = source.typography.segment.lineHeight;
    node.characters = value;
    parent.appendChild(node);
    node.textAutoResize = 'WIDTH_AND_HEIGHT';
    node.layoutSizingHorizontal = 'HUG';
    node.layoutSizingVertical = 'HUG';
    bind(node, 'fontFamily', 'fontFamily');
    bind(node, 'fontSize', 'fontSize');
    return node;
  }
  function segment(position, index, fixture) {
    const master = create('createComponent');
    master.name = `Segmented diagnostic / ${fixture} / ${position}`;
    master.x = 800;
    master.y = 40 + fixture * 330 + index * 85;
    flow(master);
    master.strokesIncludedInLayout = true;
    master.strokeAlign = 'INSIDE';
    master.strokeWeight = g.border;
    bind(master, 'strokeWeight', 'border');
    master.minHeight = g.minHeight;
    for (const [field, key] of [
      ['paddingLeft', 'paddingInline'],
      ['paddingRight', 'paddingInline'],
      ['paddingTop', 'paddingBlock'],
      ['paddingBottom', 'paddingBlock'],
    ]) {
      master[field] = g[key];
      bind(master, field, key);
    }
    corners(master, g.corners[position]);
    const label = textNode(master, packet.labels.default[index]);
    label.name = 'Label';
    const property = master.addComponentProperty(
      'Label',
      'TEXT',
      packet.labels.default[index]
    );
    label.componentPropertyReferences = { characters: property };
    const p = source.paints.default;
    master.strokes = [paint(p.stroke)];
    textPaint(label, p.text);
    const rings = [];
    for (const [name, color, weight, offset, values] of [
      ['separator', 'separatorColor', g.focusOffset, 0, g.corners[position]],
      [
        'focus',
        'focusColor',
        g.focusWidth,
        g.focusOffset,
        g.focusOuterCorners[position],
      ],
    ]) {
      const ring = create('createRectangle', master);
      ring.name = name;
      ring.layoutPositioning = 'ABSOLUTE';
      ring.fills = [];
      ring.strokeAlign = 'OUTSIDE';
      ring.strokeWeight = weight;
      bind(
        ring,
        'strokeWeight',
        name === 'focus' ? 'focusWidth' : 'focusOffset'
      );
      ring.strokes = [paint(roles[color].name)];
      ring.x = -offset;
      ring.y = -offset;
      ring.resize(master.width + 2 * offset, master.height + 2 * offset);
      ring.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' };
      corners(ring, values, name === 'focus');
      ring.visible = false;
      rings.push(ring);
    }
    return { master, property, label, rings, position };
  }
  function fixture(index, kind) {
    const row = create('createFrame');
    row.name = `Segmented joining / ${kind}`;
    row.x = 40;
    row.y = 40 + index * 330;
    flow(row);
    row.primaryAxisAlignItems = 'MIN';
    row.counterAxisAlignItems = 'CENTER';
    row.itemSpacing = g.seam;
    row.setExplicitVariableModeForCollection(collection, mode.modeId);
    const parts = ['First', 'Middle', 'Last'].map((position, i) => {
      const sourcePart = segment(position, i, index);
      const consumer = instance(sourcePart.master, row);
      return { ...sourcePart, consumer, paintState: 'default' };
    });
    return { row, parts, order: parts.map(part => part.consumer.id) };
  }
  const resolvePaints = (paints, node) =>
    (paints || []).map(p => {
      const alias = p.boundVariables?.color;
      const role = Object.values(roles).find(
        item => item.variable.id === alias?.id
      );
      return {
        paint: p,
        variableId: alias?.id || null,
        sourceRole: role?.name || null,
        resolved: role?.variable.resolveForConsumer(node)?.value ?? null,
      };
    });
  const aliasIs = (value, key) => {
    const aliases = Array.isArray(value) ? value : value ? [value] : [];
    return (
      aliases.length === 1 &&
      aliases[0]?.type === 'VARIABLE_ALIAS' &&
      aliases[0].id === roles[key].variable.id
    );
  };
  async function snapshot(f, phase) {
    return {
      phase,
      row: {
        ...bounds(f.row),
        layoutMode: f.row.layoutMode,
        layoutWrap: f.row.layoutWrap,
        itemSpacing: f.row.itemSpacing,
        counterAxisSpacing: f.row.counterAxisSpacing,
        itemReverseZIndex: f.row.itemReverseZIndex,
        horizontal: f.row.layoutSizingHorizontal,
        vertical: f.row.layoutSizingVertical,
        clipsContent: f.row.clipsContent,
        childIds: f.row.children.map(node => node.id),
      },
      segments: await Promise.all(
        f.parts.map(async part => {
          const node = await figma.getNodeByIdAsync(part.consumer.id);
          const actualMain = await node.getMainComponentAsync();
          const label = node.children.find(child => child.type === 'TEXT');
          const currentPaint = source.paints[part.paintState || 'default'];
          const ranges = resolvePaints(
            label.getRangeFills(0, label.characters.length),
            label
          );
          const requiredRole = byName.get(currentPaint.text);
          const rangePaintAliasesMatch =
            ranges.length === 1 &&
            ranges[0].variableId === requiredRole.variable.id &&
            plan.equal(ranges[0].resolved, requiredRole.expected);

          return {
            ...bounds(node),
            mainComponentId: actualMain?.id || null,
            expectedMainComponentId: part.master.id,
            labelBindingMatches:
              label.componentPropertyReferences?.characters === part.property &&
              node.componentProperties?.[part.property]?.type === 'TEXT' &&
              node.componentProperties[part.property].value ===
                label.characters,
            rangePaintAliasesMatch,
            mainText: {
              id: part.label.id,
              boundVariables: part.label.boundVariables,
              fontName: part.label.fontName,
              fontSize: part.label.fontSize,
              lineHeight: part.label.lineHeight,
              rangePaints: resolvePaints(
                part.label.getRangeFills(0, part.label.characters.length),
                part.label
              ),
            },
            propertyId: part.property,
            properties: node.componentProperties,
            corners: cornerFields.map(field => node[field]),
            horizontal: node.layoutSizingHorizontal,
            vertical: node.layoutSizingVertical,
            strokeAlign: node.strokeAlign,
            strokesIncludedInLayout: node.strokesIncludedInLayout,
            boundVariables: node.boundVariables,
            strokes: resolvePaints(node.strokes, node),
            fills: resolvePaints(node.fills, node),
            text: {
              ...bounds(label),
              characters: label.characters,
              textStyleId: label.textStyleId,
              sourceTypographyMatch:
                label.fontName?.family === font.family &&
                label.fontName?.style === font.style &&
                near(label.fontSize, source.typography.segment.fontSize) &&
                label.lineHeight?.unit === 'PERCENT' &&
                near(
                  label.lineHeight.value,
                  source.typography.segment.lineHeight.value
                ),
              fontName: label.fontName,
              fontSize: label.fontSize,
              lineHeight: label.lineHeight,
              textAutoResize: label.textAutoResize,
              horizontal: label.layoutSizingHorizontal,
              vertical: label.layoutSizingVertical,
              boundVariables: label.boundVariables,
              typographyBindingsMatch:
                aliasIs(label.boundVariables?.fontFamily, 'fontFamily') &&
                aliasIs(label.boundVariables?.fontSize, 'fontSize'),
              propertyReferences: label.componentPropertyReferences,
              paints: resolvePaints(label.fills, label),
              rangePaints: resolvePaints(
                label.getRangeFills(0, label.characters.length),
                label
              ),
            },
            rings: node.children
              .filter(child => child.type === 'RECTANGLE')
              .map(ring => ({
                ...bounds(ring),
                visible: ring.visible,
                corners: cornerFields.map(field => ring[field]),
                strokeAlign: ring.strokeAlign,
                strokeWeight: ring.strokeWeight,
                constraints: ring.constraints,
                boundVariables: ring.boundVariables,
                strokes: resolvePaints(ring.strokes, ring),
              })),
          };
        })
      ),
      semanticOrderPreserved:
        JSON.stringify(f.row.children.map(node => node.id)) ===
        JSON.stringify(f.order),
    };
  }
  const capture = async (result, f, phase) => {
    const value = await snapshot(f, phase);
    result.observations.push(value);
    return value;
  };
  function state(part, stateName) {
    const value = source.paints[stateName];
    const node = part.consumer;
    part.paintState = stateName;
    node.fills = value.fill ? [paint(value.fill)] : [];
    node.strokes = [paint(value.stroke)];
    const label = node.children.find(child => child.type === 'TEXT');
    textPaint(label, value.text);
  }
  function labels(f, values) {
    f.parts.forEach((part, index) =>
      part.consumer.setProperties({ [part.property]: values[index] })
    );
  }
  function partialMasterRepeat(f) {
    for (const [index, part] of f.parts.entries()) {
      part.master.minHeight = g.minHeight;
      part.master.paddingLeft = g.paddingInline;
      bind(part.master, 'paddingLeft', 'paddingInline');
      part.label.fontName = font;
      part.label.fontSize = source.typography.segment.fontSize;
      part.label.lineHeight = source.typography.segment.lineHeight;
      part.label.characters = packet.labels.default[index];
      bind(part.label, 'fontFamily', 'fontFamily');
      bind(part.label, 'fontSize', 'fontSize');
      textPaint(part.label, source.paints.default.text);
    }
  }
  const identityChecks = observations => {
    const initial = observations[0];
    return observations.every(
      value =>
        value.semanticOrderPreserved &&
        value.segments.every((segment, index) => {
          const old = initial.segments[index];
          return (
            segment.id === old.id &&
            segment.mainComponentId === segment.expectedMainComponentId &&
            segment.propertyId === old.propertyId &&
            segment.text.propertyReferences?.characters ===
              segment.propertyId &&
            segment.properties?.[segment.propertyId]?.type === 'TEXT' &&
            segment.text.id === old.text.id &&
            JSON.stringify(segment.rings.map(ring => ring.id)) ===
              JSON.stringify(old.rings.map(ring => ring.id))
          );
        })
    );
  };
  await test('segmentedSeamsCorners', async result => {
    result.supportScope =
      'Intrinsic body seams, baked end corners, source typography and role bindings; focus rendering is separate.';
    const f = fixture(0, 'Seams and corners');
    const initial = await capture(result, f, 'initial');
    const nodes = initial.segments;
    const seamChecks = nodes
      .slice(1)
      .map((node, index) =>
        near(node.x, nodes[index].x + nodes[index].width + g.seam)
      );
    // Root corner changes deliberately do not write inherited ring descendants.
    const first = f.parts[0].consumer;
    corners(first, g.corners.Middle);
    await capture(result, f, 'root corner override only');
    corners(first, g.corners.First);
    for (const part of f.parts) {
      part.master.itemSpacing = 0;
      part.master.minHeight = g.minHeight;
    }
    const repeated = await capture(
      result,
      f,
      'partial private-master update and restored corners'
    );
    result.source = packet.cases.short390;
    result.identityPreserved = identityChecks(result.observations);
    result.supported =
      result.observations.every(value =>
        value.segments.every(
          segment =>
            segment.text.typographyBindingsMatch &&
            segment.text.sourceTypographyMatch &&
            segment.labelBindingMatches &&
            segment.rangePaintAliasesMatch
        )
      ) &&
      result.identityPreserved &&
      initial.semanticOrderPreserved &&
      repeated.semanticOrderPreserved &&
      seamChecks.every(Boolean) &&
      repeated.segments.every(
        (node, index) =>
          JSON.stringify(node.corners) ===
          JSON.stringify(g.corners[['First', 'Middle', 'Last'][index]])
      );
    result.findings = {
      seamChecks,
      sourceWidthDeltas: nodes.map(
        (node, index) => node.width - packet.cases.short390.widths[index]
      ),
      typographyBindingsMatch: result.observations.every(value =>
        value.segments.every(
          segment =>
            segment.text.typographyBindingsMatch &&
            segment.text.sourceTypographyMatch &&
            segment.labelBindingMatches &&
            segment.rangePaintAliasesMatch
        )
      ),
      ringCornerInheritance:
        'Observe root-only override snapshots separately; no automatic descendant propagation is assumed.',
    };
  });
  await test('segmentedStacking', async result => {
    const f = fixture(1, 'Focus and stacking');
    await capture(result, f, 'rest');
    for (const [index, reverse] of [
      [0, true],
      [1, true],
      [1, false],
      [2, false],
    ]) {
      f.row.itemReverseZIndex = reverse;
      f.parts.forEach((part, i) => {
        state(part, i === index ? 'selectedHover' : 'default');
        for (const ring of part.consumer.children.filter(
          node => node.type === 'RECTANGLE'
        ))
          ring.visible = i === index;
      });
      await capture(result, f, `focus ${index + 1}; reverse ${reverse}`);
    }
    for (const stateName of ['selected', 'hover']) {
      f.parts.forEach((part, index) => {
        state(part, index === 1 ? stateName : 'default');
        for (const ring of part.consumer.children.filter(
          node => node.type === 'RECTANGLE'
        ))
          ring.visible = false;
      });
      await capture(result, f, `middle ${stateName}; no focus`);
    }
    result.supported = false;
    result.findings = {
      semanticOrderPreserved: result.observations.every(
        value => value.semanticOrderPreserved
      ),
      middleCanBeAboveBothNeighbours: false,
      reason:
        'A boolean reversing the entire paint order cannot raise the middle semantic child above both neighbours. Source focus occlusion still needs visual review.',
    };
  });
  await test('segmentedFullWidth', async result => {
    result.supportScope =
      'Body allocation, content growth, source typography, role bindings and edited-label identity only. Resized focus descendants require separate geometry and paint acceptance.';
    const f = fixture(2, 'Full width and edited labels');
    f.row.layoutWrap = 'NO_WRAP';
    const size = width => {
      f.row.resize(width, f.row.height);
      f.row.layoutSizingHorizontal = 'FIXED';
      f.row.layoutSizingVertical = 'HUG';
      for (const part of f.parts) {
        part.consumer.layoutSizingHorizontal = 'FILL';
        part.consumer.layoutSizingVertical = 'FILL';
        const label = part.consumer.children.find(node => node.type === 'TEXT');
        label.textAutoResize = 'HEIGHT';
        label.layoutSizingHorizontal = 'FILL';
        label.layoutSizingVertical = 'HUG';
      }
    };
    size(packet.cases.fullWidth240.width);
    await capture(result, f, 'short240');
    labels(f, packet.labels.long);
    for (const width of [240, 390, 240]) {
      size(width);
      await capture(result, f, `edited long${width}`);
    }
    partialMasterRepeat(f);
    await capture(
      result,
      f,
      'edited long240 after partial private-master update'
    );
    labels(f, packet.labels.default);
    size(240);
    await capture(result, f, 'restored short240');
    partialMasterRepeat(f);
    const last = await capture(
      result,
      f,
      'restored short after partial private-master update'
    );
    result.source = packet.cases.fullWidth240;
    result.findings = result.observations.map(observation => ({
      phase: observation.phase,
      typographyBindingsMatch: observation.segments.every(
        segment =>
          segment.text.typographyBindingsMatch &&
          segment.text.sourceTypographyMatch &&
          segment.rangePaintAliasesMatch
      ),
      rowVerticalHug: observation.row.vertical === 'HUG',
      segments: observation.segments.map(segment => ({
        equalAllocation: near(
          segment.width,
          (observation.row.width - 2 * g.seam) / 3
        ),
        commonHeight: near(segment.height, observation.segments[0].height),
        textFits:
          segment.text.width <=
            segment.width - 2 * g.paddingInline - 2 * g.border + 0.02 &&
          segment.text.height <=
            segment.height - 2 * g.paddingBlock - 2 * g.border + 0.02,
        verticalSizing: segment.vertical,
      })),
    }));
    result.identityPreserved = identityChecks(result.observations);
    result.labelBindingsMatch = result.observations.every(value =>
      value.segments.every(segment => segment.labelBindingMatches)
    );
    result.editedLabelsPreserved = result.observations
      .filter(value => value.phase.startsWith('edited long'))
      .every(value =>
        value.segments.every(
          (segment, index) =>
            segment.text.characters === packet.labels.long[index]
        )
      );
    result.sourceGroupHeightDelta =
      last.row.height - packet.cases.fullWidth240.groupHeight;
    result.supported =
      result.identityPreserved &&
      result.editedLabelsPreserved &&
      result.labelBindingsMatch &&
      result.findings.every(
        value =>
          value.typographyBindingsMatch &&
          value.rowVerticalHug &&
          value.segments.every(
            segment =>
              segment.equalAllocation &&
              segment.commonHeight &&
              segment.textFits
          )
      );
  });
  await test('segmentedWrap', async result => {
    const f = fixture(3, 'Wrap240 source origin');
    f.row.layoutWrap = 'WRAP';
    f.row.counterAxisSpacing = g.counterGap;
    f.row.resize(packet.cases.default240.width, f.row.height);
    f.row.layoutSizingHorizontal = 'FIXED';
    f.row.layoutSizingVertical = 'HUG';
    await capture(result, f, 'short240');
    labels(f, packet.labels.long);
    await capture(result, f, 'long240');
    labels(f, packet.labels.default);
    partialMasterRepeat(f);
    const last = await capture(
      result,
      f,
      'restored short after partial private-master update'
    );
    const expected = packet.cases.default240;
    result.source = expected;
    result.findings = {
      thirdX: near(last.segments[2].x, expected.thirdX),
      thirdY: near(last.segments[2].y, expected.thirdY),
      groupHeight: near(last.row.height, expected.groupHeight),
      semanticOrderPreserved: last.semanticOrderPreserved,
    };
    result.identityPreserved = identityChecks(result.observations);
    result.typographyBindingsMatch = result.observations.every(value =>
      value.segments.every(
        segment =>
          segment.text.typographyBindingsMatch &&
          segment.text.sourceTypographyMatch &&
          segment.rangePaintAliasesMatch
      )
    );
    result.supported =
      result.identityPreserved &&
      result.typographyBindingsMatch &&
      [result.observations[0], last].every(
        value =>
          near(value.segments[2].x, expected.thirdX) &&
          near(value.segments[2].y, expected.thirdY) &&
          near(value.row.height, expected.groupHeight)
      );
  });
  report.segmentedJoining = {
    fixtureCount: 4,
    createdNodeCount: report.ledger.length,
    productionAssetsChanged: false,
    sharedStyleAssociationSatisfied: false,
    measuredBrandId: packet.cases.sourceBrandId,
  };
}
