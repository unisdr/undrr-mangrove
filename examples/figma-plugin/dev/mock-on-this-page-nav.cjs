'use strict';
const fs = require('fs'),
  path = require('path'),
  assert = require('assert');
const root = path.resolve(__dirname, '../../..');
const { buildOnThisPageNavRecipes, sourcePaths } = require(
  root + '/scripts/figma-on-this-page-nav-recipes.cjs'
);
const { rangeEnvironment } = require('./mock-rich-text-integration.cjs');
const {
  installNativeTextPropertyDefaultFixture,
} = require('./mock-search-results.cjs');
const { installMaskFields } = require('./mock-alpha-mask-builder.cjs');
const copy = x => JSON.parse(JSON.stringify(x)),
  id = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
const walk = (n, p = '') => [
  [n, p],
  ...(n.children || []).flatMap(c => walk(c, p + '/' + c.id)),
];
function base() {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'))
  );
}
function document() {
  const d = base();
  d.components.families = buildOnThisPageNavRecipes({ root, ...d });
  return d;
}
function installOnThisPageNavSvgFixture(env, families) {
  const exact = new Set(
    families.flatMap(f =>
      f.variants.flatMap(v =>
        walk(v.tree)
          .filter(([s]) => s.type === 'SVG')
          .map(([s]) => s.svg.markup)
      )
    )
  );
  assert(exact.size >= 2 && exact.size <= 4);
  const previous = env.figma.createNodeFromSvg.bind(env.figma);
  const calls = [];
  env.figma.createNodeFromSvg = markup => {
    if (
      ![...exact].some(
        x =>
          x.replace(/ (?:width|height)="16"/g, '') ===
          markup.replace(/ (?:width|height)="16"/g, '')
      )
    )
      return previous(markup);
    calls.push(markup);
    const f = env.figma.createFrame();
    f.resize(16, 16);
    Object.getPrototypeOf(f).rescale = function (s) {
      this.resizeWithoutConstraints(this.width * s, this.height * s);
      for (const c of this.children)
        c.resizeWithoutConstraints(c.width * s, c.height * s);
    };
    const v = env.figma.createVector();
    v.resize(16, 16);
    v.fills = [];
    v.strokes = [
      { type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 1, visible: true },
    ];
    v.vectorPaths = [
      {
        windingRule: 'NONZERO',
        data: markup.includes('M11 4') ? 'M11 4L6 8L11 12' : 'M5 4L10 8L5 12',
      },
    ];
    v.strokeWeight = 2;
    v.strokeCap = 'ROUND';
    v.strokeJoin = 'ROUND';
    f.appendChild(v);
    return f;
  };
  return calls;
}
function snapshot(env) {
  return JSON.stringify({
    nodes: [...env.state.nodes.values()].map(n => [
      n.id,
      id(n),
      n.parent?.id,
      n.type,
      n.x,
      n.y,
      n.width,
      n.height,
      n.visible,
      n.opacity,
      n.characters,
      n.fills,
      n.strokes,
      n.effectStyleId,
      n.strokeTopWeight,
      n.strokeBottomWeight,
      n.strokeLeftWeight,
      n.strokeRightWeight,
      n.isMask,
      n.maskType,
      n.getSharedPluginData('orgundrrmangrove', 'mgAlphaMaskV1'),
      n.componentPropertyReferences,
      n.type === 'COMPONENT_SET' ? n.componentPropertyDefinitions : null,
      n.type === 'INSTANCE' ? n.componentProperties : null,
    ]),
    variables: env.state.variables,
    styles: env.state.styles,
    images: env.state.images,
  });
}
function restore(archive, x) {
  if (Array.isArray(x)) return x.map(y => restore(archive, y));
  if (x && typeof x === 'object') {
    if (Object.keys(x).join(',') === '$sourceStyle')
      return archive.styles[x.$sourceStyle];
    return Object.fromEntries(
      Object.entries(x).map(([k, v]) => [k, restore(archive, v)])
    );
  }
  return x;
}
async function main() {
  const d = document();
  assert.equal(d.components.families[0].variants.length, 46);
  assert.deepStrictEqual(document(), d);
  const prior = copy({ variables: d.variables, styles: d.styles });
  buildOnThisPageNavRecipes({ root, ...d });
  assert.deepStrictEqual({ variables: d.variables, styles: d.styles }, prior);
  const a = JSON.parse(
      fs.readFileSync(
        root +
          '/examples/figma-plugin/holistic/assets/on-this-page-nav/source-footprints.json'
      )
    ),
    scenes = restore(a, a.data).cases;
  for (const mode of d.modes) {
    const env = await rangeEnvironment(d);
    installNativeTextPropertyDefaultFixture(env);
    installMaskFields(env);
    installOnThisPageNavSvgFixture(env, d.components.families);
    assert.deepStrictEqual(
      copy(
        (await env.call('importVariables', d, [mode.id], false, [], false))
          .errors
      ),
      []
    );
    const run = () =>
      env.call('buildMangroveComponents', d, mode.id, ['on-this-page-nav'], {
        refreshReview: false,
      });
    assert.deepStrictEqual(copy((await run()).errors), []);
    const resolve = x => {
      if (typeof x !== 'string') return x;
      const v = d.variables.find(v => v.name === x);
      assert(v, x);
      const y = v.values[mode.id];
      return y?.alias ? resolve(y.alias) : y;
    };
    function authored() {
      let count = 0;
      for (const v of d.components.families[0].variants) {
        const k = 'family/on-this-page-nav/variant/' + v.id,
          src = sourcePaths(
            scenes[
              (v.properties.CaptureTheme === 'All'
                ? mode.id
                : v.properties.CaptureTheme) +
                '-' +
                v.properties.SourceContext
            ]
          );
        for (const [t, p] of walk(v.tree)) {
          const n = [...env.state.nodes.values()].find(n => id(n) === k + p);
          assert(n, k + p);
          count++;
          assert.equal(n.width, resolve(t.layout.width));
          assert.equal(n.height, resolve(t.layout.height));
          assert.equal(n.opacity, 1);
          if (t.absolute) {
            assert.equal(n.x, resolve(t.absolute.offsetX));
            assert.equal(n.y, resolve(t.absolute.offsetY));
          }
          if (t.fill) {
            const c = resolve(t.fill);
            assert(n.fills.length);
            for (const axis of ['r', 'g', 'b'])
              assert.equal(
                Math.round(n.fills[0].color[axis] * 255),
                Math.round(c[axis] * 255)
              );
            assert.equal(n.fills[0].opacity, c.a ?? 1);
          } else if (t.type === 'FRAME' && !t.alphaMask)
            assert.equal(n.fills.length, 0);
          if (t.effectStyle) {
            const style = env.state.styles.find(s => s.id === n.effectStyleId);
            assert(style);
            const expected = d.styles.effect
              .find(s => s.id === t.effectStyle)
              .values[mode.id].map(v => v.effect);
            assert.deepStrictEqual(copy(style.effects), copy(expected));
          }
          for (const field of [
            'strokeTopWeight',
            'strokeRightWeight',
            'strokeBottomWeight',
            'strokeLeftWeight',
            'strokeWeight',
            'visible',
          ])
            if (t.bindings?.[field])
              assert.equal(n[field], resolve(t.bindings[field]));
          if (t.alphaMask) {
            assert.equal(n.isMask, true);
            assert.equal(n.maskType, 'ALPHA');
            assert.equal(n.parent.children[0].id, n.id);
            assert.equal(n.parent.children.length, 2);
            assert(n.getSharedPluginData('orgundrrmangrove', 'mgAlphaMaskV1'));
            for (let i = 0; i < t.gradient.layers[0].stops.length; i++) {
              const s = t.gradient.layers[0].stops[i];
              assert.equal(
                n.fills[0].gradientStops[i].position,
                resolve(s.position)
              );
              assert.equal(
                n.fills[0].gradientStops[i].color.a,
                resolve(s.color).a
              );
            }
          }
          if (t.type === 'TEXT') {
            assert.equal(n.characters, t.characters);
            assert.equal(n.textAlignHorizontal, t.textAlign);
            const ref = n.componentPropertyReferences.characters;
            assert(ref);
            let owner = n;
            while (owner && owner.type !== 'COMPONENT_SET')
              owner = owner.parent;
            assert.equal(
              owner.componentPropertyDefinitions[ref].defaultValue,
              t.characters
            );
            assert.equal(n.textWrapStyle, 'AUTO');
          }
        }
        const master = [...env.state.nodes.values()].find(n => id(n) === k);
        assert.equal(master.width, src.get('root').rect.width);
        assert.equal(master.height, src.get('root').rect.height);
        // Compare actual source boxes independently of emitted layout fields.
        for (const [sourcePath, recorded] of src) {
          if (sourcePath === 'root' || sourcePath.endsWith('/path')) continue;
          const anatomy =
            sourcePath.replaceAll('/', '-') +
            (recorded.tag.toLowerCase() === 'svg' ? '-slot' : '');
          const built = master.findAll(n => id(n).endsWith('/' + anatomy))[0];
          assert(built, sourcePath);
          assert.equal(
            built.width,
            recorded.rect.width,
            sourcePath + '/source width'
          );
          assert.equal(
            built.height,
            recorded.rect.height,
            sourcePath + '/source height'
          );
          const parentRecord = [...src.values()].find(
            n => n.index === recorded.parentIndex
          );
          assert(parentRecord, sourcePath);
          assert.equal(
            built.x,
            recorded.rect.x - parentRecord.rect.x,
            sourcePath + '/source x'
          );
          assert.equal(
            built.y,
            recorded.rect.y - parentRecord.rect.y,
            sourcePath + '/source y'
          );
          if (recorded.tag === 'A') {
            const label = built.findAll(n => n.type === 'TEXT')[0];
            const css = recorded.style;
            assert.equal(
              label.width,
              recorded.rect.width -
                parseFloat(css['padding-left']) -
                parseFloat(css['padding-right']) -
                parseFloat(css['border-left-width']) -
                parseFloat(css['border-right-width'])
            );
            assert.equal(
              label.height,
              recorded.rect.height -
                parseFloat(css['padding-top']) -
                parseFloat(css['padding-bottom']) -
                parseFloat(css['border-top-width']) -
                parseFloat(css['border-bottom-width'])
            );
            assert.equal(label.characters, recorded.text);
          }
        }
      }
      assert(count > 800);
      return count;
    }
    authored();
    const consumers = [];
    for (const v of d.components.families[0].variants) {
      const k = 'family/on-this-page-nav/variant/' + v.id,
        master = [...env.state.nodes.values()].find(n => id(n) === k),
        t = master.findAll(
          n => n.type === 'TEXT' && n.componentPropertyReferences.characters
        )[0];
      assert(t);
      const ref = t.componentPropertyReferences.characters,
        inst = master.createInstance();
      env.figma.currentPage.appendChild(inst);
      inst.setProperties({ [ref]: 'Maintained nav label' });
      const linked = inst.findAll(
        n =>
          n.type === 'TEXT' && n.componentPropertyReferences.characters === ref
      )[0];
      assert(linked);
      let host = linked,
        desc;
      while (host && !desc) {
        desc = Object.getOwnPropertyDescriptor(host, 'characters');
        host = Object.getPrototypeOf(host);
      }
      assert(desc?.set);
      Object.defineProperty(linked, 'characters', {
        configurable: true,
        get() {
          return inst.componentProperties[ref].value;
        },
        set(v) {
          desc.set.call(this, v);
        },
      });
      consumers.push({ inst, ref, linked, master: master.id });
    }
    const before = snapshot(env);
    for (let i = 0; i < 2; i++) {
      const r = await run();
      assert.deepStrictEqual(copy(r.errors), []);
      assert.equal(r.createdNodeIds.length, 0);
      authored();
      assert.equal(snapshot(env), before);
      for (const c of consumers) {
        assert.equal((await c.inst.getMainComponentAsync()).id, c.master);
        assert.equal(c.linked.characters, 'Maintained nav label');
      }
    }
    console.log(
      mode.id +
        ' actual OnThisPageNav46 matching CaptureTheme or All source/defaults/owners/paint/clip/mask fields/two nonempty zero-create repeats and owning consumer edit pass'
    );
  }
  // Deliberate old generic context names reproduce observed native default drift.
  const legacy = copy(d);
  for (const v of legacy.components.families[0].variants) {
    walk(v.tree).find(([n]) => n.type === 'TEXT')[0].textProperty =
      'Legacy nav shared first label';
  }
  const legacyEnv = await rangeEnvironment(legacy);
  installNativeTextPropertyDefaultFixture(legacyEnv);
  installMaskFields(legacyEnv);
  installOnThisPageNavSvgFixture(legacyEnv, legacy.components.families);
  assert.deepStrictEqual(
    copy(
      (
        await legacyEnv.call(
          'importVariables',
          legacy,
          ['undrr'],
          false,
          [],
          false
        )
      ).errors
    ),
    []
  );
  for (let i = 0; i < 2; i++)
    assert.deepStrictEqual(
      copy(
        (
          await legacyEnv.call(
            'buildMangroveComponents',
            legacy,
            'undrr',
            ['on-this-page-nav'],
            { refreshReview: false }
          )
        ).errors
      ),
      []
    );
  const firstVariant = legacy.components.families[0].variants[0];
  const [firstText, firstPath] = walk(firstVariant.tree).find(
    ([n]) => n.type === 'TEXT'
  );
  const corrupted = [...legacyEnv.state.nodes.values()].find(
    n =>
      id(n) === 'family/on-this-page-nav/variant/' + firstVariant.id + firstPath
  );
  assert(corrupted);
  assert.notEqual(
    corrupted.characters,
    firstText.characters,
    'Legacy generic defaults must visibly corrupt a real earlier main'
  );
  for (const mutate of [
    x =>
      (x.variables.find(v => v.name === 'color/interactive').values.mcr = {
        r: 1,
        g: 0,
        b: 0,
        a: 1,
      }),
    x =>
      (x.variables.find(v => v.name === 'font-family/ui').values.irp = {
        alias: 'font-family/ui',
      }),
    x =>
      (x.variables.find(v =>
        v.name.startsWith('component/on-this-page-nav/')
      ).type = 'STRING'),
    x =>
      (x.styles.text.find(v =>
        v.id.startsWith('component.on-this-page-nav.')
      ).values.mcr.fontName = {}),
    x =>
      (x.styles.text.find(v =>
        v.id.startsWith('component.on-this-page-nav.')
      ).type = 'EFFECT'),
    x =>
      x.styles.effect.push(
        copy(
          x.styles.text.find(v =>
            v.id.startsWith('component.on-this-page-nav.')
          )
        )
      ),
  ]) {
    const x = copy(d);
    mutate(x);
    const before = copy({ variables: x.variables, styles: x.styles });
    assert.throws(
      () => buildOnThisPageNavRecipes({ root, ...x }),
      /OnThisPageNav source changed/
    );
    assert.deepStrictEqual(
      { variables: x.variables, styles: x.styles },
      before
    );
  }
  const provenance = JSON.parse(
    fs.readFileSync(
      root +
        '/examples/figma-plugin/holistic/assets/on-this-page-nav/provenance.json'
    )
  );
  for (const file of [
    ...Object.keys(provenance.sourceHashes),
    ...Object.keys(provenance.assets).map(
      f => 'examples/figma-plugin/holistic/assets/on-this-page-nav/' + f
    ),
  ]) {
    const read = fs.readFileSync,
      x = base(),
      before = copy({ variables: x.variables, styles: x.styles });
    fs.readFileSync = function (f, ...args) {
      const r = read.call(this, f, ...args);
      return path.resolve(String(f)) === path.resolve(root, file)
        ? Buffer.concat([
            Buffer.isBuffer(r) ? r : Buffer.from(r),
            Buffer.from('drift'),
          ])
        : r;
    };
    try {
      assert.throws(
        () => buildOnThisPageNavRecipes({ root, ...x }),
        /OnThisPageNav source changed/
      );
      assert.deepStrictEqual(
        { variables: x.variables, styles: x.styles },
        before
      );
    } finally {
      fs.readFileSync = read;
    }
  }
  const env = await rangeEnvironment(d);
  installNativeTextPropertyDefaultFixture(env);
  installMaskFields(env);
  installOnThisPageNavSvgFixture(env, d.components.families);
  assert.deepStrictEqual(
    copy(
      (await env.call('importVariables', d, ['undrr'], false, [], false)).errors
    ),
    []
  );
  const load = env.figma.loadFontAsync;
  env.figma.loadFontAsync = async f => {
    if (f.style === 'Bold') throw Error('Missing required Bold');
    return load(f);
  };
  const before = snapshot(env),
    r = await env.call('buildMangroveComponents', d, 'undrr', [
      'on-this-page-nav',
    ]);
  assert(r.errors.some(e => e.includes('Bold')));
  assert.equal(snapshot(env), before);
  const arabic = await rangeEnvironment(d);
  installNativeTextPropertyDefaultFixture(arabic);
  installMaskFields(arabic);
  installOnThisPageNavSvgFixture(arabic, d.components.families);
  assert.deepStrictEqual(
    copy(
      (await arabic.call('importVariables', d, ['undrr'], false, [], false))
        .errors
    ),
    []
  );
  const available = arabic.figma.loadFontAsync;
  arabic.figma.loadFontAsync = async font => {
    if (font.family === 'Noto Sans Arabic')
      throw Error('Missing actual source Noto Sans Arabic');
    return available(font);
  };
  const arabicBefore = snapshot(arabic);
  const arabicRefusal = await arabic.call(
    'buildMangroveComponents',
    d,
    'undrr',
    ['on-this-page-nav']
  );
  assert(
    arabicRefusal.errors.some(error => error.includes('Noto Sans Arabic'))
  );
  assert.equal(snapshot(arabic), arabicBefore);
  console.log(
    'OnThisPageNav staged source/type/kind/artifact and required-font premutation refusal pass'
  );
}
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { document, installOnThisPageNavSvgFixture };
