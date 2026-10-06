'use strict';
const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');
/** Finite source paragraph lines adjacent to the actual ArticleStory float. */
function buildNewsExclusionParagraphRecipes({
  root,
  modes,
  variables,
  styles,
}) {
  const targetVariables = variables,
    targetStyles = styles;
  variables = structuredClone(variables);
  styles = structuredClone(styles);
  const fail = s => {
    throw Error('News source exclusion paragraph changed: ' + s);
  };
  if (
    crypto
      .createHash('sha256')
      .update(
        fs.readFileSync(
          path.join(root, 'scripts/figma-page-pattern-recipes.cjs')
        )
      )
      .digest('hex') !==
    '284c393809fa5616edbf0af332a535f30bc4e33d38136f6d782ae3ab75d4bdff'
  )
    fail('prose source dependency');
  require('./figma-news-article-recipes.cjs').buildNewsArticleMediaRecipes({
    root,
    modes,
  });
  const families =
    require('./figma-page-pattern-recipes.cjs').buildPagePatternRecipes({
      root,
      modes,
      variables,
      styles,
    });
  for (const e of variables) {
    const hits = targetVariables.filter(
      x => x.id === e.id || x.name === e.name
    );
    if (
      hits.length > 1 ||
      hits.some(x => x.id !== e.id || x.name !== e.name || x.type !== e.type)
    )
      fail('foreign variable ' + e.id);
  }
  for (const kind of ['text', 'effect'])
    for (const e of styles[kind]) {
      const hits = targetStyles[kind].filter(
        x => x.id === e.id || x.name === e.name
      );
      if (
        hits.length > 1 ||
        hits.some(
          x =>
            x.id !== e.id ||
            x.name !== e.name ||
            modes.some(
              m =>
                !x.values?.[m.id] ||
                Array.isArray(x.values[m.id]) !== Array.isArray(e.values[m.id])
            )
        ) ||
        targetStyles[kind === 'text' ? 'effect' : 'text'].some(
          x => x.id === e.id || x.name === e.name
        )
      )
        fail('foreign style ' + e.id);
    }
  const cases = JSON.parse(
    fs.readFileSync(
      path.join(
        root,
        'examples/figma-plugin/holistic/assets/news-article/source-footprints.json'
      )
    )
  ).cases;
  const per = fn => Object.fromEntries(modes.map(m => [m.id, fn(m)]));
  const number = (slug, fn) => {
    const name = 'component/news-source-exclusion/' + slug,
      e = {
        id: name.replaceAll('/', '.'),
        name,
        type: 'FLOAT',
        values: per(m => {
          const n = fn(m);
          if (!Number.isFinite(n) || n < 0) fail('finite source geometry');
          return n;
        }),
        scopes: ['WIDTH_HEIGHT'],
      };
    const hits = variables.filter(x => x.id === e.id || x.name === e.name);
    if (
      hits.length > 1 ||
      hits.some(x => x.id !== e.id || x.name !== e.name || x.type !== e.type)
    )
      fail('foreign source role');
    if (hits.length) Object.assign(hits[0], e);
    else variables.push(e);
    return name;
  };
  const variants = [390, 1164].map(viewport => {
    const source = per(m => {
      const hits = cases.filter(c => c.sourceKey === m.id + '-' + viewport);
      if (hits.length !== 1) fail('source case');
      return hits[0].exclusionParagraph;
    });
    const text = source.undrr.text;
    if (text.length !== 294 || modes.some(m => source[m.id].text !== text))
      fail('exact source paragraph');
    const templates = [];
    function visit(n) {
      if (n.type === 'TEXT' && n.characters === text) templates.push(n);
      for (const c of n.children || []) visit(c);
    }
    const column = families.find(f => f.id === 'news-detail-article-column');
    if (!column) fail('source prose dependency');
    visit(
      column.variants.find(
        v => v.properties.SourceViewport === String(viewport)
      ).tree
    );
    if (templates.length !== 1 || !templates[0].textRuns)
      fail('actual rich source paragraph');
    const template = templates[0],
      width = number('width-' + viewport, m => source[m.id].rect.width),
      height = number('height-' + viewport, m => source[m.id].rect.height);
    let children;
    if (viewport === 390) {
      children = [
        {
          ...structuredClone(template),
          id: 'paragraph',
          layout: { width: 'FILL', height: 'FILL' },
        },
      ];
    } else {
      const cuts = [0, 68, 135, 205, 294];
      for (const m of modes) {
        const lines = source[m.id].lines;
        if (
          lines.length !== 4 ||
          lines.some(
            (l, i) =>
              l.start !== cuts[i] ||
              l.end !== cuts[i + 1] ||
              l.text !== text.slice(cuts[i], cuts[i + 1]) ||
              l.availableWidth !== (i < 3 ? 485.40625 : 722) ||
              l.lineBox.height !== 24
          )
        )
          fail('actual finite float line profile');
      }
      children = cuts.slice(0, -1).map((start, i) => {
        const end = cuts[i + 1],
          runs = template.textRuns
            .filter(r => r.start < end && r.end > start)
            .map(r => ({
              ...r,
              start: Math.max(r.start, start) - start,
              end: Math.min(r.end, end) - start,
            }));
        return {
          id: 'line' + i,
          type: 'FRAME',
          fill: null,
          layout: {
            mode: 'VERTICAL',
            width: source.undrr.lines[i].availableWidth,
            height: 24,
            gap: 0,
            clipsContent: false,
          },
          children: [
            {
              id: 'line-text' + i,
              type: 'TEXT',
              characters: text.slice(start, end),
              textRuns: runs,
              textWrap: 'AUTO',
              layout: { width: 'HUG', height: 'HUG' },
              sourceLine: {
                paragraphId: 'article-story/what-happens-next/paragraph0',
                paragraphCharacters: text,
                start,
                end,
                lineIndex: i,
                lineCount: 4,
              },
            },
          ],
        };
      });
    }
    return {
      id: 'news-source-exclusion.' + viewport,
      name: 'SourceViewport=' + viewport,
      properties: { SourceViewport: String(viewport) },
      sourceFlow: {
        context: 'actual ArticleStory NoHeroImage',
        frozenSourceCopy: viewport === 1164,
        sourceParagraphCharacters: text,
        sourceLineOffsets: viewport === 1164 ? [0, 68, 135, 205, 294] : null,
        reflowAcceptance: false,
      },
      tree: {
        id: 'root',
        type: 'FRAME',
        fill: null,
        layout: {
          mode: 'VERTICAL',
          width,
          height,
          gap: 0,
          clipsContent: false,
        },
        children,
      },
    };
  });
  targetVariables.splice(0, targetVariables.length, ...variables);
  for (const kind of ['text', 'effect'])
    targetStyles[kind].splice(0, targetStyles[kind].length, ...styles[kind]);
  return [
    {
      id: 'news-source-exclusion',
      name: 'Mangrove/Source Article/Float exclusion paragraph',
      kind: 'component-set',
      review: { genericLabels: false, preserveVariantSizing: true },
      sourceRef: {
        file: 'stories/Patterns/ArticleStory/ArticleStory.jsx',
        line: 532,
      },
      description:
        'Actual294-character linked paragraph. Desktop firstthree source lines have485.40625 allocation then722; narrow source has no float and retains ordinary rich paragraph.',
      limitations: [
        'Desktop line TEXT source copy is frozen. Owned current-page main/linked consumer edits require reflow and refuse before permanent builder phases. Other pages/published consumers are outside loaded guard scope.',
        'HUG/HUG source line glyphs are not an edited-wrap engine or source font/pixel proof. Fonts/baselines/trailing-space ink/source raster remain open.',
      ],
      variants,
    },
  ];
}
module.exports = { buildNewsExclusionParagraphRecipes };
