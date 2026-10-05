/** Shared source-backed asset enrichment. No component trees or diagnostic packets. */
'use strict';

function enrichFigmaMaintenanceAssets(context) {
  // Preserve the full builder's asset order, including replacements in place.
  require('./figma-maintenance-component-assets.cjs').buildComponentAssets(
    context
  );
  require('./figma-maintenance-cta-assets.cjs').buildTextCtaAssets(context);
  require('./figma-maintenance-choice-assets.cjs').buildChoiceAssets(context);
  require('./figma-maintenance-checkbox-assets.cjs').buildCheckboxAssets(
    context
  );
  require('./figma-maintenance-form-summary-assets.cjs').buildFormSummaryAssets(
    context
  );
  require('./figma-maintenance-switch-assets.cjs').buildSwitchAssets(context);
  require('./figma-maintenance-editorial-cta-assets.cjs').buildEditorialCtaAssets(
    context
  );
  require('./figma-maintenance-card-hero-assets.cjs').buildCardHeroAssets(
    context
  );
  require('./figma-maintenance-chip-assets.cjs').buildChipAssets(context);
  require('./figma-maintenance-details-assets.cjs').buildDetailsAssets(context);
  require('./figma-maintenance-select-assets.cjs').buildSelectAssets(context);
  require('./figma-maintenance-loader-assets.cjs').buildLoaderAssets(context);
  require('./figma-maintenance-empty-state-assets.cjs').buildEmptyStateAssets(
    context
  );
  require('./figma-maintenance-toc-assets.cjs').buildTocAssets(context);
  require('./figma-maintenance-status-label-assets.cjs').buildStatusLabelAssets(
    context
  );
  const { packet } =
    require('./figma-maintenance-segmented-assets.cjs').buildSegmentedAssets(
      context
    );
  require('./figma-maintenance-segmented-wrapper-assets.cjs').buildSegmentedWrapperAssets(
    { ...context, packet }
  );
}

module.exports = { enrichFigmaMaintenanceAssets };
