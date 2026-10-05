/** Source-owned seven-shape StatusLabel. Native acceptance remains pending. */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
function buildStatusLabelAssets({ root, modes, variables, styles }) {
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
    return {
      file,
      line: text.slice(0, match.index).split('\n').length,
    };
  };
  const text = read(scss);
  const hash = crypto.createHash('sha256').update(clean(text)).digest('hex');
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
        codeSyntax: css
          ? {
              WEB: css,
            }
          : {},
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
      {
        alias: target,
      },
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
      bindings: {
        fontFamily: 'font-family/text',
        fontSize,
      },
      values: Object.fromEntries(
        modes.map(mode => [
          mode.id,
          {
            fontName: {
              family: resolve('font-family/text', mode),
              style: 'Regular',
            },
            fontSize: resolve(fontSize, mode),
            lineHeight: {
              unit: 'PERCENT',
              value: 150,
            },
            textDecoration: 'NONE',
            textWrapStyle: 'AUTO',
          },
        ])
      ),
    },
    'id'
  );
  for (const [, slug] of status) {
    if (slug === 'draft' || slug === 'waiting-information') {
      number(slug, 'width', dims[slug][0]);
      number(slug, 'height', dims[slug][1]);
    }
  }
  return {
    scss,
    story,
    rolesFile,
    read,
    fail,
    clean,
    source,
    text,
    hash,
    anatomy,
    labelFunction,
    status,
    byName,
    resolve,
    upsert,
    role,
    alias,
    gap,
    fontSize,
    color,
    ringColor,
    S,
    R,
    size,
    ring,
    cornerRatio,
    corner,
    fills,
    number,
    dimensions,
    dims,
    polygon,
    polygons,
    labelStyle,
  };
}
module.exports = {
  buildStatusLabelAssets,
};
