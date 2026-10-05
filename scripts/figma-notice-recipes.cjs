/** Experimental source-only Notice presets. No publication or native acceptance. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function buildNoticeRecipes({ root, modes, variables, styles }) {
  const scss = 'stories/Components/Notice/notice.scss';
  const jsx = 'stories/Components/Notice/Notice.jsx';
  const icons = 'stories/Atom/Icons/_icon-definitions.scss';
  const read = file => fs.readFileSync(path.join(root, file), 'utf8');
  const fail = message => {
    throw new Error(`Figma Notice recipe needs updating: ${message}`);
  };
  const clean = text =>
    text
      .replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  // Fail closed on later rules or JSX changes that can invalidate a bounded
  // projection even when its individual declaration guards still match.
  for (const [file, expected] of [
    [scss, 'ae84e317f7e64a0e430fbe5664f12645522ae9d1bd982be6991a4d582c44a982'],
    [jsx, 'fb17072ee149094b52d81833434c3bea39b5eb73ebe20201b9299ef0979ed100'],
  ]) {
    if (
      crypto
        .createHash('sha256')
        .update(clean(read(file)))
        .digest('hex') !== expected
    )
      fail(
        `${file} anatomy or treatment changed; review the bounded projection`
      );
  }
  const source = (file, pattern) => {
    const text = read(file),
      match = pattern.exec(text);
    if (!match) fail(`${file} no longer matches ${pattern}`);
    return { file, line: text.slice(0, match.index).split('\n').length };
  };
  function block(selector) {
    const text = read(scss).replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '');
    const start = text.indexOf(selector),
      open = text.indexOf('{', start);
    if (start < 0 || open < 0) fail(`Missing ${selector}`);
    let depth = 1,
      end = open + 1;
    for (; depth && end < text.length; end++) {
      if (text[end] === '{') depth++;
      if (text[end] === '}') depth--;
    }
    if (depth) fail(`Unbalanced ${selector}`);
    return text.slice(open + 1, end - 1);
  }
  const guard = (text, pattern) => {
    if (!pattern.test(text)) fail(`Source contract changed: ${pattern}`);
  };
  source(
    jsx,
    /NOTICE_VARIANTS = \['info', 'warning', 'negative', 'positive'\]/
  );
  source(
    jsx,
    /info: 'mg-icon-info-circle',\s*warning: 'mg-icon-exclamation-triangle',\s*negative: 'mg-icon-exclamation-triangle',\s*positive: <CheckCircleIcon \/>/
  );
  source(
    jsx,
    /<HeadingTag className="mg-notice__title">\{title\}<\/HeadingTag>/
  );
  source(jsx, /typeof content === 'string' \? <p>\{content\}<\/p> : content/);
  const base = block('.mg-notice {').split('&--warning')[0];
  for (const pattern of [
    /--mg-notice-border-color: rgb\(var\(--mg-color-blue-900\) \/ 0\.5\);/,
    /--mg-notice-bg: rgb\(var\(--mg-color-blue-50\)\);/,
    /--mg-notice-icon-color: rgb\(var\(--mg-color-blue-900\)\);/,
    /--mg-notice-border-width: 4px;/,
    /display: flex;\s*flex-direction: column;\s*gap: var\(--mg-spacing-100\);/,
    /padding: var\(--mg-spacing-150\) var\(--mg-spacing-200\);/,
    /background-color: var\(--mg-notice-bg\);/,
    /box-sizing: border-box;/,
    /border: 1px solid var\(--mg-notice-border-color\);/,
    /border-inline-start-width: var\(--mg-notice-border-width\);/,
    /border-radius: var\(--mg-radius-button\);/,
    /font-family: var\(--mg-font-family-text\);/,
    /color: rgb\(var\(--mg-color-neutral-900\)\);/,
  ])
    guard(base, pattern);
  guard(
    block('&__header {'),
    /display: flex;\s*align-items: center;\s*gap: var\(--mg-spacing-75\);\s*flex-wrap: wrap;\s*width: 100%;/
  );
  guard(block('&__icon {'), /font-size: 1\.5em;\s*line-height: 1;/);
  guard(block('&__icon {'), /color: var\(--mg-notice-icon-color\);/);
  guard(
    block('&__title {'),
    /margin: 0;\s*font-family: var\(--mg-font-family-ui\);\s*font-size: var\(--mg-font-size-300\);\s*font-weight: 600;\s*line-height: 1\.35;\s*flex-grow: 1;/
  );
  guard(
    block('&__description {'),
    /font-size: var\(--mg-font-size-250\);\s*line-height: 1\.5;\s*color: rgb\(var\(--mg-color-neutral-700\)\);/
  );
  guard(block('&__description {'), /&:last-child\s*\{\s*margin-bottom: 0;/);
  const tones = [
    ['Info', 'blue-900', 'blue-50', 0.5, 1],
    ['Warning', 'gold-800', 'accent-100', 0.5, 0.18],
    ['Negative', 'red-900', 'red-50', 0.4, 1],
    ['Positive', 'accent-400', 'accent-400', 0.5, 0.08],
  ];
  for (const [tone, colour, bg, borderAlpha, bgAlpha] of tones.slice(1)) {
    const text = block(`&--${tone.toLowerCase()} {`);
    guard(
      text,
      new RegExp(
        `--mg-notice-border-color: rgb\\(var\\(--mg-color-${colour}\\) / ${borderAlpha}\\);`
      )
    );
    guard(
      text,
      new RegExp(
        `--mg-notice-bg: rgb\\(var\\(--mg-color-${bg}\\)${bgAlpha === 1 ? '' : ` / ${bgAlpha}`}\\);`
      )
    );
    guard(
      text,
      new RegExp(
        `--mg-notice-icon-color: rgb\\(var\\(--mg-color-${colour}\\)\\);`
      )
    );
  }
  const ref = source(scss, /\.mg-notice\s*\{/);
  const byName = new Map(variables.map(v => [v.name, v]));
  function value(name, mode, seen = new Set()) {
    if (seen.has(name)) fail(`Circular alias ${name}`);
    seen.add(name);
    const entry = byName.get(name)?.values[mode.id];
    if (entry == null) fail(`Missing ${name}/${mode.id}`);
    return entry.alias ? value(entry.alias, mode, seen) : entry;
  }
  const perMode = fn => Object.fromEntries(modes.map(m => [m.id, fn(m)]));
  function helper(name, type, scopes, fn, description) {
    const fullName = `component/notice/${name}`;
    const definition = {
      id: fullName.replaceAll('/', '.'),
      name: fullName,
      type,
      scopes,
      source: ref,
      description,
      hiddenFromPublishing: false,
      codeSyntax: {},
      values: perMode(fn),
    };
    const index = variables.findIndex(v => v.name === fullName);
    if (index < 0) variables.push(definition);
    else variables[index] = definition;
    byName.set(fullName, definition);
    return fullName;
  }
  const number = (name, scopes, fn, description) =>
    helper(
      name,
      'FLOAT',
      scopes,
      typeof fn === 'function' ? fn : () => fn,
      description
    );
  const alpha = (name, role, a) =>
    helper(
      name,
      'COLOR',
      ['FRAME_FILL', 'STROKE_COLOR'],
      m => ({ ...value(role, m), a }),
      `Source ${role} at alpha ${a}. Recomputed in every brand mode; aliases cannot change alpha.`
    );
  const edge = number(
    'border-width',
    ['STROKE_FLOAT'],
    1,
    'Source 1px outer border.'
  );
  const accent = number(
    'start-border-width',
    ['STROKE_FLOAT'],
    4,
    'Source 4px LTR start border.'
  );
  const width = number(
    'specimen-width-480',
    ['WIDTH_HEIGHT'],
    480,
    'Finite 480px experimental specimen, not an authored CSS width.'
  );
  const iconSize = number(
    'icon-size',
    ['WIDTH_HEIGHT'],
    m => value('font-size/300', m) * 1.5,
    'Source icon 1.5em inherits body font-size/300.'
  );
  const iconSides = modes.map(m => value(iconSize, m));
  if (!iconSides.every(side => side === iconSides[0] && side > 0))
    fail('SVG fixed viewport requires equal positive icon size in all modes');
  const iconSide = iconSides[0];
  source('stories/Atom/Icons/icons.scss', /width: 1em;\s*height: 1em;/);
  source(
    'stories/assets/scss/_foundational.scss',
    /body\s*\{[\s\S]*?font-size:\s*var\(--mg-font-size-300\);/
  );
  function textStyle(name, role, size, style, ratio, requestedWeight) {
    const id = `component.notice.${name}`;
    const definition = {
      id,
      name: `Mangrove/component/notice/${name}`,
      recommended: false,
      component: true,
      source: source(
        scss,
        new RegExp(`&__${name === 'body' ? 'description' : 'title'}\\s*\\{`)
      ),
      description:
        'Experimental source typography. Native rendering and font-file parity unverified.',
      typography: {
        requestedWeight,
        bundledWeight: style === 'Bold' ? 700 : 400,
        lineHeightRatio: ratio,
        lineHeightBasis: 'own-font-size',
        verification:
          name === 'title'
            ? 'Provisional CSS600 to bundled Bold700 mapping. Actual Notice browser match has not been measured.'
            : 'Authored source Regular body with explicit ratio; native rendering pending.',
      },
      bindings: {
        fontFamily: `font-family/${role}`,
        fontSize: `font-size/${size}`,
      },
      values: perMode(m => ({
        fontName: { family: value(`font-family/${role}`, m), style },
        fontSize: value(`font-size/${size}`, m),
        lineHeight: { unit: 'PERCENT', value: ratio * 100 },
      })),
    };
    const index = styles.text.findIndex(s => s.id === id);
    if (index < 0) styles.text.push(definition);
    else styles.text[index] = definition;
    return id;
  }
  source(
    'stories/assets/scss/_foundational.scss',
    /caption\s*\{[^}]*text-wrap:\s*balance;/
  );
  const titleStyle = textStyle('title', 'ui', '300', 'Bold', 1.35, 600);
  const bodyStyle = textStyle('body', 'text', '250', 'Regular', 1.5, 400);
  function sourceIcon(name) {
    const match = new RegExp(
      `\\.mg-icon-${name}::before\\s*\\{\\s*--mg-icon-svg: url\\("data:image/svg\\+xml,([^"\\n]+)"\\);`
    ).exec(read(icons));
    if (!match) fail(`Missing source SVG ${name}`);
    if (!match[1].includes("viewBox='0 0 24 24'"))
      fail(`Source SVG viewport changed ${name}`);
    return match[1].replaceAll("'", '"').replaceAll('currentColor', '#000000');
  }
  const positive =
    /<svg viewBox="0 0 24 24"[^>]*>\s*<path d="([^"]+)" \/>\s*<\/svg>/.exec(
      read(jsx)
    );
  if (!positive) fail('Positive source SVG changed');
  const svgAssets = {
    Info: sourceIcon('info-circle'),
    Warning: sourceIcon('exclamation-triangle'),
    Positive: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#000000" d="${positive[1]}"/></svg>`,
  };
  svgAssets.Negative = svgAssets.Warning;
  const text = (id, name, characters, textStyle, fill, textProperty) => ({
    type: 'TEXT',
    id,
    name,
    characters,
    textStyle,
    fill,
    textProperty,
    textWrap: id === 'title' ? 'BALANCE' : 'AUTO',
    layout: { width: 'FILL', height: 'HUG' },
  });
  const variants = tones.map(([Tone, colour, bg, borderAlpha, bgAlpha]) => {
    const slug = Tone.toLowerCase(),
      border = alpha(`${slug}-border`, `color/${colour}`, borderAlpha),
      background =
        bgAlpha === 1
          ? `color/${bg}`
          : alpha(`${slug}-background`, `color/${bg}`, bgAlpha);
    return {
      id: `notice.${slug}`,
      name: `Tone=${Tone}`,
      properties: { Tone },
      sourceRef: ref,
      tree: {
        type: 'FRAME',
        id: 'root',
        name: `mg-notice mg-notice--${slug}`,
        fill: background,
        stroke: border,
        strokesIncludedInLayout: true,
        bindings: {
          cornerRadius: 'radius/button',
          strokeWeight: edge,
          strokeTopWeight: edge,
          strokeRightWeight: edge,
          strokeBottomWeight: edge,
          strokeLeftWeight: accent,
        },
        layout: {
          mode: 'VERTICAL',
          width,
          height: 'HUG',
          gap: 'spacing/100',
          padding: { block: 'spacing/150', inline: 'spacing/200' },
          clipsContent: false,
        },
        children: [
          {
            type: 'FRAME',
            id: 'header',
            name: 'mg-notice__header',
            fill: null,
            layout: {
              mode: 'HORIZONTAL',
              width: 'FILL',
              height: 'HUG',
              align: 'CENTER',
              gap: 'spacing/75',
              clipsContent: false,
            },
            children: [
              {
                type: 'SVG',
                id: 'icon',
                name: 'mg-notice__icon',
                visibilityProperty: 'Show icon',
                layout: { width: iconSide, height: iconSide },
                svg: {
                  assetId: `notice-${slug}-icon`,
                  markup: svgAssets[Tone],
                  monochrome:
                    Tone === 'Positive'
                      ? { fills: `color/${colour}` }
                      : { strokes: `color/${colour}` },
                },
              },
              text(
                'title',
                'mg-notice__title',
                'Notice title',
                titleStyle,
                'color/neutral-900',
                'Title'
              ),
            ],
          },
          text(
            'body',
            'mg-notice__description',
            'Notice description.',
            bodyStyle,
            'color/neutral-700',
            'Body'
          ),
        ],
      },
    };
  });
  return [
    {
      id: 'notice',
      name: 'Mangrove/Notice',
      kind: 'component-set',
      sourceRef: ref,
      description:
        'Experimental Standard static LTR Notice with four source tones, editable required Title and one plain-text Body, and optional default icon. No native acceptance or publication.',
      limitations: [
        'Title and Body are required non-empty plain text in this bounded contract. Empty properties do not reproduce JSX removal of header/body slots.',
        'No compact/prominent/overlay/dismissible presets, custom icon, actions, header content or rich React nodes. Browser dismissal, focus, live regions, responsive header wrapping and forced colours remain in code.',
        'Title CSS600 to bundled Bold700 mapping is provisional. Source/native geometry, paint and font match in all brands, Latin wrapping, Arabic/RTL and finite-width edits require later acceptance.',
        'Fixed 480px specimen with a single unwrapped header row. Arbitrary consumer widths are not responsive CSS.',
        'SVG viewport is generated from source 1.5em at build time. The renderer cannot bind live SVG stroke scaling; source font-size changes require rebuilding, and unequal mode sizes fail closed.',
      ],
      review: { genericLabels: false, preserveVariantSizing: true },
      variants,
    },
  ];
}
module.exports = { buildNoticeRecipes };
