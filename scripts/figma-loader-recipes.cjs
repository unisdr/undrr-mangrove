/** Source-owned static Loader presets. Rotation and responsive switching are not native behavior. */
'use strict';
const fs = require('fs');
const path = require('path');

function buildLoaderRecipes({ root, modes, variables }) {
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
    return { file, line: text.slice(0, match.index).split('\n').length };
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
  const variants = [
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
    return {
      id: `loader.${suffix}`,
      name: `Viewport=${Viewport}`,
      properties: { Viewport },
      sourceRef,
      sourceGeometry: {
        borderWidth: border,
        innerRadius: (side - 2 * border) / side,
        rotationDegrees: 0,
      },
      tree: {
        type: 'FRAME',
        id: 'root',
        name: 'mg-loader',
        layout: {
          mode: 'NONE',
          width: size,
          height: size,
          clipsContent: false,
        },
        children: [
          {
            type: 'ELLIPSE',
            id: 'body',
            name: 'Blue border',
            fill: 'color/blue-600',
            arcData: {
              startingAngle: (7 * Math.PI) / 4,
              endingAngle: (13 * Math.PI) / 4,
              innerRadius: (side - 2 * border) / side,
            },
            layout: { width: size, height: size },
            position: { x: 0, y: 0 },
          },
          {
            type: 'ELLIPSE',
            id: 'top',
            name: 'Neutral top border',
            fill: 'color/neutral-300',
            arcData: {
              startingAngle: (5 * Math.PI) / 4,
              endingAngle: (7 * Math.PI) / 4,
              innerRadius: (side - 2 * border) / side,
            },
            layout: { width: size, height: size },
            position: { x: 0, y: 0 },
          },
        ],
      },
    };
  });
  return [
    {
      id: 'loader',
      name: 'Mangrove/Loader',
      kind: 'component-set',
      sourceRef: anatomy,
      review: { genericLabels: false, preserveVariantSizing: true },
      limitations: [
        'Static zero-degree source frame only. Source rotation2s linear infinite and reduced-motion behavior are documented, not prototyped.',
        'BelowMedium/MediumUp are explicit40/96px presets, not live48em responsive sizing.',
        'Native annular sector innerRadius has no variable binding. Geometry changes require regeneration; arbitrary size/ring edits are not responsive CSS.',
        'The source accessible label is hidden and is not fabricated as visible text. Screen-reader/live-region semantics belong to code.',
        'CSS border joins and native ellipse rasterization require actual source/native comparison; mocks do not establish pixel equivalence.',
      ],
      variants,
    },
  ];
}
module.exports = { buildLoaderRecipes };
