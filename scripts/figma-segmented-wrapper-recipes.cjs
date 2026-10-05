/** Source-owned three-option FullWidth BelowMedium Default wrapper recipes. */
'use strict';
const fs = require('fs');
const path = require('path');
function buildSegmentedWrapperRecipes({
  root,
  modes,
  variables,
  styles,
  families,
}) {
  const { buildSegmentedJoiningCapability } = require(
    path.join(root, 'scripts/figma-segmented-probe.cjs')
  );
  const packet = buildSegmentedJoiningCapability({
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
        !exactObject(label.layout, { width: 'HUG', height: 'HUG' })
      )
        fail(`Canonical Default leaf geometry differs at ${variantId}`);
    }
  // This scope intentionally has no focus/hover and no fabricated per-item z.
  // Default selected and unselected border roles currently resolve identically.
  // A future theme divergence requires actual independent active-seam paint.
  for (const mode of modes) {
    const brand = packet.brands[mode.id];
    const a = brand.resolvedRoles.background,
      b = brand.resolvedRoles.outline;
    if (
      !a ||
      !b ||
      a.a !== 1 ||
      b.a !== 1 ||
      !['r', 'g', 'b', 'a'].every(field => a[field] === b[field])
    )
      fail(
        `Default seam paint roles diverged in ${mode.id}; implement source stacking before generating these presets`
      );
  }
  const leafStyles = styles.text.filter(
    style => style.id === 'component.segmented-control.segment'
  );
  const leafStyle = leafStyles[0];
  if (
    leafStyles.length !== 1 ||
    leafStyle.source?.file !== source.file ||
    leafStyle.source?.normalizedSha256 !== source.normalizedSha256 ||
    leafStyle.bindings?.fontFamily !== packet.roles.fontFamily.name ||
    leafStyle.bindings?.fontSize !== packet.roles.fontSize.name
  )
    fail('Exact shared Default leaf typography template is required');
  for (const mode of modes) {
    const expected = packet.brands[mode.id].typography.segment,
      actual = leafStyle.values?.[mode.id];
    if (
      !actual ||
      JSON.stringify(actual.fontName) !== JSON.stringify(expected.fontName) ||
      actual.fontSize !== expected.fontSize ||
      actual.lineHeight?.unit !== 'PERCENT' ||
      actual.lineHeight.value !== expected.lineHeight.value ||
      (actual.textDecoration || 'NONE') !== 'NONE' ||
      (actual.textWrapStyle || 'AUTO') !== 'AUTO'
    )
      fail(`Shared Default leaf typography differs in ${mode.id}`);
  }
  const bodies = styles.text.filter(style => style.id === 'component.body');
  const body = bodies[0];
  if (
    bodies.length !== 1 ||
    (body.type !== undefined && body.type !== 'TEXT') ||
    body.source?.file !== 'stories/assets/scss/_foundational.scss' ||
    body.bindings?.fontFamily !== packet.roles.fontFamily.name ||
    body.bindings?.fontSize !== packet.roles.legendFontSize.name
  )
    fail('Exact inherited body text template is required');
  for (const mode of modes) {
    const desired = packet.brands[mode.id].typography.legend,
      actual = body.values?.[mode.id];
    if (
      !actual ||
      JSON.stringify(actual.fontName) !== JSON.stringify(desired.fontName) ||
      actual.fontSize !== desired.fontSize ||
      actual.lineHeight?.unit !== 'PIXELS' ||
      actual.lineHeight.value !== desired.lineHeight.value ||
      (actual.textDecoration || 'NONE') !== 'NONE' ||
      (actual.textWrapStyle || 'AUTO') !== 'AUTO'
    )
      fail(`Inherited BelowMedium legend typography differs in ${mode.id}`);
  }
  for (const name of ['spacing/25', 'spacing/100']) {
    const definitions = variables.filter(value => value.name === name);
    if (
      definitions.length !== 1 ||
      definitions[0].type !== 'FLOAT' ||
      definitions[0].id !== name.replaceAll('/', '.')
    )
      fail(`Missing exact spacing role ${name}`);
  }
  const seamName = 'component/segmented-control/seam';
  const text = fs.readFileSync(path.join(root, source.file), 'utf8');
  const seamExpression =
    /margin-inline-start: calc\(-1 \* var\(--mg-border-width-button\)\)/;
  const match = seamExpression.exec(text);
  if (!match) fail('Source negative-border join changed');
  const seam = {
    id: seamName.replaceAll('/', '.'),
    name: seamName,
    type: 'FLOAT',
    scopes: ['GAP'],
    hiddenFromPublishing: false,
    source: { ...source, line: text.slice(0, match.index).split('\n').length },
    description:
      'Source margin-inline-start is negative border-width/button for every segment after the first. Binding this value as a native auto-layout gap preserves the three-option single-row seam; source wrapped-row offset is outside this FullWidth-only scope.',
    codeSyntax: { WEB: 'calc(-1 * var(--mg-border-width-button))' },
    values: Object.fromEntries(
      modes.map(mode => [mode.id, -packet.brands[mode.id].geometry.border])
    ),
  };
  const collisions = variables.filter(
    value => value.id === seam.id || value.name === seam.name
  );
  if (
    collisions.length > 1 ||
    collisions.some(
      value =>
        value.id !== seam.id ||
        value.name !== seam.name ||
        value.type !== 'FLOAT'
    )
  )
    fail('Ambiguous or incompatible source seam helper');
  // All validation above precedes the sole appended/replaced definition.
  const index = variables.findIndex(value => value.id === seam.id);
  if (index < 0) variables.push(seam);
  else variables[index] = seam;
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
      review: { genericLabels: false, preserveVariantSizing: true, width: 390 },
      variants: ['None', 'Depth', 'Frequency', 'Exposure'].map(selection => ({
        id: `${id}.${selection.toLowerCase()}`,
        name: `Selection=${selection}`,
        properties: { Selection: selection },
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
              layout: { width: 'FILL', height: 'HUG' },
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
                overrides: { Label: packet.labels.default[i] },
                labelSizing: 'FILL',
                layout: { width: 'FILL', height: 'FILL' },
              })),
            },
          ],
        },
      })),
    },
  ];
}
module.exports = { buildSegmentedWrapperRecipes };
