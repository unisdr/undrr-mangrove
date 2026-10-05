# Storybook references and kit maintenance

Research date: 4 October 2026. Mangrove uses Storybook 10.6 and already registers `@chromatic-com/storybook`. Service access and project credentials have not been verified. Organisation Actions remain unavailable, so this spike is checked locally.

## Available routes

| Route                            | What it helps with                                                                                                          | Next step                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source previews in this importer | Opens public source examples from the generated inventory. Works with the current Free file and needs no credentials.       | Load the current JSON, open Diagnostics > Source previews in Storybook, select a component and example. Public deployment may differ from this draft branch.                                                                                                                                                                                     |
| `@storybook/addon-designs`       | Embeds Figma, web or image references beside source stories. Version 11 supports Storybook 10.                              | Add selected `parameters.design` mappings after the kit's cloud URL and viewing permissions are confirmed. No package has been added in this checkpoint. [Maintainer documentation](https://github.com/storybookjs/addon-designs)                                                                                                                |
| Storybook Connect                | Links native components, variants or instances to interactive Chromatic previews. Works on any Figma plan with edit access. | Obtain Chromatic project collaborator access and a published story. The documented workflow requires Chromatic; localhost is not a documented substitute. [Figma guidance](https://help.figma.com/hc/en-us/articles/360045003494-Storybook-and-Figma), [Chromatic setup](https://www.chromatic.com/docs/figma-plugin/)                           |
| Figma in Chromatic               | Shows linked components beside stories for comparison.                                                                      | Connect the authorised project and Figma account when access is available. [Official integration](https://www.chromatic.com/docs/figma-in-chromatic/)                                                                                                                                                                                            |
| Code Connect                     | Supplies source code snippets and property mappings in Dev Mode.                                                            | Requires Organization or Enterprise with a Dev or Full seat. Professional alone does not enable it. Use maintained templates; the legacy Storybook parser is no longer maintained. [Access and templates](https://developers.figma.com/docs/code-connect/), [Storybook parser notice](https://developers.figma.com/docs/code-connect/storybook/) |

These integrations provide references and comparisons. Native variables, styles, component anatomy and override preservation are still maintained by this exporter/importer. [Storybook design integrations](https://storybook.js.org/docs/sharing/design-integrations)

## Efficient local update loop

1. Finish and save any native probe report, then close the development plugin before rebuilding its files.
2. Run `node scripts/build-figma-tokens.cjs --check`. It compares expected JSON and runtime bytes without writing. A stale result names the outputs to regenerate.
3. Run `yarn build:figma-tokens` when needed. Unchanged bytes retain their file modification times. Reopen the plugin and select the new JSON explicitly.
4. Import the current brand without pruning, then build only affected families. Their construction dependencies are included. Token/style changes also need a review of dependent consumers; the tool does not yet calculate a complete change-impact plan.
5. Compare source previews with native declared presets, save inspection and operation reports, and repeat after restarting the plugin. Update the scope documentation when a consumer contract passes.

The preview identity comes from static source metadata and the installed Storybook CSF helpers. Internal catalogue identities remain source-path/export keys. Unsupported or dynamic source forms receive an unavailable-reference reason. Omitted links can still have a published story; omission is the parser's verification boundary. A source-derived link does not prove that the public deployment contains that story, matches this commit, or corresponds to a particular native variant. The importer does not fetch Storybook in the background or change its network permissions.

## Follow-up efficiencies

- Validate references against a fresh local Storybook `/index.json`, with explicit source revision and brand/locale.
- Generate an advisory changed-family/dependency plan from old and new DTOs, without automatic deletion or unreviewed migration.
- Stamp operation receipts with loaded DTO and runtime hashes so acceptance evidence identifies its exact inputs.
- Extend the existing source screenshot helper with bounded font/image readiness, explicit globals/args and evidence sidecars. Raster acceptance remains separate from saved-field audits.
- Reuse the existing component/AI manifests through a versioned adapter rather than maintaining another handwritten component catalogue. [Storybook manifest documentation](https://storybook.js.org/docs/ai/manifests)

Professional enables the planned multi-brand and shared-library workflow. It does not remove source fidelity, native override, font or responsive-layout acceptance work. See [the maintenance runbook](MAINTAINING-KIT.md) and [Card/Hero status](CARD-HERO-STATUS.md) for current evidence.

### Public reference check, 4 October 2026

The published Storybook index contains 598 entries. Of 391 generated reference URLs, 385 match the public story ID, source path and story type. Six new ComboBox examples are absent from that deployment. All 27 Card/Hero references are present. Another 23 source examples deliberately omit a URL because their source forms cannot be verified by this parser. These findings establish dated link presence, not branch, brand, native appearance or ongoing availability. [Published index](https://mangrove.undrr.org/index.json)

## Occasional-maintenance assessment, 5 October 2026

The [PR research comment](https://github.com/unisdr/undrr-mangrove/pull/1319#issuecomment-5993683966) adds `story.to.design` to the alternatives assessment. Its documented story-defined variants, reviewed updates, CSS-variable modes/aliases and nested components overlap the custom builder. This is a candidate for a bounded evaluation, not a validated replacement or a subscription decision. Test Mangrove source metadata, effect-style limitations, existing library/main/property identity and edited-consumer preservation before choosing it. The comment also identifies rendered capture tools and the MIT-licensed `storysync`; their suitability remains untested here.

Keep linking/embedding integrations such as Storybook Connect and addon-designs separate from native-library generation and capture tools. For the current kit, use meaningful release-time drift review rather than promise continuous synchronisation. Retain the full source builder for occasional construction work; the smaller token/style maintenance merge path needs a separate dependency audit and validation. Manually maintained mains need documented ownership and exclusion from automatic dependency rebuilds.
