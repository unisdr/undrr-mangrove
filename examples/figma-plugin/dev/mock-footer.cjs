'use strict';
const fs = require('fs'),
  path = require('path'),
  assert = require('assert');
const root = path.resolve(__dirname, '../../..');
const { buildFooterRecipes } = require(
  root + '/scripts/figma-footer-recipes.cjs'
);
const { rangeEnvironment } = require('./mock-rich-text-integration.cjs');
const {
  installNativeTextPropertyDefaultFixture,
} = require('./mock-search-results.cjs');
const copy = x => JSON.parse(JSON.stringify(x));
const key = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
function walk(t, p = '') {
  return [[t, p], ...(t.children || []).flatMap(c => walk(c, p + '/' + c.id))];
}
function base() {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'))
  );
}
function document() {
  let d = base();
  d.components.families = buildFooterRecipes({ root, ...d });
  return d;
}
function resolve(d, x, m) {
  const seen = new Set();
  while (typeof x === 'string') {
    assert(!seen.has(x));
    seen.add(x);
    let v = d.variables.find(v => v.name === x);
    assert(v, x);
    x = v.values[m];
    if (x?.alias) x = x.alias;
  }
  return x;
}
const permanent = env =>
  JSON.stringify({
    nodes: [...env.state.nodes.values()].map(n => [
      n.id,
      n.type,
      key(n),
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
    .filter(n => key(n).startsWith('family/footer/'))
    .map(n => [
      n.id,
      n.parent?.id,
      n.type,
      n.x,
      n.y,
      n.width,
      n.height,
      n.opacity,
      n.effectStyleId,
      n.type === 'TEXT' ? n.characters : null,
    ]);
const sourceArchive = JSON.parse(
  fs.readFileSync(
    root +
      '/examples/figma-plugin/holistic/assets/footer/source-footprints.json'
  )
);
function restoreSource(x) {
  if (Array.isArray(x)) return x.map(restoreSource);
  if (x && typeof x === 'object') {
    if (Object.keys(x).join(',') === '$sourceStyle')
      return copy(sourceArchive.styles[x.$sourceStyle]);
    return Object.fromEntries(
      Object.entries(x).map(([k, v]) => [k, restoreSource(v)])
    );
  }
  return x;
}
const sourceCases = restoreSource(sourceArchive.data).cases;
async function main() {
  const d = document();
  assert.deepStrictEqual(
    d.components.families.map(f => [f.id, f.variants.length]),
    [['footer', 10]]
  );
  for (const mutate of [
    x =>
      (x.variables.find(v => v.name === 'color/neutral-800').values.irp = {
        r: 0,
        g: 0,
        b: 0,
        a: 1,
      }),
    x =>
      (x.variables.find(v => v.name.startsWith('component/footer/')).type =
        'BOOLEAN'),
    x =>
      (x.styles.text.find(v => v.id.startsWith('component.footer.')).type =
        'EFFECT'),
    x =>
      (x.styles.text.find(v =>
        v.id.startsWith('component.footer.')
      ).values.mcr.fontName = []),
    x =>
      x.styles.effect.push(
        copy(x.styles.text.find(v => v.id.startsWith('component.footer.')))
      ),
  ]) {
    const x = copy(d);
    mutate(x);
    const before = copy({ variables: x.variables, styles: x.styles });
    assert.throws(
      () => buildFooterRecipes({ root, ...x }),
      /Footer source changed/
    );
    assert.deepStrictEqual(
      { variables: x.variables, styles: x.styles },
      before
    );
  }
  const provenance = JSON.parse(
    fs.readFileSync(
      root + '/examples/figma-plugin/holistic/assets/footer/provenance.json'
    )
  );
  for (const file of [
    ...Object.keys(provenance.sourceHashes),
    ...Object.keys(provenance.assets).map(
      f => 'examples/figma-plugin/holistic/assets/footer/' + f
    ),
  ]) {
    const x = base(),
      before = copy({ variables: x.variables, styles: x.styles }),
      read = fs.readFileSync;
    fs.readFileSync = function (f, ...args) {
      let r = read.call(this, f, ...args);
      if (path.resolve(String(f)) === path.resolve(root, file))
        return typeof r === 'string'
          ? r + 'drift'
          : Buffer.concat([r, Buffer.from('drift')]);
      return r;
    };
    try {
      assert.throws(
        () => buildFooterRecipes({ root, ...x }),
        /Footer source changed/
      );
      assert.deepStrictEqual(
        { variables: x.variables, styles: x.styles },
        before
      );
    } finally {
      fs.readFileSync = read;
    }
  }
  const before = copy({ variables: d.variables, styles: d.styles });
  buildFooterRecipes({ root, ...d });
  assert.deepStrictEqual({ variables: d.variables, styles: d.styles }, before);
  for (const mode of d.modes) {
    const env = await rangeEnvironment(d, { richDecorationOffsets: true });
    installNativeTextPropertyDefaultFixture(env);
    assert.deepStrictEqual(
      copy(
        (await env.call('importVariables', d, [mode.id], false, [], true))
          .errors
      ),
      []
    );
    const build = () =>
      env.call(
        'buildMangroveComponents',
        d,
        mode.id,
        d.components.families.map(f => f.id),
        { refreshReview: false }
      );
    assert.deepStrictEqual(copy((await build()).errors), []);
    async function authored() {
      for (const f of d.components.families)
        for (const v of f.variants) {
          const prefix = 'family/' + f.id + '/variant/' + v.id;
          for (const [t, p] of walk(v.tree)) {
            const n = [...env.state.nodes.values()].find(
              n => key(n) === prefix + p
            );
            assert(n, prefix + p);
            if (t.type === 'INSTANCE') {
              const family = d.components.families.find(f => f.id === t.family),
                selected = family.variants.find(v =>
                  Object.entries(t.variant).every(
                    ([k, x]) => v.properties[k] === x
                  )
                ),
                master = await n.getMainComponentAsync();
              assert(selected);
              assert.equal(
                key(master),
                'family/' + family.id + '/variant/' + selected.id
              );
              assert.equal(
                n.width,
                resolve(d, selected.tree.layout.width, mode.id)
              );
              assert.equal(
                n.height,
                resolve(d, selected.tree.layout.height, mode.id)
              );
            } else {
              assert.equal(n.width, resolve(d, t.layout.width, mode.id));
              assert.equal(n.height, resolve(d, t.layout.height, mode.id));
            }
            if (t.type === 'TEXT') {
              assert.equal(n.characters, t.characters);
              if (t.textProperty) {
                const ref = n.componentPropertyReferences.characters;
                assert(ref);
                const owner = n.parent;
                let set = owner;
                while (set && set.type !== 'COMPONENT_SET') set = set.parent;
                assert(set);
                assert.equal(
                  set.componentPropertyDefinitions[ref].defaultValue,
                  t.characters
                );
              }
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
            if (t.textRuns)
              for (const run of t.textRuns.filter(r => r.textDecorationOffset))
                assert.deepStrictEqual(
                  copy(n.getRangeTextDecorationOffset(run.start, run.end)),
                  {
                    unit: 'PIXELS',
                    value: Math.fround(run.textDecorationOffset.value),
                  }
                );
            if (t.effectStyle) assert(n.effectStyleId);
            if (t.bindings?.opacity)
              assert.equal(
                n.opacity,
                resolve(d, t.bindings.opacity, mode.id) / 100
              );
          }
        }
    }
    await authored();
    for (const v of d.components.families[0].variants) {
      const source =
        sourceCases[
          mode.id +
            '-' +
            v.properties.Context +
            '-' +
            v.properties.SourceViewport
        ];
      for (const [t, p] of walk(v.tree)) {
        const index = t.id === 'root' ? 0 : +t.id.slice(5),
          src = source.tree[index],
          native = [...env.state.nodes.values()].find(
            n => key(n) === 'family/footer/variant/' + v.id + p
          );
        assert(src && native);
        assert.equal(native.opacity, 1);
        assert.equal(native.width, src.rect.width);
        assert.equal(native.height, src.rect.height);
        if (index) {
          assert.equal(
            native.x,
            src.rect.x - source.tree[src.parentIndex].rect.x
          );
          assert.equal(
            native.y,
            src.rect.y - source.tree[src.parentIndex].rect.y
          );
        }
        if (t.type === 'TEXT') {
          assert.equal(native.textWrapStyle, t.textWrap);
          assert.equal(native.characters, src.text);
        } else
          assert.equal(
            native.fills.length,
            0,
            'actual transparent surface must remain unpainted'
          );
      }
    }
    const consumers = [];
    for (const f of d.components.families)
      for (const v of f.variants) {
        const prefix = 'family/' + f.id + '/variant/' + v.id,
          master = [...env.state.nodes.values()].find(n => key(n) === prefix),
          instance = master.createInstance();
        env.figma.currentPage.appendChild(instance);
        for (const plain of walk(v.tree).filter(([t]) => t.textProperty)) {
          const [t, p] = plain,
            n = [...env.state.nodes.values()].find(n => key(n) === prefix + p),
            ref = n.componentPropertyReferences.characters;
          assert(ref);
          const linkedPlain = instance
            .findAllWithCriteria({ types: ['TEXT'] })
            .find(n => n.componentPropertyReferences?.characters === ref);
          assert(linkedPlain);
          // The base mock stores instance property overrides separately. Model
          // visible inheritance through this exact linked property only.
          let proto = linkedPlain,
            descriptor;
          while (proto && !descriptor) {
            descriptor = Object.getOwnPropertyDescriptor(proto, 'characters');
            proto = Object.getPrototypeOf(proto);
          }
          assert(descriptor && descriptor.set);
          Object.defineProperty(linkedPlain, 'characters', {
            configurable: true,
            get() {
              return instance.componentProperties[ref].value;
            },
            set(value) {
              descriptor.set.call(this, value);
            },
          });
          instance.setProperties({ [ref]: 'Updated' });
          consumers.push({ instance, ref, value: 'Updated', main: master.id });
        }
        for (const rich of walk(v.tree).filter(([t]) => t.textRuns)) {
          const [t, p] = rich,
            n = [...env.state.nodes.values()].find(n => key(n) === prefix + p),
            linked = instance
              .findAllWithCriteria({ types: ['TEXT'] })
              .find(a => key(a) === key(n));
          env.attachRichText(linked, n);
          linked.editRich(0, 0, 'New ');
          consumers.push({
            instance,
            linked,
            value: linked.characters,
            main: master.id,
          });
        }
      }
    const baseline = geometry(env);
    assert(baseline.length > 22);
    for (let i = 0; i < 2; i++) {
      const repeat = await build();
      assert.deepStrictEqual(copy(repeat.errors), []);
      assert.equal(repeat.createdNodeIds.length, 0);
      await authored();
      assert.deepStrictEqual(geometry(env), baseline);
      for (const c of consumers) {
        assert.equal((await c.instance.getMainComponentAsync()).id, c.main);
        if (c.linked) assert.equal(c.linked.characters, c.value);
        else {
          assert.equal(c.instance.componentProperties[c.ref].value, c.value);
          const linked = c.instance
            .findAllWithCriteria({ types: ['TEXT'] })
            .find(n => n.componentPropertyReferences?.characters === c.ref);
          assert(linked);
          assert.equal(linked.characters, c.value);
        }
      }
    }
    console.log(
      mode.id +
        ' Footer10 genuine source local/remote-boundary/logical text/defaults/paint/two nonempty zero-create repeats pass'
    );
  }
  const env = await rangeEnvironment(d, { richDecorationOffsets: true });
  assert.deepStrictEqual(
    copy(
      (await env.call('importVariables', d, ['undrr'], false, [], true)).errors
    ),
    []
  );
  const load = env.figma.loadFontAsync;
  env.figma.loadFontAsync = async f => {
    if (f.family === 'Roboto' && f.style === 'Bold')
      throw Error('Missing required Roboto Bold');
    return load(f);
  };
  const snap = permanent(env),
    refused = await env.call(
      'buildMangroveComponents',
      d,
      'undrr',
      d.components.families.map(f => f.id),
      { refreshReview: false }
    );
  assert(refused.errors.some(e => e.includes('Roboto')));
  assert.equal(permanent(env), snap);
  console.log(
    'Footer source/all-mode typed/collision/artifact and required-font premutation refusals pass'
  );
}
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { document };
