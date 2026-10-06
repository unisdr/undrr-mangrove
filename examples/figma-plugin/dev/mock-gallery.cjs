#!/usr/bin/env node
/** Actual authored image Gallery source/builder checks. No native raster or behavior claim. */
'use strict';
const fs = require('fs'),
  path = require('path'),
  assert = require('assert');
const root = path.resolve(__dirname, '../../..');
const recipes = require('../../../scripts/figma-gallery-recipes.cjs');
const { rangeEnvironment } = require('./mock-rich-text-integration.cjs');
const {
  installNativeTextPropertyDefaultFixture,
} = require('./mock-search-results.cjs');
const copy = x => JSON.parse(JSON.stringify(x));
const walk = n => [n, ...(n.children || []).flatMap(walk)];
const identity = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
const original = () =>
  JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
  );
function document() {
  const d = original();
  d.components.families = recipes.buildGalleryImageRecipes({ root, ...d });
  return d;
}
function master(n) {
  for (let p = n.parent; p; p = p.parent)
    if (p.type === 'INSTANCE') return false;
  return true;
}
function snapshot(env) {
  return copy(
    [...env.state.nodes.values()]
      .map(n => [
        n.id,
        identity(n),
        n.parent?.id,
        n.type,
        n.x,
        n.y,
        n.width,
        n.height,
        n.opacity,
        n.layoutMode,
        n.primaryAxisSizingMode,
        n.counterAxisSizingMode,
        n.characters,
        n.componentPropertyReferences,
        n.type === 'INSTANCE' ? n.componentProperties : null,
        n.boundVariables,
        n.fills,
        n.strokes,
        n.effects,
        n.explicitVariableModes,
      ])
      .sort((a, b) => a[0].localeCompare(b[0]))
  );
}
async function main() {
  const d = document();
  assert.equal(d.components.families.length, 1);
  assert.equal(d.components.families[0].id, 'gallery-image');
  assert.equal(d.components.families[0].variants.length, 44);
  assert.deepStrictEqual(document(), d);
  const source = recipes.inspectGalleryImageSource({ root }).source;
  function resolve(name, mode) {
    const v = d.variables.find(v => v.name === name);
    assert(v, name);
    const x = v.values[mode];
    return x?.alias ? resolve(x.alias, mode) : x;
  }
  for (const mode of d.modes) {
    const env = await rangeEnvironment(d);
    installNativeTextPropertyDefaultFixture(env);
    const imported = await env.call(
      'importVariables',
      d,
      [mode.id],
      false,
      [],
      false
    );
    assert.deepStrictEqual(copy(imported.errors), []);
    const built = await env.call('buildMangroveComponents', d, mode.id, [
      'gallery-image',
    ]);
    assert.deepStrictEqual(copy(built.errors), []);
    assert(built.createdNodeIds.length);
    const family = d.components.families[0];
    const actual = (v, s) =>
      [...env.state.nodes.values()].find(
        n =>
          master(n) &&
          (s === v.tree
            ? identity(n) === 'family/gallery-image/variant/' + v.id
            : identity(n).includes('/variant/' + v.id + '/') &&
              identity(n).endsWith('/' + s.id))
      );
    function defaults() {
      for (const v of family.variants)
        for (const t of walk(v.tree).filter(t => t.textProperty)) {
          const n = actual(v, t);
          assert(n, t.id);
          assert.equal(n.characters, t.characters);
          const ref = n.componentPropertyReferences.characters;
          assert(ref);
          assert(ref, t.textProperty);
        }
    }
    defaults();
    for (const v of family.variants) {
      const brand = mode.id === 'mcr' ? 'mcr2030' : mode.id;
      const capture = source.captures.find(
        c =>
          c.file ===
          `${brand}-${v.properties.Configuration}-${v.properties.Viewport}-${Number(v.properties.Image) - 1}.json`
      ).capture;
      for (const s of walk(v.tree)) {
        const n = actual(v, s);
        assert(n, s.id);
        if (s.type === 'FRAME') {
          assert.equal(
            n.width,
            resolve(s.layout.width, mode.id),
            s.id + ' width'
          );
          assert.equal(
            n.height,
            resolve(s.layout.height, mode.id),
            s.id + ' height'
          );
        }
        if (s.absolute) {
          assert.equal(n.x, resolve(s.absolute.offsetX, mode.id), s.id + ' x');
          assert.equal(n.y, resolve(s.absolute.offsetY, mode.id), s.id + ' y');
        }
        if (s.bindings?.opacity)
          assert.equal(n.opacity, resolve(s.bindings.opacity, mode.id) / 100);
        const own =
          s.sourceGalleryNode &&
          capture.nodes.find(k => k.id === s.sourceGalleryNode.id);
        if (own) {
          assert.equal(n.width, own.rect.width, 'actual source owner width');
          assert.equal(n.height, own.rect.height, 'actual source owner height');
          assert.equal(
            n.opacity,
            Number(own.style.opacity),
            'source CSS opacity'
          );
          if (own.parentId) {
            const p = capture.nodes.find(k => k.id === own.parentId);
            assert.equal(n.x, own.rect.x - p.rect.x);
            assert.equal(n.y, own.rect.y - p.rect.y);
          }
        }
        if (s.sourceContainOwner) {
          const leaf = s.children.find(
            c =>
              c.sourceImage?.sourceFit ===
              'contain natural-aspect inner drawing'
          );
          assert(leaf, 'Actual contained leaf');
          const drawn = actual(v, leaf);
          const ratio = Math.min(
            n.width / s.sourceContainOwner.naturalWidth,
            n.height / s.sourceContainOwner.naturalHeight
          );
          assert.equal(drawn.width, s.sourceContainOwner.naturalWidth * ratio);
          assert.equal(
            drawn.height,
            s.sourceContainOwner.naturalHeight * ratio
          );
          assert.equal(drawn.x, (n.width - drawn.width) / 2);
          assert.equal(drawn.y, (n.height - drawn.height) / 2);
          if (n.width === 358 && n.height === 119.328125) {
            assert.equal(
              drawn.width,
              357.984375,
              'Quantized panorama owner is not filled/cropped'
            );
            assert.equal(drawn.x, 0.0078125);
          }
        }
        if (s.image) {
          const paint = n.fills.find(p => p.type === 'IMAGE');
          assert(paint, 'actual bound image');
          assert.equal(paint.scaleMode, s.image.scaleMode);
          assert(s.sourceImage.sha256);
        }
      }
    }
    const v = family.variants.find(
      v =>
        v.sourceContract.story === 'basic-gallery' &&
        v.sourceContract.viewport === 390 &&
        v.sourceContract.selectedIndex === 0
    );
    const title = walk(v.tree).find(n => n.textProperty?.endsWith('Title'));
    const caption = walk(v.tree).find(n => n.textProperty?.endsWith('Caption'));
    assert(caption, 'Actual editable caption');
    const main = actual(v, v.tree);
    const consumer = main.createInstance();
    const ref = actual(v, title).componentPropertyReferences.characters;
    const captionRef = actual(v, caption).componentPropertyReferences
      .characters;
    consumer.setProperties({
      [ref]: 'Maintained Gallery title',
      [captionRef]: 'Maintained Gallery caption',
    });
    const linked = consumer.findAll(
      n =>
        n.type === 'TEXT' && n.componentPropertyReferences?.characters === ref
    )[0];
    assert(linked);
    env.figma.currentPage.appendChild(consumer);
    // The base API stores setProperties overrides without rendering inherited
    // TEXT. Project exactly this observed same-reference native display field.
    const linkedCaption = consumer.findAll(
      n =>
        n.type === 'TEXT' &&
        n.componentPropertyReferences?.characters === captionRef
    )[0];
    assert(linkedCaption);
    for (const [target, reference] of [
      [linked, ref],
      [linkedCaption, captionRef],
    ]) {
      let descriptorOwner = target,
        descriptor;
      while (descriptorOwner && !descriptor) {
        descriptor = Object.getOwnPropertyDescriptor(
          descriptorOwner,
          'characters'
        );
        descriptorOwner = Object.getPrototypeOf(descriptorOwner);
      }
      assert(descriptor?.set);
      Object.defineProperty(target, 'characters', {
        configurable: true,
        get() {
          return consumer.componentProperties[reference].value;
        },
        set(x) {
          descriptor.set.call(this, x);
        },
      });
    }
    assert.equal(linkedCaption.characters, 'Maintained Gallery caption');
    const imagesBefore = [...env.state.images].map(([key, bytes]) => [
      key,
      bytes.toString('base64'),
    ]);
    assert.equal(linked.characters, 'Maintained Gallery title');
    let prior = snapshot(env);
    for (let i = 0; i < 2; i++) {
      const r = await env.call('buildMangroveComponents', d, mode.id, [
        'gallery-image',
      ]);
      assert.deepStrictEqual(copy(r.errors), []);
      assert.equal(r.createdNodeIds.length, 0);
      if (r.removedNodeIds) assert.equal(r.removedNodeIds.length, 0);
      assert.deepStrictEqual(snapshot(env), prior);
      defaults();
      assert.equal(linked.characters, 'Maintained Gallery title');
      assert.equal(linkedCaption.characters, 'Maintained Gallery caption');
      assert.deepStrictEqual(
        [...env.state.images].map(([key, bytes]) => [
          key,
          bytes.toString('base64'),
        ]),
        imagesBefore,
        'Pinned image cache preserved'
      );
      prior = snapshot(env);
    }
    console.log(
      mode.id +
        ' actual44 image masters, source owner allocations/opacity/contain projection/cover, linked Title and Caption edits and two exact zero-create repeats pass'
    );
  }
  for (const mutate of [
    x => {
      x.variables.find(v => v.name === 'font-family/text').values.mcr =
        'Foreign';
    },
    x => {
      x.variables.push(copy(x.variables[0]));
    },
    x => {
      x.variables.find(v =>
        v.name.startsWith('component/gallery-image/')
      ).type = 'STRING';
    },
    x => {
      const t = x.styles.text.find(t =>
        t.id.startsWith('component.gallery-image.')
      );
      t.values.undrr = [];
    },
    x => {
      const t = x.styles.text.find(t =>
        t.id.startsWith('component.gallery-image.')
      );
      t.values.undrr.fontName = 'Foreign';
    },
    x => {
      const t = x.styles.text.find(t =>
        t.id.startsWith('component.gallery-image.')
      );
      t.values.undrr.fontName = { family: '', style: 'Regular' };
    },
    x => {
      x.styles.effect.push(
        copy(
          x.styles.text.find(t => t.id.startsWith('component.gallery-image.'))
        )
      );
    },
  ]) {
    const candidate = copy(d);
    mutate(candidate);
    const before = copy(candidate);
    assert.throws(
      () => recipes.buildGalleryImageRecipes({ root, ...candidate }),
      /needs updating/
    );
    assert.deepStrictEqual(
      candidate,
      before,
      'Refusal preserves caller arrays'
    );
  }
  const read = fs.readFileSync;
  const audit = recipes.inspectGalleryImageSource({ root }).audit;
  for (const file of [
    'stories/Components/Gallery/Gallery.jsx',
    'stories/Components/Gallery/gallery.scss',
    'examples/figma-plugin/holistic/assets/gallery/source-footprints.json',
    ...Object.keys(audit.sourcePins)
      .filter(p => /\.woff2$/.test(p))
      .slice(0, 2),
    'examples/figma-plugin/holistic/assets/gallery/' +
      recipes.inspectGalleryImageSource({ root }).photos[0].file,
  ]) {
    let hit = false;
    fs.readFileSync = function (p, ...args) {
      const value = read.call(this, p, ...args);
      if (typeof p === 'string' && p.endsWith(file)) {
        hit = true;
        return typeof value === 'string'
          ? value + ' '
          : Buffer.concat([value, Buffer.from(' ')]);
      }
      return value;
    };
    try {
      assert.throws(document, /needs updating/);
      assert(hit, file);
    } finally {
      fs.readFileSync = read;
    }
  }
  for (const family of ['Roboto', 'Roboto Condensed']) {
    const env = await rangeEnvironment(d);
    env.state.fonts = env.state.fonts.filter(f => f.fontName.family !== family);
    await env.call('importVariables', d, ['undrr'], false, [], false);
    const state = () =>
      copy({
        scene: snapshot(env),
        styles: env.state.styles,
        variables: env.state.variables.length,
        collections: env.state.collections.length,
        images: [...env.state.images.keys()],
      });
    const before = state();
    const r = await env.call('buildMangroveComponents', d, 'undrr', [
      'gallery-image',
    ]);
    assert(r.errors.some(e => e.includes('unavailable')));
    assert.equal(r.createdNodeIds.length, 0);
    assert.deepStrictEqual(
      state(),
      before,
      'Missing font before scene/style/image writes'
    );
  }
  // Deliberately restore a legacy set-wide property name across different
  // authored image titles. The observed native default fixture must reproduce
  // corruption, rather than only testing the corrected recipe names.
  const legacy = copy(d),
    f = legacy.components.families[0];
  f.variants = f.variants
    .filter(
      v =>
        v.sourceContract.story === 'basic-gallery' &&
        v.sourceContract.viewport === 390
    )
    .slice(0, 2);
  assert.equal(f.variants.length, 2);
  const sourceTitles = f.variants.map(v =>
    walk(v.tree).find(t => t.textProperty?.endsWith('Title'))
  );
  assert.notEqual(sourceTitles[0].characters, sourceTitles[1].characters);
  sourceTitles.forEach(t => (t.textProperty = 'Legacy shared Title'));
  const env = await rangeEnvironment(legacy);
  installNativeTextPropertyDefaultFixture(env);
  await env.call('importVariables', legacy, ['undrr'], false, [], false);
  for (let i = 0; i < 2; i++) {
    const r = await env.call('buildMangroveComponents', legacy, 'undrr', [
      'gallery-image',
    ]);
    assert.deepStrictEqual(copy(r.errors), []);
  }
  const first = [...env.state.nodes.values()].find(
    n =>
      master(n) &&
      identity(n).includes('/variant/' + f.variants[0].id + '/') &&
      identity(n).endsWith('/' + sourceTitles[0].id)
  );
  assert(first);
  assert.notEqual(
    first.characters,
    sourceTitles[0].characters,
    'Legacy shared differing defaults demonstrably corrupt source copy'
  );
  console.log(
    'Gallery source/photo/font/evidence guards, caller collision refusal, missing-font premutation and legacy property collision proof pass. Native pixels remain open.'
  );
}
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { document };
