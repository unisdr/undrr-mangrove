/** Audited ArticleStory prerequisites and finite dependencies. Full assembly remains blocked. */
'use strict';
const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');
const PROVENANCE =
  'examples/figma-plugin/holistic/assets/news-detail/provenance.json';
const PROVENANCE_HASH =
  '62b6ec051903a5124b2f80625e1990c5c339fe4c0dc0c69ed2d34c34f3b3ccec';
const DEPENDENCIES = [
  {
    id: 'page-chrome',
    status: 'bounded-source-contract',
    contract:
      'Closed390/1164; separate open desktop/mobile surfaces must match their own viewport contracts. Source does not import Footer.',
  },
  {
    id: 'news-detail-article-column',
    status: 'requires-section-decomposition',
    contract:
      'Reuse exact three headings/nine HTTPS rich paragraphs, preserving source placement of quote, float and embed. Existing compact slice is not a complete column.',
  },
  {
    id: 'page-bulleted-toc',
    status: 'bounded-source-contract',
    contract:
      'Actual article three internal-anchor labels at390/1164. Scrollspy and anchors remain interaction metadata.',
  },
  {
    id: 'quote-highlight',
    status: 'bounded-source-contract',
    contract:
      'Exact ArticleStory light full quote with32px/116% narrow and40px/115% desktop typography. Native font/paint acceptance open.',
  },
  {
    id: 'article-header',
    status: 'requires-image-bearing-header-treatments',
    contract:
      'No-image article-header390/1164 source presets exist with genuine Tag and linked metadata. Four actual image-bearing treatments including split Hero still require exact source image/caption assets and composition.',
  },
  {
    id: 'share-buttons',
    status: 'bounded-source-contract',
    contract:
      'Four share-buttons390/1164 source presets cover actual native-share capability branch, LinkedIn/Facebook/X/email/QR actions and own copy button. Exact SVG paths/modes/native raster and sharing/QR/copy/clipboard runtime remain separate.',
  },
  {
    id: 'article-float-highlight',
    status: 'missing-rich-float-contract',
    contract:
      'Secondary HighlightBox with inline Bold45 and11, width100% narrow/30% desktop and20px logical margin. Desktop next-section paragraph has variable line widths beside this float.',
  },
  {
    id: 'embed-container',
    status: 'unsupported-live-surface',
    contract:
      'Authored16:9 wrapper and exact YouTubeURL/title. No native iframe or source-authored poster exists in current builder. No blank-frame/media substitute.',
  },
  {
    id: 'article-related-cards',
    status: 'bounded-source-contract',
    contract:
      'Six news-related-card source presets retain actual three titles/summaries, pinned2160x1440 photograph and source destinations. Initial finite caret is a measured source mirror; native title link/edited-caret reflow, source image licence grant and native raster remain open.',
  },
  {
    id: 'article-recommendations',
    status: 'bounded-source-contract',
    contract:
      'Two news-recommendations source presets preserve three authored HTTPS links as editable rich TEXT, actual multiline LI/UL allocations and measured UA-disc vector candidate. Candidate source raster differs11-22 crop pixels/up to1px narrow y; native/source marker pixels and arbitrary edited reflow remain open.',
  },
  {
    id: 'article-taxonomy',
    status: 'bounded-source-contract',
    contract:
      'Two news-taxonomy source presets retain actual Hazards/Themes/Country labels and six genuine native Default Tag instances with recorded initial wrap rows, source paint and5px/10px brand radius. Exact taxonomy URLs remain metadata; native links/arbitrary edited row reflow remain open.',
  },
  {
    id: 'user-feedback',
    status: 'bounded-source-contract',
    contract:
      'Actual initial feedback after shell; narrow/desktop presets must match observed source allocation. Submission and linked confirmation are separate contracts.',
  },
];
function inspectNewsDetailPrerequisites({ root }) {
  const hash = file =>
    crypto
      .createHash('sha256')
      .update(fs.readFileSync(path.join(root, file)))
      .digest('hex');
  if (hash(PROVENANCE) !== PROVENANCE_HASH)
    throw Error('News detail audit provenance changed');
  const provenance = JSON.parse(
    fs.readFileSync(path.join(root, PROVENANCE), 'utf8')
  );
  for (const [file, expected] of Object.entries(provenance.sourceHashes))
    if (hash(file) !== expected)
      throw Error(`News detail source contract changed: ${file}`);
  const evidence = JSON.parse(
    fs.readFileSync(
      path.join(
        root,
        'examples/figma-plugin/holistic/assets/news-detail/source-footprints.json'
      ),
      'utf8'
    )
  );
  if (
    Object.keys(evidence.scenes).length !== 50 ||
    Object.keys(evidence.floatFragments).length !== 10
  )
    throw Error('News detail source case coverage changed');
  return {
    schema: 'mangrove-news-detail-prerequisites-v1',
    source: provenance.source,
    sourceSceneCount: 50,
    floatDiagnosticCount: 10,
    sourceViewportPresets: [390, 1164],
    locale: 'English',
    families: [],
    assemblyReady: false,
    dependencies: JSON.parse(JSON.stringify(DEPENDENCIES)),
    remainingNativeGates: [
      'native fonts/rich default preparation',
      'native source layout and consumer override retention',
      'publication/composite acceptance',
      'maintenance recovery drift',
      'human novice handoff',
      'reduced merge acceptance',
    ],
  };
}
function buildNewsDetailRecipes(options) {
  const report = inspectNewsDetailPrerequisites(options);
  throw Error(
    'Full authored News detail assembly is blocked: ' +
      report.dependencies
        .filter(
          d =>
            d.status.startsWith('missing') ||
            d.status.startsWith('requires') ||
            d.status.startsWith('unsupported')
        )
        .map(d => d.id)
        .join(', ')
  );
}
module.exports = { inspectNewsDetailPrerequisites, buildNewsDetailRecipes };

const DEPENDENCY_PROVENANCE =
  'examples/figma-plugin/holistic/assets/news-detail/dependency-provenance.json';
const DEPENDENCY_PROVENANCE_HASH =
  '0b541b511cf3bce8e03dbd7a392ce8efa3a60b379e95e311aaa36ff197ae1fca';
/** Finite source dependencies only, never a complete ArticleStory assembly. */
function buildNewsDetailDependencyRecipes({ root, modes, variables, styles }) {
  const originalVariables = variables,
    originalStyles = styles;
  variables = variables.map(v => structuredClone(v));
  styles = { ...styles, text: styles.text.map(s => structuredClone(s)) };
  inspectNewsDetailPrerequisites({ root });
  const hash = file =>
    crypto
      .createHash('sha256')
      .update(fs.readFileSync(path.join(root, file)))
      .digest('hex');
  const fail = m => {
    throw Error('News detail dependency source changed: ' + m);
  };
  if (hash(DEPENDENCY_PROVENANCE) !== DEPENDENCY_PROVENANCE_HASH)
    fail('dependency provenance');
  const provenance = JSON.parse(
    fs.readFileSync(path.join(root, DEPENDENCY_PROVENANCE), 'utf8')
  );
  for (const [file, h] of Object.entries({
    ...provenance.sourceHashes,
    ...provenance.evidenceHashes,
  }))
    if (hash(file) !== h) fail(file);
  if (
    modes
      .map(m => m.id)
      .sort()
      .join(',') !== 'delta,irp,mcr,preventionweb,undrr'
  )
    fail('five modes required');
  const captures = JSON.parse(
    fs.readFileSync(
      path.join(
        root,
        'examples/figma-plugin/holistic/assets/news-detail/dependency-footprints.json'
      ),
      'utf8'
    )
  );
  const names = new Map(variables.map(v => [v.name, v]));
  function value(name, mode, type, seen = new Set()) {
    const v = names.get(name);
    if (!v || v.type !== type || seen.has(name))
      fail('missing/wrong/cyclic ' + name);
    seen.add(name);
    const x = v.values[mode.id];
    if (x == null) fail(name + '/' + mode.id);
    return x.alias ? value(x.alias, mode, type, seen) : x;
  }
  function upsert(list, entry) {
    const hits = list.filter(e => e.id === entry.id || e.name === entry.name);
    if (
      hits.length > 1 ||
      (hits.length && (hits[0].id !== entry.id || hits[0].name !== entry.name))
    )
      fail('foreign identity ' + entry.id);
    if (hits.length) list[list.indexOf(hits[0])] = entry;
    else list.push(entry);
    if (entry.type) names.set(entry.name, entry);
  }
  const ref = {
    file: 'stories/Components/Buttons/ShareButtons/share-buttons.scss',
    line: 9,
  };
  function role(slug, type, get, scopes = ['ALL_SCOPES']) {
    const name = 'component/news-dependency/' + slug;
    upsert(variables, {
      id: name.replaceAll('/', '.'),
      name,
      type,
      scopes,
      sourceRef: ref,
      description: 'Finite authored ArticleStory dependency source projection.',
      hiddenFromPublishing: false,
      codeSyntax: {},
      values: Object.fromEntries(modes.map(m => [m.id, get(m)])),
    });
    return name;
  }
  const num = (slug, get, scopes) =>
    role(slug, 'FLOAT', typeof get === 'function' ? get : () => get, scopes);
  for (const m of modes) {
    if (value('font-family/text', m, 'STRING') !== 'Roboto')
      fail('Latin Roboto source font');
    for (const [name, n] of [
      ['spacing/100', 10],
      ['spacing/50', 5],
      ['font-size/300', 16],
      ['font-size/250', 14],
      ['font-size/400', 18],
    ])
      if (value(name, m, 'FLOAT') !== n) fail('source foundation ' + name);
  }
  const border = num('one', 1, ['STROKE_FLOAT']),
    action = num('share-action', 40, ['WIDTH_HEIGHT']),
    clip = num('share-copy-slot', 24, ['WIDTH_HEIGHT']);
  const iconSize = role(
      'share-icon-size',
      'FLOAT',
      () => ({ alias: 'font-size/400' }),
      ['WIDTH_HEIGHT']
    ),
    copyIcon = role(
      'share-copy-icon-size',
      'FLOAT',
      () => ({ alias: 'font-size/300' }),
      ['WIDTH_HEIGHT']
    );
  const iconStroke = num(
      'share-icon-stroke',
      m => (2 * value('font-size/400', m, 'FLOAT')) / 24,
      ['STROKE_FLOAT']
    ),
    copyStroke = num(
      'share-copy-icon-stroke',
      m => (2 * value('font-size/300', m, 'FLOAT')) / 24,
      ['STROKE_FLOAT']
    );
  const transparent = role('share-transparent', 'COLOR', m => ({
      ...value('color/text', m, 'COLOR'),
      a: 0,
    })),
    copyBorder = role('share-copy-border', 'COLOR', m => ({
      ...value('color/neutral-300', m, 'COLOR'),
      a: 0.4,
    }));
  function textStyle(slug, size, weight, line) {
    const id = 'component.news-dependency.' + slug;
    upsert(styles.text, {
      id,
      name: 'Mangrove/source/news-dependency/' + slug,
      description:
        'Actual Latin source typography. Requested600 uses source available Bold700; native face/render acceptance remains open.',
      bindings: { fontFamily: 'font-family/text', fontSize: size },
      values: Object.fromEntries(
        modes.map(m => [
          m.id,
          {
            fontName: {
              family: value('font-family/text', m, 'STRING'),
              style: weight,
            },
            fontSize: value(size, m, 'FLOAT'),
            lineHeight: { unit: 'PIXELS', value: line },
            letterSpacing: { unit: 'PIXELS', value: 0 },
            textDecoration: 'NONE',
            textWrapStyle: 'AUTO',
          },
        ])
      ),
    });
    return id;
  }
  const headingStyle = textStyle('share-heading', 'font-size/300', 'Bold', 24),
    copyStyle = textStyle('share-copy', 'font-size/250', 'Regular', 21);
  const css = fs.readFileSync(
    path.join(root, 'stories/Atom/Icons/_icon-definitions.scss'),
    'utf8'
  );
  function svgAsset(icon, size = 18) {
    const match = new RegExp(
      '\\.mg-icon-' +
        icon +
        '::before \\{[\\s\\S]*?data:image/svg\\+xml,([^\\"]+)'
    ).exec(css);
    if (!match) fail('source mask ' + icon);
    const sourceMarkup = decodeURIComponent(match[1]);
    const markup = sourceMarkup
      .replaceAll("'", '"')
      .replaceAll('currentColor', '#000000');
    if (!markup.includes('viewBox="0 0 24 24"'))
      fail('square source mask ' + icon);
    const stroked = markup.includes('stroke="');
    return {
      id: 'icon-' + icon,
      type: 'SVG',
      name: icon,
      svg: {
        assetId: 'news-detail.share.' + icon,
        markup,
        monochrome: { [stroked ? 'strokes' : 'fills']: 'color/text' },
        ...(stroked
          ? {
              sizing: {
                size: size === 18 ? iconSize : copyIcon,
                strokeWidth: size === 18 ? iconStroke : copyStroke,
              },
            }
          : {}),
      },
      layout: { width: size, height: size },
    };
  }
  const variants = [];
  for (const viewport of [390, 1164])
    for (const available of [true, false]) {
      const sample =
        captures[available ? 'primaryScenes' : 'noShareDiagnostics'][
          'undrr-' + viewport + (available ? '' : '-no-share')
        ].share;
      const width = num(
        'share-width-' + viewport,
        m => captures.primaryScenes[m.id + '-' + viewport].share.rect.width,
        ['WIDTH_HEIGHT']
      );
      const actions = sample.children[1].children;
      if (actions.length !== (available ? 6 : 5))
        fail('source capability branch');
      const actionNodes = actions.map((n, i) => {
        const icon = /mg-icon-([\w-]+)/.exec(n.children[0].classes)?.[1];
        if (
          !icon ||
          n.rect.width !== 40 ||
          n.rect.height !== 40 ||
          n.children[0].pseudoMask.width !== '18px'
        )
          fail('source action geometry');
        return {
          id: 'action-' + icon,
          type: 'FRAME',
          name: n.ariaLabel,
          fill: transparent,
          stroke: transparent,
          bindings: {
            width: action,
            height: action,
            strokeWeight: border,
            paddingTop: 'spacing/100',
            paddingBottom: 'spacing/100',
            paddingLeft: 'spacing/100',
            paddingRight: 'spacing/100',
            cornerRadius: 'radius/button',
          },
          strokesIncludedInLayout: true,
          layout: {
            mode: 'HORIZONTAL',
            width: 40,
            height: 40,
            primaryAlign: 'CENTER',
            counterAlign: 'CENTER',
          },
          children: [svgAsset(icon)],
        };
      });
      const copyLabel = sample.children[2].children[1].text;
      variants.push({
        id:
          'share-buttons.' +
          viewport +
          '.' +
          (available ? 'device' : 'platforms'),
        name:
          'SourceViewport=' +
          viewport +
          ', NativeShare=' +
          (available ? 'Available' : 'Unavailable'),
        properties: {
          SourceViewport: String(viewport),
          NativeShare: available ? 'Available' : 'Unavailable',
        },
        tree: {
          id: 'root',
          type: 'FRAME',
          bindings: { itemSpacing: 'spacing/100' },
          layout: { mode: 'VERTICAL', width, height: 'HUG' },
          children: [
            {
              id: 'heading',
              type: 'TEXT',
              characters: sample.children[0].text,
              textProperty: 'Heading',
              textWrap: 'BALANCE',
              textStyle: headingStyle,
              fill: 'color/text',
              layout: { width: 'FILL', height: 24 },
            },
            {
              id: 'actions',
              type: 'FRAME',
              bindings: {
                itemSpacing: 'spacing/50',
              },
              layout: {
                mode: 'HORIZONTAL',
                wrap: 'WRAP',
                counterGap: 'spacing/50',
                width: 'FILL',
                height: 'HUG',
                counterAlign: 'CENTER',
              },
              children: actionNodes,
            },
            {
              id: 'copy',
              type: 'FRAME',
              name: 'Copy link',
              fill: 'color/neutral-25',
              stroke: copyBorder,
              bindings: {
                strokeWeight: border,
                cornerRadius: 'radius/button',
                paddingTop: 'spacing/100',
                paddingBottom: 'spacing/100',
                paddingLeft: 'spacing/100',
                paddingRight: 'spacing/100',
                itemSpacing: 'spacing/100',
              },
              strokesIncludedInLayout: true,
              layout: {
                mode: 'HORIZONTAL',
                width: 'FILL',
                height: 'HUG',
                counterAlign: 'CENTER',
                minHeight: 40,
              },
              children: [
                {
                  id: 'copy-leading',
                  type: 'FRAME',
                  layout: {
                    mode: 'HORIZONTAL',
                    width: 24,
                    height: 24,
                    primaryAlign: 'CENTER',
                    counterAlign: 'CENTER',
                  },
                  bindings: { width: clip, height: clip },
                  children: [svgAsset('link', 16)],
                },
                {
                  id: 'copy-label',
                  type: 'TEXT',
                  characters: copyLabel,
                  textProperty: 'Visible link',
                  textStyle: copyStyle,
                  fill: 'color/text',
                  layout: { width: 'FILL', height: 21 },
                },
                {
                  id: 'copy-trailing',
                  type: 'FRAME',
                  layout: {
                    mode: 'HORIZONTAL',
                    width: 24,
                    height: 24,
                    primaryAlign: 'CENTER',
                    counterAlign: 'CENTER',
                  },
                  bindings: { width: clip, height: clip },
                  children: [svgAsset('clone', 16)],
                },
              ],
            },
          ],
        },
      });
    }
  const headerVariants = [];
  for (const viewport of [390, 1164]) {
    const sample = captures.primaryScenes['undrr-' + viewport].intro;
    const width = num(
      'header-width-' + viewport,
      m => captures.primaryScenes[m.id + '-' + viewport].intro.rect.width,
      ['WIDTH_HEIGHT']
    );
    function measuredStyle(slug, index, weight) {
      const size = num(
        slug + '-size-' + viewport,
        m =>
          parseFloat(
            captures.primaryScenes[m.id + '-' + viewport].intro.children[index]
              .style.fontSize
          ),
        ['FONT_SIZE']
      );
      const line = parseFloat(sample.children[index].style.lineHeight);
      const id = textStyle(slug + '-' + viewport, size, weight, line);
      const spec = styles.text.find(s => s.id === id);
      for (const m of modes) {
        const raw =
          captures.primaryScenes[m.id + '-' + viewport].intro.children[index]
            .style.letterSpacing;
        spec.values[m.id].letterSpacing = {
          unit: 'PIXELS',
          value: raw === 'normal' ? 0 : parseFloat(raw),
        };
        if (!Number.isFinite(spec.values[m.id].letterSpacing.value))
          fail('source tracking');
      }
      return id;
    }
    const titleStyle = measuredStyle('header-title', 1, 'Bold'),
      summaryStyle = measuredStyle('header-summary', 2, 'Regular'),
      metadataStyle = textStyle(
        'header-metadata',
        'font-size/250',
        'Regular',
        21
      );
    const metadata = sample.children[3];
    let offset = 0;
    const runs = [];
    metadata.children.forEach((link, index) => {
      const start = metadata.text.indexOf(link.text, offset);
      if (start < offset || !link.href?.startsWith('https://'))
        fail('source linked metadata');
      if (start > offset)
        runs.push({
          id: index ? 'source-separator' : 'source-prefix',
          start: offset,
          end: start,
          textStyle: metadataStyle,
          fill: 'color/text',
          textDecoration: 'NONE',
        });
      runs.push({
        id: index ? 'source-santiago' : 'source-undrr',
        start,
        end: start + link.text.length,
        textStyle: metadataStyle,
        fill: 'color/interactive',
        textDecoration: 'NONE',
        hyperlink: { type: 'URL', value: link.href },
      });
      offset = start + link.text.length;
    });
    if (offset !== metadata.text.length) fail('source metadata suffix');
    const labelGap = num('header-label-gap', 16, ['GAP']),
      titleGap = num('header-title-gap', 10, ['GAP']),
      summaryGap = num(
        'header-summary-gap-' + viewport,
        parseFloat(sample.children[2].style.marginBottom),
        ['GAP']
      );
    const group = (id, child, padding) => ({
      id,
      type: 'FRAME',
      bindings: { paddingBottom: padding },
      layout: { mode: 'VERTICAL', width: 'FILL', height: 'HUG' },
      children: [child],
    });
    headerVariants.push({
      id: 'article-header.' + viewport + '.none',
      name: 'Image=None, SourceViewport=' + viewport,
      properties: { Image: 'None', SourceViewport: String(viewport) },
      tree: {
        id: 'root',
        type: 'FRAME',
        bindings: { paddingLeft: 'spacing/100', paddingRight: 'spacing/100' },
        layout: { mode: 'VERTICAL', width, height: 'HUG' },
        children: [
          group(
            'category',
            {
              id: 'category-tag',
              type: 'INSTANCE',
              family: 'tag',
              variant: { Tone: 'Default' },
              overrides: { Label: sample.children[0].text },
              expose: true,
              layout: { width: 'HUG', height: 'HUG' },
            },
            labelGap
          ),
          group(
            'title-group',
            {
              id: 'title',
              type: 'TEXT',
              characters: sample.children[1].text,
              textProperty: 'Title',
              textWrap: 'BALANCE',
              textStyle: titleStyle,
              fill: 'color/text',
              layout: { width: 'FILL', height: 'HUG' },
            },
            titleGap
          ),
          group(
            'summary-group',
            {
              id: 'summary',
              type: 'TEXT',
              characters: sample.children[2].text,
              textProperty: 'Summary',
              textWrap: 'BALANCE',
              textStyle: summaryStyle,
              fill: 'color/text',
              layout: {
                width: viewport === 1164 ? 784 : 'FILL',
                height: 'HUG',
              },
            },
            summaryGap
          ),
          {
            id: 'metadata',
            type: 'TEXT',
            characters: metadata.text,
            textRuns: runs,
            textWrap: 'BALANCE',
            layout: { width: 'FILL', height: 'HUG' },
          },
        ],
      },
    });
  }
  originalVariables.splice(0, originalVariables.length, ...variables);
  originalStyles.text.splice(0, originalStyles.text.length, ...styles.text);
  return [
    {
      id: 'article-header',
      name: 'ArticleStory no-image header',
      kind: 'component-set',
      source: {
        file: 'stories/Patterns/ArticleStory/ArticleStory.jsx',
        line: 453,
      },
      review: { genericLabels: false, preserveVariantSizing: true },
      dependencyContracts: [
        {
          family: 'tag',
          variant: { Tone: 'Default' },
          staticSourceHref: 'https://www.undrr.org/news',
        },
      ],
      limitations: [
        'Only actual English no-image intro at390/1164; four image-bearing header treatments remain separate.',
        'Native Tag instance retains source default paint and editable Label; linked category destination is source metadata, no hover/focus/navigation claim.',
        'Title/Summary and exposed TagLabel plain edits; linked date/source metadata is one editable rich TEXT with exact HTTPS source URLs, never a whole-string property.',
        'Source margins projected through explicit grouping/padding. Last14px metadata paragraph margin belongs to enclosing header flow and is intentionally not included in intro component. Native metrics/layout/render/consumer/publication open.',
      ],
      variants: headerVariants,
    },
    {
      id: 'share-buttons',
      name: 'ShareButtons source initial',
      kind: 'component-set',
      source: {
        file: 'stories/Components/Buttons/ShareButtons/ShareButtons.jsx',
        line: 371,
      },
      review: { genericLabels: false, preserveVariantSizing: true },
      limitations: [
        'Finite initial ArticleStory rail/narrow allocations only.',
        'Native share capability branch authored source; no runtime device sharing, URLs, clipboard, QR dialog or copied-state simulation.',
        'Editable Heading and Visible link only; source action accessible labels are metadata.',
        'Native fonts, exact SVG paths/mode stroke and consumer rendering/publication remain open.',
      ],
      variants,
    },
  ];
}
module.exports.buildNewsDetailDependencyRecipes =
  buildNewsDetailDependencyRecipes;

const RELATED_PROVENANCE =
  'examples/figma-plugin/holistic/assets/news-detail/related-card-provenance.json';
const RELATED_PROVENANCE_HASH =
  'a9c051c8ad2de4b06c781c7cdaf56973d9a1b76364a2cb6bb80d14a8780bfa6d';
/** Six actual ArticleStory cards. Static title/caret projection, not a general inline renderer. */
function buildNewsRelatedCardRecipes({ root, modes, variables, styles }) {
  const targetVariables = variables,
    targetStyles = styles;
  variables = structuredClone(variables);
  styles = { ...styles, text: structuredClone(styles.text) };
  inspectNewsDetailPrerequisites({ root });
  const read = f => fs.readFileSync(path.join(root, f)),
    hash = f => crypto.createHash('sha256').update(read(f)).digest('hex'),
    fail = m => {
      throw Error('News related-card source changed: ' + m);
    };
  if (hash(RELATED_PROVENANCE) !== RELATED_PROVENANCE_HASH)
    fail('related provenance');
  const provenance = JSON.parse(read(RELATED_PROVENANCE));
  if (hash(PROVENANCE) !== provenance.sourceBaseProvenanceSHA256)
    fail('source base provenance');
  for (const [f, expected] of Object.entries(provenance.files))
    if (hash(f) !== expected) fail(f);
  if (
    modes
      .map(m => m.id)
      .sort()
      .join(',') !== 'delta,irp,mcr,preventionweb,undrr'
  )
    fail('five source modes required');
  const evidence = JSON.parse(
    read(
      'examples/figma-plugin/holistic/assets/news-detail/related-card-footprints.json'
    )
  );
  const names = new Map(variables.map(v => [v.name, v]));
  function value(name, mode, type, seen = new Set()) {
    const v = names.get(name);
    if (!v || v.type !== type || seen.has(name))
      fail('missing/wrong/cyclic ' + name);
    seen.add(name);
    const x = v.values[mode.id];
    if (x == null) fail(name + '/' + mode.id);
    return x.alias ? value(x.alias, mode, type, seen) : x;
  }
  function upsert(list, entry) {
    const hits = list.filter(e => e.id === entry.id || e.name === entry.name);
    if (
      hits.length > 1 ||
      (hits.length && (hits[0].id !== entry.id || hits[0].name !== entry.name))
    )
      fail('foreign identity ' + entry.id);
    if (hits.length) list[list.indexOf(hits[0])] = entry;
    else list.push(entry);
    if (entry.type) names.set(entry.name, entry);
  }
  const ref = { file: 'stories/Components/Cards/Card/card.scss', line: 32 };
  function role(slug, type, get, scopes = ['ALL_SCOPES']) {
    const name = 'component/news-related/' + slug;
    const values = Object.fromEntries(
      modes.map(m => {
        const x = typeof get === 'function' ? get(m) : get;
        const resolved = x?.alias ? value(x.alias, m, type) : x;
        if (type === 'FLOAT' && !Number.isFinite(resolved))
          fail('nonfinite ' + name);
        return [m.id, x];
      })
    );
    upsert(variables, {
      id: name.replaceAll('/', '.'),
      name,
      type,
      scopes,
      sourceRef: ref,
      description:
        'Finite ArticleStory initial related-card source allocation.',
      hiddenFromPublishing: false,
      codeSyntax: {},
      values,
    });
    return name;
  }
  const number = (slug, get, scopes) => role(slug, 'FLOAT', get, scopes),
    alias = (slug, target, type = 'FLOAT', scopes) =>
      role(slug, type, () => ({ alias: target }), scopes);
  // Numeric source foundations are verified in every mode before any staged upsert.
  for (const m of modes) {
    for (const [key, expected] of [
      ['card/padding', 15],
      ['card/border-radius', 5],
      ['spacing/100', 10],
      ['spacing/75', 7.5],
      ['spacing/50', 5],
      ['font-size/500', 23],
      ['font-size/300', 16],
    ])
      if (value(key, m, 'FLOAT') !== expected) fail('source foundation ' + key);
    if (
      value('font-family/ui', m, 'STRING') !== 'Roboto Condensed' ||
      value('font-family/text', m, 'STRING') !== 'Roboto'
    )
      fail('source Latin font roles');
    for (const width of [390, 1164]) {
      const faces = evidence.cards[m.id + '-' + width].fonts;
      if (
        !faces.some(
          f =>
            f.family === 'Roboto Condensed' &&
            f.style === 'normal' &&
            f.weight === '700'
        )
      )
        fail('source loaded Condensed Bold');
    }
  }
  const sizeTitle = alias('title-size', 'font-size/500', 'FLOAT', [
      'FONT_SIZE',
    ]),
    sizeSummary = alias('summary-size', 'font-size/300', 'FLOAT', [
      'FONT_SIZE',
    ]),
    zero = number('zero', 0),
    outlineWidth = number('visual-outline', 1, ['STROKE_FLOAT']),
    visualRadius = number('visual-radius', 2.5, ['CORNER_RADIUS']),
    paragraphBottom = number('summary-bottom', 21),
    outlinePaint = role('visual-outline-paint', 'COLOR', m => ({
      ...value('color/neutral-900', m, 'COLOR'),
      a: 0.1,
    }));
  function cssColor(raw) {
    const parts = raw
      .match(/^rgba?\(([^)]+)\)$/)?.[1]
      .split(',')
      .map(Number);
    if (
      !parts ||
      ![3, 4].includes(parts.length) ||
      parts.some(n => !Number.isFinite(n))
    )
      fail('source color ' + raw);
    return {
      r: parts[0] / 255,
      g: parts[1] / 255,
      b: parts[2] / 255,
      a: parts[3] ?? 1,
    };
  }
  function colorMatches(raw, x) {
    const c = cssColor(raw);
    return (
      ['r', 'g', 'b'].every(
        k => Math.round(x[k] * 255) === Math.round(c[k] * 255)
      ) && (x.a ?? 1) === c.a
    );
  }
  function style(slug, family, size, line, weight) {
    const id = 'component.news-related.' + slug;
    upsert(styles.text, {
      id,
      name: 'Mangrove/source/news-related/' + slug,
      description:
        'Actual loaded Latin source role and declared weight; native font-byte/render equivalence remains open.',
      bindings: { fontFamily: family, fontSize: size },
      values: Object.fromEntries(
        modes.map(m => [
          m.id,
          {
            fontName: { family: value(family, m, 'STRING'), style: weight },
            fontSize: value(size, m, 'FLOAT'),
            lineHeight: { unit: 'PIXELS', value: line },
            letterSpacing: { unit: 'PIXELS', value: 0 },
            textDecoration: 'NONE',
            textWrapStyle: 'AUTO',
          },
        ])
      ),
    });
    return id;
  }
  const titleStyle = style('title', 'font-family/ui', sizeTitle, 28.75, 'Bold'),
    summaryStyle = style(
      'summary',
      'font-family/text',
      sizeSummary,
      24,
      'Regular'
    );
  const effect = styles.effect.find(s => s.id === 'shadow.raised');
  if (!effect) fail('missing source card raised effect');
  const photo = read(
      'examples/figma-plugin/holistic/assets/news-detail/related-source-photo.jpg'
    ),
    image = {
      assetId: 'news-detail-related-source-photo',
      base64: photo.toString('base64'),
      scaleMode: 'FILL',
    },
    variants = [];
  for (const width of [390, 1164])
    for (const index of [0, 1, 2]) {
      const key = width + '-' + (index + 1),
        card = m =>
          evidence.cards[m.id + '-' + width].section.children[1].children[
            index
          ],
        diagnostic = m =>
          evidence.caretDiagnostics[m.id + '-' + width].cards[index],
        sample = card({ id: 'undrr' }),
        title = sample.children[1].children[0],
        link = title.children[0],
        summary = sample.children[1].children[1];
      if (
        link.href !==
        'https://www.undrr.org/news/related-story-' + (index + 1)
      )
        fail('authored destination');
      for (const m of modes) {
        const c = card(m),
          d = diagnostic(m),
          t = c.children[1].children[0],
          a = t.children[0],
          p = c.children[1].children[1];
        if (
          a.text !== link.text ||
          p.text !== summary.text ||
          a.href !== link.href ||
          c.children[0].children[0].src !== provenance.image.url
        )
          fail('authored source content/assets');
        if (
          c.style.paddingTop !== '15px' ||
          c.style.borderRadius !== '5px' ||
          t.style.paddingTop !== '10px' ||
          t.style.paddingBottom !== '7.5px' ||
          p.style.paddingBottom !== '5px' ||
          p.style.marginBottom !== '16px'
        )
          fail('source content spacing');
        if (
          a.style.fontFamily !== '"Roboto Condensed", sans-serif' ||
          a.style.fontSize !== '23px' ||
          a.style.fontWeight !== '700' ||
          a.style.lineHeight !== '28.75px' ||
          a.style.textDecorationLine !== 'underline' ||
          a.style.textUnderlineOffset !== '3px' ||
          t.style.textWrapStyle !== 'balance' ||
          p.style.textWrapStyle !== 'pretty' ||
          p.style.fontFamily !== 'Roboto, sans-serif' ||
          p.style.fontSize !== '16px' ||
          p.style.lineHeight !== '24px'
        )
          fail('source type/link treatment');
        if (
          !colorMatches(
            c.style.backgroundColor,
            value('card/background', m, 'COLOR')
          ) ||
          !colorMatches(
            a.style.color,
            value('color/interactive', m, 'COLOR')
          ) ||
          !colorMatches(p.style.color, value('color/text', m, 'COLOR'))
        )
          fail('source theme paint');
        if (
          JSON.stringify(d.sourceFragments) !==
            JSON.stringify(d.mirrorFragments) ||
          d.after.borderTopWidth !== '3px' ||
          d.after.borderRightWidth !== '3px' ||
          d.after.width !== '8.04688px' ||
          d.after.marginInlineStart !== '5.75px'
        )
          fail('quantized source caret projection');
        const e = effect.values[m.id];
        const shadowColor = d.computed.boxShadow.match(/^rgba?\([^)]*\)/)?.[0];
        if (
          !shadowColor ||
          !d.computed.boxShadow.endsWith(' 0px 0px 0px 1px inset') ||
          e?.length !== 1 ||
          e[0].effect.type !== 'INNER_SHADOW' ||
          e[0].effect.radius !== 0 ||
          e[0].effect.spread !== 1 ||
          e[0].effect.offset.x !== 0 ||
          e[0].effect.offset.y !== 0 ||
          e[0].effect.color.a !== 0.24 ||
          e[0].effect.visible !== true ||
          e[0].effect.blendMode !== 'NORMAL' ||
          e[0].bindings?.color !== 'effect-color/shadow/raised' ||
          !colorMatches(shadowColor, e[0].effect.color) ||
          !colorMatches(
            shadowColor,
            value('effect-color/shadow/raised', m, 'COLOR')
          )
        )
          fail('source raised effect');
      }
      const n = (slug, get) => number(key + '/' + slug, get, ['WIDTH_HEIGHT']),
        cardWidth = n('width', m => card(m).rect.width),
        cardHeight = n('height', m => card(m).rect.height),
        visualWidth = n('visual-width', m => card(m).children[0].rect.width),
        visualHeight = n('visual-height', m => card(m).children[0].rect.height),
        contentHeight = n(
          'content-height',
          m => card(m).children[1].rect.height
        ),
        titleHeight = n(
          'title-height',
          m => card(m).children[1].children[0].rect.height
        ),
        titleTextHeight = n(
          'title-text-height',
          m => card(m).children[1].children[0].rect.height - 17.5
        ),
        summaryHeight = n(
          'summary-height',
          m => card(m).children[1].children[1].rect.height + 16
        ),
        caretWidth = n('caret-width', m => diagnostic(m).mirrorCaret.width),
        caretHeight = n('caret-height', m => diagnostic(m).mirrorCaret.height),
        caretX = number(
          key + '/caret-x',
          m => diagnostic(m).mirrorCaret.x - card(m).rect.x
        ),
        caretY = number(
          key + '/caret-y',
          m => diagnostic(m).mirrorCaret.y - card(m).rect.y
        );
      const side = 8.046875,
        border = 3,
        v = side * Math.SQRT2,
        rotate = ([x, y]) => [
          (x - y + side) / Math.SQRT2,
          (x + y) / Math.SQRT2,
        ],
        polygon = points =>
          `<polygon fill="#000000" points="${points.map(p => rotate(p).join(',')).join(' ')}"/>`,
        markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${v} ${v}">${polygon(
          [
            [0, 0],
            [side, 0],
            [side, border],
            [0, border],
          ]
        )}${polygon([
          [side - border, border],
          [side, border],
          [side, side],
          [side - border, side],
        ])}</svg>`;
      variants.push({
        id: 'news-related-card.' + width + '.story-' + (index + 1),
        name: 'SourceViewport=' + width + ', Story=' + (index + 1),
        properties: {
          SourceViewport: String(width),
          Story: String(index + 1),
          Locale: 'English',
        },
        sourceHref: { title: link.href },
        sourceGeometry: {
          initialCardAllocation:
            'Recorded source border box with source parent stretch.',
          caret:
            'Initial computed-style mirror of authored inline pseudo, exact original/mirrored source anchor fragments. Native vector bounds and baselines remain open.',
        },
        contentContract: {
          Summary:
            'Plain editable short content within finite captured allocation. Arbitrary wrapping, source font ink and overflow remain open.',
          Title:
            'Authored source text remains editable TEXT but has no exposed property. Changed title/caret inline reflow and native title hyperlink are unsupported in this preset.',
        },
        tree: {
          id: 'card',
          type: 'FRAME',
          name: 'Authored related news card',
          fill: 'card/background',
          effectStyle: 'shadow.raised',
          bindings: {
            paddingTop: 'card/padding',
            paddingBottom: 'card/padding',
            paddingLeft: 'card/padding',
            paddingRight: 'card/padding',
            cornerRadius: 'card/border-radius',
          },
          layout: {
            mode: 'VERTICAL',
            width: cardWidth,
            height: cardHeight,
            gap: 'spacing/50',
          },
          children: [
            {
              id: 'visual',
              type: 'FRAME',
              name: 'Exact authored related photograph',
              image,
              stroke: outlinePaint,
              strokeAlign: 'OUTSIDE',
              bindings: {
                strokeWeight: outlineWidth,
                cornerRadius: visualRadius,
              },
              layout: {
                mode: 'NONE',
                width: visualWidth,
                height: visualHeight,
              },
            },
            {
              id: 'content',
              type: 'FRAME',
              name: 'Source stretched content allocation',
              layout: {
                mode: 'VERTICAL',
                width: visualWidth,
                height: contentHeight,
                gap: zero,
              },
              children: [
                {
                  id: 'title-box',
                  type: 'FRAME',
                  name: 'Source linked title treatment',
                  bindings: {
                    paddingTop: 'spacing/100',
                    paddingBottom: 'spacing/75',
                  },
                  layout: {
                    mode: 'VERTICAL',
                    width: visualWidth,
                    height: titleHeight,
                  },
                  children: [
                    {
                      id: 'title',
                      type: 'TEXT',
                      name: 'Authored initial title, edited-caret reflow unsupported',
                      characters: link.text,
                      textStyle: titleStyle,
                      fill: 'color/interactive',
                      textDecoration: 'UNDERLINE',
                      textDecorationOffset: { unit: 'PIXELS', value: 3 },
                      textWrap: 'BALANCE',
                      layout: { width: 'FILL', height: titleTextHeight },
                    },
                  ],
                },
                {
                  id: 'summary-box',
                  type: 'FRAME',
                  name: 'Source summary plus paragraph bottom margin',
                  bindings: { paddingBottom: paragraphBottom },
                  layout: {
                    mode: 'VERTICAL',
                    width: visualWidth,
                    height: summaryHeight,
                  },
                  children: [
                    {
                      id: 'summary',
                      type: 'TEXT',
                      name: 'Editable authored summary',
                      characters: summary.text,
                      textProperty:
                        'Story ' + (index + 1) + ' ' + width + ' Summary',
                      textStyle: summaryStyle,
                      fill: 'color/text',
                      textWrap: 'PRETTY',
                      layout: { width: 'FILL', height: 'HUG' },
                    },
                  ],
                },
              ],
            },
            {
              id: 'initial-caret',
              type: 'FRAME',
              name: 'Finite initial inline caret source projection',
              absolute: {
                horizontal: 'START',
                vertical: 'START',
                offsetX: caretX,
                offsetY: caretY,
              },
              layout: { mode: 'NONE', width: caretWidth, height: caretHeight },
              children: [
                {
                  id: 'caret-ink',
                  type: 'SVG',
                  name: 'Source CSS quantized border chevron',
                  svg: {
                    assetId: 'news-detail-related-source-caret-23',
                    markup,
                    monochrome: { fills: 'color/interactive' },
                  },
                  layout: { width: v, height: v },
                },
              ],
            },
          ],
        },
      });
    }
  targetVariables.splice(0, targetVariables.length, ...variables);
  targetStyles.text.splice(0, targetStyles.text.length, ...styles.text);
  return [
    {
      id: 'news-related-card',
      name: 'Mangrove/Page patterns/ArticleStory exact related cards',
      kind: 'component-set',
      sourceRef: ref,
      review: { genericLabels: false, preserveVariantSizing: true },
      defaultVariantId: 'news-related-card.390.story-1',
      limitations: [
        'Six finite initial English cards use actual three source titles/summaries/destinations and one pinned2160x1440 source photograph. No image redistribution licence grant is established.',
        'Caret geometry is a source computed-style mirror with matching original anchor fragments, using actual3px border quantization. Native raster/vector/baseline parity and edited-title inline caret reflow remain open.',
        'Summary alone is an exposed plain property. Title has exact sourceHref metadata and3px underline offset; native title hyperlink/prototype interaction is unsupported in this source tranche.',
        'Source allocations retain parent stretch and paragraph margins. Arbitrary edited wrapping/overflow, focus/hover, RTL, native all-brand fonts/pixels, consumer/publication and full news assembly remain separate gates.',
      ],
      variants,
    },
  ];
}
module.exports.buildNewsRelatedCardRecipes = buildNewsRelatedCardRecipes;

/** Actual taxonomy and recommendation finite allocations, not full article assembly. */
function buildNewsEditorialRecipes({ root, modes, variables, styles }) {
  const targetVariables = variables,
    targetStyles = styles;
  variables = structuredClone(variables);
  styles = { ...styles, text: structuredClone(styles.text) };
  // Existing dependency factory validates source/provenance/foundations in isolation.
  buildNewsDetailDependencyRecipes({
    root,
    modes,
    variables: structuredClone(variables),
    styles: structuredClone(styles),
  });
  const fail = s => {
    throw Error('News editorial source changed: ' + s);
  };
  const markerFile =
    'examples/figma-plugin/holistic/assets/news-detail/editorial-marker-provenance.json';
  const bytes = fs.readFileSync(path.join(root, markerFile));
  if (
    crypto.createHash('sha256').update(bytes).digest('hex') !==
    '9eb2419a233f917da6daff8bf75566fab604c522a001c0e5104296ff1dd05c14'
  )
    fail('marker provenance');
  const marker = JSON.parse(bytes).candidate;
  const captures = JSON.parse(
    fs.readFileSync(
      path.join(
        root,
        'examples/figma-plugin/holistic/assets/news-detail/dependency-footprints.json'
      )
    )
  ).primaryScenes;
  const { buildTagRecipes } = require('./figma-tag-recipes.cjs');
  const tags = buildTagRecipes({ root, modes, variables, styles });
  if (!tags[0].variants.some(v => v.properties.Tone === 'Default'))
    fail('Tag Default source dependency');
  const byName = new Map(variables.map(v => [v.name, v]));
  const value = (name, m, type, seen = new Set()) => {
    const v = byName.get(name);
    if (!v || v.type !== type || seen.has(name))
      fail('missing/wrong/cyclic ' + name);
    seen.add(name);
    const x = v.values[m.id];
    if (x == null) fail(name + '/' + m.id);
    return x.alias ? value(x.alias, m, type, seen) : x;
  };
  const upsert = (list, e) => {
    const hits = list.filter(v => v.id === e.id || v.name === e.name);
    if (hits.length > 1 || hits.some(v => v.id !== e.id || v.name !== e.name))
      fail('foreign identity ' + e.id);
    if (hits.length) Object.assign(hits[0], e);
    else list.push(e);
  };
  const per = fn => Object.fromEntries(modes.map(m => [m.id, fn(m)]));
  const ref = {
    file: 'stories/Patterns/ArticleStory/ArticleStory.jsx',
    line: 1,
  };
  const number = (slug, fn, scope = ['WIDTH_HEIGHT']) => {
    const name = 'component/news-editorial/' + slug;
    const values = per(m => {
      const x = fn(m);
      if (typeof x !== 'number' || !Number.isFinite(x)) fail('finite ' + slug);
      return x;
    });
    const e = {
      id: name.replaceAll('/', '.'),
      name,
      type: 'FLOAT',
      values,
      scopes: scope,
      sourceRef: ref,
      description:
        'Finite actual ArticleStory source allocation. Native edit reflow/pixels remain open.',
    };
    upsert(variables, e);
    byName.set(name, e);
    return name;
  };
  const rgb = s => {
    const n = s
      .match(/^rgba?\(([^)]+)\)$/)?.[1]
      .split(',')
      .map(Number);
    if (!n || n.length < 3 || n.some(x => !Number.isFinite(x)))
      fail('source color');
    return { r: n[0] / 255, g: n[1] / 255, b: n[2] / 255, a: n[3] ?? 1 };
  };
  const paint = (slug, fn) => {
    const name = 'component/news-editorial/' + slug;
    const e = {
      id: name.replaceAll('/', '.'),
      name,
      type: 'COLOR',
      values: per(m => rgb(fn(m))),
      scopes: ['TEXT_FILL', 'SHAPE_FILL'],
      sourceRef: ref,
    };
    upsert(variables, e);
    byName.set(name, e);
    return name;
  };
  const textStyle = (slug, nodes) => {
    const size = number(
      slug + '/font-size',
      m => parseFloat(nodes[m.id].style.fontSize),
      ['FONT_SIZE']
    );
    const id = 'component.news-editorial.' + slug;
    const e = {
      id,
      name: 'Mangrove/source/news-editorial/' + slug,
      type: 'TEXT',
      recommended: false,
      sourceRef: ref,
      bindings: { fontFamily: 'font-family/text', fontSize: size },
      values: per(m => {
        const s = nodes[m.id].style;
        if (
          s.fontFamily !== 'Roboto, sans-serif' ||
          !['400', '700'].includes(s.fontWeight) ||
          s.fontStyle !== 'normal'
        )
          fail('actual source font ' + slug);
        if (value('font-family/text', m, 'STRING') !== 'Roboto')
          fail('Latin text family');
        for (const f of ['fontSize', 'lineHeight'])
          if (!(parseFloat(s[f]) > 0)) fail('source font metrics');
        return {
          fontName: {
            family: 'Roboto',
            style: s.fontWeight === '700' ? 'Bold' : 'Regular',
          },
          fontSize: parseFloat(s.fontSize),
          lineHeight: { unit: 'PIXELS', value: parseFloat(s.lineHeight) },
          letterSpacing: {
            unit: 'PIXELS',
            value:
              s.letterSpacing === 'normal' ? 0 : parseFloat(s.letterSpacing),
          },
        };
      }),
    };
    upsert(styles.text, e);
    return id;
  };
  const frame = (id, w, h, children, extra = {}) => ({
    id,
    type: 'FRAME',
    fill: null,
    layout: { mode: 'VERTICAL', width: w, height: h, clipsContent: false },
    children,
    ...extra,
  });
  const slot = (id, nodes, bases, children) =>
    frame(
      id,
      number(id + '/width', m => nodes[m.id].rect.width),
      number(id + '/height', m => nodes[m.id].rect.height),
      children,
      {
        absolute: {
          horizontal: 'START',
          vertical: 'START',
          offsetX: number(
            id + '/x',
            m => nodes[m.id].rect.x - bases[m.id].rect.x
          ),
          offsetY: number(
            id + '/y',
            m => nodes[m.id].rect.y - bases[m.id].rect.y
          ),
        },
      }
    );
  const text = (id, nodes, prop, extra = {}) => {
    const first = nodes.undrr;
    if (modes.some(m => nodes[m.id].text !== first.text))
      fail('theme copy ' + id);
    return {
      id,
      type: 'TEXT',
      name: id,
      characters: first.text,
      ...(prop ? { textProperty: prop } : {}),
      textStyle: textStyle(id, nodes),
      fill: paint(id + '/ink', m => nodes[m.id].style.color),
      textWrap: first.style.textWrapStyle === 'balance' ? 'BALANCE' : 'AUTO',
      layout: { width: 'FILL', height: 'FILL' },
      ...extra,
    };
  };
  const families = [];
  for (const kind of ['taxonomy', 'recommendations']) {
    const variants = [];
    for (const w of [390, 1164]) {
      const key = kind + '/' + w;
      const roots = per(m => captures[m.id + '-' + w][kind]);
      const headings = per(m => roots[m.id].children[0]);
      if (
        modes.some(
          m => roots[m.id].tag !== 'SECTION' || headings[m.id].tag !== 'H2'
        )
      )
        fail('source section anatomy');
      const children = [
        slot(key + '/heading', headings, roots, [
          text(key + '/heading-text', headings, 'Heading'),
        ]),
      ];
      if (kind === 'taxonomy') {
        const labels = ['Hazards', 'Themes', 'Country and region'];
        const tagTexts = [
          ['Cyclone, Hurricane and Typhoon', 'Sea level rise'],
          [
            'Climate change',
            'Community-based DRR',
            'Traditional and Indigenous knowledges',
          ],
          ['Fiji'],
        ];
        for (let i = 0; i < 3; i++) {
          const groups = per(m => roots[m.id].children[i + 1]);
          const labelsSource = per(m => groups[m.id].children[0]);
          const tagsSource = per(m => groups[m.id].children[1]);
          if (
            modes.some(
              m =>
                groups[m.id].tag !== 'P' ||
                labelsSource[m.id].tag !== 'STRONG' ||
                labelsSource[m.id].text !== labels[i] ||
                tagsSource[m.id].children.length !== tagTexts[i].length
            )
          )
            fail('taxonomy group');
          // STRONG ink rect is19px but its inherited line box is24px.
          const labelBoxes = per(m => ({
            ...labelsSource[m.id],
            rect: {
              ...labelsSource[m.id].rect,
              x: groups[m.id].rect.x,
              y: groups[m.id].rect.y,
              width: groups[m.id].rect.width,
              height: 24,
            },
          }));
          const own = [
            slot(key + '/group-' + i + '/label', labelBoxes, groups, [
              text(
                key + '/group-' + i + '/label-text',
                labelsSource,
                'Group ' + (i + 1)
              ),
            ]),
          ];
          for (let j = 0; j < tagTexts[i].length; j++) {
            const anchors = per(m => tagsSource[m.id].children[j]);
            for (const m of modes) {
              const a = anchors[m.id],
                s = a.style;
              if (
                a.tag !== 'A' ||
                a.text !== tagTexts[i][j] ||
                a.href !== 'https://www.undrr.org/taxonomy' ||
                s.fontFamily !== '"Roboto Condensed", sans-serif' ||
                s.fontWeight !== '500' ||
                s.fontSize !== '14px' ||
                s.lineHeight !== '21px' ||
                s.paddingTop !== '2.5px' ||
                s.paddingBottom !== '2.5px' ||
                s.paddingLeft !== '10px' ||
                s.paddingRight !== '10px' ||
                a.rect.height !== 28
              )
                fail('actual taxonomy Tag anchor');
              const bg = value('color/tag', m, 'COLOR'),
                fg = value('color/neutral-0', m, 'COLOR');
              const same = (a, b) =>
                ['r', 'g', 'b'].every(
                  k => Math.round(a[k] * 255) === Math.round(b[k] * 255)
                ) && (a.a ?? 1) === (b.a ?? 1);
              if (
                !same(rgb(s.backgroundColor), bg) ||
                !same(rgb(s.color), fg) ||
                parseFloat(s.borderRadius) !==
                  value('radius/tag', m, 'FLOAT') ||
                s.borderTopColor !== 'rgba(0, 0, 0, 0)' ||
                s.borderTopWidth !== '1px' ||
                s.textDecorationLine !== 'none'
              )
                fail('actual taxonomy Tag paint/radius');
            }
            own.push(
              slot(key + '/group-' + i + '/tag-' + j, anchors, groups, [
                {
                  id: key + '/group-' + i + '/tag-' + j + '/instance',
                  type: 'INSTANCE',
                  family: 'tag',
                  variant: { Tone: 'Default' },
                  overrides: { Label: tagTexts[i][j] },
                  expose: true,
                  layout: {
                    width: number(
                      key + '/group-' + i + '/tag-' + j + '/instance-width',
                      m => anchors[m.id].rect.width
                    ),
                    height: 28,
                  },
                },
              ])
            );
          }
          children.push(slot(key + '/group-' + i, groups, roots, own));
        }
      } else {
        const lists = per(m => roots[m.id].children[1]);
        if (
          modes.some(
            m =>
              lists[m.id].tag !== 'UL' ||
              lists[m.id].style.paddingLeft !== '20px' ||
              lists[m.id].children.length !== 3
          )
        )
          fail('recommendation UL');
        const rows = [];
        for (let i = 0; i < 3; i++) {
          const items = per(m => lists[m.id].children[i]),
            links = per(m => items[m.id].children[0]);
          for (const m of modes) {
            const li = items[m.id],
              a = links[m.id];
            if (
              li.tag !== 'LI' ||
              li.style.paddingTop !== '0px' ||
              li.style.paddingBottom !== '0px' ||
              li.style.lineHeight !== '24px' ||
              li.style.listStyleType !== 'disc' ||
              a.tag !== 'A' ||
              !/^https:\/\/www\.undrr\.org\//.test(a.href) ||
              a.style.textDecorationLine !== 'none' ||
              a.style.textUnderlineOffset !== 'auto' ||
              a.href !== links.undrr.href
            )
              fail('recommendation link/list source');
          }
          // Native TEXT represents the authored LI content line box, not the multiline inline anchor union.
          const textNode = text(key + '/link-' + i, links, null, {
            layout: { width: 'FILL', height: 'FILL' },
          });
          const runStyle = textNode.textStyle,
            runFill = textNode.fill;
          delete textNode.textStyle;
          delete textNode.fill;
          textNode.textRuns = [
            {
              id: 'source-link',
              start: 0,
              end: textNode.characters.length,
              textStyle: runStyle,
              fill: runFill,
              textDecoration: 'NONE',
              hyperlink: { type: 'URL', value: links.undrr.href },
            },
          ];
          const row = slot(key + '/item-' + i, items, lists, [
            textNode,
            {
              id: key + '/item-' + i + '/ua-marker',
              type: 'ELLIPSE',
              fill: paint(key + '/marker-ink', m => items[m.id].style.color),
              layout: {
                width: number(key + '/marker-diameter', () => marker.diameter),
                height: number(key + '/marker-diameter', () => marker.diameter),
              },
              absolute: {
                horizontal: 'START',
                vertical: 'START',
                offsetX: number(key + '/marker-x', () => marker.offsetX),
                offsetY: number(key + '/marker-y', () => marker.offsetY),
              },
            },
          ]);
          rows.push(row);
        }
        children.push(slot(key + '/list', lists, roots, rows));
      }
      const tree = frame(
        'root',
        number(key + '/section-width', m => roots[m.id].rect.width),
        number(key + '/section-height', m => roots[m.id].rect.height),
        children
      );
      variants.push({
        id: 'news-' + kind + '.' + w,
        name: 'SourceViewport=' + w + ', Locale=English',
        properties: { SourceViewport: String(w), Locale: 'English' },
        sourceHref:
          kind === 'taxonomy' ? 'https://www.undrr.org/taxonomy' : null,
        sourceGeometry: {
          sourceSection: per(m => roots[m.id].rect),
          finiteInitialFlow: true,
          markerProjection: kind === 'recommendations' ? marker : null,
        },
        tree,
      });
    }
    families.push({
      id: 'news-' + kind,
      name: 'Mangrove/Page patterns/ArticleStory ' + kind,
      kind: 'component-set',
      sourceRef: ref,
      review: { genericLabels: false, preserveVariantSizing: true },
      ...(kind === 'taxonomy' ? { dependencies: ['tag'] } : {}),
      limitations:
        kind === 'taxonomy'
          ? [
              'Actual English Explore further three groups/six native Tag Default instances at390/1164. Editable Heading/group labels and exposed Tag Labels within recorded finite initial allocations.',
              'Source taxonomy HTTPS destinations are metadata; native Tag link/prototype interaction and arbitrary changed-label row/wrapping reflow remain open. Source Tag500 requests guarded Condensed Regular400 candidate; native fonts/pixels/publication separate.',
            ]
          : [
              'Actual English three authored recommendation links preserve HTTPS targets as one editable rich TEXT per LI. Heading is a plain property; text ownership/formatting contract uses rich ledger rather than whole-string properties.',
              'UA-disc ELLIPSE is a freshly measured finite vector candidate, not authored CSS geometry. Ten actual source cases/30 marker crops show11-22 differing candidate pixels per360px crop and up to1px narrow y shift. Native/source marker raster gate remains open.',
              'Fixed source initial section/LI allocations do not claim arbitrary edited wrapping/reflow, responsive runtime, native font pixels or publication.',
            ],
      variants,
    });
  }
  targetVariables.splice(0, targetVariables.length, ...variables);
  targetStyles.text.splice(0, targetStyles.text.length, ...styles.text);
  return families;
}
module.exports.buildNewsEditorialRecipes = buildNewsEditorialRecipes;

/** Actual source image headers, not complete article scenes. */
function buildNewsImageHeaderRecipes({ root, modes, variables, styles }) {
  const targetVariables = variables,
    targetStyles = styles;
  variables = structuredClone(variables);
  styles = { ...styles, text: structuredClone(styles.text) };
  const originalHeader = buildNewsDetailDependencyRecipes({
    root,
    modes,
    variables,
    styles,
  }).find(f => f.id === 'article-header');
  const fail = s => {
    throw Error('News image header source changed: ' + s);
  };
  const read = f => fs.readFileSync(path.join(root, f)),
    hash = f => crypto.createHash('sha256').update(read(f)).digest('hex');
  const provFile =
    'examples/figma-plugin/holistic/assets/news-detail/image-header-provenance.json';
  if (
    hash(provFile) !==
    '13ac7f1474a1c0464536b5938962e18b95cb364c1c1d1f096d45eee061088df6'
  )
    fail('image header provenance');
  const prov = JSON.parse(read(provFile));
  for (const [f, h] of Object.entries({
    ...prov.sourceHashes,
    ...prov.evidenceHashes,
  }))
    if (hash(f) !== h) fail(f);
  const cases = JSON.parse(
    read(
      'examples/figma-plugin/holistic/assets/news-detail/image-header-footprints.json'
    )
  ).cases;
  const existing = JSON.parse(
    read(
      'examples/figma-plugin/holistic/assets/news-detail/dependency-footprints.json'
    )
  ).primaryScenes;
  const byName = new Map(variables.map(v => [v.name, v]));
  const per = fn => Object.fromEntries(modes.map(m => [m.id, fn(m)]));
  const value = (name, m, type, seen = new Set()) => {
    const v = byName.get(name);
    if (!v || v.type !== type || seen.has(name))
      fail('missing/wrong/cyclic ' + name);
    seen.add(name);
    const x = v.values[m.id];
    if (x == null) fail(name + '/' + m.id);
    return x.alias ? value(x.alias, m, type, seen) : x;
  };
  const upsert = (list, e) => {
    const hits = list.filter(v => v.id === e.id || v.name === e.name);
    if (
      hits.length > 1 ||
      hits.some(v => v.id !== e.id || v.name !== e.name || v.type !== e.type)
    )
      fail('foreign identity ' + e.id);
    if (hits.length) Object.assign(hits[0], e);
    else list.push(e);
    return hits[0] || e;
  };
  const ref = {
    file: 'stories/Patterns/ArticleStory/ArticleStory.jsx',
    line: 408,
  };
  const number = (slug, fn, scopes = ['WIDTH_HEIGHT']) => {
    const name = 'component/news-image-header/' + slug;
    const e = {
      id: name.replaceAll('/', '.'),
      name,
      type: 'FLOAT',
      scopes,
      values: per(m => {
        const x = fn(m);
        if (typeof x !== 'number' || !Number.isFinite(x))
          fail('finite ' + slug);
        return x;
      }),
      sourceRef: ref,
    };
    byName.set(name, upsert(variables, e));
    return name;
  };
  const color = s => {
    const n = s
      .match(/^rgba?\(([^)]+)\)$/)?.[1]
      .split(',')
      .map(Number);
    if (!n || n.length < 3 || n.some(x => !Number.isFinite(x)))
      fail('source color');
    return { r: n[0] / 255, g: n[1] / 255, b: n[2] / 255, a: n[3] ?? 1 };
  };
  const sameColor = (a, b) =>
    ['r', 'g', 'b'].every(
      k => Math.round(a[k] * 255) === Math.round(b[k] * 255)
    ) && (a.a ?? 1) === (b.a ?? 1);
  const frame = (id, width, height, children = [], extra = {}) => ({
    id,
    type: 'FRAME',
    fill: null,
    layout: { mode: 'VERTICAL', width, height, clipsContent: false },
    children,
    ...extra,
  });
  const allocation = (slug, ns, origins, children, extra = {}) => {
    for (const m of modes)
      if (
        !(ns[m.id].rect.width > 0 && ns[m.id].rect.height > 0) ||
        ns[m.id].style.opacity !== '1'
      )
        fail('positive allocation/default opacity ' + slug);
    return frame(
      slug,
      number(slug + '/width', m => ns[m.id].rect.width),
      number(slug + '/height', m => ns[m.id].rect.height),
      children,
      {
        absolute: {
          horizontal: 'START',
          vertical: 'START',
          offsetX: number(
            slug + '/x',
            m => ns[m.id].rect.x - origins[m.id].rect.x
          ),
          offsetY: number(
            slug + '/y',
            m => ns[m.id].rect.y - origins[m.id].rect.y
          ),
        },
        ...extra,
      }
    );
  };
  const textStyle = (slug, ns) => {
    const size = number(
      slug + '/font-size',
      m => parseFloat(ns[m.id].style.fontSize),
      ['FONT_SIZE']
    );
    const sourceSizeRole = slug.startsWith('split-hero/')
      ? slug.endsWith('/title')
        ? slug.split('/')[1] === '390'
          ? 'font-size/600'
          : 'font-size/800'
        : slug.endsWith('/summary')
          ? 'font-size/400'
          : 'font-size/250'
      : slug.split('/')[1] === '390'
        ? 'font-size/200'
        : 'font-size/300';
    for (const m of modes)
      if (
        value(sourceSizeRole, m, 'FLOAT') !==
        parseFloat(ns[m.id].style.fontSize)
      )
        fail('source font-size alias ' + sourceSizeRole);
    byName.get(size).values = per(() => ({ alias: sourceSizeRole }));
    const id = 'component.news-image-header.' + slug;
    const family =
      slug.startsWith('split-hero/') && slug.endsWith('/title')
        ? 'display'
        : ns.undrr.style.fontFamily.includes('Roboto Condensed')
          ? 'ui'
          : 'text';
    const e = {
      id,
      name: 'Mangrove/source/news-image-header/' + slug,
      type: 'TEXT',
      recommended: false,
      sourceRef: ref,
      bindings: { fontFamily: 'font-family/' + family, fontSize: size },
      typography: {
        verification:
          'Actual source typography and font requests captured; requested600 maps guarded source Bold700 candidate. Native named face bytes/pixels remain open.',
      },
      values: per(m => {
        const s = ns[m.id].style,
          f = value('font-family/' + family, m, 'STRING');
        if (
          !['Roboto', 'Roboto Condensed'].includes(f) ||
          s.fontFamily !==
            (f === 'Roboto Condensed'
              ? '"Roboto Condensed", sans-serif'
              : 'Roboto, sans-serif') ||
          s.fontStyle !== 'normal' ||
          !['400', '600', '700'].includes(s.fontWeight)
        )
          fail('source Latin face');
        for (const k of ['fontSize', 'lineHeight'])
          if (!(parseFloat(s[k]) > 0)) fail('source metrics');
        return {
          fontName: {
            family: f,
            style: +s.fontWeight >= 600 ? 'Bold' : 'Regular',
          },
          fontSize: parseFloat(s.fontSize),
          lineHeight: { unit: 'PIXELS', value: parseFloat(s.lineHeight) },
          letterSpacing: {
            unit: 'PIXELS',
            value:
              s.letterSpacing === 'normal' ? 0 : parseFloat(s.letterSpacing),
          },
          textDecoration: 'NONE',
        };
      }),
    };
    upsert(styles.text, e);
    return id;
  };
  const sourceInk = (slug, ns, selector) => {
    const name = 'component/news-image-header/' + slug + '/ink';
    const e = {
      id: name.replaceAll('/', '.'),
      name,
      type: 'COLOR',
      scopes: ['TEXT_FILL'],
      sourceRef: ref,
      values: per(m => {
        const role = typeof selector === 'function' ? selector(m) : selector;
        if (!sameColor(value(role, m, 'COLOR'), color(ns[m.id].style.color)))
          fail('source ink alias ' + role);
        return { alias: role };
      }),
    };
    byName.set(name, upsert(variables, e));
    return name;
  };
  const textSlot = (slug, ns, origins, property, inkRole) => {
    if (modes.some(m => ns[m.id].text !== ns.undrr.text)) fail('theme copy');
    const ink = sourceInk(slug, ns, inkRole);
    const children = [
      {
        id: slug + '/text',
        type: 'TEXT',
        name: property,
        characters: ns.undrr.text,
        textProperty: property,
        textStyle: textStyle(slug, ns),
        fill: ink,
        textWrap:
          ns.undrr.style.textWrapStyle === 'balance'
            ? 'BALANCE'
            : ns.undrr.style.textWrapStyle === 'pretty'
              ? 'PRETTY'
              : 'AUTO',
        layout: { width: 'FILL', height: 'FILL' },
      },
    ];
    const slot = allocation(slug, ns, origins, children);
    slot.bindings = {};
    for (const edge of ['Top', 'Bottom', 'Left', 'Right'])
      slot.bindings['padding' + edge] = number(
        slug + '/padding-' + edge.toLowerCase(),
        m => parseFloat(ns[m.id].style['padding' + edge]),
        ['GAP']
      );
    return slot;
  };
  const photos = Object.fromEntries(
    prov.assets.map(a => [
      a.name,
      {
        assetId: 'news-detail-header-' + a.name + '-source-photo',
        base64: read(a.file).toString('base64'),
        scaleMode: 'FILL',
      },
    ])
  );
  const variants = [];
  for (const treatment of [
    'large-image',
    'compact-image',
    'alternate-hero-image',
    'split-hero',
  ])
    for (const w of [390, 1164]) {
      const key = treatment + '/' + w,
        roots = per(m => cases[m.id + '-' + treatment + '-' + w].header),
        origin = per(m => ({ rect: { x: 0, y: roots[m.id].rect.y } })),
        body = [];
      const sample = roots.undrr;
      const sourceImages = per(
        m => cases[m.id + '-' + treatment + '-' + w].images
      );
      const photoName =
        treatment === 'alternate-hero-image' ? 'alternate' : 'main';
      const photo = prov.assets.find(a => a.name === photoName);
      for (const m of modes) {
        if (
          roots[m.id].tag !== 'HEADER' ||
          sourceImages[m.id].length !== 1 ||
          sourceImages[m.id][0].src !== photo.sourceURL ||
          sourceImages[m.id][0].naturalWidth !== photo.nativeSize[0] ||
          sourceImages[m.id][0].naturalHeight !== photo.nativeSize[1]
        )
          fail('actual source image identity/dimensions');
      }
      if (treatment === 'split-hero') {
        const sections = per(m => roots[m.id].children[0]),
          grids = per(m => sections[m.id].children[0]),
          contents = per(m => grids[m.id].children[0]),
          media = per(m => grids[m.id].children[1]),
          img = per(m => media[m.id].children[0]);
        if (
          modes.some(
            m =>
              sections[m.id].classes !==
                'mg-hero mg-hero--split mg-hero--split-2-3' ||
              media[m.id].classes !== 'mg-hero__media' ||
              img[m.id].style.objectFit !== 'cover' ||
              img[m.id].style.objectPosition !== '50% 50%' ||
              !sameColor(
                color(sections[m.id].style.backgroundColor),
                value('color/hero', m, 'COLOR')
              )
          )
        )
          fail('actual split surface/media');
        const nodes = [];
        for (const [i, label, leaf] of [
          [0, 'Label', true],
          [1, 'Title', false],
          [2, 'Summary', false],
          [3, 'Detail', true],
        ]) {
          const ns = per(m =>
            leaf
              ? contents[m.id].children[i].children[0]
              : contents[m.id].children[i]
          );
          nodes.push(
            textSlot(
              key + '/' + label.toLowerCase(),
              ns,
              sections,
              treatment + ' ' + w + ' ' + label,
              label === 'Title'
                ? m =>
                    m.id === 'delta' ? 'color/neutral-0' : 'color/hero-title'
                : 'color/neutral-0'
            )
          );
        }
        nodes.push(
          allocation(key + '/media', media, sections, [], {
            layout: {
              mode: 'NONE',
              width: number(key + '/media-width', m => media[m.id].rect.width),
              height: number(
                key + '/media-height',
                m => media[m.id].rect.height
              ),
              clipsContent: true,
            },
            image: photos.main,
          })
        );
        body.push(
          allocation(key + '/split-surface', sections, origin, nodes, {
            fill: 'color/hero',
          })
        );
      } else {
        const intros = per(m => roots[m.id].children[0]),
          figures = per(m => roots[m.id].children[1]),
          imgs = per(m => figures[m.id].children[0]),
          captions = per(m => figures[m.id].children[1]);
        for (const m of modes) {
          const intro = intros[m.id],
            existingIntro = existing[m.id + '-' + w].intro;
          if (
            intro.classes !== 'mg-demo-intro | mg-container' ||
            intro.children.length !== 4 ||
            intro.rect.width !== existingIntro.rect.width ||
            intro.rect.height !== existingIntro.rect.height
          )
            fail('exact existing intro allocation');
          for (let i = 0; i < 4; i++) {
            const a = intro.children[i],
              b = existingIntro.children[i];
            if (
              a.text !== b.text ||
              a.rect.width !== b.rect.width ||
              a.rect.height !== b.rect.height ||
              a.rect.x - intro.rect.x !== b.rect.x - existingIntro.rect.x ||
              a.rect.y - intro.rect.y !== b.rect.y - existingIntro.rect.y
            )
              fail('exact existing intro content/flow');
            for (const f of [
              'fontFamily',
              'fontSize',
              'fontWeight',
              'lineHeight',
              'letterSpacing',
              'color',
            ])
              if (a.style[f] !== b.style[f])
                fail('exact existing intro typography');
          }
          if (
            imgs[m.id].tag !== 'IMG' ||
            imgs[m.id].style.objectFit !== 'fill' ||
            imgs[m.id].style.objectPosition !== '50% 50%' ||
            captions[m.id].tag !== 'FIGCAPTION' ||
            captions[m.id].children.length !== 2 ||
            captions[m.id].style.borderBottomWidth !== '2px'
          )
            fail('actual figure/caption');
        }
        if (
          !originalHeader.variants.some(
            v =>
              v.properties.Image === 'None' &&
              v.properties.SourceViewport === String(w)
          )
        )
          fail('exact native header dependency');
        body.push(
          allocation(key + '/intro', intros, origin, [
            {
              id: key + '/intro-instance',
              type: 'INSTANCE',
              name: 'Exact source no-image intro',
              family: 'article-header',
              variant: { Image: 'None', SourceViewport: String(w) },
              expose: true,
              layout: {
                width: number(
                  key + '/intro-native-width',
                  m => intros[m.id].rect.width
                ),
                height: number(
                  key + '/intro-native-height',
                  m => intros[m.id].rect.height
                ),
              },
            },
          ])
        );
        for (const m of modes)
          for (const edge of ['paddingTop', 'paddingLeft', 'paddingRight'])
            if (parseFloat(imgs[m.id].style[edge]) !== 0)
              fail('source image content edge');
        const imageContent = per(m => ({
          ...imgs[m.id],
          rect: {
            ...imgs[m.id].rect,
            height:
              imgs[m.id].rect.height -
              parseFloat(imgs[m.id].style.paddingBottom),
          },
        }));
        const imageContentFrame = allocation(
          key + '/photo-content',
          imageContent,
          imgs,
          [],
          {
            layout: {
              mode: 'NONE',
              width: number(
                key + '/photo-content-width',
                m => imageContent[m.id].rect.width
              ),
              height: number(
                key + '/photo-content-height',
                m => imageContent[m.id].rect.height
              ),
              clipsContent: true,
            },
            image: photos[photoName],
          }
        );
        const figureChildren = [
          allocation(key + '/photo-source-border-box', imgs, figures, [
            imageContentFrame,
          ]),
        ];
        const paragraphs = per(m => captions[m.id].children[0]),
          credits = per(m => captions[m.id].children[1]);
        const captionChildren = [
          textSlot(
            key + '/caption',
            paragraphs,
            captions,
            treatment + ' ' + w + ' Caption',
            'color/neutral-600'
          ),
          textSlot(
            key + '/credit',
            credits,
            captions,
            treatment + ' ' + w + ' Credit',
            'color/text'
          ),
        ];
        for (const m of modes) {
          const c = credits[m.id].style;
          if (
            !sameColor(
              value('color/neutral-500', m, 'COLOR'),
              color(
                cases[m.id + '-' + treatment + '-390'].header.children[1]
                  .children[1].children[1].style.borderTopColor
              )
            )
          )
            fail('source credit divider ink');
          if (
            (w === 390 &&
              (c.borderTopWidth !== '1px' || c.borderLeftWidth !== '0px')) ||
            (w === 1164 &&
              (c.borderLeftWidth !== '1px' || c.borderTopWidth !== '0px'))
          )
            fail('source credit divider');
        }
        const dividerBoxes = per(m => ({
          ...credits[m.id],
          rect: {
            ...credits[m.id].rect,
            ...(w === 390 ? { height: 1 } : { width: 1 }),
          },
        }));
        captionChildren.push(
          allocation(key + '/credit-divider', dividerBoxes, captions, [], {
            fill: 'color/neutral-500',
          })
        );
        const bottoms = per(m => ({
          ...captions[m.id],
          rect: {
            x: captions[m.id].rect.x,
            y: captions[m.id].rect.y + captions[m.id].rect.height - 2,
            width: captions[m.id].rect.width,
            height: 2,
          },
        }));
        captionChildren.push(
          allocation(key + '/caption-bottom-border', bottoms, captions, [], {
            fill: 'color/black',
          })
        );
        // Allocate border separately and reserve its source pixel from the editable credit text.
        const creditSlot = captionChildren[1];
        const edge = w === 390 ? 'paddingTop' : 'paddingLeft';
        creditSlot.bindings[edge] = number(
          key + '/credit-border-aware-' + edge,
          m => parseFloat(credits[m.id].style[edge]) + 1,
          ['GAP']
        );
        figureChildren.push(
          allocation(key + '/caption-root', captions, figures, captionChildren)
        );
        body.push(allocation(key + '/figure', figures, origin, figureChildren));
      }
      variants.push({
        id: 'article-image-header.' + treatment + '.' + w,
        name: 'Treatment=' + treatment + ', SourceViewport=' + w,
        properties: {
          Treatment: treatment,
          SourceViewport: String(w),
          Locale: 'English',
        },
        sourceImages: per(m => sourceImages[m.id]),
        sourceGeometry: {
          sourceHeader: per(m => roots[m.id].rect),
          masterWidth:
            'Full source viewport includes actual split full-bleed extent; inner source body/header allocations retain their measured x.',
          splitTitlePaint:
            treatment === 'split-hero'
              ? 'Actual current CSS title is inherited neutral-0 in DELTA because nested rgb(--mg-color-hero-title) is invalid; captured fallback is retained, not corrected to intended blue.'
              : null,
          sourceMetadata:
            treatment === 'split-hero'
              ? 'Actual Hero plain detail sentence; no invented links or credit/caption.'
              : 'Original linked article-header None dependency; exact source figure/caption context below.',
          nativeAccepted: false,
        },
        tree: frame(
          'root',
          w,
          number(key + '/header-height', m => roots[m.id].rect.height),
          body
        ),
      });
    }
  targetVariables.splice(0, targetVariables.length, ...variables);
  targetStyles.text.splice(0, targetStyles.text.length, ...styles.text);
  return [
    {
      id: 'article-image-header',
      name: 'Mangrove/Page patterns/ArticleStory image headers',
      kind: 'component-set',
      sourceRef: ref,
      review: { genericLabels: false, preserveVariantSizing: true },
      dependencyContracts: [390, 1164].map(w => ({
        family: 'article-header',
        variant: { Image: 'None', SourceViewport: String(w) },
        scope:
          'Non-split exact source intro; genuine Tag dependency is transitive.',
      })),
      limitations: [
        'Eight actual authored image-bearing English header presets390/1164, full viewport wrapper with finite inner body/split allocations. Main3388x1810 and alternate889x416 exact source bytes/alt/caption/credit retained; no source photograph redistribution licence grant established.',
        'Non-split genuine article-header None dependency carries exact source linked metadata; split actual Hero detail is plain text. Caption and credit use context source typography/dividers, not standalone editorial substitutions.',
        'Stable treatment/viewport-namespaced own plain properties avoid differing shared defaultcopy names; supported short edits within recorded initial allocations only. Native fonts, image crop/raster, paragraph/credit/divider baselines, arbitrary text/viewport reflow, consumers/publication/full assembly remain open.',
        'Source opacity1 is never copied into node percent-opacity bindings. Source/default native opacity1 retained.',
      ],
      variants,
    },
  ];
}
module.exports.buildNewsImageHeaderRecipes = buildNewsImageHeaderRecipes;
