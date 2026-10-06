'use strict';
const assert = require('assert');
function sourceTextContract(doc, brand) {
  assert(doc.modes.some(m => m.id === brand));
  const styles = new Map(),
    entries = [],
    keys = new Set();
  for (const style of doc.styles.text) {
    assert(
      typeof style.id === 'string' && style.id.trim(),
      'Missing source style identity'
    );
    assert(
      !styles.has(style.id),
      'Duplicate source style identity ' + style.id
    );
    styles.set(style.id, style);
  }
  function runStyle(id) {
    const style = styles.get(id);
    assert(style?.values?.[brand], `Missing exact style ${id}/${brand}`);
    return style;
  }
  for (const family of doc.components.families)
    for (const variant of family.variants) {
      function walk(n, key) {
        if (n.type === 'TEXT') {
          assert(!keys.has(key), 'Duplicate managed TEXT key ' + key);
          keys.add(key);
          assert(
            n.textStyleApplication === undefined ||
              ['STYLE', 'DIRECT'].includes(n.textStyleApplication),
            'Unknown textStyleApplication'
          );
          if (n.textRuns) {
            entries.push({
              key,
              familyId: family.id,
              variantId: variant.id,
              kind: 'rich',
              characters: n.characters,
              textProperty: null,
              runs: n.textRuns.map(r => {
                runStyle(r.textStyle);
                return {
                  id: r.id,
                  start: r.start,
                  end: r.end,
                  sourceStyleId: r.textStyle,
                  decoration: r.textDecoration ?? 'NONE',
                  fillRole: r.fill,
                  hyperlink: r.hyperlink ?? null,
                };
              }),
            });
          } else {
            const style = runStyle(n.textStyle);
            entries.push({
              key,
              familyId: family.id,
              variantId: variant.id,
              kind: 'plain',
              styleApplication: n.textStyleApplication ?? 'STYLE',
              characters: n.characters ?? '',
              textProperty: n.textProperty ?? null,
              sourceStyleId: n.textStyle,
              decoration:
                n.textDecoration ??
                style.values[brand].textDecoration ??
                'NONE',
              sourceFontName: style.values[brand].fontName,
              styleBindings: style.bindings ?? {},
              nodeBindings: n.bindings ?? {},
              fillRole: n.fill ?? null,
            });
          }
        }
        if (n.type !== 'INSTANCE')
          for (const child of n.children ?? [])
            walk(child, key + '/' + child.id);
      }
      walk(variant.tree, 'family/' + family.id + '/variant/' + variant.id);
    }
  return {
    version: 1,
    brand,
    families: doc.components.families.map(f => ({
      id: f.id,
      variants: f.variants.map(v => v.id),
    })),
    entries,
    scope:
      'Initial managed master TEXT source/style/decoration contract. Nested dependency masters are included as their actual families; review/consumer copies require actual main/own override mapping. Font byte/glyph/pixel geometry not accepted by this gate.',
  };
}
function validatePlainActual(expected, actual, styleIdBySource) {
  const issues = [];
  if (typeof actual.id !== 'string' || !actual.id.trim())
    issues.push('Missing exact native node identity');
  const templateNativeId = styleIdBySource.get(expected.sourceStyleId),
    wanted = expected.styleApplication === 'DIRECT' ? '' : templateNativeId;
  if (actual.key !== expected.key)
    issues.push('Exact managed TEXT key differs');
  if (actual.characters !== expected.characters)
    issues.push('Source characters differ');
  if (!templateNativeId)
    issues.push(
      'Missing exact native style ownership mapping ' + expected.sourceStyleId
    );
  if (actual.textStyleId !== wanted)
    issues.push(
      'Node textStyleId differs: ' + actual.textStyleId + ' != ' + wanted
    );
  if (actual.textDecoration !== expected.decoration)
    issues.push(
      'Node decoration differs: ' +
        actual.textDecoration +
        ' != ' +
        expected.decoration
    );
  const segments = actual.segments;
  if (!Array.isArray(segments)) issues.push('Missing native styled ranges');
  else {
    let cursor = 0;
    for (const segment of segments) {
      if (
        segment.start !== cursor ||
        !Number.isInteger(segment.end) ||
        segment.end <= segment.start ||
        segment.end > actual.characters.length
      )
        issues.push('Native ranges not full contiguous UTF-16 coverage');
      if (
        segment.characters !==
        actual.characters.slice(segment.start, segment.end)
      )
        issues.push('Range characters differ from exact UTF-16 slice');
      cursor = segment.end;
      if (segment.textStyleId !== wanted)
        issues.push('Range textStyleId differs');
      if (segment.textDecoration !== expected.decoration)
        issues.push('Range decoration differs');
    }
    if (cursor !== actual.characters.length)
      issues.push('Native ranges omit characters');
  }
  return {
    accepted: issues.length === 0,
    expectedKey: expected.key,
    actualNodeId: actual.id,
    expectedNativeStyleId: wanted,
    sourceTemplateNativeStyleId: templateNativeId,
    expectedDecoration: expected.decoration,
    issues,
  };
}
module.exports = { sourceTextContract, validatePlainActual };
