#!/usr/bin/env node
/** Actual-builder tests for bounded source page content, not full page or native acceptance. */
'use strict';
const assert = require('assert'),
  fs = require('fs'),
  path = require('path');
const { rangeEnvironment } = require('./mock-rich-text-integration.cjs');
const {
  buildPagePatternRecipes,
} = require('../../../scripts/figma-page-pattern-recipes.cjs');
const root = path.resolve(__dirname, '../../..'),
  copy = x => JSON.parse(JSON.stringify(x)),
  identity = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
function document() {
  const d = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
  );
  d.components.families = buildPagePatternRecipes({ root, ...d });
  return d;
}
function walk(n) {
  return [n, ...(n.children || []).flatMap(walk)];
}
async function main() {
  const doc = document(),
    ids = doc.components.families.map(f => f.id),
    assets = copy({ variables: doc.variables, styles: doc.styles });
  assert.deepStrictEqual(
    buildPagePatternRecipes({ root, ...doc }),
    doc.components.families
  );
  assert.deepStrictEqual(
    copy({ variables: doc.variables, styles: doc.styles }),
    assets
  );
  assert.deepStrictEqual(
    doc.components.families.map(f => f.variants.length),
    [2, 2]
  );
  for (const mode of doc.modes) {
    const env = await rangeEnvironment(doc);
    const imported = await env.call(
      'importVariables',
      doc,
      [mode.id],
      false,
      [],
      true
    );
    assert.deepStrictEqual(copy(imported.errors), []);
    const first = await env.call('buildMangroveComponents', doc, mode.id, ids);
    assert.deepStrictEqual(copy(first.errors), []);
    const consumers = [],
      rich = [];
    for (const report of first.families)
      for (const v of report.variantIds) {
        const master = env.state.nodes.get(v.nodeId),
          narrow = v.id.endsWith('390'),
          isReport = report.id === ids[0];
        assert.strictEqual(
          master.width,
          isReport
            ? narrow
              ? mode.id === 'undrr'
                ? 350
                : 370
              : 736
            : narrow
              ? mode.id === 'undrr'
                ? 330
                : 350
              : 722
        );
        assert.strictEqual(master.children.length, isReport ? 4 : 3);
        assert.strictEqual(master.paddingTop, 10);
        assert.strictEqual(master.paddingBottom, 30);
        assert.strictEqual(master.itemSpacing, 30);
        for (const section of master.children) {
          assert.strictEqual(section.itemSpacing, 10);
          assert.strictEqual(section.children[0].fontName.family, 'Roboto');
          assert.strictEqual(section.children[0].fontName.style, 'Bold');
          assert.strictEqual(section.children[0].lineHeight.value, 110);
          assert.strictEqual(section.children[1].itemSpacing, 16);
        }

        const instance = master.createInstance();
        instance.x = 117;
        instance.y = 249;
        const keys = Object.keys(instance.componentProperties).filter(
          k => instance.componentProperties[k].type === 'TEXT'
        );
        for (const key of keys)
          instance.setProperties({
            [key]: `Edited ${key.replace(/#[^#]+$/, '')}`,
          });
        consumers.push({ instance, keys });
        const nodes = walk(master).filter(
          n =>
            n.type === 'TEXT' &&
            n.getStyledTextSegments &&
            n.getStyledTextSegments(['hyperlink']).some(r => r.hyperlink)
        );
        assert.strictEqual(nodes.length, isReport ? 1 : 9);
        for (const mainText of nodes) {
          const consumerText = env.attachRichText(
            walk(instance).find(
              n => n.type === 'TEXT' && n.characters === mainText.characters
            ),
            mainText
          );
          for (const n of [mainText, consumerText]) {
            const segment = n
              .getStyledTextSegments(['hyperlink'])
              .find(r => r.hyperlink);
            assert(segment.hyperlink.value.startsWith('https://'));
            n.editRich(
              segment.start,
              segment.end,
              'Edited linked source phrase'
            );
            rich.push(n);
          }
        }
      }
    const snapshots = () =>
        JSON.stringify(
          rich.map(n => [
            n.id,
            n.characters,
            n
              .getStyledTextSegments([
                'textStyleId',
                'fills',
                'hyperlink',
                'textDecoration',
              ])
              .map(r => [
                r.start,
                r.end,
                r.textStyleId,
                r.fills,
                r.hyperlink,
                r.textDecoration,
              ]),
          ])
        ),
      beforeRich = snapshots(),
      owned = () =>
        [...env.state.nodes.values()]
          .filter(n => identity(n))
          .map(n => [
            n.id,
            identity(n),
            n.parent?.id,
            n.x,
            n.y,
            n.width,
            n.height,
          ]),
      beforeOwned = owned();
    for (let i = 0; i < 2; i++) {
      const report = await env.call(
        'buildMangroveComponents',
        doc,
        mode.id,
        ids
      );
      assert.deepStrictEqual(copy(report.errors), []);
      assert.strictEqual(report.createdNodeIds.length, 0);
      assert.deepStrictEqual(owned(), beforeOwned);
      assert.strictEqual(snapshots(), beforeRich);
      for (const { instance, keys } of consumers) {
        assert(!instance.removed);
        assert.strictEqual(instance.x, 117);
        assert.strictEqual(instance.y, 249);
        for (const key of keys)
          assert.strictEqual(
            instance.componentProperties[key].value,
            `Edited ${key.replace(/#[^#]+$/, '')}`
          );
      }
    }
  }
  const read = fs.readFileSync;
  for (const [suffix, from, to] of [
    ['LandingPages.jsx', 'What the report covers', 'Changed report heading'],
    ['ArticleStory.jsx', 'About the consultation', 'Changed news heading'],
    ['page-patterns.scss', '46rem', '47rem'],
    ['grid.scss', '16rem', '17rem'],
    ['_foundational.scss', 'line-height: 1.1', 'line-height: 1.2'],
    ['authored-content.json', 'Read the full', 'Invented full'],
  ]) {
    fs.readFileSync = function (file, ...args) {
      const v = read.call(this, file, ...args);
      if (typeof file === 'string' && file.endsWith(suffix))
        return Buffer.isBuffer(v)
          ? Buffer.from(v.toString().replace(from, to))
          : v.replace(from, to);
      return v;
    };
    try {
      assert.throws(document, /recipe needs updating/);
    } finally {
      fs.readFileSync = read;
    }
  }
  for (const target of ['variables', 'styles']) {
    const foreign = document();
    if (target === 'variables')
      foreign.variables.find(
        v => v.name === 'component/page-pattern/paragraph-margin'
      ).name = 'Foreign owner';
    else
      foreign.styles.text.find(
        v => v.id === 'component.page-pattern.body'
      ).name = 'Foreign owner';
    assert.throws(
      () => buildPagePatternRecipes({ root, ...foreign }),
      /Foreign identity/
    );
  }
  const env = await rangeEnvironment(doc, { rejectedFonts: ['Roboto Bold'] });
  assert.strictEqual(
    (await env.call('importVariables', doc, ['undrr'], false, [], true)).errors
      .length,
    0
  );
  const state = () =>
      [...env.state.nodes.values()].map(n => [
        n.id,
        identity(n),
        n.parent?.id,
        n.x,
        n.y,
        n.width,
        n.height,
      ]),
    before = state();
  const refused = await env.call('buildMangroveComponents', doc, 'undrr', ids);
  assert(refused.errors.length);
  assert.deepStrictEqual(state(), before);
  console.log(
    'ok  four authored page-content slices, all five brands, two zero-create repeats, supported heading/plain-text properties and formatted source/consumer rich edits; source/cascade/fixture drift, foreign identities and missing fonts refuse. Full pages and native gates remain open.'
  );
}
module.exports = { document };
if (require.main === module)
  main().catch(e => {
    console.error(e.stack || e);
    process.exitCode = 1;
  });
