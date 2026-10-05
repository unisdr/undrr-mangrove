#!/usr/bin/env node
/** Plain-only indentation profile; range formatting migration remains closed. */
'use strict';
const assert = require('assert');
const {
  document,
  rangeEnvironment,
} = require('./mock-rich-text-integration.cjs');
const copy = x => JSON.parse(JSON.stringify(x));
const snapshot = e =>
  JSON.stringify({
    nodes: [...e.state.nodes.values()].map(n => [
      n.id,
      n.characters,
      n.paragraphIndent,
    ]),
    styles: e.state.styles.map(s => [s.id, s.fontName, s.paragraphIndent]),
  });
async function env() {
  const doc = document(),
    e = await rangeEnvironment(doc);
  const r = await e.call('importVariables', doc, ['undrr'], false, [], false);
  assert.deepStrictEqual(copy(r.errors), []);
  return { doc, e };
}
const build = ({ doc, e }) =>
  e.call('buildMangroveComponents', doc, 'undrr', ['rich-test']);
(async () => {
  for (const issue of ['source', 'style', 'node', 'mixed']) {
    const f = await env();
    if (issue === 'source')
      f.doc.styles.text.find(
        s => s.id === 'component.rich-test.body'
      ).values.delta.paragraphIndent = 28;
    else {
      assert.deepStrictEqual(copy((await build(f)).errors), []);
      const target = [...f.e.state.nodes.values()].find(
        n =>
          n.getSharedPluginData('orgundrrmangrove', 'mgKitId') ===
          'family/rich-test/variant/rich-test.default/body'
      );
      if (issue === 'style')
        f.e.state.styles.find(
          s => s.name === 'Mangrove/rich-test/body'
        ).paragraphIndent = 7;
      else target.paragraphIndent = issue === 'mixed' ? f.e.figma.mixed : 9;
    }
    const before = snapshot(f.e),
      r = await build(f);
    assert(r.errors.some(e => /paragraph/i.test(e)));
    assert.strictEqual(r.createdNodeIds.length, 0);
    assert.strictEqual(snapshot(f.e), before);
  }
  const f = await env(),
    base = f.doc.styles.text.find(s => s.id === 'component.rich-test.body'),
    plain = copy(base);
  plain.id = 'component.rich-test.plain-indent';
  plain.name = 'Mangrove/rich-test/Plain indent';
  for (const value of Object.values(plain.values)) value.paragraphIndent = 28;
  f.doc.styles.text.push(plain);
  f.doc.components.families[0].variants[0].tree.children.unshift({
    id: 'plain-indent',
    type: 'TEXT',
    characters: 'First line and continuation.',
    textStyle: plain.id,
    fill: 'color/text',
    layout: { width: 'FILL', height: 'HUG' },
  });
  for (let i = 0; i < 3; i++) {
    const r = await build(f);
    assert.deepStrictEqual(copy(r.errors), []);
    if (i) assert.strictEqual(r.createdNodeIds.length, 0);
  }
  assert.strictEqual(
    f.e.state.styles.find(s => s.name === plain.name).paragraphIndent,
    28
  );
  const late = await env(),
    create = late.e.figma.createTextStyle;
  late.e.figma.createTextStyle = () => {
    const style = create();
    Object.defineProperty(style, 'paragraphIndent', {
      get: () => 4,
      set: () => {},
      configurable: true,
    });
    return style;
  };
  const beforeNodes = [...late.e.state.nodes.keys()],
    lateResult = await build(late);
  assert(
    lateResult.errors.some(e =>
      e.includes('Imported rich style paragraph indent must remain zero')
    )
  );
  assert(
    lateResult.audit.some(a => a.status === 'blocked-rich-text-finalization')
  );
  assert.strictEqual(lateResult.createdNodeIds.length, 0);
  assert.deepStrictEqual([...late.e.state.nodes.keys()], beforeNodes);
  assert(
    late.e.state.styles.length,
    'failed finalization can retain imported assets, not a rollback claim'
  );
  console.log(
    'Rich paragraph boundary negatives/source/allmode/native/style/mixed preservation, finalization refusal and plain28+rich0 closure repeats passed.'
  );
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
