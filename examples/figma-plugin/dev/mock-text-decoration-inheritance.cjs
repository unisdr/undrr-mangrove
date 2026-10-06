#!/usr/bin/env node
/** Actual source Book titles prove style decoration inheritance without changing explicit overrides. */
'use strict';
const fs = require('fs'),
  assert = require('assert');
const ROOT = require('path').resolve(__dirname, '../../..');
const {
  installNativeTextPropertyDefaultFixture,
} = require('./mock-search-results.cjs');
const { environment } = require(
  ROOT + '/examples/figma-plugin/dev/mock-kit.cjs'
);
const { installCardContentSvgFixture } = require(
  ROOT + '/examples/figma-plugin/dev/mock-card-content.cjs'
);
const candidate = fs.readFileSync(
  ROOT + '/examples/figma-plugin/kit-builder.js',
  'utf8'
);
const inherited =
  "      node.textDecoration =\n        spec.textDecoration !== undefined\n          ? spec.textDecoration\n          : localText.get(spec.textStyle)?.textDecoration || 'NONE';";
assert(candidate.includes(inherited));
const original = candidate.replace(
  inherited,
  "      node.textDecoration = spec.textDecoration || 'NONE';"
);
const source = require('./mock-card-content.cjs').document();
source.components.families = source.components.families.filter(
  f => f.id === 'book-card'
);
const copy = x => JSON.parse(JSON.stringify(x)),
  id = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
function underInstance(n) {
  for (let p = n.parent; p; p = p.parent)
    if (p.type === 'INSTANCE') return true;
  return false;
}
function titles(env) {
  return [...env.state.nodes.values()]
    .filter(
      n =>
        n.type === 'TEXT' &&
        !underInstance(n) &&
        id(n).startsWith('family/book-card/') &&
        n.characters === 'Title in large size'
    )
    .map(n => ({
      key: id(n),
      decoration: n.textDecoration,
      styleId: n.textStyleId,
      fontName: n.fontName,
      fontSize: n.fontSize,
      lineHeight: n.lineHeight,
      letterSpacing: n.letterSpacing,
      wrap: n.textWrapStyle,
      fill: n.fills,
      bindings: n.boundVariables,
      characters: n.characters,
      properties: n.componentPropertyReferences,
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
}
async function run(code, doc, brand) {
  const env = environment(doc, { sharedOnly: true });
  env.state.modeLimit = 5;
  installNativeTextPropertyDefaultFixture(env);
  for (const family of ['Roboto', 'Roboto Condensed', 'Inter'])
    for (const style of ['Regular', 'Bold'])
      if (
        !env.state.fonts.some(
          x => x.fontName.family === family && x.fontName.style === style
        )
      )
        env.state.fonts.push({ fontName: { family, style } });
  installCardContentSvgFixture(env, doc.components.families);
  const imported = await env.call(
    'importVariables',
    doc,
    doc.modes.map(m => m.id),
    []
  );
  assert.deepStrictEqual(copy(imported.errors), []);
  const payload =
    code +
    '\nreturn await buildMangroveComponents(' +
    JSON.stringify(doc) +
    ',' +
    JSON.stringify(brand) +
    ',["book-card"]);';
  const first = await env.runCode(payload);
  assert.deepStrictEqual(copy(first.errors), []);
  return { env, payload, first };
}
(async () => {
  const reports = [];
  for (const mode of source.modes) {
    const a = await run(original, source, mode.id),
      b = await run(candidate, source, mode.id),
      old = titles(a.env),
      next = titles(b.env);
    assert.equal(old.length, 2);
    assert.equal(next.length, 2);
    for (let i = 0; i < 2; i++) {
      const actualStyle = b.env.state.styles.find(
        s => s.id === next[i].styleId
      );
      assert(actualStyle);
      assert.equal(next[i].decoration, actualStyle.textDecoration || 'NONE');
      assert.equal(old[i].decoration, 'NONE');
      const x = copy(old[i]),
        y = copy(next[i]);
      delete x.decoration;
      delete y.decoration;
      assert.deepStrictEqual(x, y);
    }
    assert(next.some(x => x.decoration === 'UNDERLINE'));
    assert(next.some(x => x.decoration === 'NONE'));
    const linkedMain = [...b.env.state.nodes.values()].find(
      n =>
        n.type === 'COMPONENT' &&
        id(n) === 'family/book-card/variant/book-card.primary.linked.200'
    );
    assert(linkedMain);
    let consumer = null;
    for (const n of b.env.state.nodes.values()) {
      if (
        n.type === 'INSTANCE' &&
        (await n.getMainComponentAsync())?.id === linkedMain.id
      ) {
        consumer = n;
        break;
      }
    }
    assert(consumer);
    const consumerText = consumer
      .findAllWithCriteria({ types: ['TEXT'] })
      .find(n => n.characters === 'Title in large size');
    assert(consumerText);
    await b.env.figma.loadFontAsync(consumerText.fontName);
    const reference = consumerText.componentPropertyReferences.characters;
    assert(reference);
    // Model displayed instance copy through its own actual property reference.
    const descriptor = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(consumerText),
      'characters'
    );
    Object.defineProperty(consumerText, 'characters', {
      configurable: true,
      get() {
        return consumer.componentProperties[reference].value;
      },
      set(value) {
        descriptor.set.call(this, value);
      },
    });
    consumer.setProperties({ [reference]: 'Book title edited' });
    assert.equal(consumerText.characters, 'Book title edited');
    assert.equal(consumerText.textDecoration, 'UNDERLINE');
    const before = copy(next);
    for (let i = 0; i < 2; i++) {
      const r = await b.env.runCode(b.payload);
      assert.deepStrictEqual(copy(r.errors), []);
      assert.equal(r.createdNodeIds.length, 0);
      assert.deepStrictEqual(copy(titles(b.env)), before);
      assert.equal(consumerText.characters, 'Book title edited');
      assert.equal(consumerText.textDecoration, 'UNDERLINE');
    }
    const explicit = copy(source);
    function walk(n) {
      if (
        n.type === 'TEXT' &&
        n.textStyle === 'component.card-content.book-title-link'
      )
        n.textDecoration = 'NONE';
      for (const c of n.children || []) walk(c);
    }
    for (const family of explicit.components.families)
      for (const v of family.variants) walk(v.tree);
    const c = await run(candidate, explicit, mode.id);
    assert(titles(c.env).every(x => x.decoration === 'NONE'));
    reports.push({
      brand: mode.id,
      originalAbsentDecorationDefectReproduced: true,
      styleDerivedDecoration: true,
      explicitNONEOverride: true,
      plainNONE: true,
      otherTitleFieldsExact: true,
      twoZeroCreateRepeats: true,
    });
  }
  assert.equal(reports.length, 5);
  console.log('all five decoration regressions pass');
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
