# Scripts

This directory contains utility scripts for the Mangrove project.

## update-cdn-version.js

Automatically updates all CDN links in documentation files to use the current version from `package.json` instead of "latest" or "testing" endpoints.

### Usage

```bash
# Run the script directly
node scripts/update-cdn-version.js

# Or use the npm script
yarn update-cdn-version
```

### What it does

1. Reads the current version from `package.json`
2. Updates all documentation files to replace:
   - `https://assets.undrr.org/testing/static/mangrove/latest/` → `https://assets.undrr.org/static/mangrove/{version}/`
   - `https://assets.undrr.org/static/mangrove/latest/` → `https://assets.undrr.org/static/mangrove/{version}/`

### Files updated

- `README.md`
- `stories/Documentation/GettingStarted.mdx`
- `stories/Documentation/VanillaHtmlCss.mdx`
- `stories/Documentation/Intro.mdx`
- `stories/Components/Accordion/Accordion.mdx`
- `stories/Components/StatsCardSlider/StatsCardSlider.mdx`
- `stories/Components/LanguageSwitcher/LanguageSwitcher.mdx`
- `stories/Utilities/ShowMore/ShowMore.mdx`
- `stories/Atom/Layout/Grid/Grid.mdx`
- `docs/RELEASES.md`

### When to use

Run this script after each release to ensure all documentation points to the stable, versioned CDN assets instead of bleeding-edge ones. 