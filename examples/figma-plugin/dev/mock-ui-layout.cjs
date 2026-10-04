#!/usr/bin/env node
/** Actual navigation and organization UI protocol checks, not native layout acceptance. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require(require.resolve('jsdom', { paths: [process.cwd()] }));
const root = process.cwd();
const uiPath =
  process.env.MG_UI_FILE || path.join(root, 'examples/figma-plugin/ui.html');
const html = fs.readFileSync(uiPath, 'utf8');
const { buildFigmaVariables } = require(
  path.join(root, 'scripts/build-figma-tokens.cjs')
);
const doc = buildFigmaVariables();
const copy = value => JSON.parse(JSON.stringify(value));
function mount() {
  const dom = new JSDOM(html, {
    runScripts: 'outside-only',
    url: 'https://mangrove-ui.test/',
  });
  const { window } = dom,
    messages = [],
    downloads = [],
    blobs = new Map();
  window.parent.postMessage = data => messages.push(copy(data.pluginMessage));
  window.Blob = Blob;
  window.URL.createObjectURL = blob => {
    const key = 'blob:mock-' + blobs.size;
    blobs.set(key, blob);
    return key;
  };
  window.URL.revokeObjectURL = () => {};
  window.setTimeout = () => 0;
  window.HTMLAnchorElement.prototype.click = function () {
    downloads.push({ name: this.download, blob: blobs.get(this.href) });
  };
  window.eval(window.document.querySelector('script').textContent);
  const get = id => window.document.getElementById(id);
  async function load(value = doc) {
    Object.defineProperty(get('file'), 'files', {
      configurable: true,
      value: [{ text: async () => JSON.stringify(value) }],
    });
    get('file').dispatchEvent(new window.Event('change', { bubbles: true }));
    await new Promise(resolve => setImmediate(resolve));
  }
  const send = (type, result) =>
    window.onmessage({ data: { pluginMessage: { type, result } } });
  const selectedFamilies = () =>
    [...get('components').querySelectorAll('input:checked')].map(i => i.value);
  const chooseFamilies = ids => {
    for (const input of get('components').querySelectorAll('input'))
      input.checked = ids.includes(input.value);
    get('components').dispatchEvent(
      new window.Event('change', { bubbles: true })
    );
  };
  return {
    dom,
    window,
    get,
    messages,
    downloads,
    load,
    send,
    selectedFamilies,
    chooseFamilies,
  };
}

const DESTINATIONS = [
  'start',
  'foundations',
  'components',
  'compositions',
  'patterns',
  'pending',
];
const buildReceipt = {
  families: [{ id: 'button', setId: 'synthetic-button-set' }],
  createdNodeIds: [],
  updatedNodeIds: ['synthetic-component'],
  errors: [],
};
const layoutReceipt = {
  kind: 'mangrove-kit-layout',
  version: 1,
  sections: DESTINATIONS.map(id => ({ id, nodeId: 'synthetic-section-' + id })),
  createdNodeIds: [],
  updatedNodeIds: ['synthetic-layout'],
  errors: [],
  evidence: 'exact-synthetic-layout-data'.repeat(200),
};
async function main() {
  const ui = mount(),
    { get } = ui;
  assert.deepStrictEqual(
    [...get('kit-destination').options].map(o => o.value),
    DESTINATIONS
  );
  const source = fs.readFileSync(
    path.join(root, 'examples/figma-plugin/kit-layout.js'),
    'utf8'
  );
  const declared = source.match(
    /const MG_LAYOUT_DESTINATIONS = \[([\s\S]*?)\n\];/
  )[1];
  assert.deepStrictEqual(
    [...declared.matchAll(/\['([^']+)'/g)].map(m => m[1]),
    DESTINATIONS,
    'UI destination IDs match actual backend contract'
  );
  assert.strictEqual(
    get('kit-destination').getAttribute('aria-label'),
    'Kit destination'
  );
  assert.strictEqual(
    get('navigate-kit').disabled,
    false,
    'Navigation may recover an organized file without token JSON'
  );
  assert.strictEqual(
    get('organize-kit').disabled,
    true,
    'Organization requires source document'
  );
  await ui.load();
  const core = ui.selectedFamilies();
  assert.strictEqual(core.length, 25);
  for (const destination of DESTINATIONS) {
    get('kit-destination').value = destination;
    const before = ui.messages.length;
    get('navigate-kit').click();
    assert.deepStrictEqual(ui.messages.at(-1), {
      type: 'navigate-kit',
      destination,
    });
    for (const id of [
      'navigate-kit',
      'kit-destination',
      'organize-kit',
      'build',
      'import',
      'select-core',
      'select-all',
      'clear-selection',
      'family-search',
      'file',
    ])
      assert.strictEqual(
        get(id).disabled,
        true,
        id + ' serialized during navigation'
      );
    get('organize-kit').click();
    get('navigate-kit').click();
    get('build').click();
    assert.strictEqual(
      ui.messages.length,
      before + 1,
      'Busy controls cannot queue an operation'
    );
    get('workspace').scrollTop = 300;
    get('nav-core').click();
    assert.strictEqual(get('workspace').scrollTop, 0);
    const receipt = {
      kind: 'mangrove-kit-navigation',
      destination,
      nodeId: 'synthetic-target-' + destination,
      errors: [],
    };
    ui.send('operation', receipt);
    assert(get('status').textContent.startsWith('Viewing '));
    assert.deepStrictEqual(
      ui.selectedFamilies(),
      core,
      'Destination navigation preserves core selection'
    );
    get('save-operation-report').click();
    assert.strictEqual(
      ui.downloads.at(-1).name,
      'mangrove-navigate-kit-report.json'
    );
    assert.strictEqual(
      await ui.downloads.at(-1).blob.text(),
      JSON.stringify(receipt, null, 2)
    );
  }
  console.log(
    'ok six actual destination IDs dispatch serialized navigation and preserve25 core choices with exact independent receipts'
  );
  ui.chooseFamilies(['button']);
  get('build').click();
  ui.send('operation', buildReceipt);
  get('probe-root').value = 'synthetic-disposable-root';
  get('probe-root').oninput();
  assert.strictEqual(
    get('compare-probes').disabled,
    false,
    'Completed build is available for comparison'
  );
  assert.strictEqual(
    get('organize-kit').disabled,
    true,
    'Live override root prevents migration'
  );
  get('probe-root').value = '';
  get('probe-root').oninput();
  get('organize-kit').click();
  assert.deepStrictEqual(ui.messages.at(-1), {
    type: 'organize-kit',
    doc: copy(doc),
    brand: 'undrr',
  });
  assert.strictEqual(get('organize-kit').disabled, true);
  assert.strictEqual(get('navigate-kit').disabled, true);
  ui.send('operation', layoutReceipt);
  assert(
    get('status').textContent.includes('6 destinations; 0 created, 1 updated')
  );
  assert.deepStrictEqual(ui.selectedFamilies(), ['button']);
  get('save-operation-report').click();
  assert.strictEqual(
    ui.downloads.at(-1).name,
    'mangrove-organize-kit-report.json'
  );
  assert.strictEqual(
    await ui.downloads.at(-1).blob.text(),
    JSON.stringify(layoutReceipt, null, 2)
  );
  get('probe-root').value = 'synthetic-disposable-root';
  get('probe-root').oninput();
  assert.strictEqual(
    get('compare-probes').disabled,
    true,
    'Organization invalidates earlier build receipt and does not masquerade as a build'
  );
  get('probe-root').value = '';
  get('probe-root').oninput();
  get('kit-destination').value = 'components';
  get('navigate-kit').click();
  ui.send('operation', { destination: 'components', errors: [] });
  get('probe-root').value = 'synthetic-disposable-root';
  get('probe-root').oninput();
  assert.strictEqual(
    get('compare-probes').disabled,
    true,
    'Navigation cannot create new build evidence'
  );
  get('probe-root').value = '';
  get('probe-root').oninput();
  const brands = [...get('modes').querySelectorAll('input')];
  brands[1].checked = true;
  get('modes').onchange();
  const count = ui.messages.length;
  get('organize-kit').click();
  assert.strictEqual(
    ui.messages.length,
    count,
    'Organization requires exactly one brand'
  );
  assert(get('status').textContent.includes('Select one brand'));
  brands[1].checked = false;
  get('modes').onchange();
  get('organize-kit').click();
  ui.window.onmessage({
    data: {
      pluginMessage: { type: 'error', message: 'Synthetic migration failure' },
    },
  });
  get('save-operation-report').click();
  assert.strictEqual(
    JSON.parse(await ui.downloads.at(-1).blob.text()).destination,
    'components',
    'An operation failure preserves the last valid independent receipt'
  );
  assert.strictEqual(get('results').getAttribute('data-state'), 'error');
  console.log(
    'ok organization requires doc/single brand, serializes controls, preserves selection/downloads and invalidates stale build evidence'
  );
  const record = {
    kind: 'mangrove-native-capability-probes',
    version: 1,
    scope: 'core-content',
    rootId: 'synthetic-capability-root',
    runId: 'synthetic-run',
    ledger: [{ id: 'synthetic-capability-root', type: 'FRAME' }],
    errors: [],
  };
  await get('capability-file').onchange({
    target: { files: [{ text: async () => JSON.stringify(record) }] },
  });
  assert.strictEqual(
    get('organize-kit').disabled,
    true,
    'Live saved capability record prevents organization'
  );
  get('kit-destination').value = 'pending';
  get('navigate-kit').click();
  ui.send('operation', { destination: 'pending', errors: [] });
  get('save-test-record').click();
  assert.strictEqual(
    await ui.downloads.at(-1).blob.text(),
    JSON.stringify(record, null, 2),
    'Navigation receipt leaves exact recovery ledger independently downloadable'
  );
  assert.strictEqual(get('remove-capability-probes').disabled, false);
  assert.strictEqual(get('organize-kit').disabled, true);
  assert.deepStrictEqual(ui.selectedFamilies(), ['button']);
  ui.dom.window.close();
  console.log(
    'ok live capability records block organization while read-only navigation preserves exact cleanup recovery'
  );
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
