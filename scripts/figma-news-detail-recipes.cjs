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
    status: 'missing-source-specific-composition',
    contract:
      'Tag Update, actual title/summary/date and two linked source names. Five actual image treatments including source Hero split; source image/caption bytes and overrides must be pinned.',
  },
  {
    id: 'share-buttons',
    status: 'missing-family',
    contract:
      'Source native-share capability branch plus LinkedIn/Facebook/X/email/QR actions and own copy button. Actual6-action bar wraps at256 rail; QR/copy/clipboard runtime are separate.',
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
    status: 'missing-source-specific-data-and-assets',
    contract:
      'Three actual VerticalCards with source title/summary, shared exact relatedImage URL and authored related-story destinations, stacked390/grid368px each at1164.',
  },
  {
    id: 'article-recommendations',
    status: 'missing-list-composition',
    contract:
      'Three authored editors recommendation links as actual UL/LI, no numbered or generic list substitute. Multiline marker baseline must be measured.',
  },
  {
    id: 'article-taxonomy',
    status: 'missing-wrapping-composition',
    contract:
      'Actual Hazards/Themes/Country labels and6 native Tag-compatible links. Narrow Themes group wraps into61px container; requires faithful finite row composition and editable-content bounds.',
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
