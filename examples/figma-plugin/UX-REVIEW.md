# Figma kit user experience review

Reviewed 4 October 2026 using the latest accepted native inventory, supplied screenshots, runtime source and kit documentation. This is an expert heuristic review, not a novice usability study. Recommendations below are not implemented or natively accepted.

## Main finding

The file exposes its construction process too strongly. The Welcome board, corrected contents and last-position diagnostics improve orientation, but the user still has to navigate two distant catalogues to understand and use one component. The planned section migration addresses containment without fully addressing component discovery.

The current Layers order is **Start here**, **Review**, **Main components**, **focus-ring diagnostics**. Welcome's contents match it. The original contents mismatch and diagnostics appearing second are resolved findings, not current defects.

## Prioritized findings

P0 means a barrier to designer handoff. P1 means substantial friction to address in the presentation redesign. User impacts are expert judgments to test, not observed completion results.

| Priority | Evidence                                                                                                                                                                                                                                                                                                              | User impact and recommendation                                                                                                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0       | Native Main is approximately 17,521px tall; Review is 38,635px tall. Main's rendered width is 2,900px inside a nominal 1,200px root. Family heights differ between the two boards.                                                                                                                                    | A whole-file state catalogue is cumbersome to browse. Provide a compact family overview with its representative instance, supported edits and nearby states. Preserve detailed specimens for verification.      |
| P0       | The plugin offers six planned destinations. In the current legacy file, `navigateMangroveKit` can open only Start here; other destinations require section migration.                                                                                                                                                 | Navigation advertises unavailable routes. Contents, Layers and plugin navigation should agree about installed destinations; omit or explicitly mark unavailable choices.                                        |
| P0       | Tabs and Editorial CTA are mixed with bounded core families. Table of contents / Link still says canonical repeat/edited-consumer acceptance is pending. Segmented Segment and FullWidth BelowMedium similarly describe completed bounded gates as pending. [Core status](CORE-KIT-STATUS.md) records later evidence. | Readiness guidance conflicts. Maintain one source of truth for current scope and reconcile concise native descriptions. Use **Bounded draft use**, with precise limits, rather than an unqualified Ready label. |
| P1       | Build/dependency order places ComboBox option before ComboBox and Table cells/rows before Table. Forms are interrupted by Tabs, Table and Text CTA.                                                                                                                                                                   | Finding a complete control should not require knowledge of its internals. Group complete components by user task, with supporting parts under the relevant family.                                              |
| P1       | Welcome tells users to use their working frame without identifying an area or explaining how to create one. It mixes instance editing with import/rebuild procedures.                                                                                                                                                 | Provide one concrete first task and a clear designer-owned working area. Keep maintainer instructions separate from normal design use.                                                                          |
| P1       | The implemented but unapplied migration retains independent Main and Usage columns inside Components and Compositions, then lays six destinations along a horizontal strip.                                                                                                                                           | Section names alone will not resolve family-level wayfinding. Pair family guidance and examples locally, and avoid requiring an atomic-design classification before finding a widget.                           |

Evidence comes from the accepted native inspection and [kit layout](kit-layout.js), [Welcome](kit-welcome.js), [plugin interface](ui.html) and [core status](CORE-KIT-STATUS.md). No new native writes were made for this review.

## Proposed user-facing structure

This is a presentation proposal for a reviewed migration, not a replacement for the currently implemented six destination identities.

| Destination                   | Contents                                                                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **00 Start here**             | Current brand, exploratory status, a short first task and a compact index of actual destinations.                                                       |
| **01 Foundations**            | Visual colour, typography, spacing and effect specimens pointing to the variables and styles.                                                           |
| **02 Components**             | Complete widgets grouped into **Actions**, **Forms and selection**, **Content and data**, and **Navigation**. ComboBox and Table are discoverable here. |
| **03 Examples and templates** | Accepted page compositions and templates when available. Clearly state missing coverage; an empty destination must not appear populated.                |
| **90 Maintenance**            | Diagnostics, families outside core scope and maintainer guidance, outside the everyday browsing path.                                                   |

Designer-owned working frames must be visibly distinct from generated material, with an explicit preservation boundary. Keep “organisms” as optional implementation terminology in documentation rather than required navigation vocabulary.

A family overview should include:

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

## Implementation sequence

### Before resolving the font blocker

1. Make plugin navigation reflect installed destinations.
2. Give Welcome one short, concrete first-use task and move maintenance procedures to an advanced area.
3. Establish consistent readiness metadata and identify stale native descriptions. Reconcile through the normal source path when required exact fonts can load.
4. Explain how to create a personal working frame outside generated containers.
5. Prototype the family browsing layout in documentation before changing hierarchy.

These are candidates for incremental work, not guarantees that every native mutation is font-independent. Keep exact-font preflight.

### Presentation migration and handoff

6. Resolve exact required fonts, then apply a reviewed, versioned migration preserving canonical, property and instance identities and overrides. Changing the existing six destinations to this proposed structure requires an explicit mapping.
7. Group families by task and colocate their overview, examples and source assets.
8. Check all families' selection and rendered bounds. Verify ordinary updates preserve the new arrangement and designer-owned work.
9. Run the novice tasks below before accepting designer handoff.

Accepted page examples, the wider catalogue and shared-library publishing follow separately. Paid access does not resolve the current font blocker or establish usability.

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
