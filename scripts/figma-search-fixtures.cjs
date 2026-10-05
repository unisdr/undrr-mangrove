/** Source-authored offline search fixtures. No native or endpoint acceptance. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const BASE = 'stories/Components/SyndicationSearchWidget/';
const SOURCE_HASHES = {
  'stories/Components/SyndicationSearchWidget/SyndicationSearchWidget.DisplayModes.stories.jsx':
    '106f693ad3984e8bfffc8437235842a67be89fadff6a4e008f20d4bfc85a816d',
  'stories/Components/SyndicationSearchWidget/SyndicationSearchWidget.Filters.stories.jsx':
    'f5f5b2c40e240043b9887599d25c660de8238e569bb0ccd8afb7b4bbc5d8f02c',
  'stories/Components/SyndicationSearchWidget/SyndicationSearchWidget.Integrations.stories.jsx':
    'db1a21c42ac22c827684255c616cbb84669191178b56f198d180c1b85de68550',
  'stories/Components/SyndicationSearchWidget/SyndicationSearchWidget.Layouts.stories.jsx':
    'ceff69cad8eaa0c9ac31a88227df5b4af1e4d07d28a65c70881a12fc6152eeb9',
  'stories/Components/SyndicationSearchWidget/SyndicationSearchWidget.Toggles.stories.jsx':
    '6c15c5f277d6a51b07d714dd494b525e6099fbf10f070f27aca957cb926a2400',
  'stories/Components/SyndicationSearchWidget/SyndicationSearchWidget.fromElement.js':
    'e36b6a29a096565887e47acb9c5803354b11dbc48e2bc8de5894cc886479ac9a',
  'stories/Components/SyndicationSearchWidget/SyndicationSearchWidget.hydrate.js':
    '50d7140ef830e1858382787462fe539d32563f04b75339c301660e2eb8e931e8',
  'stories/Components/SyndicationSearchWidget/SyndicationSearchWidget.jsx':
    'd6a28d567b75c3f2f67b5d8f8cf1549a5c7023d4690c270bdc1ce74221bf5f54',
  'stories/Components/SyndicationSearchWidget/SyndicationSearchWidget.mdx':
    'b762414dad441fdccb34ce7fef0ab773a699ca98ceb045a3f22b5bfc249fad8b',
  'stories/Components/SyndicationSearchWidget/SyndicationSearchWidget.stories.jsx':
    '669618d518b36dffe8199ce8015886f21b907e264a08306c1d8678f4e0cd8e86',
  'stories/Components/SyndicationSearchWidget/__tests__/ResultItem.test.jsx':
    'ad4070b70ca5c3165fb09861aac30fb48e84d4b72de06f0a48400b53332b8ba0',
  'stories/Components/SyndicationSearchWidget/__tests__/taxonomyHelpers.test.js':
    'a960d6330a43c72bc606e198f8e9f9ee5d938e5912095e3a3136e9cda1c01097',
  'stories/Components/SyndicationSearchWidget/_deprecated-teaser-hide.scss':
    '11395ee01d7088082d03fd6ce8262b18b68fe3fc06503bf5445d642f27704fe6',
  'stories/Components/SyndicationSearchWidget/_labels.js':
    'c90fcf8b62c9441b3071f083a0fb1f2ae7887647fffcacf99b7d71a95c4fa684',
  'stories/Components/SyndicationSearchWidget/_storyHelpers.jsx':
    '74c46a2f83f542e691ab80ba698add7b03c21b910cb09f168ace736ffa7e9acc',
  'stories/Components/SyndicationSearchWidget/components/ActiveFilters.jsx':
    '05702c6912702e8dbcfbb30cfe07dbdc137c59b95e521cce6f57f2cd6fef7e9a',
  'stories/Components/SyndicationSearchWidget/components/CustomFacetSelect.jsx':
    '33ccd5cd7ee53fcf12d95902277dd4a18a1c7b2b9a211bf86c965a0b614b4b38',
  'stories/Components/SyndicationSearchWidget/components/FacetSelect.jsx':
    '94b9504bba493fe11c4b3882e50f167574eb091c1479bfecd3e6a6aec9c05cf2',
  'stories/Components/SyndicationSearchWidget/components/FacetsSidebar.jsx':
    '2881ff8965ef32ac3403103a6e73fba9b2a3f52592a35baa7a9352f08678bdea',
  'stories/Components/SyndicationSearchWidget/components/MobileFilterDrawer.jsx':
    '43e877f56cd7fbb1ba7adccec01c72010a924ba039bc58a788f5e1fe01efb95d',
  'stories/Components/SyndicationSearchWidget/components/Pager.jsx':
    '788dc4fc6ffd9a7dc096db4ecb6fa297a749a372b79c3b77a49c12da44f5170e',
  'stories/Components/SyndicationSearchWidget/components/ResultItem.jsx':
    'bc3cf6982b49f6db288efb7d58ecdc3832af9504b2902394d382c082e7e8e963',
  'stories/Components/SyndicationSearchWidget/components/SearchForm.jsx':
    'de4ace9c5e540d32b52a215eb793404d8e7e88ad5dd0eadfa79ef1d18caf00ed',
  'stories/Components/SyndicationSearchWidget/components/SearchResults.jsx':
    '0d12a347af9ab60d5c91831cd3b190f44fe5a7fa7cd78173e7c67685b00948af',
  'stories/Components/SyndicationSearchWidget/components/SelectDropdown.jsx':
    '0667d2db8d6a95e1b92158ae0b7845489f4ef4a63e6fec3ba7c3fd58e5a24f69',
  'stories/Components/SyndicationSearchWidget/components/SortOptions.jsx':
    'fb1ba664692c0bf87b5b34495bbb8b59d34f68b83f737aa32f636a1d65842243',
  'stories/Components/SyndicationSearchWidget/context/SearchContext.jsx':
    'd2d156180d49559b83f469fde8a65f50689734acd2bd119dce47e245ccf0bad0',
  'stories/Components/SyndicationSearchWidget/hooks/useHashSync.js':
    'ae951c21101b2f371e4401929b87eff47952c5dc08d14a01bec3913c01774676',
  'stories/Components/SyndicationSearchWidget/hooks/useSearch.js':
    '0920c3eb0675a24ba0def144707a63a5f8c043df57c1e1685319d9ceb453c7f0',
  'stories/Components/SyndicationSearchWidget/hooks/useTaxonomies.js':
    '9d68e8643190f30fbe79d7a89ef204bf97161eef0703b7d5eaf9297fa17b6e0d',
  'stories/Components/SyndicationSearchWidget/index.js':
    '0f81d84662ae5ca5c763e09db5d11b490d7c58010e265875f9206431ce0d4c8d',
  'stories/Components/SyndicationSearchWidget/syndication-search-widget.scss':
    'ae020f3badf3c217cabb9a1faa0cc95bbe65555882926d6c555ab153df6f1111',
  'stories/Components/SyndicationSearchWidget/utils/constants.js':
    'c727eeb134f0043e38e17e66b6797973f63f711258f2fca2db9fa5050dade3f2',
  'stories/Components/SyndicationSearchWidget/utils/facetUtils.js':
    'dbd0210b305ae5109f63be3b86f32d6530e3595237f7f6ecfd9bdd408e426bda',
  'stories/Components/SyndicationSearchWidget/utils/queryBuilder.js':
    'bad790a074fcf7374a3a6fe0de7a2cb163b240750b06c6ec8c25ebb750d0701f',
  'stories/Components/Pager/Pager.jsx':
    '24de08c1bf51864a8aae0fc0a7ac5e1945d2be12334bdcfbc2e620da685acd73',
};
const copy = value => JSON.parse(JSON.stringify(value));
function guardSearchSources(root = ROOT) {
  for (const [file, expected] of Object.entries(SOURCE_HASHES)) {
    const actual = crypto
      .createHash('sha256')
      .update(fs.readFileSync(path.join(root, file)))
      .digest('hex');
    if (actual !== expected)
      throw new Error(`Search fixture source contract needs updating: ${file}`);
  }
}
async function createSearchSourceLoader({ root = ROOT } = {}) {
  guardSearchSources(root);
  const [babel, modules, reactPreset] = await Promise.all([
    import('@babel/core'),
    import('@babel/plugin-transform-modules-commonjs'),
    import('@babel/preset-react'),
  ]);
  const options = {
    configFile: false,
    babelrc: false,
    plugins: [modules.default],
    presets: [[reactPreset.default, { development: false }]],
  };
  const cache = new Map();
  function evaluate(code, filename) {
    const module = { exports: {} };
    cache.set(filename, module);
    const localRequire = specifier => {
      if (!specifier.startsWith('.')) return require(specifier);
      const candidate = path.resolve(path.dirname(filename), specifier);
      const resolved = [
        candidate,
        candidate + '.js',
        candidate + '.jsx',
        path.join(candidate, 'index.js'),
      ].find(p => fs.existsSync(p) && fs.statSync(p).isFile());
      if (!resolved || !resolved.startsWith(path.resolve(root) + path.sep))
        throw new Error(`Unsupported source dependency: ${specifier}`);
      return load(path.relative(root, resolved));
    };
    vm.runInThisContext(`(function(require,module,exports){${code}\n})`, {
      filename,
    })(localRequire, module, module.exports);
    return module.exports;
  }
  function load(relative) {
    const filename = path.resolve(root, relative);
    if (!filename.startsWith(path.resolve(root) + path.sep))
      throw new Error('Source path escapes repository');
    if (cache.has(filename)) return cache.get(filename).exports;
    if (/\.(scss|css|svg|png|jpg)$/.test(filename)) return {};
    return evaluate(
      babel.transformSync(fs.readFileSync(filename, 'utf8'), {
        ...options,
        filename,
      }).code,
      filename
    );
  }
  function declarations(relative, names) {
    const filename = path.resolve(root, relative);
    const ast = babel.parseSync(fs.readFileSync(filename, 'utf8'), {
      ...options,
      filename,
    });
    const found = new Map();
    function visit(value) {
      if (!value || typeof value !== 'object') return;
      if (value.type === 'VariableDeclarator' && names.includes(value.id?.name))
        found.set(value.id.name, value);
      for (const [key, child] of Object.entries(value)) {
        if (['loc', 'start', 'end'].includes(key)) continue;
        if (Array.isArray(child)) child.forEach(visit);
        else visit(child);
      }
    }
    visit(ast);
    if (found.size !== names.length)
      throw new Error('Missing authored fixture declarations');
    ast.program.body = names.map(name => ({
      type: 'VariableDeclaration',
      kind: 'const',
      declarations: [found.get(name)],
    }));
    const code = babel.transformFromAstSync(ast, null, {
      ...options,
      filename,
    }).code;
    return evaluate(
      code + `\nmodule.exports = {${names.join(',')}};`,
      filename + '.fixture'
    );
  }
  return { load, declarations };
}
async function buildSearchFixtures({ root = ROOT } = {}) {
  const source = await createSearchSourceLoader({ root });
  const constants = source.load(BASE + 'utils/constants.js');
  const context = source.load(BASE + 'context/SearchContext.jsx');
  const authored = source.declarations(BASE + '__tests__/ResultItem.test.jsx', [
    'TEASER_HC',
    'TEASER_VC',
    'createHit',
    'orgTeaser',
  ]);
  const initial = source.declarations(BASE + 'context/SearchContext.jsx', [
    'initialState',
  ]).initialState;
  const presets = {};
  for (const group of [
    '',
    '.Layouts',
    '.DisplayModes',
    '.Filters',
    '.Integrations',
    '.Toggles',
  ]) {
    const stories = source.load(
      BASE + `SyndicationSearchWidget${group}.stories.jsx`
    );
    for (const [name, story] of Object.entries(stories)) {
      if (name !== 'default' && story?.args?.config)
        presets[name] = copy({
          ...constants.DEFAULT_CONFIG,
          ...story.args.config,
        });
    }
  }
  const hits = {
    authoredTeaser: authored.createHit(),
    authoredFallback: authored.createHit({ teaser: null }),
    authoredMissingDomain: authored.createHit({
      field_domain_access: undefined,
    }),
    authoredOrganization: authored.createHit({
      type: 'organization',
      field_domain_access: ['afrp_undrr_org'],
      teaser: authored.orgTeaser,
    }),
    structuralTaxonomy: {
      ...authored.createHit({
        nid: undefined,
        vid: 'hazard',
        teaser: null,
        field_domain_access: undefined,
      }),
      _id: 'structural-taxonomy',
    },
    structuralHighlight: {
      ...authored.createHit({ teaser: null }),
      highlight: {
        title: ['<em>Climate</em> Change Report'],
        body: ['<em>Climate</em>'],
      },
    },
  };
  const state = overrides => copy({ ...initial, ...overrides });
  const states = {
    initializing: state({ isInitialized: false }),
    initialEmpty: state({ isInitialized: true }),
    queryEmpty: state({
      isInitialized: true,
      query: 'climate change',
      results: [],
      totalResults: 0,
    }),
    initialLoading: state({
      isInitialized: true,
      isLoading: true,
      query: 'climate change',
    }),
    error: state({
      isInitialized: true,
      error: 'Offline structural error fixture',
    }),
    populated: state({
      isInitialized: true,
      query: 'climate change',
      results: [hits.authoredTeaser],
      totalResults: 40,
      totalResultsRelation: 'eq',
      searchTime: 10,
    }),
    approximate: state({
      isInitialized: true,
      query: 'climate change',
      results: [hits.authoredTeaser],
      totalResults: 40,
      totalResultsRelation: 'gte',
      searchTime: 10,
    }),
    loadingWithResults: state({
      isInitialized: true,
      query: 'climate change',
      results: [hits.authoredTeaser],
      totalResults: 40,
      isLoading: true,
    }),
  };
  const localeModules = source.load(BASE + '_labels.js');
  const labels = {};
  for (const [name, overrides] of Object.entries({
    EN: {},
    ...Object.fromEntries(
      Object.entries(localeModules).map(([name, value]) => [
        name.replace('LABELS_', ''),
        value,
      ])
    ),
  })) {
    const merged = { ...context.DEFAULT_LABELS, ...overrides };
    labels[name] = Object.fromEntries(
      Object.entries(merged).map(([key, value]) => [
        key,
        typeof value === 'function'
          ? {
              kind: 'function',
              samples: [0, 1, 2, 3, 11, 100].map(count => ({
                count,
                text: context.interpolateLabel(value, { count }),
              })),
            }
          : value,
      ])
    );
  }
  return {
    schemaVersion: 1,
    kind: 'source-only-search-fixtures',
    provenance: {
      sourceHashes: SOURCE_HASHES,
      authoredData: BASE + '__tests__/ResultItem.test.jsx',
      structuralProbes: [
        'structuralTaxonomy',
        'structuralHighlight',
        'state transitions and count/error values',
      ],
      remoteResponseCaptured: false,
      imageAssetsVerified: false,
    },
    presets,
    hits,
    states,
    labels,
    teaserFields: copy(constants.TEASER_FIELDS),
    responsiveBoundaries: [480, 481, 768, 769, 800, 801, 899, 900, 1163, 1164],
  };
}
module.exports = {
  buildSearchFixtures,
  createSearchSourceLoader,
  guardSearchSources,
  SOURCE_HASHES,
};
if (require.main === module)
  buildSearchFixtures()
    .then(packet =>
      process.stdout.write(JSON.stringify(packet, null, 2) + '\n')
    )
    .catch(error => {
      process.stderr.write(error.message + '\n');
      process.exitCode = 1;
    });
