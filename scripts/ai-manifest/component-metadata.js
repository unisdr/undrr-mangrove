/**
 * Versioned input boundary for the fields the AI generator consumes from
 * Storybook. This is an adapter contract, not a component/domain schema.
 * Unconsumed upstream fields are retained so adaptation cannot hide data loss.
 */
import fs from 'node:fs';
import path from 'node:path';

const object = value =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const own = (value, key) => Object.hasOwn(value, key);
const componentIdPattern = /^[a-z0-9][a-z0-9_-]*$/;
const reservedComponentIds = new Set([
  'index',
  'utilities',
  'tokens',
  'releases',
]);

export function normalizeComponentMetadata(
  value,
  { source = 'component metadata' } = {}
) {
  const fail = (where, expected) => {
    throw new Error(`${source}: ${where} must be ${expected}`);
  };
  const record = (entry, where) => {
    if (!object(entry)) fail(where, 'an object');
  };
  const string = (entry, where, nonempty = false) => {
    if (typeof entry !== 'string' || (nonempty && !entry.trim())) {
      fail(where, nonempty ? 'a nonempty string' : 'a string');
    }
  };
  const optionalString = (entry, key, where) => {
    if (own(entry, key)) string(entry[key], `${where}.${key}`);
  };
  const type = (entry, where) => {
    record(entry, where);
    string(entry.name, `${where}.name`, true);
    if (!own(entry, 'value')) return;
    if (entry.name === 'enum') {
      if (!Array.isArray(entry.value)) fail(`${where}.value`, 'an array');
      entry.value.forEach((member, index) => {
        record(member, `${where}.value[${index}]`);
        string(member.value, `${where}.value[${index}].value`);
      });
    } else if (entry.name === 'union') {
      if (!Array.isArray(entry.value)) fail(`${where}.value`, 'an array');
      entry.value.forEach((member, index) =>
        type(member, `${where}.value[${index}]`)
      );
    } else if (entry.name === 'shape') {
      record(entry.value, `${where}.value`);
      Object.entries(entry.value).forEach(([key, member]) =>
        type(member, `${where}.value.${key}`)
      );
    } else if (entry.name === 'arrayOf' || entry.name === 'objectOf') {
      type(entry.value, `${where}.value`);
    } else if (entry.name === 'instanceOf') {
      string(entry.value, `${where}.value`);
    }
  };
  record(value, 'manifest');
  if (value.v !== 0 && value.v !== 1)
    fail('manifest.v', 'the supported Storybook version 0 or 1');
  record(value.components, 'manifest.components');
  if (!Object.keys(value.components).length)
    fail('manifest.components', 'a nonempty component map');
  const storyIds = new Set();
  Object.entries(value.components).forEach(([key, component]) => {
    const where = `components.${key}`;
    record(component, where);
    for (const field of ['id', 'name', 'path'])
      string(component[field], `${where}.${field}`, true);
    if (component.id !== key)
      fail(`${where}.id`, `equal to its map key (${key})`);
    // IDs become catalogue filenames and ordinary-map lookup keys downstream.
    if (!componentIdPattern.test(key) || own(Object.prototype, key))
      fail(`${where}.id`, 'a safe lowercase component identifier');
    if (reservedComponentIds.has(key))
      fail(`${where}.id`, 'different from reserved catalogue filenames');
    optionalString(component, 'description', where);
    optionalString(component, 'import', where);
    if (own(component, 'jsDocTags')) {
      record(component.jsDocTags, `${where}.jsDocTags`);
      if (own(component.jsDocTags, 'param')) {
        if (!Array.isArray(component.jsDocTags.param))
          fail(`${where}.jsDocTags.param`, 'an array');
        component.jsDocTags.param.forEach((tag, index) =>
          string(tag, `${where}.jsDocTags.param[${index}]`)
        );
      }
    }
    if (own(component, 'reactDocgen')) {
      record(component.reactDocgen, `${where}.reactDocgen`);
      optionalString(
        component.reactDocgen,
        'description',
        `${where}.reactDocgen`
      );
      if (own(component.reactDocgen, 'props')) {
        record(component.reactDocgen.props, `${where}.reactDocgen.props`);
        Object.entries(component.reactDocgen.props).forEach(([name, prop]) => {
          const propPath = `${where}.reactDocgen.props.${name}`;
          record(prop, propPath);
          optionalString(prop, 'description', propPath);
          if (own(prop, 'required') && typeof prop.required !== 'boolean')
            fail(`${propPath}.required`, 'a boolean');
          if (own(prop, 'type')) type(prop.type, `${propPath}.type`);
          if (own(prop, 'defaultValue')) {
            record(prop.defaultValue, `${propPath}.defaultValue`);
            string(prop.defaultValue.value, `${propPath}.defaultValue.value`);
          }
        });
      }
    }
    if (own(component, 'stories')) {
      if (!Array.isArray(component.stories))
        fail(`${where}.stories`, 'an array');
      component.stories.forEach((story, index) => {
        const storyPath = `${where}.stories[${index}]`;
        record(story, storyPath);
        string(story.id, `${storyPath}.id`, true);
        if (!story.id.startsWith(`${component.id}--`))
          fail(`${storyPath}.id`, `scoped to component ${component.id}`);
        string(story.name, `${storyPath}.name`, true);
        optionalString(story, 'snippet', storyPath);
        if (storyIds.has(story.id))
          fail(`${storyPath}.id`, 'unique across components');
        storyIds.add(story.id);
      });
    }
    if (own(component, 'docs')) {
      record(component.docs, `${where}.docs`);
      Object.entries(component.docs).forEach(([id, doc]) => {
        record(doc, `${where}.docs.${id}`);
        string(doc.content, `${where}.docs.${id}.content`);
      });
    }
  });
  // No property projection, path rewriting or optional-field defaults: valid
  // input survives byte-for-byte JSON value comparison, including unknown data.
  return structuredClone(value);
}

function cleanDocgenProps(rawProps) {
  if (!object(rawProps)) return {};
  const cleaned = {};
  for (const [propName, propDef] of Object.entries(rawProps)) {
    if (!object(propDef)) continue;
    const { defaultValue, description, required, type, ...rest } = propDef;
    const prop = {};
    for (const [k, v] of Object.entries(rest)) {
      if (v !== null && v !== undefined) prop[k] = v;
    }
    if (typeof description === 'string' && description.trim()) {
      prop.description = description;
    }
    if (typeof required === 'boolean') {
      prop.required = required;
    }
    if (object(type) && typeof type.name === 'string') {
      prop.type = type;
    }
    if (
      defaultValue &&
      typeof defaultValue === 'object' &&
      typeof defaultValue.value === 'string'
    ) {
      prop.defaultValue = {
        value: defaultValue.value,
        ...(defaultValue.computed !== undefined
          ? { computed: Boolean(defaultValue.computed) }
          : {}),
      };
    }
    cleaned[propName] = prop;
  }
  return cleaned;
}

export function resolveJsonPointer(data, pointer) {
  if (!pointer || pointer === '#' || pointer === '/') return data;
  let p = pointer;
  if (p.startsWith('#')) {
    p = p.slice(1);
  }
  if (!p || p === '/') return data;
  if (!p.startsWith('/')) {
    throw new Error(
      `Malformed JSON pointer: "${pointer}" must start with '/'`
    );
  }
  const rawParts = p.slice(1).split('/');
  let curr = data;
  for (const rawPart of rawParts) {
    if (/(?:^|[^\~])\~(?![01])|\~$/.test(rawPart)) {
      throw new Error(
        `Malformed JSON pointer: invalid escape sequence in "${pointer}"`
      );
    }
    const unescaped = rawPart.replace(/~1/g, '/').replace(/~0/g, '~');
    let part;
    try {
      part = decodeURIComponent(unescaped);
    } catch {
      throw new Error(
        `Malformed JSON pointer: invalid URI encoding in "${pointer}"`
      );
    }
    if (
      part === '__proto__' ||
      part === 'constructor' ||
      part === 'prototype'
    ) {
      return undefined;
    }
    if (curr === null || typeof curr !== 'object') return undefined;
    if (Array.isArray(curr)) {
      if (part === '-') return undefined;
      if (!/^(?:0|[1-9]\d*)$/.test(part)) return undefined;
      const idx = Number(part);
      if (idx >= curr.length) return undefined;
      curr = curr[idx];
    } else if (Object.hasOwn(curr, part)) {
      curr = curr[part];
    } else {
      return undefined;
    }
  }
  return curr;
}

export function resolveRef(baseDir, ref, visited = new Set()) {
  if (typeof ref !== 'string' || !ref.trim()) {
    throw new Error(
      'Cannot resolve metadata $ref: ref must be a nonempty string'
    );
  }
  const [filePath, ...rest] = ref.split('#');
  const pointer = rest.length ? '#' + rest.join('#') : '';
  const fullPath = path.resolve(baseDir, filePath);
  const canonical = `${fullPath}${pointer}`;

  if (visited.has(canonical)) {
    throw new Error(`Circular metadata $ref detected: ${ref}`);
  }
  const nextVisited = new Set(visited).add(canonical);

  let data;
  try {
    data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (cause) {
    throw new Error(
      `Cannot resolve metadata $ref at ${fullPath}: ${cause.message}`,
      { cause }
    );
  }

  const target = resolveJsonPointer(data, pointer);
  if (target === undefined && pointer !== '' && pointer !== '#') {
    throw new Error(
      `Cannot resolve metadata $ref pointer "${pointer}" in ${fullPath}`
    );
  }
  if (object(target) && typeof target.$ref === 'string') {
    return resolveRef(path.dirname(fullPath), target.$ref, nextVisited);
  }
  return target;
}

export function dereferenceComponentMetadata(
  value,
  { baseDir = process.cwd() } = {}
) {
  if (!object(value) || !object(value.components)) return value;

  const dereferencedComponents = {};
  for (const [key, rawComponent] of Object.entries(value.components)) {
    if (!object(rawComponent)) {
      dereferencedComponents[key] = rawComponent;
      continue;
    }

    let component = rawComponent;
    if (typeof component.$ref === 'string') {
      const resolvedComp = resolveRef(baseDir, component.$ref);
      if (object(resolvedComp)) {
        component = { ...resolvedComp, ...component };
        delete component.$ref;
      }
    }

    let compDocs = component.docs;
    if (compDocs && typeof compDocs.$ref === 'string') {
      const resolvedDocs = resolveRef(baseDir, compDocs.$ref);
      if (object(resolvedDocs)) compDocs = resolvedDocs;
    }

    const hasRefs =
      (component.docgen && typeof component.docgen.$ref === 'string') ||
      (component.stories && typeof component.stories.$ref === 'string') ||
      (compDocs &&
        Object.values(compDocs).some(
          d =>
            (d && typeof d.$ref === 'string') ||
            (d?.mdx && typeof d.mdx.$ref === 'string')
        ));

    if (!hasRefs && !rawComponent.$ref) {
      dereferencedComponents[key] = component;
      continue;
    }

    const docgenPayload =
      component.docgen && typeof component.docgen.$ref === 'string'
        ? resolveRef(baseDir, component.docgen.$ref)
        : component.docgen;

    const storyPayload =
      component.stories && typeof component.stories.$ref === 'string'
        ? resolveRef(baseDir, component.stories.$ref)
        : component.stories;

    const docs = {};
    if (object(compDocs)) {
      for (const [docId, rawDocEntry] of Object.entries(compDocs)) {
        if (!object(rawDocEntry)) continue;
        let docEntry = rawDocEntry;
        if (typeof docEntry.$ref === 'string') {
          const resolvedDoc = resolveRef(baseDir, docEntry.$ref);
          if (object(resolvedDoc)) {
            docEntry = { ...resolvedDoc, ...docEntry };
            delete docEntry.$ref;
          }
        }
        const mdxPayload =
          docEntry.mdx && typeof docEntry.mdx.$ref === 'string'
            ? resolveRef(baseDir, docEntry.mdx.$ref)
            : docEntry.mdx;
        docs[docId] = {
          ...docEntry,
          content: mdxPayload?.content ?? docEntry.content,
        };
      }
    }

    let reactDocgen = component.reactDocgen || docgenPayload?.reactDocgen;
    if (reactDocgen) {
      if (object(reactDocgen.props)) {
        reactDocgen = {
          ...reactDocgen,
          props: cleanDocgenProps(reactDocgen.props),
        };
      }
    } else if (docgenPayload?.reactComponentMeta) {
      const meta = docgenPayload.reactComponentMeta;
      reactDocgen = {
        ...(typeof meta.description === 'string' && meta.description.trim()
          ? { description: meta.description }
          : {}),
        props: cleanDocgenProps(meta.props),
        ...(typeof meta.filePath === 'string'
          ? { definedInFile: meta.filePath }
          : {}),
      };
    }

    let stories = component.stories;
    if (storyPayload) {
      if (Array.isArray(storyPayload.stories)) {
        stories = storyPayload.stories;
      } else if (object(storyPayload.stories)) {
        stories = Object.values(storyPayload.stories);
      } else if (Array.isArray(storyPayload)) {
        stories = storyPayload;
      } else if (
        object(storyPayload) &&
        Object.values(storyPayload).some(s => s && typeof s.id === 'string')
      ) {
        stories = Object.values(storyPayload);
      }
    }

    const name =
      docgenPayload?.name ||
      docgenPayload?.displayName ||
      docgenPayload?.reactComponentMeta?.displayName ||
      storyPayload?.name ||
      component.name;
    const compPath =
      docgenPayload?.path || storyPayload?.path || component.path;
    const description =
      component.description || docgenPayload?.description;
    const compImport = storyPayload?.import || component.import;
    const jsDocTags = docgenPayload?.jsDocTags || component.jsDocTags;
    const error = docgenPayload?.error || component.error;

    dereferencedComponents[key] = {
      ...component,
      id: component.id ?? key,
      ...(typeof name === 'string' ? { name } : {}),
      ...(typeof compPath === 'string' ? { path: compPath } : {}),
      ...(typeof description === 'string' ? { description } : {}),
      ...(typeof compImport === 'string' ? { import: compImport } : {}),
      ...(jsDocTags && Object.keys(jsDocTags).length ? { jsDocTags } : {}),
      ...(error ? { error } : {}),
      ...(reactDocgen ? { reactDocgen } : {}),
      ...(stories ? { stories } : {}),
      ...(Object.keys(docs).length ? { docs } : {}),
    };
  }

  return {
    ...value,
    components: dereferencedComponents,
  };
}

export function readComponentMetadata(filename) {
  let input;
  try {
    input = JSON.parse(fs.readFileSync(filename, 'utf8'));
  } catch (cause) {
    throw new Error(
      `Cannot read component metadata at ${filename}: ${cause.message}`,
      { cause }
    );
  }
  const baseDir = path.dirname(path.resolve(filename));
  const dereferenced = dereferenceComponentMetadata(input, { baseDir });
  return normalizeComponentMetadata(dereferenced, { source: filename });
}

/** Audited inputs and complete prop/docgen data, plus stable story identity. */
export function componentMetadataContract(manifest) {
  return {
    v: manifest.v,
    components: Object.fromEntries(
      Object.entries(manifest.components).map(([key, component]) => [
        key,
        {
          id: component.id,
          name: component.name,
          path: component.path,
          description: component.description,
          import: component.import,
          jsDocTags:
            component.jsDocTags?.param === undefined
              ? undefined
              : { param: component.jsDocTags.param },
          reactDocgen:
            component.reactDocgen === undefined
              ? undefined
              : {
                  ...component.reactDocgen,
                  ...(typeof component.reactDocgen.definedInFile === 'string'
                    ? {
                        definedInFile: path
                          .relative(
                            process.cwd(),
                            path.resolve(component.reactDocgen.definedInFile)
                          )
                          .split(path.sep)
                          .join('/'),
                      }
                    : {}),
                },
          stories: component.stories?.map(story => ({
            id: story.id,
            name: story.name,
            snippet: story.snippet,
          })),
          docs:
            component.docs === undefined
              ? undefined
              : Object.fromEntries(
                  Object.entries(component.docs).map(([id, doc]) => [
                    id,
                    { content: doc.content },
                  ])
                ),
        },
      ])
    ),
  };
}
