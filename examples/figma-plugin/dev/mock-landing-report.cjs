#!/usr/bin/env node
/** Source-only genuine page instances, not native page/publication acceptance. */
'use strict';
const assert = require('assert'),
  fs = require('fs'),
  path = require('path');
const { rangeEnvironment } = require('./mock-rich-text-integration.cjs');
const { installPageChromeSvgFixture } = require('./mock-page-chrome.cjs');
const root = path.resolve(__dirname, '../../..'),
  copy = x => JSON.parse(JSON.stringify(x));
const {
  buildFigmaVariables,
} = require('../../../scripts/build-figma-tokens.cjs');
const {
  buildPageChromeRecipes,
} = require('../../../scripts/figma-page-chrome-recipes.cjs');
const {
  buildPagePatternRecipes,
} = require('../../../scripts/figma-page-pattern-recipes.cjs');
const {
  buildPageReadingRecipes,
} = require('../../../scripts/figma-page-reading-recipes.cjs');
const {
  buildLandingReportRecipes,
  SOURCE_HASHES,
} = require('../../../scripts/figma-landing-report-recipes.cjs');
const walk = n => [n, ...(n.children || []).flatMap(walk)],
  identity = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
function document() {
  const d = buildFigmaVariables();
  d.components.families = [
    ...buildPageChromeRecipes({ root, ...d }),
    ...buildPagePatternRecipes({ root, ...d }),
    ...buildPageReadingRecipes({ root, ...d }),
    ...buildLandingReportRecipes({ root, ...d }),
  ];
  return d;
}
function installLandingReportSvgFixture(env, families) {
  const exact = new Set();
  for (const f of families.filter(f => f.id === 'landing-report-breadcrumb'))
    for (const v of f.variants)
      for (const n of walk(v.tree)) if (n.svg) exact.add(n.svg.markup);
  const previous = env.figma.createNodeFromSvg.bind(env.figma);
  env.figma.createNodeFromSvg = markup => {
    const src = [...exact].find(
      m =>
        markup === m ||
        markup.replace(/ width="[^"]+" height="[^"]+"/, '') === m
    );
    if (!src) return previous(markup);
    const box = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(src);
    assert(box);
    const frame = env.figma.createFrame();
    frame.resize(+box[1], +box[2]);
    const vector = env.figma.createVector();
    vector.resize(frame.width, frame.height);
    vector.vectorPaths = [{ windingRule: 'NONZERO', data: src }];
    vector.fills = [
      { type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 1, visible: true },
    ];
    vector.strokes = [];
    frame.appendChild(vector);
    frame.rescale = scale => {
      frame.resizeWithoutConstraints(frame.width * scale, frame.height * scale);
      vector.resizeWithoutConstraints(
        vector.width * scale,
        vector.height * scale
      );
    };
    return frame;
  };
}
async function main() {
  const d = document(),
    ids = [
      'page-chrome',
      'page-bulleted-toc',
      'landing-report-article-column',
      'landing-report-breadcrumb',
      'landing-report-feature-band',
      'landing-report',
    ];
  assert.deepStrictEqual(copy(d), copy(document()));
  const last = d.components.families.slice(-3);
  assert.deepStrictEqual(
    last.map(f => [f.id, f.variants.length]),
    [
      ['landing-report-breadcrumb', 2],
      ['landing-report-feature-band', 2],
      ['landing-report', 2],
    ]
  );
  const foundations = copy({ variables: d.variables, styles: d.styles });
  assert.deepStrictEqual(buildLandingReportRecipes({ root, ...d }), last);
  assert.deepStrictEqual(
    copy({ variables: d.variables, styles: d.styles }),
    foundations
  );
  for (const mode of d.modes) {
    const env = await rangeEnvironment(d);
    installPageChromeSvgFixture(env, d.components.families);
    installLandingReportSvgFixture(env, d.components.families);
    const imp = await env.call(
      'importVariables',
      d,
      [mode.id],
      false,
      [],
      true
    );
    assert.deepStrictEqual(copy(imp.errors), []);
    const first = await env.call('buildMangroveComponents', d, mode.id, ids);
    assert.deepStrictEqual(copy(first.errors), []);
    const report = first.families.find(f => f.id === 'landing-report');
    assert(report);
    const consumers = [],
      nested = [],
      rich = [];
    for (const v of report.variantIds) {
      const master = env.state.nodes.get(v.nodeId),
        narrow = v.id.endsWith('390'),
        inset = narrow && mode.id === 'undrr' ? 20 : 10;
      assert.strictEqual(master.width, narrow ? 390 : 1164);
      assert.strictEqual(master.children.length, 4);
      const [chrome, breadcrumbFlow, band, readingFlow] = master.children;
      assert.strictEqual(chrome.type, 'INSTANCE');
      assert(chrome.main);
      assert.strictEqual(chrome.height, narrow ? 118 : 131);
      assert.strictEqual(breadcrumbFlow.paddingTop, 10);
      assert.strictEqual(breadcrumbFlow.paddingBottom, 15);
      assert.strictEqual(breadcrumbFlow.paddingLeft, inset);
      assert.strictEqual(breadcrumbFlow.children[0].type, 'INSTANCE');
      assert.strictEqual(band.type, 'INSTANCE');
      assert.strictEqual(band.paddingTop, 60);
      assert.strictEqual(band.paddingBottom, narrow ? 68 : 73);
      assert.strictEqual(band.paddingLeft, inset);
      assert.strictEqual(readingFlow.paddingTop, 15);
      const grid = readingFlow.children[0];
      assert.strictEqual(grid.layoutMode, narrow ? 'VERTICAL' : 'HORIZONTAL');
      assert.strictEqual(grid.itemSpacing, narrow ? 24 : 30);
      assert.strictEqual(grid.width, narrow ? 390 - 2 * inset : 1022);
      const tocFlow = grid.children[narrow ? 0 : 1],
        article = grid.children[narrow ? 1 : 0];
      assert.strictEqual(tocFlow.paddingBottom, 5);
      assert.strictEqual(tocFlow.children[0].type, 'INSTANCE');
      assert.strictEqual(article.type, 'INSTANCE');
      assert.strictEqual(article.width, narrow ? 390 - 2 * inset : 736);
      assert.strictEqual(article.children.length, 4);
      assert.strictEqual(tocFlow.children[0].children.length, 2);
      const crumbNodes = walk(breadcrumbFlow);
      const current = crumbNodes.find(
        n => n.type === 'TEXT' && n.name === 'current'
      );
      assert(current);
      assert.strictEqual(
        current.parent.width,
        narrow ? 390 - 2 * inset : 359.5625
      );
      assert.strictEqual(current.parent.height, narrow ? 48 : 24);
      const localStyle = env.state.styles.find(
        s => s.id === current.textStyleId
      );
      assert(localStyle);
      assert.strictEqual(localStyle.paragraphIndent, 28);
      const sep = crumbNodes.find(
        n => n.name === 'Source rotated breadcrumb border' && n.y > 20
      );
      if (narrow) assert(sep);
      const sourceRich = walk(article.main).find(
        n =>
          n.type === 'TEXT' &&
          n.getStyledTextSegments &&
          n.getStyledTextSegments(['hyperlink']).some(s => s.hyperlink)
      );
      assert(sourceRich);
      const articleRich = env.attachRichText(
        walk(article).find(
          n => n.type === 'TEXT' && n.characters === sourceRich.characters
        ),
        sourceRich
      );
      const consumer = master.createInstance();
      consumer.x = 203;
      consumer.y = 409;
      consumers.push(consumer);
      const cArticle = walk(consumer).find(
        n => n.type === 'INSTANCE' && n.main === article.main
      );
      assert(cArticle);
      const cRich = env.attachRichText(
        walk(cArticle).find(
          n => n.type === 'TEXT' && n.characters === articleRich.characters
        ),
        articleRich
      );
      for (const n of [articleRich, cRich]) {
        const seg = n
          .getStyledTextSegments(['hyperlink'])
          .find(s => s.hyperlink);
        n.editRich(seg.start, seg.end, 'Consumer edited actual report link');
        rich.push(n);
      }
      for (const n of walk(consumer).filter(
        n => n.type === 'INSTANCE' && n !== consumer
      )) {
        const key = Object.keys(n.componentProperties).find(
          k => n.componentProperties[k].type === 'TEXT'
        );
        if (key) {
          n.setProperties({ [key]: 'Edited nested report content' });
          nested.push({ n, key });
        }
      }
      assert.strictEqual(
        walk(master).filter(n => n.type === 'INSTANCE').length,
        5
      );
      assert.strictEqual(
        walk(consumer).filter(n => n.type === 'INSTANCE').length,
        6
      );
    }
    const snapshot = () =>
        JSON.stringify(
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
              n.type === 'INSTANCE' ? n.main.id : null,
            ])
        ),
      before = snapshot(),
      richSnapshot = () =>
        JSON.stringify(
          rich.map(n => [
            n.id,
            n.characters,
            n.getStyledTextSegments([
              'textStyleId',
              'fills',
              'hyperlink',
              'textDecoration',
            ]),
          ])
        ),
      richBefore = richSnapshot();
    for (let repeat = 0; repeat < 2; repeat++) {
      const r = await env.call('buildMangroveComponents', d, mode.id, ids);
      assert.deepStrictEqual(copy(r.errors), []);
      assert.strictEqual(r.createdNodeIds.length, 0);
      assert.strictEqual(snapshot(), before);
      assert.strictEqual(richSnapshot(), richBefore);
      for (const c of consumers) {
        assert(!c.removed);
        assert.strictEqual(c.x, 203);
        assert.strictEqual(c.y, 409);
      }
      for (const { n, key } of nested) {
        assert(!n.removed);
        assert.strictEqual(
          n.componentProperties[key].value,
          'Edited nested report content'
        );
      }
    }
    console.log(
      `landing report ${mode.id}: genuine nested instances, source allocations, two zero-create repeats and edited content pass`
    );
  }
  const read = fs.readFileSync;
  for (const file of Object.keys(SOURCE_HASHES)) {
    fs.readFileSync = function (f, ...args) {
      const x = read.call(this, f, ...args);
      if (typeof f === 'string' && f === path.join(root, file))
        return Buffer.isBuffer(x)
          ? Buffer.concat([x, Buffer.from('\nsource mutation')])
          : x + '\nsource mutation';
      return x;
    };
    try {
      assert.throws(
        () => buildLandingReportRecipes({ root, ...copy(d) }),
        /recipe needs updating/
      );
    } finally {
      fs.readFileSync = read;
    }
  }
  for (const group of ['variables', 'styles']) {
    const foreign = document();
    if (group === 'variables')
      foreign.variables.find(
        v => v.name === 'component/landing-report/narrow-inset'
      ).name = 'Foreign owner';
    else
      foreign.styles.text.find(
        s => s.id === 'component.landing-report.breadcrumb-current'
      ).name = 'Foreign owner';
    assert.throws(
      () => buildLandingReportRecipes({ root, ...foreign }),
      /Foreign identity/
    );
  }
  for (const invalid of [-1, Number.NaN, Number.POSITIVE_INFINITY, '28']) {
    const malformed = copy(d);
    malformed.styles.text.find(
      s => s.id === 'component.landing-report.breadcrumb-current'
    ).values.mcr.paragraphIndent = invalid;
    const env = await rangeEnvironment(malformed);
    installPageChromeSvgFixture(env, malformed.components.families);
    installLandingReportSvgFixture(env, malformed.components.families);
    const beforeNodes = env.state.nodes.size,
      beforeStyles = env.state.styles.length;
    await assert.rejects(
      () => env.call('importVariables', malformed, ['undrr'], false, [], true),
      /paragraph indent/
    );
    assert.strictEqual(env.state.nodes.size, beforeNodes);
    assert.strictEqual(env.state.styles.length, beforeStyles);
    await env.call('importVariables', d, ['undrr'], false, [], false);
    const rejected = await env.call(
      'buildMangroveComponents',
      malformed,
      'undrr',
      ids
    );
    assert(rejected.errors.some(e => e.includes('paragraph indent')));
    assert.strictEqual(rejected.createdNodeIds.length, 0);
    assert.strictEqual(env.state.nodes.size, beforeNodes);
  }
  const bad = await rangeEnvironment(d);
  installPageChromeSvgFixture(bad, d.components.families);
  installLandingReportSvgFixture(bad, d.components.families);
  await bad.call('importVariables', d, ['undrr'], false, [], true);
  const load = bad.figma.loadFontAsync;
  bad.figma.loadFontAsync = async font => {
    if (font.family === 'Roboto Condensed' && font.style === 'Bold')
      throw Error('missing actual condensed bold');
    return load(font);
  };
  const before = bad.state.nodes.size,
    r = await bad.call('buildMangroveComponents', d, 'undrr', ids);
  assert(r.errors.length);
  assert.strictEqual(bad.state.nodes.size, before);
}
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { main, installLandingReportSvgFixture };
