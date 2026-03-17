/**
 * @file css-utilities.js
 * @source manual
 *
 * Curated inventory of CSS utility classes provided by UNDRR Mangrove.
 * Used by generate-ai-manifest.js to produce ai-components/utilities.json.
 *
 * Maintenance: update this file when adding, renaming, or removing utility
 * classes in _utility.scss, container.scss, grid.scss, or the Utilities/
 * component SCSS files.
 */

import { CDN_BASE } from './constants.js';

const colorShades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

function bgClass(suffix, desc) {
  return { class: `mg-u-background-color--${suffix}`, description: desc };
}

function textClass(suffix, desc) {
  return { class: `mg-u-color--${suffix}`, description: desc };
}

function colorScale(prefix, name) {
  return colorShades.map(s => ({
    class: `mg-u-background-color--${prefix}-${s}`,
    description: `${name} ${s} background`,
  }));
}

function textColorScale(prefix, name) {
  return colorShades.map(s => ({
    class: `mg-u-color--${prefix}-${s}`,
    description: `${name} ${s} text color`,
  }));
}

export default {
  _description:
    'CSS utility classes provided by UNDRR Mangrove. Include the Mangrove CSS bundle to use these. All classes use the mg- prefix and follow BEM conventions.',
  cdnBaseUrl: `${CDN_BASE}/dist/css/`,
  categories: [
    // ---------------------------------------------------------------
    // 1. Layout
    // ---------------------------------------------------------------
    {
      name: 'Layout',
      description:
        'Centered responsive containers with breakpoint-driven max-widths. Breakpoints: 480px (mobile), 900px (tablet), 1164px (desktop), 1440px (wide).',
      classes: [
        {
          class: 'mg-container',
          description:
            'Centered responsive container. Horizontal padding 1rem. Max-width scales through breakpoints: 480px, 900px, 1164px, 1440px.',
          usage: '<div class="mg-container">Page content</div>',
        },
        {
          class: 'mg-container--slim',
          description:
            'Container that stops at the desktop breakpoint (1164px) and does not expand to 1440px wide.',
        },
        {
          class: 'mg-container--padded',
          description: 'Adds 2rem vertical padding (top and bottom) to the container.',
          usage:
            '<div class="mg-container mg-container--padded">Padded content</div>',
        },
        {
          class: 'mg-container--spacer',
          description:
            'Adds consistent vertical spacing (1.5rem) between direct children. Intelligently removes spacing between hero sections and background blocks.',
          usage:
            '<div class="mg-container mg-container--spacer">\n  <section>Block 1</section>\n  <section>Block 2</section>\n</div>',
        },
        {
          class: 'mg-container-full-width',
          description:
            'Makes an element break out of its container to span the full viewport width while preserving document flow. Uses CSS Grid and calc(50% - 50vw) margin trick. RTL-safe.',
          usage:
            '<div class="mg-container-full-width" style="background-color: #e6edf4;">\n  <div class="mg-container">Full-bleed section content</div>\n</div>',
        },
      ],
    },

    // ---------------------------------------------------------------
    // 2. Grid
    // ---------------------------------------------------------------
    {
      name: 'Grid',
      description:
        'Responsive grid system using CSS Grid (with flexbox fallback). Column gap: 2rem. Mobile: single column. Tablet (900px+): specified columns. Desktop (1164px+): 4-6 column layouts expand.',
      classes: [
        {
          class: 'mg-grid',
          description:
            'Base grid container. Auto-layout: children share equal width. On mobile, wraps to 2-column layout.',
          usage:
            '<div class="mg-grid">\n  <div>Auto column 1</div>\n  <div>Auto column 2</div>\n  <div>Auto column 3</div>\n</div>',
        },
        {
          class: 'mg-grid__col-1',
          description: 'Single-column grid.',
        },
        {
          class: 'mg-grid__col-2',
          description: 'Two-column grid at tablet and above. Single column on mobile.',
          usage:
            '<div class="mg-grid mg-grid__col-2">\n  <div>Column 1</div>\n  <div>Column 2</div>\n</div>',
        },
        {
          class: 'mg-grid__col-3',
          description: 'Three-column grid at tablet and above.',
          usage:
            '<div class="mg-grid mg-grid__col-3">\n  <div>Column 1</div>\n  <div>Column 2</div>\n  <div>Column 3</div>\n</div>',
        },
        {
          class: 'mg-grid__col-4',
          description:
            'Four-column grid. Tablet: 2 columns. Desktop (1164px+): 4 columns.',
        },
        {
          class: 'mg-grid__col-5',
          description:
            'Five-column grid. Tablet: 3 columns. Desktop (1164px+): 5 columns.',
        },
        {
          class: 'mg-grid__col-6',
          description:
            'Six-column grid. Tablet: 3 columns. Desktop (1164px+): 6 columns.',
        },
        {
          class: 'mg-grid__col--span-2',
          description: 'Child element spans 2 columns.',
        },
        {
          class: 'mg-grid__col--span-3',
          description: 'Child element spans 3 columns.',
        },
        {
          class: 'mg-grid__col--span-4',
          description: 'Child element spans 4 columns.',
        },
        {
          class: 'mg-grid__col--span-5',
          description: 'Child element spans 5 columns.',
        },
        {
          class: 'mg-grid__col--span-6',
          description: 'Child element spans 6 columns.',
        },
        {
          class: 'mg-grid__col--span-all',
          description: 'Child element spans the full width of the grid (grid-column: 1 / -1).',
          usage:
            '<div class="mg-grid mg-grid__col-3">\n  <div class="mg-grid__col--span-all">Full-width row</div>\n  <div>Col 1</div>\n  <div>Col 2</div>\n  <div>Col 3</div>\n</div>',
        },
        {
          class: 'mg-grid__row--span-2',
          description: 'Child element spans 2 rows.',
        },
        {
          class: 'mg-grid__row--span-3',
          description: 'Child element spans 3 rows.',
        },
        {
          class: 'mg-grid__row--span-4',
          description: 'Child element spans 4 rows.',
        },
        {
          class: 'mg-grid__row--span-5',
          description: 'Child element spans 5 rows.',
        },
        {
          class: 'mg-grid__row--span-6',
          description: 'Child element spans 6 rows.',
        },
        {
          class: 'mg-grid__row--span-all',
          description: 'Child element spans the full height of the grid.',
        },
      ],
    },

    // ---------------------------------------------------------------
    // 3. Responsive display
    // ---------------------------------------------------------------
    {
      name: 'Responsive display',
      description: 'Toggle element visibility based on viewport width. Breakpoint: 900px (tablet).',
      classes: [
        {
          class: 'mg-u-responsive--show-large',
          description:
            'Hidden on mobile, visible (display: block) on tablet and above (900px+).',
        },
        {
          class: 'mg-u-responsive--show-small',
          description:
            'Visible on mobile, hidden (display: none) on tablet and above (900px+).',
        },
      ],
    },

    // ---------------------------------------------------------------
    // 4. Text utilities
    // ---------------------------------------------------------------
    {
      name: 'Text utilities',
      description: 'Text wrapping and formatting helpers.',
      classes: [
        {
          class: 'mg-u-text-wrap-balanced',
          description:
            'Applies CSS text-wrap: balance for more even line breaks in headings.',
          usage: '<h2 class="mg-u-text-wrap-balanced">A heading that wraps evenly across lines</h2>',
        },
        {
          class: 'mg-u-text-wrap-pretty',
          description: 'Applies CSS text-wrap: pretty to optimize wrapping for readability.',
        },
        {
          class: 'mg-u-comma-between',
          description:
            'Adds commas between direct child elements using CSS ::after pseudo-elements. Useful for inline lists.',
          usage:
            '<div class="mg-u-comma-between">\n  <span>Item 1</span>\n  <span>Item 2</span>\n  <span>Item 3</span>\n</div>',
        },
      ],
    },

    // ---------------------------------------------------------------
    // 5. Accessibility
    // ---------------------------------------------------------------
    {
      name: 'Accessibility',
      description: 'Helpers for assistive technology.',
      classes: [
        {
          class: 'mg-u-sr-only',
          description:
            'Visually hidden but accessible to screen readers. Uses position: absolute, clip-path: inset(0), width/height: 1px.',
          usage:
            '<span class="mg-u-sr-only">Description for screen readers only</span>',
        },
      ],
    },

    // ---------------------------------------------------------------
    // 6. Overflow and sizing
    // ---------------------------------------------------------------
    {
      name: 'Overflow and sizing',
      description: 'Overflow and sizing control.',
      classes: [
        {
          class: 'mg-u-overflow-hidden',
          description: 'Sets overflow: hidden on the element.',
        },
        {
          class: 'mg-u-expand-to-size',
          description:
            'Responsive width: calc(100% - 1rem) on mobile, calc(100% - 3rem) at tablet+. Centered with auto margins.',
        },
      ],
    },

    // ---------------------------------------------------------------
    // 7. Background colors
    // ---------------------------------------------------------------
    {
      name: 'Background colors',
      description:
        'Background color utilities following the Mangrove color system. Pattern: mg-u-background-color--{color-shade}. Colors are theme-overridable via SCSS variables with !default flags.',
      classes: [
        bgClass('white', 'White background'),
        bgClass('black', 'Black background'),
        ...colorScale('blue', 'Blue'),
        ...colorScale('orange', 'Orange'),
        ...colorScale('red', 'Red'),
        { class: 'mg-u-background-color--neutral-0', description: 'Neutral 0 (white) background' },
        { class: 'mg-u-background-color--neutral-25', description: 'Neutral 25 background' },
        ...colorShades.filter(s => s >= 50).map(s => ({
          class: `mg-u-background-color--neutral-${s}`,
          description: `Neutral ${s} background`,
        })),
        bgClass('accent-100', 'Accent 100 background'),
        bgClass('accent-200', 'Accent 200 background'),
        bgClass('accent-300', 'Accent 300 background'),
        bgClass('accent-400', 'Accent 400 background'),
        bgClass('sendai-red', 'Sendai Framework red background'),
        bgClass('sendai-orange', 'Sendai Framework orange background'),
        bgClass('sendai-purple', 'Sendai Framework purple background'),
        bgClass('sendai-turquoise', 'Sendai Framework turquoise background'),
        bgClass('interactive', 'Interactive color background (default: blue-900)'),
        bgClass('interactive-active', 'Interactive active color background (default: blue-700)'),
      ],
    },

    // ---------------------------------------------------------------
    // 8. Text colors
    // ---------------------------------------------------------------
    {
      name: 'Text colors',
      description:
        'Text color utilities matching the background color system. Pattern: mg-u-color--{color-shade}.',
      classes: [
        textClass('white', 'White text'),
        textClass('black', 'Black text'),
        ...textColorScale('blue', 'Blue'),
        ...textColorScale('orange', 'Orange'),
        ...textColorScale('red', 'Red'),
        { class: 'mg-u-color--neutral-0', description: 'Neutral 0 text color' },
        ...colorShades.filter(s => s >= 50).map(s => ({
          class: `mg-u-color--neutral-${s}`,
          description: `Neutral ${s} text color`,
        })),
        textClass('accent-100', 'Accent 100 text color'),
        textClass('accent-200', 'Accent 200 text color'),
        textClass('accent-300', 'Accent 300 text color'),
        textClass('accent-400', 'Accent 400 text color'),
        textClass('sendai-red', 'Sendai Framework red text'),
        textClass('sendai-orange', 'Sendai Framework orange text'),
        textClass('sendai-purple', 'Sendai Framework purple text'),
        textClass('sendai-turquoise', 'Sendai Framework turquoise text'),
        textClass('interactive', 'Interactive color text (default: blue-900)'),
        textClass('interactive-active', 'Interactive active color text (default: blue-700)'),
      ],
    },

    // ---------------------------------------------------------------
    // 9. Font sizes
    // ---------------------------------------------------------------
    {
      name: 'Font sizes',
      description:
        'Responsive font size utilities. Sizes 400+ scale up at the tablet breakpoint (900px). Includes language-specific line-height overrides for Burmese (:lang(my)) and Arabic (:lang(ar)).',
      classes: [
        {
          class: 'mg-u-font-size-150',
          description: '1.125rem. Line-height: 1.5em. No responsive scaling.',
        },
        {
          class: 'mg-u-font-size-200',
          description: '1.25rem. Line-height: 1.5em. No responsive scaling.',
        },
        {
          class: 'mg-u-font-size-250',
          description: '1.4rem. Line-height: 1.5em. No responsive scaling.',
        },
        {
          class: 'mg-u-font-size-300',
          description: '1.6rem. Line-height: 1.5em. No responsive scaling.',
        },
        {
          class: 'mg-u-font-size-400',
          description:
            '1.6rem mobile, 1.8rem at 900px+. Line-height: 1.5em. Burmese: 1.7.',
        },
        {
          class: 'mg-u-font-size-500',
          description:
            '1.8rem mobile, 2.3rem at 900px+. Line-height: 1.25em. Burmese: 1.7.',
        },
        {
          class: 'mg-u-font-size-600',
          description:
            '2.3rem mobile, 3.2rem at 900px+. Line-height: 1.25em. Burmese: 1.7, Arabic: 1.4.',
        },
        {
          class: 'mg-u-font-size-800',
          description:
            '3.2rem mobile, 3.6rem at 900px+. Line-height: 1.25em. Burmese: 1.7, Arabic: 1.4.',
        },
        {
          class: 'mg-u-font-size-900',
          description:
            '3.6rem mobile, 4rem at 900px+. Line-height: 1.25em. Burmese: 1.7, Arabic: 1.4.',
        },
      ],
    },

    // ---------------------------------------------------------------
    // 10. Animations
    // ---------------------------------------------------------------
    {
      name: 'Animations',
      description:
        'Viewport-triggered animations. Add data-viewport="true" to the element, then apply an animation class. The .inviewport class is added when the element enters the viewport.',
      classes: [
        {
          class: 'scale-up',
          description:
            'Scale animation on viewport enter. Element starts scaled down and scales to 1.',
          usage: '<div class="scale-up" data-viewport="true">Animates on scroll</div>',
        },
        {
          class: 'opacity-only',
          description:
            'Fade-in animation on viewport enter. Element starts transparent and fades to full opacity.',
          usage:
            '<div class="opacity-only" data-viewport="true">Fades in on scroll</div>',
        },
        {
          class: 'delay-1',
          description: 'Transition delay of 0.1s.',
        },
        {
          class: 'delay-2',
          description: 'Transition delay of 0.2s.',
        },
        {
          class: 'delay-3',
          description: 'Transition delay of 0.3s.',
        },
        {
          class: 'delay-4',
          description: 'Transition delay of 0.4s.',
        },
        {
          class: 'delay-5',
          description: 'Transition delay of 0.5s.',
        },
      ],
    },

    // ---------------------------------------------------------------
    // 11. Embed containers
    // ---------------------------------------------------------------
    {
      name: 'Embed containers',
      description:
        'Responsive aspect-ratio wrappers for iframes, videos, and embeds. Uses aspect-ratio with padding-bottom fallback.',
      classes: [
        {
          class: 'mg-embed-container',
          description: 'Default 16:9 responsive embed wrapper.',
          usage:
            '<div class="mg-embed-container">\n  <iframe src="https://www.youtube.com/embed/VIDEO_ID" allowfullscreen></iframe>\n</div>',
        },
        {
          class: 'mg-embed-container--4x3',
          description: '4:3 aspect ratio embed wrapper.',
        },
        {
          class: 'mg-embed-container--1x1',
          description: '1:1 (square) aspect ratio embed wrapper.',
        },
        {
          class: 'mg-embed-container--21x9',
          description: '21:9 (ultrawide) aspect ratio embed wrapper.',
        },
      ],
    },

    // ---------------------------------------------------------------
    // 12. Show more / collapse
    // ---------------------------------------------------------------
    {
      name: 'Show more',
      description:
        'Collapse long content behind a fade. Requires the mg-show-more vanilla JS utility for toggle behavior. Customizable height via the --mg-show-more-height CSS variable (default: 200px).',
      classes: [
        {
          class: 'mg-show-more--collapsed',
          description:
            'Collapses the element to --mg-show-more-height (default 200px) with a gradient fade mask at the bottom.',
          usage:
            '<div class="mg-show-more--collapsed" data-mg-show-more>\n  <p>Long content that will be collapsed...</p>\n</div>\n<button class="mg-show-more--button">Show more</button>',
        },
        {
          class: 'mg-show-more--button',
          description: 'Styled toggle button for the show-more pattern.',
        },
      ],
    },
  ],
};
