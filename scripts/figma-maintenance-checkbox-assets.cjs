/** Source-owned Checkbox recipes, including the source repeated SVG background. */
const fs = require('fs');
const path = require('path');
function buildCheckboxAssets({ root, modes, variables, styles }) {
  const form = 'stories/Components/Forms/_form-base.scss';
  const jsx = 'stories/Components/Forms/Checkbox/Checkbox.jsx';
  const scss = 'stories/Components/Forms/Checkbox/checkbox.scss';
  const read = file => fs.readFileSync(path.join(root, file), 'utf8');
  const fail = message => {
    throw new Error(`Figma Checkbox recipe needs updating: ${message}`);
  };
  const sourceText = read(form);
  const css = sourceText.replace(/\/\*[\s\S]*?\*\/|^\s*\/\/[^\n]*$/gm, '');
  function requireMatch(text, pattern, message) {
    const result = pattern.exec(text);
    if (!result) fail(message);
    return result;
  }
  function ref(pattern) {
    const found = requireMatch(sourceText, pattern, 'Missing source reference');
    return {
      file: form,
      line: sourceText.slice(0, found.index).split('\n').length,
    };
  }
  requireMatch(
    css,
    /\.mg-form-check\s*\{\s*align-items:\s*center;\s*display:\s*flex;\s*min-height:\s*mg-rem\(40\);\s*position:\s*relative;/,
    'Shared row geometry changed'
  );
  requireMatch(
    css,
    /&__input\s*\{\s*appearance:\s*none;\s*border:\s*2px solid rgb\(var\(--mg-color-form-check\)\);\s*cursor:\s*pointer;\s*height:\s*mg-rem\(24\);\s*margin:\s*0;\s*width:\s*mg-rem\(24\);/,
    'Shared control geometry changed; remeasure background tiles and narrow presets'
  );
  requireMatch(
    css,
    /&--checkbox\s*\{\s*border-radius:\s*var\(--mg-radius-form-input\);\s*\}/,
    'Checkbox radius changed'
  );
  const checked = requireMatch(
    css,
    /\.mg-form-check__input--checkbox:checked\s*\{\s*background-color:\s*rgb\(var\(--mg-color-form-check--checked\)\);\s*background-image:\s*url\("data:image\/svg\+xml,([^"\n]+)"\);\s*border-color:\s*rgb\(var\(--mg-color-form-check--checked\)\);\s*\}/,
    'Checked fill, SVG background or border cascade changed'
  );
  if (
    css.indexOf('.mg-form-check__input--checkbox:checked') <
    css.indexOf('&--error')
  )
    fail('Checked selector no longer follows invalid/disabled');
  const markup = decodeURIComponent(checked[1]);
  requireMatch(
    markup,
    /^<svg xmlns='http:\/\/www\.w3\.org\/2000\/svg' viewBox='0 0 16 16'><path fill='none' stroke='#fff' stroke-width='2\.5' stroke-linecap='round' stroke-linejoin='round' d='M3\.5 8l3 3 6-6'\/><\/svg>$/,
    'Source checkmark changed; remeasure SVG viewport and repeated background geometry'
  );
  const groupStart = css.indexOf('.mg-form-check {');
  const checkedEnd = checked.index + checked[0].length;
  if (
    /flex-shrink\s*:|background-(?:size|repeat|origin|position|clip)\s*:/.test(
      css.slice(groupStart, checkedEnd)
    )
  )
    fail('Source flex or SVG background defaults changed');
  requireMatch(
    css,
    /&__label\s*\{\s*cursor:\s*pointer;\s*font-size:\s*var\(--mg-font-size-300\);\s*padding:\s*0 7px;/,
    'Label size or padding changed'
  );
  requireMatch(
    read(jsx),
    /disabled && 'mg-form-check__input--disabled',\s*error && 'mg-form-check__input--error'/,
    'Modifier contract changed'
  );
  requireMatch(
    read(jsx),
    /\{labelPosition === 'before' && labelElement\}[\s\S]*?<input[\s\S]*?type="checkbox"[\s\S]*?\{labelPosition === 'after' && labelElement\}[\s\S]*?\{error && errorText && \(\s*<p className="mg-form-error"/,
    'Label/error anatomy changed'
  );
  if (
    read(scss)
      .replace(/\/\*[\s\S]*?\*\/|^\s*\/\/[^\n]*$/gm, '')
      .trim()
  )
    fail('Checkbox-specific SCSS now has overrides');
  requireMatch(
    read(jsx),
    /export function Checkbox\(/,
    'Checkbox export changed'
  );
  const byName = new Map(variables.map(item => [item.name, item]));
  function value(name, mode, visited = new Set()) {
    if (visited.has(name)) fail(`Circular alias ${name}`);
    visited.add(name);
    const resolved = byName.get(name)?.values[mode.id];
    if (resolved == null) fail(`Missing ${name}/${mode.id}`);
    return resolved.alias ? value(resolved.alias, mode, visited) : resolved;
  }
  for (const id of ['component.body', 'component.error']) {
    const style = styles.text.find(item => item.id === id);
    if (
      !style ||
      modes.some(mode => {
        const paint = style.values[mode.id];
        return (
          paint?.fontName?.family !== 'Roboto' ||
          paint.fontName.style !== 'Regular' ||
          paint.fontSize !== 16 ||
          paint.lineHeight?.unit !== 'PIXELS' ||
          paint.lineHeight.value !== 24
        );
      })
    )
      fail('Shared choice label/error typography changed; remeasure source');
  }
  const inputRef = ref(/&__input\s*\{/);
  function helper(name, get, scopes, description, source = inputRef) {
    const full = `component/checkbox/${name}`;
    const spec = {
      id: full.replaceAll('/', '.'),
      name: full,
      type: 'FLOAT',
      source,
      description,
      scopes,
      hiddenFromPublishing: false,
      codeSyntax: {},
      values: Object.fromEntries(modes.map(mode => [mode.id, get(mode)])),
    };
    if (Object.values(spec.values).some(n => !Number.isFinite(n) || n < 0))
      fail(`Invalid ${full}`);
    const existing = byName.get(full);
    if (!existing) {
      variables.push(spec);
      byName.set(full, spec);
    } else if (
      existing.type !== spec.type ||
      JSON.stringify(existing.values) !== JSON.stringify(spec.values)
    )
      fail(`Stale helper ${full}`);
    return full;
  }
  const size = helper(
    'control-size',
    () => 24,
    ['WIDTH_HEIGHT'],
    'Shared source Checkbox width/height mg-rem(24). Narrow presets separately record source flex shrink.'
  );
  const border = helper(
    'border-width',
    () => 2,
    ['STROKE_FLOAT'],
    'Shared source 2px Checkbox border. Checked overrides both its fill and border after invalid/disabled rules.'
  );
  const minimum = helper(
    'minimum-row-height',
    () => 40,
    ['WIDTH_HEIGHT'],
    'Source .mg-form-check minimum height, not a fixed height.',
    ref(/\.mg-form-check\s*\{/)
  );
  const padding = helper(
    'label-inline-padding',
    () => 7,
    ['GAP'],
    'Source label inline padding, shared by both label orders.',
    ref(/&__label\s*\{/)
  );
  const outerRadius = helper(
    'focus-outer-radius',
    mode => value('radius/form-input', mode) + value('focus-ring/offset', mode),
    ['CORNER_RADIUS'],
    'Source rounded-checkbox focus wrapper radius plus separator offset; native outline geometry remains outside the clipped control.'
  );
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
        'Measured Chromium 153/macOS source Checkbox width in the documented 240px English long-label/inline-error fixture. Content-specific, not a CSS flex algorithm.'
      ),
      label: helper(
        `source-narrow-${slug}-label-width`,
        () => widths[1],
        ['WIDTH_HEIGHT'],
        'Measured source outer label width, including both 7px paddings; native text/row height hugs content.'
      ),
      ...(widths[2]
        ? {
            error: helper(
              `source-narrow-${slug}-error-width`,
              () => widths[2],
              ['WIDTH_HEIGHT'],
              'Measured inline source error width in the 240px long-label fixture; margin-top remains 2.5px.'
            ),
          }
        : {}),
      measuredControl: widths[0],
    };
  }
  return {
    form,
    jsx,
    scss,
    read,
    fail,
    sourceText,
    css,
    requireMatch,
    ref,
    checked,
    markup,
    groupStart,
    checkedEnd,
    byName,
    value,
    inputRef,
    helper,
    size,
    border,
    minimum,
    padding,
    outerRadius,
    narrow,
  };
}
module.exports = {
  buildCheckboxAssets,
};
