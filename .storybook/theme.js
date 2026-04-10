import { create } from 'storybook/theming';

/**
 * Mangrove-branded Storybook theme
 *
 * Color values sourced from stories/assets/scss/_variables.scss
 * so the Storybook chrome matches the component library itself.
 */
export default create({
  base: 'light',

  // Brand
  brandTitle: 'UNDRR Mangrove',
  brandUrl: 'https://unisdr.github.io/undrr-mangrove',
  brandImage: './images/undrr-logo-square-blue.svg',
  brandTarget: '_self',

  // Accent colors ($mg-color-blue-900 / $mg-color-blue-700)
  colorPrimary: '#004f91',
  colorSecondary: '#3372a7',

  // UI chrome
  appBg: '#e6edf4', // $mg-color-blue-50 — sidebar background
  appContentBg: '#ffffff',
  appPreviewBg: '#ffffff',
  appBorderColor: '#ccdce9', // $mg-color-blue-100
  appBorderRadius: 4,

  // Typography ($mg-font-family)
  fontBase: '"Roboto", "Helvetica Neue", Arial, sans-serif',
  fontCode: '"Roboto Mono", "SFMono-Regular", Consolas, monospace',
  textColor: '#1a1a1a', // $mg-color-neutral-800
  textInverseColor: '#ffffff',
  textMutedColor: '#666666', // $mg-color-neutral-500

  // Toolbar
  barTextColor: '#4d4d4d', // $mg-color-neutral-600
  barHoverColor: '#004f91', // $mg-color-blue-900
  barSelectedColor: '#004f91', // $mg-color-blue-900
  barBg: '#ffffff',

  // Form inputs
  inputBg: '#ffffff',
  inputBorder: '#ccdce9', // $mg-color-blue-100
  inputTextColor: '#1a1a1a', // $mg-color-neutral-800
  inputBorderRadius: 4,

  // Booleans
  booleanBg: '#e6edf4', // $mg-color-blue-50
  booleanSelectedBg: '#004f91', // $mg-color-blue-900

  // Grid
  gridCellSize: 8,
});
