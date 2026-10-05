# Deterministic search fixture contract

This implements dependency S1 of [the search audit](search-audit.md). It is source
fixture preparation, not completion of the search library or native acceptance.

Generate a packet with:

```sh
node scripts/figma-search-fixtures.cjs > /tmp/mangrove-search-fixtures.json
node examples/figma-plugin/dev/mock-search-fixtures.cjs
```

The programmatic API is
`await buildSearchFixtures({ root: absoluteRepositoryPath })`. It returns
`kind: source-only-search-fixtures`, source provenance/hashes, 20 merged authored
story configurations, six result-hit contracts, eight state probes, resolved
locale label samples, exact teaser-field selector metadata and responsive
boundary widths. It deliberately supplies no importable Figma DTO. The exact
same packet can be consumed by later recipes and a deterministic browser harness.

`createSearchSourceLoader({ root })` compiles guarded local JSX/ES modules using
installed Babel into its own isolated CommonJS module/cache. It changes neither
host require hooks nor host module cache. `guardSearchSources(root)` takes an
absolute repository directory and fails on source drift before compilation. The
CLI performs the same guard. Hash changes require re-auditing and an intentional
fixture contract update, not automatically replacing expected hashes.

## Provenance and boundaries

Story args are evaluated from current source, with runtime defaults merged before
story overrides. This retains the actual endpoint/query/filter/card configuration
and the distinction between runtime timer off and story timer on. The source
story description decorators are not visual widget content.

Existing `ResultItem.test.jsx` supplies `TEASER_HC`, `TEASER_VC`, `createHit` and
`orgTeaser`, extracted as named source declarations through the Babel AST. The
primary teaser, fallback, missing-domain and organization hit contracts come from
those authored tests. These are test examples, not recorded production responses.

Taxonomy and highlight cases are explicit structural mutations of authored test
hits. Eight state probes also set finite query/count/error values to exercise the
actual source branches. Seven field-removal tests use explicitly structural
selector markup from source `TEASER_FIELDS`. Those probes establish response
shape, branch behavior and visibility semantics. They are not source-design
content, real endpoint evidence or acceptable replacement cards for page designs.
A real image-byte fixture and all-field authored visual teaser still need to be
selected and reviewed before image/browser/native result fidelity is accepted.

Locale strings come from the shipped labels. Function-valued Arabic/Russian
labels are represented as tagged samples for counts 0, 1, 2, 3, 11 and 100;
functions are not silently dropped into a JSON packet. Recipes must resolve a
chosen fixture count, and browser tests must exercise actual functions from the
source module. Serialization does not establish plural logic for every value or
script/font acceptance.

The source endpoint is part of the widget's trusted-HTML contract. No network
request is made by this generator or harness. No live endpoint response is
compiled or executed. The packet records actual endpoint strings as authored
configuration metadata only.

## Offline evidence implemented

The dedicated harness tests actual source `ResultItem`, card-transform and
field-removal helpers, `SearchResults`, search-context hooks and hydration parser.
It proves source horizontal/vertical/Book classes and image-path transforms;
domain/organization/taxonomy/missing-domain behavior; retained highlight markup;
all seven independent hidden-field selectors with title retention; fallback
visibility; all source result-state branches; card/list skeleton counts; exact
and approximate counts; stale opacity; pager presence and single-page omission;
authored syndicated presets; locale function samples; malformed hydration JSON
and tri-state hash handling. It checks deterministic repeated generation and
rejects deliberate source drift using a temporary copied source tree, cleaned
afterward. The loader context hook overrides are private to this test instance.

These checks use React server rendering and jsdom. They provide no computed CSS,
responsive geometry, realized font face, native identity, variable binding,
instance override or publication evidence.

## Browser fixture plan

A later local harness must mount actual source under a deterministic provider
state or intercept local search/taxonomy requests with reviewed finite responses.
It must consume this packet's configs and data, rather than retrieve drifting
remote content. Preserve exact authored external hero/rail wrappers and their
portal behavior. Measure after `document.fonts.ready`, with the actual source
body/font context, and capture fonts, computed paint and element geometry.

Capture initializing/error/initial empty/query empty/loading/stale and populated
states; list/card/Book; all fields and targeted hidden fields; custom facets,
operator/count/selection states; sort/dropdown open/empty search; mobile drawer
open/closed; and authored portal/syndicated compositions. Before visual result
captures, complete reviewed real assets and field-rich teaser fixtures.

Use source transition boundaries 480/481, 768/769, 800/801, 899/900 and
1163/1164, plus declared representative mobile/desktop widths. Include all five
brand modes, actual locale fonts and RTL. The 769..800 horizontal-strip/mobile
filter overlap is source behavior and must not be normalized away. Keep browser
interaction tests for deferred requests, hash/multi-widget behavior, focus/ESC,
scroll/portals and reduced motion separate from static drawing acceptance.

After browser evidence, source recipes still need explicit supported HTML/rich
text/image capabilities, two zero-create identity-preserving builds, edited
content retention and isolated native structural/visual checks. Promotion,
selective publication and consumer update/restoration remain separate gates.
