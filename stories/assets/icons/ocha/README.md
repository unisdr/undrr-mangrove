# OCHA humanitarian icons

Curated subset of the [OCHA Humanitarian Icons](https://github.com/UN-OCHA/humanitarian-icons) for disaster risk reduction and humanitarian domain concepts (earthquakes, floods, cyclones, displaced persons, etc.).

- License: CC0-1.0 (Public Domain)
- Browse: https://brand.unocha.org/d/xEPytAUjC3sH/icons
- Source repo: https://github.com/UN-OCHA/humanitarian-icons

These are filled-shape SVGs. New SVGs must use a `viewBox="0 0 24 24"` attribute. The build script removes `width`/`height` attributes via SVGO but does not resize the viewBox. It also strips `class` attributes, so do not rely on internal CSS classes in source SVGs.

SVGs are processed by `scripts/icon-build.cjs` into CSS `mask-image` rules.

Part of the icon font to CSS mask-image migration: https://github.com/unisdr/undrr-mangrove/issues/906
