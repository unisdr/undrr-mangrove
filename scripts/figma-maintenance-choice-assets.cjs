/** Source-owned choice-control recipes. No Figma runtime values live here. */
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
function buildChoiceAssets({ root, modes, variables, styles }) {
  const files = new Map();
  const read = file => {
    if (!files.has(file))
      files.set(file, fs.readFileSync(path.join(root, file), 'utf8'));
    return files.get(file);
  };
  const form = 'stories/Components/Forms/_form-base.scss';
  const jsx = 'stories/Components/Forms/Radio/Radio.jsx';
  const radio = 'stories/Components/Forms/Radio/radio.scss';
  const foundation = 'stories/assets/scss/_foundational.scss';
  const mixins = 'stories/assets/scss/_mixins.scss';
  const tokens = 'tokens/mangrove.yaml';
  const fail = message => {
    throw new Error(`Figma Radio recipe needs updating: ${message}`);
  };
  function source(file, pattern) {
    const match = pattern.exec(read(file));
    if (!match) fail(`${file} no longer matches ${pattern}`);
    return {
      file,
      line: read(file).slice(0, match.index).split('\n').length,
    };
  }
  function block(file, selector) {
    const text = read(file).replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '');
    const start = text.indexOf(selector);
    if (start < 0) fail(`Missing ${selector} in ${file}`);
    const open = selector.includes('{')
      ? start + selector.indexOf('{')
      : text.indexOf('{', start + selector.length);
    let depth = 1;
    let end = open + 1;
    for (; end < text.length && depth; end++) {
      if (text[end] === '{') depth++;
      if (text[end] === '}') depth--;
    }
    if (depth || open < 0) fail(`Unbalanced ${selector} in ${file}`);
    return text.slice(open + 1, end - 1);
  }
  const group = block(form, '.mg-form-check {');
  const base = group.slice(0, group.indexOf('&__input'));
  const input = block(form, '&__input {');
  const label = block(form, '&__label {');
  const checked = block(form, '.mg-form-check__input--radio:checked {');
  const checkedFocus = block(
    form,
    '.mg-form-check__input--radio:checked:focus-visible {'
  );
  const error = block(form, '.mg-form-error {');
  const body = block(foundation, 'body {');
  const guard = (text, pattern, message) => {
    if (!pattern.test(text)) fail(message);
  };
  guard(base, /align-items:\s*center;/, 'Radio root alignment changed');
  guard(base, /display:\s*flex;/, 'Radio root is no longer flex');
  guard(base, /min-height:\s*mg-rem\(40\);/, 'Radio minimum height changed');
  guard(base, /position:\s*relative;/, 'Radio root positioning changed');
  guard(
    input,
    /border:\s*2px solid rgb\(var\(--mg-color-form-check\)\);/,
    'Radio base border changed'
  );
  guard(input, /height:\s*mg-rem\(24\);/, 'Radio control height changed');
  guard(input, /width:\s*mg-rem\(24\);/, 'Radio control width changed');
  guard(input, /margin:\s*0;/, 'Radio control margin changed');
  guard(input, /appearance:\s*none;/, 'Radio native appearance changed');
  guard(
    input,
    /&:hover\s*\{\s*border-color:\s*rgb\(var\(--mg-color-form-check--hover\)\);\s*\}/,
    'Radio hover border changed'
  );
  guard(
    input,
    /&:focus-visible\s*\{\s*@include mg-focus-ring;\s*\}/,
    'Radio focus border or ring changed'
  );
  guard(
    input,
    /&--radio\s*\{\s*background-color:\s*transparent;\s*border-radius:\s*100%;\s*box-shadow:\s*inset 0 0 0 rgb\(var\(--mg-color-white\)\);\s*\}/,
    'Radio unselected treatment changed'
  );
  guard(
    input,
    /&--disabled\s*\{\s*border-color:\s*rgb\(var\(--mg-color-neutral-400\)\);\s*cursor:\s*default;\s*&:hover\s*\{\s*border-color:\s*rgb\(var\(--mg-color-neutral-400\)\);\s*\}\s*\}/,
    'Radio disabled treatment changed'
  );
  guard(
    input,
    /&--error\s*\{\s*border-color:\s*rgb\(var\(--mg-color-red-900\)\);\s*&:hover\s*\{\s*border-color:\s*rgb\(var\(--mg-color-red-900\)\);\s*\}\s*\}/,
    'Radio invalid treatment changed'
  );
  if (input.indexOf('&--disabled') > input.indexOf('&--error'))
    fail('Radio invalid/disabled source-order cascade changed');
  guard(
    checked,
    /^\s*background-color:\s*rgb\(var\(--mg-color-form-check--checked\)\);\s*box-shadow:\s*inset 0 0 0 3px rgb\(var\(--mg-color-white\)\);\s*$/,
    'Radio checked fill, inset or border cascade changed'
  );
  guard(
    checkedFocus,
    /^\s*box-shadow:\s*inset 0 0 0 3px rgb\(var\(--mg-color-white\)\),\s*0 0 0 var\(--mg-focus-ring-offset\) rgb\(var\(--mg-color-neutral-0\)\);\s*$/,
    'Radio checked-focus inset/separator changed'
  );
  guard(
    label,
    /^\s*cursor:\s*pointer;\s*font-size:\s*var\(--mg-font-size-300\);\s*padding:\s*0 7px;\s*$/,
    'Radio label typography, colour or padding changed'
  );
  guard(
    error,
    /^\s*color:\s*rgb\(var\(--mg-color-red-900\)\);\s*font-size:\s*var\(--mg-font-size-300\);\s*margin-bottom:\s*0;\s*margin-top:\s*var\(--mg-spacing-25\);\s*$/,
    'Radio error typography or margins changed'
  );
  guard(
    body,
    /font-family:\s*var\(--mg-font-family-text\);/,
    'Body face changed'
  );
  guard(body, /font-size:\s*var\(--mg-font-size-300\);/, 'Body size changed');
  guard(
    body,
    /line-height:\s*var\(--mg-font-line-height-700\);/,
    'Body line height changed'
  );
  if (/font-weight\s*:/.test(body)) fail('Inherited body weight changed');
  if (
    /flex-(?:shrink|grow|basis)\s*:|min-width\s*:|flex\s*:/.test(
      base + input + label
    )
  )
    fail('Radio CSS flex sizing changed; remeasure narrow source presets');
  if (
    read(radio)
      .replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '')
      .trim()
  )
    fail('Radio-specific SCSS now has overrides');
  source(jsx, /labelPosition = 'after'/);
  source(
    jsx,
    /disabled && 'mg-form-check__input--disabled',\s*error && 'mg-form-check__input--error'/
  );
  source(jsx, /className="mg-form-check__label" htmlFor=\{radioId\}/);
  source(
    jsx,
    /\{labelPosition === 'before' && labelElement\}[\s\S]*?<input[\s\S]*?\{labelPosition === 'after' && labelElement\}[\s\S]*?\{error && errorText && \(\s*<p className="mg-form-error"/
  );
  source(jsx, /type="radio"/);
  guard(
    block(mixins, '@mixin mg-focus-ring {'),
    /box-shadow:\s*0 0 0 var\(--mg-focus-ring-offset\) rgb\(var\(--mg-color-neutral-0\)\);\s*outline:\s*var\(--mg-focus-ring-width\) solid rgb\(var\(--mg-color-focus-ring\)\);\s*outline-offset:\s*var\(--mg-focus-ring-offset\);/,
    'Source focus outline changed'
  );
  source('stories/assets/fonts/roboto/roboto.scss', /@import "sass\/Regular"/);
  source(
    'stories/assets/fonts/roboto/sass/_Regular.scss',
    /font-weight:\s*400/
  );
  const byName = new Map(variables.map(variable => [variable.name, variable]));
  function value(name, mode, visited = new Set()) {
    if (visited.has(name)) fail(`Circular alias ${name}`);
    visited.add(name);
    const item = byName.get(name)?.values[mode.id];
    if (item == null) fail(`Missing variable ${name}/${mode.id}`);
    return item.alias ? value(item.alias, mode, visited) : item;
  }
  const perMode = get =>
    Object.fromEntries(modes.map(mode => [mode.id, get(mode)]));
  function helper(name, get, scopes, description, ref) {
    const fullName = `component/radio/${name}`;
    if (byName.has(fullName)) return fullName;
    const variable = {
      id: fullName.replaceAll('/', '.'),
      name: fullName,
      type: 'FLOAT',
      source: ref,
      description,
      scopes,
      hiddenFromPublishing: false,
      codeSyntax: {},
      values: perMode(get),
    };
    for (const number of Object.values(variable.values))
      if (!Number.isFinite(number) || number < 0)
        fail(`Invalid helper ${fullName}`);
    variables.push(variable);
    byName.set(fullName, variable);
    return fullName;
  }
  const inputRef = source(form, /&__input\s*\{/);
  const rowRef = source(form, /\.mg-form-check\s*\{/);
  const labelRef = source(form, /&__label\s*\{/);
  const checkedRef = source(form, /\.mg-form-check__input--radio:checked\s*\{/);
  const dimension = helper(
    'control-size',
    () => 24,
    ['WIDTH_HEIGHT'],
    'Source radio width/height mg-rem(24), resolved at the standard 16px root. CSS flex shrink can reduce width; finite source presets below record that separately.',
    inputRef
  );
  const minimum = helper(
    'minimum-row-height',
    () => 40,
    ['WIDTH_HEIGHT'],
    'Source .mg-form-check min-height mg-rem(40). Row content may grow; it is not a fixed control hit-box height.',
    rowRef
  );
  const border = helper(
    'border-width',
    () => 2,
    ['STROKE_FLOAT'],
    'Source 2px shared form-check border. Checked Radio changes fill only; its border retains the state cascade.',
    inputRef
  );
  const inset = helper(
    'checked-inset',
    () => 3,
    ['EFFECT_FLOAT'],
    'Source checked Radio inset 0 0 0 3px white shadow, represented by a native ellipse inner shadow.',
    checkedRef
  );
  const nativeInset = helper(
    'native-checked-inset-spread',
    mode => value(inset, mode) + value(border, mode),
    ['EFFECT_FLOAT'],
    'Native Figma inner-shadow spread equals the source 3px inset plus the 2px inside border. Real Figma paints that border over the shadow beginning at the outer ellipse edge; a literal spread of 3 leaves only a 1px white band. Derived geometry preserves the CSS inset inside the border.',
    checkedRef
  );
  const padding = helper(
    'label-inline-padding',
    () => 7,
    ['GAP'],
    'Source label padding 0 7px, including both before/after label layouts.',
    labelRef
  );
  const radius = helper(
    'focus-radius',
    mode => value(dimension, mode) / 2,
    ['CORNER_RADIUS'],
    'Circle focus wrapper radius: half the source 24px control. This helper is only used by unshrunk short-content focus variants.',
    inputRef
  );
  const outerRadius = helper(
    'focus-outer-radius',
    mode => value(radius, mode) + value('focus-ring/offset', mode),
    ['CORNER_RADIUS'],
    'Source circle focus outer radius: control half-size plus separator offset. Native outside strokes reproduce the source outline independently of control fill.',
    source(mixins, /@mixin mg-focus-ring\s*\{/)
  );
  const ratio = YAML.parse(read(tokens))['font-line-height']['700'].$value;
  if (!/^([\d.]+)em$/.test(ratio))
    fail('Body line height is no longer an em length');
  const lineRatio = Number(ratio.slice(0, -2));
  for (const id of ['component.body', 'component.error']) {
    const style = styles.text.find(item => item.id === id);
    if (
      !style ||
      style.bindings?.fontFamily !== 'font-family/text' ||
      style.bindings?.fontSize !== 'font-size/300'
    )
      fail(`Shared ${id} style no longer follows Radio text roles`);
    for (const mode of modes) {
      const entry = style.values[mode.id];
      if (
        !entry ||
        entry.fontName.family !== value('font-family/text', mode) ||
        entry.fontName.style !== 'Regular' ||
        entry.fontSize !== value('font-size/300', mode) ||
        entry.lineHeight.unit !== 'PIXELS' ||
        Math.abs(
          entry.lineHeight.value - value('font-size/300', mode) * lineRatio
        ) > 1e-6
      )
        fail(`Shared ${id}/${mode.id} typography changed`);
    }
  }
  for (const mode of modes)
    if (
      value('font-family/text', mode) !== 'Roboto' ||
      value('font-size/300', mode) !== 16 ||
      lineRatio !== 1.5 ||
      value('spacing/25', mode) !== 2.5
    )
      fail(
        `Narrow Radio text/margin baseline changed in ${mode.id}; remeasure presets`
      );
  const checkedEffect = {
    id: 'component.radio.checked-inset',
    name: 'Mangrove/component/radio/checked-inset',
    component: true,
    source: checkedRef,
    description:
      'Checked Radio white 3px inner band. The native spread includes the 2px inside border because Figma paints its stroke over the effect beginning at the ellipse outer edge. Applied to the actual native ellipse, preserving its coloured fill and state-owned border. Source and native compositing are recorded separately in LEARNINGS.',
    values: perMode(mode => [
      {
        effect: {
          type: 'INNER_SHADOW',
          color: value('color/white', mode),
          offset: {
            x: 0,
            y: 0,
          },
          radius: 0,
          spread: value(nativeInset, mode),
          visible: true,
          blendMode: 'NORMAL',
        },
        bindings: {
          color: 'color/white',
          spread: nativeInset,
        },
      },
    ]),
  };
  const effectIndex = styles.effect.findIndex(
    item => item.id === checkedEffect.id
  );
  if (effectIndex < 0) styles.effect.push(checkedEffect);
  else styles.effect[effectIndex] = checkedEffect;
  const longLabel =
    'Receive early warnings and detailed disaster risk information for my local community';
  const longError = 'Select one preferred information service';
  const narrow = {};
  for (const [state, widths] of Object.entries({
    Default: [11.140625, 228.859375],
    Invalid: [8.484375, 148.921875, 82.59375],
  })) {
    const slug = state.toLowerCase();
    narrow[state] = {
      control: helper(
        `source-narrow-${slug}-control-width`,
        () => widths[0],
        ['WIDTH_HEIGHT'],
        `Measured Chromium 153/macOS 240px source Radio control width with the documented English long label${state === 'Invalid' ? ' and inline error' : ''}. Source flex-shrink:1 produces an ellipse. Content- and platform-specific specimen geometry, not a public CSS role or an automatic flex algorithm.`,
        inputRef
      ),
      label: helper(
        `source-narrow-${slug}-label-width`,
        () => widths[1],
        ['WIDTH_HEIGHT'],
        'Measured outer label width in the 240px source English specimen, including both 7px paddings. Editable content may wrap differently in Figma; label and row hug their resulting height.',
        labelRef
      ),
      ...(widths[2]
        ? {
            error: helper(
              `source-narrow-${slug}-error-width`,
              () => widths[2],
              ['WIDTH_HEIGHT'],
              'Measured 240px English specimen inline error width. The error remains a horizontal sibling with 2.5px top margin, not a stacked field error.',
              source(form, /\.mg-form-error\s*\{/)
            ),
          }
        : {}),
    };
  }
  return {
    files,
    read,
    form,
    jsx,
    radio,
    foundation,
    mixins,
    tokens,
    fail,
    source,
    block,
    group,
    base,
    input,
    label,
    checked,
    checkedFocus,
    error,
    body,
    guard,
    byName,
    value,
    perMode,
    helper,
    inputRef,
    rowRef,
    labelRef,
    checkedRef,
    dimension,
    minimum,
    border,
    inset,
    nativeInset,
    padding,
    radius,
    outerRadius,
    ratio,
    lineRatio,
    checkedEffect,
    effectIndex,
    longLabel,
    longError,
    narrow,
  };
}
module.exports = {
  buildChoiceAssets,
};
