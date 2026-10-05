# Holistic catalogue implementation

The user requested the full remaining Mangrove catalogue on 5 October 2026,
including higher-order landing, news/article and syndicated-search patterns.
This supersedes the earlier broad-expansion freeze for the retained feature
spike. The intended reduced token/style maintenance merge remains separate.

## Scope and acceptance

Reconcile actual source units, exported components, CSS patterns, authored states
and page compositions against existing recipes and bounded native evidence.
Story counts, recipe family counts and public component counts are different.
Record partial contracts rather than calling a source unit complete because one
preset exists. Use current JSX/SCSS, source assets and rendered browser fixtures
as the source of truth.

Implement reusable foundations and components before dependent compositions.
Pages must use actual source layout/content and linked reusable components;
generic placeholders do not satisfy landing, news/article or search coverage.
Where the existing builder lacks a required capability, implement and verify the
capability or leave the affected contract explicitly open. Do not silently
replace it with an easier unrelated subset.

Required evidence includes source guards, token/style bindings, meaningful
authored states, identity-preserving repeated builds, supported consumer edits,
browser comparison and staged native structural/visual validation. Track
responsive presets, brands, fonts and script boundaries at the scope actually
verified. Applicable code mappings and reusable-instance behaviour belong to
integration QA. Native library integration, selective publication and consumer
update/restoration are distinct from recipe and mock completion.

## Current starting point

- Normal source catalogue: 32 construction families and 383 variants.
- Published checkpoint scope: 25 families and 297 variants, subject to its
  documented per-family limitations. This is checkpoint evidence, not a fresh
  native revalidation.
- Separate source draft packet: 32 families and 133 bounded variants, deliberately
  non-importable. The original nine families/28 variants are joined by
  SectionHeader, Imagecaption, EmbedContainer and three authored Card families.
  Search controls add four families/15 variants. Page prose, closed chrome,
  bulleted contents lists and quotes add five families/26 variants. These are
  bounded parts of the requested compositions. Three report families/six variants
  now provide the complete finite authored English closed-chrome report scene
  at390/1164, and three open navigation families/24 variants preserve actual
  desktop About/OurWork/Sendai/News, mobile All/section surfaces and capped CTA wrapping. Other page templates and the
  syndicated search widget remain under implementation; native page gates remain
  open. Two news dependency families/six variants now preserve the actual no-image
  header and device-share available/unavailable branches. Full article assembly
  remains open. See [news dependencies](news-detail.md). See [report composition](landing-report.md). See [search controls](search-controls.md),
  [page prose](page-patterns.md), [closed chrome](page-chrome.md) and
  [reading patterns](page-reading.md).
  Cloned existing Editorial CTA (23 variants) and source Button as
  `page-chrome-button` (16 variants) are explicit dependencies, not new drafts
  or publication claims. See [draft scope](../COMPONENT-DRAFTS.md) and
  [browser observations](../SOURCE-BROWSER-STATUS.md).
- Desktop launch and screenshots work. The restored-window interaction probe
  fails `window_not_focused`, reporting no focused window. Both relevant
  permissions report granted. Unchanged retries are stopped.

Bounded native evidence now includes [UNDRR SectionHeader](NATIVE-SECTION-HEADER-EXPERIMENT.md)
and [gradient alpha semantics](GRADIENT-CAPABILITY.md), alongside the earlier
Tag, SVG and named-font probes. None closes ordinary desktop or publication gates.

## Work coordination

Initial audits are divided into reusable components, syndicated search and page
patterns. Their source paths, dependency graphs, coverage and missing contracts
will form the implementation backlog. Subagents own separate files; shared
builder/exporter changes and native writes are coordinated centrally. Independent
expert review is required for meaningful fixes and new evidence.

The resumable state ledger is
`/tmp/design-system-state-mangrove-holistic-20261005.json`. It records the current
checkpoint, authoritative evidence paths, completed work, pending validations and
blockers. Native creation must record exact returned IDs and target keys there.
Never infer node IDs or authorize cleanup from approximate names.

Use separate unpublished experiment files, with the
[native experiment gate](../DRAFT-NATIVE-EXPERIMENT.md), before promoting drafts.
Preserve canonical identities, consumers, recovery isolation, all deliveries,
`.fig` backups, History and `RC2-DECISIONS.md`. No source/browser result closes the
native recovery, deliberately changed styles, human handoff or reduced merge
acceptance gates.
