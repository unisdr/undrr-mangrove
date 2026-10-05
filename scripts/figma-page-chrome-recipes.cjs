/** Exact finite English closed UndrrChrome source cohort. No native acceptance. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const SOURCE_HASHES = {
  'stories/Patterns/_shared/UndrrChrome.jsx':
    '2ad9ca0eb356dedd24b2fb7e667d24940281dd9d3f551a6eaa558756219266b5',
  'stories/Components/PageHeader/PageHeader.jsx':
    '93e1d871ba19a14f3815476947fcdbb002d0f801ec5f9f8b56f712bd2d5ed2c1',
  'stories/Components/PageHeader/page-header.scss':
    '8157051bbd7c11aa96899edc8bcaf13ee61f37355e8898cf797a9d9aad0f1e46',
  'stories/Components/MegaMenu/MegaMenu.jsx':
    '3ab150246239afb941bd650a0e5b5c534bc91d5b959c4577eb63796285f0bfc5',
  'stories/Components/MegaMenu/mega-menu.scss':
    '942d6b4fd54ef580e7c2096680bf6c8294de52c511b78365732489d330072607',
  'stories/Components/MegaMenu/TopBar/TopBar.jsx':
    '3dd25a32332d36d3ed291a4856df32fb6285013a14c15d3359527bb6c1beca62',
  'stories/Components/MegaMenu/TopBar/TopBarItem.jsx':
    '0422292f47eacdeac4453b8ea4ffdd958e1d4461d420d91177169e3419fbd532',
  'stories/Components/MegaMenu/TopBar/TopBarMobileIconButton.jsx':
    'b036d3131eb739812720df0094114cc321c39bd3261af042f88d658fcfe2187c',
  'stories/Atom/Logo/Logo.jsx':
    '583a090c0dd6126c2c935ec4136b37d563da0e0b587b19039797113e34f681a0',
  'stories/Atom/Logo/logo.scss':
    '13e51e1bd5fc7b28d08727ffdb14feed35d71af9d46cec6039698dbb0096ff87',
  'stories/Atom/Logo/undrr-logo-assets.js':
    '887213707bc49d6bb0a1fe5d0ade476cd940fd830c1518477c8e46c86337e5f4',
  'stories/Atom/Icons/Icon.jsx':
    'b3c0653cc27ac62ac5cf282da063179277fcdc80f71919120eb13b8849527347',
  'stories/Atom/Icons/icons.scss':
    'e15a7a74a319eac6b2d5f48d18b3a5cdb908e50756b7fe638e52cd41a23459bb',
  'stories/Atom/Icons/_icon-definitions.scss':
    'ce483a74e800148a703ef73d85f7bb11c3982cbbd07f477cc52db8a1ece8138e',
  'stories/Atom/Layout/Container/container.scss':
    'f62790c55115a47c9291ee2ba3f62b717bf00a698407529e64ffcd97a58af118',
  'stories/Utilities/FullWidth/full-width.scss':
    '7f10dc1976b1d3701fb467e7e2a392db7ad6589195f4ec63c7aabcfd202f517a',
  'stories/assets/scss/_variables.scss':
    '2c9ce7c4b18d63243e45ad2eaed07c9a6284c0e57ef79a3dc3d37f8521cccdfa',
  'stories/assets/scss/_foundational.scss':
    '89f40e9172074d84f101aa6a9d6a048aa6177a67781b8fb672cb4a4c44adbcdf',
  'stories/Utilities/Normalize/normalize.scss':
    'b74d9ace846077ecd6ad39e618f4a90ecde78dab80713b00315caba55cd76795',
  'stories/assets/fonts/roboto-condensed/roboto-condensed.scss':
    '206a320cb9cefbabb300a7bd233a2950267ebdf087cf026e5c3d8279a41ada02',
  'stories/assets/fonts/roboto-condensed/sass/_Bold.scss':
    'efc8c49d945c5d2cd940ed51f2cf1fc16d6011cc5f4ac85bbaaca1868bccb70b',
  'stories/assets/scss/_fonts.scss':
    '1c28869b687c358c8c5d28bf5ea563e078b07ee8ae6b3ad5df1244f06fb9d754',
  'examples/figma-plugin/holistic/assets/page-chrome/undrr-logo-horizontal.svg':
    'c48d269fc01cf87c8e89356f6bd404ba1d1df6f6c48a73ccdecc7dc2f7f92e80',
  'examples/figma-plugin/holistic/assets/page-chrome/toolbar-background.png':
    'ac3941b2f9647c6d037b7eefa1ed80fc77b5f194f3d718d2f4b2902f55303c81',
  'examples/figma-plugin/holistic/assets/page-chrome/source-footprints.json':
    'fc138adde6c936641f97ef9242b6190344e4810b7ef7c9816a4dfda5f6861f20',
  'examples/figma-plugin/holistic/assets/page-chrome/provenance.json':
    '875640cd2dc9e7845aea264f65ad2df75eb3ea5849d35d732e80d1ade6870def',
  'stories/assets/scss/style.scss':
    '126798c2ee0d04f2db7da22f6e00a8af79800f6b097ba192c0c6389f46916ee8',
  'stories/assets/scss/style-delta.scss':
    'b4b47cfc5b182bcb682501e2e0dacd857e963854efa8af66f440868c13d7bb29',
  'stories/assets/scss/style-irp.scss':
    'adcd3154fd1bec5fe40a8956004c6a2c304c87676c68205b4a096da1e7ed5ce6',
  'stories/assets/scss/style-mcr.scss':
    'd29e9e3df3eaab5d08d8609be7c2c305cb7c06c575d5e31c8c0005352ed65239',
  'stories/assets/scss/style-preventionweb.scss':
    '95abbf9c1d269238c6ce971013cc0995b8ec11c33bd3ef315f236e3c13c5e819',
};
const ASSETS = 'examples/figma-plugin/holistic/assets/page-chrome/';
const WIDTHS = [390, 899, 900, 901, 1164, 1440];
function buildPageChromeRecipes({ root, modes, variables, styles }) {
  const fail = message => {
    throw new Error('Page chrome source contract needs updating: ' + message);
  };
  const read = file => fs.readFileSync(path.join(root, file));
  for (const [file, hash] of Object.entries(SOURCE_HASHES))
    if (crypto.createHash('sha256').update(read(file)).digest('hex') !== hash)
      fail(file);
  if (
    modes
      .map(m => m.id)
      .sort()
      .join(',') !== 'delta,irp,mcr,preventionweb,undrr'
  )
    fail('five modes required');
  const byName = new Map(variables.map(v => [v.name, v]));
  function resolve(name, mode, type, seen = new Set()) {
    const v = byName.get(name);
    if (!v || v.type !== type || seen.has(name))
      fail('Missing/wrong-type/cyclic ' + name);
    seen.add(name);
    const x = v.values[mode.id];
    if (x === undefined) fail('Missing mode ' + mode.id);
    return x && typeof x === 'object' && x.alias
      ? resolve(x.alias, mode, type, seen)
      : x;
  }
  function upsert(list, entry, key) {
    const matches = list.filter(
      v =>
        v.id === entry.id ||
        v[key] === entry[key] ||
        (entry.name && v.name === entry.name)
    );
    if (
      matches.length > 1 ||
      (matches.length &&
        (matches[0].id !== entry.id ||
          matches[0][key] !== entry[key] ||
          matches[0].name !== entry.name))
    )
      fail('Foreign identity ' + entry.id);
    if (matches.length) list[list.indexOf(matches[0])] = entry;
    else list.push(entry);
  }
  const ref = { file: 'stories/Patterns/_shared/UndrrChrome.jsx', line: 170 };
  function role(name, type, get, scopes) {
    const nameFull = 'component/page-chrome/' + name;
    const entry = {
      id: nameFull.replaceAll('/', '.'),
      name: nameFull,
      type,
      scopes,
      sourceRef: ref,
      description: 'Finite authored English UndrrChrome source role',
      hiddenFromPublishing: false,
      codeSyntax: {},
      values: Object.fromEntries(modes.map(m => [m.id, get(m)])),
    };
    upsert(variables, entry, 'name');
    byName.set(nameFull, entry);
    return nameFull;
  }
  for (const mode of modes) {
    if (
      resolve('font-family/ui', mode, 'STRING') !== 'Roboto Condensed' ||
      resolve('font-size/300', mode, 'FLOAT') !== 16 ||
      resolve('font-size/400', mode, 'FLOAT') !== 18
    )
      fail('Measured UI face/size changed');
    if (
      resolve('spacing/50', mode, 'FLOAT') !== 5 ||
      resolve('spacing/150', mode, 'FLOAT') !== 15
    )
      fail('Source toolbar/nav allocation changed');
    for (const color of [
      'color/interactive',
      'color/neutral-700',
      'color/neutral-0',
    ])
      resolve(color, mode, 'COLOR');
  }
  const rgba = hex => ({
    r: parseInt(hex.slice(1, 3), 16) / 255,
    g: parseInt(hex.slice(3, 5), 16) / 255,
    b: parseInt(hex.slice(5, 7), 16) / 255,
    a: 1,
  });
  const sendai = ['#c10920', '#962987', '#eb752a', '#00afae'].map((hex, i) =>
    role('sendai-' + i, 'COLOR', () => rgba(hex), ['FRAME_FILL'])
  );
  const border = role(
    'toolbar-border',
    'COLOR',
    m => ({ ...resolve('color/neutral-0', m, 'COLOR'), a: 0.16 }),
    ['FRAME_FILL']
  );
  const navBorder = role(
    'nav-border',
    'COLOR',
    m => ({ ...resolve('color/neutral-600', m, 'COLOR'), a: 0.24 }),
    ['FRAME_FILL']
  );
  const footprints = JSON.parse(read(ASSETS + 'source-footprints.json'));
  const logo = read(ASSETS + 'undrr-logo-horizontal.svg')
    .toString()
    .trim()
    .replace(' xml:space="preserve"', '');
  const raster = read(ASSETS + 'toolbar-background.png').toString('base64');
  const iconSource = read(
    'stories/Atom/Icons/_icon-definitions.scss'
  ).toString();
  function icon(name, size, color, id, position) {
    const m = new RegExp(
      '\\.mg-icon-' +
        name +
        '::before \\{[\\s\\S]*?data:image/svg\\+xml,([^\\"]+)'
    ).exec(iconSource);
    if (!m) fail('Missing exact icon ' + name);
    return {
      id,
      type: 'SVG',
      name: 'mg-icon-' + name,
      position,
      layout: { width: size, height: size },
      svg: {
        assetId: 'page-chrome.' + name,
        markup: m[1].replaceAll("'", '"').replaceAll('currentColor', '#000000'),
        monochrome: { strokes: color },
      },
    };
  }
  const styleIds = {};
  for (const [key, size] of [
    ['mobile', 16],
    ['desktop', 18],
  ]) {
    const id = 'component/page-chrome/nav-' + key;
    upsert(
      styles.text,
      {
        id,
        name: 'Mangrove draft / Page chrome / Nav ' + key,
        description: 'Source UI Bold700 with normalized18px line height',
        sourceRef: ref,
        bindings: {
          fontFamily: 'font-family/ui',
          fontSize: size === 16 ? 'font-size/300' : 'font-size/400',
        },
        values: Object.fromEntries(
          modes.map(m => [
            m.id,
            {
              fontName: {
                family: resolve('font-family/ui', m, 'STRING'),
                style: 'Bold',
              },
              fontSize: size,
              lineHeight: { unit: 'PIXELS', value: 18 },
              letterSpacing: { unit: 'PIXELS', value: 0 },
              textCase: 'ORIGINAL',
              textDecoration: 'NONE',
              paragraphSpacing: 0,
            },
          ])
        ),
      },
      'id'
    );
    styleIds[key] = id;
  }
  const frame = (
    id,
    name,
    w,
    h,
    children = [],
    fill,
    position,
    clips = true
  ) => ({
    id,
    type: 'FRAME',
    name,
    layout: { mode: 'NONE', width: w, height: h, clipsContent: clips },
    ...(position ? { position } : {}),
    ...(fill ? { fill } : {}),
    children,
  });
  const variants = WIDTHS.map(width => {
    const scenes = modes.map(m => footprints.scenes[m.id][width]);
    const scene = scenes[0],
      select = selector => scene.filter(n => n.selector === selector);
    // Geometry is a measured finite source fixture. Brands only change paints.
    for (const nodes of scenes.slice(1))
      for (let i = 0; i < scene.length; i++) {
        if (
          ['x', 'y', 'w', 'h', 'size', 'weight', 'font', 'display'].some(
            k => nodes[i][k] !== scene[i][k]
          )
        )
          fail('Brand geometry needs remeasurement');
      }
    const header = select('.mg-page-header')[0],
      toolbar = select('.mg-page-header__toolbar-wrapper')[0],
      region = select('.mg-page-header__region--toolbar')[0],
      image = select('.mg-page-header__logo-img')[0],
      language = select('.mg-page-header__block--language')[0],
      languageIcon = select('.mg-page-header__language-icon')[0],
      nav = select('.mg-mega-wrapper')[0],
      links = select('.mg-mega-topbar__item-link');
    const mobile = width < 900;
    const crop = width <= 1164;
    const artworkHeight = crop ? image.h : (324 * 63.9) / 442,
      artworkWidth = (artworkHeight * 442) / 63.9;
    const artwork = {
      id: 'logo-artwork',
      type: 'SVG',
      name: 'Source English horizontal white wordmark',
      position: { x: 0, y: (image.h - artworkHeight) / 2 },
      layout: { width: artworkWidth, height: artworkHeight },
      svg: {
        assetId: 'page-chrome.undrr-logo-horizontal',
        markup: logo,
        monochrome: { fills: 'color/neutral-0' },
      },
    };
    const logoViewport = frame(
      'logo-viewport',
      'mg-logo--autocrop source viewport',
      image.w,
      image.h,
      [artwork],
      undefined,
      { x: image.x - region.x, y: image.y - region.y }
    );
    const langIcon = icon(
      'languages',
      19.2,
      'color/neutral-0',
      'language-icon',
      { x: languageIcon.x - language.x, y: languageIcon.y - language.y }
    );
    const lang = frame(
      'language',
      'mg-page-header__block--language',
      40,
      40,
      [langIcon],
      undefined,
      { x: language.x - region.x, y: language.y - region.y },
      false
    );
    const toolbarRegion = frame(
      'toolbar-region',
      'mg-page-header__region--toolbar',
      region.w,
      region.h,
      [logoViewport, lang],
      undefined,
      { x: region.x, y: region.y - toolbar.y },
      false
    );
    const texture = {
      id: 'toolbar-texture',
      type: 'FRAME',
      name: 'Exact unscaled centered source toolbar texture',
      position: { x: (width - 427) / 2, y: (toolbar.h - 96) / 2 },
      layout: { width: 427, height: 96 },
      image: {
        assetId: 'page-chrome.toolbar-texture',
        base64: raster,
        scaleMode: 'FILL',
      },
    };
    const line = frame(
      'toolbar-border',
      'Source toolbar bottom border',
      width,
      1,
      [],
      border,
      { x: 0, y: toolbar.h - 1 }
    );
    const bar = frame(
      'toolbar',
      'mg-page-header__toolbar-wrapper',
      width,
      toolbar.h,
      [texture, toolbarRegion, line],
      'color/neutral-700'
    );
    const stripe = frame(
      'decoration',
      'mg-page-header__decoration',
      width,
      7,
      sendai.map((paint, i) =>
        frame(
          'stripe-' + i,
          'Source Sendai stripe ' + i,
          width / 4,
          7,
          [],
          paint,
          { x: (i * width) / 4, y: 0 }
        )
      )
    );
    const headerTree = frame('header', 'mg-page-header', width, header.h, [
      stripe,
      bar,
    ]);
    // Header flow positions are explicit, avoiding mock HUG measurements.
    stripe.position = { x: 0, y: 0 };
    bar.position = { x: 0, y: 7 };
    const navChildren = links.map((link, i) => {
      const text = {
        id: 'title-' + i,
        type: 'TEXT',
        name: 'Navigation title ' + i,
        characters: link.text,
        textProperty: 'Navigation title ' + (i + 1),
        textStyle: styleIds[mobile ? 'mobile' : 'desktop'],
        fill: 'color/interactive',
        layout: { width: 'HUG', height: 'HUG' },
      };
      return frame(
        'nav-item-' + i,
        'mg-mega-topbar__item-link',
        link.w,
        link.h,
        [text],
        undefined,
        { x: link.x, y: 0 }
      );
    });
    for (const item of navChildren) {
      item.layout.mode = 'VERTICAL';
      item.layout.padding = { block: 15, inline: 15 };
    }
    const navLine = frame(
      'nav-border',
      'Source inset bottom line',
      width,
      1,
      [],
      navBorder,
      { x: 0, y: 47 }
    );
    navChildren.push(navLine);
    if (mobile)
      navChildren.push(
        frame(
          'mobile-trigger',
          'mg-mega-topbar-mobile__icon-button',
          width,
          48,
          [
            icon('menu', 20, 'color/interactive', 'menu-icon', {
              x: 10,
              y: 14,
            }),
          ],
          undefined,
          { x: 0, y: 0 },
          false
        )
      );
    const navigation = frame(
      'navigation',
      'mg-mega-wrapper closed source',
      width,
      48,
      navChildren,
      'color/neutral-0',
      { x: 0, y: header.h },
      mobile
    );
    headerTree.position = { x: 0, y: 0 };
    return {
      id: 'page-chrome.closed-' + width,
      name: 'Viewport=' + width + ', State=Closed',
      properties: { Viewport: String(width), State: 'Closed' },
      tree: frame(
        'root',
        'UndrrChrome English closed ' + width,
        width,
        header.h + nav.h,
        [headerTree, navigation],
        undefined,
        undefined,
        true
      ),
    };
  });
  return [
    {
      id: 'page-chrome',
      kind: 'component-set',
      review: { genericLabels: false, preserveVariantSizing: true },
      limitations: [
        'Closed English UndrrChrome, no account, six authored viewport widths390/899/900/901/1164/1440 only.',
        'Compound source chrome dependency, not full PageHeader, MegaMenu or page catalogue acceptance.',
        'Exact archived logo/background/mask assets and source crop candidates; native artwork pixels, fonts and live variable mode bindings require isolated acceptance.',
        'Desktop open panels, progressive mobile levels and invisible native select behavior remain separate source/native cohorts.',
        'Locale/RTL, script-free fallback, hydration, arbitrary responsive wrapping and keyboard/pointer/motion behavior are not established.',
      ],
      name: 'Page chrome / Authored English UNDRR',
      description:
        'Exact closed source cohorts only. Full flyout, mobile drawer, native select, focus and locale behavior remain separate acceptance work.',
      sourceRef: ref,
      defaultVariantId: 'page-chrome.closed-1164',
      variants,
    },
  ];
}
module.exports = { buildPageChromeRecipes, SOURCE_HASHES, WIDTHS };
