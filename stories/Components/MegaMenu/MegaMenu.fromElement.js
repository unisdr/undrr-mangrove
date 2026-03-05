/**
 * Extract MegaMenu props from a DOM container.
 *
 * MegaMenu is a complex-tier component: in most integrations (Drupal, Astro)
 * the `sections` prop comes from an API call or server-side tree builder, not
 * from static HTML. This fromElement covers the DOM-extractable portion —
 * timing props and an optional inline JSON sections attribute for static
 * use cases. Consumer wrappers (Layer 3) typically override `sections`.
 */
export default function megaMenuFromElement(container) {
  const { dataset } = container;
  const props = {
    delay: dataset.delay ? parseInt(dataset.delay, 10) : 300,
    hoverDelay: dataset.hoverDelay ? parseInt(dataset.hoverDelay, 10) : 180,
  };

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
