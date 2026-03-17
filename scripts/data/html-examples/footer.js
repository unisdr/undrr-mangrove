import {
  SYNDICATION_WIDGET_URL,
  SYNDICATION_DEFAULT_CONFIG as cfg,
} from '../constants.js';

export default {
  'components-footer': {
    vanillaHtml: true,
    description: 'Site footer with optional UNDRR syndication. Loads global footer content from PreventionWeb via a widget script. Works with or without React.',
    doNotModify: 'The Footer structure is a UNDRR branding requirement. Use the documented markup exactly as shown. Do not simplify, reorganize, or omit elements.',
    cssClasses: ['mg-footer'],
    vanillaHtmlEmbed: {
      description:
        'The UNDRR global footer can be embedded on any page using the PreventionWeb syndication widget. No React required. The widget script fetches footer content from PreventionWeb and injects it into the container element.',
      html: `<footer class="mg-footer">
  <!-- Your site-specific footer content -->
  <nav aria-label="Footer navigation">
    <ul>
      <li><a href="/about">About</a></li>
      <li><a href="/contact">Contact</a></li>
      <li><a href="/privacy">Privacy policy</a></li>
    </ul>
  </nav>

  <!-- UNDRR syndicated footer (content loads here) -->
  <div class="pw-widget-${cfg.suffixID}"></div>
</footer>

<script src="${SYNDICATION_WIDGET_URL}"></script>
<script>
  new PW_Widget.initialize({
    contenttype: '${cfg.contenttype}',
    pageid: '${cfg.pageid}',
    includecss: ${cfg.includecss},
    suffixID: '${cfg.suffixID}',
    activedomain: '${cfg.activedomain}'
  });
</script>`,
      configOptions: {
        contenttype: 'Type of syndicated content (e.g. landingpage)',
        pageid: 'PreventionWeb page ID to syndicate',
        includecss: 'Whether to include PreventionWeb default styles (set false when using Mangrove CSS)',
        suffixID: 'Unique suffix for the widget container class (creates pw-widget-{suffixID})',
        activedomain: 'Domain for absolute URLs in syndicated content',
      },
    },
    examples: [
      {
        name: 'Footer with syndicated content',
        html: `<footer class="mg-footer">
  <nav aria-label="Footer navigation">
    <ul>
      <li><a href="/about">About</a></li>
      <li><a href="/contact">Contact</a></li>
    </ul>
  </nav>
  <div class="pw-widget-${cfg.suffixID}"></div>
</footer>`,
      },
    ],
  },
};
