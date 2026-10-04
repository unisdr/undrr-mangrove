/** Source-owned Default-size Segmented leaves. Native expansion acceptance is separate. */
'use strict';
const {
  buildSegmentedJoiningCapability,
} = require('./figma-segmented-probe.cjs');

function buildSegmentedRecipes({ root, modes, variables, styles }) {
  // All source guards run before appending foundation definitions.
  const packet = buildSegmentedJoiningCapability({
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
    codeSyntax: { WEB: 'var(--mg-segmented-control-min-block-size, 2.75rem)' },
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
      fontName: { ...brand.typography.segment.fontName },
      fontSize: brand.typography.segment.fontSize,
      lineHeight: { ...brand.typography.segment.lineHeight },
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
  // Check both assets before either is changed.
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
  const family = {
    id: 'segmented-control.segment',
    name: 'Mangrove/Segmented control/Segment',
    kind: 'component-set',
    source,
    description:
      'Thirty Default-size source segment endpoints with editable Label, shared120% typography and per-position native focus outlines. Latin LTR leaves only; the source represents a radio label, not a tab or standalone browser interaction. New native mains, edited/fresh consumers and ordinary rebuild acceptance remain required. Joined paint stacking and wrapping are separate composition gates.',
    coverage: {
      included: [
        'Selected=False/True × State=Default/Hover/Focus/HoverFocus/Disabled × Position=First/Middle/Last',
        'Source transparent/selected/hover/disabled semantic paint roles',
        'Twelve focused endpoints with coincident OUTSIDE outlines, SCALE constraints and live per-corner aliases',
      ],
      pending: [
        'Shared style and effective range paints on native mains, fresh and edited consumers through two ordinary repeats',
        'New leaf native shared-style, effective paints, focus raster and edited/fresh repeat acceptance; Small, joined compositions, wrapping, middle-focus occlusion, RTL, forced colours and motion',
        'Consumer CSS min-block-size/radius hook overrides and native font-file equivalence',
      ],
    },
    review: { genericLabels: false, preserveVariantSizing: true, width: 320 },
    variants: [],
  };
  // Preserve the accepted first three recipe objects and their order.
  const axes = [
    ['False', 'Default', 'First'],
    ['True', 'Default', 'First'],
    ['False', 'Hover', 'First'],
  ];
  for (const selected of ['False', 'True'])
    for (const state of ['Default', 'Hover', 'Focus', 'HoverFocus', 'Disabled'])
      for (const position of ['First', 'Middle', 'Last'])
        if (
          !axes.some(
            values =>
              values[0] === selected &&
              values[1] === state &&
              values[2] === position
          )
        )
          axes.push([selected, state, position]);
  for (const [selected, state, position] of axes) {
    const hover = state === 'Hover' || state === 'HoverFocus';
    const paintKey =
      state === 'Disabled'
        ? selected === 'True'
          ? 'selectedDisabled'
          : 'disabled'
        : selected === 'True'
          ? hover
            ? 'selectedHover'
            : 'selected'
          : hover
            ? 'hover'
            : 'default';
    const reference = packet.brands[modes[0].id].paints[paintKey];
    // Every paint is a semantic role reference. Values follow the selected native brand.
    const id = `segmented-control.segment.${selected.toLowerCase()}.${state.toLowerCase()}.${position.toLowerCase()}`;
    const corners = Object.fromEntries(
      packet.cornersOrder.map((field, index) => [
        field,
        packet.brands[modes[0].id].geometry.corners[position][index] === 0
          ? packet.roles.zero.name
          : packet.roles.radius.name,
      ])
    );
    family.variants.push({
      id,
      name: `Selected=${selected}, State=${state}, Position=${position}`,
      properties: { Selected: selected, State: state, Position: position },
      tree: {
        type: 'FRAME',
        id: 'segment',
        name: 'mg-segmented-control__label',
        fill: reference.fill,
        stroke: reference.stroke,
        effectStyle: null,
        clipsContent: false,
        strokesIncludedInLayout: true,
        layout: {
          mode: 'HORIZONTAL',
          width: 'HUG',
          height: 'HUG',
          minHeight: minimum,
          align: 'CENTER',
          justify: 'CENTER',
          gap: packet.roles.zero.name,
        },
        bindings: {
          strokeWeight: packet.roles.border.name,
          topLeftRadius: corners.topLeftRadius,
          bottomLeftRadius: corners.bottomLeftRadius,
          topRightRadius: corners.topRightRadius,
          bottomRightRadius: corners.bottomRightRadius,
          paddingTop: packet.roles.paddingBlock.name,
          paddingBottom: packet.roles.paddingBlock.name,
          paddingLeft: packet.roles.paddingInline.name,
          paddingRight: packet.roles.paddingInline.name,
        },
        ...(state === 'Focus' || state === 'HoverFocus'
          ? {
              focusRing: {
                renderer: 'COINCIDENT_SCALE',
                color: packet.roles.focusColor.name,
                separatorColor: packet.roles.separatorColor.name,
                offset: packet.roles.focusOffset.name,
                width: packet.roles.focusWidth.name,
                outerStroke: sumName,
                cornerBindings: { ...corners },
              },
            }
          : {}),
        children: [
          {
            type: 'TEXT',
            id: 'label',
            name: 'Segment label',
            characters: 'Depth',
            textProperty: 'Label',
            textStyle: styleId,
            textDecoration: 'NONE',
            textWrap: 'AUTO',
            fill: reference.text,
            stroke: null,
            textAlign: 'CENTER',
            layout: { width: 'HUG', height: 'HUG' },
          },
        ],
      },
    });
  }
  return [family];
}
module.exports = { buildSegmentedRecipes };
