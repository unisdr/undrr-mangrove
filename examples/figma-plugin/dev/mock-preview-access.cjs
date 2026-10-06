#!/usr/bin/env node
/** Actual bounded source/builder checks. No native caret, unlock or rendering claim. */
'use strict';
const fs = require('fs'),
  path = require('path'),
  assert = require('assert');
const root = path.resolve(__dirname, '../../..');
const recipes = require('../../../scripts/figma-preview-access-recipes.cjs');
const { rangeEnvironment } = require('./mock-rich-text-integration.cjs');
const {
  installNativeTextPropertyDefaultFixture,
} = require('./mock-search-results.cjs');
const copy = x => JSON.parse(JSON.stringify(x));
const walk = n => [n, ...(n.children || []).flatMap(walk)];
const identity = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
function document() {
  const d = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
  );
  d.components.families = recipes.buildPreviewAccessRecipes({ root, ...d });
  return d;
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
function master(n) {
  for (let p = n.parent; p; p = p.parent)
    if (p.type === 'INSTANCE') return false;
  return true;
}
async function main() {
  const d = document(),
    source = recipes.inspectPreviewAccessSource({ root }).source;
  assert.deepStrictEqual(document(), d);
  assert.deepStrictEqual(
    d.components.families.map(f => [f.id, f.variants.length]),
    [
      ['preview-access-static', 4],
      ['preview-access-live', 6],
    ]
  );
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
    const ids = d.components.families.map(f => f.id);
    const built = await env.call('buildMangroveComponents', d, mode.id, ids);
    assert.deepStrictEqual(copy(built.errors), []);
    assert(built.createdNodeIds.length);
    function actual(f, v, s) {
      return [...env.state.nodes.values()].find(
        n =>
          master(n) &&
          (s === v.tree
            ? identity(n) === 'family/' + f.id + '/variant/' + v.id
            : identity(n).includes('/variant/' + v.id + '/') &&
              identity(n).endsWith('/' + s.id))
      );
    }
    function defaults() {
      for (const f of d.components.families)
        for (const v of f.variants)
          for (const t of walk(v.tree).filter(n => n.textProperty)) {
            const n = actual(f, v, t);
            assert(n, t.id);
            assert.equal(n.characters, t.characters);
            assert(n.componentPropertyReferences.characters);
          }
    }
    defaults();
    for (const f of d.components.families)
      for (const v of f.variants) {
        const brand = mode.id === 'mcr' ? 'mcr2030' : mode.id;
        const cap = source.captures.find(
          c =>
            c.file ===
            `${brand}-${v.sourceContract.story}-${v.sourceContract.viewport}-${v.sourceContract.state}.json`
        ).capture;
        for (const s of walk(v.tree)) {
          const n = actual(f, v, s);
          assert(n, s.id);
          if (s.type === 'TEXT')
            assert.equal(
              n.width,
              resolve(s.layout.width, mode.id),
              'Whole logical source capacity'
            );
          if (s.type === 'FRAME') {
            assert.equal(n.width, resolve(s.layout.width, mode.id));
            assert.equal(n.height, resolve(s.layout.height, mode.id));
          }
          if (s.absolute) {
            assert.equal(n.x, resolve(s.absolute.offsetX, mode.id));
            assert.equal(n.y, resolve(s.absolute.offsetY, mode.id));
          }
          if (s.bindings?.opacity)
            assert.equal(n.opacity, resolve(s.bindings.opacity, mode.id) / 100);
          if (s.sourcePreviewNode) {
            const own = cap.nodes.find(k => k.id === s.sourcePreviewNode.id);
            assert(own);
            assert.equal(n.width, own.rect.width);
            assert.equal(n.height, own.rect.height);
            assert.equal(n.opacity, Number(own.style.opacity));
            if (own.tag === 'INPUT') {
              assert.equal(
                n.clipsContent,
                true,
                'Actual input clips value only'
              );
              assert.equal(s.sourcePreviewNode.input.value, own.input.value);
              const text = s.children.find(c => c.type === 'TEXT');
              assert.equal(actual(f, v, text).characters, own.input.value);
              if (own.focused) {
                const ring = walk(v.tree).find(
                  x => x.id === s.id + '-focus-ring'
                );
                assert(ring);
                const nativeRing = actual(f, v, ring);
                assert.equal(
                  nativeRing.parent,
                  n.parent,
                  'Outline is not clipped inside INPUT'
                );
                assert.equal(
                  nativeRing.width,
                  n.width + 2 * resolve('focus-ring/offset', mode.id)
                );
                assert.equal(nativeRing.fills[0].opacity, 0);
                assert.equal(n.effects[0].spread, 2);
                assert.deepStrictEqual(copy(n.effects[0].offset), {
                  x: 0,
                  y: 0,
                });
                assert.equal(n.effects[0].radius, 0);
                assert.equal(n.effects[0].color.a, 1);
              }
            }
            for (const t of s.children.filter(c => c.type === 'TEXT')) {
              const sty = d.styles.text.find(
                x => x.id === (t.textStyle || t.textRuns[0].textStyle)
              ).values[mode.id];
              assert.equal(sty.fontSize, parseFloat(own.style.fontSize));
              assert.equal(
                sty.lineHeight.value,
                parseFloat(own.style.lineHeight)
              );
              if (t.textRuns) {
                assert.equal(t.textRuns.length, 1);
                assert.equal(t.textRuns[0].hyperlink.value, own.href);
                assert.equal(t.textRuns[0].textDecoration, 'UNDERLINE');
              }
            }
          }
        }
      }
    const family = d.components.families[1],
      variant = family.variants.find(
        v =>
          v.sourceContract.viewport === 390 &&
          v.sourceContract.state === 'wrong-pin'
      );
    const owner = actual(family, variant, variant.tree),
      consumer = owner.createInstance();
    env.figma.currentPage.appendChild(consumer);
    const heading = walk(variant.tree).find(n =>
      n.textProperty?.endsWith(' Heading')
    );
    const reference = actual(family, variant, heading)
      .componentPropertyReferences.characters;
    consumer.setProperties({ [reference]: 'Maintained gate heading' });
    const linked = consumer.findAll(
      n =>
        n.type === 'TEXT' &&
        n.componentPropertyReferences?.characters === reference
    )[0];
    assert(linked);
    let p = linked,
      desc;
    while (p && !desc) {
      desc = Object.getOwnPropertyDescriptor(p, 'characters');
      p = Object.getPrototypeOf(p);
    }
    assert(desc?.set);
    Object.defineProperty(linked, 'characters', {
      configurable: true,
      get() {
        return consumer.componentProperties[reference].value;
      },
      set(x) {
        desc.set.call(this, x);
      },
    });
    assert.equal(linked.characters, 'Maintained gate heading');
    const rich = walk(variant.tree).find(n => n.textRuns);
    const linkedRich = consumer.findAll(
      n => n.type === 'TEXT' && identity(n).endsWith('/' + rich.id)
    )[0];
    assert(linkedRich);
    const sourceRich = actual(family, variant, rich);
    env.attachRichText(linkedRich, sourceRich);
    linkedRich.editRich(
      0,
      linkedRich.characters.length,
      'Maintained contact copy'
    );
    const richBefore = copy({
      characters: linkedRich.characters,
      runs: linkedRich.getStyledTextSegments([
        'textStyleId',
        'fills',
        'hyperlink',
        'textDecoration',
      ]),
    });
    let before = snapshot(env);
    for (let i = 0; i < 2; i++) {
      const repeat = await env.call('buildMangroveComponents', d, mode.id, ids);
      assert.deepStrictEqual(copy(repeat.errors), []);
      assert.equal(repeat.createdNodeIds.length, 0);
      assert.deepStrictEqual(snapshot(env), before);
      defaults();
      assert.equal(linked.characters, 'Maintained gate heading');
      assert.deepStrictEqual(
        copy({
          characters: linkedRich.characters,
          runs: linkedRich.getStyledTextSegments([
            'textStyleId',
            'fills',
            'hyperlink',
            'textDecoration',
          ]),
        }),
        richBefore
      );
    }
    console.log(
      `PreviewAccess ${mode.id}: 10 source variants, two exact zero-create repeats and plain/rich consumer edits`
    );
  }
  // All caller changes are staged, and identity/type/kind collisions refuse.
  const bad = document();
  const existing = bad.variables.find(v =>
    v.name.startsWith('component/preview-access')
  );
  existing.type = 'COLOR';
  const before = copy(bad);
  assert.throws(
    () => recipes.buildPreviewAccessRecipes({ root, ...bad }),
    /identity|type|role|Foreign/i
  );
  assert.deepStrictEqual(bad, before);
  const wrong = document();
  const style = wrong.styles.text.find(v =>
    v.id.startsWith('component.preview-access')
  );
  style.values.undrr.fontName = 'foreign';
  const prior = copy(wrong);
  assert.throws(
    () => recipes.buildPreviewAccessRecipes({ root, ...wrong }),
    /Foreign/i
  );
  assert.deepStrictEqual(wrong, prior);
  const missing = document();
  missing.variables = missing.variables.filter(
    v => v.name !== 'focus-ring/width'
  );
  assert.throws(
    () => recipes.buildPreviewAccessRecipes({ root, ...missing }),
    /Missing|foundation/
  );

  // Source files, archived geometry, real font bytes and their licences are pinned.
  const audit = recipes.inspectPreviewAccessSource({ root }).audit;
  const negatives = [
    Object.keys(audit.sourcePins).find(p => p.endsWith('PreviewAccess.jsx')),
    Object.keys(audit.sourcePins).find(p => p.endsWith('.woff2')),
    Object.keys(audit.sourcePins).find(p => /LICEN[CS]E/.test(p)),
    'examples/figma-plugin/holistic/assets/preview-access/source-footprints.json',
  ];
  for (const relative of negatives) {
    assert(relative);
    const read = fs.readFileSync;
    try {
      fs.readFileSync = function (p, ...args) {
        const result = read.call(this, p, ...args);
        return path.resolve(String(p)) === path.join(root, relative)
          ? Buffer.isBuffer(result)
            ? Buffer.concat([result, Buffer.from('drift')])
            : result + 'drift'
          : result;
      };
      const input = JSON.parse(
          read(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
        ),
        unchanged = copy(input);
      assert.throws(
        () => recipes.buildPreviewAccessRecipes({ root, ...input }),
        /drift/i
      );
      assert.deepStrictEqual(input, unchanged);
    } finally {
      fs.readFileSync = read;
    }
  }
  const fontDoc = document(),
    fontEnv = await rangeEnvironment(fontDoc);
  await fontEnv.call('importVariables', fontDoc, ['undrr'], false, [], false);
  const inventory = fontEnv.figma.listAvailableFontsAsync;
  fontEnv.figma.listAvailableFontsAsync = async () =>
    (await inventory()).filter(
      f =>
        !(
          f.fontName.family === 'Roboto Condensed' &&
          f.fontName.style === 'Bold'
        )
    );
  const fontBefore = snapshot(fontEnv),
    styleIds = fontEnv.state.styles.map(s => s.id);
  const refused = await fontEnv.call(
    'buildMangroveComponents',
    fontDoc,
    'undrr',
    fontDoc.components.families.map(f => f.id)
  );
  assert(refused.errors.some(x => /font/i.test(x)));
  assert.equal(refused.createdNodeIds.length, 0);
  assert.deepStrictEqual(snapshot(fontEnv), fontBefore);
  assert.deepStrictEqual(
    fontEnv.state.styles.map(s => s.id),
    styleIds
  );

  const legacy = document();
  legacy.components.families = legacy.components.families.slice(0, 1);
  for (const v of legacy.components.families[0].variants)
    for (const t of walk(v.tree))
      if (t.textProperty?.endsWith(' Heading')) t.textProperty = 'Heading';
  const oldEnv = await rangeEnvironment(legacy);
  installNativeTextPropertyDefaultFixture(oldEnv);
  await oldEnv.call('importVariables', legacy, ['undrr'], false, [], false);
  const oldBuild = await oldEnv.call(
    'buildMangroveComponents',
    legacy,
    'undrr',
    ['preview-access-static']
  );
  assert.deepStrictEqual(copy(oldBuild.errors), []);
  const oldRepeat = await oldEnv.call(
    'buildMangroveComponents',
    legacy,
    'undrr',
    ['preview-access-static']
  );
  assert.deepStrictEqual(copy(oldRepeat.errors), []);
  assert.equal(oldRepeat.createdNodeIds.length, 0);
  const oldDefault = legacy.components.families[0].variants[0];
  const headingSpec = walk(oldDefault.tree).find(
    n => n.textProperty === 'Heading'
  );
  const oldHeading = [...oldEnv.state.nodes.values()].find(
    n =>
      master(n) &&
      identity(n).includes('/variant/' + oldDefault.id + '/') &&
      identity(n).endsWith('/' + headingSpec.id)
  );
  assert(oldHeading);
  assert.notEqual(
    oldHeading.characters,
    headingSpec.characters,
    'Observed shared default fixture must reproduce unscoped heading corruption'
  );
  console.log(
    'PreviewAccess source/font/identity/type/style-shape refusals and deliberate legacy-default corruption proof pass'
  );
}
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { document, snapshot, main };
