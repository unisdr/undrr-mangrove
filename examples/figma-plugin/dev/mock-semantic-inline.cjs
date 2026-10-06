'use strict';
const fs = require('fs'),
  path = require('path'),
  assert = require('assert');
const root = path.resolve(__dirname, '../../..');
const { buildSemanticInlineSourceContracts: build } = require(
  root + '/scripts/figma-semantic-inline-recipes.cjs'
);
async function main() {
  const modes = require('../mangrove-variables.json').modes;
  const a = build({ root, modes }),
    b = build({ root, modes });
  assert.deepStrictEqual(a, b);
  assert.equal(a.contracts.length, 36);
  assert.equal(a.sourceCases, 180);
  assert.deepStrictEqual(a.families, []);
  assert.equal(a.sourceRecipeReady, false);
  for (const contract of a.contracts) {
    assert.equal(Object.keys(contract.byMode).length, 5);
    assert.equal(contract.buildable, false);
    for (const c of Object.values(contract.byMode))
      for (const p of c.paragraphs) {
        assert(p.characters);
        for (const span of p.spans) {
          if (span.emptySourceBox) {
            assert.equal(contract.treatment, 'code');
            assert.equal(contract.locale, 'arabic');
            assert.equal(span.start, 21);
            assert.equal(span.end, 21);
            assert.equal(span.rect.width, 10);
          } else
            assert.equal(
              p.characters.slice(span.start, span.end),
              span.characters
            );
        }
      }
  }
  assert.equal(
    a.contracts.filter(x => x.treatment === 'code' && x.locale === 'arabic')
      .length,
    2
  );
  for (const mutate of [
    x => x.pop(),
    x => x.push(x[0]),
    x => (x[0].id = 'foreign'),
  ]) {
    const bad = structuredClone(modes);
    mutate(bad);
    const before = structuredClone(bad);
    assert.throws(() => build({ root, modes: bad }), /five modes/);
    assert.deepStrictEqual(bad, before);
  }
  const read = fs.readFileSync;
  for (const suffix of [
    'source-footprints.json.gz',
    'capture.js',
    'Roboto-Italic.woff2',
    'normalize.scss',
  ]) {
    try {
      fs.readFileSync = function (file, ...args) {
        const value = read.call(this, file, ...args);
        return String(file).endsWith(suffix)
          ? Buffer.concat([Buffer.from(value), Buffer.from('drift')])
          : value;
      };
      assert.throws(() => build({ root, modes }), /source changed/);
    } finally {
      fs.readFileSync = read;
    }
  }
  const scope = { module: { exports: {} } };
  require('vm').runInNewContext(
    fs.readFileSync(path.join(__dirname, '../kit-rich-text.js'), 'utf8'),
    scope
  );
  const rich = scope.module.exports;
  let dependencyReads = 0;
  const touch = () => {
    dependencyReads++;
    throw Error('unsupported profile reached dependencies');
  };
  const ctx = {
    figma: {
      loadFontAsync: touch,
      variables: { setBoundVariableForPaint: touch },
    },
    resolveStyle: touch,
    resolveColor: touch,
    readState: touch,
    writeState: touch,
    modeIds: ['undrr'],
  };
  const base = {
    id: 'logical',
    type: 'TEXT',
    characters: 'Actual code',
    textRuns: [
      { id: 'body', start: 0, end: 11, textStyle: 'body', fill: 'text' },
    ],
  };
  for (const unsupported of [
    { background: 'source-color' },
    { paddingLeft: 5 },
    { borderBottom: { width: 2, style: 'DASHED' } },
    { generatedContent: 'open-quote' },
    { listMarker: { kind: 'DECIMAL' } },
  ]) {
    const dto = structuredClone(base);
    Object.assign(dto.textRuns[0], unsupported);
    await assert.rejects(
      () => rich.prepare(dto, ctx),
      /unique ids, complete non-overlapping/
    );
  }
  const empty = structuredClone(base);
  empty.textRuns[0].end = 0;
  await assert.rejects(
    () => rich.prepare(empty, ctx),
    /unique ids, complete non-overlapping/
  );
  assert.equal(dependencyReads, 0);
  console.log(
    'SemanticInline36 exact180 source contracts and unsupported-profile predependency refusals pass. No component build, native or zero-create acceptance.'
  );
}
if (require.main === module)
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
module.exports = { main };
