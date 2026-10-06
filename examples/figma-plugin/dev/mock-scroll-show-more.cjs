#!/usr/bin/env node
/** Genuine source candidate lifecycle; no mask pixel compositing simulation. */
'use strict';
const fs = require('fs'),
  path = require('path'),
  assert = require('assert');
const root = path.resolve(__dirname, '../../..');
const {
  buildShowMoreRecipes,
  buildScrollHydratedRecipes,
  buildScrollShowMoreRecipes,
  buildScrollPhotoRecipes,
} = require('../../../scripts/figma-scroll-show-more-recipes.cjs');
const { rangeEnvironment } = require('./mock-rich-text-integration.cjs');
const {
  installNativeTextPropertyDefaultFixture,
} = require('./mock-search-results.cjs');
const { installMaskFields } = require('./mock-alpha-mask-builder.cjs');
const copy = x => JSON.parse(JSON.stringify(x));
const walk = n => [n, ...(n.children || []).flatMap(walk)];
const id = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
function document() {
  const d = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'))
  );
  d.components.families = buildShowMoreRecipes({ root, ...d });
  return d;
}
function snapshot(env) {
  return JSON.stringify(
    [...env.state.nodes.values()]
      .map(n => [
        n.id,
        id(n),
        n.parent?.id,
        n.type,
        n.x,
        n.y,
        n.width,
        n.height,
        n.opacity,
        n.isMask,
        n.maskType,
        n.getSharedPluginData('orgundrrmangrove', 'mgAlphaMaskV1'),
        n.characters,
        n.textWrapStyle,
        n.fills,
        n.boundVariables,
        n.componentPropertyReferences,
        n.type === 'INSTANCE' ? n.componentProperties : null,
        n.type === 'COMPONENT_SET' ? n.componentPropertyDefinitions : null,
        n.type === 'TEXT' && n.getStyledTextSegments
          ? n.getStyledTextSegments(['textStyleId', 'fontName', 'fills'])
          : null,
      ])
      .sort((a, b) => a[0].localeCompare(b[0]))
  );
}
async function main() {
  const d = document();
  assert.equal(d.components.families.length, 1);
  assert.equal(d.components.families[0].variants.length, 18);
  assert.deepStrictEqual(document(), d);
  const before = copy({ variables: d.variables, styles: d.styles });
  buildShowMoreRecipes({ root, ...d });
  assert.deepStrictEqual({ variables: d.variables, styles: d.styles }, before);
  const defaults = new Map();
  for (const v of d.components.families[0].variants)
    for (const t of walk(v.tree).filter(t => t.textProperty)) {
      assert(
        !defaults.has(t.textProperty) ||
          defaults.get(t.textProperty) === t.characters
      );
      defaults.set(t.textProperty, t.characters);
    }
  for (const mode of d.modes) {
    const env = await rangeEnvironment(d);
    installNativeTextPropertyDefaultFixture(env);
    installMaskFields(env);
    const imported = await env.call(
      'importVariables',
      d,
      [mode.id],
      false,
      [],
      false
    );
    assert.deepStrictEqual(copy(imported.errors), []);
    const build = () =>
      env.call('buildMangroveComponents', d, mode.id, ['show-more']);
    const first = await build();
    assert.deepStrictEqual(copy(first.errors), []);
    assert(first.createdNodeIds.length > 100);
    const resolve = name => {
      if (typeof name === 'number') return name;
      const v = d.variables.find(v => v.name === name);
      assert(v, name);
      const x = v.values[mode.id];
      return x?.alias ? resolve(x.alias) : x;
    };
    function verify() {
      for (const v of d.components.families[0].variants) {
        const key = 'family/show-more/variant/' + v.id;
        const master = [...env.state.nodes.values()].find(n => id(n) === key);
        assert(master);
        assert.equal(master.width, v.sourceContract.sourceRect[mode.id].width);
        assert.equal(
          master.height,
          v.sourceContract.sourceRect[mode.id].height
        );
        function visit(s, k) {
          const n = [...env.state.nodes.values()].find(n => id(n) === k);
          assert(n, k);
          if (s.type === 'FRAME') {
            assert.equal(n.width, resolve(s.layout.width), k + ' width');
            assert.equal(n.height, resolve(s.layout.height), k + ' height');
            if (s.absolute) {
              assert.equal(n.x, resolve(s.absolute.offsetX));
              assert.equal(n.y, resolve(s.absolute.offsetY));
            }
            if (s.alphaMask) {
              assert.equal(n.isMask, s.alphaMask.type === 'ALPHA');
              assert.equal(n.maskType, 'ALPHA');
              assert(
                n.getSharedPluginData('orgundrrmangrove', 'mgAlphaMaskV1')
              );
              if (s.alphaMask.type === 'NONE') assert.equal(n.fills.length, 0);
              else {
                assert.equal(n.height, 200);
                assert.equal(n.fills[0].gradientStops.length, 3);
                assert.deepStrictEqual(
                  copy(
                    n.fills[0].gradientStops.map(x => [x.position, x.color.a])
                  ),
                  [
                    [0, 1],
                    [0.6, 1],
                    [1, 0],
                  ]
                );
              }
            }
            if (s.bindings?.opacity)
              assert.equal(n.opacity, resolve(s.bindings.opacity) / 100);
          }
          if (s.type === 'TEXT') assert.equal(n.textWrapStyle, s.textWrap);
          if (s.type === 'TEXT' && !s.textRuns) {
            assert.equal(n.characters, s.characters);
            if (s.textProperty) {
              let owner = n.parent;
              while (owner && owner.type !== 'COMPONENT_SET')
                owner = owner.parent;
              assert.equal(
                owner.componentPropertyDefinitions[
                  n.componentPropertyReferences.characters
                ].defaultValue,
                s.characters
              );
            }
          }
          for (const c of s.children || []) visit(c, k + '/' + c.id);
        }
        visit(v.tree, key);
      }
    }
    verify();
    const v = d.components.families[0].variants.find(
      v =>
        v.sourceContract.case === 'show-default-show-more' &&
        v.sourceContract.state === 'collapsed' &&
        v.sourceContract.viewport === 390
    );
    const key = 'family/show-more/variant/' + v.id,
      master = [...env.state.nodes.values()].find(n => id(n) === key),
      body = master.findAll(
        n => n.type === 'TEXT' && n.characters.startsWith('As the UN Office')
      )[0];
    assert(body);
    const consumer = master.createInstance();
    env.figma.currentPage.appendChild(consumer);
    const ref = body.componentPropertyReferences.characters;
    consumer.setProperties({ [ref]: 'Maintained genuine source text' });
    const linked = consumer.findAll(
      n => n.type === 'TEXT' && n.componentPropertyReferences.characters === ref
    )[0];
    assert(linked);
    let descriptor,
      host = linked;
    while (host && !descriptor) {
      descriptor = Object.getOwnPropertyDescriptor(host, 'characters');
      host = Object.getPrototypeOf(host);
    }
    assert(descriptor?.set);
    Object.defineProperty(linked, 'characters', {
      configurable: true,
      get() {
        return consumer.componentProperties[ref].value;
      },
      set(x) {
        descriptor.set.call(this, x);
      },
    });
    assert.equal(linked.characters, 'Maintained genuine source text');
    const richMaster = [...env.state.nodes.values()].find(
      n =>
        n.type === 'TEXT' &&
        id(n).startsWith('family/show-more/') &&
        n
          .getStyledTextSegments(['fontName'])
          .some(s => s.fontName?.family === 'Menlo')
    );
    assert(richMaster);
    richMaster.editRich(0, 1, 'X');
    let richOwner = richMaster.parent;
    while (richOwner && richOwner.type !== 'COMPONENT')
      richOwner = richOwner.parent;
    assert(richOwner);
    const richConsumer = richOwner.createInstance();
    env.figma.currentPage.appendChild(richConsumer);
    const richLinked = richConsumer.findAll(
      n => n.type === 'TEXT' && id(n) === id(richMaster)
    )[0];
    assert(richLinked);
    env.attachRichText(richLinked, richMaster);
    richLinked.editRich(0, 1, 'Y');
    assert.equal(richLinked.characters[0], 'Y');
    const baseline = snapshot(env);
    assert(JSON.parse(baseline).length > 300);
    for (let i = 0; i < 2; i++) {
      const repeat = await build();
      assert.deepStrictEqual(copy(repeat.errors), []);
      assert.equal(repeat.createdNodeIds.length, 0);
      assert.deepStrictEqual(snapshot(env), baseline);
      assert.equal(linked.characters, 'Maintained genuine source text');
    }
    console.log(
      mode.id +
        ' ShowMore18 genuine content/ALPHA/NONE fields, source owners/defaults, rich and linked edits, two zero-create repeats passed; no raster claim'
    );
  }
  for (const mutation of [
    d =>
      (d.variables.find(v => v.name === 'font-family/text').values.mcr =
        'Wrong'),
    d =>
      (d.variables.find(v => v.name.startsWith('component/show-more/')).type =
        'STRING'),
    d =>
      (d.styles.text.find(s => s.id.startsWith('component.show-more.')).type =
        'EFFECT'),
    d =>
      (d.styles.text.find(s =>
        s.id.startsWith('component.show-more.')
      ).values.mcr.fontName = { family: '', style: 'Regular' }),
  ]) {
    const d = document();
    mutation(d);
    const original = copy({ variables: d.variables, styles: d.styles });
    assert.throws(() => buildShowMoreRecipes({ root, ...d }), /needs updating/);
    assert.deepStrictEqual(
      { variables: d.variables, styles: d.styles },
      original
    );
  }
  for (const file of [
    'stories/Utilities/ShowMore/show-more.scss',
    'stories/Utilities/ShowMore/ShowMore.jsx',
    'examples/figma-plugin/holistic/assets/scroll-show-more/source-footprints.json',
  ]) {
    const nativeRead = fs.readFileSync;
    let hit = false;
    fs.readFileSync = function (p, ...args) {
      const b = nativeRead.call(this, p, ...args);
      if (path.resolve(p) === path.join(root, file)) {
        hit = true;
        return Buffer.concat([
          Buffer.isBuffer(b) ? b : Buffer.from(b),
          Buffer.from('\nsource drift'),
        ]);
      }
      return b;
    };
    try {
      assert.throws(document, /Source drift/);
      assert(hit, file);
    } finally {
      fs.readFileSync = nativeRead;
    }
  }
  const missing = document(),
    env = await rangeEnvironment(missing);
  installMaskFields(env);
  installNativeTextPropertyDefaultFixture(env);
  env.state.fonts = env.state.fonts.filter(f => f.fontName.family !== 'Menlo');
  await env.call('importVariables', missing, ['undrr'], false, [], false);
  const original = {
    scene: snapshot(env),
    styles: copy(env.state.styles),
    images: [...env.state.images.keys()],
  };
  const refused = await env.call('buildMangroveComponents', missing, 'undrr', [
    'show-more',
  ]);
  assert(refused.errors.some(e => e.includes('unavailable')));
  assert.equal(refused.createdNodeIds.length, 0);
  assert.deepStrictEqual(
    {
      scene: snapshot(env),
      styles: copy(env.state.styles),
      images: [...env.state.images.keys()],
    },
    original
  );
  console.log(
    'ShowMore source/type/kind/artifact guards preserve caller arrays; missing source Menlo refuses before scene/style/image writes. Scroll cohort remains in progress.'
  );
}

function hydratedDocument() {
  const d = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'))
  );
  d.components.families = buildScrollHydratedRecipes({ root, ...d });
  return d;
}
async function hydratedMain() {
  const d = hydratedDocument();
  assert.deepStrictEqual(
    d.components.families.map(f => [f.id, f.variants.length]),
    [
      ['scroll-hydrated-card', 12],
      ['scroll-container-hydrated', 6],
    ]
  );
  assert.deepStrictEqual(hydratedDocument(), d);
  const cases = JSON.parse(
    fs.readFileSync(
      path.join(
        __dirname,
        '../holistic/assets/scroll-show-more/source-footprints.json'
      )
    )
  );
  const expected = cases.scenes.filter(
    s => s.case === 'scroll-two-hydrated-on-one-page'
  );
  assert.equal(expected.length, 30);
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
    const build = () =>
      env.call('buildMangroveComponents', d, mode.id, [
        'scroll-hydrated-card',
        'scroll-container-hydrated',
      ]);
    assert.deepStrictEqual(copy((await build()).errors), []);
    const resolve = x => {
      if (typeof x === 'number') return x;
      const v = d.variables.find(v => v.name === x);
      assert(v, x);
      const value = v.values[mode.id];
      return value?.alias ? resolve(value.alias) : value;
    };
    let instanceCount = 0;
    for (const family of d.components.families)
      for (const v of family.variants) {
        const key = 'family/' + family.id + '/variant/' + v.id;
        const master = [...env.state.nodes.values()].find(n => id(n) === key);
        assert(master);
        assert.equal(master.width, v.sourceContract.sourceRect[mode.id].width);
        assert.equal(
          master.height,
          v.sourceContract.sourceRect[mode.id].height
        );
        function visit(s, k) {
          const n = [...env.state.nodes.values()].find(n => id(n) === k);
          assert(n, k);
          if (s.type === 'FRAME' || s.type === 'INSTANCE') {
            assert.equal(n.width, resolve(s.layout.width), k + ' width');
            assert.equal(n.height, resolve(s.layout.height), k + ' height');
            if (s.absolute) {
              assert.equal(n.x, resolve(s.absolute.offsetX), k + ' x');
              assert.equal(n.y, resolve(s.absolute.offsetY), k + ' y');
            }
            if (s.sourceNode) {
              assert.equal(
                n.width,
                s.sourceNode.rect[mode.id].width,
                'Independent captured source width'
              );
              assert.equal(
                n.height,
                s.sourceNode.rect[mode.id].height,
                'Independent captured source height'
              );
            }
            if (s.layout.clipsContent !== undefined)
              assert.equal(n.clipsContent, s.layout.clipsContent);
            if (s.bindings?.opacity)
              assert.equal(n.opacity, resolve(s.bindings.opacity) / 100);
            if (s.type === 'INSTANCE') {
              assert.equal(
                id(n.main),
                'family/' +
                  s.family +
                  '/variant/scroll-hydrated-card.' +
                  s.variant.Row.toLowerCase() +
                  '.' +
                  s.variant.Item
              );
              instanceCount++;
            }
          }
          if (s.type === 'TEXT') assert.equal(n.textWrapStyle, s.textWrap);
          if (s.type === 'TEXT' && !s.textRuns) {
            assert.equal(n.characters, s.characters);
            let owner = n.parent;
            while (owner && owner.type !== 'COMPONENT_SET')
              owner = owner.parent;
            assert.equal(
              owner.componentPropertyDefinitions[
                n.componentPropertyReferences.characters
              ].defaultValue,
              s.characters
            );
          }
          for (const child of s.children || [])
            visit(child, k + '/' + child.id);
        }
        visit(v.tree, key);
      }
    assert.equal(
      instanceCount,
      72,
      'Twelve genuine card instances in each of six two-row source scenes'
    );
    const scene = d.components.families[1].variants.find(
      v => v.properties.State === 'start' && v.properties.Viewport === '390'
    );
    const master = [...env.state.nodes.values()].find(
      n => id(n) === 'family/scroll-container-hydrated/variant/' + scene.id
    );
    const consumer = master.createInstance();
    env.figma.currentPage.appendChild(consumer);
    const nested = consumer.findAll(n => n.type === 'INSTANCE')[0];
    assert(nested);
    const child = nested.findAll(
      n => n.type === 'TEXT' && n.characters.startsWith('First row card')
    )[0];
    assert(child);
    const ref = child.componentPropertyReferences.characters;
    assert(ref);
    nested.setProperties({ [ref]: 'Maintained hydrated title' });
    let desc,
      host = child;
    while (host && !desc) {
      desc = Object.getOwnPropertyDescriptor(host, 'characters');
      host = Object.getPrototypeOf(host);
    }
    assert(desc?.set);
    Object.defineProperty(child, 'characters', {
      configurable: true,
      get() {
        return nested.componentProperties[ref].value;
      },
      set(x) {
        desc.set.call(this, x);
      },
    });
    assert.equal(child.characters, 'Maintained hydrated title');
    const baseline = snapshot(env);
    assert(JSON.parse(baseline).length > 1000);
    for (let i = 0; i < 2; i++) {
      const r = await build();
      assert.deepStrictEqual(copy(r.errors), []);
      assert.equal(r.createdNodeIds.length, 0);
      assert.deepStrictEqual(snapshot(env), baseline);
      assert.equal(child.characters, 'Maintained hydrated title');
    }
    console.log(
      mode.id +
        ' hydrated Scroll12 card masters/six actual two-row states,72 true nested instances, owning TEXT edit and two zero-create repeats passed'
    );
  }
  const legacy = document();
  legacy.components.families[0].variants =
    legacy.components.families[0].variants.filter(
      v =>
        v.sourceContract.case === 'show-default-show-more' &&
        v.sourceContract.viewport === 390
    );
  for (const v of legacy.components.families[0].variants) {
    const toggle = walk(v.tree).find(
      n => n.type === 'TEXT' && n.characters.startsWith('Show ')
    );
    toggle.textProperty = 'Legacy generic toggle';
  }
  const env = await rangeEnvironment(legacy);
  installNativeTextPropertyDefaultFixture(env);
  installMaskFields(env);
  await env.call('importVariables', legacy, ['undrr'], false, [], false);
  for (let i = 0; i < 2; i++)
    assert.deepStrictEqual(
      copy(
        (
          await env.call('buildMangroveComponents', legacy, 'undrr', [
            'show-more',
          ])
        ).errors
      ),
      []
    );
  const collapsed = legacy.components.families[0].variants.find(
    v => v.sourceContract.state === 'collapsed'
  );
  const owner = [...env.state.nodes.values()].find(
    n => id(n) === 'family/show-more/variant/' + collapsed.id
  );
  assert.notEqual(
    owner.findAll(
      n =>
        n.type === 'TEXT' &&
        n.componentPropertyReferences?.characters?.startsWith(
          'Legacy generic toggle'
        )
    )[0].characters,
    'Show more',
    'Observed native shared-default fixture reproduces generic toggle corruption'
  );
}

async function sourceBoundaryChecks() {
  const d = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'))
  );
  const families = buildScrollShowMoreRecipes({ root, ...d });
  assert.deepStrictEqual(
    families.map(f => [f.id, f.variants.length]),
    [
      ['show-more', 18],
      ['scroll-hydrated-card', 12],
      ['scroll-container-hydrated', 6],
    ]
  );
  for (const change of [
    d => {
      d.styles.text.find(s =>
        s.id.startsWith('component.scroll-container-hydrated.')
      ).values.mcr.fontName = { family: '', style: 'Regular' };
    },
    d => {
      d.variables.find(v =>
        v.name.startsWith('component/scroll-container-hydrated/')
      ).type = 'STRING';
    },
    d => {
      const s = d.styles.text.find(s =>
        s.id.startsWith('component.scroll-container-hydrated.')
      );
      d.styles.text.splice(d.styles.text.indexOf(s), 1);
      d.styles.effect.push(s);
    },
  ]) {
    const bad = copy(d);
    change(bad);
    const before = copy({ variables: bad.variables, styles: bad.styles });
    assert.throws(
      () => buildScrollShowMoreRecipes({ root, ...bad }),
      /needs updating/
    );
    assert.deepStrictEqual(
      { variables: bad.variables, styles: bad.styles },
      before,
      'Late second-factory failure preserves composite caller arrays'
    );
  }
  const archive = JSON.parse(
      fs.readFileSync(
        path.join(
          __dirname,
          '../holistic/assets/scroll-show-more/source-footprints.json'
        )
      )
    ),
    provenance = JSON.parse(
      fs.readFileSync(
        path.join(
          __dirname,
          '../holistic/assets/scroll-show-more/provenance.json'
        )
      )
    );
  const rawA = path.join(provenance.rawCaptureRoot, 'source-footprints.json'),
    rawB = path.join(provenance.rawCaptureRoot, 'source-supplement.json');
  if (fs.existsSync(rawA) && fs.existsSync(rawB)) {
    function restore(value, key) {
      if (
        ['css', 'before', 'after', 'placeholderCss'].includes(key) &&
        Number.isInteger(value)
      )
        return archive.styles[value];
      if (Array.isArray(value)) return value.map(v => restore(v));
      if (value && typeof value === 'object')
        return Object.fromEntries(
          Object.entries(value).map(([k, v]) => [k, restore(v, k)])
        );
      return value;
    }
    assert.deepStrictEqual(restore(archive.scenes), [
      ...JSON.parse(fs.readFileSync(rawA)),
      ...JSON.parse(fs.readFileSync(rawB)),
    ]);
    console.log(
      'Lossless archive independently restores exact230 preserved raw source arrays.'
    );
  }
  const valid = document();
  const env = await rangeEnvironment(valid);
  installNativeTextPropertyDefaultFixture(env);
  installMaskFields(env);
  await env.call('importVariables', valid, ['undrr'], false, [], false);
  const before = {
    scene: snapshot(env),
    styles: copy(env.state.styles),
    images: [...env.state.images.keys()],
  };
  const bad = copy(valid);
  const richStyleId = bad.components.families[0].variants
    .flatMap(v => walk(v.tree))
    .find(n => n.textRuns)?.textRuns[0].textStyle;
  assert(richStyleId);
  bad.styles.text.find(s => s.id === richStyleId).values.mcr.fontName = {
    family: '',
    style: 'Regular',
  };
  const rejected = await env.call('buildMangroveComponents', bad, 'undrr', [
    'show-more',
  ]);
  assert(rejected.errors.length);
  assert.equal(rejected.createdNodeIds.length, 0);
  assert.deepStrictEqual(
    {
      scene: snapshot(env),
      styles: copy(env.state.styles),
      images: [...env.state.images.keys()],
    },
    before,
    'Nonselected required rich source font refuses before permanent writes'
  );
  console.log(
    'Composite staged helpers, late caller-preserving type/style/font refusal and required rich unused-mode font preflight checks pass.'
  );
}

function photoDocument() {
  const d = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'))
  );
  const cta =
    require('../../../scripts/figma-editorial-cta-recipes.cjs').buildEditorialCtaRecipes(
      { root, ...d }
    );
  d.components.families = [...cta, ...buildScrollPhotoRecipes({ root, ...d })];
  return d;
}
function installScrollPhotoSvgFixture(env, families) {
  const expected = new Set(
    families.flatMap(f =>
      f.variants.flatMap(v =>
        walk(v.tree)
          .filter(t => t.type === 'SVG')
          .map(t => t.svg.markup)
      )
    )
  );
  const previous = env.figma.createNodeFromSvg.bind(env.figma);
  env.figma.createNodeFromSvg = markup => {
    const raw = markup.replace(/ width="[\d.]+" height="[\d.]+"/, '');
    if (!expected.has(raw)) return previous(markup);
    const match = /viewBox="0 0 ([\d.e+-]+) ([\d.e+-]+)"/.exec(raw);
    assert(match);
    const frame = env.figma.createFrame(),
      vector = env.figma.createVector(),
      w = +match[1],
      h = +match[2];
    frame.resize(w, h);
    vector.resize(w, h);
    vector.vectorPaths = [
      {
        windingRule: 'NONZERO',
        data: /<path d="([^"]+)"/.exec(raw)?.[1] || 'M0 0',
      },
    ];
    vector.constraints = { horizontal: 'MIN', vertical: 'MIN' };
    vector.strokeAlign = 'CENTER';
    vector.strokeWeight = raw.includes('stroke="') ? 2 : 0;
    const black = {
      type: 'SOLID',
      color: { r: 0, g: 0, b: 0 },
      opacity: 1,
      visible: true,
    };
    vector.fills = vector.strokeWeight ? [] : [black];
    vector.strokes = vector.strokeWeight ? [black] : [];
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
const photoSnapshot = env =>
  JSON.stringify([
    // This cohort is plain TEXT only. Record actual public native fields below,
    // not synthetic rich ranges reset by the observed set-default fixture.
    JSON.parse(snapshot(env)).map(row => {
      row[row.length - 1] = null;
      return row;
    }),
    [...env.state.nodes.values()]
      .map(n => [
        n.id,
        n.effectStyleId,
        n.effects,
        n.strokes,
        n.strokeWeight,
        n.topLeftRadius,
        n.topRightRadius,
        n.bottomLeftRadius,
        n.bottomRightRadius,
        n.vectorPaths,
        n.fontName,
        n.textStyleId,
        n.textDecoration,
        n.textDecorationOffset,
      ])
      .sort((a, b) => a[0].localeCompare(b[0])),
    [...env.state.images.keys()].sort(),
  ]);
async function photoMain() {
  const d = photoDocument(),
    selected = ['scroll-source-photo-card', 'scroll-container-photo'];
  assert.deepStrictEqual(
    d.components.families.slice(1).map(f => [f.id, f.variants.length]),
    [
      ['scroll-source-photo-card', 5],
      ['scroll-container-photo', 22],
    ]
  );
  assert.deepStrictEqual(photoDocument(), d);
  assert(
    !d.components.families.some(f =>
      f.variants.some(v => walk(v.tree).some(t => t.textRuns))
    ),
    'Photo cohort uses actual public plain TEXT fields, not ranged content'
  );
  const source = JSON.parse(
    fs.readFileSync(
      path.join(
        __dirname,
        '../holistic/assets/scroll-show-more/source-footprints.json'
      )
    )
  );
  for (const mode of d.modes) {
    const env = await rangeEnvironment(d);
    installNativeTextPropertyDefaultFixture(env);
    installScrollPhotoSvgFixture(env, d.components.families);
    assert.deepStrictEqual(
      copy(
        (await env.call('importVariables', d, [mode.id], false, [], false))
          .errors
      ),
      []
    );
    const build = () =>
      env.call('buildMangroveComponents', d, mode.id, selected);
    const first = await build();
    assert.deepStrictEqual(copy(first.errors), []);
    const resolve = x => {
      if (typeof x === 'number') return x;
      const v = d.variables.find(v => v.name === x);
      assert(v, x);
      return v.values[mode.id]?.alias
        ? resolve(v.values[mode.id].alias)
        : v.values[mode.id];
    };
    let instances = 0,
      owners = 0;
    for (const f of d.components.families.filter(f => selected.includes(f.id)))
      for (const v of f.variants) {
        const key = 'family/' + f.id + '/variant/' + v.id;
        function visit(s, k, parent) {
          const n = [...env.state.nodes.values()].find(n => id(n) === k);
          assert(n, k);
          owners++;
          if (s.sourceNode) {
            assert.equal(
              n.width,
              s.sourceNode.rect[mode.id].width,
              k + ' captured width'
            );
            assert.equal(
              n.height,
              s.sourceNode.rect[mode.id].height,
              k + ' captured height'
            );
          }
          if (s.absolute) {
            assert.equal(n.x, resolve(s.absolute.offsetX), k + ' source x');
            assert.equal(n.y, resolve(s.absolute.offsetY), k + ' source y');
          }
          if (s.bindings?.opacity)
            assert.equal(n.opacity, resolve(s.bindings.opacity) / 100);
          if (s.effectStyle) {
            const actual = env.state.styles.find(
              style => style.id === n.effectStyleId
            );
            assert(actual, k + ' effect');
            assert.equal(actual.name, 'Mangrove/shadow/raised');
            assert.equal(n.effects[0].type, 'INNER_SHADOW');
            assert.equal(n.effects[0].spread, 1);
            assert.equal(n.effects[0].radius, 0);
          }
          if (s.type === 'TEXT' && !s.textRuns) {
            assert.equal(n.characters, s.characters);
            assert.equal(n.textWrapStyle, s.textWrap);
            if (s.textProperty) {
              let owner = n.parent;
              while (owner && owner.type !== 'COMPONENT_SET')
                owner = owner.parent;
              assert.equal(
                owner.componentPropertyDefinitions[
                  n.componentPropertyReferences.characters
                ].defaultValue,
                s.characters
              );
            }
          }
          if (s.type === 'INSTANCE') {
            assert(n.main);
            const expected = d.components.families
              .find(f => f.id === s.family)
              .variants.find(v =>
                Object.entries(s.variant).every(
                  ([k, x]) => v.properties[k] === x
                )
              );
            assert.equal(
              id(n.main),
              'family/' + s.family + '/variant/' + expected.id
            );
            instances++;
          }
          for (const c of s.children || []) visit(c, k + '/' + c.id, s);
        }
        visit(v.tree, key, null);
      }
    assert.equal(instances, 181);
    assert.equal(
      owners,
      d.components.families
        .filter(f => selected.includes(f.id))
        .flatMap(f => f.variants.flatMap(v => walk(v.tree))).length
    );
    assert(owners > 500);
    const scene = d.components.families.find(
        f => f.id === 'scroll-container-photo'
      ).variants[0],
      master = [...env.state.nodes.values()].find(
        n => id(n) === 'family/scroll-container-photo/variant/' + scene.id
      ),
      consumer = master.createInstance();
    env.figma.currentPage.appendChild(consumer);
    const nested = consumer.findAll(
      n =>
        n.type === 'INSTANCE' &&
        id(n.main).startsWith('family/scroll-source-photo-card/')
    )[0];
    assert(nested);
    const target = nested.findAll(
      n => n.type === 'TEXT' && n.characters.includes('Early financing')
    )[0];
    assert(target);
    const prop = target.componentPropertyReferences.characters;
    assert(prop);
    nested.setProperties({ [prop]: 'Maintained source photo summary' });
    let descriptor,
      host = target;
    while (host && !descriptor) {
      descriptor = Object.getOwnPropertyDescriptor(host, 'characters');
      host = Object.getPrototypeOf(host);
    }
    assert(descriptor?.set);
    Object.defineProperty(target, 'characters', {
      configurable: true,
      get() {
        return nested.componentProperties[prop].value;
      },
      set(x) {
        descriptor.set.call(this, x);
      },
    });
    assert.equal(target.characters, 'Maintained source photo summary');
    const baseline = photoSnapshot(env);
    for (let i = 0; i < 2; i++) {
      const r = await build();
      assert.deepStrictEqual(copy(r.errors), []);
      assert.equal(r.createdNodeIds.length, 0);
      if (photoSnapshot(env) !== baseline) {
        fs.writeFileSync(
          '/tmp/mangrove-scroll-photo-repeat-before.json',
          baseline
        );
        fs.writeFileSync(
          '/tmp/mangrove-scroll-photo-repeat-after.json',
          photoSnapshot(env)
        );
        throw Error('Photo repeat drift, exact before/after evidence saved');
      }
      assert.equal(target.characters, 'Maintained source photo summary');
    }
    const mirrors = JSON.parse(
      fs.readFileSync(
        path.join(
          __dirname,
          '../holistic/assets/scroll-show-more/scroll-card-caret-mirror.json'
        )
      )
    ).find(s => s.mode === mode.id && s.viewport.width === 390);
    for (const variant of d.components.families.find(
      f => f.id === 'scroll-source-photo-card'
    ).variants) {
      const rootNode = [...env.state.nodes.values()].find(
          n => id(n) === 'family/scroll-source-photo-card/variant/' + variant.id
        ),
        caret = rootNode.findAll(n => id(n).endsWith('-initial-caret'))[0];
      assert(caret);
      let x = caret.x,
        y = caret.y,
        parent = caret.parent;
      while (parent !== rootNode) {
        assert(parent);
        x += parent.x;
        y += parent.y;
        parent = parent.parent;
      }
      const sourceCaret = mirrors.cards[+variant.properties.Item - 1];
      assert.equal(x, sourceCaret.mirrorCaret.x - sourceCaret.card.x);
      assert.equal(y, sourceCaret.mirrorCaret.y - sourceCaret.card.y);
    }
    assert.equal(env.state.images.size, 5);
    console.log(
      mode.id +
        ': source photo five cards/22 scenes, genuine181 nested instances, owning copy/effect/source geometry and two exact zero-create repeats pass'
    );
  }
  for (const mutate of [
    d => {
      d.variables.find(v =>
        v.name.startsWith('component/scroll-container-photo/')
      ).type = 'STRING';
    },
    d => {
      d.styles.text.find(s =>
        s.id.startsWith('component.scroll-container-photo.')
      ).type = 'EFFECT';
    },
    d => {
      d.styles.text.find(s =>
        s.id.startsWith('component.scroll-container-photo.')
      ).values.mcr.fontName = { family: '', style: 'Regular' };
    },
    d => {
      const s = d.styles.text.find(s =>
        s.id.startsWith('component.scroll-container-photo.')
      );
      d.styles.text.splice(d.styles.text.indexOf(s), 1);
      d.styles.effect.push(s);
    },
    d => {
      d.styles.effect.find(
        s => s.id === 'shadow.raised'
      ).values.mcr[0].effect.spread = 2;
    },
  ]) {
    const bad = copy(d);
    mutate(bad);
    const before = copy({ variables: bad.variables, styles: bad.styles });
    assert.throws(
      () => buildScrollPhotoRecipes({ root, ...bad }),
      /needs updating/
    );
    assert.deepStrictEqual(
      { variables: bad.variables, styles: bad.styles },
      before
    );
  }
  for (const file of [
    'scripts/figma-editorial-cta-recipes.cjs',
    'examples/figma-plugin/holistic/assets/scroll-show-more/photo-source/outline-source.json',
  ]) {
    const nativeRead = fs.readFileSync;
    let hit = false;
    fs.readFileSync = function (p, ...args) {
      const b = nativeRead.call(this, p, ...args);
      if (path.resolve(p) === path.join(root, file)) {
        hit = true;
        return Buffer.concat([
          Buffer.isBuffer(b) ? b : Buffer.from(b),
          Buffer.from('source drift'),
        ]);
      }
      return b;
    };
    try {
      const bad = copy(d),
        before = copy({ variables: bad.variables, styles: bad.styles });
      assert.throws(
        () => buildScrollPhotoRecipes({ root, ...bad }),
        /source drift/i
      );
      assert(hit);
      assert.deepStrictEqual(
        { variables: bad.variables, styles: bad.styles },
        before
      );
    } finally {
      fs.readFileSync = nativeRead;
    }
  }
  const env = await rangeEnvironment(d);
  installNativeTextPropertyDefaultFixture(env);
  installScrollPhotoSvgFixture(env, d.components.families);
  env.state.fonts = env.state.fonts.filter(f => f.fontName.style !== 'Bold');
  await env.call('importVariables', d, ['undrr'], false, [], false);
  const before = {
    scene: photoSnapshot(env),
    styles: copy(env.state.styles),
    images: [...env.state.images.keys()],
  };
  const refused = await env.call(
    'buildMangroveComponents',
    d,
    'undrr',
    selected
  );
  assert(refused.errors.some(e => e.includes('unavailable')));
  assert.equal(refused.createdNodeIds.length, 0);
  assert.deepStrictEqual(
    {
      scene: photoSnapshot(env),
      styles: copy(env.state.styles),
      images: [...env.state.images.keys()],
    },
    before
  );
  console.log(
    'Photo dependency/effect/type/style/source hash caller-preservation and missing-font premutation refusals pass'
  );
}

if (require.main === module)
  main()
    .then(hydratedMain)
    .then(sourceBoundaryChecks)
    .then(photoMain)
    .catch(e => {
      console.error(e);
      process.exitCode = 1;
    });
module.exports = {
  document,
  hydratedDocument,
  sourceBoundaryChecks,
  photoDocument,
  photoMain,
  installScrollPhotoSvgFixture,
};
