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
 *        llms-editorial-manual.txt      — sub-manifest: writing/style rules, from docs/EDITORIAL-MANUAL.md
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
import { buildEditorialManualTxt } from './editorial-manual.js';
import { REPO_BLOB_MAIN, REPO_URL } from './repo.js';
import {
  collectCustomProperties,
  MIN_PROPERTIES,
  NOT_PUBLIC,
} from './custom-properties.js';
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

// Longest a component's `summary` may be before component-data.js has to
// supply a short one of its own. Roughly one full sentence.
const SUMMARY_MAX_LENGTH = 200;

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
    name: 'Drawer',
    file: 'js/drawer.js',
    url: `${CDN_BASE}/js/drawer.js`,
    selector: '[data-mg-js-drawer]',
    initFunction: 'mgDrawer(scope)',
    description:
      'Open and close, Escape, focus management and a modal focus trap for a drawer or floating panel you rendered yourself. It never builds markup, so the close label, title and body stay in your HTML. Triggers are [data-mg-drawer-trigger="<container id>"]; scripts can dispatch mg-drawer:open, mg-drawer:close and mg-drawer:toggle on the container and listen for mg-drawer:opened and mg-drawer:closed. A floating panel (the mg-floating-panel class) is non-modal: no backdrop and no Tab trap. Call mgDrawer(scope) again for drawers added later, and mgDrawerDestroy(scope) before removing them.',
  },
  {
    name: 'Hub header',
    file: 'js/hub-header.js',
    url: `${CDN_BASE}/js/hub-header.js`,
    selector: '[data-mg-js-hub-header]',
    initFunction: 'mgHubHeader(scope)',
    description:
      'Keeps the marked section of a static HubHeader in view and drives its edge fades. With data-mg-hub-header-detect-current it marks the current section from the URL, so the same markup can be copied to every page of a hub. Call mgHubHeader(scope) for headers added later; the returned function undoes the call.',
  },
  {
    name: 'Copy button',
    file: 'js/copy-button.js',
    url: `${CDN_BASE}/js/copy-button.js`,
    selector: '[data-mg-copy-button]',
    initFunction: 'mgCopyButton(scope)',
    description:
      'Zero-dependency copy-to-clipboard button with a transient tooltip and an aria-live announcement. Call mgCopyButton(scope) for buttons added later.',
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
  SegmentedControl: 'components-forms-segmented-control',
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
    SegmentedControl: {
      legend: 'Map layer',
      name: 'layer',
      defaultValue: 'depth',
      options: [
        { label: 'Depth', value: 'depth' },
        { label: 'Frequency', value: 'frequency' },
        { label: 'Exposure', value: 'exposure' },
      ],
    },
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
// Parse the importable surface from the built component bundles
// ---------------------------------------------------------------------------

/**
 * Reads dist/components/*.js and returns, per bundle, the export names it
 * provides. These bundles are what the npm package publishes under
 * `components/`, so this is the surface a consumer can actually import.
 *
 * This used to read src/index.js instead and advertise
 * `import { X } from "@undrr/undrr-mangrove"`. That import resolves for
 * nothing: the published tarball ships neither `src/` nor `dist/`, and its
 * `main` names a file it does not contain, so every agent that followed the
 * manifest wrote an import that throws ERR_MODULE_NOT_FOUND. See
 * unisdr/undrr-mangrove#1252.
 */
function parseBundleExports() {
  const byBundle = new Map();
  if (!fs.existsSync(distDir)) {
    // Fatal, not a warning. Continuing would publish a manifest in which
    // every component has silently lost its `import` line — the same class of
    // wrong-but-plausible output this function exists to stop, and
    // indistinguishable from "no component is importable".
    console.error(`Component bundles not found at ${distDir}.`);
    console.error('Run "yarn build" (or "webpack") before generating.');
    process.exit(1);
  }
  for (const file of fs.readdirSync(distDir)) {
    if (!file.endsWith('.js')) continue;
    const source = fs.readFileSync(path.join(distDir, file), 'utf8');
    const names = new Set();
    // Webpack's ESM output ends with one `export { a as Name, b as default };`
    // per entry. Take the exported name, which is what follows `as`, or the
    // whole specifier when the binding is exported under its own name.
    for (const match of source.matchAll(/export\s*\{([^}]*)\}/g)) {
      for (const specifier of match[1].split(',')) {
        const name = specifier
          .trim()
          .split(/\s+as\s+/)
          .pop();
        if (/^[A-Za-z_$][\w$]*$/.test(name)) names.add(name);
      }
    }
    byBundle.set(file.replace(/\.js$/, ''), names);
  }
  return byBundle;
}

const bundleExports = parseBundleExports();

if (bundleExports.size === 0) {
  console.error(`No component bundles in ${distDir}.`);
  console.error('Run "yarn build" (or "webpack") before generating.');
  process.exit(1);
}

// A dist/ built before a component was added or renamed is worse than no
// dist/ at all: it produces a manifest that looks complete and quietly omits
// whatever moved. Every COMPONENT_IDS key is a webpack entry, so each must
// have a bundle; one that does not means the tree is stale.
const staleBundles = Object.keys(COMPONENT_IDS).filter(
  name => !bundleExports.has(name)
);
if (staleBundles.length > 0) {
  console.error(
    `dist/components/ is stale: ${staleBundles.length} webpack entr${
      staleBundles.length === 1 ? 'y has' : 'ies have'
    } no bundle.`
  );
  for (const name of staleBundles) console.error(`  - ${name}.js`);
  console.error('Rebuild with "yarn build" before generating.');
  process.exit(1);
}

// Reverse lookup: Storybook ID → webpack entry name (which is the published
// file name under components/). Derived from COMPONENT_IDS so it self-heals
// when new components are added. Used as a fallback when Storybook's internal
// function name differs from the entry name.
const storybookIdToWebpackName = Object.fromEntries(
  Object.entries(COMPONENT_IDS).map(([name, id]) => [id, name])
);

// Manual overrides for components whose Storybook function name differs from
// the name of the bundle they ship in.
const NPM_NAME_OVERRIDES = {
  ShowOffSnackbar: 'Snackbar', // Storybook demo wrapper name vs component name
};

/**
 * Build an import statement that resolves from the published package, or an
 * empty string when the component ships in no bundle. Tries the Storybook
 * name first, then the COMPONENT_IDS reverse lookup, then NPM_NAME_OVERRIDES.
 *
 * The specifier is the subpath, `@undrr/undrr-mangrove/components/Name.js`,
 * because the package root does not resolve (unisdr/undrr-mangrove#1252). The
 * binding is whatever the bundle exports: named where there is a matching
 * named export, default where there is only a default.
 */
function buildImportStatement(componentName, componentId) {
  const candidates = [
    componentName,
    storybookIdToWebpackName[componentId],
    NPM_NAME_OVERRIDES[componentName],
  ].filter(Boolean);
  const bundle = candidates.find(n => bundleExports.has(n));
  if (!bundle) return '';

  const exportNames = bundleExports.get(bundle);
  const specifier = `${pkg.name}/components/${bundle}.js`;
  const named = candidates.find(n => exportNames.has(n));
  if (named) return `import { ${named} } from "${specifier}";`;
  if (exportNames.has('default')) {
    return `import ${bundle} from "${specifier}";`;
  }
  return '';
}

/** The bundle name an emitted import statement points at. */
function importedBundle(statement) {
  const match = statement.match(/\/components\/([\w$.-]+)\.js"/);
  return match ? match[1] : '';
}

/**
 * Import every bundle once and record the ones that throw.
 *
 * A component whose module scope reaches for `document` — ShowMore and Tab
 * both import a vanilla module that self-initialises on load — imports
 * cleanly in a browser or through a bundler and throws `document is not
 * defined` in Node and in server-side rendering. Its import line is correct
 * and is published, but the constraint is published with it: an agent that
 * evaluates the line in Node gets a crash it can neither predict from the
 * manifest nor blame on itself.
 *
 * Probing is the only honest way to know this. Static analysis of a minified
 * bundle cannot tell a module-scope DOM read from one inside a function.
 */
async function probeBundleImports() {
  const failures = new Map();
  for (const bundle of bundleExports.keys()) {
    try {
      await import(path.join(distDir, `${bundle}.js`));
    } catch (e) {
      failures.set(bundle, e.message.split('\n')[0]);
    }
  }
  return failures;
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

/** First line of a component's react-docgen docblock, tags stripped. */
function docgenLine(component) {
  if (!component.reactDocgen?.description) return '';
  const desc = component.reactDocgen.description
    .replace(/@param\s+\{[^}]*\}\s+\S+\s*/g, '')
    .replace(/@returns?\s+.*/g, '')
    .trim();
  return desc ? desc.split('\n')[0] : '';
}

/**
 * Get the best description for a component.
 *
 * The curated component-data.js description wins over the source docblock.
 * Both are written by hand, but they are written for different readers: the
 * docblock describes the export to someone already looking at the source,
 * while the curated entry is the manifest's own editorial surface, written
 * for an agent that only ever sees index.json. When a maintainer writes a
 * usage contract into component-data.js, that is the text meant to reach the
 * manifest — see undrr-mangrove#1231, where #1225's icon-button contract
 * never reached index.json because CtaButton.jsx's docblock outranked it.
 *
 * This replaces a narrower `patterns-*` exception added for
 * undrr-mangrove#1129, which was the same failure on the pattern stories.
 * One rule, applied everywhere, rather than a list of ids that need it.
 *
 * A curated description may be long — a full contract paragraph, not a
 * sentence. That is what `summary` is for: see getSummary().
 */
function getDescription(id, component, data) {
  if (data?.description) return data.description;

  if (component.description) return component.description;

  const docgen = docgenLine(component);
  if (docgen) return docgen;

  if (REQUIRES_REACT[id]) return REQUIRES_REACT[id];

  return '';
}

/**
 * Get the one-line summary shown in index.json beside the full description.
 *
 * `summary` and `description` used to hold the same string. They no longer
 * do: a curated description carries the whole contract, which is what an
 * agent grepping the index needs to find, but it does not read as a label in
 * a list of 82 components. A curated entry whose description runs past
 * SUMMARY_MAX_LENGTH therefore carries its own short `summary`, and
 * `yarn validate-manifest` fails when it does not.
 */
function getSummary(id, component, data, description) {
  if (data?.summary) return data.summary;

  if (description.length <= SUMMARY_MAX_LENGTH) return description;

  // Safety net for a long description nobody has summarised yet (validation
  // catches the curated case): prefer the docblock line, else the first
  // sentence.
  const docgen = docgenLine(component);
  if (docgen && docgen.length <= SUMMARY_MAX_LENGTH) return docgen;

  const firstSentence = description.match(/^.*?[.!?](?=\s|$)/)?.[0];
  return firstSentence && firstSentence.length <= SUMMARY_MAX_LENGTH
    ? firstSentence
    : description;
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
      // Name the example, not the component. This used to be the curated
      // description, which reads as a label only while a description is one
      // sentence long — see undrr-mangrove#1231. The description is published
      // in the same file, on the component.
      results.set(componentId, [
        { name: `${fileName} — default render`, html: formatted },
      ]);
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
// Check that a long curated description carries a short summary
//
// The curated description reaches `description` in index.json and in every
// detail file, which is the point: an agent greps the index and finds the
// contract. `summary` is the other half of that entry — the line a human or
// an agent reads when scanning 82 components — so a description written as a
// paragraph needs a sentence written for that slot instead.
// ---------------------------------------------------------------------------
const missingSummaries = [];
for (const [componentId, data] of Object.entries(curatedData)) {
  if (typeof data?.description !== 'string') continue;
  if (data.summary) {
    if (data.summary.length > SUMMARY_MAX_LENGTH) {
      missingSummaries.push(
        `${componentId}: summary is ${data.summary.length} characters ` +
          `(max ${SUMMARY_MAX_LENGTH})`
      );
    }
    continue;
  }
  if (data.description.length > SUMMARY_MAX_LENGTH) {
    missingSummaries.push(
      `${componentId}: description is ${data.description.length} characters ` +
        `and there is no summary (max ${SUMMARY_MAX_LENGTH})`
    );
  }
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
  for (const field of ['examples', 'supplementalExamples']) {
    if (!data?.[field]) continue;
    if (!Array.isArray(data[field])) {
      malformedExamples.push(`${componentId}: ${field} is not an array`);
      continue;
    }
    data[field].forEach((example, index) => {
      if (typeof example !== 'object' || example === null) {
        malformedExamples.push(
          `${componentId}: ${field}[${index}] is a ${typeof example}, expected ` +
            '{ name, html }'
        );
      } else if (
        typeof example.html !== 'string' ||
        example.html.length === 0
      ) {
        malformedExamples.push(
          `${componentId}: ${field}[${index}] has no html string`
        );
      } else if (
        typeof example.name !== 'string' ||
        example.name.length === 0
      ) {
        malformedExamples.push(
          `${componentId}: ${field}[${index}] has no name`
        );
      }
    });
  }
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
// Check that a claimed lifecycle module is a file that exists
//
// The manifest now states the lifecycle outright — `vanillaModule: true` or
// `false` on every component, with `vanillaScripts` naming the files — so a
// consumer no longer probes /js/ for a 404 to find out (#1197). That is only
// worth trusting if the claim is checked: a contract naming a module that was
// never written, or that was renamed out from under it, has to fail the build
// rather than publish a URL that 404s.
//
// Checked against the source tree, which is always present, so this runs the
// same whether or not a build has happened. Built-only artifacts under
// components/ are left to checkCuratedDrift(), which needs dist/.
// ---------------------------------------------------------------------------
const VANILLA_JS_SOURCE_DIR = path.resolve(process.cwd(), 'stories/assets/js');

/**
 * A contract's module URLs as the package-relative paths npm and the CDN
 * publish them at ('js/drawer.js'), so a claim can be resolved to a file.
 *
 * @param {object} contract A `hydration` or `vanillaModule` contract.
 * @returns {string[]}
 */
function modulePaths(contract) {
  return Object.values(contract?.modules || {}).map(moduleUrl => {
    const match = /\/mangrove\/[^/]+\/(.+)$/.exec(String(moduleUrl));
    return match ? match[1] : String(moduleUrl);
  });
}

const missingModuleFiles = [];
for (const [componentId, data] of Object.entries(curatedData)) {
  for (const field of CONTRACT_FIELDS) {
    const contract = data?.[field];
    if (!contract || typeof contract !== 'object') continue;
    for (const publishedPath of modulePaths(contract)) {
      if (!publishedPath.startsWith('js/')) continue;
      const source = path.resolve(
        VANILLA_JS_SOURCE_DIR,
        publishedPath.slice('js/'.length)
      );
      if (!fs.existsSync(source)) {
        missingModuleFiles.push(
          `${componentId}: ${field} names ${publishedPath}, but stories/assets/${publishedPath} does not exist`
        );
      }
    }
  }
  // A note explaining why there is no module contradicts a module.
  if (data?.vanillaModuleNote && data?.vanillaModule) {
    missingModuleFiles.push(
      `${componentId}: has both a vanillaModule contract and a vanillaModuleNote explaining that it has none`
    );
  }
}

// The library-level list consumers read from index.json's `library` block, in
// both directions: every entry names a real file, and every module that ships
// is listed. The second half is what caught js/copy-button.js, which shipped
// and was named by a component contract but was missing from this list.
const vanillaScriptFiles = new Set(VANILLA_SCRIPTS.map(script => script.file));
for (const script of VANILLA_SCRIPTS) {
  if (!script.file.startsWith('js/')) continue;
  const source = path.resolve(
    VANILLA_JS_SOURCE_DIR,
    script.file.slice('js/'.length)
  );
  if (!fs.existsSync(source)) {
    missingModuleFiles.push(
      `VANILLA_SCRIPTS: ${script.name} names ${script.file}, but stories/assets/${script.file} does not exist`
    );
  }
}
if (fs.existsSync(VANILLA_JS_SOURCE_DIR)) {
  for (const file of fs.readdirSync(VANILLA_JS_SOURCE_DIR)) {
    if (!file.endsWith('.js')) continue;
    if (vanillaScriptFiles.has(`js/${file}`)) continue;
    missingModuleFiles.push(
      `VANILLA_SCRIPTS: stories/assets/js/${file} ships but is not listed, so nothing documents it`
    );
  }
}

if (missingModuleFiles.length > 0) {
  console.warn(
    'Vanilla lifecycle modules that do not match the files on disk:'
  );
  for (const problem of missingModuleFiles) console.warn(`  ${problem}`);
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

// ---------------------------------------------------------------------------
// Collect each component's CSS custom properties
//
// Names, kinds and defaults come out of the compiled bundles; the prose comes
// from scripts/ai-manifest/custom-properties.js. See that file's header for
// why the list is produced that way. Checked in both directions below: a
// described property the CSS does not have, and a property the CSS exposes
// that nothing describes, both fail validation.
// ---------------------------------------------------------------------------
const customProperties = collectCustomProperties(
  path.resolve(process.cwd(), 'stories/assets/css'),
  buildTokensDictionary().tokens.map(token => token.name)
);
const customPropertyCount = Object.values(customProperties.byComponent).reduce(
  (total, list) => total + list.length,
  0
);

// The --mg-* properties that are in neither tokens.json nor a component's
// customProperties: global like a theme token, but declared straight in SCSS
// rather than generated from tokens/*.yaml, so the dictionary never saw them.
// Written out from the data rather than by hand, because naming only the
// data-viz palette left 29 properties unsaid — including the five typography
// roles that #1210 had just established as the public font API.
const globalGroupsWithMembers = customProperties.globals.filter(
  group => group.count > 0
);
const globalGroupsSentence = globalGroupsWithMembers
  .map(
    group =>
      `${group.label} (${group.prefix}*), ${group.count} of them, ${group.where}`
  )
  .join('; ');
// Counted rather than written out. The sentence above is generated from
// GLOBAL_PREFIXES, so a hand-typed "Four groups" in front of it goes stale the
// moment a group is added or removed — which is exactly what happened while
// unisdr/undrr-mangrove#1203 briefly carried a fifth group, leaving llms.txt
// claiming four and then listing five.
const GROUP_COUNT_WORDS = [
  'No',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
];
const globalGroupsCountPhrase = `${
  GROUP_COUNT_WORDS[globalGroupsWithMembers.length] ??
  String(globalGroupsWithMembers.length)
} group${globalGroupsWithMembers.length === 1 ? '' : 's'}`;
const globalGroupsTotal = customProperties.globals.reduce(
  (total, group) => total + group.count,
  0
);

if (customProperties.skipped) {
  console.warn(
    `Note: ${customProperties.skipped} Skipping the custom property inventory.`
  );
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
  const curatedExamples = [
    ...(Array.isArray(data?.examples) ? data.examples : []),
    ...(Array.isArray(data?.supplementalExamples)
      ? data.supplementalExamples
      : []),
  ];
  if (curatedExamples.length === 0) continue;
  for (const example of curatedExamples) {
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
      // The component cannot render in plain Node — a component that calls
      // DOMPurify is the usual reason, since DOMPurify needs a DOM. That is
      // also why it has curated HTML in the first place, so this is the
      // expected path for every sanitising component. Say so rather than
      // skipping in silence: the curated markup for these entries has no
      // automated check behind it at all, and a reader who knows this function
      // exists would otherwise assume it covered them.
      warnings.push(
        `  ${componentId}: could not verify — the component does not render in plain Node, so its curated HTML is unchecked and maintained by hand`
      );
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

  if (missingSummaries.length > 0) {
    console.error(
      `Validation failed: ${missingSummaries.length} curated description(s) ` +
        'run past the summary length with no short `summary` of their own. ' +
        'The description is published in full; add a one-sentence `summary` ' +
        'beside it in component-data.js for the index listing:'
    );
    for (const problem of missingSummaries) console.error(`  - ${problem}`);
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

  if (missingModuleFiles.length > 0) {
    console.error(
      `Validation failed: ${missingModuleFiles.length} vanilla lifecycle ` +
        'module claim(s) do not match the files on disk. A component that ' +
        'claims a module, or a VANILLA_SCRIPTS entry that names one, must ' +
        'point at a real file under stories/assets/js/, and every module that ' +
        'ships must be listed in VANILLA_SCRIPTS.'
    );
    for (const problem of missingModuleFiles) console.error(`  - ${problem}`);
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

  // Custom properties, checked in both directions. The first mirrors the
  // documented-class check above. The second is the one this field exists
  // for: a property a component exposes that nobody wrote down is exactly the
  // gap that sent a consuming team grepping the compiled CSS.
  if (customProperties.absent.length > 0) {
    console.error(
      `Validation failed: ${customProperties.absent.length} documented custom ` +
        'property(ies) are defined by no stylesheet and read by none. Either ' +
        'the property was renamed or removed, or PROPERTY_DOCS in ' +
        'custom-properties.js names one that never existed:'
    );
    for (const name of customProperties.absent) console.error(`  - ${name}`);
    failed = true;
  }

  if (customProperties.undocumented.length > 0) {
    console.error(
      `Validation failed: ${customProperties.undocumented.length} custom ` +
        'property(ies) are exposed by the compiled CSS but have no ' +
        'description. Add each to PROPERTY_DOCS in custom-properties.js, or ' +
        'to NOT_PUBLIC with the reason it is not part of the theming API:'
    );
    for (const item of customProperties.undocumented) {
      console.error(`  - ${item}`);
    }
    failed = true;
  }

  if (customProperties.unattributed.length > 0) {
    console.error(
      `Validation failed: ${customProperties.unattributed.length} custom ` +
        'property(ies) belong to no component. Claim each in OWNERS in ' +
        'custom-properties.js, or — if it is a theme token — add it to a ' +
        'tokens/*.yaml source so tokens.json documents it:'
    );
    for (const name of customProperties.unattributed) {
      console.error(`  - ${name}`);
    }
    failed = true;
  }

  // Losing a property is a removal from a public API, so it fails until
  // MIN_PROPERTIES comes down with it. NOT_PUBLIC is the one way to make a
  // property disappear from the manifest, and it used to do so in silence:
  // moving one there printed "Validation passed" and shrank a JSON file
  // nobody diffs. It is now printed on every run and counted here.
  if (!customProperties.skipped) {
    const shrunk = Object.entries(MIN_PROPERTIES)
      .map(([id, floor]) => ({
        id,
        floor,
        actual: customProperties.byComponent[id]?.length ?? 0,
      }))
      .filter(({ floor, actual }) => actual < floor);
    if (shrunk.length > 0) {
      console.error(
        `Validation failed: ${shrunk.length} component(s) publish fewer ` +
          'custom properties than MIN_PROPERTIES in custom-properties.js ' +
          'records. A property left the public API. If that is intended, ' +
          'lower the number in the same commit and say so in the CHANGELOG:'
      );
      for (const { id, floor, actual } of shrunk) {
        console.error(`  - ${id}: ${actual}, was ${floor}`);
      }
      failed = true;
    }

    const floorless = Object.keys(customProperties.byComponent)
      .filter(id => !(id in MIN_PROPERTIES))
      .sort();
    if (floorless.length > 0) {
      console.error(
        `Validation failed: ${floorless.length} component(s) publish custom ` +
          'properties with no entry in MIN_PROPERTIES, so losing one later ' +
          'would go unnoticed. Add each with its current count:'
      );
      for (const id of floorless) {
        console.error(`  - ${id}: ${customProperties.byComponent[id].length}`);
      }
      failed = true;
    }
  }

  const notPublic = Object.entries(NOT_PUBLIC);
  console.log(
    `Custom properties held back from the API (NOT_PUBLIC): ${notPublic.length}`
  );
  for (const [name, reason] of notPublic) {
    console.log(`  - ${name}: ${reason}`);
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
      'Curated HTML check (BEM classes compared against auto-rendered output):'
    );
    for (const w of driftWarnings) console.warn(w);
    console.warn(
      'Review the component-data.js entries above — curated HTML may be stale, and an entry reported as unverifiable has nothing checking it at all.'
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

  // Which published bundles cannot be imported outside a browser.
  const domOnlyBundles = await probeBundleImports();
  if (domOnlyBundles.size > 0) {
    console.log(
      `  ${domOnlyBundles.size} bundle(s) need a DOM at import (flagged importRequiresDom):`
    );
    for (const [bundle, reason] of domOnlyBundles) {
      console.log(`    ${bundle}.js — ${reason}`);
    }
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
    // Storybook's react-docgen auto-generates an import statement for every
    // component, pointing at the package root, which resolves for nobody.
    // buildImportStatement() emits the subpath the tarball actually ships and
    // a binding the bundle actually exports, or nothing at all.
    const validImport = buildImportStatement(name, id);
    if (component.import && !validImport) droppedImportCount++;
    const needsDom =
      Boolean(validImport) && domOnlyBundles.has(importedBundle(validImport));

    // --- Index entry (lightweight) ---
    const summary = getSummary(id, component, data, description);
    const indexEntry = { id, name, summary, description };
    if (validImport) indexEntry.import = validImport;
    // The import line is correct and resolves; evaluating it outside a
    // browser does not. Flagged rather than withheld: the component is
    // published and usable, and an agent needs to know which of the two it
    // is facing (unisdr/undrr-mangrove#1252).
    if (needsDom) indexEntry.importRequiresDom = true;
    indexEntry.docsUrl = docsUrl(id);
    indexEntry.detailsUrl = `${DOCS_BASE}ai-components/${id}.json`;

    if (isReact) {
      indexEntry.requiresReact = true;
    } else {
      indexEntry.vanillaHtml = true;
    }
    if (data?.hydration) indexEntry.hydration = true;

    // The lifecycle is stated, not implied. `vanillaModule` used to be present
    // only when there was one, so "vanillaHtml with no lifecycle module" and
    // "vanillaHtml plus a module" were indistinguishable without probing /js/
    // for a 404 (#1197). It is now always emitted, and `vanillaScripts` names
    // the files to load so nothing has to be guessed from the component id.
    indexEntry.vanillaModule = Boolean(data?.vanillaModule);
    if (data?.vanillaModule) {
      indexEntry.vanillaScripts = modulePaths(data.vanillaModule);
    }

    const componentCustomProperties = customProperties.byComponent[id];
    if (componentCustomProperties?.length) {
      indexEntry.customProperties = componentCustomProperties.length;
    }

    indexEntries.push(indexEntry);

    // --- Full component file ---
    const detail = { name, summary, description };
    if (validImport) detail.import = validImport;
    if (needsDom) {
      detail.importRequiresDom = true;
      detail.importNote =
        'This bundle reads `document` while it loads, so the import above ' +
        'throws "document is not defined" in Node and during server-side ' +
        'rendering. It is correct in a browser and through a bundler. On a ' +
        'server-rendered page, load it from a dynamic import after mount, or ' +
        'use the vanilla module and hydration contract instead.';
    }
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

    // Rendered HTML: prefer auto-rendered from dist/, fall back to curated.
    // `supplementalExamples` are appended to either source: they show markup the
    // component's default render never produces, such as the icon-only buttons
    // beside a labelled CTA, so they add to the published HTML rather than
    // standing in for it and are not compared against the render for drift.
    if (renderedHtml.has(id)) {
      detail.renderedHtml = renderedHtml.get(id);
      detail.renderedHtmlSource = 'auto';
    } else if (data?.examples) {
      detail.renderedHtml = data.examples;
    }
    if (data?.supplementalExamples?.length) {
      detail.renderedHtml = [
        ...(detail.renderedHtml || []),
        ...data.supplementalExamples,
      ];
    }

    // CSS classes used by this component
    if (data?.cssClasses?.length) {
      detail.cssClasses = data.cssClasses;
    }

    // CSS custom properties this component exposes — its theming API. Set
    // these instead of writing rules against the classes above: a class rule
    // of equal specificity replaces what the component draws, while a
    // property is the override point the component was built around.
    if (componentCustomProperties?.length) {
      detail.customProperties = {
        _ai:
          'Restyle the component by setting these, usually on the component ' +
          'or an ancestor — but check `default` first: a property the ' +
          'component itself declares beats an ancestor, so it has to be set ' +
          'on that element instead. type "default" means a plain rule ' +
          'already gives it the value in `default`, and yours replaces it. ' +
          'type "hook" means no unconditional rule defines it: `default` is ' +
          'the fallback it resolves to until a wrapper, an inline style or a ' +
          'prop sets it, and a hook with no `default` has no value at all ' +
          'until you give it one. A value a modifier or a media query ' +
          'declares is never published as `default`, because it is not what ' +
          'the component resolves to at rest. `wrapInRgb: true` means the ' +
          'value is sRGB channels ' +
          '("255 255 255"), not a colour — a hex or a keyword there makes ' +
          'the declaration invalid and it drops silently. These are NOT in ' +
          `${DOCS_BASE}tokens.json, which covers theme tokens only.`,
        properties: componentCustomProperties,
      };
    }

    // Vanilla HTML embed instructions (for syndication components)
    if (data?.vanillaHtmlEmbed) {
      detail.vanillaHtmlEmbed = data.vanillaHtmlEmbed;
    }

    // Vanilla hydration contract (data attributes, events, CDN modules).
    // {{version}} is already resolved: curatedData went through replaceVersion.
    if (data?.hydration) detail.hydration = data.hydration;
    // Plain ES module contract (no React, no hydrate.js), same shape — or
    // `false` when the component has no vanilla lifecycle, so a reader of the
    // detail file alone gets the same answer the index gives (#1197).
    detail.vanillaModule = data?.vanillaModule || false;
    if (data?.vanillaModule) {
      detail.vanillaScripts = modulePaths(data.vanillaModule);
    } else if (data?.vanillaModuleNote) {
      // Why there is none, for a component where the absence is a decision
      // rather than a gap.
      detail.vanillaModuleNote = data.vanillaModuleNote;
    }

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
      'Every entry states its lifecycle outright, so you never have to probe /js/ for a 404: ' +
      "vanillaModule is true when a plain ES module under /js/ drives the behaviour — the entry's " +
      'vanillaScripts then lists the files to load, each one the `file` of an entry in ' +
      'library.vanillaScripts, and the detail file carries the full contract — and false when ' +
      'there is none, either because the component is static presentation (the detail file says why ' +
      'in vanillaModuleNote) or because its behaviour needs React (hydration: true). ' +
      'An `import` line, where present, is the exact line to use and names the package subpath ' +
      `(${pkg.name}/components/Name.js); the package root is not an entry point and resolves on no ` +
      'published version. No `import` line means the component ships in no bundle. ' +
      'importRequiresDom: true means that line reads `document` as it loads: correct in a browser ' +
      'or through a bundler, and it throws in Node and in server-side rendering — the detail file ' +
      'says what to do instead. ' +
      'Each entry has a detailsUrl with full props, rendered HTML examples, and code snippets.',
    library: {
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
      documentation: DOCS_BASE,
      repository: REPO_URL,
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
      customProperties: {
        _note:
          `${customPropertyCount} component-scoped CSS custom properties ` +
          `across ${Object.keys(customProperties.byComponent).length} ` +
          "components. They are a component's theming API and are NOT in " +
          'tokens.json, which documents theme tokens only. Each component ' +
          'that has them lists a count here and the full set, with defaults ' +
          'and descriptions, in its detail JSON.',
        field: 'customProperties',
      },
      releasesUrl: `${DOCS_BASE}releases.json`,
      changelogUrl: `${REPO_BLOB_MAIN}CHANGELOG.md`,
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

  // The count of SCSS-declared global properties is derived from the bundles
  // here and handed to the dictionary, so its `scope.excludes` and the same
  // figure in llms.txt cannot drift apart.
  // null, not 0, when the bundles were not there to count: `globals` is empty
  // on the skipped path, and 0 is an assertion rather than a silence.
  const tokensDict = buildTokensDictionary({
    globalPropertyCount: customProperties.skipped ? null : globalGroupsTotal,
  });
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
- Repository: ${REPO_URL}
- npm: https://www.npmjs.com/package/${pkg.name}
- Release changelog (machine-readable): ${DOCS_BASE}releases.json
- Project changelog (markdown): ${REPO_BLOB_MAIN}CHANGELOG.md
- v2.0 Release notes: ${DOCS_BASE}?path=/docs/getting-started-release-notes-v2-0--docs
- Icons inventory: ${DOCS_BASE}ai-components/components-icons.json
- Theme token dictionary: ${DOCS_BASE}tokens.json (theme tokens only; component custom properties are documented per component)
- Editorial manual (capitalization, punctuation, numbers, abbreviations, italics, spelling, UNDRR terminology, disability inclusive and gender-inclusive language; each rule credited to its United Nations system or UNDRR source in the doc itself): ${DOCS_BASE}llms-editorial-manual.txt

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

This dictionary covers theme tokens only — the --mg-* properties the theme stylesheets define from the tokens/*.yaml sources. Component-scoped custom properties are public API but are not in it. They are in each component's own entry instead: ${customPropertyCount} properties across ${Object.keys(customProperties.byComponent).length} components, under \`customProperties\` in ai-components/{id}.json, each with its type, its resting value and what it does. The index says which components have them and how many. ${globalGroupsTotal} --mg-* properties are in neither list: they are global like a theme token, but declared straight in SCSS rather than generated from tokens/*.yaml, so the dictionary never saw them. ${globalGroupsCountPhrase} — ${globalGroupsSentence}. The dictionary's own \`scope\` field says the same thing.

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

${reactCount} components require React (requiresReact: true in the index). These use D3, Leaflet, or complex state management. Import them from the package subpath, which is what the tarball ships: import { ComponentName } from "@undrr/undrr-mangrove/components/ComponentName.js". The package root is not an entry point — "@undrr/undrr-mangrove" on its own does not resolve on any published version. Each component's index and detail entry carries the exact \`import\` line to use; where one is absent, the component ships in no bundle and there is nothing to import. A component flagged \`importRequiresDom: true\` reads \`document\` as it loads: that import line is correct in a browser and through a bundler, and throws "document is not defined" if it is evaluated in Node or during server-side rendering — its detail file says what to do instead.

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

The utilities.json file lists ~${utilityClassCount} utility classes grouped by category: layout containers, grid, responsive display, text utilities, accessibility, background colors, text colors, font sizes, animations, embed containers, interactive controls (switches and icon-only buttons), and show-more patterns. All use the mg- prefix.

### Releases and changelog

To inspect changes between versions, tags, and pre-releases without parsing raw git commits:

- **Machine-readable releases endpoint**: ${DOCS_BASE}releases.json
  Contains structured changelog objects for every release (version, release date, tag, PR references, categorization: Features, Bug fixes, Tooling, Security) plus component-level changelogs.
- **Repository changelog**: ${REPO_BLOB_MAIN}CHANGELOG.md
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

\`tokens.json\` is a THEME token dictionary. It lists the \`--mg-*\` properties the theme stylesheets define from the YAML sources, and nothing else. A component's own properties live in its manifest entry instead, under \`customProperties\` in \`ai-components/{id}.json\` — ${customPropertyCount} of them across ${Object.keys(customProperties.byComponent).length} components, each with what it does and the value it holds at rest. They come in two kinds: \`type: "default"\`, which a plain, unconditional rule already gives a value (\`--mg-empty-state-*\`, \`--mg-notice-*\`, \`--mg-status-label-*\`, \`--mg-tab-*\`), and \`type: "hook"\`, which nothing unconditional defines — either no rule at all, or only a modifier or a media query — so it holds its fallback until a wrapper, an inline style or a React prop sets it (\`--mg-switch-track-*\`, \`--mg-switch-size\`, \`--mg-card-border\`, \`--mg-icon-fg\`, \`--mg-cta-bg\`, \`--mg-legend-tick-pos\`, \`--mg-on-this-page-nav-offset\`, \`--mg-tree-guide-offset\`). A record with \`wrapInRgb: true\` takes sRGB channels (\`255 255 255\`) rather than a colour, the same way tokens.json marks \`format: "srgb-channels"\`; a hex or a keyword there makes the declaration invalid and it drops with no warning. Restyle a component by setting these, not by writing rules against its classes: a class rule of equal specificity replaces what the component draws, and several components build their geometry on a property whose value your rule would then be fighting.

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

The component index is not the whole library. Three things live elsewhere, and searching only the index will tell you they do not exist:

- **CSS utility classes are in \`utilities.json\`, not the index.** Some patterns ship as utility classes with no component entry at all — the accordion (\`.mg-accordion\`) is one, and the data-table modifiers (\`.mg-table--data\` and the \`.mg-table__th--sortable\` / \`--sticky\` / \`.mg-table__td--numeric\` family) are documented there rather than on the Table entry. Fetch \`utilities.json\` before concluding Mangrove has no accordion or no sortable table.
- **There is no IconButton component, and there are two icon-only button classes.** \`.mg-button--icon\` is a shape modifier of \`.mg-button\`: use \`.mg-button.mg-button-{variant}.mg-button--icon\` whenever the button should carry a brand colour, because the foreground, typography and focus ring come from \`.mg-button\`. \`.mg-icon-button\` is a separate standalone ghost primitive for dismiss, close and copy controls on an existing surface; it carries no variant colours and takes no \`.mg-button-*\` class. Both are in \`utilities.json\` and on the Buttons entry.
- **Component custom properties are not in \`tokens.json\`.** It is a theme token dictionary. A component's own properties are in its \`ai-components/{id}.json\` entry, under \`customProperties\`; see the "Design tokens" section above.

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
  // Write llms-editorial-manual.txt (see editorial-manual.js)
  // -------------------------------------------------------------------------

  const llmsEditorialManualTxt = buildEditorialManualTxt(
    fs.readFileSync(
      path.resolve(process.cwd(), 'docs/EDITORIAL-MANUAL.md'),
      'utf8'
    ),
    DOCS_BASE
  );

  fs.writeFileSync(
    path.join(buildDir, 'llms-editorial-manual.txt'),
    llmsEditorialManualTxt
  );

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
        repository: REPO_URL,
        npm: `https://www.npmjs.com/package/${pkg.name}`,
        releases: `${DOCS_BASE}releases.json`,
        changelog: `${REPO_BLOB_MAIN}CHANGELOG.md`,
        releaseNotesV2: `${DOCS_BASE}?path=/docs/getting-started-release-notes-v2-0--docs`,
        componentIndex: `${DOCS_BASE}ai-components/index.json`,
        utilities: `${DOCS_BASE}ai-components/utilities.json`,
        tokens: `${DOCS_BASE}tokens.json`,
        editorialManual: `${DOCS_BASE}llms-editorial-manual.txt`,
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
      customProperties: {
        _note:
          'A component is restyled by setting its CSS custom properties, not ' +
          'by overriding its class rules. Every component that exposes any ' +
          'lists them under `customProperties` in its detail JSON, each with ' +
          'its type ("default" or "hook"), its resting value and what it ' +
          'does. These are component-scoped and are NOT in tokens.json, ' +
          'which covers theme tokens only — see its `scope` field.',
        total: customPropertyCount,
        components: Object.keys(customProperties.byComponent).length,
        componentIndex: `${DOCS_BASE}ai-components/index.json`,
      },
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
    `  ${path.join(buildDir, 'llms-editorial-manual.txt')} (editorial manual sub-manifest)`
  );
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
      `  ${droppedImportCount} Storybook-generated import(s) removed (no published bundle exports them)`
    );
  }
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
