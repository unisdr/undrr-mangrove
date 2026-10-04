'use strict';
// Synthetic propagation and layout fixture only; no native geometry or pixel claim.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  setup: leafFixture,
} = require('./mock-segmented-leaves-capabilities.cjs');
const {
  buildFigmaVariables,
} = require('../../../scripts/build-figma-tokens.cjs');
const doc = buildFigmaVariables();
const source = ['kit-core-content-capabilities.js', 'kit-capabilities.js']
  .map(file => fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8'))
  .join('\n');
const copy = v => JSON.parse(JSON.stringify(v));
const ids = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
const families = ['chips', 'text-cta', 'empty-state-compact'];
const prepare = (e, d = doc) =>
  e.runCode(
    source +
      '\nreturn runMangroveCapabilityProbes(' +
      JSON.stringify(d) +
      ',"undrr","core-content");'
  );
const advance = (e, r, b) =>
  e.runCode(
    source +
      '\nreturn advanceMangroveCoreContentProbes(' +
      JSON.stringify(doc) +
      ',"undrr",' +
      JSON.stringify(r) +
      ',' +
      JSON.stringify(b) +
      ');'
  );
const cleanup = (e, r) =>
  e.runCode(
    source +
      '\nreturn removeMangroveCapabilityProbes(' +
      JSON.stringify(r) +
      ');'
  );
const build = async e => {
  const result = await e.call(
    'buildMangroveComponents',
    doc,
    'undrr',
    families
  );
  for (const node of e.state.nodes.values())
    if (node.type === 'TEXT') {
      let ancestor = node.parent,
        canonical = false;
      while (ancestor) {
        if (ancestor.type === 'COMPONENT') {
          canonical = true;
          break;
        }
        ancestor = ancestor.parent;
      }
      if (canonical) {
        node.width = 100;
        node.height = 24;
        node.x = 0;
        node.y = 0;
      }
    }
  return result;
};
async function setup() {
  const e = await leafFixture();
  const scratch = e.figma.createText(),
    p = Object.getPrototypeOf(scratch);
  scratch.remove();
  Object.defineProperty(p, 'hasMissingFont', {
    configurable: true,
    get() {
      return false;
    },
  });
  const style = p.setTextStyleIdAsync;
  p.setTextStyleIdAsync = async function (id) {
    await style.call(this, id);
    if (id)
      Object.assign(
        this.boundVariables,
        copy(e.state.styles.find(s => s.id === id).boundVariables)
      );
  };
  const mirror = (n, props) => {
    for (const child of n.children || []) {
      const r = child.componentPropertyReferences || {};
      if (r.characters in props) child.characters = props[r.characters];
      if (r.visible in props) child.visible = props[r.visible];
      mirror(child, props);
    }
  };
  const layout = n => {
    if (n.type !== 'INSTANCE') return;
    // Synthetic FILL widths only; deliberately no claim about actual text measurement.
    const walk = node => {
      const available = Math.max(
        10,
        node.width - (node.paddingLeft || 0) - (node.paddingRight || 0)
      );
      for (const child of node.children || []) {
        if (child.layoutSizingHorizontal === 'FILL') child.width = available;
        if (child.type === 'TEXT') {
          child.height = 24;
          child.x = 0;
          child.y = 0;
        }
        walk(child);
      }
    };
    walk(n);
    n.height = Math.max(250, n.height);
  };
  const props = p.setProperties;
  p.setProperties = function (v) {
    props.call(this, v);
    mirror(this, v);
    layout(this);
  };
  const resize = p.resize;
  p.resize = function (w, h) {
    resize.call(this, w, h);
    layout(this);
  };
  const instance = p.createInstance;
  p.createInstance = function () {
    const n = instance.call(this);
    const visit = (a, b) => {
      for (const f of [
        'primaryAxisAlignItems',
        'counterAxisAlignItems',
        'cornerRadius',
        'topLeftRadius',
        'topRightRadius',
        'bottomLeftRadius',
        'bottomRightRadius',
        'layoutWrap',
      ])
        if (a[f] !== undefined) b[f] = copy(a[f]);
      b.boundVariables = copy(a.boundVariables);
      a.children.forEach((c, i) => visit(c, b.children[i]));
    };
    visit(this, n);
    mirror(
      n,
      Object.fromEntries(
        Object.entries(n.componentProperties).map(([k, v]) => [k, v.value])
      )
    );
    layout(n);
    return n;
  };
  const b = await build(e);
  assert.deepEqual(copy(b.errors), []);

  return e;
}
async function main() {
  const e = await setup(),
    before = new Set(e.state.nodes.keys());
  let r = await prepare(e);
  assert.deepEqual(copy(r.errors), [], JSON.stringify(r.errors));
  assert.equal(r.ledger.length, 39);
  assert.equal(r.coreContent.canonicalBaseline.length, 26);
  for (let pass = 1; pass <= 2; pass++) {
    const b = await build(e);
    assert.deepEqual(copy(b.errors), []);
    assert.equal(b.createdNodeIds.length, 0);
    r = await advance(e, r, b);
    assert.deepEqual(copy(r.errors), [], JSON.stringify(r.errors));
    assert.equal(r.ledger.length, pass === 1 ? 58 : 77);
  }
  assert.equal(r.coreContent.verdict, 'rebuild-fields-verified');
  assert.equal(r.coreContent.cohorts.length, 4);
  const c = await cleanup(e, r);
  assert.deepEqual(copy(c.errors), []);
  assert.equal(c.removedNodeIds.length, 77);
  assert.deepEqual(new Set(e.state.nodes.keys()), before);
  console.log(
    'ok  synthetic three-preset creation, source identities, four cohorts, two ordinary builds, edits, optional restore and strict77 cleanup'
  );
  for (const [id, font] of [
    [
      'component.text-cta.heading.mobile',
      {
        family: 'Roboto',
        style: 'Bold',
        variationSettings: { wdth: 100, wght: 600 },
      },
    ],
    [
      'component.chips.label',
      {
        family: 'Roboto',
        style: 'Medium',
        variationSettings: { wdth: 100, wght: 400 },
      },
    ],
    [
      'component.empty-state.compact-description',
      {
        family: 'Roboto',
        style: 'Regular',
        variationSettings: { wdth: 90, wght: 400 },
      },
    ],
    [
      'component.text-cta.heading.desktop',
      {
        family: 'Roboto',
        style: 'Black',
        variationSettings: { wdth: 100, wght: 700 },
      },
    ],
    [
      'component.chips.label',
      {
        family: 'Roboto',
        style: 'Medium',
        variationSettings: { wdth: 100, wght: 500, ital: 0 },
      },
    ],
  ]) {
    const env = await setup(),
      before = env.state.nodes.size;
    env.state.loadedFonts.add(`${font.family} ${font.style}`);
    env.state.styles.find(
      s => s.getSharedPluginData('orgundrrmangrove', 'mgStyleId') === id
    ).fontName = font;
    const failed = await prepare(env);
    assert(failed.errors.length, 'Source face/axis must refuse');
    assert.equal(failed.ledger.length, 0);
    assert.equal(env.state.nodes.size, before);
  }
  {
    const env = await setup();
    for (const style of env.state.styles.filter(s =>
      [
        'component.chips.label',
        'component.text-cta.heading.mobile',
        'component.text-cta.heading.desktop',
        'component.empty-state.compact-description',
      ].includes(s.getSharedPluginData('orgundrrmangrove', 'mgStyleId'))
    )) {
      const weight = { Regular: 400, Medium: 500, Bold: 700 }[
        style.fontName.style
      ];
      style.fontName = {
        ...style.fontName,
        variationSettings: { wdth: 100, wght: weight },
      };
      for (const text of env.state.nodes.values())
        if (text.type === 'TEXT' && text.textStyleId === style.id)
          text.fontName = copy(style.fontName);
    }
    const report = await prepare(env);
    assert.deepEqual(copy(report.errors), []);
    assert.deepEqual(copy((await cleanup(env, report)).errors), []);
  }
  console.log(
    'ok  source standard Medium500/Bold700/Regular400 axes accepted; custom weight/width/extra axis/Black refused before canvas'
  );
  for (const kind of [
    'missing-template',
    'wrong-role-type',
    'missing-font',
    'desktop-template-drift',
    'wrong-root-padding',
    'wrong-root-surface',
  ]) {
    const env = await setup(),
      count = env.state.nodes.size;
    if (kind === 'missing-template')
      env.state.styles.splice(
        env.state.styles.findIndex(
          style =>
            style.getSharedPluginData('orgundrrmangrove', 'mgStyleId') ===
            'component.chips.label'
        ),
        1
      );
    if (kind === 'wrong-role-type')
      env.state.variables.find(
        v => v.name === 'component/chips/long-consumer-width'
      ).resolvedType = 'COLOR';
    if (kind === 'missing-font') env.state.rejectedFonts.add('Roboto Medium');
    if (kind === 'desktop-template-drift')
      env.state.styles.find(
        style =>
          style.getSharedPluginData('orgundrrmangrove', 'mgStyleId') ===
          'component.text-cta.heading.desktop'
      ).fontSize += 1;
    if (kind === 'wrong-root-padding')
      [...env.state.nodes.values()].find(
        n => ids(n) === 'family/text-cta/variant/text-cta.soft.mobile'
      ).paddingLeft += 1;
    if (kind === 'wrong-root-surface')
      [...env.state.nodes.values()].find(
        n => ids(n) === 'family/chips/variant/chips.linked.default.long'
      ).fills[0].color.r = 0;
    const failed = await prepare(env);
    assert(failed.errors.length, kind);
    assert.equal(failed.ledger.length, 0, kind);
    assert.equal(env.state.nodes.size, count, kind);
  }
  console.log(
    'ok  selected missing template/typed role/font and unselected Desktop source drift all refuse before canvas'
  );
  for (const kind of ['root-failure', 'instance-readback-failure']) {
    const env = await setup(),
      beforeIds = new Set(env.state.nodes.keys());
    if (kind === 'root-failure') {
      const create = env.figma.createFrame;
      env.figma.createFrame = () => {
        const node = create();
        node.resize = () => {
          throw Error('injected native root resize refusal');
        };
        return node;
      };
    } else {
      const text = [...env.state.nodes.values()].find(n => n.type === 'TEXT'),
        proto = Object.getPrototypeOf(text),
        range = proto.getRangeFills;
      proto.getRangeFills = function (...args) {
        if (this.getSharedPluginData('orgundrrmangrove', 'mgCapabilityProbeId'))
          throw Error('injected new consumer readback refusal');
        return range.apply(this, args);
      };
    }
    const failed = await prepare(env);
    assert(failed.errors.length, kind);
    assert.equal(failed.coreContent.verdict, 'failed');
    assert.equal(failed.ledger.length, kind === 'root-failure' ? 1 : 3);
    const removed = await cleanup(env, failed);
    assert.deepEqual(copy(removed.errors), []);
    assert.equal(removed.removedNodeIds.length, failed.ledger.length);
    assert.deepEqual(new Set(env.state.nodes.keys()), beforeIds);
  }
  console.log(
    'ok  partial root/new instance failures retain exact recoverable owned ledgers'
  );
  {
    const env = await setup(),
      report = await prepare(env),
      root = env.state.nodes.get(report.rootId),
      count = env.state.nodes.size;
    const foreign = env.figma.createFrame();
    root.appendChild(foreign);
    const audit = await env.runCode(
      source +
        '\nreturn inspectMangroveCapabilityProbeLedger(' +
        JSON.stringify(report) +
        ');'
    );
    const refresh = await env.runCode(
      source +
        '\nreturn refreshMangroveCapabilityProbeLedger(' +
        JSON.stringify(report) +
        ');'
    );
    assert(audit.errors.length);
    assert(refresh.errors.length);
    assert.equal(refresh.addedNodeIds.length, 0);
    assert((await cleanup(env, report)).errors.length);
    assert.equal(env.state.nodes.size, count + 1);
    foreign.remove();
    const member = env.state.nodes.get(
      report.coreContent.cohorts[0].members[0].instanceId
    );
    env.figma.currentPage.appendChild(member);
    assert((await cleanup(env, report)).errors.length);
    assert.equal(env.state.nodes.size, count);
    root.appendChild(member);
    const altered = copy(report);
    altered.coreContent.canonicalBaseline[0].snapshot[0].bounds.width += 1;
    assert((await cleanup(env, altered)).errors.length);
    assert.equal(env.state.nodes.size, count);
    const duplicate = copy(report);
    duplicate.ledger.push(copy(duplicate.ledger[0]));
    assert((await cleanup(env, duplicate)).errors.length);
    assert.equal(env.state.nodes.size, count);
    assert.deepEqual(copy((await cleanup(env, report)).errors), []);
  }
  console.log(
    'ok  foreign, moved, duplicate-ledger and baseline tamper cannot authorize cleanup'
  );
  {
    const env = await setup(),
      report = await prepare(env),
      built = await build(env);
    built.families.push({ id: 'table' });
    const failed = await advance(env, report, built);
    assert(failed.errors.some(error => error.includes('Unexpected family')));
    assert.equal(failed.ledger.length, 39);
    assert.deepEqual(copy((await cleanup(env, failed)).errors), []);
  }
  console.log(
    'ok  ordinary build receipt refuses unrelated scope without adding a fresh cohort'
  );
}
main().catch(e => {
  console.error(e.stack || e);
  process.exitCode = 1;
});
