/* Optional square SVG viewport and uniform stroke token bindings. */
function mgSvgSizingPlan(spec) {
  const sizing = spec.svg?.sizing;
  if (sizing === undefined) return null;
  const fail = () => {
    throw new Error(
      'SVG sizing requires a square uniform-stroke source contract.'
    );
  };
  if (
    !sizing ||
    typeof sizing !== 'object' ||
    Array.isArray(sizing) ||
    Object.keys(sizing).sort().join(',') !== 'size,strokeWidth' ||
    !['size', 'strokeWidth'].every(
      k => typeof sizing[k] === 'string' && sizing[k]
    )
  )
    fail();
  const markup = spec.svg.markup;
  if (
    typeof markup !== 'string' ||
    /<(?:mask|clipPath|filter|use|image|text|foreignObject)\b/i.test(markup) ||
    /\btransform\s*=|\bstyle\s*=/i.test(markup)
  )
    fail();
  const box = /\bviewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(markup);
  if (!box || Number(box[1]) !== Number(box[2]) || !(Number(box[1]) > 0))
    fail();
  const strokeWidths = [...markup.matchAll(/\bstroke-width="([\d.]+)"/g)].map(
    m => Number(m[1])
  );
  if (
    !strokeWidths.length ||
    strokeWidths.some(n => n !== strokeWidths[0]) ||
    !(strokeWidths[0] > 0)
  )
    fail();
  if (
    !/<svg\b[^>]*\bfill="none"/.test(markup) ||
    !/\bstroke="(?:#000000|black)"/.test(markup) ||
    [...markup.matchAll(/\bstroke="([^"]*)"/g)].some(
      match => !['#000000', 'black'].includes(match[1])
    ) ||
    /\bfill="(?!none")/.test(markup)
  )
    fail();
  if (
    !spec.svg.monochrome?.strokes ||
    Object.keys(spec.svg.monochrome).join(',') !== 'strokes'
  )
    fail();
  if (
    !spec.layout ||
    !Number.isFinite(spec.layout.width) ||
    spec.layout.width !== spec.layout.height ||
    spec.layout.width <= 0
  )
    fail();
  return {
    size: sizing.size,
    strokeWidth: sizing.strokeWidth,
    viewBoxSize: Number(box[1]),
    sourceStrokeWidth: strokeWidths[0],
    assetId: spec.svg.assetId,
    color: spec.svg.monochrome.strokes,
  };
}

// Pure DTO preflight for every source mode. Alias lookup is supplied by the
// caller, preserving the existing importer's type/cycle/missing-mode checks.
function mgSvgSizingSourceValues(plan, modes, resolve) {
  if (!plan) return null;
  const result = {};
  for (const mode of modes) {
    const size = resolve(plan.size, mode, 'FLOAT');
    const strokeWidth = resolve(plan.strokeWidth, mode, 'FLOAT');
    const expected = (plan.sourceStrokeWidth * size) / plan.viewBoxSize;
    if (
      !Number.isFinite(size) ||
      size <= 0 ||
      size > 128 ||
      !Number.isFinite(strokeWidth) ||
      strokeWidth <= 0 ||
      Math.abs(strokeWidth - expected) > 1e-12
    )
      throw new Error(`SVG sizing source values disagree in ${mode.id}.`);
    result[mode.id] = { size, strokeWidth };
  }
  return result;
}

// Native FLOAT storage was observed as IEEE-754 float32. Accept only the exact
// authored result or its exact float32 representation, never a wider epsilon.
function mgSvgSizingNativeFloatMatches(value, expected) {
  return value === expected || value === Math.fround(expected);
}

function mgSvgSizingNativeValues(plan, modes, resolve) {
  if (!plan) return null;
  const result = {};
  for (const mode of modes) {
    const size = resolve(plan.size, mode, 'FLOAT');
    const strokeWidth = resolve(plan.strokeWidth, mode, 'FLOAT');
    const expected = (plan.sourceStrokeWidth * size) / plan.viewBoxSize;
    if (
      !Number.isFinite(size) ||
      size <= 0 ||
      size > 128 ||
      !Number.isFinite(strokeWidth) ||
      strokeWidth <= 0 ||
      !mgSvgSizingNativeFloatMatches(strokeWidth, expected)
    )
      throw new Error(`SVG sizing native values disagree in ${mode.id}.`);
    result[mode.id] = { size, strokeWidth };
  }
  return result;
}

// Validate source aliases in every authored mode before any asset writes.
function mgSvgSizingDocumentValues(plan, doc) {
  if (!plan) return null;
  const roles = new Map();
  for (const item of doc.variables || []) {
    if (roles.has(item.name))
      throw new Error('SVG sizing source role is ambiguous.');
    roles.set(item.name, item);
  }
  function resolve(name, mode, type, seen = new Set()) {
    const item = roles.get(name);
    if (!item || item.type !== type || seen.has(item.name))
      throw new Error(
        'SVG sizing source alias is missing, wrong typed or cyclic.'
      );
    seen.add(item.name);
    const value = item.values?.[mode.id];
    if (value && typeof value === 'object') {
      if (
        Object.keys(value).join(',') !== 'alias' ||
        typeof value.alias !== 'string'
      )
        throw new Error('SVG sizing source alias is malformed.');
      return resolve(value.alias, mode, type, seen);
    }
    if (!Number.isFinite(value))
      throw new Error('SVG sizing source FLOAT is unresolved.');
    return value;
  }
  if (!Array.isArray(doc.modes) || !doc.modes.length)
    throw new Error('SVG sizing source modes are missing.');
  return mgSvgSizingSourceValues(plan, doc.modes, resolve);
}

// Native subtree/variable preflight has no writes. The strict imported subset
// permits frames/groups and stroked vectors only; masks and mixed fills do not
// silently become approximations. Native constraint and mode behavior remains
// an acceptance gate until tested in a real isolated file.
function mgSvgSizingNativePlan(node, plan, variable, managed = false) {
  if (!plan) return null;
  const sizeVariable = variable(plan.size, 'FLOAT');
  const strokeVariable = variable(plan.strokeWidth, 'FLOAT');
  if (
    !sizeVariable ||
    !strokeVariable ||
    sizeVariable.resolvedType !== 'FLOAT' ||
    strokeVariable.resolvedType !== 'FLOAT' ||
    typeof sizeVariable.resolveForConsumer !== 'function' ||
    typeof strokeVariable.resolveForConsumer !== 'function'
  )
    throw new Error('SVG sizing requires native FLOAT variables.');
  const size = sizeVariable.resolveForConsumer(node).value;
  const strokeWidth = strokeVariable.resolveForConsumer(node).value;
  const expected = (plan.sourceStrokeWidth * size) / plan.viewBoxSize;
  if (
    !Number.isFinite(size) ||
    size <= 0 ||
    size > 128 ||
    !Number.isFinite(strokeWidth) ||
    !mgSvgSizingNativeFloatMatches(strokeWidth, expected)
  )
    throw new Error('SVG sizing native variables disagree with source.');
  if (
    node.type !== 'FRAME' ||
    typeof node.rescale !== 'function' ||
    typeof node.setBoundVariable !== 'function' ||
    !Number.isFinite(node.width) ||
    node.width <= 0 ||
    node.width !== node.height
  )
    throw new Error('SVG sizing needs an imported square native frame.');
  function checkGeometryAndAppearance(item) {
    const hiddenImportFill =
      item.type === 'FRAME' &&
      Array.isArray(item.fills) &&
      item.fills.length === 1 &&
      item.fills[0].type === 'SOLID' &&
      item.fills[0].visible === false &&
      item.fills[0].opacity === 1 &&
      item.fills[0].blendMode === 'NORMAL' &&
      item.fills[0].color?.r === 1 &&
      item.fills[0].color?.g === 1 &&
      item.fills[0].color?.b === 1 &&
      Object.keys(item.fills[0].boundVariables || {}).length === 0;
    if (
      !['x', 'y', 'width', 'height'].every(key => Number.isFinite(item[key])) ||
      item.width <= 0 ||
      item.height <= 0 ||
      item.isMask === true ||
      !Array.isArray(item.effects) ||
      item.effects.length ||
      (item.type !== 'GROUP' &&
        (!Array.isArray(item.fills) ||
          (item.fills.length && !hiddenImportFill) ||
          !Array.isArray(item.strokes) ||
          (item.type !== 'VECTOR' && item.strokes.length)))
    )
      throw new Error(
        'SVG sizing imported geometry or appearance is unsupported.'
      );
  }
  checkGeometryAndAppearance(node);
  const currentStrokeWidth =
    (plan.sourceStrokeWidth * node.width) / plan.viewBoxSize;
  const descendants = [];
  const vectors = [];
  function visit(parent) {
    for (const child of parent.children || []) {
      if (
        !['FRAME', 'GROUP', 'VECTOR'].includes(child.type) ||
        !('constraints' in child)
      )
        throw new Error('SVG sizing imported subtree is unsupported.');
      checkGeometryAndAppearance(child);
      descendants.push(child);
      if (child.type === 'VECTOR') {
        if (
          typeof child.setBoundVariable !== 'function' ||
          !Array.isArray(child.vectorPaths) ||
          !child.vectorPaths.length ||
          child.fills.length ||
          child.strokes.length !== 1 ||
          child.strokes[0].type !== 'SOLID' ||
          child.strokeAlign !== 'CENTER' ||
          !Number.isFinite(child.strokeWeight) ||
          !mgSvgSizingNativeFloatMatches(child.strokeWeight, currentStrokeWidth)
        )
          throw new Error(
            'SVG sizing requires unfilled uniform center-stroked native vectors.'
          );
        vectors.push(child);
      } else visit(child);
    }
  }
  visit(node);
  if (!vectors.length)
    throw new Error('SVG sizing imported no source vectors.');
  if (
    managed &&
    (node.boundVariables?.width?.id !== sizeVariable.id ||
      node.boundVariables?.height?.id !== sizeVariable.id ||
      descendants.some(
        child =>
          child.constraints.horizontal !== 'SCALE' ||
          child.constraints.vertical !== 'SCALE'
      ) ||
      vectors.some(
        vector =>
          vector.boundVariables?.strokeWeight?.id !== strokeVariable.id ||
          vector.strokes[0].boundVariables?.color?.id !==
            variable(plan.color, 'COLOR').id
      ))
  )
    throw new Error(
      'SVG sizing managed bindings or constraints changed; explicit migration required.'
    );
  return {
    node,
    plan,
    sizeVariable,
    strokeVariable,
    size,
    strokeWidth,
    descendants,
    vectors,
  };
}

function mgApplySvgSizing(nativePlan) {
  if (!nativePlan) return null;
  const {
    node,
    size,
    strokeWidth,
    sizeVariable,
    strokeVariable,
    descendants,
    vectors,
    plan,
  } = nativePlan;
  // The existing SVG renderer must delegate its rescale/binding phase here for
  // sized assets. Unbind before rescale so a rebuild cannot write a bound token.
  node.setBoundVariable('width', null);
  node.setBoundVariable('height', null);
  for (const vector of vectors) vector.setBoundVariable('strokeWeight', null);
  const scale = size / node.width;
  if (Math.abs(scale - 1) > 1e-12) node.rescale(scale);
  for (const child of descendants)
    child.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
  for (const vector of vectors)
    vector.setBoundVariable('strokeWeight', strokeVariable);
  node.layoutSizingHorizontal = node.layoutSizingVertical = 'FIXED';
  node.setBoundVariable('width', sizeVariable);
  node.setBoundVariable('height', sizeVariable);
  return {
    assetId: plan.assetId,
    size,
    strokeWidth,
    rescaled: Math.abs(scale - 1) > 1e-12,
    vectorCount: vectors.length,
    sizeVariableId: sizeVariable.id,
    strokeVariableId: strokeVariable.id,
    nativeModeChangeVerified: false,
  };
}
