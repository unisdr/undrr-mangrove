/** Experimental HighlightBox plain-content presets. No native acceptance. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function buildHighlightBoxRecipes({ root, modes, variables, styles }) {
  const scss = 'stories/Components/HighlightBox/highlight-box.scss';
  const jsx = 'stories/Components/HighlightBox/HighlightBox.jsx';
  const story = 'stories/Components/HighlightBox/HighlightBox.stories.jsx';
  const foundation = 'stories/assets/scss/_foundational.scss';
  const read = file => fs.readFileSync(path.join(root, file), 'utf8');
  const fail = message => {
    throw new Error(`Figma HighlightBox recipe needs updating: ${message}`);
  };
  if (
    modes
      .map(m => m.id)
      .sort()
      .join(',') !== 'delta,irp,mcr,preventionweb,undrr'
  )
    fail('Expected five distinct brand modes');
  const clean = text =>
    text
      .replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  for (const [file, expected] of [
    [scss, '28a43706393f43ae094bcd3ac524688fe1d9fc68fcad1691ee2674914aecdc12'],
    [jsx, '676801f4ddecd34de90081b3191866d0e5ff49e10be2b9a21e8c0da83694bae6'],
    [story, '48ec945d48e6de406390372a24a7f2eea1a93e7d47a4d923b66c1237e9ddf26c'],
    [
      foundation,
      '4e307714a1414aa88cc1f4ee49d9e7898a29c84f886c0fb8ef5b96db952278a8',
    ],
  ])
    if (
      crypto
        .createHash('sha256')
        .update(clean(read(file)))
        .digest('hex') !== expected
    )
      fail(
        `${file} anatomy, typography or treatment changed; review the bounded projection`
      );
  const source = (file, pattern) => {
    const text = read(file),
      match = pattern.exec(text);
    if (!match) fail(`Missing source contract ${file}: ${pattern}`);
    return { file, line: text.slice(0, match.index).split('\n').length };
  };
  const ref = source(scss, /\.mg-highlight-box\s*\{/);
  const fontInventory = clean(read('stories/assets/fonts/roboto/roboto.scss'));
  for (const [face, weight] of [
    ['Regular', 400],
    ['Bold', 700],
  ]) {
    if (!fontInventory.includes(`@import "sass/${face}";`))
      fail(`Missing bundled Roboto ${face}`);
    source(
      `stories/assets/fonts/roboto/sass/_${face}.scss`,
      new RegExp(
        `font-family: Roboto;[\\s\\S]*?font-weight: ${weight};\\s*font-style: normal;`
      )
    );
  }
  for (const match of fontInventory.matchAll(/@import "(sass\/[^"\n]+)";/g)) {
    if (
      /font-weight:\s*600\s*;/.test(
        clean(
          read(
            `stories/assets/fonts/roboto/${match[1].replace('sass/', 'sass/_')}.scss`
          )
        )
      )
    )
      fail('Bundled Roboto600 face added; revisit provisional font matching');
  }
  source('stories/assets/scss/_variables.scss', /\$mg-html-font-size:\s*16;/);
  const purple = /--sendai-purple-900:\s*#([a-f\d]{6});/.exec(
    read('stories/assets/scss/_variables.scss')
  );
  if (!purple) fail('Missing Sendai purple fallback');
  source(
    'stories/assets/scss/_variables.scss',
    /--sendai-purple:\s*var\(--sendai-purple-900\);/
  );
  const purpleColour = {
    r: parseInt(purple[1].slice(0, 2), 16) / 255,
    g: parseInt(purple[1].slice(2, 4), 16) / 255,
    b: parseInt(purple[1].slice(4, 6), 16) / 255,
    a: 1,
  };
  const byName = new Map(variables.map(v => [v.name, v]));
  function value(name, mode, seen = new Set()) {
    if (seen.has(name)) fail(`Circular alias ${name}`);
    seen.add(name);
    const entry = byName.get(name)?.values[mode.id];
    if (entry == null) fail(`Missing ${name}/${mode.id}`);
    return entry.alias ? value(entry.alias, mode, seen) : entry;
  }
  const perMode = fn => Object.fromEntries(modes.map(m => [m.id, fn(m)]));
  function upsert(array, entry, key) {
    const matches = array.filter(
      v => v[key] === entry[key] || v.id === entry.id || v.name === entry.name
    );
    if (
      matches.length > 1 ||
      (matches.length &&
        (matches[0].id !== entry.id || matches[0].name !== entry.name))
    )
      fail(`Foreign or duplicate identity ${entry.name}`);
    const index = array.findIndex(v => v[key] === entry[key]);
    if (index < 0) array.push(entry);
    else array[index] = entry;
  }
  function helper(name, type, scopes, fn, description) {
    const fullName = `component/highlight-box/${name}`;
    const definition = {
      id: fullName.replaceAll('/', '.'),
      name: fullName,
      type,
      scopes,
      description,
      source: ref,
      hiddenFromPublishing: false,
      codeSyntax: {},
      values: perMode(typeof fn === 'function' ? fn : () => fn),
    };
    upsert(variables, definition, 'name');
    byName.set(fullName, definition);
    return fullName;
  }
  const number = (name, scopes, fn, description) =>
    helper(name, 'FLOAT', scopes, fn, description);
  const paint = (name, fn, description) =>
    helper(
      name,
      'COLOR',
      ['FRAME_FILL', 'STROKE_COLOR', 'TEXT_FILL', 'EFFECT_COLOR'],
      fn,
      description
    );
  const top = number(
    'padding-top',
    ['GAP'],
    10,
    'Source mg-rem(10), at guarded16px Sass root.'
  );
  const inline = number(
    'padding-inline',
    ['GAP'],
    15,
    'Source mg-rem(15), at guarded16px Sass root.'
  );
  const bottom = number(
    'padding-bottom',
    ['GAP'],
    20,
    'Physical source bottom overrides block10px in horizontal writing.'
  );
  const border = number(
    'border-width',
    ['STROKE_FLOAT'],
    1,
    'Source Default1px border; coloured variants remove it.'
  );
  const zero = number(
    'zero',
    ['STROKE_FLOAT', 'GAP', 'EFFECT_FLOAT'],
    0,
    'Source zero blur/spread and coloured variant border:none.'
  );
  const inset = number(
    'inset-y',
    ['EFFECT_FLOAT'],
    -8,
    'Source inset shadow offset0 -8px, not a spread.'
  );
  const width = number(
    'specimen-width-480',
    ['WIDTH_HEIGHT'],
    480,
    'Candidate480px container width, not authored fixed component width.'
  );
  const pMargin = number(
    'paragraph-end-margin',
    ['GAP'],
    m => value('font-size/300', m),
    'Candidate browser UA paragraph margin-bottom1em. Not authored by HighlightBox; actual source browser measurement pending.'
  );
  const dark = paint(
    'default-border-shadow',
    { r: 0, g: 0, b: 0, a: 0.3 },
    'Source literal black at alpha0.3 for default border and inset shadow.'
  );
  const light = paint(
    'coloured-shadow',
    { r: 1, g: 1, b: 1, a: 0.5 },
    'Source literal white at alpha0.5 for coloured inset shadow.'
  );
  const secondary = paint(
    'secondary-background',
    purpleColour,
    'Source legacy --tag-color-background-purple fallback --sendai-purple. Host custom-property overrides excluded.'
  );
  function shadow(id, colour) {
    const definition = {
      id,
      name: `Mangrove/component/highlight-box/${id.split('.').pop()}`,
      component: true,
      source: ref,
      description:
        'Source inset0 -8px0 0 shadow. Native inward-band parity unverified.',
      values: perMode(m => [
        {
          effect: {
            type: 'INNER_SHADOW',
            color: value(colour, m),
            offset: { x: 0, y: -8 },
            radius: 0,
            spread: 0,
            visible: true,
            blendMode: 'NORMAL',
          },
          bindings: {
            color: colour,
            offsetX: zero,
            offsetY: inset,
            radius: zero,
            spread: zero,
          },
        },
      ]),
    };
    upsert(styles.effect, definition, 'id');
    return id;
  }
  const shadows = {
    Default: shadow('component.highlight-box.default-shadow', dark),
    Coloured: shadow('component.highlight-box.coloured-shadow', light),
  };
  const titleId = 'component.highlight-box.title';
  const titleStyle = {
    id: titleId,
    name: 'Mangrove/component/highlight-box/title',
    component: true,
    recommended: false,
    source: source(foundation, /h3\s*\{/),
    description:
      'Plain source h3 inherits Latin text font. CSS600 to bundled Bold700 is provisional, actual browser font match unmeasured.',
    typography: {
      requestedWeight: 600,
      bundledWeight: 700,
      lineHeightRatio: 1.15,
      lineHeightBasis: 'own-font-size',
      verification:
        'Provisional weight matching inference. Source browser and native rendering pending.',
    },
    bindings: { fontFamily: 'font-family/text', fontSize: 'font-size/400' },
    values: perMode(m => ({
      fontName: { family: value('font-family/text', m), style: 'Bold' },
      fontSize: value('font-size/400', m),
      lineHeight: { unit: 'PERCENT', value: 115 },
      textWrapStyle: 'BALANCE',
    })),
  };
  upsert(styles.text, titleStyle, 'id');
  const sharedBody = styles.text.find(s => s.id === 'component.body');
  if (
    sharedBody?.bindings.fontFamily !== 'font-family/text' ||
    sharedBody.bindings.fontSize !== 'font-size/300'
  )
    fail('Shared inherited body style changed');
  const text = (id, name, characters, textStyle, fill, textProperty) => ({
    type: 'TEXT',
    id,
    name,
    characters,
    textStyle,
    fill,
    textProperty,
    textWrap: id === 'title' ? 'BALANCE' : 'AUTO',
    layout: { width: 'FILL', height: 'HUG' },
  });
  const variants = ['Default', 'Primary', 'Secondary'].map(Tone => {
    const coloured = Tone !== 'Default',
      fill = coloured ? 'color/white' : 'color/text';
    return {
      id: `highlight-box.${Tone.toLowerCase()}`,
      name: `Tone=${Tone}`,
      properties: { Tone },
      sourceRef: ref,
      tree: {
        type: 'FRAME',
        id: 'root',
        name: `mg-highlight-box${coloured ? ` mg-highlight-box--${Tone.toLowerCase()}` : ''}`,
        fill:
          Tone === 'Primary'
            ? 'color/blue-900'
            : Tone === 'Secondary'
              ? secondary
              : null,
        stroke: coloured ? null : dark,
        effectStyle: coloured ? shadows.Coloured : shadows.Default,
        strokesIncludedInLayout: true,
        bindings: {
          strokeWeight: coloured ? zero : border,
          paddingTop: top,
          paddingBottom: bottom,
          paddingLeft: inline,
          paddingRight: inline,
        },
        layout: {
          mode: 'VERTICAL',
          width,
          height: 'HUG',
          gap: 'spacing/0',
          clipsContent: false,
        },
        children: [
          {
            type: 'FRAME',
            id: 'title-margin',
            name: 'Source h3 margins',
            fill: null,
            layout: {
              mode: 'VERTICAL',
              width: 'FILL',
              height: 'HUG',
              padding: { block: 'spacing/100', inline: 'spacing/0' },
              gap: 'spacing/0',
            },
            children: [
              text(
                'title',
                'Plain source h3',
                'Highlight title',
                titleId,
                fill,
                'Title'
              ),
            ],
          },
          {
            type: 'FRAME',
            id: 'body-margin',
            name: 'Candidate browser paragraph end margin',
            fill: null,
            bindings: { paddingBottom: pMargin },
            layout: {
              mode: 'VERTICAL',
              width: 'FILL',
              height: 'HUG',
              gap: 'spacing/0',
            },
            children: [
              text(
                'body',
                'Plain source paragraph',
                'Highlighted information.',
                'component.body',
                fill,
                'Body'
              ),
            ],
          },
        ],
      },
    };
  });
  return [
    {
      id: 'highlight-box',
      name: 'Mangrove/Highlight box',
      kind: 'component-set',
      sourceRef: source(jsx, /export function HighlightBox\(/),
      description:
        'Experimental Default/Primary/Secondary plain-content HighlightBox at candidate480px container width. Required editable h3 Title and one plain paragraph Body are a bounded children composition, not React props.',
      limitations: [
        'Required non-empty plain Title and Body only. Rich children, multiple paragraphs, links, lists, media, actions and host CSS overrides are excluded.',
        'Default has transparent background. Primary uses source blue900 fallback; Secondary uses legacy Sendai purple fallback, not current public button or brand-purple roles.',
        'Latin h3 inherits text font; CSS600 to bundled Bold700 is provisional. Arabic heading font routing and RTL are not represented.',
        '480px width and browser paragraph end1em margin are candidate geometry. Browser/native layout, font, wrapping, inset shadow and all-brand pixel acceptance remain pending.',
        'No centered80% or float30% responsive layouts, CKEditor integration, arbitrary resize or live responsive behaviour.',
      ],
      review: { genericLabels: false, preserveVariantSizing: true },
      variants,
    },
  ];
}
module.exports = { buildHighlightBoxRecipes };
