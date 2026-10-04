#!/usr/bin/env node
/** Independent saved-report checks for private Form Action optional Experiment A. No Figma writes. */
'use strict';
const fs = require('fs');
const path = require('path');
const util = require('util');
const REPO = path.resolve(__dirname, '../../..');
const {
  buildFormActionCapability,
} = require('../../../scripts/figma-form-action-probe.cjs');

const EDIT_PHASES = [
  'short hidden390',
  'short hidden240',
  'long edit while hidden240',
  'hidden then edit then show240',
  'show before short text240',
  'show then edit short240',
  'hidden edit resize then show390',
  'empty but visible diagnostic390',
  'empty hide nonempty show390',
  'restored short only help240',
  'restored short only error240',
  'final long edited240',
  'before private-master reapplications',
  'after private-master reapplication 1',
  'after private-master reapplication 2',
];
const COHORT_PHASES = {
  edited: EDIT_PHASES,
  fresh0: [
    'initial fresh defaults390',
    'before private-master reapplications',
    'after private-master reapplication 1',
    'after private-master reapplication 2',
  ],
  fresh1: [
    'new fresh after reapplication 1',
    'after private-master reapplication 2',
  ],
  fresh2: ['new fresh after reapplication 2'],
};

function verify({
  report,
  document: doc,
  before = null,
  after = null,
  cleanup = null,
}) {
  validateTopology(report, doc, before, after, cleanup);
  const packet = buildFormActionCapability({
    root: REPO,
    modes: doc.modes,
    variables: doc.variables,
    styles: doc.styles,
  });
  const source = packet.brands.undrr,
    g = source.geometry;
  const failures = [],
    checks = [];
  function check(label, actual, expected, tolerance = 0) {
    const pass = tolerance
      ? typeof actual === 'number' &&
        Number.isFinite(actual) &&
        Math.abs(actual - expected) <= tolerance
      : util.isDeepStrictEqual(actual, expected);
    checks.push({ label, pass });
    if (!pass) failures.push({ label, actual, expected, tolerance });
  }
  function sourceEqual(a, b) {
    if (typeof b === 'number')
      return (
        typeof a === 'number' && Number.isFinite(a) && Math.abs(a - b) <= 1e-6
      );
    if (Array.isArray(b))
      return (
        Array.isArray(a) &&
        a.length === b.length &&
        b.every((v, i) => sourceEqual(a[i], v))
      );
    if (b && typeof b === 'object')
      return (
        !!a &&
        typeof a === 'object' &&
        Object.keys(a).length === Object.keys(b).length &&
        Object.keys(b).every(k => sourceEqual(a[k], b[k]))
      );
    return a === b;
  }
  const assets = snapshot => [
    ...snapshot.nodes,
    ...snapshot.variables,
    ...snapshot.collections,
    ...snapshot.styles.text,
    ...snapshot.styles.effect,
  ];
  const original = new Map(before ? assets(before).map(a => [a.id, a]) : []);
  const vars = new Map((before?.variables || []).map(v => [v.id, v]));
  const collection = before?.collections.find(c => c.name === doc.collection);
  const modeId = collection?.modes.find(m => m.name === 'UNDRR')?.modeId;
  function resolve(id, type, seen = new Set()) {
    if (seen.has(id)) throw Error('Saved native alias cycle');
    seen.add(id);
    const v = vars.get(id);
    if (
      !v ||
      v.resolvedType !== type ||
      v.variableCollectionId !== collection.id
    )
      throw Error('Missing/foreign/wrong-type saved alias ' + id);
    const result = v.valuesByMode[modeId];
    return result?.type === 'VARIABLE_ALIAS'
      ? resolve(result.id, type, seen)
      : result;
  }
  const roleIds = Object.fromEntries(
    Object.entries(packet.roles).map(([key, role]) => {
      if (!before) {
        const observed = report.preflight.formActionJoining.roleIds[key];
        check(`role/${key}/sourceType`, observed.type, role.type);
        check(
          `role/${key}/sourceIdentity`,
          { id: observed.sourceId, name: observed.name },
          { id: role.id, name: role.name }
        );
        check(
          `role/${key}/observedValue`,
          sourceEqual(observed.expected, source.resolvedRoles[key]),
          true
        );
        return [key, observed.id];
      }
      const found = before.variables.filter(
        v => v.mgId === role.id && v.name === role.name
      );
      check(`role/${key}/identityCount`, found.length, 1);
      const native = found[0];
      check(`role/${key}/type`, native?.resolvedType, role.type);
      check(
        `role/${key}/collection`,
        native?.variableCollectionId,
        collection.id
      );
      if (native)
        check(
          `role/${key}/sourceValue`,
          sourceEqual(resolve(native.id, role.type), source.resolvedRoles[key]),
          true
        );
      return [key, native?.id];
    })
  );
  const byName = Object.fromEntries(
    Object.entries(packet.roles).map(([key, r]) => [r.name, key])
  );
  const alias = value =>
    Array.isArray(value) && value.length === 1 ? value[0] : value;
  const bound = (value, key, label) =>
    check(label, alias(value), { type: 'VARIABLE_ALIAS', id: roleIds[key] });
  function boundStroke(node, key, label) {
    if (node.boundVariables?.strokeWeight !== undefined)
      bound(node.boundVariables.strokeWeight, key, label + '/uniform');
    else
      for (const field of [
        'strokeTopWeight',
        'strokeBottomWeight',
        'strokeLeftWeight',
        'strokeRightWeight',
      ])
        bound(node.boundVariables?.[field], key, label + '/' + field);
  }
  function paint(paints, roleName, label, emptyAllowed = false) {
    if (emptyAllowed && (!paints || paints.length === 0)) return;
    check(label + '/count', paints?.length, 1);
    const actual = paints?.[0];
    if (!actual) return;
    const key = byName[roleName],
      wanted = source.resolvedRoles[key];
    if (!key) throw Error('Unknown requested role ' + roleName);
    check(label + '/rawAlias', actual.paint?.boundVariables?.color, {
      type: 'VARIABLE_ALIAS',
      id: roleIds[key],
    });
    check(label + '/variableId', actual.variableId, roleIds[key]);
    check(label + '/resolved', sourceEqual(actual.resolved, wanted), true);
    check(label + '/type', actual.paint?.type, 'SOLID');
    check(label + '/visible', actual.paint?.visible !== false, true);
    check(label + '/opacity', actual.paint?.opacity ?? 1, wanted.a);
  }
  function lineHeight(actual, wanted, label) {
    check(label + '/unit', actual?.unit, wanted.unit);
    check(
      label + '/representation',
      actual?.value === wanted.value ||
        (wanted.unit === 'PERCENT' &&
          actual?.value === Math.fround(wanted.value / 100) * 100),
      true
    );
  }
  if (before)
    check('baselineAssetUnique', original.size, assets(before).length);
  check('kind', report.kind, 'mangrove-native-capability-probes');
  check('brand', report.brandId, 'undrr');
  check('reportErrors', report.errors, []);
  const sourceReport = report.formActionOptional,
    pre = report.preflight?.formActionOptional;
  check('experiment', sourceReport?.experiment, 'A');
  check('fixedLayouts', sourceReport?.fixedLayouts, true);
  check(
    'layoutSwitchingNotClaimed',
    sourceReport?.layoutSwitchingTested,
    false
  );
  check(
    'canonicalNotClaimed',
    sourceReport?.ordinaryCanonicalAcceptance,
    false
  );
  check(
    'sharedAssociationNotClaimed',
    sourceReport?.sharedStyleAssociationSatisfied,
    false
  );
  check('preflight/experiment', pre?.experiment, 'A');
  check('preflight/layouts', pre?.variantLayouts, ['Joined', 'Stacked']);
  const keys = sourceReport?.propertyKeys || {},
    names = ['Label', 'Value', 'Action', 'Help', 'Error'],
    optional = ['Label', 'Help', 'Error'],
    boolNames = optional.map(n => 'Show ' + n.toLowerCase()),
    types = Object.fromEntries([
      ...names.map(n => [n, 'TEXT']),
      ...boolNames.map(n => [n, 'BOOLEAN']),
    ]);
  check('preflight/propertyTypes', pre?.propertyTypes, types);
  check(
    'propertyKeys/names',
    Object.keys(keys).sort(),
    Object.keys(types).sort()
  );
  check('propertyKeys/unique', new Set(Object.values(keys)).size, 8);
  for (const ref of packet.sourceRefs.filter(r => r.normalizedSha256))
    check(
      'sourceHash/' + ref.file,
      report.preflight?.formActionJoining?.sourceRefs
        ?.filter(r => r.file === ref.file && r.normalizedSha256)
        .map(r => r.normalizedSha256),
      [ref.normalizedSha256]
    );
  for (const [key, r] of Object.entries(packet.roles))
    check(
      'preflight/role/' + key,
      report.preflight?.formActionJoining?.roleIds?.[key],
      {
        id: roleIds[key],
        sourceId: r.id,
        name: r.name,
        type: r.type,
        expected: source.resolvedRoles[key],
      }
    );
  function sourceValue(def, mode, seen = new Set()) {
    if (seen.has(def.id)) throw Error('Source alias cycle');
    seen.add(def.id);
    const value = def.values[mode];
    if (!value?.alias) return value;
    const matches = doc.variables.filter(
      v => v.name === value.alias && v.type === def.type
    );
    if (matches.length !== 1) throw Error('Source alias type/identity');
    return sourceValue(matches[0], mode, seen);
  }
  for (const mode of doc.modes)
    for (const [key, r] of Object.entries(packet.roles)) {
      const d = doc.variables.find(v => v.id === r.id && v.name === r.name);
      check('sourceMode/' + mode.id + '/' + key + '/type', d?.type, r.type);
      if (d)
        check(
          'sourceMode/' + mode.id + '/' + key + '/value',
          sourceEqual(
            sourceValue(d, mode.id),
            packet.brands[mode.id].resolvedRoles[key]
          ),
          true
        );
    }
  const nativeFonts = {};
  for (const [kind, id] of [
    ['input', 'component.input'],
    ['action', 'component.button'],
  ]) {
    const observed = pre.fontTemplates.filter(t => t.sourceStyleId === id);
    check('fontTemplate/' + kind + '/observedUnique', observed.length, 1);
    const found = before
      ? before.styles.text.filter(s => s.mgStyleId === id)
      : observed.map(t => ({ id: t.nativeId, ...t }));
    check('fontTemplate/' + kind + '/unique', found.length, 1);
    const style = found[0];
    const exported = doc.styles.text.filter(s => s.id === id);
    check('fontTemplate/' + kind + '/sourceUnique', exported.length, 1);
    check(
      'fontTemplate/' + kind + '/sourceFontFamily',
      style.fontName.family,
      exported[0].values.undrr.fontName.family
    );
    check(
      'fontTemplate/' + kind + '/sourceFontFace',
      style.fontName.style,
      exported[0].values.undrr.fontName.style
    );
    nativeFonts[kind] = style.fontName;
    check(
      'fontTemplate/' + kind + '/fullFontLoaded',
      report.fonts?.loaded?.some(f =>
        util.isDeepStrictEqual(f, style.fontName)
      ),
      true
    );
    check(
      'fontTemplate/' + kind + '/readback',
      pre?.fontTemplates?.find(t => t.sourceStyleId === id),
      {
        sourceStyleId: id,
        nativeId: style.id,
        fontName: style.fontName,
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        boundVariables: style.boundVariables,
      }
    );
  }
  const ledger = report.ledger?.map(x => x.id) || [],
    ledgerSet = new Set(ledger);
  check('ledger/count', ledger.length, 172);
  check('ledger/unique', ledgerSet.size, ledger.length);
  check('ledger/root', ledgerSet.has(report.rootId), true);
  check(
    'ledger/excludesCanonical',
    ledger.filter(id => original.has(id)),
    []
  );
  check('ledger/unrecorded', report.unrecordedDescendantIds, []);
  check('ledger/refreshErrors', report.ledgerRefresh?.errors, []);
  check(
    'ledger/refreshUnrecorded',
    report.ledgerRefresh?.unrecordedNodeIds,
    []
  );
  const kinds = {
      Label: 'label',
      Value: 'input',
      Action: 'action',
      Help: 'help',
      Error: 'error',
    },
    short = packet.cases.labels.Subscribe,
    long = packet.cases.labels.Long,
    error = 'Enter a valid email address.';
  const defaults = {
      Label: short.label,
      Value: short.placeholder,
      Action: short.action,
      Help: short.help,
      Error: error,
      'Show label': true,
      'Show help': false,
      'Show error': false,
    },
    longCopy = {
      Label: long.label,
      Value: long.value,
      Action: long.action,
      Help: long.help,
      Error: error,
      'Show label': true,
      'Show help': true,
      'Show error': true,
    };
  function state(cohort, phase) {
    if (cohort !== 'edited')
      return { copy: defaults, width: 390, role: 'placeholder' };
    if (phase === 'short hidden390' || phase === 'short hidden240')
      return {
        copy: { ...defaults, 'Show label': false },
        width: phase.endsWith('390') ? 390 : 240,
        role: 'placeholder',
      };
    if (phase === 'long edit while hidden240')
      return {
        copy: {
          ...longCopy,
          'Show label': false,
          'Show help': false,
          'Show error': false,
        },
        width: 240,
        role: 'inputValue',
      };
    if (phase === 'show then edit short240')
      return {
        copy: { ...longCopy, Help: short.help },
        width: 240,
        role: 'inputValue',
      };
    if (phase === 'empty but visible diagnostic390')
      return {
        copy: { ...longCopy, Help: '', Error: '' },
        width: 390,
        role: 'inputValue',
      };
    if (phase === 'restored short only help240')
      return {
        copy: { ...defaults, 'Show help': true },
        width: 240,
        role: 'placeholder',
      };
    if (phase === 'restored short only error240')
      return {
        copy: { ...defaults, 'Show error': true },
        width: 240,
        role: 'placeholder',
      };
    return {
      copy: longCopy,
      width: phase.endsWith('390') ? 390 : 240,
      role: 'inputValue',
    };
  }
  function typography(n, name, label) {
    const kind = kinds[name],
      wanted = source.typography[kind];
    check(
      label + '/fullFont',
      n.fontName,
      nativeFonts[kind === 'action' ? 'action' : 'input']
    );
    check(label + '/size', n.fontSize, wanted.fontSize);
    lineHeight(n.lineHeight, wanted.lineHeight, label + '/lineHeight');
    if (n.textStyleId !== undefined)
      check(label + '/diagnosticStyleEmpty', n.textStyleId, '');
    bound(n.boundVariables?.fontFamily, 'fontFamily', label + '/fontFamily');
    bound(
      n.boundVariables?.fontSize,
      kind === 'action'
        ? 'actionFontSize'
        : kind === 'input'
          ? 'inputFontSize'
          : kind === 'help'
            ? 'helpFontSize'
            : 'bodyFontSize',
      label + '/fontSizeAlias'
    );
  }
  function optionalBox(w, n, width, label, visible) {
    check(label + '/wrapperVisible', w.visible, visible);
    check(label + '/textVisible', n.visible, true);
    check(label + '/wrapperTransparent', w.fills, []);
    check(label + '/wrapperPadding', w.padding, [0, 0, 0, 0]);
    check(label + '/wrapperGap', w.itemSpacing, 0);
    check(label + '/wrapperMode', w.layoutMode, 'VERTICAL');
    check(label + '/wrapperClip', w.clipsContent, false);
    check(
      label + '/textNoVisibleReference',
      n.propertyReferences?.visible,
      undefined
    );
    if (visible) {
      check(label + '/positiveWidth', w.width > 0 && n.width > 0, true);
      check(label + '/wrapperWidth', w.width, width, 1e-6);
      check(label + '/textWidth', n.width, width, 1e-6);
      check(label + '/wrapperHorizontal', w.horizontal, 'FILL');
      check(label + '/wrapperVertical', w.vertical, 'HUG');
      check(label + '/textHorizontal', n.horizontal, 'FILL');
      check(label + '/textVertical', n.vertical, 'HUG');
      check(label + '/textAutoResize', n.textAutoResize, 'HEIGHT');
      if (n.characters.length)
        check(label + '/nonemptyPositiveHeight', n.height > 0, true);
    }
  }
  const init = sourceReport?.sourceInitialization || [];
  check(
    'initialization/layouts',
    init.map(i => i.layout),
    ['Joined', 'Stacked']
  );
  for (const i of init) {
    const label = 'initialization/' + i.layout;
    check(label + '/width', i.width, 390);
    check(label + '/masterID', i.masterId, sourceReport.masterIds?.[i.layout]);
    for (const n of optional) {
      const f = i.fields[n];
      if (!f) {
        check(label + '/' + n + '/present', false, true);
        continue;
      }
      optionalBox(f.wrapper, f.text, 390, label + '/' + n, true);
      check(label + '/' + n + '/text', f.text.characters, defaults[n]);
      check(
        label + '/' + n + '/reference',
        f.text.propertyReferences?.characters,
        keys[n]
      );
      typography(f.text, n, label + '/' + n);
      paint(
        f.text.rangePaints,
        n === 'Label'
          ? source.paints.label
          : n === 'Help'
            ? source.paints.help
            : source.paints.errorText.text,
        label + '/' + n + '/range'
      );
    }
  }
  const test = report.tests?.formActionOptionalA,
    observations = test?.observations || [];
  check('test/errors', test?.errors, []);
  check('observation/count', observations.length, 44);
  check('set/ledger', ledgerSet.has(sourceReport?.setId), true);
  check(
    'set/type',
    report.ledger?.find(l => l.id === sourceReport?.setId)?.type,
    'COMPONENT_SET'
  );
  for (const l of ['Joined', 'Stacked']) {
    check(
      'master/' + l + '/ledger',
      ledgerSet.has(sourceReport?.masterIds?.[l]),
      true
    );
    check(
      'master/' + l + '/type',
      report.ledger?.find(n => n.id === sourceReport?.masterIds?.[l])?.type,
      'COMPONENT'
    );
  }
  const cohorts = sourceReport?.cohorts || [];
  check('cohort/count', cohorts.length, 8);
  check('cohort/unique', new Set(cohorts.map(c => c.id)).size, 8);
  const seenFieldIDs = new Set(),
    seenWrapperIDs = new Set(),
    byConsumer = new Map();
  for (const c of cohorts) {
    const os = observations.filter(o => o.consumer.id === c.id);
    check(
      'cohort/' + c.cohort + '/' + c.layout + '/phases',
      os.map(o => o.phase),
      COHORT_PHASES[c.cohort]
    );
    check(
      'cohort/' + c.id + '/main',
      c.mainId,
      sourceReport.masterIds?.[c.layout]
    );
    check('cohort/' + c.id + '/ledger', ledgerSet.has(c.id), true);
    byConsumer.set(c.id, os);
  }
  function exactConsumer(o) {
    return {
      consumer: o.consumer,
      properties: o.properties,
      propertyKeys: o.propertyKeys,
      main: o.mainComponentId,
      row: o.row,
      control: o.control,
      viewport: o.viewport,
      action: o.action,
      rings: o.rings,
      fields: Object.fromEntries(
        Object.entries(o.fields).map(([n, f]) => [
          n,
          Object.fromEntries(
            Object.entries(f).filter(
              ([k]) =>
                ![
                  'typographyMatches',
                  'aliasesMatch',
                  'expectedCharacters',
                ].includes(k)
            )
          ),
        ])
      ),
    };
  }
  for (const o of observations) {
    const label = o.cohort + '/' + o.layout + '/' + o.phase,
      c = cohorts.find(c => c.id === o.consumer.id),
      wanted = state(o.cohort, o.phase),
      stacked = o.layout === 'Stacked',
      first = byConsumer.get(o.consumer.id)?.[0];
    if (!c) {
      check(label + '/knownConsumer', false, true);
      continue;
    }
    check(label + '/main', o.mainComponentId, c.mainId);
    check(label + '/expectedMain', o.expectedMainComponentId, c.mainId);
    check(label + '/set', o.setId, sourceReport.setId);
    check(label + '/keys', o.propertyKeys, keys);
    check(label + '/layoutVariant', o.properties.Layout?.type, 'VARIANT');
    check(label + '/layoutVariantValue', o.properties.Layout?.value, o.layout);
    check(
      label + '/consumerKey',
      o.consumer.mgKitId,
      'capability/' +
        report.runId +
        '/form-action-optional/consumer/' +
        o.cohort +
        '/' +
        o.layout +
        '/' +
        o.consumer.id
    );
    check(label + '/width', o.consumer.width, wanted.width, 1e-6);
    check(label + '/horizontal', o.consumer.horizontal, 'FIXED');
    check(label + '/vertical', o.consumer.vertical, 'HUG');
    check(label + '/sourceViewport', o.sourceViewport, stacked ? 480 : 481);
    check(
      label + '/rowMode',
      o.row.layoutMode,
      stacked ? 'VERTICAL' : 'HORIZONTAL'
    );
    check(
      label + '/rowGap',
      o.row.itemSpacing,
      stacked ? g.stackGap : g.seam,
      1e-6
    );
    check(label + '/rowHorizontal', o.row.horizontal, 'FILL');
    check(label + '/rowVertical', o.row.vertical, 'HUG');
    check(label + '/rowWidth', o.row.width, wanted.width, 1e-6);
    check(label + '/semanticOrder', o.row.childIds, [
      o.control.id,
      o.action.id,
    ]);
    check(label + '/sourceRootGap', o.consumer.itemSpacing, g.gap);
    bound(
      o.consumer.boundVariables?.itemSpacing,
      'gap',
      label + '/rootGapAlias'
    );
    check(label + '/controlHeight', o.control.height, g.controlHeight);
    bound(
      o.control.boundVariables?.height,
      'controlHeight',
      label + '/controlHeightAlias'
    );
    check(label + '/valueClips', o.viewport.clipsContent, true);
    check(label + '/controlMinWidth', o.control.minWidth, null);
    check(label + '/viewportMinWidth', o.viewport.minWidth, null);
    check(
      label + '/valueSingleLine',
      o.fields.Value.textAutoResize,
      'WIDTH_AND_HEIGHT'
    );
    check(label + '/valueHug', o.fields.Value.horizontal, 'HUG');
    check(label + '/actionMinHeight', o.action.minHeight, g.actionMinHeight);
    check(
      label + '/actionSizing',
      o.action.horizontal,
      stacked ? 'FILL' : 'HUG'
    );
    if (stacked) {
      check(label + '/controlWidth', o.control.width, wanted.width, 1e-6);
      check(label + '/actionWidth', o.action.width, wanted.width, 1e-6);
      check(label + '/actionX', o.action.x, 0, 1e-6);
      check(
        label + '/actionY',
        o.action.y,
        o.control.height + g.stackGap,
        0.02
      );
    } else {
      check(
        label + '/joinedWidths',
        o.control.width + o.action.width + g.seam,
        wanted.width,
        0.02
      );
      check(label + '/actionX', o.action.x, o.control.width + g.seam, 0.02);
    }
    const visibleWrappers = optional
      .map(n => o.fields[n].wrapper)
      .filter(w => w.visible);
    check(
      label + '/rootHugHeight',
      o.consumer.height,
      o.row.height +
        visibleWrappers.reduce((a, w) => a + w.height, 0) +
        g.gap * visibleWrappers.length,
      0.02
    );
    check(
      label + '/rowY',
      o.row.y,
      o.fields.Label.wrapper.visible
        ? o.fields.Label.wrapper.height + g.gap
        : 0,
      0.02
    );
    check(label + '/rootOrder', o.consumer.childIds, [
      o.fields.Label.wrapper.id,
      o.row.id,
      o.fields.Help.wrapper.id,
      o.fields.Error.wrapper.id,
    ]);
    for (const [part, b] of [
      ['control', o.control],
      ['action', o.action],
    ]) {
      check(label + '/' + part + '/unclipped', b.clipsContent, false);
      check(
        label + '/' + part + '/corners',
        b.corners,
        stacked ? g.stackedCorners[part] : g.corners[part]
      );
      check(label + '/' + part + '/insideStroke', b.strokeAlign, 'INSIDE');
      check(
        label + '/' + part + '/stroke',
        b.strokeWeight,
        g[part === 'control' ? 'controlBorder' : 'actionBorder']
      );
      check(
        label + '/' + part + '/strokeIncluded',
        b.strokesIncludedInLayout,
        true
      );
      boundStroke(
        b,
        part === 'control' ? 'controlBorder' : 'actionBorder',
        label + '/' + part + '/strokeAlias'
      );
      check(label + '/' + part + '/opacity', b.opacity, 1);
      const src =
        source.paints[part === 'control' ? 'inputDefault' : 'actionDefault'];
      paint(b.fills, src.fill, label + '/' + part + '/fill');
      paint(b.strokes, src.stroke, label + '/' + part + '/stroke');
      for (const [i, f] of [
        'topLeftRadius',
        'topRightRadius',
        'bottomLeftRadius',
        'bottomRightRadius',
      ].entries())
        if (b.corners[i])
          bound(
            b.boundVariables?.[f],
            part === 'control' ? 'controlRadius' : 'actionRadius',
            label + '/' + part + '/' + f
          );
    }
    check(label + '/rootUnclipped', o.consumer.clipsContent, false);
    check(label + '/rowUnclipped', o.row.clipsContent, false);
    for (const n of names) {
      const f = o.fields[n],
        prefix = label + '/' + n;
      seenFieldIDs.add(f.id);
      check(prefix + '/id', f.id, first.fields[n].id);
      check(prefix + '/type', f.type, 'TEXT');
      check(
        prefix + '/sourceKey',
        f.mgKitId,
        'capability/' +
          report.runId +
          '/form-action-optional/source/' +
          o.layout +
          '/' +
          n
      );
      check(prefix + '/characters', f.characters, wanted.copy[n]);
      check(prefix + '/propertyID', f.propertyId, keys[n]);
      check(prefix + '/reference', f.propertyReferences?.characters, keys[n]);
      check(prefix + '/propertyType', o.properties[keys[n]]?.type, 'TEXT');
      check(
        prefix + '/propertyValue',
        o.properties[keys[n]]?.value,
        wanted.copy[n]
      );
      check(prefix + '/fieldProperty', f.property, o.properties[keys[n]]);
      typography(f, n, prefix);
      const role =
        n === 'Value'
          ? packet.roles[wanted.role].name
          : n === 'Action'
            ? source.paints.actionDefault.text
            : n === 'Label'
              ? source.paints.label
              : n === 'Help'
                ? source.paints.help
                : source.paints.errorText.text;
      if (f.characters.length) {
        paint(f.fills, role, prefix + '/nominalPaint');
        paint(f.rangePaints, role, prefix + '/range');
      } else check(prefix + '/emptyRange', f.rangePaints, []);
      if (optional.includes(n)) {
        const w = f.wrapper,
          bool = 'Show ' + n.toLowerCase();
        seenWrapperIDs.add(w.id);
        check(prefix + '/wrapperID', w.id, first.fields[n].wrapper.id);
        check(
          prefix + '/wrapperSourceKey',
          w.mgKitId,
          'capability/' +
            report.runId +
            '/form-action-optional/source/' +
            o.layout +
            '/' +
            n +
            ' wrapper'
        );
        check(prefix + '/wrapperParent', w.parentId, o.consumer.id);
        check(prefix + '/textParent', f.parentId, w.id);
        check(
          prefix + '/booleanPropertyType',
          o.properties[keys[bool]]?.type,
          'BOOLEAN'
        );
        check(
          prefix + '/booleanValue',
          o.properties[keys[bool]]?.value,
          wanted.copy[bool]
        );
        check(
          prefix + '/wrapperReference',
          f.wrapperVisibilityReference,
          keys[bool]
        );
        optionalBox(w, f, wanted.width, prefix, wanted.copy[bool]);
      }
    }
    check(label + '/ringCount', o.rings.length, 4);
    for (const r of o.rings) {
      const part =
        r.parentId === o.control.id
          ? 'control'
          : r.parentId === o.action.id
            ? 'action'
            : null;
      check(label + '/ring/' + r.id + '/bodyParentKnown', !!part, true);
      if (!part) continue;
      const focus = r.mgKitId.endsWith('/focus'),
        b = part === 'control' ? o.control : o.action,
        off = focus ? g.focusOffset : 0;
      check(
        label + '/ring/' + r.id + '/id',
        r.id,
        first.rings.find(z => z.mgKitId === r.mgKitId)?.id
      );
      check(label + '/ring/' + r.id + '/visible', r.visible, false);
      check(label + '/ring/' + r.id + '/fills', r.fills, []);
      check(label + '/ring/' + r.id + '/constraints', r.constraints, {
        horizontal: 'STRETCH',
        vertical: 'STRETCH',
      });
      check(label + '/ring/' + r.id + '/x', r.x, -off, 1e-6);
      check(label + '/ring/' + r.id + '/y', r.y, -off, 1e-6);
      check(
        label + '/ring/' + r.id + '/width',
        r.width,
        b.width + 2 * off,
        0.02
      );
      check(
        label + '/ring/' + r.id + '/height',
        r.height,
        b.height + 2 * off,
        0.02
      );
      check(
        label + '/ring/' + r.id + '/weight',
        r.strokeWeight,
        focus ? g.focusWidth : g.focusOffset
      );
      boundStroke(
        r,
        focus ? 'focusWidth' : 'focusOffset',
        label + '/ring/' + r.id + '/weightAlias'
      );
      paint(
        r.strokes,
        packet.roles[focus ? 'focusColor' : 'separatorColor'].name,
        label + '/ring/' + r.id + '/paint'
      );
    }
    if (o.phase.startsWith('after private-master')) {
      const base = byConsumer
        .get(o.consumer.id)
        .find(
          z =>
            z.phase === 'before private-master reapplications' ||
            z.phase.startsWith('new fresh after')
        );
      check(
        label + '/exactFullConsumerBaseline',
        exactConsumer(o),
        exactConsumer(base)
      );
    }
  }
  check('identity/uniqueTEXT', seenFieldIDs.size, 40);
  check('identity/uniqueOptionalWrappers', seenWrapperIDs.size, 24);
  let retention = null;
  if (after) {
    const current = new Map(assets(after).map(v => [v.id, v])),
      missing = [...original.keys()].filter(id => !current.has(id)),
      added = [...current.keys()].filter(id => !original.has(id)),
      changed = [...original]
        .filter(
          ([id, v]) =>
            current.has(id) && !util.isDeepStrictEqual(v, current.get(id))
        )
        .map(([id]) => id);
    check('retention/errors', after.errors, []);
    check('retention/missing', missing, []);
    check('retention/added', added, []);
    check('retention/changed', changed, []);
    check(
      'retention/ledgerAbsent',
      ledger.filter(id => current.has(id)),
      []
    );
    retention = {
      before: original.size,
      after: current.size,
      retained: original.size - missing.length,
      missing,
      added,
      changed,
      temporaryAbsent: ledger.every(id => !current.has(id)),
      ownerFieldUnrecorded: true,
    };
  }
  if (cleanup) {
    const c = cleanup;
    check('cleanup/errors', c.errors, []);
    check(
      'cleanup/exactLedger',
      [...(c.removedNodeIds || [])].sort(),
      [...ledgerSet].sort()
    );
    check(
      'cleanup/noCanonicalRemoved',
      (c.removedNodeIds || []).filter(id => original.has(id)),
      []
    );
  }

  return {
    kind: 'independent-form-action-optional-native-verdict',
    checks: checks.length,
    passed: checks.filter(c => c.pass).length,
    failed: failures.length,
    failures,
    observationCount: observations.length,
    temporaryLedgerCount: ledger.length,
    retention,
    origin: {
      reportKind: report.kind,
      scope: report.scope,
      nativeOriginAuthenticated: false,
    },
    limits: [
      'Uses raw saved fields; helper findings and synthetic layout assertions are not acceptance evidence.',
      'JSON alone cannot authenticate native execution. Report kind/scope/version, native-shaped IDs and any supplied origin tags are checked; synthetic evidence must not be presented as native acceptance.',
      ...(before
        ? []
        : [
            'Report-only mode lacks independent foundation/style inventory. Native role IDs and full template fonts are observed report metadata, checked against source and every captured consumer; retained assets cannot be verified.',
          ]),
      'Empty visible optional text requires positive full width, but does not require positive height and is not the React conditional-rendering contract.',
      'No consumer descendant geometry writes is a reviewed source-code contract, not inferred from getter snapshots.',
      'Direct diagnostic typography reuses imported template fonts only. No ordinary canonical rebuild or shared-style association acceptance.',
      'Snapshots omit set definitions, main text after reapplication, text decoration and text wrap. These cannot be independently verified here.',
      'Native focus pixels, neighboring occlusion, layout switching and font-file equivalence remain unproved.',
      'Exact saved-asset retention plus no additions and all ledger IDs absent verifies removal; the saved inspector omits the owner key.',
    ],
  };
}

module.exports = { verify };
if (require.main === module) main();

function validateTopology(report, doc, before, after, cleanup) {
  const requireValue = (condition, message) => {
    if (!condition) throw new Error(`Saved-report preflight: ${message}`);
  };
  requireValue(
    !!before === !!after && !!before === !!cleanup,
    '--before, --after and --cleanup must be supplied together.'
  );
  requireValue(
    report?.version === 1 &&
      report.kind === 'mangrove-native-capability-probes' &&
      report.scope === 'form-action-optional' &&
      report.brandId === 'undrr',
    'unsupported report version, kind, scope or brand.'
  );
  for (const field of ['origin', 'executionOrigin', 'executionEnvironment'])
    if (report[field] !== undefined)
      requireValue(
        ['native', 'figma', 'figma-plugin'].includes(report[field]),
        'non-native or unsupported execution-origin tag.'
      );
  requireValue(
    typeof report.runId === 'string' && report.runId.length > 0,
    'missing run identity.'
  );
  const nativeID = /^(?:I)?\d+:\d+(?:;\d+:\d+)*$/;
  requireValue(
    Array.isArray(report.ledger) && report.ledger.length === 172,
    'complete172-node ledger required.'
  );
  requireValue(
    report.ledger.every(
      n => nativeID.test(n?.id) && typeof n.type === 'string'
    ),
    'missing or non-native-shaped node identities.'
  );
  const ledger = new Map(report.ledger.map(n => [n.id, n.type]));
  requireValue(ledger.size === 172, 'duplicate ledger identities.');
  const counts = report.ledger.reduce(
    (a, n) => ((a[n.type] = (a[n.type] || 0) + 1), a),
    {}
  );
  requireValue(
    util.isDeepStrictEqual(counts, {
      FRAME: 71,
      COMPONENT: 2,
      COMPONENT_SET: 1,
      TEXT: 50,
      RECTANGLE: 40,
      INSTANCE: 8,
    }),
    'partial or unexpected ledger topology.'
  );
  const source = report.formActionOptional;
  requireValue(
    source?.experiment === 'A' &&
      ledger.get(report.rootId) === 'FRAME' &&
      ledger.get(source.setId) === 'COMPONENT_SET',
    'missing diagnostic root/set.'
  );
  requireValue(
    source.masterIds &&
      Object.keys(source.masterIds).sort().join(',') === 'Joined,Stacked' &&
      new Set(Object.values(source.masterIds)).size === 2 &&
      Object.values(source.masterIds).every(
        id => ledger.get(id) === 'COMPONENT'
      ),
    'missing or duplicate fixed masters.'
  );
  const names = ['Label', 'Value', 'Action', 'Help', 'Error'],
    optional = ['Label', 'Help', 'Error'];
  const propertyNames = [
    ...names,
    ...optional.map(n => 'Show ' + n.toLowerCase()),
  ];
  requireValue(
    source.propertyKeys &&
      Object.keys(source.propertyKeys).sort().join(',') ===
        propertyNames.sort().join(',') &&
      new Set(Object.values(source.propertyKeys)).size === 8,
    'missing or duplicate public property keys.'
  );
  requireValue(
    Array.isArray(source.cohorts) &&
      source.cohorts.length === 8 &&
      new Set(source.cohorts.map(c => c.id)).size === 8,
    'complete eight-consumer ledger required.'
  );
  const expectedPairs = ['edited', 'fresh0', 'fresh1', 'fresh2'].flatMap(c =>
    ['Joined', 'Stacked'].map(l => c + '/' + l)
  );
  requireValue(
    util.isDeepStrictEqual(
      source.cohorts.map(c => c.cohort + '/' + c.layout).sort(),
      expectedPairs.sort()
    ),
    'duplicate or missing consumer cohort.'
  );
  const observations = report.tests?.formActionOptionalA?.observations;
  requireValue(
    Array.isArray(observations) && observations.length === 44,
    'complete44-observation report required.'
  );
  const fieldTypes = {
    row: 'FRAME',
    control: 'FRAME',
    viewport: 'FRAME',
    action: 'FRAME',
    consumer: 'INSTANCE',
  };
  function node(n, type) {
    requireValue(
      n && ledger.get(n.id) === type && n.type === type,
      'missing or incompatible recorded node.'
    );
    requireValue(
      ['x', 'y', 'width', 'height'].every(
        k => typeof n[k] === 'number' && Number.isFinite(n[k])
      ),
      'missing finite native bounds.'
    );
  }
  const consumerTopologies = new Map();
  for (const o of observations) {
    requireValue(
      source.cohorts.some(
        c =>
          c.id === o.consumer?.id &&
          c.cohort === o.cohort &&
          c.layout === o.layout
      ),
      'unknown observation consumer.'
    );
    requireValue(typeof o.phase === 'string', 'missing observation phase.');
    for (const [f, t] of Object.entries(fieldTypes)) node(o[f], t);
    requireValue(
      o.fields &&
        Object.keys(o.fields).sort().join(',') ===
          names.slice().sort().join(','),
      'partial text anatomy.'
    );
    requireValue(
      Array.isArray(o.rings) && o.rings.length === 4,
      'partial focus-ring anatomy.'
    );
    const all = [o.consumer, o.row, o.control, o.viewport, o.action];
    for (const n of names) {
      const f = o.fields[n];
      node(f, 'TEXT');
      requireValue(
        typeof f.characters === 'string' &&
          f.fontName &&
          f.lineHeight &&
          f.boundVariables &&
          f.propertyReferences &&
          Array.isArray(f.fills) &&
          Array.isArray(f.rangePaints),
        'partial raw text/typography/paint snapshot.'
      );
      all.push(f);
      if (optional.includes(n)) {
        node(f.wrapper, 'FRAME');
        all.push(f.wrapper);
      }
    }
    for (const r of o.rings) {
      node(r, 'RECTANGLE');
      all.push(r);
    }
    requireValue(
      new Set(all.map(n => n.id)).size === 17,
      'duplicate consumer descendants.'
    );
    const prior = consumerTopologies.get(o.consumer.id);
    const topology = all.map(n => n.id);
    if (prior)
      requireValue(
        util.isDeepStrictEqual(prior, topology),
        'consumer descendants changed across phases.'
      );
    else consumerTopologies.set(o.consumer.id, topology);
    requireValue(
      propertyNames.every(n => o.properties?.[source.propertyKeys[n]]),
      'partial public property snapshot.'
    );
  }
  requireValue(
    consumerTopologies.size === 8 &&
      new Set([...consumerTopologies.values()].flat()).size === 136,
    'overlapping or missing consumer subtrees.'
  );
  for (const c of source.cohorts)
    requireValue(
      util.isDeepStrictEqual(
        observations.filter(o => o.consumer.id === c.id).map(o => o.phase),
        COHORT_PHASES[c.cohort]
      ),
      'missing, duplicate or unexpected cohort phases.'
    );
  requireValue(
    Array.isArray(source.sourceInitialization) &&
      source.sourceInitialization.length === 2 &&
      source.sourceInitialization
        .map(i => i.layout)
        .sort()
        .join(',') === 'Joined,Stacked',
    'missing positive-width initialization snapshots.'
  );
  const initializedNodes = [];
  for (const i of source.sourceInitialization) {
    requireValue(
      i.masterId === source.masterIds[i.layout],
      'wrong source initialization master.'
    );
    for (const n of optional) {
      const f = i.fields?.[n];
      node(f?.wrapper, 'FRAME');
      node(f?.text, 'TEXT');
      requireValue(
        f.wrapper.parentId === i.masterId && f.text.parentId === f.wrapper.id,
        'partial source initialization topology.'
      );
      requireValue(
        typeof f.text.characters === 'string' &&
          f.text.fontName &&
          f.text.lineHeight &&
          f.text.propertyReferences &&
          f.text.boundVariables &&
          Array.isArray(f.text.rangePaints),
        'partial initialization typography/paint snapshot.'
      );
      initializedNodes.push(f.wrapper.id, f.text.id);
    }
  }
  requireValue(
    new Set(initializedNodes).size === 12 &&
      initializedNodes.every(
        id => ![...consumerTopologies.values()].flat().includes(id)
      ),
    'duplicate or adopted initialization descendants.'
  );
  const roleIDs = report.preflight?.formActionJoining?.roleIds;
  requireValue(
    roleIDs &&
      Object.keys(roleIDs).length === 35 &&
      new Set(Object.values(roleIDs).map(r => r.id)).size === 35,
    'missing or duplicate35-role preflight.'
  );
  requireValue(
    report.preflight?.formActionOptional?.fontTemplates?.length === 2 &&
      Array.isArray(report.fonts?.loaded),
    'missing raw imported font templates or loaded fonts.'
  );
  requireValue(
    doc?.variables && Array.isArray(doc.modes) && doc.styles?.text,
    'missing exported source document.'
  );
  requireValue(
    new Set(doc.variables.map(v => v.id)).size === doc.variables.length &&
      new Set(doc.variables.map(v => v.name)).size === doc.variables.length,
    'duplicate source variable identities.'
  );
  if (before) {
    for (const snapshot of [before, after]) {
      requireValue(
        Array.isArray(snapshot.nodes) &&
          Array.isArray(snapshot.variables) &&
          Array.isArray(snapshot.collections) &&
          Array.isArray(snapshot.styles?.text) &&
          Array.isArray(snapshot.styles?.effect),
        'partial saved inventory.'
      );
      const inventory = [
        ...snapshot.nodes,
        ...snapshot.variables,
        ...snapshot.collections,
        ...snapshot.styles.text,
        ...snapshot.styles.effect,
      ];
      requireValue(
        new Set(inventory.map(n => n.id)).size === inventory.length,
        'duplicate saved asset identities.'
      );
    }
    requireValue(
      Array.isArray(cleanup.removedNodeIds) && Array.isArray(cleanup.errors),
      'partial cleanup report.'
    );
    requireValue(
      new Set(cleanup.removedNodeIds).size === cleanup.removedNodeIds.length,
      'duplicate cleanup identities.'
    );
  }
}

function main() {
  const args = process.argv.slice(2),
    options = {};
  if (args.includes('--help')) {
    console.log(
      'Usage: node verify-form-action-optional-native.cjs --report report.json [--document variables.json] [--before baseline.json --after inspection.json --cleanup cleanup.json] [--out verdict.json]'
    );
    return;
  }
  const allowed = new Set([
    'report',
    'document',
    'before',
    'after',
    'cleanup',
    'out',
  ]);
  let verdict;
  try {
    if (args.length % 2)
      throw new Error('CLI arguments require flag/value pairs.');
    for (let i = 0; i < args.length; i += 2) {
      const key = args[i].replace(/^--/, '');
      if (
        !args[i].startsWith('--') ||
        !allowed.has(key) ||
        options[key] !== undefined ||
        !args[i + 1] ||
        args[i + 1].startsWith('--')
      )
        throw new Error('Unknown, duplicate or incomplete CLI argument.');
      options[key] = args[i + 1];
    }
    if (!options.report) throw new Error('--report is required.');
    const inventoryFlags = ['before', 'after', 'cleanup'].filter(
      k => options[k]
    );
    if (inventoryFlags.length !== 0 && inventoryFlags.length !== 3)
      throw new Error('--before, --after and --cleanup are all-or-none.');
    const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
    verdict = verify({
      report: read(options.report),
      document: read(
        options.document ||
          path.join(REPO, 'examples/figma-plugin/mangrove-variables.json')
      ),
      before: options.before ? read(options.before) : null,
      after: options.after ? read(options.after) : null,
      cleanup: options.cleanup ? read(options.cleanup) : null,
    });
    verdict.sourceReport = options.report;
  } catch (error) {
    verdict = {
      kind: 'independent-form-action-optional-native-verdict',
      checks: 0,
      passed: 0,
      failed: 1,
      preflightRejected: true,
      failures: [{ label: 'preflight', reason: error.message }],
      retention: null,
    };
  }
  if (options.out)
    fs.writeFileSync(options.out, JSON.stringify(verdict, null, 2) + '\n');
  console.log(
    JSON.stringify(
      {
        checks: verdict.checks,
        passed: verdict.passed,
        failed: verdict.failed,
        preflightRejected: !!verdict.preflightRejected,
        observations: verdict.observationCount || 0,
        retainedAssets: verdict.retention?.retained ?? null,
        temporaryAbsent: verdict.retention?.temporaryAbsent ?? null,
      },
      null,
      2
    )
  );
  if (verdict.failed) process.exitCode = 1;
}
