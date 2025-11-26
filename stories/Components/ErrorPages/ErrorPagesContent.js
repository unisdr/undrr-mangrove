/**
 * Default copy for error pages
 *
 * These messages follow UNDRR writing guidelines:
 * - Sentence case headings
 * - Calm, actionable guidance
 * - No blame or technical jargon
 *
 * @see https://gitlab.com/undrr/web-backlog/-/issues/2556
 */
export const DEFAULT_COPY = {
  401: {
    title: 'You are not signed in',
    description:
      'You need to sign in to view this page. If you think you should have access, sign in and try again.',
  },
  403: {
    title: 'You do not have permission to view this page',
    description: 'You don\'t have permission to view this page. If you need access, contact the website team.',
  },
  404: {
    title: 'We can\'t find the page you\'re looking for',
    description:
      'If you typed the web address, check that it\'s correct. If you followed a link, it may be out of date. <br /> Go to the <a href="/">homepage</a>, browse the <a href="https://www.undrr.org/undrr-directory">UNDRR directory</a>, or search:',
  },
  429: {
    title: 'Too many requests',
    description:
      'You made too many requests in a short time. Wait a moment, then try again.',
  },
  500: {
    title: 'Something went wrong on our side',
    description:
      'We couldn\'t complete your request. Try again in a few minutes. If the problem continues, contact us.',
  },
  502: {
    title: 'Bad gateway',
    description:
      'There was a temporary problem connecting to the service. Try again in a moment.',
  },
  503: {
    title: 'This service may be temporarily unavailable',
    description:
      'Please try again later. If this continues, please check the <a href="https://messaging.undrr.org/">UNDRR status page</a>.',
  },
  504: {
    title: 'Gateway timeout',
    description:
      'The service took too long to respond. Refresh the page or try again later.',
  },
};

/**
 * Cloudflare error tokens for custom error pages
 *
 * These tokens are replaced by Cloudflare at runtime when serving custom error pages.
 * See: https://developers.cloudflare.com/rules/custom-errors/reference/error-tokens/
 *
 * To use these in static HTML templates, include the token string directly in your HTML.
 * Cloudflare will substitute the actual values when serving the page.
 *
 * Example usage in HTML:
 *   <dl class="mg-error-page__details">
 *     <dt>Ray ID:</dt><dd>::RAY_ID::</dd>
 *     <dt>Your IP:</dt><dd>::CLIENT_IP::</dd>
 *     <dt>Location:</dt><dd>::GEO::</dd>
 *   </dl>
 */
export const CLOUDFLARE_TOKENS = {
  // General information tokens
  RAY_ID: '::RAY_ID::',           // Unique request identifier for support tickets
  CLIENT_IP: '::CLIENT_IP::',     // Visitor's IP address
  GEO: '::GEO::',                 // Visitor's country/region

  // Page-specific tokens (required for certain error types)
  CAPTCHA_BOX: '::CAPTCHA_BOX::',                         // Interactive Challenge / Managed Challenge
  IM_UNDER_ATTACK_BOX: '::IM_UNDER_ATTACK_BOX::',         // Non-Interactive Challenge (JS Challenge)
  CLOUDFLARE_ERROR_500S_BOX: '::CLOUDFLARE_ERROR_500S_BOX::', // Server error details (5xx errors)
  CLOUDFLARE_ERROR_1000S_BOX: '::CLOUDFLARE_ERROR_1000S_BOX::', // Cloudflare-specific error codes
};

/**
 * Example request details for Storybook previews
 * These simulate what Cloudflare tokens would display in production
 */
export const EXAMPLE_REQUEST_DETAILS = {
  rayId: '8a1b2c3d4e5f6789-IAD',
  clientIp: '203.0.113.42',
  geo: 'United States',
};


