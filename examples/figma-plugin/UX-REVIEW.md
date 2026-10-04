# Figma kit user experience review

Reviewed 4 October 2026 using the latest accepted native inventory, supplied screenshots, runtime source and kit documentation. This is an expert heuristic review, not a novice usability study. The findings below describe that review checkpoint. The approved recommendations are now implemented in source; native acceptance of the newer UX and the novice tasks remains pending. Component acceptance stays at the recorded 25 core construction families and three outside-core families.

## Main finding

The file exposes its construction process too strongly. The Welcome board, corrected contents and last-position diagnostics improve orientation, but the user still has to navigate two distant catalogues to understand and use one component. The planned section migration addresses containment without fully addressing component discovery.

At the reviewed native checkpoint, Layers order is **Start here**, **Review**, **Main components**, **focus-ring diagnostics**. Welcome's contents match it. The original contents mismatch and diagnostics appearing second are resolved findings, not current defects.

## Prioritized findings

P0 means a barrier to designer handoff. P1 means substantial friction to address in the presentation redesign. User impacts are expert judgments to test, not observed completion results.

| Priority | Evidence                                                                                                                                                                                                                                                                                                                                 | User impact and recommendation                                                                                                                                                                                  |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0       | Native Main is approximately 17,521px tall; Review is 38,635px tall. Main's rendered width is 2,900px inside a nominal 1,200px root. Family heights differ between the two boards.                                                                                                                                                       | A whole-file state catalogue is cumbersome to browse. Provide a compact family overview with its representative instance, supported edits and nearby states. Preserve detailed specimens for verification.      |
| P0       | The plugin offers six planned destinations. In the current legacy file, `navigateMangroveKit` can open only Start here; other destinations require section migration.                                                                                                                                                                    | Navigation advertises unavailable routes. Contents, Layers and plugin navigation should agree about installed destinations; omit or explicitly mark unavailable choices.                                        |
| P0       | Tabs and Editorial CTA are mixed with bounded core families. At the review baseline, Table of contents / Link said canonical repeat/edited-consumer acceptance is pending. Segmented Segment and FullWidth BelowMedium similarly described completed bounded gates as pending. [Core status](CORE-KIT-STATUS.md) records later evidence. | Readiness guidance conflicts. Maintain one source of truth for current scope and reconcile concise native descriptions. Use **Bounded draft use**, with precise limits, rather than an unqualified Ready label. |
| P1       | Build/dependency order places ComboBox option before ComboBox and Table cells/rows before Table. Forms are interrupted by Tabs, Table and Text CTA.                                                                                                                                                                                      | Finding a complete control should not require knowledge of its internals. Group complete components by user task, with supporting parts under the relevant family.                                              |
| P1       | Welcome tells users to use their working frame without identifying an area or explaining how to create one. It mixes instance editing with import/rebuild procedures.                                                                                                                                                                    | Provide one concrete first task and a clear designer-owned working area. Keep maintainer instructions separate from normal design use.                                                                          |
| P1       | The implemented but unapplied migration retains independent Main and Usage columns inside Components and Compositions, then lays six destinations along a horizontal strip.                                                                                                                                                              | Section names alone will not resolve family-level wayfinding. Pair family guidance and examples locally, and avoid requiring an atomic-design classification before finding a widget.                           |

Evidence comes from the accepted native inspection and [kit layout](kit-layout.js), [Welcome](kit-welcome.js), [plugin interface](ui.html) and [core status](CORE-KIT-STATUS.md). No new native writes were made for this review.

## Approved user-facing structure

The source implementation retains all six durable destination identities in layout version 2. Native migration is still blocked by exact existing Roboto Condensed Bold loading. This table describes the intended result, not an applied native layout.

| Durable key           | Destination                   | Contents                                                                                                                                                      |
| --------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `layout/start`        | **00 Start here**             | Current brand, exploratory status, a concrete My design task and actual installed destinations.                                                               |
| `layout/foundations`  | **01 Foundations**            | Colour, typography, spacing and effect specimens pointing to variables and styles.                                                                            |
| `layout/components`   | **02 Components**             | Whole widgets grouped by Actions, Forms and selection, Content and data, and Navigation and disclosure; paired usage/source boards and nested advanced parts. |
| `layout/compositions` | **03 Examples and templates** | Available composition guidance with an explicit notice that accepted page templates are not yet available.                                                    |
| `layout/patterns`     | **04 Your workspace**         | Designer-created frames beside the generated guide, preserved by ordinary updates.                                                                            |
| `layout/pending`      | **90 Maintenance**            | Diagnostics, outside-core families and maintainer material.                                                                                                   |

Designer-owned working frames must be visibly distinct from generated material, with an explicit preservation boundary. Keep “organisms” as optional implementation terminology in documentation rather than required navigation vocabulary.

The source family overview includes:

- A plain purpose and representative default instance.
- Primary edit controls and supported width/content presets.
- Nearby state comparisons.
- A concise **Bounded draft use** or **Not in core scope** label with its exact limitations.
- A clearly identified source area containing existing main components.
- Advanced supporting parts, such as Table cells, associated with their family.

Preserve canonical sets and existing review instances. Do not detach, recreate or rename assets casually to achieve this presentation. The [update contract](KIT-ARCHITECTURE.md#automatic-and-manual-synchronisation) remains required.

### Does Review need to follow Main?

Review can precede Main if it is the consumer entry point, but its current name does not explain that purpose. Moving Main above Review would align Layers with the current left-to-right canvas while foregrounding source assets. Neither ordering solves the separation between whole-file catalogues.

For the interim file, explain Review as linked examples for inspecting supported states and content, Main components as source assets maintained by the importer, and personal working frames as the place to create designs. Later pair these areas within each family. Changing maintained display names must follow the source and migration rules.

## Implementation status

### Implemented in source, incremental native UX checked

- `scripts/figma-kit-guidance.cjs` centralizes purpose, usage, scope and limitations for all 28 construction families. The exporter writes `doc.kitGuidance`; the bundler embeds the same metadata for startup. Unknown, missing or duplicate family IDs refuse export rather than receiving a generic acceptance label.
- Plugin destinations use actual installed names in legacy or v2 layouts. **Browse component** presents installed bounded whole widgets by task; **Usage and states** and **Source components** open their corresponding owned assets. Refresh/navigation are read-only and require no font loads or loaded JSON.
- **Update kit guidance** uses a complete loaded document to update only existing set/variant descriptions. It is independent of component builds and does not broaden native scope.
- Welcome's first task asks the designer to create **My design** outside generated boards, or in **Your workspace** when available, insert a linked Mangrove/Button from Assets and edit Label. Generated examples remain maintainer-owned.
- Layout v2 pairs usage/source boards and nests supporting parts. The six keys above remain stable. Version 1 needs explicit **Organize file** migration; an ordinary build cannot silently upgrade it.

The three outside-core families remain Tab trigger, Tabs and Editorial CTA. Supporting parts still count in the 25 core construction-family total; whole-widget browsing has fewer primary entries. Neither guidance metadata nor improved presentation establishes new component, brand, script or width acceptance.

### Presentation migration and handoff remain open

1. Apply and inspect the newer legacy navigation, Welcome copy and description refresh. Save independent native receipts and compare unchanged geometry, styles, property identities and consumer fields.
2. Resolve exact required fonts, then apply the explicit v2 migration with a backup and reviewed identity mapping. Preserve existing sets, properties, linked review instances and manual content.
3. Review family boards and rendered bounds at normal scale. Verify two ordinary updates, restart recovery and designer-owned **My design** frames/manual notes.
4. Run the novice tasks below before accepting designer handoff.

The older Welcome observations remain recorded in [README](README.md#start-here-and-onboarding). Accepted page templates, the wider catalogue and shared-library publishing follow separately. Paid access does not resolve the current font blocker or establish usability.

## Proposed novice acceptance tasks

These are target criteria, not measured results. Begin with the plugin closed and provide no maintainer coaching. Record completion, time, wrong turns and assistance for each task.

| Task                      | Proposed success criterion                                                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Understand the file       | Within one minute, identify the current brand, exploratory status and where personal designs belong.                                                    |
| Find and use Button       | Within two minutes, locate Button, insert a linked instance into a personal frame and edit its label without editing the main component.                |
| Find Table                | Within one minute, locate the complete Table without first inspecting cells/rows; identify one supported preset and one limitation.                     |
| Compare Text input states | Within one minute, locate default, error and disabled examples and identify the corresponding instance property.                                        |
| Find foundations          | Within one minute, find a semantic colour and a text style using file guidance, without opening the importer.                                           |
| Understand boundaries     | Identify one family outside core scope, distinguish diagnostics from usable components, and explain what an ordinary update preserves in personal work. |

Identity preservation, native rerun evidence and novice usability remain separate acceptance checks. Readability, inventory totals and mock success cannot substitute for these tasks.
