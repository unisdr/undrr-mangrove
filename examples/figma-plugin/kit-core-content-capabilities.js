/* global figma, mgReadIdentity, mgWriteIdentity */
// Private bounded consumer gate. No canonical writes, inherited geometry writes or pixel claims.
const MG_CORE_CONTENT_SCOPE = 'core-content';
const MG_CORE_CONTENT_MANIFEST = 'mgCoreContentManifest';
let mgCoreContentSequence = 0;
const MG_CORE_CONTENT_CASES = [
  {
    family: 'chips',
    variant: 'chips.linked.default.long',
    property: 'Label',
    width: 240,
    text: 'Disaster risk financing and insurance',
  },
  {
    family: 'text-cta',
    variant: 'text-cta.soft.mobile',
    property: 'Headline',
    width: 390,
    text: 'Turn knowledge into action for resilient communities around the world',
  },
  {
    family: 'empty-state-compact',
    variant: 'empty-state-compact.plain.centre',
    property: 'Description',
    width: 240,
    text: 'No matching disaster risk data is available. Change your filters or add a new record to continue.',
  },
];
function mgCoreContentJSON(value) {
  return JSON.parse(
    JSON.stringify(value, (_key, item) =>
      typeof item === 'symbol' ? '[mixed]' : item
    )
  );
}
function mgCoreContentSame(a, b) {
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
function mgCoreContentFingerprint(value) {
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
      for (let i = 0; i < text.length; i++)
        hash = Math.imul(hash ^ text.charCodeAt(i), 16777619) >>> 0;
      return hash.toString(16).padStart(8, '0');
    })
    .join('');
}
function mgCoreContentAlias(value, id) {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return (
    values.length === 1 &&
    values[0].type === 'VARIABLE_ALIAS' &&
    values[0].id === id
  );
}
function mgCoreContentGeometry(top, fields) {
  return fields.every(({ field, role }) => {
    const corner = /^(top|bottom)(Left|Right)Radius$/.test(field);
    const value =
      top[field] === undefined && corner ? top.cornerRadius : top[field];
    const alias =
      top.boundVariables?.[field] ||
      (corner ? top.boundVariables?.cornerRadius : undefined);
    return value === role.expected && mgCoreContentAlias(alias, role.id);
  });
}
function mgCoreContentSourceFont(font, source) {
  if (!font || font.family !== source.family || font.style !== source.style)
    return false;
  const weight = { Regular: 400, Medium: 500, Bold: 700 }[source.style];
  if (!weight || source.family !== 'Roboto') return false;
  const axes = font.variationSettings;
  if (axes === undefined) return true;
  if (!axes || typeof axes !== 'object' || Array.isArray(axes)) return false;
  return (
    Object.keys(axes).length === 0 ||
    mgCoreContentSame(axes, { wdth: 100, wght: weight })
  );
}
function mgCoreContentRequire(findings, label) {
  const failed = Object.keys(findings).filter(key => !findings[key]);
  if (failed.length) throw Error(`${label}: ${failed.join(', ')}`);
}
async function mgCoreContentSnapshot(node) {
  const list = [];
  const visit = async handle => {
    const target = await figma.getNodeByIdAsync(handle.id);
    if (!target || target.removed)
      throw Error('Core content node unavailable.');
    const main =
      target.type === 'INSTANCE' ? await target.getMainComponentAsync() : null;
    const value = {
      id: target.id,
      type: target.type,
      parentId: target.parent?.id || null,
      key: mgReadIdentity(target, 'mgKitId'),
      mainComponentId: main?.id || null,
      childIds: (target.children || []).map(child => child.id),
      bounds: {
        x: target.x,
        y: target.y,
        width: target.width,
        height: target.height,
      },
      visible: target.visible,
      opacity: target.opacity,
      horizontal: target.layoutSizingHorizontal,
      vertical: target.layoutSizingVertical,
      layoutMode: target.layoutMode,
      layoutWrap: target.layoutWrap,
      primaryAlign: target.primaryAxisAlignItems,
      counterAlign: target.counterAxisAlignItems,
      itemSpacing: target.itemSpacing,
      paddingTop: target.paddingTop,
      paddingRight: target.paddingRight,
      paddingBottom: target.paddingBottom,
      paddingLeft: target.paddingLeft,
      topLeftRadius: target.topLeftRadius,
      topRightRadius: target.topRightRadius,
      bottomLeftRadius: target.bottomLeftRadius,
      bottomRightRadius: target.bottomRightRadius,
      cornerRadius: target.cornerRadius,
      minHeight: target.minHeight,
      maxWidth: target.maxWidth,
      padding: [
        target.paddingTop,
        target.paddingRight,
        target.paddingBottom,
        target.paddingLeft,
      ],
      corners: [
        target.topLeftRadius,
        target.topRightRadius,
        target.bottomLeftRadius,
        target.bottomRightRadius,
      ],
      strokeWeight: target.strokeWeight,
      strokeAlign: target.strokeAlign,
      fills: target.fills,
      strokes: target.strokes,
      effects: target.effects,
      effectStyleId: target.effectStyleId,
      boundVariables: target.boundVariables,
      clipsContent: target.clipsContent,
      vectorPaths: target.vectorPaths,
      svg: mgReadIdentity(target, 'mgSvgAsset'),
      properties:
        target.type === 'INSTANCE' ? target.componentProperties : null,
      references: target.componentPropertyReferences,
    };
    if (target.type === 'TEXT')
      Object.assign(value, {
        characters: target.characters,
        fontName: target.fontName,
        fontSize: target.fontSize,
        lineHeight: target.lineHeight,
        letterSpacing: target.letterSpacing,
        textDecorationOffset: target.textDecorationOffset,
        textStyleId: target.textStyleId,
        textAutoResize: target.textAutoResize,
        textWrapStyle: target.textWrapStyle,
        textDecoration: target.textDecoration,
        textAlignHorizontal: target.textAlignHorizontal,
        hasMissingFont: target.hasMissingFont,
        rangePaints: target.characters.length
          ? target.getRangeFills(0, target.characters.length)
          : [],
      });
    list.push(mgCoreContentJSON(value));
    for (const child of target.children || []) await visit(child);
  };
  await visit(node);
  return list;
}
async function mgCoreContentPreflight(doc, brandId, collection, mode, report) {
  if (report.scope !== MG_CORE_CONTENT_SCOPE || brandId !== 'undrr')
    throw Error('Core content scope is UNDRR only.');
  const fail = message => {
    throw Error(`Core content: ${message}`);
  };
  const same = mgCoreContentSame;
  const sourceVariables = new Map(
    doc.variables.map(value => [value.name, value])
  );
  const nativeVariables = await figma.variables.getLocalVariablesAsync();
  const roles = new Map();
  const sourceValue = (name, seen = new Set()) => {
    if (seen.has(name)) fail('source alias cycle');
    seen.add(name);
    const spec = sourceVariables.get(name),
      value = spec?.values?.[brandId];
    if (value === undefined) fail(`missing source value ${name}`);
    return value?.alias ? sourceValue(value.alias, seen) : value;
  };
  const role = (name, type) => {
    if (roles.has(name)) {
      if (roles.get(name).type !== type) fail('role type changed');
      return roles.get(name);
    }
    const source = sourceVariables.get(name);
    const matches = nativeVariables.filter(
      value =>
        value.name === name &&
        value.variableCollectionId === collection.id &&
        mgReadIdentity(value, 'mgId') === source?.id
    );
    if (
      source?.type !== type ||
      matches.length !== 1 ||
      matches[0].resolvedType !== type
    )
      fail(`missing typed role ${name}`);
    const native = matches[0],
      expected = sourceValue(name);
    const result = {
      name,
      type,
      sourceId: source.id,
      id: native.id,
      expected,
      variable: native,
    };
    roles.set(name, result);
    return result;
  };
  const colorsEqual = (a, b) =>
    a && b && ['r', 'g', 'b'].every(key => Math.abs(a[key] - b[key]) <= 1e-6);
  const styles = await figma.getLocalTextStylesAsync();
  const allNodes = figma.currentPage.findAll(node =>
    ['COMPONENT', 'COMPONENT_SET'].includes(node.type)
  );
  const families = [],
    canonicals = [],
    cases = [];
  const fonts = new Map();
  for (const config of MG_CORE_CONTENT_CASES) {
    const sourceFamilies = doc.components.families.filter(
      value => value.id === config.family
    );
    if (sourceFamilies.length !== 1) fail(`missing family ${config.family}`);
    const family = sourceFamilies[0],
      variant = family.variants.find(value => value.id === config.variant);
    if (!variant) fail(`missing bounded variant ${config.variant}`);
    const sets = allNodes.filter(
      value =>
        value.type === 'COMPONENT_SET' &&
        mgReadIdentity(value, 'mgKitId') === `family/${config.family}`
    );
    if (sets.length !== 1) fail('missing exact source set');
    const set = sets[0];
    const keys = Object.keys(set.componentPropertyDefinitions).filter(
      key =>
        key.replace(/#[^#]+$/, '') === config.property &&
        set.componentPropertyDefinitions[key].type === 'TEXT'
    );
    if (keys.length !== 1) fail('missing unique public text key');
    const showKeys =
      config.family === 'empty-state-compact'
        ? Object.keys(set.componentPropertyDefinitions).filter(
            key =>
              key.replace(/#[^#]+$/, '') === 'Show media' &&
              set.componentPropertyDefinitions[key].type === 'BOOLEAN'
          )
        : [];
    if (config.family === 'empty-state-compact' && showKeys.length !== 1)
      fail('missing Show media');
    if (
      showKeys.length &&
      set.componentPropertyDefinitions[showKeys[0]].defaultValue !== true
    )
      fail('source Show media default changed');
    let textSpec;
    const walk = node => {
      if (node.type === 'TEXT' && node.textProperty === config.property) {
        if (textSpec) fail('ambiguous editable target');
        textSpec = node;
      }
      for (const child of node.children || []) walk(child);
    };
    walk(variant.tree);
    if (!textSpec || textSpec.textStyleApplication !== undefined)
      fail('shared text target changed');
    const templateSpecs = doc.styles.text.filter(
      value => value.id === textSpec.textStyle
    );
    const template = styles.filter(
      value => mgReadIdentity(value, 'mgStyleId') === textSpec.textStyle
    );
    if (templateSpecs.length !== 1 || template.length !== 1)
      fail('missing exact shared template');
    const sourceStyle = templateSpecs[0],
      style = template[0],
      expected = sourceStyle.values[brandId];
    if (
      !mgCoreContentSourceFont(style.fontName, expected.fontName) ||
      style.fontSize !== expected.fontSize
    )
      fail('wrong template font/size');
    if (
      expected.lineHeight.unit !== style.lineHeight.unit ||
      ![
        expected.lineHeight.value,
        expected.lineHeight.unit === 'PERCENT'
          ? Math.fround(expected.lineHeight.value / 100) * 100
          : expected.lineHeight.value,
      ].some(value => Math.abs(value - style.lineHeight.value) <= 1e-6)
    )
      fail('wrong template line height');
    const familyRole = role(sourceStyle.bindings.fontFamily, 'STRING'),
      sizeRole = role(sourceStyle.bindings.fontSize, 'FLOAT'),
      fill = role(textSpec.fill, 'COLOR');
    if (
      !mgCoreContentAlias(style.boundVariables?.fontFamily, familyRole.id) ||
      !mgCoreContentAlias(style.boundVariables?.fontSize, sizeRole.id)
    )
      fail('template aliases changed');
    let master;
    for (const spec of family.variants) {
      const matches = allNodes.filter(
        value =>
          value.type === 'COMPONENT' &&
          mgReadIdentity(value, 'mgKitId') ===
            `family/${config.family}/variant/${spec.id}`
      );
      if (matches.length !== 1 || matches[0].parent.id !== set.id)
        fail('missing exact canonical main');
      const node = matches[0],
        snapshot = await mgCoreContentSnapshot(node);
      // Validate every family's public target against its own source template,
      // including Desktop typography, without claiming all-variant consumer QA.
      let variantText;
      const findTarget = tree => {
        if (tree.type === 'TEXT' && tree.textProperty === config.property) {
          if (variantText) fail('duplicate canonical source target');
          variantText = tree;
        }
        for (const child of tree.children || []) findTarget(child);
      };
      findTarget(spec.tree);
      const actualTargets = snapshot.filter(
        value =>
          value.type === 'TEXT' && value.references?.characters === keys[0]
      );
      const actualStyles = styles.filter(
        value => mgReadIdentity(value, 'mgStyleId') === variantText?.textStyle
      );
      const sourceStyles = doc.styles.text.filter(
        value => value.id === variantText?.textStyle
      );
      if (
        !variantText ||
        actualTargets.length !== 1 ||
        actualStyles.length !== 1 ||
        sourceStyles.length !== 1
      )
        fail('missing variant source typography');
      const actualText = actualTargets[0],
        nativeStyle = actualStyles[0],
        sourceTypography = sourceStyles[0].values[brandId];
      const fontRole = role(sourceStyles[0].bindings.fontFamily, 'STRING'),
        fontSizeRole = role(sourceStyles[0].bindings.fontSize, 'FLOAT'),
        colorRole = role(variantText.fill, 'COLOR');
      const validPaint = paints =>
        Array.isArray(paints) &&
        paints.length === 1 &&
        paints[0].type === 'SOLID' &&
        paints[0].visible !== false &&
        mgCoreContentAlias(paints[0].boundVariables?.color, colorRole.id) &&
        (paints[0].opacity ?? 1) === colorRole.expected.a &&
        colorsEqual(paints[0].color, colorRole.expected);
      const sourceLine = sourceTypography.lineHeight;
      const allowedLine =
        sourceLine.unit === 'PERCENT'
          ? [sourceLine.value, Math.fround(sourceLine.value / 100) * 100]
          : [sourceLine.value];
      if (
        !mgCoreContentSourceFont(
          nativeStyle.fontName,
          sourceTypography.fontName
        ) ||
        nativeStyle.fontSize !== sourceTypography.fontSize ||
        nativeStyle.lineHeight.unit !== sourceLine.unit ||
        !allowedLine.includes(nativeStyle.lineHeight.value) ||
        actualText.textStyleId !== nativeStyle.id ||
        !mgCoreContentSame(actualText.fontName, nativeStyle.fontName) ||
        actualText.fontSize !== nativeStyle.fontSize ||
        !mgCoreContentSame(actualText.lineHeight, nativeStyle.lineHeight) ||
        !mgCoreContentAlias(
          actualText.boundVariables?.fontFamily,
          fontRole.id
        ) ||
        !mgCoreContentAlias(
          actualText.boundVariables?.fontSize,
          fontSizeRole.id
        ) ||
        !validPaint(actualText.fills) ||
        !validPaint(actualText.rangePaints)
      )
        fail(`variant source typography/paint changed: ${spec.id}`);
      canonicals.push({
        familyId: config.family,
        variantId: spec.id,
        masterId: node.id,
        snapshot,
      });
      for (const text of snapshot.filter(value => value.type === 'TEXT')) {
        if (text.hasMissingFont) fail('canonical has missing font');
        fonts.set(JSON.stringify(text.fontName), text.fontName);
        const live = await figma.getNodeByIdAsync(text.id);
        if (text.characters.length && live.getRangeAllFontNames)
          for (const font of live.getRangeAllFontNames(
            0,
            text.characters.length
          ))
            fonts.set(JSON.stringify(font), font);
      }
      if (spec.id === config.variant) master = node;
    }
    const canonical = canonicals.find(
        value => value.variantId === config.variant
      ),
      target = canonical.snapshot.filter(
        value =>
          value.type === 'TEXT' && value.references?.characters === keys[0]
      );
    if (target.length !== 1) fail('canonical target reference missing');
    const text = target[0];
    const sourcePaint = paints =>
      Array.isArray(paints) &&
      paints.length === 1 &&
      paints[0].type === 'SOLID' &&
      paints[0].visible !== false &&
      (paints[0].opacity ?? 1) === fill.expected.a &&
      mgCoreContentAlias(paints[0].boundVariables?.color, fill.id) &&
      colorsEqual(paints[0].color, fill.expected);
    if (
      text.textStyleId !== style.id ||
      !mgCoreContentSame(text.fontName, style.fontName) ||
      text.fontSize !== style.fontSize ||
      !mgCoreContentSame(text.lineHeight, style.lineHeight) ||
      !mgCoreContentAlias(text.boundVariables?.fontFamily, familyRole.id) ||
      !mgCoreContentAlias(text.boundVariables?.fontSize, sizeRole.id) ||
      !sourcePaint(text.fills) ||
      !sourcePaint(text.rangePaints) ||
      text.characters !==
        set.componentPropertyDefinitions[keys[0]].defaultValue ||
      text.textAutoResize !== 'HEIGHT' ||
      text.horizontal !== 'FILL' ||
      text.vertical !== 'HUG' ||
      text.textWrapStyle !== (textSpec.textWrap || 'AUTO') ||
      text.textDecoration !== (textSpec.textDecoration || 'NONE')
    )
      fail('canonical target source typography/paint/layout changed');
    const resolved = fill.variable.resolveForConsumer(master).value;
    if (!colorsEqual(resolved, fill.expected) || resolved.a !== fill.expected.a)
      fail('source paint resolution changed');
    const mainWidth =
      config.family === 'chips'
        ? role('component/chips/long-consumer-width', 'FLOAT')
        : null;
    if (
      mainWidth &&
      (mainWidth.expected !== 240 ||
        mainWidth.variable.resolveForConsumer(master).value !== 240)
    )
      fail('measured chip width changed');
    const geometryRoles = [];
    const geometry = (field, name) => {
      if (typeof name !== 'string')
        fail(`missing source geometry role ${field}`);
      const sourceRole = role(name, 'FLOAT');
      geometryRoles.push({ field, role: sourceRole });
    };
    for (const [field, name] of Object.entries(variant.tree.bindings || {})) {
      if (field === 'cornerRadius')
        for (const corner of [
          'topLeftRadius',
          'topRightRadius',
          'bottomLeftRadius',
          'bottomRightRadius',
        ])
          geometry(corner, name);
      else if (
        ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight'].includes(
          field
        )
      )
        geometry(field, name);
    }
    const padding = variant.tree.layout.padding;
    if (padding)
      for (const [field, name] of [
        ['paddingTop', padding.block],
        ['paddingBottom', padding.block],
        ['paddingLeft', padding.inline],
        ['paddingRight', padding.inline],
      ])
        geometry(field, name);
    geometry('itemSpacing', variant.tree.layout.gap);
    if (variant.tree.layout.minHeight)
      geometry('minHeight', variant.tree.layout.minHeight);
    const surface = variant.tree.fill ? role(variant.tree.fill, 'COLOR') : null;
    const top = canonical.snapshot[0];
    const surfacePaint = paints =>
      surface
        ? Array.isArray(paints) &&
          paints.length === 1 &&
          paints[0].type === 'SOLID' &&
          paints[0].visible !== false &&
          (paints[0].opacity ?? 1) === surface.expected.a &&
          mgCoreContentAlias(paints[0].boundVariables?.color, surface.id) &&
          colorsEqual(paints[0].color, surface.expected)
        : Array.isArray(paints) && paints.length === 0;
    if (
      top.layoutMode !== variant.tree.layout.mode ||
      top.horizontal !== 'FIXED' ||
      top.vertical !== 'HUG' ||
      !surfacePaint(top.fills) ||
      top.strokes.length ||
      !mgCoreContentGeometry(top, geometryRoles)
    )
      fail('selected source root geometry/paint changed');
    cases.push({
      ...config,
      setId: set.id,
      propertyKey: keys[0],
      showMediaKey: showKeys[0] || null,
      node: master,
      masterId: master.id,
      textSpec,
      rootMode: variant.tree.layout.mode,
      geometryRoles,
      surface,
      styleId: style.id,
      fontName: mgCoreContentJSON(style.fontName),
      fontSize: style.fontSize,
      lineHeight: mgCoreContentJSON(style.lineHeight),
      familyRole,
      sizeRole,
      fill,
      canonical,
      defaultText: target[0].characters,
    });
    families.push({
      id: family.id,
      setId: set.id,
      variantIds: family.variants.map(value => value.id),
    });
  }
  for (const { variable, expected, type, name } of roles.values()) {
    const actual = variable.resolveForConsumer(cases[0].node).value;
    if (
      type === 'COLOR'
        ? !colorsEqual(actual, expected) || actual.a !== expected.a
        : !mgCoreContentSame(actual, expected)
    )
      fail(`native role source value changed: ${name}`);
  }
  for (const font of fonts.values()) {
    report.fonts.requested.push(mgCoreContentJSON(font));
    await figma.loadFontAsync(font);
    report.fonts.loaded.push(mgCoreContentJSON(font));
  }
  report.preflight.coreContent = {
    families,
    selectedVariants: cases.map(value => value.variant),
    sourceFingerprint: mgCoreContentFingerprint(
      MG_CORE_CONTENT_CASES.map(config =>
        doc.components.families.find(value => value.id === config.family)
      )
    ),
    roles: [...roles.values()].map(({ variable, ...value }) => value),
    fonts: [...fonts.values()],
    limits: [
      'Shared source templates required; no DIRECT or font substitution.',
      'Three selected consumer presets, not all26 variants consumer acceptance.',
      'Chips remains source240px preset; TextCTA explicit Mobile390 only; Empty240/390 only.',
    ],
  };
  return { doc, brandId, collection, mode, cases, canonicals, families, roles };
}
function mgCoreContentCompact(report) {
  const state = report.coreContent;
  return {
    version: 1,
    runId: report.runId,
    scope: report.scope,
    rootId: report.rootId,
    rootParentId: state?.rootParentId,
    ledger: report.ledger.map(value => ({
      id: value.id,
      type: value.type,
      parentId: value.parentId,
    })),
    sourceFingerprint: report.preflight.coreContent.sourceFingerprint,
    canonical: state?.canonicalBaseline.map(value => ({
      id: value.masterId,
      fingerprint: mgCoreContentFingerprint(value.snapshot),
    })),
    cohorts: state?.cohorts.map(({ id, kind }) => ({ id, kind })),
    members: state?.cohorts.flatMap(cohort =>
      cohort.members.map(value => ({
        cohort: cohort.id,
        family: value.familyId,
        variant: value.variantId,
        probeId: value.probeId,
        id: value.instanceId,
        masterId: value.masterId,
        topologyIds: value.topologyIds,
        fingerprint: value.snapshot
          ? mgCoreContentFingerprint(value.snapshot)
          : null,
      }))
    ),
    completed: state?.completedAdvances || 0,
  };
}
function mgCoreContentPersist(root, report) {
  mgWriteIdentity(
    root,
    MG_CORE_CONTENT_MANIFEST,
    JSON.stringify(mgCoreContentCompact(report))
  );
}
async function mgCoreContentOwned(report) {
  if (
    report?.kind !== 'mangrove-native-capability-probes' ||
    report.version !== 1 ||
    report.scope !== MG_CORE_CONTENT_SCOPE ||
    !report.rootId ||
    !Array.isArray(report.ledger)
  )
    throw Error('Exact core content ledger required.');
  const ids = new Set(report.ledger.map(value => value.id));
  if (ids.size !== report.ledger.length || !ids.has(report.rootId))
    throw Error('Duplicate/partial core content ledger.');
  const canonicalIds = new Set(
    report.coreContent.canonicalBaseline.flatMap(item =>
      item.snapshot.map(node => node.id)
    )
  );
  if ([...ids].some(id => canonicalIds.has(id)))
    throw Error('Canonical IDs cannot enter the probe ledger.');
  const root = await figma.getNodeByIdAsync(report.rootId);
  if (
    !root ||
    root.type !== 'FRAME' ||
    root.parent?.id !== report.coreContent.rootParentId ||
    mgReadIdentity(root, 'mgCapabilityProbeId') !== report.runId
  )
    throw Error('Exact core content root unavailable.');
  const stored = JSON.parse(mgReadIdentity(root, MG_CORE_CONTENT_MANIFEST));
  if (!mgCoreContentSame(stored, mgCoreContentCompact(report)))
    throw Error('Core content creation manifest changed.');
  const seen = new Set();
  const visit = async id => {
    const node = await figma.getNodeByIdAsync(id),
      item = report.ledger.find(value => value.id === id);
    if (
      !node ||
      node.removed ||
      !item ||
      seen.has(id) ||
      node.type !== item.type ||
      node.parent?.id !== item.parentId ||
      mgReadIdentity(node, 'mgCapabilityProbeId') !== report.runId
    )
      throw Error('Core content ownership/topology changed.');
    seen.add(id);
    for (const child of node.children || []) await visit(child.id);
  };
  await visit(root.id);
  if (seen.size !== ids.size)
    throw Error('Core content ledger moved/missing descendant.');
  for (const cohort of report.coreContent.cohorts)
    for (const member of cohort.members) {
      const node = await figma.getNodeByIdAsync(member.instanceId),
        main = await node.getMainComponentAsync();
      if (
        node.parent.id !== root.id ||
        main?.id !== member.masterId ||
        mgReadIdentity(node, 'mgKitId') !== member.probeId
      )
        throw Error('Core content consumer identity changed.');
    }
  return root;
}
function mgCoreContentFindings(snapshot, member, config) {
  const same = mgCoreContentSame,
    top = snapshot[0],
    target = snapshot.filter(
      value =>
        value.type === 'TEXT' &&
        value.references?.characters === config.propertyKey
    );
  if (target.length !== 1) return { oneTarget: false };
  const text = target[0],
    desired = member.text;
  const color = paints =>
    Array.isArray(paints) &&
    paints.length === 1 &&
    paints[0].type === 'SOLID' &&
    paints[0].visible !== false &&
    (paints[0].opacity ?? 1) === config.fill.expected.a &&
    mgCoreContentAlias(paints[0].boundVariables?.color, config.fill.id) &&
    ['r', 'g', 'b'].every(
      key => Math.abs(paints[0].color[key] - config.fill.expected[key]) <= 1e-6
    );
  const media = config.showMediaKey
    ? snapshot.find(value => value.references?.visible === config.showMediaKey)
    : null;
  const geometry = mgCoreContentGeometry(top, config.geometryRoles);
  const surface = config.surface;
  const rootPaint = surface
    ? Array.isArray(top.fills) &&
      top.fills.length === 1 &&
      top.fills[0].type === 'SOLID' &&
      top.fills[0].visible !== false &&
      (top.fills[0].opacity ?? 1) === surface.expected.a &&
      mgCoreContentAlias(top.fills[0].boundVariables?.color, surface.id) &&
      ['r', 'g', 'b'].every(
        key => Math.abs(top.fills[0].color[key] - surface.expected[key]) <= 1e-6
      )
    : Array.isArray(top.fills) && top.fills.length === 0;
  let absoluteX = text.bounds.x,
    absoluteY = text.bounds.y,
    parentId = text.parentId;
  const path = new Set();
  while (parentId && parentId !== top.id) {
    if (path.has(parentId)) return { validAncestorPath: false };
    path.add(parentId);
    const parent = snapshot.find(value => value.id === parentId);
    if (!parent) return { validAncestorPath: false };
    absoluteX += parent.bounds.x;
    absoluteY += parent.bounds.y;
    parentId = parent.parentId;
  }
  const svg = media
    ? snapshot.filter(
        value => value.parentId === media.id && value.type === 'FRAME'
      )
    : [];
  return {
    mainAndRoot:
      top.type === 'INSTANCE' &&
      top.id === member.instanceId &&
      top.mainComponentId === config.masterId &&
      top.key === member.probeId,
    publicContent:
      top.properties?.[config.propertyKey]?.type === 'TEXT' &&
      top.properties[config.propertyKey].value === desired &&
      text.characters === desired &&
      text.id === member.textId,
    sharedTypography:
      text.textStyleId === config.styleId &&
      same(text.fontName, config.fontName) &&
      text.fontSize === config.fontSize &&
      same(text.lineHeight, config.lineHeight) &&
      text.hasMissingFont === false,
    typedFontAliases:
      mgCoreContentAlias(
        text.boundVariables?.fontFamily,
        config.familyRole.id
      ) &&
      mgCoreContentAlias(text.boundVariables?.fontSize, config.sizeRole.id),
    effectivePaint: color(text.fills) && color(text.rangePaints),
    sourceTextLayout:
      text.textDecoration === (config.textSpec.textDecoration || 'NONE') &&
      text.textWrapStyle === (config.textSpec.textWrap || 'AUTO') &&
      text.textAutoResize === 'HEIGHT' &&
      text.horizontal === 'FILL' &&
      text.vertical === 'HUG',
    sourceRootGeometry:
      top.layoutMode === config.rootMode &&
      geometry &&
      rootPaint &&
      top.strokes.length === 0,
    finiteSizing:
      top.bounds.width === member.width &&
      top.horizontal === 'FIXED' &&
      top.vertical === 'HUG' &&
      top.bounds.height > 0 &&
      text.bounds.width > 0 &&
      text.bounds.height > 0,
    containedText:
      parentId === top.id &&
      absoluteX >= 0 &&
      absoluteY >= 0 &&
      absoluteX + text.bounds.width <= top.bounds.width + 1e-6 &&
      absoluteY + text.bounds.height <= top.bounds.height + 1e-6 &&
      text.visible === true &&
      text.opacity === 1,
    mediaVisibility:
      !media ||
      (top.properties?.[config.showMediaKey]?.type === 'BOOLEAN' &&
        top.properties[config.showMediaKey].value === member.showMedia &&
        media.visible === member.showMedia),
    restoredMediaGeometry:
      !media ||
      !member.showMedia ||
      (media.bounds.width === 34 &&
        media.bounds.height === 34 &&
        svg.length === 1 &&
        svg[0].bounds.width > 0 &&
        svg[0].bounds.height > 0 &&
        snapshot.filter(value => value.type === 'VECTOR').length === 2 &&
        snapshot
          .filter(value => value.type === 'VECTOR')
          .every(value => value.bounds.width > 0 && value.bounds.height > 0)),
    exactTopology: same(
      snapshot.map(value => value.id),
      member.topologyIds
    ),
  };
}
async function mgCoreContentCohort(context, plan, cohort) {
  const { report, root, instance } = context;
  report.coreContent.cohorts.push(cohort);
  for (const [index, config] of plan.cases.entries()) {
    const node = instance(config.node, root);
    const descendants = await mgCoreContentSnapshot(node);
    for (const value of descendants) {
      const ledger = report.ledger.find(item => item.id === value.id);
      if (!ledger) throw Error('Created consumer descendant was not recorded.');
      ledger.parentId = value.parentId;
    }
    const member = {
      familyId: config.family,
      variantId: config.variant,
      masterId: config.masterId,
      instanceId: node.id,
      probeId: `capability/${report.runId}/core-content/${cohort.id}/${config.variant}/${node.id}`,
      topologyIds: descendants.map(value => value.id),
      textId: descendants.find(
        value =>
          value.type === 'TEXT' &&
          value.references?.characters === config.propertyKey
      )?.id,
      kind: cohort.kind,
      width: config.width,
      text: config.defaultText,
      showMedia: true,
      snapshot: null,
      stages: [],
    };
    cohort.members.push(member);
    mgWriteIdentity(node, 'mgKitId', member.probeId);
    mgCoreContentPersist(root, report);
    node.x = cohort.column * 500 + 20;
    node.y = cohort.row * 1300 + 20 + index * 440;
    if (config.family !== 'chips') {
      node.resize(config.width, node.height);
      node.layoutSizingHorizontal = 'FIXED';
      node.layoutSizingVertical = 'HUG';
    }
    const stage = async id => {
      const snapshot = await mgCoreContentSnapshot(node),
        findings = mgCoreContentFindings(snapshot, member, config);
      member.stages.push({
        id,
        requested: {
          width: member.width,
          text: member.text,
          showMedia: member.showMedia,
        },
        snapshot,
        findings,
      });
      mgCoreContentPersist(root, report);
      mgCoreContentRequire(findings, `${cohort.id}/${config.family}/${id}`);
      return snapshot;
    };
    if (cohort.kind === 'edited') {
      await stage('source');
      member.text = config.text;
      node.setProperties({ [config.propertyKey]: member.text });
      await stage('edited');
      if (config.showMediaKey) {
        member.showMedia = false;
        node.setProperties({ [config.showMediaKey]: false });
        await stage('hidden');
        member.text = config.text + ' You can try another search.';
        node.setProperties({ [config.propertyKey]: member.text });
        await stage('hidden-edited');
        member.showMedia = true;
        node.setProperties({ [config.showMediaKey]: true });
        await stage('restored');
        member.width = 390;
        node.resize(390, node.height);
        node.layoutSizingHorizontal = 'FIXED';
        node.layoutSizingVertical = 'HUG';
        await stage('wide390');
        member.width = 240;
        node.resize(240, node.height);
        node.layoutSizingHorizontal = 'FIXED';
        node.layoutSizingVertical = 'HUG';
      }
    }
    member.snapshot = await stage('baseline');
    mgCoreContentPersist(root, report);
  }
}
async function mgRunCoreContentProbes(context, plan) {
  const { report, root } = context;
  const item = report.ledger.find(value => value.id === root.id);
  item.parentId = root.parent.id;
  report.coreContent = report.coreContent || {
    version: 1,
    rootParentId: root.parent.id,
    canonicalBaseline: plan.canonicals,
    families: plan.families,
    cohorts: [],
    advances: [],
    completedAdvances: 0,
    verdict: 'pending',
    errors: [],
    expectedCounts: { initial: 39, after1: 58, after2: 77 },
  };
  mgCoreContentPersist(root, report);
  try {
    await mgCoreContentCohort(context, plan, {
      id: 'initial-edited',
      kind: 'edited',
      column: 0,
      row: 0,
      members: [],
    });
    await mgCoreContentCohort(context, plan, {
      id: 'initial-fresh',
      kind: 'fresh',
      column: 1,
      row: 0,
      members: [],
    });
    if (report.ledger.length !== 39)
      throw Error('Unexpected initial source topology count.');
    await mgCoreContentOwned(report);
  } catch (error) {
    const message = error?.message || String(error);
    report.errors.push(`Core content prepare: ${message}`);
    report.coreContent.errors.push(message);
    report.coreContent.verdict = 'failed';
  }
  mgCoreContentPersist(root, report);
  return report;
}
async function runMangroveCoreContentProbes(doc, brandId = 'undrr') {
  const report = {
    version: 1,
    kind: 'mangrove-native-capability-probes',
    runId: `core-content-${Date.now()}-${++mgCoreContentSequence}`,
    brandId,
    scope: MG_CORE_CONTENT_SCOPE,
    rootId: null,
    ledger: [],
    tests: {},
    errors: [],
    fonts: { requested: [], loaded: [] },
    preflight: {},
    limitations: [
      'Private three-preset consumer gate, not full-family pixel/brand/browser acceptance.',
      'No consumer descendant geometry writes.',
      'Two ordinary build receipts are required; no private master reapplication.',
      'Manifest fingerprints are noncryptographic integrity checks.',
    ],
  };
  let collection, mode, plan;
  try {
    if (figma.editorType !== 'figma') throw Error('Figma Design required.');
    const brand = doc.modes.find(value => value.id === brandId);
    const collections = (
      await figma.variables.getLocalVariableCollectionsAsync()
    ).filter(value => value.name === doc.collection);
    if (!brand || collections.length !== 1)
      throw Error('Exact source collection and brand required.');
    collection = collections[0];
    const modes = collection.modes.filter(value => value.name === brand.name);
    if (modes.length !== 1) throw Error('Exact imported mode required.');
    mode = modes[0];
    plan = await mgCoreContentPreflight(doc, brandId, collection, mode, report);
  } catch (error) {
    report.errors.push(`Core content preflight: ${error?.message || error}`);
    return report;
  }
  const recorded = new Set();
  const record = node => {
    if (recorded.has(node.id)) throw Error('Duplicate newly created probe ID.');
    recorded.add(node.id);
    report.ledger.push({
      id: node.id,
      type: node.type,
      parentId: node.parent?.id || null,
    });
    mgWriteIdentity(node, 'mgCapabilityProbeId', report.runId);
    for (const child of node.children || []) record(child);
    return node;
  };
  const root = record(figma.createFrame());
  report.rootId = root.id;
  report.coreContent = {
    version: 1,
    rootParentId: root.parent.id,
    canonicalBaseline: plan.canonicals,
    families: plan.families,
    cohorts: [],
    advances: [],
    completedAdvances: 0,
    verdict: 'pending',
    errors: [],
    expectedCounts: { initial: 39, after1: 58, after2: 77 },
  };
  mgCoreContentPersist(root, report);
  try {
    root.name = 'Mangrove native core content probes';
    root.layoutMode = 'NONE';
    root.clipsContent = false;
    root.fills = [];
    root.resize(1120, 2800);
    root.x = 0;
    root.y =
      Math.max(
        0,
        ...figma.currentPage.children
          .filter(node => node.id !== root.id)
          .map(node => node.y + node.height)
          .filter(Number.isFinite)
      ) + 100;
    root.setExplicitVariableModeForCollection(collection, mode.modeId);
  } catch (error) {
    const message = error?.message || String(error);
    report.errors.push(`Core content root: ${message}`);
    report.coreContent.errors.push(message);
    report.coreContent.verdict = 'failed';
    mgCoreContentPersist(root, report);
    return report;
  }

  return mgRunCoreContentProbes(
    {
      report,
      root,
      instance: (master, parent) => {
        const node = record(master.createInstance());
        parent.appendChild(node);
        const updateParents = current => {
          report.ledger.find(item => item.id === current.id).parentId =
            current.parent?.id || null;
          for (const child of current.children || []) updateParents(child);
        };
        updateParents(node);
        mgCoreContentPersist(parent, report);
        return node;
      },
    },
    plan
  );
}
async function advanceMangroveCoreContentProbes(
  doc,
  brandId,
  report,
  buildResult
) {
  try {
    const root = await mgCoreContentOwned(report);
    if (
      report.coreContent.verdict === 'failed' ||
      report.errors.length ||
      brandId !== report.brandId
    )
      throw Error('Failed/foreign core content report.');
    const expectedCohorts = [
      'initial-edited',
      'initial-fresh',
      ...Array.from(
        { length: report.coreContent.completedAdvances },
        (_, i) => `fresh-after-repeat-${i + 1}`
      ),
    ];
    if (
      !mgCoreContentSame(
        report.coreContent.cohorts.map(c => c.id),
        expectedCohorts
      ) ||
      report.coreContent.cohorts.some(
        c =>
          c.members.length !== 3 ||
          !mgCoreContentSame(
            c.members.map(m => [m.familyId, m.variantId]),
            MG_CORE_CONTENT_CASES.map(c => [c.family, c.variant])
          )
      )
    )
      throw Error('Complete bounded cohort structure required before advance.');
    const collections = (
      await figma.variables.getLocalVariableCollectionsAsync()
    ).filter(value => value.name === doc.collection);
    if (collections.length !== 1) throw Error('Missing collection.');
    const mode = collections[0].modes.find(value => value.name === 'UNDRR');
    const shadow = {
      ...report,
      preflight: {},
      fonts: { requested: [], loaded: [] },
    };
    const plan = await mgCoreContentPreflight(
      doc,
      brandId,
      collections[0],
      mode,
      shadow
    );
    if (
      !mgCoreContentSame(
        shadow.preflight.coreContent,
        report.preflight.coreContent
      )
    )
      throw Error('Core content source/preflight changed.');
    if (
      buildResult.errors?.length ||
      buildResult.createdNodeIds?.length ||
      !Array.isArray(buildResult.updatedNodeIds)
    )
      throw Error('Ordinary zero-create build required.');
    const allowedFamilies = new Set([
      ...plan.families.map(item => item.id),
      'button',
    ]);
    if (
      !Array.isArray(buildResult.families) ||
      buildResult.families.some(item => !allowedFamilies.has(item.id))
    )
      throw Error('Unexpected family in bounded ordinary build receipt.');
    for (const family of plan.families) {
      const receipt = buildResult.families.filter(
        value => value.id === family.id
      );
      if (
        receipt.length !== 1 ||
        receipt[0].setId !== family.setId ||
        !mgCoreContentSame(
          receipt[0].variantIds.map(value => value.id),
          family.variantIds
        )
      )
        throw Error('Build did not cover exact three source families.');
    }
    for (const before of report.coreContent.canonicalBaseline) {
      const actual = plan.canonicals.find(
        value => value.masterId === before.masterId
      );
      if (
        !actual ||
        !mgCoreContentSame(actual.snapshot, before.snapshot) ||
        !buildResult.updatedNodeIds.includes(before.masterId)
      )
        throw Error('Canonical baseline changed on ordinary build.');
    }
    const phase = report.coreContent.completedAdvances + 1;
    if (phase > 2) throw Error('Exactly two advances supported.');
    const observation = {
      phase,
      buildResult: mgCoreContentJSON(buildResult),
      canonical: plan.canonicals,
      cohorts: [],
    };
    report.coreContent.advances.push(observation);
    for (const cohort of report.coreContent.cohorts) {
      const current = { id: cohort.id, members: [] };
      observation.cohorts.push(current);
      for (const member of cohort.members) {
        const config = plan.cases.find(
            value => value.variant === member.variantId
          ),
          node = await figma.getNodeByIdAsync(member.instanceId),
          snapshot = await mgCoreContentSnapshot(node),
          findings = mgCoreContentFindings(snapshot, member, config);
        current.members.push({
          instanceId: member.instanceId,
          snapshot,
          findings,
        });
        mgCoreContentRequire(findings, `${cohort.id}/${config.family}`);
        if (!mgCoreContentSame(snapshot, member.snapshot))
          throw Error(
            'Existing consumer snapshot changed after ordinary build.'
          );
      }
    }
    const ids = new Set(report.ledger.map(value => value.id));
    const record = node => {
      if (ids.has(node.id)) throw Error('New cohort reused a recorded ID.');
      ids.add(node.id);
      report.ledger.push({
        id: node.id,
        type: node.type,
        parentId: node.parent?.id || null,
      });
      mgWriteIdentity(node, 'mgCapabilityProbeId', report.runId);
      for (const child of node.children || []) record(child);
      return node;
    };
    await mgCoreContentCohort(
      {
        report,
        root,
        instance: (master, parent) => {
          const node = record(master.createInstance());
          parent.appendChild(node);
          const updateParents = current => {
            report.ledger.find(item => item.id === current.id).parentId =
              current.parent?.id || null;
            for (const child of current.children || []) updateParents(child);
          };
          updateParents(node);
          mgCoreContentPersist(parent, report);
          return node;
        },
      },
      plan,
      {
        id: `fresh-after-repeat-${phase}`,
        kind: 'fresh',
        column: phase - 1,
        row: 1,
        members: [],
      }
    );
    report.coreContent.completedAdvances = phase;
    report.coreContent.verdict =
      phase === 2 ? 'rebuild-fields-verified' : 'pending';
    if (report.ledger.length !== (phase === 1 ? 58 : 77))
      throw Error('Unexpected final source topology count.');
    mgCoreContentPersist(root, report);
    await mgCoreContentOwned(report);
  } catch (error) {
    const message = error?.message || String(error);
    report.errors.push(`Core content advance: ${message}`);
    if (report.coreContent) {
      report.coreContent.errors.push(message);
      report.coreContent.verdict = 'failed';
    }
    const root = await figma.getNodeByIdAsync(report.rootId);
    if (root) mgCoreContentPersist(root, report);
  }
  return report;
}
async function removeMangroveCoreContentProbes(report) {
  const result = { removedNodeIds: [], errors: [] };
  try {
    const root = await mgCoreContentOwned(report);
    result.removedNodeIds = report.ledger.map(value => value.id);
    root.remove();
  } catch (error) {
    result.errors.push(error?.message || String(error));
  }
  return result;
}
