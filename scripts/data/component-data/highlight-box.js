export default {
  'components-highlightbox': {
    vanillaHtml: true,
    description: 'Highlighted content box. Tones: default, primary, secondary. Layouts: centered, float-start, float-end. Supports embedded video.',
    cssClasses: [
      'mg-highlight-box',
      'mg-highlight-box--primary',
      'mg-highlight-box--secondary',
      'mg-highlight-box--centered',
      'mg-highlight-box--float-start',
      'mg-highlight-box--float-end',
    ],
    examples: [
      {
        name: 'Default highlight box',
        html: `<div class="mg-highlight-box">
  <h3>Key finding</h3>
  <p>Economic losses from disasters have increased by 250% in the last 20 years.</p>
</div>`,
      },
      {
        name: 'Primary centered highlight box',
        html: `<div class="mg-highlight-box mg-highlight-box--primary mg-highlight-box--centered">
  <h3>Did you know?</h3>
  <p>For every $1 invested in disaster risk reduction, up to $15 is saved in post-disaster recovery.</p>
</div>`,
      },
      {
        name: 'Float-start highlight box',
        html: `<div class="mg-highlight-box mg-highlight-box--secondary mg-highlight-box--float-start">
  <h4>Related statistic</h4>
  <p>90% of recorded major disasters caused by weather-related events.</p>
</div>
<p>The surrounding paragraph text will wrap around this floated highlight box. In RTL layouts, float-start floats to the right instead of the left.</p>`,
      },
      {
        name: 'Highlight box with embedded video',
        html: `<div class="mg-highlight-box mg-highlight-box--primary mg-highlight-box--centered">
  <figure>
    <h3>Related video</h3>
    <div class="mg-embed-container">
      <iframe src="https://www.youtube.com/embed/VIDEO_ID" title="Video title" allowfullscreen></iframe>
    </div>
    <figcaption>Video caption text</figcaption>
  </figure>
</div>`,
      },
    ],
  },
};
