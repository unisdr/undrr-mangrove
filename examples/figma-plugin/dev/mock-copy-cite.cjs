#!/usr/bin/env node
/** Source-only actual builder lifecycle. SVG API fixture does not prove native raster. */
'use strict';
const assert = require('assert'),
  fs = require('fs'),
  path = require('path');
const { rangeEnvironment } = require('./mock-rich-text-integration.cjs');
const {
  installNativeTextPropertyDefaultFixture,
} = require('./mock-search-results.cjs');
const {
  buildCopyCiteRecipes,
} = require('../../../scripts/figma-copy-cite-recipes.cjs');
const root = path.resolve(__dirname, '../../..'),
  clone = x => JSON.parse(JSON.stringify(x)),
  identity = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId'),
  walk = n => [n, ...(n.children || []).flatMap(walk)];
function document() {
  const d = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'))
  );
  d.components.families = buildCopyCiteRecipes({ root, ...d });
  return d;
}
function installCopyCiteSvgFixture(env, families) {
  const specs = families.flatMap(f =>
      f.variants.flatMap(v => walk(v.tree).filter(n => n.type === 'SVG'))
    ),
    prior = env.figma.createNodeFromSvg;
  env.state.copyCiteSvgCalls = [];
  env.figma.createNodeFromSvg = markup => {
    const normalized = markup.replace(/ width="[\d.]+" height="[\d.]+"/, ''),
      spec = specs.find(s => s.svg.markup === normalized);
    if (!spec) return prior(markup);
    env.state.copyCiteSvgCalls.push(spec.svg.assetId);
    const view = /viewBox=['"]0 0 ([\d.]+) ([\d.]+)['"]/.exec(normalized);
    assert(view);
    const frame = env.figma.createFrame();
    frame.resize(+view[1], +view[2]);
    Object.getPrototypeOf(frame).rescale = function (k) {
      this.resizeWithoutConstraints(this.width * k, this.height * k);
      for (const c of this.children || [])
        c.resizeWithoutConstraints(c.width * k, c.height * k);
    };
    const v = new frame.constructor('VECTOR');
    v.resize(+view[1], +view[2]);
    v.vectorPaths = [{ windingRule: 'NONZERO', data: 'M0 0' }];
    for (const kind of ['fills', 'strokes'])
      v[kind] = spec.svg.monochrome[kind]
        ? [
            {
              type: 'SOLID',
              color: { r: 0, g: 0, b: 0 },
              opacity: 1,
              visible: true,
            },
          ]
        : [];
    v.strokeWeight = 2;
    frame.appendChild(v);
    return frame;
  };
}
function sourceDefaults(env, d) {
  for (const f of d.components.families)
    for (const v of f.variants)
      for (const spec of walk(v.tree).filter(n => n.textProperty)) {
        const nodes = [...env.state.nodes.values()].filter(n => {
          if (
            n.type !== 'TEXT' ||
            !identity(n).includes('/variant/' + v.id + '/') ||
            !identity(n).endsWith('/' + spec.id)
          )
            return false;
          for (let p = n.parent; p; p = p.parent)
            if (p.type === 'INSTANCE') return false;
          return true;
        });
        assert.strictEqual(nodes.length, 1, v.id + '/' + spec.id);
        const n = nodes[0];
        assert.strictEqual(n.characters, spec.characters);
        let owner = n.parent;
        while (owner && owner.type !== 'COMPONENT_SET') owner = owner.parent;
        assert.strictEqual(
          owner.componentPropertyDefinitions[
            n.componentPropertyReferences.characters
          ].defaultValue,
          spec.characters
        );
      }
}
async function main() {
  const d = document(),
    ids = d.components.families.map(f => f.id);
  assert.deepStrictEqual(
    d.components.families.map(f => f.variants.length),
    [36, 2, 18, 4]
  );
  assert.deepStrictEqual(
    buildCopyCiteRecipes({ root, ...d }),
    d.components.families
  );
  for (const mode of d.modes) {
    const env = await rangeEnvironment(d);
    installNativeTextPropertyDefaultFixture(env);
    installCopyCiteSvgFixture(env, d.components.families);
    assert.deepStrictEqual(
      clone(
        (await env.call('importVariables', d, [mode.id], false, [], true))
          .errors
      ),
      []
    );
    const first = await env.call('buildMangroveComponents', d, mode.id, ids);
    assert.deepStrictEqual(clone(first.errors), []);
    sourceDefaults(env, d);
    const consumers = [];
    for (const f of first.families)
      for (const v of f.variantIds) {
        const main = env.state.nodes.get(v.nodeId),
          variant = d.components.families
            .find(family => family.id === f.id)
            .variants.find(variant => variant.id === v.id),
          instance = main.createInstance();
        const resolve = name => {
          const value = d.variables.find(v => v.name === name).values[mode.id];
          return value?.alias ? resolve(value.alias) : value;
        };
        for (const spec of walk(variant.tree).filter(n => n.type === 'FRAME')) {
          const actual =
            spec === variant.tree
              ? main
              : walk(main).find(n => identity(n).endsWith('/' + spec.id));
          assert(actual, variant.id + '/' + spec.id);
          for (const field of ['width', 'height'])
            assert.strictEqual(
              actual[field],
              typeof spec.layout[field] === 'string'
                ? resolve(spec.layout[field])
                : spec.layout[field]
            );
          if (spec.absolute) {
            assert.strictEqual(actual.x, resolve(spec.absolute.offsetX));
            assert.strictEqual(actual.y, resolve(spec.absolute.offsetY));
          }
          if (spec.effectStyle) assert(actual.effectStyleId);
          assert.strictEqual(actual.opacity, 1);
        }
        instance.x = 143;
        instance.y = 277;
        const text = walk(instance).find(
          n =>
            n.type === 'TEXT' &&
            n.componentPropertyReferences?.characters &&
            Object.hasOwn(
              instance.componentProperties,
              n.componentPropertyReferences.characters
            )
        );
        if (text) {
          const key = text.componentPropertyReferences.characters;
          const original = Object.getOwnPropertyDescriptor(text, 'characters');
          Object.defineProperty(text, 'characters', {
            configurable: true,
            get() {
              return (
                instance.componentProperties[key]?.value ??
                original.get.call(this)
              );
            },
            set(value) {
              original.set.call(this, value);
            },
          });
          instance.setProperties({ [key]: 'Edited source text' });
          consumers.push({ instance, key, text });
        } else consumers.push({ instance });
      }
    const snapshot = () =>
        JSON.stringify(
          [...env.state.nodes.values()]
            .filter(n => identity(n))
            .map(n => [
              n.id,
              identity(n),
              n.parent?.id,
              n.x,
              n.y,
              n.width,
              n.height,
              n.opacity,
              n.effectStyleId,
              n.type === 'COMPONENT_SET'
                ? n.componentPropertyDefinitions
                : null,
              n.type === 'TEXT'
                ? [n.characters, n.componentPropertyReferences]
                : null,
            ])
        ),
      before = snapshot(),
      svg = env.state.copyCiteSvgCalls.length;
    assert([...env.state.nodes.values()].filter(n => identity(n)).length > 200);
    for (let i = 0; i < 2; i++) {
      const repeat = await env.call('buildMangroveComponents', d, mode.id, ids);
      assert.deepStrictEqual(clone(repeat.errors), []);
      assert.strictEqual(repeat.createdNodeIds.length, 0);
      sourceDefaults(env, d);
      assert.strictEqual(snapshot(), before);
      assert.strictEqual(env.state.copyCiteSvgCalls.length, svg);
      for (const { instance, key, text } of consumers) {
        assert(!instance.removed);
        assert.strictEqual(instance.x, 143);
        assert.strictEqual(instance.y, 277);
        if (text) assert.strictEqual(text.characters, 'Edited source text');
        if (key)
          assert.strictEqual(
            instance.componentProperties[key].value,
            'Edited source text'
          );
      }
    }
    console.log(
      mode.id +
        ' Copy/Cite60 source builder/default/geometry repeats and edited instances passed'
    );
  }
  for (const mutation of [
    d => {
      const style = d.styles.text.find(s =>
        s.id.startsWith('component.copy-cite.')
      );
      d.styles.text.splice(d.styles.text.indexOf(style), 1);
      d.styles.effect.push(style);
    },
    d => {
      d.variables.find(v => v.name === 'component/copy-cite/code-font').type =
        'FLOAT';
    },
    d => {
      d.variables.find(v => v.name === 'font-family/ui').values.preventionweb =
        'Foreign family';
    },
    d => {
      d.variables.find(
        v => v.name === 'color/interactive'
      ).values.preventionweb = { r: 1, g: 0, b: 0, a: 1 };
    },
  ]) {
    const bad = document();
    mutation(bad);
    const before = clone({ variables: bad.variables, styles: bad.styles });
    assert.throws(
      () => buildCopyCiteRecipes({ root, ...bad }),
      /Foreign style kind|Foreign identity type|Source font family|Source interactive paint|No exact source RGB alias/
    );
    assert.deepStrictEqual(
      clone({ variables: bad.variables, styles: bad.styles }),
      before
    );
  }
  for (const family of d.components.families)
    for (const variant of family.variants)
      for (const node of walk(variant.tree).filter(
        n => n.name === 'mg-cite-this__text mg-code'
      ))
        for (const text of walk(node).filter(n => n.type === 'TEXT'))
          assert.strictEqual(text.textWrap, 'PRETTY');
  for (const family of d.components.families)
    for (const variant of family.variants)
      for (const node of walk(variant.tree).filter(
        n => n.name === 'mg-cite-this__title'
      ))
        for (const text of walk(node).filter(n => n.type === 'TEXT'))
          assert.strictEqual(text.textWrap, 'BALANCE');
  const read = fs.readFileSync;
  for (const suffix of [
    'copy-button.scss',
    'cite-this.scss',
    'cite-this.js',
    'source-footprints.json',
    'Roboto-Regular.woff2',
  ]) {
    fs.readFileSync = function (f, ...args) {
      const x = read.call(this, f, ...args);
      return typeof f === 'string' && f.endsWith(suffix)
        ? Buffer.isBuffer(x)
          ? Buffer.concat([x, Buffer.from('changed')])
          : x + 'changed'
        : x;
    };
    try {
      assert.throws(document, /recipe needs updating/);
    } finally {
      fs.readFileSync = read;
    }
  }
  const rejected = await rangeEnvironment(d, {
    rejectedFonts: ['Menlo Regular'],
  });
  installCopyCiteSvgFixture(rejected, d.components.families);
  assert.deepStrictEqual(
    clone(
      (await rejected.call('importVariables', d, ['undrr'], false, [], true))
        .errors
    ),
    []
  );
  const before = [...rejected.state.nodes.keys()];
  assert(
    (await rejected.call('buildMangroveComponents', d, 'undrr', ids)).errors
      .length
  );
  assert.deepStrictEqual([...rejected.state.nodes.keys()], before);
  console.log(
    'Missing actual candidate font refuses scene mutation; source drift guards pass. Native source raster/dialog/clipboard behavior remains open.'
  );
}
module.exports = { document, installCopyCiteSvgFixture };
if (require.main === module)
  main().catch(e => {
    console.error(e.stack || e);
    process.exitCode = 1;
  });
