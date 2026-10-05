/** Source-owned editorial CTA recipes, separate from conventional Button and Text CTA. */

function buildEditorialCtaRecipes({ root, modes, variables, styles }) {
  const {
    storyRef,
    badgeSize,
    badgeRadius,
    minimum,
    reserve,
    opticalLeft,
    opticalBottom,
    offset,
    hoverOffset,
    consumerWidth,
    heroFocus,
    heroOuter,
    normalOuter,
    typography,
  } =
    require('./figma-maintenance-editorial-cta-assets.cjs').buildEditorialCtaAssets(
      {
        root,
        modes,
        variables,
        styles,
      }
    );
  const family = {
    id: 'editorial-cta',
    name: 'Mangrove/Editorial CTA',
    kind: 'component-set',
    source: storyRef,
    description:
      'Source CtaButton Variant=CTA, separate from conventional Button and Text CTA. Contexts use actual Base and Hero surface paint overrides. HeroSecondary shares HeroPrimary action paint. Type/Outline do not create distinct editorial rest paints; no icon/ghost control is fabricated. Disabled Base is visually the source default but activation is disabled in code. Motion variants show endpoint appearances, not playback. Short is a fit-content source template; Long is the finite260px story consumer with editable text and HUG height. Roboto Bold, source chevron glyph, underlining, wrapping, optical offsets and native focus need real acceptance. RTL, active scaling, composed Hero, custom icons and application interactions remain pending.',
    variants: [],
    review: {
      genericLabels: false,
      width: 320,
      variantSurfaces: {},
      specimens: [],
    },
  };
  const longLabel =
    'Consulter toutes les publications sur la réduction des risques de catastrophe';
  function variant(Context, State, Content = 'Short', Motion = 'NoPreference') {
    const isHero = Context !== 'Base',
      hovered = State === 'Hover',
      focused = State === 'Focus',
      long = Content === 'Long';
    const surface =
      Context === 'HeroTertiary'
        ? 'color/neutral-900'
        : Context === 'HeroQuaternary'
          ? 'color/red-800'
          : 'color/hero';
    const labelPaint = isHero
      ? 'color/neutral-0'
      : hovered
        ? 'color/interactive-active'
        : 'color/text';
    const decorationOffset = hovered
      ? {
          unit: 'PERCENT',
          value: 20,
        }
      : {
          unit: 'AUTO',
        };
    const glyph = {
      type: 'TEXT',
      name: 'mg-button-cta / source chevron',
      id: 'glyph',
      characters: '›',
      textStyle: typography.badge,
      textDecorationOffset: {
        unit: 'AUTO',
      },
      fill: isHero ? surface : 'color/neutral-0',
      stroke: null,
      layout: {
        width: 'HUG',
        height: 'HUG',
      },
      textAlign: 'CENTER',
    };
    const badgeNode = {
      type: 'FRAME',
      name: 'mg-button-cta / badge',
      id: 'badge',
      fill: isHero
        ? 'color/neutral-0'
        : hovered
          ? 'color/interactive-active'
          : 'color/interactive',
      stroke: null,
      layout: {
        mode: 'HORIZONTAL',
        width: badgeSize,
        height: badgeSize,
        justify: 'CENTER',
        align: 'CENTER',
        gap: 'spacing/0',
      },
      bindings: {
        cornerRadius: badgeRadius,
        paddingLeft: opticalLeft,
        paddingBottom: opticalBottom,
      },
      absolute: {
        horizontal: 'END',
        vertical: 'CENTER',
        offsetX: hovered && Motion === 'NoPreference' ? hoverOffset : offset,
        offsetY: 'spacing/0',
      },
      children: [glyph],
    };
    const tree = {
      type: 'FRAME',
      name: 'mg-button mg-button-cta',
      id: 'action',
      fill: null,
      stroke: 'component/color/transparent',
      strokesIncludedInLayout: true,
      layout: {
        mode: 'HORIZONTAL',
        width: long ? consumerWidth : 'HUG',
        height: 'HUG',
        minHeight: minimum,
        align: 'CENTER',
        gap: 'spacing/0',
      },
      bindings: {
        cornerRadius: 'radius/button',
        strokeWeight: 'border-width/button',
        paddingTop: 'spacing/50',
        paddingBottom: 'spacing/50',
        paddingLeft: 'spacing/0',
        paddingRight: reserve,
      },
      children: [
        {
          type: 'TEXT',
          name: 'mg-button-cta / label',
          id: 'label',
          characters: 'Browse all publications',
          textProperty: 'Label',
          textStyleApplication: 'DIRECT',
          textStyle: focused
            ? typography.focus
            : hovered
              ? typography.hover
              : typography.normal,
          textDecoration: hovered || focused ? 'UNDERLINE' : 'NONE',
          textDecorationOffset: decorationOffset,
          textWrap: 'AUTO',
          fill: labelPaint,
          stroke: null,
          layout: {
            width: long ? 'FILL' : 'HUG',
            height: 'HUG',
          },
        },
        badgeNode,
      ],
    };
    if (focused)
      tree.focusRing = {
        color: isHero ? 'color/focus-ring-inverse' : 'color/focus-ring',
        separatorColor: 'color/neutral-0',
        offset: isHero ? heroFocus.offset : 'focus-ring/offset',
        width: isHero ? heroFocus.width : 'focus-ring/width',
        radius: 'radius/button',
        outerRadius: isHero ? heroOuter : normalOuter,
      };
    const id = `editorial-cta.${Context.toLowerCase()}.${State.toLowerCase()}.${Content.toLowerCase()}.${Motion.toLowerCase()}`;
    if (isHero) family.review.variantSurfaces[id] = surface;
    family.variants.push({
      id,
      name: `Context=${Context}, State=${State}, Content=${Content}, Motion=${Motion}`,
      properties: {
        Context,
        State,
        Content,
        Motion,
      },
      tree,
    });
  }
  for (const Context of [
    'Base',
    'HeroPrimary',
    'HeroTertiary',
    'HeroQuaternary',
  ]) {
    for (const State of Context === 'Base'
      ? ['Default', 'Focus', 'Disabled']
      : ['Default', 'Focus'])
      variant(Context, State);
    for (const Motion of ['NoPreference', 'Reduce'])
      variant(Context, 'Hover', 'Short', Motion);
    variant(Context, 'Default', 'Long');
    family.review.specimens.push({
      id: `long-${Context.toLowerCase()}`,
      name: `Source260px long ${Context} action`,
      variant: {
        Context,
        State: 'Default',
        Content: 'Long',
        Motion: 'NoPreference',
      },
      width: 260,
      instanceWidth: consumerWidth,
      ...(Context === 'Base'
        ? {}
        : {
            surface:
              Context === 'HeroTertiary'
                ? 'color/neutral-900'
                : Context === 'HeroQuaternary'
                  ? 'color/red-800'
                  : 'color/hero',
          }),
      properties: {
        Label: longLabel,
      },
    });
  }
  for (const State of ['Hover', 'Focus']) {
    variant('Base', State, 'Long');
    family.review.specimens.push({
      id: `long-base-${State.toLowerCase()}`,
      name: `Source260px long Base ${State} action`,
      variant: {
        Context: 'Base',
        State,
        Content: 'Long',
        Motion: 'NoPreference',
      },
      width: 260,
      instanceWidth: consumerWidth,
      properties: {
        Label: longLabel,
      },
    });
  }
  return [family];
}
module.exports = {
  buildEditorialCtaRecipes,
};
