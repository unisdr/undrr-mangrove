/**
 * @file page-header.js
 * @source constants.js (HTML), manual (metadata)
 *
 * The page header HTML is imported from constants.js to maintain a single
 * source of truth for this branding-critical element. Only metadata
 * (description, doNotModify, cssClasses) is maintained here.
 */

import { PAGE_HEADER_HTML } from '../constants.js';

export default {
  // ===================================================================

  'components-pageheader': {
    vanillaHtml: true,
    description: 'UNDRR page header with colored decoration stripe, logo, user account link, and language selector dropdown.',
    doNotModify: 'The PageHeader structure (decoration stripe, toolbar wrapper, logo section) is a UNDRR branding requirement. Use the documented markup exactly as shown. The four empty divs inside mg-page-header__decoration are intentional — they render the colored stripe segments.',
    cssClasses: [
      'mg-page-header',
      'mg-page-header--default',
      'mg-page-header__decoration',
      'mg-page-header__toolbar-wrapper',
      'mg-page-header__container',
      'mg-page-header__region',
      'mg-page-header__region--toolbar',
      'mg-page-header__block',
      'mg-page-header__block--logo',
      'mg-page-header__logo-img',
      'mg-page-header__label',
      'mg-page-header__label-mobile',
      'mg-page-header__lang-form',
      'mg-page-header__form-item',
      'mg-page-header__select-wrapper',
      'mg-page-header__select',
      'mg-skip-link',
    ],
    examples: [
      {
        name: 'Page header with logo and language selector',
        html: PAGE_HEADER_HTML,
      },
    ],
  },
};
