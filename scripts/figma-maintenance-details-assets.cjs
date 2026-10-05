/** Source-owned styled Details recipes. Browser measurements are not native acceptance. */
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
function buildDetailsAssets({ root, modes, variables, styles }) {
  const scss = 'stories/Atom/ReachElement/Details/details.scss';
  const jsx = 'stories/Atom/ReachElement/Details/Details.jsx';
  const mixins = 'stories/assets/scss/_mixins.scss';
  const foundation = 'stories/assets/scss/_foundational.scss';
  const tokens = 'tokens/mangrove.yaml';
  const files = new Map();
  const read = file => {
    if (!files.has(file))
      files.set(file, fs.readFileSync(path.join(root, file), 'utf8'));
    return files.get(file);
  };
  const fail = message => {
    throw new Error(`Figma Details recipe needs updating: ${message}`);
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
  function block(text, selector) {
    const start = text.indexOf(selector),
      open = text.indexOf('{', start);
    if (start < 0 || open < 0) fail(`Missing ${selector}`);
    let depth = 1,
      end = open + 1;
    for (; end < text.length && depth; end++) {
      if (text[end] === '{') depth++;
      if (text[end] === '}') depth--;
    }
    if (depth) fail(`Unbalanced ${selector}`);
    return text.slice(open + 1, end - 1);
  }
  const guard = (text, pattern, message) => {
    if (!pattern.test(text)) fail(message);
  };
  const all = clean(read(scss)),
    details = block(all, 'details.mg-details {'),
    base = details.slice(0, details.indexOf('&:hover'));
  for (const [pattern, message] of [
    [
      /border:\s*1px solid rgb\(var\(--mg-color-neutral-400\)\);/,
      'Outer border changed',
    ],
    [
      /border-radius:\s*mg-rem\(4\);\s*padding:\s*mg-rem\(10\);/,
      'Outer geometry changed',
    ],
    [
      /^(?![\s\S]*(?:background(?:-color)?|min-height|line-height|font-family):)/,
      'Outer paint or inheritance changed',
    ],
  ])
    guard(base, pattern, message);
  guard(
    block(details, '&:hover {'),
    /^\s*box-shadow:\s*0 2px 4px rgb\(0 0 0 \/ 0\.1\);\s*$/,
    'Outer hover effect changed'
  );
  const summary = block(details, '> summary {'),
    summaryBase = summary.slice(0, summary.indexOf('&:hover'));
  for (const [pattern, message] of [
    [/@extend %paragraph-font-300;/, 'Summary responsive type changed'],
    [
      /color:\s*rgb\(var\(--mg-color-interactive\)\);\s*font-weight:\s*600;/,
      'Summary colour/weight changed',
    ],
    [
      /list-style-type:\s*none;\s*min-height:\s*mg-rem\(48\);/,
      'Summary marker or minimum changed',
    ],
    [
      /padding-block:\s*mg-rem\(10\);\s*padding-inline:\s*mg-rem\(10\) mg-rem\(44\);\s*position:\s*relative;/,
      'Summary reserved geometry changed',
    ],
    [
      /^(?![\s\S]*(?:line-height|font-family|background(?:-color)?|border-radius):)/,
      'Summary inherited typography or rest paint changed',
    ],
  ])
    guard(summaryBase, pattern, message);
  guard(
    block(summary, '&:hover {'),
    /^\s*background-color:\s*rgb\(\s*var\(--mg-color-blue-900\) \/ 0\.08\s*\);\s*border-radius:\s*mg-rem\(2\);\s*$/,
    'Summary hover paint/radius changed'
  );
  const badge = block(summary, '&::before {');
  for (const [pattern, message] of [
    [
      /align-items:\s*center;\s*background:\s*rgb\(var\(--mg-color-interactive\) \/ 0\.06\);\s*border-radius:\s*50%;\s*content:\s*"\+";/,
      'Closed marker paint/glyph changed',
    ],
    [
      /display:\s*flex;\s*font-family:\s*var\(--mg-font-family-text\);\s*font-size:\s*var\(--mg-font-size-400\);\s*font-weight:\s*400;/,
      'Marker font changed',
    ],
    [
      /height:\s*mg-rem\(30\);\s*inset-inline-end:\s*mg-rem\(10\);\s*justify-content:\s*center;\s*position:\s*absolute;\s*top:\s*50%;\s*transform:\s*translateY\(-50%\);\s*width:\s*mg-rem\(30\);/,
      'Marker containing-block geometry changed',
    ],
    [
      /^(?![\s\S]*(?:line-height|padding|color):)/,
      'Marker inheritance/optical geometry changed',
    ],
  ])
    guard(badge, pattern, message);
  guard(
    block(summary, '&:hover::before {'),
    /^\s*background:\s*rgb\(var\(--mg-color-interactive\) \/ 0\.12\);\s*$/,
    'Hovered marker alpha changed'
  );
  guard(
    block(summary, '&:active::before {'),
    /^\s*scale:\s*0\.96;\s*$/,
    'Pending active marker transform changed'
  );
  const body = block(details, '  p {');
  guard(
    body,
    /^\s*@extend %paragraph-font-200;\s*padding:\s*mg-rem\(10\);\s*margin:\s*0;\s*line-height:\s*1\.6;\s*$/,
    'Paragraph geometry/type changed'
  );
  const open = block(details, '&[open] {');
  guard(
    open,
    /border-color:\s*rgb\(\s*var\(--mg-color-interactive\)\s*\);/,
    'Open outer colour changed'
  );
  guard(
    block(open, '> summary {'),
    /^\s*margin-bottom:\s*0;\s*padding-bottom:\s*mg-rem\(10\);\s*border-bottom:\s*1px solid rgb\(var\(--mg-color-neutral-400\)\);\s*&::before\s*{\s*content:\s*"−";\s*transform:\s*translateY\(-50%\);\s*}\s*$/,
    'Open separator/glyph changed'
  );
  guard(
    block(block(all, 'details {'), '> summary {'),
    /cursor:\s*pointer;\s*&:focus-visible\s*{\s*@include mg-focus-ring;\s*}/,
    'Baseline summary focus changed'
  );
  source(
    jsx,
    /<details className="mg-details">\s*<summary>\{summary\}<\/summary>\s*<p>\{details\}<\/p>\s*<\/details>/
  );
  source(
    jsx,
    /summary:\s*PropTypes\.string\.isRequired,\s*details:\s*PropTypes\.string\.isRequired/
  );
  guard(
    block(clean(read(mixins)), '%paragraph-font-300 {'),
    /^\s*font-size:\s*var\(--mg-font-size-300\);\s*@include devicebreak\(medium\)\s*{\s*font-size:\s*var\(--mg-font-size-400\);\s*}\s*$/,
    'Summary breakpoint/type roles changed'
  );
  guard(
    block(clean(read(mixins)), '%paragraph-font-200 {'),
    /^\s*font-size:\s*var\(--mg-font-size-200\);\s*line-height:\s*1\.4;\s*@include devicebreak\(medium\)\s*{\s*font-size:\s*var\(--mg-font-size-300\);\s*}\s*$/,
    'Body responsive roles changed'
  );
  source(
    'stories/assets/scss/_breakpoints.scss',
    /\$point == medium\s*{\s*\/\*[^]*?\*\/\s*@media \(width >= 48em\)/
  );
  guard(
    block(clean(read(foundation)), 'body {'),
    /font-family:\s*var\(--mg-font-family-text\);\s*font-size:\s*var\(--mg-font-size-300\);\s*line-height:\s*var\(--mg-font-line-height-700\);/,
    'Inherited body typography changed'
  );
  guard(
    block(clean(read(foundation)), 'body {'),
    /color:\s*rgb\(var\(--mg-color-text\)\);/,
    'Inherited paragraph colour changed'
  );
  source(
    foundation,
    /\*,\s*\*::before,\s*\*::after\s*{\s*box-sizing:\s*border-box;\s*overflow-wrap:\s*break-word;/
  );
  guard(
    block(clean(read(mixins)), '@mixin mg-focus-ring {'),
    /box-shadow:\s*0 0 0 var\(--mg-focus-ring-offset\) rgb\(var\(--mg-color-neutral-0\)\);\s*outline:\s*var\(--mg-focus-ring-width\) solid rgb\(var\(--mg-color-focus-ring\)\);\s*outline-offset:\s*var\(--mg-focus-ring-offset\);/,
    'Focus bands changed'
  );
  source(
    'stories/assets/fonts/roboto/sass/_Bold.scss',
    /font-weight:\s*700;\s*font-style:\s*normal;/
  );
  source(
    'stories/assets/fonts/roboto/sass/_Regular.scss',
    /font-weight:\s*400;\s*font-style:\s*normal;/
  );
  const lineHeight = YAML.parse(read(tokens))['font-line-height']?.['700']
    ?.$value;
  if (lineHeight !== '1.5em')
    fail('Measured inherited body line height changed');
  const byName = new Map(variables.map(v => [v.name, v]));
  function value(name, mode, seen = new Set()) {
    if (seen.has(name)) fail(`Circular alias ${name}`);
    seen.add(name);
    const entry = byName.get(name)?.values[mode.id];
    if (entry == null) fail(`Missing variable ${name}/${mode.id}`);
    return entry.alias ? value(entry.alias, mode, seen) : entry;
  }
  const perMode = get =>
    Object.fromEntries(modes.map(mode => [mode.id, get(mode)]));
  for (const mode of modes)
    if (
      value('font-family/text', mode) !== 'Roboto' ||
      value('font-size/300', mode) !== 16 ||
      value('font-size/400', mode) !== 18 ||
      value('font-size/200', mode) !== 12.5
    )
      fail(`Measured Details typography differs in ${mode.id}`);
  const ref = source(scss, /details\.mg-details\s*{/);
  function helper(name, type, scopes, get, description, sourceRef = ref) {
    const fullName = `component/details/${name}`,
      definition = {
        id: fullName.replaceAll('/', '.'),
        name: fullName,
        type,
        scopes,
        hiddenFromPublishing: false,
        description,
        source: sourceRef,
        codeSyntax: {},
        values: perMode(get),
      };
    if (
      Object.values(definition.values).some(entry =>
        type === 'FLOAT'
          ? !Number.isFinite(entry)
          : !['r', 'g', 'b', 'a'].every(
              field =>
                Number.isFinite(entry[field]) &&
                entry[field] >= 0 &&
                entry[field] <= 1
            )
      )
    )
      fail(`Invalid ${type} helper ${name}`);
    const index = variables.findIndex(v => v.name === fullName);
    if (index < 0) variables.push(definition);
    else variables[index] = definition;
    byName.set(fullName, definition);
    return fullName;
  }
  const number = (name, scopes, get, description, sourceRef) =>
    helper(
      name,
      'FLOAT',
      scopes,
      typeof get === 'function' ? get : () => get,
      description,
      sourceRef
    );
  const alpha = (name, role, opacity, description) =>
    helper(
      name,
      'COLOR',
      ['FRAME_FILL'],
      mode => ({
        ...value(role, mode),
        a: opacity,
      }),
      description
    );
  const geometry = {
    border: number(
      'border-width',
      ['STROKE_FLOAT'],
      1,
      'Source outer border1px and Open summary bottom border1px.'
    ),
    radius: number(
      'outer-radius',
      ['CORNER_RADIUS'],
      4,
      'Source outer border-radius4px.'
    ),
    padding: number(
      'padding',
      ['GAP'],
      10,
      'Source outer/paragraph padding10px, summary top/bottom/leading10px, badge inline-end10px.'
    ),
    reserve: number(
      'summary-padding-end',
      ['GAP'],
      44,
      'Source summary reserves44px for absolute30px marker and10px end inset.'
    ),
    minimum: number(
      'summary-minimum-height',
      ['WIDTH_HEIGHT'],
      48,
      'Source summary min-height48px includes padding and Open bottom border; multiline content grows above it.'
    ),
    marker: number(
      'marker-size',
      ['WIDTH_HEIGHT'],
      30,
      'Source absolute pseudo-circle30px, excluded from flow height.'
    ),
    markerRadius: number(
      'marker-radius',
      ['CORNER_RADIUS'],
      15,
      'Source50% radius of30px marker.'
    ),
    zero: number(
      'zero',
      ['CORNER_RADIUS', 'STROKE_FLOAT', 'EFFECT_FLOAT'],
      0,
      'Source summary rest has no radius or non-bottom border; hover shadow zero x-offset/spread.'
    ),
    hoverRadius: number(
      'summary-hover-radius',
      ['CORNER_RADIUS'],
      2,
      'Source summary hover radius2px, retained in combined HoverFocus.'
    ),
    markerEnd: number(
      'marker-end-offset',
      ['WIDTH_HEIGHT'],
      -10,
      'Source absolute inline-end10px expressed as generic END negative offset.'
    ),
    markerOpenY: number(
      'marker-open-center-offset',
      ['WIDTH_HEIGHT'],
      mode => -value('component/details/border-width', mode) / 2,
      'Source Open bottom border is excluded from CSS absolute containing-block height. Generic outer-box CENTER compensates by half that1px border,−0.5px.'
    ),
    shadowY: number(
      'hover-shadow-offset-y',
      ['EFFECT_FLOAT'],
      2,
      'Source outer hover shadow offset0/2px.'
    ),
    shadowRadius: number(
      'hover-shadow-blur',
      ['EFFECT_FLOAT'],
      4,
      'Source outer hover shadow blur4px.'
    ),
  };
  geometry.focusOuter = number(
    'summary-focus-outer-radius',
    ['CORNER_RADIUS'],
    mode => value('focus-ring/offset', mode),
    'Source square summary focus shape expanded by separator offset.'
  );
  geometry.hoverFocusOuter = number(
    'summary-hover-focus-outer-radius',
    ['CORNER_RADIUS'],
    mode =>
      value(geometry.hoverRadius, mode) + value('focus-ring/offset', mode),
    'Source hovered summary radius2px expanded by separator offset.'
  );
  const paint = {
    marker: alpha(
      'marker-background',
      'color/interactive',
      0.06,
      'Source marker interactive colour cast to alpha0.06.'
    ),
    markerHover: alpha(
      'marker-hover-background',
      'color/interactive',
      0.12,
      'Source hovered marker interactive colour cast to alpha0.12.'
    ),
    summaryHover: alpha(
      'summary-hover-background',
      'color/blue-900',
      0.08,
      'Source summary hover uses blue900 alpha0.08, deliberately distinct from brand interactive role.'
    ),
  };
  paint.shadow = helper(
    'hover-shadow-color',
    'COLOR',
    ['EFFECT_COLOR'],
    () => ({
      r: 0,
      g: 0,
      b: 0,
      a: 0.1,
    }),
    'Source literal black0/0/0 alpha0.1; near-black palette role is not substituted.'
  );
  const widths = Object.fromEntries(
    [1280, 900, 390, 240].map(width => [
      width,
      number(
        `measured-viewport-${width}`,
        ['WIDTH_HEIGHT'],
        width,
        `Bounded measured browser viewport/control${width}px; fixture width, not a component breakpoint. Source typography switches at48em, not at this width.`
      ),
    ])
  );
  const hoverEffect = {
    id: 'component.details.hover-shadow',
    name: 'Mangrove/component/details/hover-shadow',
    type: 'EFFECT',
    recommended: false,
    source: source(scss, /box-shadow:\s*0 2px 4px/),
    description:
      'Source outer Hover drop shadow. Transparent bordered native frame rendering needs real acceptance.',
    values: perMode(mode => [
      {
        effect: {
          type: 'DROP_SHADOW',
          color: value(paint.shadow, mode),
          offset: {
            x: 0,
            y: 2,
          },
          radius: 4,
          spread: 0,
          visible: true,
          blendMode: 'NORMAL',
        },
        bindings: {
          color: paint.shadow,
          offsetX: geometry.zero,
          offsetY: geometry.shadowY,
          radius: geometry.shadowRadius,
          spread: geometry.zero,
        },
      },
    ]),
  };
  const effectIndex = styles.effect.findIndex(s => s.id === hoverEffect.id);
  if (effectIndex < 0) styles.effect.push(hoverEffect);
  else styles.effect[effectIndex] = hoverEffect;
  function textStyle(role, fontSize, face, requestedWeight, line) {
    const id = `component.details.${role}`,
      definition = {
        id,
        name: `Mangrove/component/details/${role}`,
        type: 'TEXT',
        recommended: false,
        source: ref,
        description: `Source Roboto ${face}; requested${requestedWeight} was measured as this real face. Summary and marker inherit computed body line height; paragraph uses own-size160%. Native file equivalence/wrap remains pending.`,
        typography: {
          fontWeightRequested: requestedWeight,
          fontWeightBundled: face === 'Bold' ? 700 : 400,
          fontStyleBundled: face,
          fontMatchRationale:
            face === 'Bold'
              ? 'Actual source browser CSS600 rendered Roboto-Bold700.'
              : 'Actual source browser rendered source Roboto-Regular400.',
          lineHeightBasis:
            line === 'body' ? 'inherited-computed-body' : 'own-font-size',
          ...(line === 'body'
            ? {}
            : {
                lineHeightRatio: 1.6,
              }),
          verification:
            'Actual JSX/fresh SCSS at1280/900/390/240, UNDRR Latin; native acceptance pending.',
        },
        bindings: {
          fontFamily: 'font-family/text',
          fontSize,
        },
        values: perMode(mode => ({
          fontName: {
            family: value('font-family/text', mode),
            style: face,
          },
          fontSize: value(fontSize, mode),
          lineHeight:
            line === 'body'
              ? {
                  unit: 'PIXELS',
                  value: value('font-size/300', mode) * 1.5,
                }
              : {
                  unit: 'PERCENT',
                  value: 160,
                },
          textDecoration: 'NONE',
          textWrapStyle: 'AUTO',
        })),
      };
    const index = styles.text.findIndex(s => s.id === id);
    if (index < 0) styles.text.push(definition);
    else styles.text[index] = definition;
    return id;
  }
  const type = {
    BelowMedium: {
      summary: textStyle(
        'summary-below-medium',
        'font-size/300',
        'Bold',
        600,
        'body'
      ),
      paragraph: textStyle(
        'paragraph-below-medium',
        'font-size/200',
        'Regular',
        400,
        'own'
      ),
    },
    MediumUp: {
      summary: textStyle(
        'summary-medium-up',
        'font-size/400',
        'Bold',
        600,
        'body'
      ),
      paragraph: textStyle(
        'paragraph-medium-up',
        'font-size/300',
        'Regular',
        400,
        'own'
      ),
    },
    glyph: textStyle('marker-glyph', 'font-size/400', 'Regular', 400, 'body'),
  };
  return {
    scss,
    jsx,
    mixins,
    foundation,
    tokens,
    files,
    read,
    fail,
    source,
    clean,
    block,
    guard,
    all,
    details,
    base,
    summary,
    summaryBase,
    badge,
    body,
    open,
    lineHeight,
    byName,
    value,
    perMode,
    ref,
    helper,
    number,
    alpha,
    geometry,
    paint,
    widths,
    hoverEffect,
    effectIndex,
    textStyle,
    type,
  };
}
module.exports = {
  buildDetailsAssets,
};
