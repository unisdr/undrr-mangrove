export default {
  'components-quotehighlight': {
    vanillaHtml: true,
    cssClasses: [
      'mg-quote-highlight',
      'mg-quote-highlight--light',
      'mg-quote-highlight--dark',
      'mg-quote-highlight--bright',
      'mg-quote-highlight--line',
      'mg-quote-highlight--image',
      'mg-quote-highlight--full',
      'mg-quote-highlight--left',
      'mg-quote-highlight--right',
      'mg-quote-highlight--has-image',
      'mg-quote-highlight__content',
      'mg-quote-highlight__quote',
      'mg-quote-highlight__separator',
      'mg-quote-highlight__attribution',
      'mg-quote-highlight__attribution-wrapper',
      'mg-quote-highlight__portrait-container',
      'mg-quote-highlight__portrait',
      'mg-quote-highlight__attribution-text',
      'mg-quote-highlight__attribution-name',
      'mg-quote-highlight__attribution-title',
      'mg-quote-highlight__image-container',
      'mg-quote-highlight__image',
    ],
    examples: [
      {
        name: 'Quote with line separator and attribution',
        html: `<section class="mg-quote-highlight mg-quote-highlight--light mg-quote-highlight--line mg-quote-highlight--full">
  <div class="mg-quote-highlight__content">
    <blockquote class="mg-quote-highlight__quote">
      <p>Prevention is not a cost. It is an investment in our common future.</p>
    </blockquote>
    <div class="mg-quote-highlight__separator"></div>
    <div class="mg-quote-highlight__attribution">
      <div class="mg-quote-highlight__attribution-wrapper">
        <div class="mg-quote-highlight__attribution-text">
          <p class="mg-quote-highlight__attribution-name">Mami Mizutori</p>
          <p class="mg-quote-highlight__attribution-title">Special Representative of the Secretary-General for Disaster Risk Reduction</p>
        </div>
      </div>
    </div>
  </div>
</section>`,
      },
      {
        name: 'Quote with portrait image',
        html: `<section class="mg-quote-highlight mg-quote-highlight--light mg-quote-highlight--line mg-quote-highlight--full mg-quote-highlight--has-image">
  <div class="mg-quote-highlight__content">
    <blockquote class="mg-quote-highlight__quote">
      <p>Building resilience requires a whole-of-society approach.</p>
    </blockquote>
    <div class="mg-quote-highlight__separator"></div>
    <div class="mg-quote-highlight__attribution">
      <div class="mg-quote-highlight__attribution-wrapper">
        <div class="mg-quote-highlight__portrait-container">
          <img src="https://picsum.photos/100/100" alt="Speaker portrait" class="mg-quote-highlight__portrait" />
        </div>
        <div class="mg-quote-highlight__attribution-text">
          <p class="mg-quote-highlight__attribution-name">Speaker name</p>
          <p class="mg-quote-highlight__attribution-title">Role, Organization</p>
        </div>
      </div>
    </div>
  </div>
</section>`,
      },
    ],
  },
};
