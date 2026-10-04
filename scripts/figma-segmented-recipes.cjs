/** Source-owned Segmented segment subset for the native shared-style/paint gate. */
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
      'Canonical three-variant First-position subset for shared-style and range-paint acceptance. Label is editable. Default-size, Latin LTR source roles only; the source still represents a native radio label, not a tab or standalone browser interaction.',
    coverage: {
      included: [
        'Selected=False/True, State=Default, Position=First',
        'Selected=False, State=Hover, Position=First',
      ],
      pending: [
        'Remaining 27 Default-size segment variants',
        'Shared style and effective range paints on native mains, fresh and edited consumers through two ordinary repeats',
        'Focus, middle/last, Disabled, Small, joined compositions, wrapping, live focus geometry, RTL, forced colours and motion',
        'Consumer CSS min-block-size/radius hook overrides and native font-file equivalence',
      ],
    },
    review: { genericLabels: false, preserveVariantSizing: true, width: 320 },
    variants: [],
  };
  for (const [selected, state] of [
    ['False', 'Default'],
    ['True', 'Default'],
    ['False', 'Hover'],
  ]) {
    const paintKey =
      selected === 'True'
        ? 'selected'
        : state === 'Hover'
          ? 'hover'
          : 'default';
    const reference = packet.brands[modes[0].id].paints[paintKey];
    // Every paint is a semantic role reference. Values follow the selected native brand.
    const id = `segmented-control.segment.${selected.toLowerCase()}.${state.toLowerCase()}.first`;
    family.variants.push({
      id,
      name: `Selected=${selected}, State=${state}, Position=First`,
      properties: { Selected: selected, State: state, Position: 'First' },
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
          topLeftRadius: packet.roles.radius.name,
          bottomLeftRadius: packet.roles.radius.name,
          topRightRadius: packet.roles.zero.name,
          bottomRightRadius: packet.roles.zero.name,
          paddingTop: packet.roles.paddingBlock.name,
          paddingBottom: packet.roles.paddingBlock.name,
          paddingLeft: packet.roles.paddingInline.name,
          paddingRight: packet.roles.paddingInline.name,
        },
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
