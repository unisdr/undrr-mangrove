/** Source-owned editorial CTA recipes, separate from conventional Button and Text CTA. */
const fs = require('fs');
const path = require('path');
function buildEditorialCtaAssets({ root, modes, variables, styles }) {
  const button = 'stories/Components/Buttons/CtaButton/cta-button.scss';
  const jsx = 'stories/Components/Buttons/CtaButton/CtaButton.jsx';
  const stories = 'stories/Components/Buttons/CtaButton/CtaButton.stories.jsx';
  const hero = 'stories/Components/Hero/hero.scss';
  const foundation = 'stories/assets/scss/_foundational.scss';
  const mixins = 'stories/assets/scss/_mixins.scss';
  const files = new Map();
  const read = file => {
    if (!files.has(file))
      files.set(file, fs.readFileSync(path.join(root, file), 'utf8'));
    return files.get(file);
  };
  const fail = message => {
    throw new Error(`Figma editorial CTA recipe needs updating: ${message}`);
  };
  const source = (file, pattern) => {
    const match = pattern.exec(read(file));
    if (!match) fail(`${file} no longer matches ${pattern}`);
    return {
      file,
      line: read(file).slice(0, match.index).split('\n').length,
    };
  };
  const clean = text => text.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '');
  function block(text, selector) {
    const start = text.indexOf(selector),
      open = text.indexOf('{', start);
    if (start < 0 || open < 0) fail(`Missing ${selector}`);
    let depth = 1,
      end = open + 1;
    for (; end < text.length && depth; end++) {
      if (text[end] === '{') depth++;
      if (text[end] === '}') depth--;
    }
    if (depth) fail(`Unbalanced ${selector}`);
    return text.slice(open + 1, end - 1);
  }
  const guard = (text, pattern, message) => {
    if (!pattern.test(text)) fail(message);
  };
  const scss = clean(read(button));
  const base = block(scss, '.mg-button {');
  const editorial = block(scss, '.mg-button.mg-button-cta {');
  const badge = block(editorial, '&::after {');
  const hover = block(editorial, '&:hover {');
  const heroScss = clean(read(hero));
  for (const [pattern, message] of [
    [
      /font-family:\s*var\(--mg-font-family-text\);\s*font-size:\s*var\(--mg-font-size-button\);\s*font-weight:\s*600;/,
      'Button font role/size/weight changed',
    ],
    [
      /line-height:\s*1;\s*border-radius:\s*var\(--mg-radius-button\);/,
      'Button line height/radius changed',
    ],
    [
      /border:\s*var\(--mg-border-width-button\) solid var\(--mg-border-color-button\);/,
      'Button border geometry changed',
    ],
    [/&:focus-visible\s*{\s*@include mg-focus-ring;/, 'Button focus changed'],
  ])
    guard(base, pattern, message);
  for (const [pattern, message] of [
    [
      /background:\s*transparent;\s*border-color:\s*transparent;\s*color:\s*rgb\(var\(--mg-color-text\)\);/,
      'Editorial default paint changed',
    ],
    [
      /flex:\s*0 0 auto;\s*justify-content:\s*flex-start;\s*max-inline-size:\s*100%;\s*min-height:\s*mg-rem\(44\);\s*overflow-wrap:\s*anywhere;/,
      'Editorial intrinsic geometry/wrap changed',
    ],
    [
      /padding:\s*var\(--mg-spacing-50\) 0;\s*padding-inline-end:\s*calc\(#\{mg-rem\(22\)\} \+ var\(--mg-spacing-50\)\);\s*position:\s*relative;\s*text-align:\s*start;\s*white-space:\s*normal;/,
      'Editorial reserved padding/position changed',
    ],
    [
      /&:active:not\(\.disabled\)\s*{\s*scale:\s*1;/,
      'Editorial root active scale changed',
    ],
  ])
    guard(editorial, pattern, message);
  guard(
    badge,
    /background:\s*rgb\(var\(--mg-color-interactive\)\);\s*border-radius:\s*50%;\s*color:\s*rgb\(var\(--mg-color-neutral-0\)\);\s*content:\s*"›";/,
    'Source badge paints/glyph changed'
  );
  guard(
    badge,
    /font-family:\s*var\(--mg-font-family-text\);\s*font-size:\s*mg-rem\(18\);\s*font-weight:\s*700;\s*height:\s*mg-rem\(22\);\s*inline-size:\s*mg-rem\(22\);/,
    'Badge face/type/size changed'
  );
  guard(
    badge,
    /inset-block-start:\s*50%;\s*inset-inline-end:\s*0;\s*justify-content:\s*center;\s*line-height:\s*1;\s*padding-block-end:\s*0\.06em;\s*padding-inline-start:\s*0\.03em;\s*position:\s*absolute;/,
    'Badge absolute placement/optical padding changed'
  );
  guard(
    badge,
    /translate:\s*var\(--mg-cta-arrow-shift, 0\) -50%;/,
    'Badge centering changed'
  );
  guard(
    hover,
    /background:\s*transparent;\s*border-color:\s*transparent;\s*color:\s*rgb\(var\(--mg-color-interactive-active\)\);\s*text-decoration:\s*underline;\s*text-underline-offset:\s*0\.2em;/,
    'Hover paint/underline changed'
  );
  guard(
    hover,
    /&::after\s*{\s*background:\s*rgb\(var\(--mg-color-interactive-active\)\);/,
    'Hover badge paint changed'
  );
  guard(
    hover,
    /@media \(prefers-reduced-motion: no-preference\)\s*{\s*&::after\s*{\s*--mg-cta-arrow-shift:\s*#\{mg-rem\(3\)\};/,
    'Normal-motion hover shift changed'
  );
  const disabled = block(scss, '.mg-button.disabled {\n  background-color:');
  guard(
    disabled,
    /background-color:\s*rgb\(var\(--mg-color-neutral-500\)\);\s*color:\s*rgb\(var\(--mg-color-neutral-0\)\);\s*pointer-events:\s*none;/,
    'Disabled cascade changed'
  );
  if (
    scss.indexOf('.mg-button.disabled {\n  background-color:') >
    scss.indexOf('.mg-button.mg-button-cta {')
  )
    fail('Disabled rules now override editorial paints');
  const foundationScss = clean(read(foundation));
  guard(
    foundationScss,
    /\*,\s*\*::before,\s*\*::after\s*{\s*box-sizing:\s*border-box;/,
    'Shared element/pseudo border-box sizing changed'
  );
  const anchor = block(foundationScss, '\na {');
  guard(
    anchor,
    /&:focus-visible\s*{\s*@include mg-focus-ring;\s*text-decoration:\s*underline;/,
    'Inherited focus underline changed'
  );
  guard(
    block(clean(read(mixins)), '@mixin mg-focus-ring {'),
    /box-shadow:\s*0 0 0 var\(--mg-focus-ring-offset\) rgb\(var\(--mg-color-neutral-0\)\);\s*outline:\s*var\(--mg-focus-ring-width\) solid rgb\(var\(--mg-color-focus-ring\)\);\s*outline-offset:\s*var\(--mg-focus-ring-offset\);/,
    'Opaque focus geometry changed'
  );
  for (const context of [
    block(heroScss, '.mg-hero {'),
    block(heroScss, '.mg-hero--split {'),
  ]) {
    guard(
      context,
      /a\.mg-button\.mg-button-cta,\s*a\.mg-button\.mg-button-cta:hover,\s*a\.mg-button\.mg-button-cta:visited\s*{\s*background:\s*transparent;\s*border-color:\s*transparent;\s*color:\s*rgb\(var\(--mg-color-neutral-0\)\);\s*&::after\s*{\s*background:\s*rgb\(var\(--mg-color-neutral-0\)\);\s*color:\s*rgb\(var\(--mg-hero-cta-color\)\);/,
      'Hero label/badge overrides changed'
    );
    guard(
      context,
      /a\.mg-button:focus-visible\s*{\s*box-shadow:\s*0 0 0 2px rgb\(var\(--mg-color-neutral-0\)\);\s*outline:\s*2px solid rgb\(var\(--mg-color-focus-ring-inverse\)\);\s*outline-offset:\s*2px;/,
      'Hero inverse focus changed'
    );
  }
  guard(
    heroScss,
    /--mg-hero-cta-color:\s*var\(--mg-color-hero\);/,
    'Hero primary badge ink changed'
  );
  guard(
    heroScss,
    /\$variant-colour-props:\s*\(\s*"tertiary": "--mg-color-neutral-900",\s*"quaternary": "--mg-color-red-800",\s*\);/,
    'Hero tone mapping changed'
  );
  guard(
    heroScss,
    /--mg-hero-cta-color:\s*var\(#\{\$prop\}\);/,
    'Hero tone badge ink changed'
  );
  source(jsx, /Variant === 'CTA' && 'mg-button-cta'/);
  source(jsx, /const isDisabled = State === 'Disabled'/);
  source(jsx, /'aria-disabled': 'true', tabIndex: -1/);
  source(jsx, /\{ href, onClick \}/);
  const storyRef = source(stories, /export const EditorialCta =/);
  const consumerRef = source(stories, /maxWidth: '260px'/);
  source(stories, /label: 'Browse all publications'/);
  source(
    stories,
    /Consulter toutes les publications sur la réduction des risques de catastrophe/
  );
  source('stories/assets/fonts/roboto/sass/_Bold.scss', /font-weight:\s*700;/);
  const byName = new Map(variables.map(v => [v.name, v]));
  const value = (name, mode, seen = new Set()) => {
    if (seen.has(name)) fail(`Circular alias ${name}`);
    seen.add(name);
    const entry = byName.get(name)?.values[mode.id];
    if (entry == null) fail(`Missing variable ${name}/${mode.id}`);
    return entry.alias ? value(entry.alias, mode, seen) : entry;
  };
  const perMode = get =>
    Object.fromEntries(modes.map(mode => [mode.id, get(mode)]));
  const ref = source(button, /\.mg-button\.mg-button-cta\s*{/);
  function helper(name, get, scopes, description, sourceRef = ref) {
    const fullName = `component/editorial-cta/${name}`;
    const definition = {
      id: fullName.replaceAll('/', '.'),
      name: fullName,
      type: 'FLOAT',
      scopes,
      hiddenFromPublishing: false,
      description,
      source: sourceRef,
      codeSyntax: {},
      values: perMode(get),
    };
    if (Object.values(definition.values).some(v => !Number.isFinite(v)))
      fail(`Invalid helper ${name}`);
    const index = variables.findIndex(v => v.name === fullName);
    if (index < 0) variables.push(definition);
    else variables[index] = definition;
    byName.set(fullName, definition);
    return fullName;
  }
  const badgeSize = helper(
    'badge-size',
    () => 22,
    ['WIDTH_HEIGHT'],
    'Source authored 22px circle; its absolute position does not contribute to action layout.'
  );
  const badgeFont = helper(
    'badge-font-size',
    () => 18,
    ['FONT_SIZE'],
    'Source authored 18px source glyph, not an icon-font substitute.'
  );
  const badgeRadius = helper(
    'badge-radius',
    mode => value(badgeSize, mode) / 2,
    ['CORNER_RADIUS'],
    'Source 50% radius on a 22px circle.'
  );
  const minimum = helper(
    'minimum-height',
    () => 44,
    ['WIDTH_HEIGHT'],
    'Source min-height:44px. Edited multiline text can increase action height.'
  );
  const reserve = helper(
    'reserved-inline-end',
    mode => value(badgeSize, mode) + value('spacing/50', mode),
    ['GAP'],
    'Source padding-inline-end reserves badge22px plus spacing/50; border remains separate.'
  );
  const opticalLeft = helper(
    'badge-optical-inline-start',
    mode => value(badgeFont, mode) * 0.03,
    ['GAP'],
    'Source glyph optical .03em leading padding, based on the glyph own font size.'
  );
  const opticalBottom = helper(
    'badge-optical-block-end',
    mode => value(badgeFont, mode) * 0.06,
    ['GAP'],
    'Source glyph optical .06em bottom padding, based on the glyph own font size.'
  );
  const shift = helper(
    'hover-shift',
    () => 3,
    ['WIDTH_HEIGHT'],
    'Source normal-motion hover badge translate3px; label and action width remain unchanged.'
  );
  const offset = helper(
    'badge-end-offset',
    mode => -value('border-width/button', mode),
    ['WIDTH_HEIGHT'],
    'Native END offset includes the CSS containing-block border inset. Browser confirms 1px inward at current source border1.'
  );
  const hoverOffset = helper(
    'badge-hover-end-offset',
    mode => value(shift, mode) - value('border-width/button', mode),
    ['WIDTH_HEIGHT'],
    'Source normal hover3px minus the CSS containing-block border inset; current rendered badge protrudes2px.'
  );
  const consumerWidth = helper(
    'long-consumer-width',
    () => 260,
    ['WIDTH_HEIGHT'],
    'Source LongLabels story consumer maximum width260px, a bounded preset rather than a universal component width.',
    consumerRef
  );
  const heroFocus = {};
  for (const [role, declaration] of [
    ['width', 'outline: 2px'],
    ['offset', 'outline-offset: 2px'],
  ])
    heroFocus[role] = helper(
      `hero-focus-${role}`,
      () => 2,
      ['STROKE_FLOAT'],
      `Hero source ${declaration}; source-owned focus geometry separate from regular focus roles.`,
      source(
        hero,
        role === 'width'
          ? /outline: 2px solid rgb\(var\(--mg-color-focus-ring-inverse\)\)/
          : /outline-offset: 2px/
      )
    );
  const heroOuter = helper(
    'hero-focus-outer-radius',
    mode => value('radius/button', mode) + value(heroFocus.offset, mode),
    ['CORNER_RADIUS'],
    'Hero source button radius plus its authored focus separator2px.',
    source(hero, /outline-offset: 2px/)
  );
  const normalOuter = helper(
    'focus-outer-radius',
    mode => value('radius/button', mode) + value('focus-ring/offset', mode),
    ['CORNER_RADIUS'],
    'Source button radius plus the normal mg-focus-ring separator offset.'
  );
  const shared = styles.text.find(s => s.id === 'component.button');
  if (!shared) fail('Existing component.button text style is required');
  for (const mode of modes) {
    const type = shared.values[mode.id];
    if (
      value('font-family/text', mode) !== 'Roboto' ||
      type?.fontName?.family !== 'Roboto' ||
      type?.fontName?.style !== 'Bold' ||
      type.fontSize !== value('font-size/button', mode) ||
      type.lineHeight?.unit !== 'PERCENT' ||
      type.lineHeight.value !== 100
    )
      fail(`Shared source Button typography differs in ${mode.id}`);
  }
  function textStyle(role, size, decoration, decorationOffset, weight) {
    const id = `component.editorial-cta.${role}`;
    const definition = {
      id,
      name: `Mangrove/component/editorial-cta/${role}`,
      type: 'TEXT',
      recommended: false,
      source: role === 'badge' ? source(button, /content: "›"/) : ref,
      description:
        'Source Roboto typography. Label CSS600 matches bundled Bold700 in the isolated browser; badge is authored700. No font substitution. Underline offset is exported for shared style and native text property consumers.',
      typography: {
        fontWeightRequested: weight,
        fontWeightBundled: 700,
        fontStyleBundled: 'Bold',
        fontMatchRationale:
          weight === 600
            ? 'Browser CDP confirms that CSS600 matched source Roboto-Bold700 in the measured browser.'
            : 'Source authored Roboto700.',
        lineHeightRatio: 1,
        lineHeightBasis: 'own-font-size',
        verification:
          'Actual JSX and freshly compiled source measured in isolated Chromium; native font equivalence, glyph shape and wrap acceptance remain pending.',
      },
      bindings: {
        fontFamily: 'font-family/text',
        fontSize: size,
      },
      values: perMode(mode => ({
        fontName: {
          family: value('font-family/text', mode),
          style: 'Bold',
        },
        fontSize: value(size, mode),
        lineHeight: {
          unit: 'PERCENT',
          value: 100,
        },
        textDecoration: decoration,
        textDecorationOffset: decorationOffset,
        textWrapStyle: 'AUTO',
      })),
    };
    const index = styles.text.findIndex(s => s.id === id);
    if (index < 0) styles.text.push(definition);
    else styles.text[index] = definition;
    return id;
  }
  const typography = {
    normal: textStyle(
      'label',
      'font-size/button',
      'NONE',
      {
        unit: 'AUTO',
      },
      600
    ),
    hover: textStyle(
      'label-hover',
      'font-size/button',
      'UNDERLINE',
      {
        unit: 'PERCENT',
        value: 20,
      },
      600
    ),
    focus: textStyle(
      'label-focus',
      'font-size/button',
      'UNDERLINE',
      {
        unit: 'AUTO',
      },
      600
    ),
    badge: textStyle(
      'badge',
      badgeFont,
      'NONE',
      {
        unit: 'AUTO',
      },
      700
    ),
  };
  return {
    button,
    jsx,
    stories,
    hero,
    foundation,
    mixins,
    files,
    read,
    fail,
    source,
    clean,
    block,
    guard,
    scss,
    base,
    editorial,
    badge,
    hover,
    heroScss,
    disabled,
    foundationScss,
    anchor,
    storyRef,
    consumerRef,
    byName,
    value,
    perMode,
    ref,
    helper,
    badgeSize,
    badgeFont,
    badgeRadius,
    minimum,
    reserve,
    opticalLeft,
    opticalBottom,
    shift,
    offset,
    hoverOffset,
    consumerWidth,
    heroFocus,
    heroOuter,
    normalOuter,
    shared,
    textStyle,
    typography,
  };
}
module.exports = {
  buildEditorialCtaAssets,
};
