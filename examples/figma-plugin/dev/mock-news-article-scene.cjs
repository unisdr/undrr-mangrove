'use strict';
const fs = require('fs'),
  path = require('path'),
  assert = require('assert');
const root = path.resolve(__dirname, '../../..'),
  clone = x => JSON.parse(JSON.stringify(x));
const {
  prepareNewsArticleDependencies,
  buildNewsArticleSceneRecipes,
} = require(root + '/scripts/figma-news-article-scene-recipes.cjs');
const { rangeEnvironment } = require('./mock-rich-text-integration.cjs');
const { installNewsDetailSvgFixture } = require('./mock-news-detail.cjs');
const { installPageChromeSvgFixture } = require('./mock-page-chrome.cjs');
const {
  installNativeTextPropertyDefaultFixture,
} = require('./mock-search-results.cjs');
const id = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
(async () => {
  const d = JSON.parse(
    fs.readFileSync(root + '/examples/figma-plugin/mangrove-variables.json')
  );
  const tag = require(root + '/scripts/figma-tag-recipes.cjs').buildTagRecipes({
    root,
    ...d,
  });
  const dependencies = prepareNewsArticleDependencies({ root, ...d });
  const scenes = buildNewsArticleSceneRecipes({ root, ...d });
  d.components.families = [
    ...d.components.families.filter(f => f.id === 'button'),
    ...tag,
    ...dependencies,
    ...scenes,
  ];
  assert.equal(scenes[0].variants.length, 10);
  for (const mutate of [
    x => {
      const v = x.variables.find(v =>
        v.name.startsWith('component/news-article-scene/')
      );
      v.type = 'STRING';
    },
    x => {
      const v = x.styles.text.find(v => v.id === 'component.page-pattern.body');
      v.values.mcr = [];
    },
    x => {
      const v = x.styles.text.find(v => v.id === 'component.page-pattern.body');
      x.styles.effect.push({ ...v });
    },
  ]) {
    const bad = clone(d);
    mutate(bad);
    const before = clone({ variables: bad.variables, styles: bad.styles });
    assert.throws(
      () => buildNewsArticleSceneRecipes({ root, ...bad }),
      /foreign/
    );
    assert.deepStrictEqual(
      { variables: bad.variables, styles: bad.styles },
      before
    );
  }
  for (const mutate of [
    x => {
      x.styles.text.find(v => v.id === 'component.page-pattern.body').type =
        'EFFECT';
    },
    x => {
      delete x.styles.text.find(v => v.id === 'component.page-pattern.body')
        .values.mcr.fontName;
    },
    x => {
      x.styles.effect[0].type = 'TEXT';
    },
  ])
    for (const builder of [
      prepareNewsArticleDependencies,
      buildNewsArticleSceneRecipes,
    ]) {
      const bad = clone(d);
      mutate(bad);
      const before = clone({ variables: bad.variables, styles: bad.styles });
      assert.throws(() => builder({ root, ...bad }), /foreign/);
      assert.deepStrictEqual(
        { variables: bad.variables, styles: bad.styles },
        before
      );
    }
  const read = fs.readFileSync;
  try {
    fs.readFileSync = function (file, ...args) {
      const result = read.call(this, file, ...args);
      if (
        String(file) ===
        path.join(
          root,
          'examples/figma-plugin/holistic/assets/news-article-assembly/source-footprints.json'
        )
      )
        return Buffer.concat([Buffer.from(result), Buffer.from('drift')]);
      return result;
    };
    const before = clone({ variables: d.variables, styles: d.styles });
    assert.throws(
      () => buildNewsArticleSceneRecipes({ root, ...d }),
      /source-footprints/
    );
    assert.deepStrictEqual(
      { variables: d.variables, styles: d.styles },
      before
    );
  } finally {
    fs.readFileSync = read;
  }
  const missing = await rangeEnvironment(d);
  installNativeTextPropertyDefaultFixture(missing);
  installPageChromeSvgFixture(
    missing,
    dependencies.filter(f => f.id === 'page-chrome')
  );
  await installNewsDetailSvgFixture(missing);
  await missing.call('importVariables', d, ['undrr'], false, [], true);
  missing.figma.listAvailableFontsAsync = async () => [];
  const beforeMissing = clone({
    nodes: [...missing.state.nodes.keys()],
    styles: missing.state.styles,
    images: [...missing.state.images],
    variables: [...missing.state.variables],
  });
  const missingResult = await missing.call(
    'buildMangroveComponents',
    d,
    'undrr',
    ['news-article-scene']
  );
  assert(missingResult.errors.length);
  assert.equal(missingResult.createdNodeIds.length, 0);
  assert.deepStrictEqual(
    clone({
      nodes: [...missing.state.nodes.keys()],
      styles: missing.state.styles,
      images: [...missing.state.images],
      variables: [...missing.state.variables],
    }),
    beforeMissing
  );
  for (const mode of d.modes) {
    const env = await rangeEnvironment(d);
    installNativeTextPropertyDefaultFixture(env);
    installPageChromeSvgFixture(
      env,
      dependencies.filter(f => f.id === 'page-chrome')
    );
    await installNewsDetailSvgFixture(env);
    await env.call('importVariables', d, [mode.id], false, [], true);
    const build = () =>
      env.call('buildMangroveComponents', d, mode.id, ['news-article-scene']);
    const first = await build();
    assert.deepStrictEqual(clone(first.errors), []);
    for (const variant of scenes[0].variants) {
      const key = 'family/news-article-scene/variant/' + variant.id;
      const master = [...env.state.nodes.values()].find(n => id(n) === key);
      assert(master);
      assert.equal(master.width, Number(variant.properties.SourceViewport));
      assert.equal(master.height, variant.sourceScene.recordedRoot.height);
      assert.equal(master.opacity, 1);
      const captured = JSON.parse(
        fs.readFileSync(
          root +
            '/examples/figma-plugin/holistic/assets/news-article-assembly/source-footprints.json'
        )
      ).cases[
        variant.properties.CaptureTheme +
          '-' +
          variant.properties.SourceViewport
      ];
      const intro = captured.records['.mg-demo-intro'][0].rect;
      const headerSlot = master.findAll(
        n => id(n) === key + '/article-header-slot'
      )[0];
      assert(headerSlot);
      assert.equal(headerSlot.x, intro.x - captured.root.rect.x);
      assert.equal(headerSlot.y, intro.y - captured.root.rect.y);
      assert.equal(headerSlot.width, intro.width);
      assert.equal(headerSlot.height, intro.height);
      const header = headerSlot.children.find(n => n.type === 'INSTANCE');
      assert(header);
      if (variant.properties.CaptureTheme === mode.id)
        assert.equal(header.width, intro.width);
      assert.equal(header.layoutSizingVertical, 'FILL');
      const instances = master.findAll(n => n.type === 'INSTANCE');
      assert(instances.length >= 13);
      for (const instance of instances)
        assert(await instance.getMainComponentAsync());
      for (const slot of variant.tree.children) {
        const node = slot.children[0];
        if (node.type !== 'INSTANCE') continue;
        const f = d.components.families.find(f => f.id === node.family),
          v = f.variants.find(v =>
            Object.entries(node.variant).every(
              ([k, x]) => v.properties[k] === x
            )
          );
        assert(v);
        const width = v.tree.layout.width;
        if (width === 'HUG' || width === 'FILL') continue;
        const expected =
          typeof width === 'number'
            ? width
            : d.variables.find(x => x.name === width).values[
                variant.properties.CaptureTheme
              ];
        assert(
          Number.isFinite(expected),
          'finite selected source master width'
        );
        const allocation = d.variables.find(x => x.name === slot.layout.width)
          .values[variant.properties.CaptureTheme];
        assert.equal(
          allocation,
          expected,
          'source selected fixed master width ' + node.family
        );
      }
    }
    const sceneKey =
      'family/news-article-scene/variant/news-article-scene.' +
      mode.id +
      '-390';
    const sceneMaster = [...env.state.nodes.values()].find(
      n => id(n) === sceneKey
    );
    const consumer = sceneMaster.createInstance();
    env.figma.currentPage.appendChild(consumer);
    consumer.x = 700;
    consumer.y = 800;
    const owner = n => {
      for (let p = n.parent; p; p = p.parent)
        if (p.type === 'INSTANCE') return p;
      return null;
    };
    const editable = consumer.findAll(
      n =>
        n.type === 'TEXT' &&
        owner(n)?.id === consumer.id &&
        n.componentPropertyReferences?.characters
    )[0];
    assert(editable);
    const property = editable.componentPropertyReferences.characters;
    consumer.setProperties({ [property]: 'Edited article heading' });
    assert.equal(
      consumer.componentProperties[property].value,
      'Edited article heading'
    );
    const geometry = () =>
      [...env.state.nodes.values()]
        .filter(n => id(n))
        .map(n => ({
          id: n.id,
          parent: n.parent?.id,
          type: n.type,
          key: id(n),
          x: n.x,
          y: n.y,
          width: n.width,
          height: n.height,
          characters: n.type === 'TEXT' ? n.characters : null,
          main: n.type === 'INSTANCE' ? n.main?.id : null,
          opacity: n.opacity,
        }));
    const before = clone(geometry());
    assert(before.length > 200);
    for (let i = 0; i < 2; i++) {
      const r = await build();
      assert.deepStrictEqual(clone(r.errors), []);
      assert.equal(r.createdNodeIds.length, 0);
      assert.deepStrictEqual(clone(geometry()), before);
      assert.equal(
        consumer.componentProperties[property].value,
        'Edited article heading'
      );
    }
    const desktopKey =
      'family/news-article-scene/variant/news-article-scene.' +
      mode.id +
      '-1164';
    const desktopMaster = [...env.state.nodes.values()].find(
      n => id(n) === desktopKey
    );
    const desktopConsumer = desktopMaster.createInstance();
    env.figma.currentPage.appendChild(desktopConsumer);
    const frozen = desktopConsumer.findAll(
      n =>
        n.type === 'TEXT' &&
        id(n).includes(
          'family/news-source-exclusion/variant/news-source-exclusion.1164/line0/'
        )
    )[0];
    assert(frozen);
    frozen.characters = 'Edited desktop lines require reflow';
    const state = () =>
      clone({
        geometry: geometry(),
        styles: env.state.styles,
        variables: [...env.state.variables],
        images: [...env.state.images],
      });
    const beforeRefusal = state();
    const refused = await build();
    assert(refused.errors.some(e => /reflow-needed/.test(e)));
    assert.equal(refused.createdNodeIds.length, 0);
    assert.deepStrictEqual(state(), beforeRefusal);
    console.log(
      mode.id,
      'complete finite source article scene10 exact offline root/nested identities and two zero-create recorded geometry repeats passed; native source raster/reflow remain open'
    );
  }
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
