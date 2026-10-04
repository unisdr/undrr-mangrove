/** Source-owned seven-shape StatusLabel. Native acceptance remains pending. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function buildStatusLabelRecipes({ root, modes, variables, styles }) {
  const scss = 'stories/Atom/StatusLabel/status-label.scss';
  const story = 'stories/Atom/StatusLabel/StatusLabel.stories.jsx';
  const rolesFile = 'stories/assets/scss/_variables.scss';
  const read = file => fs.readFileSync(path.join(root, file), 'utf8');
  const fail = message => {
    throw new Error(`Figma StatusLabel recipe needs updating: ${message}`);
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
  const text = read(scss);
  const hash = crypto.createHash('sha256').update(clean(text)).digest('hex');
  // Conservative guard includes every authored status, ring, forced-colour and
  // print/group declaration. Comments and formatting alone do not invalidate it.
  if (
    hash !== '6ed7d106eca224e73f1202875baf4fe1b625d182fe18cb83ec5f3afde31bb650'
  )
    fail('Complete StatusLabel stylesheet changed; remeasure its source');
  const anatomy = source(
    story,
    /const Label = \(\{ modifier, label \}\) => \([\s\S]*?<span className="mg-status-label__indicator" \/>\s*\{label\}\s*<\/span>\s*\);/
  );
  const labelFunction = read(story).match(/const Label = [\s\S]*?\n\);/)?.[0];
  if (
    crypto
      .createHash('sha256')
      .update(clean(labelFunction || ''))
      .digest('hex') !==
    '0b60e2c5c45db339a301398d9fae3e2b656744baa24288065e8da7179433dc5f'
  )
    fail('Story Label markup/modifier/name contract changed');
  source(
    story,
    /render: \(\) => <Label modifier="published" label="Published" \/>/
  );
  source(rolesFile, /\$mg-html-font-size: 16;/);
  source(
    rolesFile,
    /@function mg-rem\(\$px\) \{\s*@return math.div\(\$px, \$mg-html-font-size\) \* 1rem;\s*\}/
  );
  source(
    'stories/assets/fonts/roboto/sass/_Regular.scss',
    /font-family: Roboto;[\s\S]*?font-weight: 400;\s*font-style: normal;/
  );
  source('stories/assets/fonts/roboto/roboto.scss', /@import "sass\/Regular";/);
  const status = [
    ['Neutral', 'neutral', 'Archived', 'neutral-100'],
    ['Draft', 'draft', 'Draft', 'accent-100'],
    [
      'WaitingInformation',
      'waiting-information',
      'Waiting for more information',
      'accent-600',
    ],
    [
      'WaitingValidation',
      'waiting-validation',
      'Waiting for validation',
      'accent-500',
    ],
    ['Published', 'published', 'Published', 'accent-400'],
    ['Warning', 'warning', 'Degraded', 'gold-800'],
    ['Negative', 'negative', 'Offline', 'red-900'],
  ];
  for (const [, , label] of status)
    source(story, new RegExp(`(?:label: |label=)["']${label}["']`));
  const byName = new Map(variables.map(v => [v.name, v]));
  function resolve(name, mode, seen = new Set()) {
    if (seen.has(name)) fail(`Circular alias ${name}`);
    seen.add(name);
    const entry = byName.get(name)?.values[mode.id];
    if (entry == null) fail(`Missing role ${name}/${mode.id}`);
    return entry.alias ? resolve(entry.alias, mode, seen) : entry;
  }
  function upsert(array, entry, key) {
    const index = array.findIndex(v => v[key] === entry[key]);
    if (index >= 0 && array[index].id !== entry.id)
      fail(`Foreign identity at ${entry[key]}`);
    if (index < 0) array.push(entry);
    else array[index] = entry;
    return entry;
  }
  function role(name, type, values, scopes, sourceRef, css, description) {
    const full = `status-label/${name}`;
    const entry = upsert(
      variables,
      {
        id: full.replaceAll('/', '.'),
        name: full,
        type,
        scopes,
        hiddenFromPublishing: false,
        sourceRef,
        codeSyntax: css ? { WEB: css } : {},
        description,
        values: Object.fromEntries(
          modes.map(mode => [
            mode.id,
            typeof values === 'function' ? values(mode) : values,
          ])
        ),
      },
      'name'
    );
    byName.set(full, entry);
    return full;
  }
  function alias(name, type, target, scopes, css) {
    const ref = source(
      rolesFile,
      new RegExp(
        `${css}:\\s*(?:rgb\\(\\s*)?var\\(--mg-${target.replaceAll('/', '-')}\\)\\s*\\)?;`
      )
    );
    if (
      variables.filter(v => v.name === target && v.type === type).length !== 1
    )
      fail(`Missing or ambiguous ${type} ${target}`);
    return role(
      name,
      type,
      { alias: target },
      scopes,
      ref,
      css,
      `Direct source role alias to ${target}.`
    );
  }
  const gap = alias(
    'gap',
    'FLOAT',
    'spacing/75',
    ['GAP'],
    '--mg-status-label-gap'
  );
  const fontSize = alias(
    'font-size',
    'FLOAT',
    'font-size/300',
    ['FONT_SIZE'],
    '--mg-status-label-font-size'
  );
  const color = alias(
    'color',
    'COLOR',
    'color/text',
    ['TEXT_FILL'],
    '--mg-status-label-color'
  );
  const ringColor = alias(
    'indicator-border-color',
    'COLOR',
    'color/neutral-500',
    ['SHAPE_FILL', 'STROKE_COLOR'],
    '--mg-status-label-indicator-border-color'
  );
  const S = Number(
    source(rolesFile, /--mg-status-label-indicator-size: #\{mg-rem\(14\)\};/) &&
      14
  );
  const R = Number(
    source(rolesFile, /--mg-status-label-indicator-border-width: 1px;/) && 1
  );
  const size = role(
    'indicator-size',
    'FLOAT',
    S,
    ['WIDTH_HEIGHT'],
    source(rolesFile, /--mg-status-label-indicator-size:/),
    '--mg-status-label-indicator-size',
    'Source14px rem-converted size under guarded16px root.'
  );
  const ring = role(
    'indicator-border-width',
    'FLOAT',
    R,
    ['STROKE_FLOAT'],
    source(rolesFile, /--mg-status-label-indicator-border-width:/),
    '--mg-status-label-indicator-border-width',
    'Public source1px inward border width.'
  );
  source(rolesFile, /--mg-status-label-indicator-radius: 50%;/);
  const cornerRatio = Number(
    text.match(/\$mg-status-label-corner:\s*([\d.]+);/)[1]
  );
  const corner = role(
    'geometry/corner',
    'FLOAT',
    S * cornerRatio,
    ['CORNER_RADIUS'],
    source(scss, /\$mg-status-label-corner:/),
    null,
    'Source softened corner fraction0.13 multiplied by14px indicator size.'
  );
  const fills = new Map();
  for (const [, slug, , palette] of status) {
    const css = `--mg-status-label-indicator${slug === 'neutral' ? '' : '--' + slug}`;
    fills.set(
      slug,
      alias(
        `indicator/${slug}`,
        'COLOR',
        `color/${palette}`,
        ['SHAPE_FILL'],
        css
      )
    );
  }
  const number = (slug, name, n, scope = 'WIDTH_HEIGHT') =>
    role(
      `geometry/${slug}/${name}`,
      'FLOAT',
      Number(n.toFixed(8)),
      [scope],
      source(scss, new RegExp(`\\.mg-status-label--${slug} `)),
      null,
      'Derived from guarded source optical scale/14px allocation; browser subpixel rounding is evidence only.'
    );
  function dimensions(slug, clipped = false) {
    const block = text.slice(text.indexOf(`.mg-status-label--${slug} `));
    const match = clipped
      ? /@include mg-status-label-shape\([\s\S]*?,\s*([\d.]+)\s*\);/.exec(block)
      : /@include mg-status-label-indicator-size\(([\d.]+)(?:,\s*([\d.]+))?\);/.exec(
          block
        );
    if (!match) fail(`Missing ${slug} optical scale`);
    return [S * Number(match[1]), S * Number(match[2] || match[1])];
  }
  const dims = {
    neutral: [S, S],
    published: [S, S],
    draft: dimensions('draft'),
    'waiting-information': dimensions('waiting-information'),
    'waiting-validation': dimensions('waiting-validation'),
    warning: dimensions('warning', true),
    negative: dimensions('negative', true),
  };
  function polygon(name) {
    const outerText = text.match(
      new RegExp(`\\$mg-status-label-${name}: polygon\\(([\\s\\S]*?)\\);`)
    )[1];
    const outer = [...outerText.matchAll(/([\d.]+)%\s+([\d.]+)%/g)].map(m => [
      +m[1],
      +m[2],
    ]);
    const innerText = text.match(
      new RegExp(`\\$mg-status-label-${name}-inner: polygon\\(([\\s\\S]*?)\\);`)
    )[1];
    const terms = [
      ...innerText.matchAll(
        /calc\(([\d.]+)%\s*([+-])\s*([\d.]+)\s*\*\s*#\{\$mg-status-label-ring\}\)/g
      ),
    ].map(m => ({
      base: +m[1],
      coefficient: (m[2] === '-' ? -1 : 1) * m[3],
    }));
    if (terms.length !== outer.length * 2)
      fail(`Invalid ${name} inner geometry`);
    // Independent source-test algorithm, not a second hard-coded polygon copy.
    for (let i = 0; i < outer.length; i++) {
      const prev = outer[(i + outer.length - 1) % outer.length],
        p = outer[i],
        next = outer[(i + 1) % outer.length];
      const normal = (a, b) => {
        const dx = b[0] - a[0],
          dy = b[1] - a[1],
          l = Math.hypot(dx, dy);
        return [-dy / l, dx / l];
      };
      const a = normal(prev, p),
        b = normal(p, next),
        den = 1 + a[0] * b[0] + a[1] * b[1];
      for (let axis = 0; axis < 2; axis++)
        if (
          terms[2 * i + axis].base !== p[axis] ||
          Math.abs(
            terms[2 * i + axis].coefficient - (a[axis] + b[axis]) / den
          ) > 1e-5
        )
          fail(
            `${name} inner polygon no longer offsets every edge by the ring`
          );
    }
    return {
      outer,
      offsets: outer.map((_, i) => [
        terms[2 * i].coefficient,
        terms[2 * i + 1].coefficient,
      ]),
    };
  }
  const polygons = {
    warning: polygon('triangle'),
    negative: polygon('octagon'),
  };
  for (const mode of modes)
    if (
      resolve('font-family/text', mode) !== 'Roboto' ||
      resolve(fontSize, mode) !== 16 ||
      resolve(gap, mode) !== 7.5
    )
      fail(`Measured Latin source font/size/gap changed in ${mode.id}`);
  const labelStyle = 'component.status-label.label';
  upsert(
    styles.text,
    {
      id: labelStyle,
      name: 'Mangrove/component/status-label/label',
      type: 'TEXT',
      recommended: false,
      sourceRef: source(scss, /font-family: var\(--mg-font-family-text\);/),
      description:
        'Source Latin Roboto Regular400,16px and own-size line-height1.5. Actual CDP confirms Roboto-Regular; native font-file equality and edited wrapping remain pending.',
      typography: {
        fontWeightRequested: 400,
        fontWeightBundled: 400,
        fontStyleBundled: 'Regular',
        lineHeightRatio: 1.5,
        lineHeightBasis: 'own-font-size',
        fontMatchRationale:
          'Actual source browser reports custom Roboto-Regular; no substitution.',
        verification: 'Isolated source UNDRR Latin verified; native pending.',
      },
      bindings: { fontFamily: 'font-family/text', fontSize },
      values: Object.fromEntries(
        modes.map(mode => [
          mode.id,
          {
            fontName: {
              family: resolve('font-family/text', mode),
              style: 'Regular',
            },
            fontSize: resolve(fontSize, mode),
            lineHeight: { unit: 'PERCENT', value: 150 },
            textDecoration: 'NONE',
            textWrapStyle: 'AUTO',
          },
        ])
      ),
    },
    'id'
  );
  const round = n => Number(n.toFixed(8));
  function svg(slug, layer, side, markup, fill, stroke, position) {
    return {
      type: 'SVG',
      id: layer,
      name: `${slug} / source ${layer}`,
      layout: { width: round(side), height: round(side) },
      position,
      svg: {
        assetId: `status-label-${slug}-${layer}`,
        markup: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${round(side)} ${round(side)}">${markup}</svg>`,
        monochrome: {
          ...(fill ? { fills: fill } : {}),
          ...(stroke ? { strokes: stroke } : {}),
        },
      },
    };
  }
  const variants = status.map(([Status, slug, sourceLabel]) => {
    const [w, h] = dims[slug],
      x = round((S - w) / 2),
      y = round((S - h) / 2),
      fill = fills.get(slug);
    let shape;
    if (slug === 'neutral' || slug === 'published')
      shape = [
        {
          type: 'ELLIPSE',
          id: 'indicator',
          name: 'Circular source indicator',
          fill,
          stroke: ringColor,
          bindings: { strokeWeight: ring },
          layout: { width: size, height: size },
          position: { x: 0, y: 0 },
        },
      ];
    else if (slug === 'draft' || slug === 'waiting-information')
      shape = [
        {
          type: 'FRAME',
          id: 'indicator',
          name: 'Rounded source indicator',
          fill,
          stroke: ringColor,
          bindings: {
            strokeWeight: ring,
            cornerRadius: slug === 'draft' ? corner : size,
          },
          layout: {
            mode: 'NONE',
            width: number(slug, 'width', w),
            height: number(slug, 'height', h),
            clipsContent: false,
          },
          position: { x, y },
          children: [],
        },
      ];
    else if (slug === 'waiting-validation') {
      // One source ring width of transparent padding outside its rotated AABB.
      const side = Math.ceil(w * Math.SQRT2) + 2 * R,
        mid = side / 2,
        inset = (side - w) / 2 + R / 2;
      shape = [
        svg(
          slug,
          'diamond',
          side,
          `<rect x="${round(inset)}" y="${round(inset)}" width="${round(w - R)}" height="${round(h - R)}" rx="${round(S * cornerRatio - R / 2)}" fill="#000000" stroke="#666666" stroke-width="${R}" transform="rotate(45 ${mid} ${mid})"/>`,
          fill,
          ringColor,
          { x: (S - side) / 2, y: (S - side) / 2 }
        ),
      ];
    } else {
      const geometry = polygons[slug],
        outer = geometry.outer.map(([a, b]) => [(w * a) / 100, (h * b) / 100]),
        inner = outer.map((p, i) =>
          p.map((n, axis) => n + geometry.offsets[i][axis] * R)
        );
      const markup = points =>
        `<polygon points="${points.map(p => p.map(round).join(',')).join(' ')}" fill="#000000"/>`;
      shape = [
        svg(slug, 'outer-ring', w, markup(outer), ringColor, null, { x, y }),
        svg(slug, 'inner-fill', w, markup(inner), fill, null, { x, y }),
      ];
    }
    return {
      id: `status-label.${slug}`,
      name: `Status=${Status}`,
      properties: { Status },
      sourceRef: anatomy,
      sourceLabel,
      sourceGeometry: {
        indicatorSize: S,
        shapeWidth: round(w),
        shapeHeight: round(h),
        marginInline: x,
        cornerRatio,
        ringWidth: R,
        rotationDegrees: slug === 'waiting-validation' ? 45 : 0,
        polygon: polygons[slug] ?? null,
        derivation:
          'Guarded SCSS geometry. SVG markup is generated from the source, not an existing icon asset; native viewport/pixel acceptance pending.',
      },
      tree: {
        type: 'FRAME',
        id: 'root',
        name:
          slug === 'neutral'
            ? 'mg-status-label'
            : `mg-status-label mg-status-label--${slug}`,
        fill: null,
        stroke: null,
        layout: {
          mode: 'HORIZONTAL',
          width: 'HUG',
          height: 'HUG',
          align: 'CENTER',
          gap,
          clipsContent: false,
        },
        children: [
          {
            type: 'FRAME',
            id: 'slot',
            name: '14px source indicator allocation',
            fill: null,
            stroke: null,
            layout: {
              mode:
                slug === 'draft' || slug === 'waiting-information'
                  ? 'HORIZONTAL'
                  : 'NONE',
              justify: 'CENTER',
              align: 'CENTER',
              width: size,
              height: size,
              clipsContent: false,
            },
            children: shape,
          },
          {
            type: 'TEXT',
            id: 'label',
            name: 'Status name',
            characters: 'Published',
            textProperty: 'Label',
            textStyle: labelStyle,
            textDecoration: 'NONE',
            textWrap: 'AUTO',
            fill: color,
            stroke: null,
            layout: { width: 'HUG', height: 'HUG' },
          },
        ],
      },
    };
  });
  return [
    {
      id: 'status-label',
      name: 'Mangrove/Status label',
      kind: 'component-set',
      sourceRef: anatomy,
      description:
        'All seven authored non-interactive status geometries with one required editable Label. Published is the stable shared property default matching the source Default story; source names are seeded only on fresh review specimens. Status changes the indicator; Label remains independent editable text, with no automatic name synchronization.',
      limitations: [
        'Intrinsic masters only. Native finite-width edited-label wrapping/overflow and automatic CSS min-content sizing are unverified.',
        'Circle/radii/ring, rounded diamond SVG and both exact polygon contours require native/source pixel and viewport acceptance.',
        'SVG geometry is source-derived at build time and cannot bind every vertex to public size/ring roles. Rebuild after source geometry changes; arbitrary native scaling is not responsive CSS.',
        'Grouped LI baseline/wrapping and table/dense/RTL/forced-colour/print contexts are not implemented by these standalone masters. Arabic font availability and native script routing are unverified.',
        'No Hover/Focus/Disabled/Selected variant: source SPAN is non-focusable and has no authored interactive treatment.',
      ],
      review: {
        genericLabels: false,
        preserveVariantSizing: true,
        specimens: status.map(([Status, slug, label]) => ({
          id: `source-${slug}`,
          name: `Source ${label}`,
          variant: { Status },
          width: 390,
          properties: { Label: label },
        })),
      },
      variants,
    },
  ];
}
module.exports = { buildStatusLabelRecipes };
