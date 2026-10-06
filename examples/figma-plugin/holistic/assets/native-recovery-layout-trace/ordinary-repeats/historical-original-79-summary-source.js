const MG_SHARED_ONLY=true;function errorMessage(e){return e?.message||String(e);}
/* global MG_SHARED_ONLY */
// Shared token identities work in both the desktop plugin and the connector.
// Store public token IDs only; shared plugin data is readable by other plugins.
const MG_IDENTITY_NAMESPACE = 'orgundrrmangrove';

function mgReadIdentity(asset, key) {
  const shared = asset.getSharedPluginData
    ? asset.getSharedPluginData(MG_IDENTITY_NAMESPACE, key)
    : '';
  const privateValue =
    typeof MG_SHARED_ONLY !== 'undefined' && MG_SHARED_ONLY
      ? ''
      : asset.getPluginData(key);
  if (shared && privateValue && shared !== privateValue) {
    throw new Error(`Conflicting Mangrove identities on ${asset.id} (${key}).`);
  }
  return shared || privateValue;
}

function mgWriteIdentity(asset, key, value) {
  asset.setSharedPluginData(MG_IDENTITY_NAMESPACE, key, value);
}

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
    if (!(key in object)) continue;
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



const p=await figma.getNodeByIdAsync(PAGE_ID); await figma.setCurrentPageAsync(p);
const report=await inspectMangroveKit();
const styles=new Map([...report.styles.text,...report.styles.effect].map(s=>[s.id,s.mgStyleId||s.name]));
function norm(x) {if(typeof x==='string')return styles.has(x)?'STYLE:'+styles.get(x):x;if(Array.isArray(x))return x.map(norm);if(x&&typeof x==='object')return Object.fromEntries(Object.keys(x).filter(k=>k!=='key'&&k!=='absoluteRenderBounds').sort().map(k=>[k,norm(x[k])]));return x;}
function hash(x){let h=2166136261;const s=JSON.stringify(norm(x));for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
const records=report.nodes.slice().sort((a,b)=>a.id.localeCompare(b.id));
const fields={};for(const n of records) for(const k of Object.keys(n)) if(k!=='key'&&k!=='absoluteRenderBounds') (fields[k]||=([])).push([n.id,n[k]]);
const faceMap=new Map();for(const n of records)if(n.type==='TEXT'&&n.fontName&&n.fontName.family)faceMap.set(JSON.stringify(n.fontName),n.fontName);
const fonts=[];for(const fontName of faceMap.values()){try{await figma.loadFontAsync(fontName);fonts.push({fontName,loaded:true});}catch(e){fonts.push({fontName,loaded:false,error:String(e)});}}
return {pages:report.pages,pageId:report.currentPage.id,nodeCount:records.length,nodeIdsHash:hash(records.map(n=>n.id)),fieldCounts:Object.fromEntries(Object.entries(fields).map(([k,v])=>[k,v.length])),fieldHashes:Object.fromEntries(Object.entries(fields).map(([k,v])=>[k,hash(v)])),collectionsHash:hash(report.collections),variablesHash:hash(report.variables),textStylesHash:hash(report.styles.text),effectStylesHash:hash(report.styles.effect),counts:{variables:report.variables.length,textStyles:report.styles.text.length,effectStyles:report.styles.effect.length,componentSets:records.filter(n=>n.type==='COMPONENT_SET').length,components:records.filter(n=>n.type==='COMPONENT').length,instances:records.filter(n=>n.type==='INSTANCE').length},sampleNewKeys:{collection:report.collections[0]?.key,component:records.find(n=>n.type==='COMPONENT')?.key},errors:{count:report.errors.length,samples:report.errors.slice(0,2)},fonts};
