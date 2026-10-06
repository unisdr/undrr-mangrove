/** Isolated authored Card content presets. Native/publication acceptance open. */
'use strict';
const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');
const SOURCE_HASHES = {
  'stories/Components/Cards/Card/BookCard.jsx':
    '5269a774926e8d0b06166387eb75db0127a14350b99e7d56333618eea52a89a7',
  'stories/Components/Cards/Card/BookCard.stories.jsx':
    '9385f7bd428d701b4b25fc09a651c5c82b8c92abcceb63a6ae84781aeab01e0d',
  'stories/Components/Cards/Card/HorizontalBookCard.jsx':
    'baa6eb4baf7c640a34947e93c5fbf37c8fa4bc48731d8dc7937ce26c9075ebfb',
  'stories/Components/Cards/Card/HorizontalBookCard.stories.jsx':
    'aa7023fc7477df59e8aa28ede37e322fbe1edfb8fc509b62377e986a8811397b',
  'stories/Components/Cards/Card/cardParts.jsx':
    'ff7ef9eb6fe17893c11ea9ee4135294011aedab580be1175bd7d7ae7c49e68bc',
  'stories/Components/Cards/Card/card.scss':
    'e5220ce8519237793fc7a1045ea38342a887ec02681309aa8667d1928f3d25a3',
  'stories/Components/Cards/IconCard/IconCard.jsx':
    '3aa5320c55ae2c616243761097d9a1dfc3cba19b3360d0af5fa955fc9735afdb',
  'stories/Components/Cards/IconCard/IconCard.stories.jsx':
    '5679f8558e0471350a56612fac0a9f82d24a519e9a089a40f301012b49e2810a',
  'stories/Atom/Icons/icons.scss':
    'e15a7a74a319eac6b2d5f48d18b3a5cdb908e50756b7fe638e52cd41a23459bb',
  'stories/Atom/Icons/_icon-definitions.scss':
    'ce483a74e800148a703ef73d85f7bb11c3982cbbd07f477cc52db8a1ece8138e',
  'stories/Atom/Icons/Icons.json':
    '842ec2638b53e0de3a4dee3ab4ab026842d5c43957e89b5c4f096132520da059',
  'stories/assets/scss/_foundational.scss':
    '89f40e9172074d84f101aa6a9d6a048aa6177a67781b8fb672cb4a4c44adbcdf',
  'stories/assets/scss/_mixins.scss':
    '0028b614bb410bd03e6bc6a81e2b42b0daea54a5f6193eca6b7a1130617b9a35',
  'stories/assets/scss/_variables.scss':
    '2c9ce7c4b18d63243e45ad2eaed07c9a6284c0e57ef79a3dc3d37f8521cccdfa',
  'stories/assets/fonts/mangrove-icon-set/font/mangrove-icon-set.woff2':
    '5f102ffd936946a73846e63385d4b4074981a619b972d43bbf242e4137a71a1e',
  'tokens/mangrove.yaml':
    '02449d0cf3aa7e011f767e638637d5dd6427c489d985f36627401db6bf164ec8',
  'tokens/delta.yaml':
    'aa04fedf9b32bfd4b84ac1d755216824d9c589234ac2fbf67c11388ef55dd3b1',
  'tokens/undrr.yaml':
    '7514567babda3ea49f3af6f0f5fbb194b8fbfcab8bdde7bb061cdd6542959669',
  'tokens/preventionweb.yaml':
    '587b72ff245843ec229609c55cda03aa1a2146c35d7bc90c6163f946cd7f08d5',
  'tokens/irp.yaml':
    'b2063159f014824ccfe3edbbbc696ed494fd3dc9113aeddeda089f1828c0ca27',
  'tokens/mcr.yaml':
    '4696b9b72028ed4d62e2c69b51a41df8e24f855d138269a84a93530cc10d9188',
  'stories/assets/fonts/roboto/roboto.scss':
    'b881ae0ebeb56f49523c791faafc1a10299fc1d7a875fa91c028b06164b8197c',
  'stories/assets/fonts/roboto/sass/_Regular.scss':
    'cb27bc0dd02ba21b4dda3249a59e352e0a42c5ea45b83d7cba0a1a2cb79f5845',
  'stories/assets/fonts/roboto/sass/_Bold.scss':
    '9f24cf0a077b2087c47c55bbb665a4086a38818680eee9ca0dfac4c0ce0d273e',
  'stories/assets/fonts/roboto-condensed/roboto-condensed.scss':
    '206a320cb9cefbabb300a7bd233a2950267ebdf087cf026e5c3d8279a41ada02',
  'stories/assets/fonts/roboto-condensed/sass/_Regular.scss':
    '83e36cfc43d952acf7e4e15f3f8068de84930b5412a433926fab097d44105ce7',
  'stories/assets/fonts/roboto-condensed/sass/_Bold.scss':
    'efc8c49d945c5d2cd940ed51f2cf1fc16d6011cc5f4ac85bbaaca1868bccb70b',
};
function buildCardContentRecipes({ root, modes, variables, styles }) {
  const fail = m => {
      throw Error(`Figma Card content recipe needs updating: ${m}`);
    },
    read = f => fs.readFileSync(path.join(root, f));
  for (const [file, hash] of Object.entries(SOURCE_HASHES))
    if (crypto.createHash('sha256').update(read(file)).digest('hex') !== hash)
      fail(`Guarded source ${file} changed`);
  if (
    modes
      .map(m => m.id)
      .sort()
      .join(',') !== 'delta,irp,mcr,preventionweb,undrr'
  )
    fail('Expected five source modes');
  const source = (file, needle) => {
    const text = read(file).toString(),
      i = text.indexOf(needle);
    if (i < 0) fail(`Missing ${needle}`);
    return { file, line: text.slice(0, i).split('\n').length };
  };
  const cardRef = source(
    'stories/Components/Cards/Card/card.scss',
    '.mg-card {'
  );
  const byName = new Map(variables.map(v => [v.name, v]));
  const value = (name, m, type, seen = new Set()) => {
    const v = byName.get(name);
    if (!v || v.type !== type || seen.has(name))
      fail(`Missing/wrong/circular ${name}`);
    seen.add(name);
    const x = v.values[m.id];
    if (x == null) fail(`Missing ${name}/${m.id}`);
    return x.alias ? value(x.alias, m, type, seen) : x;
  };
  const per = fn => Object.fromEntries(modes.map(m => [m.id, fn(m)]));
  const upsert = (array, e) => {
    const matched = array.filter(v => v.id === e.id || v.name === e.name);
    if (
      matched.length > 1 ||
      (matched.length && (matched[0].id !== e.id || matched[0].name !== e.name))
    )
      fail(`Foreign identity ${e.id}`);
    const i = array.findIndex(v => v.id === e.id);
    if (i < 0) array.push(e);
    else array[i] = e;
  };
  const helper = (name, type, scopes, fn) => {
    const full = `component/card-content/${name}`;
    upsert(variables, {
      id: full.replaceAll('/', '.'),
      name: full,
      type,
      scopes,
      sourceRef: cardRef,
      description:
        'Authored bounded source projection. See geometry/source limitations.',
      hiddenFromPublishing: false,
      codeSyntax: {},
      values: per(m => (typeof fn === 'function' ? fn(m) : fn)),
    });
    return full;
  };
  const num = (n, x) =>
    helper(
      n,
      'FLOAT',
      ['WIDTH_HEIGHT', 'GAP', 'STROKE_FLOAT', 'CORNER_RADIUS'],
      x
    );
  const alpha = (n, role, a) =>
    helper(n, 'COLOR', ['FRAME_FILL', 'STROKE_COLOR', 'TEXT_FILL'], m => ({
      ...value(role, m, 'COLOR'),
      a,
    }));
  const border = alpha('book-border', 'color/neutral-600', 0.2),
    outline = alpha('book-outline', 'color/neutral-900', 0.1),
    negativeBody = alpha('negative-body', 'color/neutral-0', 0.8);
  const one = num('one', 1),
    smallRadius = num(
      'book-visual-radius',
      m => value('card/border-radius', m, 'FLOAT') / 2
    ),
    pEnd = num(
      'paragraph-end',
      m => value('font-size/300', m, 'FLOAT') + value('spacing/50', m, 'FLOAT')
    );
  const widths = Object.fromEntries(
    [200, 300, 390, 640].map(w => [w, num(`width-${w}`, w)])
  );
  const slot = Object.fromEntries(
    [155, 67, 37, 55].map(h => [h, num(`glyph-linebox-${h}`, h)])
  );
  for (const m of modes) {
    for (const [role, expected] of [
      ['card/padding', 15],
      ['spacing/100', 10],
      ['spacing/200', 20],
      ['font-size/300', 16],
      ['font-size/500', 23],
    ])
      if (value(role, m, 'FLOAT') !== expected)
        fail(`Measured preset ${role}/${m.id} changed`);
    if (
      value('font-family/ui', m, 'STRING') !== 'Roboto Condensed' ||
      value('font-family/text', m, 'STRING') !== 'Roboto'
    )
      fail('Measured Latin face changed');
  }
  const clonedStyle = (id, from, role, size, decoration) => {
    const original = styles.text.find(s => s.id === from);
    if (!original) fail(`Missing ${from}`);
    if (original.bindings?.fontFamily !== role)
      fail(`Source font binding ${from} changed`);
    for (const mode of modes) {
      const expectedFamily = value(role, mode, 'STRING'),
        v = original.values[mode.id];
      if (
        v?.fontName?.family !== expectedFamily ||
        v.fontName.style !==
          (from === 'component.card.summary' ? 'Regular' : 'Bold')
      )
        fail(`Source font template ${from}/${mode.id} changed`);
    }

    const e = JSON.parse(JSON.stringify(original));
    e.id = `component.card-content.${id}`;
    e.name = `Mangrove/component/card-content/${id}`;
    e.component = true;
    e.recommended = false;
    e.source = cardRef;
    e.bindings = { fontFamily: role, fontSize: `font-size/${size}` };
    e.values = per(m => ({
      ...original.values[m.id],
      fontSize: value(`font-size/${size}`, m, 'FLOAT'),
      ...(decoration ? { textDecoration: decoration } : {}),
    }));
    upsert(styles.text, e);
    return e.id;
  };
  const title = clonedStyle(
      'title',
      'component.card.title',
      'font-family/ui',
      '500'
    ),
    linkedTitle = clonedStyle(
      'title-link',
      'component.card.title',
      'font-family/ui',
      '500',
      'UNDERLINE'
    ),
    bookTitle = clonedStyle(
      'book-title',
      'component.card.title',
      'font-family/ui',
      '300'
    ),
    bookLink = clonedStyle(
      'book-title-link',
      'component.card.title',
      'font-family/ui',
      '300',
      'UNDERLINE'
    ),
    body = clonedStyle(
      'body',
      'component.card.summary',
      'font-family/text',
      '300'
    ),
    label = clonedStyle(
      'label',
      'component.card.label',
      'font-family/ui',
      '250'
    );
  const f = (id, layout, children = [], extra = {}) => ({
    type: 'FRAME',
    id,
    name: id,
    fill: null,
    layout,
    children,
    ...extra,
  });
  const t = (
    id,
    characters,
    style,
    fill,
    property,
    width = 'FILL',
    extra = {}
  ) => ({
    type: 'TEXT',
    id,
    name: id,
    characters,
    textStyle: style,
    fill,
    ...(property ? { textProperty: property } : {}),
    textWrap: 'AUTO',
    layout: { width, height: 'HUG' },
    ...extra,
  });
  const col = (id, children, extra = {}) =>
    f(
      id,
      { mode: 'VERTICAL', width: 'FILL', height: 'HUG', gap: 'spacing/0' },
      children,
      extra
    );
  const coverPath =
      'examples/figma-plugin/holistic/assets/card-content/bali-publication-cover.jpg',
    cover = read(coverPath);
  if (
    crypto.createHash('sha256').update(cover).digest('hex') !==
    '4770262ae2ee8715facebeb0ff0c70b45ce8831e9fb36f79fafbeecfeed50370'
  )
    fail('Exact Bali cover bytes changed');
  const coverImage = {
    assetId: 'card-content-bali-gp2022-cover',
    base64: cover.toString('base64'),
    scaleMode: 'FILL',
  };
  function visual(w, book) {
    const h = book ? (w * 4) / 3 : ((w - 2) * 4) / 3 + 2;
    return f(
      'visual',
      {
        mode: 'NONE',
        width: num(`cover-box-width-${w}-${book}`, w),
        height: num(`cover-box-height-${w}-${book}`, h),
        clipsContent: true,
      },
      [
        f(
          'cover',
          {
            mode: 'NONE',
            width: num(`cover-ink-width-${w}`, w - 2),
            height: num(`cover-ink-height-${w}`, ((w - 2) * 4) / 3),
          },
          [],
          { position: { x: 1, y: 1 }, image: coverImage }
        ),
      ],
      {
        stroke: border,
        bindings: {
          strokeWeight: one,
          ...(book ? { cornerRadius: smallRadius } : {}),
        },
        ...(book ? {} : {}),
      }
    );
  }
  // Exact CSS border-chevron projection. It remains an inline/baseline candidate.
  function caret(size, paint) {
    const side = size * 0.35,
      b = size * 0.15,
      v = side * Math.SQRT2;
    const rotate = ([x, y]) => [
      (x - y + side) / Math.SQRT2,
      (x + y) / Math.SQRT2,
    ];
    const poly = points =>
      `<polygon fill="#000000" points="${points.map(p => rotate(p).join(',')).join(' ')}"/>`;
    const markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${v} ${v}">${poly(
      [
        [0, 0],
        [side, 0],
        [side, b],
        [0, b],
      ]
    )}${poly([
      [side - b, b],
      [side, b],
      [side, side],
      [side - b, side],
    ])}</svg>`;
    return f(
      'caret-slot',
      {
        mode: 'NONE',
        width: num(`caret-slot-${size}`, size * 0.6),
        height: num(`caret-line-${size}`, size * 1.25),
        clipsContent: false,
      },
      [
        {
          type: 'SVG',
          id: 'caret-ink',
          name: 'Exact source border chevron',
          layout: { width: v, height: v },
          position: {
            x: size * 0.25 + (side - v) / 2,
            y: (size * 1.25 - v) / 2 - size * 0.1,
          },
          svg: {
            assetId: `card-title-caret-${size}`,
            markup,
            monochrome: { fills: paint },
          },
        },
      ]
    );
  }
  function heading(
    text,
    linked,
    small = false,
    icon = false,
    paint,
    center = false
  ) {
    const fill = paint || (linked ? 'color/interactive' : 'color/text'),
      size = small ? 16 : 23;
    return f(
      'title-box',
      {
        mode: 'HORIZONTAL',
        width: center ? 'HUG' : 'FILL',
        height: 'HUG',
        gap: 'spacing/0',
        align: 'CENTER',
      },
      [
        t(
          'title',
          text,
          small
            ? linked
              ? bookLink
              : bookTitle
            : linked
              ? linkedTitle
              : title,
          fill,
          'Title',
          center || linked ? 'HUG' : 'FILL',
          { textWrap: 'BALANCE', textAlign: center ? 'CENTER' : 'LEFT' }
        ),
        ...(linked ? [caret(size, fill)] : []),
      ],
      {
        bindings: {
          paddingTop: icon ? 'spacing/0' : small ? 'spacing/25' : 'spacing/100',
          paddingBottom: 'spacing/75',
        },
      }
    );
  }
  const action = text => ({
    type: 'INSTANCE',
    id: 'cta',
    name: 'Authored CTA action',
    family: 'editorial-cta',
    variant: {
      Context: 'Base',
      State: 'Default',
      Content: 'Short',
      Motion: 'NoPreference',
    },
    overrides: { Label: text },
    expose: true,
    layout: { width: 'HUG', height: 'HUG' },
  });
  const bookStory = read(
    'stories/Components/Cards/Card/BookCard.stories.jsx'
  ).toString();
  if (!bookStory.includes("title: 'Title in large size'"))
    fail('Book English title changed');
  const rawSummary = /summaryText: `([^`]+)`/.exec(
    read(
      'stories/Components/Cards/Card/HorizontalBookCard.stories.jsx'
    ).toString()
  )?.[1];
  if (!rawSummary) fail('Missing authored rich summary');
  const match =
    /^(.*)<a href="#" class="mg-card__text-link">([^<]+)<\/a>([\s\S]*)$/.exec(
      rawSummary
    );
  if (!match) fail('Rich inline anatomy changed');
  const chunks = match.slice(1).map(s => s.replace(/\s+/g, ' ')),
    characters = chunks.join('');
  function summary() {
    let end = 0;
    return col(
      'summary-box',
      [
        {
          type: 'TEXT',
          id: 'summary',
          name: 'Authored rich summary',
          characters,
          textWrap: 'PRETTY',
          textRuns: chunks.map((s, i) => {
            const start = end;
            end += s.length;
            return {
              id: ['before-link', 'source-placeholder-link', 'after-link'][i],
              start,
              end,
              textStyle: body,
              fill: i === 1 ? 'color/interactive' : 'color/neutral-800',
              textDecoration: i === 1 ? 'UNDERLINE' : 'NONE',
            };
          }),
          layout: { width: 'FILL', height: 'HUG' },
        },
      ],
      { bindings: { paddingBottom: pEnd } }
    );
  }
  const base = (id, name, ref, description, variants, limitations) => ({
    id,
    name: `Mangrove/${name}`,
    kind: 'component-set',
    sourceRef: ref,
    description,
    review: { genericLabels: false, preserveVariantSizing: true },
    limitations,
    variants,
  });
  const common = [
    'Latin English finite source content only. Native/otherengine pixels, arbitrary edits/wrapping, brand/script and publication acceptance pending.',
    'Root height depicts card box only; source external10px margin-bottom belongs to composition flow.',
    'Linked title caret only supports declared single-line fixture titles. Native baseline/underline offset and arbitrary edited-title wrapping are not accepted.',
  ];
  const shell = (children, width, extra = {}) =>
    f(
      'root',
      {
        mode: 'VERTICAL',
        width: widths[width],
        height: 'HUG',
        gap: 'spacing/0',
        clipsContent: false,
      },
      children,
      {
        fill: 'card/background',
        effectStyle: 'shadow.raised',
        bindings: {
          cornerRadius: 'card/border-radius',
          paddingTop: 'card/padding',
          paddingBottom: 'card/padding',
          paddingLeft: 'card/padding',
          paddingRight: 'card/padding',
        },
        ...extra,
      }
    );
  const book = base(
    'book-card',
    'Book Card',
    source(
      'stories/Components/Cards/Card/BookCard.jsx',
      'export function BookCard'
    ),
    'Exact Bali cover and source English title, primary linked/unlinked200px fixture.',
    [true, false].map(linked => ({
      id: `book-card.primary.${linked ? 'linked' : 'unlinked'}.200`,
      name: `Link=${linked ? 'Linked' : 'NoLink'}`,
      properties: {
        Link: linked ? 'Linked' : 'NoLink',
        Tone: 'Primary',
        Width: '200',
      },
      tree: shell(
        [
          f(
            'outline',
            { mode: 'NONE', width: 'FILL', height: (170 * 4) / 3 },
            [visual(170, true)],
            {
              stroke: outline,
              strokeAlign: 'OUTSIDE',
              bindings: { strokeWeight: one, cornerRadius: smallRadius },
            }
          ),
          heading('Title in large size', linked, true),
        ],
        200,
        {
          layout: {
            mode: 'VERTICAL',
            width: widths[200],
            height: 'HUG',
            gap: 'spacing/50',
            clipsContent: false,
          },
        }
      ),
    })),
    [
      ...common,
      'Exact source JPEG720x960. Native crop/radius and combined1px border/outside outline remain candidate.',
      'Other authored tones, mixed title-length grid, cover/no-image swaps and400px desktop maximum are outside this first family.',
    ]
  );
  const horizontalVariants = [];
  for (const Width of [640, 390])
    for (const Preset of ['Default', 'NoImage', 'NoLink', 'ButtonOnly']) {
      const linked = Preset === 'Default' || Preset === 'NoImage',
        hasCover = Preset !== 'NoImage',
        hasCTA = Preset !== 'NoLink',
        content = col('content', [
          f(
            'meta',
            {
              mode: 'HORIZONTAL',
              width: 'FILL',
              height: 'HUG',
              gap: 'spacing/50',
            },
            [
              t('label-1', 'Label 1', label, 'color/tag', 'Label 1', 'HUG'),
              t('label-2', 'Label 2', label, 'color/tag', 'Label 2', 'HUG'),
            ]
          ),
          heading('Title in large size', linked),
          summary(),
          ...(hasCTA ? [action('Primary action')] : []),
        ]);
      const children = hasCover
        ? [visual(Width === 640 ? 160 : 200, false), content]
        : [content];
      horizontalVariants.push({
        id: `horizontal-book-card.${Preset.toLowerCase()}.${Width}`,
        name: `Preset=${Preset}, Width=${Width}`,
        properties: { Preset, Width: String(Width), Tone: 'Primary' },
        tree: shell(children, Width, {
          layout: {
            mode: Width === 640 ? 'HORIZONTAL' : 'VERTICAL',
            width: widths[Width],
            height: 'HUG',
            gap: Width === 640 ? 'spacing/100' : 'spacing/0',
            clipsContent: false,
          },
        }),
      });
    }
  const hbook = base(
    'horizontal-book-card',
    'Horizontal Book Card',
    source(
      'stories/Components/Cards/Card/HorizontalBookCard.jsx',
      'export function HorizontalBookCard'
    ),
    'Four actual source story states at640 desktop and390 mobile. Exact visible rich summary.',
    horizontalVariants,
    [
      ...common,
      'Body uses three contiguous authored inline runs, no whole-string component property. Direct formatted-run edit recovery relies on isolated rich TEXT capability.',
      'Source summary anchor href="#" is preserved in metadata and visibly styled; native HTTPS hyperlink omitted, no invented destination.',
      'Actual CtaButton VariantCTA reuses unpublished editorial-cta Base child, not filled Button. Nested consumer edits require native acceptance.',
      'Fixed widths/cover grid project source desktop160px versus mobile200px-max visual. Responsive resizing and other tones remain open.',
    ]
  );
  hbook.sourceHrefMetadata = {
    summary: '#',
    title: 'javascript:void(0)',
    CTA: 'javascript:void(0)',
  };
  const iconStory = read(
    'stories/Components/Cards/IconCard/IconCard.stories.jsx'
  ).toString();
  const english = iconStory.slice(
    iconStory.indexOf('english: {'),
    iconStory.indexOf('arabic: {')
  );
  const content = (key, field) => {
    const group = new RegExp(String.raw`${key}: \{([\s\S]*?)\n    \}`).exec(
        english
      )?.[1],
      v =
        group && new RegExp(String.raw`${field}:\s*'([^']*)'`).exec(group)?.[1];
    if (!v) fail(`Missing English ${key}/${field}`);
    return v;
  };
  const specimens = [
    {
      Preset: 'Default',
      key: 'components',
      glyph: 'cubes',
      scale: 'medium',
      link: true,
    },
    {
      Preset: 'Centered',
      key: 'getStarted',
      glyph: 'cubes',
      scale: 'small',
      center: true,
      button: true,
    },
    {
      Preset: 'WithLabel',
      key: 'latestFeatures',
      glyph: 'cubes',
      scale: 'medium',
      button: true,
      label: true,
    },
    {
      Preset: 'Negative',
      key: 'components',
      glyph: 'cubes',
      scale: 'medium',
      negative: true,
      link: true,
    },
    {
      Preset: 'Analytics',
      glyph: 'chart-bar',
      colored: '#f4b8a8',
      title: 'Analytics',
      summary:
        'From data to decisions - analysis that drives multiple DRR applications, including recovery planning and early warning.',
    },
    {
      Preset: 'Archiving',
      glyph: 'file-alt',
      colored: '#b5d8d8',
      title: 'Data archiving & integration',
      summary:
        'Preserve, connect and enrich your disaster data leveraging exposure, vulnerability and other relevant baseline information.',
    },
    {
      Preset: 'Understand',
      glyph: 'tags',
      horizontal: true,
      title: 'Understand the indicators',
      summary:
        'What the 38 indicators measure, and how the framework connects to the SDGs.',
      link: true,
    },
    {
      Preset: 'Explore',
      glyph: 'chart-bar',
      horizontal: true,
      title: 'Explore the data',
      summary:
        'Global, regional and country progress against the seven global targets.',
      link: true,
    },
    {
      Preset: 'Report',
      glyph: 'file-alt',
      horizontal: true,
      title: 'Report on the Sendai Framework',
      link: true,
    },
  ];
  const icons = specimens.map(s => {
    const Width = s.horizontal ? 640 : 300,
      size = s.colored
        ? 32
        : s.horizontal
          ? 48
          : s.scale === 'small'
            ? 58
            : 135,
      mask = read(
        `examples/figma-plugin/holistic/assets/card-content/${s.glyph}-source-mask.svg`
      )
        .toString()
        .trim();
    const authored = new RegExp(
      String.raw`\.mg-icon-${s.glyph}::before \{[\s\S]*?data:image/svg\+xml,([^"\n]+)`
    ).exec(read('stories/Atom/Icons/_icon-definitions.scss').toString())?.[1];
    if (mask !== authored) fail(`Exact ${s.glyph} mask changed`);
    const ink = {
      type: 'SVG',
      id: 'glyph-ink',
      name: `Authored ${s.glyph} mask`,
      layout: { width: size, height: size },
      svg: {
        assetId: `card-content-${s.glyph}`,
        markup: mask,
        monochrome: {
          strokes: s.negative
            ? 'color/white'
            : s.colored
              ? 'color/neutral-700'
              : 'color/interactive',
        },
      },
    };
    const glyphHeight = s.colored
      ? 37
      : s.horizontal
        ? 55
        : s.scale === 'small'
          ? 67
          : 155;
    const glyph = f(
      'glyph-linebox',
      {
        mode: 'NONE',
        width: s.scale === 'small' ? 72 : size,
        height: slot[glyphHeight],
        clipsContent: false,
      },
      [
        {
          ...ink,
          position: { x: s.center && s.scale === 'small' ? 7 : 0, y: 0 },
        },
      ]
    );
    let visualNode;
    if (s.colored) {
      const hex = s.colored,
        paint = helper(`badge-${hex.slice(1)}`, 'COLOR', ['FRAME_FILL'], {
          r: parseInt(hex.slice(1, 3), 16) / 255,
          g: parseInt(hex.slice(3, 5), 16) / 255,
          b: parseInt(hex.slice(5), 16) / 255,
          a: 1,
        });
      visualNode = f(
        'visual',
        { mode: 'VERTICAL', width: 'FILL', height: 72 },
        [
          f(
            'badge',
            {
              mode: 'VERTICAL',
              width: 72,
              height: 72,
              justify: 'CENTER',
              align: 'CENTER',
            },
            [glyph],
            {
              fill: paint,
              bindings: {
                cornerRadius: num('badge-radius', m =>
                  m.id === 'delta' ? 10.8 : 14.4
                ),
              },
            }
          ),
        ]
      );
    } else
      visualNode = f(
        'visual',
        {
          mode: 'VERTICAL',
          width: s.horizontal ? 48 : 'FILL',
          height: s.horizontal ? 48 : glyphHeight,
          align: s.center ? 'CENTER' : 'MIN',
          justify: s.center || s.horizontal ? 'CENTER' : 'MIN',
          clipsContent: false,
        },
        [glyph]
      );
    const titleText = s.title || content(s.key, 'title'),
      bodyText = s.summary || (s.key ? content(s.key, 'summaryText') : null),
      titleLinked = s.link && !s.button;
    const children = [];
    if (s.label)
      children.push(
        f('meta', { mode: 'HORIZONTAL', width: 'FILL', height: 'HUG' }, [
          t(
            'label',
            content(s.key, 'label'),
            label,
            'color/tag',
            'Label',
            'HUG'
          ),
        ])
      );
    children.push(
      heading(
        titleText,
        titleLinked,
        false,
        true,
        s.negative ? 'color/white' : undefined,
        s.center
      )
    );
    if (bodyText)
      children.push(
        col(
          'summary-box',
          [
            t(
              'summary',
              bodyText,
              body,
              s.negative ? negativeBody : 'color/text',
              'Summary',
              'FILL',
              { textWrap: 'PRETTY', textAlign: s.center ? 'CENTER' : 'LEFT' }
            ),
          ],
          { bindings: { paddingBottom: pEnd } }
        )
      );
    if (s.button)
      children.push(
        col('action-box', [action(content(s.key, 'button'))], {
          layout: {
            mode: 'VERTICAL',
            width: s.center ? 'HUG' : 'FILL',
            height: 'HUG',
            gap: 'spacing/0',
            align: s.center ? 'CENTER' : 'MIN',
          },
          bindings: { paddingTop: 'spacing/100' },
        })
      );
    if (s.link && !s.horizontal)
      children.push(
        col(
          'text-link-box',
          [
            t(
              'text-link',
              content(s.key, 'linkText'),
              body,
              s.negative ? 'color/white' : 'color/interactive',
              'Link text'
            ),
          ],
          { bindings: { paddingTop: 'spacing/75' } }
        )
      );
    const copyColumn = col('content', children, {
      layout: {
        mode: 'VERTICAL',
        width: 'FILL',
        height: 'HUG',
        gap: 'spacing/0',
        align: s.center ? 'CENTER' : 'MIN',
      },
    });
    return {
      id: `icon-card.${s.Preset.toLowerCase()}.${Width}`,
      name: `Preset=${s.Preset}, Width=${Width}`,
      properties: { Preset: s.Preset, Width: String(Width) },
      tree: shell([visualNode, copyColumn], Width, {
        layout: {
          mode: s.horizontal ? 'HORIZONTAL' : 'VERTICAL',
          width: widths[Width],
          height: 'HUG',
          gap: s.horizontal ? 'spacing/200' : 'spacing/100',
          align: s.center ? 'CENTER' : 'MIN',
          clipsContent: false,
        },
      }),
    };
  });
  const icon = base(
    'icon-card',
    'Icon Card',
    source(
      'stories/Components/Cards/IconCard/IconCard.jsx',
      'export function IconCard'
    ),
    'Nine authored English appearances with exact source SVGmask identities and finite source linebox allocations.',
    icons,
    [
      ...common,
      'Medium/small pseudo-inline mask lineboxes derive scoped Chromium155/67px at guarded135/58px glyph sizes. Colored32px and horizontal48px masks have37/55px lineboxes. Native baseline/ink acceptance pending.',
      'Horizontal640px fixture keeps source short titles on one line. Narrow horizontal, responsive maxwidths, automatic collection equal-height stretching, arbitrary title lengths excluded.',
      'Colored badges use exact source literals and guarded theme20%/15% of72px source radius. Host overrides, visualLabel/borderColor/foreground hooks, other feature cards and logo/image/media stories remain unmapped.',
      'Negative depicts source card against caller-provided dark context; source decorator background is not silently built into the reusable card.',
    ]
  );
  const scoped = new Set(['Title', 'Summary']),
    defaults = new Map();
  for (const variant of icon.variants) {
    const context =
      variant.properties.Preset === 'Negative'
        ? 'default'
        : variant.properties.Preset.toLowerCase();
    function visit(node) {
      if (scoped.has(node.textProperty))
        node.textProperty = 'icon-card/' + context + ' ' + node.textProperty;
      if (node.textProperty) {
        if (
          defaults.has(node.textProperty) &&
          defaults.get(node.textProperty) !== node.characters
        )
          fail(
            'Unscoped differing authored IconCard text default ' +
              node.textProperty
          );
        defaults.set(node.textProperty, node.characters);
      }
      for (const child of node.children || []) visit(child);
    }
    visit(variant.tree);
  }
  icon.limitations.push(
    'Different authored card content uses stable source preset property contexts; Default and Negative share identical source copy. Native state-switch/default migration and arbitrary reflow remain separate gates.'
  );
  return [book, hbook, icon];
}
module.exports = { buildCardContentRecipes };
