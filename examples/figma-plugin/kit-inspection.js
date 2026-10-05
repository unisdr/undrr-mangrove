/* global mgReadIdentity, mgWriteIdentity, figma, errorMessage */
/** Desktop Plugin API diagnostics. This file is bundled after code.js. */
const MG_INSPECTION_OWNER_KEYS = ['mgKitId', 'mgComponentId', 'mgNodeId'];
const MG_FOCUS_DIAGNOSTIC_ID = 'diagnostics.focus-ring';
const MG_FOCUS_DIAGNOSTIC_NAME = 'Mangrove diagnostics / focus ring';

function mgInspectionJSON(value) {
  if (typeof value === 'symbol') return 'MIXED';
  if (value === undefined || value === null) return value;
  if (Array.isArray(value)) return value.map(mgInspectionJSON);
  if (typeof value === 'object') {
    const result = {};
    for (const [key, entry] of Object.entries(value)) {
      if (entry !== undefined) result[key] = mgInspectionJSON(entry);
    }
    return result;
  }
  return value;
}

function mgInspectionRead(object, keys, errors) {
  const result = {};
  for (const key of keys) {
    try {
      const value = object[key];
      if (value !== undefined) result[key] = mgInspectionJSON(value);
    } catch (error) {
      errors.push(`${object.id || object.name}.${key}: ${errorMessage(error)}`);
    }
  }
  return result;
}

function mgInspectionIdentity(node) {
  const identity = {};
  for (const key of MG_INSPECTION_OWNER_KEYS) {
    const value = mgReadIdentity(node, key);
    if (value) identity[key] = value;
  }
  return identity;
}

async function mgInspectionResolvedBindings(node, variables, errors) {
  const aliases = new Map();
  function collect(value, path) {
    if (!value || typeof value !== 'object') return;
    if (value.type === 'VARIABLE_ALIAS') {
      aliases.set(path, value.id);
      return;
    }
    for (const [key, entry] of Object.entries(value))
      collect(entry, `${path}.${key}`);
  }
  collect(node.boundVariables, 'boundVariables');
  for (const field of ['fills', 'strokes', 'effects']) {
    const entries = node[field];
    if (Array.isArray(entries)) {
      entries.forEach((entry, index) =>
        collect(entry.boundVariables, `${field}.${index}`)
      );
    }
  }
  const result = [];
  for (const [field, id] of aliases) {
    try {
      const variable =
        variables.get(id) || (await figma.variables.getVariableByIdAsync(id));
      if (!variable) throw new Error(`Variable ${id} no longer exists`);
      result.push({
        field,
        id,
        name: variable.name,
        mgId: mgReadIdentity(variable, 'mgId'),
        resolved: mgInspectionJSON(variable.resolveForConsumer(node)),
      });
    } catch (error) {
      const message = `${node.id} ${field}: ${errorMessage(error)}`;
      errors.push(message);
      result.push({ field, id, error: message });
    }
  }
  return result;
}

async function mgInspectNode(node, variables, errors) {
  const result = mgInspectionRead(
    node,
    [
      'id',
      'name',
      'type',
      'visible',
      'locked',
      'x',
      'y',
      'width',
      'height',
      'absoluteBoundingBox',
      'absoluteRenderBounds',
      'opacity',
      'layoutMode',
      'layoutPositioning',
      'constraints',
      'layoutSizingHorizontal',
      'layoutSizingVertical',
      'primaryAxisSizingMode',
      'counterAxisSizingMode',
      'primaryAxisAlignItems',
      'counterAxisAlignItems',
      'itemSpacing',
      'paddingTop',
      'paddingBottom',
      'paddingLeft',
      'paddingRight',
      'minWidth',
      'maxWidth',
      'minHeight',
      'maxHeight',
      'clipsContent',
      'cornerRadius',
      'topLeftRadius',
      'topRightRadius',
      'bottomLeftRadius',
      'bottomRightRadius',
      'strokeWeight',
      'strokeAlign',
      'strokeCap',
      'strokeJoin',
      'vectorPaths',
      'arcData',
      'fills',
      'strokes',
      'effects',
      'boundVariables',
      'resolvedVariableModes',
      'explicitVariableModes',
      'textStyleId',
      'effectStyleId',
      'characters',
      'fontName',
      'fontSize',
      'fontWeight',
      'lineHeight',
      'letterSpacing',
      'textAutoResize',
      'textAlignHorizontal',
      'textDecoration',
      'textDecorationOffset',
      'textWrapStyle',
      'hasMissingFont',
      'componentPropertyReferences',
    ],
    errors
  );
  result.identity = mgInspectionIdentity(node);
  result.mgKitId = mgReadIdentity(node, 'mgKitId');
  if (result.mgKitId === 'layout/start') {
    result.canvasFlow = {
      version: mgReadIdentity(node, 'mgLayoutFlowVersion'),
      phase: mgReadIdentity(node, 'mgLayoutFlowPhase'),
    };
  }
  const svgAsset = mgReadIdentity(node, 'mgSvgAsset');
  if (svgAsset) {
    try {
      result.svgAsset = JSON.parse(svgAsset);
    } catch (error) {
      errors.push(`${node.id} SVG metadata: ${errorMessage(error)}`);
    }
  }
  result.parentId = node.parent && node.parent.id;
  result.childIds =
    'children' in node ? node.children.map(child => child.id) : [];
  result.ancestry = [];
  for (let parent = node.parent; parent; parent = parent.parent) {
    result.ancestry.push(
      mgInspectionRead(parent, ['id', 'name', 'type', 'clipsContent'], errors)
    );
  }
  if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
    Object.assign(
      result,
      mgInspectionRead(
        node,
        ['key', 'description', 'variantProperties'],
        errors
      )
    );
    // Variant property definitions belong to the parent set.
    if (
      node.type === 'COMPONENT' &&
      node.parent &&
      node.parent.type === 'COMPONENT_SET'
    ) {
      result.componentPropertyDefinitionOwnerId = node.parent.id;
    } else
      Object.assign(
        result,
        mgInspectionRead(node, ['componentPropertyDefinitions'], errors)
      );
  }
  if (node.type === 'INSTANCE') {
    Object.assign(
      result,
      mgInspectionRead(
        node,
        ['componentProperties', 'isExposedInstance'],
        errors
      )
    );
    try {
      result.exposedInstanceIds = node.exposedInstances.map(
        instance => instance.id
      );
    } catch (error) {
      errors.push(`${node.id} exposedInstances: ${errorMessage(error)}`);
    }
    try {
      const main = await node.getMainComponentAsync();
      result.mainComponent = main
        ? { id: main.id, name: main.name, key: main.key }
        : null;
    } catch (error) {
      errors.push(`${node.id} mainComponent: ${errorMessage(error)}`);
    }
  }
  result.resolvedBindings = await mgInspectionResolvedBindings(
    node,
    variables,
    errors
  );
  if (node.type === 'TEXT' && node.characters.length) {
    try {
      result.textRangeFills = mgInspectionJSON(
        node.getRangeFills(0, node.characters.length)
      );
    } catch (error) {
      errors.push(`${node.id} textRangeFills: ${errorMessage(error)}`);
    }
  }
  return result;
}

async function mgInspectFonts() {
  const result = { available: [], loads: [], variations: [], errors: [] };
  const families = ['Roboto', 'Roboto Condensed'];
  try {
    const fonts = await figma.listAvailableFontsAsync();
    result.available = fonts
      .filter(entry => families.includes(entry.fontName.family))
      .map(mgInspectionJSON);
  } catch (error) {
    result.errors.push(`listAvailableFontsAsync: ${errorMessage(error)}`);
  }
  for (const family of families) {
    for (const style of ['Regular', 'Bold', null]) {
      const fontName = style ? { family, style } : { family };
      try {
        await figma.loadFontAsync(fontName);
        result.loads.push({ fontName, loaded: true });
      } catch (error) {
        result.loads.push({
          fontName,
          loaded: false,
          error: errorMessage(error),
        });
      }
    }
    if (typeof figma.getFontFamilyVariationAxes === 'function') {
      try {
        result.variations.push({
          family,
          axes: mgInspectionJSON(
            await figma.getFontFamilyVariationAxes(family)
          ),
        });
      } catch (error) {
        result.variations.push({ family, error: errorMessage(error) });
      }
    } else result.variations.push({ family, supported: false });
  }
  return result;
}

async function inspectMangroveKit({ checkFonts = false } = {}) {
  const errors = [];
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const allVariables = await figma.variables.getLocalVariablesAsync();
  const variablesById = new Map(
    allVariables.map(variable => [variable.id, variable])
  );
  const ownedCollectionIds = new Set(
    collections
      .filter(collection => collection.name === 'Mangrove')
      .map(collection => collection.id)
  );
  allVariables.forEach(variable => {
    if (mgReadIdentity(variable, 'mgId'))
      ownedCollectionIds.add(variable.variableCollectionId);
  });
  const variables = allVariables
    .filter(variable => ownedCollectionIds.has(variable.variableCollectionId))
    .map(variable => ({
      ...mgInspectionRead(
        variable,
        [
          'id',
          'name',
          'key',
          'variableCollectionId',
          'resolvedType',
          'scopes',
          'codeSyntax',
          'valuesByMode',
          'description',
          'hiddenFromPublishing',
        ],
        errors
      ),
      mgId: mgReadIdentity(variable, 'mgId'),
    }));
  const styles = { text: [], effect: [] };
  for (const [kind, getStyles, fields] of [
    [
      'text',
      () => figma.getLocalTextStylesAsync(),
      [
        'fontName',
        'fontSize',
        'lineHeight',
        'letterSpacing',
        'paragraphSpacing',
        'textDecoration',
        'textWrapStyle',
        'boundVariables',
      ],
    ],
    [
      'effect',
      () => figma.getLocalEffectStylesAsync(),
      ['effects', 'boundVariables'],
    ],
  ]) {
    try {
      const local = await getStyles();
      styles[kind] = local
        .filter(
          style =>
            mgReadIdentity(style, 'mgStyleId') ||
            style.name.startsWith('Mangrove/')
        )
        .map(style => ({
          ...mgInspectionRead(
            style,
            ['id', 'name', 'key', 'type', 'description', ...fields],
            errors
          ),
          mgStyleId: mgReadIdentity(style, 'mgStyleId'),
        }));
    } catch (error) {
      errors.push(`Local ${kind} styles: ${errorMessage(error)}`);
    }
  }
  const nodes = [];
  async function visit(node, inheritedOwnership) {
    const owned =
      inheritedOwnership || Object.keys(mgInspectionIdentity(node)).length > 0;
    if (owned) nodes.push(await mgInspectNode(node, variablesById, errors));
    if ('children' in node) {
      for (const child of node.children) await visit(child, owned);
    }
  }
  for (const node of figma.currentPage.children) await visit(node, false);
  return {
    schemaVersion: 1,
    capturedAt: new Date().toISOString(),
    document: {
      id: figma.root.id,
      name: figma.root.name,
      fileKey: figma.fileKey || null,
      editorType: figma.editorType,
    },
    pages: figma.root.children.map(page => ({ id: page.id, name: page.name })),
    currentPage: mgInspectionRead(
      figma.currentPage,
      ['id', 'name', 'resolvedVariableModes', 'explicitVariableModes'],
      errors
    ),
    collections: collections.map(collection =>
      mgInspectionRead(
        collection,
        [
          'id',
          'name',
          'key',
          'defaultModeId',
          'modes',
          'variableIds',
          'hiddenFromPublishing',
        ],
        errors
      )
    ),
    variables,
    styles,
    nodes,
    fonts: checkFonts ? await mgInspectFonts() : null,
    errors,
  };
}

function mgDiagnosticSourceValue(doc, id, brandId, seen = new Set()) {
  if (seen.has(id)) throw new Error(`Diagnostic source alias cycle at ${id}`);
  seen.add(id);
  const variable = doc.variables.find(
    entry => entry.id === id || entry.name === id
  );
  const value = variable && variable.values[brandId];
  if (value === undefined)
    throw new Error(`Diagnostic source value ${id} missing for ${brandId}`);
  return value && typeof value === 'object' && value.alias
    ? mgDiagnosticSourceValue(doc, value.alias, brandId, seen)
    : value;
}

function mgDiagnosticPaint(color) {
  return {
    type: 'SOLID',
    color: { r: color.r, g: color.g, b: color.b },
    opacity: color.a == null ? 1 : color.a,
  };
}

async function createMangroveFocusDiagnostics(doc, brandId) {
  const createdNodeIds = [];
  const updatedNodeIds = [];
  const errors = [];
  // Preflight all document dependencies and the exact font before canvas writes.
  const spec =
    doc.styles && doc.styles.effect.find(entry => entry.id === 'focus-ring');
  const recipe = spec && spec.values[brandId];
  if (!recipe || recipe.length !== 2)
    throw new Error(`Two-band focus recipe missing for ${brandId}`);
  const fontSpec = doc.styles.text.find(
    entry => entry.bindings.fontFamily === 'font-family/text'
  );
  const fontName =
    fontSpec && fontSpec.values[brandId] && fontSpec.values[brandId].fontName;
  if (!fontName || fontName.style !== 'Regular')
    throw new Error('Regular source text font missing');
  await figma.loadFontAsync(fontName);
  const surface = mgDiagnosticSourceValue(doc, 'color.neutral-0', brandId);
  const backdrop = mgDiagnosticSourceValue(doc, 'color.neutral-100', brandId);
  const textColor = mgDiagnosticSourceValue(doc, 'color.neutral-900', brandId);
  const fontSize = mgDiagnosticSourceValue(doc, 'font-size.300', brandId);
  const radius = mgDiagnosticSourceValue(doc, 'radius.form-input', brandId);
  const collection = (
    await figma.variables.getLocalVariableCollectionsAsync()
  ).find(entry => entry.name === doc.collection);
  const brand = doc.modes.find(entry => entry.id === brandId);
  const mode =
    collection &&
    brand &&
    collection.modes.find(entry => entry.name === brand.name);
  if (!mode)
    throw new Error(`Import ${brandId} before creating its focus diagnostics`);
  const effects = await figma.getLocalEffectStylesAsync();
  const styleMatches = effects.filter(
    entry =>
      mgReadIdentity(entry, 'mgStyleId') === spec.id || entry.name === spec.name
  );
  if (styleMatches.length !== 1)
    throw new Error(`Expected exactly one imported ${spec.name} effect style`);
  const style = styleMatches[0];
  const roots = figma.currentPage.children.filter(
    node => mgReadIdentity(node, 'mgKitId') === MG_FOCUS_DIAGNOSTIC_ID
  );
  if (roots.length > 1)
    throw new Error('Duplicate owned focus diagnostics roots');
  if (roots[0] && roots[0].type !== 'FRAME')
    throw new Error('Focus diagnostics root has incompatible type');
  const shapeTypes = {
    source: 'RECTANGLE',
    reverse: 'RECTANGLE',
    bound: 'RECTANGLE',
    clipped: 'COMPONENT',
  };
  if (roots[0]) {
    const expectedTypes = new Map([
      ['diagnostics.focus-ring.title', 'TEXT'],
      ['diagnostics.focus-ring.note', 'TEXT'],
      ...Object.keys(shapeTypes).flatMap(kind => [
        [`diagnostics.focus-ring.label.${kind}`, 'TEXT'],
        [`diagnostics.focus-ring.shape.${kind}`, shapeTypes[kind]],
      ]),
    ]);
    for (const [key, type] of expectedTypes) {
      const matches = roots[0].children.filter(
        node => mgReadIdentity(node, 'mgKitId') === key
      );
      if (matches.length > 1 || (matches[0] && matches[0].type !== type))
        throw new Error(`Ambiguous or incompatible diagnostic node ${key}`);
      if (matches[0] && type === 'TEXT') {
        const fonts =
          matches[0].fontName === figma.mixed
            ? matches[0].getRangeAllFontNames(0, matches[0].characters.length)
            : [matches[0].fontName];
        for (const font of fonts) await figma.loadFontAsync(font);
      }
    }
  }
  const root = roots[0] || figma.createFrame();
  const specimens = [];
  try {
    if (roots.length) updatedNodeIds.push(root.id);
    else {
      createdNodeIds.push(root.id);
      root.x =
        Math.max(
          0,
          ...figma.currentPage.children
            .filter(node => node.id !== root.id)
            .map(node => node.x + node.width)
        ) + 120;
      root.y = 0;
      mgWriteIdentity(root, 'mgKitId', MG_FOCUS_DIAGNOSTIC_ID);
    }
    root.name = MG_FOCUS_DIAGNOSTIC_NAME;
    root.resize(1040, 310);
    root.layoutMode = 'NONE';
    root.clipsContent = false;
    root.fills = [mgDiagnosticPaint(backdrop)];
    root.setExplicitVariableModeForCollection(collection, mode.modeId);

    function upsert(key, type, create) {
      const matches = root.children.filter(
        node => mgReadIdentity(node, 'mgKitId') === key
      );
      if (matches.length > 1 || (matches[0] && matches[0].type !== type))
        throw new Error(`Ambiguous or incompatible diagnostic node ${key}`);
      const node = matches[0] || create();
      if (matches.length) updatedNodeIds.push(node.id);
      else {
        createdNodeIds.push(node.id);
        if (type === 'TEXT') node.fontName = fontName;
        mgWriteIdentity(node, 'mgKitId', key);
        root.appendChild(node);
      }
      return node;
    }
    async function label(key, value, x, y, width) {
      const node = upsert(key, 'TEXT', () => figma.createText());
      // Existing text may have been manually edited to another exact font.
      if (node.fontName !== figma.mixed)
        await figma.loadFontAsync(node.fontName);
      else
        for (const font of node.getRangeAllFontNames(0, node.characters.length))
          await figma.loadFontAsync(font);
      node.fontName = fontName;
      node.fontSize = fontSize;
      node.characters = value;
      node.name = value;
      node.lineHeight = { unit: 'AUTO' };
      node.fills = [mgDiagnosticPaint(textColor)];
      node.textAutoResize = 'HEIGHT';
      node.resize(width, Math.max(node.height, 1));
      node.x = x;
      node.y = y;
      return node;
    }
    await label(
      'diagnostics.focus-ring.title',
      `Focus ring diagnostics / ${brand.name}`,
      24,
      20,
      992
    );
    await label(
      'diagnostics.focus-ring.note',
      'Source order, reversed order and imported style on opaque shapes. Diagnostic geometry only.',
      24,
      260,
      992
    );
    for (const [index, kind, name] of [
      [0, 'source', 'Literal source order'],
      [1, 'reverse', 'Literal reversed order'],
      [2, 'bound', 'Imported style / rectangle'],
      [3, 'clipped', 'Imported style / clipped frame'],
    ]) {
      const x = 24 + index * 256;
      await label(`diagnostics.focus-ring.label.${kind}`, name, x, 64, 220);
      const node = upsert(
        `diagnostics.focus-ring.shape.${kind}`,
        shapeTypes[kind],
        () =>
          kind === 'clipped' ? figma.createComponent() : figma.createRectangle()
      );
      node.name =
        kind === 'clipped' ? 'Diagnostics / focus ring surface' : name;
      node.resize(220, 84);
      node.x = x;
      node.y = 136;
      node.fills = [mgDiagnosticPaint(surface)];
      node.strokes = [];
      node.cornerRadius = radius;
      if (kind === 'clipped') {
        node.clipsContent = true;
        node.description =
          'Persistent diagnostic surface for checking the imported focus effect. Diagnostic geometry only; this is not a Mangrove kit component.';
      }
      if (kind === 'bound' || kind === 'clipped')
        await node.setEffectStyleIdAsync(style.id);
      else {
        await node.setEffectStyleIdAsync('');
        node.effects = mgInspectionJSON(
          kind === 'reverse' ? [...recipe].reverse() : recipe
        ).map(entry => entry.effect);
      }
      specimens.push(node);
    }
  } catch (error) {
    errors.push(`Focus diagnostics canvas update: ${errorMessage(error)}`);
  }
  const variables = new Map(
    (await figma.variables.getLocalVariablesAsync()).map(variable => [
      variable.id,
      variable,
    ])
  );
  const specimenReports = [];
  for (const node of specimens)
    specimenReports.push(await mgInspectNode(node, variables, errors));
  return {
    rootId: root.id,
    name: root.name,
    brandId,
    createdNodeIds,
    updatedNodeIds,
    specimens: specimenReports,
    errors,
  };
}

async function exportMangroveReview(name, { scale = 2, familyId } = {}) {
  if (!Number.isFinite(scale) || scale <= 0 || scale > 4)
    throw new Error('Review export scale must be greater than 0 and at most 4');
  const rootKey =
    name === 'Mangrove / Review'
      ? 'review'
      : name === 'Mangrove diagnostics / focus ring'
        ? MG_FOCUS_DIAGNOSTIC_ID
        : null;
  if (!rootKey) throw new Error('Unknown Mangrove review export target.');
  if (
    familyId !== undefined &&
    (rootKey !== 'review' ||
      typeof familyId !== 'string' ||
      !/^[a-z0-9][a-z0-9.-]*$/.test(familyId))
  )
    throw new Error(
      'Family export needs one valid family ID and the review root.'
    );
  const page = figma.currentPage;
  function sectionParent(key) {
    const matches = page.findAll(
      node => mgReadIdentity(node, 'mgKitId') === key
    );
    if (
      matches.length !== 1 ||
      matches[0].type !== 'SECTION' ||
      matches[0].parent !== page
    )
      throw new Error(`Expected one top-level kit section ${key}.`);
    return matches[0];
  }
  function ownedFrame(key, parent) {
    const nodes = page.findAll(node => mgReadIdentity(node, 'mgKitId') === key);
    if (nodes.length !== 1)
      throw new Error(`Expected one owned review frame with identity ${key}`);
    const node = nodes[0];
    if (node.type !== 'FRAME')
      throw new Error(`Owned review ${key} is not a frame.`);
    if (node.parent !== parent)
      throw new Error(`Owned review ${key} is outside its expected parent.`);
    return node;
  }
  const organized =
    page.findAll(node => mgReadIdentity(node, 'mgKitId') === 'layout/start')
      .length > 0;
  const root = ownedFrame(
    rootKey,
    organized
      ? sectionParent(
          rootKey === 'review' ? 'layout/components' : 'layout/pending'
        )
      : page
  );
  let familyParent = root;
  if (organized && familyId !== undefined) {
    const area =
      typeof mgLayoutDestination === 'function'
        ? mgLayoutDestination(familyId)
        : 'components';
    if (area !== 'components')
      familyParent = ownedFrame(
        `layout/${area}/review`,
        sectionParent(`layout/${area}`)
      );
  }
  const node =
    familyId === undefined
      ? root
      : ownedFrame(`review/${familyId}`, familyParent);
  const bytes = await node.exportAsync({
    format: 'PNG',
    constraint: { type: 'SCALE', value: scale },
  });
  return {
    id: node.id,
    name: node.name,
    width: node.width,
    height: node.height,
    scale,
    scope:
      familyId !== undefined
        ? 'family'
        : rootKey === 'review'
          ? 'review'
          : 'diagnostics',
    familyId: familyId ?? null,
    rootId: root.id,
    bytes: Array.from(bytes),
  };
}
