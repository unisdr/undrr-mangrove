#!/usr/bin/env node
/** Source SVG primitive checks. This native API mock does not render or parse arbitrary SVG paths. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const copy = value => JSON.parse(JSON.stringify(value));
const identity = (node, key) =>
  node.getSharedPluginData('orgundrrmangrove', key);

function installSvgMock(figma, state, { createVector } = {}) {
  if (figma.createNodeFromSvg) return;
  state.svgImportCalls = [];
  state.svgScaleCalls = [];
  const attributes = text =>
    Object.fromEntries(
      [...text.matchAll(/([\w:-]+)\s*=\s*("[^"]*"|'[^']*')/g)].map(match => [
        match[1],
        match[2].slice(1, -1),
      ])
    );
  const paint = colour => {
    if (colour === 'none') return [];
    const colours = {
      '#fff': [1, 1, 1],
      '#ffffff': [1, 1, 1],
      white: [1, 1, 1],
      black: [0, 0, 0],
      '#000': [0, 0, 0],
      '#1a1a1a': [26 / 255, 26 / 255, 26 / 255],
      red: [1, 0, 0],
      blue: [0, 0, 1],
    };
    assert(
      colours[colour],
      `SVG mock needs an explicit colour fixture for ${colour}`
    );
    const [r, g, b] = colours[colour];
    return [{ type: 'SOLID', color: { r, g, b }, opacity: 1, visible: true }];
  };
  figma.createNodeFromSvg = markup => {
    state.svgImportCalls.push(markup);
    if (state.svgImportFailure) throw state.svgImportFailure;
    const root = attributes(/^\s*<svg\b([^>]*)>/.exec(markup)?.[1] || '');
    const frame = figma.createFrame();
    const prototype = Object.getPrototypeOf(frame);
    if (!prototype.rescale)
      prototype.rescale = function rescale(scale) {
        assert(
          scale >= 0.01 && Number.isFinite(scale),
          'Native rescale factor must be at least 0.01'
        );
        state.svgScaleCalls.push({ nodeId: this.id, scale });
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
    frame.resize(Number(root.width), Number(root.height));
    frame.opacity = Number(root.opacity ?? 1);
    for (const match of markup.matchAll(/<path\b([^>]*?)\/?\s*>/g)) {
      const attrs = attributes(match[1]);
      const vector = createVector
        ? createVector()
        : figma.createVector
          ? figma.createVector()
          : new frame.constructor('VECTOR');
      // Exact source asset geometry. Extend fixtures deliberately for other
      // assets rather than silently approximating arbitrary SVG path bounds.
      if (attrs.d === 'M3.5 8l3 3 6-6') {
        vector.x = 3.5;
        vector.y = 5;
        vector.resize(9, 6);
      } else if (attrs.d === 'M0 0L16 16') {
        vector.x = vector.y = 0;
        vector.resize(16, 16);
      } else if (attrs.d === 'M1.41 0L6 4.58 10.59 0 12 1.41l-6 6-6-6z') {
        vector.x = vector.y = 0;
        vector.resize(12, 7.41);
      } else
        throw new Error(
          `SVG mock needs an explicit path fixture for ${attrs.d}`
        );
      vector.vectorPaths = [{ windingRule: 'NONZERO', data: attrs.d }];
      vector.fills = paint(attrs.fill ?? root.fill ?? 'black');
      vector.strokes = paint(attrs.stroke ?? root.stroke ?? 'none');
      for (const entry of vector.fills)
        entry.opacity = Number(attrs['fill-opacity'] ?? 1);
      for (const entry of vector.strokes)
        entry.opacity = Number(attrs['stroke-opacity'] ?? 1);
      vector.opacity = Number(attrs.opacity ?? 1);
      vector.strokeWeight = Number(attrs['stroke-width'] ?? 1);
      vector.strokeAlign = 'CENTER';
      vector.strokeCap = (attrs['stroke-linecap'] || 'none').toUpperCase();
      vector.strokeJoin = (attrs['stroke-linejoin'] || 'miter').toUpperCase();
      frame.appendChild(vector);
    }
    if (state.svgTrimViewport) frame.resizeWithoutConstraints(9, 6);
    return frame;
  };
}
function svgEnvironment(doc, options) {
  // Deferred import permits mock-kit.environment to install this same helper.
  const env = require('./mock-kit.cjs').environment(doc, options);
  installSvgMock(env.figma, env.state);
  return env;
}
function fixtureDocument(source, markup) {
  const doc = copy(source);
  const variants = [20, 7.140625, 4.484375].map((side, index) => ({
    id: `svg-fixture.${index}`,
    name: `Tile=${side}`,
    properties: { Tile: String(side) },
    tree: {
      type: 'FRAME',
      id: 'control',
      name: 'Control',
      layout: { mode: 'NONE', width: 24, height: 24, clipsContent: true },
      children: [
        {
          type: 'SVG',
          id: 'mark',
          name: 'Source checkmark',
          svg: { assetId: 'form-check-checkbox-checkmark', markup },
          layout: { width: side, height: side },
          position: { x: 2, y: 2 },
        },
      ],
    },
  }));
  doc.components = {
    version: 1,
    families: [
      {
        id: 'svg-fixture',
        name: 'Mangrove / SVG fixture',
        kind: 'component-set',
        review: { genericLabels: false },
        variants,
      },
    ],
  };
  return doc;
}
async function main() {
  const dir = path.resolve(__dirname, '..');
  const source = JSON.parse(
    fs.readFileSync(path.join(dir, 'mangrove-variables.json'), 'utf8')
  );
  const scss = fs.readFileSync(
    path.resolve(dir, '../../stories/Components/Forms/_form-base.scss'),
    'utf8'
  );
  const checked =
    /\.mg-form-check__input--checkbox:checked\s*\{([^]*?)\n\}/.exec(scss);
  const data = /background-image: url\("data:image\/svg\+xml,([^"\n]+)"\)/.exec(
    checked?.[1] || ''
  );
  assert(data, 'Source Checkbox SVG disappeared');
  const markup = decodeURIComponent(data[1]);
  const doc = fixtureDocument(source, markup);
  const env = svgEnvironment(doc, { sharedOnly: true });
  await require('./mock-kit.cjs').importFoundation(env, doc);
  const build = document =>
    env.call('buildMangroveComponents', document, 'undrr', ['svg-fixture']);
  const first = await build(doc);
  assert.strictEqual(first.errors.length, 0, first.errors.join('\n'));
  const wrappers = [...env.state.nodes.values()].filter(
    node =>
      node.parent?.type === 'COMPONENT' &&
      /family\/svg-fixture\/variant\/[^/]+\/mark$/.test(
        identity(node, 'mgKitId')
      )
  );
  assert.strictEqual(wrappers.length, 3);
  const stableIds = wrappers.flatMap(node => [
    node.id,
    ...node.children.map(child => child.id),
  ]);
  const geometric = wrappers.map(node => ({
    id: node.id,
    width: node.width,
    height: node.height,
    x: node.x,
    y: node.y,
    vectorX: node.children[0].x,
    vectorY: node.children[0].y,
    strokeWeight: node.children[0].strokeWeight,
  }));
  for (const wrapper of wrappers) {
    const descriptor = JSON.parse(identity(wrapper, 'mgSvgAsset'));
    assert.strictEqual(descriptor.assetId, 'form-check-checkbox-checkmark');
    assert.strictEqual(descriptor.markup, markup);
    assert(/^fnv1a32-utf16:[0-9a-f]{8}$/.test(descriptor.hash));
    assert.strictEqual(wrapper.x, 2);
    assert.strictEqual(wrapper.y, 2);
    const vector = wrapper.children[0];
    assert.strictEqual(vector.strokeWeight, (2.5 * wrapper.width) / 16);
    assert.strictEqual(vector.strokeCap, 'ROUND');
    assert.strictEqual(vector.strokeJoin, 'ROUND');
    assert.strictEqual(vector.strokeAlign, 'CENTER');
    assert.deepStrictEqual(vector.vectorPaths, [
      { windingRule: 'NONZERO', data: 'M3.5 8l3 3 6-6' },
    ]);
    assert.strictEqual(vector.fills.length, 0);
    assert.deepStrictEqual(vector.strokes[0].color, { r: 1, g: 1, b: 1 });
    assert(
      first.createdNodeIds.includes(wrapper.id) &&
        first.createdNodeIds.includes(vector.id)
    );
  }
  assert(
    env.state.svgImportCalls.every(value =>
      value.includes('width="16" height="16"')
    )
  );
  const scaleCalls = env.state.svgScaleCalls.length;
  const second = await build(doc);
  assert.strictEqual(second.errors.length, 0, second.errors.join('\n'));
  assert.strictEqual(second.createdNodeIds.length, 0);
  assert.strictEqual(env.state.svgImportCalls.length, 3);
  assert.strictEqual(
    env.state.svgScaleCalls.length,
    scaleCalls,
    'Same-size SVG repeats compounded source stroke scaling'
  );
  assert(stableIds.every(id => second.updatedNodeIds.includes(id)));
  assert.deepStrictEqual(
    wrappers.map(node => ({
      id: node.id,
      width: node.width,
      height: node.height,
      x: node.x,
      y: node.y,
      vectorX: node.children[0].x,
      vectorY: node.children[0].y,
      strokeWeight: node.children[0].strokeWeight,
    })),
    geometric
  );
  console.log(
    'ok  exact source checkmark, intrinsic viewport, fractional rescale, stable wrapper/vector IDs and repeat stroke geometry'
  );

  const snapshot = () =>
    JSON.stringify({
      imports: env.state.svgImportCalls,
      scales: env.state.svgScaleCalls,
      nodes: [...env.state.nodes.values()].map(node => [
        node.id,
        node.parent?.id,
        node.width,
        node.height,
        node.name,
        node.removed,
      ]),
      styles: env.state.styles.map(style => [style.id, style.name]),
    });
  for (const mutate of [
    tree => {
      tree.children = [];
    },
    tree => {
      tree.layout.width = 'FILL';
    },
    tree => {
      tree.layout.mode = 'HORIZONTAL';
    },
    tree => {
      tree.layout.height = 8;
    },
    tree => {
      tree.position.x = NaN;
    },
    tree => {
      tree.fill = 'color/white';
    },
    tree => {
      tree.bindings = { width: 'font-size/300' };
    },
    tree => {
      tree.svg.markup = markup.replace('</svg>', '</g>');
    },
    tree => {
      tree.svg.markup = markup.replace("stroke='#fff'", "stroke='&oops;' ");
    },
    tree => {
      tree.svg.markup = markup.replace('6-6', '7-6');
    },
    tree => {
      tree.svg.assetId = 'changed';
    },
  ]) {
    const bad = copy(doc);
    mutate(bad.components.families[0].variants[0].tree.children[0]);
    const before = snapshot();
    const failed = await build(bad);
    assert(failed.errors.length && !failed.families.length);
    assert.strictEqual(
      snapshot(),
      before,
      'SVG preflight changed canvas/style state'
    );
  }
  const child = wrappers[0].children[0];
  child.type = 'RECTANGLE';
  const before = snapshot();
  const drift = await build(doc);
  assert(
    drift.errors.some(error =>
      error.includes('Explicit SVG migration required')
    )
  );
  assert.strictEqual(snapshot(), before);
  child.type = 'VECTOR';
  const paths = child.vectorPaths;
  child.vectorPaths = [{ windingRule: 'NONZERO', data: 'M0 0L16 16' }];
  const edited = await build(doc);
  assert(
    edited.errors.some(error =>
      error.includes('Explicit SVG migration required')
    )
  );
  child.vectorPaths = paths;
  const weight = child.strokeWeight;
  child.strokeWeight += 1;
  const restroked = await build(doc);
  assert(
    restroked.errors.some(error =>
      error.includes('Explicit SVG migration required')
    )
  );
  child.strokeWeight = weight;
  console.log(
    'ok  SVG malformed fields/XML, changed source/identity and native path/stroke/topology drift reject before style/canvas writes'
  );

  for (const [option, value, expected] of [
    [
      'svgImportFailure',
      'Injected native SVG failure',
      'Injected native SVG failure',
    ],
    ['svgTrimViewport', true, 'did not preserve the explicit viewBox viewport'],
  ]) {
    const failedEnv = svgEnvironment(doc);
    await require('./mock-kit.cjs').importFoundation(failedEnv, doc);
    failedEnv.state[option] = value;
    const failed = await failedEnv.call(
      'buildMangroveComponents',
      doc,
      'undrr',
      ['svg-fixture']
    );
    assert(failed.errors.some(error => error.includes(expected)));
    assert(!failed.families.length);
    assert(
      ![...failedEnv.state.nodes.values()].some(
        node => !node.removed && identity(node, 'mgSvgAsset')
      ),
      'Failed SVG import retained construction vectors'
    );
  }
  console.log(
    'ok  native SVG importer string failures and trimmed viewports are reported without accepting a broken family'
  );

  const translucent = markup
    .replace('<svg ', '<svg opacity="0.8" ')
    .replace("stroke='#fff'", "stroke='#fff' stroke-opacity='0.6'");
  const boundDoc = fixtureDocument(source, translucent);
  for (const variant of boundDoc.components.families[0].variants)
    variant.tree.children[0].svg.monochrome = { strokes: 'color/white' };
  const boundEnv = svgEnvironment(boundDoc);
  await require('./mock-kit.cjs').importFoundation(boundEnv, boundDoc);
  const bound = await boundEnv.call(
    'buildMangroveComponents',
    boundDoc,
    'undrr',
    ['svg-fixture']
  );
  assert.strictEqual(bound.errors.length, 0, bound.errors.join('\n'));
  for (const wrapper of [...boundEnv.state.nodes.values()].filter(
    node => identity(node, 'mgSvgAsset') && node.parent?.type === 'COMPONENT'
  )) {
    assert.strictEqual(wrapper.opacity, 0.8);
    assert.strictEqual(wrapper.children[0].strokes[0].opacity, 0.6);
    assert(wrapper.children[0].strokes[0].boundVariables.color);
  }
  const multicolour = markup.replace(
    '</svg>',
    "<path fill='none' stroke='red' d='M3.5 8l3 3 6-6'/></svg>"
  );
  const colourDoc = fixtureDocument(source, multicolour);
  const colourEnv = svgEnvironment(colourDoc);
  await require('./mock-kit.cjs').importFoundation(colourEnv, colourDoc);
  const colours = await colourEnv.call(
    'buildMangroveComponents',
    colourDoc,
    'undrr',
    ['svg-fixture']
  );
  assert.strictEqual(colours.errors.length, 0, colours.errors.join('\n'));
  const plainWrapper = [...colourEnv.state.nodes.values()].find(
    node => identity(node, 'mgSvgAsset') && node.parent?.type === 'COMPONENT'
  );
  assert.deepStrictEqual(
    plainWrapper.children.map(node => node.strokes[0].color),
    [
      { r: 1, g: 1, b: 1 },
      { r: 1, g: 0, b: 0 },
    ]
  );
  for (const variant of colourDoc.components.families[0].variants)
    variant.tree.children[0].svg.monochrome = { strokes: 'color/white' };
  const count = colourEnv.state.svgImportCalls.length;
  const recolour = await colourEnv.call(
    'buildMangroveComponents',
    colourDoc,
    'undrr',
    ['svg-fixture']
  );
  assert(
    recolour.errors.some(error =>
      error.includes('preserve multicolour assets unchanged')
    )
  );
  assert.strictEqual(colourEnv.state.svgImportCalls.length, count);
  console.log(
    'ok  explicit monochrome paint binding preserves source opacity; multicolour source remains unchanged and cannot be rebound wholesale'
  );
  const textDoc = copy(source);
  const textStyle = source.styles.text.find(
    spec => spec.recommended && spec.bindings.fontFamily === 'font-family/text'
  );
  textDoc.components = {
    version: 1,
    families: [
      {
        id: 'underline',
        name: 'Mangrove / Underline fixture',
        kind: 'component-set',
        review: { genericLabels: false },
        variants: [
          {
            id: 'underline.default',
            name: 'State=Default',
            properties: { State: 'Default' },
            tree: {
              type: 'FRAME',
              id: 'root',
              layout: { mode: 'VERTICAL', width: 280, height: 'HUG' },
              children: [
                {
                  type: 'TEXT',
                  id: 'link',
                  name: 'Error link',
                  textStyle: textStyle.id,
                  textDecoration: 'UNDERLINE',
                  characters: 'Enter a valid email address',
                  fill: 'color/red-900',
                  layout: { width: 'FILL', height: 'HUG' },
                },
              ],
            },
          },
        ],
      },
    ],
  };
  const textEnv = svgEnvironment(textDoc);
  await require('./mock-kit.cjs').importFoundation(textEnv, textDoc);
  const textBuild = document =>
    textEnv.call('buildMangroveComponents', document, 'undrr', ['underline']);
  const textFirst = await textBuild(textDoc);
  assert.strictEqual(textFirst.errors.length, 0, textFirst.errors.join('\n'));
  const link = [...textEnv.state.nodes.values()].find(
    node =>
      identity(node, 'mgKitId') ===
        'family/underline/variant/underline.default/link' &&
      node.parent?.type === 'COMPONENT'
  );
  assert.strictEqual(link.textDecoration, 'UNDERLINE');
  const textSnapshot = () =>
    JSON.stringify({
      nodes: [...textEnv.state.nodes.values()].map(node => [
        node.id,
        node.name,
        node.width,
        node.height,
        node.textDecoration,
      ]),
      styles: textEnv.state.styles.map(style => [
        style.id,
        style.name,
        style.description,
      ]),
    });
  for (const mutate of [
    tree => {
      tree.children[0].textDecoration = 'STRIKETHROUGH';
    },
    tree => {
      tree.textDecoration = 'UNDERLINE';
    },
  ]) {
    const bad = copy(textDoc);
    mutate(bad.components.families[0].variants[0].tree);
    const before = textSnapshot();
    const failed = await textBuild(bad);
    assert(
      failed.errors.some(error =>
        error.includes('Only TEXT recipes support textDecoration')
      )
    );
    assert.strictEqual(textSnapshot(), before);
  }
  delete textDoc.components.families[0].variants[0].tree.children[0]
    .textDecoration;
  const textRepeat = await textBuild(textDoc);
  assert.strictEqual(textRepeat.errors.length, 0, textRepeat.errors.join('\n'));
  assert.strictEqual(textRepeat.createdNodeIds.length, 0);
  assert.strictEqual(
    link.textDecoration,
    'NONE',
    'Repeat omitted decoration retained stale underline'
  );
  console.log(
    'ok  source TEXT underline, invalid/non-TEXT decorations before writes, repeat removes stale underline without replacing text IDs'
  );
}
module.exports = { installSvgMock, svgEnvironment };
if (require.main === module)
  main().catch(error => {
    console.error(`FAIL ${error.stack || error}`);
    process.exitCode = 1;
  });
