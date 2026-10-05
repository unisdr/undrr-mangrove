#!/usr/bin/env node
/** Pure source packet checks. No native geometry or font acceptance is claimed. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  buildFormActionCapability,
} = require('../../../scripts/figma-form-action-probe.cjs');
const root = path.resolve(__dirname, '../../..');
const foundation = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
);
const copy = value => JSON.parse(JSON.stringify(value));
const input = () => ({
  root,
  modes: copy(foundation.modes),
  variables: copy(foundation.variables),
  styles: copy(foundation.styles),
});
const context = input(),
  before = copy(context),
  packet = buildFormActionCapability(context),
  undrr = packet.brands.undrr,
  mcr = packet.brands.mcr;
assert.deepStrictEqual(context, before, 'Packet must not mutate foundations');
assert.strictEqual(packet.kind, 'form-action-joining');
assert.strictEqual(packet.version, 1);
const exported =
  require('../../../scripts/build-figma-tokens.cjs').buildFigmaVariables();
assert.deepStrictEqual(exported.capabilities.formActionJoining, packet);
assert.deepStrictEqual(
  exported.components.families.map(family => family.id),
  foundation.components.families.map(family => family.id),
  'Diagnostic packets must not append canonical families'
);
assert.deepStrictEqual(packet.cornersOrder, [
  'topLeftRadius',
  'topRightRadius',
  'bottomLeftRadius',
  'bottomRightRadius',
]);
assert.strictEqual(packet.cases.sourceBrandId, 'undrr');
assert.strictEqual(packet.stackViewport.maxPx, 480);
assert.strictEqual(packet.stackViewport.inclusive, true);
assert.strictEqual(packet.stackViewport.requiresStackOnMobile, true);
assert.deepStrictEqual(undrr.typography.input.fontName, {
  family: 'Roboto',
  style: 'Regular',
});
assert.deepStrictEqual(undrr.typography.input.lineHeight, {
  unit: 'PERCENT',
  value: 115,
});
assert.strictEqual(undrr.typography.input.sourceFontStyleId, 'component.input');
assert.strictEqual(undrr.typography.input.fontSize, 16);
assert.deepStrictEqual(undrr.typography.action.fontName, {
  family: 'Roboto',
  style: 'Bold',
});
assert.deepStrictEqual(undrr.typography.action.lineHeight, {
  unit: 'PERCENT',
  value: 100,
});
assert.strictEqual(undrr.typography.action.requestedWeight, 600);
assert.strictEqual(undrr.typography.action.bundledWeight, 700);
assert.strictEqual(
  undrr.typography.action.sourceFontStyleId,
  'component.button'
);
assert.deepStrictEqual(undrr.typography.help.lineHeight, {
  unit: 'PIXELS',
  value: 24,
});
assert.strictEqual(undrr.typography.help.fontSize, 12.5);
assert.strictEqual(undrr.typography.error.fontSize, 16);
assert.deepStrictEqual(undrr.geometry.corners, {
  control: [5, 0, 5, 0],
  action: [0, 5, 0, 5],
});
assert.deepStrictEqual(undrr.geometry.focusOuterCorners, {
  control: [7, 0, 7, 0],
  action: [0, 7, 0, 7],
});
assert.deepStrictEqual(undrr.geometry.stackedCorners, {
  control: [5, 5, 5, 5],
  action: [5, 5, 5, 5],
});
assert.strictEqual(undrr.geometry.controlHeight, 46);
assert.strictEqual(undrr.geometry.actionMinHeight, 46);
assert.strictEqual(undrr.geometry.rowMinHeight, 46);
assert.strictEqual(undrr.geometry.actionContentHeight, 36);
assert.strictEqual(mcr.geometry.actionBorder, 2);
assert.strictEqual(
  mcr.geometry.seam,
  -1,
  'FormAction seam is source literal, not negative brand border'
);
assert.strictEqual(mcr.geometry.controlHeight, 46);
assert.strictEqual(mcr.geometry.actionMinHeight, 46);
assert.strictEqual(mcr.geometry.actionContentHeight, 52);
assert.strictEqual(mcr.geometry.rowMinHeight, 52);
assert.deepStrictEqual(mcr.geometry.corners, {
  control: [10, 0, 10, 0],
  action: [0, 30, 0, 30],
});
assert.strictEqual(packet.brands.delta.geometry.actionPaddingInline, 20);
assert.strictEqual(
  undrr.paints.errorText.inputStroke,
  'form-input/border-color',
  'errorText must not invent red input border'
);
assert.strictEqual(
  undrr.paints.actionHtmlDisabled.fill,
  undrr.paints.actionDefault.fill
);
assert.strictEqual(
  undrr.paints.actionHtmlDisabled.opacity,
  1,
  'HTML disabled without source .disabled modifier remains opaque'
);
assert.deepStrictEqual(undrr.resolvedRoles.inputValue, {
  r: 0,
  g: 0,
  b: 0,
  a: 1,
});
assert(packet.limits.some(s => s.includes('not universal authored UA colour')));
assert.strictEqual(packet.selectArrow.width, 12);
assert.strictEqual(packet.selectArrow.height, 8);
assert.strictEqual(packet.selectArrow.inset, 6.25);
assert(
  packet.selectArrow.svg.includes(
    "d='M1.41 0L6 4.58 10.59 0 12 1.41l-6 6-6-6z'"
  )
);
assert(!packet.selectArrow.svg.includes('▾'));
assert.strictEqual(packet.cases.views['390'].Search.fieldHeight, 46);
assert.strictEqual(packet.cases.views['390'].Subscribe.fieldHeight, 99);
assert.strictEqual(packet.cases.views['240'].Subscribe.fieldHeight, 123);
assert.strictEqual(
  packet.cases.views['390'].SelectAndContinue.actionWidth,
  88.609375
);
assert.strictEqual(packet.cases.views['481'].StackedOnMobile.rowHeight, 46);
assert.strictEqual(packet.cases.views['480'].StackedOnMobile.rowHeight, 97);
assert.strictEqual(packet.cases.views['480'].StackedOnMobile.actionX, 0);
assert.strictEqual(packet.cases.views['240'].Long.fieldHeight, 171);
for (const [width, cases] of Object.entries(packet.cases.views))
  for (const c of Object.values(cases)) {
    if (c.actionWidth !== Number(width)) {
      assert.strictEqual(
        c.inputWidth + c.actionWidth + undrr.geometry.seam,
        Number(width)
      );
      assert.strictEqual(c.actionX, c.inputWidth + undrr.geometry.seam);
    } else assert.strictEqual(c.actionY, c.rowY + 46 + undrr.geometry.stackGap);
  }
assert.strictEqual(packet.sourceRefs.filter(r => r.normalizedSha256).length, 5);
packet.brands.undrr.resolvedRoles.inputBackground.r = 99;
packet.cases.labels.Search.action = 'Changed';
assert.deepStrictEqual(context, before);
assert.strictEqual(
  buildFormActionCapability(context).cases.labels.Search.action,
  'Search',
  'Returned case data must not mutate later calls'
);
console.log(
  'ok  source anatomy, exact templates, all-brand seam/height/corners, source cases, UA/state limits and immutability'
);
const role = (d, name) => d.variables.find(v => v.name === name);
const invalids = [
  d => {
    role(d, 'form-input/block-size').type = 'COLOR';
  },
  d => {
    role(d, 'form-input/block-size').values.undrr = {
      alias: 'font-family/text',
    };
  },
  d => {
    role(d, 'radius/form-input').values.undrr = { alias: 'radius/form-input' };
  },
  d => {
    role(d, 'form-input/padding').values.undrr = {
      alias: 'spacing/25',
      extra: 1,
    };
  },
  d => {
    delete role(d, 'form-input/block-size').values.mcr;
  },
  d => {
    role(d, 'form-input/border-color').values.undrr = {
      r: 1,
      g: 0,
      b: 0,
      a: 1,
    };
  },
  d => {
    role(d, 'component/text-input/browser-fieldtext').values.undrr = {
      r: 0.01,
      g: 0,
      b: 0,
      a: 1,
    };
  },
  d => {
    role(d, 'component/text-input/browser-fieldtext').description =
      'Universal semantic black';
  },
  d => {
    role(d, 'form-input/block-size').values.undrr = 47;
  },
  d => {
    d.variables.push(copy(d.variables[0]));
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
      s => s.id === 'component.input'
    ).values.undrr.fontName.style = 'Bold';
  },
  d => {
    d.styles.text.find(
      s => s.id === 'component.input'
    ).values.undrr.lineHeight = { unit: 'PIXELS', value: 18.4 };
  },
  d => {
    d.styles.text.find(s => s.id === 'component.button').values.mcr.fontSize =
      14;
  },
  d => {
    d.styles.text.find(s => s.id === 'component.button').bindings.fontSize =
      'font-size/300';
  },
  d => {
    d.styles.text.push(
      copy(d.styles.text.find(s => s.id === 'component.input'))
    );
  },
];
for (const mutate of invalids) {
  const bad = input();
  mutate(bad);
  assert.throws(
    () => buildFormActionCapability(bad),
    /Figma FormAction probe needs updating/
  );
}
console.log(
  'ok  invalid role types/aliases/source values/modes/font templates fail closed'
);
const alias = input();
role(alias, 'form-input/block-size').values.undrr = {
  alias: 'form-input/block-size-probe-alias',
};
alias.variables.push({
  id: 'fixture.valid-height-alias',
  name: 'form-input/block-size-probe-alias',
  type: 'FLOAT',
  values: Object.fromEntries(alias.modes.map(m => [m.id, 46])),
});
assert.strictEqual(
  buildFormActionCapability(alias).brands.undrr.geometry.controlHeight,
  46
);
const subset = input();
subset.modes = subset.modes.filter(m => m.id === 'mcr');
assert.strictEqual(
  buildFormActionCapability(subset).brands.mcr.geometry.rowMinHeight,
  52
);
assert(!buildFormActionCapability(subset).brands.undrr);
console.log(
  'ok  recursive source-equivalent aliases and explicit non-measured mode subsets'
);
const fixture = fs.mkdtempSync(
  path.join(os.tmpdir(), 'mg-form-action-source-')
);
try {
  fs.cpSync(path.join(root, 'tokens'), path.join(fixture, 'tokens'), {
    recursive: true,
  });
  for (const ref of buildFormActionCapability(input()).sourceRefs) {
    const target = path.join(fixture, ref.file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(root, ref.file), target);
  }
  const edits = [
    [
      'stories/Components/Forms/FormAction/FormAction.jsx',
      "'aria-invalid': errorText ? 'true'",
      "'aria-invalid': false ? 'true'",
    ],
    [
      'stories/Components/Forms/FormAction/FormAction.jsx',
      "'mg-form-action__control'",
      "'mg-form-action__control mg-form-input--error'",
    ],
    [
      'stories/Components/Forms/FormAction/FormAction.stories.jsx',
      'Search publications',
      'Changed publications',
    ],
    [
      'stories/Components/Forms/FormAction/form-action.scss',
      'margin-inline-start: -1px;',
      'margin-inline-start: -2px;',
    ],
    [
      'stories/Components/Forms/FormAction/form-action.scss',
      'min-height: mg-rem(46);',
      'min-height: mg-rem(44);',
    ],
    [
      'stories/Components/Forms/FormAction/form-action.scss',
      'width <= $mg-breakpoint-mobile',
      'width < $mg-breakpoint-mobile',
    ],
    [
      'stories/Components/Forms/FormAction/form-action.scss',
      'z-index: 1;',
      'z-index: 0;',
    ],
    [
      'stories/Components/Forms/_form-base.scss',
      'M1.41 0L6 4.58',
      'M1.41 0L6 4.00',
    ],
    [
      'stories/Components/Forms/_form-base.scss',
      'font-size: var(--mg-font-size-200);',
      'font-size: var(--mg-font-size-300);',
    ],
    [
      'stories/Components/Buttons/CtaButton/cta-button.scss',
      '.mg-button.disabled {',
      '.mg-button:disabled {',
    ],
    [
      'stories/Utilities/Normalize/normalize.scss',
      'font-size: 100%; /* 1 */\n  line-height: 1.15;',
      'font-size: 100%; /* 1 */\n  line-height: 1.2;',
    ],
    [
      'stories/assets/scss/_variables.scss',
      '$mg-breakpoint-mobile: 480px;',
      '$mg-breakpoint-mobile: 481px;',
    ],
    [
      'stories/assets/scss/_variables.scss',
      'math.div($px, $mg-html-font-size)',
      'math.div($px, 10)',
    ],
    [
      'stories/assets/scss/_foundational.scss',
      'line-height: var(--mg-font-line-height-700);',
      'line-height: 2;',
    ],
    [
      'stories/assets/scss/_mixins.scss',
      'outline-offset: var(--mg-focus-ring-offset);',
      'outline-offset: 0;',
    ],
    [
      'stories/assets/fonts/roboto/sass/_Bold.scss',
      'font-weight: 700;',
      'font-weight: 600;',
    ],
    [
      'stories/assets/scss/_components.scss',
      '@import "../../Components/Forms/FormAction/form-action";',
      '',
    ],
    ['tokens/mangrove.yaml', "$value: '1.5em'", "$value: '1.6em'"],
    [
      'scripts/figma-maintenance-foundations.cjs',
      'Math.round(n * 10000) / 10000',
      'Math.round(n * 1000) / 1000',
    ],
  ];
  for (const [file, from, to] of edits) {
    const target = path.join(fixture, file),
      original = fs.readFileSync(target, 'utf8');
    assert(original.includes(from), `Mutation anchor missing: ${file}/${from}`);
    fs.writeFileSync(target, original.replace(from, to));
    assert.throws(
      () => buildFormActionCapability({ ...input(), root: fixture }),
      /Figma FormAction probe needs updating/,
      `Source mutation was not rejected: ${file}/${from}`
    );
    fs.writeFileSync(target, original);
  }
  const file = path.join(fixture, 'stories/Components/Forms/_form-base.scss');
  fs.writeFileSync(
    file,
    '/* Harmless annotation */\n' + fs.readFileSync(file, 'utf8')
  );
  assert.strictEqual(
    buildFormActionCapability({ ...input(), root: fixture }).kind,
    'form-action-joining'
  );
} finally {
  fs.rmSync(fixture, { recursive: true, force: true });
}
console.log(
  'ok  complete source guards preserve quoted SVG URLs and reject anatomy/cascade/layout/font/token/media/import drift'
);
