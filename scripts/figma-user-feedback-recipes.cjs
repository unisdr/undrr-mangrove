/** Experimental initial UserFeedback drawings. No submission or native acceptance. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
function buildUserFeedbackRecipes({ root, modes, variables, styles }) {
  const jsx = 'stories/Components/UserFeedback/UserFeedback.jsx';
  const scss = 'stories/Components/UserFeedback/user-feedback.scss';
  const foundation = 'stories/assets/scss/_foundational.scss';
  const read = file => fs.readFileSync(path.join(root, file), 'utf8');
  const fail = message => {
    throw new Error(`Figma UserFeedback recipe needs updating: ${message}`);
  };
  const clean = text =>
    text
      .replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  for (const [file, hash] of [
    [jsx, '96e66b803b58c3dd0abc37f49aad145dce4cc279c7f482df9ff18875bee1f8e5'],
    [scss, '57ecd2712b479857006223c0927f3c7077a3b01963b643d6aa7a1c74839726d5'],
    [
      'stories/Components/UserFeedback/_labels.js',
      'fbaa1032e79b33bd074e1d492f2b2299147b1975cf64f64e091ccfb4c2d90d92',
    ],
    [
      'stories/Components/UserFeedback/UserFeedback.stories.jsx',
      '6c34fa1553ac287cb8ff6d538da990b5498e0b7889592b10c020d2f0b1bb5858',
    ],
    [
      'stories/Atom/Layout/Grid/grid.scss',
      '31d49b0b04614821bf4612d64c83ddedfddf5ff601d8696ceb88e623b335d045',
    ],
    [
      'stories/Atom/Layout/Container/container.scss',
      'b0aa3b96ce469cf287347fb52315ea14e6640e1277254ac362caffa26a46bd05',
    ],
    [
      'stories/Components/Buttons/CtaButton/cta-button.scss',
      'be087e0b62d4b7558307307ba8f574c7d1298fb2228656e5bce3f0cabb6712bc',
    ],
    [
      foundation,
      '4e307714a1414aa88cc1f4ee49d9e7898a29c84f886c0fb8ef5b96db952278a8',
    ],
  ])
    if (
      crypto
        .createHash('sha256')
        .update(clean(read(file)))
        .digest('hex') !== hash
    )
      fail(
        `${file} anatomy or treatment changed; review the bounded projection`
      );
  if (
    modes
      .map(m => m.id)
      .sort()
      .join(',') !== 'delta,irp,mcr,preventionweb,undrr'
  )
    fail('Expected five distinct brand modes');
  const source = (file, pattern) => {
    const text = read(file),
      match = pattern.exec(text);
    if (!match) fail(`Missing ${file} contract ${pattern}`);
    return { file, line: text.slice(0, match.index).split('\n').length };
  };
  const ref = source(scss, /\.mg-user-feedback\s*\{/);
  source('stories/assets/scss/_variables.scss', /\$mg-html-font-size:\s*16;/);
  source(
    'stories/assets/scss/_variables.scss',
    /\$mg-breakpoint-tablet:\s*900px;/
  );
  source(
    'stories/assets/scss/_variables.scss',
    /\$mg-breakpoint-desktop:\s*1164px;/
  );
  const inventory = clean(read('stories/assets/fonts/roboto/roboto.scss'));
  for (const [face, weight] of [
    ['Regular', 400],
    ['Bold', 700],
  ]) {
    if (!inventory.includes(`@import "sass/${face}";`))
      fail(`Missing Roboto ${face} import`);
    source(
      `stories/assets/fonts/roboto/sass/_${face}.scss`,
      new RegExp(
        `font-family: Roboto;[\\s\\S]*?font-weight: ${weight};\\s*font-style: normal;`
      )
    );
  }
  for (const match of inventory.matchAll(/@import "sass\/([^"\n]+)";/g))
    if (
      /font-weight:\s*600\s*;/.test(
        clean(read(`stories/assets/fonts/roboto/sass/_${match[1]}.scss`))
      )
    )
      fail('Roboto600 added; re-evaluate shared Button face');
  const byName = new Map(variables.map(v => [v.name, v]));
  function value(name, mode, type, seen = new Set()) {
    const variable = byName.get(name);
    if (!variable || variable.type !== type || seen.has(name))
      fail(`Missing, wrong-type or circular ${name}`);
    seen.add(name);
    const entry = variable.values[mode.id];
    if (entry == null) fail(`Missing ${name}/${mode.id}`);
    return entry.alias ? value(entry.alias, mode, type, seen) : entry;
  }
  const perMode = fn => Object.fromEntries(modes.map(m => [m.id, fn(m)]));
  function upsert(array, definition, key) {
    const matches = array.filter(
      v =>
        v[key] === definition[key] ||
        v.id === definition.id ||
        v.name === definition.name
    );
    if (
      matches.length > 1 ||
      (matches.length &&
        (matches[0].id !== definition.id ||
          matches[0].name !== definition.name))
    )
      fail(`Foreign or duplicate identity ${definition.name}`);
    const index = array.findIndex(v => v[key] === definition[key]);
    if (index < 0) array.push(definition);
    else array[index] = definition;
  }
  function number(name, scopes, get, description) {
    const fullName = `component/user-feedback/${name}`;
    const definition = {
      id: fullName.replaceAll('/', '.'),
      name: fullName,
      type: 'FLOAT',
      scopes,
      source: ref,
      description,
      hiddenFromPublishing: false,
      codeSyntax: {},
      values: perMode(typeof get === 'function' ? get : () => get),
    };
    if (
      Object.values(definition.values).some(v => !Number.isFinite(v) || v < 0)
    )
      fail(`Invalid geometry ${name}`);
    upsert(variables, definition, 'name');
    byName.set(fullName, definition);
    return fullName;
  }
  const actionMinimum = number(
    'action-min-height',
    ['WIDTH_HEIGHT'],
    40,
    'Source local .mg-user-feedback__actions .mg-button min-block-size mg-rem(40), unlike generic Button.'
  );
  const rootMinimum = number(
    'root-min-height',
    ['WIDTH_HEIGHT'],
    72,
    'Source min-block-size mg-rem(72).'
  );
  const gutter = number(
    'container-inline-padding',
    ['GAP'],
    10,
    'Source .mg-container mg-rem(10) inline gutters.'
  );
  const widths = Object.fromEntries(
    [390, 1164].map(w => [
      w,
      number(
        `specimen-width-${w}`,
        ['WIDTH_HEIGHT'],
        w,
        `Candidate ${w}px source viewport/container allocation, not authored fixed component width.`
      ),
    ])
  );
  const columns = Object.fromEntries(
    [390, 1164].map(w => [
      w,
      number(
        `column-width-${w}`,
        ['WIDTH_HEIGHT'],
        m =>
          (w - 20 - (w === 1164 ? value('spacing/200', m, 'FLOAT') : 0)) /
          (w === 1164 ? 2 : 1),
        'Candidate fixed modern-grid column width after source gutters and gap. Source min-content/track sizing requires browser acceptance.'
      ),
    ])
  );
  const sharedButton = styles.text.find(s => s.id === 'component.button'),
    sharedBody = styles.text.find(s => s.id === 'component.body');
  if (
    sharedButton?.bindings?.fontFamily !== 'font-family/text' ||
    sharedButton.bindings.fontSize !== 'font-size/button' ||
    sharedBody?.bindings?.fontFamily !== 'font-family/text' ||
    sharedBody.bindings.fontSize !== 'font-size/300'
  )
    fail('Shared source typography bindings changed');
  for (const mode of modes) {
    if (value('font-family/text', mode, 'STRING') !== 'Roboto')
      fail(`Unverified source text face ${mode.id}`);
    for (const [style, size, face] of [
      [sharedButton, 'button', 'Bold'],
      [sharedBody, '300', 'Regular'],
    ]) {
      const actual = style.values[mode.id];
      if (
        actual?.fontName?.family !== 'Roboto' ||
        actual.fontName.style !== face ||
        actual.fontSize !== value(`font-size/${size}`, mode, 'FLOAT')
      )
        fail(`Shared typography changed ${style.id}/${mode.id}`);
    }
    if (
      sharedButton.values[mode.id].lineHeight?.unit !== 'PERCENT' ||
      sharedButton.values[mode.id].lineHeight.value !== 100
    )
      fail('Shared Button line height changed');
  }
  const questionId = 'component.user-feedback.question';
  upsert(
    styles.text,
    {
      id: questionId,
      name: 'Mangrove/component/user-feedback/question',
      component: true,
      recommended: false,
      source: source(scss, /\.mg-user-feedback__question\s*\{/),
      description:
        'Authored question text-role250 Bold700 and140% own-size line-height. Actual browser/native face and wrapping pending.',
      typography: {
        requestedWeight: 700,
        bundledWeight: 700,
        lineHeightRatio: 1.4,
        lineHeightBasis: 'own-font-size',
        verification:
          'Explicit authored source weight700, not inferred600 matching. Native rendering pending.',
      },
      bindings: { fontFamily: 'font-family/text', fontSize: 'font-size/250' },
      values: perMode(m => ({
        fontName: {
          family: value('font-family/text', m, 'STRING'),
          style: 'Bold',
        },
        fontSize: value('font-size/250', m, 'FLOAT'),
        lineHeight: { unit: 'PERCENT', value: 140 },
        textWrapStyle: 'BALANCE',
      })),
    },
    'id'
  );
  function label(key) {
    const match = new RegExp(`\\b${key}: '([^']*)'`).exec(read(jsx));
    if (!match) fail(`Missing English label ${key}`);
    return match[1];
  }
  const text = (id, name, key, property, style, fill, width = 'HUG') => ({
    type: 'TEXT',
    id,
    name,
    characters: label(key),
    textProperty: property,
    textStyle: style,
    fill,
    textWrap: key === 'question' ? 'BALANCE' : 'AUTO',
    layout: { width, height: 'HUG' },
  });
  const action = (key, property) => ({
    type: 'FRAME',
    id: `action-${key}`,
    name: `mg-button mg-button-secondary (${key})`,
    fill: 'color/button-secondary-background',
    stroke: 'border-color/button-secondary',
    strokesIncludedInLayout: true,
    bindings: {
      cornerRadius: 'radius/button',
      strokeWeight: 'border-width/button',
    },
    layout: {
      mode: 'HORIZONTAL',
      width: 'HUG',
      height: 'HUG',
      minHeight: actionMinimum,
      align: 'CENTER',
      justify: 'CENTER',
      gap: 'spacing/50',
      padding: {
        block: 'padding/button/block',
        inline: 'padding/button/inline',
      },
    },
    children: [
      text(
        `label-${key}`,
        'Source action label',
        key,
        property,
        'component.button',
        'color/button'
      ),
    ],
  });
  const variants = ['Mobile', 'Desktop'].map(Viewport => {
    const desktop = Viewport === 'Desktop',
      width = desktop ? 1164 : 390;
    const issue = text(
      'issue',
      'mg-user-feedback__issue',
      'reportIssue',
      'Report issue',
      'component.body',
      'color/interactive',
      'FILL'
    );
    issue.textAlign = desktop ? 'RIGHT' : 'LEFT';
    return {
      id: `user-feedback.initial.${Viewport.toLowerCase()}`,
      name: `State=Initial, Viewport=${Viewport}`,
      properties: { State: 'Initial', Viewport },
      sourceRef: ref,
      tree: {
        type: 'FRAME',
        id: 'root',
        name: 'mg-user-feedback mg-container mg-grid mg-grid__col-2',
        fill: null,
        bindings: { paddingLeft: gutter, paddingRight: gutter },
        layout: {
          mode: desktop ? 'HORIZONTAL' : 'VERTICAL',
          width: widths[width],
          height: 'HUG',
          minHeight: rootMinimum,
          align: desktop ? 'CENTER' : 'MIN',
          gap: 'spacing/200',
          padding: { block: 'spacing/100' },
          clipsContent: false,
        },
        children: [
          {
            type: 'FRAME',
            id: 'prompt',
            name: 'mg-user-feedback__prompt',
            fill: null,
            layout: {
              mode: 'HORIZONTAL',
              width: columns[width],
              height: 'HUG',
              wrap: 'WRAP',
              align: 'CENTER',
              gap: 'spacing/150',
              counterGap: 'spacing/100',
            },
            children: [
              text(
                'question',
                'mg-user-feedback__question',
                'question',
                'Question',
                questionId,
                'color/text'
              ),
              {
                type: 'FRAME',
                id: 'actions',
                name: 'mg-user-feedback__actions',
                fill: null,
                layout: {
                  mode: 'HORIZONTAL',
                  width: 'HUG',
                  height: 'HUG',
                  wrap: 'WRAP',
                  align: 'CENTER',
                  gap: 'spacing/100',
                },
                children: [action('yes', 'Yes'), action('no', 'No')],
              },
            ],
          },
          {
            type: 'FRAME',
            id: 'issue-column',
            name: 'Source issue grid cell',
            fill: null,
            layout: {
              mode: 'VERTICAL',
              width: columns[width],
              height: 'HUG',
              align: desktop ? 'MAX' : 'MIN',
            },
            children: [issue],
          },
        ],
      },
    };
  });
  return [
    {
      id: 'user-feedback',
      name: 'Mangrove/User feedback',
      kind: 'component-set',
      sourceRef: source(jsx, /const UserFeedback = \(/),
      description:
        'Experimental Initial English plain labels in fixed Mobile390 and Desktop1164 modern-grid drawings. Question, Yes, No and Report issue are editable required labels. Source-specific40px action minimum is drawn directly, not inherited from generic Button masters.',
      limitations: [
        'No click, submission, analytics, storage, navigation, focus transfer, live-region announcements or prototype interaction. Only Initial state, no selected/disabled/hover/focus variants.',
        'Confirmation is unsupported: source requires one flowing paragraph with an inline differently coloured link amid editable prefix/suffix. Existing builder supports whole-node paints/styles and whole-range fills, not editable styled runs. Separate native text frames would change inline wrapping and formatting semantics.',
        'Fixed390/1164 viewport drawings only, no responsive switching or legacy flex-grid fallback. Grid tracks, wrap/min-content placement and source/native geometry require actual source browser comparison. LongLabels and localised content acceptance are excluded.',
        'All four labels are required non-empty plain text. Edits persist in offline mocks but arbitrary edited label lengths are not accepted native layouts.',
        'Question uses authored Bold700. Actions reuse shared Button600-to-Bold700 mapping supported by prior button browser evidence; UserFeedback/native font-file parity and all-brand pixel appearance remain pending. Arabic/RTL and non-Latin font routing excluded.',
      ],
      review: { genericLabels: false, preserveVariantSizing: true },
      variants,
    },
  ];
}
module.exports = { buildUserFeedbackRecipes };
