/* global MG_CONNECTOR_NATIVE_TEXT_INSTANCES, mgNativeCollectionsFontPlan, mgNativeCollectionsSceneLedger, mgNativeCollectionsValidateValues, nativeCollectionImportSnapshot, mgNativeCollectionsSourceCapability, MG_CONNECTOR_NATIVE_COLLECTIONS, mgNativeCollectionsSourcePlan, mgNativeCollectionsPreflight, mgNativeCollectionsApplyModes, mgAlphaMaskPlan, mgAlphaMaskDocumentValues, mgAlphaMaskNativeValues, mgNativeAlphaMaskPlan, mgApplyAlphaMask, MG_CONNECTOR_ALPHA_MASK, mgFrozenSourceLine, MG_CONNECTOR_FROZEN_SOURCE_LINE, mgGradientTransform, MG_CONNECTOR_GRADIENT_ROLES, mgTextThicknessPlan, mgNativeTextThicknessPlan, mgApplyTextThickness, MG_CONNECTOR_TEXT_THICKNESS, mgResolveNamedFontDefaults, mgAssertExperimentOperationTarget, mgSvgSizingPlan, mgSvgSizingDocumentValues, mgSvgSizingNativeValues, mgSvgSizingNativePlan, mgApplySvgSizing, MG_CONNECTOR_SVG_SIZING, MG_CONNECTOR_SVG_SIZING_SOURCE, mgRichText, MG_CONNECTOR_RICH_SOURCE_VALIDATION, MG_CONNECTOR_RICH_TEXT, validateMangroveImport, preflightMangroveAssets, mgReadIdentity, mgWriteIdentity, figma, importStyles, errorMessage, MG_SHARED_ONLY, MG_IDENTITY_NAMESPACE, MG_CONNECTOR_SVG, MG_CONNECTOR_ABSOLUTE, MG_CONNECTOR_ABSOLUTE_START, MG_CONNECTOR_INTRINSIC_REVIEW, MG_CONNECTOR_ARC, MG_CONNECTOR_DIRECT_TEXT, MG_CONNECTOR_COINCIDENT_FOCUS, mgLayoutPreflight, mgLayoutLoadExistingFonts, mgLayoutContainerParent, mgLayoutReviewParent, mgLayoutGrid, mgLayoutLegacySpacing, organizeMangroveKit, mgWelcomeLegacySpacing */
// Native component construction from exporter-owned recipes. Bundled at build time.
const MG_KIT_KEY = 'mgKitId';
const MG_KIT_PROPERTY_KEY = 'mgKitProperties';
const MG_ALPHA_MASK_ENABLED =
  typeof MG_CONNECTOR_ALPHA_MASK === 'undefined' || MG_CONNECTOR_ALPHA_MASK;
const MG_ALPHA_MASK_KEY = 'mgAlphaMaskV1';
const MG_FROZEN_SOURCE_LINE_ENABLED =
  typeof MG_CONNECTOR_FROZEN_SOURCE_LINE === 'undefined' ||
  MG_CONNECTOR_FROZEN_SOURCE_LINE;
const MG_MAINTENANCE_POLICY_KEY = 'mgMaintenancePolicy';

function mgMaintenanceParsePolicy(node) {
  const raw = mgReadIdentity(node, MG_MAINTENANCE_POLICY_KEY);
  if (!raw) return null;
  let policy;
  try {
    policy = JSON.parse(raw);
  } catch (_) {
    throw new Error(`Invalid maintenance policy on ${node.id}: expected JSON.`);
  }
  if (
    !policy ||
    typeof policy !== 'object' ||
    Array.isArray(policy) ||
    Object.keys(policy).length !== 3 ||
    Object.keys(policy).some(
      key => !['version', 'owner', 'reason'].includes(key)
    ) ||
    policy.version !== 1 ||
    !['source', 'manual'].includes(policy.owner) ||
    typeof policy.reason !== 'string' ||
    (policy.owner === 'manual'
      ? !policy.reason.trim() || policy.reason.length > 2000
      : policy.reason !== '')
  )
    throw new Error(`Invalid maintenance policy on ${node.id}.`);
  return policy;
}

function mgMaintenanceInspectFamily(familyId, owned, collect) {
  const prefix = `family/${familyId}`;
  const set = owned.get(prefix);
  let policy;
  function inspect(node) {
    const marker = mgMaintenanceParsePolicy(node);
    if (marker) {
      if (
        policy &&
        (marker.owner !== policy.owner || marker.reason !== policy.reason)
      )
        throw new Error(`Conflicting maintenance policies for ${familyId}.`);
      policy = marker;
    }
    if (collect) collect(node, marker);
  }
  if (set) {
    if (set.type !== 'COMPONENT_SET')
      throw new Error(`Maintenance family ${familyId} has changed type.`);
    inspect(set);
  }
  for (const [key, node] of owned) {
    if (!key.startsWith(`${prefix}/variant/`)) continue;
    // The builder indexes anatomy below a variant as well as the main itself.
    if (key.slice(`${prefix}/variant/`.length).includes('/')) continue;
    if (node.type !== 'COMPONENT' || !set || node.parent !== set)
      throw new Error(`Maintenance variant ${node.id} has changed ownership.`);
    inspect(node);
  }
  return (
    policy || {
      version: 1,
      owner: 'source',
      reason: '',
    }
  );
}

function mgMaintenanceFamilyPolicy(familyId, owned) {
  const targets = [],
    explicitNodeIds = [];
  const policy = mgMaintenanceInspectFamily(familyId, owned, (node, marker) => {
    targets.push(node);
    if (marker) explicitNodeIds.push(node.id);
  });
  const set = owned.get(`family/${familyId}`);
  return {
    familyId,
    setId: set?.id || null,
    variantIds: targets.filter(node => node !== set).map(node => node.id),
    policy,
    explicitNodeIds,
    targets,
  };
}

function mgMaintenanceAssertSource(familyIds, owned) {
  const policies = familyIds.map(familyId => ({
    familyId,
    policy: mgMaintenanceInspectFamily(familyId, owned),
  }));
  const manual = policies.filter(entry => entry.policy.owner === 'manual');
  if (manual.length)
    throw new Error(
      `Manual maintenance blocks the complete component build: ${manual
        .map(entry => `${entry.familyId} (${entry.policy.reason})`)
        .join('; ')}. Record an explicit source handback before rebuilding.`
    );
  return policies;
}

function mgMaintenanceDependencyIds(recipes, selectedFamilyIds) {
  const families = new Map(recipes.map(family => [family.id, family]));
  const visiting = new Set();
  const visited = new Set();
  function visit(id) {
    if (visited.has(id)) return;
    if (visiting.has(id))
      throw new Error(`Component dependency cycle at ${id}`);
    const family = families.get(id);
    if (!family) throw new Error(`Unknown component family ${id}`);
    visiting.add(id);
    function walk(tree) {
      if (tree.type === 'INSTANCE') visit(tree.family);
      for (const child of tree.children || []) walk(child);
    }
    for (const variant of family.variants) walk(variant.tree);
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of selectedFamilyIds || families.keys()) visit(id);
  return [...visited];
}

async function preflightMangroveMaintenance(doc, selectedFamilyIds) {
  const recipes = doc?.components?.families;
  if (doc?.components?.version !== 1 || !Array.isArray(recipes))
    throw new Error('Maintenance policy needs the full component document.');
  const ids = mgMaintenanceDependencyIds(recipes, selectedFamilyIds);
  const entries = await mgMaintenancePolicyTargets(doc, ids);
  const manual = entries.filter(entry => entry.policy.owner === 'manual');
  if (manual.length)
    throw new Error(
      `Manual maintenance blocks the complete component build: ${manual
        .map(entry => `${entry.familyId} (${entry.policy.reason})`)
        .join('; ')}. Record an explicit source handback before rebuilding.`
    );
  return entries.map(mgMaintenancePolicyReceipt);
}

async function mgMaintenancePolicyTargets(doc, familyIds) {
  const recipes = doc?.components?.families;
  if (doc?.components?.version !== 1 || !Array.isArray(recipes))
    throw new Error('Maintenance policy needs the full component document.');
  const known = new Set(recipes.map(family => family.id));
  const ids = familyIds === undefined ? [...known] : familyIds;
  if (
    !Array.isArray(ids) ||
    !ids.length ||
    new Set(ids).size !== ids.length ||
    ids.some(id => !known.has(id))
  )
    throw new Error('Select known, unique maintenance family IDs.');
  const owned = new Map();
  for (const node of figma.currentPage.findAll(() => true)) {
    if (node.type === 'INSTANCE') continue;
    let insideInstance = false;
    for (let parent = node.parent; parent; parent = parent.parent)
      if (parent.type === 'INSTANCE') insideInstance = true;
    if (insideInstance) continue;
    const key = mgReadIdentity(node, MG_KIT_KEY);
    if (
      !ids.some(
        id => key === `family/${id}` || key.startsWith(`family/${id}/variant/`)
      )
    )
      continue;
    if (owned.has(key))
      throw new Error(`Duplicate Mangrove ownership key ${key}`);
    owned.set(key, node);
  }
  return ids.map(id => mgMaintenanceFamilyPolicy(id, owned));
}

function mgMaintenancePolicyReceipt(entry) {
  const { targets, ...receipt } = entry;
  return receipt;
}

async function readMangroveMaintenancePolicies(doc, familyIds) {
  const result = {
    operation: 'maintenance-policy',
    phase: 'inspected',
    families: [],
    createdNodeIds: [],
    updatedNodeIds: [],
    errors: [],
  };
  try {
    result.families = (await mgMaintenancePolicyTargets(doc, familyIds)).map(
      mgMaintenancePolicyReceipt
    );
  } catch (error) {
    result.phase = 'refused';
    result.errors.push(error.message || String(error));
  }
  return result;
}

async function setMangroveMaintenancePolicy(doc, familyIds, owner, reason) {
  const result = {
    operation: 'maintenance-policy',
    phase: 'refused',
    families: [],
    createdNodeIds: [],
    updatedNodeIds: [],
    errors: [],
  };
  try {
    if (
      !['source', 'manual'].includes(owner) ||
      typeof reason !== 'string' ||
      (owner === 'manual'
        ? !reason.trim() || reason.length > 2000
        : reason !== '')
    )
      throw new Error(
        'Manual maintenance needs a reason; source needs an empty reason.'
      );
    const entries = await mgMaintenancePolicyTargets(doc, familyIds);
    for (const entry of entries)
      if (!entry.setId)
        throw new Error(
          `Build ${entry.familyId} before assigning its maintenance policy.`
        );
    const policy = { version: 1, owner, reason };
    const encoded = JSON.stringify(policy);
    result.families = entries.map(entry => ({
      ...mgMaintenancePolicyReceipt(entry),
      previousPolicy: entry.policy,
      policy,
    }));
    result.phase = 'updating';
    for (const entry of entries) {
      for (const node of entry.targets) {
        const raw = mgReadIdentity(node, MG_MAINTENANCE_POLICY_KEY);
        if (
          raw === encoded &&
          node.getSharedPluginData(
            MG_IDENTITY_NAMESPACE,
            MG_MAINTENANCE_POLICY_KEY
          ) === encoded
        )
          continue;
        result.updatedNodeIds.push(node.id);
        // Retain a valid legacy private marker when moving it to shared data.
        // Conflicting values have already refused before any writes.
        if (
          !(typeof MG_SHARED_ONLY !== 'undefined' && MG_SHARED_ONLY) &&
          node.getPluginData(MG_MAINTENANCE_POLICY_KEY)
        )
          node.setPluginData(MG_MAINTENANCE_POLICY_KEY, encoded);
        mgWriteIdentity(node, MG_MAINTENANCE_POLICY_KEY, encoded);
      }
    }
    result.phase = 'complete';
  } catch (error) {
    result.phase = result.updatedNodeIds.length ? 'partial' : 'refused';
    result.errors.push(error.message || String(error));
  }
  return result;
}
// Source-embedded raster media uses native image fills, never network fetches.
// Keep the recipe a FRAME so existing geometry/visibility/property ownership
// and normal instance image overrides follow the established update contract.
function mgImagePlan(tree) {
  const image = tree.image;
  if (
    tree.type !== 'FRAME' ||
    !image ||
    typeof image !== 'object' ||
    Array.isArray(image) ||
    Object.keys(image).some(
      key => !['assetId', 'base64', 'scaleMode'].includes(key)
    ) ||
    typeof image.assetId !== 'string' ||
    !/^[a-z0-9][a-z0-9._-]*$/.test(image.assetId) ||
    typeof image.base64 !== 'string' ||
    !image.base64.length ||
    image.base64.length > 4 * 1024 * 1024 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      image.base64
    ) ||
    image.scaleMode !== 'FILL' ||
    tree.fill ||
    tree.children?.length
  )
    throw new Error(
      'Image recipes require a leaf FRAME, a bounded embedded PNG/JPEG and FILL crop.'
    );
  const bytes = figma.base64Decode(image.base64);
  const png =
    bytes.length > 24 &&
    [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v);
  const jpeg =
    bytes.length > 4 &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[bytes.length - 2] === 255 &&
    bytes[bytes.length - 1] === 217;
  if (!png && !jpeg)
    throw new Error(`Image ${image.assetId} is not PNG or JPEG.`);
  return { ...image, bytes };
}
const MG_GRADIENT_ROLES_ENABLED =
  typeof MG_CONNECTOR_GRADIENT_ROLES === 'undefined' ||
  MG_CONNECTOR_GRADIENT_ROLES;
function mgGradientPlan(tree) {
  const gradient = tree.gradient;
  if (
    tree.type !== 'FRAME' ||
    !gradient ||
    Object.keys(gradient).join(',') !== 'layers' ||
    !Array.isArray(gradient.layers) ||
    !gradient.layers.length ||
    gradient.layers.length > 2 ||
    tree.fill ||
    tree.image ||
    tree.children?.length
  )
    throw new Error(
      'Gradient recipes require a leaf FRAME and one or two source layers.'
    );
  for (const layer of gradient.layers) {
    if (
      !layer ||
      Object.keys(layer).some(k =>
        MG_GRADIENT_ROLES_ENABLED
          ? !['stops', 'transform', 'transformVariables'].includes(k)
          : !['stops', 'transform'].includes(k)
      ) ||
      !Array.isArray(layer.stops) ||
      layer.stops.length < 2 ||
      layer.stops.length > 5 ||
      !Array.isArray(layer.transform) ||
      layer.transform.length !== 2 ||
      layer.transform.some(
        row =>
          !Array.isArray(row) ||
          row.length !== 3 ||
          row.some(v => !Number.isFinite(v))
      )
    )
      throw new Error('Invalid source gradient geometry.');
    if (MG_GRADIENT_ROLES_ENABLED && layer.transformVariables !== undefined)
      mgGradientTransform.validate(layer);
    let previous = -1;
    for (const stop of layer.stops) {
      if (
        !stop ||
        Object.keys(stop).some(k => !['position', 'color'].includes(k)) ||
        !Number.isFinite(stop.position) ||
        stop.position < previous ||
        stop.position < 0 ||
        stop.position > 1 ||
        typeof stop.color !== 'string' ||
        !stop.color
      )
        throw new Error(
          'Gradient stops need ordered 0..1 positions and COLOR variables.'
        );
      previous = stop.position;
    }
  }
  return gradient;
}
const MG_SVG_KEY = 'mgSvgAsset';
const MG_SVG_SIZING_ENABLED =
  typeof MG_CONNECTOR_SVG_SIZING === 'undefined' || MG_CONNECTOR_SVG_SIZING;
const MG_SVG_ENABLED =
  typeof MG_CONNECTOR_SVG === 'undefined' || MG_CONNECTOR_SVG;

const MG_TEXT_THICKNESS_ENABLED =
  typeof MG_CONNECTOR_TEXT_THICKNESS === 'undefined' ||
  MG_CONNECTOR_TEXT_THICKNESS;

const MG_ABSOLUTE_ENABLED =
  typeof MG_CONNECTOR_ABSOLUTE === 'undefined' || MG_CONNECTOR_ABSOLUTE;

const MG_ABSOLUTE_START_ENABLED =
  typeof MG_CONNECTOR_ABSOLUTE_START === 'undefined' ||
  MG_CONNECTOR_ABSOLUTE_START;

const MG_INTRINSIC_REVIEW_ENABLED =
  typeof MG_CONNECTOR_INTRINSIC_REVIEW === 'undefined' ||
  MG_CONNECTOR_INTRINSIC_REVIEW;
const MG_ARC_ENABLED =
  typeof MG_CONNECTOR_ARC === 'undefined' || MG_CONNECTOR_ARC;
const MG_DIRECT_TEXT_ENABLED =
  typeof MG_CONNECTOR_DIRECT_TEXT === 'undefined' || MG_CONNECTOR_DIRECT_TEXT;

const MG_RICH_TEXT_ENABLED =
  typeof MG_CONNECTOR_RICH_TEXT === 'undefined' || MG_CONNECTOR_RICH_TEXT;

const MG_COINCIDENT_FOCUS_ENABLED =
  typeof MG_CONNECTOR_COINCIDENT_FOCUS === 'undefined' ||
  MG_CONNECTOR_COINCIDENT_FOCUS;

function mgEllipseArcPlan(tree) {
  const arc = tree.arcData;
  if (
    tree.type !== 'ELLIPSE' ||
    !arc ||
    typeof arc !== 'object' ||
    Array.isArray(arc) ||
    Object.keys(arc).length !== 3 ||
    Object.keys(arc).some(
      field => !['startingAngle', 'endingAngle', 'innerRadius'].includes(field)
    ) ||
    !['startingAngle', 'endingAngle', 'innerRadius'].every(field =>
      Number.isFinite(arc[field])
    ) ||
    arc.startingAngle < 0 ||
    arc.startingAngle > 2 * Math.PI ||
    arc.endingAngle > arc.startingAngle + 2 * Math.PI ||
    arc.endingAngle <= arc.startingAngle ||
    arc.innerRadius < 0 ||
    arc.innerRadius >= 1
  )
    throw new Error(
      'Ellipse arcData requires a start angle in [0,2π], a positive clockwise sweep of at most2π and innerRadius in [0,1).'
    );
  return { ...arc };
}

function mgAbsolutePlan(tree, parent) {
  const spec = tree.absolute;
  if (
    !spec ||
    typeof spec !== 'object' ||
    Array.isArray(spec) ||
    Object.keys(spec).length !== 4 ||
    Object.keys(spec).some(
      key => !['horizontal', 'vertical', 'offsetX', 'offsetY'].includes(key)
    ) ||
    !(
      (spec.horizontal === 'END' && spec.vertical === 'CENTER') ||
      (MG_ABSOLUTE_START_ENABLED &&
        spec.horizontal === 'START' &&
        spec.vertical === 'START')
    ) ||
    !['offsetX', 'offsetY'].every(
      key => typeof spec[key] === 'string' && spec[key]
    ) ||
    !['FRAME', 'TEXT', 'ELLIPSE'].includes(tree.type) ||
    !parent ||
    parent.type !== 'FRAME' ||
    !['HORIZONTAL', 'VERTICAL'].includes(parent.layout?.mode) ||
    tree.position !== undefined ||
    !['width', 'height'].every(key => {
      const value = tree.layout?.[key];
      return typeof value === 'string'
        ? !!value && !['HUG', 'FILL'].includes(value)
        : Number.isFinite(value) && value > 0;
    })
  )
    throw new Error(
      'Absolute recipes require a native fixed-size child of an auto-layout FRAME, END/CENTER or START/START alignment and FLOAT offset token IDs, without position.'
    );
  return spec;
}

function mgAbsoluteStartSource(doc, tree) {
  const roles = new Map();
  for (const item of doc.variables || []) {
    if (roles.has(item.name))
      throw new Error('Absolute START source variable is ambiguous.');
    roles.set(item.name, item);
  }
  function number(name, mode, seen = new Set()) {
    const role = roles.get(name);
    if (!role || role.type !== 'FLOAT' || seen.has(name))
      throw new Error(
        'Absolute START source FLOAT is missing, wrong typed or cyclic.'
      );
    seen.add(name);
    const value = role.values?.[mode.id];
    if (value && typeof value === 'object') {
      if (
        Object.keys(value).join(',') !== 'alias' ||
        typeof value.alias !== 'string'
      )
        throw new Error('Absolute START source alias is malformed.');
      return number(value.alias, mode, seen);
    }
    if (!Number.isFinite(value))
      throw new Error('Absolute START source FLOAT must be finite.');
    return value;
  }
  if (!Array.isArray(doc.modes) || !doc.modes.length)
    throw new Error('Absolute START source modes are missing.');
  for (const mode of doc.modes) {
    number(tree.absolute.offsetX, mode);
    number(tree.absolute.offsetY, mode);
    for (const field of ['width', 'height'])
      if (
        typeof tree.layout[field] === 'string' &&
        number(tree.layout[field], mode) <= 0
      )
        throw new Error('Absolute START source sizing must be positive.');
  }
}

// A bounded source-vector subset, not a general SVG sanitizer or renderer.
// Reject unsupported XML before the native importer creates any canvas nodes.
function mgSvgPlan(tree) {
  const object = value =>
    value && typeof value === 'object' && !Array.isArray(value);
  const fail = message => {
    throw new Error(`SVG ${tree.name || tree.id}: ${message}`);
  };
  const allowed = [
    'type',
    'id',
    'key',
    'name',
    'svg',
    'layout',
    'position',
    'visible',
    'bindings',
    'visibilityProperty',
  ];
  if (Object.keys(tree).some(field => !allowed.includes(field)))
    fail(
      'unsupported recipe field; SVG is a leaf viewport without frame styles or children.'
    );
  const svg = tree.svg;
  if (
    !object(svg) ||
    Object.keys(svg).some(
      field => !['assetId', 'markup', 'monochrome', 'sizing'].includes(field)
    ) ||
    typeof svg.assetId !== 'string' ||
    !/^[a-z0-9][a-z0-9._-]*$/.test(svg.assetId) ||
    typeof svg.markup !== 'string' ||
    !svg.markup.length ||
    svg.markup.length > 32768
  )
    fail(
      'needs a stable assetId and at most 32768 characters of source markup.'
    );
  if (
    !object(tree.layout) ||
    Object.keys(tree.layout).some(
      field => !['width', 'height'].includes(field)
    ) ||
    !['width', 'height'].every(
      field => Number.isFinite(tree.layout[field]) && tree.layout[field] > 0
    )
  )
    fail(
      'layout requires fixed positive width and height; HUG/FILL and live viewport bindings cannot scale source strokes.'
    );
  if (
    tree.position !== undefined &&
    (!object(tree.position) ||
      Object.keys(tree.position).some(field => !['x', 'y'].includes(field)) ||
      !['x', 'y'].every(field => Number.isFinite(tree.position[field])))
  )
    fail('position requires finite x and y.');
  if (tree.visible !== undefined && typeof tree.visible !== 'boolean')
    fail('visible must be boolean.');
  if (
    tree.bindings !== undefined &&
    (!object(tree.bindings) ||
      Object.keys(tree.bindings).some(
        field => !['opacity', 'visible'].includes(field)
      ))
  )
    fail('only opacity and visible bindings are supported.');
  if (
    svg.monochrome !== undefined &&
    (!object(svg.monochrome) ||
      !Object.keys(svg.monochrome).length ||
      Object.keys(svg.monochrome).some(
        field => !['fills', 'strokes'].includes(field)
      ) ||
      Object.values(svg.monochrome).some(
        value => typeof value !== 'string' || !value
      ))
  )
    fail(
      'monochrome must explicitly name fills and/or strokes COLOR variables.'
    );
  const tags = new Set([
    'svg',
    'g',
    'path',
    'rect',
    'circle',
    'ellipse',
    'line',
    'polygon',
    'polyline',
  ]);
  const attributes = new Set([
    'xmlns',
    'id',
    'viewBox',
    'width',
    'height',
    'fill',
    'stroke',
    'stroke-width',
    'stroke-linecap',
    'stroke-linejoin',
    'stroke-miterlimit',
    'stroke-dasharray',
    'stroke-dashoffset',
    'opacity',
    'fill-opacity',
    'stroke-opacity',
    'fill-rule',
    'clip-rule',
    'transform',
    'd',
    'x',
    'y',
    'x1',
    'x2',
    'y1',
    'y2',
    'cx',
    'cy',
    'r',
    'rx',
    'ry',
    'points',
  ]);
  const stack = [];
  const palettes = { fills: new Set(), strokes: new Set() };
  let cursor = 0;
  let root;
  let shapes = 0;
  const tokens = svg.markup.matchAll(/<!--[^]*?-->|<[^>]*>/g);
  for (const token of tokens) {
    if (svg.markup.slice(cursor, token.index).trim())
      fail('malformed XML or unsupported text content.');
    cursor = token.index + token[0].length;
    if (token[0].startsWith('<!--')) continue;
    const match = /^<(\/?)([a-zA-Z][\w-]*)([^]*?)(\/?)>$/.exec(token[0]);
    if (!match || !tags.has(match[2]))
      fail('unsupported XML element; use inline source vector shapes.');
    const [, closing, tag, raw, selfClosing] = match;
    if (closing) {
      if (raw.trim() || selfClosing || stack.pop()?.tag !== tag)
        fail('malformed XML closing tag.');
      continue;
    }
    const values = {};
    let remaining = raw;
    remaining = remaining.replace(
      /([a-zA-Z_][\w:.-]*)\s*=\s*("[^"<]*"|'[^'<]*')/g,
      (_, field, quoted) => {
        if (!attributes.has(field) || field in values)
          fail(`unsupported or duplicate XML attribute ${field}.`);
        values[field] = quoted.slice(1, -1);
        if (
          /&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-f]+;)/i.test(
            values[field]
          )
        )
          fail('malformed XML entity.');
        return '';
      }
    );
    if (remaining.trim()) fail('malformed XML attribute.');
    if (tag === 'svg') {
      if (root || stack.length) fail('exactly one SVG root is supported.');
      root = values;
    } else if (!stack.length)
      fail('vector shapes must be inside the SVG root.');
    const inherited = stack.at(-1) || { fill: 'black', stroke: 'none' };
    const paint = {
      tag,
      fill: values.fill ?? inherited.fill,
      stroke: values.stroke ?? inherited.stroke,
    };
    if (!['svg', 'g'].includes(tag)) {
      shapes += 1;
      if (shapes > 128) fail('at most 128 source shapes are supported.');
      for (const [field, name] of [
        ['fills', paint.fill],
        ['strokes', paint.stroke],
      ]) {
        if (name.toLowerCase() !== 'none')
          palettes[field].add(
            name
              .trim()
              .toLowerCase()
              .replace(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/, '#$1$1$2$2$3$3')
              .replace(/^white$/, '#ffffff')
              .replace(/^black$/, '#000000')
          );
      }
    }
    if (!selfClosing) stack.push(paint);
  }
  if (stack.length || !root || !shapes || svg.markup.slice(cursor).trim())
    fail('malformed or empty SVG XML.');
  const viewBox = root.viewBox
    ?.trim()
    .split(/[\s,]+/)
    .map(Number);
  if (
    !viewBox ||
    viewBox.length !== 4 ||
    !viewBox.every(Number.isFinite) ||
    viewBox[2] <= 0 ||
    viewBox[3] <= 0
  )
    fail('source needs a finite viewBox with positive dimensions.');
  if (
    Math.abs(tree.layout.width / tree.layout.height - viewBox[2] / viewBox[3]) >
    1e-6
  )
    fail('viewport sizing must preserve the source viewBox aspect ratio.');
  for (const field of Object.keys(svg.monochrome || {}))
    if (palettes[field].size !== 1)
      fail(
        `monochrome ${field} needs exactly one source paint colour; preserve multicolour assets unchanged.`
      );
  let hash = 2166136261;
  for (let i = 0; i < svg.markup.length; i += 1)
    hash = Math.imul(hash ^ svg.markup.charCodeAt(i), 16777619) >>> 0;
  const identity = {
    ...(svg.sizing === undefined ? {} : { sizing: mgSvgSizingPlan(tree) }),
    assetId: svg.assetId,
    hash: `fnv1a32-utf16:${hash.toString(16).padStart(8, '0')}`,
    markup: svg.markup,
    paintPolicy: svg.monochrome || {},
  };
  // Explicit intrinsic dimensions preserve the viewport instead of fitting paths.
  // Reject a native importer that trims these bounds; never guess path offsets.
  const markup = svg.markup.replace(
    /<svg\b([^>]*?)>/,
    (_, attrs) =>
      `<svg${attrs.replace(/\s+(width|height)\s*=\s*("[^"]*"|'[^']*')/g, '')} width="${viewBox[2]}" height="${viewBox[3]}">`
  );
  return {
    ...identity,
    importedMarkup: markup,
    width: viewBox[2],
    height: viewBox[3],
  };
}
function mgSvgTopology(node) {
  return [
    {
      id: node.id,
      type: node.type,
      children: (node.children || []).map(child => child.id),
    },
    ...(node.children || []).flatMap(mgSvgTopology),
  ];
}
function mgSvgGeometry(node) {
  return node
    .findAll(() => true)
    .map(child => {
      const fields = [
        'x',
        'y',
        'width',
        'height',
        'rotation',
        'vectorPaths',
        'strokeWeight',
        'strokeCap',
        'strokeJoin',
        'strokeAlign',
        'strokeMiterLimit',
        'dashPattern',
      ];
      return Object.fromEntries(
        fields
          .filter(field => field in child)
          .map(field => [field, child[field]])
      );
    });
}
function mgSvgMonochrome(node, field) {
  const paints = node
    .findAll(() => true)
    .flatMap(child => {
      if (!(field in child)) return [];
      if (!Array.isArray(child[field]))
        throw new Error(`SVG monochrome ${field} cannot bind mixed paints.`);
      return child[field].filter(
        paint => paint.visible !== false && (paint.opacity ?? 1) > 0
      );
    });
  if (
    !paints.length ||
    paints.some(paint => paint.type !== 'SOLID') ||
    new Set(paints.map(paint => JSON.stringify(paint.color))).size !== 1
  )
    throw new Error(
      `SVG monochrome ${field} needs visible SOLID paints of one colour; preserve multicolour or gradient assets unchanged.`
    );
}

function mgRichSourceStylePreflight(doc) {
  validateMangroveImport(
    doc,
    doc.modes.map(item => item.id),
    doc.styles.text.map(item => item.id)
  );
  const sourceVariables = new Map(
    doc.variables.map(entry => [entry.name, entry])
  );
  function sourceValue(name, modeId, type, seen = new Set()) {
    const entry = sourceVariables.get(name);
    if (!entry || entry.type !== type || seen.has(name))
      throw new Error(
        'Rich style source role is missing, wrong typed or cyclic.'
      );
    seen.add(name);
    const value = entry.values[modeId];
    return value && typeof value === 'object' && value.alias
      ? sourceValue(value.alias, modeId, type, seen)
      : value;
  }
  for (const spec of doc.styles.text)
    for (const sourceMode of doc.modes) {
      const value = spec.values[sourceMode.id];
      if (
        !value ||
        value.fontName.family !==
          sourceValue(spec.bindings.fontFamily, sourceMode.id, 'STRING') ||
        value.fontSize !==
          sourceValue(spec.bindings.fontSize, sourceMode.id, 'FLOAT')
      )
        throw new Error(
          'Rich scope style template disagrees with source font/size aliases.'
        );
    }
}

const MG_NATIVE_COLLECTIONS_TEXT_BUILDER_ENABLED =
  typeof MG_CONNECTOR_NATIVE_TEXT_INSTANCES === 'undefined' ||
  MG_CONNECTOR_NATIVE_TEXT_INSTANCES;
const MG_NATIVE_COLLECTIONS_ENABLED =
  typeof MG_CONNECTOR_NATIVE_COLLECTIONS === 'undefined' ||
  MG_CONNECTOR_NATIVE_COLLECTIONS;

function mgNativeCollectionsBuilderPlan(doc) {
  if (!MG_NATIVE_COLLECTIONS_ENABLED || doc.nativeCollections === undefined)
    return null;
  if (typeof mgAssertExperimentOperationTarget !== 'function')
    throw new Error(
      'Partition components require an exact guarded experiment target.'
    );
  mgAssertExperimentOperationTarget();
  return mgNativeCollectionsSourceCapability(doc);
}

async function buildMangroveComponents(
  doc,
  brandId,
  selectedFamilyIds,
  { refreshNarrowReview = false } = {}
) {
  if (typeof refreshNarrowReview !== 'boolean')
    throw new Error('Refresh narrow review must be a boolean.');
  const result = {
    createdNodeIds: [],
    updatedNodeIds: [],
    families: [],
    errors: [],
    audit: [],
    reviewRootId: null,
  };
  const created = new Set();
  const updated = new Set();
  const reportError = error =>
    typeof errorMessage === 'function' ? errorMessage(error) : String(error);
  if (MG_NATIVE_COLLECTIONS_ENABLED && doc.nativeCollections !== undefined)
    doc = JSON.parse(JSON.stringify(doc));
  const recipes = doc.components?.families || [];
  if (doc.components?.version !== 1 || !recipes.length) {
    result.errors.push(
      'No supported component recipes. Rebuild the token JSON.'
    );
    return result;
  }
  const brand = doc.modes.find(mode => mode.id === brandId);
  if (!brand) throw new Error(`Unknown brand ${brandId}`);
  const nativeCollectionPlan = MG_NATIVE_COLLECTIONS_ENABLED
    ? mgNativeCollectionsBuilderPlan(doc)
    : null;
  if (
    MG_NATIVE_COLLECTIONS_TEXT_BUILDER_ENABLED &&
    nativeCollectionPlan?.version === 2 &&
    selectedFamilyIds !== undefined &&
    (!Array.isArray(selectedFamilyIds) ||
      selectedFamilyIds.length !== recipes.length ||
      new Set(selectedFamilyIds).size !== recipes.length ||
      recipes.some(f => !selectedFamilyIds.includes(f.id)))
  )
    throw new Error('Partition v2 requires the complete family document.');
  const page = figma.currentPage;
  const nativePageId =
    MG_NATIVE_COLLECTIONS_ENABLED && nativeCollectionPlan ? page.id : null;
  function assertNativeCollectionTarget() {
    if (MG_NATIVE_COLLECTIONS_ENABLED && nativeCollectionPlan) {
      mgAssertExperimentOperationTarget();
      if (
        figma.currentPage.id !== nativePageId ||
        figma.currentPage.type !== 'PAGE'
      )
        throw new Error(
          'Partition current page changed across operation awaits.'
        );
    }
  }
  assertNativeCollectionTarget();
  const allOwned = page.findAll(node =>
    Boolean(mgReadIdentity(node, MG_KIT_KEY))
  );
  const owned = new Map();
  if (MG_NATIVE_COLLECTIONS_ENABLED && nativeCollectionPlan)
    for (const node of allOwned) {
      const ledger = mgReadIdentity(node, 'mgNativeScenePlan');
      if (
        ledger !==
        JSON.stringify(
          MG_NATIVE_COLLECTIONS_TEXT_BUILDER_ENABLED &&
            nativeCollectionPlan.version === 2
            ? mgNativeCollectionsSceneLedger(nativeCollectionPlan)
            : { version: 1, planId: nativeCollectionPlan.planId }
        )
      )
        throw new Error(
          'Partition scene ownership conflicts with an existing normal or foreign scene.'
        );
    }
  const nativeSceneSignature = nodes =>
    JSON.stringify(
      nodes
        .map(node => ({
          id: node.id,
          type: node.type,
          parentId: node.parent?.id || null,
          key: mgReadIdentity(node, MG_KIT_KEY),
          ledger: mgReadIdentity(node, 'mgNativeScenePlan'),
          ...(MG_NATIVE_COLLECTIONS_TEXT_BUILDER_ENABLED &&
          nativeCollectionPlan.version === 2
            ? {
                characters: node.type === 'TEXT' ? node.characters : undefined,
                fontName: node.type === 'TEXT' ? node.fontName : undefined,
                textStyleId:
                  node.type === 'TEXT' ? node.textStyleId : undefined,
                references: node.componentPropertyReferences,
                definitions:
                  node.type === 'COMPONENT_SET'
                    ? node.componentPropertyDefinitions
                    : undefined,
                properties:
                  node.type === 'INSTANCE'
                    ? node.componentProperties
                    : undefined,
                modes: node.explicitVariableModes,
              }
            : {}),
        }))
        .sort((a, b) => a.id.localeCompare(b.id))
    );
  const nativeSceneBefore =
    MG_NATIVE_COLLECTIONS_ENABLED && nativeCollectionPlan
      ? nativeSceneSignature(allOwned)
      : null;
  for (const node of allOwned) {
    // Instance descendants inherit source plugin data. Only index construction nodes.
    let ancestor = node.parent;
    let insideInstance = false;
    while (ancestor && ancestor !== page) {
      if (ancestor.type === 'INSTANCE') insideInstance = true;
      ancestor = ancestor.parent;
    }
    if (insideInstance) continue;
    const key = mgReadIdentity(node, MG_KIT_KEY);
    // Root consumers can inherit a main's canonical source identity.
    // Read the actual main; never adopt, clear or rewrite consumer metadata.
    if (
      node.type === 'INSTANCE' &&
      /^family\/[^/]+\/variant\/[^/]+$/.test(key)
    ) {
      const main = await node.getMainComponentAsync();
      if (
        !main ||
        main.type !== 'COMPONENT' ||
        mgReadIdentity(main, MG_KIT_KEY) !== key
      )
        throw new Error(
          'Inherited Mangrove variant identity does not match its actual main.'
        );
      continue;
    }
    if (owned.has(key))
      throw new Error(`Duplicate Mangrove ownership key ${key}`);
    owned.set(key, node);
  }
  // Refuse the entire dependency closure before font, style or scene writes.
  // An indirect manual dependency must not partly refresh a source library.
  mgMaintenanceAssertSource(
    mgMaintenanceDependencyIds(recipes, selectedFamilyIds),
    owned
  );
  let frozenSourcePlans = null;
  async function checkFrozenSourceLines(phase) {
    if (!frozenSourcePlans?.length) return true;
    try {
      // Recollect current-page construction owners and linked copies at every
      // boundary. Do not collapse duplicate identities or adopt inherited ones.
      const candidates = page.findAll(node => {
        if (!mgReadIdentity(node, MG_KIT_KEY) || node.type === 'INSTANCE')
          return false;
        for (
          let parent = node.parent;
          parent && parent !== page;
          parent = parent.parent
        )
          if (parent.type === 'INSTANCE') return false;
        return true;
      });
      for (const plan of frozenSourcePlans)
        if (
          !candidates.some(
            node => mgReadIdentity(node, MG_KIT_KEY) === plan.ownerKey
          ) &&
          candidates.some(node => mgReadIdentity(node, MG_KIT_KEY) === plan.key)
        )
          throw new Error(
            'Frozen source line reflow-needed: orphan managed line ' + plan.key
          );
      const receipt = await mgFrozenSourceLine.preflight(frozenSourcePlans, {
        mainByKey: key =>
          candidates.filter(node => mgReadIdentity(node, MG_KIT_KEY) === key),
        instances: page.findAllWithCriteria({ types: ['INSTANCE'] }),
        identity: node => mgReadIdentity(node, MG_KIT_KEY),
        mainForInstance: instance => instance.getMainComponentAsync(),
      });
      result.audit.push({
        status: 'frozen-source-line-preflight',
        phase,
        scope: 'loaded current page',
        ...receipt,
      });
      return true;
    } catch (error) {
      const reason = reportError(error);
      result.errors.push(reason);
      result.audit.push({
        status: 'blocked-frozen-source-line-preflight',
        phase,
        reason,
      });
      return false;
    }
  }
  if (MG_FROZEN_SOURCE_LINE_ENABLED) {
    try {
      const selected = new Set(
        mgMaintenanceDependencyIds(recipes, selectedFamilyIds)
      );
      const records = [];
      function frozenTree(tree, key, ownerKey) {
        if (Object.prototype.hasOwnProperty.call(tree, 'sourceLine'))
          records.push({ key, ownerKey, spec: tree });
        for (const child of tree.children || [])
          frozenTree(child, `${key}/${child.id || child.key}`, ownerKey);
      }
      for (const family of recipes.filter(family => selected.has(family.id)))
        for (const variant of family.variants) {
          const key = `family/${family.id}/variant/${variant.id}`;
          frozenTree(variant.tree, key, key);
        }
      frozenSourcePlans = mgFrozenSourceLine.sourcePlans(records);
    } catch (error) {
      const reason = reportError(error);
      result.errors.push(reason);
      result.audit.push({
        status: 'blocked-frozen-source-line-preflight',
        phase: 'source',
        reason,
      });
      return result;
    }
    if (!(await checkFrozenSourceLines('before-font-preparation')))
      return result;
  }
  const organized = owned.has('layout/start');
  if (organized) {
    if (MG_ALPHA_MASK_ENABLED) {
      const selected = new Set(
        mgMaintenanceDependencyIds(recipes, selectedFamilyIds)
      );
      const hasMask = tree =>
        tree.alphaMask !== undefined || (tree.children || []).some(hasMask);
      if (
        recipes.some(
          family =>
            selected.has(family.id) &&
            (family.variants.some(variant => hasMask(variant.tree)) ||
              allOwned.some(
                node =>
                  mgReadIdentity(node, MG_KIT_KEY).startsWith(
                    `family/${family.id}/`
                  ) && mgReadIdentity(node, MG_ALPHA_MASK_KEY)
              ))
        )
      ) {
        result.errors.push(
          'ALPHA mask source candidates require an unorganized experiment file.'
        );
        return result;
      }
    }
    if (typeof mgLayoutPreflight !== 'function')
      throw new Error(
        'Organized kit updates require the layout-aware desktop runtime.'
      );
    await mgLayoutPreflight(doc, { allowProbes: true });
    if (
      mgReadIdentity(owned.get('layout/start'), 'mgLayoutPhase') !== 'complete'
    )
      throw new Error(
        'Finish the pending Organize file operation before building components.'
      );
    await mgLayoutLoadExistingFonts();
  }
  if (MG_NATIVE_COLLECTIONS_ENABLED && nativeCollectionPlan && organized)
    throw new Error('Partition v1 requires an unorganized experiment.');
  const nativeSnapshot =
    MG_NATIVE_COLLECTIONS_ENABLED && nativeCollectionPlan
      ? await nativeCollectionImportSnapshot(assertNativeCollectionTarget)
      : null;
  const collections =
    MG_NATIVE_COLLECTIONS_ENABLED && nativeSnapshot
      ? nativeSnapshot.collections
      : await figma.variables.getLocalVariableCollectionsAsync();
  let nativeCollectionState = null;
  if (MG_NATIVE_COLLECTIONS_ENABLED && nativeCollectionPlan) {
    const local = nativeSnapshot.variables;
    assertNativeCollectionTarget();
    nativeCollectionState = mgNativeCollectionsPreflight(
      nativeCollectionPlan,
      { collections, variables: local },
      {
        readCollection: asset => {
          const value = mgReadIdentity(asset, 'mgNativeCollectionPlan');
          return value ? JSON.parse(value) : null;
        },
        readVariable: asset => mgReadIdentity(asset, 'mgId'),
      }
    );
    if (
      nativeCollectionState.neededCollections.length ||
      nativeCollectionState.neededVariables.length ||
      [...nativeCollectionState.neededModes.values()].some(
        modes => modes.length
      )
    )
      throw new Error(
        'Import the complete partition foundation and modes before building.'
      );
  }
  if (MG_NATIVE_COLLECTIONS_ENABLED && nativeCollectionState)
    mgNativeCollectionsValidateValues(
      nativeCollectionPlan,
      nativeCollectionState
    );
  const collection =
    MG_NATIVE_COLLECTIONS_ENABLED && nativeCollectionState
      ? nativeCollectionState.collectionsBySourceId.get(
          nativeCollectionPlan.primary
        )
      : collections.find(item => item.name === doc.collection);
  if (!collection)
    throw new Error('Import Mangrove variables before components.');
  const mode = collection.modes.find(item => item.name === brand.name);
  if (!mode)
    throw new Error(`Import the ${brand.name} brand before components.`);
  const nativeVariables =
    MG_NATIVE_COLLECTIONS_ENABLED && nativeCollectionState
      ? [...nativeCollectionState.variablesBySourceId.values()]
      : (await figma.variables.getLocalVariablesAsync()).filter(
          variable => variable.variableCollectionId === collection.id
        );
  const variables = new Map(
    nativeVariables.map(variable => [variable.name, variable])
  );
  const textSpecs = new Map(
    (doc.styles?.text || []).map(spec => [spec.id, spec])
  );
  const effectSpecs = new Map(
    (doc.styles?.effect || []).map(spec => [spec.id, spec])
  );
  const families = new Map(recipes.map(recipe => [recipe.id, recipe]));
  const sourceLabel = family =>
    typeof family.source === 'string'
      ? family.source
      : family.source
        ? `${family.source.file}:${family.source.line}`
        : '';
  const chosen = new Set(selectedFamilyIds || recipes.map(recipe => recipe.id));
  const treeWalk = (tree, visit, parent = null) => {
    visit(tree, parent);
    for (const child of tree.children || []) treeWalk(child, visit, tree);
  };
  // Review geometry and content are initial specimen seeds, not repeat-build edits.
  function reviewTarget(tree, path) {
    if (
      !Array.isArray(path) ||
      !path.length ||
      path.some(name => typeof name !== 'string' || !name)
    )
      throw new Error('Review node needs a nonempty anatomy path.');
    for (const name of path) {
      if (tree.type === 'INSTANCE')
        tree = families
          .get(tree.family)
          ?.variants.find(item =>
            matches(item.properties, tree.variant || {})
          )?.tree;
      const children = (tree?.children || []).filter(
        child => child.name === name
      );
      if (children.length !== 1)
        throw new Error(`Ambiguous or missing review node ${name}`);
      tree = children[0];
    }
    return tree;
  }
  function reviewDimension(value) {
    if (typeof value === 'string') variable(value, 'FLOAT');
    else if (!Number.isFinite(value) || value <= 0)
      throw new Error(
        'Review geometry must be a positive size or FLOAT variable.'
      );
  }
  const dependencies = recipe => {
    const names = new Set();
    for (const variant of recipe.variants)
      treeWalk(variant.tree, tree => {
        if (tree.type === 'INSTANCE') names.add(tree.family);
      });
    return [...names];
  };
  const ordered = [];
  const visited = new Set();
  const visiting = new Set();
  function order(id) {
    if (visited.has(id)) return;
    if (visiting.has(id))
      throw new Error(`Component dependency cycle at ${id}`);
    const family = families.get(id);
    if (!family) throw new Error(`Unknown component family ${id}`);
    visiting.add(id);
    for (const dependency of dependencies(family)) order(dependency);
    visiting.delete(id);
    visited.add(id);
    ordered.push(family);
  }
  for (const id of chosen) order(id);

  function variable(name, type) {
    const value = variables.get(name);
    if (!value || value.resolvedType !== type)
      throw new Error(`Missing ${type} variable ${name}`);
    return value;
  }
  const alphaMaskOwners = MG_ALPHA_MASK_ENABLED ? new Map() : null;
  const alphaMaskRecords = MG_ALPHA_MASK_ENABLED ? [] : null;
  function alphaMaskIdentity(record) {
    return {
      get: node => mgReadIdentity(node, MG_KIT_KEY),
      expected: record.keys,
      readState: node => mgReadIdentity(node, MG_ALPHA_MASK_KEY),
      writeState: (node, value) =>
        mgWriteIdentity(node, MG_ALPHA_MASK_KEY, value),
    };
  }
  function alphaMaskResolve(name, nativeModeId, type, seen = new Set()) {
    const entry = variable(name, type);
    if (entry.variableCollectionId !== collection.id || seen.has(entry.id))
      throw new Error('ALPHA mask native alias ownership or cycle disagrees.');
    seen.add(entry.id);
    const value = entry.valuesByMode[nativeModeId];
    if (value && value.type === 'VARIABLE_ALIAS') {
      const alias = nativeVariables.find(item => item.id === value.id);
      if (
        !alias ||
        alias.variableCollectionId !== collection.id ||
        alias.resolvedType !== type ||
        variable(alias.name, type).id !== alias.id
      )
        throw new Error(
          'ALPHA mask native alias is missing or its exact identity disagrees.'
        );
      return alphaMaskResolve(alias.name, nativeModeId, type, seen);
    }
    return value;
  }
  function checkAlphaMasks(phase) {
    if (!MG_ALPHA_MASK_ENABLED || !alphaMaskRecords.length) return true;
    try {
      // Recollect actual construction nodes after awaits. Inherited consumer
      // ledgers are not an ownership or consumer-mask override guarantee.
      const current = new Map();
      const required = new Set(
        alphaMaskRecords.flatMap(record => Object.values(record.keys))
      );
      for (const node of page.findAll(node =>
        Boolean(mgReadIdentity(node, MG_KIT_KEY))
      )) {
        let inside = node.type === 'INSTANCE';
        for (
          let parent = node.parent;
          parent && parent !== page;
          parent = parent.parent
        )
          if (parent.type === 'INSTANCE') inside = true;
        if (inside) continue;
        const key = mgReadIdentity(node, MG_KIT_KEY);
        if (!required.has(key)) continue;
        if (current.has(key))
          throw new Error('Duplicate ALPHA mask construction identity.');
        current.set(key, node);
      }
      for (const record of alphaMaskRecords) {
        if (record.plan) {
          mgAlphaMaskDocumentValues(record.plan, doc);
          mgAlphaMaskNativeValues(
            record.plan,
            collection.modes.map(item => item.modeId),
            alphaMaskResolve
          );
        }
        mgNativeAlphaMaskPlan(
          current.get(record.keys.mask),
          current.get(record.keys.owner),
          current.get(record.keys.content),
          record.plan,
          alphaMaskIdentity(record)
        );
      }
      return true;
    } catch (error) {
      const reason = reportError(error);
      result.errors.push(reason);
      result.audit.push({
        status: 'blocked-alpha-mask-preflight',
        phase,
        reason,
      });
      return false;
    }
  }
  if (MG_ALPHA_MASK_ENABLED) {
    try {
      function maskTree(tree, key, parent, parentKey, index) {
        const plan = mgAlphaMaskPlan(tree, parent, index);
        if (plan && /^family\/[^/]+\/variant\/[^/]+$/.test(parentKey))
          throw new Error(
            'ALPHA mask owner must be a nested FRAME, not the native variant COMPONENT.'
          );
        const existing = owned.get(key);
        if (plan || (existing && mgReadIdentity(existing, MG_ALPHA_MASK_KEY))) {
          const record = {
            plan,
            keys: {
              mask: key,
              owner: parentKey,
              content:
                parent &&
                `${parentKey}/${parent.children?.[1]?.id || parent.children?.[1]?.key}`,
            },
          };
          alphaMaskRecords.push(record);
          if (plan) alphaMaskOwners.set(parent, record);
        }
        (tree.children || []).forEach((child, childIndex) =>
          maskTree(
            child,
            `${key}/${child.id || child.key}`,
            tree,
            key,
            childIndex
          )
        );
      }
      for (const family of ordered)
        for (const variant of family.variants)
          maskTree(
            variant.tree,
            `family/${family.id}/variant/${variant.id}`,
            null,
            null,
            0
          );
    } catch (error) {
      result.errors.push(reportError(error));
      result.audit.push({
        status: 'blocked-alpha-mask-preflight',
        phase: 'source',
        reason: reportError(error),
      });
      return result;
    }
    if (!checkAlphaMasks('before-font-preparation')) return result;
  }
  const available = await figma.listAvailableFontsAsync();
  const fontPromises = new Map();
  async function load(font) {
    const key = JSON.stringify(font);
    if (!fontPromises.has(key)) {
      fontPromises.set(
        key,
        (async () => {
          if (
            !available.some(
              entry =>
                entry.fontName.family === font.family &&
                entry.fontName.style === font.style
            )
          )
            throw new Error(
              `Font "${font.family} ${font.style}" is unavailable.`
            );
          await figma.loadFontAsync(font);
        })()
      );
    }
    await fontPromises.get(key);
  }
  async function loadNodeFonts(root) {
    const texts =
      root.type === 'TEXT'
        ? [root]
        : 'findAllWithCriteria' in root
          ? root.findAllWithCriteria({ types: ['TEXT'] })
          : [];
    for (const text of texts) {
      if (text.fontName !== figma.mixed) await load(text.fontName);
      else
        for (const segment of text.getStyledTextSegments(['fontName']))
          await load(segment.fontName);
    }
  }
  function nativeTextAssetSignature(state) {
    return JSON.stringify({
      collections: [...state.collectionsBySourceId].map(([source, c]) => [
        source,
        c.id,
        c.name,
        [...state.modeIdsByCollectionId.get(source)],
      ]),
      variables: [...state.variablesBySourceId].map(([source, v]) => [
        source,
        v.id,
        v.variableCollectionId,
        v.name,
        v.resolvedType,
      ]),
    });
  }
  const nativeTextAssetBefore =
    MG_NATIVE_COLLECTIONS_TEXT_BUILDER_ENABLED &&
    nativeCollectionPlan?.version === 2
      ? nativeTextAssetSignature(nativeCollectionState)
      : null;
  let nativeTextInstanceBefore = null;
  async function nativeTextInstanceSignature() {
    const rows = [];
    for (const node of page.findAll(
      node =>
        Boolean(mgReadIdentity(node, MG_KIT_KEY)) && node.type === 'INSTANCE'
    )) {
      const main = await node.getMainComponentAsync();
      assertNativeCollectionTarget();
      const key = main && mgReadIdentity(main, MG_KIT_KEY);
      const sourceKey = mgReadIdentity(node, MG_KIT_KEY),
        expectedMain =
          nativeCollectionPlan.instanceMasterKeys.get(sourceKey) ||
          (/^family\/[^/]+\/variant\/[^/]+$/.test(sourceKey)
            ? sourceKey
            : null);
      if (
        !expectedMain ||
        key !== expectedMain ||
        !main ||
        main.type !== 'COMPONENT' ||
        owned.get(key)?.id !== main.id ||
        mgReadIdentity(main, 'mgNativeScenePlan') !==
          JSON.stringify(mgNativeCollectionsSceneLedger(nativeCollectionPlan))
      )
        throw new Error(
          'Partition instance main ownership conflicts with source masters.'
        );
      rows.push({ id: node.id, mainId: main.id });
    }
    return JSON.stringify(rows.sort((a, b) => a.id.localeCompare(b.id)));
  }
  let nativeTextStyleBefore = null;
  function nativeTextStyleSignature(styles) {
    return JSON.stringify(
      styles
        .map(style => ({
          id: style.id,
          name: style.name,
          key: mgReadIdentity(style, 'mgStyleId'),
          type: style.type,
          fontName: style.fontName,
          fontSize: style.fontSize,
          lineHeight: style.lineHeight,
          letterSpacing: style.letterSpacing,
          decoration: style.textDecoration,
          wrap: style.textWrapStyle,
          indent: style.paragraphIndent,
          bound: style.boundVariables,
        }))
        .sort((a, b) => a.id.localeCompare(b.id))
    );
  }
  async function nativeTextStyles() {
    const text = await figma.getLocalTextStylesAsync();
    assertNativeCollectionTarget();
    const effects = await figma.getLocalEffectStylesAsync();
    assertNativeCollectionTarget();
    const chosen = [];
    for (const spec of nativeCollectionPlan.textStylesById.values()) {
      const hits = [...text, ...effects].filter(
        style =>
          mgReadIdentity(style, 'mgStyleId') === spec.id ||
          style.name === spec.name
      );
      if (
        hits.length > 1 ||
        (hits.length &&
          (hits[0].type !== 'TEXT' ||
            mgReadIdentity(hits[0], 'mgStyleId') !== spec.id ||
            hits[0].name !== spec.name))
      )
        throw new Error('Partition plain style identity/kind conflict.');
      if (hits.length) chosen.push(hits[0]);
    }
    return chosen;
  }
  async function checkNativeTextBeforeStyles() {
    nativeCollectionState = mgNativeCollectionsPreflight(
      nativeCollectionPlan,
      await nativeCollectionImportSnapshot(assertNativeCollectionTarget),
      {
        readCollection: asset => {
          const value = mgReadIdentity(asset, 'mgNativeCollectionPlan');
          return value ? JSON.parse(value) : null;
        },
        readVariable: asset => mgReadIdentity(asset, 'mgId'),
      }
    );
    if (
      nativeTextAssetSignature(nativeCollectionState) !== nativeTextAssetBefore
    )
      throw new Error(
        'Partition asset identities changed across font preparation.'
      );
    const required = mgNativeCollectionsFontPlan(
      nativeCollectionPlan,
      nativeCollectionState
    );
    for (const font of required)
      if (!fontPromises.has(JSON.stringify(font)))
        throw new Error(
          'Partition native font changed after font preparation.'
        );
    const current = await nativeTextStyles();
    if ((await nativeTextInstanceSignature()) !== nativeTextInstanceBefore)
      throw new Error(
        'Partition instance main changed across font preparation.'
      );
    if (nativeTextStyleSignature(current) !== nativeTextStyleBefore)
      throw new Error('Partition plain style changed across font preparation.');
    if (
      nativeSceneSignature(
        page.findAll(node => Boolean(mgReadIdentity(node, MG_KIT_KEY)))
      ) !== nativeSceneBefore
    )
      throw new Error(
        'Partition text/property ownership changed across font preparation.'
      );
    assertNativeCollectionTarget();
  }
  if (
    MG_NATIVE_COLLECTIONS_TEXT_BUILDER_ENABLED &&
    nativeCollectionPlan?.version === 2
  ) {
    nativeTextInstanceBefore = await nativeTextInstanceSignature();
    const styleAssets = await nativeTextStyles();
    nativeTextStyleBefore = nativeTextStyleSignature(styleAssets);
    const fonts = [
      ...nativeCollectionPlan.sourceFonts,
      ...mgNativeCollectionsFontPlan(
        nativeCollectionPlan,
        nativeCollectionState
      ),
      { family: 'Inter', style: 'Regular' },
    ];
    for (const style of styleAssets) fonts.push(style.fontName);
    if (typeof figma.getFontFamilyVariationAxes !== 'function')
      throw new Error(
        'Partition plain text requires native font-axis discovery.'
      );
    for (const font of fonts) {
      const axes = figma.getFontFamilyVariationAxes(font.family);
      if (
        !Array.isArray(axes) ||
        (axes.length &&
          !available.some(
            entry =>
              entry.fontName.family === font.family &&
              entry.fontName.style === font.style &&
              entry.fontName.variationSettings &&
              axes.every(axis =>
                Number.isFinite(entry.fontName.variationSettings[axis])
              )
          ))
      )
        throw new Error(
          'Partition plain native named font axes are unresolved; separately journaled default preparation is required.'
        );
    }
    for (const font of fonts) {
      await load(font);
      assertNativeCollectionTarget();
    }
    // Plain native named fonts are loaded through the documented API. Explicit
    // source axes are refused by this first profile; no rich default probe runs.
    await checkNativeTextBeforeStyles();
  }
  // Changing a container's mode can change text across every descendant family.
  // Prepare that whole subtree only for a real transition, before any writes.
  for (const key of ['main', 'review']) {
    const frame = owned.get(key);
    if (!frame) continue;
    try {
      if (frame.type !== 'FRAME')
        throw new Error(`Owned ${key} container has changed type.`);
      if (
        MG_NATIVE_COLLECTIONS_TEXT_BUILDER_ENABLED &&
        nativeCollectionPlan?.version === 2
          ? [...nativeCollectionPlan.collectionById.keys()].some(
              id =>
                frame.explicitVariableModes[
                  nativeCollectionState.collectionsBySourceId.get(id).id
                ] !==
                nativeCollectionState.modeIdsByCollectionId.get(id).get(brandId)
            )
          : frame.explicitVariableModes[collection.id] !== mode.modeId
      )
        await loadNodeFonts(frame);
    } catch (error) {
      const reason = reportError(error);
      result.errors.push(`${frame.name}: ${reason}`);
      result.audit.push({
        nodeId: frame.id,
        status: 'blocked-container-mode-transition',
        reason,
      });
      return result;
    }
  }
  const allowedBindings = new Set([
    'cornerRadius',
    'topLeftRadius',
    'topRightRadius',
    'bottomLeftRadius',
    'bottomRightRadius',
    'strokeWeight',
    'strokeTopWeight',
    'strokeBottomWeight',
    'strokeLeftWeight',
    'strokeRightWeight',
    'opacity',
    'minWidth',
    'maxWidth',
    'minHeight',
    'maxHeight',
    'width',
    'height',
    'itemSpacing',
    'paddingTop',
    'paddingBottom',
    'paddingLeft',
    'paddingRight',
    'visible',
  ]);
  function absoluteNumber(name, seen = new Set(), nativeModeId = mode.modeId) {
    const entry = variable(name, 'FLOAT');
    if (seen.has(entry.id))
      throw new Error(`Absolute variable alias cycle at ${name}.`);
    seen.add(entry.id);
    const value = entry.valuesByMode[nativeModeId];
    if (value && typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
      const alias = [...variables.values()].find(item => item.id === value.id);
      if (!alias)
        throw new Error(`Missing absolute variable alias at ${name}.`);
      return absoluteNumber(alias.name, seen, nativeModeId);
    }
    if (!Number.isFinite(value))
      throw new Error(
        `Absolute FLOAT ${name} must be finite in the imported brand mode.`
      );
    return value;
  }
  const gradientRolesScope =
    MG_GRADIENT_ROLES_ENABLED &&
    ordered.some(family =>
      family.variants.some(variant => {
        let found = false;
        treeWalk(variant.tree, tree => {
          if (
            tree.gradient?.layers?.some(
              layer => layer?.transformVariables !== undefined
            )
          )
            found = true;
        });
        return found;
      })
    );
  const textThicknessPlans = MG_TEXT_THICKNESS_ENABLED ? new Map() : null;
  const textThicknessScope =
    MG_TEXT_THICKNESS_ENABLED &&
    ordered.some(family =>
      family.variants.some(variant => {
        let found = false;
        treeWalk(variant.tree, tree => {
          if (tree.textDecorationThickness !== undefined) found = true;
        });
        return found;
      })
    );
  const richTextPlans = MG_RICH_TEXT_ENABLED ? new Map() : null;
  const richParagraphStyles = MG_RICH_TEXT_ENABLED ? new Set() : null;
  const richParagraphNodes = MG_RICH_TEXT_ENABLED ? [] : null;
  const richTextScope =
    MG_RICH_TEXT_ENABLED &&
    ordered.some(family =>
      family.variants.some(variant => {
        let found = false;
        treeWalk(variant.tree, tree => {
          if (tree.textRuns !== undefined) found = true;
        });
        return found;
      })
    );
  const svgSizingScope =
    MG_SVG_SIZING_ENABLED &&
    ordered.some(family =>
      family.variants.some(variant => {
        let found = false;
        treeWalk(variant.tree, tree => {
          if (tree.svg?.sizing !== undefined) found = true;
        });
        return found;
      })
    );
  function nativeSvgNumber(name, nativeMode, type, seen = new Set()) {
    const entry = variable(name, type);
    if (seen.has(entry.id))
      throw new Error('SVG sizing native alias is cyclic.');
    seen.add(entry.id);
    const value = entry.valuesByMode[nativeMode.id];
    if (value?.type === 'VARIABLE_ALIAS') {
      const alias = [...variables.values()].find(item => item.id === value.id);
      if (!alias) throw new Error('SVG sizing native alias is missing.');
      return nativeSvgNumber(alias.name, nativeMode, type, seen);
    }
    if (!Number.isFinite(value))
      throw new Error('SVG sizing native FLOAT is unresolved.');
    return value;
  }
  const absoluteStartScope =
    MG_ABSOLUTE_START_ENABLED &&
    ordered.some(family =>
      family.variants.some(variant => {
        let found = false;
        treeWalk(variant.tree, tree => {
          if (tree.absolute?.horizontal === 'START') found = true;
        });
        return found;
      })
    );
  let richContext;
  const ready = [];
  const blocked = new Set();
  const usedText = new Set();
  const usedEffects = new Set();
  const directText = MG_DIRECT_TEXT_ENABLED ? new Map() : null;
  if (MG_DIRECT_TEXT_ENABLED) {
    // Exact source profiles. Editorial native acceptance remains pending.
    // Validate the whole selected scope before any
    // style/canvas writes, including when other selected families are valid.
    try {
      for (const family of ordered)
        for (const variant of family.variants)
          treeWalk(variant.tree, (tree, parent) => {
            if (tree.textStyleApplication === undefined) return;
            const editorial = family.id === 'editorial-cta';
            let sizeRole = 'font-size/300';
            if (editorial) {
              const p = variant.properties || {};
              const contexts = [
                'Base',
                'HeroPrimary',
                'HeroTertiary',
                'HeroQuaternary',
              ];
              const allowed = new Set();
              for (const context of contexts) {
                const states =
                  context === 'Base'
                    ? ['Default', 'Focus', 'Disabled']
                    : ['Default', 'Focus'];
                for (const state of states)
                  allowed.add(
                    [context, state, 'Short', 'NoPreference']
                      .join('.')
                      .toLowerCase()
                  );
                for (const motion of ['NoPreference', 'Reduce'])
                  allowed.add(
                    [context, 'Hover', 'Short', motion].join('.').toLowerCase()
                  );
                allowed.add(
                  [context, 'Default', 'Long', 'NoPreference']
                    .join('.')
                    .toLowerCase()
                );
              }
              for (const state of ['Hover', 'Focus'])
                allowed.add(
                  ['Base', state, 'Long', 'NoPreference']
                    .join('.')
                    .toLowerCase()
                );
              const identity = [p.Context, p.State, p.Content, p.Motion]
                .join('.')
                .toLowerCase();
              const expectedStyle =
                p.State === 'Focus'
                  ? 'component.editorial-cta.label-focus'
                  : p.State === 'Hover'
                    ? 'component.editorial-cta.label-hover'
                    : 'component.editorial-cta.label';
              const expectedDecoration = ['Focus', 'Hover'].includes(p.State)
                ? 'UNDERLINE'
                : 'NONE';
              const expectedOffset =
                p.State === 'Hover'
                  ? { unit: 'PERCENT', value: 20 }
                  : { unit: 'AUTO' };
              const expectedFill =
                p.Context !== 'Base'
                  ? 'color/neutral-0'
                  : p.State === 'Hover'
                    ? 'color/interactive-active'
                    : 'color/text';
              if (
                tree.textStyleApplication !== 'DIRECT' ||
                Object.keys(p).sort().join(',') !==
                  'Content,Context,Motion,State' ||
                !allowed.has(identity) ||
                variant.id !== 'editorial-cta.' + identity ||
                tree.type !== 'TEXT' ||
                tree.name !== 'mg-button-cta / label' ||
                ![
                  'label',
                  'mg-button mg-button-cta/mg-button-cta / label',
                ].includes(tree.id) ||
                tree.textProperty !== 'Label' ||
                tree.textStyle !== expectedStyle ||
                tree.textDecoration !== expectedDecoration ||
                tree.textWrap !== 'AUTO' ||
                JSON.stringify(tree.textDecorationOffset) !==
                  JSON.stringify(expectedOffset) ||
                tree.fill !== expectedFill ||
                tree.stroke !== null ||
                tree.layout?.width !==
                  (p.Content === 'Long' ? 'FILL' : 'HUG') ||
                tree.layout?.height !== 'HUG' ||
                parent !== variant.tree ||
                parent.type !== 'FRAME' ||
                parent.name !== 'mg-button mg-button-cta' ||
                !['action', 'mg-button mg-button-cta'].includes(parent.id) ||
                (parent.id === 'action') !== (tree.id === 'label') ||
                parent.children.length !== 2 ||
                parent.children[0] !== tree ||
                parent.children[1].type !== 'FRAME' ||
                parent.children[1].name !== 'mg-button-cta / badge'
              )
                throw new Error(
                  'DIRECT Editorial is restricted to its exact source-owned Label state.'
                );
              sizeRole = 'font-size/button';
            } else if (
              tree.textStyleApplication !== 'DIRECT' ||
              family.id !== 'toc-link' ||
              !/^toc-link\.(240|390|900)\.(default|hover|focus|hoverfocus)$/.test(
                variant.id
              ) ||
              tree.type !== 'TEXT' ||
              !['label', 'mg-table-of-contents / a/Link label'].includes(
                tree.id
              ) ||
              tree.name !== 'Link label' ||
              tree.textProperty !== 'Label' ||
              tree.textStyle !== 'component.table-of-contents.link' ||
              parent !== variant.tree ||
              !['link', 'mg-table-of-contents / a'].includes(parent.id) ||
              parent.name !== 'mg-table-of-contents / a' ||
              (parent.id === 'link') !== (tree.id === 'label') ||
              parent.children.length !== 1
            )
              throw new Error(
                'textStyleApplication DIRECT is restricted to source TOC or Editorial Label TEXT.'
              );
            const matches = doc.styles.text.filter(
              s => s.id === tree.textStyle
            );
            const template = matches[0],
              values = template?.values?.[brandId];
            const expectedFontSize = editorial ? absoluteNumber(sizeRole) : 16;
            if (
              matches.length !== 1 ||
              (template.type !== undefined && template.type !== 'TEXT') ||
              (editorial &&
                (template.source?.file !==
                  'stories/Components/Buttons/CtaButton/cta-button.scss' ||
                  template.name !==
                    'Mangrove/component/editorial-cta/' +
                      tree.textStyle.split('.').at(-1))) ||
              template.bindings?.fontFamily !== 'font-family/text' ||
              template.bindings?.fontSize !== sizeRole ||
              values?.fontName?.family !== 'Roboto' ||
              values.fontName.style !== (editorial ? 'Bold' : 'Regular') ||
              values.fontSize !== expectedFontSize ||
              values.lineHeight?.unit !== 'PERCENT' ||
              values.lineHeight.value !== (editorial ? 100 : 150) ||
              values.textDecoration !==
                (editorial ? tree.textDecoration : 'UNDERLINE') ||
              values.textWrapStyle !== 'AUTO' ||
              (editorial &&
                JSON.stringify(values.textDecorationOffset) !==
                  JSON.stringify(tree.textDecorationOffset))
            )
              throw new Error(
                'DIRECT typography needs its exact source template and brand values.'
              );
            const bindings = {};
            for (const [field, type] of [
              ['fontFamily', 'STRING'],
              ['fontSize', 'FLOAT'],
            ]) {
              const name = template.bindings[field],
                sources = doc.variables.filter(v => v.name === name),
                native = variable(name, type);
              if (
                sources.length !== 1 ||
                sources[0].type !== type ||
                nativeVariables.filter(v => v.name === name).length !== 1 ||
                mgReadIdentity(native, 'mgId') !== sources[0].id
              )
                throw new Error(
                  `DIRECT needs the exact ${type} source role ${name}.`
                );
              const seen = new Set();
              let current = native,
                value;
              while (current) {
                if (seen.has(current.id))
                  throw new Error(`DIRECT alias cycle at ${name}.`);
                seen.add(current.id);
                if (current.resolvedType !== type)
                  throw new Error(`DIRECT alias type changed at ${name}.`);
                value = current.valuesByMode[mode.modeId];
                if (value?.type !== 'VARIABLE_ALIAS') break;
                current = [...variables.values()].find(v => v.id === value.id);
                if (!current)
                  throw new Error(`DIRECT alias is missing at ${name}.`);
              }
              if (
                value !==
                (field === 'fontFamily'
                  ? values.fontName.family
                  : values.fontSize)
              )
                throw new Error(
                  `DIRECT imported brand role differs at ${name}.`
                );
              bindings[field] = native;
            }
            directText.set(tree, bindings);
          });
    } catch (error) {
      result.errors.push(reportError(error));
      return result;
    }
  }
  const coincidentFocus = MG_COINCIDENT_FOCUS_ENABLED ? new Map() : null;
  // This renderer is a source-family exception, not a generic focus-ring API.
  // Validate every selected recipe before importing styles or touching the canvas.
  try {
    for (const family of ordered)
      for (const variant of family.variants)
        treeWalk(variant.tree, (tree, parent) => {
          const ring = tree.focusRing;
          const focused = ['Focus', 'HoverFocus'].includes(
            variant.properties?.State
          );
          if (
            family.id === 'segmented-control.segment' &&
            tree === variant.tree &&
            focused &&
            !ring
          )
            throw new Error(
              'Focused source Segmented leaves require COINCIDENT_SCALE outlines.'
            );
          if (
            !ring ||
            (ring.renderer === undefined &&
              ring.outerStroke === undefined &&
              ring.cornerBindings === undefined)
          )
            return;
          if (!MG_COINCIDENT_FOCUS_ENABLED)
            throw new Error(
              'COINCIDENT_SCALE is unavailable in this compiled component scope.'
            );
          if (MG_COINCIDENT_FOCUS_ENABLED) {
            const selected = variant.properties?.Selected,
              state = variant.properties?.State,
              position = variant.properties?.Position;
            const fields = [
              'topLeftRadius',
              'topRightRadius',
              'bottomLeftRadius',
              'bottomRightRadius',
            ];
            const roles = {
              color: 'color/focus-ring',
              separatorColor: 'color/neutral-0',
              offset: 'focus-ring/offset',
              width: 'focus-ring/width',
              outerStroke: 'effect-size/focus-ring/outer-spread',
            };
            const templates = (doc.styles?.text || []).filter(
              value => value.id === 'component.segmented-control.segment'
            );
            const template = templates[0],
              templateValue = template?.values?.[brandId];
            const paintRole =
              selected === 'True'
                ? state === 'HoverFocus'
                  ? 'color/button-background--hover'
                  : 'color/button-background'
                : state === 'HoverFocus'
                  ? 'color/button-outline-primary--hover'
                  : 'color/button-outline-primary';
            const label = tree.children?.[0];
            const raw = tree.id === 'segment' && label?.id === 'label';
            const normalized =
              tree.id === 'mg-segmented-control__label' &&
              label?.id === `${tree.id}/Segment label`;
            if (
              ring.renderer !== 'COINCIDENT_SCALE' ||
              Object.keys(ring).length !== 7 ||
              Object.keys(ring).some(
                field =>
                  ![
                    ...Object.keys(roles),
                    'renderer',
                    'cornerBindings',
                  ].includes(field)
              ) ||
              family.id !== 'segmented-control.segment' ||
              family.source?.file !==
                'stories/Components/Forms/SegmentedControl/segmented-control.scss' ||
              !/^[a-f0-9]{64}$/.test(family.source.normalizedSha256 || '') ||
              templates.length !== 1 ||
              template.type !== 'TEXT' ||
              template.source?.file !== family.source.file ||
              template.source?.normalizedSha256 !==
                family.source.normalizedSha256 ||
              template.bindings?.fontFamily !== 'font-family/text' ||
              template.bindings?.fontSize !== 'font-size/button' ||
              templateValue?.fontName?.style !== 'Bold' ||
              templateValue.lineHeight?.unit !== 'PERCENT' ||
              templateValue.lineHeight.value !== 120 ||
              !['False', 'True'].includes(selected) ||
              !focused ||
              !['First', 'Middle', 'Last'].includes(position) ||
              variant.id !==
                `segmented-control.segment.${selected.toLowerCase()}.${state.toLowerCase()}.${position.toLowerCase()}` ||
              variant.name !==
                `Selected=${selected}, State=${state}, Position=${position}` ||
              Object.keys(variant.properties).length !== 3 ||
              tree !== variant.tree ||
              parent ||
              tree.type !== 'FRAME' ||
              !(raw || normalized) ||
              tree.name !== 'mg-segmented-control__label' ||
              tree.children.length !== 1 ||
              label.type !== 'TEXT' ||
              label.name !== 'Segment label' ||
              label.textProperty !== 'Label' ||
              label.characters !== 'Depth' ||
              label.textStyle !== 'component.segmented-control.segment' ||
              label.textStyleApplication !== undefined ||
              tree.layout?.mode !== 'HORIZONTAL' ||
              tree.layout.width !== 'HUG' ||
              tree.layout.height !== 'HUG' ||
              tree.layout.minHeight !==
                'component/segmented-control/minimum-height' ||
              tree.clipsContent !== false ||
              tree.strokesIncludedInLayout !== true ||
              tree.effectStyle !== null ||
              tree.stroke !== paintRole ||
              tree.fill !==
                (selected === 'True' || state === 'HoverFocus'
                  ? paintRole
                  : null) ||
              label.fill !==
                (selected === 'True' || state === 'HoverFocus'
                  ? 'color/button'
                  : paintRole) ||
              Object.entries(roles).some(
                ([field, name]) => ring[field] !== name
              ) ||
              !ring.cornerBindings ||
              Object.keys(ring.cornerBindings).length !== 4
            )
              throw new Error(
                'COINCIDENT_SCALE is restricted to exact source Default Segmented Focus/HoverFocus leaves.'
              );
            for (const field of fields) {
              const rounded =
                position === 'First'
                  ? field.includes('Left')
                  : position === 'Last'
                    ? field.includes('Right')
                    : false;
              const name = rounded ? 'radius/button' : 'spacing/0';
              if (
                ring.cornerBindings[field] !== name ||
                tree.bindings?.[field] !== name
              )
                throw new Error(
                  `COINCIDENT_SCALE source corner alias differs at ${field}.`
                );
            }
            const sourceRole = (name, type, sourceMode, seen = new Set()) => {
              const matches = (doc.variables || []).filter(
                value => value.name === name
              );
              const source = matches[0];
              if (
                matches.length !== 1 ||
                source.id !== name.replaceAll('/', '.') ||
                source.type !== type ||
                seen.has(name)
              )
                throw new Error(
                  `COINCIDENT_SCALE requires one exact ${type} source role ${name}.`
                );
              seen.add(name);
              const value = source.values?.[sourceMode];
              if (value && typeof value === 'object' && 'alias' in value) {
                if (
                  Object.keys(value).length !== 1 ||
                  typeof value.alias !== 'string'
                )
                  throw new Error(
                    `Malformed COINCIDENT_SCALE source alias ${name}.`
                  );
                return sourceRole(value.alias, type, sourceMode, seen);
              }
              if (
                type === 'FLOAT'
                  ? !Number.isFinite(value) || value < 0
                  : !value ||
                    Object.keys(value).length !== 4 ||
                    !['r', 'g', 'b', 'a'].every(
                      field =>
                        Number.isFinite(value[field]) &&
                        value[field] >= 0 &&
                        value[field] <= 1
                    )
              )
                throw new Error(
                  `Invalid COINCIDENT_SCALE source value ${name}.`
                );
              return value;
            };
            const nativeRole = (name, type, seen = new Set()) => {
              const matches = nativeVariables.filter(
                value => value.name === name
              );
              const native = matches[0];
              if (
                matches.length !== 1 ||
                native.resolvedType !== type ||
                native.variableCollectionId !== collection.id ||
                mgReadIdentity(native, 'mgId') !== name.replaceAll('/', '.') ||
                seen.has(native.id)
              )
                throw new Error(
                  `COINCIDENT_SCALE requires one exact imported ${type} role ${name}.`
                );
              seen.add(native.id);
              const value = native.valuesByMode[mode.modeId];
              if (value?.type === 'VARIABLE_ALIAS') {
                const target = nativeVariables.find(
                  value2 => value2.id === value.id
                );
                if (!target)
                  throw new Error(
                    `Missing COINCIDENT_SCALE native alias ${name}.`
                  );
                return nativeRole(target.name, type, seen);
              }
              const expected = sourceRole(name, type, brandId);
              const represented = (actual, source) =>
                actual === source || actual === Math.fround(source);
              if (
                type === 'FLOAT'
                  ? !represented(value, expected)
                  : !value ||
                    Object.keys(value).length !== 4 ||
                    !['r', 'g', 'b', 'a'].every(field =>
                      represented(value[field], expected[field])
                    )
              )
                throw new Error(
                  `COINCIDENT_SCALE imported brand differs at ${name}.`
                );
              return value;
            };
            for (const sourceMode of doc.modes) {
              const offset = sourceRole(ring.offset, 'FLOAT', sourceMode.id),
                width = sourceRole(ring.width, 'FLOAT', sourceMode.id),
                sum = sourceRole(ring.outerStroke, 'FLOAT', sourceMode.id);
              if (
                !(offset > 0 && width > 0) ||
                sum !== offset + width ||
                sourceRole('spacing/0', 'FLOAT', sourceMode.id) !== 0
              )
                throw new Error(
                  `COINCIDENT_SCALE focus sum/zero differs for ${sourceMode.id}.`
                );
              for (const name of Object.values(ring.cornerBindings))
                sourceRole(name, 'FLOAT', sourceMode.id);
              sourceRole(ring.color, 'COLOR', sourceMode.id);
              sourceRole(ring.separatorColor, 'COLOR', sourceMode.id);
            }
            for (const name of [
              ring.offset,
              ring.width,
              ring.outerStroke,
              ...Object.values(ring.cornerBindings),
            ])
              nativeRole(name, 'FLOAT');
            nativeRole(ring.color, 'COLOR');
            nativeRole(ring.separatorColor, 'COLOR');
            coincidentFocus.set(tree, {
              offset: nativeRole(ring.offset, 'FLOAT'),
              width: nativeRole(ring.width, 'FLOAT'),
              outerStroke: nativeRole(ring.outerStroke, 'FLOAT'),
            });
          }
        });
  } catch (error) {
    result.errors.push(reportError(error));
    return result;
  }
  const svgPlans = new Map();
  const svgAssetSources = new Map();
  const imagePlans = new Map();
  const imageAssetSources = new Map();
  const imageHashes = new Map();
  const gradientPlans = new Map();
  for (const family of ordered) {
    try {
      if (dependencies(family).some(id => blocked.has(id)))
        throw new Error('A required component family could not be prepared.');
      if (family.kind !== 'component-set' || !family.variants.length)
        throw new Error('Expected a component set with at least one variant.');
      const variantIds = new Set();
      const familyText = new Set();
      const familyEffects = new Set();
      const propertyTypes = new Map();
      function recordProperty(name, type) {
        if (propertyTypes.has(name) && propertyTypes.get(name) !== type)
          throw new Error(`Conflicting component property type for ${name}`);
        propertyTypes.set(name, type);
      }
      for (const name of Object.keys(family.optionalProperties || {}))
        recordProperty(name, 'BOOLEAN');
      if (
        family.review?.genericLabels !== undefined &&
        typeof family.review.genericLabels !== 'boolean'
      )
        throw new Error('Review genericLabels must be a boolean.');
      if (family.review?.preserveVariantSizing !== undefined) {
        if (typeof family.review.preserveVariantSizing !== 'boolean')
          throw new Error('Review preserveVariantSizing must be a boolean.');
        if (family.review.preserveVariantSizing && !MG_INTRINSIC_REVIEW_ENABLED)
          throw new Error(
            'Intrinsic review sizing is disabled in this connector scope. Compile the selected family before building it.'
          );
      }
      if (
        family.review?.width !== undefined &&
        (!Number.isFinite(family.review.width) || family.review.width <= 0)
      )
        throw new Error('Review width must be positive and finite.');
      for (const variant of family.variants) {
        if (variantIds.has(variant.id))
          throw new Error(`Duplicate variant ${variant.id}`);
        variantIds.add(variant.id);
        if (variant.tree.type !== 'FRAME')
          throw new Error('Variant root must be FRAME.');
        if (family.review?.longLabelTarget !== undefined) {
          const path = family.review.longLabelTarget;
          if (
            !Array.isArray(path) ||
            !path.length ||
            path.some(name => typeof name !== 'string' || !name)
          )
            throw new Error(
              'Long-label target must be a nonempty anatomy path.'
            );
          let target = variant.tree;
          for (const name of path) {
            const matches = (target.children || []).filter(
              child => child.name === name
            );
            if (matches.length !== 1)
              throw new Error(
                `Ambiguous or missing review label target ${name}`
              );
            target = matches[0];
          }
          if (target.type !== 'INSTANCE')
            throw new Error('Long-label target must be a nested instance.');
        }
        const keys = new Set();
        treeWalk(variant.tree, (tree, parent) => {
          if (tree.absolute !== undefined) {
            if (!MG_ABSOLUTE_ENABLED)
              throw new Error(
                'Absolute recipes are disabled in this connector scope. Compile the selected family before building it.'
              );
            const absolute = mgAbsolutePlan(tree, parent);
            if (MG_ABSOLUTE_START_ENABLED && absolute.horizontal === 'START') {
              mgAbsoluteStartSource(doc, tree);
              for (const nativeMode of collection.modes) {
                absoluteNumber(absolute.offsetX, new Set(), nativeMode.modeId);
                absoluteNumber(absolute.offsetY, new Set(), nativeMode.modeId);
                for (const field of ['width', 'height'])
                  if (
                    typeof tree.layout[field] === 'string' &&
                    absoluteNumber(
                      tree.layout[field],
                      new Set(),
                      nativeMode.modeId
                    ) <= 0
                  )
                    throw new Error(
                      'Absolute START native sizing must be positive.'
                    );
              }
            }
            absoluteNumber(absolute.offsetX);
            absoluteNumber(absolute.offsetY);
            for (const field of ['width', 'height']) {
              const value = tree.layout[field];
              if (typeof value === 'string' && absoluteNumber(value) <= 0)
                throw new Error(
                  'Absolute width and height FLOAT helpers must be positive.'
                );
            }
          }
          if (MG_RICH_TEXT_ENABLED && tree.textRuns !== undefined) {
            if (
              tree.type !== 'TEXT' ||
              tree.bindings !== undefined ||
              tree.effectStyle !== undefined ||
              tree.focusRing !== undefined ||
              tree.visibilityProperty !== undefined ||
              tree.appearance !== undefined
            )
              throw new Error(
                'Rich TEXT forbids whole-node bindings/effects/properties/appearance conflicts.'
              );
          }
          if (
            MG_TEXT_THICKNESS_ENABLED &&
            tree.textDecorationThickness !== undefined
          )
            textThicknessPlans.set(tree, mgTextThicknessPlan(tree));
          if (tree.textDecorationOffset !== undefined) {
            const offset = tree.textDecorationOffset;
            if (
              tree.type !== 'TEXT' ||
              !offset ||
              typeof offset !== 'object' ||
              Array.isArray(offset) ||
              (offset.unit === 'AUTO'
                ? Object.keys(offset).length !== 1
                : !['PIXELS', 'PERCENT'].includes(offset.unit) ||
                  Object.keys(offset).length !== 2 ||
                  !Number.isFinite(offset.value) ||
                  Object.keys(offset).some(
                    key => !['unit', 'value'].includes(key)
                  ))
            )
              throw new Error(
                'TEXT textDecorationOffset requires AUTO or finite PIXELS/PERCENT units.'
              );
          }
          if (tree.textProperty) recordProperty(tree.textProperty, 'TEXT');
          if (tree.visibilityProperty)
            recordProperty(tree.visibilityProperty, 'BOOLEAN');
          if (tree.visibilityProperty && tree.bindings?.visible !== undefined)
            throw new Error(
              'A visible variable binding and BOOLEAN property cannot control the same node.'
            );
          if (
            tree.textDecoration !== undefined &&
            (tree.type !== 'TEXT' ||
              !['UNDERLINE', 'NONE'].includes(tree.textDecoration))
          )
            throw new Error(
              'Only TEXT recipes support textDecoration UNDERLINE or NONE.'
            );
          if (
            !['FRAME', 'TEXT', 'INSTANCE', 'ELLIPSE', 'SVG'].includes(tree.type)
          )
            throw new Error(`Unsupported recipe node ${tree.type}`);
          if (
            MG_SVG_SIZING_ENABLED &&
            tree.svg?.sizing !== undefined &&
            tree.type !== 'SVG'
          )
            throw new Error('SVG sizing is only supported on SVG leaves.');
          if (tree.type === 'SVG' && !MG_SVG_ENABLED)
            throw new Error(
              'SVG recipes are disabled in this connector scope. Compile the selected SVG family before building it.'
            );
          if (MG_SVG_ENABLED && tree.type === 'SVG') {
            const plan = mgSvgPlan(tree);
            if (
              svgAssetSources.has(plan.assetId) &&
              svgAssetSources.get(plan.assetId) !== plan.markup
            )
              throw new Error(
                `SVG asset ${plan.assetId} has conflicting source markup. Use distinct asset IDs or an explicit SVG migration.`
              );
            svgAssetSources.set(plan.assetId, plan.markup);
            if (tree.svg.sizing !== undefined) {
              if (!MG_SVG_SIZING_ENABLED)
                throw new Error('SVG sizing capability is not compiled.');
              if (
                typeof MG_CONNECTOR_SVG_SIZING_SOURCE === 'undefined' ||
                MG_CONNECTOR_SVG_SIZING_SOURCE
              )
                mgSvgSizingDocumentValues(plan.sizing, doc);
              mgSvgSizingNativeValues(
                plan.sizing,
                collection.modes.map(item => ({ id: item.modeId })),
                nativeSvgNumber
              );
            }
            svgPlans.set(tree, plan);
            for (const name of Object.values(tree.svg.monochrome || {}))
              variable(name, 'COLOR');
          }
          if (MG_ARC_ENABLED && 'arcData' in tree) mgEllipseArcPlan(tree);
          if (tree.type === 'ELLIPSE') {
            const geometry = [
              'width',
              'height',
              'minWidth',
              'maxWidth',
              'minHeight',
              'maxHeight',
            ];
            if (
              tree.children?.length ||
              tree.textProperty ||
              Object.entries(tree.layout || {}).some(
                ([field, value]) => !geometry.includes(field) || value === 'HUG'
              ) ||
              Object.keys(tree.bindings || {}).some(
                field =>
                  ![...geometry, 'strokeWeight', 'opacity', 'visible'].includes(
                    field
                  )
              )
            )
              throw new Error(
                'Ellipse recipes are leaf shapes with geometry only, without HUG sizing, frame layout, text or corner radii.'
              );
          }
          if (!tree.id && !tree.key)
            throw new Error(`Node ${tree.name} needs a stable id.`);
          if (
            tree.type === 'FRAME' &&
            tree.position !== undefined &&
            (!parent ||
              parent.type !== 'FRAME' ||
              !tree.position ||
              Object.keys(tree.position).sort().join(',') !== 'x,y' ||
              !['x', 'y'].every(field => Number.isFinite(tree.position[field])))
          )
            throw new Error(
              'Positioned FRAME recipes require finite x/y inside a source frame.'
            );
          if (tree.image !== undefined) {
            const plan = mgImagePlan(tree);
            if (
              imageAssetSources.has(plan.assetId) &&
              imageAssetSources.get(plan.assetId) !== plan.base64
            )
              throw new Error(`Conflicting source image ${plan.assetId}.`);
            imageAssetSources.set(plan.assetId, plan.base64);
            imagePlans.set(tree, plan);
          }
          if (tree.gradient !== undefined) {
            const plan = mgGradientPlan(tree);
            for (const layer of plan.layers)
              for (const stop of layer.stops) variable(stop.color, 'COLOR');
            if (
              MG_GRADIENT_ROLES_ENABLED &&
              plan.layers.some(layer => layer.transformVariables !== undefined)
            ) {
              const sourceSpecs = new Map(
                doc.variables.map(entry => [entry.name, entry])
              );
              function gradientNumber(name, modeId, seen = new Set()) {
                const source = sourceSpecs.get(name),
                  matches = nativeVariables.filter(
                    entry => entry.name === name
                  ),
                  entry = matches[0];
                if (
                  !source ||
                  source.type !== 'FLOAT' ||
                  matches.length !== 1 ||
                  entry.resolvedType !== 'FLOAT' ||
                  mgReadIdentity(entry, 'mgId') !== source.id ||
                  seen.has(entry.id)
                )
                  throw new Error(
                    'Gradient transform needs its imported owned FLOAT role: ' +
                      name
                  );
                seen.add(entry.id);
                const value = entry.valuesByMode[modeId];
                if (
                  value &&
                  typeof value === 'object' &&
                  value.type === 'VARIABLE_ALIAS'
                ) {
                  const alias = nativeVariables.find(
                    variable => variable.id === value.id
                  );
                  if (!alias)
                    throw new Error(
                      'Gradient transform alias must stay in its imported collection.'
                    );
                  return gradientNumber(alias.name, modeId, seen);
                }
                if (!Number.isFinite(value))
                  throw new Error(
                    'Gradient transform FLOAT must be finite in every imported mode.'
                  );
                return value;
              }
              gradientPlans.set(tree, {
                layers: plan.layers.map(layer => {
                  if (layer.transformVariables === undefined) return layer;
                  mgGradientTransform.source(doc, layer);
                  for (const nativeMode of collection.modes)
                    mgGradientTransform.resolve(layer, name =>
                      gradientNumber(name, nativeMode.modeId)
                    );
                  return {
                    ...layer,
                    transform: mgGradientTransform.resolve(layer, name =>
                      gradientNumber(name, mode.modeId)
                    ),
                  };
                }),
              });
            } else gradientPlans.set(tree, plan);
          }
          if (
            tree.expose !== undefined &&
            (tree.type !== 'INSTANCE' || typeof tree.expose !== 'boolean')
          )
            throw new Error(
              'Only nested instance recipes may declare boolean expose.'
            );
          if (tree.type === 'INSTANCE' && tree.properties !== undefined)
            throw new Error(
              'Nested instance property values must use overrides, not properties.'
            );
          const key = tree.id || tree.key;
          if (keys.has(key)) throw new Error(`Duplicate recipe node id ${key}`);
          keys.add(key);
          if (tree.fill) variable(tree.fill, 'COLOR');
          if (tree.stroke) variable(tree.stroke, 'COLOR');
          if (tree.focusRing) {
            if (tree.effectStyle)
              throw new Error(
                'Native focus outlines cannot also use a focus effect.'
              );
            if (tree.type !== 'FRAME')
              throw new Error('Native focus outlines require a frame recipe.');
            variable(tree.focusRing.color, 'COLOR');
            variable(tree.focusRing.separatorColor, 'COLOR');
            if (MG_COINCIDENT_FOCUS_ENABLED && coincidentFocus.has(tree)) {
              for (const field of ['offset', 'width', 'outerStroke'])
                variable(tree.focusRing[field], 'FLOAT');
              for (const name of Object.values(tree.focusRing.cornerBindings))
                variable(name, 'FLOAT');
            } else
              for (const field of ['offset', 'width', 'radius'])
                variable(tree.focusRing[field], 'FLOAT');
            if (tree.focusRing.outerRadius)
              variable(tree.focusRing.outerRadius, 'FLOAT');
          }
          for (const [field, name] of Object.entries(tree.bindings || {})) {
            if (!allowedBindings.has(field))
              throw new Error(`Unsupported binding ${field}`);
            variable(name, field === 'visible' ? 'BOOLEAN' : 'FLOAT');
          }
          const layout = tree.layout || {};
          if (
            layout.wrap !== undefined &&
            !['NO_WRAP', 'WRAP'].includes(layout.wrap)
          )
            throw new Error('Layout wrap must be NO_WRAP or WRAP.');
          for (const name of [
            layout.padding?.block,
            layout.padding?.inline,
            layout.gap,
            layout.counterGap,
            layout.minHeight,
            layout.maxHeight,
            layout.maxWidth,
            layout.minWidth,
            layout.width,
            layout.height,
          ]) {
            if (typeof name === 'string' && !['HUG', 'FILL'].includes(name))
              variable(name, 'FLOAT');
          }
          if (tree.type === 'TEXT') {
            if (
              tree.textWrap !== undefined &&
              !['AUTO', 'BALANCE', 'PRETTY'].includes(tree.textWrap)
            )
              throw new Error('Unsupported text wrapping style.');
            if (MG_RICH_TEXT_ENABLED && tree.textRuns !== undefined) {
              if (!Array.isArray(tree.textRuns))
                throw new Error('Rich textRuns must be an array.');
              for (const run of tree.textRuns) {
                if (!run || !textSpecs.has(run.textStyle))
                  throw new Error('Missing rich run exported text style.');
                familyText.add(run.textStyle);
              }
            } else {
              if (!textSpecs.has(tree.textStyle))
                throw new Error(
                  `Missing exported text style ${tree.textStyle}`
                );
              familyText.add(tree.textStyle);
            }
          }
          if (tree.effectStyle) {
            if (!effectSpecs.has(tree.effectStyle))
              throw new Error(
                `Missing exported effect style ${tree.effectStyle}`
              );
            familyEffects.add(tree.effectStyle);
          }
          if (tree.type === 'INSTANCE') {
            if (tree.labelSizing !== undefined && tree.labelSizing !== 'FILL')
              throw new Error('Instance labelSizing supports only FILL.');
            const dependency = families.get(tree.family);
            if (
              !dependency?.variants.some(item =>
                matches(item.properties, tree.variant || {})
              )
            )
              throw new Error(`No matching ${tree.family} variant.`);
            if (tree.appearance !== undefined) {
              if (
                !tree.appearance ||
                typeof tree.appearance !== 'object' ||
                Array.isArray(tree.appearance) ||
                Object.keys(tree.appearance).some(
                  field => !['fill', 'stroke', 'labelFill'].includes(field)
                )
              )
                throw new Error(
                  'Instance appearance supports only fill, stroke and labelFill.'
                );
              for (const name of Object.values(tree.appearance))
                variable(name, 'COLOR');
              if (tree.appearance.labelFill) {
                const selected = dependency.variants.find(item =>
                  matches(item.properties, tree.variant || {})
                );
                const labels = [];
                treeWalk(selected.tree, child => {
                  if (child.type === 'TEXT' && child.textProperty === 'Label')
                    labels.push(child);
                });
                if (labels.length !== 1)
                  throw new Error(
                    'Contextual label fill requires exactly one Label text node.'
                  );
              }
            }
          } else if (tree.appearance !== undefined)
            throw new Error(
              'Contextual appearance is only supported on native instances.'
            );
        });
        function checkTreeOwnership(tree, key) {
          const existing = owned.get(key);
          if (existing?.componentPropertyReferences?.visible)
            managedVisibilityReference(
              existing,
              owned.get(`family/${family.id}/variant/${variant.id}`)
            );
          if (MG_SVG_ENABLED && tree.type === 'SVG') {
            const node = owned.get(key);
            if (node) {
              let previous;
              try {
                previous = JSON.parse(mgReadIdentity(node, MG_SVG_KEY));
              } catch {
                /* Missing or malformed metadata is a migration. */
              }
              const plan = svgPlans.get(tree);
              if (
                node.type !== 'FRAME' ||
                !previous ||
                previous.assetId !== plan.assetId ||
                previous.hash !== plan.hash ||
                previous.markup !== plan.markup ||
                (MG_SVG_SIZING_ENABLED &&
                  JSON.stringify(previous.sizing ?? null) !==
                    JSON.stringify(plan.sizing ?? null)) ||
                !Number.isFinite(previous.sourceOpacity) ||
                previous.sourceOpacity < 0 ||
                previous.sourceOpacity > 1 ||
                JSON.stringify(previous.paintPolicy) !==
                  JSON.stringify(plan.paintPolicy) ||
                JSON.stringify(previous.topology) !==
                  JSON.stringify(mgSvgTopology(node)) ||
                JSON.stringify(previous.geometry) !==
                  JSON.stringify(mgSvgGeometry(node))
              )
                throw new Error(
                  `SVG ${key} content, asset identity or imported geometry/topology changed. Explicit SVG migration required; preserve existing wrapper and vector IDs before replacing source.`
                );
              if (
                ![node.width, node.height].every(
                  value => Number.isFinite(value) && value > 0
                ) ||
                Math.abs(node.width / node.height - plan.width / plan.height) >
                  1e-6
              )
                throw new Error(
                  `SVG ${key} viewport aspect ratio changed. Explicit SVG migration required.`
                );
              for (const field of Object.keys(tree.svg.monochrome || {}))
                mgSvgMonochrome(node, field);
              if (MG_SVG_SIZING_ENABLED && plan.sizing)
                mgSvgSizingNativePlan(node, plan.sizing, variable, true);
              plan.sourceOpacity = previous.sourceOpacity;
            }
          }
          for (const child of tree.children || [])
            checkTreeOwnership(child, `${key}/${child.id || child.key}`);
        }
        checkTreeOwnership(
          variant.tree,
          `family/${family.id}/variant/${variant.id}`
        );
      }
      if (family.review?.variantSurfaces !== undefined) {
        const surfaces = family.review.variantSurfaces;
        if (
          !surfaces ||
          typeof surfaces !== 'object' ||
          Array.isArray(surfaces)
        )
          throw new Error(
            'Review variantSurfaces must map exact variant IDs to COLOR tokens.'
          );
        for (const [id, name] of Object.entries(surfaces)) {
          if (!variantIds.has(id))
            throw new Error(`Unknown review surface variant ${id}.`);
          variable(name, 'COLOR');
        }
      }
      if (family.review?.specimens !== undefined) {
        const specimens = family.review.specimens;
        if (!Array.isArray(specimens) || specimens.length > 8)
          throw new Error(
            'Review specimens must be an array of at most eight entries.'
          );
        const specimenIds = new Set([...variantIds, 'long-label', 'narrow']);
        for (const specimen of specimens) {
          if (
            !specimen ||
            !/^[a-z0-9][a-z0-9-]*$/.test(specimen.id || '') ||
            specimenIds.has(specimen.id)
          )
            throw new Error('Review specimen needs a unique stable id.');
          specimenIds.add(specimen.id);
          if (typeof specimen.name !== 'string' || !specimen.name)
            throw new Error('Review specimen needs a name.');
          if (
            !specimen.variant ||
            family.variants.filter(variant =>
              matches(variant.properties, specimen.variant)
            ).length !== 1
          )
            throw new Error(
              `Review specimen ${specimen.id} needs one matching variant.`
            );
          if (!Number.isFinite(specimen.width) || specimen.width <= 0)
            throw new Error(
              `Review specimen ${specimen.id} needs a positive finite width.`
            );
          if (
            !specimen.properties ||
            typeof specimen.properties !== 'object' ||
            Array.isArray(specimen.properties)
          )
            throw new Error(
              `Review specimen ${specimen.id} needs named property overrides.`
            );
          for (const [name, value] of Object.entries(specimen.properties)) {
            const type = propertyTypes.get(name);
            if (
              !type ||
              (type === 'TEXT'
                ? typeof value !== 'string'
                : typeof value !== 'boolean')
            )
              throw new Error(
                `Review specimen ${specimen.id} property ${name} must match a named TEXT or BOOLEAN property.`
              );
          }
          if (specimen.surface !== undefined)
            variable(specimen.surface, 'COLOR');
          if (specimen.instanceWidth !== undefined)
            reviewDimension(specimen.instanceWidth);
          if (specimen.nodes !== undefined) {
            if (!Array.isArray(specimen.nodes) || specimen.nodes.length > 64)
              throw new Error(
                'Review nodes must be an array of at most 64 entries.'
              );
            const root = family.variants.find(item =>
              matches(item.properties, specimen.variant)
            ).tree;
            for (const seed of specimen.nodes) {
              const target = reviewTarget(root, seed.path);
              if (seed.width !== undefined || seed.height !== undefined)
                throw new Error(
                  'Nested review dimensions are unsupported in real Figma. Put shared geometry on component masters.'
                );
              if (seed.properties !== undefined) {
                if (
                  target.type !== 'INSTANCE' ||
                  !seed.properties ||
                  typeof seed.properties !== 'object' ||
                  Array.isArray(seed.properties)
                )
                  throw new Error(
                    'Review property seeds require a nested instance and named properties.'
                  );
                const dependency = families
                  .get(target.family)
                  .variants.find(item =>
                    matches(item.properties, target.variant || {})
                  );
                const types = new Map();
                treeWalk(dependency.tree, node => {
                  if (node.textProperty) types.set(node.textProperty, 'TEXT');
                  if (node.visibilityProperty)
                    types.set(node.visibilityProperty, 'BOOLEAN');
                });
                for (const [name, value] of Object.entries(seed.properties))
                  if (
                    !types.has(name) ||
                    typeof value !==
                      (types.get(name) === 'TEXT' ? 'string' : 'boolean')
                  )
                    throw new Error(
                      `Review nested property ${name} does not match its component contract.`
                    );
              }
            }
          }
        }
      }
      for (const id of familyText) {
        const spec = textSpecs.get(id);
        for (const entry of Object.values(spec.values))
          await load(entry.fontName);
        variable(spec.bindings.fontFamily, 'STRING');
        variable(spec.bindings.fontSize, 'FLOAT');
      }
      for (const id of familyEffects) {
        const spec = effectSpecs.get(id);
        if (!spec.values[brandId])
          throw new Error(`Missing brand values for ${id}`);
        for (const entry of spec.values[brandId])
          for (const [field, name] of Object.entries(entry.bindings || {}))
            variable(name, field === 'color' ? 'COLOR' : 'FLOAT');
      }
      const existingSet = owned.get(`family/${family.id}`);
      if (existingSet) {
        if (existingSet.type !== 'COMPONENT_SET')
          throw new Error('Owned set has changed type.');
        await loadNodeFonts(existingSet);
      }
      // Creating a text node starts with Inter before the source style is applied.
      if (
        !(MG_NATIVE_COLLECTIONS_ENABLED && nativeCollectionPlan) ||
        (MG_NATIVE_COLLECTIONS_TEXT_BUILDER_ENABLED &&
          nativeCollectionPlan.version === 2)
      )
        await load({ family: 'Inter', style: 'Regular' });
      ready.push(family);
      familyText.forEach(id => usedText.add(id));
      familyEffects.forEach(id => usedEffects.add(id));
    } catch (error) {
      blocked.add(family.id);
      result.errors.push(`${family.name}: ${reportError(error)}`);
      result.audit.push({
        family: family.id,
        status: 'blocked',
        reason: reportError(error),
      });
    }
  }
  if (
    ((MG_FROZEN_SOURCE_LINE_ENABLED && frozenSourcePlans?.length) ||
      (MG_GRADIENT_ROLES_ENABLED && gradientRolesScope) ||
      (MG_TEXT_THICKNESS_ENABLED && textThicknessScope) ||
      (MG_RICH_TEXT_ENABLED && richTextScope) ||
      (MG_SVG_SIZING_ENABLED && svgSizingScope) ||
      (MG_ABSOLUTE_START_ENABLED && absoluteStartScope)) &&
    result.errors.length
  )
    return result;
  if (!ready.length) return result;
  if (MG_TEXT_THICKNESS_ENABLED && textThicknessScope) {
    try {
      async function inspectThickness(tree, key) {
        if (textThicknessPlans.has(tree)) {
          const node = owned.get(key);
          if (node) {
            await loadNodeFonts(node);
            mgNativeTextThicknessPlan(node, textThicknessPlans.get(tree));
          }
        }
        for (const child of tree.children || [])
          await inspectThickness(child, `${key}/${child.id || child.key}`);
      }
      for (const family of ready)
        for (const variant of family.variants)
          await inspectThickness(
            variant.tree,
            `family/${family.id}/variant/${variant.id}`
          );
    } catch (error) {
      result.errors.push(reportError(error));
      result.audit.push({
        status: 'blocked-text-thickness-preflight',
        reason: reportError(error),
      });
      return result;
    }
  }
  if (MG_RICH_TEXT_ENABLED && richTextScope) {
    try {
      if (typeof mgRichText === 'undefined')
        throw new Error('Rich TEXT capability was not compiled.');
      const styleDoc = {
        ...doc,
        styles: {
          text: [...usedText].map(id => textSpecs.get(id)),
          effect: [...usedEffects].map(id => effectSpecs.get(id)),
        },
      };
      if (
        typeof MG_CONNECTOR_RICH_SOURCE_VALIDATION === 'undefined' ||
        MG_CONNECTOR_RICH_SOURCE_VALIDATION
      )
        mgRichSourceStylePreflight(styleDoc);
      // Nonzero paragraph indentation is a bounded plain TEXT profile only.
      // Rich ownership does not yet migrate paragraph formatting signatures.
      function checkRichParagraphs(tree, key) {
        if (tree.textRuns !== undefined) {
          const node = owned.get(key);
          if ((node?.paragraphIndent ?? 0) !== 0)
            throw new Error(
              'Rich paragraph indent edit requires explicit migration.'
            );
          if (node) richParagraphNodes.push(node);
          for (const run of tree.textRuns) {
            richParagraphStyles.add(run.textStyle);
            const spec = textSpecs.get(run.textStyle);
            if (
              Object.values(spec.values).some(
                value => (value.paragraphIndent ?? 0) !== 0
              )
            )
              throw new Error(
                'Nonzero paragraphIndent is restricted to plain TEXT styles.'
              );
          }
        }
        for (const child of tree.children || [])
          checkRichParagraphs(child, `${key}/${child.id || child.key}`);
      }
      for (const family of ready)
        for (const variant of family.variants)
          checkRichParagraphs(
            variant.tree,
            `family/${family.id}/variant/${variant.id}`
          );
      await preflightMangroveAssets(
        styleDoc,
        [...usedText],
        usedEffects.size > 0
      );
      const priorStyles = new Map(
        (await figma.getLocalTextStylesAsync()).map(style => [
          mgReadIdentity(style, 'mgStyleId'),
          style,
        ])
      );
      for (const key of richParagraphStyles)
        if ((priorStyles.get(key)?.paragraphIndent ?? 0) !== 0)
          throw new Error(
            'Existing rich style paragraph indent requires explicit migration.'
          );
      if (typeof figma.getFontFamilyVariationAxes !== 'function')
        throw new Error(
          'Rich text requires native font-axis discovery before import.'
        );
      const requestedFonts = [
        { family: 'Inter', style: 'Regular' },
        ...[...usedText].map(id => textSpecs.get(id).values[brandId].fontName),
      ];
      let fontInventory = available;
      const unresolvedDefaults = requestedFonts.some(input => {
        const tags = figma.getFontFamilyVariationAxes(input.family);
        return (
          Array.isArray(tags) &&
          tags.length > 0 &&
          !available.some(
            entry =>
              entry.fontName.family === input.family &&
              entry.fontName.style === input.style &&
              entry.fontName.variationSettings &&
              tags.every(tag =>
                Object.hasOwn(entry.fontName.variationSettings, tag)
              )
          )
        );
      });
      if (unresolvedDefaults) {
        if (
          typeof mgResolveNamedFontDefaults !== 'function' ||
          typeof mgAssertExperimentOperationTarget !== 'function'
        )
          throw new Error(
            'Rich native default axes are unresolved; guarded font preparation is required.'
          );
        result.fontPreparation = await mgResolveNamedFontDefaults(
          figma,
          requestedFonts,
          mgAssertExperimentOperationTarget
        );
        mgAssertExperimentOperationTarget();
        const preparation = result.fontPreparation;
        if (
          preparation.errors.length ||
          preparation.residualNodeIds.length ||
          preparation.unverifiedRemovalNodeIds.length ||
          !preparation.recordedSceneExact ||
          !preparation.recordedAssetsExact
        )
          throw new Error(
            `Named font preparation failed: ${preparation.errors.join('; ')}`
          );
        fontInventory = preparation.resolvedFonts.map(entry => ({
          fontName: entry.fontName,
        }));
      }
      const concreteFont = input =>
        mgRichText.resolveFontInput(
          input,
          fontInventory,
          figma.getFontFamilyVariationAxes(input.family)
        );
      const projected = new Map();
      for (const id of usedText) {
        const spec = textSpecs.get(id);
        const existing = priorStyles.get(id);
        projected.set(id, {
          key: id,
          pending: !existing,
          style: {
            type: 'TEXT',
            id: existing?.id ?? null,
            fontName: concreteFont(spec.values[brandId].fontName),
          },
        });
      }
      const byNativeId = new Map(
        [...variables.values()].map(entry => [entry.id, entry])
      );
      function nativeColor(entry, modeId, seen = new Set()) {
        if (!entry || entry.resolvedType !== 'COLOR' || seen.has(entry.id))
          throw new Error(
            'Rich COLOR alias is missing, wrong typed or cyclic.'
          );
        seen.add(entry.id);
        const value = entry.valuesByMode[modeId];
        return value?.type === 'VARIABLE_ALIAS'
          ? nativeColor(byNativeId.get(value.id), modeId, seen)
          : value;
      }
      const readState = node => mgReadIdentity(node, 'mgRichTextRunsV1');
      const writeState = (node, value) =>
        mgWriteIdentity(node, 'mgRichTextRunsV1', value);
      richContext = {
        figma,
        deferredStyles: true,
        modeIds: collection.modes.map(item => item.modeId),
        creationFont: concreteFont({ family: 'Inter', style: 'Regular' }),
        resolveStyle: id => projected.get(id),
        readState,
        writeState,
        resolveColor: key => {
          const entry = variable(key, 'COLOR');
          return {
            key,
            variable: entry,
            values: Object.fromEntries(
              collection.modes.map(item => [
                item.modeId,
                nativeColor(entry, item.modeId),
              ])
            ),
          };
        },
      };
      async function prepareTree(tree, key) {
        if (tree.textRuns !== undefined) {
          const richSpec = { ...tree, id: key };
          // The complete source-line group has already passed the separate guard.
          // Its metadata is not a rich-text style or a node property.
          if (
            MG_FROZEN_SOURCE_LINE_ENABLED &&
            Object.hasOwn(richSpec, 'sourceLine')
          ) {
            if (
              !frozenSourcePlans?.some(
                plan =>
                  plan.key === key && plan.characters === richSpec.characters
              )
            )
              throw new Error(
                'Frozen source lines require exact guarded source plans.'
              );
            delete richSpec.sourceLine;
          }
          richTextPlans.set(
            tree,
            await mgRichText.prepare(
              richSpec,
              richContext,
              owned.get(key) || null
            )
          );
        }
        for (const child of tree.children || [])
          await prepareTree(child, `${key}/${child.id || child.key}`);
      }
      for (const family of ready)
        for (const variant of family.variants)
          await prepareTree(
            variant.tree,
            `family/${family.id}/variant/${variant.id}`
          );
    } catch (error) {
      result.errors.push(reportError(error));
      result.audit.push({
        status: 'blocked-rich-text-preflight',
        reason: reportError(error),
      });
      return result;
    }
  }
  // Named-font and pure source preparation may await. Refuse newly edited
  // frozen copies before the first permanent style/image/scene phase. This
  // does not promise a transaction against edits after this last guard.
  if (
    MG_FROZEN_SOURCE_LINE_ENABLED &&
    !(await checkFrozenSourceLines('before-style-import'))
  )
    return result;
  if (MG_ALPHA_MASK_ENABLED && !checkAlphaMasks('before-style-import'))
    return result;
  if (
    MG_NATIVE_COLLECTIONS_TEXT_BUILDER_ENABLED &&
    nativeCollectionPlan?.version === 2
  )
    await checkNativeTextBeforeStyles();
  // Restrict effects to the recipes being prepared, avoiding unrelated updates.
  const styleDoc = {
    ...doc,
    styles: {
      text: doc.styles.text,
      effect: [...usedEffects].map(id => effectSpecs.get(id)),
    },
  };
  const styles = await importStyles(
    styleDoc,
    variables,
    brandId,
    [...usedText],
    usedEffects.size > 0
  );
  result.styles = styles;
  result.errors.push(...styles.errors);
  if (
    MG_NATIVE_COLLECTIONS_TEXT_BUILDER_ENABLED &&
    nativeCollectionPlan?.version === 2 &&
    styles.errors.length
  )
    return result;
  if (MG_NATIVE_COLLECTIONS_ENABLED && nativeCollectionPlan) {
    nativeCollectionState = mgNativeCollectionsPreflight(
      nativeCollectionPlan,
      await nativeCollectionImportSnapshot(assertNativeCollectionTarget),
      {
        readCollection: asset => {
          const value = mgReadIdentity(asset, 'mgNativeCollectionPlan');
          return value ? JSON.parse(value) : null;
        },
        readVariable: asset => mgReadIdentity(asset, 'mgId'),
      }
    );
    assertNativeCollectionTarget();
    if (
      MG_NATIVE_COLLECTIONS_TEXT_BUILDER_ENABLED &&
      nativeCollectionPlan.version === 2 &&
      nativeTextAssetSignature(nativeCollectionState) !== nativeTextAssetBefore
    )
      throw new Error(
        'Partition asset identities changed before scene construction.'
      );
    if (
      MG_NATIVE_COLLECTIONS_TEXT_BUILDER_ENABLED &&
      nativeCollectionPlan.version === 2 &&
      (await nativeTextInstanceSignature()) !== nativeTextInstanceBefore
    )
      throw new Error(
        'Partition instance main changed before scene construction.'
      );
    const currentOwned = page.findAll(node =>
      Boolean(mgReadIdentity(node, MG_KIT_KEY))
    );
    if (nativeSceneSignature(currentOwned) !== nativeSceneBefore)
      throw new Error(
        'Partition scene ownership or topology changed across preflight awaits.'
      );
    if (
      nativeCollectionState.neededCollections.length ||
      nativeCollectionState.neededVariables.length ||
      [...nativeCollectionState.neededModes.values()].some(
        modes => modes.length
      )
    )
      throw new Error('Partition assets changed before scene construction.');
    mgNativeCollectionsValidateValues(
      nativeCollectionPlan,
      nativeCollectionState
    );
    result.nativeCollections = {
      version: 1,
      ...(MG_NATIVE_COLLECTIONS_TEXT_BUILDER_ENABLED &&
      nativeCollectionPlan.version === 2
        ? { version: 2, profile: nativeCollectionPlan.profile }
        : {}),
      planId: nativeCollectionPlan.planId,
      collectionIds: Object.fromEntries(
        [...nativeCollectionState.collectionsBySourceId].map(([id, asset]) => [
          id,
          asset.id,
        ])
      ),
      modeIdsByCollectionId: Object.fromEntries(
        [...nativeCollectionState.modeIdsByCollectionId].map(([id, modes]) => [
          id,
          Object.fromEntries(modes),
        ])
      ),
      capacity: Object.fromEntries(nativeCollectionState.occupancy),
      reviewSpecimensDisabled: true,
      capability:
        MG_NATIVE_COLLECTIONS_TEXT_BUILDER_ENABLED &&
        nativeCollectionPlan.version === 2
          ? 'plain-text-instances-v1'
          : 'font-free FRAME v1 only',
    };
  }
  if (MG_SVG_SIZING_ENABLED && svgSizingScope && styles.errors.length) {
    result.audit.push({
      status: 'blocked-svg-sizing-style-import',
      reason: 'Style import failed; sized SVG scene construction refused.',
    });
    return result;
  }
  if (MG_TEXT_THICKNESS_ENABLED && textThicknessScope && styles.errors.length) {
    result.audit.push({
      status: 'blocked-text-thickness-style-import',
      reason:
        'Style import failed; underlined TEXT scene construction refused.',
    });
    return result;
  }
  const localText = new Map(
    (await figma.getLocalTextStylesAsync()).map(style => [
      mgReadIdentity(style, 'mgStyleId'),
      style,
    ])
  );
  const localEffects = new Map(
    (await figma.getLocalEffectStylesAsync()).map(style => [
      mgReadIdentity(style, 'mgStyleId'),
      style,
    ])
  );
  const failedStyleIds = new Set();
  for (const spec of [...textSpecs.values(), ...effectSpecs.values()]) {
    if (styles.errors.some(error => error.startsWith(`${spec.name}:`)))
      failedStyleIds.add(spec.id);
  }
  if (
    styles.errors.some(error => error.startsWith('Could not list text styles:'))
  )
    usedText.forEach(id => failedStyleIds.add(id));
  if (
    styles.errors.some(error =>
      error.startsWith('Could not list effect styles:')
    )
  )
    usedEffects.forEach(id => failedStyleIds.add(id));

  if (MG_RICH_TEXT_ENABLED && richTextScope) {
    try {
      if (styles.errors.length)
        throw new Error(
          'Rich scope style import failed; scene construction refused.'
        );
      for (const node of richParagraphNodes)
        if ((node.paragraphIndent ?? 0) !== 0)
          throw new Error('Rich paragraph indent changed after preflight.');
      const importedContext = {
        ...richContext,
        deferredStyles: false,
        resolveStyle: key => {
          const style = localText.get(key);
          if (
            richParagraphStyles.has(key) &&
            (style?.paragraphIndent ?? 0) !== 0
          )
            throw new Error(
              'Imported rich style paragraph indent must remain zero.'
            );
          return style ? { key, style } : undefined;
        },
      };
      for (const plan of richTextPlans.values())
        mgRichText.finalize(plan, importedContext);
    } catch (error) {
      result.errors.push(reportError(error));
      result.audit.push({
        status: 'blocked-rich-text-finalization',
        reason: reportError(error),
      });
      return result;
    }
  }

  function mark(node, key, isNew) {
    assertNativeCollectionTarget();
    if (isNew) {
      mgWriteIdentity(node, MG_KIT_KEY, key);
      owned.set(key, node);
      created.add(node.id);
      if (node.type === 'INSTANCE')
        node.findAll(() => true).forEach(child => created.add(child.id));
    } else if (!created.has(node.id)) updated.add(node.id);
    if (MG_NATIVE_COLLECTIONS_ENABLED && nativeCollectionPlan)
      mgWriteIdentity(
        node,
        'mgNativeScenePlan',
        JSON.stringify(
          MG_NATIVE_COLLECTIONS_TEXT_BUILDER_ENABLED &&
            nativeCollectionPlan.version === 2
            ? mgNativeCollectionsSceneLedger(nativeCollectionPlan)
            : { version: 1, planId: nativeCollectionPlan.planId }
        )
      );
    return node;
  }
  function matches(values, requested) {
    return Object.entries(requested).every(
      ([key, value]) => values?.[key] === value
    );
  }
  function getPropertyOwner(component) {
    return component.parent?.type === 'COMPONENT_SET'
      ? component.parent
      : component;
  }
  function ensureProperty(component, name, type, defaultValue) {
    const owner = getPropertyOwner(component);
    let map;
    try {
      map = JSON.parse(mgReadIdentity(owner, MG_KIT_PROPERTY_KEY) || '{}');
    } catch {
      throw new Error('Owned component property map is invalid.');
    }
    const definitions = owner.componentPropertyDefinitions;
    let key = map[name];
    if (key && definitions[key]?.type !== type)
      throw new Error(`Owned property ${name} was removed or changed type.`);
    if (!key) {
      key = Object.keys(definitions).find(
        item =>
          item.replace(/#[^#]+$/, '') === name &&
          definitions[item].type === type
      );
      key = key || owner.addComponentProperty(name, type, defaultValue);
      map[name] = key;
      mgWriteIdentity(owner, MG_KIT_PROPERTY_KEY, JSON.stringify(map));
    }
    return key;
  }
  function managedVisibilityReference(node, component) {
    const reference = node.componentPropertyReferences?.visible;
    if (!reference) return null;
    if (!component)
      throw new Error(
        `Cannot resolve visibility property owner at ${node.id}.`
      );
    const owner = getPropertyOwner(component);
    let map;
    try {
      map = JSON.parse(mgReadIdentity(owner, MG_KIT_PROPERTY_KEY) || '{}');
    } catch {
      throw new Error('Owned component property map is invalid.');
    }
    if (
      !map ||
      typeof map !== 'object' ||
      Array.isArray(map) ||
      !Object.values(map).includes(reference) ||
      owner.componentPropertyDefinitions[reference]?.type !== 'BOOLEAN'
    )
      throw new Error(
        `Visibility reference ${reference} at ${node.id} is not an owned BOOLEAN property. Explicit migration required.`
      );
    return reference;
  }
  function applyVisibility(spec, node, component) {
    const old = managedVisibilityReference(node, component);
    const expected = spec.visibilityProperty
      ? ensureProperty(
          component,
          spec.visibilityProperty,
          'BOOLEAN',
          spec.visible !== false
        )
      : null;
    if (old && old !== expected) {
      const references = { ...node.componentPropertyReferences };
      delete references.visible;
      node.componentPropertyReferences = references;
    }
    // Referenced main-layer writes can change the shared BOOLEAN default.
    // Compatible references own visibility. Assign source state flags only
    // after obsolete managed references have been detached.
    if (!old || old !== expected) node.visible = spec.visible !== false;
    if (expected && old !== expected)
      node.componentPropertyReferences = {
        ...(node.componentPropertyReferences || {}),
        visible: expected,
      };
  }
  function bind(node, field, name) {
    const bound = variable(name, field === 'visible' ? 'BOOLEAN' : 'FLOAT');
    const resolved = bound.resolveForConsumer(node);
    if (field === 'width' || field === 'height')
      node.resize(
        field === 'width' ? resolved.value : node.width,
        field === 'height' ? resolved.value : node.height
      );
    else
      // Opacity variables use percentages; native node properties use 0..1.
      node[field] =
        field === 'opacity'
          ? Math.max(0, Math.min(100, resolved.value)) / 100
          : resolved.value;
    node.setBoundVariable(field, bound);
  }
  function paint(node, field, name) {
    if (!name) {
      node[field] = [];
      return;
    }
    const bound = variable(name, 'COLOR');
    const color = bound.resolveForConsumer(node).value;
    const value = figma.variables.setBoundVariableForPaint(
      {
        type: 'SOLID',
        color: { r: color.r, g: color.g, b: color.b },
        opacity: color.a ?? 1,
      },
      'color',
      bound
    );
    node[field] = [value];
  }
  function setNumeric(node, field, value) {
    if (typeof value === 'string') bind(node, field, value);
    else if (typeof value === 'number') {
      node.setBoundVariable(field, null);
      node[field] = value;
    }
  }
  function applyLayout(node, layout = {}) {
    if (layout.mode && 'layoutMode' in node) {
      node.layoutMode = layout.mode;
      node.primaryAxisAlignItems =
        layout.justify || layout.primaryAlign || 'MIN';
      // Stretch is expressed through child FILL sizing, not an alignment enum.
      node.counterAxisAlignItems =
        layout.align === 'STRETCH'
          ? 'MIN'
          : layout.align || layout.counterAlign || 'MIN';
      node.clipsContent = Boolean(layout.clipsContent);
      if (layout.wrap !== undefined) node.layoutWrap = layout.wrap;
    }
    if (layout.padding) {
      setNumeric(node, 'paddingTop', layout.padding.block);
      setNumeric(node, 'paddingBottom', layout.padding.block);
      setNumeric(node, 'paddingLeft', layout.padding.inline);
      setNumeric(node, 'paddingRight', layout.padding.inline);
    }
    setNumeric(node, 'itemSpacing', layout.gap);
    setNumeric(node, 'counterAxisSpacing', layout.counterGap);
    setNumeric(node, 'minHeight', layout.minHeight);
    setNumeric(node, 'maxHeight', layout.maxHeight);
    setNumeric(node, 'minWidth', layout.minWidth);
    setNumeric(node, 'maxWidth', layout.maxWidth);
    const boundWidth =
      typeof layout.width === 'string' &&
      !['HUG', 'FILL'].includes(layout.width);
    const boundHeight =
      typeof layout.height === 'string' &&
      !['HUG', 'FILL'].includes(layout.height);
    const fixedWidth = typeof layout.width === 'number' || boundWidth;
    const fixedHeight = typeof layout.height === 'number' || boundHeight;
    const width = boundWidth
      ? variable(layout.width, 'FLOAT').resolveForConsumer(node).value
      : layout.width;
    const height = boundHeight
      ? variable(layout.height, 'FLOAT').resolveForConsumer(node).value
      : layout.height;
    const rootFill =
      node.parent?.type === 'COMPONENT_SET' && layout.width === 'FILL';
    // FILL requires an auto-layout parent. Main variants have a fixed specimen width.
    if (rootFill) node.resize(320, node.height);
    const previousHorizontal = node.layoutSizingHorizontal;
    const previousVertical = node.layoutSizingVertical;
    if (['HUG', 'FILL'].includes(layout.width))
      node.setBoundVariable('width', null);
    if (['HUG', 'FILL'].includes(layout.height))
      node.setBoundVariable('height', null);
    if (fixedWidth) node.setBoundVariable('width', null);
    if (fixedHeight) node.setBoundVariable('height', null);
    if (fixedWidth || fixedHeight) {
      node.resize(
        fixedWidth ? width : node.width,
        fixedHeight ? height : node.height
      );
      // resize fixes both axes in real Figma. Preserve an unspecified FILL/HUG
      // axis, especially for nested table rows and cells.
      if (!fixedWidth && !layout.width)
        node.layoutSizingHorizontal = previousHorizontal;
      if (!fixedHeight && !layout.height)
        node.layoutSizingVertical = previousVertical;
    }
    if (node.type === 'TEXT') {
      const wraps = layout.width === 'FILL' || fixedWidth;
      node.textAutoResize = wraps ? 'HEIGHT' : 'WIDTH_AND_HEIGHT';
      // An initially empty wrapping TEXT can retain zero width despite FILL.
      // Initialize its actual owning cross-axis allocation, then restore FILL.
      const owner = node.parent;
      if (
        layout.width === 'FILL' &&
        node.width === 0 &&
        (!layout.height || layout.height === 'HUG') &&
        node.layoutPositioning !== 'ABSOLUTE' &&
        node.minWidth == null &&
        node.maxWidth == null &&
        ['FRAME', 'COMPONENT'].includes(owner?.type) &&
        owner.layoutMode === 'VERTICAL' &&
        owner.layoutWrap !== 'WRAP' &&
        owner.counterAxisSizingMode === 'FIXED'
      ) {
        const owningWidth =
          owner.width - owner.paddingLeft - owner.paddingRight;
        if (
          Number.isFinite(owningWidth) &&
          owningWidth > 0 &&
          Number.isFinite(node.height) &&
          node.height > 0
        )
          node.resize(owningWidth, node.height);
      }
      if (wraps)
        node.layoutSizingHorizontal =
          layout.width === 'FILL' ? 'FILL' : 'FIXED';
      else node.layoutSizingHorizontal = 'HUG';
      node.layoutSizingVertical = 'HUG';
    } else {
      if (layout.width)
        node.layoutSizingHorizontal =
          fixedWidth || rootFill ? 'FIXED' : layout.width;
      if (layout.height)
        node.layoutSizingVertical = fixedHeight ? 'FIXED' : layout.height;
    }
    if (boundWidth)
      node.setBoundVariable('width', variable(layout.width, 'FLOAT'));
    if (boundHeight)
      node.setBoundVariable('height', variable(layout.height, 'FLOAT'));
  }
  function applyAbsolute(spec, node, parent) {
    const absolute = spec.absolute;
    const offsetX = variable(absolute.offsetX, 'FLOAT').resolveForConsumer(
      node
    ).value;
    const offsetY = variable(absolute.offsetY, 'FLOAT').resolveForConsumer(
      node
    ).value;
    if (
      ![parent.width, parent.height, node.width, node.height].every(
        value => Number.isFinite(value) && value > 0
      ) ||
      ![offsetX, offsetY].every(Number.isFinite)
    )
      throw new Error(
        `Absolute geometry must be finite and positive at ${node.id}.`
      );
    for (const field of ['width', 'height']) {
      const expected =
        typeof spec.layout[field] === 'string'
          ? variable(spec.layout[field], 'FLOAT').resolveForConsumer(node).value
          : spec.layout[field];
      if (
        !Number.isFinite(expected) ||
        expected <= 0 ||
        Math.abs(node[field] - expected) > 1e-6
      )
        throw new Error(
          `Native absolute ${field} did not retain requested sizing at ${node.id}.`
        );
    }
    const start = MG_ABSOLUTE_START_ENABLED && absolute.horizontal === 'START';
    const x = start ? offsetX : parent.width - node.width + offsetX;
    const y = start ? offsetY : (parent.height - node.height) / 2 + offsetY;
    if (![x, y].every(Number.isFinite))
      throw new Error(`Absolute endpoint overflow at ${node.id}.`);
    node.constraints = start
      ? { horizontal: 'MIN', vertical: 'MIN' }
      : { horizontal: 'MAX', vertical: 'CENTER' };
    node.x = x;
    node.y = y;
    if (
      Math.abs(node.x - x) > 1e-6 ||
      Math.abs(node.y - y) > 1e-6 ||
      ![node.x, node.y].every(Number.isFinite)
    )
      throw new Error(
        `Native absolute position did not retain endpoint geometry at ${node.id}.`
      );
  }
  const built = new Map();
  async function focusDecorations(spec, parent, key) {
    const roles = ['outer', 'separator'];
    if (!spec.focusRing) {
      const retained = [];
      for (const role of roles) {
        const node = owned.get(`${key}/focus/${role}`);
        if (node) {
          node.visible = false;
          mark(node, `${key}/focus/${role}`, false);
          retained.push(node);
        }
      }
      return retained;
    }
    const ring = spec.focusRing;
    if (MG_COINCIDENT_FOCUS_ENABLED && coincidentFocus.has(spec)) {
      if (parent.type !== 'COMPONENT')
        throw new Error(
          'COINCIDENT_SCALE geometry is written only on canonical Segmented masters.'
        );
      const plan = coincidentFocus.get(spec);
      parent.clipsContent = false;
      parent.itemReverseZIndex = false;
      const decorations = [];
      for (const role of roles) {
        const id = `${key}/focus/${role}`;
        let node = owned.get(id);
        if (node && node.type !== 'RECTANGLE')
          throw new Error(`Native focus outline ${id} changed type.`);
        const fresh = !node;
        node = node || figma.createRectangle();
        mark(node, id, fresh);
        if (node.parent !== parent) parent.appendChild(node);
        node.name =
          role === 'outer'
            ? 'mg-focus-ring / coloured outline'
            : 'mg-focus-ring / neutral separator';
        node.visible = true;
        node.opacity = 1;
        node.layoutPositioning = 'ABSOLUTE';
        node.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
        node.fills = [];
        await node.setEffectStyleIdAsync('');
        node.effects = [];
        node.strokeAlign = 'OUTSIDE';
        node.strokeJoin = 'MITER';
        node.resize(parent.width, parent.height);
        node.x = 0;
        node.y = 0;
        paint(
          node,
          'strokes',
          role === 'outer' ? ring.color : ring.separatorColor
        );
        bind(
          node,
          'strokeWeight',
          role === 'outer' ? ring.outerStroke : ring.offset
        );
        node.setBoundVariable('cornerRadius', null);
        for (const [field, name] of Object.entries(ring.cornerBindings))
          bind(node, field, name);
        decorations.push(node);
      }
      result.audit.push({
        nodeId: parent.id,
        status: 'native-focus-outline',
        renderer: 'COINCIDENT_SCALE',
        rectangleIds: decorations.map(node => node.id),
        geometry: {
          offset: plan.offset,
          width: plan.width,
          outerStroke: plan.outerStroke,
        },
        sourceBindings: ring,
        paintOrder: {
          itemReverseZIndex: parent.itemReverseZIndex,
          roles: roles.slice(),
        },
        outlines: decorations.map((node, index) => ({
          nodeId: node.id,
          role: roles[index],
          bounds: {
            x: node.x,
            y: node.y,
            width: node.width,
            height: node.height,
          },
          constraints: node.constraints,
          strokeWeight: node.strokeWeight,
          strokeAlign: node.strokeAlign,
          strokeJoin: node.strokeJoin,
          corners: Object.fromEntries(
            Object.keys(ring.cornerBindings).map(field => [field, node[field]])
          ),
          bindings: node.boundVariables,
        })),
        limitation:
          'Coincident SCALE outlines retain source strokes and per-corner aliases; ordinary reimport/rebuild is required when token values change. Matched raster and joined middle-focus occlusion need separate native acceptance.',
      });
      return decorations;
    }
    const number = name =>
      variable(name, 'FLOAT').resolveForConsumer(parent).value;
    const offset = number(ring.offset);
    const width = number(ring.width);
    const radius = number(ring.radius);
    const outerRadius = ring.outerRadius
      ? number(ring.outerRadius)
      : radius + offset;
    if (
      ![offset, width, radius, outerRadius].every(
        value => Number.isFinite(value) && value >= 0
      )
    )
      throw new Error(`Invalid native focus outline dimensions at ${key}`);
    parent.clipsContent = false;
    const decorations = [];
    for (const role of roles) {
      const id = `${key}/focus/${role}`;
      let node = owned.get(id);
      if (node && node.type !== 'RECTANGLE')
        throw new Error(`Native focus outline ${id} changed type.`);
      const fresh = !node;
      node = node || figma.createRectangle();
      mark(node, id, fresh);
      if (node.parent !== parent) parent.appendChild(node);
      node.name =
        role === 'outer'
          ? 'mg-focus-ring / coloured outline'
          : 'mg-focus-ring / neutral separator';
      node.visible = true;
      node.layoutPositioning = 'ABSOLUTE';
      node.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' };
      node.fills = [];
      await node.setEffectStyleIdAsync('');
      node.effects = [];
      node.strokeAlign = 'OUTSIDE';
      if (role === 'outer') {
        node.resize(parent.width + offset * 2, parent.height + offset * 2);
        node.x = -offset;
        node.y = -offset;
        paint(node, 'strokes', ring.color);
        bind(node, 'strokeWeight', ring.width);
        if (ring.outerRadius) bind(node, 'cornerRadius', ring.outerRadius);
        else {
          node.setBoundVariable('cornerRadius', null);
          node.cornerRadius = outerRadius;
        }
      } else {
        node.resize(parent.width, parent.height);
        node.x = 0;
        node.y = 0;
        paint(node, 'strokes', ring.separatorColor);
        bind(node, 'strokeWeight', ring.offset);
        bind(node, 'cornerRadius', ring.radius);
      }
      decorations.push(node);
    }
    result.audit.push({
      nodeId: parent.id,
      status: 'native-focus-outline',
      rectangleIds: decorations.map(node => node.id),
      geometry: { offset, width, radius, outerRadius },
      sourceBindings: ring,
      limitation:
        'Absolute outline offsets follow source values at build time; stretch constraints preserve resizing. Rebuild if the focus offset changes.',
    });
    return decorations;
  }
  async function treeNode(spec, parent, component, key, rootNode) {
    if (MG_SVG_ENABLED && spec.type === 'SVG') {
      const plan = svgPlans.get(spec);
      let node = owned.get(key);
      const fresh = !node;
      if (fresh) {
        try {
          node = figma.createNodeFromSvg(plan.importedMarkup);
          if (
            node.type !== 'FRAME' ||
            !Number.isFinite(node.width) ||
            node.width <= 0 ||
            !Number.isFinite(node.height) ||
            node.height <= 0 ||
            (node.width !== plan.width &&
              node.width !== Math.fround(plan.width)) ||
            (node.height !== plan.height &&
              node.height !== Math.fround(plan.height))
          )
            throw new Error(
              'native SVG importer did not preserve the explicit viewBox viewport. Verify native SVG acceptance before using this asset; path-bound scaling is unsupported.'
            );
          for (const field of Object.keys(spec.svg.monochrome || {}))
            mgSvgMonochrome(node, field);
          if (MG_SVG_SIZING_ENABLED && plan.sizing)
            mgSvgSizingNativePlan(node, plan.sizing, variable);
          plan.sourceOpacity = node.opacity;
        } catch (error) {
          if (node && !node.removed) node.remove();
          throw new Error(
            `SVG ${plan.assetId} import failed: ${reportError(error)}`
          );
        }
      }
      mark(node, key, fresh);
      const descendants = node.findAll(() => true);
      for (const child of descendants)
        (fresh ? created : updated).add(child.id);
      if (node.parent !== parent) parent.appendChild(node);
      node.name = spec.name || spec.id;
      applyVisibility(spec, node, component);
      // resize only changes a frame viewport. rescale also scales source paths,
      // stroke widths and positions. Equal-size repeats perform no rescale.
      if (MG_SVG_SIZING_ENABLED && plan.sizing) {
        const sizingResult = mgApplySvgSizing(
          mgSvgSizingNativePlan(node, plan.sizing, variable)
        );
        result.audit.push({
          nodeId: node.id,
          status: 'source-svg-sizing',
          ...sizingResult,
        });
      } else {
        let scale = spec.layout.width / node.width;
        while (scale < 0.01) {
          node.rescale(0.01);
          scale /= 0.01;
        }
        if (Math.abs(scale - 1) > 1e-12) node.rescale(scale);
        node.layoutSizingHorizontal = node.layoutSizingVertical = 'FIXED';
      }
      if (spec.position) {
        if (parent.layoutMode !== 'NONE') node.layoutPositioning = 'ABSOLUTE';
        node.x = spec.position.x;
        node.y = spec.position.y;
      }
      for (const field of ['opacity', 'visible']) {
        if (spec.bindings?.[field]) bind(node, field, spec.bindings[field]);
        else node.setBoundVariable(field, null);
      }
      if (!spec.bindings?.opacity) node.opacity = plan.sourceOpacity;
      for (const [field, name] of Object.entries(spec.svg.monochrome || {})) {
        const bound = variable(name, 'COLOR');
        for (const child of descendants) {
          if (!Array.isArray(child[field])) continue;
          child[field] = child[field].map(paint =>
            paint.type === 'SOLID' &&
            paint.visible !== false &&
            (paint.opacity ?? 1) > 0
              ? figma.variables.setBoundVariableForPaint(paint, 'color', bound)
              : paint
          );
        }
      }
      mgWriteIdentity(
        node,
        MG_SVG_KEY,
        JSON.stringify({
          ...(MG_SVG_SIZING_ENABLED && plan.sizing
            ? { sizing: plan.sizing }
            : {}),
          assetId: plan.assetId,
          hash: plan.hash,
          markup: plan.markup,
          paintPolicy: plan.paintPolicy,
          sourceOpacity: plan.sourceOpacity,
          topology: mgSvgTopology(node),
          geometry: mgSvgGeometry(node),
        })
      );
      return node;
    }
    let node = rootNode || owned.get(key);
    const fresh = !node;
    if (node && !rootNode && node.type !== spec.type)
      throw new Error(
        `Node type changed at ${key}. Preserve the old node and resolve the recipe.`
      );
    if (!node) {
      if (spec.type === 'TEXT') node = figma.createText();
      else if (spec.type === 'FRAME') node = figma.createFrame();
      else if (spec.type === 'ELLIPSE') node = figma.createEllipse();
      else {
        const dependency = built.get(spec.family);
        const variant = dependency?.variants.find(item =>
          matches(item.recipe.properties, spec.variant || {})
        );
        if (!variant)
          throw new Error(`Dependency ${spec.family} is not available.`);
        node = variant.node.createInstance();
      }
      mark(node, key, true);
    } else mark(node, key, false);
    if (node.type === 'TEXT') await loadNodeFonts(node);
    if (node.parent !== parent) parent.appendChild(node);
    // A variant name must remain valid while reading its set's property definitions.
    if (!rootNode) node.name = spec.name || spec.id || spec.type;
    applyVisibility(spec, node, component);
    if (MG_ABSOLUTE_ENABLED && spec.absolute)
      node.layoutPositioning = 'ABSOLUTE';
    if (
      spec.type === 'TEXT' &&
      !(MG_RICH_TEXT_ENABLED && richTextPlans.has(spec))
    ) {
      const style = localText.get(spec.textStyle);
      if (!style)
        throw new Error(`Text style ${spec.textStyle} did not import.`);
      await figma.loadFontAsync(style.fontName);
      if (MG_DIRECT_TEXT_ENABLED && directText.has(spec)) {
        await node.setTextStyleIdAsync('');
        node.fontName = { ...style.fontName };
        node.fontSize = style.fontSize;
        node.lineHeight = { ...style.lineHeight };
        // Copy the imported template, including native defaults, without
        // reattaching the shared style that couples linked state range paints.
        for (const field of [
          'letterSpacing',
          'paragraphSpacing',
          'paragraphIndent',
          'textCase',
        ])
          if (style[field] !== undefined)
            node[field] =
              typeof style[field] === 'object'
                ? { ...style[field] }
                : style[field];
      } else await node.setTextStyleIdAsync(style.id);
      node.characters = spec.characters || '';
      node.textAlignHorizontal = spec.textAlign || 'LEFT';
    }
    if (spec.type !== 'INSTANCE') {
      if (spec.type === 'ELLIPSE')
        node.arcData =
          MG_ARC_ENABLED && spec.arcData
            ? mgEllipseArcPlan(spec)
            : { startingAngle: 0, endingAngle: 2 * Math.PI, innerRadius: 0 };
      if (spec.layout?.mode && 'layoutMode' in node)
        node.layoutMode = spec.layout.mode;
      if ('fills' in node && !(MG_RICH_TEXT_ENABLED && richTextPlans.has(spec)))
        paint(node, 'fills', spec.fill);
      if (imagePlans.has(spec)) {
        const image = imagePlans.get(spec);
        if (!imageHashes.has(image.assetId))
          imageHashes.set(image.assetId, figma.createImage(image.bytes).hash);
        node.fills = [
          {
            type: 'IMAGE',
            imageHash: imageHashes.get(image.assetId),
            scaleMode: image.scaleMode,
          },
        ];
        node.clipsContent = true;
      }
      if (gradientPlans.has(spec)) {
        node.fills = gradientPlans.get(spec).layers.map(layer => ({
          type: 'GRADIENT_LINEAR',
          gradientTransform: layer.transform,
          gradientStops: layer.stops.map(stop => {
            const role = variable(stop.color, 'COLOR');
            const color = role.resolveForConsumer(node).value;
            return {
              position: stop.position,
              color: { r: color.r, g: color.g, b: color.b, a: color.a ?? 1 },
              boundVariables: {
                color: { type: 'VARIABLE_ALIAS', id: role.id },
              },
            };
          }),
        }));
      }
      if ('strokes' in node) paint(node, 'strokes', spec.stroke);
      node.strokeAlign = spec.strokeAlign || 'INSIDE';
      if ('strokesIncludedInLayout' in node && node.layoutMode !== 'NONE')
        node.strokesIncludedInLayout = spec.strokesIncludedInLayout !== false;
      for (const oldField of Object.keys(node.boundVariables || {})) {
        if (
          allowedBindings.has(oldField) &&
          !(oldField in (spec.bindings || {}))
        )
          node.setBoundVariable(oldField, null);
      }
      for (const [field, name] of Object.entries(spec.bindings || {}))
        bind(node, field, name);
      if (spec.effectStyle) {
        const style = localEffects.get(spec.effectStyle);
        if (!style)
          throw new Error(`Effect style ${spec.effectStyle} did not import.`);
        await node.setEffectStyleIdAsync(style.id);
        // Spread on frames/components requires a visible fill and clipping.
        if (
          ['FRAME', 'COMPONENT'].includes(node.type) &&
          typeof spec.layout?.clipsContent !== 'boolean'
        )
          node.clipsContent = true;
      } else {
        await node.setEffectStyleIdAsync('');
        node.effects = [];
      }
      if (spec.textProperty)
        node.componentPropertyReferences = {
          ...(node.componentPropertyReferences || {}),
          characters: ensureProperty(
            component,
            spec.textProperty,
            'TEXT',
            spec.characters || ''
          ),
        };
    } else {
      const dependency = built.get(spec.family);
      const variant = dependency.variants.find(item =>
        matches(item.recipe.properties, spec.variant || {})
      );
      const currentMain = await node.getMainComponentAsync();
      if (currentMain?.id !== variant.node.id) node.swapComponent(variant.node);
      await loadNodeFonts(node);
      const overrides = {};
      for (const [name, value] of Object.entries(spec.overrides || {})) {
        const property = Object.keys(node.componentProperties).find(
          item => item.replace(/#[^#]+$/, '') === name
        );
        if (!property)
          throw new Error(`Instance property ${name} is unavailable.`);
        overrides[property] = value;
      }
      if (Object.keys(overrides).length) node.setProperties(overrides);
      // These are primary nested instances in the owned main component.
      // Review descendants inherit exposure; do not write their inherited flag.
      node.isExposedInstance = Boolean(spec.expose);
      // Explicit instance bindings override only the declared inherited fields.
      for (const [field, name] of Object.entries(spec.bindings || {}))
        bind(node, field, name);
      // Contextual CSS colours stay on the native instance; geometry and identity
      // continue to come from its source component. Never detach nested actions.
      if (spec.appearance) {
        if (spec.appearance.fill) paint(node, 'fills', spec.appearance.fill);
        if (spec.appearance.stroke)
          paint(node, 'strokes', spec.appearance.stroke);
        if (spec.appearance.labelFill) {
          const labels = node
            .findAllWithCriteria({ types: ['TEXT'] })
            .filter(
              child =>
                child.componentPropertyReferences?.characters?.replace(
                  /#[^#]+$/,
                  ''
                ) === 'Label'
            );
          if (labels.length !== 1)
            throw new Error(
              'Contextual label fill requires exactly one Label text node.'
            );
          paint(labels[0], 'fills', spec.appearance.labelFill);
          if (fresh) created.add(labels[0].id);
          else updated.add(labels[0].id);
        }
      }
    }
    applyLayout(node, spec.layout);
    // Apply wrapping and decoration after character property references and
    // sizing. Shared styles carry them for editable consumer text as well.
    if (MG_RICH_TEXT_ENABLED && richTextPlans.has(spec)) {
      const audit = await mgRichText.apply(richTextPlans.get(spec), node);
      node.textAlignHorizontal = spec.textAlign || 'LEFT';
      if (spec.textWrap !== undefined) node.textWrapStyle = spec.textWrap;
      result.audit.push({
        ...audit,
        status: 'rich-text-applied',
        identity: key,
      });
    } else if (spec.type === 'TEXT') {
      if (spec.textWrap !== undefined) node.textWrapStyle = spec.textWrap;
      node.textDecoration =
        spec.textDecoration !== undefined
          ? spec.textDecoration
          : localText.get(spec.textStyle)?.textDecoration || 'NONE';
      if (
        spec.textDecorationOffset !== undefined &&
        node.textDecoration === 'UNDERLINE'
      )
        node.textDecorationOffset = { ...spec.textDecorationOffset };
      if (MG_TEXT_THICKNESS_ENABLED && textThicknessPlans.has(spec))
        mgApplyTextThickness(
          mgNativeTextThicknessPlan(node, textThicknessPlans.get(spec))
        );
      if (MG_DIRECT_TEXT_ENABLED && directText.has(spec)) {
        // Typed aliases follow all literals, property references and layout.
        // This ordering is proven only by the isolated native TOC diagnostic.
        for (const [field, native] of Object.entries(directText.get(spec)))
          node.setBoundVariable(field, native);
        paint(node, 'fills', spec.fill);
        node.setRangeFills(0, node.characters.length, node.fills);
      }
    }
    if (spec.labelSizing === 'FILL') {
      const labels = node
        .findAllWithCriteria({ types: ['TEXT'] })
        .filter(
          child =>
            child.componentPropertyReferences?.characters?.replace(
              /#[^#]+$/,
              ''
            ) === 'Label'
        );
      if (labels.length !== 1)
        throw new Error(
          'Instance labelSizing requires exactly one Label text node.'
        );
      labels[0].textAutoResize = 'HEIGHT';
      labels[0].layoutSizingHorizontal = 'FILL';
      labels[0].layoutSizingVertical = 'HUG';
      labels[0].textAlignHorizontal = 'CENTER';
    }
    if (
      spec.effectStyle &&
      ['FRAME', 'COMPONENT'].includes(node.type) &&
      typeof spec.layout?.clipsContent !== 'boolean'
    )
      node.clipsContent = true;
    if (spec.type === 'FRAME') {
      const expected = [];
      for (const child of spec.children || []) {
        const childKey = `${key}/${child.id || child.key}`;
        const childNode = await treeNode(child, node, component, childKey);
        expected.push(childNode);
      }
      const decorations = await focusDecorations(spec, node, key);
      expected.unshift(...decorations);
      expected.forEach((child, index) => {
        if (node.children[index] !== child) node.insertChild(index, child);
      });
      // ABSOLUTE excludes children from layout before dimensions are read.
      // Position only after child construction/reordering has settled the parent.
      if (MG_ABSOLUTE_ENABLED)
        for (const child of spec.children || []) {
          if (child.absolute)
            applyAbsolute(
              child,
              owned.get(`${key}/${child.id || child.key}`),
              node
            );
        }
      if (MG_ALPHA_MASK_ENABLED && alphaMaskOwners.has(spec)) {
        const record = alphaMaskOwners.get(spec);
        mgAlphaMaskDocumentValues(record.plan, doc);
        mgAlphaMaskNativeValues(
          record.plan,
          collection.modes.map(item => item.modeId),
          alphaMaskResolve
        );
        mgApplyAlphaMask(
          mgNativeAlphaMaskPlan(
            owned.get(record.keys.mask),
            node,
            owned.get(record.keys.content),
            record.plan,
            alphaMaskIdentity(record)
          )
        );
      }
      // Retain user-owned additions. Report obsolete importer-owned children for review.
      for (const child of node.children) {
        if (mgReadIdentity(child, MG_KIT_KEY) && !expected.includes(child))
          result.audit.push({
            nodeId: child.id,
            status: 'retained-obsolete-child',
            key: mgReadIdentity(child, MG_KIT_KEY),
          });
      }
    }
    if (
      spec.type === 'FRAME' &&
      spec.position &&
      parent.layoutMode === 'NONE'
    ) {
      node.x = spec.position.x;
      node.y = spec.position.y;
    }
    return node;
  }
  const surviving = ready.filter(family => {
    let failure;
    for (const variant of family.variants)
      treeWalk(variant.tree, tree => {
        if (
          tree.textStyle &&
          (MG_RICH_TEXT_ENABLED && tree.textRuns !== undefined
            ? tree.textRuns.some(
                run =>
                  !localText.has(run.textStyle) ||
                  failedStyleIds.has(run.textStyle)
              )
            : !localText.has(tree.textStyle) ||
              failedStyleIds.has(tree.textStyle))
        )
          failure = `Missing text style ${tree.textStyle}`;
        if (
          tree.effectStyle &&
          (!localEffects.has(tree.effectStyle) ||
            failedStyleIds.has(tree.effectStyle))
        )
          failure = `Missing effect style ${tree.effectStyle}`;
      });
    if (failure) {
      blocked.add(family.id);
      result.errors.push(`${family.name}: ${failure}`);
      result.audit.push({
        family: family.id,
        status: 'blocked',
        reason: failure,
      });
    }
    return !failure;
  });
  if (!surviving.length) return result;
  function container(key, name, width) {
    let frame = owned.get(key);
    if (frame && frame.type !== 'FRAME')
      throw new Error(`${name} has changed type.`);
    const fresh = !frame;
    frame = frame || figma.createFrame();
    mark(frame, key, fresh);
    const parent =
      typeof mgLayoutContainerParent === 'function'
        ? mgLayoutContainerParent(key)
        : page;
    if (frame.parent !== parent) parent.appendChild(frame);
    frame.name =
      organized &&
      mgReadIdentity(owned.get('layout/start'), 'mgLayoutVersion') === '2'
        ? `Operational staging / ${key}`
        : name;
    frame.layoutMode = 'VERTICAL';
    frame.resize(organized ? frame.width : width, Math.max(frame.height, 100));
    frame.primaryAxisSizingMode = 'AUTO';
    frame.counterAxisSizingMode = 'FIXED';
    frame.paddingTop =
      frame.paddingBottom =
      frame.paddingLeft =
      frame.paddingRight =
        32;
    frame.itemSpacing = 32;
    frame.clipsContent = false;
    frame.fills = [];
    if (fresh) {
      const right = Math.max(
        0,
        ...page.children
          .filter(item => item !== frame)
          .map(item => item.x + item.width)
      );
      frame.x = right + 160;
      frame.y = 160;
    }
    if (MG_NATIVE_COLLECTIONS_ENABLED && nativeCollectionState)
      mgNativeCollectionsApplyModes(frame, nativeCollectionState, brandId, [
        ...nativeCollectionPlan.collectionById.keys(),
      ]);
    else if (frame.explicitVariableModes[collection.id] !== mode.modeId)
      frame.setExplicitVariableModeForCollection(collection, mode.modeId);
    return frame;
  }
  const main = container('main', 'Mangrove / Main components', 1200);
  const review = container('review', 'Mangrove / Review', 800);
  result.reviewRootId = review.id;
  paint(review, 'fills', 'color/neutral-0');

  for (const family of surviving) {
    if (dependencies(family).some(id => !built.has(id))) {
      result.errors.push(`${family.name}: a dependent family did not build.`);
      continue;
    }
    const familyNew = [];
    try {
      const familyKey = `family/${family.id}`;
      let set = owned.get(familyKey);
      let pendingFirst;
      if (!set) {
        pendingFirst = figma.createComponent();
        const first = family.variants[0];
        pendingFirst.name = first.name;
        mark(pendingFirst, `${familyKey}/variant/${first.id}`, true);
        familyNew.push(pendingFirst);
        main.appendChild(pendingFirst);
        set = figma.combineAsVariants([pendingFirst], main);
        mark(set, familyKey, true);
        familyNew.push(set);
      } else mark(set, familyKey, false);
      set.name = family.name;
      set.description =
        doc.kitGuidance?.families?.find(item => item.id === family.id)
          ?.description ||
        family.description ||
        `Reusable ${family.name} controls. Source: ${sourceLabel(family)}`;
      set.layoutMode = 'NONE';
      set.clipsContent = false;
      set.fills = [];
      for (const [name, property] of Object.entries(
        family.optionalProperties || {}
      ))
        ensureProperty(set, name, 'BOOLEAN', property.defaultValue);
      const variants = [];
      for (const recipe of family.variants) {
        const key = `${familyKey}/variant/${recipe.id}`;
        let component = owned.get(key);
        if (component && component.type !== 'COMPONENT')
          throw new Error(`Variant ${key} changed type.`);
        if (!component) {
          component = figma.createComponent();
          mark(component, key, true);
          familyNew.push(component);
        }
        if (component.parent !== set) set.appendChild(component);
        component.name =
          recipe.name ||
          Object.entries(recipe.properties)
            .map(([name, value]) => `${name}=${value}`)
            .join(', ');
        component.description =
          doc.kitGuidance?.families?.find(item => item.id === family.id)
            ?.description ||
          family.description ||
          `Source: ${sourceLabel(family)}`;
        await treeNode(recipe.tree, set, component, key, component);
        // Tree labels are useful internally; the root name must encode variants.
        component.name =
          recipe.name ||
          Object.entries(recipe.properties)
            .map(([name, value]) => `${name}=${value}`)
            .join(', ');
        variants.push({ node: component, recipe });
      }
      // Scoped connector batches retain prior variants. Include every retained
      // component in the main grid so later batches cannot overlap them.
      const layoutVariants = set.children.filter(
        node => node.type === 'COMPONENT'
      );
      if (typeof mgLayoutGrid === 'function') {
        mgLayoutGrid(set, family);
      } else {
        const columns = Math.min(3, layoutVariants.length);
        const cellWidth =
          Math.max(...layoutVariants.map(node => node.width)) + 48;
        const cellHeight =
          Math.max(...layoutVariants.map(node => node.height)) + 48;
        layoutVariants.forEach((node, index) => {
          node.x = 24 + (index % columns) * cellWidth;
          node.y = 24 + Math.floor(index / columns) * cellHeight;
        });
        set.resizeWithoutConstraints(
          24 + columns * cellWidth,
          24 + Math.ceil(layoutVariants.length / columns) * cellHeight
        );
      }
      built.set(family.id, { set, variants });
      result.families.push({
        id: family.id,
        setId: set.id,
        variantIds: variants.map(item => ({
          id: item.recipe.id,
          nodeId: item.node.id,
        })),
        propertyIds: Object.keys(set.componentPropertyDefinitions),
      });
      result.audit.push({
        family: family.id,
        status: 'built',
        variantCount: variants.length,
      });
    } catch (error) {
      result.errors.push(`${family.name}: ${reportError(error)}`);
      result.audit.push({
        family: family.id,
        status: 'failed',
        reason: reportError(error),
        existingChangesRetained: !familyNew.some(
          node => node.type === 'COMPONENT_SET'
        ),
      });
      // Remove only objects created by this failed family, never existing components.
      for (const node of familyNew.reverse()) {
        if (!node.removed) {
          if ('findAll' in node)
            node
              .findAll(() => true)
              .forEach(child => {
                created.delete(child.id);
                updated.delete(child.id);
              });
          created.delete(node.id);
          updated.delete(node.id);
          node.remove();
        }
      }
      for (const [key, node] of owned)
        if (node.removed) {
          owned.delete(key);
          created.delete(node.id);
          updated.delete(node.id);
        }
    }
  }

  const reviewPadding = 8;
  async function reviewFrame(key, name, parent, width) {
    let frame = owned.get(key);
    const fresh = !frame;
    if (frame && frame.type !== 'FRAME')
      throw new Error(`Review node ${key} changed type.`);
    frame = frame || figma.createFrame();
    mark(frame, key, fresh);
    const destination =
      typeof mgLayoutReviewParent === 'function'
        ? mgLayoutReviewParent(key, parent)
        : parent;
    if (frame.parent !== destination) destination.appendChild(frame);
    frame.name = name;
    frame.layoutMode = 'VERTICAL';
    frame.resize(width, Math.max(frame.height, 40));
    frame.primaryAxisSizingMode = 'AUTO';
    frame.counterAxisSizingMode = 'FIXED';
    frame.paddingTop =
      frame.paddingBottom =
      frame.paddingLeft =
      frame.paddingRight =
        reviewPadding;
    frame.itemSpacing = 12;
    frame.clipsContent = false;
    frame.fills = [];
    return frame;
  }
  async function reviewLabel(key, text, parent) {
    let node = owned.get(key);
    const fresh = !node;
    if (node && node.type !== 'TEXT')
      throw new Error(`Review label ${key} changed type.`);
    node = node || figma.createText();
    mark(node, key, fresh);
    await loadNodeFonts(node);
    if (node.parent !== parent) parent.appendChild(node);
    const fontFamily = variable('font-family/text', 'STRING');
    const font = {
      family: fontFamily.resolveForConsumer(parent).value,
      style: 'Regular',
    };
    await load(font);
    node.fontName = font;
    node.setBoundVariable('fontFamily', fontFamily);
    bind(node, 'fontSize', 'font-size/300');
    node.textAutoResize = 'HEIGHT';
    node.characters = text;
    node.resize(
      Math.max(1, parent.width - parent.paddingLeft - parent.paddingRight),
      Math.max(1, node.height)
    );
    node.layoutSizingHorizontal = 'FILL';
    node.layoutSizingVertical = 'HUG';
    node.name = text;
    paint(node, 'fills', 'color/neutral-900');
    return node;
  }
  async function intrinsicReviewGeometry(instance, master) {
    const current = await instance.getMainComponentAsync();
    if (current?.id !== master.id)
      throw new Error(
        'Variant review geometry refresh refused a changed consumer variant.'
      );
    const horizontal = master.layoutSizingHorizontal;
    const vertical = master.layoutSizingVertical;
    if (
      !['HUG', 'FIXED'].includes(horizontal) ||
      !['HUG', 'FIXED'].includes(vertical) ||
      !Number.isFinite(master.width) ||
      master.width <= 0 ||
      !Number.isFinite(master.height) ||
      master.height <= 0
    )
      throw new Error(
        'Variant review master sizing must be HUG or positive fixed geometry.'
      );
    instance.setBoundVariable('width', null);
    instance.setBoundVariable('height', null);
    if (horizontal === 'FIXED' || vertical === 'FIXED')
      instance.resize(
        horizontal === 'FIXED' ? master.width : instance.width,
        vertical === 'FIXED' ? master.height : Math.max(1, instance.height)
      );
    instance.layoutSizingHorizontal = horizontal;
    instance.layoutSizingVertical = vertical;
    if (
      instance.layoutSizingHorizontal !== horizontal ||
      instance.layoutSizingVertical !== vertical ||
      (horizontal === 'FIXED' &&
        (!Number.isFinite(instance.width) ||
          Math.abs(instance.width - master.width) > 0.01)) ||
      (vertical === 'FIXED' && Math.abs(instance.height - master.height) > 0.01)
    )
      throw new Error(
        'Native variant review sizing did not retain the requested geometry.'
      );
  }
  for (const [id, family] of built) {
    if (MG_NATIVE_COLLECTIONS_ENABLED && nativeCollectionPlan) continue;
    if (!chosen.has(id)) continue;
    try {
      const reviewOptions = families.get(id)?.review || {};
      const section = await reviewFrame(
        `review/${id}`,
        family.set.name,
        review,
        736
      );
      await reviewLabel(`review/${id}/title`, family.set.name, section);
      const grid = await reviewFrame(
        `review/${id}/grid`,
        'States and resizing examples',
        section,
        720
      );
      grid.layoutMode = 'HORIZONTAL';
      grid.layoutWrap = 'WRAP';
      grid.resize(720, grid.height);
      grid.primaryAxisSizingMode = 'FIXED';
      grid.counterAxisSizingMode = 'AUTO';
      grid.itemSpacing = 16;
      grid.counterAxisSpacing = 16;
      grid.primaryAxisAlignItems = 'MIN';
      grid.counterAxisAlignItems = 'MIN';
      const specimens = family.variants.map(item => ({
        id: item.recipe.id,
        name: item.recipe.name,
        variant: item,
        width:
          reviewOptions.width ||
          (typeof item.recipe.tree.layout?.width === 'number'
            ? item.recipe.tree.layout.width
            : undefined),
      }));
      if (reviewOptions.genericLabels !== false)
        specimens.push({
          id: 'long-label',
          name: 'Long label, editable instance',
          variant: family.variants[0],
          label: 'A longer Mangrove label to check resizing and wrapping',
        });
      if (reviewOptions.genericLabels !== false)
        specimens.push({
          id: 'narrow',
          name: 'Narrow layout, 240px',
          variant: family.variants[0],
          width: 240,
          label: 'A longer Mangrove label in a narrow layout',
        });
      specimens.push(
        ...(reviewOptions.specimens || []).map(specimen => ({
          ...specimen,
          variant: family.variants.find(item =>
            matches(item.recipe.properties, specimen.variant)
          ),
        }))
      );
      for (const specimen of specimens) {
        const key = `review/${id}/specimen/${specimen.id}`;
        const preserveVariantSizing =
          MG_INTRINSIC_REVIEW_ENABLED &&
          reviewOptions.preserveVariantSizing === true &&
          specimen.id === specimen.variant.recipe.id;
        const surface =
          specimen.surface ??
          reviewOptions.variantSurfaces?.[specimen.variant.recipe.id];
        // A preserved FIXED master can resolve a token width absent from numeric recipes.
        const row = await reviewFrame(
          key,
          specimen.name,
          grid,
          MG_INTRINSIC_REVIEW_ENABLED &&
            preserveVariantSizing &&
            specimen.variant.node.layoutSizingHorizontal === 'FIXED' &&
            Number.isFinite(specimen.variant.node.width) &&
            specimen.variant.node.width > 0
            ? Math.max(
                (specimen.width
                  ? specimen.width + 2 * reviewPadding
                  : specimen.label
                    ? 704
                    : 344) + (surface ? 2 * reviewPadding : 0),
                specimen.variant.node.width +
                  2 * reviewPadding +
                  (surface ? 2 * reviewPadding : 0)
              )
            : (specimen.width
                ? specimen.width + 2 * reviewPadding
                : specimen.label
                  ? 704
                  : 344) + (surface ? 2 * reviewPadding : 0)
        );
        await reviewLabel(`${key}/caption`, specimen.name, row);
        let consumerParent = row;
        if (surface) {
          consumerParent = await reviewFrame(
            `${key}/surface`,
            'Source context surface',
            row,
            row.width - 2 * reviewPadding
          );
          consumerParent.visible = true;
          paint(consumerParent, 'fills', surface);
        } else {
          const previousSurface = owned.get(`${key}/surface`);
          if (previousSurface) {
            paint(previousSurface, 'fills', null);
            previousSurface.visible = false;
            mark(previousSurface, `${key}/surface`, false);
          }
        }
        let instance = owned.get(`${key}/instance`);
        const fresh = !instance;
        if (instance && instance.type !== 'INSTANCE')
          throw new Error(`Review instance ${key} changed type.`);
        if (!instance) instance = specimen.variant.node.createInstance();
        mark(instance, `${key}/instance`, fresh);
        await loadNodeFonts(instance);
        if (instance.parent !== consumerParent)
          consumerParent.appendChild(instance);
        if (fresh) {
          instance.name = specimen.name;
          let labelTarget = instance;
          if (specimen.label)
            for (const name of reviewOptions.longLabelTarget || []) {
              const matches = labelTarget.children.filter(
                child => child.name === name
              );
              if (matches.length !== 1)
                throw new Error(
                  `Ambiguous or missing review label target ${name}`
                );
              labelTarget = matches[0];
            }
          const label = Object.entries(labelTarget.componentProperties).find(
            ([name, property]) =>
              property.type === 'TEXT' &&
              name.replace(/#[^#]+$/, '') === 'Label'
          );
          if (label && specimen.label) {
            labelTarget.setProperties({ [label[0]]: specimen.label });
            if (labelTarget !== instance) created.add(labelTarget.id);
          } else if (specimen.label)
            throw new Error(
              `Review label property missing on ${labelTarget.name}`
            );
          const overrides = {};
          for (const [name, value] of Object.entries(
            specimen.properties || {}
          )) {
            const entry = Object.entries(instance.componentProperties).find(
              ([key]) => key.replace(/#[^#]+$/, '') === name
            );
            if (
              !entry ||
              (entry[1].type === 'TEXT'
                ? typeof value !== 'string'
                : entry[1].type !== 'BOOLEAN' || typeof value !== 'boolean')
            )
              throw new Error(
                `Review property ${name} must match a named TEXT or BOOLEAN property.`
              );
            overrides[entry[0]] = value;
          }
          if (Object.keys(overrides).length) instance.setProperties(overrides);
          if (
            !preserveVariantSizing &&
            (specimen.width ||
              specimen.variant.recipe.tree.layout?.width === 'FILL')
          )
            instance.layoutSizingHorizontal = 'FILL';
          if (specimen.instanceWidth !== undefined)
            applyLayout(instance, { width: specimen.instanceWidth });
          // Apply content before geometry, then resolve fresh descendants again.
          // Nested property changes can rebuild instance descendants in Figma.
        }
        if (preserveVariantSizing && (fresh || refreshNarrowReview)) {
          await intrinsicReviewGeometry(instance, specimen.variant.node);
          if (!fresh)
            result.audit.push({
              nodeId: instance.id,
              status: 'variant-review-geometry-refreshed',
              width: instance.width,
              horizontalSizing: instance.layoutSizingHorizontal,
              preservedContent: true,
            });
        }
        if (specimen.nodes?.length && (fresh || refreshNarrowReview)) {
          if (!fresh) {
            const current = await instance.getMainComponentAsync();
            if (current?.id !== specimen.variant.node.id) {
              instance.swapComponent(specimen.variant.node);
              await loadNodeFonts(instance);
            }
          }
          applyLayout(instance, {
            width: specimen.instanceWidth ?? specimen.width,
            height: 'HUG',
          });
          for (const seed of fresh ? specimen.nodes : []) {
            let target = instance;
            for (const name of seed.path) {
              const children = target.children.filter(
                child => child.name === name
              );
              if (children.length !== 1)
                throw new Error(`Ambiguous or missing review node ${name}`);
              target = children[0];
            }
            await loadNodeFonts(target);
            const values = {};
            for (const [name, value] of Object.entries(seed.properties || {})) {
              const property = Object.keys(target.componentProperties).find(
                key => key.replace(/#[^#]+$/, '') === name
              );
              if (!property)
                throw new Error(
                  `Review nested property ${name} is unavailable.`
                );
              values[property] = value;
            }
            if (Object.keys(values).length) target.setProperties(values);
            created.add(target.id);
          }
          if (!fresh)
            result.audit.push({
              nodeId: instance.id,
              status: 'composed-review-geometry-refreshed',
              preservedContent: true,
            });
        }
        if (!fresh && specimen.label && reviewOptions.longLabelTarget) {
          result.audit.push({
            nodeId: instance.id,
            status: 'existing-nested-review-label-preserved',
            anatomyPath: reviewOptions.longLabelTarget,
            note: 'Nested label seeding applies to fresh review specimens only. Existing labels are preserved; use the exposed nested Label property to edit a prior specimen or explicitly reseed the review.',
          });
        }
        if (
          Number.isFinite(specimen.width) &&
          specimen.width > 0 &&
          reviewOptions.responsiveLabel &&
          (fresh || (refreshNarrowReview && id === 'button'))
        ) {
          const label = instance
            .findAllWithCriteria({ types: ['TEXT'] })
            .find(
              node =>
                node.componentPropertyReferences?.characters?.replace(
                  /#[^#]+$/,
                  ''
                ) === 'Label'
            );
          if (label) {
            await loadNodeFonts(label);
            instance.resize(specimen.width, Math.max(1, instance.height));
            instance.layoutSizingHorizontal = 'FILL';
            instance.layoutSizingVertical = 'HUG';
            label.textAutoResize = 'HEIGHT';
            label.textAlignHorizontal = 'CENTER';
            label.resize(
              Math.max(
                1,
                instance.width - instance.paddingLeft - instance.paddingRight
              ),
              Math.max(1, label.height)
            );
            label.layoutSizingHorizontal = 'FILL';
            label.layoutSizingVertical = 'HUG';
            if (fresh) created.add(label.id);
            else updated.add(label.id);
            if (!fresh)
              result.audit.push({
                nodeId: instance.id,
                labelNodeId: label.id,
                status: 'narrow-review-layout-refreshed',
                width: specimen.width,
                preservedLabel: true,
              });
          }
        }
        // Existing labels remain editable, including during explicit layout refresh.
      }
    } catch (error) {
      result.errors.push(`Review ${family.set.name}: ${reportError(error)}`);
    }
  }
  if (organized) {
    try {
      result.layout = await organizeMangroveKit(doc, brandId, {
        zoom: false,
        allowProbes: true,
      });
      for (const id of result.layout.createdNodeIds) created.add(id);
      for (const id of result.layout.updatedNodeIds) updated.add(id);
      for (const error of result.layout.errors)
        result.errors.push(`Kit layout: ${error}`);
    } catch (error) {
      result.errors.push(`Kit layout: ${reportError(error)}`);
    }
  } else if (typeof mgLayoutLegacySpacing === 'function') {
    result.presentation = mgLayoutLegacySpacing(main, review);
    if (result.presentation.changed && !created.has(review.id))
      updated.add(review.id);
    if (typeof mgWelcomeLegacySpacing === 'function') {
      try {
        for (const id of (await mgWelcomeLegacySpacing(main, review))
          .updatedNodeIds)
          updated.add(id);
      } catch (error) {
        result.errors.push(`Legacy diagnostics: ${reportError(error)}`);
      }
    }
  }
  result.createdNodeIds = [...created];
  result.updatedNodeIds = [...updated];
  if (result.families.length) {
    const focusId =
      [...chosen].find(id =>
        result.families.some(family => family.id === id)
      ) || result.families[0].id;
    figma.viewport.scrollAndZoomIntoView([
      owned.get(`layout/family/${focusId}/main`) ||
        owned.get(`family/${focusId}`) ||
        owned.get(`review/${focusId}`) ||
        review,
    ]);
  }
  return result;
}
