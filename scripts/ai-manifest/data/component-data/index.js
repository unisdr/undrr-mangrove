/**
 * component-data/index.js
 *
 * Merges per-category component data files into a single object keyed
 * by Storybook component ID. Each category file exports a default
 * object with one or more component entries.
 *
 * To add a new component: find the right category file and add the entry
 * there. To add a new category: create a .js file, export default an
 * object, and import it here.
 *
 * Each entry can have:
 *   vanillaHtml     {boolean}  true if the component works as static HTML/CSS
 *   requiresReact   {boolean}  true if the component needs React to function
 *   reactNote       {string}   why React is required
 *   description     {string}   fallback description when Storybook manifest has none
 *   doNotModify     {string}   warning that markup must not be simplified (branding)
 *   examples        {Array<{name: string, html: string}>}  rendered HTML snippets
 *   cssClasses      {string[]} BEM classes the component uses
 *   vanillaHtmlEmbed {object}  embed instructions (for syndication components)
 */

import layout from './layout.js';
import cards from './cards.js';
import buttons from './buttons.js';
import tags from './tags.js';
import typography from './typography.js';
import table from './table.js';
import tabs from './tabs.js';
import callout from './callout.js';
import highlightBox from './highlight-box.js';
import quoteHighlight from './quote-highlight.js';
import hero from './hero.js';
import footer from './footer.js';
import pageHeader from './page-header.js';
import navigation from './navigation.js';
import forms from './forms.js';
import cta from './cta.js';
import images from './images.js';
import logos from './logos.js';
import icons from './icons.js';
import utilities from './utilities.js';
import pageTemplates from './page-templates.js';
import reactOnly from './react-only.js';

// Merge all sources with duplicate key detection.
// Spread syntax silently overwrites duplicates, so we check explicitly.
const sources = [
  layout, cards, buttons, tags, typography, table, tabs, callout,
  highlightBox, quoteHighlight, hero, footer, pageHeader, navigation,
  forms, cta, images, logos, icons, utilities, pageTemplates, reactOnly,
];

const merged = {};
for (const source of sources) {
  for (const key of Object.keys(source)) {
    if (merged[key]) {
      console.warn(`Warning: duplicate component-data key "${key}" — last definition wins`);
    }
    merged[key] = source[key];
  }
}

export default merged;
