/** Source-owned diagnostic packet. This creates no variables, styles or families. */
'use strict';

function buildSegmentedJoiningCapability({ root, modes, variables, styles }) {
  const { fail, read, sourceRefs, story, mediumEm, rootFont, roles, brands } =
    require('./figma-maintenance-segmented-source-assets.cjs').buildSegmentedSourceAssets(
      {
        root,
        modes,
        variables,
        styles,
      }
    );
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
    seamDerivation: {
      role: roles.border.name,
      scale: -1,
    },
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
        allocation: {
          formula: '(width + 2 * border) / 3',
          count: 3,
          seams: 2,
        },
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
module.exports = {
  buildSegmentedJoiningCapability,
};
