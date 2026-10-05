/** Source-owned, bounded FormErrorSummary recipes. Browser evidence is not native acceptance. */
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
function buildFormSummaryAssets({ root, modes, variables, styles }) {
  const files = new Map();
  const read = file => {
    if (!files.has(file))
      files.set(file, fs.readFileSync(path.join(root, file), 'utf8'));
    return files.get(file);
  };
  const form = 'stories/Components/Forms/_form-base.scss';
  const jsx = 'stories/Components/Forms/FormErrorSummary/FormErrorSummary.jsx';
  const foundation = 'stories/assets/scss/_foundational.scss';
  const mixins = 'stories/assets/scss/_mixins.scss';
  const fail = message => {
    throw new Error(`Figma FormErrorSummary recipe needs updating: ${message}`);
  };
  const source = (file, pattern) => {
    const match = pattern.exec(read(file));
    if (!match) fail(`${file} no longer matches ${pattern}`);
    return {
      file,
      line: read(file).slice(0, match.index).split('\n').length,
    };
  };
  function block(file, selector) {
    const text = read(file).replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '');
    const start = text.indexOf(selector),
      open = text.indexOf('{', start);
    if (start < 0 || open < 0) fail(`Missing ${selector} in ${file}`);
    let depth = 1,
      end = open + 1;
    for (; end < text.length && depth; end++) {
      if (text[end] === '{') depth++;
      if (text[end] === '}') depth--;
    }
    if (depth) fail(`Unbalanced ${selector} in ${file}`);
    return text.slice(open + 1, end - 1);
  }
  const guard = (text, pattern, message) => {
    if (!pattern.test(text)) fail(message);
  };
  const summary = block(form, '.mg-form-error-summary {');
  const base = summary.slice(0, summary.indexOf('&:focus'));
  guard(
    base,
    /background-color:\s*rgb\(var\(--mg-color-red-50\)\);/,
    'Summary background changed'
  );
  guard(
    base,
    /border-inline-start:\s*4px solid rgb\(var\(--mg-color-red-900\)\);/,
    'Summary accent boundary changed'
  );
  guard(
    base,
    /margin-bottom:\s*var\(--mg-spacing-200\);/,
    'External summary spacing changed'
  );
  guard(base, /padding:\s*var\(--mg-spacing-150\);/, 'Summary padding changed');
  guard(base, /^(?![\s\S]*border-radius:)/, 'Summary is no longer square');
  guard(
    summary,
    /&:focus\s*\{\s*@include mg-focus-ring;\s*\}/,
    'Root focus changed'
  );
  const title = block(form, '&__title {');
  guard(
    title,
    /color:\s*rgb\(var\(--mg-color-red-900\)\);/,
    'Title colour changed'
  );
  guard(title, /font-size:\s*var\(--mg-font-size-300\);/, 'Title size changed');
  guard(title, /font-weight:\s*700;/, 'Title weight changed');
  guard(
    title,
    /margin-bottom:\s*var\(--mg-spacing-75\);/,
    'Title bottom margin changed'
  );
  guard(title, /margin-top:\s*0;/, 'Title top margin changed');
  guard(
    title,
    /^(?![\s\S]*(?:line-height|font-family):)/,
    'Title no longer inherits h2 typography'
  );
  const list = block(form, '&__list {');
  guard(list, /margin:\s*0;/, 'List margin changed');
  guard(
    list,
    /padding-inline-start:\s*var\(--mg-spacing-100\);/,
    'List indent changed'
  );
  guard(
    list,
    /li\s*\{\s*margin-bottom:\s*var\(--mg-spacing-50\);\s*&:last-child\s*\{\s*margin-bottom:\s*0;\s*\}\s*\}/,
    'List row/last-row spacing changed'
  );
  guard(
    list,
    /a\s*\{\s*color:\s*rgb\(var\(--mg-color-red-900\)\);\s*font-weight:\s*600;\s*text-decoration:\s*underline;\s*\}/,
    'Link colour, weight or underline changed'
  );
  guard(
    list,
    /^(?![\s\S]*(?:list-style(?:-[a-z-]+)?|font-size|line-height|font-family):)/,
    'List no longer inherits marker/body typography'
  );
  guard(
    block(foundation, 'h2 {'),
    /font-weight:\s*700;\s*line-height:\s*1\.1;/,
    'Inherited h2 line height changed'
  );
  guard(
    block(foundation, 'body {'),
    /font-family:\s*var\(--mg-font-family-text\);\s*font-size:\s*var\(--mg-font-size-300\);\s*line-height:\s*var\(--mg-font-line-height-700\);/,
    'Body typography inheritance changed'
  );
  guard(
    block(foundation, 'body {'),
    /color:\s*rgb\(var\(--mg-color-text\)\);/,
    'Inherited marker colour changed'
  );
  guard(
    block(mixins, '@mixin mg-focus-ring {'),
    /box-shadow:\s*0 0 0 var\(--mg-focus-ring-offset\) rgb\(var\(--mg-color-neutral-0\)\);\s*outline:\s*var\(--mg-focus-ring-width\) solid rgb\(var\(--mg-color-focus-ring\)\);\s*outline-offset:\s*var\(--mg-focus-ring-offset\);/,
    'Opaque root focus separator/outline changed'
  );
  guard(
    block(foundation, 'ul,'),
    /padding-left:\s*var\(--mg-spacing-200\);\s*list-style-position:\s*outside;/,
    'Native list marker layout changed'
  );
  source(foundation, /caption\s*\{[^}]*text-wrap:\s*balance;/);
  source(jsx, /title = 'There is a problem'/);
  source(jsx, /if \(!errors \|\| errors\.length === 0\)\s*\{\s*return null;/);
  source(
    jsx,
    /containerRef\.current\.focus\(\);\s*hasFocusedRef\.current = true;/
  );
  source(jsx, /role="alert"\s*tabIndex=\{-1\}/);
  source(jsx, /<h2 className="mg-form-error-summary__title">\{title\}<\/h2>/);
  source(
    jsx,
    /<ul className="mg-form-error-summary__list">\s*\{errors\.map\(error => \(/
  );
  source(
    jsx,
    /<li key=\{error\.id\}>\s*<a href=\{`#\$\{error\.id\}`\}>\{error\.message\}<\/a>/
  );
  source(
    'stories/assets/fonts/roboto/sass/_Regular.scss',
    /font-weight:\s*400/
  );
  source('stories/assets/fonts/roboto/sass/_Bold.scss', /font-weight:\s*700/);
  const ratio = YAML.parse(read('tokens/mangrove.yaml'))['font-line-height'][
    '700'
  ].$value;
  if (!/^([\d.]+)em$/.test(ratio))
    fail('Body line height is no longer an em length');
  const byName = new Map(variables.map(variable => [variable.name, variable]));
  const value = (name, mode, visited = new Set()) => {
    if (visited.has(name)) fail(`Circular alias ${name}`);
    visited.add(name);
    const entry = byName.get(name)?.values[mode.id];
    if (entry == null) fail(`Missing variable ${name}/${mode.id}`);
    return entry.alias ? value(entry.alias, mode, visited) : entry;
  };
  const perMode = get =>
    Object.fromEntries(modes.map(mode => [mode.id, get(mode)]));
  const summaryRef = source(form, /\.mg-form-error-summary\s*\{/);
  const listRef = source(
    form,
    /&__list\s*\{\s*margin: 0;\s*padding-inline-start: var\(--mg-spacing-100\);/
  );
  function helper(name, get, scopes, description, ref = summaryRef) {
    const fullName = `component/form-error-summary/${name}`;
    if (byName.has(fullName)) return fullName;
    const definition = {
      id: fullName.replaceAll('/', '.'),
      name: fullName,
      type: 'FLOAT',
      scopes,
      description,
      source: ref,
      hiddenFromPublishing: false,
      codeSyntax: {},
      values: perMode(get),
    };
    if (
      Object.values(definition.values).some(
        number => !Number.isFinite(number) || number < 0
      )
    )
      fail(`Invalid helper ${fullName}`);
    variables.push(definition);
    byName.set(fullName, definition);
    return fullName;
  }
  const accent = helper(
    'accent-width',
    () => 4,
    ['WIDTH_HEIGHT'],
    'Source border-inline-start: 4px, represented as a native filled accent strip. This is an LTR composition.'
  );
  const marker = helper(
    'browser-marker-width',
    mode => (7 * value('font-size/300', mode)) / 16,
    ['WIDTH_HEIGHT'],
    'Chromium native disc marker advances 7px at the measured 16px Roboto Regular body size. Native bullet glyph appearance requires visual acceptance; this is browser-baseline marker geometry, not an authored CSS dimension.',
    listRef
  );
  const markerGap = helper(
    'browser-marker-to-link-gap',
    mode => (11 * value('font-size/300', mode)) / 16,
    ['GAP'],
    'Measured Chromium native outside disc marker box ends 11px before the link text at 16px. Scaled with the source body size; not a public CSS role.',
    listRef
  );
  const listLeft = helper(
    'native-list-left-padding',
    mode =>
      value('spacing/150', mode) +
      value('spacing/100', mode) -
      value(marker, mode) -
      value(markerGap, mode),
    ['GAP'],
    'Source 15px content inset plus 10px list indent, less measured marker advance and marker-to-text gap. Places the browser outside marker without negative native padding.',
    listRef
  );
  const widths = Object.fromEntries(
    [320, 240].map(width => [
      width,
      helper(
        `specimen-width-${width}`,
        () => width,
        ['WIDTH_HEIGHT'],
        `Measured ${width}px source consumer width. Finite template geometry, not an authored component width declaration.`
      ),
    ])
  );
  const zeroRadius = helper(
    'focus-radius',
    () => 0,
    ['CORNER_RADIUS'],
    'Source summary is square. Opaque focus strokes follow the source outer surface.'
  );
  const outerRadius = helper(
    'focus-outer-radius',
    mode => value('focus-ring/offset', mode),
    ['CORNER_RADIUS'],
    'Outside focus radius is source square radius plus separator offset, matching existing native focus stroke geometry.',
    source(mixins, /@mixin mg-focus-ring\s*\{/)
  );
  function textStyle(name, requestedWeight, styleName, lineHeight) {
    const id = `component.form-error-summary.${name}`;
    const definition = {
      id,
      name: `Mangrove/component/form-error-summary/${name}`,
      recommended: false,
      component: true,
      source: name === 'title' ? source(form, /&__title\s*\{/) : listRef,
      description:
        name === 'title'
          ? 'Source h2 summary title: 16px Bold with inherited h2 line-height 1.1. Latin text face is inherited; Arabic h2 uses its own heading role and is outside this scaffold.'
          : 'Source red underlined summary link requests CSS weight 600. CDP measured Roboto-Bold from bundled weight700, so native uses that exact face without inventing a 600 font.',
      typography: {
        requestedWeight,
        bundledWeight: 700,
        lineHeightBasis:
          name === 'title' ? 'own-font-size' : 'computed-body-length',
        ...(name === 'title'
          ? {
              lineHeightRatio: 1.1,
            }
          : {}),
        verification:
          'Actual JSX and fresh SCSS measured at ca895a1b in isolated Chromium. Desktop Figma font-file and wrapping parity remain unverified.',
      },
      bindings: {
        fontFamily: 'font-family/text',
        fontSize: 'font-size/300',
      },
      values: perMode(mode => ({
        fontName: {
          family: value('font-family/text', mode),
          style: styleName,
        },
        fontSize: value('font-size/300', mode),
        lineHeight: lineHeight(mode),
        textDecoration: name === 'link' ? 'UNDERLINE' : 'NONE',
        textWrapStyle: name === 'title' ? 'BALANCE' : 'AUTO',
      })),
    };
    const index = styles.text.findIndex(style => style.id === id);
    if (index < 0) styles.text.push(definition);
    else styles.text[index] = definition;
    return id;
  }
  const headingStyle = textStyle('title', 700, 'Bold', () => ({
    unit: 'PERCENT',
    value: 110,
  }));
  const linkStyle = textStyle('link', 600, 'Bold', mode => ({
    unit: 'PIXELS',
    value: value('font-size/300', mode) * Number(ratio.slice(0, -2)),
  }));
  const bodyStyle = styles.text.find(style => style.id === 'component.body');
  if (
    bodyStyle?.bindings?.fontFamily !== 'font-family/text' ||
    bodyStyle?.bindings?.fontSize !== 'font-size/300'
  )
    fail('Shared marker body style bindings changed');
  for (const mode of modes) {
    const body = bodyStyle.values[mode.id];
    if (
      body?.fontName?.style !== 'Regular' ||
      body?.lineHeight?.unit !== 'PIXELS' ||
      body.lineHeight.value !==
        value('font-size/300', mode) * Number(ratio.slice(0, -2))
    )
      fail(`Shared marker body style typography changed for ${mode.id}`);
  }
  return {
    files,
    read,
    form,
    jsx,
    foundation,
    mixins,
    fail,
    source,
    block,
    guard,
    summary,
    base,
    title,
    list,
    ratio,
    byName,
    value,
    perMode,
    summaryRef,
    listRef,
    helper,
    accent,
    marker,
    markerGap,
    listLeft,
    widths,
    zeroRadius,
    outerRadius,
    textStyle,
    headingStyle,
    linkStyle,
    bodyStyle,
  };
}
module.exports = {
  buildFormSummaryAssets,
};
