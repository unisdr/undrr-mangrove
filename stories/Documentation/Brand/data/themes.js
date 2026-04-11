/**
 * @file themes.js
 * @description Theme color palettes for brand pages. Values sourced from
 * _variables.scss and _variables-{theme}.scss.
 *
 * Update these when theme tokens change (brand refreshes).
 */

const CDN = 'https://assets.undrr.org/static/logos';

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
    colors: {
      brand: [
        { color: '#004f91', name: 'Primary blue', usage: 'Headers, navigation, brand identity' },
        { color: '#004f91', name: 'Interactive', usage: 'Links, buttons, clickable elements' },
        { color: '#3372a7', name: 'Interactive hover', usage: 'Hovered links and buttons' },
        { color: '#004f91', name: 'Hero background', usage: 'Hero banners and branded sections' },
      ],
      accent: [
        { color: '#c10920', name: 'Red', usage: 'Alerts, emphasis, Sendai markers' },
        { color: '#eb752a', name: 'Orange', usage: 'Secondary accents, highlights' },
        { color: '#f4e496', name: 'Yellow', usage: 'Tags, soft highlights, warnings' },
        { color: '#0a6969', name: 'Teal', usage: 'Secondary palette, accent blocks' },
      ],
      neutral: [
        { color: '#1a1a1a', name: 'Body text', usage: 'Primary text, headings' },
        { color: '#666666', name: 'Secondary text', usage: 'Descriptions, metadata, captions' },
        { color: '#f2f2f2', name: 'Background light', usage: 'Section backgrounds, cards' },
        { color: '#ffffff', name: 'White', usage: 'Page background, card surfaces' },
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
    colors: {
      brand: [
        { color: '#0a6969', name: 'Primary teal', usage: 'Headers, navigation, brand identity' },
        { color: '#0a6969', name: 'Interactive', usage: 'Links, buttons, clickable elements' },
        { color: '#0a6969', name: 'Interactive hover', usage: 'Hovered links and buttons' },
        { color: '#0a6969', name: 'Hero background', usage: 'Hero banners and branded sections' },
      ],
      accent: [
        { color: '#eb752a', name: 'Orange', usage: 'Button hover, secondary actions' },
        { color: '#c10920', name: 'Red', usage: 'Alerts, emphasis' },
        { color: '#f4e496', name: 'Yellow', usage: 'Tags, soft highlights' },
        { color: '#004f91', name: 'Blue', usage: 'Accent blocks, secondary palette' },
      ],
      neutral: [
        { color: '#1a1a1a', name: 'Body text', usage: 'Primary text, headings' },
        { color: '#666666', name: 'Secondary text', usage: 'Descriptions, metadata, captions' },
        { color: '#f2f2f2', name: 'Background light', usage: 'Section backgrounds, cards' },
        { color: '#ffffff', name: 'White', usage: 'Page background, card surfaces' },
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
    //      srcWhite: `${CDN}/mcr2030/mcr2030-logo-white.svg`,  // if a white variant exists
    //      alt: 'MCR2030 logo',
    //      variants: [
    //        { label: 'Logo (SVG)', url: `${CDN}/mcr2030/mcr2030-logo.svg` },
    //      ],
    //    }
    logo: null,
    colors: {
      brand: [
        { color: '#591a61', name: 'Primary purple', usage: 'Headers, navigation, brand identity' },
        { color: '#591a61', name: 'Interactive', usage: 'Links, buttons, clickable elements' },
        { color: '#591a61', name: 'Interactive hover', usage: 'Hovered links and buttons' },
        { color: '#591a61', name: 'Hero background', usage: 'Hero banners and branded sections' },
      ],
      accent: [
        { color: '#eb752a', name: 'Orange', usage: 'Secondary actions, highlights' },
        { color: '#c10920', name: 'Red', usage: 'Alerts, emphasis' },
        { color: '#f4e496', name: 'Yellow', usage: 'Tags, soft highlights' },
        { color: '#004f91', name: 'Blue', usage: 'Accent blocks' },
      ],
      neutral: [
        { color: '#1a1a1a', name: 'Body text', usage: 'Primary text, headings' },
        { color: '#666666', name: 'Secondary text', usage: 'Descriptions, metadata, captions' },
        { color: '#f2f2f2', name: 'Background light', usage: 'Section backgrounds, cards' },
        { color: '#ffffff', name: 'White', usage: 'Page background, card surfaces' },
      ],
    },
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
    colors: {
      brand: [
        { color: '#0f78bf', name: 'Primary blue', usage: 'Headers, navigation, brand identity' },
        { color: '#0f78bf', name: 'Interactive', usage: 'Links, buttons, clickable elements' },
        { color: '#0f78bf', name: 'Interactive hover', usage: 'Hovered links and buttons' },
        { color: '#0f78bf', name: 'Hero background', usage: 'Hero banners and branded sections' },
      ],
      accent: [
        { color: '#eb752a', name: 'Orange', usage: 'Secondary actions, highlights' },
        { color: '#c10920', name: 'Red', usage: 'Alerts, emphasis' },
        { color: '#f4e496', name: 'Yellow', usage: 'Tags, soft highlights' },
        { color: '#0a6969', name: 'Teal', usage: 'Accent blocks' },
      ],
      neutral: [
        { color: '#1a1a1a', name: 'Body text', usage: 'Primary text, headings' },
        { color: '#666666', name: 'Secondary text', usage: 'Descriptions, metadata, captions' },
        { color: '#f2f2f2', name: 'Background light', usage: 'Section backgrounds, cards' },
        { color: '#ffffff', name: 'White', usage: 'Page background, card surfaces' },
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
    colors: {
      brand: [
        { color: '#132e48', name: 'Primary navy', usage: 'Headers, navigation, brand identity' },
        { color: '#132e48', name: 'Interactive', usage: 'Links, buttons, clickable elements' },
        { color: '#132e48', name: 'Interactive hover', usage: 'Hovered links and buttons' },
        { color: '#132e48', name: 'Hero background', usage: 'Hero banners and branded sections' },
      ],
      accent: [
        { color: '#2196f3', name: 'Bright blue', usage: 'Accents, highlights, data viz' },
        { color: '#eb752a', name: 'Orange', usage: 'Secondary actions' },
        { color: '#c10920', name: 'Red', usage: 'Alerts, emphasis' },
        { color: '#f4e496', name: 'Yellow', usage: 'Tags, soft highlights' },
      ],
      neutral: [
        { color: '#1a1a1a', name: 'Body text', usage: 'Primary text, headings' },
        { color: '#666666', name: 'Secondary text', usage: 'Descriptions, metadata, captions' },
        { color: '#f2f2f2', name: 'Background light', usage: 'Section backgrounds, cards' },
        { color: '#ffffff', name: 'White', usage: 'Page background, card surfaces' },
      ],
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
