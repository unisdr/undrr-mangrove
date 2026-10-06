/** Authored ContentHub source contracts. Finite source allocations, native acceptance open. */
'use strict';
const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');
const ASSET = 'examples/figma-plugin/holistic/assets/content-hub/';
const SOURCE_HASHES = {
  'stories/Components/Cards/Card/card.scss':
    'e5220ce8519237793fc7a1045ea38342a887ec02681309aa8667d1928f3d25a3',
  'stories/Components/TextCta/text-cta.scss':
    '578ce5ac580d71f88c2efb4271263f4ac8bab3b7c0ea4d4fe34c2de143c88271',
  'examples/figma-plugin/holistic/assets/content-hub/band-source-diagnostics.json':
    'd0fa39c95486700fb80d4600aeff0cc3e6a8f4e9a7442a3b19c48a094263cae8',
  'stories/Components/Breadcrumbs/breadcrumbs.scss':
    '10da218994e22c2b70f6b397af6bea20dd78bbadd7e66eb1f78262b15db8df24',
  'examples/figma-plugin/holistic/assets/content-hub/card-caret-source.json':
    'cbf390edd840c12043f76cb8292c0291de408ea84eb91dd26f5611f2e4c5f99a',
  'examples/figma-plugin/holistic/assets/content-hub/card-caret-mirror-capture.js':
    'b6c2a5782d1ae9d1b27c7b4de7952c72e58560eb53536a0e94f3192f1a9b9925',

  'examples/figma-plugin/holistic/assets/content-hub/card-effects-source.json':
    '2c52cc69118c7bd3d4ea35904a8a57cd56309b53007f90b764b838c9825da46c',
  'examples/figma-plugin/holistic/assets/content-hub/current-css-source-comparison.json':
    '19419866b31ec18b5233d5d7d0f2c9147be735f8b50fbb853e21c306cba0e311',
  'stories/Atom/Icons/_icon-definitions.scss':
    'ce483a74e800148a703ef73d85f7bb11c3982cbbd07f477cc52db8a1ece8138e',
  'stories/Atom/Icons/Icons.json':
    '842ec2638b53e0de3a4dee3ab4ab026842d5c43957e89b5c4f096132520da059',
  'examples/figma-plugin/holistic/assets/card-content/lucide-LICENSE.txt':
    'b495047bd93a9b06913511076f504daba17d5bbeb3e0650f3bb53a4220329c57',
  'examples/figma-plugin/holistic/assets/content-hub/card-source-provenance.json':
    '4e83f6719a6bac70ecdc4e448eb1230dc1b3dc967600db6ce1b5e37197239bdd',
  'examples/figma-plugin/holistic/assets/card-content/tags-source-mask.svg':
    'b17ac9d28d08dd9e6d0e8727ae48d9d2009bc0a03bc5211eaedaf2d26f3b72b3',
  'examples/figma-plugin/holistic/assets/card-content/file-alt-source-mask.svg':
    'b99958ee0a0c54473a3920dd855db4887bf9618c04c702c20c3752bc8bbb0a66',
  'examples/figma-plugin/holistic/assets/card-content/chart-bar-source-mask.svg':
    '67c6c8931f40cb9496965d66f9d5cc6752818756240476b23fbb152963fa0f4a',
  'examples/figma-plugin/holistic/assets/content-hub/globe-source-mask.svg':
    '4f3c367fe49416226ca78ad1927f61b7251f7283afa4222c8e9b27e6851762aa',
  'examples/figma-plugin/holistic/assets/card-content/cubes-source-mask.svg':
    '7bebbb1ec2224aec16717555cbc5a3eeb51b292b03c9078e5bc74e0127024d87',
  'examples/figma-plugin/holistic/assets/content-hub/lightbulb-source-mask.svg':
    '556667f232e085711091b736c88db9f66267941f28c1bf1f49d494de0dae18ed',
  'examples/figma-plugin/holistic/assets/content-hub/info-circle-source-mask.svg':
    'b96c46f21c09e98bad0f6122de9fbdd47cc83ef4fe08db26befe0a62645b0496',

  'examples/figma-plugin/holistic/assets/content-hub/captured-style-all.css':
    '9b7d0009d6c067974d127aa9f87c7fd1ec00ba840fc576ed4d23903386771858',
  'examples/figma-plugin/holistic/assets/content-hub/generated-css-additions.diff':
    '09c4476c897d402bc048feb700b38cdb9c0f580c98e6d551a333edc0908abe0d',
  'examples/figma-plugin/holistic/assets/content-hub/generated-css-transition.json':
    '0f8801b5292a562a5f92060d258bfb75c2ebbe6b6b23c812bc7a37e374953cdb',

  'scripts/figma-page-reading-recipes.cjs':
    '27a6e05d2b67ca8a7f69aa6a956d5779aeb0f99c443bff6407b20c2cfafcc270',
  '.storybook/preview.js':
    'e19af50151293071b3f87910cded15f2cb7835dbffd125085f3708a257221814',
  'stories/Atom/Icons/Icon.jsx':
    'b3c0653cc27ac62ac5cf282da063179277fcdc80f71919120eb13b8849527347',
  'stories/Atom/Icons/_icon-definitions.scss':
    'ce483a74e800148a703ef73d85f7bb11c3982cbbd07f477cc52db8a1ece8138e',
  'stories/Atom/Icons/icons.scss':
    'e15a7a74a319eac6b2d5f48d18b3a5cdb908e50756b7fe638e52cd41a23459bb',
  'stories/Atom/Layout/Container/container.scss':
    'f62790c55115a47c9291ee2ba3f62b717bf00a698407529e64ffcd97a58af118',
  'stories/Atom/Layout/Grid/grid.scss':
    '2a43bce37aac655ddbd3071a53fdcfd3e8695ca37abce98cad374f1f4098ae9e',
  'stories/Atom/Logo/Logo.jsx':
    '583a090c0dd6126c2c935ec4136b37d563da0e0b587b19039797113e34f681a0',
  'stories/Atom/Logo/undrr-logo-assets.js':
    '887213707bc49d6bb0a1fe5d0ade476cd940fd830c1518477c8e46c86337e5f4',
  'stories/Components/Buttons/CtaButton/CtaButton.jsx':
    'a21ece51b122636a0221bdecd60f38000e839ce7333272776ce26809cc8f6167',
  'stories/Components/Buttons/CtaButton/cta-button.scss':
    'f1534e70a4c4c1d60dea8356fdef4b4b476e49d93c3ed310557f898d3bc5a40b',
  'stories/Components/Cards/Card/VerticalCard.jsx':
    '9a979e43f9c47e5c58e4e8f75b59c194080fc5a34f48ac6cb32c42640971529e',
  'stories/Components/Cards/Card/cardParts.jsx':
    'ff7ef9eb6fe17893c11ea9ee4135294011aedab580be1175bd7d7ae7c49e68bc',
  'stories/Components/Cards/IconCard/IconCard.jsx':
    '3aa5320c55ae2c616243761097d9a1dfc3cba19b3360d0af5fa955fc9735afdb',
  'stories/Components/Hero/Hero.jsx':
    'e668f960d34d834f878f294fa3d2563b68eec56566d4601b41875d97567e7a4c',
  'stories/Components/MegaMenu/MegaMenu.jsx':
    '3ab150246239afb941bd650a0e5b5c534bc91d5b959c4577eb63796285f0bfc5',
  'stories/Components/MegaMenu/Section/Section.jsx':
    'e04e35ec2b85a6b0d20d578604f86f3432f724d8328123c119820a9030a34345',
  'stories/Components/MegaMenu/TopBar/Sidebar.jsx':
    '270b31598a7d22650d7fcc29a888228b904870c2fcde3cc0ebac1140586afbc8',
  'stories/Components/MegaMenu/TopBar/TopBar.jsx':
    '3dd25a32332d36d3ed291a4856df32fb6285013a14c15d3359527bb6c1beca62',
  'stories/Components/MegaMenu/TopBar/TopBarItem.jsx':
    '0422292f47eacdeac4453b8ea4ffdd958e1d4461d420d91177169e3419fbd532',
  'stories/Components/MegaMenu/TopBar/TopBarMobileIconButton.jsx':
    'b036d3131eb739812720df0094114cc321c39bd3261af042f88d658fcfe2187c',
  'stories/Components/MegaMenu/_labels.js':
    '78966c179d36177bb4290dc9135d17be16939b7e227dd7c5b4818eeb64f6ac55',
  'stories/Components/PageHeader/PageHeader.jsx':
    '93e1d871ba19a14f3815476947fcdbb002d0f801ec5f9f8b56f712bd2d5ed2c1',
  'stories/Components/TableOfContents/TableOfContents.jsx':
    '646e0361f7e48fa8ae6f29335c8c5612847d05c8bf1524a5e1a553e8f52cf5d3',
  'stories/Components/TableOfContents/js/TableOfContentsVanillaJs.js':
    'd774350e29edda8912305b45f1bb1e86ca3d066059ef7b83f772b45e03a8266b',
  'stories/Components/TextCta/TextCta.jsx':
    'fc7d0ca25403ed44a3143e50f843f343839c8dbb6ac28ba370c16accf6239b79',
  'stories/Patterns/ContentHub/ContentHub.jsx':
    'f796f5208bef0ea6635b99a7cad6e2ffb626787deeabc6dd7821e7defa3a9864',
  'stories/Patterns/ContentHub/ContentHub.stories.jsx':
    '43375f59695d618ca5b2ebf4a0fff0bf21cd539bb1f8f255a46a33fedb35fa0a',
  'stories/Patterns/HubHeader/HubHeader.jsx':
    'd70c79b4ecba548d5c7961cb670a76ded5bfb71df44de56b90d367c2ce3f5888',
  'stories/Patterns/HubHeader/hub-header.scss':
    'b03d84235eafc79b6a5af35ebac422f8cf51b0b75d9df41e48d836cba0cbf966',
  'stories/Patterns/_shared/UndrrChrome.jsx':
    '2ad9ca0eb356dedd24b2fb7e667d24940281dd9d3f551a6eaa558756219266b5',
  'stories/Patterns/_shared/pattern-demo.scss':
    'd99057b1f5bb32dfb55fe08f4fb22a56b59b9384ebe3709213c4543ad82d793d',
  'stories/Utilities/FullWidth/full-width.scss':
    '7f10dc1976b1d3701fb467e7e2a392db7ad6589195f4ec63c7aabcfd202f517a',
  'stories/Utilities/PagePatterns/page-patterns.scss':
    '54998879cf42ded7facf2a46fd41312f9540df1cc652792d1b41bcde40750be6',
  'stories/Utilities/SkipLink/SkipLink.jsx':
    'bafb23e3cbb053fc4dc4489b679e43838e91c8a3da83026830b7cd15daf1db65',
  'stories/assets/css/style-all.css':
    'acb6f838389dcee95261125304bce6f30377acc140c71d7dffbd7548a405e841',
  'stories/assets/fonts/roboto-condensed/roboto-condensed.scss':
    '206a320cb9cefbabb300a7bd233a2950267ebdf087cf026e5c3d8279a41ada02',
  'stories/assets/fonts/roboto-condensed/sass/_Bold.scss':
    'efc8c49d945c5d2cd940ed51f2cf1fc16d6011cc5f4ac85bbaaca1868bccb70b',
  'stories/assets/fonts/roboto-condensed/sass/_BoldItalic.scss':
    '0a140e560d1ac75b0e8ff0ed70612c8904d6c08e1a2d661a396f21787eb99644',
  'stories/assets/fonts/roboto-condensed/sass/_Italic.scss':
    '2710a5af4a38f484c1d53c2d3c440a7d4d94239f0bbfb41806a7634bd1ed1eeb',
  'stories/assets/fonts/roboto-condensed/sass/_Light.scss':
    '35dbd2fd493e40cc17c8192c6610719cfad55708e689332c3514586948ed1b8a',
  'stories/assets/fonts/roboto-condensed/sass/_LightItalic.scss':
    'a85a38ce32eb4a750a452309123e9b382321867d34e8ed0c4b8d201162f81380',
  'stories/assets/fonts/roboto-condensed/sass/_Regular.scss':
    '83e36cfc43d952acf7e4e15f3f8068de84930b5412a433926fab097d44105ce7',
  'stories/assets/fonts/roboto-condensed/sass/_mixins.scss':
    'a53206df9ff982de438f1472ccb571acb7c923d2fdcc8c72f2ce5ece96a1f6d4',
  'stories/assets/fonts/roboto-condensed/sass/_variables.scss':
    'af157df7df4276d396e7a636039dd353e9e9849163564b30dbbb299aafc34940',
  'stories/assets/fonts/roboto/roboto.scss':
    'b881ae0ebeb56f49523c791faafc1a10299fc1d7a875fa91c028b06164b8197c',
  'stories/assets/fonts/roboto/sass/_Black.scss':
    '1d6ef057178c2e90eb539ccfa3b491121465388c86df9396a23e61ce672306ba',
  'stories/assets/fonts/roboto/sass/_BlackItalic.scss':
    '32fd04227e1267b18d512cee32b4ac07fb527c0d9c3d9f0514f3e12b5ee2ca26',
  'stories/assets/fonts/roboto/sass/_Bold.scss':
    '9f24cf0a077b2087c47c55bbb665a4086a38818680eee9ca0dfac4c0ce0d273e',
  'stories/assets/fonts/roboto/sass/_BoldItalic.scss':
    '94f40e36a612417be36294f5f8fb084c73ccce4d63cc5456fdaa80b738ad1355',
  'stories/assets/fonts/roboto/sass/_Italic.scss':
    'bbf29ea2da948bbd1827da7c8f1c7c95e3e8e74584445663670ded67fcbf8696',
  'stories/assets/fonts/roboto/sass/_Light.scss':
    '6bf61d8ef2335ffd7b24ae23a8a57b365e9b34c5903ea522302af70dd8157c79',
  'stories/assets/fonts/roboto/sass/_LightItalic.scss':
    '8dd3fdcbffe81a565626b704042d2f78da559929f35ea7fbff46b1af573665ce',
  'stories/assets/fonts/roboto/sass/_Medium.scss':
    'a4604935605d15b5eeb12d7f8700e91f637ef5b545dd757ac232953ffdece828',
  'stories/assets/fonts/roboto/sass/_MediumItalic.scss':
    '2222a82fffa39f7d206e5c65f328c071953b87ff1017b879ba5cec4dad4496c9',
  'stories/assets/fonts/roboto/sass/_Regular.scss':
    'cb27bc0dd02ba21b4dda3249a59e352e0a42c5ea45b83d7cba0a1a2cb79f5845',
  'stories/assets/fonts/roboto/sass/_Thin.scss':
    'facf43a4cf07c2d0c10599ce30c8cea4bd548dc2093b5efbf101bff4be715f10',
  'stories/assets/fonts/roboto/sass/_ThinItalic.scss':
    '7ed1ce2b3c874ee702a9403be9662effadd71e3fa915ffc7f9931ffbf23796db',
  'stories/assets/fonts/roboto/sass/_mixins.scss':
    'da42b1344b5a5ca7c059c96374b92286381a0a36e2d0ffadefe30683c2e916a7',
  'stories/assets/fonts/roboto/sass/_variables.scss':
    'ce141aa75263b9b51a301463ddc4ac755458baf84c6636f854852394a6190ea6',
  'stories/assets/fonts/roboto/sass/roboto.scss':
    '75c8844d28fcac10876344d0690fe21b9d99c28e486c824d00f6262aaf595919',
  'stories/assets/images/undrr-logo-blue.svg':
    'e05a3b32ee677ac7d7ff5347eb0259e394b3e4a836966ee25e0e9556cc3b4e7c',
  'stories/assets/images/undrr-logo-white.svg':
    'f0f1cd9d19fb902c573f8f6146feeaf30cd28e70ee85a67dc2980c7376990f87',
  'stories/assets/js/hub-header.js':
    '903e4ec0573081f341d8021fa0bd68dff07dce33eff46461de8f845161f1f808',
  'stories/assets/js/table-of-contents.js':
    '76760bfdda4368f4810ab6b77bbdc9046d8df905f93e518cc86fbd5431c7c404',
  'stories/assets/scss/_fonts.scss':
    '1c28869b687c358c8c5d28bf5ea563e078b07ee8ae6b3ad5df1244f06fb9d754',
  'stories/assets/scss/_foundational.scss':
    '89f40e9172074d84f101aa6a9d6a048aa6177a67781b8fb672cb4a4c44adbcdf',
  'stories/assets/scss/_mixins.scss':
    '0028b614bb410bd03e6bc6a81e2b42b0daea54a5f6193eca6b7a1130617b9a35',
  'stories/assets/scss/_variables.scss':
    '2c9ce7c4b18d63243e45ad2eaed07c9a6284c0e57ef79a3dc3d37f8521cccdfa',
  'tokens/delta.yaml':
    'aa04fedf9b32bfd4b84ac1d755216824d9c589234ac2fbf67c11388ef55dd3b1',
  'tokens/irp.yaml':
    'b2063159f014824ccfe3edbbbc696ed494fd3dc9113aeddeda089f1828c0ca27',
  'tokens/mangrove.yaml':
    '02449d0cf3aa7e011f767e638637d5dd6427c489d985f36627401db6bf164ec8',
  'tokens/mcr.yaml':
    '4696b9b72028ed4d62e2c69b51a41df8e24f855d138269a84a93530cc10d9188',
  'tokens/preventionweb.yaml':
    '587b72ff245843ec229609c55cda03aa1a2146c35d7bc90c6163f946cd7f08d5',
  'tokens/undrr.yaml':
    '7514567babda3ea49f3af6f0f5fbb194b8fbfcab8bdde7bb061cdd6542959669',
  'examples/figma-plugin/holistic/assets/content-hub/resilient-infrastructure.jpg':
    '99974686a4568ec28531c06344c4c79d19db52d0da2df1c27d05f19825690449',
  'examples/figma-plugin/holistic/assets/content-hub/provenance.json':
    '81aa9c8fc852aaaa67c115c941ce21babab421bb112f169f90b01b7eb1fa8917',
  'examples/figma-plugin/holistic/assets/content-hub/source-footprints.json':
    'a4d6ee5bc333826f9f0669aad296df5718ac5102a2334d3b891e58a6db36cf63',
  'examples/figma-plugin/holistic/assets/content-hub/source-fonts/RobotoCondensed-Regular.woff2':
    '0cdd3d13492236edd2bc1c3d48f7d7f7270b2d52214d2a3d114d6fcb0c6f04d2',
  'examples/figma-plugin/holistic/assets/content-hub/source-fonts/LICENSE.txt':
    'c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4',
  'examples/figma-plugin/holistic/assets/content-hub/source-fonts/RobotoCondensed-Bold.woff2':
    'bd6d419bb130520905ba3ba1525d9e3936b3335cabc9070eeabdfe7e1102d758',
  'examples/figma-plugin/holistic/assets/page-patterns/source-fonts/Roboto-Regular.woff2':
    '47107401d0adb375ab9aa167f9d62489a849d510e740a307b5a4db60e5db3562',
  'examples/figma-plugin/holistic/assets/page-patterns/source-fonts/Roboto-Bold.woff2':
    '8e44376b735dcc9027acbcc8a0df64c3f886a23529eff27b022f344d719e90f2',
  'examples/figma-plugin/holistic/assets/content-hub/tertiary-pseudo-colours.json':
    '58edb46cb9e3fca49984cedab114570e149290c6ed0fdbc71294aa47ccb5251e',
  'scripts/figma-editorial-cta-recipes.cjs':
    'b98bc4d1878bb4280f64705e631dc4299992cf60ea9401b698dfdc2fc1ee6707',
  'scripts/figma-maintenance-editorial-cta-assets.cjs':
    'b8668c266832784939c3f39cc03db5c8ce95f94e471ee15f7eb3d494a9b5131c',
};
function buildContentHubRecipes({ root, modes, variables, styles }) {
  const fail = m => {
    throw new Error('Figma ContentHub source recipes need updating: ' + m);
  };
  for (const [file, hash] of Object.entries(SOURCE_HASHES)) {
    if (
      crypto
        .createHash('sha256')
        .update(fs.readFileSync(path.join(root, file)))
        .digest('hex') !== hash
    )
      fail(file + ' source changed');
  }
  if (
    modes
      .map(m => m.id)
      .sort()
      .join(',') !== 'delta,irp,mcr,preventionweb,undrr'
  )
    fail('Expected all five source modes');
  const source = JSON.parse(
    fs.readFileSync(path.join(root, ASSET + 'source-footprints.json'), 'utf8')
  ).cases;
  const byName = new Map(variables.map(v => [v.name, v])),
    perMode = fn => Object.fromEntries(modes.map(m => [m.id, fn(m)]));
  function value(name, m, type, seen = new Set()) {
    const v = byName.get(name);
    if (!v || v.type !== type || seen.has(name))
      fail('Missing/wrong/circular ' + name);
    seen.add(name);
    const x = v.values[m.id];
    if (x == null) fail('Missing ' + name + '/' + m.id);
    if (typeof x === 'object' && Object.hasOwn(x, 'alias')) {
      if (Object.keys(x).length !== 1 || typeof x.alias !== 'string')
        fail('Malformed alias ' + name);
      return value(x.alias, m, type, seen);
    }
    return x;
  }
  function upsert(list, e) {
    const found = list.filter(x => x.id === e.id || x.name === e.name);
    if (
      found.length > 1 ||
      (found.length && (found[0].id !== e.id || found[0].name !== e.name))
    )
      fail('Foreign identity ' + e.id);
    if (found.length) list[list.indexOf(found[0])] = e;
    else list.push(e);
    if (e.type) byName.set(e.name, e);
  }
  const inputContract = {
    'color/hero': {
      undrr: {
        r: 0,
        g: 0.3098,
        b: 0.5686,
        a: 1,
      },
      delta: {
        r: 0,
        g: 0.3098,
        b: 0.5686,
        a: 1,
      },
      irp: {
        r: 0.0588,
        g: 0.4706,
        b: 0.749,
        a: 1,
      },
      mcr: {
        r: 0.349,
        g: 0.102,
        b: 0.3804,
        a: 1,
      },
      preventionweb: {
        r: 0.0392,
        g: 0.4118,
        b: 0.4118,
        a: 1,
      },
    },
    'color/hero--secondary': {
      undrr: {
        r: 0.9294,
        g: 0.5137,
        b: 0.2471,
        a: 1,
      },
      delta: {
        r: 0.9294,
        g: 0.5137,
        b: 0.2471,
        a: 1,
      },
      irp: {
        r: 0.9294,
        g: 0.5137,
        b: 0.2471,
        a: 1,
      },
      mcr: {
        r: 0.9294,
        g: 0.5137,
        b: 0.2471,
        a: 1,
      },
      preventionweb: {
        r: 0.9294,
        g: 0.5137,
        b: 0.2471,
        a: 1,
      },
    },
    'color/hero--tertiary': {
      undrr: {
        r: 0,
        g: 0,
        b: 0,
        a: 1,
      },
      delta: {
        r: 0.0941,
        g: 0.0941,
        b: 0.1373,
        a: 1,
      },
      irp: {
        r: 0,
        g: 0,
        b: 0,
        a: 1,
      },
      mcr: {
        r: 0,
        g: 0,
        b: 0,
        a: 1,
      },
      preventionweb: {
        r: 0,
        g: 0,
        b: 0,
        a: 1,
      },
    },
    'color/text': {
      undrr: {
        r: 0.102,
        g: 0.102,
        b: 0.102,
        a: 1,
      },
      delta: {
        r: 0.102,
        g: 0.102,
        b: 0.102,
        a: 1,
      },
      irp: {
        r: 0.102,
        g: 0.102,
        b: 0.102,
        a: 1,
      },
      mcr: {
        r: 0.102,
        g: 0.102,
        b: 0.102,
        a: 1,
      },
      preventionweb: {
        r: 0.102,
        g: 0.102,
        b: 0.102,
        a: 1,
      },
    },
    'color/white': {
      undrr: {
        r: 1,
        g: 1,
        b: 1,
        a: 1,
      },
      delta: {
        r: 1,
        g: 1,
        b: 1,
        a: 1,
      },
      irp: {
        r: 1,
        g: 1,
        b: 1,
        a: 1,
      },
      mcr: {
        r: 1,
        g: 1,
        b: 1,
        a: 1,
      },
      preventionweb: {
        r: 1,
        g: 1,
        b: 1,
        a: 1,
      },
    },
    'color/neutral-0': {
      undrr: {
        r: 1,
        g: 1,
        b: 1,
        a: 1,
      },
      delta: {
        r: 1,
        g: 1,
        b: 1,
        a: 1,
      },
      irp: {
        r: 1,
        g: 1,
        b: 1,
        a: 1,
      },
      mcr: {
        r: 1,
        g: 1,
        b: 1,
        a: 1,
      },
      preventionweb: {
        r: 1,
        g: 1,
        b: 1,
        a: 1,
      },
    },
    'color/interactive': {
      undrr: {
        r: 0,
        g: 0.3098,
        b: 0.5686,
        a: 1,
      },
      delta: {
        r: 0,
        g: 0.3098,
        b: 0.5686,
        a: 1,
      },
      irp: {
        r: 0.0588,
        g: 0.4706,
        b: 0.749,
        a: 1,
      },
      mcr: {
        r: 0.349,
        g: 0.102,
        b: 0.3804,
        a: 1,
      },
      preventionweb: {
        r: 0.0392,
        g: 0.4118,
        b: 0.4118,
        a: 1,
      },
    },
    'color/neutral-300': {
      undrr: {
        r: 0.5882,
        g: 0.6,
        b: 0.6118,
        a: 1,
      },
      delta: {
        r: 0.5882,
        g: 0.6,
        b: 0.6118,
        a: 1,
      },
      irp: {
        r: 0.5882,
        g: 0.6,
        b: 0.6118,
        a: 1,
      },
      mcr: {
        r: 0.5882,
        g: 0.6,
        b: 0.6118,
        a: 1,
      },
      preventionweb: {
        r: 0.5882,
        g: 0.6,
        b: 0.6118,
        a: 1,
      },
    },
    'spacing/25': {
      undrr: 2.5,
      delta: 2.5,
      irp: 2.5,
      mcr: 2.5,
      preventionweb: 2.5,
    },
    'spacing/150': {
      undrr: 15,
      delta: 15,
      irp: 15,
      mcr: 15,
      preventionweb: 15,
    },
    'spacing/200': {
      undrr: 20,
      delta: 20,
      irp: 20,
      mcr: 20,
      preventionweb: 20,
    },
    'spacing/250': {
      undrr: 24,
      delta: 24,
      irp: 24,
      mcr: 24,
      preventionweb: 24,
    },
    'spacing/300': {
      undrr: 30,
      delta: 30,
      irp: 30,
      mcr: 30,
      preventionweb: 30,
    },
  };
  for (const [name, expected] of Object.entries(inputContract))
    for (const m of modes)
      if (
        JSON.stringify(
          value(name, m, typeof expected[m.id] === 'number' ? 'FLOAT' : 'COLOR')
        ) !== JSON.stringify(expected[m.id])
      )
        fail('Recorded source token input ' + name + '/' + m.id + ' changed');
  const raised = styles.effect.find(e => e.id === 'shadow.raised');
  const effectReadout = JSON.parse(
    fs.readFileSync(path.join(root, ASSET + 'card-effects-source.json'))
  ).cases;
  if (
    !raised ||
    raised.name !== 'Mangrove/shadow/raised' ||
    effectReadout.length !== 40
  )
    fail('Missing actual source raised shadow');
  for (const m of modes) {
    const expectedColor = { r: 0.302, g: 0.302, b: 0.302, a: 0.24 },
      entry = raised.values[m.id];
    if (
      JSON.stringify(value('effect-color/shadow/raised', m, 'COLOR')) !==
        JSON.stringify(expectedColor) ||
      entry?.length !== 1 ||
      JSON.stringify(entry[0].effect.color) !== JSON.stringify(expectedColor) ||
      entry[0].effect.type !== 'INNER_SHADOW' ||
      entry[0].effect.offset.x !== 0 ||
      entry[0].effect.offset.y !== 0 ||
      entry[0].effect.radius !== 0 ||
      entry[0].effect.spread !== 1 ||
      entry[0].effect.visible !== true ||
      entry[0].effect.blendMode !== 'NORMAL' ||
      entry[0].bindings?.color !== 'effect-color/shadow/raised'
    )
      fail('Actual source raised effect or paint changed');
    const readouts = effectReadout.filter(c => c.brand === m.id);
    if (
      readouts.length !== 8 ||
      readouts.some(c =>
        c.cards.some(
          n =>
            n.shadow !== 'rgba(77, 77, 77, 0.24) 0px 0px 0px 1px inset' ||
            n.radius !== '5px'
        )
      )
    )
      fail('Actual source card effect/radius readout changed');
  }
  const ref = { file: 'stories/Patterns/ContentHub/ContentHub.jsx', line: 291 };
  function role(id, type, get, scopes) {
    const name = 'component/content-hub/' + id;
    upsert(variables, {
      id: name.replaceAll('/', '.'),
      name,
      type,
      values: perMode(get),
      scopes,
      sourceRef: ref,
      hiddenFromPublishing: false,
      codeSyntax: {},
      description:
        'Finite actual source derivation; native responsive/font rendering remains open.',
    });
    return name;
  }
  function rgba(str) {
    const m = /^rgba?\(([^)]+)\)/.exec(str);
    if (!m) fail('Unsupported source paint ' + str);
    const a = m[1]
      .split(/[,\s/]+/)
      .filter(Boolean)
      .map(Number);
    if (a.length < 3 || a.some(x => !Number.isFinite(x)))
      fail('Invalid source paint');
    return { r: a[0] / 255, g: a[1] / 255, b: a[2] / 255, a: a[3] ?? 1 };
  }
  const equal = (a, b) =>
    ['r', 'g', 'b', 'a'].every(
      k => Math.abs((a[k] ?? 1) - (b[k] ?? 1)) < 1e-10
    );
  function paint(id, get) {
    const expected = perMode(m => rgba(get(m))),
      candidates = variables.filter(
        v => v.type === 'COLOR' && !v.name.startsWith('component/content-hub/')
      );
    const match = candidates.find(v =>
      modes.every(m => {
        const p = value(v.name, m, 'COLOR');
        return equal(expected[m.id], {
          r: Math.round(p.r * 255) / 255,
          g: Math.round(p.g * 255) / 255,
          b: Math.round(p.b * 255) / 255,
          a: p.a ?? 1,
        });
      })
    );
    return role(
      'paint/' + id,
      'COLOR',
      m => (match ? { alias: match.name } : expected[m.id]),
      ['ALL_FILLS', 'STROKE_COLOR']
    );
  }
  function number(id, get) {
    return role('geometry/' + id, 'FLOAT', get, ['WIDTH_HEIGHT', 'GAP']);
  }
  for (const m of modes)
    if (
      value('font-family/text', m, 'STRING') !== 'Roboto' ||
      value('font-family/ui', m, 'STRING') !== 'Roboto Condensed'
    )
      fail('Source Latin font changed');
  function scene(key, w) {
    return Object.fromEntries(
      modes.map(m => {
        const d = source.find(
          d => d.brand === m.id && d.case.key === key && d.viewport.width === w
        );
        if (!d) fail('Missing actual captured scene');
        return [m.id, d];
      })
    );
  }
  const one = (sets, predicate) =>
    Object.fromEntries(
      modes.map(m => {
        const items = sets[m.id].records.filter(predicate);
        if (items.length !== 1) fail('Source anatomy ambiguous');
        return [m.id, items[0]];
      })
    );
  const style = (id, ns) => {
    const family = m =>
        ns[m.id].fontFamily.includes('Condensed') ? 'ui' : 'text',
      size = role(
        'type/' + id + '/size',
        'FLOAT',
        m => parseFloat(ns[m.id].fontSize),
        ['FONT_SIZE']
      );
    const st = 'component.content-hub.' + id;
    upsert(styles.text, {
      id: st,
      name: 'Mangrove/component/content-hub/' + id,
      source: ref,
      component: true,
      recommended: false,
      description:
        'Exact captured CSS Latin face/line metrics. Native installed font matching and wrapping are not accepted.',
      bindings: {
        fontFamily: 'font-family/' + family(modes[0]),
        fontSize: size,
      },
      values: perMode(m => {
        const n = ns[m.id];
        if (
          n.fontStyle !== 'normal' ||
          ![400, 600, 700].includes(+n.fontWeight)
        )
          fail('Unsupported source font face');
        return {
          fontName: {
            family: value('font-family/' + family(m), m, 'STRING'),
            style: +n.fontWeight >= 600 ? 'Bold' : 'Regular',
          },
          fontSize: parseFloat(n.fontSize),
          lineHeight: { unit: 'PIXELS', value: parseFloat(n.lineHeight) },
          ...(n.letterSpacing === 'normal'
            ? {}
            : {
                letterSpacing: {
                  unit: 'PIXELS',
                  value: parseFloat(n.letterSpacing),
                },
              }),
        };
      }),
    });
    return st;
  };
  function frame(id, w, h, children = [], extra = {}) {
    return {
      id,
      type: 'FRAME',
      name: id,
      fill: null,
      layout: { mode: 'VERTICAL', width: w, height: h, clipsContent: false },
      children,
      ...extra,
    };
  }
  const zero = number('zero', () => 0);
  function allocated(id, ns, base, children, extra = {}) {
    const w = number(id + '/width', m => ns[m.id].width),
      h = number(id + '/height', m => ns[m.id].height);
    if (modes.some(m => ns[m.id].width <= 0 || ns[m.id].height <= 0))
      fail('Zero source allocation ' + id);
    return frame(id, w, h, children, {
      absolute: {
        horizontal: 'START',
        vertical: 'START',
        offsetX: number(id + '/x', m => ns[m.id].x - base[m.id].x),
        offsetY: number(id + '/y', m => ns[m.id].y - base[m.id].y),
      },
      ...extra,
    });
  }
  function textSlot(
    id,
    ns,
    base,
    { padding = false, center = false, underline = false } = {}
  ) {
    const text = ns.undrr.text;
    if (modes.some(m => ns[m.id].text !== text))
      fail('Source copy differs by theme');
    const child = {
      id: id + '-text',
      type: 'TEXT',
      name: id + ' editable source text',
      characters: text,
      textProperty: id,
      textStyle: style(id, ns),
      fill: paint(id + '/ink', m => ns[m.id].color),
      textWrap: ns.undrr.textWrap === 'balance' ? 'BALANCE' : 'AUTO',
      layout: { width: 'FILL', height: 'HUG' },
    };
    if (underline) {
      child.textDecoration = 'UNDERLINE';
      child.textDecorationThickness = { unit: 'PIXELS', value: 2.5 };
      child.textDecorationOffset = { unit: 'PIXELS', value: 6.4 };
    }
    const slot = allocated(id, ns, base, [child]);
    if (center) slot.layout.justify = 'CENTER';
    if (padding) {
      const edges = m => {
        const p = ns[m.id].padding.split(' ').map(parseFloat);
        return {
          top: p[0],
          right: p[1] ?? p[0],
          bottom: p[2] ?? p[0],
          left: p[3] ?? p[1] ?? p[0],
        };
      };
      slot.bindings = {};
      for (const edge of ['top', 'bottom', 'left', 'right'])
        slot.bindings['padding' + edge[0].toUpperCase() + edge.slice(1)] =
          number(id + '/padding-' + edge, m => edges(m)[edge]);
      child.layout.width = number(
        id + '/source-text-content-width',
        m =>
          ns[m.id].width -
          edges(m).left -
          edges(m).right -
          parseFloat(ns[m.id].borderInlineEnd)
      );
      slot.sourceGeometry = {
        padding: perMode(m => edges(m)),
        inlineEndBorderAllocation: perMode(m =>
          parseFloat(ns[m.id].borderInlineEnd)
        ),
        textContentWidth:
          'Explicit source content width excludes padding and separately painted inline-end divider. Native font ink and arbitrary edits remain open.',
      };
    }
    return slot;
  }
  const limitations = [
    'Actual hydrated Chromium source observations at390/1164 across all five themes. Finite allocated wrappers do not establish native font pixels, baselines, arbitrary edit reflow or responsive equivalence.',
    'Native scene wrappers use source recorded allocations and stable editable anatomy. Source semantic landmarks, hash route navigation, sticky/focus/hover/RTL and scrolling behaviour remain separate.',
    'Source fade projection uses surface RGB with alpha0 because native black-transparent interpolation darkens differently. Full native HubHeader/consumer/publication acceptance remains open.',
    'DELTA tertiary source CSS nests rgb(rgb(...)), so captured base is transparent and fades have no paint. Preserve the observed branch; intended source design correction remains open.',
    'Exact source photograph bytes are pinned. No redistribution licence grant is established for the source image URL; native crop comparison remains open.',
  ];
  const headers = {
    id: 'content-hub-header',
    name: 'Mangrove/Page patterns/ContentHub authored header',
    kind: 'component-set',
    sourceRef: ref,
    review: { genericLabels: false, preserveVariantSizing: true },
    limitations,
    variants: [],
  };
  const keys = [...new Set(source.map(d => d.case.key))].filter(
    k => k !== 'route-landing'
  );
  const originalCta =
    require('./figma-editorial-cta-recipes.cjs').buildEditorialCtaRecipes({
      root,
      modes,
      variables,
      styles,
    })[0];
  const tertiaryVariant = JSON.parse(
    JSON.stringify(
      originalCta.variants.find(
        v =>
          v.properties.Context === 'HeroTertiary' &&
          v.properties.State === 'Default' &&
          v.properties.Content === 'Short' &&
          v.properties.Motion === 'NoPreference'
      )
    )
  );
  if (!tertiaryVariant) fail('Exact source editorial CTA dependency missing');
  const tertiaryGlyph = role(
    'paint/tertiary-cta-glyph',
    'COLOR',
    m =>
      m.id === 'delta' ? { alias: 'color/white' } : { r: 0, g: 0, b: 0, a: 1 },
    ['TEXT_FILL']
  );
  const patchGlyph = n => {
    if (n.id === 'glyph') n.fill = tertiaryGlyph;
    if (n.textStyleApplication === 'DIRECT') {
      const template = styles.text.find(st => st.id === n.textStyle);
      if (!template) fail('Source CTA Label template missing');
      const own = JSON.parse(JSON.stringify(template));
      own.id = 'component.content-hub.tertiary-cta-label';
      own.name = 'Mangrove/component/content-hub/tertiary-cta-label';
      own.source = ref;
      own.description =
        'Source Hub tertiary Label uses linked dedicated template. Generic STYLE path, native font inheritance/pixel verification remains open.';
      upsert(styles.text, own);
      n.textStyle = own.id;
      delete n.textStyleApplication;
    }
    for (const c of n.children || []) patchGlyph(c);
  };
  patchGlyph(tertiaryVariant.tree);
  tertiaryVariant.id = 'content-hub-tertiary-cta.default';
  const tertiaryCta = {
    id: 'content-hub-tertiary-cta',
    name: 'Mangrove/Page patterns/ContentHub tertiary CTA source cascade',
    kind: 'component-set',
    sourceRef: ref,
    review: { genericLabels: false, preserveVariantSizing: true },
    limitations,
    variants: [tertiaryVariant],
  };
  const image = {
    assetId: 'content-hub-resilient-infrastructure',
    base64: fs
      .readFileSync(path.join(root, ASSET + 'resilient-infrastructure.jpg'))
      .toString('base64'),
    scaleMode: 'FILL',
  };
  for (const key of keys)
    for (const w of [390, 1164]) {
      const sets = scene(key, w),
        head = one(sets, n =>
          n.cls.startsWith('mg-hub-header mg-hub-header--')
        );
      const bar = one(sets, n => n.cls === 'mg-hub-header__bar'),
        base = perMode(m => ({ x: bar[m.id].x, y: bar[m.id].y })),
        rootTree = frame(
          'root',
          w,
          number(key + '/' + w + '/height', m => head[m.id].height)
        );
      const barTree = allocated(key + '/' + w + '/bar', bar, base, []);
      barTree.id = 'bar';
      const bg = paint(key + '/' + w + '/bar-base', m => bar[m.id].background),
        tint = role(
          'paint/' + key + '/' + w + '/bar-tint',
          'COLOR',
          m => {
            const match = /linear-gradient\((rgba?\([^)]*\))/.exec(
              bar[m.id].background
            );
            if (!match) fail('Source bar tint missing');
            return rgba(match[1]);
          },
          ['ALL_FILLS']
        );
      const layer = frame(
        'bar-source-paint',
        barTree.layout.width,
        barTree.layout.height,
        [],
        {
          gradient: {
            layers: [
              {
                stops: [
                  { position: 0, color: tint },
                  { position: 1, color: tint },
                ],
                transform: [
                  [1, 0, 0],
                  [0, 1, 0],
                ],
              },
              {
                stops: [
                  { position: 0, color: bg },
                  { position: 1, color: bg },
                ],
                transform: [
                  [1, 0, 0],
                  [0, 1, 0],
                ],
              },
            ],
          },
          absolute: {
            horizontal: 'START',
            vertical: 'START',
            offsetX: zero,
            offsetY: zero,
          },
        }
      );
      barTree.children.push(layer);
      const name = one(sets, n => n.cls === 'mg-hub-header__name'),
        nameSlot = textSlot(key + '/' + w + '/name', name, bar, {
          padding: true,
          center: true,
        });
      nameSlot.id = 'name';
      barTree.children.push(nameSlot);
      const nav = one(sets, n => n.cls === 'mg-hub-header__nav'),
        navTree = allocated(key + '/' + w + '/nav', nav, bar, [], {
          layout: {
            mode: 'VERTICAL',
            width: number(key + '/' + w + '/nav-width', m => nav[m.id].width),
            height: 44,
            clipsContent: true,
          },
        });
      navTree.id = 'navigation';
      for (let i = 0; i < 5; i++) {
        const links = Object.fromEntries(
          modes.map(m => [
            m.id,
            sets[m.id].records.filter(
              n =>
                n.tag === 'A' &&
                [
                  'About',
                  'Indicators',
                  'Reporting',
                  'Reports',
                  'Data',
                ].includes(n.text)
            )[i],
          ])
        );
        const node = textSlot(
          key + '/' + w + '/nav-link-' + (i + 1),
          links,
          nav,
          {
            padding: true,
            center: true,
            underline: links.undrr.current !== null || links.undrr.ancestor,
          }
        );
        node.id = 'link-' + (i + 1);
        navTree.children.push(node);
      }
      for (const [side, pseudo, visible] of [
        ['start', 'pseudoBefore', 'overflowStart'],
        ['end', 'pseudoAfter', 'overflowEnd'],
      ]) {
        if (!modes.some(m => nav[m.id][visible])) continue;
        const surface = role(
            'paint/' + key + '/' + w + '/fade-' + side,
            'COLOR',
            m => {
              const n = nav[m.id];
              if (!n[visible] || n[pseudo].background.includes(' none '))
                return { r: 0, g: 0, b: 0, a: 0 };
              const match = /linear-gradient\([^,]+, (rgb\([^)]*\))/.exec(
                n[pseudo].background
              );
              if (!match) fail('Unsupported source fade');
              return rgba(match[1]);
            },
            ['ALL_FILLS']
          ),
          clear = role(
            'paint/' + key + '/' + w + '/fade-' + side + '-transparent',
            'COLOR',
            m => {
              const s = value(surface, m, 'COLOR');
              return { ...s, a: 0 };
            },
            ['ALL_FILLS']
          );
        const fade = frame('fade-' + side, 30, 44, [], {
          absolute: {
            horizontal: 'START',
            vertical: 'START',
            offsetX:
              side === 'start'
                ? zero
                : number(
                    key + '/' + w + '/fade-end-x',
                    m => nav[m.id].width - 30
                  ),
            offsetY: zero,
          },
          gradient: {
            layers: [
              {
                stops: [
                  { position: 0, color: side === 'start' ? surface : clear },
                  { position: 1, color: side === 'start' ? clear : surface },
                ],
                transform: [
                  [1, 0, 0],
                  [0, 1, 0],
                ],
              },
            ],
          },
        });
        navTree.children.push(fade);
      }
      barTree.children.push(navTree);
      for (const [id, ns, edge] of [
        ['identity-divider', name, 'borderInlineEnd'],
        ['secondary-rule', bar, 'borderBlockEnd'],
      ]) {
        if (!modes.some(m => parseFloat(ns[m.id][edge]) > 0)) continue;
        const size = number(key + '/' + w + '/' + id + '/size', m =>
          parseFloat(ns[m.id][edge])
        );
        const color = paint(
          key + '/' + w + '/' + id + '/paint',
          m => ns[m.id][edge].match(/rgba?\([^)]*\)/)[0]
        );
        const divider = frame(
          id,
          id === 'identity-divider' ? size : barTree.layout.width,
          id === 'identity-divider'
            ? number(key + '/' + w + '/' + id + '/height', m => ns[m.id].height)
            : size,
          [],
          {
            fill: color,
            absolute: {
              horizontal: 'START',
              vertical: 'START',
              offsetX: number(key + '/' + w + '/' + id + '/x', m =>
                id === 'identity-divider'
                  ? ns[m.id].x -
                    bar[m.id].x +
                    ns[m.id].width -
                    parseFloat(ns[m.id][edge])
                  : 0
              ),
              offsetY: number(key + '/' + w + '/' + id + '/y', m =>
                id === 'identity-divider'
                  ? ns[m.id].y - bar[m.id].y
                  : ns[m.id].height - parseFloat(ns[m.id][edge])
              ),
            },
          }
        );
        barTree.children.push(divider);
      }
      rootTree.children.push(barTree);
      const bannerItems = sets.undrr.records.filter(
        n => n.cls === 'mg-hub-header__banner'
      );
      if (bannerItems.length) {
        const banner = one(sets, n => n.cls === 'mg-hub-header__banner'),
          bannerTree = allocated(key + '/' + w + '/banner', banner, base, [], {
            fill: paint(
              key + '/' + w + '/banner-base',
              m => banner[m.id].background
            ),
          });
        bannerTree.id = 'banner';
        for (const [id, cls] of [
          ['title', 'mg-hub-header__title'],
          ['summary', 'mg-hub-header__summary'],
        ]) {
          const ns = one(sets, n => n.cls === cls),
            slot = textSlot(key + '/' + w + '/' + id, ns, banner);
          slot.id = id;
          bannerTree.children.push(slot);
        }
        const images = one(
            sets,
            n =>
              n.tag === 'IMG' &&
              n.src ===
                'https://www.undrr.org/sites/default/files/2023-11/resilient-infrastructure-pikoso-kz-shutterstock.jpg'
          ),
          media = allocated(key + '/' + w + '/media', images, banner, [], {
            image,
          });
        media.id = 'media';
        bannerTree.children.push(media);
        const actions = sets.undrr.records.filter(
          n => n.tag === 'A' && n.cls.includes('mg-button-cta')
        );
        for (let i = 0; i < actions.length; i++) {
          const ns = Object.fromEntries(
            modes.map(m => [
              m.id,
              sets[m.id].records.filter(
                n => n.tag === 'A' && n.cls.includes('mg-button-cta')
              )[i],
            ])
          );
          const slot = allocated(
            key + '/' + w + '/action-' + (i + 1),
            ns,
            banner,
            [
              {
                id: 'action-' + (i + 1) + '-cta',
                type: 'INSTANCE',
                name: 'Exact source editorial CTA',
                family:
                  key === 'header-tertiary'
                    ? 'content-hub-tertiary-cta'
                    : 'editorial-cta',
                variant: {
                  Context:
                    key === 'header-tertiary' ? 'HeroTertiary' : 'HeroPrimary',
                  State: 'Default',
                  Content: 'Short',
                  Motion: 'NoPreference',
                },
                overrides: { Label: actions[i].text },
                expose: true,
                layout: { width: 'FILL', height: 'FILL' },
              },
            ]
          );
          slot.id = 'action-' + (i + 1);
          bannerTree.children.push(slot);
        }
        rootTree.children.push(bannerTree);
      }
      headers.variants.push({
        id: 'content-hub-header.' + key + '.' + w,
        name: 'SourceCase=' + key + ', SourceViewport=' + w,
        properties: { SourceCase: key, SourceViewport: String(w) },
        sourceHref: sets.undrr.records
          .slice(
            sets.undrr.records.findIndex(n =>
              n.cls.startsWith('mg-hub-header mg-hub-header--')
            ),
            sets.undrr.records.findIndex(n => n.tag === 'MAIN')
          )
          .filter(n => n.href)
          .map(n => ({ text: n.text, href: n.href })),
        sourceGeometry: {
          sceneAllocation:
            'Finite actual source wrapper allocations; editable text native wrapping/pixel verification open',
          cascadeDefect:
            key === 'header-tertiary'
              ? 'DELTA transparent source branch'
              : null,
        },
        tree: rootTree,
      });
    }
  const makeFamily = (id, name) => ({
    id,
    name: 'Mangrove/Page patterns/' + name,
    kind: 'component-set',
    sourceRef: ref,
    review: { genericLabels: false, preserveVariantSizing: true },
    limitations,
    variants: [],
  });
  const reading = makeFamily(
      'content-hub-reading-column',
      'ContentHub authored reading column'
    ),
    intro = makeFamily('content-hub-intro', 'ContentHub authored page intro'),
    resources = makeFamily(
      'content-hub-resources',
      'ContentHub authored resources'
    );
  for (const page of ['how-to-report', 'validate-data'])
    for (const w of [390, 1164]) {
      const key = 'route-' + page,
        sets = scene(key, w),
        article = one(sets, n => n.cls === 'mg-reading__article'),
        tree = frame(
          'article',
          number(key + '/' + w + '/article-width', m => article[m.id].width),
          number(key + '/' + w + '/article-height', m => article[m.id].height)
        );
      const indices = sets.undrr.records
        .map((n, i) => [n, i])
        .filter(([n]) => n.tag === 'H2' && n.cls === '')
        .map(([, i]) => i);
      if (indices.length !== 3)
        fail('Expected actual authored three-section article');
      for (let i = 0; i < 3; i++)
        for (const [kind, offset] of [
          ['heading', 0],
          ['paragraph', 1],
        ]) {
          const ns = Object.fromEntries(
            modes.map(m => [m.id, sets[m.id].records[indices[i] + offset]])
          );
          if (ns.undrr.tag !== (kind === 'heading' ? 'H2' : 'P'))
            fail('Source reading anatomy changed');
          const slot = textSlot(
            key + '/' + w + '/section-' + (i + 1) + '-' + kind,
            ns,
            article
          );
          slot.id = 'section-' + (i + 1) + '-' + kind;
          tree.children.push(slot);
        }
      const next = one(
          sets,
          n =>
            n.tag === 'A' &&
            ['Continue with data validation', 'Back to reporting'].includes(
              n.text
            )
        ),
        nextSlot = textSlot(key + '/' + w + '/next-link', next, article, {
          underline: true,
        });
      nextSlot.id = 'next-link';
      delete nextSlot.children[0].textDecorationThickness;
      nextSlot.children[0].textDecorationOffset = { unit: 'AUTO' };
      tree.children.push(nextSlot);
      reading.variants.push({
        id: 'content-hub-reading-column.' + page + '.' + w,
        name: 'Page=' + page + ', SourceViewport=' + w,
        properties: { Page: page, SourceViewport: String(w) },
        sourceHref: { next: next.undrr.href },
        tree,
      });
    }
  for (const key of keys.concat(['route-landing']))
    for (const w of [390, 1164]) {
      const sets = scene(key, w),
        intros = sets.undrr.records.filter(n => n.cls === 'mg-demo-intro');
      if (!intros.length) continue;
      const ns = one(sets, n => n.cls === 'mg-demo-intro'),
        tree = frame(
          'intro',
          number(key + '/' + w + '/intro-width', m => ns[m.id].width),
          number(key + '/' + w + '/intro-height', m => ns[m.id].height)
        );
      for (const [id, tag] of [
        ['title', 'H1'],
        ['summary', 'P'],
      ]) {
        const idx = sets.undrr.records.findIndex(
            n => n.cls === 'mg-demo-intro'
          ),
          text = Object.fromEntries(
            modes.map(m => [
              m.id,
              sets[m.id].records.slice(idx + 1).find(n => n.tag === tag),
            ])
          ),
          slot = textSlot(key + '/' + w + '/intro-' + id, text, ns);
        slot.id = id;
        tree.children.push(slot);
      }
      intro.variants.push({
        id: 'content-hub-intro.' + key + '.' + w,
        name: 'SourceCase=' + key + ', SourceViewport=' + w,
        properties: { SourceCase: key, SourceViewport: String(w) },
        tree,
      });
    }
  for (const w of [390, 1164]) {
    const key = 'route-about',
      sets = scene(key, w),
      h2 = one(
        sets,
        n => n.tag === 'H2' && n.text === 'Resources and guidance'
      ),
      para = one(
        sets,
        n =>
          n.tag === 'P' &&
          n.text ===
            'Use the reporting platform to work with your national data.'
      ),
      link = one(
        sets,
        n => n.tag === 'A' && n.text === 'Visit the Sendai Framework Monitor'
      ),
      base = perMode(m => ({ x: h2[m.id].x, y: h2[m.id].y })),
      tree = frame(
        'resources',
        number(key + '/' + w + '/resources-width', m => h2[m.id].width),
        number(
          key + '/' + w + '/resources-height',
          m => link[m.id].y + link[m.id].height - h2[m.id].y
        )
      );
    for (const [id, ns] of [
      ['heading', h2],
      ['paragraph', para],
      ['platform-link', link],
    ]) {
      const slot = textSlot(key + '/' + w + '/resources-' + id, ns, base, {
        underline: id === 'platform-link',
      });
      slot.id = id;
      if (id === 'platform-link') {
        delete slot.children[0].textDecorationThickness;
        slot.children[0].textDecorationOffset = { unit: 'AUTO' };
      }
      tree.children.push(slot);
    }
    resources.variants.push({
      id: 'content-hub-resources.' + w,
      name: 'SourceViewport=' + w,
      properties: { SourceViewport: String(w) },
      sourceHref: { platform: link.undrr.href },
      tree,
    });
  }
  const toc = makeFamily(
    'content-hub-toc',
    'ContentHub authored three-link TOC'
  );
  const readingTemplates = require('./figma-page-reading-recipes.cjs')
    .buildPageReadingRecipes({ root, modes, variables, styles })
    .find(f => f.id === 'page-bulleted-toc');
  for (const page of ['how-to-report', 'validate-data'])
    for (const w of [390, 1164]) {
      const key = 'route-' + page,
        sets = scene(key, w),
        ns = one(sets, n => n.cls === 'mg-table-of-contents'),
        heading = one(sets, n => n.cls === 'mg-on-this-page-header');
      const start = sets.undrr.records.findIndex(
          n => n.cls === 'mg-table-of-contents'
        ),
        end = sets.undrr.records.findIndex(
          n => n.cls === 'mg-reading__article'
        );
      const links = Object.fromEntries(
        modes.map(m => [
          m.id,
          sets[m.id].records.slice(start, end).filter(n => n.tag === 'A'),
        ])
      );
      if (modes.some(m => links[m.id].length !== 3))
        fail('Expected source three-link TOC');
      for (const m of modes) {
        const observed = links[m.id];
        if (
          observed.some(
            n =>
              n.fontSize !== '16px' ||
              n.lineHeight !== '24px' ||
              n.fontFamily !== 'Roboto, sans-serif' ||
              n.padding !== '2.5px 0px' ||
              n.height !== 29
          )
        )
          fail('ContentHub TOC UA projection basis changed');
        if (observed.slice(1).some((n, i) => n.y - observed[i].y !== 34))
          fail('ContentHub TOC source row spacing changed');
        if (
          heading[m.id].fontSize !== '18px' ||
          heading[m.id].lineHeight !== '19.8px' ||
          heading[m.id].fontWeight !== '700' ||
          heading[m.id].fontFamily !== 'Roboto, sans-serif'
        )
          fail('ContentHub TOC source heading type changed');
      }
      const template = readingTemplates.variants.find(
        v =>
          v.properties.Page === 'article' &&
          v.properties.SourceViewport === String(w)
      );
      if (!template) fail('Measured UA-disc topology dependency missing');
      const tree = JSON.parse(JSON.stringify(template.tree));
      tree.layout.width = number(
        key + '/' + w + '/toc-width',
        m => ns[m.id].width
      );
      const patch = n => {
        if (n.type === 'TEXT') {
          const match = /^label-(\d)$/.exec(n.id),
            index = match ? +match[1] - 1 : null,
            observed =
              index === null
                ? heading
                : Object.fromEntries(
                    modes.map(m => [m.id, links[m.id][index]])
                  );
          n.characters = observed.undrr.text;
          if (n.textProperty)
            n.textProperty = 'TOC ' + page + '/' + w + ' ' + n.textProperty;
          n.textStyle = style(key + '/' + w + '/toc-' + n.id, observed);
          n.fill = paint(
            key + '/' + w + '/toc-' + n.id + '/ink',
            m => observed[m.id].color
          );
          delete n.textStyleApplication;
        }
        if (n.type === 'ELLIPSE')
          n.fill = paint(key + '/' + w + '/toc-marker', m => ns[m.id].color);
        for (const c of n.children || []) patch(c);
      };
      patch(tree);
      toc.variants.push({
        id: 'content-hub-toc.' + page + '.' + w,
        name: 'Page=' + page + ', SourceViewport=' + w,
        properties: { Page: page, SourceViewport: String(w) },
        sourceAnchors: links.undrr.map(n => n.href),
        sourceGeometry: {
          sourceWidth: perMode(m => ns[m.id].width),
          sourceHeight: perMode(m => ns[m.id].height),
          primitiveLineage:
            'Source three-link page-bulleted-toc topology with source context width/copy/linked styles and actual paint. UA marker borrows the reviewed Chromium page-bulleted-toc vector projection under guarded matching16/24 source typography and29/34 row geometry. No new ContentHub raster measurement is claimed; native/source marker pixels and linked font inheritance remain open.',
          hydratedEmptyListFlowTail: 5,
        },
        tree,
      });
    }
  const cards = makeFamily(
    'content-hub-route-card',
    'ContentHub authored route and fact cards'
  );
  const cardCases = [
    ['hub-home', 'route', 3],
    ['hub-home', 'fact', 6],
    ['routes-vertical', 'vertical', 3],
    ['route-reporting', 'reporting', 2],
  ];
  function sourceCards(sets, kind) {
    return perMode(m => {
      const records = sets[m.id].records,
        starts = records
          .map((n, i) =>
            n.tag === 'ARTICLE' && n.cls.startsWith('mg-card ') ? i : -1
          )
          .filter(i => i >= 0);
      return starts.map((start, index) =>
        records
          .slice(start, starts[index + 1] ?? records.length)
          .filter(
            (n, i) => i === 0 || n.y < records[start].y + records[start].height
          )
      );
    });
  }
  for (const [key, kind, count] of cardCases)
    for (const w of [390, 1164]) {
      const sets = scene(key, w),
        all = sourceCards(sets, kind),
        start = kind === 'fact' ? 3 : 0;
      if (modes.some(m => all[m.id].length !== (kind === 'reporting' ? 2 : 9)))
        fail('Actual card branch count changed');
      for (let i = 0; i < count; i++) {
        const groups = perMode(m => all[m.id][start + i]),
          roots = perMode(m => groups[m.id][0]);
        const native = frame(
          'card',
          number(kind + '/' + i + '/' + w + '/width', m => roots[m.id].width),
          number(kind + '/' + i + '/' + w + '/height', m => roots[m.id].height),
          [],
          {
            fill: paint(
              kind + '/' + i + '/' + w + '/background',
              m => roots[m.id].background.split(' none ')[0]
            ),
          }
        );
        if (modes.some(m => roots[m.id].border.split(' ')[0] !== '0px'))
          fail('Unreviewed card border');
        if (modes.some(m => value('card/border-radius', m, 'FLOAT') !== 5))
          fail('Authored card source radius changed');
        native.bindings = { cornerRadius: 'card/border-radius' };
        native.effectStyle = 'shadow.raised';
        const select = predicate =>
          perMode(m => {
            const found = groups[m.id].filter(predicate);
            if (found.length !== 1)
              fail('Actual source card anatomy ambiguous');
            return found[0];
          });
        const title = select(n => n.cls === 'mg-card__title');
        const titleSlot = textSlot(
          kind + '/' + i + '/' + w + '/title',
          title,
          roots,
          { padding: true }
        );
        titleSlot.id = 'title';
        const anchor = groups.undrr.find(
          n => n.tag === 'A' && n.text === title.undrr.text
        );
        if (anchor) {
          titleSlot.children[0].textDecoration = 'UNDERLINE';
          titleSlot.children[0].textDecorationOffset = {
            unit: 'PIXELS',
            value: 3,
          };
          delete titleSlot.children[0].textProperty;
          const diagnostic = perMode(m => {
            const doc = JSON.parse(
              fs.readFileSync(path.join(root, ASSET + 'card-caret-source.json'))
            ).cases.find(
              c =>
                c.brand === m.id && c.case.key === key && c.viewport.width === w
            );
            const d = doc?.cards.find(c => c.title === title[m.id].text);
            if (
              !d ||
              JSON.stringify(d.sourceFragments) !==
                JSON.stringify(d.mirrorFragments) ||
              d.linkStyle.textDecoration !== 'underline' ||
              d.linkStyle.textUnderlineOffset !== '3px' ||
              d.after.borderTopWidth !== '3px' ||
              d.after.borderRightWidth !== '3px' ||
              d.after.borderBottomWidth !== '0px' ||
              d.after.borderLeftWidth !== '0px' ||
              d.after.width !== '8.04688px' ||
              d.after.height !== '8.04688px' ||
              d.after.marginInlineStart !== '5.75px' ||
              d.after.top !== '-2.3px'
            )
              fail('Actual initial linked card caret/type changed');
            return d;
          });
          const side = 8.046875,
            border = 3,
            v = side * Math.SQRT2,
            rotate = ([x, y]) => [
              (x - y) / Math.SQRT2 + side / Math.SQRT2,
              (x + y) / Math.SQRT2,
            ];
          const poly = points =>
            '<polygon fill="#000000" points="' +
            points.map(p => rotate(p).join(',')).join(' ') +
            '"/>';
          const markup =
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
            v +
            ' ' +
            v +
            '">' +
            poly([
              [0, 0],
              [side, 0],
              [side, border],
              [0, border],
            ]) +
            poly([
              [side - border, border],
              [side, border],
              [side, side],
              [side - border, side],
            ]) +
            '</svg>';
          const caret = allocated(
            kind + '/' + i + '/' + w + '/initial-caret',
            perMode(m => diagnostic[m.id].mirrorCaret),
            roots,
            [
              {
                id: 'caret-ink',
                type: 'SVG',
                name: 'Authored initial quantized border caret',
                layout: { width: v, height: v },
                svg: {
                  assetId: 'content-hub-card-title-caret-23',
                  markup,
                  monochrome: {
                    fills: paint(
                      kind + '/' + i + '/' + w + '/caret-ink',
                      m => diagnostic[m.id].after.color
                    ),
                  },
                },
              },
            ]
          );
          caret.id = 'initial-caret';
          native.children.push(caret);
          titleSlot.children[0].fill = paint(
            kind + '/' + i + '/' + w + '/title-ink',
            m =>
              groups[m.id].find(
                n => n.tag === 'A' && n.text === title[m.id].text
              ).color
          );
        }
        native.children.push(titleSlot);
        if (groups.undrr.some(n => n.cls === 'mg-card__summary')) {
          const summaries = select(n => n.cls === 'mg-card__summary'),
            summary = textSlot(
              kind + '/' + i + '/' + w + '/summary',
              summaries,
              roots,
              { padding: true }
            );
          summary.id = 'summary';
          native.children.push(summary);
        }
        if (groups.undrr.some(n => n.cls.startsWith('mg-icon '))) {
          const ns = select(n => n.cls.startsWith('mg-icon ')),
            glyphName = /mg-icon-([\w-]+)/.exec(ns.undrr.cls)[1],
            sourceScss = fs.readFileSync(
              path.join(root, 'stories/Atom/Icons/_icon-definitions.scss'),
              'utf8'
            );
          const matches = [
            ...sourceScss.matchAll(
              new RegExp(
                String.raw`\.mg-icon-${glyphName}::before \{[\s\S]*?data:image/svg\+xml,([^"\n]+)`,
                'g'
              )
            ),
          ];
          if (!matches.length) fail('Missing actual source mask ' + glyphName);
          const markup = matches.at(-1)[1];
          const provenance = JSON.parse(
            fs.readFileSync(
              path.join(root, ASSET + 'card-source-provenance.json')
            )
          ).assets.find(a => a.glyph === glyphName);
          if (
            !provenance ||
            fs.readFileSync(path.join(root, provenance.file), 'utf8').trim() !==
              markup
          )
            fail('Pinned source mask bytes differ');
          if (
            !markup.startsWith('<svg') ||
            !/stroke=['"]currentColor['"]/.test(markup)
          )
            fail('Unreviewed actual SVG mask');
          for (const field of ['width', 'height']) {
            const first = parseFloat(ns.undrr.pseudoBefore[field]);
            if (
              !(first > 0) ||
              modes.some(
                m => parseFloat(ns[m.id].pseudoBefore[field]) !== first
              )
            )
              fail(
                'Mode-varying source SVG viewport needs separate capability'
              );
          }
          const slot = allocated(
            kind + '/' + i + '/' + w + '/glyph',
            ns,
            roots,
            [
              {
                id: 'glyph-ink',
                name: 'Actual source ' + glyphName + ' mask',
                type: 'SVG',
                layout: {
                  width: parseFloat(ns.undrr.pseudoBefore.width),
                  height: parseFloat(ns.undrr.pseudoBefore.height),
                },
                svg: {
                  assetId: 'content-hub-' + glyphName,
                  markup,
                  monochrome: {
                    strokes: paint(
                      kind + '/' + i + '/' + w + '/mask-ink',
                      m => ns[m.id].color
                    ),
                  },
                },
              },
            ]
          );
          slot.id = 'glyph';
          native.children.push(slot);
        }
        cards.variants.push({
          id: 'content-hub-route-card.' + kind + '-' + (i + 1) + '.' + w,
          name: 'Kind=' + kind + ', Item=' + (i + 1) + ', SourceViewport=' + w,
          properties: {
            Kind: kind,
            Item: String(i + 1),
            SourceViewport: String(w),
          },
          sourceHref: anchor?.href ?? null,
          sourceGeometry: {
            sourceCase: key,
            sourceRoot: perMode(m => roots[m.id]),
            linkedTitleCaret: anchor
              ? 'Finite computed-style mirror, exact original/mirror fragments; no exposed title property or edited-title/caret reflow/native hyperlink support.'
              : null,
            candidateGlyphPlacement:
              'SVG exact source CSS mask at pseudo dimensions; mask baseline inside source line box and raster pixels remain native comparison gates.',
          },
          tree: native,
        });
      }
    }

  const breadcrumbs = makeFamily(
    'content-hub-breadcrumb',
    'ContentHub authored inline breadcrumbs'
  );
  const chevronSide = 5.6,
    chevronBorder = 2,
    viewport = chevronSide * Math.SQRT2;
  const rotated = ([x, y]) => [
    (x - chevronSide / 2) / Math.SQRT2 -
      (y - chevronSide / 2) / Math.SQRT2 +
      viewport / 2,
    (x - chevronSide / 2) / Math.SQRT2 +
      (y - chevronSide / 2) / Math.SQRT2 +
      viewport / 2,
  ];
  const poly = points =>
    '<path d="' +
    points
      .map(
        (p, i) =>
          (i ? 'L' : 'M') +
          rotated(p)
            .map(n => n.toFixed(6))
            .join(' ')
      )
      .join(' ') +
    ' Z"/>';
  const chevronMarkup =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
    viewport +
    ' ' +
    viewport +
    '">' +
    poly([
      [0, 0],
      [chevronSide, 0],
      [chevronSide, chevronBorder],
      [0, chevronBorder],
    ]) +
    poly([
      [chevronSide - chevronBorder, chevronBorder],
      [chevronSide, chevronBorder],
      [chevronSide, chevronSide],
      [chevronSide - chevronBorder, chevronSide],
    ]) +
    '</svg>';
  for (const page of ['landing', 'validate-data'])
    for (const w of [390, 1164]) {
      const key = 'route-' + page,
        sets = scene(key, w),
        nav = one(
          sets,
          n => n.tag === 'NAV' && n.cls.startsWith('mg-breadcrumb')
        );
      const groups = perMode(m =>
        sets[m.id].records.filter(
          n =>
            n.tag === 'LI' &&
            n.y >= nav[m.id].y &&
            n.y < nav[m.id].y + nav[m.id].height
        )
      );
      const count = page === 'landing' ? 2 : 5;
      if (modes.some(m => groups[m.id].length !== count))
        fail('Actual breadcrumb count changed');
      const tree = frame(
        'breadcrumb',
        number(page + '/' + w + '/breadcrumb-width', m => nav[m.id].width),
        number(page + '/' + w + '/breadcrumb-height', m => nav[m.id].height)
      );
      const sourceHrefs = [];
      for (let i = 0; i < count; i++) {
        const li = perMode(m => groups[m.id][i]);
        const ns = perMode(m => {
          const n = li[m.id];
          const a = sets[m.id].records.find(
            r =>
              r.tag === 'A' &&
              r.text === n.text &&
              r.y >= n.y &&
              r.y < n.y + n.height &&
              r.x >= n.x &&
              r.x < n.x + n.width
          );
          return a
            ? { ...a, x: a.x, y: n.y, width: a.width, height: n.height }
            : { ...n };
        });
        const slot = textSlot(
          page + '/' + w + '/breadcrumb-item-' + (i + 1),
          ns,
          nav
        );
        slot.id = 'item-' + (i + 1);
        if (i === count - 1) {
          const st = styles.text.find(s => s.id === slot.children[0].textStyle);
          for (const m of modes) st.values[m.id].paragraphIndent = 28;
        } else {
          slot.children[0].textDecoration = 'UNDERLINE';
          slot.children[0].textDecorationOffset = {
            unit: 'PIXELS',
            value: 2.4,
          };
          sourceHrefs.push(ns.undrr.href);
        }
        tree.children.push(slot);
        if (i > 0) {
          const inkBox = perMode(m => ({
            x: li[m.id].x + 10.4 + (chevronSide - viewport) / 2,
            y: li[m.id].y + 8,
            width: viewport,
            height: viewport,
          }));
          const host = allocated(
            page + '/' + w + '/breadcrumb-chevron-' + (i + 1),
            inkBox,
            nav,
            [
              {
                id: 'breadcrumb-chevron-ink-' + (i + 1),
                type: 'SVG',
                name: 'Authored rotated CSS border projection',
                layout: { width: viewport, height: viewport },
                svg: {
                  assetId: 'content-hub-breadcrumb-chevron',
                  markup: chevronMarkup,
                  monochrome: {
                    fills: paint(
                      page + '/' + w + '/breadcrumb-chevron-ink',
                      m => li[m.id].color
                    ),
                  },
                },
              },
            ]
          );
          host.id = 'separator-' + (i + 1);
          tree.children.push(host);
        }
      }
      breadcrumbs.variants.push({
        id: 'content-hub-breadcrumb.' + page + '.' + w,
        name: 'Page=' + page + ', SourceViewport=' + w,
        properties: { Page: page, SourceViewport: String(w) },
        sourceHref: sourceHrefs,
        sourceGeometry: {
          sourceCount: count,
          currentRequestedWeight600: true,
          currentMatchedBundledFace: 'Bold700',
          sourceCssSide: chevronSide,
          sourceCssBorder: chevronBorder,
          firstLineIndent: 28,
          separatorBaseline:
            'Finite8px ink-y candidate from reviewed identical16px/24px source breadcrumb profile, not a fresh pseudo baseline/raster measurement.',
          ink: 'Ideal CSS rotated border projection shares reviewed source math; quantized browser pseudo dimensions/native SVG contour and underline baseline remain comparison gates.',
          semantic:
            'Static visible source anatomy and real source hash metadata; native route navigation/HTML list semantics not implemented.',
        },
        tree,
      });
    }

  const routeBands = makeFamily(
    'content-hub-route-band',
    'ContentHub authored route card bands'
  );
  const factBands = makeFamily(
    'content-hub-fact-band',
    'ContentHub authored full-bleed fact bands'
  );
  const reportingGrids = makeFamily(
    'content-hub-reporting-grid',
    'ContentHub authored reporting card grids'
  );
  for (const key of [
    'hub-home',
    'route-overview',
    'routes-vertical',
    'route-landing',
    'route-reporting',
  ])
    for (const w of [390, 1164]) {
      const sets = scene(key, w);
      for (const kind of key === 'route-reporting'
        ? ['reporting']
        : key === 'route-landing'
          ? ['route']
          : ['route', 'fact']) {
        const fact = kind === 'fact',
          report = kind === 'reporting',
          all = sourceCards(sets, kind),
          start = fact ? 3 : 0,
          count = fact ? 6 : report ? 2 : 3;
        const cardsByMode = perMode(m =>
          all[m.id].slice(start, start + count).map(group => group[0])
        );
        const ns = report
          ? one(
              sets,
              n => n.tag === 'DIV' && n.cls === 'mg-grid mg-grid__col-2'
            )
          : one(
              sets,
              n =>
                n.tag === 'SECTION' &&
                (fact
                  ? n.cls.startsWith('mg-demo-band ')
                  : !n.cls && n.text.startsWith('What would you like to do?'))
            );
        const base = fact
          ? perMode(m => ({ ...ns[m.id], x: 0, width: w }))
          : ns;
        const tree = frame(
          'band',
          number(
            key + '/' + w + '/' + kind + '/band-width',
            m => base[m.id].width
          ),
          number(
            key + '/' + w + '/' + kind + '/band-height',
            m => base[m.id].height
          ),
          [],
          fact
            ? {
                fill: paint(
                  key + '/' + w + '/band-source-fill',
                  m => ns[m.id].background.split(' none ')[0]
                ),
              }
            : {}
        );
        if (!report) {
          const heading = one(
            sets,
            n =>
              n.tag === 'H2' &&
              n.text ===
                (fact
                  ? 'What is the Sendai Framework Monitor?'
                  : 'What would you like to do?')
          );
          const lede = one(
            sets,
            n =>
              n.tag === 'P' &&
              n.cls === 'mg-demo-lede | mg-u-font-size-500' &&
              n.text.startsWith(
                fact
                  ? 'The Sendai Framework Monitor is'
                  : 'Three routes into the Monitor'
              )
          );
          for (const [id, observed] of [
            ['heading', heading],
            ['lede', lede],
          ]) {
            const slot = textSlot(
              key + '/' + w + '/' + kind + '/' + id,
              observed,
              base
            );
            slot.id = id;
            tree.children.push(slot);
          }
        }
        for (let i = 0; i < count; i++) {
          const rootBox = perMode(m => cardsByMode[m.id][i]);
          const templateKind = report
            ? 'reporting'
            : fact
              ? 'fact'
              : key === 'routes-vertical'
                ? 'vertical'
                : 'route';
          const template = cards.variants.find(
            v =>
              v.properties.Kind === templateKind &&
              v.properties.Item === String(i + 1) &&
              v.properties.SourceViewport === String(w)
          );
          if (!template) fail('Exact authored card dependency missing');
          for (const m of modes)
            for (const field of ['width', 'height'])
              if (
                value(template.tree.layout[field], m, 'FLOAT') !==
                rootBox[m.id][field]
              )
                fail(
                  'Source context card ' +
                    field +
                    ' differs from exact dependency'
                );
          const slot = allocated(
            key + '/' + w + '/' + kind + '/card-' + (i + 1),
            rootBox,
            base,
            [
              {
                id: 'card-instance-' + (i + 1),
                type: 'INSTANCE',
                name: 'Exact source context card',
                family: 'content-hub-route-card',
                variant: template.properties,
                expose: true,
                layout: { width: 'FILL', height: 'FILL' },
              },
            ]
          );
          slot.id = 'card-' + (i + 1);
          tree.children.push(slot);
        }
        const family = report ? reportingGrids : fact ? factBands : routeBands;
        family.variants.push({
          id: family.id + '.' + key + '.' + w,
          name: 'SourceCase=' + key + ', SourceViewport=' + w,
          properties: { SourceCase: key, SourceViewport: String(w) },
          sourceDependencies: ['content-hub-route-card'],
          sourceGeometry: {
            sourceRoot: base,
            fullBleed: fact
              ? 'Actual source inherited100vw pseudo background behind container-aligned content; native fixed viewport paint projection, no dynamic CSS semantics.'
              : false,
            finiteInitialAnatomy: true,
            nativeTypographyAndPixelsAccepted: false,
          },
          tree,
        });
      }
    }
  const softCta = makeFamily(
    'content-hub-soft-cta',
    'ContentHub authored left-aligned soft CTA'
  );
  for (const w of [390, 1164]) {
    const key = 'route-landing',
      sets = scene(key, w),
      ns = one(
        sets,
        n =>
          n.tag === 'SECTION' && n.cls === 'mg-cta mg-cta--primary mg-cta--soft'
      );
    const tree = frame(
      'soft-cta',
      number(key + '/' + w + '/soft-cta-width', m => ns[m.id].width),
      number(key + '/' + w + '/soft-cta-height', m => ns[m.id].height)
    );
    const wash = paint(key + '/' + w + '/soft-cta-wash', m => {
      const found = /linear-gradient\((rgba\([^)]+\)), \1\)/.exec(
        ns[m.id].background
      );
      if (!found) fail('Source soft CTA wash changed');
      return found[1];
    });
    const white = paint(
      key + '/' + w + '/soft-cta-white',
      m => ns[m.id].background.split(' linear-gradient')[0]
    );
    tree.children.push(
      frame('soft-source-paint', tree.layout.width, tree.layout.height, [], {
        gradient: {
          layers: [
            {
              stops: [
                { position: 0, color: wash },
                { position: 1, color: wash },
              ],
              transform: [
                [1, 0, 0],
                [0, 1, 0],
              ],
            },
            {
              stops: [
                { position: 0, color: white },
                { position: 1, color: white },
              ],
              transform: [
                [1, 0, 0],
                [0, 1, 0],
              ],
            },
          ],
        },
        absolute: {
          horizontal: 'START',
          vertical: 'START',
          offsetX: zero,
          offsetY: zero,
        },
      })
    );
    for (const [id, cls] of [
      ['headline', 'mg-cta__headline mg-u-font-size-600'],
      ['body', 'mg-cta__text'],
    ]) {
      const observed = one(sets, n => n.cls === cls),
        slot = textSlot(key + '/' + w + '/soft-cta-' + id, observed, ns);
      slot.id = id;
      tree.children.push(slot);
    }
    const link = one(sets, n => n.tag === 'A' && n.text === 'Open the Monitor'),
      template = originalCta.variants.find(
        v =>
          v.properties.Context === 'Base' &&
          v.properties.State === 'Default' &&
          v.properties.Content === 'Short' &&
          v.properties.Motion === 'NoPreference'
      );
    if (!template) fail('Exact source Base CTA dependency missing');
    // The finite source host constrains the instance with its actual literal label. Native inheritance and reflow remain open.
    const slot = allocated(key + '/' + w + '/soft-cta-action', link, ns, [
      {
        id: 'open-monitor-instance',
        type: 'INSTANCE',
        name: 'Source Open the Monitor action',
        family: 'editorial-cta',
        variant: template.properties,
        overrides: { Label: 'Open the Monitor' },
        expose: true,
        layout: { width: 'FILL', height: 'FILL' },
      },
    ]);
    slot.id = 'action';
    tree.children.push(slot);
    softCta.variants.push({
      id: 'content-hub-soft-cta.' + w,
      name: 'SourceViewport=' + w,
      properties: { SourceViewport: String(w) },
      sourceDependencies: ['editorial-cta'],
      sourceHref: link.undrr.href,
      sourceGeometry: {
        sourceRoot: ns,
        sourceTone: 'soft',
        sourceCentered: false,
        sourceLayerOrder:
          '8percent source accent wash above source neutral0 base; no node percent-opacity binding.',
        nativeFontPixelReflowAccepted: false,
      },
      tree,
    });
  }

  const pages = makeFamily(
    'content-hub-page',
    'ContentHub authored finite page scenes'
  );
  const pageKeys = [
    'hub-detail',
    'hub-detail-with-hero',
    'hub-detail-detached-header',
    'hub-detail-secondary-header',
    'header-tertiary',
    'route-how-to-report',
    'route-about',
    'route-indicators',
    'route-reports',
    'route-data',
    'hub-home',
    'deeper-page',
    'route-landing',
    'route-overview',
    'route-reporting',
    'route-validate-data',
    'routes-vertical',
  ];
  for (const key of pageKeys)
    for (const w of [390, 1164]) {
      const sets = scene(key, w),
        origin = perMode(() => ({ x: 0, y: 0 })),
        tree = frame(
          'page',
          w,
          number(
            key + '/' + w + '/document-height',
            m => sets[m.id].pageHeight
          ),
          [],
          { fill: 'color/white' }
        );
      const chromeHeight = w === 390 ? 118 : 131;
      tree.children.push(
        frame(
          'closed-chrome',
          w,
          chromeHeight,
          [
            {
              id: 'chrome',
              type: 'INSTANCE',
              name: 'Exact authored closed page chrome',
              family: 'page-chrome',
              variant: {
                Viewport: String(w),
                State: 'Closed',
              },
              expose: true,
              layout: { width: 'FILL', height: 'FILL' },
            },
          ],
          {
            absolute: {
              horizontal: 'START',
              vertical: 'START',
              offsetX: zero,
              offsetY: zero,
            },
          }
        )
      );
      if (key !== 'route-landing') {
        const header = one(sets, n =>
            n.cls.startsWith('mg-hub-header mg-hub-header--')
          ),
          bar = one(sets, n => n.cls === 'mg-hub-header__bar'),
          headerBox = perMode(m => ({
            x: 0,
            y: bar[m.id].y,
            width: w,
            height: header[m.id].height,
          }));
        const host = allocated(
          key + '/' + w + '/page-header',
          headerBox,
          origin,
          [
            {
              id: 'header-instance',
              type: 'INSTANCE',
              name: 'Authored ContentHub header',
              family: 'content-hub-header',
              variant: { SourceCase: key, SourceViewport: String(w) },
              expose: true,
              layout: { width: 'FILL', height: 'FILL' },
            },
          ]
        );
        host.id = 'hub-header';
        tree.children.push(host);
      }
      const introNodes = sets.undrr.records.filter(
        n => n.cls === 'mg-demo-intro'
      );
      if (introNodes.length) {
        const ns = one(sets, n => n.cls === 'mg-demo-intro'),
          slot = allocated(key + '/' + w + '/page-intro', ns, origin, [
            {
              id: 'intro-instance',
              type: 'INSTANCE',
              name: 'Authored source page intro',
              family: 'content-hub-intro',
              variant: { SourceCase: key, SourceViewport: String(w) },
              expose: true,
              layout: { width: 'FILL', height: 'FILL' },
            },
          ]);
        slot.id = 'intro';
        tree.children.push(slot);
      }
      const overview = [
          'hub-home',
          'route-overview',
          'routes-vertical',
        ].includes(key),
        landing = key === 'route-landing',
        reporting = key === 'route-reporting';
      const detail =
        !overview &&
        !landing &&
        !reporting &&
        ![
          'route-about',
          'route-indicators',
          'route-reports',
          'route-data',
        ].includes(key);
      if (detail) {
        for (const [id, family, selector] of [
          [
            'reading',
            'content-hub-reading-column',
            n => n.cls === 'mg-reading__article',
          ],
          ['toc', 'content-hub-toc', n => n.cls === 'mg-table-of-contents'],
        ]) {
          const ns = one(sets, selector),
            slot = allocated(key + '/' + w + '/page-' + id, ns, origin, [
              {
                id: id + '-instance',
                type: 'INSTANCE',
                name: 'Exact authored source ' + id,
                family,
                variant: {
                  Page: ['deeper-page', 'route-validate-data'].includes(key)
                    ? 'validate-data'
                    : 'how-to-report',
                  SourceViewport: String(w),
                },
                expose: true,
                layout: { width: 'FILL', height: 'FILL' },
              },
            ]);
          slot.id = id;
          tree.children.push(slot);
        }
      } else if (!overview && !landing && !reporting) {
        const heading = one(
            sets,
            n => n.tag === 'H2' && n.text === 'Resources and guidance'
          ),
          link = one(
            sets,
            n =>
              n.tag === 'A' && n.text === 'Visit the Sendai Framework Monitor'
          ),
          box = perMode(m => ({
            x: heading[m.id].x,
            y: heading[m.id].y,
            width: heading[m.id].width,
            height: link[m.id].y + link[m.id].height - heading[m.id].y,
          }));
        const slot = allocated(key + '/' + w + '/page-resources', box, origin, [
          {
            id: 'resources-instance',
            type: 'INSTANCE',
            name: 'Exact authored resources body',
            family: 'content-hub-resources',
            variant: { SourceViewport: String(w) },
            expose: true,
            layout: { width: 'FILL', height: 'FILL' },
          },
        ]);
        slot.id = 'resources';
        tree.children.push(slot);
      }
      if (overview || landing || reporting) {
        for (const [id, family, selector] of [
          ...(landing
            ? [
                [
                  'soft-cta',
                  'content-hub-soft-cta',
                  n =>
                    n.tag === 'SECTION' &&
                    n.cls === 'mg-cta mg-cta--primary mg-cta--soft',
                ],
              ]
            : []),
          ...(reporting
            ? [
                [
                  'reporting-grid',
                  'content-hub-reporting-grid',
                  n => n.tag === 'DIV' && n.cls === 'mg-grid mg-grid__col-2',
                ],
              ]
            : [
                [
                  'routes',
                  'content-hub-route-band',
                  n =>
                    n.tag === 'SECTION' &&
                    !n.cls &&
                    n.text.startsWith('What would you like to do?'),
                ],
              ]),
          ...(overview
            ? [
                [
                  'facts',
                  'content-hub-fact-band',
                  n => n.tag === 'SECTION' && n.cls.startsWith('mg-demo-band '),
                ],
              ]
            : []),
        ]) {
          const ns = one(sets, selector),
            box =
              id === 'facts'
                ? perMode(m => ({ ...ns[m.id], x: 0, width: w }))
                : ns;
          const selectorProps = {
            SourceViewport: String(w),
            ...(id === 'soft-cta' ? {} : { SourceCase: key }),
          };
          const slot = allocated(key + '/' + w + '/page-' + id, box, origin, [
            {
              id: id + '-instance',
              type: 'INSTANCE',
              name: 'Exact authored ' + id + ' source body',
              family,
              variant: selectorProps,
              expose: true,
              layout: { width: 'FILL', height: 'FILL' },
            },
          ]);
          slot.id = id;
          tree.children.push(slot);
        }
      }
      const breadcrumbRecords = sets.undrr.records.filter(
        n => n.tag === 'NAV' && n.cls.startsWith('mg-breadcrumb')
      );
      if (breadcrumbRecords.length) {
        const ns = one(
            sets,
            n => n.tag === 'NAV' && n.cls.startsWith('mg-breadcrumb')
          ),
          slot = allocated(key + '/' + w + '/page-breadcrumb', ns, origin, [
            {
              id: 'breadcrumb-instance',
              type: 'INSTANCE',
              name: 'Actual source inline breadcrumb',
              family: 'content-hub-breadcrumb',
              variant: {
                Page: landing ? 'landing' : 'validate-data',
                SourceViewport: String(w),
              },
              expose: true,
              layout: { width: 'FILL', height: 'FILL' },
            },
          ]);
        slot.id = 'breadcrumb';
        tree.children.push(slot);
      }
      pages.variants.push({
        id: 'content-hub-page.' + key + '.' + w,
        name: 'SourceCase=' + key + ', SourceViewport=' + w,
        properties: {
          SourceCase: key,
          SourceViewport: String(w),
          Locale: 'English',
          Navigation: 'Closed',
        },
        sourceGeometry: {
          actualDocumentHeight: perMode(m => sets[m.id].pageHeight),
          sourceViewportHeight: 1000,
          extent:
            'Observed finite document scene includes actual source viewport minimum; fixed source allocations, not arbitrary responsive/edit reflow.',
          completeCapturedVisibleAnatomy: true,
          fullContentHubScopeComplete: false,
        },
        sourceHref: sets.undrr.records
          .filter(n => n.href)
          .map(n => ({ text: n.text, href: n.href })),
        sourceDependencies: [
          'page-chrome',
          ...(!landing ? ['content-hub-header'] : []),
          ...(overview
            ? ['content-hub-route-band', 'content-hub-fact-band']
            : landing
              ? ['content-hub-soft-cta', 'content-hub-route-band']
              : reporting
                ? ['content-hub-reporting-grid']
                : []),
          ...(introNodes.length ? ['content-hub-intro'] : []),
          ...(detail
            ? ['content-hub-reading-column']
            : !overview && !landing && !reporting
              ? ['content-hub-resources']
              : []),
          ...(detail ? ['content-hub-toc'] : []),
          ...(breadcrumbRecords.length ? ['content-hub-breadcrumb'] : []),
        ],
        tree,
      });
    }
  return [
    tertiaryCta,
    headers,
    reading,
    intro,
    resources,
    toc,
    cards,
    breadcrumbs,
    routeBands,
    factBands,
    reportingGrids,
    softCta,
    pages,
  ];
}
module.exports = { buildContentHubRecipes, SOURCE_HASHES };
