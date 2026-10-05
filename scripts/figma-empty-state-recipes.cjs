/** Source-owned compact Empty State. No Condensed title or fabricated action slot. */
'use strict';

function buildEmptyStateRecipes({ root, modes, variables, styles }) {
  const { story, source, svgSource, markup, styleId } =
    require('./figma-maintenance-empty-state-assets.cjs').buildEmptyStateAssets(
      {
        root,
        modes,
        variables,
        styles,
      }
    );
  const message =
    'No records match your filters. Clear the country filter to see all records.';
  const family = {
    id: 'empty-state-compact',
    name: 'Mangrove/Empty state / Compact',
    kind: 'component-set',
    source: source(story, /export const Compact/),
    description:
      'Source compact dashboard/chart well only: Plain/Panel and Centre/Start, editable Description and optional decorative Media. No title, actions or interaction states. Bounded200px short source is90px high; recorded long200/240 specimens are132px high in Chromium153/macOS. A native auto-layout FILL/HUG frame carries source max440; its FILL description intentionally has wider short-text bounds than CSS intrinsic width while keeping bounded alignment and wrapping. Figma rejects maxWidth variable binding on TEXT, so the width constraint belongs to this source layout wrapper. Native PRETTY line breaks/font metrics, SVG rasterisation, live token changes to SVG scale, arbitrary widths, RTL/non-Latin and all-brand appearance remain unverified. Start currently represents LTR inline-start. Tray currentColor normalised to black solely for explicit source colour stroke binding; original viewport/paths/joins retained.',
    variants: [],
    review: {
      genericLabels: false,
      preserveVariantSizing: true,
      width: 200,
      specimens: [
        {
          id: 'long-200',
          name: 'Long message / 200px source consumer',
          variant: {
            Surface: 'Panel',
            Alignment: 'Centre',
          },
          width: 200,
          instanceWidth: 200,
          properties: {
            Description: message,
          },
        },
        {
          id: 'long-240',
          name: 'Long message / 240px source consumer',
          variant: {
            Surface: 'Panel',
            Alignment: 'Centre',
          },
          width: 240,
          instanceWidth: 240,
          properties: {
            Description: message,
          },
        },
        {
          id: 'start-200',
          name: 'Start / 200px source consumer',
          variant: {
            Surface: 'Panel',
            Alignment: 'Start',
          },
          width: 200,
          instanceWidth: 200,
          properties: {
            Description: message,
          },
        },
        {
          id: 'no-media',
          name: 'Optional media omitted',
          variant: {
            Surface: 'Panel',
            Alignment: 'Centre',
          },
          width: 200,
          instanceWidth: 200,
          properties: {
            'Show media': false,
          },
        },
      ],
    },
    sourceAsset: {
      ...svgSource,
      assetId: 'empty-state-tray',
      normalization:
        'CSS currentColor to black import paint, then source-role monochrome stroke binding; accessibility attributes omitted from Figma SVG.',
    },
  };
  for (const Surface of ['Plain', 'Panel'])
    for (const Alignment of ['Centre', 'Start']) {
      const panel = Surface === 'Panel',
        centre = Alignment === 'Centre';
      family.variants.push({
        id: `empty-state-compact.${Surface.toLowerCase()}.${Alignment.toLowerCase()}`,
        name: `Surface=${Surface}, Alignment=${Alignment}`,
        properties: {
          Surface,
          Alignment,
        },
        tree: {
          id: 'compact',
          type: 'FRAME',
          name: `mg-empty-state mg-empty-state--compact${panel ? ' mg-empty-state--panel' : ''}${centre ? '' : ' mg-empty-state--start'}`,
          fill: panel ? 'empty-state/panel-background' : null,
          stroke: null,
          bindings: panel
            ? {
                cornerRadius: 'empty-state/panel-radius',
              }
            : {},
          layout: {
            mode: 'VERTICAL',
            width: 200,
            height: 'HUG',
            gap: 'spacing/50',
            align: centre ? 'CENTER' : 'MIN',
            padding: {
              block: 'empty-state/compact-padding',
              inline: 'empty-state/compact-padding',
            },
            clipsContent: false,
          },
          children: [
            {
              id: 'media',
              type: 'FRAME',
              name: 'mg-empty-state__media',
              fill: null,
              stroke: null,
              visibilityProperty: 'Show media',
              layout: {
                mode: 'HORIZONTAL',
                width: 'empty-state/compact-media-size',
                height: 'empty-state/compact-media-size',
                align: 'CENTER',
                justify: 'CENTER',
                clipsContent: false,
              },
              children: [
                {
                  id: 'source',
                  type: 'SVG',
                  name: 'Source empty tray',
                  svg: {
                    assetId: 'empty-state-tray',
                    markup,
                    monochrome: {
                      strokes: 'empty-state/media-color',
                    },
                  },
                  layout: {
                    width: 34,
                    height: (34 * 44) / 56,
                  },
                },
              ],
            },
            {
              id: 'description-bound',
              type: 'FRAME',
              name: 'Source description width constraint',
              fill: null,
              stroke: null,
              layout: {
                mode: 'VERTICAL',
                width: 'FILL',
                height: 'HUG',
                maxWidth: 'empty-state/max-inline-size',
                clipsContent: false,
              },
              children: [
                {
                  id: 'description',
                  type: 'TEXT',
                  name: 'mg-empty-state__description',
                  characters: 'No data',
                  textProperty: 'Description',
                  textStyle: styleId,
                  fill: 'empty-state/text-color',
                  stroke: null,
                  textAlign: centre ? 'CENTER' : 'LEFT',
                  textDecoration: 'NONE',
                  textWrap: 'PRETTY',
                  layout: {
                    width: 'FILL',
                    height: 'HUG',
                  },
                },
              ],
            },
          ],
        },
      });
    }
  return [family];
}
module.exports = {
  buildEmptyStateRecipes,
};
