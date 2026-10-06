/* global module */
/** Documented subtree ALPHA-mask source candidate. Rendered native parity is unproved. */
function mgAlphaMaskPlan(tree, owner, childIndex) {
  if (tree.alphaMask === undefined) return null;
  const declaration = tree.alphaMask;
  const kind = declaration?.type;
  if (
    !declaration ||
    typeof declaration !== 'object' ||
    Array.isArray(declaration) ||
    Object.keys(declaration).join(',') !== 'type' ||
    !['ALPHA', 'NONE'].includes(kind) ||
    tree.type !== 'FRAME' ||
    (tree.children !== undefined &&
      (!Array.isArray(tree.children) || tree.children.length !== 0)) ||
    !owner ||
    owner.type !== 'FRAME' ||
    !['VERTICAL', 'HORIZONTAL'].includes(owner.layout?.mode) ||
    !Array.isArray(owner.children) ||
    owner.children.length !== 2 ||
    owner.children[0] !== tree ||
    childIndex !== 0 ||
    owner.children[1]?.type !== 'FRAME' ||
    ![tree.id, owner.id, owner.children[1].id].every(
      id => typeof id === 'string' && id.trim()
    ) ||
    new Set([tree.id, owner.id, owner.children[1].id]).size !== 3 ||
    tree.absolute?.horizontal !== 'START' ||
    tree.absolute?.vertical !== 'START' ||
    tree.fill !== undefined ||
    tree.image !== undefined ||
    tree.stroke !== undefined ||
    tree.effectStyle !== undefined ||
    tree.effects !== undefined ||
    (tree.bindings !== undefined &&
      (!tree.bindings ||
        typeof tree.bindings !== 'object' ||
        Array.isArray(tree.bindings) ||
        Object.keys(tree.bindings).length)) ||
    tree.opacity !== undefined ||
    tree.visibilityProperty !== undefined ||
    (kind === 'ALPHA' &&
      (owner.layout?.clipsContent !== true || !tree.gradient)) ||
    (kind === 'NONE' && tree.gradient !== undefined)
  )
    throw Error(
      'ALPHA mask needs first transparent leaf FRAME, absolute START/START, and exact two-child FRAME owner.'
    );
  if (kind === 'ALPHA') {
    const gradient = tree.gradient;
    if (
      !gradient ||
      Object.keys(gradient).join(',') !== 'layers' ||
      !Array.isArray(gradient.layers) ||
      gradient.layers.length !== 1
    )
      throw Error('ALPHA mask needs exactly one source gradient layer.');
    const layer = gradient.layers[0];
    if (
      !layer ||
      Object.keys(layer).some(
        k => !['stops', 'transform', 'transformVariables'].includes(k)
      ) ||
      !Array.isArray(layer.stops) ||
      layer.stops.length < 2 ||
      layer.stops.length > 5 ||
      !Array.isArray(layer.transform) ||
      layer.transform.length !== 2 ||
      layer.transform.some(
        row =>
          !Array.isArray(row) ||
          row.length !== 3 ||
          row.some(n => !Number.isFinite(n))
      )
    )
      throw Error('ALPHA mask gradient geometry is invalid.');
    let prior = -1;
    for (const stop of layer.stops) {
      if (
        !stop ||
        Object.keys(stop).some(k => !['position', 'color'].includes(k)) ||
        !Number.isFinite(stop.position) ||
        stop.position < 0 ||
        stop.position > 1 ||
        stop.position < prior ||
        typeof stop.color !== 'string' ||
        !stop.color.trim()
      )
        throw Error('ALPHA mask gradient stops are invalid.');
      prior = stop.position;
    }
    if (layer.stops[0].position !== 0 || layer.stops.at(-1).position !== 1)
      throw Error('ALPHA mask must span its entire fixed gradient viewport.');
    if (
      layer.transformVariables !== undefined &&
      (!Array.isArray(layer.transformVariables) ||
        layer.transformVariables.length !== 2 ||
        layer.transformVariables.some(
          row =>
            !Array.isArray(row) ||
            row.length !== 3 ||
            row.some(n => n !== null && (typeof n !== 'string' || !n.trim()))
        ))
    )
      throw Error('ALPHA mask gradient transform aliases are invalid.');
  }
  const sourceSignature = JSON.stringify({
    tree,
    owner: {
      id: owner.id,
      type: owner.type,
      layout: owner.layout,
      children: owner.children.map(n => ({ id: n.id, type: n.type })),
    },
  });
  return Object.freeze({
    kind,
    tree,
    owner,
    sourceSignature,
    recipeIdentities: Object.freeze({
      mask: tree.id,
      owner: owner.id,
      content: owner.children[1].id,
    }),
  });
}
function mgAlphaMaskValues(plan, modeIds, resolve) {
  if (!plan) return null;
  if (
    !Array.isArray(modeIds) ||
    !modeIds.length ||
    new Set(modeIds).size !== modeIds.length ||
    !modeIds.every(id => typeof id === 'string' && id.trim()) ||
    typeof resolve !== 'function'
  )
    throw Error('ALPHA mask needs every selected mode and a typed resolver.');
  if (
    mgAlphaMaskPlan(plan.tree, plan.owner, 0).sourceSignature !==
    plan.sourceSignature
  )
    throw Error('ALPHA mask source changed after preparation.');
  const result = {};
  for (const mode of modeIds) {
    const number = (value, positive) => {
      const n =
        typeof value === 'string' ? resolve(value, mode, 'FLOAT') : value;
      if (!Number.isFinite(n) || (positive && n <= 0))
        throw Error(
          'ALPHA mask dimensions and offsets must be finite typed FLOAT values.'
        );
      return n;
    };
    const width = number(plan.tree.layout?.width, true),
      height = number(plan.tree.layout?.height, true);
    const ownerWidth = number(plan.owner.layout?.width, true),
      ownerHeight = number(plan.owner.layout?.height, true);
    if (
      number(plan.tree.absolute?.offsetX, false) !== 0 ||
      number(plan.tree.absolute?.offsetY, false) !== 0 ||
      (plan.kind === 'ALPHA' && (width !== ownerWidth || height < ownerHeight))
    )
      throw Error(
        'ALPHA mask viewport must start at zero and cover its clipping owner.'
      );
    if (plan.kind === 'ALPHA') {
      const layer = plan.tree.gradient.layers[0];
      const transform = layer.transform.map((row, r) =>
        row.map((v, c) =>
          layer.transformVariables?.[r]?.[c] === null ||
          layer.transformVariables?.[r]?.[c] === undefined
            ? v
            : number(layer.transformVariables[r][c], false)
        )
      );
      const determinant =
        transform[0][0] * transform[1][1] - transform[0][1] * transform[1][0];
      if (!Number.isFinite(determinant) || determinant === 0)
        throw Error('ALPHA mask gradient transform must be invertible.');
      const colors = layer.stops.map(stop => {
        const color = resolve(stop.color, mode, 'COLOR');
        if (
          !color ||
          typeof color !== 'object' ||
          Array.isArray(color) ||
          ['r', 'g', 'b'].some(
            k => !Number.isFinite(color[k]) || color[k] < 0 || color[k] > 1
          ) ||
          (color.a !== undefined &&
            (!Number.isFinite(color.a) || color.a < 0 || color.a > 1))
        )
          throw Error(
            'ALPHA mask source COLOR must have finite RGB and optional alpha in 0..1.'
          );
        return { ...color, a: color.a ?? 1 };
      });
      if (!colors.some(color => color.a === 1) || colors.at(-1).a !== 0)
        throw Error(
          'ALPHA mask needs an opaque stop and transparent final source role.'
        );
      result[mode] = {
        width,
        height,
        ownerWidth,
        ownerHeight,
        transform,
        colors,
      };
    } else result[mode] = { width, height, ownerWidth, ownerHeight };
  }
  return result;
}
function mgAlphaMaskDocumentValues(plan, doc) {
  if (!plan) return null;
  const resolve = (name, mode, type, seen = new Set()) => {
    if (seen.has(name)) throw Error('ALPHA mask source alias cycle.');
    seen.add(name);
    const hits = doc.variables.filter(v => v.name === name);
    if (
      hits.length !== 1 ||
      hits[0].type !== type ||
      hits[0].values?.[mode] === undefined
    )
      throw Error('ALPHA mask source role is missing or has wrong type/mode.');
    const value = hits[0].values[mode];
    if (
      value &&
      typeof value === 'object' &&
      value.alias !== undefined &&
      Object.keys(value).join(',') !== 'alias'
    )
      throw Error('ALPHA mask alias must contain only its source role name.');
    return value && typeof value === 'object' && value.alias !== undefined
      ? typeof value.alias === 'string'
        ? resolve(value.alias, mode, type, seen)
        : (() => {
            throw Error('ALPHA mask alias must name a source role.');
          })()
      : value;
  };
  return mgAlphaMaskValues(
    plan,
    doc.modes.map(m => m.id),
    resolve
  );
}
function mgAlphaMaskNativeValues(plan, modeIds, resolve) {
  return mgAlphaMaskValues(plan, modeIds, resolve);
}
function mgNativeAlphaMaskPlan(node, owner, content, sourcePlan, identity) {
  if (!sourcePlan) {
    if (node && identity?.readState?.(node))
      throw Error(
        'Owned native mask requires explicit ALPHA or NONE source declaration.'
      );
    return null;
  }
  if (
    mgAlphaMaskPlan(sourcePlan.tree, sourcePlan.owner, 0).sourceSignature !==
    sourcePlan.sourceSignature
  )
    throw Error('ALPHA mask source changed after preparation.');
  if (![node, owner, content].some(Boolean))
    return { fresh: true, sourcePlan, identity };
  if (![node, owner, content].every(Boolean))
    throw Error('ALPHA mask native closure is partial.');
  if (
    !identity ||
    typeof identity.get !== 'function' ||
    typeof identity.readState !== 'function' ||
    typeof identity.writeState !== 'function' ||
    !['mask', 'owner', 'content'].every(
      k =>
        typeof identity.expected?.[k] === 'string' &&
        identity.expected[k].trim()
    ) ||
    Object.keys(identity.expected).sort().join(',') !== 'content,mask,owner' ||
    new Set(Object.values(identity.expected)).size !== 3
  )
    throw Error('ALPHA mask needs exact native managed identities.');
  if (
    [node, owner, content].some(n => n.removed || n.type !== 'FRAME') ||
    node.parent?.id !== owner.id ||
    content.parent?.id !== owner.id ||
    owner.children?.length !== 2 ||
    owner.children[0]?.id !== node.id ||
    owner.children[1]?.id !== content.id ||
    identity.get(node) !== identity.expected.mask ||
    identity.get(owner) !== identity.expected.owner ||
    identity.get(content) !== identity.expected.content ||
    typeof node.isMask !== 'boolean' ||
    !['ALPHA', 'VECTOR', 'LUMINANCE'].includes(node.maskType)
  )
    throw Error(
      'ALPHA mask native API, ownership, parent or sibling order disagrees.'
    );
  const raw = identity.readState(node);
  if (typeof raw !== 'string')
    throw Error('ALPHA mask ownership state must be a string.');
  const observed = {
    version: 1,
    nodeId: node.id,
    ownerId: owner.id,
    contentId: content.id,
    maskIdentity: identity.get(node),
    ownerIdentity: identity.get(owner),
    contentIdentity: identity.get(content),
    isMask: node.isMask,
    maskType: node.maskType,
    children: owner.children.map(n => n.id),
  };
  if (raw) {
    let ledger;
    try {
      ledger = JSON.parse(raw);
    } catch {
      throw Error('ALPHA mask ownership ledger is malformed.');
    }
    if (JSON.stringify(ledger) !== JSON.stringify(observed))
      throw Error('ALPHA mask owned native fields or closure changed.');
  } else if (node.isMask)
    throw Error('ALPHA mask refuses a foreign preexisting native mask.');
  return {
    node,
    owner,
    content,
    sourcePlan,
    identity,
    observed,
    priorLedger: raw,
    fresh: false,
  };
}
function mgApplyAlphaMask(plan) {
  if (!plan || plan.fresh)
    throw Error(
      'ALPHA mask must be applied after complete child materialization.'
    );
  const fresh = mgNativeAlphaMaskPlan(
    plan.node,
    plan.owner,
    plan.content,
    plan.sourcePlan,
    plan.identity
  );
  if (
    fresh.priorLedger !== plan.priorLedger ||
    JSON.stringify(fresh.observed) !== JSON.stringify(plan.observed)
  )
    throw Error('ALPHA mask changed after native preflight.');
  const node = fresh.node;
  node.isMask = fresh.sourcePlan.kind === 'ALPHA';
  node.maskType = 'ALPHA';
  if (
    node.isMask !== (fresh.sourcePlan.kind === 'ALPHA') ||
    node.maskType !== 'ALPHA'
  )
    throw Error('ALPHA mask native property readback disagrees.');
  const ledger = {
    ...fresh.observed,
    isMask: node.isMask,
    maskType: node.maskType,
  };
  fresh.identity.writeState(node, JSON.stringify(ledger));
  if (fresh.identity.readState(node) !== JSON.stringify(ledger))
    throw Error('ALPHA mask ownership ledger readback disagrees.');
}
if (typeof module !== 'undefined')
  module.exports = {
    mgAlphaMaskPlan,
    mgAlphaMaskDocumentValues,
    mgAlphaMaskNativeValues,
    mgNativeAlphaMaskPlan,
    mgApplyAlphaMask,
  };
