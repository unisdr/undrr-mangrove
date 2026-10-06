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
  buildNewsRelatedCardRecipes,
  buildNewsEditorialRecipes,
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
  doc.components.families.push(
    ...buildNewsRelatedCardRecipes({ root, ...doc })
  );
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
    const viewport = /viewBox="0 0 ([\d.e+-]+) ([\d.e+-]+)"/.exec(raw);
    assert(viewport);
    const width = Number(viewport[1]),
      height = Number(viewport[2]);
    const frame = env.figma.createFrame();
    frame.resize(width, height);
    const vector = env.figma.createVector();
    vector.resize(width, height);
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
    images: [...env.state.images.entries()].map(([hash, bytes]) => [
      hash,
      bytes.length,
    ]),
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
function relatedDocument() {
  const doc = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'))
  );
  doc.components.families = buildNewsRelatedCardRecipes({ root, ...doc });
  return doc;
}
async function relatedTests() {
  const doc = relatedDocument(),
    family = doc.components.families[0];
  assert.strictEqual(family.id, 'news-related-card');
  assert.strictEqual(family.variants.length, 6);
  const old = copy({ variables: doc.variables, styles: doc.styles });
  assert.deepStrictEqual(
    buildNewsRelatedCardRecipes({ root, ...doc }),
    doc.components.families
  );
  assert.deepStrictEqual({ variables: doc.variables, styles: doc.styles }, old);
  for (const mode of doc.modes) {
    const env =
      await require('./mock-rich-text-integration.cjs').rangeEnvironment(doc);
    await installNewsDetailSvgFixture(env);
    await env.call('importVariables', doc, [mode.id], false, [], true);
    const build = () =>
      env.call('buildMangroveComponents', doc, mode.id, ['news-related-card']);
    const first = await build();
    assert.deepStrictEqual(copy(first.errors), []);
    const properties = [];
    const number = name => {
      const value = doc.variables.find(v => v.name === name).values[mode.id];
      return typeof value === 'number' ? value : number(value.alias);
    };
    for (const variant of family.variants) {
      const master = [...env.state.nodes.values()].find(
        n => identity(n) === 'family/news-related-card/variant/' + variant.id
      );
      assert(master);
      assert.strictEqual(master.width, number(variant.tree.layout.width));
      assert.strictEqual(master.height, number(variant.tree.layout.height));
      const title = master
        .findAllWithCriteria({ types: ['TEXT'] })
        .find(n => identity(n).endsWith('/title'));
      assert.strictEqual(title.textDecoration, 'UNDERLINE');
      assert.deepStrictEqual(copy(title.textDecorationOffset), {
        unit: 'PIXELS',
        value: 3,
      });
      assert.strictEqual(title.textWrapStyle, 'BALANCE');
      assert(!title.componentPropertyReferences?.characters);
      assert(
        variant.sourceHref.title.startsWith(
          'https://www.undrr.org/news/related-story-'
        )
      );
      const caret = master.children.find(n =>
        identity(n).endsWith('/initial-caret')
      );
      assert.strictEqual(caret.layoutPositioning, 'ABSOLUTE');
      assert.strictEqual(
        caret.x,
        number(variant.tree.children[2].absolute.offsetX)
      );
      assert.strictEqual(
        caret.y,
        number(variant.tree.children[2].absolute.offsetY)
      );
      assert.deepStrictEqual(copy(caret.constraints), {
        horizontal: 'MIN',
        vertical: 'MIN',
      });
      const visual = master.children.find(n => identity(n).endsWith('/visual'));
      assert.strictEqual(visual.fills[0].type, 'IMAGE');
      assert.strictEqual(
        visual.fills[0].imageHash,
        'c85730db17a9ea844cfcba3d6239b9e94f6a4c0a6a8535855ed2d578c55a7b83'
      );
      assert.strictEqual(visual.strokeAlign, 'OUTSIDE');
      const consumer = master.createInstance();
      env.figma.currentPage.appendChild(consumer);
      consumer.x = 901;
      consumer.y = 702;
      const key = Object.keys(consumer.componentProperties).find(k =>
        k.startsWith('Summary#')
      );
      assert(key);
      const edited = 'Reviewed ' + mode.id + ' summary';
      consumer.setProperties({ [key]: edited });
      properties.push({ consumer, key, edited, main: consumer.main.id });
    }
    assert.strictEqual(env.state.images.size, 1);
    const before = snapshot(env);
    for (let i = 0; i < 2; i++) {
      const repeat = await build();
      assert.deepStrictEqual(copy(repeat.errors), []);
      assert.strictEqual(repeat.createdNodeIds.length, 0);
      assert.strictEqual(snapshot(env), before);
      for (const p of properties) {
        assert.strictEqual(p.consumer.main.id, p.main);
        assert.strictEqual(
          p.consumer.componentProperties[p.key].value,
          p.edited
        );
        assert.strictEqual(p.consumer.x, 901);
        assert.strictEqual(p.consumer.y, 702);
      }
      assert.strictEqual(env.state.images.size, 1);
    }
  }
  for (const font of ['Roboto Condensed Bold', 'Roboto Regular']) {
    const env =
      await require('./mock-rich-text-integration.cjs').rangeEnvironment(doc, {
        rejectedFonts: [font],
      });
    await installNewsDetailSvgFixture(env);
    await env.call('importVariables', doc, ['undrr'], false, [], true);
    const before = snapshot(env),
      refused = await env.call('buildMangroveComponents', doc, 'undrr', [
        'news-related-card',
      ]);
    assert(refused.errors.length);
    assert.strictEqual(snapshot(env), before);
  }
  for (const mutate of [
    d => (d.variables.find(v => v.name === 'card/padding').values.mcr = 16),
    d =>
      (d.variables.find(v => v.name === 'font-family/ui').values.irp =
        'Foreign'),
    d =>
      (d.variables.find(v => v.name === 'color/interactive').values.delta = {
        r: 0,
        g: 0,
        b: 0,
        a: 1,
      }),
    d =>
      (d.variables.find(
        v => v.name === 'effect-color/shadow/raised'
      ).values.irp = { r: 0, g: 0, b: 0, a: 0.24 }),
    d =>
      d.variables.push({
        id: 'component.news-related.zero',
        name: 'Foreign',
        type: 'FLOAT',
        values: {},
      }),
    d =>
      d.styles.text.push({
        id: 'Foreign',
        name: 'Mangrove/source/news-related/title',
        values: {},
      }),
  ]) {
    const d = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'))
    );
    mutate(d);
    const before = copy({ variables: d.variables, styles: d.styles });
    assert.throws(
      () => buildNewsRelatedCardRecipes({ root, ...d }),
      /source changed/
    );
    assert.deepStrictEqual(
      { variables: d.variables, styles: d.styles },
      before
    );
  }
  const read = fs.readFileSync;
  for (const suffix of [
    'related-card-provenance.json',
    'related-card-footprints.json',
    'related-source-photo.jpg',
    'related-caret-mirror-capture.js',
    'RobotoCondensed-Bold.woff2',
  ]) {
    fs.readFileSync = function (file, ...args) {
      const v = read.call(this, file, ...args);
      return typeof file === 'string' && file.endsWith(suffix)
        ? Buffer.isBuffer(v)
          ? Buffer.concat([v, Buffer.from('drift')])
          : v + 'drift'
        : v;
    };
    try {
      assert.throws(relatedDocument, /source changed/);
    } finally {
      fs.readFileSync = read;
    }
  }
  console.log(
    'News related six source presets allfive actual builder, exact nonempty repeat geometry, source asset/cache/alias guards and supported short Summary consumer edits pass. Native title link/caret reflow, fonts/pixels and full article remain open.'
  );
}
if (require.main === module)
  (async () => {
    auditTests();
    await dependencyTests();
    await relatedTests();
    await editorialTests();
  })().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { installNewsDetailSvgFixture };

function editorialDocument() {
  const doc = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'))
  );
  const tag = require('../../../scripts/figma-tag-recipes.cjs').buildTagRecipes(
    { root, ...doc }
  );
  doc.components.families = [
    ...tag,
    ...buildNewsEditorialRecipes({ root, ...doc }),
  ];
  return doc;
}
async function editorialTests() {
  const source = editorialDocument();
  assert.deepStrictEqual(
    source.components.families.map(f => [f.id, f.variants.length]),
    [
      ['tag', 5],
      ['news-taxonomy', 2],
      ['news-recommendations', 2],
    ]
  );
  const initial = copy({ variables: source.variables, styles: source.styles });
  buildNewsEditorialRecipes({ root, ...source });
  assert.deepStrictEqual(
    { variables: source.variables, styles: source.styles },
    initial
  );
  const captures = JSON.parse(
    fs.readFileSync(
      path.join(
        root,
        'examples/figma-plugin/holistic/assets/news-detail/dependency-footprints.json'
      )
    )
  ).primaryScenes;
  for (const mode of source.modes) {
    const doc = editorialDocument(),
      env = await require('./mock-rich-text-integration.cjs').rangeEnvironment(
        doc
      );
    await env.call('importVariables', doc, [mode.id], false, [], true);
    const ids = ['news-taxonomy', 'news-recommendations'],
      build = () => env.call('buildMangroveComponents', doc, mode.id, ids);
    const first = await build();
    assert.deepStrictEqual(copy(first.errors), []);
    const consumers = [],
      rich = [];
    for (const kind of ['taxonomy', 'recommendations'])
      for (const width of [390, 1164]) {
        const master = [...env.state.nodes.values()].find(
          n =>
            identity(n) ===
            'family/news-' + kind + '/variant/news-' + kind + '.' + width
        );
        assert(master);
        const captured = captures[mode.id + '-' + width][kind];
        assert.strictEqual(master.width, captured.rect.width);
        assert.strictEqual(master.height, captured.rect.height);
        const consumer = master.createInstance();
        env.figma.currentPage.appendChild(consumer);
        consumer.x = 911;
        consumer.y = 713;
        for (const name of kind === 'taxonomy'
          ? ['Heading', 'Group 1', 'Group 2', 'Group 3']
          : ['Heading']) {
          const key = Object.keys(consumer.componentProperties).find(k =>
            k.startsWith(name + '#')
          );
          assert(key, name);
          consumer.setProperties({ [key]: 'Edited ' + name });
          consumers.push({ owner: consumer, key, value: 'Edited ' + name });
        }
        if (kind === 'taxonomy') {
          const nodes = master.findAllWithCriteria({ types: ['INSTANCE'] });
          assert.strictEqual(nodes.length, 6);
          const original = nodes.map(n => n.main.id);
          const nested = consumer.findAllWithCriteria({ types: ['INSTANCE'] });
          assert.strictEqual(nested.length, 6);
          for (const [i, node] of nested.entries()) {
            assert(node.main.id === original[i]);
            assert(identity(node.main).includes('variant/tag.default'));
            assert.strictEqual(node.height, 28);
            const key = Object.keys(node.componentProperties).find(k =>
              k.startsWith('Label#')
            );
            assert(key);
            node.setProperties({ [key]: 'Short ' + i });
            consumers.push({
              owner: node,
              key,
              value: 'Short ' + i,
              link: node.main.id,
            });
          }
        } else {
          const sourceText = master
            .findAllWithCriteria({ types: ['TEXT'] })
            .filter(n => n.characters !== "Editors' recommendations");
          assert.strictEqual(sourceText.length, 3);
          const consumerText = consumer
            .findAllWithCriteria({ types: ['TEXT'] })
            .filter(n => !n.componentPropertyReferences?.characters);
          for (const [i, node] of sourceText.entries()) {
            const target = env.attachRichText(consumerText[i], node);
            for (const t of [node, target]) {
              const segments = t.getStyledTextSegments([
                'hyperlink',
                'textDecoration',
              ]);
              assert.strictEqual(segments.length, 1);
              assert(
                segments[0].hyperlink.value.startsWith('https://www.undrr.org/')
              );
              assert.strictEqual(segments[0].textDecoration, 'NONE');
              t.editRich(0, t.characters.length, 'Reviewed link ' + i);
              rich.push(t);
            }
          }
          const markers = master.findAllWithCriteria({ types: ['ELLIPSE'] });
          assert.strictEqual(markers.length, 3);
          for (const marker of markers) {
            assert.strictEqual(marker.width, 16 / 3);
            assert.strictEqual(marker.height, 16 / 3);
            assert.strictEqual(marker.x, -52 / 3);
            assert.strictEqual(marker.y, 25 / 3);
            assert.strictEqual(marker.layoutPositioning, 'ABSOLUTE');
          }
        }
        consumers.push({
          owner: consumer,
          link: consumer.main.id,
          position: [911, 713],
        });
      }
    const richSnapshot = () =>
      JSON.stringify(
        rich.map(n => [
          n.characters,
          n
            .getStyledTextSegments([
              'textStyleId',
              'fontName',
              'fills',
              'hyperlink',
              'textDecoration',
            ])
            .map(r => [
              r.start,
              r.end,
              r.textStyleId,
              r.fontName,
              r.fills,
              r.hyperlink,
              r.textDecoration,
            ]),
        ])
      );
    const geometry = () =>
      JSON.stringify(
        [...env.state.nodes.values()].map(n => [
          n.id,
          n.parent?.id,
          n.type,
          n.type === 'INSTANCE' ? n.main.id : null,
          n.x,
          n.y,
          n.width,
          n.height,
        ])
      );
    const before = snapshot(env),
      geometryBefore = geometry(),
      richBefore = richSnapshot();
    assert(env.state.nodes.size > 30);
    for (let i = 0; i < 2; i++) {
      const repeat = await build();
      assert.deepStrictEqual(copy(repeat.errors), []);
      assert.strictEqual(repeat.createdNodeIds.length, 0);
      assert.strictEqual(snapshot(env), before);
      assert.strictEqual(geometry(), geometryBefore);
      assert.strictEqual(richSnapshot(), richBefore);
      for (const c of consumers) {
        if (c.key)
          assert.strictEqual(c.owner.componentProperties[c.key].value, c.value);
        if (c.link) {
          assert.strictEqual(c.owner.main.id, c.link);
          if (c.position) {
            assert.strictEqual(c.owner.x, c.position[0]);
            assert.strictEqual(c.owner.y, c.position[1]);
          }
        }
      }
    }
  }
  for (const font of [
    'Roboto Regular',
    'Roboto Bold',
    'Roboto Condensed Regular',
  ]) {
    const doc = editorialDocument(),
      env = await require('./mock-rich-text-integration.cjs').rangeEnvironment(
        doc,
        { rejectedFonts: [font] }
      );
    await env.call('importVariables', doc, ['undrr'], false, [], true);
    const before = snapshot(env),
      r = await env.call('buildMangroveComponents', doc, 'undrr', [
        'news-taxonomy',
        'news-recommendations',
      ]);
    assert(r.errors.length);
    assert.strictEqual(snapshot(env), before);
  }
  for (const mutate of [
    d => (d.variables.find(v => v.name === 'radius/tag').values.mcr = 5),
    d =>
      (d.variables.find(v => v.name === 'color/tag').values.irp = {
        r: 0,
        g: 0,
        b: 0,
        a: 1,
      }),
    d =>
      (d.variables.find(v => v.name === 'font-family/text').values.delta =
        'Foreign'),
    d =>
      d.variables.push({
        id: 'component.news-editorial.taxonomy.390.section-width',
        name: 'Foreign',
        type: 'FLOAT',
        values: {},
      }),
  ]) {
    const doc = editorialDocument();
    mutate(doc);
    const before = copy({ variables: doc.variables, styles: doc.styles });
    assert.throws(
      () => buildNewsEditorialRecipes({ root, ...doc }),
      /source changed/
    );
    assert.deepStrictEqual(
      { variables: doc.variables, styles: doc.styles },
      before
    );
  }
  const read = fs.readFileSync;
  fs.readFileSync = function (f, ...args) {
    const x = read.call(this, f, ...args);
    return typeof f === 'string' &&
      f.endsWith('editorial-marker-provenance.json')
      ? Buffer.concat([
          Buffer.isBuffer(x) ? x : Buffer.from(x),
          Buffer.from('drift'),
        ])
      : x;
  };
  try {
    assert.throws(editorialDocument, /marker provenance/);
  } finally {
    fs.readFileSync = read;
  }
  console.log(
    'News taxonomy2/recommendations2 allfive actual builder/two nonempty zero-create geometry repeats, native Tag dependencies and short plain/rich consumer edits pass. UA raster candidate, arbitrary edit reflow, native fonts/pixels/publication remain open.'
  );
}
