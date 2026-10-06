'use strict';
const fs = require('fs'),
  path = require('path'),
  assert = require('assert');
const root = path.resolve(__dirname, '../../..');
const { buildCodeBlockRecipes } = require(
  root + '/scripts/figma-code-block-recipes.cjs'
);
const { rangeEnvironment } = require('./mock-rich-text-integration.cjs');
const {
  installNativeTextPropertyDefaultFixture,
} = require('./mock-search-results.cjs');
const { installTextCaseFixture } = require('./mock-text-case.cjs');
const clone = x => JSON.parse(JSON.stringify(x));
const identity = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
const base = () =>
  JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'))
  );
function document() {
  const d = base();
  d.components.families = buildCodeBlockRecipes({ root, ...d });
  return d;
}
function walk(n, p = '') {
  return [[n, p], ...(n.children || []).flatMap(c => walk(c, p + '/' + c.id))];
}
function resolve(d, role, mode) {
  const seen = new Set();
  while (typeof role === 'string') {
    assert(!seen.has(role));
    seen.add(role);
    const v = d.variables.find(v => v.name === role);
    assert(v, role);
    role = v.values[mode];
    if (role?.alias) role = role.alias;
    else break;
  }
  return role;
}
const permanent = env =>
  clone({
    nodes: [...env.state.nodes.values()].map(n => [
      n.id,
      n.characters,
      identity(n),
    ]),
    styles: env.state.styles,
    variables: env.state.variables,
    collections: env.state.collections,
    images: env.state.images,
  });
const geometry = env =>
  [...env.state.nodes.values()]
    .filter(n => identity(n).startsWith('family/code-block'))
    .map(n => [
      n.id,
      n.parent?.id,
      n.type,
      n.x,
      n.y,
      n.width,
      n.height,
      n.opacity,
    ]);
async function main() {
  const d = document(),
    family = d.components.families[0];
  assert.equal(family.variants.length, 16);
  assert(
    d.variables
      .filter(v => v.name.startsWith('component/code-block/'))
      .every(v => JSON.stringify(v.scopes) === JSON.stringify(['ALL_SCOPES']))
  );
  const original = clone({ variables: d.variables, styles: d.styles });
  buildCodeBlockRecipes({ root, ...d });
  assert.deepStrictEqual(
    { variables: d.variables, styles: d.styles },
    original
  );
  for (const mutate of [
    x => {
      x.variables.find(v => v.name === 'spacing/100').values.irp = 11;
    },
    x => {
      x.variables.find(v => v.name.startsWith('component/code-block/')).type =
        'BOOLEAN';
    },
    x => {
      x.styles.text.find(v => v.id.startsWith('component.code-block.')).type =
        'EFFECT';
    },
    x => {
      x.styles.text.find(v =>
        v.id.startsWith('component.code-block.')
      ).values.mcr.fontName = [];
    },
    x => {
      x.styles.effect.push(
        clone(x.styles.text.find(v => v.id.startsWith('component.code-block.')))
      );
    },
    x => {
      const v = x.styles.text.find(v =>
        v.id.startsWith('component.code-block.')
      );
      x.styles.text.push({ ...clone(v), id: 'foreign' });
    },
  ]) {
    const x = clone(d);
    mutate(x);
    const before = clone({ variables: x.variables, styles: x.styles });
    assert.throws(
      () => buildCodeBlockRecipes({ root, ...x }),
      /CodeBlock source changed/
    );
    assert.deepStrictEqual(
      { variables: x.variables, styles: x.styles },
      before
    );
  }

  for (const relative of [
    'stories/Components/CodeBlock/CodeBlock.jsx',
    'stories/Atom/BaseTypography/Code/code.scss',
    'examples/figma-plugin/holistic/assets/code-block/source-footprints.json',
    'examples/figma-plugin/holistic/assets/page-patterns/source-fonts/Roboto-Regular.woff2',
  ]) {
    const raw = fs.readFileSync,
      input = base(),
      before = clone({ variables: input.variables, styles: input.styles });
    fs.readFileSync = function (file, ...args) {
      const result = raw.call(this, file, ...args);
      if (path.resolve(String(file)) !== path.resolve(root, relative))
        return result;
      return typeof result === 'string'
        ? result + 'source drift'
        : Buffer.concat([result, Buffer.from('source drift')]);
    };
    try {
      assert.throws(
        () => buildCodeBlockRecipes({ root, ...input }),
        /CodeBlock source changed/
      );
      assert.deepStrictEqual(
        { variables: input.variables, styles: input.styles },
        before
      );
    } finally {
      fs.readFileSync = raw;
    }
  }
  const source = JSON.parse(
    fs.readFileSync(
      root +
        '/examples/figma-plugin/holistic/assets/code-block/source-footprints.json'
    )
  ).cases;

  {
    const omitted = clone(d),
      role = omitted.variables.find(
        v => v.name.startsWith('component/code-block/') && v.type === 'COLOR'
      );
    assert(role);
    delete role.scopes;
    const env = await rangeEnvironment(omitted);
    const report = await env.call(
      'importVariables',
      omitted,
      ['undrr'],
      false,
      [],
      true
    );
    assert(
      report.errors.some(
        e => e.startsWith(role.name + ':') && e.includes('includes')
      ),
      'Missing native scopes must report import failure'
    );
  }
  for (const mode of d.modes) {
    const env = await rangeEnvironment(d);
    installNativeTextPropertyDefaultFixture(env);
    installTextCaseFixture(env);
    assert.deepStrictEqual(
      clone(
        (await env.call('importVariables', d, [mode.id], false, [], true))
          .errors
      ),
      []
    );
    const build = () =>
      env.call('buildMangroveComponents', d, mode.id, ['code-block']);
    const first = await build();
    assert.deepStrictEqual(clone(first.errors), []);
    const consumers = [],
      richEdits = [];
    function authored() {
      for (const variant of family.variants) {
        const key = 'family/code-block/variant/' + variant.id,
          master = [...env.state.nodes.values()].find(n => identity(n) === key);
        assert(master, key);
        assert.equal(
          master.width,
          resolve(d, variant.tree.layout.width, mode.id)
        );
        assert.equal(
          master.height,
          resolve(d, variant.tree.layout.height, mode.id)
        );
        for (const [spec, p] of walk(variant.tree)) {
          if (!p) continue;
          const node = [...env.state.nodes.values()].find(
            n => identity(n) === key + p
          );
          assert(node, key + p);
          assert.equal(node.opacity, 1);
          assert.equal(node.width, resolve(d, spec.layout.width, mode.id));
          assert.equal(node.height, resolve(d, spec.layout.height, mode.id));
          assert.equal(node.x, resolve(d, spec.absolute.offsetX, mode.id));
          assert.equal(node.y, resolve(d, spec.absolute.offsetY, mode.id));
          if (spec.type === 'TEXT') {
            const sourceEdit = richEdits.find(e => e.node === node);
            assert.equal(
              node.characters,
              sourceEdit ? sourceEdit.value : spec.characters
            );
            if (spec.textProperty) {
              const ref = node.componentPropertyReferences.characters;
              assert(ref);
              assert.equal(
                master.parent.componentPropertyDefinitions[ref].defaultValue,
                spec.characters
              );
            }
            if (spec.textRuns) {
              const runs = node.getStyledTextSegments([
                'textStyleId',
                'fills',
                'fontName',
              ]);
              assert.equal(runs.length, spec.textRuns.length);
              for (let i = 0; i < runs.length; i++) {
                const expected = resolve(d, spec.textRuns[i].fill, mode.id),
                  actual = runs[i].fills[0];
                assert.deepStrictEqual(clone(actual.color), {
                  r: expected.r,
                  g: expected.g,
                  b: expected.b,
                });
                assert.equal(actual.opacity, expected.a);
              }
              assert(
                runs.every(
                  r =>
                    r.fontName.family === 'Menlo' &&
                    r.fontName.style === 'Regular'
                )
              );
            }
          }
        }
        const actual =
          source[mode.id + '-' + variant.id.slice('code-block.'.length)];
        const pre = [...env.state.nodes.values()].find(
          n => identity(n) === key + '/pre-viewport'
        );
        assert.equal(pre.clipsContent, true);
        const code = [...env.state.nodes.values()].find(
          n => identity(n) === key + '/pre-viewport/code-surface/code'
        );
        assert.equal(
          code.characters,
          richEdits.find(e => e.node === code)?.value || actual.characters
        );
        const surface = code.parent;
        assert(surface.effectStyleId);
        const effect = env.state.styles.find(
          s => s.id === surface.effectStyleId
        ).effects[0];
        assert.equal(effect.type, 'INNER_SHADOW');
        assert.equal(effect.spread, 1);
        assert.equal(effect.color.a, 0.2);
        if (actual.lineNumbers.length) {
          const gutter = surface.children.find(n =>
            identity(n).endsWith('/line-numbers')
          );
          assert.equal(
            gutter.characters,
            actual.lineNumbers.map(n => n.text).join('\n')
          );
          assert.equal(gutter.textAlignHorizontal, 'RIGHT');
          assert.equal(gutter.width, 17.5);
        }
        if (actual.badge) {
          const badge = pre.children.find(n =>
            identity(n).endsWith('/language-badge')
          );
          assert.equal(badge.characters, actual.badge.text);
          assert.equal(badge.textCase, 'UPPER');
        }
      }
    }
    authored();
    for (const variant of family.variants) {
      const key = 'family/code-block/variant/' + variant.id,
        master = [...env.state.nodes.values()].find(n => identity(n) === key),
        instance = master.createInstance();
      env.figma.currentPage.appendChild(instance);
      const plain = walk(variant.tree).filter(([t]) => t.textProperty);
      for (const [spec, p] of plain) {
        const main = [...env.state.nodes.values()].find(
            n => identity(n) === key + p
          ),
          ref = main.componentPropertyReferences.characters,
          value = 'Edited ' + spec.id;
        instance.setProperties({ [ref]: value });
        consumers.push({ instance, ref, value, mainId: master.id });
      }
      if (!plain.length) {
        const mainText = master
          .findAll(n => n.type === 'TEXT')
          .find(n => n.characters === variant.sourceCode.characters);
        const text = env.attachRichText(
            instance
              .findAll(n => n.type === 'TEXT')
              .find(n => n.characters === variant.sourceCode.characters),
            mainText
          ),
          old = text.characters;
        await text.loadFontAsync?.();
        const word = old.includes('React') ? 'React' : 'Build',
          at = old.indexOf(word);
        assert(at >= 0);
        text.editRich(at, at + word.length, word.toUpperCase());
        consumers.push({
          instance,
          text,
          value: text.characters,
          runs: clone(
            text.getStyledTextSegments([
              'textStyleId',
              'fills',
              'fontName',
              'hyperlink',
              'textDecoration',
            ])
          ),
          mainId: master.id,
        });
      }
    }
    const richMaster = [...env.state.nodes.values()].find(
      n =>
        n.type === 'TEXT' &&
        identity(n).startsWith('family/code-block') &&
        n.characters.startsWith('#!/bin/bash')
    );
    assert(richMaster);
    const at = richMaster.characters.indexOf('Build');
    assert(at >= 0);
    richMaster.editRich(at, at + 5, 'BUILD');
    richEdits.push({ node: richMaster, value: richMaster.characters });
    const geom = geometry(env);
    assert(geom.length > 16);
    for (let i = 0; i < 2; i++) {
      const again = await build();
      assert.deepStrictEqual(clone(again.errors), []);
      assert.equal(again.createdNodeIds.length, 0);
      assert.deepStrictEqual(geometry(env), geom);
      authored();
      for (const c of consumers) {
        assert.equal((await c.instance.getMainComponentAsync()).id, c.mainId);
        if (c.ref)
          assert.equal(c.instance.componentProperties[c.ref].value, c.value);
        else {
          assert.equal(c.text.characters, c.value);
          assert.deepStrictEqual(
            clone(
              c.text.getStyledTextSegments([
                'textStyleId',
                'fills',
                'fontName',
                'hyperlink',
                'textDecoration',
              ])
            ),
            c.runs
          );
        }
      }
    }
    console.log(
      mode.id +
        ': CodeBlock16 source/default/owning-box/Prism/consumer/two-repeat passed'
    );
  }

  for (const mutate of [
    x => {
      const body = walk(x.components.families[0].variants[0].tree).find(
        ([n]) => n.id === 'code'
      )[0];
      x.variables.find(v => v.name === body.layout.width).values.mcr = {
        alias: body.layout.width,
      };
    },
    x => {
      const rich = walk(
        x.components.families[0].variants.find(
          v => v.properties.Story === 'with-language'
        ).tree
      ).find(([n]) => n.textRuns)[0];
      x.styles.text.find(
        s => s.id === rich.textRuns[0].textStyle
      ).values.mcr.fontName.style = '';
    },
    x => {
      const rich = walk(
        x.components.families[0].variants.find(
          v => v.properties.Story === 'with-language'
        ).tree
      ).find(([n]) => n.textRuns)[0];
      rich.textRuns[0].end++;
    },
  ]) {
    const broken = clone(d);
    mutate(broken);
    const env = await rangeEnvironment(broken);
    installTextCaseFixture(env);
    assert.deepStrictEqual(
      clone(
        (await env.call('importVariables', d, ['undrr'], false, [], true))
          .errors
      ),
      []
    );
    const before = permanent(env);
    const report = await env.call('buildMangroveComponents', broken, 'undrr', [
      'code-block',
    ]);
    assert(report.errors.length);
    assert.equal(report.createdNodeIds.length, 0);
    assert.deepStrictEqual(permanent(env), before);
  }
  const absent = await rangeEnvironment(d);
  const inventory = absent.figma.listAvailableFontsAsync;
  absent.figma.listAvailableFontsAsync = async () =>
    (await inventory()).filter(f => f.fontName.family !== 'Menlo');
  assert.deepStrictEqual(
    clone(
      (await absent.call('importVariables', d, ['undrr'], false, [], true))
        .errors
    ),
    []
  );
  const before = permanent(absent),
    refused = await absent.call('buildMangroveComponents', d, 'undrr', [
      'code-block',
    ]);
  assert(refused.errors.length);
  assert.deepStrictEqual(permanent(absent), before);
  console.log(
    'CodeBlock bounded source checks passed; no native font/raster/scroll/retokenization acceptance.'
  );
}
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { document };
