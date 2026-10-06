/* global module */
'use strict';
function mgNativeCollectionsFail(message) {
  throw new Error('Native collection plan: ' + message);
}
function mgNativeCollectionsString(value) {
  return (
    typeof value === 'string' && value.trim() === value && value.length > 0
  );
}
function mgNativeCollectionsLiteral(value, type) {
  if (type === 'FLOAT')
    return typeof value === 'number' && Number.isFinite(value);
  if (type === 'STRING') return typeof value === 'string';
  if (type === 'BOOLEAN') return typeof value === 'boolean';
  return (
    type === 'COLOR' &&
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).every(k => ['r', 'g', 'b', 'a'].includes(k)) &&
    ['r', 'g', 'b'].every(
      k =>
        typeof value[k] === 'number' &&
        Number.isFinite(value[k]) &&
        value[k] >= 0 &&
        value[k] <= 1
    ) &&
    (value.a === undefined ||
      (typeof value.a === 'number' &&
        Number.isFinite(value.a) &&
        value.a >= 0 &&
        value.a <= 1))
  );
}
/* global MG_CONNECTOR_NATIVE_TEXT_INSTANCES */
const MG_NATIVE_COLLECTIONS_TEXT_ENABLED =
  typeof MG_CONNECTOR_NATIVE_TEXT_INSTANCES === 'undefined' ||
  MG_CONNECTOR_NATIVE_TEXT_INSTANCES;
function mgNativeCollectionsCollectionLedger(plan, collectionId) {
  return MG_NATIVE_COLLECTIONS_TEXT_ENABLED && plan.version === 2
    ? { version: 2, profile: plan.profile, planId: plan.planId, collectionId }
    : { version: 1, planId: plan.planId, collectionId };
}
function mgNativeCollectionsSceneLedger(plan) {
  return MG_NATIVE_COLLECTIONS_TEXT_ENABLED && plan.version === 2
    ? { version: 2, profile: plan.profile, planId: plan.planId }
    : { version: 1, planId: plan.planId };
}
function mgNativeCollectionsSourcePlan(doc, selectedClosure) {
  const fail = mgNativeCollectionsFail,
    spec = doc?.nativeCollections;
  if (
    !spec ||
    (spec.version !== 1 &&
      !(
        MG_NATIVE_COLLECTIONS_TEXT_ENABLED &&
        spec.version === 2 &&
        spec.profile === 'plain-text-instances-v1'
      )) ||
    !mgNativeCollectionsString(spec.planId) ||
    !mgNativeCollectionsString(spec.primary) ||
    Object.keys(spec).some(
      k =>
        ![
          'version',
          'planId',
          'primary',
          'collections',
          ...(MG_NATIVE_COLLECTIONS_TEXT_ENABLED && spec.version === 2
            ? ['profile']
            : []),
        ].includes(k)
    ) ||
    !Array.isArray(spec.collections) ||
    !spec.collections.length
  )
    fail('invalid versioned declaration');
  if (
    !Array.isArray(doc.variables) ||
    !Array.isArray(doc.modes) ||
    !doc.modes.length
  )
    fail('source variables/modes required');
  const sourceById = new Map(),
    sourceByName = new Map(),
    ownerBySourceId = new Map(),
    collectionById = new Map(),
    counts = new Map(),
    modeById = new Map(),
    modeNames = new Set(),
    collectionNames = new Set();
  for (const m of doc.modes) {
    if (
      !mgNativeCollectionsString(m.id) ||
      !mgNativeCollectionsString(m.name) ||
      modeById.has(m.id) ||
      modeNames.has(m.name)
    )
      fail('duplicate/invalid source mode');
    modeById.set(m.id, m);
    modeNames.add(m.name);
  }
  for (const v of doc.variables) {
    if (
      !mgNativeCollectionsString(v.id) ||
      !mgNativeCollectionsString(v.name) ||
      sourceById.has(v.id) ||
      sourceByName.has(v.name) ||
      !['FLOAT', 'COLOR', 'STRING', 'BOOLEAN'].includes(v.type)
    )
      fail('duplicate/invalid source variable');
    if (
      !v.values ||
      typeof v.values !== 'object' ||
      Array.isArray(v.values) ||
      Object.keys(v.values).length !== modeById.size ||
      Object.keys(v.values).some(id => !modeById.has(id))
    )
      fail('exact source value modes required for ' + v.id);
    sourceById.set(v.id, v);
    sourceByName.set(v.name, v);
  }
  for (const c of spec.collections) {
    if (
      !c ||
      Object.keys(c).some(k => !['id', 'name', 'variableIds'].includes(k)) ||
      !mgNativeCollectionsString(c.id) ||
      !mgNativeCollectionsString(c.name) ||
      collectionById.has(c.id) ||
      collectionNames.has(c.name) ||
      !Array.isArray(c.variableIds) ||
      !c.variableIds.length
    )
      fail('duplicate/invalid source collection');
    collectionById.set(c.id, c);
    collectionNames.add(c.name);
    for (const id of c.variableIds) {
      if (!sourceById.has(id) || ownerBySourceId.has(id))
        fail('unknown/duplicate collection role ' + id);
      ownerBySourceId.set(id, c.id);
    }
    counts.set(c.id, c.variableIds.length);
    if (c.variableIds.length > 5000)
      fail('source collection capacity exceeded ' + c.id);
  }
  if (
    collectionById.get(spec.primary)?.name !== doc.collection ||
    ownerBySourceId.size !== sourceById.size
  )
    fail('primary or complete partition mismatch');
  if (selectedClosure !== undefined) {
    if (
      !Array.isArray(selectedClosure) ||
      new Set(selectedClosure).size !== sourceById.size ||
      selectedClosure.length !== sourceById.size ||
      selectedClosure.some(id => !sourceById.has(id))
    )
      fail('v1 requires whole document closure');
  }
  function resolveSource(v, mode, seen = new Set()) {
    if (seen.has(v.id)) fail('source alias cycle ' + v.id);
    seen.add(v.id);
    const value = v.values[mode];
    if (value && typeof value === 'object' && 'alias' in value) {
      const target = sourceByName.get(value.alias);
      if (Object.keys(value).length !== 1 || !target || target.type !== v.type)
        fail('invalid source alias ' + v.id);
      return resolveSource(target, mode, seen);
    }
    if (!mgNativeCollectionsLiteral(value, v.type))
      fail('invalid source value ' + v.id + '/' + mode);
    return value;
  }
  for (const v of sourceById.values())
    for (const m of modeById.keys()) resolveSource(v, m);
  if (MG_NATIVE_COLLECTIONS_TEXT_ENABLED && spec.version === 2)
    for (const v of sourceById.values()) {
      const topology = [...modeById.keys()].map(
        m => v.values[m]?.alias ?? null
      );
      if (topology.some(target => target !== topology[0]))
        fail('v2 requires mode-invariant alias topology ' + v.id);
    }
  const result = {
    version: 1,
    ...(MG_NATIVE_COLLECTIONS_TEXT_ENABLED && spec.version === 2
      ? { version: 2, profile: spec.profile }
      : {}),
    planId: spec.planId,
    primary: spec.primary,
    sourceById,
    sourceByName,
    ownerBySourceId,
    collectionById,
    counts,
    modeById,
    resolveSource,
  };
  if (MG_NATIVE_COLLECTIONS_TEXT_ENABLED && spec.version === 2) {
    Object.defineProperty(result, 'version', {
      value: 2,
      writable: false,
      enumerable: true,
      configurable: false,
    });
    Object.defineProperty(result, 'profile', {
      value: spec.profile,
      writable: false,
      enumerable: true,
      configurable: false,
    });
  }
  return result;
}
function mgNativeCollectionsSourceCapability(doc) {
  if (
    MG_NATIVE_COLLECTIONS_TEXT_ENABLED &&
    doc?.nativeCollections?.version === 2
  )
    return mgNativeCollectionsTextSourceCapability(doc);
  const fail = mgNativeCollectionsFail,
    plan = mgNativeCollectionsSourcePlan(doc);
  if (
    !doc.styles ||
    !Array.isArray(doc.styles.text) ||
    !Array.isArray(doc.styles.effect) ||
    doc.styles.text.length ||
    doc.styles.effect.length
  )
    fail('v1 requires empty text/effect style arrays');
  if (
    doc.components?.version !== 1 ||
    !Array.isArray(doc.components.families) ||
    !doc.components.families.length
  )
    fail('v1 components required');
  const allowed = new Set([
    'id',
    'type',
    'name',
    'layout',
    'bindings',
    'children',
    'fill',
    'stroke',
    'visible',
  ]);
  const numericBindings = new Set([
    'width',
    'height',
    'itemSpacing',
    'counterAxisSpacing',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'cornerRadius',
    'topLeftRadius',
    'topRightRadius',
    'bottomLeftRadius',
    'bottomRightRadius',
    'strokeWeight',
    'strokeTopWeight',
    'strokeRightWeight',
    'strokeBottomWeight',
    'strokeLeftWeight',
    'opacity',
  ]);
  plan.runtimeRoles = new Map();
  plan.runtimeConstraints = new Map();
  function role(name, type, positive = false, max, nonnegative = true) {
    const v = plan.sourceByName.get(name);
    if (!v || v.type !== type) fail('v1 missing/wrong runtime role ' + name);
    plan.runtimeRoles.set(name, type);
    if (type === 'FLOAT') {
      const prior = plan.runtimeConstraints.get(name),
        min = Math.max(prior?.min ?? -Infinity, nonnegative ? 0 : -Infinity);
      plan.runtimeConstraints.set(name, {
        ...(min !== -Infinity
          ? { min, exclusiveMin: positive || !!prior?.exclusiveMin }
          : {}),
        ...(max !== undefined || prior?.max !== undefined
          ? { max: Math.min(max ?? Infinity, prior?.max ?? Infinity) }
          : {}),
      });
    }
    for (const mode of plan.modeById.keys()) {
      const value = plan.resolveSource(v, mode),
        constraint = plan.runtimeConstraints.get(name);
      if (
        constraint?.min !== undefined &&
        (constraint.exclusiveMin
          ? !(value > constraint.min)
          : value < constraint.min)
      )
        fail('v1 invalid runtime minimum ' + name);
      if (constraint?.max !== undefined && value > constraint.max)
        fail('v1 invalid runtime maximum ' + name);
    }
  }
  function numeric(
    value,
    positive = false,
    dimension = false,
    max,
    nonnegative = true
  ) {
    if (dimension && ['HUG', 'FILL'].includes(value)) return;
    if (typeof value === 'string')
      role(value, 'FLOAT', positive, max, nonnegative);
    else if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      (positive ? !(value > 0) : nonnegative && value < 0) ||
      (max !== undefined && value > max)
    )
      fail('v1 invalid runtime numeric value');
  }
  function tree(n) {
    if (
      !n ||
      n.type !== 'FRAME' ||
      Object.keys(n).some(k => !allowed.has(k)) ||
      !mgNativeCollectionsString(n.id)
    )
      fail('v1 supports strict FRAME anatomy only');
    if (n.children !== undefined && !Array.isArray(n.children))
      fail('v1 children must be an array');
    if (n.layout !== undefined) {
      if (!n.layout || typeof n.layout !== 'object' || Array.isArray(n.layout))
        fail('v1 invalid layout');
      for (const [key, value] of Object.entries(n.layout)) {
        if (['width', 'height'].includes(key)) numeric(value, true, true);
        else if (key === 'gap') numeric(value, false, false, undefined, false);
        else if (key === 'padding') {
          if (
            !value ||
            typeof value !== 'object' ||
            Array.isArray(value) ||
            Object.keys(value).some(k => !['block', 'inline'].includes(k))
          )
            fail('v1 unsupported padding');
          Object.values(value).forEach(v => numeric(v));
        } else if (key === 'mode') {
          if (!['NONE', 'HORIZONTAL', 'VERTICAL'].includes(value))
            fail('v1 invalid layout mode');
        } else if (key === 'clipsContent') {
          if (typeof value !== 'boolean') fail('v1 invalid clipsContent');
        } else fail('v1 unsupported layout field ' + key);
      }
    }
    for (const key of ['fill', 'stroke'])
      if (n[key] !== undefined && n[key] !== null) role(n[key], 'COLOR');
    if (n.visible !== undefined && typeof n.visible !== 'boolean')
      fail('v1 invalid visible');
    if (n.bindings !== undefined) {
      if (
        !n.bindings ||
        typeof n.bindings !== 'object' ||
        Array.isArray(n.bindings)
      )
        fail('v1 invalid bindings');
      for (const [field, name] of Object.entries(n.bindings)) {
        if (field === 'visible') role(name, 'BOOLEAN');
        else if (numericBindings.has(field))
          role(
            name,
            'FLOAT',
            ['width', 'height'].includes(field),
            field === 'opacity' ? 100 : undefined,
            !['itemSpacing', 'counterAxisSpacing'].includes(field)
          );
        else fail('v1 unsupported binding ' + field);
      }
    }
    if (
      new Set((n.children || []).map(c => c?.id)).size !==
      (n.children || []).length
    )
      fail('v1 duplicate sibling anatomy IDs');
    (n.children || []).forEach(tree);
  }
  const familyIds = new Set(),
    familyNames = new Set(),
    variantIds = new Set();
  for (const f of doc.components.families) {
    if (
      !f ||
      f.kind !== 'component-set' ||
      !mgNativeCollectionsString(f.id) ||
      !mgNativeCollectionsString(f.name) ||
      familyIds.has(f.id) ||
      familyNames.has(f.name) ||
      f.review !== undefined ||
      !Array.isArray(f.variants) ||
      !f.variants.length
    )
      fail('v1 family metadata/review scope');
    familyIds.add(f.id);
    familyNames.add(f.name);
    const names = new Set(),
      tuples = new Set();
    let propertyKeys;
    for (const v of f.variants) {
      if (
        !v ||
        !mgNativeCollectionsString(v.id) ||
        !mgNativeCollectionsString(v.name) ||
        variantIds.has(v.id) ||
        names.has(v.name) ||
        !v.properties ||
        typeof v.properties !== 'object' ||
        Array.isArray(v.properties) ||
        Object.entries(v.properties).some(
          ([key, value]) =>
            !mgNativeCollectionsString(key) || !mgNativeCollectionsString(value)
        )
      )
        fail('v1 variant metadata');
      const keys = Object.keys(v.properties).sort(),
        serializedKeys = JSON.stringify(keys),
        tuple = JSON.stringify(keys.map(key => [key, v.properties[key]]));
      if (
        (propertyKeys !== undefined && propertyKeys !== serializedKeys) ||
        tuples.has(tuple)
      )
        fail('v1 inconsistent/duplicate variant properties');
      propertyKeys = serializedKeys;
      tuples.add(tuple);
      names.add(v.name);
      variantIds.add(v.id);
      tree(v.tree);
    }
  }
  return plan;
}
function mgNativeCollectionsTextSourceCapability(doc) {
  const fail = mgNativeCollectionsFail,
    plan = mgNativeCollectionsSourcePlan(doc);
  if (
    !doc.styles ||
    !Array.isArray(doc.styles.text) ||
    !Array.isArray(doc.styles.effect) ||
    doc.styles.effect.length
  )
    fail('v2 requires plain text styles and no effects');
  const styles = new Map(),
    names = new Set(),
    sourceFonts = new Map();
  const object = x => x && typeof x === 'object' && !Array.isArray(x);
  const exact = (x, keys) =>
    object(x) && Object.keys(x).every(k => keys.includes(k));
  const size = x => Number.isFinite(x) && x > 0;
  const normalized = x =>
    Object.fromEntries(
      Object.entries(x).sort(([a], [b]) => a.localeCompare(b))
    );
  for (const spec of doc.styles.text) {
    if (
      !object(spec) ||
      !mgNativeCollectionsString(spec.id) ||
      !mgNativeCollectionsString(spec.name) ||
      styles.has(spec.id) ||
      names.has(spec.name) ||
      (spec.type !== undefined && spec.type !== 'TEXT')
    )
      fail('v2 invalid style identity/kind');
    if (
      !exact(spec.bindings, ['fontFamily', 'fontSize']) ||
      Object.keys(spec.bindings).length !== 2
    )
      fail('v2 strict font bindings required');
    const family = plan.sourceByName.get(spec.bindings.fontFamily),
      fontSize = plan.sourceByName.get(spec.bindings.fontSize);
    if (family?.type !== 'STRING' || fontSize?.type !== 'FLOAT')
      fail('v2 missing/wrong font aliases');
    if (
      !object(spec.values) ||
      Object.keys(spec.values).length !== plan.modeById.size ||
      Object.keys(spec.values).some(m => !plan.modeById.has(m))
    )
      fail('v2 exact style modes required');
    let template;
    for (const mode of plan.modeById.keys()) {
      const v = spec.values[mode];
      if (
        !exact(v, [
          'fontName',
          'fontSize',
          'lineHeight',
          'letterSpacing',
          'textDecoration',
          'textWrapStyle',
        ]) ||
        !exact(v.fontName, ['family', 'style']) ||
        Object.keys(v.fontName).length !== 2 ||
        !mgNativeCollectionsString(v.fontName.family) ||
        !mgNativeCollectionsString(v.fontName.style) ||
        !size(v.fontSize)
      )
        fail('v2 invalid plain font template');
      if (
        plan.resolveSource(family, mode) !== v.fontName.family ||
        plan.resolveSource(fontSize, mode) !== v.fontSize
      )
        fail('v2 source font template disagrees with aliases');
      if (
        !exact(v.lineHeight, ['unit', 'value']) ||
        !['PIXELS', 'PERCENT'].includes(v.lineHeight.unit) ||
        !size(v.lineHeight.value)
      )
        fail('v2 invalid line height');
      if (
        v.letterSpacing !== undefined &&
        (!exact(v.letterSpacing, ['unit', 'value']) ||
          !['PIXELS', 'PERCENT'].includes(v.letterSpacing.unit) ||
          !Number.isFinite(v.letterSpacing.value))
      )
        fail('v2 invalid letter spacing');
      if (
        (v.textDecoration !== undefined && v.textDecoration !== 'NONE') ||
        (v.textWrapStyle !== undefined && v.textWrapStyle !== 'AUTO')
      )
        fail('v2 decoration/wrap profile refused');
      const current = JSON.stringify(
        normalized({
          style: v.fontName.style,
          lineHeight: normalized(v.lineHeight),
          letterSpacing: normalized(
            v.letterSpacing || { unit: 'PIXELS', value: 0 }
          ),
          textDecoration: v.textDecoration || 'NONE',
          textWrapStyle: v.textWrapStyle || 'AUTO',
        })
      );
      if (template !== undefined && template !== current)
        fail('v2 unbound style template differs across modes');
      template = current;
      sourceFonts.set(JSON.stringify(normalized(v.fontName)), {
        ...v.fontName,
      });
    }
    styles.set(spec.id, spec);
    names.add(spec.name);
  }
  if (
    !Array.isArray(doc.components?.families) ||
    !doc.components.families.length
  )
    fail('v2 components required');
  const families = new Map(),
    dependencies = new Map(),
    properties = new Map(),
    usedStyles = new Set();
  for (const f of doc.components.families) {
    if (!mgNativeCollectionsString(f?.id) || families.has(f.id))
      fail('v2 duplicate/missing family');
    families.set(f.id, f);
    dependencies.set(f.id, new Set());
    properties.set(f.id, new Map());
  }
  function project(n, familyId, root = false) {
    if (!object(n)) fail('v2 invalid anatomy');
    if (n.type === 'FRAME') {
      if (n.children !== undefined && !Array.isArray(n.children))
        fail('v2 children array required');
      return {
        ...n,
        ...(n.children !== undefined
          ? { children: n.children.map(c => project(c, familyId)) }
          : {}),
      };
    }
    if (root) fail('v2 variant root must be FRAME');
    const common = ['id', 'type', 'name', 'layout'];
    if (n.type === 'TEXT') {
      if (
        !exact(n, [
          ...common,
          'characters',
          'textStyle',
          'textProperty',
          'textAlign',
          'fill',
        ]) ||
        typeof n.characters !== 'string' ||
        !styles.has(n.textStyle) ||
        (n.textAlign !== undefined &&
          !['LEFT', 'CENTER', 'RIGHT'].includes(n.textAlign))
      )
        fail('v2 invalid plain TEXT');
      if (n.textProperty !== undefined) {
        if (!mgNativeCollectionsString(n.textProperty))
          fail('v2 invalid text property');
        const old = properties.get(familyId).get(n.textProperty);
        if (old !== undefined && old !== n.characters)
          fail('v2 differing text property defaults');
        properties.get(familyId).set(n.textProperty, n.characters);
      }
      if (
        n.layout &&
        Object.keys(n.layout).some(k => !['width', 'height'].includes(k))
      )
        fail('v2 unsupported TEXT layout');
      if (n.layout?.height !== undefined && n.layout.height !== 'HUG')
        fail('v2 TEXT height must be HUG');
      usedStyles.add(n.textStyle);
      const { characters, textStyle, textProperty, textAlign, ...plain } = n;
      return { ...plain, type: 'FRAME' };
    }
    if (n.type === 'INSTANCE') {
      if (
        !exact(n, [...common, 'family', 'variant', 'overrides', 'expose']) ||
        !families.has(n.family) ||
        !object(n.variant) ||
        !Object.keys(n.variant).length ||
        Object.entries(n.variant).some(
          ([k, v]) =>
            !mgNativeCollectionsString(k) || !mgNativeCollectionsString(v)
        ) ||
        (n.expose !== undefined && typeof n.expose !== 'boolean')
      )
        fail('v2 invalid INSTANCE contract');
      const matches = families
        .get(n.family)
        .variants?.filter(v =>
          Object.entries(n.variant).every(([k, x]) => v.properties?.[k] === x)
        );
      if (matches?.length !== 1) fail('v2 missing/ambiguous INSTANCE selector');
      if (
        n.overrides !== undefined &&
        (!object(n.overrides) ||
          Object.entries(n.overrides).some(
            ([k, v]) => !mgNativeCollectionsString(k) || typeof v !== 'string'
          ))
      )
        fail('v2 invalid INSTANCE overrides');
      dependencies.get(familyId).add(n.family);
      const { family, variant, overrides, expose, ...plain } = n;
      return { ...plain, type: 'FRAME' };
    }
    fail('v2 supports FRAME/plain TEXT/INSTANCE only');
  }
  const projected = JSON.parse(JSON.stringify(doc));
  projected.nativeCollections = { ...projected.nativeCollections, version: 1 };
  delete projected.nativeCollections.profile;
  projected.styles = { text: [], effect: [] };
  projected.components.families = doc.components.families.map(f => ({
    ...f,
    variants: f.variants?.map(v => ({
      ...v,
      tree: project(v.tree, f.id, true),
    })),
  }));
  // Reuse the original strict FRAME layout and metadata validator without changing its v1 path.
  const framePlan = mgNativeCollectionsSourceCapability(projected);
  plan.runtimeRoles = framePlan.runtimeRoles;
  plan.runtimeConstraints = framePlan.runtimeConstraints;
  function verifyInstances(n) {
    if (n.type === 'INSTANCE') {
      const selected = families
        .get(n.family)
        .variants.find(v =>
          Object.entries(n.variant).every(([k, x]) => v.properties[k] === x)
        );
      const selectedProperties = new Set();
      function collect(t) {
        if (t.type === 'TEXT' && t.textProperty)
          selectedProperties.add(t.textProperty);
        (t.children || []).forEach(collect);
      }
      collect(selected.tree);
      for (const key of Object.keys(n.overrides || {}))
        if (!selectedProperties.has(key))
          fail('v2 override absent from selected master');
    }
    (n.children || []).forEach(verifyInstances);
  }
  const done = new Set(),
    visiting = new Set(),
    order = [];
  function visit(id) {
    if (done.has(id)) return;
    if (visiting.has(id)) fail('v2 dependency cycle');
    visiting.add(id);
    for (const dep of dependencies.get(id)) visit(dep);
    visiting.delete(id);
    done.add(id);
    order.push(id);
  }
  for (const [id, f] of families) {
    visit(id);
    for (const v of f.variants) verifyInstances(v.tree);
  }
  for (const spec of styles.values()) {
    plan.runtimeRoles.set(spec.bindings.fontFamily, 'STRING');
    plan.runtimeRoles.set(spec.bindings.fontSize, 'FLOAT');
    const old = plan.runtimeConstraints.get(spec.bindings.fontSize) || {};
    plan.runtimeConstraints.set(spec.bindings.fontSize, {
      ...old,
      min: Math.max(old.min ?? 0, 0),
      exclusiveMin: true,
    });
  }
  plan.instanceMasterKeys = new Map();
  function instanceKeys(n, key) {
    if (n.type === 'INSTANCE') {
      const target = families
        .get(n.family)
        .variants.find(v =>
          Object.entries(n.variant).every(([k, x]) => v.properties[k] === x)
        );
      plan.instanceMasterKeys.set(
        key,
        `family/${n.family}/variant/${target.id}`
      );
    }
    for (const child of n.children || [])
      instanceKeys(child, `${key}/${child.id}`);
  }
  for (const f of families.values())
    for (const v of f.variants)
      instanceKeys(v.tree, `family/${f.id}/variant/${v.id}`);
  plan.textStylesById = styles;
  plan.usedTextStyleIds = usedStyles;
  plan.sourceFonts = [...sourceFonts.values()];
  plan.familyOrder = order;
  return plan;
}
function mgNativeCollectionsFontPlan(plan, state) {
  if (
    !MG_NATIVE_COLLECTIONS_TEXT_ENABLED ||
    plan.version !== 2 ||
    !(plan.textStylesById instanceof Map)
  )
    mgNativeCollectionsFail('v2 text style plan required');
  mgNativeCollectionsValidateValues(plan, state);
  const fonts = new Map();
  for (const spec of plan.textStylesById.values())
    for (const mode of plan.modeById.keys()) {
      const family = mgNativeCollectionsResolve(
        plan,
        state,
        spec.bindings.fontFamily,
        mode
      );
      if (!mgNativeCollectionsString(family))
        mgNativeCollectionsFail('invalid native font family');
      const font = { family, style: spec.values[mode].fontName.style };
      fonts.set(JSON.stringify(font), font);
    }
  return [...fonts.values()];
}
function mgNativeCollectionsPreflight(plan, snapshot, identity) {
  const fail = mgNativeCollectionsFail;
  if (
    !snapshot ||
    !Array.isArray(snapshot.collections) ||
    !Array.isArray(snapshot.variables) ||
    typeof identity?.readCollection !== 'function' ||
    typeof identity?.readVariable !== 'function'
  )
    fail('native snapshot/identity callbacks required');
  const collectionsBySourceId = new Map(),
    variablesBySourceId = new Map(),
    modeIdsByCollectionId = new Map(),
    neededCollections = [],
    neededModes = new Map(),
    neededVariables = [],
    occupancy = new Map(),
    collectionNativeIds = new Set(),
    variableNativeIds = new Set(),
    nativeSourceIds = new Map();
  for (const c of snapshot.collections) {
    if (!mgNativeCollectionsString(c.id) || collectionNativeIds.has(c.id))
      fail('duplicate native collection ID');
    collectionNativeIds.add(c.id);
    const ledger = identity.readCollection(c);
    if (ledger?.planId === plan.planId) {
      if (c.remote === true || c.isExtension === true)
        fail('local owned collection required');
      if (
        (MG_NATIVE_COLLECTIONS_TEXT_ENABLED && plan.version === 2
          ? JSON.stringify(Object.entries(ledger).sort()) !==
            JSON.stringify(
              Object.entries(
                mgNativeCollectionsCollectionLedger(plan, ledger.collectionId)
              ).sort()
            )
          : ledger.version !== 1) ||
        !plan.collectionById.has(ledger.collectionId) ||
        (!(MG_NATIVE_COLLECTIONS_TEXT_ENABLED && plan.version === 2) &&
          Object.keys(ledger).some(
            k => !['version', 'planId', 'collectionId'].includes(k)
          ))
      )
        fail('invalid collection ownership ledger');
      if (collectionsBySourceId.has(ledger.collectionId))
        fail('duplicate collection owner');
      collectionsBySourceId.set(ledger.collectionId, c);
    }
  }
  for (const [id, spec] of plan.collectionById) {
    const hits = snapshot.collections.filter(c => c.name === spec.name),
      owned = collectionsBySourceId.get(id);
    if (
      hits.length > 1 ||
      (hits.length && (!owned || hits[0].id !== owned.id)) ||
      (owned && owned.name !== spec.name)
    )
      fail('collection name/owner conflict ' + id);
    const modeMap = new Map(),
      missing = [],
      ids = new Set(),
      names = new Set();
    if (owned) {
      if (!Array.isArray(owned.modes) || !Array.isArray(owned.variableIds))
        fail('native collection inventory required');
      for (const m of owned.modes) {
        if (
          !mgNativeCollectionsString(m.modeId) ||
          !mgNativeCollectionsString(m.name) ||
          ids.has(m.modeId) ||
          names.has(m.name) ||
          ![...plan.modeById.values()].some(source => source.name === m.name)
        )
          fail('duplicate/invalid native mode');
        ids.add(m.modeId);
        names.add(m.name);
      }
    } else neededCollections.push(spec);
    for (const [sourceId, m] of plan.modeById) {
      const found = owned?.modes.find(n => n.name === m.name);
      if (found) modeMap.set(sourceId, found.modeId);
      else missing.push(m);
    }
    modeIdsByCollectionId.set(id, modeMap);
    neededModes.set(id, missing);
  }
  for (const v of snapshot.variables) {
    if (!mgNativeCollectionsString(v.id) || variableNativeIds.has(v.id))
      fail('duplicate native variable ID');
    variableNativeIds.add(v.id);
    const sourceId = identity.readVariable(v);
    if (sourceId) {
      if (!mgNativeCollectionsString(sourceId) || nativeSourceIds.has(sourceId))
        fail('duplicate/invalid native source variable ID');
      nativeSourceIds.set(sourceId, v);
    }
  }
  for (const [id, spec] of plan.collectionById) {
    const native = collectionsBySourceId.get(id),
      occupants = native
        ? snapshot.variables.filter(v => v.variableCollectionId === native.id)
        : [];
    if (
      native &&
      (new Set(native.variableIds).size !== native.variableIds.length ||
        native.variableIds.length !== occupants.length ||
        native.variableIds.some(v => !occupants.some(n => n.id === v)))
    )
      fail('native occupancy inventory mismatch ' + id);
    if (occupants.some(v => !identity.readVariable(v)))
      fail('foreign variable occupant ' + id);
    let missing = 0;
    for (const sourceId of spec.variableIds) {
      const wanted = plan.sourceById.get(sourceId),
        found = nativeSourceIds.get(sourceId),
        sameName = snapshot.variables.filter(v => v.name === wanted.name);
      if (
        sameName.length > 1 ||
        (sameName.length && (!found || sameName[0].id !== found.id))
      )
        fail('global variable name/owner conflict ' + sourceId);
      if (found) {
        if (
          !native ||
          found.variableCollectionId !== native.id ||
          found.name !== wanted.name ||
          found.resolvedType !== wanted.type ||
          found.remote === true
        )
          fail('native variable membership/type/identity drift ' + sourceId);
        variablesBySourceId.set(sourceId, found);
      } else {
        neededVariables.push(wanted);
        missing++;
      }
    }
    const resulting = occupants.length + missing;
    if (resulting > 5000) fail('native collection capacity exceeded ' + id);
    occupancy.set(id, { existing: occupants.length, missing, resulting });
  }
  const state = {
    collectionsBySourceId,
    variablesBySourceId,
    modeIdsByCollectionId,
    neededCollections,
    neededModes,
    neededVariables,
    occupancy,
    sourceModeNames: new Map(
      [...plan.modeById].map(([id, mode]) => [id, mode.name])
    ),
  };
  // Existing alias values must stay inside the declared exact source graph.
  for (const [sourceId, native] of variablesBySourceId) {
    const spec = plan.sourceById.get(sourceId),
      owner = plan.ownerBySourceId.get(sourceId),
      modes = modeIdsByCollectionId.get(owner);
    for (const [sourceMode, nativeMode] of modes) {
      const value = native.valuesByMode?.[nativeMode];
      if (value === undefined)
        fail('missing existing native value ' + sourceId);
      if (
        value &&
        typeof value === 'object' &&
        value.type === 'VARIABLE_ALIAS'
      ) {
        const sourceTarget = plan.sourceByName.get(
            spec.values[sourceMode]?.alias
          ),
          target = sourceTarget && variablesBySourceId.get(sourceTarget.id);
        if (
          Object.keys(value).some(k => !['type', 'id'].includes(k)) ||
          !target ||
          value.id !== target.id ||
          sourceTarget.type !== spec.type
        )
          fail('native alias ownership drift ' + sourceId);
      } else if (
        spec.values[sourceMode]?.alias ||
        !mgNativeCollectionsLiteral(value, spec.type)
      )
        fail('invalid native value ' + sourceId);
    }
  }
  return state;
}
function mgNativeCollectionsResolve(plan, state, sourceRoleName, sourceModeId) {
  const fail = mgNativeCollectionsFail,
    source = plan.sourceByName.get(sourceRoleName),
    seen = new Set();
  if (!source || !plan.modeById.has(sourceModeId))
    fail('unknown role/mode resolution');
  function read(spec) {
    if (seen.has(spec.id)) fail('native alias cycle');
    seen.add(spec.id);
    const owner = plan.ownerBySourceId.get(spec.id),
      collection = state.collectionsBySourceId.get(owner),
      native = state.variablesBySourceId.get(spec.id),
      mode = state.modeIdsByCollectionId.get(owner)?.get(sourceModeId);
    if (
      !collection ||
      !native ||
      !mode ||
      native.variableCollectionId !== collection.id ||
      native.resolvedType !== spec.type ||
      native.name !== spec.name ||
      !collection.modes.some(
        m =>
          m.modeId === mode && m.name === plan.modeById.get(sourceModeId).name
      )
    )
      fail('unmaterialized or drifted native role ' + spec.id);
    const value = native.valuesByMode?.[mode];
    if (value && typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
      const target = plan.sourceByName.get(spec.values[sourceModeId]?.alias),
        found = target && state.variablesBySourceId.get(target.id);
      if (
        Object.keys(value).some(k => !['type', 'id'].includes(k)) ||
        !target ||
        !found ||
        value.id !== found.id ||
        target.type !== spec.type
      )
        fail('native alias ownership drift');
      return read(target);
    }
    if (
      spec.values[sourceModeId]?.alias ||
      !mgNativeCollectionsLiteral(value, spec.type)
    )
      fail('invalid resolved native value');
    return value;
  }
  return read(source);
}
function mgNativeCollectionsValidateValues(plan, state) {
  if (
    !(plan.runtimeRoles instanceof Map) ||
    !(plan.runtimeConstraints instanceof Map)
  )
    mgNativeCollectionsFail('runtime source capability plan required');
  for (const [name, type] of plan.runtimeRoles)
    for (const mode of plan.modeById.keys()) {
      const value = mgNativeCollectionsResolve(plan, state, name, mode),
        constraint = plan.runtimeConstraints.get(name);
      if (!mgNativeCollectionsLiteral(value, type))
        mgNativeCollectionsFail('invalid native runtime type ' + name);
      if (
        constraint?.min !== undefined &&
        (constraint.exclusiveMin
          ? !(value > constraint.min)
          : value < constraint.min)
      )
        mgNativeCollectionsFail(
          'invalid native runtime minimum ' + name + '/' + mode
        );
      if (constraint?.max !== undefined && value > constraint.max)
        mgNativeCollectionsFail(
          'invalid native runtime maximum ' + name + '/' + mode
        );
    }
}
function mgNativeCollectionsApplyModes(
  node,
  state,
  sourceModeId,
  requiredCollectionIds
) {
  const fail = mgNativeCollectionsFail;
  if (
    !node ||
    typeof node.setExplicitVariableModeForCollection !== 'function' ||
    !Array.isArray(requiredCollectionIds) ||
    new Set(requiredCollectionIds).size !== requiredCollectionIds.length
  )
    fail('node mode application contract');
  const writes = requiredCollectionIds.map(id => {
    const collection = state.collectionsBySourceId.get(id),
      mode = state.modeIdsByCollectionId.get(id)?.get(sourceModeId);
    if (
      !collection ||
      !mode ||
      !collection.modes.some(
        m =>
          m.modeId === mode &&
          m.name === state.sourceModeNames?.get(sourceModeId)
      )
    )
      fail('missing native node mode');
    return { collection, mode };
  });
  for (const { collection, mode } of writes)
    if (node.explicitVariableModes?.[collection.id] !== mode)
      node.setExplicitVariableModeForCollection(collection, mode);
}
if (typeof module !== 'undefined')
  module.exports = {
    ...(MG_NATIVE_COLLECTIONS_TEXT_ENABLED
      ? {
          mgNativeCollectionsCollectionLedger,
          mgNativeCollectionsSceneLedger,
          mgNativeCollectionsFontPlan,
        }
      : {}),
    mgNativeCollectionsSourcePlan,
    mgNativeCollectionsSourceCapability,
    mgNativeCollectionsPreflight,
    mgNativeCollectionsResolve,
    mgNativeCollectionsValidateValues,
    mgNativeCollectionsApplyModes,
  };
