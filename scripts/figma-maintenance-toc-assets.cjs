/** Source-owned, finite Latin TOC links and numbered compositions. */
'use strict';

const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
function buildTocAssets({ root, modes, variables, styles }) {
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
    return {
      file,
      line: read(file).slice(0, match.index).split('\n').length,
    };
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
  const english =
    /default:\s*return\s*{\s*title:\s*'([^']+)',\s*tocData:\s*\[([\s\S]*?)\],\s*};/.exec(
      read(story)
    );
  if (!english) fail('Missing English story data');
  const entries = [
    ...english[2].matchAll(/\{\s*id:\s*'([^']+)',\s*text:\s*'([^']+)',?\s*}/g),
  ].map(m => ({
    id: m[1],
    text: m[2],
  }));
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
      codeSyntax: code
        ? {
            WEB: code,
          }
        : {},
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
    caps.set(width, {
      cap,
    });
  }
  function textStyle(id, name, fontRole, fontStyle, height, decoration, wrap) {
    const definition = {
      id,
      name: `Mangrove/Component/Table of contents/${name}`,
      recommended: false,
      source: ref,
      description:
        'Source Latin typography. Font file equivalence and edited consumer rasterisation require native/source acceptance.',
      bindings: {
        fontFamily: 'font-family/text',
        fontSize: fontRole,
      },
      values: perMode(mode => ({
        fontName: {
          family: value('font-family/text', mode),
          style: fontStyle,
        },
        fontSize: value(fontRole, mode),
        lineHeight: {
          unit: 'PERCENT',
          value: height,
        },
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
  return {
    scss,
    jsx,
    story,
    foundation,
    script,
    cache,
    read,
    fail,
    source,
    clean,
    expectedScss,
    compact,
    english,
    entries,
    expected,
    byName,
    value,
    perMode,
    ref,
    helper,
    border,
    widths,
    caps,
    textStyle,
    linkStyle,
    titleStyle,
    markerStyle,
  };
}
module.exports = {
  buildTocAssets,
};
