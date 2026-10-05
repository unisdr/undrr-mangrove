/** Source-owned diagnostic packet. Creates no variables, styles or families. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const tokens = require('./build-tokens.cjs');

function buildFormActionCapability({ root, modes, variables, styles }) {
  const fail = message => {
    throw new Error(`Figma FormAction probe needs updating: ${message}`);
  };
  const read = file => fs.readFileSync(path.join(root, file), 'utf8');
  // Preserve quoted data URLs, JSX strings and template strings while removing comments.
  function clean(text) {
    let result = '',
      quote = null;
    for (let i = 0; i < text.length; i++) {
      const c = text[i],
        next = text[i + 1];
      if (quote) {
        result += c;
        if (c === '\\') {
          result += next || '';
          i++;
        } else if (c === quote) quote = null;
      } else if (['"', "'", '`'].includes(c)) {
        quote = c;
        result += c;
      } else if (c === '/' && next === '*') {
        i += 2;
        while (i < text.length && !(text[i] === '*' && text[i + 1] === '/'))
          i++;
        i++;
        result += ' ';
      } else if (c === '/' && next === '/') {
        while (i < text.length && text[i] !== '\n') i++;
        result += ' ';
      } else result += c;
    }
    return result.replace(/\s+/g, ' ').trim();
  }
  const hash = text =>
    crypto.createHash('sha256').update(clean(text)).digest('hex');
  const sourceRefs = [];
  function source(file, expression) {
    const text = read(file),
      match = expression.exec(text);
    if (!match) fail(`Source contract changed in ${file}: ${expression}`);
    sourceRefs.push({
      file,
      line: text.slice(0, match.index).split('\n').length,
    });
    return match;
  }
  const jsx = 'stories/Components/Forms/FormAction/FormAction.jsx';
  const story = 'stories/Components/Forms/FormAction/FormAction.stories.jsx';
  const scss = 'stories/Components/Forms/FormAction/form-action.scss';
  const form = 'stories/Components/Forms/_form-base.scss';
  const button = 'stories/Components/Buttons/CtaButton/cta-button.scss';
  const normalizedGuards = [
    [
      jsx,
      '3b8463c4b126b4408f88faed9ac44885df6f120835f61790fa375203fc4c7b60',
      /export function FormAction/,
    ],
    [
      story,
      'bbd0d4b15e61fbf09ce1a959aa2fd452c1e82d2d39d6ee592dfda0ebab4b26f0',
      /export const Search/,
    ],
    [
      scss,
      'af4ddbf45761581744646e85999efed0eea4fb8ed58309cb6d6e68076841f53f',
      /\.mg-form-action \{/,
    ],
    [
      form,
      'de147bf1ffd565f11ab434fb85c853c0772fa30ad858761deadbb730da06e663',
      /%mg-form-input-base \{/,
    ],
    [
      button,
      'be087e0b62d4b7558307307ba8f574c7d1298fb2228656e5bce3f0cabb6712bc',
      /\.mg-button \{/,
    ],
  ];
  for (const [file, expected, expression] of normalizedGuards) {
    if (hash(read(file)) !== expected)
      fail(`Complete normalized ${file} changed; remeasure source`);
    source(file, expression);
    sourceRefs.at(-1).normalizedSha256 = expected;
  }
  const actionMinHeight = Number(
    source(scss, /min-height: mg-rem\(([\d.]+)\)/)[1]
  );
  const seam = Number(source(scss, /margin-inline-start: (-[\d.]+)px/)[1]);
  const focusZIndex = Number(
    source(scss, /&__action:focus-visible \{\s*z-index: (\d+);/)[1]
  );
  source(scss, /margin-top: var\(--mg-spacing-25\)/);
  source(scss, /@media \(width <= \$mg-breakpoint-mobile\)/);
  source(scss, /flex-direction: column;\s*gap: var\(--mg-spacing-50\)/);
  const vars = 'stories/assets/scss/_variables.scss';
  const rootFont = Number(source(vars, /\$mg-html-font-size: ([\d.]+);/)[1]);
  const breakpoint = Number(
    source(vars, /\$mg-breakpoint-mobile: ([\d.]+)px;/)[1]
  );
  source(
    vars,
    /@function mg-rem\(\$px\) \{\s*@return math.div\(\$px, \$mg-html-font-size\) \* 1rem;\s*\}/
  );
  source(vars, /\$mg-font-face-sans: "Roboto", sans-serif !default/);
  source(
    vars,
    /--mg-font-family-text: #\{mg-font-stack\(\$mg-font-face-sans\)\}/
  );
  if (
    rootFont !== 16 ||
    breakpoint !== 480 ||
    actionMinHeight !== 46 ||
    seam !== -1 ||
    focusZIndex !== 1
  )
    fail('Measured rem basis, stacked breakpoint or joined geometry changed');
  const normalize = 'stories/Utilities/Normalize/normalize.scss';
  const inputRatio = Number(
    source(
      normalize,
      /button,\s*input,\s*optgroup,\s*select,\s*textarea \{\s*font-family: inherit;\s*\/\* 1 \*\/\s*font-size: 100%;\s*\/\* 1 \*\/\s*line-height: ([\d.]+);/
    )[1]
  );
  const actionRatio = Number(source(button, /line-height: ([\d.]+);/)[1]);
  const requestedWeight = Number(source(button, /font-weight: (\d+);/)[1]);
  const fontImport = 'stories/assets/fonts/roboto/roboto.scss';
  source(fontImport, /@import "sass\/Bold"/);
  source(fontImport, /@import "sass\/Regular"/);
  const bundledWeight = Number(
    source(
      'stories/assets/fonts/roboto/sass/_Bold.scss',
      /font-family: Roboto;[\s\S]*?font-weight: (\d+);\s*font-style: normal/
    )[1]
  );
  source(
    'stories/assets/fonts/roboto/sass/_Regular.scss',
    /font-family: Roboto;[\s\S]*?font-weight: 400;\s*font-style: normal/
  );
  if (
    inputRatio !== 1.15 ||
    actionRatio !== 1 ||
    requestedWeight !== 600 ||
    bundledWeight !== 700
  )
    fail('Measured source typography changed');
  source(
    'stories/assets/scss/_foundational.scss',
    /body \{\s*color: rgb\(var\(--mg-color-text\)\);\s*font-family: var\(--mg-font-family-text\);\s*font-size: var\(--mg-font-size-300\);\s*line-height: var\(--mg-font-line-height-700\);\s*\}/
  );
  source(
    'stories/assets/scss/_mixins.scss',
    /box-shadow: 0 0 0 var\(--mg-focus-ring-offset\) rgb\(var\(--mg-color-neutral-0\)\);\s*outline: var\(--mg-focus-ring-width\) solid rgb\(var\(--mg-color-focus-ring\)\);\s*outline-offset: var\(--mg-focus-ring-offset\)/
  );
  const selectData = source(
    form,
    /background-image: url\("(data:image\/svg\+xml,[^"]+)"\)/
  )[1];
  const svg = decodeURIComponent(selectData.slice(selectData.indexOf(',') + 1));
  if (
    svg !==
    "<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path fill='#1a1a1a' d='M1.41 0L6 4.58 10.59 0 12 1.41l-6 6-6-6z'/></svg>"
  )
    fail('Source Select chevron changed');
  const selectArrowInset = Number(
    source(form, /background-position: right mg-rem\(([\d.]+)\) center/)[1]
  );
  if (selectArrowInset !== 6.25) fail('Measured Select arrow inset changed');
  const colorPrecision = Number(
    source(
      'scripts/build-figma-tokens.cjs',
      /const round = n => Math\.round\(n \* (\d+)\) \/ \1;/
    )[1]
  );
  if (colorPrecision !== 10000) fail('Exporter colour precision changed');
  const exportedChannel = value =>
    Math.round(value * colorPrecision) / colorPrecision;
  source(
    'stories/assets/scss/style.scss',
    /@import "\.\/variables";[\s\S]*?@import "\.\/fonts";[\s\S]*?@import "\.\/mixins";[\s\S]*?@import "\.\/foundational";[\s\S]*?@import "\.\/components";/
  );
  source(
    'stories/assets/scss/_components.scss',
    /@import "\.\.\/\.\.\/Utilities\/Normalize\/normalize";[\s\S]*?@import "\.\.\/\.\.\/Components\/Forms\/form-base";[\s\S]*?@import "\.\.\/\.\.\/Components\/Forms\/FormAction\/form-action";[\s\S]*?@import "\.\.\/\.\.\/Components\/Buttons\/CtaButton\/cta-button";/
  );
  const raw = tokens.loadSources(path.join(root, 'tokens'));
  const knownModes = new Map(
    raw.brands.map(b => [b.meta.id, b.meta.title || b.meta.id])
  );
  if (
    !Array.isArray(modes) ||
    !modes.length ||
    new Set(modes.map(m => m.id)).size !== modes.length ||
    modes.some(m => knownModes.get(m.id) !== m.name || !knownModes.has(m.id))
  )
    fail('Unknown, empty, duplicate or renamed source modes');
  if (!Array.isArray(variables)) fail('Variables array is required');
  const byName = new Map(variables.map(v => [v.name, v]));
  if (
    byName.size !== variables.length ||
    new Set(variables.map(v => v.id)).size !== variables.length
  )
    fail('Duplicate source variable names or identities');
  const roleList = {
    fontFamily: ['font-family/text', 'STRING'],
    inputFontSize: ['font-size/form-input', 'FLOAT'],
    actionFontSize: ['font-size/button', 'FLOAT'],
    bodyFontSize: ['font-size/300', 'FLOAT'],
    helpFontSize: ['font-size/200', 'FLOAT'],
    controlHeight: ['form-input/block-size', 'FLOAT'],
    controlPadding: ['form-input/padding', 'FLOAT'],
    controlBorder: ['form-input/border-width', 'FLOAT'],
    controlRadius: ['radius/form-input', 'FLOAT'],
    actionPaddingBlock: ['padding/button/block', 'FLOAT'],
    actionPaddingInline: ['padding/button/inline', 'FLOAT'],
    actionBorder: ['border-width/button', 'FLOAT'],
    actionRadius: ['radius/button', 'FLOAT'],
    gap: ['spacing/25', 'FLOAT'],
    stackGap: ['spacing/50', 'FLOAT'],
    outerMargin: ['spacing/100', 'FLOAT'],
    selectPaddingEnd: ['spacing/200', 'FLOAT'],
    focusOffset: ['focus-ring/offset', 'FLOAT'],
    focusWidth: ['focus-ring/width', 'FLOAT'],
    focusColor: ['color/focus-ring', 'COLOR'],
    separatorColor: ['color/neutral-0', 'COLOR'],
    inputBackground: ['form-input/background', 'COLOR'],
    inputFocusedBackground: ['form-input/background--focus', 'COLOR'],
    inputBorder: ['form-input/border-color', 'COLOR'],
    inputFocusedBorder: ['color/form-focus', 'COLOR'],
    inputValue: ['component/text-input/browser-fieldtext', 'COLOR'],
    placeholder: ['color/neutral-500', 'COLOR'],
    disabledText: ['color/neutral-400', 'COLOR'],
    white: ['color/white', 'COLOR'],
    actionBackground: ['color/button-background', 'COLOR'],
    actionHoverBackground: ['color/button-background--hover', 'COLOR'],
    actionStroke: ['border-color/button-primary', 'COLOR'],
    actionText: ['color/button', 'COLOR'],
    bodyText: ['color/text', 'COLOR'],
    errorText: ['color/red-900', 'COLOR'],
  };
  const roles = Object.fromEntries(
    Object.entries(roleList).map(([key, [name, type]]) => {
      const v = byName.get(name);
      if (v?.type !== type || typeof v.id !== 'string' || !v.id)
        fail(`Missing or wrong-typed source role ${name}`);
      return [key, { name, id: v.id, type }];
    })
  );
  const clone = v => JSON.parse(JSON.stringify(v));
  function value(name, type, mode, seen = new Set()) {
    if (seen.has(name)) fail(`Source alias cycle at ${name}`);
    seen.add(name);
    const v = byName.get(name),
      result = v?.values?.[mode.id];
    if (v?.type !== type || result === undefined)
      fail(`Missing or wrong-typed alias ${name}/${mode.id}`);
    if (
      result &&
      typeof result === 'object' &&
      Object.hasOwn(result, 'alias')
    ) {
      if (
        typeof result.alias !== 'string' ||
        !result.alias ||
        Object.keys(result).length !== 1
      )
        fail(`Malformed alias ${name}/${mode.id}`);
      return value(result.alias, type, mode, seen);
    }
    const valid =
      type === 'STRING'
        ? typeof result === 'string' && result.length > 0
        : type === 'FLOAT'
          ? Number.isFinite(result) && result >= 0
          : result &&
            ['r', 'g', 'b', 'a'].every(
              k =>
                Number.isFinite(result[k]) && result[k] >= 0 && result[k] <= 1
            );
    if (!valid) fail(`Invalid ${type} role ${name}/${mode.id}`);
    return clone(result);
  }
  function px(literal) {
    const m = String(literal).match(/^([\d.]+)(px|rem)?$/);
    if (!m) fail(`Unsupported source dimension ${literal}`);
    return Number(m[1]) * (m[2] === 'rem' ? rootFont : 1);
  }
  function color(literal) {
    if (literal === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
    const parts = String(literal)
      .replace(/^rgba?\(/, '')
      .replace(/\)$/, '')
      .replace(/,/g, ' ')
      .split('/');
    const channels = parts[0].trim().split(/\s+/).map(Number);
    const a = parts[1] === undefined ? 1 : Number(parts[1]);
    if (
      channels.length !== 3 ||
      channels.some(n => !Number.isFinite(n) || n < 0 || n > 255) ||
      !Number.isFinite(a) ||
      a < 0 ||
      a > 1
    )
      fail(`Unsupported source colour ${literal}`);
    return {
      r: exportedChannel(channels[0] / 255),
      g: exportedChannel(channels[1] / 255),
      b: exportedChannel(channels[2] / 255),
      a: exportedChannel(a),
    };
  }
  const templates = {};
  for (const [key, id, face, ratio, sizeRole] of [
    ['action', 'component.button', 'Bold', actionRatio, 'actionFontSize'],
    ['input', 'component.input', 'Regular', inputRatio, 'inputFontSize'],
  ]) {
    const found = styles?.text?.filter(s => s.id === id);
    if (found?.length !== 1) fail(`One source ${id} font template is required`);
    templates[key] = { style: found[0], id, face, ratio, sizeRole };
    if (
      found[0].bindings?.fontFamily !== roles.fontFamily.name ||
      found[0].bindings?.fontSize !== roles[sizeRole].name
    )
      fail(`Source font bindings changed for ${id}`);
  }
  const brands = Object.fromEntries(
    modes.map(mode => {
      const resolvedRoles = Object.fromEntries(
        Object.entries(roles).map(([key, role]) => [
          key,
          value(role.name, role.type, mode),
        ])
      );
      const r = resolvedRoles,
        brand = raw.brands.find(b => b.meta.id === mode.id),
        sourceTokens = tokens.resolve(
          tokens.mergeLayers(
            tokens.layersFor(
              brand,
              raw.base,
              new Map(raw.brands.map(b => [b.meta.id, b]))
            )
          ),
          mode.id
        );
      const inherited = sourceTokens.emitted.get(
        'font-line-height.700'
      )?.literal;
      if (typeof inherited !== 'string' || !/^([\d.]+)em$/.test(inherited))
        fail(`Inherited body line-height units changed for ${mode.id}`);
      const bodyRatio = Number(inherited.slice(0, -2));
      if (mode.id === 'undrr' && bodyRatio !== 1.5)
        fail('Measured UNDRR body line height changed');
      for (const [key, role] of Object.entries(roles)) {
        if (key === 'fontFamily' || key === 'inputValue') continue;
        const sourceId =
          key === 'actionPaddingBlock' || key === 'actionPaddingInline'
            ? 'padding.button'
            : role.name.replaceAll('/', '.');
        let literal = sourceTokens.emitted.get(sourceId)?.literal;
        if (literal === undefined)
          fail(`Missing source token ${sourceId}/${mode.id}`);
        if (sourceId === 'padding.button')
          literal = literal.split(/\s+/)[key === 'actionPaddingBlock' ? 0 : 1];
        const expected = role.type === 'COLOR' ? color(literal) : px(literal),
          actual = r[key];
        if (
          role.type === 'COLOR'
            ? ['r', 'g', 'b', 'a'].some(
                k => Math.abs(expected[k] - actual[k]) > 1e-10
              )
            : expected !== actual
        )
          fail(
            `Exported role differs from source token ${role.name}/${mode.id}`
          );
      }
      if (
        r.fontFamily !== 'Roboto' ||
        r.controlBorder <= 0 ||
        r.actionBorder <= 0
      )
        fail(`Exact Latin source font or geometry changed for ${mode.id}`);
      const field = byName.get(roles.inputValue.name);
      if (
        field.source?.file !== form ||
        !field.description?.includes('Measured Chromium') ||
        JSON.stringify(r.inputValue) !==
          JSON.stringify({ r: 0, g: 0, b: 0, a: 1 })
      )
        fail('Measured browser fieldtext helper provenance changed');
      const fonts = {};
      for (const [key, t] of Object.entries(templates)) {
        const v = t.style.values?.[mode.id];
        if (
          v?.fontName?.family !== r.fontFamily ||
          v.fontName.style !== t.face ||
          v.fontSize !== r[t.sizeRole] ||
          v.lineHeight?.unit !== 'PERCENT' ||
          v.lineHeight.value !== Number((t.ratio * 100).toFixed(6))
        )
          fail(`Exact source font template changed for ${t.id}/${mode.id}`);
        fonts[key] = clone(v.fontName);
      }
      const type = (font, fontSize, ratio, template, weight) => ({
        fontName: font,
        fontSize,
        lineHeight: {
          unit: ratio === null ? 'PIXELS' : 'PERCENT',
          value:
            ratio === null
              ? r.bodyFontSize * bodyRatio
              : Number((ratio * 100).toFixed(6)),
        },
        requestedWeight: weight,
        bundledWeight: weight === 600 ? bundledWeight : 400,
        sourceFontStyleId: template,
        fontTemplateUse:
          'Exact font object only; source typography is explicit.',
      });
      const corners = {
        control: [r.controlRadius, 0, r.controlRadius, 0],
        action: [0, r.actionRadius, 0, r.actionRadius],
      };
      const expand = quad =>
        quad.map(radius => (radius === 0 ? 0 : radius + r.focusOffset));
      const actionContentHeight =
        r.actionFontSize * actionRatio +
        2 * r.actionPaddingBlock +
        2 * r.actionBorder;
      return [
        mode.id,
        {
          typography: {
            input: type(
              fonts.input,
              r.inputFontSize,
              inputRatio,
              'component.input',
              400
            ),
            action: type(
              fonts.action,
              r.actionFontSize,
              actionRatio,
              'component.button',
              requestedWeight
            ),
            label: type(
              clone(fonts.input),
              r.bodyFontSize,
              null,
              'component.input',
              400
            ),
            help: type(
              clone(fonts.input),
              r.helpFontSize,
              null,
              'component.input',
              400
            ),
            error: type(
              clone(fonts.input),
              r.bodyFontSize,
              null,
              'component.input',
              400
            ),
          },
          geometry: {
            actionMinHeight,
            controlHeight: r.controlHeight,
            actionContentHeight,
            rowMinHeight: Math.max(
              r.controlHeight,
              actionMinHeight,
              actionContentHeight
            ),
            seam,
            focusZIndex,
            controlPadding: r.controlPadding,
            actionPaddingBlock: r.actionPaddingBlock,
            actionPaddingInline: r.actionPaddingInline,
            controlBorder: r.controlBorder,
            actionBorder: r.actionBorder,
            corners,
            focusOuterCorners: {
              control: expand(corners.control),
              action: expand(corners.action),
            },
            stackedCorners: {
              control: Array(4).fill(r.controlRadius),
              action: Array(4).fill(r.actionRadius),
            },
            gap: r.gap,
            stackGap: r.stackGap,
            outerMargin: r.outerMargin,
            focusOffset: r.focusOffset,
            focusWidth: r.focusWidth,
            selectPaddingEnd: r.selectPaddingEnd,
            selectArrowInset,
          },
          paints: {
            inputDefault: {
              fill: roles.inputBackground.name,
              stroke: roles.inputBorder.name,
              text: roles.inputValue.name,
            },
            inputFilled: {
              fill: roles.inputFocusedBackground.name,
              stroke: roles.inputBorder.name,
              text: roles.inputValue.name,
              selector: '[placeholder]:not(:placeholder-shown)',
            },
            inputFocus: {
              fill: roles.inputFocusedBackground.name,
              stroke: roles.inputFocusedBorder.name,
              text: roles.inputValue.name,
            },
            inputModifierDisabled: {
              fill: roles.white.name,
              stroke: roles.disabledText.name,
              text: roles.disabledText.name,
            },
            actionDefault: {
              fill: roles.actionBackground.name,
              stroke: roles.actionStroke.name,
              text: roles.actionText.name,
              opacity: 1,
            },
            actionHover: {
              fill: roles.actionHoverBackground.name,
              stroke: roles.actionStroke.name,
              text: roles.actionText.name,
              opacity: 1,
            },
            actionHtmlDisabled: {
              fill: roles.actionBackground.name,
              stroke: roles.actionStroke.name,
              text: roles.actionText.name,
              opacity: 1,
              scope: 'HTML disabled only, without .disabled class',
            },
            errorText: {
              text: roles.errorText.name,
              inputStroke: roles.inputBorder.name,
              scope: 'errorText/aria-invalid does not add --error class',
            },
            placeholder: roles.placeholder.name,
            label: roles.bodyText.name,
            help: roles.placeholder.name,
          },
          resolvedRoles,
        },
      ];
    })
  );
  const measured = brands.undrr;
  if (
    measured &&
    ([
      ['controlHeight', 46],
      ['actionMinHeight', 46],
      ['rowMinHeight', 46],
      ['controlPadding', 6.25],
      ['actionPaddingBlock', 10],
      ['actionPaddingInline', 15],
      ['controlBorder', 1],
      ['actionBorder', 1],
      ['gap', 2.5],
      ['stackGap', 5],
      ['focusOffset', 2],
      ['focusWidth', 2],
    ].some(([k, v]) => measured.geometry[k] !== v) ||
      measured.typography.input.fontSize !== 16 ||
      measured.typography.action.fontSize !== 14 ||
      measured.typography.help.fontSize !== 12.5 ||
      measured.typography.label.lineHeight.value !== 24 ||
      measured.geometry.corners.control[0] !== 5 ||
      measured.geometry.corners.action[1] !== 5)
  )
    fail('Measured UNDRR typography/geometry changed; remeasure source');
  return {
    version: 1,
    kind: 'form-action-joining',
    sourceRefs,
    roles,
    brands,
    cornersOrder: [
      'topLeftRadius',
      'topRightRadius',
      'bottomLeftRadius',
      'bottomRightRadius',
    ],
    seamDerivation: {
      source: 'FormAction margin-inline-start:-1px literal',
      value: seam,
      independentOfBrandBorder: true,
    },
    stackViewport: {
      maxPx: breakpoint,
      inclusive: true,
      requiresStackOnMobile: true,
      belowOrEqual: 'Stacked',
      above: 'Joined',
      limitation: 'Source viewport band, not native consumer width.',
    },
    selectArrow: {
      svg,
      width: 12,
      height: 8,
      inset: selectArrowInset,
      fill: '#1a1a1a',
      provenance:
        'Literal source CSS SVG, not ComboBox glyph or brand-colour alias.',
    },
    cases: clone(MEASURED_CASES),
    limits: [
      'Diagnostic packet only. No canonical variables, text/effect styles, families or native nodes are created.',
      'Initial source/browser measurements are UNDRR English only. Other brands are resolved from current source roles, not measured geometry.',
      'Raw control has explicit source block size; a taller action in another brand can make the row taller without stretching that fixed control.',
      'FormAction supplies raw control/action classes, independent semantic focus, label/help/error ids and aria-invalid. It does not create a red error border or an authored disabled action appearance.',
      'Input value role is an existing measured Chromium153/macOS fieldtext helper, not universal authored UA colour. Other browsers/system colours remain unverified.',
      'Input filled paint follows the guarded placeholder selector; it is not separately measured in this FormAction browser report.',
      'Font templates identify source font objects only. Native exact font files, template association, effective range paints and edited consumer repeat remain unverified.',
      'Source focus stacking/partial corner geometry, native Select platform menu, arbitrary control/action slots, normal motion, forced colours, RTL/Arabic, theme-hook overrides and publication remain unverified.',
    ],
  };
}
const MEASURED_CASES = {
  sourceBrandId: 'undrr',
  sourceLanguage: 'English',
  sourceRevision: '455e605cac3c4fdc4a906258702fb387eacce46b',
  browser: '153.0.8010.47',
  evidence:
    'Actual JSX/exported stories and freshly compiled full style.scss in isolated source browser; settled reduced-motion endpoint paints.',
  sourceViewportBands: {
    480: 'Stacked when stackOnMobile',
    481: 'Joined',
  },
  labels: {
    Search: {
      label: 'Search publications',
      hideLabel: true,
      placeholder: 'Search publications',
      action: 'Search',
    },
    Subscribe: {
      label: 'Email address',
      placeholder: 'name@example.org',
      action: 'Subscribe',
      help: 'One concise action stays visually attached to its field.',
    },
    SelectAndContinue: {
      label: 'Reporting period',
      value: '2026',
      options: ['2025', '2026'],
      action: 'Continue',
    },
    StackedOnMobile: {
      label: 'Email address',
      placeholder: 'name@example.org',
      action: 'Subscribe for updates',
      stackOnMobile: true,
    },
    Long: {
      label:
        'Email address for publication subscriptions and community resilience updates',
      value: 'a.long.address@resilient-communities.example',
      help: 'A supporting explanation with more words for narrow content and input grouping.',
      action: 'Subscribe for updates',
    },
  },
  views: {
    240: {
      Search: {
        fieldHeight: 46,
        rowY: 0,
        rowHeight: 46,
        inputWidth: 165.203125,
        inputHeight: 46,
        actionX: 164.203125,
        actionY: 0,
        actionWidth: 75.796875,
        actionHeight: 46,
        labelHeight: 0,
        helpHeight: 0,
        errorHeight: 0,
      },
      Subscribe: {
        fieldHeight: 123,
        rowY: 26.5,
        rowHeight: 46,
        inputWidth: 145.90625,
        inputHeight: 46,
        actionX: 144.90625,
        actionY: 26.5,
        actionWidth: 95.09375,
        actionHeight: 46,
        labelHeight: 24,
        helpHeight: 48,
        errorHeight: 0,
      },
      SelectAndContinue: {
        fieldHeight: 72.5,
        rowY: 26.5,
        rowHeight: 46,
        inputWidth: 152.390625,
        inputHeight: 46,
        actionX: 151.390625,
        actionY: 26.5,
        actionWidth: 88.609375,
        actionHeight: 46,
        labelHeight: 24,
        helpHeight: 0,
        errorHeight: 0,
      },
      StackedOnMobile: {
        fieldHeight: 123.5,
        rowY: 26.5,
        rowHeight: 97,
        inputWidth: 240,
        inputHeight: 46,
        actionX: 0,
        actionY: 77.5,
        actionWidth: 240,
        actionHeight: 46,
        labelHeight: 24,
        helpHeight: 0,
        errorHeight: 0,
      },
      Invalid: {
        fieldHeight: 149.5,
        rowY: 26.5,
        rowHeight: 46,
        inputWidth: 145.90625,
        inputHeight: 46,
        actionX: 144.90625,
        actionY: 26.5,
        actionWidth: 95.09375,
        actionHeight: 46,
        labelHeight: 24,
        helpHeight: 48,
        errorHeight: 24,
      },
      InvalidControlFocus: {
        fieldHeight: 149.5,
        rowY: 26.5,
        rowHeight: 46,
        inputWidth: 145.90625,
        inputHeight: 46,
        actionX: 144.90625,
        actionY: 26.5,
        actionWidth: 95.09375,
        actionHeight: 46,
        labelHeight: 24,
        helpHeight: 48,
        errorHeight: 24,
      },
      Disabled: {
        fieldHeight: 123,
        rowY: 26.5,
        rowHeight: 46,
        inputWidth: 145.90625,
        inputHeight: 46,
        actionX: 144.90625,
        actionY: 26.5,
        actionWidth: 95.09375,
        actionHeight: 46,
        labelHeight: 24,
        helpHeight: 48,
        errorHeight: 0,
      },
      Long: {
        fieldHeight: 171,
        rowY: 74.5,
        rowHeight: 46,
        inputWidth: 70.28125,
        inputHeight: 46,
        actionX: 69.28125,
        actionY: 74.5,
        actionWidth: 170.71875,
        actionHeight: 46,
        labelHeight: 72,
        helpHeight: 48,
        errorHeight: 0,
      },
    },
    390: {
      Search: {
        fieldHeight: 46,
        rowY: 0,
        rowHeight: 46,
        inputWidth: 315.203125,
        inputHeight: 46,
        actionX: 314.203125,
        actionY: 0,
        actionWidth: 75.796875,
        actionHeight: 46,
        labelHeight: 0,
        helpHeight: 0,
        errorHeight: 0,
      },
      Subscribe: {
        fieldHeight: 99,
        rowY: 26.5,
        rowHeight: 46,
        inputWidth: 295.90625,
        inputHeight: 46,
        actionX: 294.90625,
        actionY: 26.5,
        actionWidth: 95.09375,
        actionHeight: 46,
        labelHeight: 24,
        helpHeight: 24,
        errorHeight: 0,
      },
      SelectAndContinue: {
        fieldHeight: 72.5,
        rowY: 26.5,
        rowHeight: 46,
        inputWidth: 302.390625,
        inputHeight: 46,
        actionX: 301.390625,
        actionY: 26.5,
        actionWidth: 88.609375,
        actionHeight: 46,
        labelHeight: 24,
        helpHeight: 0,
        errorHeight: 0,
      },
      StackedOnMobile: {
        fieldHeight: 123.5,
        rowY: 26.5,
        rowHeight: 97,
        inputWidth: 390,
        inputHeight: 46,
        actionX: 0,
        actionY: 77.5,
        actionWidth: 390,
        actionHeight: 46,
        labelHeight: 24,
        helpHeight: 0,
        errorHeight: 0,
      },
      Invalid: {
        fieldHeight: 125.5,
        rowY: 26.5,
        rowHeight: 46,
        inputWidth: 295.90625,
        inputHeight: 46,
        actionX: 294.90625,
        actionY: 26.5,
        actionWidth: 95.09375,
        actionHeight: 46,
        labelHeight: 24,
        helpHeight: 24,
        errorHeight: 24,
      },
      InvalidControlFocus: {
        fieldHeight: 125.5,
        rowY: 26.5,
        rowHeight: 46,
        inputWidth: 295.90625,
        inputHeight: 46,
        actionX: 294.90625,
        actionY: 26.5,
        actionWidth: 95.09375,
        actionHeight: 46,
        labelHeight: 24,
        helpHeight: 24,
        errorHeight: 24,
      },
      Disabled: {
        fieldHeight: 99,
        rowY: 26.5,
        rowHeight: 46,
        inputWidth: 295.90625,
        inputHeight: 46,
        actionX: 294.90625,
        actionY: 26.5,
        actionWidth: 95.09375,
        actionHeight: 46,
        labelHeight: 24,
        helpHeight: 24,
        errorHeight: 0,
      },
      Long: {
        fieldHeight: 147,
        rowY: 50.5,
        rowHeight: 46,
        inputWidth: 220.28125,
        inputHeight: 46,
        actionX: 219.28125,
        actionY: 50.5,
        actionWidth: 170.71875,
        actionHeight: 46,
        labelHeight: 48,
        helpHeight: 48,
        errorHeight: 0,
      },
    },
    480: {
      Search: {
        fieldHeight: 46,
        rowY: 0,
        rowHeight: 46,
        inputWidth: 405.203125,
        inputHeight: 46,
        actionX: 404.203125,
        actionY: 0,
        actionWidth: 75.796875,
        actionHeight: 46,
        labelHeight: 0,
        helpHeight: 0,
        errorHeight: 0,
      },
      Subscribe: {
        fieldHeight: 99,
        rowY: 26.5,
        rowHeight: 46,
        inputWidth: 385.90625,
        inputHeight: 46,
        actionX: 384.90625,
        actionY: 26.5,
        actionWidth: 95.09375,
        actionHeight: 46,
        labelHeight: 24,
        helpHeight: 24,
        errorHeight: 0,
      },
      SelectAndContinue: {
        fieldHeight: 72.5,
        rowY: 26.5,
        rowHeight: 46,
        inputWidth: 392.390625,
        inputHeight: 46,
        actionX: 391.390625,
        actionY: 26.5,
        actionWidth: 88.609375,
        actionHeight: 46,
        labelHeight: 24,
        helpHeight: 0,
        errorHeight: 0,
      },
      StackedOnMobile: {
        fieldHeight: 123.5,
        rowY: 26.5,
        rowHeight: 97,
        inputWidth: 480,
        inputHeight: 46,
        actionX: 0,
        actionY: 77.5,
        actionWidth: 480,
        actionHeight: 46,
        labelHeight: 24,
        helpHeight: 0,
        errorHeight: 0,
      },
      Invalid: {
        fieldHeight: 125.5,
        rowY: 26.5,
        rowHeight: 46,
        inputWidth: 385.90625,
        inputHeight: 46,
        actionX: 384.90625,
        actionY: 26.5,
        actionWidth: 95.09375,
        actionHeight: 46,
        labelHeight: 24,
        helpHeight: 24,
        errorHeight: 24,
      },
      InvalidControlFocus: {
        fieldHeight: 125.5,
        rowY: 26.5,
        rowHeight: 46,
        inputWidth: 385.90625,
        inputHeight: 46,
        actionX: 384.90625,
        actionY: 26.5,
        actionWidth: 95.09375,
        actionHeight: 46,
        labelHeight: 24,
        helpHeight: 24,
        errorHeight: 24,
      },
      Disabled: {
        fieldHeight: 99,
        rowY: 26.5,
        rowHeight: 46,
        inputWidth: 385.90625,
        inputHeight: 46,
        actionX: 384.90625,
        actionY: 26.5,
        actionWidth: 95.09375,
        actionHeight: 46,
        labelHeight: 24,
        helpHeight: 24,
        errorHeight: 0,
      },
      Long: {
        fieldHeight: 123,
        rowY: 50.5,
        rowHeight: 46,
        inputWidth: 310.28125,
        inputHeight: 46,
        actionX: 309.28125,
        actionY: 50.5,
        actionWidth: 170.71875,
        actionHeight: 46,
        labelHeight: 48,
        helpHeight: 24,
        errorHeight: 0,
      },
    },
    481: {
      Search: {
        fieldHeight: 46,
        rowY: 0,
        rowHeight: 46,
        inputWidth: 406.203125,
        inputHeight: 46,
        actionX: 405.203125,
        actionY: 0,
        actionWidth: 75.796875,
        actionHeight: 46,
        labelHeight: 0,
        helpHeight: 0,
        errorHeight: 0,
      },
      Subscribe: {
        fieldHeight: 99,
        rowY: 26.5,
        rowHeight: 46,
        inputWidth: 386.90625,
        inputHeight: 46,
        actionX: 385.90625,
        actionY: 26.5,
        actionWidth: 95.09375,
        actionHeight: 46,
        labelHeight: 24,
        helpHeight: 24,
        errorHeight: 0,
      },
      SelectAndContinue: {
        fieldHeight: 72.5,
        rowY: 26.5,
        rowHeight: 46,
        inputWidth: 393.390625,
        inputHeight: 46,
        actionX: 392.390625,
        actionY: 26.5,
        actionWidth: 88.609375,
        actionHeight: 46,
        labelHeight: 24,
        helpHeight: 0,
        errorHeight: 0,
      },
      StackedOnMobile: {
        fieldHeight: 72.5,
        rowY: 26.5,
        rowHeight: 46,
        inputWidth: 311.28125,
        inputHeight: 46,
        actionX: 310.28125,
        actionY: 26.5,
        actionWidth: 170.71875,
        actionHeight: 46,
        labelHeight: 24,
        helpHeight: 0,
        errorHeight: 0,
      },
      Invalid: {
        fieldHeight: 125.5,
        rowY: 26.5,
        rowHeight: 46,
        inputWidth: 386.90625,
        inputHeight: 46,
        actionX: 385.90625,
        actionY: 26.5,
        actionWidth: 95.09375,
        actionHeight: 46,
        labelHeight: 24,
        helpHeight: 24,
        errorHeight: 24,
      },
      InvalidControlFocus: {
        fieldHeight: 125.5,
        rowY: 26.5,
        rowHeight: 46,
        inputWidth: 386.90625,
        inputHeight: 46,
        actionX: 385.90625,
        actionY: 26.5,
        actionWidth: 95.09375,
        actionHeight: 46,
        labelHeight: 24,
        helpHeight: 24,
        errorHeight: 24,
      },
      Disabled: {
        fieldHeight: 99,
        rowY: 26.5,
        rowHeight: 46,
        inputWidth: 386.90625,
        inputHeight: 46,
        actionX: 385.90625,
        actionY: 26.5,
        actionWidth: 95.09375,
        actionHeight: 46,
        labelHeight: 24,
        helpHeight: 24,
        errorHeight: 0,
      },
      Long: {
        fieldHeight: 123,
        rowY: 50.5,
        rowHeight: 46,
        inputWidth: 311.28125,
        inputHeight: 46,
        actionX: 310.28125,
        actionY: 50.5,
        actionWidth: 170.71875,
        actionHeight: 46,
        labelHeight: 48,
        helpHeight: 24,
        errorHeight: 0,
      },
    },
    900: {
      Search: {
        fieldHeight: 46,
        rowY: 0,
        rowHeight: 46,
        inputWidth: 825.203125,
        inputHeight: 46,
        actionX: 824.203125,
        actionY: 0,
        actionWidth: 75.796875,
        actionHeight: 46,
        labelHeight: 0,
        helpHeight: 0,
        errorHeight: 0,
      },
      Subscribe: {
        fieldHeight: 99,
        rowY: 26.5,
        rowHeight: 46,
        inputWidth: 805.90625,
        inputHeight: 46,
        actionX: 804.90625,
        actionY: 26.5,
        actionWidth: 95.09375,
        actionHeight: 46,
        labelHeight: 24,
        helpHeight: 24,
        errorHeight: 0,
      },
      SelectAndContinue: {
        fieldHeight: 72.5,
        rowY: 26.5,
        rowHeight: 46,
        inputWidth: 812.390625,
        inputHeight: 46,
        actionX: 811.390625,
        actionY: 26.5,
        actionWidth: 88.609375,
        actionHeight: 46,
        labelHeight: 24,
        helpHeight: 0,
        errorHeight: 0,
      },
      StackedOnMobile: {
        fieldHeight: 72.5,
        rowY: 26.5,
        rowHeight: 46,
        inputWidth: 730.28125,
        inputHeight: 46,
        actionX: 729.28125,
        actionY: 26.5,
        actionWidth: 170.71875,
        actionHeight: 46,
        labelHeight: 24,
        helpHeight: 0,
        errorHeight: 0,
      },
      Invalid: {
        fieldHeight: 125.5,
        rowY: 26.5,
        rowHeight: 46,
        inputWidth: 805.90625,
        inputHeight: 46,
        actionX: 804.90625,
        actionY: 26.5,
        actionWidth: 95.09375,
        actionHeight: 46,
        labelHeight: 24,
        helpHeight: 24,
        errorHeight: 24,
      },
      InvalidControlFocus: {
        fieldHeight: 125.5,
        rowY: 26.5,
        rowHeight: 46,
        inputWidth: 805.90625,
        inputHeight: 46,
        actionX: 804.90625,
        actionY: 26.5,
        actionWidth: 95.09375,
        actionHeight: 46,
        labelHeight: 24,
        helpHeight: 24,
        errorHeight: 24,
      },
      Disabled: {
        fieldHeight: 99,
        rowY: 26.5,
        rowHeight: 46,
        inputWidth: 805.90625,
        inputHeight: 46,
        actionX: 804.90625,
        actionY: 26.5,
        actionWidth: 95.09375,
        actionHeight: 46,
        labelHeight: 24,
        helpHeight: 24,
        errorHeight: 0,
      },
      Long: {
        fieldHeight: 99,
        rowY: 26.5,
        rowHeight: 46,
        inputWidth: 730.28125,
        inputHeight: 46,
        actionX: 729.28125,
        actionY: 26.5,
        actionWidth: 170.71875,
        actionHeight: 46,
        labelHeight: 24,
        helpHeight: 24,
        errorHeight: 0,
      },
    },
  },
  widthAllocation: {
    formula:
      'input width = row width - action intrinsic width - seam; action x = input width + seam',
    sourceActionWidths: {
      Search: 75.796875,
      Subscribe: 95.09375,
      SelectAndContinue: 88.609375,
      Long: 170.71875,
    },
  },
  stateGeometry:
    'Default, ControlFocus, ActionHover and ActionFocus probes share Subscribe geometry; Invalid variants add the measured error paragraph.',
};
module.exports = { buildFormActionCapability };
