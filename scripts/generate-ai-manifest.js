#!/usr/bin/env node

/**
 * generate-ai-manifest.js
 *
 * Transforms Storybook's components manifest into a tiered set of AI-friendly
 * files that are deployed alongside the static Storybook site:
 *
 *   llms.txt                       — plain-text discovery file for AI agents
 *   ai-components/index.json       — lightweight component index
 *   ai-components/{id}.json        — full details per component
 *   ai-components/utilities.json   — CSS utility class inventory
 *
 * Usage:
 *   node scripts/generate-ai-manifest.js [--build-dir=docs-build-temp] [--validate]
 *
 * Flags:
 *   --validate   Check curated data keys against the Storybook manifest and
 *                exit non-zero if any are unmatched. Useful in CI.
 */

import fs from 'fs';
import path from 'path';
import htmlExamplesRaw from './data/html-examples/index.js';
import cssUtilities from './data/css-utilities.js';

const DOCS_BASE = 'https://unisdr.github.io/undrr-mangrove/';

// CLI args
const args = process.argv.slice(2);
const buildDirArg = (args.find(a => a.startsWith('--build-dir=')) || '').split('=')[1];
const buildDir = path.resolve(process.cwd(), buildDirArg || 'docs-build-temp');
const validateOnly = args.includes('--validate');

const manifestPath = path.join(buildDir, 'manifests', 'components.json');
const outputDir = path.join(buildDir, 'ai-components');
const llmsTxtPath = path.join(buildDir, 'llms.txt');

// Read inputs
if (!fs.existsSync(manifestPath)) {
  console.error(`Storybook manifest not found at ${manifestPath}`);
  console.error('Run "storybook build" first to generate the manifest.');
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Replace {{version}} tokens in curated HTML examples with actual version
const htmlExamples = JSON.parse(
  JSON.stringify(htmlExamplesRaw).replaceAll('{{version}}', pkg.version),
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Flatten a react-docgen type object into a readable string. */
function flattenType(type) {
  if (!type) return 'unknown';

  switch (type.name) {
    case 'enum':
      if (type.value) return type.value.map(v => v.value).join(' | ');
      return 'enum';

    case 'union':
      if (type.value) return type.value.map(flattenType).join(' | ');
      return 'union';

    case 'shape':
      if (type.value) {
        const fields = Object.entries(type.value)
          .map(([k, v]) => `${k}: ${flattenType(v)}`)
          .join(', ');
        return `{ ${fields} }`;
      }
      return 'object';

    case 'arrayOf':
      if (type.value) return `${flattenType(type.value)}[]`;
      return 'array';

    case 'objectOf':
      if (type.value) return `Record<string, ${flattenType(type.value)}>`;
      return 'object';

    case 'instanceOf':
      return type.value || 'instance';

    default:
      return type.name || 'unknown';
  }
}

/** Parse JSDoc @param tags into a map of param name -> description. */
function parseJsDocParams(jsDocTags) {
  if (!jsDocTags?.param) return {};

  const params = {};
  for (const tag of jsDocTags.param) {
    const match = tag.match(/^\{[^}]*\}\s+([\w.]+)\s*(.*)/);
    if (match) {
      const name = match[1].replace(/^props\./, '');
      const desc = match[2].trim().replace(/^-\s*/, '');
      if (desc && !name.includes('.')) {
        params[name] = desc;
      }
    }
  }
  return params;
}

/** Get the best description for a component, with curated fallback. */
function getDescription(component, htmlData) {
  if (component.description) return component.description;

  if (component.reactDocgen?.description) {
    const desc = component.reactDocgen.description
      .replace(/@param\s+\{[^}]*\}\s+\S+\s*/g, '')
      .replace(/@returns?\s+.*/g, '')
      .trim();
    if (desc) return desc.split('\n')[0];
  }

  // Fall back to curated description from html-examples data
  if (htmlData?.description) return htmlData.description;

  return '';
}

/** Build the Storybook docs URL for a component. */
function docsUrl(componentId) {
  return `${DOCS_BASE}?path=/docs/${componentId}--docs`;
}

// ---------------------------------------------------------------------------
// Validate html-examples keys against manifest
// ---------------------------------------------------------------------------

const manifestIds = new Set(Object.values(manifest.components).map(c => c.id));
const unmatchedKeys = Object.keys(htmlExamples).filter(k => !manifestIds.has(k));
const uncoveredIds = [...manifestIds].filter(id =>
  !htmlExamples[id] && !id.startsWith('example-'),
);

if (unmatchedKeys.length > 0) {
  console.warn('Warning: html-examples keys not found in Storybook manifest:');
  for (const k of unmatchedKeys) console.warn(`  - ${k}`);
}
if (uncoveredIds.length > 0) {
  console.warn(`Note: ${uncoveredIds.length} component(s) have no entry in html-examples.js:`);
  for (const id of uncoveredIds) console.warn(`  - ${id}`);
}
if (validateOnly) {
  if (unmatchedKeys.length > 0) {
    console.error('Validation failed: html-examples keys do not match manifest.');
    process.exit(1);
  }
  console.log('Validation passed: all html-examples keys match manifest IDs.');
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Transform each component
// ---------------------------------------------------------------------------

const indexEntries = [];
const componentFiles = [];

for (const [, component] of Object.entries(manifest.components)) {
  const id = component.id;
  const name = component.name || id;
  const jsDocParams = parseJsDocParams(component.jsDocTags);
  const htmlData = htmlExamples[id];
  const description = getDescription(component, htmlData);

  // --- Index entry (lightweight) ---
  const indexEntry = { id, name, description };
  if (component.import) indexEntry.import = component.import;
  indexEntry.docsUrl = docsUrl(id);
  indexEntry.detailsUrl = `${DOCS_BASE}ai-components/${id}.json`;

  // Vanilla HTML / React flags
  if (htmlData?.vanillaHtml) {
    indexEntry.vanillaHtml = true;
  } else if (htmlData?.requiresReact) {
    indexEntry.requiresReact = true;
  }

  indexEntries.push(indexEntry);

  // --- Full component file ---
  const detail = { name, description };
  if (component.import) detail.import = component.import;
  detail.docsUrl = docsUrl(id);

  // Vanilla HTML / React flags on detail
  if (htmlData?.vanillaHtml) {
    detail.vanillaHtml = true;
  }
  if (htmlData?.requiresReact) {
    detail.requiresReact = true;
    if (htmlData.reactNote) detail.reactNote = htmlData.reactNote;
  }

  // Props
  if (component.reactDocgen?.props && Object.keys(component.reactDocgen.props).length > 0) {
    detail.props = {};
    for (const [propName, propDef] of Object.entries(component.reactDocgen.props)) {
      const prop = {
        type: flattenType(propDef.type),
        required: propDef.required || false,
      };
      if (propDef.defaultValue) prop.default = propDef.defaultValue.value;

      const desc = propDef.description || jsDocParams[propName] || '';
      if (desc) prop.description = desc;

      detail.props[propName] = prop;
    }
  }

  // Story examples (React JSX)
  if (component.stories?.length) {
    detail.examples = component.stories.map(s => {
      const example = { name: s.name };
      if (s.snippet) example.code = s.snippet;
      return example;
    });
  }

  // Rendered HTML examples (vanilla HTML)
  if (htmlData?.examples) {
    detail.renderedHtml = htmlData.examples;
  }

  // CSS classes used by this component
  if (htmlData?.cssClasses?.length) {
    detail.cssClasses = htmlData.cssClasses;
  }

  // Vanilla HTML embed instructions (for syndication components)
  if (htmlData?.vanillaHtmlEmbed) {
    detail.vanillaHtmlEmbed = htmlData.vanillaHtmlEmbed;
  }

  // Do-not-modify flag for branding-critical components
  if (htmlData?.doNotModify) {
    detail.doNotModify = htmlData.doNotModify;
  }

  componentFiles.push({ id, content: detail });
}

// ---------------------------------------------------------------------------
// Write ai-components/index.json
// ---------------------------------------------------------------------------

fs.mkdirSync(outputDir, { recursive: true });

const vanillaCount = indexEntries.filter(e => e.vanillaHtml).length;
const reactCount = indexEntries.filter(e => e.requiresReact).length;

const index = {
  _ai: 'Component index for the UNDRR Mangrove library. '
    + 'Most components work as vanilla HTML with CSS classes (vanillaHtml: true). '
    + 'Some require React (requiresReact: true). '
    + 'Each entry has a detailsUrl with full props, rendered HTML examples, and code snippets.',
  library: {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    documentation: DOCS_BASE,
    repository: 'https://github.com/unisdr/undrr-mangrove',
    npm: `https://www.npmjs.com/package/${pkg.name}`,
    cssPrefix: 'mg-',
    namingConvention: 'BEM (e.g., mg-card__title, mg-button--primary)',
    themes: ['undrr', 'preventionweb', 'irp', 'mcr2030'],
    locales: ['en', 'ar', 'my', 'ja'],
    rtlSupport: true,
    semanticHtml: true,
    breakpoints: {
      mobile: '480px',
      tablet: '900px',
      desktop: '1164px',
      wide: '1440px',
    },
    utilitiesUrl: `${DOCS_BASE}ai-components/utilities.json`,
    quickstart: {
      css: `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/${pkg.name}@${pkg.version}/dist/css/style.css" />`,
      cssThemes: {
        undrr: `https://cdn.jsdelivr.net/npm/${pkg.name}@${pkg.version}/dist/css/style.css`,
        preventionweb: `https://cdn.jsdelivr.net/npm/${pkg.name}@${pkg.version}/dist/css/style-preventionweb.css`,
        mcr2030: `https://cdn.jsdelivr.net/npm/${pkg.name}@${pkg.version}/dist/css/style-mcr.css`,
        irp: `https://cdn.jsdelivr.net/npm/${pkg.name}@${pkg.version}/dist/css/style-irp.css`,
      },
    },
    requiredAssets: {
      _note: 'Every UNDRR-branded page should include these assets. Order matters.',
      stylesheets: [
        {
          name: 'Mangrove theme CSS',
          url: `https://cdn.jsdelivr.net/npm/${pkg.name}@${pkg.version}/dist/css/style.css`,
          placement: 'head',
          note: 'Choose one theme. See cssThemes in quickstart for alternatives.',
        },
        {
          name: 'Cookie consent CSS',
          url: 'https://assets.undrr.org/static/cookie-banner/v1/cookieconsent.css',
          placement: 'head',
          note: 'Required if using the UNDRR cookie consent banner.',
        },
      ],
      scripts: [
        {
          name: 'UNDRR analytics (GA4)',
          url: 'https://assets.undrr.org/static/analytics/v1.0.0/google_analytics_enhancements.js',
          placement: 'before closing </body>',
          attributes: 'defer',
          note: 'Google Analytics 4 bootstrap and enhancements for UNDRR sites.',
        },
        {
          name: 'UNDRR critical messaging',
          url: 'https://messaging.undrr.org/src/undrr-messaging.js',
          placement: 'before closing </body>',
          attributes: 'defer',
          note: 'Emergency broadcasts. Injects messages at top of body or into .mg-critical-messaging container.',
        },
        {
          name: 'Cookie consent JS (UMD)',
          url: 'https://assets.undrr.org/static/cookie-banner/v1/cookieconsent.umd.js',
          placement: 'before closing </body>, after analytics',
          attributes: 'none (synchronous)',
          note: 'Cookie consent library. Must load before the UNDRR config script.',
        },
        {
          name: 'Cookie consent UNDRR config',
          url: 'https://assets.undrr.org/static/cookie-banner/v1/cookieconsent-undrr.js',
          placement: 'immediately after cookieconsent.umd.js',
          attributes: 'none (synchronous)',
          note: 'UNDRR-specific cookie consent configuration.',
        },
      ],
      logos: {
        horizontal: 'https://assets.undrr.org/static/logos/undrr/undrr-logo-horizontal.svg',
        vertical: 'https://assets.undrr.org/static/logos/undrr/undrr-logo-vertical.svg',
        squareBlue: 'https://assets.undrr.org/static/logos/undrr/undrr-logo-square-blue.svg',
      },
    },
  },
  components: indexEntries,
  generatedAt: new Date().toISOString(),
};

const indexJson = JSON.stringify(index, null, 2);
fs.writeFileSync(path.join(outputDir, 'index.json'), indexJson);

// ---------------------------------------------------------------------------
// Write ai-components/{id}.json for each component
// ---------------------------------------------------------------------------

for (const { id, content } of componentFiles) {
  fs.writeFileSync(
    path.join(outputDir, `${id}.json`),
    JSON.stringify(content, null, 2),
  );
}

// ---------------------------------------------------------------------------
// Write ai-components/utilities.json
// ---------------------------------------------------------------------------

const utilities = {
  _ai: 'CSS utility classes for the UNDRR Mangrove library. '
    + 'Include the Mangrove CSS bundle to use these classes in plain HTML.',
  ...cssUtilities,
  generatedAt: new Date().toISOString(),
};

const utilitiesJson = JSON.stringify(utilities, null, 2);
fs.writeFileSync(path.join(outputDir, 'utilities.json'), utilitiesJson);

// ---------------------------------------------------------------------------
// Write llms.txt
// ---------------------------------------------------------------------------

const llmsTxt = `# UNDRR Mangrove

> UI component library for UNDRR's disaster risk reduction websites (undrr.org, preventionweb.net, mcr2030.undrr.org). Provides both React components and vanilla HTML/CSS patterns. Built with Storybook.

- Version: ${pkg.version}
- Package: ${pkg.name}
- License: ${pkg.license || 'See LICENSE file'}

## Links

- Storybook: ${DOCS_BASE}
- Repository: https://github.com/unisdr/undrr-mangrove
- npm: https://www.npmjs.com/package/${pkg.name}

## For AI agents

The Storybook site is a single-page app, so fetching pages directly won't give you readable content. Use the JSON files below instead.

Component index (all ${indexEntries.length} components):
${DOCS_BASE}ai-components/index.json

CSS utility class reference (~162 classes):
${DOCS_BASE}ai-components/utilities.json

### Vanilla HTML quick start

${vanillaCount} of the ${indexEntries.length} components work as plain HTML with CSS classes, no React needed. In the index, these have vanillaHtml: true. Each component's detail JSON includes a renderedHtml array with copy-pasteable HTML snippets.

1. Include the Mangrove CSS bundle (pick your theme):
   - UNDRR: https://cdn.jsdelivr.net/npm/@undrr/undrr-mangrove@${pkg.version}/dist/css/style.css
   - PreventionWeb: https://cdn.jsdelivr.net/npm/@undrr/undrr-mangrove@${pkg.version}/dist/css/style-preventionweb.css
   - MCR2030: https://cdn.jsdelivr.net/npm/@undrr/undrr-mangrove@${pkg.version}/dist/css/style-mcr.css
   - IRP: https://cdn.jsdelivr.net/npm/@undrr/undrr-mangrove@${pkg.version}/dist/css/style-irp.css

2. Fetch the component index and find what you need
3. Fetch the component's detailsUrl and use the renderedHtml examples

### React quick start

${reactCount} components require React (requiresReact: true in the index). These use D3, Leaflet, or complex state management. Import via npm: import { ComponentName } from "@undrr/undrr-mangrove".

Several React components support hydration on vanilla HTML pages via the createHydrator pattern. Check the component's reactNote field for details.

### CSS utilities

The utilities.json file lists ~162 utility classes grouped by category: layout containers, grid, responsive display, text utilities, accessibility, background colors, text colors, font sizes, animations, embed containers, and show-more patterns. All use the mg- prefix.

### Conventions

- CSS prefix: mg-
- Naming: BEM (e.g., mg-card__title, mg-button--primary)
- Themes: undrr, preventionweb, irp, mcr2030
- Locales: en, ar, my, ja (RTL supported)
- Semantic HTML, WCAG accessible

### How to use

1. Fetch ${DOCS_BASE}ai-components/index.json
2. Find the component you need by name or description
3. Check vanillaHtml / requiresReact to know if you need React
4. Fetch its detailsUrl for rendered HTML, props, and code examples
5. For CSS utilities, fetch ${DOCS_BASE}ai-components/utilities.json

### Source layout

- stories/Atom/          Typography, images, layout, navigation
- stories/Molecules/     SectionHeader, FooterNavigation, BodyColumn
- stories/Components/    MegaMenu, Cards, Charts, Map, Gallery
- stories/Utilities/     CSS utilities, loaders, show/more
- stories/assets/scss/   Theme stylesheets and design tokens
`;

fs.writeFileSync(llmsTxtPath, llmsTxt);

// ---------------------------------------------------------------------------
// Write llms.json (structured version for tools that lose markdown URLs)
// ---------------------------------------------------------------------------

const llmsJson = JSON.stringify({
  name: 'UNDRR Mangrove',
  description: `UI component library for UNDRR disaster risk reduction websites. ${vanillaCount} vanilla HTML components, ${reactCount} React-only.`,
  version: pkg.version,
  package: pkg.name,
  license: pkg.license || 'See LICENSE file',
  urls: {
    storybook: DOCS_BASE,
    repository: 'https://github.com/unisdr/undrr-mangrove',
    npm: `https://www.npmjs.com/package/${pkg.name}`,
    componentIndex: `${DOCS_BASE}ai-components/index.json`,
    utilities: `${DOCS_BASE}ai-components/utilities.json`,
    css: {
      undrr: `https://cdn.jsdelivr.net/npm/${pkg.name}@${pkg.version}/dist/css/style.css`,
      preventionweb: `https://cdn.jsdelivr.net/npm/${pkg.name}@${pkg.version}/dist/css/style-preventionweb.css`,
      mcr2030: `https://cdn.jsdelivr.net/npm/${pkg.name}@${pkg.version}/dist/css/style-mcr.css`,
      irp: `https://cdn.jsdelivr.net/npm/${pkg.name}@${pkg.version}/dist/css/style-irp.css`,
    },
  },
  requiredAssets: {
    _note: 'Every UNDRR-branded page should include these. The page header and footer structures are non-negotiable branding elements — use them exactly as documented.',
    stylesheets: [
      `https://cdn.jsdelivr.net/npm/${pkg.name}@${pkg.version}/dist/css/style.css`,
      'https://assets.undrr.org/static/cookie-banner/v1/cookieconsent.css',
    ],
    scripts: [
      { url: 'https://assets.undrr.org/static/analytics/v1.0.0/google_analytics_enhancements.js', defer: true },
      { url: 'https://messaging.undrr.org/src/undrr-messaging.js', defer: true },
      { url: 'https://assets.undrr.org/static/cookie-banner/v1/cookieconsent.umd.js', defer: false },
      { url: 'https://assets.undrr.org/static/cookie-banner/v1/cookieconsent-undrr.js', defer: false },
    ],
    logos: {
      horizontal: 'https://assets.undrr.org/static/logos/undrr/undrr-logo-horizontal.svg',
      vertical: 'https://assets.undrr.org/static/logos/undrr/undrr-logo-vertical.svg',
    },
  },
  conventions: {
    cssPrefix: 'mg-',
    naming: 'BEM',
    themes: ['undrr', 'preventionweb', 'irp', 'mcr2030'],
    locales: ['en', 'ar', 'my', 'ja'],
    breakpoints: { mobile: '480px', tablet: '900px', desktop: '1164px', wide: '1440px' },
  },
  generatedAt: new Date().toISOString(),
}, null, 2);

fs.writeFileSync(path.join(buildDir, 'llms.json'), llmsJson);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

const indexSizeKB = (Buffer.byteLength(indexJson) / 1024).toFixed(1);
const totalDetailKB = componentFiles
  .reduce((sum, { content }) => sum + Buffer.byteLength(JSON.stringify(content, null, 2)), 0);
const utilitiesSizeKB = (Buffer.byteLength(utilitiesJson) / 1024).toFixed(1);

console.log('AI manifest generated:');
console.log(`  ${llmsTxtPath} (llms.txt + llms.json)`);
console.log(`  ${outputDir}/index.json (${indexEntries.length} components, ${indexSizeKB} KB)`);
console.log(`  ${outputDir}/*.json (${componentFiles.length} component files, ${(totalDetailKB / 1024).toFixed(1)} KB total)`);
console.log(`  ${outputDir}/utilities.json (${utilitiesSizeKB} KB)`);
console.log(`  ${vanillaCount} vanilla HTML components, ${reactCount} React-only components`);
