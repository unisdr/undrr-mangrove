/* global figma, mgReadIdentity, mgWriteIdentity, mgAcceptanceFonts, mgAcceptanceRightEdge, mgAcceptanceKey, mgAcceptanceTarget, mgAcceptanceTree, mgAcceptanceJSON */
/** Owned native editorial probes. Requires kit-acceptance.js utility functions.
 * Text/constraints readbacks are evidence; mock layout is never native acceptance.
 * https://developers.figma.com/docs/plugins/api/InstanceNode/
 * https://developers.figma.com/docs/plugins/api/TextNode/
 */
const MG_EDITORIAL_LEDGER_KEY = 'mgEditorialAcceptanceLedger';
const MG_EDITORIAL_PLANS = [
  {
    id: 'long-default',
    variantId: 'editorial-cta.base.default.long.nopreference',
    state: 'Default',
    content: 'Long',
  },
  {
    id: 'long-hover',
    variantId: 'editorial-cta.base.hover.long.nopreference',
    state: 'Hover',
    content: 'Long',
  },
  {
    id: 'short-default',
    variantId: 'editorial-cta.base.default.short.nopreference',
    state: 'Default',
    content: 'Short',
  },
];
const MG_EDITORIAL_FRENCH =
  'Consulter toutes les publications sur la réduction des risques de catastrophe';
const MG_EDITORIAL_UNBROKEN =
  'MangrovePublicationReferenceWithoutAnySpaces'.repeat(3);

function mgEditorialError(error) {
  return error?.message || String(error);
}
function mgEditorialPersist(root, ledger) {
  const json = JSON.stringify(ledger).replace(
    /[\u007f-\uffff]/g,
    c => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`
  );
  if (json.length > 90000)
    throw new Error('Editorial probe ledger exceeds the bounded shared entry.');
  mgWriteIdentity(root, MG_EDITORIAL_LEDGER_KEY, json);
}
async function mgEditorialLoad(input) {
  const rootId = typeof input === 'string' ? input : input?.rootId;
  if (typeof rootId !== 'string' || !rootId)
    throw new Error(
      'Provide the exact editorial probe root ID or saved report.'
    );
  const root = await figma.getNodeByIdAsync(rootId);
  if (!root || root.removed)
    throw new Error('Editorial probe root is unavailable.');
  const ledger = JSON.parse(
    mgReadIdentity(root, MG_EDITORIAL_LEDGER_KEY) || 'null'
  );
  if (
    !ledger ||
    ledger.kind !== 'mangrove-editorial-acceptance' ||
    ledger.version !== 1 ||
    ledger.rootId !== root.id ||
    !/^[a-z0-9-]+$/.test(ledger.runId || '') ||
    root.type !== 'FRAME' ||
    root.parent?.id !== ledger.pageId ||
    mgReadIdentity(root, 'mgKitId') !==
      `acceptance-editorial/${ledger.runId}` ||
    !Array.isArray(ledger.probes) ||
    ledger.probes.length > 3 ||
    !Array.isArray(ledger.nodes) ||
    ledger.nodes.length > 64 ||
    new Set(ledger.nodes.map(n => n.id)).size !== ledger.nodes.length ||
    !ledger.nodes.some(n => n.id === root.id)
  )
    throw new Error('Editorial ledger ownership, type or bounds are invalid.');
  const supplied = typeof input === 'string' ? null : input?.ledger || input;
  if (supplied && supplied.runId !== ledger.runId)
    throw new Error('Saved editorial run does not match the persisted root.');
  const seen = new Set();
  for (const probe of ledger.probes) {
    if (
      !MG_EDITORIAL_PLANS.some(
        p => p.id === probe.id && p.variantId === probe.variantId
      ) ||
      typeof probe.nodeId !== 'string' ||
      seen.has(probe.nodeId) ||
      probe.parentId !== root.id ||
      probe.mgKitId !== `acceptance-editorial/${ledger.runId}/${probe.id}` ||
      !ledger.nodes.some(n => n.id === probe.nodeId && n.type === 'INSTANCE')
    )
      throw new Error('Editorial probe record is invalid.');
    seen.add(probe.nodeId);
  }
  return { root, ledger };
}
async function mgEditorialSnapshot(instance, probe) {
  const main = await instance.getMainComponentAsync();
  const fresh = await figma.getNodeByIdAsync(instance.id);
  if (!fresh || fresh.type !== 'INSTANCE')
    throw new Error('Owned editorial instance was removed or detached.');
  const key = mgAcceptanceKey(fresh.componentProperties, 'Label', 'TEXT');
  const label = mgAcceptanceTarget(fresh, key, 'characters');
  const badges = fresh.findAll(n => n.name === 'mg-button-cta / badge');
  if (
    label.type !== 'TEXT' ||
    badges.length !== 1 ||
    badges[0].type !== 'FRAME'
  )
    throw new Error('Editorial Label/badge anatomy is ambiguous.');
  const badge = badges[0];
  const fields = node =>
    mgAcceptanceJSON(
      Object.fromEntries(
        [
          'id',
          'type',
          'x',
          'y',
          'width',
          'height',
          'layoutSizingHorizontal',
          'layoutSizingVertical',
          'layoutPositioning',
          'constraints',
          'clipsContent',
          'boundVariables',
        ].map(field => [field, node[field]])
      )
    );
  const lh = label.lineHeight;
  const lineHeightPixels =
    lh?.unit === 'PIXELS'
      ? lh.value
      : lh?.unit === 'PERCENT' && typeof label.fontSize === 'number'
        ? (label.fontSize * lh.value) / 100
        : null;
  return mgAcceptanceJSON({
    instance: {
      ...fields(fresh),
      parentId: fresh.parent?.id,
      mainComponentId: main?.id,
      mgKitId: mgReadIdentity(fresh, 'mgKitId'),
      properties: fresh.componentProperties,
    },
    label: {
      ...fields(label),
      characters: label.characters,
      propertyKey: key,
      fontName: label.fontName,
      fontSize: label.fontSize,
      lineHeight: lh,
      textStyleId: label.textStyleId,
      textAutoResize: label.textAutoResize,
      textDecoration: label.textDecoration,
      textDecorationOffset: label.textDecorationOffset,
      lineMetrics: {
        boundingBoxHeight: label.height,
        lineHeightPixels,
        estimatedLineCount: lineHeightPixels
          ? label.height / lineHeightPixels
          : null,
        limitation:
          'Bounding-box estimate only. Plugin API does not expose per-line glyph boxes here.',
      },
    },
    badge: fields(badge),
    treeIds: mgAcceptanceTree(fresh).map(n => n.id),
    expectedState: probe.state,
  });
}
function mgEditorialGeometry(snapshot, probe, expectedText, expectedWidth) {
  const assertions = [];
  const add = (name, expected, actual) =>
    assertions.push({
      name,
      expected,
      actual,
      passed:
        typeof expected === 'number'
          ? Number.isFinite(actual) && Math.abs(expected - actual) < 0.01
          : JSON.stringify(expected) === JSON.stringify(actual),
    });
  const { instance, label, badge } = snapshot;
  add(
    'edited Label property',
    expectedText,
    instance.properties[label.propertyKey]?.value
  );
  add('edited text consumer', expectedText, label.characters);
  if (expectedWidth !== null)
    add('requested consumer width', expectedWidth, instance.width);
  add('root vertical HUG', 'HUG', instance.layoutSizingVertical);
  add('Label available width', instance.width - 29, label.width);
  add('badge width', 22, badge.width);
  add('badge height', 22, badge.height);
  add(
    'badge end offset',
    instance.width - (probe.state === 'Hover' ? 20 : 23),
    badge.x
  );
  add('badge center', (instance.height - 22) / 2, badge.y);
  add('badge positioning', 'ABSOLUTE', badge.layoutPositioning);
  add(
    'badge constraints',
    { horizontal: 'MAX', vertical: 'CENTER' },
    badge.constraints
  );
  add('root unclipped', false, instance.clipsContent);
  add(
    'Label decoration',
    probe.state === 'Hover' ? 'UNDERLINE' : 'NONE',
    label.textDecoration
  );
  add(
    'Label offset',
    probe.state === 'Hover' ? { unit: 'PERCENT', value: 20 } : null,
    label.textDecorationOffset
  );
  return assertions;
}
function mgEditorialRecordTree(root, instance, ledger, sourceKeys) {
  for (const node of mgAcceptanceTree(instance)) {
    const ownership = mgReadIdentity(node, 'mgKitId');
    if (node !== instance && !sourceKeys.has(ownership))
      throw new Error(
        'Probe mutation produced an unowned or unexpected descendant.'
      );
    if (!ledger.nodes.some(n => n.id === node.id))
      ledger.nodes.push({
        id: node.id,
        type: node.type,
        parentId: node.parent?.id,
        mgKitId: ownership,
      });
  }
  if (ledger.nodes.length > 64)
    throw new Error('Editorial probe node count exceeds the bounded ledger.');
  mgEditorialPersist(root, ledger);
}
async function prepareMangroveEditorialProbes(doc, brandId) {
  const result = {
    operation: 'prepare-editorial-probes',
    rootId: null,
    createdNodeIds: [],
    ledger: null,
    errors: [],
    nativeAcceptance:
      'Native readbacks and rendered review required; no browser parity assertion.',
  };
  let root, ledger;
  try {
    const brands = (doc?.modes || []).filter(m => m.id === brandId);
    const collections = (
      await figma.variables.getLocalVariableCollectionsAsync()
    ).filter(c => c.name === doc?.collection);
    if (brands.length !== 1 || collections.length !== 1)
      throw new Error(
        'A unique exported brand and imported collection are required.'
      );
    const modes = collections[0].modes.filter(m => m.name === brands[0].name);
    if (modes.length !== 1)
      throw new Error(
        'Apply the requested brand before preparing editorial probes.'
      );
    const families = (doc.components?.families || []).filter(
      f => f.id === 'editorial-cta'
    );
    if (families.length !== 1)
      throw new Error('An exact editorial CTA recipe is required.');
    const page = figma.currentPage;
    const owned = page.findAll(n => {
      for (let p = n.parent; p && p !== page; p = p.parent)
        if (p.type === 'INSTANCE') return false;
      return !!mgReadIdentity(n, 'mgKitId');
    });
    const unique = (key, type) => {
      const matches = owned.filter(n => mgReadIdentity(n, 'mgKitId') === key);
      if (matches.length !== 1 || matches[0].type !== type)
        throw new Error(`Missing or ambiguous owned ${key}.`);
      return matches[0];
    };
    const main = unique('main', 'FRAME'),
      set = unique('family/editorial-cta', 'COMPONENT_SET');
    if (main.parent !== page || set.parent !== main)
      throw new Error('Editorial main ancestry is invalid.');
    const sources = [];
    for (const plan of MG_EDITORIAL_PLANS) {
      const specs = families[0].variants.filter(v => v.id === plan.variantId);
      if (specs.length !== 1)
        throw new Error(`Missing exact source variant ${plan.variantId}.`);
      const component = unique(
        `family/editorial-cta/variant/${plan.variantId}`,
        'COMPONENT'
      );
      if (component.parent !== set)
        throw new Error('Editorial variant is outside its original set.');
      for (const [axis, value] of Object.entries({
        Context: 'Base',
        State: plan.state,
        Content: plan.content,
        Motion: 'NoPreference',
      }))
        if (
          specs[0].properties[axis] !== value ||
          component.variantProperties?.[axis] !== value
        )
          throw new Error(`Changed source/native axis ${axis}.`);
      const key = mgAcceptanceKey(
        set.componentPropertyDefinitions,
        'Label',
        'TEXT'
      );
      if (mgAcceptanceTarget(component, key, 'characters').type !== 'TEXT')
        throw new Error('Editorial Label is not TEXT.');
      const fonts = await mgAcceptanceFonts(component);
      sources.push({
        plan,
        component,
        fonts,
        sourceKeys: new Set(
          component.findAll(() => true).map(n => mgReadIdentity(n, 'mgKitId'))
        ),
      });
    }
    const x = mgAcceptanceRightEdge(page) + 160;
    const runId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    if (
      owned.some(n =>
        mgReadIdentity(n, 'mgKitId').startsWith(`acceptance-editorial/${runId}`)
      )
    )
      throw new Error('Editorial run identity collision.');
    root = figma.createFrame();
    result.rootId = root.id;
    result.createdNodeIds.push(root.id);
    root.name = `Mangrove editorial acceptance / ${runId}`;
    mgWriteIdentity(root, 'mgKitId', `acceptance-editorial/${runId}`);
    if (root.parent !== page) page.appendChild(root);
    root.layoutMode = 'VERTICAL';
    root.primaryAxisSizingMode = 'AUTO';
    root.counterAxisSizingMode = 'AUTO';
    root.itemSpacing = 32;
    root.paddingTop =
      root.paddingBottom =
      root.paddingLeft =
      root.paddingRight =
        24;
    root.fills = [];
    root.clipsContent = false;
    root.x = x;
    root.y = Number.isFinite(main.y) ? main.y : 0;
    ledger = {
      kind: 'mangrove-editorial-acceptance',
      version: 1,
      runId,
      rootId: root.id,
      pageId: page.id,
      brandId,
      collection: {
        id: collections[0].id,
        modeId: modes[0].modeId,
        name: modes[0].name,
      },
      setId: set.id,
      nodes: [
        {
          id: root.id,
          type: 'FRAME',
          parentId: page.id,
          mgKitId: `acceptance-editorial/${runId}`,
        },
      ],
      probes: [],
      complete: false,
      errors: result.errors,
      limitations: [
        'Only three Base variants of the applied brand; no Hero/RTL/browser glyph parity/publishing acceptance.',
        'Bounding-box/line-height estimates are diagnostic; no per-line glyph box API is claimed.',
      ],
    };
    mgEditorialPersist(root, ledger);
    for (const { plan, component, fonts, sourceKeys } of sources) {
      try {
        const instance = component.createInstance();
        result.createdNodeIds.push(
          ...mgAcceptanceTree(instance).map(node => node.id)
        );
        const probe = {
          ...plan,
          nodeId: instance.id,
          parentId: root.id,
          mgKitId: `acceptance-editorial/${runId}/${plan.id}`,
          mainComponentId: component.id,
          fonts,
          steps: [],
          complete: false,
        };
        ledger.probes.push(probe);
        mgWriteIdentity(instance, 'mgKitId', probe.mgKitId);
        root.appendChild(instance);
        instance.name = `Editorial probe / ${plan.id}`;
        mgEditorialRecordTree(root, instance, ledger, sourceKeys);
        instance.setExplicitVariableModeForCollection(
          collections[0],
          modes[0].modeId
        );
        const steps =
          plan.content === 'Short'
            ? [{ text: 'Short CTA', width: null }]
            : [
                { text: 'Short CTA', width: 260 },
                { text: MG_EDITORIAL_FRENCH, width: 320 },
                { text: MG_EDITORIAL_UNBROKEN, width: 240 },
                { text: 'Short CTA', width: 260 },
                plan.state === 'Default'
                  ? { text: MG_EDITORIAL_FRENCH, width: 260 }
                  : { text: MG_EDITORIAL_UNBROKEN, width: 240 },
              ];
        for (const edit of steps) {
          const fresh = await figma.getNodeByIdAsync(instance.id);
          if (!fresh || fresh.type !== 'INSTANCE')
            throw new Error('Probe instance unavailable before edit.');
          const key = mgAcceptanceKey(
            fresh.componentProperties,
            'Label',
            'TEXT'
          );
          fresh.setProperties({ [key]: edit.text });
          if (edit.width !== null) {
            fresh.setBoundVariable('width', null);
            fresh.resize(edit.width, fresh.height);
            fresh.layoutSizingHorizontal = 'FIXED';
            fresh.layoutSizingVertical = 'HUG';
          }
          mgEditorialRecordTree(root, fresh, ledger, sourceKeys);
          const snapshot = await mgEditorialSnapshot(fresh, probe);
          const assertions = mgEditorialGeometry(
            snapshot,
            probe,
            edit.text,
            edit.width
          );
          probe.steps.push({ edit, snapshot, assertions });
          mgEditorialPersist(root, ledger);
        }
        probe.baseline = probe.steps.at(-1).snapshot;
        probe.finalEdit = probe.steps.at(-1).edit;
        probe.complete = probe.steps.every(s =>
          s.assertions.every(a => a.passed)
        );
        if (!probe.complete)
          result.errors.push(
            `${plan.id}: native geometry/decoration readbacks did not meet the source contract.`
          );
      } catch (error) {
        result.errors.push(`${plan.id}: ${mgEditorialError(error)}`);
      }
    }
    ledger.complete =
      ledger.probes.length === 3 &&
      ledger.probes.every(p => p.complete) &&
      !result.errors.length;
  } catch (error) {
    result.errors.push(mgEditorialError(error));
  }
  if (root && ledger) {
    result.createdNodeIds = [
      ...new Set([...result.createdNodeIds, ...ledger.nodes.map(n => n.id)]),
    ];
    try {
      mgEditorialPersist(root, ledger);
    } catch (error) {
      result.errors.push(`Ledger persistence: ${mgEditorialError(error)}`);
    }
    result.ledger = ledger;
  }
  return result;
}
async function compareMangroveEditorialProbes(input, buildReport) {
  const result = {
    operation: 'compare-editorial-probes',
    rootId: null,
    passed: false,
    assertions: [],
    after: [],
    errors: [],
    nativeAcceptance: 'Rendered review remains required.',
  };
  try {
    const { root, ledger } = await mgEditorialLoad(input);
    result.rootId = root.id;
    if (!ledger.complete || ledger.errors.length)
      throw new Error(
        'Editorial preparation incomplete; inspect the retained evidence.'
      );
    const rebuilt = buildReport?.families?.filter(
      f => f.id === 'editorial-cta'
    );
    if (
      !Array.isArray(buildReport?.errors) ||
      buildReport.errors.length ||
      rebuilt?.length !== 1 ||
      !buildReport.audit?.some(
        a => a.family === 'editorial-cta' && a.status === 'built'
      )
    )
      throw new Error(
        'Provide a successful ordinary editorial CTA rebuild report.'
      );
    const add = (name, expected, actual) =>
      result.assertions.push({
        name,
        expected,
        actual,
        passed: JSON.stringify(expected) === JSON.stringify(actual),
      });
    add('original set ID', ledger.setId, rebuilt[0].setId);
    const collection = (
      await figma.variables.getLocalVariableCollectionsAsync()
    ).find(c => c.id === ledger.collection.id);
    add(
      'applied brand mode',
      ledger.collection.name,
      collection?.modes.find(m => m.modeId === ledger.collection.modeId)
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
        add(`${probe.id} ownership`, 'original owned INSTANCE', null);
        continue;
      }
      add(
        `${probe.id} rebuilt master`,
        probe.mainComponentId,
        rebuilt[0].variantIds?.find(v => v.id === probe.variantId)?.nodeId ||
          null
      );
      const after = await mgEditorialSnapshot(instance, probe);
      result.after.push(after);
      for (const field of ['instance', 'label', 'badge', 'treeIds'])
        add(
          `${probe.id} preserved ${field}`,
          probe.baseline[field],
          after[field]
        );
      result.assertions.push(
        ...mgEditorialGeometry(
          after,
          probe,
          probe.finalEdit.text,
          probe.finalEdit.width
        ).map(a => ({ ...a, name: `${probe.id}: ${a.name}` }))
      );
    }
    result.passed =
      result.assertions.length > 0 && result.assertions.every(a => a.passed);
  } catch (error) {
    result.errors.push(mgEditorialError(error));
  }
  return result;
}
async function removeMangroveEditorialProbes(input) {
  const result = {
    operation: 'remove-editorial-probes',
    removedNodeIds: [],
    retained: [],
    errors: [],
  };
  try {
    const { root, ledger } = await mgEditorialLoad(input);
    result.rootId = root.id;
    const current = mgAcceptanceTree(root),
      recorded = new Map(ledger.nodes.map(n => [n.id, n]));
    for (const node of current) {
      const entry = recorded.get(node.id);
      if (
        !entry ||
        entry.type !== node.type ||
        entry.parentId !== node.parent?.id ||
        entry.mgKitId !== mgReadIdentity(node, 'mgKitId')
      )
        throw new Error(
          `Cleanup refused foreign, moved, retyped or unrecorded node ${node.id}.`
        );
    }
    const present = new Set(current.map(n => n.id));
    for (const entry of ledger.nodes) {
      const node = await figma.getNodeByIdAsync(entry.id);
      if (node && !node.removed && !present.has(node.id))
        throw new Error(
          `Cleanup refused recorded node outside its root ${node.id}.`
        );
    }
    const ids = current.map(n => n.id);
    root.remove();
    result.removedNodeIds = ids;
  } catch (error) {
    result.errors.push(mgEditorialError(error));
    if (result.rootId)
      result.retained.push({
        id: result.rootId,
        reason:
          'Exact-ledger validation failed; all existing evidence retained.',
      });
  }
  return result;
}
