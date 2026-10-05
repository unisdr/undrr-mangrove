/** Source-backed Segmented wrapper asset derivation, without component anatomy. */
'use strict';

const fs = require('fs');
const path = require('path');
const {
  buildSegmentedSourceAssets,
} = require('./figma-maintenance-segmented-source-assets.cjs');
function buildSegmentedWrapperAssets({
  root,
  modes,
  variables,
  styles,
  packet: suppliedPacket,
  source: suppliedSource,
}) {
  const packet =
    suppliedPacket ||
    buildSegmentedSourceAssets({
      root,
      modes,
      variables,
      styles,
    });
  const fail = message => {
    throw new Error(`Figma Segmented wrapper needs updating: ${message}`);
  };
  const source =
    suppliedSource ||
    packet.sourceRefs.find(
      ref =>
        ref.file.endsWith('/segmented-control.scss') && ref.normalizedSha256
    );
  if (!source) fail('Missing guarded segment source');
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
    source: {
      ...source,
      line: text.slice(0, match.index).split('\n').length,
    },
    description:
      'Source margin-inline-start is negative border-width/button for every segment after the first. Binding this value as a native auto-layout gap preserves the three-option single-row seam; source wrapped-row offset is outside this FullWidth-only scope.',
    codeSyntax: {
      WEB: 'calc(-1 * var(--mg-border-width-button))',
    },
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
  return {
    seamName,
    seam,
    body,
  };
}
module.exports = {
  buildSegmentedWrapperAssets,
};
