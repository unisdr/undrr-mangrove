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

// Separate factory. The accepted closed cohort above retains its return shape.
const OPEN_HASHES = {
  'stories/Components/Buttons/CtaButton/buttons.scss':
    '1f7b664db2a3f6147b6e7571bd0ad52dbe41eda458bf4140ffcbe3fac65d3f3d',
  'stories/Components/Buttons/CtaButton/cta-button.scss':
    'f1534e70a4c4c1d60dea8356fdef4b4b476e49d93c3ed310557f898d3bc5a40b',
  'stories/assets/fonts/roboto/roboto.scss':
    'b881ae0ebeb56f49523c791faafc1a10299fc1d7a875fa91c028b06164b8197c',
  'stories/assets/fonts/roboto/sass/_variables.scss':
    'ce141aa75263b9b51a301463ddc4ac755458baf84c6636f854852394a6190ea6',
  'stories/assets/fonts/roboto/sass/_mixins.scss':
    'da42b1344b5a5ca7c059c96374b92286381a0a36e2d0ffadefe30683c2e916a7',
  'stories/assets/fonts/roboto-condensed/sass/_variables.scss':
    'af157df7df4276d396e7a636039dd353e9e9849163564b30dbbb299aafc34940',
  'stories/assets/fonts/roboto-condensed/sass/_mixins.scss':
    'a53206df9ff982de438f1472ccb571acb7c923d2fdcc8c72f2ce5ece96a1f6d4',
  'examples/figma-plugin/holistic/assets/page-patterns/source-fonts/Roboto-Regular.woff2':
    '47107401d0adb375ab9aa167f9d62489a849d510e740a307b5a4db60e5db3562',
  'examples/figma-plugin/holistic/assets/page-patterns/source-fonts/Roboto-Bold.woff2':
    '8e44376b735dcc9027acbcc8a0df64c3f886a23529eff27b022f344d719e90f2',
  'stories/Components/MegaMenu/TopBar/Sidebar.jsx':
    '270b31598a7d22650d7fcc29a888228b904870c2fcde3cc0ebac1140586afbc8',
  'stories/Components/MegaMenu/Section/Section.jsx':
    'e04e35ec2b85a6b0d20d578604f86f3432f724d8328123c119820a9030a34345',
  'stories/assets/fonts/roboto/sass/_Regular.scss':
    'cb27bc0dd02ba21b4dda3249a59e352e0a42c5ea45b83d7cba0a1a2cb79f5845',
  'stories/assets/fonts/roboto/sass/_Bold.scss':
    '9f24cf0a077b2087c47c55bbb665a4086a38818680eee9ca0dfac4c0ce0d273e',
  'stories/assets/fonts/roboto-condensed/sass/_Regular.scss':
    '83e36cfc43d952acf7e4e15f3f8068de84930b5412a433926fab097d44105ce7',
  [ASSETS + 'open-source-footprints.json']:
    '6c69fd8e07ca8fd931d7da6b16dc6c4c9bcb5eb5312ba21ab894e87d3d80edff',
};
function buildPageChromeOpenRecipes({ root, modes, variables, styles }) {
  const fail = message => {
    throw new Error(
      'Open page chrome source contract needs updating: ' + message
    );
  };
  for (const [file, hash] of Object.entries({
    ...SOURCE_HASHES,
    ...OPEN_HASHES,
  }))
    if (
      crypto
        .createHash('sha256')
        .update(fs.readFileSync(path.join(root, file)))
        .digest('hex') !== hash
    )
      fail(file);
  if (
    modes
      .map(m => m.id)
      .sort()
      .join(',') !== 'delta,irp,mcr,preventionweb,undrr'
  )
    fail('five modes required');
  const source = JSON.parse(
    fs.readFileSync(path.join(root, ASSETS + 'open-source-footprints.json'))
  );
  const byName = new Map(variables.map(v => [v.name, v]));
  const ref = {
    file: 'stories/Components/MegaMenu/TopBar/Sidebar.jsx',
    line: 178,
  };
  function upsert(list, entry, key) {
    const found = list.filter(
      x =>
        x.id === entry.id ||
        x[key] === entry[key] ||
        (entry.name && x.name === entry.name)
    );
    if (
      found.length > 1 ||
      (found.length &&
        (found[0].id !== entry.id ||
          found[0][key] !== entry[key] ||
          found[0].name !== entry.name))
    )
      fail('Foreign identity ' + entry.id);
    if (found.length) list[list.indexOf(found[0])] = entry;
    else list.push(entry);
  }
  function role(name, type, get, scopes) {
    const n = 'component/page-chrome-open/' + name;
    const entry = {
      id: n.replaceAll('/', '.'),
      name: n,
      type,
      scopes,
      sourceRef: ref,
      description: 'Measured finite authored English open MegaMenu source role',
      hiddenFromPublishing: false,
      codeSyntax: {},
      values: Object.fromEntries(modes.map(m => [m.id, get(m)])),
    };
    upsert(variables, entry, 'name');
    byName.set(n, entry);
    return n;
  }
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
  for (const m of modes) {
    if (
      resolve('font-family/ui', m, 'STRING') !== 'Roboto Condensed' ||
      resolve('font-family/text', m, 'STRING') !== 'Roboto'
    )
      fail('Measured UI/body fonts changed');
    for (const n of [
      'color/interactive',
      'color/neutral-900',
      'color/neutral-600',
      'color/neutral-0',
    ])
      resolve(n, m, 'COLOR');
  }
  const rgba = str => {
    const x = /^rgba?\(([^)]+)\)$/.exec(str);
    if (!x) fail('Unsupported source color ' + str);
    const n = x[1].split(',').map(Number);
    return { r: n[0] / 255, g: n[1] / 255, b: n[2] / 255, a: n[3] ?? 1 };
  };
  const sets = key =>
    Object.fromEntries(
      modes.map(m => [
        m.id,
        source.scenes[m.id][key].roots.flatMap(r => [r.root, ...r.children]),
      ])
    );
  function matching(nodes, predicate) {
    const result = {};
    for (const m of modes) result[m.id] = nodes[m.id].filter(predicate);
    for (const m of modes)
      if (result[m.id].length !== result.undrr.length)
        fail('Source anatomy changed');
    return result;
  }
  function one(nodes, predicate, index = 0) {
    const matches = matching(nodes, predicate);
    const result = {};
    for (const m of modes) {
      if (!matches[m.id][index]) fail('Missing measured anatomy');
      result[m.id] = matches[m.id][index];
    }
    return result;
  }
  let sceneKey;
  const float = (key, all, field) => {
    const values = modes.map(m => all[m.id][field]);
    if (!values.every(Number.isFinite)) fail('Source geometry nonfinite');
    return values.every(x => x === values[0])
      ? values[0]
      : role(
          sceneKey + '/' + key + '-' + field,
          'FLOAT',
          m => all[m.id][field],
          ['WIDTH_HEIGHT']
        );
  };
  const color = (key, all, field = 'color', scope = 'FRAME_FILL') => {
    const base = [
      'color/interactive',
      'color/neutral-800',
      'color/neutral-600',
      'color/neutral-0',
    ].find(name =>
      modes.every(m => {
        const measured = rgba(all[m.id][field]),
          token = resolve(name, m, 'COLOR');
        return ['r', 'g', 'b'].every(
          k => measured[k] === Math.round(token[k] * 255) / 255
        );
      })
    );
    if (!base) fail('Measured source paint requires remeasurement: ' + key);
    return role(
      key,
      'COLOR',
      m => {
        const a = rgba(all[m.id][field]).a;
        return a === 1 ? { alias: base } : { ...resolve(base, m, 'COLOR'), a };
      },
      [scope]
    );
  };
  function fixed(id, all, parent, children = [], fill, clips = false) {
    const base = all.undrr,
      origin = parent?.undrr ?? { x: 0, y: 0 };
    for (const m of modes)
      if (
        all[m.id].x - (parent?.[m.id].x ?? 0) !== base.x - origin.x ||
        all[m.id].y - (parent?.[m.id].y ?? 0) !== base.y - origin.y
      )
        fail('Mode-dependent source positions need explicit bound contract');
    return {
      id,
      type: 'FRAME',
      name: base.cls || base.tag,
      position: { x: base.x - origin.x, y: base.y - origin.y },
      layout: {
        mode: 'NONE',
        width: float(id, all, 'w'),
        height: float(id, all, 'h'),
        clipsContent: clips,
      },
      ...(fill ? { fill } : {}),
      children,
    };
  }
  function style(key, all, decoration = 'NONE') {
    const id = 'component/page-chrome-open/' + key;
    const values = Object.fromEntries(
      modes.map(m => {
        const n = all[m.id],
          font = n.font.includes('Roboto Condensed')
            ? 'Roboto Condensed'
            : 'Roboto',
          weight = Number(n.weight);
        if (![400, 600, 700].includes(weight))
          fail('Unsupported measured font weight');
        return [
          m.id,
          {
            fontName: {
              family: font,
              style: weight === 400 ? 'Regular' : 'Bold',
            },
            fontSize: parseFloat(n.size),
            lineHeight: { unit: 'PIXELS', value: parseFloat(n.line) },
            letterSpacing: { unit: 'PIXELS', value: 0 },
            textCase: 'ORIGINAL',
            textDecoration: decoration,
            paragraphSpacing: 0,
          },
        ];
      })
    );
    const size = role(key + '-size', 'FLOAT', m => values[m.id].fontSize, [
      'FONT_SIZE',
    ]);
    upsert(
      styles.text,
      {
        id,
        name: 'Mangrove draft / Open page chrome / ' + key,
        description:
          'Source computed named face; requested600 maps to bundled Bold700 as explicit browser-face inference, not native acceptance.',
        sourceRef: ref,
        bindings: {
          fontFamily: all.undrr.font.includes('Roboto Condensed')
            ? 'font-family/ui'
            : 'font-family/text',
          fontSize: size,
        },
        values,
      },
      'id'
    );
    return id;
  }
  function textBox(id, all, parent, characters, property, options = {}) {
    if (!characters) fail('Missing authored text');
    const text = {
      id: id + '-text',
      type: 'TEXT',
      name: id + ' source text',
      characters,
      textProperty: property,
      textStyle: style(id, all, options.underline ? 'UNDERLINE' : 'NONE'),
      fill: color(id + '-text', all, 'color', 'TEXT_FILL'),
      textWrap: 'AUTO',
      layout: { width: 'FILL', height: 'HUG' },
    };
    const box = fixed(id, all, parent, [text]);
    // Retain actual source line allocation and padding. Glyph pixels are separate.
    box.layout.mode = 'VERTICAL';
    if (options.padding) box.layout.padding = options.padding;
    return box;
  }
  function shadow(id, all) {
    const key = 'component/page-chrome-open/' + id;
    const count = (all.undrr.shadow.match(/rgba?\([^)]+\) [^,]+/g) || [])
      .length;
    const colors = Array.from({ length: count }, (_, i) =>
      role(
        id + '-shadow-' + i,
        'COLOR',
        m => {
          const s = all[m.id].shadow.match(/rgba?\([^)]+\) [^,]+/g)[i];
          return rgba(/^(rgba?\([^)]+\))/.exec(s)[1]);
        },
        ['EFFECT_COLOR']
      )
    );
    const values = Object.fromEntries(
      modes.map(m => {
        const sourceShadows =
          all[m.id].shadow.match(/rgba?\([^)]+\) [^,]+/g) || [];
        if (sourceShadows.length !== count) fail('Source shadows changed');
        return [
          m.id,
          sourceShadows.map((s, i) => {
            const a =
              /^(rgba?\([^)]+\)) (-?[\d.]+)px (-?[\d.]+)px (-?[\d.]+)px (-?[\d.]+)px( inset)?$/.exec(
                s
              );
            if (!a) fail('Source shadow ' + s);
            return {
              effect: {
                type: a[6] ? 'INNER_SHADOW' : 'DROP_SHADOW',
                color: rgba(a[1]),
                offset: { x: Number(a[2]), y: Number(a[3]) },
                radius: Number(a[4]),
                spread: Number(a[5]),
                visible: true,
                blendMode: 'NORMAL',
              },
              bindings: { color: colors[i] },
            };
          }),
        ];
      })
    );
    upsert(
      styles.effect,
      {
        id: key,
        name: 'Mangrove draft / Open page chrome / ' + id,
        sourceRef: ref,
        values,
      },
      'id'
    );
    return key;
  }
  const cappedActions = [901, 1164].map(width => {
    sceneKey = 'desktop-sendai-' + width;
    const cta = one(
      sets(sceneKey),
      n => n.cls === 'mg-button mg-button-primary'
    );
    const w = float('action-slot', cta, 'w'),
      h = float('action-slot', cta, 'h');
    for (const m of modes) {
      const n = cta[m.id],
        template = styles.text.find(s => s.id === 'component.button')?.values[
          m.id
        ];
      if (
        !template ||
        template.fontName.family !== 'Roboto' ||
        template.fontName.style !== 'Bold' ||
        template.fontSize !== parseFloat(n.size)
      )
        fail('Source capped action face changed');
      const line =
        template.lineHeight?.unit === 'PERCENT'
          ? (template.fontSize * template.lineHeight.value) / 100
          : template.lineHeight?.unit === 'PIXELS'
            ? template.lineHeight.value
            : NaN;
      if (line !== parseFloat(n.line))
        fail('Source capped action line height changed');
      if (
        resolve('padding/button/block', m, 'FLOAT') !== parseFloat(n.pad[0]) ||
        resolve('padding/button/inline', m, 'FLOAT') !== parseFloat(n.pad[1]) ||
        resolve('border-width/button', m, 'FLOAT') !== parseFloat(n.border[0])
      )
        fail('Source capped action box changed');
      if (
        n.textAlign !== 'start' ||
        n.radius.some(
          x => parseFloat(x) !== resolve('radius/button', m, 'FLOAT')
        ) ||
        parseFloat(n.gap) !== resolve('spacing/50', m, 'FLOAT')
      )
        fail('Source capped action radius/gap/alignment changed');
      function samePaint(measured, token) {
        return (
          ['r', 'g', 'b'].every(
            k => measured[k] === Math.round(token[k] * 255) / 255
          ) && measured.a === token.a
        );
      }
      if (
        !samePaint(rgba(n.color), resolve('color/button', m, 'COLOR')) ||
        n.borderColors.some(
          x =>
            !samePaint(
              rgba(x),
              resolve('border-color/button-primary', m, 'COLOR')
            )
        )
      )
        fail('Source capped action text/border paint changed');
      const measured = rgba(n.bg),
        paint = resolve('color/button-background', m, 'COLOR');
      if (!samePaint(measured, paint))
        fail('Source capped action paint changed');
    }
    return {
      id: 'page-chrome-capped-action.sendai-' + width,
      name: 'SourceViewport=' + width + ', Section=Sendai',
      properties: { SourceViewport: String(width), Section: 'Sendai' },
      sourceGeometry: {
        sourceMaxWidth: true,
        labelWidth: 'FILL',
        capturedHeight:
          'Finite source one/two-line allocation, native wrapping verification open',
      },
      tree: {
        id: 'root',
        type: 'FRAME',
        name: 'Source capped mg-button primary',
        layout: {
          mode: 'HORIZONTAL',
          width: w,
          height: h,
          gap: 'spacing/50',
          padding: {
            block: 'padding/button/block',
            inline: 'padding/button/inline',
          },
          align: 'CENTER',
          justify: 'CENTER',
        },
        strokeAlign: 'INSIDE',
        strokesIncludedInLayout: true,
        bindings: {
          cornerRadius: 'radius/button',
          strokeWeight: 'border-width/button',
        },
        fill: 'color/button-background',
        stroke: 'border-color/button-primary',
        children: [
          {
            id: 'label',
            type: 'TEXT',
            name: 'Source capped mg-button label',
            characters: cta.undrr.text,
            textProperty: 'Label',
            textStyle: 'component.button',
            fill: 'color/button',
            textWrap: 'AUTO',
            textAlign: 'LEFT',
            layout: { width: 'FILL', height: 'HUG' },
          },
        ],
      },
    };
  });
  const desktop = ['about', 'work', 'sendai', 'news'].flatMap(section =>
    [901, 1164, 1440].map(width => {
      const key = 'desktop-' + section + '-' + width;
      sceneKey = key;
      const nodes = sets(key),
        panel = one(nodes, n => n.tag === 'ARTICLE'),
        left = one(nodes, n => n.cls === 'mg-mega-content__left'),
        banner = one(nodes, n => n.cls === 'mg-mega-content__banner'),
        right = one(nodes, n => n.cls === 'mg-mega-content__right'),
        list = one(nodes, n => n.cls === 'mg-mega-content__menu--desktop'),
        heading = one(nodes, n => n.tag === 'HEADER'),
        paragraph = one(nodes, n => n.tag === 'P'),
        cta = one(nodes, n => n.cls === 'mg-button mg-button-primary');
      const children = [
        textBox(
          'desktop-heading',
          heading,
          banner,
          heading.undrr.text,
          'Heading'
        ),
        textBox(
          'desktop-summary',
          paragraph,
          banner,
          paragraph.undrr.text,
          'Summary'
        ),
      ];
      children.push(
        fixed('action-slot', cta, banner, [
          {
            id: 'action',
            type: 'INSTANCE',
            name: 'Exact source mg-button primary',
            family:
              section === 'sendai' && width !== 1440
                ? 'page-chrome-capped-action'
                : 'page-chrome-button',
            variant:
              section === 'sendai' && width !== 1440
                ? { SourceViewport: String(width), Section: 'Sendai' }
                : {
                    Emphasis: 'Primary',
                    Treatment: 'Filled',
                    State: 'Default',
                  },
            overrides: { Label: cta.undrr.text },
            expose: true,
            layout:
              section === 'sendai' && width !== 1440
                ? {
                    width: float('action-slot', cta, 'w'),
                    height: float('action-slot', cta, 'h'),
                  }
                : { width: 'HUG', height: 'HUG' },
          },
        ])
      );
      const bannerTree = fixed('banner', banner, left, children),
        leftTree = fixed(
          'left',
          left,
          panel,
          [bannerTree],
          color('left-background', left, 'bg')
        );
      leftTree.children.push({
        id: 'left-border',
        type: 'FRAME',
        name: 'Source end border',
        layout: { mode: 'NONE', width: 1, height: 350 },
        position: { x: left.undrr.w - 1, y: 0 },
        fill: role(
          'left-border',
          'COLOR',
          m => ({ ...resolve('color/neutral-600', m, 'COLOR'), a: 0.24 }),
          ['FRAME_FILL']
        ),
        children: [],
      });
      const links = matching(nodes, n => n.tag === 'A' && n.cls === '');
      if (links.undrr.length !== 4) fail('Four authored About links required');
      const linkTrees = links.undrr.map((n, i) => {
        const all = Object.fromEntries(modes.map(m => [m.id, links[m.id][i]]));
        return textBox(
          'desktop-item-' + (i + 1),
          all,
          list,
          n.text,
          'Item ' + (i + 1),
          { padding: { inline: 5, block: 5 } }
        );
      });
      const rightTree = fixed('right', right, panel, [
        fixed('items', list, right, linkTrees),
      ]);
      const tree = fixed(
        'root',
        panel,
        null,
        [leftTree, rightTree],
        'color/neutral-0',
        false
      );
      delete tree.position;
      tree.effectStyle = shadow('desktop-panel', panel);
      return {
        id: 'page-chrome-desktop-panel.' + section + '-' + width,
        name: 'Viewport=' + width + ', Section=' + section,
        properties: {
          Viewport: String(width),
          Section:
            section === 'about'
              ? 'About'
              : section[0].toUpperCase() + section.slice(1),
        },
        sourceGeometry: {
          top: panel.undrr.y,
          height: 350,
          viewportHeight: 1000,
          context:
            'Overlay anchored after existing closed chrome flow, not an expanded header.',
        },
        tree,
      };
    })
  );
  const chevron =
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>';
  const mobile = [390, 899].flatMap(width =>
    ['all', 'about', 'work', 'sendai', 'news'].map(level => {
      const key = 'mobile-' + level + '-' + width;
      sceneKey = key;
      const nodes = sets(key),
        overlay = one(nodes, n =>
          n.cls.startsWith('mg-mega-mobile-sidebar-overlay')
        ),
        surface = one(nodes, n =>
          n.cls.startsWith(
            'mg-mega-mobile-sidebar mg-mega-mobile-sidebar--progressive'
          )
        ),
        header = one(nodes, n => n.cls === 'mg-mega-mobile-sidebar__header'),
        page = one(nodes, n =>
          n.cls.startsWith('mg-mega-mobile-sidebar__page')
        ),
        close = one(nodes, n => n.cls === 'mg-mega-mobile-sidebar__close'),
        closeIcon = one(nodes, n => n.tag === 'SPAN' && n.text === '×'),
        title = one(nodes, n => n.cls === 'mg-mega-mobile-sidebar__title'),
        list = one(nodes, n => n.cls === 'mg-mega-sidebar__list');
      function controlLabel(id, all, parent, index = 0) {
        const textAll = Object.fromEntries(
          modes.map(m => {
            const n = all[m.id],
              r = n.texts[index];
            if (!r) fail('Missing direct source text');
            return [
              m.id,
              {
                ...n,
                x: r.x,
                y: n.y + (n.h - parseFloat(n.line)) / 2,
                w: r.w,
                h: parseFloat(n.line),
              },
            ];
          })
        );
        return textBox(id, textAll, parent, all.undrr.texts[index].text, id);
      }
      const closeTree = fixed('close', close, header, [
        controlLabel('close-label', close, close),
        textBox('close-icon', closeIcon, close, '×', 'Close icon'),
      ]);
      const headerTree = fixed(
        'header',
        header,
        surface,
        [closeTree],
        'color/neutral-0'
      );
      headerTree.effectStyle = shadow('mobile-header', header);
      const pageChildren = [];
      if (level !== 'all') {
        const back = one(nodes, n => n.cls === 'mg-mega-mobile-sidebar__back'),
          arrow = one(nodes, n => n.cls === 'mg-mega-mobile-sidebar__arrow');
        pageChildren.push(
          fixed('back', back, page, [
            controlLabel('back-label', back, back),
            textBox('back-arrow', arrow, back, '←', 'Back arrow'),
          ])
        );
      }
      pageChildren.push(
        textBox(
          'mobile-heading-' + level,
          title,
          page,
          level === 'all'
            ? 'All sections'
            : one(nodes, n => n.cls === 'mg-mega-mobile-sidebar__title-link')
                .undrr.text,
          'Heading',
          { underline: level !== 'all' }
        )
      );
      const entries = matching(
        nodes,
        n => n.cls === 'mg-mega-sidebar-section__item'
      );
      if (entries.undrr.length !== 4)
        fail('Four authored mobile entries required');
      const entriesTrees = entries.undrr.map((n, i) => {
        const all = Object.fromEntries(
          modes.map(m => [m.id, entries[m.id][i]])
        );
        if (level !== 'all')
          return textBox(
            'mobile-about-item-' + (i + 1),
            all,
            list,
            n.text,
            'Item ' + (i + 1),
            { padding: { inline: 10, block: 10 } }
          );
        const label = Object.fromEntries(
          modes.map(m => {
            const a = all[m.id];
            return [
              m.id,
              {
                ...a,
                x: a.x + 10,
                y: a.y + 15,
                w: a.w - 48,
                h: parseFloat(a.line),
              },
            ];
          })
        );
        const itemTree = fixed('mobile-all-item-' + (i + 1), all, list, [
          textBox(
            'caption-' + (i + 1),
            label,
            all,
            n.texts[0].text,
            'Item ' + (i + 1)
          ),
        ]);
        const icons = matching(
            nodes,
            n => n.cls === 'mg-mega-mobile-sidebar__chevron'
          ),
          svgAll = Object.fromEntries(modes.map(m => [m.id, icons[m.id][i]]));
        itemTree.children.push({
          id: 'chevron-' + (i + 1),
          type: 'SVG',
          name: 'Exact source progressive chevron',
          position: {
            x: svgAll.undrr.x - all.undrr.x,
            y: svgAll.undrr.y - all.undrr.y,
          },
          layout: { width: 18, height: 18 },
          svg: {
            assetId: 'page-chrome.mobile-chevron',
            markup: chevron,
            monochrome: {
              strokes: color('mobile-chevron', all, 'color', 'STROKE_COLOR'),
            },
          },
        });
        return itemTree;
      });
      pageChildren.push(fixed('items', list, page, entriesTrees));
      if (level !== 'all') {
        const intro = one(
            nodes,
            n => n.cls === 'mg-mega-mobile-sidebar__intro'
          ),
          p = one(nodes, n => n.tag === 'P');
        pageChildren.push(
          fixed('intro', intro, page, [
            textBox('mobile-summary', p, intro, p.undrr.text, 'Summary'),
          ])
        );
      }
      const surfaceTree = fixed(
        'surface',
        surface,
        overlay,
        [headerTree, fixed('page', page, surface, pageChildren)],
        'color/neutral-0',
        false
      );
      surfaceTree.effectStyle = shadow('mobile-surface', surface);
      const tree = fixed(
        'root',
        overlay,
        null,
        [surfaceTree],
        color('mobile-backdrop', overlay, 'bg')
      );
      delete tree.position;
      return {
        id: 'page-chrome-mobile.' + level + '-' + width,
        name: 'Viewport=' + width + ', Level=' + level,
        properties: { Viewport: String(width), Level: level },
        sourceGeometry: {
          viewportHeight: 1000,
          surfaceHeight: surface.undrr.h,
          context:
            'Fixed progressive modal overlay. Existing page remains behind translucent backdrop.',
        },
        tree,
      };
    })
  );
  const limitations = [
    'English authored UndrrChrome all four desktop panels and AllSections plus all four mobile sections, viewportheight1000. General nested and custom caller content remain pending.',
    'Finite measured source allocations with editable text, exact normal Button dependency where unwrapped and two capped source action presets where source wraps, not arbitrary nested MegaMenu or locale/RTL coverage.',
    'Desktop requested600 Button and mobile drill-in requested600 use bundled Bold700 as browser-face inference. Native font pixels and live mode acceptance remain open.',
    'Source fixed mobile backdrop and surface are independent overlay compositions. Do not include their height in normal header flow.',
    'No keyboard, focus trap, hover, click, URL navigation, sticky scrolling, safe-area environment, motion or publication acceptance is inferred.',
  ];
  const scopedProperties = new Set([
    'Heading',
    'Summary',
    'Item 1',
    'Item 2',
    'Item 3',
    'Item 4',
  ]);
  for (const variants of [desktop, mobile]) {
    const sharedDefaults = new Map();
    for (const variant of variants) {
      function scope(node) {
        if (scopedProperties.has(node.textProperty)) {
          // Native TEXT defaults belong to the whole set. Keep distinct
          // authored presentation contexts stable when their copy changes.
          node.textProperty = variant.id + ' ' + node.textProperty;
        } else if (node.textProperty) {
          if (
            sharedDefaults.has(node.textProperty) &&
            sharedDefaults.get(node.textProperty) !== node.characters
          )
            fail('Unscoped differing source text default ' + node.textProperty);
          sharedDefaults.set(node.textProperty, node.characters);
        }
        for (const child of node.children || []) scope(child);
      }
      scope(variant.tree);
    }
  }
  return [
    {
      id: 'page-chrome-capped-action',
      kind: 'component-set',
      name: 'Page chrome / Authored capped action',
      description:
        'Source capped Sendai CTA with FILL Label, exact mode-driven finite source box.',
      sourceRef: ref,
      review: { genericLabels: false, preserveVariantSizing: true },
      defaultVariantId: 'page-chrome-capped-action.sendai-901',
      limitations,
      variants: cappedActions,
    },
    {
      id: 'page-chrome-desktop-panel',
      kind: 'component-set',
      name: 'Page chrome / Authored English desktop panels',
      description:
        'Exact source authored four-section flyouts with all sixteen links, summaries and real source actions.',
      sourceRef: ref,
      review: { genericLabels: false, preserveVariantSizing: true },
      defaultVariantId: 'page-chrome-desktop-panel.about-1164',
      limitations,
      variants: desktop,
    },
    {
      id: 'page-chrome-mobile',
      kind: 'component-set',
      name: 'Page chrome / Authored progressive mobile',
      description:
        'Actual progressive first level and all four authored section levels with close/back/list/intro/backdrop.',
      sourceRef: ref,
      review: { genericLabels: false, preserveVariantSizing: true },
      defaultVariantId: 'page-chrome-mobile.all-390',
      limitations,
      variants: mobile,
    },
  ];
}
module.exports.buildPageChromeOpenRecipes = buildPageChromeOpenRecipes;
module.exports.OPEN_HASHES = OPEN_HASHES;
