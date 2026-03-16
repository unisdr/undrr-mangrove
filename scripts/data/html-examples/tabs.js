export default {
  'components-tabs': {
    vanillaHtml: true,
    description: 'Tabbed content with stacked or horizontal variants. Requires tabs.js vanilla JS for interactivity.',
    cssClasses: [
      'mg-tabs',
      'mg-tabs--stacked',
      'mg-tabs--horizontal',
      'mg-tabs__list',
      'mg-tabs__item',
      'mg-tabs__link',
      'mg-tabs-content',
      'mg-tabs__section',
    ],
    examples: [
      {
        name: 'Stacked tabs (requires tabs.js for interactivity)',
        html: `<article class="mg-tabs" data-mg-js-tabs data-mg-js-tabs-variant="stacked">
  <ul class="mg-tabs__list">
    <li class="mg-tabs__item">
      <a class="mg-tabs__link" href="#mg-tabs__section-overview" data-mg-js-tabs-default="true">Overview</a>
    </li>
    <li class="mg-tabs__item">
      <a class="mg-tabs__link" href="#mg-tabs__section-details">Details</a>
    </li>
  </ul>
  <li class="mg-tabs-content" data-mg-js-tabs-content>
    <section class="mg-tabs__section" id="mg-tabs__section-overview">
      <p>Overview content goes here.</p>
    </section>
    <section class="mg-tabs__section" id="mg-tabs__section-details">
      <p>Detailed information goes here.</p>
    </section>
  </li>
</article>`,
      },
    ],
  },
};
