/* global figma, mgReadIdentity, mgWriteIdentity, mgFormActionJoiningPreflight */
// Diagnostic Experiment A. Fixed masters, optional wrappers, no canonical writes.
async function mgFormActionOptionalPreflight(
  doc,
  brandId,
  collection,
  mode,
  report
) {
  const plan = await mgFormActionJoiningPreflight(
    doc,
    brandId,
    collection,
    mode,
    report
  );
  const nativeStyles = await figma.getLocalTextStylesAsync();
  const fontTemplates = ['component.input', 'component.button'].map(
    sourceStyleId => {
      const matches = nativeStyles.filter(
        style => mgReadIdentity(style, 'mgStyleId') === sourceStyleId
      );
      if (matches.length !== 1)
        throw new Error('Optional font template changed during preflight.');
      const style = matches[0];
      return {
        sourceStyleId,
        nativeId: style.id,
        fontName: style.fontName,
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        boundVariables: style.boundVariables,
      };
    }
  );
  report.preflight.formActionOptional = {
    fontTemplates,
    experiment: 'A',
    variantLayouts: ['Joined', 'Stacked'],
    propertyTypes: {
      Label: 'TEXT',
      Value: 'TEXT',
      Action: 'TEXT',
      Help: 'TEXT',
      Error: 'TEXT',
      'Show label': 'BOOLEAN',
      'Show help': 'BOOLEAN',
      'Show error': 'BOOLEAN',
    },
    initialization:
      'Visible wrappers/nonempty TEXT at390 before visibility reference attachment.',
    typographyApplication:
      'Diagnostic direct source typography; shared templates identify fonts only.',
  };
  report.limitations.push(
    'Experiment A uses two fixed layouts. No inherited row, paragraph or outline geometry is written from a consumer.',
    'Experiment B Layout switching is deferred until native Experiment A passes; no generated descendant adoption is added.',
    'Empty-but-visible optional text is a diagnostic boundary, not a React source state or automatic conditional visibility.',
    'Private master reapplications/fresh cohorts are geometry diagnostics, not ordinary canonical shared-style acceptance.'
  );
  return plan;
}

async function mgRunFormActionOptionalProbes(context, plan) {
  const {
    report,
    root,
    record,
    create,
    instance,
    test,
    bounds,
    collection,
    mode,
  } = context;
  const { packet, source, roles, byName, fonts, cornerFields, equal, aliasIs } =
    plan;
  const g = source.geometry,
    short = packet.cases.labels.Subscribe,
    long = packet.cases.labels.Long;
  const error = 'Enter a valid email address.'; // Exact supplied Invalid browser fixture.
  const copy = value => JSON.parse(JSON.stringify(value));
  const near = (a, b) =>
    Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 0.02;
  const bind = (node, field, role) =>
    node.setBoundVariable(field, roles[role].variable);
  const own = (node, path) => {
    mgWriteIdentity(
      node,
      'mgKitId',
      `capability/${report.runId}/form-action-optional/${path}`
    );
    return node;
  };
  const walk = node => [node, ...(node.children || []).flatMap(walk)];
  const find = (node, name) => {
    const matches = walk(node).filter(child => child.name === name);
    if (matches.length !== 1)
      throw new Error(`Ambiguous optional anatomy ${name}`);
    return matches[0];
  };
  const paints = name => {
    const role = byName.get(name);
    return figma.variables.setBoundVariableForPaint(
      {
        type: 'SOLID',
        color: { r: role.expected.r, g: role.expected.g, b: role.expected.b },
        opacity: role.expected.a,
      },
      'color',
      role.variable
    );
  };
  function fill(node, name) {
    node.fills = [paints(name)];
    if (node.type === 'TEXT' && node.characters.length)
      node.setRangeFills(0, node.characters.length, node.fills);
  }
  function typography(node, kind) {
    const value = source.typography[kind];
    node.fontName = fonts[kind === 'action' ? 'action' : 'input'];
    node.fontSize = value.fontSize;
    node.lineHeight = copy(value.lineHeight);
    node.textDecoration = 'NONE';
    node.textWrapStyle = 'AUTO';
    bind(node, 'fontFamily', 'fontFamily');
    bind(
      node,
      'fontSize',
      kind === 'input'
        ? 'inputFontSize'
        : kind === 'action'
          ? 'actionFontSize'
          : kind === 'help'
            ? 'helpFontSize'
            : 'bodyFontSize'
    );
  }
  function flow(node, layout, horizontal = 'HUG') {
    node.layoutMode = layout;
    node.fills = [];
    node.clipsContent = false;
    node.paddingTop =
      node.paddingBottom =
      node.paddingLeft =
      node.paddingRight =
        0;
    node.itemSpacing = 0;
    node.layoutSizingHorizontal = horizontal;
    node.layoutSizingVertical = 'HUG';
  }
  function frame(parent, name, layout, id) {
    const node = own(create('createFrame', parent), `${id}/${name}`);
    node.name = name;
    flow(node, layout);
    return node;
  }
  function corners(node, part, stacked, outer = false) {
    const values = stacked
      ? g.stackedCorners[part].map(v => v + (outer ? g.focusOffset : 0))
      : outer
        ? g.focusOuterCorners[part]
        : g.corners[part];
    cornerFields.forEach((field, i) => {
      node[field] = values[i];
      if (!outer && values[i])
        bind(
          node,
          field,
          part === 'control' ? 'controlRadius' : 'actionRadius'
        );
    });
  }
  function text(parent, name, value, kind, id, keys) {
    const node = own(record(figma.createText()), `${id}/${name}`);
    node.name = name;
    typography(node, kind);
    node.characters = value;
    parent.appendChild(node);
    node.textAutoResize = ['input', 'action'].includes(kind)
      ? 'WIDTH_AND_HEIGHT'
      : 'HEIGHT';
    node.layoutSizingHorizontal = ['input', 'action'].includes(kind)
      ? 'HUG'
      : 'FILL';
    node.layoutSizingVertical = 'HUG';
    node.componentPropertyReferences = { characters: keys[name] };
    return node;
  }
  function ring(parent, part, name, stacked, id) {
    const node = own(
      create('createRectangle', parent),
      `${id}/${part}/${name}`
    );
    node.name = `${part}/${name}`;
    node.layoutPositioning = 'ABSOLUTE';
    node.fills = [];
    node.strokeAlign = 'OUTSIDE';
    node.strokeWeight = name === 'focus' ? g.focusWidth : g.focusOffset;
    bind(node, 'strokeWeight', name === 'focus' ? 'focusWidth' : 'focusOffset');
    node.strokes = [
      paints(roles[name === 'focus' ? 'focusColor' : 'separatorColor'].name),
    ];
    const offset = name === 'focus' ? g.focusOffset : 0;
    node.resize(parent.width + 2 * offset, parent.height + 2 * offset);
    node.x = node.y = -offset;
    node.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' };
    corners(node, part, stacked, name === 'focus');
    node.visible = false;
    return node;
  }
  function sourceAppearance(master) {
    const control = find(master, 'Control'),
      action = find(master, 'Action surface');
    control.fills = [paints(source.paints.inputDefault.fill)];
    control.strokes = [paints(source.paints.inputDefault.stroke)];
    action.fills = [paints(source.paints.actionDefault.fill)];
    action.strokes = [paints(source.paints.actionDefault.stroke)];
    fill(find(master, 'Value'), roles.placeholder.name);
    fill(find(master, 'Action'), source.paints.actionDefault.text);
    fill(find(master, 'Label'), source.paints.label);
    fill(find(master, 'Help'), source.paints.help);
    fill(find(master, 'Error'), source.paints.errorText.text);
  }
  const paintReads = (value, node) =>
    (Array.isArray(value) ? value : value ? [{ mixed: true }] : []).map(p => {
      const role = Object.values(roles).find(
        r => r.variable.id === p.boundVariables?.color?.id
      );
      return {
        paint: p,
        variableId: p.boundVariables?.color?.id || null,
        sourceRole: role?.name || null,
        resolved: role?.variable.resolveForConsumer(node)?.value ?? null,
      };
    });
  const read = node => ({
    ...bounds(node),
    mgKitId: mgReadIdentity(node, 'mgKitId'),
    parentId: node.parent?.id || null,
    visible: node.visible,
    opacity: node.opacity,
    layoutMode: node.layoutMode,
    horizontal: node.layoutSizingHorizontal,
    vertical: node.layoutSizingVertical,
    clipsContent: node.clipsContent,
    itemSpacing: node.itemSpacing,
    itemReverseZIndex: node.itemReverseZIndex,
    padding: [
      node.paddingTop,
      node.paddingRight,
      node.paddingBottom,
      node.paddingLeft,
    ],
    corners: cornerFields.map(field => node[field] ?? null),
    constraints: node.constraints,
    childIds: node.children?.map(n => n.id),
    boundVariables: node.boundVariables,
    fills: paintReads(node.fills, node),
    strokes: paintReads(node.strokes, node),
    strokeWeight: node.strokeWeight,
    strokeAlign: node.strokeAlign,
    strokesIncludedInLayout: node.strokesIncludedInLayout,
    minWidth: node.minWidth,
    minHeight: node.minHeight,
  });
  const kinds = {
    Label: 'label',
    Value: 'input',
    Action: 'action',
    Help: 'help',
    Error: 'error',
  };
  const defaults = {
    Label: short.label,
    Value: short.placeholder,
    Action: short.action,
    Help: short.help,
    Error: error,
  };
  const showDefaults = {
    'Show label': true,
    'Show help': false,
    'Show error': false,
  };
  async function capture(member, phase) {
    const node = await figma.getNodeByIdAsync(member.node.id);
    const actualMain = await node.getMainComponentAsync();
    const row = find(node, 'Control/action row'),
      control = find(node, 'Control'),
      action = find(node, 'Action surface');
    const fields = Object.fromEntries(
      Object.entries(kinds).map(([name, kind]) => {
        const text = find(node, name),
          typo = source.typography[kind],
          wrapper = ['Label', 'Help', 'Error'].includes(name)
            ? find(node, `${name} wrapper`)
            : null,
          sizeRole =
            kind === 'input'
              ? 'inputFontSize'
              : kind === 'action'
                ? 'actionFontSize'
                : kind === 'help'
                  ? 'helpFontSize'
                  : 'bodyFontSize';
        return [
          name,
          {
            ...read(text),
            characters: text.characters,
            fontName: text.fontName,
            fontSize: text.fontSize,
            lineHeight: text.lineHeight,
            textStyleId: text.textStyleId || '',
            textAutoResize: text.textAutoResize,
            textAlignHorizontal: text.textAlignHorizontal,
            estimatedLineBoxes:
              typo.lineHeight.unit === 'PIXELS'
                ? text.height / typo.lineHeight.value
                : null,
            lineBoxProvenance:
              'Native text height divided by declared pixel line height; no glyph parity claim.',
            propertyReferences: text.componentPropertyReferences,
            propertyId: keys[name],
            property: node.componentProperties[keys[name]],
            expectedCharacters: member.expected[name],
            wrapper: wrapper ? read(wrapper) : null,
            wrapperVisibilityReference:
              wrapper?.componentPropertyReferences?.visible || null,
            rangePaints: paintReads(
              text.characters.length
                ? text.getRangeFills(0, text.characters.length)
                : [],
              text
            ),
            typographyMatches:
              JSON.stringify(text.fontName) ===
                JSON.stringify(fonts[kind === 'action' ? 'action' : 'input']) &&
              equal(text.fontSize, typo.fontSize) &&
              text.lineHeight?.unit === typo.lineHeight.unit &&
              Math.abs(text.lineHeight.value - typo.lineHeight.value) < 0.00002,
            aliasesMatch:
              aliasIs(text.boundVariables?.fontFamily, 'fontFamily') &&
              aliasIs(text.boundVariables?.fontSize, sizeRole),
          },
        ];
      })
    );
    const propertyBindingsMatch = Object.entries(fields).every(
      ([name, field]) =>
        field.propertyReferences?.characters === keys[name] &&
        field.property?.type === 'TEXT' &&
        field.property.value === field.characters &&
        field.characters === member.expected[name]
    );
    const paragraphs = Object.fromEntries(
      ['Label', 'Help', 'Error'].map(name => {
        const field = fields[name],
          wrapper = field.wrapper;
        const sourceVisible = member.expected[`Show ${name.toLowerCase()}`];
        return [
          name,
          {
            sourceVisible,
            nativeVisible: wrapper.visible,
            textAlwaysVisible: field.visible === true,
            textVisibleReferenceAbsent: !field.propertyReferences?.visible,
            booleanPropertyMatches:
              node.componentProperties[keys[`Show ${name.toLowerCase()}`]]
                ?.type === 'BOOLEAN' &&
              node.componentProperties[keys[`Show ${name.toLowerCase()}`]]
                .value === sourceVisible,
            visibilityReferenceMatches:
              field.wrapperVisibilityReference ===
              keys[`Show ${name.toLowerCase()}`],
            positiveWidthWhenVisible:
              wrapper.visible === false ||
              (field.width > 0 &&
                near(field.width, wrapper.width) &&
                near(wrapper.width, node.width)),
            axesWhenVisible:
              wrapper.visible === false ||
              (wrapper.horizontal === 'FILL' &&
                wrapper.vertical === 'HUG' &&
                field.horizontal === 'FILL' &&
                field.vertical === 'HUG' &&
                field.textAutoResize === 'HEIGHT'),
            zeroWrapperPadding: wrapper.padding.every(value => value === 0),
            zeroWrapperSpacing: wrapper.itemSpacing === 0,
          },
        ];
      })
    );
    const expectedPaint = {
      Label: source.paints.label,
      Value: member.valueRole,
      Action: source.paints.actionDefault.text,
      Help: source.paints.help,
      Error: source.paints.errorText.text,
    };
    const rangesMatch = Object.entries(fields).every(
      ([name, field]) =>
        !field.characters.length ||
        (field.rangePaints.length === 1 &&
          field.rangePaints[0].sourceRole === expectedPaint[name] &&
          equal(
            field.rangePaints[0].resolved,
            byName.get(expectedPaint[name]).expected
          ) &&
          (field.rangePaints[0].paint.opacity ?? 1) === 1 &&
          field.rangePaints[0].paint.visible !== false)
    );
    return {
      phase,
      cohort: member.cohort,
      layout: member.layout,
      sourceViewport: member.layout === 'Stacked' ? 480 : 481,
      consumer: read(node),
      mainComponentId: actualMain?.id || null,
      expectedMainComponentId: member.master.id,
      setId: set.id,
      propertyKeys: keys,
      properties: node.componentProperties,
      row: read(row),
      control: read(control),
      viewport: read(find(control, 'Value clipping viewport')),
      action: read(action),
      rings: ['control', 'action'].flatMap(part =>
        ['separator', 'focus'].map(name => read(find(node, `${part}/${name}`)))
      ),
      ringGeometrySource:
        'Private-master geometry inherited through STRETCH; no consumer geometry setters.',
      fields,
      paragraphChecks: paragraphs,
      propertyBindingsMatch,
      sourceTypographyAliasesMatch: Object.values(fields).every(
        f => f.typographyMatches && f.aliasesMatch
      ),
      effectiveRangePaintsMatch: rangesMatch,
      geometry: {
        rootFixedHug:
          node.layoutSizingHorizontal === 'FIXED' &&
          node.layoutSizingVertical === 'HUG',
        rowMode:
          row.layoutMode ===
          (member.layout === 'Stacked' ? 'VERTICAL' : 'HORIZONTAL'),
        rowAxes:
          row.layoutSizingHorizontal === 'FILL' &&
          row.layoutSizingVertical === 'HUG',
        rowSpacing:
          row.itemSpacing ===
          (member.layout === 'Stacked' ? g.stackGap : g.seam),
        semanticOrder:
          row.children.length === 2 &&
          row.children[0].id === control.id &&
          row.children[1].id === action.id,
        allocation:
          member.layout === 'Stacked'
            ? near(control.width, row.width) &&
              near(action.width, row.width) &&
              near(action.x, 0) &&
              near(action.y, control.height + g.stackGap)
            : near(control.width + action.width + g.seam, row.width) &&
              near(action.x, control.width + g.seam),
        controlHeight: near(control.height, g.controlHeight),
        outerUnclipped: [node, row, control, action].every(
          n => n.clipsContent === false
        ),
        innerValueClipped:
          find(control, 'Value clipping viewport').clipsContent === true,
        singleLineValue:
          fields.Value.textAutoResize === 'WIDTH_AND_HEIGHT' &&
          fields.Value.horizontal === 'HUG',
        visibleParagraphs: Object.values(paragraphs).every(
          p =>
            p.textAlwaysVisible &&
            p.textVisibleReferenceAbsent &&
            p.visibilityReferenceMatches &&
            p.booleanPropertyMatches &&
            p.sourceVisible === p.nativeVisible &&
            p.positiveWidthWhenVisible &&
            p.axesWhenVisible &&
            p.zeroWrapperPadding &&
            p.zeroWrapperSpacing
        ),
      },
    };
  }
  let set, keys;
  const masters = {},
    members = [];
  function rootWidth(member, width) {
    member.node.resize(width, member.node.height);
    member.node.layoutSizingHorizontal = 'FIXED';
    member.node.layoutSizingVertical = 'HUG';
  }
  function edit(member, values) {
    member.node.setProperties(
      Object.fromEntries(
        Object.entries(values).map(([name, value]) => [keys[name], value])
      )
    );
    Object.assign(member.expected, values);
  }
  function enteredValue(member) {
    member.valueRole = roles.inputValue.name;
    fill(find(member.node, 'Value'), member.valueRole);
  }
  function newMember(layout, cohort, width = 390) {
    const master = masters[layout],
      node = instance(master);
    own(node, `consumer/${cohort}/${layout}/${node.id}`);
    node.name = `Form Action optional / ${cohort} / ${layout}`;
    node.x = 40 + (cohort === 'edited' ? 0 : 440);
    node.y =
      40 +
      (layout === 'Stacked' ? 650 : 0) +
      (cohort === 'fresh0'
        ? 180
        : cohort === 'fresh1'
          ? 340
          : cohort === 'fresh2'
            ? 500
            : 0);
    const member = {
      node,
      master,
      layout,
      cohort,
      expected: { ...defaults, ...showDefaults },
      valueRole: roles.placeholder.name,
    };
    rootWidth(member, width);
    members.push(member);
    return member;
  }
  async function observe(result, member, phase) {
    const value = await capture(member, phase);
    result.observations.push(value);
    return value;
  }
  function identity(value) {
    return {
      consumerId: value.consumer.id,
      probe: value.consumer.mgKitId,
      main: value.mainComponentId,
      width: value.consumer.width,
      horizontal: value.consumer.horizontal,
      vertical: value.consumer.vertical,
      propertyKeys: value.propertyKeys,
      properties: value.properties,
      fields: Object.fromEntries(
        Object.entries(value.fields).map(([name, field]) => [
          name,
          {
            id: field.id,
            sourceKey: field.mgKitId,
            characters: field.characters,
            refs: field.propertyReferences,
            wrapperId: field.wrapper?.id || null,
            wrapperVisible: field.wrapper?.visible,
            wrapperReference: field.wrapperVisibilityReference,
          },
        ])
      ),
    };
  }
  function reapply() {
    for (const layout of ['Joined', 'Stacked']) {
      const master = masters[layout];
      master.resize(390, master.height);
      master.layoutSizingHorizontal = 'FIXED';
      master.layoutSizingVertical = 'HUG';
      for (const [name, kind] of Object.entries(kinds))
        typography(find(master, name), kind);
      sourceAppearance(master);
    }
  }
  report.formActionOptional = {
    experiment: 'A',
    fixedLayouts: true,
    layoutSwitchingTested: false,
    sharedStyleAssociationSatisfied: false,
    ordinaryCanonicalAcceptance: false,
    consumerGeometryWrites:
      'Root width/FIXED-HUG only; no descendant geometry writes.',
    sourceCriteria: {
      typography: source.typography,
      geometry: g,
      paints: source.paints,
      views: packet.cases.views,
    },
    sourceInitialization: [],
    cohorts: [],
  };
  await test('formActionOptionalA', async result => {
    // Create the set before its property keys, without any existing canonical assets.
    const sourceMasters = ['Joined', 'Stacked'].map(layout => {
      const master = own(create('createComponent'), `source/${layout}`);
      master.name = `Layout=${layout}`;
      master.resize(390, g.controlHeight);
      flow(master, 'VERTICAL', 'FIXED');
      master.layoutSizingHorizontal = 'FIXED';
      master.layoutSizingVertical = 'HUG';
      master.itemSpacing = g.gap;
      bind(master, 'itemSpacing', 'gap');
      masters[layout] = master;
      return master;
    });
    set = own(
      record(figma.combineAsVariants(sourceMasters, root), false),
      'set'
    );
    set.name = 'Form Action optional diagnostic / fixed layouts';
    set.x = 900;
    set.y = 40;
    set.clipsContent = false;
    keys = {};
    for (const [name, value] of Object.entries(defaults))
      keys[name] = set.addComponentProperty(name, 'TEXT', value);
    for (const [name, value] of Object.entries(showDefaults))
      keys[name] = set.addComponentProperty(name, 'BOOLEAN', value);
    for (const [index, layout] of ['Joined', 'Stacked'].entries()) {
      const master = masters[layout],
        stacked = layout === 'Stacked',
        id = `source/${layout}`;
      master.name = `Layout=${layout}`;
      master.x = 0;
      master.y = index * 440;
      master.setExplicitVariableModeForCollection(collection, mode.modeId);
      const optional = (name, kind) => {
        const wrapper = frame(master, `${name} wrapper`, 'VERTICAL', id);
        wrapper.layoutSizingHorizontal = 'FILL';
        wrapper.layoutSizingVertical = 'HUG';
        wrapper.visible = true;
        text(wrapper, name, defaults[name], kind, id, keys);
        return wrapper;
      };
      optional('Label', 'label');
      const row = frame(
        master,
        'Control/action row',
        stacked ? 'VERTICAL' : 'HORIZONTAL',
        id
      );
      row.layoutSizingHorizontal = 'FILL';
      row.itemSpacing = stacked ? g.stackGap : g.seam;
      const control = frame(row, 'Control', 'HORIZONTAL', id);
      control.layoutSizingHorizontal = 'FILL';
      control.layoutSizingVertical = 'FIXED';
      control.resize(control.width, g.controlHeight);
      bind(control, 'height', 'controlHeight');
      control.minWidth = null;
      control.counterAxisAlignItems = 'CENTER';
      control.strokesIncludedInLayout = true;
      control.strokeAlign = 'INSIDE';
      control.strokeWeight = g.controlBorder;
      bind(control, 'strokeWeight', 'controlBorder');
      for (const field of [
        'paddingTop',
        'paddingBottom',
        'paddingLeft',
        'paddingRight',
      ]) {
        control[field] = g.controlPadding;
        bind(control, field, 'controlPadding');
      }
      corners(control, 'control', stacked);
      const viewport = frame(
        control,
        'Value clipping viewport',
        'HORIZONTAL',
        id
      );
      viewport.layoutSizingHorizontal = 'FILL';
      viewport.clipsContent = true;
      viewport.minWidth = null;
      text(viewport, 'Value', defaults.Value, 'input', id, keys);
      const action = frame(row, 'Action surface', 'HORIZONTAL', id);
      action.layoutSizingHorizontal = stacked ? 'FILL' : 'HUG';
      action.layoutSizingVertical = stacked ? 'HUG' : 'FILL';
      action.minHeight = g.actionMinHeight;
      action.primaryAxisAlignItems = 'CENTER';
      action.counterAxisAlignItems = 'CENTER';
      action.strokesIncludedInLayout = true;
      action.strokeAlign = 'INSIDE';
      action.strokeWeight = g.actionBorder;
      bind(action, 'strokeWeight', 'actionBorder');
      for (const [field, role] of [
        ['paddingLeft', 'actionPaddingInline'],
        ['paddingRight', 'actionPaddingInline'],
        ['paddingTop', 'actionPaddingBlock'],
        ['paddingBottom', 'actionPaddingBlock'],
      ]) {
        action[field] = g[role];
        bind(action, field, role);
      }
      corners(action, 'action', stacked);
      text(action, 'Action', defaults.Action, 'action', id, keys);
      for (const [part, parent] of [
        ['control', control],
        ['action', action],
      ])
        for (const name of ['separator', 'focus'])
          ring(parent, part, name, stacked, id);
      optional('Help', 'help');
      optional('Error', 'error');
      sourceAppearance(master);
      master.resize(390, master.height);
      master.layoutSizingHorizontal = 'FIXED';
      master.layoutSizingVertical = 'HUG';
      const initialized = Object.fromEntries(
        ['Label', 'Help', 'Error'].map(name => {
          const wrapper = find(master, `${name} wrapper`),
            child = find(master, name);
          return [
            name,
            {
              wrapper: read(wrapper),
              text: {
                ...read(child),
                characters: child.characters,
                textAutoResize: child.textAutoResize,
                fontName: child.fontName,
                fontSize: child.fontSize,
                lineHeight: child.lineHeight,
                propertyReferences: child.componentPropertyReferences,
                rangePaints: paintReads(
                  child.getRangeFills(0, child.characters.length),
                  child
                ),
              },
              widthReady:
                wrapper.width > 0 &&
                near(wrapper.width, master.width) &&
                near(child.width, wrapper.width),
            },
          ];
        })
      );
      report.formActionOptional.sourceInitialization.push({
        layout,
        masterId: master.id,
        width: master.width,
        fields: initialized,
      });
      if (!Object.values(initialized).every(value => value.widthReady))
        throw new Error(
          `Positive390 optional initialization failed for ${layout}`
        );
      for (const name of ['Label', 'Help', 'Error']) {
        const wrapper = find(master, `${name} wrapper`);
        wrapper.visible = showDefaults[`Show ${name.toLowerCase()}`];
        wrapper.componentPropertyReferences = {
          visible: keys[`Show ${name.toLowerCase()}`],
        };
      }
    }
    report.formActionOptional.propertyKeys = keys;
    report.formActionOptional.setId = set.id;
    report.formActionOptional.masterIds = Object.fromEntries(
      Object.entries(masters).map(([layout, node]) => [layout, node.id])
    );
    const edited = ['Joined', 'Stacked'].map(layout =>
      newMember(layout, 'edited')
    );
    const initialFresh = ['Joined', 'Stacked'].map(layout =>
      newMember(layout, 'fresh0')
    );
    for (const member of initialFresh)
      await observe(result, member, 'initial fresh defaults390');
    for (const member of edited) {
      edit(member, {
        'Show label': false,
        'Show help': false,
        'Show error': false,
      });
      await observe(result, member, 'short hidden390');
      rootWidth(member, 240);
      await observe(result, member, 'short hidden240');
      edit(member, {
        Label: long.label,
        Value: long.value,
        Action: long.action,
        Help: long.help,
        Error: error,
      });
      enteredValue(member);
      await observe(result, member, 'long edit while hidden240');
      edit(member, {
        'Show label': true,
        'Show help': true,
        'Show error': true,
      });
      await observe(result, member, 'hidden then edit then show240');
      edit(member, { 'Show help': false, 'Show error': false });
      edit(member, { 'Show help': true, 'Show error': true });
      await observe(result, member, 'show before short text240');
      edit(member, { Help: short.help, Error: error });
      await observe(result, member, 'show then edit short240');
      edit(member, {
        'Show help': false,
        'Show error': false,
        Help: long.help,
        Error: error,
      });
      rootWidth(member, 390);
      edit(member, { 'Show help': true, 'Show error': true });
      await observe(result, member, 'hidden edit resize then show390');
      edit(member, { Help: '', Error: '' });
      await observe(result, member, 'empty but visible diagnostic390');
      edit(member, { 'Show help': false, 'Show error': false });
      edit(member, { Help: long.help, Error: error });
      edit(member, { 'Show help': true, 'Show error': true });
      await observe(result, member, 'empty hide nonempty show390');
      edit(member, {
        Label: short.label,
        Value: short.placeholder,
        Action: short.action,
        Help: short.help,
        Error: error,
        'Show help': true,
        'Show error': false,
      });
      member.valueRole = roles.placeholder.name;
      fill(find(member.node, 'Value'), member.valueRole);
      rootWidth(member, 240);
      await observe(result, member, 'restored short only help240');
      edit(member, { 'Show help': false, 'Show error': true });
      await observe(result, member, 'restored short only error240');
      edit(member, {
        Label: long.label,
        Value: long.value,
        Action: long.action,
        Help: long.help,
        Error: error,
        'Show help': true,
        'Show error': true,
      });
      enteredValue(member);
      await observe(result, member, 'final long edited240');
    }
    const baselines = new Map();
    for (const member of members)
      baselines.set(
        member.node.id,
        identity(
          await observe(result, member, 'before private-master reapplications')
        )
      );
    for (let pass = 1; pass <= 2; pass++) {
      reapply();
      for (const member of [...members]) {
        const value = await observe(
          result,
          member,
          `after private-master reapplication ${pass}`
        );
        value.exactIdentityAndEditsPreserved =
          JSON.stringify(identity(value)) ===
          JSON.stringify(baselines.get(member.node.id));
      }
      for (const layout of ['Joined', 'Stacked']) {
        const fresh = newMember(layout, `fresh${pass}`);
        const value = await observe(
          result,
          fresh,
          `new fresh after reapplication ${pass}`
        );
        baselines.set(fresh.node.id, identity(value));
      }
    }
    report.formActionOptional.cohorts = members.map(member => ({
      id: member.node.id,
      mainId: member.master.id,
      layout: member.layout,
      cohort: member.cohort,
      expected: member.expected,
      probeId: mgReadIdentity(member.node, 'mgKitId'),
    }));
    result.findings = {
      allSourceInitialization:
        report.formActionOptional.sourceInitialization.every(value =>
          Object.values(value.fields).every(field => field.widthReady)
        ),
      allPropertyBindings: result.observations.every(
        value => value.propertyBindingsMatch
      ),
      allTypographyAliases: result.observations.every(
        value => value.sourceTypographyAliasesMatch
      ),
      allEffectiveRangePaints: result.observations.every(
        value => value.effectiveRangePaintsMatch
      ),
      allGeometry: result.observations.every(value =>
        Object.values(value.geometry).every(Boolean)
      ),
      allRepeatIdentityAndEdits: result.observations
        .filter(value => value.phase.startsWith('after private'))
        .every(value => value.exactIdentityAndEditsPreserved),
      visualAcceptance: false,
    };
    result.supported = false;
    result.supportedObservedStructure = Object.values(result.findings)
      .slice(0, 6)
      .every(Boolean);
  });
}
