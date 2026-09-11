# Critical messaging

> Edits to this file show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/CRITICAL-MESSAGING.md) and in [Storybook](https://unisdr.github.io/undrr-mangrove/?path=/docs/platform-services-critical-messaging--docs).

Failsafe messaging system that broadcasts urgent messages across UNDRR properties, even when the main CMS is down.

## Quick start

Add before closing `</body>`:

```html
<script src="https://messaging.undrr.org/src/undrr-messaging.js" defer></script>
```

Script automatically checks for active messages and displays them on matching pages.

## Optional: message container

For placement control, add this div where messages should appear:

```html
<div class="mg-critical-messaging"></div>
```

Default: injected at top of `<body>`.

## Features

- **Failsafe** — Works when Drupal is down (hosted on GitHub Pages)
- **Location targeting** — URL/domain-specific messages
- **Severity levels** — Info (blue) and warning (yellow)
- **Time scheduling** — Start/end times
- **User dismissal** — Session-persistent
- **Zero overhead** — Messages embedded in script

## Working example

[CodePen template](https://codepen.io/khawkins98/pen/MYwbKwe) — complete integration example.

## Debug mode

Add `#enableMessagingDebug=true` to any URL for debug mode with console logging and dev utilities:

```text
https://www.undrr.org/#enableMessagingDebug=true
```

## Resources

- [Messaging system docs](https://messaging.undrr.org/) — implementation and editor guide
- [GitHub repository](https://github.com/unisdr/undrr-messaging) — source (private)
- [Status page](https://status.undrr.org/) — system status

## See also

- [Analytics enhancements](https://unisdr.github.io/undrr-mangrove/?path=/docs/platform-services-analytics-enhancements--docs) — GA4 tracking
