#!/usr/bin/env node
/** Actual pure helper against documented native ownership shapes. No native acceptance. */
'use strict';
const fs = require('fs'),
  path = require('path'),
  vm = require('vm'),
  assert = require('assert');
const context = vm.createContext({ Map, Set, Error, Object, Array, Number });
vm.runInContext(
  fs.readFileSync(path.join(__dirname, '../kit-frozen-source-line.js'), 'utf8'),
  context
);
const helper = context.mgFrozenSourceLine,
  clone = x => JSON.parse(JSON.stringify(x));
const paragraph =
  'Sed vel lectus sed nunc consequat feugiat. Integer imperdiet lectus quam, ut porttitor lectus lacinia consectetur. Donec ut libero sed arcu vehicula ultricies a non tortor. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae. In hac habitasse platea dictumst.';
const ownerKey = 'family/news-exclusion/variant/1164',
  cuts = [0, 68, 135, 205, 294];
function records() {
  return cuts.slice(0, -1).map((start, i) => ({
    ownerKey,
    key: ownerKey + '/line' + i + '/text',
    spec: {
      type: 'TEXT',
      characters: paragraph.slice(start, cuts[i + 1]),
      layout: { width: 'HUG', height: 'HUG' },
      sourceLine: {
        paragraphId: 'article-story/what-happens-next/paragraph0',
        paragraphCharacters: paragraph,
        start,
        end: cuts[i + 1],
        lineIndex: i,
        lineCount: 4,
      },
    },
  }));
}
let nextId = 0;
function node(type, key, children = []) {
  const n = { id: String(++nextId), type, key, children, removed: false };
  for (const child of children) child.parent = n;
  return n;
}
function tree(type, key, plans) {
  const texts = plans.map(p =>
    Object.assign(node('TEXT', p.key), { characters: p.characters })
  );
  return {
    owner: node(
      type,
      key,
      texts.map(t => node('FRAME', 'slot', [t]))
    ),
    texts,
  };
}
function setup() {
  const plans = helper.sourcePlans(records()),
    main = tree('COMPONENT', ownerKey, plans),
    consumer = tree('INSTANCE', 'consumer', plans),
    foreign = tree('COMPONENT', ownerKey, plans),
    unrelated = tree('INSTANCE', 'foreign consumer', plans);
  consumer.owner.main = main.owner;
  unrelated.owner.main = foreign.owner;
  unrelated.texts[0].characters = 'Unrelated edited copy';
  const native = {
    mainByKey: () => [main.owner],
    identity: n => n.key,
    instances: [consumer.owner, unrelated.owner],
    mainForInstance: async n => n.main,
  };
  return {
    plans,
    main,
    consumer,
    foreign,
    unrelated,
    native,
  };
}
function snapshot(s) {
  const seen = new Set(),
    rows = [];
  function visit(n) {
    if (seen.has(n.id)) return;
    seen.add(n.id);
    rows.push({
      id: n.id,
      keys: Object.keys(n).sort(),
      type: n.type,
      key: n.key,
      characters: n.characters,
      removed: n.removed,
      parent: n.parent?.id,
      children: n.children.map(c => c.id),
      main: n.main?.id,
    });
    n.children.forEach(visit);
  }
  [s.main, s.consumer, s.foreign, s.unrelated].forEach(t => visit(t.owner));
  return clone(rows);
}
async function negative(mutator, duringReadEdit = false) {
  const s = setup();
  mutator(s);
  const before = snapshot(s);
  await assert.rejects(
    () => helper.preflight(s.plans, s.native),
    /reflow-needed/
  );
  if (duringReadEdit)
    before.find(n => n.id === s.main.texts[0].id).characters =
      'Changed during documented relationship await';
  assert.deepStrictEqual(snapshot(s), before);
}
(async () => {
  assert.equal(paragraph.length, 294);
  const plans = helper.sourcePlans(records());
  assert.equal(plans.length, 4);
  assert(Object.isFrozen(plans));
  assert(Object.isFrozen(plans[0]));
  assert.equal(plans.map(p => p.characters).join(''), paragraph);
  assert.equal(
    helper.sourcePlans([
      { spec: { type: 'TEXT', characters: 'Unrestricted normal edit' } },
    ]).length,
    0
  );
  for (const mutate of [
    r => {
      r[0].spec.sourceLine = null;
    },
    r => {
      r[0].spec.sourceLine.extra = true;
    },
    r => {
      r[0].spec.sourceLine.start = '0';
    },
    r => {
      r[0].spec.sourceLine.end = NaN;
    },
    r => {
      r[0].spec.characters = 'Edited';
    },
    r => {
      r[0].spec.textProperty = 'Line';
    },
    r => {
      r[0].spec.bindings = { characters: 'text-role' };
    },
    r => {
      r[0].spec.textAutoResize = 'WIDTH_AND_HEIGHT';
    },
    r => {
      r[0].spec.layout.width = 'FILL';
    },
    r => {
      r.pop();
    },
    r => {
      r[1].spec.sourceLine.lineIndex = 0;
    },
    r => {
      r[1].spec.sourceLine.start++;
    },
    r => {
      r[0].key = r[1].key;
    },
    r => {
      r[1].spec.sourceLine.paragraphCharacters += ' changed';
    },
  ]) {
    const r = records();
    mutate(r);
    assert.throws(() => helper.sourcePlans(r), /reflow-needed/);
  }
  const s = setup();
  for (let i = 0; i < 2; i++) {
    const before = snapshot(s);
    const receipt = await helper.preflight(s.plans, s.native);
    assert.equal(receipt.checkedMainNodeIds.length, 4);
    assert.equal(receipt.checkedInstanceNodeIds.length, 4);
    assert.deepStrictEqual(snapshot(s), before);
  }
  const fresh = setup();
  fresh.native.mainByKey = () => [];
  assert.equal(
    (await helper.preflight(fresh.plans, fresh.native)).checkedMainNodeIds
      .length,
    0
  );
  await negative(s => {
    s.main.texts[0].characters = 'Changed source line';
  });
  await negative(s => {
    s.consumer.texts[1].characters = 'Edited linked line';
  });
  await negative(s => {
    s.native.mainByKey = () => [s.foreign.owner, s.main.owner];
  });
  await negative(s => {
    s.main.owner.key = 'foreign owner';
  });
  await negative(s => {
    s.main.texts[0].removed = true;
  });
  await negative(s => {
    const t = node('TEXT', s.main.texts[0].key);
    t.characters = s.main.texts[0].characters;
    t.parent = s.main.owner;
    s.main.owner.children.push(t);
  });
  await negative(s => {
    const t = node('TEXT', s.consumer.texts[0].key);
    t.characters = s.consumer.texts[0].characters;
    t.parent = s.consumer.owner;
    s.consumer.owner.children.push(t);
  });
  await negative(s => {
    s.native.instances.push(s.consumer.owner);
  });
  await negative(s => {
    s.native.mainForInstance = async n => {
      s.main.texts[0].characters =
        'Changed during documented relationship await';
      return n.main;
    };
  }, true);
  const nested = setup(),
    outer = node('INSTANCE', 'other page', [nested.consumer.owner]);
  outer.main = node('COMPONENT', 'other page master');
  nested.native.instances.unshift(outer);
  assert.equal(
    (await helper.preflight(nested.plans, nested.native)).checkedInstanceNodeIds
      .length,
    4
  );
  nested.consumer.texts[3].characters = 'Ancestor nested target override';
  await assert.rejects(
    () => helper.preflight(nested.plans, nested.native),
    /reflow-needed/
  );
  const proxy = setup();
  proxy.native.mainForInstance = async n =>
    n === proxy.consumer.owner ? { ...proxy.main.owner } : n.main;
  assert.equal(
    (await helper.preflight(proxy.plans, proxy.native)).checkedInstanceNodeIds
      .length,
    4
  );
  const strictLeaves = setup();
  let unsupportedLeafReads = 0;
  for (const tree of [strictLeaves.main, strictLeaves.consumer])
    for (const text of tree.texts) {
      delete text.children;
      const leaf = new Proxy(text, {
        get(target, key, receiver) {
          if (key === 'children') {
            unsupportedLeafReads++;
            throw new Error('TEXT does not expose children');
          }
          return Reflect.get(target, key, receiver);
        },
      });
      text.parent.children[0] = leaf;
    }
  const strictReceipt = await helper.preflight(
    strictLeaves.plans,
    strictLeaves.native
  );
  assert.equal(strictReceipt.checkedMainNodeIds.length, 4);
  assert.equal(strictReceipt.checkedInstanceNodeIds.length, 4);
  assert.equal(unsupportedLeafReads, 0);
  const proxyOwners = setup();
  const beforeProxy = snapshot(proxyOwners);
  proxyOwners.native.mainByKey = () => [{ ...proxyOwners.main.owner }];
  proxyOwners.native.instances = proxyOwners.native.instances.map(n => ({
    ...n,
  }));
  proxyOwners.native.mainForInstance = async n => ({ ...n.main });
  const proxyReceipt = await helper.preflight(
    proxyOwners.plans,
    proxyOwners.native
  );
  assert.equal(proxyReceipt.checkedMainNodeIds.length, 4);
  assert.equal(proxyReceipt.checkedInstanceNodeIds.length, 4);
  assert.deepStrictEqual(snapshot(proxyOwners), beforeProxy);
  console.log(
    'Frozen source line: exact294/4 complete-source groups, existing main/actual linked consumer ownership, ancestor targets, unrelated copies, two pure repeats and source/native negative guards pass. No writes or native layout claim.'
  );
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
