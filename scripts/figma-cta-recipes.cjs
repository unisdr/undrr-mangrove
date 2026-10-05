/** Bounded, source-backed text-only CTA recipes. Integrated by the main exporter. */

function buildTextCtaRecipes({ root, modes, variables, styles }) {
  const {
    cta,
    jsx,
    source,
    byName,
    value,
    add,
    bodyMax,
    innerPadding,
    strongBody,
    strongBorder,
    softSurface,
    headings,
    reviewGeometry,
  } = require('./figma-maintenance-cta-assets.cjs').buildTextCtaAssets({
    root,
    modes,
    variables,
    styles,
  });
  const frame = (name, children, layout = {}, fill = null) => ({
    type: 'FRAME',
    name,
    layout: {
      mode: 'VERTICAL',
      width: 'FILL',
      height: 'HUG',
      gap: 'spacing/0',
      ...layout,
    },
    fill,
    stroke: null,
    children,
  });
  const text = (name, characters, textStyle, fill, textProperty) => ({
    type: 'TEXT',
    name,
    characters,
    textStyle,
    fill,
    textProperty,
    textAlign: 'CENTER',
    ...(name === 'mg-cta__headline'
      ? {
          textWrap: 'BALANCE',
        }
      : {}),
    layout: {
      width: 'FILL',
      height: 'HUG',
    },
  });
  const actionPath = [
    'mg-cta__inner',
    'mg-cta__body',
    'mg-cta__actions',
    'mg-cta__action',
  ];
  const longLabel =
    'A longer Mangrove action label to check resizing and wrapping';
  const families = [
    {
      id: 'text-cta',
      name: 'Mangrove/Text CTA',
      kind: 'component-set',
      source: source(jsx, /export function TextCta\(/),
      description:
        'Primary, stacked, centered text-only CTA with one conventional primary action. The Default Storybook story uses the separate editorial CTA treatment, which is outside this bounded scaffold. Headline and plain body are editable; action remains a native Button instance. Desktop and Mobile are explicit viewport typography variants, not automatic breakpoints.',
      variants: [],
      review: {
        genericLabels: false,
        specimens: [320, 240].map(width => ({
          id: `long-action-${width}`,
          name: `Long action in ${width}px CTA, measured source boundary`,
          variant: {
            Tone: 'Strong',
            Viewport: width === 320 ? 'Mobile' : 'Narrow',
            Content: 'Long',
          },
          width,
          properties: {},
          nodes: [
            {
              path: actionPath,
              properties: {
                Label: longLabel,
              },
            },
          ],
        })),
      },
    },
  ];
  for (const Tone of ['Soft', 'Strong'])
    for (const Viewport of ['Desktop', 'Mobile']) {
      const strong = Tone === 'Strong';
      const action = {
        type: 'INSTANCE',
        name: 'mg-cta__action',
        family: 'button',
        expose: true,
        variant: {
          Emphasis: 'Primary',
          Treatment: 'Filled',
          State: 'Default',
        },
        overrides: {
          Label: 'Read more',
        },
        layout: {
          width: 'HUG',
          height: 'HUG',
        },
        ...(strong
          ? {
              appearance: {
                fill: 'color/neutral-0',
                stroke: strongBorder,
                labelFill: 'color/hero',
              },
            }
          : {}),
      };
      const body = frame(
        'mg-cta__body',
        [
          frame(
            'mg-cta__content',
            [
              text(
                'mg-cta__headline',
                'Turn knowledge into action',
                headings[Viewport],
                strong ? 'color/white' : 'color/neutral-900',
                'Headline'
              ),
              text(
                'mg-cta__text',
                'Discover practical resources and connect with people working to reduce disaster risk.',
                'component.body',
                strong ? strongBody : 'color/neutral-800',
                'Body'
              ),
            ],
            {
              gap: 'spacing/100',
            }
          ),
          frame('mg-cta__actions', [action], {
            mode: 'HORIZONTAL',
            wrap: 'WRAP',
            gap: 'spacing/100',
            counterGap: 'spacing/100',
            justify: 'CENTER',
            align: 'CENTER',
          }),
        ],
        {
          maxWidth: bodyMax,
          gap: 'spacing/150',
        }
      );
      const tree = frame(
        'mg-cta',
        [
          frame(
            'mg-cta__inner',
            [
              frame('mg-cta__headline-leading-margin', [], {
                height: 'spacing/100',
              }),
              body,
            ],
            {
              padding: {
                block: 'spacing/0',
                inline: innerPadding,
              },
              align: 'CENTER',
            }
          ),
        ],
        {
          width: Viewport === 'Desktop' ? 720 : 320,
          padding: {
            block: 'cta/padding',
            inline: 'cta/padding',
          },
        },
        strong ? 'color/hero' : softSurface
      );
      const properties = {
        Tone,
        Viewport,
        Content: 'Short',
      };
      families[0].variants.push({
        id: `text-cta.${Tone.toLowerCase()}.${Viewport.toLowerCase()}`,
        name: `Tone=${Tone}, Viewport=${Viewport}, Content=Short`,
        properties,
        tree,
      });
    }
  const mobile = families[0].variants.find(
    entry => entry.id === 'text-cta.strong.mobile'
  );
  for (const width of [320, 240]) {
    const tree = JSON.parse(JSON.stringify(mobile.tree));
    tree.layout.width = width;
    let action = tree;
    for (const name of actionPath)
      action = action.children.find(child => child.name === name);
    action.layout.width = reviewGeometry.get(width).available;
    action.labelSizing = 'FILL';
    action.overrides.Label = longLabel;
    const Viewport = width === 320 ? 'Mobile' : 'Narrow';
    families[0].variants.push({
      id: `text-cta.strong.${Viewport.toLowerCase()}.long`,
      name: `Tone=Strong, Viewport=${Viewport}, Content=Long`,
      properties: {
        Tone: 'Strong',
        Viewport,
        Content: 'Long',
      },
      tree,
    });
  }
  function identity(node, parent = '') {
    node.id = parent ? `${parent}/${node.name}` : node.name;
    for (const name of [
      node.fill,
      node.stroke,
      node.layout?.gap,
      node.layout?.counterGap,
      node.layout?.maxWidth,
      node.layout?.padding?.block,
      node.layout?.padding?.inline,
      ...Object.values(node.appearance || {}),
    ].filter(Boolean))
      if (!byName.has(name))
        throw new Error(`Missing CTA recipe variable ${name}`);
    for (const child of node.children || []) identity(child, node.id);
  }
  for (const entry of families[0].variants) identity(entry.tree);
  return families;
}
module.exports = {
  buildTextCtaRecipes,
};
