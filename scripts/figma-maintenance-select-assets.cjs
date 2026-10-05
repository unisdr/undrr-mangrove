/** Source-owned closed native Select. Short values only; no invented option menu. */
'use strict';

const fs = require('fs');
const path = require('path');
function buildSelectAssets({ root, modes, variables, styles }) {
  const baseFile = 'stories/Components/Forms/_form-base.scss';
  const jsxFile = 'stories/Components/Forms/Select/Select.jsx';
  const selectFile = 'stories/Components/Forms/Select/select.scss';
  const normalizeFile = 'stories/Utilities/Normalize/normalize.scss';
  const files = new Map();
  const read = file => {
    if (!files.has(file))
      files.set(file, fs.readFileSync(path.join(root, file), 'utf8'));
    return files.get(file);
  };
  const fail = message => {
    throw new Error(`Figma closed Select recipe needs updating: ${message}`);
  };
  const source = (file, pattern) => {
    const match = pattern.exec(read(file));
    if (!match) fail(`${file} no longer matches ${pattern}`);
    return {
      match,
      file,
      line: read(file).slice(0, match.index).split('\n').length,
    };
  };
  const base = read(baseFile);
  const start = base.indexOf('.mg-form-select {');
  const end = base.indexOf('// Checkbox / Radio shared', start);
  if (start < 0 || end < 0) fail('Select source block was not found');
  const select = base.slice(start, end);
  for (const pattern of [
    /appearance:\s*none;/,
    /background-color:\s*var\(--mg-form-input-background\);/,
    /border:\s*var\(--mg-form-input-border-width\) solid\s*var\(--mg-form-input-border-color\);/,
    /border-radius:\s*var\(--mg-radius-form-input\);/,
    /font-family:\s*var\(--mg-font-family-text\);\s*font-size:\s*var\(--mg-font-size-form-input\);/,
    /height:\s*var\(--mg-form-input-block-size\);\s*margin-top:\s*var\(--mg-spacing-25\);\s*padding:\s*var\(--mg-form-input-padding\);\s*padding-right:\s*var\(--mg-spacing-200\);\s*width:\s*100%;/,
    /background-position:\s*right mg-rem\(6\.25\) center;\s*background-repeat:\s*no-repeat;/,
    /&:focus-visible\s*{\s*background-color:\s*var\(--mg-form-input-background--focus\);\s*border-color:\s*rgb\(var\(--mg-color-form-focus\)\);\s*@include mg-focus-ring;/,
    /&--disabled\s*{\s*background-color:\s*rgb\(var\(--mg-color-white\)\);\s*border-color:\s*rgb\(var\(--mg-color-neutral-400\)\);\s*color:\s*rgb\(var\(--mg-color-neutral-400\)\);\s*cursor:\s*default;\s*}/,
    /&--error\s*{\s*border-color:\s*rgb\(var\(--mg-color-red-900\)\);\s*}/,
  ])
    if (!pattern.test(select))
      fail(`Select source no longer matches ${pattern}`);
  if (/&:hover|placeholder-shown|&::placeholder/.test(select))
    fail('Select acquired additional visual states');
  const image = source(
    baseFile,
    /background-image:\s*url\("data:image\/svg\+xml,([^"\n]+)"\);/
  );
  const markup = decodeURIComponent(image.match[1]);
  if (
    !/^<svg xmlns='http:\/\/www\.w3\.org\/2000\/svg' width='12' height='8' viewBox='0 0 12 8'><path fill='#1a1a1a' d='M1\.41 0L6 4\.58 10\.59 0 12 1\.41l-6 6-6-6z'\/><\/svg>$/.test(
      markup
    )
  )
    fail('Source chevron changed; review SVG identity and native geometry');
  source(selectFile, /\[dir="rtl"\]/);
  for (const pattern of [
    /disabled && 'mg-form-select--disabled'/,
    /error && 'mg-form-select--error'/,
    /required && 'mg-form-label--required'/,
    /hideLabel && 'mg-u-sr-only'/,
    /<select[\s\S]*?value=\{value\}[\s\S]*?defaultValue=\{defaultValue\}/,
    /<option value="" disabled>/,
    /\{helpText && \(/,
    /\{error && errorText && \(/,
  ])
    source(jsxFile, pattern);
  source(
    baseFile,
    /&--required::after\s*{\s*color:\s*rgb\(var\(--mg-color-red-900\)\);\s*content:\s*" \*";/
  );
  source(
    baseFile,
    /\.mg-form-help\s*{\s*color:\s*rgb\(var\(--mg-color-neutral-500\)\);\s*font-size:\s*var\(--mg-font-size-200\);\s*margin-bottom:\s*0;\s*margin-top:\s*var\(--mg-spacing-25\);/
  );
  source(
    baseFile,
    /\.mg-form-error\s*{\s*color:\s*rgb\(var\(--mg-color-red-900\)\);\s*font-size:\s*var\(--mg-font-size-300\);\s*margin-bottom:\s*0;\s*margin-top:\s*var\(--mg-spacing-25\);/
  );
  const normalize = source(
    normalizeFile,
    /button,\s*input,\s*optgroup,\s*select,\s*textarea\s*{[^}]*line-height:\s*([\d.]+)\s*;/
  );
  const ratio = Number(normalize.match[1]);
  source(
    'stories/assets/fonts/roboto/sass/_Regular.scss',
    /font-weight:\s*400;/
  );
  const ref = {
    file: baseFile,
    line: image.line,
  };
  const byName = new Map(variables.map(variable => [variable.name, variable]));
  function value(name, mode, seen = new Set()) {
    if (seen.has(name)) fail(`Circular variable ${name}`);
    seen.add(name);
    const variable = byName.get(name);
    const resolved = variable?.values[mode.id];
    if (resolved == null) fail(`Missing variable ${name}/${mode.id}`);
    return resolved.alias ? value(resolved.alias, mode, seen) : resolved;
  }
  const perMode = get =>
    Object.fromEntries(modes.map(mode => [mode.id, get(mode)]));
  function helper(name, get, description) {
    const full = `component/select/${name}`;
    const definition = {
      id: full.replaceAll('/', '.'),
      name: full,
      type: 'FLOAT',
      scopes: [/opacity/.test(name) ? 'OPACITY' : 'WIDTH_HEIGHT'],
      hiddenFromPublishing: false,
      description,
      source: ref,
      codeSyntax: {},
      values: perMode(get),
    };
    if (Object.values(definition.values).some(v => !Number.isFinite(v)))
      fail(`Non-finite helper ${name}`);
    const index = variables.findIndex(v => v.name === full);
    if (index < 0) variables.push(definition);
    else variables[index] = definition;
    byName.set(full, definition);
    return full;
  }
  const offset = helper(
    'chevron-end-offset',
    mode => -(6.25 + value('form-input/border-width', mode)),
    'Source CSS background-position:right6.25px center in the padding-box. Native absolute END uses the border-box, so includes the source border inset. Initial UNDRR browser320/240 closed faces measured; native visual alignment remains unverified.'
  );
  const disabledOpacity = helper(
    'browser-disabled-opacity',
    () => 0.7 * 100,
    'Measured Chromium153.0.8010.47/macOS user-agent select:disabled opacity0.7, not authored SCSS. Figma OPACITY variables store percentages, so70 maps to native0.7. Apply once to the disabled control including its value, border and original-colour SVG; label/help remain full opacity. Shared brand values describe this browser baseline only; other browsers, platforms and all-brand rendered parity remain unverified.'
  );
  const disabledRef = source(jsxFile, /disabled=\{disabled\}/);
  byName.get(disabledOpacity).source = {
    file: disabledRef.file,
    line: disabledRef.line,
  };
  byName.get(disabledOpacity).observation = {
    date: '2026-10-04',
    browser: 'Chromium',
    version: '153.0.8010.47',
    platform: 'macOS',
    origin: 'user-agent',
    selector: 'select:disabled',
    property: 'opacity',
    computedValue: 0.7,
    authoredInSource: false,
    coverage:
      'UNDRR closed short-value Select; other browser/platform/brand rendered parity unverified.',
  };
  source(
    'stories/assets/scss/_foundational.scss',
    /body\s*{[^}]*line-height:\s*var\(--mg-font-line-height-700\);/
  );
  const bodyRatio = Number(
    require('yaml')
      .parse(read('tokens/mangrove.yaml'))
      ['font-line-height']['700'].$value.replace(/em$/, '')
  );
  if (!Number.isFinite(bodyRatio)) fail('Body em line-height changed units');
  function exactStyle(id, size, input = false) {
    const style = styles.text.find(style => style.id === id);
    if (!style) fail(`Missing existing text style ${id}`);
    if (
      style.bindings?.fontFamily !== 'font-family/text' ||
      style.bindings?.fontSize !== `font-size/${size}`
    )
      fail(`Existing text style ${id} bindings differ`);
    for (const mode of modes) {
      const text = style.values[mode.id];
      const expectedHeight = input
        ? {
            unit: 'PERCENT',
            value: Number((ratio * 100).toFixed(6)),
          }
        : {
            unit: 'PIXELS',
            value: value('font-size/300', mode) * bodyRatio,
          };
      if (
        text?.fontName?.family !== value('font-family/text', mode) ||
        text.fontName.style !== 'Regular' ||
        text.fontSize !== value(`font-size/${size}`, mode) ||
        text.lineHeight?.unit !== expectedHeight.unit ||
        text.lineHeight.value !== expectedHeight.value ||
        (text.textDecoration && text.textDecoration !== 'NONE') ||
        (text.textWrapStyle && text.textWrapStyle !== 'AUTO')
      )
        fail(`Existing text style ${id}/${mode.id} differs from Select source`);
    }
    return id;
  }
  return {
    baseFile,
    jsxFile,
    selectFile,
    normalizeFile,
    files,
    read,
    fail,
    source,
    base,
    start,
    end,
    select,
    image,
    markup,
    normalize,
    ratio,
    ref,
    byName,
    value,
    perMode,
    helper,
    offset,
    disabledOpacity,
    disabledRef,
    bodyRatio,
    exactStyle,
  };
}
module.exports = {
  buildSelectAssets,
};
