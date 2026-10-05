/* global figma, mgReadIdentity */
/** Read local bridge identities without loading construction or layout helpers. */
async function inspectMangroveMaintenance(collectionName = 'Mangrove') {
  if (typeof collectionName !== 'string' || !collectionName.trim())
    throw new Error('A collection name is required.');
  const collections = (
    await figma.variables.getLocalVariableCollectionsAsync()
  ).filter(collection => collection.name === collectionName);
  if (collections.length > 1)
    throw new Error(`Ambiguous collection ${collectionName}`);
  const collection = collections[0];
  const variables = (await figma.variables.getLocalVariablesAsync())
    .filter(
      variable => collection && variable.variableCollectionId === collection.id
    )
    .map(variable => ({
      id: variable.id,
      tokenId: mgReadIdentity(variable, 'mgId'),
      key: variable.key,
      name: variable.name,
      type: variable.resolvedType,
      hiddenFromPublishing: variable.hiddenFromPublishing,
      scopes: variable.scopes,
      valuesByMode: variable.valuesByMode,
    }));
  const styles = [];
  for (const [kind, assets] of [
    ['text', await figma.getLocalTextStylesAsync()],
    ['effect', await figma.getLocalEffectStylesAsync()],
  ])
    for (const asset of assets) {
      const tokenId = mgReadIdentity(asset, 'mgStyleId');
      if (tokenId)
        styles.push({
          id: asset.id,
          key: asset.key,
          name: asset.name,
          tokenId,
          kind,
        });
    }
  return {
    operation: 'maintenance-inspect',
    capturedAt: new Date().toISOString(),
    collection: collection && {
      id: collection.id,
      key: collection.key,
      name: collection.name,
      modes: collection.modes,
    },
    variables,
    styles,
    errors: [],
  };
}
