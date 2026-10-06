#!/usr/bin/env node
/** Source controls plus sized-SVG actual builder API fixtures, no native mode claim. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { environment } = require('./mock-kit.cjs');
const {
  installNativeTextPropertyDefaultFixture,
} = require('./mock-search-results.cjs');
const walk = n => [n, ...(n.children || []).flatMap(walk)];
function propertyState(env) {
  return JSON.stringify(
    [...env.state.nodes.values()]
      .filter(n => n.type === 'TEXT' || n.type === 'COMPONENT_SET')
      .map(n => [
        n.id,
        n.type,
        n.characters,
        n.componentPropertyReferences,
        n.type === 'COMPONENT_SET' ? n.componentPropertyDefinitions : null,
      ])
  );
}
function assertMasterSourceCopy(env, families) {
  for (const family of families)
    for (const variant of family.variants)
      for (const spec of walk(variant.tree))
        if (spec.textProperty) {
          const node = [...env.state.nodes.values()].find(
            n =>
              mainNode(n) &&
              n.type === 'TEXT' &&
              identity(n).includes('/variant/' + variant.id + '/') &&
              identity(n).endsWith('/' + spec.id)
          );
          assert(node, spec.id);
          assert.strictEqual(node.characters, spec.characters);
          let owner = node.parent;
          while (owner.type !== 'COMPONENT_SET') owner = owner.parent;
          assert.strictEqual(
            owner.componentPropertyDefinitions[
              node.componentPropertyReferences.characters
            ].defaultValue,
            spec.characters
          );
        }
}
const {
  buildSearchControlRecipes,
} = require('../../../scripts/figma-search-control-recipes.cjs');
const root = path.resolve(__dirname, '../../..');
const copy = x => JSON.parse(JSON.stringify(x));
const identity = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
const mainNode = n => {
  for (let parent = n.parent; parent; parent = parent.parent)
    if (parent.type === 'INSTANCE') return false;
  return true;
};
async function document() {
  const doc = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
  );
  const families = buildSearchControlRecipes({ root, ...doc });
  assert(Array.isArray(families), 'Source recipe factory must be synchronous');
  doc.components.families = families;
  return doc;
}
function installSearchControlSvgFixture(env, families) {
  const expected = new Map();
  function visit(t) {
    if (t.type === 'SVG') expected.set(t.svg.assetId, t.svg.markup);
    (t.children || []).forEach(visit);
  }
  families.forEach(f => f.variants.forEach(v => visit(v.tree)));
  const previous = env.figma.createNodeFromSvg.bind(env.figma);
  env.figma.createNodeFromSvg = markup => {
    const normalized = markup.replace(
      / width="(?:24|12)" height="(?:24|12)"/,
      ''
    );
    if (
      ![...expected.values()].some(
        m =>
          m.replace(/ width="(?:24|12)" height="(?:24|12)"/, '') === normalized
      )
    )
      return previous(markup);
    const size = Number(/viewBox="0 0 (\d+)/.exec(markup)[1]);
    const frame = env.figma.createFrame();
    frame.resize(size, size);
    frame.rescale = scale => {
      frame.resizeWithoutConstraints(frame.width * scale, frame.height * scale);
      // Modeled native rescale API only, not observed path/mode behavior.
      for (const c of frame.children) {
        c.resizeWithoutConstraints(c.width * scale, c.height * scale);
        c.strokeWeight *= scale;
      }
    };
    const vector = env.figma.createVector();
    vector.resize(size, size);
    vector.vectorPaths = [
      {
        windingRule: 'NONZERO',
        data:
          /<path d="([^"]+)"/.exec(markup)?.[1] ||
          'Exact source SVG fixture, no path rasterisation',
      },
    ];
    vector.fills = [];
    vector.strokes = [
      { type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 1, visible: true },
    ];
    vector.strokeWeight = 2;
    vector.strokeAlign = 'CENTER';
    vector.constraints = { horizontal: 'MIN', vertical: 'MIN' };
    frame.appendChild(vector);
    return frame;
  };
}
async function main() {
  const doc = await document();
  assert.deepStrictEqual(
    doc.components.families.map(f => [f.id, f.variants.length]),
    [
      ['search-form', 3],
      ['search-select', 7],
      ['search-active-filters', 3],
      ['search-facet-operator', 2],
    ]
  );
  for (const f of doc.components.families)
    for (const v of f.variants) {
      const ids = new Set();
      function visit(t) {
        assert(t.id && !ids.has(t.id), 'Unique explicit anatomy IDs');
        ids.add(t.id);
        if (t.textProperty && t.textProperty.startsWith(f.id + '.'))
          assert(
            t.textProperty.startsWith(v.id + ' '),
            'Stable authored-state property context'
          );
        if (t.type === 'TEXT')
          assert(
            typeof t.characters === 'string' && t.characters.length,
            'Source text must be present'
          );
        (t.children || []).forEach(visit);
      }
      visit(v.tree);
    }
  const first = copy({ variables: doc.variables, styles: doc.styles });
  await buildSearchControlRecipes({ root, ...doc });
  assert.deepStrictEqual(
    { variables: doc.variables, styles: doc.styles },
    first
  );
  const form = doc.components.families[0];
  const icon = form.variants[0].tree.children[1].children[0].children[0];
  assert.deepStrictEqual(icon.svg.sizing, {
    size: 'component/search-control/submit-icon-size',
    strokeWidth: 'component/search-control/submit-icon-stroke',
  });
  assert.strictEqual(
    doc.variables.find(v => v.name === icon.svg.sizing.strokeWidth).values
      .undrr,
    (2 * 14) / 24
  );
  assert.strictEqual(
    doc.variables.find(v => v.name === icon.svg.sizing.strokeWidth).values.mcr,
    (2 * 18) / 24
  );
  const supported = doc.components.families;
  const nativeDoc = {
    ...doc,
    components: { ...doc.components, families: supported },
  };
  for (const mode of doc.modes) {
    const env = environment(nativeDoc, { sharedOnly: true });
    installNativeTextPropertyDefaultFixture(env);
    await env.runCode(
      fs.readFileSync(path.join(__dirname, '../kit-svg-sizing.js'), 'utf8') +
        '\nObject.assign(globalThis,{mgSvgSizingPlan,mgSvgSizingDocumentValues,mgSvgSizingSourceValues,mgSvgSizingNativeValues,mgSvgSizingNativePlan,mgApplySvgSizing});'
    );
    installSearchControlSvgFixture(env, supported);
    await env.call('importVariables', nativeDoc, [mode.id], false, [], false);
    const firstBuild = await env.call(
      'buildMangroveComponents',
      nativeDoc,
      mode.id,
      supported.map(f => f.id)
    );
    assert.strictEqual(
      firstBuild.errors.length,
      0,
      firstBuild.errors.join('\n')
    );
    assert(firstBuild.createdNodeIds.length > 0);
    assertMasterSourceCopy(env, supported);
    const sizedIcons = [...env.state.nodes.values()].filter(
      n => identity(n)?.endsWith('.search-icon') && mainNode(n)
    );
    assert.strictEqual(sizedIcons.filter(n => n.type === 'FRAME').length, 3);
    for (const icon of sizedIcons.filter(n => n.type === 'FRAME')) {
      const expectedSize = mode.id === 'mcr' ? 18 : 14;
      assert.strictEqual(icon.width, expectedSize);
      assert.strictEqual(icon.height, expectedSize);
      assert(icon.boundVariables.width && icon.boundVariables.height);
      for (const vector of icon.children) {
        assert.strictEqual(vector.strokeWeight, (2 * expectedSize) / 24);
        assert(vector.boundVariables.strokeWeight);
        assert.deepStrictEqual(copy(vector.constraints), {
          horizontal: 'SCALE',
          vertical: 'SCALE',
        });
      }
    }
    const component = [...env.state.nodes.values()].find(
      n => n.type === 'COMPONENT' && identity(n)?.includes('search-select')
    );
    assert(component);
    const consumer = component.createInstance();
    const sourceLabel = component
      .findAllWithCriteria({ types: ['TEXT'] })
      .find(n =>
        n.componentPropertyReferences?.characters
          ?.replace(/#.*$/, '')
          .endsWith(' Selection label')
      );
    assert(sourceLabel);
    const property = sourceLabel.componentPropertyReferences.characters;
    assert(property in consumer.componentProperties);
    consumer.setProperties({ [property]: 'Edited source label' });
    const editedConsumers = [...env.state.nodes.values()]
      .filter(n => n.type === 'COMPONENT' && mainNode(n))
      .map(main => {
        const instance = main.createInstance();
        const fields = [
          ...new Set(
            instance
              .findAllWithCriteria({ types: ['TEXT'] })
              .map(n => n.componentPropertyReferences?.characters)
              .filter(Boolean)
          ),
        ];
        for (const node of instance.findAllWithCriteria({ types: ['TEXT'] })) {
          const key = node.componentPropertyReferences?.characters;
          if (!key) continue;
          Object.defineProperty(node, 'characters', {
            configurable: true,
            get() {
              return instance.componentProperties[key].value;
            },
          });
        }
        for (const key of fields) instance.setProperties({ [key]: 'Edited' });
        return { instance, fields };
      });
    assert(editedConsumers.some(item => item.fields.length));
    const propertiesBefore = propertyState(env);
    const recorded = [...env.state.nodes.values()]
      .filter(identity)
      .map(n => [identity(n), n.id])
      .sort();
    for (let repeat = 0; repeat < 2; repeat++) {
      const result = await env.call(
        'buildMangroveComponents',
        nativeDoc,
        mode.id,
        supported.map(f => f.id)
      );
      assert.strictEqual(result.errors.length, 0, result.errors.join('\n'));
      assert.strictEqual(result.createdNodeIds.length, 0);
      assertMasterSourceCopy(env, supported);
      assert.strictEqual(propertyState(env), propertiesBefore);
      assert.deepStrictEqual(
        [...env.state.nodes.values()]
          .filter(identity)
          .map(n => [identity(n), n.id])
          .sort(),
        recorded
      );
      for (const { instance, fields } of editedConsumers) {
        assert(
          instance
            .findAllWithCriteria({ types: ['TEXT'] })
            .filter(n => n.componentPropertyReferences?.characters)
            .every(n => n.characters === 'Edited')
        );
        assert(
          fields.every(
            key => instance.componentProperties[key].value === 'Edited'
          )
        );
      }
      assert.strictEqual(
        consumer.componentProperties[property].value,
        'Edited source label'
      );
    }
  }
  const helperSource =
    fs.readFileSync(path.join(__dirname, '../kit-svg-sizing.js'), 'utf8') +
    '\nObject.assign(globalThis,{mgSvgSizingPlan,mgSvgSizingDocumentValues,mgSvgSizingSourceValues,mgSvgSizingNativeValues,mgSvgSizingNativePlan,mgApplySvgSizing});';
  // Structural scan is not a native acceptance claim: the observed-native fixture
  // demonstrates why the legacy Empty/Query property default cannot be shared.
  const legacy = copy(nativeDoc);
  legacy.components.families = legacy.components.families.filter(
    f => f.id === 'search-form'
  );
  legacy.components.families[0].variants =
    legacy.components.families[0].variants.filter(v =>
      ['search-form.empty', 'search-form.query'].includes(v.id)
    );
  for (const variant of legacy.components.families[0].variants)
    for (const spec of walk(variant.tree))
      if (spec.textProperty)
        spec.textProperty = spec.textProperty.slice(variant.id.length + 1);
  const legacyEnv = environment(legacy, { sharedOnly: true });
  installNativeTextPropertyDefaultFixture(legacyEnv);
  await legacyEnv.runCode(helperSource);
  installSearchControlSvgFixture(legacyEnv, legacy.components.families);
  await legacyEnv.call('importVariables', legacy, ['undrr'], false, [], false);
  for (let i = 0; i < 2; i++) {
    const result = await legacyEnv.call(
      'buildMangroveComponents',
      legacy,
      'undrr',
      ['search-form']
    );
    assert.deepStrictEqual(copy(result.errors), []);
  }
  assert.throws(
    () => assertMasterSourceCopy(legacyEnv, legacy.components.families),
    /strictly equal/
  );
  const recordedState = env =>
    JSON.stringify({
      nodes: [...env.state.nodes.values()].map(n => [
        n.id,
        identity(n),
        n.width,
        n.height,
        n.strokeWeight,
        n.boundVariables,
        n.constraints,
      ]),
      styles: env.state.styles.map(s => [s.id, s.name, s.fontName, s.fontSize]),
    });
  for (const mutate of [
    d => {
      d.variables.find(
        v => v.name === icon.svg.sizing.strokeWidth
      ).values.delta = 99;
    },
    d => {
      d.variables.find(v => v.name === icon.svg.sizing.size).values.delta = {
        alias: icon.svg.sizing.size,
      };
    },
    d => {
      d.components.families[0].variants[0].tree.children[1].children[0].children[0].svg.sizing.extra =
        'invalid';
    },
  ]) {
    const invalid = copy(doc);
    mutate(invalid);
    const env = environment(invalid, { sharedOnly: true });
    await env.runCode(helperSource);
    installSearchControlSvgFixture(env, supported);
    await env.call('importVariables', doc, ['undrr'], false, [], false);
    const before = recordedState(env);
    const report = await env.call(
      'buildMangroveComponents',
      invalid,
      'undrr',
      supported.map(f => f.id)
    );
    assert(report.errors.length);
    assert.strictEqual(
      recordedState(env),
      before,
      'Invalid sized SVG closure mutated styles or nodes'
    );
  }
  const editedEnv = environment(doc, { sharedOnly: true });
  editedEnv.state.modeLimit = 5;
  await editedEnv.runCode(helperSource);
  installSearchControlSvgFixture(editedEnv, supported);
  await editedEnv.call(
    'importVariables',
    doc,
    doc.modes.map(m => m.id),
    false,
    [],
    false
  );
  const editedBuild = await editedEnv.call(
    'buildMangroveComponents',
    doc,
    'undrr',
    supported.map(f => f.id)
  );
  assert.strictEqual(
    editedBuild.errors.length,
    0,
    editedBuild.errors.join('\n')
  );
  const editedIcon = [...editedEnv.state.nodes.values()].find(
    n => identity(n)?.endsWith('.search-icon') && mainNode(n)
  );
  editedIcon.children[0].constraints = { horizontal: 'MIN', vertical: 'SCALE' };
  const constraintsBefore = recordedState(editedEnv);
  const constraintsReport = await editedEnv.call(
    'buildMangroveComponents',
    doc,
    'undrr',
    supported.map(f => f.id)
  );
  assert(
    constraintsReport.errors.some(error =>
      error.includes('managed bindings or constraints changed')
    )
  );
  assert.strictEqual(recordedState(editedEnv), constraintsBefore);
  editedIcon.children[0].constraints = {
    horizontal: 'SCALE',
    vertical: 'SCALE',
  };
  editedIcon.children[0].strokeWeight = 7;
  let editedBefore = recordedState(editedEnv);
  const editedReport = await editedEnv.call(
    'buildMangroveComponents',
    doc,
    'undrr',
    supported.map(f => f.id)
  );
  assert(
    editedReport.errors.some(error =>
      error.includes('geometry/topology changed')
    )
  );
  assert.strictEqual(
    recordedState(editedEnv),
    editedBefore,
    'Existing authored SVG edit was overwritten'
  );
  editedIcon.children[0].strokeWeight = (2 * 14) / 24;
  const nativeStroke = editedEnv.state.variables.find(
    v => v.name === icon.svg.sizing.strokeWidth
  );
  const deltaMode = editedEnv.state.collections[0].modes.find(
    m => m.name === doc.modes.find(m => m.id === 'delta').name
  );
  nativeStroke.valuesByMode[deltaMode.modeId] = 99;
  editedBefore = recordedState(editedEnv);
  const wrongModeReport = await editedEnv.call(
    'buildMangroveComponents',
    doc,
    'undrr',
    supported.map(f => f.id)
  );
  assert(
    wrongModeReport.errors.some(error =>
      error.includes('native values disagree')
    )
  );
  assert.strictEqual(
    recordedState(editedEnv),
    editedBefore,
    'Wrong nonselected native mode allowed mutation'
  );
  const {
    buildConnector,
  } = require('../../../scripts/build-figma-connector.cjs');
  const invalidCompile = copy(doc);
  invalidCompile.variables.find(
    v => v.name === icon.svg.sizing.strokeWidth
  ).values.delta = 99;
  await assert.rejects(
    () =>
      buildConnector({
        doc: invalidCompile,
        operation: 'build',
        brandId: 'undrr',
        familyIds: ['search-form'],
      }),
    /source values disagree/
  );
  const compileEvidence = [];
  for (const mode of doc.modes) {
    let payload;
    try {
      payload = await buildConnector({
        doc,
        operation: 'build',
        brandId: mode.id,
        familyIds: ['search-form'],
        variantIds: [form.variants[0].id],
      });
    } catch (error) {
      assert(/payload exceeds 50000/.test(error.message));
      compileEvidence.push({
        brand: mode.id,
        gate: '50000-byte-transport',
        reason: error.message,
      });
      continue;
    }
    assert(payload.characters <= 50000);
    const env = environment(doc, { sharedOnly: true });
    installSearchControlSvgFixture(env, supported);
    await env.call('importVariables', doc, [mode.id], false, [], false);
    const report = await env.runCode(payload.code);
    assert.strictEqual(report.errors.length, 0, report.errors.join('\n'));
    const repeat = await env.runCode(payload.code);
    assert.strictEqual(repeat.errors.length, 0, repeat.errors.join('\n'));
    assert.strictEqual(repeat.createdNodeIds.length, 0);
    compileEvidence.push({
      brand: mode.id,
      bytes: payload.bytes,
      offlineCompiledRepeat: true,
    });
  }
  console.log(
    'Search Form compiler evidence:',
    JSON.stringify(compileEvidence)
  );
  const broken = copy(doc);
  broken.variables.find(v => v.name === 'color/text').type = 'FLOAT';
  assert.throws(
    () => buildSearchControlRecipes({ root, ...broken }),
    /wrong-type/
  );
  const collision = copy(doc);
  collision.styles.text.find(
    s => s.id === 'component/search-control/trigger'
  ).id = 'foreign.trigger';
  assert.throws(
    () => buildSearchControlRecipes({ root, ...collision }),
    /Foreign identity/
  );
  const cyclic = copy(doc);
  cyclic.variables.find(v => v.name === 'color/text').values.undrr = {
    alias: 'color/text',
  };
  assert.throws(() => buildSearchControlRecipes({ root, ...cyclic }), /cyclic/);
  const geometry = copy(doc);
  geometry.variables.find(v => v.name === 'font-size/200').values.undrr = 13;
  assert.throws(
    () => buildSearchControlRecipes({ root, ...geometry }),
    /remeasurement/
  );
  const read = fs.readFileSync;
  let touched = false;
  fs.readFileSync = function (file, ...args) {
    const data = read.call(this, file, ...args);
    if (
      typeof file === 'string' &&
      file.endsWith('components/SelectDropdown.jsx')
    ) {
      touched = true;
      return Buffer.isBuffer(data)
        ? Buffer.concat([data, Buffer.from('\n// deliberate drift')])
        : data + '\n// deliberate drift';
    }
    return data;
  };
  try {
    await assert.rejects(document, /source contract needs updating/);
    assert(touched);
  } finally {
    fs.readFileSync = read;
  }
  const missing = copy(nativeDoc),
    env = environment(missing, { sharedOnly: true });
  installSearchControlSvgFixture(env, supported);
  await env.call('importVariables', missing, ['undrr'], false, [], false);
  env.figma.loadFontAsync = async () => {
    throw new Error('Missing source font');
  };
  const before = {
    nodes: env.state.nodes.size,
    styles: env.state.styles.length,
  };
  const refused = await env.call(
    'buildMangroveComponents',
    missing,
    'undrr',
    supported.map(f => f.id)
  );
  assert(refused.errors.length);
  assert.deepStrictEqual(
    { nodes: env.state.nodes.size, styles: env.state.styles.length },
    before
  );
  console.log(
    'Search controls: all15 source variants across five brands, sized SVG bindings, two zero-create repeats and editable text pass. Actual native mode/path/stroke acceptance remains pending.'
  );
}
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { main, installSearchControlSvgFixture };
