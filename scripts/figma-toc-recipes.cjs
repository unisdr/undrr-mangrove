/** Source-owned, finite Latin TOC links and numbered compositions. */
'use strict';

function buildTocRecipes({ root, modes, variables, styles }) {
  const {
    scss,
    jsx,
    source,
    english,
    entries,
    border,
    widths,
    caps,
    linkStyle,
    titleStyle,
    markerStyle,
  } = require('./figma-maintenance-toc-assets.cjs').buildTocAssets({
    root,
    modes,
    variables,
    styles,
  });
  const limitations =
    'Explicit measured Latin labels containing spaces only. The native sizing probe preserved edited Label and IDs through a master cap rewrite, with a short label at 68x29px and first-link heights 77/53/29px. The native wide first link is 400px versus 398.8125px in the browser; font file and pixel equality remain unverified. Unbroken labels wrap in native FILL text while CSS overflows; unsupported here. Live caps relative to consumer width, arbitrary widths, RTL/non-Latin, source scroll/history/focus behaviour, scraped article/title-hidden mode and appearance across all brands are pending.';
  const links = {
    id: 'toc-link',
    name: 'Mangrove/Table of contents / Link',
    kind: 'component-set',
    source: source(scss, /  a\s*{/),
    description: `Reusable source inline-block link with 4 states and 3 explicit caps. Required imported typography template is applied directly with font role bindings, preserving Label keys while avoiding native shared-style range-paint coupling. Canonical repeat/edited-consumer acceptance remains pending. Node PERCENT15 underline offset. ${limitations}`,
    variants: [],
    review: {
      genericLabels: false,
      preserveVariantSizing: true,
      width: 900,
    },
  };
  for (const width of widths)
    for (const State of ['Default', 'Hover', 'Focus', 'HoverFocus']) {
      const focus = State.includes('Focus'),
        hover = State.includes('Hover');
      links.variants.push({
        id: `toc-link.${width}.${State.toLowerCase()}`,
        name: `MeasuredWidth=${width}, State=${State}`,
        properties: {
          MeasuredWidth: String(width),
          State,
        },
        tree: {
          id: 'link',
          type: 'FRAME',
          name: 'mg-table-of-contents / a',
          fill: null,
          stroke: null,
          layout: {
            mode: 'VERTICAL',
            width: 'HUG',
            height: 'HUG',
            maxWidth: caps.get(width).cap,
            gap: 'spacing/0',
            padding: {
              block: 'spacing/25',
              inline: 'spacing/0',
            },
            clipsContent: false,
          },
          ...(focus
            ? {
                focusRing: {
                  color: 'color/focus-ring',
                  separatorColor: 'color/neutral-0',
                  offset: 'focus-ring/offset',
                  width: 'focus-ring/width',
                  radius: 'spacing/0',
                  outerRadius: 'spacing/0',
                },
              }
            : {}),
          children: [
            {
              id: 'label',
              type: 'TEXT',
              name: 'Link label',
              characters: entries[0].text,
              textProperty: 'Label',
              textStyle: linkStyle,
              textStyleApplication: 'DIRECT',
              fill: hover ? 'color/interactive-active' : 'color/interactive',
              stroke: null,
              textDecoration: 'UNDERLINE',
              textDecorationOffset: {
                unit: 'PERCENT',
                value: 15,
              },
              textWrap: 'AUTO',
              layout: {
                width: 'FILL',
                height: 'HUG',
              },
            },
          ],
        },
      });
    }
  const toc = {
    id: 'table-of-contents',
    name: 'Mangrove/Table of contents / Numbered',
    kind: 'component-set',
    source: source(jsx, /export default function TableOfContents/),
    description: `Initial numbered English story composition: required editable Title and 6 exposed native Link labels. Marker allocation 20px, leading 2.5px and a bottom-aligned 24px decimal marker with 2.5px bottom padding represent the measured last-line baseline. Numeric marker glyph/baseline pixels remain pending native/source comparison. Bulleted source UA-disc representation is pending; no typed-bullet substitute. No invented nesting/current/disabled states. ${limitations}`,
    coverage: {
      included: ['Numbered English story at 240/390/900px'],
      pending: [
        'Bulleted source UA disc glyph',
        'Marker raster/baseline comparison',
        'Unbroken-word source overflow',
      ],
    },
    variants: [],
    review: {
      genericLabels: false,
      preserveVariantSizing: true,
    },
  };
  for (const width of widths)
    toc.variants.push({
      id: `table-of-contents.numbered.${width}`,
      name: `ListStyle=Numbered, MeasuredWidth=${width}`,
      properties: {
        ListStyle: 'Numbered',
        MeasuredWidth: String(width),
      },
      tree: {
        id: 'toc',
        type: 'FRAME',
        name: 'mg-table-of-contents',
        fill: null,
        stroke: 'color/neutral-300',
        strokesIncludedInLayout: true,
        bindings: {
          strokeWeight: 'spacing/0',
          strokeTopWeight: 'spacing/0',
          strokeRightWeight: 'spacing/0',
          strokeBottomWeight: 'spacing/0',
          strokeLeftWeight: border,
          paddingLeft: 'spacing/200',
          paddingRight: 'spacing/0',
          paddingTop: 'spacing/0',
          paddingBottom: 'spacing/0',
        },
        layout: {
          mode: 'VERTICAL',
          width,
          height: 'HUG',
          gap: 'spacing/100',
          clipsContent: false,
        },
        children: [
          {
            id: 'title',
            type: 'TEXT',
            name: 'On this page heading',
            characters: english[1],
            textProperty: 'Title',
            textStyle: titleStyle,
            fill: 'color/text',
            stroke: null,
            textDecoration: 'NONE',
            textWrap: 'BALANCE',
            layout: {
              width: 'FILL',
              height: 'HUG',
            },
          },
          {
            id: 'list',
            type: 'FRAME',
            name: 'ol / six source links',
            fill: null,
            stroke: null,
            layout: {
              mode: 'VERTICAL',
              width: 'FILL',
              height: 'HUG',
              gap: 'spacing/50',
              clipsContent: false,
            },
            children: entries.map((entry, i) => ({
              id: `item-${i + 1}`,
              type: 'FRAME',
              name: `li / ${entry.id}`,
              fill: null,
              stroke: null,
              layout: {
                mode: 'HORIZONTAL',
                width: 'FILL',
                height: 'HUG',
                gap: 'spacing/25',
                align: 'MAX',
                clipsContent: false,
              },
              children: [
                {
                  id: `marker-${i + 1}`,
                  type: 'FRAME',
                  name: 'Decimal marker / last line',
                  fill: null,
                  stroke: null,
                  bindings: {
                    paddingBottom: 'spacing/25',
                  },
                  layout: {
                    mode: 'VERTICAL',
                    width: 'spacing/200',
                    height: 'HUG',
                    clipsContent: false,
                  },
                  children: [
                    {
                      id: `number-${i + 1}`,
                      type: 'TEXT',
                      name: `Source ordered marker ${i + 1}`,
                      characters: `${i + 1}.`,
                      textStyle: markerStyle,
                      fill: 'color/text',
                      stroke: null,
                      textAlign: 'RIGHT',
                      textDecoration: 'NONE',
                      textWrap: 'AUTO',
                      layout: {
                        width: 'FILL',
                        height: 'HUG',
                      },
                    },
                  ],
                },
                {
                  id: `link-${i + 1}`,
                  type: 'INSTANCE',
                  name: `Link ${i + 1}`,
                  family: 'toc-link',
                  expose: true,
                  variant: {
                    MeasuredWidth: String(width),
                    State: 'Default',
                  },
                  overrides: {
                    Label: entry.text,
                  },
                  layout: {
                    width: 'HUG',
                    height: 'HUG',
                  },
                  sourceAnchor: `#${entry.id}`,
                },
              ],
            })),
          },
        ],
      },
    });
  return [links, toc];
}
module.exports = {
  buildTocRecipes,
};
