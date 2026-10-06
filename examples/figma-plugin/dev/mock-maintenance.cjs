#!/usr/bin/env node
/** Actual standalone controller/UI checks. Mocks do not establish native acceptance. */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');
const { createFigma } = require('./mock-variable-api.cjs');
const {
  buildFigmaMaintenance,
} = require('../../../scripts/build-figma-maintenance-tokens.cjs');

const DIR = path.resolve(__dirname, '..');
const copy = value => JSON.parse(JSON.stringify(value));

function standalone(doc, modeLimit = 10) {
  const state = {
    modeLimit,
    collections: [],
    variables: [],
    styles: [],
    loadedFonts: new Set(),
    rejectedFonts: new Set(),
    fonts: [
      { fontName: { family: 'Inter', style: 'Regular' } },
      ...[
        ...new Map(
          doc.styles.text.flatMap(spec =>
            Object.values(spec.values).map(value => [
              JSON.stringify(value.fontName),
              { fontName: value.fontName },
            ])
          )
        ).values(),
      ],
    ],
    messages: [],
  };
  const figma = createFigma(state);
  figma.ui.postMessage = message => {
    state.messages.push(copy(message));
    state.lastMessage = message;
  };
  let closed = 0;
  figma.closePlugin = () => {
    closed += 1;
  };
  const context = vm.createContext({
    figma,
    __html__: '',
    console,
    MG_MAINTENANCE_SOURCE: copy(doc),
  });
  for (const file of [
    'kit-identity.js',
    'importer.js',
    'maintenance/inspection.js',
    'maintenance/code.js',
  ])
    vm.runInContext(fs.readFileSync(path.join(DIR, file), 'utf8'), context);
  const call = message => state.handler(message);
  return { state, figma, context, call, closed: () => closed };
}

function assets(state) {
  return JSON.stringify({
    collections: state.collections,
    variables: state.variables,
    styles: state.styles,
  });
}

function importMessage(doc, requestId = 1) {
  return {
    type: 'import',
    requestId,
    doc,
    modes: doc.modes.map(mode => mode.id),
    textStyles: doc.styles.text.map(style => style.id),
    effects: true,
    prune: false,
  };
}

function ui() {
  const sent = [];
  const downloads = [];
  const blobs = [];
  const revoked = [];
  const timers = [];
  const dom = new JSDOM(
    fs.readFileSync(path.join(DIR, 'maintenance/ui.html'), 'utf8'),
    {
      runScripts: 'dangerously',
      beforeParse(window) {
        window.parent.postMessage = message =>
          sent.push(copy(message.pluginMessage));
        window.Blob = Blob;
        window.URL.createObjectURL = blob => {
          blobs.push(blob);
          return `blob:mock/${blobs.length}`;
        };
        window.URL.revokeObjectURL = url => revoked.push(url);
        window.setTimeout = callback => {
          timers.push(callback);
          return timers.length;
        };
        window.HTMLAnchorElement.prototype.click = function () {
          downloads.push({ href: this.href, download: this.download });
        };
      },
    }
  );
  const { window } = dom;
  const get = id => window.document.getElementById(id);
  const deliver = message =>
    window.dispatchEvent(
      new window.MessageEvent('message', {
        data: { pluginMessage: message },
      })
    );
  const reply = (request, result, type = 'result') =>
    deliver({
      type,
      operation: request.type,
      requestId: request.requestId,
      ...(type === 'error' ? { message: result } : { result }),
    });
  const checks = id => [...get(id).querySelectorAll('input')];
  return {
    dom,
    window,
    get,
    deliver,
    reply,
    checks,
    sent,
    downloads,
    blobs,
    revoked,
    timers,
  };
}

async function main() {
  const doc = buildFigmaMaintenance();
  assert(!doc.components && !doc.capabilities && !doc.kitGuidance);
  {
    const env = standalone(doc);
    const empty = assets(env.state);
    await env.call({ type: 'maintenance-source', requestId: 0 });
    assert.strictEqual(env.state.lastMessage.type, 'result');
    assert.deepStrictEqual(copy(env.state.lastMessage.result), doc);
    assert.strictEqual(
      assets(env.state),
      empty,
      'Bundled source selection does not import assets'
    );
    for (const symbol of [
      'buildMangroveComponents',
      'organizeMangroveKit',
      'refreshMangroveGuidance',
      'inspectMangroveKit',
    ])
      assert.strictEqual(
        vm.runInContext(`typeof ${symbol}`, env.context),
        'undefined'
      );
    await env.call(importMessage(doc));
    let message = env.state.lastMessage;
    assert.strictEqual(message.type, 'result');
    assert.strictEqual(message.requestId, 1);
    assert.deepStrictEqual(copy(message.result.errors), []);
    assert.strictEqual(env.state.collections[0].modes.length, 5);
    assert.strictEqual(env.state.variables.length, doc.variables.length);
    assert.strictEqual(
      env.state.styles.length,
      doc.styles.text.length + doc.styles.effect.length
    );
    const before = assets(env.state);
    await env.call(importMessage(doc, 2));
    message = env.state.lastMessage;
    assert.deepStrictEqual(copy(message.result.errors), []);
    assert.strictEqual(message.result.createdVariableIds.length, 0);
    assert.strictEqual(
      assets(env.state),
      before,
      'Repeat preserves IDs, values, aliases, scopes, code syntax, and styles'
    );
    const fonts = env.state.loadedFonts.size;
    await env.call({
      type: 'maintenance-inspect',
      requestId: 3,
      collection: doc.collection,
    });
    assert.strictEqual(
      env.state.loadedFonts.size,
      fonts,
      'Read-only inspection loads no fonts'
    );
    assert.strictEqual(assets(env.state), before);
    assert.strictEqual(
      env.state.lastMessage.result.variables.length,
      doc.variables.length
    );
    assert.strictEqual(
      env.state.lastMessage.result.styles.length,
      env.state.styles.length
    );
    if (process.argv.includes('--compare-full')) {
      const { loadPlugin } = require('./mock-figma.cjs');
      const full = loadPlugin(10);
      full.state.fonts = env.state.fonts;
      const result = await full.run(
        doc,
        doc.modes.map(mode => mode.id),
        false,
        {
          textStyles: doc.styles.text.map(style => style.id),
          effects: true,
        }
      );
      assert.deepStrictEqual(copy(result.errors), []);
      assert.strictEqual(
        assets(full.state),
        before,
        'Standalone and full importer produce identical native assets'
      );
      console.log(
        'ok  explicit full importer comparison preserves every native asset record'
      );
    }
    console.log(
      'ok  independent standalone runtime imports all five modes; repeat and inspection preserve all assets'
    );
  }
  {
    const env = standalone(doc, 1);
    await env.call({ ...importMessage(doc), modes: ['undrr'] });
    assert.strictEqual(env.state.lastMessage.type, 'result');
    const ids = env.state.variables.map(variable => variable.id);
    await env.call({ ...importMessage(doc, 2), modes: ['delta'] });
    assert.deepStrictEqual(
      env.state.variables.map(variable => variable.id),
      ids
    );
    assert.strictEqual(env.state.collections[0].modes.length, 1);
    assert.strictEqual(
      env.state.collections[0].modes[0].name,
      doc.modes.find(mode => mode.id === 'delta').name
    );
    console.log(
      'ok  standalone Starter single-brand switch preserves variables and stays within one mode'
    );
  }
  {
    const env = standalone(doc);
    const before = assets(env.state);
    for (const message of [
      {
        ...importMessage(doc, 12),
        doc: { ...copy(doc), nativeCollections: { version: 1 } },
      },
      { ...importMessage(doc), prune: true },
      { ...importMessage(doc), effects: undefined },
      { type: 'build', requestId: 5, doc },
      { type: 'organize', requestId: 6, doc },
      { type: 'maintenance-inspect', requestId: 7, collection: '' },
    ]) {
      await env.call(message);
      assert.strictEqual(env.state.lastMessage.type, 'error');
      assert.strictEqual(env.state.lastMessage.requestId, message.requestId);
      assert.strictEqual(assets(env.state), before);
    }
    const original = env.figma.variables.getLocalVariableCollectionsAsync;
    let release;
    env.figma.variables.getLocalVariableCollectionsAsync = () =>
      new Promise(resolve => {
        release = resolve;
      });
    const pending = env.call(importMessage(doc, 10));
    await Promise.resolve();
    assert.strictEqual(typeof release, 'function');
    const count = env.state.messages.length;
    await env.call(importMessage(doc, 11));
    await env.call({ type: 'maintenance-inspect', requestId: 12 });
    await env.call({ type: 'maintenance-source', requestId: 13 });
    await env.call({ type: 'close' });
    assert.strictEqual(env.state.messages.length, count);
    assert.strictEqual(env.closed(), 0);
    env.figma.variables.getLocalVariableCollectionsAsync = original;
    release(env.state.collections);
    await pending;
    assert.strictEqual(env.state.lastMessage.requestId, 10);
    assert.strictEqual(env.state.variables.length, doc.variables.length);
    await env.call({ type: 'close' });
    assert.strictEqual(env.closed(), 1);
    console.log(
      'ok  controller refuses prune/build/layout and invalid inspection; overlapping import/read/close cannot interrupt mutation'
    );
  }
  {
    const view = ui();
    try {
      view.get('bundled-source').click();
      const request = view.sent.at(-1);
      assert.strictEqual(request.type, 'maintenance-source');
      assert(view.get('bundled-source').disabled);
      view.reply({ ...request, requestId: request.requestId - 1 }, doc);
      assert.strictEqual(
        view.sent.length,
        1,
        'Stale source responses cannot load another document'
      );
      view.reply(request, doc);
      assert.strictEqual(view.sent.length, 2);
      assert.strictEqual(view.sent.at(-1).type, 'maintenance-inspect');
      assert(
        view.get('import').disabled,
        'Bundled source still needs fresh inspection'
      );
      view.reply(view.sent.at(-1), {
        collection: null,
        variables: [],
        styles: [],
      });
      assert(!view.get('import').disabled);
      assert(
        !view.sent.some(message => message.type === 'import'),
        'Bundled source route does not automatically mutate Figma'
      );
      view.get('bundled-source').click();
      view.reply(view.sent.at(-1), { collection: 'Invalid source' });
      assert(view.get('import').disabled && view.get('save').disabled);
      assert.match(view.get('report').textContent, /Source error/);
      console.log(
        'ok  bundled source route returns matching data, rejects stale replies, refreshes inspection and fails closed for invalid source without auto-import'
      );
    } finally {
      view.dom.window.close();
    }
  }
  {
    const view = ui();
    const { get, checks, sent, reply, deliver } = view;
    try {
      assert(get('import').disabled);
      get('json').value = JSON.stringify(doc);
      get('load-json').click();
      const inspect = sent.at(-1);
      assert.strictEqual(inspect.type, 'maintenance-inspect');
      assert.strictEqual(inspect.collection, doc.collection);
      for (const id of [
        'file',
        'json',
        'load-json',
        'inspect',
        'import',
        'save',
        'effects',
      ])
        assert(get(id).disabled, `${id} disabled during inspection`);
      deliver({
        type: 'result',
        operation: inspect.type,
        requestId: inspect.requestId - 1,
        result: {},
      });
      deliver({
        type: 'result',
        operation: 'import',
        requestId: inspect.requestId,
        result: {},
      });
      deliver({
        type: 'unrecognised',
        operation: inspect.type,
        requestId: inspect.requestId,
      });
      assert(
        get('inspect').disabled,
        'Stale, mismatched and unknown replies must retain busy state'
      );
      reply(inspect, { collection: null, variables: [], styles: [] });
      assert(!get('import').disabled);
      assert.strictEqual(
        checks('style-options').filter(input => input.checked).length,
        9
      );
      assert.strictEqual(
        checks('brands').filter(input => input.checked).length,
        5
      );
      get('import').click();
      const mutation = sent.at(-1);
      assert.strictEqual(mutation.type, 'import');
      assert.strictEqual(mutation.prune, false);
      assert.strictEqual(mutation.effects, true);
      assert.strictEqual(mutation.textStyles.length, 9);
      assert.deepStrictEqual(
        mutation.modes,
        doc.modes.map(mode => mode.id)
      );
      const count = sent.length;
      get('import').click();
      get('inspect').click();
      get('load-json').click();
      assert.strictEqual(
        sent.length,
        count,
        'Disabled controls do not double-submit'
      );
      reply(mutation, {
        counts: { created: 520, updated: 0, values: 2600 },
        styles: { counts: { text: { created: 9 }, effect: { created: 8 } } },
        stale: [],
        errors: [],
      });
      assert(get('installed').disabled, 'Mutation invalidates inspection');
      get('save').click();
      assert.strictEqual(
        view.downloads[0].download,
        'mangrove-maintenance-import-report.json'
      );
      const saved = JSON.parse(await view.blobs[0].text());
      assert.strictEqual(saved.operation, 'import');
      assert.strictEqual(saved.result.counts.created, 520);
      view.timers[0]();
      assert.deepStrictEqual(view.revoked, ['blob:mock/1']);
      get('inspect').click();
      const installed = [doc.styles.text[0].id, doc.styles.text.at(-1).id];
      reply(sent.at(-1), {
        collection: {
          name: doc.collection,
          modes: [{ name: doc.modes.find(mode => mode.id === 'delta').name }],
        },
        variables: [],
        styles: installed.map(tokenId => ({ tokenId, kind: 'text' })),
      });
      assert.deepStrictEqual(
        checks('style-options')
          .filter(input => input.checked)
          .map(input => input.value),
        installed
      );
      assert.deepStrictEqual(
        checks('brands')
          .filter(input => input.checked)
          .map(input => input.value),
        ['delta']
      );
      get('style-search').value = doc.styles.text.at(-1).name;
      get('style-search').oninput();
      assert.strictEqual(
        [...get('style-options').children].filter(label => !label.hidden)
          .length,
        1
      );
      get('clear-styles').click();
      assert.strictEqual(
        checks('style-options').filter(input => input.checked).length,
        0
      );
      get('installed').click();
      assert.strictEqual(
        checks('style-options').filter(input => input.checked).length,
        2
      );
      get('import').click();
      reply(sent.at(-1), 'Injected refusal after partial mutation.', 'error');
      assert(
        get('installed').disabled,
        'An error after mutation also requires fresh inspection'
      );
      assert(!get('save').disabled);
      get('json').value = '{broken';
      get('load-json').click();
      assert(get('import').disabled && get('save').disabled);
      assert.match(get('report').textContent, /Source error/);
      console.log(
        'ok  actual UI routes paste, filters styles, ignores stale replies, prevents double-submit, requires fresh inspection and downloads structured receipts'
      );
    } finally {
      view.dom.window.close();
    }
  }
  {
    const view = ui();
    try {
      const file = { text: async () => JSON.stringify(doc) };
      await view.get('file').onchange({ target: { files: [file] } });
      assert.strictEqual(view.sent.at(-1).type, 'maintenance-inspect');
      assert.match(view.get('source-state').textContent, /520 variables/);
      const inspect = view.sent.at(-1);
      view.reply(inspect, { collection: null, styles: [], variables: [] });
      await view.get('file').onchange({
        target: {
          files: [
            {
              text: async () => {
                throw new Error('Unreadable source');
              },
            },
          ],
        },
      });
      assert.match(
        view.get('report').textContent,
        /Could not read source: Unreadable source/
      );
      console.log(
        'ok  actual UI file picker loads maintenance JSON and reports read failures'
      );
    } finally {
      view.dom.window.close();
    }
  }
}

if (require.main === module)
  main().catch(error => {
    console.error(`FAIL ${error.stack || error}`);
    process.exitCode = 1;
  });
