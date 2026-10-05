/** Source-owned compact Empty State. No Condensed title or fabricated action slot. */
'use strict';

const fs = require('fs');
const path = require('path');
function buildEmptyStateAssets({ root, modes, variables, styles }) {
  const scss = 'stories/Atom/EmptyState/empty-state.scss';
  const story = 'stories/Atom/EmptyState/EmptyState.stories.jsx';
  const tokens = 'stories/assets/scss/_variables.scss';
  const files = new Map();
  const read = file => {
    if (!files.has(file))
      files.set(file, fs.readFileSync(path.join(root, file), 'utf8'));
    return files.get(file);
  };
  const fail = message => {
    throw new Error(
      `Figma compact Empty State recipe needs updating: ${message}`
    );
  };
  const source = (file, pattern) => {
    const match = pattern.exec(read(file));
    if (!match) fail(`${file} no longer matches ${pattern}`);
    return {
      file,
      line: read(file).slice(0, match.index).split('\n').length,
    };
  };
  for (const pattern of [
    /display:\s*flex;\s*flex-direction:\s*column;\s*align-items:\s*center;/,
    /font-family:\s*var\(--mg-font-family-text\);\s*text-align:\s*center;/,
    /&__media\s*{\s*display:\s*flex;\s*align-items:\s*center;\s*justify-content:\s*center;/,
    /color:\s*var\(--mg-empty-state-media-color\);/,
    /> svg,\s*> img\s*{\s*inline-size:\s*100%;\s*block-size:\s*auto;/,
    /&__description\s*{\s*max-inline-size:\s*var\(--mg-empty-state-max-inline-size\);\s*margin:\s*0;\s*font-size:\s*var\(--mg-empty-state-text-font-size\);\s*line-height:\s*1\.5;\s*color:\s*var\(--mg-empty-state-text-color\);\s*text-wrap:\s*pretty;/,
    /\.mg-empty-state--panel\s*{\s*background-color:\s*var\(--mg-empty-state-panel-background\);\s*border-radius:\s*var\(--mg-empty-state-panel-radius\);/,
    /\.mg-empty-state--compact\s*{\s*gap:\s*var\(--mg-spacing-50\);\s*padding:\s*var\(--mg-empty-state-compact-padding\);/,
    /inline-size:\s*var\(--mg-empty-state-compact-media-size\);\s*block-size:\s*var\(--mg-empty-state-compact-media-size\);/,
    /\.mg-empty-state__title,\s*\.mg-empty-state__description\s*{\s*font-size:\s*var\(--mg-empty-state-compact-font-size\);/,
    /\.mg-empty-state--start\s*{\s*align-items:\s*flex-start;\s*text-align:\s*start;/,
  ])
    source(scss, pattern);
  source(story, /inlineSize:\s*'200px'/);
  source(story, /mg-empty-state mg-empty-state--compact mg-empty-state--panel/);
  source(story, /<p className="mg-empty-state__description">No data<\/p>/);
  source(
    'stories/assets/fonts/roboto/sass/_Regular.scss',
    /font-family:\s*Roboto;[\s\S]*?font-weight:\s*400;\s*font-style:\s*normal;/
  );
  const svgSource = source(story, /const TrayGlyph = \(\) => \(/);
  const svg = read(story).match(/<svg[\s\S]*?<\/svg>/)?.[0];
  if (
    !svg ||
    !/viewBox="0 0 56 44"/.test(svg) ||
    !/fill="none"/.test(svg) ||
    !/stroke="currentColor"/.test(svg) ||
    !/strokeWidth="2"/.test(svg) ||
    !/strokeLinejoin="round"/.test(svg)
  )
    fail('Tray viewport, currentColor stroke or join changed');
  const paths = [...svg.matchAll(/<path d="([^"]+)"\s*\/>/g)].map(
    match => match[1]
  );
  if (
    JSON.stringify(paths) !==
    JSON.stringify([
      'M8 18 14 4h28l6 14',
      'M8 18h12l3 6h10l3-6h12v18a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4z',
    ])
  )
    fail('Tray source paths changed');
  if (
    (svg.match(/<path\b/g) || []).length !== 2 ||
    /<(?:g|rect|circle|ellipse|polygon|line)\b/.test(svg)
  )
    fail('Tray topology changed');
  const markup = svg
    .replaceAll('strokeWidth', 'stroke-width')
    .replaceAll('strokeLinejoin', 'stroke-linejoin')
    .replace('stroke="currentColor"', 'stroke="#000000"')
    .replace(/\s+(?:aria-hidden|focusable)="[^"]*"/g, '');
  const byName = new Map(variables.map(variable => [variable.name, variable]));
  function value(name, mode, seen = new Set()) {
    if (seen.has(name)) fail(`Circular variable ${name}`);
    seen.add(name);
    const entry = byName.get(name)?.values[mode.id];
    if (entry == null) fail(`Missing variable ${name}/${mode.id}`);
    return entry.alias ? value(entry.alias, mode, seen) : entry;
  }
  const perMode = get =>
    Object.fromEntries(modes.map(mode => [mode.id, get(mode)]));
  const roles = [
    [
      'compact-padding',
      'FLOAT',
      'spacing/150',
      'var(--mg-spacing-150)',
      ['GAP'],
    ],
    ['compact-media-size', 'FLOAT', 34, '#{mg-rem(34)}', ['WIDTH_HEIGHT']],
    [
      'compact-font-size',
      'FLOAT',
      'font-size/250',
      'var(--mg-font-size-250)',
      ['FONT_SIZE'],
    ],
    ['max-inline-size', 'FLOAT', 440, '#{mg-rem(440)}', ['WIDTH_HEIGHT']],
    [
      'text-color',
      'COLOR',
      'color/neutral-500',
      'rgb(var(--mg-color-neutral-500))',
      ['TEXT_FILL'],
    ],
    [
      'media-color',
      'COLOR',
      'color/neutral-400',
      'rgb(var(--mg-color-neutral-400))',
      ['STROKE_COLOR'],
    ],
    [
      'panel-background',
      'COLOR',
      'color/neutral-25',
      'rgb(var(--mg-color-neutral-25))',
      ['FRAME_FILL'],
    ],
    [
      'panel-radius',
      'FLOAT',
      'card/border-radius',
      'var(--mg-card-border-radius)',
      ['CORNER_RADIUS'],
    ],
  ];
  const escaped = string => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const definitions = roles.map(([role, type, target, authored, scopes]) => {
    const ref = source(
      tokens,
      new RegExp(`--mg-empty-state-${role}:\\s*${escaped(authored)};`)
    );
    if (typeof target === 'string' && byName.get(target)?.type !== type)
      fail(`Wrong or missing source alias ${target}`);
    const name = `empty-state/${role}`;
    return {
      id: name.replaceAll('/', '.'),
      name,
      type,
      scopes,
      hiddenFromPublishing: false,
      source: ref,
      description: `Source Empty State role. CSS: --mg-empty-state-${role}`,
      codeSyntax: {
        WEB: `var(--mg-empty-state-${role})`,
      },
      values: perMode(() =>
        typeof target === 'string'
          ? {
              alias: target,
            }
          : target
      ),
    };
  });
  for (const definition of definitions) {
    const existing = byName.get(definition.name);
    if (existing && existing.type !== definition.type)
      fail(`Wrong role type ${definition.name}`);
  }
  for (const definition of definitions) {
    const index = variables.findIndex(
      variable => variable.name === definition.name
    );
    if (index < 0) variables.push(definition);
    else variables[index] = definition;
    byName.set(definition.name, definition);
  }
  for (const mode of modes) {
    if (
      value('font-family/text', mode) !== 'Roboto' ||
      value('empty-state/compact-media-size', mode) !== 34
    )
      fail(`Unverified compact font or SVG scaling in ${mode.id}`);
  }
  const styleId = 'component.empty-state.compact-description';
  const style = {
    id: styleId,
    name: 'Mangrove/Component/Empty state/Compact description',
    recommended: false,
    description:
      'Compact source description, Roboto Regular400,14px with1.5 line height and PRETTY. The shared style and text node both carry wrapping for editable Description properties. Native edited consumer wrap remains acceptance work.',
    source: source(scss, /&__description\s*{/),
    bindings: {
      fontFamily: 'font-family/text',
      fontSize: 'empty-state/compact-font-size',
    },
    values: perMode(mode => ({
      fontName: {
        family: value('font-family/text', mode),
        style: 'Regular',
      },
      fontSize: value('empty-state/compact-font-size', mode),
      lineHeight: {
        unit: 'PERCENT',
        value: 150,
      },
      textDecoration: 'NONE',
      textWrapStyle: 'PRETTY',
    })),
  };
  const index = styles.text.findIndex(entry => entry.id === styleId);
  if (index < 0) styles.text.push(style);
  else styles.text[index] = style;
  return {
    scss,
    story,
    tokens,
    files,
    read,
    fail,
    source,
    svgSource,
    svg,
    paths,
    markup,
    byName,
    value,
    perMode,
    roles,
    escaped,
    definitions,
    styleId,
    style,
    index,
  };
}
module.exports = {
  buildEmptyStateAssets,
};
