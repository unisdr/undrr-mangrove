#!/usr/bin/env node
/** Supported API shape for journaled preparation, not native font acceptance. */
'use strict';
const assert = require('assert'),
  fs = require('fs'),
  path = require('path'),
  vm = require('vm');
const context = vm.createContext({ module: { exports: {} } });
vm.runInContext(
  fs.readFileSync(path.join(__dirname, '../kit-rich-text.js'), 'utf8') +
    '\n' +
    fs.readFileSync(path.join(__dirname, '../kit-font-defaults.js'), 'utf8'),
  context
);
const { mgResolveNamedFontDefaults: resolve } = context.module.exports;
const copy = x => JSON.parse(JSON.stringify(x));
const input = [
  { family: 'Inter', style: 'Regular' },
  { family: 'Roboto', style: 'Regular' },
  { family: 'Roboto', style: 'Bold' },
];
function environment(options = {}) {
  const state = {
    created: [],
    removed: [],
    loaded: new Set(),
    nodes: new Map(),
    styles: [
      {
        id: 'style-existing',
        name: 'Existing',
        fontName: {
          family: 'Roboto',
          style: 'Regular',
          variationSettings: { wdth: 100, wght: 400 },
        },
        fontSize: 16,
      },
    ],
    collections: [],
    variables: [],
  };
  const page = {
    id: 'page',
    children: [],
    findAll: () => {
      if (options.failSceneAfterCreate && state.created.length)
        throw Error('scene unavailable');
      return [...state.nodes.values()];
    },
  };
  const existing = {
    id: 'existing',
    type: 'FRAME',
    parent: page,
    x: 12,
    y: 34,
    width: 200,
    height: 60,
    rotation: 0,
    visible: true,
    opacity: 1,
  };
  page.children.push(existing);
  state.nodes.set(existing.id, existing);
  const concrete = font => ({
    ...font,
    variationSettings:
      font.family === 'Inter'
        ? { wght: 400, slnt: 0 }
        : { wght: font.style === 'Bold' ? 700 : 400, wdth: 100 },
  });
  const api = {
    currentPage: page,
    fileKey: 'GbVTvFbuWjoJr6Bf5t4fhg',
    getLocalTextStylesAsync: async () => state.styles,
    getLocalEffectStylesAsync: async () => [],
    variables: {
      getLocalVariableCollectionsAsync: async () => state.collections,
      getLocalVariablesAsync: async () => state.variables,
    },
    listAvailableFontsAsync: async () => input.map(fontName => ({ fontName })),
    getFontFamilyVariationAxes: family =>
      family === 'Inter' ? ['slnt', 'wght'] : ['wdth', 'wght'],
    loadFontAsync: async font => {
      await Promise.resolve();
      if (options.failLoad && font.family === 'Roboto')
        throw Error('missing source face');
      state.loaded.add(font.family + '/' + font.style);
      if (options.changedDuringLoad) api.fileKey = 'changed';
    },
    getNodeByIdAsync: async id => {
      await Promise.resolve();
      if (options.failLookup) throw Error('cleanup lookup unavailable');
      if (options.changedDuringCleanup) api.fileKey = 'changed';
      return state.nodes.get(id) || null;
    },
    createText: () => {
      assert(state.loaded.has('Inter/Regular'));
      const id = 'probe-' + (state.created.length + 1);
      let font = concrete(input[0]);
      const node = {
        id,
        type: 'TEXT',
        parent: page,
        characters: '',
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        removed: false,
        get fontName() {
          if (options.failRead && font.family === 'Roboto')
            throw Error('unreadable concrete font');
          return copy(font);
        },
        set fontName(value) {
          assert(state.loaded.has(value.family + '/' + value.style));
          if (options.failAssign && value.family === 'Roboto')
            throw Error('font assignment failure');
          font = concrete(value);
          if (options.invalidAxis && value.family === 'Roboto')
            font.variationSettings.wght = NaN;
        },
        remove() {
          if (options.failCleanup) throw Error('remove failure');
          this.removed = true;
          state.nodes.delete(id);
          page.children = page.children.filter(n => n !== this);
          if (!state.removed.includes(id)) state.removed.push(id);
        },
        getStyledTextSegments: () => [],
      };
      state.created.push(id);
      state.nodes.set(id, node);
      page.children.push(node);
      return node;
    },
  };
  const assertTarget = () => {
    if (api.fileKey !== 'GbVTvFbuWjoJr6Bf5t4fhg') throw Error('target refused');
  };
  const assets = () =>
    JSON.stringify({
      styles: state.styles,
      collections: state.collections,
      variables: state.variables,
    });
  return { api, state, assertTarget, assets };
}
async function main() {
  const env = environment(),
    before = env.assets();
  const report = await resolve(env.api, [...input, input[1]], env.assertTarget);
  assert.deepStrictEqual(copy(report.errors), []);
  assert.strictEqual(report.createdNodeIds.length, 3);
  assert.deepStrictEqual(
    copy(report.createdNodeIds),
    copy(report.removedNodeIds)
  );
  assert.strictEqual(report.residualNodeIds.length, 0);
  assert(report.recordedSceneExact && report.recordedAssetsExact);
  assert.strictEqual(env.assets(), before);
  assert.strictEqual(env.state.nodes.size, 1);
  assert.deepStrictEqual(copy(report.resolvedFonts[1].fontName), {
    family: 'Roboto',
    style: 'Regular',
    variationSettings: { wdth: 100, wght: 400 },
  });
  const second = await resolve(env.api, input, env.assertTarget);
  assert.strictEqual(
    second.createdNodeIds.length,
    3,
    'defaults must resolve afresh each operation'
  );
  for (const options of [
    { failLoad: true },
    { failAssign: true },
    { failRead: true },
    { invalidAxis: true },
    { changedDuringLoad: true },
    { changedDuringCleanup: true },
  ]) {
    const env = environment(options),
      before = env.assets();
    const report = await resolve(env.api, input, env.assertTarget);
    assert(report.errors.length, JSON.stringify(options));
    assert.strictEqual(env.state.nodes.size, 1, JSON.stringify(options));
    assert.strictEqual(report.residualNodeIds.length, 0);
    assert.strictEqual(env.assets(), before);
    assert.deepStrictEqual(
      [...report.createdNodeIds].sort(),
      [...report.removedNodeIds].sort()
    );
  }
  const missing = environment();
  const refused = await resolve(missing.api, input);
  assert(
    refused.errors.some(error =>
      error.includes('trusted operation target hook')
    )
  );
  assert.strictEqual(missing.state.created.length, 0);
  const cleanup = environment({ failCleanup: true }),
    cleanupAssets = cleanup.assets();
  const failed = await resolve(cleanup.api, input, cleanup.assertTarget);
  assert(failed.errors.length);
  assert(failed.residualNodeIds.length);
  assert(!failed.recordedSceneExact);
  assert.strictEqual(cleanup.assets(), cleanupAssets);
  const unavailable = environment({ failLookup: true });
  const unavailableReport = await resolve(
    unavailable.api,
    input,
    unavailable.assertTarget
  );
  assert(unavailableReport.errors.length);
  assert(unavailableReport.unverifiedRemovalNodeIds.length);
  assert.strictEqual(unavailable.state.nodes.size, 1);
  const unreadable = environment({ failSceneAfterCreate: true });
  const unreadableReport = await resolve(
    unreadable.api,
    input,
    unreadable.assertTarget
  );
  assert(
    unreadableReport.errors.some(error => error.includes('scene unavailable'))
  );
  assert.strictEqual(unreadable.state.nodes.size, 1);
  const override = environment();
  const changed = await resolve(
    override.api,
    [{ ...input[1], variationSettings: { wght: 450 } }],
    override.assertTarget
  );
  assert(changed.errors.some(error => error.includes('axes disagree')));
  assert.strictEqual(override.state.nodes.size, 1);
  const invalid = environment();
  const invalidReport = await resolve(
    invalid.api,
    [{ ...input[1], variationSettings: { wght: NaN } }],
    invalid.assertTarget
  );
  assert(invalidReport.errors.length);
  assert.strictEqual(invalid.state.created.length, 0);
  console.log(
    'Named font preparation: native-shaped defaults, operation-only cache, exact cleanup, source-axis refusal, missing/changed target, font/read/set failure and residual cleanup refusal pass. Installed/native rich acceptance remains open.'
  );
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
