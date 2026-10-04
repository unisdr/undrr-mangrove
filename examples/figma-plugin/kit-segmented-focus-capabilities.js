/* global figma, mgReadIdentity, mgWriteIdentity, mgSegmentedJoiningPreflight */
// Bounded native sizing diagnostics. Canonical acceptance remains separate.
function mgSegmentedFocusCopy(value) {
  return JSON.parse(
    JSON.stringify(value, (_key, item) =>
      typeof item === 'symbol' ? '[mixed]' : item
    )
  );
}
function mgSegmentedFocusSame(a, b) {
  const stable = value =>
    Array.isArray(value)
      ? value.map(stable)
      : value && typeof value === 'object'
        ? Object.fromEntries(
            Object.keys(value)
              .sort()
              .map(key => [key, stable(value[key])])
          )
        : value;
  return JSON.stringify(stable(a)) === JSON.stringify(stable(b));
}
async function mgSegmentedFocusSizingPreflight(
  doc,
  brandId,
  collection,
  mode,
  report
) {
  const plan = await mgSegmentedJoiningPreflight(
    doc,
    brandId,
    collection,
    mode,
    report
  );
  const fail = message => {
    throw new Error(`Segmented focus sizing: ${message}`);
  };
  const definitions = doc.variables || [];
  const resolveSource = (definition, brand, seen = new Set()) => {
    if (!definition || definition.type !== 'FLOAT' || seen.has(definition.id))
      fail('invalid or cyclic source sum role.');
    seen.add(definition.id);
    const value = definition.values?.[brand];
    if (value && typeof value === 'object') {
      if (typeof value.alias !== 'string' || Object.keys(value).length !== 1)
        fail('malformed source sum alias.');
      const targets = definitions.filter(item => item.name === value.alias);
      if (targets.length !== 1) fail('ambiguous source sum alias.');
      return resolveSource(targets[0], brand, seen);
    }
    if (!Number.isFinite(value) || value < 0)
      fail('missing or invalid source sum value.');
    return value;
  };
  const sums = definitions.filter(
    value =>
      value.id === 'effect-size.focus-ring.outer-spread' &&
      value.name === 'effect-size/focus-ring/outer-spread' &&
      value.type === 'FLOAT'
  );
  if (
    sums.length !== 1 ||
    definitions.filter(value => value.id === sums[0].id).length !== 1 ||
    definitions.filter(value => value.name === sums[0].name).length !== 1
  )
    fail('one exact existing outer-spread role is required.');
  const offset = definitions.find(
      value => value.id === plan.roles.focusOffset.id
    ),
    width = definitions.find(value => value.id === plan.roles.focusWidth.id);
  const modes = doc.modes;
  if (
    !Array.isArray(modes) ||
    !modes.length ||
    new Set(modes.map(value => value.id)).size !== modes.length
  )
    fail('unique source brand modes are required.');
  const sourceSums = Object.fromEntries(
    modes.map(brand => {
      const expected =
          resolveSource(offset, brand.id) + resolveSource(width, brand.id),
        actual = resolveSource(sums[0], brand.id);
      if (Math.abs(actual - expected) > 1e-6)
        fail(`source offset+width differs for ${brand.id}.`);
      return [brand.id, actual];
    })
  );
  const nativeVariables = await figma.variables.getLocalVariablesAsync();
  const natives = nativeVariables.filter(
    value => mgReadIdentity(value, 'mgId') === sums[0].id
  );
  const resolveNative = (value, seen = new Set()) => {
    if (
      !value ||
      value.resolvedType !== 'FLOAT' ||
      value.variableCollectionId !== collection.id ||
      seen.has(value.id)
    )
      fail('foreign, incompatible or cyclic native sum role.');
    seen.add(value.id);
    const selected = value.valuesByMode?.[mode.modeId];
    if (selected?.type === 'VARIABLE_ALIAS') {
      const targets = nativeVariables.filter(item => item.id === selected.id);
      if (targets.length !== 1) fail('ambiguous native sum alias.');
      return resolveNative(targets[0], seen);
    }
    if (!Number.isFinite(selected) || selected < 0)
      fail('missing or invalid selected native sum.');
    return selected;
  };
  if (
    natives.length !== 1 ||
    natives[0].name !== sums[0].name ||
    nativeVariables.filter(
      value =>
        value.name === sums[0].name &&
        value.variableCollectionId === collection.id
    ).length !== 1 ||
    Math.abs(resolveNative(natives[0]) - sourceSums[brandId]) > 1e-6
  )
    fail('one exact selected native sum role is required.');
  const templateId = 'component.segmented-control.segment';
  const templates = (doc.styles?.text || []).filter(
    value => value.id === templateId
  );
  const nativeStyles = (await figma.getLocalTextStylesAsync()).filter(
    value => mgReadIdentity(value, 'mgStyleId') === templateId
  );
  const percent = value =>
    value?.unit === 'PERCENT' &&
    [120, Math.fround(1.2) * 100].some(
      expected => Math.abs(value.value - expected) <= 1e-6
    );
  const alias = (value, role) => {
    const list = Array.isArray(value) ? value : value ? [value] : [];
    return (
      list.length === 1 &&
      list[0]?.type === 'VARIABLE_ALIAS' &&
      list[0].id === plan.roles[role].variable.id
    );
  };
  if (templates.length !== 1 || nativeStyles.length !== 1)
    fail(
      'import the exact canonical shared120% template first; no DIRECT fallback.'
    );
  const definition = templates[0],
    source = definition.values?.[brandId],
    style = nativeStyles[0];
  if (
    definition.bindings?.fontFamily !== plan.roles.fontFamily.name ||
    definition.bindings?.fontSize !== plan.roles.fontSize.name ||
    source?.fontName?.family !== plan.roles.fontFamily.expected ||
    source.fontName.style !== 'Bold' ||
    source.fontSize !== plan.roles.fontSize.expected ||
    !percent(source.lineHeight) ||
    source.textDecoration !== 'NONE' ||
    source.textWrapStyle !== 'AUTO' ||
    style.fontName?.family !== source.fontName.family ||
    style.fontName.style !== 'Bold' ||
    style.fontSize !== source.fontSize ||
    !percent(style.lineHeight) ||
    style.textDecoration !== 'NONE' ||
    style.textWrapStyle !== 'AUTO' ||
    !alias(style.boundVariables?.fontFamily, 'fontFamily') ||
    !alias(style.boundVariables?.fontSize, 'fontSize')
  )
    fail('exact source/native shared typography and aliases are required.');
  const font = mgSegmentedFocusCopy(style.fontName);
  report.fonts.requested.push(font);
  await figma.loadFontAsync(font);
  report.fonts.loaded.push(font);
  report.preflight.segmentedFocusSizing = {
    version: 1,
    templateId,
    styleId: style.id,
    fontName: font,
    lineHeight: style.lineHeight,
    sumRole: {
      sourceId: sums[0].id,
      id: natives[0].id,
      name: natives[0].name,
      scopes: natives[0].scopes,
      sourceBrandSums: sourceSums,
      selectedValue: sourceSums[brandId],
    },
    renderer: 'coincident OUTSIDE gold sum then white offset',
    policies: ['STRETCH', 'SCALE'],
  };
  report.limitations = [
    'Two private source-style sizing rows only; canonical assets, variables, styles and scopes remain unchanged.',
    'Shared120% association is required for this diagnostic; it is not full canonical family acceptance.',
    'SCALE is a documented constraint mode, not a documented fractional-precision guarantee.',
    'The existing outer-spread FLOAT is reused as a stroke binding without changing its EFFECT_FLOAT scope; actual native compatibility is a measured gate.',
    'Private-master reapplications and fresh consumers are bounded diagnostics, not ordinary canonical rebuilds.',
    'Middle focus occlusion, automatic wrap, font-file/pixel parity and other brands remain unaccepted.',
  ];
  return {
    ...plan,
    focusStyle: style,
    focusFont: font,
    sumRole: {
      ...sums[0],
      variable: natives[0],
      expected: sourceSums[brandId],
    },
    percent,
  };
}
async function mgRunSegmentedFocusSizingProbes(context, plan) {
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
  const {
    packet,
    source,
    roles,
    cornerFields,
    focusStyle,
    focusFont,
    sumRole,
    percent,
  } = plan;
  const geometry = source.geometry;
  const near = (a, b) =>
    Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-5;
  const alias = (value, id) => {
    const list = Array.isArray(value) ? value : value ? [value] : [];
    return (
      list.length === 1 &&
      list[0]?.type === 'VARIABLE_ALIAS' &&
      list[0].id === id
    );
  };
  const bind = (node, field, role) => {
    if (roles[role].type === 'FLOAT') node[field] = roles[role].expected;
    node.setBoundVariable(field, roles[role].variable);
  };
  const byName = new Map(Object.values(roles).map(role => [role.name, role]));
  const paint = name => {
    const role = byName.get(name);
    if (!role || role.type !== 'COLOR')
      throw new Error(`Unknown focus diagnostic paint ${name}.`);
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
  const own = (node, suffix) => {
    mgWriteIdentity(
      node,
      'mgKitId',
      `capability/${report.runId}/segmented-focus-sizing/${suffix}`
    );
    return node;
  };
  function flow(node) {
    node.layoutMode = 'HORIZONTAL';
    node.primaryAxisAlignItems = 'CENTER';
    node.counterAxisAlignItems = 'CENTER';
    node.fills = [];
    node.clipsContent = false;
    node.layoutSizingHorizontal = 'HUG';
    node.layoutSizingVertical = 'HUG';
  }
  function corners(node, position) {
    node.setBoundVariable('cornerRadius', null);
    cornerFields.forEach((field, index) =>
      bind(
        node,
        field,
        geometry.corners[position][index] === 0 ? 'zero' : 'radius'
      )
    );
  }
  async function typography(node) {
    node.fontName = mgSegmentedFocusCopy(focusFont);
    node.textDecoration = 'NONE';
    node.textWrapStyle = 'AUTO';
    // Literal typography writes after style attachment can detach the style.
    // The preflight verifies its two variable aliases; inherit them intact.
    await node.setTextStyleIdAsync(focusStyle.id);
    node.textAlignHorizontal = 'CENTER';
  }
  function textPaint(node, name) {
    node.fills = [paint(name)];
    if (node.characters.length)
      node.setRangeFills(0, node.characters.length, node.fills);
  }
  async function master(policy, position, index, column) {
    const node = own(create('createComponent'), `${policy}/${position}/master`);
    node.name = `Segmented focus sizing / ${policy} / ${position}`;
    node.x = 850 + column * 220;
    node.y = 40 + index * 200;
    flow(node);
    node.strokesIncludedInLayout = true;
    node.strokeAlign = 'INSIDE';
    bind(node, 'strokeWeight', 'border');
    node.minHeight = geometry.minHeight;
    for (const [field, role] of [
      ['paddingTop', 'paddingBlock'],
      ['paddingBottom', 'paddingBlock'],
      ['paddingLeft', 'paddingInline'],
      ['paddingRight', 'paddingInline'],
    ])
      bind(node, field, role);
    corners(node, position);
    const text = own(record(figma.createText()), `${policy}/${position}/label`);
    text.name = 'Label';
    await typography(text);
    text.characters = packet.labels.default[index];
    node.appendChild(text);
    text.textAutoResize = 'WIDTH_AND_HEIGHT';
    text.layoutSizingHorizontal = 'HUG';
    text.layoutSizingVertical = 'HUG';
    const labelKey = node.addComponentProperty(
      'Label',
      'TEXT',
      text.characters
    );
    text.componentPropertyReferences = { characters: labelKey };
    node.strokes = [paint(source.paints.default.stroke)];
    textPaint(text, source.paints.default.text);
    const rings = [];
    // Default last-on-top paint order: gold first, white separator second.
    node.itemReverseZIndex = false;
    for (const ringName of ['gold', 'white']) {
      const ring = own(
        create('createRectangle', node),
        `${policy}/${position}/${ringName}`
      );
      ring.name = `Focus ${ringName}`;
      ring.layoutPositioning = 'ABSOLUTE';
      ring.fills = [];
      ring.effects = [];
      ring.strokeAlign = 'OUTSIDE';
      ring.strokeJoin = 'MITER';
      ring.resize(node.width, node.height);
      ring.x = 0;
      ring.y = 0;
      ring.strokeWeight =
        ringName === 'gold' ? sumRole.expected : geometry.focusOffset;
      ring.setBoundVariable(
        'strokeWeight',
        ringName === 'gold' ? sumRole.variable : roles.focusOffset.variable
      );
      ring.strokes = [
        paint(
          roles[ringName === 'gold' ? 'focusColor' : 'separatorColor'].name
        ),
      ];
      corners(ring, position);
      ring.constraints = { horizontal: policy, vertical: policy };
      ring.visible = true;
      rings.push(ring);
    }
    return { node, text, labelKey, rings, position, index, policy };
  }
  function row(policy, phaseIndex, column) {
    const node = own(create('createFrame'), `${policy}/row/${phaseIndex}`);
    node.name = `Segmented coincident focus / ${policy} / ${phaseIndex}`;
    node.x = 40 + column * 420;
    node.y = 40 + phaseIndex * 270;
    flow(node);
    node.primaryAxisAlignItems = 'MIN';
    node.counterAxisAlignItems = 'MIN';
    node.resize(240, geometry.minHeight);
    node.layoutSizingHorizontal = 'FIXED';
    node.layoutSizingVertical = 'HUG';
    node.itemSpacing = geometry.seam;
    node.itemReverseZIndex = false;
    node.setExplicitVariableModeForCollection(collection, mode.modeId);
    return node;
  }
  function consumer(part, parent, suffix) {
    const node = instance(part.node, parent);
    own(node, `${part.policy}/${part.position}/consumer/${suffix}/${node.id}`);
    node.layoutSizingHorizontal = 'FILL';
    node.layoutSizingVertical = 'FILL';
    const label = node.children.find(value => value.type === 'TEXT');
    label.textAutoResize = 'HEIGHT';
    label.layoutSizingHorizontal = 'FILL';
    label.layoutSizingVertical = 'HUG';
    return {
      ...part,
      consumer: node,
      probeKey: mgReadIdentity(node, 'mgKitId'),
      expectedLabel: packet.labels.default[part.index],
      paintState: 'default',
      instanceId: node.id,
      textId: node.children.find(value => value.type === 'TEXT')?.id,
      ringIds: node.children
        .filter(value => value.type === 'RECTANGLE')
        .map(value => value.id),
    };
  }
  function appearances(part, state) {
    const node = part.consumer,
      p = source.paints[state],
      text = node.children.find(value => value.type === 'TEXT');
    node.fills = p.fill === null ? [] : [paint(p.fill)];
    node.strokes = [paint(p.stroke)];
    textPaint(text, p.text);
    part.paintState = state;
  }
  const paintRead = (values, node) =>
    !Array.isArray(values)
      ? '[mixed]'
      : values.map(p => {
          const id = p.boundVariables?.color?.id,
            role = Object.values(roles).find(value => value.variable.id === id);
          return {
            paint: mgSegmentedFocusCopy(p),
            variableId: id || null,
            sourceRole: role?.name || null,
            resolved: role
              ? mgSegmentedFocusCopy(
                  role.variable.resolveForConsumer(node).value
                )
              : null,
          };
        });
  function nativeRead(node) {
    return {
      ...bounds(node),
      parentId: node.parent?.id || null,
      key: mgReadIdentity(node, 'mgKitId'),
      visible: node.visible,
      opacity: node.opacity,
      layoutMode: node.layoutMode,
      horizontal: node.layoutSizingHorizontal,
      vertical: node.layoutSizingVertical,
      layoutPositioning: node.layoutPositioning,
      constraints: node.constraints,
      itemReverseZIndex: node.itemReverseZIndex,
      childIds: node.children?.map(value => value.id),
      clipsContent: node.clipsContent,
      effects: mgSegmentedFocusCopy(node.effects || []),
      effectStyleId: node.effectStyleId || '',
      corners: cornerFields.map(field => node[field]),
      minHeight: node.minHeight,
      strokeWeight: node.strokeWeight,
      strokeJoin: node.strokeJoin,
      strokeAlign: node.strokeAlign,
      strokesIncludedInLayout: node.strokesIncludedInLayout,
      padding: {
        top: node.paddingTop,
        bottom: node.paddingBottom,
        left: node.paddingLeft,
        right: node.paddingRight,
      },
      boundVariables: mgSegmentedFocusCopy(node.boundVariables || {}),
      fills: paintRead(node.fills, node),
      strokes: paintRead(node.strokes, node),
    };
  }
  function textRead(node) {
    return {
      ...nativeRead(node),
      characters: node.characters,
      fontName: mgSegmentedFocusCopy(node.fontName),
      fontSize: node.fontSize,
      lineHeight: mgSegmentedFocusCopy(node.lineHeight),
      textStyleId: node.textStyleId,
      textDecoration: node.textDecoration,
      textWrapStyle: node.textWrapStyle,
      textAlignHorizontal: node.textAlignHorizontal,
      textAutoResize: node.textAutoResize,
      componentPropertyReferences: mgSegmentedFocusCopy(
        node.componentPropertyReferences
      ),
      ranges: paintRead(node.getRangeFills(0, node.characters.length), node),
    };
  }
  const strokeAlias = (node, id) =>
    [
      'strokeTopWeight',
      'strokeBottomWeight',
      'strokeLeftWeight',
      'strokeRightWeight',
    ].some(field => node.boundVariables?.[field])
      ? [
          'strokeTopWeight',
          'strokeBottomWeight',
          'strokeLeftWeight',
          'strokeRightWeight',
        ].every(field => alias(node.boundVariables?.[field], id))
      : alias(node.boundVariables?.strokeWeight, id);
  const expectedPaint = (list, name) =>
    name === null
      ? Array.isArray(list) && list.length === 0
      : Array.isArray(list) &&
        list.length === 1 &&
        list[0].sourceRole === name &&
        ['r', 'g', 'b', 'a'].every(
          channel =>
            Number.isFinite(list[0].resolved?.[channel]) &&
            Math.abs(
              list[0].resolved[channel] - byName.get(name).expected[channel]
            ) <= 1e-6
        ) &&
        list[0].paint.type === 'SOLID' &&
        list[0].paint.visible !== false &&
        (list[0].paint.opacity ?? 1) === 1;
  async function capture(parts, parent, phase) {
    const actualRow = await figma.getNodeByIdAsync(parent.id);
    if (!actualRow || actualRow.removed)
      throw new Error('Exact sizing row is unavailable.');
    const samples = [];
    for (const part of parts) {
      const node = await figma.getNodeByIdAsync(part.instanceId);
      if (!node || node.removed || node.type !== 'INSTANCE')
        throw new Error('Exact focus sizing instance is unavailable.');
      const main = await node.getMainComponentAsync(),
        children = [];
      for (const child of node.children) {
        const fresh = await figma.getNodeByIdAsync(child.id);
        if (!fresh || fresh.removed)
          throw new Error('Exact focus descendant is unavailable.');
        children.push(fresh);
      }
      const labels = children.filter(value => value.type === 'TEXT'),
        ringNodes = children.filter(value => value.type === 'RECTANGLE');
      if (
        labels.length !== 1 ||
        ringNodes.length !== 2 ||
        children.length !== 3
      )
        throw new Error('Exact focus topology changed.');
      const text = textRead(labels[0]),
        body = nativeRead(node),
        rings = ringNodes.map(nativeRead),
        p = source.paints[part.paintState];
      const cornerAliases = value =>
        cornerFields.every((field, index) =>
          alias(
            value.boundVariables?.[field],
            roles[
              geometry.corners[part.position][index] === 0 ? 'zero' : 'radius'
            ].variable.id
          )
        );
      const findings = {
        identity:
          main?.type === 'COMPONENT' &&
          main.id === part.node.id &&
          mgReadIdentity(node, 'mgKitId') === part.probeKey &&
          mgReadIdentity(node, 'mgCapabilityProbeId') === report.runId &&
          node.id === part.instanceId &&
          labels[0].id === part.textId &&
          mgSegmentedFocusSame(
            ringNodes.map(value => value.id),
            part.ringIds
          ) &&
          node.parent?.id === parent.id &&
          node.children.every(value => value.parent?.id === node.id),
        property:
          text.componentPropertyReferences?.characters === part.labelKey &&
          node.componentProperties?.[part.labelKey]?.type === 'TEXT' &&
          node.componentProperties[part.labelKey].value ===
            part.expectedLabel &&
          text.characters === part.expectedLabel,
        sharedTypography:
          text.textStyleId === focusStyle.id &&
          mgSegmentedFocusSame(text.fontName, focusFont) &&
          near(text.fontSize, roles.fontSize.expected) &&
          percent(text.lineHeight) &&
          text.textDecoration === 'NONE' &&
          text.textWrapStyle === 'AUTO' &&
          text.textAlignHorizontal === 'CENTER' &&
          text.textAutoResize === 'HEIGHT' &&
          text.horizontal === 'FILL' &&
          text.vertical === 'HUG' &&
          alias(text.boundVariables.fontFamily, roles.fontFamily.variable.id) &&
          alias(text.boundVariables.fontSize, roles.fontSize.variable.id),
        sourceBox:
          body.layoutMode === 'HORIZONTAL' &&
          body.minHeight === geometry.minHeight &&
          body.strokesIncludedInLayout === true &&
          body.strokeAlign === 'INSIDE' &&
          near(body.strokeWeight, geometry.border) &&
          strokeAlias(body, roles.border.variable.id) &&
          ['top', 'bottom', 'left', 'right'].every(
            (field, index) =>
              near(
                body.padding[field],
                index < 2 ? geometry.paddingBlock : geometry.paddingInline
              ) &&
              alias(
                body.boundVariables[
                  [
                    'paddingTop',
                    'paddingBottom',
                    'paddingLeft',
                    'paddingRight',
                  ][index]
                ],
                roles[index < 2 ? 'paddingBlock' : 'paddingInline'].variable.id
              )
          ),
        sourcePaints:
          expectedPaint(body.fills, p.fill) &&
          expectedPaint(body.strokes, p.stroke) &&
          expectedPaint(text.fills, p.text) &&
          expectedPaint(text.ranges, p.text),
        bodyCorners:
          mgSegmentedFocusSame(body.corners, geometry.corners[part.position]) &&
          cornerAliases(body),
        outlineBindings: rings.every(
          (ring, index) =>
            strokeAlias(
              ring,
              index === 0 ? sumRole.variable.id : roles.focusOffset.variable.id
            ) &&
            cornerAliases(ring) &&
            expectedPaint(
              ring.strokes,
              roles[index === 0 ? 'focusColor' : 'separatorColor'].name
            )
        ),
        coincidentBounds: rings.every(
          ring =>
            near(ring.x, 0) &&
            near(ring.y, 0) &&
            near(ring.width, body.width) &&
            near(ring.height, body.height)
        ),
        constantStrokeAndCorners: rings.every(
          (ring, index) =>
            near(
              ring.strokeWeight,
              index === 0 ? sumRole.expected : geometry.focusOffset
            ) &&
            mgSegmentedFocusSame(ring.corners, geometry.corners[part.position])
        ),
        paintOrder:
          node.itemReverseZIndex === false &&
          node.children.findIndex(value => value.id === part.ringIds[0]) <
            node.children.findIndex(value => value.id === part.ringIds[1]),
        outlinePolicy: rings.every(
          ring =>
            ring.strokeAlign === 'OUTSIDE' &&
            ring.strokeJoin === 'MITER' &&
            ring.layoutPositioning === 'ABSOLUTE' &&
            ring.constraints.horizontal === part.policy &&
            ring.constraints.vertical === part.policy &&
            Array.isArray(ring.fills) &&
            !ring.fills.length &&
            !ring.effects.length &&
            ring.effectStyleId === ''
        ),
        unclipped:
          body.clipsContent === false && actualRow.clipsContent === false,
        visiblePaint:
          body.visible === true &&
          body.opacity === 1 &&
          text.visible === true &&
          text.opacity === 1 &&
          rings.every(ring => ring.visible === true && ring.opacity === 1),
      };
      samples.push({
        position: part.position,
        policy: part.policy,
        expectedLabel: part.expectedLabel,
        paintState: part.paintState,
        expectedMainId: part.node.id,
        actualMainId: main?.id || null,
        labelKey: part.labelKey,
        properties: mgSegmentedFocusCopy(node.componentProperties),
        mainPropertyDefinitions: mgSegmentedFocusCopy(
          main.componentPropertyDefinitions
        ),
        body,
        text,
        rings,
        mainBody: nativeRead(main),
        mainRings: main.children
          .filter(value => value.type === 'RECTANGLE')
          .map(nativeRead),
        mainText: textRead(part.text),
        findings,
      });
    }
    return {
      phase,
      row: { ...nativeRead(actualRow), itemSpacing: actualRow.itemSpacing },
      samples,
      semanticOrderPreserved: mgSegmentedFocusSame(
        actualRow.children.map(value => value.id),
        parts.map(value => value.instanceId)
      ),
      equalAllocation: samples.every(
        value =>
          // Allocation can differ by one native float32 ULP. This tolerance is
          // confined to division; outline/body and repeat comparisons stay strict.
          Math.abs(
            value.body.width - (actualRow.width - 2 * geometry.seam) / 3
          ) <= Math.max(1e-5, Math.abs(value.body.width) * 2 ** -23)
      ),
      rowHugAndChildFill:
        actualRow.layoutSizingVertical === 'HUG' &&
        samples.every(
          value =>
            value.body.horizontal === 'FILL' && value.body.vertical === 'FILL'
        ),
    };
  }
  report.segmentedFocusSizing = {
    version: 1,
    fixtureCount: 2,
    policies: ['STRETCH', 'SCALE'],
    renderer: 'coincident outside strokes',
    sharedStyleRequired: true,
    ordinaryCanonicalAcceptance: false,
    visualOcclusionVerified: false,
    geometryTolerance: 1e-5,
  };
  for (const [column, policy] of ['STRETCH', 'SCALE'].entries())
    await test(`segmentedFocusSizing${policy}`, async result => {
      const masters = [];
      for (const [index, position] of ['First', 'Middle', 'Last'].entries())
        masters.push(await master(policy, position, index, column));
      const initialRow = row(policy, 0, column),
        parts = masters.map(part => consumer(part, initialRow, 'initial'));
      const observe = async phase => {
        const observation = await capture(parts, initialRow, phase);
        result.observations.push(observation);
        return observation;
      };
      const setWidth = width => {
        initialRow.resize(width, initialRow.height);
        initialRow.layoutSizingHorizontal = 'FIXED';
        initialRow.layoutSizingVertical = 'HUG';
      };
      await observe('short240');
      setWidth(390);
      await observe('short390');
      parts.forEach((part, index) => {
        part.expectedLabel = packet.labels.long[index];
        part.consumer.setProperties({ [part.labelKey]: part.expectedLabel });
      });
      await observe('long390');
      setWidth(240);
      await observe('long240');
      // Exercise transparent Default, opaque Selected and opaque Hover silhouettes.
      parts.forEach((part, index) =>
        appearances(part, ['default', 'selected', 'hover'][index])
      );
      const editedBaseline = await observe('long240 endpoint paints');
      const retained = observation =>
        observation.samples.map(value => ({
          id: value.body.id,
          text: value.text.id,
          rings: value.rings.map(ring => ring.id),
          main: value.actualMainId,
          key: value.labelKey,
          label: value.text.characters,
          property: value.properties[value.labelKey],
          style: value.text.textStyleId,
          font: value.text.fontName,
          size: value.text.fontSize,
          line: value.text.lineHeight,
          aliases: value.text.boundVariables,
          range: value.text.ranges,
          width: value.body.width,
          height: value.body.height,
        }));
      const fresh = [];
      for (let pass = 1; pass <= 2; pass++) {
        for (const part of masters) await typography(part.text); // No characters/property/ring writes.
        const after = await observe(
          `after private-master typography reapplication ${pass}`
        );
        after.exactEditedBaselinePreserved = mgSegmentedFocusSame(
          retained(after),
          retained(editedBaseline)
        );
        for (const cohort of fresh) {
          const old = await capture(
            cohort.parts,
            cohort.row,
            `retained fresh${cohort.pass} after reapplication${pass}`
          );
          old.exactFreshBaselinePreserved = mgSegmentedFocusSame(
            retained(old),
            retained(cohort.baseline)
          );
          result.observations.push(old);
        }
        const freshRow = row(policy, pass, column),
          freshParts = masters.map(part =>
            consumer(part, freshRow, `fresh${pass}`)
          );
        const baseline = await capture(
          freshParts,
          freshRow,
          `new fresh cohort${pass} short240`
        );
        result.observations.push(baseline);
        fresh.push({ pass, row: freshRow, parts: freshParts, baseline });
      }
      parts.forEach((part, index) => {
        part.expectedLabel = packet.labels.default[index];
        part.consumer.setProperties({ [part.labelKey]: part.expectedLabel });
      });
      setWidth(240);
      await observe('restored short240 visible First Middle Last');
      result.findings = {
        sourceAndIdentity: result.observations.every(
          value =>
            value.semanticOrderPreserved &&
            value.samples.every(sample =>
              [
                'identity',
                'property',
                'sharedTypography',
                'sourceBox',
                'sourcePaints',
                'bodyCorners',
                'outlineBindings',
                'constantStrokeAndCorners',
                'paintOrder',
                'outlinePolicy',
                'unclipped',
                'visiblePaint',
              ].every(field => sample.findings[field])
            )
        ),
        nativeFractionalSizing: result.observations.every(
          value =>
            value.equalAllocation &&
            value.rowHugAndChildFill &&
            value.samples.every(sample => sample.findings.coincidentBounds)
        ),
        editedAndFreshBaselines: result.observations
          .filter(
            value =>
              'exactEditedBaselinePreserved' in value ||
              'exactFreshBaselinePreserved' in value
          )
          .every(
            value =>
              (value.exactEditedBaselinePreserved ?? true) &&
              (value.exactFreshBaselinePreserved ?? true)
          ),
        visualBandsVerified: false,
        middleOcclusionVerified: false,
      };
      result.supported = false;
      result.sizingCandidateSatisfied =
        result.findings.sourceAndIdentity &&
        result.findings.nativeFractionalSizing &&
        result.findings.editedAndFreshBaselines;
      result.limitations = [
        'Native readbacks must establish sizing. Synthetic mocks do not simulate constraints, fractional auto layout, shared-style caches or shadow/stroke pixels.',
        'All positions are visible diagnostic samples, not multiple simultaneous keyboard focus or accepted joined paint stacking.',
      ];
    });
  root.clipsContent = false;
}
