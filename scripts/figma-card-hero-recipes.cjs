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

function buildCardHeroRecipes({ root, modes, variables, styles }) {
  const fail = message => {
    throw new Error(`Figma Card/Hero recipe needs updating: ${message}`);
  };
  const read = file => fs.readFileSync(path.join(root, file), 'utf8');
  const refs = Object.entries(SOURCE_HASHES).map(([file, sha256]) => {
    if (crypto.createHash('sha256').update(read(file)).digest('hex') !== sha256)
      fail(`Guarded source changed: ${file}`);
    return { file, sha256 };
  });
  const cardFile = 'stories/Components/Cards/Card/card.scss';
  const heroFile = 'stories/Components/Hero/hero.scss';
  const card = read(cardFile),
    hero = read(heroFile);
  const source = (file, pattern) => {
    const match = pattern.exec(read(file));
    if (!match) fail(`Missing source declaration ${pattern} in ${file}`);
    return { file, line: read(file).slice(0, match.index).split('\n').length };
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
  const photoFile = 'stories/assets/images/sample_image-lg.jpg';
  const photoBytes = fs.readFileSync(path.join(root, photoFile));
  const photoSha256 = crypto
    .createHash('sha256')
    .update(photoBytes)
    .digest('hex');
  if (
    photoSha256 !==
    'a4cde71b1aea7264cd635e403ec42892e68f4ad38b583498dce7cb86381d9737'
  )
    fail('Source sample photograph changed; review dimensions and crop');
  const photo = {
    assetId: 'mangrove-sample-farmer',
    base64: photoBytes.toString('base64'),
    scaleMode: 'FILL',
  };
  const photoSource = {
    file: photoFile,
    sha256: photoSha256,
    width: 1392,
    height: 615,
    description:
      'Existing repository sample farmer photograph, not the remote Card/Hero story photograph. Native crop/pixels remain unverified.',
  };
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
      m => ({ ...value(role, m), a: typeof get === 'function' ? get(m) : get }),
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
      (desktopImageWidth * 615) / 1392,
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
    wrap = 'AUTO'
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
        lineHeightBasis:
          lineHeight === 'body' ? 'inherited-computed-body' : 'own-font-size',
        verification:
          'Actual JSX with fresh complete SCSS in isolated Chromium, UNDRR Latin. Native acceptance pending.',
      },
      bindings: { fontFamily, fontSize },
      values: perMode(m => ({
        fontName: { family: value(fontFamily, m), style: face },
        fontSize: value(fontSize, m),
        lineHeight:
          lineHeight === 'body'
            ? { unit: 'PIXELS', value: value('font-size/300', m) * 1.5 }
            : { unit: 'PERCENT', value: lineHeight },
        textDecoration: 'NONE',
        textWrapStyle: wrap,
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
  const frame = (name, layout, children = [], extra = {}) => ({
    type: 'FRAME',
    id: name,
    name,
    fill: null,
    stroke: null,
    layout,
    children,
    ...extra,
  });
  const text = (name, property, characters, style, fill, extra = {}) => ({
    type: 'TEXT',
    id: name,
    name,
    textProperty: property,
    characters,
    textStyle: style,
    fill,
    stroke: null,
    textDecoration: 'NONE',
    textWrap: 'AUTO',
    layout: { width: 'FILL', height: 'HUG' },
    ...extra,
  });
  const action = (
    name,
    label,
    context = 'Base',
    width = 'HUG',
    extra = {}
  ) => ({
    type: 'INSTANCE',
    id: name,
    name,
    family: 'editorial-cta',
    variant: {
      Context: context,
      State: 'Default',
      Content: 'Short',
      Motion: 'NoPreference',
    },
    overrides: { Label: label },
    expose: true,
    layout: { width, height: 'HUG' },
    ...extra,
  });
  const image = (name, width, height, extra = {}) => ({
    type: 'FRAME',
    id: name,
    name,
    image: { ...photo },
    stroke: null,
    layout: { mode: 'NONE', width, height, clipsContent: true },
    ...extra,
  });
  const column = (name, children, extra = {}) =>
    frame(
      name,
      {
        mode: 'VERTICAL',
        width: 'FILL',
        height: 'HUG',
        gap: 'spacing/0',
        align: 'MIN',
      },
      children,
      extra
    );
  const cardLimits = [
    'Plain unlinked title, flat summary and an independent editorial button only; source linked title/inline fragment focus/chevron, rich HTML and motion are not represented.',
    'Book/HorizontalBook, Icon/Stats cards, equal-height galleries, arbitrary widths, RTL and native raster/font-file equivalence remain pending.',
    'Horizontal image visibility is fixed because removing source media changes grid columns; vertical image visibility is editable.',
    'Measured source browser geometry uses UNDRR. All-brand token/style values are exported, not visually accepted.',
  ];
  const heroLimits = [
    'Unlinked Section h2, Default size, two editorial actions and existing sample image only. Page h1 letter spacing, linked heading focus, logo, rich HTML, video/HTML media, no-media Split, Immersive/contained/Child, RTL and arbitrary responsive widths remain pending.',
    'Background Desktop image/veil is a finite measured-height preset. Edited copy may grow beyond it; gradients are bounded geometry, not live CSS viewport functions.',
    'Exact Condensed fonts are required; no substitution. Native gradient/crop/paint order, action style propagation and edited text acceptance are pending.',
    'Four source tones are represented. Secondary uses a leading8px rule, not an orange text-bearing surface.',
  ];
  const family = (id, name, sourceRef, limits) => ({
    id,
    name,
    kind: 'component-set',
    source: sourceRef,
    sourceRefs: refs,
    asset: photoSource,
    description: limits.join(' '),
    limitations: limits,
    variants: [],
    review: {
      genericLabels: false,
      preserveVariantSizing: true,
      width: 1280,
      specimens: [],
    },
  });
  const cardVertical = family(
    'card-vertical',
    'Mangrove/Card/Vertical',
    source(cardFile, /&__vc/),
    cardLimits
  );
  const cardHorizontal = family(
    'card-horizontal',
    'Mangrove/Card/Horizontal',
    source(cardFile, /&__hc/),
    cardLimits
  );
  const cardOptional = {
    'Show labels': { nodeName: 'mg-card__meta', defaultValue: true },
    'Show summary': { nodeName: 'mg-card__summary box', defaultValue: true },
    'Show CTA': { nodeName: 'mg-card / editorial action', defaultValue: true },
  };
  cardVertical.optionalProperties = {
    ...cardOptional,
    'Show image': { nodeName: 'mg-card__visual', defaultValue: true },
  };
  cardHorizontal.optionalProperties = { ...cardOptional };
  const cardContent = horizontal =>
    column('mg-card__content', [
      frame(
        'mg-card__meta',
        {
          mode: 'HORIZONTAL',
          width: 'FILL',
          height: 'HUG',
          gap: 'spacing/50',
          align: 'MIN',
        },
        [
          text(
            'mg-card__label 1',
            'Label 1',
            'Label 1',
            typography.cardLabel,
            'color/tag',
            { layout: { width: 'HUG', height: 'HUG' } }
          ),
          text(
            'mg-card__label 2',
            'Label 2',
            'Label 2',
            typography.cardLabel,
            'color/tag',
            { layout: { width: 'HUG', height: 'HUG' } }
          ),
        ],
        { visibilityProperty: 'Show labels' }
      ),
      column(
        'mg-card__title',
        [
          text(
            'mg-card / plain title',
            'Title',
            'Title in large size',
            typography.cardTitle,
            'color/text',
            { textWrap: 'BALANCE' }
          ),
        ],
        { bindings: { paddingTop: 'spacing/100', paddingBottom: 'spacing/75' } }
      ),
      column(
        'mg-card__summary box',
        [
          text(
            'mg-card__summary',
            'Summary',
            'Climate change affects vulnerable communities. Practical guidance can help protect health and strengthen resilience.',
            typography.cardSummary,
            'color/text',
            { textWrap: 'PRETTY' }
          ),
        ],
        {
          visibilityProperty: 'Show summary',
          bindings: { paddingBottom: geometry.paragraphBottom },
        }
      ),
      action(
        'mg-card / editorial action',
        'Primary action',
        'Base',
        horizontal ? 'FILL' : 'HUG',
        { visibilityProperty: 'Show CTA' }
      ),
    ]);
  function cardVariant(target, tone, viewport, horizontal) {
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
    const visual = image('mg-card__visual', visualW, visualH, {
      stroke: paints.hairline,
      strokeAlign: 'OUTSIDE',
      bindings: {
        cornerRadius: geometry.visualRadius,
        strokeWeight: geometry.hairline,
      },
      ...(horizontal ? {} : { visibilityProperty: 'Show image' }),
    });
    const content = cardContent(mobile);
    const body = frame(
      'mg-card / source layout',
      {
        mode: horizontal && !mobile ? 'HORIZONTAL' : 'VERTICAL',
        width: 'FILL',
        height: 'HUG',
        gap: horizontal ? 'spacing/100' : 'spacing/50',
        align: 'MIN',
        ...(horizontal && !mobile
          ? { minHeight: geometry.desktopMediaMin }
          : {}),
      },
      [visual, content],
      {
        bindings: {
          paddingTop: 'card/padding',
          paddingBottom: horizontal
            ? number(
                `card-horizontal-bottom-padding`,
                m => value('card/padding', m) + value('spacing/100', m),
                'Source padding plus implicit trailing row gap.',
                ['GAP'],
                cardFile
              )
            : 'card/padding',
          paddingLeft: 'card/padding',
          paddingRight: 'card/padding',
        },
      }
    );
    const children = secondary
      ? [
          frame(
            'mg-card / leading secondary rule',
            { mode: 'NONE', width: geometry.cardRule, height: 'FILL' },
            [],
            { fill: 'color/secondary' }
          ),
          body,
        ]
      : [body];
    const properties = {
      Tone: tone,
      Viewport: String(viewport),
      Link: 'Unlinked',
      CTA: 'ButtonOnly',
      State: 'Default',
    };
    const id = `${target.id}.${tone.toLowerCase()}.${viewport}.unlinked.buttononly.default`;
    target.variants.push({
      id,
      name: Object.entries(properties)
        .map(([k, v]) => `${k}=${v}`)
        .join(', '),
      properties,
      tree: frame(
        'mg-card mg-card--no-link',
        {
          mode: 'HORIZONTAL',
          width: widths[viewport],
          height: 'HUG',
          gap: 'spacing/0',
          align: 'MIN',
          clipsContent: true,
        },
        children,
        {
          fill: 'card/background',
          effectStyle: 'shadow.raised',
          bindings: { cornerRadius: 'card/border-radius' },
        }
      ),
    });
  }
  for (const tone of tones) {
    for (const w of [300, 240]) cardVariant(cardVertical, tone, w, false);
    for (const w of [1280, 390]) cardVariant(cardHorizontal, tone, w, true);
  }
  const background = family(
    'hero-background',
    'Mangrove/Hero/Background',
    source(heroFile, /\.mg-hero\s*{/),
    heroLimits
  );
  const split = family(
    'hero-split',
    'Mangrove/Hero/Split',
    source(heroFile, /\.mg-hero--split\s*{/),
    heroLimits
  );
  const heroOptional = {
    'Show label': { nodeName: 'mg-hero__label box', defaultValue: true },
    'Show detail': { nodeName: 'mg-hero__detail box', defaultValue: true },
    'Show actions': { nodeName: 'mg-hero__buttons', defaultValue: true },
    'Show second action': {
      nodeName: 'mg-hero / second action',
      defaultValue: true,
    },
  };
  background.optionalProperties = { ...heroOptional };
  split.optionalProperties = { ...heroOptional };
  const heroContent = (tone, mobile, isSplit) => {
    const context =
      tone === 'Tertiary'
        ? 'HeroTertiary'
        : tone === 'Quaternary'
          ? 'HeroQuaternary'
          : 'HeroPrimary';
    const label = column(
      'mg-hero__label box',
      [
        text(
          'mg-hero__label',
          'Label',
          'Guidance for resilient systems',
          typography.heroLabel,
          'color/neutral-0'
        ),
      ],
      {
        visibilityProperty: 'Show label',
        bindings: {
          paddingTop: 'spacing/25',
          paddingBottom: 'spacing/25',
          paddingRight: 'spacing/25',
        },
      }
    );
    const detail = column(
      'mg-hero__detail box',
      [
        text(
          'mg-hero__label detail',
          'Detail',
          '72-page publication',
          typography.heroDetail,
          'color/neutral-0'
        ),
      ],
      {
        visibilityProperty: 'Show detail',
        bindings: {
          paddingTop: 'spacing/25',
          paddingBottom: 'spacing/25',
          paddingRight: 'spacing/25',
        },
      }
    );
    return frame(
      'mg-hero__content',
      {
        mode: 'VERTICAL',
        width: 'FILL',
        height: 'HUG',
        gap: 'spacing/100',
        align: 'MIN',
      },
      [
        column('mg-hero__meta', [label], {
          bindings: { paddingBottom: 'spacing/25' },
        }),
        column(
          'mg-hero__title box',
          [
            text(
              'mg-hero__title h2',
              'Title',
              'Principles for resilient infrastructure',
              mobile ? typography.heroTitleMobile : typography.heroTitleDesktop,
              'color/hero-title',
              { textWrap: 'BALANCE' }
            ),
          ],
          {
            bindings: {
              paddingTop: 'spacing/100',
              paddingBottom: 'spacing/25',
            },
          }
        ),
        column(
          'mg-hero__summaryText box',
          [
            text(
              'mg-hero__summaryText',
              'Summary',
              'Practical guidance to improve the continuity of critical services and make risk-informed investment decisions.',
              typography.heroSummary,
              'color/neutral-0',
              { textWrap: 'PRETTY' }
            ),
          ],
          { bindings: { paddingBottom: 'spacing/25' } }
        ),
        column('mg-hero__meta meta-detail', [detail], {
          bindings: { paddingBottom: 'spacing/25' },
        }),
        frame(
          'mg-hero__buttons',
          {
            mode: mobile ? 'VERTICAL' : 'HORIZONTAL',
            width: 'FILL',
            height: 'HUG',
            gap: mobile ? 'spacing/100' : 'spacing/250',
            align: 'MIN',
            ...(!mobile ? { wrap: 'WRAP', counterGap: 'spacing/100' } : {}),
          },
          [
            action('mg-hero / first action', 'Read the principles', context),
            action(
              'mg-hero / second action',
              'Explore infrastructure resilience',
              context,
              'HUG',
              { visibilityProperty: 'Show second action' }
            ),
          ],
          {
            visibilityProperty: 'Show actions',
            bindings: { paddingTop: 'spacing/75', paddingBottom: 'spacing/50' },
          }
        ),
      ],
      {
        bindings: {
          paddingTop: isSplit
            ? geometry.splitContentTop
            : geometry.heroContentTop,
          ...(isSplit ? { paddingBottom: 'spacing/200' } : {}),
        },
      }
    );
  };
  function heroVariant(target, tone, mobile, ratio = 'Background') {
    const viewport = mobile ? 390 : 1280,
      secondary = tone === 'Secondary',
      isSplit = target === split;
    const properties = {
      Tone: tone,
      Viewport: String(viewport),
      Layout: isSplit ? (mobile ? 'Stacked' : ratio) : 'Background',
      Heading: 'Section',
      State: 'Default',
    };
    const id = `${target.id}.${tone.toLowerCase()}.${viewport}.${properties.Layout.toLowerCase().replace('/', '-')}.section.default`;
    let tree;
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
      const content = heroContent(tone, mobile, true);
      content.layout.width = cw;
      const grid = frame(
        'mg-hero__split-grid mg-container',
        {
          mode: mobile ? 'VERTICAL' : 'HORIZONTAL',
          width: mobile ? 'FILL' : geometry.containerWidth,
          height: 'HUG',
          gap: mobile ? 'spacing/0' : 'spacing/200',
          align: 'MIN',
        },
        [content, image('mg-hero__media', mw, mh)],
        {
          bindings: { paddingLeft: 'spacing/100', paddingRight: 'spacing/100' },
        }
      );
      tree = frame(
        'mg-hero mg-hero--split',
        {
          mode: 'HORIZONTAL',
          width: widths[viewport],
          height: 'HUG',
          gap: 'spacing/0',
          justify: 'CENTER',
          align: 'MIN',
        },
        secondary
          ? [
              frame(
                'mg-hero / leading secondary rule',
                { mode: 'NONE', width: geometry.heroRule, height: 'FILL' },
                [],
                { fill: 'color/hero--secondary' }
              ),
              frame(
                'mg-hero / centered split region',
                {
                  mode: 'HORIZONTAL',
                  width: 'FILL',
                  height: 'HUG',
                  gap: 'spacing/0',
                  justify: 'CENTER',
                  align: 'MIN',
                },
                [grid]
              ),
            ]
          : [grid],
        { fill: surface(tone) }
      );
    } else if (mobile) {
      const p = gradientPaints[tone === 'Secondary' ? 'Primary' : tone];
      const panel = frame(
        'mg-hero__overlay',
        {
          mode: 'VERTICAL',
          width: 'FILL',
          height: 'HUG',
          gap: 'spacing/0',
          align: 'MIN',
        },
        [heroContent(tone, true, false)],
        {
          fill: p.panel,
          bindings: {
            paddingTop: 'hero-overlay/padding',
            paddingBottom: 'hero-overlay/padding',
            paddingLeft: 'hero-overlay/padding',
            paddingRight: 'hero-overlay/padding',
          },
        }
      );
      const panelRow = frame(
        'mg-hero / mobile panel region',
        {
          mode: 'VERTICAL',
          width: 'FILL',
          height: 'HUG',
          gap: 'spacing/0',
          align: 'MIN',
        },
        [panel],
        { fill: p.panel, bindings: { paddingLeft: 'spacing/100' } }
      );
      const stack = frame(
        'mg-hero / mobile composition',
        {
          mode: 'VERTICAL',
          width: 'FILL',
          height: 'HUG',
          gap: 'spacing/0',
          align: 'MIN',
        },
        [
          image('mg-hero / banner image', 'FILL', geometry.bannerHeight),
          panelRow,
        ],
        { fill: p.panel }
      );
      tree = frame(
        'mg-hero',
        {
          mode: 'HORIZONTAL',
          width: widths[viewport],
          height: 'HUG',
          gap: 'spacing/0',
          align: 'MIN',
        },
        secondary
          ? [
              frame(
                'mg-hero / leading secondary rule',
                {
                  mode: 'NONE',
                  width: geometry.heroRule,
                  height: 'FILL',
                },
                [],
                { fill: 'color/hero--secondary' }
              ),
              stack,
            ]
          : [stack],
        { fill: p.panel }
      );
    } else {
      const toneKey = tone === 'Secondary' ? 'Primary' : tone,
        p = gradientPaints[toneKey];
      // Fixed source viewport geometry. Token-bound panel width/padding remains live,
      // but gradient stop geometry is a finite source specimen, not CSS calc().
      const undrr = modes.find(m => m.id === 'undrr') || modes[0],
        start = (viewport - 1164) / 2,
        copyEnd = Math.min(
          viewport,
          start + value('hero-overlay/max-width', undrr)
        ),
        fade = value('hero-scrim/fade', undrr);
      const veilWidth = number(
        `background-${tone.toLowerCase()}-desktop-paint-width`,
        viewport - (secondary ? heroRule : 0),
        'Source background and pseudo-element padding-box width excludes the Secondary leading border.'
      );
      const paintWidth = value(veilWidth, undrr);
      const veil = frame(
        'mg-hero / source veil',
        {
          mode: 'NONE',
          width: veilWidth,
          height: geometry.backgroundDesktopHeight,
          clipsContent: true,
        },
        [],
        {
          position: { x: secondary ? heroRule : 0, y: 0 },
          gradient: {
            layers: [
              {
                stops: [
                  { position: 0, color: paints.scrimClear },
                  { position: 0, color: paints.scrim },
                  { position: copyEnd / paintWidth, color: paints.scrim },
                  {
                    position: Math.min(1, (copyEnd + fade) / paintWidth),
                    color: paints.scrimClear,
                  },
                ],
                transform: [
                  [1, 0, 0],
                  [0, 1, 0],
                ],
              },
              {
                stops: [
                  { position: 0, color: p.clear },
                  { position: 0, color: p.start },
                  { position: copyEnd / paintWidth, color: p.middle },
                  { position: 1, color: p.end },
                ],
                transform: [
                  [1, 0, 0],
                  [0, 1, 0],
                ],
              },
            ],
          },
        }
      );
      const overlay = frame(
        'mg-hero__overlay',
        {
          mode: 'VERTICAL',
          width: 'hero-overlay/max-width',
          height: 'HUG',
          gap: 'spacing/0',
          align: 'MIN',
        },
        [heroContent(tone, false, false)],
        {
          position: { x: start + (secondary ? heroRule : 0), y: 0 },
          bindings: {
            paddingTop: 'hero-overlay/padding',
            paddingBottom: 'hero-overlay/padding',
            paddingLeft: 'hero-overlay/padding',
            paddingRight: 'hero-overlay/padding',
          },
        }
      );
      tree = frame(
        'mg-hero',
        {
          mode: 'NONE',
          width: widths[viewport],
          height: geometry.backgroundDesktopHeight,
          clipsContent: false,
        },
        [
          image(
            'mg-hero / background image',
            veilWidth,
            geometry.backgroundDesktopHeight,
            { position: { x: secondary ? heroRule : 0, y: 0 } }
          ),
          veil,
          ...(secondary
            ? [
                frame(
                  'mg-hero / leading secondary rule',
                  {
                    mode: 'NONE',
                    width: geometry.heroRule,
                    height: geometry.backgroundDesktopHeight,
                  },
                  [],
                  { fill: 'color/hero--secondary', position: { x: 0, y: 0 } }
                ),
              ]
            : []),
          overlay,
        ],
        { fill: surface(tone) }
      );
    }
    target.variants.push({
      id,
      name: Object.entries(properties)
        .map(([k, v]) => `${k}=${v}`)
        .join(', '),
      properties,
      tree,
    });
  }
  for (const tone of tones) {
    for (const mobile of [false, true]) heroVariant(background, tone, mobile);
    for (const ratio of ['2/3', '1/2', '1/3'])
      heroVariant(split, tone, false, ratio);
    heroVariant(split, tone, true);
  }
  for (const f of [cardVertical, cardHorizontal, background, split]) {
    f.review.specimens = [
      {
        id: 'editable-plain-copy',
        name: 'Editable plain source copy',
        width: Number(f.variants[0].properties.Viewport),
        instanceWidth: widths[Number(f.variants[0].properties.Viewport)],
        variant: { ...f.variants[0].properties },
        properties: {
          Title: f.id.startsWith('hero')
            ? 'Principles for resilient infrastructure'
            : 'Title in large size',
          Summary: f.id.startsWith('hero')
            ? 'Practical guidance to improve the continuity of critical services and make risk-informed investment decisions.'
            : 'Climate change affects vulnerable communities. Practical guidance can help protect health and strengthen resilience.',
        },
      },
    ];
  }
  return [cardVertical, cardHorizontal, background, split];
}
module.exports = { buildCardHeroRecipes };
