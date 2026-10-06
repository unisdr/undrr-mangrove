'use strict';
const fs = require('fs'),
  assert = require('assert');
const path = require('path');
const root = path.resolve(__dirname, '../../..');
const { buildNewsFloatHighlightRecipes } = require(
  root + '/scripts/figma-news-float-recipes.cjs'
);
const { rangeEnvironment } = require(
  root + '/examples/figma-plugin/dev/mock-rich-text-integration.cjs'
);
const clone = x => JSON.parse(JSON.stringify(x));
const id = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
function document() {
  const d = JSON.parse(
    fs.readFileSync(root + '/examples/figma-plugin/mangrove-variables.json')
  );
  d.components.families = buildNewsFloatHighlightRecipes({ root, ...d });
  return d;
}
(async () => {
  const d = document();
  assert.equal(d.components.families.length, 1);
  assert.equal(d.components.families[0].variants.length, 2);
  const before = clone({ variables: d.variables, styles: d.styles });
  buildNewsFloatHighlightRecipes({ root, ...d });
  assert.deepStrictEqual({ variables: d.variables, styles: d.styles }, before);
  for (const mode of d.modes) {
    const env = await rangeEnvironment(d);
    await env.call('importVariables', d, [mode.id], false, [], true);
    const build = () =>
      env.call('buildMangroveComponents', d, mode.id, [
        'news-contextual-highlight',
      ]);
    const first = await build();
    assert.deepStrictEqual(clone(first.errors), []);
    const owned = [...env.state.nodes.values()].filter(n => id(n));
    const consumer = [];
    for (const variant of d.components.families[0].variants) {
      const key = 'family/news-contextual-highlight/variant/' + variant.id,
        master = owned.find(n => id(n) === key);
      assert(master);
      assert.equal(
        master.height,
        variant.properties.SourceViewport === '390' ? 94 : 118
      );
      assert.equal(master.opacity, 1);
      assert(master.effectStyleId);
      assert.equal(master.paddingTop, 10);
      assert.equal(master.paddingBottom, 20);
      assert.equal(master.paddingLeft, 15);
      assert.equal(master.paddingRight, 15);
      const shadow = env.state.styles.find(s => s.id === master.effectStyleId);
      assert(shadow);
      assert.equal(shadow.effects.length, 1);
      assert.equal(shadow.effects[0].type, 'INNER_SHADOW');
      assert.deepStrictEqual(clone(shadow.effects[0].offset), { x: 0, y: -8 });
      assert.equal(shadow.effects[0].color.a, 0.5);
      const text = owned.find(n => id(n) === key + '/paragraph-slot/body');
      assert(text);
      assert.equal(
        text.characters,
        '45 participants from Indigenous communities across 11 countries.'
      );
      assert.equal(text.getStyledTextSegments(['textStyleId']).length, 4);
      const ranges = text.getStyledTextSegments([
        'fontName',
        'fills',
        'textDecoration',
      ]);
      assert.deepStrictEqual(
        ranges.map(s => s.fontName.style),
        ['Bold', 'Regular', 'Bold', 'Regular']
      );
      for (const range of ranges) {
        assert.equal(range.fontName.family, 'Roboto');
        assert.equal(range.textDecoration, 'NONE');
        assert.deepStrictEqual(clone(range.fills[0].color), {
          r: 1,
          g: 1,
          b: 1,
        });
      }
      text.editRich(0, 2, '46');
      const instance = master.createInstance();
      env.figma.currentPage.appendChild(instance);
      instance.x = 1200;
      instance.y = 1300;
      const children = [instance, ...instance.findAll(() => true)],
        t = children.find(n => n.type === 'TEXT');
      assert(t);
      env.attachRichText(t, text);
      t.editRich(0, 2, '47');
      consumer.push({ instance, text: t, main: master.id });
    }
    const geometry = () =>
      JSON.stringify(
        [...env.state.nodes.values()].map(n => [
          n.id,
          n.parent?.id,
          n.type,
          n.x,
          n.y,
          n.width,
          n.height,
          n.opacity,
          n.effectStyleId,
          n.type === 'INSTANCE' ? n.main.id : null,
        ])
      );
    const rich = () =>
      JSON.stringify(
        [...env.state.nodes.values()]
          .filter(n => n.type === 'TEXT')
          .map(n => [
            n.id,
            n.characters,
            n.getStyledTextSegments([
              'textStyleId',
              'fontName',
              'fills',
              'textDecoration',
            ]),
          ])
      );
    const g = geometry(),
      r = rich();
    assert(owned.length > 10);
    for (let i = 0; i < 2; i++) {
      const repeat = await build();
      assert.deepStrictEqual(clone(repeat.errors), []);
      assert.equal(repeat.createdNodeIds.length, 0);
      assert.equal(geometry(), g);
      assert.equal(rich(), r);
      for (const c of consumer) {
        assert.equal(c.instance.main.id, c.main);
        assert.equal(c.instance.x, 1200);
        assert.equal(c.instance.y, 1300);
        assert(c.text.characters.startsWith('47'));
      }
    }
    console.log(
      mode.id,
      'contextual float two masters/exact nonempty mock geometry/source+consumer rich retention/two zero-create repeats passed (offline only)'
    );
  }
  await negatives();
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});

async function negatives() {
  for (const mutate of [
    d => {
      d.variables.find(v => v.name === 'font-size/300').values.mcr = 17;
    },
    d => {
      d.variables.find(v => v.name === 'font-family/text').values.irp =
        'Foreign';
    },
    d => {
      d.variables.find(v => v.name === 'font-size/300').type = 'STRING';
    },
    d => {
      d.variables.find(v => v.name === 'font-size/300').values.delta = {
        alias: 'font-size/300',
      };
    },
    d => {
      d.variables.push({
        id: 'component.news-contextual-highlight.390.width',
        name: 'foreign',
        type: 'FLOAT',
        values: {},
      });
    },
    d => {
      const v = d.variables.find(
        v => v.name === 'component/highlight-box/padding-top'
      );
      v.type = 'STRING';
    },
    d => {
      d.styles.effect.push({
        id: 'component.news-contextual-highlight.body',
        name: 'foreign',
        values: {},
      });
    },
    d => {
      d.styles.text.push({
        id: 'component.highlight-box.coloured-shadow',
        name: 'foreign',
        values: {},
      });
    },
  ]) {
    const d = document();
    mutate(d);
    const before = clone({ variables: d.variables, styles: d.styles });
    assert.throws(
      () => buildNewsFloatHighlightRecipes({ root, ...d }),
      /source changed|recipe needs updating/
    );
    assert.deepStrictEqual(
      { variables: d.variables, styles: d.styles },
      before
    );
  }
  const read = fs.readFileSync;
  for (const suffix of [
    'news-float/provenance.json',
    'news-float/source-footprints.json',
    'news-float/source-capture.js',
    'ArticleStory.jsx',
    'highlight-box.scss',
    'Roboto-Regular.woff2',
    'Roboto-Bold.woff2',
  ]) {
    fs.readFileSync = function (file, ...args) {
      const bytes = read.call(this, file, ...args);
      return typeof file === 'string' && file.endsWith(suffix)
        ? Buffer.isBuffer(bytes)
          ? Buffer.concat([bytes, Buffer.from('drift')])
          : bytes + 'drift'
        : bytes;
    };
    try {
      assert.throws(document, /source changed|recipe needs updating/);
    } finally {
      fs.readFileSync = read;
    }
  }
  for (const font of ['Roboto Regular', 'Roboto Bold']) {
    const d = document(),
      env = await rangeEnvironment(d, { rejectedFonts: [font] });
    await env.call('importVariables', d, ['undrr'], false, [], true);
    const before = JSON.stringify({
      nodes: [...env.state.nodes.keys()],
      styles: env.state.styles,
      images: [...env.state.images.keys()],
    });
    const result = await env.call('buildMangroveComponents', d, 'undrr', [
      'news-contextual-highlight',
    ]);
    assert(result.errors.length);
    assert.equal(result.createdNodeIds.length, 0);
    assert.equal(
      JSON.stringify({
        nodes: [...env.state.nodes.keys()],
        styles: env.state.styles,
        images: [...env.state.images.keys()],
      }),
      before
    );
  }
  console.log(
    'Source/dependency/font/collision guards refuse before caller or scene writes; no CSS exclusion-flow or native pixel claim.'
  );
}
