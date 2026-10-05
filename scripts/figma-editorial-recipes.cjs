/** Isolated editorial source scaffolds. Native and browser acceptance pending. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const SOURCE_HASHES = {
  'stories/Molecules/SectionHeader/SectionHeader.jsx':
    '6a1a71c91b2d118a4b72d11f8c519dd3a6fc69c1c21846191106d87dcc6a0716',
  'stories/Molecules/SectionHeader/section-header.scss':
    'dc4c60950ca7eb0d3261bd83cfb71366c97c4381c1c9e246f6a48f4755413403',
  'stories/Atom/Typography/Heading/Heading.jsx':
    '2c66a95d268803baf3b546a03cdd8bdc7de4ffea747eee6b6aaf5a5da2229d42',
  'stories/Molecules/ImageCaption/ImageCaption.jsx':
    '11c408184b03eadb32a0d55bca84e5b04278ead1dae5b622b67c613bff8a87b6',
  'stories/Molecules/ImageCaption/image-caption.scss':
    '9c4089bc15b415e5a73b5686db78d05488d6eee91fc6fc508e0bcb2b579ae29c',
  'stories/Atom/Images/ImageCredit/ImageCredit.jsx':
    'c53ac4af39ed5465c7635564cdfbe79c3c9ee748cf22fb5114aa7e90f1e1fe36',
  'stories/Atom/Images/ImageCredit/image-credit.scss':
    'aa2006a312c8231663f887a908c6474f7a6d1d3bdf2199f529c7f02a96821e31',
  'stories/Atom/BaseTypography/Paragraph/Paragraph.jsx':
    '1eb7fca0631155e8ef52e32e66cfb1ab47c274ba1569f4332f94e7c813f49cbf',
  'stories/Utilities/EmbedContainer/EmbedContainer.jsx':
    '85612ef865c96e5afb64278a6b099c660623a7bf2ceb8144d9815815a99237dc',
  'stories/Utilities/EmbedContainer/embed-container.scss':
    '214129ed2c30b68e62f0d685b9870919e279169a027d9fe910bf6d91b877f3d8',
  'stories/assets/scss/_foundational.scss':
    '4e307714a1414aa88cc1f4ee49d9e7898a29c84f886c0fb8ef5b96db952278a8',
  'stories/Utilities/Normalize/normalize.scss':
    'f7f1f1a33c5dc6ee0ec63363e239bdecbcda72c8aeebbcf35728666f60a31486',
  'stories/assets/scss/_variables.scss':
    '4536f1412599cf790ecd42ebd6374b6cffd0d66b48f3385988312cf99a93a97a',
  'stories/assets/scss/_mixins.scss':
    '4ad1db924f55d4f6ff7c49ee3decf597f6a9cdb69389998dbd31f9fcb76b30ca',
  'stories/assets/fonts/roboto/roboto.scss':
    'd73ed5fd801c1c73f5214eeda9329a2bd8de0d9e54ee98203d2c4b18b9fbbd79',
  'stories/assets/fonts/roboto/sass/_Regular.scss':
    '0c48417c765b8b1152844d693b3f5a3b9ba9091684de57c82c1ad6d49d49a586',
  'stories/assets/fonts/roboto/sass/_Bold.scss':
    'c1aa277358bad373c99ca9e3dbdeabef4b05841674fd860520b529d10fb37804',
};
function buildEditorialRecipes({ root, modes, variables, styles }) {
  const read = f => fs.readFileSync(path.join(root, f), 'utf8');
  const fail = m => {
    throw new Error(`Figma editorial recipe needs updating: ${m}`);
  };
  const clean = s =>
    s
      .replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  if (
    modes
      .map(m => m.id)
      .sort()
      .join(',') !== 'delta,irp,mcr,preventionweb,undrr'
  )
    fail('Expected five source modes');
  for (const [file, hash] of Object.entries(SOURCE_HASHES))
    if (
      crypto
        .createHash('sha256')
        .update(clean(read(file)))
        .digest('hex') !== hash
    )
      fail(`${file} source contract changed`);
  const ref = (file, needle) => {
    const text = read(file),
      i = text.indexOf(needle);
    if (i < 0) fail(`Missing ${needle}`);
    return { file, line: text.slice(0, i).split('\n').length };
  };
  const refs = {
    header: ref(
      'stories/Molecules/SectionHeader/SectionHeader.jsx',
      'export function SectionHeader'
    ),
    caption: ref(
      'stories/Molecules/ImageCaption/ImageCaption.jsx',
      'export function Imagecaption'
    ),
    embed: ref(
      'stories/Utilities/EmbedContainer/EmbedContainer.jsx',
      'export function EmbedContainer'
    ),
  };
  const byName = new Map(variables.map(v => [v.name, v]));
  const value = (name, mode, type, seen = new Set()) => {
    const v = byName.get(name);
    if (!v || v.type !== type || seen.has(name))
      fail(`Missing/wrong/circular ${name}`);
    seen.add(name);
    const x = v.values[mode.id];
    if (x == null) fail(`Missing ${name}/${mode.id}`);
    return x.alias ? value(x.alias, mode, type, seen) : x;
  };
  const perMode = fn => Object.fromEntries(modes.map(m => [m.id, fn(m)]));
  function upsert(a, e) {
    const matches = a.filter(v => v.id === e.id || v.name === e.name);
    if (
      matches.length > 1 ||
      (matches.length && (matches[0].id !== e.id || matches[0].name !== e.name))
    )
      fail(`Foreign identity ${e.id}`);
    const i = a.findIndex(v => v.id === e.id);
    if (i < 0) a.push(e);
    else a[i] = e;
  }
  for (const m of modes) {
    if (value('font-family/text', m, 'STRING') !== 'Roboto')
      fail(`Unverified Latin face ${m.id}`);
    for (const n of [
      'color/text',
      'color/black',
      'color/neutral-600',
      'color/neutral-500',
    ])
      value(n, m, 'COLOR');
    for (const n of ['100', '150']) value(`spacing/${n}`, m, 'FLOAT');
    for (const n of ['300', '500']) value(`font-size/${n}`, m, 'FLOAT');
  }
  const numbers = {};
  function number(name, n, scopes = ['WIDTH_HEIGHT']) {
    const full = `component/editorial/${name}`;
    upsert(variables, {
      id: full.replaceAll('/', '.'),
      name: full,
      type: 'FLOAT',
      values: perMode(() => n),
      scopes,
      description:
        'Explicit bounded source projection; see family geometry limitations.',
      sourceRef: name.startsWith('embed-')
        ? refs.embed
        : name.startsWith('caption-')
          ? refs.caption
          : refs.header,
      hiddenFromPublishing: false,
      codeSyntax: {},
    });
    numbers[name] = full;
    return full;
  }
  for (const [n, x] of [
    ['header-width', 600],
    ['caption-width', 600],
    ['embed-width', 336],
    ['border-one', 1],
    ['border-two', 2],
  ])
    number(n, x, n.startsWith('border') ? ['STROKE_FLOAT'] : ['WIDTH_HEIGHT']);
  for (const [name, size, weight, lh] of [
    ['heading', '500', 700, 110],
    ['description', '300', 600, 115],
    ['caption', '300', 400, 150],
    ['credit', '300', 400, 140],
  ]) {
    const id = `component.editorial.${name}`;
    upsert(styles.text, {
      id,
      name: `Mangrove/component/editorial/${name}`,
      component: true,
      recommended: false,
      source:
        name === 'caption' || name === 'credit' ? refs.caption : refs.header,
      description: `Source Roboto ${weight}, ${lh}% own-size line height; CSS600 to bundled700 remains candidate.`,
      typography: {
        requestedWeight: weight,
        bundledWeight: weight === 600 ? 700 : weight,
        lineHeightBasis: 'own-font-size',
        verification:
          'Scoped Chromium source600 resolves bundled700; native and otherengine font comparison pending.',
      },
      bindings: {
        fontFamily: 'font-family/text',
        fontSize: `font-size/${size}`,
      },
      values: perMode(m => ({
        fontName: {
          family: value('font-family/text', m, 'STRING'),
          style: weight === 400 ? 'Regular' : 'Bold',
        },
        fontSize: value(`font-size/${size}`, m, 'FLOAT'),
        lineHeight: { unit: 'PERCENT', value: lh },
        textWrapStyle:
          name === 'heading' || name === 'description' ? 'BALANCE' : 'AUTO',
      })),
    });
  }
  const text = (id, characters, style, fill, property, width = 'FILL') => ({
    type: 'TEXT',
    id,
    name: property,
    characters,
    textStyle: `component.editorial.${style}`,
    fill,
    textProperty: property,
    textWrap:
      style === 'heading' || style === 'description' ? 'BALANCE' : 'AUTO',
    layout: { width, height: 'HUG' },
  });
  const header = {
    id: 'section-header',
    name: 'Mangrove/Section Header',
    kind: 'component-set',
    sourceRef: refs.header,
    description:
      'Heading with nonempty description or a visual projection of the authored empty-description state.',
    review: { genericLabels: false, preserveVariantSizing: true },
    limitations: [
      '600px width is a candidate fixture width, not an authored fixed width.',
      'Required nonempty h2 plain text. WithDescription requires nonempty h4; HeadingOnly omits the authored empty h4 node because the native builder requires positive frame dimensions; its zero visual height and collapsed margins are represented by heading-only flow allocation. No semantic HTML equivalence is claimed. Arbitrary rich text, wrapping and scripts excluded.',
      'Source block margins are depicted by explicit10px top/bottom allocation and10px collapsed internal margin. CSS parent margin-collapse boundaries remain candidate.',
      'Scoped Chromium source observed at1164/390 viewports in all5themes. Roboto600 description request loads bundled700. Native/otherengine geometry and font comparison pending.',
    ],
    variants: ['WithDescription', 'HeadingOnly'].map(Content => ({
      id: `section-header.${Content.toLowerCase()}`,
      name: `Content=${Content}`,
      properties: { Content },
      tree: {
        type: 'FRAME',
        id: 'root',
        name: 'mg-section-header',
        fill: null,
        layout: {
          mode: 'VERTICAL',
          width: numbers['header-width'],
          height: 'HUG',
          padding: { block: 'spacing/100', inline: 'spacing/0' },
          gap: Content === 'WithDescription' ? 'spacing/100' : 'spacing/0',
        },
        children: [
          text(
            'heading',
            'Section heading',
            'heading',
            'color/text',
            'Heading'
          ),
          Content === 'WithDescription'
            ? text(
                'description',
                'Supporting section description',
                'description',
                'color/text',
                'Description'
              )
            : null,
        ].filter(Boolean),
      },
    })),
  };
  const caption = {
    id: 'image-caption',
    name: 'Mangrove/Imagecaption',
    kind: 'component-set',
    sourceRef: refs.caption,
    description:
      'Desktop plain-caption/credit source molecule; media itself is not included.',
    review: { genericLabels: false, preserveVariantSizing: true },
    limitations: [
      '600px desktop fixture width is candidate; responsive breakpoint switching, mobile and RTL excluded.',
      'Required nonempty plain caption/credit strings where present. Strong/link rich-credit anatomy and null no-content state excluded.',
      'Desktop source space-between is depicted by FILL caption and HUG credit. Browser intrinsic text widths and wrapping remain pending.',
      'Bottom2px border,15px padding and conditional1px credit divider derive authored CSS; scoped Chromium source observed; native/otherengine geometry pending.',
    ],
    variants: ['Both', 'CaptionOnly', 'CreditOnly'].map(Content => {
      const children = [];
      if (Content !== 'CreditOnly')
        children.push(
          text(
            'caption',
            'A source image caption.',
            'caption',
            'color/neutral-600',
            'Caption'
          )
        );
      if (Content !== 'CaptionOnly')
        children.push({
          type: 'FRAME',
          id: 'credit-slot',
          name: 'mg-credits',
          fill: null,
          strokesIncludedInLayout: true,
          stroke: Content === 'Both' ? 'color/neutral-500' : null,
          bindings:
            Content === 'Both'
              ? {
                  strokeWeight: 'spacing/0',
                  strokeLeftWeight: numbers['border-one'],
                  paddingLeft: 'spacing/150',
                  paddingRight: 'spacing/0',
                  paddingTop: 'spacing/0',
                  paddingBottom: 'spacing/0',
                }
              : undefined,
          layout: {
            mode: 'VERTICAL',
            width: 'HUG',
            height: Content === 'Both' ? 'FILL' : 'HUG',
            padding: undefined,
          },
          children: [
            text(
              'credit',
              'Photo credit',
              'credit',
              'color/text',
              'Credit',
              'HUG'
            ),
          ],
        });
      return {
        id: `image-caption.${Content.toLowerCase()}`,
        name: `Content=${Content}`,
        properties: { Content },
        tree: {
          type: 'FRAME',
          id: 'root',
          name: 'mg-image-caption desktop',
          fill: null,
          stroke: 'color/black',
          bindings: {
            strokeWeight: 'spacing/0',
            strokeBottomWeight: numbers['border-two'],
            paddingBottom: 'spacing/150',
            paddingTop: 'spacing/0',
            paddingLeft: 'spacing/0',
            paddingRight: 'spacing/0',
          },
          strokesIncludedInLayout: true,
          layout: {
            mode: 'HORIZONTAL',
            width: numbers['caption-width'],
            height: 'HUG',
            gap: Content === 'Both' ? 'spacing/150' : 'spacing/0',
            padding: undefined,
          },
          children,
        },
      };
    }),
  };
  const ratios = {
    '16x9': [16, 9],
    '4x3': [4, 3],
    '1x1': [1, 1],
    '21x9': [21, 9],
  };
  const embed = {
    id: 'embed-container',
    name: 'Mangrove/Embed Container',
    kind: 'component-set',
    sourceRef: refs.embed,
    description:
      'Transparent blank bounded wrapper for source media aspect ratios; does not depict external players.',
    review: { genericLabels: false, preserveVariantSizing: true },
    limitations: [
      '336px candidate width. Actual browser responsive aspect-ratio is projected to fixed height, not a live resize/aspect engine.',
      'Blank wrapper only. No iframe/video/map controls, brand media, loading, fallback rendering or editable media content acceptance.',
      'Modern aspect-ratio branch depicted. Legacy percent-padding fallback and intrinsic embed allocation require separate source/native checks.',
    ],
    variants: Object.entries(ratios).map(([AspectRatio, [w, h]]) => {
      const height = number(`embed-height-${AspectRatio}`, (336 * h) / w);
      return {
        id: `embed-container.${AspectRatio}`,
        name: `AspectRatio=${AspectRatio}`,
        properties: { AspectRatio },
        tree: {
          type: 'FRAME',
          id: 'root',
          name: `mg-embed-container ${AspectRatio}`,
          fill: null,
          layout: {
            mode: 'NONE',
            width: numbers['embed-width'],
            height,
            clipsContent: true,
          },
          children: [],
        },
      };
    }),
  };
  return [header, caption, embed];
}
module.exports = { buildEditorialRecipes };
