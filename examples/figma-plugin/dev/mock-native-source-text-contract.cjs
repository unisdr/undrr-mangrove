'use strict';
const fs = require('fs'),
  assert = require('assert'),
  {
    sourceTextContract,
    validatePlainActual,
  } = require('./native-source-text-contract.cjs');
const path = require('path');
const full = require('./mock-card-content.cjs').document();
const book = structuredClone(full);
book.components.families = book.components.families.filter(
  f => f.id === 'book-card'
);
const horizontal = structuredClone(full);
horizontal.components.families = horizontal.components.families.filter(f =>
  ['horizontal-book-card', 'editorial-cta'].includes(f.id)
);
const actualTool = JSON.parse(
    fs.readFileSync(
      path.join(
        __dirname,
        '../holistic/assets/native-book-title-style-diagnostic/diagnose-title-style-decoration-readonly-native-tool.json'
      )
    )
  ),
  actual = JSON.parse(actualTool.content.find(b => b.type === 'text').text),
  styleMap = new Map(actual.styles.map(s => [s.sourceId, s.id]));
const contract = sourceTextContract(book, 'undrr'),
  verdicts = [];
for (const entry of contract.entries) {
  if (!entry.key.endsWith('/title')) continue;
  const row = actual.rows.find(
    r =>
      r.id ===
      (entry.sourceStyleId.endsWith('book-title-link') ? '8:10' : '8:20')
  );
  assert(row);
  const ownedRow = { ...row, key: entry.key };
  const result = validatePlainActual(entry, ownedRow, styleMap);
  assert(!result.accepted);
  if (entry.decoration === 'UNDERLINE')
    assert(result.issues.some(x => x.includes('decoration')));
  else assert(result.issues.some(x => x.includes('textStyleId')));
  verdicts.push(result);
  const repaired = {
    ...ownedRow,
    textStyleId: styleMap.get(entry.sourceStyleId),
    textDecoration: entry.decoration,
    segments: row.segments.map(s => ({
      ...s,
      textStyleId: styleMap.get(entry.sourceStyleId),
      textDecoration: entry.decoration,
    })),
  };
  assert(validatePlainActual(entry, repaired, styleMap).accepted);
  const wrongRange = {
    ...repaired,
    segments: repaired.segments.map(s => ({
      ...s,
      textStyleId: 'wrong-native-style',
    })),
  };
  assert(!validatePlainActual(entry, wrongRange, styleMap).accepted);
  for (const bad of [
    { ...repaired, id: undefined },
    { ...repaired, id: '' },
    { ...repaired, key: 'foreign-managed-key' },
    { ...repaired, characters: 'wrong source copy' },
    {
      ...repaired,
      segments: repaired.segments.map(s => ({
        ...s,
        characters: 'wrong range copy',
      })),
    },
  ])
    assert(!validatePlainActual(entry, bad, styleMap).accepted);
}
const duplicate = structuredClone(book);
duplicate.styles.text.push(structuredClone(duplicate.styles.text[0]));
assert.throws(
  () => sourceTextContract(duplicate, 'undrr'),
  /Duplicate source style/
);
const unknown = structuredClone(book);
function alter(n) {
  if (n.type === 'TEXT' && !n.textRuns) {
    n.textStyleApplication = 'UNKNOWN';
    return true;
  }
  return (n.children ?? []).some(alter);
}
unknown.components.families.some(f => f.variants.some(v => alter(v.tree)));
assert.throws(
  () => sourceTextContract(unknown, 'undrr'),
  /Unknown textStyleApplication/
);
const allModes = book.modes.map(m => ({
  mode: m.id,
  book: sourceTextContract(book, m.id).entries.length,
  horizontal: sourceTextContract(horizontal, m.id).entries.length,
}));
assert(allModes.every(m => m.book === 2 && m.horizontal === 78));
const expected = {
  key: 'family/utf16/variant/default/copy',
  kind: 'plain',
  characters: 'A😀B',
  sourceStyleId: 'utf16.style',
  styleApplication: 'STYLE',
  decoration: 'NONE',
};
const native = {
  id: 'native:utf16',
  key: expected.key,
  characters: expected.characters,
  textStyleId: 'native:style',
  textDecoration: 'NONE',
  segments: [
    {
      start: 0,
      end: 4,
      characters: 'A😀B',
      textStyleId: 'native:style',
      textDecoration: 'NONE',
    },
  ],
};
const nativeStyles = new Map([['utf16.style', 'native:style']]);
assert(validatePlainActual(expected, native, nativeStyles).accepted);
for (const segment of [
  { start: 1, end: 4 },
  { start: 0, end: 3 },
  { start: 0, end: 4.5 },
  { start: 0, end: 5 },
])
  assert(
    !validatePlainActual(
      expected,
      { ...native, segments: [{ ...native.segments[0], ...segment }] },
      nativeStyles
    ).accepted
  );
assert(!validatePlainActual(expected, native, new Map()).accepted);
console.log(allModes, verdicts);

const richDoc = structuredClone(horizontal);
const richStyle = richDoc.styles.text[0];
richStyle.values.undrr.textDecoration = 'UNDERLINE';
richDoc.components.families = [
  {
    id: 'rich-semantics',
    variants: [
      {
        id: 'default',
        tree: {
          id: 'root',
          type: 'TEXT',
          characters: 'AB',
          textRuns: [
            { id: 'a', start: 0, end: 1, textStyle: richStyle.id },
            {
              id: 'b',
              start: 1,
              end: 2,
              textStyle: richStyle.id,
              textDecoration: 'UNDERLINE',
            },
          ],
        },
      },
    ],
  },
];
assert.deepStrictEqual(
  sourceTextContract(richDoc, 'undrr').entries[0].runs.map(r => r.decoration),
  ['NONE', 'UNDERLINE']
);
