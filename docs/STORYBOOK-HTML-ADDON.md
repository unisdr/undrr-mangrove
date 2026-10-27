# Local Storybook HTML addon

The HTML panel supplies copyable live markup for Drupal, Twig and plain HTML
consumers. It reads the current story canvas, including decorators and runtime
attribute/text changes. Docs source remains a separate contract: its static
renderer excludes decorators and normalizes generated IDs. Both paths use
`.storybook/formatHtml.js` with Prettier's CSS-sensitive whitespace policy so
formatting does not introduce spaces before punctuation.

## Scope and maintenance

The addon is repository-local, not a general-purpose published addon. Its
production code is approximately 200 lines including the shared formatter.
There are no new dependencies or vendored upstream addon sources.

- `preset.js`: registers manager and preview entries using Storybook's preset API.
- `manager.jsx`: uses manager hooks/channels and Storybook's existing panel,
  syntax highlighting and Copy button. `storybook/internal/components` is the
  one explicitly internal UI dependency; verify it on every Storybook major.
- `preview.js`: handshakes with the manager, starts capture for the current
  story only while HTML is active, and cleans up on rerender/navigation.
- `capture.js`: observes attributes, child nodes and text under the canvas;
  coalesces changes for 80 ms; discards stale async results; disconnects on stop.
- `events.js`: defines the small manager/preview protocol. The existing
  `storybook/html/panel` panel ID preserves bookmarked URLs.

Formatting loads dynamically when needed. The docs pipeline can independently
load the same formatter. Pending output has no Copy button, so an earlier
story or revision cannot be copied while a new capture is being prepared.
If formatting fails, the panel labels and offers raw live HTML; a missing or
invalid root displays an error and clears copyable output.

## Supported parameters

Configure these under `parameters.html` at project, component or story level:

| Parameter | Default | Meaning |
| --- | --- | --- |
| `disable` | `false` | Disable the panel for this story. |
| `root` | Current canvas | Capture a matching element's children, searching only within the canvas. |
| `removeComments` | `true` | Remove actual comment nodes from the detached clone; preserve comment-like strings inside script/text content. |

No existing Mangrove story uses the former addon's transform, highlighter,
regular-expression comment removal or other options; those are not implemented.
New options should answer a concrete consumer need and include regression checks.

## Deliberate limits

This is DOM serialization, not an HTML export system. Captured classes need
Mangrove CSS; captured interactive controls need their integration scripts.
Generated IDs are retained with their references. Decorator wrappers are
included unless a narrower root is configured. Storybook's surrounding shell,
stylesheets and body-level portals are outside the canvas and are excluded.
Shadow roots, event handlers and browser property-only state (such as a typed
input value without a reflected attribute) are not serialized. React-managed
attributes and text, including tab selection, are captured as they change.
Continuous DOM changes can keep the panel updating; no observer runs when the
HTML tab is inactive. This panel is for trusted local story code, not sanitizing
untrusted HTML.

## Verification before changing or upgrading

```sh
yarn test .storybook/addons/html/__tests__/capture.test.js .storybook/__tests__/docsSource.test.js --runInBand
yarn build
yarn validate-manifest
yarn serve-storybook  # production build on 6099, in another terminal
yarn test:storybook-html
yarn test:storybook-themes
```

`HTML_STORYBOOK_URL` can point the HTML gate at a different server, including a
preview deployment with a path prefix. Unit checks cover cleanup, async races,
raw fallback, missing roots and comment/ID preservation. The production gate
checks the real manager clipboard, inline punctuation, five themes, RTL, tab
interaction, same-manager sidebar navigation, inactive capture and Controls.
When Storybook changes its preset API, manager hooks, channel transport or UI
exports, these are the compatibility boundaries to review.
