/** Source-authored widget fixtures and finite contextual composition candidates. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  buildSearchResultFixtures,
  guardResultSources,
} = require('./figma-search-result-recipes.cjs');
const ARTICLE = 'stories/Patterns/ArticleStory/ArticleStory.jsx';
const ARTICLE_SHA =
  '9ca2a8be73cec051545220f89b88847bda104de21bdac2aacf0265ea3a0b4327';
const copy = x => JSON.parse(JSON.stringify(x));
function sourceNewsData(root) {
  const bytes = fs.readFileSync(path.join(root, ARTICLE));
  if (crypto.createHash('sha256').update(bytes).digest('hex') !== ARTICLE_SHA)
    throw Error('Search widget authored news source needs updating');
  const ast = require('@babel/core').parseSync(bytes.toString(), {
    configFile: false,
    babelrc: false,
    parserOpts: { plugins: ['jsx'] },
  });
  const declarations = new Map();
  for (const item of ast.program.body)
    if (item.type === 'VariableDeclaration')
      for (const entry of item.declarations)
        declarations.set(entry.id.name, entry.init);
  const member = (node, name) =>
    node.properties.find(p => p.key.name === name)?.value;
  const english = member(declarations.get('words'), 'english');
  const records = member(english, 'relatedCards');
  if (records?.type !== 'ArrayExpression' || records.elements.length !== 3)
    throw Error(
      'Search widget requires actual three authored related news records'
    );
  const strings = node => {
    const obj = {};
    for (const p of node.properties) {
      if (p.value.type !== 'StringLiteral')
        throw Error('Unsupported authored news metadata');
      obj[p.key.name] = p.value.value;
    }
    return obj;
  };
  const image = declarations.get('relatedImage');
  if (image?.type !== 'StringLiteral')
    throw Error('Unsupported authored news image');
  return { cards: records.elements.map(strings), image: image.value };
}
/** Explicit frontend API inputs from authored source records, never captured server responses. */
function buildSearchWidgetFixtures({ root }) {
  guardResultSources(root);
  const result = buildSearchResultFixtures({ root });
  const original = result.original;
  const news = sourceNewsData(root);
  const customize = (hit, id) => ({ ...copy(hit), _id: id });
  const publications = [
    customize(result.imageHit, 'fixture-publication-image'),
    customize(original.hits.authoredFallback, 'fixture-publication-fallback'),
  ];
  const organization = customize(
    original.hits.authoredOrganization,
    'fixture-organization'
  );
  const newsHits = news.cards.map((card, index) => {
    const hit = customize(
      original.hits.authoredTeaser,
      'fixture-authored-news-' + (index + 1)
    );
    const url = 'https://www.undrr.org/news/related-story-' + (index + 1);
    hit._source.type = 'news';
    hit._source.title = card.title;
    hit._source.url = url;
    hit._source.teaser = hit._source.teaser
      .replaceAll('/node/1', url)
      .replace('/image.jpg', news.image)
      .replace('alt="Cover"', 'alt=""')
      .replace('>Title<', '>' + card.title + '<')
      .replace('Description summary text', card.summaryText);
    return hit;
  });
  const taxonomy = [];
  for (const facet of original.presets.CustomFacets.customFacets)
    for (const option of facet.options) {
      const match = /^(field_country_region|field_hazard):(\d+)$/.exec(
        option.query
      );
      if (!match)
        throw Error(
          'Search widget custom facet authored label/query contract changed'
        );
      taxonomy.push({
        id: match[2],
        name: option.label,
        sourceField: match[1],
        sourceQuery: option.query,
      });
    }
  const flood = taxonomy.find(t => t.sourceQuery === 'field_hazard:347');
  if (!flood || flood.name !== 'Flood')
    throw Error('Missing authored Flood fixture');
  const term = customize(
    original.hits.structuralTaxonomy,
    'fixture-authored-flood-term'
  );
  term._source.title = flood.name;
  term._source.tid = flood.id;
  term._source.url = '/taxonomy/term/' + flood.id;
  const aggregations = {
    type: {
      buckets: [
        { key: 'news', doc_count: 100 },
        { key: 'event', doc_count: 50 },
      ],
    },
    field_news_type: {
      buckets: [
        { key: '751', doc_count: 40 },
        { key: '752', doc_count: 20 },
      ],
    },
    field_hazard: {
      buckets: [
        { key: '347', doc_count: 40 },
        { key: '344', doc_count: 20 },
      ],
    },
    field_country_region: {
      buckets: [
        { key: '69', doc_count: 40 },
        { key: '70', doc_count: 20 },
      ],
    },
  };
  const envelope = hits => ({
    took: 10,
    hits: { total: { value: 40, relation: 'eq' }, hits: copy(hits) },
    aggregations: copy(aggregations),
  });
  const responses = {};
  for (const name of Object.keys(original.presets)) {
    const hits =
      name === 'SyndicatedPublicationBooks'
        ? publications
        : name === 'SyndicatedCards'
          ? newsHits
          : name === 'TaxonomyTermResults'
            ? [term, ...publications]
            : name === 'AllowedTypes'
              ? [...newsHits, ...publications]
              : [...publications, organization];
    responses[name] = envelope(hits);
  }
  return {
    kind: 'source-authored-search-widget-frontend-inputs',
    presets: copy(original.presets),
    responses,
    taxonomyResponse: {
      results: taxonomy.map(({ id, name }) => ({ id, name })),
    },
    operatorProbe: {
      field: 'field_hazard',
      selectedValues: ['347', '344'],
      operators: ['OR', 'AND'],
    },
    provenance: {
      remoteResponseCaptured: false,
      serverQueryFilteringVerified: false,
      newsMetadata:
        ARTICLE +
        ' words.english.relatedCards / relatedImage / authored mapped destinations',
      publicationMetadata: result.provenance,
      taxonomyLabels:
        'Exact CustomFacets authored label/query pairs; structural API projection, not a verified live taxonomy response',
      counts:
        'Type/subtype buckets copied from authored taxonomyHelpers fixture; hazard/region counts reuse those numbers as explicit structural probes',
      resultDate:
        'Existing ResultItem authored test date retained in derived news teaser; not actual publication metadata',
      identities:
        'Unique fixture envelope IDs preserve original test fixtures without duplicate React keys',
      newsImage: news.image,
      sourceHashes: { [ARTICLE]: ARTICLE_SHA },
    },
  };
}
const WIDGET_ASSETS = 'examples/figma-plugin/holistic/assets/search-widget/';
const WIDGET_CAPTURE_HASHES = {
  'source-footprints.json':
    '8106a252bee4fb4fe1e4e269c8844318b280755022f4414d46b6fbfa585d9ef0',
  'source-capture-receipt.json':
    '4dd10ca456e2e18a24202e0c0726030060bf5f319fc8dec5618d75845ee0f6cb',
  'authored-frontend-fixtures.json':
    'd09871c9ec04a0b1660b760d431f0e3f74e2a2fe3a44855b5e0a07e623610426',
};
function inspectSearchWidgetSource({ root }) {
  const input = buildSearchWidgetFixtures({ root });
  for (const [file, expected] of Object.entries(WIDGET_CAPTURE_HASHES))
    if (
      crypto
        .createHash('sha256')
        .update(fs.readFileSync(path.join(root, WIDGET_ASSETS, file)))
        .digest('hex') !== expected
    )
      throw Error('Search widget source capture drift: ' + file);
  const footprints = JSON.parse(
    fs.readFileSync(path.join(root, WIDGET_ASSETS, 'source-footprints.json'))
  );
  const fixtures = JSON.parse(
    fs.readFileSync(
      path.join(root, WIDGET_ASSETS, 'authored-frontend-fixtures.json')
    )
  );
  if (JSON.stringify(fixtures) !== JSON.stringify(input))
    throw Error('Search widget authored capture inputs changed');
  const cssHash = crypto
    .createHash('sha256')
    .update(fs.readFileSync(path.join(root, 'stories/assets/css/style.css')))
    .digest('hex');
  if (cssHash !== footprints.provenance.styleCssSha256)
    throw Error('Search widget generated source CSS changed');
  return footprints;
}
module.exports = { buildSearchWidgetFixtures, inspectSearchWidgetSource };

const CONTEXT_SOURCE_HASHES = {
  'stories/Atom/Icons/icons.scss':
    'e15a7a74a319eac6b2d5f48d18b3a5cdb908e50756b7fe638e52cd41a23459bb',
  'examples/figma-plugin/holistic/assets/card-content/bali-publication-cover.jpg':
    '4770262ae2ee8715facebeb0ff0c70b45ce8831e9fb36f79fafbeecfeed50370',
  'examples/figma-plugin/holistic/assets/search-results/bali-landscape.jpg':
    '5aef058e2b3e9d08cb8605406f4fc6bc31cd9424113a31594bb01fd1d309a5ea',
  'examples/figma-plugin/holistic/assets/news-detail/related-source-photo.jpg':
    'c85730db17a9ea844cfcba3d6239b9e94f6a4c0a6a8535855ed2d578c55a7b83',
};
const CAPACITY_HASHES = {
  'bali-landscape-source-photo.jpg':
    '7f864aee8880fb303d0b8f3a28b19761142a123fb90226b326895ab7fc6778a7',
  'image-provenance.json':
    '8c6cca823cfde933c34305bcdf4a05d412d28a45613ed43d86d46ac34b6066b3',
  'gradient-source-matrices.json':
    '84dc9894386c56ec2f689a3f82cd8590b9d3077f6c2b4b7adad19b4279e891f7',
  'capacity-footprints.json':
    '55feff7892be39b1d3206b506995104a61b92c9e61a9ab7a236176cdf98439f6',
  'mask-mirror.json':
    '81659d71d3be98f48e275788efb027542d4960bbe7f0197560611289fe103086',
  'source-fonts/Roboto-Italic.woff2':
    '884e654cef00224110fc62cdf8f1561ff08dcaa1f359e5c5f49dab62abfe79e8',
  'source-fonts/Roboto-Medium.woff2':
    '96025fe9db6578d8bc7f4b8be739750b1490e07221c2b1f16acde2ea7669cedf',
  'source-fonts/Roboto-Black.woff2':
    '41e55c257815e19c8e2384b6d1d5180590599a56f23f3eab417c5fc7aa553511',
  'source-fonts/LICENSE.txt':
    'c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4',
  'source-fonts/provenance.json':
    '95e5aa50d64c6be4ea367987a172f25dd5b0c9bdac239e3f9ee6b2ad72763efe',
  'capacity-comparison.json':
    'a5227d62a1c7e978ab81f756c09c0018841aee92048334c34339956bbe26a7e2',
};
function inspectSearchWidgetCapacity({ root }) {
  inspectSearchWidgetSource({ root });
  for (const [file, expected] of Object.entries(CONTEXT_SOURCE_HASHES))
    if (
      crypto
        .createHash('sha256')
        .update(fs.readFileSync(path.join(root, file)))
        .digest('hex') !== expected
    )
      throw Error('Search widget context source drift: ' + file);
  for (const [file, expected] of Object.entries(CAPACITY_HASHES))
    if (
      crypto
        .createHash('sha256')
        .update(fs.readFileSync(path.join(root, WIDGET_ASSETS, file)))
        .digest('hex') !== expected
    )
      throw Error('Search widget capacity capture drift: ' + file);
  const data = JSON.parse(
    fs.readFileSync(path.join(root, WIDGET_ASSETS, 'capacity-footprints.json'))
  );
  const comparison = JSON.parse(
    fs.readFileSync(path.join(root, WIDGET_ASSETS, 'capacity-comparison.json'))
  );
  if (
    comparison.sourceRecordsCompared !== 220 ||
    comparison.sourceRecordsExact !== 220 ||
    comparison.results.some(r => !r.sourceRecordsExact)
  )
    throw Error('Search widget supplementary source equivalence incomplete');
  return data;
}
/** Source-authored context composition. All layouts are finite source candidates. */
function buildSearchWidgetRecipes({ root, modes, variables, styles }) {
  const source = inspectSearchWidgetCapacity({ root });
  const hash = x => crypto.createHash('sha256').update(x).digest('hex');
  const fail = message => {
    throw Error('Search widget recipe needs updating: ' + message);
  };
  if (
    modes
      .map(m => m.id)
      .sort()
      .join(',') !== 'delta,irp,mcr,preventionweb,undrr'
  )
    fail('Five exact modes required');
  // Work against operation-local source arrays. A source/capability refusal must
  // not leave partially prepared caller styles or variables behind.
  const preparedVariables = copy(variables),
    preparedStyles = copy(styles);
  const controls =
    require('./figma-search-control-recipes.cjs').buildSearchControlRecipes({
      root,
      modes,
      variables: preparedVariables,
      styles: preparedStyles,
    });
  const byName = new Map();
  for (const v of preparedVariables) {
    if (byName.has(v.name)) fail('Duplicate role ' + v.name);
    byName.set(v.name, v);
  }
  function resolve(name, mode, type, seen = new Set()) {
    const v = byName.get(name);
    if (!v || v.type !== type || seen.has(name))
      fail('Missing/wrong-type/cyclic role ' + name);
    seen.add(name);
    const value = v.values[mode];
    if (value === undefined) fail('Missing mode value ' + name + '/' + mode);
    if (value && typeof value === 'object' && 'alias' in value) {
      if (Object.keys(value).length !== 1) fail('Malformed alias ' + name);
      return resolve(value.alias, mode, type, seen);
    }
    return value;
  }
  const resultEvidence = JSON.parse(
    fs.readFileSync(
      path.join(
        root,
        'examples/figma-plugin/holistic/assets/search-results/source-footprints.json'
      )
    )
  );
  for (const foundation of resultEvidence.foundations)
    for (const mode of modes) {
      if (
        byName.get(foundation.name)?.id !== foundation.id ||
        JSON.stringify(resolve(foundation.name, mode.id, foundation.type)) !==
          JSON.stringify(foundation.values[mode.id])
      )
        fail(
          'Measured source foundation changed ' +
            foundation.name +
            '/' +
            mode.id
        );
    }
  function upsert(list, entry, key) {
    const kind =
      list === preparedVariables
        ? 'VARIABLE'
        : list === preparedStyles.text
          ? 'TEXT'
          : 'EFFECT';
    if (kind !== 'VARIABLE')
      for (const other of Object.values(preparedStyles))
        if (
          Array.isArray(other) &&
          other !== list &&
          other.some(
            value => value.id === entry.id || value.name === entry.name
          )
        )
          fail('Foreign style kind identity ' + entry.id);
    const hits = list.filter(
      v => v.id === entry.id || v[key] === entry[key] || v.name === entry.name
    );
    if (
      hits.length > 1 ||
      (hits.length &&
        (hits[0].id !== entry.id ||
          hits[0][key] !== entry[key] ||
          hits[0].name !== entry.name ||
          (kind === 'VARIABLE'
            ? hits[0].type !== entry.type
            : hits[0].type !== undefined && hits[0].type !== kind)))
    )
      fail('Foreign identity ' + entry.id);
    if (hits.length && kind !== 'VARIABLE') {
      const existingValues = modes.map(mode => hits[0].values?.[mode.id]);
      if (
        Object.keys(hits[0].values || {}).length !== modes.length ||
        existingValues.some(value =>
          kind === 'TEXT'
            ? !value ||
              Array.isArray(value) ||
              typeof value !== 'object' ||
              !value.fontName
            : !Array.isArray(value)
        )
      )
        fail('Foreign style value kind identity ' + entry.id);
    }
    const index = list.indexOf(hits[0]);
    if (index < 0) list.push(entry);
    else list[index] = entry;
  }
  const vals = fn => Object.fromEntries(modes.map(m => [m.id, fn(m.id)]));
  const ref = {
    file: 'stories/Components/SyndicationSearchWidget/SyndicationSearchWidget.jsx',
    line: 56,
  };
  function role(kind, type, values) {
    if (
      type === 'FLOAT' &&
      Object.values(values).some(v => !Number.isFinite(v))
    )
      fail('Nonfinite source geometry');
    const name =
      'component/search-widget/' +
      kind +
      '-' +
      hash(JSON.stringify(values)).slice(0, 16);
    const entry = {
      id: name.replaceAll('/', '.'),
      name,
      type,
      scopes: ['ALL_SCOPES'],
      values,
      sourceRef: ref,
      description:
        'Finite source widget context; rebuild-selected-mode positions, no live CSS reflow claim.',
    };
    upsert(preparedVariables, entry, 'name');
    byName.set(name, entry);
    return name;
  }
  const number = (kind, values) => role(kind, 'FLOAT', values);
  const rgba = text => {
    const match = /^rgba?\(([^)]+)\)$/.exec(text);
    if (!match) fail('Unsupported source color ' + text);
    const a = match[1].split(',').map(Number);
    if (![3, 4].includes(a.length) || a.some(x => !Number.isFinite(x)))
      fail('Malformed color');
    return { r: a[0] / 255, g: a[1] / 255, b: a[2] / 255, a: a[3] ?? 1 };
  };
  function color(kind, values) {
    const paints = Object.fromEntries(
      modes.map(m => [m.id, rgba(values[m.id])])
    );
    for (const name of [
      'color/interactive',
      'color/text',
      'color/neutral-0',
      'color/neutral-25',
      'color/neutral-50',
      'color/neutral-100',
      'color/neutral-500',
      'color/blue-50',
      'color/blue-900',
      'color/button',
      'color/form-check',
      'color/form-check--checked',
    ]) {
      if (
        byName.has(name) &&
        modes.every(m => {
          const v = resolve(name, m.id, 'COLOR'),
            p = paints[m.id];
          return (
            p.a === (v.a ?? 1) &&
            ['r', 'g', 'b'].every(
              k => Math.round(p[k] * 255) === Math.round(v[k] * 255)
            )
          );
        })
      )
        return name;
    }
    return role(kind, 'COLOR', paints);
  }
  function style(all) {
    const values = vals(mode => {
      const s = source.styles[all[mode].styles];
      const family = s.fontFamily.includes('Roboto Condensed')
        ? 'Roboto Condensed'
        : s.fontFamily.startsWith('Roboto,')
          ? 'Roboto'
          : null;
      const weight = Number(s.fontWeight);
      if (
        !family ||
        ![400, 500, 600, 700, 900].includes(weight) ||
        !['normal', 'italic'].includes(s.fontStyle) ||
        s.textDecorationLine !== 'none'
      )
        fail('Unsupported actual source font/decoration');
      if (family === 'Roboto Condensed' && ![400, 500].includes(weight))
        fail('Unsupported source condensed face');
      const face =
        s.fontStyle === 'italic'
          ? weight === 400
            ? 'Italic'
            : null
          : family === 'Roboto Condensed'
            ? 'Regular'
            : {
                400: 'Regular',
                500: 'Medium',
                600: 'Bold',
                700: 'Bold',
                900: 'Black',
              }[weight];
      if (!face) fail('Unsupported source italic face');
      if (
        resolve(
          family === 'Roboto' ? 'font-family/text' : 'font-family/ui',
          mode,
          'STRING'
        ) !== family
      )
        fail('Source family role changed');
      return {
        fontName: { family, style: face },
        fontSize: parseFloat(s.fontSize),
        lineHeight: { unit: 'PIXELS', value: parseFloat(s.lineHeight) },
        letterSpacing: {
          unit: 'PIXELS',
          value: s.letterSpacing === 'normal' ? 0 : parseFloat(s.letterSpacing),
        },
        textCase: s.textTransform === 'uppercase' ? 'UPPER' : 'ORIGINAL',
        textDecoration: 'NONE',
        paragraphSpacing: 0,
        paragraphIndent: 0,
      };
    });
    const key = hash(JSON.stringify(values)).slice(0, 16),
      id = 'component/search-widget/text-' + key;
    upsert(
      preparedStyles.text,
      {
        id,
        name: 'Mangrove draft / Widget source text / ' + key,
        sourceRef: ref,
        values,
        bindings: {
          fontFamily:
            values.undrr.fontName.family === 'Roboto'
              ? 'font-family/text'
              : 'font-family/ui',
          fontSize: number(
            'font-size',
            vals(m => values[m].fontSize)
          ),
        },
        description:
          'Actual source named font candidate. Requested600/Bold700 and Condensed500/Regular400 face matching remain inferences; native glyph bytes/wrapping unverified.',
      },
      'id'
    );
    return id;
  }
  const limits = [
    'Exact twenty English authored populated frontend configurations at390/1164 plus four390px mobile facet/operator states, not server filtering or all callers.',
    'Whole logical source text uses owning CSS container capacity and actual inline styles. Native glyph metrics, wrapping, inline highlight reflow and arbitrary edited geometry remain open.',
    'Nested source-specific Form, ResultItem, custom Select, Facets, Pager and actual MobileFilterDrawer components retain authored contexts; no native Select, generic Card, Notice or Loader substitution.',
    'Source initial positioned allocations are rebuilt per selected mode. Live mode CSS reflow, scrolling, portals, clicks, keyboard, RTL and focus are not inferred.',
    'Actual source hidden radio inputs stay hidden; visible operator labels/underlines carry the finite visual state. No native control interaction is claimed.',
    'HTTPS source runs carry native rich links where supported. Relative/hash destinations remain source metadata with navigation acceptance open.',
    'No ordinary plugin, source/native pixel parity, library publication or linked consumer migration acceptance.',
  ];
  const familyIds = [
    'search-widget-form-context',
    'search-widget-result-context',
    'search-widget-select-context',
    'search-widget-facets-context',
    'search-widget-pager-context',
    'search-widget-drawer-context',
    'search-widget',
  ];
  const families = new Map(
    familyIds.map(id => [
      id,
      {
        id,
        kind: 'component-set',
        name: 'Search widget / ' + id.replace('search-widget-', ''),
        description: 'Genuine authored source composition context',
        sourceRef: ref,
        limitations: limits,
        review: { genericLabels: false, preserveVariantSizing: true },
        variants: [],
      },
    ])
  );
  const captures = new Map(
    source.captures
      .filter(c => c.kind === 'preset')
      .map(c => [c.brand + '/' + c.viewport, c])
  );
  const sceneGroups = [];
  for (const viewport of [390, 1164])
    for (const preset of Object.keys(
      buildSearchWidgetFixtures({ root }).presets
    ))
      sceneGroups.push({
        id: preset,
        viewport,
        kind: 'preset',
        scenes: vals(m =>
          captures.get(m + '/' + viewport)?.scenes.find(s => s.id === preset)
        ),
      });
  for (const id of [
    'drawer-closed-facets',
    'drawer-hazard-open',
    'drawer-hazard-two-OR',
    'drawer-hazard-two-AND',
  ])
    sceneGroups.push({
      id,
      viewport: 390,
      kind: 'drawer',
      scenes: vals(
        m =>
          source.captures.find(
            c => c.kind === 'drawer' && c.brand === m && c.scenes[0].id === id
          )?.scenes[0]
      ),
    });
  const iconSources = new Map();
  const walk = n => [n, ...(n.children || []).flatMap(walk)];
  for (const f of controls)
    for (const v of f.variants)
      for (const n of walk(v.tree))
        if (n.svg) iconSources.set(n.svg.assetId, n.svg);
  function contextFamily(n) {
    if (n.tag === 'FORM' && n.cls.includes('mg-search__form'))
      return 'search-widget-form-context';
    if (n.tag === 'ARTICLE' && n.cls.includes('mg-search__result'))
      return 'search-widget-result-context';
    if (n.cls.split(/\s+/).includes('mg-select'))
      return 'search-widget-select-context';
    if (n.cls.trim() === 'mg-search__facets')
      return 'search-widget-facets-context';
    if (n.tag === 'NAV' && n.cls.includes('mg-pager'))
      return 'search-widget-pager-context';
    if (n.cls === 'mg-search__drawer-backdrop')
      return 'search-widget-drawer-context';
    return null;
  }
  // Source subtree projection and actual dependency factoring are kept separate
  // so every source scene has one stable DOM/anatomy and authored context owner.
  for (const group of sceneGroups) {
    if (modes.some(m => !group.scenes[m.id]))
      fail('Missing source scene ' + group.id);
    const records = Object.fromEntries(
      modes.map(m => [
        m.id,
        new Map(
          group.scenes[m.id].nodes.map(i => [
            source.nodes[i].id,
            source.nodes[i],
          ])
        ),
      ])
    );
    const lookup = id => vals(m => records[m].get(id));
    const children = id =>
      group.scenes.undrr.nodes
        .map(i => source.nodes[i])
        .filter(n => n.id.slice(0, n.id.lastIndexOf('/')) === id);
    const context = group.id + '/' + group.viewport;
    function project(id, ownerContext, isMaster = false) {
      const all = lookup(id),
        n = all.undrr;
      if (
        !n ||
        modes.some(
          m => !all[m.id] || all[m.id].tag !== n.tag || all[m.id].cls !== n.cls
        )
      )
        fail('Cross-mode source anatomy ' + context + '/' + id);
      const s = source.styles[n.styles];
      if (n.cls.includes('mg-u-sr-only') || Number(s.opacity) === 0)
        return null;
      const childSpecs = children(id);
      const selected = contextFamily(n);
      if (selected && !isMaster) {
        const variantId =
          selected +
          '.' +
          group.id.toLowerCase() +
          '.' +
          group.viewport +
          '.' +
          id.replaceAll('/', '-');
        const tree = project(id, variantId, true);
        delete tree.absolute;
        families.get(selected).variants.push({
          id: variantId,
          name: 'SourceContext=' + context + ', Anatomy=' + id,
          properties: { SourceContext: context, Anatomy: id },
          sourceRef: ref,
          tree,
        });
        const instance = {
          id: id.replaceAll('/', '-') + '-source-instance',
          type: 'INSTANCE',
          name: n.cls,
          family: selected,
          variant: { SourceContext: context, Anatomy: id },
          layout: {
            width: number(
              'width',
              vals(m => all[m].rect.width)
            ),
            height: number(
              'height',
              vals(m => all[m].rect.height)
            ),
          },
          absolute: {
            horizontal: 'START',
            vertical: 'START',
            offsetX: number(
              'x',
              vals(m => all[m].rect.x)
            ),
            offsetY: number(
              'y',
              vals(m => all[m].rect.y)
            ),
          },
        };
        const slot = {
          id: id.replaceAll('/', '-'),
          type: 'FRAME',
          name: 'Actual source context allocation',
          layout: { mode: 'VERTICAL', ...instance.layout },
          absolute: instance.absolute,
          children: [instance],
        };
        delete instance.absolute;
        return slot;
      }
      const spec = {
        id: id.replaceAll('/', '-'),
        name: n.cls || n.tag,
        type: 'FRAME',
        layout: {
          mode: 'VERTICAL',
          width: number(
            'width',
            vals(m => all[m].rect.width)
          ),
          height: number(
            'height',
            vals(m => all[m].rect.height)
          ),
          clipsContent: s.overflow === 'hidden' || s.overflow === 'auto',
        },
        absolute: {
          horizontal: 'START',
          vertical: 'START',
          offsetX: number(
            'x',
            vals(m => all[m].rect.x)
          ),
          offsetY: number(
            'y',
            vals(m => all[m].rect.y)
          ),
        },
        bindings: {
          opacity: number(
            'opacity',
            vals(m => Number(source.styles[all[m].styles].opacity) * 100)
          ),
          cornerRadius: number(
            'radius',
            vals(m => parseFloat(source.styles[all[m].styles].borderRadius))
          ),
        },
        children: [],
      };
      if (s.backgroundColor !== 'rgba(0, 0, 0, 0)')
        spec.fill = color(
          'background',
          vals(m => source.styles[all[m].styles].backgroundColor)
        );
      if (s.backgroundImage !== 'none') {
        const css = 'linear-gradient(135deg, rgb(0, 51, 102), rgb(0, 85, 138))';
        if (
          group.id !== 'ExternalSearchRegion' ||
          id !== 'root/node-0/node-0' ||
          modes.some(
            m => source.styles[all[m.id].styles].backgroundImage !== css
          )
        )
          fail('Unreviewed source background image ' + n.cls);
        const a = vals(
          m => all[m].rect.width / (all[m].rect.width + all[m].rect.height)
        );
        const b = vals(
          m => all[m].rect.height / (all[m].rect.width + all[m].rect.height)
        );
        const aRole = number('css-gradient-a', a),
          bRole = number('css-gradient-b', b);
        const negativeBRole = number(
          'css-gradient-negative-b',
          vals(m => -b[m])
        );
        spec.children.push({
          id: spec.id + '-css-background',
          name: 'Source CSS 135 degree background',
          type: 'FRAME',
          bindings: { cornerRadius: spec.bindings.cornerRadius },
          layout: {
            mode: 'VERTICAL',
            width: spec.layout.width,
            height: spec.layout.height,
          },
          absolute: {
            horizontal: 'START',
            vertical: 'START',
            offsetX: number(
              'zero',
              vals(() => 0)
            ),
            offsetY: number(
              'zero',
              vals(() => 0)
            ),
          },
          gradient: {
            layers: [
              {
                stops: [
                  {
                    position: 0,
                    color: color(
                      'css-gradient-start',
                      vals(() => 'rgb(0, 51, 102)')
                    ),
                  },
                  {
                    position: 1,
                    color: color(
                      'css-gradient-end',
                      vals(() => 'rgb(0, 85, 138)')
                    ),
                  },
                ],
                transform: [
                  [a.undrr, b.undrr, 0],
                  [-b.undrr, a.undrr, b.undrr],
                ],
                transformVariables: [
                  [aRole, bRole, null],
                  [negativeBRole, aRole, bRole],
                ],
              },
            ],
          },
        });
      }
      for (const [field, css] of [
        ['topLeftRadius', 'borderTopLeftRadius'],
        ['topRightRadius', 'borderTopRightRadius'],
        ['bottomLeftRadius', 'borderBottomLeftRadius'],
        ['bottomRightRadius', 'borderBottomRightRadius'],
      ])
        spec.bindings[field] = number(
          field,
          vals(m => parseFloat(source.styles[all[m].styles][css]))
        );
      const edges = ['Top', 'Right', 'Bottom', 'Left'],
        visible = edges.filter(e => parseFloat(s['border' + e + 'Width']) > 0);
      if (visible.length) {
        const edge = visible[0];
        if (
          visible.some(
            e => s['border' + e + 'Color'] !== s['border' + edge + 'Color']
          )
        )
          fail('Different border paints ' + n.cls);
        spec.stroke = color(
          'border',
          vals(m => source.styles[all[m].styles]['border' + edge + 'Color'])
        );
        spec.bindings.strokeWeight = number(
          'stroke-zero',
          vals(() => 0)
        );
        for (const e of edges)
          spec.bindings['stroke' + e + 'Weight'] = number(
            'stroke-' + e.toLowerCase(),
            vals(m =>
              parseFloat(source.styles[all[m].styles]['border' + e + 'Width'])
            )
          );
      }
      function sourceSvg(markup, assetId, sizing = false, mask = false) {
        markup = markup
          .replaceAll('currentColor', '#000000')
          .replace(/ (?:class|aria-hidden)="[^"]*"/g, '');
        const box = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(markup);
        if (!box || box[1] !== box[2]) fail('Non-square source SVG ' + id);
        const size = Number(box[1]);
        const colors = color(
          'icon',
          vals(m => source.styles[all[m].styles].color)
        );
        const svg = {
          assetId,
          markup,
          monochrome: {
            strokes: colors,
            // All eight guarded source glyphs draw strokes. The checkmark root
            // declares currentColor fill, but its only path explicitly fills none.
          },
        };
        if (sizing)
          svg.sizing = {
            size: number(
              'icon-size',
              vals(m => all[m].rect.width)
            ),
            strokeWidth: number(
              'icon-stroke',
              vals(m => (2 * all[m].rect.width) / size)
            ),
          };
        const width = sizing
          ? size
          : mask
            ? parseFloat(source.styles[n.before].fontSize)
            : n.rect.width;
        if (
          !sizing &&
          modes.some(
            m =>
              all[m.id].rect.width !== width ||
              (!mask && all[m.id].rect.height !== width)
          )
        )
          fail(
            'Mode-varying SVG requires sized square capability ' +
              context +
              '/' +
              id +
              ' ' +
              JSON.stringify(vals(m => all[m].rect))
          );
        spec.children.push({
          id: spec.id + '-source-svg',
          name: 'Exact source glyph',
          type: 'SVG',
          svg,
          layout: { width, height: width },
          position: { x: 0, y: 0 },
        });
      }
      if (n.svg) {
        sourceSvg(n.svg, 'search-widget-svg-' + hash(n.svg).slice(0, 16));
        return spec;
      }
      if (n.cls.includes('mg-icon-search') || n.cls.includes('mg-icon-close')) {
        const asset = n.cls.includes('mg-icon-search')
          ? 'search-control.search'
          : 'search-control.close';
        const original = iconSources.get(asset);
        if (!original) fail('Missing source glyph ' + asset);
        sourceSvg(
          original.markup,
          asset,
          n.cls.includes('mg-icon-search'),
          true
        );
        return spec;
      }
      if (n.image) {
        if (
          modes.some(m => all[m.id].image?.src !== n.image.src) ||
          !n.image.width ||
          !n.image.height
        )
          fail('Unloaded source image');
        const file = n.image.src.includes('/styles/por/')
          ? 'examples/figma-plugin/holistic/assets/card-content/bali-publication-cover.jpg'
          : n.image.src.endsWith('/2022-08/Bali.JPG.jpg')
            ? 'examples/figma-plugin/holistic/assets/search-widget/bali-landscape-source-photo.jpg'
            : n.image.src.endsWith('/2020-01/Home---about-us_0.jpg')
              ? 'examples/figma-plugin/holistic/assets/news-detail/related-source-photo.jpg'
              : null;
        if (!file) fail('Unpinned source image ' + n.image.src);
        spec.image = {
          assetId: 'search-widget-image-' + hash(file).slice(0, 16),
          base64: fs.readFileSync(path.join(root, file)).toString('base64'),
          scaleMode: 'FILL',
        };
        return spec;
      }
      if (s.boxShadow !== 'none') {
        const effectVals = vals(m => {
          const shadow = source.styles[all[m].styles].boxShadow;
          const match =
            /^(rgba?\([^)]+\)) (-?[\d.]+)px (-?[\d.]+)px ([\d.]+)px ([\d.]+)px( inset)?$/.exec(
              shadow
            );
          if (!match) fail('Unsupported source shadow ' + shadow);
          return [
            {
              type: match[6] ? 'INNER_SHADOW' : 'DROP_SHADOW',
              color: rgba(match[1]),
              offset: { x: Number(match[2]), y: Number(match[3]) },
              radius: Number(match[4]),
              spread: Number(match[5]),
              visible: true,
              blendMode: 'NORMAL',
            },
          ];
        });
        const effectColor = color(
          'shadow',
          vals(
            m =>
              /^(rgba?\([^)]+\))/.exec(
                source.styles[all[m].styles].boxShadow
              )[1]
          )
        );
        for (const mode of modes)
          effectVals[mode.id] = effectVals[mode.id].map(effect => ({
            effect,
            bindings: { color: effectColor },
          }));
        const effectId =
          'component/search-widget/effect-' +
          hash(JSON.stringify(effectVals)).slice(0, 16);
        upsert(
          preparedStyles.effect,
          {
            id: effectId,
            name:
              'Mangrove draft / Widget source effect / ' +
              effectId.split('-').pop(),
            values: effectVals,
            sourceRef: ref,
          },
          'id'
        );
        spec.effectStyle = effectId;
      }
      function positionText(text, heights) {
        const slot = {
          id: text.id + '-positioned-slot',
          name: 'Actual source text container allocation',
          type: 'FRAME',
          layout: {
            mode: 'VERTICAL',
            width: text.layout.width,
            height: number('source-text-slot-height', heights),
          },
          absolute: text.absolute,
          children: [text],
        };
        delete text.absolute;
        return slot;
      }
      function inlineTree(node) {
        const st = source.styles[node.styles];
        if (node.cls.includes('mg-u-sr-only') || Number(st.opacity) === 0)
          return true;
        if (
          node.svg ||
          node.image ||
          node.input ||
          node.cls.includes('mg-icon')
        )
          return false;
        return children(node.id).every(child => {
          const cs = source.styles[child.styles];
          return (
            Number(cs.opacity) === 0 ||
            child.cls.includes('mg-u-sr-only') ||
            (['inline', 'inline-block'].includes(cs.display) &&
              cs.backgroundColor === 'rgba(0, 0, 0, 0)' &&
              cs.boxShadow === 'none' &&
              inlineTree(child))
          );
        });
      }
      function parts(node) {
        const st = source.styles[node.styles];
        if (node.cls.includes('mg-u-sr-only') || Number(st.opacity) === 0)
          return [];
        const result = [];
        for (const item of node.childOrder || []) {
          if (item.text !== undefined) {
            if (item.text)
              result.push({
                text: item.text,
                nodeId: node.id,
                textId: item.textId,
                href: node.href,
              });
          } else if (item.element) {
            const child = records.undrr.get(item.element);
            if (child) result.push(...parts(child));
          }
        }
        return result;
      }
      const collapse = inlineTree(n) && parts(n).some(p => p.text.trim());
      if (collapse || n.input) {
        let pieces = n.input
          ? [
              {
                text: n.input.value || n.input.placeholder,
                nodeId: id,
                textId: 'input-value',
              },
            ]
          : parts(n);
        const characters = pieces.map(p => p.text).join('');
        if (!characters.trim()) return spec;
        if (
          modes.some(m =>
            n.input
              ? all[m.id].input?.value !== n.input.value ||
                all[m.id].input?.placeholder !== n.input.placeholder
              : parts(all[m.id])
                  .map(p => p.text)
                  .join('') !== characters
          )
        )
          fail('Mode-varying source copy ' + id);
        const pseudo = source.styles[n.before];
        const bullet = pseudo.content === '"•"';
        const offsetX = vals(m => {
          const st = source.styles[all[m].styles];
          return bullet
            ? all[m].texts[0].rect.x
            : parseFloat(
                st.padding.split(' ')[3] ??
                  st.padding.split(' ')[1] ??
                  st.padding
              ) + parseFloat(st.borderLeftWidth);
        });
        const offsetY = vals(m => {
          const st = source.styles[all[m].styles];
          return (
            parseFloat(st.padding.split(' ')[0]) + parseFloat(st.borderTopWidth)
          );
        });
        const capacity = vals(m => {
          const st = source.styles[all[m].styles],
            pads = st.padding.split(' '),
            right = parseFloat(pads[1] ?? pads[0]);
          return (
            all[m].rect.width -
            offsetX[m] -
            right -
            parseFloat(st.borderRightWidth)
          );
        });
        if (n.input && Object.values(capacity).every(v => v === 0)) return spec;
        if (Object.values(capacity).some(v => v <= 0))
          fail(
            'Nonpositive actual source text capacity ' +
              context +
              '/' +
              id +
              ' ' +
              n.cls +
              ' ' +
              JSON.stringify(capacity)
          );
        const runSpecs = [];
        let offset = 0;
        for (const [index, piece] of pieces.entries()) {
          const each = lookup(piece.nodeId),
            styleId = style(each),
            paint =
              n.input && !n.input.value
                ? 'color/neutral-500'
                : color(
                    'text',
                    vals(m => source.styles[each[m].styles].color)
                  );
          runSpecs.push({
            id:
              piece.nodeId.replaceAll('/', '-') +
              '-' +
              piece.textId +
              '-' +
              index,
            start: offset,
            end: offset + piece.text.length,
            textStyle: styleId,
            fill: paint,
            textDecoration: 'NONE',
            ...(piece.href?.startsWith('https://')
              ? { hyperlink: { type: 'URL', value: piece.href } }
              : {}),
          });
          offset += piece.text.length;
        }
        const first = runSpecs[0],
          rich = runSpecs.some(
            r =>
              r.textStyle !== first.textStyle ||
              r.fill !== first.fill ||
              r.hyperlink
          );
        const text = {
          id: spec.id + '-logical-text',
          name: 'Editable whole source text',
          type: 'TEXT',
          characters,
          textWrap:
            s.textWrapStyle === 'balance'
              ? 'BALANCE'
              : s.textWrapStyle === 'pretty'
                ? 'PRETTY'
                : 'AUTO',
          textAlign:
            s.textAlign === 'center'
              ? 'CENTER'
              : ['right', 'end'].includes(s.textAlign)
                ? 'RIGHT'
                : 'LEFT',
          layout: { width: number('text-capacity', capacity), height: 'HUG' },
          absolute: {
            horizontal: 'START',
            vertical: 'START',
            offsetX: number('text-x', offsetX),
            offsetY: number('text-y', offsetY),
          },
        };
        if (rich) text.textRuns = runSpecs;
        else {
          text.textStyle = first.textStyle;
          text.fill = first.fill;
          text.textProperty = 'Text ' + ownerContext + ' ' + id + ' logical';
        }
        if (bullet) {
          const pseudoAll = vals(m => ({ styles: all[m].before }));
          const spacing = vals(m =>
            parseFloat(source.styles[all[m].before].marginInlineEnd)
          );
          spec.children.push(
            positionText(
              {
                id: spec.id + '-metadata-bullet',
                name: 'Actual source metadata separator',
                type: 'TEXT',
                characters: '•',
                textStyle: style(pseudoAll),
                fill: color(
                  'bullet',
                  vals(m => source.styles[all[m].before].color)
                ),
                layout: {
                  width: number(
                    'bullet-capacity',
                    vals(m => offsetX[m] - spacing[m])
                  ),
                  height: 'HUG',
                },
                absolute: {
                  horizontal: 'START',
                  vertical: 'START',
                  offsetX: number(
                    'zero',
                    vals(() => 0)
                  ),
                  offsetY: number(
                    'zero',
                    vals(() => 0)
                  ),
                },
              },
              vals(m => parseFloat(source.styles[all[m].before].lineHeight))
            )
          );
        } else if (pseudo.content !== 'none' && pseudo.content !== 'normal')
          fail('Unreviewed source pseudo ' + n.cls);
        spec.children.push(
          positionText(
            text,
            vals(m => Math.max(1, all[m].rect.height - offsetY[m]))
          )
        );
        return spec;
      }
      if (n.texts.some(t => t.text.trim())) {
        if (
          !['mg-search__drawer-title', 'mg-search__drawer-apply'].includes(
            n.cls
          ) ||
          childSpecs.length !== 1 ||
          ![
            'mg-search__drawer-count',
            'mg-search__drawer-apply-count',
          ].includes(childSpecs[0].cls) ||
          n.texts.length !== 1
        )
          fail(
            'Mixed block source text requires owning rich flow ' +
              context +
              '/' +
              id
          );
        const allocation = vals(m => {
          const label = all[m],
            badge = records[m].get(childSpecs[0].id);
          return (
            badge.rect.x -
            parseFloat(source.styles[label.styles].gap) -
            label.texts[0].rect.x
          );
        });
        spec.children.push(
          positionText(
            {
              id: spec.id + '-direct-label',
              name: 'Actual source anonymous flex label',
              type: 'TEXT',
              characters: n.texts[0].text,
              textProperty: 'Text ' + ownerContext + ' ' + id + ' direct-label',
              textStyle: style(all),
              fill: color(
                'text',
                vals(m => source.styles[all[m].styles].color)
              ),
              layout: {
                width: number('anonymous-flex-capacity', allocation),
                height: 'HUG',
              },
              absolute: {
                horizontal: 'START',
                vertical: 'START',
                offsetX: number(
                  'anonymous-flex-x',
                  vals(m => all[m].texts[0].rect.x)
                ),
                offsetY: number(
                  'anonymous-flex-y',
                  vals(
                    m =>
                      (all[m].rect.height -
                        parseFloat(source.styles[all[m].styles].lineHeight)) /
                      2
                  )
                ),
              },
            },
            vals(m => parseFloat(source.styles[all[m].styles].lineHeight))
          )
        );
      }
      for (const child of childSpecs) {
        const item = project(child.id, ownerContext);
        if (item) spec.children.push(item);
      }
      return spec;
    }
    const tree = project(
      'root',
      'search-widget.' + group.id.toLowerCase() + '.' + group.viewport,
      true
    );
    delete tree.absolute;
    families.get('search-widget').variants.push({
      id: 'search-widget.' + group.id.toLowerCase() + '.' + group.viewport,
      name: 'SourcePreset=' + group.id + ', Viewport=' + group.viewport,
      properties: {
        SourcePreset: group.id,
        Viewport: String(group.viewport),
      },
      sourceRef: ref,
      sourceNavigation: [...records.undrr.values()]
        .filter(n => n.href)
        .map(n => ({
          anatomy: n.id,
          href: n.href,
          nativeHyperlink: n.href.startsWith('https://'),
        })),
      sourceInputs: [...records.undrr.values()]
        .filter(n => n.input)
        .map(n => ({ anatomy: n.id, ...n.input })),
      tree,
    });
  }
  variables.splice(0, variables.length, ...preparedVariables);
  for (const key of Object.keys(preparedStyles))
    styles[key] = preparedStyles[key];
  return [...families.values()].filter(f => f.variants.length);
}
module.exports.inspectSearchWidgetCapacity = inspectSearchWidgetCapacity;
module.exports.buildSearchWidgetRecipes = buildSearchWidgetRecipes;
