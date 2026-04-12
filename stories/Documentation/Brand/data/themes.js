/**
 * @file themes.js
 * @description Theme metadata and logo URLs for brand pages.
 * Color values are read live from the compiled CSS via getComputedStyle
 * probes in ColorSwatch — no hardcoded hex values to maintain.
 */

const CDN = 'https://assets.undrr.org/static/logos';

/**
 * CSS class → property mappings for probing theme colors from the DOM.
 * Each entry becomes a ColorSwatch on the brand identity page.
 * The resolved color comes from the active Storybook theme's compiled CSS.
 */
export const colorProbes = {
  brand: [
    { probe: 'mg-hero__overlay', property: 'background-color', name: 'Hero / primary', usage: 'Hero banners, branded sections' },
    { probe: 'mg-button mg-button-primary', property: 'background-color', name: 'Button primary', usage: 'Primary action buttons' },
    { probe: 'mg-tag', property: 'background-color', name: 'Tag', usage: 'Content tags and labels' },
    { probe: 'mg-tag mg-tag--secondary', property: 'background-color', name: 'Tag secondary', usage: 'Secondary tags' },
  ],
  accent: [
    { probe: 'mg-tag mg-tag--accent', property: 'background-color', name: 'Accent', usage: 'Accent highlights and callouts' },
  ],
  neutral: [
    { color: '#1a1a1a', name: 'Body text', usage: 'Primary text, headings' },
    { color: '#666666', name: 'Secondary text', usage: 'Descriptions, metadata, captions' },
    { color: '#f2f2f2', name: 'Background light', usage: 'Section backgrounds, cards' },
    { color: '#ffffff', name: 'White', usage: 'Page background, card surfaces' },
  ],
};

export const themes = {
  'Global UNDRR Theme': {
    id: 'undrr',
    name: 'UNDRR',
    url: 'undrr.org',
    tagline: 'Global hub for disaster risk reduction',
    logo: {
      src: `${CDN}/undrr/undrr-logo-blue.svg`,
      srcWhite: `${CDN}/undrr/undrr-logo-white.svg`,
      alt: 'UNDRR logo',
      variants: [
        { label: 'Blue (SVG)', url: `${CDN}/undrr/undrr-logo-blue.svg` },
        { label: 'White (SVG)', url: `${CDN}/undrr/undrr-logo-white.svg` },
        { label: 'Square (SVG)', url: `${CDN}/undrr/undrr-logo-square-blue.svg` },
      ],
    },
  },
  'PreventionWeb Theme': {
    id: 'preventionweb',
    name: 'PreventionWeb',
    url: 'preventionweb.net',
    tagline: 'Knowledge platform for disaster risk reduction',
    logo: {
      src: `${CDN}/pw/pw-logo.svg`,
      srcWhite: `${CDN}/pw/pw-logo.svg`,
      alt: 'PreventionWeb logo',
      variants: [
        { label: 'Logo (SVG)', url: `${CDN}/pw/pw-logo.svg` },
      ],
    },
  },
  'MCR2030 Theme': {
    id: 'mcr2030',
    name: 'MCR2030',
    url: 'mcr2030.undrr.org',
    tagline: 'Making Cities Resilient 2030',
    // To add the MCR2030 logo:
    // 1. Upload the SVG to the CDN at: logos/mcr2030/mcr2030-logo.svg
    // 2. Replace `null` below with:
    //    {
    //      src: `${CDN}/mcr2030/mcr2030-logo.svg`,
    //      srcWhite: `${CDN}/mcr2030/mcr2030-logo-white.svg`,
    //      alt: 'MCR2030 logo',
    //      variants: [
    //        { label: 'Logo (SVG)', url: `${CDN}/mcr2030/mcr2030-logo.svg` },
    //      ],
    //    }
    logo: null,
  },
  'IRP Theme': {
    id: 'irp',
    name: 'IRP',
    url: 'recovery.preventionweb.net',
    tagline: 'International Recovery Platform',
    logo: {
      src: `${CDN}/irp/irp-logo.svg`,
      srcWhite: `${CDN}/irp/irp-logo.svg`,
      alt: 'IRP logo',
      variants: [
        { label: 'Logo (SVG)', url: `${CDN}/irp/irp-logo.svg` },
      ],
    },
  },
  'DELTA Resilience Theme': {
    id: 'delta',
    name: 'DELTA Resilience',
    url: 'deltaresilience.org',
    tagline: 'Data-driven resilience assessment',
    logo: {
      src: require('../../../assets/images/delta-logo-placeholder.svg'),
      alt: 'DELTA Resilience logo (placeholder)',
      variants: [],
    },
  },
};

/** Map legacy theme names to their standard counterpart */
const legacyMap = {
  'Global UNDRR Theme (legacy 10px)': 'Global UNDRR Theme',
  'PreventionWeb Theme (legacy 10px)': 'PreventionWeb Theme',
  'IRP Theme (legacy 10px)': 'IRP Theme',
  'MCR2030 Theme (legacy 10px)': 'MCR2030 Theme',
};

/**
 * Get theme data for the given theme name.
 * Falls back to UNDRR if theme is unknown or legacy.
 */
export function getTheme(themeName) {
  const resolved = legacyMap[themeName] || themeName;
  return themes[resolved] || themes['Global UNDRR Theme'];
}
