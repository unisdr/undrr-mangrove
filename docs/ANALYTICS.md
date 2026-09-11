# Analytics enhancements

> Edits to this file show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/ANALYTICS.md) and in [Storybook](https://unisdr.github.io/undrr-mangrove/?path=/docs/platform-services-analytics-enhancements--docs).

UNDRR provides Google Analytics 4 enhancements via a shared, versioned CDN bundle.

## Quick start

Add before `</body>`:

```html
<script
  src="https://assets.undrr.org/analytics/v1.0.0/google_analytics_enhancements.js"
  defer
></script>
```

The script auto-detects GA4 and configures property IDs for UNDRR domains.

## Working example

[See on CodePen](https://codepen.io/khawkins98/pen/MYwbKwe) — Complete page template with analytics regions.

## Resources

- [Analytics documentation](https://assets.undrr.org/analytics/v1.0.0/index.html) — Full implementation guide
- [google_analytics_enhancements.js](https://assets.undrr.org/analytics/v1.0.0/google_analytics_enhancements.js) — Source file

## See also

- [Critical messaging](https://unisdr.github.io/undrr-mangrove/?path=/docs/platform-services-critical-messaging--docs) — Emergency broadcast system for UNDRR pages
