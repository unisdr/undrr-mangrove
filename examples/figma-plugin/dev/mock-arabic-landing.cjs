'use strict';
const fs = require('fs'),
  assert = require('assert/strict'),
  path = require('path'),
  root = path.resolve(__dirname, '../../..'),
  DEV = root + '/examples/figma-plugin/dev/',
  copy = x => JSON.parse(JSON.stringify(x)),
  walk = n => [n, ...(n.children || []).flatMap(walk)],
  identity = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
const { rangeEnvironment } = require(DEV + 'mock-rich-text-integration.cjs'),
  { installNativeTextPropertyDefaultFixture } = require(
    DEV + 'mock-search-results.cjs'
  ),
  { installPageChromeSvgFixture } = require(DEV + 'mock-page-chrome.cjs'),
  recipe = require('../../../scripts/figma-arabic-landing-recipes.cjs');
function document() {
  const d = JSON.parse(
    fs.readFileSync(root + '/examples/figma-plugin/mangrove-variables.json')
  );
  d.components.families = recipe.buildArabicLandingRecipes({ root, ...d });
  return d;
}
function snap(e) {
  return copy(
    [...e.state.nodes.values()]
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
function installArabicSvgFixture(env, families) {
  const specs = new Map(
    families
      .flatMap(f => f.variants.flatMap(v => walk(v.tree)))
      .filter(n => n.svg)
      .map(n => [n.svg.markup, n.svg])
  );
  env.figma.createNodeFromSvg = markup => {
    const source = [...specs.keys()].find(
      m =>
        m === markup ||
        m.replace(/\s+(?:width|height)=["'][^"']+["']/g, '') ===
          markup.replace(/\s+(?:width|height)=["'][^"']+["']/g, '')
    );
    assert(source, 'exact bounded SVG source');
    const box = /viewBox=["']0 0 ([\d.]+) ([\d.]+)["']/.exec(source);
    assert(box);
    const f = env.figma.createFrame(),
      v = env.figma.createVector();
    f.resize(+box[1], +box[2]);
    v.resize(f.width, f.height);
    v.vectorPaths = [{ windingRule: 'NONZERO', data: source }];
    v.fills =
      specs.get(source).monochrome && !specs.get(source).monochrome.fills
        ? []
        : [
            {
              type: 'SOLID',
              color: { r: 1, g: 1, b: 1 },
              opacity: 1,
              visible: true,
            },
          ];
    v.strokes = specs.get(source).monochrome?.strokes
      ? [
          {
            type: 'SOLID',
            color: { r: 0, g: 0, b: 0 },
            opacity: 1,
            visible: true,
          },
        ]
      : [];
    v.strokeWeight = 2;
    v.strokeAlign = 'CENTER';
    v.constraints = { horizontal: 'MIN', vertical: 'MIN' };
    f.appendChild(v);
    f.rescale = scale => {
      f.resizeWithoutConstraints(f.width * scale, f.height * scale);
      v.resizeWithoutConstraints(v.width * scale, v.height * scale);
      v.strokeWeight *= scale;
    };
    return f;
  };
}
async function setup(d) {
  const env = await rangeEnvironment(d, { richDecorationOffsets: true });
  installNativeTextPropertyDefaultFixture(env);
  installArabicSvgFixture(env, d.components.families);
  const prev = env.figma.listAvailableFontsAsync.bind(env.figma);
  env.figma.listAvailableFontsAsync = async () => [
    ...(await prev()),
    ...['Noto Sans Arabic', 'Noto Kufi Arabic'].flatMap(family =>
      ['Regular', 'Bold'].map(style => ({ fontName: { family, style } }))
    ),
  ];
  return env;
}
function checkPortableArchive() {
  const zlib = require('zlib'),
    crypto = require('crypto');
  const assets = path.join(
    root,
    'examples/figma-plugin/holistic/assets/arabic-landing'
  );
  const records = JSON.parse(
    fs.readFileSync(path.join(assets, 'raw-archive-manifest.json'))
  );
  assert.equal(records.length, 60);
  for (const record of records) {
    const compressed = fs.readFileSync(path.join(assets, record.path));
    assert.equal(
      crypto.createHash('sha256').update(compressed).digest('hex'),
      record.gzipSha256
    );
    const raw = zlib.gunzipSync(compressed);
    assert.equal(raw.length, record.rawBytes);
    assert.equal(
      crypto.createHash('sha256').update(raw).digest('hex'),
      record.rawSha256
    );
  }
}
async function main() {
  checkPortableArchive();
  const d = document();
  assert.equal(d.components.families.length, 15);
  assert.equal(d.components.families.flatMap(f => f.variants).length, 72);
  assert.deepEqual(document(), d);
  const pre = copy({ variables: d.variables, styles: d.styles });
  assert.deepEqual(
    recipe.buildArabicLandingRecipes({ root, ...d }),
    d.components.families
  );
  assert.deepEqual({ variables: d.variables, styles: d.styles }, pre);
  for (const mode of d.modes) {
    const env = await setup(d);
    const imported = await env.call(
      'importVariables',
      d,
      [mode.id],
      false,
      [],
      false
    );
    assert.deepEqual(copy(imported.errors), []);
    const ids = d.components.families.map(f => f.id),
      built = await env.call('buildMangroveComponents', d, mode.id, ids);
    assert.deepEqual(copy(built.errors), []);
    assert(built.createdNodeIds.length);
    console.log(mode.id, 'built', env.state.nodes.size);
    const checked =
      await require('../holistic/assets/arabic-landing/assert-source.cjs').assertSource(
        d,
        env,
        mode.id
      );
    console.log(mode.id, 'source fields', checked);
    const editedCheck =
      require('../holistic/assets/arabic-landing/assert-consumer.cjs').consumerEdits(
        d,
        env
      );
    const before = snap(env),
      images = [...env.state.images].map(([id, b]) => [
        id,
        Buffer.from(b).toString('base64'),
      ]);
    for (let i = 0; i < 2; i++) {
      const again = await env.call('buildMangroveComponents', d, mode.id, ids);
      assert.deepEqual(copy(again.errors), []);
      assert.equal(again.createdNodeIds.length, 0);
      assert.deepEqual(snap(env), before);
      assert.deepEqual(
        [...env.state.images].map(([id, b]) => [
          id,
          Buffer.from(b).toString('base64'),
        ]),
        images
      );
      await editedCheck();
    }
    console.log(mode.id, 'repeat passed');
  }
  const refusals =
    await require('../holistic/assets/arabic-landing/assert-negatives.cjs').negatives();
  console.log('refusals', refusals);
  fs.writeFileSync(
    process.env.MG_ARABIC_TEST_VERDICT ||
      path.join(
        require('os').tmpdir(),
        'mangrove-arabic-landing-test-verdict.json'
      ),
    JSON.stringify(
      {
        families: 15,
        variants: 72,
        variables: d.variables.length,
        textStyles: d.styles.text.length,
        effectStyles: d.styles.effect.length,
        allFiveBuilderAndTwoRepeats: true,
        nativeAccepted: false,
      },
      null,
      2
    )
  );
}
if (require.main === module)
  main().catch(e => {
    console.error(e.stack);
    process.exitCode = 1;
  });
module.exports = {
  document,
  setup,
  snap,
  walk,
  identity,
  installArabicSvgFixture,
};
