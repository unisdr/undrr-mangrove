/** Finite source SearchResults/ResultItem recipes. No endpoint/native acceptance. */
'use strict';
const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');
const {
  buildSearchFixturesSync,
  createSearchSourceLoaderSync,
  guardSearchSources,
} = require('./figma-search-fixtures.cjs');
const SOURCE_HASHES = {
  'examples/figma-plugin/holistic/assets/content-hub/source-fonts/LICENSE.txt':
    'c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4',
  'stories/Components/Cards/Card/card.scss':
    'e5220ce8519237793fc7a1045ea38342a887ec02681309aa8667d1928f3d25a3',
  'stories/Atom/Tag/tag.scss':
    'd3541ba05d7186b5c0f8d18d12b08f46375e686916c37f587f88c2bd1f7c97f1',
  'stories/Components/ScrollContainer/ScrollContainerExamples.jsx':
    'b843a5628ef87550b751b47a0fb7962eadf7b9ebfbc760a23591ead52dac75a4',
  'stories/assets/scss/_foundational.scss':
    '89f40e9172074d84f101aa6a9d6a048aa6177a67781b8fb672cb4a4c44adbcdf',
  'stories/assets/scss/_mixins.scss':
    '0028b614bb410bd03e6bc6a81e2b42b0daea54a5f6193eca6b7a1130617b9a35',
  'stories/assets/scss/_breakpoints.scss':
    'dfe36ec45c98e2e89b8d72a6d0d41af48783b64a7441667ce02eb6b3d5f16bc0',
  'stories/Utilities/Normalize/normalize.scss':
    'b74d9ace846077ecd6ad39e618f4a90ecde78dab80713b00315caba55cd76795',
  'stories/assets/fonts/roboto/roboto.scss':
    'b881ae0ebeb56f49523c791faafc1a10299fc1d7a875fa91c028b06164b8197c',
  'stories/assets/fonts/roboto/sass/_variables.scss':
    'ce141aa75263b9b51a301463ddc4ac755458baf84c6636f854852394a6190ea6',
  'stories/assets/fonts/roboto/sass/_mixins.scss':
    'da42b1344b5a5ca7c059c96374b92286381a0a36e2d0ffadefe30683c2e916a7',
  'stories/assets/fonts/roboto/sass/_Regular.scss':
    'cb27bc0dd02ba21b4dda3249a59e352e0a42c5ea45b83d7cba0a1a2cb79f5845',
  'stories/assets/fonts/roboto/sass/_Medium.scss':
    'a4604935605d15b5eeb12d7f8700e91f637ef5b545dd757ac232953ffdece828',
  'stories/assets/fonts/roboto/sass/_Bold.scss':
    '9f24cf0a077b2087c47c55bbb665a4086a38818680eee9ca0dfac4c0ce0d273e',
  'stories/assets/fonts/roboto-condensed/roboto-condensed.scss':
    '206a320cb9cefbabb300a7bd233a2950267ebdf087cf026e5c3d8279a41ada02',
  'examples/figma-plugin/holistic/assets/search-results/source-footprints.json':
    'f1a206d128880a98375eb6f610437328fdcc296de3275d50a3692df0378206c1',
  'examples/figma-plugin/holistic/assets/card-content/bali-publication-cover.jpg':
    '4770262ae2ee8715facebeb0ff0c70b45ce8831e9fb36f79fafbeecfeed50370',
  'examples/figma-plugin/holistic/assets/search-results/bali-landscape.jpg':
    '5aef058e2b3e9d08cb8605406f4fc6bc31cd9424113a31594bb01fd1d309a5ea',
  'stories/assets/fonts/roboto-condensed/sass/_variables.scss':
    'af157df7df4276d396e7a636039dd353e9e9849163564b30dbbb299aafc34940',
  'stories/assets/fonts/roboto-condensed/sass/_mixins.scss':
    'a53206df9ff982de438f1472ccb571acb7c923d2fdcc8c72f2ce5ece96a1f6d4',
  'stories/assets/fonts/roboto-condensed/sass/_Regular.scss':
    '83e36cfc43d952acf7e4e15f3f8068de84930b5412a433926fab097d44105ce7',
  'stories/assets/fonts/roboto-condensed/sass/_Bold.scss':
    'efc8c49d945c5d2cd940ed51f2cf1fc16d6011cc5f4ac85bbaaca1868bccb70b',
  'examples/figma-plugin/holistic/assets/page-patterns/source-fonts/Roboto-Regular.woff2':
    '47107401d0adb375ab9aa167f9d62489a849d510e740a307b5a4db60e5db3562',
  'examples/figma-plugin/holistic/assets/page-patterns/source-fonts/Roboto-Bold.woff2':
    '8e44376b735dcc9027acbcc8a0df64c3f886a23529eff27b022f344d719e90f2',
  'examples/figma-plugin/holistic/assets/content-hub/source-fonts/RobotoCondensed-Regular.woff2':
    '0cdd3d13492236edd2bc1c3d48f7d7f7270b2d52214d2a3d114d6fcb0c6f04d2',
};
const FOOTPRINTS =
  'examples/figma-plugin/holistic/assets/search-results/source-footprints.json';
const SOURCE_FILE =
  'stories/Components/SyndicationSearchWidget/components/ResultItem.jsx';
const hash = x => crypto.createHash('sha256').update(x).digest('hex');
const copy = x => JSON.parse(JSON.stringify(x));
function guardResultSources(root) {
  guardSearchSources(root);
  for (const [file, expected] of Object.entries(SOURCE_HASHES))
    if (hash(fs.readFileSync(path.join(root, file))) !== expected)
      throw Error(`Search result source contract needs updating: ${file}`);
}
/** Explicit new API-input fixture, not a replacement for authored /image.jpg. */
function buildSearchResultFixtures({ root }) {
  guardResultSources(root);
  const fixtures = buildSearchFixturesSync({ root });
  const loader = createSearchSourceLoaderSync({ root });
  const sourceCard = loader.load(
    'stories/Components/ScrollContainer/ScrollContainerExamples.jsx'
  ).scrollCardExamples[1];
  const hit = copy(fixtures.hits.authoredTeaser);
  hit._id = 'source-derived-scroll-publication';
  hit._source.title = sourceCard.title;
  hit._source.url = '#scroll-example-2';
  hit._source.teaser = hit._source.teaser
    .replaceAll('/node/1', '#scroll-example-2')
    .replace('/image.jpg', sourceCard.image)
    .replace('alt="Cover"', `alt="${sourceCard.alt}"`)
    .replace('>Title<', `>${sourceCard.title}<`)
    .replace('Description summary text', sourceCard.summary);
  return {
    kind: 'source-derived-search-result-input',
    original: fixtures,
    imageHit: hit,
    provenance: {
      input: 'Existing authored ResultItem test teaser anatomy',
      metadata:
        'Exact ScrollContainerExamples[1] title, summary, alt and image',
      destination:
        'Existing authored ScrollExampleCard index1 anchor #scroll-example-2',
      date: 'Existing ResultItem test date, not a publication date claim',
      responseCaptured: false,
      portraitAsset:
        'examples/figma-plugin/holistic/assets/card-content/bali-publication-cover.jpg',
      landscapeAsset:
        'examples/figma-plugin/holistic/assets/search-results/bali-landscape.jpg',
      landscapeUrl:
        'https://www.undrr.org/sites/default/files/styles/landscape_16_9/public/2022-08/Bali.JPG.jpg',
    },
  };
}
function buildSearchResultRecipes({ root, modes, variables, styles }) {
  guardResultSources(root);
  const source = JSON.parse(
    fs.readFileSync(path.join(root, FOOTPRINTS), 'utf8')
  );
  const fail = m => {
    throw Error(`Search result recipe needs updating: ${m}`);
  };
  if (
    modes
      .map(m => m.id)
      .sort()
      .join(',') !== 'delta,irp,mcr,preventionweb,undrr'
  )
    fail('Five exact source modes required');
  const byName = new Map();
  for (const v of variables) {
    if (byName.has(v.name)) fail(`Duplicate variable ${v.name}`);
    byName.set(v.name, v);
  }
  function resolve(name, mode, type, seen = new Set()) {
    const v = byName.get(name);
    if (!v || v.type !== type || seen.has(name))
      fail(`Missing/wrong-type/cyclic role ${name}`);
    seen.add(name);
    const x = v.values[mode.id];
    if (x === undefined) fail(`Missing role value ${name}/${mode.id}`);
    if (x && typeof x === 'object' && 'alias' in x) {
      if (Object.keys(x).length !== 1) fail(`Malformed alias ${name}`);
      return resolve(x.alias, mode, type, seen);
    }
    return x;
  }
  for (const expected of source.foundations)
    for (const m of modes) {
      if (byName.get(expected.name)?.id !== expected.id)
        fail(`Foundation identity changed ${expected.name}`);
      const actual = resolve(expected.name, m, expected.type);
      if (JSON.stringify(actual) !== JSON.stringify(expected.values[m.id]))
        fail(`Measured foundation changed ${expected.name}/${m.id}`);
    }
  function upsert(list, entry, key) {
    const hits = list.filter(
      e =>
        e.id === entry.id ||
        e[key] === entry[key] ||
        (entry.name && e.name === entry.name)
    );
    if (
      hits.length > 1 ||
      (hits.length &&
        (hits[0].id !== entry.id ||
          hits[0][key] !== entry[key] ||
          hits[0].name !== entry.name))
    )
      fail(`Foreign identity ${entry.id}`);
    const index = list.indexOf(hits[0]);
    if (index < 0) list.push(entry);
    else list[index] = entry;
  }
  function role(kind, type, values) {
    if (
      type === 'FLOAT' &&
      Object.values(values).some(v => !Number.isFinite(v))
    )
      fail('Nonfinite captured geometry');
    const name =
      'component/search-result/' +
      kind +
      '-' +
      hash(JSON.stringify(values)).slice(0, 16);
    const entry = {
      id: name.replaceAll('/', '.'),
      name,
      type,
      scopes: ['ALL_SCOPES'],
      description: 'Finite measured source SearchResults/ResultItem candidate',
      sourceRef: { file: SOURCE_FILE, line: 177 },
      values,
    };
    upsert(variables, entry, 'name');
    byName.set(name, entry);
    return name;
  }
  const number = (kind, values) => role(kind, 'FLOAT', values);
  function coordinate(kind, all) {
    const first = all[modes[0].id];
    if (!Number.isFinite(first) || Object.values(all).some(x => x !== first))
      fail(`Mode-varying ${kind} needs a positioned-node capability`);
    return first;
  }
  function rgba(text) {
    const match = /^rgba?\(([^)]+)\)$/.exec(text);
    if (!match) fail(`Unsupported captured color ${text}`);
    const x = match[1].split(',').map(Number);
    if (x.length < 3 || x.some(n => !Number.isFinite(n)))
      fail('Malformed color');
    return { r: x[0] / 255, g: x[1] / 255, b: x[2] / 255, a: x[3] ?? 1 };
  }
  const samePaint = (a, b) =>
    a.a === (b.a ?? 1) &&
    ['r', 'g', 'b'].every(
      k => Math.round(a[k] * 255) === Math.round(b[k] * 255)
    );
  function color(kind, values) {
    const paints = Object.fromEntries(
      modes.map(m => [m.id, rgba(values[m.id])])
    );
    const candidates = [
      'color/interactive',
      'color/text',
      'color/neutral-500',
      'color/neutral-50',
      'color/neutral-25',
      'color/blue-50',
      'color/red-50',
      'color/red-400',
      'color/blue-900',
      'color/neutral-0',
    ];
    for (const name of candidates)
      if (
        byName.has(name) &&
        modes.every(m => samePaint(paints[m.id], resolve(name, m, 'COLOR')))
      )
        return name;
    // Source hardcoded and alpha-bearing colors retain their own all-mode values.
    return role(kind, 'COLOR', paints);
  }
  const captures = new Map(
    source.captures.map(c => [`${c.brand}/${c.viewport}`, c])
  );
  function sceneFor(mode, viewport, id) {
    const scene = captures
      .get(`${mode.id}/${viewport}`)
      ?.scenes.find(s => s.id === id);
    if (!scene) fail(`Missing measured scene ${mode.id}/${viewport}/${id}`);
    return scene;
  }
  const values = get => Object.fromEntries(modes.map(m => [m.id, get(m)]));
  const descriptors = new Map(
    source.sourceContracts.map(s => [s.id, s.contract])
  );
  const cache = new Map();
  function textStyle(nodes, pseudo = false) {
    const vals = values(m => {
      const s = pseudo ? nodes[m.id] : source.styles[nodes[m.id].styles];
      const family = s.fontFamily.includes('Roboto Condensed')
        ? 'Roboto Condensed'
        : s.fontFamily.startsWith('Roboto,')
          ? 'Roboto'
          : null;
      const weight = Number(s.fontWeight);
      if (
        !family ||
        ![400, 500, 600, 700].includes(weight) ||
        s.fontStyle !== 'normal'
      )
        fail('Unsupported measured named font');
      if (weight === 500 && family !== 'Roboto Condensed')
        fail('Unverified requested500 font');
      const token =
        family === 'Roboto Condensed' ? 'font-family/ui' : 'font-family/text';
      if (resolve(token, m, 'STRING') !== family)
        fail('Source font-family differs from role');
      return {
        fontName: { family, style: weight >= 600 ? 'Bold' : 'Regular' },
        fontSize: parseFloat(s.fontSize),
        lineHeight: { unit: 'PIXELS', value: parseFloat(s.lineHeight) },
        letterSpacing: {
          unit: 'PIXELS',
          value: s.letterSpacing === 'normal' ? 0 : parseFloat(s.letterSpacing),
        },
        textCase: s.textTransform === 'uppercase' ? 'UPPER' : 'ORIGINAL',
        textDecoration: 'NONE',
        paragraphSpacing: 0,
      };
    });
    const key = hash(JSON.stringify(vals));
    if (cache.has(key)) return cache.get(key);
    const id = 'component/search-result/text-' + key.slice(0, 16),
      fontSize = number(
        'font-size',
        values(m => vals[m.id].fontSize)
      );
    upsert(
      styles.text,
      {
        id,
        name: 'Mangrove draft / Search result / ' + key.slice(0, 16),
        description:
          'Measured source named-face candidate. Requested600 maps to bundled Bold700; Condensed500 to bundled Regular400, explicit face matching inferences, native glyph equivalence open.',
        sourceRef: { file: SOURCE_FILE, line: 362 },
        bindings: {
          fontFamily:
            vals.undrr.fontName.family === 'Roboto Condensed'
              ? 'font-family/ui'
              : 'font-family/text',
          fontSize,
        },
        values: vals,
      },
      'id'
    );
    cache.set(key, id);
    return id;
  }
  const families = [
    ['search-result-item', 'Search result item'],
    ['search-result-fields', 'Search result field visibility'],
    ['search-result-state', 'Search results state'],
  ].map(([id, name]) => ({
    id,
    name,
    kind: 'component-set',
    description: 'Source-specific finite source result anatomy',
    review: { genericLabels: false, preserveVariantSizing: true },
    limitations: [
      'Exact English standalone padded Storybook source at viewports390/1164, content widths358/1132; not sidebar/widget allocation or arbitrary responsive reflow.',
      'Source fixtures include authored tests and explicit structural probes; distinct source-derived real-image API fixture is not a captured endpoint response.',
      'Fixed source inline segment allocations preserve native editable segment text; changing copy does not rerun CSS wrapping or regenerate highlight positions.',
      'Requested600/Bold700 and Condensed500/Regular400 named faces are source font matching inferences; native bytes/glyphs/wrapping and mode change acceptance remain open.',
      'Loading skeleton is a paused source keyframe0 snapshot; animation, network, focus, accessibility announcements, scripts/locales and publication are separate gates.',
      'All seven field selectors are covered by source fixtures, but authored test teaser lacks some corresponding fields; absence does not establish populated field visual fidelity.',
    ],
    sourceRefs: [
      { file: SOURCE_FILE, line: 177 },
      {
        file: 'stories/Components/SyndicationSearchWidget/components/SearchResults.jsx',
        line: 35,
      },
    ],
    variants: [],
  }));
  for (const contract of source.sourceContracts)
    for (const viewport of [390, 1164]) {
      const scenes = Object.fromEntries(
        modes.map(m => [m.id, sceneFor(m, viewport, contract.id)])
      );
      const records = Object.fromEntries(
        modes.map(m => [
          m.id,
          new Map(
            scenes[m.id].nodes.map(i => [source.nodes[i].id, source.nodes[i]])
          ),
        ])
      );
      const sourceNodes = scenes.undrr.nodes.map(i => source.nodes[i]);
      const trees = new Map();
      for (const n of sourceNodes) {
        const all = Object.fromEntries(
          modes.map(m => [m.id, records[m.id].get(n.id)])
        );
        if (
          modes.some(
            m =>
              !all[m.id] || all[m.id].tag !== n.tag || all[m.id].cls !== n.cls
          )
        )
          fail('Source anatomy changed across modes');
        const sty = source.styles[n.styles];
        const node = {
          id: n.id.replaceAll('/', '-'),
          name: n.cls || n.tag,
          type: 'FRAME',
          layout: {
            mode: 'NONE',
            width: number(
              'width',
              values(m => all[m.id].rect.width)
            ),
            height: number(
              'height',
              values(m => all[m.id].rect.height)
            ),
            clipsContent: sty.overflow === 'hidden',
          },
          position: {
            x: coordinate(
              'x',
              values(m => all[m.id].rect.x)
            ),
            y: coordinate(
              'y',
              values(m => all[m.id].rect.y)
            ),
          },
          children: [],
        };
        if (sty.backgroundColor !== 'rgba(0, 0, 0, 0)')
          node.fill = color(
            'background',
            values(m => source.styles[all[m.id].styles].backgroundColor)
          );
        if (sty.backgroundImage !== 'none') {
          if (
            !n.cls.startsWith('mg-search__skeleton-') ||
            !sty.backgroundImage.startsWith('linear-gradient(90deg,')
          )
            fail('Unreviewed source gradient');
          const colors = [
            ...sty.backgroundImage.matchAll(/rgba?\([^)]+\)/g),
          ].map(x => x[0]);
          if (colors.length !== 3) fail('Skeleton gradient colors changed');
          node.gradient = {
            layers: [
              {
                transform: [
                  [1, 0, 0],
                  [0, 1, 0],
                ],
                stops: [
                  {
                    position: 0,
                    color: color(
                      'skeleton-background',
                      values(
                        m =>
                          [
                            ...source.styles[
                              all[m.id].styles
                            ].backgroundImage.matchAll(/rgba?\([^)]+\)/g),
                          ][0][0]
                      )
                    ),
                  },
                  {
                    position: 0.5,
                    color: color(
                      'skeleton-background',
                      values(
                        m =>
                          [
                            ...source.styles[
                              all[m.id].styles
                            ].backgroundImage.matchAll(/rgba?\([^)]+\)/g),
                          ][0][0]
                      )
                    ),
                  },
                  {
                    position: 1,
                    color: color(
                      'skeleton-highlight',
                      values(
                        m =>
                          [
                            ...source.styles[
                              all[m.id].styles
                            ].backgroundImage.matchAll(/rgba?\([^)]+\)/g),
                          ][1][0]
                      )
                    ),
                  },
                ],
              },
            ],
          };
          delete node.fill;
        }
        node.bindings = {
          cornerRadius: number(
            'radius',
            values(m =>
              parseFloat(source.styles[all[m.id].styles].borderRadius)
            )
          ),
          opacity: number(
            'opacity',
            values(m => Number(source.styles[all[m.id].styles].opacity))
          ),
        };
        for (const [field, css] of [
          ['topLeftRadius', 'borderTopLeftRadius'],
          ['topRightRadius', 'borderTopRightRadius'],
          ['bottomLeftRadius', 'borderBottomLeftRadius'],
          ['bottomRightRadius', 'borderBottomRightRadius'],
        ])
          node.bindings[field] = number(
            field,
            values(m => parseFloat(source.styles[all[m.id].styles][css]))
          );
        const edges = ['Top', 'Right', 'Bottom', 'Left'];
        const visibleEdges = edges.filter(
          edge => parseFloat(sty['border' + edge + 'Width']) > 0
        );
        if (visibleEdges.length) {
          const first = visibleEdges[0];
          if (
            visibleEdges.some(
              edge =>
                sty['border' + edge + 'Color'] !==
                sty['border' + first + 'Color']
            )
          )
            fail(
              'Different visible edge paints need explicit renderer capability'
            );
          node.stroke = color(
            'border',
            values(
              m => source.styles[all[m.id].styles]['border' + first + 'Color']
            )
          );
          node.bindings.strokeWeight = number(
            'stroke-zero',
            values(() => 0)
          );
          for (const edge of edges)
            node.bindings['stroke' + edge + 'Weight'] = number(
              'stroke-' + edge.toLowerCase(),
              values(m =>
                parseFloat(
                  source.styles[all[m.id].styles]['border' + edge + 'Width']
                )
              )
            );
        }
        if (n.image) {
          if (
            !n.image.width ||
            !n.image.height ||
            modes.some(m => all[m.id].image.src !== n.image.src)
          )
            fail('Source image did not load');
          const landscape = n.image.src.includes('/landscape_16_9/'),
            file = landscape
              ? 'examples/figma-plugin/holistic/assets/search-results/bali-landscape.jpg'
              : 'examples/figma-plugin/holistic/assets/card-content/bali-publication-cover.jpg';
          if (!n.image.src.endsWith('/2022-08/Bali.JPG.jpg'))
            fail('Unknown image source');
          node.image = {
            assetId: landscape
              ? 'search-result-bali-landscape'
              : 'search-result-bali-portrait',
            base64: fs.readFileSync(path.join(root, file)).toString('base64'),
            scaleMode: 'FILL',
          };
        }
        // Actual direct DOM text segments preserve bold/error and highlighted inline boxes.
        const segments = n.texts
          .flatMap(text =>
            text.lines.map((line, index) => ({
              ...line,
              id: text.id + '-line-' + index,
              textId: text.id,
              lineIndex: index,
            }))
          )
          .filter(line => line.text.trim() && line.rect.width > 0);
        for (const text of segments) {
          const allText = Object.fromEntries(
            modes.map(m => [
              m.id,
              all[m.id].texts.find(t => t.id === text.textId)?.lines[
                text.lineIndex
              ],
            ])
          );
          if (
            modes.some(m => !allText[m.id] || allText[m.id].text !== text.text)
          )
            fail('Text/source anatomy changed');
          node.children.push({
            id: n.id.replaceAll('/', '-') + '-' + text.id,
            name: 'Editable ' + text.id,
            type: 'TEXT',
            characters: text.text,
            textProperty: 'Text ' + n.id + ' ' + text.id,
            textStyle: textStyle(all),
            fill: color(
              'text',
              values(m => source.styles[all[m.id].styles].color)
            ),
            textWrap: 'AUTO',
            layout: {
              width: coordinate(
                'text-width',
                values(m => allText[m.id].rect.width)
              ),
              height: coordinate(
                'text-height',
                values(m =>
                  Math.max(
                    allText[m.id].rect.height,
                    parseFloat(source.styles[all[m.id].styles].lineHeight)
                  )
                )
              ),
            },
            position: {
              x: coordinate(
                'text-x',
                values(m => allText[m.id].rect.x)
              ),
              y: coordinate(
                'text-y',
                values(m => allText[m.id].rect.y)
              ),
            },
          });
        }
        if (n.before !== undefined) {
          const pseudo = source.styles[n.before];
          if (pseudo.content !== '"•"')
            fail('Unsupported source pseudo element');
          const ps = Object.fromEntries(
            modes.map(m => [m.id, source.styles[all[m.id].before]])
          );
          node.children.unshift({
            id: n.id.replaceAll('/', '-') + '-before-bullet',
            name: 'Source metadata bullet',
            type: 'TEXT',
            characters: '•',
            textStyle: textStyle(ps, true),
            fill: color(
              'bullet',
              values(m => ps[m.id].color)
            ),
            layout: {
              width: coordinate(
                'bullet-width',
                values(
                  m =>
                    all[m.id].texts[0].rect.x -
                    parseFloat(ps[m.id].marginInlineEnd)
                )
              ),
              height: coordinate(
                'bullet-height',
                values(m => parseFloat(ps[m.id].lineHeight))
              ),
            },
            position: {
              x: coordinate(
                'bullet-x',
                values(() => 0)
              ),
              y: coordinate(
                'bullet-y',
                values(() => 0)
              ),
            },
          });
        }
        if (n.after !== undefined)
          fail('Unsupported source after pseudo element');
        node.children = node.children.map(text => {
          const positioned = text.position;
          delete text.position;
          const layout = text.layout;
          text.layout = { width: layout.width, height: 'HUG' };
          return {
            id: text.id + '-slot',
            name: 'Source text segment allocation',
            type: 'FRAME',
            position: positioned,
            layout: {
              mode: 'VERTICAL',
              width: layout.width,
              height: layout.height,
              clipsContent: false,
            },
            children: [text],
          };
        });
        trees.set(n.id, node);
        if (n.id !== 'root') {
          const parent = trees.get(n.id.slice(0, n.id.lastIndexOf('/')));
          if (!parent) fail('Missing source parent');
          parent.children.push(node);
        }
      }
      const tree = trees.get('root');
      delete tree.position;
      const family =
        families[
          contract.id.startsWith('state-')
            ? 2
            : contract.id.startsWith('field-')
              ? 1
              : 0
        ];
      family.variants.push({
        id: family.id + '.' + contract.id + '.' + viewport,
        name: `Fixture=${contract.id}, Viewport=${viewport}`,
        properties: { Fixture: contract.id, Viewport: String(viewport) },
        tree,
        sourceContract: {
          ...descriptors.get(contract.id),
          viewport,
          sourceContentWidth: viewport - 32,
        },
      });
    }
  return families;
}
module.exports = {
  buildSearchResultRecipes,
  buildSearchResultFixtures,
  guardResultSources,
  SOURCE_HASHES,
};
