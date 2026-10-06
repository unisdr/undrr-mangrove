#!/usr/bin/env node
/** Source allocation tests. Native rendering/publication remain separate. */
'use strict';
const assert = require('assert'),
  fs = require('fs'),
  path = require('path');
const { rangeEnvironment } = require('./mock-rich-text-integration.cjs');
const { installPageChromeSvgFixture } = require('./mock-page-chrome.cjs');
const {
  buildPageChromeRecipes,
} = require('../../../scripts/figma-page-chrome-recipes.cjs');
const { installCardContentSvgFixture } = require('./mock-card-content.cjs');
const { installTextThicknessFixture } = require('./mock-text-thickness.cjs');
const {
  buildFigmaVariables,
} = require('../../../scripts/build-figma-tokens.cjs');
const {
  buildContentHubRecipes,
  SOURCE_HASHES,
} = require('../../../scripts/figma-content-hub-recipes.cjs');
const root = path.resolve(__dirname, '../../..'),
  copy = x => JSON.parse(JSON.stringify(x));
function document() {
  const d = buildFigmaVariables(),
    cta = d.components.families.find(f => f.id === 'editorial-cta');
  assert(cta);
  d.components.families = [
    cta,
    ...buildPageChromeRecipes({ root, ...d }),
    ...buildContentHubRecipes({ root, ...d }),
  ];
  return d;
}
function installContentHubSvgFixture(env, families) {
  installCardContentSvgFixture(
    env,
    families.filter(f => f.id === 'content-hub-route-card')
  );
}
function walk(n) {
  return [n, ...(n.children || []).flatMap(walk)];
}
function identity(n) {
  return n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
}
async function main() {
  const d = document();
  assert.deepStrictEqual(copy(d), copy(document()));
  assert.deepStrictEqual(
    d.components.families
      .filter(f => f.id.startsWith('content-hub-'))
      .map(f => [f.id, f.variants.length]),
    [
      ['content-hub-tertiary-cta', 1],
      ['content-hub-header', 32],
      ['content-hub-reading-column', 4],
      ['content-hub-intro', 24],
      ['content-hub-resources', 2],
      ['content-hub-toc', 4],
      ['content-hub-route-card', 28],
      ['content-hub-page', 20],
    ]
  );
  const stable = copy({ variables: d.variables, styles: d.styles });
  assert.deepStrictEqual(
    buildContentHubRecipes({ root, ...d }),
    d.components.families.filter(f => f.id.startsWith('content-hub-'))
  );
  assert.deepStrictEqual(
    copy({ variables: d.variables, styles: d.styles }),
    stable
  );
  for (const m of d.modes) {
    const resolve = (n, seen = new Set()) => {
      if (typeof n === 'number') return n;
      assert(!seen.has(n));
      seen.add(n);
      const v = d.variables.find(v => v.name === n)?.values[m.id];
      assert(v !== undefined, n);
      return v.alias ? resolve(v.alias, seen) : v;
    };
    const env = await rangeEnvironment(d);
    await installTextThicknessFixture(env);
    installPageChromeSvgFixture(env, d.components.families);
    installContentHubSvgFixture(env, d.components.families);
    assert.deepStrictEqual(
      copy(
        (await env.call('importVariables', d, [m.id], false, [], true)).errors
      ),
      []
    );
    const ids = d.components.families.map(f => f.id),
      first = await env.call('buildMangroveComponents', d, m.id, ids);
    assert.deepStrictEqual(copy(first.errors), []);
    const consumers = [];
    const check = (node, spec) => {
      for (const field of ['width', 'height']) {
        const x = spec.layout?.[field];
        if (
          typeof x === 'number' ||
          (typeof x === 'string' && !['FILL', 'HUG'].includes(x))
        )
          assert.strictEqual(node[field], resolve(x), spec.id + '/' + field);
      }
      for (const field of [
        'paddingTop',
        'paddingBottom',
        'paddingLeft',
        'paddingRight',
      ])
        if (spec.bindings?.[field])
          assert.strictEqual(
            node[field],
            resolve(spec.bindings[field]),
            spec.id + '/' + field
          );
      if (spec.sourceGeometry?.padding) {
        const p = spec.sourceGeometry.padding[m.id],
          child = node.children[0],
          expected =
            node.width -
            p.left -
            p.right -
            spec.sourceGeometry.inlineEndBorderAllocation[m.id];
        assert.strictEqual(
          child.width,
          expected,
          spec.id + '/source text area'
        );
        // This mock stores native auto-layout inputs but does not simulate child flow coordinates.
        assert.strictEqual(node.layoutMode, 'VERTICAL');
        assert.strictEqual(child.layoutSizingHorizontal, 'FIXED');
      }
      if (spec.absolute) {
        assert.strictEqual(node.layoutPositioning, 'ABSOLUTE');
        if (spec.absolute.horizontal === 'START') {
          assert.strictEqual(node.x, resolve(spec.absolute.offsetX), spec.id);
          assert.strictEqual(node.y, resolve(spec.absolute.offsetY), spec.id);
        }
      }
      if (spec.type === 'TEXT') {
        assert.strictEqual(node.characters, spec.characters);
        if (spec.textDecoration)
          assert.strictEqual(node.textDecoration, spec.textDecoration);
        if (spec.textDecorationOffset?.unit === 'PIXELS')
          assert.deepStrictEqual(
            copy(node.textDecorationOffset),
            spec.textDecorationOffset
          );
        if (spec.textDecorationThickness)
          assert.deepStrictEqual(
            copy(node.textDecorationThickness),
            spec.textDecorationThickness
          );
      }
      if (spec.effectStyle) {
        const effect = env.state.styles.find(
          e =>
            e.name === d.styles.effect.find(s => s.id === spec.effectStyle).name
        );
        assert(effect);
        assert.strictEqual(
          node.effectStyleId,
          effect.id,
          spec.id + '/exact native effect identity'
        );
      }
      if (spec.type === 'SVG') {
        assert(spec.svg.assetId.startsWith('content-hub-'));
        assert(node.children.some(n => n.type === 'VECTOR'));
        return;
      }
      if (spec.type === 'INSTANCE') {
        assert(node.main);
        const family = d.components.families.find(f => f.id === spec.family);
        const variant = family.variants.find(v =>
          Object.entries(spec.variant).every(
            ([k, value]) => v.properties[k] === value
          )
        );
        assert(variant, spec.family + '/actual source variant');
        assert(
          identity(node.main).endsWith('/variant/' + variant.id),
          spec.family + '/exact main identity'
        );
        return;
      }
      assert.strictEqual(
        node.children?.length || 0,
        spec.children?.length || 0,
        spec.id
      );
      for (let i = 0; i < (spec.children || []).length; i++)
        check(node.children[i], spec.children[i]);
    };
    for (const report of first.families.filter(r =>
      r.id.startsWith('content-hub-')
    )) {
      const family = d.components.families.find(f => f.id === report.id);
      for (const entry of report.variantIds) {
        const master = env.state.nodes.get(entry.nodeId),
          spec = family.variants.find(v => v.id === entry.id);
        check(master, spec.tree);
        if (family.id === 'content-hub-page') {
          const captured = JSON.parse(
            fs.readFileSync(
              path.join(
                root,
                'examples/figma-plugin/holistic/assets/content-hub/source-footprints.json'
              )
            )
          ).cases.find(
            c =>
              c.brand === m.id &&
              c.case.key === spec.properties.SourceCase &&
              c.viewport.width === Number(spec.properties.SourceViewport)
          );
          assert(captured);
          assert.strictEqual(master.width, captured.viewport.width);
          assert.strictEqual(master.height, captured.pageHeight);
          const instances = spec.tree.children
            .flatMap(host => host.children)
            .filter(n => n.type === 'INSTANCE');
          assert.deepStrictEqual(
            instances.map(n => n.family),
            spec.sourceDependencies.filter(
              f =>
                f !== 'content-hub-intro' ||
                spec.tree.children.some(c => c.id === 'intro')
            )
          );
          assert(spec.sourceGeometry.completeCapturedVisibleAnatomy);
          assert.strictEqual(
            spec.sourceGeometry.fullContentHubScopeComplete,
            false
          );
        }
        const consumer = master.createInstance();
        env.figma.currentPage.appendChild(consumer);
        consumer.x = 203;
        consumer.y = 409;
        const plain = walk(consumer).find(
          n => n.type === 'TEXT' && n.componentPropertyReferences?.characters
        );
        if (plain) {
          const key = plain.componentPropertyReferences.characters,
            edited = 'Reviewed ' + m.id + ' source content';
          let owner = plain.parent;
          while (owner && owner.type !== 'INSTANCE') owner = owner.parent;
          assert(
            owner && owner.componentProperties[key],
            'Editable content must belong to a genuine linked instance.'
          );
          owner.setProperties({ [key]: edited });
          consumers.push({ consumer, owner, key, edited });
        }
        if (family.id === 'content-hub-page') {
          for (const owner of walk(consumer).filter(
            n => n.type === 'INSTANCE' && n !== consumer
          )) {
            const key = Object.keys(owner.componentProperties).find(
              k => owner.componentProperties[k].type === 'TEXT'
            );
            if (!key) continue;
            const edited = 'Reviewed nested ' + m.id + ' actual source content';
            owner.setProperties({ [key]: edited });
            const previous = consumers.find(
              c => c.owner === owner && c.key === key
            );
            if (previous) previous.edited = edited;
            else consumers.push({ consumer, owner, key, edited });
          }
        }
      }
    }
    const geometry = () =>
      [...env.state.nodes.values()]
        .filter(n => identity(n).startsWith('family/content-hub-'))
        .map(n => [
          n.id,
          identity(n),
          n.parent?.id,
          n.type,
          n.x,
          n.y,
          n.width,
          n.height,
          n.type === 'INSTANCE' ? n.main.id : null,
        ]);
    const before = geometry();
    assert(
      before.length > 87,
      'Recorded managed geometry must include actual source variant roots and their anatomy.'
    );
    assert(
      before.some(row => row[1].startsWith('family/content-hub-page/variant/')),
      'Full scene variants must be recorded.'
    );
    for (let i = 0; i < 2; i++) {
      const repeat = await env.call('buildMangroveComponents', d, m.id, ids);
      assert.deepStrictEqual(copy(repeat.errors), []);
      assert.strictEqual(repeat.createdNodeIds.length, 0);
      assert.deepStrictEqual(geometry(), before);
      for (const c of consumers) {
        assert.strictEqual(c.owner.componentProperties[c.key].value, c.edited);
        assert.strictEqual(c.consumer.x, 203);
        assert.strictEqual(c.consumer.y, 409);
      }
    }
    console.log(
      m.id +
        ' bounded source header/body allocated geometry, two zero-create repeats and supported consumer edits passed. Native pixels/reflow remain open.'
    );
  }
  const missing = await rangeEnvironment(d);
  await installTextThicknessFixture(missing);
  installPageChromeSvgFixture(missing, d.components.families);
  installContentHubSvgFixture(missing, d.components.families);
  await missing.call('importVariables', d, ['undrr'], false, [], true);
  const load = missing.figma.loadFontAsync;
  missing.figma.loadFontAsync = async font => {
    if (font.family === 'Roboto Condensed' && font.style === 'Bold')
      throw Error('missing captured UI Bold face');
    return load(font);
  };
  const beforeNodes = missing.state.nodes.size;
  const failed = await missing.call(
    'buildMangroveComponents',
    d,
    'undrr',
    d.components.families.map(f => f.id)
  );
  assert(failed.errors.some(e => e.includes('missing captured UI Bold face')));
  assert.strictEqual(missing.state.nodes.size, beforeNodes);
  for (const mutate of [
    d => {
      d.styles.effect.find(
        e => e.id === 'shadow.raised'
      ).values.mcr[0].effect.spread = 2;
    },
    d => {
      d.variables.find(
        v => v.name === 'effect-color/shadow/raised'
      ).values.mcr = { r: 1, g: 0, b: 0, a: 0.24 };
    },
  ]) {
    const bad = copy(d);
    mutate(bad);
    assert.throws(
      () => buildContentHubRecipes({ root, ...bad }),
      /raised effect or paint changed/
    );
  }
  const read = fs.readFileSync;
  for (const file of Object.keys(SOURCE_HASHES)) {
    fs.readFileSync = function (f, ...args) {
      const x = read.call(this, f, ...args);
      return f === path.join(root, file)
        ? Buffer.isBuffer(x)
          ? Buffer.concat([x, Buffer.from('\nsource mutation')])
          : x + '\nsource mutation'
        : x;
    };
    try {
      assert.throws(
        () => buildContentHubRecipes({ root, ...copy(d) }),
        /source changed/
      );
    } finally {
      fs.readFileSync = read;
    }
  }
  for (const name of ['color/hero', 'color/text', 'color/hero--tertiary']) {
    const bad = copy(d);
    bad.variables.find(v => v.name === name).values.mcr = {
      r: 1,
      g: 0,
      b: 0,
      a: 1,
    };
    assert.throws(
      () => buildContentHubRecipes({ root, ...bad }),
      /source token input/
    );
  }
  for (const target of ['variable', 'style']) {
    const bad = copy(d);
    if (target === 'variable')
      bad.variables.find(
        v => v.name === 'component/content-hub/geometry/zero'
      ).name = 'Foreign owner';
    else
      bad.styles.text.find(
        v => v.id === 'component.content-hub.tertiary-cta-label'
      ).name = 'Foreign owner';
    assert.throws(
      () => buildContentHubRecipes({ root, ...bad }),
      /Foreign identity/
    );
  }
}
module.exports = { installContentHubSvgFixture };
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { main, document, installContentHubSvgFixture };
