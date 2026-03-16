#!/usr/bin/env node

/**
 * generate-ai-manifest.js
 *
 * Transforms Storybook's components manifest into a tiered set of AI-friendly
 * files that are deployed alongside the static Storybook site:
 *
 *   llms.txt                       — plain-text discovery file for AI agents
 *   ai-components/index.json       — lightweight component index (~10-15 KB)
 *   ai-components/{id}.json        — full details per component (~1-5 KB each)
 *
 * Usage:
 *   node scripts/generate-ai-manifest.js [--build-dir=docs-build-temp]
 */

import fs from 'fs';
import path from 'path';

const DOCS_BASE = 'https://unisdr.github.io/undrr-mangrove/';

// CLI args
const args = process.argv.slice(2);
const buildDirArg = (args.find(a => a.startsWith('--build-dir=')) || '').split('=')[1];
const buildDir = path.resolve(process.cwd(), buildDirArg || 'docs-build-temp');

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

/** Get the best description for a component. */
function getDescription(component) {
  if (component.description) return component.description;

  if (component.reactDocgen?.description) {
    const desc = component.reactDocgen.description
      .replace(/@param\s+\{[^}]*\}\s+\S+\s*/g, '')
      .replace(/@returns?\s+.*/g, '')
      .trim();
    if (desc) return desc.split('\n')[0];
  }

  return '';
}

/** Build the Storybook docs URL for a component. */
function docsUrl(componentId) {
  return `${DOCS_BASE}?path=/docs/${componentId}--docs`;
}

// ---------------------------------------------------------------------------
// Transform each component
// ---------------------------------------------------------------------------

const indexEntries = [];
const componentFiles = [];

for (const [, component] of Object.entries(manifest.components)) {
  const id = component.id;
  const name = component.name || id;
  const description = getDescription(component);
  const jsDocParams = parseJsDocParams(component.jsDocTags);

  // --- Index entry (lightweight) ---
  const indexEntry = { id, name, description };
  if (component.import) indexEntry.import = component.import;
  indexEntry.docsUrl = docsUrl(id);
  indexEntry.detailsUrl = `${DOCS_BASE}ai-components/${id}.json`;
  indexEntries.push(indexEntry);

  // --- Full component file ---
  const detail = { name, description };
  if (component.import) detail.import = component.import;
  detail.docsUrl = docsUrl(id);

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

  // Story examples
  if (component.stories?.length) {
    detail.examples = component.stories.map(s => {
      const example = { name: s.name };
      if (s.snippet) example.code = s.snippet;
      return example;
    });
  }

  componentFiles.push({ id, content: detail });
}

// ---------------------------------------------------------------------------
// Write ai-components/index.json
// ---------------------------------------------------------------------------

fs.mkdirSync(outputDir, { recursive: true });

const index = {
  _ai: 'Component index for the UNDRR Mangrove library. '
    + 'Each entry has a detailsUrl pointing to a JSON file with full props, types, and code examples.',
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
// Write llms.txt
// ---------------------------------------------------------------------------

const llmsTxt = `# UNDRR Mangrove

> React component library for UNDRR's disaster risk reduction websites (undrr.org, preventionweb.net, mcr2030.undrr.org). Built with Storybook.

- Version: ${pkg.version}
- Package: ${pkg.name}
- License: ISC

## Links

- Storybook: ${DOCS_BASE}
- Repository: https://github.com/unisdr/undrr-mangrove
- npm: https://www.npmjs.com/package/${pkg.name}

## Component data for AI agents

The Storybook site is a single-page app, so fetching pages directly won't give you readable content. Use the JSON files below instead.

Component index (all ${indexEntries.length} components, ~29 KB):
${DOCS_BASE}ai-components/index.json

Each entry in the index has a detailsUrl pointing to a per-component JSON file with props, types, defaults, and code examples.

### Conventions

- CSS prefix: mg-
- Naming: BEM (e.g., mg-card__title, mg-button--primary)
- Themes: undrr, preventionweb, irp, mcr2030
- Locales: en, ar, my, ja (RTL supported)
- Semantic HTML, WCAG accessible

### How to use

1. Fetch ${DOCS_BASE}ai-components/index.json
2. Find the component you need by name or description
3. Fetch its detailsUrl for props, types, and code examples

### Source layout

- stories/Atom/          Typography, images, layout, navigation
- stories/Molecules/     SectionHeader, FooterNavigation, BodyColumn
- stories/Components/    MegaMenu, Cards, Charts, Map, Gallery
- stories/Utilities/     CSS utilities, loaders, show/more
- stories/assets/scss/   Theme stylesheets and design tokens
`;

fs.writeFileSync(llmsTxtPath, llmsTxt);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

const indexSizeKB = (Buffer.byteLength(indexJson) / 1024).toFixed(1);
const totalDetailKB = componentFiles
  .reduce((sum, { content }) => sum + Buffer.byteLength(JSON.stringify(content, null, 2)), 0);

console.log('AI manifest generated:');
console.log(`  ${llmsTxtPath} (llms.txt)`);
console.log(`  ${outputDir}/index.json (${indexEntries.length} components, ${indexSizeKB} KB)`);
console.log(`  ${outputDir}/*.json (${componentFiles.length} component files, ${(totalDetailKB / 1024).toFixed(1)} KB total)`);
