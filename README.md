[![npm version](https://img.shields.io/npm/v/@undrr/undrr-mangrove.svg)](https://www.npmjs.com/package/@undrr/undrr-mangrove)
[![Storybook](https://cdn.jsdelivr.net/gh/storybookjs/brand@main/badge/badge-storybook.svg)](https://unisdr.github.io/undrr-mangrove/)
[![Build Status](https://github.com/unisdr/undrr-mangrove/actions/workflows/storybook.yml/badge.svg)](https://github.com/unisdr/undrr-mangrove/actions)
[![License](https://img.shields.io/github/license/unisdr/undrr-mangrove.svg)](https://github.com/unisdr/undrr-mangrove/blob/main/LICENSE)
<!-- React Doctor score is a periodic snapshot, not live. Refresh after audit sweeps by re-running `npx -y react-doctor@latest .` and updating the s/e/w/f params below. See docs/AI-CODING-AGENTS.md#component-quality-checks-with-react-doctor. -->

[![React Doctor](https://www.react.doctor/share/badge?p=%40undrr%2Fundrr-mangrove&s=100&e=0&w=0&f=0)](https://www.react.doctor/share?p=%40undrr%2Fundrr-mangrove&s=100&e=0&w=0&f=0)

# Mangrove: the UNDRR component library

Mangrove is UNDRR's component library for accessible, reusable UI across React and server-rendered sites.

- Storybook docs and live examples: <https://unisdr.github.io/undrr-mangrove/>
- npm package: <https://www.npmjs.com/package/@undrr/undrr-mangrove>
- Issue tracker: <https://github.com/unisdr/undrr-mangrove/issues>

## Quick start

### Use prebuilt CSS from CDN

```html
<link
  rel="stylesheet"
  href="https://assets.undrr.org/mangrove/2.0.0-beta.1/css/style.css"
/>
```

### Use npm package

```bash
npm install @undrr/undrr-mangrove
```

Package contents:

- `components/` compiled React component ES modules
- `css/` compiled theme stylesheets
- `js/` vanilla JS utilities
- `scss/` source Sass files

## Choose an integration path

- CDN reference: [`docs/CDN-REFERENCE.md`](docs/CDN-REFERENCE.md)
- Vanilla HTML/CSS: Storybook "Vanilla HTML and CSS"
- Hydration for Drupal/Astro/server-rendered apps: [`docs/HYDRATION.md`](docs/HYDRATION.md)
- Sass integration: Storybook "Sass integration"
- React integration: Storybook "React integration"

## Development

For full setup and workflow details, use the development guide:
[`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md)

Common commands:

```bash
yarn install
yarn storybook
yarn test
yarn lint
yarn build
```

## Releases

- Release process: [`docs/RELEASES.md`](docs/RELEASES.md)
- Release notes index in Storybook: "Getting started/Release notes"
- GitHub releases: <https://github.com/unisdr/undrr-mangrove/releases>

## AI and MCP integration

Mangrove publishes static metadata for coding agents after Storybook deploy:

- `llms.txt`: <https://unisdr.github.io/undrr-mangrove/llms.txt>
- component index: <https://unisdr.github.io/undrr-mangrove/ai-components/index.json>
- per-component details: `ai-components/{id}.json`

Guide: [`docs/AI-MCP-INTEGRATION.md`](docs/AI-MCP-INTEGRATION.md)

## Documentation index

All project docs: [`docs/README.md`](docs/README.md)

## License

Components and code are Apache-2.0 licensed. The UNDRR look and feel is proprietary.

## Credit

The initial Storybook setup was adapted from the
[UNDP Design System](https://github.com/undp/design-system) (MIT), with
permission.
