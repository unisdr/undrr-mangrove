# Figma integration and maintenance

Figma adapters, maintenance and construction plugins, recipe translation, tests and operating instructions belong in [UNDRR Mangrove Figma](https://github.com/PreventionWeb/undrr-mangrove-figma). Use that repository for occasional Figma updates and follow its setup, compatibility and validation instructions. Its maintenance and construction entries have separate purposes and acceptance gates.

Mangrove owns the token engine, token definitions, component implementations, styles and authored media. The Figma toolkit reads an installed Mangrove source checkout through `MANGROVE_SOURCE_ROOT`; it does not maintain a second editable set of these sources. Choose the source revision supported by the toolkit's `source-lock.json`, install its dependencies and prepare any generated source inputs required by the selected workflow. Required reference packages have separate provenance and checksums in the toolkit.

## Designer changes to Storybook

For selected designer changes, use the toolkit's [design-to-code runbook](https://github.com/PreventionWeb/undrr-mangrove-figma/blob/spike/mangrove-tooling-migration/docs/DESIGN-TO-CODE.md) and [change-request template](https://github.com/PreventionWeb/undrr-mangrove-figma/blob/spike/mangrove-tooling-migration/docs/templates/DESIGN-CHANGE-REQUEST.md). Implement component, token and style changes manually in Mangrove and review the affected Storybook stories. Record toolkit recipe impact separately. Native reconstruction, bulk export and library publication are separate workflows with their own acceptance; they are not required for every design change.

## Token-engine bridge contract

The toolkit loads `scripts/build-tokens.cjs` from the selected Mangrove checkout. The bridge uses `loadSources`, `layersFor`, `mergeLayers`, `resolve` and `TOKENS_DIR`. The module also exports `propertyName` to preserve the historical extraction interface. These exports expose the existing engine without changing its command-line behaviour or token resolution. This is a pinned build interface; selecting a different source revision requires the toolkit's compatibility checks rather than a promise of an independently versioned API.

## Migration and validation record

The [dedicated migration PR](https://github.com/PreventionWeb/undrr-mangrove-figma/pull/1) records tooling extraction and reference-retrieval checks. The preserved [upstream spike checkpoint](https://github.com/unisdr/undrr-mangrove/tree/d5e790d3b0318730fdbd270279f340f35a2833ab) remains the historical source and evidence record. The dedicated repository owns current workflow documentation and indexes immutable historical deliveries separately from executable reference inputs.

Successful repository migration and local output checks do not establish native Figma rendering, font equivalence, edited-instance preservation, library publication or consumer acceptance. Consult the toolkit's release-validation status before treating an asset as accepted. Native backups, consumer files and unpublished recovery checkpoints remain separate from source packages.
