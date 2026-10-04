#!/usr/bin/env node
/** Compact Empty State contracts. Bounded source SVG fixture, no native pixel claims. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { environment, importFoundation } = require('./mock-kit.cjs');
const {
  buildEmptyStateRecipes,
} = require('../../../scripts/figma-empty-state-recipes.cjs');
const root = path.resolve(__dirname, '../../..');
const copy = value => JSON.parse(JSON.stringify(value));
const id = (node, key = 'mgKitId') =>
  node.getSharedPluginData('orgundrrmangrove', key);
function document() {
  const doc = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
  );
  const families = buildEmptyStateRecipes({
    root,
    modes: doc.modes,
    variables: doc.variables,
    styles: doc.styles,
  });
  doc.components.families = [
    ...doc.components.families.filter(f => f.id !== 'empty-state-compact'),
    ...families,
  ];
  return doc;
}
function create(doc, options) {
  const env = environment(doc, options);
  const createText = env.figma.createText;
  env.figma.createText = () => {
    const text = createText();
    const setBoundVariable = text.setBoundVariable;
    text.setBoundVariable = function (field, variable) {
      if (field === 'maxWidth')
        throw new Error(
          "in setBoundVariable: invalid field for text node: 'maxWidth'"
        );
      return setBoundVariable.call(this, field, variable);
    };
    return text;
  };
  env.state.emptyStateSvgCalls = [];
  env.figma.createNodeFromSvg = markup => {
    assert(/viewBox="0 0 56 44"/.test(markup));
    assert(/stroke="#000000"/.test(markup));
    assert(/stroke-width="2"/.test(markup));
    assert(/stroke-linejoin="round"/.test(markup));
    const paths = [...markup.matchAll(/<path d="([^"]+)"\s*\/>/g)].map(
      m => m[1]
    );
    assert.deepStrictEqual(paths, [
      'M8 18 14 4h28l6 14',
      'M8 18h12l3 6h10l3-6h12v18a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4z',
    ]);
    env.state.emptyStateSvgCalls.push(markup);
    const frame = env.figma.createFrame();
    frame.resize(56, 44);
    if (!Object.getPrototypeOf(frame).rescale)
      Object.getPrototypeOf(frame).rescale = function (scale) {
        assert(Number.isFinite(scale) && scale >= 0.01);
        const resize = (node, descendant) => {
          if (descendant) {
            node.x *= scale;
            node.y *= scale;
          }
          node.resizeWithoutConstraints(
            node.width * scale,
            node.height * scale
          );
          if (typeof node.strokeWeight === 'number') node.strokeWeight *= scale;
          for (const child of node.children || []) resize(child, true);
        };
        resize(this, false);
      };
    for (const [index, data] of paths.entries()) {
      const vector = new frame.constructor('VECTOR');
      // Synthetic path-centreline bounds only. Native stroke bounds/topology
      // and rasterisation are separate acceptance checks, not a general parser.
      vector.resize(40, index ? 22 : 14);
      vector.x = 8;
      vector.y = index ? 18 : 4;
      vector.vectorPaths = [{ windingRule: 'NONZERO', data }];
      vector.fills = [];
      vector.strokes = [
        {
          type: 'SOLID',
          color: { r: 0, g: 0, b: 0 },
          opacity: 1,
          visible: true,
        },
      ];
      vector.strokeWeight = 2;
      vector.strokeJoin = 'ROUND';
      frame.appendChild(vector);
    }
    return frame;
  };
  return env;
}
const find = (node, name) => node.findAll(n => n.name === name)[0];
const property = (node, name) => {
  const key = Object.keys(node.componentProperties).find(
    k => k.replace(/#[^#]+$/, '') === name
  );
  assert(key, `Missing exposed ${name}`);
  return key;
};
const identities = env =>
  [...env.state.nodes.values()]
    .filter(n => id(n))
    .map(n => [id(n), n.id])
    .sort((a, b) => a[0].localeCompare(b[0]));
function changedSource(file, replace, check) {
  const original = fs.readFileSync;
  fs.readFileSync = function (filename, ...args) {
    const result = original.call(this, filename, ...args);
    return typeof filename === 'string' && filename.endsWith(file)
      ? replace(result)
      : result;
  };
  try {
    check();
  } finally {
    fs.readFileSync = original;
  }
}
async function main() {
  const doc = document(),
    family = doc.components.families.find(f => f.id === 'empty-state-compact');
  assert.strictEqual(family.variants.length, 4);
  assert.deepStrictEqual(
    family.variants.map(v => v.properties),
    [
      { Surface: 'Plain', Alignment: 'Centre' },
      { Surface: 'Plain', Alignment: 'Start' },
      { Surface: 'Panel', Alignment: 'Centre' },
      { Surface: 'Panel', Alignment: 'Start' },
    ]
  );
  const variableIds = doc.variables.map(v => v.id),
    styleIds = doc.styles.text.map(s => s.id);
  assert.deepStrictEqual(buildEmptyStateRecipes({ root, ...doc }), [family]);
  assert.deepStrictEqual(
    doc.variables.map(v => v.id),
    variableIds
  );
  assert.deepStrictEqual(
    doc.styles.text.map(s => s.id),
    styleIds
  );
  assert.strictEqual(
    doc.variables.filter(v => v.name.startsWith('empty-state/')).length,
    8
  );
  assert.strictEqual(family.review.preserveVariantSizing, true);
  for (const [file, replace] of [
    [
      '/stories/Atom/EmptyState/EmptyState.stories.jsx',
      s => s.replace('M8 18 14 4h28l6 14', 'M8 18 14 5h28l6 14'),
    ],
    [
      '/stories/Atom/EmptyState/empty-state.scss',
      s => s.replace('text-wrap: pretty;', 'text-wrap: balance;'),
    ],
    [
      '/stories/Atom/EmptyState/empty-state.scss',
      s => s.replace('align-items: flex-start;', 'align-items: center;'),
    ],
    [
      '/stories/assets/scss/_variables.scss',
      s =>
        s.replace(
          '--mg-empty-state-compact-media-size: #{mg-rem(34)};',
          '--mg-empty-state-compact-media-size: #{mg-rem(35)};'
        ),
    ],
  ])
    changedSource(file, replace, () =>
      assert.throws(document, /needs updating/)
    );
  console.log(
    'ok  four source compact variants, source SVG/layout/wrapping/role guards and repeat exporter identities'
  );

  const obsolete = copy(doc);
  for (const variant of obsolete.components.families.find(
    f => f.id === family.id
  ).variants) {
    const wrapper = variant.tree.children.find(
      child => child.id === 'description-bound'
    );
    const text = wrapper.children[0];
    text.layout.maxWidth = wrapper.layout.maxWidth;
    variant.tree.children[variant.tree.children.indexOf(wrapper)] = text;
  }
  const nativeRefusal = create(obsolete);
  await importFoundation(nativeRefusal, obsolete);
  const beforeRefusal = identities(nativeRefusal);
  const failed = await nativeRefusal.call(
    'buildMangroveComponents',
    obsolete,
    'undrr',
    [family.id]
  );
  assert(
    failed.errors.some(error =>
      error.includes("invalid field for text node: 'maxWidth'")
    )
  );
  assert.strictEqual(failed.families.length, 0);
  assert.deepStrictEqual(
    identities(nativeRefusal).filter(
      ([key]) => !['main', 'review'].includes(key)
    ),
    beforeRefusal
  );
  assert.strictEqual(
    failed.audit.find(item => item.family === family.id)
      .existingChangesRetained,
    false
  );
  console.log(
    'ok  native TEXT maxWidth-binding refusal reproduces the failed old contract and retains no partial family'
  );

  const env = create(doc, {
    rejectedFonts: ['Roboto Condensed Regular', 'Roboto Condensed Bold'],
  });
  await importFoundation(env, doc);
  const built = await env.call('buildMangroveComponents', doc, 'undrr', [
    'empty-state-compact',
  ]);
  assert.deepStrictEqual(copy(built.errors), []);
  const result = built.families.find(f => f.id === family.id);
  assert.strictEqual(result.variantIds.length, 4);
  assert.strictEqual(env.state.emptyStateSvgCalls.length, 4);
  const variables = new Map(env.state.variables.map(v => [v.name, v]));
  for (const variant of result.variantIds) {
    const main = env.state.nodes.get(variant.nodeId),
      recipe = family.variants.find(v => v.id === variant.id);
    assert.strictEqual(main.width, 200);
    assert.strictEqual(main.layoutSizingVertical, 'HUG');
    assert.strictEqual(main.paddingLeft, 15);
    assert.strictEqual(main.paddingRight, 15);
    assert.strictEqual(main.paddingTop, 15);
    assert.strictEqual(main.paddingBottom, 15);
    assert.strictEqual(main.itemSpacing, 5);
    assert.strictEqual(main.clipsContent, false);
    assert.strictEqual(
      main.counterAxisAlignItems,
      recipe.properties.Alignment === 'Centre' ? 'CENTER' : 'MIN'
    );
    if (recipe.properties.Surface === 'Panel') {
      assert.strictEqual(
        main.fills[0].boundVariables.color.id,
        variables.get('empty-state/panel-background').id
      );
      assert.strictEqual(
        main.boundVariables.cornerRadius.id,
        variables.get('empty-state/panel-radius').id
      );
    } else {
      assert.deepStrictEqual(copy(main.fills), []);
      assert.strictEqual(main.boundVariables.cornerRadius, undefined);
      assert.strictEqual(main.cornerRadius ?? 0, 0);
    }
    const media = find(main, 'mg-empty-state__media'),
      svg = find(main, 'Source empty tray'),
      text = find(main, 'mg-empty-state__description');
    assert.strictEqual(media.width, 34);
    assert.strictEqual(media.height, 34);
    assert.strictEqual(media.visible, true);
    assert.strictEqual(media.counterAxisAlignItems, 'CENTER');
    assert.strictEqual(media.primaryAxisAlignItems, 'CENTER');
    assert.strictEqual(svg.width, 34);
    assert(Math.abs(svg.height - (34 * 44) / 56) < 1e-9);
    assert.strictEqual(svg.children.length, 2);
    assert.deepStrictEqual(
      copy(JSON.parse(id(svg, 'mgSvgAsset')).paintPolicy),
      { strokes: 'empty-state/media-color' }
    );
    for (const vector of svg.children) {
      assert.deepStrictEqual(copy(vector.fills), []);
      assert.strictEqual(
        vector.strokes[0].boundVariables.color.id,
        variables.get('empty-state/media-color').id
      );
      assert.strictEqual(vector.strokeJoin, 'ROUND');
      assert(Math.abs(vector.strokeWeight - (2 * 34) / 56) < 1e-9);
    }
    assert.strictEqual(text.characters, 'No data');
    assert.deepStrictEqual(copy(text.fontName), {
      family: 'Roboto',
      style: 'Regular',
    });
    assert.strictEqual(text.fontSize, 14);
    assert.deepStrictEqual(copy(text.lineHeight), {
      unit: 'PERCENT',
      value: 150,
    });
    assert.strictEqual(text.textWrapStyle, 'PRETTY');
    assert.strictEqual(text.textDecoration, 'NONE');
    assert.strictEqual(
      text.textAlignHorizontal,
      recipe.properties.Alignment === 'Centre' ? 'CENTER' : 'LEFT'
    );
    assert.strictEqual(text.layoutSizingHorizontal, 'FILL');
    assert.strictEqual(text.layoutSizingVertical, 'HUG');
    assert.strictEqual(text.boundVariables.maxWidth, undefined);
    const wrapper = find(main, 'Source description width constraint');
    assert.strictEqual(text.parent, wrapper);
    assert.strictEqual(wrapper.layoutMode, 'VERTICAL');
    assert.strictEqual(wrapper.layoutSizingHorizontal, 'FILL');
    assert.strictEqual(wrapper.layoutSizingVertical, 'HUG');
    assert.strictEqual(wrapper.maxWidth, 440);
    assert.strictEqual(
      wrapper.boundVariables.maxWidth.id,
      variables.get('empty-state/max-inline-size').id
    );
    assert.strictEqual(wrapper.clipsContent, false);
    assert.strictEqual(
      text.fills[0].boundVariables.color.id,
      variables.get('empty-state/text-color').id
    );
    assert(!main.findAll(n => /title|action/.test(n.name)).length);
  }
  console.log(
    'ok  bounded200 layout, optional source media, exact retained stroke paths/joins and Regular14/150% PRETTY contracts'
  );

  const long = [...env.state.nodes.values()].find(
    n => id(n) === 'review/empty-state-compact/specimen/long-240/instance'
  );
  const noMedia = [...env.state.nodes.values()].find(
    n => id(n) === 'review/empty-state-compact/specimen/no-media/instance'
  );
  assert(long && noMedia);
  assert.strictEqual(long.width, 240);
  assert(
    long.componentProperties[property(long, 'Description')].value.startsWith(
      'No records match'
    )
  );
  assert.strictEqual(
    noMedia.componentProperties[property(noMedia, 'Show media')].value,
    false
  );
  assert.strictEqual(
    find(noMedia, 'mg-empty-state__media').componentPropertyReferences.visible,
    property(noMedia, 'Show media')
  );
  // Shared mock records property overrides, not native effective visibility.
  long.setProperties({
    [property(long, 'Description')]: 'My editable French description',
    [property(long, 'Show media')]: false,
  });
  long.resize(260, long.height);
  const text = find(long, 'mg-empty-state__description');
  await env.figma.loadFontAsync(text.fontName);
  text.textAlignHorizontal = 'LEFT';
  const before = identities(env),
    defs = copy(env.state.nodes.get(result.setId).componentPropertyDefinitions);
  const repeat = await env.call('buildMangroveComponents', doc, 'undrr', [
    'empty-state-compact',
  ]);
  assert.deepStrictEqual(copy(repeat.errors), []);
  assert.strictEqual(repeat.createdNodeIds.length, 0);
  assert.deepStrictEqual(identities(env), before);
  assert.deepStrictEqual(
    copy(env.state.nodes.get(result.setId).componentPropertyDefinitions),
    defs
  );
  assert.strictEqual(env.state.emptyStateSvgCalls.length, 4);
  assert.strictEqual(long.width, 260);
  assert.strictEqual(
    long.componentProperties[property(long, 'Description')].value,
    'My editable French description'
  );
  assert.strictEqual(
    long.componentProperties[property(long, 'Show media')].value,
    false
  );
  assert.strictEqual(
    find(long, 'mg-empty-state__description').textAlignHorizontal,
    'LEFT'
  );
  console.log(
    'ok  fresh long200/240 and omitted-media specimens, ordinary repeat preserves IDs, suffixed properties, edited content/width/format and SVG assets'
  );

  const rejected = create(doc, { rejectedFonts: ['Roboto Regular'] });
  await importFoundation(rejected, doc);
  const originalIds = identities(rejected);
  const blocked = await rejected.call('buildMangroveComponents', doc, 'undrr', [
    'empty-state-compact',
  ]);
  assert.strictEqual(blocked.families.length, 0);
  assert(blocked.errors.some(error => error.includes('Roboto Regular')));
  assert.deepStrictEqual(identities(rejected), originalIds);
  assert.strictEqual(rejected.state.emptyStateSvgCalls.length, 0);
  console.log(
    'ok  exact Regular font failure blocks construction before canvas mutation; unrelated Condensed failure does not block scope'
  );
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
