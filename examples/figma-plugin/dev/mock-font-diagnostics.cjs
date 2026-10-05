#!/usr/bin/env node
/** Bounded read-only font loading diagnostics. No font identity/rendering claim. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const doc = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
);
const source = fs.readFileSync(
  path.join(__dirname, '../font-diagnostics.js'),
  'utf8'
);
const copy = value => JSON.parse(JSON.stringify(value));
const original = ['Regular', 'Bold'].map(style => ({
  fontName: { family: 'Roboto Condensed', style },
}));
const alternatives = ['Regular', 'Bold'].map((style, index) => ({
  fontName: {
    family: 'Roboto',
    style: `Condensed ${style}`,
    variationSettings: { wdth: 75, wght: index ? 700 : 400 },
  },
}));
function environment({ axes = true, axisError = false } = {}) {
  const calls = [];
  const api = {
    async loadFontAsync(fontName) {
      calls.push({ api: 'loadFontAsync', fontName: copy(fontName) });
      assert(fontName.style, 'A family-only load is outside the diagnostic.');
      if (fontName.family === 'Roboto Condensed')
        throw `The font "${fontName.family} ${fontName.style}" could not be loaded`;
    },
  };
  if (axes)
    api.getFontFamilyVariationAxes = family => {
      calls.push({ api: 'getFontFamilyVariationAxes', family });
      if (axisError) throw new Error('Variation metadata unavailable');
      return family === 'Roboto' ? ['wdth', 'wght'] : null;
    };
  // Unexpected APIs, including listing, node reads and writes, fail loudly.
  const figma = new Proxy(api, {
    get(target, name) {
      if (name === 'getFontFamilyVariationAxes') return target[name];
      assert(
        Object.hasOwn(target, name),
        `Unexpected Figma API ${String(name)}`
      );
      return target[name];
    },
    set() {
      assert.fail('Diagnostic attempted to change a Figma property.');
    },
  });
  const context = vm.createContext({ figma });
  vm.runInContext(source, context);
  return {
    calls,
    async run(
      document = doc,
      availableFonts = [...original, ...alternatives],
      brandId = 'undrr'
    ) {
      return copy(
        await context.mgDiagnoseFontLoading(copy(document), {
          brandId,
          availableFonts:
            availableFonts === undefined ? undefined : copy(availableFonts),
        })
      );
    },
  };
}
async function main() {
  const env = environment();
  const report = await env.run();
  assert.strictEqual(report.errors.length, 0);
  assert.strictEqual(report.requested.length, 2);
  assert.strictEqual(report.candidates.length, 2);
  assert.strictEqual(report.loads.length, 4);
  assert.deepStrictEqual(
    report.loads.map(item => [item.kind, item.loaded]),
    [
      ['requested', false],
      ['requested', false],
      ['listed-candidate', true],
      ['listed-candidate', true],
    ]
  );
  assert(report.loads.every(item => item.listed));
  assert.strictEqual(
    report.loads[0].error,
    'The font "Roboto Condensed Regular" could not be loaded'
  );
  assert.strictEqual(report.loads[2].widthAxisValue, 75);
  assert.deepStrictEqual(report.loads[2].variationSettings, {
    wdth: 75,
    wght: 400,
  });
  assert.strictEqual(report.loads[0].widthAxisValue, null);
  assert.deepStrictEqual(report.families, [
    { family: 'Roboto Condensed', axes: null, checked: true },
    { family: 'Roboto', axes: ['wdth', 'wght'], checked: true },
  ]);
  assert(report.requested[0].sourceStyleIds.includes('text.ui.tab.regular'));
  assert(report.requested[1].sourceStyleIds.includes('component.tab'));
  assert.strictEqual(report.identity.confirmed, false);
  assert.strictEqual(report.identity.renderingChecked, false);
  assert.deepStrictEqual(report.mutatedNodeIds, []);
  assert.strictEqual(
    env.calls.filter(call => call.api === 'loadFontAsync').length,
    4
  );
  assert.strictEqual(
    env.calls.filter(call => call.api === 'getFontFamilyVariationAxes').length,
    2
  );
  console.log(
    'PASS exact source faces, listed naming candidates and variable width metadata'
  );

  const absent = environment();
  const absentReport = await absent.run(doc, original);
  assert.strictEqual(absentReport.candidates.length, 0);
  assert.strictEqual(absentReport.loads.length, 2);
  assert.strictEqual(absentReport.identity.confirmed, false);
  console.log('PASS absent alternative is not guessed or substituted');

  const duplicate = environment();
  assert.strictEqual(
    (await duplicate.run(doc, [...original, ...alternatives, ...alternatives]))
      .loads.length,
    4
  );
  const ambiguous = environment();
  const inventory = [
    ...original,
    ...alternatives,
    {
      fontName: {
        ...alternatives[0].fontName,
        variationSettings: { wdth: 100, wght: 400 },
      },
    },
  ];
  const ambiguity = await ambiguous.run(doc, inventory);
  assert(
    ambiguity.errors.some(error => /Ambiguous listed alternative/.test(error))
  );
  assert.strictEqual(ambiguity.candidates.length, 1);
  assert.strictEqual(ambiguity.loads.length, 3);
  assert(
    !ambiguity.loads.some(item => item.fontName.variationSettings?.wdth === 100)
  );
  console.log(
    'PASS duplicate inventory deduplication and ambiguous variation candidate exclusion'
  );

  const invalid = environment();
  assert((await invalid.run(doc, original, 'missing-brand')).errors.length);
  assert.strictEqual(invalid.calls.length, 0);
  const moreFaces = copy(doc);
  const extra = copy(
    moreFaces.styles.text.find(style => style.id === 'component.tab')
  );
  extra.id = 'component.additional-diagnostic-face';
  extra.values.undrr.fontName.style = 'Light';
  moreFaces.styles.text.push(extra);
  assert(
    (await invalid.run(moreFaces)).errors.some(error => /found 3/.test(error))
  );
  assert.strictEqual(invalid.calls.length, 0);
  const malformed = copy(doc);
  malformed.styles.text.find(
    style => style.id === 'component.tab'
  ).values.undrr.fontName.style = '';
  assert(
    (await invalid.run(malformed)).errors.some(error =>
      /Invalid source/.test(error)
    )
  );
  assert.strictEqual(invalid.calls.length, 0);
  assert(
    (await invalid.run(doc, [{ fontName: { family: 'Roboto' } }])).errors.some(
      error => /inventory/.test(error)
    )
  );
  assert.strictEqual(invalid.calls.length, 0);
  console.log(
    'PASS malformed source/inventory and source face limit block before native APIs'
  );

  for (const options of [{ axes: false }, { axisError: true }]) {
    const partial = environment(options);
    const partialReport = await partial.run();
    assert.strictEqual(partialReport.loads.length, 4);
    assert(
      partialReport.families.every(family => !family.checked && family.error)
    );
    assert(partialReport.loads[0].error.includes('could not be loaded'));
  }
  console.log(
    'PASS missing or failed variation API preserves exact load outcomes'
  );

  const changed = copy(doc);
  for (const style of changed.styles.text) {
    if (
      ['font-family/ui', 'font-family/display'].includes(
        style.bindings?.fontFamily
      )
    )
      style.values.undrr.fontName.family = 'Source Family';
  }
  const derived = environment();
  const derivedReport = await derived.run(changed, [
    { fontName: { family: 'Source Family', style: 'Regular' } },
  ]);
  assert(
    derivedReport.loads.every(item => item.fontName.family === 'Source Family')
  );
  assert.strictEqual(derivedReport.loads.length, 2);
  assert.strictEqual(derivedReport.requested[1].listed, false);
  console.log(
    'PASS requested names derive from current source roles, with missing inventory status retained'
  );
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
