#!/usr/bin/env node
/** Verify read-only review exports with exact owned scene references. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const DIR = path.resolve(__dirname, '..');

function fixture(change = () => {}) {
  const exports = [];
  let writes = 0;
  function node(id, name, key, type = 'FRAME') {
    return {
      id,
      name,
      key,
      type,
      width: 736,
      height: 1200,
      children: [],
      parent: null,
      getSharedPluginData(namespace, field) {
        assert.strictEqual(namespace, 'orgundrrmangrove');
        assert.strictEqual(field, 'mgKitId');
        return this.key;
      },
      getPluginData() {
        return '';
      },
      async exportAsync(options) {
        exports.push({ id: this.id, options });
        return new Uint8Array([137, 80, 78, 71]);
      },
    };
  }
  function attach(parent, child) {
    parent.children.push(child);
    child.parent = parent;
  }
  const page = node('page', 'Page', '', 'PAGE');
  const root = node('review-root', 'Mangrove / Review', 'review');
  root.width = 800;
  root.height = 31328;
  const family = node('button-review', 'Mangrove/Button', 'review/button');
  const diagnostics = node(
    'focus-root',
    'Mangrove diagnostics / focus ring',
    'diagnostics.focus-ring'
  );
  attach(page, root);
  attach(root, family);
  attach(page, diagnostics);
  change({ page, root, family, diagnostics, node, attach });
  page.findAll = predicate => {
    const found = [];
    function visit(parent) {
      for (const child of parent.children) {
        if (predicate(child)) found.push(child);
        visit(child);
      }
    }
    visit(page);
    return found;
  };
  function serialise(parent) {
    return JSON.stringify({
      id: parent.id,
      name: parent.name,
      key: parent.key,
      type: parent.type,
      width: parent.width,
      height: parent.height,
      parentId: parent.parent?.id,
      children: parent.children.map(child => JSON.parse(serialise(child))),
    });
  }
  const before = serialise(page);
  function freeze(parent) {
    parent.children.forEach(freeze);
    Object.freeze(parent.children);
    Object.freeze(parent);
  }
  freeze(page);
  const rejectWrite = () => {
    writes += 1;
    throw new Error('Canvas mutation during export');
  };
  const context = vm.createContext({
    figma: {
      currentPage: page,
      createFrame: rejectWrite,
      createRectangle: rejectWrite,
      createText: rejectWrite,
    },
    errorMessage: error => String(error),
  });
  for (const file of ['kit-identity.js', 'kit-inspection.js'])
    vm.runInContext(fs.readFileSync(path.join(DIR, file), 'utf8'), context);
  return {
    exports,
    async call(name, options) {
      context.exportArgs = [name, options];
      try {
        return await vm.runInContext(
          'exportMangroveReview(...exportArgs)',
          context
        );
      } finally {
        assert.strictEqual(serialise(page), before, 'Export changed the scene');
        assert.strictEqual(writes, 0, 'Export invoked a canvas write');
      }
    },
  };
}

async function main() {
  const scene = fixture();
  const full = await scene.call('Mangrove / Review');
  assert.strictEqual(full.id, 'review-root');
  assert.strictEqual(full.rootId, 'review-root');
  assert.strictEqual(full.scope, 'review');
  assert.strictEqual(full.familyId, null);
  assert.strictEqual(full.height, 31328);
  assert.deepStrictEqual(Array.from(full.bytes), [137, 80, 78, 71]);
  const scoped = await scene.call('Mangrove / Review', {
    familyId: 'button',
    scale: 1,
  });
  assert.strictEqual(scoped.id, 'button-review');
  assert.strictEqual(scoped.rootId, 'review-root');
  assert.strictEqual(scoped.scope, 'family');
  assert.strictEqual(scoped.familyId, 'button');
  assert.strictEqual(scoped.width, 736);
  assert.strictEqual(scoped.height, 1200);
  assert.deepStrictEqual(Array.from(scoped.bytes), [137, 80, 78, 71]);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(scene.exports)), [
    {
      id: 'review-root',
      options: { format: 'PNG', constraint: { type: 'SCALE', value: 2 } },
    },
    {
      id: 'button-review',
      options: { format: 'PNG', constraint: { type: 'SCALE', value: 1 } },
    },
  ]);
  const diagnostic = await scene.call('Mangrove diagnostics / focus ring');
  assert.strictEqual(diagnostic.id, 'focus-root');
  assert.strictEqual(diagnostic.scope, 'diagnostics');
  const renamed = fixture(({ root, family }) => {
    root.name = 'Renamed root';
    family.name = 'Renamed family';
  });
  assert.strictEqual(
    (await renamed.call('Mangrove / Review', { familyId: 'button' })).id,
    'button-review',
    'Exact ownership survives display-name changes'
  );
  console.log(
    'ok  full, family and diagnostic exports preserve exact IDs, dimensions, PNG bytes and scale without writes'
  );

  const failures = [
    { name: 'Guessed frame', options: {} },
    { options: { familyId: '' } },
    { options: { familyId: '../button' } },
    { options: { familyId: ['button', 'text-input'] } },
    { options: { familyId: 'unknown' } },
    {
      name: 'Mangrove diagnostics / focus ring',
      options: { familyId: 'button' },
    },
    { options: { scale: 0 } },
    {
      options: { familyId: 'button' },
      change: ({ family }) => {
        family.key = 'foreign';
      },
    },
    {
      options: { familyId: 'button' },
      change: ({ family }) => {
        family.type = 'INSTANCE';
      },
    },
    {
      options: { familyId: 'button' },
      change: ({ root, node, attach }) => {
        attach(root, node('duplicate', 'Other', 'review/button'));
      },
    },
    {
      options: {},
      change: ({ page, node, attach }) => {
        attach(page, node('duplicate-root', 'Other', 'review'));
      },
    },
    {
      options: {},
      change: ({ root }) => {
        root.key = 'foreign';
      },
    },
    {
      options: {},
      change: ({ root }) => {
        root.type = 'COMPONENT';
      },
    },
    {
      options: { familyId: 'button' },
      change: ({ page, root, family }) => {
        root.children = [];
        page.children.push(family);
        family.parent = page;
      },
    },
    {
      options: {},
      change: ({ page, root, node, attach }) => {
        page.children = page.children.filter(child => child !== root);
        const foreign = node('foreign-parent', 'Other', 'foreign');
        attach(page, foreign);
        attach(foreign, root);
      },
    },
  ];
  for (const failure of failures) {
    const invalid = fixture(failure.change);
    await assert.rejects(() =>
      invalid.call(failure.name || 'Mangrove / Review', failure.options)
    );
    assert.strictEqual(
      invalid.exports.length,
      0,
      'Rejected target was exported'
    );
  }
  console.log(
    'ok  invalid selection, foreign/duplicate/wrong-type ownership and misplaced roots/families reject before export without writes'
  );
}

if (require.main === module)
  main().catch(error => {
    console.error(`FAIL ${error.stack || error}`);
    process.exitCode = 1;
  });
