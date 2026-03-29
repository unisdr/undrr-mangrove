/**
 * Extract MegaMenu props from a DOM container.
 *
 * MegaMenu is a complex-tier component: in most integrations (Drupal, Astro)
 * the `sections` prop comes from an API call or server-side tree builder, not
 * from static HTML. This fromElement covers the DOM-extractable portion —
 * timing props, logo props, and an optional inline JSON sections attribute for
 * static use cases. Consumer wrappers (Layer 3) typically override `sections`.
 *
 * @example
 * <div data-mg-mega-menu
 *   data-delay="300"
 *   data-logo-src="https://assets.undrr.org/static/logos/pw/pw-logo.svg"
 *   data-logo-alt="PreventionWeb"
 *   data-logo-href="/ar/">
 * </div>
 */
export default function megaMenuFromElement(container) {
  const { dataset } = container;
  const props = {
    delay: dataset.delay ? parseInt(dataset.delay, 10) : 300,
    hoverDelay: dataset.hoverDelay ? parseInt(dataset.hoverDelay, 10) : 180,
  };

  // Logo props (optional — Drupal wrapper also resolves logos via SITE_LOGOS body class lookup)
  if (dataset.logoSrc) props.logoSrc = dataset.logoSrc;
  if (dataset.logoAlt) props.logoAlt = dataset.logoAlt;
  if (dataset.logoHref) props.logoHref = dataset.logoHref;
  if (dataset.logoWidth) props.logoWidth = parseInt(dataset.logoWidth, 10);
  if (dataset.logoHeight) props.logoHeight = parseInt(dataset.logoHeight, 10);
  if (dataset.ariaLabel) props.ariaLabel = dataset.ariaLabel;

  // Static menu structure (optional — most consumers provide this via API)
  if (dataset.sections) {
    try {
      props.sections = JSON.parse(dataset.sections);
    } catch {
      props.sections = [];
    }
  }

  return props;
}
