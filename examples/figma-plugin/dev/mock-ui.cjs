#!/usr/bin/env node
/** Exercise real UI messages and downloads without rendering a browser. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { environment, importFoundation } = require('./mock-kit.cjs');
const DIR = path.resolve(__dirname, '..');

function mountUI() {
  const html = fs.readFileSync(path.join(DIR, 'ui.html'), 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert(script, 'Plugin UI script is missing');
  const elements = new Map();
  for (const match of html.matchAll(/<[a-z][^>]*\bid="([^"]+)"[^>]*>/g)) {
    elements.set(match[1], {
      disabled: /\bdisabled\b/.test(match[0]),
      hidden: /\bhidden\b/.test(match[0]),
      checked: /\bchecked\b/.test(match[0]),
      textContent: '',
      checkedInputs: [],
      querySelectorAll(selector) {
        assert.strictEqual(selector, 'input:checked');
        return this.checkedInputs;
      },
      click() {
        // Native disabled buttons do not dispatch their click handler.
        if (!this.disabled) this.onclick?.();
      },
      addEventListener() {},
    });
  }
  const messages = [];
  const downloads = [];
  const blobs = new Map();
  const window = {};
  const context = vm.createContext({
    window,
    document: {
      getElementById(id) {
        assert(elements.has(id), `Unknown UI element ${id}`);
        return elements.get(id);
      },
      createElement(tag) {
        assert.strictEqual(tag, 'a', 'Only report download anchors are needed');
        return {
          click() {
            downloads.push({ name: this.download, blob: blobs.get(this.href) });
          },
        };
      },
    },
    parent: {
      postMessage(message) {
        messages.push(message.pluginMessage);
      },
    },
    Blob,
    URL: {
      createObjectURL(blob) {
        const id = `blob:mock-${blobs.size}`;
        blobs.set(id, blob);
        return id;
      },
      revokeObjectURL() {},
    },
    setTimeout() {},
    Uint8Array,
  });
  vm.runInContext(script, context);
  return {
    elements,
    messages,
    downloads,
    window,
    setDocument(doc) {
      context.fixtureDoc = doc;
      vm.runInContext('doc = fixtureDoc; refreshControls()', context);
    },
  };
}

async function main() {
  const doc = JSON.parse(
    fs.readFileSync(path.join(DIR, 'mangrove-variables.json'), 'utf8')
  );
  const env = environment(doc);
  await importFoundation(env, doc);
  const built = await env.call('buildMangroveComponents', doc, 'undrr');
  assert.strictEqual(built.errors.length, 0, built.errors.join('\n'));
  const report = JSON.parse(
    JSON.stringify(await env.call('inspectMangroveKit'))
  );
  const text = report.nodes.find(node => node.type === 'TEXT');
  text.characters = 'fixture-only-large-text'.repeat(160000);
  const fullJSON = JSON.stringify(report, null, 2);
  assert(Buffer.byteLength(fullJSON) > 3_000_000);

  const ui = mountUI();
  const element = id => ui.elements.get(id);
  element('inspect').onclick();
  assert.strictEqual(ui.messages[0].type, 'inspect');
  assert.strictEqual(ui.messages[0].checkFonts, false);
  assert.strictEqual(element('inspect').disabled, true);
  assert.strictEqual(element('log').textContent, 'Working…');
  ui.window.onmessage({
    data: { pluginMessage: { type: 'inspection', result: report } },
  });
  assert.strictEqual(element('inspect').disabled, false);
  assert.strictEqual(element('save-report').disabled, false);
  const displayed = element('log').textContent;
  assert(displayed.startsWith('Inspection complete.'));
  assert(displayed.includes(`${report.variables.length} variables`));
  assert(displayed.includes(`${report.nodes.length} nodes`));
  assert(displayed.includes('UNDRR'));
  assert(displayed.includes('Fonts: not checked.'));
  assert(!displayed.includes('fixture-only-large-text'));
  assert(
    displayed.length < 4096,
    'Large report must have a bounded UI summary'
  );
  element('save-report').onclick();
  assert.strictEqual(ui.downloads[0].name, 'mangrove-kit-inspection.json');
  assert.strictEqual(ui.downloads[0].blob.type, 'application/json');
  const downloaded = await ui.downloads[0].blob.text();
  assert.strictEqual(
    downloaded,
    fullJSON,
    'Download must retain every report field'
  );
  assert.deepStrictEqual(JSON.parse(downloaded), report);
  console.log(
    'ok  multi-megabyte real inspection fixture displays a bounded summary, enables controls and downloads exact full data'
  );

  report.collections = Array.from({ length: 100 }, () => ({
    name: 'collection-name'.repeat(100),
    modes: Array.from({ length: 100 }, () => ({
      name: 'brand-name'.repeat(100),
    })),
  }));
  report.errors = Array(100).fill('inspection-error'.repeat(10000));
  report.fonts = {
    loads: Array.from({ length: 100 }, () => ({
      fontName: { family: 'Roboto Condensed', style: 'Bold' },
      loaded: false,
      error: 'font-failure'.repeat(10000),
    })),
    errors: Array(100).fill('font-service-error'.repeat(10000)),
  };
  element('check-fonts').checked = true;
  element('inspect').onclick();
  assert.strictEqual(ui.messages[1].checkFonts, true);
  ui.window.onmessage({
    data: { pluginMessage: { type: 'inspection', result: report } },
  });
  assert(element('log').textContent.length < 4096);
  assert(element('log').textContent.includes('100 failed'));
  assert.strictEqual(element('inspect').disabled, false);
  assert.strictEqual(element('save-report').disabled, false);
  element('save-report').onclick();
  assert.deepStrictEqual(JSON.parse(await ui.downloads[1].blob.text()), report);
  console.log(
    'ok  excessive mode names, font failures and inspection errors remain bounded without truncating saved reports'
  );

  const fontsUI = mountUI();
  const fontElement = id => fontsUI.elements.get(id);
  assert.strictEqual(
    fontElement('font-diagnostics').disabled,
    true,
    'Font diagnostics needs a loaded token document'
  );
  fontsUI.setDocument(doc);
  assert.strictEqual(fontElement('font-diagnostics').disabled, false);
  fontElement('font-diagnostics').onclick();
  assert.strictEqual(fontsUI.messages.length, 0, 'No brand cannot dispatch');
  assert(fontElement('log').textContent.includes('Select one brand'));
  fontElement('modes').checkedInputs = [{ value: 'undrr' }, { value: 'delta' }];
  fontElement('font-diagnostics').onclick();
  assert.strictEqual(
    fontsUI.messages.length,
    0,
    'Multiple brands cannot dispatch'
  );
  fontElement('modes').checkedInputs = [{ value: 'undrr' }];
  fontElement('font-diagnostics').onclick();
  assert.deepStrictEqual(JSON.parse(JSON.stringify(fontsUI.messages[0])), {
    type: 'font-diagnostics',
    doc,
    brand: 'undrr',
  });
  for (const id of [
    'font-diagnostics',
    'file',
    'import',
    'build',
    'diagnostics',
    'inspect',
    'check-fonts',
    'export-review',
    'export-family',
    'prepare-probes',
  ])
    assert.strictEqual(fontElement(id).disabled, true, `${id} serialised`);
  fontElement('font-diagnostics').onclick();
  fontElement('inspect').onclick();
  assert.strictEqual(
    fontsUI.messages.length,
    1,
    'Pending diagnostic blocks duplicate and independent operations'
  );
  const exactFontReport = {
    loads: [
      {
        fontName: { family: 'Roboto', style: 'Regular' },
        loaded: false,
        error: 'Static family rejected',
      },
      {
        fontName: { family: 'Roboto', style: 'Bold' },
        loaded: false,
        error: 'Static family rejected',
      },
      {
        fontName: { family: 'Roboto Condensed', style: 'Regular' },
        loaded: true,
      },
      { fontName: { family: 'Roboto Condensed', style: 'Bold' }, loaded: true },
    ],
    errors: [],
    evidence: {
      synthetic: true,
      assignments: [],
      detail: 'Full diagnostic payload',
    },
  };
  const deliverFontReport = result =>
    fontsUI.window.onmessage({
      data: { pluginMessage: { type: 'operation', result } },
    });
  deliverFontReport(exactFontReport);
  assert.strictEqual(fontElement('font-diagnostics').disabled, false);
  assert.strictEqual(fontElement('inspect').disabled, false);
  assert.strictEqual(fontElement('save-operation-report').disabled, false);
  assert(fontElement('log').textContent.includes('4 exact names tested'));
  assert(fontElement('log').textContent.includes('Roboto / Regular: failed'));
  assert(
    fontElement('log').textContent.includes('Roboto Condensed / Bold: loaded')
  );
  assert(
    fontElement('log').textContent.includes(
      'Font identity and rendering remain unconfirmed'
    )
  );
  fontElement('save-operation-report').onclick();
  assert.strictEqual(
    fontsUI.downloads[0].name,
    'mangrove-font-diagnostics-report.json'
  );
  assert.strictEqual(fontsUI.downloads[0].blob.type, 'application/json');
  assert.strictEqual(
    await fontsUI.downloads[0].blob.text(),
    JSON.stringify(exactFontReport, null, 2)
  );

  const oversizedFontReport = {
    loads: Array.from({ length: 100 }, (_, index) => ({
      fontName: {
        family:
          index < 4
            ? `visible-font-${index}-${'family'.repeat(2000)}`
            : `hidden-font-${index}`,
        style:
          index < 4
            ? `visible-style-${index}-${'style'.repeat(2000)}`
            : `hidden-style-${index}`,
      },
      loaded: index % 2 === 0,
      error: 'Full load error detail'.repeat(300),
    })),
    errors: Array.from(
      { length: 100 },
      (_, index) => `diagnostic-error-${index}-${'failure'.repeat(2000)}`
    ),
    evidence: exactFontReport.evidence,
  };
  fontElement('font-diagnostics').onclick();
  deliverFontReport(oversizedFontReport);
  const fontSummary = fontElement('log').textContent;
  assert(
    fontSummary.length < 4096,
    'Font names and errors must have a bounded display'
  );
  assert(fontSummary.includes('100 exact names tested'));
  for (let index = 0; index < 4; index++) {
    assert(fontSummary.includes(`visible-font-${index}`));
    assert(fontSummary.includes(`visible-style-${index}`));
  }
  assert(
    !fontSummary.includes('hidden-font-4'),
    'Display includes only four load rows'
  );
  for (let index = 0; index < 5; index++)
    assert(fontSummary.includes(`diagnostic-error-${index}-`));
  assert(
    !fontSummary.includes('diagnostic-error-5-'),
    'Display includes only five errors'
  );
  fontElement('save-operation-report').onclick();
  const exactOversizedDownload = await fontsUI.downloads.at(-1).blob.text();
  assert.strictEqual(
    exactOversizedDownload,
    JSON.stringify(oversizedFontReport, null, 2),
    'Saved operation report retains every oversized name/load/error'
  );
  assert.deepStrictEqual(
    JSON.parse(exactOversizedDownload),
    oversizedFontReport
  );
  fontElement('font-diagnostics').onclick();
  assert.strictEqual(fontElement('font-diagnostics').disabled, true);
  assert.strictEqual(
    fontElement('save-operation-report').disabled,
    false,
    'A preceding valid report remains downloadable during work'
  );
  fontElement('save-operation-report').onclick();
  assert.strictEqual(
    await fontsUI.downloads.at(-1).blob.text(),
    exactOversizedDownload
  );
  fontsUI.window.onmessage({
    data: {
      pluginMessage: { type: 'error', message: 'Diagnostic transport failed' },
    },
  });
  assert.strictEqual(fontElement('font-diagnostics').disabled, false);
  assert.strictEqual(fontElement('save-operation-report').disabled, false);
  fontElement('save-operation-report').onclick();
  assert.strictEqual(
    await fontsUI.downloads.at(-1).blob.text(),
    exactOversizedDownload,
    'Failed retry preserves the preceding valid report'
  );
  const unnamedFontReport = {
    loads: [{ loaded: false }, { fontName: {}, loaded: false }],
    errors: ['Missing diagnostic font names'],
  };
  fontElement('font-diagnostics').onclick();
  deliverFontReport(unnamedFontReport);
  assert(fontElement('log').textContent.includes('2 exact names tested'));
  assert(fontElement('log').textContent.includes(' / : failed'));
  assert.strictEqual(fontElement('font-diagnostics').disabled, false);
  fontElement('save-operation-report').onclick();
  assert.deepStrictEqual(
    JSON.parse(await fontsUI.downloads.at(-1).blob.text()),
    unnamedFontReport
  );
  console.log(
    'ok  font diagnostics require a document/single brand, serialise controls, bound four loads/five errors and oversized names, preserve exact reports and recover from errors'
  );

  const exportsUI = mountUI();
  const exportElement = id => exportsUI.elements.get(id);
  assert.strictEqual(exportElement('export-family').disabled, true);
  exportsUI.setDocument(doc);
  assert.strictEqual(exportElement('export-family').disabled, false);
  exportElement('export-family').onclick();
  assert.strictEqual(exportsUI.messages.length, 0);
  assert(exportElement('log').textContent.includes('exactly one'));
  exportElement('components').checkedInputs = [
    { value: 'button' },
    { value: 'text-input' },
  ];
  exportElement('export-family').onclick();
  assert.strictEqual(exportsUI.messages.length, 0);
  exportElement('components').checkedInputs = [{ value: 'button' }];
  exportElement('export-family').onclick();
  assert.deepStrictEqual(JSON.parse(JSON.stringify(exportsUI.messages[0])), {
    type: 'export-review',
    name: 'Mangrove / Review',
    familyId: 'button',
  });
  assert.strictEqual(exportElement('export-family').disabled, true);
  assert.strictEqual(exportElement('export-review').disabled, true);
  const pngBytes = [137, 80, 78, 71];
  exportsUI.window.onmessage({
    data: {
      pluginMessage: {
        type: 'export',
        result: {
          id: 'family-review-id',
          rootId: 'review-id',
          name: 'Mangrove/Button',
          width: 736,
          height: 1200,
          scope: 'family',
          familyId: 'button',
          bytes: pngBytes,
        },
      },
    },
  });
  assert.strictEqual(exportElement('export-family').disabled, false);
  assert.strictEqual(exportsUI.downloads[0].name, 'Mangrove-Button.png');
  assert.strictEqual(exportsUI.downloads[0].blob.type, 'image/png');
  assert.deepStrictEqual(
    [...new Uint8Array(await exportsUI.downloads[0].blob.arrayBuffer())],
    pngBytes
  );
  assert(exportElement('log').textContent.includes('Family: button.'));
  exportElement('export-review').onclick();
  assert.deepStrictEqual(JSON.parse(JSON.stringify(exportsUI.messages[1])), {
    type: 'export-review',
    name: 'Mangrove / Review',
  });
  exportsUI.window.onmessage({
    data: {
      pluginMessage: {
        type: 'export',
        result: {
          name: 'Mangrove / Review',
          width: 800,
          height: 31328,
          scope: 'review',
          bytes: pngBytes,
        },
      },
    },
  });
  assert.strictEqual(exportsUI.downloads[1].name, 'Mangrove - Review.png');
  assert.deepStrictEqual(
    [...new Uint8Array(await exportsUI.downloads[1].blob.arrayBuffer())],
    pngBytes
  );
  console.log(
    'ok  family PNG requires one selection, serialises export actions and preserves scoped/full download bytes'
  );
  const probesUI = mountUI();
  probesUI.setDocument(doc);
  const probeElement = name => probesUI.elements.get(name);
  probeElement('probe-group').value = 'legacy';
  probeElement('modes').checkedInputs = [{ value: 'undrr' }];
  probeElement('components').checkedInputs = [
    { value: 'combobox' },
    { value: 'radio' },
  ];
  const deliver = result =>
    probesUI.window.onmessage({
      data: { pluginMessage: { type: 'operation', result } },
    });
  probeElement('build').onclick();
  deliver(JSON.parse(JSON.stringify(built)));
  probeElement('probe-root').value = 'probe:before';
  probeElement('probe-root').oninput();
  assert.equal(probeElement('compare-probes').disabled, false);
  probeElement('prepare-probes').onclick();
  assert.equal(probesUI.messages.at(-1).type, 'prepare-override-probes');
  assert.equal(probesUI.messages.at(-1).groupId, 'legacy');
  assert.equal(probeElement('probe-group').disabled, true);
  assert.equal(probeElement('remove-probes').disabled, true);
  const prepared = {
    operation: 'prepare-override-probes',
    rootId: 'probe:synthetic',
    createdNodeIds: ['probe:synthetic'],
    ledger: { evidence: 'synthetic-long-evidence'.repeat(20000) },
    errors: [],
  };
  deliver(prepared);
  assert.equal(probeElement('probe-root').value, prepared.rootId);
  assert.equal(
    probeElement('compare-probes').disabled,
    true,
    'Preparation must invalidate a cached pre-edit build'
  );
  assert(probeElement('log').textContent.length < 1500);
  probeElement('save-operation-report').onclick();
  assert.deepEqual(
    JSON.parse(await probesUI.downloads.at(-1).blob.text()),
    prepared
  );
  probeElement('build').onclick();
  assert.equal(probesUI.messages.at(-1).refreshNarrowReview, false);
  deliver(JSON.parse(JSON.stringify(built)));
  assert.equal(probeElement('compare-probes').disabled, false);
  probeElement('compare-probes').onclick();
  assert.equal(probesUI.messages.at(-1).rootId, prepared.rootId);
  assert.deepEqual(
    JSON.parse(JSON.stringify(probesUI.messages.at(-1).buildResult)),
    JSON.parse(JSON.stringify(built))
  );
  deliver({
    rootId: prepared.rootId,
    passed: true,
    assertions: [{ passed: true }],
    errors: [],
  });
  assert.match(probeElement('log').textContent, /Comparison: passed/);
  probeElement('remove-probes').onclick();
  assert.equal(probesUI.messages.at(-1).type, 'remove-override-probes');
  deliver({
    rootId: prepared.rootId,
    removedNodeIds: [prepared.rootId],
    retained: [],
    errors: [],
  });
  assert.equal(probeElement('probe-root').value, '');
  assert.equal(probeElement('compare-probes').disabled, true);
  probeElement('probe-group').value = 'details-select';
  probeElement('components').checkedInputs = [
    { value: 'details' },
    { value: 'select' },
  ];
  probeElement('prepare-probes').click();
  assert.equal(probesUI.messages.at(-1).groupId, 'details-select');
  assert.equal(probeElement('probe-group').disabled, true);
  const detailsPrepared = {
    operation: 'prepare-override-probes',
    groupId: 'details-select',
    rootId: 'probe:details-select',
    createdNodeIds: ['probe:details-select'],
    ledger: {
      groupId: 'details-select',
      requestedFamilyIds: ['details', 'select'],
      probes: [{ requestedWidth: 240 }, { requestedWidth: 240 }],
    },
    errors: [],
  };
  deliver(detailsPrepared);
  assert.equal(probeElement('probe-group').disabled, false);
  assert.equal(probeElement('compare-probes').disabled, true);
  probeElement('save-operation-report').click();
  assert.deepEqual(
    JSON.parse(await probesUI.downloads.at(-1).blob.text()),
    detailsPrepared
  );
  probeElement('build').click();
  assert.deepEqual(
    [...probesUI.messages.at(-1).families],
    ['details', 'select']
  );
  assert.equal(probesUI.messages.at(-1).refreshNarrowReview, false);
  const detailsRebuild = {
    ...JSON.parse(JSON.stringify(built)),
    families: built.families.filter(item =>
      ['details', 'select'].includes(item.id)
    ),
    audit: built.audit.filter(item =>
      ['details', 'select'].includes(item.family)
    ),
  };
  deliver(detailsRebuild);
  probeElement('compare-probes').click();
  assert.equal(probesUI.messages.at(-1).rootId, detailsPrepared.rootId);
  assert.deepEqual(
    JSON.parse(JSON.stringify(probesUI.messages.at(-1).buildResult)),
    JSON.parse(JSON.stringify(detailsRebuild))
  );
  deliver({ rootId: detailsPrepared.rootId, passed: true, errors: [] });
  probeElement('remove-probes').click();
  assert.equal(probesUI.messages.at(-1).rootId, detailsPrepared.rootId);
  deliver({
    rootId: detailsPrepared.rootId,
    removedNodeIds: [detailsPrepared.rootId],
    retained: [],
    errors: [],
  });
  assert.equal(probeElement('probe-root').value, '');
  console.log(
    'ok  explicit legacy/Details-Select override groups require a fresh scoped post-edit build, persist full report bytes, serialise actions and clear removed root IDs'
  );

  const capabilitiesUI = mountUI();
  const capabilityElement = id => capabilitiesUI.elements.get(id);
  assert.strictEqual(capabilityElement('capability-probes').disabled, true);
  assert.strictEqual(
    capabilityElement('remove-capability-probes').disabled,
    true
  );
  capabilitiesUI.setDocument(doc);
  capabilityElement('capability-probes').click();
  assert.strictEqual(
    capabilitiesUI.messages.length,
    0,
    'Capability run requires one brand'
  );
  capabilityElement('modes').checkedInputs = [{ value: 'undrr' }];
  capabilityElement('capability-probes').click();
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(capabilitiesUI.messages[0])),
    {
      type: 'capability-probes',
      doc,
      brand: 'undrr',
      scope: 'legacy',
    }
  );
  for (const id of [
    'capability-probes',
    'capability-scope',
    'capability-file',
    'audit-capability-probes',
    'inspect-capability-probes',
    'remove-capability-probes',
    'file',
    'build',
    'inspect',
    'font-diagnostics',
    'prepare-probes',
  ])
    assert.strictEqual(
      capabilityElement(id).disabled,
      true,
      `${id} serialised during capability run`
    );
  capabilityElement('capability-probes').click();
  capabilityElement('font-diagnostics').onclick();
  assert.strictEqual(
    capabilitiesUI.messages.length,
    1,
    'Capability run cannot be duplicated or interleaved'
  );
  const capabilityReport = {
    kind: 'mangrove-native-capability-probes',
    version: 1,
    runId: 'capabilities-synthetic',
    rootId: 'capability:synthetic-root',
    ledger: [
      { id: 'capability:synthetic-root', type: 'FRAME' },
      { id: 'capability:synthetic-component', type: 'COMPONENT' },
      { id: 'capability:synthetic-slot', type: 'SLOT' },
    ],
    tests: {
      legend: {
        status: 'mock-supported',
        supported: true,
        observations: 'full-details'.repeat(20000),
      },
      slots: { status: 'mock-unavailable', supported: false },
      vectors: { status: 'mock-supported', supported: true },
    },
    autodiscoveredIds: ['capability:synthetic-auto-child'],
    errors: [],
  };
  const deliverCapability = result =>
    capabilitiesUI.window.onmessage({
      data: { pluginMessage: { type: 'operation', result } },
    });
  deliverCapability(capabilityReport);
  assert.strictEqual(
    capabilityElement('capability-probes').disabled,
    true,
    'Cached run prevents duplicate assets'
  );
  assert.strictEqual(
    capabilityElement('remove-capability-probes').disabled,
    false
  );
  assert.strictEqual(capabilityElement('capability-file').disabled, false);
  assert(capabilityElement('log').textContent.length < 4096);
  assert(!capabilityElement('log').textContent.includes('full-details'));
  capabilityElement('capability-probes').click();
  assert.strictEqual(capabilitiesUI.messages.length, 1);
  capabilityElement('save-operation-report').click();
  assert.strictEqual(
    capabilitiesUI.downloads[0].name,
    'mangrove-capability-probes-report.json'
  );
  assert.strictEqual(capabilitiesUI.downloads[0].blob.type, 'application/json');
  assert.strictEqual(
    await capabilitiesUI.downloads[0].blob.text(),
    JSON.stringify(capabilityReport, null, 2),
    'Capability download retains complete ledger/observations/discovered IDs'
  );
  capabilityElement('remove-capability-probes').click();
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(capabilitiesUI.messages.at(-1))),
    { type: 'remove-capability-probes', report: capabilityReport }
  );
  assert.strictEqual(capabilityElement('capability-file').disabled, true);
  deliverCapability({
    removedNodeIds: [],
    errors: ['Cleanup refused an unrecorded child'],
  });
  assert.strictEqual(
    capabilityElement('capability-probes').disabled,
    true,
    'Rejected cleanup retains the original run cache'
  );
  assert.strictEqual(
    capabilityElement('remove-capability-probes').disabled,
    false
  );
  capabilityElement('remove-capability-probes').click();
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(capabilitiesUI.messages.at(-1).report)),
    capabilityReport,
    'Cleanup retry uses the original exact ledger, not the failure report'
  );
  const cleanupReport = {
    removedNodeIds: capabilityReport.ledger.map(item => item.id),
    errors: [],
  };
  deliverCapability(cleanupReport);
  assert.strictEqual(
    capabilityElement('capability-probes').disabled,
    false,
    'Successful cleanup clears cache'
  );
  assert.strictEqual(
    capabilityElement('remove-capability-probes').disabled,
    true
  );
  capabilityElement('save-operation-report').click();
  assert.strictEqual(
    capabilitiesUI.downloads.at(-1).name,
    'mangrove-remove-capability-probes-report.json'
  );
  assert.deepStrictEqual(
    JSON.parse(await capabilitiesUI.downloads.at(-1).blob.text()),
    cleanupReport
  );
  assert.strictEqual(capabilityElement('capability-scope').disabled, false);
  capabilityElement('capability-scope').value = 'toc-link-sizing';
  capabilityElement('capability-probes').click();
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(capabilitiesUI.messages.at(-1))),
    { type: 'capability-probes', doc, brand: 'undrr', scope: 'toc-link-sizing' }
  );
  assert.strictEqual(capabilityElement('capability-scope').disabled, true);

  // A new UI window has no cache or token JSON; cleanup needs only the saved ledger.
  const recoveredUI = mountUI();
  const recoveredElement = id => recoveredUI.elements.get(id);
  const loadCapability = text =>
    recoveredElement('capability-file').onchange({
      target: { files: [{ text: async () => text }] },
    });
  await loadCapability(JSON.stringify(capabilityReport));
  assert.strictEqual(
    recoveredElement('remove-capability-probes').disabled,
    false,
    'Saved ledger recovers cleanup after restart without a document'
  );
  assert.strictEqual(recoveredElement('capability-probes').disabled, true);
  assert.strictEqual(recoveredElement('capability-scope').disabled, true);
  assert(recoveredElement('log').textContent.includes(capabilityReport.rootId));
  assert.strictEqual(
    recoveredUI.messages.length,
    0,
    'Loading a ledger performs no native writes'
  );
  await loadCapability('{malformed JSON');
  assert(recoveredElement('log').textContent.startsWith('Error:'));
  assert.strictEqual(
    recoveredElement('remove-capability-probes').disabled,
    false,
    'Invalid JSON retains the previous valid ledger'
  );
  await loadCapability(
    JSON.stringify({ ...capabilityReport, kind: 'foreign-report' })
  );
  assert(
    recoveredElement('log').textContent.includes(
      'saved capability probe report'
    )
  );
  recoveredUI.setDocument(doc);
  assert.strictEqual(
    recoveredElement('capability-probes').disabled,
    true,
    'Recovered assets still block another run when document becomes available'
  );
  recoveredElement('remove-capability-probes').click();
  assert.deepStrictEqual(JSON.parse(JSON.stringify(recoveredUI.messages[0])), {
    type: 'remove-capability-probes',
    report: capabilityReport,
  });
  recoveredUI.window.onmessage({
    data: { pluginMessage: { type: 'operation', result: cleanupReport } },
  });
  assert.strictEqual(
    recoveredElement('remove-capability-probes').disabled,
    true
  );
  assert.strictEqual(recoveredElement('capability-probes').disabled, false);
  console.log(
    'ok  capability run/cache serialise assets, retain exact downloaded ledgers and cleanup retries, clear successful cleanup and recover saved ledgers after restart'
  );

  // Evidence-only snapshots never authorize cleanup adoption. An explicit,
  // successful audit supplies the next exact ledger; failed audits preserve it.
  const auditUI = mountUI();
  const auditElement = id => auditUI.elements.get(id);
  const clone = value => JSON.parse(JSON.stringify(value));
  const deliverAudit = result =>
    auditUI.window.onmessage({
      data: { pluginMessage: { type: 'operation', result: clone(result) } },
    });
  await auditElement('capability-file').onchange({
    target: {
      files: [{ text: async () => JSON.stringify(capabilityReport) }],
    },
  });
  for (const id of [
    'audit-capability-probes',
    'inspect-capability-probes',
    'remove-capability-probes',
  ])
    assert.strictEqual(
      auditElement(id).disabled,
      false,
      `${id} recovers from an exact ledger without token JSON`
    );
  auditElement('inspect-capability-probes').click();
  assert.deepStrictEqual(clone(auditUI.messages.at(-1)), {
    type: 'inspect-capability-probes',
    report: capabilityReport,
  });
  for (const id of [
    'audit-capability-probes',
    'inspect-capability-probes',
    'remove-capability-probes',
    'capability-file',
  ])
    assert.strictEqual(
      auditElement(id).disabled,
      true,
      `${id} serialised while snapshot is pending`
    );
  auditElement('audit-capability-probes').click();
  auditElement('remove-capability-probes').click();
  assert.strictEqual(auditUI.messages.length, 1);
  const snapshot = {
    evidenceOnly: true,
    canAuthorizeAdoption: false,
    rootId: capabilityReport.rootId,
    nodes: [
      {
        id: 'capability:unrecorded-foreign-child',
        recorded: false,
        owner: 'foreign-owner',
        errors: [],
      },
    ],
    missingNodeIds: [],
    errors: [],
  };
  deliverAudit(snapshot);
  auditElement('save-operation-report').click();
  assert.strictEqual(
    auditUI.downloads.at(-1).name,
    'mangrove-inspect-capability-probes-report.json'
  );
  assert.strictEqual(
    await auditUI.downloads.at(-1).blob.text(),
    JSON.stringify(snapshot, null, 2),
    'Read-only snapshot evidence is saved exactly'
  );
  auditElement('audit-capability-probes').click();
  assert.deepStrictEqual(clone(auditUI.messages.at(-1)), {
    type: 'audit-capability-probes',
    report: capabilityReport,
  });
  auditUI.window.onmessage({
    data: {
      pluginMessage: { type: 'error', message: 'Synthetic audit failure' },
    },
  });
  auditElement('audit-capability-probes').click();
  assert.deepStrictEqual(
    clone(auditUI.messages.at(-1).report),
    capabilityReport,
    'Transport failure and evidence snapshot retain the original recovery ledger'
  );
  const failedAudit = {
    ...clone(capabilityReport),
    ledger: [
      ...clone(capabilityReport.ledger),
      { id: 'capability:partial-generated-child', type: 'TEXT' },
    ],
    reconciliation: {
      addedNodeIds: ['capability:partial-generated-child'],
      unrecordedNodeIds: ['capability:unrecorded-foreign-child'],
      missingNodeIds: [],
      errors: ['Ledger refresh refused foreign or unrecorded node'],
    },
    errors: ['Ledger refresh refused foreign or unrecorded node'],
  };
  deliverAudit(failedAudit);
  auditElement('save-operation-report').click();
  assert.strictEqual(
    await auditUI.downloads.at(-1).blob.text(),
    JSON.stringify(failedAudit, null, 2),
    'Failed audit preserves complete partial reconciliation evidence'
  );
  auditElement('audit-capability-probes').click();
  assert.deepStrictEqual(
    clone(auditUI.messages.at(-1).report),
    capabilityReport,
    'Failed reconciliation cannot silently adopt partial or foreign descendants'
  );
  const foreignAudit = {
    ...clone(capabilityReport),
    runId: 'capability:foreign-run',
    rootId: 'capability:foreign-root',
    ledger: [{ id: 'capability:foreign-root', type: 'FRAME' }],
    errors: [],
  };
  deliverAudit(foreignAudit);
  auditElement('audit-capability-probes').click();
  assert.deepStrictEqual(
    clone(auditUI.messages.at(-1).report),
    capabilityReport,
    'A mismatched successful response cannot replace the recovered root/run'
  );
  const auditedReport = {
    ...clone(capabilityReport),
    ledger: [
      ...clone(capabilityReport.ledger),
      { id: 'capability:verified-generated-child', type: 'TEXT' },
    ],
    reconciliation: {
      addedNodeIds: ['capability:verified-generated-child'],
      unrecordedNodeIds: [],
      missingNodeIds: [],
      errors: [],
    },
  };
  deliverAudit(auditedReport);
  auditElement('save-operation-report').click();
  assert.strictEqual(
    auditUI.downloads.at(-1).name,
    'mangrove-audit-capability-probes-report.json'
  );
  assert.strictEqual(
    await auditUI.downloads.at(-1).blob.text(),
    JSON.stringify(auditedReport, null, 2),
    'Successful audit saves the complete updated recovery ledger'
  );
  auditElement('inspect-capability-probes').click();
  assert.deepStrictEqual(clone(auditUI.messages.at(-1).report), auditedReport);
  deliverAudit({ ...snapshot, errors: ['Read-only inspection failure'] });
  auditElement('remove-capability-probes').click();
  assert.deepStrictEqual(clone(auditUI.messages.at(-1)), {
    type: 'remove-capability-probes',
    report: auditedReport,
  });
  deliverAudit({
    removedNodeIds: [],
    errors: ['Cleanup refused foreign or unrecorded node'],
  });
  auditElement('remove-capability-probes').click();
  assert.deepStrictEqual(
    clone(auditUI.messages.at(-1).report),
    auditedReport,
    'Cleanup retry retains the audited ledger after failed snapshot or cleanup'
  );
  deliverAudit({
    removedNodeIds: auditedReport.ledger.map(item => item.id),
    errors: [],
  });
  for (const id of [
    'audit-capability-probes',
    'inspect-capability-probes',
    'remove-capability-probes',
  ])
    assert.strictEqual(
      auditElement(id).disabled,
      true,
      `${id} disabled after successful exact-ledger cleanup`
    );
  console.log(
    'ok  capability snapshots retain recovery ledgers, failed/foreign audits cannot adopt nodes, successful audits authorize exact cleanup and preserve full reports'
  );

  const canonicalUI = mountUI();
  const canonicalElement = id => canonicalUI.elements.get(id);
  const deliverCanonical = result =>
    canonicalUI.window.onmessage({
      data: { pluginMessage: { type: 'operation', result: clone(result) } },
    });
  canonicalUI.setDocument(doc);
  canonicalElement('modes').checkedInputs = [{ value: 'undrr' }];
  canonicalElement('components').checkedInputs = [
    { value: 'segmented-control.segment' },
  ];
  const canonicalBuild = {
    ...clone(built),
    createdNodeIds: [],
    families: clone(built.families).filter(
      f => f.id === 'segmented-control.segment'
    ),
  };
  canonicalElement('build').click();
  deliverCanonical(canonicalBuild);
  canonicalElement('capability-scope').value = 'segmented-canonical';
  canonicalElement('capability-probes').click();
  assert.strictEqual(canonicalUI.messages.at(-1).scope, 'segmented-canonical');
  const canonicalPrepared = {
    ...clone(capabilityReport),
    scope: 'segmented-canonical',
    tests: {},
    segmentedCanonical: { verdict: 'pending', completedAdvances: 0 },
  };
  deliverCanonical(canonicalPrepared);
  assert.strictEqual(
    canonicalElement('advance-segmented-capability-probes').disabled,
    true,
    'Preparation invalidates a cached earlier build'
  );
  canonicalElement('build').click();
  assert.strictEqual(canonicalUI.messages.at(-1).refreshNarrowReview, false);
  deliverCanonical(canonicalBuild);
  assert.strictEqual(
    canonicalElement('advance-segmented-capability-probes').disabled,
    false
  );
  canonicalElement('advance-segmented-capability-probes').click();
  assert.deepStrictEqual(clone(canonicalUI.messages.at(-1)), {
    type: 'advance-segmented-capability-probes',
    doc,
    brand: 'undrr',
    report: canonicalPrepared,
    buildResult: canonicalBuild,
  });
  const afterAdvanceMessageCount = canonicalUI.messages.length;
  canonicalElement('advance-segmented-capability-probes').click();
  assert.strictEqual(canonicalUI.messages.length, afterAdvanceMessageCount);
  const canonicalAdvanced = {
    ...clone(canonicalPrepared),
    segmentedCanonical: { verdict: 'pending', completedAdvances: 1 },
  };
  deliverCanonical(canonicalAdvanced);
  assert.strictEqual(
    canonicalElement('advance-segmented-capability-probes').disabled,
    true,
    'An advance consumes its build; another advance requires a new build'
  );
  canonicalElement('build').click();
  deliverCanonical(canonicalBuild);
  canonicalElement('advance-segmented-capability-probes').click();
  const canonicalPartial = {
    ...clone(canonicalAdvanced),
    ledger: [
      ...clone(canonicalAdvanced.ledger),
      { id: 'capability:partial-fresh', type: 'INSTANCE' },
    ],
    errors: ['Synthetic fresh-cohort failure'],
    evidence: 'exact partial details'.repeat(3000),
  };
  deliverCanonical(canonicalPartial);
  canonicalElement('save-operation-report').click();
  assert.strictEqual(
    await canonicalUI.downloads.at(-1).blob.text(),
    JSON.stringify(canonicalPartial, null, 2)
  );
  assert(canonicalElement('log').textContent.length < 4096);
  canonicalElement('remove-capability-probes').click();
  assert.deepStrictEqual(
    clone(canonicalUI.messages.at(-1).report),
    canonicalPartial,
    'Partial advance ledgers replace the previous ledger for exact cleanup recovery'
  );
  deliverCanonical({
    removedNodeIds: canonicalPartial.ledger.map(x => x.id),
    errors: [],
  });
  assert.strictEqual(
    canonicalElement('advance-segmented-capability-probes').disabled,
    true
  );
  const canonicalComplete = {
    ...clone(canonicalPrepared),
    segmentedCanonical: { verdict: 'accepted', completedAdvances: 2 },
  };
  const loadCanonical = report =>
    canonicalElement('capability-file').onchange({
      target: { files: [{ text: async () => JSON.stringify(report) }] },
    });
  canonicalElement('build').click();
  deliverCanonical(canonicalBuild);
  await loadCanonical(canonicalPrepared);
  assert.strictEqual(
    canonicalElement('advance-segmented-capability-probes').disabled,
    true,
    'Loading a saved ledger requires a new post-recovery build'
  );
  await loadCanonical(canonicalComplete);
  canonicalElement('build').click();
  deliverCanonical(canonicalBuild);
  assert.strictEqual(
    canonicalElement('advance-segmented-capability-probes').disabled,
    true,
    'Completed two-advance proof cannot create a third cohort'
  );
  console.log(
    'ok  Segmented canonical checks consume fresh builds, serialise advances, preserve partial ledgers/full downloads and require new evidence after saved-report recovery'
  );

  const editorialUI = mountUI();
  const editorialElement = id => editorialUI.elements.get(id);
  const deliverEditorial = result =>
    editorialUI.window.onmessage({
      data: { pluginMessage: { type: 'operation', result: clone(result) } },
    });
  for (const id of [
    'prepare-editorial',
    'compare-editorial',
    'remove-editorial',
  ])
    assert.strictEqual(editorialElement(id).disabled, true);
  editorialElement('prepare-editorial').click();
  assert.strictEqual(
    editorialUI.messages.length,
    0,
    'Editorial preparation requires loaded component JSON'
  );
  editorialUI.setDocument(doc);
  editorialElement('probe-root').value = 'override:unrelated-root';
  editorialElement('probe-root').oninput();
  editorialElement('editorial-root').value = 'editorial:previous-root';
  editorialElement('editorial-root').oninput();
  for (const brands of [[], [{ value: 'undrr' }, { value: 'irp' }]]) {
    editorialElement('modes').checkedInputs = brands;
    editorialElement('prepare-editorial').click();
    assert.strictEqual(
      editorialUI.messages.length,
      0,
      'Editorial preparation requires exactly one brand'
    );
  }
  editorialElement('modes').checkedInputs = [{ value: 'undrr' }];
  editorialElement('components').checkedInputs = [{ value: 'editorial-cta' }];
  const editorialBuild = {
    ...clone(built),
    families: clone(built.families.filter(f => f.id === 'editorial-cta')),
    audit: clone(built.audit.filter(a => a.family === 'editorial-cta')),
  };
  assert.strictEqual(
    editorialBuild.families.length,
    1,
    'Real mock build must include editorial CTA'
  );
  editorialElement('build').click();
  deliverEditorial(editorialBuild);
  assert.strictEqual(editorialElement('compare-editorial').disabled, false);
  editorialElement('prepare-editorial').click();
  assert.deepStrictEqual(clone(editorialUI.messages.at(-1)), {
    type: 'prepare-editorial-probes',
    doc,
    brand: 'undrr',
  });
  for (const id of [
    'prepare-editorial',
    'compare-editorial',
    'remove-editorial',
    'editorial-root',
    'probe-root',
    'prepare-probes',
    'compare-probes',
    'remove-probes',
    'build',
    'inspect',
    'capability-probes',
    'capability-file',
    'font-diagnostics',
    'file',
  ])
    assert.strictEqual(
      editorialElement(id).disabled,
      true,
      `${id} serialized during editorial prepare`
    );
  const pendingEditorialCount = editorialUI.messages.length;
  editorialElement('prepare-editorial').click();
  editorialElement('remove-editorial').click();
  editorialElement('inspect').onclick();
  assert.strictEqual(
    editorialUI.messages.length,
    pendingEditorialCount,
    'Pending prepare cannot be interleaved'
  );
  const failedEditorial = {
    operation: 'prepare-editorial-probes',
    rootId: 'editorial:partial-root',
    createdNodeIds: ['editorial:partial-root', 'editorial:partial-instance'],
    ledger: {
      kind: 'mangrove-editorial-acceptance',
      complete: false,
      steps: 'synthetic-full-readbacks'.repeat(20000),
    },
    errors: Array.from(
      { length: 30 },
      (_, i) => `native offset failure ${i}: ${'details'.repeat(200)}`
    ),
  };
  deliverEditorial(failedEditorial);
  assert.strictEqual(
    editorialElement('editorial-root').value,
    failedEditorial.rootId
  );
  assert.strictEqual(
    editorialElement('remove-editorial').disabled,
    false,
    'Failed prepare preserves its exact cleanup root'
  );
  assert.strictEqual(
    editorialElement('compare-editorial').disabled,
    true,
    'Preparation discards the pre-edit build cache'
  );
  assert.strictEqual(
    editorialElement('probe-root').value,
    'override:unrelated-root'
  );
  assert(editorialElement('log').textContent.length < 4096);
  assert(
    !editorialElement('log').textContent.includes('synthetic-full-readbacks')
  );
  editorialElement('save-operation-report').click();
  assert.strictEqual(
    editorialUI.downloads.at(-1).name,
    'mangrove-prepare-editorial-probes-report.json'
  );
  assert.strictEqual(
    await editorialUI.downloads.at(-1).blob.text(),
    JSON.stringify(failedEditorial, null, 2)
  );
  editorialElement('remove-editorial').click();
  assert.deepStrictEqual(clone(editorialUI.messages.at(-1)), {
    type: 'remove-editorial-probes',
    rootId: failedEditorial.rootId,
  });
  const refusedEditorial = {
    operation: 'remove-editorial-probes',
    rootId: failedEditorial.rootId,
    removedNodeIds: [],
    retained: [{ id: failedEditorial.rootId }],
    errors: ['Exact-ledger cleanup refused foreign child'],
  };
  deliverEditorial(refusedEditorial);
  assert.strictEqual(
    editorialElement('editorial-root').value,
    failedEditorial.rootId
  );
  assert.strictEqual(editorialElement('remove-editorial').disabled, false);
  editorialElement('remove-editorial').click();
  deliverEditorial({
    operation: 'remove-editorial-probes',
    rootId: failedEditorial.rootId,
    removedNodeIds: failedEditorial.createdNodeIds,
    retained: [],
    errors: [],
  });
  assert.strictEqual(editorialElement('editorial-root').value, '');
  assert.strictEqual(editorialElement('compare-editorial').disabled, true);
  assert.strictEqual(editorialElement('remove-editorial').disabled, true);
  assert.strictEqual(
    editorialElement('probe-root').value,
    'override:unrelated-root',
    'Editorial cleanup never clears the other acceptance root'
  );

  editorialElement('prepare-editorial').click();
  const completeEditorial = {
    ...clone(failedEditorial),
    rootId: 'editorial:complete-root',
    createdNodeIds: ['editorial:complete-root', 'editorial:complete-instance'],
    ledger: { ...clone(failedEditorial.ledger), complete: true },
    errors: [],
  };
  deliverEditorial(completeEditorial);
  assert.strictEqual(editorialElement('compare-editorial').disabled, true);
  editorialElement('compare-editorial').click();
  const beforeFreshBuild = editorialUI.messages.length;
  editorialElement('build').click();
  assert.strictEqual(editorialUI.messages.length, beforeFreshBuild + 1);
  assert.strictEqual(
    editorialUI.messages.at(-1).refreshNarrowReview,
    false,
    'Ordinary post-prepare build preserves existing consumer content'
  );
  deliverEditorial(editorialBuild);
  assert.strictEqual(editorialElement('compare-editorial').disabled, false);
  editorialElement('compare-editorial').click();
  assert.deepStrictEqual(clone(editorialUI.messages.at(-1)), {
    type: 'compare-editorial-probes',
    rootId: completeEditorial.rootId,
    buildResult: editorialBuild,
  });
  const editorialComparison = {
    operation: 'compare-editorial-probes',
    rootId: completeEditorial.rootId,
    passed: true,
    assertions: [{ name: 'IDs/Label/geometry retained', passed: true }],
    after: [{ readbacks: 'full-geometry-evidence'.repeat(10000) }],
    errors: [],
  };
  deliverEditorial(editorialComparison);
  assert(editorialElement('log').textContent.includes('Comparison: passed'));
  editorialElement('save-operation-report').click();
  assert.strictEqual(
    editorialUI.downloads.at(-1).name,
    'mangrove-compare-editorial-probes-report.json'
  );
  assert.strictEqual(
    await editorialUI.downloads.at(-1).blob.text(),
    JSON.stringify(editorialComparison, null, 2)
  );
  assert.strictEqual(
    editorialElement('probe-root').value,
    'override:unrelated-root'
  );

  // Server-side shared data recovers by exact root ID; no token JSON or UI cache.
  const editorialRestart = mountUI();
  const restartEditorialElement = id => editorialRestart.elements.get(id);
  restartEditorialElement('probe-root').value = 'override:restart-unrelated';
  restartEditorialElement('editorial-root').value =
    `  ${completeEditorial.rootId}  `;
  restartEditorialElement('editorial-root').oninput();
  assert.strictEqual(
    restartEditorialElement('prepare-editorial').disabled,
    true
  );
  assert.strictEqual(
    restartEditorialElement('compare-editorial').disabled,
    true
  );
  assert.strictEqual(
    restartEditorialElement('remove-editorial').disabled,
    false
  );
  restartEditorialElement('remove-editorial').click();
  assert.deepStrictEqual(clone(editorialRestart.messages[0]), {
    type: 'remove-editorial-probes',
    rootId: completeEditorial.rootId,
  });
  editorialRestart.window.onmessage({
    data: {
      pluginMessage: {
        type: 'error',
        message: 'Synthetic cleanup transport failure',
      },
    },
  });
  assert.strictEqual(
    restartEditorialElement('editorial-root').value.trim(),
    completeEditorial.rootId
  );
  assert.strictEqual(
    restartEditorialElement('remove-editorial').disabled,
    false,
    'Restart transport failure retains cleanup recovery'
  );
  restartEditorialElement('remove-editorial').click();
  const editorialCleanup = {
    operation: 'remove-editorial-probes',
    rootId: completeEditorial.rootId,
    removedNodeIds: completeEditorial.createdNodeIds,
    retained: [],
    errors: [],
  };
  editorialRestart.window.onmessage({
    data: { pluginMessage: { type: 'operation', result: editorialCleanup } },
  });
  assert.strictEqual(restartEditorialElement('editorial-root').value, '');
  assert.strictEqual(
    restartEditorialElement('remove-editorial').disabled,
    true
  );
  assert.strictEqual(
    restartEditorialElement('probe-root').value,
    'override:restart-unrelated'
  );
  restartEditorialElement('save-operation-report').click();
  assert.strictEqual(
    editorialRestart.downloads.at(-1).name,
    'mangrove-remove-editorial-probes-report.json'
  );
  assert.strictEqual(
    await editorialRestart.downloads.at(-1).blob.text(),
    JSON.stringify(editorialCleanup, null, 2)
  );
  console.log(
    'ok  editorial controls enforce document/single-brand and fresh post-prepare builds, serialize actions, preserve failed cleanup roots/full reports and recover exact restart cleanup without touching override roots'
  );
}

if (require.main === module)
  main().catch(error => {
    console.error(`FAIL ${error.stack || error}`);
    process.exitCode = 1;
  });
