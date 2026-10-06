#!/usr/bin/env node
/** Actual-builder page reading contracts. Mock repetition does not establish native pixels. */
'use strict';
const assert = require('assert'),
  fs = require('fs'),
  path = require('path');
const { rangeEnvironment } = require('./mock-rich-text-integration.cjs');
const {
  buildPageReadingRecipes,
} = require('../../../scripts/figma-page-reading-recipes.cjs');
const root = path.resolve(__dirname, '../../..'),
  copy = x => JSON.parse(JSON.stringify(x)),
  identity = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
function document() {
  const d = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
  );
  d.components.families = buildPageReadingRecipes({ root, ...d });
  return d;
}
const walk = n => [n, ...(n.children || []).flatMap(walk)];

// Native-observed setter propagation is modeled separately from rich formatting.
const {
  installNativeTextPropertyDefaultFixture,
} = require('./mock-search-results.cjs');
const sourceWalk = n => [n, ...(n.children || []).flatMap(sourceWalk)];
function assertSourceDefaults(env, families) {
  for (const family of families)
    for (const variant of family.variants)
      for (const spec of sourceWalk(variant.tree).filter(n => n.textProperty)) {
        const matches = [...env.state.nodes.values()].filter(n => {
          if (
            n.type !== 'TEXT' ||
            !identity(n).includes('/variant/' + variant.id + '/') ||
            !identity(n).endsWith('/' + spec.id)
          )
            return false;
          for (let p = n.parent; p; p = p.parent)
            if (p.type === 'INSTANCE') return false;
          return true;
        });
        assert.strictEqual(matches.length, 1, variant.id + '/' + spec.id);
        const node = matches[0],
          reference = node.componentPropertyReferences.characters;
        assert.strictEqual(
          node.characters,
          spec.characters,
          variant.id + '/' + spec.id + ' source copy'
        );
        let owner = node.parent;
        while (owner && owner.type !== 'COMPONENT_SET') owner = owner.parent;
        assert(owner && reference);
        assert.strictEqual(
          owner.componentPropertyDefinitions[reference].defaultValue,
          spec.characters,
          variant.id + '/' + spec.id + ' default'
        );
      }
}
function editReferencedText(instance) {
  const fields = sourceWalk(instance).filter(
      n =>
        n.type === 'TEXT' &&
        n.componentPropertyReferences?.characters &&
        Object.hasOwn(
          instance.componentProperties,
          n.componentPropertyReferences.characters
        )
    ),
    keys = [
      ...new Set(fields.map(n => n.componentPropertyReferences.characters)),
    ];
  for (const node of fields) {
    const original = Object.getOwnPropertyDescriptor(node, 'characters'),
      reference = node.componentPropertyReferences.characters;
    Object.defineProperty(node, 'characters', {
      configurable: true,
      get() {
        return (
          instance.componentProperties[reference]?.value ??
          original.get.call(this)
        );
      },
      set(value) {
        original.set.call(this, value);
      },
    });
  }
  for (const key of keys)
    instance.setProperties({ [key]: `Edited ${key.replace(/#[^#]+$/, '')}` });
  return keys;
}
function assertDisplayedEdits(instance, keys) {
  for (const node of sourceWalk(instance).filter(
    n =>
      n.type === 'TEXT' &&
      keys.includes(n.componentPropertyReferences?.characters)
  ))
    assert.strictEqual(
      node.characters,
      `Edited ${node.componentPropertyReferences.characters.replace(/#[^#]+$/, '')}`
    );
}
function defaultSnapshot(env) {
  return [...env.state.nodes.values()]
    .filter(n => n.type === 'COMPONENT_SET')
    .map(n => [n.id, copy(n.componentPropertyDefinitions)]);
}

async function main() {
  const d = document(),
    ids = d.components.families.map(f => f.id),
    assets = copy({ variables: d.variables, styles: d.styles });
  assert.deepStrictEqual(
    d.components.families.map(f => f.variants.length),
    [4, 12]
  );
  assert.deepStrictEqual(
    buildPageReadingRecipes({ root, ...d }),
    d.components.families
  );
  assert.deepStrictEqual(
    copy({ variables: d.variables, styles: d.styles }),
    assets
  );
  for (const m of d.modes) {
    const env = await rangeEnvironment(d);
    installNativeTextPropertyDefaultFixture(env);
    assert.deepStrictEqual(
      copy(
        (await env.call('importVariables', d, [m.id], false, [], true)).errors
      ),
      []
    );
    const first = await env.call('buildMangroveComponents', d, m.id, ids);
    assert.deepStrictEqual(copy(first.errors), []);
    assertSourceDefaults(env, d.components.families);
    const instances = [],
      rich = [];
    for (const report of first.families)
      for (const entry of report.variantIds) {
        const master = env.state.nodes.get(entry.nodeId),
          spec = d.components.families
            .find(f => f.id === report.id)
            .variants.find(v => v.id === entry.id),
          width = d.variables.find(x => x.name === spec.tree.layout.width)
            .values[m.id];
        assert.strictEqual(master.width, width);
        if (report.id === 'page-bulleted-toc') {
          const markers = walk(master).filter(n => n.type === 'ELLIPSE');
          assert.strictEqual(
            markers.length,
            spec.properties.Page === 'report' ? 4 : 3
          );
          for (const marker of markers) {
            assert.strictEqual(marker.layoutPositioning, 'ABSOLUTE');
            assert.strictEqual(marker.constraints.horizontal, 'MIN');
            assert.strictEqual(marker.constraints.vertical, 'MIN');
            assert(Math.abs(marker.width - 16 / 3) < 1e-12);
            assert(Math.abs(marker.x - (-17 - 1 / 3)) < 1e-12);
            assert(Math.abs(marker.y - (10 + 5 / 6)) < 1e-12);
          }
          assert.strictEqual(master.paddingLeft, 20);
          assert.strictEqual(master.strokeLeftWeight, 2);
          assert.strictEqual(master.children[1].itemSpacing, 5);
        } else {
          const mark = walk(master).find(n =>
            identity(n).endsWith('/opening-mark')
          );
          assert(mark);
          assert.strictEqual(mark.type, 'TEXT');
          assert.strictEqual(mark.characters, '“');
          assert.strictEqual(mark.fontName.family, 'Roboto');
          assert.strictEqual(mark.fontName.style, 'Bold Italic');
          assert.strictEqual(mark.fontSize, 48);
          assert.strictEqual(mark.layoutPositioning, 'ABSOLUTE');
          assert.strictEqual(mark.x, 0);
          assert.strictEqual(mark.y, -10);
          assert.strictEqual(mark.width, 19.125);
          assert.strictEqual(mark.opacity, 0.5);
          const page = spec.properties.Preset === 'article-quote',
            narrow = spec.properties.SourceViewport === '390';
          assert.strictEqual(mark.height, page ? (narrow ? 55.68 : 55.2) : 72);
          assert.strictEqual(master.paddingTop, narrow ? 50 : 60);
          assert.strictEqual(master.paddingLeft, narrow ? 50 : 60);
          if (page) {
            const body = walk(master).find(n =>
              identity(n).endsWith('/quote-text')
            );
            assert.strictEqual(body.fontSize, narrow ? 32 : 40);
            assert.strictEqual(body.lineHeight.value, narrow ? 116 : 115);
          }
        }
        const instance = master.createInstance();
        instance.x = 181;
        instance.y = 307;
        const keys = editReferencedText(instance);
        instances.push({ instance, keys });
        if (spec.properties.Preset === 'source-tested-rich-bright') {
          const all = walk(master).filter(
            n =>
              n.type === 'TEXT' &&
              ['quote-text', 'attribution-name', 'attribution-title'].some(id =>
                identity(n).endsWith('/' + id)
              )
          );
          assert.strictEqual(all.length, 3);
          for (const text of all) {
            const c = env.attachRichText(
              walk(instance).find(
                n => n.type === 'TEXT' && n.characters === text.characters
              ),
              text
            );
            for (const n of [text, c]) {
              const spans = n.getStyledTextSegments([
                'textStyleId',
                'hyperlink',
              ]);
              const run = spans.find(x => x.hyperlink) || spans[0];
              n.editRich(run.start, Math.min(run.end, run.start + 4), 'Edited');
              rich.push(n);
            }
          }
        }
      }
    const owned = () =>
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
      before = owned(),
      rs = () =>
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
      beforeRich = rs();
    const beforeDefaults = defaultSnapshot(env);
    for (let i = 0; i < 2; i++) {
      const again = await env.call('buildMangroveComponents', d, m.id, ids);
      assert.deepStrictEqual(copy(again.errors), []);
      assert.strictEqual(again.createdNodeIds.length, 0);
      assertSourceDefaults(env, d.components.families);
      assert.deepStrictEqual(defaultSnapshot(env), beforeDefaults);
      assert.deepStrictEqual(owned(), before);
      assert.strictEqual(rs(), beforeRich);
      for (const { instance, keys } of instances) {
        assert(!instance.removed);
        assertDisplayedEdits(instance, keys);
        assert.strictEqual(instance.x, 181);
        assert.strictEqual(instance.y, 307);
        for (const key of keys)
          assert.strictEqual(
            instance.componentProperties[key].value,
            `Edited ${key.replace(/#[^#]+$/, '')}`
          );
      }
    }
  }
  // Restore the old component-set names deliberately: the observed setter model
  // must reproduce authored-copy corruption, rather than merely inspect names.
  for (const familyId of ['page-bulleted-toc', 'quote-highlight']) {
    const legacy = document();
    const family = legacy.components.families.find(f => f.id === familyId);
    legacy.components.families = legacy.components.families.filter(
      f => f.id === familyId || f.id === 'editorial-cta'
    );
    for (const variant of family.variants)
      for (const node of sourceWalk(variant.tree))
        if (node.textProperty?.startsWith(familyId + '/'))
          node.textProperty = node.textProperty.split(' ').at(-1);
    const legacyEnv = await rangeEnvironment(legacy);
    installNativeTextPropertyDefaultFixture(legacyEnv);

    assert.deepStrictEqual(
      copy(
        (
          await legacyEnv.call(
            'importVariables',
            legacy,
            ['undrr'],
            false,
            [],
            true
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
              legacy.components.families.map(f => f.id)
            )
          ).errors
        ),
        []
      );
    assert.throws(
      () => assertSourceDefaults(legacyEnv, [family]),
      /source copy|default/
    );
  }
  const read = fs.readFileSync;
  for (const [suffix, from, to] of [
    [
      'table-of-contents.scss',
      'padding-inline-start: var(--mg-spacing-200)',
      'padding-inline-start: var(--mg-spacing-300)',
    ],
    ['quote-highlight.scss', 'font-style: italic', 'font-style: normal'],
    ['blockquote.scss', 'line-height: 1.16', 'line-height: 1.17'],
    ['QuoteHighlight.jsx', 'DOMPurify.sanitize', 'DOMPurify.clean'],
    ['source-footprints.json', 'On this page', 'Invented heading'],
  ]) {
    fs.readFileSync = function (f, ...a) {
      const v = read.call(this, f, ...a);
      if (typeof f === 'string' && f.endsWith(suffix))
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
  const bad = document();
  bad.variables.find(v => v.name === 'component/page-reading/mark-y').name =
    'Foreign owner';
  assert.throws(
    () => buildPageReadingRecipes({ root, ...bad }),
    /Foreign identity/
  );
  const style = document();
  style.styles.text.find(x => x.id === 'component.page-reading.mark').name =
    'Foreign owner';
  assert.throws(
    () => buildPageReadingRecipes({ root, ...style }),
    /Foreign identity/
  );
  const env = await rangeEnvironment(d, {
    rejectedFonts: ['Roboto Bold Italic'],
  });
  assert.strictEqual(
    (await env.call('importVariables', d, ['undrr'], false, [], true)).errors
      .length,
    0
  );
  const ns = () => [...env.state.nodes.values()].map(n => [n.id, identity(n)]),
    before = ns();
  assert(
    (await env.call('buildMangroveComponents', d, 'undrr', ids)).errors.length
  );
  assert.deepStrictEqual(ns(), before);
  console.log(
    'ok  four exact page TOCs and twelve meaningful source quote presets, all-five actual builder, two zero-create geometry repeats, text properties and formatted rich/consumer edits; source/font/identity refusal. UA circle and native pixels remain open.'
  );
}
module.exports = { document };
if (require.main === module)
  main().catch(e => {
    console.error(e.stack || e);
    process.exitCode = 1;
  });
