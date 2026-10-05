# Maintenance split

Source dependency assessment, 5 October 2026. This proposes a reduced token/style maintenance path and a retained full builder for occasional use, following [the PR direction](https://github.com/unisdr/undrr-mangrove/pull/1319#issuecomment-5993683966). The independent maintenance path is now implemented on the feature branch; the reduced PR selection is not yet accepted. The historical assessment below records the pre-extraction coupling. Native top-level Button publication passes; broader component publication, publication through the new maintenance entry and designer handoff remain separate gates.

## Baseline and method

The exact PR #1319 GET reports base `spike/react-aria-surface` at `f5792a9f1164b262ff5c5fc961395300bc7b17f0` and published pilot head `dbd7ce100c06f618549346305f5648998a53c7be`. Use that base when reviewing this proposal. The local branch named `spike/react-aria-surface` is older; its merge-base diff includes unrelated work. Normal GitHub listing endpoints are suppressed for this organisation; this assessment uses the exact PR endpoint.

The audit reads the actual CommonJS dependencies, concatenated plugin source list, controller/UI messages and mock entry points. A read-only exporter invocation measured arrays immediately before component recipes and after the complete build. Working guidance changes do not establish a new published release.

| Export stage              | Variables | Text style definitions | Effect definitions |
| ------------------------- | --------- | ---------------------- | ------------------ |
| Before component recipes  | 219       | 60                     | 3                  |
| Complete current exporter | 520       | 102                    | 8                  |

Recipes currently supply 301 additional variables, 42 text templates and five effects. Definition counts are not the native or published style selection: the bounded release has 36 text styles and eight effects. Removing recipes without replacing this enrichment would change the maintenance catalogue and leave existing component roles outside the reduced exporter.

## Proposed file cohorts

| Cohort                  | Current files and proposed treatment                                                                                                                                                                                                                             |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Token engine            | Keep the existing `scripts/build-tokens.cjs` engine and its exported loading, layering, merge, resolve and naming helpers. Preserve existing CSS generation.                                                                                                     |
| Maintenance exporter    | Extract the variables/styles portion of `scripts/build-figma-tokens.cjs`, including SCSS control/font/mixin parsing. Give it an independent output and freshness check that does not load recipes, probes, Storybook inventory or the full runtime.              |
| Shared bridge roles     | Separate source-backed helper-role and style generation from `scripts/figma-component-recipes.cjs` and its family recipe modules. Retain the IDs, values, aliases and metadata needed by existing published components; do not freeze a generated DTO as source. |
| Maintenance plugin      | Keep `kit-identity.js` and extract import validation, asset matching and variable/style upserts from `code.js`. Provide a small controller/interface, manifest and bundle entry. Retain downloadable receipts, safe defaults and useful read-only inspection.    |
| Occasional full builder | Preserve `scripts/figma-*-recipes.cjs`, both source probe modules, planned inventory/guidance, `kit-builder.js`, layout/navigation/Welcome and the full development interface in the reproducible checkpoint.                                                    |
| Maintainer diagnostics  | Preserve acceptance helpers, `kit-*-capabilities.js`, font diagnostics, native audits, connector tooling and their mocks in the checkpoint. A separate diagnostics build is an option; it requires dispatch and dependency changes, not deletion from a list.    |

These are logical boundaries to extract, not whole files that can already be removed safely. The retained checkpoint must include lockfile, exact source commit, setup instructions, required source/media assets and complete builder tests. A moving feature branch alone is insufficient for reproducibility.

## Coupling at the pre-extraction audit

1. **Exporter construction is unconditional.** `buildFigmaVariables()` invokes component recipes, Segmented/Form Action probe builders, planned inventory and kit guidance. Writing output and `--check` also invoke `build-figma-plugin.cjs`. `--stdout` avoids bundling but still constructs the full DTO. There is no current foundations-only exporter entry.
2. **Recipes also own maintenance data.** They mutate the supplied variables and style arrays, sometimes replacing an existing definition. Extract those computations before excluding anatomy, review specimens or media. Compare complete records, not just counts. Existing published helper aliases and literal measurements need an explicit owner and update policy.
3. **The desktop bundle is one global program.** `build-figma-plugin.cjs` concatenates 19 modules and embeds default kit guidance. `code.js` dispatches import, builder, layout, navigation, inspection and diagnostic operations; `ui.html` sends them and manages their results. Removing a module without removing or rerouting its actions leaves missing functions and misleading controls.
4. **Read-only features have construction dependencies.** `kit-navigation.js` uses `mgLayoutIndex` from `kit-layout.js`; Welcome also uses layout helpers. `kit-inspection.js` combines structural reads with focus diagnostic creation and review export. Decide which read-only helpers belong in maintenance, then extract them instead of retaining the whole hierarchy merely to inspect it.
5. **Connector extraction relies on source text boundaries.** `build-figma-connector.cjs` extracts preflight and runtime portions from `code.js` by function names and UI-handler markers. It selects builder or inspection runtime and deliberately omits layout. A controller refactor needs shared exported functions or updated boundaries and scope tests. Connector component writes do not become safe for organised files through this split.
6. **Existing tests have different loading boundaries.** `dev/mock-figma.cjs` already evaluates only identity plus `code.js` for importer operations. UI mocks execute the full interface; builder/layout tests load their corresponding runtime cohorts. Preserve importer regressions in the reduced path and the full builder/override suite in the checkpoint. Do not remove a test simply because its runtime leaves the merge target.

`figma-planned-inventory.cjs` brings Babel/Storybook parsing into the export graph. The connector uses Terser; its direct package dependency was added by this spike. A reduced maintenance path need not require these capabilities, but remove a dependency only after confirming no remaining entry point needs it. Keep all required dependencies in the full checkpoint.

## Safest implementation order

1. Save a full immutable source checkpoint and verify that its lockfile installation, generation, builder mocks and documented plugin entry work independently. Preserve native evidence and canonical keys.
2. Extract helper variables/styles with no semantic DTO changes. Compare the old and extracted outputs, including alias closure, source guards and full records for all five brands.
3. Add a separate maintenance exporter and plugin entry. Their generation/check paths must work when builder, probes and inventory modules are unavailable. Keep the full entry functioning until the split is reviewed.
4. Limit the maintenance interface to implemented operations. Preserve source token IDs, shared/private identity conflict checks, safe font failure, idempotent styles, scopes, publishing visibility and code syntax. Default pruning off; retirement remains a reviewed migration.
5. Review the actual reduced PR diff against the current React Aria base, then validate native maintenance and published consumer updates. Scope documentation, retained checkpoint and designer handoff need their own acceptance.

A narrower 219-variable foundation export could be an explicit alternative scope. It would leave recipe-added roles/templates outside source maintenance and needs a documented compatibility policy. Do not call it equivalent to the current 520-variable catalogue or prune the omitted roles.

## Minimum validation before accepting the split

- **Source compatibility:** token Jest suites and unchanged CSS output; complete variable/style DTO comparisons for five brands, with source guard failures still reported. Check alias cycles, alpha casts, shorthand mapping, private metadata and skipped-token reporting.
- **Dependency isolation:** reduced generation, freshness check and runtime execute without loading construction/probe/inventory modules. The retained full checkpoint still installs and generates reproducibly.
- **Importer regression:** actual importer runtime tests retain repeat identity, one-mode brand switch, five-mode updates, alias ordering, font failures, style bindings and code-syntax removal guards. Update UI tests for complete receipts, busy states and inspection freshness.
- **Native maintenance:** capture the existing kit, import without pruning, repeat and verify canonical variable/style identities, values, aliases and component/consumer retention. A mock pass does not establish native API behaviour.
- **Published delivery:** publish only reviewed assets, accept a bounded token/style update and restoration in the consumer and verify edited properties, modes, links and rendered layout. Preserve the existing token evidence; validate any changed import implementation again.
- **Ownership boundary:** record source-owned and manually maintained families. Ensure a future full builder cannot update manual mains through dependencies. Consumer override preservation does not establish arbitrary main-edit preservation. The top-level Button recipe update/restoration is exercised; other families and composite update contracts need separate acceptance.

Run the repository's required lint and touched-file formatting checks alongside focused tests. GitHub Actions are unavailable for this organisation. The feature PR still retains the full builder. The independent maintenance entry and ownership registry are implemented; native evidence and actual reduced-cohort checks are recorded in the implementation checkpoint below.

## Implementation checkpoint, 5 October 2026

- `build:figma-maintenance` generates and checks its own JSON and bundle independently. Its bundle contains identity helpers, the shared importer, local inspection and its own controller. Bundled source and pasted JSON avoid repeated native picker interactions.
- Twenty shared asset modules retain source guards and complete variable/style records, order and alias closure. Both exporters use the same asset derivation, while recipes retain component anatomy. The Form Action precision guard points to the extracted foundation module.
- Independent comparison against the captured pre-extraction baseline passes for all 520 variables, 102 text definitions, eight effects and five brands. All 32 family/383-variant component DTOs remain unchanged. The maintenance generation/check runs with construction, probes, inventory, guidance, Babel and Terser blocked.
- The full builder has an explicit source/manual policy, selected dependency refusal and reviewed source handback. Installed v2 layout/guidance preserves manual grids, reviews and descriptions. Invalid metadata and unsafe migrations refuse before writes. Welcome's anatomy/font validation remains strict.
- Standalone defaults have no full controller/exporter dependency; `--compare-full` adds full-spike comparisons deliberately. The file-level [merge manifest](maintenance-merge-scope.json) defines the reviewable cohort and package/ignore edits. The current draft PR is not automatically reduced by adding this entry.
- An actual temporary checkout overlays only the 35 manifest files on the exact React Aria base and applies the listed package/ignore edits. All 44 construction-related paths checked are absent before and after generation. Independent generation/check, both default mocks, 1,328 token tests and lint pass. Five generated CSS partials are byte-identical to the exact base. This initial check reused installed dependencies.
- A subsequent fresh-install check finds stale workspace peer metadata in the exact base lockfile: its package already declares the React Aria peer and optional peers. The manifest specifies the required eight-line metadata adjustment while retaining every base dependency resolution. With that adjustment, `yarn install --immutable` passes using downloaded package archives and new local `node_modules`. Inherited Yarn configuration disables dependency build scripts; this does not accept optional/native dependency builds. Do not copy the full feature lockfile, which includes spike-only Terser changes.
- The initially measured cohort totals 11,181 lines, including the retained 986-line base token engine; the net new content is 10,195 lines. The later lockfile instructions add no resolved packages. The 20 source extraction modules carry guarded helper-role values rather than frozen generated data. This remains a substantial review, despite excluding construction and experiment tooling.
- Native standalone imports and repeat pass against the existing library: 520 reused variables, 2,600 mode values, 54 installed text styles and eight effects, with zero new assets/errors. Repeat captures preserve all 79 recorded scene digests and four foundation fingerprints. The first import normalises zero letter spacing; historical font metadata differences remain separately qualified.
- Native manual ownership refuses direct Button and dependent Text CTA builds before reported writes in an unpublished recovery copy. Source handback permits two zero-creation/error rebuilds. Exact geometry repeat does not pass: section receipts change by less than 0.002px and three geometry digests differ. A later read-only capture is stable; the first node causing the rebuild discrepancy remains to be identified.
- The new entry's published token probe was not applied because desktop controls stopped accepting input. Source spacing remains 30px in all modes. Retained full-plugin token evidence and the successful 15px to 20px to 15px top-level Button rehearsal do not substitute for this new-entry publication gate.

Read [the maintenance guide](MAINTENANCE.md) for supported operations and boundaries. The paid status and PR distinguish native evidence from local mocks and the human handoff gates.
