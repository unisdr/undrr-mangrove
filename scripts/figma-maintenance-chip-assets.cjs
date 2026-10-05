/** Source-owned Chips recipes. Browser measurements do not establish native fidelity. */
const fs = require('fs');
const path = require('path');
function buildChipAssets({ root, modes, variables, styles }) {
  const scss = 'stories/Components/Buttons/Chips/chips.scss';
  const jsx = 'stories/Components/Buttons/Chips/Chips.jsx';
  const story = 'stories/Components/Buttons/Chips/Chips.stories.jsx';
  const files = new Map();
  const read = file => {
    if (!files.has(file))
      files.set(file, fs.readFileSync(path.join(root, file), 'utf8'));
    return files.get(file);
  };
  const fail = message => {
    throw new Error(`Figma Chips recipe needs updating: ${message}`);
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
  const chip = block(clean(read(scss)), '.mg-chip {');
  const base = chip.slice(0, chip.indexOf('@media'));
  for (const [pattern, message] of [
    [/align-items:\s*center;/, 'Vertical alignment changed'],
    [/background:\s*rgb\(var\(--mg-color-neutral-50\)\);/, 'Surface changed'],
    [/border:\s*0;\s*border-radius:\s*999px;/, 'Border/pill shape changed'],
    [/box-sizing:\s*border-box;/, 'Box geometry changed'],
    [/box-shadow:\s*var\(--mg-shadow-raised\);/, 'Raised effect changed'],
    [/color:\s*rgb\(var\(--mg-color-text\)\);/, 'Text colour changed'],
    [/display:\s*inline-flex;/, 'Intrinsic flex layout changed'],
    [
      /font-family:\s*var\(--mg-font-family-text\);\s*font-size:\s*var\(--mg-font-size-250\);\s*font-weight:\s*500;/,
      'Label font role/size/weight changed',
    ],
    [/line-height:\s*1\.25;/, 'Label line height changed'],
    [/min-height:\s*mg-rem\(40\);/, 'Minimum height changed'],
    [
      /padding:\s*var\(--mg-spacing-50\) var\(--mg-spacing-150\);/,
      'Padding changed',
    ],
    [
      /text-align:\s*start;\s*text-decoration:\s*none;/,
      'Label treatment changed',
    ],
    [
      /^(?![\s\S]*(?:max-width|min-width|white-space|overflow-wrap|opacity|scale):)/,
      'Intrinsic wrapping or rest opacity/transform changed',
    ],
  ])
    guard(base, pattern, message);
  guard(
    block(chip, '&:hover {'),
    /background-color:\s*rgb\(var\(--mg-color-neutral-300\)\);\s*color:\s*rgb\(var\(--mg-color-text\)\);\s*text-decoration:\s*none;/,
    'Hover paint/decoration changed'
  );
  guard(
    block(chip, '&:active {'),
    /^\s*scale:\s*0\.96;\s*$/,
    'Pending source active transform changed'
  );
  guard(
    block(chip, '&:focus-visible {'),
    /^\s*border-radius:\s*999px;\s*@include mg-focus-ring;\s*$/,
    'Focus shape or raised-effect replacement changed'
  );
  const cross = block(chip, '&.mg-chip__cross::after {');
  for (const [pattern, message] of [
    [/align-items:\s*center;\s*content:\s*"×";/, 'Dismiss glyph changed'],
    [
      /display:\s*inline-flex;\s*flex:\s*0 0 mg-rem\(20\);/,
      'Dismiss fixed flex geometry changed',
    ],
    [
      /font-size:\s*mg-rem\(18\);\s*font-weight:\s*400;/,
      'Dismiss font changed',
    ],
    [
      /height:\s*mg-rem\(20\);\s*justify-content:\s*center;\s*line-height:\s*1;/,
      'Dismiss alignment/line height changed',
    ],
    [
      /margin-inline-end:\s*calc\(-1 \* var\(--mg-spacing-50\)\);\s*margin-inline-start:\s*var\(--mg-spacing-50\);/,
      'Dismiss margin transform changed',
    ],
  ])
    guard(cross, pattern, message);
  guard(
    chip,
    /^(?![\s\S]*(?::(?:disabled|checked|selected)|\[disabled\]|&(?:--selected|\.selected)))/,
    'New choice-state CSS needs review'
  );
  source(jsx, /Type === 'With X' && 'mg-chip__cross'/);
  source(
    jsx,
    /if \(Type === 'With X'\)\s*\{\s*return \(\s*<button\s*\{\.\.\.props\}\s*type="button"/
  );
  source(jsx, /aria-label=\{removeLabel \|\| `Remove filter: \$\{label\}`\}/);
  source(
    jsx,
    /<a \{\.\.\.props\} className=\{classes\} href=\{href\}>\s*\{label\}/
  );
  const mediumFile = 'stories/assets/fonts/roboto/sass/_Medium.scss';
  source(mediumFile, /font-family:\s*Roboto;/);
  source(
    mediumFile,
    /fontdef-woff\([^;]+"Medium"\);\s*font-weight:\s*500;\s*font-style:\s*normal;/
  );
  source('stories/assets/fonts/roboto/roboto.scss', /@import "sass\/Medium";/);
  source(
    'stories/assets/fonts/roboto/sass/_Regular.scss',
    /font-weight:\s*400;\s*font-style:\s*normal;/
  );
  source(story, /label="Disaster risk financing and insurance"/);
  source(story, /label="Réduction des risques de catastrophe"/);
  const mixins = block(
    clean(read('stories/assets/scss/_mixins.scss')),
    '@mixin mg-focus-ring {'
  );
  guard(
    mixins,
    /box-shadow:\s*0 0 0 var\(--mg-focus-ring-offset\) rgb\(var\(--mg-color-neutral-0\)\);\s*outline:\s*var\(--mg-focus-ring-width\) solid rgb\(var\(--mg-color-focus-ring\)\);\s*outline-offset:\s*var\(--mg-focus-ring-offset\);/,
    'Focus geometry/paint changed'
  );
  if (!styles.effect.some(style => style.id === 'shadow.raised'))
    fail('Shared source shadow.raised effect is required');
  const ref = source(scss, /\.mg-chip\s*{/);
  const byName = new Map(variables.map(variable => [variable.name, variable]));
  function value(name, mode, seen = new Set()) {
    if (seen.has(name)) fail(`Circular alias ${name}`);
    seen.add(name);
    const entry = byName.get(name)?.values[mode.id];
    if (entry == null) fail(`Missing variable ${name}/${mode.id}`);
    return entry.alias ? value(entry.alias, mode, seen) : entry;
  }
  const perMode = get =>
    Object.fromEntries(modes.map(mode => [mode.id, get(mode)]));
  function helper(name, get, scopes, description, sourceRef = ref) {
    const fullName = `component/chips/${name}`;
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
  const minimum = helper(
    'minimum-height',
    () => 40,
    ['WIDTH_HEIGHT'],
    'Source min-height40px. Multiline text can grow above it.'
  );
  const radius = helper(
    'pill-radius',
    () => 999,
    ['CORNER_RADIUS'],
    'Source authored999px, clamped by native geometry to a pill.'
  );
  const outer = helper(
    'focus-outer-radius',
    mode => value(radius, mode) + value('focus-ring/offset', mode),
    ['CORNER_RADIUS'],
    'Source pill radius plus focus separator offset; native geometry clamps the expanded pill.'
  );
  const glyphSize = helper(
    'dismiss-size',
    () => 20,
    ['WIDTH_HEIGHT'],
    'Source fixed20px pseudo-element, flex-shrink0.'
  );
  const glyphFont = helper(
    'dismiss-font-size',
    () => 18,
    ['FONT_SIZE'],
    'Source multiplication glyph18px, Regular400, own-size line-height1.'
  );
  const dismissPadding = helper(
    'dismiss-padding-end',
    mode => value('spacing/150', mode) - value('spacing/50', mode),
    ['GAP'],
    'Native layout absorbs source negative end margin: padding150 minus spacing50. Leading padding and glyph start margin remain source values.'
  );
  const longWidth = helper(
    'long-consumer-width',
    () => 240,
    ['WIDTH_HEIGHT'],
    'Bounded240px source research consumer using actual long-label story text; not a Chips CSS declaration.',
    source(story, /export const LongLabels/)
  );
  const narrowLink = helper(
    'narrow-linked-control-width',
    () => 91.28125,
    ['WIDTH_HEIGHT'],
    'Measured UNDRR/Latin source min-content control width in80px consumer for the guarded English LongLabels text, Chrome153, revisionf60eb97d. Arbitrary edits/native font metrics do not automatically recompute HTML intrinsic width.',
    source(story, /label="Disaster risk financing and insurance"/)
  );
  const narrowDismiss = helper(
    'narrow-dismiss-control-width',
    () => 124.828125,
    ['WIDTH_HEIGHT'],
    'Measured UNDRR/Latin source min-content control width in80px consumer for the guarded French LongLabels text, Chrome153, revisionf60eb97d. Native multiline HUG prevents clipping; exact wrapping remains acceptance work.',
    source(story, /label="Réduction des risques de catastrophe"/)
  );
  for (const mode of modes) {
    if (value('font-family/text', mode) !== 'Roboto')
      fail(`Unverified Chips font in ${mode.id}`);
    if (
      value('font-size/250', mode) !== 14 ||
      value('spacing/50', mode) !== 5 ||
      value('spacing/150', mode) !== 15
    )
      fail(`Measured narrow Chips typography/padding differs in ${mode.id}`);
  }
  function textStyle(role, size, weight, face, ratio) {
    const id = `component.chips.${role}`;
    const definition = {
      id,
      name: `Mangrove/component/chips/${role}`,
      type: 'TEXT',
      recommended: false,
      source:
        role === 'label'
          ? source(scss, /font-weight:\s*500;/)
          : source(scss, /content:\s*"×"/),
      description: `Source requested${weight} uses actual Roboto ${face}; CDP browser observation confirms this face. No font substitution. Native font-file equivalence and wrapping remain pending.`,
      typography: {
        fontWeightRequested: weight,
        fontWeightBundled: weight,
        fontStyleBundled: face,
        fontMatchRationale: `Actual source browser CDP reports Roboto-${face}, not a weight fallback.`,
        lineHeightRatio: ratio,
        lineHeightBasis: 'own-font-size',
        verification:
          'Isolated actual JSX/fresh full SCSS, UNDRR Latin; native rendering pending.',
      },
      bindings: {
        fontFamily: 'font-family/text',
        fontSize: size,
      },
      values: perMode(mode => ({
        fontName: {
          family: value('font-family/text', mode),
          style: face,
        },
        fontSize: value(size, mode),
        lineHeight: {
          unit: 'PERCENT',
          value: ratio * 100,
        },
        textDecoration: 'NONE',
        textWrapStyle: 'AUTO',
      })),
    };
    const index = styles.text.findIndex(style => style.id === id);
    if (index < 0) styles.text.push(definition);
    else styles.text[index] = definition;
    return id;
  }
  const labelStyle = textStyle('label', 'font-size/250', 500, 'Medium', 1.25);
  const glyphStyle = textStyle('dismiss-glyph', glyphFont, 400, 'Regular', 1);
  return {
    scss,
    jsx,
    story,
    files,
    read,
    fail,
    source,
    clean,
    block,
    guard,
    chip,
    base,
    cross,
    mediumFile,
    mixins,
    ref,
    byName,
    value,
    perMode,
    helper,
    minimum,
    radius,
    outer,
    glyphSize,
    glyphFont,
    dismissPadding,
    longWidth,
    narrowLink,
    narrowDismiss,
    textStyle,
    labelStyle,
    glyphStyle,
  };
}
module.exports = {
  buildChipAssets,
};
