/** Bounded actual page TOC and QuoteHighlight contracts. Native acceptance remains open. */
'use strict';
const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');
const SOURCE_HASHES = {
  'stories/Patterns/LandingPages/LandingPages.jsx':
    '009599125e725fbda9cd5e640504c63262b1ec29bacc0c07d0eb06f748b37bdc',
  'stories/Patterns/ArticleStory/ArticleStory.jsx':
    '9ca2a8be73cec051545220f89b88847bda104de21bdac2aacf0265ea3a0b4327',
  'stories/Components/TableOfContents/TableOfContents.jsx':
    '646e0361f7e48fa8ae6f29335c8c5612847d05c8bf1524a5e1a553e8f52cf5d3',
  'stories/Components/TableOfContents/table-of-contents.scss':
    '5186cbe176bfd54afbb57ddc4e446ee811778248c8d93820ea7f40121edd3646',
  'stories/assets/js/table-of-contents.js':
    '76760bfdda4368f4810ab6b77bbdc9046d8df905f93e518cc86fbd5431c7c404',
  'stories/Components/QuoteHighlight/QuoteHighlight.jsx':
    '3dfe46fda728b897499ddaa078e4a97503ec9188f18a10ba6b38f13065097ba5',
  'stories/Components/QuoteHighlight/quote-highlight.scss':
    '19e831f37277da7223cd9b8f91aee5b6cc0236e1a4579bff74d20554896f4c0f',
  'stories/Components/QuoteHighlight/QuoteHighlight.stories.jsx':
    '226fad1e9d6f96535cf930415b72343e24ff18f5e647311ef407d56f8f670f17',
  'stories/Components/QuoteHighlight/__tests__/QuoteHighlight.test.jsx':
    '7ad7429818e04eca5fb5d1148d596fe8e5f5fe922d39b3ed5993d5ff3b45c6fc',
  'stories/Atom/BaseTypography/Blockquote/blockquote.scss':
    '0f8261bd8901f43f4d1d7caac93878ce6593075364401d6af523954480254d37',
  'stories/Utilities/PagePatterns/page-patterns.scss':
    '54998879cf42ded7facf2a46fd41312f9540df1cc652792d1b41bcde40750be6',
  'stories/Patterns/_shared/pattern-demo.scss':
    'd99057b1f5bb32dfb55fe08f4fb22a56b59b9384ebe3709213c4543ad82d793d',
  'stories/assets/scss/_foundational.scss':
    '89f40e9172074d84f101aa6a9d6a048aa6177a67781b8fb672cb4a4c44adbcdf',
  'stories/assets/scss/_variables.scss':
    '2c9ce7c4b18d63243e45ad2eaed07c9a6284c0e57ef79a3dc3d37f8521cccdfa',
  'stories/assets/scss/_mixins.scss':
    '0028b614bb410bd03e6bc6a81e2b42b0daea54a5f6193eca6b7a1130617b9a35',
  'stories/assets/scss/_fonts.scss':
    '1c28869b687c358c8c5d28bf5ea563e078b07ee8ae6b3ad5df1244f06fb9d754',
  'stories/Utilities/Normalize/normalize.scss':
    'b74d9ace846077ecd6ad39e618f4a90ecde78dab80713b00315caba55cd76795',
  '.storybook/preview.js':
    'e19af50151293071b3f87910cded15f2cb7835dbffd125085f3708a257221814',
  'stories/assets/fonts/roboto/sass/_variables.scss':
    'ce141aa75263b9b51a301463ddc4ac755458baf84c6636f854852394a6190ea6',
  'stories/assets/fonts/roboto/sass/_mixins.scss':
    'da42b1344b5a5ca7c059c96374b92286381a0a36e2d0ffadefe30683c2e916a7',
  'stories/assets/fonts/roboto/sass/_Regular.scss':
    'cb27bc0dd02ba21b4dda3249a59e352e0a42c5ea45b83d7cba0a1a2cb79f5845',
  'stories/assets/fonts/roboto/sass/_Bold.scss':
    '9f24cf0a077b2087c47c55bbb665a4086a38818680eee9ca0dfac4c0ce0d273e',
  'stories/assets/fonts/roboto/sass/_Italic.scss':
    'bbf29ea2da948bbd1827da7c8f1c7c95e3e8e74584445663670ded67fcbf8696',
  'stories/assets/fonts/roboto/sass/_BoldItalic.scss':
    '94f40e36a612417be36294f5f8fb084c73ccce4d63cc5456fdaa80b738ad1355',
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
  'examples/figma-plugin/holistic/assets/page-reading/source-footprints.json':
    '4bacffbeab7de7cc2e418eb45db2dfd7482ba648a6aea5c367fb50cdc8d9fce3',
  'examples/figma-plugin/holistic/assets/page-reading/source-fonts/LICENSE-2.0.txt':
    'cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30',
  'examples/figma-plugin/holistic/assets/page-reading/source-fonts/Roboto-Regular.woff2':
    '47107401d0adb375ab9aa167f9d62489a849d510e740a307b5a4db60e5db3562',
  'examples/figma-plugin/holistic/assets/page-reading/source-fonts/Roboto-Bold.woff2':
    '8e44376b735dcc9027acbcc8a0df64c3f886a23529eff27b022f344d719e90f2',
  'examples/figma-plugin/holistic/assets/page-reading/source-fonts/Roboto-Italic.woff2':
    '884e654cef00224110fc62cdf8f1561ff08dcaa1f359e5c5f49dab62abfe79e8',
  'examples/figma-plugin/holistic/assets/page-reading/source-fonts/Roboto-BoldItalic.woff2':
    'c9d5a0e6287ab6c0d3e7c80ebdeb26427680849215882e3db0061efcf64c2575',
};
function buildPageReadingRecipes({ root, modes, variables, styles }) {
  const fail = m => {
    throw new Error(`Figma page reading recipe needs updating: ${m}`);
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
        'examples/figma-plugin/holistic/assets/page-reading/source-footprints.json'
      ),
      'utf8'
    )
  );
  const byName = new Map(variables.map(v => [v.name, v]));
  const perMode = fn => Object.fromEntries(modes.map(m => [m.id, fn(m)]));
  const val = (name, m, type, seen = new Set()) => {
    const v = byName.get(name);
    if (!v || v.type !== type || seen.has(name))
      fail(`Missing/wrong/circular ${name}`);
    seen.add(name);
    const x = v.values[m.id];
    if (x == null) fail(`Missing ${name}/${m.id}`);
    return x.alias ? val(x.alias, m, type, seen) : x;
  };
  const upsert = (list, e) => {
    const found = list.filter(x => x.id === e.id || x.name === e.name);
    if (
      found.length > 1 ||
      (found.length && (found[0].id !== e.id || found[0].name !== e.name))
    )
      fail(`Foreign identity ${e.id}`);
    if (found.length) list[list.indexOf(found[0])] = e;
    else list.push(e);
    if (e.type) byName.set(e.name, e);
  };
  const ref = {
    file: 'stories/Components/QuoteHighlight/quote-highlight.scss',
    line: 9,
  };
  const tocRef = {
    file: 'stories/Components/TableOfContents/table-of-contents.scss',
    line: 9,
  };
  const role = (name, type, get, scopes = ['WIDTH_HEIGHT']) => {
    const n = `component/page-reading/${name}`;
    upsert(variables, {
      id: n.replaceAll('/', '.'),
      name: n,
      type,
      values: perMode(get),
      scopes,
      sourceRef:
        name.startsWith('toc-') || name.startsWith('ua-disc') ? tocRef : ref,
      description:
        'Finite authored source page reading projection. See family limits.',
      hiddenFromPublishing: false,
      codeSyntax: {},
    });
    return n;
  };
  const num = (n, v, scopes) => role(n, 'FLOAT', () => v, scopes);
  for (const m of modes) {
    if (val('font-family/text', m, 'STRING') !== 'Roboto')
      fail('Unverified source Latin face');
    for (const [n, x] of [
      ['spacing/25', 2.5],
      ['spacing/50', 5],
      ['spacing/100', 10],
      ['spacing/200', 20],
      ['spacing/300', 30],
      ['spacing/400', 50],
      ['spacing/500', 60],
      ['font-size/200', 12.5],
      ['font-size/300', 16],
      ['font-size/400', 18],
      ['font-size/600', 32],
      ['font-size/900', 40],
      ['font-size/1000', 48],
    ])
      if (val(n, m, 'FLOAT') !== x) fail(`Measured ${n}/${m.id} changed`);
    for (const n of [
      'color/text',
      'color/interactive',
      'color/neutral-300',
      'color/blue-900',
      'color/white',
      'color/neutral-900',
      'color/neutral-500',
    ])
      val(n, m, 'COLOR');
  }
  const zero = num('zero', 0),
    markY = num('mark-y', -10),
    opacity = num('mark-opacity', 50, ['OPACITY']),
    border = num('toc-border', 2, ['STROKE_FLOAT']),
    markerD = num('ua-disc-diameter', source.markerProjection.diameter),
    markerX = num('ua-disc-x', source.markerProjection.offsetX),
    markerY = num('ua-disc-y', source.markerProjection.offsetY),
    markW = num('mark-width', 19.125),
    sepW = num('separator-width', 100),
    sepH = num('separator-height', 4);
  const colors = {};
  for (const tone of ['light', 'dark', 'bright'])
    for (const part of [
      'background',
      'quote',
      'mark',
      'separator',
      'attribution',
    ])
      colors[`${tone}-${part}`] = role(
        `${tone}-${part}`,
        'COLOR',
        m => {
          let base,
            alpha = 1;
          if (tone === 'light') {
            base = ['background', 'quote', 'mark', 'separator'].includes(part)
              ? 'color/blue-900'
              : 'color/text';
            alpha =
              { background: 0.1, quote: 0.9, mark: 0.5, separator: 0.7 }[
                part
              ] ?? 1;
          } else if (tone === 'dark') {
            base =
              part === 'background'
                ? 'color/blue-900'
                : part === 'mark'
                  ? 'color/neutral-0'
                  : 'color/white';
            alpha = part === 'mark' ? 0.8 : 1;
          } else {
            base =
              part === 'background'
                ? 'color/white'
                : part === 'quote'
                  ? 'color/neutral-900'
                  : part === 'mark'
                    ? 'color/neutral-500'
                    : part === 'separator'
                      ? 'color/blue-900'
                      : 'color/text';
            alpha = part === 'separator' ? 0.7 : 1;
          }
          return { ...val(base, m, 'COLOR'), a: alpha };
        },
        ['ALL_FILLS']
      );
  const style = (name, size, face, lh, wrap = 'AUTO') => {
    const id = `component.page-reading.${name}`;
    upsert(styles.text, {
      id,
      name: `Mangrove/component/page-reading/${name}`,
      component: true,
      recommended: false,
      source: name.startsWith('toc-') ? tocRef : ref,
      description:
        'Source Roboto declaration with captured weight600 resolving700. Native byte/font matching open.',
      bindings: {
        fontFamily: 'font-family/text',
        fontSize: `font-size/${size}`,
      },
      values: perMode(m => ({
        fontName: { family: val('font-family/text', m, 'STRING'), style: face },
        fontSize: val(`font-size/${size}`, m, 'FLOAT'),
        lineHeight: lh,
        textWrapStyle: wrap,
      })),
    });
    return id;
  };
  const stylesBy = {
    tocHeading: style(
      'toc-heading',
      '400',
      'Bold',
      { unit: 'PERCENT', value: 110 },
      'BALANCE'
    ),
    tocLabel: style('toc-label', '300', 'Regular', {
      unit: 'PERCENT',
      value: 150,
    }),
    quote: style(
      'quote',
      '400',
      'Bold Italic',
      { unit: 'PERCENT', value: 150 },
      'BALANCE'
    ),
    pageNarrow: style(
      'quote-page-narrow',
      '600',
      'Bold Italic',
      { unit: 'PERCENT', value: 116 },
      'BALANCE'
    ),
    pageWide: style(
      'quote-page-wide',
      '900',
      'Bold Italic',
      { unit: 'PERCENT', value: 115 },
      'BALANCE'
    ),
    mark: style('mark', '1000', 'Bold Italic', { unit: 'PERCENT', value: 150 }),
    markNarrow: style('mark-page-narrow', '1000', 'Bold Italic', {
      unit: 'PERCENT',
      value: 116,
    }),
    markWide: style('mark-page-wide', '1000', 'Bold Italic', {
      unit: 'PERCENT',
      value: 115,
    }),
    name: style('attribution-name', '300', 'Bold', {
      unit: 'PIXELS',
      value: 24,
    }),
    title: style('attribution-title', '200', 'Regular', {
      unit: 'PIXELS',
      value: 24,
    }),
    titleItalic: style('attribution-title-italic', '200', 'Italic', {
      unit: 'PIXELS',
      value: 24,
    }),
  };
  const effect = 'component.page-reading.quote-shadow';
  upsert(styles.effect, {
    id: effect,
    name: 'Mangrove/component/page-reading/quote-shadow',
    source: ref,
    description: 'Source0 4px12px rgba black.08',
    values: perMode(() => [
      {
        effect: {
          type: 'DROP_SHADOW',
          color: { r: 0, g: 0, b: 0, a: 0.08 },
          offset: { x: 0, y: 4 },
          radius: 12,
          spread: 0,
          visible: true,
          blendMode: 'NORMAL',
        },
      },
    ]),
  });
  const f = (id, layout, children = [], extra = {}) => ({
    id,
    type: 'FRAME',
    name: id,
    fill: null,
    layout,
    children,
    ...extra,
  });
  const t = (id, characters, textStyle, fill, property, width = 'FILL') => ({
    id,
    type: 'TEXT',
    name: id,
    characters,
    textStyle,
    fill,
    ...(property ? { textProperty: property } : {}),
    layout: { width, height: 'HUG' },
  });
  const toc = {
    id: 'page-bulleted-toc',
    name: 'Mangrove/Page reading/Bulleted TOC',
    kind: 'component-set',
    sourceRef: {
      file: 'stories/Components/TableOfContents/TableOfContents.jsx',
      line: 1,
    },
    review: { genericLabels: false, preserveVariantSizing: true },
    description:
      'Actual unnumbered English report4/article3 links, source title and border. Chromium UA-disc is a measured circle projection, not a typed bullet.',
    coverage: {
      included: [
        'Source page rail and stacked TOC allocations at390/1164',
        'Exact report4/news3 labels',
      ],
      pending: [
        'UA marker native pixels',
        'Arbitrary wrapped/edited labels and counts',
        'Native source scrollspy/anchors/focus/hover',
        'RTL and otherbrowser markers',
      ],
    },
    limitations: [
      source.markerProjection.basis,
      'Source label plain TEXT properties preserve edited content; internal source anchor IDs remain metadata, not invented HTTPS URLs or browser interactions.',
      'All authored preset labels are one line. Marker placement is a bounded first/last coincident baseline observation; arbitrary multiline source labels excluded.',
      'Source initial JSX list plus hydration-created empty list is represented by visible populated list only; no semantic DOM equivalence claimed.',
    ],
    variants: [],
  };
  for (const context of ['report', 'article'])
    for (const viewport of [390, 1164]) {
      const key = `${context}-toc-${viewport}`,
        scene = source.scenes.undrr[key],
        labels = scene.records
          .filter(x => x.tag === 'A')
          .map(x => ({ text: x.text, href: x.href })),
        width = role(
          `toc-${context}-${viewport}-width`,
          'FLOAT',
          m => source.scenes[m.id][key].records[0].width
        );
      const rows = labels.map((a, i) =>
        f(
          `item-${i + 1}`,
          {
            mode: 'VERTICAL',
            width: 'FILL',
            height: 'HUG',
            padding: { block: 'spacing/25', inline: undefined },
            clipsContent: false,
          },
          [
            t(
              `label-${i + 1}`,
              a.text,
              stylesBy.tocLabel,
              'color/interactive',
              `Link${i + 1}`
            ),
            {
              id: `disc-${i + 1}`,
              type: 'ELLIPSE',
              name: 'Observed Chromium UA disc',
              fill: 'color/text',
              layout: { width: markerD, height: markerD },
              absolute: {
                horizontal: 'START',
                vertical: 'START',
                offsetX: markerX,
                offsetY: markerY,
              },
            },
          ],
          { bindings: { paddingLeft: 'spacing/25', paddingRight: zero } }
        )
      );
      for (const row of rows) {
        row.children[0].textDecoration = 'UNDERLINE';
        row.children[0].textDecorationOffset = { unit: 'PERCENT', value: 15 };
      }
      toc.variants.push({
        id: `page-bulleted-toc.${context}-${viewport}`,
        name: `Page=${context}, SourceViewport=${viewport}`,
        properties: { Page: context, SourceViewport: String(viewport) },
        sourceAnchors: labels.map(a => a.href),
        tree: f(
          'toc',
          {
            mode: 'VERTICAL',
            width,
            height: 'HUG',
            gap: 'spacing/100',
            clipsContent: false,
          },
          [
            t(
              'title',
              'On this page',
              stylesBy.tocHeading,
              'color/text',
              'Title'
            ),
            f(
              'list',
              {
                mode: 'VERTICAL',
                width: 'FILL',
                height: 'HUG',
                gap: 'spacing/50',
                clipsContent: false,
              },
              rows,
              {
                bindings: {
                  paddingLeft: 'spacing/200',
                  paddingRight: zero,
                  paddingTop: zero,
                  paddingBottom: zero,
                },
              }
            ),
          ],
          {
            stroke: 'color/neutral-300',
            strokesIncludedInLayout: true,
            bindings: {
              strokeWeight: zero,
              strokeTopWeight: zero,
              strokeRightWeight: zero,
              strokeBottomWeight: zero,
              strokeLeftWeight: border,
              paddingLeft: 'spacing/200',
              paddingRight: zero,
              paddingTop: zero,
              paddingBottom: zero,
            },
          }
        ),
      });
    }
  const quote = {
    id: 'quote-highlight',
    name: 'Mangrove/QuoteHighlight',
    kind: 'component-set',
    sourceRef: {
      file: 'stories/Components/QuoteHighlight/QuoteHighlight.jsx',
      line: 1,
    },
    review: { genericLabels: false, preserveVariantSizing: true },
    description:
      'Actual full line QuoteHighlight source treatments, article cascade, without attribution and source-tested HTML bright composite.',
    coverage: {
      included: [
        'ArticleStory plain light full line at390/1164',
        'Standalone full line Light/Dark/Bright at390/1164',
        'Actual WithoutAttribution full line at390/1164',
        'Exact source-tested quote/em/br/cite, linked author and emphasized title combined under supported bright tone at390/1164',
      ],
      pending: [
        'Source image and portrait specimens/assets',
        'Source floated left/right compositions and RTL',
        'Translucent rich quote paints',
        'Native source typography/shadow/alpha/raster and consumer defaults',
      ],
    },
    limitations: [
      'Native editable TEXT opening mark retains exact source Roboto Bold Italic48 font and signed x0,y-10, no vector outline substitute. Fontmatching remains nativepending.',
      'Page context quote is32px/116% narrow and40px/115% wide from source mg-content blockquote; standalone18px/150%. Opening mark follows context lineheight with fixed source advance19.125.',
      'External full quote margin50px standalone or30px page is metadata, excluded native root footprint. Per-child flex margins become explicit allocations and native text wrapping/height equality remains pending.',
      'Source-test HTML composite is not an authored page/story default. Its cite/em markup is visible text formatting only, no semantic quotation association claimed. Real attribution HTTPS URL retained.',
      'Light quote/translucent paints use plain TEXT. Current rich capability refuses nonopaque role paints; no opaque substitute is used. Native range defaults/inheritance remain open.',
    ],
    variants: [],
  };
  for (const preset of [
    'article-quote',
    'line-light',
    'line-dark',
    'line-bright',
    'no-attribution',
    'source-tested-rich-bright',
  ])
    for (const viewport of [390, 1164]) {
      const key = `${preset}-${viewport}`,
        scene = source.scenes.undrr[key],
        page = preset === 'article-quote',
        rich = preset === 'source-tested-rich-bright',
        tone =
          preset === 'line-dark'
            ? 'dark'
            : preset === 'line-bright' || rich
              ? 'bright'
              : 'light',
        width = role(
          `quote-${preset}-${viewport}-width`,
          'FLOAT',
          m => source.scenes[m.id][key].records[0].width
        ),
        quoteText = page
          ? scene.records.find(x => x.tag === 'P' && !x.cls)?.text
          : rich
            ? 'Risk is a choice,\nnot a fate. World Conference'
            : scene.records.find(x => x.tag === 'P' && !x.cls)?.text,
        name = scene.records.find(
          x => x.cls === 'mg-quote-highlight__attribution-name'
        )?.text,
        title = scene.records.find(
          x => x.cls === 'mg-quote-highlight__attribution-title'
        )?.text,
        qStyle = page
          ? viewport === 390
            ? stylesBy.pageNarrow
            : stylesBy.pageWide
          : stylesBy.quote,
        markStyle = page
          ? viewport === 390
            ? stylesBy.markNarrow
            : stylesBy.markWide
          : stylesBy.mark,
        markHeight = num(
          `mark-height-${preset}-${viewport}`,
          page ? (viewport === 390 ? 55.68 : 55.2) : 72
        ),
        body = t(
          'quote-text',
          quoteText,
          qStyle,
          colors[`${tone}-quote`],
          'Quote'
        );
      body.textWrap = 'BALANCE';
      if (rich) {
        delete body.textStyle;
        delete body.fill;
        delete body.textProperty;
        body.textRuns = [
          {
            id: 'quote-run',
            start: 0,
            end: quoteText.length,
            textStyle: qStyle,
            fill: colors['bright-quote'],
            textDecoration: 'NONE',
          },
        ];
      }
      const glyph = {
        ...t(
          'opening-mark',
          '“',
          markStyle,
          colors[`${tone}-mark`],
          undefined,
          markW
        ),
        layout: { width: markW, height: markHeight },
        bindings: { opacity },
        absolute: {
          horizontal: 'START',
          vertical: 'START',
          offsetX: zero,
          offsetY: markY,
        },
      };
      const quoteBlock = f(
        'quote-block',
        { mode: 'VERTICAL', width: 'FILL', height: 'HUG', clipsContent: false },
        [body, glyph],
        {
          bindings: {
            paddingLeft: 'spacing/400',
            paddingRight: zero,
            paddingTop: zero,
            paddingBottom: page ? zero : 'spacing/300',
          },
        }
      );
      const separator = f(
        'separator-margin',
        { mode: 'VERTICAL', width: 'FILL', height: 'HUG' },
        [
          f('separator', { mode: 'VERTICAL', width: sepW, height: sepH }, [], {
            fill: colors[`${tone}-separator`],
          }),
        ],
        {
          bindings: {
            paddingTop: 'spacing/100',
            paddingBottom: 'spacing/200',
            paddingLeft: zero,
            paddingRight: zero,
          },
        }
      );
      const children = [quoteBlock, separator];
      if (name || title) {
        const attrs = [];
        if (name) {
          const n = t(
            'attribution-name',
            name,
            stylesBy.name,
            colors[`${tone}-attribution`],
            'Attribution'
          );
          if (rich) {
            delete n.textStyle;
            delete n.fill;
            delete n.textProperty;
            n.textRuns = [
              {
                id: 'author-link',
                start: 0,
                end: name.length,
                textStyle: stylesBy.name,
                fill: 'color/interactive',
                textDecoration: 'UNDERLINE',
                hyperlink: { type: 'URL', value: 'https://www.undrr.org/' },
              },
            ];
          }
          attrs.push(n);
        }
        if (title) {
          const n = t(
            'attribution-title',
            title,
            stylesBy.title,
            colors[`${tone}-attribution`],
            'AttributionTitle'
          );
          if (rich) {
            delete n.textStyle;
            delete n.fill;
            delete n.textProperty;
            const split = title.indexOf('Disaster Risk Reduction');
            n.textRuns = [
              {
                id: 'title-start',
                start: 0,
                end: split,
                textStyle: stylesBy.title,
                fill: colors['bright-attribution'],
                textDecoration: 'NONE',
              },
              {
                id: 'title-emphasis',
                start: split,
                end: title.length,
                textStyle: stylesBy.titleItalic,
                fill: colors['bright-attribution'],
                textDecoration: 'NONE',
              },
            ];
          }
          attrs.push(n);
        }
        children.push(
          f(
            'attribution',
            {
              mode: 'VERTICAL',
              width: 'FILL',
              height: 'HUG',
              gap: 'spacing/50',
            },
            attrs,
            {
              bindings: {
                paddingTop: 'spacing/100',
                paddingBottom: zero,
                paddingLeft: zero,
                paddingRight: zero,
              },
            }
          )
        );
      }
      quote.variants.push({
        id: `quote-highlight.${preset}-${viewport}`,
        name: `Preset=${preset}, SourceViewport=${viewport}`,
        properties: { Preset: preset, SourceViewport: String(viewport) },
        sourceExternalMargin: page ? 30 : 50,
        sourceHtmlFixture: rich ? source.richFixture.props : undefined,
        tree: f(
          'quote-root',
          {
            mode: 'VERTICAL',
            width,
            height: 'HUG',
            padding: {
              block: viewport === 390 ? 'spacing/400' : 'spacing/500',
              inline: viewport === 390 ? 'spacing/400' : 'spacing/500',
            },
            gap: zero,
            clipsContent: true,
          },
          children,
          {
            fill: colors[`${tone}-background`],
            stroke: tone === 'bright' ? 'color/neutral-200' : null,
            strokesIncludedInLayout: true,
            bindings: {
              cornerRadius: 'spacing/50',
              strokeWeight:
                tone === 'bright'
                  ? num('bright-border', 1, ['STROKE_FLOAT'])
                  : zero,
            },
            effectStyle: effect,
          }
        ),
      });
    }
  function scopedDefaults(family, fields, context) {
    const allowed = new Set(fields),
      defaults = new Map();
    for (const variant of family.variants) {
      function visit(node) {
        if (allowed.has(node.textProperty))
          node.textProperty =
            family.id + '/' + context(variant) + ' ' + node.textProperty;
        if (node.textProperty) {
          if (
            defaults.has(node.textProperty) &&
            defaults.get(node.textProperty) !== node.characters
          )
            fail(
              'Unscoped differing authored text default ' +
                family.id +
                '/' +
                node.textProperty
            );
          defaults.set(node.textProperty, node.characters);
        }
        for (const child of node.children || []) visit(child);
      }
      visit(variant.tree);
    }
  }
  scopedDefaults(toc, ['Link1', 'Link2', 'Link3'], v => v.properties.Page);
  scopedDefaults(quote, ['Quote', 'Attribution', 'AttributionTitle'], v =>
    v.properties.Preset.startsWith('line-') ? 'line' : v.properties.Preset
  );
  toc.limitations.push(
    'Different report/article link defaults use stable authored context identities. Same source copy across viewport variants shares its default; native state-switch/legacy-property migration and pixels remain separate gates.'
  );
  quote.limitations.push(
    'Plain quote/attribution defaults use stable authored content contexts. Light/Dark/Bright share the same actual source content; article and without-attribution content remain independent. Rich runs remain unexposed and retain their separate formatting contract.'
  );
  return [toc, quote];
}
module.exports = { buildPageReadingRecipes, SOURCE_HASHES };
