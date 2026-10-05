#!/usr/bin/env node
/** Actual offline source render contracts; no native or remote acceptance. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { JSDOM } = require('jsdom');
const {
  buildSearchFixtures,
  buildSearchFixturesSync,
  createSearchSourceLoader,
  guardSearchSources,
  SOURCE_HASHES,
} = require('../../../scripts/figma-search-fixtures.cjs');
const root = path.resolve(__dirname, '../../..');
const base = 'stories/Components/SyndicationSearchWidget/';
const documentOf = html => new JSDOM(html).window.document;
async function main() {
  const before = { window: global.window, DOMParser: global.DOMParser };
  const dom = new JSDOM('');
  global.window = dom.window;
  global.DOMParser = dom.window.DOMParser;
  const temporary = fs.mkdtempSync(
    path.join(os.tmpdir(), 'mangrove-search-source-')
  );
  try {
    const packet = await buildSearchFixtures({ root });
    assert.strictEqual(
      JSON.stringify(packet),
      JSON.stringify(await buildSearchFixtures({ root }))
    );
    const syncPacket = buildSearchFixturesSync({ root });
    assert.strictEqual(typeof syncPacket.then, 'undefined');
    assert.strictEqual(JSON.stringify(packet), JSON.stringify(syncPacket));
    assert.strictEqual(packet.provenance.remoteResponseCaptured, false);
    assert.strictEqual(packet.provenance.imageAssetsVerified, false);
    assert.strictEqual(Object.keys(packet.presets).length, 20);
    assert.strictEqual(packet.presets.Default.showSearchTimer, true);
    const source = await createSearchSourceLoader({ root });
    const constants = source.load(base + 'utils/constants.js');
    const context = source.load(base + 'context/SearchContext.jsx');
    assert.strictEqual(constants.DEFAULT_CONFIG.showSearchTimer, false);
    assert.strictEqual(
      constants.resolveFacetsLayout(packet.presets.HiddenFacets),
      false
    );
    assert.strictEqual(
      constants.resolveFacetsLayout(packet.presets.HorizontalFacets),
      'horizontal'
    );
    assert.strictEqual(
      constants.resolveFacetsLayout({ facets: 'sidebar', showFacets: false }),
      'sidebar'
    );
    assert.deepStrictEqual(
      packet.presets.SyndicatedPublicationBooks.customFilters,
      ['type:publication']
    );
    assert.strictEqual(
      packet.presets.SyndicatedPublicationBooks.displayMode,
      'card-book'
    );
    assert.strictEqual(
      packet.presets.SyndicatedCards.defaultQuery,
      'early warning systems'
    );
    assert.deepStrictEqual(packet.presets.SyndicatedCards.visibleTeaserFields, {
      image: true,
      contentType: false,
      publicationType: false,
      date: true,
      summary: false,
      siteName: false,
      organization: false,
    });
    for (const name of ['SyndicatedPublicationBooks', 'SyndicatedCards'])
      for (const key of [
        'showSearchBox',
        'showFacets',
        'showActiveFilters',
        'showResultsCount',
        'showSearchTimer',
        'showPager',
      ])
        assert.strictEqual(packet.presets[name][key], false);
    const { ResultItem, swapCardVariant, stripHiddenTeaserFields } =
      source.load(base + 'components/ResultItem.jsx');
    const renderResult = (hit, props = {}) =>
      documentOf(
        renderToStaticMarkup(React.createElement(ResultItem, { hit, ...props }))
      );
    assert(
      renderResult(packet.hits.authoredTeaser).querySelector('.mg-card__hc')
    );
    assert(
      renderResult(packet.hits.authoredTeaser, {
        displayMode: 'card',
      }).querySelector('.mg-card__vc')
    );
    assert(
      renderResult(packet.hits.authoredTeaser, {
        displayMode: 'card-book',
      }).querySelector('.mg-card__book')
    );
    const book = swapCardVariant(
      '<img src="https://www.undrr.org/sites/default/files/styles/landscape_16_9/public/2023-06/photo.jpg?itok=abc">',
      'card-book'
    );
    assert(book.includes('/styles/por/public/'));
    assert(
      swapCardVariant(book, 'card').includes('/styles/landscape_16_9/public/')
    );
    assert.strictEqual(
      renderResult(packet.hits.authoredTeaser).querySelector('a').href,
      'https://www.undrr.org/node/1'
    );
    const org = renderResult(packet.hits.authoredOrganization);
    assert.strictEqual(
      org.querySelector('a').href,
      'https://www.preventionweb.net/node/456'
    );
    assert(org.querySelector('.mg-tag'));
    assert(!org.querySelector('.mg-search__result-site-name'));
    assert(
      renderResult(packet.hits.authoredMissingDomain).querySelector(
        '.mg-search__result--error'
      )
    );
    const taxonomy = renderResult(packet.hits.structuralTaxonomy);
    assert.strictEqual(
      taxonomy.querySelector('.mg-search__result-type').textContent,
      'Hazard'
    );
    assert(!taxonomy.querySelector('time'));
    assert(
      taxonomy
        .querySelector('a')
        .href.startsWith('https://www.preventionweb.net/')
    );
    const highlighted = renderResult(packet.hits.structuralHighlight);
    assert.strictEqual(
      highlighted.querySelector('h3 em').textContent,
      'Climate'
    );
    assert(highlighted.querySelector('.mg-search__result-snippet em'));
    // Explicit structural selector probes, not endpoint examples or visual assets.
    const fields = Object.entries(packet.teaserFields);
    const fieldHtml =
      fields
        .map(
          ([key, value]) =>
            `<div class="${value.selector.slice(1)}">${key}</div>`
        )
        .join('') + '<h3>Title retained</h3>';
    for (const [key, value] of fields) {
      const filtered = documentOf(
        stripHiddenTeaserFields(fieldHtml, { [key]: false })
      );
      assert(!filtered.querySelector(value.selector));
      assert.strictEqual(
        filtered.querySelector('h3').textContent,
        'Title retained'
      );
      for (const [other, config] of fields)
        if (other !== key) assert(filtered.querySelector(config.selector));
    }
    const hidden = renderResult(packet.hits.structuralHighlight, {
      visibleTeaserFields: {
        date: false,
        siteName: false,
        summary: false,
        contentType: false,
      },
    });
    assert(hidden.querySelector('h3 em'));
    assert(!hidden.querySelector('.mg-search__result-meta'));
    assert(!hidden.querySelector('.mg-search__result-snippet'));
    let activeState = packet.states.initializing;
    let activeConfig = packet.presets.Default;
    // Mutate this isolated loader's context exports only; host require cache untouched.
    context.useSearchState = () => activeState;
    context.useSearchConfig = () => activeConfig;
    context.useSearchDispatch = () => () => {};
    const { SearchResults } = source.load(
      base + 'components/SearchResults.jsx'
    );
    const renderState = (name, props = {}) => {
      activeState = packet.states[name];
      return documentOf(
        renderToStaticMarkup(React.createElement(SearchResults, props))
      );
    };
    assert(
      renderState('initializing').querySelector(
        '.mg-search__results-placeholder'
      )
    );
    assert(renderState('error').querySelector('[role="alert"] strong'));
    assert(
      renderState('initialEmpty')
        .querySelector('.mg-search__results-hint')
        .textContent.includes('3')
    );
    assert(
      renderState('queryEmpty')
        .querySelector('[role="status"]')
        .textContent.includes('climate change')
    );
    assert.strictEqual(
      renderState('initialLoading').querySelectorAll(
        '.mg-search__skeleton-item'
      ).length,
      5
    );
    activeConfig = packet.presets.SyndicatedPublicationBooks;
    assert.strictEqual(
      renderState('initialLoading').querySelectorAll(
        '.mg-search__skeleton-card'
      ).length,
      4
    );
    activeConfig = packet.presets.Default;
    assert(
      renderState('populated')
        .querySelector('.mg-search__results-count')
        .textContent.includes('of 40 results')
    );
    assert(
      renderState('approximate')
        .querySelector('.mg-search__results-count')
        .textContent.includes('more than 40')
    );
    assert.strictEqual(
      renderState('loadingWithResults', { isStale: true }).querySelector(
        '.mg-search__results'
      ).style.opacity,
      '0.7'
    );
    assert(renderState('populated').querySelector('.mg-pager'));
    activeState = { ...packet.states.populated, totalResults: 1 };
    assert(
      !documentOf(
        renderToStaticMarkup(React.createElement(SearchResults))
      ).querySelector('.mg-pager')
    );
    assert.deepStrictEqual(Object.keys(packet.labels).sort(), [
      'AR',
      'EN',
      'ES',
      'FR',
      'JA',
      'RU',
      'ZH',
    ]);
    assert.strictEqual(
      packet.labels.AR.srResultsFoundPluralForQuery.kind,
      'function'
    );
    assert.strictEqual(
      packet.labels.RU.srResultsFoundPluralForQuery.kind,
      'function'
    );
    assert(
      new Set(
        packet.labels.AR.srResultsFoundPluralForQuery.samples.map(s => s.text)
      ).size > 1
    );
    const hydration = source.load(
      base + 'SyndicationSearchWidget.fromElement.js'
    ).default;
    assert.strictEqual(
      hydration({
        dataset: {
          enableHashSync: 'auto',
          facets: 'false',
          resultsPerPage: '4',
        },
      }).config.enableHashSync,
      'auto'
    );
    assert.deepStrictEqual(
      hydration({ dataset: { customFilters: 'bad JSON' } }),
      { config: {} }
    );
    // Real isolated source copy makes drift rejection independent of monkeypatching fs.
    for (const file of Object.keys(SOURCE_HASHES)) {
      const target = path.join(temporary, file);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(path.join(root, file), target);
    }
    guardSearchSources(temporary);
    for (const file of [
      base + 'components/ResultItem.jsx',
      base + 'SyndicationSearchWidget.Integrations.stories.jsx',
      base + '_labels.js',
    ]) {
      const target = path.join(temporary, file),
        original = fs.readFileSync(target);
      fs.appendFileSync(target, '\n// source drift\n');
      assert.throws(() => guardSearchSources(temporary), /needs updating/);
      await assert.rejects(
        buildSearchFixtures({ root: temporary }),
        /needs updating/
      );
      fs.writeFileSync(target, original);
    }
    console.log(
      'Search fixtures: 20 authored configs, eight state probes, seven field probes, actual result/domain/book/label render contracts and source drift guards passed. No browser/native acceptance.'
    );
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
    for (const [key, value] of Object.entries(before)) {
      if (value === undefined) delete global[key];
      else global[key] = value;
    }
    dom.window.close();
  }
}
if (require.main === module)
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
module.exports = { main };
