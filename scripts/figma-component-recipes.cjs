/** Source-backed native Figma recipes. Values belong here, not in the plugin. */
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

function buildComponentRecipes({ root, modes, variables, styles }) {
  const sources = {
    button: 'stories/Components/Buttons/CtaButton/cta-button.scss',
    input: 'stories/Components/Forms/_form-base.scss',
    combo: 'stories/assets/scss/aria/_combo-box.scss',
    tabs: 'stories/Components/Tab/tab.scss',
    tabRoles: 'stories/assets/scss/_tokens-tabs.scss',
    mixins: 'stories/assets/scss/_mixins.scss',
    body: 'stories/assets/scss/_foundational.scss',
    normalize: 'stories/Utilities/Normalize/normalize.scss',
    tokens: 'tokens/mangrove.yaml',
  };
  const files = new Map();
  const read = file => {
    if (!files.has(file))
      files.set(file, fs.readFileSync(path.join(root, file), 'utf8'));
    return files.get(file);
  };
  function source(file, pattern) {
    const match = pattern.exec(read(file));
    if (!match)
      throw new Error(
        `Figma component recipe needs updating: ${file} no longer matches ${pattern}`
      );
    return {
      file,
      line: read(file).slice(0, match.index).split('\n').length,
      match,
    };
  }
  function reference(file, pattern) {
    const { match, ...ref } = source(file, pattern);
    return ref;
  }
  const byName = new Map(variables.map(variable => [variable.name, variable]));
  const cssNames = new Map(
    variables.map(variable => [
      `--mg-${variable.id.replaceAll('.', '-')}`,
      variable.name,
    ])
  );
  function value(name, mode, visited = new Set()) {
    if (visited.has(name))
      throw new Error(`Circular Figma recipe alias: ${name}`);
    visited.add(name);
    const variable = byName.get(name);
    if (!variable) throw new Error(`Missing recipe variable ${name}`);
    const literal = variable.values[mode.id];
    if (literal == null) throw new Error(`Missing ${name} value in ${mode.id}`);
    return literal.alias ? value(literal.alias, mode, visited) : literal;
  }
  function addVariable(name, type, values, description, ref, codeSyntax = {}) {
    if (byName.has(name)) return name;
    const variable = {
      id: name.replaceAll('/', '.'),
      name,
      type,
      description,
      source: ref,
      scopes:
        type === 'COLOR'
          ? ['ALL_SCOPES']
          : /opacity/.test(name)
            ? ['OPACITY']
            : /radius/.test(name)
              ? ['CORNER_RADIUS']
              : /border-width/.test(name)
                ? ['STROKE_FLOAT']
                : ['ALL_SCOPES'],
      hiddenFromPublishing: false,
      codeSyntax,
      values,
    };
    variables.push(variable);
    byName.set(name, variable);
    cssNames.set(`--mg-${variable.id.replaceAll('.', '-')}`, name);
    return name;
  }
  const perMode = get =>
    Object.fromEntries(modes.map(mode => [mode.id, get(mode)]));
  function constant(name, number, description, ref) {
    return addVariable(
      `component/${name}`,
      'FLOAT',
      perMode(() => number),
      description,
      ref
    );
  }
  function literal(file, pattern, name, description, scale = 1) {
    const found = source(file, pattern);
    return constant(name, Number(found.match[1]) * scale, description, {
      file,
      line: found.line,
    });
  }

  // Only the expression grammar actually used by _tokens-tabs.scss is supported.
  // Unsupported expressions fail visibly instead of preserving stale recipes.
  function resolveExpression(expression, mode) {
    const text = expression.trim();
    const rgb = /^rgb\(var\((--mg-[\w-]+)\)(?:\s*\/\s*([\d.]+))?\)$/.exec(text);
    if (rgb) {
      const target = cssNames.get(rgb[1]);
      if (!target) throw new Error(`Unknown tab colour reference ${rgb[1]}`);
      const color = value(target, mode);
      if (typeof color !== 'object' || !('r' in color))
        throw new Error(`Tab role is not a colour: ${target}`);
      return rgb[2] == null
        ? { alias: target }
        : { ...color, a: Number(rgb[2]) };
    }
    const alias = /^var\((--mg-[\w-]+)\)$/.exec(text);
    if (alias) {
      const target = cssNames.get(alias[1]);
      if (!target) throw new Error(`Unknown tab reference ${alias[1]}`);
      return { alias: target };
    }
    let numeric = text.replace(/var\((--mg-[\w-]+)\)/g, (_, css) => {
      const target = cssNames.get(css);
      const resolved = target && value(target, mode);
      if (typeof resolved !== 'number')
        throw new Error(`Expected numeric tab reference ${css}`);
      return String(resolved);
    });
    numeric = numeric.replace(/calc\(([^()]+)\)/g, (_, calculation) =>
      String(sum(calculation))
    );
    const max = /^max\(([^()]+)\)$/.exec(numeric);
    if (max) return Math.max(...max[1].split(',').map(sum));
    return sum(numeric);
  }
  function sum(expression) {
    const terms = expression.trim().split(/\s*\+\s*/);
    return terms.reduce((total, term) => {
      const match = /^(-?[\d.]+)(px|rem)?$/.exec(term.trim());
      if (!match)
        throw new Error(`Unsupported Figma numeric expression: ${expression}`);
      return total + Number(match[1]) * (match[2] === 'rem' ? 16 : 1);
    }, 0);
  }
  const roles = [
    ...read(sources.tabRoles).matchAll(/(--mg-tab[\w-]*):\s*([^;]+);/g),
  ];
  if (roles.length !== 14)
    throw new Error('Tab role declarations changed: update the Figma recipe.');
  for (const [declaration, css, expression] of roles) {
    const name = `tab/${css.slice('--mg-tab-'.length)}`;
    const values = perMode(mode => resolveExpression(expression, mode));
    const first = values[modes[0].id];
    const resolved = first.alias ? value(first.alias, modes[0]) : first;
    addVariable(
      name,
      typeof resolved === 'number' ? 'FLOAT' : 'COLOR',
      values,
      `Horizontal tab role from ${sources.tabRoles}.`,
      reference(sources.tabRoles, new RegExp(css + ':')),
      { WEB: `var(${css})` }
    );
    if (!declaration) throw new Error('Empty tab role declaration.');
  }
  const railRadius = addVariable(
    'component/tabs/rail-radius',
    'FLOAT',
    perMode(
      mode => value('tab/radius', mode) + value('tab/rail-padding', mode)
    ),
    'Horizontal rail radius: tab radius plus rail padding.',
    reference(
      sources.tabs,
      /border-radius: calc\(var\(--mg-tab-radius\) \+ var\(--mg-tab-rail-padding\)\)/
    ),
    { WEB: 'calc(var(--mg-tab-radius) + var(--mg-tab-rail-padding))' }
  );
  const railBorder = literal(
    sources.tabs,
    /border: ([\d.]+)px solid var\(--mg-tab-rail-border\)/,
    'tabs/border-width',
    'Source literal border width of the horizontal tab rail.'
  );
  source(
    sources.tabs,
    /background: transparent;\s*border: 1px solid transparent;\s*border-radius: var\(--mg-tab-radius\)/
  );
  source(
    sources.tabs,
    /padding: var\(--mg-spacing-75\) var\(--mg-spacing-150\)/
  );
  const comboWidth = literal(
    sources.combo,
    /max-inline-size: ([\d.]+)rem/,
    'combobox/max-width',
    'Source max inline size of mg-combobox.',
    16
  );
  const triggerWidth = literal(
    sources.combo,
    /min-inline-size: ([\d.]+)rem/,
    'combobox/trigger-width',
    'Source minimum inline size of mg-combobox__trigger.',
    16
  );
  const comboOpacity = literal(
    sources.combo,
    /\.mg-combobox\[data-disabled\]\s*\{\s*opacity: ([\d.]+)/,
    'combobox/disabled-opacity',
    'Source disabled opacity of the whole ComboBox.'
  );
  const popoverHeight = literal(
    sources.combo,
    /max-block-size: min\(([\d.]+)rem, 60vh\)/,
    'combobox/popover-max-height',
    'Source 20rem cap. Actual source also limits to 60vh.',
    16
  );
  const popoverBorder = literal(
    sources.combo,
    /border: ([\d.]+)px solid var\(--mg-control-border\)/,
    'combobox/popover-border-width',
    'Source literal popover border width.'
  );
  const zero = constant(
    'geometry/zero',
    0,
    'No gap, padding, border or radius where the source explicitly resets it.',
    reference(sources.combo, /border-inline-start: 0/)
  );
  const transparent = addVariable(
    'component/color/transparent',
    'COLOR',
    perMode(() => ({ r: 0, g: 0, b: 0, a: 0 })),
    'Source transparent paint. Keep a transparent stroke where the CSS border occupies space.',
    reference(
      sources.button,
      /\.mg-button\.disabled \{\s*border-color: transparent/
    )
  );
  source(sources.combo, /font: inherit/);
  source(sources.input, /font-size: var\(--mg-font-size-form-input\)/);
  source(sources.combo, /padding: var\(--mg-form-input-padding\)/);
  source(
    'stories/Components/Forms/ComboBox/ComboBox.jsx',
    /<span aria-hidden="true">▾<\/span>/
  );

  const buttonWeight = Number(
    source(sources.button, /font-weight: ([\d.]+)/).match[1]
  );
  const tabWeight = Number(
    source(sources.tabs, /font-weight: ([\d.]+)/).match[1]
  );
  const optionWeight = Number(
    source(sources.combo, /\[data-selected\]\s*\{[^}]*font-weight: ([\d.]+)/)
      .match[1]
  );
  if ([buttonWeight, tabWeight, optionWeight].some(weight => weight !== 600)) {
    throw new Error(
      'Component requested weights changed: update bundled font matching.'
    );
  }
  const buttonLineHeight = Number(
    source(sources.button, /line-height: ([\d.]+)/).match[1]
  );
  const tabLineHeight = Number(
    source(sources.tabs, /line-height: ([\d.]+)/).match[1]
  );
  const yaml = YAML.parse(read(sources.tokens));
  const bodyLine = yaml['font-line-height']['700'].$value;
  if (!/^[\d.]+em$/.test(bodyLine))
    throw new Error(
      'Body line-height source changed: update Figma component styles.'
    );
  source(sources.body, /line-height: var\(--mg-font-line-height-700\)/);
  source(sources.body, /body \{[^}]*font-size: var\(--mg-font-size-300\)/);
  const bodyLineHeight = Number(bodyLine.slice(0, -2));
  const inputLineHeight = Number(
    source(
      sources.normalize,
      /button,\s*input,\s*optgroup,\s*select,\s*textarea\s*\{[^}]*line-height: ([\d.]+)\s*;/
    ).match[1]
  );
  source(
    'stories/assets/scss/_components.scss',
    /@import "\.\.\/\.\.\/Utilities\/Normalize\/normalize";/
  );

  function textStyle(id, role, size, weight, lineHeight, ref) {
    const bold = weight === 600;
    const inheritsBody = ![
      'component.button',
      'component.tab',
      'component.input',
    ].includes(id);
    if (bold) {
      const folder = role === 'ui' ? 'roboto-condensed' : 'roboto';
      const entry = `stories/assets/fonts/${folder}/${folder}.scss`;
      source(entry, /@import "sass\/Bold"/);
      if (/SemiBold|Semibold/.test(read(entry)))
        throw new Error(`Bundled font matching changed in ${entry}`);
      source(
        `stories/assets/fonts/${folder}/sass/_Bold.scss`,
        /font-weight: 700/
      );
    }
    const definition = {
      id,
      name: `Mangrove/component/${id.slice('component.'.length).replaceAll('.', '/')}`,
      recommended: false,
      component: true,
      source: ref,
      description:
        `Component typography. CSS requests weight ${weight}; ` +
        (bold
          ? 'bundled CSS has no 600 face; Chromium rendered the bundled Bold 700 face in the 3 October 2026 source comparison. Figma font-file equivalence remains unverified. '
          : 'Regular 400. ') +
        (inheritsBody
          ? 'Line height is the computed body length (body font-size 300 times its em ratio), inherited without rescaling small text. '
          : `Explicit line height ${Number((lineHeight * 100).toFixed(6))}%. `) +
        (id === 'component.input'
          ? 'TextInput retains the vendored Normalize line-height ratio; ComboBox separately resets font to inherit. '
          : '') +
        'Latin script only.',
      typography: {
        requestedWeight: weight,
        bundledWeight: bold ? 700 : 400,
        lineHeightRatio: lineHeight,
        lineHeightBasis: inheritsBody
          ? 'computed-body-length'
          : 'own-font-size',
        verification: bold
          ? 'Bundled Bold face observed with Chromium CSS.getPlatformFontsForNode on 3 October 2026; Figma font-file equivalence unverified.'
          : id === 'component.input'
            ? 'Normalize ratio observed in computed Chromium styles on 3 October 2026.'
            : 'Explicit source role and body line-height default.',
      },
      bindings: {
        fontFamily: `font-family/${role}`,
        fontSize: `font-size/${size}`,
      },
      values: perMode(mode => ({
        fontName: {
          family: value(`font-family/${role}`, mode),
          style: bold ? 'Bold' : 'Regular',
        },
        fontSize: value(`font-size/${size}`, mode),
        lineHeight: inheritsBody
          ? {
              unit: 'PIXELS',
              value: value('font-size/300', mode) * bodyLineHeight,
            }
          : {
              unit: 'PERCENT',
              value: Number((lineHeight * 100).toFixed(6)),
            },
      })),
    };
    const existing = styles.text.findIndex(style => style.id === id);
    if (existing === -1) styles.text.push(definition);
    else styles.text[existing] = definition;
    return id;
  }
  const typography = {
    button: textStyle(
      'component.button',
      'text',
      'button',
      buttonWeight,
      buttonLineHeight,
      reference(sources.button, /font-family:/)
    ),
    input: textStyle(
      'component.input',
      'text',
      'form-input',
      400,
      inputLineHeight,
      reference(
        sources.normalize,
        /button,\s*input,\s*optgroup,\s*select,\s*textarea\s*\{/
      )
    ),
    body: textStyle(
      'component.body',
      'text',
      '300',
      400,
      bodyLineHeight,
      reference(sources.body, /body \{/)
    ),
    help: textStyle(
      'component.help',
      'text',
      '200',
      400,
      bodyLineHeight,
      reference(sources.input, /\.mg-form-help \{/)
    ),
    error: textStyle(
      'component.error',
      'text',
      '300',
      400,
      bodyLineHeight,
      reference(sources.input, /\.mg-form-error \{/)
    ),
    option: textStyle(
      'component.option-selected',
      'text',
      '300',
      optionWeight,
      bodyLineHeight,
      reference(sources.combo, /\[data-selected\]/)
    ),
    tab: textStyle(
      'component.tab',
      'ui',
      'tab',
      tabWeight,
      tabLineHeight,
      reference(sources.tabs, /\.mg-tabs__link \{/)
    ),
  };
  source(sources.mixins, /@mixin mg-focus-ring-inset/);
  source(
    sources.mixins,
    /inset 0 0 0 var\(--mg-focus-ring-offset\) rgb\(var\(--mg-color-neutral-0\)\)/
  );
  source(
    sources.mixins,
    /inset 0 0 0 calc\(var\(--mg-focus-ring-offset\) \+ var\(--mg-focus-ring-width\)\)/
  );
  const insetStyle = {
    id: 'focus-ring-inset',
    name: 'Mangrove/focus-ring-inset',
    component: true,
    source: reference(sources.mixins, /@mixin mg-focus-ring-inset/),
    description:
      'mg-focus-ring-inset. Coloured inward band followed by the neutral separator. Paint order inferred from outward diagnostics; inward rendering still needs verification.',
    values: perMode(mode =>
      ['color/neutral-0', 'color/focus-ring']
        .map((color, index) => ({
          effect: {
            type: 'INNER_SHADOW',
            color: value(color, mode),
            offset: { x: 0, y: 0 },
            radius: 0,
            spread: value(
              index
                ? 'effect-size/focus-ring/outer-spread'
                : 'focus-ring/offset',
              mode
            ),
            visible: true,
            blendMode: 'NORMAL',
          },
          bindings: {
            color,
            spread: index
              ? 'effect-size/focus-ring/outer-spread'
              : 'focus-ring/offset',
          },
        }))
        .reverse()
    ),
  };
  const existingInset = styles.effect.findIndex(
    style => style.id === insetStyle.id
  );
  if (existingInset === -1) styles.effect.push(insetStyle);
  else styles.effect[existingInset] = insetStyle;

  const frame = (name, children, extra = {}) => ({
    type: 'FRAME',
    name,
    layout: { mode: 'VERTICAL', width: 'FILL', height: 'HUG', gap: zero },
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
    layout: { width: 'HUG', height: 'HUG' },
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

  const buttonOuterRadius = addVariable(
    'focus-ring/outer-radius-button',
    'FLOAT',
    perMode(
      mode => value('radius/button', mode) + value('focus-ring/offset', mode)
    ),
    'Native outline focus approximation: expanded gold boundary radius equals the button radius plus the neutral separator extent. Follows brand changes without rebuilding.',
    reference(sources.mixins, /outline-offset: var\(--mg-focus-ring-offset\)/),
    { WEB: 'calc(var(--mg-radius-button) + var(--mg-focus-ring-offset))' }
  );
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
            { Emphasis, Treatment, State },
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
        layout: { mode: 'HORIZONTAL', width: 'HUG', height: 'HUG', gap: zero },
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
                'color/black'
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
      { State },
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

  const options = [];
  for (const Selected of ['False', 'True'])
    for (const State of ['Default', 'Hover', 'FocusVisible']) {
      const selected = Selected === 'True';
      options.push(
        variant(
          `combobox-option.${Selected.toLowerCase()}.${State.toLowerCase()}`,
          { Selected, State },
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
                padding: { block: 'spacing/100', inline: 'spacing/100' },
              },
              bindings: { cornerRadius: 'radius/form-input' },
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
            overrides: { Label },
            layout: { width: 'FILL', height: 'HUG' },
          })),
          {
            layout: {
              mode: 'VERTICAL',
              width: 'FILL',
              height: 'HUG',
              maxHeight: popoverHeight,
              gap: zero,
              padding: { block: 'spacing/25', inline: 'spacing/25' },
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
      { State },
      frame('mg-combobox', children, {
        layout: {
          mode: 'VERTICAL',
          width: 'FILL',
          height: 'HUG',
          maxWidth: comboWidth,
          gap: 'spacing/25',
        },
        bindings: State === 'Disabled' ? { opacity: comboOpacity } : {},
        fidelity:
          'Latin, left-to-right scaffold. Start and end corners must be mirrored for right-to-left.',
      })
    );
  });

  const tabOuterRadius = addVariable(
    'focus-ring/outer-radius-tab',
    'FLOAT',
    perMode(
      mode => value('tab/radius', mode) + value('focus-ring/offset', mode)
    ),
    'Native pill-tab focus approximation: expanded gold boundary radius equals the horizontal tab radius plus the neutral separator extent. Opaque strokes preserve focus independently of translucent or absent tab fill.',
    reference(sources.mixins, /outline-offset: var\(--mg-focus-ring-offset\)/),
    { WEB: 'calc(var(--mg-tab-radius) + var(--mg-focus-ring-offset))' }
  );
  const triggers = [];
  for (const Selected of ['False', 'True'])
    for (const State of ['Default', 'Hover', 'Focus']) {
      const selected = Selected === 'True';
      triggers.push(
        variant(
          `tabs-trigger.${Selected.toLowerCase()}.${State.toLowerCase()}`,
          { Selected, State },
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
                padding: { block: 'spacing/75', inline: 'spacing/150' },
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
    { Layout: 'Horizontal' },
    frame(
      'mg-tabs__rail',
      ['Overview', 'Resources', 'Related'].map((Label, i) => ({
        type: 'INSTANCE',
        expose: true,
        family: 'tabs-trigger',
        name: `mg-tabs__item-${i + 1}`,
        variant: { Selected: i === 0 ? 'True' : 'False', State: 'Default' },
        overrides: { Label },
        layout: { width: 'HUG', height: 'HUG' },
      })),
      {
        layout: {
          mode: 'HORIZONTAL',
          width: 'HUG',
          height: 'HUG',
          gap: 'tab/rail-gap',
          padding: { block: 'tab/rail-padding', inline: 'tab/rail-padding' },
        },
        bindings: { cornerRadius: railRadius, strokeWeight: railBorder },
        fill: 'tab/rail-background',
        stroke: 'tab/rail-border',
        fidelity:
          'Horizontal rail only. Panel content, overflow fades and responsive stacked disclosures are later scaffolds.',
      }
    )
  );

  const families = [
    family(
      'button',
      'Mangrove/Button',
      sources.button,
      /\.mg-button \{/,
      buttons,
      { review: { responsiveLabel: true } }
    ),
    family(
      'text-input',
      'Mangrove/Text input',
      sources.input,
      /%mg-form-input-base/,
      inputs,
      {
        optionalProperties: {
          'Show label': { nodeName: 'mg-form-label', defaultValue: true },
          'Show help': { nodeName: 'mg-form-help', defaultValue: true },
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
          'Show label': { nodeName: 'mg-combobox__label', defaultValue: true },
          'Show help': { nodeName: 'mg-form-help', defaultValue: false },
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
        review: { longLabelTarget: ['mg-tabs__item-1'] },
      }
    ),
  ];
  function validate(node) {
    const names = [
      node.fill,
      node.stroke,
      ...Object.values(node.bindings || {}),
      node.layout?.gap,
      node.layout?.padding?.block,
      node.layout?.padding?.inline,
      node.layout?.minHeight,
      node.layout?.maxHeight,
      node.layout?.maxWidth,
    ].filter(Boolean);
    if (node.focusRing) names.push(...Object.values(node.focusRing));
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
    for (const child of node.children || []) validate(child);
  }
  function identity(node, parent = '') {
    node.id = parent ? `${parent}/${node.name}` : node.name;
    for (const child of node.children || []) identity(child, node.id);
  }
  for (const component of families)
    for (const entry of component.variants) {
      identity(entry.tree);
      validate(entry.tree);
    }
  return {
    version: 1,
    families,
    limitations: [
      'Latin script and left-to-right scaffold. Arabic font routing and mirrored logical corners remain pending.',
      'Chromium source comparison confirmed bundled Bold 700 for CSS 600. Identical Figma font-file versions remain unverified.',
      'Filled TextInput uses the measured Chromium black fieldtext baseline. Source does not declare an input colour role; system-colour and other-browser parity remain unverified.',
      'Required field labels use a separate marker layer. Narrow multiline labels do not reproduce the source inline ::after flow yet.',
      'ComboBox popover is a specimen in flow; runtime overlay position, viewport cap and behaviour are not reproduced.',
      'Transparent resets, glyphs and source literals have no invented brand overrides.',
    ],
  };
}

module.exports = { buildComponentRecipes };
