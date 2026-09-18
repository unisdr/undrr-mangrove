#!/usr/bin/env node

/**
 * generate-ai-manifest.js — AI-friendly component manifest for UNDRR Mangrove
 *
 * Single entry point that:
 *   1. Auto-renders React components from dist/components/ via renderToStaticMarkup
 *   2. Merges Storybook metadata, auto-rendered HTML, and curated data
 *   3. Validates curated data keys, a11y patterns, and PropTypes coverage
 *   4. Writes output files deployed alongside the Storybook site:
 *
 *        llms.txt                       — plain-text discovery file for AI agents
 *        llms.json                      — structured version of llms.txt
 *        ai-components/index.json       — lightweight component index
 *        ai-components/{id}.json        — full details per component
 *        ai-components/utilities.json   — CSS utility class inventory
 *
 * Usage:
 *   node scripts/ai-manifest/generate-ai-manifest.js [--build-dir=docs-build-temp] [--docs-base=https://mangrove.undrr.org/] [--validate]
 *
 * Flags:
 *   --validate   Check curated data keys and a11y lint. Exits non-zero on failure.
 *   --docs-base  Public Storybook/docs base URL used in generated links.
 *                Can also be set with MANGROVE_DOCS_BASE_URL.
 *
 * To remove this pipeline:
 *   1. Delete scripts/ai-manifest/
 *   2. Remove generate-ai-manifest from package.json build/scripts
 *   3. Remove scripts/ai-manifest/** from .github/workflows/storybook.yml paths
 *   4. Remove validate step from the workflow's Build Storybook step
 *   5. Remove AI manifest references from: CONTRIBUTING.md, docs/RELEASES.md,
 *      docs/ARCHITECTURE.md, docs/COMPONENT-GUIDE.md, scripts/README.md,
 *      .github/pull_request_template.md
 *   6. Optionally delete stories/Documentation/AiMcpIntegration.mdx
 *   7. Delete docs-build-temp/ai-components/ output
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import htmlExamples, { REQUIRES_REACT } from './component-data.js';
import cssUtilities from './css-utilities.js';
import {
  buildReleasesManifest,
  parseComponentChangelog,
} from './parse-changelog.js';

const require = createRequire(import.meta.url);
const { buildTokensDictionary } = require('../build-tokens.cjs');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CDN_BASE = 'https://assets.undrr.org/mangrove/{{version}}';
const ASSETS_BASE = 'https://assets.undrr.org';
const DEFAULT_DOCS_BASE = 'https://mangrove.undrr.org/';

// One bundle per theme, plus the combined bundle.
//
// Each single-theme bundle carries its own token block and nothing else, so
// style.css has no .mg-theme-* rules at all: adding class="mg-theme-irp" to a
// page that loaded style.css changes nothing. Use that theme's own bundle, or
// style-all.css if the page has to switch themes at runtime.
const THEME_CSS = {
  undrr: `${CDN_BASE}/css/style.css`,
  preventionweb: `${CDN_BASE}/css/style-preventionweb.css`,
  mcr2030: `${CDN_BASE}/css/style-mcr.css`,
  irp: `${CDN_BASE}/css/style-irp.css`,
  delta: `${CDN_BASE}/css/style-delta.css`,
  all: `${CDN_BASE}/css/style-all.css`,
};

const REQUIRED_SCRIPTS = [
  {
    name: 'UNDRR analytics (GA4)',
    url: `${ASSETS_BASE}/static/analytics/v1.0.0/google_analytics_enhancements.js`,
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
    url: `${ASSETS_BASE}/static/cookie-banner/v1/cookieconsent.umd.js`,
    placement: 'before closing </body>, after analytics',
    attributes: 'none (synchronous)',
    note: 'Cookie consent library. Must load before the UNDRR config script.',
  },
  {
    name: 'Cookie consent UNDRR config',
    url: `${ASSETS_BASE}/static/cookie-banner/v1/cookieconsent-undrr.js`,
    placement: 'immediately after cookieconsent.umd.js',
    attributes: 'none (synchronous)',
    note: 'UNDRR-specific cookie consent configuration.',
  },
];

const REQUIRED_STYLESHEETS = [
  {
    name: 'Mangrove theme CSS',
    url: THEME_CSS.undrr,
    placement: 'head',
    note: 'Choose one theme. See THEME_CSS for alternatives.',
  },
  {
    name: 'Cookie consent CSS',
    url: `${ASSETS_BASE}/static/cookie-banner/v1/cookieconsent.css`,
    placement: 'head',
    note: 'Required if using the UNDRR cookie consent banner.',
  },
];

const LOGOS = {
  horizontal: `${ASSETS_BASE}/static/logos/undrr/undrr-logo-horizontal.svg`,
  vertical: `${ASSETS_BASE}/static/logos/undrr/undrr-logo-vertical.svg`,
  squareBlue: `${ASSETS_BASE}/static/logos/undrr/undrr-logo-square-blue.svg`,
};

const VANILLA_SCRIPTS = [
  {
    name: 'Tabs',
    file: 'js/tabs.js',
    url: `${CDN_BASE}/js/tabs.js`,
    selector: '[data-mg-js-tabs]',
    initFunction: 'mgTabs(scope, activateDeepLinkOnLoad)',
    description:
      'Initializes accessible horizontal tabs and stacked disclosure accordions. In SPAs or dynamically loaded DOM, call mgTabs(containerElement) to re-initialize.',
  },
  {
    name: 'Show More',
    file: 'js/show-more.js',
    url: `${CDN_BASE}/js/show-more.js`,
    selector: '[data-mg-show-more]',
    initFunction: 'mgShowMore(scope)',
    description:
      'Initializes progressive content truncation toggle buttons. Call mgShowMore(containerElement) for dynamic content.',
  },
  {
    name: 'Table of Contents',
    file: 'js/table-of-contents.js',
    url: `${CDN_BASE}/js/table-of-contents.js`,
    selector: '[data-mg-table-of-contents]',
    initFunction: 'mgTableOfContents(scope)',
    description:
      'Generates an in-page table of contents and scrollspy highlighting from headings in the article.',
  },
  {
    name: 'On This Page Nav',
    file: 'js/on-this-page-nav.js',
    url: `${CDN_BASE}/js/on-this-page-nav.js`,
    selector: '[data-mg-on-this-page-nav]',
    initFunction: 'mgOnThisPageNav(scope)',
    description:
      'In-page jump navigation bar with horizontal scroll controls and active section indicator.',
  },
  {
    name: 'Switch pending',
    file: 'js/switch-pending.js',
    url: `${CDN_BASE}/js/switch-pending.js`,
    selector: '[data-mg-switch-pending]',
    initFunction:
      'mgSwitchPendingInit(scope, { save, labels, timeout, signal })',
    description:
      'Pending state for .mg-switch while a change saves: announces progress, ignores presses, times out and reverts on failure. Load as type="module". Call mgSwitchPending(input, { save }) per switch, or mark switches with data-mg-switch-pending (auto-initialised on load) and answer the cancelable mg-switch:save event with event.detail.respondWith(promise). Call mgSwitchPendingDestroy(scope) or abort { signal } before removing switches.',
  },
  {
    name: 'Preview Access',
    file: 'js/preview-access.js',
    url: `${CDN_BASE}/js/preview-access.js`,
    selector: '[data-mg-preview-access]',
    initFunction: 'mgPreviewAccess(scope)',
    description:
      'Password gate and preview notice bar for staging and pre-publication review.',
  },
  {
    name: 'UNDRR shared constants',
    file: 'js/undrr.js',
    url: `${CDN_BASE}/js/undrr.js`,
    description:
      'Shared constants (key codes, breakpoints) on the window.UNDRR namespace. It does not include the other modules.',
  },
];

// ---------------------------------------------------------------------------
// Component rendering: ID mapping and sample props
// ---------------------------------------------------------------------------

// Maps webpack output filenames (from dist/components/) to Storybook component IDs.
// Required for auto-rendering. The script imports dist/components/{FileName}.js,
// renders it with props from buildSampleProps(), and stores the HTML under this ID.
//
// To add a new auto-rendered component:
// 1. Add a webpack entry in webpack.config.js (second config block)
// 2. Add a COMPONENT_IDS entry below (FileName → storybook-id)
// 3. Add a buildSampleProps() entry if the component needs non-empty props
// 4. Add a component-data.js entry with at least { description: '...' }
//    (or a REQUIRES_REACT entry for React-only components)
// 5. Run `yarn build && yarn validate-manifest` to verify

const COMPONENT_IDS = {
  CtaButton: 'components-buttons-buttons',
  VerticalCard: 'components-cards-vertical-card',
  HorizontalCard: 'components-cards-horizontal-card',
  BookCard: 'components-cards-book-card',
  HorizontalBookCard: 'components-cards-horizontal-book-card',
  IconCard: 'components-cards-icon-card',
  StatsCard: 'components-cards-stats-card',
  Breadcrumbs: 'components-navigation-breadcrumbs',
  Tab: 'components-tabs',
  Hero: 'components-hero-hero',
  PageHeader: 'components-pageheader',
  Footer: 'components-footer',
  QuoteHighlight: 'components-quotehighlight',
  HighlightBox: 'components-highlightbox',
  EmbedContainer: 'components-embedcontainer',
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
  FormAction: 'components-forms-form-action',
  FormErrorSummary: 'components-forms-formerrorsummary',
  MegaMenu: 'components-navigation-megamenu',
  SyndicationSearchWidget: 'components-syndicated-search',
  ScrollContainer: 'components-scrollcontainer',
  Gallery: 'components-gallery',
  Pager: 'components-navigation-pager',
  ShareButtons: 'components-buttons-sharebuttons',
  UserFeedback: 'components-user-feedback',
  CopyButton: 'components-buttons-copybutton',
  Drawer: 'components-navigation-drawer',
  Tree: 'components-navigation-tree',
  ServiceNotice: 'components-notice-service-notice',
  Notice: 'components-notice-notice',
  Range: 'components-forms-range',
  Legend: 'components-dataviz-legend',
};

function buildSampleProps(React) {
  return {
    Chips: { label: 'Flood' },
    CtaButton: { label: 'Take action' },
    TextInput: {
      label: 'Organization name',
      required: true,
      placeholder: 'Enter organization name',
      helpText: 'Full legal name of your organization.',
    },
    Select: {
      label: 'Country',
      options: [
        { value: 'JP', label: 'Japan' },
        { value: 'NP', label: 'Nepal' },
        { value: 'PH', label: 'Philippines' },
      ],
      placeholder: 'Select a country',
    },
    Checkbox: { label: 'I agree to the terms and conditions', name: 'terms' },
    Radio: { label: 'Government', name: 'role', value: 'government' },
    Textarea: {
      label: 'Message',
      name: 'message',
      rows: 5,
      placeholder: 'Your message here',
      helpText: 'Max 500 characters.',
    },
    FormGroup: {
      legend: 'What is your role?',
      children: React.createElement(
        'div',
        null,
        React.createElement(
          'div',
          { className: 'mg-radio', key: '1' },
          React.createElement('input', {
            type: 'radio',
            id: 'r1',
            name: 'role',
            value: 'researcher',
          }),
          React.createElement('label', { htmlFor: 'r1' }, 'Researcher')
        ),
        React.createElement(
          'div',
          { className: 'mg-radio', key: '2' },
          React.createElement('input', {
            type: 'radio',
            id: 'r2',
            name: 'role',
            value: 'practitioner',
          }),
          React.createElement('label', { htmlFor: 'r2' }, 'Practitioner')
        )
      ),
    },
    FormAction: {
      label: 'Email address',
      control: React.createElement('input', {
        className: 'mg-form-input',
        name: 'email',
        type: 'email',
      }),
      action: React.createElement(
        'button',
        { className: 'mg-button mg-button-primary', type: 'submit' },
        'Subscribe'
      ),
    },
    FormErrorSummary: {
      title: 'There is a problem',
      errors: [
        { id: 'email', message: 'Enter a valid email address' },
        { id: 'org', message: 'Organization name is required' },
      ],
    },
    Drawer: {
      isOpen: true,
      onClose: () => {},
      title: 'Drawer title',
      position: 'start',
      children: React.createElement('p', null, 'Drawer content'),
    },
    Tree: {
      children: React.createElement(
        'li',
        { className: 'mg-tree__item', role: 'treeitem' },
        React.createElement(
          'div',
          { className: 'mg-tree__label-container' },
          React.createElement('span', { className: 'mg-tree__label' }, 'Item 1')
        )
      ),
    },
    Range: {
      id: 'sample-range',
      min: 0,
      max: 100,
      defaultValue: 50,
    },
    Legend: {
      type: 'continuous',
      ticks: [
        { position: '0%', label: 'Low' },
        { position: '50%', label: 'Medium' },
        { position: '100%', label: 'High' },
      ],
      title: 'Hazard level',
    },
    ServiceNotice: {
      status: 'degraded',
      title: 'Real-time hazard feeds unavailable',
      description:
        'Showing cached data from 10 minutes ago. Live updates will resume automatically.',
      onRetry: () => {},
      statusUrl: 'https://status.example.org',
    },
    Notice: {
      variant: 'warning',
      title: 'Scheduled maintenance advisory',
      description:
        'Platform services will undergo brief routine updates tonight.',
    },
    VerticalCard: {
      data: [
        {
          title: 'Building resilience through early warning systems',
          link: '/news/resilience',
          imgback: 'https://picsum.photos/600/400',
          imgalt: 'Workshop',
          label1: 'Early warning',
          summaryText: 'New partnerships strengthen disaster preparedness.',
        },
      ],
    },
    HorizontalCard: {
      data: [
        {
          title: 'Climate adaptation strategies',
          link: '/news/climate',
          imgback: 'https://picsum.photos/400/300',
          imgalt: 'Meeting',
          label1: 'Climate',
          summaryText: 'Integrated approaches to climate resilience.',
        },
      ],
    },
    BookCard: {
      data: [
        {
          title: 'Global Assessment Report 2024',
          link: '/publications/gar-2024',
          imgback: 'https://picsum.photos/300/400',
          imgalt: 'GAR 2024 cover',
        },
      ],
    },
    HorizontalBookCard: {
      data: [
        {
          title: 'Sendai Framework Monitor Report',
          link: '/publications/sendai',
          imgback: 'https://picsum.photos/300/400',
          imgalt: 'Cover',
          label1: 'DRR',
          summaryText: 'Progress on implementation.',
        },
      ],
    },
    IconCard: {
      data: [
        {
          icon: 'mg-icon mg-icon-globe',
          imageScale: 'medium',
          title: 'Global risk assessment',
          summaryText: 'Analysis of disaster risk trends.',
          link: '/risk',
          linkText: 'Learn more',
        },
      ],
    },
    StatsCard: {
      title: 'Key figures',
      stats: [
        { value: '1.23 million', bottomLabel: 'People affected' },
        { value: '195', bottomLabel: 'Countries reporting' },
        { value: '$2.8 trillion', bottomLabel: 'Economic losses' },
      ],
    },
    Breadcrumbs: {
      data: [
        { text: 'Home' },
        { text: 'Publications' },
        { text: 'Global Assessment Report 2024' },
      ],
    },
    CopyButton: {
      textToCopy: 'https://preventionweb.net',
      ariaLabel: 'Copy URL to clipboard',
    },
    Tab: {
      tabdata: [
        {
          text: 'Overview',
          text_id: 'overview',
          is_default: 'true',
          data: '<p>Overview of disaster risk reduction.</p>',
        },
        {
          text: 'Details',
          text_id: 'details',
          data: '<p>Implementation guidance.</p>',
        },
      ],
      variant: 'horizontal',
    },
    Hero: {
      data: [
        {
          title: 'Reducing disaster risk for a resilient future',
          imgback: 'https://picsum.photos/1600/600',
          summaryText: 'The Sendai Framework guides global efforts.',
          label: 'Featured',
          primary_button: 'Learn more',
        },
      ],
    },
    PageHeader: {
      variant: 'default',
      logoUrl: 'https://assets.undrr.org/logos/undrr/undrr-logo-horizontal.svg',
      homeUrl: '/',
      languages: [
        { value: 'en', label: 'English', selected: true },
        { value: 'ar', label: 'Arabic' },
      ],
    },
    Footer: { enableSyndication: false },
    QuoteHighlight: {
      quote:
        'Prevention is not a cost. It is an investment in our common future.',
      attribution: 'Mami Mizutori',
      attributionTitle: 'SRSG for Disaster Risk Reduction',
      backgroundColor: 'light',
      variant: 'line',
      alignment: 'full',
    },
    HighlightBox: {
      children: React.createElement(
        'div',
        null,
        React.createElement('h3', null, 'Key information'),
        React.createElement(
          'p',
          null,
          'Highlighted content draws attention to important information.'
        )
      ),
    },
    EmbedContainer: {
      children: React.createElement('iframe', {
        src: 'https://www.youtube-nocookie.com/embed/bIpPtHJbV-Q',
        title: 'UNDRR video',
        loading: 'lazy',
        allowFullScreen: true,
      }),
    },
    FullWidth: {
      children: React.createElement(
        'p',
        null,
        'This section spans the full viewport width.'
      ),
    },
    Loader: { label: 'Loading content' },
    ShowMore: {
      data: [
        {
          button_text: 'Show more',
          collapsable_wrapper_class: 'mg-show-more--collapsed',
          collapsable_text: 'Additional content revealed on toggle.',
        },
      ],
    },
    Pager: {
      page: 3,
      totalPages: 12,
      onPageChange: () => {},
      layout: 'centered',
      ariaLabel: 'Search results pages',
    },
    MegaMenu: {
      sections: [
        {
          items: [
            {
              title: 'About',
              url: '/about',
              items: [{ title: 'Our mission', url: '/about/mission' }],
            },
            {
              title: 'Topics',
              url: '/topics',
              items: [{ title: 'Early warning', url: '/topics/early-warning' }],
            },
          ],
        },
      ],
    },
    ScrollContainer: {
      showArrows: true,
      children: [
        React.createElement(
          'div',
          {
            key: '1',
            style: {
              minWidth: '200px',
              padding: '1rem',
              background: '#f0f0f0',
            },
          },
          'Item 1'
        ),
        React.createElement(
          'div',
          {
            key: '2',
            style: {
              minWidth: '200px',
              padding: '1rem',
              background: '#e0e0e0',
            },
          },
          'Item 2'
        ),
        React.createElement(
          'div',
          {
            key: '3',
            style: {
              minWidth: '200px',
              padding: '1rem',
              background: '#d0d0d0',
            },
          },
          'Item 3'
        ),
      ],
    },
    UserFeedback: {},
    Gallery: {
      media: [
        {
          id: '1',
          type: 'image',
          src: 'https://picsum.photos/800/600',
          alt: 'Disaster risk reduction',
          title: 'Building resilience',
          description: 'Communities working to reduce disaster risk.',
        },
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// CLI args and file reading
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const buildDirArg = (args.find(a => a.startsWith('--build-dir=')) || '').split(
  '='
)[1];
const docsBaseArg = (args.find(a => a.startsWith('--docs-base=')) || '').split(
  '='
)[1];
const buildDir = path.resolve(process.cwd(), buildDirArg || 'docs-build-temp');
const validateOnly = args.includes('--validate');
const docsBaseInput =
  docsBaseArg || process.env.MANGROVE_DOCS_BASE_URL || DEFAULT_DOCS_BASE;
const DOCS_BASE = normalizeDocsBase(docsBaseInput);

const manifestPath = path.join(buildDir, 'manifests', 'components.json');
const outputDir = path.join(buildDir, 'ai-components');
const llmsTxtPath = path.join(buildDir, 'llms.txt');
const distDir = path.resolve(process.cwd(), 'dist/components');

if (!fs.existsSync(manifestPath)) {
  console.error(`Storybook manifest not found at ${manifestPath}`);
  console.error('Run "storybook build" first to generate the manifest.');
  process.exit(1);
}

const pkg = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8')
);
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const iconInventoryPath = path.resolve(
  process.cwd(),
  'stories/Atom/Icons/Icons.json'
);
const iconInventory = fs.existsSync(iconInventoryPath)
  ? JSON.parse(fs.readFileSync(iconInventoryPath, 'utf8'))
  : null;

// Replace {{version}} tokens with actual version from package.json
const replaceVersion = obj =>
  JSON.parse(JSON.stringify(obj).replaceAll('{{version}}', pkg.version));

const curatedData = replaceVersion(htmlExamples);
const themeCss = replaceVersion(THEME_CSS);
const requiredScripts = replaceVersion(REQUIRED_SCRIPTS);
const requiredStylesheets = replaceVersion(REQUIRED_STYLESHEETS);
const logos = replaceVersion(LOGOS);
const vanillaScripts = replaceVersion(VANILLA_SCRIPTS);
const cdnBase = CDN_BASE.replace('{{version}}', pkg.version);
const generatedAt = new Date().toISOString();

/**
 * Normalize docs base URL to an absolute origin+path with one trailing slash.
 * Throws on invalid input so broken links fail fast during generation.
 */
function normalizeDocsBase(url) {
  const parsed = new URL(url);
  parsed.pathname = parsed.pathname.endsWith('/')
    ? parsed.pathname
    : `${parsed.pathname}/`;
  return parsed.toString();
}

// ---------------------------------------------------------------------------
// Parse actual npm exports from src/index.js
// ---------------------------------------------------------------------------

/**
 * Reads src/index.js and returns a Set of export names that consumers can
 * actually import from the npm package. This prevents the manifest from
 * advertising imports that don't exist.
 */
function parseNpmExports() {
  const indexPath = path.resolve(process.cwd(), 'src/index.js');
  if (!fs.existsSync(indexPath)) {
    console.warn('src/index.js not found — cannot validate npm exports');
    return new Set();
  }
  const source = fs.readFileSync(indexPath, 'utf8');
  const names = new Set();

  // Match: export { default as Foo } and export { Foo }
  const re = /export\s*\{[^}]*?\bas\s+(\w+)|export\s*\{\s*(\w+)\s*\}/g;
  let match;
  while ((match = re.exec(source)) !== null) {
    names.add(match[1] || match[2]);
  }
  return names;
}

const npmExports = parseNpmExports();

// Reverse lookup: Storybook ID → webpack entry name (which matches the npm
// export name). Derived from COMPONENT_IDS so it self-heals when new
// components are added. Used as a fallback when Storybook's internal function
// name differs from the npm export name.
const storybookIdToWebpackName = Object.fromEntries(
  Object.entries(COMPONENT_IDS).map(([name, id]) => [id, name])
);

// Manual overrides for npm-only components (no webpack entry in COMPONENT_IDS)
// whose Storybook function name differs from the npm export name.
const NPM_NAME_OVERRIDES = {
  ShowOffSnackbar: 'Snackbar', // Storybook demo wrapper name vs npm export
};

/**
 * Build a valid import statement for a component, or return empty string if
 * the component is not exported from the npm package. Tries the Storybook
 * name first, then the COMPONENT_IDS reverse lookup, then NPM_NAME_OVERRIDES.
 *
 * Supported src/index.js export shapes:
 *   export { default as Foo } from '...';
 *   export { Foo } from '...';
 */
function buildImportStatement(componentName, componentId) {
  const candidates = [
    componentName,
    storybookIdToWebpackName[componentId],
    NPM_NAME_OVERRIDES[componentName],
  ].filter(Boolean);
  const exportName = candidates.find(n => npmExports.has(n));
  if (exportName) {
    return `import { ${exportName} } from "${pkg.name}";`;
  }
  return '';
}

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

/**
 * Get the best description for a component, with curated fallback.
 *
 * For most entries JSDoc wins over component-data.js: the source-level doc
 * comment was written to describe that specific export and is normally more
 * accurate/current than a hand-maintained manifest entry, which is why this
 * order is the default rather than something to "fix" globally.
 *
 * stories/Patterns/* is the deliberate exception. Each pattern's exported
 * function already carries a JSDoc comment written for Storybook's docs page
 * (describing the demo, not the manifest), so under the default order a
 * curated component-data.js description for a pattern is silently never
 * used — see undrr-mangrove#1129. A pattern also isn't a reusable export the
 * way a Component/Atom/Molecule is: it exists to demonstrate a composition,
 * so the manifest-facing description is worth curating deliberately rather
 * than inheriting Storybook's docs-page copy. Curated data therefore wins
 * for `patterns-*` ids when present, before JSDoc is even considered.
 */
function getDescription(id, component, data) {
  if (id.startsWith('patterns-') && data?.description) return data.description;

  if (component.description) return component.description;

  if (component.reactDocgen?.description) {
    const desc = component.reactDocgen.description
      .replace(/@param\s+\{[^}]*\}\s+\S+\s*/g, '')
      .replace(/@returns?\s+.*/g, '')
      .trim();
    if (desc) return desc.split('\n')[0];
  }

  if (data?.description) return data.description;

  if (REQUIRES_REACT[id]) return REQUIRES_REACT[id];

  return '';
}

/** Build the Storybook docs URL for a component. */
function docsUrl(componentId) {
  return `${DOCS_BASE}?path=/docs/${componentId}--docs`;
}

// ---------------------------------------------------------------------------
// Auto-render React components from dist/
// ---------------------------------------------------------------------------

async function renderComponents() {
  if (!fs.existsSync(distDir)) {
    console.warn('dist/components/ not found — skipping auto-render');
    return new Map();
  }

  const React = (await import('react')).default;
  const { renderToStaticMarkup } = await import('react-dom/server');
  const prettier = (await import('prettier')).default;
  const HTMLParser = (await import('prettier/parser-html')).default;
  const SAMPLE_PROPS = buildSampleProps(React);

  const distFiles = fs
    .readdirSync(distDir)
    .filter(f => f.endsWith('.js'))
    .map(f => f.replace('.js', ''));

  const results = new Map();
  let rendered = 0;
  let failed = 0;

  for (const fileName of distFiles) {
    if (fileName === 'hydrate') continue;

    const componentId = COMPONENT_IDS[fileName];
    if (!componentId) continue;
    if (!curatedData[componentId] && !REQUIRES_REACT[componentId]) continue;

    const modulePath = path.join(distDir, `${fileName}.js`);

    try {
      const mod = await import(modulePath);
      const isComponentLike = v =>
        typeof v === 'function' ||
        (v != null && typeof v === 'object' && v.$$typeof != null);
      const Component =
        mod.default ||
        mod[fileName] ||
        mod[Object.keys(mod).find(k => isComponentLike(mod[k]))];

      if (!isComponentLike(Component)) {
        console.warn(`  skip ${fileName}: no renderable export`);
        failed++;
        continue;
      }

      const props = SAMPLE_PROPS[fileName] || {};
      const html = renderToStaticMarkup(React.createElement(Component, props));
      if (html.length < 30) {
        console.warn(
          `  skip ${fileName}: rendered HTML too short (${html.length} chars)`
        );
        failed++;
        continue;
      }

      let formatted;
      try {
        formatted = await prettier.format(html, {
          parser: 'html',
          plugins: [HTMLParser],
          printWidth: 100,
        });
      } catch {
        formatted = html;
      }
      const desc = curatedData[componentId]?.description || fileName;
      results.set(componentId, [{ name: desc, html: formatted }]);
      rendered++;
    } catch (e) {
      console.warn(`  skip ${fileName}: ${e.message.split('\n')[0]}`);
      failed++;
    }
  }

  console.log(
    `Rendered component HTML: ${rendered} components, ${failed} skipped`
  );
  return results;
}

// ---------------------------------------------------------------------------
// Validate curated data
// ---------------------------------------------------------------------------

const manifestIds = new Set(Object.values(manifest.components).map(c => c.id));

// Check curated data keys (component-data.js entries)
const curatedKeys = Object.keys(curatedData);
const unmatchedKeys = curatedKeys.filter(k => !manifestIds.has(k));
const uncoveredIds = [...manifestIds].filter(
  id => !curatedData[id] && !REQUIRES_REACT[id] && !id.startsWith('example-')
);

if (unmatchedKeys.length > 0) {
  console.warn('Warning: component-data keys not found in Storybook manifest:');
  for (const k of unmatchedKeys) console.warn(`  - ${k}`);
}
if (uncoveredIds.length > 0) {
  console.warn(
    `Note: ${uncoveredIds.length} component(s) have no entry in component-data:`
  );
  for (const id of uncoveredIds) console.warn(`  - ${id}`);
}

// ---------------------------------------------------------------------------
// Check curated example shape
//
// `examples` must be [{ name, html }]. A bare array of HTML strings still
// reaches the output — it is just assigned to renderedHtml — so it looks like
// it worked, but the a11y lint below skips it (`if (!example.html) continue`),
// the drift check reads no classes from it, and consumers that read
// `renderedHtml[n].html` get undefined for that component alone. StatusLabel
// and EmptyState shipped in exactly that state: present in the manifest, but
// in a shape nothing else in the file uses and no check could see.
// ---------------------------------------------------------------------------
const malformedExamples = [];
for (const [componentId, data] of Object.entries(curatedData)) {
  if (!data?.examples) continue;
  if (!Array.isArray(data.examples)) {
    malformedExamples.push(`${componentId}: examples is not an array`);
    continue;
  }
  data.examples.forEach((example, index) => {
    if (typeof example !== 'object' || example === null) {
      malformedExamples.push(
        `${componentId}: examples[${index}] is a ${typeof example}, expected ` +
          '{ name, html }'
      );
    } else if (typeof example.html !== 'string' || example.html.length === 0) {
      malformedExamples.push(
        `${componentId}: examples[${index}] has no html string`
      );
    } else if (typeof example.name !== 'string' || example.name.length === 0) {
      malformedExamples.push(`${componentId}: examples[${index}] has no name`);
    }
  });
}

if (malformedExamples.length > 0) {
  console.warn(
    'Curated examples in the wrong shape (expected { name, html }):'
  );
  for (const problem of malformedExamples) console.warn(`  ${problem}`);
}

// ---------------------------------------------------------------------------
// Check curated hydration and vanilla module contract shape
//
// Agents that find a `hydration` (React hydrate.js) or `vanillaModule` (plain
// ES module, no React) field act on it directly, so a contract without a
// selector, module URLs or a runnable example is worse than none.
// ---------------------------------------------------------------------------
const CONTRACT_FIELDS = ['hydration', 'vanillaModule'];
const malformedHydration = [];
for (const [componentId, data] of Object.entries(curatedData)) {
  for (const field of CONTRACT_FIELDS) {
    if (data?.[field] === undefined) continue;
    const contract = data[field];
    if (typeof contract !== 'object' || contract === null) {
      malformedHydration.push(`${componentId}: ${field} is not an object`);
      continue;
    }
    if (typeof contract.selector !== 'string' || !contract.selector) {
      malformedHydration.push(`${componentId}: ${field} has no selector`);
    }
    if (
      typeof contract.modules !== 'object' ||
      contract.modules === null ||
      Object.keys(contract.modules).length === 0
    ) {
      malformedHydration.push(`${componentId}: ${field} has no modules`);
    }
    if (typeof contract.example !== 'string' || !contract.example) {
      malformedHydration.push(`${componentId}: ${field} has no example`);
    }
  }
}

if (malformedHydration.length > 0) {
  console.warn(
    'Curated hydration or vanillaModule contracts missing required fields (selector, modules, example):'
  );
  for (const problem of malformedHydration) console.warn(`  ${problem}`);
}

// ---------------------------------------------------------------------------
// Check that every documented CSS class actually exists
//
// A class list in component-data.js is hand-maintained, so it drifts when a
// component is renamed and it is wrong from the start when a class is
// mistyped. Nothing checked this before, so the manifest could advertise a
// class that had never existed and no build would notice.
//
// "Exists" cannot mean "has a rule in the compiled CSS". Several real classes
// deliberately carry no styles: mg-card__meta and mg-card__label--active are
// structural hooks the card components render, mg-hero--split-2-3 is the
// default split that needs no override, mg-on-this-page-nav--exclude is a
// marker the nav's JS reads, and the scroll-button modifiers are injected at
// runtime. So a class passes if it is styled OR if it appears in the story
// sources — and fails only when it exists nowhere in the library, which is
// the typo-and-rename case this is actually for.
// ---------------------------------------------------------------------------
const compiledCssPath = path.resolve(
  process.cwd(),
  'stories/assets/css/style.css'
);
const storiesDir = path.resolve(process.cwd(), 'stories');
const missingCssClasses = [];
const unstyledCssClasses = [];
let cssCheckSkipped = null;

/** Every .jsx/.js/.mdx/.scss file under stories/, concatenated. */
function readStorySources(dir) {
  const chunks = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      chunks.push(readStorySources(full));
    } else if (/\.(jsx?|mdx|scss)$/.test(entry.name)) {
      chunks.push(fs.readFileSync(full, 'utf8'));
    }
  }
  return chunks.join('\n');
}

if (!fs.existsSync(compiledCssPath)) {
  cssCheckSkipped =
    `${path.relative(process.cwd(), compiledCssPath)} not found — run ` +
    '"yarn scss" first. Skipping the CSS class existence check.';
} else {
  const compiledCss = fs.readFileSync(compiledCssPath, 'utf8');
  const storySources = readStorySources(storiesDir);

  const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // A class selector, i.e. ".name" not followed by another identifier
  // character, so ".mg-card" does not match ".mg-card__title".
  const isStyled = className =>
    new RegExp(`\\.${escape(className)}(?![\\w-])`).test(compiledCss);
  // The class named anywhere in the story sources — a className string, a JS
  // string literal, an MDX table row, or an SCSS selector.
  const isRendered = className =>
    new RegExp(`(?<![\\w-])${escape(className)}(?![\\w-])`).test(storySources);

  for (const [componentId, data] of Object.entries(curatedData)) {
    for (const className of data?.cssClasses || []) {
      if (isStyled(className)) continue;
      if (isRendered(className)) {
        unstyledCssClasses.push(`${componentId}: .${className}`);
      } else {
        missingCssClasses.push(`${componentId}: .${className}`);
      }
    }
  }
}

if (cssCheckSkipped) console.warn(`Note: ${cssCheckSkipped}`);
if (unstyledCssClasses.length > 0) {
  console.log(
    `Note: ${unstyledCssClasses.length} documented class(es) are rendered by a ` +
      'component but carry no CSS rule (structural or JS marker classes):'
  );
  for (const item of unstyledCssClasses) console.log(`  ${item}`);
}
if (missingCssClasses.length > 0) {
  console.warn('Documented CSS classes that exist nowhere in the library:');
  for (const problem of missingCssClasses) console.warn(`  ${problem}`);
}

// Check COMPONENT_IDS entries that won't render due to missing data
const orphanedIds = Object.entries(COMPONENT_IDS)
  .filter(([, id]) => !curatedData[id] && !REQUIRES_REACT[id])
  .map(([fileName, id]) => `${fileName} → ${id}`);
if (orphanedIds.length > 0) {
  console.warn(
    'Warning: COMPONENT_IDS entries with no component-data or REQUIRES_REACT match (will be skipped):'
  );
  for (const entry of orphanedIds) console.warn(`  - ${entry}`);
}

// ---------------------------------------------------------------------------
// Check 1: A11y lint of curated HTML examples
// ---------------------------------------------------------------------------

const a11yRules = [
  {
    id: 'role-button-on-link',
    label: 'role="button" on link element',
    test(html) {
      return (
        /<a[^>]*role="button"[^>]*href=/.test(html) ||
        /<a[^>]*href=[^>]*role="button"/.test(html)
      );
    },
  },
  {
    id: 'icon-missing-aria-hidden',
    label: 'icon element missing aria-hidden="true"',
    test(html) {
      const iconPattern =
        /<(?:i|span)\b[^>]*class="[^"]*\bmg-icon\b(?!-wrap)[^"]*"[^>]*>/g;
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
  {
    id: 'img-missing-alt',
    label: '<img> element missing alt attribute',
    test(html) {
      const imgPattern = /<img\b[^>]*>/g;
      let match;
      while ((match = imgPattern.exec(html)) !== null) {
        if (!/\balt\s*=/.test(match[0])) return true;
      }
      return false;
    },
  },
  {
    id: 'th-missing-scope',
    label: '<th> element missing scope attribute',
    test(html) {
      const thPattern = /<th\b[^>]*>/g;
      let match;
      while ((match = thPattern.exec(html)) !== null) {
        if (!/\bscope\s*=/.test(match[0])) return true;
      }
      return false;
    },
  },
  {
    id: 'link-without-href',
    label: '<a> element without href attribute (not keyboard-focusable)',
    test(html) {
      const aPattern = /<a\b[^>]*>/g;
      let match;
      while ((match = aPattern.exec(html)) !== null) {
        if (!/\bhref\s*=/.test(match[0])) return true;
      }
      return false;
    },
  },
  {
    id: 'role-img-with-interactive-children',
    label:
      'role="img" on element containing interactive content (hides children from AT)',
    test(html) {
      const roleImgPattern = /<(\w+)\b[^>]*role="img"[^>]*>[\s\S]*?<\/\1>/g;
      let match;
      while ((match = roleImgPattern.exec(html)) !== null) {
        if (/<(?:a|button|input|select|textarea)\b/.test(match[0])) return true;
      }
      return false;
    },
  },
];

const a11yViolations = [];

for (const [componentId, data] of Object.entries(curatedData)) {
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
  c => c.reactDocgen?.props && Object.keys(c.reactDocgen.props).length > 0
).length;
const coverage =
  totalComponents > 0 ? Math.round((withProps / totalComponents) * 100) : 0;

console.log(
  `PropTypes coverage: ${withProps} of ${totalComponents} components have props documented (${coverage}%)`
);

// ---------------------------------------------------------------------------
// Check 3: Curated HTML drift detection
//
// For components with curated HTML, auto-render them from dist/ and compare
// the BEM classes (mg-*) used in each. If the curated HTML references classes
// that don't appear in the auto-rendered output (or vice versa), flag it as
// potential drift. This catches structural/class renames without requiring
// per-component test files.
// ---------------------------------------------------------------------------

/** Extract mg-* BEM classes from class="" attribute values in an HTML string. */
function extractBemClasses(html) {
  const classAttrPattern = /class="([^"]*)"/g;
  const classes = new Set();
  let match;
  while ((match = classAttrPattern.exec(html)) !== null) {
    for (const token of match[1].split(/\s+/)) {
      if (token.startsWith('mg-')) classes.add(token);
    }
  }
  return classes;
}

/** True if the class is a BEM modifier (contains --), which is prop-dependent. */
function isBemModifier(cls) {
  return cls.includes('--');
}

async function checkCuratedDrift() {
  if (!fs.existsSync(distDir)) return [];

  const React = (await import('react')).default;
  const { renderToStaticMarkup } = await import('react-dom/server');
  const SAMPLE_PROPS = buildSampleProps(React);
  const warnings = [];

  const distFiles = fs
    .readdirSync(distDir)
    .filter(f => f.endsWith('.js'))
    .map(f => f.replace('.js', ''));

  for (const fileName of distFiles) {
    if (fileName === 'hydrate') continue;
    const componentId = COMPONENT_IDS[fileName];
    if (!componentId) continue;

    const data = curatedData[componentId];
    if (!data?.examples || REQUIRES_REACT[componentId]) continue;

    // This component has curated HTML — try to auto-render and compare classes
    const modulePath = path.join(distDir, `${fileName}.js`);
    try {
      const mod = await import(modulePath);
      const isComponentLike = v =>
        typeof v === 'function' ||
        (v != null && typeof v === 'object' && v.$$typeof != null);
      const Component =
        mod.default ||
        mod[fileName] ||
        mod[Object.keys(mod).find(k => isComponentLike(mod[k]))];

      if (!isComponentLike(Component)) continue;

      const props = SAMPLE_PROPS[fileName] || {};
      const rendered = renderToStaticMarkup(
        React.createElement(Component, props)
      );
      if (rendered.length < 30) continue;

      const renderedClasses = extractBemClasses(rendered);
      const curatedHtml = data.examples.map(e => e.html || '').join('\n');
      const curatedClasses = extractBemClasses(curatedHtml);

      if (renderedClasses.size === 0 && curatedClasses.size === 0) continue;

      // Compare only BEM blocks/elements (not modifiers, which are prop-dependent).
      // Curated HTML often shows multiple variants, but auto-render only produces one,
      // so modifier differences (mg-card--secondary etc.) are expected noise.
      const staleInCurated = [...curatedClasses].filter(
        c => !isBemModifier(c) && !renderedClasses.has(c)
      );
      const missingFromCurated = [...renderedClasses].filter(
        c => !isBemModifier(c) && !curatedClasses.has(c)
      );

      if (staleInCurated.length > 0 || missingFromCurated.length > 0) {
        const parts = [];
        if (staleInCurated.length > 0)
          parts.push(`curated has: ${staleInCurated.join(', ')}`);
        if (missingFromCurated.length > 0)
          parts.push(`rendered has: ${missingFromCurated.join(', ')}`);
        warnings.push(`  ${componentId}: ${parts.join(' | ')}`);
      }
    } catch {
      // Component can't render in Node — skip silently
    }
  }
  return warnings;
}

function findDevelopmentJsxBundles() {
  if (!fs.existsSync(distDir)) return [];

  return fs.readdirSync(distDir).filter(fileName => {
    if (!fileName.endsWith('.js')) return false;
    return fs
      .readFileSync(path.join(distDir, fileName), 'utf8')
      .includes('jsxDEV');
  });
}

// ---------------------------------------------------------------------------
// Validate-only exit
// ---------------------------------------------------------------------------

if (validateOnly) {
  let failed = false;

  if (unmatchedKeys.length > 0) {
    console.error(
      'Validation failed: component-data keys do not match manifest.'
    );
    failed = true;
  }
  if (a11yViolations.length > 0) {
    console.error(
      `Validation failed: ${a11yViolations.length} a11y violation(s) in curated HTML.`
    );
    failed = true;
  }

  // Fail if any Storybook component has no manifest entry at all
  if (uncoveredIds.length > 0) {
    console.error(
      `Validation failed: ${uncoveredIds.length} component(s) have no entry in component-data or REQUIRES_REACT.`
    );
    console.error(
      'Add an entry to scripts/ai-manifest/component-data.js or REQUIRES_REACT for each:'
    );
    for (const id of uncoveredIds) console.error(`  - ${id}`);
    failed = true;
  }

  if (malformedExamples.length > 0) {
    console.error(
      `Validation failed: ${malformedExamples.length} curated example(s) are ` +
        'not in the { name, html } shape. Such an example is skipped by the ' +
        'a11y lint and by drift detection, and reaches consumers as a bare ' +
        'string where every other component gives an object.'
    );
    failed = true;
  }

  if (malformedHydration.length > 0) {
    console.error(
      `Validation failed: ${malformedHydration.length} hydration or ` +
        'vanillaModule contract problem(s). Each curated contract needs selector, modules and ' +
        'example.'
    );
    failed = true;
  }

  if (missingCssClasses.length > 0) {
    console.error(
      `Validation failed: ${missingCssClasses.length} documented CSS class(es) ` +
        'appear neither in the compiled CSS nor in any story source. Either ' +
        'the class was renamed, or component-data.js names one that never ' +
        'existed:'
    );
    for (const problem of missingCssClasses) console.error(`  - ${problem}`);
    failed = true;
  }

  const developmentJsxBundles = findDevelopmentJsxBundles();
  if (developmentJsxBundles.length > 0) {
    console.error(
      'Validation failed: production component bundles contain development JSX runtime calls.'
    );
    for (const fileName of developmentJsxBundles) {
      console.error(`  - ${fileName}`);
    }
    failed = true;
  }

  // Run drift check (warnings only — does not fail the build)
  const driftWarnings = await checkCuratedDrift();
  if (driftWarnings.length > 0) {
    console.warn(
      'Curated HTML drift detected (BEM classes differ from auto-rendered output):'
    );
    for (const w of driftWarnings) console.warn(w);
    console.warn(
      'Review component-data.js entries above — curated HTML may be stale.'
    );
  }

  if (failed) {
    process.exit(1);
  }
  console.log('Validation passed: all checks OK.');
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Main: render + generate
// ---------------------------------------------------------------------------

async function main() {
  // Auto-render React components (on failure, continue with empty map)
  let renderedHtml;
  try {
    renderedHtml = await renderComponents();
  } catch (e) {
    console.warn(
      `Warning: auto-render failed (${e.message}). Continuing with curated HTML only.`
    );
    renderedHtml = new Map();
  }

  // -------------------------------------------------------------------------
  // Transform each component
  // -------------------------------------------------------------------------

  const indexEntries = [];
  const componentFiles = [];
  const componentChangelogs = {};
  let droppedImportCount = 0;

  for (const [, component] of Object.entries(manifest.components)) {
    const id = component.id;
    // Storybook derives `name` from meta.component, and falls back to a
    // squashed filename when a story file has none — which every CSS-only
    // component does, giving "Statuslabel" for StatusLabel. A curated `name`
    // overrides that so the index reads as the component is actually called.
    const name = curatedData[id]?.name || component.name || id;
    const jsDocParams = parseJsDocParams(component.jsDocTags);
    const data = curatedData[id];
    const isReact = REQUIRES_REACT[id];
    const isVanilla = !isReact;
    const description = getDescription(id, component, data);

    // --- Validated import statement ---
    // Storybook's react-docgen auto-generates import statements for every
    // component, but only components exported from src/index.js are actually
    // importable from the npm package. Use buildImportStatement() which
    // checks against real exports instead of trusting Storybook's guess.
    const validImport = buildImportStatement(name, id);
    if (component.import && !validImport) droppedImportCount++;

    // --- Index entry (lightweight) ---
    const summary = description;
    const indexEntry = { id, name, summary, description };
    if (validImport) indexEntry.import = validImport;
    indexEntry.docsUrl = docsUrl(id);
    indexEntry.detailsUrl = `${DOCS_BASE}ai-components/${id}.json`;

    if (isReact) {
      indexEntry.requiresReact = true;
    } else {
      indexEntry.vanillaHtml = true;
    }
    if (data?.hydration) indexEntry.hydration = true;
    if (data?.vanillaModule) indexEntry.vanillaModule = true;

    indexEntries.push(indexEntry);

    // --- Full component file ---
    const detail = { name, summary, description };
    if (validImport) detail.import = validImport;
    detail.docsUrl = docsUrl(id);

    if (isVanilla) {
      detail.vanillaHtml = true;
    }
    if (isReact) {
      detail.requiresReact = true;
      detail.reactNote = REQUIRES_REACT[id];
    }

    // Props
    if (
      component.reactDocgen?.props &&
      Object.keys(component.reactDocgen.props).length > 0
    ) {
      detail.props = {};
      for (const [propName, propDef] of Object.entries(
        component.reactDocgen.props
      )) {
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

    // Rendered HTML: prefer auto-rendered from dist/, fall back to curated
    if (renderedHtml.has(id)) {
      detail.renderedHtml = renderedHtml.get(id);
      detail.renderedHtmlSource = 'auto';
    } else if (data?.examples) {
      detail.renderedHtml = data.examples;
    }

    // CSS classes used by this component
    if (data?.cssClasses?.length) {
      detail.cssClasses = data.cssClasses;
    }

    // Vanilla HTML embed instructions (for syndication components)
    if (data?.vanillaHtmlEmbed) {
      detail.vanillaHtmlEmbed = data.vanillaHtmlEmbed;
    }

    // Vanilla hydration contract (data attributes, events, CDN modules).
    // {{version}} is already resolved: curatedData went through replaceVersion.
    if (data?.hydration) detail.hydration = data.hydration;
    // Plain ES module contract (no React, no hydrate.js), same shape.
    if (data?.vanillaModule) detail.vanillaModule = data.vanillaModule;

    // Do-not-modify flag for branding-critical components
    if (data?.doNotModify) {
      detail.doNotModify = data.doNotModify;
    }

    if (id === 'components-icons' && iconInventory?.icons?.length) {
      detail.availableIcons = iconInventory.icons;
    }

    // Component changelog parsed from Storybook MDX documentation
    let compChangelog = [];
    if (component.docs) {
      for (const doc of Object.values(component.docs)) {
        if (doc.content && doc.content.includes('## Changelog')) {
          compChangelog = parseComponentChangelog(doc.content);
          if (compChangelog.length > 0) break;
        }
      }
    }
    if (compChangelog.length > 0) {
      detail.changelog = compChangelog;
      componentChangelogs[id] = {
        name,
        entries: compChangelog,
      };
    }

    componentFiles.push({ id, content: detail });
  }

  // -------------------------------------------------------------------------
  // Write ai-components/index.json
  // -------------------------------------------------------------------------

  fs.mkdirSync(outputDir, { recursive: true });

  const vanillaCount = indexEntries.filter(e => e.vanillaHtml).length;
  const reactCount = indexEntries.filter(e => e.requiresReact).length;

  const index = {
    _ai:
      'Component index for the UNDRR Mangrove library. ' +
      'Most components work as vanilla HTML with CSS classes (vanillaHtml: true). ' +
      'Some require React (requiresReact: true). ' +
      'Each entry has a detailsUrl with full props, rendered HTML examples, and code snippets.',
    library: {
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
      documentation: DOCS_BASE,
      repository: 'https://github.com/unisdr/undrr-mangrove',
      npm: `https://www.npmjs.com/package/${pkg.name}`,
      cssPrefix: 'mg-',
      namingConvention:
        'BEM (e.g., mg-card__title, mg-card__icon--bordered). Buttons are the exception: mg-button-primary, mg-button-secondary and mg-button-outline are single-dash, not BEM modifiers.',
      themes: ['undrr', 'preventionweb', 'irp', 'mcr2030', 'delta'],
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
      iconsUrl: `${DOCS_BASE}ai-components/components-icons.json`,
      tokensUrl: `${DOCS_BASE}tokens.json`,
      releasesUrl: `${DOCS_BASE}releases.json`,
      changelogUrl:
        'https://github.com/unisdr/undrr-mangrove/blob/main/CHANGELOG.md',
      quickstart: {
        css: `<link rel="stylesheet" href="${themeCss.undrr}" />`,
        cssThemes: themeCss,
      },
      requiredAssets: {
        _note:
          'Every UNDRR-branded page should include these assets. Order matters.',
        stylesheets: requiredStylesheets,
        scripts: requiredScripts,
        logos,
      },
      vanillaScripts,
    },
    components: indexEntries,
    generatedAt,
  };

  const indexJson = JSON.stringify(index, null, 2);
  fs.writeFileSync(path.join(outputDir, 'index.json'), indexJson);

  // -------------------------------------------------------------------------
  // Write ai-components/{id}.json for each component
  // -------------------------------------------------------------------------

  for (const { id, content } of componentFiles) {
    fs.writeFileSync(
      path.join(outputDir, `${id}.json`),
      JSON.stringify(content, null, 2)
    );
  }

  // -------------------------------------------------------------------------
  // Write ai-components/utilities.json
  // -------------------------------------------------------------------------

  const utilities = replaceVersion({
    _ai:
      'CSS utility classes for the UNDRR Mangrove library. ' +
      'Include the Mangrove CSS bundle to use these classes in plain HTML.',
    ...cssUtilities,
    generatedAt,
  });

  const utilitiesJson = JSON.stringify(utilities, null, 2);
  fs.writeFileSync(path.join(outputDir, 'utilities.json'), utilitiesJson);

  const utilityClassCount = cssUtilities.categories.reduce(
    (sum, cat) => sum + cat.classes.length,
    0
  );

  // -------------------------------------------------------------------------
  // Write tokens.json
  // -------------------------------------------------------------------------

  const tokensDict = buildTokensDictionary();
  tokensDict.version = pkg.version;
  tokensDict.generatedAt = generatedAt;
  const tokensJson = JSON.stringify(tokensDict, null, 2);
  fs.writeFileSync(path.join(buildDir, 'tokens.json'), tokensJson);
  fs.writeFileSync(path.join(outputDir, 'tokens.json'), tokensJson);

  // -------------------------------------------------------------------------
  // Write releases.json
  // -------------------------------------------------------------------------

  const changelogPath = path.resolve(process.cwd(), 'CHANGELOG.md');
  const releasesData = buildReleasesManifest({
    changelogPath,
    pkg,
    generatedAt,
    docsBase: DOCS_BASE,
    componentChangelogs,
  });
  const releasesJson = JSON.stringify(releasesData, null, 2);
  fs.writeFileSync(path.join(buildDir, 'releases.json'), releasesJson);
  fs.writeFileSync(path.join(outputDir, 'releases.json'), releasesJson);

  // -------------------------------------------------------------------------
  // Write llms.txt
  // -------------------------------------------------------------------------

  const llmsTxt = `# UNDRR Mangrove

> UI component library for UNDRR's disaster risk reduction websites (undrr.org, preventionweb.net, mcr2030.undrr.org). Provides both React components and vanilla HTML/CSS patterns. Built with Storybook.

- Version: ${pkg.version}
- Package: ${pkg.name}
- License: ${pkg.license || 'See LICENSE file'}

## Links

- Storybook: ${DOCS_BASE}
- Repository: https://github.com/unisdr/undrr-mangrove
- npm: https://www.npmjs.com/package/${pkg.name}
- Release changelog (machine-readable): ${DOCS_BASE}releases.json
- Project changelog (markdown): https://github.com/unisdr/undrr-mangrove/blob/main/CHANGELOG.md
- v2.0 Release notes: ${DOCS_BASE}?path=/docs/getting-started-release-notes-v2-0--docs
- Icons inventory: ${DOCS_BASE}ai-components/components-icons.json
- Theme token dictionary: ${DOCS_BASE}tokens.json (theme tokens only — component custom properties are documented per component)

## For AI agents

The Storybook site is a single-page app, so fetching pages directly won't give you readable content. Use the JSON files below instead.

Component index (all ${indexEntries.length} components):
${DOCS_BASE}ai-components/index.json

Release changelog & version history (~${releasesData.releases.length} releases, machine-readable):
${DOCS_BASE}releases.json

CSS utility class reference (~${utilityClassCount} classes):
${DOCS_BASE}ai-components/utilities.json

Theme token dictionary (~${tokensDict.totalTokens} tokens with type, format & wrapping metadata):
${DOCS_BASE}tokens.json

This dictionary covers theme tokens only — the --mg-* properties the theme stylesheets define. Component-scoped custom properties (the --mg-switch-* set, --mg-card-border, --mg-empty-state-*, --mg-notice-*, --mg-tree-*, --mg-drawer-size, --mg-icon-fg, --mg-legend-tick-pos, --mg-show-more-height and the rest) are public API but are not in it. Read the component's ai-components/{id}.json entry or its Storybook docs page for those. The data-viz palette (--mg-dataviz-*) is not component-scoped — it is defined on :root by stories/assets/scss/_tokens-data-viz.scss — but it is absent from tokens.json too, because the dictionary is built from the tokens/*.yaml sources only. The dictionary's own \`scope\` field says the same thing; a machine-readable per-component list is tracked in https://github.com/unisdr/undrr-mangrove/issues/1207.

Icons gallery:
${DOCS_BASE}?path=/docs/components-icons--docs

Static icon inventory (machine-readable):
${DOCS_BASE}ai-components/components-icons.json

### Vanilla HTML quick start

${vanillaCount} of the ${indexEntries.length} components work as plain HTML with CSS classes, no React needed. In the index, these have vanillaHtml: true. Each component's detail JSON includes a renderedHtml array with copy-pasteable HTML snippets.

1. Include the Mangrove CSS bundle (pick your theme):
   - UNDRR: ${themeCss.undrr}
   - PreventionWeb: ${themeCss.preventionweb}
   - MCR2030: ${themeCss.mcr2030}
   - IRP: ${themeCss.irp}
   - DELTA: ${themeCss.delta}
   - All themes in one bundle: ${themeCss.all}

   Each single-theme bundle carries only its own tokens. style.css contains no
   .mg-theme-* rules, so putting class="mg-theme-irp" on a page that loaded
   style.css does nothing — load that theme's bundle, or style-all.css if the
   page has to switch themes at runtime.

2. Fetch the component index and find what you need
3. Fetch the component's detailsUrl and use the renderedHtml examples

### React quick start

${reactCount} components require React (requiresReact: true in the index). These use D3, Leaflet, or complex state management. Import via npm: import { ComponentName } from "@undrr/undrr-mangrove".

Several React components support hydration on vanilla HTML pages via the createHydrator pattern. Check the component's \`hydration\` field (or \`reactNote\`) for details; components with a \`hydration\` field are flagged \`hydration: true\` in the index. A \`vanillaModule\` field (flagged \`vanillaModule: true\`) has the same shape but describes a plain ES module from \`/js/\`: it needs neither React nor \`hydrate.js\`.

### Vanilla JavaScript modules and dynamic DOM re-initialization

Mangrove provides standalone vanilla JavaScript utilities under \`/js/\` (\`${cdnBase}/js/*.js\`, loaded with \`type="module"\`) that auto-initialize on \`DOMContentLoaded\`. When working with Single Page Applications (SPAs) or dynamically rendering content into the DOM (e.g. after AJAX fetches, client routing, modal dialogs), invoke the exported initialization functions manually:

- **Tabs** (\`js/tabs.js\`): Call \`mgTabs(scope)\` to initialize or re-initialize \`[data-mg-js-tabs]\` tab containers within a container element. Call \`mgTabsDestroy(scope)\` on unmount.
- **Show More** (\`js/show-more.js\`): Call \`mgShowMore(scope)\` to initialize \`[data-mg-show-more]\` content truncation toggles.
- **Table of Contents** (\`js/table-of-contents.js\`): Call \`mgTableOfContents(scope)\` to generate an article TOC with scrollspy tracking.
- **On This Page Nav** (\`js/on-this-page-nav.js\`): Call \`mgOnThisPageNav(scope)\` for in-page jump nav with horizontal scrolling.
- **Switch pending** (\`js/switch-pending.js\`): Call \`mgSwitchPendingInit(scope)\` for new \`[data-mg-switch-pending]\` switches, or \`mgSwitchPending(input, { save })\` for one switch. Call \`mgSwitchPendingDestroy(scope)\` before removing them.
- **Preview Access** (\`js/preview-access.js\`): Call \`mgPreviewAccess(scope)\` to initialize password gating for staging environments.
- **Shared constants** (\`js/undrr.js\`): Key codes and breakpoints on \`window.UNDRR\`. It does not bundle the other modules.

### CSS utilities

The utilities.json file lists ~${utilityClassCount} utility classes grouped by category: layout containers, grid, responsive display, text utilities, accessibility, background colors, text colors, font sizes, animations, embed containers, and show-more patterns. All use the mg- prefix.

### Releases and changelog

To inspect changes between versions, tags, and pre-releases without parsing raw git commits:

- **Machine-readable releases endpoint**: ${DOCS_BASE}releases.json
  Contains structured changelog objects for every release (version, release date, tag, PR references, categorization: Features, Bug fixes, Tooling, Security) plus component-level changelogs.
- **Repository changelog**: https://github.com/unisdr/undrr-mangrove/blob/main/CHANGELOG.md
  Cross-cutting library release notes.
- **v2.0 migration notes & breaking changes**: ${DOCS_BASE}?path=/docs/getting-started-release-notes-v2-0--docs
  Full breaking change catalogue, architectural shifts, and token migration recipes.
- **Component-level changelogs**: Each component's detail file (${DOCS_BASE}ai-components/{id}.json) contains a \`changelog\` array with granular version updates, dates, descriptions, and PR links.

### Z-index layers

Use the --mg-z-index-* custom properties for global stacking contexts (fixed, sticky, portaled, or deliberately negative elements). One token per UI concept: --mg-z-index-behind, -nav, -sticky, -nav-toggle, -header, -drawer, -dropdown, -modal, -toast. Derive backdrops with calc(), e.g. z-index: calc(var(--mg-z-index-drawer) - 1). For local stacking within a component's own isolated stacking context (e.g. inside position: relative), use a raw value with a comment instead of a token. The navigation zone tokens (-nav through -header, values 10-22) are frozen; do not change their numeric values. These were $mg-z-index-* Sass variables before 2.0 and no longer exist in that form. See the "Design decisions/Z-index layers" Storybook page for the full layer table and philosophy.

### Design tokens

Colour, spacing, radii and component tokens are CSS custom properties, so they are themeable at runtime from a \`:root\` block or a \`.mg-theme-*\` block. No rebuild of Mangrove is needed.

Where they come from:

- Compiled theme token dictionary: ${DOCS_BASE}tokens.json — theme tokens only; see its \`scope\` field
- \`tokens/mangrove.yaml\` — the brand-neutral base: https://raw.githubusercontent.com/unisdr/undrr-mangrove/main/tokens/mangrove.yaml
- \`tokens/undrr.yaml\`, \`preventionweb.yaml\`, \`irp.yaml\`, \`mcr.yaml\`, \`delta.yaml\` — brand layers merged over the base, same directory.
- \`stories/assets/scss/_tokens-data-viz.scss\` — the chart and map palette: https://raw.githubusercontent.com/unisdr/undrr-mangrove/main/stories/assets/scss/_tokens-data-viz.scss

Those YAML files carry a \`$description\` on the tokens that need one, which is the reasoning behind the value. For automated and tooling integrations, fetch the machine-readable \`${DOCS_BASE}tokens.json\` dictionary which includes token types, formats, descriptions, and rgb() wrapping requirements.

\`tokens.json\` is a THEME token dictionary. It lists the \`--mg-*\` properties the theme stylesheets define, and nothing else. A component may also define its own \`--mg-{component}-*\` properties with their own defaults (\`--mg-empty-state-*\`, \`--mg-notice-*\`, \`--mg-tree-*\`, \`--mg-drawer-size\`), or read an input hook that no stylesheet defines so you can set it (\`--mg-switch-*\`, \`--mg-card-border\`, \`--mg-icon-fg\`, \`--mg-cta-bg\`, \`--mg-legend-tick-pos\`, \`--mg-on-this-page-nav-offset\`). Those are public API and are NOT in \`tokens.json\`; grep the compiled CSS and you will find them, which is not how you should have to. Read the component's \`ai-components/{id}.json\` or its Storybook page instead. Tracked for a structural fix in https://github.com/unisdr/undrr-mangrove/issues/1207.

What you actually write against is the compiled result: the \`--mg-*\` custom properties in the theme stylesheets above.

Four things the sources do not make obvious:

**1. The rgb() wrapping rule.** Most colour tokens are sRGB channel triples, not colours:

\`\`\`css
--mg-color-blue-900: 0 79 145;              /* channels, not a colour */
color: rgb(var(--mg-color-interactive));    /* correct */
color: var(--mg-color-interactive);         /* INVALID — silently dropped */
background: rgb(var(--mg-color-interactive) / 0.1);   /* alpha for free */
\`\`\`

Getting it wrong produces a declaration the browser discards with no console error, so it fails by looking almost right. Full colour tokens must NOT be wrapped in \`rgb()\`, because they already evaluate to complete color expressions or keyword colours (e.g. \`transparent\`).
Check \`${DOCS_BASE}tokens.json\` for the authoritative, machine-readable list. As of ${pkg.version}, the tokens that must NOT be wrapped in \`rgb()\` are:
${tokensDict.wrappingRules.exceptions.length ? tokensDict.wrappingRules.exceptions.map(e => `- \`${e}\``).join('\n') : '- (None as of this version)'}

**2. Focus rings.** \`--mg-color-focus-ring\` is the ring colour (deliberately not a brand colour: a brand-coloured ring vanishes against the brand's own filled surfaces). \`--mg-color-focus-ring-inverse\` is for a ring painted on an already-dark surface — a button on a filled hero banner, the dark Card variants. Geometry is \`--mg-focus-ring-width\`, \`-offset\` and \`-radius\`. Components should \`@include mg-focus-ring;\` or \`@include mg-focus-ring-inset;\` (\`stories/assets/scss/_mixins.scss\`) rather than hand-rolling an outline: the mixin draws two bands so the indicator is legible on any surface, and keeps the ring as an \`outline\` so it survives forced-colors mode.

**3. Sendai Framework colours.** \`--mg-sendai-target-a\` through \`-g\` are the seven Sendai targets, with matching \`--mg-sendai-on-target-*\` label colours (Target C is the one that takes a dark label). \`--mg-dataviz-*\` carries the chart palette: \`categorical\` for unordered series, \`sequential\` for ordered magnitude, \`sendai-*\` for the ten-stop target ramps, plus chart chrome. Do not mix those three jobs.

**4. Deprecated: \`--sendai-red|orange|purple|turquoise\`** and their \`.mg-u-background-color--sendai-*\` / \`.mg-u-color--sendai-*\` utility classes. Named by colour rather than by Sendai meaning, three of the seven targets have no counterpart, and they are scheduled for removal in 2.1. Do not emit them in new code — use \`--mg-sendai-target-*\` for target semantics or the \`--mg-color-*\` palette for a plain accent.

Breakpoints (\`$mg-breakpoint-*\`) and \`$mg-tabs-border-bottom\` remain SCSS-only build-time variables and are not available as CSS custom properties: \`@media\` and \`@if\` both need a compile-time value. The font *faces* (\`$mg-font-face-*\`) are Sass for a different reason — they are the compile-time source the role custom properties are built from, and overriding one before the import is the only way to introduce a typeface Mangrove does not ship; see "Overrides" under Typography below. Font *families* are not on that list — they are the five \`--mg-font-family-*\` role custom properties described under "Brand guide → Typography" below. Never hard-code a typeface; name a role.

### Conventions

- CSS prefix: mg-
- Naming: BEM (e.g., mg-card__title, mg-button--primary)
- Themes: undrr, preventionweb, irp, mcr2030, delta
- Locales: en, ar, my, ja (RTL supported)
- Semantic HTML, WCAG accessible

### List semantics: do not add role="list"

Do NOT put \`role="list"\` on a \`<ul>\` or \`<ol>\` you give a Mangrove class to. Mangrove's own rendered HTML does not, and the components do not need it.

Every Mangrove class that hides list markers does it with \`list-style: none\` followed by \`list-style-type: ""\`. Safari drops the implicit \`list\` role from a list whose marker is \`none\`, which is the bug \`role="list"\` is usually added to work around; an empty string is still a marker, so the role survives, renders nothing and reserves no space. The \`none\` before it is the fallback for browsers too old to parse a string marker. Fixing it in the stylesheet is what reaches consumers who hand-write the markup, which is most of them.

This covers \`.mg-breadcrumb\`, \`.mg-pager__list\`, \`.mg-on-this-page-nav__list\`, \`.mg-status-label-group\`, \`.mg-legend__list\`, \`.mg-hub-header__nav\`, the MegaMenu nav and sidebar lists, and the search widget's active-filter list.

Some lists carry a different ARIA role on purpose — \`.mg-tree\` is \`role="tree"\`, its groups are \`role="group"\`, the mega-menu panels are \`role="menu"\`, the select dropdown is \`role="listbox"\`, and \`.mg-tabs__list\` becomes \`role="tablist"\` once \`js/tabs.js\` initialises it. That role replaces list semantics. Keep it, and do not add \`role="list"\` alongside it.

If you are writing a list of your own with \`list-style: none\` and no Mangrove class, the Safari bug is yours to handle: either add \`list-style-type: ""\` after it, or add \`role="list"\`.

### How to use

1. Fetch ${DOCS_BASE}ai-components/index.json
2. Find the component you need by name or description
3. Check vanillaHtml / requiresReact to know if you need React
4. Fetch its detailsUrl for rendered HTML, props, and code examples
5. For CSS utilities, fetch ${DOCS_BASE}ai-components/utilities.json

The component index is not the whole library. Two things live elsewhere, and searching only the index will tell you they do not exist:

- **CSS utility classes are in \`utilities.json\`, not the index.** Some patterns ship as utility classes with no component entry at all — the accordion (\`.mg-accordion\`) is one, and the data-table modifiers (\`.mg-table--data\` and the \`.mg-table__th--sortable\` / \`--sticky\` / \`.mg-table__td--numeric\` family) are documented there rather than on the Table entry. Fetch \`utilities.json\` before concluding Mangrove has no accordion or no sortable table.
- **Component custom properties are not in \`tokens.json\`.** It is a theme token dictionary; see the "Design tokens" section above.

### Brand guide

The Storybook includes a Brand section for non-technical users (content editors, brand managers, external partners). Five pages:

- **About this guide** (${DOCS_BASE}?path=/docs/brand-about-this-guide--docs): Overview with theme-map cards linking to each UNDRR property's brand identity preset.
- **Brand identity** (${DOCS_BASE}?path=/story/brand-brand-identity--docs): Theme-aware page showing colors, typography, logos, buttons, and icons. Switch themes via toolbar or append \`&globals=theme:<Theme Name>\` to the URL. Colors are probed live from compiled CSS via \`getComputedStyle\`, so they stay in sync with SCSS.
- **Brand guidelines** (${DOCS_BASE}?path=/docs/brand-brand-guidelines--docs): Editorial guidance — brand positioning, communication rules, logo usage, photography standards, web elements. Migrated from UNDRR SharePoint.
- **Common patterns** (${DOCS_BASE}?path=/docs/brand-common-patterns--docs): Plain-language reference for foundations shared across all themes — breakpoints, grid classes (\`mg-grid__col-{N}\`), accessibility standards, language support (\`lang="ar"\` mechanism), icon sources, z-index.
- **Component gallery** (${DOCS_BASE}?path=/docs/brand-component-gallery--docs): Curated catalog of ~40 components in 8 categories (page structure, hero, content cards, interactive, data viz, typography, layout helpers, platform features). Each row links to the full component docs. Useful first stop when navigating what exists.

Theme key facts:
- Five themed properties with resolved primary colors: UNDRR (blue #004f91), PreventionWeb (teal #0a6969), MCR2030 (purple #591a61), IRP (bright blue #0f78bf), DELTA Resilience (navy #132e48).
- Neutrals are shared across all themes — only brand/accent colors change per property.

Brand characteristics (UNDRR voice): Knowledgeable, Approachable, Collaborative.

Editorial rules:
- Avoid UN jargon. Lead with people, not issues. Use inverted pyramid. Positive framing for prevention content.

Typography:
- Font families are CSS custom properties called ROLES, not Sass variables. A component stylesheet names a role and never a typeface: \`var(--mg-font-family-text)\`, \`-heading\`, \`-display\`, \`-ui\`, \`-code\`. Roles are defined on \`:root\` in \`_variables.scss\` and re-pointed for Arabic in \`_fonts.scss\`, which is the single font entry point every build path imports — entry points, the shared Drupal import list, and the per-component recipe alike.
- Role to face, Latin then Arabic: text = Roboto / Noto Sans Arabic; heading = Roboto / Noto Kufi Arabic; display = Roboto Condensed / Noto Kufi Arabic; ui = Roboto Condensed / Noto Sans Arabic; code = the monospace stack in both scripts. Latin rendering is identical to the pre-role token set.
- Which role: \`ui\` for scanned chrome — \`.mg-hero__label\`, \`.mg-card__title\`, \`.mg-card__label\`, \`.mg-stats-card-item__value\`, \`.mg-stats-card-item__label\`, \`.mg-stats-card-item__bottom-label\`, \`.mg-gallery__title\`, \`.mg-mega-content__banner header\`, \`.mg-tabs__link\`, \`.mg-on-this-page-nav__link\`, \`.mg-on-this-page-nav__cta\`, \`.mg-mega-topbar__item-link\`, \`.mg-footer--about-footer--links\`, \`.mg-tag\` and variants. \`display\` for \`.mg-hero__title\` only. \`text\` for every button (including \`.mg-preview-access__submit\`), form fields, chips, status labels, table cells and running text. Do not declare a family on h1-h6, \`p\`, \`th\`, \`td\` or a bare \`header\`: they inherit \`text\` from \`body\`, and h1-h3 additionally get \`heading\` from \`_foundational.scss\` under \`:lang(ar)\` only.
- DO NOT write a \`:lang(ar)\` font-family rule in a component stylesheet. Script routing lives only in \`_fonts.scss\`; 19 component-level \`:lang(ar)\` blocks were deleted when the roles landed. A component-level override takes the component out of the script map.
- The \`heading\` rule in \`_foundational.scss\` is \`h1:lang(ar), h2:lang(ar), h3:lang(ar)\` and is deliberately NOT unconditional. In Latin \`heading\` and \`text\` are the same face, so an unconditional rule would change nothing visually and would override a consuming theme's own \`h1\` face on source order. A consequence: a \`ui\` or \`display\` container does NOT need to claim its subtree, and the \`:is(h1, h2, h3, a)\` claims earlier alphas added to \`card.scss\` and \`hero.scss\` were removed.
- Overrides: re-point a role at runtime in a \`.mg-theme-* { --mg-font-family-ui: ...; }\` block, which can only select a face Mangrove already loads. To introduce a new typeface, override a \`$mg-font-face-*\` Sass variable (\`$mg-font-face-sans\`, \`-sans-condensed\`, \`-mono\`, \`-arabic-display\`, \`-arabic-sans\`, all \`!default\`) before the import and load the font yourself; that applies to every brand in \`style-all.css\`. Quote any family name that is not a plain CSS identifier — \`"Frutiger 55 Roman", sans-serif\`, not bare — or the emitted custom property is invalid and the page falls back to the browser's default serif.
- Removed in 2.0 and warned about at import time: \`$mg-font-family\`, \`$mg-font-family-condensed\`, \`$mg-font-family-headings\`, \`$mg-font-family-icons\`, \`$mg-font-family-arabic-headings\`, \`$mg-font-family-arabic-body\`.
- Arabic weights: only Regular and Bold are published in the UNDRR asset library for either family, so Arabic has a 400/700 ladder where Latin has four steps. The ladder is asymmetric: \`font-weight: 600\` resolves up to Bold, \`500\` resolves down to Regular.

Photo sizes (credit/source required on every image):
- Hero 1440x540 (16:6), News 1164x665 (16:9), Publication 176x235 (3:4), Thumbnail 176x176 (1:1).

Logos (hosted on CDN for hotlinking or download):
- UNDRR: https://assets.undrr.org/logos/undrr/undrr-logo-blue.svg (blue, white, square variants)
- PreventionWeb: https://assets.undrr.org/logos/pw/pw-logo.svg
- IRP: https://assets.undrr.org/logos/irp/irp-logo.svg
- MCR2030 and DELTA: not yet on CDN
- Safety zone equals the width of the "U" in UNDRR. Do not place on busy backgrounds. Use inverse (white) variant on dark backgrounds.

Icons:
- Lucide for general UI icons, OCHA for humanitarian/hazard icons (earthquake, tsunami, flood, cyclone, drought, resilience), plus custom UNDRR icons. Use via \`<Icon name="..."/>\` or CSS classes \`mg-icon mg-icon-{name}\`.

### Source layout

- stories/Atom/          Typography, images, layout, navigation
- stories/Molecules/     SectionHeader, FooterNavigation, BodyColumn
- stories/Components/    MegaMenu, Cards, Charts, Map, Gallery
- stories/Utilities/     CSS utilities, loaders, show/more
- stories/Patterns/      Full-page compositions (ArticleStory, ContentHub, LandingPages) — demonstrate assembling components into a page, not reusable exports themselves. See "Composing a page pattern" below.
- stories/assets/scss/   Theme stylesheets and design tokens

### Composing a page pattern

stories/Patterns/* (ArticleStory, ContentHub, LandingPages, and future additions) are not components: nothing there is exported from the npm package or hydrated. Each one demonstrates how existing components and layout primitives assemble into a full page. Before laying out a new pattern, pick the right layout system for the shape you need — reusing the wrong one is the most expensive mistake to unwind:

- **mg-grid** (\`stories/Atom/Layout/Grid/grid.scss\`, classes \`mg-grid mg-grid__col-{2..6}\`): equal-fraction repeating columns — every numbered track is \`1fr\`. Use it for repeating card grids. \`mg-grid--article\` (below) is a different, asymmetric variant on the same base class — the numbered/span classes are still equal-fraction only.
- **mg-grid's \`--article\` variant** (\`mg-grid mg-grid--article\`, defined in \`stories/Atom/Layout/Grid/grid.scss\`): the asymmetric rail/article split — a flexible \`minmax(0, 1fr)\` column plus a fixed 16rem rail. This is what \`mg-reading--with-contents\` (\`stories/Utilities/PagePatterns/page-patterns.scss\`) pairs with for a long-form reading column with a sticky table-of-contents rail from 48rem up, stacking above the article below that; \`page-patterns.scss\` itself only supplies the item-placement rules (which child is the sidebar vs. the article), not the column shape. Reach for \`mg-grid--article\` directly if you need the same asymmetric shape outside that pattern.
- **Plain CSS grid**, written locally in a component's own stylesheet: for a one-off asymmetric shape that belongs to a single component and isn't meant to be reused elsewhere — e.g. Hero's \`.mg-hero__split-grid\` (\`2fr 1fr\` split for \`layout="split"\`) or Card's horizontal-card grid with explicit \`grid-column\`/\`grid-row\` placement. Use this when the shape is specific to one component, not a page-level layout primitive; don't promote it to a shared class unless a second consumer actually needs it.
`;

  fs.writeFileSync(llmsTxtPath, llmsTxt);

  // -------------------------------------------------------------------------
  // Write llms.json
  // -------------------------------------------------------------------------

  const llmsJson = JSON.stringify(
    {
      name: 'UNDRR Mangrove',
      description: `UI component library for UNDRR disaster risk reduction websites. ${vanillaCount} vanilla HTML components, ${reactCount} React-only.`,
      version: pkg.version,
      package: pkg.name,
      license: pkg.license || 'See LICENSE file',
      urls: {
        storybook: DOCS_BASE,
        repository: 'https://github.com/unisdr/undrr-mangrove',
        npm: `https://www.npmjs.com/package/${pkg.name}`,
        releases: `${DOCS_BASE}releases.json`,
        changelog:
          'https://github.com/unisdr/undrr-mangrove/blob/main/CHANGELOG.md',
        releaseNotesV2: `${DOCS_BASE}?path=/docs/getting-started-release-notes-v2-0--docs`,
        componentIndex: `${DOCS_BASE}ai-components/index.json`,
        utilities: `${DOCS_BASE}ai-components/utilities.json`,
        tokens: `${DOCS_BASE}tokens.json`,
        css: themeCss,
      },
      latestRelease: releasesData.latest,
      requiredAssets: {
        _note:
          'Every UNDRR-branded page should include these. The page header and footer structures are non-negotiable branding elements — use them exactly as documented.',
        stylesheets: requiredStylesheets.map(s => s.url),
        scripts: requiredScripts.map(s => ({
          url: s.url,
          defer: s.attributes === 'defer',
        })),
        logos,
      },
      vanillaScripts,
      conventions: {
        cssPrefix: 'mg-',
        naming: 'BEM',
        themes: ['undrr', 'preventionweb', 'irp', 'mcr2030', 'delta'],
        locales: ['en', 'ar', 'my', 'ja'],
        breakpoints: {
          mobile: '480px',
          tablet: '900px',
          desktop: '1164px',
          wide: '1440px',
        },
      },
      generatedAt,
    },
    null,
    2
  );

  fs.writeFileSync(path.join(buildDir, 'llms.json'), llmsJson);

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------

  const indexSizeKB = (Buffer.byteLength(indexJson) / 1024).toFixed(1);
  const totalDetailKB = componentFiles.reduce(
    (sum, { content }) =>
      sum + Buffer.byteLength(JSON.stringify(content, null, 2)),
    0
  );
  const utilitiesSizeKB = (Buffer.byteLength(utilitiesJson) / 1024).toFixed(1);

  console.log('AI manifest generated:');
  console.log(`  ${llmsTxtPath} (llms.txt + llms.json)`);
  console.log(
    `  ${path.join(buildDir, 'releases.json')} (${releasesData.releases.length} releases parsed)`
  );
  console.log(
    `  ${outputDir}/index.json (${indexEntries.length} components, ${indexSizeKB} KB)`
  );
  console.log(
    `  ${outputDir}/*.json (${componentFiles.length} component files, ${(totalDetailKB / 1024).toFixed(1)} KB total)`
  );
  console.log(`  ${outputDir}/utilities.json (${utilitiesSizeKB} KB)`);
  console.log(
    `  ${vanillaCount} vanilla HTML components, ${reactCount} React-only components`
  );
  console.log(
    `  ${renderedHtml.size} auto-rendered, ${componentFiles.filter(c => c.content.renderedHtml && !c.content.renderedHtmlSource).length} curated HTML`
  );
  if (droppedImportCount > 0) {
    console.log(
      `  ${droppedImportCount} Storybook-generated import(s) removed (not exported from src/index.js)`
    );
  }
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
