/* global figma, mgReadIdentity, mgWriteIdentity, mgSegmentedJoiningPreflight */
// Native edited/fresh consumer evidence, bounded to the source-owned canonical subset.
const MG_SEGMENTED_CANONICAL_FAMILY = 'segmented-control.segment';
const MG_SEGMENTED_CANONICAL_MANIFEST = 'mgSegmentedCanonicalManifest';
const MG_SEGMENTED_CANONICAL_VARIANTS = [
  'segmented-control.segment.false.default.first',
  'segmented-control.segment.true.default.first',
  'segmented-control.segment.false.hover.first',
];
function mgSegmentedCanonicalJSON(value) {
  return JSON.parse(
    JSON.stringify(value, (_key, item) =>
      typeof item === 'symbol' ? '[mixed]' : item
    )
  );
}
function mgSegmentedCanonicalSame(a, b) {
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
function mgSegmentedCanonicalAlias(value, id) {
  const aliases = Array.isArray(value) ? value : value ? [value] : [];
  return (
    aliases.length > 0 &&
    aliases.every(alias => alias?.type === 'VARIABLE_ALIAS' && alias.id === id)
  );
}
function mgSegmentedCanonicalFont(value) {
  const font = mgSegmentedCanonicalJSON(value);
  if (font.variationSettings && !Object.keys(font.variationSettings).length)
    delete font.variationSettings;
  return font;
}
function mgSegmentedCanonicalPercent(actual, expected) {
  return (
    actual?.unit === 'PERCENT' &&
    [expected, Math.fround(expected / 100) * 100].some(
      value => Math.abs(actual.value - value) <= 1e-6
    )
  );
}
async function mgSegmentedCanonicalSnapshot(node, plan) {
  node = await figma.getNodeByIdAsync(node.id);
  if (!node || node.removed || !['COMPONENT', 'INSTANCE'].includes(node.type))
    throw new Error('The exact segment node is unavailable or changed type.');
  const labels = [];
  for (const child of node.children || []) {
    const fresh = await figma.getNodeByIdAsync(child.id);
    if (fresh?.type === 'TEXT') labels.push(fresh);
  }
  if (labels.length !== 1 || node.children.length !== 1)
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
        paint: mgSegmentedCanonicalJSON(paint),
        variableId: alias?.id || null,
        resolved: variable
          ? mgSegmentedCanonicalJSON(variable.resolveForConsumer(node).value)
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
  return mgSegmentedCanonicalJSON({
    id: node.id,
    type: node.type,
    parentId: node.parent?.id || null,
    key: mgReadIdentity(node, 'mgKitId'),
    mainComponentId: main?.id || null,
    bounds: bounds(node),
    layoutMode: node.layoutMode,
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
      ranges: paintList(label.getRangeFills(0, label.characters.length)),
    },
  });
}
function mgSegmentedCanonicalSourceFindings(snapshot, member, plan) {
  const spec = plan.specs.find(value => value.id === member.variantId);
  const roles = plan.byName;
  const roleAlias = (value, name) =>
    mgSegmentedCanonicalAlias(value, roles.get(name).variable.id);
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
  };
  // Native uniform strokeWeight aliases expand into the four stroke*Weight fields.
  const aliases = Object.entries(frameRoles).every(([field, name]) =>
    field === 'strokeWeight'
      ? roleAlias(snapshot.boundVariables?.strokeWeight, name) ||
        [
          'strokeTopWeight',
          'strokeRightWeight',
          'strokeBottomWeight',
          'strokeLeftWeight',
        ].every(key => roleAlias(snapshot.boundVariables?.[key], name))
      : roleAlias(snapshot.boundVariables?.[field], name)
  );
  const isEdited = member.kind === 'edited';
  return {
    variantAxes: mgSegmentedCanonicalSame(
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
    fontName: mgSegmentedCanonicalSame(
      mgSegmentedCanonicalFont(snapshot.text.fontName),
      mgSegmentedCanonicalFont(plan.font)
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
    sourceLineHeight: mgSegmentedCanonicalPercent(
      snapshot.text.lineHeight,
      120
    ),
    textAttributes:
      snapshot.text.textDecoration === 'NONE' &&
      snapshot.text.textWrapStyle === 'AUTO',
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
    bodyStroke: paintMatches(snapshot.strokes, spec.tree.stroke),
    frameAliases: aliases,
    padding: plan.equal(snapshot.padding, {
      top: plan.source.geometry.paddingBlock,
      bottom: plan.source.geometry.paddingBlock,
      left: plan.source.geometry.paddingInline,
      right: plan.source.geometry.paddingInline,
    }),
    corners: plan.equal(snapshot.corners, plan.source.geometry.corners.First),
    border:
      Math.abs(snapshot.strokeWeight - plan.source.geometry.border) <= 1e-6 &&
      snapshot.strokeAlign === 'INSIDE' &&
      snapshot.strokesIncludedInLayout === true,
    minimum:
      Math.abs(snapshot.minHeight - plan.source.geometry.minHeight) <= 1e-6,
    axes:
      snapshot.layoutMode === 'HORIZONTAL' &&
      snapshot.vertical === 'HUG' &&
      snapshot.horizontal === (isEdited ? 'FIXED' : 'HUG') &&
      snapshot.clipsContent === false,
    editedWidth: !isEdited || Math.abs(snapshot.bounds.width - 240) <= 1e-6,
    alignment:
      snapshot.text.textAlignHorizontal === (isEdited ? 'RIGHT' : 'CENTER'),
  };
}
function mgSegmentedCanonicalRequireFindings(findings, label) {
  const failures = Object.entries(findings)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);
  if (failures.length)
    throw new Error(`${label}: source checks failed (${failures.join(', ')}).`);
}
async function mgSegmentedCanonicalPreflight(
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
    throw new Error(`Segmented canonical: ${message}`);
  };
  const families = (doc.components?.families || []).filter(
    value => value.id === MG_SEGMENTED_CANONICAL_FAMILY
  );
  if (families.length !== 1) fail('one source family is required.');
  const family = families[0];
  const specs = MG_SEGMENTED_CANONICAL_VARIANTS.map(id => {
    const matches = family.variants.filter(value => value.id === id);
    if (matches.length !== 1)
      fail(`missing or duplicate source variant ${id}.`);
    const spec = matches[0],
      label = spec.tree?.children?.[0];
    if (
      spec.tree?.type !== 'FRAME' ||
      spec.tree.children.length !== 1 ||
      label?.type !== 'TEXT' ||
      label.textProperty !== 'Label' ||
      label.characters !== 'Depth' ||
      label.textStyle !== 'component.segmented-control.segment' ||
      label.textStyleApplication !== undefined ||
      spec.properties.Position !== 'First'
    )
      fail('unsupported source anatomy, property or style application.');
    const index = MG_SEGMENTED_CANONICAL_VARIANTS.indexOf(id);
    const axes = [
      { Selected: 'False', State: 'Default', Position: 'First' },
      { Selected: 'True', State: 'Default', Position: 'First' },
      { Selected: 'False', State: 'Hover', Position: 'First' },
    ][index];
    const stateName = ['default', 'selected', 'hover'][index];
    const sourcePaint = plan.source.paints[stateName];
    const bindingRoles = {
      strokeWeight: plan.roles.border.name,
      topLeftRadius: plan.roles.radius.name,
      bottomLeftRadius: plan.roles.radius.name,
      topRightRadius: plan.roles.zero.name,
      bottomRightRadius: plan.roles.zero.name,
      paddingTop: plan.roles.paddingBlock.name,
      paddingBottom: plan.roles.paddingBlock.name,
      paddingLeft: plan.roles.paddingInline.name,
      paddingRight: plan.roles.paddingInline.name,
    };
    if (
      !mgSegmentedCanonicalSame(spec.properties, axes) ||
      spec.tree.fill !== sourcePaint.fill ||
      spec.tree.stroke !== sourcePaint.stroke ||
      label.fill !== sourcePaint.text ||
      label.stroke !== null ||
      label.textDecoration !== 'NONE' ||
      label.textWrap !== 'AUTO' ||
      label.textAlign !== 'CENTER' ||
      spec.tree.layout?.mode !== 'HORIZONTAL' ||
      spec.tree.layout.width !== 'HUG' ||
      spec.tree.layout.height !== 'HUG' ||
      spec.tree.layout.minHeight !==
        'component/segmented-control/minimum-height' ||
      spec.tree.layout.align !== 'CENTER' ||
      spec.tree.layout.justify !== 'CENTER' ||
      spec.tree.layout.gap !== plan.roles.zero.name ||
      !mgSegmentedCanonicalSame(label.layout, {
        width: 'HUG',
        height: 'HUG',
      }) ||
      !mgSegmentedCanonicalSame(spec.tree.bindings, bindingRoles) ||
      spec.tree.effectStyle !== null ||
      spec.tree.strokesIncludedInLayout !== true ||
      spec.tree.clipsContent !== false
    )
      fail(
        'three source axes, paints, layout and bindings must match the guarded packet.'
      );
    return spec;
  });
  const nativeVariables = await figma.variables.getLocalVariablesAsync();
  const helperName = 'component/segmented-control/minimum-height';
  const helperDefs = doc.variables.filter(value => value.name === helperName);
  const helperVars = nativeVariables.filter(
    value => mgReadIdentity(value, 'mgId') === helperDefs[0]?.id
  );
  if (
    helperDefs.length !== 1 ||
    helperDefs[0].type !== 'FLOAT' ||
    helperDefs[0].values?.[brandId] !== plan.source.geometry.minHeight ||
    helperVars.length !== 1 ||
    helperVars[0].name !== helperName ||
    helperVars[0].resolvedType !== 'FLOAT' ||
    helperVars[0].variableCollectionId !== collection.id ||
    helperVars[0].valuesByMode?.[mode.modeId] !== plan.source.geometry.minHeight
  )
    fail('exact imported minimum-height role is required.');
  const minimum = {
    name: helperName,
    id: helperDefs[0].id,
    type: 'FLOAT',
    expected: plan.source.geometry.minHeight,
    variable: helperVars[0],
  };
  plan.roles.minimum = minimum;
  plan.byName.set(helperName, minimum);
  const styleSpecs = (doc.styles?.text || []).filter(
    value => value.id === 'component.segmented-control.segment'
  );
  const nativeStyles = (await figma.getLocalTextStylesAsync()).filter(
    value =>
      mgReadIdentity(value, 'mgStyleId') ===
      'component.segmented-control.segment'
  );
  const styleSource = styleSpecs[0]?.values?.[brandId],
    style = nativeStyles[0];
  if (
    styleSpecs.length !== 1 ||
    nativeStyles.length !== 1 ||
    styleSource?.fontName?.family !== plan.font.family ||
    styleSource.fontName.style !== plan.font.style ||
    styleSource.fontSize !== plan.source.typography.segment.fontSize ||
    !mgSegmentedCanonicalPercent(styleSource.lineHeight, 120) ||
    styleSource.textDecoration !== 'NONE' ||
    styleSource.textWrapStyle !== 'AUTO' ||
    style.fontName?.family !== plan.font.family ||
    style.fontName.style !== plan.font.style ||
    style.fontSize !== styleSource.fontSize ||
    !mgSegmentedCanonicalPercent(style.lineHeight, 120) ||
    style.textDecoration !== 'NONE' ||
    style.textWrapStyle !== 'AUTO'
  )
    fail('exact imported shared120% segment style is required.');
  for (const [field, key] of [
    ['fontFamily', 'fontFamily'],
    ['fontSize', 'fontSize'],
  ])
    if (
      styleSpecs[0].bindings?.[field] !== plan.roles[key].name ||
      !mgSegmentedCanonicalAlias(
        style.boundVariables?.[field],
        plan.roles[key].variable.id
      )
    )
      fail(`exact shared style ${field} binding is required.`);
  const ownedNodes = figma.currentPage.findAll(node =>
    ['COMPONENT_SET', 'COMPONENT'].includes(node.type)
  );
  const setMatches = ownedNodes.filter(
    node =>
      node.type === 'COMPONENT_SET' &&
      mgReadIdentity(node, 'mgKitId') === `family/${family.id}`
  );
  if (setMatches.length !== 1) fail('one exact canonical set is required.');
  const set = setMatches[0];
  const labelKeys = Object.entries(set.componentPropertyDefinitions).filter(
    ([key, value]) =>
      key.replace(/#[^#]+$/, '') === 'Label' && value.type === 'TEXT'
  );
  if (labelKeys.length !== 1 || labelKeys[0][1].defaultValue !== 'Depth')
    fail('one source Label TEXT property is required.');
  plan.family = family;
  plan.specs = specs;
  plan.style = style;
  plan.font = { ...style.fontName };
  plan.set = set;
  plan.labelKey = labelKeys[0][0];
  plan.collection = collection;
  plan.mode = mode;
  plan.masters = [];
  for (const spec of specs) {
    const matches = set.children.filter(
      node =>
        node.type === 'COMPONENT' &&
        mgReadIdentity(node, 'mgKitId') ===
          `family/${family.id}/variant/${spec.id}`
    );
    if (matches.length !== 1)
      fail(`one exact canonical master ${spec.id} is required.`);
    const master = matches[0];
    const labels = master.children.filter(
      node =>
        node.type === 'TEXT' &&
        mgReadIdentity(node, 'mgKitId') ===
          `family/${family.id}/variant/${spec.id}/${spec.tree.children[0].id}`
    );
    if (labels.length !== 1)
      fail('one exact canonical Label descendant is required.');
    const member = {
      variantId: spec.id,
      masterId: master.id,
      textId: labels[0].id,
      expectedLabel: 'Depth',
      kind: 'canonical',
    };
    const snapshot = await mgSegmentedCanonicalSnapshot(master, plan);
    mgSegmentedCanonicalRequireFindings(
      mgSegmentedCanonicalSourceFindings(snapshot, member, plan),
      spec.id
    );
    plan.masters.push({ ...member, node: master, snapshot });
  }
  report.fonts.requested.push(plan.font);
  await figma.loadFontAsync(plan.font);
  report.fonts.loaded.push(plan.font);
  report.preflight.segmentedCanonical = {
    familyId: family.id,
    setId: set.id,
    styleId: style.id,
    labelKey: plan.labelKey,
    collectionId: collection.id,
    modeId: mode.modeId,
    masterIds: plan.masters.map(value => value.masterId),
    sourceTypography: {
      fontName: plan.font,
      fontSize: style.fontSize,
      lineHeight: style.lineHeight,
    },
  };
  report.limitations = [
    'Canonical three-variant UNDRR subset only. No canonical node, variable or style is changed by this operation.',
    'Acceptance requires the initial edited/fresh cohorts and two newly completed ordinary scoped rebuilds, each followed by a new fresh cohort.',
    'Build chronology is enforced by the UI workflow and saved evidence; a build report does not cryptographically authenticate a native rebuild.',
    'Source line-height accepts the authored120% and native float32 ratio representation; exact before/after snapshots retain every raw field.',
    'The mock verifies control flow and ownership only, not Figma shared-style cache propagation, fonts, geometry or pixels.',
    'Focus, joining, middle/last, wrapping, other brands, browser interaction and raster equality are outside this acceptance scope.',
  ];
  return plan;
}
function mgSegmentedCanonicalProbeId(report, cohortId, variantId, instanceId) {
  return `capability/${report.runId}/segmented-canonical/${cohortId}/${variantId}/${instanceId}`;
}
function mgSegmentedCanonicalCompact(report) {
  const state = report.segmentedCanonical;
  return {
    version: 1,
    scope: report.scope,
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
    ledger: report.ledger,
    members: state.cohorts.flatMap(cohort =>
      cohort.members.map(member => ({
        cohort: cohort.id,
        variantId: member.variantId,
        instanceId: member.instanceId,
        probeId: member.probeId,
        textId: member.textId,
        masterId: member.masterId,
        kind: member.kind,
        expectedLabel: member.expectedLabel,
      }))
    ),
  };
}
function mgSegmentedCanonicalPersist(root, report) {
  const text = JSON.stringify(mgSegmentedCanonicalCompact(report));
  if (text.length > 60000)
    throw new Error(
      'Segmented canonical manifest exceeds its bounded storage limit.'
    );
  mgWriteIdentity(root, MG_SEGMENTED_CANONICAL_MANIFEST, text);
}
async function mgSegmentedCanonicalOwned(report) {
  if (
    report?.kind !== 'mangrove-native-capability-probes' ||
    report.version !== 1 ||
    report.scope !== 'segmented-canonical' ||
    typeof report.runId !== 'string' ||
    !report.rootId ||
    report.segmentedCanonical?.version !== 1 ||
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
    root.parent?.id !== report.segmentedCanonical.rootParentId ||
    root.parent?.id !== figma.currentPage.id ||
    mgReadIdentity(root, 'mgCapabilityProbeId') !== report.runId
  )
    throw new Error('The exact owned root is missing, moved or changed.');
  const stored = mgReadIdentity(root, MG_SEGMENTED_CANONICAL_MANIFEST);
  if (
    !stored ||
    !mgSegmentedCanonicalSame(
      JSON.parse(stored),
      mgSegmentedCanonicalCompact(report)
    )
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
  for (const member of report.segmentedCanonical.cohorts.flatMap(cohort =>
    cohort.members.map(member => ({ ...member, cohortId: cohort.id }))
  )) {
    const node = await figma.getNodeByIdAsync(member.instanceId),
      text = await figma.getNodeByIdAsync(member.textId);
    if (
      node?.type !== 'INSTANCE' ||
      member.probeId !==
        mgSegmentedCanonicalProbeId(
          report,
          member.cohortId,
          member.variantId,
          member.instanceId
        ) ||
      mgReadIdentity(node, 'mgKitId') !== member.probeId ||
      node.parent?.id !== root.id ||
      text?.type !== 'TEXT' ||
      text.parent?.id !== node.id ||
      node.children.length !== 1 ||
      (await node.getMainComponentAsync())?.id !== member.masterId
    )
      throw new Error(
        'An exact consumer was moved, detached, changed or gained children.'
      );
  }
  return root;
}
async function mgSegmentedCanonicalCohort(context, plan, cohort) {
  const { report, root, instance } = context;
  report.segmentedCanonical.cohorts.push(cohort);
  for (const [index, master] of plan.masters.entries()) {
    const node = instance(master.node, root);
    const probeId = mgSegmentedCanonicalProbeId(
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
      kind: cohort.kind,
      expectedLabel: edited
        ? ['Edited Depth', 'Edited selection', 'Edited hover'][index]
        : 'Depth',
      snapshot: null,
    };
    cohort.members.push(member);
    // The core instance factory already records every descendant before any edits.
    mgSegmentedCanonicalPersist(root, report);
    node.x = cohort.column * 340 + 32;
    node.y = cohort.row * 300 + 40 + index * 80;
    if (edited) {
      node.setProperties({ [plan.labelKey]: member.expectedLabel });
      node.setBoundVariable('width', null);
      node.resize(240, node.height);
      node.layoutSizingHorizontal = 'FIXED';
      node.layoutSizingVertical = 'HUG';
      text.textAlignHorizontal = 'RIGHT';
    }
    const snapshot = await mgSegmentedCanonicalSnapshot(node, plan);
    member.snapshot = snapshot;
    member.findings = mgSegmentedCanonicalSourceFindings(
      snapshot,
      member,
      plan
    );
    mgSegmentedCanonicalPersist(root, report);
    mgSegmentedCanonicalRequireFindings(
      member.findings,
      `${cohort.id}/${master.variantId}`
    );
  }
}
async function mgRunSegmentedCanonicalProbes(context, plan) {
  const { report, root } = context;
  report.segmentedCanonical = {
    version: 1,
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
  mgSegmentedCanonicalPersist(root, report);
  try {
    await mgSegmentedCanonicalCohort(context, plan, {
      id: 'initial-edited',
      kind: 'edited',
      phase: 0,
      column: 0,
      row: 0,
      members: [],
    });
    await mgSegmentedCanonicalCohort(context, plan, {
      id: 'initial-fresh',
      kind: 'fresh',
      phase: 0,
      column: 1,
      row: 0,
      members: [],
    });
    report.segmentedCanonical.initialVerified = true;
  } catch (error) {
    report.errors.push(
      `Segmented canonical prepare: ${error?.message || error}`
    );
    report.segmentedCanonical.errors.push(error?.message || String(error));
    report.segmentedCanonical.verdict = 'failed';
  }
  mgSegmentedCanonicalPersist(root, report);
}
async function advanceMangroveSegmentedCanonicalProbes(
  doc,
  brandId,
  report,
  buildResult
) {
  report = mgSegmentedCanonicalJSON(report);
  let authorizedRoot = null;
  try {
    const root = await mgSegmentedCanonicalOwned(report);
    authorizedRoot = root;
    const state = report.segmentedCanonical;
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
    const plan = await mgSegmentedCanonicalPreflight(
      doc,
      brandId,
      collections[0],
      mode,
      report
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
      // A full-family build may contain additional leaves. This gate still
      // captures and compares only its original three declared variants.
      built.length !== plan.family.variants.length ||
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
        'The build did not update the exact three canonical masters and labels.'
      );
    const phase = state.completedAdvances + 1;
    const observation = {
      phase,
      canonical: [],
      cohorts: [],
      newCohortId: `fresh-after-repeat-${phase}`,
      buildResult: mgSegmentedCanonicalJSON(buildResult),
      errors: [],
    };
    state.advances.push(observation);
    for (const master of plan.masters) {
      const before = state.canonicalBaseline.find(
        value => value.masterId === master.masterId
      );
      if (
        !before ||
        !mgSegmentedCanonicalSame(before.snapshot, master.snapshot)
      )
        throw new Error(
          'A canonical full snapshot changed across the ordinary repeat.'
        );
      observation.canonical.push({
        variantId: master.variantId,
        snapshot: master.snapshot,
        findings: mgSegmentedCanonicalSourceFindings(
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
        const snapshot = await mgSegmentedCanonicalSnapshot(node, plan);
        const findings = mgSegmentedCanonicalSourceFindings(
          snapshot,
          member,
          plan
        );
        current.members.push({
          instanceId: member.instanceId,
          snapshot,
          findings,
        });
        mgSegmentedCanonicalRequireFindings(
          findings,
          `${cohort.id}/${member.variantId}`
        );
        if (!mgSegmentedCanonicalSame(snapshot, member.snapshot))
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
    await mgSegmentedCanonicalCohort(context, plan, {
      id: observation.newCohortId,
      kind: 'fresh',
      phase,
      column: phase - 1,
      row: 1,
      members: [],
    });
    state.completedAdvances = phase;
    state.verdict = phase === 2 ? 'accepted' : 'pending';
    mgSegmentedCanonicalPersist(root, report);
    await mgSegmentedCanonicalOwned(report);
  } catch (error) {
    const message = error?.message || String(error);
    report.errors = report.errors || [];
    report.errors.push(`Segmented canonical advance: ${message}`);
    if (report.segmentedCanonical) {
      report.segmentedCanonical.errors.push(message);
      report.segmentedCanonical.verdict = 'failed';
      if (
        authorizedRoot &&
        mgReadIdentity(authorizedRoot, 'mgCapabilityProbeId') === report.runId
      )
        try {
          mgSegmentedCanonicalPersist(authorizedRoot, report);
        } catch (storage) {
          report.errors.push(
            `Manifest persistence: ${storage?.message || storage}`
          );
        }
    }
  }
  return report;
}
