/** Source-owned styled Details recipes. Browser measurements are not native acceptance. */

function buildDetailsRecipes({ root, modes, variables, styles }) {
  const { ref, geometry, paint, widths, hoverEffect, type } =
    require('./figma-maintenance-details-assets.cjs').buildDetailsAssets({
      root,
      modes,
      variables,
      styles,
    });
  const family = {
    id: 'details',
    name: 'Mangrove/Details',
    kind: 'component-set',
    source: ref,
    description:
      'Source styled DetailsTag only: editable Title maps summary, Paragraph maps details. Open is native HTML state, not a new React prop. BelowMedium/MediumUp typography follows48em viewport breakpoint; measured390/900 defaults and240 stress masters are finite research consumers. Transparent root, summary-only square/hover-rounded focus, source +/− glyph, half-border marker centering and HUG growth require native acceptance. Managed TEXT properties across responsive styles need real inspection. Accordion/flush/baseline variants, browser interaction, active marker scaling/playback, forced colours, RTL and all-brand/script fidelity remain pending.',
    variants: [],
    review: {
      genericLabels: false,
      preserveVariantSizing: true,
      width: 900,
      specimens: [],
    },
  };
  function variant(Open, State, Typography, viewport) {
    const opened = Open === 'True',
      hovered = State.includes('Hover'),
      focused = State.includes('Focus');
    const summaryNode = {
      type: 'FRAME',
      id: 'summary',
      name: 'mg-details / summary',
      fill: hovered ? paint.summaryHover : null,
      stroke: opened ? 'color/neutral-400' : null,
      strokesIncludedInLayout: true,
      effectStyle: null,
      layout: {
        mode: 'VERTICAL',
        width: 'FILL',
        height: 'HUG',
        minHeight: geometry.minimum,
        align: 'MIN',
        justify: 'MIN',
        gap: 'spacing/0',
      },
      bindings: {
        cornerRadius: hovered ? geometry.hoverRadius : geometry.zero,
        paddingTop: geometry.padding,
        paddingBottom: geometry.padding,
        paddingLeft: geometry.padding,
        paddingRight: geometry.reserve,
        ...(opened
          ? {
              strokeWeight: geometry.zero,
              strokeTopWeight: geometry.zero,
              strokeRightWeight: geometry.zero,
              strokeBottomWeight: geometry.border,
              strokeLeftWeight: geometry.zero,
            }
          : {}),
      },
      children: [
        {
          type: 'TEXT',
          id: 'title',
          name: 'mg-details / title',
          characters: 'The Sendai Framework',
          textProperty: 'Title',
          textStyle: type[Typography].summary,
          textDecoration: 'NONE',
          textWrap: 'AUTO',
          fill: 'color/interactive',
          stroke: null,
          layout: {
            width: 'FILL',
            height: 'HUG',
          },
        },
        {
          type: 'FRAME',
          id: 'marker',
          name: 'mg-details / marker',
          fill: hovered ? paint.markerHover : paint.marker,
          stroke: null,
          layout: {
            mode: 'HORIZONTAL',
            width: geometry.marker,
            height: geometry.marker,
            align: 'CENTER',
            justify: 'CENTER',
            gap: 'spacing/0',
          },
          bindings: {
            cornerRadius: geometry.markerRadius,
          },
          absolute: {
            horizontal: 'END',
            vertical: 'CENTER',
            offsetX: geometry.markerEnd,
            offsetY: opened ? geometry.markerOpenY : 'spacing/0',
          },
          children: [
            {
              type: 'TEXT',
              id: 'glyph',
              name: 'mg-details / source marker',
              characters: opened ? '−' : '+',
              textStyle: type.glyph,
              textDecoration: 'NONE',
              fill: 'color/interactive',
              stroke: null,
              textAlign: 'CENTER',
              layout: {
                width: 'HUG',
                height: 'HUG',
              },
            },
          ],
        },
      ],
    };
    if (focused)
      summaryNode.focusRing = {
        color: 'color/focus-ring',
        separatorColor: 'color/neutral-0',
        offset: 'focus-ring/offset',
        width: 'focus-ring/width',
        radius: hovered ? geometry.hoverRadius : geometry.zero,
        outerRadius: hovered ? geometry.hoverFocusOuter : geometry.focusOuter,
      };
    const tree = {
      type: 'FRAME',
      id: 'details',
      name: 'mg-details',
      fill: null,
      stroke: opened ? 'color/interactive' : 'color/neutral-400',
      strokesIncludedInLayout: true,
      effectStyle: hovered ? hoverEffect.id : null,
      layout: {
        mode: 'VERTICAL',
        width: widths[viewport],
        height: 'HUG',
        align: 'MIN',
        justify: 'MIN',
        gap: 'spacing/0',
      },
      bindings: {
        cornerRadius: geometry.radius,
        strokeWeight: geometry.border,
        paddingTop: geometry.padding,
        paddingBottom: geometry.padding,
        paddingLeft: geometry.padding,
        paddingRight: geometry.padding,
      },
      children: [summaryNode],
    };
    if (opened)
      tree.children.push({
        type: 'FRAME',
        id: 'paragraph',
        name: 'mg-details / paragraph',
        fill: null,
        stroke: null,
        layout: {
          mode: 'VERTICAL',
          width: 'FILL',
          height: 'HUG',
          align: 'MIN',
          gap: 'spacing/0',
          padding: {
            block: geometry.padding,
            inline: geometry.padding,
          },
        },
        children: [
          {
            type: 'TEXT',
            id: 'body',
            name: 'mg-details / paragraph text',
            characters: 'The Sendai Framework',
            textProperty: 'Paragraph',
            textStyle: type[Typography].paragraph,
            textDecoration: 'NONE',
            textWrap: 'AUTO',
            fill: 'color/text',
            stroke: null,
            layout: {
              width: 'FILL',
              height: 'HUG',
            },
          },
        ],
      });
    family.variants.push({
      id: `details.${opened ? 'open' : 'closed'}.${State.toLowerCase()}.${Typography.toLowerCase()}.${viewport}`,
      name: `Open=${Open}, State=${State}, Typography=${Typography}, MeasuredViewport=${viewport}`,
      properties: {
        Open,
        State,
        Typography,
        MeasuredViewport: String(viewport),
      },
      tree,
    });
  }
  for (const Typography of ['BelowMedium', 'MediumUp'])
    for (const Open of ['False', 'True'])
      for (const State of ['Default', 'Hover', 'Focus', 'HoverFocus'])
        variant(
          Open,
          State,
          Typography,
          Typography === 'BelowMedium' ? 390 : 900
        );
  for (const Open of ['False', 'True'])
    for (const State of ['Default', 'Focus'])
      variant(Open, State, 'BelowMedium', 240);
  const longTitle =
      'A detailed explanation of disaster risk reduction and resilient communities across the Sendai Framework',
    longBody =
      'Long supporting information explains how communities can prepare for hazards, reduce exposure and make evidence-informed decisions. The Sendai Framework';
  for (const width of [1280, 900, 390, 240])
    family.review.specimens.push({
      id: `long-${width}`,
      name: `Measured${width}px long Open Details`,
      variant: {
        Open: 'True',
        State: 'Default',
        Typography: width >= 768 ? 'MediumUp' : 'BelowMedium',
        MeasuredViewport: String(width === 1280 ? 900 : width),
      },
      width,
      instanceWidth: widths[width],
      properties: {
        Title: longTitle,
        Paragraph: longBody,
      },
    });
  family.review.specimens.push({
    id: 'unbroken-240',
    name: 'Measured240px unbroken Open Details',
    variant: {
      Open: 'True',
      State: 'Default',
      Typography: 'BelowMedium',
      MeasuredViewport: '240',
    },
    width: 240,
    instanceWidth: widths[240],
    properties: {
      Title:
        'DisasterRiskReductionAndResilienceAcrossInternationalCommunitiesWithoutWordBreaks',
      Paragraph:
        'InternationalDisasterRiskReductionAndResilienceAcrossCommunitiesAndPreparednessWithoutWordBreaks',
    },
  });
  return [family];
}
module.exports = {
  buildDetailsRecipes,
};
