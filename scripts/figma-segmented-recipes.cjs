/** Source-owned Default-size Segmented leaves. Native expansion acceptance is separate. */
'use strict';

function buildSegmentedRecipes({ root, modes, variables, styles }) {
  const { packet, source, sumName, minimum, styleId } =
    require('./figma-maintenance-segmented-assets.cjs').buildSegmentedAssets({
      root,
      modes,
      variables,
      styles,
    });
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
    review: {
      genericLabels: false,
      preserveVariantSizing: true,
      width: 320,
    },
    variants: [],
  };
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
      properties: {
        Selected: selected,
        State: state,
        Position: position,
      },
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
                cornerBindings: {
                  ...corners,
                },
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
            layout: {
              width: 'HUG',
              height: 'HUG',
            },
          },
        ],
      },
    });
  }
  return [family];
}
module.exports = {
  buildSegmentedRecipes,
};
