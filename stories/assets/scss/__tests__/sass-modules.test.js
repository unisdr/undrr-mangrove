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
      ['FontName', '"Renamed"'],
      ['font-version', '"3.0"'],
    ];
    const modern = compile(
      `@use '${bundle}' with (${hooks.map(([name, value]) => `$${name}: ${value}`).join(',')});`
    );
    const legacy = compile(
      hooks.map(([name, value]) => `$${name}: ${value};`).join('\n') +
        `\n@import '${bundle}';`
    );
    expect(legacy).toBe(modern);
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
