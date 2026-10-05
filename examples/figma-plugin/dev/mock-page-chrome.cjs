#!/usr/bin/env node
/** Exact source assets and actual builder API repeats. No native geometry claim. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { environment } = require('./mock-kit.cjs');
const {
  buildFigmaVariables,
} = require('../../../scripts/build-figma-tokens.cjs');
const {
  buildPageChromeRecipes,
  buildPageChromeOpenRecipes,
  OPEN_HASHES,
  SOURCE_HASHES,
  WIDTHS,
} = require('../../../scripts/figma-page-chrome-recipes.cjs');
const root = path.resolve(__dirname, '../../..');
const copy = x => JSON.parse(JSON.stringify(x));
function document() {
  const doc = buildFigmaVariables();
  doc.components.families = buildPageChromeRecipes({ root, ...doc });
  return doc;
}
function installPageChromeSvgFixture(env, families) {
  const exact = new Map();
  function walk(node) {
    if (node.svg) exact.set(node.svg.markup, node.svg);
    (node.children || []).forEach(walk);
  }
  families.forEach(f => f.variants.forEach(v => walk(v.tree)));
  const previous = env.figma.createNodeFromSvg.bind(env.figma);
  env.figma.createNodeFromSvg = markup => {
    const source = [...exact.keys()].find(
      m =>
        markup === m ||
        markup.replace(/\s+(?:width|height)="[^"]+"/g, '') ===
          m.replace(/\s+(?:width|height)="[^"]+"/g, '')
    );
    if (!source) return previous(markup);
    const box = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(source);
    assert(box);
    const frame = env.figma.createFrame();
    frame.resize(Number(box[1]), Number(box[2]));
    // Exact bounded markup only. These API shapes do not rasterize source paths.
    const vector = env.figma.createVector();
    vector.resize(frame.width, frame.height);
    vector.vectorPaths = [{ windingRule: 'NONZERO', data: source }];
    const fill = exact.get(source).monochrome?.fills;
    vector.fills = fill
      ? [
          {
            type: 'SOLID',
            color: { r: 1, g: 1, b: 1 },
            opacity: 1,
            visible: true,
          },
        ]
      : [];
    vector.strokes = fill
      ? []
      : [
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
}
async function main() {
  const doc = document(),
    families = doc.components.families;
  assert.deepStrictEqual(
    families.map(f => [f.id, f.variants.length]),
    [['page-chrome', 6]]
  );
  assert.deepStrictEqual(
    families[0].variants.map(v => Number(v.properties.Viewport)),
    WIDTHS
  );
  assert.deepStrictEqual(copy(doc), copy(document()));
  for (const variant of families[0].variants) {
    const ids = new Set();
    function walk(n) {
      assert(!ids.has(n.id), n.id);
      ids.add(n.id);
      if (n.type === 'TEXT') assert(n.characters);
      (n.children || []).forEach(walk);
    }
    walk(variant.tree);
    assert.strictEqual(
      variant.tree.layout.width,
      Number(variant.properties.Viewport)
    );
  }
  for (const mode of doc.modes) {
    const env = environment(doc, { sharedOnly: true });
    installPageChromeSvgFixture(env, families);
    await env.call('importVariables', doc, [mode.id], false, [], false);
    const first = await env.call('buildMangroveComponents', doc, mode.id, [
      'page-chrome',
    ]);
    assert.strictEqual(first.errors.length, 0, first.errors.join('\n'));
    assert(first.createdNodeIds.length);
    const owned = new Map(
      [...env.state.nodes.values()].map(n => [
        n.getSharedPluginData('orgundrrmangrove', 'mgKitId'),
        n,
      ])
    );
    let positionedChecks = 0;
    function compareFixedGeometry(spec, key, isRoot = false) {
      const node = owned.get(key);
      assert(node, key);
      if (spec.type === 'FRAME' || spec.type === 'SVG') {
        for (const field of ['width', 'height'])
          if (typeof spec.layout[field] === 'number')
            assert(
              Math.abs(node[field] - spec.layout[field]) < 1e-10,
              key + '/' + field
            );
        if (!isRoot && spec.position) {
          assert.strictEqual(node.x, spec.position.x, key + '/x');
          assert.strictEqual(node.y, spec.position.y, key + '/y');
          positionedChecks++;
        }
      }
      (spec.children || []).forEach(child =>
        compareFixedGeometry(child, key + '/' + child.id)
      );
    }
    for (const variant of families[0].variants)
      compareFixedGeometry(
        variant.tree,
        'family/page-chrome/variant/' + variant.id,
        true
      );
    assert(positionedChecks > 100, 'Positioned composition fixture missing');
    const component = env.state.nodes.get(
      first.families[0].variantIds[0].nodeId
    );
    const consumer = component.createInstance();
    env.state.nodes.get(first.reviewRootId).appendChild(consumer);
    const property = Object.keys(consumer.componentProperties).find(k =>
      k.startsWith('Navigation title 1#')
    );
    assert(property);
    consumer.setProperties({ [property]: 'Edited navigation' });
    const identity = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
    const geometryBefore = [...env.state.nodes.values()]
      .map(n => [n.id, n.parent?.id, n.x, n.y, n.width, n.height])
      .sort();
    const before = [...env.state.nodes.values()]
      .filter(identity)
      .map(n => [identity(n), n.id])
      .sort();
    for (let i = 0; i < 2; i++) {
      const again = await env.call('buildMangroveComponents', doc, mode.id, [
        'page-chrome',
      ]);
      assert.strictEqual(again.errors.length, 0, again.errors.join('\n'));
      assert.strictEqual(again.createdNodeIds.length, 0);
      assert.deepStrictEqual(
        [...env.state.nodes.values()]
          .map(n => [n.id, n.parent?.id, n.x, n.y, n.width, n.height])
          .sort(),
        geometryBefore
      );
      assert.deepStrictEqual(
        [...env.state.nodes.values()]
          .filter(identity)
          .map(n => [identity(n), n.id])
          .sort(),
        before
      );
      assert.strictEqual(
        (await consumer.getMainComponentAsync()).id,
        component.id
      );
      assert.strictEqual(
        consumer.componentProperties[property].value,
        'Edited navigation'
      );
    }
  }
  const collision = copy(doc);
  collision.styles.text.find(
    s => s.id === 'component/page-chrome/nav-mobile'
  ).id = 'foreign.chrome';
  assert.throws(
    () => buildPageChromeRecipes({ root, ...collision }),
    /Foreign identity/
  );
  const altered = copy(doc);
  altered.variables.find(v => v.name === 'font-size/400').values.undrr = 20;
  assert.throws(
    () => buildPageChromeRecipes({ root, ...altered }),
    /face\/size/
  );
  const read = fs.readFileSync;
  for (const file of [
    'stories/Patterns/_shared/UndrrChrome.jsx',
    'stories/assets/fonts/roboto-condensed/sass/_Bold.scss',
  ]) {
    fs.readFileSync = (target, ...args) => {
      const value = read(target, ...args);
      return String(target) === path.join(root, file)
        ? Buffer.isBuffer(value)
          ? Buffer.concat([value, Buffer.from('\n// deliberate source drift')])
          : value + '\n// deliberate source drift'
        : value;
    };
    try {
      assert.throws(
        () => buildPageChromeRecipes({ root, ...copy(doc) }),
        /source contract needs updating/
      );
    } finally {
      fs.readFileSync = read;
    }
    assert(SOURCE_HASHES[file]);
  }
  const env = environment(doc, { sharedOnly: true });
  installPageChromeSvgFixture(env, families);
  await env.call('importVariables', doc, ['undrr'], false, [], false);
  env.figma.loadFontAsync = async () => {
    throw new Error('Missing source UI Bold');
  };
  const nodes = env.state.nodes.size,
    styles = env.state.styles.length;
  const refused = await env.call('buildMangroveComponents', doc, 'undrr', [
    'page-chrome',
  ]);
  assert(refused.errors.length);
  assert(refused.errors.join(' ').includes('Missing source UI Bold'));
  assert.strictEqual(env.state.nodes.size, nodes);
  assert.strictEqual(env.state.styles.length, styles);
  console.log(
    'Page chrome: exact six authored closed viewport contracts, all-five builder two zero-create repeats, edited navigation/links, source/font/identity guards passed. Native browser/font/pixel equivalence and open navigation remain unverified.'
  );
}
if (require.main === module)
  main()
    .then(openMain)
    .catch(e => {
      console.error(e);
      process.exitCode = 1;
    });
module.exports = { main, openMain, installPageChromeSvgFixture };

async function openMain() {
  function openDocument() {
    const doc = buildFigmaVariables();
    const button = copy(doc.components.families.find(f => f.id === 'button'));
    button.id = 'page-chrome-button';
    button.name = 'Page chrome source Button dependency';
    button.variants.forEach(v => {
      v.id = v.id.replace(/^button\./, 'page-chrome-button.');
    });
    if (button.defaultVariantId)
      button.defaultVariantId = button.defaultVariantId.replace(
        /^button\./,
        'page-chrome-button.'
      );
    doc.components.families = [
      button,
      ...buildPageChromeOpenRecipes({ root, ...doc }),
    ];
    return doc;
  }
  const doc = openDocument(),
    families = doc.components.families.slice(1);
  assert.deepStrictEqual(
    families.map(f => [f.id, f.variants.length]),
    [
      ['page-chrome-desktop-panel', 3],
      ['page-chrome-mobile', 4],
    ]
  );
  assert.deepStrictEqual(copy(doc), copy(openDocument()));
  const source = JSON.parse(
    fs.readFileSync(
      path.join(
        root,
        'examples/figma-plugin/holistic/assets/page-chrome/open-source-footprints.json'
      )
    )
  );
  const sceneNodes = (mode, key) =>
    source.scenes[mode][key].roots.flatMap(r => [r.root, ...r.children]);
  function walk(n, fn, key) {
    fn(n, key);
    (n.children || []).forEach(c => walk(c, fn, key + '/' + c.id));
  }
  for (const f of families)
    for (const v of f.variants) {
      const ids = new Set();
      walk(
        v.tree,
        (n, key) => {
          assert(!ids.has(key), 'Duplicate anatomy ' + key);
          ids.add(key);
        },
        'root'
      );
    }
  for (const mode of doc.modes) {
    const env = environment(doc, { sharedOnly: true });
    installPageChromeSvgFixture(env, families);
    await env.call('importVariables', doc, [mode.id], false, [], false);
    const requested = families.map(f => f.id);
    const first = await env.call(
      'buildMangroveComponents',
      doc,
      mode.id,
      requested
    );
    assert.strictEqual(first.errors.length, 0, first.errors.join('\n'));
    assert(first.createdNodeIds.length);
    const owned = new Map(
      [...env.state.nodes.values()].map(n => [
        n.getSharedPluginData('orgundrrmangrove', 'mgKitId'),
        n,
      ])
    );
    const resolve = role => {
      const variable = doc.variables.find(v => v.name === role);
      assert(variable, role);
      const x = variable.values[mode.id];
      return x && x.alias ? resolve(x.alias) : x;
    };
    let geometryChecks = 0;
    for (const family of families)
      for (const variant of family.variants) {
        const key = 'family/' + family.id + '/variant/' + variant.id;
        walk(
          variant.tree,
          (spec, k) => {
            const n = owned.get(k);
            assert(n, k);
            if (spec.type === 'FRAME' || spec.type === 'SVG') {
              for (const field of ['width', 'height']) {
                const value =
                  typeof spec.layout[field] === 'number'
                    ? spec.layout[field]
                    : resolve(spec.layout[field]);
                assert(Math.abs(n[field] - value) < 1e-10, k + '/' + field);
                geometryChecks++;
              }
              if (spec.position) {
                assert.strictEqual(n.x, spec.position.x, k + '/x');
                assert.strictEqual(n.y, spec.position.y, k + '/y');
                geometryChecks += 2;
              }
            }
          },
          key
        );
        const width = Number(variant.properties.Viewport);
        if (family.id === 'page-chrome-desktop-panel') {
          const nodes = sceneNodes(mode.id, 'desktop-about-' + width),
            panel = nodes.find(n => n.tag === 'ARTICLE'),
            banner = nodes.find(n => n.cls === 'mg-mega-content__banner'),
            cta = nodes.find(n => n.cls === 'mg-button mg-button-primary');
          assert.strictEqual(owned.get(key).width, panel.w);
          assert.strictEqual(owned.get(key).height, panel.h);
          assert.strictEqual(owned.get(key + '/left/banner').height, banner.h);
          assert.strictEqual(
            owned.get(key + '/left/banner/action-slot').width,
            cta.w
          );
          assert.strictEqual(
            owned.get(key + '/left/banner/action-slot').height,
            cta.h
          );
          const action = owned.get(key + '/left/banner/action-slot/action');
          assert.strictEqual(
            (await action.getMainComponentAsync()).name,
            'Emphasis=Primary, Treatment=Filled, State=Default'
          );
          assert(
            Object.values(action.componentProperties).some(
              p => p.value === 'About UNDRR'
            )
          );
        } else {
          const nodes = sceneNodes(
              mode.id,
              'mobile-' + variant.properties.Level + '-' + width
            ),
            surface = nodes.find(n =>
              n.cls.startsWith(
                'mg-mega-mobile-sidebar mg-mega-mobile-sidebar--progressive'
              )
            );
          assert.strictEqual(owned.get(key).height, 1000);
          assert.strictEqual(owned.get(key + '/surface').height, surface.h);
        }
      }
    assert(
      geometryChecks > 300,
      'Missing meaningful built allocation assertions'
    );
    const component = owned.get(
        'family/page-chrome-mobile/variant/page-chrome-mobile.about-390'
      ),
      consumer = component.createInstance();
    env.state.nodes.get(first.reviewRootId).appendChild(consumer);
    const heading = Object.keys(consumer.componentProperties).find(k =>
      k.startsWith('Heading#')
    );
    assert(heading);
    consumer.setProperties({ [heading]: 'Edited mobile heading' });
    const snapshot = () =>
      [...env.state.nodes.values()]
        .filter(n => !n.removed)
        .map(n => [
          n.id,
          n.parent?.id,
          n.x,
          n.y,
          n.width,
          n.height,
          n.layoutMode,
          n.layoutSizingHorizontal,
          n.layoutSizingVertical,
        ]);
    const before = snapshot();
    for (let i = 0; i < 2; i++) {
      const report = await env.call(
        'buildMangroveComponents',
        doc,
        mode.id,
        requested
      );
      assert.deepStrictEqual(copy(report.errors), []);
      assert.deepStrictEqual(copy(report.createdNodeIds), []);
      assert.deepStrictEqual(snapshot(), before);
      assert.strictEqual(
        (await consumer.getMainComponentAsync()).id,
        component.id
      );
      assert.strictEqual(
        consumer.componentProperties[heading].value,
        'Edited mobile heading'
      );
    }
    const duplicate = copy(doc);
    const bannerChildren =
      duplicate.components.families[1].variants[0].tree.children[0].children[0]
        .children;
    bannerChildren[1].id = bannerChildren[0].id;
    const styleBefore = env.state.styles.length;
    const duplicateResult = await env.call(
      'buildMangroveComponents',
      duplicate,
      mode.id,
      requested
    );
    assert(
      duplicateResult.errors.some(x =>
        String(x).includes('Duplicate recipe node id')
      )
    );
    assert.strictEqual(env.state.styles.length, styleBefore);
    assert.deepStrictEqual(snapshot(), before);
    const unknown = copy(doc);
    unknown.components.families[1].variants[0].tree.children[0].children[0].children[2].children[0].family =
      'missing-source-button';
    await assert.rejects(
      () => env.call('buildMangroveComponents', unknown, mode.id, requested),
      /Unknown component family/
    );
    assert.deepStrictEqual(snapshot(), before);
  }
  const collision = copy(doc);
  collision.styles.text.find(
    s => s.id === 'component/page-chrome-open/mobile-heading-all'
  ).id = 'foreign.open-chrome';
  assert.throws(
    () => buildPageChromeOpenRecipes({ root, ...collision }),
    /Foreign identity/
  );
  const cycle = copy(doc);
  cycle.variables.find(v => v.name === 'color/interactive').values.undrr = {
    alias: 'color/interactive',
  };
  assert.throws(() => buildPageChromeOpenRecipes({ root, ...cycle }), /cyclic/);
  const foreign = copy(doc);
  foreign.variables.find(
    v => v.name === 'component/page-chrome-open/mobile-heading-all-size'
  ).id = 'foreign.open-role';
  assert.throws(
    () => buildPageChromeOpenRecipes({ root, ...foreign }),
    /Foreign identity/
  );
  const changedPaint = copy(doc);
  const interactive = changedPaint.variables.find(
    v => v.name === 'color/interactive'
  );
  interactive.values.undrr = { r: 1, g: 0, b: 0, a: 1 };
  assert.throws(
    () => buildPageChromeOpenRecipes({ root, ...changedPaint }),
    /paint requires remeasurement/
  );
  for (const file of Object.keys(OPEN_HASHES)) {
    const read = fs.readFileSync;
    fs.readFileSync = (target, ...args) => {
      const value = read(target, ...args);
      return String(target) === path.join(root, file)
        ? Buffer.concat([Buffer.from(value), Buffer.from(' source drift')])
        : value;
    };
    try {
      assert.throws(
        () => buildPageChromeOpenRecipes({ root, ...copy(doc) }),
        /source contract needs updating/
      );
    } finally {
      fs.readFileSync = read;
    }
  }
  const missing = environment(doc, { sharedOnly: true });
  installPageChromeSvgFixture(missing, families);
  await missing.call('importVariables', doc, ['undrr'], false, [], false);
  missing.figma.loadFontAsync = async () => {
    throw Error('Missing source body face');
  };
  const nodeCount = missing.state.nodes.size,
    styleCount = missing.state.styles.length;
  const refused = await missing.call(
    'buildMangroveComponents',
    doc,
    'undrr',
    families.map(f => f.id)
  );
  assert(refused.errors.length);
  assert.strictEqual(missing.state.nodes.size, nodeCount);
  assert.strictEqual(missing.state.styles.length, styleCount);
  console.log(
    'Open Page chrome3 desktop +4 progressive mobile source allocations, exact normal Button dependency, all-five actual builder geometry/two zero-create repeats/edit retention/source and missing-font guards passed. Native pixels/modes/interactions remain open.'
  );
}
