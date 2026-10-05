/** Bounded continuous Range drawings. Browser geometry and native acceptance are pending. */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function buildRangeRecipes({ root, modes, variables, styles }) {
  const scss = 'stories/Components/Forms/Range/range.scss';
  const jsx = 'stories/Components/Forms/Range/Range.jsx';
  const read = file => fs.readFileSync(path.join(root, file), 'utf8');
  const fail = message => {
    throw new Error(`Figma Range recipe needs updating: ${message}`);
  };
  if (
    !Array.isArray(modes) ||
    modes
      .map(mode => mode.id)
      .sort()
      .join(',') !== 'delta,irp,mcr,preventionweb,undrr'
  )
    fail('Expected the five distinct source brand modes');
  const clean = text =>
    text
      .replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  for (const [file, expected] of [
    [scss, '162fbb8a69a4c841b86375b6eafb8d0c57c34fa668295d1c4c10997635b33296'],
    [jsx, '48b3e13fc4275abd1528c54db23feb19ed423c4e40122927c3cacd964e0ba247'],
  ]) {
    if (
      crypto
        .createHash('sha256')
        .update(clean(read(file)))
        .digest('hex') !== expected
    )
      fail(
        `${file} anatomy or treatment changed; remeasure the browser baseline`
      );
  }
  const source = (file, pattern) => {
    const text = read(file),
      match = pattern.exec(text);
    if (!match) fail(`${file} no longer matches ${pattern}`);
    return { file, line: text.slice(0, match.index).split('\n').length };
  };
  const anatomy = source(jsx, /<input\s+type="range"/);
  const thumbRef = source(scss, /@mixin mg-range-thumb \{/);
  const trackRef = source(scss, /@mixin mg-range-track \{/);
  source('stories/assets/scss/_variables.scss', /\$mg-html-font-size: 16;/);
  source(
    'stories/assets/scss/_foundational.scss',
    /\*,\s*\*::before,\s*\*::after \{\s*box-sizing: border-box;/
  );
  const thumb = Number(read(scss).match(/block-size: ([\d.]+)rem;/)[1]) * 16;
  const border = Number(read(scss).match(/border: (\d+)px solid/)[1]);
  const track = Number(read(scss).match(/block-size: (\d+)px;/)[1]);
  const byName = new Map(variables.map(v => [v.name, v]));
  for (const name of [
    'color/interactive',
    'color/neutral-0',
    'color/neutral-200',
    'color/neutral-300',
    'color/neutral-400',
  ]) {
    const entries = variables.filter(
      v => v.name === name && v.type === 'COLOR'
    );
    if (
      entries.length !== 1 ||
      modes.some(mode => entries[0].values[mode.id] == null)
    )
      fail(`Missing or ambiguous all-brand COLOR ${name}`);
  }
  if (
    !byName.has('spacing/200') ||
    modes.some(
      mode => !Number.isFinite(byName.get('spacing/200').values[mode.id])
    )
  )
    fail('Missing numeric all-brand spacing/200');
  function upsert(array, entry, key) {
    const i = array.findIndex(v => v[key] === entry[key]);
    if (i >= 0 && array[i].id !== entry.id)
      fail(`Foreign identity at ${entry[key]}`);
    if (i < 0) array.push(entry);
    else array[i] = entry;
    return entry;
  }
  function number(
    name,
    value,
    sourceRef,
    description,
    scopes = ['WIDTH_HEIGHT']
  ) {
    const full = `component/range/${name}`;
    upsert(
      variables,
      {
        id: `component.range.${name}`,
        name: full,
        type: 'FLOAT',
        sourceRef,
        description,
        scopes,
        hiddenFromPublishing: false,
        codeSyntax: {},
        values: Object.fromEntries(modes.map(mode => [mode.id, value])),
      },
      'name'
    );
    return full;
  }
  const thumbSize = number(
    'thumb-size',
    thumb,
    thumbRef,
    'Authored 1.5rem thumb at the guarded 16px source root.'
  );
  const stroke = number(
    'thumb-border',
    border,
    thumbRef,
    'Authored 2px thumb border.',
    ['STROKE_FLOAT']
  );
  const trackSize = number(
    'track-size',
    track,
    trackRef,
    'Authored 4px rail block size.'
  );
  const radius = number(
    'track-radius',
    999,
    trackRef,
    'Authored 999px rail corner radius.',
    ['CORNER_RADIUS']
  );
  const shadowId = 'range.thumb-shadow';
  upsert(
    styles.effect,
    {
      id: shadowId,
      name: 'Mangrove/Range/thumb-shadow',
      sourceRef: thumbRef,
      description:
        'Source 0 1px 3px rgb(0 0 0 / 0.3) thumb shadow; native rasterisation pending.',
      values: Object.fromEntries(
        modes.map(mode => [
          mode.id,
          [
            {
              effect: {
                type: 'DROP_SHADOW',
                color: { r: 0, g: 0, b: 0, a: 0.3 },
                offset: { x: 0, y: 1 },
                radius: 3,
                spread: 0,
                visible: true,
                blendMode: 'NORMAL',
              },
            },
          ],
        ])
      ),
    },
    'id'
  );
  const variants = [];
  for (const width of [240, 390]) {
    const widthRole = number(
      `width-${width}`,
      width,
      anatomy,
      `Explicit ${width}px review allocation. Source inline-size:100% has no fixed-width token.`
    );
    for (const State of ['Default', 'Disabled']) {
      const disabled = State === 'Disabled';
      const id = `range.continuous.midpoint.${width}.${State.toLowerCase()}`;
      variants.push({
        id,
        name: `Width=${width}, State=${State}`,
        properties: { Width: String(width), State },
        sourceRef: anatomy,
        sourceGeometry: {
          min: 0,
          max: 100,
          value: 50,
          valueFraction: 0.5,
          thumbDiameter: thumb,
          trackHeight: track,
          borderWidth: border,
          thumbX: (width - thumb) / 2,
          trackY: (thumb - track) / 2,
          derivation:
            'Continuous story midpoint with centred candidate rail/thumb drawing. Width and vertical box geometry require browser/native acceptance.',
        },
        tree: {
          type: 'FRAME',
          id: 'root',
          name: 'mg-range-wrapper',
          fill: null,
          stroke: null,
          layout: {
            mode: 'VERTICAL',
            width: widthRole,
            height: 'HUG',
            padding: { block: 'spacing/200', inline: 0 },
            clipsContent: false,
          },
          children: [
            {
              type: 'FRAME',
              id: 'input-drawing',
              name: 'mg-range (static continuous midpoint)',
              fill: null,
              stroke: null,
              layout: {
                mode: 'NONE',
                width: widthRole,
                height: thumbSize,
                clipsContent: false,
              },
              children: [
                {
                  type: 'FRAME',
                  id: 'track',
                  name: 'Source unfilled rail',
                  fill: disabled ? 'color/neutral-200' : 'color/neutral-300',
                  stroke: null,
                  bindings: { cornerRadius: radius },
                  layout: {
                    mode: 'NONE',
                    width: widthRole,
                    height: trackSize,
                    clipsContent: false,
                  },
                  position: { x: 0, y: (thumb - track) / 2 },
                  children: [],
                },
                {
                  type: 'FRAME',
                  id: 'thumb-slot',
                  name: 'Fixed midpoint thumb allocation',
                  fill: null,
                  stroke: null,
                  layout: {
                    mode: 'NONE',
                    width: thumbSize,
                    height: thumbSize,
                    clipsContent: false,
                  },
                  position: { x: (width - thumb) / 2, y: 0 },
                  children: [
                    {
                      type: 'ELLIPSE',
                      id: 'thumb',
                      name: 'Source thumb',
                      fill: disabled
                        ? 'color/neutral-400'
                        : 'color/interactive',
                      stroke: disabled
                        ? 'color/neutral-200'
                        : 'color/neutral-0',
                      strokeAlign: 'INSIDE',
                      bindings: { strokeWeight: stroke },
                      effectStyle: disabled ? null : shadowId,
                      layout: { width: thumbSize, height: thumbSize },
                    },
                  ],
                },
              ],
            },
          ],
        },
      });
    }
  }
  return [
    {
      id: 'range',
      name: 'Mangrove/Range',
      kind: 'component-set',
      sourceRef: anatomy,
      description:
        'Four fixed static continuous midpoint drawings from the Default and Disabled source stories. No label or selected-value prose is added: those belong to the story wrapper, not Range.',
      review: { genericLabels: false, preserveVariantSizing: true },
      limitations: [
        'Source-only scaffold. Browser/native visual comparison, ordinary native repeats, publication and consumer acceptance remain pending.',
        '240px/390px widths and a centred 24px thumb box are explicit drawing contracts, not measured browser input geometry. Source vertical margins are represented as root padding; CSS margin collapse and browser input defaults are not reproduced.',
        'Only continuous min=0, max=100, value=50 Default and Disabled presets. No editable value, progress fill, drag, keyboard behaviour, min/max/step or programmatic value calculation.',
        'Stepped labels, endpoint positions, Hover scale, FocusVisible ring, reduced motion, forced colours, RTL and arbitrary resizing are excluded until separately measured.',
        'Native ellipse border/shadow rasterisation is unverified. Accessible naming, announcements and form submission remain code responsibilities.',
      ],
      variants,
    },
  ];
}
module.exports = { buildRangeRecipes };
