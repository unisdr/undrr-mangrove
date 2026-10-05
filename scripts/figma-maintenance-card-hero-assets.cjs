/** Source-owned finite Card and Hero recipes. Native acceptance is separate. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const YAML = require('yaml');
const SOURCE_HASHES = {
  'stories/Components/Cards/Card/card.scss':
    'e5220ce8519237793fc7a1045ea38342a887ec02681309aa8667d1928f3d25a3',
  'stories/Components/Cards/Card/VerticalCard.jsx':
    '9a979e43f9c47e5c58e4e8f75b59c194080fc5a34f48ac6cb32c42640971529e',
  'stories/Components/Cards/Card/HorizontalCard.jsx':
    'ddc89f4537730158a45e10f1403303a1b31ea7dff5dffe2a65dc4cee87b9acbf',
  'stories/Components/Cards/Card/cardParts.jsx':
    'ff7ef9eb6fe17893c11ea9ee4135294011aedab580be1175bd7d7ae7c49e68bc',
  'stories/Components/Hero/Hero.jsx':
    'e668f960d34d834f878f294fa3d2563b68eec56566d4601b41875d97567e7a4c',
  'stories/Components/Hero/hero.scss':
    'b1a68bc75615ad92a40bd6e2c4e60ab53fd75b2b9c57b5b50a9470c0a5e08b9b',
  'stories/assets/scss/_foundational.scss':
    '89f40e9172074d84f101aa6a9d6a048aa6177a67781b8fb672cb4a4c44adbcdf',
  'stories/assets/scss/_mixins.scss':
    '0028b614bb410bd03e6bc6a81e2b42b0daea54a5f6193eca6b7a1130617b9a35',
  'stories/assets/scss/_variables.scss':
    '2c9ce7c4b18d63243e45ad2eaed07c9a6284c0e57ef79a3dc3d37f8521cccdfa',
};
function buildCardHeroAssets({ root, modes, variables, styles }) {
  const fail = message => {
    throw new Error(`Figma Card/Hero recipe needs updating: ${message}`);
  };
  // The horizontal media helper depends on this source image's intrinsic ratio.
  // Validate its provenance without constructing or embedding an image DTO.
  const sampleGeometry = {
    file: 'stories/assets/images/sample_image-lg.jpg',
    sha256: 'a4cde71b1aea7264cd635e403ec42892e68f4ad38b583498dce7cb86381d9737',
    width: 1392,
    height: 615,
  };
  if (
    crypto
      .createHash('sha256')
      .update(fs.readFileSync(path.join(root, sampleGeometry.file)))
      .digest('hex') !== sampleGeometry.sha256
  )
    fail('Source sample photograph changed; review dimensions and crop');
  const read = file => fs.readFileSync(path.join(root, file), 'utf8');
  const refs = Object.entries(SOURCE_HASHES).map(([file, sha256]) => {
    if (crypto.createHash('sha256').update(read(file)).digest('hex') !== sha256)
      fail(`Guarded source changed: ${file}`);
    return {
      file,
      sha256,
    };
  });
  const cardFile = 'stories/Components/Cards/Card/card.scss';
  const heroFile = 'stories/Components/Hero/hero.scss';
  const card = read(cardFile),
    hero = read(heroFile);
  const source = (file, pattern) => {
    const match = pattern.exec(read(file));
    if (!match) fail(`Missing source declaration ${pattern} in ${file}`);
    return {
      file,
      line: read(file).slice(0, match.index).split('\n').length,
    };
  };
  const literal = (text, pattern, expected) => {
    const match = pattern.exec(text);
    if (!match || Number(match[1]) !== expected)
      fail(`Source literal changed: ${pattern}`);
    return Number(match[1]);
  };
  const cardRule = literal(
    card,
    /border-inline-start: mg-rem\((\d+)\) solid rgb\(var\(--mg-color-secondary\)\)/,
    4
  );
  const heroRule = literal(
    hero,
    /border-inline-start: mg-rem\((\d+)\) solid rgb\(var\(--mg-color-hero--secondary\)\)/,
    8
  );
  const mobileImageHeight = literal(
    card,
    /grid-template-rows:\s*(\d+)px 1fr auto/,
    300
  );
  const desktopImageWidth = literal(
    card,
    /grid-template-columns:\s*(\d+)px 1fr;\s*}\s*}\s*}/,
    330
  );
  const hairline = literal(
    card,
    /outline:\s*(\d+)px solid rgb\(var\(--mg-color-neutral-900\) \/ 0\.1\)/,
    1
  );
  const pageLetterSpacingRatio = literal(
    read('stories/assets/scss/_foundational.scss'),
    /h1\s*{\s*font-size:\s*var\(--mg-font-size-600\);\s*letter-spacing:\s*([\d.]+)em;/,
    0.02
  );
  const pageLetterSpacingSource = source(
    'stories/assets/scss/_foundational.scss',
    /letter-spacing: 0\.02em/
  );
  const titleRatio = YAML.parse(read('tokens/mangrove.yaml'))[
    'font-line-height'
  ]['500'].$value;
  if (
    YAML.parse(read('tokens/mangrove.yaml'))['font-line-height']['700']
      .$value !== '1.5em'
  )
    fail('Inherited computed body line-height role changed');
  if (titleRatio !== '1.25em')
    fail('Card own-size title line-height role changed');
  if (
    !Array.isArray(modes) ||
    !modes.length ||
    new Set(modes.map(m => m.id)).size !== modes.length
  )
    fail('Missing or duplicate modes');
  const byName = new Map(variables.map(v => [v.name, v]));
  const byId = new Map(variables.map(v => [v.id, v]));
  const value = (name, mode, expected, seen = new Set()) => {
    const variable = byName.get(name) || byId.get(name);
    if (
      !variable ||
      (expected && variable.type !== expected) ||
      seen.has(variable.id)
    )
      fail(`Missing, cyclic or wrong-type role ${name}`);
    const next = new Set(seen).add(variable.id),
      result = variable.values?.[mode.id];
    if (result && result.alias)
      return value(result.alias, mode, expected || variable.type, next);
    if (result === undefined) fail(`Missing ${name}/${mode.id}`);
    if (variable.type === 'FLOAT' && !Number.isFinite(result))
      fail(`Invalid FLOAT ${name}`);
    if (
      variable.type === 'COLOR' &&
      (!result ||
        !['r', 'g', 'b', 'a'].every(
          k => Number.isFinite(result[k]) && result[k] >= 0 && result[k] <= 1
        ))
    )
      fail(`Invalid COLOR ${name}`);
    if (variable.type === 'STRING' && typeof result !== 'string')
      fail(`Invalid STRING ${name}`);
    return result;
  };
  const roles = {
    'font-family/ui': 'STRING',
    'font-family/display': 'STRING',
    'font-family/text': 'STRING',
    'font-size/250': 'FLOAT',
    'font-size/300': 'FLOAT',
    'font-size/400': 'FLOAT',
    'font-size/500': 'FLOAT',
    'font-size/600': 'FLOAT',
    'font-size/800': 'FLOAT',
    'card/background': 'COLOR',
    'card/padding': 'FLOAT',
    'card/border-radius': 'FLOAT',
    'hero-overlay/max-width': 'FLOAT',
    'hero-overlay/padding': 'FLOAT',
    'color/text': 'COLOR',
    'color/tag': 'COLOR',
    'color/secondary': 'COLOR',
    'color/hero': 'COLOR',
    'color/hero--secondary': 'COLOR',
    'color/hero-title': 'COLOR',
    'color/neutral-0': 'COLOR',
    'color/neutral-900': 'COLOR',
    'color/red-800': 'COLOR',
    'hero-gradient/start-opacity': 'FLOAT',
    'hero-gradient/middle-opacity': 'FLOAT',
    'hero-gradient/end-opacity': 'FLOAT',
    'hero-scrim/opacity': 'FLOAT',
    'hero-scrim/fade': 'FLOAT',
    ...Object.fromEntries(
      ['0', '25', '50', '75', '100', '150', '200', '250', '300'].map(n => [
        `spacing/${n}`,
        'FLOAT',
      ])
    ),
  };
  for (const mode of modes) {
    for (const [name, type] of Object.entries(roles)) value(name, mode, type);
    if (
      value('font-family/ui', mode) !== 'Roboto Condensed' ||
      value('font-family/display', mode) !== 'Roboto Condensed' ||
      value('font-family/text', mode) !== 'Roboto'
    )
      fail(
        `Exact Latin source font families changed in ${mode.id}; no substitution`
      );
  }
  const measuredMode = modes.find(m => m.id === 'undrr');
  if (!measuredMode)
    fail('UNDRR measured mode is required for the finite presets');
  for (const [name, expected] of Object.entries({
    'font-size/250': 14,
    'font-size/300': 16,
    'font-size/400': 18,
    'font-size/500': 23,
    'font-size/600': 32,
    'font-size/800': 36,
    'card/padding': 15,
    'card/border-radius': 5,
    'hero-overlay/max-width': 600,
    'hero-overlay/padding': 30,
    'spacing/0': 0,
    'spacing/25': 2.5,
    'spacing/50': 5,
    'spacing/75': 7.5,
    'spacing/100': 10,
    'spacing/150': 15,
    'spacing/200': 20,
    'spacing/250': 24,
    'spacing/300': 30,
    'hero-scrim/fade': 160,
  }))
    if (value(name, measuredMode, 'FLOAT') !== expected)
      fail(
        `Measured UNDRR token ${name} changed; remeasure finite source geometry`
      );
  if (!styles.effect.some(s => s.id === 'shadow.raised'))
    fail('Source Card raised effect is required');
  const opacityRatio = (name, mode) => {
    if (!byName.get(name)?.scopes?.includes('OPACITY'))
      fail(`Expected exported percentage opacity role ${name}`);
    const percent = value(name, mode, 'FLOAT');
    if (percent < 0 || percent > 100)
      fail(`Invalid percentage opacity ${name}`);
    return percent / 100;
  };
  for (const mode of modes)
    for (const name of [
      'hero-gradient/start-opacity',
      'hero-gradient/middle-opacity',
      'hero-gradient/end-opacity',
      'hero-scrim/opacity',
    ])
      opacityRatio(name, mode);
  const perMode = get => Object.fromEntries(modes.map(m => [m.id, get(m)]));
  const put = (array, definition) => {
    const i = array.findIndex(v => v.id === definition.id);
    if (i < 0) array.push(definition);
    else array[i] = definition;
  };
  const helper = (name, type, scopes, get, description, file = heroFile) => {
    const full = `component/card-hero/${name}`;
    const definition = {
      id: full.replaceAll('/', '.'),
      name: full,
      type,
      scopes,
      hiddenFromPublishing: false,
      codeSyntax: {},
      source: source(file, /\.mg-(?:card|hero)/),
      description,
      values: perMode(get),
    };
    put(variables, definition);
    byName.set(full, definition);
    byId.set(definition.id, definition);
    return full;
  };
  const number = (
    name,
    get,
    description,
    scopes = ['WIDTH_HEIGHT'],
    file = heroFile
  ) =>
    helper(
      name,
      'FLOAT',
      scopes,
      typeof get === 'function' ? get : () => get,
      description,
      file
    );
  const alpha = (name, role, get, scopes = ['FRAME_FILL']) =>
    helper(
      name,
      'COLOR',
      scopes,
      m => ({
        ...value(role, m),
        a: typeof get === 'function' ? get(m) : get,
      }),
      `Source ${role} alpha cast; Figma aliases cannot change opacity.`
    );
  const geometry = {
    cardRule: number(
      'card-leading-rule',
      cardRule,
      'Source Secondary leading border4px, represented as a separate leading bar, not a complete border.',
      ['WIDTH_HEIGHT'],
      cardFile
    ),
    heroRule: number(
      'hero-leading-rule',
      heroRule,
      'Source Secondary leading border8px.',
      ['WIDTH_HEIGHT']
    ),
    visualRadius: number(
      'card-visual-radius',
      m => value('card/border-radius', m) / 2,
      'Source media radius is card radius divided by2.',
      ['CORNER_RADIUS'],
      cardFile
    ),
    hairline: number(
      'card-media-hairline',
      hairline,
      'Source decorative outside media outline1px, unrelated to focus.',
      ['STROKE_FLOAT'],
      cardFile
    ),
    paragraphBottom: number(
      'card-paragraph-bottom',
      m => value('spacing/50', m) + value('font-size/300', m),
      'Source summary padding5 plus measured Chromium UA paragraph margin1em. UA parity in other renderers is not promised.',
      ['GAP'],
      cardFile
    ),
    horizontalTail: number(
      'horizontal-card-trailing-gap',
      m => value('spacing/100', m),
      'Source implicit empty trailing grid row contributes one additional grid gap.',
      ['GAP'],
      cardFile
    ),
    heroContentTop: number(
      'hero-content-top',
      m => value('spacing/25', m),
      'Source content margin-block-start2.5, represented by leading content padding.',
      ['GAP']
    ),
    splitContentTop: number(
      'split-content-top',
      m => value('spacing/200', m) + value('spacing/25', m),
      'Source split content padding20 plus margin-top2.5.',
      ['GAP']
    ),
    containerWidth: number(
      'desktop-container-width',
      1164,
      'Source desktop mg-container maximum1164 at measured viewport1280; not a live viewport algorithm.'
    ),
    backgroundDesktopHeight: number(
      'background-desktop-height',
      328.1875,
      'Measured UNDRR actual JSX Section h2, plain copy and two editorial CTAs at1280. Fixed research preset, longer edits may extend past the image/veil.'
    ),
    backgroundPageDesktopHeight: number(
      'background-page-desktop-height',
      371.375,
      'Measured UNDRR actual source Page h1 at1280 with the existing plain-copy fixture: inherited .02em letter spacing increases the title to two lines. Finite source height; native font-file/wrapping equivalence is not promised.'
    ),
    bannerHeight: number(
      'mobile-banner-height',
      Math.min(390 * 0.56, 320),
      'Source min(56vw,320px) at measured viewport390; Chromium fixed-point used218.390625. Native float/pixels need acceptance.'
    ),
    desktopMediaWidth: number(
      'horizontal-media-desktop-width',
      desktopImageWidth,
      'Source horizontal Card image column330px at viewport>=900.',
      ['WIDTH_HEIGHT'],
      cardFile
    ),
    desktopMediaMin: number(
      'horizontal-media-desktop-minimum',
      (desktopImageWidth * sampleGeometry.height) / sampleGeometry.width,
      'Existing sample image intrinsic ratio1392/615 at source image column330, unlike the remote story photo ratio.',
      ['WIDTH_HEIGHT'],
      cardFile
    ),
    mobileMediaHeight: number(
      'horizontal-media-mobile-height',
      mobileImageHeight,
      'Source horizontal media row300px below480.',
      ['WIDTH_HEIGHT'],
      cardFile
    ),
  };
  const widths = Object.fromEntries(
    [240, 300, 390, 1280].map(w => [
      w,
      number(
        `viewport-${w}`,
        w,
        `Explicit bounded measured consumer width${w}; not an automatic breakpoint.`
      ),
    ])
  );
  const tones = ['Primary', 'Secondary', 'Tertiary', 'Quaternary'];
  const surface = tone =>
    tone === 'Tertiary'
      ? 'color/neutral-900'
      : tone === 'Quaternary'
        ? 'color/red-800'
        : 'color/hero';
  const paints = {
    hairline: alpha('card-media-hairline-color', 'color/neutral-900', 0.1, [
      'STROKE_COLOR',
    ]),
  };
  const gradientPaints = {};
  for (const tone of ['Primary', 'Tertiary', 'Quaternary']) {
    const key = tone.toLowerCase();
    gradientPaints[tone] = {
      start: alpha(`${key}-tint-start`, surface(tone), m =>
        opacityRatio('hero-gradient/start-opacity', m)
      ),
      middle: alpha(`${key}-tint-middle`, surface(tone), m =>
        opacityRatio('hero-gradient/middle-opacity', m)
      ),
      end: alpha(`${key}-tint-end`, surface(tone), m =>
        opacityRatio('hero-gradient/end-opacity', m)
      ),
      clear: alpha(`${key}-tint-clear`, surface(tone), 0),
      panel: helper(
        `${key}-mobile-panel`,
        'COLOR',
        ['FRAME_FILL'],
        m => {
          const tint = value(surface(tone), m),
            scrim = value('color/neutral-900', m),
            a = opacityRatio('hero-scrim/opacity', m);
          return {
            r: scrim.r * a + tint.r * (1 - a),
            g: scrim.g * a + tint.g * (1 - a),
            b: scrim.b * a + tint.b * (1 - a),
            a: 1,
          };
        },
        'Source mobile opaque Hero surface composited under neutral900 scrim. Derived per brand, not a source alias.'
      ),
    };
  }
  paints.scrim = alpha('hero-scrim-color', 'color/neutral-900', m =>
    opacityRatio('hero-scrim/opacity', m)
  );
  paints.scrimClear = alpha('hero-scrim-clear', 'color/neutral-900', 0);
  const textStyle = (
    id,
    fontFamily,
    fontSize,
    face,
    lineHeight,
    wrap = 'AUTO',
    letterSpacing
  ) => {
    const definition = {
      id: `component.${id}`,
      name: `Mangrove/component/${id.replaceAll('.', '/')}`,
      type: 'TEXT',
      recommended: false,
      source: source(
        id.startsWith('card') ? cardFile : heroFile,
        /font-family:/
      ),
      description:
        'Exact source Latin face and typography; no substituted Condensed font. Browser measures bundled face; native font-file equivalence and edited-instance style propagation remain pending.',
      typography: {
        fontWeightRequested: face === 'Bold' ? 700 : 400,
        fontWeightBundled: face === 'Bold' ? 700 : 400,
        fontStyleBundled: face,
        ...(letterSpacing
          ? {
              letterSpacingRatio: pageLetterSpacingRatio,
              letterSpacingSource: pageLetterSpacingSource,
            }
          : {}),
        lineHeightBasis:
          lineHeight === 'body' ? 'inherited-computed-body' : 'own-font-size',
        verification:
          'Actual JSX with fresh complete SCSS in isolated Chromium, UNDRR Latin. Native acceptance pending.',
      },
      bindings: {
        fontFamily,
        fontSize,
      },
      values: perMode(m => ({
        fontName: {
          family: value(fontFamily, m),
          style: face,
        },
        fontSize: value(fontSize, m),
        lineHeight:
          lineHeight === 'body'
            ? {
                unit: 'PIXELS',
                value: value('font-size/300', m) * 1.5,
              }
            : {
                unit: 'PERCENT',
                value: lineHeight,
              },
        textDecoration: 'NONE',
        textWrapStyle: wrap,
        ...(letterSpacing
          ? {
              letterSpacing: {
                ...letterSpacing,
              },
            }
          : {}),
      })),
    };
    put(styles.text, definition);
    return definition.id;
  };
  const typography = {
    cardTitle: textStyle(
      'card.title',
      'font-family/ui',
      'font-size/500',
      'Bold',
      125,
      'BALANCE'
    ),
    cardLabel: textStyle(
      'card.label',
      'font-family/ui',
      'font-size/250',
      'Bold',
      'body'
    ),
    cardSummary: textStyle(
      'card.summary',
      'font-family/text',
      'font-size/300',
      'Regular',
      'body',
      'PRETTY'
    ),
    heroTitleDesktop: textStyle(
      'hero.title-desktop',
      'font-family/display',
      'font-size/800',
      'Bold',
      120,
      'BALANCE'
    ),
    heroTitleMobile: textStyle(
      'hero.title-mobile',
      'font-family/display',
      'font-size/600',
      'Bold',
      120,
      'BALANCE'
    ),
    heroPageTitleDesktop: textStyle(
      'hero.page-title-desktop',
      'font-family/display',
      'font-size/800',
      'Bold',
      120,
      'BALANCE',
      {
        unit: 'PERCENT',
        value: pageLetterSpacingRatio * 100,
      }
    ),
    heroPageTitleMobile: textStyle(
      'hero.page-title-mobile',
      'font-family/display',
      'font-size/600',
      'Bold',
      120,
      'BALANCE',
      {
        unit: 'PERCENT',
        value: pageLetterSpacingRatio * 100,
      }
    ),
    heroLabel: textStyle(
      'hero.label',
      'font-family/ui',
      'font-size/250',
      'Bold',
      'body'
    ),
    heroDetail: textStyle(
      'hero.detail',
      'font-family/ui',
      'font-size/250',
      'Regular',
      'body'
    ),
    heroSummary: textStyle(
      'hero.summary',
      'font-family/text',
      'font-size/400',
      'Regular',
      'body',
      'PRETTY'
    ),
  };
  function deriveCardPreset(tone, viewport, horizontal) {
    const secondary = tone === 'Secondary',
      mobile = horizontal && viewport === 390;
    const contentWidth = m =>
      viewport - value('card/padding', m) * 2 - (secondary ? cardRule : 0);
    const visualW = number(
      `card-${horizontal ? 'horizontal' : 'vertical'}-${tone.toLowerCase()}-${viewport}-visual-width`,
      m =>
        horizontal
          ? mobile
            ? contentWidth(m) - value('spacing/100', m)
            : desktopImageWidth
          : contentWidth(m),
      'Source finite media column; mobile horizontal implicit trailing grid column contributes one extra gap.',
      ['WIDTH_HEIGHT'],
      cardFile
    );
    const visualH = horizontal
      ? mobile
        ? geometry.mobileMediaHeight
        : 'FILL'
      : number(
          `card-vertical-${tone.toLowerCase()}-${viewport}-visual-height`,
          m => (value(visualW, m) * 9) / 16,
          'Source media16/9 on the explicit Card preset.',
          ['WIDTH_HEIGHT'],
          cardFile
        );
    const bottomPadding = horizontal
      ? number(
          `card-horizontal-bottom-padding`,
          m => value('card/padding', m) + value('spacing/100', m),
          'Source padding plus implicit trailing row gap.',
          ['GAP'],
          cardFile
        )
      : 'card/padding';
    return {
      secondary,
      mobile,
      contentWidth,
      visualW,
      visualH,
      bottomPadding,
    };
  }
  function deriveHeroPreset(tone, mobile, isSplit, ratio) {
    const viewport = mobile ? 390 : 1280,
      secondary = tone === 'Secondary';
    if (isSplit) {
      const fraction =
        ratio === '1/3' ? 1 / 3 : ratio === '1/2' ? 1 / 2 : 2 / 3;
      const cw = number(
        `split-${tone.toLowerCase()}-${viewport}-${mobile ? 'stacked' : ratio.replace('/', '-')}-copy-width`,
        m =>
          mobile
            ? viewport -
              (secondary ? heroRule : 0) -
              2 * value('spacing/100', m)
            : (value(geometry.containerWidth, m) -
                2 * value('spacing/100', m) -
                value('spacing/200', m)) *
              fraction,
        'Source split grid tracks inside the bounded mg-container. Native columns fixed per preset, not CSS automatic responsive tracks.'
      );
      const mw = number(
        `split-${tone.toLowerCase()}-${viewport}-${mobile ? 'stacked' : ratio.replace('/', '-')}-media-width`,
        m =>
          mobile
            ? value(cw, m)
            : value(geometry.containerWidth, m) -
              2 * value('spacing/100', m) -
              value('spacing/200', m) -
              value(cw, m),
        'Source remaining split column, or full stacked mobile inner width.'
      );
      const mh = mobile
        ? number(
            `split-${tone.toLowerCase()}-mobile-media-height`,
            m => (value(mw, m) * 9) / 16,
            'Source mobile split media16/9.'
          )
        : 'FILL';
      return {
        cw,
        mw,
        mh,
      };
    } else if (!mobile) {
      const veilWidth = number(
        `background-${tone.toLowerCase()}-desktop-paint-width`,
        viewport - (secondary ? heroRule : 0),
        'Source background and pseudo-element padding-box width excludes the Secondary leading border.'
      );
      return {
        veilWidth,
      };
    }
    return {};
  }
  const cardPresets = new Map();
  for (const tone of tones) {
    for (const viewport of [300, 240])
      cardPresets.set(
        `${tone}/${viewport}/false`,
        deriveCardPreset(tone, viewport, false)
      );
    for (const viewport of [1280, 390])
      cardPresets.set(
        `${tone}/${viewport}/true`,
        deriveCardPreset(tone, viewport, true)
      );
  }
  const heroPresets = new Map();
  for (const tone of tones) {
    for (const mobile of [false, true])
      heroPresets.set(
        `${tone}/${mobile}/false/Background`,
        deriveHeroPreset(tone, mobile, false, 'Background')
      );
    for (const ratio of ['2/3', '1/2', '1/3'])
      heroPresets.set(
        `${tone}/false/true/${ratio}`,
        deriveHeroPreset(tone, false, true, ratio)
      );
    heroPresets.set(
      `${tone}/true/true/Background`,
      deriveHeroPreset(tone, true, true, 'Background')
    );
  }
  return {
    sampleGeometry,
    fail,
    read,
    refs,
    cardFile,
    heroFile,
    card,
    hero,
    source,
    literal,
    cardRule,
    heroRule,
    mobileImageHeight,
    desktopImageWidth,
    hairline,
    pageLetterSpacingRatio,
    pageLetterSpacingSource,
    titleRatio,
    byName,
    byId,
    value,
    roles,
    measuredMode,
    opacityRatio,
    perMode,
    put,
    helper,
    number,
    alpha,
    geometry,
    widths,
    tones,
    surface,
    paints,
    gradientPaints,
    textStyle,
    typography,
    cardPresets,
    heroPresets,
  };
}
module.exports = {
  buildCardHeroAssets,
};
