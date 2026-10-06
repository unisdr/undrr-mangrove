#!/usr/bin/env node
/** Deterministic authored frontend inputs. No server or assembled/native widget claim. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  buildSearchWidgetFixtures,
  inspectSearchWidgetSource,
  inspectSearchWidgetCapacity,
  buildSearchWidgetRecipes,
} = require('../../../scripts/figma-search-widget-recipes.cjs');
const {
  buildSearchResultFixtures,
} = require('../../../scripts/figma-search-result-recipes.cjs');
const root = path.resolve(__dirname, '../../..');
const copy = x => JSON.parse(JSON.stringify(x));
/** Exact bounded source SVG profiles; no general SVG parsing or raster proof. */
function installWidgetSvgFixture(env, families) {
  const walk = n => [n, ...(n.children || []).flatMap(walk)];
  const assets = new Map();
  families.forEach(f =>
    f.variants.forEach(v =>
      walk(v.tree)
        .filter(n => n.svg)
        .forEach(n => assets.set(n.svg.assetId, n.svg.markup))
    )
  );
  const paths = {
    'search-control.search': [
      'm21 21-4.34-4.34',
      'M19 11A8 8 0 1 1 3 11A8 8 0 1 1 19 11Z',
    ],
    'search-control.close': ['M18 6 6 18M6 6l12 12'],
    'search-widget-svg-b1a3993fa6fda0c8': ['M3 4.5L6 7.5L9 4.5'],
    'search-widget-svg-d3184f5f3d2fc50f': ['M10 3L4.5 8.5L2 6'],
    'search-widget-svg-ee01b0f5e8b8fbf8': ['M15 18L9 12L15 6'],
    'search-widget-svg-c6b3db5fecb76195': ['M9 18L15 12L9 6'],
    'search-widget-svg-85cefbb1f30aa9ae': ['M18 6L6 18', 'M6 6L18 18'],
    'search-widget-svg-db7c8c86a1359f1d': [
      'M22 3L2 3L10 12.46L10 19L14 21L14 12.46L22 3Z',
    ],
  };
  assert.deepStrictEqual([...assets.keys()].sort(), Object.keys(paths).sort());
  const previous = env.figma.createNodeFromSvg.bind(env.figma);
  env.figma.createNodeFromSvg = markup => {
    const normalize = text => text.replace(/\s+(?:width|height)="[^"]*"/g, '');
    const asset = [...assets].find(
      ([, source]) => normalize(source) === normalize(markup)
    )?.[0];
    if (!asset) return previous(markup);
    const sourceSize = Number(/viewBox="0 0 (\d+)/.exec(markup)[1]);
    assert([12, 24].includes(sourceSize));
    const frame = env.figma.createFrame();
    frame.resize(sourceSize, sourceSize);
    frame.rescale = scale => {
      frame.resizeWithoutConstraints(frame.width * scale, frame.height * scale);
      for (const child of frame.children) {
        child.resizeWithoutConstraints(
          child.width * scale,
          child.height * scale
        );
        child.strokeWeight *= scale;
      }
    };
    for (const data of paths[asset]) {
      const vector = env.figma.createVector();
      vector.resize(sourceSize, sourceSize);
      vector.vectorPaths = [{ windingRule: 'NONZERO', data }];
      vector.fills = [];
      vector.strokes = [
        {
          type: 'SOLID',
          color: { r: 0, g: 0, b: 0 },
          opacity: 1,
          visible: true,
        },
      ];
      vector.strokeWeight = 2;
      vector.strokeAlign = 'CENTER';
      vector.constraints = { horizontal: 'MIN', vertical: 'MIN' };
      frame.appendChild(vector);
    }
    return frame;
  };
}
async function assembly(doc, families) {
  const { rangeEnvironment } = require('./mock-rich-text-integration.cjs');
  const {
    installNativeTextPropertyDefaultFixture,
  } = require('./mock-search-results.cjs');
  const walk = n => [n, ...(n.children || []).flatMap(walk)];
  const identity = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
  const master = n => {
    for (let p = n.parent; p; p = p.parent)
      if (p.type === 'INSTANCE') return false;
    return true;
  };
  const native = { ...doc, components: { ...doc.components, families } };
  for (const mode of doc.modes) {
    const env = await rangeEnvironment(native);
    installNativeTextPropertyDefaultFixture(env);
    installWidgetSvgFixture(env, families);
    await env.runCode(
      fs.readFileSync(path.join(__dirname, '../kit-svg-sizing.js'), 'utf8') +
        '\nObject.assign(globalThis,{mgSvgSizingPlan,mgSvgSizingDocumentValues,mgSvgSizingSourceValues,mgSvgSizingNativeValues,mgSvgSizingNativePlan,mgApplySvgSizing});'
    );
    await env.call('importVariables', native, [mode.id], false, [], false);
    const ids = families.map(f => f.id);
    const first = await env.call(
      'buildMangroveComponents',
      native,
      mode.id,
      ids
    );
    assert.deepStrictEqual(copy(first.errors), []);
    assert(first.createdNodeIds.length);
    assert.strictEqual(
      env.state.images.size,
      3,
      'Three genuine pinned source photos cached once'
    );
    const sourceCopy = () => {
      for (const f of families)
        for (const v of f.variants)
          for (const t of walk(v.tree))
            if (t.textProperty) {
              const node = [...env.state.nodes.values()].find(
                n =>
                  n.type === 'TEXT' &&
                  master(n) &&
                  identity(n).includes('/variant/' + v.id + '/') &&
                  identity(n).endsWith('/' + t.id)
              );
              assert(node, t.id);
              assert.strictEqual(node.characters, t.characters);
            }
    };
    sourceCopy();
    const resolve = (name, seen = new Set()) => {
      assert(!seen.has(name));
      seen.add(name);
      const role = doc.variables.find(v => v.name === name);
      assert(role);
      const value = role.values[mode.id];
      return value?.alias ? resolve(value.alias, seen) : value;
    };
    for (const f of families)
      for (const v of f.variants)
        for (const spec of walk(v.tree))
          if (spec.bindings?.opacity) {
            const node = [...env.state.nodes.values()].find(
              n =>
                master(n) &&
                (spec === v.tree
                  ? identity(n) === 'family/' + f.id + '/variant/' + v.id
                  : identity(n).includes('/variant/' + v.id + '/') &&
                    identity(n).endsWith('/' + spec.id))
            );
            assert(node, spec.id + ' ' + v.id);
            assert.strictEqual(
              node.opacity,
              resolve(spec.bindings.opacity) / 100,
              'CSS opacity normalization'
            );
          }
    for (const f of families)
      for (const v of f.variants)
        for (const spec of walk(v.tree))
          if (spec.gradient) {
            const node = [...env.state.nodes.values()].find(
              n =>
                master(n) &&
                identity(n).includes('/variant/' + v.id + '/') &&
                identity(n).endsWith('/' + spec.id)
            );
            assert(node);
            const layer = spec.gradient.layers[0];
            const expected = layer.transform.map((row, i) =>
              row.map((literal, j) =>
                layer.transformVariables[i][j] === null
                  ? literal
                  : resolve(layer.transformVariables[i][j])
              )
            );
            assert.deepStrictEqual(
              copy(node.fills[0].gradientTransform),
              expected,
              'Source per-mode matrix values'
            );
          }
    for (const f of families)
      for (const v of f.variants)
        for (const spec of walk(v.tree))
          if (spec.type === 'FRAME' || spec.type === 'INSTANCE') {
            const node = [...env.state.nodes.values()].find(
              n =>
                master(n) &&
                (spec === v.tree
                  ? identity(n) === 'family/' + f.id + '/variant/' + v.id
                  : identity(n).includes('/variant/' + v.id + '/') &&
                    identity(n).endsWith('/' + spec.id))
            );
            assert(node, spec.id);
            for (const [field, value] of Object.entries({
              width: spec.layout?.width,
              height: spec.layout?.height,
            }))
              if (
                typeof value === 'number' ||
                (typeof value === 'string' && !['HUG', 'FILL'].includes(value))
              )
                assert.strictEqual(
                  node[field],
                  typeof value === 'number' ? value : resolve(value),
                  'Finite source allocation ' + field + ' ' + spec.id
                );
            if (spec.absolute) {
              assert.strictEqual(node.x, resolve(spec.absolute.offsetX));
              assert.strictEqual(node.y, resolve(spec.absolute.offsetY));
            }
          }
    const formMaster = [...env.state.nodes.values()].find(
      n =>
        n.type === 'COMPONENT' &&
        identity(n).includes('/variant/search-widget-form-context.default.390.')
    );
    assert(formMaster);
    const consumer = formMaster.createInstance();
    env.figma.currentPage.appendChild(consumer);
    const label = consumer
      .findAllWithCriteria({ types: ['TEXT'] })
      .find(n => n.componentPropertyReferences?.characters);
    assert(label);
    const key = label.componentPropertyReferences.characters;
    const descriptor = Object.getOwnPropertyDescriptor(label, 'characters');
    Object.defineProperty(label, 'characters', {
      configurable: true,
      get() {
        return consumer.componentProperties[key].value;
      },
      set(value) {
        descriptor.set.call(this, value);
      },
    });
    consumer.setProperties({ [key]: 'Reviewed query' });
    assert.strictEqual(label.characters, 'Reviewed query');
    const richMaster = [...env.state.nodes.values()].find(
      n =>
        n.type === 'TEXT' &&
        master(n) &&
        n
          .getStyledTextSegments?.(['hyperlink'])
          .some(r => r.hyperlink?.type === 'URL')
    );
    assert(richMaster);
    let richComponent = richMaster.parent;
    while (richComponent.type !== 'COMPONENT')
      richComponent = richComponent.parent;
    const richConsumer = richComponent.createInstance();
    env.figma.currentPage.appendChild(richConsumer);
    const clone = richConsumer
      .findAllWithCriteria({ types: ['TEXT'] })
      .find(n => identity(n) === identity(richMaster));
    assert(clone);
    const rich = env.attachRichText(clone, richMaster);
    const link = rich
      .getStyledTextSegments(['hyperlink'])
      .find(r => r.hyperlink?.type === 'URL');
    rich.editRich(link.start, link.end, 'Reviewed linked copy');
    const richBefore = copy({
      characters: rich.characters,
      runs: rich.getStyledTextSegments([
        'textStyleId',
        'fills',
        'hyperlink',
        'textDecoration',
      ]),
    });
    const snapshot = () =>
      JSON.stringify({
        nodes: [...env.state.nodes.values()].map(n => [
          n.id,
          n.parent?.id,
          n.type,
          n.x,
          n.y,
          n.width,
          n.height,
          n.opacity,
          n.explicitVariableModes,
          n.boundVariables,
          n.fills,
          n.strokes,
          n.effects,
          n.effectStyleId,
          n.type === 'INSTANCE' ? n.componentProperties : null,
          n.type === 'TEXT'
            ? [
                n.characters,
                n.fontName,
                n.textStyleId,
                n.componentPropertyReferences,
              ]
            : null,
          n.type === 'COMPONENT_SET' ? n.componentPropertyDefinitions : null,
        ]),
        styles: env.state.styles,
        images: [...env.state.images.keys()],
      });
    const before = snapshot();
    for (let i = 0; i < 2; i++) {
      const repeat = await env.call(
        'buildMangroveComponents',
        native,
        mode.id,
        ids
      );
      assert.deepStrictEqual(copy(repeat.errors), []);
      assert.strictEqual(repeat.createdNodeIds.length, 0);
      sourceCopy();
      assert.strictEqual(label.characters, 'Reviewed query');
      assert.strictEqual(consumer.main.id, formMaster.id);
      assert.deepStrictEqual(
        copy({
          characters: rich.characters,
          runs: rich.getStyledTextSegments([
            'textStyleId',
            'fills',
            'hyperlink',
            'textDecoration',
          ]),
        }),
        richBefore
      );
      assert.strictEqual(richConsumer.main.id, richComponent.id);
      assert.strictEqual(snapshot(), before);
    }
    console.log(
      'Widget actual-builder modeled source mode ' +
        mode.id +
        ' ' +
        first.createdNodeIds.length +
        ' nodes, two zero-create repeats'
    );
  }
  const missing = await rangeEnvironment(native);
  installWidgetSvgFixture(missing, families);
  await missing.runCode(
    fs.readFileSync(path.join(__dirname, '../kit-svg-sizing.js'), 'utf8') +
      '\nObject.assign(globalThis,{mgSvgSizingPlan,mgSvgSizingDocumentValues,mgSvgSizingSourceValues,mgSvgSizingNativeValues,mgSvgSizingNativePlan,mgApplySvgSizing});'
  );
  await missing.call('importVariables', native, ['undrr'], false, [], false);
  const inventory = missing.figma.listAvailableFontsAsync;
  missing.figma.listAvailableFontsAsync = async () =>
    (await inventory()).filter(
      f => !(f.fontName.family === 'Roboto' && f.fontName.style === 'Italic')
    );
  const prior = {
    nodes: missing.state.nodes.size,
    styles: copy(missing.state.styles),
    images: [...missing.state.images.keys()],
  };
  const refusal = await missing.call(
    'buildMangroveComponents',
    native,
    'undrr',
    families.map(f => f.id)
  );
  assert(refusal.errors.some(e => /Roboto.*Italic|Italic.*Roboto/.test(e)));
  assert.deepStrictEqual(
    {
      nodes: missing.state.nodes.size,
      styles: copy(missing.state.styles),
      images: [...missing.state.images.keys()],
    },
    prior,
    'Missing required font refuses before scene/style/image mutations'
  );
}
async function main() {
  const {
    buildFigmaVariables,
  } = require('../../../scripts/build-figma-tokens.cjs');
  const doc = buildFigmaVariables();
  const originalFoundation = copy(doc);
  const families = buildSearchWidgetRecipes({ root, ...doc });
  assert.deepStrictEqual(
    families.map(f => [f.id, f.variants.length]),
    [
      ['search-widget-form-context', 40],
      ['search-widget-result-context', 134],
      ['search-widget-select-context', 104],
      ['search-widget-facets-context', 21],
      ['search-widget-pager-context', 36],
      ['search-widget-drawer-context', 4],
      ['search-widget', 44],
    ]
  );
  const prepared = copy({ variables: doc.variables, styles: doc.styles });
  assert.deepStrictEqual(buildSearchWidgetRecipes({ root, ...doc }), families);
  assert.deepStrictEqual(
    copy({ variables: doc.variables, styles: doc.styles }),
    prepared
  );
  const fresh = copy(originalFoundation);
  assert.deepStrictEqual(
    buildSearchWidgetRecipes({ root, ...fresh }),
    families
  );
  assert.deepStrictEqual(
    copy({ variables: fresh.variables, styles: fresh.styles }),
    prepared
  );
  const walk = n => [n, ...(n.children || []).flatMap(walk)];
  const counts = { instance: 0, logical: 0, rich: 0, gradient: 0 };
  for (const family of families) {
    const fields = new Map();
    for (const variant of family.variants) {
      const ids = new Set();
      for (const node of walk(variant.tree)) {
        assert(node.id && !ids.has(node.id));
        ids.add(node.id);
        if (node.type === 'INSTANCE') {
          counts.instance++;
          const dependency = families.find(f => f.id === node.family);
          assert(dependency, 'Genuine source dependency exists');
          assert(
            dependency.variants.some(v =>
              Object.entries(node.variant).every(
                ([k, x]) => v.properties[k] === x
              )
            )
          );
        }
        if (node.type === 'TEXT') {
          assert(node.characters.trim());
          if (node.id.endsWith('-logical-text')) counts.logical++;
          if (node.textRuns) {
            counts.rich++;
            assert.strictEqual(
              node.textRuns.at(-1).end,
              node.characters.length
            );
          }
          if (node.textProperty) {
            assert(
              node.textProperty.includes(variant.id),
              'Authored context owns stable editable property'
            );
            assert(
              !fields.has(node.textProperty) ||
                fields.get(node.textProperty) === node.characters
            );
            fields.set(node.textProperty, node.characters);
          }
        }
        if (node.gradient) {
          counts.gradient++;
          assert.strictEqual(node.id, 'root-node-0-node-0-css-background');
          assert(node.gradient.layers[0].transformVariables);
        }
      }
    }
  }
  assert(counts.instance > 300 && counts.logical > 300 && counts.rich > 50);
  assert.strictEqual(counts.gradient, 2);
  assert.strictEqual(inspectSearchWidgetCapacity({ root }).captures.length, 30);
  for (const alter of [
    d => {
      d.variables.find(v => v.name === 'color/text').values.mcr = {
        alias: 'absent/role',
      };
    },
    d => {
      d.variables.find(v => v.name === 'color/text').values.mcr = {
        alias: 'color/text',
      };
    },
    d => {
      d.variables.push({ ...copy(d.variables[0]), id: 'foreign-identity' });
    },
  ]) {
    const negative = copy(originalFoundation);
    alter(negative);
    const before = copy(negative);
    assert.throws(() => buildSearchWidgetRecipes({ root, ...negative }));
    assert.deepStrictEqual(
      negative,
      before,
      'Source refusal does not mutate caller DTO'
    );
  }
  await assembly(doc, families);
  for (const alter of [
    d => {
      d.variables.find(
        v => v.name.startsWith('component/search-widget/') && v.type === 'FLOAT'
      ).type = 'STRING';
    },
    d => {
      d.styles.text.find(v =>
        v.id.startsWith('component/search-widget/')
      ).type = 'EFFECT';
    },
    d => {
      const style = d.styles.text.find(v =>
        v.id.startsWith('component/search-widget/')
      );
      delete style.type;
      style.values = Object.fromEntries(d.modes.map(mode => [mode.id, []]));
    },
    d => {
      const style = d.styles.effect.find(v =>
        v.id.startsWith('component/search-widget/')
      );
      delete style.type;
      style.values = Object.fromEntries(
        d.modes.map(mode => [
          mode.id,
          { fontName: { family: 'Roboto', style: 'Regular' } },
        ])
      );
    },
    d => {
      d.styles.effect.push({
        ...copy(
          d.styles.text.find(v => v.id.startsWith('component/search-widget/'))
        ),
        type: 'EFFECT',
      });
    },
    d => {
      d.styles.text.push({
        ...copy(
          d.styles.effect.find(v => v.id.startsWith('component/search-widget/'))
        ),
        type: 'TEXT',
      });
    },
  ]) {
    const negative = copy(doc);
    alter(negative);
    const before = copy(negative);
    assert.throws(
      () => buildSearchWidgetRecipes({ root, ...negative }),
      /Foreign.*identity/
    );
    assert.deepStrictEqual(
      negative,
      before,
      'Wrong helper type/style kind refuses before caller mutation'
    );
  }
  const original = buildSearchResultFixtures({ root });
  const before = copy(original);
  const input = buildSearchWidgetFixtures({ root });
  assert.deepStrictEqual(input, buildSearchWidgetFixtures({ root }));
  assert.deepStrictEqual(copy(buildSearchResultFixtures({ root })), before);
  assert.deepStrictEqual(input.presets, copy(original.original.presets));
  assert.strictEqual(Object.keys(input.responses).length, 20);
  const pairs = input.presets.CustomFacets.customFacets.flatMap(f =>
    f.options.map(o => ({ id: o.query.split(':')[1], name: o.label }))
  );
  assert.deepStrictEqual(input.taxonomyResponse.results, pairs);
  assert.strictEqual(new Set(pairs.map(t => t.id)).size, 10);
  assert.deepStrictEqual(input.operatorProbe, {
    field: 'field_hazard',
    selectedValues: ['347', '344'],
    operators: ['OR', 'AND'],
  });
  for (const [name, response] of Object.entries(input.responses)) {
    const hits = response.hits.hits;
    assert.strictEqual(new Set(hits.map(h => h._id)).size, hits.length, name);
    assert(hits.every(h => h._source && h._id));
    assert.deepStrictEqual(response.hits.total, { value: 40, relation: 'eq' });
    assert(
      response.aggregations.field_hazard.buckets.every(b =>
        pairs.some(t => t.id === b.key)
      )
    );
  }
  const books = input.responses.SyndicatedPublicationBooks.hits.hits;
  assert.strictEqual(books.length, 2);
  assert(books.every(h => h._source.type === 'publication'));
  const news = input.responses.SyndicatedCards.hits.hits;
  assert.strictEqual(news.length, 3);
  for (const [index, h] of news.entries()) {
    assert.strictEqual(h._source.type, 'news');
    assert.strictEqual(
      h._source.url,
      `https://www.undrr.org/news/related-story-${index + 1}`
    );
    assert(h._source.teaser.includes(h._source.title));
    assert(h._source.teaser.includes(input.provenance.newsImage));
    assert(!h._source.teaser.includes('/image.jpg'));
    assert(!h._source.teaser.includes('Description summary text'));
    assert(!h._source.teaser.includes('/node/1'));
  }
  assert(
    !input.responses.AllowedTypes.hits.hits.some(
      h => h._source.type === 'organization'
    )
  );
  const flood = input.responses.TaxonomyTermResults.hits.hits[0];
  assert.strictEqual(flood._source.title, 'Flood');
  assert.strictEqual(String(flood._source.tid), '347');
  assert.strictEqual(flood._source.url, '/taxonomy/term/347');
  assert.strictEqual(input.provenance.remoteResponseCaptured, false);
  assert.strictEqual(input.provenance.serverQueryFilteringVerified, false);
  const measured = inspectSearchWidgetSource({ root });
  assert.strictEqual(measured.captures.length, 30);
  assert.strictEqual(
    measured.captures.reduce((n, c) => n + c.scenes.length, 0),
    220
  );
  for (const capture of measured.captures) {
    assert(Object.values(capture.controlAliases).every(Boolean));
    if (capture.kind === 'preset')
      assert.strictEqual(capture.scenes.length, 20);
    for (const scene of capture.scenes)
      for (const index of scene.nodes) {
        const node = measured.nodes[index];
        assert(node && measured.styles[node.styles]);
        for (const value of Object.values(node.rect))
          assert(Number.isFinite(value));
        const opacity = Number(measured.styles[node.styles].opacity);
        assert(Number.isFinite(opacity) && opacity >= 0 && opacity <= 1);
      }
  }
  const receipt = JSON.parse(
    fs.readFileSync(
      path.join(
        root,
        'examples/figma-plugin/holistic/assets/search-widget/source-capture-receipt.json'
      )
    )
  );
  assert.strictEqual(receipt.drawer.length, 10);
  for (const row of receipt.drawer)
    assert.deepStrictEqual(
      row.hazard,
      row.operator === 'OR'
        ? { terms: { field_hazard: ['347', '344'] } }
        : {
            bool: {
              must: [
                { term: { field_hazard: '347' } },
                { term: { field_hazard: '344' } },
              ],
            },
          }
    );
  const read = fs.readFileSync;
  fs.readFileSync = function (file, ...args) {
    const value = read.call(this, file, ...args);
    return String(file).endsWith('/assets/search-widget/source-footprints.json')
      ? Buffer.concat([
          Buffer.isBuffer(value) ? value : Buffer.from(value),
          Buffer.from('drift'),
        ])
      : value;
  };
  try {
    assert.throws(() => inspectSearchWidgetSource({ root }), /capture drift/);
  } finally {
    fs.readFileSync = read;
  }
  for (const suffix of [
    'capacity-footprints.json',
    'capacity-comparison.json',
    'mask-mirror.json',
    'gradient-source-matrices.json',
    'bali-landscape-source-photo.jpg',
    'image-provenance.json',
    'source-fonts/Roboto-Italic.woff2',
    'source-fonts/Roboto-Medium.woff2',
    'source-fonts/Roboto-Black.woff2',
    'source-fonts/LICENSE.txt',
    'source-fonts/provenance.json',
  ]) {
    fs.readFileSync = function (file, ...args) {
      const value = read.call(this, file, ...args);
      if (!String(file).endsWith('/assets/search-widget/' + suffix))
        return value;
      return Buffer.isBuffer(value)
        ? Buffer.concat([value, Buffer.from('drift')])
        : value + 'drift';
    };
    try {
      const negative = copy(originalFoundation),
        before = copy(negative);
      assert.throws(
        () => buildSearchWidgetRecipes({ root, ...negative }),
        /capture drift/
      );
      assert.deepStrictEqual(negative, before);
    } finally {
      fs.readFileSync = read;
    }
  }
  // Every call owns independent frontend input envelopes and preset objects.
  input.responses[Object.keys(input.responses)[0]].hits.hits[0]._source.title =
    'consumer mutation';
  input.taxonomyResponse.results[0].name = 'consumer mutation';
  assert.deepStrictEqual(
    buildSearchWidgetFixtures({ root }),
    buildSearchWidgetFixtures({ root })
  );
  assert.notStrictEqual(
    buildSearchWidgetFixtures({ root }).taxonomyResponse.results[0].name,
    'consumer mutation'
  );
  // Guard failure through an isolated projection keeps the real source untouched.
  const temp = fs.mkdtempSync(
    path.join(os.tmpdir(), 'mangrove-widget-source-guard-')
  );
  try {
    fs.symlinkSync(path.join(root, 'examples'), path.join(temp, 'examples'));
    fs.symlinkSync(path.join(root, 'packages'), path.join(temp, 'packages'));
    fs.symlinkSync(path.join(root, 'scripts'), path.join(temp, 'scripts'));
    fs.cpSync(path.join(root, 'stories'), path.join(temp, 'stories'), {
      recursive: true,
    });
    const article = path.join(
      temp,
      'stories/Patterns/ArticleStory/ArticleStory.jsx'
    );
    assert.deepStrictEqual(
      buildSearchWidgetFixtures({ root: temp }),
      buildSearchWidgetFixtures({ root })
    );
    fs.appendFileSync(article, '\n// deliberate source drift\n');
    assert.throws(
      () => buildSearchWidgetFixtures({ root: temp }),
      /source.*(changed|updating)|source drift|Source/i
    );
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
  console.log(
    'Source widget7/383: all20 authored390/1164 configurations plus4 mobile facet/operator scenes, allfive actual builder/two zero-create repeats, genuine context instances and supported plain/rich consumer edits pass. Source guards/fonts/opacity/matrices and finite allocations checked; native metrics/raster/interactions/full widget acceptance remain open.'
  );
}
if (require.main === module)
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
module.exports = { main, installWidgetSvgFixture };
