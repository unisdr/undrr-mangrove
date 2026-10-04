#!/usr/bin/env node
/** Pure source packet checks. Native geometry, fonts and rendering are unverified. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  buildSegmentedJoiningCapability,
} = require('../../../scripts/figma-segmented-probe.cjs');
const root = path.resolve(__dirname, '../../..');
const foundation = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
);
const copy = v => JSON.parse(JSON.stringify(v));
function input() {
  return {
    root,
    modes: copy(foundation.modes),
    variables: copy(foundation.variables),
    styles: copy(foundation.styles),
  };
}
const parameters = input(),
  before = copy(parameters),
  packet = buildSegmentedJoiningCapability(parameters);
assert.deepStrictEqual(
  parameters,
  before,
  'Source packet must not mutate modes, variables or styles.'
);
assert.strictEqual(packet.version, 1);
assert.strictEqual(packet.kind, 'segmented-joining');
assert.deepStrictEqual(packet.labels.default, [
  'Depth',
  'Frequency',
  'Exposure',
]);
assert.deepStrictEqual(packet.labels.long, [
  'Precipitation',
  'Vulnerability',
  'Displacement',
]);
assert.deepStrictEqual(packet.cornersOrder, [
  'topLeftRadius',
  'topRightRadius',
  'bottomLeftRadius',
  'bottomRightRadius',
]);
const undrr = packet.brands.undrr;
assert.deepStrictEqual(undrr.typography.segment, {
  fontName: { family: 'Roboto', style: 'Bold' },
  fontSize: 14,
  lineHeight: { unit: 'PERCENT', value: 120 },
  requestedWeight: 600,
  bundledWeight: 700,
  sourceFontStyleId: 'component.button',
});
assert.deepStrictEqual(undrr.typography.legend, {
  fontName: { family: 'Roboto', style: 'Regular' },
  fontSize: 16,
  lineHeight: { unit: 'PIXELS', value: 24 },
});
assert.strictEqual(undrr.typography.legendMediumUp.fontSize, 18);
assert.strictEqual(undrr.typography.legendMediumUp.lineHeight.value, 24);
assert.strictEqual(undrr.geometry.seam, -1);
assert.deepStrictEqual(undrr.geometry.corners.First, [5, 0, 5, 0]);
assert.deepStrictEqual(undrr.geometry.focusOuterCorners.First, [7, 0, 7, 0]);
assert.deepStrictEqual(undrr.geometry.focusOuterCorners.Middle, [0, 0, 0, 0]);
assert.deepStrictEqual(packet.brands.mcr.geometry.corners.Last, [0, 30, 0, 30]);
assert.strictEqual(packet.brands.mcr.geometry.seam, -2);
assert.strictEqual(packet.brands.mcr.typography.segment.fontSize, 18);
assert.strictEqual(packet.brands.delta.geometry.paddingInline, 20);
assert.strictEqual(packet.cases.sourceBrandId, 'undrr');
assert.strictEqual(packet.cases.default240.thirdX, -1);
assert.strictEqual(packet.cases.default240.thirdY, 44);
assert.strictEqual(packet.cases.default240.groupHeight, 88);
assert.strictEqual(packet.cases.fullWidth240.groupHeight, 55.59375);
assert(
  Math.abs(packet.cases.fullWidth240.widths.reduce((a, b) => a + b, 0) - 242) <
    1e-10
);
assert.strictEqual(undrr.paints.disabled.fill, null);
assert.strictEqual(undrr.paints.disabled.stroke, 'color/neutral-400');
assert.strictEqual(undrr.paints.selectedDisabled.fill, 'color/neutral-500');
assert.strictEqual(undrr.paints.selectedDisabled.text, 'color/neutral-0');
assert(packet.sourceRefs.filter(ref => ref.normalizedSha256).length === 3);
console.log(
  'ok  pure source packet preserves foundations, all-brand role derivation, exact fonts/line heights, corners/focus/seams and bounded UNDRR cases'
);
for (const mutate of [
  d => {
    d.variables.find(v => v.name === 'border-width/button').type = 'STRING';
  },
  d => {
    d.variables.find(v => v.name === 'border-width/button').values.undrr = {
      alias: 'font-family/text',
    };
  },
  d => {
    d.variables.find(v => v.name === 'radius/button').values.undrr = {
      alias: 'radius/button',
    };
  },
  d => {
    d.variables.find(v => v.name === 'padding/button/inline').values.undrr = 20;
  },
  d => {
    d.variables.find(v => v.name === 'color/button').values.undrr = {
      r: 2,
      g: 0,
      b: 0,
      a: 1,
    };
  },
  d => {
    d.modes.push(copy(d.modes[0]));
  },
  d => {
    d.modes[0].id = 'unknown';
  },
  d => {
    d.modes[0].name = 'Renamed';
  },
  d => {
    d.modes = [];
  },
  d => {
    d.styles.text.find(
      s => s.id === 'component.button'
    ).values.undrr.fontName.style = 'Medium';
  },
]) {
  const bad = input();
  mutate(bad);
  assert.throws(
    () => buildSegmentedJoiningCapability(bad),
    /Figma SegmentedControl probe needs updating/
  );
}
console.log(
  'ok  invalid roles, aliases, measured dimensions, modes and source font templates fail closed'
);
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'mg-segmented-source-'));
try {
  fs.cpSync(path.join(root, 'tokens'), path.join(fixture, 'tokens'), {
    recursive: true,
  });
  for (const ref of packet.sourceRefs) {
    const target = path.join(fixture, ref.file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(root, ref.file), target);
  }
  const amendments = [
    [
      'stories/Components/Forms/SegmentedControl/SegmentedControl.jsx',
      'disabled={option.disabled}',
      'disabled={false}',
    ],
    [
      'stories/Components/Forms/SegmentedControl/SegmentedControl.stories.jsx',
      "label: 'Depth'",
      "label: 'Changed'",
    ],
    [
      'stories/Components/Forms/SegmentedControl/segmented-control.scss',
      'z-index: 2;',
      'z-index: 0;',
    ],
    [
      'stories/Components/Forms/SegmentedControl/segmented-control.scss',
      'flex: 1 1 0;',
      'flex: 1 1 auto;',
    ],
    [
      'stories/Components/Forms/SegmentedControl/segmented-control.scss',
      'margin-inline-start: calc(-1 *',
      'margin-inline-start: calc(0 *',
    ],
    ['stories/assets/scss/_breakpoints.scss', 'width >= 48em', 'width >= 49em'],
    [
      'stories/assets/scss/_variables.scss',
      'math.div($px, $mg-html-font-size) * 1rem',
      'math.div($px, $mg-html-font-size) * 2rem',
    ],
    [
      'stories/assets/scss/_foundational.scss',
      'line-height: var(--mg-font-line-height-700)',
      'line-height: 1.5',
    ],
    [
      'stories/assets/fonts/roboto/sass/_Bold.scss',
      'font-weight: 700;',
      'font-weight: 600;',
    ],
  ];
  for (const [file, old, changed] of amendments) {
    const target = path.join(fixture, file),
      original = fs.readFileSync(target, 'utf8');
    assert(original.includes(old), 'Source mutation anchor must exist.');
    fs.writeFileSync(target, original.replace(old, changed));
    assert.throws(
      () => buildSegmentedJoiningCapability({ ...input(), root: fixture }),
      /Figma SegmentedControl probe needs updating/
    );
    fs.writeFileSync(target, original);
  }
  const scss = path.join(
    fixture,
    'stories/Components/Forms/SegmentedControl/segmented-control.scss'
  );
  fs.appendFileSync(scss, '\n// Cosmetic source comment.\n');
  assert.strictEqual(
    buildSegmentedJoiningCapability({ ...input(), root: fixture }).sourceRefs[2]
      .normalizedSha256,
    packet.sourceRefs[2].normalizedSha256
  );
} finally {
  fs.rmSync(fixture, { recursive: true, force: true });
}
console.log(
  'ok  complete JSX/story/SCSS and precise typography/breakpoint guards reject meaningful source drift; comments retain normalized source hash'
);
