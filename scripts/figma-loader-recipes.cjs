/** Source-owned static Loader presets. Rotation and responsive switching are not native behavior. */
'use strict';

function buildLoaderRecipes({ root, modes, variables }) {
  const { anatomy, presets } =
    require('./figma-maintenance-loader-assets.cjs').buildLoaderAssets({
      root,
      modes,
      variables,
    });
  const variants = presets.map(([Viewport, side, border, sourceRef, size]) => {
    const suffix = Viewport === 'BelowMedium' ? 'below-medium' : 'medium-up';
    return {
      id: `loader.${suffix}`,
      name: `Viewport=${Viewport}`,
      properties: {
        Viewport,
      },
      sourceRef,
      sourceGeometry: {
        borderWidth: border,
        innerRadius: (side - 2 * border) / side,
        rotationDegrees: 0,
      },
      tree: {
        type: 'FRAME',
        id: 'root',
        name: 'mg-loader',
        layout: {
          mode: 'NONE',
          width: size,
          height: size,
          clipsContent: false,
        },
        children: [
          {
            type: 'ELLIPSE',
            id: 'body',
            name: 'Blue border',
            fill: 'color/blue-600',
            arcData: {
              startingAngle: (7 * Math.PI) / 4,
              endingAngle: (13 * Math.PI) / 4,
              innerRadius: (side - 2 * border) / side,
            },
            layout: {
              width: size,
              height: size,
            },
            position: {
              x: 0,
              y: 0,
            },
          },
          {
            type: 'ELLIPSE',
            id: 'top',
            name: 'Neutral top border',
            fill: 'color/neutral-300',
            arcData: {
              startingAngle: (5 * Math.PI) / 4,
              endingAngle: (7 * Math.PI) / 4,
              innerRadius: (side - 2 * border) / side,
            },
            layout: {
              width: size,
              height: size,
            },
            position: {
              x: 0,
              y: 0,
            },
          },
        ],
      },
    };
  });
  return [
    {
      id: 'loader',
      name: 'Mangrove/Loader',
      kind: 'component-set',
      sourceRef: anatomy,
      review: {
        genericLabels: false,
        preserveVariantSizing: true,
      },
      limitations: [
        'Static zero-degree source frame only. Source rotation2s linear infinite and reduced-motion behavior are documented, not prototyped.',
        'BelowMedium/MediumUp are explicit40/96px presets, not live48em responsive sizing.',
        'Native annular sector innerRadius has no variable binding. Geometry changes require regeneration; arbitrary size/ring edits are not responsive CSS.',
        'The source accessible label is hidden and is not fabricated as visible text. Screen-reader/live-region semantics belong to code.',
        'CSS border joins and native ellipse rasterization require actual source/native comparison; mocks do not establish pixel equivalence.',
      ],
      variants,
    },
  ];
}
module.exports = {
  buildLoaderRecipes,
};
