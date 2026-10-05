/** Source-owned seven-shape StatusLabel. Native acceptance remains pending. */
'use strict';

function buildStatusLabelRecipes({ root, modes, variables, styles }) {
  const {
    anatomy,
    status,
    gap,
    color,
    ringColor,
    S,
    R,
    size,
    ring,
    cornerRatio,
    corner,
    fills,
    number,
    dims,
    polygons,
    labelStyle,
  } =
    require('./figma-maintenance-status-label-assets.cjs').buildStatusLabelAssets(
      {
        root,
        modes,
        variables,
        styles,
      }
    );
  const round = n => Number(n.toFixed(8));
  function svg(slug, layer, side, markup, fill, stroke, position) {
    return {
      type: 'SVG',
      id: layer,
      name: `${slug} / source ${layer}`,
      layout: {
        width: round(side),
        height: round(side),
      },
      position,
      svg: {
        assetId: `status-label-${slug}-${layer}`,
        markup: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${round(side)} ${round(side)}">${markup}</svg>`,
        monochrome: {
          ...(fill
            ? {
                fills: fill,
              }
            : {}),
          ...(stroke
            ? {
                strokes: stroke,
              }
            : {}),
        },
      },
    };
  }
  const variants = status.map(([Status, slug, sourceLabel]) => {
    const [w, h] = dims[slug],
      x = round((S - w) / 2),
      y = round((S - h) / 2),
      fill = fills.get(slug);
    let shape;
    if (slug === 'neutral' || slug === 'published')
      shape = [
        {
          type: 'ELLIPSE',
          id: 'indicator',
          name: 'Circular source indicator',
          fill,
          stroke: ringColor,
          bindings: {
            strokeWeight: ring,
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
      ];
    else if (slug === 'draft' || slug === 'waiting-information')
      shape = [
        {
          type: 'FRAME',
          id: 'indicator',
          name: 'Rounded source indicator',
          fill,
          stroke: ringColor,
          bindings: {
            strokeWeight: ring,
            cornerRadius: slug === 'draft' ? corner : size,
          },
          layout: {
            mode: 'NONE',
            width: number(slug, 'width', w),
            height: number(slug, 'height', h),
            clipsContent: false,
          },
          position: {
            x,
            y,
          },
          children: [],
        },
      ];
    else if (slug === 'waiting-validation') {
      // One source ring width of transparent padding outside its rotated AABB.
      const side = Math.ceil(w * Math.SQRT2) + 2 * R,
        mid = side / 2,
        inset = (side - w) / 2 + R / 2;
      shape = [
        svg(
          slug,
          'diamond',
          side,
          `<rect x="${round(inset)}" y="${round(inset)}" width="${round(w - R)}" height="${round(h - R)}" rx="${round(S * cornerRatio - R / 2)}" fill="#000000" stroke="#666666" stroke-width="${R}" transform="rotate(45 ${mid} ${mid})"/>`,
          fill,
          ringColor,
          {
            x: (S - side) / 2,
            y: (S - side) / 2,
          }
        ),
      ];
    } else {
      const geometry = polygons[slug],
        outer = geometry.outer.map(([a, b]) => [(w * a) / 100, (h * b) / 100]),
        inner = outer.map((p, i) =>
          p.map((n, axis) => n + geometry.offsets[i][axis] * R)
        );
      const markup = points =>
        `<polygon points="${points.map(p => p.map(round).join(',')).join(' ')}" fill="#000000"/>`;
      shape = [
        svg(slug, 'outer-ring', w, markup(outer), ringColor, null, {
          x,
          y,
        }),
        svg(slug, 'inner-fill', w, markup(inner), fill, null, {
          x,
          y,
        }),
      ];
    }
    return {
      id: `status-label.${slug}`,
      name: `Status=${Status}`,
      properties: {
        Status,
      },
      sourceRef: anatomy,
      sourceLabel,
      sourceGeometry: {
        indicatorSize: S,
        shapeWidth: round(w),
        shapeHeight: round(h),
        marginInline: x,
        cornerRatio,
        ringWidth: R,
        rotationDegrees: slug === 'waiting-validation' ? 45 : 0,
        polygon: polygons[slug] ?? null,
        derivation:
          'Guarded SCSS geometry. SVG markup is generated from the source, not an existing icon asset; native viewport/pixel acceptance pending.',
      },
      tree: {
        type: 'FRAME',
        id: 'root',
        name:
          slug === 'neutral'
            ? 'mg-status-label'
            : `mg-status-label mg-status-label--${slug}`,
        fill: null,
        stroke: null,
        layout: {
          mode: 'HORIZONTAL',
          width: 'HUG',
          height: 'HUG',
          align: 'CENTER',
          gap,
          clipsContent: false,
        },
        children: [
          {
            type: 'FRAME',
            id: 'slot',
            name: '14px source indicator allocation',
            fill: null,
            stroke: null,
            layout: {
              mode:
                slug === 'draft' || slug === 'waiting-information'
                  ? 'HORIZONTAL'
                  : 'NONE',
              justify: 'CENTER',
              align: 'CENTER',
              width: size,
              height: size,
              clipsContent: false,
            },
            children: shape,
          },
          {
            type: 'TEXT',
            id: 'label',
            name: 'Status name',
            characters: 'Published',
            textProperty: 'Label',
            textStyle: labelStyle,
            textDecoration: 'NONE',
            textWrap: 'AUTO',
            fill: color,
            stroke: null,
            layout: {
              width: 'HUG',
              height: 'HUG',
            },
          },
        ],
      },
    };
  });
  return [
    {
      id: 'status-label',
      name: 'Mangrove/Status label',
      kind: 'component-set',
      sourceRef: anatomy,
      description:
        'All seven authored non-interactive status geometries with one required editable Label. Published is the stable shared property default matching the source Default story; source names are seeded only on fresh review specimens. Status changes the indicator; Label remains independent editable text, with no automatic name synchronization.',
      limitations: [
        'Intrinsic masters only. Native finite-width edited-label wrapping/overflow and automatic CSS min-content sizing are unverified.',
        'Circle/radii/ring, rounded diamond SVG and both exact polygon contours require native/source pixel and viewport acceptance.',
        'SVG geometry is source-derived at build time and cannot bind every vertex to public size/ring roles. Rebuild after source geometry changes; arbitrary native scaling is not responsive CSS.',
        'Grouped LI baseline/wrapping and table/dense/RTL/forced-colour/print contexts are not implemented by these standalone masters. Arabic font availability and native script routing are unverified.',
        'No Hover/Focus/Disabled/Selected variant: source SPAN is non-focusable and has no authored interactive treatment.',
      ],
      review: {
        genericLabels: false,
        preserveVariantSizing: true,
        specimens: status.map(([Status, slug, label]) => ({
          id: `source-${slug}`,
          name: `Source ${label}`,
          variant: {
            Status,
          },
          width: 390,
          properties: {
            Label: label,
          },
        })),
      },
      variants,
    },
  ];
}
module.exports = {
  buildStatusLabelRecipes,
};
