'use strict';
const fs = require('fs'),
  path = require('path'),
  assert = require('assert'),
  zlib = require('zlib');
const root = path.resolve(__dirname, '../../..');
const { buildLayoutFoundationsRecipes } = require(
  root + '/scripts/figma-layout-foundations-recipes.cjs'
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
function installLayoutFoundationsSvgFixture(env, families) {
  const expected = new Set(
    families.flatMap(f =>
      f.variants.flatMap(v =>
        walk(v.tree)
          .filter(([t]) => t.type === 'SVG')
          .map(([t]) => t.svg.markup)
      )
    )
  );
  const original = env.figma.createNodeFromSvg.bind(env.figma);
  env.figma.createNodeFromSvg = markup => {
    const raw = markup.replace(/ width="[\d.]+" height="[\d.]+"/, '');
    if (!expected.has(raw)) return original(markup);
    const v = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(raw);
    assert(v);
    const frame = env.figma.createFrame(),
      vector = env.figma.createVector();
    frame.resize(+v[1], +v[2]);
    vector.resize(+v[1], +v[2]);
    vector.vectorPaths = [
      { windingRule: 'NONZERO', data: /<path d="([^"]+)"/.exec(raw)[1] },
    ];
    vector.strokeWeight = Number(/stroke-width="([\d.]+)"/.exec(raw)[1]);
    vector.strokeAlign = 'CENTER';
    vector.constraints = { horizontal: 'MIN', vertical: 'MIN' };
    vector.strokes = [
      { type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 1, visible: true },
    ];
    vector.fills = [];
    frame.appendChild(vector);
    frame.rescale = scale => {
      frame.resizeWithoutConstraints(frame.width * scale, frame.height * scale);
      vector.resizeWithoutConstraints(
        vector.width * scale,
        vector.height * scale
      );
      vector.strokeWeight *= scale;
    };
    return frame;
  };
}

function document() {
  const d = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'))
  );
  d.components.families = buildLayoutFoundationsRecipes({ root, ...d });
  return d;
}
async function main() {
  const d = document(),
    families = d.components.families,
    ids = families.map(f => f.id);
  assert.deepStrictEqual(
    families.map(f => f.variants.length),
    [8, 4, 16]
  );

  const asset = path.join(__dirname, '../holistic/assets/layout-foundations/'),
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
  assert.equal(Object.keys(raw.cases).length, 155);
  const proof = JSON.parse(
    fs.readFileSync(asset + 'full-width-paint-proof.json')
  );
  assert.equal(proof.rows.length, 20);
  for (const row of proof.rows)
    for (const [i, c] of row.checks.entries()) {
      assert.equal(c.greenMinX, c.expectedVisibleGreenMinX);
      assert.equal(c.greenMaxX, c.expectedVisibleGreenMaxX);
      if (i !== 0)
        assert.equal(c.greenMinX, row.key.includes('-arabic-') ? 0 : 16);
    }
  const empty = families.find(f => f.id === 'layout-grid-specimen').variants;
  assert(
    empty.every(v =>
      v.sourceContract.sourceMetadataOnly.some(n =>
        n.reason.includes('zero-height')
      )
    )
  );
  for (const v of families.find(f => f.id === 'full-width-background').variants)
    if (v.properties.Context !== 'default') {
      assert.equal(v.tree.layout.clipsContent, true);
      const background = walk(v.tree).find(
        ([t]) => t.id === 'source-pseudo-background'
      );
      if (v.properties.Context === 'opaque') assert(!background);
      else {
        assert(background);
        const r = d.variables.find(
          x => x.name === background[0].absolute.offsetX
        );
        assert(
          Object.values(r.values).every(
            x => x === (v.properties.RootLocale === 'arabic' ? 0 : 16)
          )
        );
      }
    }
  const authored = clone({ variables: d.variables, styles: d.styles });
  buildLayoutFoundationsRecipes({ root, ...d });
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
          v.name.startsWith('component/layout-foundations/') &&
          v.type === 'COLOR'
      ).type = 'FLOAT'),
    x =>
      (x.variables.find(v =>
        v.name.startsWith('component/layout-foundations/')
      ).id = 'foreign'),
    x =>
      (x.styles.text.find(v =>
        v.id.startsWith('component.layout-foundations.')
      ).type = 'EFFECT'),
    x =>
      (x.styles.text.find(v =>
        v.id.startsWith('component.layout-foundations.')
      ).values.mcr.fontName = []),
    x =>
      x.styles.effect.push(
        clone(
          x.styles.text.find(v =>
            v.id.startsWith('component.layout-foundations.')
          )
        )
      ),
  ]) {
    const bad = clone(d);
    mutate(bad);
    const before = clone({ variables: bad.variables, styles: bad.styles });
    assert.throws(
      () => buildLayoutFoundationsRecipes({ root, ...bad }),
      /Layout foundations/
    );
    assert.deepStrictEqual(
      { variables: bad.variables, styles: bad.styles },
      before
    );
  }
  const read = fs.readFileSync;
  for (const suffix of [
    'source-footprints.json.gz',
    'full-width-paint-proof.json',
    'container.scss',
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
        () => buildLayoutFoundationsRecipes({ root, ...d }),
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
    installLayoutFoundationsSvgFixture(env, families);
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
              assert.equal(n.characters, t.characters);
              assert.equal(
                m.parent.componentPropertyDefinitions[
                  n.componentPropertyReferences.characters
                ].defaultValue,
                t.characters
              );
              assert.equal(n.textWrapStyle, t.textWrap);
              assert.equal(n.textAlignHorizontal, t.textAlign);
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
    assert(before.length > 200);
    for (let i = 0; i < 2; i++) {
      const report = await run();
      assert.deepStrictEqual(clone(report.errors), []);
      assert.equal(report.createdNodeIds.length, 0);
      sourceAssertions();
      assert.deepStrictEqual(geometry(), before);
      for (const c of consumers) {
        assert.equal(c.consumer.componentProperties[c.property].value, c.edit);
        assert.equal(c.consumer.main.id, c.main);
        assert.equal(c.text.characters, c.edit);
      }
    }
    console.log(
      mode.id,
      'Layout28 source/default/paint/owning-box/consumer/two zero-create repeats passed (offline only)'
    );
  }

  for (const family of ['Roboto', 'Noto Sans Arabic', 'Noto Kufi Arabic']) {
    const env = environment(d, { sharedOnly: true });
    installLayoutFoundationsSvgFixture(env, families);
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
    'Layout source/archive155/paint20/artifact/typed caller-preserving/font pre-scene guards pass'
  );
}
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { installLayoutFoundationsSvgFixture, document };
