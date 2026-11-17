[![npm version](https://img.shields.io/npm/v/@undrr/undrr-mangrove.svg)](https://www.npmjs.com/package/@undrr/undrr-mangrove)
[![Storybook](https://cdn.jsdelivr.net/gh/storybookjs/brand@main/badge/badge-storybook.svg)](https://mangrove.undrr.org/)
[![Build Status](https://github.com/PreventionWeb/undrr-mangrove/actions/workflows/storybook.yml/badge.svg)](https://github.com/PreventionWeb/undrr-mangrove/actions/workflows/storybook.yml)
[![License](https://img.shields.io/github/license/PreventionWeb/undrr-mangrove.svg)](https://github.com/PreventionWeb/undrr-mangrove/blob/main/LICENSE)
<!-- React Doctor score is a periodic snapshot, not live. Refresh after audit sweeps by re-running `npx -y react-doctor@latest .` and updating the s/e/w/f params below. See docs/AI-CODING-AGENTS.md#component-quality-checks-with-react-doctor. -->

[![React Doctor](https://www.react.doctor/share/badge?p=%40undrr%2Fundrr-mangrove&s=100&e=0&w=0&f=0)](https://www.react.doctor/share?p=%40undrr%2Fundrr-mangrove&s=100&e=0&w=0&f=0)

# Mangrove: the UNDRR component library

Mangrove is the component library and design system of the United Nations Office for Disaster Risk Reduction (UNDRR), used on undrr.org, PreventionWeb, MCR2030, the International Recovery Platform (IRP) and DELTA Resilience. It provides accessible, reusable UI for React and server-rendered sites.

- Storybook docs and live examples: <https://mangrove.undrr.org/>
- npm package: <https://www.npmjs.com/package/@undrr/undrr-mangrove>
- Issue tracker: <https://github.com/PreventionWeb/undrr-mangrove/issues> (the public fork; a GitHub account is needed to open an issue)

## Quick start

The code is Apache-2.0 licensed; the UNDRR look and feel is proprietary.

### Use prebuilt CSS from CDN

Save this as `index.html` and open it in a browser with an internet connection.
You should see an “Organization” tag styled with the default UNDRR theme.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Mangrove example</title>
    <link
      rel="stylesheet"
      href="https://assets.undrr.org/mangrove/2.5.0/css/style.css"
    />
  </head>
  <body>
    <span class="mg-tag">Organization</span>
  </body>
</html>
```

This tag needs only CSS. For interactive components, follow the component's
Storybook instructions for its JavaScript or hydration setup. The
[CDN reference](docs/CDN-REFERENCE.md) lists theme stylesheets and module paths.

### Use npm package

```bash
npm install @undrr/undrr-mangrove
```

Upgrading from 1.x? Read the [v2.0 release notes](https://mangrove.undrr.org/?path=/docs/getting-started-release-notes-v2-0--docs).

For React, follow the [React integration guide](https://mangrove.undrr.org/?path=/docs/getting-started-integration-react-integration--docs)
to load styles and import components by subpath. The published package has no
root entry point.

## Choose an integration path

- CDN reference: [`docs/CDN-REFERENCE.md`](docs/CDN-REFERENCE.md)
- Vanilla HTML/CSS: [Storybook "Vanilla HTML and CSS"](https://mangrove.undrr.org/?path=/docs/getting-started-integration-vanilla-html-and-css--docs)
- Hydration for Drupal/Astro/server-rendered apps: [`docs/HYDRATION.md`](docs/HYDRATION.md)
- Sass integration: [Storybook "Sass integration"](https://mangrove.undrr.org/?path=/docs/getting-started-integration-sass-integration--docs)
- React integration: [Storybook "React integration"](https://mangrove.undrr.org/?path=/docs/getting-started-integration-react-integration--docs)

## Development

To work on Mangrove itself, follow the [development guide](docs/DEVELOPMENT.md)
for Node.js and Yarn prerequisites, installation and running Storybook. See
[Contributing](CONTRIBUTING.md) for contribution rules and checks.

## Releases

- Release process: [`docs/RELEASES.md`](docs/RELEASES.md)
- Upgrading from 1.x: [v2.0 release notes](https://mangrove.undrr.org/?path=/docs/getting-started-release-notes-v2-0--docs) (source: [`docs/RELEASE-2.0.md`](docs/RELEASE-2.0.md))
- Changelog: [`CHANGELOG.md`](CHANGELOG.md). GitHub Releases are published on `unisdr/undrr-mangrove`, which is readable only when signed in as a member while the `unisdr` organization is flagged; the public fork has no releases

## AI and MCP integration

Coding agents consuming Mangrove can start with [llms.txt](https://mangrove.undrr.org/llms.txt)
and the [component index](https://mangrove.undrr.org/ai-components/index.json).
The [AI and MCP integration guide](docs/AI-MCP-INTEGRATION.md) explains component
discovery, rendered markup, editorial and page-building guidance, and versioned
copies on the CDN.

Agents contributing to this repository should start with [AGENTS.md](AGENTS.md).

## Documentation index

All project docs: [`docs/README.md`](docs/README.md)

## License

Components and code are Apache-2.0 licensed. The UNDRR look and feel is proprietary.

## Credit

The initial Storybook setup was adapted from the
[UNDP Design System](https://github.com/undp/design-system) (MIT), with
permission.
