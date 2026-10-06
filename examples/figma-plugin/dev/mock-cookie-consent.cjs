'use strict';
const fs = require('fs'),
  path = require('path'),
  assert = require('assert');
const root = path.resolve(__dirname, '../../..');
const { buildCookieConsentRecipes } = require(
  root + '/scripts/figma-cookie-consent-recipes.cjs'
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
  d.components.families = buildCookieConsentRecipes({ root, ...d });
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
function installCookieConsentSvgFixture(env, families) {
  const allowed = new Set(
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
    let raw = markup.replace(/ width="[\d.]+" height="[\d.]+"/, '');
    if (!allowed.has(raw)) return original(markup);
    const v = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(raw);
    assert(v);
    const frame = env.figma.createFrame(),
      vector = env.figma.createVector();
    frame.resize(+v[1], +v[2]);
    vector.resize(+v[1], +v[2]);
    vector.vectorPaths = [
      {
        windingRule: 'NONZERO',
        data: [...raw.matchAll(/\bd="([^"]+)"/g)].map(a => a[1]).join(' '),
      },
    ];
    vector.fills = true
      ? []
      : [
          {
            type: 'SOLID',
            color: { r: 0, g: 79 / 255, b: 145 / 255 },
            opacity: 1,
          },
        ];
    vector.strokes = true
      ? [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 1 }]
      : [];
    vector.strokeWeight = +(/stroke-width="([^"]+)"/.exec(raw)?.[1] || 0);
    frame.appendChild(vector);
    frame.rescale = s => {
      frame.resizeWithoutConstraints(frame.width * s, frame.height * s);
      vector.resizeWithoutConstraints(vector.width * s, vector.height * s);
      vector.strokeWeight *= s;
    };
    return frame;
  };
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
    .filter(n => key(n).startsWith('family/cookie-consent-'))
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
      '/examples/figma-plugin/holistic/assets/cookie-consent/source-footprints.json'
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
    [
      ['cookie-consent-toggle', 12],
      ['cookie-consent-banner', 6],
      ['cookie-consent-preferences', 16],
    ]
  );
  for (const mutate of [
    x => (x.variables.find(v => v.name === 'spacing/100').values.irp = 11),
    x =>
      (x.variables.find(v =>
        v.name.startsWith('component/cookie-consent/')
      ).type = 'BOOLEAN'),
    x =>
      (x.styles.text.find(v =>
        v.id.startsWith('component.cookie-consent.')
      ).type = 'EFFECT'),
    x =>
      (x.styles.text.find(v =>
        v.id.startsWith('component.cookie-consent.')
      ).values.mcr.fontName = []),
    x =>
      x.styles.effect.push(
        copy(
          x.styles.text.find(v => v.id.startsWith('component.cookie-consent.'))
        )
      ),
  ]) {
    const x = copy(d);
    mutate(x);
    const before = copy({ variables: x.variables, styles: x.styles });
    assert.throws(
      () => buildCookieConsentRecipes({ root, ...x }),
      /CookieConsent source changed/
    );
    assert.deepStrictEqual(
      { variables: x.variables, styles: x.styles },
      before
    );
  }
  const provenance = JSON.parse(
    fs.readFileSync(
      root +
        '/examples/figma-plugin/holistic/assets/cookie-consent/provenance.json'
    )
  );
  for (const file of [
    ...Object.keys(provenance.sourceHashes),
    ...Object.keys(provenance.assets).map(
      f => 'examples/figma-plugin/holistic/assets/cookie-consent/' + f
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
        () => buildCookieConsentRecipes({ root, ...x }),
        /CookieConsent source changed/
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
  buildCookieConsentRecipes({ root, ...d });
  assert.deepStrictEqual({ variables: d.variables, styles: d.styles }, before);
  assert(
    d.variables
      .filter(v => v.name.startsWith('component/cookie-consent/'))
      .every(v => JSON.stringify(v.scopes) === '["ALL_SCOPES"]')
  );
  assert(
    d.variables
      .filter(
        v =>
          v.name.startsWith('component/cookie-consent/') && v.type === 'COLOR'
      )
      .every(v =>
        d.modes.every(m => v.values[m.id] && v.values[m.id].alias === undefined)
      ),
    'captured paint cannot acquire unrelated global semantic aliases by RGBA equality'
  );
  for (const mode of d.modes) {
    const env = await rangeEnvironment(d, { richDecorationOffsets: true });
    installNativeTextPropertyDefaultFixture(env);
    installCookieConsentSvgFixture(env, d.components.families);
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
    const toggles = d.components.families.find(
      f => f.id === 'cookie-consent-toggle'
    );
    for (const v of toggles.variants) {
      assert(
        !walk(v.tree).some(([t]) => t.type === 'TEXT'),
        'hidden category label must not become visible TEXT'
      );
      const source =
          sourceCases[mode.id + '-' + v.sourceContract.sourceContext],
        label = source.tree[v.sourceContract.sourceIndex],
        prefix = 'family/cookie-consent-toggle/variant/' + v.id,
        rail = source.tree.find(
          n => n.parentIndex === label.index && n.classes === 'toggle__icon'
        ),
        knob = source.tree.find(
          n =>
            n.parentIndex === rail.index && n.classes === 'toggle__icon-circle'
        );
      assert(rail && knob);
      for (const src of [rail, knob]) {
        const native = [...env.state.nodes.values()].find(
          n =>
            key(n) ===
            prefix +
              '/node-' +
              rail.index +
              (src === knob ? '/node-' + knob.index : '')
        );
        assert(native, 'visible source rail/knob required');
        assert.equal(native.width, src.rect.width);
        assert.equal(native.height, src.rect.height);
        assert.equal(native.opacity, 1);
        assert.equal(
          native.x,
          src.rect.x - source.tree[src.parentIndex].rect.x
        );
        assert.equal(
          native.y,
          src.rect.y - source.tree[src.parentIndex].rect.y
        );
      }
      assert(
        walk(v.tree).some(([t]) => t.type === 'SVG'),
        'actual visible check/cross glyph required'
      );
    }
    const categorySlots = d.components.families
      .find(f => f.id === 'cookie-consent-preferences')
      .variants.flatMap(v => walk(v.tree).filter(([t]) => t.sourceCategory));
    assert.equal(categorySlots.length, 40);
    for (const [t] of categorySlots) {
      assert.equal(t.sourceCategory.runtimeAriaAccepted, false);
      assert.equal(t.children.length, 1);
      assert.equal(t.children[0].family, 'cookie-consent-toggle');
      assert.equal(t.sourceCategory.sourceInputType, 'checkbox');
    }
    const consumers = [];
    for (const f of d.components.families)
      for (const v of f.variants) {
        const prefix = 'family/' + f.id + '/variant/' + v.id,
          master = [...env.state.nodes.values()].find(n => key(n) === prefix),
          instance = master.createInstance();
        env.figma.currentPage.appendChild(instance);
        const plain = walk(v.tree).find(([t]) => t.textProperty);
        if (plain) {
          const [t, p] = plain,
            n = [...env.state.nodes.values()].find(n => key(n) === prefix + p),
            ref = n.componentPropertyReferences.characters;
          assert(ref);
          instance.setProperties({ [ref]: 'Updated' });
          consumers.push({ instance, ref, value: 'Updated', main: master.id });
        }
        const rich = walk(v.tree).find(([t]) => t.textRuns);
        if (rich) {
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
        else assert.equal(c.instance.componentProperties[c.ref].value, c.value);
      }
    }
    console.log(
      mode.id +
        ' Cookie34 genuine source controls/logical text/defaults/paint/two nonempty zero-create repeats pass'
    );
  }
  const env = await rangeEnvironment(d, { richDecorationOffsets: true });
  installCookieConsentSvgFixture(env, d.components.families);
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
    'Cookie source/all-mode typed/collision/artifact and required-font premutation refusals pass'
  );
}
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { document, installCookieConsentSvgFixture };
