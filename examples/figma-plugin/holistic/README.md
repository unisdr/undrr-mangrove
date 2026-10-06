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
- Separate source draft packet: 109 families and 1460 bounded variants, deliberately
  non-importable. The original nine families/28 variants are joined by
  SectionHeader, Imagecaption, EmbedContainer and three authored Card families.
  Search controls add four families/15 variants, and internal result families add
  three families/76 variants with actual per-line source anatomy and meaningful
  item, field-visibility and result-state branches. See [search results](search-results.md). Page prose, closed chrome,
  bulleted contents lists and quotes add five families/26 variants. These are
  bounded parts of the requested compositions. Three report families/six variants
  now provide the complete finite authored English closed-chrome report scene
  at390/1164, and three open navigation families/24 variants preserve actual
  desktop About/OurWork/Sendai/News, mobile All/section surfaces and capped CTA wrapping. Additional page templates and live
  syndicated search behavior remain under implementation; native page gates remain
  open. Two news dependency families/six variants now preserve the actual no-image
  header and device-share available/unavailable branches. A further six related
  news-card presets retain their exact source photograph, finite title caret
  layout and supported Summary edits. Finite full article source scenes are now registered; native assembly
  acceptance remains open. See [news dependencies](news-detail.md). See [report composition](landing-report.md). See [search controls](search-controls.md),
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

See [native integration status](NATIVE-INTEGRATION-STATUS.md) for the current
source-to-native boundary, complete archived list failures and the remaining
integration/publication gates.

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

The source packet also includes news taxonomy/recommendations (four presets) and ContentHub (thirteen families/151 presets), including34 genuinely nested scenes covering all17 recorded source contexts at390/1164. These are finite source contracts; additional Hub callers and full news/image-header composition remain in progress. Native fonts, UA markers, linked-title/caret reflow and complete-scene publication remain separate gates. See [news](news-detail.md) and [ContentHub](content-hub.md).

The historical committed source46/334 checkpoint and its immutable delivery remain preserved. The original98-row reusable-unit classification is unchanged; these current packet counts do not constitute a fresh whole-catalogue or native acceptance audit.

The current source packet also registers eight image-bearing article-header presets, with genuine reusable no-image header dependencies where the source uses them. All five brand-mode source/mock checks and an independent expert review pass for this finite cohort. Header images, fonts, native cropping/pixels and full article composition remain open. See [the header contract](news-detail.md).

Copy/Cite adds four source families/60 finite presets with350 actual source captures. Source copies, supported edits, all-five rebuilds and expert review pass. The current source owns idle/copied/failed feedback, a genuine citation trigger,18 dialog states and four authored fallback details states. Historical copying/download assumptions are corrected in a separate source reconciliation. Native Menlo availability, glyph pixels, reflow, dialog/clipboard behaviour and publication remain open. See [Copy/Cite](copy-cite.md).

The contextual article HighlightBox adds one family/two source presets, preserving its titleless rich paragraph, source inset shadow and finite float allocation. All-five source/mock rebuilds, rich consumer edits and an independent review pass. The following desktop paragraph's varying line widths and native inset-shadow pixels remain composition gates. See [the float contract](news-float.md).

The reviewed syndicated widget adds seven source families/383 presets, preserving actual contextual dependencies and finite authored result/filter/drawer/pager surfaces. FormGroup, joined FormAction and Newsletter add three families/28 presets, with exact normal Checkbox/Radio dependencies kept separate. Initial article media adds one family/10 immutable brand/viewport player captures. All-five dedicated source-builder repeats and independent reviews pass. Native pixels, arbitrary content reflow, live search/submission/playback, library integration and publication remain open. See [the widget contract](search-widget.md), [forms](form-compositions.md) and [article media](news-article.md).

The source article exclusion adds one family/two presets: a normal editable narrow rich paragraph and the exact four desktop rich source lines around the highlight. The current-page frozen-copy guard refuses edited desktop copy before permanent writes. All-five actual builder tests and an independent review pass; native font/line pixels and changed-content reflow remain open. See [the exclusion contract](news-exclusion.md).

The complete finite NoHeroImage article adds one family/10 captured brand/viewport scenes with genuine nested prose, quotes, float/exclusion, player appearance, chrome, sharing, related cards, taxonomy, recommendations and initial feedback. Legend adds one family/10 authored continuous, categorical, stepped, vertical and grid presets. Dedicated all-five builder repeats and independent source reviews pass; source capture allocations, numeric/native font shapes, pixel equivalence, runtime states, library integration and publication remain open. See [article scenes](news-article-scene.md) and [Legend](legend.md).

The current packet also registers [full finite image article scenes](news-image-article-scene.md)
and [notification states](notification-states.md). Four image-bearing stories
provide40 genuine source scenes, with10 additional NoHeroImage scenes. Three
notification families provide18 source presets; their seven-variant status
clone is a separate dependency. Their source and dedicated all-five actual
builder reviews pass, while native rendering, runtime and publication gates
remain open. Gallery and CodeBlock source cohorts are registered below; native gates remain open.

StatsCard adds two source families/58 presets, with44 genuine item contexts and
14 nested scenes across seven authored configurations at390/1164. Tree adds
one family/14 finite source appearances, with real nested rows, links, selected
and toggle states. Their all-five dedicated builder, edit and exact-repeat
checks and independent reviews pass. Stats uppercase labels and translucent
linked summaries use reviewed shared capabilities. Numeric glyphs and native
raster remain open; Tree guide dash cadence is an explicit projection candidate.
See [StatsCard](stats-card.md) and [Tree](tree.md).

Gallery adds44 genuine image contexts, eight HTML appearances and four real mixed-media image states in three families. Real image responses are pinned; contained image extents and actual scaled HTML thumbnails retain source allocations. CodeBlock adds16 source presets with whole logical rich syntax TEXT, genuine language/filename/gutter/overflow branches and source font candidates. Their all-five dedicated actual-builder edit/two-repeat checks and independent source reviews pass. Gallery video/embed remain references, with remote loading failures recorded; native media/runtime, arbitrary HTML reflow, Menlo availability, font/glyph/raster and publication gates remain open. See [Gallery](gallery.md), [Gallery HTML](gallery-html.md) and [CodeBlock](code-block.md).

ShowMore and Scroll add five source families with63 presets, including real photo card identities and actual settled carousel positions. ErrorPage adds four families with26 presets and genuine search/challenge/request-details anatomy. Preview Access adds two families with10 actual static/live overlay states. Independent all-five actual-builder tests cover source fields, edited text and two zero-create repeats. Native mask fading, dashed outline raster, Menlo/source font equivalence, runtime behaviour, native integration and publication remain open. See [Scroll and ShowMore](scroll-show-more.md), [ErrorPage](error-page.md) and [Preview Access](preview-access.md).

Native capacity is a separate integration gate. The immutable source78 catalogue contains25,466 variables, exceeding Figma’s documented5,000-per-collection limit. Passing source tests do not establish a full native import. Source-proven helper reuse/allocation specialisation and deliberate collection partitioning are under independent review; no bindings or canonical assets have been changed. See [native capacity](NATIVE-CAPACITY.md).

Topic/Index adds eight families/50 variants, Drawer one/20, Cookie consent three/34 and Footer one/10. These independently reviewed cohorts were registered at the historical source106 checkpoint, with1298 bounded variants. Drawer uses a separate two-variant contextual Checkbox dependency: the exact normal Checked/Unchecked anatomy with the source-proven neutral-900 Label paint. The normal Checkbox remains unchanged. Complete combined packet verification passes deterministic generation, exact normal foundations and dependencies, actual importer refusal before writes and CLI guards. The combined scene lifecycle remains the original nine families/28 variants; the new cohorts have separate all-five builder, supported-edit and two-repeat evidence. At that checkpoint, PageHeader44, OnThisPageNav46, ImageFigure72 and Layout3/28 remained unregistered. The first three are now registered at source109; Layout remains a separate candidate. See [Topic/Index](landing-topic-index.md), [Drawer](drawer.md), [Cookie consent](cookie-consent.md) and [Footer](footer.md).

The immutable source93 packet contains55,171 variables. A read-only fixed producer/story/category ownership proposal preserves all records across59 requested collections, each below5000 source variables. Actual stale occupancy and native collection-count feasibility remain unverified. The committed opt-in font-free native collection profile passes its separate bounded production rehearsal; advanced full-catalogue support and canonical migration remain open.

PageHeader44, OnThisPageNav46 and ImageFigure72 have independent source/lifecycle acceptance and are now registered in the109-family/1460-variant source-only packet. ImageFigure is a bounded composition of the actual Images, Imagecaption, P and Imagecredit modules; it does not establish standalone primitive or native acceptance.

The orphan Image atom still imports three assets intentionally removed in the2023-01-06 cleanup (`eca8ef98`). Historical bytes are preserved externally for diagnosis. They have not been restored to the repository or substituted into the source catalogue. The current module has no active story/caller or package entry export; its disposition remains open.

Source109 registers the independently reviewed standalone PageHeader44, OnThisPageNav46 and ImageFigure72 source cohorts. Complete immutable packet and CLI terminal checks pass, preserving exact normal foundations and dependencies and actual importer refusal before mutation. Their dedicated all-five supported-edit/two-repeat lifecycles remain separate from the combined original9/28 scene fixture. CaptureTheme allocations, source fonts/masks/media and native/publication limits remain explicit. At that source109 checkpoint, Layout3/28 and semantic typography6/96 remained unregistered; they were subsequently registered in source118. The36 semantic followon specimens remain unsupported.

## Saved source118 registration

The saved source118 registry adds independently reviewed Layout foundations3/28 and semantic typography6/96 to the saved source109 checkpoint, giving118 families/1584 bounded variants. Its immutable combined packet and CLI checks passed with terminal exit0. Deterministic118/1584 source DTO and dependencies, actual source-only importer refusal, the original9/28 combined scene lifecycle and CLI output/check/overwrite/source guards passed. The registry checkpoint was committed as `7ae4a12f781640d5cef592a167f29b732313d465`; the immutable source109 delivery remains a separate preserved artifact. Dedicated all-five source, supported-edit and two-repeat evidence remains separate from the combined original9/28 scene fixture. The actual caller-dependent Container/Grid and FullWidth specimens retain their finite source limits. The semantic cohort covers Heading, Paragraph, copy separators, DescriptionList, Figcaption and inline emphasis;36 further Cite/Quotation/OL/UL/mixed Code/Abbr specimens remain unsupported. The packet remains non-importable, with native capacity, typography/rendering, publication, recovery and human acceptance gates open.

## Saved source119 registration

The independently reviewed standalone Logo family adds210 finite story/locale/viewport presets to saved118/1584, giving119 registered source families/1794 bounded variants. Actual1050 source captures and110 body-versus-normalized browser image pairs are preserved; dedicated all-five modeled builder/cache/linked placement/two-zero-create checks passed. Translated assets retain natural contain sizing; English/Japanese fallback autocrop uses source cover sizing. The immutable119 snapshot completed deterministic full DTO/dependency checks, actual source-only importer refusal, the bounded original9/28 scene lifecycle and all CLI guards. The preserved complete log records the final success message after every assertion; the expired tool handle leaves the shell exit code unobserved. The registry checkpoint was saved as `0980da3366cc2738c5ec5949d91f8900959a22a9`. It adds no foundation roles or styles and preserves existing dependencies. The original9/28 combined scene fixture remains a separate bounded test. Resource-URL repaint differences, native SVG chunk overlay/crop/raster, arbitrary resize and publication remain open. The source118 immutable delivery remains anchored to7ae4a12f; the saved119 registry does not regenerate that artifact.

The separate required semantic source-contract checkpoint `cda3a3385b57c94da69dfe5f841e6f2add4110ed` preserves36 contracts/180 source cases and returns `families:[]` with `sourceRecipeReady:false`. It adds no registered families or variants and does not implement native list, quotation, italic or inline-box behavior.

## Saved source120 finite Code registration

The independently reviewed finite inline Code family adds six English, Arabic and Japanese presets at390/1164, giving120 source families/1800 bounded variants. Thirty actual browser contexts cover all five brands. The portable producer verifies30 deterministic raw capture archives and retains60 contiguous source-copy fragments, measured line capacities, real Code padding/background/effect allocations and the ten genuinely empty Arabic Code boxes. Its dedicated all-five actual-builder mock checks source dependencies, two zero-create repeats with nonempty recorded geometry, genuine linked edited-copy refusal before permanent writes and preserves the edited copy when rebuild is refused. This is a fixed source-fragment layout contract; arbitrary paragraph editing and cross-brand reflow require fresh source layout.

The combined registration check completed with terminal exit0: deterministic full packet and dependency validation, source-only importer refusal, original nine-family/28-variant scene lifecycle and CLI output/check/overwrite/staleness/source-path/argument guards passed. The dedicated all-five Code lifecycle remains separate; the combined scene fixture does not exercise all1800 variants. Native Menlo availability, authored weight500 correspondence, bidi/CJK glyphs, baselines, capacities, inset appearance, full ordinary native rebuilds, publication and consumer acceptance remain open. The required36 semantic source contracts retain their full scope: Code advances six finite specimens, while Cite, Quotation, ordered/unordered lists and Abbr retain30 separate required specimens. The source packet remains non-importable; the original119 and118 deliveries remain preserved.
