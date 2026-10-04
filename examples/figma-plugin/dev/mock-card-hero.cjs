#!/usr/bin/env node
/** Source/export/runtime contracts only. No native font, crop or pixel acceptance. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { environment, importFoundation } = require('./mock-kit.cjs');
const {
  buildCardHeroRecipes,
} = require('../../../scripts/figma-card-hero-recipes.cjs');
const root = path.resolve(__dirname, '../../..');
const ids = [
  'card-vertical',
  'card-horizontal',
  'hero-background',
  'hero-split',
];
const clone = v => JSON.parse(JSON.stringify(v));
const identity = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
const walk = n => [n, ...(n.children || []).flatMap(walk)];
function document() {
  const d = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
  );
  const families = buildCardHeroRecipes({
    root,
    modes: d.modes,
    variables: d.variables,
    styles: d.styles,
  });
  d.components.families = [
    ...d.components.families.filter(f => !ids.includes(f.id)),
    ...families,
  ];
  // Match actual exporter identity normalization, not a hand-authored raw-ID fixture.
  for (const f of families)
    for (const v of f.variants) {
      const normalize = (n, p = '') => {
        n.id = p ? `${p}/${n.name}` : n.name;
        for (const c of n.children || []) normalize(c, n.id);
      };
      normalize(v.tree);
    }
  return d;
}
function resolve(doc, name, mode) {
  const v = doc.variables.find(v => v.name === name || v.id === name);
  assert(v, `Missing${name}`);
  const result = v.values[mode];
  return result?.alias ? resolve(doc, result.alias, mode) : result;
}
function property(instance, name) {
  const key = Object.keys(instance.componentProperties).find(
    k => k.replace(/#[^#]+$/, '') === name
  );
  assert(key, `Missing${name}`);
  return key;
}
async function main() {
  const doc = document(),
    families = doc.components.families.filter(f => ids.includes(f.id));
  assert.deepStrictEqual(
    families.map(f => [f.id, f.variants.length]),
    [
      ['card-vertical', 8],
      ['card-horizontal', 8],
      ['hero-background', 8],
      ['hero-split', 16],
    ]
  );
  assert(
    families.every(
      f => f.review.preserveVariantSizing && f.review.genericLabels === false
    )
  );
  const counts = [doc.variables.length, doc.styles.text.length];
  const repeat = buildCardHeroRecipes({
    root,
    modes: doc.modes,
    variables: doc.variables,
    styles: doc.styles,
  });
  assert.deepStrictEqual(
    [doc.variables.length, doc.styles.text.length],
    counts
  );
  assert.deepStrictEqual(
    repeat.map(f => f.variants.map(v => v.properties)),
    families.map(f => f.variants.map(v => v.properties))
  );
  for (const m of doc.modes) {
    assert.strictEqual(
      resolve(doc, 'component/card-hero/card-leading-rule', m.id),
      4
    );
    assert.strictEqual(
      resolve(doc, 'component/card-hero/hero-leading-rule', m.id),
      8
    );
    assert.strictEqual(
      resolve(doc, 'component/card-hero/card-visual-radius', m.id),
      resolve(doc, 'card/border-radius', m.id) / 2
    );
    assert.strictEqual(
      resolve(doc, 'component/card-hero/card-paragraph-bottom', m.id),
      resolve(doc, 'spacing/50', m.id) + resolve(doc, 'font-size/300', m.id)
    );
    for (const [helper, role] of [
      ['primary-tint-start', 'hero-gradient/start-opacity'],
      ['primary-tint-middle', 'hero-gradient/middle-opacity'],
      ['primary-tint-end', 'hero-gradient/end-opacity'],
      ['hero-scrim-color', 'hero-scrim/opacity'],
    ])
      assert.strictEqual(
        resolve(doc, `component/card-hero/${helper}`, m.id).a,
        resolve(doc, role, m.id) / 100
      );
    const tint = resolve(doc, 'color/hero', m.id),
      scrim = resolve(doc, 'color/neutral-900', m.id),
      alpha = resolve(doc, 'hero-scrim/opacity', m.id) / 100;
    assert.deepStrictEqual(
      resolve(doc, 'component/card-hero/primary-mobile-panel', m.id),
      {
        r: tint.r * (1 - alpha) + scrim.r * alpha,
        g: tint.g * (1 - alpha) + scrim.g * alpha,
        b: tint.b * (1 - alpha) + scrim.b * alpha,
        a: 1,
      }
    );
    for (const s of doc.styles.text.filter(s =>
      /^component\.(card|hero)\./.test(s.id)
    )) {
      assert.strictEqual(
        s.values[m.id].fontName.family,
        s.id.endsWith('summary') ? 'Roboto' : 'Roboto Condensed'
      );
      assert.deepStrictEqual(
        s.values[m.id].lineHeight,
        s.id.includes('title')
          ? {
              unit: 'PERCENT',
              value: s.id.startsWith('component.card') ? 125 : 120,
            }
          : { unit: 'PIXELS', value: 24 }
      );
    }
  }
  console.log(
    'ok 40 bounded source variants, all-mode helpers/styles and idempotent pure append'
  );
  const bytes = fs.readFileSync(
    path.join(root, 'stories/assets/images/sample_image-lg.jpg')
  );
  for (const f of families)
    for (const v of f.variants) {
      const nodes = walk(v.tree),
        image = nodes.find(n => n.image);
      assert(image);
      assert.strictEqual(image.image.assetId, 'mangrove-sample-farmer');
      assert.strictEqual(
        crypto
          .createHash('sha256')
          .update(Buffer.from(image.image.base64, 'base64'))
          .digest('hex'),
        crypto.createHash('sha256').update(bytes).digest('hex')
      );
      if (f.id.startsWith('card')) {
        assert.strictEqual(v.properties.Link, 'Unlinked');
        assert.strictEqual(v.properties.CTA, 'ButtonOnly');
        assert(!nodes.some(n => n.focusRing));
        assert.strictEqual(
          nodes.find(n => n.textProperty === 'Title').fill,
          'color/text'
        );
        const rule = nodes.find(
          n => n.name === 'mg-card / leading secondary rule'
        );
        assert.strictEqual(Boolean(rule), v.properties.Tone === 'Secondary');
        if (rule)
          assert.strictEqual(
            rule.layout.width,
            'component/card-hero/card-leading-rule'
          );
        assert(
          nodes.find(n => n.family === 'editorial-cta').variant.Context ===
            'Base'
        );
      } else {
        assert.strictEqual(v.properties.Heading, 'Section');
        if (f.id === 'hero-background' && v.properties.Tone === 'Secondary') {
          const rule = v.tree.children.find(
            n => n.name === 'mg-hero / leading secondary rule'
          );
          assert(rule);
          if (v.properties.Viewport === '390')
            assert.strictEqual(
              v.tree.children.find(
                n => n.name === 'mg-hero / mobile composition'
              ).children[0].name,
              'mg-hero / banner image'
            );
          else {
            const veil = nodes.find(n => n.gradient);
            assert.strictEqual(veil.position.x, 8);
            assert.strictEqual(resolve(doc, veil.layout.width, 'undrr'), 1272);
          }
        }
        assert.strictEqual(
          nodes.find(n => n.textProperty === 'Title').name,
          'mg-hero__title h2'
        );
        assert(
          nodes
            .filter(n => n.family === 'editorial-cta')
            .every(n => n.variant.Context.startsWith('Hero'))
        );
        if (f.id === 'hero-background' && v.properties.Viewport === '1280') {
          const veil = nodes.find(n => n.gradient);
          assert(veil);
          assert(
            veil.gradient.layers[0].stops.every(s => s.color.includes('scrim'))
          );
          assert(
            veil.gradient.layers[1].stops.every(s => s.color.includes('tint'))
          );
          assert.strictEqual(v.tree.layout.mode, 'NONE');
        }
      }
      for (const n of nodes.filter(n => n.position)) {
        const parent = nodes.find(p => p.children?.includes(n));
        assert.strictEqual(parent.layout.mode, 'NONE');
      }
    }
  console.log(
    'ok source JPEG identity, unlinked Card paints, separate rules, h2 and veil layer order'
  );
  const read = fs.readFileSync;
  fs.readFileSync = function (file, ...args) {
    const value = read.call(this, file, ...args);
    return typeof file === 'string' && file.endsWith('/Card/card.scss')
      ? value.replace('mg-rem(4) solid', 'mg-rem(8) solid')
      : value;
  };
  try {
    assert.throws(document, /Guarded source changed/);
  } finally {
    fs.readFileSync = read;
  }
  for (const mutate of [
    d => {
      d.variables.find(v => v.name === 'font-family/ui').type = 'FLOAT';
    },
    d => {
      d.variables.find(v => v.name === 'card/padding').values.undrr = {
        alias: 'card.padding',
      };
    },
    d => {
      delete d.variables.find(v => v.name === 'color/hero').values.undrr;
    },
  ]) {
    const bad = clone(doc);
    mutate(bad);
    const before = [bad.variables.length, bad.styles.text.length];
    assert.throws(
      () =>
        buildCardHeroRecipes({
          root,
          modes: bad.modes,
          variables: bad.variables,
          styles: bad.styles,
        }),
      /Missing|cyclic|wrong-type/
    );
    assert.deepStrictEqual(
      [bad.variables.length, bad.styles.text.length],
      before
    );
  }
  console.log(
    'ok source drift, typed role, cyclic alias and missing mode refuse before appending'
  );
  const env = environment(doc);
  await importFoundation(env, doc);
  const first = await env.call('buildMangroveComponents', doc, 'undrr', ids);
  assert.strictEqual(first.errors.length, 0, first.errors.join('\n'));
  assert.strictEqual(
    first.families.filter(f => ids.includes(f.id)).flatMap(f => f.variantIds)
      .length,
    40
  );
  for (const f of first.families.filter(f => ids.includes(f.id)))
    for (const entry of f.variantIds) {
      const c = env.state.nodes.get(entry.nodeId),
        recipe = families
          .find(family => family.id === f.id)
          .variants.find(v => v.id === entry.id);
      assert.strictEqual(c.width, Number(recipe.properties.Viewport));
      for (const action of walk(recipe.tree).filter(
        n => n.type === 'INSTANCE' && n.family === 'editorial-cta'
      )) {
        const native = walk(c).find(n => n.name === action.name);
        assert(native);
        assert.strictEqual(
          native.componentProperties[property(native, 'Label')].value,
          action.overrides.Label
        );
      }
      const nativeImage = walk(c).find(n =>
        n.fills?.some(p => p.type === 'IMAGE')
      );
      assert(nativeImage);
      assert.strictEqual(
        nativeImage.fills.find(p => p.type === 'IMAGE').scaleMode,
        'FILL'
      );
      const generic = [...env.state.nodes.values()].find(
        n => identity(n) === `review/${f.id}/specimen/${entry.id}/instance`
      );
      assert(generic);
      assert.strictEqual(generic.width, c.width);
    }
  const mainComponent = env.state.nodes.get(
    first.families.find(f => f.id === 'card-vertical').variantIds[0].nodeId
  );
  const instance = mainComponent.createInstance();
  const titleKey = property(instance, 'Title'),
    showKey = property(instance, 'Show image');
  instance.setProperties({
    [titleKey]: 'Edited card title retained across source updates',
    [showKey]: false,
  });
  const imageOverride = walk(instance).find(n =>
    n.fills?.some(p => p.type === 'IMAGE')
  );
  imageOverride.fills = [
    { type: 'IMAGE', imageHash: 'designer-image', scaleMode: 'FILL' },
  ];
  const baseline = {
    id: instance.id,
    main: (await instance.getMainComponentAsync()).id,
    propertyKeys: Object.keys(instance.componentProperties),
    title: instance.componentProperties[titleKey].value,
    show: instance.componentProperties[showKey].value,
    imageId: imageOverride.id,
    imageFills: clone(imageOverride.fills),
  };
  const ownedBefore = [...env.state.nodes.values()]
    .filter(identity)
    .map(n => [identity(n), n.id])
    .sort();
  for (let i = 0; i < 2; i++) {
    const result = await env.call('buildMangroveComponents', doc, 'undrr', ids);
    assert.strictEqual(result.errors.length, 0, result.errors.join('\n'));
    assert.strictEqual(result.createdNodeIds.length, 0);
    assert.deepStrictEqual(
      [...env.state.nodes.values()]
        .filter(identity)
        .map(n => [identity(n), n.id])
        .sort(),
      ownedBefore
    );
    assert.deepStrictEqual(
      {
        id: instance.id,
        main: (await instance.getMainComponentAsync()).id,
        propertyKeys: Object.keys(instance.componentProperties),
        title: instance.componentProperties[titleKey].value,
        show: instance.componentProperties[showKey].value,
        imageId: imageOverride.id,
        imageFills: clone(imageOverride.fills),
      },
      baseline
    );
  }
  console.log(
    'ok actual builder normalized identities,40 mains, preserved widths and two zero-create reruns with edited text/visibility/image fill'
  );
  const malformed = clone(doc);
  const invalid = walk(
    malformed.components.families.find(f => f.id === 'card-vertical')
      .variants[0].tree
  ).find(n => n.type === 'INSTANCE');
  invalid.properties = invalid.overrides;
  delete invalid.overrides;
  const invalidEnv = environment(malformed);
  await importFoundation(invalidEnv, malformed);
  const invalidResult = await invalidEnv.call(
    'buildMangroveComponents',
    malformed,
    'undrr',
    ['card-vertical']
  );
  assert(invalidResult.errors.some(e => e.includes('must use overrides')));
  assert(!invalidResult.families.some(f => f.id === 'card-vertical'));
  const unavailable = environment(doc, {
    rejectedFonts: ['Roboto Condensed Bold', 'Roboto Condensed Regular'],
  });
  await importFoundation(unavailable, doc);
  const rejected = await unavailable.call(
    'buildMangroveComponents',
    doc,
    'undrr',
    ['card-vertical']
  );
  assert(rejected.errors.length);
  assert(!rejected.families.some(f => f.id === 'card-vertical'));
  assert(
    ![...unavailable.state.nodes.values()].some(
      n =>
        identity(n).startsWith('family/card-vertical') ||
        identity(n).startsWith('variant/card-vertical')
    )
  );
  console.log(
    'ok unavailable exact Condensed face refuses selected Card canvas creation without fallback'
  );
  console.log(
    'All Card/Hero mock groups passed. Native typography, edited consumer ranges, image/gradient raster and source-height acceptance remain pending.'
  );
}
main().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
