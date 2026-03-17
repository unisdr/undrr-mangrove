#!/usr/bin/env node

/**
 * render-component-html.js
 *
 * Renders built React components from dist/components/ with sample props
 * using renderToStaticMarkup. Outputs a JSON file mapping component names
 * to formatted HTML strings.
 *
 * This replaces hand-written HTML examples for components that render
 * cleanly in a Node.js (non-browser) environment. Components that need
 * browser APIs (document, window) fall back to curated HTML in
 * scripts/ai-manifest/data/component-data/. DOMPurify-dependent
 * components work because the bundled library detects the missing
 * window and becomes a passthrough.
 *
 * Output is consumed by generate-ai-manifest.js (the next step in the
 * build pipeline). Both scripts are chained in `yarn build`.
 *
 * Usage:
 *   node scripts/ai-manifest/render-component-html.js [--build-dir=docs-build-temp]
 *
 * Outputs:
 *   {build-dir}/ai-components/rendered-html.json
 */

import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import prettier from 'prettier';
import HTMLParser from 'prettier/parser-html';

// ---------------------------------------------------------------------------
// DOMPurify SSR shim
// ---------------------------------------------------------------------------
// Components like IconCard use DOMPurify to sanitize user-supplied HTML.
// The bundled DOMPurify (in dist/components/) detects the absence of `window`
// and falls back to a passthrough (`isSupported = false` → sanitize returns
// the input string unchanged). No global mock is needed — this comment
// documents why IconCard renders safely in Node.js despite its DOMPurify
// dependency: we control the sample props (no untrusted input), and the
// bundled library already handles the headless environment gracefully.

const args = process.argv.slice(2);
const buildDirArg = (args.find(a => a.startsWith('--build-dir=')) || '').split('=')[1];
const buildDir = path.resolve(process.cwd(), buildDirArg || 'docs-build-temp');
const distDir = path.resolve(process.cwd(), 'dist/components');
const outputPath = path.join(buildDir, 'ai-components', 'rendered-html.json');

/**
 * Sample props for each renderable component. These should produce
 * representative HTML — not exhaustive examples, just the default variant
 * with realistic content.
 *
 * Most components render cleanly in Node.js. Components that use DOMPurify
 * (e.g. IconCard) also work because the bundled DOMPurify detects the
 * missing `window` and falls back to a passthrough. Components that truly
 * require browser-only APIs (document.querySelector, window.matchMedia)
 * are excluded and fall back to curated HTML in component-data/.
 */
const RENDER_SPECS = [
  {
    file: 'QuoteHighlight',
    componentId: 'components-quotehighlight',
    variants: [
      {
        name: 'Quote with line separator and attribution',
        props: {
          quote: 'Prevention is not a cost. It is an investment in our common future.',
          attribution: 'Mami Mizutori',
          attributionTitle: 'Special Representative of the Secretary-General for Disaster Risk Reduction',
          backgroundColor: 'light',
          variant: 'line',
          alignment: 'full',
        },
      },
      {
        name: 'Quote with portrait image',
        props: {
          quote: 'Building resilience requires a whole-of-society approach.',
          attribution: 'Speaker name',
          attributionTitle: 'Role, Organization',
          imageSrc: 'https://picsum.photos/100/100',
          imageAlt: 'Speaker portrait',
          backgroundColor: 'light',
          variant: 'line',
          alignment: 'full',
        },
      },
      {
        name: 'Dark background, full width with large image',
        props: {
          quote: 'Disaster risk reduction is everyone\'s business.',
          attribution: 'UNDRR',
          imageSrc: 'https://picsum.photos/600/400',
          imageAlt: 'Disaster resilience',
          backgroundColor: 'dark',
          variant: 'image',
          alignment: 'full',
        },
      },
    ],
  },
  {
    file: 'StatsCard',
    componentId: 'components-cards-stats-card',
    variants: [
      {
        name: 'Stats card with three items',
        props: {
          title: 'Key figures',
          stats: [
            { value: '1.23 million', bottomLabel: 'People affected' },
            { value: '195', bottomLabel: 'Countries reporting' },
            { value: '$2.8 trillion', link: '/data/losses', bottomLabel: 'Economic losses (2000-2024)' },
          ],
        },
      },
      {
        name: 'Compact stats card with icons',
        props: {
          title: '',
          variant: 'compact',
          stats: [
            { icon: 'mg-icon mg-icon-globe', label: 'Regions', value: '5' },
            { icon: 'mg-icon mg-icon-cubes', label: 'Partners', value: '142' },
          ],
        },
      },
    ],
  },
  {
    file: 'IconCard',
    componentId: 'components-cards-icon-card',
    variants: [
      {
        name: 'Icon card with CSS icon',
        props: {
          data: [
            {
              icon: 'mg-icon mg-icon-globe',
              imageScale: 'medium',
              title: 'Global risk assessment',
              summaryText: 'Comprehensive analysis of disaster risk trends across all regions.',
              link: '/risk-assessment',
              linkText: 'Learn more',
            },
          ],
        },
      },
      {
        name: 'Centered icon card with image',
        props: {
          centered: true,
          data: [
            {
              imgback: 'https://www.undrr.org/sites/default/files/inline-images/icon.svg',
              imgalt: 'Early warning systems',
              imageScale: 'medium',
              title: 'Early warning for all',
              summaryText: 'Ensuring every person on Earth is protected by early warning systems by 2027.',
              link: '/early-warnings-for-all',
              button: 'Get involved',
              buttonType: 'Primary',
            },
          ],
        },
      },
    ],
  },
  {
    file: 'Pager',
    componentId: 'components-pager',
    variants: [
      {
        name: 'Centered pagination',
        props: {
          page: 3,
          totalPages: 12,
          onPageChange: () => {},
          layout: 'centered',
          ariaLabel: 'Search results pages',
        },
      },
    ],
  },
  {
    file: 'MegaMenu',
    componentId: 'components-megamenu',
    variants: [
      {
        name: 'Navigation menu with sections',
        props: {
          sections: [
            {
              items: [
                { title: 'About', url: '/about', items: [
                  { title: 'Our mission', url: '/about/mission' },
                  { title: 'Our team', url: '/about/team' },
                ] },
                { title: 'Topics', url: '/topics', items: [
                  { title: 'Early warning', url: '/topics/early-warning' },
                  { title: 'Climate change', url: '/topics/climate' },
                ] },
                { title: 'Publications', url: '/publications' },
              ],
            },
          ],
        },
      },
    ],
  },
  {
    file: 'SyndicationSearchWidget',
    componentId: 'components-syndicationsearchwidget',
    variants: [
      {
        name: 'Search widget (default configuration)',
        props: {},
      },
    ],
  },
];

// -----------------------------------------------------------------------
// Render
// -----------------------------------------------------------------------

async function formatHtml(html) {
  return prettier.format(html, {
    parser: 'html',
    plugins: [HTMLParser],
    printWidth: 100,
  });
}

const results = {};
let rendered = 0;
let failed = 0;

for (const spec of RENDER_SPECS) {
  const modulePath = path.join(distDir, `${spec.file}.js`);
  if (!fs.existsSync(modulePath)) {
    console.warn(`  skip ${spec.file}: dist/components/${spec.file}.js not found`);
    failed++;
    continue;
  }

  try {
    const mod = await import(modulePath);
    const Component = mod.default || mod[spec.file]
      || mod[Object.keys(mod).find(k => typeof mod[k] === 'function')];

    if (typeof Component !== 'function') {
      console.warn(`  skip ${spec.file}: no renderable export`);
      failed++;
      continue;
    }

    const examples = [];
    for (const variant of spec.variants) {
      const html = renderToStaticMarkup(React.createElement(Component, variant.props));
      if (html.length < 30) continue; // trivial/empty render
      examples.push({
        name: variant.name,
        html: await formatHtml(html),
      });
    }

    if (examples.length > 0) {
      results[spec.componentId] = examples;
      rendered++;
    }
  } catch (e) {
    console.warn(`  skip ${spec.file}: ${e.message.split('\n')[0]}`);
    failed++;
  }
}

// -----------------------------------------------------------------------
// Write output
// -----------------------------------------------------------------------

if (rendered === 0 && RENDER_SPECS.length > 0) {
  console.error('Error: no components rendered successfully. Is dist/components/ populated?');
  console.error('Run "yarn build" (webpack step) before render-component-html.js.');
  process.exit(1);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

console.log(`Rendered component HTML: ${rendered} components, ${failed} skipped`);
console.log(`  ${outputPath}`);
