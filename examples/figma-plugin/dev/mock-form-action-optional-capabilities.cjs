#!/usr/bin/env node
/** Private synthetic control-flow checks, not native wrapping/style/pixel acceptance. */
'use strict';
const assert = require('assert'),
  fs = require('fs'),
  path = require('path');
const DIR = path.resolve(__dirname, '..');
const { environment, importFoundation } = require(
  path.join(DIR, 'dev/mock-kit.cjs')
);
const doc = JSON.parse(
  fs.readFileSync(path.join(DIR, 'mangrove-variables.json'), 'utf8')
);
const copy = value => JSON.parse(JSON.stringify(value));
const helper = fs.readFileSync(
  path.join(DIR, 'kit-form-action-optional-capabilities.js'),
  'utf8'
);
const preflight = fs.readFileSync(
  path.join(DIR, 'kit-form-action-capabilities.js'),
  'utf8'
);
const existingCore = fs.readFileSync(
  path.join(DIR, 'kit-capabilities.js'),
  'utf8'
);
const core = existingCore;
const runtime = [preflight, helper, core].join('\n');
const run = (env, source = doc) =>
  env.runCode(
    `${runtime}\nreturn runMangroveCapabilityProbes(${JSON.stringify(source)},'undrr','form-action-optional');`
  );
const cleanup = (env, report) =>
  env.runCode(
    `${runtime}\nreturn removeMangroveCapabilityProbes(${JSON.stringify(report)});`
  );
const identity = (node, key = 'mgCapabilityProbeId') =>
  node.getSharedPluginData('orgundrrmangrove', key);
const walk = node => [node, ...(node.children || []).flatMap(walk)];
async function setup(options = {}) {
  const env = environment(doc);
  await importFoundation(env, doc);
  const imported = await env.call(
    'importVariables',
    doc,
    ['undrr'],
    false,
    ['component.button', 'component.input'],
    false
  );
  assert.deepStrictEqual(copy(imported.errors), []);
  const scratch = env.figma.createFrame(),
    proto = Object.getPrototypeOf(scratch);
  scratch.remove();
  const ancestor = (node, type) => {
    for (let p = node.parent; p; p = p.parent) if (p.type === type) return p;
    return null;
  };
  Object.defineProperty(proto, 'minWidth', {
    configurable: true,
    get() {
      return this._minWidth ?? null;
    },
    set(value) {
      if (value === 0) throw Error('minWidth cannot be set to0, use null');
      assert(value == null || (Number.isFinite(value) && value > 0));
      this._minWidth = value;
    },
  });
  for (const field of ['x', 'y'])
    Object.defineProperty(proto, field, {
      configurable: true,
      get() {
        return this[`_position_${field}`] ?? 0;
      },
      set(value) {
        if (this.type === 'RECTANGLE' && ancestor(this, 'INSTANCE'))
          throw Error('relative-transform cannot be overridden');
        this[`_position_${field}`] = value;
      },
    });
  const resize = proto.resize;
  env.descendantGeometryWrites = [];
  proto.resize = function (...args) {
    if (ancestor(this, 'INSTANCE'))
      env.descendantGeometryWrites.push({ id: this.id, method: 'resize' });
    return resize.apply(this, args);
  };
  // Only paragraph wrapper readbacks are synthesised, not a layout engine.
  Object.defineProperty(proto, 'width', {
    configurable: true,
    get() {
      const consumer = ancestor(this, 'INSTANCE');
      if (
        options.legacyZeroStacked &&
        consumer?.name.includes(' / 3 / ') &&
        ['Help', 'Error'].includes(this.name) &&
        this.visible
      )
        return 0;
      const parent = consumer || ancestor(this, 'COMPONENT');
      if (
        parent &&
        (/^(Label|Help|Error) wrapper$/.test(this.name) ||
          ['Label', 'Help', 'Error'].includes(this.name))
      )
        return options.zeroParagraphWidth && this.name === 'Help'
          ? 0
          : parent.width;
      return this._width ?? 100;
    },
    set(value) {
      if (ancestor(this, 'INSTANCE'))
        env.descendantGeometryWrites.push({ id: this.id, method: 'width' });
      this._width = value;
    },
  });
  Object.defineProperty(proto, 'layoutMode', {
    configurable: true,
    get() {
      return this._layout || 'NONE';
    },
    set(value) {
      if (
        options.ignoreNestedMode &&
        this.name === 'Control/action row' &&
        ancestor(this, 'INSTANCE')
      )
        return;
      this._layout = value;
    },
  });
  const instantiate = proto.createInstance;
  proto.createInstance = function () {
    const result = instantiate.call(this);
    assert.strictEqual(identity(result, 'mgKitId'), identity(this, 'mgKitId'));
    const source = walk(this),
      target = walk(result);
    source.forEach((node, i) => {
      target[i].boundVariables = copy(node.boundVariables);
      for (const field of [
        'topLeftRadius',
        'topRightRadius',
        'bottomLeftRadius',
        'bottomRightRadius',
        '_strokesIncludedInLayout',
      ])
        target[i][field] = node[field];
    });
    return result;
  };
  const properties = proto.setProperties;
  proto.setProperties = function (values) {
    properties.call(this, values);
    for (const node of walk(this)) {
      const refs = node.componentPropertyReferences || {};
      if (refs.characters in values) node.characters = values[refs.characters];
      if (refs.visible in values) node.visible = values[refs.visible];
    }
  };
  return env;
}
const foundation = env =>
  copy({
    variables: env.state.variables.map(v => [v.id, v.valuesByMode]),
    styles: env.state.styles.map(s => [
      s.id,
      s.fontName,
      s.fontSize,
      s.lineHeight,
      s.boundVariables,
    ]),
  });
async function main() {
  const env = await setup(),
    before = foundation(env),
    report = await run(env),
    test = report.tests.formActionOptionalA;
  assert.deepStrictEqual(copy(report.errors), []);
  assert.strictEqual(test.status, 'observed', JSON.stringify(test.errors));
  assert.deepStrictEqual(copy(test.errors), []);
  assert.strictEqual(report.formActionOptional.experiment, 'A');
  assert.strictEqual(report.formActionOptional.layoutSwitchingTested, false);
  assert.strictEqual(
    report.formActionOptional.sharedStyleAssociationSatisfied,
    false
  );
  assert.strictEqual(
    report.formActionOptional.ordinaryCanonicalAcceptance,
    false
  );
  assert.strictEqual(report.ledger.length, 172);
  assert.strictEqual(new Set(report.ledger.map(n => n.id)).size, 172);
  assert.strictEqual(report.formActionOptional.cohorts.length, 8);
  const keys = report.formActionOptional.propertyKeys;
  assert.strictEqual(Object.keys(keys).length, 8);
  assert.strictEqual(new Set(Object.values(keys)).size, 8);
  assert(
    report.formActionOptional.sourceInitialization.every(
      i =>
        i.width === 390 &&
        Object.values(i.fields).every(
          f => f.widthReady && f.text.characters.length && f.wrapper.visible
        )
    )
  );
  for (const value of test.observations) {
    assert.strictEqual(value.mainComponentId, value.expectedMainComponentId);
    assert.strictEqual(value.propertyBindingsMatch, true);
    assert.strictEqual(value.sourceTypographyAliasesMatch, true);
    assert.strictEqual(value.effectiveRangePaintsMatch, true);
    assert.strictEqual(value.geometry.rowMode, true);
    assert.strictEqual(value.geometry.visibleParagraphs, true);
    assert.strictEqual(value.geometry.rowSpacing, true);
    assert.notStrictEqual(
      value.consumer.mgKitId,
      identity(env.state.nodes.get(value.mainComponentId), 'mgKitId')
    );
    for (const [name, field] of Object.entries(value.fields)) {
      assert.strictEqual(field.propertyId, keys[name]);
      assert.strictEqual(field.textStyleId, '');
      if (field.wrapper) {
        assert.strictEqual(field.visible, true);
        assert(!field.propertyReferences.visible);
        assert.strictEqual(
          field.wrapperVisibilityReference,
          keys[`Show ${name.toLowerCase()}`]
        );
        assert(field.wrapper.padding.every(p => p === 0));
      }
    }
    if (value.phase.startsWith('after private'))
      assert.strictEqual(value.exactIdentityAndEditsPreserved, true);
  }
  assert.strictEqual(env.descendantGeometryWrites.length, 0);
  assert.strictEqual(test.findings.visualAcceptance, false);
  assert.strictEqual(test.supported, false);
  assert(
    test.observations.filter(o => o.phase.startsWith('new fresh after'))
      .length === 4
  );
  assert(
    test.observations
      .filter(o => o.phase === 'empty but visible diagnostic390')
      .every(
        o =>
          o.fields.Help.characters === '' &&
          o.fields.Error.characters === '' &&
          o.fields.Help.wrapper.visible &&
          o.fields.Error.wrapper.visible
      )
  );
  assert.deepStrictEqual(foundation(env), before);
  const cleaned = await cleanup(env, report);
  assert.deepStrictEqual(copy(cleaned.errors), []);
  assert.strictEqual(cleaned.removedNodeIds.length, 172);
  console.log(
    'ok  Experiment A SET-owned8keys/fixed2layouts/nonempty optional wrappers, edited consumers +3freshcohorts,2private repeats/172strict cleanup; no descendant geometry writes or native acceptance'
  );
  const failed = await setup({ zeroParagraphWidth: true }),
    partial = await run(failed);
  assert.strictEqual(partial.tests.formActionOptionalA.status, 'error');
  assert(
    partial.tests.formActionOptionalA.errors.some(e =>
      e.includes('Positive390')
    )
  );
  assert.strictEqual(partial.ledger.length, 20);
  const partialCleanup = await cleanup(failed, partial);
  assert.deepStrictEqual(copy(partialCleanup.errors), []);
  assert.strictEqual(partialCleanup.removedNodeIds.length, 20);
  console.log(
    'ok  failed positive-width initialization preserves20-node partial ledger and exact restart cleanup'
  );
  const rejected = await setup(),
    bad = copy(doc);
  bad.capabilities.formActionJoining.roles.controlRadius.type = 'COLOR';
  const blocked = await run(rejected, bad);
  assert(blocked.errors.length);
  assert.strictEqual(blocked.rootId, null);
  assert.strictEqual(blocked.ledger.length, 0);
  console.log(
    'ok  existing35-role native/source/font preflight blocks malformed input before root writes'
  );
  const conservative = await setup(),
    owned = await run(conservative);
  const root = conservative.state.nodes.get(owned.rootId),
    foreign = conservative.figma.createFrame();
  root.appendChild(foreign);
  const refusal = await cleanup(conservative, owned);
  assert(refusal.errors.length);
  assert(conservative.state.nodes.has(foreign.id));
  foreign.remove();
  const moved = conservative.state.nodes.get(
    owned.formActionOptional.cohorts[0].id
  );
  conservative.figma.currentPage.appendChild(moved);
  assert((await cleanup(conservative, owned)).errors.length);
  root.appendChild(moved);
  assert.deepStrictEqual(copy((await cleanup(conservative, owned)).errors), []);
  console.log(
    'ok  foreign additions/moved consumers reject cleanup; source-instance ownership remains exact'
  );
  const legacy = await setup({
    ignoreNestedMode: true,
    legacyZeroStacked: true,
  });
  const replay = await legacy.runCode(
    `${preflight}\n${existingCore}\nreturn runMangroveCapabilityProbes(${JSON.stringify(doc)},'undrr','form-action-joining');`
  );
  const replayJoined = replay.tests.formActionStacked.observations.find(
    o => o.phase === 'Viewport481 joined390'
  );
  assert.strictEqual(replayJoined.row.layoutMode, 'VERTICAL');
  assert.strictEqual(
    replayJoined.sourceGeometry.rowModeAxesAndSpacingMatch,
    false
  );
  const replayCollapsed = replay.tests.formActionStacked.observations.filter(
    o =>
      o.phase === 'Stacked long editable paragraphs240' ||
      o.phase === 'edited before diagnostic reapplications' ||
      o.phase.startsWith('after private')
  );
  assert.strictEqual(replayCollapsed.length, 4);
  assert(
    replayCollapsed.every(
      o =>
        ['Help', 'Error'].every(
          name => o.fields[name].visible && o.fields[name].width === 0
        ) && o.sourceGeometry.paragraphsHug === false
    )
  );
  assert.strictEqual(
    replay.tests.formActionStacked.supportedGeometryAndBindings,
    false
  );
  const replayCleanup = await cleanup(legacy, replay);
  assert.deepStrictEqual(copy(replayCleanup.errors), []);
  assert.strictEqual(replayCleanup.removedNodeIds.length, 113);
  console.log(
    'ok  separate original-helper replay reproduces ignored nested mode and8visible zero-width paragraph findings with113cleanup'
  );
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
