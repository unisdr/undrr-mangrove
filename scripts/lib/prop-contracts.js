/**
 * Typed JSDoc and PropTypes as two statements of one prop contract.
 *
 * Storybook 11's docgen server reads props through the TypeScript compiler,
 * which understands typed JSDoc `@param` blocks but not PropTypes. PropTypes
 * stay for React 18's runtime warnings, so each component states its props
 * twice. This module drafts the JSDoc from the PropTypes and checks that the
 * two agree (unisdr/undrr-mangrove#1511).
 *
 * PropTypes are read with react-docgen through react-docgen-source.js, the
 * same reader the AI catalogue uses.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  readPropTypesDocgen,
  resolveStoryComponent,
} from '../ai-manifest/react-docgen-source.js';

const simpleTypes = {
  string: 'string',
  number: 'number',
  bool: 'boolean',
  func: 'Function',
  node: 'React.ReactNode',
  element: 'React.ReactElement',
  elementType: 'React.ElementType',
  object: 'Object',
  array: 'Array',
  symbol: 'symbol',
  any: '*',
};

/** PropTypes types that make no claim, so an untyped result is expected. */
const untypedPropTypes = new Set(['any', 'custom']);

/**
 * Translate one react-docgen PropTypes type into a JSDoc type expression.
 * Computed enums (`oneOf(Object.keys(map))`) cannot be listed, so they fall
 * back to `string` for a human to refine.
 */
export function jsDocType(type) {
  if (!type || typeof type.name !== 'string') return '*';
  if (simpleTypes[type.name]) return simpleTypes[type.name];
  switch (type.name) {
    case 'enum':
      if (
        !Array.isArray(type.value) ||
        !type.value.length ||
        type.value.some(v => v.computed)
      )
        return 'string';
      return type.value.map(v => v.value).join('|');
    case 'union':
      return Array.isArray(type.value)
        ? type.value.map(jsDocType).join('|')
        : '*';
    case 'arrayOf':
      return `Array<${jsDocType(type.value)}>`;
    case 'objectOf':
      return `Object<string, ${jsDocType(type.value)}>`;
    case 'instanceOf':
      return typeof type.value === 'string' ? type.value : 'Object';
    case 'shape':
    case 'exact': {
      if (!type.value || typeof type.value !== 'object') return 'Object';
      const fields = Object.entries(type.value).map(
        ([key, field]) =>
          `${key}${field.required ? '' : '?'}: ${jsDocType(field)}`
      );
      return fields.length ? `{${fields.join(', ')}}` : 'Object';
    }
    default:
      return '*';
  }
}

/** Collapse a PropTypes comment to one line for a `@param` description. */
const oneLine = text =>
  typeof text === 'string' ? text.replace(/\s+/g, ' ').trim() : '';

/**
 * Draft a typed `@param` block, one line per prop, from react-docgen
 * documentation. Props react-docgen found only through a destructured
 * default (no PropTypes entry) are drafted too, typed `*`, so the gap is
 * visible in review.
 */
export function draftJsDocParams(documentation, { prefix = ' * ' } = {}) {
  const props = documentation?.props ?? {};
  const entries = Object.entries(props).map(([name, prop]) => {
    const type = prop.type ? jsDocType(prop.type) : '*';
    const fallback = prop.defaultValue?.value;
    const label = prop.required
      ? `props.${name}`
      : `[props.${name}${fallback === undefined ? '' : `=${fallback}`}]`;
    return {
      head: `@param {${type}} ${label}`,
      description: oneLine(prop.description),
    };
  });
  const width = Math.min(
    60,
    Math.max(0, ...entries.map(entry => entry.head.length))
  );
  return [
    `${prefix}@param {Object} props`,
    ...entries.map(({ head, description }) =>
      description
        ? `${prefix}${head.padEnd(width)} ${description}`
        : `${prefix}${head}`
    ),
  ].join('\n');
}

/**
 * True when the docgen server's type carries no information: `any`,
 * `unknown`, or something inferred from an empty default such as `never[]`,
 * `{}` or `null`.
 */
const emptyTypes = new Set(['any', 'unknown', 'never', '{}', 'null']);

export function isUntyped(type) {
  const name = typeof type?.name === 'string' ? type.name.trim() : '';
  if (!name) return true;
  // Judge the type as a whole, so `ReactElement<any>` or `Array<any>`-like
  // generic arguments do not count; `undefined` members add nothing.
  const members = name
    .split('|')
    .map(member => member.trim().replace(/^\((.*)\)$/, '$1'))
    .map(member => member.replace(/(\[\])+$/, ''))
    .filter(member => member !== 'undefined');
  return !members.length || members.every(member => emptyTypes.has(member));
}

/**
 * Canonical form of one enum member. A string literal loses its quote style
 * (`'a'`, `"a"` and `` `a` `` are one member); anything else (a number,
 * `true`, `null`) is kept as written, so the string `'2'` and the number `2`
 * stay different. Returns the comparison key and the label for reports.
 */
function enumMember(raw) {
  const text = String(raw).trim();
  const quoted = text.match(/^(['"`])([\s\S]*)\1$/);
  return quoted
    ? { key: `string:${quoted[2]}`, label: `'${quoted[2]}'` }
    : { key: `literal:${text}`, label: text };
}

/**
 * The literal members of an enum type as a Map of key to label, or undefined
 * when the type is not an enum or cannot be listed (a computed
 * `oneOf(Object.keys(map))`). `undefined` is dropped: the docgen server may
 * add it to an optional prop's union, and optionality is compared separately.
 */
export function enumMembers(type) {
  if (type?.name !== 'enum' || !Array.isArray(type.value)) return undefined;
  if (!type.value.length || type.value.some(member => member?.computed))
    return undefined;
  const members = new Map();
  for (const member of type.value) {
    const value = member?.value;
    if (value === undefined || String(value).trim() === 'undefined') continue;
    const { key, label } = enumMember(value);
    members.set(key, label);
  }
  return members;
}

/**
 * Normalise a default value's source text for comparison: one quote style,
 * whitespace collapsed and dropped beside punctuation, no trailing commas.
 * `{ a: "x", }` and `{a: 'x'}` normalise to the same text.
 */
export function normaliseDefault(text) {
  return String(text)
    .replace(/"/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}[\](),:])\s*/g, '$1')
    .replace(/,([}\]])/g, '$1')
    .trim();
}

/**
 * The normalized Storybook metadata can put a nullable string enum
 * in the type name as TypeScript union text. Recover its members only when every part is a
 * literal. Wider unions such as `string | null` still fail the enum check.
 */
function nullableStringEnumMembers(type) {
  if (typeof type?.name !== 'string') return undefined;
  const literals = type.name.split('|').map(value => value.trim());
  const isStringLiteral = value =>
    /^(?:"[^"\\\r\n]*"|'[^'\\\r\n]*')$/.test(value);
  if (
    !literals.includes('null') ||
    !literals.some(isStringLiteral) ||
    !literals.every(
      value =>
        value === 'null' || value === 'undefined' || isStringLiteral(value)
    )
  )
    return undefined;
  return enumMembers({
    name: 'enum',
    value: literals.map(value => ({ value })),
  });
}

/**
 * Where PropTypes list literal `oneOf` values, the docgen server must state
 * the same members, in any order and quote style.
 */
function compareEnums(name, serverType, propType) {
  const expected = enumMembers(propType);
  if (!expected) return [];
  const actual =
    enumMembers(serverType) ?? nullableStringEnumMembers(serverType);
  if (!actual) {
    // An untyped server type is reported by the type check already.
    if (isUntyped(serverType)) return [];
    return [
      `${name}: docgen server type is \`${serverType?.raw ?? serverType?.name}\`, PropTypes list ${[...expected.values()].join(', ')}`,
    ];
  }
  const missing = [...expected].filter(([key]) => !actual.has(key));
  const extra = [...actual].filter(([key]) => !expected.has(key));
  const problems = [];
  if (missing.length)
    problems.push(
      `${name}: docgen server enum lacks ${missing.map(([, label]) => label).join(', ')}, listed in PropTypes`
    );
  if (extra.length)
    problems.push(
      `${name}: docgen server enum has ${extra.map(([, label]) => label).join(', ')}, not in PropTypes`
    );
  return problems;
}

/** Where both sides state a default, the defaults must match. */
function compareDefaults(name, serverDefault, propDefault) {
  const server = serverDefault?.value;
  const prop = propDefault?.value;
  if (server == null || prop == null) return [];
  if (normaliseDefault(server) === normaliseDefault(prop)) return [];
  return [
    `${name}: docgen server default is \`${oneLine(String(server))}\`, react-docgen default is \`${oneLine(String(prop))}\``,
  ];
}

/**
 * Compare one component's docgen-server props with its PropTypes props.
 * Returns a list of human-readable problems; empty means they agree.
 *
 * - every PropTypes prop is documented by the docgen server, and vice versa;
 * - optionality matches (`isRequired` against `required`);
 * - the docgen server has a real type wherever PropTypes give one;
 * - where PropTypes list `oneOf` literals, the docgen server lists the same
 *   members, ignoring order and quote style;
 * - where both sides state a default, the defaults match, ignoring quote
 *   style and whitespace.
 */
export function compareContracts(serverProps = {}, propTypesProps = {}) {
  const problems = [];
  const typed = Object.fromEntries(
    Object.entries(propTypesProps).filter(([, prop]) => prop?.type)
  );
  for (const name of Object.keys(typed)) {
    if (!Object.hasOwn(serverProps, name))
      problems.push(`${name}: in PropTypes, missing from the docgen server`);
  }
  for (const [name, server] of Object.entries(serverProps)) {
    const prop = Object.hasOwn(typed, name) ? typed[name] : undefined;
    if (!prop) {
      problems.push(
        `${name}: documented by the docgen server, not in PropTypes`
      );
      continue;
    }
    const required = Boolean(prop.required);
    if (Boolean(server?.required) !== required) {
      problems.push(
        `${name}: docgen server says ${server?.required ? 'required' : 'optional'}, PropTypes say ${required ? 'required' : 'optional'}`
      );
    }
    if (!untypedPropTypes.has(prop.type.name) && isUntyped(server?.type)) {
      problems.push(
        `${name}: docgen server type is \`${server?.type?.name ?? 'missing'}\`, PropTypes give \`${jsDocType(prop.type)}\``
      );
    }
    problems.push(...compareEnums(name, server?.type, prop.type));
    problems.push(
      ...compareDefaults(name, server?.defaultValue, prop.defaultValue)
    );
  }
  return problems;
}

/**
 * Read every component the docgen server documented in a Storybook build,
 * paired with its PropTypes documentation. Components without PropTypes are
 * returned with `propTypes: undefined` so the caller can skip them.
 */
export function readBuiltContracts(
  buildDir,
  {
    readDocgen = readPropTypesDocgen,
    resolveComponent = resolveStoryComponent,
  } = {}
) {
  const dir = path.join(buildDir, 'services', 'core', 'docgen');
  if (!fs.existsSync(dir))
    throw new Error(
      `No docgen server output in ${dir}. The docgen server is off by ` +
        'default, so build Storybook with it on first:\n' +
        `  MANGROVE_DOCGEN_SERVER=true yarn exec storybook build -o ${buildDir}\n` +
        `then run: yarn check:prop-contracts --build-dir=${buildDir}`
    );
  const results = [];
  for (const file of fs.readdirSync(dir).sort()) {
    if (!file.endsWith('.json')) continue;
    const payload = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    for (const [id, component] of Object.entries(payload.components ?? {})) {
      const meta = component.reactComponentMeta;
      const target = meta
        ? {
            filePath: meta.filePath,
            names: [meta.exportName, meta.displayName, component.name],
          }
        : resolveComponent(component.path);
      const docs = target && readDocgen(target.filePath, target.names);
      const propTypes =
        docs?.props && Object.values(docs.props).some(prop => prop?.type)
          ? docs.props
          : undefined;
      results.push({
        id,
        filePath: target?.filePath
          ? path.relative(process.cwd(), path.resolve(target.filePath))
          : component.path,
        serverProps: meta?.props,
        serverError: meta ? undefined : component.error,
        propTypes,
      });
    }
  }
  return results;
}

/**
 * Check built contracts. Every component with PropTypes is reported; only
 * those in `enforced` count as failures.
 */
export function checkContracts(contracts, enforced = []) {
  const enforce = new Set(enforced);
  const reports = contracts
    .filter(contract => contract.propTypes)
    .map(contract => ({
      ...contract,
      enforced: enforce.has(contract.id),
      problems: contract.serverProps
        ? compareContracts(contract.serverProps, contract.propTypes)
        : [
            `docgen server could not read the component${contract.serverError?.name ? ` (${oneLine(contract.serverError.name)})` : ''}`,
          ],
    }));
  const known = new Set(reports.map(report => report.id));
  const unknown = [...enforce].filter(id => !known.has(id));
  const failures = reports.filter(
    report => report.enforced && report.problems.length
  );
  return { reports, failures, unknown };
}
