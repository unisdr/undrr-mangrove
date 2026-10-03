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

async function mgAcceptanceSnapshot(instance) {
  const nodes = [];
  for (const node of mgAcceptanceTree(instance)) {
    const record = {
      id: node.id,
      type: node.type,
      parentId: node.parent?.id || null,
      visible: node.visible,
      effectiveVisible: mgAcceptanceVisible(node),
    };
    for (const field of [
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
    ]) {
      if (node[field] !== undefined)
        record[field] = mgAcceptanceJSON(node[field]);
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

function mgAcceptancePersist(root, ledger) {
  const json = JSON.stringify(ledger);
  // Figma caps a shared entry at 100 kB including namespace and key.
  // ASCII escaping keeps this bound independent of UTF-8 character widths.
  const ascii = json.replace(
    /[\u007f-\uffff]/g,
    character => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`
  );
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
  const ledger = JSON.parse(raw);
  if (
    ledger.version !== 1 ||
    ledger.rootId !== root.id ||
    typeof ledger.runId !== 'string' ||
    !/^[a-z0-9-]+$/.test(ledger.runId) ||
    !Array.isArray(ledger.probes) ||
    ledger.probes.length > 3 ||
    !Array.isArray(ledger.createdNodeIds) ||
    root.type !== 'FRAME' ||
    mgReadIdentity(root, 'mgKitId') !== `acceptance/${ledger.runId}` ||
    root.parent?.id !== ledger.pageId
  )
    throw new Error('Acceptance root ownership, type or ledger is invalid.');
  if (typeof input !== 'string' && input.runId !== ledger.runId)
    throw new Error('Saved run does not match the persisted acceptance root.');
  const ids = new Set([root.id]);
  for (const probe of ledger.probes) {
    if (
      !MG_ACCEPTANCE_PLANS.some(plan => plan.id === probe.id) ||
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
  }
  return { root, ledger };
}

async function prepareMangroveOverrideProbes(doc, brandId) {
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
    for (const plan of MG_ACCEPTANCE_PLANS) {
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
      sources.push({ plan, component, set, fonts });
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
      runId,
      rootId: null,
      pageId: page.id,
      brandId,
      collection: {
        id: collections[0].id,
        modeId: modes[0].modeId,
        name: modes[0].name,
      },
      requestedFamilyIds: ['combobox', 'combobox-option', 'radio'],
      createdNodeIds: result.createdNodeIds,
      probes: [],
      complete: false,
      errors: result.errors,
      coverage: [
        'root TEXT/BOOLEAN',
        'three exposed option TEXT properties',
        'one direct text alignment override',
        'unchanged checked/invalid variant axes',
      ],
      limitations: [
        'Visibility flags do not establish painted visibility under clipping or occlusion.',
        'Default Radio has a hidden error ancestor.',
        'Open Combo has no Error message consumer.',
        'No all-brand, arbitrary-size, publishing or keyboard acceptance is implied.',
      ],
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
      probe.baseline = await mgAcceptanceSnapshot(instance);
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
      const after = await mgAcceptanceSnapshot(instance);
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
