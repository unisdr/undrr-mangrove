/** Isolated authored page content slices. Full pages and native acceptance remain open. */
'use strict';
const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');
const SOURCE_HASHES = {
  'examples/figma-plugin/holistic/assets/page-patterns/source-fonts/Roboto-Regular.woff2':
    '47107401d0adb375ab9aa167f9d62489a849d510e740a307b5a4db60e5db3562',
  'examples/figma-plugin/holistic/assets/page-patterns/source-fonts/Roboto-Bold.woff2':
    '8e44376b735dcc9027acbcc8a0df64c3f886a23529eff27b022f344d719e90f2',
  'examples/figma-plugin/holistic/assets/page-patterns/source-fonts/LICENSE-2.0.txt':
    'cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30',
  'stories/assets/scss/_fonts.scss':
    '1c28869b687c358c8c5d28bf5ea563e078b07ee8ae6b3ad5df1244f06fb9d754',
  'stories/assets/fonts/roboto/sass/_variables.scss':
    'ce141aa75263b9b51a301463ddc4ac755458baf84c6636f854852394a6190ea6',
  'stories/assets/fonts/roboto/sass/_mixins.scss':
    'da42b1344b5a5ca7c059c96374b92286381a0a36e2d0ffadefe30683c2e916a7',

  'stories/Patterns/LandingPages/LandingPages.jsx':
    '009599125e725fbda9cd5e640504c63262b1ec29bacc0c07d0eb06f748b37bdc',
  'stories/Patterns/LandingPages/LandingPages.stories.jsx':
    'ca4eac22f176d3d6536778f618752e3d1a00ee08d5be9357be864f6cdbec66a4',
  'stories/Patterns/ArticleStory/ArticleStory.jsx':
    '9ca2a8be73cec051545220f89b88847bda104de21bdac2aacf0265ea3a0b4327',
  'stories/Patterns/ArticleStory/ArticleStory.stories.jsx':
    '28deb53eed4c30ea089f21965a02fb84d69084466135053be0bb1efc887d4937',
  'stories/Patterns/_shared/pattern-demo.scss':
    'd99057b1f5bb32dfb55fe08f4fb22a56b59b9384ebe3709213c4543ad82d793d',
  'stories/Patterns/_shared/UndrrChrome.jsx':
    '2ad9ca0eb356dedd24b2fb7e667d24940281dd9d3f551a6eaa558756219266b5',
  'stories/Utilities/PagePatterns/page-patterns.scss':
    '54998879cf42ded7facf2a46fd41312f9540df1cc652792d1b41bcde40750be6',
  'stories/Atom/Layout/Container/container.scss':
    'f62790c55115a47c9291ee2ba3f62b717bf00a698407529e64ffcd97a58af118',
  'stories/Atom/Layout/Grid/grid.scss':
    '2a43bce37aac655ddbd3071a53fdcfd3e8695ca37abce98cad374f1f4098ae9e',
  'stories/assets/scss/_foundational.scss':
    '89f40e9172074d84f101aa6a9d6a048aa6177a67781b8fb672cb4a4c44adbcdf',
  'stories/assets/scss/_variables.scss':
    '2c9ce7c4b18d63243e45ad2eaed07c9a6284c0e57ef79a3dc3d37f8521cccdfa',
  'stories/assets/scss/_mixins.scss':
    '0028b614bb410bd03e6bc6a81e2b42b0daea54a5f6193eca6b7a1130617b9a35',
  'stories/Utilities/Normalize/normalize.scss':
    'b74d9ace846077ecd6ad39e618f4a90ecde78dab80713b00315caba55cd76795',
  '.storybook/preview.js':
    'e19af50151293071b3f87910cded15f2cb7835dbffd125085f3708a257221814',
  'stories/assets/fonts/roboto/sass/_Regular.scss':
    'cb27bc0dd02ba21b4dda3249a59e352e0a42c5ea45b83d7cba0a1a2cb79f5845',
  'stories/assets/fonts/roboto/sass/_Bold.scss':
    '9f24cf0a077b2087c47c55bbb665a4086a38818680eee9ca0dfac4c0ce0d273e',
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
  'examples/figma-plugin/holistic/assets/page-patterns/authored-content.json':
    'a7d77c16543304e12d9394825f67f83315ece31adea104f19826d216cf942128',
};
function buildPagePatternRecipes({ root, modes, variables, styles }) {
  const fail = m => {
    throw new Error(`Figma page pattern recipe needs updating: ${m}`);
  };
  for (const [file, expected] of Object.entries(SOURCE_HASHES))
    if (
      crypto
        .createHash('sha256')
        .update(fs.readFileSync(path.join(root, file)))
        .digest('hex') !== expected
    )
      fail(`${file} source contract changed`);
  if (
    modes
      .map(m => m.id)
      .sort()
      .join(',') !== 'delta,irp,mcr,preventionweb,undrr'
  )
    fail('Expected five source modes');
  const authored = JSON.parse(
    fs.readFileSync(
      path.join(
        root,
        'examples/figma-plugin/holistic/assets/page-patterns/authored-content.json'
      ),
      'utf8'
    )
  );
  for (const node of authored.sourceDependencyGraph)
    if (
      crypto
        .createHash('sha256')
        .update(fs.readFileSync(path.join(root, node.source)))
        .digest('hex') !== node.sourceSha256
    )
      fail(`${node.source} dependency graph source changed`);
  const byName = new Map(variables.map(v => [v.name, v]));
  const value = (name, mode, type, seen = new Set()) => {
    const v = byName.get(name);
    if (!v || v.type !== type || seen.has(name))
      fail(`Missing/wrong/circular ${name}`);
    seen.add(name);
    const x = v.values[mode.id];
    if (x == null) fail(`Missing ${name}/${mode.id}`);
    return x.alias ? value(x.alias, mode, type, seen) : x;
  };
  const perMode = fn => Object.fromEntries(modes.map(m => [m.id, fn(m)]));
  function upsert(a, e) {
    const matches = a.filter(x => x.id === e.id || x.name === e.name);
    if (
      matches.length > 1 ||
      (matches.length && (matches[0].id !== e.id || matches[0].name !== e.name))
    )
      fail(`Foreign identity ${e.id}`);
    const i = a.findIndex(x => x.id === e.id);
    if (i < 0) a.push(e);
    else a[i] = e;
  }
  for (const m of modes) {
    if (value('font-family/text', m, 'STRING') !== 'Roboto')
      fail(`Unverified Latin text face ${m.id}`);
    for (const [n, x] of [
      ['spacing/100', 10],
      ['spacing/300', 30],
      ['font-size/300', 16],
      ['font-size/500', 23],
    ])
      if (value(n, m, 'FLOAT') !== x)
        fail(`Measured source allocation changed ${n}/${m.id}`);
    for (const n of ['color/text', 'color/interactive']) {
      const v = value(n, m, 'COLOR');
      if (v.a !== undefined && v.a !== 1) fail(`Nonopaque source role ${n}`);
    }
  }
  const sourceRef = {
    file: 'stories/Utilities/PagePatterns/page-patterns.scss',
    line: 21,
  };
  const paragraphMargin = 'component/page-pattern/paragraph-margin';
  upsert(variables, {
    id: paragraphMargin.replaceAll('/', '.'),
    name: paragraphMargin,
    type: 'FLOAT',
    values: perMode(() => 16),
    scopes: ['GAP'],
    sourceRef,
    description:
      'Source UA paragraph block-end 1em at observed 16px body. Explicit finite Latin fixture.',
    hiddenFromPublishing: false,
    codeSyntax: {},
  });
  for (const [name, size, weight, lh, wrap] of [
    ['heading', '500', 700, 110, 'BALANCE'],
    ['body', '300', 400, 150, 'AUTO'],
    ['link', '300', 400, 150, 'AUTO'],
  ])
    upsert(styles.text, {
      id: `component.page-pattern.${name}`,
      name: `Mangrove/component/page-pattern/${name}`,
      component: true,
      recommended: false,
      source: sourceRef,
      description:
        'Exact authored Latin reading typography. Native font/rendering acceptance open.',
      bindings: {
        fontFamily: 'font-family/text',
        fontSize: `font-size/${size}`,
      },
      values: perMode(m => ({
        fontName: {
          family: value('font-family/text', m, 'STRING'),
          style: weight === 700 ? 'Bold' : 'Regular',
        },
        fontSize: value(`font-size/${size}`, m, 'FLOAT'),
        lineHeight: { unit: 'PERCENT', value: lh },
        textWrapStyle: wrap,
      })),
    });
  const frame = (id, layout, children) => ({
    id,
    type: 'FRAME',
    name: id,
    fill: null,
    layout,
    children,
  });
  const ids = {
    report: 'landing-report-article-column',
    article: 'news-detail-article-column',
  };
  return Object.entries(authored.pages).map(([kind, page]) => {
    const family = {
      id: ids[kind],
      name:
        kind === 'report'
          ? 'Mangrove/Page patterns/Landing report article column'
          : 'Mangrove/Page patterns/News detail article column',
      kind: 'component-set',
      sourceRef: { file: page.source, line: 1 },
      description:
        'Actual authored English section/paragraph composition with stable anatomy and real HTTPS prose links. Explicit partial page content slice, not a full page.',
      review: { genericLabels: false, preserveVariantSizing: true },
      coverage: {
        status: 'partial-source-page',
        included:
          kind === 'report'
            ? [
                'Four authored report reading sections',
                'Real final GAR link',
                'Source 390/1164 viewport article allocations',
              ]
            : [
                'Three authored news-detail prose sections',
                'Nine source paragraphs and real inline links',
                'Source 390/1164 viewport article allocations',
              ],
        pending:
          kind === 'report'
            ? [
                'Source site chrome',
                'Inline page breadcrumb',
                'Full-width report feature band',
                'Four-link bulleted TOC rail',
                'Arabic/RTL and intermediate breakpoints',
              ]
            : [
                'Source site chrome',
                'Article intro/metadata/header image treatments',
                'ShareButtons and three-link bulleted TOC rail',
                'First-section QuoteHighlight',
                'Floated rich HighlightBox after second section',
                'Live iframe media in EmbedContainer',
                'Related image cards, recommendations and linked taxonomy',
                'Rich UserFeedback confirmation',
                'Arabic/RTL and intermediate breakpoints',
              ],
      },
      dependencies: {
        actualDirectSourceModules:
          kind === 'report'
            ? [
                'UndrrChrome',
                'SkipLink',
                'Hero',
                'VerticalCard',
                'IconCard',
                'BookCard',
                'TableOfContents',
                'TextCta',
              ]
            : [
                'VerticalCard',
                'Hero',
                'TableOfContents',
                'ShareButtons',
                'UserFeedback',
                'Imagecaption',
                'HighlightBox',
                'QuoteHighlight',
                'EmbedContainer',
                'UndrrChrome',
                'SkipLink',
              ],
        availableReusableFamilyIds:
          kind === 'report'
            ? [
                'hero-background',
                'hero-split',
                'card-vertical',
                'icon-card',
                'book-card',
                'text-cta',
                'toc-link',
                'table-of-contents',
                'skip-link',
              ]
            : [
                'hero-background',
                'hero-split',
                'card-vertical',
                'toc-link',
                'table-of-contents',
                'user-feedback',
                'image-caption',
                'highlight-box',
                'embed-container',
                'skip-link',
              ],
        nativeInstancesUsed: [],
        sourceDependencyGraph: authored.sourceDependencyGraph,
        reuseBoundary:
          'No existing family matches these arbitrary source rich paragraphs or source h2/block-collapse composition. No numbered TOC, standalone breadcrumb, plain HighlightBox, or blank media substitute is inserted. Available IDs are dependency references, not claims of full source contract equivalence.',
      },
      limitations: [
        'Scoped Chromium source observed at five themes and eight viewport boundaries; only390/1164 allocation presets emitted. Native, other browser engines and exact font pixels remain open.',
        'Fixed width helpers preserve observed Storybook source cascade. At390 UNDRR report/article columns350/330px, other themes370/350px; at1164 all themes736/722px. Theme stylesheet ordering affects narrow demo-shell padding, so these are recorded finite fixtures, not universal site widths.',
        'CSS margin collapse is projected as explicit10px top,30px section gap/bottom and16px paragraph gap. Arbitrary edits/wrapping may alter native geometry; source height equality is not claimed.',
        'News detail intentionally omits authored enhancements rather than allocating blank substitutes. Its compacted prose-only flow is a source content slice, not pixel equality to the complete source article.',
        'Direct formatted rich TEXT edits are retained in the mock. Native shared-style/range-default editing and consumer inheritance remain open; rich text is not exposed as a whole-string component property.',
        'Source scrollspy, anchors, browser navigation, sticky rail, responsive reflow and semantic HTML are not Figma interactions. Real HTTPS links are represented only by the bounded rich run contract.',
      ],
      variants: [],
    };
    for (const viewport of [390, 1164]) {
      const width = `component/page-pattern/${kind}-width-${viewport}`;
      upsert(variables, {
        id: width.replaceAll('/', '.'),
        name: width,
        type: 'FLOAT',
        values: perMode(m => page.widthByViewport[String(viewport)][m.id]),
        scopes: ['WIDTH_HEIGHT'],
        sourceRef,
        description:
          'Measured actual source article allocation at explicit viewport, including source theme cascade.',
        hiddenFromPublishing: false,
        codeSyntax: {},
      });
      const sections = page.sections.map((s, si) =>
        frame(
          s.id,
          {
            mode: 'VERTICAL',
            width: 'FILL',
            height: 'HUG',
            gap: 'spacing/100',
            clipsContent: false,
          },
          [
            {
              id: `${s.id}-heading`,
              type: 'TEXT',
              name: 'Source section heading',
              characters: s.heading,
              textProperty: `Section${si + 1}Heading`,
              textStyle: 'component.page-pattern.heading',
              fill: 'color/text',
              textWrap: 'BALANCE',
              layout: { width: 'FILL', height: 'HUG' },
            },
            frame(
              `${s.id}-paragraphs`,
              {
                mode: 'VERTICAL',
                width: 'FILL',
                height: 'HUG',
                gap: paragraphMargin,
                clipsContent: false,
              },
              s.paragraphs.map(p => {
                const isRich = p.runs.some(x => x.linked);
                if (!isRich)
                  return {
                    id: `${s.id}-${p.id}`,
                    type: 'TEXT',
                    name: 'Source prose paragraph',
                    characters: p.characters,
                    textProperty: `Section${si + 1}${p.id.replace('paragraph-', 'Paragraph')}`,
                    textStyle: 'component.page-pattern.body',
                    fill: 'color/text',
                    textWrap: 'AUTO',
                    layout: { width: 'FILL', height: 'HUG' },
                  };
                let offset = 0;
                return {
                  id: `${s.id}-${p.id}`,
                  type: 'TEXT',
                  name: 'Source linked prose paragraph',
                  characters: p.characters,
                  textRuns: p.runs.map((r, i) => {
                    const start = offset;
                    offset += r.text.length;
                    return {
                      id: `run-${i + 1}`,
                      start,
                      end: offset,
                      textStyle: `component.page-pattern.${r.linked ? 'link' : 'body'}`,
                      fill: r.linked ? 'color/interactive' : 'color/text',
                      ...(r.linked
                        ? {
                            hyperlink: { type: 'URL', value: r.href },
                            textDecoration: 'UNDERLINE',
                          }
                        : { textDecoration: 'NONE' }),
                    };
                  }),
                  textWrap: 'AUTO',
                  layout: { width: 'FILL', height: 'HUG' },
                };
              })
            ),
          ]
        )
      );
      family.variants.push({
        id: `${family.id}.viewport-${viewport}`,
        name: `SourceViewport=${viewport}, Locale=English`,
        properties: { SourceViewport: String(viewport), Locale: 'English' },
        tree: frame(
          'article-column',
          {
            mode: 'VERTICAL',
            width,
            height: 'HUG',
            gap: 'spacing/300',
            clipsContent: false,
          },
          sections
        ),
      });
      family.variants.at(-1).tree.bindings = {
        paddingTop: 'spacing/100',
        paddingBottom: 'spacing/300',
        paddingLeft: 'spacing/0',
        paddingRight: 'spacing/0',
      };
    }
    return family;
  });
}
module.exports = { buildPagePatternRecipes, SOURCE_HASHES };
