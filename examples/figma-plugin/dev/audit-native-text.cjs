#!/usr/bin/env node
/** Read-only audit of saved native evidence, never live/font/render acceptance. */
'use strict';
const fs = require('fs');
const path = require('path');
function ordered(value) {
  if (Array.isArray(value)) return value.map(ordered);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map(key => [key, ordered(value[key])])
    );
  return value;
}
const json = value => JSON.stringify(ordered(value));
const keyOf = node => node.mgKitId || node.identity?.mgKitId || '';
function auditNativeText(inspection, doc, { familyIds } = {}) {
  const report = {
    kind: 'mangrove-native-text-audit',
    version: 1,
    capturedAt: inspection?.capturedAt || null,
    passed: false,
    fullSourceScope: false,
    fontLoadingVerification:
      'Not performed. Saved font names do not establish loadability.',
    renderedAcceptance: false,
    scope: { requested: [], checked: [], skipped: [], sourceFamilyCount: 0 },
    counts: {
      expectedText: 0,
      matchedText: 0,
      checkedText: 0,
      mismatchedText: 0,
      wrongStyleIds: 0,
      directTypography: 0,
      gaps: 0,
    },
    families: [],
    checks: [],
    gaps: [],
    limitations: [
      'Only source-owned main TEXT definitions are checked. Nested instance consumers, review overrides and rendered glyph/line-box parity are excluded.',
      'No Figma API, font enumeration/loading, canvas mutation or browser operation is performed.',
    ],
  };
  const gap = (code, details = {}) => report.gaps.push({ code, ...details });
  if (
    !Array.isArray(doc?.components?.families) ||
    !Array.isArray(doc?.styles?.text) ||
    !Array.isArray(inspection?.nodes) ||
    !Array.isArray(inspection?.styles?.text)
  ) {
    gap('invalid-input', {
      message:
        'Provide exported component/text-style recipes and a saved inspection with nodes/text styles.',
    });
    report.counts.gaps = report.gaps.length;
    return report;
  }
  const source = new Map();
  for (const family of doc.components.families) {
    if (!family.id || source.has(family.id))
      gap('duplicate-source-family', { familyId: family.id || null });
    source.set(family.id, family);
  }
  const requested = familyIds === undefined ? [...source.keys()] : familyIds;
  if (
    !Array.isArray(requested) ||
    !requested.length ||
    requested.some(id => typeof id !== 'string' || !id) ||
    new Set(requested).size !== requested.length
  ) {
    gap('invalid-scope', { message: 'Select unique source family IDs.' });
    report.counts.gaps = report.gaps.length;
    return report;
  }
  report.scope.requested = [...requested];
  report.scope.sourceFamilyCount = source.size;
  report.fullSourceScope =
    requested.length === source.size && requested.every(id => source.has(id));
  const sourceStyles = new Map();
  for (const style of doc.styles.text) {
    if (!style.id || sourceStyles.has(style.id))
      gap('duplicate-source-style', { styleId: style.id || null });
    sourceStyles.set(style.id, style);
  }
  const nativeById = new Map();
  for (const node of inspection.nodes) {
    if (nativeById.has(node.id))
      gap('duplicate-native-node-id', { nodeId: node.id });
    nativeById.set(node.id, node);
  }
  const mainNodes = new Map();
  for (const node of inspection.nodes) {
    const ancestry = node.ancestry || [];
    let parent = nativeById.get(node.parentId),
      insideInstance = ancestry.some(p => p.type === 'INSTANCE');
    const seen = new Set([node.id]);
    while (parent && !seen.has(parent.id)) {
      seen.add(parent.id);
      if (parent.type === 'INSTANCE') insideInstance = true;
      parent = nativeById.get(parent.parentId);
    }
    if (parent && seen.has(parent.id))
      gap('native-parent-cycle', { nodeId: node.id });
    const key = keyOf(node);
    if (!insideInstance && key) {
      const matches = mainNodes.get(key) || [];
      matches.push(node);
      mainNodes.set(key, matches);
    }
  }
  const nativeStyles = new Map(),
    styleNativeIds = new Map();
  for (const style of inspection.styles.text) {
    if (!style.mgStyleId) continue;
    const matches = nativeStyles.get(style.mgStyleId) || [];
    matches.push(style);
    nativeStyles.set(style.mgStyleId, matches);
    const ids = styleNativeIds.get(style.id) || [];
    ids.push(style.mgStyleId);
    styleNativeIds.set(style.id, ids);
  }
  for (const [styleId, styles] of nativeStyles)
    if (styles.length !== 1)
      gap('duplicate-native-style-identity', {
        styleId,
        nativeIds: styles.map(s => s.id),
      });
  for (const [nativeId, identities] of styleNativeIds)
    if (!nativeId || identities.length !== 1)
      gap('duplicate-native-style-id', {
        nativeId: nativeId || null,
        styleIds: identities,
      });
  const exactNode = (key, type, familyId) => {
    const matches = mainNodes.get(key) || [];
    if (matches.length !== 1 || matches[0].type !== type) {
      gap(
        matches.length > 1
          ? 'duplicate-main-identity'
          : matches.length
            ? 'wrong-main-node-type'
            : 'missing-main-node',
        {
          familyId,
          path: key,
          expectedType: type,
          nativeIds: matches.map(n => n.id),
        }
      );
      return null;
    }
    return matches[0];
  };
  const mainMatches = mainNodes.get('main') || [];
  const main =
    mainMatches.length === 1 && mainMatches[0].type === 'FRAME'
      ? mainMatches[0]
      : null;
  if (!main) gap('missing-or-ambiguous-main-root');
  for (const familyId of requested) {
    const recipe = source.get(familyId);
    if (!recipe) {
      gap('unknown-source-family', { familyId });
      report.scope.skipped.push(familyId);
      continue;
    }
    const beforeGaps = report.gaps.length;
    const family = {
      id: familyId,
      status: 'unverified',
      expectedVariants: recipe.variants?.length || 0,
      matchedVariants: 0,
      expectedText: 0,
      matchedText: 0,
      checkedText: 0,
      mismatchedText: 0,
      paths: [],
    };
    report.families.push(family);
    const declaredPaths = new Set();
    function countText(tree, key) {
      if (!tree) return;
      if (tree.type === 'TEXT') {
        if (declaredPaths.has(key))
          gap('duplicate-source-text-path', { familyId, path: key });
        declaredPaths.add(key);
        family.expectedText++;
        report.counts.expectedText++;
        family.paths.push(key);
      }
      for (const child of tree.children || [])
        countText(child, `${key}/${child.id || child.key}`);
    }
    for (const variant of recipe.variants || [])
      countText(variant.tree, `family/${familyId}/variant/${variant.id}`);
    const familyKey = `family/${familyId}`,
      foundSet = mainNodes.get(familyKey) || [];
    if (!foundSet.length) {
      gap('absent-native-family', {
        familyId,
        message:
          'Family absent from saved native evidence; skipped, not accepted.',
      });
      report.scope.skipped.push(familyId);
      continue;
    }
    const set = exactNode(familyKey, 'COMPONENT_SET', familyId);
    if (!set) {
      report.scope.skipped.push(familyId);
      continue;
    }
    if (!main || set.parentId !== main.id)
      gap('wrong-main-family-parent', { familyId, nodeId: set.id });
    report.scope.checked.push(familyId);
    const expectedPaths = new Set(),
      variantIds = new Set();
    for (const variant of recipe.variants || []) {
      if (variantIds.has(variant.id))
        gap('duplicate-source-variant', { familyId, variantId: variant.id });
      variantIds.add(variant.id);
      const rootKey = `${familyKey}/variant/${variant.id}`;
      const master = exactNode(rootKey, 'COMPONENT', familyId);
      if (master) {
        family.matchedVariants++;
        if (master.parentId !== set.id)
          gap('wrong-main-variant-parent', {
            familyId,
            path: rootKey,
            nodeId: master.id,
          });
      }
      const walk = (tree, key, parentKey) => {
        if (tree.type === 'TEXT') {
          expectedPaths.add(key);
          const node = exactNode(key, 'TEXT', familyId);
          if (!node) return;
          family.matchedText++;
          report.counts.matchedText++;
          const parents = mainNodes.get(parentKey) || [];
          if (parents.length !== 1 || node.parentId !== parents[0].id)
            gap('wrong-main-text-parent', {
              familyId,
              path: key,
              nodeId: node.id,
              parentPath: parentKey,
            });
          const check = {
            familyId,
            variantId: variant.id,
            path: key,
            nodeId: node.id,
            sourceStyleId: tree.textStyle,
            nativeStyleId: node.textStyleId,
            textStyleApplication: tree.textStyleApplication || 'STYLE',
            fontEvidence: {
              fontName: node.fontName ?? null,
              hasMissingFont: node.hasMissingFont ?? null,
              loading: 'unverified',
            },
            assertions: [],
          };
          const assert = (field, expected, actual) => {
            const passed = json(expected) === json(actual);
            check.assertions.push({
              field,
              expected,
              actual: actual === undefined ? 'MISSING_EVIDENCE' : actual,
              passed,
            });
            if (!passed)
              gap('text-property-mismatch', {
                familyId,
                path: key,
                nodeId: node.id,
                field,
                expected,
                actual: actual === undefined ? 'MISSING_EVIDENCE' : actual,
              });
          };
          const sourceStyle = sourceStyles.get(tree.textStyle),
            styles = nativeStyles.get(tree.textStyle) || [];
          const direct = tree.textStyleApplication === 'DIRECT';
          if (
            tree.textStyleApplication !== undefined &&
            (!direct ||
              familyId !== 'toc-link' ||
              tree.textProperty !== 'Label' ||
              tree.textStyle !== 'component.table-of-contents.link')
          )
            gap('unsupported-text-style-application', { familyId, path: key });
          if (!sourceStyle)
            gap('missing-source-style', {
              familyId,
              path: key,
              styleId: tree.textStyle,
            });
          if (
            styles.length !== 1 ||
            styles[0].type !== 'TEXT' ||
            !styles[0].id
          ) {
            gap(
              styles.length > 1
                ? 'ambiguous-required-style'
                : 'missing-required-native-style',
              { familyId, path: key, styleId: tree.textStyle }
            );
          } else {
            const expectedStyleId = direct ? '' : styles[0].id;
            assert('textStyleId', expectedStyleId, node.textStyleId);
            if (node.textStyleId !== expectedStyleId)
              report.counts.wrongStyleIds++;
            if (!styles[0].fontName?.family || !styles[0].fontName?.style)
              gap('missing-style-font-evidence', {
                familyId,
                path: key,
                styleId: tree.textStyle,
                verification: 'unverified',
              });
            if (direct) {
              report.counts.directTypography++;
              // The scoped source guard currently requires identical Latin
              // typography across brands. Fail closed if that contract changes.
              const values = Object.values(sourceStyle?.values || {});
              const faces = values.map(value => ({
                fontName: value.fontName,
                fontSize: value.fontSize,
                lineHeight: value.lineHeight,
              }));
              if (!faces.length || new Set(faces.map(json)).size !== 1)
                gap('ambiguous-direct-source-typography', {
                  familyId,
                  path: key,
                });
              else {
                const expected = faces[0];
                const face = value =>
                  value && { family: value.family, style: value.style };
                const linePixels = (line, size) =>
                  line?.unit === 'PERCENT'
                    ? (line.value * size) / 100
                    : line?.unit === 'PIXELS'
                      ? line.value
                      : null;
                for (const [name, actual] of [
                  ['template', styles[0]],
                  ['node', node],
                ]) {
                  assert(
                    `${name}.fontName`,
                    face(expected.fontName),
                    face(actual.fontName)
                  );
                  assert(
                    `${name}.fontSize`,
                    expected.fontSize,
                    actual.fontSize
                  );
                  assert(
                    `${name}.lineHeight`,
                    expected.lineHeight,
                    actual.lineHeight
                  );
                  const expectedPixels = linePixels(
                    expected.lineHeight,
                    expected.fontSize
                  );
                  const actualPixels = linePixels(
                    actual.lineHeight,
                    actual.fontSize
                  );
                  assert(
                    `${name}.lineHeightPixels`,
                    expectedPixels,
                    actualPixels
                  );
                }
              }
              for (const [field, type] of [
                ['fontFamily', 'STRING'],
                ['fontSize', 'FLOAT'],
              ]) {
                const role = sourceStyle?.bindings?.[field];
                const definition =
                  doc.variables?.filter(
                    variable => variable.name === role && variable.type === type
                  ) || [];
                const imported =
                  inspection.variables?.filter(
                    variable =>
                      variable.name === role &&
                      variable.resolvedType === type &&
                      variable.mgId === definition[0]?.id
                  ) || [];
                if (definition.length !== 1 || imported.length !== 1)
                  gap('missing-or-ambiguous-direct-typography-variable', {
                    familyId,
                    path: key,
                    field,
                    role,
                  });
                else {
                  const alias = value =>
                    Array.isArray(value)
                      ? value.length === 1
                        ? value[0]
                        : null
                      : value;
                  assert(
                    `${field}.nodeBinding`,
                    imported[0].id,
                    alias(node.boundVariables?.[field])?.id
                  );
                  assert(
                    `${field}.templateBinding`,
                    imported[0].id,
                    alias(styles[0].boundVariables?.[field])?.id
                  );
                }
              }
            }
          }
          if (
            !node.fontName?.family ||
            !node.fontName?.style ||
            node.hasMissingFont === true
          )
            gap('unverified-node-font', {
              familyId,
              path: key,
              nodeId: node.id,
              verification: 'unverified',
            });
          const decoration = tree.textDecoration || 'NONE';
          assert('textDecoration', decoration, node.textDecoration);
          if (tree.textWrap !== undefined)
            assert('textWrapStyle', tree.textWrap, node.textWrapStyle);
          if (decoration === 'NONE')
            assert('textDecorationOffset', null, node.textDecorationOffset);
          else if (tree.textDecorationOffset !== undefined)
            assert(
              'textDecorationOffset',
              tree.textDecorationOffset,
              node.textDecorationOffset
            );
          check.passed =
            check.assertions.every(a => a.passed) &&
            !report.gaps.some(g => g.path === key);
          report.checks.push(check);
          family.checkedText++;
          report.counts.checkedText++;
          if (!check.passed) {
            family.mismatchedText++;
            report.counts.mismatchedText++;
          }
        }
        for (const child of tree.children || [])
          walk(child, `${key}/${child.id || child.key}`, key);
      };
      if (!variant.tree)
        gap('missing-source-tree', { familyId, variantId: variant.id });
      else walk(variant.tree, rootKey, familyKey);
    }
    for (const [key, nodes] of mainNodes)
      if (
        key.startsWith(`${familyKey}/variant/`) &&
        nodes.some(n => n.type === 'TEXT') &&
        !expectedPaths.has(key)
      )
        gap('unexpected-owned-main-text', {
          familyId,
          path: key,
          nativeIds: nodes.filter(n => n.type === 'TEXT').map(n => n.id),
        });
    family.status = report.gaps.length === beforeGaps ? 'checked' : 'gaps';
  }
  report.counts.gaps = report.gaps.length;
  report.passed =
    report.scope.skipped.length === 0 &&
    report.scope.checked.length === requested.length &&
    report.gaps.length === 0;
  return report;
}
function summary(report) {
  const lines = [
    `Native TEXT audit: ${report.passed ? 'passed saved-field checks' : 'gaps found'}.`,
    `Families ${report.scope.checked.length}/${report.scope.requested.length}; matched TEXT ${report.counts.matchedText}/${report.counts.expectedText}; wrong style IDs ${report.counts.wrongStyleIds}; gaps ${report.counts.gaps}.`,
    `Explicit direct typography templates: ${report.counts.directTypography}.`,
    `Scope: ${report.fullSourceScope ? 'all source families requested' : 'selected families only'}. Font loading and rendered acceptance unverified.`,
  ];
  for (const item of report.gaps.slice(0, 10))
    lines.push(
      `${item.code}: ${String(item.familyId || item.styleId || '').slice(0, 100)} ${String(item.path || item.message || '').slice(0, 200)}`.trim()
    );
  if (report.gaps.length > 10)
    lines.push(
      `${report.gaps.length - 10} further gaps retained in the JSON report.`
    );
  return lines.join('\n');
}
function main(args = process.argv.slice(2)) {
  let inspectionPath,
    docPath = path.join(__dirname, '../mangrove-variables.json'),
    reportPath,
    familyIds;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--help') {
      console.log(
        'Usage: node dev/audit-native-text.cjs inspection.json [--doc tokens.json] [--families button,chips] [--report audit.json]'
      );
      return;
    }
    if (['--doc', '--report', '--families'].includes(arg)) {
      if (!args[index + 1] || args[index + 1].startsWith('--'))
        throw new Error(`${arg} requires a value.`);
      const value = args[++index];
      if (arg === '--doc') docPath = value;
      else if (arg === '--report') reportPath = value;
      else familyIds = value.split(',');
    } else if (arg.startsWith('--') || inspectionPath)
      throw new Error(`Unknown or extra argument ${arg}`);
    else inspectionPath = arg;
  }
  if (!inspectionPath) throw new Error('Provide a saved inspection JSON path.');
  const report = auditNativeText(
    JSON.parse(fs.readFileSync(inspectionPath, 'utf8')),
    JSON.parse(fs.readFileSync(docPath, 'utf8')),
    { familyIds }
  );
  if (reportPath)
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log(summary(report));
  if (!report.passed) process.exitCode = 1;
  return report;
}
if (require.main === module)
  try {
    main();
  } catch (error) {
    console.error(`Audit failed: ${error.message || String(error)}`);
    process.exitCode = 1;
  }
module.exports = { auditNativeText, summary, main };
