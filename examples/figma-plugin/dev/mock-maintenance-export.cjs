#!/usr/bin/env node
/** Complete asset compatibility and isolated source-backed maintenance generation. */
'use strict';

const assert = require('assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const ROOT = path.resolve(__dirname, '../../..');
const ENTRY = path.join(ROOT, 'scripts/build-figma-maintenance-tokens.cjs');
const { buildFigmaMaintenance } = require(ENTRY);
const project = ({ collection, modes, variables, styles, skipped }) => ({
  collection,
  modes,
  variables,
  styles,
  skipped,
});
const maintenance = buildFigmaMaintenance();
const assets = project(maintenance);
if (process.argv.includes('--compare-full')) {
  const { buildFigmaVariables } = require(
    path.join(ROOT, 'scripts/build-figma-tokens.cjs')
  );
  assert.deepEqual(
    assets,
    project(buildFigmaVariables()),
    'Complete asset records and order must match the full builder.'
  );
  console.log(
    'ok  explicit full exporter comparison preserves every asset record and its order'
  );
}
assert.equal(maintenance.variables.length, 520);
assert.equal(maintenance.styles.text.length, 102);
assert.equal(maintenance.styles.effect.length, 8);
assert.equal(maintenance.modes.length, 5);
assert.deepEqual(Object.keys(maintenance), [
  '$comment',
  'collection',
  'modes',
  'variables',
  'styles',
  'skipped',
]);

// Optional captured pre-extraction baseline is evidence, never a production source.
const baselineIndex = process.argv.indexOf('--baseline');
if (baselineIndex >= 0) {
  assert.ok(process.argv[baselineIndex + 1], '--baseline requires a JSON path');
  assert.deepEqual(
    assets,
    project(
      JSON.parse(fs.readFileSync(process.argv[baselineIndex + 1], 'utf8'))
    )
  );
}

const variables = new Map(
  maintenance.variables.map(variable => [variable.name, variable])
);
assert.equal(
  variables.size,
  maintenance.variables.length,
  'Variable names must be unique.'
);
assert.equal(
  new Set(maintenance.variables.map(variable => variable.id)).size,
  maintenance.variables.length
);
function resolve(variable, mode, seen = new Set()) {
  assert.ok(variable, 'Every alias must target an exported variable.');
  assert.ok(!seen.has(variable.id), `Alias cycle at ${variable.id}`);
  assert.ok(
    Object.hasOwn(variable.values, mode),
    `Missing mode ${mode} in ${variable.id}`
  );
  const value = variable.values[mode];
  if (value && value.alias) {
    const target = variables.get(value.alias);
    assert.equal(target?.type, variable.type, 'Alias target type must match.');
    return resolve(target, mode, new Set(seen).add(variable.id));
  }
  return value;
}
for (const variable of maintenance.variables)
  for (const mode of maintenance.modes) resolve(variable, mode.id);
for (const style of maintenance.styles.text)
  for (const binding of Object.values(style.bindings || {}))
    assert.ok(variables.has(binding), `Missing text binding ${binding}`);
for (const style of maintenance.styles.effect)
  for (const effects of Object.values(style.values))
    for (const effect of effects)
      for (const binding of Object.values(effect.bindings || {}))
        assert.ok(variables.has(binding), `Missing effect binding ${binding}`);

const temporary = fs.mkdtempSync(
  path.join(os.tmpdir(), 'mangrove-maintenance-export-')
);
try {
  const preload = path.join(temporary, 'isolation.cjs');
  const trace = path.join(temporary, 'loaded.json');
  const output = path.join(temporary, 'fresh/nested/assets.json');
  fs.writeFileSync(
    preload,
    `
'use strict';
const Module = require('module');
const fs = require('fs');
const path = require('path');
const load = Module._load;
const read = fs.readFileSync;
const loaded = new Set();
// Exercise the combined CLI while directing only its two outputs into this fixture.
const replacements = new Map();
if (process.env.MG_OUTPUT_ROOT) {
  const outputs = ['examples/figma-plugin/mangrove-maintenance-tokens.json', 'examples/figma-plugin/maintenance/build/main.js'];
  for (const [index, file] of outputs.entries()) {
    const source = path.join(process.env.MG_REPOSITORY_ROOT, file);
    const target = path.join(process.env.MG_OUTPUT_ROOT, String(index), path.basename(file));
    replacements.set(source, target);
    replacements.set(path.dirname(source), path.dirname(target));
  }
}
const redirect = file => replacements.get(String(file)) || file;
for (const method of ['existsSync', 'writeFileSync', 'mkdirSync']) {
  const original = fs[method];
  fs[method] = function(file, ...args) { return original.call(this, redirect(file), ...args); };
}
Module._load = function(request, parent, isMain) {
  const resolved = Module._resolveFilename(request, parent, isMain);
  if (typeof resolved === 'string' && (
    /(?:build-figma-tokens|build-figma-plugin|figma-[^/]*(?:recipes|probe)|figma-planned-inventory|figma-kit-guidance)\\.cjs$/.test(resolved)
    || /(?:^|[/\\\\])(?:@babel|terser)(?:[/\\\\]|$)/.test(resolved)
  )) throw new Error('Construction dependency was loaded: ' + resolved);
  loaded.add(resolved);
  return load.apply(this, arguments);
};
fs.readFileSync = function(file, ...args) {
  const value = read.call(this, redirect(file), ...args);
  const name = String(file);
  if (process.env.MG_SOURCE_MUTATION === 'tab' && name.endsWith('/stories/assets/scss/_tokens-tabs.scss'))
    return String(value).replace('--mg-tab-rail-gap: var(--mg-spacing-50);', '--mg-tab-rail-gap: var(--mg-spacing-75);');
  if (process.env.MG_SOURCE_MUTATION === 'focus' && name.endsWith('/stories/assets/scss/_mixins.scss'))
    return String(value).replace('outline-offset: var(--mg-focus-ring-offset);', 'outline-offset: 0;');
  if (process.env.MG_SOURCE_MUTATION === 'image' && name.endsWith('/stories/assets/images/sample_image-lg.jpg'))
    return Buffer.concat([Buffer.from(value), Buffer.from('changed source')]);
  return value;
};
process.once('exit', () => fs.writeFileSync(process.env.MG_LOAD_TRACE, JSON.stringify([...loaded])));
`
  );
  function run(args, mutation = '', entry = ENTRY, combined = false) {
    return spawnSync(process.execPath, ['--require', preload, entry, ...args], {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 8 * 1024 * 1024,
      env: {
        ...process.env,
        MG_LOAD_TRACE: trace,
        MG_SOURCE_MUTATION: mutation,
        MG_OUTPUT_ROOT: combined ? path.join(temporary, 'combined') : '',
        MG_REPOSITORY_ROOT: ROOT,
      },
    });
  }
  function success(args, mutation, entry, combined) {
    const result = run(args, mutation, entry, combined);
    assert.equal(result.status, 0, result.stderr || result.error?.message);
    return result;
  }
  success(['--output', output]);
  assert.deepEqual(JSON.parse(fs.readFileSync(output, 'utf8')), maintenance);
  const writeTime = fs.statSync(output).mtimeMs;
  success(['--output', output]);
  assert.equal(
    fs.statSync(output).mtimeMs,
    writeTime,
    'Repeated generation must not rewrite identical bytes.'
  );
  success(['--output', output, '--check']);
  const stdout = success(['--stdout']);
  assert.deepEqual(JSON.parse(stdout.stdout), maintenance);
  const isolatedModules = JSON.parse(fs.readFileSync(trace, 'utf8'));
  assert.ok(
    isolatedModules.some(file => file.endsWith('/figma-maintenance-assets.cjs'))
  );

  const combinedEntry = path.join(ROOT, 'scripts/build-figma-maintenance.cjs');
  success([], '', combinedEntry, true);
  success(['--check'], '', combinedEntry, true);
  assert.deepEqual(
    JSON.parse(
      fs.readFileSync(
        path.join(temporary, 'combined/0/mangrove-maintenance-tokens.json'),
        'utf8'
      )
    ),
    maintenance
  );
  const runtime = fs.readFileSync(
    path.join(temporary, 'combined/1/main.js'),
    'utf8'
  );
  assert.ok(
    runtime.startsWith(
      `const MG_MAINTENANCE_SOURCE = ${JSON.stringify(maintenance)};\n`
    ),
    'Bundled source must contain the exact maintenance DTO generated alongside it.'
  );
  assert.match(runtime, /Source: importer\.js/);
  assert.ok(!/Source: kit-builder\.js|Source: kit-layout\.js/.test(runtime));
  const combinedModules = JSON.parse(fs.readFileSync(trace, 'utf8'));
  assert.ok(
    combinedModules.some(file =>
      file.endsWith('/build-figma-maintenance-plugin.cjs')
    )
  );
  assert.ok(
    !combinedModules.some(file =>
      /recipes|probe|planned-inventory|kit-guidance|@babel|terser/.test(file)
    )
  );
  assert.ok(
    !isolatedModules.some(file =>
      /recipes|probe|planned-inventory|kit-guidance|@babel|terser/.test(file)
    )
  );

  const changed = JSON.parse(success(['--stdout'], 'tab').stdout);
  const originalTab = maintenance.variables.find(
    variable => variable.id === 'tab.rail-gap'
  );
  const changedTab = changed.variables.find(
    variable => variable.id === originalTab.id
  );
  assert.deepEqual(
    { ...changedTab, values: originalTab.values },
    originalTab,
    'Source mutation retains identity and metadata.'
  );
  for (const mode of maintenance.modes)
    assert.deepEqual(changedTab.values[mode.id], { alias: 'spacing/75' });

  fs.writeFileSync(output, 'stale output\n');
  const stale = run(['--output', output, '--check']);
  assert.equal(stale.status, 1);
  assert.match(stale.stderr, /Stale or missing output/);
  assert.equal(
    fs.readFileSync(output, 'utf8'),
    'stale output\n',
    'Freshness check must not write.'
  );
  for (const args of [['--unknown'], ['--output'], ['--output', '--check']]) {
    const invalid = run(args);
    assert.equal(
      invalid.status,
      1,
      `Invalid arguments must fail: ${args.join(' ')}`
    );
    assert.match(invalid.stderr, /Use --stdout|--output needs a file path/);
  }
  const guardOutput = path.join(temporary, 'guarded/assets.json');
  for (const [mutation, reason] of [
    ['focus', /mg-focus-ring changed/],
    ['image', /Source sample photograph changed/],
  ]) {
    const guarded = run(['--output', guardOutput], mutation);
    assert.equal(guarded.status, 1);
    assert.match(guarded.stderr, reason);
    assert.ok(
      !fs.existsSync(guardOutput),
      'Failed source guard must not create output.'
    );
  }
  const fingerprint = crypto
    .createHash('sha256')
    .update(JSON.stringify(assets))
    .digest('hex');
  console.log(
    `mock-maintenance-export: 520/102/8 assets, five-mode alias closure, isolated generation/check, live source mutation and guard failures passed; assets SHA256 ${fingerprint}`
  );
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
