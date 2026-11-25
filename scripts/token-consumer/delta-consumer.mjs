/** A small downstream consumer of standard DTCG data. No Mangrove runtime. */
const alias = /^\{([^{}]+)\}$/;

/** Resolve a complete document independently of Mangrove's build extensions. */
export function resolveDocument(document) {
  const tokens = new Map();
  const resolved = new Map();
  const active = new Set();
  const scan = (node, path = [], inheritedType) => {
    if (!node || typeof node !== 'object' || Array.isArray(node)) return;
    const type = node.$type || inheritedType;
    if (Object.hasOwn(node, '$value')) {
      tokens.set(path.join('.'), { type, value: node.$value });
      return;
    }
    for (const [key, child] of Object.entries(node))
      if (!key.startsWith('$')) scan(child, [...path, key], type);
  };
  scan(document);
  const pointer = ref => {
    if (!ref.startsWith('#/')) throw new Error(`Nonlocal reference: ${ref}`);
    let value = document;
    for (const key of ref
      .slice(2)
      .split('/')
      .map(part => part.replace(/~1/g, '/').replace(/~0/g, '~'))) {
      if (
        value === null ||
        typeof value !== 'object' ||
        !Object.hasOwn(value, key)
      )
        throw new Error(`Unresolved JSON Pointer: ${ref}`);
      value = value[key];
    }
    return value;
  };
  const expand = value => {
    if (typeof value === 'string' && alias.test(value))
      return resolve(value.slice(1, -1)).value;
    if (Array.isArray(value)) return value.map(expand);
    if (value && typeof value === 'object') {
      if (Object.hasOwn(value, '$ref')) {
        const key = `pointer:${value.$ref}`;
        if (active.has(key))
          throw new Error(`Circular reference: ${value.$ref}`);
        active.add(key);
        const result = expand(pointer(value.$ref));
        active.delete(key);
        return result;
      }
      return Object.fromEntries(
        Object.entries(value).map(([key, child]) => [key, expand(child)])
      );
    }
    return value;
  };
  const resolve = id => {
    if (resolved.has(id)) return resolved.get(id);
    if (active.has(id)) throw new Error(`Circular token alias: ${id}`);
    const token = tokens.get(id);
    if (!token) throw new Error(`Unknown token: ${id}`);
    active.add(id);
    const result = { type: token.type, value: expand(token.value) };
    active.delete(id);
    resolved.set(id, result);
    return result;
  };
  for (const id of tokens.keys()) resolve(id);
  return resolved;
}

/** This example needs colours, dimensions, font families and font weights. */
export function deltaStyles(document) {
  const tokens = resolveDocument(document);
  const get = (path, type) => {
    const token = tokens.get(path);
    if (!token || token.type !== type)
      throw new Error(`Expected ${type}: ${path}`);
    return token.value;
  };
  const color = path => {
    const value = get(path, 'color');
    if (value.colorSpace !== 'srgb' || !value.components.every(Number.isFinite))
      throw new Error(`Example requires numeric sRGB: ${path}`);
    return `rgb(${value.components.map(channel => Math.round(channel * 255)).join(' ')} / ${value.alpha ?? 1})`;
  };
  const dimension = path => {
    const value = get(path, 'dimension');
    if (!Number.isFinite(value.value) || !['px', 'rem'].includes(value.unit))
      throw new Error(`Unsupported dimension: ${path}`);
    return `${value.value}${value.unit}`;
  };
  const families = get('typography.font.sans', 'fontFamily');
  const fontFamily = (Array.isArray(families) ? families : [families])
    .map(name =>
      [
        'system-ui',
        '-apple-system',
        'sans-serif',
        'serif',
        'monospace',
      ].includes(name)
        ? name
        : JSON.stringify(name)
    )
    .join(', ');
  return {
    '--example-page': color('semantic.background.default'),
    '--example-surface': color('semantic.background.surface'),
    '--example-text': color('semantic.text.primary'),
    '--example-muted': color('semantic.text.secondary'),
    '--example-border': color('semantic.border.control'),
    '--example-action': color('semantic.action.default'),
    '--example-hover': color('semantic.action.hover'),
    '--example-inverse': color('semantic.text.inverse'),
    '--example-focus': color('semantic.focus.ring'),
    '--example-padding': dimension('spacing.sm'),
    '--example-gap': dimension('spacing.md'),
    '--example-radius': dimension('radius.md'),
    '--example-body-size': dimension('typography.size.body'),
    '--example-title-size': dimension('typography.size.title'),
    '--example-weight': String(get('typography.weight.medium', 'fontWeight')),
    '--example-regular': String(get('typography.weight.regular', 'fontWeight')),
    '--example-line-height': String(
      get('typography.lineHeight.normal', 'number')
    ),
    '--example-font': fontFamily,
  };
}
