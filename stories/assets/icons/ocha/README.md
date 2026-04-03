# OCHA humanitarian icons

Curated subset of the [OCHA Humanitarian Icons](https://github.com/rodekruis/OCHA-Humanitarian-Icons) for disaster risk reduction and humanitarian concepts. This is a starting set — more icons from the full collection can be added as needed.

- Browse all icons: https://brand.unocha.org/d/xEPytAUjC3sH/icons#/-/humanitarian-icons/search-icons
- Source repo: https://github.com/rodekruis/OCHA-Humanitarian-Icons
- License: CC0-1.0 (Public Domain)

## Current set

**Natural hazards:** earthquake, tsunami, flood, flash-flood, cyclone, drought, volcano, landslide-mudslide, storm-surge, tornado, heatwave, cold-wave, heavy-rain, snowfall, fire, epidemic

**DRR and humanitarian response:** resilience, preparedness, response, affected-population, people-in-need, internally-displaced, refugee, shelter, infrastructure

## Adding more

To add an OCHA icon:
1. Download the SVG from the source repo's `svg/` directory
2. Save it here with a lowercase filename
3. Add an entry to `scripts/icon-map.cjs` using `OCHA('filename')`
4. Run `yarn build:icons`

New SVGs must have a viewBox attribute. The build script strips `width`/`height` via SVGO — sizing is controlled by CSS.

These are filled-shape SVGs (not stroked like Lucide icons), so they have different visual weight. See the Icons documentation for guidance on when to use OCHA vs Lucide icons.

Part of the icon font to CSS mask-image migration: https://github.com/unisdr/undrr-mangrove/issues/906
