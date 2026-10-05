/** Source-owned basic Switch recipes. Pending and system-colour appearances are separate work. */

function buildSwitchRecipes({ root, modes, variables, styles }) {
  const {
    stories,
    source,
    value,
    geometry,
    num,
    opacity,
    minimum,
    widths,
    washes,
    shadows,
    switchSizes,
  } = require('./figma-maintenance-switch-assets.cjs').buildSwitchAssets({
    root,
    modes,
    variables,
    styles,
  });
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
    textProperty: property,
    textWrap: 'AUTO',
    layout: {
      width,
      height: 'HUG',
    },
  });
  const states = [
    'Default',
    'Focus',
    'Disabled',
    'AriaDisabled',
    'AriaDisabledFocus',
    'Invalid',
    'InvalidFocus',
    'InvalidDisabled',
    'InvalidAriaDisabled',
    'InvalidAriaDisabledFocus',
  ];
  const longLabel =
    'Receive early warnings and detailed disaster risk information for my local community';
  const families = [];
  for (const Size of ['Default', 'Small']) {
    const {
      slug,
      blockSize,
      trackWidth,
      authoredInset,
      border,
      thumbSize,
      travel,
      radius,
      outerRadius,
    } = switchSizes.get(Size);
    const family = {
      id: Size === 'Default' ? 'switch' : 'switch-small',
      name: `Mangrove/Switch${Size === 'Small' ? ' small' : ''}`,
      kind: 'component-set',
      source: source(stories, /export const Switch =/),
      description:
        'Basic Latin LTR source switch and external feedback composition. Label, Help and Error are editable; visibility booleans are native authoring controls, not new React props. Pending arcs/dots, custom consumer hooks, RTL, forced colours and dynamic semantics are not represented. Small native geometry explicitly follows the measured Chrome border rounding. Native font, shadow/compositing and text wrapping require acceptance.',
      variants: [],
      optionalProperties: {
        'Show label': {
          nodeName: 'mg-switch__label',
          defaultValue: true,
        },
        'Show help': {
          nodeName: 'mg-switch__help-wrapper',
          defaultValue: false,
        },
        'Show error': {
          nodeName: 'mg-form-error',
          defaultValue: true,
        },
      },
      review: {
        genericLabels: false,
        width: 320,
        ...(Size === 'Default'
          ? {
              specimens: [false, true].map(checked => ({
                id: `long-narrow-${checked ? 'on' : 'off'}`,
                name: `Long ${checked ? 'on' : 'off'} switch in 240px source consumer`,
                variant: {
                  Checked: checked ? 'True' : 'False',
                  State: 'Default',
                  Content: 'LongNarrow',
                },
                width: 240,
                instanceWidth: widths[240],
                properties: {
                  Label: longLabel,
                },
              })),
            }
          : {}),
      },
    };
    function variant(checked, State, Content = 'Short') {
      const invalid = State.startsWith('Invalid'),
        ariaDisabled = State.includes('AriaDisabled'),
        nativeDisabled = State.includes('Disabled') && !ariaDisabled,
        focused = State.includes('Focus'),
        narrow = Content === 'LongNarrow';
      const thumbNode = {
        type: 'ELLIPSE',
        name: 'mg-switch__thumb',
        fill: 'color/neutral-0',
        stroke: null,
        effectStyle: shadows[ariaDisabled],
        layout: {
          width: thumbSize,
          height: thumbSize,
        },
      };
      const trackNode = frame(
        'mg-switch__track',
        [
          ...(checked
            ? [
                frame('mg-switch__travel', [], {
                  width: travel,
                  height: 'HUG',
                }),
              ]
            : []),
          thumbNode,
        ],
        {
          mode: 'HORIZONTAL',
          width: trackWidth,
          height: blockSize,
          align: 'CENTER',
          padding: {
            block: 'spacing/0',
            inline: border,
          },
        },
        ariaDisabled
          ? washes[checked]
          : checked
            ? 'color/interactive'
            : 'color/neutral-400'
      );
      trackNode.stroke = invalid
        ? 'color/red-900'
        : 'component/color/transparent';
      trackNode.strokesIncludedInLayout = false;
      trackNode.bindings = {
        cornerRadius: radius,
        strokeWeight: border,
        ...(nativeDisabled
          ? {
              opacity,
            }
          : {}),
      };
      if (focused)
        trackNode.focusRing = {
          color: 'color/focus-ring',
          separatorColor: 'color/neutral-0',
          offset: 'focus-ring/offset',
          width: 'focus-ring/width',
          radius,
          outerRadius,
        };
      const labelNode = text(
        'mg-switch__label',
        'Active map layer',
        'component.body',
        nativeDisabled || ariaDisabled
          ? 'color/neutral-400'
          : 'color/neutral-900',
        'Label',
        narrow ? 'FILL' : 'HUG'
      );
      labelNode.visibilityProperty = 'Show label';
      const row = frame('mg-switch', [trackNode, labelNode], {
        mode: 'HORIZONTAL',
        width: narrow ? 'FILL' : 'HUG',
        minHeight: minimum,
        align: 'CENTER',
        gap: Size === 'Small' ? 'spacing/50' : 'spacing/75',
      });
      const help = frame(
        'mg-switch__help-wrapper',
        [
          text(
            'mg-form-help',
            'Additional information',
            'component.help',
            'color/neutral-500',
            'Help'
          ),
        ],
        {}
      );
      help.visible = false;
      help.bindings = {
        paddingTop: 'spacing/25',
      };
      help.visibilityProperty = 'Show help';
      const error = frame(
        'mg-switch__error-wrapper',
        [
          text(
            'mg-form-error',
            'This layer could not load. Try again.',
            'component.error',
            'color/red-900',
            'Error'
          ),
        ],
        {}
      );
      error.bindings = {
        paddingTop: 'spacing/25',
      };
      error.children[0].visibilityProperty = 'Show error';
      error.visible = invalid;
      // Block siblings belong to the host composition, not inside the accessible switch label.
      const tree = frame('Switch and feedback', [row, help, error], {
        width: widths[narrow ? 240 : 320],
      });
      family.variants.push({
        id: `${family.id}.${checked ? 'on' : 'off'}.${State.toLowerCase()}.${Content.toLowerCase()}`,
        name: `Checked=${checked ? 'True' : 'False'}, State=${State}, Content=${Content}`,
        properties: {
          Checked: checked ? 'True' : 'False',
          State,
          Content,
        },
        tree,
      });
    }
    for (const checked of [false, true])
      for (const state of states) variant(checked, state);
    if (Size === 'Default')
      for (const checked of [false, true])
        variant(checked, 'Default', 'LongNarrow');
    const identify = (node, parent = '') => {
      node.id = parent ? `${parent}/${node.name}` : node.name;
      for (const child of node.children || []) identify(child, node.id);
    };
    for (const v of family.variants) identify(v.tree);
    families.push(family);
  }
  return families;
}
module.exports = {
  buildSwitchRecipes,
};
