#!/usr/bin/env node
/** Actual rich builder and independent ownership/alpha guards, no native raster claim. */
'use strict';
const fs = require('fs'),
  path = require('path'),
  vm = require('vm'),
  assert = require('assert');
const {
  document: baseDocument,
  rangeEnvironment,
} = require('./mock-rich-text-integration.cjs');
const copy = x => JSON.parse(JSON.stringify(x));
const source = fs.readFileSync(
  path.join(__dirname, '../kit-rich-text.js'),
  'utf8'
);
function capability(enabled) {
  const c = {
    module: { exports: {} },
    ...(enabled === undefined ? {} : { MG_CONNECTOR_RICH_ALPHA: enabled }),
  };
  vm.runInNewContext(source, c);
  return c.module.exports;
}
function pure() {
  const original = fs.readFileSync(
    path.join(__dirname, 'mock-rich-text.cjs'),
    'utf8'
  );
  const begin = original.indexOf('function environment() {'),
    end = original.indexOf('async function rebuild(');
  assert(begin >= 0 && end > begin);
  const c = {
    assert,
    clone: copy,
    font: style => ({ family: 'Roboto', style }),
  };
  vm.runInNewContext(
    original.slice(begin, end) + '\nglobalThis.fixture={environment,spec};',
    c
  );
  return c.fixture;
}
const ledger = n => JSON.parse(n.ledger);
async function pureChecks() {
  const f = pure(),
    rich = capability(),
    opaque = capability(false);
  const recipe = f.spec([
    { text: 'Body ' },
    { text: 'Link', link: 'https://example.com/source' },
    { text: ' suffix' },
  ]);
  const build = async (api, env, existing) => {
    const handle = await api.prepare(recipe, env.ctx, existing),
      n = existing || env.node();
    await api.apply(handle, n);
    return n;
  };
  const a = f.environment(),
    b = f.environment(),
    aNode = await build(rich, a),
    bNode = await build(opaque, b);
  assert.deepStrictEqual(copy(aNode.cells), copy(bNode.cells));
  assert.equal(
    aNode.ledger,
    bNode.ledger,
    'Opaque prior7-field ownership ledger remains byte-identical'
  );
  assert(ledger(aNode).runs.every(r => JSON.parse(r.signature).length === 7));
  for (const alpha of [0, Number.MIN_VALUE, 0.2, 0.8, 0.99999999, 1]) {
    const env = f.environment();
    for (const value of Object.values(env.colors.get('text').values))
      value.a = alpha;
    const node = await build(rich, env);
    assert.equal(node.cells[0].fills[0].opacity, alpha);
    assert.equal(node.cells[5].fills[0].opacity, 1);
    assert.equal(
      JSON.parse(ledger(node).runs[0].signature).length,
      Math.fround(alpha) === 1 ? 7 : 8
    );
    if (Math.fround(alpha) !== 1)
      assert.equal(
        JSON.parse(ledger(node).runs[0].signature)[7],
        Math.fround(alpha)
      );
    // Simulate the exact native Float32 readback without changing emitted source paint values.
    for (const cell of node.cells)
      cell.fills[0].opacity = Math.fround(cell.fills[0].opacity);
    for (let i = 0; i < 2; i++) {
      const count = env.state.created;
      await build(rich, env, node);
      assert.equal(env.state.created, count);
    }
  }
  const edited = f.environment();
  for (const value of Object.values(edited.colors.get('text').values))
    value.a = 0.8;
  const node = await build(rich, edited);
  const old = node.characters;
  node.value = old.replace('suffix', 'edited suffix');
  node.cells.splice(
    node.cells.length - 6,
    0,
    ...Array.from({ length: 7 }, () => copy(node.cells.at(-1)))
  );
  const snapshot = edited.snapshot();
  const result = await rich.prepare(recipe, edited.ctx, node);
  await rich.apply(result, node);
  assert.equal(node.characters, 'Body Link edited suffix');
  assert.equal(node.cells[0].fills[0].opacity, 0.8);
  assert(
    snapshot !== edited.snapshot(),
    'Apply refreshes fields/ledger but preserves edited characters'
  );
  for (const value of [null, NaN, Infinity, -0.01, 1.01, '0.8', {}]) {
    const env = f.environment();
    env.colors.get('text').values.PW.a = value;
    const before = env.snapshot();
    await assert.rejects(() => rich.prepare(recipe, env.ctx), /invalid COLOR/);
    assert.equal(
      env.snapshot(),
      before,
      'Unused mode alpha refusal before scene writes'
    );
  }
  const disabled = f.environment();
  disabled.colors.get('text').values.UNDRR.a = 0.8;
  await assert.rejects(
    () => opaque.prepare(recipe, disabled.ctx),
    /invalid COLOR/
  );
  const changed = f.environment();
  for (const v of Object.values(changed.colors.get('text').values)) v.a = 0.8;
  const target = await build(rich, changed);
  target.cells[0].fills[0].opacity = 0.7;
  const before = changed.snapshot();
  await assert.rejects(
    () => rich.prepare(recipe, changed.ctx, target),
    /ownership/
  );
  assert.equal(
    changed.snapshot(),
    before,
    'Manual alpha ownership drift refuses'
  );
  const race = f.environment();
  for (const v of Object.values(race.colors.get('text').values)) v.a = 0.8;
  const load = race.ctx.figma.loadFontAsync;
  race.ctx.figma.loadFontAsync = async font => {
    await load(font);
    race.colors.get('text').values.PW.a = 0.7;
  };
  await assert.rejects(
    () => rich.prepare(recipe, race.ctx),
    /dependencies changed/
  );
  const after = f.environment();
  for (const v of Object.values(after.colors.get('text').values)) v.a = 0.8;
  const plan = await rich.prepare(recipe, after.ctx);
  after.colors.get('text').values.PW.a = 0.7;
  const fresh = after.node();
  await assert.rejects(() => rich.apply(plan, fresh), /dependencies changed/);
  for (const bad of [NaN, 0.5]) {
    const corrupt = f.environment();
    for (const value of Object.values(corrupt.colors.get('text').values))
      value.a = 0.8;
    const binding = corrupt.ctx.figma.variables.setBoundVariableForPaint;
    corrupt.ctx.figma.variables.setBoundVariableForPaint = (...args) => ({
      ...binding(...args),
      opacity: bad,
    });
    const before = corrupt.snapshot();
    await assert.rejects(
      () => rich.prepare(recipe, corrupt.ctx),
      /bound alpha paint/
    );
    assert.equal(corrupt.snapshot(), before);
  }
  console.log(
    'Rich alpha pure: opaque ledger parity, alpha0..1, edits/repeats and source/native ownership/dependency refusals pass'
  );
}
function document() {
  const d = baseDocument();
  const roles = [
    ['body', 0.8],
    ['transparent', 0],
    ['opaque', 1],
  ].map(([label, alpha]) => ({
    id: 'component.rich-alpha.' + label,
    name: 'component/rich-alpha/' + label,
    type: 'COLOR',
    values: Object.fromEntries(
      d.modes.map((m, i) => [
        m.id,
        { r: 0.1 + i * 0.1, g: 0.2, b: 0.3, a: alpha },
      ])
    ),
    scopes: ['TEXT_FILL'],
  }));
  d.variables.push(...roles);
  const family = d.components.families[0];
  family.id = 'rich-alpha';
  family.name = 'Mangrove/Rich alpha probe';
  for (const variant of family.variants) {
    variant.id = 'rich-alpha.default';
    const text = variant.tree.children[0];
    for (const [index, run] of text.textRuns.entries())
      run.fill =
        'component/rich-alpha/' +
        (index === 1 ? 'opaque' : index === 3 ? 'transparent' : 'body');
  }
  return d;
}
async function actualChecks() {
  const d = document();
  for (const mode of d.modes) {
    const env = await rangeEnvironment(d);
    await env.call('importVariables', d, [mode.id], false, [], true);
    const run = () =>
      env.call('buildMangroveComponents', d, mode.id, ['rich-alpha']);
    assert.deepStrictEqual(copy((await run()).errors), []);
    const identity = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId'),
      main = [...env.state.nodes.values()].find(
        n => identity(n) === 'family/rich-alpha/variant/rich-alpha.default'
      ),
      target = main.findAll(n => n.type === 'TEXT')[0];
    const runs = target.getStyledTextSegments(['fills']);
    assert(runs.some(r => r.fills[0].opacity === 0.8));
    assert(runs.some(r => r.fills[0].opacity === 0));
    assert(runs.some(r => r.fills[0].opacity === 1));
    for (const r of runs) assert(r.fills[0].boundVariables.color.id);
    const consumer = main.createInstance();
    env.figma.currentPage.appendChild(consumer);
    const clone = consumer.findAll(n => n.type === 'TEXT')[0],
      rich = env.attachRichText(clone, target);
    const editStart = clone.characters.indexOf('examples');
    rich.editRich(editStart, editStart + 'examples'.length, 'edited examples');
    const edited = copy(
      rich.getStyledTextSegments([
        'fills',
        'textStyleId',
        'fontName',
        'hyperlink',
        'textDecoration',
      ])
    );
    const snapshot = () =>
      copy(
        [...env.state.nodes.values()]
          .filter(n => identity(n).startsWith('family/rich-alpha'))
          .map(n => ({
            id: n.id,
            key: identity(n),
            parent: n.parent?.id,
            x: n.x,
            y: n.y,
            width: n.width,
            height: n.height,
            type: n.type,
            text: n.type === 'TEXT' ? n.characters : null,
            segments:
              n.type === 'TEXT'
                ? n.getStyledTextSegments([
                    'fills',
                    'fontName',
                    'hyperlink',
                    'textStyleId',
                    'textDecoration',
                  ])
                : null,
            ledger: n.getSharedPluginData(
              'orgundrrmangrove',
              'mgRichTextRunsV1'
            ),
          }))
      );
    const before = snapshot(),
      count = env.state.nodes.size;
    assert(before.length > 5);
    for (let i = 0; i < 2; i++) {
      const result = await run();
      assert.deepStrictEqual(copy(result.errors), []);
      assert.equal(result.createdNodeIds.length, 0);
      assert.equal(env.state.nodes.size, count);
      assert.deepStrictEqual(snapshot(), before);
      assert(clone.characters.includes('edited examples'));
      assert.deepStrictEqual(
        copy(
          rich.getStyledTextSegments([
            'fills',
            'textStyleId',
            'fontName',
            'hyperlink',
            'textDecoration',
          ])
        ),
        edited
      );
    }
    const variable = [...env.state.variables.values()].find(
      v => v.name === 'component/rich-alpha/body'
    );
    const modeId = Object.keys(variable.valuesByMode)[0];
    variable.valuesByMode[modeId] = { r: 0.1, g: 0.2, b: 0.3, a: 2 };
    const invalidSnapshot = {
      nodes: snapshot(),
      styles: copy(env.state.styles),
      images: [...env.state.images],
    };
    const result = await run();
    assert(result.errors.length);
    assert.equal(result.createdNodeIds.length, 0);
    assert.deepStrictEqual(
      {
        nodes: snapshot(),
        styles: copy(env.state.styles),
        images: [...env.state.images],
      },
      invalidSnapshot,
      'Native alpha refusal before scene/style/image writes'
    );
    console.log(
      mode.id +
        ' actual rich alpha mixed paints, consumer edits, two zero-create repeats and native invalid-alpha refusal pass'
    );
  }
}
async function main() {
  await pureChecks();
  await actualChecks();
}
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { document };
