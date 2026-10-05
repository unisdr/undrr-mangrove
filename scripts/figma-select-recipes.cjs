/** Source-owned closed native Select. Short values only; no invented option menu. */
'use strict';

function buildSelectRecipes({ root, modes, variables, styles }) {
  const {
    jsxFile,
    fail,
    source,
    markup,
    byName,
    value,
    offset,
    disabledOpacity,
    exactStyle,
  } = require('./figma-maintenance-select-assets.cjs').buildSelectAssets({
    root,
    modes,
    variables,
    styles,
  });
  const typography = {
    label: exactStyle('component.body', '300'),
    value: exactStyle('component.input', 'form-input', true),
    help: exactStyle('component.help', '200'),
    error: exactStyle('component.error', '300'),
  };
  const fieldText = 'component/text-input/browser-fieldtext';
  for (const mode of modes) {
    const colour = value(fieldText, mode);
    if (
      byName.get(fieldText)?.type !== 'COLOR' ||
      !['r', 'g', 'b'].every(channel => colour[channel] === 0) ||
      colour.a !== 1
    )
      fail('Measured Chromium UA fieldtext helper must remain exact black');
  }
  const text = (id, name, characters, textStyle, fill, textProperty) => ({
    id,
    type: 'TEXT',
    name,
    characters,
    textStyle,
    fill,
    stroke: null,
    ...(textProperty
      ? {
          textProperty,
        }
      : {}),
    textDecoration: 'NONE',
    textWrap: 'AUTO',
    layout: {
      width: 'FILL',
      height: 'HUG',
    },
  });
  const frame = (id, name, children, layout = {}) => ({
    id,
    type: 'FRAME',
    name,
    fill: null,
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
  const family = {
    id: 'select',
    name: 'Mangrove/Select',
    kind: 'component-set',
    source: {
      file: jsxFile,
      line: source(jsxFile, /export function Select/).line,
    },
    description:
      'Closed native Select, five source states and short editable Value seeds only. Placeholder and selected value share Chromium UA fieldtext black and the same default surface; Focus overrides Invalid boundary while error copy remains. Exact source12x8 SVG chevron retains its authored #1a1a1a fill. Label/help/error share existing Regular roles. Only the disabled control uses the measured Chromium/macOS user-agent opacity0.7 baseline; label/help stay fully opaque. Generic FILL TEXT wraps in Figma, unlike the native single-line select, so long Value, browser-native popup/interaction, other browser disabled paints, required inline marker wrapping, RTL/non-Latin, arbitrary widths and all-brand visual acceptance remain pending. Show-label/help/required properties affect visual presentation only. Field bottom margin belongs consumer layout.',
    variants: [],
    review: {
      genericLabels: false,
      width: 320,
      specimens: [
        {
          id: 'closed-240',
          name: 'Closed face / 240px consumer',
          variant: {
            State: 'Default',
          },
          width: 240,
          instanceWidth: 240,
          properties: {
            Value: 'Depth',
          },
        },
      ],
    },
  };
  for (const State of [
    'Default',
    'Focus',
    'Invalid',
    'InvalidFocus',
    'Disabled',
  ]) {
    const disabled = State === 'Disabled';
    const invalid = State.startsWith('Invalid');
    const focused = State.endsWith('Focus');
    const marker = {
      ...text(
        'required',
        'mg-form-label--required',
        ' *',
        typography.label,
        'color/red-900'
      ),
      visible: false,
      visibilityProperty: 'Required',
      layout: {
        width: 'HUG',
        height: 'HUG',
      },
    };
    const label = frame(
      'label',
      'mg-form-label',
      [
        {
          ...text(
            'text',
            'mg-form-label__text',
            'Category',
            typography.label,
            disabled ? 'color/neutral-400' : 'color/text',
            'Label'
          ),
          layout: {
            width: 'HUG',
            height: 'HUG',
          },
        },
        marker,
      ],
      {
        mode: 'HORIZONTAL',
        width: 'HUG',
      }
    );
    label.visibilityProperty = 'Show label';
    const chevron = frame(
      'chevron',
      'Source Select chevron viewport',
      [
        {
          type: 'SVG',
          id: 'source',
          name: 'Source inline chevron',
          svg: {
            assetId: 'form-select-chevron',
            markup,
          },
          layout: {
            width: 12,
            height: 8,
          },
          position: {
            x: 0,
            y: 0,
          },
        },
      ],
      {
        mode: 'NONE',
        width: 12,
        height: 8,
      }
    );
    chevron.absolute = {
      horizontal: 'END',
      vertical: 'CENTER',
      offsetX: offset,
      offsetY: 'spacing/0',
    };
    const control = frame(
      'control',
      'mg-form-select',
      [
        text(
          'value',
          'mg-form-select__value',
          'Select an option',
          typography.value,
          disabled ? 'color/neutral-400' : fieldText,
          'Value'
        ),
        chevron,
      ],
      {
        mode: 'HORIZONTAL',
        width: 'FILL',
        height: 'form-input/block-size',
        align: 'CENTER',
        padding: {
          block: 'form-input/padding',
        },
      }
    );
    control.fill = disabled
      ? 'color/white'
      : focused
        ? 'form-input/background--focus'
        : 'form-input/background';
    control.stroke = disabled
      ? 'color/neutral-400'
      : focused
        ? 'color/form-focus'
        : invalid
          ? 'color/red-900'
          : 'form-input/border-color';
    control.bindings = {
      cornerRadius: 'radius/form-input',
      strokeWeight: 'form-input/border-width',
      paddingLeft: 'form-input/padding',
      paddingRight: 'spacing/200',
      ...(disabled
        ? {
            opacity: disabledOpacity,
          }
        : {}),
    };
    control.effectStyle = focused ? 'focus-ring' : null;
    const help = text(
      'help',
      'mg-form-help',
      'Choose your preferred language',
      typography.help,
      'color/neutral-500',
      'Help text'
    );
    help.visibilityProperty = 'Show help';
    const error = text(
      'message',
      'mg-form-error',
      'Please select an option',
      typography.error,
      'color/red-900',
      'Error message'
    );
    error.visibilityProperty = 'Show error';
    const errorWrapper = frame('error', 'Invalid message source state', [
      error,
    ]);
    errorWrapper.visible = invalid;
    family.variants.push({
      id: `select.${State.toLowerCase()}`,
      name: `State=${State}`,
      properties: {
        State,
      },
      tree: frame(
        'field',
        'mg-form-field',
        [label, control, help, errorWrapper],
        {
          width: 320,
          gap: 'spacing/25',
        }
      ),
    });
  }
  return [family];
}
module.exports = {
  buildSelectRecipes,
};
