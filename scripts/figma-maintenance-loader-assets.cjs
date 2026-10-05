/** Source-owned static Loader presets. Rotation and responsive switching are not native behavior. */
'use strict';

const fs = require('fs');
const path = require('path');
function buildLoaderAssets({ root, modes, variables }) {
  const scss = 'stories/Utilities/Loader/loader.scss';
  const jsx = 'stories/Utilities/Loader/Loader.jsx';
  const breakpoint = 'stories/assets/scss/_breakpoints.scss';
  const foundation = 'stories/assets/scss/_foundational.scss';
  const read = file => fs.readFileSync(path.join(root, file), 'utf8');
  const fail = message => {
    throw new Error(`Figma Loader recipe needs updating: ${message}`);
  };
  const source = (file, pattern) => {
    const text = read(file),
      match = pattern.exec(text);
    if (!match) fail(`${file} no longer matches ${pattern}`);
    return {
      file,
      line: text.slice(0, match.index).split('\n').length,
    };
  };
  const mobile = source(
    scss,
    /border: 8px solid rgb\(var\(--mg-color-blue-600\)\);\s*border-radius: 50%;\s*border-top: 8px solid rgb\(var\(--mg-color-neutral-300\)\);\s*height: 40px;\s*width: 40px;/
  );
  const clean = read(scss).replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '');
  if (
    !/\.mg-loader\s*\{\s*@include animation\(loader-animation 2s linear infinite\);\s*border: 8px solid rgb\(var\(--mg-color-blue-600\)\);\s*border-radius: 50%;\s*border-top: 8px solid rgb\(var\(--mg-color-neutral-300\)\);\s*height: 40px;\s*width: 40px;\s*@include devicebreak\(medium\) \{\s*border: 14px solid rgb\(var\(--mg-color-blue-600\)\);\s*border-top: 14px solid rgb\(var\(--mg-color-neutral-300\)\);\s*height: 96px;\s*width: 96px;\s*\}\s*\}/.test(
      clean
    )
  )
    fail('Loader anatomy, background or complete responsive rule changed');
  const desktop = source(
    scss,
    /@include devicebreak\(medium\) \{\s*border: 14px solid rgb\(var\(--mg-color-blue-600\)\);\s*border-top: 14px solid rgb\(var\(--mg-color-neutral-300\)\);\s*height: 96px;\s*width: 96px;\s*\}/
  );
  source(scss, /@include animation\(loader-animation 2s linear infinite\);/);
  source(
    scss,
    /@keyframes loader-animation \{\s*0% \{\s*transform: rotate\(0deg\);\s*\}\s*100% \{\s*transform: rotate\(360deg\);\s*\}\s*\}/
  );
  source(
    breakpoint,
    /\$point == medium \{\s*\/\* medium design \*\/\s*@media \(width >= 48em\)/
  );
  source(
    foundation,
    /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?animation-duration: 0\.01ms !important;\s*animation-iteration-count: 1 !important;/
  );
  const anatomy = source(
    jsx,
    /<div\s+className=\{classes\}\s+aria-busy="true"\s+aria-live="polite"\s+aria-label=\{label\}\s+role="status"\s*\/>/
  );
  source(
    jsx,
    /export function Loader\(\{ label = 'Loading', className = '' \}\)/
  );
  source(
    foundation,
    /\*,\s*\*::before,\s*\*::after \{\s*box-sizing: border-box;/
  );
  for (const role of ['color/blue-600', 'color/neutral-300'])
    if (
      variables.filter(v => v.name === role && v.type === 'COLOR').length !== 1
    )
      fail(`Missing or ambiguous COLOR ${role}`);
  const number = (name, value, scopes, description, sourceRef) => {
    const fullName = `component/loader/${name}`;
    const entry = {
      id: `component.loader.${name}`,
      name: fullName,
      type: 'FLOAT',
      description,
      sourceRef,
      scopes,
      hiddenFromPublishing: false,
      codeSyntax: {},
      values: Object.fromEntries(modes.map(mode => [mode.id, value])),
    };
    const index = variables.findIndex(v => v.name === fullName);
    if (index < 0) variables.push(entry);
    else variables[index] = entry;
    return fullName;
  };
  const presets = [
    ['BelowMedium', 40, 8, mobile],
    ['MediumUp', 96, 14, desktop],
  ].map(([Viewport, side, border, sourceRef]) => {
    const suffix = Viewport === 'BelowMedium' ? 'below-medium' : 'medium-up';
    const size = number(
      `size-${suffix}`,
      side,
      ['WIDTH_HEIGHT'],
      `Source fixed ${side}px border-box; explicit ${Viewport} preset. Resizing does not execute the48em media query.`,
      sourceRef
    );
    return [Viewport, side, border, sourceRef, size];
  });
  return {
    scss,
    jsx,
    breakpoint,
    foundation,
    read,
    fail,
    source,
    mobile,
    clean,
    desktop,
    anatomy,
    number,
    presets,
  };
}
module.exports = {
  buildLoaderAssets,
};
