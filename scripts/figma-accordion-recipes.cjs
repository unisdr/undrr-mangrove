/** Bounded source-only Accordion. Browser/native acceptance remains pending. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const YAML = require('yaml');
function buildAccordionRecipes({ root, modes, variables, styles }) {
  const scss = 'stories/Atom/ReachElement/Details/details.scss';
  const story = 'stories/Atom/BaseTypography/BaseTypography.stories.jsx';
  const read = file => fs.readFileSync(path.join(root, file), 'utf8');
  const fail = message => {
    throw new Error(`Figma Accordion recipe needs updating: ${message}`);
  };
  const clean = text =>
    text
      .replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  for (const [file, hash] of [
    [scss, '10ba34d11c12f9c62d4bb736c58c373dbec91fc1db3c5d10f0a6e00e66a21808'],
    [
      'stories/assets/scss/_foundational.scss',
      '4e307714a1414aa88cc1f4ee49d9e7898a29c84f886c0fb8ef5b96db952278a8',
    ],
    [
      'stories/assets/scss/_mixins.scss',
      '4ad1db924f55d4f6ff7c49ee3decf597f6a9cdb69389998dbd31f9fcb76b30ca',
    ],
    [
      'stories/assets/scss/_breakpoints.scss',
      '2394e91c8ca74f39e1da9ffac5cdc74fc1058c6673176789c6616faed44fceb3',
    ],
  ])
    if (
      crypto
        .createHash('sha256')
        .update(clean(read(file)))
        .digest('hex') !== hash
    )
      fail(`${file} cascade or geometry changed`);
  const source = (file, pattern) => {
    const text = read(file),
      match = pattern.exec(text);
    if (!match) fail(`${file} no longer matches ${pattern}`);
    return { file, line: text.slice(0, match.index).split('\n').length };
  };
  const ref = source(scss, /\.mg-accordion \{/);
  const storySlice = read(story).match(
    /export const TypographyAccordion = \{[\s\S]*?\n\};/
  )?.[0];
  if (!storySlice) fail('Missing TypographyAccordion story');
  if (
    crypto.createHash('sha256').update(clean(storySlice)).digest('hex') !==
    'd0c0f8964fc8da0de10b960d6d854bcce8bd9971b7c57331d5eb7b4167f69433'
  )
    fail('Story anatomy or seeded content changed');
  source('stories/assets/scss/_variables.scss', /\$mg-html-font-size: 16;/);
  source(
    'stories/assets/scss/_variables.scss',
    /@function mg-rem\(\$px\) \{\s*@return math.div\(\$px, \$mg-html-font-size\) \* 1rem;\s*\}/
  );
  if (
    YAML.parse(read('tokens/mangrove.yaml'))['font-line-height']?.['700']
      ?.$value !== '1.5em'
  )
    fail('Inherited body line-height changed');
  const byName = new Map(variables.map(v => [v.name, v]));
  function value(name, mode, type, seen = new Set()) {
    const entry = byName.get(name);
    if (!entry || entry.type !== type || seen.has(name))
      fail(`Missing/wrong-type/circular ${name}`);
    seen.add(name);
    const result = entry.values[mode.id];
    if (result == null) fail(`Missing ${name}/${mode.id}`);
    return result.alias ? value(result.alias, mode, type, seen) : result;
  }
  if (
    modes
      .map(m => m.id)
      .sort()
      .join(',') !== 'delta,irp,mcr,preventionweb,undrr'
  )
    fail('Expected five source brands');
  for (const m of modes) {
    for (const n of [
      'color/neutral-0',
      'color/neutral-200',
      'color/neutral-300',
      'color/text',
      'color/interactive',
    ])
      value(n, m, 'COLOR');
    for (const n of ['spacing/0', 'spacing/100', 'spacing/150'])
      value(n, m, 'FLOAT');
    if (value('font-family/text', m, 'STRING') !== 'Roboto')
      fail(`Latin text font changed ${m.id}`);
    if (value('font-size/300', m, 'FLOAT') !== 16)
      fail('Bounded BelowMedium body/summary font changed');
  }
  const inventory = clean(read('stories/assets/fonts/roboto/roboto.scss'));
  for (const [face, weight] of [
    ['Regular', 400],
    ['Bold', 700],
  ]) {
    if (!inventory.includes(`@import "sass/${face}";`))
      fail(`Missing bundled ${face}`);
    source(
      `stories/assets/fonts/roboto/sass/_${face}.scss`,
      new RegExp(
        `font-family: Roboto;[\\s\\S]*?font-weight: ${weight};\\s*font-style: normal;`
      )
    );
  }
  for (const match of inventory.matchAll(/@import "sass\/([^"\n]+)";/g))
    if (
      /font-weight:\s*600\s*;/.test(
        read(`stories/assets/fonts/roboto/sass/_${match[1]}.scss`)
      )
    )
      fail('Bundled600 face changed provisional font matching');
  function upsert(array, entry, key) {
    const matches = array.filter(
      v => v[key] === entry[key] || v.id === entry.id || v.name === entry.name
    );
    if (
      matches.length > 1 ||
      (matches.length &&
        (matches[0].id !== entry.id || matches[0].name !== entry.name))
    )
      fail(`Foreign/duplicate ${entry[key]}`);
    const i = array.findIndex(v => v[key] === entry[key]);
    if (i < 0) array.push(entry);
    else array[i] = entry;
  }
  function number(name, n, scopes, description) {
    const full = `component/accordion/${name}`;
    upsert(
      variables,
      {
        id: full.replaceAll('/', '.'),
        name: full,
        type: 'FLOAT',
        scopes,
        description,
        sourceRef: ref,
        hiddenFromPublishing: false,
        codeSyntax: {},
        values: Object.fromEntries(modes.map(m => [m.id, n])),
      },
      'name'
    );
    return full;
  }
  const one = number(
    'border',
    1,
    ['STROKE_FLOAT'],
    'Source one-pixel root/divider/open-summary borders.'
  );
  const radius = number(
    'radius',
    4,
    ['CORNER_RADIUS'],
    'Source mg-rem(4) outer radius at guarded16px root.'
  );
  const minimum = number(
    'summary-minimum',
    44,
    ['WIDTH_HEIGHT'],
    'Source mg-rem(44) summary minimum height.'
  );
  const width = number(
    'specimen-width-390',
    390,
    ['WIDTH_HEIGHT'],
    'Finite390px BelowMedium drawing, not authored source width.'
  );
  const marker = number(
    'marker-allocation',
    8,
    ['WIDTH_HEIGHT'],
    'Source mg-rem(8) border-box flex allocation; rotated ink overflows.'
  );
  const margin = number(
    'paragraph-bottom-candidate',
    16,
    ['GAP'],
    'Candidate UA paragraph bottom1em margin; browser verification pending.'
  );
  for (const [name, face] of [
    ['summary', 'Bold'],
    ['body', 'Regular'],
  ])
    upsert(
      styles.text,
      {
        id: `component.accordion.${name}`,
        name: `Mangrove/component/accordion/${name}`,
        recommended: false,
        component: true,
        sourceRef: ref,
        description:
          'BelowMedium Latin candidate. Summary CSS600 to bundled700 is provisional; body inherited16px/24px.',
        typography: {
          requestedWeight: face === 'Bold' ? 600 : 400,
          bundledWeight: face === 'Bold' ? 700 : 400,
          lineHeightBasis: 'inherited-computed-body',
        },
        bindings: { fontFamily: 'font-family/text', fontSize: 'font-size/300' },
        values: Object.fromEntries(
          modes.map(m => [
            m.id,
            {
              fontName: {
                family: value('font-family/text', m, 'STRING'),
                style: face,
              },
              fontSize: 16,
              lineHeight: { unit: 'PIXELS', value: 24 },
            },
          ])
        ),
      },
      'id'
    );
  const titles = [...storySlice.matchAll(/<summary>([^<]+)<\/summary>/g)].map(
    m => m[1]
  );
  const paragraph = storySlice
    .match(/<p>([\s\S]*?)<\/p>/)[1]
    .replace(/\s+/g, ' ')
    .trim();
  const side = 8,
    border = 2,
    viewport = Number((side * Math.SQRT2).toFixed(8));
  function svg(opened) {
    const angle = ((opened ? -135 : 45) * Math.PI) / 180,
      cos = Math.cos(angle),
      sin = Math.sin(angle);
    const rotate = ([x, y]) => {
      x -= side / 2;
      y -= side / 2;
      return [
        Number((x * cos - y * sin + viewport / 2).toFixed(8)),
        Number((x * sin + y * cos + viewport / 2).toFixed(8)),
      ];
    };
    const polygon = points =>
      `<polygon fill="#000000" points="${points.map(p => rotate(p).join(',')).join(' ')}"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewport} ${viewport}">${polygon(
      [
        [0, side - border],
        [side, side - border],
        [side, side],
        [0, side],
      ]
    )}${polygon([
      [side - border, 0],
      [side, 0],
      [side, side - border],
      [side - border, side - border],
    ])}</svg>`;
  }
  return [
    {
      id: 'accordion',
      name: 'Mangrove/Accordion',
      kind: 'component-set',
      sourceRef: ref,
      description:
        'Experimental three-item Default Accordion from TypographyAccordion, first panel open/closed and other panels closed. Titles1/2/3 and expanded Body1 are plain-text properties.',
      review: { genericLabels: false, preserveVariantSizing: true },
      limitations: [
        'Source-only preparation. Browser/native geometry, font matching, ordinary native repeats, publication and consumer acceptance remain pending.',
        'Default/Flush three-item Latin390px BelowMedium candidate only. Flush applies the authored border-inline:none/radius0 modifier to the same three-item content, rather than copying the separate two-item map-layer story. FirstOpen switches only the first panel; other panels, nested mg-details, rich content, insertion/removal, arbitrary resizing, RTL and broader scripts are excluded.',
        'Titles and expanded Body1 must remain non-empty. CSS600 to bundled RobotoBold700 is provisional. Paragraph bottom margin16px is candidate browser-UA spacing, not a Mangrove token.',
        'SVG chevron contours derive from source8px border-box/2px borders with45/-135degree rotation.8px flex allocation and rotated ink overflow are represented, but native SVG bounds/summary baselines and CSS space-between wrapping require visual acceptance.',
        'CSS48em typography switches, hover/focus/active/reduced-motion, native disclosure interaction, focus order and accessibility semantics remain in code.',
      ],
      variants: ['Default', 'Flush'].flatMap(Treatment =>
        [false, true].map(opened => ({
          id: `accordion.${Treatment.toLowerCase()}.first-${opened ? 'open' : 'closed'}`,
          name: `Treatment=${Treatment}, FirstOpen=${opened ? 'True' : 'False'}`,
          properties: { Treatment, FirstOpen: opened ? 'True' : 'False' },
          sourceRef: ref,
          tree: {
            type: 'FRAME',
            id: 'root',
            name:
              Treatment === 'Flush'
                ? 'mg-accordion mg-accordion--flush'
                : 'mg-accordion',
            fill: 'color/neutral-0',
            stroke: 'color/neutral-300',
            bindings: {
              strokeWeight: one,
              strokeTopWeight: one,
              strokeBottomWeight: one,
              strokeLeftWeight: Treatment === 'Flush' ? 'spacing/0' : one,
              strokeRightWeight: Treatment === 'Flush' ? 'spacing/0' : one,
              cornerRadius: Treatment === 'Flush' ? 'spacing/0' : radius,
            },
            layout: {
              mode: 'VERTICAL',
              width,
              height: 'HUG',
              clipsContent: true,
            },
            children: titles.map((title, index) => {
              const open = opened && index === 0;
              const summary = {
                type: 'FRAME',
                id: `summary-${index}`,
                name: `Summary ${index + 1}`,
                fill: 'color/neutral-0',
                stroke: open ? 'color/neutral-200' : null,
                bindings: open
                  ? { strokeWeight: 'spacing/0', strokeBottomWeight: one }
                  : {},
                layout: {
                  mode: 'HORIZONTAL',
                  width: 'FILL',
                  height: 'HUG',
                  minHeight: minimum,
                  align: 'CENTER',
                  gap: 'spacing/100',
                  padding: { block: 'spacing/100', inline: 'spacing/150' },
                  clipsContent: false,
                },
                children: [
                  {
                    type: 'TEXT',
                    id: `title-${index}`,
                    name: `Title ${index + 1}`,
                    characters: title,
                    textProperty: `Title ${index + 1}`,
                    textStyle: 'component.accordion.summary',
                    textWrap: 'AUTO',
                    fill: 'color/interactive',
                    layout: { width: 'FILL', height: 'HUG' },
                  },
                  {
                    type: 'FRAME',
                    id: `marker-slot-${index}`,
                    name: 'Source8px chevron allocation',
                    fill: null,
                    layout: {
                      mode: 'NONE',
                      width: marker,
                      height: marker,
                      clipsContent: false,
                    },
                    children: [
                      {
                        type: 'SVG',
                        id: `marker-ink-${index}`,
                        name: 'Source rotated chevron ink',
                        layout: { width: viewport, height: viewport },
                        position: {
                          x: Number(((side - viewport) / 2).toFixed(8)),
                          y: Number(((side - viewport) / 2).toFixed(8)),
                        },
                        svg: {
                          assetId: `accordion-${open ? 'open' : 'closed'}-chevron`,
                          markup: svg(open),
                          monochrome: { fills: 'color/interactive' },
                        },
                      },
                    ],
                  },
                ],
              };
              const children = [summary];
              if (open)
                children.push({
                  type: 'FRAME',
                  id: `content-${index}`,
                  name: 'Source plain paragraph wrapper',
                  fill: null,
                  layout: {
                    mode: 'VERTICAL',
                    width: 'FILL',
                    height: 'HUG',
                    padding: { block: 'spacing/150', inline: 'spacing/150' },
                    clipsContent: false,
                  },
                  children: [
                    {
                      type: 'FRAME',
                      id: `paragraph-${index}`,
                      name: 'Candidate paragraph end-margin allocation',
                      fill: null,
                      bindings: { paddingBottom: margin },
                      layout: {
                        mode: 'VERTICAL',
                        width: 'FILL',
                        height: 'HUG',
                      },
                      children: [
                        {
                          type: 'TEXT',
                          id: `body-${index}`,
                          name: 'Body 1',
                          characters: paragraph,
                          textProperty: 'Body 1',
                          textStyle: 'component.accordion.body',
                          textWrap: 'AUTO',
                          fill: 'color/text',
                          layout: { width: 'FILL', height: 'HUG' },
                        },
                      ],
                    },
                  ],
                });
              return {
                type: 'FRAME',
                id: `item-${index}`,
                name: `Disclosure ${index + 1}`,
                fill: null,
                stroke: index < 2 ? 'color/neutral-300' : null,
                bindings:
                  index < 2
                    ? { strokeWeight: 'spacing/0', strokeBottomWeight: one }
                    : {},
                layout: {
                  mode: 'VERTICAL',
                  width: 'FILL',
                  height: 'HUG',
                  clipsContent: false,
                },
                children,
              };
            }),
          },
        }))
      ),
    },
  ];
}
module.exports = { buildAccordionRecipes };
