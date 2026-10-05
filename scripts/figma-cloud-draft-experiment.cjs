'use strict';

const assert = require('assert');
const {
  buildDraftPacket,
  validateDrafts,
} = require('./build-figma-component-drafts.cjs');
const { buildConnector } = require('./build-figma-connector.cjs');
const { validateExperimentFileKey } = require('./figma-experiment-target.cjs');
const FILE_KEY = 'GbVTvFbuWjoJr6Bf5t4fhg';
const COLLECTION = 'Mangrove holistic experiment 2026-10-05 GbVTvFbu';
const copy = value => JSON.parse(JSON.stringify(value));

function buildCloudDraftDocument({ fileKey, familyIds } = {}) {
  validateExperimentFileKey(fileKey);
  if (fileKey !== FILE_KEY)
    throw new Error(
      'Only the recorded empty cloud experiment target is allowed.'
    );
  if (
    !Array.isArray(familyIds) ||
    !familyIds.length ||
    new Set(familyIds).size !== familyIds.length
  )
    throw new Error('Choose unique draft family IDs explicitly.');
  // Rebuild from current guarded recipes. Never trust a stale external packet or
  // attach canonical guidance to a different experimental component cohort.
  const packet = buildDraftPacket();
  assert.strictEqual(packet.kind, 'mangrove-component-source-drafts');
  const families = familyIds.map(id => {
    const matches = packet.draftFamilies.filter(family => family.id === id);
    if (matches.length !== 1) throw new Error(`Unknown draft family ${id}`);
    return matches[0];
  });
  validateDrafts(families, packet.foundationCatalogue);
  const foundation = packet.foundationCatalogue;
  const doc = copy({
    collection: COLLECTION,
    modes: foundation.modes,
    variables: foundation.variables,
    styles: foundation.styles,
    components: { version: 1, families, limitations: packet.limitations },
    experiment: {
      kind: 'unpublished-cloud-draft-experiment',
      fileKey,
      source: packet.source,
      baseContract: packet.baseContract,
      sourceOnlyPacketKind: packet.kind,
      targetMetadataIsNotEnforcement: true,
      desktopAcceptance: false,
      publicationAcceptance: false,
    },
  });
  return doc;
}

async function compileCloudDraftOperation({
  fileKey,
  familyIds,
  operation,
  brandId,
  variantIds,
  variableIds,
  styleIds,
} = {}) {
  if (!['import', 'build'].includes(operation))
    throw new Error(
      'Cloud draft experiment only supports explicit import/build.'
    );
  const doc = buildCloudDraftDocument({ fileKey, familyIds });
  return buildConnector({
    operation,
    doc,
    brandId,
    familyIds,
    variantIds,
    variableIds,
    styleIds,
    experimentFileKey: fileKey,
  });
}

module.exports = {
  FILE_KEY,
  COLLECTION,
  buildCloudDraftDocument,
  compileCloudDraftOperation,
};
