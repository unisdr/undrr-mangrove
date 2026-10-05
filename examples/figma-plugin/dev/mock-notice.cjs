#!/usr/bin/env node
/** Experimental Notice source guards and actual builder lifecycle. No pixel claims. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { environment, importFoundation } = require('./mock-kit.cjs');
const {
  buildNoticeRecipes,
} = require('../../../scripts/figma-notice-recipes.cjs');
const root = path.resolve(__dirname, '../../..');
const copy = v => JSON.parse(JSON.stringify(v));
const identity = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
const identities = env =>
  [...env.state.nodes.values()]
    .filter(identity)
    .map(n => [identity(n), n.id])
    .sort();
function document() {
  const doc = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
  );
  doc.components.families = buildNoticeRecipes({ root, ...doc });
  return doc;
}
function changedSource(file, transform) {
  const read = fs.readFileSync;
  fs.readFileSync = function (filename, ...args) {
    const result = read.call(this, filename, ...args);
    return typeof filename === 'string' && filename.endsWith(file)
      ? transform(result)
      : result;
  };
  try {
    assert.throws(document, /needs updating/);
  } finally {
    fs.readFileSync = read;
  }
}
async function main() {
  const doc = document(),
    family = doc.components.families[0];
  assert.deepStrictEqual(
    family.variants.map(v => v.properties.Tone),
    ['Info', 'Warning', 'Negative', 'Positive']
  );
  assert.strictEqual(doc.modes.length, 5);
  const before = copy({ variables: doc.variables, styles: doc.styles });
  assert.deepStrictEqual(buildNoticeRecipes({ root, ...doc }), [family]);
  assert.deepStrictEqual(
    copy({ variables: doc.variables, styles: doc.styles }),
    before
  );
  const byName = new Map(doc.variables.map(v => [v.name, v]));
  const value = (name, mode) => {
    const entry = byName.get(name).values[mode.id];
    return entry.alias ? value(entry.alias, mode) : entry;
  };
  for (const mode of doc.modes) {
    for (const [name, role, a] of [
      ['info-border', 'blue-900', 0.5],
      ['warning-border', 'gold-800', 0.5],
      ['negative-border', 'red-900', 0.4],
      ['positive-border', 'accent-400', 0.5],
      ['warning-background', 'accent-100', 0.18],
      ['positive-background', 'accent-400', 0.08],
    ])
      assert.deepStrictEqual(value(`component/notice/${name}`, mode), {
        ...value(`color/${role}`, mode),
        a,
      });
    assert.strictEqual(
      value('component/notice/icon-size', mode),
      1.5 * value('font-size/300', mode)
    );
    assert.strictEqual(
      doc.variables.find(v => v.name === 'component/notice/negative-border')
        .values[mode.id].a,
      0.4
    );
    assert.strictEqual(
      doc.variables.find(v => v.name === 'component/notice/warning-background')
        .values[mode.id].a,
      0.18
    );
    assert.strictEqual(
      doc.variables.find(v => v.name === 'component/notice/positive-background')
        .values[mode.id].a,
      0.08
    );
    assert.strictEqual(
      doc.styles.text.find(s => s.id === 'component.notice.title').values[
        mode.id
      ].lineHeight.value,
      135
    );
  }
  for (const [file, transform] of [
    [
      '/stories/Components/Notice/notice.scss',
      s =>
        s.replace(
          'background-color: var(--mg-notice-bg);',
          'background-color: transparent;'
        ),
    ],
    [
      '/stories/Components/Notice/notice.scss',
      s => s.replace('box-sizing: border-box;', 'box-sizing: content-box;'),
    ],
    [
      '/stories/Components/Notice/notice.scss',
      s =>
        s.replace(
          'color: var(--mg-notice-icon-color);',
          'color: currentColor;'
        ),
    ],
    [
      '/stories/Components/Notice/notice.scss',
      s => `${s}\n.mg-notice { background-color: transparent; }\n`,
    ],
    [
      '/stories/Components/Notice/Notice.jsx',
      s => s.replace("'negative', 'positive'", "'emergency', 'positive'"),
    ],
    [
      '/stories/Components/Notice/notice.scss',
      s =>
        s.replace(
          '--mg-notice-border-width: 4px;',
          '--mg-notice-border-width: 5px;'
        ),
    ],
    [
      '/stories/Components/Notice/notice.scss',
      s => s.replace('line-height: 1.35;', 'line-height: 1.4;'),
    ],
    [
      '/stories/Components/Notice/notice.scss',
      s =>
        s.replace('--mg-color-gold-800) / 0.5', '--mg-color-gold-800) / 0.6'),
    ],
    [
      '/stories/Atom/Icons/_icon-definitions.scss',
      s =>
        s.replace(
          '.mg-icon-info-circle::before',
          '.mg-icon-information::before'
        ),
    ],
  ])
    changedSource(file, transform);
  const env = environment(doc);
  env.state.noticeSvgCalls = [];
  const expected = family.variants.map(
    v => v.tree.children[0].children[0].svg.markup
  );
  env.figma.createNodeFromSvg = markup => {
    // Bounded source import fixture. We retain exact asset markup and paint,
    // but do not simulate circles/path bounds, joins or mask rasterisation.
    assert(
      expected.some(
        svg => markup.replace(/ width="24" height="24"/, '') === svg
      )
    );
    env.state.noticeSvgCalls.push(markup);
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
  await importFoundation(env, doc);
  const built = await env.call('buildMangroveComponents', doc, 'undrr', [
    'notice',
  ]);
  assert.deepStrictEqual(copy(built.errors), []);
  const result = built.families.find(f => f.id === 'notice');
  assert.strictEqual(result.variantIds.length, 4);
  assert.strictEqual(env.state.noticeSvgCalls.length, 4);
  const find = (n, name) => n.findAll(child => child.name === name)[0];
  const master = env.state.nodes.get(result.variantIds[0].nodeId);
  assert.strictEqual(master.width, 480);
  assert.strictEqual(master.strokeLeftWeight, 4);
  assert.strictEqual(master.strokeTopWeight, 1);
  assert.strictEqual(master.paddingTop, 15);
  assert.strictEqual(master.paddingLeft, 20);
  assert.strictEqual(find(master, 'mg-notice__icon').width, 24);
  assert.strictEqual(find(master, 'mg-notice__title').fontName.style, 'Bold');
  assert.strictEqual(find(master, 'mg-notice__title').textWrapStyle, 'BALANCE');
  assert.strictEqual(find(master, 'mg-notice__description').fontSize, 14);
  const instance = [...env.state.nodes.values()].find(
    n => n.type === 'INSTANCE' && identity(n)?.startsWith('review/notice/')
  );
  assert(instance);
  const property = name =>
    Object.keys(instance.componentProperties).find(
      k => k.replace(/#[^#]+$/, '') === name
    );
  assert(property('Title') && property('Body') && property('Show icon'));
  instance.setProperties({
    [property('Title')]: 'Edited title',
    [property('Body')]: 'Edited plain-text content',
    [property('Show icon')]: false,
  });
  instance.resize(520, instance.height);
  const ids = identities(env);
  const repeat = await env.call('buildMangroveComponents', doc, 'undrr', [
    'notice',
  ]);
  assert.deepStrictEqual(copy(repeat.errors), []);
  assert.strictEqual(repeat.createdNodeIds.length, 0);
  assert.deepStrictEqual(identities(env), ids);
  assert.strictEqual(env.state.noticeSvgCalls.length, 4);
  assert.strictEqual(instance.width, 520);
  assert.strictEqual(
    instance.componentProperties[property('Title')].value,
    'Edited title'
  );
  assert.strictEqual(
    instance.componentProperties[property('Body')].value,
    'Edited plain-text content'
  );
  assert.strictEqual(
    instance.componentProperties[property('Show icon')].value,
    false
  );
  const rejectedFont = doc.styles.text.find(
    s => s.id === 'component.notice.title'
  ).values.undrr.fontName;
  const rejectedName = `${rejectedFont.family} ${rejectedFont.style}`;
  const rejected = environment(doc, { rejectedFonts: [rejectedName] });
  await importFoundation(rejected, doc);
  const initial = identities(rejected);
  const failed = await rejected.call('buildMangroveComponents', doc, 'undrr', [
    'notice',
  ]);
  assert.strictEqual(failed.families.length, 0);
  assert(failed.errors.some(error => error.includes(rejectedName)));
  assert.deepStrictEqual(identities(rejected), initial);
  console.log(
    'ok  Notice four source tones, source drift guards, all-five-mode derivations, exact SVG import fixtures, actual builder zero-create repeat and edited instance retention'
  );
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
