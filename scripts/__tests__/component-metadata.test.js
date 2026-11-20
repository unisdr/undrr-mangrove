import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  normalizeComponentMetadata,
  componentMetadataContract,
  dereferenceComponentMetadata,
  resolveJsonPointer,
  resolveRef,
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
        value.v = 2;
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

describe('Storybook 11 ref-based metadata dereferencing', () => {
  it('accepts v: 1 manifests in normalizeComponentMetadata', () => {
    const source = fixture();
    source.v = 1;
    const normalized = normalizeComponentMetadata(source);
    expect(normalized.v).toBe(1);
  });

  it('dereferences $ref pointers and maps reactComponentMeta to reactDocgen', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sb11-meta-test-'));
    try {
      const docgenDir = path.join(tmpDir, 'services', 'core', 'docgen');
      const storyDir = path.join(tmpDir, 'services', 'core', 'story-docs');
      const mdxDir = path.join(tmpDir, 'services', 'addon-docs', 'mdx');
      fs.mkdirSync(docgenDir, { recursive: true });
      fs.mkdirSync(storyDir, { recursive: true });
      fs.mkdirSync(mdxDir, { recursive: true });

      fs.writeFileSync(
        path.join(docgenDir, 'tag.json'),
        JSON.stringify({
          reactComponentMeta: {
            description: 'Ref component description',
            filePath: 'stories/Atom/Tag/Tag.jsx',
            props: {
              label: {
                description: 'Tag label',
                required: true,
                type: { name: 'string' },
                defaultValue: null,
              },
            },
          },
        })
      );

      fs.writeFileSync(
        path.join(storyDir, 'tag.json'),
        JSON.stringify({
          stories: {
            'tag--default': {
              id: 'tag--default',
              name: 'Default',
              snippet: '<Tag label="test" />',
            },
          },
        })
      );

      fs.writeFileSync(
        path.join(mdxDir, 'tag.json'),
        JSON.stringify({
          content: '## Tag Changelog\n- **1.0**: Initial release.',
        })
      );

      const sourceWithRefs = {
        v: 1,
        components: {
          tag: {
            id: 'tag',
            name: 'Tag',
            path: './stories/Atom/Tag/Tag.stories.jsx',
            docgen: { $ref: 'services/core/docgen/tag.json' },
            stories: { $ref: 'services/core/story-docs/tag.json' },
            docs: {
              'tag--docs': {
                mdx: { $ref: 'services/addon-docs/mdx/tag.json' },
              },
            },
          },
        },
      };

      const dereferenced = dereferenceComponentMetadata(sourceWithRefs, {
        baseDir: tmpDir,
      });
      expect(dereferenced.components.tag.reactDocgen).toBeDefined();
      expect(dereferenced.components.tag.reactDocgen.description).toBe(
        'Ref component description'
      );
      expect(
        dereferenced.components.tag.reactDocgen.props.label.defaultValue
      ).toBeUndefined();
      expect(dereferenced.components.tag.stories).toEqual([
        {
          id: 'tag--default',
          name: 'Default',
          snippet: '<Tag label="test" />',
        },
      ]);
      expect(dereferenced.components.tag.docs['tag--docs'].content).toBe(
        '## Tag Changelog\n- **1.0**: Initial release.'
      );

      const normalized = normalizeComponentMetadata(dereferenced);
      expect(normalized.components.tag.id).toBe('tag');

      // Also verify that a metadata source without refs passes through unchanged
      const noRefSource = fixture();
      expect(dereferenceComponentMetadata(noRefSource)).toEqual(noRefSource);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  describe('JSON Pointer RFC 6901 edge cases and security', () => {
    it('resolves root pointer variants', () => {
      const data = { a: 1 };
      expect(resolveJsonPointer(data, '')).toEqual(data);
      expect(resolveJsonPointer(data, '#')).toEqual(data);
      expect(resolveJsonPointer(data, '/')).toEqual(data);
      expect(resolveJsonPointer(data, '#/')).toEqual(data);
    });

    it('unescapes ~1 and ~0 according to RFC 6901', () => {
      const data = {
        'path/to/component': { count: 10 },
        'tilde~prop': { value: 20 },
      };
      expect(resolveJsonPointer(data, '/path~1to~1component/count')).toBe(10);
      expect(resolveJsonPointer(data, '/tilde~0prop/value')).toBe(20);
    });

    it('decodes URI percent-encoded fragment pointers', () => {
      const data = {
        'hello world': 42,
        عربي: 99,
      };
      expect(resolveJsonPointer(data, '#/hello%20world')).toBe(42);
      expect(resolveJsonPointer(data, '#/%D8%B9%D8%B1%D8%A8%D9%8A')).toBe(99);
    });

    it('rejects malformed escape sequences and pointers without leading slash', () => {
      const data = { a: 1 };
      expect(() => resolveJsonPointer(data, 'invalid/path')).toThrow(
        /must start with '\/'/
      );
      expect(() => resolveJsonPointer(data, '/invalid~2escape')).toThrow(
        /invalid escape sequence/
      );
      expect(() => resolveJsonPointer(data, '/trailing~')).toThrow(
        /invalid escape sequence/
      );
      expect(() => resolveJsonPointer(data, '/%ZZbadpercent')).toThrow(
        /invalid URI encoding/
      );
    });

    it('blocks prototype pollution and property traversal on Object/Array built-ins', () => {
      const data = { list: [1, 2, 3] };
      expect(resolveJsonPointer(data, '/__proto__')).toBeUndefined();
      expect(resolveJsonPointer(data, '/constructor')).toBeUndefined();
      expect(resolveJsonPointer(data, '/constructor/name')).toBeUndefined();
      expect(resolveJsonPointer(data, '/prototype')).toBeUndefined();
      expect(resolveJsonPointer(data, '/toString')).toBeUndefined();
      expect(resolveJsonPointer(data, '/list/map')).toBeUndefined();
      expect(resolveJsonPointer(data, '/list/-')).toBeUndefined();
      expect(resolveJsonPointer(data, '/list/99')).toBeUndefined();
    });
  });

  describe('Missing and circular $ref resolution', () => {
    it('rejects empty or whitespace $ref', () => {
      expect(() => resolveRef(process.cwd(), '')).toThrow(/nonempty string/);
      expect(() => resolveRef(process.cwd(), '   ')).toThrow(/nonempty string/);
    });

    it('reports missing target files clearly', () => {
      expect(() => resolveRef(process.cwd(), 'does-not-exist.json')).toThrow(
        /Cannot resolve metadata \$ref at/i
      );
    });

    it('reports non-existent JSON pointer in existing file', () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sb11-missing-ptr-'));
      try {
        const file = path.join(tmpDir, 'data.json');
        fs.writeFileSync(file, JSON.stringify({ existing: 1 }));
        expect(() => resolveRef(tmpDir, 'data.json#/missing/pointer')).toThrow(
          /Cannot resolve metadata \$ref pointer "#\/missing\/pointer"/i
        );
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('detects direct and indirect circular $ref loops', () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sb11-cycle-'));
      try {
        const fileA = path.join(tmpDir, 'a.json');
        const fileB = path.join(tmpDir, 'b.json');
        fs.writeFileSync(
          fileA,
          JSON.stringify({ toB: { $ref: 'b.json#/toA' } })
        );
        fs.writeFileSync(
          fileB,
          JSON.stringify({ toA: { $ref: 'a.json#/toB' } })
        );
        expect(() => resolveRef(tmpDir, 'a.json#/toB')).toThrow(
          /Circular metadata \$ref detected/
        );
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });
  });

  describe('Docgen null props, computed defaults, and error normalization', () => {
    it('cleans null fields from props and preserves computed flag and docgen error', () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sb11-null-props-'));
      try {
        const docgenFile = path.join(tmpDir, 'null-props.json');
        fs.writeFileSync(
          docgenFile,
          JSON.stringify({
            reactComponentMeta: {
              description: 'Component with messy props',
              filePath: 'stories/Atom/Tag/Tag.jsx',
              props: {
                validProp: {
                  name: 'validProp',
                  description: 'Valid label',
                  required: true,
                  type: { name: 'string' },
                  defaultValue: { value: '"default"', computed: true },
                },
                nullFieldsProp: {
                  name: 'nullFieldsProp',
                  description: null,
                  required: null,
                  type: null,
                  defaultValue: null,
                },
                nullObjectDefaultProp: {
                  name: 'nullObjectDefaultProp',
                  defaultValue: { value: null },
                },
                nullDef: null,
              },
            },
            error: { name: 'No component found' },
          })
        );

        const source = {
          v: 1,
          components: {
            tag: {
              id: 'tag',
              name: 'Tag',
              path: './stories/Atom/Tag/Tag.stories.jsx',
              docgen: { $ref: 'null-props.json' },
            },
          },
        };

        const dereferenced = dereferenceComponentMetadata(source, {
          baseDir: tmpDir,
        });
        const tag = dereferenced.components.tag;
        expect(tag.error).toEqual({ name: 'No component found' });
        expect(tag.reactDocgen.props.validProp.defaultValue).toEqual({
          value: '"default"',
          computed: true,
        });
        expect(tag.reactDocgen.props.nullFieldsProp.description).toBeUndefined();
        expect(tag.reactDocgen.props.nullFieldsProp.required).toBeUndefined();
        expect(tag.reactDocgen.props.nullFieldsProp.type).toBeUndefined();
        expect(
          tag.reactDocgen.props.nullFieldsProp.defaultValue
        ).toBeUndefined();
        expect(
          tag.reactDocgen.props.nullObjectDefaultProp.defaultValue
        ).toBeUndefined();
        expect(tag.reactDocgen.props.nullDef).toBeUndefined();

        const normalized = normalizeComponentMetadata(dereferenced);
        expect(normalized.components.tag.id).toBe('tag');
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('supports full component-level $ref dereferencing', () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sb11-comp-ref-'));
      try {
        const compFile = path.join(tmpDir, 'full-component.json');
        fs.writeFileSync(
          compFile,
          JSON.stringify({
            componentDef: {
              name: 'FullComponent',
              path: './stories/Full.stories.jsx',
              description: 'Dereferenced component',
            },
          })
        );
        const source = {
          v: 1,
          components: {
            full: {
              $ref: 'full-component.json#/componentDef',
            },
          },
        };
        const dereferenced = dereferenceComponentMetadata(source, {
          baseDir: tmpDir,
        });
        expect(dereferenced.components.full.name).toBe('FullComponent');
        expect(dereferenced.components.full.path).toBe(
          './stories/Full.stories.jsx'
        );
        expect(dereferenced.components.full.id).toBe('full');
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });
  });
});

