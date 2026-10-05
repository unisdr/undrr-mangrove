/** Source-backed native Figma recipes. Values belong here, not in the plugin. */

function buildComponentRecipes({ root, modes, variables, styles }) {
  const {
    sources,
    source,
    reference,
    byName,
    value,
    railRadius,
    railBorder,
    comboWidth,
    triggerWidth,
    comboOpacity,
    popoverHeight,
    popoverBorder,
    zero,
    transparent,
    inputFieldText,
    textareaBlockSize,
    typography,
    buttonOuterRadius,
    tabOuterRadius,
    tableFloat,
    tableBorder,
    tableHalfBorder,
    tableStyles,
    tableHeights,
    tableSpecimens,
  } = require('./figma-maintenance-component-assets.cjs').buildComponentAssets({
    root,
    modes,
    variables,
    styles,
  });
  const frame = (name, children, extra = {}) => ({
    type: 'FRAME',
    name,
    layout: {
      mode: 'VERTICAL',
      width: 'FILL',
      height: 'HUG',
      gap: zero,
    },
    strokeAlign: 'INSIDE',
    strokesIncludedInLayout: true,
    children,
    ...extra,
  });
  const text = (name, characters, style, fill, property) => ({
    type: 'TEXT',
    name,
    characters,
    textStyle: style,
    fill,
    textProperty: property,
    layout: {
      width: 'HUG',
      height: 'HUG',
    },
  });
  const variant = (id, properties, tree) => ({
    id,
    name: Object.entries(properties)
      .map(([key, val]) => `${key}=${val}`)
      .join(', '),
    properties,
    tree,
  });
  const family = (id, name, file, pattern, variants, extra = {}) => ({
    id,
    name,
    kind: 'component-set',
    source: reference(file, pattern),
    variants,
    ...extra,
  });
  const buttons = [];
  for (const Emphasis of ['Primary', 'Secondary'])
    for (const Treatment of ['Filled', 'Outline'])
      for (const State of ['Default', 'Hover', 'Focus', 'Disabled']) {
        const lower = Emphasis.toLowerCase();
        const outline = Treatment === 'Outline';
        const hovered = State === 'Hover';
        const disabled = State === 'Disabled';
        const foreground = disabled
          ? 'color/neutral-0'
          : outline && !hovered
            ? `color/button-outline-${lower}`
            : 'color/button';
        const fill = disabled
          ? 'color/neutral-500'
          : outline
            ? hovered
              ? `color/button-outline-${lower}--hover`
              : null
            : `color/button-${lower === 'primary' ? '' : 'secondary-'}background${hovered ? '--hover' : ''}`;
        const stroke = disabled
          ? transparent
          : outline
            ? `color/button-outline-${lower}`
            : `border-color/button-${lower}`;
        buttons.push(
          variant(
            `button.${lower}.${Treatment.toLowerCase()}.${State.toLowerCase()}`,
            {
              Emphasis,
              Treatment,
              State,
            },
            frame(
              'mg-button',
              [
                text(
                  'mg-button__label',
                  'Button',
                  typography.button,
                  foreground,
                  'Label'
                ),
              ],
              {
                layout: {
                  mode: 'HORIZONTAL',
                  width: 'HUG',
                  height: 'HUG',
                  gap: 'spacing/50',
                  padding: {
                    block: 'padding/button/block',
                    inline: 'padding/button/inline',
                  },
                  align: 'CENTER',
                  justify: 'CENTER',
                },
                bindings: {
                  cornerRadius: 'radius/button',
                  strokeWeight: 'border-width/button',
                },
                fill,
                stroke,
                effectStyle:
                  State === 'Focus' && !outline ? 'focus-ring' : null,
                ...(State === 'Focus' && outline
                  ? {
                      focusRing: {
                        color: 'color/focus-ring',
                        separatorColor: 'color/neutral-0',
                        offset: 'focus-ring/offset',
                        width: 'focus-ring/width',
                        radius: 'radius/button',
                        outerRadius: buttonOuterRadius,
                      },
                    }
                  : {}),
              }
            )
          )
        );
      }
  function fieldLabel(disabled = false, combo = false) {
    const name = combo ? 'mg-combobox__label' : 'mg-form-label';
    const marker = text(
      'mg-form-label--required',
      ' *',
      typography.body,
      'color/red-900'
    );
    marker.visible = false;
    marker.visibilityProperty = 'Required';
    return frame(
      name,
      [
        text(
          `${name}__text`,
          'Label',
          typography.body,
          disabled
            ? 'color/neutral-400'
            : combo
              ? 'control/text'
              : 'color/text',
          'Label'
        ),
        marker,
      ],
      {
        layout: {
          mode: 'HORIZONTAL',
          width: 'HUG',
          height: 'HUG',
          gap: zero,
        },
        visibilityProperty: 'Show label',
      }
    );
  }
  source(
    sources.input,
    /&--required::after\s*\{\s*color: rgb\(var\(--mg-color-red-900\)\);\s*content: " \*"/
  );
  function helpText(combo = false) {
    return {
      ...text(
        'mg-form-help',
        'Help text',
        typography.help,
        'color/neutral-500',
        'Help text'
      ),
      visibilityProperty: 'Show help',
      visible: !combo,
    };
  }
  const inputStates = [
    'Default',
    'Filled',
    'Focused',
    'Invalid',
    'InvalidFocused',
    'Disabled',
  ];
  const inputs = inputStates.map(State => {
    const disabled = State === 'Disabled';
    const invalid = State.startsWith('Invalid');
    const focused = State.includes('Focused');
    const filled = State === 'Filled';
    const input = frame(
      'mg-form-input',
      [
        text(
          'mg-form-input__value',
          'Input text',
          typography.input,
          disabled
            ? 'color/neutral-400'
            : filled
              ? // Chromium's UA fieldtext is black; source has no colour role.
                // This is the measured baseline, not a cross-platform CSS role.
                inputFieldText
              : 'color/neutral-500',
          'Value'
        ),
      ],
      {
        layout: {
          mode: 'HORIZONTAL',
          width: 'FILL',
          height: 'form-input/block-size',
          padding: {
            block: 'form-input/padding',
            inline: 'form-input/padding',
          },
          align: 'CENTER',
        },
        bindings: {
          cornerRadius: 'radius/form-input',
          strokeWeight: 'form-input/border-width',
        },
        fill: disabled
          ? 'color/white'
          : filled || focused
            ? 'form-input/background--focus'
            : 'form-input/background',
        stroke: disabled
          ? 'color/neutral-400'
          : focused
            ? 'color/form-focus'
            : invalid
              ? 'color/red-900'
              : 'form-input/border-color',
        effectStyle: focused ? 'focus-ring' : null,
      }
    );
    return variant(
      `text-input.${State.toLowerCase()}`,
      {
        State,
      },
      frame(
        'mg-form-field',
        [
          fieldLabel(disabled),
          input,
          helpText(),
          ...(invalid
            ? [
                text(
                  'mg-form-error',
                  'Error message',
                  typography.error,
                  'color/red-900',
                  'Error message'
                ),
              ]
            : []),
        ],
        {
          layout: {
            mode: 'VERTICAL',
            width: 'FILL',
            height: 'HUG',
            gap: 'spacing/25',
          },
        }
      )
    );
  });
  const textareas = inputStates.map(State => {
    const disabled = State === 'Disabled';
    const invalid = State.startsWith('Invalid');
    const focused = State.includes('Focused');
    const filled = State === 'Filled';
    const area = frame(
      'mg-form-textarea',
      [
        {
          ...text(
            'mg-form-textarea__value',
            'Enter text',
            typography.input,
            disabled
              ? 'color/neutral-400'
              : filled
                ? inputFieldText
                : 'color/neutral-500',
            'Value'
          ),
          layout: {
            width: 'FILL',
            height: 'HUG',
          },
        },
      ],
      {
        layout: {
          mode: 'VERTICAL',
          width: 'FILL',
          height: textareaBlockSize,
          padding: {
            block: 'form-input/padding',
            inline: 'form-input/padding',
          },
          align: 'MIN',
          justify: 'MIN',
          gap: zero,
          clipsContent: true,
        },
        bindings: {
          cornerRadius: 'radius/form-input',
          strokeWeight: 'form-input/border-width',
        },
        fill: disabled
          ? 'color/white'
          : filled || focused
            ? 'form-input/background--focus'
            : 'form-input/background',
        stroke: disabled
          ? 'color/neutral-400'
          : focused
            ? 'color/form-focus'
            : invalid
              ? 'color/red-900'
              : 'form-input/border-color',
        effectStyle: focused ? 'focus-ring' : null,
        fidelity:
          'Initial default-row specimen only. Value wraps from the top; overflow is clipped without native scrolling. Browser vertical resize handle and resizing behaviour are not reproduced.',
      }
    );
    return variant(
      `textarea.${State.toLowerCase()}`,
      {
        State,
      },
      frame(
        'mg-form-field',
        [
          fieldLabel(disabled),
          area,
          helpText(),
          ...(invalid
            ? [
                {
                  ...text(
                    'mg-form-error',
                    'Error message',
                    typography.error,
                    'color/red-900',
                    'Error message'
                  ),
                  visibilityProperty: 'Show error',
                },
              ]
            : []),
        ],
        {
          layout: {
            mode: 'VERTICAL',
            width: 'FILL',
            height: 'HUG',
            gap: 'spacing/25',
          },
        }
      )
    );
  });
  const options = [];
  for (const Selected of ['False', 'True'])
    for (const State of ['Default', 'Hover', 'FocusVisible']) {
      const selected = Selected === 'True';
      options.push(
        variant(
          `combobox-option.${Selected.toLowerCase()}.${State.toLowerCase()}`,
          {
            Selected,
            State,
          },
          frame(
            'mg-combobox__option',
            [
              text(
                'mg-combobox__option-label',
                'Hazard type',
                selected ? typography.option : typography.body,
                'control/text',
                'Label'
              ),
            ],
            {
              layout: {
                mode: 'HORIZONTAL',
                width: 'FILL',
                height: 'HUG',
                padding: {
                  block: 'spacing/100',
                  inline: 'spacing/100',
                },
              },
              bindings: {
                cornerRadius: 'radius/form-input',
              },
              fill: selected
                ? 'control/option-selected'
                : State === 'Default'
                  ? null
                  : 'control/option-hover',
              effectStyle: State === 'FocusVisible' ? 'focus-ring-inset' : null,
            }
          )
        )
      );
    }
  const combos = [
    'Default',
    'InputFocused',
    'TriggerFocused',
    'Open',
    'Invalid',
    'Disabled',
  ].map(State => {
    const focused = State === 'InputFocused' || State === 'Open';
    const invalid = State === 'Invalid';
    const input = frame(
      'mg-combobox__input',
      [
        text(
          'mg-combobox__input-value',
          'Search hazards',
          typography.body,
          'control/muted-text',
          'Value'
        ),
      ],
      {
        layout: {
          mode: 'HORIZONTAL',
          width: 'FILL',
          height: 'HUG',
          minHeight: 'form-input/block-size',
          padding: {
            block: 'form-input/padding',
            inline: 'form-input/padding',
          },
          align: 'CENTER',
        },
        bindings: {
          topLeftRadius: 'radius/form-input',
          bottomLeftRadius: 'radius/form-input',
          topRightRadius: zero,
          bottomRightRadius: zero,
          strokeWeight: 'form-input/border-width',
        },
        fill: focused ? 'control/surface-focus' : 'control/surface',
        stroke: invalid
          ? 'control/error'
          : focused
            ? 'control/border-focus'
            : 'control/border',
        effectStyle: focused ? 'focus-ring' : null,
      }
    );
    const trigger = frame(
      'mg-combobox__trigger',
      [
        text(
          'mg-combobox__trigger-glyph',
          '▾',
          typography.body,
          'control/text'
        ),
      ],
      {
        layout: {
          mode: 'HORIZONTAL',
          width: triggerWidth,
          height: 'FILL',
          align: 'CENTER',
          justify: 'CENTER',
        },
        bindings: {
          topLeftRadius: zero,
          bottomLeftRadius: zero,
          topRightRadius: 'radius/form-input',
          bottomRightRadius: 'radius/form-input',
          strokeWeight: 'form-input/border-width',
          strokeLeftWeight: zero,
        },
        fill: 'control/surface',
        stroke: 'control/border',
        effectStyle: State === 'TriggerFocused' ? 'focus-ring' : null,
      }
    );
    const children = [
      fieldLabel(false, true),
      frame('mg-combobox__control', [input, trigger], {
        layout: {
          mode: 'HORIZONTAL',
          width: 'FILL',
          height: 'HUG',
          gap: zero,
          align: 'STRETCH',
        },
      }),
    ];
    if (State === 'Open')
      children.push(
        frame(
          'mg-combobox__popover',
          ['Tropical cyclone', 'Drought', 'Flood'].map((Label, i) => ({
            type: 'INSTANCE',
            expose: true,
            family: 'combobox-option',
            name: `mg-combobox__option-${i + 1}`,
            variant: {
              Selected: 'False',
              State: i === 0 ? 'FocusVisible' : 'Default',
            },
            overrides: {
              Label,
            },
            layout: {
              width: 'FILL',
              height: 'HUG',
            },
          })),
          {
            layout: {
              mode: 'VERTICAL',
              width: 'FILL',
              height: 'HUG',
              maxHeight: popoverHeight,
              gap: zero,
              padding: {
                block: 'spacing/25',
                inline: 'spacing/25',
              },
            },
            bindings: {
              cornerRadius: 'radius/form-input',
              strokeWeight: popoverBorder,
            },
            fill: 'control/surface-focus',
            stroke: 'control/border',
            effectStyle: 'shadow.raised',
            fidelity:
              'Popover displayed in flow for the specimen; runtime positioning is an overlay constrained by viewport and trigger width.',
          }
        )
      );
    children.push(helpText(true));
    if (invalid)
      children.push(
        text(
          'mg-combobox__error',
          'Choose a hazard type.',
          typography.help,
          'control/error',
          'Error message'
        )
      );
    return variant(
      `combobox.${State.toLowerCase()}`,
      {
        State,
      },
      frame('mg-combobox', children, {
        layout: {
          mode: 'VERTICAL',
          width: 'FILL',
          height: 'HUG',
          maxWidth: comboWidth,
          gap: 'spacing/25',
        },
        bindings:
          State === 'Disabled'
            ? {
                opacity: comboOpacity,
              }
            : {},
        fidelity:
          'Latin, left-to-right scaffold. Start and end corners must be mirrored for right-to-left.',
      })
    );
  });
  const triggers = [];
  for (const Selected of ['False', 'True'])
    for (const State of ['Default', 'Hover', 'Focus']) {
      const selected = Selected === 'True';
      triggers.push(
        variant(
          `tabs-trigger.${Selected.toLowerCase()}.${State.toLowerCase()}`,
          {
            Selected,
            State,
          },
          frame(
            'mg-tabs__link',
            [
              text(
                'mg-tabs__label',
                'Tab',
                typography.tab,
                'tab/color',
                'Label'
              ),
            ],
            {
              layout: {
                mode: 'HORIZONTAL',
                width: 'HUG',
                height: 'HUG',
                minHeight: 'tab/min-block-size',
                padding: {
                  block: 'spacing/75',
                  inline: 'spacing/150',
                },
                align: 'CENTER',
                justify: 'CENTER',
              },
              bindings: {
                cornerRadius: 'tab/radius',
                strokeWeight: railBorder,
              },
              fill: selected
                ? 'tab/background--active'
                : State === 'Hover'
                  ? 'tab/background--hover'
                  : null,
              stroke: selected ? 'tab/indicator--active' : transparent,
              effectStyle: null,
              ...(State === 'Focus'
                ? {
                    focusRing: {
                      color: 'color/focus-ring',
                      separatorColor: 'color/neutral-0',
                      offset: 'focus-ring/offset',
                      width: 'focus-ring/width',
                      radius: 'tab/radius',
                      outerRadius: tabOuterRadius,
                    },
                  }
                : {}),
            }
          )
        )
      );
    }
  const rail = variant(
    'tabs.horizontal',
    {
      Layout: 'Horizontal',
    },
    frame(
      'mg-tabs__rail',
      ['Overview', 'Resources', 'Related'].map((Label, i) => ({
        type: 'INSTANCE',
        expose: true,
        family: 'tabs-trigger',
        name: `mg-tabs__item-${i + 1}`,
        variant: {
          Selected: i === 0 ? 'True' : 'False',
          State: 'Default',
        },
        overrides: {
          Label,
        },
        layout: {
          width: 'HUG',
          height: 'HUG',
        },
      })),
      {
        layout: {
          mode: 'HORIZONTAL',
          width: 'HUG',
          height: 'HUG',
          gap: 'tab/rail-gap',
          padding: {
            block: 'tab/rail-padding',
            inline: 'tab/rail-padding',
          },
        },
        bindings: {
          cornerRadius: railRadius,
          strokeWeight: railBorder,
        },
        fill: 'tab/rail-background',
        stroke: 'tab/rail-border',
        fidelity:
          'Horizontal rail only. Panel content, overflow fades and responsive stacked disclosures are later scaffolds.',
      }
    )
  );
  const tableInstance = (name, familyId, selected, extra = {}) => ({
    type: 'INSTANCE',
    name,
    family: familyId,
    variant: selected,
    expose: true,
    layout: {
      width: 'FILL',
      height: 'FILL',
    },
    ...extra,
  });
  const tableCells = Role =>
    ['Large', 'Small'].flatMap(Size =>
      ['None', 'Grid'].map(Border =>
        variant(
          `table-${Role.toLowerCase()}-cell.${Size.toLowerCase()}.${Border.toLowerCase()}`,
          {
            Size,
            Border,
          },
          frame(
            `mg-table__${Role.toLowerCase()}-cell`,
            [
              {
                ...text(
                  'mg-table__text',
                  Role === 'Header' ? 'Header' : 'Value',
                  tableStyles[`${Size}/${Role}`],
                  'color/text',
                  'Label'
                ),
                layout: {
                  width: 'FILL',
                  height: 'HUG',
                },
              },
            ],
            {
              layout: {
                mode: 'VERTICAL',
                width: 'FILL',
                height: tableHeights[Size].content,
                gap: zero,
                align: 'MIN',
                justify: 'MIN',
                clipsContent: false,
                padding: {
                  block: Size === 'Large' ? 'spacing/100' : 'spacing/50',
                  inline: Size === 'Large' ? 'spacing/150' : 'spacing/100',
                },
              },
              stroke: Border === 'Grid' ? 'color/neutral-400' : null,
              bindings: {
                strokeTopWeight: zero,
                strokeBottomWeight: zero,
                strokeLeftWeight: Border === 'Grid' ? tableHalfBorder : zero,
                strokeRightWeight: Border === 'Grid' ? tableHalfBorder : zero,
              },
              fidelity:
                'Fixed-geometry cell specimen. Text wraps from the top and is not clipped; more lines can overflow. Use a compatible measured Row/Table preset. Automatic intrinsic reflow and arbitrary nested geometry resizing are not supported.',
            }
          )
        )
      )
    );
  const tableRows = ['Large', 'Small'].flatMap(Size =>
    ['Default', 'Striped', 'Border'].flatMap(Treatment =>
      ['Header', 'Odd', 'Even'].map(Role => {
        const grid = Treatment === 'Border';
        const defaultBody = Treatment === 'Default' && Role !== 'Header';
        const height =
          grid || defaultBody
            ? tableHeights[Size].bordered
            : tableHeights[Size].content;
        const cellFamily =
          Role === 'Header' ? 'table-header-cell' : 'table-body-cell';
        return variant(
          `table-row.${Size.toLowerCase()}.${Treatment.toLowerCase()}.${Role.toLowerCase()}`,
          {
            Size,
            Treatment,
            Role,
            Columns: 'Equal',
          },
          frame(
            'mg-table__row',
            [1, 2, 3].map(index =>
              tableInstance(
                `mg-table__cell-${index}`,
                cellFamily,
                {
                  Size,
                  Border: grid ? 'Grid' : 'None',
                },
                {
                  overrides: {
                    Label:
                      Role === 'Header'
                        ? 'Header'
                        : index === 3
                          ? 'Details'
                          : 'Value',
                  },
                }
              )
            ),
            {
              layout: {
                mode: 'HORIZONTAL',
                width: 'FILL',
                height,
                gap: zero,
                align: 'MIN',
                justify: 'MIN',
                clipsContent: false,
              },
              fill:
                Treatment === 'Striped' && Role === 'Even'
                  ? 'color/neutral-25'
                  : null,
              stroke: grid || defaultBody ? 'color/neutral-400' : null,
              strokeAlign: defaultBody ? 'CENTER' : 'INSIDE',
              strokesIncludedInLayout: !defaultBody,
              bindings: {
                strokeLeftWeight: zero,
                strokeRightWeight: zero,
                strokeTopWeight: grid ? tableHalfBorder : zero,
                strokeBottomWeight: grid
                  ? tableHalfBorder
                  : defaultBody
                    ? tableBorder
                    : zero,
                paddingTop: defaultBody ? tableHalfBorder : zero,
                paddingBottom: defaultBody ? tableHalfBorder : zero,
              },
              fidelity:
                'Three shared equal columns with fixed source-measured short-content row height. Use a compatible measured preset for longer content; arbitrary column resizing and automatic row reflow are unsupported.',
            }
          )
        );
      })
    )
  );
  const tableVariants = ['Large', 'Small'].flatMap(Size =>
    ['Default', 'Striped', 'Border'].map(Treatment =>
      variant(
        `table.${Size.toLowerCase()}.${Treatment.toLowerCase()}`,
        {
          Size,
          Treatment,
          Content: 'Short',
        },
        frame(
          'mg-table',
          [0, 1, 2, 3, 4].map(index =>
            tableInstance(
              index === 0 ? 'mg-table__head' : `mg-table__body-row-${index}`,
              'table-row',
              {
                Size,
                Treatment,
                Role: index === 0 ? 'Header' : index % 2 ? 'Odd' : 'Even',
                Columns: 'Equal',
              },
              {
                layout: {
                  width: 'FILL',
                  height:
                    Treatment === 'Border' ||
                    (Treatment === 'Default' && index > 1)
                      ? tableHeights[Size].bordered
                      : Treatment === 'Default' && index === 1
                        ? tableHeights[Size].first
                        : tableHeights[Size].content,
                },
                ...(Treatment === 'Default' && index === 1
                  ? {
                      bindings: {
                        paddingTop: zero,
                      },
                    }
                  : {}),
              }
            )
          ),
          {
            layout: {
              mode: 'VERTICAL',
              width: 'FILL',
              height: 'HUG',
              gap: zero,
              clipsContent: false,
            },
            stroke: Treatment === 'Border' ? 'color/neutral-400' : null,
            bindings: {
              strokeWeight: Treatment === 'Border' ? tableHalfBorder : zero,
              paddingBottom: Treatment === 'Default' ? tableHalfBorder : zero,
            },
            fidelity:
              'TableTag three columns and four body rows. Equal columns match the measured short-content fixture. Fixed row heights can overflow after longer edits; use a compatible measured preset. Arbitrary column resizing, sorting, scrolling, stacking and HTML intrinsic sizing are unsupported.',
          }
        )
      )
    )
  );
  const tableReview = [];
  for (const {
    id,
    width,
    names,
    headerHeight,
    bodyHeight,
    firstHeight,
    Columns,
    outerWidth,
  } of tableSpecimens) {
    // Geometry belongs on masters. Figma ignores some width/height writes to
    // descendants of nested instances even though a permissive mock accepts them.
    for (const Role of ['Header', 'Odd', 'Even']) {
      const entry = JSON.parse(
        JSON.stringify(
          tableRows.find(
            row =>
              row.properties.Size === 'Large' &&
              row.properties.Treatment === 'Default' &&
              row.properties.Role === Role &&
              row.properties.Columns === 'Equal'
          )
        )
      );
      entry.id = `table-row.large.default.${Role.toLowerCase()}.${Columns.toLowerCase()}`;
      entry.properties.Columns = Columns;
      entry.name = Object.entries(entry.properties)
        .map(([key, val]) => `${key}=${val}`)
        .join(', ');
      entry.tree.layout.width = outerWidth;
      entry.tree.layout.height = 'HUG';
      entry.tree.layout.minHeight =
        Role === 'Header' ? headerHeight : bodyHeight;
      entry.tree.children.forEach((cell, column) => {
        cell.layout.width = names[column];
        cell.layout.height = 'HUG';
        cell.overrides.Label =
          Role === 'Header'
            ? 'Table header'
            : column < 2
              ? 'Content Goes Here'
              : 'In publishing and graphic design, dummy is a placeholder text commonly used to demonstrate';
      });
      entry.tree.fidelity =
        'Measured English source-column preset. Row and cells hug content, with the browser row height as a Figma minimum. Native text metrics and line breaking can grow the row beyond the browser baseline. Arbitrary column resizing and HTML automatic column sizing are unsupported; nested geometry overrides are not a reliable repair.';
      tableRows.push(entry);
    }
    const tableEntry = JSON.parse(
      JSON.stringify(
        tableVariants.find(
          table =>
            table.properties.Size === 'Large' &&
            table.properties.Treatment === 'Default' &&
            table.properties.Content === 'Short'
        )
      )
    );
    tableEntry.id = `table.large.default.${Columns.toLowerCase()}`;
    tableEntry.properties.Content = Columns;
    tableEntry.name = Object.entries(tableEntry.properties)
      .map(([key, val]) => `${key}=${val}`)
      .join(', ');
    tableEntry.tree.layout.width = outerWidth;
    tableEntry.tree.children.forEach((row, index) => {
      row.variant.Columns = Columns;
      row.layout.height = 'HUG';
      row.layout.minHeight =
        index === 0 ? headerHeight : index === 1 ? firstHeight : bodyHeight;
    });
    tableEntry.tree.fidelity =
      'Linked TableTag English source-column preset. Row masters define shared column geometry and grow with native text above measured browser minimum heights. Text remains editable; native wrapping and total height can differ from the browser. Arbitrary column resizing and HTML automatic column sizing are unsupported.';
    tableVariants.push(tableEntry);
    const nodes = [];
    for (let row = 0; row < 5; row++) {
      const rowName =
        row === 0 ? 'mg-table__head' : `mg-table__body-row-${row}`;
      for (let column = 0; column < 3; column++)
        nodes.push({
          path: [rowName, `mg-table__cell-${column + 1}`],
          properties: {
            Label:
              row === 0
                ? 'Table header'
                : column < 2
                  ? 'Content Goes Here'
                  : 'In publishing and graphic design, dummy is a placeholder text commonly used to demonstrate',
          },
        });
    }
    tableReview.push({
      id,
      name:
        id === 'long-content'
          ? 'Source story content, 720px'
          : 'Source story content, 240px region with native minimum overflow',
      variant: {
        Size: 'Large',
        Treatment: 'Default',
        Content: Columns,
      },
      width,
      properties: {},
      nodes,
      ...(width === 240
        ? {
            instanceWidth: outerWidth,
          }
        : {}),
    });
  }
  const families = [
    family(
      'button',
      'Mangrove/Button',
      sources.button,
      /\.mg-button \{/,
      buttons,
      {
        review: {
          responsiveLabel: true,
        },
      }
    ),
    family(
      'text-input',
      'Mangrove/Text input',
      sources.input,
      /%mg-form-input-base/,
      inputs,
      {
        optionalProperties: {
          'Show label': {
            nodeName: 'mg-form-label',
            defaultValue: true,
          },
          'Show help': {
            nodeName: 'mg-form-help',
            defaultValue: true,
          },
          Required: {
            nodeName: 'mg-form-label--required',
            defaultValue: false,
          },
        },
      }
    ),
    family(
      'combobox-option',
      'Mangrove/ComboBox option',
      sources.combo,
      /\.mg-combobox__option \{/,
      options
    ),
    family(
      'combobox',
      'Mangrove/ComboBox',
      sources.combo,
      /\.mg-combobox \{/,
      combos,
      {
        optionalProperties: {
          'Show label': {
            nodeName: 'mg-combobox__label',
            defaultValue: true,
          },
          'Show help': {
            nodeName: 'mg-form-help',
            defaultValue: false,
          },
          Required: {
            nodeName: 'mg-form-label--required',
            defaultValue: false,
          },
        },
      }
    ),
    family(
      'tabs-trigger',
      'Mangrove/Tab trigger',
      sources.tabs,
      /\.mg-tabs--horizontal \{/,
      triggers
    ),
    family(
      'tabs',
      'Mangrove/Tabs',
      sources.tabs,
      /\.mg-tabs--horizontal \{/,
      [rail],
      {
        review: {
          longLabelTarget: ['mg-tabs__item-1'],
        },
      }
    ),
    family(
      'textarea',
      'Mangrove/Textarea',
      sources.input,
      /\.mg-form-textarea \{/,
      textareas,
      {
        review: {
          specimens: [
            {
              id: 'multiline',
              name: 'Multiline value, 240px, overflow specimen',
              variant: {
                State: 'Filled',
              },
              width: 240,
              properties: {
                Value:
                  'First line\nSecond line with enough words to wrap within this narrow field\nThird line\nFourth line\nFifth line\nSixth line',
                Required: true,
              },
            },
          ],
        },
        optionalProperties: {
          'Show label': {
            nodeName: 'mg-form-label',
            defaultValue: true,
          },
          'Show help': {
            nodeName: 'mg-form-help',
            defaultValue: true,
          },
          'Show error': {
            nodeName: 'mg-form-error',
            defaultValue: true,
          },
          Required: {
            nodeName: 'mg-form-label--required',
            defaultValue: false,
          },
        },
      }
    ),
  ];
  families.push(
    family(
      'table-header-cell',
      'Mangrove/Table header cell',
      sources.table,
      /\.mg-table thead tr th \{/,
      tableCells('Header')
    ),
    family(
      'table-body-cell',
      'Mangrove/Table body cell',
      sources.table,
      /\.mg-table td \{/,
      tableCells('Body')
    ),
    family(
      'table-row',
      'Mangrove/Table row',
      sources.table,
      /\.mg-table tbody tr \{/,
      tableRows,
      {
        review: {
          genericLabels: false,
          width: 720,
        },
      }
    ),
    family(
      'table',
      'Mangrove/Table',
      sources.tableJsx,
      /export const TableTag/,
      tableVariants,
      {
        review: {
          genericLabels: false,
          width: 720,
          specimens: tableReview,
        },
      }
    )
  );
  families.push(
    ...require('./figma-cta-recipes.cjs').buildTextCtaRecipes({
      root,
      modes,
      variables,
      styles,
    })
  );
  families.push(
    ...require('./figma-choice-recipes.cjs').buildChoiceRecipes({
      root,
      modes,
      variables,
      styles,
    })
  );
  families.push(
    ...require('./figma-checkbox-recipes.cjs').buildCheckboxRecipes({
      root,
      modes,
      variables,
      styles,
    })
  );
  families.push(
    ...require('./figma-form-summary-recipes.cjs').buildFormSummaryRecipes({
      root,
      modes,
      variables,
      styles,
    })
  );
  families.push(
    ...require('./figma-switch-recipes.cjs').buildSwitchRecipes({
      root,
      modes,
      variables,
      styles,
    })
  );
  families.push(
    ...require('./figma-editorial-cta-recipes.cjs').buildEditorialCtaRecipes({
      root,
      modes,
      variables,
      styles,
    })
  );
  families.push(
    ...require('./figma-card-hero-recipes.cjs').buildCardHeroRecipes({
      root,
      modes,
      variables,
      styles,
    })
  );
  families.push(
    ...require('./figma-chip-recipes.cjs').buildChipRecipes({
      root,
      modes,
      variables,
      styles,
    })
  );
  families.push(
    ...require('./figma-details-recipes.cjs').buildDetailsRecipes({
      root,
      modes,
      variables,
      styles,
    })
  );
  families.push(
    ...require('./figma-select-recipes.cjs').buildSelectRecipes({
      root,
      modes,
      variables,
      styles,
    })
  );
  families.push(
    ...require('./figma-loader-recipes.cjs').buildLoaderRecipes({
      root,
      modes,
      variables,
    })
  );
  families.push(
    ...require('./figma-empty-state-recipes.cjs').buildEmptyStateRecipes({
      root,
      modes,
      variables,
      styles,
    })
  );
  families.push(
    ...require('./figma-toc-recipes.cjs').buildTocRecipes({
      root,
      modes,
      variables,
      styles,
    })
  );
  families.push(
    ...require('./figma-status-label-recipes.cjs').buildStatusLabelRecipes({
      root,
      modes,
      variables,
      styles,
    })
  );
  families.push(
    ...require('./figma-segmented-recipes.cjs').buildSegmentedRecipes({
      root,
      modes,
      variables,
      styles,
    })
  );
  families.push(
    ...require('./figma-segmented-wrapper-recipes.cjs').buildSegmentedWrapperRecipes(
      {
        root,
        modes,
        variables,
        styles,
        families,
      }
    )
  );
  for (const variable of variables) byName.set(variable.name, variable);
  function validate(node, component, entry) {
    const names = [
      node.fill,
      node.stroke,
      ...Object.values(node.bindings || {}),
      node.layout?.gap,
      node.layout?.counterGap,
      ...Object.values(node.appearance || {}),
      node.layout?.padding?.block,
      node.layout?.padding?.inline,
      node.layout?.minHeight,
      node.layout?.maxHeight,
      node.layout?.maxWidth,
    ].filter(Boolean);
    if (node.focusRing) {
      const ring = node.focusRing;
      if (ring.renderer !== undefined) {
        const cornerFields = [
          'topLeftRadius',
          'topRightRadius',
          'bottomLeftRadius',
          'bottomRightRadius',
        ];
        const allowed = [
          'renderer',
          'color',
          'separatorColor',
          'offset',
          'width',
          'outerStroke',
          'cornerBindings',
        ];
        if (
          ring.renderer !== 'COINCIDENT_SCALE' ||
          component.id !== 'segmented-control.segment' ||
          node !== entry.tree ||
          node.type !== 'FRAME' ||
          !['Focus', 'HoverFocus'].includes(entry.properties.State) ||
          Object.keys(ring).length !== allowed.length ||
          Object.keys(ring).some(key => !allowed.includes(key)) ||
          !ring.cornerBindings ||
          Object.keys(ring.cornerBindings).length !== 4 ||
          !cornerFields.every(
            field =>
              ring.cornerBindings[field] === node.bindings?.[field] &&
              byName.get(ring.cornerBindings[field])?.type === 'FLOAT'
          )
        )
          throw new Error(`Unsupported source focus renderer at ${node.name}`);
        for (const field of [
          'color',
          'separatorColor',
          'offset',
          'width',
          'outerStroke',
        ]) {
          const type = ['color', 'separatorColor'].includes(field)
            ? 'COLOR'
            : 'FLOAT';
          if (byName.get(ring[field])?.type !== type)
            throw new Error(`Invalid ${type} focus role at ${node.name}`);
        }
        for (const mode of modes) {
          const offset = value(ring.offset, mode);
          const width = value(ring.width, mode);
          const sum = value(ring.outerStroke, mode);
          if (
            !Number.isFinite(offset) ||
            offset <= 0 ||
            !Number.isFinite(width) ||
            width <= 0 ||
            sum !== offset + width
          )
            throw new Error(
              `Invalid source focus sum at ${node.name} in ${mode.id}`
            );
        }
        names.push(
          ring.color,
          ring.separatorColor,
          ring.offset,
          ring.width,
          ring.outerStroke,
          ...Object.values(ring.cornerBindings)
        );
      } else names.push(...Object.values(ring));
    }
    if (node.absolute) names.push(node.absolute.offsetX, node.absolute.offsetY);
    for (const field of ['width', 'height'])
      if (
        typeof node.layout?.[field] === 'string' &&
        node.layout[field].includes('/')
      )
        names.push(node.layout[field]);
    for (const name of names)
      if (!byName.has(name))
        throw new Error(
          `Recipe ${node.name} references missing variable ${name}`
        );
    if (
      node.textStyle &&
      !styles.text.some(style => style.id === node.textStyle)
    )
      throw new Error(`Missing component text style ${node.textStyle}`);
    if (
      node.effectStyle &&
      !styles.effect.some(style => style.id === node.effectStyle)
    )
      throw new Error(`Missing component effect style ${node.effectStyle}`);
    for (const child of node.children || []) validate(child, component, entry);
  }
  function identity(node, parent = '') {
    node.id = parent ? `${parent}/${node.name}` : node.name;
    for (const child of node.children || []) identity(child, node.id);
  }
  for (const component of families)
    for (const entry of component.variants) {
      identity(entry.tree);
      validate(entry.tree, component, entry);
    }
  return {
    version: 1,
    families,
    limitations: [
      'Latin script and left-to-right scaffold. Arabic font routing and mirrored logical corners remain pending.',
      'Chromium source comparison confirmed bundled Bold 700 for CSS 600. Identical Figma font-file versions remain unverified.',
      'Filled TextInput and Textarea use component/text-input/browser-fieldtext, a literal #000000 helper for the measured Chromium baseline. Mangrove color/black is #1a1a1a and cannot represent that observation. Source does not declare an input colour role; system-colour and other-browser parity remain unverified.',
      'Textarea represents the default JSX row count using a source-derived initial height. Chromium row quantization, native scrollbars, vertical resize handle and resize behaviour are not reproduced.',
      'Required field labels use a separate marker layer. Narrow multiline labels do not reproduce the source inline ::after flow yet.',
      'Table models TableTag three-column, four-row specimens with Equal/Story/NarrowStory column presets on Row masters. Equal short-content rows remain fixed and longer edits can overflow. Story/NarrowStory Default rows and cells hug text above measured browser minimum heights; native line breaking differs from the browser and can grow rows. Arbitrary native column resizing and HTML automatic column sizing are unsupported; nested review geometry writes were ignored in real Figma. Dated long/narrow examples use linked measured English source-column masters, including minimum-content overflow outside a 240px region. Responsive stacking/scrolling and separate data-table selectors remain outside this scaffold.',
      'ComboBox popover is a specimen in flow; runtime overlay position, viewport cap and behaviour are not reproduced.',
      'Transparent resets, glyphs and source literals have no invented brand overrides.',
    ],
  };
}
module.exports = {
  buildComponentRecipes,
};
