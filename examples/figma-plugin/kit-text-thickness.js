/* global module */
/** Bounded plain TEXT pixel underline profile. No shared style or rich migration. */
function mgTextThicknessPlan(tree) {
  if (tree.textDecorationThickness === undefined) return null;
  const value = tree.textDecorationThickness;
  if (
    tree.type !== 'TEXT' ||
    tree.textRuns !== undefined ||
    tree.textDecoration !== 'UNDERLINE' ||
    tree.bindings?.textDecorationThickness !== undefined ||
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).length !== 2 ||
    Object.keys(value).some(key => !['unit', 'value'].includes(key)) ||
    value.unit !== 'PIXELS' ||
    !Number.isFinite(value.value) ||
    value.value <= 0
  )
    throw Error(
      'Plain TEXT underline thickness requires explicit UNDERLINE and positive PIXELS.'
    );
  return Object.freeze({ unit: 'PIXELS', value: value.value });
}
function mgNativeTextThicknessPlan(node, value) {
  if (
    !node ||
    node.type !== 'TEXT' ||
    node.removed ||
    !('textDecorationThickness' in node)
  )
    throw Error('Native TEXT underline thickness API is unavailable.');
  const native = node.textDecorationThickness;
  if (
    native !== null &&
    (!native ||
      typeof native !== 'object' ||
      Array.isArray(native) ||
      (native.unit === 'AUTO'
        ? Object.keys(native).length !== 1
        : !['PIXELS', 'PERCENT'].includes(native.unit) ||
          Object.keys(native).length !== 2 ||
          Object.keys(native).some(key => !['unit', 'value'].includes(key)) ||
          !Number.isFinite(native.value) ||
          native.value < 0))
  )
    throw Error('Native TEXT underline thickness is mixed or malformed.');
  if (
    !value ||
    value.unit !== 'PIXELS' ||
    !Number.isFinite(value.value) ||
    value.value <= 0
  )
    throw Error('Native underline thickness plan is invalid.');
  return { node, value: { unit: 'PIXELS', value: value.value } };
}
function mgApplyTextThickness(plan) {
  const fresh = mgNativeTextThicknessPlan(plan.node, plan.value);
  if (fresh.node.textDecoration !== 'UNDERLINE')
    throw Error('Native underline thickness needs underlined TEXT.');
  fresh.node.textDecorationThickness = { ...fresh.value };
  const after = fresh.node.textDecorationThickness;
  if (!after || after.unit !== 'PIXELS' || after.value !== fresh.value.value)
    throw Error('Native underline thickness readback disagrees with profile.');
}
if (typeof module !== 'undefined')
  module.exports = {
    mgTextThicknessPlan,
    mgNativeTextThicknessPlan,
    mgApplyTextThickness,
  };
