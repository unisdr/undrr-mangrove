/** Experimental centered Pager snapshots. Static visuals, not pagination logic. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const YAML = require('yaml');
function buildPagerRecipes({ root, modes, variables, styles }) {
  const read = file => fs.readFileSync(path.join(root, file), 'utf8');
  const clean = text =>
    text
      .replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  const fail = message => {
    throw new Error(`Figma Pager recipe needs updating: ${message}`);
  };
  const scss = 'stories/Components/Pager/pager.scss';
  const list = 'stories/Components/Pager/components/PagerList.jsx';
  for (const [file, hash] of [
    [scss, '710b24cf0254c3cd941ee62f3840625ecdc9d72b9b704ed9735ee28e188c6cfa'],
    [
      'stories/Components/Pager/Pager.jsx',
      '1c7fe3342ab4eb7f76ef55cd3822634f19f2d7a95c8e9636ad6cf78e5b641b19',
    ],
    [list, '4ffe71e08627fc4d8dd5500ce1edbd158af087b2960d175712d159675ef2a32e'],
    [
      'stories/Components/Pager/components/PagerRange.jsx',
      '927cdd361f8a9502ddd7b87f51741e9c2b6551386b1302bf4a918d024488c0fe',
    ],
    [
      'stories/Components/Pager/components/PagerJump.jsx',
      '470d9c041862759070b8753c3bb36ed7054f6cbb443d886a8e5a6625725e9049',
    ],
    [
      'stories/Components/Pager/Pager.stories.jsx',
      'dccfa2f482cb3e6ddfceb30f873e6dcf7c72a9caa3286fc0ecce505d4cde3c72',
    ],
    [
      'stories/assets/scss/_foundational.scss',
      '4e307714a1414aa88cc1f4ee49d9e7898a29c84f886c0fb8ef5b96db952278a8',
    ],
    [
      'stories/Utilities/Normalize/normalize.scss',
      'f7f1f1a33c5dc6ee0ec63363e239bdecbcda72c8aeebbcf35728666f60a31486',
    ],
    [
      'stories/assets/scss/_mixins.scss',
      '4ad1db924f55d4f6ff7c49ee3decf597f6a9cdb69389998dbd31f9fcb76b30ca',
    ],
  ])
    if (
      crypto
        .createHash('sha256')
        .update(clean(read(file)))
        .digest('hex') !== hash
    )
      fail(`Source contract changed: ${file}`);
  const source = (file, pattern) => {
    const text = read(file),
      match = pattern.exec(text);
    if (!match) fail(`Missing source ${file}: ${pattern}`);
    return { file, line: text.slice(0, match.index).split('\n').length };
  };
  const ref = source(list, /export function PagerList\(/);
  if (
    YAML.parse(read('tokens/mangrove.yaml'))['font-line-height']['700']
      .$value !== '1.5em'
  )
    fail('Inherited body line-height token changed');
  source('stories/assets/scss/_variables.scss', /\$mg-html-font-size: 16;/);
  source(
    'stories/assets/scss/_variables.scss',
    /@function mg-rem\(\$px\) \{\s*@return math.div\(\$px, \$mg-html-font-size\) \* 1rem;\s*\}/
  );
  if (
    modes
      .map(m => m.id)
      .sort()
      .join(',') !== 'delta,irp,mcr,preventionweb,undrr'
  )
    fail('Five distinct brand modes required');
  const inventory = clean(read('stories/assets/fonts/roboto/roboto.scss'));
  const expectedInventory = clean(
    '@import "sass/variables"; @import "sass/mixins"; @import "sass/Light"; @import "sass/LightItalic"; @import "sass/Regular"; @import "sass/Italic"; @import "sass/Medium"; @import "sass/MediumItalic"; @import "sass/Bold"; @import "sass/BoldItalic"; @import "sass/Black"; @import "sass/BlackItalic";'
  );
  if (inventory !== expectedInventory)
    fail('Roboto font inventory changed; reassess600 matching');
  for (const [face, weight] of [
    ['Light', 300],
    ['Regular', 400],
    ['Medium', 500],
    ['Bold', 700],
    ['Black', 900],
  ])
    source(
      `stories/assets/fonts/roboto/sass/_${face}.scss`,
      new RegExp(
        `font-family: Roboto;[\\s\\S]*?font-weight: ${weight};\\s*font-style: normal;`
      )
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
    const matches = array.filter(
      v => v[key] === entry[key] || v.id === entry.id || v.name === entry.name
    );
    if (
      matches.length > 1 ||
      (matches.length &&
        (matches[0].id !== entry.id || matches[0].name !== entry.name))
    )
      fail(`Foreign/duplicate identity ${entry.name}`);
    const i = array.findIndex(v => v[key] === entry[key]);
    if (i < 0) array.push(entry);
    else array[i] = entry;
  }
  function role(name, type, scopes, fn, description) {
    const full = `component/pager/${name}`;
    const entry = {
      id: full.replaceAll('/', '.'),
      name: full,
      type,
      scopes,
      sourceRef: ref,
      description,
      hiddenFromPublishing: false,
      codeSyntax: {},
      values: Object.fromEntries(
        modes.map(m => [m.id, typeof fn === 'function' ? fn(m) : fn])
      ),
    };
    upsert(variables, entry, 'name');
    byName.set(full, entry);
    return full;
  }
  for (const mode of modes) {
    if (value('font-family/text', mode, 'STRING') !== 'Roboto')
      fail(`Latin body font changed ${mode.id}`);
    for (const [n, expected] of [
      ['font-size/200', 12.5],
      ['font-size/300', 16],
      ['spacing/0', 0],
      ['spacing/25', 2.5],
      ['spacing/50', 5],
      ['spacing/150', 15],
    ])
      if (value(n, mode, 'FLOAT') !== expected)
        fail(`Bounded sizing changed ${n}/${mode.id}`);
    for (const n of [
      'color/text',
      'color/neutral-500',
      'color/neutral-100',
      'color/interactive',
    ])
      value(n, mode, 'COLOR');
  }
  const minimum = role(
    'control-minimum',
    'FLOAT',
    ['WIDTH_HEIGHT'],
    44,
    'Source44px minimum control allocation at16px root.'
  );
  const radius = role(
    'control-radius',
    'FLOAT',
    ['CORNER_RADIUS'],
    22,
    'Source50% radius for bounded44px controls; arbitrary edited widths are excluded.'
  );
  const current = role(
    'current-background',
    'COLOR',
    ['SHAPE_FILL'],
    m => ({ ...value('color/interactive', m, 'COLOR'), a: 0.12 }),
    'Source interactive12% current-page background.'
  );
  const navigation = role(
    'navigation-background',
    'COLOR',
    ['SHAPE_FILL'],
    m => ({ ...value('color/interactive', m, 'COLOR'), a: 0.06 }),
    'Source interactive6% previous/next background when enabled.'
  );
  const disabled = role(
    'disabled-background',
    'COLOR',
    ['SHAPE_FILL'],
    m => ({ ...value('color/neutral-100', m, 'COLOR'), a: 0.7 }),
    'Actual disabledattribute specificity0,2 wins current/prev/next modifier0,1; source neutral10070%.'
  );
  const labelStyle = 'component.pager.number';
  const ellipsisStyle = 'component.pager.ellipsis';
  for (const [id, style, weight, lineHeight] of [
    [labelStyle, 'Bold', 600, { unit: 'PERCENT', value: 115 }],
    [ellipsisStyle, 'Regular', 400, { unit: 'PIXELS', value: 24 }],
  ])
    upsert(
      styles.text,
      {
        id,
        name: `Mangrove/component/pager/${id.split('.').pop()}`,
        type: 'TEXT',
        recommended: false,
        sourceRef: ref,
        description:
          id === labelStyle
            ? 'Source CSS600 selects guarded bundledBold700 provisionally;12.5px own-size Normalize1.15. Browser/native font matching pending.'
            : 'Source12.5px ellipsis inherits normal400 body24px lineheight. Browser/native confirmation pending.',
        typography: {
          fontWeightRequested: weight,
          fontWeightBundled: style === 'Bold' ? 700 : 400,
          fontStyleBundled: style,
          lineHeightBasis:
            id === labelStyle ? 'own-font-size' : 'computed-body-length',
          verification:
            'Source candidate only; browser/native confirmation pending.',
        },
        bindings: { fontFamily: 'font-family/text', fontSize: 'font-size/200' },
        values: Object.fromEntries(
          modes.map(m => [
            m.id,
            {
              fontName: {
                family: value('font-family/text', m, 'STRING'),
                style,
              },
              fontSize: value('font-size/200', m, 'FLOAT'),
              lineHeight,
              textDecoration: 'NONE',
              textWrapStyle: 'AUTO',
            },
          ])
        ),
      },
      'id'
    );
  function control(id, number, selected, loading) {
    return {
      type: 'FRAME',
      id,
      name: `mg-pager__link${selected ? ' mg-pager__link--current' : ''}${loading ? ' :disabled' : ''}`,
      fill: loading ? disabled : selected ? current : null,
      stroke: null,
      bindings: { cornerRadius: radius },
      layout: {
        mode: 'HORIZONTAL',
        width: minimum,
        height: minimum,
        minWidth: minimum,
        minHeight: minimum,
        align: 'CENTER',
        justify: 'CENTER',
      },
      children: [
        {
          type: 'TEXT',
          id: `${id}-label`,
          name: `Page ${number} label`,
          characters: String(number),
          textProperty: `Page ${number}`,
          textStyle: labelStyle,
          textDecoration: 'NONE',
          fill: loading ? 'color/neutral-500' : 'color/text',
          layout: { width: 'HUG', height: 'HUG' },
        },
      ],
    };
  }
  function arrow(direction, loading) {
    const points =
      direction === 'previous' ? '15 18 9 12 15 6' : '9 18 15 12 9 6';
    const colour = loading ? 'color/neutral-500' : 'color/text';
    return {
      type: 'FRAME',
      id: direction,
      name: `mg-pager__link mg-pager__link--${direction === 'previous' ? 'prev' : 'next'}${loading ? ' :disabled' : ''}`,
      fill: loading ? disabled : navigation,
      stroke: null,
      bindings: { cornerRadius: radius },
      layout: {
        mode: 'HORIZONTAL',
        width: minimum,
        height: minimum,
        minWidth: minimum,
        minHeight: minimum,
        align: 'CENTER',
        justify: 'CENTER',
      },
      children: [
        {
          type: 'SVG',
          id: `${direction}-icon`,
          name: `${direction} source chevron`,
          layout: { width: 20, height: 20 },
          svg: {
            assetId: `pager-${direction}`,
            markup: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="${points}"/></svg>`,
            monochrome: { strokes: colour },
          },
        },
      ],
    };
  }
  const snapshots = [
    ['Default', 3, 20, false],
    ['Loading', 3, 20, true],
    ['FewPages', 2, 3, false],
  ];
  return [
    {
      id: 'pager',
      name: 'Mangrove/Pager',
      kind: 'component-set',
      sourceRef: ref,
      description:
        'Three centered source-story snapshots, finite640px Latin row candidate with authored44px circular controls. Editable number labels are presentation text independent of fixed page/state snapshots.',
      limitations: [
        'Source-only experimental candidates. Browser/native layout, exact fonts, SVG stroke/viewports, all-brand pixels, publication and consumer uptake remain unverified.',
        'Default/Loading(page3of20) and FewPages(page2of3) centered snapshots only. No arbitrary page/total calculation, previous/next/current state changes, interaction, keyboard/ARIA/live announcements or prototype navigation.',
        'Page text properties are independent labels; editing them does not change state, page count or semantics. Bounded short single-line labels only; resizing/multi-line controls and arbitrary viewport wrapping are excluded.',
        'Bar layout, range, jump input/button, empty/overshoot notices, unknown total, edge pages, many-page presets, Hover/Focus/Active/motion and RTL are excluded.',
        'Top margin20px is external browser spacing and excluded. Top padding15px is represented. Fixed640px width and one-row arrangement are candidate geometry, not authored fixed component width.',
        'CSS600 maps provisionally to guarded bundledRobotoBold700. Native font-file equivalence and Normalize/button line-height parity require source/browser/native verification.',
      ],
      review: { genericLabels: false, preserveVariantSizing: true },
      variants: snapshots.map(([Snapshot, page, totalPages, loading]) => {
        const numbers = totalPages === 3 ? [1, 2, 3] : [1, 2, 3, 4, 5];
        const children = [
          arrow('previous', loading),
          ...numbers.map(n => control(`page-${n}`, n, n === page, loading)),
        ];
        if (totalPages === 20)
          children.push(
            {
              type: 'FRAME',
              id: 'ellipsis-end',
              name: 'mg-pager__item--ellipsis',
              fill: null,
              layout: {
                mode: 'HORIZONTAL',
                width: 'HUG',
                height: 'HUG',
                align: 'CENTER',
                padding: { inline: 'spacing/25', block: 'spacing/0' },
              },
              children: [
                {
                  type: 'TEXT',
                  id: 'ellipsis-glyph',
                  name: 'mg-pager__ellipsis',
                  characters: '…',
                  textStyle: ellipsisStyle,
                  fill: 'color/neutral-500',
                  layout: { width: 'HUG', height: 'HUG' },
                },
              ],
            },
            control('page-20', 20, false, loading)
          );
        children.push(arrow('next', loading));
        return {
          id: `pager.${Snapshot.toLowerCase()}`,
          name: `Snapshot=${Snapshot}`,
          properties: { Snapshot },
          sourceSnapshot: { page, totalPages, isLoading: loading },
          tree: {
            type: 'FRAME',
            id: 'root',
            name: 'mg-pager',
            fill: null,
            stroke: null,
            bindings: { paddingTop: 'spacing/150' },
            layout: { mode: 'VERTICAL', width: 640, height: 'HUG' },
            children: [
              {
                type: 'FRAME',
                id: 'list',
                name: 'mg-pager__list',
                fill: null,
                layout: {
                  mode: 'HORIZONTAL',
                  width: 'FILL',
                  height: 'HUG',
                  align: 'CENTER',
                  justify: 'CENTER',
                  gap: 'spacing/50',
                },
                children,
              },
            ],
          },
        };
      }),
    },
  ];
}
module.exports = { buildPagerRecipes };
