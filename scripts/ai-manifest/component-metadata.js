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
  if (value.v !== 0) fail('manifest.v', 'the supported Storybook version 0');
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
  return normalizeComponentMetadata(input, { source: filename });
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
