'use strict';
const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');
/** Actual finite ArticleStory contextual highlight. Source only, no CSS float flow claim. */
function buildNewsFloatHighlightRecipes({ root, modes, variables, styles }) {
  const targetVariables = variables,
    targetStyles = styles;
  variables = structuredClone(variables);
  styles = structuredClone(styles);
  const fail = s => {
    throw Error('News contextual highlight source changed: ' + s);
  };
  const base = path.join(
    root,
    'examples/figma-plugin/holistic/assets/news-float'
  );
  const sha = b => crypto.createHash('sha256').update(b).digest('hex');
  const provenanceBytes = fs.readFileSync(path.join(base, 'provenance.json'));
  if (
    sha(provenanceBytes) !==
    '60915b4410d5f55d2c149c34da8324e917baede9dee4fa3a5ae720a8f7bbc5e0'
  )
    fail('provenance');
  const prov = JSON.parse(provenanceBytes);
  for (const [f, h] of Object.entries({
    ...prov.sourceHashes,
    ...prov.evidenceHashes,
  }))
    if (sha(fs.readFileSync(path.join(root, f))) !== h) fail(f);
  const raw = fs.readFileSync(path.join(base, 'source-footprints.json'));
  if (sha(raw) !== prov.sourceFootprintsSha256) fail('float footprint');
  if (
    modes
      .map(m => m.id)
      .sort()
      .join(',') !== 'delta,irp,mcr,preventionweb,undrr'
  )
    fail('five modes');
  require(
    path.join(root, 'scripts/figma-highlight-box-recipes.cjs')
  ).buildHighlightBoxRecipes({ root, modes, variables, styles });
  // Reject foreign identities even where the source primitive producer replaces an entry.
  for (const entry of variables.filter(v =>
    v.name.startsWith('component/highlight-box/')
  )) {
    const old = targetVariables.filter(
      v => v.id === entry.id || v.name === entry.name
    );
    if (
      old.length > 1 ||
      old.some(
        v => v.id !== entry.id || v.name !== entry.name || v.type !== entry.type
      )
    )
      fail('foreign shared identity ' + entry.id);
  }
  for (const kind of ['text', 'effect']) {
    for (const entry of styles[kind].filter(v =>
      v.id.startsWith('component.highlight-box.')
    )) {
      const old = targetStyles[kind].filter(
        v => v.id === entry.id || v.name === entry.name
      );
      const other = targetStyles[kind === 'text' ? 'effect' : 'text'];
      if (
        old.length > 1 ||
        old.some(
          v =>
            v.id !== entry.id ||
            v.name !== entry.name ||
            modes.some(
              m =>
                Array.isArray(v.values?.[m.id]) !==
                Array.isArray(entry.values[m.id])
            )
        ) ||
        other.some(v => v.id === entry.id || v.name === entry.name)
      )
        fail('foreign shared style ' + entry.id);
    }
  }
  const cases = JSON.parse(raw).cases,
    per = fn => Object.fromEntries(modes.map(m => [m.id, fn(m)]));
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
    if (
      hits.length > 1 ||
      hits.some(v => v.id !== e.id || v.name !== e.name || v.type !== e.type)
    )
      fail('foreign identity ' + e.id);
    if (
      list === styles.text &&
      (styles.effect.some(v => v.id === e.id || v.name === e.name) ||
        hits.some(v =>
          modes.some(m => !v.values?.[m.id] || Array.isArray(v.values[m.id]))
        ))
    )
      fail('foreign style kind ' + e.id);
    if (hits.length) Object.assign(hits[0], e);
    else list.push(e);
    return hits[0] || e;
  };
  const ref = {
    file: 'stories/Patterns/ArticleStory/ArticleStory.jsx',
    line: 523,
  };
  const number = (key, fn, scopes = ['WIDTH_HEIGHT']) => {
    const name = 'component/news-contextual-highlight/' + key,
      e = {
        id: name.replaceAll('/', '.'),
        name,
        type: 'FLOAT',
        values: per(m => {
          const n = fn(m);
          if (typeof n !== 'number' || !Number.isFinite(n))
            fail('finite ' + key);
          return n;
        }),
        scopes,
        sourceRef: ref,
      };
    byName.set(name, upsert(variables, e));
    return name;
  };
  const sameColor = (a, b) =>
    ['r', 'g', 'b', 'a'].every(k => Math.abs(a[k] - b[k]) < 1e-9);
  const sourceText =
    '45 participants from Indigenous communities across 11 countries.';
  const style = weight => {
    const id =
      'component.news-contextual-highlight.' +
      (weight === 700 ? 'strong' : 'body');
    upsert(styles.text, {
      id,
      name:
        'Mangrove/component/news-contextual-highlight/' +
        (weight === 700 ? 'strong' : 'body'),
      component: true,
      sourceRef: ref,
      bindings: { fontFamily: 'font-family/text', fontSize: 'font-size/300' },
      description:
        'Actual ArticleStory paragraph Roboto16/24, exact bundled Regular400 or Bold700; native source pixels and edited float reflow unaccepted.',
      values: per(m => {
        if (
          value('font-family/text', m, 'STRING') !== 'Roboto' ||
          value('font-size/300', m, 'FLOAT') !== 16
        )
          fail('body typography');
        return {
          fontName: {
            family: 'Roboto',
            style: weight === 700 ? 'Bold' : 'Regular',
          },
          fontSize: 16,
          lineHeight: { unit: 'PIXELS', value: 24 },
        };
      }),
    });
    return id;
  };
  const regular = style(400),
    bold = style(700);
  const widths = [390, 1164].map(w => {
    const all = per(m => {
      const hits = cases.filter(c => c.mode === m.id && c.width === w);
      if (hits.length !== 1) fail('ambiguous source case');
      return hits[0];
    });
    for (const m of modes) {
      const c = all[m.id],
        b = c.box,
        p = b.children[0],
        s = b.style;
      if (
        b.children.length !== 1 ||
        p.tag !== 'P' ||
        p.text !== sourceText ||
        p.html !==
          '<strong>45</strong> participants from Indigenous communities across <strong>11</strong> countries.' ||
        p.children.map(c => c.text).join(',') !== '45,11'
      )
        fail('paragraph anatomy');
      if (
        s.backgroundColor !== 'rgb(150, 41, 135)' ||
        s.boxShadow !== 'rgba(255, 255, 255, 0.5) 0px -8px 0px 0px inset' ||
        s.opacity !== '1' ||
        ['Top', 'Right', 'Bottom', 'Left'].some(
          e => s['border' + e + 'Width'] !== '0px'
        ) ||
        s.paddingTop !== '10px' ||
        s.paddingBottom !== '20px' ||
        s.paddingLeft !== '15px' ||
        s.paddingRight !== '15px'
      )
        fail('box paint/padding');
      if (
        p.style.fontFamily !== 'Roboto, sans-serif' ||
        p.style.fontWeight !== '400' ||
        p.style.fontSize !== '16px' ||
        p.style.lineHeight !== '24px' ||
        p.style.marginBottom !== '16px' ||
        p.style.color !== 'rgb(255, 255, 255)' ||
        p.style.opacity !== '1' ||
        p.children.some(
          x =>
            x.style.fontWeight !== '700' ||
            x.style.fontSize !== '16px' ||
            x.style.lineHeight !== '24px'
        )
      )
        fail('paragraph typography');
      if (
        w === 1164
          ? s.float !== 'inline-end' ||
            s.marginLeft !== '20px' ||
            b.rect.width !== 216.59375 ||
            b.rect.height !== 118 ||
            p.rect.height !== 72
          : s.float !== 'none' ||
            s.marginLeft !== '0px' ||
            b.rect.width !== (m.id === 'undrr' ? 330 : 350) ||
            b.rect.height !== 94 ||
            p.rect.height !== 48
      )
        fail('source allocation');
      if (
        !sameColor(
          value('component/highlight-box/secondary-background', m, 'COLOR'),
          { r: 150 / 255, g: 41 / 255, b: 135 / 255, a: 1 }
        ) ||
        !sameColor(value('color/white', m, 'COLOR'), { r: 1, g: 1, b: 1, a: 1 })
      )
        fail('shared source paint');
    }
    const width = number(w + '/width', m => all[m.id].box.rect.width),
      height = number(w + '/height', m => all[m.id].box.rect.height),
      ph = number(
        w + '/paragraph-height',
        m => all[m.id].box.children[0].rect.height
      ),
      margin = number('paragraph-end-margin', () => 16, ['GAP']);
    const cuts = [0, 2, 51, 53, sourceText.length];
    if (sourceText.slice(51, 53) !== '11') fail('authored bold offsets');
    return {
      id: 'news-contextual-highlight.' + w,
      name: 'SourceViewport=' + w + ', Locale=English',
      properties: { SourceViewport: String(w), Locale: 'English' },
      sourceGeometry: {
        box: per(m => all[m.id].box.rect),
        paragraph: per(m => all[m.id].box.children[0].rect),
        float: per(m => all[m.id].box.style.float),
        followingParagraphExcluded: true,
      },
      tree: {
        id: 'root',
        type: 'FRAME',
        name: 'Actual ArticleStory secondary contextual highlight',
        fill: 'component/highlight-box/secondary-background',
        effectStyle: 'component.highlight-box.coloured-shadow',
        layout: { mode: 'VERTICAL', width, height, gap: 0 },
        bindings: {
          paddingTop: 'component/highlight-box/padding-top',
          paddingBottom: 'component/highlight-box/padding-bottom',
          paddingLeft: 'component/highlight-box/padding-inline',
          paddingRight: 'component/highlight-box/padding-inline',
        },
        children: [
          {
            id: 'paragraph-slot',
            type: 'FRAME',
            layout: { mode: 'VERTICAL', width: 'FILL', height: ph, gap: 0 },
            children: [
              {
                id: 'body',
                type: 'TEXT',
                characters: sourceText,
                textWrap: 'AUTO',
                layout: { width: 'FILL', height: 'FILL' },
                textRuns: cuts.slice(0, -1).map((start, i) => ({
                  id: [
                    'source-45',
                    'source-between',
                    'source-11',
                    'source-end',
                  ][i],
                  start,
                  end: cuts[i + 1],
                  textStyle: i === 0 || i === 2 ? bold : regular,
                  fill: 'color/white',
                  textDecoration: 'NONE',
                })),
              },
            ],
          },
          {
            id: 'paragraph-margin',
            type: 'FRAME',
            layout: { mode: 'NONE', width: 'FILL', height: margin },
            children: [],
          },
        ],
      },
    };
  });
  const family = {
    id: 'news-contextual-highlight',
    name: 'Mangrove/Page patterns/ArticleStory contextual highlight',
    kind: 'component-set',
    sourceRef: ref,
    review: { genericLabels: false, preserveVariantSizing: true },
    limitations: [
      'Exact finite contextual component only, following paragraph exclusion flow and arbitrary edited reflow remain unsupported.',
      'One editable rich TEXT preserves source Strong45/11, no whole-string property formatting reset. Source and native glyph/shadow pixel acceptance remain open.',
    ],
    variants: widths,
  };
  targetVariables.splice(0, targetVariables.length, ...variables);
  targetStyles.text.splice(0, targetStyles.text.length, ...styles.text);
  targetStyles.effect.splice(0, targetStyles.effect.length, ...styles.effect);
  return [family];
}
module.exports = { buildNewsFloatHighlightRecipes };
