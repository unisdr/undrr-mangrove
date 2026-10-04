#!/usr/bin/env node
'use strict';
// Source inventory/coverage contract checks. No Figma API or native acceptance.
const assert = require('node:assert/strict');
const {
  buildPlannedInventory,
  parseStorySource,
} = require('../../../scripts/figma-planned-inventory.cjs');

const familyIds = [
  'button',
  'text-input',
  'combobox-option',
  'combobox',
  'tabs-trigger',
  'tabs',
  'textarea',
  'table-header-cell',
  'table-body-cell',
  'table-row',
  'table',
  'text-cta',
  'radio',
  'checkbox',
  'form-error-summary',
  'switch',
  'switch-small',
  'editorial-cta',
  'chips',
  'details',
  'select',
  'loader',
  'empty-state-compact',
  'toc-link',
  'table-of-contents',
  'status-label',
  'segmented-control.segment',
  'segmented-control.full-width-below-medium',
];
const families = familyIds.map(id => ({
  id,
  variants: [{ id: `${id}.fixture` }],
}));
const original = JSON.stringify(families);
let checks = 0;
function test(name, run) {
  run();
  checks++;
  console.log(`PASS ${name}`);
}

test('Static parsing preserves source identities and never executes story code', () => {
  const parsed = parseStorySource(
    'stories/Components/Fixture/Fixture.stories.tsx',
    `
    throw new Error('Story code must never execute');
    const title = 'Components/Fixture';
    const meta = { title } satisfies Record<string, string>;
    export default meta;
    export const Default = { render: () => <div /> };
    const local = {};
    export { local as Alternate };
    export function FunctionExample() { return <div />; }
    export type ExampleType = string;
  `
  );
  assert.equal(parsed.title, 'Components/Fixture');
  assert.deepEqual(
    parsed.stories.map(story => story.exportName),
    ['Default', 'Alternate', 'FunctionExample']
  );
  assert.equal(
    parsed.stories[0].id,
    'stories/Components/Fixture/Fixture/Default'
  );
  assert.throws(
    () =>
      parseStorySource(
        'unknown.stories.js',
        'export default { title: getTitle() };'
      ),
    /static Storybook title/
  );
});

const inventory = buildPlannedInventory(families);
const entry = fragment =>
  inventory.entries.find(item => item.source.endsWith(fragment));

test('Actual catalogue includes missing public components and all existing family associations', () => {
  for (const fragment of [
    'Hero/Hero.stories.jsx',
    'Card/VerticalCard.stories.jsx',
    'Snackbar/Snackbar.stories.jsx',
    'CookieConsentBanner/CookieConsentBanner.stories.jsx',
    'Range/Range.stories.jsx',
    'FormAction/FormAction.stories.jsx',
  ]) {
    assert.ok(entry(fragment), `Missing public source: ${fragment}`);
    assert.equal(entry(fragment).status, 'not-scaffolded');
  }
  assert.deepEqual(inventory.unassociatedFamilyIds, []);
  assert.equal(inventory.counts.existingRecipeFamilies, 28);
  assert.equal(inventory.counts.mappedSourceExamples, 0);
  assert.ok(entry('CtaButton/CtaButton.stories.jsx').remainingExamples.length);
  assert.ok(
    inventory.entries.every(
      item =>
        item.nativeAcceptance === 'unverified' &&
        item.representation === 'documentation-only'
    )
  );
  assert.ok(
    inventory.entries
      .flatMap(item => item.stories)
      .every(story => story.classification === 'source-example')
  );
});

test('Excluded demos/foundations have reasons; Details retains only disclosure examples', () => {
  for (const fragment of [
    'ChildHero.stories.jsx',
    'Boilerplate.stories.jsx',
    'TypeScriptExampleComponent.stories.tsx',
    'PageTemplateExample.stories.jsx',
    'Grid.stories.jsx',
    'PagePatterns.stories.jsx',
  ]) {
    assert.ok(
      inventory.excluded.some(
        item => item.source.endsWith(fragment) && item.reason.length > 10
      ),
      fragment
    );
    assert.ok(!entry(fragment));
  }
  assert.ok(
    inventory.excluded.some(item => item.source.includes('Documentation/'))
  );
  assert.deepEqual(
    entry('BaseTypography/BaseTypography.stories.jsx').stories.map(
      story => story.exportName
    ),
    [
      'TypographyDetails',
      'TypographyDetailsBaseline',
      'TypographyAccordion',
      'TypographyAccordionFlush',
    ]
  );
  assert.ok(
    entry('BaseTypography/BaseTypography.stories.jsx').excludedStoryExports
      .length
  );
  assert.equal(
    entry('ErrorPages/ErrorPage.stories.jsx').groupId,
    'page-patterns'
  );
  assert.equal(
    entry('SyndicationSearchWidget.DisplayModes.stories.jsx').label,
    'Syndicated search / Display modes'
  );
});

const heroFile = 'stories/Components/Hero/Hero.stories.jsx';
const cardFile = 'stories/Components/Cards/Card/VerticalCard.stories.jsx';
const extended = [
  ...families,
  { id: 'hero', variants: [{ id: 'hero.default' }] },
  { id: 'card', variants: [{ id: 'card.vertical.default' }] },
];
const declarations = [
  {
    storyFile: heroFile,
    familyId: 'hero',
    variantIds: ['hero.default'],
    storyExports: ['Default'],
  },
  {
    storyFile: cardFile,
    familyId: 'card',
    variantIds: ['card.vertical.default'],
    storyExports: ['DefaultVerticalCard'],
  },
];

test('Initial Hero/Card mappings retain missing stories and never imply acceptance', () => {
  const mapped = buildPlannedInventory(extended, { coverage: declarations });
  assert.equal(mapped.counts.mappedSourceExamples, 2);
  assert.equal(
    mapped.counts.examplesWithoutDeclaredMapping,
    mapped.counts.sourceExamples - 2
  );
  assert.equal(
    mapped.counts.examplesStillToMapOrVerify,
    mapped.counts.sourceExamples
  );
  assert.equal(
    mapped.counts.filesWithoutScaffolds,
    inventory.counts.filesWithoutScaffolds - 2
  );
  for (const source of [heroFile, cardFile]) {
    const item = mapped.entries.find(candidate => candidate.source === source);
    assert.equal(item.status, 'partial-source-scaffold');
    assert.ok(item.remainingExamples.length);
    assert.equal(item.unverifiedMappedExamples.length, 1);
    assert.equal(
      item.stories[0].scaffoldMappings[0].status,
      'source-scaffold-only'
    );
    assert.equal(item.stories[0].nativeAcceptance, 'unverified');
  }
});

test('Invalid and duplicate coverage refuses rather than inventing components/variants', () => {
  const valid = declarations[0];
  const refuses = declaration =>
    assert.throws(() =>
      buildPlannedInventory(extended, { coverage: [declaration] })
    );
  refuses({ ...valid, storyFile: 'stories/missing.stories.jsx' });
  refuses({ ...valid, familyId: 'missing' });
  refuses({ ...valid, variantIds: ['hero.missing'] });
  refuses({ ...valid, variantIds: ['hero.default', 'hero.default'] });
  refuses({ ...valid, storyExports: ['MissingExport'] });
  refuses({ ...valid, storyExports: ['Default', 'Default'] });
  assert.throws(
    () => buildPlannedInventory(extended, { coverage: [valid, valid] }),
    /duplicate source story coverage/
  );
  assert.throws(
    () => buildPlannedInventory([families[0], families[0]]),
    /Duplicate or malformed/
  );
});

test('Catalogue output is deterministic and leaves recipes/coverage unchanged', () => {
  assert.deepEqual(buildPlannedInventory(families), inventory);
  assert.equal(JSON.stringify(families), original);
  const before = JSON.stringify({ extended, declarations });
  buildPlannedInventory(extended, { coverage: declarations });
  assert.equal(JSON.stringify({ extended, declarations }), before);
  assert.equal(
    new Set(inventory.entries.map(item => item.id)).size,
    inventory.entries.length
  );
  assert.equal(
    new Set(
      inventory.entries.flatMap(item => item.stories.map(story => story.id))
    ).size,
    inventory.counts.sourceExamples
  );
});

console.log(
  `${checks} planned-inventory groups passed. Native appearance, behavior and acceptance remain unverified.`
);
