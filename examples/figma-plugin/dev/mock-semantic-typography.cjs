'use strict';
const fs = require('fs'),
  path = require('path'),
  assert = require('assert'),
  zlib = require('zlib');
const root = path.resolve(__dirname, '../../..');
const { buildSemanticTypographyRecipes } = require(
  root + '/scripts/figma-semantic-typography-recipes.cjs'
);
const { environment } = require('./mock-kit.cjs');
const {
  installNativeTextPropertyDefaultFixture,
} = require('./mock-search-results.cjs');
const clone = x => JSON.parse(JSON.stringify(x)),
  id = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
function walk(n, prefix = '') {
  const key = prefix + '/' + n.id;
  return [[n, key], ...(n.children || []).flatMap(c => walk(c, key))];
}
function document() {
  const d = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'))
  );
  d.components.families = buildSemanticTypographyRecipes({ root, ...d });
  return d;
}
async function main() {
  const d = document(),
    families = d.components.families,
    ids = families.map(f => f.id);
  assert.deepStrictEqual(
    families.map(f => f.variants.length),
    [6, 60, 12, 6, 6, 6]
  );

  const asset = path.join(__dirname, '../holistic/assets/semantic-typography/'),
    archive = JSON.parse(
      zlib.gunzipSync(fs.readFileSync(asset + 'source-footprints.json.gz'))
    );
  const restore = x =>
    Array.isArray(x)
      ? x.map(restore)
      : x && typeof x === 'object'
        ? Object.keys(x).join(',') === '$sourceStyle'
          ? archive.styles[x.$sourceStyle]
          : Object.fromEntries(
              Object.entries(x).map(([k, v]) => [k, restore(v)])
            )
        : x;
  const raw = restore(archive.data);
  assert.equal(Object.keys(raw.cases).length, 660);
  for (const f of families)
    for (const v of f.variants) {
      const ts = walk(v.tree).filter(([t]) => t.type === 'TEXT');
      assert(ts.length);
      if (f.id === 'semantic-heading-specimen') assert.equal(ts.length, 6);
      if (f.id === 'semantic-description-list') assert.equal(ts.length, 6);
      if (v.properties.Treatment === 'hr') assert.equal(ts.length, 2);
      if (v.properties.Treatment === 'small')
        assert(ts.every(([t]) => t.sourceDerivation.fontSize.factor === 0.8));
    }
  const authored = clone({ variables: d.variables, styles: d.styles });
  buildSemanticTypographyRecipes({ root, ...d });
  assert.deepStrictEqual(
    { variables: d.variables, styles: d.styles },
    authored
  );
  for (const mutate of [
    x => (x.variables.find(v => v.name === 'font-size/400').values.mcr = 19),
    x => (x.variables.find(v => v.name === 'font-family/text').type = 'FLOAT'),
    x =>
      (x.variables.find(
        v =>
          v.name.startsWith('component/semantic-typography/') &&
          v.type === 'COLOR'
      ).type = 'FLOAT'),
    x =>
      (x.variables.find(v =>
        v.name.startsWith('component/semantic-typography/')
      ).id = 'foreign'),
    x =>
      (x.styles.text.find(v =>
        v.id.startsWith('component.semantic-typography.')
      ).type = 'EFFECT'),
    x =>
      (x.styles.text.find(v =>
        v.id.startsWith('component.semantic-typography.')
      ).values.mcr.fontName = []),
    x =>
      x.styles.effect.push(
        clone(
          x.styles.text.find(v =>
            v.id.startsWith('component.semantic-typography.')
          )
        )
      ),
    x => (x.variables.find(v => v.name === 'font-size/300').values.mcr = '16'),
    x => (x.variables.find(v => v.name === 'font-size/300').values.mcr = NaN),
    x =>
      (x.variables.find(v => v.name === 'font-size/300').values.mcr = {
        alias: 'font-size/300',
      }),
    x =>
      x.variables.splice(
        x.variables.findIndex(v => v.name === 'font-size/300'),
        1
      ),
    x =>
      x.variables.push({
        ...clone(x.variables.find(v => v.name === 'font-size/300')),
        id: 'foreign.foundation',
      }),
  ]) {
    const bad = clone(d);
    mutate(bad);
    const before = structuredClone({
      variables: bad.variables,
      styles: bad.styles,
    });
    assert.throws(
      () => buildSemanticTypographyRecipes({ root, ...bad }),
      /Semantic typography/
    );
    assert.deepStrictEqual(
      { variables: bad.variables, styles: bad.styles },
      before
    );
  }
  const read = fs.readFileSync;
  for (const suffix of [
    'source-footprints.json.gz',
    'capture.js',
    'normalize.scss',
    'Roboto-Bold.woff2',
  ]) {
    try {
      fs.readFileSync = function (file, ...args) {
        const b = read.call(this, file, ...args);
        return String(file).endsWith(suffix)
          ? Buffer.concat([Buffer.from(b), Buffer.from('drift')])
          : b;
      };
      const before = clone({ variables: d.variables, styles: d.styles });
      assert.throws(
        () => buildSemanticTypographyRecipes({ root, ...d }),
        /source changed/
      );
      assert.deepStrictEqual(
        { variables: d.variables, styles: d.styles },
        before
      );
    } finally {
      fs.readFileSync = read;
    }
  }
  for (const mode of d.modes) {
    const env = environment(d, { sharedOnly: true });
    installNativeTextPropertyDefaultFixture(env);
    assert.deepStrictEqual(
      clone(
        (await env.call('importVariables', d, [mode.id], false, [], true))
          .errors
      ),
      []
    );
    const run = () => env.call('buildMangroveComponents', d, mode.id, ids);
    assert.deepStrictEqual(clone((await run()).errors), []);
    const value = name => {
      if (typeof name === 'number') return name;
      const v = d.variables.find(v => v.name === name);
      assert(v, name);
      const x = v.values[mode.id];
      return x?.alias ? value(x.alias) : x;
    };
    const master = (f, v) =>
      [...env.state.nodes.values()].find(
        n => id(n) === 'family/' + f.id + '/variant/' + v.id
      );
    function sourceAssertions() {
      for (const f of families)
        for (const v of f.variants) {
          const m = master(f, v);
          assert(m);
          const key = id(m);
          for (const [t, local] of walk(v.tree)) {
            const n =
              t.id === 'root'
                ? m
                : m.findAll(n => id(n) === key + local.replace('/root', ''))[0];
            assert(n, local);
            assert.equal(n.opacity, 1);
            for (const field of ['width', 'height'])
              assert.equal(n[field], value(t.layout[field]));
            if (t.absolute) {
              assert.equal(n.x, value(t.absolute.offsetX));
              assert.equal(n.y, value(t.absolute.offsetY));
            }
            if (t.type === 'TEXT') {
              const expected = t.characters;
              assert.equal(n.characters, expected);
              const style = d.styles.text.find(s => s.id === t.textStyle),
                native = env.state.styles.find(s => s.id === n.textStyleId);
              assert(style && native);
              assert.deepStrictEqual(
                clone(n.fontName),
                style.values[mode.id].fontName
              );
              assert.equal(n.fontSize, style.values[mode.id].fontSize);
              assert.deepStrictEqual(
                clone(n.lineHeight),
                style.values[mode.id].lineHeight
              );
              assert.deepStrictEqual(
                clone(n.letterSpacing),
                style.values[mode.id].letterSpacing
              );
              assert.equal(
                m.parent.componentPropertyDefinitions[
                  n.componentPropertyReferences.characters
                ].defaultValue,
                expected
              );
              assert.equal(n.textWrapStyle, t.textWrap);
              assert.equal(n.textAlignHorizontal, t.textAlign);
            }
            if (t.image) {
              assert.equal(n.fills[0].type, 'IMAGE');
              assert.equal(n.fills[0].scaleMode, 'FILL');
              assert.equal(
                n.fills[0].imageHash,
                require('crypto')
                  .createHash('sha256')
                  .update(Buffer.from(t.image.base64, 'base64'))
                  .digest('hex')
              );
            }
            if (t.fill) {
              const c = value(t.fill);
              assert.deepStrictEqual(clone(n.fills[0].color), {
                r: c.r,
                g: c.g,
                b: c.b,
              });
              assert.equal(n.fills[0].opacity, c.a);
            }
            for (const field of [
              'paddingTop',
              'paddingRight',
              'paddingBottom',
              'paddingLeft',
            ])
              if (t.bindings?.[field] !== undefined)
                assert.equal(n[field], value(t.bindings[field]));
          }
        }
    }
    sourceAssertions();
    for (const f of families) {
      const m = master(f, f.variants[0]),
        text = m.findAll(n => n.type === 'TEXT')[0];
      text.characters = 'Changed';
    }
    const restoreAuthored = await run();
    assert.deepStrictEqual(clone(restoreAuthored.errors), []);
    assert.equal(restoreAuthored.createdNodeIds.length, 0);
    sourceAssertions();
    const consumers = [];
    for (const f of families)
      for (const v of f.variants) {
        const m = master(f, v),
          consumer = m.createInstance();
        env.figma.currentPage.appendChild(consumer);
        consumer.x = 500;
        consumer.y = 600;
        const texts = consumer.findAll(n => n.type === 'TEXT');
        for (const [i, n] of texts.entries()) {
          const property = n.componentPropertyReferences.characters;
          assert(property);
          const edit = 'Edited ' + i;
          const descriptor =
            Object.getOwnPropertyDescriptor(n, 'characters') ||
            Object.getOwnPropertyDescriptor(
              Object.getPrototypeOf(n),
              'characters'
            );
          assert(descriptor?.set);
          Object.defineProperty(n, 'characters', {
            configurable: true,
            get() {
              return consumer.componentProperties[property].value;
            },
            set(value) {
              descriptor.set.call(this, value);
            },
          });
          consumer.setProperties({ [property]: edit });
          assert.equal(n.characters, edit);
          consumers.push({ consumer, text: n, property, edit, main: m.id });
        }
      }
    const geometry = () =>
      clone(
        [...env.state.nodes.values()]
          .filter(n => id(n))
          .map(n => ({
            id: n.id,
            key: id(n),
            parent: n.parent?.id,
            type: n.type,
            x: n.x,
            y: n.y,
            width: n.width,
            height: n.height,
            opacity: n.opacity,
            characters: n.type === 'TEXT' ? n.characters : null,
            main: n.type === 'INSTANCE' ? n.main?.id : null,
          }))
      );
    const before = geometry();
    assert.equal(env.state.images.size, 1);
    assert(before.length > 800);
    for (let i = 0; i < 2; i++) {
      const report = await run();
      assert.deepStrictEqual(clone(report.errors), []);
      assert.equal(report.createdNodeIds.length, 0);
      sourceAssertions();
      assert.deepStrictEqual(geometry(), before);
      assert.equal(env.state.images.size, 1);
      for (const c of consumers) {
        assert.equal(c.consumer.componentProperties[c.property].value, c.edit);
        assert.equal(c.consumer.main.id, c.main);
        assert.equal(c.text.characters, c.edit);
      }
    }
    console.log(
      mode.id,
      'SemanticTypography96 source/default/paint/owning-box/consumer/two zero-create repeats passed (offline only)'
    );
  }

  for (const family of ['Roboto', 'Noto Sans Arabic', 'Noto Kufi Arabic']) {
    const env = environment(d, { sharedOnly: true });
    assert.deepStrictEqual(
      clone(
        (await env.call('importVariables', d, ['undrr'], false, [], true))
          .errors
      ),
      []
    );
    const load = env.figma.loadFontAsync;
    env.figma.loadFontAsync = async f => {
      if (f.family === family) throw Error('Missing required ' + family);
      return load(f);
    };
    const state = () =>
      JSON.stringify({
        nodes: [...env.state.nodes.keys()],
        styles: env.state.styles,
        images: [...env.state.images],
        variables: [...env.state.variables],
      });
    const before = state(),
      report = await env.call('buildMangroveComponents', d, 'undrr', ids, {
        refreshReview: false,
      });
    assert(report.errors.some(e => e.includes(family)));
    assert.equal(state(), before);
  }
  console.log(
    'Semantic Typography660 source/archive/artifact/typed caller-preserving/font pre-scene guards pass'
  );
}
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { document };
