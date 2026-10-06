'use strict';
const fs = require('fs'),
  path = require('path'),
  assert = require('assert');
const root = path.resolve(__dirname, '../../..'),
  clone = x => JSON.parse(JSON.stringify(x));
const { buildNewsExclusionParagraphRecipes } = require(
  root + '/scripts/figma-news-exclusion-recipes.cjs'
);
const { rangeEnvironment } = require('./mock-rich-text-integration.cjs');
const id = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
(async () => {
  const d = JSON.parse(
    fs.readFileSync(root + '/examples/figma-plugin/mangrove-variables.json')
  );
  d.components.families = buildNewsExclusionParagraphRecipes({ root, ...d });
  assert.equal(d.components.families[0].variants.length, 2);
  const before = clone({ variables: d.variables, styles: d.styles });
  buildNewsExclusionParagraphRecipes({ root, ...d });
  assert.deepStrictEqual({ variables: d.variables, styles: d.styles }, before);
  for (const mode of d.modes) {
    const env = await rangeEnvironment(d);
    await env.call('importVariables', d, [mode.id], false, [], true);
    const build = () =>
      env.call('buildMangroveComponents', d, mode.id, [
        'news-source-exclusion',
      ]);
    const first = await build();
    assert.deepStrictEqual(clone(first.errors), []);
    const key =
      'family/news-source-exclusion/variant/news-source-exclusion.1164';
    const master = [...env.state.nodes.values()].find(n => id(n) === key);
    assert(master);
    const owner = n => {
      for (let p = n.parent; p; p = p.parent)
        if (p.type === 'COMPONENT' || p.type === 'INSTANCE') return p;
      return null;
    };
    const texts = [...env.state.nodes.values()].filter(
      n =>
        id(n).startsWith(key + '/line') &&
        n.type === 'TEXT' &&
        owner(n)?.id === master.id
    );
    assert.equal(texts.length, 4);
    assert.equal(
      texts.map(n => n.characters).join(''),
      d.components.families[0].variants[1].sourceFlow.sourceParagraphCharacters
    );
    for (let i = 0; i < 4; i++) {
      assert.equal(texts[i].parent.width, i < 3 ? 485.40625 : 722);
      assert.equal(texts[i].parent.height, 24);
      assert.equal(texts[i].textAutoResize, 'WIDTH_AND_HEIGHT');
    }
    const consumer = master.createInstance();
    env.figma.currentPage.appendChild(consumer);
    consumer.x = 200;
    consumer.y = 300;
    const narrowKey =
      'family/news-source-exclusion/variant/news-source-exclusion.390';
    const narrowMain = [...env.state.nodes.values()].find(
      n => id(n) === narrowKey
    );
    const narrowConsumer = narrowMain.createInstance();
    env.figma.currentPage.appendChild(narrowConsumer);
    const narrowText = narrowConsumer.findAll(n => n.type === 'TEXT')[0];
    const editedNarrow = narrowText.characters.replace('Sed', 'Set');
    narrowText.characters = editedNarrow;
    const geometry = () =>
      [...env.state.nodes.values()]
        .filter(n => id(n) || n.type === 'INSTANCE')
        .map(n => ({
          id: n.id,
          key: id(n),
          parent: n.parent?.id,
          type: n.type,
          x: n.x,
          y: n.y,
          width: n.width,
          height: n.height,
          characters: n.type === 'TEXT' ? n.characters : null,
          main: n.type === 'INSTANCE' ? n.mainComponent?.id : null,
        }));
    const initial = clone(geometry());
    assert(initial.length > 20);
    for (let i = 0; i < 2; i++) {
      const r = await build();
      assert.deepStrictEqual(clone(r.errors), []);
      assert.equal(r.createdNodeIds.length, 0);
      assert.deepStrictEqual(clone(geometry()), initial);
      assert.equal(narrowText.characters, editedNarrow);
    }
    const linked = consumer.findAll(n => n.type === 'TEXT')[0];
    linked.characters = 'Edited source line requires reflow';
    const refusalBefore = clone({
      geometry: geometry(),
      styles: env.state.styles,
      images: [...env.state.images],
      variables: [...env.state.variables],
    });
    const refusal = await build();
    assert(refusal.errors.some(e => /reflow-needed/.test(e)));
    assert.equal(refusal.createdNodeIds.length, 0);
    assert.deepStrictEqual(
      clone({
        geometry: geometry(),
        styles: env.state.styles,
        images: [...env.state.images],
        variables: [...env.state.variables],
      }),
      refusalBefore
    );
  }
  for (const change of [
    doc => {
      const v = doc.variables.find(
        v => v.name === 'component/news-source-exclusion/width-390'
      );
      v.type = 'STRING';
    },
    doc => {
      const v = doc.styles.text.find(
        v => v.id === 'component.page-pattern.body'
      );
      v.values.mcr = [];
    },
    doc => {
      const v = doc.styles.text.find(
        v => v.id === 'component.page-pattern.body'
      );
      doc.styles.effect.push({ ...v });
    },
  ]) {
    const bad = clone(d);
    change(bad);
    const untouched = clone({ variables: bad.variables, styles: bad.styles });
    assert.throws(
      () => buildNewsExclusionParagraphRecipes({ root, ...bad }),
      /foreign/
    );
    assert.deepStrictEqual(
      { variables: bad.variables, styles: bad.styles },
      untouched
    );
  }
  console.log(
    'News exclusion: actual source294/4 desktop rich line profiles, narrow ordinary paragraph, allfive two zero-create repeats and current-page consumer edited-copy premutation refusal pass. No native font/line pixels/arbitrary CSS reflow claim.'
  );
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
