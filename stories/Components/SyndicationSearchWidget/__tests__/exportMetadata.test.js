import {
  exportSummary,
  needsExportTaxonomies,
  withExportTaxonomyNames,
  ExportTaxonomyError,
} from '../utils/exportMetadata';
import {
  exportColumns,
  exportRecord,
  exportCsv,
  exportJson,
} from '../utils/exportResults';

const record = {
  ...exportRecord({ _id: '42', _source: {} }),
  hazard_ids: ['2', '1'],
};

test('summary extracts the displayed description with decoded entities and block boundaries', () => {
  const html =
    '<h2>Title</h2><div class="mg-card__description"><p>Risk &amp; resilience</p><p>Second<br>line.</p><a href="/more">Read more</a></div><footer>Source</footer>';
  expect(exportSummary(html, document)).toBe(
    'Risk & resilience Second line. Read more'
  );
  expect(exportSummary([html], document)).toBe(exportSummary(html, document));
});

test.each([
  '',
  '<h2>No description</h2>',
  '<div hidden><p class="mg-card__description">Hidden</p></div>',
])('missing or hidden summary remains empty for %s', html => {
  expect(exportSummary(html, document)).toBe('');
});

test('summary excludes executable and hidden content without attaching markup', () => {
  const html =
    '<div class="mg-card__description">Visible<script>window.leakedSummary = true</script><style>.hide{}</style><template>Secret</template><span hidden>Hidden</span><span aria-hidden="true">Decoration</span><img src="/not-fetched" onerror="window.leakedSummary = true"></div>';
  expect(exportSummary(html, document)).toBe('Visible');
  expect(window.leakedSummary).toBeUndefined();
  expect(document.querySelector('img[src="/not-fetched"]')).toBeNull();
  expect(exportSummary(html)).toBe('');
});

test.each(['country_region', 'hazard', 'theme'])(
  'taxonomy %s selection retains paired IDs and names',
  key => {
    for (const suffix of ['ids', 'names']) {
      expect(exportColumns([`${key}_${suffix}`])).toEqual([
        'id',
        'url',
        `${key}_ids`,
        `${key}_names`,
      ]);
    }
  }
);

test('names preserve ID order and are only required for selected nonempty fields', () => {
  expect(needsExportTaxonomies([record], ['hazard_names'])).toBe(true);
  expect(needsExportTaxonomies([record], ['title'])).toBe(false);
  expect(needsExportTaxonomies([record], ['theme_names'])).toBe(false);
  const named = withExportTaxonomyNames(
    [record],
    ['hazard_names'],
    new Map([
      ['1', 'Drought'],
      ['2', 'Flood'],
    ])
  );
  expect(named[0].hazard_names).toEqual(['Flood', 'Drought']);
  expect(record.hazard_names).toEqual([]);
  expect(() =>
    withExportTaxonomyNames(
      [record],
      ['hazard_names'],
      new Map([['2', 'Flood']])
    )
  ).toThrow(ExportTaxonomyError);
});

test('names and summary use existing CSV formula protection while JSON preserves plain text', () => {
  const named = {
    ...record,
    summary: '=SUM(1,2)',
    hazard_names: ['=Flood', 'Drought'],
  };
  expect(exportCsv([named], ['summary', 'hazard_names'])).toContain(
    "'=SUM(1,2)"
  );
  const json = JSON.parse(
    exportJson({ records: [named], total: 1, limited: false }, 1, [
      'summary',
      'hazard_names',
    ])
  );
  expect(json.records[0]).toMatchObject({
    summary: '=SUM(1,2)',
    hazard_names: ['=Flood', 'Drought'],
  });
  expect(json.scope.fields).toContain('hazard_ids');
});
