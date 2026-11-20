# Analytics enhancements

> Edits to this file show up on both [GitHub](https://github.com/PreventionWeb/undrr-mangrove/blob/main/docs/ANALYTICS.md) and in [Storybook](https://mangrove.undrr.org/?path=/docs/platform-services-analytics-enhancements--docs).

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

## Regions and labels

Mangrove components and patterns only emit the attributes. The behaviour comes from the sites' Google Analytics script, `google_analytics_enhancements.js`, which lives in drupal-base and the CDN bundle above, not in this repository. That script reports each click with the innermost `data-vf-google-analytics-region` around it, and uses `data-vf-analytics-label` as the click's name when one is set. Keep labels as fixed English strings with no counts, so reports don't split by page language or by number.

Download links use one naming scheme, so reports can count them with a single match:

- Download labels start `download_`, for example `download_publisher`, `download_internal` and `download_backup`.
- A second link to the same file, such as a linked cover, adds `_cover` to the label and `-cover` to the region: `download_publisher_cover` in `undrr-download-box-cover`.
- In-page navigation starts `nav_`, for example `nav_all_downloads_cover` (the jump link under a cover) and `nav_show_all_downloads` (the button that opens or closes a long resource list), so it never counts as a download.

Matching `download_` finds every download click; excluding `cover` leaves the primary list. The [publication record specification](PUBLICATION-RECORD-SPEC.md#5-analytics-download_-_cover-and-nav_) has the full table. Pattern docs such as the [Collection page](https://mangrove.undrr.org/?path=/docs/patterns-collection-page--docs) list their own regions and labels.

## Working example

[See on CodePen](https://codepen.io/khawkins98/pen/MYwbKwe) — Complete page template with analytics regions.

## Resources

- [Analytics documentation](https://assets.undrr.org/analytics/v1.0.0/index.html) — Full implementation guide
- [google_analytics_enhancements.js](https://assets.undrr.org/analytics/v1.0.0/google_analytics_enhancements.js) — Source file

## See also

- [Critical messaging](https://mangrove.undrr.org/?path=/docs/platform-services-critical-messaging--docs) — Emergency broadcast system for UNDRR pages
