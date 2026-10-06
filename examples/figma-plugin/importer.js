/* global mgReadIdentity, mgWriteIdentity, figma, MG_CONNECTOR_TEXT_CASE, MG_CONNECTOR_NATIVE_COLLECTIONS, mgAssertExperimentOperationTarget, mgNativeCollectionsSourceCapability, mgNativeCollectionsPreflight, MG_CONNECTOR_NATIVE_TEXT_INSTANCES, mgNativeCollectionsCollectionLedger */
/** Shared variable/style importer for maintenance and occasional construction. */
const ID_KEY = 'mgId';
const STYLE_ID_KEY = 'mgStyleId';
const MG_TEXT_CASE_ENABLED =
  typeof MG_CONNECTOR_TEXT_CASE === 'undefined' || MG_CONNECTOR_TEXT_CASE;

const MG_NATIVE_COLLECTION_IMPORT_ENABLED =
  typeof MG_CONNECTOR_NATIVE_COLLECTIONS === 'undefined' ||
  MG_CONNECTOR_NATIVE_COLLECTIONS;

const MG_NATIVE_TEXT_IMPORT_ENABLED =
  typeof MG_CONNECTOR_NATIVE_TEXT_INSTANCES === 'undefined' ||
  MG_CONNECTOR_NATIVE_TEXT_INSTANCES;

async function nativeCollectionImportSnapshot(fence) {
  fence();
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  fence();
  const variables = await figma.variables.getLocalVariablesAsync();
  fence();
  return { collections, variables };
}

async function importNativeCollections(
  doc,
  selectedModeIds,
  prune,
  textStyles,
  effects
) {
  if (typeof mgAssertExperimentOperationTarget !== 'function')
    throw new Error(
      'Native collections require a trusted experiment target guard'
    );
  const textProfile =
    MG_NATIVE_TEXT_IMPORT_ENABLED && doc.nativeCollections?.version === 2;
  const operationPageId = textProfile ? figma.currentPage.id : null;
  const fence = textProfile
    ? () => {
        mgAssertExperimentOperationTarget();
        if (figma.currentPage.id !== operationPageId)
          throw new Error('Native text collection import page changed');
      }
    : mgAssertExperimentOperationTarget;
  fence();
  if (
    prune ||
    textStyles !== undefined ||
    effects === false ||
    !Array.isArray(selectedModeIds) ||
    selectedModeIds.length !== doc.modes?.length ||
    new Set(selectedModeIds).size !== selectedModeIds.length ||
    doc.modes.some(mode => !selectedModeIds.includes(mode.id))
  )
    throw new Error(
      'Native collections require the whole document, all modes and prune off'
    );
  validateMangroveImport(doc, selectedModeIds);
  mgNativeCollectionsSourceCapability(doc);
  // Private operation copy freezes the validated source across awaited inventory reads.
  const source = JSON.parse(JSON.stringify(doc));
  const plan = mgNativeCollectionsSourceCapability(source);
  const identity = {
    readCollection: asset => {
      const raw = mgReadIdentity(asset, 'mgNativeCollectionPlan');
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        throw new Error('Invalid native collection ownership JSON');
      }
    },
    readVariable: asset => mgReadIdentity(asset, ID_KEY),
  };
  let state = mgNativeCollectionsPreflight(
    plan,
    await nativeCollectionImportSnapshot(fence),
    identity
  );
  // The v2 variable phase checks declared source fonts before any COL/VAR write.
  // Invalid old native font literals remain repairable; builder checks actual native fonts later.
  const sourceFontsLoaded = [];
  if (MG_NATIVE_TEXT_IMPORT_ENABLED && textProfile) {
    for (const font of plan.sourceFonts) {
      fence();
      await figma.loadFontAsync(font);
      fence();
      sourceFontsLoaded.push(font);
    }
  }
  // Refresh the complete inventory immediately before the first permanent write.
  state = mgNativeCollectionsPreflight(
    plan,
    await nativeCollectionImportSnapshot(fence),
    identity
  );
  const counts = { created: 0, updated: 0, removed: 0, values: 0 };
  const createdCollectionIds = [],
    updatedCollectionIds = [],
    createdModeIds = [],
    createdVariableIds = [],
    updatedVariableIds = [],
    errors = [];
  let completed = false;
  try {
    for (const spec of plan.collectionById.values()) {
      fence();
      let collection = state.collectionsBySourceId.get(spec.id);
      const modeMap = state.modeIdsByCollectionId.get(spec.id);
      if (!collection) {
        collection = figma.variables.createVariableCollection(spec.name);
        createdCollectionIds.push(collection.id);
        state.collectionsBySourceId.set(spec.id, collection);
        fence();
        mgWriteIdentity(
          collection,
          'mgNativeCollectionPlan',
          JSON.stringify(
            MG_NATIVE_TEXT_IMPORT_ENABLED && textProfile
              ? mgNativeCollectionsCollectionLedger(plan, spec.id)
              : { version: 1, planId: plan.planId, collectionId: spec.id }
          )
        );
        const first = source.modes[0];
        fence();
        collection.renameMode(collection.defaultModeId, first.name);
        modeMap.set(first.id, collection.defaultModeId);
        createdModeIds.push({
          collectionId: collection.id,
          sourceModeId: first.id,
          modeId: collection.defaultModeId,
        });
      } else updatedCollectionIds.push(collection.id);
      for (const mode of source.modes) {
        if (modeMap.has(mode.id)) continue;
        fence();
        const modeId = collection.addMode(mode.name);
        modeMap.set(mode.id, modeId);
        createdModeIds.push({
          collectionId: collection.id,
          sourceModeId: mode.id,
          modeId,
        });
      }
    }
    // All native UUIDs exist before any cross-collection alias is assigned.
    for (const spec of source.variables) {
      fence();
      let variable = state.variablesBySourceId.get(spec.id);
      if (!variable) {
        variable = figma.variables.createVariable(
          spec.name,
          state.collectionsBySourceId.get(plan.ownerBySourceId.get(spec.id)),
          spec.type
        );
        createdVariableIds.push(variable.id);
        counts.created++;
        state.variablesBySourceId.set(spec.id, variable);
      } else {
        updatedVariableIds.push(variable.id);
        counts.updated++;
      }
      fence();
      mgWriteIdentity(variable, ID_KEY, spec.id);
      variable.description = spec.description || '';
      variable.hiddenFromPublishing = Boolean(spec.hiddenFromPublishing);
      if (spec.scopes !== undefined) variable.scopes = spec.scopes;
      if (spec.codeSyntax?.WEB)
        variable.setVariableCodeSyntax('WEB', spec.codeSyntax.WEB);
      else if (variable.codeSyntax?.WEB)
        variable.removeVariableCodeSyntax('WEB');
    }
    for (const spec of source.variables) {
      const variable = state.variablesBySourceId.get(spec.id);
      const modeMap = state.modeIdsByCollectionId.get(
        plan.ownerBySourceId.get(spec.id)
      );
      for (const mode of source.modes) {
        fence();
        const value = spec.values[mode.id];
        variable.setValueForMode(
          modeMap.get(mode.id),
          value && typeof value === 'object' && 'alias' in value
            ? figma.variables.createVariableAlias(
                state.variablesBySourceId.get(
                  plan.sourceByName.get(value.alias).id
                )
              )
            : value
        );
        counts.values++;
      }
    }
    state = mgNativeCollectionsPreflight(
      plan,
      await nativeCollectionImportSnapshot(fence),
      identity
    );
    completed = true;
  } catch (error) {
    errors.push(errorMessage(error));
  }
  const primary = state.collectionsBySourceId.get(plan.primary);
  return {
    collection: primary?.name || source.collection,
    collectionId: primary?.id || null,
    modeIds: Object.fromEntries(state.modeIdsByCollectionId.get(plan.primary)),
    modes: completed ? source.modes.map(mode => mode.name) : [],
    requestedModes: source.modes.map(mode => mode.name),
    counts,
    createdVariableIds,
    updatedVariableIds,
    removedVariableIds: [],
    styles: null,
    stale: [],
    skipped: source.skipped || [],
    errors,
    nativeCollections: {
      version: MG_NATIVE_TEXT_IMPORT_ENABLED && textProfile ? 2 : 1,
      ...(MG_NATIVE_TEXT_IMPORT_ENABLED && textProfile
        ? { profile: plan.profile, sourceFontsLoaded }
        : {}),
      planId: plan.planId,
      completed,
      createdCollectionIds,
      updatedCollectionIds,
      createdModeIds,
      collectionIds: Object.fromEntries(
        [...state.collectionsBySourceId].map(([id, c]) => [id, c.id])
      ),
      modeIdsByCollectionId: Object.fromEntries(
        [...state.modeIdsByCollectionId].map(([id, modes]) => [
          id,
          Object.fromEntries(modes),
        ])
      ),
      partialAssetIds: completed
        ? []
        : [...createdCollectionIds, ...createdVariableIds],
    },
  };
}

// Figma API rejections can be strings rather than Error instances.
function errorMessage(error) {
  return error && error.message ? error.message : String(error);
}

function validateMangroveParagraphIndent(doc, selectedTextIds) {
  for (const spec of doc.styles?.text || []) {
    if (selectedTextIds && !selectedTextIds.includes(spec.id)) continue;
    for (const [mode, value] of Object.entries(spec.values || {})) {
      if (
        value.paragraphIndent !== undefined &&
        (!Number.isFinite(value.paragraphIndent) || value.paragraphIndent < 0)
      )
        throw new Error(
          `Import preflight: ${spec.name} [${mode}]: invalid paragraph indent`
        );
    }
  }
}

function validateMangroveTextCase(doc, selectedTextIds) {
  if (!MG_TEXT_CASE_ENABLED) return;
  const modes = (doc.modes || []).map(mode => mode.id).sort();
  for (const spec of doc.styles?.text || []) {
    if (selectedTextIds && !selectedTextIds.includes(spec.id)) continue;
    const values = Object.values(spec.values || {});
    if (!values.some(value => value?.textCase !== undefined)) continue;
    if (
      !modes.length ||
      Object.keys(spec.values || {})
        .sort()
        .join(',') !== modes.join(',') ||
      values.some(value => !['ORIGINAL', 'UPPER'].includes(value?.textCase)) ||
      new Set(values.map(value => value.textCase)).size !== 1
    )
      throw new Error(
        `Import preflight: ${spec.name}: text case needs identical ORIGINAL or UPPER values in every source mode`
      );
  }
}

function validateMangroveNativeTextCase(style, spec) {
  if (!MG_TEXT_CASE_ENABLED) return;
  if (
    !style ||
    !Object.values(spec.values || {}).some(
      value => value?.textCase !== undefined
    )
  )
    return;
  if (
    ![
      'ORIGINAL',
      'UPPER',
      'LOWER',
      'TITLE',
      'SMALL_CAPS',
      'SMALL_CAPS_FORCED',
    ].includes(style.textCase)
  )
    throw new Error(
      `Import preflight: ${spec.name}: native text case field is unavailable or malformed`
    );
}

function validateMangroveImport(doc, selectedModeIds, selectedTextIds) {
  const fail = message => {
    throw new Error(`Import preflight: ${message}`);
  };
  const nonempty = value =>
    typeof value === 'string' && value.trim().length > 0;
  function unique(entries, kind) {
    if (!Array.isArray(entries)) fail(`${kind} must be an array`);
    const ids = new Set();
    const names = new Set();
    for (const entry of entries) {
      if (!entry || !nonempty(entry.id) || !nonempty(entry.name))
        fail(`${kind} needs nonempty IDs and names`);
      if (ids.has(entry.id)) fail(`Duplicate ${kind} ID ${entry.id}`);
      if (names.has(entry.name)) fail(`Duplicate ${kind} name ${entry.name}`);
      ids.add(entry.id);
      names.add(entry.name);
    }
    return ids;
  }
  if (!doc || !nonempty(doc.collection)) fail('collection must have a name');
  const modes = unique(doc.modes, 'mode');
  unique(doc.variables, 'variable');
  if (!Array.isArray(selectedModeIds) || !selectedModeIds.length)
    fail('Select at least one brand.');
  if (new Set(selectedModeIds).size !== selectedModeIds.length)
    fail('Duplicate selected brands');
  for (const id of selectedModeIds)
    if (!modes.has(id)) fail(`Unknown selected brand ${id}`);
  const byName = new Map(
    doc.variables.map(variable => [variable.name, variable])
  );
  function checkValues(spec, kind) {
    if (
      !spec.values ||
      typeof spec.values !== 'object' ||
      Array.isArray(spec.values)
    )
      fail(`${kind} ${spec.name} needs mode values`);
    for (const id of Object.keys(spec.values))
      if (!modes.has(id)) fail(`${kind} ${spec.name} has unknown mode ${id}`);
  }
  function checkBinding(name, type, owner) {
    const target = byName.get(name);
    if (!target) fail(`${owner}: missing binding variable ${name}`);
    if (target.type !== type)
      fail(`${owner}: binding ${name} needs ${type}, got ${target.type}`);
  }
  for (const spec of doc.variables) {
    if (!['COLOR', 'FLOAT', 'STRING', 'BOOLEAN'].includes(spec.type))
      fail(`${spec.name}: unsupported variable type ${spec.type}`);
    checkValues(spec, 'Variable');
    for (const [mode, value] of Object.entries(spec.values)) {
      if (value && typeof value === 'object' && 'alias' in value) {
        const target = byName.get(value.alias);
        if (!target)
          fail(`${spec.name} [${mode}]: alias target ${value.alias} missing`);
        if (target.type !== spec.type)
          fail(
            `${spec.name} [${mode}]: alias target ${value.alias} has wrong type`
          );
        if (!target.values || target.values[mode] === undefined)
          fail(
            `${spec.name} [${mode}]: alias target ${value.alias} has no value`
          );
      } else if (
        (spec.type === 'FLOAT' && !Number.isFinite(value)) ||
        (spec.type === 'STRING' && typeof value !== 'string') ||
        (spec.type === 'BOOLEAN' && typeof value !== 'boolean') ||
        (spec.type === 'COLOR' &&
          (!value ||
            !['r', 'g', 'b', 'a'].every(
              field =>
                Number.isFinite(value[field]) &&
                value[field] >= 0 &&
                value[field] <= 1
            )))
      )
        fail(`${spec.name} [${mode}]: invalid ${spec.type} value`);
    }
  }
  for (const mode of modes) {
    const visiting = new Set();
    const visited = new Set();
    function visit(spec) {
      if (visited.has(spec.name)) return;
      if (visiting.has(spec.name))
        fail(`Alias cycle at ${spec.name} [${mode}]`);
      visiting.add(spec.name);
      const value = spec.values[mode];
      if (value && typeof value === 'object' && 'alias' in value)
        visit(byName.get(value.alias));
      visiting.delete(spec.name);
      visited.add(spec.name);
    }
    for (const spec of doc.variables) visit(spec);
  }
  const text = doc.styles ? doc.styles.text || [] : [];
  const effects = doc.styles ? doc.styles.effect || [] : [];
  if (!Array.isArray(text) || !Array.isArray(effects))
    fail('Style definitions must be arrays');
  unique([...text, ...effects], 'style');
  validateMangroveParagraphIndent(doc);
  if (MG_TEXT_CASE_ENABLED) validateMangroveTextCase(doc);
  if (selectedTextIds !== undefined) {
    if (
      !Array.isArray(selectedTextIds) ||
      new Set(selectedTextIds).size !== selectedTextIds.length
    )
      fail('Text style selection must contain unique IDs');
    const textIds = new Set(text.map(spec => spec.id));
    for (const id of selectedTextIds)
      if (!textIds.has(id)) fail(`Unknown selected text style ${id}`);
  }
  for (const spec of text) {
    checkValues(spec, 'Text style');
    checkBinding(
      spec.bindings && spec.bindings.fontFamily,
      'STRING',
      spec.name
    );
    checkBinding(spec.bindings && spec.bindings.fontSize, 'FLOAT', spec.name);
    for (const [mode, value] of Object.entries(spec.values)) {
      if (
        !value ||
        !value.fontName ||
        !nonempty(value.fontName.family) ||
        !nonempty(value.fontName.style) ||
        !Number.isFinite(value.fontSize) ||
        value.fontSize <= 0
      )
        fail(`${spec.name} [${mode}]: invalid text style value`);
      if (
        value.textDecoration !== undefined &&
        !['NONE', 'UNDERLINE'].includes(value.textDecoration)
      )
        fail(`${spec.name} [${mode}]: invalid text style decoration`);
      if (
        value.textWrapStyle !== undefined &&
        !['AUTO', 'BALANCE', 'PRETTY'].includes(value.textWrapStyle)
      )
        fail(`${spec.name} [${mode}]: invalid text style wrapping`);
      if (value.letterSpacing !== undefined) {
        const spacing = value.letterSpacing;
        if (
          !spacing ||
          !['PIXELS', 'PERCENT'].includes(spacing.unit) ||
          !Number.isFinite(spacing.value) ||
          Object.keys(spacing).some(key => !['unit', 'value'].includes(key))
        )
          fail(`${spec.name} [${mode}]: invalid text style letter spacing`);
      }
      // Source metadata only: native TextStyle has no decoration offset API.
      // Component TextNodes apply this value after their shared style.
      if (value.textDecorationOffset !== undefined) {
        const offset = value.textDecorationOffset;
        if (
          !offset ||
          !['AUTO', 'PIXELS', 'PERCENT'].includes(offset.unit) ||
          (offset.unit === 'AUTO'
            ? Object.keys(offset).some(key => key !== 'unit')
            : !Number.isFinite(offset.value) ||
              Object.keys(offset).some(key => !['unit', 'value'].includes(key)))
        )
          fail(`${spec.name} [${mode}]: invalid decoration offset metadata`);
      }
    }
  }
  for (const spec of effects) {
    checkValues(spec, 'Effect style');
    for (const [mode, entries] of Object.entries(spec.values)) {
      if (!Array.isArray(entries))
        fail(`${spec.name} [${mode}]: effects must be an array`);
      for (const entry of entries) {
        if (!entry || !entry.effect)
          fail(`${spec.name} [${mode}]: effect definition missing`);
        for (const [field, name] of Object.entries(entry.bindings || {})) {
          if (
            !['color', 'radius', 'spread', 'offsetX', 'offsetY'].includes(field)
          )
            fail(`${spec.name}: unsupported effect binding ${field}`);
          checkBinding(name, field === 'color' ? 'COLOR' : 'FLOAT', spec.name);
        }
      }
    }
  }
}

function mangroveAssetIndex(assets, key) {
  const index = { byId: new Map(), byName: new Map(), key };
  for (const asset of assets) rememberMangroveAsset(index, asset);
  return index;
}

function rememberMangroveAsset(index, asset) {
  for (const map of [index.byId, index.byName]) {
    for (const [key, entries] of map) {
      const remaining = entries.filter(entry => entry.id !== asset.id);
      if (remaining.length) map.set(key, remaining);
      else map.delete(key);
    }
  }
  for (const [map, key] of [
    [index.byId, mgReadIdentity(asset, index.key)],
    [index.byName, asset.name],
  ]) {
    if (key) map.set(key, [...(map.get(key) || []), asset]);
  }
}

function findMangroveAsset(index, spec, kind, type) {
  const ids = index.byId.get(spec.id) || [];
  const names = index.byName.get(spec.name) || [];
  if (ids.length > 1 || names.length > 1)
    throw new Error(`Import preflight: ambiguous ${kind} ${spec.name}`);
  const asset = ids[0] || names[0];
  if (!asset) return null;
  if (ids[0] && names[0] && ids[0].id !== names[0].id)
    throw new Error(
      `Import preflight: ${kind} name ${spec.name} conflicts with its existing ID`
    );
  const owner = mgReadIdentity(asset, index.key);
  if (owner && owner !== spec.id)
    throw new Error(
      `Import preflight: ${kind} ${spec.name} belongs to ${owner}`
    );
  const actualType = kind === 'variable' ? asset.resolvedType : asset.type;
  if (actualType !== type)
    throw new Error(
      `Import preflight: ${kind} ${spec.name} changed type from ${actualType} to ${type}; migration required. Existing ID ${asset.id} was preserved.`
    );
  return asset;
}

async function preflightMangroveAssets(doc, textStyles, importEffects) {
  const collections = (
    await figma.variables.getLocalVariableCollectionsAsync()
  ).filter(collection => collection.name === doc.collection);
  if (collections.length > 1)
    throw new Error(`Import preflight: ambiguous collection ${doc.collection}`);
  const collection = collections[0];
  if (
    collection &&
    new Set(collection.modes.map(mode => mode.name)).size !==
      collection.modes.length
  )
    throw new Error(
      `Import preflight: duplicate modes in collection ${doc.collection}`
    );
  const local = (await figma.variables.getLocalVariablesAsync()).filter(
    variable => collection && variable.variableCollectionId === collection.id
  );
  const variables = mangroveAssetIndex(local, ID_KEY);
  for (const spec of doc.variables)
    findMangroveAsset(variables, spec, 'variable', spec.type);
  if (!doc.styles) return;
  const selectedText = (doc.styles.text || []).filter(spec =>
    textStyles ? textStyles.includes(spec.id) : spec.recommended
  );
  const selectedEffects = importEffects ? doc.styles.effect || [] : [];
  if (!selectedText.length && !selectedEffects.length) return;
  const styles = mangroveAssetIndex(
    [
      ...(await figma.getLocalTextStylesAsync()),
      ...(await figma.getLocalEffectStylesAsync()),
    ],
    STYLE_ID_KEY
  );
  for (const [kind, specs, type] of [
    ['text style', selectedText, 'TEXT'],
    ['effect style', selectedEffects, 'EFFECT'],
  ]) {
    for (const spec of specs) {
      const style = findMangroveAsset(styles, spec, kind, type);
      if (MG_TEXT_CASE_ENABLED && type === 'TEXT')
        validateMangroveNativeTextCase(style, spec);
    }
  }
}

async function findOrCreateCollection(name, firstModeName) {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  if (collections.filter(collection => collection.name === name).length > 1)
    throw new Error(`Import preflight: ambiguous collection ${name}`);
  const existing = collections.find(c => c.name === name);
  if (existing) return { collection: existing, created: false };
  const collection = figma.variables.createVariableCollection(name);
  collection.renameMode(collection.modes[0].modeId, firstModeName);
  return { collection, created: true };
}

function ensureModes(collection, modes, created) {
  const modeIds = Object.create(null);
  const errors = [];

  // Brand switcher: one brand into a one-mode collection overwrites that
  // mode, so a file limited to 1 mode can still be re-themed by re-importing
  // with another brand. Bindings survive because variables are reused.
  if (modes.length === 1 && collection.modes.length === 1) {
    const only = collection.modes[0];
    if (only.name !== modes[0].name) {
      collection.renameMode(only.modeId, modes[0].name);
    }
    modeIds[modes[0].id] = only.modeId;
    return { modeIds, errors };
  }

  modes.forEach((mode, index) => {
    const match = collection.modes.find(m => m.name === mode.name);
    if (match) {
      modeIds[mode.id] = match.modeId;
      return;
    }
    if (created && index === 0) {
      modeIds[mode.id] = collection.modes[0].modeId;
      return;
    }
    try {
      modeIds[mode.id] = collection.addMode(mode.name);
    } catch (error) {
      errors.push(
        `Could not add mode "${mode.name}" (${collection.modes.length} ` +
          `mode(s) exist). The file's plan limits modes: a file in Drafts ` +
          `or a Starter team allows only 1. Move it into a project in the ` +
          `Professional team and import again, or tick a single brand to ` +
          `use this file as a brand switcher. ` +
          errorMessage(error)
      );
    }
  });
  return { modeIds, errors };
}

async function importStyles(
  doc,
  variables,
  modeId,
  selectedTextIds,
  importEffects
) {
  // Direct component builds call importStyles without importVariables.
  // Validate every selected authored mode before any style is created or updated.
  validateMangroveParagraphIndent(doc, selectedTextIds);
  if (MG_TEXT_CASE_ENABLED) validateMangroveTextCase(doc, selectedTextIds);
  const counts = {
    text: { created: 0, updated: 0, failed: 0 },
    effect: { created: 0, updated: 0, failed: 0 },
  };
  const errors = [];
  const missingFonts = new Set();
  const createdStyleIds = [];
  const updatedStyleIds = [];
  const touchedStyleIds = new Set();
  const removedStyleIds = [];
  const retainedPartialStyleIds = [];
  const trackedIds = () => ({
    createdStyleIds,
    updatedStyleIds,
    touchedStyleIds: [...touchedStyleIds],
    removedStyleIds,
    retainedPartialStyleIds,
  });
  if (!doc.styles) return { counts, errors, missingFonts: [], ...trackedIds() };
  const textSpecs = (doc.styles.text || []).filter(spec =>
    selectedTextIds ? selectedTextIds.includes(spec.id) : spec.recommended
  );
  const effectSpecs = importEffects ? doc.styles.effect || [] : [];
  // TextStyle.textCase is a documented writable field. Check every existing
  // opted-in style before any style write, including a later selected style.
  if (MG_TEXT_CASE_ENABLED) {
    const caseSpecs = textSpecs.filter(spec =>
      Object.values(spec.values).some(value => value.textCase !== undefined)
    );
    if (caseSpecs.length) {
      const caseIndex = mangroveAssetIndex(
        await figma.getLocalTextStylesAsync(),
        STYLE_ID_KEY
      );
      for (const spec of caseSpecs) {
        const style = findMangroveAsset(caseIndex, spec, 'text style', 'TEXT');
        validateMangroveNativeTextCase(style, spec);
      }
    }
  }
  const fontLoads = new Map();
  let fonts = [];
  if (textSpecs.length) {
    try {
      fonts = await figma.listAvailableFontsAsync();
    } catch (error) {
      errors.push(`Could not list fonts: ${errorMessage(error)}`);
    }
  }
  async function loadFont(font) {
    const key = `${font.family} ${font.style}`;
    if (!fontLoads.has(key)) {
      fontLoads.set(
        key,
        (async () => {
          if (
            !fonts.some(
              entry =>
                entry.fontName.family === font.family &&
                entry.fontName.style === font.style
            )
          ) {
            missingFonts.add(key);
            throw new Error(
              `Font "${key}" is not available. Install or enable it in Figma, then re-import.`
            );
          }
          try {
            await figma.loadFontAsync(font);
          } catch (error) {
            missingFonts.add(key);
            throw new Error(
              `Could not load font "${key}": ${errorMessage(error)}`
            );
          }
        })()
      );
    }
    await fontLoads.get(key);
  }
  function binding(name, type) {
    const variable = variables.get(name);
    if (!variable || variable.resolvedType !== type) {
      throw new Error(`Missing ${type} style variable ${name}`);
    }
    return variable;
  }
  for (const [kind, specs, getLocal, create] of [
    [
      'text',
      textSpecs,
      () => figma.getLocalTextStylesAsync(),
      () => figma.createTextStyle(),
    ],
    [
      'effect',
      effectSpecs,
      () => figma.getLocalEffectStylesAsync(),
      () => figma.createEffectStyle(),
    ],
  ]) {
    if (!specs.length) continue;
    let local;
    try {
      local = await getLocal();
    } catch (error) {
      counts[kind].failed += specs.length;
      errors.push(`Could not list ${kind} styles: ${errorMessage(error)}`);
      continue;
    }
    const index = mangroveAssetIndex(local, STYLE_ID_KEY);
    for (const spec of specs) {
      let style = findMangroveAsset(
        index,
        spec,
        `${kind} style`,
        kind === 'text' ? 'TEXT' : 'EFFECT'
      );
      const existing = Boolean(style);
      try {
        const value = spec.values[modeId];
        if (!value) throw new Error(`No style value for brand ${modeId}`);
        let family;
        let size;
        let effects;
        if (kind === 'text') {
          family = binding(spec.bindings.fontFamily, 'STRING');
          size = binding(spec.bindings.fontSize, 'FLOAT');
          // Load every family the style can resolve to before binding it.
          for (const entry of Object.values(spec.values))
            await loadFont(entry.fontName);
          if (style) await loadFont(style.fontName);
        } else {
          effects = value.map(entry => {
            let effect = entry.effect;
            for (const [field, name] of Object.entries(entry.bindings || {})) {
              effect = figma.variables.setBoundVariableForEffect(
                effect,
                field,
                binding(name, field === 'color' ? 'COLOR' : 'FLOAT')
              );
            }
            return effect;
          });
        }
        style = style || create();
        // Record retained writes even when a later setter fails. Font and
        // binding preflight above does not touch the existing style.
        touchedStyleIds.add(style.id);
        if (kind === 'text') {
          style.fontName = value.fontName;
          style.fontSize = value.fontSize;
          style.lineHeight = value.lineHeight;
          style.letterSpacing = value.letterSpacing || {
            unit: 'PIXELS',
            value: 0,
          };
          style.setBoundVariable('fontFamily', family);
          style.setBoundVariable('fontSize', size);
          style.textDecoration = value.textDecoration || 'NONE';
          style.textWrapStyle = value.textWrapStyle || 'AUTO';
          style.paragraphIndent = value.paragraphIndent ?? 0;
          if (MG_TEXT_CASE_ENABLED && value.textCase !== undefined)
            style.textCase = value.textCase;
        } else {
          style.effects = effects;
        }
        style.name = spec.name;
        style.description = spec.description || '';
        mgWriteIdentity(style, STYLE_ID_KEY, spec.id);
        rememberMangroveAsset(index, style);
        counts[kind][existing ? 'updated' : 'created'] += 1;
        (existing ? updatedStyleIds : createdStyleIds).push(style.id);
      } catch (error) {
        // Do not leave a new, partly configured style after a failed import.
        if (style && !existing) {
          try {
            style.remove();
            removedStyleIds.push(style.id);
            touchedStyleIds.delete(style.id);
          } catch (removeError) {
            retainedPartialStyleIds.push(style.id);
            errors.push(
              `${spec.name}: partial style ${style.id} could not be removed: ${errorMessage(removeError)}`
            );
          }
        }
        counts[kind].failed += 1;
        errors.push(`${spec.name}: ${errorMessage(error)}`);
      }
    }
  }
  return { counts, errors, missingFonts: [...missingFonts], ...trackedIds() };
}

async function importVariables(
  doc,
  selectedModeIds,
  prune,
  textStyles,
  effects
) {
  if (
    MG_NATIVE_COLLECTION_IMPORT_ENABLED &&
    doc?.nativeCollections !== undefined
  )
    return importNativeCollections(
      doc,
      selectedModeIds,
      prune,
      textStyles,
      effects
    );
  validateMangroveImport(doc, selectedModeIds, textStyles);
  await preflightMangroveAssets(doc, textStyles, effects !== false);
  const modes = doc.modes.filter(m => selectedModeIds.includes(m.id));
  if (modes.length === 0) throw new Error('Select at least one brand.');

  const { collection, created } = await findOrCreateCollection(
    doc.collection,
    modes[0].name
  );
  const { modeIds, errors } = ensureModes(collection, modes, created);

  const local = (await figma.variables.getLocalVariablesAsync()).filter(
    v => v.variableCollectionId === collection.id
  );
  const index = mangroveAssetIndex(local, ID_KEY);

  const counts = { created: 0, updated: 0, removed: 0, values: 0 };
  const createdVariableIds = [];
  const updatedVariableIds = [];
  const removedVariableIds = [];
  const resolvedByName = new Map();
  const wanted = new Set();

  // Pass 1: every variable exists with the right name, type and metadata,
  // so pass 2 can alias to any of them regardless of order.
  for (const spec of doc.variables) {
    wanted.add(spec.id);
    let variable = findMangroveAsset(index, spec, 'variable', spec.type);
    if (variable) {
      counts.updated += 1;
      updatedVariableIds.push(variable.id);
      if (variable.name !== spec.name) variable.name = spec.name;
    } else {
      variable = figma.variables.createVariable(
        spec.name,
        collection,
        spec.type
      );
      counts.created += 1;
      createdVariableIds.push(variable.id);
    }
    try {
      mgWriteIdentity(variable, ID_KEY, spec.id);
      variable.description = spec.description || '';
      variable.hiddenFromPublishing = Boolean(spec.hiddenFromPublishing);
      variable.scopes = spec.scopes;
      if (spec.codeSyntax && spec.codeSyntax.WEB) {
        variable.setVariableCodeSyntax('WEB', spec.codeSyntax.WEB);
      } else if (variable.codeSyntax && variable.codeSyntax.WEB) {
        // Figma throws if asked to remove a code syntax that is not set.
        variable.removeVariableCodeSyntax('WEB');
      }
    } catch (error) {
      errors.push(`${spec.name}: ${errorMessage(error)}`);
    }
    rememberMangroveAsset(index, variable);
    resolvedByName.set(spec.name, variable);
  }

  // Pass 2: values per mode.
  for (const spec of doc.variables) {
    const variable = resolvedByName.get(spec.name);
    for (const mode of modes) {
      const modeId = modeIds[mode.id];
      const value = spec.values[mode.id];
      if (!modeId || value === undefined) continue;
      try {
        if (value && typeof value === 'object' && 'alias' in value) {
          const target = resolvedByName.get(value.alias);
          if (!target) throw new Error(`alias target ${value.alias} missing`);
          variable.setValueForMode(
            modeId,
            figma.variables.createVariableAlias(target)
          );
        } else {
          variable.setValueForMode(modeId, value);
        }
        counts.values += 1;
      } catch (error) {
        errors.push(`${spec.name} [${mode.name}]: ${errorMessage(error)}`);
      }
    }
  }

  const stale = local.filter(v => {
    const id = mgReadIdentity(v, ID_KEY);
    return id && !wanted.has(id) && !v.removed;
  });
  if (prune) {
    stale.forEach(v => {
      v.remove();
      removedVariableIds.push(v.id);
    });
    counts.removed = stale.length;
  }

  const importedMode = modes.find(mode => modeIds[mode.id]);
  const styles = importedMode
    ? await importStyles(
        doc,
        resolvedByName,
        importedMode.id,
        textStyles,
        effects !== false
      )
    : null;
  if (styles) errors.push(...styles.errors);

  return {
    collection: collection.name,
    collectionId: collection.id,
    modeIds,
    modes: modes.filter(mode => modeIds[mode.id]).map(mode => mode.name),
    requestedModes: modes.map(mode => mode.name),
    counts,
    createdVariableIds,
    updatedVariableIds,
    removedVariableIds,
    styles,
    stale: prune ? [] : stale.map(v => v.name),
    skipped: doc.skipped || [],
    errors,
  };
}
