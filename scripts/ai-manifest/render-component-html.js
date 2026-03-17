#!/usr/bin/env node

/**
 * render-component-html.js
 *
 * Auto-renders React components from dist/components/ using renderToStaticMarkup.
 * Outputs rendered-html.json consumed by generate-ai-manifest.js.
 *
 * Components are auto-discovered from dist/components/. The script:
 *   1. Scans dist/components/ for .js files
 *   2. Looks up each component's ID in component-data
 *   3. Renders with sample props (from SAMPLE_PROPS) or empty props
 *   4. Skips components that error or produce trivial output (<30 chars)
 *
 * To add a new auto-rendered component: add its webpack entry in
 * webpack.config.js. If it needs non-empty props to render meaningful
 * HTML, add an entry to SAMPLE_PROPS below.
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
import componentData from './data/component-data/index.js';

const args = process.argv.slice(2);
const buildDirArg = (args.find(a => a.startsWith('--build-dir=')) || '').split('=')[1];
const buildDir = path.resolve(process.cwd(), buildDirArg || 'docs-build-temp');
const distDir = path.resolve(process.cwd(), 'dist/components');
const outputPath = path.join(buildDir, 'ai-components', 'rendered-html.json');

// ---------------------------------------------------------------------------
// Component ID mapping
// ---------------------------------------------------------------------------
// Maps dist filename → component-data ID. Only needed where the filename
// doesn't match the ID pattern. Auto-discovery handles the rest.

const COMPONENT_IDS = {
  CtaButton: 'components-buttons-buttons',
  CtaLink: 'components-buttons-cta-link',
  VerticalCard: 'components-cards-vertical-card',
  HorizontalCard: 'components-cards-horizontal-card',
  BookCard: 'components-cards-book-card',
  HorizontalBookCard: 'components-cards-horizontal-book-card',
  IconCard: 'components-cards-icon-card',
  StatsCard: 'components-cards-stats-card',
  Breadcrumbs: 'components-navigation-breadcrumbs',
  Pagination: 'components-navigation-pagination',
  Tab: 'components-tabs',
  Hero: 'components-hero-hero',
  PageHeader: 'components-pageheader',
  Footer: 'components-footer',
  QuoteHighlight: 'components-quotehighlight',
  HighlightBox: 'components-highlightbox',
  EmbedContainer: 'utilities-embedcontainer',
  FullWidth: 'components-fullwidth',
  Loader: 'components-loader',
  ShowMore: 'components-showmore',
  Chips: 'components-buttons-chips',
  TextInput: 'components-forms-text-input',
  Select: 'components-forms-select',
  Checkbox: 'components-forms-checkbox',
  Radio: 'components-forms-radio',
  Textarea: 'components-forms-textarea',
  FormGroup: 'components-forms-formgroup',
  FormErrorSummary: 'components-forms-formerrorsummary',
  MegaMenu: 'components-megamenu',
  SyndicationSearchWidget: 'components-syndicationsearchwidget',
  ScrollContainer: 'components-scrollcontainer',
  Gallery: 'components-gallery',
  Pager: 'components-pager',
  MapComponent: 'components-maps-mapcomponent',
  BarChart: 'components-charts-barchart',
  Fetcher: 'components-fetcher',
  ShareButtons: 'components-buttons-sharebuttons',
};

// ---------------------------------------------------------------------------
// Sample props
// ---------------------------------------------------------------------------
// Minimal props needed for meaningful rendered output. Components not listed
// here render with {} (relying on defaults). Keep entries compact — one
// representative example per component is sufficient for the AI manifest.

const SAMPLE_PROPS = {
  // Buttons
  Chips: { label: 'Flood' },
  CtaButton: { label: 'Take action' },
  CtaLink: { label: 'Explore our resources' },

  // Forms
  TextInput: { label: 'Organization name', required: true, placeholder: 'Enter organization name', helpText: 'Full legal name of your organization.' },
  Select: { label: 'Country', options: [{ value: 'JP', label: 'Japan' }, { value: 'NP', label: 'Nepal' }, { value: 'PH', label: 'Philippines' }], placeholder: 'Select a country' },
  Checkbox: { label: 'I agree to the terms and conditions', name: 'terms' },
  Radio: { label: 'Government', name: 'role', value: 'government' },
  Textarea: { label: 'Message', name: 'message', rows: 5, placeholder: 'Your message here', helpText: 'Max 500 characters.' },
  FormGroup: {
    legend: 'What is your role?',
    children: React.createElement('div', null,
      React.createElement('div', { className: 'mg-radio', key: '1' },
        React.createElement('input', { type: 'radio', id: 'r1', name: 'role', value: 'researcher' }),
        React.createElement('label', { htmlFor: 'r1' }, 'Researcher')),
      React.createElement('div', { className: 'mg-radio', key: '2' },
        React.createElement('input', { type: 'radio', id: 'r2', name: 'role', value: 'practitioner' }),
        React.createElement('label', { htmlFor: 'r2' }, 'Practitioner'))),
  },
  FormErrorSummary: { title: 'There is a problem', errors: [{ id: 'email', message: 'Enter a valid email address' }, { id: 'org', message: 'Organization name is required' }] },

  // Cards
  VerticalCard: { data: [{ title: 'Building resilience through early warning systems', link: '/news/resilience', imgback: 'https://picsum.photos/600/400', imgalt: 'Workshop', label1: 'Early warning', summaryText: 'New partnerships strengthen disaster preparedness.' }] },
  HorizontalCard: { data: [{ title: 'Climate adaptation strategies', link: '/news/climate', imgback: 'https://picsum.photos/400/300', imgalt: 'Meeting', label1: 'Climate', summaryText: 'Integrated approaches to climate resilience.' }] },
  BookCard: { data: [{ title: 'Global Assessment Report 2024', link: '/publications/gar-2024', imgback: 'https://picsum.photos/300/400', imgalt: 'GAR 2024 cover' }] },
  HorizontalBookCard: { data: [{ title: 'Sendai Framework Monitor Report', link: '/publications/sendai', imgback: 'https://picsum.photos/300/400', imgalt: 'Cover', label1: 'DRR', summaryText: 'Progress on implementation.' }] },
  IconCard: { data: [{ icon: 'mg-icon mg-icon-globe', imageScale: 'medium', title: 'Global risk assessment', summaryText: 'Analysis of disaster risk trends.', link: '/risk', linkText: 'Learn more' }] },
  StatsCard: { title: 'Key figures', stats: [{ value: '1.23 million', bottomLabel: 'People affected' }, { value: '195', bottomLabel: 'Countries reporting' }, { value: '$2.8 trillion', bottomLabel: 'Economic losses' }] },

  // Navigation
  Breadcrumbs: { data: [{ text: 'Home' }, { text: 'Publications' }, { text: 'Global Assessment Report 2024' }] },
  Pagination: { text: 'Page', text2: 'of' },

  // Content
  Tab: { tabdata: [{ text: 'Overview', text_id: 'overview', is_default: 'true', data: '<p>Overview of disaster risk reduction.</p>' }, { text: 'Details', text_id: 'details', data: '<p>Implementation guidance.</p>' }], variant: 'horizontal' },
  Hero: { data: [{ title: 'Reducing disaster risk for a resilient future', imgback: 'https://picsum.photos/1600/600', summaryText: 'The Sendai Framework guides global efforts.', label: 'Featured', primary_button: 'Learn more' }] },
  PageHeader: { variant: 'default', logoUrl: 'https://assets.undrr.org/static/logos/undrr/undrr-logo-horizontal.svg', homeUrl: '/', languages: [{ value: 'en', label: 'English', selected: true }, { value: 'ar', label: 'Arabic' }] },
  Footer: { enableSyndication: false },

  // Quotes
  QuoteHighlight: { quote: 'Prevention is not a cost. It is an investment in our common future.', attribution: 'Mami Mizutori', attributionTitle: 'SRSG for Disaster Risk Reduction', backgroundColor: 'light', variant: 'line', alignment: 'full' },

  // Utilities
  HighlightBox: { children: React.createElement('div', null, React.createElement('h3', null, 'Key information'), React.createElement('p', null, 'Highlighted content draws attention to important information.')) },
  EmbedContainer: { children: React.createElement('iframe', { src: 'https://www.youtube-nocookie.com/embed/bIpPtHJbV-Q', title: 'UNDRR video', loading: 'lazy', allowFullScreen: true }) },
  FullWidth: { children: React.createElement('p', null, 'This section spans the full viewport width.') },
  Loader: { label: 'Loading content' },
  ShowMore: { data: [{ button_text: 'Show more', collapsable_wrapper_class: 'mg-show-more--collapsed', collapsable_text: 'Additional content revealed on toggle.' }] },

  // Complex React components
  Pager: { page: 3, totalPages: 12, onPageChange: () => {}, layout: 'centered', ariaLabel: 'Search results pages' },
  MegaMenu: { sections: [{ items: [{ title: 'About', url: '/about', items: [{ title: 'Our mission', url: '/about/mission' }] }, { title: 'Topics', url: '/topics', items: [{ title: 'Early warning', url: '/topics/early-warning' }] }] }] },
  ScrollContainer: {
    showArrows: true,
    children: [
      React.createElement('div', { key: '1', style: { minWidth: '200px', padding: '1rem', background: '#f0f0f0' } }, 'Item 1'),
      React.createElement('div', { key: '2', style: { minWidth: '200px', padding: '1rem', background: '#e0e0e0' } }, 'Item 2'),
      React.createElement('div', { key: '3', style: { minWidth: '200px', padding: '1rem', background: '#d0d0d0' } }, 'Item 3'),
    ],
  },
  Gallery: { media: [{ id: '1', type: 'image', src: 'https://picsum.photos/800/600', alt: 'Disaster risk reduction', title: 'Building resilience', description: 'Communities working to reduce disaster risk.' }] },
};

// Files to skip (not components or not renderable)
const SKIP_FILES = new Set(['hydrate']);

// ---------------------------------------------------------------------------
// Auto-discover and render
// ---------------------------------------------------------------------------

async function formatHtml(html) {
  return prettier.format(html, { parser: 'html', plugins: [HTMLParser], printWidth: 100 });
}

const results = {};
let rendered = 0;
let failed = 0;

// Discover all .js files in dist/components/
const distFiles = fs.existsSync(distDir)
  ? fs.readdirSync(distDir).filter(f => f.endsWith('.js')).map(f => f.replace('.js', ''))
  : [];

for (const fileName of distFiles) {
  if (SKIP_FILES.has(fileName)) continue;

  // Resolve component ID
  const componentId = COMPONENT_IDS[fileName];
  if (!componentId) continue; // Unknown component — not in our mapping

  // Only render components that have component-data entries
  if (!componentData[componentId]) continue;

  const modulePath = path.join(distDir, `${fileName}.js`);

  try {
    const mod = await import(modulePath);
    const Component = mod.default || mod[fileName]
      || mod[Object.keys(mod).find(k => typeof mod[k] === 'function')];

    // Accept functions and React.memo objects ($$typeof)
    const isRenderable = typeof Component === 'function'
      || (Component != null && typeof Component === 'object' && Component.$$typeof != null);
    if (!isRenderable) {
      console.warn(`  skip ${fileName}: no renderable export`);
      failed++;
      continue;
    }

    const props = SAMPLE_PROPS[fileName] || {};
    const html = renderToStaticMarkup(React.createElement(Component, props));
    if (html.length < 30) {
      failed++;
      continue;
    }

    const formatted = await formatHtml(html);
    results[componentId] = [{ name: componentData[componentId].description || fileName, html: formatted }];
    rendered++;
  } catch (e) {
    console.warn(`  skip ${fileName}: ${e.message.split('\n')[0]}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Write output
// ---------------------------------------------------------------------------

if (rendered === 0 && distFiles.length > 0) {
  console.error('Error: no components rendered. Is dist/components/ populated?');
  process.exit(1);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

console.log(`Rendered component HTML: ${rendered} components, ${failed} skipped`);
console.log(`  ${outputPath}`);
