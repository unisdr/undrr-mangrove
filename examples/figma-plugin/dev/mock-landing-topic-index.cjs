#!/usr/bin/env node
/** Actual finite authored source/builder checks. SVG fixtures model viewport/paint only. */
'use strict';
const fs = require('fs'),
  path = require('path'),
  assert = require('assert');
const root = path.resolve(__dirname, '../../..');
const recipes = require('../../../scripts/figma-landing-topic-index-recipes.cjs');
const {
  buildPageChromeRecipes,
} = require('../../../scripts/figma-page-chrome-recipes.cjs');
const { rangeEnvironment } = require('./mock-rich-text-integration.cjs');
const {
  installNativeTextPropertyDefaultFixture,
} = require('./mock-search-results.cjs');
const { installPageChromeSvgFixture } = require('./mock-page-chrome.cjs');
const { installCardContentSvgFixture } = require('./mock-card-content.cjs');
const copy = x => JSON.parse(JSON.stringify(x));
const walk = n => [n, ...(n.children || []).flatMap(walk)];
const identity = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
function original() {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
  );
}
function document() {
  const d = original(),
    button = copy(d.components.families.find(f => f.id === 'button'));
  button.id = 'page-chrome-button';
  button.name = 'Mangrove source / Exact Button';
  for (const v of button.variants) {
    v.id = v.id.replace(/^button\./, 'page-chrome-button.');
    v.name = v.name.replace(/^Button/, 'Page chrome Button');
  }
  if (button.defaultVariant)
    button.defaultVariant = button.defaultVariant.replace(
      /^button\./,
      'page-chrome-button.'
    );
  const chrome = buildPageChromeRecipes({ root, ...d });
  const families = recipes.buildLandingTopicIndexRecipes({ root, ...d });
  d.components.families = [button, ...chrome, ...families];
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
        n.parent?.id,
        n.type,
        identity(n),
        n.x,
        n.y,
        n.width,
        n.height,
        n.opacity,
        n.clipsContent,
        n.layoutMode,
        n.characters,
        n.boundVariables,
        n.fills,
        n.strokes,
        n.effects,
        n.componentPropertyReferences,
        n.type === 'INSTANCE' ? n.componentProperties : null,
        n.explicitVariableModes,
      ])
      .sort((a, b) => a[0].localeCompare(b[0]))
  );
}
function installLandingSvgFixture(env, families) {
  installPageChromeSvgFixture(env, families);
  installCardContentSvgFixture(
    env,
    families.filter(f => f.id.startsWith('landing-'))
  );
}
async function main() {
  const d = document(),
    source = recipes.inspectLandingTopicIndexSource({ root }).source,
    families = d.components.families.filter(f => f.id.startsWith('landing-'));
  assert.deepStrictEqual(document(), d);
  assert.equal(families.length, 8);
  assert.equal(
    families.reduce((n, f) => n + f.variants.length, 0),
    50
  );
  const before = copy({ variables: d.variables, styles: d.styles });
  assert.deepStrictEqual(
    recipes.buildLandingTopicIndexRecipes({ root, ...d }),
    families
  );
  assert.deepStrictEqual(
    copy({ variables: d.variables, styles: d.styles }),
    before
  );
  const resolve = (name, mode) => {
    const v = d.variables.find(v => v.name === name);
    assert(v, name);
    const value = v.values[mode];
    return value?.alias ? resolve(value.alias, mode) : value;
  };
  const capturedPaints = d.variables.filter(
    v => v.name.startsWith('component/landing-') && v.type === 'COLOR'
  );
  assert.equal(capturedPaints.length, 530);
  for (const role of capturedPaints)
    for (const mode of d.modes) {
      const paint = role.values[mode.id];
      assert.deepStrictEqual(Object.keys(paint).sort(), ['a', 'b', 'g', 'r']);
      assert(
        Object.values(paint).every(n => Number.isFinite(n) && n >= 0 && n <= 1)
      );
      assert(
        !('alias' in paint),
        'Computed RGBA equality cannot establish public token identity'
      );
    }
  const rgba = raw => {
    const values = /^rgba?\(([^)]+)\)$/.exec(raw)[1].split(',').map(Number);
    return {
      r: values[0] / 255,
      g: values[1] / 255,
      b: values[2] / 255,
      a: values[3] ?? 1,
    };
  };
  const ids = d.components.families.map(f => f.id);
  for (const mode of d.modes) {
    const env = await rangeEnvironment(d, { richDecorationOffsets: true });
    installNativeTextPropertyDefaultFixture(env);
    installLandingSvgFixture(env, d.components.families);
    const imported = await env.call(
      'importVariables',
      d,
      [mode.id],
      false,
      [],
      false
    );
    assert.deepStrictEqual(copy(imported.errors), []);
    const built = await env.call('buildMangroveComponents', d, mode.id, ids);
    assert.deepStrictEqual(copy(built.errors), []);
    assert(built.createdNodeIds.length);
    const actual = (f, v, s) =>
      [...env.state.nodes.values()].find(
        n =>
          master(n) &&
          (s === v.tree
            ? identity(n) === 'family/' + f.id + '/variant/' + v.id
            : identity(n).includes('/variant/' + v.id + '/') &&
              identity(n).endsWith('/' + s.id))
      );
    function defaults() {
      for (const f of families)
        for (const v of f.variants)
          for (const s of walk(v.tree).filter(n => n.textProperty)) {
            const n = actual(f, v, s);
            assert(n, s.id);
            assert.equal(n.characters, s.characters);
            assert(n.componentPropertyReferences.characters);
          }
    }
    defaults();
    for (const f of families)
      for (const v of f.variants) {
        const c = source.captures.find(
          c =>
            c.file ===
            `${mode.id === 'mcr' ? 'mcr2030' : mode.id}-${v.sourceContract.archetype}-${v.sourceContract.viewport}.json`
        ).capture;
        for (const s of walk(v.tree)) {
          const n = actual(f, v, s);
          assert(n, s.id);
          if (
            s.type === 'FRAME' ||
            (s.type === 'INSTANCE' && s.layout.width !== 'FILL')
          ) {
            assert.equal(
              n.width,
              typeof s.layout.width === 'number'
                ? s.layout.width
                : resolve(s.layout.width, mode.id)
            );
            assert.equal(
              n.height,
              typeof s.layout.height === 'number'
                ? s.layout.height
                : resolve(s.layout.height, mode.id)
            );
          }
          if (s.absolute) {
            assert.equal(n.x, resolve(s.absolute.offsetX, mode.id));
            assert.equal(n.y, resolve(s.absolute.offsetY, mode.id));
          }
          if (s.type === 'TEXT')
            assert.equal(
              n.layoutSizingHorizontal,
              'FILL',
              'Whole logical capacity follows owning flow frame'
            );
          if (s.bindings?.opacity)
            assert.equal(n.opacity, resolve(s.bindings.opacity, mode.id) / 100);
          if (s.sourceLandingNode) {
            const own = c.nodes.find(k => k.id === s.sourceLandingNode.id);
            assert(own);
            assert.equal(n.width, own.rect.width);
            assert.equal(n.height, own.rect.height);
            if (s.type !== 'INSTANCE')
              assert.equal(n.opacity, Number(own.style.opacity));
            if (s.type === 'FRAME' && typeof s.fill === 'string')
              assert.deepStrictEqual(
                resolve(s.fill, mode.id),
                rgba(own.style.backgroundColor),
                'Owning captured source background paint'
              );
          }
          for (const [sourceField, nativeField] of [
            ['fill', 'fills'],
            ['stroke', 'strokes'],
          ])
            if (typeof s[sourceField] === 'string' && !s.textRuns) {
              const expected = resolve(s[sourceField], mode.id),
                paint = n[nativeField].find(p => p.type === 'SOLID');
              assert(paint, s.id + '/' + sourceField);
              assert.deepStrictEqual(copy(paint.color), {
                r: expected.r,
                g: expected.g,
                b: expected.b,
              });
              assert.equal(paint.opacity, expected.a ?? 1);
              assert.equal(
                paint.boundVariables.color.id,
                env.state.variables.find(v => v.name === s[sourceField]).id
              );
            }
          if (s.sourcePseudo && s.sourcePseudo.pseudo !== 'own-gradient') {
            const p = c.pseudoDiagnostic.diagnostics.find(
              p =>
                p.ownerId === s.sourcePseudo.ownerId &&
                p.pseudo === s.sourcePseudo.pseudo
            );
            assert(p);
            assert.equal(n.width, p.rect.width);
            assert.equal(n.height, p.rect.height);
            assert.deepStrictEqual(p.sourceFragments, p.mirroredFragments);
          }
          if (s.sourceImage) {
            assert.equal(
              s.sourceImage.sha256,
              '99974686a4568ec28531c06344c4c79d19db52d0da2df1c27d05f19825690449'
            );
            assert(
              n.fills.some(p => p.type === 'IMAGE' && p.scaleMode === 'FILL')
            );
          }
          if (s.textRuns) {
            assert.equal(s.textRuns.length, 1);
            assert.equal(n.characters, s.characters);
            const ranges = n.getStyledTextSegments([
              'hyperlink',
              'textDecorationOffset',
            ]);
            assert(
              ranges.every(
                r => r.hyperlink?.value === s.textRuns[0].hyperlink.value
              )
            );
            if (s.textRuns[0].textDecorationOffset)
              assert(
                ranges.every(
                  r =>
                    r.textDecorationOffset?.value ===
                    Math.fround(s.textRuns[0].textDecorationOffset.value)
                )
              );
          }
          if (s.type === 'INSTANCE') {
            assert.equal(
              identity(await n.getMainComponentAsync()).split('/')[1],
              s.family
            );
          }
        }
      }
    // The full scenes contain genuine reusable components, including all9 books.
    for (const f of families.filter(f => f.id.endsWith('-page')))
      for (const v of f.variants) {
        const instances = walk(v.tree).filter(n => n.type === 'INSTANCE');
        assert(instances.some(n => n.family === 'page-chrome'));
        if (f.id === 'landing-index-page')
          assert.equal(
            instances.filter(n => n.family === 'landing-index-book-card')
              .length,
            9
          );
        else
          assert.equal(
            instances.filter(n => n.family === 'landing-topic-icon-card')
              .length,
            7
          );
      }
    const f = families.find(f => f.id === 'landing-topic-related-card'),
      v = f.variants.find(
        v =>
          v.properties.Preset === 'Related1' &&
          v.properties.SourceViewport === '390'
      ),
      mainNode = actual(f, v, v.tree),
      consumer = mainNode.createInstance();
    env.figma.currentPage.appendChild(consumer);
    const summary = walk(v.tree).find(n => n.textProperty),
      reference = actual(f, v, summary).componentPropertyReferences.characters;
    consumer.setProperties({ [reference]: 'Maintained related summary' });
    const linked = consumer.findAll(
      n =>
        n.type === 'TEXT' &&
        n.componentPropertyReferences?.characters === reference
    )[0];
    assert(linked);
    let p = linked,
      descriptor;
    while (p && !descriptor) {
      descriptor = Object.getOwnPropertyDescriptor(p, 'characters');
      p = Object.getPrototypeOf(p);
    }
    assert(descriptor?.set);
    Object.defineProperty(linked, 'characters', {
      configurable: true,
      get() {
        return consumer.componentProperties[reference].value;
      },
      set(x) {
        descriptor.set.call(this, x);
      },
    });
    const richSpec = walk(v.tree).find(n => n.textRuns),
      sourceRich = actual(f, v, richSpec),
      richClone = consumer.findAll(
        n => n.type === 'TEXT' && identity(n) === identity(sourceRich)
      )[0];
    assert(richClone);
    const rich = env.attachRichText(richClone, sourceRich);
    rich.editRich(0, rich.characters.length, 'Maintained related title');
    const richBefore = copy({
      characters: rich.characters,
      ranges: rich.getStyledTextSegments([
        'hyperlink',
        'textDecoration',
        'textDecorationOffset',
        'fills',
        'textStyleId',
      ]),
    });
    const prior = snapshot(env),
      images = [...env.state.images].map(([k, b]) => [k, b.toString('base64')]);
    for (let repeat = 0; repeat < 2; repeat++) {
      const report = await env.call('buildMangroveComponents', d, mode.id, ids);
      assert.deepStrictEqual(copy(report.errors), []);
      assert.equal(report.createdNodeIds.length, 0);
      assert.deepStrictEqual(snapshot(env), prior);
      assert.deepStrictEqual(
        [...env.state.images].map(([k, b]) => [k, b.toString('base64')]),
        images
      );
      defaults();
      assert.equal(linked.characters, 'Maintained related summary');
      assert.deepStrictEqual(
        copy({
          characters: rich.characters,
          ranges: rich.getStyledTextSegments([
            'hyperlink',
            'textDecoration',
            'textDecorationOffset',
            'fills',
            'textStyleId',
          ]),
        }),
        richBefore
      );
    }
    console.log(
      `Landing Topic/Index ${mode.id}: 8families/50 presets, complete nested scenes, two exact zero-create repeats and plain/rich consumer edits`
    );
  }
  await negatives();
  console.log(
    'Bounded source scenes only; native pixels, arbitrary reflow, RTL, navigation and publication remain open.'
  );
}
async function negatives() {
  for (const mutate of [
    d => {
      d.variables.find(v => v.name.startsWith('component/landing-')).type =
        'COLOR';
    },
    d => {
      d.styles.text.find(v =>
        v.id.startsWith('component.landing-')
      ).values.undrr.fontName = 'foreign';
    },
    d => {
      d.styles.text.find(v =>
        v.id.startsWith('component.landing-')
      ).values.undrr = [];
    },
    d => {
      const st = d.styles.text.find(v => v.id.startsWith('component.landing-'));
      d.styles.effect.push(copy(st));
    },
    d => {
      d.variables = d.variables.filter(v => v.name !== 'font-size/button');
    },
  ]) {
    const d = document();
    mutate(d);
    const before = copy(d);
    assert.throws(
      () => recipes.buildLandingTopicIndexRecipes({ root, ...d }),
      /Foreign|foundation|Missing|role/i
    );
    assert.deepStrictEqual(d, before);
  }
  const { audit } = recipes.inspectLandingTopicIndexSource({ root });
  const pins = [
    Object.keys(audit.sourcePins).find(p => p.endsWith('LandingPages.jsx')),
    Object.keys(audit.sourcePins).find(p => p.endsWith('.woff2')),
    Object.keys(audit.sourcePins).find(p => /LICEN[CS]E/.test(p)),
    Object.keys(audit.sourcePins).find(p =>
      p.endsWith('resilient-infrastructure.jpg')
    ),
    'examples/figma-plugin/holistic/assets/landing-topic-index/source-footprints.json',
    'examples/figma-plugin/holistic/assets/landing-topic-index/source-pseudo-mirror.js',
  ];
  for (const relative of pins) {
    assert(relative);
    const read = fs.readFileSync;
    try {
      fs.readFileSync = function (p, ...args) {
        const b = read.call(this, p, ...args);
        return path.resolve(String(p)) === path.join(root, relative)
          ? Buffer.isBuffer(b)
            ? Buffer.concat([b, Buffer.from('drift')])
            : b + 'drift'
          : b;
      };
      const d = original(),
        before = copy(d);
      assert.throws(
        () => recipes.buildLandingTopicIndexRecipes({ root, ...d }),
        /drift/i
      );
      assert.deepStrictEqual(d, before);
    } finally {
      fs.readFileSync = read;
    }
  }
  const d = document(),
    env = await rangeEnvironment(d, { richDecorationOffsets: true });
  installLandingSvgFixture(env, d.components.families);
  await env.call('importVariables', d, ['undrr'], false, [], false);
  const inventory = env.figma.listAvailableFontsAsync;
  env.figma.listAvailableFontsAsync = async () =>
    (await inventory()).filter(
      f =>
        !(
          f.fontName.family === 'Roboto Condensed' &&
          f.fontName.style === 'Bold'
        )
    );
  const before = snapshot(env),
    styles = env.state.styles.map(s => s.id);
  const refused = await env.call(
    'buildMangroveComponents',
    d,
    'undrr',
    d.components.families.map(f => f.id)
  );
  assert(refused.errors.some(e => /font/i.test(e)));
  assert.equal(refused.createdNodeIds.length, 0);
  assert.deepStrictEqual(snapshot(env), before);
  assert.deepStrictEqual(
    env.state.styles.map(s => s.id),
    styles
  );
  console.log(
    'Landing source/font/photo/licence/evidence and staged identity/kind/foundation refusal checks pass.'
  );
}
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { document, main, installLandingSvgFixture };
