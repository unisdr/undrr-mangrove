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
