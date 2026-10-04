#!/usr/bin/env node
/** Source guards/native API contracts only. This mock does not render text or blur. */
'use strict';
const assert = require('assert'),
  fs = require('fs'),
  path = require('path');
const { environment, importFoundation } = require('./mock-kit.cjs');
const {
  buildDetailsRecipes,
} = require('../../../scripts/figma-details-recipes.cjs');
const root = path.resolve(__dirname, '../../..'),
  copy = v => JSON.parse(JSON.stringify(v));
const identity = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
function document() {
  const d = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
  );
  const families = buildDetailsRecipes({
    root,
    modes: d.modes,
    variables: d.variables,
    styles: d.styles,
  });
  d.components.families = [
    ...d.components.families.filter(f => f.id !== 'details'),
    ...families,
  ];
  return d;
}
function changed(file, before, after, check) {
  const read = fs.readFileSync;
  let matched = false;
  fs.readFileSync = function (filename, ...args) {
    const s = read.call(this, filename, ...args);
    if (typeof filename !== 'string' || !filename.endsWith(file)) return s;
    const next = s.replace(before, after);
    matched = next !== s;
    return next;
  };
  try {
    check();
    assert(matched, `Mutation did not match${file}`);
  } finally {
    fs.readFileSync = read;
  }
}
function owned(env) {
  return [...env.state.nodes.values()]
    .filter(identity)
    .map(n => [identity(n), n.id])
    .sort((a, b) => a[0].localeCompare(b[0]));
}
function property(n, name) {
  const key = Object.keys(n.componentProperties).find(
    k => k.replace(/#[^#]+$/, '') === name
  );
  assert(key, `Missing${name}`);
  return key;
}
async function main() {
  const doc = document(),
    family = doc.components.families.find(f => f.id === 'details');
  const counts = [
    doc.variables.length,
    doc.styles.text.length,
    doc.styles.effect.length,
  ];
  assert.strictEqual(family.variants.length, 20);
  assert.deepStrictEqual(
    buildDetailsRecipes({
      root,
      modes: doc.modes,
      variables: doc.variables,
      styles: doc.styles,
    }),
    [family]
  );
  assert.deepStrictEqual(counts, [
    doc.variables.length,
    doc.styles.text.length,
    doc.styles.effect.length,
  ]);
  assert.strictEqual(
    doc.variables.filter(v => v.name.startsWith('component/details/')).length,
    23
  );
  assert.strictEqual(
    doc.styles.text.filter(s => s.id.startsWith('component.details.')).length,
    5
  );
  assert.strictEqual(
    doc.styles.effect.filter(s => s.id.startsWith('component.details.')).length,
    1
  );
  const file = '/stories/Atom/ReachElement/Details/details.scss';
  for (const [before, after] of [
    [
      'border: 1px solid rgb(var(--mg-color-neutral-400));',
      'border: 2px solid rgb(var(--mg-color-neutral-400));',
    ],
    ['border-radius: mg-rem(4);', 'border-radius: mg-rem(8);'],
    ['padding: mg-rem(10);', 'padding: mg-rem(15);'],
    [
      'box-shadow: 0 2px 4px rgb(0 0 0 / 0.1);',
      'box-shadow: 0 3px 4px rgb(0 0 0 / 0.1);',
    ],
    ['font-weight: 600;', 'font-weight: 500;'],
    ['min-height: mg-rem(48);', 'min-height: mg-rem(44);'],
    [
      'padding-inline: mg-rem(10) mg-rem(44);',
      'padding-inline: mg-rem(10) mg-rem(40);',
    ],
    ['var(--mg-color-blue-900) / 0.08', 'var(--mg-color-interactive) / 0.08'],
    ['border-radius: mg-rem(2);', 'border-radius: mg-rem(3);'],
    [
      'var(--mg-color-interactive) / 0.06',
      'var(--mg-color-interactive) / 0.07',
    ],
    ['content: "+";', 'content: "▾";'],
    ['content: "−";', 'content: "-";'],
    ['height: mg-rem(30);', 'height: mg-rem(24);'],
    ['inset-inline-end: mg-rem(10);', 'inset-inline-end: mg-rem(12);'],
    ['font-weight: 400;', 'font-weight: 500;'],
    ['var(--mg-color-interactive) / 0.12', 'var(--mg-color-interactive) / 0.2'],
    ['scale: 0.96;', 'scale: 0.9;'],
    ['line-height: 1.6;', 'line-height: 1.5;'],
    [
      'border-bottom: 1px solid rgb(var(--mg-color-neutral-400));',
      'border-bottom: 2px solid rgb(var(--mg-color-neutral-400));',
    ],
    ['@include mg-focus-ring;', '@include mg-focus-ring-inset;'],
    ['position: relative;', 'position: relative; line-height: 1.5;'],
  ])
    changed(file, before, after, () =>
      assert.throws(document, /Details recipe needs updating/)
    );
  for (const [target, before, after] of [
    [
      '/stories/Atom/ReachElement/Details/Details.jsx',
      '<p>{details}</p>',
      '<div>{details}</div>',
    ],
    [
      '/stories/assets/scss/_breakpoints.scss',
      '@media (width >= 48em)',
      '@media (width >= 56.25em)',
    ],
    [
      '/stories/assets/scss/_mixins.scss',
      '%paragraph-font-300 {\n  font-size: var(--mg-font-size-300);',
      '%paragraph-font-300 {\n  font-size: var(--mg-font-size-400);',
    ],
    [
      '/stories/assets/scss/_mixins.scss',
      'outline-offset: var(--mg-focus-ring-offset);',
      'outline-offset: 0;',
    ],
    [
      '/stories/assets/scss/_foundational.scss',
      'line-height: var(--mg-font-line-height-700);',
      'line-height: 1.5;',
    ],
    [
      '/stories/assets/scss/_foundational.scss',
      'overflow-wrap: break-word;',
      'overflow-wrap: normal;',
    ],
    ['/tokens/mangrove.yaml', "$value: '1.5em'", "$value: '1.6em'"],
    [
      '/stories/assets/fonts/roboto/sass/_Regular.scss',
      'font-weight: 400;',
      'font-weight: 500;',
    ],
  ])
    changed(target, before, after, () =>
      assert.throws(document, /Details recipe needs updating/)
    );
  console.log(
    'ok  idempotent20-variant exporter and source guards for JSX, responsive typography, exact glyphs, inherited line height, focus, paints and half-border geometry'
  );
  const byName = new Map(doc.variables.map(v => [v.name, v]));
  function value(name, mode) {
    const v = byName.get(name).values[mode];
    return v.alias ? value(v.alias, mode) : v;
  }
  for (const mode of doc.modes) {
    assert.strictEqual(
      value('component/details/marker-open-center-offset', mode.id),
      -0.5
    );
    for (const [name, role, alpha] of [
      ['marker-background', 'color/interactive', 0.06],
      ['marker-hover-background', 'color/interactive', 0.12],
      ['summary-hover-background', 'color/blue-900', 0.08],
    ])
      assert.deepStrictEqual(value(`component/details/${name}`, mode.id), {
        ...value(role, mode.id),
        a: alpha,
      });
    assert.deepStrictEqual(
      value('component/details/hover-shadow-color', mode.id),
      { r: 0, g: 0, b: 0, a: 0.1 }
    );
    for (const s of doc.styles.text.filter(s =>
      s.id.startsWith('component.details.')
    )) {
      const v = s.values[mode.id],
        summary = s.id.includes('summary-'),
        small = s.id.endsWith('below-medium'),
        marker = s.id.endsWith('marker-glyph');
      assert.strictEqual(v.fontName.family, 'Roboto');
      assert.strictEqual(v.fontName.style, summary ? 'Bold' : 'Regular');
      assert.strictEqual(
        v.fontSize,
        marker ? 18 : summary ? (small ? 16 : 18) : small ? 12.5 : 16
      );
      assert.deepStrictEqual(
        v.lineHeight,
        summary || marker
          ? { unit: 'PIXELS', value: 24 }
          : { unit: 'PERCENT', value: 160 }
      );
    }
  }
  for (const spec of family.variants) {
    const { Open, State, Typography, MeasuredViewport } = spec.properties,
      opened = Open === 'True',
      hover = State.includes('Hover'),
      focus = State.includes('Focus'),
      r = spec.tree,
      s = r.children[0],
      mark = s.children[1];
    assert.strictEqual(r.fill, null);
    assert.strictEqual(
      r.stroke,
      opened ? 'color/interactive' : 'color/neutral-400'
    );
    assert.strictEqual(r.children.length, opened ? 2 : 1);
    assert.strictEqual(Boolean(r.effectStyle), hover);
    assert.strictEqual(
      s.fill,
      hover ? 'component/details/summary-hover-background' : null
    );
    assert.strictEqual(s.layout.justify, 'MIN');
    assert.strictEqual(
      s.layout.minHeight,
      'component/details/summary-minimum-height'
    );
    assert.strictEqual(s.strokesIncludedInLayout, true);
    assert.strictEqual(Boolean(s.focusRing), focus);
    if (focus)
      assert.strictEqual(
        s.focusRing.radius,
        hover
          ? 'component/details/summary-hover-radius'
          : 'component/details/zero'
      );
    assert.strictEqual(mark.children[0].characters, opened ? '−' : '+');
    assert.strictEqual(
      mark.absolute.offsetX,
      'component/details/marker-end-offset'
    );
    assert.strictEqual(
      mark.absolute.offsetY,
      opened ? 'component/details/marker-open-center-offset' : 'spacing/0'
    );
    assert.strictEqual(s.children[0].textProperty, 'Title');
    assert.strictEqual(
      s.children[0].textStyle,
      Typography === 'BelowMedium'
        ? 'component.details.summary-below-medium'
        : 'component.details.summary-medium-up'
    );
    if (opened) {
      assert.strictEqual(
        s.bindings.strokeBottomWeight,
        'component/details/border-width'
      );
      assert.strictEqual(r.children[1].children[0].textProperty, 'Paragraph');
    }
    if (MeasuredViewport === '240') {
      assert.strictEqual(Typography, 'BelowMedium');
      assert(['Default', 'Focus'].includes(State));
    }
  }
  console.log(
    'ok  all-mode source alpha roles, exact Bold/Regular responsive styles,20 state trees and summary-only focus/border contracts'
  );
  const env = environment(doc);
  await importFoundation(env, doc);
  const result = await env.call('buildMangroveComponents', doc, 'undrr', [
    'details',
  ]);
  assert.strictEqual(result.errors.length, 0, result.errors.join('\n'));
  for (const entry of result.families[0].variantIds) {
    const c = env.state.nodes.get(entry.nodeId),
      spec = family.variants.find(v => v.id === entry.id),
      opened = spec.properties.Open === 'True',
      hover = spec.properties.State.includes('Hover'),
      s = c.children.find(n => n.name === 'mg-details / summary'),
      title = s.children.find(n => n.name === 'mg-details / title'),
      mark = s.children.find(n => n.name === 'mg-details / marker');
    assert.strictEqual(c.width, +spec.properties.MeasuredViewport);
    const generic = [...env.state.nodes.values()].find(
      n => identity(n) === `review/details/specimen/${spec.id}/instance`
    );
    assert(generic);
    assert.strictEqual(generic.width, c.width);
    assert.strictEqual(generic.layoutSizingHorizontal, 'FIXED');
    assert.strictEqual(generic.layoutSizingVertical, 'HUG');
    assert.strictEqual(c.fills.length, 0);
    assert.strictEqual(c.paddingLeft, 10);
    assert.strictEqual(c.strokeWeight, 1);
    assert.strictEqual(c.cornerRadius, 4);
    assert.strictEqual(Boolean(c.effectStyleId), hover);
    assert.strictEqual(s.minHeight, 48);
    assert.strictEqual(s.paddingLeft, 10);
    assert.strictEqual(s.paddingRight, 44);
    assert.strictEqual(s.primaryAxisAlignItems, 'MIN');
    assert.strictEqual(s.cornerRadius, hover ? 2 : 0);
    assert.strictEqual(title.fontName.style, 'Bold');
    assert.strictEqual(
      title.fontSize,
      spec.properties.Typography === 'BelowMedium' ? 16 : 18
    );
    assert.deepStrictEqual(title.lineHeight, { unit: 'PIXELS', value: 24 });
    assert.strictEqual(title.textDecoration, 'NONE');
    assert.strictEqual(mark.width, 30);
    assert.strictEqual(mark.height, 30);
    assert.strictEqual(mark.x, s.width - 30 - 10);
    assert.strictEqual(mark.y, (s.height - 30) / 2 + (opened ? -0.5 : 0));
    assert.strictEqual(mark.children[0].characters, opened ? '−' : '+');
    assert.strictEqual(mark.children[0].fontName.style, 'Regular');
    assert.deepStrictEqual(mark.children[0].lineHeight, {
      unit: 'PIXELS',
      value: 24,
    });
    if (opened) {
      assert.strictEqual(s.strokeBottomWeight, 1);
      assert.strictEqual(s.strokeTopWeight, 0);
      const body = c.children.find(n => n.name === 'mg-details / paragraph');
      assert(body);
      assert.strictEqual(body.paddingTop, 10);
      assert.strictEqual(
        body.children[0].fontSize,
        spec.properties.Typography === 'BelowMedium' ? 12.5 : 16
      );
      assert.deepStrictEqual(body.children[0].lineHeight, {
        unit: 'PERCENT',
        value: 160,
      });
    } else assert(!c.children.some(n => n.name === 'mg-details / paragraph'));
  }
  for (const specimen of family.review.specimens) {
    const n = [...env.state.nodes.values()].find(
      n => identity(n) === `review/details/specimen/${specimen.id}/instance`
    );
    assert(n);
    assert.strictEqual(n.width, specimen.width);
    for (const [name, text] of Object.entries(specimen.properties))
      assert.strictEqual(n.componentProperties[property(n, name)].value, text);
  }
  console.log(
    'ok  scoped native mock20states, transparent borders, min48, square/rounded focus, glyph centering and seeded long/unbroken finite review'
  );
  const review = [...env.state.nodes.values()].find(
    n => identity(n) === 'review/details/specimen/long-240/instance'
  );
  review.setProperties({
    [property(review, 'Title')]: 'Keep my edited disclosure title',
    [property(review, 'Paragraph')]: 'Keep my edited paragraph',
  });
  const ids = owned(env),
    styleIds = env.state.styles.map(s => s.id);
  const repeat = await env.call('buildMangroveComponents', doc, 'undrr', [
    'details',
  ]);
  assert.strictEqual(repeat.errors.length, 0, repeat.errors.join('\n'));
  assert.strictEqual(repeat.createdNodeIds.length, 0);
  assert.deepStrictEqual(owned(env), ids);
  assert.deepStrictEqual(
    env.state.styles.map(s => s.id),
    styleIds
  );
  assert.strictEqual(
    review.componentProperties[property(review, 'Title')].value,
    'Keep my edited disclosure title'
  );
  assert.strictEqual(
    review.componentProperties[property(review, 'Paragraph')].value,
    'Keep my edited paragraph'
  );
  console.log(
    'ok  repeat0new identities/styles with edited Title and Paragraph retained'
  );
  const narrowVariant = family.variants.find(
    entry =>
      entry.properties.Open === 'True' &&
      entry.properties.State === 'Default' &&
      entry.properties.MeasuredViewport === '240'
  );
  const generic = [...env.state.nodes.values()].find(
    n => identity(n) === `review/details/specimen/${narrowVariant.id}/instance`
  );
  generic.setBoundVariable('width', null);
  generic.resize(333, generic.height);
  generic.layoutSizingVertical = 'HUG';
  generic.setProperties({
    [property(generic, 'Title')]: 'Keep my narrow disclosure edit',
  });
  const preserve = await env.call('buildMangroveComponents', doc, 'undrr', [
    'details',
  ]);
  assert.strictEqual(preserve.errors.length, 0, preserve.errors.join('\n'));
  assert.strictEqual(generic.width, 333);
  const refreshIds = owned(env);
  const refreshed = await env.call(
    'buildMangroveComponents',
    doc,
    'undrr',
    ['details'],
    { refreshNarrowReview: true }
  );
  assert.strictEqual(refreshed.errors.length, 0, refreshed.errors.join('\n'));
  assert.strictEqual(refreshed.createdNodeIds.length, 0);
  assert.deepStrictEqual(owned(env), refreshIds);
  assert.strictEqual(generic.width, 240);
  assert.strictEqual(generic.layoutSizingVertical, 'HUG');
  assert.strictEqual(
    generic.componentProperties[property(generic, 'Title')].value,
    'Keep my narrow disclosure edit'
  );
  assert.strictEqual(review.width, 240);
  assert.strictEqual(
    review.componentProperties[property(review, 'Paragraph')].value,
    'Keep my edited paragraph'
  );
  console.log(
    'ok  generic measured viewport widths follow masters; normal repeat preserves edited width and explicit refresh retains IDs/text while restoring the source preset'
  );
  const missing = environment(doc, { rejectedFonts: ['Roboto Bold'] });
  await importFoundation(missing, doc);
  const before = missing.state.nodes.size,
    styleCount = missing.state.styles.length;
  const blocked = await missing.call('buildMangroveComponents', doc, 'undrr', [
    'details',
  ]);
  assert(blocked.errors.length);
  assert.strictEqual(missing.state.nodes.size, before);
  assert.strictEqual(missing.state.styles.length, styleCount);
  const wrong = copy(doc),
    badVar = wrong.variables.find(
      v => v.name === 'component/details/marker-open-center-offset'
    );
  badVar.type = 'COLOR';
  for (const mode of wrong.modes)
    badVar.values[mode.id] = { r: 0, g: 0, b: 0, a: 1 };
  const bad = environment(wrong);
  await importFoundation(bad, wrong);
  const previous = bad.state.nodes.size;
  const rejected = await bad.call('buildMangroveComponents', wrong, 'undrr', [
    'details',
  ]);
  assert(rejected.errors.length);
  assert.strictEqual(bad.state.nodes.size, previous);
  console.log(
    'ok  missing exact font/wrong-type positioning reject before partial native writes'
  );
}
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { document };
