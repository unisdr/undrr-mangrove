'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { environment } = require('./mock-kit.cjs');
const {
  installNativeTextPropertyDefaultFixture,
} = require('./mock-search-results.cjs');
const {
  buildPageHeaderRecipes,
} = require('../../../scripts/figma-page-header-recipes.cjs');
const root = path.resolve(__dirname, '../../..');
const copy = x => JSON.parse(JSON.stringify(x));
const key = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
const base = () =>
  JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'))
  );
function document() {
  const d = base();
  d.components.families = buildPageHeaderRecipes({ root, ...d });
  return d;
}
function walk(t, p = '') {
  return [[t, p], ...(t.children || []).flatMap(c => walk(c, p + '/' + c.id))];
}
function installPageHeaderSvgFixture(env, families) {
  const exact = new Map(
    families.flatMap(f =>
      f.variants.flatMap(v =>
        walk(v.tree)
          .filter(([t]) => t.svg)
          .map(([t]) => [t.svg.markup, t.svg])
      )
    )
  );
  const previous = env.figma.createNodeFromSvg.bind(env.figma);
  env.figma.createNodeFromSvg = markup => {
    const source = [...exact.keys()].find(
      m =>
        m === markup ||
        m.replace(/\s+(?:width|height)="[^"]+"/g, '') ===
          markup.replace(/\s+(?:width|height)="[^"]+"/g, '')
    );
    if (!source) return previous(markup);
    const box = /viewBox=["']0 0 ([\d.]+) ([\d.]+)["']/.exec(source);
    assert(box);
    const frame = env.figma.createFrame();
    frame.resize(+box[1], +box[2]);
    // Exact bounded source only. The fixture records path strings and API geometry,
    // without claiming native SVG topology, path bounds or raster acceptance.
    const vector = env.figma.createVector();
    vector.resize(frame.width, frame.height);
    vector.vectorPaths = [{ windingRule: 'NONZERO', data: source }];
    const strokes = !!exact.get(source).monochrome?.strokes;
    vector.fills = strokes
      ? []
      : [
          {
            type: 'SOLID',
            color: { r: 1, g: 1, b: 1 },
            opacity: 1,
            visible: true,
          },
        ];
    vector.strokes = strokes
      ? [
          {
            type: 'SOLID',
            color: { r: 0, g: 0, b: 0 },
            opacity: 1,
            visible: true,
          },
        ]
      : [];
    vector.strokeWeight = strokes ? 2 : 0;
    vector.strokeAlign = 'CENTER';
    vector.constraints = { horizontal: 'MIN', vertical: 'MIN' };
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
const permanent = env =>
  copy({
    nodes: [...env.state.nodes.values()].map(n => [
      n.id,
      key(n),
      n.type,
      n.characters,
      n.x,
      n.y,
      n.width,
      n.height,
    ]),
    styles: env.state.styles,
    variables: env.state.variables,
    images: env.state.images,
  });
const geometry = env =>
  [...env.state.nodes.values()]
    .filter(n => key(n).startsWith('family/page-header/'))
    .map(n => [
      n.id,
      n.parent?.id,
      n.type,
      n.x,
      n.y,
      n.width,
      n.height,
      n.opacity,
      n.characters,
      n.textStyleId,
    ]);
function resolve(d, x, mode) {
  const seen = new Set();
  while (typeof x === 'string') {
    assert(!seen.has(x));
    seen.add(x);
    const v = d.variables.find(v => v.name === x);
    assert(v);
    x = v.values[mode];
    if (x?.alias) x = x.alias;
  }
  return x;
}
async function main() {
  const d = document();
  assert.equal(d.components.families.length, 1);
  assert.equal(d.components.families[0].variants.length, 44);
  assert.deepStrictEqual(copy(d), copy(document()));
  for (const v of d.components.families[0].variants) {
    const ids = new Set();
    for (const [t] of walk(v.tree)) {
      assert(!ids.has(t.id));
      ids.add(t.id);
      if (t.type === 'TEXT') assert(t.characters.trim());
      assert(t.layout.width > 0 && t.layout.height > 0);
      if (t.position)
        assert(Number.isFinite(t.position.x) && Number.isFinite(t.position.y));
    }
    assert(
      !walk(v.tree).some(
        ([t]) =>
          t.type === 'TEXT' &&
          ['My account', 'Select your language', 'Arabic', 'Spanish'].includes(
            t.characters
          )
      )
    );
  }
  const snapshot = copy({ variables: d.variables, styles: d.styles });
  buildPageHeaderRecipes({ root, ...d });
  assert.deepStrictEqual(
    { variables: d.variables, styles: d.styles },
    snapshot
  );
  const pv = JSON.parse(
    fs.readFileSync(
      root +
        '/examples/figma-plugin/holistic/assets/page-header/provenance.json'
    )
  );
  for (const file of [
    'stories/Components/PageHeader/page-header.scss',
    'stories/Atom/Logo/undrr-logo-assets.js',
    'examples/figma-plugin/holistic/assets/page-header/http-bodies/Roboto-Regular.woff2',
    'examples/figma-plugin/holistic/assets/page-header/http-bodies/undrr-logo-ar-white.svg',
    'examples/figma-plugin/holistic/assets/page-header/source-footprints.json.gz',
  ]) {
    const x = base(),
      before = copy({ variables: x.variables, styles: x.styles }),
      read = fs.readFileSync;
    fs.readFileSync = function (f, ...args) {
      const bytes = read.call(this, f, ...args);
      return path.resolve(String(f)) === path.resolve(root, file)
        ? typeof bytes === 'string'
          ? bytes + 'drift'
          : Buffer.concat([bytes, Buffer.from('drift')])
        : bytes;
    };
    try {
      assert.throws(
        () => buildPageHeaderRecipes({ root, ...x }),
        /PageHeader source changed/
      );
      assert.deepStrictEqual(
        { variables: x.variables, styles: x.styles },
        before
      );
    } finally {
      fs.readFileSync = read;
    }
  }
  for (const mutate of [
    x => {
      x.variables.find(v => v.name === 'color/neutral-0').type = 'FLOAT';
    },
    x => {
      x.variables.find(v => v.name === 'font-family/text').values.mcr = {
        alias: 'missing',
      };
    },
    x => {
      x.styles.text.push({
        ...copy(
          d.styles.text.find(s => s.id.startsWith('component.page-header.'))
        ),
        type: 'EFFECT',
      });
    },
    x => {
      const s = copy(
        d.styles.text.find(s => s.id.startsWith('component.page-header.'))
      );
      s.values.mcr.fontName = [];
      x.styles.text.push(s);
    },
    x => {
      const v = copy(
        d.variables.find(v => v.name.startsWith('component/page-header/'))
      );
      v.type = 'FLOAT';
      x.variables.push(v);
    },
  ]) {
    const x = base();
    mutate(x);
    const before = copy({ variables: x.variables, styles: x.styles });
    assert.throws(
      () => buildPageHeaderRecipes({ root, ...x }),
      /PageHeader source changed/
    );
    assert.deepStrictEqual(
      { variables: x.variables, styles: x.styles },
      before
    );
  }
  assert.equal(pv.sourceCases, 230);
  for (const mode of d.modes) {
    const env = environment(d, { sharedOnly: true });
    installPageHeaderSvgFixture(env, d.components.families);
    installNativeTextPropertyDefaultFixture(env);
    const imported = await env.call(
      'importVariables',
      d,
      [mode.id],
      false,
      [],
      true
    );
    assert.deepStrictEqual(copy(imported.errors), []);
    const build = () =>
      env.call('buildMangroveComponents', d, mode.id, ['page-header'], {
        refreshReview: false,
      });
    const first = await build();
    assert.deepStrictEqual(copy(first.errors), []);
    assert(first.createdNodeIds.length);
    const authored = () => {
      for (const v of d.components.families[0].variants) {
        const prefix = 'family/page-header/variant/' + v.id;
        for (const [t, p] of walk(v.tree)) {
          const n = [...env.state.nodes.values()].find(
            n => key(n) === prefix + p
          );
          assert(n, prefix + p);
          assert.equal(n.width, t.layout.width);
          assert.equal(n.height, t.layout.height);
          assert.equal(n.opacity, 1);
          if (p && t.position) {
            assert.equal(n.x, t.position.x);
            assert.equal(n.y, t.position.y);
          }
          if (t.absolute) {
            assert.equal(n.x, resolve(d, t.absolute.offsetX, mode.id));
            assert.equal(n.y, resolve(d, t.absolute.offsetY, mode.id));
          }
          if (t.type === 'TEXT') {
            assert.equal(n.characters, t.characters);
            const ref = n.componentPropertyReferences.characters;
            assert(ref);
            let owner = n.parent;
            while (owner && owner.type !== 'COMPONENT_SET')
              owner = owner.parent;
            assert.equal(
              owner.componentPropertyDefinitions[ref].defaultValue,
              t.characters
            );
          }
          if (t.fill) {
            const color = resolve(d, t.fill, mode.id);
            assert(n.fills.length);
            for (const c of ['r', 'g', 'b'])
              assert.equal(
                Math.round(n.fills[0].color[c] * 255),
                Math.round(color[c] * 255)
              );
            assert.equal(n.fills[0].opacity, color.a ?? 1);
          }
        }
      }
    };
    authored();
    assert(geometry(env).length > 44);
    const imageCount =
      env.state.images.size ?? Object.keys(env.state.images).length;
    const consumer = [];
    for (const v of d.components.families[0].variants) {
      const master = [...env.state.nodes.values()].find(
        n => key(n) === 'family/page-header/variant/' + v.id
      );
      const instance = master.createInstance();
      env.figma.currentPage.appendChild(instance);
      for (const n of instance.findAll(n => n.type === 'TEXT')) {
        const ref = n.componentPropertyReferences?.characters;
        if (!ref) continue;
        let proto = n,
          descriptor;
        while (proto && !descriptor) {
          descriptor = Object.getOwnPropertyDescriptor(proto, 'characters');
          proto = Object.getPrototypeOf(proto);
        }
        assert(descriptor && descriptor.set);
        Object.defineProperty(n, 'characters', {
          configurable: true,
          get() {
            return instance.componentProperties[ref].value;
          },
          set(value) {
            descriptor.set.call(this, value);
          },
        });
        instance.setProperties({ [ref]: 'Edited label' });
        consumer.push({ instance, ref, node: n, main: master.id });
      }
    }
    assert(consumer.length);
    const prior = geometry(env);
    for (let repeat = 0; repeat < 2; repeat++) {
      const report = await build();
      assert.deepStrictEqual(copy(report.errors), []);
      assert.equal(report.createdNodeIds.length, 0);
      assert.deepStrictEqual(geometry(env), prior);
      authored();
      for (const { instance, ref, node, main } of consumer) {
        assert.equal(instance.componentProperties[ref].value, 'Edited label');
        assert.equal(node.characters, 'Edited label');
        assert.equal((await instance.getMainComponentAsync()).id, main);
      }
      assert.equal(
        env.state.images.size ?? Object.keys(env.state.images).length,
        imageCount
      );
    }
    console.log(
      mode.id +
        ':44 source masters, image/SVG owner fields, defaults and consumer properties retained through two zero-create repeats'
    );
    const bad = environment(d, { sharedOnly: true });
    installPageHeaderSvgFixture(bad, d.components.families);
    const original = bad.figma.listAvailableFontsAsync;
    bad.figma.listAvailableFontsAsync = async () =>
      (await original()).filter(f => f.fontName.family !== 'Roboto');
    const setup = await bad.call(
      'importVariables',
      d,
      [mode.id],
      false,
      [],
      true
    );
    assert.deepStrictEqual(copy(setup.errors), []);
    const before = permanent(bad);
    const report = await bad.call(
      'buildMangroveComponents',
      d,
      mode.id,
      ['page-header'],
      { refreshReview: false }
    );
    assert(report.errors.length);
    assert.deepStrictEqual(permanent(bad), before);
  }
}
module.exports = { document, installPageHeaderSvgFixture };
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
