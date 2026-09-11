# Browser support

> Edits to this file show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/BROWSER-SUPPORT.md) and in [Storybook](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-browser-support--docs).

Mangrove is tested in major modern browsers. Support covers the latest stable
release plus the two prior versions for each browser. Older browsers are
best-effort only (no dedicated workarounds or release-blocking fixes).

## Desktop

| Browser | Version | Release date | OS |
| ------- | ------- | ------------ | -- |
| Chrome  | 134+    | Mar 2025     | Windows, macOS |
| Safari  | 17.4+   | Mar 2024     | macOS |
| Firefox | 136+    | Mar 2025     | Windows |
| Edge    | 134+    | Mar 2025     | Windows |

## Mobile

| Browser | Version | Release date | OS |
| ------- | ------- | ------------ | -- |
| Chrome  | 134+    | Mar 2025     | Android, iOS |
| Safari  | 17.4+   | Mar 2024     | iOS |

*Versions as of April 2026. Updated each release cycle to reflect "latest stable and 2 prior versions."*

## CSS feature baseline

Some Mangrove features require relatively modern CSS. The minimum browser versions listed above comfortably support all of these:

| Feature | Chrome | Firefox | Safari | Edge |
| ------- | ------ | ------- | ------ | ---- |
| CSS `mask-image` (icons) | 120+ (Dec 2023) | 53+ (Apr 2017) | 15.4+ (Mar 2022) | 120+ (Dec 2023) |
| CSS custom properties / `var()` | 49+ (Mar 2016) | 31+ (Jul 2014) | 9.1+ (Mar 2016) | 15+ (Apr 2017) |
| Space-separated `rgb(R G B / a)` with token channels | 65+ (Mar 2018) | 52+ (Mar 2017) | 12.1+ (Mar 2019) | 79+ (Jan 2020) |
| Container queries / `cqi` units | 105+ (Jun 2022) | 110+ (Feb 2023) | 16.0+ (Sep 2022) | 105+ (Jun 2022) |
| `:has()` selector | 105+ (Jun 2022) | 121+ (Dec 2023) | 15.4+ (Mar 2022) | 105+ (Jun 2022) |

## Why we don't support older browsers

End-of-life browsers carry unpatched security risk and require costly
workarounds that add weight for most users while still offering partial
compatibility. This policy keeps support transparent while encouraging current
software where possible.

## Screen width

For guidance on supported screen widths, see [the Breakpoints section](https://unisdr.github.io/undrr-mangrove/?path=/docs/design-decisions-breakpoint--docs).

## Next steps

- [Getting started](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-about-mangrove--docs) — what Mangrove provides and how to use it
- [CDN reference](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-integration-cdn-reference--docs) — pre-built CSS and JS URLs for quick integration
