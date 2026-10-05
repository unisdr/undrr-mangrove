/** Source-owned three-option FullWidth BelowMedium Default wrapper recipes. */
'use strict';

function buildSegmentedWrapperRecipes({
  root,
  modes,
  variables,
  styles,
  families,
}) {
  const {
    buildSegmentedSourceAssets,
  } = require('./figma-maintenance-segmented-source-assets.cjs');
  const packet = buildSegmentedSourceAssets({
    root,
    modes,
    variables,
    styles,
  });
  const fail = message => {
    throw new Error(`Figma Segmented wrapper needs updating: ${message}`);
  };
  const leafId = 'segmented-control.segment';
  const matches = (families || []).filter(family => family.id === leafId);
  const leaf = matches[0];
  if (
    matches.length !== 1 ||
    leaf.kind !== 'component-set' ||
    leaf.variants.length !== 30 ||
    new Set(leaf.variants.map(variant => variant.id)).size !== 30
  )
    fail('One complete Default30 leaf family is required');
  const source = packet.sourceRefs.find(
    ref => ref.file.endsWith('/segmented-control.scss') && ref.normalizedSha256
  );
  if (!source || leaf.source?.normalizedSha256 !== source.normalizedSha256)
    fail('Leaf/source provenance differs');
  for (const selected of ['False', 'True'])
    for (const position of ['First', 'Middle', 'Last']) {
      const variantId = `${leafId}.${selected.toLowerCase()}.default.${position.toLowerCase()}`;
      const variants = leaf.variants.filter(
        variant => variant.id === variantId
      );
      const variant = variants[0],
        label = variant?.tree.children?.[0];
      const paint =
        packet.brands[modes[0].id].paints[
          selected === 'True' ? 'selected' : 'default'
        ];
      if (
        variants.length !== 1 ||
        variant.properties.Selected !== selected ||
        variant.properties.State !== 'Default' ||
        variant.properties.Position !== position ||
        variant.tree.type !== 'FRAME' ||
        variant.tree.name !== 'mg-segmented-control__label' ||
        variant.tree.children.length !== 1 ||
        variant.tree.focusRing ||
        variant.tree.fill !== paint.fill ||
        variant.tree.stroke !== paint.stroke ||
        label?.type !== 'TEXT' ||
        label.name !== 'Segment label' ||
        label.textProperty !== 'Label' ||
        label.textStyle !== 'component.segmented-control.segment' ||
        label.textStyleApplication !== undefined ||
        label.fill !== paint.text
      )
        fail(`Incompatible canonical Default leaf ${variantId}`);
      const role = key => packet.roles[key].name;
      const expectedBindings = {
        strokeWeight: role('border'),
        topLeftRadius: position === 'First' ? role('radius') : role('zero'),
        bottomLeftRadius: position === 'First' ? role('radius') : role('zero'),
        topRightRadius: position === 'Last' ? role('radius') : role('zero'),
        bottomRightRadius: position === 'Last' ? role('radius') : role('zero'),
        paddingTop: role('paddingBlock'),
        paddingBottom: role('paddingBlock'),
        paddingLeft: role('paddingInline'),
        paddingRight: role('paddingInline'),
      };
      const exactObject = (actual, expected) =>
        actual &&
        Object.keys(actual).length === Object.keys(expected).length &&
        Object.entries(expected).every(([key, value]) => actual[key] === value);
      if (
        !exactObject(variant.tree.bindings, expectedBindings) ||
        variant.tree.strokesIncludedInLayout !== true ||
        variant.tree.clipsContent !== false ||
        variant.tree.effectStyle !== null ||
        !exactObject(variant.tree.layout, {
          mode: 'HORIZONTAL',
          width: 'HUG',
          height: 'HUG',
          minHeight: 'component/segmented-control/minimum-height',
          align: 'CENTER',
          justify: 'CENTER',
          gap: role('zero'),
        }) ||
        label.textAlign !== 'CENTER' ||
        label.textDecoration !== 'NONE' ||
        label.textWrap !== 'AUTO' ||
        !exactObject(label.layout, {
          width: 'HUG',
          height: 'HUG',
        })
      )
        fail(`Canonical Default leaf geometry differs at ${variantId}`);
    }
  const { seamName, body } =
    require('./figma-maintenance-segmented-wrapper-assets.cjs').buildSegmentedWrapperAssets(
      {
        root,
        modes,
        variables,
        styles,
        packet,
        source,
      }
    );
  const id = 'segmented-control.full-width-below-medium';
  return [
    {
      id,
      name: 'Mangrove/Segmented control/FullWidth BelowMedium',
      kind: 'component-set',
      source,
      description:
        'Source three-option FullWidth fieldset presets with Selection None/Depth/Frequency/Exposure, editable shared16/24 Legend and actual exposed native leaf Labels. State Default only; viewport BelowMedium is explicit and independent of consumer width. New native composition/edited/fresh/repeat acceptance is pending. No per-item z-index, Hover/Focus, Small, intrinsic wrap, arbitrary option count or browser behavior is claimed.',
      dependencies: [leafId],
      externalSpacing: {
        bottom: 'spacing/100',
        limitation:
          'Source external fieldset margin is excluded from its border box. Use source spacing/100 in the containing vertical stack; no fake internal bottom padding is added.',
      },
      coverage: {
        included: [
          'Source FullWidth three-option Default presets',
          'Actual First/Middle/Last leaf instances with shared120% styles and inherited labelSizing FILL',
          'Editable Legend and exposed native Label properties',
        ],
        pending: [
          'All native composition geometry/paint/edited/fresh/rebuild acceptance',
          'Per-item source paint priority, Hover/Focus, intrinsic wrap, MediumUp legend, Small and arbitrary source options/hooks',
          'Native font-file parity, RTL/scripts, browser/prototype/accessibility behavior',
        ],
      },
      review: {
        genericLabels: false,
        preserveVariantSizing: true,
        width: 390,
      },
      variants: ['None', 'Depth', 'Frequency', 'Exposure'].map(selection => ({
        id: `${id}.${selection.toLowerCase()}`,
        name: `Selection=${selection}`,
        properties: {
          Selection: selection,
        },
        tree: {
          type: 'FRAME',
          id: 'control',
          name: 'mg-segmented-control',
          fill: null,
          stroke: null,
          effectStyle: null,
          clipsContent: false,
          layout: {
            mode: 'VERTICAL',
            width: 390,
            height: 'HUG',
            gap: 'spacing/25',
            align: 'MIN',
            justify: 'MIN',
          },
          children: [
            {
              type: 'TEXT',
              id: 'legend',
              name: 'mg-segmented-control__legend',
              characters: 'Map layer',
              textProperty: 'Legend',
              visibilityProperty: 'Show legend',
              visible: true,
              textStyle: body.id,
              textDecoration: 'NONE',
              textWrap: 'AUTO',
              fill: packet.roles.legendColor.name,
              stroke: null,
              layout: {
                width: 'FILL',
                height: 'HUG',
              },
            },
            {
              type: 'FRAME',
              id: 'rail',
              name: 'mg-segmented-control__group',
              fill: null,
              stroke: null,
              effectStyle: null,
              clipsContent: false,
              layout: {
                mode: 'HORIZONTAL',
                width: 'FILL',
                height: 'HUG',
                gap: seamName,
                wrap: 'NO_WRAP',
                align: 'MIN',
                justify: 'MIN',
              },
              children: ['First', 'Middle', 'Last'].map((position, i) => ({
                type: 'INSTANCE',
                id: `option-${i + 1}`,
                name: `mg-segmented-control__label ${position}`,
                family: leafId,
                variant: {
                  Selected:
                    packet.labels.default[i] === selection ? 'True' : 'False',
                  State: 'Default',
                  Position: position,
                },
                expose: true,
                overrides: {
                  Label: packet.labels.default[i],
                },
                labelSizing: 'FILL',
                layout: {
                  width: 'FILL',
                  height: 'FILL',
                },
              })),
            },
          ],
        },
      })),
    },
  ];
}
module.exports = {
  buildSegmentedWrapperRecipes,
};
