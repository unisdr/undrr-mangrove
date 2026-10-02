/* global figma, __html__ */
/**
 * EXPLORATORY: imports mangrove-variables.json (written by
 * scripts/build-figma-tokens.cjs) into local Figma variables.
 *
 * Re-running is an update, not a second copy: variables are matched by the
 * Mangrove token id stored in plugin data, then by name, so a token renamed
 * in YAML renames its Figma variable and keeps every binding to it.
 */
const ID_KEY = 'mgId';

figma.showUI(__html__, { width: 400, height: 520, themeColors: true });

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
          error.message
      );
    }
  });
  return { modeIds, errors };
}

async function importVariables(doc, selectedModeIds, prune) {
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
      errors.push(`${spec.name}: ${error.message}`);
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
        errors.push(`${spec.name} [${mode.name}]: ${error.message}`);
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

  return {
    collection: collection.name,
    modes: modes.map(m => m.name),
    counts,
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
    const result = await importVariables(msg.doc, msg.modes, msg.prune);
    post('result', { result });
    figma.notify(
      `Mangrove: ${result.counts.created} created, ` +
        `${result.counts.updated} updated` +
        (result.errors.length ? `, ${result.errors.length} errors` : '')
    );
  } catch (error) {
    post('error', { message: error.message });
  }
};
