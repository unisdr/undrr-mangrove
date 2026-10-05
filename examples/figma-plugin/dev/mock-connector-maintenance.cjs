#!/usr/bin/env node
/** Immutable connector source plans and native ownership guards, not rendering. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { environment, importFoundation } = require('./mock-kit.cjs');
const {
  buildConnector,
} = require('../../../scripts/build-figma-connector.cjs');
const copy = value => JSON.parse(JSON.stringify(value));
const namespace = 'orgundrrmangrove';
const policyKey = 'mgMaintenancePolicy';
const identity = node => node.getSharedPluginData(namespace, 'mgKitId');
const doc = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
);
const compile = (source, family, variant) =>
  buildConnector({
    operation: 'build',
    brandId: 'undrr',
    familyIds: [family],
    variantIds: [variant],
    doc: source,
  });
const owned = (env, key) => {
  const matches = [...env.state.nodes.values()].filter(
    node => identity(node) === key && node.type !== 'INSTANCE'
  );
  assert.strictEqual(matches.length, 1, key);
  return matches[0];
};
function treeNodes(tree) {
  return [tree, ...(tree.children || []).flatMap(treeNodes)];
}
async function snapshot(env) {
  const report = copy(await env.call('inspectMangroveKit'));
  delete report.capturedAt;
  return JSON.stringify({
    report,
    metadata: [...env.state.nodes.values()].map(node => [
      node.id,
      node.data,
      node.sharedData,
    ]),
    svgImports: env.state.svgImportCalls,
    svgScales: env.state.svgScaleCalls,
  });
}
async function refuses(env, payload, expected) {
  const before = await snapshot(env);
  let loads = 0;
  const load = env.figma.loadFontAsync;
  env.figma.loadFontAsync = (...args) => {
    loads += 1;
    return load(...args);
  };
  try {
    await assert.rejects(env.runCode(payload.code), expected);
  } finally {
    env.figma.loadFontAsync = load;
  }
  assert.strictEqual(loads, 0);
  assert.strictEqual(await snapshot(env), before);
}
async function fixture(family, variant) {
  const payload = await compile(doc, family, variant);
  const env = environment(doc);
  await importFoundation(env, doc);
  const built = await env.runCode(payload.code);
  assert.deepStrictEqual(copy(built.errors), []);
  return { env, payload };
}
async function main() {
  {
    const { env, payload } = await fixture(
      'button',
      'button.primary.filled.default'
    );
    const set = owned(env, 'family/button');
    const variant = set.children[0];
    const manual = JSON.stringify({
      version: 1,
      owner: 'manual',
      reason: 'Native edits.',
    });
    for (const node of [set, variant]) {
      node.setSharedPluginData(namespace, policyKey, manual);
      await refuses(env, payload, /Manual maintenance.*button/);
      node.setSharedPluginData(namespace, policyKey, '');
    }
    for (const marker of [
      '{bad',
      { version: 2, owner: 'source', reason: '' },
      { version: 1, owner: 'manual', reason: ' ' },
      { version: 1, owner: 'source', reason: 'Not empty' },
      { version: 1, owner: 'source', reason: '', extra: true },
    ]) {
      set.setSharedPluginData(
        namespace,
        policyKey,
        typeof marker === 'string' ? marker : JSON.stringify(marker)
      );
      await refuses(env, payload, /Invalid maintenance policy/);
    }
    set.setSharedPluginData(namespace, policyKey, manual);
    variant.setSharedPluginData(
      namespace,
      policyKey,
      JSON.stringify({ version: 1, owner: 'source', reason: '' })
    );
    await refuses(env, payload, /Conflicting maintenance policies/);
    set.setSharedPluginData(namespace, policyKey, '');
    variant.setSharedPluginData(namespace, policyKey, '');
    const type = set.type;
    set.type = 'FRAME';
    await refuses(env, payload, /Maintenance family button has changed type/);
    set.type = type;
    env.figma.currentPage.appendChild(variant);
    await refuses(env, payload, /Maintenance variant .* changed ownership/);
    set.appendChild(variant);
    const repeated = await env.runCode(payload.code);
    assert.deepStrictEqual(copy(repeated.errors), []);
    assert.strictEqual(repeated.createdNodeIds.length, 0);
    console.log(
      'ok compiled maintenance direct/set/variant/schema/conflict/type/parent refusals precede writes; source repeat keeps IDs'
    );
  }
  {
    const { env, payload } = await fixture(
      'table',
      'table.large.default.story'
    );
    const set = owned(env, 'family/table-header-cell');
    set.setSharedPluginData(
      namespace,
      policyKey,
      JSON.stringify({
        version: 1,
        owner: 'manual',
        reason: 'Manual headings.',
      })
    );
    await refuses(env, payload, /Manual maintenance.*table-header-cell/);
    const button = await compile(
      doc,
      'button',
      'button.primary.filled.default'
    );
    const before = copy(await env.call('mgInspectNode', set, new Map(), []));
    const unrelated = await env.runCode(button.code);
    assert.deepStrictEqual(copy(unrelated.errors), []);
    assert.deepStrictEqual(
      copy(await env.call('mgInspectNode', set, new Map(), [])),
      before
    );
    console.log(
      'ok compiled exact dependency closure blocks a manual Table part; unrelated source scope preserves it'
    );
  }
  {
    const checkedId = 'checkbox.true.default.after.short';
    const { env, payload } = await fixture('checkbox', checkedId);
    const set = owned(env, 'family/checkbox');
    const main = set.children[0];
    const svg = main.findAll(
      node => !!node.getSharedPluginData(namespace, 'mgSvgAsset')
    )[0];
    assert(svg && payload.svgEnabled);
    const original = JSON.stringify({
      ids: [svg.id, ...svg.findAll(() => true).map(node => node.id)],
      metadata: svg.getSharedPluginData(namespace, 'mgSvgAsset'),
    });
    const imports = env.state.svgImportCalls.length;
    const scales = env.state.svgScaleCalls.length;
    const review = [...env.state.nodes.values()].find(
      node =>
        node.type === 'INSTANCE' &&
        identity(node).startsWith('review/checkbox/')
    );
    const labelKey = Object.keys(review.componentProperties).find(key =>
      key.startsWith('Label#')
    );
    assert(labelKey);
    review.setProperties({ [labelKey]: 'Designer edited checkbox label' });
    const vectorSnapshot = () =>
      JSON.stringify(
        [...env.state.nodes.values()]
          .filter(node => node.type === 'VECTOR')
          .map(node => ({
            id: node.id,
            parentId: node.parent.id,
            x: node.x,
            y: node.y,
            width: node.width,
            height: node.height,
            strokeWeight: node.strokeWeight,
            strokeCap: node.strokeCap,
            strokeJoin: node.strokeJoin,
            vectorPaths: node.vectorPaths,
          }))
      );
    const originalVectors = vectorSnapshot();
    const repeated = await env.runCode(payload.code);
    assert.deepStrictEqual(copy(repeated.errors), []);
    assert.strictEqual(repeated.createdNodeIds.length, 0);
    assert.strictEqual(env.state.svgImportCalls.length, imports);
    assert.strictEqual(env.state.svgScaleCalls.length, scales);
    assert.strictEqual(
      review.componentProperties[labelKey].value,
      'Designer edited checkbox label'
    );
    assert.strictEqual(
      vectorSnapshot(),
      originalVectors,
      'Main and inherited consumer vector geometry/IDs stay exact'
    );
    assert.strictEqual(
      JSON.stringify({
        ids: [svg.id, ...svg.findAll(() => true).map(node => node.id)],
        metadata: svg.getSharedPluginData(namespace, 'mgSvgAsset'),
      }),
      original
    );
    const vector = svg.findAll(node => node.type === 'VECTOR')[0];
    vector.strokeWeight += 0.125;
    const before = await snapshot(env);
    const drift = await env.runCode(payload.code);
    assert(
      drift.errors.some(error =>
        /SVG .* geometry\/topology changed/.test(error)
      ),
      drift.errors
    );
    assert.strictEqual(drift.createdNodeIds.length, 0);
    assert.strictEqual(await snapshot(env), before);
    for (const mutate of [
      tree => {
        tree.svg.markup = '<svg>';
      },
      tree => {
        tree.svg.markup = tree.svg.markup.replace('viewBox', 'foreign');
      },
      tree => {
        tree.svg.markup = tree.svg.markup.replace('</svg>', '<script/></svg>');
      },
      tree => {
        tree.svg.assetId = '';
      },
      tree => {
        tree.layout.width = 0;
      },
      tree => {
        tree.layout.height *= 2;
      },
      tree => {
        tree.fill = 'color/text';
      },
      tree => {
        tree.position = { x: 1 };
      },
      tree => {
        tree.svg.monochrome = {};
      },
      tree => {
        tree.svg.monochrome = { strokes: 'color/text' };
        tree.svg.markup = tree.svg.markup.replace(
          '</svg>',
          "<path stroke='red' d='M0 0L1 1'/></svg>"
        );
      },
    ]) {
      const invalid = copy(doc);
      const variant = invalid.components.families
        .find(f => f.id === 'checkbox')
        .variants.find(v => v.id === checkedId);
      mutate(treeNodes(variant.tree).find(tree => tree.type === 'SVG'));
      await assert.rejects(compile(invalid, 'checkbox', checkedId), /SVG/);
    }
    const changed = copy(doc);
    const variant = changed.components.families
      .find(f => f.id === 'checkbox')
      .variants.find(v => v.id === checkedId);
    const source = treeNodes(variant.tree).find(tree => tree.type === 'SVG');
    const duplicate = copy(source);
    duplicate.id += '-conflict';
    duplicate.svg.markup = duplicate.svg.markup.replace('3.5 8', '3.6 8');
    variant.tree.children.push(duplicate);
    await assert.rejects(
      compile(changed, 'checkbox', checkedId),
      /conflicting source markup/
    );
    console.log(
      'ok immutable SVG plans preserve native vector IDs/geometry; malformed XML/schema/colour/asset conflicts refuse compilation, native drift refuses before writes'
    );
  }
  {
    const { env, payload } = await fixture(
      'status-label',
      'status-label.warning'
    );
    assert(payload.svgEnabled);
    const main = owned(env, 'family/status-label').children[0];
    const vectors = main.findAll(node => node.type === 'VECTOR');
    assert(vectors.length);
    assert(
      vectors.every(vector =>
        [...vector.fills, ...vector.strokes].some(
          paint => paint.boundVariables?.color
        )
      )
    );
    const ids = vectors.map(vector => vector.id);
    const repeated = await env.runCode(payload.code);
    assert.deepStrictEqual(copy(repeated.errors), []);
    assert.strictEqual(repeated.createdNodeIds.length, 0);
    assert.deepStrictEqual(
      main.findAll(node => node.type === 'VECTOR').map(vector => vector.id),
      ids
    );
    console.log(
      'ok explicit monochrome source paint binding remains native and idempotent after compiler plan specialization'
    );
  }
  {
    const source = copy(doc);
    const variant = source.components.families
      .find(family => family.id === 'status-label')
      .variants.find(value => value.id === 'status-label.neutral');
    const ellipse = treeNodes(variant.tree).find(
      tree => tree.type === 'ELLIPSE'
    );
    ellipse.layout.width = 'HUG';
    const payload = await compile(source, 'status-label', variant.id);
    assert(payload.ellipseEnabled);
    assert(payload.code.includes('Ellipse recipes are leaf shapes'));
    const env = environment(source);
    await importFoundation(env, source);
    const before = await snapshot(env);
    const result = await env.runCode(payload.code);
    assert(
      result.errors.some(error => /Ellipse recipes are leaf shapes/.test(error))
    );
    assert.strictEqual(result.createdNodeIds.length, 0);
    assert.strictEqual(await snapshot(env), before);
    const neutral = await fixture('status-label', 'status-label.neutral');
    assert(neutral.payload.ellipseEnabled);
    assert(
      owned(neutral.env, 'family/status-label').children[0].findAll(
        node => node.type === 'ELLIPSE'
      ).length
    );
    console.log(
      'ok retained native ELLIPSE enables full leaf schema; malformed geometry refuses before writes'
    );
  }
  {
    for (const anchor of [
      'function mgSvgPlan(tree) {',
      '\nfunction mgSvgTopology(node) {',
      'mgMaintenanceAssertSource(\n    mgMaintenanceDependencyIds(recipes, selectedFamilyIds),\n    owned\n  );',
      "const editorial = family.id === 'editorial-cta';",
      "if (tree.type === 'ELLIPSE') {",
      "else if (spec.type === 'ELLIPSE') node = figma.createEllipse();",
      "if (spec.type === 'ELLIPSE')\n",
    ]) {
      const read = fs.readFileSync;
      let matched = false;
      fs.readFileSync = function (filename, ...args) {
        const source = read.call(this, filename, ...args);
        if (
          typeof filename !== 'string' ||
          !filename.endsWith('/kit-builder.js')
        )
          return source;
        matched = source.includes(anchor);
        return source.replace(anchor, '/* changed compiler boundary */');
      };
      try {
        await assert.rejects(
          compile(doc, 'checkbox', 'checkbox.true.default.after.short'),
          /Connector .*specialization boundary changed/
        );
        assert(matched, anchor);
      } finally {
        fs.readFileSync = read;
      }
    }
    console.log(
      'ok all seven added immutable-source boundaries fail closed when desktop source changes'
    );
  }
}
if (require.main === module)
  main().catch(error => {
    console.error(`FAIL ${error.stack || error}`);
    process.exitCode = 1;
  });
