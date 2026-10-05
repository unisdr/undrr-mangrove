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
const legacyNavigation = {
  destinations: [
    { id: 'start', label: '00 Start here / Mangrove' },
    { id: 'legacy-review', label: 'Mangrove / Review' },
    { id: 'legacy-main', label: 'Mangrove / Main components' },
    { id: 'legacy-diagnostics', label: 'Mangrove diagnostics / focus ring' },
  ],
  families: [
    { id: 'button', label: 'Button', group: 'Actions', hasExamples: true },
    {
      id: 'table',
      label: 'Table',
      group: 'Content and data',
      hasExamples: true,
    },
  ],
  errors: [],
};
const organizedNavigation = {
  ...legacyNavigation,
  destinations: DESTINATIONS.map(id => ({ id, label: 'Actual section ' + id })),
};
async function savedOperation(ui, expected) {
  ui.get('save-operation-report').click();
  assert.strictEqual(
    await ui.downloads.at(-1).blob.text(),
    JSON.stringify(expected, null, 2)
  );
}
async function main() {
  const sourceUi = mount();
  const sourceDoc = copy(doc);
  sourceDoc.plannedInventory.entries = [
    {
      id: 'source-fixture',
      catalogueTitle: 'Components/Fixture',
      source: 'stories/Fixture.stories.jsx',
      stories: [
        {
          id: 'good',
          exportName: 'Default',
          storybookId: 'components-fixture--default',
          previewKind: 'reference-preview',
          previewUrl:
            'https://mangrove.undrr.org/?path=/story/components-fixture--default',
        },
        {
          id: 'unsafe',
          exportName: 'Unsafe',
          previewKind: 'reference-preview',
          previewUrl: 'javascript:alert(1)',
        },
        {
          id: 'missing',
          exportName: 'Dynamic',
          previewUnavailableReason: 'Dynamic source identity requires review.',
        },
      ],
    },
  ];
  await sourceUi.load(sourceDoc);
  assert.strictEqual(
    sourceUi.get('source-preview').href,
    sourceDoc.plannedInventory.entries[0].stories[0].previewUrl
  );
  assert.strictEqual(sourceUi.get('source-preview').hidden, false);
  const sourceSelection = sourceUi.selectedFamilies();
  const messageCount = sourceUi.messages.length;
  for (const id of ['unsafe', 'missing']) {
    sourceUi.get('source-story').value = id;
    sourceUi
      .get('source-story')
      .dispatchEvent(new sourceUi.window.Event('change'));
    assert.strictEqual(sourceUi.get('source-preview').hidden, true);
    assert.strictEqual(
      sourceUi.get('source-preview').hasAttribute('href'),
      false
    );
  }
  assert.deepStrictEqual(sourceUi.selectedFamilies(), sourceSelection);
  assert.strictEqual(
    sourceUi.messages.length,
    messageCount,
    'References never request a native mutation or network fetch'
  );
  sourceDoc.plannedInventory.entries[0].scaffoldFamilyIds = ['hero-background'];
  await sourceUi.load(sourceDoc);
  sourceUi.send('kit-navigation-state', {
    destinations: [],
    families: [{ id: 'hero-background', label: 'Hero / Background' }],
  });
  assert.strictEqual(sourceUi.get('browse-source').disabled, false);
  const contextualMessages = sourceUi.messages.length;
  sourceUi.get('browse-source').click();
  assert.strictEqual(sourceUi.get('source-component').value, 'source-fixture');
  assert.strictEqual(sourceUi.get('source-story').value, 'good');
  assert.strictEqual(sourceUi.get('source-previews').open, true);
  assert.strictEqual(sourceUi.get('panel-diagnostics').hidden, false);
  assert.strictEqual(
    sourceUi.messages.length,
    contextualMessages,
    'Contextual source browsing is read-only'
  );
  sourceUi.dom.window.close();
  console.log(
    'ok source references reject unsafe links and preserve build selection'
  );
  const welcomeUi = mount();
  assert.deepStrictEqual(welcomeUi.messages.at(-1), {
    type: 'kit-navigation-state',
  });
  assert.strictEqual(welcomeUi.get('navigate-kit').disabled, true);
  welcomeUi.send('kit-navigation-state', legacyNavigation);
  assert.deepStrictEqual(
    [...welcomeUi.get('kit-destination').options].map(item => item.value),
    legacyNavigation.destinations.map(item => item.id)
  );
  assert(
    ![...welcomeUi.get('kit-destination').options].some(
      item => item.value === 'foundations'
    )
  );
  welcomeUi.get('open-welcome').click();
  assert.deepStrictEqual(welcomeUi.messages.at(-1), {
    type: 'navigate-kit',
    destination: 'start',
  });
  assert.strictEqual(welcomeUi.get('open-welcome').disabled, true);
  welcomeUi.send('kit-navigation-state', organizedNavigation);
  assert.strictEqual(
    welcomeUi.get('open-welcome').disabled,
    true,
    'Read-only state cannot release an outstanding operation'
  );
  welcomeUi.send('operation', {
    operation: 'kit-navigation',
    destination: 'start',
    errors: [],
  });
  assert.strictEqual(
    welcomeUi.get('save-operation-report').disabled,
    true,
    'Navigation creates no mutation receipt'
  );
  await welcomeUi.load();
  const choices = welcomeUi.selectedFamilies();
  welcomeUi.get('open-welcome').click();
  assert.deepStrictEqual(welcomeUi.messages.at(-1), {
    type: 'create-welcome',
    doc: copy(doc),
    brand: 'undrr',
  });
  const welcomeReceipt = {
    operation: 'kit-welcome',
    createdNodeIds: ['synthetic-welcome'],
    updatedNodeIds: [],
    errors: [],
  };
  welcomeUi.send('operation', welcomeReceipt);
  assert(welcomeUi.get('status').textContent.startsWith('Start here ready'));
  assert.deepStrictEqual(welcomeUi.selectedFamilies(), choices);
  await savedOperation(welcomeUi, welcomeReceipt);
  welcomeUi.get('open-welcome').click();
  const refused = {
    operation: 'kit-welcome',
    phase: 'refused',
    createdNodeIds: [],
    updatedNodeIds: [],
    errors: ['Exact source font unavailable'],
  };
  welcomeUi.send('operation', refused);
  assert(
    welcomeUi.get('log').textContent.includes('Exact source font unavailable')
  );
  await savedOperation(welcomeUi, refused);
  welcomeUi.dom.window.close();
  console.log(
    'ok startup advertises only inspected destinations; state responses retain pending work and Welcome receipts/refusals'
  );

  const ui = mount(),
    { get } = ui;
  ui.send('kit-navigation-state', organizedNavigation);
  assert.deepStrictEqual(
    [...get('kit-destination').options].map(item => item.value),
    DESTINATIONS
  );
  assert.strictEqual(
    get('kit-destination').getAttribute('aria-label'),
    'Kit destination'
  );
  assert.strictEqual(get('navigate-kit').disabled, false);
  assert.strictEqual(get('organize-kit').disabled, true);
  assert.strictEqual(
    get('browse-component').disabled,
    false,
    'Installed component browsing requires no token JSON'
  );
  await ui.load();
  const core = ui.selectedFamilies();
  assert.strictEqual(core.length, 25);
  get('build').click();
  ui.send('operation', buildReceipt);
  await savedOperation(ui, buildReceipt);
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
      'browse-component',
      'refresh-kit-guidance',
    ])
      assert.strictEqual(
        get(id).disabled,
        true,
        id + ' serialized during navigation'
      );
    ui.send('kit-navigation-state', organizedNavigation);
    assert.strictEqual(
      get('build').disabled,
      true,
      'Inspection response cannot clear the navigation lock'
    );
    get('organize-kit').click();
    get('navigate-kit').click();
    get('build').click();
    assert.strictEqual(
      ui.messages.length,
      before + 1,
      'Busy controls cannot queue operations'
    );
    get('workspace').scrollTop = 300;
    get('nav-core').click();
    assert.strictEqual(get('workspace').scrollTop, 0);
    ui.send('operation', {
      operation: 'kit-navigation',
      destination,
      nodeId: 'synthetic-target-' + destination,
      errors: [],
    });
    assert(get('status').textContent.startsWith('Viewing '));
    assert.deepStrictEqual(ui.selectedFamilies(), core);
    await savedOperation(ui, buildReceipt);
    assert.strictEqual(
      ui.downloads.at(-1).name,
      'mangrove-component-build-report.json'
    );
  }
  console.log(
    'ok six installed destinations serialize navigation and preserve the exact prior build receipt and 25-family selection'
  );

  get('browse-family').value = 'table';
  get('browse-view').value = 'example';
  get('browse-component').click();
  assert.deepStrictEqual(ui.messages.at(-1), {
    type: 'navigate-kit',
    destination: 'example:table',
  });
  ui.send('operation', {
    operation: 'kit-navigation',
    destination: 'example:table',
    errors: [],
  });
  get('browse-view').value = 'source';
  get('browse-component').click();
  assert.deepStrictEqual(ui.messages.at(-1), {
    type: 'navigate-kit',
    destination: 'source:table',
  });
  ui.send('operation', {
    operation: 'kit-navigation',
    destination: 'source:table',
    errors: [],
  });
  get('refresh-navigation').click();
  assert.deepStrictEqual(ui.messages.at(-1), { type: 'kit-navigation-state' });
  ui.send('kit-navigation-state', organizedNavigation);
  assert.strictEqual(get('browse-family').value, 'table');
  await savedOperation(ui, buildReceipt);
  get('probe-root').value = 'synthetic-disposable-root';
  get('probe-root').oninput();
  assert.strictEqual(
    get('compare-probes').disabled,
    false,
    'Read-only navigation preserves prior build comparison evidence'
  );
  assert.strictEqual(get('organize-kit').disabled, true);
  get('probe-root').value = '';
  get('probe-root').oninput();
  get('refresh-kit-guidance').click();
  assert.deepStrictEqual(ui.messages.at(-1), {
    type: 'refresh-kit-guidance',
    doc: copy(doc),
  });
  assert.strictEqual(get('browse-component').disabled, true);
  ui.send('kit-navigation-state', {
    destinations: [],
    families: [],
    errors: ['Synthetic inspection failure'],
  });
  assert.strictEqual(
    get('open-welcome').disabled,
    true,
    'Read-only inspection failure cannot release a pending description mutation'
  );
  const guidanceReceipt = {
    operation: 'kit-guidance',
    createdNodeIds: [],
    updatedNodeIds: ['synthetic-description'],
    errors: [],
  };
  ui.send('operation', guidanceReceipt);
  ui.send('kit-navigation-state', organizedNavigation);
  await savedOperation(ui, guidanceReceipt);
  assert(get('log').textContent.includes('geometry unchanged'));
  console.log(
    'ok example/source family browsing and read-only refresh preserve build evidence; description writes retain their own receipt'
  );

  ui.chooseFamilies(['button']);
  get('build').click();
  ui.send('operation', buildReceipt);
  get('organize-kit').click();
  assert.deepStrictEqual(ui.messages.at(-1), {
    type: 'organize-kit',
    doc: copy(doc),
    brand: 'undrr',
  });
  assert.strictEqual(get('navigate-kit').disabled, true);
  ui.send('kit-navigation-state', organizedNavigation);
  assert.strictEqual(get('navigate-kit').disabled, true);
  ui.send('operation', layoutReceipt);
  assert(
    get('status').textContent.includes('6 sections; 0 created, 1 updated')
  );
  assert.deepStrictEqual(ui.selectedFamilies(), ['button']);
  await savedOperation(ui, layoutReceipt);
  assert.strictEqual(
    ui.downloads.at(-1).name,
    'mangrove-organize-kit-report.json'
  );
  get('probe-root').value = 'synthetic-disposable-root';
  get('probe-root').oninput();
  assert.strictEqual(
    get('compare-probes').disabled,
    true,
    'Organization invalidates stale build evidence'
  );
  get('probe-root').value = '';
  get('probe-root').oninput();
  get('kit-destination').value = 'components';
  get('navigate-kit').click();
  ui.send('operation', {
    operation: 'kit-navigation',
    destination: 'components',
    errors: [],
  });
  await savedOperation(ui, layoutReceipt);
  get('probe-root').value = 'synthetic-disposable-root';
  get('probe-root').oninput();
  assert.strictEqual(
    get('compare-probes').disabled,
    true,
    'Navigation does not establish new build evidence'
  );
  get('probe-root').value = '';
  get('probe-root').oninput();
  const brands = [...get('modes').querySelectorAll('input')];
  brands[1].checked = true;
  get('modes').onchange();
  const count = ui.messages.length;
  get('organize-kit').click();
  assert.strictEqual(ui.messages.length, count);
  assert(get('status').textContent.includes('Select one brand'));
  brands[1].checked = false;
  get('modes').onchange();
  get('organize-kit').click();
  ui.window.onmessage({
    data: {
      pluginMessage: { type: 'error', message: 'Synthetic migration failure' },
    },
  });
  await savedOperation(ui, layoutReceipt);
  assert.strictEqual(get('results').getAttribute('data-state'), 'error');
  console.log(
    'ok organization guards/source serialization retain migration recovery while invalidating stale build evidence'
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
  assert.strictEqual(get('organize-kit').disabled, true);
  get('kit-destination').value = 'pending';
  get('navigate-kit').click();
  ui.send('kit-navigation-state', organizedNavigation);
  assert.strictEqual(
    get('remove-capability-probes').disabled,
    true,
    'State response leaves operation pending'
  );
  ui.send('operation', {
    operation: 'kit-navigation',
    destination: 'pending',
    errors: [],
  });
  get('save-test-record').click();
  assert.strictEqual(
    await ui.downloads.at(-1).blob.text(),
    JSON.stringify(record, null, 2)
  );
  await savedOperation(ui, layoutReceipt);
  assert.strictEqual(get('remove-capability-probes').disabled, false);
  assert.strictEqual(get('organize-kit').disabled, true);
  assert.deepStrictEqual(ui.selectedFamilies(), ['button']);
  ui.dom.window.close();
  console.log(
    'ok navigation and asynchronous state responses preserve exact cleanup ledger and last mutation receipt'
  );
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
