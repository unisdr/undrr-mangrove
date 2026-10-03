/* global figma, __html__ */
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

figma.showUI(__html__, { width: 440, height: 680, themeColors: true });

// Figma API rejections can be strings rather than Error instances.
function errorMessage(error) {
  return error && error.message ? error.message : String(error);
}

function post(type, payload) {
  figma.ui.postMessage(Object.assign({ type }, payload));
}

async function findOrCreateCollection(name, firstModeName) {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const existing = collections.find(c => c.name === name);
  if (existing) return { collection: existing, created: false };
  const collection = figma.variables.createVariableCollection(name);
  collection.renameMode(collection.modes[0].modeId, firstModeName);
  return { collection, created: true };
}

function ensureModes(collection, modes, created) {
  const modeIds = {};
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
  if (!doc.styles) return { counts, errors, missingFonts: [] };
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
    const byId = new Map(
      local.map(style => [style.getPluginData(STYLE_ID_KEY), style])
    );
    const byName = new Map(local.map(style => [style.name, style]));
    for (const spec of specs) {
      let style = byId.get(spec.id) || byName.get(spec.name);
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
        if (kind === 'text') {
          style.fontName = value.fontName;
          style.fontSize = value.fontSize;
          style.lineHeight = value.lineHeight;
          style.setBoundVariable('fontFamily', family);
          style.setBoundVariable('fontSize', size);
        } else {
          style.effects = effects;
        }
        style.name = spec.name;
        style.description = spec.description || '';
        style.setPluginData(STYLE_ID_KEY, spec.id);
        counts[kind][existing ? 'updated' : 'created'] += 1;
      } catch (error) {
        // Do not leave a new, partly configured style after a failed import.
        if (style && !existing) style.remove();
        counts[kind].failed += 1;
        errors.push(`${spec.name}: ${errorMessage(error)}`);
      }
    }
  }
  return { counts, errors, missingFonts: [...missingFonts] };
}

async function importVariables(
  doc,
  selectedModeIds,
  prune,
  textStyles,
  effects
) {
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
  const byId = new Map();
  const byName = new Map();
  local.forEach(v => {
    const id = v.getPluginData(ID_KEY);
    if (id) byId.set(id, v);
    byName.set(v.name, v);
  });

  const counts = { created: 0, updated: 0, removed: 0, values: 0 };
  const resolvedByName = new Map();
  const wanted = new Set();

  // Pass 1: every variable exists with the right name, type and metadata,
  // so pass 2 can alias to any of them regardless of order.
  for (const spec of doc.variables) {
    wanted.add(spec.id);
    let variable = byId.get(spec.id) || byName.get(spec.name);
    if (variable && variable.resolvedType !== spec.type) {
      variable.remove();
      variable = null;
    }
    if (variable) {
      counts.updated += 1;
      if (variable.name !== spec.name) variable.name = spec.name;
    } else {
      variable = figma.variables.createVariable(
        spec.name,
        collection,
        spec.type
      );
      counts.created += 1;
    }
    try {
      variable.setPluginData(ID_KEY, spec.id);
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
    const id = v.getPluginData(ID_KEY);
    return id && !wanted.has(id) && !v.removed;
  });
  if (prune) {
    stale.forEach(v => v.remove());
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
    modes: modes.map(m => m.name),
    counts,
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
  if (msg.type !== 'import') return;
  try {
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
