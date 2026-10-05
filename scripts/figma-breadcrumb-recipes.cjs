/** Experimental static Latin Breadcrumbs. Native acceptance is pending. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const YAML = require('yaml');
function buildBreadcrumbRecipes({ root, modes, variables, styles }) {
  const scss = 'stories/Components/Breadcrumbs/breadcrumbs.scss';
  const jsx = 'stories/Components/Breadcrumbs/Breadcrumbs.jsx';
  const story = 'stories/Components/Breadcrumbs/Breadcrumbs.stories.jsx';
  const read = file => fs.readFileSync(path.join(root, file), 'utf8');
  const fail = message => {
    throw new Error(`Figma Breadcrumbs recipe needs updating: ${message}`);
  };
  const clean = text =>
    text
      .replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  for (const [file, hash] of [
    [scss, '5f360bb5c94d541a966689413891003431126f6796e71761e8221a0a98950456'],
    [jsx, 'fc7406ea8c81873589af5a2df3a7dd161379211d32acf2ff9010cf6c074fecfa'],
  ])
    if (
      crypto
        .createHash('sha256')
        .update(clean(read(file)))
        .digest('hex') !== hash
    )
      fail(`${file} anatomy or treatment changed`);
  if (
    modes
      .map(m => m.id)
      .sort()
      .join(',') !== 'delta,irp,mcr,preventionweb,undrr'
  )
    fail('Expected five source brand modes');
  const source = (file, pattern) => {
    const text = read(file),
      match = pattern.exec(text);
    if (!match) fail(`${file} no longer matches ${pattern}`);
    return { file, line: text.slice(0, match.index).split('\n').length };
  };
  const anatomy = source(jsx, /<nav\s+aria-label=\{navLabel\}/);
  const sepRef = source(scss, /li \+ li::before \{/);
  const labels = ['Home', 'Second-level', 'Third-level', 'Page title'];
  for (const label of labels) source(story, new RegExp(`text: '${label}'`));
  source(
    'stories/assets/scss/_foundational.scss',
    /body\s*\{[^}]*color: rgb\(var\(--mg-color-text\)\);[^}]*line-height: var\(--mg-font-line-height-700\);/
  );
  source(
    'stories/assets/scss/_foundational.scss',
    /\*,\s*\*::before,\s*\*::after \{\s*box-sizing: border-box;/
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
      fail(`Missing, wrong-type or circular ${name}`);
    seen.add(name);
    const result = entry.values[mode.id];
    if (result == null) fail(`Missing ${name}/${mode.id}`);
    return result.alias ? value(result.alias, mode, type, seen) : result;
  }
  for (const mode of modes) {
    for (const name of ['color/text', 'color/white'])
      value(name, mode, 'COLOR');
    value('spacing/100', mode, 'FLOAT');
    if (value('font-family/ui', mode, 'STRING') !== 'Roboto Condensed')
      fail(`Latin UI font changed in ${mode.id}`);
  }
  for (const [face, weight] of [
    ['Regular', 400],
    ['Bold', 700],
  ]) {
    source(
      'stories/assets/fonts/roboto-condensed/roboto-condensed.scss',
      new RegExp(`@import "sass/${face}";`)
    );
    source(
      `stories/assets/fonts/roboto-condensed/sass/_${face}.scss`,
      new RegExp(
        `font-family: "Roboto Condensed";[\\s\\S]*?font-weight: ${weight};\\s*font-style: normal;`
      )
    );
  }
  const sizes = modes.map(m => value('font-size/300', m, 'FLOAT'));
  if (!sizes.every(n => Number.isFinite(n) && n > 0 && n === sizes[0]))
    fail('Fixed SVG viewport needs equal positive source font sizes');
  const fontSize = sizes[0],
    side = fontSize * 0.35,
    border = fontSize * 0.125;
  const left = fontSize * 0.65,
    right = fontSize * 0.75,
    viewport = side * Math.SQRT2;
  const round = n => Number(n.toFixed(8));
  const rotate = ([x, y]) => [
    round((x - y) / Math.SQRT2 + side / Math.SQRT2),
    round((x + y) / Math.SQRT2),
  ];
  const polygon = points =>
    `<polygon fill="#000000" points="${points.map(p => rotate(p).join(',')).join(' ')}"/>`;
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${round(viewport)} ${round(viewport)}">${polygon(
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
  function upsert(array, entry, key) {
    const matches = array.filter(v => v[key] === entry[key]);
    if (matches.length > 1 || (matches.length && matches[0].id !== entry.id))
      fail(`Foreign/duplicate identity ${entry[key]}`);
    const index = array.findIndex(v => v[key] === entry[key]);
    if (index < 0) array.push(entry);
    else array[index] = entry;
  }
  function number(name, n, description) {
    const full = `component/breadcrumbs/${name}`;
    upsert(
      variables,
      {
        id: full.replaceAll('/', '.'),
        name: full,
        type: 'FLOAT',
        sourceRef: sepRef,
        description,
        scopes: ['WIDTH_HEIGHT'],
        hiddenFromPublishing: false,
        codeSyntax: {},
        values: Object.fromEntries(modes.map(m => [m.id, n])),
      },
      'name'
    );
    return full;
  }
  const slotWidth = number(
    'separator-slot-width',
    left + side + right,
    'Source .65em + .35em + .75em inline allocation; rotated visual ink overflows it.'
  );
  const slotHeight = number(
    'separator-ink-height',
    round(viewport),
    'Rotated source border-box visual height, not measured CSS line-box allocation.'
  );
  for (const [name, face, requested] of [
    ['link', 'Regular', 400],
    ['current', 'Bold', 600],
  ]) {
    const id = `component.breadcrumbs.${name}`;
    upsert(
      styles.text,
      {
        id,
        name: `Mangrove/component/breadcrumbs/${name}`,
        recommended: false,
        component: true,
        sourceRef: source(scss, /font-family: var\(--mg-font-family-ui\);/),
        description:
          'Experimental inherited 150% Latin typography; source/native parity pending.',
        typography: {
          requestedWeight: requested,
          bundledWeight: face === 'Bold' ? 700 : 400,
          verification:
            'Current CSS600 to bundled Bold700 is provisional until browser/native comparison.',
        },
        bindings: { fontFamily: 'font-family/ui', fontSize: 'font-size/300' },
        values: Object.fromEntries(
          modes.map(m => [
            m.id,
            {
              fontName: {
                family: value('font-family/ui', m, 'STRING'),
                style: face,
              },
              fontSize: value('font-size/300', m, 'FLOAT'),
              lineHeight: { unit: 'PERCENT', value: 150 },
            },
          ])
        ),
      },
      'id'
    );
  }
  return [
    {
      id: 'breadcrumbs',
      name: 'Mangrove/Breadcrumbs',
      kind: 'component-set',
      sourceRef: anatomy,
      description:
        'Experimental four-item static Latin LTR trail with three editable link labels and one required current page label. Two source colour treatments, no navigation behaviour.',
      limitations: [
        'Source-only scaffold, excluded from the construction catalogue, core and maintenance merge. Browser/native geometry, fonts, repeats, publication and consumer acceptance remain pending.',
        'Intrinsic single-row English four-item trail only. CSS wrap, overflow, min-content sizing, item insertion/removal, empty links, long trails, arbitrary-width edits, Arabic/RTL and forced colours are excluded.',
        'All four labels must be non-empty. Current-page CSS600 to bundled Bold700 is provisional; native underline offset and source font-file matching require acceptance.',
        'Source rotated separator contours are generated from guarded border-box geometry; SVG ink viewport and centre alignment are candidate drawings, not measured CSS baseline/vertical-align behaviour. SVG cannot bind live em geometry, so rebuild after source font-size changes.',
        'Root padding depicts source block margins without modelling CSS margin collapse. Hover, focus, accessible nav/current semantics and actual destinations remain in code.',
      ],
      review: { genericLabels: false, preserveVariantSizing: true },
      variants: ['Default', 'White'].map(Color => {
        const fill = Color === 'White' ? 'color/white' : 'color/text';
        const children = [];
        labels.forEach((label, index) => {
          if (index)
            children.push({
              type: 'FRAME',
              id: `separator-${index}`,
              name: `Source separator ${index}`,
              fill: null,
              layout: {
                mode: 'NONE',
                width: slotWidth,
                height: slotHeight,
                clipsContent: false,
              },
              children: [
                {
                  type: 'SVG',
                  id: `ink-${index}`,
                  name: 'Source rotated border ink',
                  layout: { width: round(viewport), height: round(viewport) },
                  position: { x: round(left + (side - viewport) / 2), y: 0 },
                  svg: {
                    assetId: `breadcrumbs-${Color.toLowerCase()}-separator`,
                    markup,
                    monochrome: { fills: fill },
                  },
                },
              ],
            });
          children.push({
            type: 'TEXT',
            id: `label-${index}`,
            name: index === 3 ? 'Current page' : 'Ancestor link',
            characters: label,
            textProperty: index === 3 ? 'Current page' : `Link ${index + 1}`,
            textStyle:
              index === 3
                ? 'component.breadcrumbs.current'
                : 'component.breadcrumbs.link',
            textDecoration: index === 3 ? 'NONE' : 'UNDERLINE',
            textWrap: 'AUTO',
            fill,
            layout: { width: 'HUG', height: 'HUG' },
          });
        });
        return {
          id: `breadcrumbs.${Color.toLowerCase()}`,
          name: `Color=${Color}`,
          properties: { Color },
          sourceRef: anatomy,
          sourceGeometry: {
            fontSize,
            separatorBoxSide: side,
            separatorBorder: border,
            rotationDegrees: 45,
            marginStart: left,
            marginEnd: right,
            inkViewport: round(viewport),
          },
          tree: {
            type: 'FRAME',
            id: 'root',
            name: `mg-breadcrumb${Color === 'White' ? ' mg-breadcrumb--white' : ''}`,
            fill: null,
            layout: {
              mode: 'HORIZONTAL',
              width: 'HUG',
              height: 'HUG',
              align: 'CENTER',
              padding: { block: 'spacing/100', inline: 0 },
              clipsContent: false,
            },
            children,
          },
        };
      }),
    },
  ];
}
module.exports = { buildBreadcrumbRecipes };
