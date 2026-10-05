/** Source-owned choice-control recipes. No Figma runtime values live here. */

function buildChoiceRecipes({ root, modes, variables, styles }) {
  const {
    jsx,
    source,
    dimension,
    minimum,
    border,
    padding,
    radius,
    outerRadius,
    checkedEffect,
    longLabel,
    longError,
    narrow,
  } = require('./figma-maintenance-choice-assets.cjs').buildChoiceAssets({
    root,
    modes,
    variables,
    styles,
  });
  const focusRing = {
    color: 'color/focus-ring',
    separatorColor: 'color/neutral-0',
    offset: 'focus-ring/offset',
    width: 'focus-ring/width',
    radius,
    outerRadius,
  };
  const text = (name, property, textStyle, fill) => ({
    type: 'TEXT',
    name,
    textProperty: property,
    characters: property === 'Label' ? 'Option A' : 'Choose an option',
    textStyle,
    fill,
    layout: {
      width: 'HUG',
      height: 'HUG',
    },
  });
  function tree({ Checked, State, LabelPosition, Content }) {
    const invalid = State.startsWith('Invalid');
    const disabled = State === 'Disabled' || State === 'InvalidDisabled';
    const focused = State === 'Focus' || State === 'InvalidFocus';
    const preset = Content === 'LongNarrow' ? narrow[State] : null;
    const input = {
      type: 'ELLIPSE',
      name: 'mg-form-check__input--radio',
      fill: Checked === 'True' ? 'color/form-check--checked' : null,
      stroke: invalid
        ? 'color/red-900'
        : disabled
          ? 'color/neutral-400'
          : State === 'Hover'
            ? 'color/form-check--hover'
            : 'color/form-check',
      strokeAlign: 'INSIDE',
      bindings: {
        strokeWeight: border,
      },
      effectStyle: Checked === 'True' ? checkedEffect.id : null,
      layout: {
        width: preset?.control || dimension,
        height: dimension,
      },
    };
    const control = {
      type: 'FRAME',
      name: 'Radio control',
      fill: null,
      layout: {
        mode: 'VERTICAL',
        align: 'CENTER',
        justify: 'CENTER',
        width: preset?.control || dimension,
        height: dimension,
        gap: 'spacing/0',
      },
      bindings: focused
        ? {
            cornerRadius: radius,
          }
        : {},
      ...(focused
        ? {
            focusRing,
          }
        : {}),
      children: [input],
    };
    const labelText = text('Label', 'Label', 'component.body', 'color/text');
    const errorText = {
      ...text('Error', 'Error', 'component.error', 'color/red-900'),
      visibilityProperty: 'Show error',
    };
    if (preset) {
      labelText.layout.width = 'FILL';
      errorText.layout.width = 'FILL';
    }
    const labelFrame = {
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
      children: [labelText],
    };
    const errorFrame = {
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
      children: [errorText],
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
        ...(LabelPosition === 'Before'
          ? [labelFrame, control]
          : [control, labelFrame]),
        errorFrame,
      ],
      fidelity: preset
        ? 'Finite 240px English source flex-shrink specimen: original control is elliptical, label/error remain inline. Widths are measured source presets; arbitrary native instance resizing does not execute CSS flex shrink. Text and row may grow beyond source height to preserve content when native font metrics or wrapping differs.'
        : 'Natural short-content layout with 24px source radio, HUG label and inline error. Native resizing does not reproduce CSS content-dependent flex shrink; choose the LongNarrow preset for the measured 240px source specimen.',
    };
  }
  const family = {
    id: 'radio',
    name: 'Mangrove/Radio',
    kind: 'component-set',
    source: source(jsx, /export function Radio\(/),
    description:
      'Radio with native ellipse, editable Label/Error, optional label/error text and actual horizontal source order. Checked Radio retains state-owned border and blue fill even when invalid or disabled. Short variants cover both label positions and seven distinct source treatments. Two checked After LongNarrow presets preserve source flex shrink at 240px for recorded English content. No native form-selection/keyboard behaviour is implied.',
    limitations: [
      'Latin default text role only. Isolated Chromium 153/macOS matched custom Roboto-Regular for both label and error; Figma font-file equivalence and all-brand/Arabic rendering remain unverified.',
      'The source error is inline, despite older JSDoc saying below. InvalidDisabled uses red border because the later invalid selector wins; disabled label/checked fill do not dim.',
      'No full CSS flex-shrink algorithm, dynamic parent-width adaptation or arbitrary content sizing. LongNarrow presets use measured English content-dependent widths. Before-label narrow and focused narrow combinations remain unbuilt.',
      'Native checked inner-shadow/ellipse border and short focus-outline compositing require visual acceptance. Native content may wrap differently, so label/error and row height hug content rather than clip.',
    ],
    variants: [],
    review: {
      genericLabels: false,
      specimens: [
        ...['Default', 'Invalid'].map(State => ({
          id: `source-long-narrow-${State.toLowerCase()}`,
          name: `Source long ${State.toLowerCase()} Radio in 240px`,
          variant: {
            Checked: 'True',
            State,
            LabelPosition: 'After',
            Content: 'LongNarrow',
          },
          width: 240,
          instanceWidth: 240,
          properties: {
            Label: longLabel,
            Error: longError,
          },
        })),
        {
          id: 'optional-label-and-error',
          name: 'Invalid Radio without visible label or error text',
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
    const id = `radio.${properties.Checked.toLowerCase()}.${properties.State.toLowerCase()}.${properties.LabelPosition.toLowerCase()}.${properties.Content.toLowerCase()}`;
    family.variants.push({
      id,
      properties,
      name: Object.entries(properties)
        .map(([key, val]) => `${key}=${val}`)
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
  for (const entry of family.variants) identify(entry.tree);
  return [family];
}
module.exports = {
  buildChoiceRecipes,
};
