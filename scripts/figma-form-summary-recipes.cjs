/** Source-owned, bounded FormErrorSummary recipes. Browser evidence is not native acceptance. */

function buildFormSummaryRecipes({ root, modes, variables, styles }) {
  const {
    jsx,
    source,
    accent,
    marker,
    markerGap,
    listLeft,
    widths,
    zeroRadius,
    outerRadius,
    headingStyle,
    linkStyle,
  } =
    require('./figma-maintenance-form-summary-assets.cjs').buildFormSummaryAssets(
      {
        root,
        modes,
        variables,
        styles,
      }
    );
  const frame = (name, children, layout = {}, fill = null) => ({
    type: 'FRAME',
    name,
    fill,
    stroke: null,
    layout: {
      mode: 'VERTICAL',
      width: 'FILL',
      height: 'HUG',
      gap: 'spacing/0',
      ...layout,
    },
    children,
  });
  const text = (name, characters, style, fill, property, width = 'FILL') => ({
    type: 'TEXT',
    name,
    characters,
    textStyle: style,
    fill,
    ...(property
      ? {
          textProperty: property,
        }
      : {}),
    layout: {
      width,
      height: 'HUG',
    },
  });
  const messages = {
    name: ['Enter your full name', 'Name error'],
    email: ['Enter a valid email address', 'Email error'],
    interests: ['Select at least one interest', 'Interests error'],
  };
  const longProperties = {
    Title:
      'There is a problem with the information you provided for this application',
    'Name error':
      'Enter the full legal name you use for community information services',
    'Email error':
      'Enter a valid email address where you can receive disaster risk information',
    'Interests error':
      'Select at least one information service so that we can personalise updates',
  };
  const family = {
    id: 'form-error-summary',
    name: 'Mangrove/Form error summary',
    kind: 'component-set',
    source: source(jsx, /export function FormErrorSummary\(/),
    description:
      'Source LTR error summary with editable title and one/three linked-message content presets. Root Focus is represented; individual link focus, its wrapped inline fragments, arbitrary error arrays, automatic focus and field navigation are not implemented as native behavior. Narrow masters fix only consumer width and receive long text in fresh review specimens. Native browser-disc glyph and balanced title wrapping need visual acceptance.',
    variants: [],
    review: {
      genericLabels: false,
      width: 320,
      specimens: ['Default', 'Focus'].map(State => ({
        id: `long-narrow-${State.toLowerCase()}`,
        name: `Long error summary in 240px consumer, ${State.toLowerCase()}`,
        variant: {
          Errors: 'Three',
          State,
          Content: 'LongNarrow',
        },
        width: 240,
        instanceWidth: widths[240],
        properties: longProperties,
      })),
    },
  };
  for (const Errors of ['One', 'Three'])
    for (const State of ['Default', 'Focus']) {
      addVariant(Errors, State, 'Short', 320);
    }
  for (const State of ['Default', 'Focus'])
    addVariant('Three', State, 'LongNarrow', 240);
  function addVariant(Errors, State, Content, width) {
    const items = (
      Errors === 'One' ? ['email'] : ['name', 'email', 'interests']
    ).map(key =>
      frame(
        `mg-form-error-summary__item-${key}`,
        [
          text(
            'mg-form-error-summary__marker',
            '•',
            'component.body',
            'color/text',
            null,
            marker
          ),
          {
            ...text(
              'mg-form-error-summary__link',
              messages[key][0],
              linkStyle,
              'color/red-900',
              messages[key][1]
            ),
            textDecoration: 'UNDERLINE',
            textWrap: 'AUTO',
          },
        ],
        {
          mode: 'HORIZONTAL',
          align: 'MIN',
          gap: markerGap,
        }
      )
    );
    const title = {
      ...text(
        'mg-form-error-summary__title',
        'There is a problem',
        headingStyle,
        'color/red-900',
        'Title'
      ),
      textWrap: 'BALANCE',
    };
    const list = frame('mg-form-error-summary__list', items, {
      gap: 'spacing/50',
      padding: {
        block: 'spacing/0',
      },
    });
    list.bindings = {
      paddingLeft: listLeft,
      paddingRight: 'spacing/150',
    };
    const content = frame(
      'mg-form-error-summary__content',
      [
        frame('mg-form-error-summary__title-inset', [title], {
          padding: {
            block: 'spacing/0',
            inline: 'spacing/150',
          },
        }),
        list,
      ],
      {
        gap: 'spacing/75',
        padding: {
          block: 'spacing/150',
          inline: 'spacing/0',
        },
      },
      'color/red-50'
    );
    const tree = frame(
      'mg-form-error-summary',
      [
        frame(
          'mg-form-error-summary__accent',
          [],
          {
            width: accent,
            height: 'FILL',
          },
          'color/red-900'
        ),
        content,
      ],
      {
        mode: 'HORIZONTAL',
        width: widths[width],
        align: 'MIN',
      },
      'color/red-50'
    );
    if (State === 'Focus')
      tree.focusRing = {
        color: 'color/focus-ring',
        separatorColor: 'color/neutral-0',
        offset: 'focus-ring/offset',
        width: 'focus-ring/width',
        radius: zeroRadius,
        outerRadius,
      };
    const properties = {
      Errors,
      State,
      Content,
    };
    family.variants.push({
      id: `form-error-summary.${Errors.toLowerCase()}.${State.toLowerCase()}.${Content.toLowerCase()}`,
      name: `Errors=${Errors}, State=${State}, Content=${Content}`,
      properties,
      tree,
    });
  }
  function identify(node, parent = '') {
    node.id = parent ? `${parent}/${node.name}` : node.name;
    for (const child of node.children || []) identify(child, node.id);
  }
  for (const variant of family.variants) identify(variant.tree);
  return [family];
}
module.exports = {
  buildFormSummaryRecipes,
};
