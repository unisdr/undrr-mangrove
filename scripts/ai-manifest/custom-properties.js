// Component CSS custom properties for the AI manifest.
//
// A component's custom properties are its theming API: the supported way to
// restyle it without writing rules that fight its own. `tokens.json` covers
// the THEME tokens only — the --mg-* properties generated from tokens/*.yaml —
// so component-scoped properties appeared nowhere machine-readable and a
// consuming team had to grep the compiled CSS to find them
// (unisdr/undrr-mangrove#1200, #1207).
//
// How the list is produced: hybrid, extraction-first.
//
//   Names, kinds and defaults are EXTRACTED from the compiled CSS bundles in
//   stories/assets/css/. That is the artefact consumers actually load, so a
//   property that is renamed, removed or given a new default changes the
//   manifest on the next build with no edit here. Prose is AUTHORED below,
//   because no stylesheet can say what a property is for.
//
//   Nothing goes stale silently: every extracted property must be claimed by a
//   component (OWNERS) and described (PROPERTY_DOCS) or listed in NOT_PUBLIC
//   with a reason, and every description must match a property the CSS really
//   has. `yarn validate-manifest` fails on any of those, in both directions.
//
// Two kinds, the same distinction
// stories/assets/scss/__tests__/custom-properties-defined.test.js draws:
//
//   type: 'default' — a plain, unconditional rule defines it, so it already
//                     has a value and an override replaces that value.
//   type: 'hook'    — nothing unconditional defines it. It resolves to its
//                     var() fallback, or to nothing at all, until a wrapper,
//                     an inline style, a prop or a consuming page sets it.
//
// "Unconditional" is the whole distinction, so the parser has to know what is
// conditional. A modifier or a state (.mg-switch--small, :hover) declares a
// value for that case only; so does any rule inside @media or @supports. But
// :root, :where() and :is() are not modifiers, and a bare "contains a colon"
// test calls all three one — which marked about thirty properties declared on
// :root as modifier-only and took their reported default from a var()
// fallback that merely happened to agree.

import fs from 'fs';
import path from 'path';

// A --mg-* custom property name, rejecting the interpolated fragments
// (`--mg-color-#{$name}`) that a plain regex over SCSS would otherwise catch.
const PROPERTY_NAME = /^--mg-[A-Za-z0-9]+(?:-{1,2}[A-Za-z0-9]+)*$/;

// Properties that are global rather than component-scoped, and so belong to
// the theme layer even though tokens.json does not list them — it is built
// from the tokens/*.yaml sources only, and these are declared straight in
// SCSS.
//
// Naming a prefix here is a claim, not a filter: it says this group is the
// theme layer's and where a reader finds it. llms.txt names every entry, and
// validation fails on any --mg-* property the bundles carry that is in
// neither tokens.json, a component's customProperties, NOT_PUBLIC nor one of
// these. Without that, "the three lists partition the properties" was wrong
// by 143 names and nothing said so.
export const GLOBAL_PREFIXES = {
  '--mg-color-': {
    label: 'the legacy one-off brand colours',
    where:
      'declared on :root by stories/assets/scss/_variables.scss, alongside the palette tokens.json does carry',
  },
  '--mg-dataviz-': {
    label: 'the data visualisation palettes',
    where: 'declared on :root by stories/assets/scss/_tokens-data-viz.scss',
  },
  '--mg-font-family-': {
    label: 'the five typography roles',
    where:
      'declared on :root by stories/assets/scss/_variables.scss, re-pointed for Arabic in _fonts.scss, and described under "Brand guide → Typography" below',
  },
  '--mg-sendai-': {
    label: 'the Sendai Framework target ramps',
    where: 'declared on :root by stories/assets/scss/_tokens-data-viz.scss',
  },
};

// Properties the CSS exposes that are NOT public API, each with the reason.
// Listing one here is how a property opts out of the "exposed but not
// documented" check; anything not listed and not described fails validation.
//
// It is the one way to remove a property from the published API, so it is not
// allowed to be quiet: `yarn validate-manifest` prints every entry on every
// run, and MIN_PROPERTIES below fails the build if a component's published
// count drops. Adding an entry therefore shows up three times — in this diff,
// in the validate log, and in the count — rather than only shrinking a JSON
// file nobody diffs.
export const NOT_PUBLIC = {
  '--mg-gutenberg-spacer':
    'Declared on .mg-footer and read by nothing. A leftover of the Gutenberg spacing work that --mg-container-spacer replaced; see the note in stories/Atom/Layout/Container/container.scss.',
};

// How many properties each component is known to publish. A floor, not an
// exact count: adding one is routine and passes, losing one is a removal from
// a public API and has to be deliberate, so it fails validation until the
// number here comes down with it.
//
// Without this, moving a property into NOT_PUBLIC removed it from the
// manifest with "Validation passed" and a green test suite — the failure mode
// this file exists to prevent, reached through the file itself.
export const MIN_PROPERTIES = {
  'components-buttons-buttons': 1,
  'components-syndicated-search': 2,
  'components-cards-icon-card': 4,
  'components-cta': 2,
  'components-dataviz-legend': 1,
  'components-empty-state': 15,
  'components-forms-checkbox': 13,
  'components-forms-segmented-control': 2,
  'components-hero-hero': 6,
  'components-icons': 1,
  'components-images-author-image': 3,
  'components-navigation-drawer': 2,
  'components-navigation-megamenu': 2,
  'components-navigation-on-this-page-nav': 1,
  'components-navigation-tree': 5,
  'components-notice-notice': 4,
  'components-reading-column': 1,
  'components-showmore': 1,
  'components-status-label': 15,
  'components-tabs': 14,
  'components-tag': 3,
  'patterns-content-hub': 11,
};

// Which component owns which properties.
//
// A key is a Storybook component ID, as in component-data.js. A value is a
// list of matchers: one ending in "-" claims every property starting with it,
// anything else claims that exact name.
export const OWNERS = {
  'components-images-author-image': ['--mg-author-image-'],
  'components-syndicated-search': ['--mg-search-drawer-'],
  'components-buttons-buttons': ['--mg-cta-arrow-shift'],
  'components-cards-icon-card': [
    '--mg-card-border',
    '--mg-card-icon-size',
    '--mg-icon-bg',
    '--mg-icon-fg',
  ],
  'components-cta': ['--mg-cta-accent', '--mg-cta-bg'],
  'components-dataviz-legend': ['--mg-legend-tick-pos'],
  'components-empty-state': ['--mg-empty-state-'],
  'components-forms-checkbox': ['--mg-switch-'],
  'components-forms-segmented-control': ['--mg-segmented-control-'],
  'components-hero-hero': ['--mg-hero-'],
  'components-icons': ['--mg-icon-svg'],
  'components-navigation-drawer': ['--mg-drawer-'],
  'components-navigation-megamenu': ['--mg-mega-'],
  'components-navigation-on-this-page-nav': ['--mg-on-this-page-nav-'],
  'components-navigation-tree': ['--mg-tree-'],
  'components-notice-notice': ['--mg-notice-'],
  'components-reading-column': ['--mg-reading-with-contents-width'],
  'components-showmore': ['--mg-show-more-'],
  'components-status-label': ['--mg-status-label-'],
  'components-tabs': ['--mg-tab-'],
  'components-tag': ['--mg-tag-'],
  'patterns-content-hub': ['--mg-hub-header-'],
};

// What each property is for. One sentence where one will do; the extracted
// default is not repeated here, because the generator carries it separately
// and a repeated value is a value that goes stale.
export const PROPERTY_DOCS = {
  // AuthorImage
  '--mg-author-image-accent': 'Colour of the ring drawn around the avatar.',
  '--mg-author-image-avatar-size': 'Width and height of the circular avatar.',
  '--mg-author-image-hover-tint':
    'Colour of the gradient tint laid over the avatar on hover.',

  // Buttons (CTA button)
  '--mg-cta-arrow-shift':
    'Inline offset of the CTA arrow, carried in the translate shorthand that also holds the vertical centring, so shift the arrow with this rather than with translate. It is 0 at rest; the hover nudge is set on .mg-button.mg-button-cta:hover::after itself, only where motion is welcome and with its sign flipped in RTL, so a value you set on the button or an ancestor moves the arrow at rest and is replaced on hover rather than changing the hover distance. To change the hover distance, re-declare the property on that same :hover::after rule.',

  // IconCard — every one is an input hook the React props set inline
  '--mg-card-border':
    'Colour of the 2px border on .mg-card__icon--bordered. The borderColor prop sets it as an inline style.',
  '--mg-card-icon-size':
    'Size of the card visual on the variants that own it, such as the horizontal card. The iconSize prop sets it as an inline style.',
  '--mg-icon-bg':
    'Background colour of .mg-card__icon-wrap--colored. The iconColor prop sets it as an inline style; unset, the badge paints no fill.',
  '--mg-icon-fg':
    'Glyph colour of the card icon. The iconFgColor prop sets it as an inline style.',

  // TextCta
  '--mg-cta-accent':
    'Accent colour of the CTA banner. The --primary, --secondary, --tertiary and --quaternary modifiers re-point it at the matching hero colour.',
  '--mg-cta-bg':
    'Background colour of the CTA banner. Nothing declares it, so the banner stays transparent until a wrapper or an inline style sets it.',

  // Legend
  '--mg-legend-tick-pos':
    'Position of one tick along the legend ramp — inline start on the horizontal legend, block start on the vertical one. Set per tick as an inline style.',

  // EmptyState
  '--mg-empty-state-gap':
    'Vertical rhythm between the glyph, the title, the description and the actions.',
  '--mg-empty-state-padding': 'Padding inside the empty state.',
  '--mg-empty-state-max-inline-size':
    'Measure the description text is held to.',
  '--mg-empty-state-title-font-size': 'Size of the title.',
  '--mg-empty-state-title-color': 'Colour of the title.',
  '--mg-empty-state-text-font-size': 'Size of the description.',
  '--mg-empty-state-text-color': 'Colour of the description.',
  '--mg-empty-state-media-size': 'Size of the glyph box above the message.',
  '--mg-empty-state-media-color':
    'Colour of the glyph. The glyph is decorative, but the default still clears 3:1 so it stays legible on a tinted panel.',
  '--mg-empty-state-actions-gap': 'Space between the action buttons.',
  '--mg-empty-state-panel-background':
    'Fill of the .mg-empty-state--panel variant.',
  '--mg-empty-state-panel-radius':
    'Corner radius of the .mg-empty-state--panel variant.',
  '--mg-empty-state-compact-padding':
    'Padding on the .mg-empty-state--compact variant.',
  '--mg-empty-state-compact-media-size':
    'Glyph box on the .mg-empty-state--compact variant.',
  '--mg-empty-state-compact-font-size':
    'Text size on the .mg-empty-state--compact variant.',

  // Switch (documented on the Checkbox page)
  '--mg-switch-size':
    'Size of the whole switch. Set this one unless you need a single part on its own — the track, the thumb, the thumb travel and the pending ring all derive from it, in both directions. One exception to setting it on an ancestor: .mg-switch--small declares it on the label itself, so a small switch keeps its own size and has to be resized on that element or by dropping the modifier.',
  '--mg-switch-track-block-size': 'Height of the track.',
  '--mg-switch-track-inline-size': 'Width of the track.',
  '--mg-switch-track-inset':
    'Space around the thumb, drawn as a transparent border. It is what the error state and forced colours colour.',
  '--mg-switch-thumb-size': 'Size of the thumb.',
  '--mg-switch-track-background': 'Track fill at rest.',
  '--mg-switch-track-background--checked': 'Track fill when the switch is on.',
  '--mg-switch-track-border-color--error':
    'Boundary colour of the track in the error state.',
  '--mg-switch-thumb-background': 'Thumb fill.',
  '--mg-switch-track-overlay--pending':
    'Overlay laid over the track while a change is saving.',
  '--mg-switch-track-overlay--disabled':
    'Overlay laid over the track when the switch is disabled.',
  '--mg-switch-pending-ring-color': 'Colour of the pending progress ring.',
  '--mg-switch-pending-ring-gap-color':
    'Colour of the gap behind the pending progress ring.',

  // Hero
  '--mg-hero-cta-color':
    'Colour of the hero CTA button. Each colour variant re-points it.',
  '--mg-hero-gradient-color':
    'Base colour of the overlay gradient. Each colour variant re-points it.',
  '--mg-hero-gradient-start': 'Alpha of the overlay gradient at its start.',
  '--mg-hero-gradient-middle': 'Alpha of the overlay gradient at its midpoint.',
  '--mg-hero-gradient-end': 'Alpha of the overlay gradient at its end.',
  '--mg-hero-scrim-color':
    'Colour of the neutral scrim painted above the brand tint, so body copy clears AA against a bright photograph whatever the theme colour is. Repointing it is a contrast decision, not a styling one.',
  '--mg-hero-copy-inline-start':
    'Where the copy column starts on the inline axis. The padding and the scrim both read it, so they cannot drift apart.',
  '--mg-hero-copy-inline-end':
    'Where the copy column ends on the inline axis. Both layers of the veil hold at full strength up to it and clear beyond it.',
  '--mg-hero-link-color':
    'Colour of links inside the hero text regions. It does not reach author-provided media HTML.',

  // Icons
  '--mg-icon-svg':
    'The icon artwork, as an SVG data URI, used as the mask — or as the background image on .mg-icon--multicolor. Each .mg-icon--<name> class sets it, so choose an icon by class; set it yourself only to introduce artwork Mangrove does not ship.',

  // Drawer
  '--mg-drawer-size':
    'Width of a start or end drawer, height of a bottom drawer.',
  '--mg-drawer-offset':
    'Translation that holds the drawer off-screen while it is closed. The component flips it per edge and per text direction, so set the size instead unless you are replacing that behaviour deliberately.',
  '--mg-search-drawer-offset':
    'Translation that holds the mobile filter drawer off-screen before it slides in. The component flips it per text direction, so the drawer enters from the inline start in both; set it only if you are replacing that behaviour.',
  '--mg-search-drawer-shadow-offset':
    'Horizontal offset of the mobile filter drawer shadow. Flipped per text direction alongside the drawer itself, so the shadow always falls towards the page content.',

  // MegaMenu
  '--mg-mega-enter-offset':
    'Inline distance the mobile sidebar slides in from. The component flips its sign in RTL.',
  '--mg-mega-mobile-viewport':
    "Viewport height the mobile sidebar is bounded against, so the panel never fills the screen. Only .mg-mega-mobile-sidebar--progressive declares it, at 90vh and at 90dvh where dynamic viewport units are supported, so it has no value at rest and no `default` here; set it on that element itself, because the component's own declaration beats an inherited one.",

  // OnThisPageNav
  '--mg-on-this-page-nav-offset':
    'Docking offset for a fixed header above the nav. Accepts any CSS length, and the scroll position calculations use it too. Nothing declares it, so set it in your theme CSS to dock below a sticky header.',

  // Tree
  '--mg-tree-item-background--hover': 'Row tint on hover.',
  '--mg-tree-item-background--selected': 'Row tint on the selected item.',
  '--mg-tree-item-color--selected':
    'Label colour on the selected item. It is the text colour, not the interactive colour, because the interactive blue does not clear 4.5:1 on the selected tint in every theme.',
  '--mg-tree-group-indent':
    "Indent of a nested group on .mg-tree--guides, measured from the parent row. Only .mg-tree--guides .mg-tree__group declares it, so it has no value at rest and no `default` here; set it on that element, because the component's own declaration beats an inherited one.",
  '--mg-tree-guide-offset':
    "Distance from the parent row to the dashed guide line on .mg-tree--guides. The group padding gives the same amount back, so child rows keep their position. Only .mg-tree--guides .mg-tree__group declares it, so it has no value at rest and no `default` here; set it on that element, because the component's own declaration beats an inherited one.",

  // Notice
  '--mg-notice-bg':
    'Panel fill. Each status modifier (--warning, --negative, --positive) re-points it, so set it on .mg-notice or an ancestor rather than per modifier.',
  '--mg-notice-border-color': 'Border colour, re-pointed by each status.',
  '--mg-notice-border-width':
    'Width of the leading edge that carries the status. --prominent widens it, --overlay narrows it.',
  '--mg-notice-icon-color': 'Colour of the status icon.',

  // Reading column
  '--mg-reading-with-contents-width':
    'Maximum inline size of the .mg-reading--with-contents layout: the text measure, the gap and the side rail together.',

  // Segmented control
  '--mg-segmented-control-min-block-size':
    'Height of a segment, and with it the touch target. Defaults to 2.75rem (44px), the recommended target; .mg-segmented-control--small sets it to 2.25rem (36px) on the fieldset itself, so a small control is resized on that element or by dropping the modifier.',
  '--mg-segmented-control-radius':
    'Corner radius of the two ends of the row. Defaults to --mg-radius-button, so a segmented control keeps the button radius of whichever theme wraps it. Only the first and last segment are rounded, with logical corners, so the row mirrors under dir="rtl".',

  // ShowMore
  '--mg-show-more-height':
    'Collapsed height of a truncated block. The fade mask is derived from it, so setting this is enough.',

  // StatusLabel
  '--mg-status-label-color': 'Colour of the label text.',
  '--mg-status-label-font-size': 'Size of the label text.',
  '--mg-status-label-gap': 'Space between the indicator and the text.',
  '--mg-status-label-indicator-size':
    'Size of the indicator. Every shape is a multiple of it, and the wider shapes are pulled back with a compensating margin so each one occupies the same inline space.',
  '--mg-status-label-indicator-radius':
    'Corner radius of the base indicator. It rounds the base and published circles only; the other five shapes set their own geometry.',
  '--mg-status-label-indicator-border-width':
    'Width of the ring, the same on every edge of all seven shapes. Set it to 0 to drop the ring, bearing in mind it is the only part of the four pale marks clearing 3:1.',
  '--mg-status-label-indicator-border-color': 'Colour of the ring.',
  '--mg-status-label-indicator':
    'Fill of the base indicator, with no modifier.',
  '--mg-status-label-indicator--draft': 'Fill of the draft indicator.',
  '--mg-status-label-indicator--waiting-information':
    'Fill of the waiting-for-more-information indicator.',
  '--mg-status-label-indicator--waiting-validation':
    'Fill of the waiting-for-validation indicator.',
  '--mg-status-label-indicator--published': 'Fill of the published indicator.',
  '--mg-status-label-indicator--warning':
    'Fill of the warning / degraded indicator, shared with ServiceNotice.',
  '--mg-status-label-indicator--negative':
    'Fill of the negative / offline indicator, shared with ServiceNotice.',
  '--mg-status-label-indicator-ring':
    'Derived from --mg-status-label-indicator-border-width and carried into the inner polygons of the two clip-path shapes. Set the border width instead: setting this one alone leaves the ring on those two shapes disagreeing with the other five.',

  // Tabs
  '--mg-tab-color': 'Label colour of a tab at rest.',
  '--mg-tab-color--hover': 'Label colour of a tab on hover.',
  '--mg-tab-color--active': 'Label colour of the active tab.',
  '--mg-tab-background--hover': 'Tab fill on hover.',
  '--mg-tab-background--active': 'Tab fill on the active tab.',
  '--mg-tab-indicator--hover': 'Indicator colour on hover.',
  '--mg-tab-indicator--active':
    'Indicator colour on the active tab, drawn as its border.',
  '--mg-tab-radius': 'Corner radius of a tab.',
  '--mg-tab-rail-background':
    'Fill of the rail the tabs sit in. The scroll fades are drawn from it, so a rail of another colour needs only this.',
  '--mg-tab-rail-border': 'Border colour of the rail.',
  '--mg-tab-rail-padding':
    'Padding inside the rail. It also sets the scroll padding and margin, so a focused tab is never scrolled flush to the edge.',
  '--mg-tab-rail-gap': 'Space between tabs in the rail.',
  '--mg-tab-rail-fade-size':
    'Width of the fade at each end of a scrollable rail.',
  '--mg-tab-panel-gap': 'Space between the rail and the panel below it.',

  // Tag
  '--mg-tag-background':
    'Tag fill. Every variant re-points it, so set it on the tag itself rather than per variant.',
  '--mg-tag-background-hover': 'Tag fill on hover, for linked tags.',
  '--mg-tag-foreground': 'Tag label colour.',

  // HubHeader — every colour here takes sRGB channels rather than a colour,
  // because the stylesheet wraps it in rgb(); a hex or a keyword makes the
  // declaration invalid and the header silently loses the colour. That is not
  // repeated in each description: it is extracted from the CSS and published
  // as `format: "srgb-channels"` and `wrapInRgb: true`, the way tokens.json
  // reports it, so an agent can act on it without reading prose.
  '--mg-hub-header-surface': 'Surface colour of the navigation bar.',
  '--mg-hub-header-banner-surface': 'Surface colour of the banner below it.',
  '--mg-hub-header-ink': 'Colour of the header title.',
  '--mg-hub-header-link': 'Link colour in the bar.',
  '--mg-hub-header-link-hover':
    'Link colour on hover. On a coloured bar the link holds its colour and the underline carries the hover, because the global interactive-active colour is meant for white backgrounds.',
  '--mg-hub-header-marker': 'Colour of the marker on the current item.',
  '--mg-hub-header-rule': 'Colour of the rule under the bar.',
  '--mg-hub-header-rule-alpha': 'Opacity of that rule.',
  '--mg-hub-header-focus': 'Focus ring colour inside the header.',
  '--mg-hub-header-bar-tint':
    'Colour of the tint that stratifies the bar from the banner, so a hero image meeting the bar reads as a boundary rather than a fault.',
  '--mg-hub-header-bar-tint-alpha':
    'Opacity of that tint. The detached surface sets it to 0, having nothing to stratify from.',
};

const globalPrefixOf = name =>
  Object.keys(GLOBAL_PREFIXES).find(prefix => name.startsWith(prefix)) || null;

const claims = (matcher, name) =>
  matcher.endsWith('-') ? name.startsWith(matcher) : name === matcher;

/** The component ID that claims `name`, by longest matcher, or null. */
function ownerOf(name) {
  let owner = null;
  let best = 0;
  for (const [componentId, matchers] of Object.entries(OWNERS)) {
    for (const matcher of matchers) {
      if (claims(matcher, name) && matcher.length > best) {
        owner = componentId;
        best = matcher.length;
      }
    }
  }
  return owner;
}

/** A CSS value, with the whitespace a formatter left inside it collapsed. */
const tidy = value =>
  value
    .replace(/\s+/g, ' ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .trim();

// A CSS string is opaque: everything between an unescaped quote and its match
// is data, not syntax. Given the index of the opening quote, this returns the
// index just past the closing one, so the walks below can copy a string
// through without reading anything inside it as CSS.
//
// Three things go wrong without it. A `{` in a quoted `url()` desyncs the
// brace stack, and every declaration after it is then attributed to whatever
// frame was left open — in testing that turned a neighbouring property's
// `default` into a `hook`. A `;` truncates the value it sits inside:
// --mg-icon-svg's SVG carries one in a `style='fill-rule:evenodd;…'`
// attribute today, and is inert only because the value exceeds the length cap
// below — an icon shipping an SVG `<style>` block would not be. And a `/*`
// inside one string paired with a `*/` inside a later one deletes the real
// CSS between them.
const endOfString = (css, start) => {
  const quote = css[start];
  for (let index = start + 1; index < css.length; index++) {
    const char = css[index];
    if (char === '\\') index++;
    else if (char === quote) return index + 1;
  }
  return css.length;
};

// A comment is not CSS. Stripping them first keeps a docblock out of the
// parse: every component stylesheet opens with one, and several quote a
// property (`--mg-show-more-height: 200px`) or a var() call with a fallback.
// Left in, a comment could invent a property or a default that no rule has.
//
// A comment marker inside a string is not a comment, so strings are copied
// through whole. An unclosed comment runs to the end of the stylesheet, which
// is what CSS itself does with one.
export const stripComments = css => {
  let out = '';
  for (let index = 0; index < css.length; index++) {
    const char = css[index];
    if (char === '"' || char === "'") {
      const end = endOfString(css, index);
      out += css.slice(index, end);
      index = end - 1;
    } else if (char === '/' && css[index + 1] === '*') {
      const close = css.indexOf('*/', index + 2);
      if (close === -1) break;
      index = close + 1;
    } else {
      out += char;
    }
  }
  return out;
};

// A state class: `.is-open`, `.has-icon`. Matched at a class boundary, so
// `.mg-tree-has-children` and `.mg-this-thing` do not read as one.
const STATE_CLASS = /\.(?:is|has)-[a-z]/i;

// A selector that only sometimes applies declares a value for that case, not
// the value at rest. Five shapes of it:
//
//   a BEM modifier      .mg-switch--small, .mg-notice--warning
//   a pseudo-class      :hover, :focus-visible, ::after
//   an attribute        [dir=rtl], [data-theme=dark], [aria-expanded=true]
//   a brand block       .mg-theme-delta …
//   a state class       .mg-notice.is-open, .mg-tree__item.has-children
//
// The last three were missing, so a declaration made only under a scope, a
// theme or a state read as unconditional and its value was published as the
// universal default. Nothing live hit it — the 14 --mg-tab-* properties have
// `.mg-theme-*` declarations and were right only because each also has a
// generic declaration that wins here — but a property declared only inside a
// brand block would have published that brand's value as everyone's.
//
// `:root`, `:where()` and `:is()` are not conditional, and a bare `:` test
// would call all three so. `:root` is where a component's unconditional
// defaults are declared — StatusLabel's and EmptyState's whole sets, plus
// --mg-show-more-height and --mg-reading-with-contents-width — and `:where()`
// and `:is()` only change specificity, so whatever is inside them decides.
// `:not()` is unwrapped for the same reason: what it holds decides, and a
// negated modifier is still a rule about that modifier.
//
// `:has()` is NOT unwrapped. It is a condition in its own right — a rule that
// applies only when the element contains something — so `.mg-card__hc:has(
// .mg-card__visual)`, which the bundles carry today, is as conditional as
// `:hover` however plain the selector inside it reads.
export const isConditionalSelector = selector => {
  const plain = selector
    .replace(/:(?:is|where|not)\(/gi, '(')
    .replace(/:root\b/gi, '');
  return (
    // A BEM modifier. The digit matters: .mg-embed-container--1x1 is a
    // modifier too, and `--[a-z]` alone read it as a plain selector.
    /--[a-z0-9]/i.test(plain) ||
    plain.includes(':') ||
    plain.includes('[') ||
    plain.includes('.mg-theme-') ||
    STATE_CLASS.test(plain)
  );
};

// An at-rule that only applies some of the time — `@media`, `@supports`,
// `@container` — makes every declaration inside it conditional, however plain
// the selector. `@keyframes` is the same: its blocks are frames, not defaults.
// So is anything else unrecognised, which is the safe way round: a new at-rule
// reads as conditional rather than silently publishing a conditional value as
// an unconditional default.
const UNCONDITIONAL_AT_RULES =
  /^@(?:layer|charset|namespace|font-face|import)\b/i;

const isConditionalAtRule = prelude =>
  prelude.startsWith('@') && !UNCONDITIONAL_AT_RULES.test(prelude);

/**
 * Every --mg-* property declared in `css`, as name → { value, modifierOnly }.
 *
 * Walked block by block, carrying the enclosing at-rules, so neither a
 * modifier's value nor a conditional one is mistaken for the default:
 * `.mg-switch--small` sets --mg-switch-size too and happens to come first in
 * the bundle, and a plain selector inside `@media (forced-colors: active)`
 * looks unconditional to any parser that drops the at-rule.
 *
 * `modifierOnly` therefore means "not the value at rest": declared under a
 * modifier, a state, or an at-rule that only sometimes applies.
 */
function declarationsIn(css) {
  const found = new Map();
  const source = stripComments(css);
  const stack = [];
  let buffer = '';

  const record = () => {
    const block = stack[stack.length - 1];
    // A declaration directly inside an at-rule prelude block (@font-face has
    // none of ours; @media's children are rules) still parses harmlessly.
    if (!block) return;
    const match = /(--mg-[A-Za-z0-9_-]+)\s*:\s*([\s\S]*)/.exec(buffer);
    if (!match) return;
    const [, name, value] = match;
    if (!PROPERTY_NAME.test(name)) return;
    const { modifierOnly } = block;
    const seen = found.get(name);
    if (seen && (modifierOnly || !seen.modifierOnly)) return;
    found.set(name, { value: tidy(value), modifierOnly });
  };

  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (char === '"' || char === "'") {
      // Opaque: a brace, a semicolon or a comment marker in here is data.
      const end = endOfString(source, index);
      buffer += source.slice(index, end);
      index = end - 1;
    } else if (char === '{') {
      const prelude = buffer.trim();
      const parent = stack[stack.length - 1];
      stack.push({
        modifierOnly:
          (parent ? parent.modifierOnly : false) ||
          (prelude.startsWith('@')
            ? isConditionalAtRule(prelude)
            : isConditionalSelector(prelude)),
      });
      buffer = '';
    } else if (char === '}') {
      record();
      stack.pop();
      buffer = '';
    } else if (char === ';') {
      record();
      buffer = '';
    } else {
      buffer += char;
    }
  }
  return found;
}

/**
 * Every --mg-* property read through var() in `css`, as
 * name → { fallback, wrapped }.
 *
 * Parsed rather than matched, because a fallback is routinely another
 * function call — `var(--mg-icon-fg, rgb(var(--mg-color-neutral-700)))` — and
 * a regex stops at the first closing parenthesis.
 *
 * `wrapped` is true when every read of the property sits directly inside
 * `rgb()` or `rgba()`. Such a property holds sRGB channels ("255 255 255"),
 * not a colour: give it a hex or a keyword and the whole declaration is
 * invalid and drops silently. That is the same distinction tokens.json draws
 * with `format: "srgb-channels"` and `wrapInRgb`, so it is reported the same
 * way rather than being left to prose.
 */
function readsIn(rawCss) {
  // Comments first, for the same reason declarationsIn strips them: a
  // docblock quoting `var(--mg-foo, 4px)` would otherwise invent a fallback,
  // and every component stylesheet opens with one.
  const css = stripComments(rawCss);
  const found = new Map();
  for (const match of css.matchAll(/var\(\s*(--mg-[A-Za-z0-9_-]+)/g)) {
    const name = match[1];
    if (!PROPERTY_NAME.test(name)) continue;
    let index = match.index + match[0].length;
    while (css[index] === ' ') index++;
    let fallback = '';
    if (css[index] === ',') {
      let depth = 0;
      for (index++; index < css.length; index++) {
        const char = css[index];
        if (char === '"' || char === "'") {
          // A parenthesis inside a quoted url() is not the one that closes
          // the var(), so the string is copied through whole.
          const end = endOfString(css, index);
          fallback += css.slice(index, end);
          index = end - 1;
          continue;
        }
        if (char === '(') depth++;
        else if (char === ')') {
          if (depth === 0) break;
          depth--;
        }
        fallback += char;
      }
    }
    const wrapped = /\brgba?\(\s*$/i.test(css.slice(0, match.index));
    const seen = found.get(name);
    if (seen) {
      seen.wrapped = seen.wrapped && wrapped;
      continue;
    }
    found.set(name, { fallback: tidy(fallback), wrapped });
  }
  return found;
}

/**
 * Read the compiled bundles and group their component-scoped custom
 * properties by component.
 *
 * @param {string} cssDir Directory holding the compiled style*.css bundles.
 * @param {Iterable<string>} themeTokenNames Every property tokens.json
 *   already documents, from buildTokensDictionary(). Those are the theme
 *   layer, not a component's API, so they are left out here — which is what
 *   keeps this list and the dictionary's `scope` field consistent.
 * @returns {{
 *   byComponent: Record<string, Array<{name, type, default?, description}>>,
 *   unattributed: string[],   // exposed, claimed by no component
 *   undocumented: string[],   // exposed and owned, but not described
 *   absent: string[],         // described, but no bundle has it
 *   notPublic: string[],      // held back from the API, with a reason
 *   globals: Array<{prefix, label, where, count}>, // the theme-layer groups
 *   skipped: string|null,     // why nothing was read, if nothing was
 * }}
 */
export function collectCustomProperties(cssDir, themeTokenNames = []) {
  const themeTokens = new Set(themeTokenNames);
  const empty = {
    byComponent: {},
    unattributed: [],
    undocumented: [],
    absent: [],
    notPublic: Object.keys(NOT_PUBLIC).sort(),
    globals: [],
    skipped: null,
  };

  if (!fs.existsSync(cssDir)) {
    return {
      ...empty,
      skipped: `${cssDir} not found — run "yarn scss" first.`,
    };
  }
  const bundles = fs
    .readdirSync(cssDir)
    .filter(file => /^style.*\.css$/.test(file));
  if (bundles.length === 0) {
    return {
      ...empty,
      skipped: `no compiled style*.css bundle in ${cssDir} — run "yarn scss" first.`,
    };
  }

  const declared = new Map();
  const read = new Map();
  for (const bundle of bundles) {
    const css = fs.readFileSync(path.join(cssDir, bundle), 'utf8');
    for (const [name, declaration] of declarationsIn(css)) {
      const seen = declared.get(name);
      if (seen && (declaration.modifierOnly || !seen.modifierOnly)) continue;
      declared.set(name, declaration);
    }
    for (const [name, use] of readsIn(css)) {
      const seen = read.get(name);
      if (seen) {
        seen.wrapped = seen.wrapped && use.wrapped;
        continue;
      }
      read.set(name, { ...use });
    }
  }

  const everyName = [...new Set([...declared.keys(), ...read.keys()])].sort();

  // The theme-layer groups, counted from the bundles rather than asserted, so
  // llms.txt can name each one and say how large it is. Only the names
  // tokens.json does NOT carry are counted: the --mg-color-* palette is in
  // the dictionary and only a handful of legacy one-offs beside it are not,
  // so counting the whole prefix would report 111 where the answer is 10.
  const globalCounts = new Map(
    Object.keys(GLOBAL_PREFIXES).map(prefix => [prefix, 0])
  );
  for (const name of everyName) {
    if (themeTokens.has(name)) continue;
    const prefix = globalPrefixOf(name);
    if (prefix) globalCounts.set(prefix, globalCounts.get(prefix) + 1);
  }
  const globals = Object.entries(GLOBAL_PREFIXES).map(([prefix, meta]) => ({
    prefix,
    ...meta,
    count: globalCounts.get(prefix),
  }));

  const exposed = everyName.filter(
    name => !globalPrefixOf(name) && !themeTokens.has(name)
  );

  const byComponent = {};
  const unattributed = [];
  const undocumented = [];

  for (const name of exposed) {
    if (name in NOT_PUBLIC) continue;
    const componentId = ownerOf(name);
    if (!componentId) {
      unattributed.push(name);
      continue;
    }
    const description = PROPERTY_DOCS[name];
    if (!description) {
      undocumented.push(`${componentId}: ${name}`);
      continue;
    }

    const declaration = declared.get(name);
    const use = read.get(name);

    // `default` and `hook` turn on the same fact the resting value does:
    // whether a plain, unconditional rule gives the property a value. A
    // property only a modifier declares — --mg-switch-size, set by
    // .mg-switch--small alone — is a hook on an unmodified component, where
    // its computed value is the empty string.
    const property = {
      name,
      type: declaration && !declaration.modifierOnly ? 'default' : 'hook',
      description,
    };

    // A property every stylesheet reads inside rgb() takes sRGB channels, not
    // a colour. Flagged the way tokens.json flags the same thing, so an agent
    // can act on it without parsing the description.
    if (use?.wrapped) {
      property.format = 'srgb-channels';
      property.wrapInRgb = true;
    }

    // The value that applies at rest, and only that: an unconditional rule's
    // declaration, or else the var() fallback the component reads it with.
    //
    // A conditional declaration is not a third source. It used to be — the
    // rule fell back to `declaration.value` — and for a hook nothing reads
    // with a fallback that published a value the component does not have at
    // rest, contradicting what the field promises. It affected three
    // properties. --mg-mega-mobile-viewport was wrong twice: its 90vh comes
    // from the --progressive modifier, and @supports (height: 100dvh)
    // re-declares it to 90dvh, so the published value was the one no current
    // browser uses. --mg-tree-group-indent and --mg-tree-guide-offset were
    // honest numbers, but only under .mg-tree--guides: set either on a plain
    // tree and nothing moves, so publishing them as that property's resting
    // value says something false about the property. Their descriptions
    // already name the modifier they belong to, which is where a reader who
    // needs them should look — and the rule that governs `default` is now the
    // same one the `_ai` text states, rather than one with an exception.
    const value =
      declaration && !declaration.modifierOnly
        ? declaration.value
        : use?.fallback || undefined;

    // Anything longer than this is artwork rather than a value a reader
    // wants: --mg-icon-svg carries a whole SVG data URI. Its description
    // says as much.
    if (value && value.length <= 240) property.default = value;

    (byComponent[componentId] ||= []).push(property);
  }

  const known = new Set(exposed);
  const absent = Object.keys(PROPERTY_DOCS)
    .filter(name => !known.has(name))
    .sort();

  // Every --mg-* name the bundles carry lands in exactly one of four lists:
  // tokens.json, a component's customProperties, NOT_PUBLIC, or one of the
  // global prefixes above. `unattributed` and `undocumented` are what is left
  // over, so they are already the "nobody decided about this" check — what
  // was missing is that `globals` is the fourth list and the docs named only
  // three. It is returned so llms.txt can name each group and its size
  // instead of naming the data-viz palette and leaving 29 others unsaid.
  return {
    byComponent,
    unattributed,
    undocumented,
    absent,
    notPublic: Object.keys(NOT_PUBLIC).sort(),
    globals,
    skipped: null,
  };
}
