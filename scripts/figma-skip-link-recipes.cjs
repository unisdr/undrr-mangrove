/** Experimental visible SkipLink source candidate. No keyboard behaviour. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const YAML = require('yaml');

function buildSkipLinkRecipes({ root, modes, variables, styles }) {
  const scss = 'stories/Utilities/SkipLink/skip-link.scss';
  const jsx = 'stories/Utilities/SkipLink/SkipLink.jsx';
  const read = file => fs.readFileSync(path.join(root, file), 'utf8');
  const fail = message => {
    throw new Error(`Figma SkipLink recipe needs updating: ${message}`);
  };
  const clean = text =>
    text
      .replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  const source = (file, pattern) => {
    const text = read(file),
      match = pattern.exec(text);
    if (!match) fail(`${file} no longer matches ${pattern}`);
    return { file, line: text.slice(0, match.index).split('\n').length };
  };
  for (const [file, hash] of [
    [scss, 'e41a9a133796a262493220522709799aaabe87fd67880a296aea627f32c7ae1b'],
    [jsx, '6356e0a2ba71cc66f7cce1fdbcdb7db1a7ffe25ea15e53ae1b7ce24b016b61ee'],
  ])
    if (
      crypto
        .createHash('sha256')
        .update(clean(read(file)))
        .digest('hex') !== hash
    )
      fail(`${file} source contract changed`);
  const ref = source(jsx, /label = 'Skip to main content'/);
  const body = 'stories/assets/scss/_foundational.scss';
  if (
    crypto
      .createHash('sha256')
      .update(clean(read(body)))
      .digest('hex') !==
    '4e307714a1414aa88cc1f4ee49d9e7898a29c84f886c0fb8ef5b96db952278a8'
  )
    fail('Global body/link cascade changed; reassess focused inheritance');
  source(
    body,
    /body \{\s*color: rgb\(var\(--mg-color-text\)\);\s*font-family: var\(--mg-font-family-text\);\s*font-size: var\(--mg-font-size-300\);\s*line-height: var\(--mg-font-line-height-700\);\s*\}/
  );
  const line = YAML.parse(read('tokens/mangrove.yaml'))['font-line-height'][
    '700'
  ].$value;
  if (line !== '1.5em') fail('Inherited body line height changed');
  source(
    'stories/assets/fonts/roboto-condensed/roboto-condensed.scss',
    /@import "sass\/Regular";/
  );
  source(
    'stories/assets/fonts/roboto-condensed/sass/_Regular.scss',
    /font-family: "Roboto Condensed";[\s\S]*?font-weight: 400;\s*font-style: normal;/
  );
  const mixins = 'stories/assets/scss/_mixins.scss';
  source(
    mixins,
    /@mixin mg-focus-ring-inset \{\s*box-shadow:\s*inset 0 0 0 var\(--mg-focus-ring-offset\) rgb\(var\(--mg-color-neutral-0\)\),\s*inset 0 0 0 calc\(var\(--mg-focus-ring-offset\) \+ var\(--mg-focus-ring-width\)\)\s*rgb\(var\(--mg-color-focus-ring\)\);\s*outline: 0;/
  );
  const byName = new Map(variables.map(v => [v.name, v]));
  function value(name, mode, type, seen = new Set()) {
    const entry = byName.get(name);
    if (!entry || entry.type !== type || seen.has(name))
      fail(`Missing/wrong-type/circular role ${name}`);
    seen.add(name);
    const v = entry.values[mode.id];
    if (v == null) fail(`Missing ${name}/${mode.id}`);
    return v.alias ? value(v.alias, mode, type, seen) : v;
  }
  function upsert(array, entry, key) {
    const matches = array.filter(v => v[key] === entry[key]);
    if (matches.length > 1 || (matches.length && matches[0].id !== entry.id))
      fail(`Foreign/duplicate ${entry[key]}`);
    const i = array.findIndex(v => v[key] === entry[key]);
    if (i < 0) array.push(entry);
    else array[i] = entry;
  }
  const border = 'component/skip-link/border-bottom-width';
  const borderRef = source(
    scss,
    /border-block-end: 2px solid rgb\(var\(--mg-color-interactive\)\);/
  );
  const borderEntry = {
    id: 'component.skip-link.border-bottom-width',
    name: border,
    type: 'FLOAT',
    scopes: ['STROKE_FLOAT'],
    hiddenFromPublishing: false,
    sourceRef: borderRef,
    codeSyntax: { WEB: 'border-block-end-width: 2px' },
    description: 'Source focused bottom border2px. Native rendering pending.',
    values: Object.fromEntries(modes.map(m => [m.id, 2])),
  };
  upsert(variables, borderEntry, 'name');
  byName.set(border, borderEntry);
  const inset = styles.effect.find(s => s.id === 'focus-ring-inset');
  if (!inset) fail('Existing inset focus style missing');
  for (const mode of modes) {
    for (const n of [
      'color/neutral-0',
      'color/text',
      'color/interactive',
      'color/focus-ring',
    ])
      value(n, mode, 'COLOR');
    for (const [n, expected] of [
      ['font-size/300', 16],
      ['spacing/0', 0],
      ['spacing/100', 10],
      ['spacing/200', 20],
      ['focus-ring/offset', 2],
      ['focus-ring/width', 2],
      ['effect-size/focus-ring/outer-spread', 4],
    ])
      if (value(n, mode, 'FLOAT') !== expected)
        fail(`Bounded typography/geometry changed ${n}/${mode.id}`);
    if (value('font-family/ui', mode, 'STRING') !== 'Roboto Condensed')
      fail(`Latin UI face changed ${mode.id}`);
    const layers = inset.values[mode.id];
    if (
      !layers ||
      layers.length !== 2 ||
      layers[0].bindings.color !== 'color/focus-ring' ||
      layers[1].bindings.color !== 'color/neutral-0' ||
      layers[0].bindings.spread !== 'effect-size/focus-ring/outer-spread' ||
      layers[1].bindings.spread !== 'focus-ring/offset' ||
      layers.some(
        l =>
          l.effect.type !== 'INNER_SHADOW' ||
          l.effect.radius !== 0 ||
          l.effect.offset.x !== 0 ||
          l.effect.offset.y !== 0
      )
    )
      fail(`Inset style contract changed ${mode.id}`);
  }
  const textStyle = 'component.skip-link.label';
  upsert(
    styles.text,
    {
      id: textStyle,
      name: 'Mangrove/component/skip-link/label',
      type: 'TEXT',
      recommended: false,
      sourceRef: source(scss, /font-family: var\(--mg-font-family-ui\);/),
      description:
        'Focused Latin label, inherited normal400/body16px/24px lineheight with UI Condensed face. Source candidate only; browser/native verification pending.',
      typography: {
        fontWeightRequested: 400,
        fontWeightBundled: 400,
        fontStyleBundled: 'Regular',
        lineHeightRatio: 1.5,
        lineHeightBasis: 'computed-body-length',
        verification:
          'Source-derived default body inheritance; browser/native font-file confirmation pending.',
      },
      bindings: { fontFamily: 'font-family/ui', fontSize: 'font-size/300' },
      values: Object.fromEntries(
        modes.map(m => [
          m.id,
          {
            fontName: {
              family: value('font-family/ui', m, 'STRING'),
              style: 'Regular',
            },
            fontSize: value('font-size/300', m, 'FLOAT'),
            lineHeight: {
              unit: 'PIXELS',
              value: value('font-size/300', m, 'FLOAT') * 1.5,
            },
            textDecoration: 'UNDERLINE',
            textWrapStyle: 'AUTO',
          },
        ])
      ),
    },
    'id'
  );
  return [
    {
      id: 'skip-link',
      name: 'Mangrove/Skip link',
      kind: 'component-set',
      sourceRef: ref,
      description:
        'Experimental visible focused block at a finite390px viewport candidate. Editable Label; the hidden default has no visible library master.',
      limitations: [
        'Source-only experimental candidate. Native build/repeat, publication, consumer uptake, browser/pixel geometry and exact font-file matching remain unverified.',
        'Focused appearance only. Hidden1px clipped absolute positioning, keyboard tab order, reveal/reflow, fragment destination and target.focus() are browser behaviour, not implemented in this static component.',
        'Only390px Latin normal-body context. Arbitrary viewport/full-width fill, edited multi-line geometry, inherited custom typography, translations/RTL and forced-colour outlines remain unverified.',
        'Existing inset focus effect has inferred native inner-shadow paint order. Bottom border/shadow overlap and browser focus-visible cascade require visual acceptance.',
      ],
      review: {
        genericLabels: false,
        preserveVariantSizing: true,
        specimens: [
          {
            id: 'source-focused',
            name: 'Focused390px source candidate',
            variant: { State: 'Focused' },
            width: 390,
            properties: { Label: 'Skip to main content' },
          },
        ],
      },
      variants: [
        {
          id: 'skip-link.focused',
          name: 'State=Focused',
          properties: { State: 'Focused' },
          sourceRef: ref,
          tree: {
            type: 'FRAME',
            id: 'root',
            name: 'mg-skip-link :focus',
            fill: 'color/neutral-0',
            stroke: 'color/interactive',
            effectStyle: 'focus-ring-inset',
            layout: {
              mode: 'HORIZONTAL',
              width: 390,
              height: 'HUG',
              align: 'CENTER',
            },
            bindings: {
              strokeWeight: 'spacing/0',
              strokeBottomWeight: border,
              paddingTop: 'spacing/100',
              paddingBottom: 'spacing/100',
              paddingLeft: 'spacing/200',
              paddingRight: 'spacing/200',
            },
            children: [
              {
                type: 'TEXT',
                id: 'label',
                name: 'Skip link label',
                characters: 'Skip to main content',
                textProperty: 'Label',
                textStyle,
                textDecoration: 'UNDERLINE',
                textWrap: 'AUTO',
                fill: 'color/text',
                stroke: null,
                layout: { width: 'FILL', height: 'HUG' },
              },
            ],
          },
        },
      ],
    },
  ];
}
module.exports = { buildSkipLinkRecipes };
