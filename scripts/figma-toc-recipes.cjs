/** Source-owned, finite Latin TOC links and numbered compositions. */
'use strict';
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

function buildTocRecipes({ root, modes, variables, styles }) {
  const scss = 'stories/Components/TableOfContents/table-of-contents.scss';
  const jsx = 'stories/Components/TableOfContents/TableOfContents.jsx';
  const story =
    'stories/Components/TableOfContents/TableOfContents.stories.jsx';
  const foundation = 'stories/assets/scss/_foundational.scss';
  const script = 'stories/assets/js/table-of-contents.js';
  const cache = new Map();
  const read = file => {
    if (!cache.has(file))
      cache.set(file, fs.readFileSync(path.join(root, file), 'utf8'));
    return cache.get(file);
  };
  const fail = message => {
    throw new Error(`Figma TOC recipe needs updating: ${message}`);
  };
  const source = (file, pattern) => {
    const match = pattern.exec(read(file));
    if (!match) fail(`${file} no longer matches ${pattern}`);
    return { file, line: read(file).slice(0, match.index).split('\n').length };
  };
  const clean = text => text.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '');
  const expectedScss = `.mg-table-of-contents {
    padding-inline-start: var(--mg-spacing-200);
    border-inline-start: 2px solid rgb(var(--mg-color-neutral-300));
    color: rgb(var(--mg-color-text));
    > h2 { margin-block: 0 var(--mg-spacing-100); font-size: var(--mg-font-size-400); }
    ul, ol { margin-block: 0; padding-inline-start: var(--mg-spacing-200); }
    li { margin-block: var(--mg-spacing-50); padding-inline-start: var(--mg-spacing-25); overflow-wrap: anywhere; }
    a {
      display: inline-block; padding-block: var(--mg-spacing-25);
      color: rgb(var(--mg-color-interactive)); text-decoration: underline;
      text-underline-offset: 0.15em; line-height: 1.5;
      &:hover { color: rgb(var(--mg-color-interactive-active)); }
      &:focus-visible { @include mg-focus-ring; }
    }
  }`;
  const compact = text => clean(text).replace(/\s+/g, '');
  if (compact(read(scss)) !== compact(expectedScss))
    fail('TOC layout, states or paint changed');
  source(jsx, /showNumbers = false,\s*title = 'On this page'/);
  source(jsx, /const ListComponent = showNumbers \? 'ol' : 'ul';/);
  source(jsx, /mgTableOfContents\(contentRef\.current, tocRef\.current\);/);
  source(
    jsx,
    /<ListComponent>\s*\{tocData\.map\(\(item, index\) => \(\s*<li key=\{index\}>\s*<a\s*href=\{`#\$\{item\.id\}`\}\s*onClick=\{e => handleAnchorClick\(e, item\.id\)\}\s*>\s*\{item\.text\}\s*<\/a>\s*<\/li>\s*\)\)\}\s*<\/ListComponent>/
  );
  source(
    'stories/Components/TableOfContents/js/TableOfContentsVanillaJs.js',
    /export\s*{\s*mgTableOfContents,\s*mgTableOfContentsInit,\s*}\s*from '\.\.\/\.\.\/\.\.\/assets\/js\/table-of-contents\.js';/
  );
  source(script, /document\.createElement\('h2'\)/);
  source(script, /tocElement\.prepend\(tocHeader\);/);
  source(script, /contentElement\.querySelectorAll\('h2'\)/);
  source(script, /if \(heading\.id === 'on-this-page'\) return;/);
  source(
    script,
    /if \(heading\.classList\.contains\('mg-table-of-contents--exclude'\)\) return;/
  );
  source(
    script,
    /if \(heading\.classList\.contains\('mg-u-sr-only'\)\) return;/
  );
  source(
    foundation,
    /box-sizing:\s*border-box;\s*overflow-wrap:\s*break-word;/
  );
  source(
    foundation,
    /body\s*{\s*color:\s*rgb\(var\(--mg-color-text\)\);\s*font-family:\s*var\(--mg-font-family-text\);\s*font-size:\s*var\(--mg-font-size-300\);\s*line-height:\s*var\(--mg-font-line-height-700\);/
  );
  source(
    foundation,
    /h2\s*{\s*font-size:\s*var\(--mg-font-size-500\);\s*font-weight:\s*700;\s*line-height:\s*1\.1;/
  );
  source(
    foundation,
    /caption\s*{\s*margin:\s*var\(--mg-spacing-100\) var\(--mg-spacing-0\);\s*padding:\s*var\(--mg-spacing-0\);\s*text-wrap:\s*balance;/
  );
  source(
    'stories/assets/scss/_mixins.scss',
    /box-shadow:\s*0 0 0 var\(--mg-focus-ring-offset\) rgb\(var\(--mg-color-neutral-0\)\);\s*outline:\s*var\(--mg-focus-ring-width\) solid rgb\(var\(--mg-color-focus-ring\)\);\s*outline-offset:\s*var\(--mg-focus-ring-offset\);/
  );
  for (const [file, weight] of [
    ['Regular', 400],
    ['Bold', 700],
  ])
    source(
      `stories/assets/fonts/roboto/sass/_${file}.scss`,
      new RegExp(
        `font-family:\\s*Roboto;[\\s\\S]*?font-weight:\\s*${weight};\\s*font-style:\\s*normal;`
      )
    );
  if (
    YAML.parse(read('tokens/mangrove.yaml'))['font-line-height']?.['700']
      ?.$value !== '1.5em'
  )
    fail('Body/marker inherited line height changed');

  // Extract the actual English fixture; exact inventory guards make changes reviewable.
  const english =
    /default:\s*return\s*{\s*title:\s*'([^']+)',\s*tocData:\s*\[([\s\S]*?)\],\s*};/.exec(
      read(story)
    );
  if (!english) fail('Missing English story data');
  const entries = [
    ...english[2].matchAll(/\{\s*id:\s*'([^']+)',\s*text:\s*'([^']+)',?\s*}/g),
  ].map(m => ({ id: m[1], text: m[2] }));
  const expected = [
    'What is the Global Platform for Disaster Risk Reduction?',
    'Who organizes the Global Platform for DRR?',
    'What are the objectives of the Global Platform for DRR?',
    'How does the Global Platform for DRR link to the Sustainable Development Goals and the Paris Agreement?',
    'What are the linkages between the Global Platform and the Regional Platforms?',
    'What is the Sendai Framework for DRR?',
  ];
  if (
    english[1] !== 'On this page' ||
    JSON.stringify(entries.map(e => e.text)) !== JSON.stringify(expected) ||
    entries.some((e, i) => e.id !== `section-${i + 1}`)
  )
    fail('English title or six-link story changed');
  source(story, /export const Numbered = {\s*args: {\s*showNumbers: true,/);

  const byName = new Map(variables.map(v => [v.name, v]));
  function value(name, mode, seen = new Set()) {
    if (seen.has(name)) fail(`Circular variable ${name}`);
    seen.add(name);
    const v = byName.get(name)?.values[mode.id];
    if (v == null) fail(`Missing variable ${name}/${mode.id}`);
    return v.alias ? value(v.alias, mode, seen) : v;
  }
  for (const [name, type] of [
    ...['font-family/text'].map(n => [n, 'STRING']),
    ...[
      'font-size/300',
      'font-size/400',
      'spacing/0',
      'spacing/25',
      'spacing/50',
      'spacing/100',
      'spacing/200',
      'focus-ring/offset',
      'focus-ring/width',
    ].map(n => [n, 'FLOAT']),
    ...[
      'color/text',
      'color/neutral-300',
      'color/interactive',
      'color/interactive-active',
      'color/neutral-0',
      'color/focus-ring',
    ].map(n => [n, 'COLOR']),
  ])
    if (byName.get(name)?.type !== type)
      fail(`Missing or wrong source role ${name}`);
  for (const mode of modes) {
    for (const [name, expectedValue] of [
      ['font-family/text', 'Roboto'],
      ['font-size/300', 16],
      ['font-size/400', 18],
      ['spacing/0', 0],
      ['spacing/25', 2.5],
      ['spacing/50', 5],
      ['spacing/100', 10],
      ['spacing/200', 20],
    ])
      if (value(name, mode) !== expectedValue)
        fail(`Measured Latin source role ${name} differs in ${mode.id}`);
  }
  const perMode = get =>
    Object.fromEntries(modes.map(mode => [mode.id, get(mode)]));
  const ref = source(scss, /\.mg-table-of-contents\s*{/);
  function helper(role, get, description, code) {
    const name = `component/table-of-contents/${role}`;
    const definition = {
      id: name.replaceAll('/', '.'),
      name,
      type: 'FLOAT',
      scopes: ['WIDTH_HEIGHT'],
      hiddenFromPublishing: false,
      source: ref,
      description,
      codeSyntax: code ? { WEB: code } : {},
      values: perMode(get),
    };
    if (
      Object.values(definition.values).some(v => !Number.isFinite(v) || v < 0)
    )
      fail(`Invalid derived helper ${name}`);
    const old = byName.get(name);
    if (old && old.type !== 'FLOAT') fail(`Wrong helper type ${name}`);
    const i = variables.findIndex(v => v.name === name);
    if (i < 0) variables.push(definition);
    else variables[i] = definition;
    byName.set(name, definition);
    return name;
  }
  const border = helper(
    'border-width',
    () => 2,
    'Authored 2px inline-start border.',
    '2px'
  );
  byName.get(border).scopes = ['STROKE_FLOAT'];
  const widths = [240, 390, 900];
  const caps = new Map();
  for (const width of widths) {
    const cap = helper(
      `link-cap-${width}`,
      mode =>
        width -
        value(border, mode) -
        2 * value('spacing/200', mode) -
        value('spacing/25', mode),
      `Link cap in an explicit ${width}px consumer, derived from border 2px, root padding 20px, marker allocation 20px and leading 2.5px. Ordinary Latin labels containing spaces only. The native sizing diagnostic confirmed a HUG FRAME cap with FILL/HEIGHT TEXT at 195.5/345.5/855.5px; source unbroken-word overflow is unsupported.`,
      `calc(${width}px - 2px - 2 * var(--mg-spacing-200) - var(--mg-spacing-25))`
    );
    caps.set(width, { cap });
  }
  function textStyle(id, name, fontRole, fontStyle, height, decoration, wrap) {
    const definition = {
      id,
      name: `Mangrove/Component/Table of contents/${name}`,
      recommended: false,
      source: ref,
      description:
        'Source Latin typography. Font file equivalence and edited consumer rasterisation require native/source acceptance.',
      bindings: { fontFamily: 'font-family/text', fontSize: fontRole },
      values: perMode(mode => ({
        fontName: { family: value('font-family/text', mode), style: fontStyle },
        fontSize: value(fontRole, mode),
        lineHeight: { unit: 'PERCENT', value: height },
        textDecoration: decoration,
        textWrapStyle: wrap,
      })),
    };
    const i = styles.text.findIndex(s => s.id === id);
    if (i < 0) styles.text.push(definition);
    else styles.text[i] = definition;
    return id;
  }
  const linkStyle = textStyle(
    'component.table-of-contents.link',
    'Link',
    'font-size/300',
    'Regular',
    150,
    'UNDERLINE',
    'AUTO'
  );
  const titleStyle = textStyle(
    'component.table-of-contents.title',
    'Title',
    'font-size/400',
    'Bold',
    110,
    'NONE',
    'BALANCE'
  );
  const markerStyle = textStyle(
    'component.table-of-contents.marker',
    'Decimal marker',
    'font-size/300',
    'Regular',
    150,
    'NONE',
    'AUTO'
  );
  const limitations =
    'Explicit measured Latin labels containing spaces only. The native sizing probe preserved edited Label and IDs through a master cap rewrite, with a short label at 68x29px and first-link heights 77/53/29px. The native wide first link is 400px versus 398.8125px in the browser; font file and pixel equality remain unverified. Unbroken labels wrap in native FILL text while CSS overflows; unsupported here. Live caps relative to consumer width, arbitrary widths, RTL/non-Latin, source scroll/history/focus behaviour, scraped article/title-hidden mode and appearance across all brands are pending.';
  const links = {
    id: 'toc-link',
    name: 'Mangrove/Table of contents / Link',
    kind: 'component-set',
    source: source(scss, /  a\s*{/),
    description: `Reusable source inline-block link with 4 states and 3 explicit caps. Required imported typography template is applied directly with font role bindings, preserving Label keys while avoiding native shared-style range-paint coupling. Canonical repeat/edited-consumer acceptance remains pending. Node PERCENT15 underline offset. ${limitations}`,
    variants: [],
    review: { genericLabels: false, preserveVariantSizing: true, width: 900 },
  };
  for (const width of widths)
    for (const State of ['Default', 'Hover', 'Focus', 'HoverFocus']) {
      const focus = State.includes('Focus'),
        hover = State.includes('Hover');
      links.variants.push({
        id: `toc-link.${width}.${State.toLowerCase()}`,
        name: `MeasuredWidth=${width}, State=${State}`,
        properties: { MeasuredWidth: String(width), State },
        tree: {
          id: 'link',
          type: 'FRAME',
          name: 'mg-table-of-contents / a',
          fill: null,
          stroke: null,
          layout: {
            mode: 'VERTICAL',
            width: 'HUG',
            height: 'HUG',
            maxWidth: caps.get(width).cap,
            gap: 'spacing/0',
            padding: { block: 'spacing/25', inline: 'spacing/0' },
            clipsContent: false,
          },
          ...(focus
            ? {
                focusRing: {
                  color: 'color/focus-ring',
                  separatorColor: 'color/neutral-0',
                  offset: 'focus-ring/offset',
                  width: 'focus-ring/width',
                  radius: 'spacing/0',
                  outerRadius: 'spacing/0',
                },
              }
            : {}),
          children: [
            {
              id: 'label',
              type: 'TEXT',
              name: 'Link label',
              characters: entries[0].text,
              textProperty: 'Label',
              textStyle: linkStyle,
              textStyleApplication: 'DIRECT',
              fill: hover ? 'color/interactive-active' : 'color/interactive',
              stroke: null,
              textDecoration: 'UNDERLINE',
              textDecorationOffset: { unit: 'PERCENT', value: 15 },
              textWrap: 'AUTO',
              layout: { width: 'FILL', height: 'HUG' },
            },
          ],
        },
      });
    }
  const toc = {
    id: 'table-of-contents',
    name: 'Mangrove/Table of contents / Numbered',
    kind: 'component-set',
    source: source(jsx, /export default function TableOfContents/),
    description: `Initial numbered English story composition: required editable Title and 6 exposed native Link labels. Marker allocation 20px, leading 2.5px and a bottom-aligned 24px decimal marker with 2.5px bottom padding represent the measured last-line baseline. Numeric marker glyph/baseline pixels remain pending native/source comparison. Bulleted source UA-disc representation is pending; no typed-bullet substitute. No invented nesting/current/disabled states. ${limitations}`,
    coverage: {
      included: ['Numbered English story at 240/390/900px'],
      pending: [
        'Bulleted source UA disc glyph',
        'Marker raster/baseline comparison',
        'Unbroken-word source overflow',
      ],
    },
    variants: [],
    review: { genericLabels: false, preserveVariantSizing: true },
  };
  for (const width of widths)
    toc.variants.push({
      id: `table-of-contents.numbered.${width}`,
      name: `ListStyle=Numbered, MeasuredWidth=${width}`,
      properties: { ListStyle: 'Numbered', MeasuredWidth: String(width) },
      tree: {
        id: 'toc',
        type: 'FRAME',
        name: 'mg-table-of-contents',
        fill: null,
        stroke: 'color/neutral-300',
        strokesIncludedInLayout: true,
        bindings: {
          strokeWeight: 'spacing/0',
          strokeTopWeight: 'spacing/0',
          strokeRightWeight: 'spacing/0',
          strokeBottomWeight: 'spacing/0',
          strokeLeftWeight: border,
          paddingLeft: 'spacing/200',
          paddingRight: 'spacing/0',
          paddingTop: 'spacing/0',
          paddingBottom: 'spacing/0',
        },
        layout: {
          mode: 'VERTICAL',
          width,
          height: 'HUG',
          gap: 'spacing/100',
          clipsContent: false,
        },
        children: [
          {
            id: 'title',
            type: 'TEXT',
            name: 'On this page heading',
            characters: english[1],
            textProperty: 'Title',
            textStyle: titleStyle,
            fill: 'color/text',
            stroke: null,
            textDecoration: 'NONE',
            textWrap: 'BALANCE',
            layout: { width: 'FILL', height: 'HUG' },
          },
          {
            id: 'list',
            type: 'FRAME',
            name: 'ol / six source links',
            fill: null,
            stroke: null,
            layout: {
              mode: 'VERTICAL',
              width: 'FILL',
              height: 'HUG',
              gap: 'spacing/50',
              clipsContent: false,
            },
            children: entries.map((entry, i) => ({
              id: `item-${i + 1}`,
              type: 'FRAME',
              name: `li / ${entry.id}`,
              fill: null,
              stroke: null,
              layout: {
                mode: 'HORIZONTAL',
                width: 'FILL',
                height: 'HUG',
                gap: 'spacing/25',
                align: 'MAX',
                clipsContent: false,
              },
              children: [
                {
                  id: `marker-${i + 1}`,
                  type: 'FRAME',
                  name: 'Decimal marker / last line',
                  fill: null,
                  stroke: null,
                  bindings: { paddingBottom: 'spacing/25' },
                  layout: {
                    mode: 'VERTICAL',
                    width: 'spacing/200',
                    height: 'HUG',
                    clipsContent: false,
                  },
                  children: [
                    {
                      id: `number-${i + 1}`,
                      type: 'TEXT',
                      name: `Source ordered marker ${i + 1}`,
                      characters: `${i + 1}.`,
                      textStyle: markerStyle,
                      fill: 'color/text',
                      stroke: null,
                      textAlign: 'RIGHT',
                      textDecoration: 'NONE',
                      textWrap: 'AUTO',
                      layout: { width: 'FILL', height: 'HUG' },
                    },
                  ],
                },
                {
                  id: `link-${i + 1}`,
                  type: 'INSTANCE',
                  name: `Link ${i + 1}`,
                  family: 'toc-link',
                  expose: true,
                  variant: { MeasuredWidth: String(width), State: 'Default' },
                  overrides: { Label: entry.text },
                  layout: { width: 'HUG', height: 'HUG' },
                  sourceAnchor: `#${entry.id}`,
                },
              ],
            })),
          },
        ],
      },
    });
  return [links, toc];
}
module.exports = { buildTocRecipes };
