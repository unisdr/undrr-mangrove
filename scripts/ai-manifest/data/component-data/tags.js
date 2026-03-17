/**
 * @file tags.js
 * @source manual (metadata + curated HTML)
 *
 * All content is manually maintained. Update the HTML examples
 * when the component markup changes. See scripts/ai-manifest/README.md for
 * the entry schema and available fields.
 */

export default {
  'atom-tag': {
    vanillaHtml: true,
    description: 'Small label for categorization. Variants: default, secondary, outline, accent. Can be span or link.',
    cssClasses: [
      'mg-tag',
      'mg-tag--secondary',
      'mg-tag--outline',
      'mg-tag--accent',
      'mg-tag-container',
    ],
    examples: [
      {
        name: 'Tag variants',
        html: `<span class="mg-tag">Default tag</span>
<a href="/topics/drr" class="mg-tag">Linked tag</a>
<span class="mg-tag mg-tag--secondary">Secondary</span>
<span class="mg-tag mg-tag--outline">Outline</span>
<span class="mg-tag mg-tag--accent">Accent</span>`,
      },
      {
        name: 'Tag container (auto-styles children)',
        html: `<div class="mg-tag-container">
  <a href="/topics/earthquake">Earthquake</a>
  <a href="/topics/flood">Flood</a>
  <a href="/topics/drought">Drought</a>
  <span>Wildfire</span>
</div>`,
      },
    ],
  },
};
