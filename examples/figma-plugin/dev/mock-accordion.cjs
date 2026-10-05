#!/usr/bin/env node
/** Bounded Accordion API/source contracts. No browser/native rendering proof. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { environment } = require('./mock-kit.cjs');
const {
  buildAccordionRecipes,
} = require('../../../scripts/figma-accordion-recipes.cjs');
const root = path.resolve(__dirname, '../../..');
const copy = v => JSON.parse(JSON.stringify(v));
const identity = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
const property = (n, name) =>
  Object.keys(n.componentProperties).find(
    k => k.replace(/#[^#]+$/, '') === name
  );
function document() {
  const doc = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
  );
  doc.components.families = buildAccordionRecipes({ root, ...doc });
  return doc;
}
function installAccordionSvgFixture(env, family) {
  const specs = [];
  function visit(n) {
    if (n.type === 'SVG') specs.push(n);
    for (const c of n.children || []) visit(c);
  }
  family.variants.forEach(v => visit(v.tree));
  const previous = env.figma.createNodeFromSvg;
  env.state.accordionSvgCalls = [];
  env.figma.createNodeFromSvg = markup => {
    const spec = specs.find(
      s =>
        s.svg.markup === markup.replace(/ width="[\d.]+" height="[\d.]+"/, '')
    );
    if (!spec) return previous(markup);
    // Exact source polygon fixture supports lifecycle assertions only.
    // It cannot establish path bounds, browser flex layout or pixels.
    env.state.accordionSvgCalls.push(markup);
    const frame = env.figma.createFrame();
    frame.resize(spec.layout.width, spec.layout.height);
    Object.getPrototypeOf(frame).rescale = function (scale) {
      this.resizeWithoutConstraints(this.width * scale, this.height * scale);
      for (const child of this.children || [])
        child.resizeWithoutConstraints(
          child.width * scale,
          child.height * scale
        );
    };
    const vector = new frame.constructor('VECTOR');
    vector.resize(spec.layout.width, spec.layout.height);
    vector.vectorPaths = [{ windingRule: 'NONZERO', data: 'M0 0' }];
    vector.fills = [
      { type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 1, visible: true },
    ];
    vector.strokes = [];
    frame.appendChild(vector);
    return frame;
  };
}
async function main() {
  const doc = document(),
    family = doc.components.families[0],
    before = copy({ variables: doc.variables, styles: doc.styles });
  assert.strictEqual(family.variants.length, 4);
  assert.deepStrictEqual(buildAccordionRecipes({ root, ...doc }), [family]);
  assert.deepStrictEqual(
    copy({ variables: doc.variables, styles: doc.styles }),
    before
  );
  for (const mode of doc.modes) {
    for (const style of doc.styles.text.filter(s =>
      s.id.startsWith('component.accordion.')
    )) {
      assert.strictEqual(style.values[mode.id].fontSize, 16);
      assert.strictEqual(style.values[mode.id].lineHeight.value, 24);
      assert.strictEqual(style.values[mode.id].fontName.family, 'Roboto');
    }
    const env = environment(doc, { sharedOnly: true });
    installAccordionSvgFixture(env, family);
    const imported = await env.call(
      'importVariables',
      doc,
      [mode.id],
      false,
      [],
      true
    );
    assert.deepStrictEqual(copy(imported.errors), []);
    const first = await env.call('buildMangroveComponents', doc, mode.id, [
      'accordion',
    ]);
    assert.deepStrictEqual(copy(first.errors), []);
    assert.strictEqual(first.families[0].variantIds.length, 4);
    assert.strictEqual(env.state.accordionSvgCalls.length, 12);
    const consumers = [];
    for (const entry of first.families[0].variantIds) {
      const main = env.state.nodes.get(entry.nodeId),
        spec = family.variants.find(v => v.id === entry.id);
      assert.strictEqual(main.width, 390);
      assert.strictEqual(main.children.length, 3);
      assert.strictEqual(main.clipsContent, true);
      assert.strictEqual(main.strokeTopWeight, 1);
      assert.strictEqual(main.strokeBottomWeight, 1);
      assert.strictEqual(
        main.strokeLeftWeight,
        spec.properties.Treatment === 'Flush' ? 0 : 1
      );
      assert.strictEqual(
        main.strokeRightWeight,
        spec.properties.Treatment === 'Flush' ? 0 : 1
      );
      assert.strictEqual(
        main.cornerRadius,
        spec.properties.Treatment === 'Flush' ? 0 : 4
      );
      main.children.forEach((item, index) => {
        const summary = item.children[0];
        assert.strictEqual(summary.minHeight, 44);
        assert.strictEqual(summary.paddingTop, 10);
        assert.strictEqual(summary.paddingLeft, 15);
        assert.strictEqual(summary.children[0].fontName.style, 'Bold');
        if (index < 2) assert.strictEqual(item.strokeBottomWeight, 1);
        else assert.deepStrictEqual(copy(item.strokes), []);
        assert.strictEqual(summary.children[1].width, 8);
        assert.strictEqual(
          summary.children[1].children[0].x,
          Number(((8 - 8 * Math.SQRT2) / 2).toFixed(8))
        );
      });
      const opened = spec.properties.FirstOpen === 'True';
      assert.strictEqual(main.children[0].children.length, opened ? 2 : 1);
      if (opened)
        assert.strictEqual(main.children[0].children[0].strokeBottomWeight, 1);
      else
        assert.deepStrictEqual(copy(main.children[0].children[0].strokes), []);
      if (opened) {
        const body = main.findAll(n => n.name === 'Body 1')[0];
        assert.strictEqual(body.fontName.style, 'Regular');
        assert.strictEqual(body.fontSize, 16);
        assert.strictEqual(main.children[0].children[1].paddingTop, 15);
        const consumer = main.createInstance();
        assert(property(consumer, 'Body 1'));
        consumer.setProperties({
          [property(consumer, 'Title 2')]: 'Edited second disclosure',
          [property(consumer, 'Body 1')]: 'Edited plain text paragraph.',
        });
        consumer.x = 145;
        consumer.y = 267;
        consumers.push(consumer);
      }
    }
    const ids = () =>
      [...env.state.nodes.values()]
        .filter(n => !n.removed && identity(n))
        .map(n => [identity(n), n.id])
        .sort();
    const baseline = ids();
    for (let i = 0; i < 2; i++) {
      const repeated = await env.call('buildMangroveComponents', doc, mode.id, [
        'accordion',
      ]);
      assert.deepStrictEqual(copy(repeated.errors), []);
      assert.strictEqual(repeated.createdNodeIds.length, 0);
      assert.deepStrictEqual(ids(), baseline);
      assert.strictEqual(env.state.accordionSvgCalls.length, 12);
      for (const consumer of consumers) {
        assert(!consumer.removed);
        assert.strictEqual(consumer.x, 145);
        assert.strictEqual(consumer.y, 267);
        assert.strictEqual(
          consumer.componentProperties[property(consumer, 'Title 2')].value,
          'Edited second disclosure'
        );
        assert.strictEqual(
          consumer.componentProperties[property(consumer, 'Body 1')].value,
          'Edited plain text paragraph.'
        );
      }
    }
  }
  console.log(
    'ok  four Default/Flush first-open/closed presets, source borders/chevrons/typography and all-five-brand two zero-create repeats retaining title/body edits'
  );
  const read = fs.readFileSync;
  for (const [suffix, from, to] of [
    ['details.scss', 'min-height: mg-rem(44);', 'min-height: mg-rem(45);'],
    ['details.scss', 'border-inline: none;', 'border-inline: 2px solid red;'],
    ['_foundational.scss', 'p {\n  margin-top: 0;', 'p {\n  margin-top: 2px;'],
    ['_mixins.scss', '%paragraph-font-300 {', '%paragraph-font-301 {'],
    [
      'BaseTypography.stories.jsx',
      'What is the Sendai Framework?',
      'Changed source title',
    ],
  ]) {
    let matched = false;
    fs.readFileSync = function (file, ...args) {
      const text = read.call(this, file, ...args);
      if (typeof file !== 'string' || !file.endsWith(suffix)) return text;
      const next = text.replace(from, to);
      matched = matched || next !== text;
      return next;
    };
    try {
      assert.throws(document, /recipe needs updating/);
      assert(matched);
    } finally {
      fs.readFileSync = read;
    }
  }
  const broken = document();
  broken.variables.push({
    ...broken.variables.find(v => v.name === 'component/accordion/border'),
  });
  assert.throws(
    () => buildAccordionRecipes({ root, ...broken }),
    /Foreign\/duplicate/
  );
  const foreignStyle = document();
  foreignStyle.styles.text.find(
    s => s.id === 'component.accordion.summary'
  ).name = 'Foreign style owner';
  assert.throws(
    () => buildAccordionRecipes({ root, ...foreignStyle }),
    /Foreign\/duplicate/
  );
  const foreignRole = document();
  foreignRole.variables.find(
    v => v.name === 'component/accordion/border'
  ).name = 'foreign/owner';
  assert.throws(
    () => buildAccordionRecipes({ root, ...foreignRole }),
    /Foreign\/duplicate/
  );
  const absent = environment(doc, {
    sharedOnly: true,
    rejectedFonts: ['Roboto Bold'],
  });
  const imported = await absent.call(
    'importVariables',
    doc,
    ['undrr'],
    false,
    [],
    true
  );
  assert.deepStrictEqual(copy(imported.errors), []);
  const snapshot = () =>
    [...absent.state.nodes.values()].map(n => [n.id, identity(n)]);
  const baseline = snapshot();
  const refusal = await absent.call('buildMangroveComponents', doc, 'undrr', [
    'accordion',
  ]);
  assert(refusal.errors.length);
  assert.deepStrictEqual(snapshot(), baseline);
  assert.strictEqual(refusal.families.length, 0);
  console.log(
    'ok  stylesheet/foundation/mixin/story drift and helper collisions fail closed; missing exact font refuses before canvas mutation'
  );
}
module.exports = { installAccordionSvgFixture };
if (require.main === module)
  main().catch(error => {
    console.error(error.stack || error);
    process.exitCode = 1;
  });
