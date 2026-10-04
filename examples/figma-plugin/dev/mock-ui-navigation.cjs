#!/usr/bin/env node
/** Actual DOM/control-flow UI checks, not native Figma rendering or component acceptance. */
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
  window.parent.postMessage = data => {
    if (data.pluginMessage.type !== 'kit-navigation-state')
      messages.push(copy(data.pluginMessage));
  };
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
const buildReceipt = (ids = ['button']) => ({
  families: ids.map(id => ({ id, setId: 'synthetic-set-' + id })),
  createdNodeIds: [],
  updatedNodeIds: ['synthetic-layer'],
  errors: [],
  proof: { synthetic: true, raw: 'exact-full-private-result' },
});
function capability(advance = 0) {
  return {
    kind: 'mangrove-native-capability-probes',
    version: 1,
    scope: 'core-content',
    rootId: 'synthetic-root',
    runId: 'synthetic-run',
    ledger: Array.from({ length: [39, 58, 77][advance] }, (_, i) => ({
      id: 'synthetic-' + i,
    })),
    errors: [],
    tests: {},
    coreContent: {
      completedAdvances: advance,
      verdict: advance === 2 ? 'rebuild-fields-verified' : 'awaiting-rebuild',
      cohorts: Array.from({ length: 2 + advance }, () => ({
        members: [{}, {}, {}],
      })),
      errors: [],
    },
    privateEvidence: 'full-json-fixture'.repeat(100),
  };
}
async function main() {
  const ui = mount(),
    { get } = ui;
  const baseline = new JSDOM(
    fs.readFileSync(path.join(root, 'examples/figma-plugin/ui.html'), 'utf8')
  );
  for (const element of baseline.window.document.querySelectorAll('[id]'))
    assert(get(element.id), 'Existing ID retained: ' + element.id);
  const ids = [...ui.window.document.querySelectorAll('[id]')].map(e => e.id);
  assert.strictEqual(new Set(ids).size, ids.length, 'No duplicate static IDs');
  assert.strictEqual(get('panel-import').hidden, false);
  get('workspace').scrollTop = 300;
  get('nav-core').click();
  assert.strictEqual(get('workspace').scrollTop, 0);
  assert.strictEqual(get('panel-core').hidden, false);
  assert.strictEqual(get('panel-import').hidden, true);
  assert.strictEqual(get('nav-core').getAttribute('aria-current'), 'page');
  get('workspace').scrollTop = 300;
  get('nav-diagnostics').click();
  assert.strictEqual(get('workspace').scrollTop, 0);
  get('diag-overrides').click();
  assert.strictEqual(get('diagnostic-overrides').hidden, false);
  assert.strictEqual(get('diagnostic-native').hidden, true);
  assert.strictEqual(
    get('diag-overrides').getAttribute('aria-pressed'),
    'true'
  );
  for (const id of [
    'nav-import',
    'nav-core',
    'nav-diagnostics',
    'diag-native',
    'diag-overrides',
    'diag-editorial',
  ]) {
    assert.strictEqual(get(id).tagName, 'BUTTON');
    assert(
      get(get(id).getAttribute('aria-controls')),
      'Navigation references actual panel'
    );
  }
  assert.strictEqual(
    get('export-family').closest('section').id,
    'panel-diagnostics'
  );
  assert.strictEqual(
    get('export-review').closest('section').id,
    'panel-diagnostics'
  );
  assert.strictEqual(get('build').closest('section').id, 'panel-core');
  assert(
    html.includes('#panel-core .panel-actions') &&
      html.includes('position: static;')
  );
  assert.strictEqual(get('save-test-record').disabled, true);
  await ui.load();
  const expectedCore = doc.components.families
    .filter(f => !['tabs-trigger', 'tabs', 'editorial-cta'].includes(f.id))
    .map(f => f.id);
  assert.strictEqual(
    expectedCore.length,
    25,
    'Current actual source core excludes three pending families'
  );
  assert.deepStrictEqual(ui.selectedFamilies(), expectedCore);
  assert.strictEqual(get('prune').checked, false);
  assert(get('selection-count').textContent.includes('25 of 28'));
  const styles = [...get('text-styles').querySelectorAll('input:checked')].map(
    i => i.value
  );
  assert.strictEqual(styles.length, 9);
  const expectedStyles = doc.styles.text
    .filter(
      s =>
        s.id.startsWith('text.') &&
        s.id.endsWith('.regular') &&
        ((s.bindings.fontFamily === 'font-family/text' &&
          [
            'font-size/300',
            'font-size/button',
            'font-size/form-input',
          ].includes(s.bindings.fontSize)) ||
          (s.bindings.fontFamily === 'font-family/heading' &&
            [
              'font-size/400',
              'font-size/500',
              'font-size/600',
              'font-size/900',
              'font-size/1000',
              'font-size/1100',
            ].includes(s.bindings.fontSize)))
    )
    .map(s => s.id);
  assert.deepStrictEqual(styles, expectedStyles);
  for (const id of [
    'text.display.900.regular',
    'text.display.1000.regular',
    'text.ui.tab.regular',
  ]) {
    const input = [...get('text-styles').querySelectorAll('input')].find(
      i => i.value === id
    );
    assert(input, 'Pending style remains explicitly selectable');
    assert.strictEqual(input.checked, false);
    input.checked = true;
  }
  get('select-core-text').click();
  assert.deepStrictEqual(
    [...get('text-styles').querySelectorAll('input:checked')].map(i => i.value),
    expectedStyles
  );
  const beforeSearch = ui.selectedFamilies();
  get('family-search').value = 'Chips';
  get('family-search').dispatchEvent(new ui.window.Event('input'));
  assert.deepStrictEqual(
    [...get('components').querySelectorAll('label')]
      .filter(l => !l.hidden)
      .map(l => l.querySelector('input').value),
    ['chips']
  );
  assert.deepStrictEqual(
    ui.selectedFamilies(),
    beforeSearch,
    'Filtering must not change hidden selections'
  );
  get('select-all').click();
  assert.strictEqual(ui.selectedFamilies().length, 28);
  get('select-core').click();
  assert.deepStrictEqual(ui.selectedFamilies(), expectedCore);
  get('clear-selection').click();
  get('build').click();
  assert.strictEqual(
    ui.messages.length,
    0,
    'Empty selection must not accidentally build all families'
  );
  get('select-core').click();
  get('import').click();
  assert.strictEqual(ui.messages[0].type, 'import');
  assert.deepStrictEqual(ui.messages[0].textStyles, expectedStyles);
  for (const id of [
    'modes',
    'text-styles',
    'components',
    'prune',
    'effects',
    'select-core',
    'select-all',
    'clear-selection',
    'family-search',
    'select-core-text',
  ])
    assert.strictEqual(get(id).disabled, true, id + ' serialised');
  assert(
    get('modes').querySelector('input').matches(':disabled'),
    'Disabled fieldset protects brand inputs'
  );
  get('nav-core').click();
  assert.strictEqual(
    get('panel-core').hidden,
    false,
    'Navigation stays available during work'
  );
  assert.strictEqual(get('status').textContent, 'Working…');
  get('select-all').click();
  assert.deepStrictEqual(ui.selectedFamilies(), expectedCore);
  get('build').click();
  assert.strictEqual(ui.messages.length, 1);
  ui.send('result', {
    collection: 'Mangrove',
    modes: ['UNDRR'],
    counts: { created: 0, updated: 418, removed: 0, values: 418 },
    styles: {
      counts: {
        text: { created: 0, updated: 9, failed: 0 },
        effect: { created: 0, updated: 8, failed: 0 },
      },
      missingFonts: [],
    },
    stale: [],
    errors: [],
    skipped: [],
  });
  assert.strictEqual(
    get('panel-core').hidden,
    false,
    'Successful import moves to Core'
  );
  assert.strictEqual(get('results').getAttribute('data-state'), 'idle');
  const unknown = mount(),
    future = copy(doc);
  future.components.families.push({
    id: 'future-component',
    name: 'Mangrove/Future component',
    variants: [],
  });
  future.styles.text.push({
    ...copy(doc.styles.text.find(s => s.id === 'text.text.300.regular')),
    id: 'text.future.300.regular',
    name: 'Synthetic future style',
  });
  await unknown.load(future);
  const futureStyle = [
    ...unknown.get('text-styles').querySelectorAll('input'),
  ].find(i => i.value === 'text.future.300.regular');
  assert.strictEqual(
    futureStyle.checked,
    false,
    'A future style with matching bindings cannot enter the nine-role preset'
  );
  futureStyle.checked = true;
  unknown.get('select-core-text').click();
  assert.strictEqual(futureStyle.checked, false);
  assert(
    !unknown.selectedFamilies().includes('future-component'),
    'New family cannot be promoted implicitly'
  );
  unknown.get('select-all').click();
  assert(
    unknown.selectedFamilies().includes('future-component'),
    'Explicit all remains available'
  );
  unknown.get('select-core').click();
  assert.deepStrictEqual(unknown.selectedFamilies(), expectedCore);
  const futureLabel = [
    ...unknown.get('components').querySelectorAll('label'),
  ].find(l => l.querySelector('input').value === 'future-component');
  assert(futureLabel.textContent.includes('Outside core'));
  unknown.dom.window.close();
  console.log(
    'ok actual DOM keeps IDs/navigation, source-derived25-family/nine-Regular presets, explicit font exceptions, non-destructive search and serialized choices'
  );
  ui.chooseFamilies(['button']);
  get('build').click();
  const large = {
    ...buildReceipt(),
    updatedNodeIds: Array.from(
      { length: 30000 },
      (_, i) => 'private-layer-' + i
    ),
    diagnosticData: 'private-long-source-evidence'.repeat(10000),
  };
  ui.send('operation', large);
  assert(get('log').textContent.startsWith('Component build finished.'));
  assert(get('log').textContent.includes('30000 layers'));
  assert.strictEqual(
    get('status').textContent,
    'Component build finished. 1 family; 0 created, 30000 updated; 0 errors.',
    'Collapsed results still expose complete bounded build counts'
  );
  assert.strictEqual(get('result-details').open, false);
  assert(!get('log').textContent.includes('private-layer-'));
  assert(!get('log').textContent.includes('private-long-source-evidence'));
  assert(get('log').textContent.length < 4096);
  get('save-operation-report').click();
  assert.strictEqual(
    ui.downloads.at(-1).name,
    'mangrove-component-build-report.json'
  );
  assert.strictEqual(
    await ui.downloads.at(-1).blob.text(),
    JSON.stringify(large, null, 2)
  );
  get('build').click();
  ui.window.onmessage({
    data: { pluginMessage: { type: 'error', message: 'Synthetic failure' } },
  });
  get('save-operation-report').click();
  assert.strictEqual(
    await ui.downloads.at(-1).blob.text(),
    JSON.stringify(large, null, 2),
    'Failed operation preserves prior valid receipt'
  );
  get('build').click();
  ui.send('operation', {
    ...buildReceipt(),
    errors: ['Synthetic component error'],
  });
  assert.strictEqual(
    get('status').textContent,
    'Component build finished with issues. 1 family; 0 created, 1 updated; 1 error.',
    'Failed builds retain counts in the visible issue headline'
  );
  assert.strictEqual(get('results').getAttribute('data-state'), 'error');
  get('nav-import').click();
  get('import').click();
  ui.send('result', {
    collection: 'Mangrove',
    modes: ['UNDRR'],
    counts: { created: 0, updated: 418, removed: 0, values: 418 },
    styles: {
      counts: {
        text: { created: 0, updated: 9, failed: 3 },
        effect: { created: 0, updated: 8, failed: 0 },
      },
      missingFonts: ['Synthetic missing font'],
    },
    stale: [],
    errors: [],
    skipped: [],
  });
  assert.strictEqual(get('results').getAttribute('data-state'), 'error');
  assert.strictEqual(get('status').textContent, 'Import finished with issues.');
  assert.strictEqual(
    get('panel-import').hidden,
    false,
    'Failed styles do not navigate away from Import'
  );
  assert.strictEqual(
    get('result-details').open,
    false,
    'Issue headline does not require opening details'
  );
  console.log(
    'ok build results show bounded useful counts without asset IDs and retain byte-exact receipts through errors'
  );
  const content = mount();
  await content.load();
  const c = content.get;
  c('nav-diagnostics').click();
  c('capability-scope').value = 'core-content';
  c('capability-scope').dispatchEvent(new content.window.Event('change'));
  assert(c('diagnostic-note').textContent.includes('UNDRR only'));
  c('capability-probes').click();
  assert.strictEqual(content.messages.at(-1).scope, 'core-content');
  const prepare = capability();
  content.send('operation', prepare);
  assert.strictEqual(
    c('advance-segmented-capability-probes').disabled,
    true,
    'Prepare clears old build evidence'
  );
  assert(c('log').textContent.includes('2 cohorts / 6 test instances'));
  assert.strictEqual(c('live-test-warning').hidden, false);
  assert.strictEqual(c('save-test-record').disabled, false);
  c('save-test-record').click();
  assert.strictEqual(
    content.downloads.at(-1).name,
    'mangrove-test-record.json'
  );
  assert.strictEqual(
    await content.downloads.at(-1).blob.text(),
    JSON.stringify(prepare, null, 2)
  );
  content.chooseFamilies(['chips', 'text-cta', 'empty-state-compact']);
  c('nav-core').click();
  c('build').click();
  content.send(
    'operation',
    buildReceipt(['chips', 'text-cta', 'empty-state-compact'])
  );
  assert.strictEqual(c('advance-segmented-capability-probes').disabled, false);
  c('save-test-record').click();
  assert.strictEqual(
    await content.downloads.at(-1).blob.text(),
    JSON.stringify(prepare, null, 2),
    'Build receipt must not replace recovery ledger'
  );
  c('save-operation-report').click();
  assert.strictEqual(
    await content.downloads.at(-1).blob.text(),
    JSON.stringify(
      buildReceipt(['chips', 'text-cta', 'empty-state-compact']),
      null,
      2
    )
  );
  await content.load();
  assert.strictEqual(
    c('advance-segmented-capability-probes').disabled,
    true,
    'Token reload invalidates prior build evidence'
  );
  assert.strictEqual(
    c('remove-capability-probes').disabled,
    false,
    'Token reload retains cleanup ledger'
  );
  c('save-test-record').click();
  assert.strictEqual(
    await content.downloads.at(-1).blob.text(),
    JSON.stringify(prepare, null, 2)
  );
  content.chooseFamilies(['chips', 'text-cta', 'empty-state-compact']);
  c('build').click();
  content.send(
    'operation',
    buildReceipt(['chips', 'text-cta', 'empty-state-compact'])
  );
  c('modes')
    .querySelector('input')
    .dispatchEvent(new content.window.Event('change', { bubbles: true }));
  assert.strictEqual(
    c('advance-segmented-capability-probes').disabled,
    true,
    'Brand change invalidates prior build evidence'
  );
  assert.strictEqual(c('remove-capability-probes').disabled, false);
  c('build').click();
  content.send(
    'operation',
    buildReceipt(['chips', 'text-cta', 'empty-state-compact'])
  );
  c('advance-segmented-capability-probes').click();
  assert.strictEqual(
    content.messages.at(-1).type,
    'advance-segmented-capability-probes'
  );
  assert.deepStrictEqual(content.messages.at(-1).report, prepare);
  const one = capability(1);
  content.send('operation', one);
  assert.strictEqual(c('advance-segmented-capability-probes').disabled, true);
  c('save-test-record').click();
  assert.strictEqual(
    await content.downloads.at(-1).blob.text(),
    JSON.stringify(one, null, 2),
    'Advance replaces the saved recovery ledger'
  );
  c('build').click();
  content.send(
    'operation',
    buildReceipt(['chips', 'text-cta', 'empty-state-compact'])
  );
  c('advance-segmented-capability-probes').click();
  const two = capability(2);
  content.send('operation', two);
  assert.strictEqual(c('advance-segmented-capability-probes').disabled, true);
  assert(c('log').textContent.includes('4 cohorts / 12 test instances'));
  c('save-operation-report').click();
  assert.strictEqual(
    await content.downloads.at(-1).blob.text(),
    JSON.stringify(two, null, 2)
  );
  const recovered = mount();
  await recovered.get('capability-file').onchange({
    target: { files: [{ text: async () => JSON.stringify(two) }] },
  });
  assert.strictEqual(recovered.get('capability-scope').value, 'core-content');
  assert(
    recovered
      .get('diagnostic-note')
      .textContent.includes('Chips, Text CTA and Empty state')
  );
  assert.strictEqual(
    recovered.get('status').textContent,
    'Saved test record loaded. Verify ownership before removal.'
  );
  assert(!recovered.get('status').textContent.includes(two.rootId));
  recovered.get('save-test-record').click();
  assert.strictEqual(
    await recovered.downloads.at(-1).blob.text(),
    JSON.stringify(two, null, 2)
  );
  assert.strictEqual(
    recovered.get('remove-capability-probes').disabled,
    false,
    'Saved ledger enables exact cleanup without doc'
  );
  assert.strictEqual(
    recovered.get('advance-segmented-capability-probes').disabled,
    true
  );
  recovered.get('remove-capability-probes').click();
  assert.deepStrictEqual(recovered.messages.at(-1).report, two);
  recovered.send('operation', {
    kind: 'mangrove-native-capability-probes',
    version: 1,
    rootId: two.rootId,
    removedNodeIds: ['synthetic-root'],
    errors: [],
  });
  assert.strictEqual(recovered.get('remove-capability-probes').disabled, true);
  assert.strictEqual(recovered.get('save-test-record').disabled, true);
  assert.strictEqual(recovered.get('live-test-warning').hidden, true);
  const failed = mount();
  await failed.load();
  failed.get('capability-probes').click();
  const partial = {
    ...capability(),
    errors: ['Synthetic preparation failure'],
  };
  failed.send('operation', partial);
  assert.strictEqual(failed.get('results').getAttribute('data-state'), 'error');
  assert.strictEqual(
    failed.get('status').textContent,
    'Check finished with issues.'
  );
  assert.strictEqual(failed.get('save-test-record').disabled, false);
  failed.get('save-test-record').click();
  assert.strictEqual(
    await failed.downloads.at(-1).blob.text(),
    JSON.stringify(partial, null, 2)
  );
  const unsupported = mount();
  await unsupported.load();
  unsupported.get('capability-probes').click();
  unsupported.send('operation', {
    ...capability(),
    tests: { synthetic: { supported: false } },
  });
  assert.strictEqual(
    unsupported.get('results').getAttribute('data-state'),
    'notice'
  );
  assert.strictEqual(
    unsupported.get('status').textContent,
    'Check finished. Some criteria need review.'
  );
  failed.dom.window.close();
  unsupported.dom.window.close();
  console.log(
    'ok core-content reports keep39/58/77 raw ledgers, consume two fresh builds, show cohorts and recover exact cleanup without a loaded document'
  );
  for (const context of [ui, content, recovered]) context.dom.window.close();
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
