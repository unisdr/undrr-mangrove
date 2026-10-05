/** Source-owned Chips recipes. Browser measurements do not establish native fidelity. */

function buildChipRecipes({ root, modes, variables, styles }) {
  const {
    ref,
    minimum,
    radius,
    outer,
    glyphSize,
    dismissPadding,
    longWidth,
    narrowLink,
    narrowDismiss,
    labelStyle,
    glyphStyle,
  } = require('./figma-maintenance-chip-assets.cjs').buildChipAssets({
    root,
    modes,
    variables,
    styles,
  });
  const family = {
    id: 'chips',
    name: 'Mangrove/Chips',
    kind: 'component-set',
    source: ref,
    description:
      'Source linked/dismissible Chips with editable Label. No Selected styling exists despite the SCSS header comment. Exact Roboto Medium500 and Regular400 multiplication glyph are required. Short intrinsic template; finite240px Long and measured80px viewport overflow presets have HUG height. Native Disabled dismiss keeps source Default appearance, without browser interaction. Active0.96 transform, combined Hover/Focus, arbitrary min-content sizing, forced colours, motion playback, RTL and all-brand rendering remain pending.',
    variants: [],
    review: {
      genericLabels: false,
      preserveVariantSizing: true,
      width: 320,
      specimens: [],
    },
  };
  function variant(Type, State, Content) {
    const dismiss = Type === 'With X',
      focused = State === 'Focus',
      finite = Content !== 'Short';
    const width =
      Content === 'Long'
        ? longWidth
        : Content === 'Narrow'
          ? dismiss
            ? narrowDismiss
            : narrowLink
          : 'HUG';
    const tree = {
      type: 'FRAME',
      id: 'chip',
      name: dismiss ? 'mg-chip mg-chip__cross' : 'mg-chip',
      fill: State === 'Hover' ? 'color/neutral-300' : 'color/neutral-50',
      stroke: null,
      effectStyle: focused ? null : 'shadow.raised',
      layout: {
        mode: 'HORIZONTAL',
        width,
        height: 'HUG',
        minHeight: minimum,
        align: 'CENTER',
        justify: 'CENTER',
        gap: dismiss ? 'spacing/50' : 'spacing/0',
      },
      bindings: {
        cornerRadius: radius,
        paddingTop: 'spacing/50',
        paddingBottom: 'spacing/50',
        paddingLeft: 'spacing/150',
        paddingRight: dismiss ? dismissPadding : 'spacing/150',
      },
      children: [
        {
          type: 'TEXT',
          id: 'label',
          name: 'mg-chip / label',
          characters: 'Label',
          textProperty: 'Label',
          textStyle: labelStyle,
          textDecoration: 'NONE',
          textWrap: 'AUTO',
          fill: 'color/text',
          stroke: null,
          textAlign: 'LEFT',
          layout: {
            width: finite ? 'FILL' : 'HUG',
            height: 'HUG',
          },
        },
      ],
    };
    if (dismiss)
      tree.children.push({
        type: 'FRAME',
        id: 'dismiss',
        name: 'mg-chip / dismiss mark',
        fill: null,
        stroke: null,
        layout: {
          mode: 'HORIZONTAL',
          width: glyphSize,
          height: glyphSize,
          align: 'CENTER',
          justify: 'CENTER',
          gap: 'spacing/0',
        },
        children: [
          {
            type: 'TEXT',
            id: 'glyph',
            name: 'mg-chip / source multiplication',
            characters: '×',
            textStyle: glyphStyle,
            textDecoration: 'NONE',
            fill: 'color/text',
            stroke: null,
            textAlign: 'CENTER',
            layout: {
              width: 'HUG',
              height: 'HUG',
            },
          },
        ],
      });
    if (focused)
      tree.focusRing = {
        color: 'color/focus-ring',
        separatorColor: 'color/neutral-0',
        offset: 'focus-ring/offset',
        width: 'focus-ring/width',
        radius,
        outerRadius: outer,
      };
    const id = `chips.${dismiss ? 'dismiss' : 'linked'}.${State.toLowerCase()}.${Content.toLowerCase()}`;
    family.variants.push({
      id,
      name: `Type=${Type}, State=${State}, Content=${Content}`,
      properties: {
        Type,
        State,
        Content,
      },
      tree,
    });
  }
  for (const Type of ['Default', 'With X']) {
    for (const State of Type === 'With X'
      ? ['Default', 'Hover', 'Focus', 'Disabled']
      : ['Default', 'Hover', 'Focus'])
      for (const Content of ['Short', 'Long']) variant(Type, State, Content);
    variant(Type, 'Default', 'Narrow');
    for (const Content of ['Long', 'Narrow'])
      family.review.specimens.push({
        id: `${Type === 'With X' ? 'dismiss' : 'linked'}-${Content.toLowerCase()}`,
        name: `Source ${Content === 'Long' ? '240px' : '80px overflowing'} ${Type} chip`,
        variant: {
          Type,
          State: 'Default',
          Content,
        },
        width: Content === 'Long' ? 240 : 80,
        instanceWidth:
          Content === 'Long'
            ? longWidth
            : Type === 'With X'
              ? narrowDismiss
              : narrowLink,
        properties: {
          Label:
            Type === 'With X'
              ? 'Réduction des risques de catastrophe'
              : 'Disaster risk financing and insurance',
        },
      });
  }
  return [family];
}
module.exports = {
  buildChipRecipes,
};
