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

  const organized = fixture();
  organized.doc.kitGuidance = {
    families: [
      { id: 'alpha', status: 'bounded-draft' },
      { id: 'beta', status: 'outside-core' },
    ],
  };
  for (const [section, familyId] of [
    ['components', 'alpha'],
    ['pending', 'beta'],
  ]) {
    organized.inspection.nodes.push(
      {
        id: `section:${section}`,
        mgKitId: `layout/${section}`,
        name: section,
        type: 'SECTION',
        parentId: 'synthetic-page',
      },
      {
        id: `overview:${familyId}`,
        mgKitId: `layout/family/${familyId}/overview`,
        name: familyId,
        type: 'FRAME',
        parentId: `section:${section}`,
      },
      {
        id: `board:${familyId}`,
        mgKitId: `layout/family/${familyId}/main`,
        name: 'Source components',
        type: 'FRAME',
        parentId: `overview:${familyId}`,
      }
    );
    organized.inspection.nodes.find(
      node => node.mgKitId === `family/${familyId}`
    ).parentId = `board:${familyId}`;
  }
  const organizedById = new Map(
    organized.inspection.nodes.map(node => [node.id, node])
  );
  for (const node of organized.inspection.nodes) {
    node.ancestry = [];
    let parent = organizedById.get(node.parentId);
    while (parent) {
      node.ancestry.push({
        id: parent.id,
        type: parent.type,
        name: parent.name,
      });
      parent = organizedById.get(parent.parentId);
    }
    node.ancestry.push({ id: 'synthetic-page', type: 'PAGE' });
  }
  assert(
    auditNativeText(organized.inspection, organized.doc).passed,
    'Exact organized source boards and current parent/ancestry chains are accepted'
  );
  for (const mutate of [
    fixture => {
      fixture.nodes.find(n => n.id === 'board:alpha').mgKitId =
        'layout/family/other/main';
    },
    fixture => {
      fixture.nodes.find(n => n.id === 'board:alpha').type = 'RECTANGLE';
    },
    fixture => {
      fixture.nodes.find(n => n.id === 'board:alpha').parentId =
        'overview:beta';
    },
    fixture => {
      fixture.nodes.find(n => n.mgKitId === 'family/alpha').ancestry[0].id =
        'stale-board';
    },
    fixture => {
      fixture.nodes.find(n => n.id === 'section:components').mgKitId =
        'layout/patterns';
    },
    fixture => {
      fixture.nodes.push({
        ...copy(fixture.nodes.find(n => n.id === 'board:alpha')),
        id: 'duplicate-board',
      });
    },
    fixture => {
      delete fixture.nodes.find(n => n.mgKitId === 'family/alpha').ancestry;
    },
    fixture => {
      const overview = fixture.nodes.find(n => n.id === 'overview:alpha');
      const section = fixture.nodes.find(n => n.id === 'section:components');
      overview.parentId = 'synthetic-page';
      for (const id of [
        'synthetic-set:alpha',
        'board:alpha',
        'overview:alpha',
      ]) {
        const node = fixture.nodes.find(n => n.id === id);
        node.ancestry = node.ancestry.filter(
          ancestor => ancestor.id !== section.id
        );
        // A fabricated section after the unrecorded PAGE cannot prove that
        // the actual parent chain reaches an owned component section.
        node.ancestry.push({
          id: section.id,
          type: section.type,
          name: section.name,
        });
      }
    },
  ]) {
    const invalid = copy(organized);
    mutate(invalid.inspection);
    assert(
      auditNativeText(invalid.inspection, invalid.doc).gaps.some(
        gap => gap.code === 'wrong-main-family-parent'
      )
    );
  }
  console.log(
    'ok  organized v2 uses exact source-board/overview/section ownership and saved ancestry; wrong, duplicate, moved or unproven wrappers refuse'
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

  // An explicit exception still checks its imported template and live aliases.
  const direct = fixture();
  direct.doc.components.families[0].id = 'toc-link';
  const templateId = 'component.table-of-contents.link';
  const face = { family: 'Roboto', style: 'Regular' };
  const line = { unit: 'PERCENT', value: 150 };
  const bindings = {
    fontFamily: { type: 'VARIABLE_ALIAS', id: 'synthetic-family-variable' },
    fontSize: { type: 'VARIABLE_ALIAS', id: 'synthetic-size-variable' },
  };
  direct.doc.variables = [
    { id: 'font-family.text', name: 'font-family/text', type: 'STRING' },
    { id: 'font-size.300', name: 'font-size/300', type: 'FLOAT' },
  ];
  direct.inspection.variables = direct.doc.variables.map((variable, index) => ({
    id: index ? 'synthetic-size-variable' : 'synthetic-family-variable',
    mgId: variable.id,
    name: variable.name,
    resolvedType: variable.type,
  }));
  const template = {
    id: templateId,
    bindings: { fontFamily: 'font-family/text', fontSize: 'font-size/300' },
    values: { synthetic: { fontName: face, fontSize: 16, lineHeight: line } },
  };
  direct.doc.styles.text = [template, direct.doc.styles.text[2]];
  direct.inspection.styles.text = [
    {
      id: 'synthetic-template',
      mgStyleId: templateId,
      type: 'TEXT',
      fontName: face,
      fontSize: 16,
      lineHeight: line,
      boundVariables: bindings,
    },
    direct.inspection.styles.text[2],
  ];
  function directTree(tree) {
    if (tree.type === 'TEXT')
      Object.assign(tree, {
        textStyle: templateId,
        textStyleApplication: 'DIRECT',
        textProperty: 'Label',
        textDecoration: 'UNDERLINE',
        textDecorationOffset: { unit: 'PERCENT', value: 15 },
        textWrap: 'AUTO',
      });
    for (const child of tree.children || []) directTree(child);
  }
  for (const variant of direct.doc.components.families[0].variants)
    directTree(variant.tree);
  for (const node of direct.inspection.nodes) {
    node.mgKitId = node.mgKitId.replace('family/alpha', 'family/toc-link');
    if (
      node.type === 'TEXT' &&
      node.id.startsWith('synthetic-node:family/alpha')
    )
      Object.assign(node, {
        textStyleId: '',
        fontName: face,
        fontSize: 16,
        lineHeight: line,
        boundVariables: copy(bindings),
        textDecoration: 'UNDERLINE',
        textDecorationOffset: { unit: 'PERCENT', value: 15 },
        textWrapStyle: 'AUTO',
      });
  }
  const directAudit = auditNativeText(direct.inspection, direct.doc);
  assert(directAudit.passed, JSON.stringify(directAudit.gaps));
  assert.strictEqual(directAudit.counts.directTypography, 2);
  const directLabel = fixture =>
    fixture.inspection.nodes.find(
      node =>
        node.type === 'TEXT' &&
        node.mgKitId.startsWith('family/toc-link') &&
        node.id.startsWith('synthetic-node:')
    );
  for (const mutate of [
    fixture => {
      directLabel(fixture).textStyleId = 'synthetic-template';
    },
    fixture => {
      directLabel(fixture).fontName.family = 'Wrong face';
    },
    fixture => {
      directLabel(fixture).fontSize = 17;
    },
    fixture => {
      directLabel(fixture).lineHeight.value = 140;
    },
    fixture => {
      delete directLabel(fixture).boundVariables.fontSize;
    },
    fixture => {
      directLabel(fixture).boundVariables.fontFamily.id = 'foreign';
    },
    fixture => {
      fixture.inspection.styles.text.shift();
    },
    fixture => {
      fixture.doc.styles.text[0].values.other = {
        ...template.values.synthetic,
        fontSize: 18,
      };
    },
    fixture => {
      fixture.doc.components.families[0].variants[0].tree.children[0].children[0].textStyleApplication =
        'UNKNOWN';
    },
  ]) {
    const invalid = copy(direct);
    mutate(invalid);
    assert.strictEqual(
      auditNativeText(invalid.inspection, invalid.doc).passed,
      false
    );
  }
  console.log(
    'ok  scoped DIRECT templates retain typography/binding checks and reject stale associations, missing aliases, wrong type and ambiguous source modes'
  );

  const branded = copy(direct);
  branded.doc.collection = 'Mangrove';
  branded.doc.modes = [
    { id: 'undrr', name: 'UNDRR' },
    { id: 'mcr', name: 'MCR2030' },
  ];
  branded.inspection.collections = [
    {
      id: 'synthetic-collection',
      name: 'Mangrove',
      modes: [
        { modeId: 'native-undrr', name: 'UNDRR' },
        { modeId: 'native-mcr', name: 'MCR2030' },
      ],
    },
  ];
  branded.doc.components.families[0].id = 'editorial-cta';
  const editorialStyle = 'component.editorial-cta.label-hover';
  branded.doc.styles.text[0].id = editorialStyle;
  branded.doc.styles.text[0].bindings.fontSize = 'font-size/button';
  branded.doc.variables[1].id = 'font-size.button';
  branded.doc.variables[1].name = 'font-size/button';
  branded.inspection.variables[1].mgId = 'font-size.button';
  branded.inspection.variables[1].name = 'font-size/button';
  for (const variable of branded.inspection.variables)
    variable.variableCollectionId = 'synthetic-collection';
  branded.doc.styles.text[0].values = Object.fromEntries(
    [14, 18].map((size, index) => [
      index ? 'mcr' : 'undrr',
      {
        fontName: { family: 'Roboto', style: 'Bold' },
        fontSize: size,
        lineHeight: { unit: 'PERCENT', value: 100 },
      },
    ])
  );
  function editorialTree(tree) {
    if (tree.type === 'TEXT') tree.textStyle = editorialStyle;
    for (const child of tree.children || []) editorialTree(child);
  }
  for (const variant of branded.doc.components.families[0].variants)
    editorialTree(variant.tree);
  const setBrand = (fixture, size, modeId) => {
    Object.assign(fixture.inspection.styles.text[0], {
      mgStyleId: editorialStyle,
      fontName: { family: 'Roboto', style: 'Bold' },
      fontSize: size,
      lineHeight: { unit: 'PERCENT', value: 100 },
    });
    for (const node of fixture.inspection.nodes) {
      node.mgKitId = node.mgKitId.replace(
        'family/toc-link',
        'family/editorial-cta'
      );
      if (
        node.type === 'TEXT' &&
        node.id.startsWith('synthetic-node:family/alpha')
      )
        Object.assign(node, {
          fontName: { family: 'Roboto', style: 'Bold' },
          fontSize: size,
          lineHeight: { unit: 'PERCENT', value: 100 },
          resolvedVariableModes: { 'synthetic-collection': modeId },
        });
    }
  };
  for (const [size, modeId, sourceModeId] of [
    [14, 'native-undrr', 'undrr'],
    [18, 'native-mcr', 'mcr'],
  ]) {
    setBrand(branded, size, modeId);
    const audit = auditNativeText(branded.inspection, branded.doc);
    assert(audit.passed, JSON.stringify(audit.gaps));
    assert(
      audit.checks
        .filter(check => check.textStyleApplication === 'DIRECT')
        .every(check => check.sourceModeEvidence.sourceModeId === sourceModeId)
    );
  }
  const brandedLabel = fixture =>
    fixture.inspection.nodes.find(
      node =>
        node.type === 'TEXT' &&
        node.id.startsWith('synthetic-node:family/alpha')
    );
  for (const mutate of [
    fixture => {
      delete brandedLabel(fixture).resolvedVariableModes;
    },
    fixture => {
      brandedLabel(fixture).resolvedVariableModes['synthetic-collection'] =
        'unknown';
    },
    fixture => {
      fixture.inspection.collections = [];
    },
    fixture => {
      fixture.inspection.collections.push(
        copy(fixture.inspection.collections[0])
      );
    },
    fixture => {
      fixture.doc.modes.push({ id: 'other', name: 'MCR2030' });
    },
    fixture => {
      fixture.inspection.collections[0].modes[1].name = 'Unknown brand';
    },
    fixture => {
      brandedLabel(fixture).fontSize = 14;
    },
    fixture => {
      fixture.inspection.styles.text[0].fontSize = 14;
    },
    fixture => {
      fixture.inspection.variables[1].variableCollectionId = 'foreign';
    },
  ]) {
    const invalid = copy(branded);
    mutate(invalid);
    assert.strictEqual(
      auditNativeText(invalid.inspection, invalid.doc).passed,
      false
    );
  }
  const partialMode = copy(direct);
  partialMode.inspection.collections = [];
  assert.strictEqual(
    auditNativeText(partialMode.inspection, partialMode.doc).passed,
    false,
    'Partial mode evidence must not use identical-face legacy fallback'
  );
  console.log(
    'ok  resolved Mangrove native mode selects UNDRR14/MCR18 DIRECT typography; missing, conflicting or partial mode evidence and stale type refuse'
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
