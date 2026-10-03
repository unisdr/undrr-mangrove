/** Bounded, source-backed text-only CTA recipes. Integrated by the main exporter. */
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

function buildTextCtaRecipes({ root, modes, variables, styles }) {
  const files = new Map();
  const read = file => {
    if (!files.has(file))
      files.set(file, fs.readFileSync(path.join(root, file), 'utf8'));
    return files.get(file);
  };
  const cta = 'stories/Components/TextCta/text-cta.scss';
  const jsx = 'stories/Components/TextCta/TextCta.jsx';
  const container = 'stories/Atom/Layout/Container/container.scss';
  const utilities = 'stories/assets/scss/_utility.scss';
  const foundation = 'stories/assets/scss/_foundational.scss';
  const tokenFile = 'tokens/mangrove.yaml';
  function source(file, pattern) {
    const match = pattern.exec(read(file));
    if (!match)
      throw new Error(
        `Figma CTA recipe needs updating: ${file} no longer matches ${pattern}`
      );
    return { file, line: read(file).slice(0, match.index).split('\n').length };
  }
  const byName = new Map(variables.map(variable => [variable.name, variable]));
  function value(name, mode, visited = new Set()) {
    if (visited.has(name)) throw new Error(`Circular CTA alias: ${name}`);
    visited.add(name);
    const variable = byName.get(name);
    const entry = variable?.values[mode.id];
    if (entry == null)
      throw new Error(`Missing CTA variable ${name}/${mode.id}`);
    return entry.alias ? value(entry.alias, mode, visited) : entry;
  }
  const perMode = get =>
    Object.fromEntries(modes.map(mode => [mode.id, get(mode)]));
  function add(name, type, get, description, ref, codeSyntax = {}) {
    if (byName.has(name)) return name;
    const variable = {
      id: name.replaceAll('/', '.'),
      name,
      type,
      description,
      source: ref,
      scopes: type === 'COLOR' ? ['ALL_SCOPES'] : ['WIDTH_HEIGHT'],
      hiddenFromPublishing: false,
      codeSyntax,
      values: perMode(get),
    };
    variables.push(variable);
    byName.set(name, variable);
    return name;
  }
  const max = /max-width: ([\d.]+)px;/.exec(read(cta));
  const bodyMax = add(
    'component/text-cta/body-max-width',
    'FLOAT',
    () => Number(max?.[1]),
    'Maximum copy width of the stacked text-only CTA.',
    source(cta, /&__body\s*\{\s*max-width: [\d.]+px;/)
  );
  const inset = /padding-right: mg-rem\(([\d.]+)\);/.exec(read(container));
  source(container, /padding-left: mg-rem\(10\);/);
  if (Number(inset?.[1]) !== 10)
    throw new Error('CTA container gutters changed.');
  const innerPadding = add(
    'component/text-cta/container-inline-padding',
    'FLOAT',
    () => Number(inset[1]),
    'Source mg-container gutter, separate from the CTA outer padding.',
    source(container, /padding-right: mg-rem\([\d.]+\);/)
  );
  const bodyAlpha =
    /color: rgb\(var\(--mg-color-neutral-0\) \/ ([\d.]+)\);/.exec(read(cta));
  const strongBody = add(
    'component/text-cta/strong-body',
    'COLOR',
    mode => ({ ...value('color/neutral-0', mode), a: Number(bodyAlpha?.[1]) }),
    'Strong CTA body colour with source alpha. Alpha is resolved because variable aliases cannot change it.',
    source(
      cta,
      /\.mg-cta__text\s*\{\s*color: rgb\(var\(--mg-color-neutral-0\) \/ [\d.]+\);/
    ),
    { WEB: `rgb(var(--mg-color-neutral-0) / ${bodyAlpha?.[1]})` }
  );
  const borderAlpha =
    /--mg-border-color-button-primary: rgb\(var\(--mg-color-neutral-0\) \/ ([\d.]+)\);/.exec(
      read(cta)
    );
  const strongBorder = add(
    'component/text-cta/strong-action-border',
    'COLOR',
    mode => ({
      ...value('color/neutral-0', mode),
      a: Number(borderAlpha?.[1]),
    }),
    'Conventional primary action border on a strong CTA surface.',
    source(
      cta,
      /--mg-border-color-button-primary: rgb\(var\(--mg-color-neutral-0\) \/ [\d.]+\);/
    ),
    { WEB: `rgb(var(--mg-color-neutral-0) / ${borderAlpha?.[1]})` }
  );
  const wash =
    /rgb\(var\(--mg-cta-accent\) \/ ([\d.]+)\),\s*rgb\(var\(--mg-cta-accent\) \/ \1\)/.exec(
      read(cta)
    );
  const softSurface = add(
    'component/text-cta/primary-soft-surface',
    'COLOR',
    mode => {
      const accent = value('color/hero', mode);
      const base = value('color/neutral-0', mode);
      const alpha = Number(wash?.[1]);
      return {
        r: accent.r * alpha + base.r * (1 - alpha),
        g: accent.g * alpha + base.g * (1 - alpha),
        b: accent.b * alpha + base.b * (1 - alpha),
        a: 1,
      };
    },
    'Opaque equivalent of the uniform source primary accent wash over the neutral-0 surface. This represents the constant gradient, not an alias or an invented brand colour.',
    source(
      cta,
      /background-image: linear-gradient\(\s*rgb\(var\(--mg-cta-accent\) \/ [\d.]+\),/
    )
  );
  if (!bodyAlpha || !borderAlpha || !wash)
    throw new Error('CTA alpha expressions changed.');
  source(cta, /padding: var\(--mg-cta-padding\);/);
  source(
    cta,
    /flex-wrap: wrap;\s*gap: var\(--mg-spacing-100\);\s*margin-top: var\(--mg-spacing-150\);/
  );
  source(
    cta,
    /\.mg-cta__headline\s*\{\s*color: rgb\(var\(--mg-color-white\)\);\s*font-weight: 700;\s*margin-bottom: var\(--mg-spacing-100\);/
  );
  source(
    cta,
    /a\.mg-button-primary:not\(\.mg-button-cta\)\s*\{\s*background-color: rgb\(var\(--mg-color-neutral-0\)\);/
  );
  source(cta, /color: rgb\(var\(--mg-color-hero\)\);/);
  source(
    cta,
    /\.mg-cta__eyebrow,\s*\.mg-cta__headline\s*\{\s*color: rgb\(var\(--mg-color-neutral-900\)\);/
  );
  source(
    cta,
    /\.mg-cta__text\s*\{\s*color: rgb\(var\(--mg-color-neutral-800\)\);/
  );
  source(jsx, /headlineSize = '600'/);
  source(jsx, /centered = true,\s*layout = 'stacked'/);
  source(jsx, /Variant=\{btn.variant\}/);
  source(
    foundation,
    /caption\s*\{\s*margin: var\(--mg-spacing-100\) var\(--mg-spacing-0\);/
  );
  source(foundation, /caption\s*\{[^}]*text-wrap: balance;/);
  const headingRef = source(
    utilities,
    /\.mg-u-font-size-600\s*\{\s*font-size: var\(--mg-font-size-500\);\s*line-height: var\(--mg-font-line-height-500\);\s*@include devicebreak\(medium\)\s*\{\s*font-size: var\(--mg-font-size-600\);/
  );
  const ratioToken = YAML.parse(read(tokenFile))['font-line-height']['500']
    .$value;
  const ratio = /^([\d.]+)em$/.exec(ratioToken);
  if (!ratio)
    throw new Error('CTA heading line-height no longer has an em ratio.');
  source('stories/assets/fonts/roboto/sass/_Bold.scss', /font-weight: 700/);
  function headingStyle(viewport, size) {
    const id = `component.text-cta.heading.${viewport.toLowerCase()}`;
    const definition = {
      id,
      name: `Mangrove/component/text-cta/heading/${viewport.toLowerCase()}`,
      recommended: false,
      component: true,
      source: headingRef,
      description:
        'Default Latin text-only CTA heading. Latin headings inherit the surrounding text face; this binds the current default text role, not the optional display/UI face. Viewport variants represent CSS utility size changes; resizing a Figma instance does not switch variants. CSS balanced wrapping remains unverified in Figma.',
      typography: {
        requestedWeight: 700,
        bundledWeight: 700,
        lineHeightRatio: Number(ratio[1]),
        lineHeightBasis: 'own-font-size',
        verification:
          'Fresh SCSS and actual React source measured in isolated Chromium on 3 October 2026; native font-file and wrap parity require Figma review.',
      },
      bindings: {
        fontFamily: 'font-family/text',
        fontSize: `font-size/${size}`,
      },
      values: perMode(mode => ({
        fontName: { family: value('font-family/text', mode), style: 'Bold' },
        fontSize: value(`font-size/${size}`, mode),
        lineHeight: { unit: 'PERCENT', value: Number(ratio[1]) * 100 },
      })),
    };
    const index = styles.text.findIndex(style => style.id === id);
    if (index < 0) styles.text.push(definition);
    else styles.text[index] = definition;
    return id;
  }
  const headings = {
    Desktop: headingStyle('Desktop', '600'),
    Mobile: headingStyle('Mobile', '500'),
  };
  if (!styles.text.some(style => style.id === 'component.body'))
    throw new Error('CTA requires the existing body style.');
  const frame = (name, children, layout = {}, fill = null) => ({
    type: 'FRAME',
    name,
    layout: {
      mode: 'VERTICAL',
      width: 'FILL',
      height: 'HUG',
      gap: 'spacing/0',
      ...layout,
    },
    fill,
    stroke: null,
    children,
  });
  const text = (name, characters, textStyle, fill, textProperty) => ({
    type: 'TEXT',
    name,
    characters,
    textStyle,
    fill,
    textProperty,
    textAlign: 'CENTER',
    ...(name === 'mg-cta__headline' ? { textWrap: 'BALANCE' } : {}),
    layout: { width: 'FILL', height: 'HUG' },
  });
  const actionPath = [
    'mg-cta__inner',
    'mg-cta__body',
    'mg-cta__actions',
    'mg-cta__action',
  ];
  const longLabel =
    'A longer Mangrove action label to check resizing and wrapping';
  // Bounded specimen seeds, not a CSS flex-shrink engine. Button geometry varies
  // between brands, so derive the native Label width for each imported mode.
  const reviewGeometry = new Map();
  for (const width of [320, 240]) {
    const available = add(
      `component/text-cta/review-action-width-${width}`,
      'FLOAT',
      mode =>
        width - 2 * value('cta/padding', mode) - 2 * value(innerPadding, mode),
      `Initial ${width}px review action width after source CTA padding and container gutters. Specimen geometry, not a public CSS role.`,
      source(cta, /padding: var\(--mg-cta-padding\);/)
    );
    const label = add(
      `component/text-cta/review-label-width-${width}`,
      'FLOAT',
      mode =>
        value(available, mode) -
        2 * value('padding/button/inline', mode) -
        2 * value('border-width/button', mode),
      `Initial ${width}px review Label width after source Button padding and border. Native layout needs visual acceptance.`,
      source(
        'stories/Components/Buttons/CtaButton/cta-button.scss',
        /padding: var\(--mg-padding-button\);\s*border: var\(--mg-border-width-button\)/
      )
    );
    for (const mode of modes)
      if (value(label, mode) <= 0)
        throw new Error(
          `CTA review label has no available width for ${mode.id}.`
        );
    reviewGeometry.set(width, { available, label });
  }
  const families = [
    {
      id: 'text-cta',
      name: 'Mangrove/Text CTA',
      kind: 'component-set',
      source: source(jsx, /export function TextCta\(/),
      description:
        'Primary, stacked, centered text-only CTA with one conventional primary action. The Default Storybook story uses the separate editorial CTA treatment, which is outside this bounded scaffold. Headline and plain body are editable; action remains a native Button instance. Desktop and Mobile are explicit viewport typography variants, not automatic breakpoints.',
      variants: [],
      review: {
        genericLabels: false,
        specimens: [320, 240].map(width => ({
          id: `long-action-${width}`,
          name: `Long action in ${width}px CTA, measured source boundary`,
          variant: {
            Tone: 'Strong',
            Viewport: width === 320 ? 'Mobile' : 'Narrow',
            Content: 'Long',
          },
          width,
          properties: {},
          nodes: [
            {
              path: actionPath,
              properties: { Label: longLabel },
            },
          ],
        })),
      },
    },
  ];
  for (const Tone of ['Soft', 'Strong'])
    for (const Viewport of ['Desktop', 'Mobile']) {
      const strong = Tone === 'Strong';
      const action = {
        type: 'INSTANCE',
        name: 'mg-cta__action',
        family: 'button',
        expose: true,
        variant: { Emphasis: 'Primary', Treatment: 'Filled', State: 'Default' },
        overrides: { Label: 'Read more' },
        layout: { width: 'HUG', height: 'HUG' },
        ...(strong
          ? {
              appearance: {
                fill: 'color/neutral-0',
                stroke: strongBorder,
                labelFill: 'color/hero',
              },
            }
          : {}),
      };
      const body = frame(
        'mg-cta__body',
        [
          frame(
            'mg-cta__content',
            [
              text(
                'mg-cta__headline',
                'Turn knowledge into action',
                headings[Viewport],
                strong ? 'color/white' : 'color/neutral-900',
                'Headline'
              ),
              text(
                'mg-cta__text',
                'Discover practical resources and connect with people working to reduce disaster risk.',
                'component.body',
                strong ? strongBody : 'color/neutral-800',
                'Body'
              ),
            ],
            { gap: 'spacing/100' }
          ),
          frame('mg-cta__actions', [action], {
            mode: 'HORIZONTAL',
            wrap: 'WRAP',
            gap: 'spacing/100',
            counterGap: 'spacing/100',
            justify: 'CENTER',
            align: 'CENTER',
          }),
        ],
        { maxWidth: bodyMax, gap: 'spacing/150' }
      );
      const tree = frame(
        'mg-cta',
        [
          frame(
            'mg-cta__inner',
            [
              frame('mg-cta__headline-leading-margin', [], {
                height: 'spacing/100',
              }),
              body,
            ],
            {
              padding: { block: 'spacing/0', inline: innerPadding },
              align: 'CENTER',
            }
          ),
        ],
        {
          width: Viewport === 'Desktop' ? 720 : 320,
          padding: { block: 'cta/padding', inline: 'cta/padding' },
        },
        strong ? 'color/hero' : softSurface
      );
      const properties = { Tone, Viewport, Content: 'Short' };
      families[0].variants.push({
        id: `text-cta.${Tone.toLowerCase()}.${Viewport.toLowerCase()}`,
        name: `Tone=${Tone}, Viewport=${Viewport}, Content=Short`,
        properties,
        tree,
      });
    }
  // Figma ignores geometry edits on instances nested inside consumer instances.
  // Put finite-width action policy on each bounded master; review only edits text.
  const mobile = families[0].variants.find(
    entry => entry.id === 'text-cta.strong.mobile'
  );
  for (const width of [320, 240]) {
    const tree = JSON.parse(JSON.stringify(mobile.tree));
    tree.layout.width = width;
    let action = tree;
    for (const name of actionPath)
      action = action.children.find(child => child.name === name);
    action.layout.width = reviewGeometry.get(width).available;
    action.labelSizing = 'FILL';
    action.overrides.Label = longLabel;
    const Viewport = width === 320 ? 'Mobile' : 'Narrow';
    families[0].variants.push({
      id: `text-cta.strong.${Viewport.toLowerCase()}.long`,
      name: `Tone=Strong, Viewport=${Viewport}, Content=Long`,
      properties: { Tone: 'Strong', Viewport, Content: 'Long' },
      tree,
    });
  }
  function identity(node, parent = '') {
    node.id = parent ? `${parent}/${node.name}` : node.name;
    for (const name of [
      node.fill,
      node.stroke,
      node.layout?.gap,
      node.layout?.counterGap,
      node.layout?.maxWidth,
      node.layout?.padding?.block,
      node.layout?.padding?.inline,
      ...Object.values(node.appearance || {}),
    ].filter(Boolean))
      if (!byName.has(name))
        throw new Error(`Missing CTA recipe variable ${name}`);
    for (const child of node.children || []) identity(child, node.id);
  }
  for (const entry of families[0].variants) identity(entry.tree);
  return families;
}

module.exports = { buildTextCtaRecipes };
