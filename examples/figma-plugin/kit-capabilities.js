/* global figma, mgReadIdentity, mgWriteIdentity, mgSegmentedJoiningPreflight, mgRunSegmentedJoiningProbes, mgSegmentedCanonicalPreflight, mgRunSegmentedCanonicalProbes, mgSegmentedCanonicalOwned, mgFormActionJoiningPreflight, mgRunFormActionJoiningProbes, mgSegmentedFocusSizingPreflight, mgRunSegmentedFocusSizingProbes, mgFormActionOptionalPreflight, mgRunFormActionOptionalProbes, mgSegmentedLeavesPreflight, mgRunSegmentedLeavesProbes, mgSegmentedLeavesOwned, mgSegmentedWrapperPreflight, mgRunSegmentedWrapperProbes, mgSegmentedWrapperOwned, runMangroveCoreContentProbes, mgCoreContentOwned, removeMangroveCoreContentProbes */
// Isolated diagnostic assets, not FormGroup components or source fidelity claims.
const MG_CAPABILITY_KEY = 'mgCapabilityProbeId';
let mgCapabilitySequence = 0;

async function runMangroveCapabilityProbes(
  doc,
  brandId = 'undrr',
  scope = 'legacy'
) {
  if (scope === 'core-content')
    return runMangroveCoreContentProbes(doc, brandId);
  const report = {
    version: 1,
    kind: 'mangrove-native-capability-probes',
    runId: `capabilities-${Date.now()}-${++mgCapabilitySequence}`,
    brandId,
    scope,
    rootId: null,
    ledger: [],
    tests: {},
    errors: [],
    fonts: { requested: [], loaded: [] },
    limitations: [
      'Diagnostic geometry only; this is not a source FormGroup asset.',
      'Fixed maxWidth values are explicitly updated during width probes; this does not prove live parent-relative maxWidth.',
      'Results describe this API session and must be visually reviewed before component implementation.',
    ],
  };
  const message = error => error?.message || String(error);
  let collection;
  let mode;
  let font;
  let rangeSource;
  let segmentedPlan;
  let canonicalPlan;
  let formActionPlan;
  let focusSizingPlan;
  let formActionOptionalPlan;
  let leavesPlan;
  let wrapperPlan;
  try {
    if (
      ![
        'legacy',
        'toc-link-sizing',
        'toc-range-paints',
        'segmented-joining',
        'segmented-canonical',
        'segmented-wrapper',
        'segmented-leaves-default',
        'segmented-leaves-hover',
        'segmented-leaves-focus',
        'segmented-leaves-hoverfocus',
        'segmented-leaves-disabled',
        'form-action-joining',
        'form-action-optional',
        'segmented-focus-sizing',
      ].includes(scope)
    )
      throw new Error(`Unknown capability probe scope ${scope}.`);
    if (figma.editorType !== 'figma')
      throw new Error('Capability probes require Figma Design.');
    const brand = doc?.modes?.find(item => item.id === brandId);
    if (!brand) throw new Error(`Unknown brand ${brandId}.`);
    const matches = (
      await figma.variables.getLocalVariableCollectionsAsync()
    ).filter(item => item.name === doc.collection);
    if (matches.length !== 1)
      throw new Error('Import one unambiguous Mangrove collection first.');
    collection = matches[0];
    const modes = collection.modes.filter(item => item.name === brand.name);
    if (modes.length !== 1)
      throw new Error(`Import the ${brand.name} mode first.`);
    mode = modes[0];
    const foundation = doc.styles?.text?.find(
      item => item.id === 'text.text.300.regular'
    )?.values?.[brandId];
    font = foundation?.fontName;
    if (!font || typeof font.family !== 'string' || font.style !== 'Regular')
      throw new Error('A source Regular text font is required.');
    if (
      scope.startsWith('toc-') &&
      (font.family !== 'Roboto' || foundation.fontSize !== 16)
    )
      throw new Error('TOC probes require the exact source Roboto Regular.');
    if (scope === 'toc-range-paints') {
      const specs =
        doc.styles?.text?.filter(
          item => item.id === 'component.table-of-contents.link'
        ) || [];
      const sourceValue = specs[0]?.values?.[brandId];
      if (
        specs.length !== 1 ||
        sourceValue?.fontName?.family !== 'Roboto' ||
        sourceValue.fontName.style !== 'Regular' ||
        sourceValue.fontSize !== 16 ||
        sourceValue.lineHeight?.unit !== 'PERCENT' ||
        sourceValue.lineHeight.value !== 150 ||
        sourceValue.textDecoration !== 'UNDERLINE'
      )
        throw new Error('An exact source TOC link style is required.');
      const styles = (await figma.getLocalTextStylesAsync()).filter(
        style => mgReadIdentity(style, 'mgStyleId') === specs[0].id
      );
      if (
        styles.length !== 1 ||
        styles[0].fontName?.family !== 'Roboto' ||
        styles[0].fontName.style !== 'Regular' ||
        styles[0].fontSize !== 16 ||
        styles[0].lineHeight?.unit !== 'PERCENT' ||
        styles[0].lineHeight.value !== 150 ||
        styles[0].textDecoration !== 'UNDERLINE'
      )
        throw new Error('Import one exact native TOC link style first.');
      const nativeVariables = await figma.variables.getLocalVariablesAsync();
      const markerSpecs = (doc.styles?.text || []).filter(
        item => item.id === 'component.table-of-contents.marker'
      );
      const markerValue = markerSpecs[0]?.values?.[brandId];
      const markerStyles = (await figma.getLocalTextStylesAsync()).filter(
        style => mgReadIdentity(style, 'mgStyleId') === markerSpecs[0]?.id
      );
      if (
        markerSpecs.length !== 1 ||
        markerStyles.length !== 1 ||
        markerStyles[0].id === styles[0].id ||
        ![markerValue, markerStyles[0]].every(
          value =>
            value?.fontName?.family === 'Roboto' &&
            value.fontName.style === 'Regular' &&
            value.fontSize === 16 &&
            value.lineHeight?.unit === 'PERCENT' &&
            value.lineHeight.value === 150 &&
            value.textDecoration === 'NONE'
        )
      )
        throw new Error(
          'Import one distinct exact native/source TOC marker style first.'
        );
      const definitions = new Map(
        (doc.variables || []).map(variable => [variable.name, variable])
      );
      function sourceValueFor(name, seen = new Set(), type = 'COLOR') {
        if (seen.has(name)) throw new Error('TOC color alias cycle.');
        seen.add(name);
        const definition = definitions.get(name);
        if (definition?.type !== type)
          throw new Error(`Missing source ${type} ${name}.`);
        const value = definition.values?.[brandId];
        return value?.alias ? sourceValueFor(value.alias, seen, type) : value;
      }
      const typographyBindings = [];
      const nativeValueFor = (variable, type, seen = new Set()) => {
        if (seen.has(variable.id))
          throw new Error('TOC native typography alias cycle.');
        seen.add(variable.id);
        if (
          variable.resolvedType !== type ||
          variable.variableCollectionId !== collection.id
        )
          throw new Error(
            'TOC typography variable has an incompatible type or collection.'
          );
        const value = variable.valuesByMode?.[mode.modeId];
        if (value?.type === 'VARIABLE_ALIAS') {
          const targets = nativeVariables.filter(item => item.id === value.id);
          if (targets.length !== 1)
            throw new Error(
              'TOC typography alias target is missing or ambiguous.'
            );
          return nativeValueFor(targets[0], type, seen);
        }
        return value;
      };
      for (const [field, type, required] of [
        ['fontFamily', 'STRING', 'Roboto'],
        ['fontSize', 'FLOAT', 16],
      ]) {
        const raw = styles[0].boundVariables?.[field];
        const aliases = Array.isArray(raw) ? raw : raw ? [raw] : [];
        const sourceRole = specs[0].bindings?.[field];
        const expected = sourceValueFor(sourceRole, new Set(), type);
        if (
          aliases.length !== 1 ||
          aliases[0]?.type !== 'VARIABLE_ALIAS' ||
          typeof aliases[0].id !== 'string'
        )
          throw new Error(`TOC style needs one exact ${field} variable alias.`);
        const matches = nativeVariables.filter(
          variable => variable.id === aliases[0].id
        );
        if (
          matches.length !== 1 ||
          matches[0].name !== sourceRole ||
          expected !== required ||
          nativeValueFor(matches[0], type) !== expected
        )
          throw new Error(
            `TOC ${field} binding does not resolve to its exact source value.`
          );
        const lookup = await figma.variables.getVariableByIdAsync(
          aliases[0].id
        );
        if (
          !lookup ||
          lookup.id !== matches[0].id ||
          lookup.resolvedType !== type
        )
          throw new Error(`TOC ${field} variable lookup failed.`);
        typographyBindings.push({
          field,
          type,
          sourceRole,
          variable: lookup,
          expected,
          sourceAlias: aliases[0],
        });
      }
      const roles = ['color/interactive', 'color/interactive-active'].map(
        name => {
          const matches = nativeVariables.filter(
            variable =>
              variable.name === name &&
              variable.variableCollectionId === collection.id
          );
          const expected = sourceValueFor(name);
          if (
            matches.length !== 1 ||
            matches[0].resolvedType !== 'COLOR' ||
            !expected ||
            !['r', 'g', 'b', 'a'].every(field =>
              Number.isFinite(expected[field])
            )
          )
            throw new Error(`Import one exact COLOR ${name} first.`);
          return { name, variable: matches[0], expected };
        }
      );
      rangeSource = {
        style: styles[0],
        markerStyle: markerStyles[0],
        roles,
        typographyBindings,
      };
      font = { ...styles[0].fontName };
    }
    report.fonts.requested.push({ ...font });
    await figma.loadFontAsync(font);
    report.fonts.loaded.push({ ...font });
    if (
      rangeSource &&
      JSON.stringify(rangeSource.markerStyle.fontName) !== JSON.stringify(font)
    ) {
      const markerFont = { ...rangeSource.markerStyle.fontName };
      report.fonts.requested.push(markerFont);
      await figma.loadFontAsync(markerFont);
      report.fonts.loaded.push(markerFont);
    }
    report.preflight = {
      collectionId: collection.id,
      modeId: mode.modeId,
      fontName: { ...font },
      fontSize: 16,
      lineHeight: 24,
      diagnosticWidths: [320, 240],
    };
    if (scope === 'segmented-joining')
      segmentedPlan = await mgSegmentedJoiningPreflight(
        doc,
        brandId,
        collection,
        mode,
        report
      );
    if (scope === 'segmented-wrapper')
      wrapperPlan = await mgSegmentedWrapperPreflight(
        doc,
        brandId,
        collection,
        mode,
        report
      );
    if (scope.startsWith('segmented-leaves-'))
      leavesPlan = await mgSegmentedLeavesPreflight(
        doc,
        brandId,
        collection,
        mode,
        report,
        {
          default: 'Default',
          hover: 'Hover',
          focus: 'Focus',
          hoverfocus: 'HoverFocus',
          disabled: 'Disabled',
        }[scope.slice('segmented-leaves-'.length)]
      );
    if (scope === 'segmented-canonical')
      canonicalPlan = await mgSegmentedCanonicalPreflight(
        doc,
        brandId,
        collection,
        mode,
        report
      );
    if (scope === 'form-action-joining')
      formActionPlan = await mgFormActionJoiningPreflight(
        doc,
        brandId,
        collection,
        mode,
        report
      );
    if (scope === 'form-action-optional')
      formActionOptionalPlan = await mgFormActionOptionalPreflight(
        doc,
        brandId,
        collection,
        mode,
        report
      );
    if (scope === 'segmented-focus-sizing')
      focusSizingPlan = await mgSegmentedFocusSizingPreflight(
        doc,
        brandId,
        collection,
        mode,
        report
      );
    if (scope === 'toc-link-sizing') {
      report.preflight.diagnosticWidths = [240, 390, 900];
      report.preflight.diagnosticCaps = [195.5, 345.5, 855.5];
      report.limitations = [
        'Isolated TOC link sizing observations only, not a canonical TOC component or source pixel acceptance.',
        'Direct maxWidth values describe finite source consumers; live consumer-relative caps and arbitrary resizing remain unproven.',
        'The source unbroken stress word overflows at narrow widths. Native splitting is reported as a discrepancy, not contained acceptance.',
        'Mock geometry is synthetic. Native fonts, wrapping, decoration and edited-property inheritance require actual readbacks and visual review.',
      ];
    }
    if (scope === 'toc-range-paints') {
      report.preflight.styleId = rangeSource.style.id;
      report.preflight.distinctStyleId = rangeSource.markerStyle.id;
      report.preflight.typographyBindings = rangeSource.typographyBindings.map(
        ({ field, type, sourceRole, variable, expected, sourceAlias }) => ({
          field,
          type,
          sourceRole,
          variableId: variable.id,
          expected,
          sourceAlias,
        })
      );
      report.preflight.colorVariableIds = rangeSource.roles.map(role => ({
        name: role.name,
        id: role.variable.id,
        expected: role.expected,
      }));
      report.preflight.diagnosticWidths = [195.5];
      report.limitations = [
        'Isolated paint/property/style discriminator only; no canonical nodes, styles or variables are changed.',
        'PairD separate property IDs are diagnostic controls, not a canonical migration.',
        'PairE uses the existing marker style only as a distinct-ID typography control, with explicit link underline overrides. PairF style detachment is diagnostic, not canonical acceptance.',
        'Source RGBA checks allow1e-6 channel precision; all raw font/paint/alias/style/reference readbacks remain evidence.',
        'Mock propagation is explicitly synthetic; native phases and fresh/edited consumer rasterisation require actual verification.',
      ];
    }
  } catch (error) {
    report.errors.push(`Preflight: ${message(error)}`);
    return report;
  }
  const recorded = new Set();
  function record(node, descendants = true) {
    if (!recorded.has(node.id)) {
      // Record immediately, before further native writes can fail.
      recorded.add(node.id);
      report.ledger.push({ id: node.id, type: node.type });
      mgWriteIdentity(node, MG_CAPABILITY_KEY, report.runId);
    }
    if (descendants) for (const child of node.children || []) record(child);
    return node;
  }
  let root;
  try {
    root = figma.createFrame();
    report.rootId = root.id;
    record(root);
    root.name =
      scope === 'segmented-wrapper'
        ? 'Mangrove native capability probes / Segmented FullWidth wrappers'
        : scope.startsWith('segmented-leaves-')
          ? `Mangrove native capability probes / Segmented Default leaves / ${leavesPlan.batchState}`
          : scope === 'form-action-optional'
            ? 'Mangrove native capability probes / Form Action optional wrappers'
            : scope === 'segmented-focus-sizing'
              ? 'Mangrove native capability probes / Segmented focus sizing'
              : scope === 'form-action-joining'
                ? 'Mangrove native capability probes / Form Action joining'
                : scope === 'segmented-joining'
                  ? 'Mangrove native capability probes / Segmented joining'
                  : scope === 'segmented-canonical'
                    ? 'Mangrove native capability probes / Segmented canonical'
                    : scope === 'toc-link-sizing'
                      ? 'Mangrove native capability probes / TOC link sizing'
                      : scope === 'toc-range-paints'
                        ? 'Mangrove native capability probes / TOC range paints'
                        : 'Mangrove native capability probes';
    root.layoutMode = 'NONE';
    root.clipsContent = false;
    root.fills = [];
    root.resize(
      [
        'segmented-joining',
        'form-action-joining',
        'form-action-optional',
        'segmented-focus-sizing',
      ].includes(scope)
        ? 1500
        : scope.startsWith('segmented-leaves-')
          ? 1120
          : scope === 'toc-link-sizing'
            ? 2820
            : 1120,
      [
        'segmented-joining',
        'form-action-joining',
        'form-action-optional',
      ].includes(scope)
        ? 1600
        : scope === 'segmented-wrapper'
          ? 2200
          : scope.startsWith('segmented-leaves-')
            ? 1400
            : scope === 'toc-range-paints'
              ? 1640
              : 900
    );
    const existingBottoms = figma.currentPage.children
      .filter(node => node.id !== root.id)
      .map(node => node.y + node.height)
      .filter(Number.isFinite);
    root.x = 0;
    root.y = Math.max(0, ...existingBottoms) + 100;
    root.setExplicitVariableModeForCollection(collection, mode.modeId);
  } catch (error) {
    report.errors.push(`Probe root: ${message(error)}`);
    return report;
  }
  const bounds = node => ({
    id: node.id,
    type: node.type,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
  });
  function create(method, parent = root) {
    const node = record(figma[method]());
    parent.appendChild(node);
    return node;
  }
  function instance(master, parent = root) {
    const node = record(master.createInstance());
    parent.appendChild(node);
    return node;
  }
  function text(parent, characters) {
    const node = create('createText', parent);
    node.fontName = font;
    node.fontSize = 16;
    node.lineHeight = { unit: 'PIXELS', value: 24 };
    node.characters = characters;
    return node;
  }
  async function test(id, run) {
    const result = {
      status: 'observed',
      supported: false,
      errors: [],
      observations: [],
    };
    report.tests[id] = result;
    const start = report.ledger.length;
    try {
      await run(result);
    } catch (error) {
      result.status = 'error';
      result.errors.push(message(error));
    }
    result.affectedNodeIds = report.ledger.slice(start).map(item => item.id);
  }
  if (scope === 'segmented-wrapper') {
    await mgRunSegmentedWrapperProbes(
      {
        report,
        root,
        record,
        create,
        instance,
        test,
        bounds,
        collection,
        mode,
      },
      wrapperPlan
    );
    // No refresh/adoption: the runner captures exact original parent topology.
    return report;
  }
  if (scope.startsWith('segmented-leaves-')) {
    try {
      await mgRunSegmentedLeavesProbes(
        {
          report,
          root,
          record,
          create,
          instance,
          test,
          bounds,
          collection,
          mode,
        },
        leavesPlan
      );
    } catch (error) {
      report.errors.push(`Segmented Default leaves: ${message(error)}`);
    }
    report.ledgerRefresh = await refreshMangroveCapabilityProbeLedger(report);
    report.unrecordedDescendantIds = report.ledgerRefresh.unrecordedNodeIds;
    return report;
  }
  if (scope === 'segmented-focus-sizing') {
    try {
      await mgRunSegmentedFocusSizingProbes(
        {
          report,
          root,
          record,
          create,
          instance,
          test,
          bounds,
          collection,
          mode,
        },
        focusSizingPlan
      );
    } catch (error) {
      report.errors.push(`Segmented focus sizing: ${message(error)}`);
    }
    report.ledgerRefresh = await refreshMangroveCapabilityProbeLedger(report);
    report.unrecordedDescendantIds = report.ledgerRefresh.unrecordedNodeIds;
    return report;
  }
  if (scope === 'form-action-optional') {
    try {
      await mgRunFormActionOptionalProbes(
        {
          report,
          root,
          record,
          create,
          instance,
          test,
          bounds,
          collection,
          mode,
        },
        formActionOptionalPlan
      );
    } catch (error) {
      report.errors.push(`Form Action optional wrappers: ${message(error)}`);
    }
    report.ledgerRefresh = await refreshMangroveCapabilityProbeLedger(report);
    report.unrecordedDescendantIds = report.ledgerRefresh.unrecordedNodeIds;
    return report;
  }
  if (scope === 'form-action-joining') {
    try {
      await mgRunFormActionJoiningProbes(
        {
          report,
          root,
          record,
          create,
          instance,
          test,
          bounds,
          collection,
          mode,
        },
        formActionPlan
      );
    } catch (error) {
      report.errors.push(`Form Action probes: ${message(error)}`);
    }
    report.ledgerRefresh = await refreshMangroveCapabilityProbeLedger(report);
    report.unrecordedDescendantIds = report.ledgerRefresh.unrecordedNodeIds;
    return report;
  }
  if (scope === 'segmented-joining') {
    try {
      await mgRunSegmentedJoiningProbes(
        {
          report,
          root,
          record,
          create,
          instance,
          test,
          bounds,
          collection,
          mode,
        },
        segmentedPlan
      );
    } catch (error) {
      report.errors.push(`Segmented probes: ${message(error)}`);
    }
    report.ledgerRefresh = await refreshMangroveCapabilityProbeLedger(report);
    report.unrecordedDescendantIds = report.ledgerRefresh.unrecordedNodeIds;
    return report;
  }
  if (scope === 'segmented-canonical') {
    try {
      await mgRunSegmentedCanonicalProbes(
        {
          report,
          root,
          record,
          create,
          instance,
          test,
          bounds,
          collection,
          mode,
        },
        canonicalPlan
      );
    } catch (error) {
      report.errors.push(`Segmented canonical probes: ${message(error)}`);
    }
    report.ledgerRefresh = await refreshMangroveCapabilityProbeLedger(report);
    report.unrecordedDescendantIds = report.ledgerRefresh.unrecordedNodeIds;
    return report;
  }
  if (scope === 'toc-range-paints') {
    await test('tocRangePaints', async result => {
      result.interpretation =
        'Fresh-read both labels and consumers after each exact setter. Cross-variant changes identify a phase, not a proven Figma implementation cause.';
      result.source = {
        styleId: rangeSource.style.id,
        fontName: { ...font },
        fontSize: 16,
        lineHeight: 24,
        underlineOffset: { unit: 'PERCENT', value: 15 },
        channelTolerance: 1e-6,
      };
      result.cases = [];
      const caption = 'TOC source range paint probe';
      const edited = 'Edited TOC range paint consumer';
      const json = value => {
        if (typeof value === 'symbol') return 'MIXED';
        if (Array.isArray(value)) return value.map(json);
        if (value && typeof value === 'object')
          return Object.fromEntries(
            Object.keys(value)
              .sort()
              .filter(key => value[key] !== undefined)
              .map(key => [key, json(value[key])])
          );
        return value;
      };
      async function resolved(paints, node) {
        if (!Array.isArray(paints))
          return { mixed: true, paints: json(paints), resolved: [] };
        const colors = [];
        for (const paint of paints) {
          if (paint.type !== 'SOLID')
            throw new Error('Diagnostic text has a non-SOLID fill.');
          let color = paint.color;
          if (paint.boundVariables?.color?.id) {
            const variable = await figma.variables.getVariableByIdAsync(
              paint.boundVariables.color.id
            );
            if (!variable || variable.resolvedType !== 'COLOR')
              throw new Error('Diagnostic range COLOR variable is missing.');
            color = variable.resolveForConsumer(node).value;
          }
          colors.push({
            r: color.r,
            g: color.g,
            b: color.b,
            a: (color.a ?? 1) * (paint.opacity ?? 1),
            visible: paint.visible !== false,
          });
        }
        return { mixed: false, paints: json(paints), resolved: json(colors) };
      }
      const sourceMatches = (expected, actual) =>
        actual.length === 1 &&
        actual[0].visible &&
        ['r', 'g', 'b', 'a'].every(
          field =>
            Number.isFinite(actual[0][field]) &&
            Math.abs(expected[field] - actual[0][field]) <= 1e-6
        );
      function freshPaint(index, node) {
        const role = rangeSource.roles[index],
          color = role.variable.resolveForConsumer(node).value;
        return [
          figma.variables.setBoundVariableForPaint(
            {
              type: 'SOLID',
              color: { r: color.r, g: color.g, b: color.b },
              opacity: color.a ?? 1,
            },
            'color',
            role.variable
          ),
        ];
      }
      for (const [caseIndex, condition] of [
        { id: 'A', property: 'shared', styled: true },
        { id: 'B', property: 'none', styled: true },
        { id: 'C', property: 'shared', styled: false },
        { id: 'D', property: 'distinct', styled: true },
        { id: 'E', property: 'shared', styled: true, distinctStyles: true },
        { id: 'F', property: 'shared', styled: true, detachTransition: true },
      ].entries()) {
        const sample = {
          ...condition,
          status: 'observed',
          observations: [],
          errors: [],
          requestedRoles: rangeSource.roles.map(role => ({
            name: role.name,
            id: role.variable.id,
            expected: role.expected,
          })),
        };
        result.cases.push(sample);
        try {
          const masters = ['Default', 'Hover'].map((State, index) => {
            const component = create('createComponent');
            component.name = `State=${State}`;
            component.layoutMode = 'VERTICAL';
            component.fills = [];
            component.clipsContent = false;
            component.paddingTop = component.paddingBottom = 2.5;
            component.resize(195.5, 29);
            component.maxWidth = 195.5;
            component.layoutSizingHorizontal = component.layoutSizingVertical =
              'HUG';
            component.x = index * 280;
            component.y = caseIndex * 260;
            return component;
          });
          const set = record(figma.combineAsVariants(masters, root), false);
          set.name = `${condition.id} / ${condition.property} Label / ${condition.distinctStyles ? 'distinct style IDs' : condition.detachTransition ? 'style detach transition' : condition.styled ? 'shared style' : 'no style'}`;
          set.layoutMode = 'NONE';
          set.fills = [];
          set.clipsContent = false;
          set.x = 0;
          set.y = caseIndex * 260;
          masters.forEach((node, index) => {
            node.x = index * 280;
            node.y = 0;
          });
          const labels = masters.map(master => text(master, caption));
          labels.forEach(node => {
            node.name = 'Link label';
          });
          const keys =
            condition.property === 'none'
              ? [null, null]
              : condition.property === 'shared'
                ? Array(2).fill(
                    set.addComponentProperty('Label', 'TEXT', caption)
                  )
                : ['Default', 'Hover'].map(State =>
                    set.addComponentProperty(`Label ${State}`, 'TEXT', caption)
                  );
          sample.setId = set.id;
          sample.masterIds = masters.map(node => node.id);
          sample.labelIds = labels.map(node => node.id);
          sample.propertyIds = keys;
          const requestedStyles = condition.distinctStyles
            ? [rangeSource.style, rangeSource.markerStyle]
            : [rangeSource.style, rangeSource.style];
          sample.requestedStyleIds = requestedStyles.map(style =>
            condition.styled ? style.id : ''
          );
          let detached = false;
          const consumers = [];
          async function readText(id, roleIndex) {
            const node = await figma.getNodeByIdAsync(id);
            if (
              !node ||
              node.type !== 'TEXT' ||
              mgReadIdentity(node, MG_CAPABILITY_KEY) !== report.runId
            )
              throw new Error('Exact diagnostic TEXT is missing or foreign.');
            const nominal = await resolved(node.fills, node),
              range = await resolved(
                node.getRangeFills(0, node.characters.length),
                node
              );
            const typographyBindingValues = [];
            for (const binding of rangeSource.typographyBindings) {
              const raw = node.boundVariables?.[binding.field];
              const aliases = Array.isArray(raw) ? raw : raw ? [raw] : [];
              const actual = [];
              for (const alias of aliases) {
                const variable = await figma.variables.getVariableByIdAsync(
                  alias.id
                );
                if (!variable)
                  throw new Error(
                    'Diagnostic typography alias variable is missing.'
                  );
                actual.push({
                  id: variable.id,
                  type: variable.resolvedType,
                  value: json(variable.resolveForConsumer(node).value),
                });
              }
              typographyBindingValues.push({
                field: binding.field,
                sourceRole: binding.sourceRole,
                expectedId: binding.variable.id,
                expected: binding.expected,
                raw: json(raw),
                actual,
                sourceMatches:
                  actual.length === 1 &&
                  actual[0].id === binding.variable.id &&
                  actual[0].type === binding.type &&
                  actual[0].value === binding.expected,
              });
            }
            return {
              id: node.id,
              parentId: node.parent?.id,
              characters: node.characters,
              textStyleId: json(node.textStyleId),
              fontName: json(node.fontName),
              fontSize: node.fontSize,
              lineHeight: json(node.lineHeight),
              references: json(node.componentPropertyReferences || {}),
              boundVariables: json(node.boundVariables || {}),
              typographyBindingValues,
              nominal,
              range,
              sourceRole: rangeSource.roles[roleIndex].name,
              sourceRangeMatches: sourceMatches(
                rangeSource.roles[roleIndex].expected,
                range.resolved
              ),
              textDecoration: json(node.textDecoration),
              textDecorationOffset: json(node.textDecorationOffset),
              textWrapStyle: json(node.textWrapStyle),
              bounds: bounds(node),
              textAutoResize: node.textAutoResize,
              horizontal: node.layoutSizingHorizontal,
              vertical: node.layoutSizingVertical,
            };
          }
          async function snapshot(phase, operation = null) {
            const observation = {
              phase,
              operation,
              definitions: json(set.componentPropertyDefinitions),
              labels: [],
              consumers: [],
              errors: [],
            };
            sample.observations.push(observation);
            for (let index = 0; index < 2; index++)
              observation.labels.push(
                await readText(sample.labelIds[index], index)
              );
            for (const consumer of consumers) {
              const node = await figma.getNodeByIdAsync(consumer.id);
              if (
                !node ||
                node.type !== 'INSTANCE' ||
                mgReadIdentity(node, MG_CAPABILITY_KEY) !== report.runId
              )
                throw new Error(
                  'Exact diagnostic consumer is missing or foreign.'
                );
              const texts = node.findAll(child => child.type === 'TEXT');
              if (texts.length !== 1)
                throw new Error(
                  'Diagnostic consumer TEXT is missing or ambiguous.'
                );
              observation.consumers.push({
                id: node.id,
                index: consumer.index,
                propertyId: keys[consumer.index],
                originalTextId: consumer.textId,
                actualMainComponentId: (await node.getMainComponentAsync())?.id,
                properties: json(node.componentProperties),
                requestedEdit: consumer.edited ? edited : caption,
                edited: consumer.edited,
                label: await readText(texts[0].id, consumer.index),
              });
            }
            return observation;
          }
          async function setter(index, name, phase, guardUnchanged = false) {
            sample.phase = `${phase}_${index}_${name}`;
            const node = await figma.getNodeByIdAsync(sample.labelIds[index]);
            if (
              !node ||
              mgReadIdentity(node, MG_CAPABILITY_KEY) !== report.runId
            )
              throw new Error(
                'Exact diagnostic setter target is missing or foreign.'
              );
            let skipped = false;
            if (name === 'style') {
              const style = requestedStyles[index];
              if (
                condition.styled &&
                !detached &&
                !(guardUnchanged && node.textStyleId === style.id)
              )
                await node.setTextStyleIdAsync(style.id);
              else skipped = true;
            }
            if (name === 'detachStyle') await node.setTextStyleIdAsync('');
            if (name === 'directTypography') {
              node.fontName = { ...font };
              node.fontSize = 16;
              node.lineHeight = { unit: 'PERCENT', value: 150 };
            }
            if (name === 'fontFamilyBinding' || name === 'fontSizeBinding') {
              const field =
                name === 'fontFamilyBinding' ? 'fontFamily' : 'fontSize';
              const binding = rangeSource.typographyBindings.find(
                item => item.field === field
              );
              node.setBoundVariable(field, binding.variable);
            }
            if (name === 'characters') {
              if (guardUnchanged && node.characters === caption) skipped = true;
              else node.characters = caption;
            }
            if (name === 'nominalFill') node.fills = freshPaint(index, node);
            if (name === 'reference') {
              if (keys[index])
                node.componentPropertyReferences = {
                  ...node.componentPropertyReferences,
                  characters: keys[index],
                };
              else skipped = true;
            }
            if (name === 'layout') {
              node.textAutoResize = 'HEIGHT';
              node.layoutSizingHorizontal = 'FILL';
              node.layoutSizingVertical = 'HUG';
            }
            if (name === 'decoration') {
              node.textDecoration = 'UNDERLINE';
              node.textDecorationOffset = { unit: 'PERCENT', value: 15 };
              node.textWrapStyle = 'AUTO';
            }
            if (name === 'rangeFill')
              node.setRangeFills(
                0,
                node.characters.length,
                freshPaint(index, node)
              );
            await snapshot(`${phase}_${index}_${name}`, {
              index,
              name,
              targetId: node.id,
              skipped,
              guardUnchanged,
            });
          }
          const order = [
            'style',
            'characters',
            'nominalFill',
            'reference',
            'layout',
            'decoration',
            'rangeFill',
          ];
          await snapshot('unlinked');
          for (let index = 0; index < 2; index++)
            for (const name of order) await setter(index, name, 'initial');
          const initial = await snapshot('initial_complete');
          for (let index = 0; index < 2; index++) {
            const node = instance(masters[index]);
            node.name = `${condition.id} / ${index ? 'Edited Hover' : 'Fresh Default'}`;
            node.x = 600 + index * 240;
            node.y = caseIndex * 260;
            const child = node.findAll(item => item.type === 'TEXT')[0];
            if (!child)
              throw new Error('Diagnostic instance has no generated TEXT.');
            consumers.push({
              id: node.id,
              textId: child.id,
              index,
              edited: index === 1,
            });
            if (index === 1) {
              if (keys[index]) node.setProperties({ [keys[index]]: edited });
              else child.characters = edited;
            }
          }
          const before = await snapshot('consumers_ready');
          let repeated;
          for (const pass of [1, 2]) {
            for (let index = 0; index < 2; index++)
              for (const name of order)
                await setter(index, name, `repeat${pass}`);
            repeated = await snapshot(`repeat${pass}_complete`);
          }
          for (let index = 0; index < 2; index++)
            for (const name of ['nominalFill', 'rangeFill'])
              await setter(index, name, 'paintOnly');
          const paintOnly = await snapshot('paintOnly_freshLookup');
          for (let index = 0; index < 2; index++)
            for (const name of order)
              await setter(index, name, 'guarded', true);
          const guarded = await snapshot('guarded_complete');
          let detachedAfter;
          if (condition.detachTransition) {
            sample.beforeDetachment = await snapshot('detach_before');
            for (let index = 0; index < 2; index++)
              await setter(index, 'detachStyle', 'detach');
            detached = true;
            for (let index = 0; index < 2; index++)
              for (const name of [
                'directTypography',
                'decoration',
                'nominalFill',
                'rangeFill',
              ])
                await setter(index, name, 'detachRepair');
            sample.afterDetachment = await snapshot('detach_repainted');
            for (const pass of [1, 2]) {
              for (let index = 0; index < 2; index++)
                for (const name of [
                  'directTypography',
                  'characters',
                  'nominalFill',
                  'reference',
                  'layout',
                  'decoration',
                  'rangeFill',
                ])
                  await setter(index, name, `detachedRepeat${pass}`);
              detachedAfter = await snapshot(`detachedRepeat${pass}_complete`);
            }
          }
          const after = await snapshot('final');
          const typographyMatches = (node, index) =>
            JSON.stringify(json(node.fontName)) ===
              JSON.stringify(
                json(
                  detached || !condition.styled
                    ? font
                    : requestedStyles[index].fontName
                )
              ) &&
            node.fontSize === 16 &&
            (node.lineHeight?.unit === 'PERCENT'
              ? (node.lineHeight.value * node.fontSize) / 100
              : node.lineHeight?.unit === 'PIXELS'
                ? node.lineHeight.value
                : null) === 24 &&
            node.textDecoration === 'UNDERLINE' &&
            node.textDecorationOffset?.unit === 'PERCENT' &&
            node.textDecorationOffset.value === 15 &&
            node.textWrapStyle === 'AUTO';
          sample.findings = {
            initialRangeRolesMatch: initial.labels.every(
              node => node.sourceRangeMatches
            ),
            repeatedRangeRolesMatch: repeated.labels.every(
              node => node.sourceRangeMatches
            ),
            labelIdsStable:
              JSON.stringify(initial.labels.map(node => node.id)) ===
              JSON.stringify(after.labels.map(node => node.id)),
            propertyIdsStable: after.labels.every(
              (node, index) =>
                (node.references.characters || null) === keys[index]
            ),
            mainStyleIdsMatch: after.labels.every(
              (node, index) =>
                (node.textStyleId || '') ===
                (detached || !condition.styled ? '' : requestedStyles[index].id)
            ),
            consumerStyleIdsMatch: after.consumers.every(
              consumer =>
                (consumer.label.textStyleId || '') ===
                (detached || !condition.styled
                  ? ''
                  : requestedStyles[consumer.index].id)
            ),
            mainTypographyMatches: after.labels.every(typographyMatches),
            consumerTypographyMatches: after.consumers.every(consumer =>
              typographyMatches(consumer.label, consumer.index)
            ),
            consumerSourceRolesMatch: after.consumers.every(
              node => node.label.sourceRangeMatches
            ),
            consumerEditsRetained: after.consumers.every(
              node =>
                node.label.characters === node.requestedEdit &&
                (!node.propertyId ||
                  node.properties[node.propertyId]?.value ===
                    node.requestedEdit)
            ),
            consumerIdsStable:
              JSON.stringify(
                before.consumers.map(node => [node.id, node.label.id])
              ) ===
              JSON.stringify(
                after.consumers.map(node => [node.id, node.label.id])
              ),
            consumersAttached: after.consumers.every(
              (node, index) => node.actualMainComponentId === masters[index].id
            ),
          };
          sample.candidateFindings = {
            paintOnlyRangeRolesMatch: paintOnly.labels.every(
              node => node.sourceRangeMatches
            ),
            paintOnlyConsumerRangeRolesMatch: paintOnly.consumers.every(
              node => node.label.sourceRangeMatches
            ),
            guardedRangeRolesMatch: guarded.labels.every(
              node => node.sourceRangeMatches
            ),
            guardedConsumerRangeRolesMatch: guarded.consumers.every(
              node => node.label.sourceRangeMatches
            ),
            guardedSkips: sample.observations
              .filter(
                item => item.operation?.guardUnchanged && item.operation.skipped
              )
              .map(item => ({
                phase: item.phase,
                targetId: item.operation.targetId,
                setter: item.operation.name,
              })),
          };
          if (condition.detachTransition)
            sample.detachFindings = {
              beforeRangeRolesMatch: sample.beforeDetachment.labels.every(
                node => node.sourceRangeMatches
              ),
              repairedRangeRolesMatch: sample.afterDetachment.labels.every(
                node => node.sourceRangeMatches
              ),
              repeatedRangeRolesMatch: detachedAfter.labels.every(
                node => node.sourceRangeMatches
              ),
              consumerRangeRolesMatch: after.consumers.every(
                node => node.label.sourceRangeMatches
              ),
              styleIdsCleared: after.labels.every(
                node => node.textStyleId === ''
              ),
              consumerStyleIdsCleared: after.consumers.every(
                node => node.label.textStyleId === ''
              ),
              typographyMatches:
                after.labels.every(typographyMatches) &&
                after.consumers.every(consumer =>
                  typographyMatches(consumer.label, consumer.index)
                ),
              identitiesAndEditsRetained:
                sample.findings.labelIdsStable &&
                sample.findings.propertyIdsStable &&
                sample.findings.consumerIdsStable &&
                sample.findings.consumerEditsRetained &&
                sample.findings.consumersAttached,
            };
          if (condition.detachTransition) {
            sample.bindingRepairSource = {
              styleId: rangeSource.style.id,
              aliases: report.preflight.typographyBindings,
            };
            for (let index = 0; index < 2; index++)
              for (const name of [
                'directTypography',
                'decoration',
                'fontFamilyBinding',
                'fontSizeBinding',
                'nominalFill',
                'rangeFill',
              ])
                await setter(index, name, 'bindingRepair');
            const repaired = await snapshot('binding_repaired');
            let bindingRepeated;
            for (const pass of [1, 2]) {
              for (let index = 0; index < 2; index++)
                for (const name of [
                  'directTypography',
                  'characters',
                  'reference',
                  'layout',
                  'decoration',
                  'fontFamilyBinding',
                  'fontSizeBinding',
                  'nominalFill',
                  'rangeFill',
                ])
                  await setter(index, name, `bindingRepeat${pass}`);
              bindingRepeated = await snapshot(`bindingRepeat${pass}_complete`);
            }
            const boundAfter = await snapshot('binding_final');
            const bindingsMatch = node =>
              node.typographyBindingValues.length === 2 &&
              node.typographyBindingValues.every(
                binding => binding.sourceMatches
              );
            const editedBefore = after.consumers.find(node => node.edited);
            const editedAfter = boundAfter.consumers.find(node => node.edited);
            sample.bindingFindings = {
              repairedMainBindingsMatch: repaired.labels.every(bindingsMatch),
              repeatedMainBindingsMatch:
                bindingRepeated.labels.every(bindingsMatch),
              uneditedConsumerBindingsMatch: boundAfter.consumers
                .filter(node => !node.edited)
                .every(node => bindingsMatch(node.label)),
              mainRangeRolesMatch: boundAfter.labels.every(
                node => node.sourceRangeMatches
              ),
              consumerRangeRolesMatch: boundAfter.consumers.every(
                node => node.label.sourceRangeMatches
              ),
              mainTypographyMatches: boundAfter.labels.every(typographyMatches),
              consumerTypographyMatches: boundAfter.consumers.every(node =>
                typographyMatches(node.label, node.index)
              ),
              mainStyleIdsRemainDetached: boundAfter.labels.every(
                node => node.textStyleId === ''
              ),
              uneditedConsumerStyleRemainsDetached: boundAfter.consumers
                .filter(node => !node.edited)
                .every(node => node.label.textStyleId === ''),
              editedConsumerExactReadbackPreserved:
                JSON.stringify(editedBefore) === JSON.stringify(editedAfter),
              mainIdsAndPropertiesPreserved:
                JSON.stringify(
                  after.labels.map(node => [node.id, node.references])
                ) ===
                JSON.stringify(
                  boundAfter.labels.map(node => [node.id, node.references])
                ),
              consumerIdsAndPropertiesPreserved:
                JSON.stringify(
                  after.consumers.map(node => [
                    node.id,
                    node.label.id,
                    node.actualMainComponentId,
                    node.properties,
                  ])
                ) ===
                JSON.stringify(
                  boundAfter.consumers.map(node => [
                    node.id,
                    node.label.id,
                    node.actualMainComponentId,
                    node.properties,
                  ])
                ),
              sharedStyleAssociationSatisfied: false,
            };
          }
          sample.crossVariantChanges = [];
          for (let index = 1; index < sample.observations.length; index++) {
            const current = sample.observations[index],
              previous = sample.observations[index - 1];
            if (!current.operation || current.operation.skipped) continue;
            const peer = 1 - current.operation.index;
            if (
              JSON.stringify(current.labels[peer].range) !==
              JSON.stringify(previous.labels[peer].range)
            )
              sample.crossVariantChanges.push({
                phase: current.phase,
                setter: current.operation.name,
                targetId: current.operation.targetId,
                changedPeerId: current.labels[peer].id,
                before: previous.labels[peer].range,
                after: current.labels[peer].range,
              });
          }
          sample.supported = Object.values(sample.findings).every(Boolean);
        } catch (error) {
          sample.status = 'error';
          sample.errors.push(message(error));
          result.errors.push(`${condition.id}: ${message(error)}`);
          sample.supported = false;
        }
      }
      result.supported = result.cases[0].supported;
      result.findings = result.cases.map(sample => ({
        id: sample.id,
        property: sample.property,
        styled: sample.styled,
        status: sample.status,
        findings: sample.findings,
        candidateFindings: sample.candidateFindings,
        detachFindings: sample.detachFindings,
        bindingFindings: sample.bindingFindings,
        firstCrossVariantChange: sample.crossVariantChanges?.[0] || null,
      }));
    });
    report.ledgerRefresh = await refreshMangroveCapabilityProbeLedger(report);
    report.unrecordedDescendantIds = report.ledgerRefresh.unrecordedNodeIds;
    return report;
  }
  if (scope === 'toc-link-sizing') {
    await test('tocLinkSizing', async result => {
      result.interpretation =
        'Three actual native sizing patterns at three source-derived caps. A retained requested setting is not proof of CSS shrink-to-fit or live responsive geometry.';
      result.source = {
        file: 'stories/Components/TableOfContents/table-of-contents.scss',
        consumerWidths: [240, 390, 900],
        availableWidthBasis:
          'consumer width minus border2, padding20, marker allocation20 and link-leading2.5',
        firstStoryLink:
          'What is the Global Platform for Disaster Risk Reduction?',
        firstStoryLinkHeights: [77, 53, 29],
        firstStoryLinkWideWidth: 398.8125,
        unbrokenWideWidth: 636.625,
        browser: 'Chromium153.0.8010.47/macOS, UNDRR Latin source fixture',
      };
      const captions = [
        ['short', 'Short link'],
        ['first-story', result.source.firstStoryLink],
        [
          'long-words',
          'How does the Global Platform for DRR link to the Sustainable Development Goals and the Paris Agreement?',
        ],
        ['multiline', 'First explicit line\nSecond explicit line'],
        [
          'unbroken',
          'DisasterRiskReductionAndResilienceAcrossInternationalCommunitiesWithoutWordBreaks',
        ],
        ['short-restored', 'Short link'],
      ];
      result.diagnosticUnbrokenText = captions[4][1];
      result.diagnosticUnbrokenNote =
        'Exact explicit source research stress string. Its native font-file advance is not assumed equal to the source636.625px; narrow source overflows rather than splitting.';
      for (const [column, pattern] of [
        'frame-cap-hug-text',
        'frame-cap-fill-text',
        'direct-text-cap-hug-text',
      ].entries())
        for (const [row, cap] of [195.5, 345.5, 855.5].entries()) {
          const sample = {
            pattern,
            requestedCap: cap,
            consumerWidth: cap + 44.5,
            status: 'observed',
            observations: [],
            errors: [],
          };
          result.observations.push(sample);
          try {
            const caption = text(
              root,
              `${pattern} / ${sample.consumerWidth}px consumer`
            );
            sample.captionId = caption.id;
            caption.x = column * 940;
            caption.y = row * 280;
            caption.textAutoResize = 'WIDTH_AND_HEIGHT';
            const master = create('createComponent');
            sample.masterId = master.id;
            master.name = `TOC diagnostic / ${pattern} / ${sample.consumerWidth}px`;
            master.x = column * 940;
            master.y = row * 280 + 30;
            master.layoutMode = 'VERTICAL';
            master.fills = [];
            master.clipsContent = false;
            master.paddingTop = master.paddingBottom = 2.5;
            master.paddingLeft = master.paddingRight = 0;
            master.resize(cap, 29);
            master.layoutSizingHorizontal = master.layoutSizingVertical = 'HUG';
            if (pattern !== 'direct-text-cap-hug-text') master.maxWidth = cap;
            const label = text(master, captions[0][1]);
            label.name = 'TOC diagnostic editable Label';
            label.textDecoration = 'UNDERLINE';
            label.textDecorationOffset = { unit: 'PERCENT', value: 15 };
            label.textWrapStyle = 'AUTO';
            if (pattern === 'direct-text-cap-hug-text') label.maxWidth = cap;
            label.textAutoResize =
              pattern === 'frame-cap-fill-text' ? 'HEIGHT' : 'WIDTH_AND_HEIGHT';
            label.layoutSizingHorizontal =
              pattern === 'frame-cap-fill-text' ? 'FILL' : 'HUG';
            label.layoutSizingVertical = 'HUG';
            const property = master.addComponentProperty(
              'Label',
              'TEXT',
              captions[0][1]
            );
            sample.propertyId = property;
            label.componentPropertyReferences = { characters: property };
            const consumer = instance(master);
            sample.instanceId = consumer.id;
            consumer.name = `Edited TOC diagnostic / ${pattern} / ${sample.consumerWidth}px`;
            consumer.x = master.x;
            consumer.y = master.y + 110;
            const originalTextId = consumer.findAll(
              node => node.type === 'TEXT'
            )[0]?.id;
            if (!originalTextId)
              throw new Error('Diagnostic instance has no Label text.');
            async function snapshot(phase, requestedCharacters) {
              // Fresh lookup is essential if the native API regenerates handles.
              const fresh = await figma.getNodeByIdAsync(consumer.id);
              const current = fresh?.findAll(node => node.type === 'TEXT')[0];
              if (!fresh || !current)
                throw new Error('Diagnostic instance or Label disappeared.');
              const freshMaster = await figma.getNodeByIdAsync(master.id);
              const currentMain = await fresh.getMainComponentAsync();
              const nodeMetrics = node => ({
                ...bounds(node),
                layoutSizingHorizontal: node.layoutSizingHorizontal,
                layoutSizingVertical: node.layoutSizingVertical,
                maxWidth: node.maxWidth ?? null,
                clipsContent: node.clipsContent,
                paddingTop: node.paddingTop,
                paddingBottom: node.paddingBottom,
                paddingLeft: node.paddingLeft,
                paddingRight: node.paddingRight,
                absoluteRenderBounds: node.absoluteRenderBounds,
              });
              const observation = {
                phase,
                requestedCharacters,
                propertyId: property,
                property: fresh.componentProperties[property],
                masterProperty:
                  freshMaster.componentPropertyDefinitions[property],
                characters: current.characters,
                master: nodeMetrics(freshMaster),
                masterText: nodeMetrics(
                  freshMaster.findAll(node => node.type === 'TEXT')[0]
                ),
                instance: nodeMetrics(fresh),
                text: nodeMetrics(current),
                textAutoResize: current.textAutoResize,
                fontName: current.fontName,
                fontSize: current.fontSize,
                lineHeight: current.lineHeight,
                textWrapStyle: current.textWrapStyle,
                textDecoration: current.textDecoration,
                textDecorationOffset: current.textDecorationOffset,
                componentPropertyReferences:
                  current.componentPropertyReferences,
                actualMainComponentId: currentMain?.id || null,
                stableTextId: current.id === originalTextId,
              };
              sample.observations.push(observation);
              return observation;
            }
            for (const [phase, characters] of captions) {
              consumer.setProperties({ [property]: characters });
              await Promise.resolve();
              await snapshot(phase, characters);
            }
            const edited =
              'Edited source link label retained after a master cap write';
            consumer.setProperties({ [property]: edited });
            await snapshot('before-master-cap-write', edited);
            const nextCap = cap - 10;
            sample.rewrittenMasterCap = nextCap;
            if (pattern === 'direct-text-cap-hug-text')
              label.maxWidth = nextCap;
            else master.maxWidth = nextCap;
            await Promise.resolve();
            const after = await snapshot('after-master-cap-write', edited);
            const [short, firstStory, , multiline, unbroken, restored] =
              sample.observations;
            sample.criteria = {
              propertyTextPropagates: sample.observations.every(
                item =>
                  item.characters === item.requestedCharacters &&
                  item.property?.value === item.requestedCharacters
              ),
              stableTextIds: sample.observations.every(
                item => item.stableTextId
              ),
              attachedToOwnedMaster: sample.observations.every(
                item => item.actualMainComponentId === master.id
              ),
              shortHugsBelowCap: short.instance.width < cap - 0.01,
              normalLinkCapsAndGrows:
                firstStory.instance.width <= cap + 0.01 &&
                firstStory.text.width <= cap + 0.01 &&
                firstStory.instance.height >= short.instance.height &&
                (cap >= result.source.firstStoryLinkWideWidth ||
                  firstStory.text.height > short.text.height),
              multilineGrowsVertically:
                multiline.instance.height > short.instance.height,
              shortRestores:
                Math.abs(restored.instance.width - short.instance.width) <
                  0.01 &&
                Math.abs(restored.instance.height - short.instance.height) <
                  0.01,
              verticalHugRetained: sample.observations.every(
                item => item.instance.layoutSizingVertical === 'HUG'
              ),
              horizontalHugRetained: sample.observations.every(
                item => item.instance.layoutSizingHorizontal === 'HUG'
              ),
              editedLabelRetainedAfterMasterWrite:
                after.characters === edited &&
                after.property?.value === edited &&
                after.stableTextId,
              masterCapWriteRetained:
                (pattern === 'direct-text-cap-hug-text'
                  ? after.masterText.maxWidth
                  : after.master.maxWidth) === nextCap,
            };
            sample.sourceComparison = {
              firstStoryLinkExpectedHeight:
                result.source.firstStoryLinkHeights[row],
              firstStoryLinkActualHeight: firstStory.instance.height,
              firstStoryLinkHeightMatches:
                Math.abs(
                  firstStory.instance.height -
                    result.source.firstStoryLinkHeights[row]
                ) < 0.01,
              stressOverflowsCap: unbroken.instance.width > cap + 0.01,
              note: 'Unbroken stress text is diagnostic; normal source word wrapping and exact glyph widths are independently judged from actual font/PNG evidence.',
            };
            sample.supported = Object.values(sample.criteria).every(Boolean);
          } catch (error) {
            sample.status = 'error';
            sample.errors.push(message(error));
            result.errors.push(
              `${pattern}/${sample.consumerWidth}px: ${message(error)}`
            );
            sample.supported = false;
          }
        }
      result.supported = [
        'frame-cap-hug-text',
        'frame-cap-fill-text',
        'direct-text-cap-hug-text',
      ].some(pattern =>
        result.observations
          .filter(sample => sample.pattern === pattern)
          .every(sample => sample.supported)
      );
    });
    report.ledgerRefresh = await refreshMangroveCapabilityProbeLedger(report);
    report.unrecordedDescendantIds = report.ledgerRefresh.unrecordedNodeIds;
    return report;
  }
  await test('legend', async result => {
    result.fallback =
      'Use an explicit measured legend sizing pass if either native text configuration fails the bounds criteria.';
    for (const autoResize of ['WIDTH_AND_HEIGHT', 'HEIGHT']) {
      const sample = { autoResize, observations: [], errors: [] };
      result.observations.push(sample);
      try {
        const master = create('createComponent');
        master.name = `Legend ${autoResize}`;
        master.x = autoResize === 'HEIGHT' ? 360 : 0;
        master.layoutMode = 'VERTICAL';
        master.paddingLeft = master.paddingRight = 11;
        master.fills = [];
        master.resize(320, 24);
        master.layoutSizingHorizontal = 'FIXED';
        master.layoutSizingVertical = 'HUG';
        const legend = text(master, 'Risk level');
        legend.maxWidth = 298;
        legend.textAutoResize = autoResize;
        legend.layoutSizingHorizontal = 'HUG';
        legend.layoutSizingVertical = 'HUG';
        const property = master.addComponentProperty(
          'Legend',
          'TEXT',
          'Risk level'
        );
        legend.componentPropertyReferences = { characters: property };
        const consumer = instance(master);
        consumer.x = master.x;
        consumer.y = 180;
        sample.masterId = master.id;
        sample.instanceId = consumer.id;
        const legendId = consumer.children[0].id;
        for (const [width, characters] of [
          [320, 'Risk level'],
          [
            320,
            'A long legend describing disaster risk reduction choices and community resilience planning',
          ],
          [
            240,
            'A long legend describing disaster risk reduction choices and community resilience planning',
          ],
          [240, 'Risk level'],
          [320, 'Risk level'],
        ]) {
          consumer.setProperties({ [property]: characters });
          consumer.resize(width, consumer.height);
          consumer.layoutSizingVertical = 'HUG';
          const child = consumer.children[0];
          child.maxWidth = width - 22;
          await Promise.resolve();
          sample.observations.push({
            requestedWidth: width,
            requestedCharacters: characters,
            instance: bounds(consumer),
            legend: bounds(child),
            characters: child.characters,
            textAutoResize: child.textAutoResize,
            fontName: child.fontName,
            fontSize: child.fontSize,
            lineHeight: child.lineHeight,
            maxWidth: child.maxWidth,
            layoutSizingHorizontal: child.layoutSizingHorizontal,
            layoutSizingVertical: child.layoutSizingVertical,
            stableLegendId: child.id === legendId,
          });
        }
        const [short, long, narrow, narrowShort, repeated] =
          sample.observations;
        sample.criteria = {
          propertyTextPropagates: sample.observations.every(
            item => item.characters === item.requestedCharacters
          ),
          stableIds: sample.observations.every(item => item.stableLegendId),
          shortHugs: short.legend.width < 298 && narrowShort.legend.width < 218,
          longCapsAndWraps:
            long.legend.width <= 298.01 &&
            long.legend.height > short.legend.height,
          narrowCapsAndWraps:
            narrow.legend.width <= 218.01 &&
            narrow.legend.height >= long.legend.height,
          shortRestores:
            Math.abs(repeated.legend.width - short.legend.width) < 0.01 &&
            Math.abs(repeated.legend.height - short.legend.height) < 0.01,
        };
        sample.supported = Object.values(sample.criteria).every(Boolean);
      } catch (error) {
        sample.errors.push(message(error));
        sample.supported = false;
      }
    }
    result.supported = result.observations.some(item => item.supported);
  });
  await test('textPropertyStyles', async result => {
    result.interpretation =
      'Diagnostic observations only. No canonical component repair or migration is authorised by this result.';
    result.phase = 'stylePreflight';
    const roles = ['label', 'label-hover', 'label-focus'];
    const available = await figma.getLocalTextStylesAsync();
    const selected = roles.map(role => {
      const matches = available.filter(
        style =>
          mgReadIdentity(style, 'mgStyleId') ===
          `component.editorial-cta.${role}`
      );
      if (matches.length !== 1)
        throw new Error(
          `Import one unambiguous editorial CTA ${role} style first.`
        );
      return matches[0];
    });
    result.sourceStyleIds = selected.map(style => style.id);
    result.sourceStyles = selected.map(style => ({
      id: style.id,
      fontName: style.fontName,
      fontSize: style.fontSize,
      textDecoration: style.textDecoration,
    }));
    for (const style of selected) {
      report.fonts.requested.push({ ...style.fontName });
      await figma.loadFontAsync(style.fontName);
      report.fonts.loaded.push({ ...style.fontName });
    }
    const components = roles.map((role, index) => {
      const component = create('createComponent');
      component.name = `State=${role}`;
      component.resize(320, 80);
      component.x = index * 360;
      component.y = 500;
      return component;
    });
    const set = record(figma.combineAsVariants(components, root), false);
    set.name = 'Text property style isolation capability';
    set.x = 0;
    set.y = 500;
    result.setId = set.id;
    const labels = components.map(component =>
      text(component, 'Shared probe label')
    );
    const ids = labels.map(node => node.id);
    result.labelIds = ids;
    const property = set.addComponentProperty(
      'Label',
      'TEXT',
      'Shared probe label'
    );
    result.propertyId = property;
    const requested = selected.map((style, index) => ({
      styleId: style.id,
      decoration: index ? 'UNDERLINE' : 'NONE',
      offset: index === 1 ? { unit: 'PERCENT', value: 20 } : { unit: 'AUTO' },
    }));
    result.requested = requested;
    async function snapshot(phase, targetIds = ids) {
      result.phase = phase;
      const observation = { phase, labels: [], errors: [] };
      result.observations.push(observation);
      for (const id of targetIds) {
        const item = { id, errors: [] };
        observation.labels.push(item);
        try {
          const node = await figma.getNodeByIdAsync(id);
          if (!node || node.removed)
            throw new Error('Probe Label lookup is missing or removed.');
          if (mgReadIdentity(node, MG_CAPABILITY_KEY) !== report.runId)
            throw new Error('Probe Label ownership changed.');
          Object.assign(item, {
            parentId: node.parent?.id || null,
            textStyleId: node.textStyleId,
            textDecoration: node.textDecoration,
            textDecorationOffset: node.textDecorationOffset,
            characters: node.characters,
            fontName: node.fontName,
            fontSize: node.fontSize,
            references: { ...node.componentPropertyReferences },
          });
        } catch (error) {
          item.errors.push(message(error));
          observation.errors.push(`${id}: ${message(error)}`);
        }
      }
      if (observation.errors.length)
        throw new Error(observation.errors.join('; '));
      return observation;
    }
    async function applyStyle(index, id = ids[index]) {
      const node = await figma.getNodeByIdAsync(id);
      if (!node || node.removed)
        throw new Error(
          'Probe Label is unavailable for its exact style write.'
        );
      await node.setTextStyleIdAsync(requested[index].styleId);
      node.textDecoration = requested[index].decoration;
      if (node.textDecoration === 'UNDERLINE')
        node.textDecorationOffset = { ...requested[index].offset };
    }
    for (let index = 0; index < ids.length; index++) await applyStyle(index);
    const initial = await snapshot('A_unlinkedStyles');
    for (let index = 0; index < ids.length; index++) {
      const node = await figma.getNodeByIdAsync(ids[index]);
      node.componentPropertyReferences = {
        ...node.componentPropertyReferences,
        characters: property,
      };
      await snapshot(`B_bindSharedLabel_${index}`);
    }
    const linked = await snapshot('B_allLinked');
    const first = await figma.getNodeByIdAsync(ids[0]);
    await first.setTextStyleIdAsync(requested[0].styleId);
    const styleWrite = await snapshot('C_linkedFirstStyleSetter');
    first.textDecoration = requested[0].decoration;
    await snapshot('C_linkedFirstDecorationWrite');
    first.characters = 'Changed shared probe label';
    const characterWrite = await snapshot('C_linkedFirstCharactersWrite');
    await applyStyle(2);
    const lastStyleWrite = await snapshot('C_linkedLastStyleWrite');
    // Detach only the exact reference this private probe assigned. Other
    // references are retained, and no property is renamed or deleted.
    for (const id of ids) {
      const node = await figma.getNodeByIdAsync(id);
      const references = { ...node.componentPropertyReferences };
      if (references.characters !== property)
        throw new Error('Probe Label reference changed before detachment.');
      delete references.characters;
      node.componentPropertyReferences = references;
    }
    await snapshot('D_allDetached');
    for (let index = 0; index < ids.length; index++) {
      await applyStyle(index);
      await snapshot(`D_unlinkedStyleWrite_${index}`);
    }
    const restored = await snapshot('D_unlinkedStylesRestored');
    for (let index = 0; index < ids.length; index++) {
      const node = await figma.getNodeByIdAsync(ids[index]);
      node.componentPropertyReferences = {
        ...node.componentPropertyReferences,
        characters: property,
      };
      await snapshot(`D_relinkSharedLabel_${index}`);
    }
    const relinked = await snapshot('D_allRelinked');
    const styleIds = stage => stage.labels.map(item => item.textStyleId);
    const matchesRequested = stage =>
      stage.labels.every(
        (item, index) =>
          item.textStyleId === requested[index].styleId &&
          item.textDecoration === requested[index].decoration &&
          JSON.stringify(item.textDecorationOffset) ===
            JSON.stringify(index ? requested[index].offset : null)
      );
    result.findings = {
      initialStylesMatchRequested: matchesRequested(initial),
      linkingRetainsRequestedStyles: matchesRequested(linked),
      linkedFirstStyleChangesOtherStyleIds: styleWrite.labels.some(
        (item, index) =>
          index > 0 && item.textStyleId !== linked.labels[index].textStyleId
      ),
      linkedCharactersChangeStyleIds:
        JSON.stringify(styleIds(characterWrite)) !==
        JSON.stringify(styleIds(styleWrite)),
      linkedLastStyleChangesOtherStyleIds: lastStyleWrite.labels.some(
        (item, index) =>
          index < 2 &&
          item.textStyleId !== characterWrite.labels[index].textStyleId
      ),
      detachedStylesMatchRequested: matchesRequested(restored),
      relinkingRetainsRequestedStyles: matchesRequested(relinked),
    };
    async function consumerSnapshot(phase, consumers) {
      const observation = { phase, consumers: [], errors: [] };
      result.observations.push(observation);
      result.phase = phase;
      for (const source of consumers) {
        const item = { id: source.id, errors: [] };
        observation.consumers.push(item);
        try {
          const node = await figma.getNodeByIdAsync(source.id);
          if (
            !node ||
            node.removed ||
            mgReadIdentity(node, MG_CAPABILITY_KEY) !== report.runId
          )
            throw new Error('The exact owned text consumer is unavailable.');
          const main = await node.getMainComponentAsync();
          item.mainComponentId = main?.id || null;
          item.properties = node.componentProperties;
          const children = await mgCapabilityFreshChildren(node);
          if (children.length !== 1 || children[0].type !== 'TEXT')
            throw new Error(
              'Text consumer must resolve exactly one TEXT child.'
            );
          const labelNode = children[0];
          if (mgReadIdentity(labelNode, MG_CAPABILITY_KEY) !== report.runId)
            throw new Error('Text consumer child ownership changed.');
          item.label = {
            id: labelNode.id,
            characters: labelNode.characters,
            textStyleId: labelNode.textStyleId,
            textDecoration: labelNode.textDecoration,
            textDecorationOffset: labelNode.textDecorationOffset,
            references: { ...labelNode.componentPropertyReferences },
          };
        } catch (error) {
          item.errors.push(message(error));
          observation.errors.push(`${source.id}: ${message(error)}`);
        }
      }
      if (observation.errors.length)
        throw new Error(observation.errors.join('; '));
      return observation;
    }
    async function editConsumers(consumers, prefix) {
      const before = await consumerSnapshot(
        `${prefix}_beforeConsumerEdit`,
        consumers
      );
      for (let index = 0; index < consumers.length; index++) {
        const reference = before.consumers[index].label.references.characters;
        const current = await figma.getNodeByIdAsync(consumers[index].id);
        if (
          !reference ||
          current.componentProperties[reference]?.type !== 'TEXT'
        )
          throw new Error(
            'Consumer Label reference does not match its TEXT property.'
          );
        current.setProperties({
          [reference]: `${prefix} edited label ${index}`,
        });
      }
      const refresh = await refreshMangroveCapabilityProbeLedger(report);
      if (refresh.errors.length) throw new Error(refresh.errors.join('; '));
      for (const item of report.ledger) recorded.add(item.id);
      const edited = await consumerSnapshot(
        `${prefix}_afterConsumerEdit`,
        consumers
      );
      return { before, edited };
    }
    const consumerChecks = (observed, edited, prefix) => ({
      labelsMatchEdits: observed.consumers.every(
        (item, index) =>
          item.label.characters === `${prefix} edited label ${index}`
      ),
      labelIdsStable: observed.consumers.every(
        (item, index) =>
          item.label.id === edited.before.consumers[index].label.id
      ),
      mainComponentIdsStable: observed.consumers.every(
        (item, index) =>
          item.mainComponentId ===
          edited.before.consumers[index].mainComponentId
      ),
      referenceIdsStable: observed.consumers.every(
        (item, index) =>
          item.label.references.characters ===
          edited.before.consumers[index].label.references.characters
      ),
      propertyValuesMatchEdits: observed.consumers.every(
        (item, index) =>
          item.properties[item.label.references.characters]?.value ===
          `${prefix} edited label ${index}`
      ),
      styleIdsMatchRequested: observed.consumers.every(
        (item, index) => item.label.textStyleId === requested[index].styleId
      ),
      decorationsMatchRequested: observed.consumers.every(
        (item, index) =>
          item.label.textDecoration === requested[index].decoration
      ),
      offsetsMatchRequested: observed.consumers.every(
        (item, index) =>
          JSON.stringify(item.label.textDecorationOffset) ===
          JSON.stringify(index ? requested[index].offset : null)
      ),
    });
    result.perVariantProperties = { status: 'observed', errors: [] };
    try {
      result.phase = 'E_createSeparateProperties';
      const separate = [];
      const separateIds = [];
      const createdPropertyIds = [];
      for (let index = 0; index < roles.length; index++) {
        const component = create('createComponent');
        component.name = `State=${roles[index]}`;
        component.resize(320, 80);
        component.x = index * 360;
        const labelNode = text(component, 'Per-variant probe label');
        separate.push(component);
        separateIds.push(labelNode.id);
        await applyStyle(index, labelNode.id);
        const reference = component.addComponentProperty(
          'Label',
          'TEXT',
          'Per-variant probe label'
        );
        createdPropertyIds.push(reference);
        labelNode.componentPropertyReferences = { characters: reference };
      }
      const preCombine = await snapshot('E_beforeCombine', separateIds);
      const standaloneDefinitions = separate.map(node => ({
        id: node.id,
        definitions: node.componentPropertyDefinitions,
      }));
      result.perVariantProperties.standaloneComponentDefinitions =
        standaloneDefinitions;
      result.phase = 'E_combine';
      const separateSet = record(
        figma.combineAsVariants(separate, root),
        false
      );
      separateSet.name = 'Properties before combining capability';
      separateSet.x = 0;
      separateSet.y = 620;
      result.phase = 'E_combinedDefinitions';
      Object.assign(result.perVariantProperties, {
        setId: separateSet.id,
        componentIds: separate.map(node => node.id),
        labelIds: separateIds,
        createdPropertyIds,
        combinedDefinitions: separateSet.componentPropertyDefinitions,
      });
      const combined = await snapshot('E_afterCombine', separateIds);
      const consumers = separate.map((component, index) => {
        const node = instance(component);
        node.x = index * 360;
        node.y = 720;
        return node;
      });
      result.perVariantProperties.instanceIds = consumers.map(node => node.id);
      const edited = await editConsumers(consumers, 'E');
      for (let index = 0; index < separateIds.length; index++) {
        await applyStyle(index, separateIds[index]);
        await snapshot(`E_repeatMainStyleWrite_${index}`, separateIds);
        await consumerSnapshot(`E_consumersAfterMainWrite_${index}`, consumers);
      }
      const repeated = await snapshot('E_mainStylesAfterRepeat', separateIds);
      const finalConsumers = await consumerSnapshot(
        'E_finalConsumers',
        consumers
      );
      result.perVariantProperties.findings = {
        beforeCombineMatchesRequested: matchesRequested(preCombine),
        afterCombineMatchesRequested: matchesRequested(combined),
        repeatMatchesRequested: matchesRequested(repeated),
        createdPropertyIdsRetained: combined.labels.every(
          (item, index) =>
            item.references.characters === createdPropertyIds[index]
        ),
        afterConsumerEdit: consumerChecks(edited.edited, edited, 'E'),
        afterMainRepeat: consumerChecks(finalConsumers, edited, 'E'),
      };
    } catch (error) {
      result.perVariantProperties.status = 'error';
      result.perVariantProperties.failedPhase = result.phase;
      result.perVariantProperties.errors.push(message(error));
    }
    result.rangeSetters = { status: 'observed', errors: [] };
    try {
      result.phase = 'F_rangePreflight';
      const current = await figma.getNodeByIdAsync(ids[0]);
      result.rangeSetters.api = {
        setRangeTextStyleIdAsync:
          typeof current.setRangeTextStyleIdAsync === 'function',
        setRangeTextDecoration:
          typeof current.setRangeTextDecoration === 'function',
      };
      if (!Object.values(result.rangeSetters.api).every(Boolean)) {
        result.rangeSetters.status = 'unavailable';
      } else {
        async function applyRangeStyles(prefix) {
          for (let index = 0; index < ids.length; index++) {
            const node = await figma.getNodeByIdAsync(ids[index]);
            if (
              !node ||
              node.removed ||
              mgReadIdentity(node, MG_CAPABILITY_KEY) !== report.runId ||
              node.componentPropertyReferences?.characters !== property
            )
              throw new Error(
                'Full-range writes require the exact owned linked Label.'
              );
            const end = node.characters.length;
            if (!end)
              throw new Error(
                'Full-range writes require non-empty characters.'
              );
            await node.setRangeTextStyleIdAsync(
              0,
              end,
              requested[index].styleId
            );
            await snapshot(`${prefix}_styleSetter_${index}`);
            node.setRangeTextDecoration(0, end, requested[index].decoration);
            await snapshot(`${prefix}_decorationSetter_${index}`);
            if (requested[index].decoration === 'UNDERLINE') {
              node.textDecorationOffset = { ...requested[index].offset };
              await snapshot(`${prefix}_wholeNodeOffset_${index}`);
            }
          }
        }
        await applyRangeStyles('F_initial');
        const rangeStyled = await snapshot('F_allRangeStyled');
        const consumers = components.map((component, index) => {
          const node = instance(component);
          node.x = index * 360;
          node.y = 820;
          return node;
        });
        result.rangeSetters.instanceIds = consumers.map(node => node.id);
        const edited = await editConsumers(consumers, 'F');
        await applyRangeStyles('F_repeat');
        const repeated = await snapshot('F_afterRepeat');
        const finalConsumers = await consumerSnapshot(
          'F_finalConsumers',
          consumers
        );
        result.rangeSetters.findings = {
          initialMatchesRequested: matchesRequested(rangeStyled),
          repeatMatchesRequested: matchesRequested(repeated),
          sharedReferenceIdsRetained: repeated.labels.every(
            item => item.references.characters === property
          ),
          afterConsumerEdit: consumerChecks(edited.edited, edited, 'F'),
          afterMainRepeat: consumerChecks(finalConsumers, edited, 'F'),
        };
      }
    } catch (error) {
      result.rangeSetters.status = 'error';
      result.rangeSetters.failedPhase = result.phase;
      result.rangeSetters.errors.push(message(error));
    }
    result.existingSetRepair = { status: 'observed', errors: [] };
    try {
      const repair = result.existingSetRepair;
      result.phase = 'G_preflight';
      const originalOrder = set.children.map(node => node.id);
      const originalNames = [];
      const originalCharacters = [];
      for (const id of ids) {
        const node = await figma.getNodeByIdAsync(id);
        originalNames.push(node.name);
        originalCharacters.push(node.characters);
        if (node.componentPropertyReferences?.characters !== property)
          throw new Error('G requires the original shared Label reference.');
      }
      repair.original = {
        setId: set.id,
        componentIds: components.map(node => node.id),
        textIds: [...ids],
        propertyId: property,
        definitions: JSON.parse(
          JSON.stringify(set.componentPropertyDefinitions)
        ),
        order: originalOrder,
        textNames: originalNames,
        textCharacters: originalCharacters,
      };
      const editedConsumers = components.map((component, index) => {
        const node = instance(component);
        node.x = index * 360;
        node.y = 920;
        return node;
      });
      await editConsumers(editedConsumers, 'G');
      const untouchedConsumers = components.map((component, index) => {
        const node = instance(component);
        node.x = index * 360;
        node.y = 1020;
        return node;
      });
      const existingConsumers = [...editedConsumers, ...untouchedConsumers];
      repair.existingInstanceIds = existingConsumers.map(node => node.id);
      const baseline = await consumerSnapshot(
        'G_existingBaseline',
        existingConsumers
      );
      const mainStylesMatch = stage =>
        stage.labels.every(
          (item, index) =>
            item.textStyleId === requested[index].styleId &&
            item.textDecoration === requested[index].decoration
        );
      const offsetsMatch = stage =>
        stage.labels.every(
          (item, index) =>
            JSON.stringify(item.textDecorationOffset) ===
            JSON.stringify(index ? requested[index].offset : null)
        );
      async function invariantSnapshot(phase) {
        const mains = await snapshot(`${phase}_mains`);
        const consumers = await consumerSnapshot(
          `${phase}_existingConsumers`,
          existingConsumers
        );
        const currentSet = await figma.getNodeByIdAsync(set.id);
        const definitions =
          currentSet && !currentSet.removed
            ? currentSet.componentPropertyDefinitions
            : null;
        const childIds =
          currentSet && !currentSet.removed
            ? currentSet.children.map(node => node.id)
            : null;
        const criteria = {
          setIdPreserved: Boolean(
            currentSet &&
            !currentSet.removed &&
            mgReadIdentity(currentSet, MG_CAPABILITY_KEY) === report.runId
          ),
          originalPropertyPresent: definitions?.[property]?.type === 'TEXT',
          originalPropertyDefinitionPreserved:
            JSON.stringify(definitions?.[property]) ===
            JSON.stringify(repair.original.definitions[property]),
          componentOrderPreserved:
            JSON.stringify(childIds) === JSON.stringify(originalOrder),
          mainTextIdsPreserved: mains.labels.every(
            (item, index) => item.id === ids[index]
          ),
          mainTextParentsPreserved: mains.labels.every(
            (item, index) => item.parentId === components[index].id
          ),
          mainCharactersPreserved: mains.labels.every(
            (item, index) => item.characters === originalCharacters[index]
          ),
          originalReferencesPreserved: mains.labels.every(
            item => item.references.characters === property
          ),
          consumerTextIdsPreserved: consumers.consumers.every(
            (item, index) =>
              item.label.id === baseline.consumers[index].label.id
          ),
          consumerMainIdsPreserved: consumers.consumers.every(
            (item, index) =>
              item.mainComponentId === baseline.consumers[index].mainComponentId
          ),
          consumerReferencesPreserved: consumers.consumers.every(
            item => item.label.references.characters === property
          ),
          consumerCharactersPreserved: consumers.consumers.every(
            (item, index) =>
              item.label.characters ===
              baseline.consumers[index].label.characters
          ),
          consumerPropertyValuesPreserved: consumers.consumers.every(
            (item, index) =>
              item.properties[property]?.value ===
              baseline.consumers[index].properties[property]?.value
          ),
        };
        result.observations.push({
          phase,
          operation: 'existingSetRepairInvariants',
          criteria,
          definitions,
          errors: [],
        });
        const failed = Object.entries(criteria)
          .filter(([, passed]) => !passed)
          .map(([name]) => name);
        if (failed.length)
          throw new Error(
            `G stopped to preserve original identity and consumer edits: ${failed.join(', ')}.`
          );
        return { mains, consumers, criteria };
      }
      async function freshConsumersSnapshot(phase) {
        const consumers = components.map((component, index) => {
          const node = instance(component);
          node.x = index * 360;
          node.y = 1120 + 100 * repair.freshBatches.length;
          return node;
        });
        repair.freshBatches.push({
          phase,
          instanceIds: consumers.map(node => node.id),
        });
        const observed = await consumerSnapshot(phase, consumers);
        return {
          stylesMatchRequested: observed.consumers.every(
            (item, index) =>
              item.label.textStyleId === requested[index].styleId &&
              item.label.textDecoration === requested[index].decoration
          ),
          offsetsMatchRequested: observed.consumers.every(
            (item, index) =>
              JSON.stringify(item.label.textDecorationOffset) ===
              JSON.stringify(index ? requested[index].offset : null)
          ),
          originalReferenceIds: observed.consumers.every(
            item => item.label.references.characters === property
          ),
        };
      }
      repair.freshBatches = [];
      result.phase = 'G0_uniqueNames';
      for (let index = 0; index < ids.length; index++) {
        const node = await figma.getNodeByIdAsync(ids[index]);
        node.name = `Private probe label ${roles[index]}`;
      }
      try {
        for (let index = 0; index < ids.length; index++) {
          await applyStyle(index);
          await snapshot(`G0_uniqueNameStyleWrite_${index}`);
        }
        const observed = await invariantSnapshot('G0_afterStyleWrites');
        repair.uniqueNames = {
          mainStylesMatchRequested: mainStylesMatch(observed.mains),
          mainOffsetsMatchRequested: offsetsMatch(observed.mains),
          freshConsumers: await freshConsumersSnapshot('G0_freshConsumers'),
        };
      } finally {
        for (let index = 0; index < ids.length; index++) {
          const node = await figma.getNodeByIdAsync(ids[index]);
          if (
            node &&
            !node.removed &&
            mgReadIdentity(node, MG_CAPABILITY_KEY) === report.runId
          )
            node.name = originalNames[index];
        }
      }
      await invariantSnapshot('G0_namesRestored');
      repair.cycles = [];
      for (let cycle = 0; cycle < 2; cycle++) {
        for (let index = 0; index < components.length; index++) {
          result.phase = `G1_cycle${cycle}_variant${index}_preflight`;
          const component = await figma.getNodeByIdAsync(components[index].id);
          const node = await figma.getNodeByIdAsync(ids[index]);
          const currentSet = await figma.getNodeByIdAsync(set.id);
          if (
            !component ||
            component.removed ||
            !node ||
            node.removed ||
            !currentSet ||
            currentSet.removed ||
            currentSet.children.length < 2 ||
            component.parent?.id !== set.id ||
            node.parent?.id !== component.id ||
            mgReadIdentity(component, MG_CAPABILITY_KEY) !== report.runId ||
            mgReadIdentity(node, MG_CAPABILITY_KEY) !== report.runId ||
            node.componentPropertyReferences?.characters !== property
          )
            throw new Error(
              'G1 refused to move an unavailable, foreign or last variant.'
            );
          const originalIndex = currentSet.children.findIndex(
            child => child.id === component.id
          );
          const position = { x: component.x, y: component.y };
          const references = { ...node.componentPropertyReferences };
          delete references.characters;
          node.componentPropertyReferences = references;
          try {
            result.phase = `G1_cycle${cycle}_variant${index}_standalone`;
            root.appendChild(component);
            await applyStyle(index);
            const localProperty = component.addComponentProperty(
              'Label',
              'TEXT',
              node.characters
            );
            node.componentPropertyReferences = {
              ...node.componentPropertyReferences,
              characters: localProperty,
            };
            result.observations.push({
              phase: result.phase,
              operation: 'standalonePropertyRepair',
              errors: [],
              componentId: component.id,
              textId: node.id,
              oldSetPropertyId: property,
              localPropertyId: localProperty,
              definitions: component.componentPropertyDefinitions,
              remainingSetChildIds: currentSet.children.map(child => child.id),
            });
            await snapshot(`${result.phase}_readback`);
          } finally {
            if (
              !component.removed &&
              !currentSet.removed &&
              component.parent?.id !== currentSet.id
            )
              currentSet.insertChild(originalIndex, component);
            if (!component.removed) {
              component.x = position.x;
              component.y = position.y;
            }
          }
          await invariantSnapshot(`G1_cycle${cycle}_variant${index}_returned`);
        }
        const observed = await invariantSnapshot(`G1_cycle${cycle}_complete`);
        repair.cycles.push({
          cycle,
          originalIdentityAndEditsPreserved: Object.values(
            observed.criteria
          ).every(Boolean),
          mainStylesMatchRequested: mainStylesMatch(observed.mains),
          mainOffsetsMatchRequested: offsetsMatch(observed.mains),
          freshConsumers: await freshConsumersSnapshot(
            `G1_cycle${cycle}_freshConsumers`
          ),
        });
      }
    } catch (error) {
      result.existingSetRepair.status = 'error';
      result.existingSetRepair.failedPhase = result.phase;
      result.existingSetRepair.errors.push(message(error));
    }
    result.phase = 'complete';
    // This test identifies propagation, not production repair acceptance.
    result.supported = false;
  });
  await test('slot', async result => {
    result.fallback =
      'Use labelled fixed-count source story compositions until native editable slot behavior passes.';
    const master = create('createComponent');
    master.name = 'Editable slot capability';
    master.x = 720;
    master.resize(320, 120);
    result.masterId = master.id;
    result.createSlotAvailable = typeof master.createSlot === 'function';
    if (!result.createSlotAvailable) {
      result.status = 'unsupported';
      result.supported = false;
      return;
    }
    const slot = record(master.createSlot());
    slot.name = 'Probe content';
    slot.layoutMode = 'VERTICAL';
    slot.resize(298, 80);
    const property = slot.componentPropertyReferences?.slotContentId;
    result.slotType = slot.type;
    result.slotPropertyId = property;
    if (!property) throw new Error('createSlot did not expose slotContentId.');
    const childMaster = create('createComponent');
    childMaster.name = 'Private slot child';
    childMaster.x = 720;
    childMaster.y = 300;
    childMaster.resize(120, 24);
    const label = text(childMaster, 'Default child');
    const labelProperty = childMaster.addComponentProperty(
      'Label',
      'TEXT',
      'Default child'
    );
    label.componentPropertyReferences = { characters: labelProperty };
    instance(childMaster, slot).setProperties({
      [labelProperty]: 'First default',
    });
    instance(childMaster, slot).setProperties({
      [labelProperty]: 'Second default',
    });
    const consumer = instance(master);
    consumer.x = 720;
    consumer.y = 150;
    result.instanceId = consumer.id;
    async function freshSlot() {
      const current = await figma.getNodeByIdAsync(consumer.id);
      const children = await mgCapabilityFreshChildren(current);
      return children.find(
        item =>
          !item.removed &&
          item.type === 'SLOT' &&
          item.componentPropertyReferences?.slotContentId === property
      );
    }
    async function reconcile() {
      const reconciliation = await refreshMangroveCapabilityProbeLedger(report);
      result.observations.push({ phase: 'ledgerRefresh', ...reconciliation });
      if (reconciliation.errors.length)
        throw new Error(reconciliation.errors.join('; '));
      for (const item of report.ledger) recorded.add(item.id);
    }
    let editable = await freshSlot();
    if (!editable) throw new Error('Instance did not contain a SLOT node.');
    // Raw handles are diagnostic evidence only. An unresolved handle must never
    // satisfy topology validation, enter the ledger or authorise adoption.
    function diagnosticNode(node) {
      const item = { errors: [] };
      const read = (field, get) => {
        try {
          item[field] = get() ?? null;
        } catch (error) {
          item[field] = null;
          item.errors.push(`${field}: ${message(error)}`);
        }
      };
      read('id', () => node.id);
      read('removed', () => node.removed);
      if (item.removed) return item;
      read('type', () => node.type);
      read('parentId', () => node.parent?.id);
      read('owner', () => mgReadIdentity(node, MG_CAPABILITY_KEY));
      read(
        'characterPropertyReference',
        () => node.componentPropertyReferences?.characters
      );
      if (item.type === 'TEXT') read('characters', () => node.characters);
      if (item.type === 'INSTANCE')
        read(
          'propertyLabel',
          () => node.componentProperties[labelProperty]?.value
        );
      return item;
    }
    async function describe(child, requireRecorded) {
      const observation = {
        phase: result.phase,
        operation: 'describeSlotChild',
        requireRecorded,
        root: diagnosticNode(child),
        sourceMasterId: childMaster.id,
        expectedLabelProperty: labelProperty,
        advertisedChildren: [],
        sourceChildren: [],
        errors: [],
      };
      result.observations.push(observation);
      let main;
      const children = [];
      try {
        main =
          child.type === 'INSTANCE'
            ? await child.getMainComponentAsync()
            : null;
        observation.mainComponentId = main?.id || null;
        observation.sourceOwner = mgReadIdentity(
          childMaster,
          MG_CAPABILITY_KEY
        );
        observation.sourceChildren = (childMaster.children || []).map(
          diagnosticNode
        );
        for (const handle of child.children || []) {
          const item = { raw: diagnosticNode(handle), resolved: null };
          observation.advertisedChildren.push(item);
          try {
            const fresh = await figma.getNodeByIdAsync(handle.id);
            item.lookup = fresh
              ? fresh.removed
                ? 'removed'
                : 'present'
              : 'missing';
            if (fresh && !fresh.removed) {
              item.resolved = diagnosticNode(fresh);
              children.push(fresh);
            }
          } catch (error) {
            item.lookup = 'error';
            item.error = message(error);
          }
        }
      } catch (error) {
        observation.errors.push(message(error));
      }
      const only = observation.advertisedChildren[0]?.resolved;
      observation.criteria = {
        rootReadable: observation.root.errors.length === 0,
        instanceType: observation.root.type === 'INSTANCE',
        exactMainComponent: main?.id === childMaster.id,
        rootOwned: observation.root.owner === report.runId,
        sourceOwned: observation.sourceOwner === report.runId,
        sourceRecorded: recorded.has(childMaster.id),
        singleAdvertisedChild: observation.advertisedChildren.length === 1,
        allChildrenResolved:
          observation.advertisedChildren.length === children.length &&
          observation.advertisedChildren.every(
            item => item.lookup === 'present'
          ),
        singleResolvedText: children.length === 1 && only?.type === 'TEXT',
        textReadable: Boolean(only && only.errors.length === 0),
        textParentMatches: only?.parentId === child.id,
        textPropertyMatches: only?.characterPropertyReference === labelProperty,
        textOwned: only?.owner === report.runId,
        propertyTextMatches:
          typeof observation.root.propertyLabel === 'string' &&
          only?.characters === observation.root.propertyLabel,
        recordedWhenRequired:
          !requireRecorded ||
          (recorded.has(child.id) && Boolean(only && recorded.has(only.id))),
        readsSucceeded: observation.errors.length === 0,
      };
      const failed = Object.entries(observation.criteria)
        .filter(([, passed]) => !passed)
        .map(([name]) => name);
      if (failed.length)
        throw new Error(
          `Slot content is not the exact owned single-label probe topology (${result.phase}: ${failed.join(', ')}).`
        );
      return {
        root: child,
        text: children[0],
        label: child.componentProperties[labelProperty]?.value,
      };
    }
    result.phase = 'beforeInsertion';
    const before = [];
    for (const child of await mgCapabilityFreshChildren(editable))
      before.push(await describe(child, true));
    const originalIds = before.map(item => item.root.id);
    if (
      before.length !== 2 ||
      before[0].label !== 'First default' ||
      before[1].label !== 'Second default'
    )
      throw new Error(
        'Slot defaults do not match the two recorded ordered probe children.'
      );
    // First customization can materialize every default and the inserted child.
    // Authorize this exact operation from its complete ordered source snapshot.
    const pending = instance(childMaster);
    const returnedId = pending.id;
    pending.setProperties({ [labelProperty]: 'Inserted probe sentinel' });
    editable.appendChild(pending);
    result.phase = 'afterInsertion';
    editable = await freshSlot();
    const afterInsert = await mgCapabilityFreshChildren(editable);
    result.observations.push({
      phase: result.phase,
      operation: 'describeSlotContainer',
      returnedInsertedId: returnedId,
      slotId: editable?.id || null,
      advertisedChildIds: (editable?.children || []).map(item => item.id),
      resolvedChildIds: afterInsert.map(item => item.id),
      expectedChildCount: before.length + 1,
      expectedLabels: [
        ...before.map(item => item.label),
        'Inserted probe sentinel',
      ],
    });
    if (afterInsert.length !== before.length + 1)
      throw new Error(
        'Slot insertion changed the child count beyond its exact append operation.'
      );
    const after = [];
    const expectedLabels = [
      ...before.map(item => item.label),
      'Inserted probe sentinel',
    ];
    for (let index = 0; index < afterInsert.length; index++) {
      const item = await describe(afterInsert[index], false);
      if (item.label !== expectedLabels[index])
        throw new Error(
          'Slot insertion changed the recorded source content order or labels.'
        );
      after.push(item);
    }
    // Validate the entire transition before recording any materialized child.
    for (const item of after) {
      record(item.root, false);
      record(item.text, false);
    }
    const baselineIds = after.map(item => item.root.id);
    let added = after[after.length - 1].root;
    const addedId = added.id;
    result.initialCustomization = {
      sourceDefaultIds: originalIds,
      materializedDefaultIds: baselineIds.slice(0, before.length),
      defaultIdsChanged: originalIds.some(
        (id, index) => id !== baselineIds[index]
      ),
      returnedInsertedId: returnedId,
      actualInsertedId: addedId,
    };
    result.observations.push({
      phase: 'slotInsertion',
      returnedId,
      actualInsertedId: addedId,
      beforeChildIds: originalIds,
      afterChildIds: afterInsert.map(item => item.id),
      sourceMasterId: childMaster.id,
      baselineChildIds: baselineIds,
    });
    await reconcile();
    result.phase = 'editAndReorder';
    editable = await freshSlot();
    added = await figma.getNodeByIdAsync(addedId);
    if (!added || added.removed)
      throw new Error(
        'Inserted child root was replaced; stable child identity is unsupported.'
      );
    added.setProperties({ [labelProperty]: 'Preserve this edited child' });
    editable.insertChild(0, added);
    await reconcile();
    editable = await freshSlot();
    added = await figma.getNodeByIdAsync(addedId);
    const expectedIds = (await mgCapabilityFreshChildren(editable)).map(
      item => item.id
    );
    result.observations.push({
      slot: bounds(editable),
      originalIds,
      reorderedIds: expectedIds,
    });
    master.resize(321, 120);
    result.phase = 'masterUpdate';
    master.name = 'Editable slot capability updated';
    await Promise.resolve();
    await reconcile();
    const updated = await freshSlot();
    added = await figma.getNodeByIdAsync(addedId);
    if (!added || added.removed)
      throw new Error(
        'Edited child root was replaced after the master update.'
      );
    const editedText = (await mgCapabilityFreshChildren(added)).find(
      node => node.type === 'TEXT'
    );
    const updatedChildren = await mgCapabilityFreshChildren(updated);
    result.criteria = {
      nativeSlotType: slot.type === 'SLOT' && updated?.type === 'SLOT',
      reorderedIdsPreserved:
        JSON.stringify(updatedChildren.map(item => item.id)) ===
        JSON.stringify(expectedIds),
      editedPropertyPreserved:
        added.componentProperties[labelProperty]?.value ===
        'Preserve this edited child',
      editedTextPropagates:
        editedText?.characters === 'Preserve this edited child',
      baselineChildrenPreserved: baselineIds.every(id =>
        updatedChildren.some(item => item.id === id)
      ),
      instanceRemainsAttached:
        (await consumer.getMainComponentAsync())?.id === master.id,
    };
    result.observations.push({
      slot: updated ? bounds(updated) : null,
      editedChildId: added.id,
      editedText: editedText
        ? { ...bounds(editedText), characters: editedText.characters }
        : null,
      properties: added.componentProperties,
    });
    result.supported = Object.values(result.criteria).every(Boolean);
    result.phase = 'complete';
    result.resetSlotCalled = false;
  });
  await test('vectorInstance', async result => {
    result.fallback =
      'If instance vector writes fail or reset, refresh owned masters only and disclose stale consumer contours.';
    const master = create('createComponent');
    master.name = 'Instance vector capability';
    master.y = 440;
    master.resize(320, 100);
    const vector = create('createVector', master);
    vector.name = 'Derived contour probe';
    vector.vectorPaths = [
      {
        windingRule: 'NONE',
        data: 'M 10 12 L 0 12 L 0 80 L 320 80 L 320 12 L 80 12',
      },
    ];
    vector.strokeWeight = 1;
    vector.strokes = [{ type: 'SOLID', color: { r: 0.3, g: 0.3, b: 0.3 } }];
    vector.fills = [];
    const label = text(master, 'Legend');
    const property = master.addComponentProperty('Legend', 'TEXT', 'Legend');
    label.componentPropertyReferences = { characters: property };
    const consumer = instance(master);
    consumer.x = 360;
    consumer.y = 440;
    consumer.resize(240, 100);
    consumer.setProperties({ [property]: 'Edited legend' });
    result.masterId = master.id;
    result.instanceId = consumer.id;
    const descendant = consumer.children.find(item => item.type === 'VECTOR');
    const originalId = descendant.id;
    const consumerChildIds = consumer.children.map(node => node.id);
    const sourcePaths = JSON.stringify(vector.vectorPaths);
    result.observations.push({
      phase: 'before',
      vector: bounds(descendant),
      paths: descendant.vectorPaths,
    });
    descendant.vectorPaths = [
      {
        windingRule: 'NONE',
        data: 'M 20 36 L 0 36 L 0 90 L 240 90 L 240 36 L 150 36',
      },
    ];
    result.observations.push({
      phase: 'afterPathWriteBeforePositionCorrection',
      vector: bounds(descendant),
      paths: descendant.vectorPaths,
    });
    descendant.x = 0;
    descendant.y = 36;
    const updatedPaths = JSON.stringify(descendant.vectorPaths);
    consumer.setProperties({ [property]: 'Edited legend again' });
    consumer.resize(241, 100);
    await Promise.resolve();
    const current = consumer.children.find(item => item.id === originalId);
    result.observations.push({
      phase: 'afterTextPropertyAndWidthChange',
      vector: current ? bounds(current) : null,
      paths: current?.vectorPaths,
      properties: consumer.componentProperties,
      childIds: consumer.children.map(node => node.id),
      actualLegend: consumer.children.find(node => node.type === 'TEXT')
        ?.characters,
    });
    result.criteria = {
      descendantIdPreserved: current?.id === originalId,
      sourceGeometryUnchanged:
        JSON.stringify(vector.vectorPaths) === sourcePaths,
      instanceOverrideRetained:
        JSON.stringify(current?.vectorPaths) === updatedPaths,
      editedLegendPreserved:
        consumer.componentProperties[property]?.value === 'Edited legend again',
      editedLegendPropagates:
        consumer.children.find(node => node.type === 'TEXT')?.characters ===
        'Edited legend again',
      childrenPreserved:
        JSON.stringify(consumer.children.map(node => node.id)) ===
        JSON.stringify(consumerChildIds),
      instanceRemainsAttached:
        (await consumer.getMainComponentAsync())?.id === master.id,
    };
    result.supported = Object.values(result.criteria).every(Boolean);
  });
  // Do not adopt late additions merely because they are inside our frame.
  // Cleanup refuses any descendant absent from the creation ledger.
  report.ledgerRefresh = await refreshMangroveCapabilityProbeLedger(report);
  report.unrecordedDescendantIds = report.ledgerRefresh.unrecordedNodeIds;
  return report;
}

function mgCapabilityLedgerIds(report) {
  if (
    report?.kind !== 'mangrove-native-capability-probes' ||
    report.version !== 1 ||
    !report.rootId ||
    typeof report.runId !== 'string' ||
    !Array.isArray(report.ledger)
  )
    throw new Error('An exact capability probe ledger is required.');
  const ids = new Set(report.ledger.map(item => item.id));
  if (ids.size !== report.ledger.length || !ids.has(report.rootId))
    throw new Error('Probe ledger contains duplicate IDs or omits its root.');
  return ids;
}

async function mgCapabilityFreshChildren(parent) {
  if (!parent || parent.removed) return [];
  const children = [];
  for (const handle of parent.children || []) {
    const child = await figma.getNodeByIdAsync(handle.id);
    if (child && !child.removed) children.push(child);
  }
  return children;
}

// Read-only evidence for a retained exact probe root. This never authorizes adoption.
async function inspectMangroveCapabilityProbeLedger(report) {
  const result = {
    evidenceOnly: true,
    canAuthorizeAdoption: false,
    rootId: report?.rootId,
    nodes: [],
    missingNodeIds: [],
    errors: [],
  };
  try {
    if (report?.coreContent || report?.scope === 'core-content')
      await mgCoreContentOwned(report);
    const ids = mgCapabilityLedgerIds(report);
    const root = await figma.getNodeByIdAsync(report.rootId);
    if (
      !root ||
      root.removed ||
      mgReadIdentity(root, MG_CAPABILITY_KEY) !== report.runId
    )
      throw new Error('The exact owned probe root is unavailable.');
    const seen = new Set();
    async function visit(id) {
      if (seen.has(id)) return;
      seen.add(id);
      const node = await figma.getNodeByIdAsync(id);
      if (!node || node.removed) {
        result.missingNodeIds.push(id);
        return;
      }
      const item = {
        id,
        type: node.type,
        parentId: node.parent?.id || null,
        recorded: ids.has(id),
        owner: null,
        childIds: [],
        errors: [],
      };
      result.nodes.push(item);
      try {
        item.owner = mgReadIdentity(node, MG_CAPABILITY_KEY);
        if (node.type === 'INSTANCE') {
          const main = await node.getMainComponentAsync();
          item.mainComponentId = main?.id || null;
          item.mainComponentRecorded = Boolean(main && ids.has(main.id));
          item.mainComponentOwner =
            main && !main.removed
              ? mgReadIdentity(main, MG_CAPABILITY_KEY)
              : null;
        }
        item.childIds = (node.children || []).map(child => child.id);
      } catch (error) {
        item.errors.push(error?.message || String(error));
      }
      for (const childId of item.childIds) await visit(childId);
    }
    await visit(root.id);
    for (const id of ids) {
      const node = await figma.getNodeByIdAsync(id);
      if ((!node || node.removed) && !result.missingNodeIds.includes(id))
        result.missingNodeIds.push(id);
    }
  } catch (error) {
    result.errors.push(error?.message || String(error));
  }
  return result;
}

// Explicit recovery for Figma-generated instance descendants, never slot additions.
// The caller's existing ledger authorizes instance roots and their local masters.
async function refreshMangroveCapabilityProbeLedger(report) {
  const result = {
    addedNodeIds: [],
    missingNodeIds: [],
    unrecordedNodeIds: [],
    errors: [],
  };
  try {
    if (report?.coreContent || report?.scope === 'core-content') {
      await mgCoreContentOwned(report);
      return result;
    }
    if (report?.segmentedWrapper || report?.scope === 'segmented-wrapper') {
      await mgSegmentedWrapperOwned(report);
      return result;
    }
    const ids = mgCapabilityLedgerIds(report);
    async function visit(id, generatedAllowed = false) {
      const node = await figma.getNodeByIdAsync(id);
      if (!node || node.removed) {
        result.missingNodeIds.push(id);
        return;
      }
      const owned = mgReadIdentity(node, MG_CAPABILITY_KEY) === report.runId;
      if (!owned || (!ids.has(id) && !generatedAllowed)) {
        result.unrecordedNodeIds.push(id);
        throw new Error(
          `Ledger refresh refused foreign or unrecorded node ${id}.`
        );
      }
      if (!ids.has(id)) {
        ids.add(id);
        report.ledger.push({ id, type: node.type });
        result.addedNodeIds.push(id);
      }
      let allowChildren = generatedAllowed && node.type !== 'SLOT';
      if (node.type === 'INSTANCE') {
        const main = await node.getMainComponentAsync();
        allowChildren = Boolean(
          main &&
          !main.removed &&
          ids.has(main.id) &&
          mgReadIdentity(main, MG_CAPABILITY_KEY) === report.runId
        );
      }
      // Ordinary slot insertion is a structural edit, not implicit generation.
      if (node.type === 'SLOT') allowChildren = false;
      for (const child of node.children || [])
        await visit(child.id, allowChildren);
    }
    await visit(report.rootId);
    for (const id of ids) {
      const node = await figma.getNodeByIdAsync(id);
      if ((!node || node.removed) && !result.missingNodeIds.includes(id))
        result.missingNodeIds.push(id);
    }
  } catch (error) {
    result.errors.push(error?.message || String(error));
  }
  return result;
}

async function removeMangroveCapabilityProbes(report) {
  if (report?.coreContent || report?.scope === 'core-content')
    return removeMangroveCoreContentProbes(report);
  const result = { removedNodeIds: [], errors: [] };
  try {
    const ids = mgCapabilityLedgerIds(report);
    const root = await figma.getNodeByIdAsync(report.rootId);
    if (!root || root.removed) {
      for (const id of ids) {
        const node = await figma.getNodeByIdAsync(id);
        if (node && !node.removed)
          throw new Error(
            `Probe root is missing but recorded node survives: ${id}.`
          );
      }
      return result;
    }
    if (report.segmentedWrapper || report.scope === 'segmented-wrapper') {
      if (report.segmentedWrapper) await mgSegmentedWrapperOwned(report);
      else if (
        ids.size !== 1 ||
        root.type !== 'FRAME' ||
        report.ledger[0]?.type !== 'FRAME' ||
        root.parent?.id !== figma.currentPage.id ||
        root.children.length !== 0 ||
        mgReadIdentity(root, 'mgCapabilityProbeId') !== report.runId ||
        mgReadIdentity(root, 'mgSegmentedWrapperManifest')
      )
        throw new Error(
          'Cleanup refused incomplete or changed pre-manifest wrapper root.'
        );
    }
    if (report.scope?.startsWith('segmented-leaves-')) {
      if (report.segmentedLeaves) await mgSegmentedLeavesOwned(report);
      else if (
        ids.size !== 1 ||
        root.type !== 'FRAME' ||
        report.ledger[0]?.type !== 'FRAME' ||
        root.parent?.id !== figma.currentPage.id ||
        root.children.length !== 0 ||
        mgReadIdentity(root, 'mgCapabilityProbeId') !== report.runId ||
        mgReadIdentity(root, 'mgSegmentedLeavesManifest')
      )
        throw new Error(
          'Cleanup refused an incomplete or changed pre-manifest Segmented root.'
        );
    }
    if (report.scope === 'segmented-canonical') {
      if (report.segmentedCanonical) await mgSegmentedCanonicalOwned(report);
      else if (
        ids.size !== 1 ||
        root.type !== 'FRAME' ||
        report.ledger[0]?.type !== 'FRAME' ||
        root.parent?.id !== figma.currentPage.id ||
        root.children.length !== 0 ||
        mgReadIdentity(root, 'mgCapabilityProbeId') !== report.runId ||
        mgReadIdentity(root, 'mgSegmentedCanonicalManifest')
      )
        throw new Error(
          'Cleanup refused an incomplete or changed pre-manifest Segmented root.'
        );
    }
    const descendants = [];
    const visit = async id => {
      const node = await figma.getNodeByIdAsync(id);
      if (!node || node.removed) return;
      if (
        !ids.has(node.id) ||
        mgReadIdentity(node, MG_CAPABILITY_KEY) !== report.runId
      )
        throw new Error(
          `Cleanup refused foreign or unrecorded node ${node.id}.`
        );
      descendants.push(node);
      for (const child of node.children || []) await visit(child.id);
    };
    await visit(root.id);
    const present = new Set(descendants.map(node => node.id));
    for (const id of ids) {
      const node = await figma.getNodeByIdAsync(id);
      if (!present.has(id) && node && !node.removed)
        throw new Error(
          `Cleanup refused recorded node outside its probe root: ${id}.`
        );
    }
    root.remove();
    result.removedNodeIds = [...present];
  } catch (error) {
    result.errors.push(error?.message || String(error));
  }
  return result;
}
