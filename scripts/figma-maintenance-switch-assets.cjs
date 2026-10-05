/** Source-owned basic Switch recipes. Pending and system-colour appearances are separate work. */
const fs = require('fs');
const path = require('path');
function buildSwitchAssets({ root, modes, variables, styles }) {
  const form = 'stories/Components/Forms/_form-base.scss';
  const stories = 'stories/Components/Forms/Checkbox/Checkbox.stories.jsx';
  const pending = 'stories/Components/Forms/Checkbox/_switchPending.jsx';
  const files = new Map();
  const read = file => {
    if (!files.has(file))
      files.set(file, fs.readFileSync(path.join(root, file), 'utf8'));
    return files.get(file);
  };
  const fail = message => {
    throw new Error(`Figma Switch recipe needs updating: ${message}`);
  };
  const source = (file, regex) => {
    const match = regex.exec(read(file));
    if (!match) fail(`${file} no longer matches ${regex}`);
    return {
      file,
      line: read(file).slice(0, match.index).split('\n').length,
    };
  };
  const clean = text => text.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '');
  const guard = (text, regex, message) => {
    if (!regex.test(text)) fail(message);
  };
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
  const scss = clean(read(form)),
    sw = block(scss, '.mg-switch {'),
    base = sw.slice(0, sw.indexOf('&__input')),
    input = block(sw, '&__input {'),
    track = block(sw, '\n  &__track {'),
    thumb = block(sw, '&__thumb {'),
    label = block(sw, '&__label {'),
    small = block(sw, '&--small {');
  guard(
    scss,
    /\$mg-switch-disabled-opacity:\s*0\.45;/,
    'Disabled opacity changed'
  );
  guard(
    scss,
    /\$mg-switch-size:\s*var\(--mg-switch-size,\s*#\{mg-rem\(24\)\}\);/,
    'Default size changed'
  );
  guard(
    scss,
    /\$mg-switch-track-block:\s*var\(--mg-switch-track-block-size,\s*#\{\$mg-switch-size\}\);/,
    'Track block hook changed'
  );
  guard(
    scss,
    /--mg-switch-track-inline-size,\s*calc\(#\{\$mg-switch-track-block\} \* 1\.75\)/,
    'Track width ratio changed'
  );
  guard(
    scss,
    /--mg-switch-track-inset,\s*calc\(#\{\$mg-switch-track-block\} \/ 12\)/,
    'Inset ratio changed'
  );
  guard(
    scss,
    /--mg-switch-thumb-size,\s*calc\(#\{\$mg-switch-track-block\} - 2 \* #\{\$mg-switch-inset\}\)/,
    'Thumb size formula changed'
  );
  guard(
    scss,
    /\$mg-switch-travel:\s*"#\{\$mg-switch-track-inline\} - #\{\$mg-switch-thumb-size\} - 2 \* #\{\$mg-switch-inset\}";/,
    'Thumb travel changed'
  );
  guard(
    base,
    /align-items:\s*center;[\s\S]*display:\s*inline-flex;\s*gap:\s*var\(--mg-spacing-75\);\s*min-height:\s*mg-rem\(36\);/,
    'Root alignment, gap or minimum height changed'
  );
  guard(
    track,
    /background-color:\s*\$mg-switch-track;[\s\S]*border:\s*\$mg-switch-inset solid transparent;\s*border-radius:\s*calc\(#\{\$mg-switch-track-block\} \/ 2\);/,
    'Track border/radius changed'
  );
  guard(
    track,
    /display:\s*inline-flex;\s*flex-shrink:\s*0;\s*inline-size:\s*\$mg-switch-track-inline;/,
    'Track no-shrink geometry changed'
  );
  guard(track, /box-sizing:\s*border-box;/, 'Track box sizing changed');
  guard(
    thumb,
    /background-color:\s*\$mg-switch-thumb;\s*block-size:\s*\$mg-switch-thumb-size;\s*border-radius:\s*50%;\s*box-shadow:\s*0 1px 3px rgb\(0 0 0 \/ 0\.25\);/,
    'Thumb fill, shape or shadow changed'
  );
  guard(
    label,
    /color:\s*rgb\(var\(--mg-color-neutral-900\)\);\s*font-size:\s*var\(--mg-font-size-300\);/,
    'Label colour/size changed'
  );
  guard(
    label,
    /^(?![\s\S]*(?:font-family|font-weight|line-height):)/,
    'Label no longer inherits body typography'
  );
  guard(
    small,
    /--mg-switch-size:\s*#\{mg-rem\(18\)\};\s*gap:\s*var\(--mg-spacing-50\);/,
    'Small size or gap changed'
  );
  guard(
    input,
    /&:focus-visible \+ \.mg-switch__track\s*\{\s*@include mg-focus-ring;/,
    'Track focus changed'
  );
  guard(
    input,
    /&:checked \+ \.mg-switch__track\s*\{\s*background-color:\s*\$mg-switch-track-checked;\s*\.mg-switch__thumb\s*\{\s*transform:\s*translateX\(calc\(#\{\$mg-switch-travel\}\)\);/,
    'Checked fill/position changed'
  );
  guard(
    input,
    /&:disabled \+ \.mg-switch__track\s*\{\s*cursor:\s*not-allowed;\s*opacity:\s*\$mg-switch-disabled-opacity;/,
    'Native disabled treatment changed'
  );
  const aria = block(input, '&[aria-disabled="true"] + .mg-switch__track');
  guard(
    aria,
    /background-image:\s*linear-gradient\(\s*\$mg-switch-overlay-disabled,\s*\$mg-switch-overlay-disabled\s*\);/,
    'Aria-disabled wash changed'
  );
  guard(
    aria,
    /box-shadow:\s*0 1px 3px rgb\(0 0 0 \/ #\{0\.25 \* \$mg-switch-disabled-opacity\}\);/,
    'Aria-disabled thumb shadow changed'
  );
  guard(
    aria.slice(0, aria.indexOf('.mg-switch__thumb')),
    /^(?![\s\S]*\n\s*opacity:)/,
    'Aria-disabled track gained opacity'
  );
  guard(
    input,
    /&:disabled ~ \.mg-switch__label,\s*&\[aria-disabled="true"\] ~ \.mg-switch__label\s*\{\s*color:\s*rgb\(var\(--mg-color-neutral-400\)\);/,
    'Disabled label treatment changed'
  );
  for (const [hook, token] of [
    ['track-background', 'neutral-400'],
    ['track-background--checked', 'interactive'],
    ['thumb-background', 'neutral-0'],
    ['track-border-color--error', 'red-900'],
  ])
    guard(
      scss,
      new RegExp(
        `--mg-switch-${hook},\\s*rgb\\(var\\(--mg-color-${token}\\)\\)`
      ),
      `Default hook ${hook} changed`
    );
  guard(
    scss,
    /--mg-switch-track-overlay--disabled,\s*rgb\(var\(--mg-color-neutral-0\) \/ #\{1 - \$mg-switch-disabled-opacity\}\)/,
    'Disabled overlay source changed'
  );
  guard(
    scss,
    /\.mg-switch__input\[aria-invalid="true"\] \+ \.mg-switch__track,\s*\.mg-switch__input--error \+ \.mg-switch__track,\s*\.mg-switch--error \.mg-switch__track\s*\{\s*border-color:\s*\$mg-switch-error;/,
    'Invalid boundary changed'
  );
  if (
    scss.indexOf('.mg-switch__input[aria-invalid="true"]') <
    scss.indexOf('.mg-switch {')
  )
    fail('Invalid source-order cascade changed');
  source(
    stories,
    /const switchMarkup = \(\{ id, label, className = 'mg-switch', \.\.\.input \}\) =>/
  );
  source(stories, /role="switch"\s*className="mg-switch__input"/);
  source(
    stories,
    /<span className="mg-switch__track" aria-hidden="true">\s*<span className="mg-switch__thumb"><\/span>/
  );
  source(stories, /className: 'mg-switch mg-switch--small'/);
  source(stories, /<p\s*className="mg-form-error"/);
  source(
    pending,
    /<\/label>\s*<p className="mg-form-help" id=\{noteId\}>\s*\{note\}/
  );
  for (const [selector, colour, size] of [
    ['.mg-form-help {', 'neutral-500', '200'],
    ['.mg-form-error {', 'red-900', '300'],
  ]) {
    guard(
      block(scss, selector),
      new RegExp(
        `color:\\s*rgb\\(var\\(--mg-color-${colour}\\)\\);\\s*font-size:\\s*var\\(--mg-font-size-${size}\\);\\s*margin-bottom:\\s*0;\\s*margin-top:\\s*var\\(--mg-spacing-25\\);`
      ),
      `${selector} colour, typography or external spacing changed`
    );
  }
  const body = block(
    clean(read('stories/assets/scss/_foundational.scss')),
    'body {'
  );
  guard(
    body,
    /font-family:\s*var\(--mg-font-family-text\);\s*font-size:\s*var\(--mg-font-size-300\);\s*line-height:\s*var\(--mg-font-line-height-700\);/,
    'Body typography changed'
  );
  const byName = new Map(variables.map(v => [v.name, v]));
  function value(name, mode, seen = new Set()) {
    if (seen.has(name)) fail(`Circular alias ${name}`);
    seen.add(name);
    const v = byName.get(name)?.values[mode.id];
    if (v == null) fail(`Missing variable ${name}/${mode.id}`);
    return v.alias ? value(v.alias, mode, seen) : v;
  }
  const perMode = get =>
    Object.fromEntries(modes.map(mode => [mode.id, get(mode)]));
  const ref = source(form, /\.mg-switch\s*\{/),
    geometry = source(form, /\$mg-switch-size:/),
    thumbRef = source(form, /box-shadow: 0 1px 3px rgb\(0 0 0 \/ 0\.25\);/);
  function helper(name, type, get, scopes, description, sourceRef = ref) {
    const full = `component/switch/${name}`;
    if (byName.has(full)) return full;
    const def = {
      id: full.replaceAll('/', '.'),
      name: full,
      type,
      description,
      source: sourceRef,
      scopes,
      hiddenFromPublishing: false,
      codeSyntax: {},
      values: perMode(get),
    };
    if (
      type === 'FLOAT' &&
      Object.values(def.values).some(v => !Number.isFinite(v) || v < 0)
    )
      fail(`Invalid helper ${full}`);
    variables.push(def);
    byName.set(full, def);
    return full;
  }
  const num = (name, get, scopes, description, sourceRef) =>
    helper(name, 'FLOAT', get, scopes, description, sourceRef);
  const opacity = num(
    'disabled-opacity',
    () => 45,
    ['OPACITY'],
    'Source native :disabled opacity0.45. Native Figma opacity variables store percent; only the track, not the root or label, is dimmed.'
  );
  const minimum = num(
    'minimum-row-height',
    () => 36,
    ['WIDTH_HEIGHT'],
    'Source switch min-height mg-rem(36), independent of default or Small graphic size.'
  );
  const widths = {};
  for (const width of [320, 240])
    widths[width] = num(
      `specimen-width-${width}`,
      () => width,
      ['WIDTH_HEIGHT'],
      `Finite ${width}px feedback consumer. Source switch itself is inline-flex; this outer width is a measured composition boundary, not a public width role.`
    );
  const zero = num(
    'zero',
    () => 0,
    ['WIDTH_HEIGHT', 'CORNER_RADIUS', 'EFFECT_FLOAT'],
    'Zero travel in the source unchecked position and zero shadow offset/spread.'
  );
  const shadowY = num(
    'thumb-shadow-offset-y',
    () => 1,
    ['EFFECT_FLOAT'],
    'Source thumb box-shadow offset 0 1px.',
    thumbRef
  );
  const blur = num(
    'thumb-shadow-blur',
    () => 3,
    ['EFFECT_FLOAT'],
    'Source thumb box-shadow blur3px; native effect appearance needs visual acceptance.',
    thumbRef
  );
  const shadowColours = {};
  for (const ariaDisabled of [false, true])
    shadowColours[ariaDisabled] = helper(
      `thumb-shadow-${ariaDisabled ? 'aria-disabled' : 'normal'}-colour`,
      'COLOR',
      () => ({
        r: 0,
        g: 0,
        b: 0,
        a: ariaDisabled ? 0.1125 : 0.25,
      }),
      ['EFFECT_COLOR'],
      `Source literal black thumb shadow alpha${ariaDisabled ? '0.25 × 0.45 = 0.1125' : '0.25'}. Mangrove color/black is not literal rgb(0 0 0).`,
      thumbRef
    );
  const washes = {};
  for (const checked of [false, true])
    washes[checked] = helper(
      `aria-disabled-${checked ? 'on' : 'off'}-surface`,
      'COLOR',
      mode => {
        const base = value(
            checked ? 'color/interactive' : 'color/neutral-400',
            mode
          ),
          wash = value('color/neutral-0', mode);
        return {
          r: base.r * 0.45 + wash.r * 0.55,
          g: base.g * 0.45 + wash.g * 0.55,
          b: base.b * 0.45 + wash.b * 0.55,
          a: 1,
        };
      },
      ['FRAME_FILL'],
      'Opaque equivalent of source neutral-0 alpha0.55 uniform background wash over the retained off/on base. The opaque invalid border is not washed; focus and thumb are independent.'
    );
  const shadows = {};
  for (const ariaDisabled of [false, true]) {
    const id = `component.switch.thumb-shadow${ariaDisabled ? '.aria-disabled' : ''}`,
      def = {
        id,
        name: `Mangrove/component/switch/thumb-shadow${ariaDisabled ? '/aria-disabled' : ''}`,
        component: true,
        source: thumbRef,
        description:
          'Source thumb-only 0 1px 3px literal-black drop shadow. It is distinct from raised/inset styles.',
        values: perMode(mode => [
          {
            effect: {
              type: 'DROP_SHADOW',
              color: value(shadowColours[ariaDisabled], mode),
              offset: {
                x: 0,
                y: 1,
              },
              radius: 3,
              spread: 0,
              visible: true,
              blendMode: 'NORMAL',
            },
            bindings: {
              color: shadowColours[ariaDisabled],
              offsetX: zero,
              offsetY: shadowY,
              radius: blur,
              spread: zero,
            },
          },
        ]),
      };
    const index = styles.effect.findIndex(s => s.id === id);
    if (index < 0) styles.effect.push(def);
    else styles.effect[index] = def;
    shadows[ariaDisabled] = id;
  }
  for (const [id, size] of [
    ['component.body', '300'],
    ['component.error', '300'],
    ['component.help', '200'],
  ]) {
    const style = styles.text.find(s => s.id === id);
    if (
      style?.bindings?.fontFamily !== 'font-family/text' ||
      style?.bindings?.fontSize !== `font-size/${size}`
    )
      fail(`Shared ${id} bindings changed`);
    for (const mode of modes) {
      const v = style.values[mode.id];
      if (
        v?.fontName?.style !== 'Regular' ||
        v.fontName.family !== 'Roboto' ||
        v.lineHeight?.unit !== 'PIXELS' ||
        v.lineHeight.value !== 24
      )
        fail(`Shared ${id} typography changed in ${mode.id}`);
    }
  }
  for (const mode of modes)
    if (
      value('font-family/text', mode) !== 'Roboto' ||
      value('font-size/300', mode) !== 16
    )
      fail(
        `Source Latin text baseline changed in ${mode.id}; remeasure Switch`
      );
  const switchSizes = new Map();
  for (const Size of ['Default', 'Small']) {
    const slug = Size.toLowerCase(),
      blockSize = num(
        `${slug}/track-block-size`,
        () => (Size === 'Small' ? 18 : 24),
        ['WIDTH_HEIGHT'],
        'Source default mg-rem(24) or mg-switch--small mg-rem(18).',
        geometry
      );
    const trackWidth = num(
      `${slug}/track-inline-size`,
      mode => value(blockSize, mode) * 1.75,
      ['WIDTH_HEIGHT'],
      'Source track block size × 1.75.',
      geometry
    );
    const authoredInset = num(
      `${slug}/authored-inset`,
      mode => value(blockSize, mode) / 12,
      ['STROKE_FLOAT', 'GAP'],
      'Source track inset = block size / 12. Small authored inset is1.5px; the measured browser used border is stored separately.',
      geometry
    );
    const border = num(
      `${slug}/browser-used-border`,
      mode => (Size === 'Small' ? 1 : value(authoredInset, mode)),
      ['STROKE_FLOAT', 'GAP'],
      'Chrome153/macOS uses1px for the Small source1.5px border. Native preset preserves that baseline and does not change the authored helper. Other engines require measurement.',
      geometry
    );
    const thumbSize = num(
      `${slug}/thumb-size`,
      mode => value(blockSize, mode) - 2 * value(authoredInset, mode),
      ['WIDTH_HEIGHT'],
      'Source thumb uses authored inset, not browser border quantisation.',
      geometry
    );
    const travel = num(
      `${slug}/thumb-travel`,
      mode =>
        value(trackWidth, mode) -
        value(thumbSize, mode) -
        2 * value(authoredInset, mode),
      ['WIDTH_HEIGHT'],
      'Checked source translateX travel. A native leading spacer preserves Small x14.5 versus incorrect end alignment.',
      geometry
    );
    const radius = num(
      `${slug}/track-radius`,
      mode => value(blockSize, mode) / 2,
      ['CORNER_RADIUS'],
      'Source pill radius: half the track block size.',
      geometry
    );
    const outerRadius = num(
      `${slug}/focus-outer-radius`,
      mode => value(radius, mode) + value('focus-ring/offset', mode),
      ['CORNER_RADIUS'],
      'Source track radius plus the source focus separator offset. Focus stays outside the independently painted track.'
    );
    switchSizes.set(Size, {
      slug,
      blockSize,
      trackWidth,
      authoredInset,
      border,
      thumbSize,
      travel,
      radius,
      outerRadius,
    });
  }
  return {
    form,
    stories,
    pending,
    files,
    read,
    fail,
    source,
    clean,
    guard,
    block,
    scss,
    sw,
    base,
    input,
    track,
    thumb,
    label,
    small,
    aria,
    body,
    byName,
    value,
    perMode,
    ref,
    geometry,
    thumbRef,
    helper,
    num,
    opacity,
    minimum,
    widths,
    zero,
    shadowY,
    blur,
    shadowColours,
    washes,
    shadows,
    switchSizes,
  };
}
module.exports = {
  buildSwitchAssets,
};
