/* global mgReadIdentity, mgWriteIdentity, figma, __html__, inspectMangroveKit, createMangroveFocusDiagnostics, buildMangroveComponents, exportMangroveReview, prepareMangroveOverrideProbes, compareMangroveOverrideProbes, removeMangroveOverrideProbes, mgDiagnoseFontLoading, runMangroveCapabilityProbes, removeMangroveCapabilityProbes, refreshMangroveCapabilityProbeLedger, inspectMangroveCapabilityProbeLedger, prepareMangroveEditorialProbes, compareMangroveEditorialProbes, removeMangroveEditorialProbes, advanceMangroveSegmentedCanonicalProbes, advanceMangroveSegmentedLeavesProbes, advanceMangroveSegmentedWrapperProbes, advanceMangroveCoreContentProbes */
/**
 * EXPLORATORY: imports mangrove-variables.json (written by
 * scripts/build-figma-tokens.cjs) into local Figma variables and styles.
 *
 * Re-running is an update, not a second copy: variables are matched by the
 * Mangrove token id stored in plugin data, then by name, so a token renamed
 * in YAML renames its Figma variable and keeps every binding to it.
 */
const ID_KEY = 'mgId';
const STYLE_ID_KEY = 'mgStyleId';

figma.showUI(__html__, { width: 600, height: 740, themeColors: true });

// Figma API rejections can be strings rather than Error instances.
function errorMessage(error) {
  return error && error.message ? error.message : String(error);
}

function post(type, payload) {
  figma.ui.postMessage(Object.assign({ type }, payload));
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
    for (const spec of specs) findMangroveAsset(styles, spec, kind, type);
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
          style.setBoundVariable('fontFamily', family);
          style.setBoundVariable('fontSize', size);
          style.textDecoration = value.textDecoration || 'NONE';
          style.textWrapStyle = value.textWrapStyle || 'AUTO';
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

figma.ui.onmessage = async msg => {
  if (msg.type === 'close') {
    figma.closePlugin();
    return;
  }
  try {
    if (msg.type === 'inspect') {
      post('inspection', {
        result: await inspectMangroveKit({
          checkFonts: msg.checkFonts === true,
        }),
      });
      return;
    }
    if (msg.type === 'diagnostics') {
      post('operation', {
        result: await createMangroveFocusDiagnostics(msg.doc, msg.brand),
      });
      return;
    }
    if (msg.type === 'build-components') {
      post('operation', {
        result: await buildMangroveComponents(
          msg.doc,
          msg.brand,
          msg.families,
          { refreshNarrowReview: msg.refreshNarrowReview ?? false }
        ),
      });
      return;
    }
    if (msg.type === 'prepare-override-probes') {
      post('operation', {
        result: await prepareMangroveOverrideProbes(
          msg.doc,
          msg.brand,
          msg.groupId
        ),
      });
      return;
    }
    if (msg.type === 'prepare-editorial-probes') {
      post('operation', {
        result: await prepareMangroveEditorialProbes(msg.doc, msg.brand),
      });
      return;
    }
    if (msg.type === 'compare-editorial-probes') {
      post('operation', {
        result: await compareMangroveEditorialProbes(
          msg.rootId,
          msg.buildResult
        ),
      });
      return;
    }
    if (msg.type === 'remove-editorial-probes') {
      post('operation', {
        result: await removeMangroveEditorialProbes(msg.rootId),
      });
      return;
    }
    if (msg.type === 'font-diagnostics') {
      const availableFonts = await figma.listAvailableFontsAsync();
      post('operation', {
        result: await mgDiagnoseFontLoading(msg.doc, {
          brandId: msg.brand,
          availableFonts,
        }),
      });
      return;
    }
    if (msg.type === 'capability-probes') {
      post('operation', {
        result: await runMangroveCapabilityProbes(
          msg.doc,
          msg.brand,
          msg.scope
        ),
      });
      return;
    }
    if (msg.type === 'advance-segmented-capability-probes') {
      post('operation', {
        result: await (
          msg.report?.scope === 'core-content'
            ? advanceMangroveCoreContentProbes
            : msg.report?.scope === 'segmented-wrapper'
              ? advanceMangroveSegmentedWrapperProbes
              : msg.report?.scope?.startsWith('segmented-leaves-')
                ? advanceMangroveSegmentedLeavesProbes
                : advanceMangroveSegmentedCanonicalProbes
        )(msg.doc, msg.brand, msg.report, msg.buildResult),
      });
      return;
    }
    if (msg.type === 'remove-capability-probes') {
      post('operation', {
        result: await removeMangroveCapabilityProbes(msg.report),
      });
      return;
    }
    if (msg.type === 'audit-capability-probes') {
      const reconciliation = await refreshMangroveCapabilityProbeLedger(
        msg.report
      );
      post('operation', {
        result: {
          ...msg.report,
          reconciliation,
          errors: reconciliation.errors,
        },
      });
      return;
    }
    if (msg.type === 'inspect-capability-probes') {
      post('operation', {
        result: await inspectMangroveCapabilityProbeLedger(msg.report),
      });
      return;
    }
    if (msg.type === 'compare-override-probes') {
      post('operation', {
        result: await compareMangroveOverrideProbes(
          msg.rootId,
          msg.buildResult
        ),
      });
      return;
    }
    if (msg.type === 'remove-override-probes') {
      post('operation', {
        result: await removeMangroveOverrideProbes(msg.rootId),
      });
      return;
    }
    if (msg.type === 'export-review') {
      post('export', {
        result: await exportMangroveReview(msg.name, {
          scale: 2,
          familyId: msg.familyId,
        }),
      });
      return;
    }
    if (msg.type !== 'import') return;
    const result = await importVariables(
      msg.doc,
      msg.modes,
      msg.prune,
      msg.textStyles,
      msg.effects
    );
    post('result', { result });
    figma.notify(
      `Mangrove variables: ${result.counts.created} created, ` +
        `${result.counts.updated} updated. See the plugin report for styles` +
        (result.errors.length ? `, ${result.errors.length} errors` : '')
    );
  } catch (error) {
    post('error', { message: errorMessage(error) });
  }
};
