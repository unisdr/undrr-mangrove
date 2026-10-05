/* global figma, mgReadIdentity, mgWriteIdentity, mgSegmentedLeavesPreflight, mgSegmentedLeavesSnapshot, mgSegmentedLeavesSourceFindings, mgSegmentedLeavesSame, mgSegmentedLeavesJSON, mgSegmentedLeavesAlias, mgSegmentedLeavesFont, mgSegmentedLeavesFingerprint, removeMangroveCapabilityProbes */
// Native four-preset composition acceptance. No canonical, style or variable writes.
const MG_SEGMENTED_WRAPPER_FAMILY = 'segmented-control.full-width-below-medium';
const MG_SEGMENTED_WRAPPER_MANIFEST = 'mgSegmentedWrapperManifest';
const MG_SEGMENTED_WRAPPER_LONG_LEGEND =
  'Map layers supporting disaster risk reduction and community resilience';
function mgSegmentedWrapperRequire(findings, label) {
  const failed = Object.entries(findings)
    .filter(([, passed]) => !passed)
    .map(([key]) => key);
  if (failed.length) throw new Error(`${label}: ${failed.join(', ')}`);
}
function mgSegmentedWrapperProbeId(report, cohort, variant, id) {
  return `capability/${report.runId}/segmented-wrapper/${cohort}/${variant}/${id}`;
}
function mgSegmentedWrapperNear(a, b) {
  return (
    Number.isFinite(a) &&
    Number.isFinite(b) &&
    [b, Math.fround(b)].some(value => Math.abs(a - value) <= 1e-6)
  );
}
// Auto-layout allocates positions and individual child widths in float32;
// one ULP is bounded to these fresh allocation fields, never exact baselines.
function mgSegmentedWrapperAllocationNear(actual, expected) {
  if (!Number.isFinite(actual) || !Number.isFinite(expected)) return false;
  const magnitude = Math.max(Math.abs(actual), Math.abs(expected));
  const ulp = magnitude ? 2 ** (Math.floor(Math.log2(magnitude)) - 23) : 0;
  return Math.abs(actual - expected) <= Math.max(1e-6, ulp);
}
async function mgSegmentedWrapperSnapshot(node, plan) {
  node = await figma.getNodeByIdAsync(node.id);
  if (!node || node.removed || !['INSTANCE', 'COMPONENT'].includes(node.type))
    throw new Error('Exact wrapper unavailable.');
  const main =
    node.type === 'INSTANCE' ? await node.getMainComponentAsync() : node;
  const spec = plan.family.variants.find(
    value =>
      mgReadIdentity(main, 'mgKitId') ===
      `family/${plan.family.id}/variant/${value.id}`
  );
  if (!spec || node.children.length !== 2)
    throw new Error('Wrapper master/anatomy changed.');
  const legend = await figma.getNodeByIdAsync(node.children[0].id),
    rail = await figma.getNodeByIdAsync(node.children[1].id);
  if (
    legend?.type !== 'TEXT' ||
    rail?.type !== 'FRAME' ||
    rail.children.length !== 3
  )
    throw new Error('Wrapper Legend/rail topology changed.');
  const bounds = target => ({
    x: target.x,
    y: target.y,
    width: target.width,
    height: target.height,
  });
  const common = target => ({
    id: target.id,
    type: target.type,
    parentId: target.parent?.id,
    key: mgReadIdentity(target, 'mgKitId'),
    bounds: bounds(target),
    visible: target.visible,
    opacity: target.opacity,
    children: (target.children || []).map(child => child.id),
    horizontal: target.layoutSizingHorizontal,
    vertical: target.layoutSizingVertical,
    boundVariables: target.boundVariables,
    fills: target.fills,
    strokes: target.strokes,
    effects: target.effects,
    effectStyleId: target.effectStyleId || '',
    clipsContent: target.clipsContent,
  });
  const leaf = [];
  for (const child of rail.children) {
    const fresh = await figma.getNodeByIdAsync(child.id);
    if (fresh?.type !== 'INSTANCE')
      throw new Error('A rail child is not an INSTANCE.');
    leaf.push({
      isExposedInstance: fresh.isExposedInstance,
      ...(await mgSegmentedLeavesSnapshot(fresh, plan.leaf)),
    });
  }
  return mgSegmentedLeavesJSON({
    ...common(node),
    variantId: spec.id,
    mainComponentId: node.type === 'INSTANCE' ? main.id : null,
    properties: node.type === 'INSTANCE' ? node.componentProperties : null,
    variantProperties: node.variantProperties || null,
    layoutMode: node.layoutMode,
    itemSpacing: node.itemSpacing,
    exposedInstanceIds:
      node.type === 'INSTANCE'
        ? node.exposedInstances.map(child => child.id)
        : null,
    legend: {
      ...common(legend),
      characters: legend.characters,
      fontName: legend.fontName,
      fontSize: legend.fontSize,
      lineHeight: legend.lineHeight,
      textStyleId: legend.textStyleId,
      textDecoration: legend.textDecoration,
      textWrapStyle: legend.textWrapStyle,
      textAutoResize: legend.textAutoResize,
      textAlignHorizontal: legend.textAlignHorizontal,
      componentPropertyReferences: legend.componentPropertyReferences,
      ranges: legend.getRangeFills(0, legend.characters.length),
    },
    rail: {
      ...common(rail),
      layoutMode: rail.layoutMode,
      itemSpacing: rail.itemSpacing,
      layoutWrap: rail.layoutWrap,
      primaryAxisAlignItems: rail.primaryAxisAlignItems,
      counterAxisAlignItems: rail.counterAxisAlignItems,
    },
    leaf,
  });
}
function mgSegmentedWrapperFindings(snapshot, member, plan) {
  const spec = plan.family.variants.find(
      value => value.id === member.variantId
    ),
    same = mgSegmentedLeavesSame,
    near = mgSegmentedWrapperNear;
  const aliases = (value, role) =>
    mgSegmentedLeavesAlias(value, role.variable.id);
  const rootKey = `family/${plan.family.id}/variant/${spec.id}`;
  const transparent = value => Array.isArray(value) && value.length === 0;
  const noEffects = node => transparent(node.effects) && !node.effectStyleId;
  const expectedRoot = member.kind === 'canonical' ? rootKey : member.probeId;
  const legend = snapshot.legend,
    rail = snapshot.rail;
  const textPaint = paints =>
    Array.isArray(paints) &&
    paints.length === 1 &&
    paints[0].type === 'SOLID' &&
    paints[0].visible !== false &&
    (paints[0].opacity ?? 1) === 1 &&
    aliases(paints[0].boundVariables?.color, plan.leaf.roles.legendColor) &&
    plan.leaf.equal(paints[0].color, {
      r: plan.leaf.roles.legendColor.expected.r,
      g: plan.leaf.roles.legendColor.expected.g,
      b: plan.leaf.roles.legendColor.expected.b,
    });
  const findings = {
    rootIdentity:
      snapshot.id === member.instanceId &&
      snapshot.key === expectedRoot &&
      snapshot.variantId === member.variantId &&
      (member.kind === 'canonical'
        ? snapshot.type === 'COMPONENT'
        : snapshot.type === 'INSTANCE' &&
          snapshot.mainComponentId === member.masterId),
    rootAxes:
      snapshot.layoutMode === 'VERTICAL' &&
      snapshot.horizontal === 'FIXED' &&
      snapshot.vertical === 'HUG' &&
      near(snapshot.itemSpacing, plan.gap.expected) &&
      aliases(snapshot.boundVariables.itemSpacing, plan.gap),
    rootPaint:
      transparent(snapshot.fills) &&
      transparent(snapshot.strokes) &&
      noEffects(snapshot) &&
      snapshot.clipsContent === false &&
      snapshot.visible === true &&
      snapshot.opacity === 1,
    width: near(snapshot.bounds.width, member.width),
    legendIdentity:
      legend.id === member.legendId &&
      legend.parentId === snapshot.id &&
      legend.key === `${rootKey}/${spec.tree.children[0].id}`,
    legendReferences:
      legend.componentPropertyReferences?.characters === plan.legendKey &&
      legend.componentPropertyReferences?.visible === plan.showLegendKey,
    legendProperty:
      snapshot.type === 'COMPONENT' ||
      (snapshot.properties?.[plan.legendKey]?.type === 'TEXT' &&
        snapshot.properties[plan.legendKey].value === member.legend &&
        snapshot.properties?.[plan.showLegendKey]?.type === 'BOOLEAN' &&
        snapshot.properties[plan.showLegendKey].value === member.showLegend),
    legendContent:
      legend.characters === member.legend &&
      legend.visible === member.showLegend &&
      legend.opacity === 1,
    legendStyle:
      legend.textStyleId === plan.legendStyle.id &&
      same(legend.fontName, plan.legendFont) &&
      near(legend.fontSize, 16) &&
      same(legend.lineHeight, { unit: 'PIXELS', value: 24 }),
    legendAliases:
      aliases(legend.boundVariables?.fontFamily, plan.leaf.roles.fontFamily) &&
      aliases(legend.boundVariables?.fontSize, plan.leaf.roles.legendFontSize),
    legendAttributes:
      legend.textDecoration === 'NONE' &&
      legend.textWrapStyle === 'AUTO' &&
      legend.textAutoResize === 'HEIGHT' &&
      (!member.showLegend ||
        (legend.horizontal === 'FILL' && legend.vertical === 'HUG')) &&
      legend.textAlignHorizontal === 'LEFT',
    legendPaint:
      textPaint(legend.fills) &&
      textPaint(legend.ranges) &&
      transparent(legend.strokes) &&
      noEffects(legend),
    legendWidth:
      !member.showLegend ||
      (near(legend.bounds.x, 0) &&
        near(legend.bounds.width, snapshot.bounds.width) &&
        legend.bounds.width > 0 &&
        legend.bounds.height >= 24),
    railIdentity:
      rail.id === member.railId &&
      rail.parentId === snapshot.id &&
      rail.key === `${rootKey}/${spec.tree.children[1].id}`,
    railAxes:
      rail.layoutMode === 'HORIZONTAL' &&
      rail.horizontal === 'FILL' &&
      rail.vertical === 'HUG' &&
      rail.layoutWrap === 'NO_WRAP' &&
      rail.primaryAxisAlignItems === 'MIN' &&
      rail.counterAxisAlignItems === 'MIN',
    railPaint:
      transparent(rail.fills) &&
      transparent(rail.strokes) &&
      noEffects(rail) &&
      rail.clipsContent === false &&
      rail.visible === true &&
      rail.opacity === 1,
    seamAlias:
      aliases(rail.boundVariables?.itemSpacing, plan.seam) &&
      near(rail.itemSpacing, plan.seam.expected),
    railWidth:
      near(rail.bounds.x, 0) && near(rail.bounds.width, snapshot.bounds.width),
    verticalFlow:
      near(
        rail.bounds.y,
        member.showLegend ? legend.bounds.height + plan.gap.expected : 0
      ) && near(snapshot.bounds.height, rail.bounds.y + rail.bounds.height),
    exposure:
      snapshot.type === 'COMPONENT' ||
      same(
        [...snapshot.exposedInstanceIds].sort(),
        snapshot.leaf.map(item => item.id).sort()
      ),
    short390Height:
      member.width !== 390 ||
      !same(member.labels, plan.shortLabels) ||
      near(rail.bounds.height, 44),
  };
  const allocation = (snapshot.bounds.width - 2 * plan.seam.expected) / 3;
  snapshot.leaf.forEach((child, index) => {
    const childSpec = spec.tree.children[1].children[index],
      leafSpec = plan.leaf.specs.find(value =>
        same(value.properties, childSpec.variant)
      );
    const main = plan.leaf.masters.find(
      value => value.variantId === leafSpec.id
    );
    const leafMember = {
      kind: 'fresh',
      variantId: leafSpec.id,
      masterId: main.masterId,
      textId: member.textIds[index],
      expectedLabel: member.labels[index],
      probeId: `${rootKey}/${spec.tree.children[1].id}/${childSpec.id}`,
    };
    const f = mgSegmentedLeavesSourceFindings(child, leafMember, plan.leaf);
    // The wrapper intentionally changes only source sizing policies on primary
    // nested instances; verify those actual fields rather than pretend leaf HUG.
    f.axes =
      child.layoutMode === 'HORIZONTAL' &&
      child.primaryAxisAlignItems === 'CENTER' &&
      child.counterAxisAlignItems === 'CENTER' &&
      near(child.itemSpacing, 0) &&
      child.horizontal === 'FILL' &&
      child.vertical === 'FILL' &&
      child.clipsContent === false;
    f.textAttributes =
      child.text.textDecoration === 'NONE' &&
      child.text.textWrapStyle === 'AUTO' &&
      child.text.textAutoResize === 'HEIGHT' &&
      child.text.horizontal === 'FILL' &&
      child.text.vertical === 'HUG';
    for (const [key, value] of Object.entries(f))
      findings[`leaf${index + 1}.${key}`] = value;
    findings[`leaf${index + 1}.identity`] =
      child.id === member.leafIds[index] &&
      child.parentId === rail.id &&
      child.isExposedInstance === true;
    findings[`leaf${index + 1}.allocation`] =
      mgSegmentedWrapperAllocationNear(child.bounds.width, allocation) &&
      mgSegmentedWrapperAllocationNear(
        child.bounds.x,
        index * (allocation + plan.seam.expected)
      ) &&
      near(child.bounds.y, 0) &&
      near(child.bounds.height, rail.bounds.height);
    const inset = plan.leaf.source.geometry.border;
    findings[`leaf${index + 1}.textFit`] =
      child.text.bounds.width > 0 &&
      child.text.bounds.height > 0 &&
      child.text.bounds.x >= child.padding.left + inset - 1e-5 &&
      child.text.bounds.y >= child.padding.top + inset - 1e-5 &&
      child.text.bounds.x + child.text.bounds.width <=
        child.bounds.width - child.padding.right - inset + 1e-5 &&
      child.text.bounds.y + child.text.bounds.height <=
        child.bounds.height - child.padding.bottom - inset + 1e-5;
  });
  const tallest = Math.max(
    44,
    ...snapshot.leaf.map(
      child =>
        child.text.bounds.height +
        child.padding.top +
        child.padding.bottom +
        2 * plan.leaf.source.geometry.border
    )
  );
  findings.tallestRow = near(rail.bounds.height, tallest);
  return findings;
}
async function mgSegmentedWrapperPreflight(
  doc,
  brandId,
  collection,
  mode,
  report
) {
  if (report.scope !== 'segmented-wrapper' || brandId !== 'undrr')
    throw new Error('Four-wrapper scope is UNDRR only.');
  const shadow = {
    ...report,
    scope: 'segmented-leaves-default',
    preflight: {},
    fonts: { requested: [], loaded: [] },
  };
  const leaf = await mgSegmentedLeavesPreflight(
    doc,
    brandId,
    collection,
    mode,
    shadow,
    'Default'
  );
  report.fonts.requested.push(...shadow.fonts.requested);
  report.fonts.loaded.push(...shadow.fonts.loaded);
  const fail = message => {
    throw new Error(`Segmented wrapper: ${message}`);
  };
  const families = doc.components.families.filter(
    value => value.id === MG_SEGMENTED_WRAPPER_FAMILY
  );
  if (families.length !== 1 || families[0].variants.length !== 4)
    fail('exact four source presets required.');
  const family = families[0],
    same = mgSegmentedLeavesSame;
  const source = leaf.packet.sourceRefs.find(
    value =>
      value.file.endsWith('/segmented-control.scss') && value.normalizedSha256
  );
  if (
    !source ||
    family.source?.normalizedSha256 !== source.normalizedSha256 ||
    family.source.file !== source.file
  )
    fail('source provenance changed.');
  const selections = ['None', ...leaf.packet.labels.default];
  for (const selection of selections) {
    const specs = family.variants.filter(
        value => value.id === `${family.id}.${selection.toLowerCase()}`
      ),
      spec = specs[0],
      tree = spec?.tree;
    if (
      specs.length !== 1 ||
      !same(spec.properties, { Selection: selection }) ||
      tree?.type !== 'FRAME' ||
      tree.id !== 'mg-segmented-control' ||
      tree.name !== tree.id ||
      tree.children?.length !== 2 ||
      tree.fill !== null ||
      tree.stroke !== null ||
      tree.effectStyle !== null ||
      tree.clipsContent !== false ||
      tree.focusRing !== undefined ||
      !same(tree.layout, {
        mode: 'VERTICAL',
        width: 390,
        height: 'HUG',
        gap: 'spacing/25',
        align: 'MIN',
        justify: 'MIN',
      })
    )
      fail('source root recipe changed.');
    const [legend, rail] = tree.children;
    const legendExpected = {
      type: 'TEXT',
      id: `${tree.id}/mg-segmented-control__legend`,
      name: 'mg-segmented-control__legend',
      characters: 'Map layer',
      textProperty: 'Legend',
      visibilityProperty: 'Show legend',
      visible: true,
      textStyle: 'component.body',
      textDecoration: 'NONE',
      textWrap: 'AUTO',
      fill: leaf.roles.legendColor.name,
      stroke: null,
      layout: { width: 'FILL', height: 'HUG' },
    };
    if (
      !same(legend, legendExpected) ||
      rail.type !== 'FRAME' ||
      rail.id !== `${tree.id}/mg-segmented-control__group` ||
      rail.name !== 'mg-segmented-control__group' ||
      rail.children?.length !== 3 ||
      rail.fill !== null ||
      rail.stroke !== null ||
      rail.effectStyle !== null ||
      rail.clipsContent !== false ||
      !same(rail.layout, {
        mode: 'HORIZONTAL',
        width: 'FILL',
        height: 'HUG',
        gap: 'component/segmented-control/seam',
        wrap: 'NO_WRAP',
        align: 'MIN',
        justify: 'MIN',
      })
    )
      fail('source Legend/rail changed.');
    ['First', 'Middle', 'Last'].forEach((position, index) => {
      const name = `mg-segmented-control__label ${position}`;
      const expected = {
        type: 'INSTANCE',
        id: `${rail.id}/${name}`,
        name,
        family: leaf.family.id,
        variant: {
          Selected:
            selection === leaf.packet.labels.default[index] ? 'True' : 'False',
          State: 'Default',
          Position: position,
        },
        expose: true,
        overrides: { Label: leaf.packet.labels.default[index] },
        labelSizing: 'FILL',
        layout: { width: 'FILL', height: 'FILL' },
      };
      if (!same(rail.children[index], expected))
        fail('source nested Instance recipe changed.');
    });
  }
  const variables = await figma.variables.getLocalVariablesAsync();
  const role = (name, type, expected) => {
    const defs = doc.variables.filter(value => value.name === name),
      defsById = doc.variables.filter(value => value.id === defs[0]?.id),
      natives = variables.filter(
        value => mgReadIdentity(value, 'mgId') === defs[0]?.id
      );
    if (
      defs.length !== 1 ||
      defsById.length !== 1 ||
      defs[0].type !== type ||
      natives.length !== 1 ||
      natives[0].resolvedType !== type ||
      natives[0].name !== name ||
      variables.filter(
        value =>
          value.name === name && value.variableCollectionId === collection.id
      ).length !== 1 ||
      natives[0].variableCollectionId !== collection.id ||
      natives[0].valuesByMode[mode.modeId] !== expected ||
      defs[0].values[brandId] !== expected
    )
      fail(`exact typed native role ${name} required.`);
    return { name, type, id: defs[0].id, variable: natives[0], expected };
  };
  for (const brand of doc.modes) {
    const paints = leaf.packet.brands[brand.id].resolvedRoles;
    if (
      paints.background?.a !== 1 ||
      paints.outline?.a !== 1 ||
      !mgSegmentedLeavesSame(paints.background, paints.outline)
    )
      fail(
        'Default shared seam colours diverged; source paint priority needs implementation.'
      );
  }
  const seam = role(
      'component/segmented-control/seam',
      'FLOAT',
      -leaf.source.geometry.border
    ),
    gap = role('spacing/25', 'FLOAT', 2.5);
  const seamDef = doc.variables.find(value => value.name === seam.name);
  if (
    !same(seamDef.scopes, ['GAP']) ||
    !same(seam.variable.scopes, ['GAP']) ||
    seamDef.source.normalizedSha256 !== source.normalizedSha256 ||
    seamDef.codeSyntax?.WEB !== 'calc(-1 * var(--mg-border-width-button))'
  )
    fail('live seam source identity/scope changed.');
  for (const brand of doc.modes)
    if (
      seamDef.values[brand.id] !== -leaf.packet.brands[brand.id].geometry.border
    )
      fail('per-brand seam formula changed.');
  leaf.byName.set(seam.name, seam);
  leaf.byName.set(gap.name, gap);
  const templates = doc.styles.text.filter(
      value => value.id === 'component.body'
    ),
    styles = (await figma.getLocalTextStylesAsync()).filter(
      value => mgReadIdentity(value, 'mgStyleId') === 'component.body'
    );
  const template = templates[0],
    legendStyle = styles[0];
  if (
    templates.length !== 1 ||
    styles.length !== 1 ||
    template.source?.file !== 'stories/assets/scss/_foundational.scss' ||
    !same(template.bindings, {
      fontFamily: 'font-family/text',
      fontSize: 'font-size/300',
    })
  )
    fail('source Legend template unavailable.');
  for (const brand of doc.modes) {
    const expected = leaf.packet.brands[brand.id].typography.legend,
      actual = template.values[brand.id];
    if (
      !same(actual.fontName, expected.fontName) ||
      actual.fontSize !== expected.fontSize ||
      !same(actual.lineHeight, expected.lineHeight)
    )
      fail('per-brand Legend typography changed.');
  }
  if (
    legendStyle.fontName?.family !== 'Roboto' ||
    legendStyle.fontName?.style !== 'Regular' ||
    (Object.keys(legendStyle.fontName?.variationSettings || {}).length > 0 &&
      !same(legendStyle.fontName.variationSettings, {
        wdth: 100,
        wght: 400,
      })) ||
    legendStyle.fontSize !== 16 ||
    !same(legendStyle.lineHeight, { unit: 'PIXELS', value: 24 }) ||
    !mgSegmentedLeavesAlias(
      legendStyle.boundVariables.fontFamily,
      leaf.roles.fontFamily.variable.id
    ) ||
    !mgSegmentedLeavesAlias(
      legendStyle.boundVariables.fontSize,
      leaf.roles.legendFontSize.variable.id
    )
  )
    fail('native shared Legend typography/aliases changed.');
  const sets = figma.currentPage.findAll(
    node =>
      node.type === 'COMPONENT_SET' &&
      mgReadIdentity(node, 'mgKitId') === `family/${family.id}`
  );
  if (sets.length !== 1 || sets[0].children.length !== 4)
    fail('exact wrapper set unavailable.');
  const set = sets[0],
    defs = set.componentPropertyDefinitions;
  const property = (name, type, value) => {
    const entries = Object.entries(defs).filter(
      ([key]) => key.replace(/#[^#]+$/, '') === name
    );
    if (
      entries.length !== 1 ||
      entries[0][1].type !== type ||
      entries[0][1].defaultValue !== value
    )
      fail(`exact ${name} property required.`);
    return entries[0][0];
  };
  const plan = {
    leaf,
    family,
    set,
    collection,
    mode,
    seam,
    gap,
    legendStyle,
    legendFont: mgSegmentedLeavesJSON(legendStyle.fontName),
    legendKey: property('Legend', 'TEXT', 'Map layer'),
    showLegendKey: property('Show legend', 'BOOLEAN', true),
    shortLabels: leaf.packet.labels.default,
    longLabels: leaf.packet.labels.long,
    masters: [],
  };
  report.fonts.requested.push(plan.legendFont);
  await figma.loadFontAsync(plan.legendFont);
  report.fonts.loaded.push(plan.legendFont);
  for (const spec of family.variants) {
    const matches = set.children.filter(
      node =>
        node.type === 'COMPONENT' &&
        mgReadIdentity(node, 'mgKitId') ===
          `family/${family.id}/variant/${spec.id}`
    );
    if (matches.length !== 1) fail('exact wrapper master unavailable.');
    const node = matches[0],
      snapshot = await mgSegmentedWrapperSnapshot(node, plan);
    const member = {
      variantId: spec.id,
      masterId: node.id,
      instanceId: node.id,
      legendId: snapshot.legend.id,
      railId: snapshot.rail.id,
      leafIds: snapshot.leaf.map(child => child.id),
      textIds: snapshot.leaf.map(child => child.text.id),
      kind: 'canonical',
      width: 390,
      legend: 'Map layer',
      showLegend: true,
      labels: [...plan.shortLabels],
    };
    const findings = mgSegmentedWrapperFindings(snapshot, member, plan);
    mgSegmentedWrapperRequire(findings, spec.id);
    plan.masters.push({ ...member, node, snapshot, findings });
  }
  report.preflight.segmentedWrapper = {
    familyId: family.id,
    setId: set.id,
    legendStyleId: legendStyle.id,
    legendKey: plan.legendKey,
    showLegendKey: plan.showLegendKey,
    leafSetId: leaf.set.id,
    leafStyleId: leaf.style.id,
    leafLabelKey: leaf.labelKey,
    roleIds: { seam: seam.variable.id, gap: gap.variable.id },
    sourceRefs: leaf.packet.sourceRefs,
    sourceNarrowRailHeight: leaf.packet.cases.fullWidth240.groupHeight,
  };
  report.limitations = [
    'Four UNDRR Default FullWidth BelowMedium presets only. Shared styles and actual range paints required; no DIRECT.',
    'Native FILL Legend bounds intentionally differ from source intrinsic short Legend69.4375. Show legend=false removes visual layout contribution rather than source accessible absolute clipped1px sr-only; no DOM/accessibility box claim.',
    'Native240 text line boxes can give rail56 versus source55.59375; raw source delta is recorded. Fresh allocation allows one float32 ULP only for child widths/seam coordinates; exact before/after snapshots remain strict. Tallest-child fit is separate from pixels/font-file equality.',
    'No Selection swap/override claim, Hover/Focus, per-item source z-index, middle focus paint, intrinsic wrap, Small, arbitrary options, RTL or browser semantics.',
    'Exact native snapshots prove ordinary rebuild retention, not cryptographic build chronology; UI must consume one fresh actual build before each advance.',
  ];
  return plan;
}
function mgSegmentedWrapperCompact(report) {
  const state = report.segmentedWrapper;
  return {
    version: 1,
    scope: report.scope,
    runId: report.runId,
    rootId: report.rootId,
    brandId: report.brandId,
    rootParentId: state.rootParentId,
    collectionId: state.collectionId,
    modeId: state.modeId,
    setId: state.setId,
    legendStyleId: state.legendStyleId,
    legendKey: state.legendKey,
    showLegendKey: state.showLegendKey,
    leafSetId: state.leafSetId,
    leafStyleId: state.leafStyleId,
    leafLabelKey: state.leafLabelKey,
    completedAdvances: state.completedAdvances,
    ledger: report.ledger,
    canonical: state.canonicalBaseline.map(value => ({
      variantId: value.variantId,
      masterId: value.masterId,
      fingerprint: mgSegmentedLeavesFingerprint(value.snapshot),
    })),
    leafCanonical: state.leafCanonicalBaseline.map(value => ({
      variantId: value.variantId,
      masterId: value.masterId,
      fingerprint: mgSegmentedLeavesFingerprint(value.snapshot),
    })),
    members: state.cohorts.flatMap(cohort =>
      cohort.members.map(member => ({
        ...member,
        cohortId: cohort.id,
        snapshot: undefined,
        geometryStages: undefined,
        findings: undefined,
        baselineFingerprint: member.snapshot
          ? mgSegmentedLeavesFingerprint(member.snapshot)
          : null,
      }))
    ),
  };
}
function mgSegmentedWrapperPersist(root, report) {
  const json = JSON.stringify(mgSegmentedWrapperCompact(report));
  if (json.length > 60000)
    throw new Error('Wrapper manifest exceeds bounded60k storage.');
  mgWriteIdentity(root, MG_SEGMENTED_WRAPPER_MANIFEST, json);
}
async function mgSegmentedWrapperOwned(report) {
  if (
    report?.kind !== 'mangrove-native-capability-probes' ||
    report.version !== 1 ||
    report.scope !== 'segmented-wrapper' ||
    !report.runId ||
    report.segmentedWrapper?.version !== 1 ||
    !Array.isArray(report.ledger)
  )
    throw new Error('Exact saved wrapper report required.');
  const root = await figma.getNodeByIdAsync(report.rootId),
    state = report.segmentedWrapper,
    ids = new Set(report.ledger.map(value => value.id));
  if (
    ids.size !== report.ledger.length ||
    !ids.has(report.rootId) ||
    !root ||
    root.removed ||
    root.type !== 'FRAME' ||
    root.parent?.id !== state.rootParentId ||
    root.parent.id !== figma.currentPage.id ||
    mgReadIdentity(root, 'mgCapabilityProbeId') !== report.runId
  )
    throw new Error('Exact wrapper root/ledger changed.');
  const stored = mgReadIdentity(root, MG_SEGMENTED_WRAPPER_MANIFEST);
  if (
    !stored ||
    !mgSegmentedLeavesSame(
      JSON.parse(stored),
      mgSegmentedWrapperCompact(report)
    )
  )
    throw new Error('Saved wrapper report differs from creation manifest.');
  const present = new Set();
  async function visit(node) {
    const entry = report.ledger.find(value => value.id === node.id);
    if (
      !entry ||
      node.removed ||
      node.type !== entry.type ||
      node.parent?.id !== entry.parentId ||
      mgReadIdentity(node, 'mgCapabilityProbeId') !== report.runId
    )
      throw new Error('Foreign, moved, unrecorded or changed wrapper probe.');
    present.add(node.id);
    for (const child of node.children || []) {
      const fresh = await figma.getNodeByIdAsync(child.id);
      if (!fresh || fresh.removed)
        throw new Error('Missing wrapper probe descendant.');
      await visit(fresh);
    }
  }
  await visit(root);
  if (present.size !== ids.size)
    throw new Error('Wrapper ledger has missing or surviving outside nodes.');
  for (const cohort of state.cohorts)
    for (const member of cohort.members) {
      const node = await figma.getNodeByIdAsync(member.instanceId);
      if (
        node.type !== 'INSTANCE' ||
        node.parent.id !== root.id ||
        member.probeId !==
          mgSegmentedWrapperProbeId(
            report,
            cohort.id,
            member.variantId,
            node.id
          ) ||
        mgReadIdentity(node, 'mgKitId') !== member.probeId ||
        (await node.getMainComponentAsync())?.id !== member.masterId
      )
        throw new Error('Exact wrapper consumer identity changed.');
      const idsNow = [
        node.id,
        ...node.children.map(value => value.id),
        ...node.children[1].children.flatMap(value => [
          value.id,
          ...value.children.map(child => child.id),
        ]),
      ];
      if (!mgSegmentedLeavesSame(idsNow, member.topologyIds))
        throw new Error('Exact wrapper topology changed.');
    }
  return root;
}
function mgSegmentedWrapperCaptureParents(context, node) {
  const { report } = context;
  const visit = current => {
    const matches = report.ledger.filter(value => value.id === current.id);
    if (
      matches.length !== 1 ||
      matches[0].type !== current.type ||
      mgReadIdentity(current, 'mgCapabilityProbeId') !== report.runId
    )
      throw new Error('Factory did not record exact owned wrapper asset.');
    if (
      matches[0].parentId !== undefined &&
      matches[0].parentId !== current.parent?.id
    )
      throw new Error('Recorded parent changed.');
    matches[0].parentId = current.parent?.id;
    for (const child of current.children || []) visit(child);
  };
  visit(node);
}
async function mgSegmentedWrapperCohort(context, plan, cohort) {
  const { report, root, instance } = context;
  report.segmentedWrapper.cohorts.push(cohort);
  for (const [index, master] of plan.masters.entries()) {
    const node = instance(master.node, root);
    mgSegmentedWrapperCaptureParents(context, node);
    const probeId = mgSegmentedWrapperProbeId(
      report,
      cohort.id,
      master.variantId,
      node.id
    );
    mgWriteIdentity(node, 'mgKitId', probeId);
    const legend = node.children[0],
      rail = node.children[1],
      leaf = rail.children;
    const member = {
      variantId: master.variantId,
      masterId: master.masterId,
      instanceId: node.id,
      probeId,
      legendId: legend.id,
      railId: rail.id,
      leafIds: leaf.map(value => value.id),
      textIds: leaf.map(value => value.children[0].id),
      topologyIds: [
        node.id,
        ...node.children.map(value => value.id),
        ...leaf.flatMap(value => [
          value.id,
          ...value.children.map(child => child.id),
        ]),
      ],
      kind: cohort.kind,
      width: 390,
      legend: 'Map layer',
      showLegend: true,
      labels: [...plan.shortLabels],
      snapshot: null,
      geometryStages: [],
    };
    cohort.members.push(member);
    mgSegmentedWrapperPersist(root, report);
    node.x = cohort.column * 440 + 24;
    node.y = cohort.row * 1100 + 24 + index * 260;
    const stage = async id => {
      const snapshot = await mgSegmentedWrapperSnapshot(node, plan),
        findings = mgSegmentedWrapperFindings(snapshot, member, plan);
      member.geometryStages.push({
        id,
        requested: {
          width: member.width,
          legend: member.legend,
          showLegend: member.showLegend,
          labels: [...member.labels],
        },
        snapshot,
        findings,
        sourceNarrowRailHeight: plan.leaf.packet.cases.fullWidth240.groupHeight,
        nativeNarrowDelta:
          member.width === 240 &&
          mgSegmentedLeavesSame(member.labels, plan.shortLabels)
            ? snapshot.rail.bounds.height -
              plan.leaf.packet.cases.fullWidth240.groupHeight
            : null,
      });
      mgSegmentedWrapperPersist(root, report);
      mgSegmentedWrapperRequire(
        findings,
        `${cohort.id}/${master.variantId}/${id}`
      );
      return snapshot;
    };
    const width = value => {
      member.width = value;
      node.resize(value, node.height);
      node.layoutSizingHorizontal = 'FIXED';
      node.layoutSizingVertical = 'HUG';
    };
    const edits = (labels, text) => {
      member.labels = [...labels];
      member.legend = text;
      node.setProperties({ [plan.legendKey]: text });
      leaf.forEach((value, i) =>
        value.setProperties({ [plan.leaf.labelKey]: labels[i] })
      );
    };
    if (cohort.kind === 'edited') {
      await stage('short390');
      width(240);
      await stage('short240');
      edits(plan.longLabels, MG_SEGMENTED_WRAPPER_LONG_LEGEND);
      await stage('long240');
      member.showLegend = false;
      node.setProperties({ [plan.showLegendKey]: false });
      await stage('hidden240');
      // Edit the hidden text before width growth; never write inherited geometry.
      member.legend = MG_SEGMENTED_WRAPPER_LONG_LEGEND + ' for this view';
      node.setProperties({ [plan.legendKey]: member.legend });
      width(390);
      await stage('hidden390');
      member.showLegend = true;
      node.setProperties({ [plan.showLegendKey]: true });
      await stage('restored390');
      width(240);
      await stage('restored240');
      edits(plan.shortLabels, 'Map layer');
      width(390);
      await stage('short-restored390');
      edits(
        plan.longLabels,
        MG_SEGMENTED_WRAPPER_LONG_LEGEND + ' for this view'
      );
      width(240);
    }
    member.snapshot = await stage('baseline');
    member.findings = mgSegmentedWrapperFindings(member.snapshot, member, plan);
    mgSegmentedWrapperPersist(root, report);
  }
}
async function mgRunSegmentedWrapperProbes(context, plan) {
  const { report, root } = context;
  report.segmentedWrapper = {
    version: 1,
    familyId: plan.family.id,
    rootParentId: root.parent.id,
    collectionId: plan.collection.id,
    modeId: plan.mode.modeId,
    setId: plan.set.id,
    legendStyleId: plan.legendStyle.id,
    legendKey: plan.legendKey,
    showLegendKey: plan.showLegendKey,
    leafSetId: plan.leaf.set.id,
    leafStyleId: plan.leaf.style.id,
    leafLabelKey: plan.leaf.labelKey,
    canonicalBaseline: plan.masters.map(({ node, ...member }) => member),
    leafCanonicalBaseline: plan.leaf.masters.map(
      ({ node, ...member }) => member
    ),
    cohorts: [],
    advances: [],
    completedAdvances: 0,
    initialVerified: false,
    verdict: 'pending',
    errors: [],
  };
  mgSegmentedWrapperCaptureParents(context, root);
  mgSegmentedWrapperPersist(root, report);
  try {
    await mgSegmentedWrapperCohort(context, plan, {
      id: 'initial-edited',
      kind: 'edited',
      column: 0,
      row: 0,
      members: [],
    });
    await mgSegmentedWrapperCohort(context, plan, {
      id: 'initial-fresh',
      kind: 'fresh',
      column: 1,
      row: 0,
      members: [],
    });
    report.segmentedWrapper.initialVerified = true;
    await mgSegmentedWrapperOwned(report);
  } catch (error) {
    report.errors.push(`Wrapper prepare: ${error?.message || error}`);
    report.segmentedWrapper.errors.push(error?.message || String(error));
    report.segmentedWrapper.verdict = 'failed';
  }
  mgSegmentedWrapperPersist(root, report);
}
async function advanceMangroveSegmentedWrapperProbes(
  doc,
  brandId,
  report,
  buildResult
) {
  report = mgSegmentedLeavesJSON(report);
  let authorizedRoot = null;
  try {
    const root = await mgSegmentedWrapperOwned(report);
    authorizedRoot = root;
    const state = report.segmentedWrapper;
    if (
      report.errors.length ||
      state.errors.length ||
      !state.initialVerified ||
      state.completedAdvances >= 2 ||
      brandId !== report.brandId
    )
      throw new Error(
        'Failed, incomplete, completed or mismatched wrapper run.'
      );
    const collections = (
      await figma.variables.getLocalVariableCollectionsAsync()
    ).filter(
      value => value.id === state.collectionId && value.name === doc.collection
    );
    const collection = collections[0],
      mode = collection?.modes.find(
        value =>
          value.modeId === state.modeId &&
          value.name === doc.modes.find(value => value.id === brandId)?.name
      );
    if (collections.length !== 1 || !mode)
      throw new Error('Prepared source collection/mode changed.');
    const plan = await mgSegmentedWrapperPreflight(
      doc,
      brandId,
      collection,
      mode,
      report
    );
    if (
      plan.set.id !== state.setId ||
      plan.legendStyle.id !== state.legendStyleId ||
      plan.legendKey !== state.legendKey ||
      plan.showLegendKey !== state.showLegendKey ||
      plan.leaf.set.id !== state.leafSetId ||
      plan.leaf.style.id !== state.leafStyleId ||
      plan.leaf.labelKey !== state.leafLabelKey
    )
      throw new Error('Canonical set/styles/properties changed.');
    if (
      !buildResult ||
      buildResult.errors?.length !== 0 ||
      buildResult.createdNodeIds?.length !== 0 ||
      !Array.isArray(buildResult.updatedNodeIds) ||
      buildResult.families?.length !== 2
    )
      throw new Error(
        'Actual successful zero-create wrapper plus leaf build required.'
      );
    for (const group of [
      { family: plan.family, set: plan.set, masters: plan.masters },
      {
        family: plan.leaf.family,
        set: plan.leaf.set,
        masters: plan.leaf.masters,
      },
    ]) {
      const matches = buildResult.families.filter(
          value => value.id === group.family.id
        ),
        built = matches[0];
      if (
        matches.length !== 1 ||
        built.setId !== group.set.id ||
        built.variantIds?.length !== group.masters.length ||
        group.masters.some(
          master =>
            !built.variantIds.some(
              value =>
                value.id === master.variantId &&
                value.nodeId === master.masterId
            ) ||
            !buildResult.updatedNodeIds.includes(master.masterId) ||
            !buildResult.updatedNodeIds.includes(
              master.legendId || master.textId
            )
        )
      )
        throw new Error(
          'Build did not update exact four wrappers and30 source leaves.'
        );
    }
    const phase = state.completedAdvances + 1,
      observation = {
        phase,
        buildResult: mgSegmentedLeavesJSON(buildResult),
        canonical: [],
        leafCanonical: [],
        cohorts: [],
        newCohortId: `fresh-after-repeat-${phase}`,
      };
    state.advances.push(observation);
    for (const [masters, beforeList, out] of [
      [plan.masters, state.canonicalBaseline, observation.canonical],
      [
        plan.leaf.masters,
        state.leafCanonicalBaseline,
        observation.leafCanonical,
      ],
    ])
      for (const master of masters) {
        const before = beforeList.find(
          value => value.masterId === master.masterId
        );
        out.push({ variantId: master.variantId, snapshot: master.snapshot });
        if (!before || !mgSegmentedLeavesSame(before.snapshot, master.snapshot))
          throw new Error(
            'Canonical source snapshot changed on ordinary rebuild.'
          );
      }
    for (const cohort of state.cohorts) {
      const current = { id: cohort.id, members: [] };
      observation.cohorts.push(current);
      for (const member of cohort.members) {
        const node = await figma.getNodeByIdAsync(member.instanceId),
          snapshot = await mgSegmentedWrapperSnapshot(node, plan),
          findings = mgSegmentedWrapperFindings(snapshot, member, plan);
        current.members.push({
          instanceId: member.instanceId,
          snapshot,
          findings,
        });
        mgSegmentedWrapperRequire(findings, `${cohort.id}/${member.variantId}`);
        if (!mgSegmentedLeavesSame(snapshot, member.snapshot))
          throw new Error('Existing edited/fresh wrapper snapshot changed.');
      }
    }
    observation.visibilityCycles = [];
    for (const cohort of state.cohorts.filter(
      value => value.kind === 'edited'
    )) {
      for (const member of cohort.members) {
        const node = await figma.getNodeByIdAsync(member.instanceId);
        const current = { instanceId: member.instanceId, stages: [] };
        observation.visibilityCycles.push(current);
        const requested = {
          ...member,
          legend: member.legend,
          showLegend: false,
        };
        const read = async id => {
          const snapshot = await mgSegmentedWrapperSnapshot(node, plan);
          const findings = mgSegmentedWrapperFindings(
            snapshot,
            requested,
            plan
          );
          current.stages.push({
            id,
            requested: {
              width: requested.width,
              legend: requested.legend,
              showLegend: requested.showLegend,
              labels: requested.labels,
            },
            snapshot,
            findings,
          });
          mgSegmentedWrapperPersist(root, report);
          mgSegmentedWrapperRequire(
            findings,
            `repeat${phase}/${member.variantId}/${id}`
          );
          return snapshot;
        };
        node.setProperties({ [plan.showLegendKey]: false });
        await read('hidden-after-repeat');
        requested.legend = member.legend + ' edited while hidden';
        node.setProperties({ [plan.legendKey]: requested.legend });
        await read('edited-hidden-after-repeat');
        requested.showLegend = true;
        node.setProperties({ [plan.showLegendKey]: true });
        await read('shown-after-repeat');
        requested.legend = member.legend;
        node.setProperties({ [plan.legendKey]: member.legend });
        const restored = await read('restored-baseline-after-repeat');
        if (!mgSegmentedLeavesSame(restored, member.snapshot))
          throw new Error(
            'Legend visibility cycle did not restore the exact edited baseline.'
          );
      }
    }
    const recorded = new Set(report.ledger.map(value => value.id));
    const record = node => {
      if (recorded.has(node.id))
        throw new Error('New cohort returned existing ID.');
      recorded.add(node.id);
      report.ledger.push({ id: node.id, type: node.type });
      mgWriteIdentity(node, 'mgCapabilityProbeId', report.runId);
      for (const child of node.children || []) record(child);
      return node;
    };
    await mgSegmentedWrapperCohort(
      {
        report,
        root,
        instance: (master, parent) => {
          const node = record(master.createInstance());
          parent.appendChild(node);
          return node;
        },
      },
      plan,
      {
        id: observation.newCohortId,
        kind: 'fresh',
        column: phase - 1,
        row: 1,
        members: [],
      }
    );
    state.completedAdvances = phase;
    state.verdict = phase === 2 ? 'rebuild-fields-verified' : 'pending';
    mgSegmentedWrapperPersist(root, report);
    await mgSegmentedWrapperOwned(report);
  } catch (error) {
    const message = error?.message || String(error);
    report.errors = report.errors || [];
    report.errors.push(`Wrapper advance: ${message}`);
    if (report.segmentedWrapper) {
      report.segmentedWrapper.errors.push(message);
      report.segmentedWrapper.verdict = 'failed';
      if (authorizedRoot)
        try {
          mgSegmentedWrapperPersist(authorizedRoot, report);
        } catch (storage) {
          report.errors.push(storage?.message || String(storage));
        }
    }
  }
  return report;
}
async function removeMangroveSegmentedWrapperProbes(report) {
  const result = { removedNodeIds: [], errors: [] };
  try {
    const root = await figma.getNodeByIdAsync(report?.rootId);
    if (root && !root.removed) await mgSegmentedWrapperOwned(report);
    return await removeMangroveCapabilityProbes(report);
  } catch (error) {
    result.errors.push(error?.message || String(error));
    return result;
  }
}
