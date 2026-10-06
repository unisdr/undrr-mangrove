#!/usr/bin/env node
'use strict';
const fs = require('fs'),
  path = require('path'),
  assert = require('assert');
const root = path.resolve(__dirname, '../../..');
const {
  buildStatsCardRecipes,
} = require('../../../scripts/figma-stats-card-recipes.cjs');
const { rangeEnvironment } = require('./mock-rich-text-integration.cjs');
const {
  installNativeTextPropertyDefaultFixture,
} = require('./mock-search-results.cjs');
const { installTextCaseFixture } = require('./mock-text-case.cjs');
const copy = x => JSON.parse(JSON.stringify(x));
const walk = n => [n, ...(n.children || []).flatMap(walk)];
const identity = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
function document() {
  const d = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'))
  );
  d.components.families = buildStatsCardRecipes({ root, ...d });
  return d;
}
async function installStatsCardSvgFixture(env, families) {
  const exact = new Map(
    families
      .flatMap(f => f.variants.flatMap(v => walk(v.tree)))
      .filter(n => n.svg)
      .map(n => [n.svg.assetId, n.svg])
  );
  const previous = env.figma.createNodeFromSvg.bind(env.figma);
  env.figma.createNodeFromSvg = markup => {
    const clean = s => s.replace(/\s+(?:width|height)="[^"]*"/g, '');
    const svg = [...exact.values()].find(
      s => clean(s.markup) === clean(markup)
    );
    if (!svg) return previous(markup);
    const source = svg.markup;
    const box = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(source);
    assert(box);
    const f = env.figma.createFrame();
    f.resize(+box[1], +box[2]);
    const paths = [...source.matchAll(/<path\b[^>]*\bd="([^"]+)"/g)].map(
      m => m[1]
    );
    // Exact source path/shape viewports use a precisely whitelisted source viewport
    // and paint fixture. No contour, antialiasing or native SVG import inference.
    for (const data of paths.length ? paths : ['M0 0']) {
      const v = env.figma.createVector();
      v.resize(+box[1], +box[2]);
      v.vectorPaths = [{ windingRule: 'NONZERO', data }];
      const outlined = !!svg.monochrome?.strokes;
      v.fills = !svg.monochrome?.fills
        ? []
        : [
            {
              type: 'SOLID',
              color: { r: 0, g: 0, b: 0 },
              opacity: 1,
              visible: true,
            },
          ];
      v.strokes = outlined
        ? [
            {
              type: 'SOLID',
              color: { r: 0, g: 0, b: 0 },
              opacity: 1,
              visible: true,
            },
          ]
        : [];
      v.strokeWeight = outlined ? 2 : 1;
      v.strokeAlign = 'CENTER';
      v.constraints = { horizontal: 'MIN', vertical: 'MIN' };
      f.appendChild(v);
    }
    f.rescale = scale => {
      f.resizeWithoutConstraints(f.width * scale, f.height * scale);
      for (const v of f.children) {
        v.resizeWithoutConstraints(v.width * scale, v.height * scale);
        v.strokeWeight *= scale;
      }
    };
    return f;
  };
  await env.runCode(
    fs.readFileSync(path.join(__dirname, '../kit-svg-sizing.js'), 'utf8') +
      '\nObject.assign(globalThis,{mgSvgSizingPlan,mgSvgSizingDocumentValues,mgSvgSizingSourceValues,mgSvgSizingNativeValues,mgSvgSizingNativePlan,mgApplySvgSizing});'
  );
}
async function main() {
  const d = document();
  assert.deepStrictEqual(
    d.components.families.map(f => [f.id, f.variants.length]),
    [
      ['stats-card-item', 44],
      ['stats-card', 14],
    ]
  );
  const prepared = copy({ variables: d.variables, styles: d.styles });
  buildStatsCardRecipes({ root, ...d });
  assert.deepStrictEqual(
    { variables: d.variables, styles: d.styles },
    prepared
  );
  for (const family of d.components.families) {
    const defaults = new Map();
    for (const spec of family.variants
      .flatMap(v => walk(v.tree))
      .filter(s => s.textProperty)) {
      assert(
        !defaults.has(spec.textProperty) ||
          defaults.get(spec.textProperty) === spec.characters
      );
      defaults.set(spec.textProperty, spec.characters);
    }
  }
  for (const mode of d.modes) {
    const env = await rangeEnvironment(d);
    installNativeTextPropertyDefaultFixture(env);
    installTextCaseFixture(env);
    await installStatsCardSvgFixture(env, d.components.families);
    await env.call('importVariables', d, [mode.id], false, [], true);
    const run = () =>
      env.call('buildMangroveComponents', d, mode.id, [
        'stats-card-item',
        'stats-card',
      ]);
    assert.deepStrictEqual(copy((await run()).errors), []);
    const resolve = name => {
      if (typeof name === 'number') return name;
      const v = d.variables.find(v => v.name === name);
      assert(v, name);
      const value = v.values[mode.id];
      return value?.alias ? resolve(value.alias) : value;
    };
    async function sourceAssertions() {
      for (const family of d.components.families)
        for (const variant of family.variants) {
          const key = 'family/' + family.id + '/variant/' + variant.id,
            master = [...env.state.nodes.values()].find(
              n => identity(n) === key
            );
          assert(master, key);
          assert.equal(
            master.width,
            variant.sourceGeometry.recorded[mode.id].width
          );
          assert.equal(
            master.height,
            variant.sourceGeometry.recorded[mode.id].height
          );
          for (const spec of walk(variant.tree)) {
            const actual =
              spec.id === variant.tree.id
                ? master
                : master.findAll(n => identity(n).endsWith('/' + spec.id))[0];
            assert(actual, spec.id);
            if (spec.type === 'INSTANCE') {
              const linked = await actual.getMainComponentAsync();
              assert(linked);
              assert.equal(linked.type, 'COMPONENT');
              assert(
                identity(linked).startsWith(
                  'family/' + spec.family + '/variant/'
                )
              );
            }
            if (spec.type === 'FRAME') {
              assert.equal(actual.width, resolve(spec.layout.width));
              assert.equal(actual.height, resolve(spec.layout.height));
            }
            if (spec.absolute) {
              assert.equal(actual.x, resolve(spec.absolute.offsetX));
              assert.equal(actual.y, resolve(spec.absolute.offsetY));
            }
            if (spec.bindings?.opacity)
              assert.equal(
                actual.opacity,
                resolve(spec.bindings.opacity) / 100
              );
            if (spec.fill) {
              const c = resolve(spec.fill),
                p = actual.fills[0];
              assert.deepStrictEqual(copy(p.color), { r: c.r, g: c.g, b: c.b });
              assert.equal(p.opacity, c.a ?? 1);
              assert(p.boundVariables.color.id);
            }
            if (spec.effectStyle) assert(actual.effectStyleId);
            if (spec.type === 'TEXT') {
              assert.equal(actual.characters, spec.characters);
              if (spec.textProperty) {
                const ref = actual.componentPropertyReferences.characters;
                let owner = actual.parent;
                while (owner && owner.type !== 'COMPONENT_SET')
                  owner = owner.parent;
                assert.equal(
                  owner.componentPropertyDefinitions[ref].defaultValue,
                  spec.characters
                );
                const expected = d.styles.text.find(
                  s => s.id === spec.textStyle
                ).values[mode.id];
                assert.equal(actual.textCase, expected.textCase);
              }
            }
          }
        }
    }
    await sourceAssertions();
    const itemMaster = [...env.state.nodes.values()].find(
      n =>
        identity(n) ===
        'family/stats-card-item/variant/stats-card-item.default.390.0'
    );
    const plain = itemMaster.findAll(
      n => n.type === 'TEXT' && n.characters === 'Target A'
    )[0];
    assert(plain);
    const ref = plain.componentPropertyReferences.characters;
    const groupMaster = [...env.state.nodes.values()].find(
        n => identity(n) === 'family/stats-card/variant/stats-card.default.390'
      ),
      consumer = groupMaster.createInstance();
    env.figma.currentPage.appendChild(consumer);
    consumer.x = 2600;
    consumer.y = 2700;
    const nested = await Promise.all(
      consumer
        .findAll(n => n.type === 'INSTANCE')
        .map(async n => [n, await n.getMainComponentAsync()])
    );
    const owning = nested.find(([, main]) => main?.id === itemMaster.id)?.[0];
    assert(owning);
    owning.setProperties({ [ref]: 'Edited target A' });
    const displayed = owning.findAll(
      n =>
        n.type === 'TEXT' && n.componentPropertyReferences?.characters === ref
    )[0];
    assert(displayed);
    const desc = Object.getOwnPropertyDescriptor(displayed, 'characters');
    Object.defineProperty(displayed, 'characters', {
      configurable: true,
      get() {
        return owning.componentProperties[ref]?.value ?? desc.get.call(this);
      },
      set(v) {
        desc.set.call(this, v);
      },
    });
    assert.equal(displayed.characters, 'Edited target A');
    const richMaster = [...env.state.nodes.values()].find(
        n =>
          identity(n) ===
          'family/stats-card-item/variant/stats-card-item.default.390.1'
      ),
      richSource = richMaster.findAll(
        n =>
          n.type === 'TEXT' &&
          n.characters.includes('number of affected people')
      )[0];
    assert(richSource);
    const richOwner = richMaster.createInstance();
    env.figma.currentPage.appendChild(richOwner);
    const richClone = richOwner.findAll(
        n => identity(n) === identity(richSource)
      )[0],
      rich = env.attachRichText(richClone, richSource);
    const richStart = richClone.characters.indexOf('100,000');
    rich.editRich(richStart, richStart + 7, '200,000');
    const richEdit = copy(
      rich.getStyledTextSegments([
        'fills',
        'textStyleId',
        'fontName',
        'hyperlink',
        'textDecoration',
      ])
    );
    const snapshot = () =>
      copy(
        [...env.state.nodes.values()]
          .filter(
            n =>
              identity(n).startsWith('family/stats-card') ||
              n === consumer ||
              n === richOwner
          )
          .map(n => ({
            id: n.id,
            key: identity(n),
            parent: n.parent?.id,
            type: n.type,
            x: n.x,
            y: n.y,
            width: n.width,
            height: n.height,
            opacity: n.opacity,
            fills: n.fills,
            strokes: n.strokes,
            effect: n.effectStyleId,
            style: n.textStyleId,
            text: n.type === 'TEXT' ? n.characters : null,
            refs: n.componentPropertyReferences,
            properties:
              n.type === 'COMPONENT_SET'
                ? n.componentPropertyDefinitions
                : n.type === 'INSTANCE'
                  ? n.componentProperties
                  : null,
          }))
      );
    const before = snapshot(),
      count = env.state.nodes.size;
    assert(before.length > 600);
    for (let i = 0; i < 2; i++) {
      const result = await run();
      assert.deepStrictEqual(copy(result.errors), []);
      assert.equal(result.createdNodeIds.length, 0);
      assert.equal(env.state.nodes.size, count);
      assert.deepStrictEqual(snapshot(), before);
      await sourceAssertions();
      assert.equal(displayed.characters, 'Edited target A');
      assert.equal(richClone.characters.endsWith('200,000.'), true);
      assert.deepStrictEqual(
        copy(
          rich.getStyledTextSegments([
            'fills',
            'textStyleId',
            'fontName',
            'hyperlink',
            'textDecoration',
          ])
        ),
        richEdit
      );
    }
    console.log(
      mode.id +
        ' Stats2/58 actual source/nested/defaults/case/rich/paints and two zero-create repeats pass; numeric/native pixels open'
    );
  }
  for (const mutation of [
    x => {
      x.variables.find(v => v.name === 'font-family/ui').values.mcr = 'Wrong';
    },
    x => {
      x.variables.find(v => v.name === 'color/interactive').values.delta = {
        r: 1,
        g: 0,
        b: 1,
        a: 1,
      };
    },
    x => {
      x.variables.find(v => v.name.startsWith('component/stats-card/')).type =
        'STRING';
    },
    x => {
      const s = x.styles.text.find(s =>
        s.id.startsWith('component.stats-card.')
      );
      s.values.mcr.fontName = 'foreign';
    },
    x => {
      x.styles.text.find(s => s.id.startsWith('component.stats-card.')).type =
        'EFFECT';
    },
    x => {
      x.styles.effect.push(
        copy(x.styles.text.find(s => s.id.startsWith('component.stats-card.')))
      );
    },
  ]) {
    const bad = document();
    mutation(bad);
    const before = copy(bad);
    assert.throws(
      () => buildStatsCardRecipes({ root, ...bad }),
      /needs updating/
    );
    assert.deepStrictEqual(bad, before);
  }
  const missing = await rangeEnvironment(d);
  installNativeTextPropertyDefaultFixture(missing);
  installTextCaseFixture(missing);
  await installStatsCardSvgFixture(missing, d.components.families);
  await missing.call('importVariables', d, ['undrr'], false, [], true);
  missing.figma.listAvailableFontsAsync = async () => [];
  const before = copy([...missing.state.nodes.keys()]),
    result = await missing.call('buildMangroveComponents', d, 'undrr', [
      'stats-card-item',
      'stats-card',
    ]);
  assert(result.errors.length);
  assert.equal(result.createdNodeIds.length, 0);
  assert.deepStrictEqual([...missing.state.nodes.keys()], before);
  const read = fs.readFileSync;
  for (const file of [
    'stories/Components/Cards/StatsCard/StatsCardItem.jsx',
    'stories/Components/Cards/StatsCard/stats-card.scss',
    'examples/figma-plugin/holistic/assets/stats-card/mask-mirror-readout.json',
    'examples/figma-plugin/holistic/assets/content-hub/source-fonts/RobotoCondensed-Bold.woff2',
  ]) {
    let hit = false;
    fs.readFileSync = function (p, ...args) {
      const b = read.call(this, p, ...args);
      if (typeof p === 'string' && p.endsWith(file)) {
        hit = true;
        return typeof b === 'string'
          ? b + ' '
          : Buffer.concat([b, Buffer.from(' ')]);
      }
      return b;
    };
    try {
      const original = JSON.parse(
          read.call(fs, path.join(__dirname, '../mangrove-variables.json'))
        ),
        before = copy(original);
      assert.throws(
        () => buildStatsCardRecipes({ root, ...original }),
        /needs updating/
      );
      assert(hit, file);
      assert.deepStrictEqual(original, before);
    } finally {
      fs.readFileSync = read;
    }
  }
  console.log(
    'Stats source/type/kind/font/evidence premutation negatives pass; no native acceptance'
  );
}
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { document, installStatsCardSvgFixture };
