#!/usr/bin/env node
/** Explicit source-only component packet. Never the normal importer input. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert');
const { execFileSync } = require('child_process');
const { buildFigmaVariables } = require('./build-figma-tokens.cjs');
const ROOT = path.resolve(__dirname, '..');
const copy = value => JSON.parse(JSON.stringify(value));
const digest = value =>
  crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const recipes = [
  ['range', './figma-range-recipes.cjs', 'buildRangeRecipes'],
  ['tag', './figma-tag-recipes.cjs', 'buildTagRecipes'],
  ['notice', './figma-notice-recipes.cjs', 'buildNoticeRecipes'],
  ['breadcrumbs', './figma-breadcrumb-recipes.cjs', 'buildBreadcrumbRecipes'],
  ['skip-link', './figma-skip-link-recipes.cjs', 'buildSkipLinkRecipes'],
  [
    'highlight-box',
    './figma-highlight-box-recipes.cjs',
    'buildHighlightBoxRecipes',
  ],
];

function validateDrafts(families, assets) {
  for (const [list, key] of [
    [families, 'id'],
    [assets.variables, 'id'],
    [assets.variables, 'name'],
    [assets.styles.text, 'id'],
    [assets.styles.text, 'name'],
    [assets.styles.effect, 'id'],
    [assets.styles.effect, 'name'],
  ]) {
    assert.strictEqual(
      new Set(list.map(entry => entry[key])).size,
      list.length,
      `Duplicate ${key}`
    );
  }
  const variables = new Map(assets.variables.map(v => [v.name, v]));
  const modes = assets.modes.map(m => m.id);
  function resolve(name, mode, seen = new Set()) {
    assert(!seen.has(name), `Alias cycle at ${name}/${mode}`);
    const variable = variables.get(name);
    assert(variable, `Missing variable ${name}`);
    const value = variable.values[mode];
    assert(value !== undefined && value !== null, `Missing ${name}/${mode}`);
    if (value.alias) {
      seen.add(name);
      resolve(value.alias, mode, seen);
    }
  }
  for (const variable of assets.variables)
    for (const mode of modes) resolve(variable.name, mode);
  const styleIds = {
    text: new Set(assets.styles.text.map(s => s.id)),
    effect: new Set(assets.styles.effect.map(s => s.id)),
  };
  const role = value => {
    if (typeof value === 'string' && value.includes('/'))
      for (const mode of modes) resolve(value, mode);
  };
  for (const kind of ['text', 'effect'])
    for (const style of assets.styles[kind]) {
      for (const mode of modes)
        assert(
          style.values[mode] !== undefined,
          `Missing style ${style.id}/${mode}`
        );
      for (const binding of Object.values(style.bindings || {})) role(binding);
      if (kind === 'effect')
        for (const values of Object.values(style.values))
          for (const effect of values)
            for (const binding of Object.values(effect.bindings || {}))
              role(binding);
    }
  for (const family of families) {
    assert(
      family.variants.length && family.limitations.length,
      'Bounded draft contract required'
    );
    assert.strictEqual(
      new Set(family.variants.map(v => v.id)).size,
      family.variants.length
    );
    for (const variant of family.variants) {
      const ids = new Set();
      function visit(node) {
        assert(
          typeof node.id === 'string' && node.id && !ids.has(node.id),
          `Missing/duplicate anatomy ID in ${variant.id}`
        );
        ids.add(node.id);
        assert(
          ['FRAME', 'TEXT', 'ELLIPSE', 'SVG'].includes(node.type),
          `Unsupported draft node ${node.type}`
        );
        for (const value of [
          node.fill,
          node.stroke,
          ...Object.values(node.svg?.monochrome || {}),
          ...Object.values(node.bindings || {}),
          ...Object.values(node.appearance || {}),
          ...Object.values(node.layout || {}),
          ...Object.values(node.layout?.padding || {}),
        ])
          role(value);
        if (node.textStyle)
          assert(
            styleIds.text.has(node.textStyle),
            `Missing text style ${node.textStyle}`
          );
        if (node.effectStyle)
          assert(
            styleIds.effect.has(node.effectStyle),
            `Missing effect style ${node.effectStyle}`
          );
        for (const child of node.children || []) visit(child);
      }
      visit(variant.tree);
    }
  }
}

function buildDraftPacket() {
  const base = buildFigmaVariables();
  const assets = copy({
    modes: base.modes,
    variables: base.variables,
    styles: base.styles,
  });
  const families = recipes.flatMap(([id, modulePath, method]) => {
    const result = require(modulePath)[method]({ root: ROOT, ...assets });
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].id, id);
    return result;
  });
  // Experimental helpers may append; existing foundation records must stay exact.
  assert.deepStrictEqual(assets.modes, base.modes);
  for (const [existing, expanded] of [
    [base.variables, assets.variables],
    [base.styles.text, assets.styles.text],
    [base.styles.effect, assets.styles.effect],
  ])
    for (const entry of existing)
      assert.deepStrictEqual(
        expanded.find(v => v.id === entry.id),
        entry
      );
  validateDrafts(families, assets);
  const baseAssets = { variables: base.variables, styles: base.styles };
  return {
    kind: 'mangrove-component-source-drafts',
    schemaVersion: 1,
    status:
      'Source and mock contracts only; not imported, published or natively accepted',
    source: {
      revision: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT })
        .toString()
        .trim(),
      workingInputs: execFileSync(
        'git',
        [
          'status',
          '--porcelain',
          '--untracked-files=all',
          '--',
          'tokens',
          'scripts',
          'stories',
        ],
        { cwd: ROOT }
      ).toString(),
    },
    baseContract: {
      assetsSha256: digest(baseAssets),
      componentRecipesSha256: digest(base.components),
      variables: base.variables.length,
      textDefinitions: base.styles.text.length,
      effects: base.styles.effect.length,
      families: base.components.families.length,
      variants: base.components.families.reduce(
        (n, f) => n + f.variants.length,
        0
      ),
    },
    foundationCatalogue: { collectionName: base.collection, ...assets },
    draftFamilies: families,
    limitations: [
      'This packet deliberately omits top-level collection, modes, variables, styles and components fields required by the importer. Do not adapt it into canonical import input without a reviewed native plan.',
      'No changes to the normal exporter, maintenance catalogue, core selection, existing Figma files or publication are made.',
      'Source-derived values and mock API checks do not establish browser/native geometry, exact fonts, all-brand rendering or editable consumer acceptance.',
    ],
  };
}

function main(args) {
  if (
    !args.length ||
    !['--output', '--check'].includes(args[0]) ||
    args.length !== 2
  )
    throw new Error(
      'Use --output <new external JSON path> or --check <existing external JSON path>.'
    );
  const output = path.resolve(args[1]);
  if (output === ROOT || output.startsWith(`${ROOT}${path.sep}`))
    throw new Error('Draft packet must stay outside source.');
  const json = `${JSON.stringify(buildDraftPacket(), null, 2)}\n`;
  if (args[0] === '--check') {
    assert.strictEqual(
      fs.readFileSync(output, 'utf8'),
      json,
      'Stale draft packet'
    );
    console.log('Component draft packet is current; no files changed.');
  } else {
    if (fs.existsSync(output))
      throw new Error('Use a new output path to preserve prior drafts.');
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, json, { flag: 'wx' });
    console.log(`Prepared source-only component draft packet: ${output}`);
  }
}
if (require.main === module) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
module.exports = { buildDraftPacket, validateDrafts, main };
