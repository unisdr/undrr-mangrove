#!/usr/bin/env node
/** Isolated offline native-default/rich-accessor fixture regressions, not native acceptance. */
'use strict';
const assert = require('assert');
const {
  buildFigmaVariables,
} = require('../../../scripts/build-figma-tokens.cjs');
const { rangeEnvironment } = require('./mock-rich-text-integration.cjs');
const {
  installNativeTextPropertyDefaultFixture,
} = require('./mock-search-results.cjs');
const copy = x => JSON.parse(JSON.stringify(x));
const fields = ['fills', 'hyperlink', 'textDecoration'];
async function main() {
  const env = await rangeEnvironment(buildFigmaVariables());
  installNativeTextPropertyDefaultFixture(env);
  await env.figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  const a = env.figma.createComponent(),
    b = env.figma.createComponent(),
    set = env.figma.combineAsVariants([a, b], env.figma.currentPage),
    key = set.addComponentProperty('Shared', 'TEXT', 'First'),
    source = env.figma.createText(),
    target = env.figma.createText(),
    unrelated = env.figma.createText();
  a.appendChild(source);
  b.appendChild(target);
  b.appendChild(unrelated);
  source.characters = 'First';
  target.characters = 'Second';
  unrelated.characters = 'Unrelated link';
  source.componentPropertyReferences = { characters: key };
  target.componentPropertyReferences = { characters: key };
  unrelated.setRangeHyperlink(0, 9, {
    type: 'URL',
    value: 'https://www.undrr.org/',
  });
  unrelated.setRangeTextDecoration(0, 9, 'UNDERLINE');
  const untouched = copy(unrelated.getStyledTextSegments(fields));
  target.setRangeTextDecoration(0, 6, 'UNDERLINE');
  source.setRangeTextDecoration(0, 5, 'UNDERLINE');
  const inherited = b.createInstance(),
    overridden = b.createInstance();
  env.figma.currentPage.appendChild(inherited);
  env.figma.currentPage.appendChild(overridden);
  const inheritedText = env.attachRichText(inherited.children[0], target),
    overrideText = env.attachRichText(overridden.children[0], target);
  overridden.setProperties({ [key]: 'Kept edit' });
  overrideText.editRich(0, overrideText.characters.length, 'Kept edit');
  overrideText.setRangeTextDecoration(0, 4, 'UNDERLINE');
  const kept = copy(overrideText.getStyledTextSegments(fields));
  // Force equal reference strings in an unrelated owner using mock-only internals.
  // This is a scoping regression fixture, not a supported native API write.
  const otherMaster = env.figma.createComponent(),
    otherSet = env.figma.combineAsVariants(
      [otherMaster],
      env.figma.currentPage
    ),
    other = env.figma.createText();
  otherMaster.appendChild(other);
  other.characters = 'Foreign owner';
  otherSet._definitions[key] = { type: 'TEXT', defaultValue: 'Foreign owner' };
  other.componentPropertyReferences = { characters: key };
  other.setRangeTextDecoration(0, 7, 'UNDERLINE');
  const foreign = copy(other.getStyledTextSegments(fields));
  source.characters = 'Replacement';
  assert.strictEqual(source.characters, 'Replacement');
  assert.strictEqual(target.characters, 'Replacement');
  assert.strictEqual(inheritedText.characters, 'Replacement');
  assert.strictEqual(
    set.componentPropertyDefinitions[key].defaultValue,
    'Replacement'
  );
  for (const n of [source, target, inheritedText]) {
    const segments = n.getStyledTextSegments(fields);
    assert.strictEqual(segments.map(s => s.characters).join(''), 'Replacement');
    assert(
      segments.every(s => s.textDecoration === undefined),
      'Each actual target formatting cells reset'
    );
  }
  assert.strictEqual(unrelated.characters, 'Unrelated link');
  assert.deepStrictEqual(
    copy(unrelated.getStyledTextSegments(fields)),
    untouched
  );
  assert.strictEqual(overrideText.characters, 'Kept edit');
  assert.deepStrictEqual(
    copy(overrideText.getStyledTextSegments(fields)),
    kept
  );
  assert.strictEqual(other.characters, 'Foreign owner');
  assert.deepStrictEqual(copy(other.getStyledTextSegments(fields)), foreign);
  assert.strictEqual(
    otherSet.componentPropertyDefinitions[key].defaultValue,
    'Foreign owner'
  );
  // Mock-only staging exercises origin scoping even when createText supplies the accessor.
  const instanceOrigin = env.figma.createText();
  inherited.appendChild(instanceOrigin);
  instanceOrigin.componentPropertyReferences = { characters: key };
  instanceOrigin.characters = 'Direct instance edit';
  assert.strictEqual(instanceOrigin.characters, 'Direct instance edit');
  assert.strictEqual(
    set.componentPropertyDefinitions[key].defaultValue,
    'Replacement'
  );
  assert.strictEqual(source.characters, 'Replacement');
  assert.strictEqual(target.characters, 'Replacement');
  assert.strictEqual(inheritedText.characters, 'Replacement');
  assert.strictEqual(overrideText.characters, 'Kept edit');
  target.setRangeTextDecoration(0, 3, 'UNDERLINE');
  source.setRangeHyperlink(0, 3, {
    type: 'URL',
    value: 'https://www.undrr.org/contact',
  });
  assert(
    target
      .getStyledTextSegments(fields)
      .some(s => s.textDecoration === 'UNDERLINE')
  );
  assert(
    source
      .getStyledTextSegments(fields)
      .some(s => s.hyperlink?.value === 'https://www.undrr.org/contact')
  );
  assert(!target.getStyledTextSegments(fields).some(s => s.hyperlink));
  assert.deepStrictEqual(
    copy(unrelated.getStyledTextSegments(fields)),
    untouched
  );
  source.characters = 'Again';
  assert.strictEqual(target.characters, 'Again');
  assert.strictEqual(inheritedText.characters, 'Again');
  assert.strictEqual(overrideText.characters, 'Kept edit');
  console.log(
    'Offline rich/default fixture: per-target accessors, same-owner propagation, clone inheritance, independent rich cells and instance overrides pass. Native acceptance remains separate.'
  );
}
module.exports = { main };
if (require.main === module)
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
