#!/usr/bin/env node

/**
 * generate-ai-manifest.js
 *
 * Transforms Storybook's components manifest into a tiered set of AI-friendly
 * files that are deployed alongside the static Storybook site:
 *
 *   llms.txt                       — plain-text discovery file for AI agents
 *   llms.json                      — structured version of llms.txt for tooling
 *   ai-components/index.json       — lightweight component index
 *   ai-components/{id}.json        — full details per component
 *   ai-components/utilities.json   — CSS utility class inventory
 *
 * Depends on render-component-html.js having run first (produces
 * rendered-html.json with auto-rendered component HTML). Both scripts
 * are chained in the `yarn build` command.
 *
 * Usage:
 *   node scripts/ai-manifest/generate-ai-manifest.js [--build-dir=docs-build-temp] [--validate]
 *
 * Flags:
 *   --validate   Check curated data keys against the Storybook manifest and
 *                run a11y lint on curated HTML. Exits non-zero if any
 *                keys are unmatched or a11y violations are found. Useful in CI.
 */

import fs from 'fs';
import path from 'path';
import htmlExamplesRaw from './data/component-data/index.js';
import cssUtilities from './data/css-utilities.js';
import {
  THEME_CSS as THEME_CSS_RAW,
  REQUIRED_SCRIPTS as REQUIRED_SCRIPTS_RAW,
  REQUIRED_STYLESHEETS as REQUIRED_STYLESHEETS_RAW,
  LOGOS as LOGOS_RAW,
} from './data/constants.js';

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

// Auto-rendered HTML from render-component-html.js (if available)
const renderedHtmlPath = path.join(outputDir, 'rendered-html.json');
const renderedHtml = fs.existsSync(renderedHtmlPath)
  ? JSON.parse(fs.readFileSync(renderedHtmlPath, 'utf8'))
  : {};

// Replace {{version}} tokens with actual version from package.json
const replaceVersion = obj => JSON.parse(
  JSON.stringify(obj).replaceAll('{{version}}', pkg.version),
);
const htmlExamples = replaceVersion(htmlExamplesRaw);
const THEME_CSS = replaceVersion(THEME_CSS_RAW);
const REQUIRED_SCRIPTS = replaceVersion(REQUIRED_SCRIPTS_RAW);
const REQUIRED_STYLESHEETS = replaceVersion(REQUIRED_STYLESHEETS_RAW);
const LOGOS = replaceVersion(LOGOS_RAW);
const generatedAt = new Date().toISOString();

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

  // Fall back to curated description from component-data data
  if (htmlData?.description) return htmlData.description;

  return '';
}

/** Build the Storybook docs URL for a component. */
function docsUrl(componentId) {
  return `${DOCS_BASE}?path=/docs/${componentId}--docs`;
}

// ---------------------------------------------------------------------------
// Validate curated data
// ---------------------------------------------------------------------------

// Duplicate key detection now happens in component-data/index.js at import time.

const manifestIds = new Set(Object.values(manifest.components).map(c => c.id));
const unmatchedKeys = Object.keys(htmlExamples).filter(k => !manifestIds.has(k));
const uncoveredIds = [...manifestIds].filter(id =>
  !htmlExamples[id] && !id.startsWith('example-'),
);

if (unmatchedKeys.length > 0) {
  console.warn('Warning: component-data keys not found in Storybook manifest:');
  for (const k of unmatchedKeys) console.warn(`  - ${k}`);
}
if (uncoveredIds.length > 0) {
  console.warn(`Note: ${uncoveredIds.length} component(s) have no entry in component-data/:`);
  for (const id of uncoveredIds) console.warn(`  - ${id}`);
}

// ---------------------------------------------------------------------------
// Check 1: A11y lint of curated HTML examples
// ---------------------------------------------------------------------------

const a11yRules = [
  {
    id: 'role-button-on-link',
    label: 'role="button" on link element',
    test(html) {
      return /<a[^>]*role="button"[^>]*href=/.test(html)
        || /<a[^>]*href=[^>]*role="button"/.test(html);
    },
  },
  {
    id: 'icon-missing-aria-hidden',
    label: 'icon element missing aria-hidden="true"',
    test(html) {
      // Match <i or <span with mg-icon class (but not mg-icon-wrap)
      const iconPattern = /<(?:i|span)\b[^>]*class="[^"]*\bmg-icon\b(?!-wrap)[^"]*"[^>]*>/g;
      let match;
      while ((match = iconPattern.exec(html)) !== null) {
        if (!/aria-hidden\s*=\s*"true"/.test(match[0])) return true;
      }
      return false;
    },
  },
  {
    id: 'redundant-nav-role',
    label: 'redundant role="navigation" on <nav>',
    test(html) {
      return /<nav[^>]*role="navigation"/.test(html);
    },
  },
  {
    id: 'section-without-name',
    label: '<section> without accessible name',
    test(html) {
      const sectionPattern = /<section\b[^>]*>/g;
      let match;
      while ((match = sectionPattern.exec(html)) !== null) {
        if (!/aria-label(ledby)?\s*=/.test(match[0])) return true;
      }
      return false;
    },
  },
];

const a11yViolations = [];

for (const [componentId, data] of Object.entries(htmlExamples)) {
  if (!data?.examples) continue;
  for (const example of data.examples) {
    if (!example.html) continue;
    for (const rule of a11yRules) {
      if (rule.test(example.html)) {
        a11yViolations.push({
          componentId,
          exampleName: example.name || '(unnamed)',
          rule: rule.id,
          label: rule.label,
        });
      }
    }
  }
}

if (a11yViolations.length > 0) {
  console.warn('A11y lint warnings in curated HTML:');
  for (const v of a11yViolations) {
    console.warn(`  ${v.componentId} / "${v.exampleName}": ${v.label}`);
  }
}

// ---------------------------------------------------------------------------
// Check 2: PropTypes coverage warning
// ---------------------------------------------------------------------------

const totalComponents = Object.keys(manifest.components).length;
const withProps = Object.values(manifest.components).filter(
  c => c.reactDocgen?.props && Object.keys(c.reactDocgen.props).length > 0,
).length;
const coverage = totalComponents > 0
  ? Math.round((withProps / totalComponents) * 100)
  : 0;

console.log(
  `PropTypes coverage: ${withProps} of ${totalComponents} components have props documented (${coverage}%)`,
);

// ---------------------------------------------------------------------------
// Check 3: CSS class existence check
// ---------------------------------------------------------------------------

const staleCssWarnings = [];

for (const [componentId, data] of Object.entries(htmlExamples)) {
  if (!data?.cssClasses?.length || !data?.examples?.length) continue;

  const allHtml = data.examples.map(e => e.html || '').join(' ');
  const hasAnyClass = data.cssClasses.some(cls => allHtml.includes(cls));

  if (!hasAnyClass) {
    staleCssWarnings.push(componentId);
  }
}

if (staleCssWarnings.length > 0) {
  console.warn('CSS class existence warnings (cssClasses not found in curated HTML):');
  for (const id of staleCssWarnings) {
    console.warn(`  - ${id}`);
  }
}

// ---------------------------------------------------------------------------
// Validate-only exit
// ---------------------------------------------------------------------------

if (validateOnly) {
  let failed = false;

  if (unmatchedKeys.length > 0) {
    console.error('Validation failed: component-data keys do not match manifest.');
    failed = true;
  }
  if (a11yViolations.length > 0) {
    console.error(`Validation failed: ${a11yViolations.length} a11y violation(s) in curated HTML.`);
    failed = true;
  }

  if (failed) {
    process.exit(1);
  }
  console.log('Validation passed: all checks OK.');
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

  // Rendered HTML examples: prefer auto-rendered from dist/, fall back to curated
  if (renderedHtml[id]) {
    detail.renderedHtml = renderedHtml[id];
    detail.renderedHtmlSource = 'auto';
  } else if (htmlData?.examples) {
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
      css: `<link rel="stylesheet" href="${THEME_CSS.undrr}" />`,
      cssThemes: THEME_CSS,
    },
    requiredAssets: {
      _note: 'Every UNDRR-branded page should include these assets. Order matters.',
      stylesheets: REQUIRED_STYLESHEETS,
      scripts: REQUIRED_SCRIPTS,
      logos: LOGOS,
    },
  },
  components: indexEntries,
  generatedAt,
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

const utilities = replaceVersion({
  _ai: 'CSS utility classes for the UNDRR Mangrove library. '
    + 'Include the Mangrove CSS bundle to use these classes in plain HTML.',
  ...cssUtilities,
  generatedAt,
});

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
   - UNDRR: ${THEME_CSS.undrr}
   - PreventionWeb: ${THEME_CSS.preventionweb}
   - MCR2030: ${THEME_CSS.mcr2030}
   - IRP: ${THEME_CSS.irp}

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
    css: THEME_CSS,
  },
  requiredAssets: {
    _note: 'Every UNDRR-branded page should include these. The page header and footer structures are non-negotiable branding elements — use them exactly as documented.',
    stylesheets: REQUIRED_STYLESHEETS.map(s => s.url),
    scripts: REQUIRED_SCRIPTS.map(s => ({ url: s.url, defer: s.attributes === 'defer' })),
    logos: LOGOS,
  },
  conventions: {
    cssPrefix: 'mg-',
    naming: 'BEM',
    themes: ['undrr', 'preventionweb', 'irp', 'mcr2030'],
    locales: ['en', 'ar', 'my', 'ja'],
    breakpoints: { mobile: '480px', tablet: '900px', desktop: '1164px', wide: '1440px' },
  },
  generatedAt,
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
console.log(`  ${Object.keys(renderedHtml).length} auto-rendered, ${componentFiles.filter(c => c.content.renderedHtml && !c.content.renderedHtmlSource).length} curated HTML`);
