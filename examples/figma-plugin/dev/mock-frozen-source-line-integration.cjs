#!/usr/bin/env node
/** Actual builder boundary tests. This does not establish native line pixels. */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { environment } = require('./mock-kit.cjs');
const {
  installNativeTextPropertyDefaultFixture,
} = require('./mock-search-results.cjs');
const {
  buildConnector,
} = require('../../../scripts/build-figma-connector.cjs');
const copy = value => JSON.parse(JSON.stringify(value));
const paragraph =
  'Sed vel lectus sed nunc consequat feugiat. Integer imperdiet lectus quam, ut porttitor lectus lacinia consectetur. Donec ut libero sed arcu vehicula ultricies a non tortor. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae. In hac habitasse platea dictumst.';
function fixture() {
  const doc = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'))
  );
  const cuts = [0, 68, 135, 205, 294];
  const source = {
    id: 'frozen-line-fixture',
    name: 'Frozen source paragraph fixture',
    kind: 'component-set',
    review: { genericLabels: false },
    variants: [
      {
        id: 'frozen-line-fixture.1164',
        name: 'Viewport=1164',
        properties: { Viewport: '1164' },
        tree: {
          type: 'FRAME',
          id: 'root',
          name: 'Finite paragraph owner',
          layout: {
            mode: 'VERTICAL',
            width: 722,
            height: 'HUG',
            gap: 0,
          },
          children: cuts.slice(0, -1).map((start, i) => ({
            type: 'FRAME',
            id: 'line' + i,
            name: 'Source line allocation ' + i,
            layout: {
              mode: 'HORIZONTAL',
              width: i < 3 ? 485.40625 : 722,
              height: 'HUG',
              gap: 0,
            },
            children: [
              {
                type: 'TEXT',
                id: 'lineText' + i,
                name: 'Source line ' + i,
                characters: paragraph.slice(start, cuts[i + 1]),
                textStyle: 'text.text.300.regular',
                fill: 'color/neutral-900',
                layout: { width: 'HUG', height: 'HUG' },
                sourceLine: {
                  paragraphId: 'fixture/article-paragraph',
                  paragraphCharacters: paragraph,
                  start,
                  end: cuts[i + 1],
                  lineIndex: i,
                  lineCount: 4,
                },
              },
            ],
          })),
        },
      },
    ],
  };
  const editable = {
    id: 'unrestricted-edit-fixture',
    name: 'Unrestricted edit fixture',
    kind: 'component-set',
    review: { genericLabels: false },
    variants: [
      {
        id: 'unrestricted-edit-fixture.default',
        name: 'State=Default',
        properties: { State: 'Default' },
        tree: {
          type: 'FRAME',
          id: 'root',
          name: 'Ordinary owner',
          layout: { mode: 'VERTICAL', width: 200, height: 'HUG' },
          children: [
            {
              type: 'TEXT',
              id: 'text',
              name: 'Ordinary editable text',
              characters: 'Ordinary authored copy',
              textProperty: 'Label',
              textStyle: 'text.text.300.regular',
              fill: 'color/neutral-900',
              layout: { width: 'HUG', height: 'HUG' },
            },
          ],
        },
      },
    ],
  };
  doc.components = { version: 1, families: [source, editable] };
  return doc;
}
const identity = node =>
  node.getSharedPluginData('orgundrrmangrove', 'mgKitId');
function state(env) {
  return JSON.stringify({
    nodes: [...env.state.nodes.values()].map(n => ({
      id: n.id,
      type: n.type,
      parent: n.parent?.id,
      name: n.name,
      x: n.x,
      y: n.y,
      width: n.width,
      height: n.height,
      characters: n.type === 'TEXT' ? n.characters : undefined,
      identity: identity(n),
      fills: n.fills,
      bound: n.boundVariables,
      style: n.textStyleId,
    })),
    styles: env.state.styles,
    images: [...env.state.images],
  });
}
function line(env) {
  return [...env.state.nodes.values()].find(
    n =>
      n.type === 'TEXT' &&
      identity(n) ===
        'family/frozen-line-fixture/variant/frozen-line-fixture.1164/line0/lineText0' &&
      !n.id.startsWith('I')
  );
}
async function imported(doc) {
  const env = environment(doc, { sharedOnly: true });
  env.state.modeLimit = 5;
  installNativeTextPropertyDefaultFixture(env);
  const result = await env.call(
    'importVariables',
    doc,
    doc.modes.map(m => m.id),
    false,
    [],
    true
  );
  assert.strictEqual(result.errors.length, 0, result.errors.join('\n'));
  return env;
}
async function built(mode) {
  const doc = fixture(),
    env = await imported(doc);
  const result = await env.call('buildMangroveComponents', doc, mode, [
    'frozen-line-fixture',
    'unrestricted-edit-fixture',
  ]);
  assert.strictEqual(result.errors.length, 0, result.errors.join('\n'));
  return { doc, env };
}
async function refuse(env, doc, reason) {
  const before = state(env);
  const result = await env.call('buildMangroveComponents', doc, 'undrr', [
    'unrestricted-edit-fixture',
    'frozen-line-fixture',
  ]);
  assert(
    result.errors.some(e => e.includes('reflow-needed')),
    result.errors.join('\n')
  );
  assert.strictEqual(result.createdNodeIds.length, 0);
  assert.strictEqual(state(env), before, reason);
}
function equalState(actual, expected, phase) {
  if (actual === expected) return;
  const a = JSON.parse(actual),
    b = JSON.parse(expected);
  const changed = a.nodes
    .filter(
      n =>
        JSON.stringify(n) !== JSON.stringify(b.nodes.find(m => m.id === n.id))
    )
    .map(n => {
      const old = b.nodes.find(m => m.id === n.id);
      return {
        id: n.id,
        changed: Object.keys(n)
          .filter(k => JSON.stringify(n[k]) !== JSON.stringify(old?.[k]))
          .map(k => ({ field: k, before: old?.[k], after: n[k] })),
      };
    });
  assert.fail(
    JSON.stringify({
      phase,
      changed,
      styleChanged: JSON.stringify(a.styles) !== JSON.stringify(b.styles),
      imagesChanged: JSON.stringify(a.images) !== JSON.stringify(b.images),
    })
  );
}
async function main() {
  for (const mode of fixture().modes) {
    const { doc, env } = await built(mode.id);
    const master = line(env).parent.parent;
    const consumer = master.createInstance();
    env.figma.currentPage.appendChild(consumer);
    const ordinary = [...env.state.nodes.values()].find(
      n =>
        n.type === 'TEXT' &&
        identity(n) ===
          'family/unrestricted-edit-fixture/variant/unrestricted-edit-fixture.default/text' &&
        !n.id.startsWith('I')
    );
    const ordinaryConsumer = ordinary.parent.createInstance();
    env.figma.currentPage.appendChild(ordinaryConsumer);
    const reference = ordinary.componentPropertyReferences.characters;
    const ordinaryText = ordinaryConsumer
      .findAllWithCriteria({ types: ['TEXT'] })
      .find(n => n.componentPropertyReferences?.characters === reference);
    const descriptor = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(ordinaryText),
      'characters'
    );
    // Model the same referenced instance property inheritance as the Search fixture.
    Object.defineProperty(ordinaryText, 'characters', {
      configurable: true,
      get() {
        return ordinaryConsumer.componentProperties[reference].value;
      },
      set(value) {
        descriptor.set.call(this, value);
      },
    });
    ordinaryConsumer.setProperties({
      [reference]: 'Preserved ordinary consumer edit',
    });
    assert.strictEqual(
      ordinaryConsumer.findAllWithCriteria({ types: ['TEXT'] })[0].characters,
      'Preserved ordinary consumer edit'
    );
    const before = state(env);
    for (let i = 0; i < 2; i++) {
      const result = await env.call('buildMangroveComponents', doc, mode.id, [
        'frozen-line-fixture',
        'unrestricted-edit-fixture',
      ]);
      assert.strictEqual(result.errors.length, 0, result.errors.join('\n'));
      assert.strictEqual(result.createdNodeIds.length, 0);
      equalState(state(env), before, 'repeat or compiled parity');
      assert(
        result.audit.some(
          a =>
            a.status === 'frozen-source-line-preflight' &&
            a.phase === 'before-style-import' &&
            a.checkedInstanceNodeIds.length >= 4
        )
      );
    }
    const packet = await buildConnector({
      operation: 'build',
      brandId: mode.id,
      familyIds: ['frozen-line-fixture'],
      doc,
    });
    assert(packet.frozenSourceLineEnabled && packet.bytes <= 50000);
    const result = await env.runCode(packet.code);
    assert.strictEqual(result.errors.length, 0, result.errors.join('\n'));
    assert.strictEqual(result.createdNodeIds.length, 0);
    equalState(state(env), before, 'repeat or compiled parity');
  }
  {
    const { env, doc } = await built('undrr');
    line(env).characters = 'Edited frozen source line';
    await refuse(
      env,
      doc,
      'Edited managed main refuses before permanent writes'
    );
  }
  {
    const { env, doc } = await built('undrr');
    const target = line(env),
      master = target.parent.parent;
    env.figma.currentPage.appendChild(target);
    master.remove();
    target.characters = 'Orphan edited frozen source line';
    await refuse(
      env,
      doc,
      'Orphan managed line cannot be adopted as a fresh source'
    );
  }
  {
    const { env, doc } = await built('undrr');
    const consumer = line(env).parent.parent.createInstance();
    env.figma.currentPage.appendChild(consumer);
    const target = consumer.findAllWithCriteria({ types: ['TEXT'] })[0];
    target.characters = 'Edited frozen linked consumer';
    await refuse(env, doc, 'Edited linked copy retained on refusal');
  }
  {
    const { env, doc } = await built('undrr');
    const consumer = line(env).parent.parent.createInstance();
    env.figma.currentPage.appendChild(consumer);
    const target = consumer.findAllWithCriteria({ types: ['TEXT'] })[0],
      load = env.figma.loadFontAsync;
    let once = false;
    env.figma.loadFontAsync = async font => {
      await load(font);
      if (!once) {
        once = true;
        target.characters = 'Changed during font preparation';
      }
    };
    const before = JSON.parse(state(env));
    const result = await env.call('buildMangroveComponents', doc, 'undrr', [
      'frozen-line-fixture',
      'unrestricted-edit-fixture',
    ]);
    assert(result.errors.some(e => e.includes('reflow-needed')));
    assert(
      result.audit.some(
        a =>
          a.status === 'blocked-frozen-source-line-preflight' &&
          a.phase === 'before-style-import'
      )
    );
    before.nodes.find(n => n.id === target.id).characters =
      'Changed during font preparation';
    assert.deepStrictEqual(JSON.parse(state(env)), before);
    assert.strictEqual(result.createdNodeIds.length, 0);
  }
  {
    const { env, doc } = await built('undrr');
    const load = env.figma.loadFontAsync;
    let once = false;
    env.figma.loadFontAsync = async font => {
      await load(font);
      if (!once) {
        once = true;
        const n = env.figma.createFrame();
        n.setSharedPluginData(
          'orgundrrmangrove',
          'mgKitId',
          'family/frozen-line-fixture/variant/frozen-line-fixture.1164'
        );
        env.figma.currentPage.appendChild(n);
      }
    };
    const before = new Set(env.state.nodes.keys());
    const result = await env.call('buildMangroveComponents', doc, 'undrr', [
      'frozen-line-fixture',
    ]);
    assert(result.errors.some(e => e.includes('reflow-needed')));
    assert.strictEqual(result.createdNodeIds.length, 0);
    assert.strictEqual(
      [...env.state.nodes.keys()].filter(id => !before.has(id)).length,
      1,
      'Only injected foreign duplicate exists'
    );
  }
  {
    const doc = fixture();
    doc.components.families[0].variants[0].tree.children.pop();
    const env = await imported(fixture());
    const before = state(env);
    const r = await env.call('buildMangroveComponents', doc, 'undrr', [
      'unrestricted-edit-fixture',
      'frozen-line-fixture',
    ]);
    assert(r.errors.some(e => e.includes('reflow-needed')));
    equalState(state(env), before, 'repeat or compiled parity');
    await assert.rejects(
      () =>
        buildConnector({
          operation: 'build',
          familyIds: ['frozen-line-fixture'],
          doc,
        }),
      /reflow-needed/
    );
  }
  {
    const doc = fixture();
    doc.components.families = doc.components.families.slice(1);
    const p = await buildConnector({
      operation: 'build',
      familyIds: ['unrestricted-edit-fixture'],
      doc,
    });
    assert.strictEqual(p.frozenSourceLineEnabled, false);
  }
  console.log(
    'Frozen source integration: all-five actual builder and compiled zero-create repeats preserve supported ordinary consumer edits; source/main/linked copy and font-await edits or duplicate owners refuse before permanent writes. Current-page guard only, no native pixels/reflow/publication claim.'
  );
}
module.exports = { fixture, main };
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
