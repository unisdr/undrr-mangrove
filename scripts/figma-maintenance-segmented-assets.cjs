/** Source-owned Default-size Segmented leaves. Native expansion acceptance is separate. */
'use strict';

const {
  buildSegmentedSourceAssets,
} = require('./figma-maintenance-segmented-source-assets.cjs');
function buildSegmentedAssets({ root, modes, variables, styles }) {
  const packet = buildSegmentedSourceAssets({
    root,
    modes,
    variables,
    styles,
  });
  const fail = message => {
    throw new Error(`Figma Segmented recipe needs updating: ${message}`);
  };
  const source = packet.sourceRefs.find(ref =>
    ref.file.endsWith('/segmented-control.scss')
  );
  if (!source) fail('Missing guarded segment source');
  const sumName = 'effect-size/focus-ring/outer-spread';
  const sumMatches = variables.filter(value => value.name === sumName);
  if (
    sumMatches.length !== 1 ||
    sumMatches[0].id !== sumName.replaceAll('/', '.') ||
    sumMatches[0].type !== 'FLOAT'
  )
    fail('One exact existing focus outer-spread FLOAT is required');
  const sourceNumber = (name, modeId, seen = new Set()) => {
    const matches = variables.filter(value => value.name === name);
    if (matches.length !== 1 || matches[0].type !== 'FLOAT' || seen.has(name))
      fail(`Missing, incompatible or cyclic focus source role ${name}`);
    seen.add(name);
    const value = matches[0].values?.[modeId];
    if (value && typeof value === 'object') {
      if (Object.keys(value).length !== 1 || typeof value.alias !== 'string')
        fail(`Malformed focus source alias ${name}`);
      return sourceNumber(value.alias, modeId, seen);
    }
    if (!Number.isFinite(value) || value < 0)
      fail(`Invalid focus source value ${name}`);
    return value;
  };
  for (const mode of modes) {
    const brand = packet.brands[mode.id];
    const sum = sourceNumber(sumName, mode.id);
    if (sum !== brand.geometry.focusOffset + brand.geometry.focusWidth)
      fail(`Focus outer-spread must equal source offset+width for ${mode.id}`);
  }
  const perMode = get =>
    Object.fromEntries(
      modes.map(mode => [mode.id, get(packet.brands[mode.id])])
    );
  const minimum = 'component/segmented-control/minimum-height';
  const helper = {
    id: minimum.replaceAll('/', '.'),
    name: minimum,
    type: 'FLOAT',
    scopes: ['WIDTH_HEIGHT'],
    hiddenFromPublishing: false,
    source,
    description:
      'Source default 44px fallback for --mg-segmented-control-min-block-size. The native HUG segment can grow above it; consumer CSS hook overrides are not simulated.',
    codeSyntax: {
      WEB: 'var(--mg-segmented-control-min-block-size, 2.75rem)',
    },
    values: perMode(brand => brand.geometry.minHeight),
  };
  const styleId = 'component.segmented-control.segment';
  const textStyle = {
    id: styleId,
    name: 'Mangrove/component/segmented-control/segment',
    type: 'TEXT',
    recommended: false,
    component: true,
    source,
    description:
      'Source segment font-size/button, CSS requested 600, bundled Roboto Bold 700, own-font-size line-height 120%. Shared native style association is required. Native font-file equality and cross-variant Label/range-paint behaviour are acceptance gates.',
    typography: {
      requestedWeight: 600,
      bundledWeight: 700,
      lineHeightRatio: 1.2,
      lineHeightBasis: 'own-font-size',
      verification:
        'Guarded source imports Bold 700; isolated source browser observed this bundled face. Native font-file equivalence remains unverified.',
    },
    bindings: {
      fontFamily: packet.roles.fontFamily.name,
      fontSize: packet.roles.fontSize.name,
    },
    values: perMode(brand => ({
      fontName: {
        ...brand.typography.segment.fontName,
      },
      fontSize: brand.typography.segment.fontSize,
      lineHeight: {
        ...brand.typography.segment.lineHeight,
      },
      textDecoration: 'NONE',
      textWrapStyle: 'AUTO',
    })),
  };
  function upsert(list, definition) {
    const ids = list.filter(item => item.id === definition.id),
      names = list.filter(item => item.name === definition.name);
    if (
      ids.length > 1 ||
      names.length > 1 ||
      (ids[0] && ids[0].name !== definition.name) ||
      (names[0] && names[0].id !== definition.id) ||
      (ids[0]?.type && ids[0].type !== definition.type)
    )
      fail(`Ambiguous or incompatible source foundation ${definition.id}`);
    const index = list.findIndex(item => item.id === definition.id);
    if (index < 0) list.push(definition);
    else list[index] = definition;
  }
  for (const [list, definition] of [
    [variables, helper],
    [styles.text, textStyle],
  ]) {
    const matches = list.filter(
      item => item.id === definition.id || item.name === definition.name
    );
    if (
      matches.length > 1 ||
      matches.some(
        item =>
          item.id !== definition.id ||
          item.name !== definition.name ||
          (item.type && item.type !== definition.type)
      )
    )
      fail(`Ambiguous or incompatible source foundation ${definition.id}`);
  }
  upsert(variables, helper);
  upsert(styles.text, textStyle);
  return {
    packet,
    fail,
    source,
    sumName,
    sumMatches,
    sourceNumber,
    perMode,
    minimum,
    helper,
    styleId,
    textStyle,
    upsert,
  };
}
module.exports = {
  buildSegmentedAssets,
};
