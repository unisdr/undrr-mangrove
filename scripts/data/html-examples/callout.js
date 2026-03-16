export default {
  'components-callout': {
    vanillaHtml: true,
    description: 'Styled blockquote with optional color accent (yellow, red, green, blue) and citation.',
    cssClasses: ['blockquote', 'yellow', 'red', 'green', 'blue'],
    examples: [
      {
        name: 'Default blockquote',
        html: `<blockquote>
  Disasters are not natural. They result from the failure to manage risk.
  <cite>UNDRR</cite>
</blockquote>`,
      },
      {
        name: 'Colored blockquote',
        html: `<div class="blockquote blue">
  <blockquote>
    Investing in disaster risk reduction saves lives and livelihoods.
    <cite>Sendai Framework</cite>
  </blockquote>
</div>`,
      },
    ],
  },
};
