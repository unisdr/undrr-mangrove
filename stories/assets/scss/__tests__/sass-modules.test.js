/** @jest-environment node */
const fs = require('fs');
const path = require('path');
const sass = require('sass');
const postcss = require('postcss');
const SCSS = path.resolve(__dirname, '..');
const BUNDLES = [
  'style',
  'style-all',
  'style-delta',
  'style-gutenberg',
  'style-irp',
  'style-mcr',
  'style-preventionweb',
];
const PATHS = [
  'roboto',
  'roboto-condensed',
  'noto-kufi-arabic',
  'noto-sans-arabic',
];
const FACES = [
  'sans',
  'sans-condensed',
  'mono',
  'arabic-display',
  'arabic-sans',
];
const compile = source =>
  sass.compileString(source, {
    loadPaths: [SCSS],
    style: 'compressed',
    logger: sass.Logger.silent,
  }).css;
const declarations = css => {
  const result = [];
  postcss.parse(css).walkDecls(decl => result.push(decl));
  return result;
};

test.each(BUNDLES)('%s loads without any Sass deprecation warnings', bundle => {
  const warnings = [];
  sass.compile(path.join(SCSS, `${bundle}.scss`), {
    logger: {
      warn: (message, options) => {
        if (options.deprecation) warnings.push(message);
      },
    },
  });
  expect(warnings).toEqual([]);
});

test.each(BUNDLES)(
  '%s preserves module and legacy pre-import configuration',
  bundle => {
    const hooks = [
      ...FACES.map((face, index) => [
        `mg-font-face-${face}`,
        `('Consumer ${index} Face', sans-serif)`,
      ]),
      ...PATHS.map(font => [`font-path-${font}`, `'/consumer/${font}'`]),
      ['mgIconFontPath', "'/consumer/icons'"],
      ['mg-tabs-border-bottom', 'false'],
      ['mg-font-tag', '2rem'],
      ['FontName', '"Renamed"'],
      ['font-version', '"3.0"'],
    ];
    const modern = compile(
      `@use '${bundle}' as * with (${hooks.map(([name, value]) => `$${name}: ${value}`).join(',')}); .hook-probe { font-size: $mg-font-tag; }`
    );
    const legacy = compile(
      hooks.map(([name, value]) => `$${name}: ${value};`).join('\n') +
        `\n@import '${bundle}'; .hook-probe { font-size: $mg-font-tag; }`
    );
    expect(legacy).toBe(modern);
    expect(modern).toContain('.hook-probe{font-size:2rem}');
    for (const font of PATHS) expect(modern).toContain(`/consumer/${font}/`);
    for (let index = 0; index < FACES.length; index += 1)
      expect(modern).toContain(`"Consumer ${index} Face"`);
    // Gutenberg intentionally excludes icons.
    if (bundle !== 'style-gutenberg')
      expect(modern).toContain('/consumer/icons/');
    const faces = [];
    postcss.parse(modern).walkAtRules('font-face', rule => faces.push(rule));
    expect(faces).toHaveLength(bundle === 'style-gutenberg' ? 32 : 33);
    expect(modern).toContain('Renamed-Light.woff2?v=3.0');
    expect(modern).toContain('RobotoCondensed-Light.woff2?v=3.0');
    const defaults = compile(`@use '${bundle}';`);
    const findBorders = css =>
      declarations(css).filter(
        decl =>
          decl.parent.selector === '.mg-tabs__list:after' &&
          decl.prop === 'border-bottom'
      );
    expect(findBorders(defaults)).toHaveLength(1);
    expect(findBorders(modern)).toHaveLength(0);
  }
);

test('per-component module configuration works before loading dependencies', () => {
  const css = compile(`
    @use 'variables' as * with ($mg-font-face-sans: ('Licensed 55 Roman', sans-serif), $mg-tabs-border-bottom: false);
    @use 'fonts' with ($font-path-roboto: '/local/roboto');
    @use '../../Components/Tab/tab';
    .probe { width: mg-rem(16); font-size: $mg-font-size-300; }
  `);
  expect(css).toContain('"Licensed 55 Roman"');
  expect(css).toContain('/local/roboto/');
  expect(css).toContain('.probe{width:1rem;font-size:1rem}');
});

test('repeated module references emit fonts and roots once', () => {
  const once = compile('@use "variables"; @use "fonts";');
  expect(
    compile('@use "variables"; @use "fonts"; @use "fonts" as again;')
  ).toBe(once);
});

test('the Sass source tree has no active legacy imports, including aliases', () => {
  const files = fs
    .readdirSync(path.resolve(SCSS, '../..'), { recursive: true })
    .filter(file => file.endsWith('.scss'));
  for (const file of files) {
    expect(
      fs.readFileSync(path.resolve(SCSS, '../..', file), 'utf8')
    ).not.toMatch(/^\s*@import\b/m);
  }
});

// Intentionally shared helpers, not incidental component implementation mixins.
const SHARED_MIXINS = [
  'devicebreak',
  'background-image',
  'x-appearance',
  'animation',
  'transition',
  'transform',
  'rotate',
  'translate',
  'scale',
  'skew',
  'gradient',
  'mg-focus-ring',
  'mg-focus-ring-inset',
  'mg-card-image-zoom',
  'mg-list-unmarked',
  'mg-typography',
  'mg-tokens-tabs',
  'mg-tokens-mangrove',
  'mg-font-roles-arabic',
  'mg-font-roles-latin',
];
const helperProbe = `
  ${SHARED_MIXINS.map(name => `@if not meta.mixin-exists('${name}') { @error 'Missing ${name}'; }`).join('\n')}
  @if not meta.function-exists('mg-font-stack') { @error 'Missing mg-font-stack'; }
  .consumer-probe {
    width: mg-rem(16);
    font-size: $mg-font-size-300;
    @include mg-focus-ring;
    @include devicebreak(medium) { height: mg-rem(32); }
    @include mg-typography('small');
  }
`;

test.each(BUNDLES)(
  '%s exposes the shared helper API to modern and legacy callers',
  bundle => {
    const modern = compile(
      `@use 'sass:meta'; @use '${bundle}' as *; ${helperProbe}`
    );
    const legacy = compile(
      `@use 'sass:meta'; @import '${bundle}'; ${helperProbe}`
    );
    expect(modern).toBe(legacy);
    expect(modern).toContain('.consumer-probe{width:1rem;font-size:1rem;');
    expect(modern).toContain(
      '@media(width >= 48em){.consumer-probe{height:2rem}}'
    );
  }
);

test('internal configuration emits no CSS while variables retains its public exports', () => {
  expect(compile('@use "config";')).toBe('');
  expect(compile('@use "variables";')).toContain('--mg-font-family-text:');
});

test.each([
  'fonts',
  '../../Components/Cards/Card/card',
  '../../Components/Hero/hero',
  '../../Components/Tab/tab',
])('legacy %s cannot reset an intervening consumer root override', partial => {
  const css = compile(
    `@import 'variables'; :root { --mg-color-text: 1 2 3; } @import '${partial}';`
  );
  const values = declarations(css)
    .filter(
      decl =>
        decl.parent.selector === ':root' && decl.prop === '--mg-color-text'
    )
    .map(decl => decl.value);
  expect(values).toEqual(['var(--mg-color-neutral-800)', '1 2 3']);
});

test.each(BUNDLES)(
  '%s accepts mixed loading without unrelated globals reconfiguring modules',
  bundle => {
    const defaults = compile(`@use '${bundle}'; @import '${bundle}';`);
    expect(
      compile(
        `@use '${bundle}'; $mg-font-face-sans: ('Too Late', serif); $font-path-roboto: '/too-late'; @import '${bundle}';`
      )
    ).toBe(defaults);
    const configured = compile(
      `@use 'variables' with ($mg-tabs-border-bottom: false); @import '${bundle}';`
    );
    expect(
      declarations(configured).filter(
        decl =>
          decl.parent.selector === '.mg-tabs__list:after' &&
          decl.prop === 'border-bottom'
      )
    ).toHaveLength(0);
  }
);

test.each([
  ['tab', '$mg-tabs-border-bottom: false;', '../../Components/Tab/tab'],
  ['tag', '$mg-font-tag: 2rem;', '../../Atom/Tag/tag'],
  [
    'arabic-face',
    '$mg-font-face-arabic-sans: ("Custom Arabic", serif);',
    'fonts',
  ],
])(
  'legacy imported-member reassignment affects subsequent %s evaluation',
  (name, assignment, partial) => {
    const prelude =
      '@import "variables"; @import "breakpoints"; @import "mixins";';
    const before = compile(prelude);
    const css = compile(
      prelude +
        assignment +
        `@import "${partial}";` +
        (name === 'tag'
          ? '.reassignment-probe { font-size: $mg-font-tag; }'
          : '')
    );
    // Reassignment does not change already-emitted foundation declarations.
    // Subsequent @extend may legitimately add selectors to earlier rules.
    const roots = output =>
      declarations(output)
        .filter(decl => decl.parent.selector === ':root')
        .map(decl => [decl.prop, decl.value]);
    expect(roots(css).slice(0, roots(before).length)).toEqual(roots(before));
    if (name === 'tab') {
      expect(
        declarations(css).filter(
          decl =>
            decl.parent.selector === '.mg-tabs__list:after' &&
            decl.prop === 'border-bottom'
        )
      ).toHaveLength(0);
    } else if (name === 'tag') {
      expect(css).toContain('.reassignment-probe{font-size:2rem}');
      expect(css).toContain('font-size:var(--mg-font-size-250)');
    } else {
      expect(
        declarations(css)
          .filter(decl => decl.prop === '--mg-font-family-ui')
          .map(decl => decl.value)
      ).toContain('"Custom Arabic", serif');
    }
  }
);

test('font paths also follow first-load configuration semantics', () => {
  expect(
    compile(
      '@use "font-paths"; $font-path-roboto: "/too-late"; @import "fonts";'
    )
  ).toBe(compile('@use "font-paths"; @import "fonts";'));
  expect(() =>
    compile(
      '@use "variables"; @use "style" with ($mg-tabs-border-bottom: false);'
    )
  ).toThrow(/already loaded/);
  expect(() =>
    compile(
      '@use "font-paths"; @use "fonts" with ($font-path-roboto: "/too-late");'
    )
  ).toThrow(/already loaded/);
});

describe('assembled npm Sass consumers', () => {
  const { execFileSync } = require('node:child_process');
  const os = require('node:os');
  let root;
  let published;
  beforeAll(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'mangrove-sass-package-'));
    const repo = path.resolve(SCSS, '../../..');
    for (const file of ['package.json', 'README.md', 'LICENSE'])
      fs.copyFileSync(path.join(repo, file), path.join(root, file));
    // Assemble actual working-tree SCSS (including generated tokens), with a
    // minimal dist prerequisite; the consumer never resolves repository paths.
    fs.mkdirSync(path.join(root, 'dist'));
    fs.writeFileSync(
      path.join(root, 'dist/index.js'),
      '// Sass packaging fixture'
    );
    fs.cpSync(path.join(repo, 'stories'), path.join(root, 'stories'), {
      recursive: true,
      filter: file => fs.statSync(file).isDirectory() || file.endsWith('.scss'),
    });
    execFileSync(process.execPath, [
      path.join(repo, 'scripts/assemble-npm-package.mjs'),
      'package',
      '--root',
      root,
    ]);
    published = path.join(root, 'package/scss/assets/scss');
  });
  afterAll(() => fs.rmSync(root, { recursive: true, force: true }));
  const fromPackage = source =>
    sass.compileString(source, {
      loadPaths: [published],
      style: 'compressed',
      logger: sass.Logger.silent,
    }).css;

  test.each(BUNDLES)(
    '%s preserves hooks and helpers through published paths',
    bundle => {
      const hooks = [
        ...FACES.map((face, index) => [
          `mg-font-face-${face}`,
          `('Package ${index} Face', serif)`,
        ]),
        ...PATHS.map(font => [`font-path-${font}`, `'/package/${font}'`]),
        ['mgIconFontPath', "'/package/icons'"],
        ['mg-tabs-border-bottom', 'false'],
        ['mg-font-tag', '2rem'],
        ['FontName', '"PackageFace"'],
        ['font-version', '"9"'],
      ];
      const modernSource = `@use 'sass:meta'; @use '${bundle}' as * with (${hooks.map(([name, value]) => `$${name}:${value}`).join(',')}); ${helperProbe}`;
      const legacySource = `@use 'sass:meta'; ${hooks.map(([name, value]) => `$${name}:${value};`).join('')} @import '${bundle}'; ${helperProbe}`;
      const modern = fromPackage(modernSource);
      expect(fromPackage(legacySource)).toBe(modern);
      expect(modern).toBe(compile(modernSource));
      for (const font of PATHS) expect(modern).toContain(`/package/${font}/`);
      expect(modern).toContain('PackageFace-Light.woff2?v=9');
    }
  );

  test.each([
    [
      '../../Components/Buttons/CtaButton/buttons',
      '../../Components/Buttons/CtaButton/cta-button',
    ],
    [
      '../../Components/MegaMenu/megamenu',
      '../../Components/MegaMenu/mega-menu',
    ],
    ['../../Components/TextCta/textcta', '../../Components/TextCta/text-cta'],
    [
      '../../Molecules/SectionHeader/sectionheader',
      '../../Molecules/SectionHeader/section-header',
    ],
  ])('published alias %s resolves its original target', (alias, target) => {
    for (const directive of ['use', 'import']) {
      const prelude = '@use "variables"; @use "fonts"; @use "foundational";';
      expect(fromPackage(`${prelude} @${directive} '${alias}';`)).toBe(
        fromPackage(`${prelude} @${directive} '${target}';`)
      );
    }
  });
});

test.each(BUNDLES)(
  '%s bridge warns in the legacy caller scope without warning on supported hooks',
  bundle => {
    const messages = [];
    sass.compileString(
      `$mg-font-family: serif; $mg-color-interactive: red; $mg-font-face-sans: ('Supported', serif); @import '${bundle}';`,
      {
        loadPaths: [SCSS],
        logger: {
          warn: (message, options) => {
            if (!options.deprecation && message.startsWith('Mangrove 2.0:'))
              messages.push(message);
          },
        },
      }
    );
    expect(messages).toHaveLength(2);
    expect(messages.join('\n')).toContain('$mg-font-family');
    expect(messages.join('\n')).toContain('--mg-font-family-text');
    expect(messages.join('\n')).toContain('$mg-color-interactive');
    expect(messages.join('\n')).not.toContain('$mg-font-face-sans');
  }
);
