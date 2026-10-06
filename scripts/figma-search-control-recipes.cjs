/** Experimental exact search primitives. No widget, interaction or native acceptance. */
'use strict';
const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');
const {
  buildSearchFixturesSync,
  createSearchSourceLoaderSync,
} = require('./figma-search-fixtures.cjs');
const GUARDS = {
  'stories/Components/Forms/FormAction/form-action.scss':
    '13532ec8248214a4a52d2f96f1089b743747f5c1ca6b61cfd4749748f947cf30',
  'stories/Components/Forms/_form-base.scss':
    'f998db1fd1b06b166a9fe16a0ede11b7c7549f0dd65ffb00b0cc308fbbeed947',
  'stories/Components/Buttons/CtaButton/cta-button.scss':
    'f1534e70a4c4c1d60dea8356fdef4b4b476e49d93c3ed310557f898d3bc5a40b',
  'stories/assets/scss/_foundational.scss':
    '89f40e9172074d84f101aa6a9d6a048aa6177a67781b8fb672cb4a4c44adbcdf',
  'stories/Utilities/Normalize/normalize.scss':
    'b74d9ace846077ecd6ad39e618f4a90ecde78dab80713b00315caba55cd76795',
  'stories/Atom/Icons/_icon-definitions.scss':
    'ce483a74e800148a703ef73d85f7bb11c3982cbbd07f477cc52db8a1ece8138e',
  'stories/assets/fonts/roboto/roboto.scss':
    'b881ae0ebeb56f49523c791faafc1a10299fc1d7a875fa91c028b06164b8197c',
  'stories/assets/fonts/roboto/sass/_Regular.scss':
    'cb27bc0dd02ba21b4dda3249a59e352e0a42c5ea45b83d7cba0a1a2cb79f5845',
  'stories/assets/fonts/roboto/sass/_Medium.scss':
    'a4604935605d15b5eeb12d7f8700e91f637ef5b545dd757ac232953ffdece828',
  'stories/assets/fonts/roboto/sass/_Bold.scss':
    '9f24cf0a077b2087c47c55bbb665a4086a38818680eee9ca0dfac4c0ce0d273e',
  'stories/assets/fonts/roboto/sass/_Black.scss':
    '1d6ef057178c2e90eb539ccfa3b491121465388c86df9396a23e61ce672306ba',
  'stories/assets/fonts/roboto/sass/_Italic.scss':
    'bbf29ea2da948bbd1827da7c8f1c7c95e3e8e74584445663670ded67fcbf8696',
};

function buildSearchControlRecipes({ root, modes, variables, styles }) {
  const fixtures = buildSearchFixturesSync({ root });
  const source = createSearchSourceLoaderSync({ root }),
    constants = source.load(
      'stories/Components/SyndicationSearchWidget/utils/constants.js'
    ),
    labels = source.load(
      'stories/Components/SyndicationSearchWidget/context/SearchContext.jsx'
    ).DEFAULT_LABELS;
  const fail = m => {
    throw new Error(`Search control recipe needs updating: ${m}`);
  };
  for (const [p, h] of Object.entries(GUARDS))
    if (
      crypto
        .createHash('sha256')
        .update(fs.readFileSync(path.join(root, p)))
        .digest('hex') !== h
    )
      fail(p);
  if (
    modes
      .map(m => m.id)
      .sort()
      .join(',') !== 'delta,irp,mcr,preventionweb,undrr'
  )
    fail('Expected five modes');
  const byName = new Map(variables.map(v => [v.name, v]));
  function value(name, mode, type, seen = new Set()) {
    const v = byName.get(name);
    if (!v || v.type !== type || seen.has(name))
      fail(`Missing/wrong-type/cyclic ${name}`);
    seen.add(name);
    const x = v.values[mode.id];
    if (x == null) fail(`Missing ${name}/${mode.id}`);
    return x.alias ? value(x.alias, mode, type, seen) : x;
  }
  function upsert(list, entry, key) {
    const hits = list.filter(
      e =>
        e.id === entry.id ||
        e[key] === entry[key] ||
        (entry.name && e.name === entry.name)
    );
    if (
      hits.length > 1 ||
      (hits.length &&
        (hits[0].id !== entry.id ||
          hits[0][key] !== entry[key] ||
          hits[0].name !== entry.name))
    )
      fail(`Foreign identity ${entry.id}`);
    const i = list.indexOf(hits[0]);
    if (i < 0) list.push(entry);
    else list[i] = entry;
  }
  const ref = {
    file: 'stories/Components/SyndicationSearchWidget/syndication-search-widget.scss',
    line: 91,
  };
  function role(name, type, get, scopes) {
    const n = 'component/search-control/' + name,
      e = {
        id: n.replaceAll('/', '.'),
        name: n,
        type,
        scopes,
        sourceRef: ref,
        description: 'Finite source search-control candidate',
        hiddenFromPublishing: false,
        codeSyntax: {},
        values: Object.fromEntries(modes.map(m => [m.id, get(m)])),
      };
    upsert(variables, e, 'name');
    byName.set(n, e);
    return n;
  }
  const num = (n, x, scopes = ['ALL_SCOPES']) =>
    role(n, 'FLOAT', typeof x === 'function' ? x : () => x, scopes);
  const one = num('border-one', 1, ['STROKE_FLOAT']),
    two = num('border-two', 2, ['STROKE_FLOAT']),
    zero = 'spacing/0';
  const overlap = num('form-overlap', -1, ['GAP']),
    room = num('clear-room', 44, ['GAP']),
    clearSize = num('clear-size', 36, ['WIDTH_HEIGHT']);
  const clearOffset = num(
    'clear-offset',
    m => -value('spacing/50', m, 'FLOAT')
  );
  const submitIconSize = num(
    'submit-icon-size',
    () => ({ alias: 'font-size/button' }),
    ['WIDTH_HEIGHT']
  );
  const submitIconStroke = num(
    'submit-icon-stroke',
    m => (2 * value('font-size/button', m, 'FLOAT')) / 24,
    ['STROKE_FLOAT']
  );
  const formHeight = num(
    'form-height',
    m =>
      Math.max(
        46,
        value('font-size/button', m, 'FLOAT') +
          2 * value('padding/button/block', m, 'FLOAT') +
          2 * value('border-width/button', m, 'FLOAT')
      ),
    ['WIDTH_HEIGHT']
  );
  const opacityColour = (n, base, a) =>
    role(n, 'COLOR', m => ({ ...value(base, m, 'COLOR'), a }), ['ALL_FILLS']);
  const selectBorder = opacityColour(
      'select-border',
      'color/neutral-600',
      0.22
    ),
    selectedBg = opacityColour('selected-background', 'color/blue-900', 0.08);
  const shadowColour = role(
    'dropdown-shadow-colour',
    'COLOR',
    () => ({ r: 0, g: 0, b: 0, a: 0.1 }),
    ['EFFECT_COLOR']
  );
  const dropdownShadow = 'component/search-control/dropdown-shadow';
  upsert(
    styles.effect,
    {
      id: dropdownShadow,
      name: 'Mangrove/Drafts/Search controls/dropdown shadow',
      sourceRef: ref,
      values: Object.fromEntries(
        modes.map(m => [
          m.id,
          [
            {
              effect: {
                type: 'DROP_SHADOW',
                color: { r: 0, g: 0, b: 0, a: 0.1 },
                offset: { x: 0, y: 4 },
                radius: 12,
                spread: 0,
                visible: true,
                blendMode: 'NORMAL',
              },
              bindings: { color: shadowColour },
            },
          ],
        ])
      ),
    },
    'id'
  );
  const selectedHighlightedBg = opacityColour(
    'selected-highlighted-background',
    'color/blue-900',
    0.12
  );
  const fieldText = role(
    'field-text',
    'COLOR',
    () => ({ r: 0, g: 0, b: 0, a: 1 }),
    ['TEXT_FILL']
  );
  const body = 'font-family/text';
  for (const m of modes) {
    if (value('font-size/200', m, 'FLOAT') !== 12.5)
      fail('Operator280px wrapped-font geometry needs remeasurement');
    if (value(body, m, 'STRING') !== 'Roboto') fail('Latin body face changed');
    for (const n of [
      'color/interactive',
      'color/text',
      'color/neutral-500',
      'color/white',
      'color/form-check',
      'color/form-check--checked',
      'color/button-background',
      'color/button',
      'form-input/background',
      'form-input/background--focus',
      'form-input/border-color',
    ])
      value(n, m, 'COLOR');
  }
  function style(name, sizeRole, weight, line) {
    const id = 'component/search-control/' + name;
    upsert(
      styles.text,
      {
        id,
        name: 'Mangrove/Drafts/Search controls/' + name,
        sourceRef: ref,
        description: `Source requested Roboto${weight};600 maps to Bold700 as explicit pending matching inference.`,
        bindings: { fontFamily: body, fontSize: sizeRole },
        values: Object.fromEntries(
          modes.map(m => [
            m.id,
            {
              fontName: {
                family: value(body, m, 'STRING'),
                style:
                  name === 'operator-hint'
                    ? 'Italic'
                    : {
                        400: 'Regular',
                        500: 'Medium',
                        600: 'Bold',
                        900: 'Black',
                      }[weight],
              },
              fontSize: value(sizeRole, m, 'FLOAT'),
              lineHeight: {
                unit: 'PIXELS',
                value:
                  typeof line === 'function'
                    ? line(m)
                    : value(sizeRole, m, 'FLOAT') * line,
              },
              textDecoration: 'NONE',
              textWrapStyle: 'AUTO',
            },
          ])
        ),
      },
      'id'
    );
    return id;
  }
  const connectorStyle = style('connector', 'font-size/300', 600, 1.5);
  const connectorSpec = styles.text.find(s => s.id === connectorStyle);
  for (const v of Object.values(connectorSpec.values)) {
    v.textCase = 'UPPER';
    v.letterSpacing = { unit: 'PIXELS', value: v.fontSize * 0.05 };
  }
  const inputStyle = style('input', 'font-size/form-input', 400, 1.15),
    submitStyle = style('submit', 'font-size/button', 600, 1),
    triggerStyle = style('trigger', 'font-size/300', 400, 1.15),
    optionStyle = style('option', 'font-size/200', 400, 1.4),
    selectedStyle = style('option-selected', 'font-size/200', 600, 1.4),
    countStyle = style(
      'count',
      'font-size/100',
      400,
      m => value('font-size/300', m, 'FLOAT') * 1.5
    ),
    bodyStyle = style('body', 'font-size/300', 400, 1.5),
    labelStyle = style('label', 'font-size/300', 500, 1.5),
    chipStyle = style('chip', 'font-size/300', 400, 1.15),
    removeStyle = style('remove', 'font-size/300', 900, 1.15),
    operatorStyle = style('operator', 'font-size/200', 400, 1.5),
    operatorActive = style('operator-active', 'font-size/200', 500, 1.5),
    hintStyle = style('operator-hint', 'font-size/200', 400, 1.4);
  const T = (id, text, textStyle, fill = 'color/text', property) => ({
    type: 'TEXT',
    id,
    name: id,
    characters: text,
    textStyle,
    fill,
    textDecoration: 'NONE',
    ...(property ? { textProperty: property } : {}),
    layout: { width: 'HUG', height: 'HUG' },
  });
  const F = (id, children, layout, fill = null, bindings = {}) => ({
    type: 'FRAME',
    id,
    name: id,
    fill,
    stroke: null,
    layout,
    bindings,
    children,
  });
  const flow = (width = 'HUG', height = 'HUG', mode = 'HORIZONTAL') => ({
    mode,
    width,
    height,
    align: 'CENTER',
  });
  const rounded = radius => ({
    topLeftRadius: radius,
    topRightRadius: radius,
    bottomLeftRadius: radius,
    bottomRightRadius: radius,
  });
  const icons = fs.readFileSync(
    path.join(root, 'stories/Atom/Icons/_icon-definitions.scss'),
    'utf8'
  );
  function mask(name) {
    const m = new RegExp(
      `\\.mg-icon-${name}::before \\{[\\s\\S]*?data:image/svg\\+xml,([^\"]+)`
    ).exec(icons);
    if (!m) fail('Missing mask ' + name);
    return m[1].replaceAll("'", '"').replaceAll('currentColor', '#000000');
  }
  function svg(id, markup, size, colour, asset) {
    return {
      type: 'SVG',
      id,
      name: id,
      svg: { assetId: asset, markup, monochrome: { strokes: colour } },
      layout: { width: size, height: size },
    };
  }
  const searchSvg = mask('search'),
    clearSvg = mask('close');
  const chevron =
    '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#000000" stroke-width="2"><path d="M3 4.5L6 7.5L9 4.5"/></svg>';
  const check =
    '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 3L4.5 8.5L2 6" stroke="#000000" stroke-width="2" fill="none"/></svg>';
  const limits = [
    'Source-only finite Latin candidates. No native identity/font/pixel or publication acceptance.',
    'Requested600 uses active Bold700 as a pending matching inference;500 Medium and900 Black are active source declarations.',
    'No typing, filter/sort dispatch, keyboard focus, portal/backdrop capture, scrolling, animation or responsive wrapping behavior.',
    'Open dropdown retains44px source flow height with an overflowing positioned panel; catalogue overlap/visual footprints need native acceptance.',
    'Edited plain text properties are supported; arbitrary multiline/inherited-script geometry remains open.',
  ];
  function family(id, variants, description) {
    const familySource = {
      'search-form': ['SearchForm.jsx', 'export function SearchForm('],
      'search-select': [
        'SelectDropdown.jsx',
        'export function SelectDropdown(',
      ],
      'search-active-filters': [
        'ActiveFilters.jsx',
        'export function ActiveFilters(',
      ],
      'search-facet-operator': [
        'FacetSelect.jsx',
        '{labels.matchModeGroupLabel}',
      ],
    }[id];
    const familyFile =
        'stories/Components/SyndicationSearchWidget/components/' +
        familySource[0],
      familyText = fs.readFileSync(path.join(root, familyFile), 'utf8'),
      familyIndex = familyText.indexOf(familySource[1]);
    if (familyIndex < 0) fail('Source reference changed');
    const familyRef = {
      file: familyFile,
      line: familyText.slice(0, familyIndex).split('\n').length,
    };
    const scopedProperties = new Set(
      {
        'search-form': ['Query'],
        'search-select': [
          'Selection label',
          'Option 0',
          'Option 1',
          'Option 2',
          'Search query',
        ],
        'search-active-filters': ['Filter 0', 'Filter 1'],
        'search-facet-operator': ['Hint'],
      }[id]
    );
    const defaults = new Map();
    function checkDefaults(node) {
      if (node.textProperty && !scopedProperties.has(node.textProperty)) {
        if (
          defaults.has(node.textProperty) &&
          defaults.get(node.textProperty) !== node.characters
        )
          fail(
            'Unscoped differing source text default ' +
              id +
              '/' +
              node.textProperty
          );
        defaults.set(node.textProperty, node.characters);
      }
      for (const child of node.children || []) checkDefaults(child);
    }
    for (const [, tree] of variants) checkDefaults(tree);
    for (const [state, tree] of variants) {
      // TEXT defaults are owned by the whole native set, so authored states
      // with different presentation copy need distinct stable property names.
      function propertyContext(node) {
        if (scopedProperties.has(node.textProperty))
          node.textProperty =
            id + '.' + state.toLowerCase() + ' ' + node.textProperty;
        for (const child of node.children || []) propertyContext(child);
      }
      propertyContext(tree);
      function identify(node, prefix) {
        const segment = node.id;
        node.id = prefix ? prefix + '.' + segment : segment;
        for (const child of node.children || []) identify(child, node.id);
      }
      identify(tree, '');
    }

    return {
      id,
      name: 'Mangrove/Drafts/' + id,
      kind: 'component-set',
      sourceRef: familyRef,
      description,
      limitations: limits,
      review: {
        genericLabels: false,
        preserveVariantSizing: true,
        specimens: [],
      },
      variants: variants.map(([state, tree]) => ({
        id: id + '.' + state.toLowerCase(),
        name: 'State=' + state,
        properties: { State: state },
        sourceRef: familyRef,
        tree,
      })),
    };
  }
  const form = family(
    'search-form',
    ['Empty', 'Query', 'QueryLoading'].map(state => {
      const query = state !== 'Empty',
        input = F(
          'input',
          [
            T(
              'value',
              query ? fixtures.presets.DefaultQuery.defaultQuery : 'Search...',
              inputStyle,
              query ? fieldText : 'color/neutral-500',
              'Query'
            ),
          ],
          flow('FILL', 'form-input/block-size'),
          query ? 'form-input/background--focus' : 'form-input/background',
          {
            strokeWeight: 'form-input/border-width',
            paddingLeft: 'form-input/padding',
            paddingRight: room,
            topLeftRadius: 'radius/form-input',
            bottomLeftRadius: 'radius/form-input',
            topRightRadius: zero,
            bottomRightRadius: zero,
          }
        );
      input.stroke = 'form-input/border-color';
      const wrapper = F(
        'input-wrapper',
        [input],
        flow('FILL', 'FILL', 'VERTICAL')
      );
      wrapper.layout.align = 'MIN';
      if (query) {
        const clear = F(
          'clear',
          [
            svg(
              'clear-icon',
              clearSvg,
              18,
              'color/text',
              'search-control.close'
            ),
          ],
          flow(clearSize, clearSize)
        );
        clear.absolute = {
          horizontal: 'END',
          vertical: 'CENTER',
          offsetX: clearOffset,
          offsetY: zero,
        };
        wrapper.children.push(clear);
      }
      const iconFrame = F(
        'submit-icon',
        [
          svg(
            'search-icon',
            searchSvg,
            24,
            'color/button',
            'search-control.search'
          ),
        ],
        flow('font-size/button', 'font-size/button')
      );
      const submit = F(
        'submit',
        [
          iconFrame,
          T(
            'submit-label',
            'Search',
            submitStyle,
            'color/button',
            'Submit label'
          ),
        ],
        flow('HUG', 'FILL'),
        'color/button-background',
        {
          itemSpacing: num('submit-gap', 8, ['GAP']),
          paddingLeft: 'padding/button/inline',
          paddingRight: 'padding/button/inline',
          paddingTop: 'padding/button/block',
          paddingBottom: 'padding/button/block',
          strokeWeight: 'border-width/button',
          topLeftRadius: zero,
          bottomLeftRadius: zero,
          topRightRadius: 'radius/button',
          bottomRightRadius: 'radius/button',
        }
      );
      submit.stroke = 'border-color/button-primary';
      iconFrame.children[0].svg.sizing = {
        size: submitIconSize,
        strokeWidth: submitIconStroke,
      };
      return [
        state,
        F('root', [wrapper, submit], flow(640, formHeight), null, {
          itemSpacing: overlap,
        }),
      ];
    }),
    'Exact source SearchForm; loading preserves visual icon and label.'
  );
  const sort = ['Relevance', 'Newest', 'Oldest'];
  const selects = [
    ['SinglePlaceholderClosed', false, false, [], false],
    ['SingleSelectedClosed', false, false, ['Relevance'], false],
    ['MultipleSelectedClosed', false, true, ['News', 'Event'], false],
    ['SingleOpen', true, false, ['Relevance'], false],
    ['MultipleOpen', true, true, ['News'], false],
    ['SearchOpen', true, true, ['News'], true],
    ['SearchEmpty', true, true, [], true],
  ];
  const select = family(
    'search-select',
    selects.map(([state, open, multiple, selected, search]) => {
      const text = selected.length
        ? selected.length > 1
          ? selected.length + ' selected'
          : selected[0]
        : multiple
          ? 'Select type'
          : 'Select...';
      const arrow = svg(
        'trigger-chevron',
        chevron,
        12,
        'color/neutral-500',
        'search-control.chevron'
      );
      if (open) {
        arrow.svg.markup = arrow.svg.markup.replace(
          'M3 4.5L6 7.5L9 4.5',
          'M9 7.5L6 4.5L3 7.5'
        );
        arrow.svg.assetId = 'search-control.chevron-open';
      }
      const trigger = F(
        'trigger',
        [
          {
            ...T(
              'trigger-text',
              text,
              triggerStyle,
              'color/text',
              'Selection label'
            ),
            layout: { width: 'FILL', height: 'HUG' },
          },
          arrow,
        ],
        flow(280, 44),
        'color/neutral-50',
        {
          ...rounded('radius/form-input'),
          itemSpacing: 'spacing/50',
          paddingLeft: 'spacing/75',
          paddingRight: 'spacing/75',
          strokeWeight: one,
        }
      );
      trigger.stroke = open ? 'color/interactive' : selectBorder;
      if (open)
        Object.assign(trigger.bindings, {
          bottomLeftRadius: zero,
          bottomRightRadius: zero,
        });
      const tree = F('root', [trigger], {
        mode: 'NONE',
        width: 280,
        height: 44,
      });
      tree.clipsContent = false;
      trigger.position = { x: 0, y: 0 };
      if (open) {
        const optionLabels = search
          ? constants.CONTENT_TYPES.map(t => t.name)
          : multiple
            ? ['News', 'Event']
            : sort;
        const rows =
          state === 'SearchEmpty'
            ? [
                F(
                  'empty',
                  [
                    T(
                      'empty-label',
                      labels.dropdownNoOptions,
                      optionStyle,
                      'color/neutral-500',
                      'Empty label'
                    ),
                  ],
                  flow('FILL', 'HUG'),
                  null,
                  { paddingTop: 'spacing/100', paddingBottom: 'spacing/100' }
                ),
              ]
            : optionLabels.map((label, i) => {
                const active = selected.includes(label),
                  highlighted =
                    (state === 'SingleOpen' && i === 1) ||
                    (state === 'MultipleOpen' && i === 0),
                  indicator = F(
                    'indicator',
                    [],
                    flow(16, 16),
                    active ? 'color/form-check--checked' : null,
                    {
                      strokeWeight: two,
                      ...rounded(
                        multiple
                          ? 'radius/form-input'
                          : num('radio-radius', 8, ['CORNER_RADIUS'])
                      ),
                    }
                  );
                indicator.stroke = active
                  ? 'color/form-check--checked'
                  : 'color/form-check';
                if (active)
                  indicator.children.push(
                    multiple
                      ? svg(
                          'check',
                          check,
                          12,
                          'color/white',
                          'search-control.check'
                        )
                      : F(
                          'dot',
                          [],
                          flow(8, 8),
                          'color/white',
                          rounded(num('dot-radius', 4, ['CORNER_RADIUS']))
                        )
                  );
                const row = F(
                  'option-' + i,
                  [
                    indicator,
                    {
                      ...T(
                        'label',
                        label,
                        active ? selectedStyle : optionStyle,
                        active ? 'color/interactive' : 'color/text',
                        'Option ' + i
                      ),
                      layout: { width: 'FILL', height: 'HUG' },
                    },
                  ],
                  flow('FILL', 40),
                  active
                    ? highlighted
                      ? selectedHighlightedBg
                      : selectedBg
                    : highlighted
                      ? 'color/blue-50'
                      : null,
                  {
                    itemSpacing: 'spacing/50',
                    paddingLeft: 'spacing/75',
                    paddingRight: 'spacing/75',
                  }
                );
                if (multiple && !search)
                  row.children.push(
                    T(
                      'count',
                      i === 0 ? '100' : '50',
                      countStyle,
                      'color/neutral-500',
                      'Count ' + i
                    )
                  );
                return row;
              });
        const list = F(
          'list',
          rows,
          {
            mode: 'VERTICAL',
            width: 'FILL',
            height: state === 'SearchOpen' ? 240 : 'HUG',
            align: 'MIN',
          },
          null,
          { paddingTop: 'spacing/25', paddingBottom: 'spacing/25' }
        );
        list.clipsContent = true;
        const panel = F(
          'panel',
          [],
          { mode: 'VERTICAL', width: 280, height: 'HUG', align: 'MIN' },
          'color/white',
          {
            strokeWeight: one,
            strokeTopWeight: zero,
            topLeftRadius: zero,
            topRightRadius: zero,
            bottomLeftRadius: 'spacing/25',
            bottomRightRadius: 'spacing/25',
          }
        );
        panel.stroke = 'color/interactive';
        panel.effectStyle = dropdownShadow;
        panel.position = { x: 0, y: 44 };
        if (search) {
          const searchInput = F(
            'search-input',
            [
              T(
                'search-value',
                state === 'SearchEmpty' ? 'not a source option' : 'Search...',
                triggerStyle,
                state === 'SearchEmpty' ? fieldText : 'color/neutral-500',
                'Search query'
              ),
            ],
            flow('FILL', 'HUG'),
            'color/neutral-50',
            {
              ...rounded('radius/form-input'),
              strokeWeight: one,
              paddingTop: 'spacing/50',
              paddingBottom: 'spacing/50',
              paddingLeft: 'spacing/50',
              paddingRight: 'spacing/50',
            }
          );
          searchInput.stroke = selectBorder;
          panel.children.push(
            F('search-region', [searchInput], flow('FILL', 'HUG'), null, {
              paddingTop: 'spacing/50',
              paddingBottom: 'spacing/50',
              paddingLeft: 'spacing/50',
              paddingRight: 'spacing/50',
              strokeWeight: zero,
              strokeBottomWeight: one,
            })
          );
        }
        if (search) panel.children[0].stroke = 'color/neutral-50';
        panel.children.push(list);
        tree.children.push(panel);
      }
      return [state, tree];
    }),
    'Actual custom mg-select snapshots; fixed280px source candidate, not native Select.'
  );
  const filters = family(
    'search-active-filters',
    ['Single', 'ORPair', 'ANDPair'].map(state => {
      const pair = state !== 'Single',
        children = [
          F(
            'prefix',
            [
              T(
                'filtered-label',
                labels.filteredBy,
                labelStyle,
                'color/text',
                'Prefix'
              ),
            ],
            flow(),
            null,
            { paddingRight: 'spacing/25' }
          ),
        ],
        groups = [];
      for (let i = 0; i < (pair ? 2 : 1); i++) {
        const row = [];
        if (state === 'ANDPair' && i === 1)
          row.push(
            T(
              'and',
              labels.andConnector,
              connectorStyle,
              'color/neutral-500',
              'Connector'
            )
          );
        const chip = F(
          'chip',
          [
            T(
              'label',
              state === 'ANDPair' ? String(i + 1) : i === 0 ? '2024' : '2025',
              chipStyle,
              'color/text',
              'Filter ' + i
            ),
            T('remove', '×', removeStyle),
          ],
          flow(),
          'color/white',
          {
            ...rounded('spacing/25'),
            strokeWeight: one,
            itemSpacing: 'spacing/50',
            paddingTop: 'spacing/25',
            paddingBottom: 'spacing/25',
            paddingLeft: 'spacing/50',
            paddingRight: 'spacing/50',
          }
        );
        chip.stroke = 'color/neutral-100';
        row.push(chip);
        groups.push(
          F('item-' + i, row, flow(), null, { itemSpacing: 'spacing/25' })
        );
      }
      children.push(
        F('list', groups, flow(), null, { itemSpacing: 'spacing/50' })
      );
      if (pair) {
        const clear = F(
          'clear-all',
          [
            T(
              'label',
              labels.clearAllFilters,
              chipStyle,
              'color/interactive',
              'Clear label'
            ),
          ],
          flow(),
          null,
          {
            ...rounded('spacing/25'),
            strokeWeight: one,
            paddingTop: 'spacing/25',
            paddingBottom: 'spacing/25',
            paddingLeft: 'spacing/75',
            paddingRight: 'spacing/75',
          }
        );
        clear.stroke = 'color/interactive';
        children.push(clear);
      }
      return [
        state,
        F('root', children, flow(640, 'HUG'), 'color/blue-50', {
          ...rounded('spacing/25'),
          itemSpacing: 'spacing/50',
          paddingTop: 'spacing/75',
          paddingBottom: 'spacing/75',
          paddingLeft: 'spacing/75',
          paddingRight: 'spacing/75',
        }),
      ];
    }),
    'Source filter chips. AND structural probe uses eligible Hazard IDs1/2 with unresolved source taxonomy labels; no invented named hazard data.'
  );
  const operator = family(
    'search-facet-operator',
    ['Any', 'All'].map(state => {
      const opts = ['Any', 'All'].map(label => {
        const active = state === label,
          n = F(
            label.toLowerCase(),
            [
              T(
                'label',
                label === 'Any' ? labels.matchModeAny : labels.matchModeAll,
                active ? operatorActive : operatorStyle,
                active ? 'color/interactive' : 'color/neutral-500',
                label + ' label'
              ),
            ],
            flow(
              state === 'Any'
                ? label === 'Any'
                  ? 107.765625
                  : 100.921875
                : label === 'Any'
                  ? 107.046875
                  : 101.65625,
              44.5
            ),
            null,
            {
              strokeWeight: zero,
              strokeBottomWeight: two,
              paddingTop: 'spacing/25',
              paddingBottom: 'spacing/25',
              paddingLeft: 'spacing/50',
              paddingRight: 'spacing/50',
            }
          );
        n.children[0].layout = { width: 'FILL', height: 'HUG' };
        n.stroke = active
          ? 'color/interactive'
          : role('transparent', 'COLOR', () => ({ r: 0, g: 0, b: 0, a: 0 }), [
              'ALL_FILLS',
            ]);
        return n;
      });
      return [
        state,
        F(
          'root',
          [
            F(
              'row',
              [
                T(
                  'label',
                  labels.matchModeGroupLabel,
                  operatorActive,
                  'color/neutral-500',
                  'Prefix'
                ),
                F('toggle', opts, flow('HUG', 44.5), null, {
                  itemSpacing: 'spacing/25',
                }),
              ],
              flow(280, 44.5),
              null,
              { itemSpacing: 'spacing/50' }
            ),
            T(
              'hint',
              state === 'Any'
                ? 'Results include any of the 2 selected'
                : 'Results must match all 2 selected',
              hintStyle,
              'color/neutral-500',
              'Hint'
            ),
          ],
          { mode: 'VERTICAL', width: 280, height: 'HUG', align: 'MIN' },
          null,
          { itemSpacing: 'spacing/50' }
        ),
      ];
    }),
    'Eligible facet OR/AND source control; source two-value English labels; locale wrapping remains open.'
  );
  for (const v of operator.variants) {
    const row = v.tree.children[0];
    row.children[0].layout = {
      width: v.properties.State === 'Any' ? 63.8125 : 63.796875,
      height: 'HUG',
    };
    v.tree.children[1].layout = { width: 'FILL', height: 'HUG' };
  }
  return [form, select, filters, operator];
}
module.exports = { buildSearchControlRecipes };
