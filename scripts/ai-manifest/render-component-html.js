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
  {
    file: 'ScrollContainer',
    componentId: 'components-scrollcontainer',
    variants: [
      {
        name: 'Default scroll container with sample items',
        props: {
          children: [
            React.createElement('div', { key: '1', style: { minWidth: '200px', padding: '1rem', background: '#f0f0f0' } }, 'Item 1'),
            React.createElement('div', { key: '2', style: { minWidth: '200px', padding: '1rem', background: '#e0e0e0' } }, 'Item 2'),
            React.createElement('div', { key: '3', style: { minWidth: '200px', padding: '1rem', background: '#d0d0d0' } }, 'Item 3'),
            React.createElement('div', { key: '4', style: { minWidth: '200px', padding: '1rem', background: '#c0c0c0' } }, 'Item 4'),
          ],
          showArrows: true,
        },
      },
    ],
  },
  {
    file: 'Gallery',
    componentId: 'components-gallery',
    variants: [
      {
        name: 'Single image gallery',
        props: {
          media: [
            {
              id: 'img-1',
              type: 'image',
              src: 'https://www.undrr.org/sites/default/files/2024-01/drr-hero.jpg',
              alt: 'Disaster risk reduction in action',
              title: 'Building resilience',
              description: 'Communities working together to reduce disaster risk.',
            },
          ],
        },
      },
      {
        name: 'Multi-image gallery with captions',
        props: {
          media: [
            {
              id: 'img-1',
              type: 'image',
              src: 'https://www.undrr.org/sites/default/files/2024-01/drr-hero.jpg',
              alt: 'Early warning systems',
              title: 'Early warning for all',
              description: 'Ensuring every person on Earth is protected by early warning systems.',
            },
            {
              id: 'img-2',
              type: 'image',
              src: 'https://www.undrr.org/sites/default/files/2024-01/sendai-framework.jpg',
              alt: 'Sendai Framework',
              title: 'Sendai Framework for Disaster Risk Reduction',
              description: 'The global blueprint for reducing disaster losses.',
            },
            {
              id: 'img-3',
              type: 'image',
              src: 'https://www.undrr.org/sites/default/files/2024-01/resilient-cities.jpg',
              alt: 'Making cities resilient',
              title: 'MCR2030',
              description: 'Making cities resilient by 2030.',
            },
          ],
          showThumbnails: true,
          thumbnailPosition: 'bottom',
        },
      },
    ],
  },
  // --- Buttons ---
  {
    file: 'Chips',
    componentId: 'components-buttons-chips',
    variants: [
      {
        name: 'Default chip',
        props: { label: 'Flood' },
      },
      {
        name: 'Dismissible chip',
        props: { label: 'Earthquake', Type: 'With X' },
      },
    ],
  },
  {
    file: 'CtaButton',
    componentId: 'components-buttons-buttons',
    variants: [
      {
        name: 'Primary button with arrow',
        props: { label: 'Take action', Type: 'Primary', For_Primary: 'Arrow' },
      },
      {
        name: 'Secondary button',
        props: { label: 'Learn more', Type: 'Secondary' },
      },
    ],
  },
  {
    file: 'CtaLink',
    componentId: 'components-buttons-cta-link',
    variants: [
      {
        name: 'CTA link with arrow',
        props: { label: 'Explore our resources' },
      },
    ],
  },
  // --- Forms ---
  {
    file: 'TextInput',
    componentId: 'components-forms-text-input',
    variants: [
      {
        name: 'Text input with label and help text',
        props: {
          label: 'Organization name',
          type: 'text',
          required: true,
          placeholder: 'Enter organization name',
          helpText: 'Enter the full legal name of your organization.',
        },
      },
      {
        name: 'Text input with error',
        props: {
          label: 'Email address',
          type: 'email',
          error: true,
          errorText: 'Enter a valid email address',
          defaultValue: 'invalid-email',
        },
      },
    ],
  },
  {
    file: 'Select',
    componentId: 'components-forms-select',
    variants: [
      {
        name: 'Select with options',
        props: {
          label: 'Country',
          options: [
            { value: 'JP', label: 'Japan' },
            { value: 'NP', label: 'Nepal' },
            { value: 'PH', label: 'Philippines' },
          ],
          placeholder: 'Select a country',
        },
      },
    ],
  },
  {
    file: 'Checkbox',
    componentId: 'components-forms-checkbox',
    variants: [
      {
        name: 'Checkbox with label',
        props: { label: 'I agree to the terms and conditions', name: 'terms', value: 'agree' },
      },
    ],
  },
  {
    file: 'Radio',
    componentId: 'components-forms-radio',
    variants: [
      {
        name: 'Radio button',
        props: { label: 'Government', name: 'role', value: 'government' },
      },
    ],
  },
  {
    file: 'Textarea',
    componentId: 'components-forms-textarea',
    variants: [
      {
        name: 'Textarea with label and help text',
        props: {
          label: 'Message',
          name: 'message',
          rows: 5,
          placeholder: 'Your message here',
          helpText: 'Max 500 characters.',
        },
      },
    ],
  },
  {
    file: 'FormGroup',
    componentId: 'components-forms-formgroup',
    variants: [
      {
        name: 'Form group with legend',
        props: {
          legend: 'What is your role?',
          children: React.createElement('div', null,
            React.createElement('div', { className: 'mg-radio', key: '1' },
              React.createElement('input', { type: 'radio', id: 'r1', name: 'role', value: 'researcher' }),
              React.createElement('label', { htmlFor: 'r1' }, 'Researcher'),
            ),
            React.createElement('div', { className: 'mg-radio', key: '2' },
              React.createElement('input', { type: 'radio', id: 'r2', name: 'role', value: 'practitioner' }),
              React.createElement('label', { htmlFor: 'r2' }, 'Practitioner'),
            ),
          ),
        },
      },
    ],
  },
  {
    file: 'FormErrorSummary',
    componentId: 'components-forms-formerrorsummary',
    variants: [
      {
        name: 'Error summary with validation messages',
        props: {
          title: 'There is a problem',
          errors: [
            { id: 'email', message: 'Enter a valid email address' },
            { id: 'org-name', message: 'Organization name is required' },
          ],
        },
      },
    ],
  },
  // --- Cards ---
  {
    file: 'VerticalCard',
    componentId: 'components-cards-vertical-card',
    variants: [
      {
        name: 'Vertical card with image and labels',
        props: {
          data: [{
            title: 'Building resilience through early warning systems',
            link: '/news/building-resilience',
            imgback: 'https://picsum.photos/600/400',
            imgalt: 'Community workshop on disaster preparedness',
            label1: 'Early warning',
            summaryText: 'New partnerships strengthen disaster preparedness across the Asia-Pacific region.',
          }],
          variant: 'primary',
        },
      },
    ],
  },
  {
    file: 'HorizontalCard',
    componentId: 'components-cards-horizontal-card',
    variants: [
      {
        name: 'Horizontal card with image',
        props: {
          data: [{
            title: 'Climate adaptation strategies for vulnerable communities',
            link: '/news/climate-adaptation',
            imgback: 'https://picsum.photos/400/300',
            imgalt: 'Climate adaptation meeting',
            label1: 'Climate',
            label2: 'Adaptation',
            summaryText: 'Experts gather to discuss integrated approaches to climate resilience.',
          }],
          variant: 'primary',
        },
      },
    ],
  },
  {
    file: 'BookCard',
    componentId: 'components-cards-book-card',
    variants: [
      {
        name: 'Book card with cover',
        props: {
          data: [{
            title: 'Global Assessment Report on Disaster Risk Reduction 2024',
            link: '/publications/gar-2024',
            imgback: 'https://picsum.photos/300/400',
            imgalt: 'GAR 2024 cover',
          }],
          variant: 'primary',
        },
      },
    ],
  },
  {
    file: 'HorizontalBookCard',
    componentId: 'components-cards-horizontal-book-card',
    variants: [
      {
        name: 'Horizontal book card',
        props: {
          data: [{
            title: 'Sendai Framework Monitor Report',
            link: '/publications/sendai-monitor',
            imgback: 'https://picsum.photos/300/400',
            imgalt: 'Report cover',
            label1: 'DRR',
            summaryText: 'Progress on implementation of the Sendai Framework.',
          }],
          variant: 'primary',
        },
      },
    ],
  },
  // --- Navigation ---
  {
    file: 'Breadcrumbs',
    componentId: 'components-navigation-breadcrumbs',
    variants: [
      {
        name: 'Breadcrumb navigation',
        props: {
          data: [
            { text: 'Home' },
            { text: 'Publications' },
            { text: 'Global Assessment Report 2024' },
          ],
        },
      },
    ],
  },
  {
    file: 'Pagination',
    componentId: 'components-navigation-pagination',
    variants: [
      {
        name: 'Pagination controls',
        props: { text: 'Page', text2: 'of' },
      },
    ],
  },
  // --- Content ---
  {
    file: 'Tab',
    componentId: 'components-tabs',
    variants: [
      {
        name: 'Horizontal tabs',
        props: {
          tabdata: [
            { text: 'Overview', text_id: 'overview', is_default: 'true', data: '<p>Overview of disaster risk reduction efforts.</p>' },
            { text: 'Details', text_id: 'details', data: '<p>Detailed implementation guidance.</p>' },
            { text: 'Resources', text_id: 'resources', data: '<p>Additional resources and downloads.</p>' },
          ],
          variant: 'horizontal',
        },
      },
    ],
  },
  {
    file: 'Hero',
    componentId: 'components-hero-hero',
    variants: [
      {
        name: 'Hero with background image',
        props: {
          data: [{
            title: 'Reducing disaster risk for a resilient future',
            imgback: 'https://picsum.photos/1600/600',
            summaryText: 'The Sendai Framework guides global efforts to reduce disaster risk and build resilience.',
            label: 'Featured',
            primary_button: 'Learn more',
          }],
          variant: 'primary',
        },
      },
    ],
  },
  {
    file: 'PageHeader',
    componentId: 'components-pageheader',
    variants: [
      {
        name: 'Page header with logo and language selector',
        props: {
          variant: 'default',
          logoUrl: 'https://assets.undrr.org/static/logos/undrr/undrr-logo-horizontal.svg',
          homeUrl: '/',
          languages: [
            { value: 'en', label: 'English', selected: true },
            { value: 'ar', label: 'Arabic' },
            { value: 'fr', label: 'French' },
          ],
        },
      },
    ],
  },
  {
    file: 'Footer',
    componentId: 'components-footer',
    variants: [
      {
        name: 'Footer without syndication',
        props: { enableSyndication: false },
      },
    ],
  },
  // --- Utilities ---
  {
    file: 'HighlightBox',
    componentId: 'components-highlightbox',
    variants: [
      {
        name: 'Default highlight box',
        props: {
          children: React.createElement('div', null,
            React.createElement('h3', null, 'Key information'),
            React.createElement('p', null, 'Highlighted content draws attention to important information.'),
          ),
        },
      },
      {
        name: 'Primary highlight box',
        props: {
          variant: 'primary',
          children: React.createElement('div', null,
            React.createElement('h3', null, 'Important update'),
            React.createElement('p', null, 'This uses the corporate blue background for emphasis.'),
          ),
        },
      },
      {
        name: 'Centered secondary highlight box',
        props: {
          variant: 'secondary',
          centered: true,
          children: React.createElement('div', null,
            React.createElement('h3', null, 'Sendai Framework'),
            React.createElement('p', null, 'Centered at 80% width with the Sendai purple theme.'),
          ),
        },
      },
    ],
  },
  {
    file: 'EmbedContainer',
    componentId: 'utilities-embedcontainer',
    variants: [
      {
        name: '16:9 embed container (default)',
        props: {
          children: React.createElement('iframe', {
            src: 'https://www.youtube-nocookie.com/embed/bIpPtHJbV-Q',
            title: 'UNDRR video',
            loading: 'lazy',
            allowFullScreen: true,
          }),
        },
      },
      {
        name: '4:3 embed container',
        props: {
          aspectRatio: '4x3',
          children: React.createElement('iframe', {
            src: 'https://www.youtube-nocookie.com/embed/bIpPtHJbV-Q',
            title: 'UNDRR video (4:3)',
            loading: 'lazy',
            allowFullScreen: true,
          }),
        },
      },
    ],
  },
  {
    file: 'FullWidth',
    componentId: 'components-fullwidth',
    variants: [
      {
        name: 'Full-width breakout section',
        props: {
          children: React.createElement('div', { style: { padding: '2rem', background: '#f0f4f8', textAlign: 'center' } },
            React.createElement('h3', null, 'Full-width content'),
            React.createElement('p', null, 'This section breaks out of its parent container to span the full viewport width.'),
          ),
        },
      },
    ],
  },
  {
    file: 'Loader',
    componentId: 'components-loader',
    variants: [
      {
        name: 'Loading spinner',
        props: { label: 'Loading content' },
      },
    ],
  },
  {
    file: 'ShowMore',
    componentId: 'components-showmore',
    variants: [
      {
        name: 'Collapsible content with toggle',
        props: {
          data: [{
            button_text: 'Show more',
            collapsable_wrapper_class: 'mg-show-more--collapsed',
            collapsable_text: 'Additional content that is initially hidden and revealed on toggle.',
          }],
        },
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

    // Accept functions and React.memo objects (which are objects with $$typeof)
    const isRenderable = typeof Component === 'function'
      || (Component != null && typeof Component === 'object' && Component.$$typeof != null);
    if (!isRenderable) {
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
