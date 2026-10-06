/* global figma, __html__, importVariables, errorMessage, inspectMangroveMaintenance, MG_MAINTENANCE_SOURCE */
// This entry cannot build, reorganise, publish or prune component assets.
figma.showUI(__html__, { width: 540, height: 680, themeColors: true });
let maintenanceBusy = false;
figma.ui.onmessage = async msg => {
  if (msg.type === 'close') {
    if (!maintenanceBusy) figma.closePlugin();
    return;
  }
  if (maintenanceBusy) return;
  maintenanceBusy = true;
  try {
    let result;
    if (msg.type === 'maintenance-source') {
      if (typeof MG_MAINTENANCE_SOURCE === 'undefined')
        throw new Error(
          'Rebuild the maintenance plugin to bundle its source data.'
        );
      result = MG_MAINTENANCE_SOURCE;
    } else if (msg.type === 'import') {
      if (msg.doc?.nativeCollections !== undefined)
        throw new Error(
          'Partition profiles require the isolated construction runtime.'
        );
      if (msg.prune)
        throw new Error('Retirement requires a reviewed migration.');
      if (typeof msg.effects !== 'boolean')
        throw new Error('Select whether to import effects.');
      result = await importVariables(
        msg.doc,
        msg.modes,
        false,
        msg.textStyles,
        msg.effects
      );
    } else if (msg.type === 'maintenance-inspect') {
      result = await inspectMangroveMaintenance(msg.collection);
    } else throw new Error(`Unsupported maintenance operation ${msg.type}`);
    figma.ui.postMessage({
      type: 'result',
      operation: msg.type,
      requestId: msg.requestId,
      result,
    });
  } catch (error) {
    figma.ui.postMessage({
      type: 'error',
      operation: msg.type,
      requestId: msg.requestId,
      message: errorMessage(error),
    });
  } finally {
    maintenanceBusy = false;
  }
};
