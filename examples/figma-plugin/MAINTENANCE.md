# Maintaining Mangrove variables and styles

Use this entry at meaningful releases. It updates the foundations of the existing kit; component mains have a separate owner and review. The full construction spike is retained on `spike/figma-token-bridge` and in the handoff source checkpoint. This is an exploratory maintenance path, not a supported production library.

## Build and use

```sh
yarn install --immutable
yarn build:figma-maintenance
yarn build:figma-maintenance --check
```

Use Node.js 22 or later and the repository's pinned Yarn. The recorded checkpoint uses Node.js 24.18.0 and Yarn 4.17.0.

Import `examples/figma-plugin/maintenance/manifest.json` as a development plugin in Figma desktop. Run **Mangrove maintenance (exploratory)** in the canonical source file. Choose **Use bundled source**, which loads the data built with that runtime, or load the reviewed `mangrove-maintenance-tokens.json`. A paste fallback avoids native file-picker problems. Loading and inspecting do not import anything.

1. Inspect the installed collection and styles. Existing text styles are selected; a new file starts with nine core type roles. Choose any additional roles deliberately.
2. In the paid library select all five brands. In a one-mode file select one brand; re-import switches that mode while retaining variable identities.
3. Choose **Update variables and styles**, then **Save report**. Check errors, missing fonts, created IDs and retained stale variables. A failed import may have made partial changes; inspect again before retrying.
4. Review rendering in the source and a consumer. Publish only reviewed assets, then accept the update in the consumer and verify edited content, variant properties, dimensions, modes and stable published keys.

The importer never prunes. Renames use source IDs; removals require a reviewed migration because existing instances may still use the assets. Figma's publication dialog reselects pending drafts: deselect **Changes**, then choose the intended assets on every publication.

## What this maintains

The source-backed JSON retains the complete current catalogue: **520 variables**, **102 text definitions**, **eight effects** and **five brands**, including the helper roles used by existing components. Definition counts are not published style counts. The pilot publishes 508 variables, 36 text styles and eight effects; 12 variables stay hidden.

The exporter reuses the YAML token resolver and derives guarded SCSS/helper values. It loads no component recipes, construction runtime, capability packets, planned inventory, Storybook parser or connector minifier. The sample photograph is read only to verify the hash of the fixed geometry preset; it is not embedded in maintenance output. Source changes outside the supported representation fail with a source guard and need review.

Variables and styles retain shared/private identity checks, aliases, code syntax, scopes, private visibility and font failure reporting. Fonts are loaded before text style changes. Other style properties are materialised from the first selected brand; font family and size have variable bindings. Use the existing documented representation limits, including resolved RGBA for opacity casts and the focus-ring geometry limits.

The standalone plugin has no component builder, canvas migration, publication or diagnostic actions. Variable/style changes can still change bound component appearance, including manually maintained components.

## Main-component ownership

Before changing a generated main, choose one policy:

- **Source:** reflect the change in its recipe and validate a bounded rebuild, publication and edited consumer. Unmarked legacy families default to source.
- **Manual:** in the retained full plugin, check the family, open **Component maintenance ownership**, enter a reason and choose **Mark manually maintained**. Save the report. The complete selected dependency closure will refuse rebuilds involving that family, even if its own checkbox is off.

The policy is stored under `orgundrrmangrove/mgMaintenancePolicy` on canonical sets and variants as versioned JSON. Shared plugin data is public to other plugins; write a maintenance reason rather than sensitive information. See [Figma's API contract](https://developers.figma.com/docs/plugins/api/properties/nodes-setsharedplugindata/).

Installed v2 organisation preserves manual source boards, reviews, grids and main descriptions while other source families update. Unsafe migrations and malformed/conflicting policy metadata refuse before writing. Welcome still validates its Hero/Card dependencies and fonts; incompatible manual anatomy can block an organised build. Resolve that boundary explicitly rather than bypassing the source checks.

For a reviewed return to source, reflect the edits in the recipe or preserve a backup, tick the source handback acknowledgement and choose **Return to source maintenance**. This changes metadata only and permits later rebuilds to update the mains. Consumer overrides do not establish preservation of arbitrary main edits.

## Verification and limits

```sh
node examples/figma-plugin/dev/mock-maintenance-export.cjs
node examples/figma-plugin/dev/mock-maintenance.cjs
npx jest tokens --runInBand
yarn lint:check
```

Run touched-file Prettier and whitespace checks too. On the full spike, use `--compare-full` on both maintenance mocks to compare the retained exporter/controller. An optional `--baseline <json>` checks the exporter against a captured pre-extraction catalogue. Mock results do not establish native API or rendered acceptance.

The checkpoint records the native Button recipe update separately from token/style updates. Other families, arbitrary main edits, additional brands' component rendering, RTL/scripts, exact source font files, human novice tasks and Anders' transfer remain separate acceptance work. Imported `.fig` recovery copies get new local library keys; their consumers do not automatically reconnect to a replacement library. See the full [handoff](https://github.com/unisdr/undrr-mangrove/blob/c349ee884fffcaa172968d98d367914b7a66ceb0/examples/figma-plugin/MVP-HANDOFF.md) and [paid evidence](https://github.com/unisdr/undrr-mangrove/blob/c349ee884fffcaa172968d98d367914b7a66ceb0/examples/figma-plugin/PAID-KIT-STATUS.md).

### Native checkpoint, 5 October 2026

- The initial native maintenance checkpoint imports twice in the existing five-mode source: 520 reused variables, 2,600 mode values, 54 installed text styles and eight effects, with zero new assets or errors. Across 9,480 owned nodes, the repeat preserves all 79 recorded field digests and four foundation fingerprints. Aggregate digests are scoped evidence, not exhaustive component-key or visual acceptance.
- The first import normalises zero letter spacing on Tab text without changing the captured geometry. Historical font metadata differences are recorded separately; they cannot all be attributed to this import.
- The retained full builder publishes a bounded Button padding change from 15px to 20px and back. Three top-level consumer Buttons update and restore their dimensions; edited content and published keys remain stable. This does not establish propagation into independently published composite components.
- In an unpublished recovery copy, manual Button ownership refuses both Button and dependent Text CTA builds before reported writes. Source handback permits two Button builds, each with zero created nodes, 1,285 updated nodes and no errors. Exact canvas repeat remains open: three geometry digests differ; section receipts show an Examples height increase of 0.00146484375px and a Maintenance position change of 0.0009765625px. A subsequent read-only capture is stable. Render-bound rounding is a hypothesis requiring node-level investigation.
- Token publication through the standalone entry now passes after a user-assisted desktop reset. A reviewed fixture changes exactly one DTO leaf, UNDRR `spacing/300` from 30px to 32px; other brands stay at 30px. Both imports reuse all 520 variables, update 2,600 values, 54 text styles and eight effects without new assets or errors. Collection-only publication and native consumer acceptance capture the changed token, then bundled-source restoration returns it to 30px. No other assets are published.
- Figma lists five collection variables, including `radius/button`, whose `spacing/300` alias exists only in MCR2030. That mode stays at 30px and its UNDRR alias remains `spacing/50`; publication-list membership does not establish a changed UNDRR radius.
- The consumer restoration matches all 40 recorded field digests covering 5,237 field pairs across 169 records; nine explicit instance summaries and the user note remain unchanged. Stable token keys and remote values are verified. These scoped non-cryptographic summaries normalize remote variable-cache suffixes and exclude absolute render bounds; they do not establish raster or complete live-source equality. Deliberately changed text/effect-style publication remains unverified: those styles were imported from their existing source definitions.

Local verification passes: 1,328 token tests, lint with zero errors and 22 existing warnings, focused exporter/importer/UI/ownership/connector/layout checks, generation and freshness. An actual reduced checkout using the manifest passes its standalone checks with construction modules absent. A fresh reduced dependency installation also passes after the manifest's workspace peer metadata adjustment to the base lockfile. It reuses downloaded package archives, with new local `node_modules`; inherited Yarn configuration disables dependency build scripts. Optional/native dependency builds are not established by this maintenance check. GitHub Actions are unavailable.

The file-level intended merge cohort is recorded in [maintenance-merge-scope.json](maintenance-merge-scope.json). Apply its package/ignore edits and workspace peer metadata adjustment while retaining the base's resolved packages. Copying the full feature lockfile would include spike-only dependencies. The feature PR still contains the retained spike. Selecting that cohort into a reduced PR is a separate review; this document does not claim that the entire current PR is merge-ready.
