'use strict';
const fs = require('fs'),
  path = require('path'),
  assert = require('assert');
const root = path.resolve(__dirname, '../../..');
const { buildNewsArticleMediaRecipes } = require(
  root + '/scripts/figma-news-article-recipes.cjs'
);
const { rangeEnvironment } = require('./mock-rich-text-integration.cjs');
const clone = x => JSON.parse(JSON.stringify(x));
const id = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
(async () => {
  const d = JSON.parse(
    fs.readFileSync(root + '/examples/figma-plugin/mangrove-variables.json')
  );
  const before = clone({ variables: d.variables, styles: d.styles });
  d.components.families = buildNewsArticleMediaRecipes({ root, ...d });
  assert.deepStrictEqual({ variables: d.variables, styles: d.styles }, before);
  assert.equal(d.components.families.length, 1);
  assert.equal(d.components.families[0].variants.length, 10);
  assert.deepStrictEqual(
    buildNewsArticleMediaRecipes({ root, ...d }),
    d.components.families
  );
  for (const mode of d.modes) {
    const env = await rangeEnvironment(d);
    await env.call('importVariables', d, [mode.id], false, [], true);
    const build = () =>
      env.call('buildMangroveComponents', d, mode.id, [
        'news-article-initial-media',
      ]);
    const first = await build();
    assert.deepStrictEqual(clone(first.errors), []);
    for (const v of d.components.families[0].variants) {
      const key = 'family/news-article-initial-media/variant/' + v.id;
      const main = [...env.state.nodes.values()].find(n => id(n) === key);
      assert(main);
      assert.equal(main.width, v.tree.layout.width);
      assert.equal(main.height, v.tree.layout.height);
      assert.equal(main.opacity, 1);
      const image = [...env.state.nodes.values()].find(
        n => id(n) === key + '/initialized-player-capture'
      );
      assert(image);
      assert.equal(image.fills[0].type, 'IMAGE');
      assert.equal(image.fills[0].scaleMode, 'FILL');
      assert.equal(image.opacity, 1);
      const consumer = main.createInstance();
      env.figma.currentPage.appendChild(consumer);
      consumer.x = 500;
      consumer.y = 700;
    }
    const geometry = () =>
      [...env.state.nodes.values()]
        .filter(n => id(n) || n.type === 'INSTANCE')
        .map(n => ({
          id: n.id,
          parent: n.parent?.id,
          type: n.type,
          key: id(n),
          x: n.x,
          y: n.y,
          width: n.width,
          height: n.height,
          main: n.type === 'INSTANCE' ? n.mainComponent?.id : null,
          fills: n.fills,
          opacity: n.opacity,
        }));
    const baseline = clone(geometry());
    assert(baseline.length > 20);
    const images = env.state.images.size;
    for (let i = 0; i < 2; i++) {
      const r = await build();
      assert.deepStrictEqual(clone(r.errors), []);
      assert.equal(r.createdNodeIds.length, 0);
      assert.deepStrictEqual(clone(geometry()), baseline);
      assert.equal(env.state.images.size, images);
    }
  }
  assert.throws(
    () => buildNewsArticleMediaRecipes({ root, modes: d.modes.slice(1) }),
    /five modes/
  );
  const os = require('os'),
    temp = fs.mkdtempSync(path.join(os.tmpdir(), 'mangrove-news-media-guard-'));
  try {
    const relative = 'examples/figma-plugin/holistic/assets/news-article';
    const provenance = JSON.parse(
      fs.readFileSync(path.join(root, relative, 'provenance.json'))
    );
    for (const file of Object.keys(provenance.sourceHashes)) {
      const target = path.join(temp, file);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(path.join(root, file), target);
    }
    fs.cpSync(path.join(root, relative), path.join(temp, relative), {
      recursive: true,
    });
    assert.deepStrictEqual(
      buildNewsArticleMediaRecipes({ root: temp, ...d }),
      d.components.families
    );
    for (const file of [
      'undrr-390-player.png',
      'undrr-390-snapshot.txt',
      'source-footprints.json',
    ]) {
      const target = path.join(temp, relative, file),
        original = fs.readFileSync(target);
      fs.writeFileSync(target, Buffer.concat([original, Buffer.from('drift')]));
      assert.throws(
        () => buildNewsArticleMediaRecipes({ root: temp, ...d }),
        /source changed/
      );
      assert.deepStrictEqual(
        { variables: d.variables, styles: d.styles },
        before
      );
      fs.writeFileSync(target, original);
    }
    const file = Object.keys(provenance.sourceHashes).find(f =>
      f.endsWith('ArticleStory.jsx')
    );
    assert(file);
    fs.appendFileSync(path.join(temp, file), 'source drift');
    assert.throws(
      () => buildNewsArticleMediaRecipes({ root: temp, ...d }),
      /ArticleStory/
    );
    assert.deepStrictEqual(
      { variables: d.variables, styles: d.styles },
      before
    );
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
  console.log(
    'Article media: ten actual captured contexts, allfive offline IMAGE wrapper builds and two zero-create exact recorded geometry/image-cache repeats pass. Native source crop/playback/full Article remain open.'
  );
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
