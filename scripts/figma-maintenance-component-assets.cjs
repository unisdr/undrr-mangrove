/** Source-backed native Figma recipes. Values belong here, not in the plugin. */
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
function buildComponentAssets({ root, modes, variables, styles }) {
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
      {
        file,
        line: found.line,
      }
    );
  }
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
        ? {
            alias: target,
          }
        : {
            ...color,
            a: Number(rgb[2]),
          };
    }
    const alias = /^var\((--mg-[\w-]+)\)$/.exec(text);
    if (alias) {
      const target = cssNames.get(alias[1]);
      if (!target) throw new Error(`Unknown tab reference ${alias[1]}`);
      return {
        alias: target,
      };
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
      {
        WEB: `var(${css})`,
      }
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
    {
      WEB: 'calc(var(--mg-tab-radius) + var(--mg-tab-rail-padding))',
    }
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
    perMode(() => ({
      r: 0,
      g: 0,
      b: 0,
      a: 0,
    })),
    'Source transparent paint. Keep a transparent stroke where the CSS border occupies space.',
    reference(
      sources.button,
      /\.mg-button\.disabled \{\s*border-color: transparent/
    )
  );
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
    perMode(() => ({
      r: 0,
      g: 0,
      b: 0,
      a: 1,
    })),
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
            offset: {
              x: 0,
              y: 0,
            },
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
  const buttonOuterRadius = addVariable(
    'focus-ring/outer-radius-button',
    'FLOAT',
    perMode(
      mode => value('radius/button', mode) + value('focus-ring/offset', mode)
    ),
    'Native outline focus approximation: expanded gold boundary radius equals the button radius plus the neutral separator extent. Follows brand changes without rebuilding.',
    reference(sources.mixins, /outline-offset: var\(--mg-focus-ring-offset\)/),
    {
      WEB: 'calc(var(--mg-radius-button) + var(--mg-focus-ring-offset))',
    }
  );
  const tabOuterRadius = addVariable(
    'focus-ring/outer-radius-tab',
    'FLOAT',
    perMode(
      mode => value('tab/radius', mode) + value('focus-ring/offset', mode)
    ),
    'Native pill-tab focus approximation: expanded gold boundary radius equals the horizontal tab radius plus the neutral separator extent. Opaque strokes preserve focus independently of translucent or absent tab fill.',
    reference(sources.mixins, /outline-offset: var\(--mg-focus-ring-offset\)/),
    {
      WEB: 'calc(var(--mg-tab-radius) + var(--mg-focus-ring-offset))',
    }
  );
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
  const tableSpecimens = [];
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
    tableSpecimens.push({
      id,
      width,
      columns,
      headerLines,
      bodyLines,
      names,
      rowHeight,
      headerHeight,
      bodyHeight,
      firstHeight,
      Columns,
      outerWidth,
    });
  }
  return {
    sources,
    files,
    read,
    source,
    reference,
    byName,
    cssNames,
    value,
    addVariable,
    perMode,
    constant,
    literal,
    resolveExpression,
    sum,
    roles,
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
    buttonWeight,
    tabWeight,
    optionWeight,
    buttonLineHeight,
    tabLineHeight,
    yaml,
    bodyLine,
    bodyLineHeight,
    inputLineHeight,
    textareaRows,
    textareaBlockSize,
    textStyle,
    typography,
    insetStyle,
    existingInset,
    buttonOuterRadius,
    tabOuterRadius,
    tableRef,
    tableFloat,
    tableBorder,
    tableHalfBorder,
    tableStyles,
    tableHeights,
    tableSpecimens,
  };
}
module.exports = {
  buildComponentAssets,
};
