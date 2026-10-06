'use strict';
const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');
function styleShape(style, kind, modes) {
  if (
    style.type !== undefined &&
    style.type !== (kind === 'text' ? 'TEXT' : 'EFFECT')
  )
    return false;
  if (
    !style.values ||
    Object.keys(style.values).sort().join(',') !==
      modes
        .map(m => m.id)
        .sort()
        .join(',')
  )
    return false;
  return modes.every(m => {
    const v = style.values[m.id];
    return kind === 'effect'
      ? Array.isArray(v)
      : v &&
          typeof v === 'object' &&
          !Array.isArray(v) &&
          v.fontName &&
          typeof v.fontName === 'object' &&
          typeof v.fontName.family === 'string' &&
          v.fontName.family.length > 0 &&
          typeof v.fontName.style === 'string' &&
          v.fontName.style.length > 0;
  });
}
/** Finite actual image-bearing article composition. Native source raster remains open. */
function prepareNewsImageArticleDependencies(options) {
  const staged = {
    ...options,
    variables: structuredClone(options.variables),
    styles: structuredClone(options.styles),
  };
  const modules = [
    ['figma-page-pattern-recipes.cjs', 'buildPagePatternRecipes'],
    ['figma-page-reading-recipes.cjs', 'buildPageReadingRecipes'],
    ['figma-page-chrome-recipes.cjs', 'buildPageChromeRecipes'],
    ['figma-user-feedback-recipes.cjs', 'buildUserFeedbackRecipes'],
    ['figma-news-detail-recipes.cjs', 'buildNewsDetailDependencyRecipes'],
    ['figma-news-detail-recipes.cjs', 'buildNewsRelatedCardRecipes'],
    ['figma-news-detail-recipes.cjs', 'buildNewsEditorialRecipes'],
    ['figma-news-detail-recipes.cjs', 'buildNewsImageHeaderRecipes'],
    ['figma-news-float-recipes.cjs', 'buildNewsFloatHighlightRecipes'],
    ['figma-news-article-recipes.cjs', 'buildNewsArticleMediaRecipes'],
    ['figma-news-exclusion-recipes.cjs', 'buildNewsExclusionParagraphRecipes'],
  ];
  const families = modules.flatMap(([file, fn]) =>
    require('./' + file)[fn](staged)
  );
  for (const e of staged.variables) {
    const hits = options.variables.filter(
      v => v.id === e.id || v.name === e.name
    );
    if (
      hits.length > 1 ||
      hits.some(v => v.id !== e.id || v.name !== e.name || v.type !== e.type)
    )
      throw Error('News article dependency foreign variable identity');
  }
  for (const kind of ['text', 'effect'])
    for (const e of staged.styles[kind]) {
      const hits = options.styles[kind].filter(
        v => v.id === e.id || v.name === e.name
      );
      if (
        hits.length > 1 ||
        !styleShape(e, kind, options.modes) ||
        hits.some(
          v =>
            v.id !== e.id ||
            v.name !== e.name ||
            !styleShape(v, kind, options.modes) ||
            options.modes.some(
              m =>
                !v.values?.[m.id] ||
                Array.isArray(v.values[m.id]) !== Array.isArray(e.values[m.id])
            )
        ) ||
        options.styles[kind === 'text' ? 'effect' : 'text'].some(
          v => v.id === e.id || v.name === e.name
        )
      )
        throw Error('News article dependency foreign style identity');
    }
  options.variables.splice(0, options.variables.length, ...staged.variables);
  for (const kind of ['text', 'effect'])
    options.styles[kind].splice(
      0,
      options.styles[kind].length,
      ...staged.styles[kind]
    );
  return families;
}
function buildNewsImageArticleSceneRecipes({ root, modes, variables, styles }) {
  const originals = { variables, styles },
    work = {
      root,
      modes,
      variables: structuredClone(variables),
      styles: structuredClone(styles),
    },
    fail = s => {
      throw Error('News article scene source changed: ' + s);
    };
  const sha = b => crypto.createHash('sha256').update(b).digest('hex'),
    base = path.join(
      root,
      'examples/figma-plugin/holistic/assets/news-image-article-scenes'
    );
  const bytes = fs.readFileSync(path.join(base, 'provenance.json'));
  if (
    sha(bytes) !==
    'ef84a19c6b64bb0bb77323c9126584e8176e9c1012223e45e6ebcb0d44214dd0'
  )
    fail('provenance');
  const prov = JSON.parse(bytes);
  for (const [file, hash] of Object.entries({
    ...prov.sourceHashes,
    ...prov.producerHashes,
  }))
    if (sha(fs.readFileSync(path.join(root, file))) !== hash) fail(file);
  for (const [file, hash] of Object.entries(prov.assets))
    if (sha(fs.readFileSync(path.join(base, file))) !== hash) fail(file);
  const dependencies = prepareNewsImageArticleDependencies(work),
    family = new Map(dependencies.map(f => [f.id, f]));
  const cases = JSON.parse(
    fs.readFileSync(path.join(base, 'source-footprints.json'))
  ).cases;
  const role = (slug, value) => {
    if (!Number.isFinite(value) || value < 0) fail('finite allocation ' + slug);
    const name = 'component/news-image-article-scene/' + slug,
      e = {
        id: name.replaceAll('/', '.'),
        name,
        type: 'FLOAT',
        values: Object.fromEntries(modes.map(m => [m.id, value])),
        scopes: ['WIDTH_HEIGHT', 'GAP'],
      };
    const hits = work.variables.filter(v => v.id === e.id || v.name === e.name);
    if (
      hits.length > 1 ||
      hits.some(v => v.id !== e.id || v.name !== e.name || v.type !== e.type)
    )
      fail('foreign allocation');
    if (hits.length) Object.assign(hits[0], e);
    else work.variables.push(e);
    return name;
  };
  const find = (id, properties) => {
    const f = family.get(id);
    if (!f) fail('missing family ' + id);
    const hits = f.variants.filter(v =>
      Object.entries(properties).every(([k, x]) => v.properties[k] === x)
    );
    if (hits.length !== 1) fail('ambiguous variant ' + id);
    return hits[0];
  };
  const variants = [];
  for (const treatment of [
    'large-image',
    'compact-image',
    'alternate-hero-image',
    'split-hero',
  ])
    for (const captureTheme of modes.map(m => m.id))
      for (const viewport of [390, 1164]) {
        const key = captureTheme + '-' + treatment + '-' + viewport,
          source = cases[key];
        if (!source || source.viewport.width !== viewport)
          fail('actual source case');
        const children = [],
          records = source.records,
          one = selector => {
            const all = records[selector];
            if (!all || all.length !== 1)
              fail('actual source selector ' + selector);
            return all[0];
          };
        const slot = (id, node, rect) => {
          const r = rect.rect || rect,
            origin = source.root.rect;
          if (
            [r.x, r.y, r.width, r.height].some(n => !Number.isFinite(n)) ||
            r.width <= 0 ||
            r.height <= 0
          )
            fail('positive source slot');
          children.push({
            id: id + '-slot',
            type: 'FRAME',
            fill: null,
            layout: {
              mode: 'VERTICAL',
              width: role(key + '/' + id + '/width', r.width),
              height: role(key + '/' + id + '/height', r.height),
              clipsContent: false,
            },
            absolute: {
              horizontal: 'START',
              vertical: 'START',
              offsetX: role(key + '/' + id + '/x', r.x - origin.x),
              offsetY: role(key + '/' + id + '/y', r.y - origin.y),
            },
            children: [node],
          });
        };
        const instance = (id, which, properties) => {
          find(which, properties);
          return {
            id,
            type: 'INSTANCE',
            family: which,
            variant: properties,
            expose: true,
            layout: { width: 'FILL', height: 'FILL' },
          };
        };
        slot(
          'closed-chrome',
          instance('closed-chrome-instance', 'page-chrome', {
            Viewport: String(viewport),
            State: 'Closed',
          }),
          {
            x: source.root.rect.x,
            y: source.root.rect.y,
            width: viewport,
            height: (() => {
              const headers = records.header.filter(n =>
                n.className?.split(' ').includes('mg-page-header')
              );
              const navigation = records.nav.filter(n =>
                n.className?.split(' ').includes('mg-mega-wrapper')
              );
              if (
                headers.length !== 1 ||
                navigation.length !== 1 ||
                headers[0].rect.y !== source.root.rect.y ||
                navigation[0].rect.y !== headers[0].rect.bottom
              )
                fail('actual closed chrome source flow');
              return navigation[0].rect.bottom - source.root.rect.y;
            })(),
          }
        );
        slot(
          'article-header',
          instance('article-header-instance', 'article-image-header', {
            Treatment: treatment,
            Locale: 'English',
            SourceViewport: String(viewport),
          }),
          {
            ...one('.mg-demo-article-header').rect,
            x: source.root.rect.x,
            width: viewport,
          }
        );
        slot(
          'share',
          instance('share-instance', 'share-buttons', {
            SourceViewport: String(viewport),
            NativeShare: 'Unavailable',
          }),
          one('.mg-share')
        );
        slot(
          'toc',
          instance('toc-instance', 'page-bulleted-toc', {
            Page: 'article',
            SourceViewport: String(viewport),
          }),
          one('.mg-table-of-contents')
        );
        const column = find('news-detail-article-column', {
            SourceViewport: String(viewport),
            Locale: 'English',
          }),
          templates = [];
        const walk = n => {
          if (n.type === 'TEXT') templates.push(n);
          for (const c of n.children || []) walk(c);
        };
        walk(column.tree);
        const template = text => {
          const hits = templates.filter(t => t.characters === text);
          if (hits.length !== 1) fail('exact prose template');
          return structuredClone(hits[0]);
        };
        for (let si = 0; si < 3; si++) {
          const section = source.allDirectArticleSections[si];
          if (!section) fail('three source sections');
          for (const [ci, n] of section.children.entries()) {
            if (n.tag === 'H2' || n.tag === 'P') {
              if (si === 2 && n.tag === 'P' && ci === 1) {
                slot(
                  'float-exclusion',
                  instance(
                    'float-exclusion-instance',
                    'news-source-exclusion',
                    {
                      SourceViewport: String(viewport),
                    }
                  ),
                  n
                );
                continue;
              }
              const t = template(n.text);
              t.id = 'section' + si + '-child' + ci;
              t.layout = { width: 'FILL', height: 'FILL' };
              slot(t.id, t, n);
            }
          }
        }
        slot(
          'quote',
          instance('quote-instance', 'quote-highlight', {
            Preset: 'article-quote',
            SourceViewport: String(viewport),
          }),
          one('.mg-quote-highlight')
        );
        slot(
          'contextual-highlight',
          instance(
            'contextual-highlight-instance',
            'news-contextual-highlight',
            {
              SourceViewport: String(viewport),
              Locale: 'English',
            }
          ),
          one('.mg-highlight-box')
        );
        slot(
          'initialized-media',
          instance('initialized-media-instance', 'news-article-initial-media', {
            CaptureTheme: captureTheme,
            SourceViewport: String(viewport),
            State: 'InitialOpaque',
          }),
          one('.mg-embed-container')
        );
        const headingTemplate = templates.find(
          t =>
            t.characters ===
            source.allDirectArticleSections[0].children.find(
              n => n.tag === 'H2'
            ).text
        );
        const heading = records['.mg-page-main>section>h2'][0];
        if (!heading) fail('related heading');
        const headingNode = structuredClone(headingTemplate);
        headingNode.id = 'related-heading';
        headingNode.characters = heading.text;
        headingNode.textProperty = 'RelatedHeading';
        headingNode.layout = { width: 'FILL', height: 'FILL' };
        slot('related-heading', headingNode, heading);
        const cards = records['.mg-grid__col-3>*'];
        if (cards.length !== 3) fail('actual three related cards');
        for (let i = 0; i < 3; i++)
          slot(
            'related-card' + i,
            instance('related-card-instance' + i, 'news-related-card', {
              SourceViewport: String(viewport),
              Story: String(i + 1),
              Locale: 'English',
            }),
            cards[i]
          );
        const sections = records['.mg-page-main>section'];
        if (sections.length !== 3) fail('post article sections');
        slot(
          'recommendations',
          instance('recommendations-instance', 'news-recommendations', {
            SourceViewport: String(viewport),
            Locale: 'English',
          }),
          sections[1]
        );
        slot(
          'taxonomy',
          instance('taxonomy-instance', 'news-taxonomy', {
            SourceViewport: String(viewport),
            Locale: 'English',
          }),
          sections[2]
        );
        slot(
          'feedback',
          instance('feedback-instance', 'user-feedback', {
            State: 'Initial',
            Viewport: viewport === 390 ? 'Mobile' : 'Desktop',
          }),
          one('.mg-user-feedback')
        );
        variants.push({
          id: 'news-image-article-scene.' + key,
          name:
            'CaptureTheme=' +
            captureTheme +
            ', Treatment=' +
            treatment +
            ', SourceViewport=' +
            viewport,
          properties: {
            CaptureTheme: captureTheme,
            SourceViewport: String(viewport),
            Locale: 'English',
            Treatment: treatment,
          },
          sourceScene: {
            captureTheme,
            viewport,
            timestamp: source.timestamp,
            url: source.url,
            documentHeight: source.documentHeight,
            recordedRoot: source.root.rect,
            sourceSections: 3,
            sourceParagraphs: 9,
            opaquePlayer: true,
            nativeAcceptance: false,
          },
          tree: {
            id: 'root',
            type: 'FRAME',
            fill: null,
            layout: {
              mode: 'VERTICAL',
              width: viewport,
              height: role(key + '/scene-height', source.root.rect.height),
              gap: 0,
              clipsContent: false,
            },
            children,
          },
        });
      }
  for (const e of work.variables) {
    const hits = originals.variables.filter(
      v => v.id === e.id || v.name === e.name
    );
    if (
      hits.length > 1 ||
      hits.some(v => v.id !== e.id || v.name !== e.name || v.type !== e.type)
    )
      fail('foreign variable identity');
  }
  for (const kind of ['text', 'effect'])
    for (const e of work.styles[kind]) {
      const hits = originals.styles[kind].filter(
        v => v.id === e.id || v.name === e.name
      );
      if (
        hits.length > 1 ||
        !styleShape(e, kind, modes) ||
        hits.some(
          v =>
            v.id !== e.id ||
            v.name !== e.name ||
            !styleShape(v, kind, modes) ||
            modes.some(
              m =>
                !v.values?.[m.id] ||
                Array.isArray(v.values[m.id]) !== Array.isArray(e.values[m.id])
            )
        ) ||
        originals.styles[kind === 'text' ? 'effect' : 'text'].some(
          v => v.id === e.id || v.name === e.name
        )
      )
        fail('foreign style identity');
    }
  originals.variables.splice(0, originals.variables.length, ...work.variables);
  for (const kind of ['text', 'effect'])
    originals.styles[kind].splice(
      0,
      originals.styles[kind].length,
      ...work.styles[kind]
    );
  return [
    {
      id: 'news-image-article-scene',
      name: 'Mangrove/Source Article/Image-bearing complete composition',
      kind: 'component-set',
      review: { genericLabels: false, preserveVariantSizing: true },
      sourceRef: {
        file: 'stories/Patterns/ArticleStory/ArticleStory.jsx',
        line: 434,
      },
      dependencyContracts: [
        ...new Set(
          variants.flatMap(v =>
            v.tree.children.flatMap(s =>
              s.children.filter(n => n.type === 'INSTANCE').map(n => n.family)
            )
          )
        ),
      ].map(family => ({ family })),
      limitations: [
        'Finite exact captured source contexts. CaptureTheme records frozen source allocation and opaque media pixels, while brand-mode paints/styles remain live. Matching captured-theme source raster only is intended; cross-theme allocation parity is not claimed.',
        'Closed chrome, initial Share capability-unavailable and initial Feedback only; navigation/sticky/focus/provider/runtime state and publication gates remain open.',
        'Ordinary short plain/rich edits retain content but do not claim arbitrary fixed-allocation reflow. Desktop source paragraph lines refuse copy edits through current-page frozen guard.',
        'Opaque player IMAGE, borrowed UA bullet/caret source projections, native source fonts/crop/float line baselines and source/fullscene raster remain open.',
      ],
      variants,
    },
  ];
}
module.exports = {
  prepareNewsImageArticleDependencies,
  buildNewsImageArticleSceneRecipes,
};
