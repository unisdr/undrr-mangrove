#!/usr/bin/env node
/** Fabricated saved evidence only. This does not exercise Figma or pixels. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { auditNativeText, summary } = require('./audit-native-text.cjs');
const copy = x => JSON.parse(JSON.stringify(x));
function fixture() {
  const text = (id, style, extra = {}) => ({
    type: 'TEXT',
    id,
    textStyle: style,
    ...extra,
  });
  const doc = {
    components: {
      families: [
        {
          id: 'alpha',
          variants: [
            {
              id: 'alpha.default',
              tree: {
                type: 'FRAME',
                id: 'ignored-root-id',
                children: [
                  {
                    type: 'FRAME',
                    id: 'body',
                    children: [
                      text('label', 'alpha.default', { textWrap: 'BALANCE' }),
                    ],
                  },
                ],
              },
            },
            {
              id: 'alpha.hover',
              tree: {
                type: 'FRAME',
                id: 'different-root',
                children: [
                  text('label', 'alpha.hover', {
                    textDecoration: 'UNDERLINE',
                    textDecorationOffset: { unit: 'PERCENT', value: 20 },
                    textWrap: 'AUTO',
                  }),
                ],
              },
            },
          ],
        },
        {
          id: 'beta',
          variants: [
            {
              id: 'beta.default',
              tree: {
                type: 'FRAME',
                id: 'source-root',
                children: [text('glyph', 'beta.glyph')],
              },
            },
          ],
        },
      ],
    },
    styles: {
      text: ['alpha.default', 'alpha.hover', 'beta.glyph'].map(id => ({
        id,
        values: {
          synthetic: {
            fontName: { family: 'Roboto', style: 'Bold' },
            textDecoration: 'UNDERLINE',
            textDecorationOffset: { unit: 'PIXELS', value: 99 },
          },
        },
      })),
    },
  };
  const inspection = {
    capturedAt: 'synthetic-evidence',
    styles: {
      text: doc.styles.text.map(s => ({
        id: `synthetic-style:${s.id}`,
        mgStyleId: s.id,
        type: 'TEXT',
        fontName: { family: 'Roboto', style: 'Bold' },
      })),
    },
    nodes: [],
  };
  const node = (id, mgKitId, type, parentId, extra = {}) => {
    const n = { id, mgKitId, type, parentId, ...extra };
    inspection.nodes.push(n);
    return n;
  };
  node('synthetic-main', 'main', 'FRAME', 'synthetic-page');
  for (const family of doc.components.families) {
    const set = node(
      `synthetic-set:${family.id}`,
      `family/${family.id}`,
      'COMPONENT_SET',
      'synthetic-main'
    );
    for (const variant of family.variants) {
      const rootKey = `family/${family.id}/variant/${variant.id}`;
      const master = node(
        `synthetic-master:${variant.id}`,
        rootKey,
        'COMPONENT',
        set.id
      );
      function walk(tree, key, parent) {
        for (const child of tree.children || []) {
          const childKey = `${key}/${child.id || child.key}`;
          const extra =
            child.type === 'TEXT'
              ? {
                  textStyleId: `synthetic-style:${child.textStyle}`,
                  fontName: { family: 'Roboto', style: 'Bold' },
                  hasMissingFont: false,
                  textDecoration: child.textDecoration || 'NONE',
                  textDecorationOffset:
                    child.textDecoration === 'UNDERLINE'
                      ? child.textDecorationOffset
                      : null,
                  textWrapStyle: child.textWrap || 'AUTO',
                }
              : {};
          const next = node(
            `synthetic-node:${childKey}`,
            childKey,
            child.type,
            parent.id,
            extra
          );
          walk(child, childKey, next);
        }
      }
      walk(variant.tree, rootKey, master);
    }
  }
  // Inherited identities under instances must never collide with main records.
  const consumer = node(
    'synthetic-consumer',
    'review/alpha/instance',
    'INSTANCE',
    'synthetic-main'
  );
  node(
    'synthetic-consumer-label',
    'family/alpha/variant/alpha.default/body/label',
    'TEXT',
    consumer.id,
    { textStyleId: 'wrong inherited style' }
  );
  return { doc, inspection };
}
function main() {
  const { doc, inspection } = fixture();
  const originals = JSON.stringify({ doc, inspection });
  const audited = auditNativeText(inspection, doc);
  assert.strictEqual(audited.passed, true);
  assert.strictEqual(audited.fullSourceScope, true);
  assert.strictEqual(audited.counts.checkedText, 3);
  assert(
    audited.checks.some(
      c => c.path === 'family/alpha/variant/alpha.default/body/label'
    )
  );
  assert(audited.checks.every(c => !c.path.includes('ignored-root-id')));
  assert.strictEqual(audited.renderedAcceptance, false);
  assert(audited.fontLoadingVerification.includes('Not performed'));
  assert.strictEqual(
    JSON.stringify({ doc, inspection }),
    originals,
    'Audit mutates neither supplied evidence nor source document'
  );
  console.log(
    'ok  exact builder paths ignore root recipe ID, exclude inherited instance identities and check saved fields without native/render/font acceptance'
  );

  const swapped = copy(inspection);
  const normal = swapped.nodes.find(
    n => n.mgKitId === 'family/alpha/variant/alpha.default/body/label'
  );
  normal.textStyleId = 'synthetic-style:alpha.hover';
  const wrong = auditNativeText(swapped, doc);
  assert.strictEqual(wrong.passed, false);
  assert.strictEqual(wrong.counts.wrongStyleIds, 1);
  assert(
    wrong.gaps.some(
      g =>
        g.field === 'textStyleId' &&
        g.expected === 'synthetic-style:alpha.default' &&
        g.actual === 'synthetic-style:alpha.hover'
    )
  );
  const reordered = copy(inspection);
  reordered.nodes.find(
    n => n.mgKitId === 'family/alpha/variant/alpha.hover/label'
  ).textDecorationOffset = { value: 20, unit: 'PERCENT' };
  assert.strictEqual(
    auditNativeText(reordered, doc).passed,
    true,
    'Offset key order is not a semantic mismatch'
  );
  const offsets = copy(inspection);
  offsets.nodes.find(
    n => n.mgKitId === 'family/alpha/variant/alpha.hover/label'
  ).textDecorationOffset = { unit: 'AUTO' };
  offsets.nodes.find(
    n => n.mgKitId === 'family/alpha/variant/alpha.default/body/label'
  ).textDecorationOffset = { unit: 'PIXELS', value: 99 };
  const offsetAudit = auditNativeText(offsets, doc);
  assert.strictEqual(offsetAudit.counts.wrongStyleIds, 0);
  assert.strictEqual(
    offsetAudit.gaps.filter(g => g.field === 'textDecorationOffset').length,
    2
  );
  const wrapping = copy(inspection);
  wrapping.nodes.find(
    n => n.mgKitId === 'family/alpha/variant/alpha.default/body/label'
  ).textWrapStyle = 'AUTO';
  assert(
    auditNativeText(wrapping, doc).gaps.some(g => g.field === 'textWrapStyle')
  );
  console.log(
    'ok  cross-variant shared-style drift, non-inherited underline offsets, NONE/null and explicit wrapping mismatches are isolated'
  );

  const duplicateStyle = copy(inspection);
  duplicateStyle.styles.text.push({
    ...copy(duplicateStyle.styles.text[0]),
    id: 'synthetic-style:duplicate',
  });
  assert(
    auditNativeText(duplicateStyle, doc).gaps.some(
      g => g.code === 'duplicate-native-style-identity'
    )
  );
  const reusedStyle = copy(inspection);
  reusedStyle.styles.text[1].id = reusedStyle.styles.text[0].id;
  assert(
    auditNativeText(reusedStyle, doc).gaps.some(
      g => g.code === 'duplicate-native-style-id'
    )
  );
  const missingStyle = copy(inspection);
  missingStyle.styles.text.splice(0, 1);
  assert(
    auditNativeText(missingStyle, doc).gaps.some(
      g => g.code === 'missing-required-native-style'
    )
  );
  const missingNode = copy(inspection);
  missingNode.nodes = missingNode.nodes.filter(
    n => n.mgKitId !== 'family/alpha/variant/alpha.hover/label'
  );
  const missingNodeAudit = auditNativeText(missingNode, doc);
  assert.strictEqual(missingNodeAudit.passed, false);
  assert.strictEqual(missingNodeAudit.counts.matchedText, 2);
  assert.strictEqual(missingNodeAudit.counts.expectedText, 3);
  const duplicateNode = copy(inspection);
  duplicateNode.nodes.push({
    ...copy(
      duplicateNode.nodes.find(
        n => n.mgKitId === 'family/alpha/variant/alpha.hover/label'
      )
    ),
    id: 'synthetic-duplicate-label',
  });
  assert(
    auditNativeText(duplicateNode, doc).gaps.some(
      g => g.code === 'duplicate-main-identity'
    )
  );
  const parentDrift = copy(inspection);
  parentDrift.nodes.find(
    n => n.mgKitId === 'family/alpha/variant/alpha.hover/label'
  ).parentId = 'synthetic-main';
  assert(
    auditNativeText(parentDrift, doc).gaps.some(
      g => g.code === 'wrong-main-text-parent'
    )
  );
  console.log(
    'ok  duplicate/missing native style or main identities, reused style IDs and wrong construction parents block acceptance'
  );

  const partial = copy(inspection);
  partial.nodes = partial.nodes.filter(
    n => !n.mgKitId.startsWith('family/beta')
  );
  const partialAudit = auditNativeText(partial, doc);
  assert.strictEqual(partialAudit.passed, false);
  assert.deepStrictEqual(partialAudit.scope.skipped, ['beta']);
  assert.strictEqual(
    partialAudit.families.find(f => f.id === 'beta').status,
    'unverified'
  );
  assert.strictEqual(
    partialAudit.counts.expectedText,
    3,
    'Absent families remain in the requested coverage denominator'
  );
  const selected = auditNativeText(partial, doc, { familyIds: ['alpha'] });
  assert.strictEqual(selected.passed, true);
  assert.strictEqual(selected.fullSourceScope, false);
  const missingVariant = copy(inspection);
  missingVariant.nodes = missingVariant.nodes.filter(
    n => n.mgKitId !== 'family/alpha/variant/alpha.hover'
  );
  assert.strictEqual(auditNativeText(missingVariant, doc).passed, false);
  const missingFont = copy(inspection);
  missingFont.nodes.find(
    n => n.mgKitId === 'family/alpha/variant/alpha.hover/label'
  ).hasMissingFont = true;
  assert(
    auditNativeText(missingFont, doc).gaps.some(
      g => g.code === 'unverified-node-font'
    )
  );
  const noStyleFont = copy(inspection);
  delete noStyleFont.styles.text[0].fontName;
  assert(
    auditNativeText(noStyleFont, doc).gaps.some(
      g => g.code === 'missing-style-font-evidence'
    )
  );
  assert.strictEqual(
    auditNativeText(inspection, doc, { familyIds: ['unknown'] }).passed,
    false
  );
  console.log(
    'ok  partial/missing families or variants never imply full-source success; missing-font/style evidence stays unverified and explicit selected scope remains labeled'
  );

  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'mangrove-synthetic-text-audit-')
  );
  try {
    const inspectedPath = path.join(directory, 'inspection.json'),
      docPath = path.join(directory, 'doc.json'),
      reportPath = path.join(directory, 'report.json');
    fs.writeFileSync(inspectedPath, JSON.stringify(partial));
    fs.writeFileSync(docPath, JSON.stringify(doc));
    const script = path.join(__dirname, 'audit-native-text.cjs');
    const failed = spawnSync(
      process.execPath,
      [script, inspectedPath, '--doc', docPath, '--report', reportPath],
      { encoding: 'utf8' }
    );
    assert.strictEqual(failed.status, 1);
    assert.strictEqual(
      fs.readFileSync(reportPath, 'utf8'),
      JSON.stringify(partialAudit, null, 2) + '\n'
    );
    const okay = spawnSync(
      process.execPath,
      [
        script,
        inspectedPath,
        '--doc',
        docPath,
        '--families',
        'alpha',
        '--report',
        reportPath,
      ],
      { encoding: 'utf8' }
    );
    assert.strictEqual(okay.status, 0, okay.stderr);
    assert.deepStrictEqual(
      JSON.parse(fs.readFileSync(reportPath, 'utf8')),
      selected
    );
    const oversized = copy(partialAudit);
    oversized.gaps = Array.from({ length: 10000 }, () => ({
      code: 'synthetic-gap',
      path: 'x'.repeat(20000),
      familyId: 'y'.repeat(20000),
    }));
    assert(summary(oversized).length < 4096);
    assert(summary(oversized).includes('9990 further gaps'));
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
  console.log(
    'ok  CLI scopes/exit codes/complete JSON reports and bounded summaries use fabricated evidence only'
  );
}
if (require.main === module)
  try {
    main();
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
