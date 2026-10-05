/** Actual authored report landing composition. Finite source fixtures, native acceptance open. */
'use strict';
const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');
const SOURCE_HASHES = {
  'stories/Patterns/LandingPages/LandingPages.jsx':
    '009599125e725fbda9cd5e640504c63262b1ec29bacc0c07d0eb06f748b37bdc',
  'stories/Patterns/_shared/pattern-demo.scss':
    'd99057b1f5bb32dfb55fe08f4fb22a56b59b9384ebe3709213c4543ad82d793d',
  'stories/Components/Breadcrumbs/breadcrumbs.scss':
    '10da218994e22c2b70f6b397af6bea20dd78bbadd7e66eb1f78262b15db8df24',
  'stories/Atom/Layout/Container/container.scss':
    'f62790c55115a47c9291ee2ba3f62b717bf00a698407529e64ffcd97a58af118',
  'stories/Atom/Layout/Grid/grid.scss':
    '2a43bce37aac655ddbd3071a53fdcfd3e8695ca37abce98cad374f1f4098ae9e',
  'stories/Utilities/PagePatterns/page-patterns.scss':
    '54998879cf42ded7facf2a46fd41312f9540df1cc652792d1b41bcde40750be6',
  'stories/Utilities/FullWidth/full-width.scss':
    '7f10dc1976b1d3701fb467e7e2a392db7ad6589195f4ec63c7aabcfd202f517a',
  'stories/assets/scss/_foundational.scss':
    '89f40e9172074d84f101aa6a9d6a048aa6177a67781b8fb672cb4a4c44adbcdf',
  'stories/assets/scss/_fonts.scss':
    '1c28869b687c358c8c5d28bf5ea563e078b07ee8ae6b3ad5df1244f06fb9d754',
  'stories/assets/scss/_variables.scss':
    '2c9ce7c4b18d63243e45ad2eaed07c9a6284c0e57ef79a3dc3d37f8521cccdfa',
  'stories/assets/scss/_mixins.scss':
    '0028b614bb410bd03e6bc6a81e2b42b0daea54a5f6193eca6b7a1130617b9a35',
  '.storybook/preview.js':
    'e19af50151293071b3f87910cded15f2cb7835dbffd125085f3708a257221814',
  'stories/assets/fonts/roboto-condensed/sass/_Regular.scss':
    '83e36cfc43d952acf7e4e15f3f8068de84930b5412a433926fab097d44105ce7',
  'stories/assets/fonts/roboto-condensed/sass/_Bold.scss':
    'efc8c49d945c5d2cd940ed51f2cf1fc16d6011cc5f4ac85bbaaca1868bccb70b',
  'examples/figma-plugin/holistic/assets/landing-report/source-footprints.json':
    'cbc1759fba85a1d1734a589cd215a82c8dc6d9fe241ffb8255a109cb1a054d58',
  'tokens/mangrove.yaml':
    '02449d0cf3aa7e011f767e638637d5dd6427c489d985f36627401db6bf164ec8',
  'tokens/undrr.yaml':
    '7514567babda3ea49f3af6f0f5fbb194b8fbfcab8bdde7bb061cdd6542959669',
  'tokens/preventionweb.yaml':
    '587b72ff245843ec229609c55cda03aa1a2146c35d7bc90c6163f946cd7f08d5',
  'tokens/irp.yaml':
    'b2063159f014824ccfe3edbbbc696ed494fd3dc9113aeddeda089f1828c0ca27',
  'tokens/mcr.yaml':
    '4696b9b72028ed4d62e2c69b51a41df8e24f855d138269a84a93530cc10d9188',
  'tokens/delta.yaml':
    'aa04fedf9b32bfd4b84ac1d755216824d9c589234ac2fbf67c11388ef55dd3b1',
  'stories/assets/fonts/roboto/roboto.scss':
    'b881ae0ebeb56f49523c791faafc1a10299fc1d7a875fa91c028b06164b8197c',
  'stories/assets/fonts/roboto/sass/_Regular.scss':
    'cb27bc0dd02ba21b4dda3249a59e352e0a42c5ea45b83d7cba0a1a2cb79f5845',
  'stories/assets/fonts/roboto/sass/_Bold.scss':
    '9f24cf0a077b2087c47c55bbb665a4086a38818680eee9ca0dfac4c0ce0d273e',
  'stories/assets/fonts/roboto/sass/_variables.scss':
    'ce141aa75263b9b51a301463ddc4ac755458baf84c6636f854852394a6190ea6',
  'stories/assets/fonts/roboto/sass/_mixins.scss':
    'da42b1344b5a5ca7c059c96374b92286381a0a36e2d0ffadefe30683c2e916a7',
  'examples/figma-plugin/holistic/assets/page-patterns/source-fonts/Roboto-Regular.woff2':
    '47107401d0adb375ab9aa167f9d62489a849d510e740a307b5a4db60e5db3562',
  'examples/figma-plugin/holistic/assets/page-patterns/source-fonts/Roboto-Bold.woff2':
    '8e44376b735dcc9027acbcc8a0df64c3f886a23529eff27b022f344d719e90f2',
};
function buildLandingReportRecipes({ root, modes, variables, styles }) {
  const fail = m => {
    throw new Error(`Figma landing report recipe needs updating: ${m}`);
  };
  for (const [file, hash] of Object.entries(SOURCE_HASHES))
    if (
      crypto
        .createHash('sha256')
        .update(fs.readFileSync(path.join(root, file)))
        .digest('hex') !== hash
    )
      fail(`${file} source changed`);
  if (
    modes
      .map(m => m.id)
      .sort()
      .join(',') !== 'delta,irp,mcr,preventionweb,undrr'
  )
    fail('Expected five source modes');
  const source = JSON.parse(
    fs.readFileSync(
      path.join(
        root,
        'examples/figma-plugin/holistic/assets/landing-report/source-footprints.json'
      ),
      'utf8'
    )
  );
  const byName = new Map(variables.map(v => [v.name, v])),
    perMode = fn => Object.fromEntries(modes.map(m => [m.id, fn(m)]));
  const value = (name, m, type, seen = new Set()) => {
    const v = byName.get(name);
    if (!v || v.type !== type || seen.has(name))
      fail(`Missing/wrong/circular ${name}`);
    seen.add(name);
    const x = v.values[m.id];
    if (x == null) fail(`Missing ${name}/${m.id}`);
    return x.alias ? value(x.alias, m, type, seen) : x;
  };
  const upsert = (list, e) => {
    const f = list.filter(x => x.id === e.id || x.name === e.name);
    if (
      f.length > 1 ||
      (f.length && (f[0].id !== e.id || f[0].name !== e.name))
    )
      fail(`Foreign identity ${e.id}`);
    if (f.length) list[list.indexOf(f[0])] = e;
    else list.push(e);
    if (e.type) byName.set(e.name, e);
  };
  const ref = {
    file: 'stories/Patterns/LandingPages/LandingPages.jsx',
    line: 300,
  };
  const role = (n, type, get, scopes = ['WIDTH_HEIGHT']) => {
    const name = `component/landing-report/${n}`;
    upsert(variables, {
      id: name.replaceAll('/', '.'),
      name,
      type,
      values: perMode(get),
      scopes,
      sourceRef: ref,
      description:
        'Finite measured source allocation, see landing report boundaries.',
      hiddenFromPublishing: false,
      codeSyntax: {},
    });
    return name;
  };
  const num = (n, x, scopes) => role(n, 'FLOAT', () => x, scopes);
  for (const m of modes) {
    if (
      value('font-family/text', m, 'STRING') !== 'Roboto' ||
      value('font-family/ui', m, 'STRING') !== 'Roboto Condensed'
    )
      fail('Source Latin fonts changed');
    for (const [n, x] of [
      ['font-size/300', 16],
      ['font-size/400', 18],
      ['font-size/500', 23],
      ['font-size/600', 32],
      ['spacing/100', 10],
      ['spacing/150', 15],
      ['spacing/200', 20],
      ['spacing/400', 50],
    ])
      if (value(n, m, 'FLOAT') !== x) fail(`Measured ${n}/${m.id} changed`);
    for (const n of ['color/text', 'color/white', 'color/interactive'])
      value(n, m, 'COLOR');
  }
  const inset = role('narrow-inset', 'FLOAT', m =>
      m.id === 'undrr' ? 20 : 10
    ),
    inner = role('narrow-inner-width', 'FLOAT', m =>
      m.id === 'undrr' ? 350 : 370
    ),
    wideInset = num('wide-inset', 10),
    wideInner = num('wide-inner-width', 1144),
    readingWide = num('wide-reading-width', 1022),
    trackGap = num('wide-reading-instance-gap', 30, ['GAP']),
    tocTail = num('toc-empty-list-flow-margin', 5, ['GAP']),
    readingGap = num('narrow-reading-gap', 24, ['GAP']);
  const style = (n, family, face, size, lh, extra = {}) => {
    const id = `component.landing-report.${n}`;
    upsert(styles.text, {
      id,
      name: `Mangrove/component/landing-report/${n}`,
      component: true,
      recommended: false,
      source: ref,
      description:
        'Source Latin face and finite typography; native font/pixels pending.',
      bindings: {
        fontFamily: `font-family/${family}`,
        fontSize: `font-size/${size}`,
      },
      values: perMode(m => ({
        fontName: {
          family: value(`font-family/${family}`, m, 'STRING'),
          style: face,
        },
        fontSize: value(`font-size/${size}`, m, 'FLOAT'),
        lineHeight: { unit: 'PERCENT', value: lh },
        ...extra,
      })),
    });
    return id;
  };
  const crumb = style('breadcrumb-link', 'ui', 'Regular', '300', 150),
    current = style('breadcrumb-current', 'ui', 'Bold', '300', 150, {
      paragraphIndent: 28,
    }),
    heading = style('feature-heading', 'text', 'Bold', '600', 108, {
      letterSpacing: { unit: 'PERCENT', value: 2 },
      textWrapStyle: 'BALANCE',
    }),
    ledeN = style('feature-lede-narrow', 'text', 'Regular', '400', 125),
    ledeW = style('feature-lede-wide', 'text', 'Regular', '500', 125);
  const f = (id, layout, children = [], extra = {}) => {
    const bindings = {};
    for (const edge of ['top', 'bottom', 'left', 'right'])
      if (layout.padding?.[edge] !== undefined) {
        const x = layout.padding[edge];
        bindings['padding' + edge[0].toUpperCase() + edge.slice(1)] =
          typeof x === 'number' ? num(`literal-padding-${x}`, x, ['GAP']) : x;
      }
    return {
      type: 'FRAME',
      id,
      name: id,
      fill: null,
      layout,
      children,
      ...extra,
      ...(Object.keys(bindings).length
        ? { bindings: { ...extra.bindings, ...bindings } }
        : {}),
    };
  };
  const t = (id, characters, textStyle, width, height = 'HUG', extra = {}) => ({
    type: 'TEXT',
    id,
    name: id,
    characters,
    textStyle,
    fill: 'color/text',
    textProperty: id,
    textWrap: 'AUTO',
    layout: { width, height },
    ...extra,
  });
  const instance = (id, family, variant, layout) => ({
    type: 'INSTANCE',
    id,
    name: id,
    family,
    variant,
    expose: true,
    layout,
  });
  const round = n => Number(n.toFixed(8)),
    side = 5.6,
    border = 2,
    viewport = side * Math.SQRT2,
    rotate = ([x, y]) => [
      round((x - y) / Math.SQRT2 + side / Math.SQRT2),
      round((x + y) / Math.SQRT2),
    ];
  const polygon = points =>
    `<polygon fill="#000000" points="${points.map(p => rotate(p).join(',')).join(' ')}"/>`;
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${round(viewport)} ${round(viewport)}">${polygon(
    [
      [0, 0],
      [side, 0],
      [side, border],
      [0, border],
    ]
  )}${polygon([
    [side - border, border],
    [side, border],
    [side, side],
    [side - border, side],
  ])}</svg>`;
  const separator = (id, x, y = 8) => ({
    type: 'SVG',
    id,
    name: 'Source rotated breadcrumb border',
    layout: { width: round(viewport), height: round(viewport) },
    position: { x: round(x + 10.4 + (side - viewport) / 2), y },
    svg: {
      assetId: 'landing-report-source-chevron',
      markup,
      monochrome: { fills: 'color/text' },
    },
  });
  const title = 'Global assessment report on disaster risk reduction',
    description =
      'The flagship report on how disaster risk is changing worldwide, and what reduces it.';
  const limits = [
    'Actual finite Chromium English source snapshots at390/1164 for all five themes. Other widths, locale/RTL, hover/focus, browser engines and native pixels remain open.',
    'Composition uses genuine source-matched reusable instances; mock instance preservation is not native consumer/publication acceptance.',
    'Fixed breadcrumb allocation records source flex wrapping for these literals. Native paragraphIndent models first-line offset only; font matching, baseline, underline offset, SVG contour placement and arbitrary edits require native verification.',
    'Source full-width pseudo background is represented as a viewport-wide painted frame. This depicts the captured scene, not equivalent CSS pseudo stacking or semantic HTML.',
    'Source collapsed margins and grid-track slack are explicit finite flow allocations. No blank content placeholders or fabricated footer.',
    'Hidden default SkipLink stays in source dependency metadata; native focus navigation and semantic landmarks are not reproduced.',
  ];
  const family = (id, name) => ({
    id,
    name: `Mangrove/Page patterns/${name}`,
    kind: 'component-set',
    sourceRef: ref,
    review: { genericLabels: false, preserveVariantSizing: true },
    limitations: limits,
    variants: [],
  });
  const breadcrumbs = family(
      'landing-report-breadcrumb',
      'Report inline breadcrumb'
    ),
    features = family('landing-report-feature-band', 'Report feature band'),
    reports = family('landing-report', 'Authored report landing');
  for (const w of [390, 1164]) {
    const narrow = w === 390,
      wi = narrow ? inner : wideInner,
      pad = narrow ? inset : wideInset;
    const textSlot = (
      id,
      text,
      style,
      width,
      height,
      x,
      y,
      underline = false
    ) =>
      f(
        `${id}-slot`,
        { mode: 'VERTICAL', width, height, clipsContent: false },
        [
          t(
            id,
            text,
            style,
            'FILL',
            'HUG',
            underline ? { textDecoration: 'UNDERLINE' } : {}
          ),
        ],
        { position: { x, y } }
      );
    const fixed = () =>
      f(
        'root',
        {
          mode: 'NONE',
          width: wi,
          height: narrow ? 77 : 24,
          clipsContent: false,
        },
        [
          textSlot('home', 'UNDRR', crumb, 45.015625, 24, 0, 0, true),
          separator('ancestor-chevron', 45.015625),
          textSlot(
            'ancestor',
            'Research and publications',
            crumb,
            166.296875,
            24,
            73,
            0,
            true
          ),
          separator(
            'current-chevron',
            narrow ? 0 : 239.296875,
            narrow ? 37 : 8
          ),
          textSlot(
            'current',
            title,
            current,
            narrow ? wi : 359.5625,
            narrow ? 48 : 24,
            narrow ? 0 : 239.296875,
            narrow ? 29 : 0
          ),
        ]
      );
    // Second link starts at source-relative73; ancestor box includes preceding28px pseudo slot.
    breadcrumbs.variants.push({
      id: `landing-report-breadcrumb.${w}`,
      name: `SourceViewport=${w}`,
      properties: { SourceViewport: String(w) },
      sourceHref: {
        home: 'https://www.undrr.org/',
        ancestor: 'https://www.undrr.org/our-work',
      },
      sourceGeometry: {
        fontSize: 16,
        requestedCurrentWeight: 600,
        actualBundledFace: 'Bold700',
        firstLineIndent: 28,
        sourceSide: side,
        sourceBorder: border,
        separatorInkY: 8,
        separatorBaseline:
          'Candidate allocated SVG viewport, native/browser ink comparison pending',
      },
      tree: fixed(),
    });
    features.variants.push({
      id: `landing-report-feature-band.${w}`,
      name: `SourceViewport=${w}`,
      properties: { SourceViewport: String(w) },
      sourceGeometry: {
        fullBleedViewport: w,
        sourceContainerWidth: wi,
        sourcePaddingBlock: 50,
        headingBlockStartMargin: 10,
        headingBlockEndMargin: 10,
        paragraphBlockEndMargin: narrow ? 18 : 23,
      },
      tree: f(
        'root',
        {
          mode: 'VERTICAL',
          width: w,
          height: 'HUG',
          gap: 'spacing/100',
          padding: { top: 60, bottom: narrow ? 68 : 73, left: pad, right: pad },
          clipsContent: false,
        },
        [
          t('title', title, heading, 'FILL', 'HUG', {
            fill: 'color/white',
            textWrap: 'BALANCE',
          }),
          t(
            'lede',
            description,
            narrow ? ledeN : ledeW,
            narrow ? 'FILL' : 784,
            'HUG',
            { fill: 'color/white' }
          ),
        ],
        { fill: 'color/interactive' }
      ),
    });
    const article = instance(
        'article-column',
        'landing-report-article-column',
        { SourceViewport: String(w), Locale: 'English' },
        { width: narrow ? wi : 736, height: 'HUG' }
      ),
      toc = instance(
        'table-of-contents',
        'page-bulleted-toc',
        { Page: 'report', SourceViewport: String(w) },
        { width: narrow ? wi : 256, height: 'HUG' }
      ),
      tocFlow = f(
        'toc-source-flow',
        {
          mode: 'VERTICAL',
          width: narrow ? wi : 256,
          height: 'HUG',
          padding: { bottom: tocTail },
        },
        [toc]
      );
    const reading = f(
      'reading-grid',
      {
        mode: narrow ? 'VERTICAL' : 'HORIZONTAL',
        width: narrow ? wi : readingWide,
        height: 'HUG',
        gap: narrow ? readingGap : trackGap,
        align: 'MIN',
        clipsContent: false,
      },
      narrow ? [tocFlow, article] : [article, tocFlow]
    );
    reports.variants.push({
      id: `landing-report.${w}`,
      name: `SourceViewport=${w},Locale=English,Chrome=Closed`,
      properties: {
        SourceViewport: String(w),
        Locale: 'English',
        Chrome: 'Closed',
      },
      coverage: {
        status: 'complete-authored-finite-source-scene-native-open',
        included: [
          'Authored closed chrome',
          'Exact three-item inline breadcrumb',
          'Full-width source feature band',
          'Four-link source bulleted TOC',
          'All four full report reading sections and real final GAR link',
        ],
        pending: [
          'Other source landing templates and article pages',
          'Intermediate widths, Arabic/RTL, interactive chrome states',
          'Native editable-instance recovery, font and pixel comparison, publication and consumer acceptance',
        ],
      },
      dependencies: {
        actualSourceModules: [
          'UndrrChrome',
          'SkipLink(hidden default)',
          'TableOfContents',
        ],
        nativeInstanceFamilyIds: [
          'page-chrome',
          'landing-report-breadcrumb',
          'landing-report-feature-band',
          'page-bulleted-toc',
          'landing-report-article-column',
        ],
        sourceImportGraph:
          'See page-pattern assets authored-content.json, complete transitive source graph for LandingPages.jsx; unused imported branch modules are not active scene dependencies.',
      },
      sourceGeometry: {
        sourceViewport: w,
        readingCSSGap: 24,
        wideFirstTrack: 742,
        wideArticleCap: 736,
        wideFirstTrackUnusedSpace: 6,
        wideNativeInstanceGap: 30,
        sourceEmptyULFlowTail: 5,
        sourceDocumentMinViewport: 1000,
        nativeRootHeight: 'HUG content extent, no imposed viewport minimum',
      },
      sourceFootprints: source.cases
        .filter(c => c.viewport.width === w)
        .map(c => ({
          brand: c.brand,
          breadcrumb: c.records.find(r => r.tag === 'NAV'),
          feature: c.records.find(r => r.cls.includes('mg-demo-band--feature')),
          reading: c.records.find(r =>
            r.cls.includes('mg-reading mg-reading--')
          ),
          article: c.records.find(
            r => r.cls === 'mg-reading__article mg-content'
          ),
        })),
      tree: f(
        'root',
        {
          mode: 'VERTICAL',
          width: w,
          height: 'HUG',
          gap: 0,
          clipsContent: false,
        },
        [
          instance(
            'site-chrome',
            'page-chrome',
            { Viewport: String(w), State: 'Closed' },
            { width: w, height: narrow ? 118 : 131 }
          ),
          f(
            'breadcrumb-flow',
            {
              mode: 'VERTICAL',
              width: w,
              height: 'HUG',
              padding: { top: 10, bottom: 15, left: pad, right: pad },
            },
            [
              instance(
                'inline-breadcrumb',
                'landing-report-breadcrumb',
                { SourceViewport: String(w) },
                { width: wi, height: narrow ? 77 : 24 }
              ),
            ]
          ),
          instance(
            'feature-band',
            'landing-report-feature-band',
            { SourceViewport: String(w) },
            { width: w, height: 'HUG' }
          ),
          f(
            'reading-flow',
            {
              mode: 'VERTICAL',
              width: w,
              height: 'HUG',
              padding: { top: 15, left: pad, right: pad },
            },
            [reading]
          ),
        ],
        { fill: 'color/white' }
      ),
    });
  }
  return [breadcrumbs, features, reports];
}
module.exports = { buildLandingReportRecipes, SOURCE_HASHES };
