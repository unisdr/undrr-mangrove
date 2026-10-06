#!/usr/bin/env node
/** Integration checks for the isolated source-only packet. No native rendering. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const {
  buildDraftPacket,
  validateDrafts,
} = require('../../../scripts/build-figma-component-drafts.cjs');
const {
  buildFigmaVariables,
} = require('../../../scripts/build-figma-tokens.cjs');
const { environment, importFoundation } = require('./mock-kit.cjs');
const root = path.resolve(__dirname, '../../..');
const copy = value => JSON.parse(JSON.stringify(value));
const identity = node =>
  node.getSharedPluginData('orgundrrmangrove', 'mgKitId');
const property = (node, name) =>
  Object.keys(node.componentProperties).find(
    key => key.replace(/#[^#]+$/, '') === name
  );
function cli(args) {
  return spawnSync(
    process.execPath,
    [path.join(root, 'scripts/build-figma-component-drafts.cjs'), ...args],
    { cwd: root, encoding: 'utf8' }
  );
}
async function main() {
  const dtoFile = path.join(
    root,
    'examples/figma-plugin/mangrove-variables.json'
  );
  const originalBytes = fs.readFileSync(dtoFile);
  const original = buildFigmaVariables();
  const originalSnapshot = copy(original);
  const packet = buildDraftPacket();
  assert.deepStrictEqual(
    packet,
    buildDraftPacket(),
    'Packet generation must be deterministic with unchanged inputs'
  );
  assert.deepStrictEqual(
    copy(buildFigmaVariables()),
    originalSnapshot,
    'Draft build must not change the full exporter JSON output'
  );
  assert.deepStrictEqual(
    fs.readFileSync(dtoFile),
    originalBytes,
    'Canonical DTO bytes must remain untouched'
  );
  assert.strictEqual(packet.kind, 'mangrove-component-source-drafts');
  assert.deepStrictEqual(
    packet.draftFamilies.map(f => [f.id, f.variants.length]),
    [
      ['range', 4],
      ['tag', 5],
      ['notice', 4],
      ['breadcrumbs', 2],
      ['skip-link', 1],
      ['highlight-box', 3],
      ['accordion', 4],
      ['pager', 3],
      ['user-feedback', 2],
      ['section-header', 2],
      ['image-caption', 3],
      ['embed-container', 4],
      ['book-card', 2],
      ['horizontal-book-card', 8],
      ['icon-card', 9],
      ['search-form', 3],
      ['search-select', 7],
      ['search-active-filters', 3],
      ['search-facet-operator', 2],
      ['landing-report-article-column', 2],
      ['news-detail-article-column', 2],
      ['page-chrome', 6],
      ['page-bulleted-toc', 4],
      ['quote-highlight', 12],
      ['page-chrome-capped-action', 2],
      ['page-chrome-desktop-panel', 12],
      ['page-chrome-mobile', 10],
      ['landing-report-breadcrumb', 2],
      ['landing-report-feature-band', 2],
      ['landing-report', 2],
      ['article-header', 2],
      ['share-buttons', 4],
      ['news-related-card', 6],
      ['news-taxonomy', 2],
      ['news-recommendations', 2],
      ['news-contextual-highlight', 2],
      ['copy-button', 36],
      ['cite-trigger', 2],
      ['cite-dialog', 18],
      ['cite-fallback', 4],
      ['article-image-header', 8],
      ['content-hub-tertiary-cta', 1],
      ['content-hub-header', 32],
      ['content-hub-reading-column', 4],
      ['content-hub-intro', 24],
      ['content-hub-resources', 2],
      ['content-hub-toc', 4],
      ['content-hub-route-card', 28],
      ['content-hub-breadcrumb', 4],
      ['content-hub-route-band', 8],
      ['content-hub-fact-band', 6],
      ['content-hub-reporting-grid', 2],
      ['content-hub-soft-cta', 2],
      ['content-hub-page', 34],
      ['search-widget-form-context', 40],
      ['search-widget-result-context', 134],
      ['search-widget-select-context', 104],
      ['search-widget-facets-context', 21],
      ['search-widget-pager-context', 36],
      ['search-widget-drawer-context', 4],
      ['search-widget', 44],
      ['form-group', 12],
      ['form-action', 8],
      ['form-action-newsletter', 8],
      ['news-source-exclusion', 2],
      ['news-article-initial-media', 10],
      ['news-article-scene', 10],
      ['legend', 10],
      ['stats-card-item', 44],
      ['stats-card', 14],
      ['tree', 14],
      ['gallery-image', 44],
      ['code-block', 16],
      ['show-more', 18],
      ['scroll-hydrated-card', 12],
      ['scroll-container-hydrated', 6],
      ['scroll-source-photo-card', 5],
      ['scroll-container-photo', 22],
      ['error-page-search-input', 2],
      ['error-page-search-action', 2],
      ['error-page-search-form', 2],
      ['error-page', 20],
      ['preview-access-static', 4],
      ['preview-access-live', 6],
      ['landing-topic-index-breadcrumb', 4],
      ['landing-topic-hero', 2],
      ['landing-topic-icon-card', 14],
      ['landing-topic-related-card', 6],
      ['landing-topic-soft-cta', 2],
      ['landing-index-book-card', 18],
      ['landing-topic-page', 2],
      ['landing-index-page', 2],
      ['drawer', 20],
      ['cookie-consent-toggle', 12],
      ['cookie-consent-banner', 6],
      ['cookie-consent-preferences', 16],
      ['footer', 10],
      ['layout-container', 8],
      ['layout-grid-specimen', 4],
      ['full-width-background', 16],
      ['semantic-heading-specimen', 6],
      ['semantic-paragraph', 60],
      ['semantic-copy-separators', 12],
      ['semantic-description-list', 6],
      ['semantic-figcaption', 6],
      ['semantic-inline-emphasis', 6],
      ['semantic-code-finite', 6],
      ['logo', 210],
      ['page-header', 44],
      ['on-this-page-nav', 46],
      ['image-figure', 72],
      ['gallery-html', 8],
      ['gallery-mixed-media-image', 4],
      ['news-image-article-scene', 40],
      ['service-notice', 6],
      ['snackbar', 8],
      ['user-feedback-confirmation', 4],
      ['search-result-item', 42],
      ['search-result-fields', 14],
      ['search-result-state', 20],
    ]
  );
  assert.strictEqual(
    packet.draftFamilies.reduce((n, f) => n + f.variants.length, 0),
    1800
  );
  for (const field of [
    'collection',
    'modes',
    'variables',
    'styles',
    'components',
  ])
    assert.strictEqual(packet[field], undefined);
  for (const [old, expanded] of [
    [original.variables, packet.foundationCatalogue.variables],
    [original.styles.text, packet.foundationCatalogue.styles.text],
    [original.styles.effect, packet.foundationCatalogue.styles.effect],
  ])
    for (const entry of old)
      assert.deepStrictEqual(
        expanded.find(v => v.id === entry.id),
        entry
      );
  const expectedButton = copy(
    original.components.families.find(f => f.id === 'button')
  );
  expectedButton.id = 'page-chrome-button';
  expectedButton.name = 'Page chrome source Button dependency';
  expectedButton.variants.forEach(v => {
    v.id = v.id.replace(/^button\./, 'page-chrome-button.');
  });
  if (expectedButton.defaultVariantId)
    expectedButton.defaultVariantId = expectedButton.defaultVariantId.replace(
      /^button\./,
      'page-chrome-button.'
    );
  assert.strictEqual(expectedButton.variants.length, 16);
  assert.deepStrictEqual(
    packet.draftDependencies.find(f => f.id === 'page-chrome-button'),
    expectedButton
  );
  const expectedNotificationStatus = copy(
    original.components.families.find(f => f.id === 'status-label')
  );
  expectedNotificationStatus.id = 'notification-status-label';
  expectedNotificationStatus.name = 'Mangrove draft / Notification status';
  expectedNotificationStatus.variants.forEach(v => {
    v.id = v.id.replace(/^status-label\./, 'notification-status-label.');
  });
  assert.strictEqual(expectedNotificationStatus.variants.length, 7);
  assert.deepStrictEqual(
    packet.draftDependencies.find(f => f.id === 'notification-status-label'),
    expectedNotificationStatus
  );
  const foundation = packet.foundationCatalogue;
  const validate = (families, assets = foundation) =>
    validateDrafts(families, assets, packet.draftDependencies);
  validate(packet.draftFamilies);
  assert.deepStrictEqual(
    packet.draftDependencies.map(f => f.id),
    [
      'editorial-cta',
      'page-chrome-button',
      'checkbox',
      'radio',
      'drawer-checkbox',
      'notification-status-label',
    ]
  );
  assert.deepStrictEqual(
    packet.draftDependencies[0],
    original.components.families.find(f => f.id === 'editorial-cta')
  );
  assert.throws(
    () => validateDrafts(packet.draftFamilies, foundation),
    /Missing component dependency/
  );
  const missingRichPaint = copy(packet.draftFamilies);
  function findRich(node) {
    if (node.textRuns) return node;
    return (node.children || []).map(findRich).find(Boolean);
  }
  const rich = missingRichPaint
    .find(f => f.id === 'horizontal-book-card')
    .variants.map(v => findRich(v.tree))
    .find(Boolean);
  assert(rich, 'Rich card fixture missing');
  rich.textRuns[0].fill = 'color/missing-rich-paint';
  assert.throws(() => validate(missingRichPaint), /Missing\/wrong rich paint/);
  const missingVariant = copy(packet.draftFamilies);
  function breakInstance(node) {
    if (node.type === 'INSTANCE') node.variant.Context = 'UnknownDraftTest';
    (node.children || []).forEach(breakInstance);
  }
  missingVariant
    .find(f => f.id === 'horizontal-book-card')
    .variants.forEach(v => breakInstance(v.tree));
  assert.throws(
    () => validate(missingVariant),
    /Ambiguous\/missing dependency variant/
  );
  const missing = copy(packet.draftFamilies);
  missing[0].variants[0].tree.fill = 'color/nonexistent-draft-test';
  assert.throws(
    () => validate(missing),
    /Missing variable color\/nonexistent-draft-test/
  );
  const cycle = copy(foundation);
  const badSvg = copy(packet.draftFamilies);
  const icon = badSvg.find(f => f.id === 'notice').variants[0].tree.children[0]
    .children[0];
  assert.strictEqual(icon.type, 'SVG');
  icon.svg.monochrome = { strokes: 'color/missing-svg-role' };
  assert.throws(
    () => validate(badSvg),
    /Missing variable color\/missing-svg-role/
  );
  const duplicateStyleName = copy(foundation);
  duplicateStyleName.styles.text[1].name =
    duplicateStyleName.styles.text[0].name;
  assert.throws(
    () => validate(packet.draftFamilies, duplicateStyleName),
    /Duplicate name/
  );
  const a = cycle.variables.find(v => v.name === 'color/tag');
  const b = cycle.variables.find(v => v.name === 'color/interactive');
  a.values.undrr = { alias: b.name };
  b.values.undrr = { alias: a.name };
  assert.throws(() => validate(packet.draftFamilies, cycle), /Alias cycle/);
  const duplicate = copy(packet.draftFamilies);
  const tree = duplicate[0].variants[0].tree;
  tree.children[0].id = tree.id;
  assert.throws(() => validate(duplicate), /Missing\/duplicate anatomy ID/);
  console.log(
    'ok  isolated deterministic 120-family/1800-variant packet retains full DTO and exact dependencies, rejecting missing roles, alias cycles and duplicate anatomy'
  );

  // Use the actual importer entry, not a duplicated preflight. The packet must
  // refuse before any variable/style/collection/node mutation takes place.
  const rejected = environment(original, { sharedOnly: true });
  const state = () =>
    copy({
      collections: rejected.state.collections.map(v => [v.id, v.name]),
      variables: rejected.state.variables.map(v => [v.id, v.name]),
      styles: rejected.state.styles.map(v => [v.id, v.name]),
      nodes: [...rejected.state.nodes.keys()],
      loadedFonts: [...rejected.state.loadedFonts],
    });
  const beforeReject = state();
  await assert.rejects(
    rejected.call('importVariables', packet, ['undrr'], false, [], true),
    /Import preflight: collection must have a name/
  );
  assert.deepStrictEqual(state(), beforeReject);
  console.log(
    'ok  actual importer refuses the source-only packet before mutation'
  );

  // Only the offline harness adapts to the regular DTO shape. The deliverable
  // keeps its deliberately incompatible packet structure.
  const doc = copy(original);
  doc.variables = copy(foundation.variables);
  doc.styles = copy(foundation.styles);
  for (const variable of doc.variables)
    assert(
      Array.isArray(variable.scopes),
      `Expanded source foundation must declare native variable scopes: ${variable.name}`
    );

  const originalDraftIds = [
    'range',
    'tag',
    'notice',
    'breadcrumbs',
    'skip-link',
    'highlight-box',
    'accordion',
    'pager',
    'user-feedback',
  ];
  // This original nine-family lifecycle fixture retains its exact SVG model.
  // Editorial and rich Card cohorts have independent actual-builder harnesses.
  doc.components.families = copy(
    packet.draftFamilies.filter(f => originalDraftIds.includes(f.id))
  );
  const env = environment(doc, { sharedOnly: true });
  // Import the complete expanded foundation using the separately reviewed
  // exact background-blur API fixture. The combined scene cohort remains9/28.
  require('./mock-notification-states.cjs').installBackgroundBlurFixture(env);
  require('./mock-text-case.cjs').installTextCaseFixture(env);
  const expectedSvg = packet.draftFamilies
    .find(f => f.id === 'notice')
    .variants.map(v => v.tree.children[0].children[0].svg.markup);
  env.figma.createNodeFromSvg = markup => {
    // Exact four-asset fixture for API lifecycle only. This does not model
    // native path bounds, strokes, joins or pixel rendering.
    assert(expectedSvg.includes(markup.replace(/ width="24" height="24"/, '')));
    const frame = env.figma.createFrame();
    frame.resize(24, 24);
    Object.getPrototypeOf(frame).rescale = function (scale) {
      this.resizeWithoutConstraints(this.width * scale, this.height * scale);
      for (const child of this.children || [])
        child.resizeWithoutConstraints(
          child.width * scale,
          child.height * scale
        );
    };
    const vector = new frame.constructor('VECTOR');
    vector.resize(24, 24);
    vector.vectorPaths = [{ windingRule: 'NONZERO', data: 'M0 0' }];
    const paint = [
      { type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 1, visible: true },
    ];
    vector.fills = markup.includes('fill="#000000"') ? copy(paint) : [];
    vector.strokes = markup.includes('stroke="#000000"') ? copy(paint) : [];
    frame.appendChild(vector);
    return frame;
  };
  require('./mock-breadcrumbs.cjs').installBreadcrumbSvgFixture(
    env,
    packet.draftFamilies.find(f => f.id === 'breadcrumbs')
  );
  require('./mock-accordion.cjs').installAccordionSvgFixture(
    env,
    packet.draftFamilies.find(f => f.id === 'accordion')
  );
  require('./mock-pager.cjs').installPagerSvgFixture(env, packet.draftFamilies);
  await importFoundation(env, doc);
  const selected = originalDraftIds;
  const first = await env.call(
    'buildMangroveComponents',
    doc,
    'undrr',
    selected
  );
  assert.deepStrictEqual(copy(first.errors), []);
  assert.strictEqual(first.families.length, 9);
  assert.strictEqual(
    first.families.reduce((n, f) => n + f.variantIds.length, 0),
    28
  );
  const consumer = [...env.state.nodes.values()].find(
    n =>
      n.type === 'INSTANCE' &&
      identity(n) === 'review/tag/specimen/source-default/instance'
  );
  assert(consumer, 'Combined build must retain Tag review consumer');
  consumer.setProperties({
    [property(consumer, 'Label')]: 'Combined build edited label',
  });
  const ids = () =>
    [...env.state.nodes.values()]
      .filter(identity)
      .map(n => [identity(n), n.id])
      .sort((a, b) => a[0].localeCompare(b[0]));
  const beforeRepeat = ids();
  const repeated = await env.call(
    'buildMangroveComponents',
    doc,
    'undrr',
    selected
  );
  assert.deepStrictEqual(copy(repeated.errors), []);
  assert.strictEqual(repeated.createdNodeIds.length, 0);
  assert.deepStrictEqual(ids(), beforeRepeat);
  assert.strictEqual(
    consumer.componentProperties[property(consumer, 'Label')].value,
    'Combined build edited label'
  );
  console.log(
    'ok  combined shared-identity builder constructs all28 variants and repeats without creation or lost Label overrides'
  );

  const temporary = fs.mkdtempSync(
    path.join(os.tmpdir(), 'mangrove-component-drafts-test-')
  );
  try {
    const output = path.join(temporary, 'nested', 'drafts.json');
    const created = cli(['--output', output]);
    assert.strictEqual(created.status, 0, created.stderr);
    const bytes = fs.readFileSync(output, 'utf8');
    assert.deepStrictEqual(JSON.parse(bytes), packet);
    const checked = cli(['--check', output]);
    assert.strictEqual(checked.status, 0, checked.stderr);
    assert.strictEqual(fs.readFileSync(output, 'utf8'), bytes);
    const overwrite = cli(['--output', output]);
    assert.notStrictEqual(overwrite.status, 0);
    assert.match(overwrite.stderr, /new output path/);
    assert.strictEqual(fs.readFileSync(output, 'utf8'), bytes);
    fs.writeFileSync(output, '{}\n');
    const stale = cli(['--check', output]);
    assert.notStrictEqual(stale.status, 0);
    assert.match(stale.stderr, /Stale draft packet/);
    assert.strictEqual(fs.readFileSync(output, 'utf8'), '{}\n');
    const forbidden = path.join(
      root,
      'examples/figma-plugin/dev/never-create-draft-test.json'
    );
    assert(!fs.existsSync(forbidden));
    for (const action of ['--output', '--check']) {
      const result = cli([action, forbidden]);
      assert.notStrictEqual(result.status, 0);
      assert.match(result.stderr, /must stay outside source/);
      assert(!fs.existsSync(forbidden));
    }
    const invalid = cli([]);
    assert.notStrictEqual(invalid.status, 0);
    assert.match(invalid.stderr, /Use --output/);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
  assert.deepStrictEqual(fs.readFileSync(dtoFile), originalBytes);
  console.log(
    'ok  CLI output/check, overwrite/staleness/source-path/argument guards with cleaned external temporary files'
  );
  console.log(
    'Component drafts integration passed. Native/browser acceptance and publication remain unverified.'
  );
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
