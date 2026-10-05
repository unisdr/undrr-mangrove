#!/usr/bin/env node
/** Pure plan/API fixture checks, not native SCALE/path/mode acceptance. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '../../..');
function helpers() {
  const context = vm.createContext({});
  vm.runInContext(
    fs.readFileSync(path.join(__dirname, '../kit-svg-sizing.js'), 'utf8'),
    context
  );
  return context;
}
function sourceSpec() {
  const icons = fs.readFileSync(
    path.join(root, 'stories/Atom/Icons/_icon-definitions.scss'),
    'utf8'
  );
  const match =
    /\.mg-icon-search::before \{[\s\S]*?data:image\/svg\+xml,([^\"]+)/.exec(
      icons
    );
  assert(match);
  return {
    type: 'SVG',
    id: 'search-icon',
    svg: {
      assetId: 'search-control.search',
      markup: match[1]
        .replaceAll("'", '"')
        .replaceAll('currentColor', '#000000'),
      monochrome: { strokes: 'color/button' },
      sizing: {
        size: 'component/search-control/search-size',
        strokeWidth: 'component/search-control/search-stroke',
      },
    },
    layout: { width: 24, height: 24 },
  };
}
function main() {
  const api = helpers(),
    spec = sourceSpec(),
    plan = api.mgSvgSizingPlan(spec);
  assert.strictEqual(plan.viewBoxSize, 24);
  assert.strictEqual(plan.sourceStrokeWidth, 2);
  assert.strictEqual(api.mgSvgSizingPlan({ svg: {} }), null);
  const doc = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
  );
  const byName = new Map(doc.variables.map(v => [v.name, v]));
  function resolve(name, mode, type, seen = new Set()) {
    const entry = byName.get(name);
    assert(entry && entry.type === type && !seen.has(name));
    seen.add(name);
    const value = entry.values[mode.id];
    return value.alias ? resolve(value.alias, mode, type, seen) : value;
  }
  const sizes = Object.fromEntries(
    doc.modes.map(m => [m.id, resolve('font-size/button', m, 'FLOAT')])
  );
  const widths = Object.fromEntries(
    doc.modes.map(m => [m.id, (2 * sizes[m.id]) / 24])
  );
  const values = api.mgSvgSizingSourceValues(
    plan,
    doc.modes,
    (name, mode, type) => {
      assert.strictEqual(type, 'FLOAT');
      return name === plan.size ? sizes[mode.id] : widths[mode.id];
    }
  );
  assert.strictEqual(values.undrr.size, 14);
  assert.strictEqual(values.mcr.size, 18);
  assert.strictEqual(values.undrr.strokeWidth, (2 * 14) / 24);
  assert.strictEqual(values.mcr.strokeWidth, 1.5);
  const observedNative = Math.fround((2 * 14) / 24);
  assert.strictEqual(observedNative, 1.1666666269302368);
  assert.strictEqual(
    api.mgSvgSizingNativeValues(plan, [{ id: 'undrr' }], name =>
      name === plan.size ? 14 : observedNative
    ).undrr.strokeWidth,
    observedNative
  );
  for (const altered of [
    observedNative + 2 ** -23,
    observedNative - 2 ** -23,
    1.167,
  ])
    assert.throws(
      () =>
        api.mgSvgSizingNativeValues(plan, [{ id: 'undrr' }], name =>
          name === plan.size ? 14 : altered
        ),
      /disagree/
    );
  assert.throws(
    () =>
      api.mgSvgSizingSourceValues(plan, [{ id: 'undrr' }], name =>
        name === plan.size ? 14 : observedNative
      ),
    /disagree/
  );
  assert.throws(
    () =>
      api.mgSvgSizingSourceValues(plan, doc.modes, name =>
        name === plan.size ? 14 : 1.167
      ),
    /disagree/
  );
  const copy = object => JSON.parse(JSON.stringify(object));
  for (const transform of [
    s => {
      s.svg.sizing.size = '';
    },
    s => {
      s.svg.sizing.extra = 'unsafe';
    },
    s => {
      s.svg.markup = s.svg.markup.replace('0 0 24 24', '0 0 24 12');
    },
    s => {
      s.svg.markup = s.svg.markup.replace('</svg>', '<mask/></svg>');
    },
    s => {
      s.svg.markup = s.svg.markup.replace(
        '</svg>',
        '<path stroke-width="3"/></svg>'
      );
    },
    s => {
      s.svg.markup = s.svg.markup.replace('fill="none"', 'fill="#000000"');
    },
    s => {
      s.svg.markup = s.svg.markup.replace('fill="none"', '');
    },
    s => {
      s.svg.markup = s.svg.markup.replace(
        '</svg>',
        '<path stroke="#ff0000"/></svg>'
      );
    },
    s => {
      s.svg.markup = s.svg.markup.replace(
        '<path',
        '<path transform="scale(2)"'
      );
    },
  ]) {
    const bad = copy(spec);
    transform(bad);
    assert.throws(() => api.mgSvgSizingPlan(bad), /uniform-stroke/);
  }
  let mode = 'undrr';
  let writes = 0;
  let rescales = 0;
  const vector = {
    id: 'source-vector',
    type: 'VECTOR',
    x: 3,
    y: 3,
    width: 18,
    height: 18,
    constraints: { horizontal: 'MIN', vertical: 'MIN' },
    vectorPaths: [
      { windingRule: 'NONZERO', data: 'source path fixture, not rendered' },
    ],
    isMask: false,
    effects: [],
    fills: [],
    strokes: [{ type: 'SOLID' }],
    strokeAlign: 'CENTER',
    strokeWeight: 2,
    bindings: {},
    setBoundVariable(field, variable) {
      writes++;
      this.bindings[field] = variable;
      if (variable) this[field] = variable.resolveForConsumer(this).value;
    },
  };
  const frame = {
    id: 'source-svg-frame',
    type: 'FRAME',
    x: 0,
    y: 0,
    isMask: false,
    effects: [],
    fills: [],
    strokes: [],
    width: 24,
    height: 24,
    children: [vector],
    bindings: {},
    setBoundVariable(field, variable) {
      writes++;
      this.bindings[field] = variable;
      if (variable) this[field] = variable.resolveForConsumer(this).value;
    },
    rescale(scale) {
      rescales++;
      this.width *= scale;
      this.height *= scale;
      vector.x *= scale;
      vector.y *= scale;
      vector.width *= scale;
      vector.height *= scale;
      vector.strokeWeight *= scale;
    },
  };
  const variables = {
    [plan.size]: {
      id: 'size-variable',
      resolvedType: 'FLOAT',
      resolveForConsumer: () => ({ value: sizes[mode] }),
    },
    [plan.strokeWidth]: {
      id: 'stroke-variable',
      resolvedType: 'FLOAT',
      resolveForConsumer: () => ({ value: widths[mode] }),
    },
  };
  const lookup = (name, type) => {
    assert.strictEqual(type, 'FLOAT');
    return variables[name];
  };
  function build() {
    return api.mgApplySvgSizing(api.mgSvgSizingNativePlan(frame, plan, lookup));
  }
  assert.strictEqual(writes, 0);
  const first = build();
  assert.strictEqual(first.nativeModeChangeVerified, false);
  assert.strictEqual(frame.width, 14);
  assert.strictEqual(vector.strokeWeight, (2 * 14) / 24);
  assert.strictEqual(vector.constraints.horizontal, 'SCALE');
  frame.fills = [
    {
      type: 'SOLID',
      visible: false,
      opacity: 1,
      blendMode: 'NORMAL',
      color: { r: 1, g: 1, b: 1 },
      boundVariables: {},
    },
  ];
  api.mgSvgSizingNativePlan(frame, plan, lookup);
  frame.fills[0].visible = true;
  assert.throws(
    () => api.mgSvgSizingNativePlan(frame, plan, lookup),
    /appearance/
  );
  frame.fills[0].visible = false;
  frame.fills[0].color.r = 0.9;
  assert.throws(
    () => api.mgSvgSizingNativePlan(frame, plan, lookup),
    /appearance/
  );
  frame.fills = [];
  vector.strokeWeight = observedNative;
  api.mgSvgSizingNativePlan(frame, plan, lookup);
  for (const changed of [
    observedNative + 2 ** -23,
    observedNative - 2 ** -23,
  ]) {
    vector.strokeWeight = changed;
    assert.throws(
      () => api.mgSvgSizingNativePlan(frame, plan, lookup),
      /center-stroked/
    );
  }
  vector.strokeWeight = widths.undrr;
  const identities = [frame.id, vector.id];
  const repeat = build();
  assert.strictEqual(repeat.rescaled, false);
  assert.strictEqual(rescales, 1);
  // Hypothesis fixture: emulate linked width/height and child SCALE geometry,
  // then independently linked stroke token. This is not observed native Figma.
  mode = 'mcr';
  const scale = sizes[mode] / frame.width;
  frame.width = frame.height = sizes[mode];
  vector.x *= scale;
  vector.y *= scale;
  vector.width *= scale;
  vector.height *= scale;
  vector.strokeWeight = widths[mode];
  assert.strictEqual(frame.width, 18);
  assert(Math.abs(vector.width - 13.5) < 1e-12);
  assert.strictEqual(vector.strokeWeight, 1.5);
  const changedModeRepeat = build();
  assert.strictEqual(changedModeRepeat.rescaled, false);
  assert.deepStrictEqual([frame.id, vector.id], identities);
  assert.strictEqual(rescales, 1);
  const before = writes;
  assert.throws(
    () =>
      api.mgSvgSizingNativePlan(frame, plan, () => ({
        resolveForConsumer: () => ({ value: -1 }),
      })),
    /FLOAT/
  );
  assert.strictEqual(writes, before);
  for (const [item, field, value] of [
    [vector, 'fills', [{ type: 'SOLID' }]],
    [vector, 'strokeWeight', 2],
    [vector, 'strokeWeight', Number.NaN],
    [vector, 'x', Number.NaN],
    [vector, 'width', Infinity],
    [vector, 'isMask', true],
    [vector, 'effects', [{ type: 'DROP_SHADOW' }]],
    [vector, 'strokes', null],
    [frame, 'effects', [{ type: 'BLUR' }]],
    [frame, 'fills', [{ type: 'SOLID' }]],
  ]) {
    const original = item[field];
    item[field] = value;
    assert.throws(
      () => api.mgSvgSizingNativePlan(frame, plan, lookup),
      /uniform|unsupported/
    );
    assert.strictEqual(writes, before);
    assert.strictEqual(rescales, 1);
    item[field] = original;
  }
  // One valid vector cannot conceal a second vector with a different stroke.
  frame.children.push({ ...vector, id: 'mixed-width', strokeWeight: 1 });
  assert.throws(
    () => api.mgSvgSizingNativePlan(frame, plan, lookup),
    /uniform/
  );
  assert.strictEqual(writes, before);
  frame.children.pop();
  // Native GroupNode has no fills or strokes properties. Its descendants
  // retain the same strict vector contract and geometry preflight.
  const group = {
    id: 'source-group',
    type: 'GROUP',
    x: 0,
    y: 0,
    width: 18,
    height: 18,
    isMask: false,
    effects: [],
    constraints: { horizontal: 'MIN', vertical: 'MIN' },
    children: [vector],
  };
  frame.children = [group];
  const grouped = api.mgSvgSizingNativePlan(frame, plan, lookup);
  assert.strictEqual(grouped.vectors.length, 1);
  assert.strictEqual(grouped.descendants.length, 2);
  assert.strictEqual(writes, before);
  group.effects = [{ type: 'BLUR' }];
  assert.throws(
    () => api.mgSvgSizingNativePlan(frame, plan, lookup),
    /unsupported/
  );
  assert.strictEqual(writes, before);
  frame.children = [vector];
  console.log(
    'SVG sizing: exact source mask, five-brand derived values, uniform-square refusals, API repeat and modeled mode transition passed. Native SCALE/path/stroke behavior remains unverified.'
  );
}
if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
module.exports = { main, sourceSpec };
