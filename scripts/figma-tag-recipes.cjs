/** Experimental source-only static Tag recipes. No native acceptance is implied. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function buildTagRecipes({ root, modes, variables, styles }) {
  const scss = 'stories/Atom/Tag/tag.scss';
  const story = 'stories/Atom/Tag/Tag.stories.jsx';
  const read = file => fs.readFileSync(path.join(root, file), 'utf8');
  const fail = message => {
    throw new Error(`Figma Tag recipe needs updating: ${message}`);
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
  if (
    crypto
      .createHash('sha256')
      .update(clean(read(scss)))
      .digest('hex') !==
    '0a7548d9860912217a4e9ca183e3aedaa3720427ca5113023770979eb79f165d'
  )
    fail('Complete Tag stylesheet changed; review the bounded contract');
  const sourceRef = source(
    story,
    /export const Default = \{[\s\S]*?<span className="mg-tag">Organization<\/span>[\s\S]*?\n\};/
  );
  if (
    !read(story)
      .match(/export const Default = \{[\s\S]*?\n\};/)?.[0]
      .includes('<span className="mg-tag">Organization</span>')
  )
    fail('Default static story markup changed');
  const variants = [
    ['Default', '', 'Organization', 'color/tag', 'color/neutral-0', null],
    [
      'Secondary',
      'secondary',
      'Metadata',
      'color/tag-secondary',
      'color/neutral-0',
      null,
    ],
    ['Outline', 'outline', 'Subtle', null, 'color/tag', 'color/tag'],
    [
      'Accent',
      'accent',
      'Featured',
      'color/orange-50',
      'color/text',
      'color/tag-accent',
    ],
    [
      'Subtle',
      'subtle',
      'Reference',
      'color/neutral-50',
      'color/neutral-800',
      'color/neutral-300',
    ],
  ];
  for (const [, slug, label] of variants)
    source(
      story,
      new RegExp(
        `<span className="mg-tag${slug ? ' mg-tag--' + slug : ''}">${label}<\\/span>`
      )
    );
  const rolesFile = 'stories/assets/scss/_variables.scss';
  source(rolesFile, /\$mg-html-font-size: 16;/);
  source(
    rolesFile,
    /@function mg-rem\(\$px\) \{\s*@return math.div\(\$px, \$mg-html-font-size\) \* 1rem;\s*\}/
  );
  // CSS font matching for a requested 500 searches 400 before weights above500.
  // Guard the complete normal-face inventory instead of inventing Medium500.
  const fontFile =
    'stories/assets/fonts/roboto-condensed/roboto-condensed.scss';
  if (
    clean(read(fontFile)) !==
    clean(
      '@import "sass/variables"; @import "sass/mixins"; @import "sass/Light"; @import "sass/LightItalic"; @import "sass/Regular"; @import "sass/Italic"; @import "sass/Bold"; @import "sass/BoldItalic";'
    )
  )
    fail('Condensed font inventory changed; reassess requested500 matching');
  for (const [face, weight] of [
    ['Light', 300],
    ['Regular', 400],
    ['Bold', 700],
  ])
    source(
      `stories/assets/fonts/roboto-condensed/sass/_${face}.scss`,
      new RegExp(
        `font-family: "Roboto Condensed";[\\s\\S]*?fontdef\\([^;]+"${face}"\\);\\s*font-weight: ${weight};\\s*font-style: normal;`
      )
    );
  const byName = new Map(variables.map(v => [v.name, v]));
  function resolve(name, mode, type, seen = new Set()) {
    const entry = byName.get(name);
    if (!entry || entry.type !== type || seen.has(name))
      fail(`Missing, wrong-type or circular role ${name}`);
    seen.add(name);
    const value = entry.values[mode.id];
    if (value == null) fail(`Missing ${name}/${mode.id}`);
    return value.alias ? resolve(value.alias, mode, type, seen) : value;
  }
  function upsert(array, entry, key) {
    const matches = array.filter(v => v[key] === entry[key]);
    if (matches.length > 1 || (matches.length && matches[0].id !== entry.id))
      fail(`Foreign or duplicate identity ${entry[key]}`);
    const index = array.findIndex(v => v[key] === entry[key]);
    if (index < 0) array.push(entry);
    else array[index] = entry;
    return entry;
  }
  function role(name, type, value, scopes, ref, css) {
    const full = `tag/${name}`;
    const entry = upsert(
      variables,
      {
        id: full.replaceAll('/', '.'),
        name: full,
        type,
        scopes,
        hiddenFromPublishing: false,
        sourceRef: ref,
        description:
          'Experimental static Tag source role; native acceptance pending.',
        codeSyntax: css ? { WEB: css } : {},
        values: Object.fromEntries(modes.map(m => [m.id, value])),
      },
      'name'
    );
    byName.set(full, entry);
    return full;
  }
  const minHeight = role(
    'min-height',
    'FLOAT',
    28,
    ['WIDTH_HEIGHT'],
    source(scss, /min-block-size: mg-rem\(28\);/),
    'min-block-size: 1.75rem'
  );
  const minWidth = role(
    'min-width',
    'FLOAT',
    24,
    ['WIDTH_HEIGHT'],
    source(scss, /min-inline-size: mg-rem\(24\);/),
    'min-inline-size: 1.5rem'
  );
  const border = role(
    'border-width',
    'FLOAT',
    1,
    ['STROKE_FLOAT'],
    source(scss, /border: 1px solid transparent;/),
    'border-width: 1px'
  );
  const accentEdge = role(
    'accent-edge-width',
    'FLOAT',
    4,
    ['STROKE_FLOAT'],
    source(scss, /border-inline-start-width: mg-rem\(4\);/),
    'border-inline-start-width: 0.25rem'
  );
  const transparent = role(
    'transparent',
    'COLOR',
    { r: 0, g: 0, b: 0, a: 0 },
    ['SHAPE_FILL', 'STROKE_COLOR'],
    source(scss, /border: 1px solid transparent;/),
    'transparent'
  );
  for (const mode of modes) {
    for (const name of new Set(
      variants.flatMap(v => v.slice(3)).filter(Boolean)
    ))
      resolve(name, mode, 'COLOR');
    if (resolve('font-family/ui', mode, 'STRING') !== 'Roboto Condensed')
      fail(`Latin UI family changed in ${mode.id}`);
    for (const [name, expected] of [
      ['font-size/250', 14],
      ['spacing/25', 2.5],
      ['spacing/100', 10],
    ])
      if (resolve(name, mode, 'FLOAT') !== expected)
        fail(`Source typography/padding changed: ${name}/${mode.id}`);
    resolve('radius/tag', mode, 'FLOAT');
  }
  const textStyle = 'component.tag.label';
  upsert(
    styles.text,
    {
      id: textStyle,
      name: 'Mangrove/component/tag/label',
      type: 'TEXT',
      recommended: false,
      sourceRef: source(scss, /font-family: var\(--mg-font-family-ui\);/),
      description:
        'Experimental Latin UI label. CSS requested500 resolves bundled Condensed Regular400 by font matching; browser/native font-file confirmation pending.',
      typography: {
        fontWeightRequested: 500,
        fontWeightBundled: 400,
        fontStyleBundled: 'Regular',
        lineHeightRatio: 1.5,
        lineHeightBasis: 'own-font-size',
        fontMatchRationale:
          'Guarded normal-face inventory300/400/700; CSS weight matching at500 searches400 before700.',
        verification:
          'Source contract only; browser/native font confirmation pending.',
      },
      bindings: { fontFamily: 'font-family/ui', fontSize: 'font-size/250' },
      values: Object.fromEntries(
        modes.map(m => [
          m.id,
          {
            fontName: {
              family: resolve('font-family/ui', m, 'STRING'),
              style: 'Regular',
            },
            fontSize: resolve('font-size/250', m, 'FLOAT'),
            lineHeight: { unit: 'PERCENT', value: 150 },
            textDecoration: 'NONE',
            textWrapStyle: 'AUTO',
          },
        ])
      ),
    },
    'id'
  );
  return [
    {
      id: 'tag',
      name: 'Mangrove/Tag',
      kind: 'component-set',
      sourceRef,
      description:
        'Experimental five-tone static taxonomy metadata with editable Label. Intrinsic Latin-only masters; no interactive state claims.',
      limitations: [
        'Source-only experimental preparation, excluded from core and maintenance merge. Native import/repeat, publication, consumer uptake and pixel acceptance are unverified.',
        'Only static SPAN metadata. Linked Hover/Focus, combined modifiers, code/badge roles, legacy custom-property overrides and grouped container spacing are outside this first contract.',
        'Intrinsic single-line Latin geometry only. CSS max-inline-size/min-content/overflow-wrap behaviour, arbitrary-width edited labels, RTL accent edge, Arabic script routing, forced colours and motion are unverified.',
        'Requested Condensed500 maps to guarded bundled400 by CSS matching. Browser font selection and native font-file equivalence remain pending.',
      ],
      review: {
        genericLabels: false,
        preserveVariantSizing: true,
        specimens: variants.map(([Tone, slug, Label]) => ({
          id: `source-${slug || 'default'}`,
          name: `Source ${Tone}`,
          variant: { Tone },
          width: 320,
          properties: { Label },
        })),
      },
      variants: variants.map(([Tone, slug, , fill, color, stroke]) => ({
        id: `tag.${slug || 'default'}`,
        name: `Tone=${Tone}`,
        properties: { Tone },
        sourceRef,
        tree: {
          type: 'FRAME',
          id: 'root',
          name: `mg-tag${slug ? ' mg-tag--' + slug : ''}`,
          fill,
          stroke: stroke || transparent,
          layout: {
            mode: 'HORIZONTAL',
            width: 'HUG',
            height: 'HUG',
            minWidth,
            minHeight,
            align: 'CENTER',
            clipsContent: false,
          },
          bindings: {
            cornerRadius: 'radius/tag',
            paddingTop: 'spacing/25',
            paddingBottom: 'spacing/25',
            paddingLeft: 'spacing/100',
            paddingRight: 'spacing/100',
            strokeWeight: border,
            ...(slug === 'accent' ? { strokeLeftWeight: accentEdge } : {}),
          },
          children: [
            {
              type: 'TEXT',
              id: 'label',
              name: 'Tag label',
              characters: 'Organization',
              textProperty: 'Label',
              textStyle,
              textDecoration: 'NONE',
              textWrap: 'AUTO',
              fill: color,
              stroke: null,
              layout: { width: 'HUG', height: 'HUG' },
            },
          ],
        },
      })),
    },
  ];
}
module.exports = { buildTagRecipes };
