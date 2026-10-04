/* global figma, mgReadIdentity, mgWriteIdentity, mgSegmentedCanonicalPreflight, mgSegmentedFocusSizingPreflight */
// Native edited/fresh consumer evidence, bounded to the source-owned canonical subset.
const MG_SEGMENTED_LEAVES_FAMILY = 'segmented-control.segment';
const MG_SEGMENTED_LEAVES_MANIFEST = 'mgSegmentedLeavesManifest';
const MG_SEGMENTED_LEAVES_STATES = [
  'Default',
  'Hover',
  'Focus',
  'HoverFocus',
  'Disabled',
];
function mgSegmentedLeavesJSON(value) {
  return JSON.parse(
    JSON.stringify(value, (_key, item) =>
      typeof item === 'symbol' ? '[mixed]' : item
    )
  );
}
function mgSegmentedLeavesSame(a, b) {
  const stable = value => {
    if (Array.isArray(value)) return value.map(stable);
    if (value && typeof value === 'object')
      return Object.fromEntries(
        Object.keys(value)
          .sort()
          .map(key => [key, stable(value[key])])
      );
    return value;
  };
  return JSON.stringify(stable(a)) === JSON.stringify(stable(b));
}
function mgSegmentedLeavesAlias(value, id) {
  const aliases = Array.isArray(value) ? value : value ? [value] : [];
  return (
    aliases.length === 1 &&
    aliases.every(alias => alias?.type === 'VARIABLE_ALIAS' && alias.id === id)
  );
}
function mgSegmentedLeavesStrokeAlias(bindings, name, plan) {
  const matches = value =>
    mgSegmentedLeavesAlias(value, plan.byName.get(name).variable.id);
  const sides = [
    'strokeTopWeight',
    'strokeRightWeight',
    'strokeBottomWeight',
    'strokeLeftWeight',
  ];
  const hasSides = sides.some(field => bindings?.[field]);
  return hasSides
    ? sides.every(field => matches(bindings?.[field])) &&
        (!bindings.strokeWeight || matches(bindings.strokeWeight))
    : matches(bindings?.strokeWeight);
}
function mgSegmentedLeavesFont(value) {
  const font = mgSegmentedLeavesJSON(value);
  if (font.variationSettings && !Object.keys(font.variationSettings).length)
    delete font.variationSettings;
  return font;
}
function mgSegmentedLeavesPercent(actual, expected) {
  return (
    actual?.unit === 'PERCENT' &&
    [expected, Math.fround(expected / 100) * 100].some(
      value => Math.abs(actual.value - value) <= 1e-6
    )
  );
}
async function mgSegmentedLeavesSnapshot(node, plan) {
  node = await figma.getNodeByIdAsync(node.id);
  if (!node || node.removed || !['COMPONENT', 'INSTANCE'].includes(node.type))
    throw new Error('The exact segment node is unavailable or changed type.');
  const labels = [];
  for (const child of node.children || []) {
    const fresh = await figma.getNodeByIdAsync(child.id);
    if (fresh?.type === 'TEXT') labels.push(fresh);
  }
  const snapshotMain =
    node.type === 'INSTANCE' ? await node.getMainComponentAsync() : node;
  const mainSourceId = () =>
    mgReadIdentity(snapshotMain, 'mgKitId').split('/variant/')[1];
  const spec = plan.specs.find(value => value.id === mainSourceId());
  if (
    labels.length !== 1 ||
    !spec ||
    node.children.length !== (spec.tree.focusRing ? 3 : 1)
  )
    throw new Error('The segment must contain exactly one source TEXT child.');
  const label = labels[0];
  const paintList = paints => {
    if (!Array.isArray(paints)) return '[mixed]';
    return paints.map(paint => {
      const alias = paint.boundVariables?.color;
      const variable = Object.values(plan.roles)
        .map(role => role.variable)
        .find(item => item.id === alias?.id);
      return {
        paint: mgSegmentedLeavesJSON(paint),
        variableId: alias?.id || null,
        resolved: variable
          ? mgSegmentedLeavesJSON(variable.resolveForConsumer(node).value)
          : null,
      };
    });
  };
  const bounds = target => ({
    x: target.x,
    y: target.y,
    width: target.width,
    height: target.height,
  });
  const main =
    node.type === 'INSTANCE' ? await node.getMainComponentAsync() : null;
  return mgSegmentedLeavesJSON({
    childIds: node.children.map(child => child.id),
    itemReverseZIndex: node.itemReverseZIndex,
    rings: node.children
      .filter(child => child.type === 'RECTANGLE')
      .map(child => ({
        id: child.id,
        parentId: child.parent.id,
        key: mgReadIdentity(child, 'mgKitId'),
        bounds: bounds(child),
        constraints: child.constraints,
        layoutPositioning: child.layoutPositioning,
        visible: child.visible,
        opacity: child.opacity,
        strokes: paintList(child.strokes),
        fills: paintList(child.fills),
        effects: child.effects,
        effectStyleId: child.effectStyleId,
        strokeWeight: child.strokeWeight,
        strokeAlign: child.strokeAlign,
        strokeJoin: child.strokeJoin,
        corners: [
          'topLeftRadius',
          'topRightRadius',
          'bottomLeftRadius',
          'bottomRightRadius',
        ].map(field => child[field]),
        boundVariables: child.boundVariables,
      })),
    id: node.id,
    type: node.type,
    parentId: node.parent?.id || null,
    key: mgReadIdentity(node, 'mgKitId'),
    mainComponentId: main?.id || null,
    bounds: bounds(node),
    layoutMode: node.layoutMode,
    primaryAxisAlignItems: node.primaryAxisAlignItems,
    counterAxisAlignItems: node.counterAxisAlignItems,
    itemSpacing: node.itemSpacing,
    horizontal: node.layoutSizingHorizontal,
    vertical: node.layoutSizingVertical,
    clipsContent: node.clipsContent,
    effects: node.effects,
    effectStyleId: node.effectStyleId,
    visible: node.visible,
    opacity: node.opacity,
    minHeight: node.minHeight,
    padding: {
      top: node.paddingTop,
      bottom: node.paddingBottom,
      left: node.paddingLeft,
      right: node.paddingRight,
    },
    corners: [
      'topLeftRadius',
      'topRightRadius',
      'bottomLeftRadius',
      'bottomRightRadius',
    ].map(field => node[field]),
    strokeAlign: node.strokeAlign,
    strokeWeight: node.strokeWeight,
    strokesIncludedInLayout: node.strokesIncludedInLayout,
    boundVariables: node.boundVariables,
    variantProperties: node.variantProperties || null,
    properties: node.type === 'INSTANCE' ? node.componentProperties : null,
    fills: paintList(node.fills),
    strokes: paintList(node.strokes),
    text: {
      id: label.id,
      type: label.type,
      parentId: label.parent?.id || null,
      key: mgReadIdentity(label, 'mgKitId'),
      bounds: bounds(label),
      characters: label.characters,
      effects: label.effects,
      effectStyleId: label.effectStyleId,
      visible: label.visible,
      opacity: label.opacity,
      fontName: label.fontName,
      fontSize: label.fontSize,
      lineHeight: label.lineHeight,
      textStyleId: label.textStyleId,
      textDecoration: label.textDecoration,
      textWrapStyle: label.textWrapStyle,
      textAlignHorizontal: label.textAlignHorizontal,
      textAutoResize: label.textAutoResize,
      horizontal: label.layoutSizingHorizontal,
      vertical: label.layoutSizingVertical,
      componentPropertyReferences: label.componentPropertyReferences,
      boundVariables: label.boundVariables,
      fills: paintList(label.fills),
      strokes: paintList(label.strokes),
      ranges: paintList(label.getRangeFills(0, label.characters.length)),
    },
  });
}
function mgSegmentedLeavesSourceFindings(snapshot, member, plan) {
  const spec = plan.specs.find(value => value.id === member.variantId);
  const roles = plan.byName;
  const roleAlias = (value, name) =>
    mgSegmentedLeavesAlias(value, roles.get(name).variable.id);
  const paintMatches = (paints, name) =>
    name === null
      ? Array.isArray(paints) && paints.length === 0
      : Array.isArray(paints) &&
        paints.length === 1 &&
        paints[0].paint.type === 'SOLID' &&
        paints[0].paint.visible !== false &&
        Math.abs((paints[0].paint.opacity ?? 1) - 1) <= 1e-6 &&
        paints[0].variableId === roles.get(name).variable.id &&
        plan.equal(paints[0].resolved, roles.get(name).expected);
  const frameRoles = {
    ...spec.tree.bindings,
    minHeight: spec.tree.layout.minHeight,
    itemSpacing: spec.tree.layout.gap,
  };
  // Native uniform strokeWeight aliases expand into the four stroke*Weight fields.
  const aliases = Object.entries(frameRoles).every(([field, name]) =>
    field === 'strokeWeight'
      ? mgSegmentedLeavesStrokeAlias(snapshot.boundVariables, name, plan)
      : roleAlias(snapshot.boundVariables?.[field], name)
  );
  const isEdited = member.kind === 'edited';
  return {
    focus: mgSegmentedLeavesFocusFindings(snapshot, spec, plan),
    variantAxes: mgSegmentedLeavesSame(
      snapshot.variantProperties,
      spec.properties
    ),
    probeIdentity:
      member.kind === 'canonical'
        ? snapshot.key ===
          `family/${plan.family.id}/variant/${member.variantId}`
        : snapshot.key === member.probeId,
    inheritedTextIdentity:
      snapshot.text.key ===
      `family/${plan.family.id}/variant/${member.variantId}/${spec.tree.children[0].id}`,
    actualMain:
      snapshot.type === 'COMPONENT'
        ? snapshot.id === member.masterId
        : snapshot.mainComponentId === member.masterId,
    labelIdentity:
      snapshot.text.id === member.textId &&
      snapshot.text.parentId === snapshot.id,
    labelReference:
      snapshot.text.componentPropertyReferences?.characters === plan.labelKey,
    labelContent: snapshot.text.characters === member.expectedLabel,
    labelProperty:
      snapshot.type === 'COMPONENT' ||
      (snapshot.properties?.[plan.labelKey]?.type === 'TEXT' &&
        snapshot.properties[plan.labelKey].value === member.expectedLabel),
    nativeSharedStyle: snapshot.text.textStyleId === plan.style.id,
    fontName: mgSegmentedLeavesSame(
      mgSegmentedLeavesFont(snapshot.text.fontName),
      mgSegmentedLeavesFont(plan.font)
    ),
    noEffects:
      Array.isArray(snapshot.effects) &&
      snapshot.effects.length === 0 &&
      !snapshot.effectStyleId &&
      Array.isArray(snapshot.text.effects) &&
      snapshot.text.effects.length === 0 &&
      !snapshot.text.effectStyleId,
    visibleOpacity:
      snapshot.visible === true &&
      snapshot.opacity === 1 &&
      snapshot.text.visible === true &&
      snapshot.text.opacity === 1,
    fontSize:
      Math.abs(
        snapshot.text.fontSize - plan.source.typography.segment.fontSize
      ) <= 1e-6,
    sourceLineHeight: mgSegmentedLeavesPercent(snapshot.text.lineHeight, 120),
    textAttributes:
      snapshot.text.textDecoration === 'NONE' &&
      snapshot.text.textWrapStyle === 'AUTO' &&
      snapshot.text.textAutoResize === 'WIDTH_AND_HEIGHT' &&
      snapshot.text.horizontal === 'HUG' &&
      snapshot.text.vertical === 'HUG',
    typographyAliases:
      roleAlias(
        snapshot.text.boundVariables?.fontFamily,
        plan.roles.fontFamily.name
      ) &&
      roleAlias(
        snapshot.text.boundVariables?.fontSize,
        plan.roles.fontSize.name
      ),
    nominalTextPaint: paintMatches(
      snapshot.text.fills,
      spec.tree.children[0].fill
    ),
    effectiveRangePaint: paintMatches(
      snapshot.text.ranges,
      spec.tree.children[0].fill
    ),
    bodyFill: paintMatches(snapshot.fills, spec.tree.fill),
    noTextStroke:
      Array.isArray(snapshot.text.strokes) &&
      snapshot.text.strokes.length === 0,
    bodyStroke: paintMatches(snapshot.strokes, spec.tree.stroke),
    frameAliases: aliases,
    padding: plan.equal(snapshot.padding, {
      top: plan.source.geometry.paddingBlock,
      bottom: plan.source.geometry.paddingBlock,
      left: plan.source.geometry.paddingInline,
      right: plan.source.geometry.paddingInline,
    }),
    corners: plan.equal(
      snapshot.corners,
      plan.source.geometry.corners[spec.properties.Position]
    ),
    border:
      Math.abs(snapshot.strokeWeight - plan.source.geometry.border) <= 1e-6 &&
      snapshot.strokeAlign === 'INSIDE' &&
      snapshot.strokesIncludedInLayout === true,
    minimum:
      Math.abs(snapshot.minHeight - plan.source.geometry.minHeight) <= 1e-6,
    axes:
      snapshot.layoutMode === 'HORIZONTAL' &&
      snapshot.primaryAxisAlignItems === 'CENTER' &&
      snapshot.counterAxisAlignItems === 'CENTER' &&
      snapshot.itemSpacing === 0 &&
      snapshot.vertical === 'HUG' &&
      snapshot.horizontal === (isEdited ? 'FIXED' : 'HUG') &&
      snapshot.clipsContent === false,
    editedWidth: !isEdited || Math.abs(snapshot.bounds.width - 240) <= 1e-6,
    alignment:
      snapshot.text.textAlignHorizontal === (isEdited ? 'RIGHT' : 'CENTER'),
  };
}
function mgSegmentedLeavesRequireFindings(findings, label) {
  const failures = Object.entries(findings)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);
  if (failures.length)
    throw new Error(`${label}: source checks failed (${failures.join(', ')}).`);
}
function mgSegmentedLeavesFocusFindings(snapshot, spec, plan) {
  if (!spec.tree.focusRing)
    return (
      snapshot.rings.length === 0 &&
      mgSegmentedLeavesSame(snapshot.childIds, [snapshot.text.id])
    );
  const corners = [
    'topLeftRadius',
    'topRightRadius',
    'bottomLeftRadius',
    'bottomRightRadius',
  ];
  const roleAlias = (value, name) =>
    mgSegmentedLeavesAlias(value, plan.byName.get(name).variable.id);
  const strokeAlias = (ring, name) =>
    mgSegmentedLeavesStrokeAlias(ring.boundVariables, name, plan);
  const base = `family/${plan.family.id}/variant/${spec.id}`;
  return (
    snapshot.itemReverseZIndex === false &&
    mgSegmentedLeavesSame(snapshot.childIds, [
      ...snapshot.rings.map(ring => ring.id),
      snapshot.text.id,
    ]) &&
    snapshot.rings.length === 2 &&
    snapshot.rings.every((ring, index) => {
      const expected = spec.tree.focusRing;
      const stroke = index === 0 ? expected.outerStroke : expected.offset;
      const color = index === 0 ? expected.color : expected.separatorColor;
      const paints = ring.strokes;
      return (
        ring.key === `${base}/focus/${index === 0 ? 'outer' : 'separator'}` &&
        ring.parentId === snapshot.id &&
        ring.bounds.x === 0 &&
        ring.bounds.y === 0 &&
        ring.bounds.width === snapshot.bounds.width &&
        ring.bounds.height === snapshot.bounds.height &&
        ring.constraints.horizontal === 'SCALE' &&
        ring.constraints.vertical === 'SCALE' &&
        ring.layoutPositioning === 'ABSOLUTE' &&
        ring.visible === true &&
        ring.opacity === 1 &&
        ring.strokeAlign === 'OUTSIDE' &&
        ring.strokeJoin === 'MITER' &&
        !ring.fills.length &&
        !ring.effects.length &&
        !ring.effectStyleId &&
        ring.strokeWeight === plan.byName.get(stroke).expected &&
        strokeAlias(ring, stroke) &&
        mgSegmentedLeavesSame(ring.corners, snapshot.corners) &&
        corners.every(field =>
          roleAlias(ring.boundVariables[field], expected.cornerBindings[field])
        ) &&
        paints.length === 1 &&
        paints[0].paint.type === 'SOLID' &&
        paints[0].paint.visible !== false &&
        (paints[0].paint.opacity ?? 1) === 1 &&
        paints[0].variableId === plan.byName.get(color).variable.id &&
        plan.equal(paints[0].resolved, plan.byName.get(color).expected)
      );
    })
  );
}
async function mgSegmentedLeavesPreflight(
  doc,
  brandId,
  collection,
  mode,
  report,
  batchState
) {
  if (!MG_SEGMENTED_LEAVES_STATES.includes(batchState))
    throw new Error('Unknown Segmented Default leaf batch.');
  if (report.scope !== 'segmented-leaves-' + batchState.toLowerCase())
    throw new Error(
      'The Default leaf batch differs from its diagnostic scope.'
    );
  const plan = await mgSegmentedCanonicalPreflight(
    doc,
    brandId,
    collection,
    mode,
    report
  );
  const focus = await mgSegmentedFocusSizingPreflight(
    doc,
    brandId,
    collection,
    mode,
    report
  );
  const family = plan.family;
  if (family.variants.length !== 30)
    throw new Error('The exact30 source Default leaf matrix is required.');
  plan.batchState = batchState;
  plan.roles.sum = focus.sumRole;
  plan.byName.set(focus.sumRole.name, focus.sumRole);
  const fields = [
    'topLeftRadius',
    'topRightRadius',
    'bottomLeftRadius',
    'bottomRightRadius',
  ];
  const expectedIds = [];
  for (const selected of ['False', 'True'])
    for (const state of MG_SEGMENTED_LEAVES_STATES)
      for (const position of ['First', 'Middle', 'Last']) {
        const id = `segmented-control.segment.${selected.toLowerCase()}.${state.toLowerCase()}.${position.toLowerCase()}`;
        expectedIds.push(id);
        const matches = family.variants.filter(spec => spec.id === id);
        if (matches.length !== 1)
          throw new Error('Missing or duplicated Default leaf source variant.');
        const spec = matches[0],
          tree = spec.tree,
          label = tree.children?.[0];
        const paintName =
          state === 'Disabled'
            ? selected === 'True'
              ? 'selectedDisabled'
              : 'disabled'
            : ['Hover', 'HoverFocus'].includes(state)
              ? selected === 'True'
                ? 'selectedHover'
                : 'hover'
              : selected === 'True'
                ? 'selected'
                : 'default';
        const paints = plan.source.paints[paintName];
        const corners = Object.fromEntries(
          fields.map((field, index) => [
            field,
            plan.roles[
              plan.source.geometry.corners[position][index] === 0
                ? 'zero'
                : 'radius'
            ].name,
          ])
        );
        const bindings = {
          strokeWeight: plan.roles.border.name,
          ...corners,
          paddingTop: plan.roles.paddingBlock.name,
          paddingBottom: plan.roles.paddingBlock.name,
          paddingLeft: plan.roles.paddingInline.name,
          paddingRight: plan.roles.paddingInline.name,
        };
        if (
          !mgSegmentedLeavesSame(spec.properties, {
            Selected: selected,
            State: state,
            Position: position,
          }) ||
          tree.type !== 'FRAME' ||
          tree.children.length !== 1 ||
          label.type !== 'TEXT' ||
          label.textProperty !== 'Label' ||
          label.characters !== 'Depth' ||
          label.textStyle !== 'component.segmented-control.segment' ||
          label.textStyleApplication !== undefined ||
          label.fill !== paints.text ||
          label.stroke !== null ||
          label.textDecoration !== 'NONE' ||
          label.textWrap !== 'AUTO' ||
          label.textAlign !== 'CENTER' ||
          !mgSegmentedLeavesSame(label.layout, {
            width: 'HUG',
            height: 'HUG',
          }) ||
          tree.fill !== paints.fill ||
          tree.stroke !== paints.stroke ||
          !mgSegmentedLeavesSame(tree.bindings, bindings) ||
          tree.layout.mode !== 'HORIZONTAL' ||
          tree.layout.width !== 'HUG' ||
          tree.layout.height !== 'HUG' ||
          tree.layout.minHeight !== plan.roles.minimum.name ||
          tree.layout.align !== 'CENTER' ||
          tree.layout.justify !== 'CENTER' ||
          tree.layout.gap !== plan.roles.zero.name ||
          tree.strokesIncludedInLayout !== true ||
          tree.clipsContent !== false ||
          tree.effectStyle !== null
        )
          throw new Error(
            'Default leaf source axes, typography, paints or geometry changed.'
          );
        const focused = ['Focus', 'HoverFocus'].includes(state);
        if (focused) {
          if (
            !mgSegmentedLeavesSame(tree.focusRing, {
              renderer: 'COINCIDENT_SCALE',
              color: plan.roles.focusColor.name,
              separatorColor: plan.roles.separatorColor.name,
              offset: plan.roles.focusOffset.name,
              width: plan.roles.focusWidth.name,
              outerStroke: focus.sumRole.name,
              cornerBindings: corners,
            })
          )
            throw new Error(
              'The exact source coincident focus recipe is required.'
            );
        } else if (tree.focusRing !== undefined)
          throw new Error(
            'Nonfocused source states must not have focus outlines.'
          );
      }
  if (
    new Set(family.variants.map(spec => spec.id)).size !== 30 ||
    !family.variants.every(spec => expectedIds.includes(spec.id))
  )
    throw new Error('Unexpected Default leaf source identities.');
  plan.specs = family.variants;
  plan.masters = [];
  for (const spec of plan.specs) {
    const key = `family/${family.id}/variant/${spec.id}`;
    const matches = plan.set.children.filter(
      node =>
        node.type === 'COMPONENT' && mgReadIdentity(node, 'mgKitId') === key
    );
    if (matches.length !== 1)
      throw new Error('An exact Default leaf canonical master is unavailable.');
    const node = matches[0];
    const labels = node.children.filter(
      child =>
        child.type === 'TEXT' &&
        mgReadIdentity(child, 'mgKitId') ===
          `${key}/${spec.tree.children[0].id}`
    );
    if (labels.length !== 1)
      throw new Error('An exact Default leaf canonical label is unavailable.');
    const member = {
      variantId: spec.id,
      masterId: node.id,
      textId: labels[0].id,
      expectedLabel: 'Depth',
      kind: 'canonical',
    };
    const snapshot = await mgSegmentedLeavesSnapshot(node, plan);
    mgSegmentedLeavesRequireFindings(
      mgSegmentedLeavesSourceFindings(snapshot, member, plan),
      spec.id
    );
    plan.masters.push({ ...member, node, snapshot });
  }
  if (plan.set.children.length !== 30)
    throw new Error('Unexpected canonical set children.');
  report.preflight.segmentedLeaves = {
    familyId: family.id,
    batchState,
    setId: plan.set.id,
    styleId: plan.style.id,
    labelKey: plan.labelKey,
    allMasterIds: plan.masters.map(member => member.masterId),
    testedVariantIds: plan.specs
      .filter(spec => spec.properties.State === batchState)
      .map(spec => spec.id),
  };
  report.limitations = [
    'All30 canonical Default leaves are read; one explicit six-variant State batch has edited/fresh consumers through two ordinary full-family builds.',
    'Exact shared style, aliases, range paints, source roles and saved repeat snapshots are required. No DIRECT exception.',
    'Intrinsic Label HUG is retained. Fractional full-width Label FILL stress and rail compositions require separate evidence.',
    'Getter geometry and ordinary rebuild fields do not establish matched browser pixels, middle focus occlusion, Small, RTL, other brands or font-file equality.',
    'Prior accepted3 variant/TEXT identities must additionally be compared with the saved pre-expansion inspection; this operation cannot invent that historical evidence.',
  ];
  return plan;
}

function mgSegmentedLeavesProbeId(report, cohortId, variantId, instanceId) {
  return `capability/${report.runId}/segmented-leaves/${cohortId}/${variantId}/${instanceId}`;
}
// Bounded integrity fingerprints detect changed saved baselines. They do not
// authenticate native execution or protect against deliberate hash collisions.
function mgSegmentedLeavesFingerprint(value) {
  const stable = item =>
    Array.isArray(item)
      ? item.map(stable)
      : item && typeof item === 'object'
        ? Object.fromEntries(
            Object.keys(item)
              .sort()
              .map(key => [key, stable(item[key])])
          )
        : item;
  const text = JSON.stringify(stable(value));
  return [2166136261, 2246822507, 3266489909, 668265263]
    .map(seed => {
      let hash = seed;
      for (let index = 0; index < text.length; index++)
        hash = Math.imul(hash ^ text.charCodeAt(index), 16777619) >>> 0;
      return hash.toString(16).padStart(8, '0');
    })
    .join('');
}
function mgSegmentedLeavesCompact(report) {
  const state = report.segmentedLeaves;
  return {
    version: 1,
    scope: report.scope,
    batchState: state.batchState,
    runId: report.runId,
    rootId: report.rootId,
    rootParentId: state.rootParentId,
    brandId: report.brandId,
    collectionId: state.collectionId,
    modeId: state.modeId,
    setId: state.setId,
    styleId: state.styleId,
    labelKey: state.labelKey,
    completedAdvances: state.completedAdvances,
    canonicalBaselines: state.canonicalBaseline.map(member => ({
      variantId: member.variantId,
      masterId: member.masterId,
      textId: member.textId,
      fingerprint: mgSegmentedLeavesFingerprint(member.snapshot),
    })),
    ledger: report.ledger,
    members: state.cohorts.flatMap(cohort =>
      cohort.members.map(member => ({
        cohort: cohort.id,
        variantId: member.variantId,
        instanceId: member.instanceId,
        probeId: member.probeId,
        textId: member.textId,
        childIds: member.childIds,
        masterId: member.masterId,
        kind: member.kind,
        expectedLabel: member.expectedLabel,
        baselineFingerprint: mgSegmentedLeavesFingerprint(member.snapshot),
      }))
    ),
  };
}
function mgSegmentedLeavesPersist(root, report) {
  const text = JSON.stringify(mgSegmentedLeavesCompact(report));
  if (text.length > 60000)
    throw new Error(
      'Segmented Default leaves manifest exceeds its bounded storage limit.'
    );
  mgWriteIdentity(root, MG_SEGMENTED_LEAVES_MANIFEST, text);
}
async function mgSegmentedLeavesOwned(report) {
  if (
    report?.kind !== 'mangrove-native-capability-probes' ||
    report.version !== 1 ||
    !MG_SEGMENTED_LEAVES_STATES.some(
      state => report.scope === 'segmented-leaves-' + state.toLowerCase()
    ) ||
    typeof report.runId !== 'string' ||
    !report.rootId ||
    report.segmentedLeaves?.version !== 1 ||
    report.scope !==
      'segmented-leaves-' + report.segmentedLeaves?.batchState?.toLowerCase() ||
    !Array.isArray(report.ledger)
  )
    throw new Error('An exact saved segmented canonical report is required.');
  const ids = new Set(report.ledger.map(entry => entry.id));
  if (ids.size !== report.ledger.length || !ids.has(report.rootId))
    throw new Error('The segmented ledger is duplicated or incomplete.');
  const root = await figma.getNodeByIdAsync(report.rootId);
  if (
    !root ||
    root.type !== 'FRAME' ||
    root.parent?.id !== report.segmentedLeaves.rootParentId ||
    root.parent?.id !== figma.currentPage.id ||
    mgReadIdentity(root, 'mgCapabilityProbeId') !== report.runId
  )
    throw new Error('The exact owned root is missing, moved or changed.');
  const stored = mgReadIdentity(root, MG_SEGMENTED_LEAVES_MANIFEST);
  if (
    !stored ||
    !mgSegmentedLeavesSame(JSON.parse(stored), mgSegmentedLeavesCompact(report))
  )
    throw new Error('Saved report does not match the root creation manifest.');
  const present = new Set();
  async function visit(node, parentId) {
    const entry = report.ledger.find(value => value.id === node.id);
    if (
      !entry ||
      entry.type !== node.type ||
      node.parent?.id !== parentId ||
      mgReadIdentity(node, 'mgCapabilityProbeId') !== report.runId
    )
      throw new Error(
        `Foreign, moved, unrecorded or changed probe ${node.id}.`
      );
    present.add(node.id);
    for (const child of node.children || []) {
      const fresh = await figma.getNodeByIdAsync(child.id);
      if (!fresh) throw new Error('Missing probe descendant.');
      await visit(fresh, node.id);
    }
  }
  await visit(root, root.parent.id);
  if (present.size !== ids.size)
    throw new Error(
      'Recorded assets survive outside the exact probe root or are missing.'
    );
  for (const member of report.segmentedLeaves.cohorts.flatMap(cohort =>
    cohort.members.map(member => ({ ...member, cohortId: cohort.id }))
  )) {
    const node = await figma.getNodeByIdAsync(member.instanceId),
      text = await figma.getNodeByIdAsync(member.textId);
    if (
      node?.type !== 'INSTANCE' ||
      member.probeId !==
        mgSegmentedLeavesProbeId(
          report,
          member.cohortId,
          member.variantId,
          member.instanceId
        ) ||
      mgReadIdentity(node, 'mgKitId') !== member.probeId ||
      node.parent?.id !== root.id ||
      text?.type !== 'TEXT' ||
      text.parent?.id !== node.id ||
      !mgSegmentedLeavesSame(
        node.children.map(child => child.id),
        member.childIds
      ) ||
      (await node.getMainComponentAsync())?.id !== member.masterId
    )
      throw new Error(
        'An exact consumer was moved, detached, changed or gained children.'
      );
  }
  return root;
}
async function mgSegmentedLeavesCohort(context, plan, cohort) {
  const { report, root, instance } = context;
  report.segmentedLeaves.cohorts.push(cohort);
  for (const [index, master] of plan.masters
    .filter(
      item =>
        plan.specs.find(spec => spec.id === item.variantId).properties.State ===
        plan.batchState
    )
    .entries()) {
    const node = instance(master.node, root);
    const probeId = mgSegmentedLeavesProbeId(
      report,
      cohort.id,
      master.variantId,
      node.id
    );
    // INSTANCE roots inherit their canonical source identity. Give this owned
    // probe a distinct key before the builder can index it or we take baselines.
    mgWriteIdentity(node, 'mgKitId', probeId);
    const text = node.children.find(child => child.type === 'TEXT');
    const edited = cohort.kind === 'edited';
    const member = {
      variantId: master.variantId,
      masterId: master.masterId,
      instanceId: node.id,
      probeId,
      textId: text?.id || null,
      childIds: node.children.map(child => child.id),
      kind: cohort.kind,
      expectedLabel: edited
        ? `Edited ${plan.batchState} ${index + 1}`
        : 'Depth',
      snapshot: null,
    };
    cohort.members.push(member);
    // The core instance factory already records every descendant before any edits.
    mgSegmentedLeavesPersist(root, report);
    node.x = cohort.column * 340 + 32;
    node.y = cohort.row * 650 + 40 + index * 90;
    if (edited) {
      node.setProperties({ [plan.labelKey]: member.expectedLabel });
      node.setBoundVariable('width', null);
      node.resize(240, node.height);
      node.layoutSizingHorizontal = 'FIXED';
      node.layoutSizingVertical = 'HUG';
      text.textAlignHorizontal = 'RIGHT';
    }
    const snapshot = await mgSegmentedLeavesSnapshot(node, plan);
    member.snapshot = snapshot;
    member.findings = mgSegmentedLeavesSourceFindings(snapshot, member, plan);
    mgSegmentedLeavesPersist(root, report);
    mgSegmentedLeavesRequireFindings(
      member.findings,
      `${cohort.id}/${master.variantId}`
    );
  }
}
async function mgRunSegmentedLeavesProbes(context, plan) {
  const { report, root } = context;
  report.segmentedLeaves = {
    version: 1,
    batchState: plan.batchState,
    familyId: plan.family.id,
    rootParentId: root.parent.id,
    collectionId: plan.collection.id,
    modeId: plan.mode.modeId,
    setId: plan.set.id,
    styleId: plan.style.id,
    labelKey: plan.labelKey,
    canonicalBaseline: plan.masters.map(({ node, ...member }) => member),
    cohorts: [],
    advances: [],
    completedAdvances: 0,
    verdict: 'pending',
    errors: [],
  };
  mgSegmentedLeavesPersist(root, report);
  try {
    await mgSegmentedLeavesCohort(context, plan, {
      id: 'initial-edited',
      kind: 'edited',
      phase: 0,
      column: 0,
      row: 0,
      members: [],
    });
    await mgSegmentedLeavesCohort(context, plan, {
      id: 'initial-fresh',
      kind: 'fresh',
      phase: 0,
      column: 1,
      row: 0,
      members: [],
    });
    report.segmentedLeaves.initialVerified = true;
  } catch (error) {
    report.errors.push(
      `Segmented Default leaves prepare: ${error?.message || error}`
    );
    report.segmentedLeaves.errors.push(error?.message || String(error));
    report.segmentedLeaves.verdict = 'failed';
  }
  mgSegmentedLeavesPersist(root, report);
}
async function advanceMangroveSegmentedLeavesProbes(
  doc,
  brandId,
  report,
  buildResult
) {
  report = mgSegmentedLeavesJSON(report);
  let authorizedRoot = null;
  try {
    const root = await mgSegmentedLeavesOwned(report);
    authorizedRoot = root;
    const state = report.segmentedLeaves;
    if (
      report.errors.length ||
      state.errors.length ||
      !state.initialVerified ||
      state.completedAdvances >= 2
    )
      throw new Error('The run is failed, incomplete or already completed.');
    if (brandId !== report.brandId)
      throw new Error('The source brand differs from the prepared run.');
    const collections = (
      await figma.variables.getLocalVariableCollectionsAsync()
    ).filter(
      value => value.id === state.collectionId && value.name === doc.collection
    );
    if (collections.length !== 1)
      throw new Error('The exact prepared collection is unavailable.');
    const mode = collections[0].modes.find(
      value =>
        value.modeId === state.modeId &&
        value.name === doc.modes.find(item => item.id === brandId)?.name
    );
    if (!mode) throw new Error('The exact prepared brand mode is unavailable.');
    const plan = await mgSegmentedLeavesPreflight(
      doc,
      brandId,
      collections[0],
      mode,
      report,
      state.batchState
    );
    if (
      plan.set.id !== state.setId ||
      plan.style.id !== state.styleId ||
      plan.labelKey !== state.labelKey
    )
      throw new Error('Canonical set, style or Label key changed.');
    if (
      !buildResult ||
      !Array.isArray(buildResult.errors) ||
      buildResult.errors.length ||
      !Array.isArray(buildResult.createdNodeIds) ||
      buildResult.createdNodeIds.length ||
      !Array.isArray(buildResult.updatedNodeIds) ||
      buildResult.families?.length !== 1 ||
      buildResult.families[0].id !== plan.family.id ||
      buildResult.families[0].setId !== plan.set.id
    )
      throw new Error(
        'One successful zero-create ordinary scoped build is required.'
      );
    const built = buildResult.families[0].variantIds;
    if (
      !Array.isArray(built) ||
      built.length !== 30 ||
      plan.masters.some(
        master =>
          !built.some(
            item =>
              item.id === master.variantId && item.nodeId === master.masterId
          ) ||
          !buildResult.updatedNodeIds.includes(master.masterId) ||
          !buildResult.updatedNodeIds.includes(master.textId)
      )
    )
      throw new Error(
        'The build did not update all30 exact canonical masters and labels.'
      );
    const phase = state.completedAdvances + 1;
    const observation = {
      phase,
      canonical: [],
      cohorts: [],
      newCohortId: `fresh-after-repeat-${phase}`,
      buildResult: mgSegmentedLeavesJSON(buildResult),
      errors: [],
    };
    state.advances.push(observation);
    for (const master of plan.masters) {
      const before = state.canonicalBaseline.find(
        value => value.masterId === master.masterId
      );
      if (!before || !mgSegmentedLeavesSame(before.snapshot, master.snapshot))
        throw new Error(
          'A canonical full snapshot changed across the ordinary repeat.'
        );
      observation.canonical.push({
        variantId: master.variantId,
        snapshot: master.snapshot,
        findings: mgSegmentedLeavesSourceFindings(
          master.snapshot,
          master,
          plan
        ),
      });
    }
    for (const cohort of state.cohorts) {
      const current = { id: cohort.id, members: [] };
      observation.cohorts.push(current);
      for (const member of cohort.members) {
        const node = await figma.getNodeByIdAsync(member.instanceId);
        const snapshot = await mgSegmentedLeavesSnapshot(node, plan);
        const findings = mgSegmentedLeavesSourceFindings(
          snapshot,
          member,
          plan
        );
        current.members.push({
          instanceId: member.instanceId,
          snapshot,
          findings,
        });
        mgSegmentedLeavesRequireFindings(
          findings,
          `${cohort.id}/${member.variantId}`
        );
        if (!mgSegmentedLeavesSame(snapshot, member.snapshot))
          throw new Error(
            `Existing cohort ${cohort.id} full snapshot changed.`
          );
      }
    }
    const recorded = new Set(report.ledger.map(value => value.id));
    const record = node => {
      if (recorded.has(node.id))
        throw new Error('A new cohort returned an existing owned ID.');
      recorded.add(node.id);
      report.ledger.push({ id: node.id, type: node.type });
      mgWriteIdentity(node, 'mgCapabilityProbeId', report.runId);
      for (const child of node.children || []) record(child);
      return node;
    };
    const context = {
      report,
      root,
      instance: (master, parent) => {
        const node = record(master.createInstance());
        parent.appendChild(node);
        return node;
      },
    };
    await mgSegmentedLeavesCohort(context, plan, {
      id: observation.newCohortId,
      kind: 'fresh',
      phase,
      column: phase - 1,
      row: 1,
      members: [],
    });
    state.completedAdvances = phase;
    state.verdict = phase === 2 ? 'rebuild-fields-verified' : 'pending';
    mgSegmentedLeavesPersist(root, report);
    await mgSegmentedLeavesOwned(report);
  } catch (error) {
    const message = error?.message || String(error);
    report.errors = report.errors || [];
    report.errors.push(`Segmented Default leaves advance: ${message}`);
    if (report.segmentedLeaves) {
      report.segmentedLeaves.errors.push(message);
      report.segmentedLeaves.verdict = 'failed';
      if (
        authorizedRoot &&
        mgReadIdentity(authorizedRoot, 'mgCapabilityProbeId') === report.runId
      )
        try {
          mgSegmentedLeavesPersist(authorizedRoot, report);
        } catch (storage) {
          report.errors.push(
            `Manifest persistence: ${storage?.message || storage}`
          );
        }
    }
  }
  return report;
}
