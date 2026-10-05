/** Source-owned Checkbox recipes, including the source repeated SVG background. */

function buildCheckboxRecipes({ root, modes, variables, styles }) {
  const {
    jsx,
    read,
    markup,
    size,
    border,
    minimum,
    padding,
    outerRadius,
    narrow,
  } = require('./figma-maintenance-checkbox-assets.cjs').buildCheckboxAssets({
    root,
    modes,
    variables,
    styles,
  });
  function tiles(controlWidth) {
    const side = controlWidth - 4;
    return Array.from(
      {
        length: Math.ceil(20 / side),
      },
      (_, index) => ({
        type: 'SVG',
        name: `Source checkmark tile ${index + 1}`,
        svg: {
          assetId: 'form-check-checkbox-checkmark',
          markup,
        },
        layout: {
          width: side,
          height: side,
        },
        position: {
          x: 2,
          y: 2 + index * side,
        },
      })
    );
  }
  function tree({ Checked, State, LabelPosition, Content }) {
    const invalid = State.startsWith('Invalid');
    const disabled = State === 'Disabled' || State === 'InvalidDisabled';
    const focused = State === 'Focus' || State === 'InvalidFocus';
    const preset = Content === 'LongNarrow' ? narrow[State] : null;
    const stroke =
      Checked === 'True'
        ? 'color/form-check--checked'
        : invalid
          ? 'color/red-900'
          : disabled
            ? 'color/neutral-400'
            : State === 'Hover'
              ? 'color/form-check--hover'
              : 'color/form-check';
    const control = {
      type: 'FRAME',
      name: 'Checkbox control',
      fill: null,
      layout: {
        mode: 'VERTICAL',
        align: 'CENTER',
        justify: 'CENTER',
        width: preset?.control || size,
        height: size,
        gap: 'spacing/0',
      },
      bindings: {
        cornerRadius: 'radius/form-input',
      },
      ...(focused
        ? {
            focusRing: {
              color: 'color/focus-ring',
              separatorColor: 'color/neutral-0',
              offset: 'focus-ring/offset',
              width: 'focus-ring/width',
              radius: 'radius/form-input',
              outerRadius,
            },
          }
        : {}),
      children: [
        {
          type: 'FRAME',
          name: 'mg-form-check__input--checkbox',
          fill: Checked === 'True' ? 'color/form-check--checked' : null,
          stroke,
          strokeAlign: 'INSIDE',
          bindings: {
            strokeWeight: border,
            cornerRadius: 'radius/form-input',
          },
          layout: {
            mode: 'VERTICAL',
            width: preset?.control || size,
            height: size,
            clipsContent: true,
            gap: 'spacing/0',
          },
          children:
            Checked === 'True' ? tiles(preset?.measuredControl || 24) : [],
        },
      ],
    };
    function text(name, style, fill, visible) {
      return {
        type: 'TEXT',
        name,
        textProperty: name,
        characters: name === 'Label' ? 'Option A' : 'Choose an option',
        textStyle: style,
        fill,
        ...(visible
          ? {
              visibilityProperty: visible,
            }
          : {}),
        layout: {
          width: preset ? 'FILL' : 'HUG',
          height: 'HUG',
        },
      };
    }
    const label = {
      type: 'FRAME',
      name: 'mg-form-check__label',
      fill: null,
      visibilityProperty: 'Show label',
      layout: {
        mode: 'VERTICAL',
        width: preset?.label || 'HUG',
        height: 'HUG',
        padding: {
          block: 'spacing/0',
          inline: padding,
        },
        gap: 'spacing/0',
      },
      children: [text('Label', 'component.body', 'color/text')],
    };
    const error = {
      type: 'FRAME',
      name: 'mg-form-error',
      fill: null,
      visible: invalid,
      layout: {
        mode: 'VERTICAL',
        width: preset?.error || 'HUG',
        height: 'HUG',
        gap: 'spacing/0',
      },
      bindings: {
        paddingTop: 'spacing/25',
      },
      children: [
        text('Error', 'component.error', 'color/red-900', 'Show error'),
      ],
    };
    return {
      type: 'FRAME',
      name: 'mg-form-check',
      fill: null,
      layout: {
        mode: 'HORIZONTAL',
        align: 'CENTER',
        justify: 'MIN',
        width: preset ? 240 : 'FILL',
        height: 'HUG',
        minHeight: minimum,
        gap: 'spacing/0',
      },
      children: [
        ...(LabelPosition === 'Before' ? [label, control] : [control, label]),
        error,
      ],
    };
  }
  const family = {
    id: 'checkbox',
    name: 'Mangrove/Checkbox',
    kind: 'component-set',
    source: {
      file: jsx,
      line: read(jsx)
        .slice(0, read(jsx).indexOf('export function Checkbox('))
        .split('\n').length,
    },
    description:
      'Source Checkbox with editable Label/Error, source checked SVG tiles and bounded English narrow presets. Checked overrides both fill and border, including invalid/disabled. Inline error follows source markup. Native visual states do not implement form semantics.',
    limitations: [
      'Source block-level flex fills its container; native short presets hug occupied content. Two 240px English presets record source shrink widths, not general CSS resizing.',
      'Source SVG tiling, clipped rounded corners and focus rings require native rendering acceptance. Browser measured exact Roboto Regular; Figma font-file equivalence, other brands and Arabic remain unverified.',
      'No source indeterminate skin was found. Focused/Before narrow combinations, arbitrary content and group compositions remain separate work.',
    ],
    variants: [],
    review: {
      genericLabels: false,
      specimens: [
        ...['Default', 'Invalid'].map(State => ({
          id: `source-long-narrow-${State.toLowerCase()}`,
          name: `Source long ${State.toLowerCase()} Checkbox in 240px`,
          variant: {
            Checked: 'True',
            State,
            LabelPosition: 'After',
            Content: 'LongNarrow',
          },
          width: 240,
          instanceWidth: 240,
          properties: {
            Label:
              'Receive early warnings and detailed disaster risk information for my local community',
            Error: 'Select one preferred information service',
          },
        })),
        {
          id: 'optional-label-and-error',
          name: 'Invalid Checkbox without visible label or error',
          variant: {
            Checked: 'False',
            State: 'Invalid',
            LabelPosition: 'After',
            Content: 'Short',
          },
          width: 320,
          properties: {
            'Show label': false,
            'Show error': false,
          },
        },
      ],
    },
  };
  function variant(properties) {
    family.variants.push({
      id: `checkbox.${properties.Checked.toLowerCase()}.${properties.State.toLowerCase()}.${properties.LabelPosition.toLowerCase()}.${properties.Content.toLowerCase()}`,
      properties,
      name: Object.entries(properties)
        .map(([key, value]) => `${key}=${value}`)
        .join(', '),
      tree: tree(properties),
    });
  }
  for (const Checked of ['False', 'True'])
    for (const State of [
      'Default',
      'Hover',
      'Focus',
      'Disabled',
      'Invalid',
      'InvalidFocus',
      'InvalidDisabled',
    ])
      for (const LabelPosition of ['After', 'Before'])
        variant({
          Checked,
          State,
          LabelPosition,
          Content: 'Short',
        });
  for (const State of ['Default', 'Invalid'])
    variant({
      Checked: 'True',
      State,
      LabelPosition: 'After',
      Content: 'LongNarrow',
    });
  function identify(node, parent = '') {
    node.id = parent ? `${parent}/${node.name}` : node.name;
    for (const child of node.children || []) identify(child, node.id);
  }
  for (const variant of family.variants) identify(variant.tree);
  return [family];
}
module.exports = {
  buildCheckboxRecipes,
};
