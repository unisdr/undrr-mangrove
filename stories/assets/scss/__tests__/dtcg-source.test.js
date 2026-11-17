/** @jest-environment node */
/**
 * Typed source and migration checks independent of the legacy YAML fixtures.
 * Fixtures exercise the public build path so a schema-only validator cannot
 * pass while the emitted CSS loses runtime aliases or brand inheritance.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../../..');
const { build, buildDtcgDocuments, loadSources } = require(
  path.join(ROOT, 'scripts/build-tokens.cjs')
);
const { validateDocument } = require(
  path.join(ROOT, 'scripts/dtcg-tokens.cjs')
);

const NAMESPACE = 'org.undrr.mangrove';
const extension = value => ({ $extensions: { [NAMESPACE]: value } });
const colour = components => ({ colorSpace: 'srgb', components });
const clone = value => JSON.parse(JSON.stringify(value));
const baseDocument = () => ({
  ...extension({ brand: { id: 'mangrove', base: true, selector: ':root' } }),
  color: {
    $type: 'color',
    white: { $value: colour([1, 1, 1]) },
    interactive: { $value: colour([0, 0, 0]) },
    link: { $value: '{color.interactive}' },
    button: {
      $value: '{color.interactive}',
      ...extension({ format: 'srgb-rgb-function' }),
    },
  },
  spacing: {
    gap: { $type: 'dimension', $value: { value: 8, unit: 'px' } },
  },
});
const defaultDocument = () => ({
  ...extension({
    brand: {
      id: 'undrr',
      default: true,
      output: 'mangrove',
      title: 'UNDRR',
      selector: ':root',
    },
  }),
  color: {
    $type: 'color',
    interactive: { $value: colour([0, 79 / 255, 145 / 255]) },
  },
});

describe('DTCG source validation', () => {
  test('accepts structured values and aliases using inherited types', () => {
    expect(() => validateDocument(baseDocument(), 'fixture')).not.toThrow();
  });

  test.each([
    ['dimension', '14px'],
    ['duration', '100ms'],
    ['cubicBezier', 'cubic-bezier(0.16, 1, 0.3, 1)'],
    ['color', '#2d6fa3'],
    ['shadow', '0 4px 12px rgba(17,24,41,0.10)'],
  ])('rejects CSS text masquerading as a typed %s', ($type, $value) => {
    expect(() =>
      validateDocument({ token: { $type, $value } }, 'fixture')
    ).toThrow();
  });

  test('rejects a value with no declared or inherited type', () => {
    expect(() =>
      validateDocument({ token: { $value: 8 } }, 'fixture')
    ).toThrow();
  });

  test('rejects dimensions with CSS-only units', () => {
    expect(() =>
      validateDocument(
        { token: { $type: 'dimension', $value: { value: 1.25, unit: 'em' } } },
        'fixture'
      )
    ).toThrow();
  });

  test('rejects a cubic Bezier array with the wrong number of coordinates', () => {
    expect(() =>
      validateDocument(
        { token: { $type: 'cubicBezier', $value: [0, 0, 1] } },
        'fixture'
      )
    ).toThrow();
  });

  test('rejects a custom string type instead of treating it as portable DTCG', () => {
    expect(() =>
      validateDocument(
        { token: { $type: 'string', $value: 'none' } },
        'fixture'
      )
    ).toThrow();
  });

  test('rejects a shadow whose length is still a CSS string', () => {
    expect(() =>
      validateDocument(
        {
          token: {
            $type: 'shadow',
            $value: {
              color: colour([0, 0, 0]),
              offsetX: { value: 0, unit: 'px' },
              offsetY: { value: 4, unit: 'px' },
              blur: '12px',
              spread: { value: 0, unit: 'px' },
            },
          },
        },
        'fixture'
      )
    ).toThrow();
  });
});

describe('typed sources through the generator', () => {
  let dir;
  const write = (name, document) =>
    fs.writeFileSync(
      path.join(dir, `${name}.tokens.json`),
      JSON.stringify(document, null, 2)
    );
  const output = (brand = 'mangrove') =>
    build({ tokensDir: dir }).get(
      `stories/assets/scss/generated/_tokens-${brand}.scss`
    );

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mg-dtcg-contract-'));
    write('mangrove', baseDocument());
    write('undrr', defaultDocument());
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  test('loads typed sources rather than depending on YAML fallback', () => {
    const { base, brands } = loadSources(dir);
    expect(base.meta.id).toBe('mangrove');
    expect(brands.map(brand => brand.meta.id)).toEqual(['undrr']);
    expect(output()).toContain('--mg-color-interactive: 0 79 145;');
    expect(output()).toContain('--mg-spacing-gap: 8px;');
  });

  test('preserves runtime aliases after merging the brand values', () => {
    expect(output()).toContain('--mg-color-link: var(--mg-color-interactive);');
    expect(output()).toContain(
      '--mg-color-button: rgb(var(--mg-color-interactive));'
    );
    write('undrr', {
      ...defaultDocument(),
      color: {
        $type: 'color',
        interactive: { $value: colour([1, 0, 0]) },
      },
    });
    expect(output()).toContain('--mg-color-interactive: 255 0 0;');
    expect(output()).toContain('--mg-color-link: var(--mg-color-interactive);');
  });

  test('eager output is explicit and resolves against the merged brand', () => {
    const document = baseDocument();
    document.color.literal = {
      $value: '{color.interactive}',
      ...extension({ resolve: 'literal' }),
    };
    write('mangrove', document);
    expect(output()).toContain('--mg-color-literal: 0 79 145;');
  });

  test('sub-brands inherit their parent and keep their own output marker', () => {
    write('child', {
      ...extension({
        brand: { id: 'child', extends: 'undrr', selector: '.mg-theme-child' },
      }),
      color: {
        $type: 'color',
        interactive: { $value: colour([1, 0, 0]) },
      },
    });
    expect(output('child')).toContain('--mg-color-interactive: 255 0 0;');
    expect(output('child')).not.toContain('--mg-color-white:');
  });

  test('fails on references to unknown tokens', () => {
    const document = baseDocument();
    document.color.link.$value = '{color.missing}';
    write('mangrove', document);
    expect(() => output()).toThrow(/unknown|missing|reference/i);
  });

  test('fails on cyclic references', () => {
    const document = baseDocument();
    document.color.link.$value = '{color.button}';
    document.color.button.$value = '{color.link}';
    write('mangrove', document);
    expect(() => output()).toThrow(/circular|cyclic|cycle/i);
  });

  test('rejects an alias whose declared type disagrees with its target', () => {
    const document = clone(baseDocument());
    document.color.link.$value = '{spacing.gap}';
    write('mangrove', document);
    expect(() => output()).toThrow(/type|dimension|color/i);
  });

  test('a standard alias cannot target an extension-only output recipe', () => {
    const document = baseDocument();
    document.paint = extension({
      output: { value: 'transparent', type: 'color', format: 'literal' },
    });
    document.color.link.$value = '{paint}';
    write('mangrove', document);
    expect(() => output()).toThrow(/token|recipe|value|reference/i);
  });
});

describe('self-contained portable exchange documents', () => {
  // This walker intentionally does not use the generator's alias resolver.
  const resolveDocument = document => {
    const tokens = new Map();
    const walk = (node, trail = []) => {
      if (node && typeof node === 'object' && !Array.isArray(node)) {
        if (Object.hasOwn(node, '$value')) tokens.set(trail.join('.'), node);
        else
          for (const [key, child] of Object.entries(node))
            if (!key.startsWith('$')) walk(child, [...trail, key]);
      }
    };
    walk(document);
    const values = new Map();
    const resolving = new Set();
    const resolveToken = id => {
      if (values.has(id)) return values.get(id);
      if (!tokens.has(id))
        throw new Error(`Export references missing token ${id}`);
      if (resolving.has(id)) throw new Error(`Export contains cycle at ${id}`);
      resolving.add(id);
      const value = expand(tokens.get(id).$value);
      resolving.delete(id);
      values.set(id, value);
      return value;
    };
    const expand = value => {
      if (typeof value === 'string' && /^\{[^{}]+\}$/.test(value))
        return resolveToken(value.slice(1, -1));
      if (Array.isArray(value)) return value.map(expand);
      if (value && typeof value === 'object') {
        if (Object.hasOwn(value, '$ref')) {
          expect(value.$ref).toMatch(/^#\//);
          const parts = value.$ref
            .slice(2)
            .split('/')
            .map(part => part.replace(/~1/g, '/').replace(/~0/g, '~'));
          // JSON Pointer traverses the literal exported document. A target
          // whose $value is "{another.token}" is a string, not an object
          // through which /components/0 may continue walking.
          let target = document;
          for (const part of parts) {
            if (
              !target ||
              typeof target !== 'object' ||
              !Object.hasOwn(target, part)
            )
              throw new Error(`Missing literal pointer target: ${value.$ref}`);
            target = target[part];
          }
          return expand(target);
        }
        return Object.fromEntries(
          Object.entries(value).map(([key, child]) => [key, expand(child)])
        );
      }
      return value;
    };
    for (const [id, token] of tokens)
      validateDocument(
        { token: { $type: token.$type, $value: resolveToken(id) } },
        `resolved exchange ${id}`
      );
    return values;
  };

  test('the independent walker refuses pointers through an unresolved alias string', () => {
    const invalid = {
      base: { $type: 'color', $value: colour([1, 0, 0]) },
      alias: { $type: 'color', $value: '{base}' },
      copy: {
        $type: 'color',
        $value: {
          colorSpace: 'srgb',
          components: [0, 1, 2].map(index => ({
            $ref: `#/alias/$value/components/${index}`,
          })),
        },
      },
    };
    expect(() => resolveDocument(invalid)).toThrow(/literal pointer target/);
  });

  test('exports one closed standard document per distributed brand', () => {
    const documents = buildDtcgDocuments();
    expect([...documents.keys()].sort()).toEqual([
      'delta.tokens.json',
      'irp.tokens.json',
      'mangrove.tokens.json',
      'mcr.tokens.json',
      'preventionweb.tokens.json',
    ]);
    for (const [name, document] of documents) {
      expect(() => validateDocument(document, name)).not.toThrow();
      const serialised = JSON.stringify(document);
      expect(serialised).not.toContain('$extensions');
      expect(serialised).not.toContain('org.undrr.mangrove');
      const values = resolveDocument(document);
      expect(values.size).toBeGreaterThan(200);
      expect(values.has('theme.loaded')).toBe(false);
      expect(values.get('spacing.100')).toEqual({ value: 10, unit: 'px' });
    }
    expect(
      resolveDocument(documents.get('delta.tokens.json')).get(
        'color.interactive'
      )
    ).toEqual({
      colorSpace: 'srgb',
      components: [0, 79 / 255, 145 / 255],
    });
  });
});

describe('authored production values remain authoritative', () => {
  let dir;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mg-dtcg-authored-'));
    for (const file of fs.readdirSync(path.join(ROOT, 'tokens'))) {
      if (!file.endsWith('.tokens.json')) continue;
      fs.copyFileSync(path.join(ROOT, 'tokens', file), path.join(dir, file));
    }
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  const edit = (source, output, mutate) => {
    const file = path.join(dir, `${source}.tokens.json`);
    const document = JSON.parse(fs.readFileSync(file, 'utf8'));
    mutate(document);
    fs.writeFileSync(file, JSON.stringify(document));
    return build({ tokensDir: dir }).get(
      `stories/assets/scss/generated/_tokens-${output}.scss`
    );
  };

  test('editing a typed alpha reaches CSS without editing output metadata', () => {
    const css = edit('delta', 'delta', document => {
      document.color['tab-background--hover'].$value.alpha = 0.4;
    });
    expect(css).toContain(
      '--mg-color-tab-background--hover: rgb(0 79 145 / 0.4);'
    );
    expect(css).not.toContain(
      '--mg-color-tab-background--hover: rgb(0 79 145 / 0.7);'
    );
  });

  test('editing typed colour components is not hidden by a cached source alias', () => {
    const css = edit('delta', 'delta', document => {
      document.color['tab-background--hover'].$value.components = [1, 0, 0];
    });
    expect(css).toContain(
      '--mg-color-tab-background--hover: rgb(255 0 0 / 0.7);'
    );
  });

  test('a newly visible shadow does not remain hidden by the old none spelling', () => {
    const css = edit('delta', 'delta', document => {
      const shadow = document['box-shadow']['tab-section'].$value;
      shadow.color.alpha = 0.5;
      shadow.blur.value = 12;
    });
    expect(css).toContain(
      '--mg-box-shadow-tab-section: 0 0 12px 0 rgb(0 0 0 / 0.5);'
    );
    expect(css).not.toContain('--mg-box-shadow-tab-section: none;');
  });

  test('editing spread emits it even when zero was previously omitted', () => {
    const css = edit('mangrove', 'mangrove', document => {
      document['hero-overlay'].shadow.$value.spread.value = 5;
    });
    expect(css).toContain(
      '--mg-hero-overlay-shadow: 0 18px 55px 5px rgb(var(--mg-color-neutral-900) / 0.22);'
    );
  });

  test('a brand value override inherits the established rem output contract', () => {
    const css = edit('delta', 'delta', document => {
      document.spacing['100'] = {
        $type: 'dimension',
        $value: { value: 24, unit: 'px' },
      };
    });
    expect(css).toContain('--mg-spacing-100: 1.5rem;');
    expect(css).not.toContain('--mg-spacing-100: 24px;');
  });

  test('refuses to silently discard alpha in a channel-only CSS contract', () => {
    expect(() =>
      edit('delta', 'delta', document => {
        document.color.interactive = {
          $type: 'color',
          $value: { ...colour([1, 0, 0]), alpha: 0.5 },
        };
      })
    ).toThrow(/alpha|channel/i);
  });
});
