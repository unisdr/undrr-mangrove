'use strict';
const fs = require('fs'),
  path = require('path'),
  assert = require('assert/strict');
const root = path.resolve(__dirname, '../../..'),
  { rangeEnvironment } = require(
    root + '/examples/figma-plugin/dev/mock-rich-text-integration.cjs'
  ),
  {
    buildFiniteCodeRecipes,
  } = require('../../../scripts/figma-semantic-code-recipes.cjs');
const clone = x => JSON.parse(JSON.stringify(x)),
  id = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId'),
  doc = () =>
    JSON.parse(
      fs.readFileSync(root + '/examples/figma-plugin/mangrove-variables.json')
    );
function document() {
  const d = doc();
  d.components.families = buildFiniteCodeRecipes({ root, ...d });
  return d;
}
async function main() {
  const d = document(),
    family = d.components.families[0];
  assert.equal(family.variants.length, 6);
  for (const v of family.variants) {
    const ts = v.tree.children
      .flatMap(n => n.children || [])
      .filter(n => n.type === 'TEXT');
    assert.equal(
      ts.map(n => n.characters).join(''),
      v.sourceLogicalParagraph.characters
    );
    assert(ts.every(t => t.sourceLine));
    assert(
      v.tree.children.filter(n => n.sourceInlineBox).every(n => n.effectStyle)
    );
  }
  const before = clone({ variables: d.variables, styles: d.styles });
  buildFiniteCodeRecipes({ root, ...d });
  assert.deepEqual({ variables: d.variables, styles: d.styles }, before);
  for (const mode of d.modes) {
    const env = await rangeEnvironment(d);
    const imported = await env.call(
      'importVariables',
      d,
      [mode.id],
      false,
      [],
      true
    );
    assert.deepEqual(clone(imported.errors), []);
    const build = () =>
      env.call('buildMangroveComponents', d, mode.id, ['semantic-code-finite']);
    const first = await build();
    assert.deepEqual(clone(first.errors), []);
    const roots = Array.from(env.state.nodes.values()).filter(
      n =>
        n.type === 'COMPONENT' &&
        id(n).startsWith('family/semantic-code-finite/variant/')
    );
    assert.equal(roots.length, 6);
    for (const master of roots) {
      const v = family.variants.find(v => id(master).endsWith('/' + v.id));
      assert(v);
      for (const source of v.tree.children.filter(n => n.sourceInlineBox)) {
        const key = id(master) + '/' + source.id;
        const matches = Array.from(env.state.nodes.values()).filter(
          n => id(n) === key && n.parent?.id === master.id
        );
        assert.equal(matches.length, 1);
        assert.equal(matches[0].clipsContent, false);
        assert(matches[0].effectStyleId);
      }
    }
    const snapshot = () =>
      Array.from(env.state.nodes.values())
        .filter(n => id(n).startsWith('family/semantic-code-finite/'))
        .map(n => [
          n.id,
          n.parent?.id,
          n.type,
          n.x,
          n.y,
          n.width,
          n.height,
          n.effectStyleId,
          n.type === 'TEXT' ? n.characters : null,
        ]);
    const a = snapshot();
    assert(a.length > 100);
    for (let i = 0; i < 2; i++) {
      const r = await build();
      assert.deepEqual(clone(r.errors), []);
      assert.equal(r.createdNodeIds.length, 0);
      assert.deepEqual(snapshot(), a);
    }
    const master = roots[0],
      consumer = master.createInstance();
    env.figma.currentPage.appendChild(consumer);
    const walk = n => [n, ...(n.children || []).flatMap(walk)],
      text = walk(consumer).find(
        n => n.type === 'TEXT' && n.characters.length > 1
      );
    assert(text);
    const original = text.characters;
    text.characters = 'EDIT' + original.slice(4);
    const assetBefore = clone({
      styles: env.state.styles.map(s => ({ id: s.id, name: s.name })),
      variables: env.state.variables.map(v => ({
        id: v.id,
        values: v.valuesByMode,
      })),
    });
    const denied = await build();
    assert(
      denied.errors.some(e => /reflow-needed/.test(e)),
      JSON.stringify({
        errors: denied.errors,
        text: id(text),
        main: id(master),
        value: text.characters,
      })
    );
    assert.equal(text.characters, 'EDIT' + original.slice(4));
    assert.deepEqual(
      clone({
        styles: env.state.styles.map(s => ({ id: s.id, name: s.name })),
        variables: env.state.variables.map(v => ({
          id: v.id,
          values: v.valuesByMode,
        })),
      }),
      assetBefore
    );
    console.log(
      'mode',
      mode.id,
      'six source presets/two zero-create/exact recorded mock geometry/edited linked-copy refusal'
    );
  }
  const missing = await rangeEnvironment(d);
  const mi = await missing.call(
    'importVariables',
    d,
    ['undrr'],
    false,
    [],
    true
  );
  assert.deepEqual(clone(mi.errors), []);
  missing.state.rejectedFonts.add('Menlo Regular');
  const r = await missing.call('buildMangroveComponents', d, 'undrr', [
    'semantic-code-finite',
  ]);
  assert(r.errors.length);
  assert.equal(r.createdNodeIds.length, 0);
  for (const edit of [
    x => x.modes.pop(),
    x => (x.styles.text[0].type = 'EFFECT'),
    x => (x.styles.text[0].values.mcr.fontName = []),
    x => (x.variables.find(v => v.name === 'font-family/text').type = 'FLOAT'),
  ]) {
    const x = doc();
    edit(x);
    const before = clone({ variables: x.variables, styles: x.styles });
    assert.throws(() => buildFiniteCodeRecipes({ root, ...x }));
    assert.deepEqual({ variables: x.variables, styles: x.styles }, before);
  }
  const collision = doc();
  collision.styles.text.push({
    ...clone(collision.styles.text[0]),
    id: 'component.semantic-code-finite.english-390.box-0.inset',
    name: 'Foreign typed source identity',
  });
  const cb = clone({
    variables: collision.variables,
    styles: collision.styles,
  });
  assert.throws(
    () => buildFiniteCodeRecipes({ root, ...collision }),
    /cross-kind identity/
  );
  assert.deepEqual(
    { variables: collision.variables, styles: collision.styles },
    cb
  );
  const cyclic = doc();
  cyclic.variables.find(v => v.name === 'font-family/text').values.mcr = {
    alias: 'font-family/text',
  };
  const cyclicBefore = clone({
    variables: cyclic.variables,
    styles: cyclic.styles,
  });
  assert.throws(
    () => buildFiniteCodeRecipes({ root, ...cyclic }),
    /alias cycle/
  );
  assert.deepEqual(
    { variables: cyclic.variables, styles: cyclic.styles },
    cyclicBefore
  );
  const guard = JSON.parse(
      fs.readFileSync(
        path.join(
          root,
          'examples/figma-plugin/holistic/assets/semantic-code/source-guards.json'
        )
      )
    ),
    font = Object.keys(guard.fontAndSourceAssets).find(f =>
      f.endsWith('.woff2')
    );
  assert(font);
  const reader = fs.readFileSync;
  try {
    fs.readFileSync = (f, ...args) => {
      const b = reader(f, ...args);
      if (f === path.join(root, font)) {
        const changed = Buffer.from(b);
        changed[0] ^= 1;
        return changed;
      }
      return b;
    };
    const x = doc(),
      before = clone({ variables: x.variables, styles: x.styles });
    assert.throws(
      () => buildFiniteCodeRecipes({ root, ...x }),
      /font\/source asset/
    );
    assert.deepEqual({ variables: x.variables, styles: x.styles }, before);
  } finally {
    fs.readFileSync = reader;
  }
  const sourceAsset = path.join(
    root,
    'examples/figma-plugin/holistic/assets/semantic-code/undrr-english-code-390-diagnostic.json.gz'
  );
  try {
    fs.readFileSync = (f, ...args) => {
      const b = reader(f, ...args);
      if (f === sourceAsset) {
        const raw = require('zlib').gunzipSync(b);
        raw[raw.length - 2] ^= 1;
        return require('zlib').gzipSync(raw, { mtime: 0 });
      }
      return b;
    };
    const x = doc(),
      before = clone({ variables: x.variables, styles: x.styles });
    assert.throws(
      () => buildFiniteCodeRecipes({ root, ...x }),
      /actual source pin/
    );
    assert.deepEqual({ variables: x.variables, styles: x.styles }, before);
  } finally {
    fs.readFileSync = reader;
  }
  console.log(
    'Finite Code source candidate passed. No native face/500weight/bidi/glyph/baseline/spread/raster or general inline flow acceptance.'
  );
}
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { document };
