/**
 * Mangrove-owned PropTypes extraction for the AI catalogue.
 *
 * Storybook 11's docgen server reads props through the TypeScript compiler.
 * Mangrove components are JavaScript and document props with PropTypes and
 * JSDoc, which that engine does not read: enums become `string` or `any`,
 * descriptions disappear and destructured props without defaults are marked
 * required. The published catalogue is a consumer contract, so props come
 * from react-docgen, used directly as a library rather than through
 * Storybook's deprecated builder-docgen integration. Storybook still decides
 * which file and export each component is; this module only reads it.
 *
 * The resolver and handler set match what Storybook 10 used, so the output
 * keeps the shape the generator already consumes.
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

// react-docgen is ESM-only. Loading it lazily through require() (supported
// for ESM since Node 22.12, the minimum in package.json) keeps this module
// synchronous and importable from Jest's CommonJS transform. Resolved from
// the repository root, where every script in this directory runs.
let docgen;
const loadDocgen = () => {
  if (!docgen) {
    const { builtinHandlers, builtinResolvers, makeFsImporter, parse } =
      createRequire(path.resolve('package.json'))('react-docgen');
    docgen = {
      parse,
      resolver: new builtinResolvers.FindExportedDefinitionsResolver(),
      importer: makeFsImporter(),
      handlers: [...Object.values(builtinHandlers), nameHandler],
    };
  }
  return docgen;
};

/** Record which binding a definition came from, for export matching. */
const nameHandler = (documentation, definition) => {
  const named = node =>
    node?.isIdentifier?.() ? node.node.name : node?.node?.value;
  if (
    (definition.isClassDeclaration() || definition.isFunctionDeclaration()) &&
    definition.has('id')
  ) {
    documentation.set('actualName', named(definition.get('id')));
    return;
  }
  for (let current = definition; current.parentPath;) {
    const parent = current.parentPath;
    if (parent.isVariableDeclarator()) {
      documentation.set('actualName', named(parent.get('id')));
      return;
    }
    if (parent.isAssignmentExpression()) {
      documentation.set('actualName', named(parent.get('left')));
      return;
    }
    current = parent;
  }
};

const cache = new Map();

function parseFile(filePath) {
  if (!cache.has(filePath)) {
    const { parse, resolver, handlers, importer } = loadDocgen();
    let docs;
    try {
      docs = parse(fs.readFileSync(filePath, 'utf8'), {
        resolver,
        handlers,
        importer,
        filename: filePath,
        // Parse with react-docgen's own syntax plugins only. The project's
        // babel.config.js targets bundling and test transforms, not parsing.
        babelOptions: { babelrc: false, configFile: false },
      });
    } catch {
      // No component definition (CSS-only story, re-export barrel, parse
      // failure): let the caller fall back to the docgen server's data.
      docs = [];
    }
    cache.set(filePath, docs);
  }
  return cache.get(filePath);
}

/**
 * Return react-docgen documentation for one component, or undefined.
 * `names` are candidate identifiers (export name, display name), tried in order.
 */
export function readPropTypesDocgen(filePath, names = []) {
  if (typeof filePath !== 'string' || !fs.existsSync(filePath)) return;
  const docs = parseFile(filePath);
  if (!docs.length) return;
  const wanted = names.filter(n => typeof n === 'string' && n);
  const match =
    wanted
      .map(name =>
        docs.find(doc => doc.actualName === name || doc.displayName === name)
      )
      .find(Boolean) ?? (docs.length === 1 ? docs[0] : undefined);
  if (!match) return;
  const { actualName, ...documentation } = match;
  return { ...documentation, definedInFile: filePath };
}

/** Split a leading `{type}` (braces may nest) from a tag body. */
function splitType(text) {
  if (!text.startsWith('{')) return ['', text];
  let depth = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '{') depth += 1;
    else if (text[i] === '}' && --depth === 0)
      return [text.slice(0, i + 1), text.slice(i + 1).trim()];
  }
  return ['', text];
}

/** Split a param name, optionally `[bracketed=with [] default]`, from its text. */
function splitName(text) {
  if (!text) return;
  if (!text.startsWith('[')) {
    const plain = text.match(/^(\S+)\s*(.*)$/);
    return plain && [plain[1], plain[2]];
  }
  let depth = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '[') depth += 1;
    else if (text[i] === ']' && --depth === 0)
      return [text.slice(0, i + 1), text.slice(i + 1).trim()];
  }
}

/**
 * Read block tags from a docblock into `{ tag: [text, ...] }`, in the form
 * the catalogue has always consumed: whitespace collapsed, `{type}` kept,
 * and @param names without optional brackets or defaults
 * (`[props.size='large']` becomes `props.size`). Storybook 11's own helper
 * now drops the type, which the generator's @param parsing relies on.
 */
export function readJsDocTags(docblock) {
  if (typeof docblock !== 'string') return {};
  const tags = {};
  let current;
  for (const line of docblock.split('\n')) {
    const start = line.trim().match(/^@(\w+)\s*(.*)$/);
    if (start) {
      current = { tag: start[1], text: start[2] };
      (tags[current.tag] ??= []).push(current);
    } else if (current) {
      current.text += `\n${line}`;
    }
  }
  return Object.fromEntries(
    Object.entries(tags).map(([tag, entries]) => [
      tag,
      entries.map(({ text }) => {
        const collapsed = text.replace(/\s+/g, ' ').trim();
        if (tag !== 'param') return collapsed;
        const [type, rest] = splitType(collapsed);
        const name = splitName(rest);
        if (!name) return collapsed;
        const bare = name[0].replace(/^\[|\]$/g, '').replace(/=.*$/, '');
        return [type, bare, name[1]].filter(Boolean).join(' ');
      }),
    ])
  );
}

const sourceExtensions = ['', '.jsx', '.js', '.tsx', '.ts', '.mjs'];

/**
 * Find the file and imported name behind a story file's `meta.component`.
 * Used when the docgen server could not resolve the component (for example
 * `export const Gallery = React.memo(GalleryComponent)`), which react-docgen
 * documents. Only relative imports are followed; anything else returns
 * undefined and the component keeps the docgen server's error.
 */
export function resolveStoryComponent(storyPath, rootDir = process.cwd()) {
  if (typeof storyPath !== 'string') return;
  const storyFile = path.resolve(rootDir, storyPath);
  if (!fs.existsSync(storyFile)) return;
  const source = fs.readFileSync(storyFile, 'utf8');
  const local = source.match(
    /export\s+default\s*\{[\s\S]*?\bcomponent:\s*([A-Za-z_$][\w$]*)/
  )?.[1];
  if (!local) return;
  for (const statement of source.matchAll(
    /import\s+([\s\S]*?)\s+from\s+['"](\.{1,2}\/[^'"]+)['"]/g
  )) {
    const [, clause, specifier] = statement;
    let imported;
    if (new RegExp(`^${local}\\b`).test(clause.trim())) imported = 'default';
    for (const part of clause.match(/\{([^}]*)\}/)?.[1].split(',') ?? []) {
      const [name, alias] = part.trim().split(/\s+as\s+/);
      if ((alias ?? name) === local) imported = name;
    }
    if (!imported) continue;
    const base = path.resolve(path.dirname(storyFile), specifier);
    const candidates = [
      ...sourceExtensions.map(ext => base + ext),
      ...sourceExtensions.slice(1).map(ext => path.join(base, `index${ext}`)),
    ];
    const filePath = candidates.find(
      file => fs.existsSync(file) && fs.statSync(file).isFile()
    );
    return filePath && { filePath, names: [imported, local] };
  }
}

/** A docblock's prose before its first block tag, or undefined if empty. */
export function docblockText(docblock) {
  if (typeof docblock !== 'string') return;
  const text = docblock.split(/^\s*@\w+/m)[0].trim();
  return text || undefined;
}
