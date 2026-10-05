#!/usr/bin/env node
/** Editorial CTA contracts and repeat checks. This mock does not render glyphs or text wrapping. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { environment, importFoundation } = require('./mock-kit.cjs');
const {
  buildEditorialCtaRecipes,
} = require('../../../scripts/figma-editorial-cta-recipes.cjs');
const root = path.resolve(__dirname, '../../..');
const copy = value => JSON.parse(JSON.stringify(value));
const identity = (node, key = 'mgKitId') =>
  node.getSharedPluginData('orgundrrmangrove', key);
function document() {
  const doc = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
  );
  const families = buildEditorialCtaRecipes({
    root,
    modes: doc.modes,
    variables: doc.variables,
    styles: doc.styles,
  });
  doc.components.families = [
    ...doc.components.families.filter(f => f.id !== 'editorial-cta'),
    ...families,
  ];
  return doc;
}
function changed(file, change, check) {
  const read = fs.readFileSync;
  let matched = false;
  fs.readFileSync = function (filename, ...args) {
    const value = read.call(this, filename, ...args);
    if (typeof filename !== 'string' || !filename.endsWith(file)) return value;
    const next = change(value);
    matched = next !== value;
    return next;
  };
  try {
    check();
    assert(matched, `Mutation did not match ${file}`);
  } finally {
    fs.readFileSync = read;
  }
}
function property(node, name) {
  const key = Object.keys(node.componentProperties).find(
    key => key.replace(/#[^#]+$/, '') === name
  );
  assert(key, `Missing ${name}`);
  return key;
}
function owned(env) {
  return [...env.state.nodes.values()]
    .filter(n => identity(n))
    .map(n => [identity(n), n.id])
    .sort((a, b) => a[0].localeCompare(b[0]));
}
async function build(doc, brand = 'undrr') {
  const env = environment(doc);
  const imported = await env.call(
    'importVariables',
    doc,
    [brand],
    false,
    [],
    false
  );
  assert.strictEqual(imported.errors.length, 0, imported.errors.join('\n'));
  const result = await env.call('buildMangroveComponents', doc, brand, [
    'editorial-cta',
  ]);
  assert.strictEqual(result.errors.length, 0, result.errors.join('\n'));
  return { env, result };
}
async function main() {
  const doc = document(),
    family = doc.components.families.find(f => f.id === 'editorial-cta');
  assert.strictEqual(family.variants.length, 23);
  const counts = [
    doc.variables.length,
    doc.styles.text.length,
    doc.styles.effect.length,
  ];
  assert.deepStrictEqual(
    buildEditorialCtaRecipes({
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
  const button = '/stories/Components/Buttons/CtaButton/cta-button.scss';
  for (const [before, after] of [
    ['font-weight: 600;', 'font-weight: 500;'],
    ['min-height: mg-rem(44);', 'min-height: mg-rem(40);'],
    ['max-inline-size: 100%;', 'max-inline-size: 90%;'],
    ['overflow-wrap: anywhere;', 'overflow-wrap: normal;'],
    [
      'padding-inline-end: calc(#{mg-rem(22)} + var(--mg-spacing-50));',
      'padding-inline-end: calc(#{mg-rem(22)} + var(--mg-spacing-75));',
    ],
    ['content: "›";', 'content: "→";'],
    ['height: mg-rem(22);', 'height: mg-rem(24);'],
    ['padding-block-end: 0.06em;', 'padding-block-end: 0.08em;'],
    ['padding-inline-start: 0.03em;', 'padding-inline-start: 0.05em;'],
    ['inset-block-start: 50%;', 'inset-block-start: 40%;'],
    [
      '--mg-cta-arrow-shift: #{mg-rem(3)};',
      '--mg-cta-arrow-shift: #{mg-rem(4)};',
    ],
    ['text-underline-offset: 0.2em;', 'text-underline-offset: 0.3em;'],
    [
      'pointer-events: none;\n}\n\n// Compact editorial',
      'pointer-events: auto;\n}\n\n// Compact editorial',
    ],
  ])
    changed(
      button,
      text => text.replace(before, after),
      () => assert.throws(document, /needs updating/)
    );
  changed(
    button,
    text => {
      const start = text.indexOf('.mg-button.disabled {\n  background-color:');
      const end = text.indexOf('\n}', start) + 2;
      const disabled = text.slice(start, end);
      return text.slice(0, start) + text.slice(end) + '\n' + disabled;
    },
    () => assert.throws(document, /Disabled rules now override/)
  );
  changed(
    '/stories/Components/Hero/hero.scss',
    text =>
      text.replace(
        'outline: 2px solid rgb(var(--mg-color-focus-ring-inverse));',
        'outline: 2px solid rgb(var(--mg-color-focus-ring));'
      ),
    () => assert.throws(document, /needs updating/)
  );
  changed(
    '/stories/assets/scss/_foundational.scss',
    text => text.replace('box-sizing: border-box;', 'box-sizing: content-box;'),
    () => assert.throws(document, /needs updating/)
  );
  changed(
    '/stories/assets/scss/_foundational.scss',
    text =>
      text.replace(
        '@include mg-focus-ring;\n\n    text-decoration: underline;',
        '@include mg-focus-ring;\n\n    text-decoration: none;'
      ),
    () => assert.throws(document, /needs updating/)
  );
  changed(
    '/stories/Components/Buttons/CtaButton/CtaButton.jsx',
    text =>
      text.replace(
        "'aria-disabled': 'true', tabIndex: -1",
        "'aria-disabled': 'false', tabIndex: -1"
      ),
    () => assert.throws(document, /needs updating/)
  );
  changed(
    '/stories/Components/Buttons/CtaButton/CtaButton.stories.jsx',
    text => text.replace("maxWidth: '260px'", "maxWidth: '280px'"),
    () => assert.throws(document, /needs updating/)
  );
  console.log(
    'ok  idempotent 23-variant exporter and source drift guards for paints, geometry, font, glyph, disabled cascade, focus and actual stories'
  );
  const variables = new Map(doc.variables.map(v => [v.name, v]));
  const value = (name, mode, seen = new Set()) => {
    assert(!seen.has(name));
    seen.add(name);
    const entry = variables.get(name).values[mode];
    return entry.alias ? value(entry.alias, mode, seen) : entry;
  };
  for (const mode of doc.modes) {
    const get = name => value(name, mode.id),
      prefix = 'component/editorial-cta/';
    assert.strictEqual(get(prefix + 'badge-size'), 22);
    assert.strictEqual(get(prefix + 'badge-font-size'), 18);
    assert.strictEqual(get(prefix + 'badge-radius'), 11);
    assert.strictEqual(get(prefix + 'minimum-height'), 44);
    assert.strictEqual(
      get(prefix + 'reserved-inline-end'),
      22 + get('spacing/50')
    );
    assert.strictEqual(
      get(prefix + 'badge-end-offset'),
      -get('border-width/button')
    );
    assert.strictEqual(
      get(prefix + 'badge-hover-end-offset'),
      3 - get('border-width/button')
    );
    assert.strictEqual(get(prefix + 'badge-optical-inline-start'), 0.54);
    assert.strictEqual(get(prefix + 'badge-optical-block-end'), 1.08);
    assert.strictEqual(get(prefix + 'long-consumer-width'), 260);
  }
  for (const spec of family.variants) {
    const { Context, State, Content, Motion } = spec.properties;
    const hero = Context !== 'Base',
      rootNode = spec.tree,
      label = rootNode.children[0],
      badge = rootNode.children[1],
      glyph = badge.children[0];
    assert.strictEqual(rootNode.stroke, 'component/color/transparent');
    assert.strictEqual(rootNode.strokesIncludedInLayout, true);
    assert.strictEqual(rootNode.fill, null);
    assert.strictEqual(rootNode.layout.height, 'HUG');
    assert.strictEqual(
      rootNode.layout.width,
      Content === 'Long' ? 'component/editorial-cta/long-consumer-width' : 'HUG'
    );
    assert.strictEqual(label.layout.width, Content === 'Long' ? 'FILL' : 'HUG');
    assert.strictEqual(label.textProperty, 'Label');
    assert.strictEqual(
      label.textDecoration,
      ['Hover', 'Focus'].includes(State) ? 'UNDERLINE' : 'NONE'
    );
    assert.strictEqual(rootNode.bindings.opacity, undefined);
    assert.strictEqual(
      rootNode.bindings.paddingRight,
      'component/editorial-cta/reserved-inline-end'
    );
    assert.strictEqual(badge.absolute.horizontal, 'END');
    assert.strictEqual(badge.absolute.vertical, 'CENTER');
    assert.strictEqual(
      badge.absolute.offsetX,
      State === 'Hover' && Motion === 'NoPreference'
        ? 'component/editorial-cta/badge-hover-end-offset'
        : 'component/editorial-cta/badge-end-offset'
    );
    assert.strictEqual(badge.absolute.offsetY, 'spacing/0');
    assert.strictEqual(glyph.characters, '›');
    assert.strictEqual(glyph.textStyle, 'component.editorial-cta.badge');
    assert.strictEqual(
      label.fill,
      hero
        ? 'color/neutral-0'
        : State === 'Hover'
          ? 'color/interactive-active'
          : 'color/text'
    );
    assert.strictEqual(
      badge.fill,
      hero
        ? 'color/neutral-0'
        : State === 'Hover'
          ? 'color/interactive-active'
          : 'color/interactive'
    );
    assert.strictEqual(
      glyph.fill,
      hero
        ? Context === 'HeroTertiary'
          ? 'color/neutral-900'
          : Context === 'HeroQuaternary'
            ? 'color/red-800'
            : 'color/hero'
        : 'color/neutral-0'
    );
    assert.strictEqual(
      family.review.variantSurfaces[spec.id],
      hero ? glyph.fill : undefined
    );
    assert.deepStrictEqual(
      label.textDecorationOffset,
      State === 'Hover' ? { unit: 'PERCENT', value: 20 } : { unit: 'AUTO' }
    );
    if (State === 'Focus') {
      assert.strictEqual(
        rootNode.focusRing.color,
        hero ? 'color/focus-ring-inverse' : 'color/focus-ring'
      );
    } else assert.strictEqual(rootNode.focusRing, undefined);
    if (State === 'Disabled') assert.strictEqual(Context, 'Base');
  }
  assert.strictEqual(Object.keys(family.review.variantSurfaces).length, 15);
  for (const specimen of family.review.specimens)
    assert.strictEqual(
      specimen.surface,
      specimen.variant.Context === 'HeroTertiary'
        ? 'color/neutral-900'
        : specimen.variant.Context === 'HeroQuaternary'
          ? 'color/red-800'
          : specimen.variant.Context === 'HeroPrimary'
            ? 'color/hero'
            : undefined
    );
  for (const style of doc.styles.text.filter(s =>
    s.id.startsWith('component.editorial-cta.')
  ))
    for (const mode of doc.modes) {
      const v = style.values[mode.id];
      assert.strictEqual(v.fontName.family, 'Roboto');
      assert.strictEqual(v.fontName.style, 'Bold');
      assert.strictEqual(v.lineHeight.value, 100);
      assert.strictEqual(v.lineHeight.unit, 'PERCENT');
      assert.strictEqual(
        v.textDecoration,
        style.id.endsWith('-hover') || style.id.endsWith('-focus')
          ? 'UNDERLINE'
          : 'NONE'
      );
      assert.deepStrictEqual(
        v.textDecorationOffset,
        style.id.endsWith('-hover')
          ? { unit: 'PERCENT', value: 20 }
          : { unit: 'AUTO' }
      );
    }
  console.log(
    'ok  all-mode source helpers, all 23 state/context/motion trees, requested 600 matched Bold 700, source glyph and exported offset metadata/node contracts'
  );
  const runtime = fs.readFileSync(
    path.join(__dirname, '../kit-builder.js'),
    'utf8'
  );
  if (
    process.argv.includes('--recipes-only') ||
    !runtime.includes('spec.absolute') ||
    !runtime.includes('textDecorationOffset')
  ) {
    console.log(
      'pending  native mock build requires the coordinated generic absolute-position and textDecorationOffset runtime contracts; pure exporter checks passed'
    );
    return;
  }
  const { env, result } = await build(doc);
  const paint = (node, field, name) =>
    assert.strictEqual(
      node[field][0].boundVariables.color.id,
      env.state.variables.find(v => v.name === name).id
    );
  for (const entry of result.families[0].variantIds) {
    const spec = family.variants.find(v => v.id === entry.id),
      c = env.state.nodes.get(entry.nodeId),
      label = c.children.find(n => n.name === 'mg-button-cta / label'),
      badge = c.children.find(n => n.name === 'mg-button-cta / badge'),
      glyph = badge.children[0];
    assert.strictEqual(c.minHeight, 44);
    assert.strictEqual(c.paddingTop, 5);
    assert.strictEqual(c.paddingBottom, 5);
    assert.strictEqual(c.paddingLeft, 0);
    assert.strictEqual(c.paddingRight, 27);
    assert.strictEqual(c.strokeWeight, 1);
    assert.strictEqual(c.cornerRadius, 5);
    assert.strictEqual(c.opacity, 1);
    assert.strictEqual(badge.width, 22);
    assert.strictEqual(badge.height, 22);
    assert.strictEqual(badge.cornerRadius, 11);
    assert.strictEqual(badge.paddingLeft, 0.54);
    assert.strictEqual(badge.paddingBottom, 1.08);
    assert.strictEqual(badge.layoutPositioning, 'ABSOLUTE');
    const offset = value(spec.tree.children[1].absolute.offsetX, 'undrr');
    assert.strictEqual(badge.x, c.width - 22 + offset);
    assert.strictEqual(badge.y, (c.height - 22) / 2);
    assert.strictEqual(label.fontName.style, 'Bold');
    assert.strictEqual(label.fontSize, 14);
    assert.strictEqual(glyph.fontSize, 18);
    assert.strictEqual(glyph.characters, '›');
    assert.strictEqual(
      label.textDecoration,
      spec.tree.children[0].textDecoration
    );
    assert.deepStrictEqual(
      label.textDecorationOffset,
      ['Hover', 'Focus'].includes(spec.properties.State)
        ? spec.tree.children[0].textDecorationOffset
        : null
    );
    assert.strictEqual(glyph.textDecorationOffset, null);
    paint(label, 'fills', spec.tree.children[0].fill);
    paint(badge, 'fills', spec.tree.children[1].fill);
    paint(glyph, 'fills', spec.tree.children[1].children[0].fill);
  }
  console.log(
    'ok  scoped native mock construction, absolute endpoint geometry, transparent bordered layout and source typography/paints/underline fields'
  );
  for (const specimen of [
    ...family.variants.map(spec => ({
      id: spec.id,
      surface: family.review.variantSurfaces[spec.id],
    })),
    ...family.review.specimens,
  ]) {
    const surface = [...env.state.nodes.values()].find(
      n =>
        identity(n) === `review/editorial-cta/specimen/${specimen.id}/surface`
    );
    if (specimen.surface) {
      assert(surface);
      assert.strictEqual(surface.visible, true);
      assert.strictEqual(surface.paddingLeft, 8);
      paint(surface, 'fills', specimen.surface);
    } else assert.strictEqual(surface, undefined);
  }
  const review = [...env.state.nodes.values()].find(
    n =>
      n.type === 'INSTANCE' &&
      identity(n).startsWith('review/editorial-cta/specimen/long-base-focus')
  );
  assert(review);
  assert.strictEqual(review.width, 260);
  assert.strictEqual(
    review.componentProperties[property(review, 'Label')].value,
    family.review.specimens.find(s => s.id === 'long-base-focus').properties
      .Label
  );
  review.setProperties({
    [property(review, 'Label')]: 'Keep this edited publication title',
  });
  const ids = owned(env),
    definitions = copy(
      env.state.nodes.get(result.families[0].setId).componentPropertyDefinitions
    );
  const repeat = await env.call('buildMangroveComponents', doc, 'undrr', [
    'editorial-cta',
  ]);
  assert.strictEqual(repeat.errors.length, 0, repeat.errors.join('\n'));
  assert.strictEqual(repeat.createdNodeIds.length, 0);
  assert.deepStrictEqual(owned(env), ids);
  assert.deepStrictEqual(
    env.state.nodes.get(result.families[0].setId).componentPropertyDefinitions,
    definitions
  );
  assert.strictEqual(
    review.componentProperties[property(review, 'Label')].value,
    'Keep this edited publication title'
  );
  console.log(
    'ok  fresh-only long Label seeds and repeated set/variant/layer/property identity with edited Label retained'
  );
  const wrong = copy(doc);
  const wrongHelper = wrong.variables.find(
    v => v.name === 'component/editorial-cta/badge-hover-end-offset'
  );
  wrongHelper.type = 'COLOR';
  for (const mode of wrong.modes)
    wrongHelper.values[mode.id] = { r: 0, g: 0, b: 0, a: 1 };
  const bad = environment(wrong);
  await importFoundation(bad, wrong);
  const nodeCount = bad.state.nodes.size,
    blocked = await bad.call('buildMangroveComponents', wrong, 'undrr', [
      'editorial-cta',
    ]);
  assert(blocked.errors.length);
  assert.strictEqual(bad.state.nodes.size, nodeCount);
  const missing = environment(doc, { rejectedFonts: ['Roboto Bold'] });
  await importFoundation(missing, doc);
  const before = missing.state.nodes.size,
    fontResult = await missing.call('buildMangroveComponents', doc, 'undrr', [
      'editorial-cta',
    ]);
  assert(fontResult.errors.length);
  assert.strictEqual(missing.state.nodes.size, before);
  console.log(
    'ok  required exact font and wrong-type absolute geometry block before partial native canvas writes'
  );
}
if (require.main === module)
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
module.exports = { document };
