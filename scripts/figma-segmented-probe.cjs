/** Source-owned diagnostic packet. This creates no variables, styles or families. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const YAML = require('yaml');
const tokens = require('./build-tokens.cjs');

function buildSegmentedJoiningCapability({ root, modes, variables, styles }) {
  const fail = message => {
    throw new Error(`Figma SegmentedControl probe needs updating: ${message}`);
  };
  const read = file => fs.readFileSync(path.join(root, file), 'utf8');
  const clean = text =>
    text
      .replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  const hash = text =>
    crypto.createHash('sha256').update(clean(text)).digest('hex');
  const sourceRefs = [];
  function source(file, expression) {
    const text = read(file),
      match = expression.exec(text);
    if (!match) fail(`Source contract changed in ${file}: ${expression}`);
    const ref = { file, line: text.slice(0, match.index).split('\n').length };
    sourceRefs.push(ref);
    return match;
  }
  const jsx = 'stories/Components/Forms/SegmentedControl/SegmentedControl.jsx';
  const story =
    'stories/Components/Forms/SegmentedControl/SegmentedControl.stories.jsx';
  const scss =
    'stories/Components/Forms/SegmentedControl/segmented-control.scss';
  for (const [file, expected, expression] of [
    [
      jsx,
      'e562e7546639317620e8e408f236ca39ec9f091e23d626ae815a197cf973f7c0',
      /export function SegmentedControl/,
    ],
    [
      story,
      '1ac9c2eb09f7c1cfdbfd8ab83449cb7c287405af9b240360f4b8bfca86822b4c',
      /export const Default/,
    ],
    [
      scss,
      '2a31716377e69ca821fcb3f1eb07500b99fa0deb916bb02be603810a51cad459',
      /\.mg-segmented-control \{/,
    ],
  ]) {
    if (hash(read(file)) !== expected)
      fail(`Complete normalized ${file} changed; remeasure source`);
    source(file, expression);
    sourceRefs.at(-1).normalizedSha256 = expected;
  }
  // The complete stylesheet guard includes state order/specificity, logical
  // corner selectors, negative seams, wrapping and forced-colour overrides.
  const minHeight = Number(
    source(
      scss,
      /--mg-segmented-control-min-block-size,\s*#\{mg-rem\(([\d.]+)\)\}/
    )[1]
  );
  const lineRatio = Number(source(scss, /line-height: ([\d.]+);/)[1]);
  const requestedWeight = Number(source(scss, /font-weight: (\d+);/)[1]);
  source(
    scss,
    /margin-inline-start: calc\(-1 \* var\(--mg-border-width-button\)\)/
  );
  source(scss, /font-size: var\(--mg-font-size-button\)/);
  source(scss, /padding: var\(--mg-padding-button\)/);
  source(scss, /flex-wrap: wrap/);
  source(scss, /flex: 1 1 0/);
  source(scss, /@include mg-focus-ring/);
  const importedFonts = 'stories/assets/fonts/roboto/roboto.scss';
  source(importedFonts, /@import "sass\/Bold"/);
  source(importedFonts, /@import "sass\/Regular"/);
  const bundledWeight = Number(
    source(
      'stories/assets/fonts/roboto/sass/_Bold.scss',
      /font-family: Roboto;[\s\S]*?font-weight: (\d+);\s*font-style: normal/
    )[1]
  );
  source(
    'stories/assets/fonts/roboto/sass/_Regular.scss',
    /font-family: Roboto;[\s\S]*?font-weight: 400;\s*font-style: normal/
  );
  if (
    requestedWeight !== 600 ||
    bundledWeight !== 700 ||
    lineRatio !== 1.2 ||
    minHeight !== 44
  )
    fail('Default typography or fallback dimensions changed');
  const foundational = 'stories/assets/scss/_foundational.scss';
  source(
    foundational,
    /body \{\s*color: rgb\(var\(--mg-color-text\)\);\s*font-family: var\(--mg-font-family-text\);\s*font-size: var\(--mg-font-size-300\);\s*line-height: var\(--mg-font-line-height-700\);\s*\}/
  );
  const mixins = 'stories/assets/scss/_mixins.scss';
  source(
    mixins,
    /%paragraph-font-300 \{\s*font-size: var\(--mg-font-size-300\);\s*@include devicebreak\(medium\) \{\s*font-size: var\(--mg-font-size-400\);\s*\}\s*\}/
  );
  source(
    mixins,
    /box-shadow: 0 0 0 var\(--mg-focus-ring-offset\) rgb\(var\(--mg-color-neutral-0\)\);\s*outline: var\(--mg-focus-ring-width\) solid rgb\(var\(--mg-color-focus-ring\)\);\s*outline-offset: var\(--mg-focus-ring-offset\)/
  );
  const mediumEm = Number(
    source(
      'stories/assets/scss/_breakpoints.scss',
      /\$point == medium \{[\s\S]*?@media \(width >= ([\d.]+)em\)/
    )[1]
  );
  const rootFont = Number(
    source(
      'stories/assets/scss/_variables.scss',
      /\$mg-html-font-size: ([\d.]+);/
    )[1]
  );
  source(
    'stories/assets/scss/_variables.scss',
    /@function mg-rem\(\$px\) \{\s*@return math.div\(\$px, \$mg-html-font-size\) \* 1rem;\s*\}/
  );
  if (mediumEm !== 48 || rootFont !== 16)
    fail('Measured viewport band or rem basis changed');
  const rawSources = tokens.loadSources(path.join(root, 'tokens'));
  const knownModes = new Map(
    rawSources.brands.map(brand => [
      brand.meta.id,
      brand.meta.title || brand.meta.id,
    ])
  );
  if (
    !Array.isArray(modes) ||
    !modes.length ||
    new Set(modes.map(m => m.id)).size !== modes.length ||
    modes.some(m => !knownModes.has(m.id) || knownModes.get(m.id) !== m.name)
  )
    fail('Unknown, empty, duplicate or renamed source modes');
  const bodyRatio = YAML.parse(read('tokens/mangrove.yaml'))[
    'font-line-height'
  ]?.['700']?.$value;
  if (bodyRatio !== '1.5em') fail('Inherited body line-height changed');
  source('tokens/mangrove.yaml', /'700':\s*\$value: '1\.5em'/);
  const byName = new Map(variables.map(v => [v.name, v]));
  if (byName.size !== variables.length) fail('Duplicate source variable names');
  const roleList = {
    fontFamily: ['font-family/text', 'STRING'],
    fontSize: ['font-size/button', 'FLOAT'],
    legendFontSize: ['font-size/300', 'FLOAT'],
    legendMediumFontSize: ['font-size/400', 'FLOAT'],
    paddingBlock: ['padding/button/block', 'FLOAT'],
    paddingInline: ['padding/button/inline', 'FLOAT'],
    border: ['border-width/button', 'FLOAT'],
    radius: ['radius/button', 'FLOAT'],
    zero: ['spacing/0', 'FLOAT'],
    focusOffset: ['focus-ring/offset', 'FLOAT'],
    focusWidth: ['focus-ring/width', 'FLOAT'],
    focusColor: ['color/focus-ring', 'COLOR'],
    separatorColor: ['color/neutral-0', 'COLOR'],
    outline: ['color/button-outline-primary', 'COLOR'],
    outlineHover: ['color/button-outline-primary--hover', 'COLOR'],
    background: ['color/button-background', 'COLOR'],
    backgroundHover: ['color/button-background--hover', 'COLOR'],
    text: ['color/button', 'COLOR'],
    disabledBorder: ['color/neutral-400', 'COLOR'],
    disabledSelected: ['color/neutral-500', 'COLOR'],
    legendColor: ['color/text', 'COLOR'],
  };
  const roles = Object.fromEntries(
    Object.entries(roleList).map(([key, [name, type]]) => {
      const variable = byName.get(name);
      if (
        variable?.type !== type ||
        typeof variable.id !== 'string' ||
        !variable.id
      )
        fail(`Missing or wrong-typed source role ${name}`);
      return [key, { name, id: variable.id, type }];
    })
  );
  function value(name, type, mode, seen = new Set()) {
    if (seen.has(name)) fail(`Source alias cycle at ${name}`);
    seen.add(name);
    const variable = byName.get(name),
      result = variable?.values?.[mode.id];
    if (variable?.type !== type || result === undefined)
      fail(`Missing or wrong-typed alias ${name}/${mode.id}`);
    if (result?.alias) return value(result.alias, type, mode, seen);
    const valid =
      type === 'STRING'
        ? typeof result === 'string'
        : type === 'FLOAT'
          ? Number.isFinite(result) && result >= 0
          : result &&
            ['r', 'g', 'b', 'a'].every(
              k =>
                Number.isFinite(result[k]) && result[k] >= 0 && result[k] <= 1
            );
    if (!valid) fail(`Invalid ${type} role ${name}/${mode.id}`);
    return result;
  }
  const buttonStyles = styles?.text?.filter(
    style => style.id === 'component.button'
  );
  if (buttonStyles?.length !== 1)
    fail('One source Button font template is required');
  const brands = Object.fromEntries(
    modes.map(mode => {
      const resolvedRoles = Object.fromEntries(
        Object.entries(roles).map(([key, role]) => [
          key,
          value(role.name, role.type, mode),
        ])
      );
      const brand = rawSources.brands.find(entry => entry.meta.id === mode.id);
      const tokenMap = tokens.resolve(
        tokens.mergeLayers(
          tokens.layersFor(
            brand,
            rawSources.base,
            new Map(rawSources.brands.map(entry => [entry.meta.id, entry]))
          )
        ),
        mode.id
      );
      const inheritedLine = tokenMap.emitted.get(
        'font-line-height.700'
      )?.literal;
      if (
        typeof inheritedLine !== 'string' ||
        !/^[\d.]+em$/.test(inheritedLine)
      )
        fail(`Inherited line-height units changed for ${mode.id}`);
      const inheritedRatio = Number(inheritedLine.slice(0, -2));
      const r = resolvedRoles,
        font = buttonStyles[0].values?.[mode.id]?.fontName;
      if (
        r.fontFamily !== 'Roboto' ||
        font?.family !== r.fontFamily ||
        font.style !== 'Bold' ||
        buttonStyles[0].values[mode.id].fontSize !== r.fontSize ||
        r.zero !== 0 ||
        r.border <= 0
      )
        fail(`Exact Latin source font or geometry changed for ${mode.id}`);
      const cornerValues = radius => ({
        First: [radius, 0, radius, 0],
        Middle: [0, 0, 0, 0],
        Last: [0, radius, 0, radius],
      });
      return [
        mode.id,
        {
          typography: {
            segment: {
              fontName: { ...font },
              fontSize: r.fontSize,
              lineHeight: { unit: 'PERCENT', value: lineRatio * 100 },
              requestedWeight,
              bundledWeight,
              sourceFontStyleId: 'component.button',
            },
            legend: {
              fontName: { family: r.fontFamily, style: 'Regular' },
              fontSize: r.legendFontSize,
              lineHeight: {
                unit: 'PIXELS',
                value: r.legendFontSize * inheritedRatio,
              },
            },
            legendMediumUp: {
              fontName: { family: r.fontFamily, style: 'Regular' },
              fontSize: r.legendMediumFontSize,
              lineHeight: {
                unit: 'PIXELS',
                value: r.legendFontSize * inheritedRatio,
              },
            },
          },
          geometry: {
            minHeight,
            paddingBlock: r.paddingBlock,
            paddingInline: r.paddingInline,
            border: r.border,
            radius: r.radius,
            seam: -r.border,
            focusOffset: r.focusOffset,
            focusWidth: r.focusWidth,
            counterGap: 0,
            corners: cornerValues(r.radius),
            focusOuterCorners: cornerValues(r.radius + r.focusOffset),
          },
          paints: {
            default: {
              fill: null,
              stroke: roles.outline.name,
              text: roles.outline.name,
            },
            selected: {
              fill: roles.background.name,
              stroke: roles.background.name,
              text: roles.text.name,
            },
            hover: {
              fill: roles.outlineHover.name,
              stroke: roles.outlineHover.name,
              text: roles.text.name,
            },
            selectedHover: {
              fill: roles.backgroundHover.name,
              stroke: roles.backgroundHover.name,
              text: roles.text.name,
            },
            disabled: {
              fill: null,
              stroke: roles.disabledBorder.name,
              text: roles.disabledBorder.name,
            },
            selectedDisabled: {
              fill: roles.disabledSelected.name,
              stroke: roles.disabledSelected.name,
              text: roles.separatorColor.name,
            },
          },
          resolvedRoles,
        },
      ];
    })
  );
  const measured = brands.undrr;
  if (
    measured &&
    (measured.typography.segment.fontSize !== 14 ||
      measured.typography.legend.fontSize !== 16 ||
      measured.typography.legend.lineHeight.value !== 24 ||
      measured.typography.legendMediumUp.fontSize !== 18 ||
      [
        'paddingBlock',
        'paddingInline',
        'border',
        'radius',
        'focusOffset',
        'focusWidth',
      ].some((key, i) => measured.geometry[key] !== [10, 15, 1, 5, 2, 2][i]))
  )
    fail('Measured UNDRR dimensions changed; remeasure browser cases');
  const labelMatches = [
    ...read(story).matchAll(
      /\{ label: '([^']+)', value: '(depth|frequency|exposure)' \}/g
    ),
  ];
  const defaultLabels = labelMatches.slice(-3).map(match => match[1]);
  if (defaultLabels.join('|') !== 'Depth|Frequency|Exposure')
    fail('Default English story labels changed');
  return {
    version: 1,
    kind: 'segmented-joining',
    sourceRefs,
    roles,
    brands,
    labels: {
      default: defaultLabels,
      long: ['Precipitation', 'Vulnerability', 'Displacement'],
    },
    cornersOrder: [
      'topLeftRadius',
      'topRightRadius',
      'bottomLeftRadius',
      'bottomRightRadius',
    ],
    seamDerivation: { role: roles.border.name, scale: -1 },
    legendViewport: {
      breakpointPx: mediumEm * rootFont,
      below: 'legend',
      atOrAbove: 'legendMediumUp',
      source: 'paragraph-font-300/devicebreak(medium)',
      limitation: 'Source viewport band, not native consumer width',
    },
    cases: {
      sourceBrandId: 'undrr',
      sourceViewportBand: 'BelowMedium',
      evidence:
        'Isolated source browser, actual JSX and fresh full SCSS; UNDRR English only',
      short390: {
        width: 390,
        widths: [69.125, 97.515625, 90.375],
        x: [0, 68.125, 164.640625],
        groupHeight: 44,
      },
      default240: {
        width: 240,
        thirdX: -1,
        thirdY: 44,
        groupHeight: 88,
        outerHeight: 114.5,
      },
      fullWidth240: {
        width: 240,
        widths: [80.65625, 80.671875, 80.671875],
        groupHeight: 55.59375,
        outerHeight: 82.09375,
        allocation: { formula: '(width + 2 * border) / 3', count: 3, seams: 2 },
      },
      long390: {
        width: 390,
        widths: [112.625, 111.109375, 118.25],
        groupHeight: 44,
        legendHeight: 48,
        outerHeight: 94.5,
      },
      long240: {
        width: 240,
        thirdX: -1,
        thirdY: 44,
        groupHeight: 88,
        legendHeight: 72,
        outerHeight: 162.5,
      },
      fullWidthLong240: {
        width: 240,
        groupHeight: 55.59375,
        legendHeight: 72,
        outerHeight: 130.09375,
      },
    },
    limitations: [
      'Diagnostic packet only. No canonical variable, style, family or prototype is created.',
      'Button supplies its exact source Bold font object only. Its 100% text style does not represent the 120% segment line height.',
      'Long labels are measured public-prop stress content, not an additional exported story.',
      'Native joining, partial-corner focus, sibling paint order, source wrapping, font file equality, edited-consumer propagation and repeat behaviour remain unverified.',
      'The initial semantic positions cover a three-option group. A one-option array needs all four corners and is not represented.',
      'Source has no invalid/help/error/loading anatomy. Radio semantics, keyboard behaviour, RTL, forced colours, motion and arbitrary theme-hook overrides are not simulated.',
    ],
  };
}
module.exports = { buildSegmentedJoiningCapability };
