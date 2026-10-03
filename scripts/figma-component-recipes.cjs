/** Source-backed native Figma recipes. Values belong here, not in the plugin. */
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

function buildComponentRecipes({ root, modes, variables, styles }) {
  const sources = {
    button: 'stories/Components/Buttons/CtaButton/cta-button.scss',
    input: 'stories/Components/Forms/_form-base.scss',
    textarea: 'stories/Components/Forms/Textarea/Textarea.jsx',
    combo: 'stories/assets/scss/aria/_combo-box.scss',
    tabs: 'stories/Components/Tab/tab.scss',
    table: 'stories/Atom/Table/table.scss',
    tableJsx: 'stories/Atom/Table/Table.jsx',
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
    return constant(
      name,
      Number((Number(found.match[1]) * scale).toFixed(6)),
      description,
      { file, line: found.line }
    );
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
    'Source disabled opacity of the whole ComboBox, expressed as a Figma percentage.',
    100
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
  // Native inputs retain the browser's fieldtext system colour. This literal
  // records the measured Chromium baseline, not an authored Mangrove role.
  for (const pattern of [
    /%mg-form-input-base\s*\{/,
    /\.mg-form-input\s*\{/,
    /\.mg-form-textarea\s*\{/,
  ]) {
    const { match } = source(sources.input, pattern);
    const body = read(sources.input)
      .slice(match.index + match[0].length)
      .replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '');
    let depth = 1;
    let declarations = '';
    for (const character of body) {
      if (character === '{') depth++;
      else if (character === '}') depth--;
      else if (depth === 1) declarations += character;
      if (depth === 0) break;
    }
    if (depth !== 0) throw new Error('Native form source block is incomplete.');
    if (
      /(?:^|[;\n])\s*(?:color|font|font-weight|line-height)\s*:/.test(
        declarations
      )
    )
      throw new Error(
        'Native form control now overrides typography or value colour: update the measured browser baseline.'
      );
  }
  const inputFieldText = addVariable(
    'component/text-input/browser-fieldtext',
    'COLOR',
    perMode(() => ({ r: 0, g: 0, b: 0, a: 1 })),
    'Measured Chromium 153/macOS UNDRR fieldtext baseline on 3 October 2026: #000000. The form source has no authored value-colour declaration. This helper is not a Mangrove semantic role; other browsers and system colours remain unverified.',
    reference(sources.input, /%mg-form-input-base\s*\{/)
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
  const textareaRows = Number(
    source(sources.textarea, /rows = (\d+),\s*cols/).match[1]
  );
  if (textareaRows < 1)
    throw new Error('Textarea default rows must be positive.');
  source(sources.textarea, /rows=\{rows\}/);
  source(
    sources.textarea,
    /disabled && 'mg-form-textarea--disabled',\s*error && 'mg-form-textarea--error'/
  );
  source(sources.textarea, /\{error && errorText && \(/);
  source(
    sources.input,
    /\.mg-form-textarea \{\s*@extend %mg-form-input-base;\s*height: auto;\s*max-width: 100%;\s*resize: vertical;/
  );
  source(
    sources.input,
    /&\[placeholder\]:not\(:placeholder-shown\) \{\s*background-color: var\(--mg-form-input-background--focus\);\s*\}/
  );
  source(
    sources.input,
    /%mg-form-input-base \{[\s\S]*?&::placeholder \{\s*color: rgb\(var\(--mg-color-neutral-500\)\);\s*\}/
  );
  source(
    sources.input,
    /&:focus-visible \{\s*background-color: var\(--mg-form-input-background--focus\);\s*border-color: rgb\(var\(--mg-color-form-focus\)\);\s*@include mg-focus-ring;\s*\}/
  );
  source(
    sources.input,
    /\.mg-form-textarea \{\s*@extend %mg-form-input-base;\s*height: auto;\s*max-width: 100%;\s*resize: vertical;\s*&--disabled \{\s*background-color: rgb\(var\(--mg-color-white\)\);\s*border-color: rgb\(var\(--mg-color-neutral-400\)\);\s*color: rgb\(var\(--mg-color-neutral-400\)\);\s*&::placeholder \{\s*color: rgb\(var\(--mg-color-neutral-400\)\);\s*\}\s*\}\s*&--error \{\s*border-color: rgb\(var\(--mg-color-red-900\)\);\s*\}\s*\}/
  );
  const textareaBlockSize = addVariable(
    'component/textarea/default-block-size',
    'FLOAT',
    perMode(mode =>
      Number(
        (
          textareaRows * value('font-size/form-input', mode) * inputLineHeight +
          2 * value('form-input/padding', mode) +
          2 * value('form-input/border-width', mode)
        ).toFixed(6)
      )
    ),
    `${textareaRows} default JSX rows times Normalize line-height at the control font size, plus block padding and border. The UNDRR comparison on 3 October 2026 gave a source formula of 88.1px and Chromium 153/macOS measurement of 88.0625px because each row is quantized. CSS height is auto, not a fixed public token. Other native browser sizing remains unverified.`,
    reference(sources.textarea, /rows = (\d+),\s*cols/)
  );
  byName.get(textareaBlockSize).scopes = ['WIDTH_HEIGHT'];

  function textStyle(id, role, size, weight, lineHeight, ref) {
    const bold = weight === 600;
    const inheritsBody =
      !id.startsWith('component.table.') &&
      !['component.button', 'component.tab', 'component.input'].includes(id);
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
          layout: { width: 'FILL', height: 'HUG' },
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
      { State },
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

  // These tables intentionally model TableTag's bounded three-column fixture.
  // Intrinsic HTML column sizing and native row-height reflow are not implied.
  source(sources.table, /border-collapse: collapse;\s*border-spacing: 0;/);
  source(
    sources.table,
    /line-height: 1\.4;\s*padding: var\(--mg-spacing-100\) var\(--mg-spacing-150\);\s*text-align: start;\s*vertical-align: top;/
  );
  source(sources.table, /\.mg-table thead tr th \{[^}]*font-weight: 600;/);
  source(
    sources.table,
    /&:nth-child\(even\) \{\s*background-color: rgb\(var\(--mg-color-neutral-25\)\)/
  );
  source(sources.table, /tr \{\s*@extend %border-none;/);
  source(sources.table, /\.mg-table tbody tr \{\s*@extend %border-bottom;/);
  source(
    sources.mixins,
    /%border-bottom \{\s*border-bottom: 1px solid rgb\(var\(--mg-color-neutral-400\)\)/
  );
  source(
    sources.table,
    /border: 1px solid rgb\(var\(--mg-color-neutral-400\)\);\s*border-collapse: collapse;\s*box-sizing: border-box;\s*min-width: 50px;/
  );
  source(sources.table, /font-size: var\(--mg-font-size-250\);/);
  source(
    sources.table,
    /\.mg-table\.mg-table--small td \{\s*padding: var\(--mg-spacing-50\) var\(--mg-spacing-100\)/
  );
  if (
    (read(sources.tableJsx).match(/<th scope="col">\{text\}<\/th>/g) || [])
      .length !== 3 ||
    (read(sources.tableJsx).match(/<td>\{tdtext\}<\/td>/g) || []).length !==
      8 ||
    (read(sources.tableJsx).match(/<td>\{details\}<\/td>/g) || []).length !== 4
  )
    throw new Error(
      'TableTag inventory changed: update the three-column, four-row recipes.'
    );
  const tableRef = reference(sources.table, /\.mg-table th,/);
  const tableFloat = (name, get, description, scopes = ['WIDTH_HEIGHT']) => {
    const result = addVariable(
      `component/table/${name}`,
      'FLOAT',
      perMode(mode => Number(get(mode).toFixed(6))),
      description,
      tableRef
    );
    byName.get(result).scopes = scopes;
    return result;
  };
  const tableBorder = tableFloat(
    'border-width',
    () => 1,
    'Source collapsed table border: 1px neutral-400.',
    ['STROKE_FLOAT']
  );
  const tableHalfBorder = tableFloat(
    'half-border-width',
    mode => value(tableBorder, mode) / 2,
    'Native collapsed-border construction: adjacent inside half strokes form one source 1px seam. Outer table half stroke completes outside edges.',
    ['STROKE_FLOAT', 'GAP']
  );
  const tableStyles = {};
  const tableHeights = {};
  for (const Size of ['Large', 'Small']) {
    const lower = Size.toLowerCase();
    const sizeRole = Size === 'Large' ? '300' : '250';
    const padRole = Size === 'Large' ? 'spacing/100' : 'spacing/50';
    const contentHeight = mode =>
      Math.floor(value(`font-size/${sizeRole}`, mode) * 1.4 * 64) / 64 +
      2 * value(padRole, mode);
    tableHeights[Size] = {
      content: tableFloat(
        `${lower}/content-row-height`,
        contentHeight,
        'Fixed short-content specimen height. Source own-size 140% line height plus block padding; Chromium 153/macOS line boxes quantized to 1/64px on 3 October 2026. Resize rows after content edits; automatic intrinsic table reflow is not reproduced.'
      ),
      bordered: tableFloat(
        `${lower}/bordered-row-height`,
        mode => contentHeight(mode) + value(tableBorder, mode),
        'Fixed short-content row with two collapsed half-border allocations. This is a measured specimen, not a minimum or public CSS height.'
      ),
      first: tableFloat(
        `${lower}/first-body-row-height`,
        mode => contentHeight(mode) + value(tableHalfBorder, mode),
        'First Default body row has no preceding divider and only one collapsed half-border allocation. Fixed short-content specimen height.'
      ),
    };
    for (const [Role, weight] of [
      ['Header', 600],
      ['Body', 400],
    ])
      tableStyles[`${Size}/${Role}`] = textStyle(
        `component.table.${Role.toLowerCase()}.${lower}`,
        'text',
        sizeRole,
        weight,
        1.4,
        tableRef
      );
  }
  const tableInstance = (name, familyId, selected, extra = {}) => ({
    type: 'INSTANCE',
    name,
    family: familyId,
    variant: selected,
    expose: true,
    layout: { width: 'FILL', height: 'FILL' },
    ...extra,
  });
  const tableCells = Role =>
    ['Large', 'Small'].flatMap(Size =>
      ['None', 'Grid'].map(Border =>
        variant(
          `table-${Role.toLowerCase()}-cell.${Size.toLowerCase()}.${Border.toLowerCase()}`,
          { Size, Border },
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
                layout: { width: 'FILL', height: 'HUG' },
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
          { Size, Treatment, Role, Columns: 'Equal' },
          frame(
            'mg-table__row',
            [1, 2, 3].map(index =>
              tableInstance(
                `mg-table__cell-${index}`,
                cellFamily,
                { Size, Border: grid ? 'Grid' : 'None' },
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
        { Size, Treatment, Content: 'Short' },
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
                  ? { bindings: { paddingTop: zero } }
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
  for (const [id, width, columns, headerLines, bodyLines] of [
    ['long-content', 720, [131.78125, 131.78125, 456.4375], 1, 2],
    ['narrow-content', 240, [86.125, 86.125, 120.453125], 2, 9],
  ]) {
    for (const mode of modes)
      if (
        value('font-family/text', mode) !== 'Roboto' ||
        value('font-size/300', mode) !== 16 ||
        value('spacing/100', mode) !== 10 ||
        value('spacing/150', mode) !== 15
      )
        throw new Error(
          'Measured Table review geometry needs a new font/size/spacing browser baseline.'
        );
    const names = columns.map((number, index) =>
      tableFloat(
        `specimen/${id}/column-${index + 1}`,
        () => number,
        'Measured Chromium 153/macOS TableTag English story column at the dated 3 October 2026 baseline. No CSS column-width role; fixed specimen only.'
      )
    );
    const rowHeight = lines => lines * 22.390625 + 20;
    const headerHeight = tableFloat(
      `specimen/${id}/header-height`,
      () => rowHeight(headerLines),
      'Measured browser header height used as a Figma specimen minimum. Source has no corresponding min-height declaration; native text metrics can make the row taller.'
    );
    const bodyHeight = tableFloat(
      `specimen/${id}/body-height`,
      () => rowHeight(bodyLines) + 1,
      'Measured browser later body row height, including collapsed divider allocation, used as a Figma specimen minimum. Native text metrics can make the row taller; this is not an authored CSS min-height.'
    );
    const firstHeight = tableFloat(
      `specimen/${id}/first-body-height`,
      () => rowHeight(bodyLines) + 0.5,
      'Measured browser first body row height, including only its bottom half divider allocation, used as a Figma specimen minimum. Native text metrics can grow the row.'
    );
    const Columns = id === 'long-content' ? 'Story' : 'NarrowStory';
    const outerWidth = tableFloat(
      `specimen/${id}/outer-width`,
      () => columns.reduce((sum, column) => sum + column, 0),
      width === 240
        ? 'Measured native source table overflows its 240px consumer region to 292.703125px. Preserve content visibility; this is not forced-fit responsiveness.'
        : 'Measured 720px outer width of the English TableTag story fixture. This is a finite native preset, not an authored CSS table width.'
    );
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
      variant: { Size: 'Large', Treatment: 'Default', Content: Columns },
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
              variant: { State: 'Filled' },
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
          'Show label': { nodeName: 'mg-form-label', defaultValue: true },
          'Show help': { nodeName: 'mg-form-help', defaultValue: true },
          'Show error': { nodeName: 'mg-form-error', defaultValue: true },
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
      { review: { genericLabels: false, width: 720 } }
    ),
    family(
      'table',
      'Mangrove/Table',
      sources.tableJsx,
      /export const TableTag/,
      tableVariants,
      { review: { genericLabels: false, width: 720, specimens: tableReview } }
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
  for (const variable of variables) byName.set(variable.name, variable);
  function validate(node) {
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
      'Filled TextInput and Textarea use component/text-input/browser-fieldtext, a literal #000000 helper for the measured Chromium baseline. Mangrove color/black is #1a1a1a and cannot represent that observation. Source does not declare an input colour role; system-colour and other-browser parity remain unverified.',
      'Textarea represents the default JSX row count using a source-derived initial height. Chromium row quantization, native scrollbars, vertical resize handle and resize behaviour are not reproduced.',
      'Required field labels use a separate marker layer. Narrow multiline labels do not reproduce the source inline ::after flow yet.',
      'Table models TableTag three-column, four-row specimens with Equal/Story/NarrowStory column presets on Row masters. Equal short-content rows remain fixed and longer edits can overflow. Story/NarrowStory Default rows and cells hug text above measured browser minimum heights; native line breaking differs from the browser and can grow rows. Arbitrary native column resizing and HTML automatic column sizing are unsupported; nested review geometry writes were ignored in real Figma. Dated long/narrow examples use linked measured English source-column masters, including minimum-content overflow outside a 240px region. Responsive stacking/scrolling and separate data-table selectors remain outside this scaffold.',
      'ComboBox popover is a specimen in flow; runtime overlay position, viewport cap and behaviour are not reproduced.',
      'Transparent resets, glyphs and source literals have no invented brand overrides.',
    ],
  };
}

module.exports = { buildComponentRecipes };
