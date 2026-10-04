/* global figma, mgReadIdentity, mgWriteIdentity */
/** Temporary native override probes. Mock checks do not establish rendered acceptance.
 * API contracts: https://developers.figma.com/docs/plugins/api/InstanceNode/
 * Ledger is public shared plugin data containing only this run's synthetic evidence.
 */
const MG_ACCEPTANCE_LEDGER_KEY = 'mgAcceptanceLedger';
const MG_ACCEPTANCE_PLANS = [
  {
    id: 'combobox-open',
    familyId: 'combobox',
    variantId: 'combobox.open',
    text: {
      Label: 'Probe Combo label',
      Value: 'Probe Combo value',
      'Help text': 'Probe Combo help',
    },
    boolean: { 'Show label': true, 'Show help': true, Required: true },
    axes: { State: 'Open' },
    transitions: ['Show help', 'Required'],
    format: 'Value',
  },
  {
    id: 'radio-checked',
    familyId: 'radio',
    variantId: 'radio.true.default.after.short',
    text: { Label: 'Probe checked label', Error: 'Probe hidden error' },
    boolean: { 'Show label': true, 'Show error': false },
    axes: {
      Checked: 'True',
      State: 'Default',
      LabelPosition: 'After',
      Content: 'Short',
    },
    transitions: ['Show label'],
  },
  {
    id: 'radio-invalid',
    familyId: 'radio',
    variantId: 'radio.true.invalid.after.short',
    text: { Label: 'Probe invalid label', Error: 'Probe visible error' },
    boolean: { 'Show label': false, 'Show error': true },
    axes: {
      Checked: 'True',
      State: 'Invalid',
      LabelPosition: 'After',
      Content: 'Short',
    },
    transitions: ['Show error'],
  },
];
const MG_ACCEPTANCE_GROUPS = {
  status: {
    plans: [
      ['neutral', 'Neutral'],
      ['draft', 'Draft'],
      ['waiting-information', 'WaitingInformation'],
      ['waiting-validation', 'WaitingValidation'],
      ['published', 'Published'],
      ['warning', 'Warning'],
      ['negative', 'Negative'],
    ].map(([slug, Status]) => ({
      id: `status-${slug}`,
      familyId: 'status-label',
      variantId: `status-label.${slug}`,
      text: {
        Label: `Edited ${Status} status with additional information about community resilience and disaster risk reduction`,
      },
      boolean: {},
      axes: { Status },
      transitions: [],
    })),
    requestedFamilyIds: ['status-label'],
    coverage: [
      'all seven source Status axes and required editable Label keys',
      'exact loaded Regular text/style/range paints on canonical and edited consumers',
      'temporary240px consumer and FILL label transition, restored intrinsic sizing',
      'ordinary-repeat text/axis/style/paint/ring/SVG viewport/leaf identity preservation',
    ],
    limitations: [
      'Native snapshots preserve the observed geometry; they do not prove CSS pixel/ring/SVG equivalence.',
      'The temporary240px transition is a native sizing probe, not accepted source wrapping or a source breakpoint.',
      'Grouped/RTL/forced-colour/print and arbitrary live geometry are not covered.',
    ],
  },
  toc: {
    plans: [
      ...[240, 390, 900].map(width => ({
        id: `toc-link-${width}`,
        familyId: 'toc-link',
        variantId: `toc-link.${width}.default`,
        text: {
          Label:
            'Edited link about disaster risk reduction and resilient communities across the Sendai Framework',
        },
        boolean: {},
        axes: { MeasuredWidth: String(width), State: 'Default' },
        transitions: [],
        format: 'Label',
        cap: width - 44.5,
      })),
      ...[240, 390, 900].map(width => ({
        id: `toc-numbered-${width}`,
        familyId: 'table-of-contents',
        variantId: `table-of-contents.numbered.${width}`,
        text: {
          Title:
            'A longer title about disaster risk reduction and resilient communities',
        },
        boolean: {},
        axes: { ListStyle: 'Numbered', MeasuredWidth: String(width) },
        transitions: [],
        width,
        cap: width - 44.5,
        nestedLabels: Array.from(
          { length: 6 },
          (_, index) =>
            `Edited link ${index + 1}: How communities prepare for hazards and strengthen resilience across the Sendai Framework`
        ),
      })),
    ],
    requestedFamilyIds: ['toc-link', 'table-of-contents'],
    coverage: [
      'three finite link caps',
      'three numbered consumer widths',
      'Title and all six exposed nested Label edits',
      'direct loaded text alignment overrides',
      'marker bottom alignment after wrapped edits',
      'ordinary-repeat identity/content/format/width preservation',
    ],
    limitations: [
      'Number glyph pixels and last-baseline raster alignment require visual source comparison.',
      'No arbitrary width, live relative caps, unbroken-word source overflow or Bulleted acceptance is implied.',
      'The compact baseline omits unrelated variable binding inventories; geometry is recorded separately.',
    ],
  },
  legacy: {
    plans: MG_ACCEPTANCE_PLANS,
    requestedFamilyIds: ['combobox', 'combobox-option', 'radio'],
    coverage: [
      'root TEXT/BOOLEAN',
      'three exposed option TEXT properties',
      'one direct text alignment override',
      'unchanged checked/invalid variant axes',
    ],
    limitations: [
      'Default Radio has a hidden error ancestor.',
      'Open Combo has no Error message consumer.',
    ],
  },
  'details-select': {
    plans: [
      {
        id: 'details-open-240',
        familyId: 'details',
        variantId: 'details.open.default.belowmedium.390',
        text: {
          Title:
            'A detailed explanation of disaster risk reduction and resilient communities across the Sendai Framework',
          Paragraph:
            'Long supporting information explains how communities can prepare for hazards, reduce exposure and make evidence-informed decisions. The Sendai Framework',
        },
        boolean: {},
        axes: {
          Open: 'True',
          State: 'Default',
          Typography: 'BelowMedium',
          MeasuredViewport: '390',
        },
        transitions: [],
        width: 240,
      },
      {
        id: 'select-invalid-240',
        familyId: 'select',
        variantId: 'select.invalid',
        text: {
          Label: 'Probe category',
          Value: 'Depth',
          'Help text': 'Probe supporting information for the selected category',
          'Error message': 'Probe choose an available category',
        },
        boolean: {
          'Show label': true,
          'Show help': true,
          'Show error': true,
          Required: true,
        },
        axes: { State: 'Invalid' },
        transitions: ['Show label', 'Show help', 'Show error', 'Required'],
        width: 240,
      },
    ],
    requestedFamilyIds: ['details', 'select'],
    coverage: [
      'open BelowMedium390 Details edited long Title/Paragraph',
      'closed Invalid Select short Value and label/help/error/BOOLEAN edits',
      '240px consumer width and FIXED/HUG sizing preservation',
      'unchanged Details/Select variant axes',
    ],
    limitations: [
      'Select uses a short Value only; native popup and long-value behaviour are not covered.',
      'Details remains the BelowMedium390 variant at a 240px consumer width; no automatic breakpoint switching is implied.',
      'Consumer width checks do not establish source geometry or rendered wrapping.',
    ],
  },
};

function mgAcceptanceGroup(groupId = 'legacy') {
  if (
    typeof groupId !== 'string' ||
    !Object.prototype.hasOwnProperty.call(MG_ACCEPTANCE_GROUPS, groupId)
  )
    throw new Error(`Unknown acceptance group ${String(groupId)}.`);
  return MG_ACCEPTANCE_GROUPS[groupId];
}

function mgAcceptanceError(error) {
  return error?.message || String(error);
}

function mgAcceptanceJSON(value) {
  if (typeof value === 'symbol') return 'MIXED';
  if (Array.isArray(value)) return value.map(mgAcceptanceJSON);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .filter(key => value[key] !== undefined)
        .map(key => [key, mgAcceptanceJSON(value[key])])
    );
  return value;
}

function mgAcceptanceTree(node) {
  return [node, ...node.findAll(() => true)];
}

function mgAcceptanceKey(properties, name, type) {
  const keys = Object.entries(properties).filter(
    ([key, value]) => key.replace(/#[^#]+$/, '') === name && value.type === type
  );
  if (keys.length !== 1)
    throw new Error(`Missing or ambiguous ${type} property ${name}.`);
  return keys[0][0];
}

function mgAcceptanceTarget(instance, key, field) {
  const nodes = instance.findAll(
    node => node.componentPropertyReferences?.[field] === key
  );
  if (nodes.length !== 1)
    throw new Error(`Missing or ambiguous ${field} consumer for ${key}.`);
  return nodes[0];
}

async function mgAcceptanceFonts(component) {
  const faces = new Map();
  for (const node of component.findAll(node => node.type === 'TEXT')) {
    const fonts =
      node.fontName === figma.mixed
        ? node.getRangeAllFontNames(0, node.characters.length)
        : [node.fontName];
    if (!fonts.length) throw new Error(`Cannot resolve fonts on ${node.id}.`);
    for (const font of fonts) {
      if (!font || font.family !== 'Roboto' || !font.style)
        throw new Error(`Probe requires actual Roboto fonts on ${node.id}.`);
      faces.set(`${font.family}\u0000${font.style}`, font);
    }
  }
  for (const face of faces.values()) await figma.loadFontAsync(face);
  return [...faces.values()];
}

function mgAcceptanceVisible(node) {
  for (let current = node; current; current = current.parent)
    if (current.visible === false) return false;
  return true;
}

function mgAcceptanceRightEdge(page) {
  let right = -Infinity;
  for (const node of page.children) {
    for (const bounds of [
      node.absoluteRenderBounds,
      node.absoluteBoundingBox,
      { x: node.x, y: node.y, width: node.width, height: node.height },
    ]) {
      if (
        bounds &&
        ['x', 'y', 'width', 'height'].every(field =>
          Number.isFinite(bounds[field])
        ) &&
        bounds.width >= 0 &&
        bounds.height >= 0 &&
        Number.isFinite(bounds.x + bounds.width)
      )
        right = Math.max(right, bounds.x + bounds.width);
    }
  }
  if (!Number.isFinite(right + 160))
    throw new Error('Cannot find finite page bounds for acceptance placement.');
  return right;
}

async function mgAcceptanceSnapshot(instance, compact = false) {
  const nodes = [];
  for (const node of mgAcceptanceTree(instance)) {
    const record = {
      id: node.id,
      type: node.type,
      parentId: node.parent?.id || null,
      visible: node.visible,
      effectiveVisible: mgAcceptanceVisible(node),
    };
    const fields = [
      'componentPropertyReferences',
      'characters',
      'fontName',
      'fontSize',
      'textStyleId',
      'textAutoResize',
      'textAlignHorizontal',
      'layoutSizingHorizontal',
      'layoutSizingVertical',
      'boundVariables',
      'explicitVariableModes',
      'resolvedVariableModes',
    ];
    if (compact) {
      fields.splice(fields.indexOf('boundVariables'));
      fields.push(
        'lineHeight',
        'textDecoration',
        'textDecorationOffset',
        'textWrapStyle'
      );
    }
    for (const field of fields) {
      if (node[field] !== undefined)
        record[field] = mgAcceptanceJSON(node[field]);
    }
    if (compact && node.type === 'TEXT') {
      Object.assign(record, await mgAcceptancePaints(node));
      record.typographyBindings = mgAcceptanceJSON({
        fontFamily: node.boundVariables?.fontFamily || null,
        fontSize: node.boundVariables?.fontSize || null,
      });
    }
    // Bounds and opacity are diagnostic, not override-preservation assertions.
    record.diagnostics = {
      name: node.name,
      width: node.width,
      height: node.height,
      opacity: node.opacity,
      clipsContent: node.clipsContent,
    };
    if (node.type === 'INSTANCE') {
      record.mainComponentId = (await node.getMainComponentAsync())?.id || null;
      record.componentProperties = mgAcceptanceJSON(node.componentProperties);
      record.exposedInstanceIds = node.exposedInstances.map(item => item.id);
    }
    nodes.push(record);
  }
  return {
    id: instance.id,
    mgKitId: mgReadIdentity(instance, 'mgKitId'),
    nodes,
  };
}

async function mgAcceptancePaints(node) {
  if (!Array.isArray(node.fills))
    throw new Error('TOC text has mixed or missing fills.');
  const rangeFills = node.getRangeFills(0, node.characters.length);
  if (!Array.isArray(rangeFills))
    throw new Error(
      'TOC text has mixed or missing full-character range fills.'
    );
  const resolvedFills = [];
  for (const paint of rangeFills) {
    if (paint.type !== 'SOLID') throw new Error('TOC text fill is not SOLID.');
    let color = paint.color;
    if (paint.boundVariables?.color?.id) {
      const variable = await figma.variables.getVariableByIdAsync(
        paint.boundVariables.color.id
      );
      if (!variable) throw new Error('TOC fill variable is missing.');
      color = variable.resolveForConsumer(node).value;
    }
    if (
      !color ||
      !['r', 'g', 'b'].every(field => Number.isFinite(color[field]))
    )
      throw new Error('TOC resolved fill is invalid.');
    resolvedFills.push({
      ...color,
      a: (color.a ?? 1) * (paint.opacity ?? 1),
      visible: paint.visible !== false,
    });
  }
  return {
    fills: mgAcceptanceJSON(node.fills),
    rangeFills: mgAcceptanceJSON(rangeFills),
    resolvedFills: mgAcceptanceJSON(resolvedFills),
    textStyleId: node.textStyleId || '',
  };
}

async function mgAcceptanceStatusSnapshot(node) {
  const snapshot = await mgAcceptanceSnapshot(node, true);
  for (const record of snapshot.nodes) {
    const current = await figma.getNodeByIdAsync(record.id);
    for (const field of [
      'width',
      'height',
      'x',
      'y',
      'layoutMode',
      'itemSpacing',
      'cornerRadius',
      'strokeWeight',
      'strokeAlign',
      'strokes',
      'vectorPaths',
      'boundVariables',
    ])
      if (current[field] !== undefined)
        record[field] = mgAcceptanceJSON(current[field]);
    if (current.type !== 'TEXT' && current.fills !== undefined)
      record.fills = mgAcceptanceJSON(current.fills);
    const svg = mgReadIdentity(current, 'mgSvgAsset');
    if (svg) record.svgAsset = JSON.parse(svg);
    if (current.type === 'COMPONENT')
      record.variantProperties = mgAcceptanceJSON(current.variantProperties);
  }
  return snapshot;
}

function mgAcceptanceStatusColorNear(expected, actual) {
  return (
    expected?.visible === actual?.visible &&
    ['r', 'g', 'b', 'a'].every(
      field =>
        Number.isFinite(actual[field]) &&
        Math.abs(expected[field] - actual[field]) <= 1e-6
    )
  );
}

async function mgAcceptanceStatusPreflight(
  doc,
  component,
  set,
  variant,
  brandId
) {
  const sourceVariables = new Map((doc.variables || []).map(v => [v.name, v]));
  function color(name, seen = new Set()) {
    if (seen.has(name)) throw new Error('Status source color alias cycle.');
    seen.add(name);
    const spec = sourceVariables.get(name),
      value = spec?.values?.[brandId];
    if (spec?.type !== 'COLOR' || !value)
      throw new Error(`Status source COLOR ${name} missing.`);
    return value.alias ? color(value.alias, seen) : value;
  }
  async function paintRole(node, field, role) {
    const expected = { ...color(role), visible: true };
    const paints =
      node.type === 'TEXT' && field === 'fills'
        ? node.getRangeFills(0, node.characters.length)
        : node[field];
    if (
      !Array.isArray(paints) ||
      paints.length !== 1 ||
      paints[0].type !== 'SOLID'
    )
      throw new Error(
        `Status ${field} must have one variable-bound SOLID paint.`
      );
    const paint = paints[0],
      variable = await figma.variables.getVariableByIdAsync(
        paint.boundVariables?.color?.id
      );
    if (variable?.name !== role)
      throw new Error(`Status ${field} alias changed from ${role}.`);
    const rgba = variable.resolveForConsumer(node).value;
    const actual = {
      ...rgba,
      a: (rgba.a ?? 1) * (paint.opacity ?? 1),
      visible: paint.visible !== false,
    };
    if (!mgAcceptanceStatusColorNear(expected, actual))
      throw new Error(`Status source ${role} range/paint differs beyond1e-6.`);
    return expected;
  }
  const styles = await figma.getLocalTextStylesAsync();
  const expectedStyles = styles.filter(
    style =>
      mgReadIdentity(style, 'mgStyleId') === 'component.status-label.label'
  );
  if (expectedStyles.length !== 1)
    throw new Error(
      'Status requires one existing component.status-label.label style.'
    );
  const sourceStyle = doc.styles?.text?.filter(
    style => style.id === 'component.status-label.label'
  );
  if (sourceStyle?.length !== 1)
    throw new Error('Status source text style is missing or ambiguous.');
  const key = mgAcceptanceKey(
    set.componentPropertyDefinitions,
    'Label',
    'TEXT'
  );
  if (set.componentPropertyDefinitions[key].defaultValue !== 'Published')
    throw new Error('Status shared Label default changed.');
  const label = mgAcceptanceTarget(component, key, 'characters');
  if (
    label.fontName?.family !== 'Roboto' ||
    label.fontName?.style !== 'Regular' ||
    label.fontSize !== 16 ||
    label.lineHeight?.unit !== 'PERCENT' ||
    label.lineHeight?.value !== 150 ||
    label.textStyleId !== expectedStyles[0].id ||
    label.textDecoration !== 'NONE'
  )
    throw new Error('Status exact Regular typography/style changed.');
  const expectedLabelPaint = await paintRole(
    label,
    'fills',
    'status-label/color'
  );
  const named = (parent, name) => {
    const matches = parent.children.filter(child => child.name === name);
    if (matches.length !== 1)
      throw new Error(`Status anatomy changed at ${name}.`);
    return matches[0];
  };
  const slot = named(component, '14px source indicator allocation');
  if (
    slot.type !== 'FRAME' ||
    slot.width !== 14 ||
    slot.height !== 14 ||
    component.itemSpacing !== 7.5
  )
    throw new Error('Status common14px allocation/gap changed.');
  const slotSpec = variant.tree?.children?.[0];
  if (
    slot.layoutMode !== slotSpec?.layout?.mode ||
    (slotSpec.layout.align &&
      slot.counterAxisAlignItems !== slotSpec.layout.align) ||
    (slotSpec.layout.justify &&
      slot.primaryAxisAlignItems !== slotSpec.layout.justify)
  )
    throw new Error(
      'Status indicator-slot alignment differs from the current recipe.'
    );
  const leafSpecs = slotSpec?.children;
  if (!Array.isArray(leafSpecs) || slot.children.length !== leafSpecs.length)
    throw new Error('Status source shape count changed.');
  for (const leaf of leafSpecs) {
    const node = named(slot, leaf.name);
    if (node.type !== (leaf.type === 'SVG' ? 'FRAME' : leaf.type))
      throw new Error('Status native shape type changed.');
    if (leaf.type === 'SVG') {
      const vectors = node.findAll(child => child.type === 'VECTOR');
      if (!vectors.length)
        throw new Error('Status SVG has no native vector leaf.');
      for (const [field, role] of Object.entries(leaf.svg.monochrome)) {
        const painted = vectors.filter(
          vector => Array.isArray(vector[field]) && vector[field].length
        );
        if (!painted.length)
          throw new Error(`Status SVG has no ${field} paint for ${role}.`);
        for (const vector of painted) await paintRole(vector, field, role);
      }
      const asset = JSON.parse(mgReadIdentity(node, 'mgSvgAsset') || 'null');
      if (
        !Number.isFinite(node.width) ||
        Math.abs(node.width - leaf.layout.width) > 1e-6 ||
        !Number.isFinite(node.height) ||
        Math.abs(node.height - leaf.layout.height) > 1e-6 ||
        asset?.assetId !== leaf.svg.assetId ||
        asset?.markup !== leaf.svg.markup
      )
        throw new Error('Status source-derived SVG viewport/asset changed.');
    } else {
      await paintRole(node, 'fills', leaf.fill);
      await paintRole(node, 'strokes', leaf.stroke);
      if (node.strokeWeight !== 1 || node.strokeAlign !== 'INSIDE')
        throw new Error('Status inward source1px ring changed.');
    }
  }
  return {
    variantId: variant.id,
    mainComponentId: component.id,
    setId: set.id,
    labelKey: key,
    expectedLabelPaint,
    baseline: await mgAcceptanceStatusSnapshot(component),
  };
}

async function mgAcceptanceStatusSizing(instance) {
  const key = mgAcceptanceKey(instance.componentProperties, 'Label', 'TEXT');
  const label = mgAcceptanceTarget(instance, key, 'characters');
  const original = {
    width: instance.width,
    height: instance.height,
    horizontal: instance.layoutSizingHorizontal,
    vertical: instance.layoutSizingVertical,
    textHorizontal: label.layoutSizingHorizontal,
    textVertical: label.layoutSizingVertical,
    textAutoResize: label.textAutoResize,
  };
  instance.setBoundVariable('width', null);
  instance.resize(240, Math.max(1, instance.height));
  instance.layoutSizingHorizontal = 'FIXED';
  instance.layoutSizingVertical = 'HUG';
  label.layoutSizingHorizontal = 'FILL';
  label.textAutoResize = 'HEIGHT';
  const narrow = {
    width: instance.width,
    height: instance.height,
    horizontal: instance.layoutSizingHorizontal,
    vertical: instance.layoutSizingVertical,
    textHorizontal: label.layoutSizingHorizontal,
    textAutoResize: label.textAutoResize,
    textWidth: label.width,
    textHeight: label.height,
  };
  if (
    narrow.width !== 240 ||
    narrow.horizontal !== 'FIXED' ||
    narrow.textHorizontal !== 'FILL'
  )
    throw new Error('Status temporary240px native sizing transition failed.');
  label.textAutoResize = original.textAutoResize;
  label.layoutSizingHorizontal = original.textHorizontal;
  label.layoutSizingVertical = original.textVertical;
  instance.resize(original.width, Math.max(1, original.height));
  instance.layoutSizingHorizontal = original.horizontal;
  instance.layoutSizingVertical = original.vertical;
  if (
    instance.layoutSizingHorizontal !== original.horizontal ||
    label.layoutSizingHorizontal !== original.textHorizontal ||
    label.textAutoResize !== original.textAutoResize
  )
    throw new Error('Status intrinsic sizing restoration failed.');
  return {
    original,
    narrow,
    restored: {
      horizontal: instance.layoutSizingHorizontal,
      vertical: instance.layoutSizingVertical,
      textHorizontal: label.layoutSizingHorizontal,
      textVertical: label.layoutSizingVertical,
      textAutoResize: label.textAutoResize,
    },
    nativeWrapping: 'unverified; metrics only',
  };
}

function mgAcceptanceTocLinks(node) {
  const exposed = node.findAll(
    child => child.type === 'INSTANCE' && child.isExposedInstance
  );
  if (exposed.length !== 6)
    throw new Error('TOC needs exactly six exposed Link instances.');
  return Array.from({ length: 6 }, (_, index) => {
    const matches = exposed.filter(child => child.name === `Link ${index + 1}`);
    if (matches.length !== 1)
      throw new Error('TOC exposed Link anatomy is missing or ambiguous.');
    const key = mgAcceptanceKey(
      matches[0].componentProperties,
      'Label',
      'TEXT'
    );
    if (mgAcceptanceTarget(matches[0], key, 'characters').type !== 'TEXT')
      throw new Error('TOC Label consumer is not TEXT.');
    return matches[0];
  });
}

function mgAcceptanceTocGeometry(instance, plan) {
  const metrics = [],
    checks = [];
  const check = (name, expected, actual) =>
    checks.push({
      name,
      expected,
      actual,
      passed: JSON.stringify(expected) === JSON.stringify(actual),
    });
  const near = (name, expected, actual) =>
    checks.push({
      name,
      expected,
      actual,
      passed: Number.isFinite(actual) && Math.abs(expected - actual) <= 0.02,
    });
  function relativeX(node) {
    let x = 0;
    for (let current = node; current !== instance; current = current.parent) {
      if (!current || !Number.isFinite(current.x))
        throw new Error('TOC relative bounds are invalid.');
      x += current.x;
    }
    return x;
  }
  function link(node, index) {
    const key = mgAcceptanceKey(node.componentProperties, 'Label', 'TEXT'),
      text = mgAcceptanceTarget(node, key, 'characters');
    metrics.push({
      id: node.id,
      textId: text.id,
      index,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      maxWidth: node.maxWidth,
      textWidth: text.width,
      textHeight: text.height,
      fontName: mgAcceptanceJSON(text.fontName),
      lineHeight: mgAcceptanceJSON(text.lineHeight),
    });
    const prefix = `link${index}`;
    near(`${prefix}: exact cap`, plan.cap, node.maxWidth);
    check(
      `${prefix}: capped width`,
      true,
      Number.isFinite(node.width) &&
        node.width > 0 &&
        node.width <= plan.cap + 0.02
    );
    check(
      `${prefix}: HUG/HUG`,
      ['HUG', 'HUG'],
      [node.layoutSizingHorizontal, node.layoutSizingVertical]
    );
    check(`${prefix}: unclipped`, false, node.clipsContent);
    check(
      `${prefix}: FILL/HEIGHT text`,
      ['FILL', 'HUG', 'HEIGHT'],
      [
        text.layoutSizingHorizontal,
        text.layoutSizingVertical,
        text.textAutoResize,
      ]
    );
    near(`${prefix}: text fills width`, node.width, text.width);
    near(`${prefix}: vertical padding`, text.height + 5, node.height);
    check(`${prefix}: underline`, 'UNDERLINE', text.textDecoration);
    check(
      `${prefix}: offset`,
      { unit: 'PERCENT', value: 15 },
      mgAcceptanceJSON(text.textDecorationOffset)
    );
    check(`${prefix}: wrap`, 'AUTO', text.textWrapStyle);
    check(
      `${prefix}: actual Regular`,
      { family: 'Roboto', style: 'Regular' },
      { family: text.fontName?.family, style: text.fontName?.style }
    );
    near(`${prefix}: font size`, 16, text.fontSize);
    check(
      `${prefix}: source line height`,
      { unit: 'PERCENT', value: 150 },
      mgAcceptanceJSON(text.lineHeight)
    );
    return { node, text };
  }
  if (plan.familyId === 'toc-link') link(instance, 1);
  else {
    const titleKey = mgAcceptanceKey(
        instance.componentProperties,
        'Title',
        'TEXT'
      ),
      title = mgAcceptanceTarget(instance, titleKey, 'characters');
    metrics.push({
      id: title.id,
      width: title.width,
      height: title.height,
      fontName: mgAcceptanceJSON(title.fontName),
      lineHeight: mgAcceptanceJSON(title.lineHeight),
    });
    check('title: BALANCE', 'BALANCE', title.textWrapStyle);
    check(
      'title: Bold',
      { family: 'Roboto', style: 'Bold' },
      { family: title.fontName?.family, style: title.fontName?.style }
    );
    // The saved native 110% title reports 110.00000238418579, equal to the
    // source percentage converted through a float32 ratio. Permit only 110
    // or that exact representation; native-to-native baselines stay exact.
    const titleLineHeight = mgAcceptanceJSON(title.lineHeight);
    const nativeTitlePercent = Math.fround(110 / 100) * 100;
    checks.push({
      name: 'title: source line height',
      expected: { unit: 'PERCENT', value: 110 },
      actual: titleLineHeight,
      allowedNativePercent: nativeTitlePercent,
      passed:
        titleLineHeight?.unit === 'PERCENT' &&
        (titleLineHeight.value === 110 ||
          titleLineHeight.value === nativeTitlePercent),
    });
    near('title: source font size', 18, title.fontSize);
    near('title: available width', plan.width - 22, title.width);
    for (const [index, nested] of mgAcceptanceTocLinks(instance).entries()) {
      const { node, text } = link(nested, index + 1),
        row = node.parent;
      const markers = row.children.filter(
        child => child.name === 'Decimal marker / last line'
      );
      if (markers.length !== 1 || markers[0].type !== 'FRAME')
        throw new Error('TOC marker wrapper is missing or ambiguous.');
      const marker = markers[0],
        number = marker.children[0],
        prefix = `marker${index + 1}`;
      if (marker.children.length !== 1 || number.type !== 'TEXT')
        throw new Error('TOC marker text anatomy changed.');
      metrics.push({
        id: marker.id,
        textId: number.id,
        rowId: row.id,
        x: marker.x,
        y: marker.y,
        width: marker.width,
        height: marker.height,
        numberY: number.y,
        numberHeight: number.height,
        linkY: node.y,
        linkHeight: node.height,
      });
      check(`${prefix}: bottom alignment`, 'MAX', row.counterAxisAlignItems);
      near(`${prefix}: allocation`, 20, marker.width);
      near(`${prefix}: line box`, 24, number.height);
      near(`${prefix}: bottom padding`, 2.5, marker.paddingBottom);
      near(`${prefix}: wrapper height`, 26.5, marker.height);
      near(
        `${prefix}: wrapper ends with link`,
        node.y + node.height,
        marker.y + marker.height
      );
      near(
        `${prefix}: text ends above link`,
        node.y + node.height - 2.5,
        marker.y + number.y + number.height
      );
      near(
        `${prefix}: source link leading`,
        marker.x + marker.width + 2.5,
        node.x
      );
      near(`${prefix}: root-relative link x`, 44.5, relativeX(node));
      check(`${prefix}: source decimal`, `${index + 1}.`, number.characters);
      check(`${prefix}: right aligned`, 'RIGHT', number.textAlignHorizontal);
      if (plan.width === 240 && index === 0)
        check(`${prefix}: wrapped text observed`, true, text.height > 24);
    }
  }
  check('root: HUG vertical', 'HUG', instance.layoutSizingVertical);
  return { metrics, checks, passed: checks.every(item => item.passed) };
}

function mgAcceptanceChecksum(text) {
  let value = 2166136261;
  for (let index = 0; index < text.length; index++)
    value = Math.imul(value ^ text.charCodeAt(index), 16777619);
  return (value >>> 0).toString(16).padStart(8, '0');
}

function mgAcceptancePersist(root, ledger) {
  const json = JSON.stringify(ledger);
  // Figma caps a shared entry at 100 kB including namespace and key.
  // ASCII escaping keeps this bound independent of UTF-8 character widths.
  const ascii = json.replace(
    /[\u007f-\uffff]/g,
    character => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`
  );
  if (ascii.length > 90000 && ['toc', 'status'].includes(ledger.groupId)) {
    const count = Math.ceil(ascii.length / 90000);
    if (count > 3)
      throw new Error(
        'Acceptance evidence exceeds three bounded shared entries.'
      );
    for (let index = 0; index < count; index++)
      mgWriteIdentity(
        root,
        `${MG_ACCEPTANCE_LEDGER_KEY}Part${index}`,
        ascii.slice(index * 90000, (index + 1) * 90000)
      );
    // Commit the manifest last. A read during a partial update rejects mismatched
    // lengths/checksum instead of combining old and new evidence.
    mgWriteIdentity(
      root,
      MG_ACCEPTANCE_LEDGER_KEY,
      JSON.stringify({
        kind: 'mangrove-acceptance-ledger-parts',
        version: 1,
        rootId: root.id,
        runId: ledger.runId,
        partCount: count,
        asciiLength: ascii.length,
        checksum: mgAcceptanceChecksum(ascii),
      })
    );
    return;
  }
  if (ascii.length > 90000)
    throw new Error('Acceptance evidence exceeds the bounded shared ledger.');
  mgWriteIdentity(root, MG_ACCEPTANCE_LEDGER_KEY, ascii);
}

async function mgAcceptanceLoad(input) {
  const rootId = typeof input === 'string' ? input : input?.rootId;
  if (typeof rootId !== 'string' || !rootId)
    throw new Error('Provide the exact acceptance root ID or saved ledger.');
  const root = await figma.getNodeByIdAsync(rootId);
  if (!root) throw new Error(`Acceptance root ${rootId} no longer exists.`);
  const raw = mgReadIdentity(root, MG_ACCEPTANCE_LEDGER_KEY);
  if (!raw) throw new Error('Acceptance root has no persisted ledger.');
  let ledger = JSON.parse(raw);
  if (ledger.kind === 'mangrove-acceptance-ledger-parts') {
    const manifest = ledger;
    if (
      manifest.version !== 1 ||
      manifest.rootId !== root.id ||
      !Number.isInteger(manifest.partCount) ||
      manifest.partCount < 2 ||
      manifest.partCount > 3 ||
      !Number.isInteger(manifest.asciiLength) ||
      manifest.asciiLength <= 90000 ||
      manifest.asciiLength > 270000 ||
      !/^[a-f0-9]{8}$/.test(manifest.checksum)
    )
      throw new Error('Acceptance ledger part manifest is invalid.');
    const parts = Array.from({ length: manifest.partCount }, (_, index) =>
      mgReadIdentity(root, `${MG_ACCEPTANCE_LEDGER_KEY}Part${index}`)
    );
    if (
      parts.some(
        part =>
          !part ||
          part.length > 90000 ||
          [...part].some(character => character.charCodeAt(0) > 127)
      ) ||
      parts.join('').length !== manifest.asciiLength ||
      mgAcceptanceChecksum(parts.join('')) !== manifest.checksum
    )
      throw new Error(
        'Acceptance ledger parts are missing, truncated or inconsistent.'
      );
    ledger = JSON.parse(parts.join(''));
    if (
      !['toc', 'status'].includes(ledger.groupId) ||
      ledger.runId !== manifest.runId ||
      ledger.rootId !== manifest.rootId
    )
      throw new Error('Acceptance ledger parts do not match the manifest.');
  }
  const group = mgAcceptanceGroup(ledger.groupId);
  if (
    ledger.version !== 1 ||
    ledger.rootId !== root.id ||
    typeof ledger.runId !== 'string' ||
    !/^[a-z0-9-]+$/.test(ledger.runId) ||
    !Array.isArray(ledger.probes) ||
    ledger.probes.length > group.plans.length ||
    (ledger.complete && ledger.probes.length !== group.plans.length) ||
    JSON.stringify(ledger.requestedFamilyIds) !==
      JSON.stringify(group.requestedFamilyIds) ||
    !Array.isArray(ledger.createdNodeIds) ||
    root.type !== 'FRAME' ||
    mgReadIdentity(root, 'mgKitId') !== `acceptance/${ledger.runId}` ||
    root.parent?.id !== ledger.pageId
  )
    throw new Error('Acceptance root ownership, type or ledger is invalid.');
  if (typeof input !== 'string' && input.runId !== ledger.runId)
    throw new Error('Saved run does not match the persisted acceptance root.');
  const ids = new Set([root.id]);
  const planIds = new Set();
  for (const probe of ledger.probes) {
    const plan = group.plans.find(item => item.id === probe.id);
    if (
      !plan ||
      planIds.has(probe.id) ||
      probe.familyId !== plan.familyId ||
      probe.variantId !== plan.variantId ||
      probe.requestedWidth !== plan.width ||
      typeof probe.nodeId !== 'string' ||
      ids.has(probe.nodeId) ||
      !Array.isArray(probe.createdTreeIds) ||
      !probe.createdTreeIds.includes(probe.nodeId) ||
      probe.parentId !== root.id ||
      probe.mgKitId !== `acceptance/${ledger.runId}/${probe.id}` ||
      !ledger.createdNodeIds.includes(probe.nodeId)
    )
      throw new Error('Invalid acceptance probe ledger.');
    ids.add(probe.nodeId);
    planIds.add(probe.id);
  }
  return { root, ledger };
}

function mgAcceptanceDirectApplications(doc) {
  for (const family of doc.components?.families || [])
    for (const variant of family.variants || []) {
      function visit(spec, immediate = false) {
        if (
          Object.prototype.hasOwnProperty.call(spec, 'textStyleApplication')
        ) {
          if (
            spec.textStyleApplication !== 'DIRECT' ||
            family.id !== 'toc-link' ||
            !immediate ||
            spec.type !== 'TEXT' ||
            variant.tree?.name !== 'mg-table-of-contents / a' ||
            variant.tree?.id !== variant.tree.name ||
            spec.name !== 'Link label' ||
            spec.id !== `${variant.tree.id}/${spec.name}` ||
            spec.textProperty !== 'Label' ||
            spec.textStyle !== 'component.table-of-contents.link'
          )
            throw new Error('Unsupported TOC textStyleApplication or anatomy.');
        }
        for (const child of spec.children || [])
          visit(child, spec === variant.tree);
      }
      visit(variant.tree || {});
    }
}

async function mgAcceptanceDirectTypographySnapshot(node) {
  const roleBindings = {};
  for (const field of ['fontFamily', 'fontSize']) {
    const nativeBinding = node.boundVariables?.[field];
    // TextNode typography bindings are native alias arrays. Resolve only one
    // unambiguous alias, retaining the complete native shape for repeat checks.
    const alias = Array.isArray(nativeBinding)
      ? nativeBinding.length === 1
        ? nativeBinding[0]
        : null
      : nativeBinding;
    const variable =
      alias?.type === 'VARIABLE_ALIAS'
        ? await figma.variables.getVariableByIdAsync(alias.id)
        : null;
    roleBindings[field] = variable
      ? {
          alias: mgAcceptanceJSON(nativeBinding),
          name: variable.name,
          resolvedType: variable.resolvedType,
          value: mgAcceptanceJSON(variable.resolveForConsumer(node).value),
        }
      : null;
  }
  return mgAcceptanceJSON({
    textStyleId: node.textStyleId,
    fontName: node.fontName,
    fontSize: node.fontSize,
    lineHeight: node.lineHeight,
    textDecoration: node.textDecoration,
    textDecorationOffset: node.textDecorationOffset,
    textWrapStyle: node.textWrapStyle,
    roleBindings,
  });
}

async function mgAcceptanceDirectTypographyPreflight(doc, spec, node, brandId) {
  if (spec.textStyleApplication !== 'DIRECT')
    throw new Error('TOC canonical labels require explicit DIRECT typography.');
  const definitions = (doc.styles?.text || []).filter(
    style => style.id === spec.textStyle
  );
  const templates = (await figma.getLocalTextStylesAsync()).filter(
    style => mgReadIdentity(style, 'mgStyleId') === spec.textStyle
  );
  if (definitions.length !== 1 || templates.length !== 1)
    throw new Error(
      'TOC DIRECT requires one source and imported text template.'
    );
  const definition = definitions[0],
    template = templates[0],
    source = definition.values?.[brandId];
  if (
    !source ||
    definition.bindings?.fontFamily !== 'font-family/text' ||
    definition.bindings?.fontSize !== 'font-size/300'
  )
    throw new Error('TOC DIRECT source template or typography roles changed.');
  const expected = {
    textStyleId: '',
    fontName: mgAcceptanceJSON(template.fontName),
    fontSize: source.fontSize,
    lineHeight: source.lineHeight,
    textDecoration: spec.textDecoration,
    textDecorationOffset: spec.textDecorationOffset,
    textWrapStyle: spec.textWrap,
  };
  if (
    template.fontName?.family !== source.fontName?.family ||
    template.fontName?.style !== source.fontName?.style ||
    template.fontSize !== source.fontSize ||
    JSON.stringify(template.lineHeight) !== JSON.stringify(source.lineHeight) ||
    template.textDecoration !== source.textDecoration ||
    source.textDecoration !== spec.textDecoration ||
    source.textWrapStyle !== spec.textWrap
  )
    throw new Error('TOC DIRECT imported text template differs from source.');
  await figma.loadFontAsync(template.fontName);
  const actual = await mgAcceptanceDirectTypographySnapshot(node);
  for (const [field, value] of Object.entries(expected))
    if (JSON.stringify(actual[field]) !== JSON.stringify(value))
      throw new Error(
        `TOC DIRECT canonical ${field} differs from template/source.`
      );
  const variables = new Map(
    (doc.variables || []).map(variable => [variable.name, variable])
  );
  function resolve(name, type, seen = new Set()) {
    if (seen.has(name)) throw new Error('TOC DIRECT typography alias cycle.');
    seen.add(name);
    const variable = variables.get(name),
      value = variable?.values?.[brandId];
    if (variable?.type !== type || value === undefined)
      throw new Error(`TOC DIRECT source ${type} ${name} is missing.`);
    return value?.alias ? resolve(value.alias, type, seen) : value;
  }
  for (const [field, type] of [
    ['fontFamily', 'STRING'],
    ['fontSize', 'FLOAT'],
  ]) {
    const role = definition.bindings[field],
      binding = actual.roleBindings[field];
    if (
      binding?.name !== role ||
      binding.resolvedType !== type ||
      JSON.stringify(binding.value) !== JSON.stringify(resolve(role, type))
    )
      throw new Error(
        `TOC DIRECT canonical ${field} role binding differs from source.`
      );
  }
  return actual;
}

async function prepareMangroveOverrideProbes(doc, brandId, groupId = 'legacy') {
  const result = {
    operation: 'prepare-override-probes',
    createdNodeIds: [],
    rootId: null,
    ledger: null,
    errors: [],
    nativeAcceptance: 'unverified until comparison and rendered review',
  };
  let root;
  let ledger;
  try {
    const group = mgAcceptanceGroup(groupId);
    result.groupId = groupId;
    if (groupId === 'toc') mgAcceptanceDirectApplications(doc);
    const brands = (doc?.modes || []).filter(mode => mode.id === brandId);
    if (brands.length !== 1) throw new Error('Unknown or ambiguous brand.');
    const collections = (
      await figma.variables.getLocalVariableCollectionsAsync()
    ).filter(item => item.name === doc.collection);
    if (collections.length !== 1)
      throw new Error('Import a unique Mangrove collection first.');
    const modes = collections[0].modes.filter(
      mode => mode.name === brands[0].name
    );
    if (modes.length !== 1)
      throw new Error('Apply the requested brand before preparing probes.');
    const page = figma.currentPage;
    const owned = page.findAll(node => {
      for (
        let parent = node.parent;
        parent && parent !== page;
        parent = parent.parent
      )
        if (parent.type === 'INSTANCE') return false;
      return Boolean(mgReadIdentity(node, 'mgKitId'));
    });
    const unique = (key, type) => {
      const matches = owned.filter(
        node => mgReadIdentity(node, 'mgKitId') === key
      );
      if (matches.length !== 1 || matches[0].type !== type)
        throw new Error(`Missing, ambiguous or wrong-type owned ${key}.`);
      return matches[0];
    };
    const main = unique('main', 'FRAME');
    if (main.parent !== page) throw new Error('Main root is not page-owned.');
    const sources = [];
    const statusCanonical = [];
    for (const plan of group.plans) {
      const families = (doc.components?.families || []).filter(
        family => family.id === plan.familyId
      );
      const variants = families[0]?.variants.filter(
        variant => variant.id === plan.variantId
      );
      if (families.length !== 1 || variants?.length !== 1)
        throw new Error(`Missing or ambiguous recipe ${plan.variantId}.`);
      for (const [key, value] of Object.entries(plan.axes))
        if (variants[0].properties[key] !== value)
          throw new Error(`Recipe axis changed for ${plan.variantId}.`);
      const set = unique(`family/${plan.familyId}`, 'COMPONENT_SET');
      const component = unique(
        `family/${plan.familyId}/variant/${plan.variantId}`,
        'COMPONENT'
      );
      if (component.parent !== set || set.parent !== main)
        throw new Error(`Unexpected main ancestry for ${plan.variantId}.`);
      for (const [key, value] of Object.entries(plan.axes))
        if (component.variantProperties?.[key] !== value)
          throw new Error(
            `Existing variant axis changed for ${plan.variantId}.`
          );
      for (const [type, edits] of [
        ['TEXT', plan.text],
        ['BOOLEAN', plan.boolean],
      ])
        for (const name of Object.keys(edits)) {
          const key = mgAcceptanceKey(
            set.componentPropertyDefinitions,
            name,
            type
          );
          const target = mgAcceptanceTarget(
            component,
            key,
            type === 'TEXT' ? 'characters' : 'visible'
          );
          if (type === 'TEXT' && target.type !== 'TEXT')
            throw new Error(`Existing ${name} consumer is not TEXT.`);
        }
      const primary = component.findAll(
        node => node.type === 'INSTANCE' && node.isExposedInstance
      );
      if (plan.familyId === 'table-of-contents') {
        for (const nested of mgAcceptanceTocLinks(component)) {
          const nestedMain = await nested.getMainComponentAsync();
          if (
            nestedMain?.id !==
            unique(
              `family/toc-link/variant/toc-link.${plan.axes.MeasuredWidth}.default`,
              'COMPONENT'
            ).id
          )
            throw new Error('Exposed TOC Link has an unexpected master.');
        }
      }
      if (plan.familyId === 'combobox') {
        if (primary.length !== 3)
          throw new Error('Open Combo needs three exposed options.');
        for (let index = 1; index <= 3; index++) {
          const options = primary.filter(
            node => node.name === `mg-combobox__option-${index}`
          );
          if (options.length !== 1)
            throw new Error('Ambiguous exposed option anatomy.');
          const option = options[0];
          const optionMain = await option.getMainComponentAsync();
          if (
            !optionMain ||
            optionMain.parent !==
              unique('family/combobox-option', 'COMPONENT_SET')
          )
            throw new Error('Exposed option has an unexpected main component.');
          const key = mgAcceptanceKey(
            option.componentProperties,
            'Label',
            'TEXT'
          );
          if (mgAcceptanceTarget(option, key, 'characters').type !== 'TEXT')
            throw new Error('Existing option Label consumer is not TEXT.');
        }
      }
      const fonts = await mgAcceptanceFonts(component);
      if (groupId === 'status')
        statusCanonical.push(
          await mgAcceptanceStatusPreflight(
            doc,
            component,
            set,
            variants[0],
            brandId
          )
        );
      sources.push({ plan, component, set, fonts });
    }
    const canonicalPaints = [];
    if (groupId === 'toc') {
      const sourceVariables = new Map(
        (doc.variables || []).map(variable => [variable.name, variable])
      );
      function sourceColor(name, seen = new Set()) {
        if (seen.has(name)) throw new Error('TOC source color alias cycle.');
        seen.add(name);
        const entry = sourceVariables.get(name);
        if (entry?.type !== 'COLOR')
          throw new Error(`TOC source COLOR ${name} is missing.`);
        const value = entry.values?.[brandId];
        return value?.alias ? sourceColor(value.alias, seen) : value;
      }
      const linkFamily = doc.components.families.find(
        family => family.id === 'toc-link'
      );
      if (linkFamily.variants.length !== 12)
        throw new Error(
          'TOC DIRECT requires all twelve canonical label variants.'
        );
      for (const variant of linkFamily.variants) {
        const component = unique(
          `family/toc-link/variant/${variant.id}`,
          'COMPONENT'
        );
        const labels = component.findAll(node => node.type === 'TEXT');
        if (labels.length !== 1 || variant.tree?.children?.length !== 1)
          throw new Error('TOC Link source label anatomy changed.');
        const expectedRole = variant.tree.children[0].fill,
          expected = sourceColor(expectedRole);
        if (
          !expected ||
          !['r', 'g', 'b', 'a'].every(field => Number.isFinite(expected[field]))
        )
          throw new Error('TOC source COLOR is invalid.');
        const directTypography = await mgAcceptanceDirectTypographyPreflight(
          doc,
          variant.tree.children[0],
          labels[0],
          brandId
        );
        canonicalPaints.push({
          directTypography,
          nodeId: labels[0].id,
          mainComponentId: component.id,
          expectedRole,
          expectedResolvedFills: mgAcceptanceJSON([
            { ...expected, visible: true },
          ]),
          ...(await mgAcceptancePaints(labels[0])),
        });
      }
      for (const { plan, component } of sources)
        if (plan.familyId === 'table-of-contents')
          for (const text of component.findAll(node => node.type === 'TEXT'))
            canonicalPaints.push({
              nodeId: text.id,
              mainComponentId: component.id,
              ...(await mgAcceptancePaints(text)),
            });
    }
    const runId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    if (
      owned.some(node =>
        mgReadIdentity(node, 'mgKitId').startsWith(`acceptance/${runId}`)
      )
    )
      throw new Error('Acceptance run identity collision.');
    ledger = {
      version: 1,
      groupId,
      runId,
      rootId: null,
      pageId: page.id,
      brandId,
      collection: {
        id: collections[0].id,
        modeId: modes[0].modeId,
        name: modes[0].name,
      },
      requestedFamilyIds: [...group.requestedFamilyIds],
      createdNodeIds: result.createdNodeIds,
      probes: [],
      complete: false,
      errors: result.errors,
      coverage: [...group.coverage],
      limitations: [
        'Visibility flags do not establish painted visibility under clipping or occlusion.',
        ...group.limitations,
        'No all-brand, arbitrary-size, publishing or keyboard acceptance is implied.',
      ],
      ...(groupId === 'toc' ? { canonicalPaints } : {}),
      ...(groupId === 'status' ? { statusCanonical } : {}),
    };
    // Read all existing page-level bounds before creating the new root, so the
    // default frame position cannot affect placement on a negative-coordinate page.
    const placementX = mgAcceptanceRightEdge(page) + 160;
    root = figma.createFrame();
    result.createdNodeIds.push(root.id);
    result.rootId = ledger.rootId = root.id;
    root.name = `Mangrove acceptance probes / ${runId}`;
    mgWriteIdentity(root, 'mgKitId', `acceptance/${runId}`);
    page.appendChild(root);
    root.layoutMode = 'VERTICAL';
    root.primaryAxisSizingMode = 'AUTO';
    root.counterAxisSizingMode = 'AUTO';
    root.itemSpacing = 48;
    root.paddingTop =
      root.paddingBottom =
      root.paddingLeft =
      root.paddingRight =
        24;
    root.fills = [];
    root.clipsContent = false;
    root.x = placementX;
    root.y = Number.isFinite(main.y) ? main.y : 0;
    for (const { plan, component, set, fonts } of sources) {
      const instance = component.createInstance();
      const createdTreeIds = mgAcceptanceTree(instance).map(node => node.id);
      result.createdNodeIds.push(...createdTreeIds);
      const probe = {
        id: plan.id,
        familyId: plan.familyId,
        variantId: plan.variantId,
        ...(plan.width ? { requestedWidth: plan.width } : {}),
        nodeId: instance.id,
        parentId: root.id,
        mgKitId: `acceptance/${runId}/${plan.id}`,
        mainComponentId: component.id,
        setId: set.id,
        createdTreeIds,
        fonts,
        targets: [],
        transitions: [],
        complete: false,
      };
      ledger.probes.push(probe);
      mgWriteIdentity(instance, 'mgKitId', probe.mgKitId);
      root.appendChild(instance);
      instance.name = `Override probe / ${plan.id}`;
      instance.setExplicitVariableModeForCollection(
        collections[0],
        modes[0].modeId
      );
      const edits = {};
      for (const [type, values] of [
        ['TEXT', plan.text],
        ['BOOLEAN', plan.boolean],
      ])
        for (const [name, value] of Object.entries(values)) {
          const key = mgAcceptanceKey(instance.componentProperties, name, type);
          const field = type === 'TEXT' ? 'characters' : 'visible';
          const target = mgAcceptanceTarget(instance, key, field);
          probe.targets.push({
            instanceId: instance.id,
            nodeId: target.id,
            key,
            type,
            name,
            field,
            value,
          });
          edits[key] = value;
        }
      for (const name of plan.transitions) {
        const key = mgAcceptanceKey(
          instance.componentProperties,
          name,
          'BOOLEAN'
        );
        const target = mgAcceptanceTarget(instance, key, 'visible');
        for (const value of [false, true]) {
          instance.setProperties({ [key]: value });
          const actual = target.visible;
          probe.transitions.push({
            name,
            key,
            nodeId: target.id,
            expected: value,
            actual,
          });
          if (actual !== value)
            throw new Error(`Boolean transition did not reach ${target.id}.`);
        }
      }
      instance.setProperties(edits);
      if (plan.familyId === 'combobox') {
        const exposed = instance.exposedInstances;
        if (exposed.length !== 3)
          throw new Error('Created probe has unexpected option exposure.');
        for (let index = 1; index <= 3; index++) {
          const matches = exposed.filter(
            node => node.name === `mg-combobox__option-${index}`
          );
          if (matches.length !== 1)
            throw new Error('Created probe has ambiguous exposed option.');
          const nested = matches[0];
          const key = mgAcceptanceKey(
            nested.componentProperties,
            'Label',
            'TEXT'
          );
          const target = mgAcceptanceTarget(nested, key, 'characters');
          const value = `Probe option ${index}`;
          nested.setProperties({ [key]: value });
          probe.targets.push({
            instanceId: nested.id,
            nodeId: target.id,
            key,
            type: 'TEXT',
            name: 'Label',
            field: 'characters',
            value,
          });
        }
      }
      if (plan.nestedLabels) {
        for (const [index, nested] of mgAcceptanceTocLinks(
          instance
        ).entries()) {
          const key = mgAcceptanceKey(
              nested.componentProperties,
              'Label',
              'TEXT'
            ),
            target = mgAcceptanceTarget(nested, key, 'characters'),
            value = plan.nestedLabels[index];
          nested.setProperties({ [key]: value });
          probe.targets.push({
            instanceId: nested.id,
            nodeId: target.id,
            key,
            type: 'TEXT',
            name: `Link ${index + 1} Label`,
            field: 'characters',
            value,
          });
          if (index === 0) {
            await mgAcceptanceFonts(nested);
            target.textAlignHorizontal = 'RIGHT';
            probe.format = {
              nodeId: target.id,
              field: 'textAlignHorizontal',
              value: 'RIGHT',
            };
          }
        }
      }
      if (plan.format) {
        const key = mgAcceptanceKey(
          instance.componentProperties,
          plan.format,
          'TEXT'
        );
        const target = mgAcceptanceTarget(instance, key, 'characters');
        if (target.type !== 'TEXT')
          throw new Error('Formatting consumer is not TEXT.');
        await mgAcceptanceFonts(instance);
        target.textAlignHorizontal = 'RIGHT';
        probe.format = {
          nodeId: target.id,
          field: 'textAlignHorizontal',
          value: 'RIGHT',
        };
        if (target.textAlignHorizontal !== 'RIGHT')
          throw new Error('Formatting override was not retained.');
      }
      for (const target of probe.targets) {
        const consumer = await figma.getNodeByIdAsync(target.nodeId);
        const owner = await figma.getNodeByIdAsync(target.instanceId);
        if (
          owner.componentProperties[target.key]?.value !== target.value ||
          consumer[target.field] !== target.value
        )
          throw new Error(`Property edit did not reach ${target.nodeId}.`);
      }
      for (const [name, value] of Object.entries(plan.axes)) {
        const key = mgAcceptanceKey(
          instance.componentProperties,
          name,
          'VARIANT'
        );
        if (instance.componentProperties[key].value !== value)
          throw new Error(`Probe changed variant axis ${name}.`);
      }
      if (plan.width) {
        if (groupId === 'toc') instance.setBoundVariable('width', null);
        instance.resize(plan.width, Math.max(1, instance.height));
        instance.layoutSizingHorizontal = 'FIXED';
        instance.layoutSizingVertical = 'HUG';
        probe.consumerSizing = {
          width: instance.width,
          horizontal: instance.layoutSizingHorizontal,
          vertical: instance.layoutSizingVertical,
        };
        if (
          probe.consumerSizing.width !== plan.width ||
          probe.consumerSizing.horizontal !== 'FIXED' ||
          probe.consumerSizing.vertical !== 'HUG'
        )
          throw new Error(`Consumer sizing was not retained for ${plan.id}.`);
      }
      if (groupId === 'toc') {
        const geometry = mgAcceptanceTocGeometry(instance, plan);
        // Keep actual metrics and failed equations in the restart ledger. The
        // comparison reconstructs every current equation; thousands of repeated
        // passing strings would otherwise exceed Figma's shared-entry limit.
        probe.tocGeometry = {
          metrics: geometry.metrics,
          passed: geometry.passed,
          checks: geometry.checks.filter(item => !item.passed),
        };
      }
      if (groupId === 'status')
        probe.statusSizing = await mgAcceptanceStatusSizing(instance);
      probe.baseline =
        groupId === 'status'
          ? await mgAcceptanceStatusSnapshot(instance)
          : await mgAcceptanceSnapshot(instance, groupId === 'toc');
      probe.complete = true;
      mgAcceptancePersist(root, ledger);
    }
    ledger.complete = true;
  } catch (error) {
    result.errors.push(mgAcceptanceError(error));
  }
  if (root && ledger) {
    try {
      mgAcceptancePersist(root, ledger);
    } catch (error) {
      result.errors.push(`Ledger persistence: ${mgAcceptanceError(error)}`);
    }
    result.ledger = ledger;
  }
  return result;
}

async function compareMangroveOverrideProbes(input, buildResult) {
  const result = {
    operation: 'compare-override-probes',
    rootId: null,
    passed: false,
    assertions: [],
    after: [],
    errors: [],
    nativeAcceptance: 'rendered review still required',
  };
  const assert = (name, expected, actual) =>
    result.assertions.push({
      name,
      passed: JSON.stringify(expected) === JSON.stringify(actual),
      expected,
      actual,
    });
  try {
    const { root, ledger } = await mgAcceptanceLoad(input);
    result.rootId = root.id;
    result.runId = ledger.runId;
    result.groupId = ledger.groupId || 'legacy';
    result.requestedFamilyIds = ledger.requestedFamilyIds;
    result.coverage = ledger.coverage;
    result.limitations = ledger.limitations;
    if (!ledger.complete || ledger.errors.length)
      throw new Error(
        'Preparation was incomplete; evidence retained for inspection.'
      );
    if (
      !buildResult ||
      !Array.isArray(buildResult.errors) ||
      buildResult.errors.length
    )
      throw new Error('Provide a successful ordinary scoped rebuild report.');
    for (const family of ledger.requestedFamilyIds)
      if (
        !buildResult.families?.some(item => item.id === family) ||
        !buildResult.audit?.some(
          item => item.family === family && item.status === 'built'
        )
      )
        throw new Error(`Rebuild report did not successfully cover ${family}.`);
    const collections =
      await figma.variables.getLocalVariableCollectionsAsync();
    const collection = collections.find(
      item => item.id === ledger.collection.id
    );
    assert(
      'applied brand mode',
      ledger.collection.name,
      collection?.modes.find(mode => mode.modeId === ledger.collection.modeId)
        ?.name || null
    );
    if (ledger.groupId === 'toc') {
      if (
        !Array.isArray(ledger.canonicalPaints) ||
        !ledger.canonicalPaints.length
      )
        throw new Error('Missing TOC canonical paint baseline.');
      result.canonicalAfter = [];
      for (const baseline of ledger.canonicalPaints) {
        const node = await figma.getNodeByIdAsync(baseline.nodeId),
          main = await figma.getNodeByIdAsync(baseline.mainComponentId);
        if (
          !node ||
          node.type !== 'TEXT' ||
          !main ||
          main.type !== 'COMPONENT' ||
          !mgAcceptanceTree(main).some(child => child.id === node.id)
        ) {
          assert(`canonical/${baseline.nodeId}: ancestry`, true, false);
          continue;
        }
        const after = {
          nodeId: node.id,
          mainComponentId: main.id,
          ...(await mgAcceptancePaints(node)),
        };
        if (baseline.directTypography)
          after.directTypography =
            await mgAcceptanceDirectTypographySnapshot(node);
        result.canonicalAfter.push(after);
        if (baseline.directTypography)
          for (const field of Object.keys(baseline.directTypography))
            assert(
              `canonical/${node.id}: DIRECT ${field}`,
              baseline.directTypography[field],
              after.directTypography[field]
            );
        for (const field of [
          'fills',
          'rangeFills',
          'resolvedFills',
          'textStyleId',
        ])
          assert(
            `canonical/${node.id}: ${field}`,
            baseline[field],
            after[field]
          );
        if (baseline.expectedRole) {
          for (const [phase, actual] of [
            ['initial', baseline.resolvedFills],
            ['rebuilt', after.resolvedFills],
          ]) {
            const expected = baseline.expectedResolvedFills;
            // Figma stores colour channels at native precision. Preserve full
            // values as evidence; source equality allows only float rounding.
            result.assertions.push({
              name: `canonical/${node.id}: ${phase} source ${baseline.expectedRole}`,
              expected,
              actual,
              channelTolerance: 1e-6,
              passed:
                Array.isArray(actual) &&
                actual.length === expected.length &&
                expected.every(
                  (paint, index) =>
                    paint.visible === actual[index].visible &&
                    ['r', 'g', 'b', 'a'].every(
                      field =>
                        Number.isFinite(actual[index][field]) &&
                        Math.abs(paint[field] - actual[index][field]) <= 1e-6
                    )
                ),
            });
          }
        }
      }
    }
    if (ledger.groupId === 'status') {
      const plans = mgAcceptanceGroup('status').plans;
      if (
        !Array.isArray(ledger.statusCanonical) ||
        ledger.statusCanonical.length !== plans.length ||
        JSON.stringify(ledger.statusCanonical.map(item => item.variantId)) !==
          JSON.stringify(plans.map(plan => plan.variantId))
      )
        throw new Error('Status canonical seven-variant ledger is incomplete.');
      result.statusCanonicalAfter = [];
      for (const before of ledger.statusCanonical) {
        const component = await figma.getNodeByIdAsync(before.mainComponentId);
        if (
          !component ||
          component.type !== 'COMPONENT' ||
          component.parent?.id !== before.setId
        ) {
          assert(`canonical/${before.variantId}: ancestry`, true, false);
          continue;
        }
        const after = await mgAcceptanceStatusSnapshot(component);
        result.statusCanonicalAfter.push(after);
        const text = after.nodes.filter(n => n.type === 'TEXT');
        result.assertions.push({
          name: `canonical/${before.variantId}: rebuilt source status-label/color`,
          expected: before.expectedLabelPaint,
          actual: text[0]?.resolvedFills?.[0],
          channelTolerance: 1e-6,
          passed:
            text.length === 1 &&
            mgAcceptanceStatusColorNear(
              before.expectedLabelPaint,
              text[0]?.resolvedFills?.[0]
            ),
        });
        assert(
          `canonical/${before.variantId}: exact native matrix`,
          before.baseline,
          after
        );
      }
    }
    for (const probe of ledger.probes) {
      const instance = await figma.getNodeByIdAsync(probe.nodeId);
      if (
        !instance ||
        instance.type !== 'INSTANCE' ||
        instance.parent !== root ||
        mgReadIdentity(instance, 'mgKitId') !== probe.mgKitId
      ) {
        assert(`${probe.id}: ownership`, 'original owned INSTANCE', null);
        continue;
      }
      const family = buildResult.families.find(
        item => item.id === probe.familyId
      );
      assert(
        `${probe.id}: rebuild master ID`,
        probe.mainComponentId,
        family.variantIds?.find(item => item.id === probe.variantId)?.nodeId ||
          null
      );
      assert(`${probe.id}: rebuild set ID`, probe.setId, family.setId);
      const after =
        ledger.groupId === 'status'
          ? await mgAcceptanceStatusSnapshot(instance)
          : await mgAcceptanceSnapshot(instance, ledger.groupId === 'toc');
      if (ledger.groupId === 'toc') {
        const plan = mgAcceptanceGroup('toc').plans.find(
            item => item.id === probe.id
          ),
          geometry = mgAcceptanceTocGeometry(instance, plan);
        after.tocGeometry = geometry;
        if (!probe.tocGeometry)
          throw new Error('Missing TOC geometry baseline.');
        assert(
          `${probe.id}/initial: geometry contract`,
          true,
          probe.tocGeometry.passed
        );
        for (const [phase, evidence] of [
          ['initial', probe.tocGeometry],
          ['rebuilt', geometry],
        ])
          for (const item of evidence.checks)
            assert(`${probe.id}/${phase}: ${item.name}`, true, item.passed);
        assert(
          `${probe.id}: geometry node IDs`,
          probe.tocGeometry.metrics.map(item => item.id),
          geometry.metrics.map(item => item.id)
        );
        for (const metric of probe.tocGeometry.metrics) {
          const current = geometry.metrics.find(item => item.id === metric.id);
          if (!current) continue;
          for (const [field, value] of Object.entries(metric)) {
            const actual = current[field];
            assert(
              `${probe.id}/${metric.id}: geometry ${field}`,
              true,
              typeof value === 'number'
                ? Number.isFinite(actual) && Math.abs(value - actual) <= 0.02
                : JSON.stringify(value) === JSON.stringify(actual)
            );
          }
        }
      }
      if (probe.requestedWidth) {
        if (!probe.consumerSizing)
          throw new Error(`Missing consumer sizing evidence for ${probe.id}.`);
        assert(
          `${probe.id}: consumer width`,
          probe.requestedWidth,
          instance.width
        );
        assert(`${probe.id}: consumer sizing`, probe.consumerSizing, {
          width: instance.width,
          horizontal: instance.layoutSizingHorizontal,
          vertical: instance.layoutSizingVertical,
        });
      }
      result.after.push(after);
      assert(
        `${probe.id}: descendant IDs`,
        probe.baseline.nodes.map(node => node.id),
        after.nodes.map(node => node.id)
      );
      for (const before of probe.baseline.nodes) {
        const current = after.nodes.find(node => node.id === before.id);
        if (!current) continue;
        for (const [field, value] of Object.entries(before)) {
          if (field !== 'diagnostics')
            assert(
              `${probe.id}/${before.id}: ${field}`,
              value,
              current[field] ?? null
            );
        }
      }
    }
    result.passed =
      result.assertions.length > 0 &&
      result.assertions.every(item => item.passed);
  } catch (error) {
    result.errors.push(mgAcceptanceError(error));
  }
  return result;
}

async function removeMangroveOverrideProbes(input) {
  const result = {
    operation: 'remove-override-probes',
    removedNodeIds: [],
    absentNodeIds: [],
    retained: [],
    errors: [],
  };
  try {
    const { root, ledger } = await mgAcceptanceLoad(input);
    result.rootId = root.id;
    for (const probe of ledger.probes) {
      const node = await figma.getNodeByIdAsync(probe.nodeId);
      if (!node) {
        result.absentNodeIds.push(probe.nodeId);
        continue;
      }
      const reason =
        node.type !== 'INSTANCE'
          ? 'type changed'
          : node.parent !== root
            ? 'parent changed'
            : mgReadIdentity(node, 'mgKitId') !== probe.mgKitId
              ? 'identity changed'
              : null;
      if (reason) {
        result.retained.push({ id: node.id, reason });
        continue;
      }
      const tree = mgAcceptanceTree(node);
      if (
        ['toc', 'status'].includes(ledger.groupId) &&
        tree.length !== probe.createdTreeIds.length
      ) {
        result.retained.push({
          id: node.id,
          reason: 'recorded acceptance descendants changed or moved',
        });
        continue;
      }
      if (
        tree.some(
          child =>
            !probe.createdTreeIds.includes(child.id) ||
            !ledger.createdNodeIds.includes(child.id)
        )
      ) {
        result.retained.push({ id: node.id, reason: 'unrecorded descendants' });
        continue;
      }
      const ids = tree.map(child => child.id);
      node.remove();
      result.removedNodeIds.push(...ids);
    }
    // A moved/detached probe still keeps the run ledger available for explicit repair.
    if (!root.children.length && !result.retained.length) {
      root.remove();
      result.removedNodeIds.push(root.id);
    } else
      result.retained.push({
        id: root.id,
        reason: 'retained probes or additional children',
      });
  } catch (error) {
    result.errors.push(mgAcceptanceError(error));
  }
  return result;
}
