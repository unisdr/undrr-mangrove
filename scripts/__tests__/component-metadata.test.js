import {
  normalizeComponentMetadata,
  componentMetadataContract,
} from '../ai-manifest/component-metadata';

const fixture = () => ({
  v: 0,
  meta: { docgen: 'react-docgen', extra: 'retained' },
  components: {
    example: {
      id: 'example',
      name: 'Example',
      path: './stories/Example.stories.jsx',
      jsDocTags: { param: ['{string} props.label - Visible label'] },
      description: 'Example description',
      import: 'import { Example } from "example";',
      reactDocgen: {
        description: 'Docblock',
        props: {
          mode: {
            description: 'Mode',
            required: true,
            type: { name: 'enum', value: [{ value: '"a"' }, { value: '"b"' }] },
            defaultValue: { value: '"a"', computed: false },
          },
          fields: {
            type: {
              name: 'shape',
              value: {
                value: {
                  name: 'arrayOf',
                  value: {
                    name: 'union',
                    value: [{ name: 'string' }, { name: 'number' }],
                  },
                },
              },
            },
          },
        },
      },
      stories: [
        { id: 'example--default', name: 'Default', snippet: '<Example />' },
      ],
      docs: {
        'example--docs': {
          content: '## Changelog\n- **1.0**, 2026-10-26: Added.',
        },
      },
      futureUpstreamField: { nested: [1, 2, 3] },
    },
  },
});

describe('component metadata boundary', () => {
  it('preserves all input fields, including unknown upstream data, without mutating input', () => {
    const source = fixture();
    const normalized = normalizeComponentMetadata(source);
    expect(normalized).toEqual(source);
    normalized.components.example.reactDocgen.props.mode.required = false;
    expect(source.components.example.reactDocgen.props.mode.required).toBe(
      true
    );
  });
  it('accepts documented CSS/story-only entries without inventing props or snippets', () => {
    const source = {
      v: 0,
      components: {
        css: {
          id: 'css',
          name: 'CSS',
          path: './stories/Css.stories.jsx',
          error: { name: 'No component found' },
        },
      },
    };
    expect(normalizeComponentMetadata(source)).toEqual(source);
  });
  it.each([
    [
      'an index instead of metadata',
      value => {
        delete value.components;
        value.entries = {};
      },
      'manifest.components',
    ],
    [
      'an unknown version',
      value => {
        value.v = 1;
      },
      'manifest.v',
    ],
    [
      'an empty map',
      value => {
        value.components = {};
      },
      'nonempty component map',
    ],
    [
      'a changed component identity',
      value => {
        value.components.example.id = 'other';
      },
      'map key',
    ],
    [
      'duplicate story identity',
      value => {
        value.components.example.stories.push({
          id: 'example--default',
          name: 'Duplicate',
        });
      },
      'unique',
    ],
    [
      'missing changelog source',
      value => {
        delete value.components.example.docs['example--docs'].content;
      },
      '.content',
    ],
    [
      'malformed prop defaults',
      value => {
        value.components.example.reactDocgen.props.mode.defaultValue.value = {};
      },
      '.defaultValue.value',
    ],
    [
      'malformed nested type',
      value => {
        value.components.example.reactDocgen.props.fields.type.value.value.value =
          [];
      },
      '.value.value.value',
    ],
    [
      'malformed JSDoc tags',
      value => {
        value.components.example.jsDocTags.param = 'lost';
      },
      '.jsDocTags.param',
    ],
    [
      'malformed source snippet',
      value => {
        value.components.example.stories[0].snippet = null;
      },
      '.snippet',
    ],
  ])(
    'rejects %s with a field-specific source error',
    (_name, mutate, expected) => {
      const source = fixture();
      mutate(source);
      expect(() =>
        normalizeComponentMetadata(source, { source: 'candidate.json' })
      ).toThrow(expected);
      expect(() =>
        normalizeComponentMetadata(source, { source: 'candidate.json' })
      ).toThrow('candidate.json');
    }
  );
});

it('keeps TypeScript and extra docgen data in parity even when current output uses unknown type', () => {
  const source = fixture();
  source.components.example.reactDocgen.definedInFile = '/checkout/Example.tsx';
  source.components.example.reactDocgen.props.typed = {
    required: false,
    tsType: { name: 'signature', raw: '() => void' },
  };
  const normalized = normalizeComponentMetadata(source);
  const contract = componentMetadataContract(normalized);
  expect(contract.components.example.reactDocgen.props).toEqual(
    source.components.example.reactDocgen.props
  );
  expect(contract.components.example.reactDocgen.definedInFile).toBeTruthy();
  expect(normalized.components.example.reactDocgen.definedInFile).toBe(
    '/checkout/Example.tsx'
  );
});

it.each([
  '../escaped',
  '/absolute',
  'nested/file',
  'nested\\file',
  '__proto__',
  'constructor',
  'index',
  'utilities',
  'tokens',
  'releases',
])(
  'rejects component identifier %s before it becomes an output filename or map key',
  id => {
    const source = fixture();
    const component = source.components.example;
    source.components = Object.fromEntries([[id, { ...component, id }]]);
    expect(() => normalizeComponentMetadata(source)).toThrow(
      /identifier|reserved/
    );
  }
);

it('rejects a story associated with a different component', () => {
  const source = fixture();
  source.components.example.stories[0].id = 'other--default';
  expect(() => normalizeComponentMetadata(source)).toThrow(
    'scoped to component example'
  );
});

it('compares source association after normalizing the checkout prefix', () => {
  const source = fixture();
  source.components.example.reactDocgen.definedInFile = `${process.cwd()}/stories/Example.jsx`;
  const original = componentMetadataContract(source);
  expect(original.components.example.reactDocgen.definedInFile).toBe(
    'stories/Example.jsx'
  );
  source.components.example.reactDocgen.definedInFile = `${process.cwd()}/stories/Other.jsx`;
  expect(componentMetadataContract(source)).not.toEqual(original);
});
