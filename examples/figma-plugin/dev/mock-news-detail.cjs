#!/usr/bin/env node
/** Honest prerequisite source guards, not a native assembly mock. */
'use strict';
const assert = require('assert'),
  fs = require('fs'),
  path = require('path'),
  os = require('os');
const {
  inspectNewsDetailPrerequisites,
  buildNewsDetailRecipes,
  buildNewsDetailDependencyRecipes,
} = require('../../../scripts/figma-news-detail-recipes.cjs');
const root = path.resolve(__dirname, '../../..');
function auditTests() {
  const report = inspectNewsDetailPrerequisites({ root });
  assert.strictEqual(report.assemblyReady, false);
  assert.deepStrictEqual(report.families, []);
  assert.strictEqual(report.sourceSceneCount, 50);
  assert.strictEqual(report.dependencies.length, 12);
  assert.throws(
    () => buildNewsDetailRecipes({ root }),
    /article-float-highlight.*embed-container/
  );
  report.dependencies[0].status = 'invented-pass';
  assert.notStrictEqual(
    inspectNewsDetailPrerequisites({ root }).dependencies[0].status,
    'invented-pass'
  );
  const tmp = fs.mkdtempSync(
    path.join(os.tmpdir(), 'mangrove-news-prerequisites-')
  );
  try {
    const prov =
        'examples/figma-plugin/holistic/assets/news-detail/provenance.json',
      metadata = JSON.parse(fs.readFileSync(path.join(root, prov)));
    for (const file of [prov, ...Object.keys(metadata.sourceHashes)]) {
      const target = path.join(tmp, file);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(path.join(root, file), target);
    }
    for (const file of [
      'stories/Patterns/ArticleStory/ArticleStory.jsx',
      'stories/Components/HighlightBox/highlight-box.scss',
      'stories/Components/Buttons/ShareButtons/share-buttons.scss',
      'examples/figma-plugin/holistic/assets/news-detail/source-footprints.json',
      'examples/figma-plugin/holistic/assets/news-detail/source-capture.js',
      'examples/figma-plugin/holistic/assets/news-detail/float-capture.js',
      'stories/assets/css/style.css',
      'examples/figma-plugin/holistic/assets/page-reading/source-fonts/Roboto-BoldItalic.woff2',
    ]) {
      const target = path.join(tmp, file),
        original = fs.readFileSync(target);
      fs.appendFileSync(target, '\nsource drift');
      assert.throws(
        () => inspectNewsDetailPrerequisites({ root: tmp }),
        /source contract changed/
      );
      fs.writeFileSync(target, original);
    }
    const target = path.join(tmp, prov);
    fs.appendFileSync(target, ' ');
    assert.throws(
      () => inspectNewsDetailPrerequisites({ root: tmp }),
      /provenance changed/
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log(
    'News detail50 source scenes/10 float diagnostics guarded; missing higher-order prerequisites refuse full assembly. No native build/zero-create claim.'
  );
}

const { environment } = require('./mock-kit.cjs');
const copy = x => JSON.parse(JSON.stringify(x));
const identity = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
function dependencyDocument() {
  const doc = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'))
  );
  const tag = require('../../../scripts/figma-tag-recipes.cjs').buildTagRecipes(
    { root, ...doc }
  );
  doc.components.families = [
    ...tag,
    ...buildNewsDetailDependencyRecipes({ root, ...doc }),
  ];
  return doc;
}
/** Exact markup whitelist, synthetic vector viewport/paint only. No native path rasterisation. */
function installNewsDetailSvgFixture(env) {
  const doc = dependencyDocument(),
    expected = new Set();
  function visit(t) {
    if (t.type === 'SVG') expected.add(t.svg.markup);
    for (const c of t.children || []) visit(c);
  }
  for (const f of doc.components.families)
    for (const v of f.variants) visit(v.tree);
  const previous = env.figma.createNodeFromSvg.bind(env.figma);
  env.figma.createNodeFromSvg = markup => {
    const raw = markup.replace(/ width="[\d.]+" height="[\d.]+"/, '');
    if (!expected.has(raw)) return previous(markup);
    const frame = env.figma.createFrame();
    frame.resize(24, 24);
    const vector = env.figma.createVector();
    vector.resize(24, 24);
    vector.vectorPaths = [
      {
        windingRule: 'NONZERO',
        data: /<path d="([^"]+)"/.exec(raw)?.[1] || 'M0 0',
      },
    ];
    vector.constraints = { horizontal: 'MIN', vertical: 'MIN' };
    vector.strokeAlign = 'CENTER';
    const stroked = raw.includes('stroke="');
    vector.strokeWeight = stroked ? 2 : 0;
    const black = {
      type: 'SOLID',
      color: { r: 0, g: 0, b: 0 },
      opacity: 1,
      visible: true,
    };
    vector.strokes = stroked ? [black] : [];
    vector.fills = stroked ? [] : [black];
    frame.appendChild(vector);
    frame.rescale = scale => {
      frame.resizeWithoutConstraints(frame.width * scale, frame.height * scale);
      vector.resizeWithoutConstraints(
        vector.width * scale,
        vector.height * scale
      );
      vector.strokeWeight *= scale;
    };
    return frame;
  };
  return env.runCode(
    fs.readFileSync(path.join(__dirname, '../kit-svg-sizing.js'), 'utf8') +
      '\nglobalThis.mgSvgSizingPlan=mgSvgSizingPlan;globalThis.mgSvgSizingDocumentValues=mgSvgSizingDocumentValues;globalThis.mgSvgSizingNativeValues=mgSvgSizingNativeValues;globalThis.mgSvgSizingNativePlan=mgSvgSizingNativePlan;globalThis.mgApplySvgSizing=mgApplySvgSizing;'
  );
}
const snapshot = env =>
  JSON.stringify({
    nodes: [...env.state.nodes.values()].map(n => [
      n.id,
      identity(n),
      n.x,
      n.y,
      n.width,
      n.height,
      n.type === 'TEXT' ? n.characters : null,
      n.vectorPaths,
      n.strokeWeight,
      n.boundVariables,
    ]),
    styles: env.state.styles,
    variables: env.state.variables,
    collections: env.state.collections,
  });
async function dependencyTests() {
  const source = dependencyDocument();
  assert.deepStrictEqual(
    source.components.families.map(f => [f.id, f.variants.length]),
    [
      ['tag', 5],
      ['article-header', 2],
      ['share-buttons', 4],
    ]
  );
  const original = copy({ variables: source.variables, styles: source.styles });
  buildNewsDetailDependencyRecipes({ root, ...source });
  assert.deepStrictEqual(
    { variables: source.variables, styles: source.styles },
    original
  );
  for (const mode of source.modes) {
    const doc = dependencyDocument(),
      env = await require('./mock-rich-text-integration.cjs').rangeEnvironment(
        doc
      );
    await installNewsDetailSvgFixture(env);
    await env.call('importVariables', doc, [mode.id], false, [], false);
    const build = () =>
      env.call('buildMangroveComponents', doc, mode.id, [
        'share-buttons',
        'article-header',
      ]);
    const first = await build();
    assert.deepStrictEqual(copy(first.errors), []);
    const component = [...env.state.nodes.values()].find(
      n =>
        identity(n) === 'family/share-buttons/variant/share-buttons.390.device'
    );
    assert(component);
    const consumer = component.createInstance();
    env.figma.currentPage.appendChild(consumer);
    for (const [name, value] of [
      ['Heading', 'My heading'],
      ['Visible link', 'example.test/'],
    ]) {
      const k = Object.keys(consumer.componentProperties).find(k =>
        k.startsWith(name + '#')
      );
      assert(k);
      consumer.setProperties({ [k]: value });
    }
    consumer.x = 900;
    consumer.y = 700;
    const richNodes = [];
    for (const viewport of [390, 1164]) {
      const header = [...env.state.nodes.values()].find(
        n =>
          identity(n) ===
          'family/article-header/variant/article-header.' + viewport + '.none'
      );
      assert(header);
      const heading = header
        .findAllWithCriteria({ types: ['TEXT'] })
        .find(n => identity(n).endsWith('/title'));
      assert.strictEqual(heading.textWrapStyle, 'BALANCE');
      assert.strictEqual(
        heading.letterSpacing.value,
        viewport === 390 ? 0.72 : 0.8
      );
      const summary = header
        .findAllWithCriteria({ types: ['TEXT'] })
        .find(n => identity(n).endsWith('/summary'));
      assert.strictEqual(summary.textWrapStyle, 'BALANCE');
      const instance = header.createInstance();
      env.figma.currentPage.appendChild(instance);
      for (const name of ['Title', 'Summary']) {
        const key = Object.keys(instance.componentProperties).find(k =>
          k.startsWith(name + '#')
        );
        assert(key);
        instance.setProperties({ [key]: 'Edited ' + name });
      }
      const metadata = header
        .findAllWithCriteria({ types: ['TEXT'] })
        .find(n => identity(n).endsWith('/metadata'));
      assert(metadata);
      assert.strictEqual(metadata.textWrapStyle, 'BALANCE');
      const cloned = instance
        .findAllWithCriteria({ types: ['TEXT'] })
        .find(n => n.characters === metadata.characters);
      assert(cloned);
      const target = env.attachRichText(cloned, metadata);
      for (const n of [metadata, target]) {
        const link = n
          .getStyledTextSegments(['hyperlink'])
          .find(r => r.hyperlink);
        assert(link.hyperlink.value.startsWith('https://'));
        n.editRich(link.start, link.end, 'Edited organisation');
        richNodes.push(n);
      }
    }
    const richSnapshot = () =>
      JSON.stringify(
        richNodes.map(n => [
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
      );
    const richBefore = richSnapshot();
    const before = snapshot(env),
      link = consumer.main.id;
    for (let i = 0; i < 2; i++) {
      const repeat = await build();
      assert.deepStrictEqual(copy(repeat.errors), []);
      assert.strictEqual(repeat.createdNodeIds.length, 0);
      assert.strictEqual(snapshot(env), before);
      assert.strictEqual(consumer.main.id, link);
      assert.strictEqual(richSnapshot(), richBefore);
    }
    const svg = [...env.state.nodes.values()].find(
      n =>
        identity(n) ===
        'family/share-buttons/variant/share-buttons.390.device/actions/action-share/icon-share'
    );
    assert.strictEqual(svg.width, 18);
    assert.strictEqual(svg.children[0].strokeWeight, 1.5);
    const originalPaths = copy(svg.children[0].vectorPaths),
      originalStroke = svg.children[0].strokeWeight;
    for (const mutate of [
      () => (svg.children[0].strokeWeight = 3),
      () =>
        (svg.children[0].vectorPaths = [
          { windingRule: 'NONZERO', data: 'M0 0L1 1' },
        ]),
    ]) {
      mutate();
      const before = snapshot(env),
        refused = await build();
      assert(refused.errors.length);
      assert.strictEqual(snapshot(env), before);
      svg.children[0].vectorPaths = copy(originalPaths);
      svg.children[0].strokeWeight = originalStroke;
    }
  }
  for (const mutate of [
    d => (d.variables.find(v => v.name === 'spacing/100').values.delta = 11),
    d =>
      (d.variables.find(v => v.name === 'font-family/text').values.mcr =
        'Foreign'),
    d =>
      d.variables.push({
        id: 'component.news-dependency.one',
        name: 'foreign',
        type: 'FLOAT',
        values: {},
      }),
    d =>
      d.styles.text.push({
        id: 'foreign',
        name: 'Mangrove/source/news-dependency/share-copy',
        values: {},
      }),
  ]) {
    const doc = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'))
    );
    mutate(doc);
    const before = JSON.stringify({
      variables: doc.variables,
      styles: doc.styles,
    });
    assert.throws(
      () => buildNewsDetailDependencyRecipes({ root, ...doc }),
      /source changed/
    );
    assert.strictEqual(
      JSON.stringify({ variables: doc.variables, styles: doc.styles }),
      before
    );
  }
  for (const rejectedFont of ['Roboto Bold', 'Roboto Condensed Regular']) {
    const doc = dependencyDocument(),
      env = await require('./mock-rich-text-integration.cjs').rangeEnvironment(
        doc,
        { rejectedFonts: [rejectedFont] }
      );
    await installNewsDetailSvgFixture(env);
    const imported = await env.call(
      'importVariables',
      doc,
      ['undrr'],
      false,
      [],
      true
    );
    assert.strictEqual(imported.errors.length, 0);
    const before = snapshot(env);
    const refused = await env.call('buildMangroveComponents', doc, 'undrr', [
      'article-header',
      'share-buttons',
    ]);
    assert(refused.errors.length);
    assert.strictEqual(snapshot(env), before);
  }
  const read = fs.readFileSync;
  for (const suffix of [
    'dependency-footprints.json',
    'dependency-capture.js',
    'dependency-provenance.json',
    '_icon-definitions.scss',
  ]) {
    fs.readFileSync = function (file, ...args) {
      const value = read.call(this, file, ...args);
      if (typeof file === 'string' && file.endsWith(suffix))
        return Buffer.isBuffer(value)
          ? Buffer.concat([value, Buffer.from('\nsource drift')])
          : value + '\nsource drift';
      return value;
    };
    try {
      assert.throws(
        dependencyDocument,
        /source.*changed|source contract changed/
      );
    } finally {
      fs.readFileSync = read;
    }
  }
  console.log(
    'News ArticleHeader2/ShareButtons4 finite source variants: all5 actual builder, two zero-create repeats/plain properties and source/consumer rich edits, SVG sizing fixtures pass. Exact native paths/modes/rendering/publication and complete article remain open.'
  );
}
if (require.main === module)
  (async () => {
    auditTests();
    await dependencyTests();
  })().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { installNewsDetailSvgFixture };
