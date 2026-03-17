/**
 * @file page-templates.js
 * @source manual (page compositions), imports from constants.js
 *
 * Imports PageHeader, Footer, and closing scripts HTML from
 * scripts/ai-manifest/data/constants.js. Page templates compose these shared
 * snippets with page-specific content. Update constants.js if
 * branding markup changes; update this file for page layout changes.
 */

import {
  THEME_CSS,
  PAGE_HEADER_HTML,
  FOOTER_HTML,
  CLOSING_SCRIPTS_HTML,
  REQUIRED_STYLESHEETS,
} from '../constants.js';

const COOKIE_CSS_URL = REQUIRED_STYLESHEETS[1].url;

export default {
  'example-page-template-example': {
    vanillaHtml: true,
    description:
      'Complete page templates showing how to compose Mangrove components into working UNDRR-branded pages with all required scripts and assets.',
    examples: [
      {
        name: 'Canonical UNDRR page shell (use this as your starting point)',
        html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Page title - UNDRR</title>
  <!-- Theme CSS (required, choose one) -->
  <link rel="stylesheet" href="${THEME_CSS.undrr}" />
  <!-- Cookie consent CSS (required if using cookie banner) -->
  <link rel="stylesheet" href="${COOKIE_CSS_URL}" />
</head>
<body>
${PAGE_HEADER_HTML}

  <!-- Optional: MegaMenu navigation goes here (requires React) -->

  <!-- Critical messaging container (optional, messages inject here) -->
  <div class="mg-critical-messaging"></div>

  <!-- PAGE CONTENT GOES HERE -->
  <div class="mg-container mg-container--padded mg-container--spacer">
    <h1>Page title</h1>
    <p>Content here.</p>
  </div>

${FOOTER_HTML}

${CLOSING_SCRIPTS_HTML}
</body>
</html>`,
      },
      {
        name: 'Listing page (card grid with pagination)',
        html: `<!-- Main content for a listing/index page -->
<div class="mg-container mg-container--padded mg-container--spacer">
  <nav aria-label="breadcrumbs" class="mg-breadcrumb">
    <ul>
      <li><a href="/">Home</a></li>
      <li aria-current="page">Publications</li>
    </ul>
  </nav>

  <h1>Publications</h1>

  <!-- Filter chips -->
  <div style="margin-bottom: 1rem;">
    <a class="chip chip__cross" href="#" role="button">Earthquake</a>
    <a class="chip chip__cross" href="#" role="button">2024</a>
  </div>

  <!-- Card grid -->
  <div class="mg-grid mg-grid__col-3">
    <article class="mg-card mg-card__vc">
      <div class="mg-card__visual">
        <img src="https://picsum.photos/600/400?1" alt="" class="mg-card__image" />
      </div>
      <div class="mg-card__content">
        <div class="mg-card__meta">
          <a href="/topics/drr" class="mg-card__label mg-card__label--active">DRR</a>
        </div>
        <header class="mg-card__title"><a href="/report-1">Global Assessment Report 2024</a></header>
        <p class="mg-card__summary">The flagship report on disaster risk reduction.</p>
      </div>
    </article>
    <article class="mg-card mg-card__vc">
      <div class="mg-card__visual">
        <img src="https://picsum.photos/600/400?2" alt="" class="mg-card__image" />
      </div>
      <div class="mg-card__content">
        <header class="mg-card__title"><a href="/report-2">Sendai Framework progress</a></header>
        <p class="mg-card__summary">Tracking implementation across 195 countries.</p>
      </div>
    </article>
    <article class="mg-card mg-card__vc">
      <div class="mg-card__visual">
        <img src="https://picsum.photos/600/400?3" alt="" class="mg-card__image" />
      </div>
      <div class="mg-card__content">
        <header class="mg-card__title"><a href="/report-3">Making cities resilient</a></header>
        <p class="mg-card__summary">Urban resilience for local governments.</p>
      </div>
    </article>
  </div>

  <!-- Pagination -->
  <nav class="pagination" aria-label="Pagination" role="navigation">
    <ul>
      <li class="disabled" aria-disabled="true"><span>Previous</span></li>
      <li><a href="?page=1" role="button">1</a></li>
      <li><a href="?page=2" role="button">2</a></li>
      <li><a href="?page=3" role="button">3</a></li>
      <li><a href="?page=2" role="button">Next</a></li>
    </ul>
  </nav>
</div>`,
      },
      {
        name: 'Detail page (article with sidebar content)',
        html: `<!-- Main content for a detail/article page -->
<section class="mg-hero mg-hero--child" style="background-image: url('https://picsum.photos/1600/400')">
  <div class="mg-hero__overlay">
    <article class="mg-hero__content">
      <div class="mg-hero__meta">
        <a href="/topics/early-warning" class="mg-hero__label">Early warning</a>
      </div>
      <header class="mg-hero__title">
        <a href="#" class="text-xxl">Early warning systems save lives</a>
      </header>
      <div class="mg-hero__summaryText">Published 15 March 2026</div>
    </article>
  </div>
</section>

<div class="mg-container mg-container--padded mg-container--spacer">
  <nav aria-label="breadcrumbs" class="mg-breadcrumb">
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/news">News</a></li>
      <li aria-current="page">Early warning systems save lives</li>
    </ul>
  </nav>

  <div class="mg-grid mg-grid__col-2">
    <!-- Main article body -->
    <div>
      <p>Multi-hazard early warning systems are one of the most effective tools for disaster risk reduction, with proven capacity to save lives and reduce economic losses.</p>

      <div class="mg-highlight-box mg-highlight-box--primary">
        <h3>Key finding</h3>
        <p>Countries with early warning systems experience eight times fewer deaths from disasters.</p>
      </div>

      <p>The Sendai Framework calls for substantially increasing the availability of and access to multi-hazard early warning systems by 2030.</p>

      <blockquote>
        Prevention is not a cost. It is an investment in our common future.
        <cite>UNDRR</cite>
      </blockquote>

      <!-- Tags -->
      <div class="mg-tag-container" style="margin-top: 2rem;">
        <a href="/topics/early-warning">Early warning</a>
        <a href="/topics/sendai-framework">Sendai Framework</a>
        <a href="/regions/asia-pacific">Asia-Pacific</a>
      </div>
    </div>

    <!-- Sidebar -->
    <aside>
      <h3>Related publications</h3>
      <article class="mg-card mg-card__vc">
        <div class="mg-card__content">
          <header class="mg-card__title"><a href="/report-1">Global Assessment Report 2024</a></header>
          <p class="mg-card__summary">The flagship report on global disaster risk.</p>
        </div>
      </article>
      <article class="mg-card mg-card__vc">
        <div class="mg-card__content">
          <header class="mg-card__title"><a href="/report-2">Early warning for all</a></header>
          <p class="mg-card__summary">UN initiative for universal early warning coverage.</p>
        </div>
      </article>
    </aside>
  </div>
</div>`,
      },
      {
        name: 'Form page (contact form with validation)',
        html: `<!-- Main content for a form page -->
<div class="mg-container mg-container--padded mg-container--spacer">
  <nav aria-label="breadcrumbs" class="mg-breadcrumb">
    <ul>
      <li><a href="/">Home</a></li>
      <li aria-current="page">Contact us</li>
    </ul>
  </nav>

  <div class="mg-container--slim">
    <h1>Contact us</h1>
    <p>Get in touch with the UNDRR team.</p>

    <!-- Error summary (show when form has validation errors) -->
    <!--
    <div class="mg-form-error-summary" role="alert" tabindex="-1">
      <h2 class="mg-form-error-summary__title">There is a problem</h2>
      <ul class="mg-form-error-summary__list">
        <li><a href="#email">Enter a valid email address</a></li>
        <li><a href="#message">Message is required</a></li>
      </ul>
    </div>
    -->

    <form action="/contact" method="post">
      <div class="mg-form-field">
        <label class="mg-form-label mg-form-label--required" for="full-name">Full name</label>
        <input class="mg-form-input" type="text" id="full-name" name="full_name" required />
      </div>

      <div class="mg-form-field">
        <label class="mg-form-label mg-form-label--required" for="email">Email address</label>
        <input class="mg-form-input" type="email" id="email" name="email" required />
        <p class="mg-form-help">We will only use this to respond to your inquiry.</p>
      </div>

      <div class="mg-form-field">
        <label class="mg-form-label" for="organization">Organization</label>
        <input class="mg-form-input" type="text" id="organization" name="organization" />
      </div>

      <div class="mg-form-field">
        <label class="mg-form-label" for="topic">Topic</label>
        <select class="mg-form-select" id="topic" name="topic">
          <option value="" disabled selected>Select a topic</option>
          <option value="general">General inquiry</option>
          <option value="partnership">Partnership</option>
          <option value="media">Media inquiry</option>
          <option value="technical">Technical support</option>
        </select>
      </div>

      <fieldset class="mg-form-group">
        <legend class="mg-form-group__legend">Preferred contact method</legend>
        <div class="mg-form-check">
          <input class="mg-form-check__input mg-form-check__input--radio" type="radio" id="contact-email" name="contact_method" value="email" checked />
          <label class="mg-form-check__label" for="contact-email">Email</label>
        </div>
        <div class="mg-form-check">
          <input class="mg-form-check__input mg-form-check__input--radio" type="radio" id="contact-phone" name="contact_method" value="phone" />
          <label class="mg-form-check__label" for="contact-phone">Phone</label>
        </div>
      </fieldset>

      <div class="mg-form-field">
        <label class="mg-form-label mg-form-label--required" for="message">Message</label>
        <textarea class="mg-form-textarea" id="message" name="message" rows="6" required></textarea>
        <p class="mg-form-help">Max 2000 characters.</p>
      </div>

      <div class="mg-form-check">
        <input class="mg-form-check__input mg-form-check__input--checkbox" type="checkbox" id="privacy" name="privacy" required />
        <label class="mg-form-check__label" for="privacy">I agree to the <a href="/privacy">privacy policy</a></label>
      </div>

      <div style="margin-top: 2rem;">
        <button type="submit" class="mg-button mg-button-primary mg-button-arrow">Send message</button>
      </div>
    </form>
  </div>
</div>`,
      },
    ],
  },
};
