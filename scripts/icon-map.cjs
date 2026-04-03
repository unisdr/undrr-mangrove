/**
 * Icon mapping: mg-icon-* name → SVG source path.
 *
 * Part of the icon font → CSS mask-image migration.
 * See: https://github.com/unisdr/undrr-mangrove/issues/906
 *
 * Three source pools:
 *   - Lucide (node_modules/lucide-static/icons/)  — general UI icons
 *   - OCHA  (stories/assets/icons/ocha/)           — humanitarian/DRR domain icons
 *   - Custom (stories/assets/icons/custom/)         — brand logos, UNDRR-specific
 *
 * icon-build.cjs reads this map, optimises each SVG with SVGO, URL-encodes
 * it, and writes mask-image rules to _icon-definitions.scss.
 */

const path = require('path');

const LUCIDE = (name) => path.join('node_modules/lucide-static/icons', `${name}.svg`);
const OCHA = (name) => path.join('stories/assets/icons/ocha', `${name}.svg`);
const CUSTOM = (name) => path.join('stories/assets/icons/custom', `${name}.svg`);

module.exports = {
  // -------------------------------------------------------------------------
  // Lucide — general UI icons
  // -------------------------------------------------------------------------
  'globe': LUCIDE('globe'),
  'search': LUCIDE('search'),
  'calendar-alt': LUCIDE('calendar-days'),
  'chart-bar': LUCIDE('bar-chart-3'),
  'envelope': LUCIDE('mail'),
  'newspaper': LUCIDE('newspaper'),
  'building': LUCIDE('building-2'),
  'landmark': LUCIDE('landmark'),
  'graduation-cap': LUCIDE('graduation-cap'),
  'business-time': LUCIDE('briefcase-business'),
  'pen-nib': LUCIDE('pen-tool'),
  'code-branch': LUCIDE('git-branch'),
  'life-ring': LUCIDE('life-buoy'),
  'lightbulb': LUCIDE('lightbulb'),
  'cubes': LUCIDE('boxes'),
  'sort-alpha-down': LUCIDE('arrow-down-a-z'),
  'tags': LUCIDE('tags'),
  'power-off': LUCIDE('power'),
  'user': LUCIDE('user'),
  'file': LUCIDE('file'),
  'file-alt': LUCIDE('file-text'),
  'times': LUCIDE('x'),
  'link': LUCIDE('link'),
  'clone': LUCIDE('copy'),
  'share': LUCIDE('share-2'),
  'qrcode': LUCIDE('qr-code'),
  'rss': LUCIDE('rss'),
  'left': LUCIDE('arrow-left'),
  'right': LUCIDE('arrow-right'),
  'angle-circled-left': LUCIDE('circle-chevron-left'),
  'angle-circled-right': LUCIDE('circle-chevron-right'),
  'menu': LUCIDE('menu'),
  'info-circle': LUCIDE('info'),
  'handshake': LUCIDE('handshake'),
  'map': LUCIDE('map'),

  // Legacy aliases — preserve backward compat with old mg-icon-* names.
  // Paths are relative to the project root. Run via yarn build:icons.
  'bar-chart': LUCIDE('bar-chart-3'),           // alias for chart-bar
  'close': LUCIDE('x'),                     // alias for times
  'copy': LUCIDE('copy'),                   // alias for clone
  'arrow-left': LUCIDE('arrow-left'),       // alias for left
  'arrow-right': LUCIDE('arrow-right'),     // alias for right
  'hamburger': LUCIDE('menu'),              // alias for menu
  'calendar': LUCIDE('calendar-days'),      // alias for calendar-alt

  // Drupal-needed icons (not in current Mangrove set, but referenced in templates)
  'exclamation-triangle': LUCIDE('triangle-alert'),
  'circle-plus': LUCIDE('circle-plus'),
  'user-circle': LUCIDE('circle-user'),
  'user-tag': LUCIDE('user-pen'),
  'sign-out-alt': LUCIDE('log-out'),

  // -------------------------------------------------------------------------
  // OCHA — humanitarian/DRR domain icons
  // -------------------------------------------------------------------------
  'earthquake': OCHA('earthquake'),

  // -------------------------------------------------------------------------
  // Custom — brand logos and UNDRR-specific
  // Social media icons use custom SVGs, not Lucide approximations.
  // -------------------------------------------------------------------------
  'facebook': CUSTOM('facebook'),
  'x-social': CUSTOM('x-social'),
  'twitter': CUSTOM('x-social'),            // legacy alias for x-social
  'linkedin': CUSTOM('linkedin'),
  'youtube': CUSTOM('youtube'),
  'flickr': CUSTOM('flickr'),
  'sdg-wheel': CUSTOM('sdg-wheel'),
};
