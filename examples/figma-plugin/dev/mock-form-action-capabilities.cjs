#!/usr/bin/env node
/** Synthetic API/control-flow checks, not native layout, focus or font raster acceptance. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { environment, importFoundation } = require('./mock-kit.cjs');
const {
  buildFigmaVariables,
} = require('../../../scripts/build-figma-tokens.cjs');
const doc = buildFigmaVariables();
const DIR = path.resolve(__dirname, '..');
const copy = value => JSON.parse(JSON.stringify(value));
const runtime = ['kit-form-action-capabilities.js', 'kit-capabilities.js']
  .map(file => fs.readFileSync(path.join(DIR, file), 'utf8'))
  .join('\n');
const run = (env, source = doc, brand = 'undrr', script = runtime) =>
  env.runCode(
    `${script}\nreturn runMangroveCapabilityProbes(${JSON.stringify(source)},${JSON.stringify(brand)},'form-action-joining');`
  );
const cleanup = (env, report) =>
  env.runCode(
    `${runtime}\nreturn removeMangroveCapabilityProbes(${JSON.stringify(report)});`
  );
const identity = (node, key = 'mgCapabilityProbeId') =>
  node.getSharedPluginData('orgundrrmangrove', key);
const walk = node => [node, ...(node.children || []).flatMap(walk)];
async function setup(options = {}) {
  const env = environment(doc, options);
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
  // Explicitly bounded property and alias inheritance only. No geometry calculation.
  const scratch = env.figma.createFrame();
  const proto = Object.getPrototypeOf(scratch);
  scratch.remove();
  Object.defineProperty(proto, 'minWidth', {
    configurable: true,
    get() {
      return ['FRAME', 'COMPONENT', 'INSTANCE'].includes(this.type)
        ? (this._nativeMinWidth ?? null)
        : this._nativeMinWidth;
    },
    set(value) {
      if (['FRAME', 'COMPONENT', 'INSTANCE'].includes(this.type)) {
        if (value === 0)
          throw new Error(
            'in set_minWidth: minWidth cannot be set to 0, use null to unset'
          );
        assert(
          value === null || (Number.isFinite(value) && value > 0),
          'Native minWidth requires positive finite value or null'
        );
      }
      this._nativeMinWidth = value;
    },
  });
  const instanceAncestor = node => {
    for (let parent = node.parent; parent; parent = parent.parent)
      if (parent.type === 'INSTANCE') return parent;
    return null;
  };
  Object.defineProperty(proto, 'layoutMode', {
    configurable: true,
    get() {
      return this._observedLayoutMode || 'NONE';
    },
    set(value) {
      if (
        options.ignoreNestedRowMode &&
        this.name === 'Control/action row' &&
        instanceAncestor(this)
      )
        return;
      this._observedLayoutMode = value;
    },
  });
  // Bounded synthetic paragraph readbacks only, not a wrapping/layout engine.
  Object.defineProperty(proto, 'width', {
    configurable: true,
    get() {
      const consumer = instanceAncestor(this);
      if (
        this.type === 'TEXT' &&
        ['Label', 'Help', 'Error'].includes(this.name) &&
        consumer &&
        this.visible !== false
      ) {
        if (
          options.zeroVisibleParagraphWidth &&
          consumer.name.includes(' / 3 / ') &&
          ['Help', 'Error'].includes(this.name)
        )
          return 0;
        return consumer.width;
      }
      return this._observedWidth ?? 100;
    },
    set(value) {
      this._observedWidth = value;
    },
  });
  for (const field of ['layoutSizingHorizontal', 'layoutSizingVertical']) {
    const descriptor = Object.getOwnPropertyDescriptor(proto, field);
    Object.defineProperty(proto, field, {
      configurable: true,
      get() {
        if (
          this.type === 'TEXT' &&
          this.visible === false &&
          instanceAncestor(this)
        )
          return 'FIXED';
        return descriptor.get.call(this);
      },
      set(value) {
        descriptor.set.call(this, value);
      },
    });
  }
  const inheritedRectangle = node => {
    if (node.type !== 'RECTANGLE') return false;
    for (let parent = node.parent; parent; parent = parent.parent)
      if (parent.type === 'INSTANCE') return true;
    return false;
  };
  for (const field of ['x', 'y'])
    Object.defineProperty(proto, field, {
      configurable: true,
      get() {
        return this[`_nativePosition_${field}`] ?? 0;
      },
      set(value) {
        if (inheritedRectangle(this))
          throw new Error(
            `in set_${field}: This property cannot be overridden in an instance: relative-transform`
          );
        this[`_nativePosition_${field}`] = value;
      },
    });
  env.inheritedRingResizeCalls = 0;
  const resize = proto.resize;
  proto.resize = function (...args) {
    if (inheritedRectangle(this)) env.inheritedRingResizeCalls++;
    return resize.apply(this, args);
  };
  const instantiate = proto.createInstance;
  proto.createInstance = function () {
    const instance = instantiate.call(this);
    assert.strictEqual(
      identity(instance, 'mgKitId'),
      identity(this, 'mgKitId')
    );
    const sources = walk(this),
      targets = walk(instance);
    for (let i = 0; i < sources.length; i++) {
      targets[i].boundVariables = copy(sources[i].boundVariables);
      for (const field of [
        'topLeftRadius',
        'topRightRadius',
        'bottomLeftRadius',
        'bottomRightRadius',
        '_strokesIncludedInLayout',
      ])
        targets[i][field] = sources[i][field];
    }
    return instance;
  };
  const setProperties = proto.setProperties;
  proto.setProperties = function (values) {
    setProperties.call(this, values);
    for (const node of walk(this)) {
      const refs = node.componentPropertyReferences || {};
      if (refs.characters in values) node.characters = values[refs.characters];
      if (refs.visible in values) node.visible = values[refs.visible];
    }
  };
  return env;
}
const canonical = env =>
  copy({
    variables: env.state.variables.map(v => ({
      id: v.id,
      name: v.name,
      type: v.resolvedType,
      values: v.valuesByMode,
      data: v.sharedData,
    })),
    styles: env.state.styles.map(s => ({
      id: s.id,
      name: s.name,
      fontName: s.fontName,
      fontSize: s.fontSize,
      lineHeight: s.lineHeight,
      bindings: s.boundVariables,
      data: s.sharedData,
    })),
  });
async function main() {
  const historical = await setup();
  assert.strictEqual(
    (runtime.match(/(?:control|viewport)\.minWidth = null;/g) || []).length,
    2
  );
  const oldRuntime = runtime.replace(
    /(control|viewport)\.minWidth = null;/g,
    '$1.minWidth = 0;'
  );
  const oldFailure = await run(historical, doc, 'undrr', oldRuntime);
  assert.strictEqual(oldFailure.ledger.length, 17);
  assert(
    Object.values(oldFailure.tests).every(
      test =>
        test.status === 'error' &&
        test.errors.some(error => error.includes('minWidth cannot be set to 0'))
    )
  );
  assert(
    Object.values(oldFailure.tests).every(
      test => test.affectedNodeIds.length === 4
    )
  );
  const oldCleanup = await cleanup(historical, oldFailure);
  assert.deepStrictEqual(copy(oldCleanup.errors), []);
  assert.strictEqual(oldCleanup.removedNodeIds.length, 17);
  console.log(
    'ok  native-discovered zero minimum reproduces exact17-node partial failure and restart cleanup'
  );
  const positioning = await setup();
  const masterOnlyGuard = "if (node.type !== 'INSTANCE') {";
  assert.strictEqual(runtime.split(masterOnlyGuard).length - 1, 1);
  const oldPositioning = runtime.replace(masterOnlyGuard, 'if (true) {');
  const positioningFailure = await run(
    positioning,
    doc,
    'undrr',
    oldPositioning
  );
  assert.strictEqual(positioningFailure.ledger.length, 113);
  assert(
    Object.values(positioningFailure.tests).every(
      test =>
        test.status === 'error' &&
        test.observations.length === 0 &&
        test.errors.some(error => error.includes('relative-transform'))
    )
  );
  assert(
    Object.values(positioningFailure.tests).every(
      test => test.affectedNodeIds.length === 28
    )
  );
  assert.strictEqual(positioning.inheritedRingResizeCalls, 4);
  const positioningCleanup = await cleanup(positioning, positioningFailure);
  assert.deepStrictEqual(copy(positioningCleanup.errors), []);
  assert.strictEqual(positioningCleanup.removedNodeIds.length, 113);
  console.log(
    'ok  inherited relative-transform rejection reproduces exact113-node partial report and restart cleanup'
  );
  const env = await setup();
  const foundationBefore = canonical(env);
  const report = await run(env);
  assert.deepStrictEqual(copy(report.errors), []);
  assert.strictEqual(report.scope, 'form-action-joining');
  assert.strictEqual(
    env.inheritedRingResizeCalls,
    0,
    'consumer focus rectangle resize is forbidden'
  );
  assert.deepStrictEqual(
    copy(report.preflight.formActionJoining.minimumInlineSize),
    {
      css: 0,
      native: null,
      representation: 'Native minimum unset; not a zero-valued binding.',
    }
  );
  assert.strictEqual(
    Object.keys(report.preflight.formActionJoining.roleIds).length,
    35
  );
  assert.strictEqual(report.formActionJoining.fixtureCount, 4);
  assert.strictEqual(
    report.formActionJoining.sharedStyleAssociationSatisfied,
    false
  );
  assert.strictEqual(
    report.formActionJoining.ordinaryCanonicalAcceptance,
    false
  );
  assert.strictEqual(
    new Set(report.ledger.map(n => n.id)).size,
    report.ledger.length
  );
  const masters = env.state.nodes.values();
  for (const master of masters)
    if (master.type === 'COMPONENT' && identity(master) === report.runId)
      assert(/capability\//.test(identity(master, 'mgKitId')));
  for (const entry of report.ledger)
    assert.strictEqual(identity(env.state.nodes.get(entry.id)), report.runId);
  const totals = Object.values(report.tests).map(
    test => test.affectedNodeIds.length
  );
  assert(totals.every(n => n === totals[0]));
  assert.strictEqual(
    report.ledger.length,
    1 + totals.reduce((a, b) => a + b, 0)
  );
  for (const test of Object.values(report.tests)) {
    assert.strictEqual(test.status, 'observed', JSON.stringify(test.errors));
    assert.deepStrictEqual(copy(test.errors), []);
    assert.strictEqual(
      test.supported,
      false,
      'synthetic mocks cannot establish visual support'
    );
    assert.strictEqual(test.findings.visualFocusOcclusionVerified, false);
    const first = test.observations[0];
    for (const observation of test.observations) {
      assert.strictEqual(
        observation.mainComponentId,
        observation.expectedMainComponentId
      );
      assert.strictEqual(observation.semanticOrderPreserved, true);
      assert.strictEqual(observation.consumer.clipsContent, false);
      assert.strictEqual(observation.control.clipsContent, false);
      assert.strictEqual(observation.viewport.clipsContent, true);
      assert.strictEqual(observation.control.minWidth, null);
      assert.strictEqual(observation.viewport.minWidth, null);
      assert.strictEqual(
        observation.fields.Value.textAutoResize,
        'WIDTH_AND_HEIGHT'
      );
      assert.strictEqual(observation.fields.Value.horizontal, 'HUG');
      assert.strictEqual(observation.fields.Action.horizontal, 'HUG');
      assert.strictEqual(observation.editedCharactersPreserved, true);
      assert.strictEqual(observation.sourceTypographyAndAliasesMatch, true);
      assert.strictEqual(observation.effectiveTextPaintsMatch, true);
      assert.strictEqual(observation.rings.length, 4);
      assert(
        observation.ringGeometrySource.includes('no consumer resize/x/y writes')
      );
      for (const [index, ring] of observation.rings.entries()) {
        assert.deepStrictEqual(copy(ring.constraints), {
          horizontal: 'STRETCH',
          vertical: 'STRETCH',
        });
        assert.strictEqual(ring.x, index % 2 === 0 ? 0 : -2);
        assert.strictEqual(ring.y, index % 2 === 0 ? 0 : -2);
      }
      assert.notStrictEqual(
        observation.consumer.mgKitId,
        identity(env.state.nodes.get(observation.mainComponentId), 'mgKitId')
      );
      for (const [name, field] of Object.entries(observation.fields)) {
        assert.strictEqual(field.bindingMatches, true);
        assert.strictEqual(field.propertyId, first.fields[name].propertyId);
        assert.strictEqual(field.id, first.fields[name].id);
        assert.strictEqual(field.mgKitId, first.fields[name].mgKitId);
        assert(
          field.boundVariables.fontFamily && field.boundVariables.fontSize
        );
        assert.strictEqual(field.textStyleId, '');
        assert.strictEqual(field.fontName.family, 'Roboto');
        assert.strictEqual(
          field.fontName.style,
          name === 'Action' ? 'Bold' : 'Regular'
        );
      }
      if (observation.phase.startsWith('after private'))
        assert.strictEqual(observation.repeatIdentityAndEditsPreserved, true);
    }
  }
  const search = report.tests.formActionSearch.observations;
  assert.strictEqual(search[0].fields.Label.visible, false);
  assert.strictEqual(search[0].fields.Help.visible, false);
  assert.strictEqual(search[0].fields.Label.horizontal, 'FIXED');
  assert.strictEqual(search[0].fields.Label.vertical, 'FIXED');
  assert(search.every(observation => observation.sourceGeometry.paragraphsHug));
  assert.deepStrictEqual(
    copy(
      search[2].rings
        .filter(r => r.visible)
        .map(r => r.mgKitId.split('/').slice(-2).join('/'))
    ),
    ['control/separator', 'control/focus']
  );
  assert.strictEqual(search[2].row.itemReverseZIndex, true);
  assert.strictEqual(search[3].row.itemReverseZIndex, false);
  assert.strictEqual(search[0].row.itemSpacing, -1);
  assert.strictEqual(search[0].control.corners.join(','), '5,0,5,0');
  assert.strictEqual(search[0].action.corners.join(','), '0,5,0,5');
  const growth = report.tests.formActionGrowth.observations;
  assert.strictEqual(
    growth[1].fields.Value.characters,
    doc.capabilities.formActionJoining.cases.labels.Long.value
  );
  assert.strictEqual(
    growth[1].fields.Value.rangePaints[0].sourceRole,
    'component/text-input/browser-fieldtext'
  );
  const disabled = report.tests.formActionErrorDisabled.observations;
  assert.strictEqual(
    disabled[0].control.strokes[0].sourceRole,
    'form-input/border-color'
  );
  assert.strictEqual(disabled[2].action.opacity, 1);
  assert.strictEqual(
    disabled[2].action.fills[0].sourceRole,
    'color/button-background'
  );
  assert.strictEqual(
    disabled[3].fields.Value.rangePaints[0].sourceRole,
    'color/neutral-400'
  );
  assert.strictEqual(disabled.at(-1).fields.Help.visible, false);
  assert.strictEqual(disabled.at(-1).fields.Error.visible, false);
  const stacked = report.tests.formActionStacked.observations;
  assert.deepStrictEqual(
    copy(stacked.slice(0, 4).map(o => o.sourceViewport)),
    [480, 480, 481, 480]
  );
  assert.strictEqual(stacked[0].row.itemSpacing, 5);
  assert.strictEqual(stacked[0].action.horizontal, 'FILL');
  assert.strictEqual(stacked[0].control.corners.join(','), '5,5,5,5');
  assert.strictEqual(stacked[2].row.itemSpacing, -1);
  assert.deepStrictEqual(canonical(env), foundationBefore);
  const removed = await cleanup(env, report);
  assert.deepStrictEqual(copy(removed.errors), []);
  assert.strictEqual(removed.removedNodeIds.length, report.ledger.length);
  console.log(
    `ok  four explicit ${report.ledger.length}-node raw fixtures, independent native property keys, inherited source identities, source typography/range paints and restart cleanup; layout remains synthetic`
  );

  const ignoredMode = await setup({ ignoreNestedRowMode: true });
  const ignoredModeReport = await run(ignoredMode);
  const ignoredJoined =
    ignoredModeReport.tests.formActionStacked.observations.find(
      observation => observation.phase === 'Viewport481 joined390'
    );
  assert.strictEqual(ignoredJoined.expectedView.stacked, false);
  assert.strictEqual(ignoredJoined.row.layoutMode, 'VERTICAL');
  assert.strictEqual(ignoredJoined.row.itemSpacing, -1);
  assert.strictEqual(
    ignoredJoined.sourceGeometry.rowModeAxesAndSpacingMatch,
    false
  );
  assert.strictEqual(
    ignoredModeReport.tests.formActionStacked.findings.allPhaseGeometry,
    false
  );
  assert.strictEqual(
    ignoredModeReport.tests.formActionStacked.supportedGeometryAndBindings,
    false
  );
  const ignoredCleanup = await cleanup(ignoredMode, ignoredModeReport);
  assert.deepStrictEqual(copy(ignoredCleanup.errors), []);
  assert.strictEqual(ignoredCleanup.removedNodeIds.length, 113);
  const collapsed = await setup({ zeroVisibleParagraphWidth: true });
  const collapsedReport = await run(collapsed);
  const collapsedPhases =
    collapsedReport.tests.formActionStacked.observations.filter(
      observation =>
        observation.phase === 'Stacked long editable paragraphs240' ||
        observation.phase === 'edited before diagnostic reapplications' ||
        observation.phase.startsWith('after private')
    );
  assert.strictEqual(collapsedPhases.length, 4);
  for (const phase of collapsedPhases) {
    assert.strictEqual(phase.fields.Label.width, phase.consumer.width);
    for (const name of ['Help', 'Error']) {
      assert.strictEqual(phase.fields[name].visible, true);
      assert.strictEqual(phase.fields[name].width, 0);
      assert.strictEqual(phase.fields[name].horizontal, 'FILL');
      assert.strictEqual(phase.fields[name].vertical, 'HUG');
      assert.strictEqual(phase.fields[name].textAutoResize, 'HEIGHT');
    }
    assert.strictEqual(phase.sourceGeometry.paragraphsHug, false);
  }
  assert.strictEqual(
    collapsedReport.tests.formActionStacked.findings.allPhaseGeometry,
    false
  );
  assert.strictEqual(
    collapsedReport.tests.formActionStacked.supportedGeometryAndBindings,
    false
  );
  const collapsedCleanup = await cleanup(collapsed, collapsedReport);
  assert.deepStrictEqual(copy(collapsedCleanup.errors), []);
  assert.strictEqual(collapsedCleanup.removedNodeIds.length, 113);
  console.log(
    'ok  hidden fixed paragraphs excluded; ignored row mode and visible zero-width paragraphs remain unsupported with exact cleanup'
  );

  const changes = [
    value => {
      value.capabilities.formActionJoining.version = 2;
    },
    value => {
      value.capabilities.formActionJoining.sourceRefs[0].normalizedSha256 =
        'changed';
    },
    value => {
      value.capabilities.formActionJoining.roles.controlBorder.type = 'COLOR';
    },
    value => {
      value.capabilities.formActionJoining.brands.undrr.geometry.seam = -2;
    },
    value => {
      value.capabilities.formActionJoining.brands.undrr.paints.actionHtmlDisabled.opacity = 0.55;
    },
    value => {
      value.capabilities.formActionJoining.stackViewport.maxPx = 481;
    },
    value => {
      value.capabilities.formActionJoining.cases.views[240].Long.actionWidth =
        null;
    },
    value => {
      value.capabilities.formActionJoining.brands.undrr.typography.help.lineHeight.value = 12.5;
    },
  ];
  for (const change of changes) {
    const source = copy(doc);
    change(source);
    const rejection = await setup();
    const before = [...rejection.state.nodes.keys()];
    const result = await run(rejection, source);
    assert(result.errors.length);
    assert.strictEqual(result.rootId, null);
    assert.strictEqual(result.ledger.length, 0);
    assert.deepStrictEqual([...rejection.state.nodes.keys()], before);
  }
  const foreignBrand = await setup();
  const rejectedBrand = await run(foreignBrand, doc, 'mcr');
  assert(rejectedBrand.errors.length);
  assert.strictEqual(rejectedBrand.rootId, null);
  for (const alter of [
    env => {
      env.state.variables.find(
        v => v.name === 'form-input/padding'
      ).valuesByMode[env.state.collections[0].modes[0].modeId] = 999;
    },
    env => {
      env.state.styles.find(
        s => identity(s, 'mgStyleId') === 'component.input'
      ).boundVariables.fontFamily = [];
    },
    env => {
      env.state.rejectedFonts.add('Roboto Bold');
    },
  ]) {
    const rejected = await setup();
    alter(rejected);
    const before = [...rejected.state.nodes.keys()];
    const result = await run(rejected);
    assert(result.errors.length);
    assert.strictEqual(result.rootId, null);
    assert.deepStrictEqual([...rejected.state.nodes.keys()], before);
  }
  console.log(
    'ok  malformed source/hash/35-role/mode/native/font preflight rejects before root creation'
  );

  const partial = await setup();
  let calls = 0;
  const createText = partial.figma.createText;
  partial.figma.createText = () => {
    if (++calls === 3) throw new Error('Injected third text creation failure');
    return createText();
  };
  const broken = await run(partial);
  assert.strictEqual(broken.tests.formActionSearch.status, 'error');
  assert(
    broken.tests.formActionSearch.errors.some(e => e.includes('Injected'))
  );
  assert(broken.tests.formActionSearch.affectedNodeIds.length > 0);
  assert(broken.ledger.length > 1);
  assert.deepStrictEqual(copy(broken.unrecordedDescendantIds || []), []);
  const clean = await cleanup(partial, broken);
  assert.deepStrictEqual(copy(clean.errors), []);
  assert.strictEqual(clean.removedNodeIds.length, broken.ledger.length);
  console.log(
    'ok  partial construction preserves exact ledger and restart cleanup removes only recorded temporary nodes'
  );

  const guarded = await setup();
  const owned = await run(guarded);
  const root = guarded.state.nodes.get(owned.rootId);
  const outsider = guarded.figma.createFrame();
  root.appendChild(outsider);
  const refusal = await cleanup(guarded, owned);
  assert(refusal.errors.length);
  assert(guarded.state.nodes.has(root.id));
  assert(guarded.state.nodes.has(outsider.id));
  outsider.remove();
  const moved = guarded.state.nodes.get(
    owned.ledger.find(e => e.type === 'INSTANCE').id
  );
  guarded.figma.currentPage.appendChild(moved);
  const movedRefusal = await cleanup(guarded, owned);
  assert(movedRefusal.errors.length);
  assert(guarded.state.nodes.has(root.id));
  root.appendChild(moved);
  const success = await cleanup(guarded, owned);
  assert.deepStrictEqual(copy(success.errors), []);
  console.log(
    'ok  foreign additions and moved owned instances conservatively refuse deletion without canonical or foreign mutation'
  );
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
