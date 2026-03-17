/**
 * @file table.js
 * @source manual (metadata + curated HTML)
 *
 * All content is manually maintained. Update the HTML examples
 * when the component markup changes. See scripts/ai-manifest/README.md for
 * the entry schema and available fields.
 */

export default {
  'components-table': {
    vanillaHtml: true,
    description: 'Styled HTML table with size (small), variant (striped/border), and responsive (stacked/scroll) options.',
    cssClasses: [
      'mg-table',
      'mg-table--small',
      'mg-table--striped',
      'mg-table--border',
      'mg-table--stacked',
      'mg-table--scroll',
    ],
    examples: [
      {
        name: 'Default table',
        html: `<table class="mg-table">
  <thead>
    <tr>
      <th>Country</th>
      <th>Hazard type</th>
      <th>People affected</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Nepal</td>
      <td>Earthquake</td>
      <td>2.8 million</td>
    </tr>
    <tr>
      <td>Philippines</td>
      <td>Typhoon</td>
      <td>4.1 million</td>
    </tr>
  </tbody>
</table>`,
      },
      {
        name: 'Striped scrollable table',
        html: `<table class="mg-table mg-table--striped mg-table--scroll" tabindex="0">
  <thead>
    <tr>
      <th>Year</th>
      <th>Events</th>
      <th>Deaths</th>
      <th>Economic losses (USD)</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>2022</td><td>387</td><td>30,704</td><td>$224 billion</td></tr>
    <tr><td>2023</td><td>399</td><td>86,473</td><td>$280 billion</td></tr>
  </tbody>
</table>`,
      },
    ],
  },
};
