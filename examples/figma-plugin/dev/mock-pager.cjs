#!/usr/bin/env node
/** Pager source snapshots and builder lifecycle. No text/SVG/CSS rasterisation. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { environment } = require('./mock-kit.cjs');
const {
  buildPagerRecipes,
} = require('../../../scripts/figma-pager-recipes.cjs');
const root = path.resolve(__dirname, '../../..');
const copy = v => JSON.parse(JSON.stringify(v));
const identity = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
const property = (n, name) =>
  Object.keys(n.componentProperties).find(
    k => k.replace(/#[^#]+$/, '') === name
  );
function document() {
  const doc = JSON.parse(
    fs.readFileSync(
      path.join(root, 'examples/figma-plugin/mangrove-variables.json'),
      'utf8'
    )
  );
  doc.components.families = buildPagerRecipes({ root, ...doc });
  return doc;
}
function installPagerSvgFixture(env, families) {
  const expected = new Map();
  function visit(tree) {
    if (tree.type === 'SVG') expected.set(tree.svg.assetId, tree.svg.markup);
    for (const c of tree.children || []) visit(c);
  }
  for (const f of families.filter(f => f.id === 'pager'))
    for (const v of f.variants) visit(v.tree);
  assert.strictEqual(
    expected.size,
    2,
    'Fixture accepts only the exact previous/next source chevrons'
  );
  const calls = [];
  const previous = env.figma.createNodeFromSvg.bind(env.figma);
  env.figma.createNodeFromSvg = markup => {
    if (
      ![...expected.values()].includes(
        markup.replace(/ width="24" height="24"/, '')
      )
    )
      return previous(markup);
    calls.push(markup);
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
    const vector = env.figma.createVector();
    vector.resize(24, 24);
    // This is an exact-import API fixture, not path-bound geometry evidence.
    vector.vectorPaths = [
      {
        windingRule: 'NONZERO',
        data: markup.includes('15 18 9 12 15 6')
          ? 'M15 18L9 12L15 6'
          : 'M9 18L15 12L9 6',
      },
    ];
    vector.fills = [];
    vector.strokes = [
      { type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 1, visible: true },
    ];
    vector.strokeWeight = 2;
    vector.strokeCap = 'ROUND';
    vector.strokeJoin = 'ROUND';
    frame.appendChild(vector);
    return frame;
  };
  return calls;
}
function changed(file, before, after) {
  const read = fs.readFileSync;
  let matched = false;
  fs.readFileSync = function (filename, ...args) {
    const result = read.call(this, filename, ...args);
    if (typeof filename !== 'string' || !filename.endsWith(file)) return result;
    const next = result.replace(before, after);
    matched = next !== result;
    return next;
  };
  try {
    assert.throws(document, /Pager recipe needs updating/);
    assert(matched);
  } finally {
    fs.readFileSync = read;
  }
}
async function main() {
  const doc = document(),
    family = doc.components.families[0];
  const before = copy({ variables: doc.variables, styles: doc.styles });
  assert.deepStrictEqual(buildPagerRecipes({ root, ...doc }), [family]);
  assert.deepStrictEqual(
    copy({ variables: doc.variables, styles: doc.styles }),
    before
  );
  assert.deepStrictEqual(
    family.variants.map(v => v.properties),
    ['Default', 'Loading', 'FewPages'].map(Snapshot => ({ Snapshot }))
  );
  const defaultList = family.variants[0].tree.children[0].children;
  assert.deepStrictEqual(
    defaultList.map(n => n.id),
    [
      'previous',
      'page-1',
      'page-2',
      'page-3',
      'page-4',
      'page-5',
      'ellipsis-end',
      'page-20',
      'next',
    ]
  );
  assert.deepStrictEqual(
    family.variants[2].tree.children[0].children.map(n => n.id),
    ['previous', 'page-1', 'page-2', 'page-3', 'next']
  );
  assert.strictEqual(
    defaultList.find(n => n.id === 'page-3').fill,
    'component/pager/current-background'
  );
  assert.strictEqual(
    defaultList[0].fill,
    'component/pager/navigation-background'
  );
  for (const n of family.variants[1].tree.children[0].children.filter(
    n => n.id !== 'ellipsis-end'
  )) {
    assert.strictEqual(
      n.fill,
      'component/pager/disabled-background',
      'Actual disabledattribute specificity must win current/navigation modifier backgrounds'
    );
    const leaf = n.children[0];
    assert.strictEqual(
      leaf.type === 'SVG' ? leaf.svg.monochrome.strokes : leaf.fill,
      'color/neutral-500'
    );
  }
  for (const args of [
    ['/tokens/mangrove.yaml', "$value: '1.5em'", "$value: '1.6em'"],
    [
      '/stories/Components/Pager/pager.scss',
      'min-width: mg-rem(44);',
      'min-width: mg-rem(40);',
    ],
    [
      '/stories/Components/Pager/pager.scss',
      'rgb(var(--mg-color-interactive) / 0.12)',
      'rgb(var(--mg-color-interactive) / 0.2)',
    ],
    [
      '/stories/Components/Pager/components/PagerList.jsx',
      'disabled={!hasPrevious || isLoading}',
      'disabled={!hasPrevious}',
    ],
    [
      '/stories/Components/Pager/components/PagerList.jsx',
      '15 18 9 12 15 6',
      '14 18 9 12 14 6',
    ],
    [
      '/stories/Components/Pager/Pager.stories.jsx',
      'page={3} totalPages={20}',
      'page={4} totalPages={20}',
    ],
    [
      '/stories/Utilities/Normalize/normalize.scss',
      'line-height: 1.15;',
      'line-height: 1.5;',
    ],
    [
      '/stories/assets/scss/_foundational.scss',
      'font-family: var(--mg-font-family-text);',
      'font-family: var(--mg-font-family-ui);',
    ],
    [
      '/stories/assets/fonts/roboto/roboto.scss',
      '@import "sass/Medium";',
      '@import "sass/SemiBold";',
    ],
    [
      '/stories/assets/fonts/roboto/sass/_Bold.scss',
      'font-weight: 700;',
      'font-weight: 600;',
    ],
    [
      '/stories/assets/fonts/roboto/sass/_Medium.scss',
      'font-weight: 500;',
      'font-weight: 600;',
    ],
    [
      '/stories/assets/scss/_variables.scss',
      '$mg-html-font-size: 16;',
      '$mg-html-font-size: 20;',
    ],
  ])
    changed(...args);
  for (const mutate of [
    d => {
      d.variables.find(
        v => v.name === 'component/pager/current-background'
      ).id = 'foreign.paint';
    },
    d => {
      d.styles.text.find(s => s.id === 'component.pager.number').name =
        'Foreign style';
    },
    d => {
      d.variables.find(v => v.name === 'color/interactive').type = 'FLOAT';
    },
  ]) {
    const bad = document();
    mutate(bad);
    assert.throws(
      () => buildPagerRecipes({ root, ...bad }),
      /Pager recipe needs updating/
    );
  }
  const value = (name, mode) => {
    const v = doc.variables.find(v => v.name === name).values[mode];
    return v.alias ? value(v.alias, mode) : v;
  };
  for (const mode of doc.modes) {
    for (const [name, target, alpha] of [
      ['current-background', 'color/interactive', 0.12],
      ['navigation-background', 'color/interactive', 0.06],
      ['disabled-background', 'color/neutral-100', 0.7],
    ])
      assert.deepStrictEqual(value(`component/pager/${name}`, mode.id), {
        ...value(target, mode.id),
        a: alpha,
      });
    const env = environment(doc, { sharedOnly: true });
    const svgCalls = installPagerSvgFixture(env, [family]);
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
      'pager',
    ]);
    assert.deepStrictEqual(copy(first.errors), []);
    assert.strictEqual(first.families[0].variantIds.length, 3);
    assert(svgCalls.length >= 6);
    const vars = new Map(env.state.variables.map(v => [v.name, v]));
    for (const result of first.families[0].variantIds) {
      const master = env.state.nodes.get(result.nodeId),
        spec = family.variants.find(v => v.id === result.id);
      assert.strictEqual(master.width, 640);
      assert.strictEqual(master.paddingTop, 15);
      const row = master.findAll(n => n.name === 'mg-pager__list')[0];
      assert.strictEqual(row.itemSpacing, 5);
      assert.strictEqual(row.primaryAxisAlignItems, 'CENTER');
      for (const button of row.children.filter(n =>
        n.name.startsWith('mg-pager__link')
      )) {
        assert.strictEqual(button.width, 44);
        assert.strictEqual(button.height, 44);
        assert.strictEqual(button.minWidth, 44);
        assert.strictEqual(button.minHeight, 44);
        assert.strictEqual(button.cornerRadius, 22);
        const controlSpec = spec.tree.children[0].children.find(
          c =>
            c.name === button.name &&
            (c.id.includes('previous') || c.id.includes('next'))
        );
        if (spec.sourceSnapshot.isLoading)
          assert.strictEqual(
            button.fills[0].boundVariables.color.id,
            vars.get('component/pager/disabled-background').id
          );
        else if (controlSpec)
          assert.strictEqual(
            button.fills[0].boundVariables.color.id,
            vars.get('component/pager/navigation-background').id
          );
      }
      for (const text of row.findAll(
        n => n.type === 'TEXT' && n.name.startsWith('Page ')
      )) {
        assert.deepStrictEqual(copy(text.fontName), {
          family: 'Roboto',
          style: 'Bold',
        });
        assert.strictEqual(text.fontSize, 12.5);
        assert.deepStrictEqual(copy(text.lineHeight), {
          unit: 'PERCENT',
          value: 115,
        });
      }
      for (const svg of row.findAll(n => n.name.includes('source chevron'))) {
        assert.strictEqual(svg.width, 20);
        assert.strictEqual(svg.height, 20);
        assert.strictEqual(
          svg.findAll(n => n.type === 'VECTOR')[0].strokes[0].boundVariables
            .color.id,
          vars.get(
            spec.sourceSnapshot.isLoading ? 'color/neutral-500' : 'color/text'
          ).id
        );
      }
    }
    const consumer = [...env.state.nodes.values()].find(
      n => n.type === 'INSTANCE' && identity(n)?.startsWith('review/pager/')
    );
    assert(consumer && property(consumer, 'Page 3'));
    consumer.setProperties({ [property(consumer, 'Page 3')]: 'III' });
    const ids = () =>
      [...env.state.nodes.values()]
        .filter(identity)
        .map(n => [identity(n), n.id])
        .sort((a, b) => a[0].localeCompare(b[0]));
    const identities = ids();
    for (let i = 0; i < 2; i++) {
      const repeated = await env.call('buildMangroveComponents', doc, mode.id, [
        'pager',
      ]);
      assert.deepStrictEqual(copy(repeated.errors), []);
      assert.strictEqual(repeated.createdNodeIds.length, 0);
      assert.deepStrictEqual(ids(), identities);
      assert.strictEqual(
        consumer.componentProperties[property(consumer, 'Page 3')].value,
        'III'
      );
    }
  }
  for (const font of ['Roboto Bold', 'Roboto Regular']) {
    const env = environment(doc, { rejectedFonts: [font], sharedOnly: true });
    installPagerSvgFixture(env, [family]);
    await env.call('importVariables', doc, ['undrr'], false, [], true);
    const ids = [...env.state.nodes.keys()];
    const failed = await env.call('buildMangroveComponents', doc, 'undrr', [
      'pager',
    ]);
    assert(failed.errors.length);
    assert.deepStrictEqual([...env.state.nodes.keys()], ids);
  }
  console.log(
    'Pager source-only mock passed: guarded three snapshots, exact two-chevron fixture, all-five-brand bindings, two zero-create repeats with page-label retention and missing-font refusal. Browser/native layout and pagination behaviour remain unverified.'
  );
}
if (require.main === module)
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
module.exports = { installPagerSvgFixture };
