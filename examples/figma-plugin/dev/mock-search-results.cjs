#!/usr/bin/env node
/** Actual builder source-only lifecycle. No native text/raster simulation. */
'use strict';
const assert = require('assert'),
  fs = require('fs'),
  path = require('path'),
  os = require('os'),
  crypto = require('crypto');
const { environment } = require('./mock-kit.cjs');
const {
  buildFigmaVariables,
} = require('../../../scripts/build-figma-tokens.cjs');
const {
  buildSearchResultRecipes,
  buildSearchResultFixtures,
  SOURCE_HASHES,
} = require('../../../scripts/figma-search-result-recipes.cjs');
const root = path.resolve(__dirname, '../../..'),
  copy = x => JSON.parse(JSON.stringify(x));
const identity = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
const walk = n => [n, ...(n.children || []).flatMap(walk)];
/** Models the observed native master TEXT setter's set-wide property default propagation. */
function installNativeTextPropertyDefaultFixture(env) {
  const create = env.figma.createText.bind(env.figma),
    originals = new WeakMap();
  const original = node => {
    if (originals.has(node)) return originals.get(node);
    let object = node,
      descriptor;
    while (object && !descriptor) {
      descriptor = Object.getOwnPropertyDescriptor(object, 'characters');
      object = Object.getPrototypeOf(object);
    }
    if (!descriptor?.get || !descriptor?.set)
      throw Error('Native default fixture requires a TEXT accessor');
    originals.set(node, descriptor);
    return descriptor;
  };
  const owner = node => {
    const seen = new Set();
    while (node && !seen.has(node)) {
      seen.add(node);
      if (node.type === 'COMPONENT_SET') return node;
      if (node.type === 'INSTANCE') {
        const main = node.mainComponent || node.main;
        if (main) {
          node = main;
          continue;
        }
      }
      node = node.parent;
    }
    return null;
  };
  env.figma.createText = () => {
    const node = create(),
      descriptor = original(node);
    Object.defineProperty(node, 'characters', {
      configurable: true,
      get() {
        return descriptor.get.call(this);
      },
      set(value) {
        descriptor.set.call(this, value);
        // Editing instance TEXT must not change the master's shared default.
        for (let ancestor = this.parent; ancestor; ancestor = ancestor.parent)
          if (ancestor.type === 'INSTANCE') return;
        const reference = this.componentPropertyReferences?.characters,
          set = owner(this);
        if (!reference || !set?._definitions[reference]) return;
        set._definitions[reference].defaultValue = value;
        for (const target of env.state.nodes.values()) {
          if (
            target === this ||
            target.type !== 'TEXT' ||
            target.componentPropertyReferences?.characters !== reference ||
            owner(target) !== set
          )
            continue;
          let parent = target.parent,
            overridden = false;
          while (parent) {
            if (
              parent.type === 'INSTANCE' &&
              Object.hasOwn(parent.overrides, reference)
            )
              overridden = true;
            parent = parent.parent;
          }
          // Each rich accessor may close over its own node and formatting cells.
          // Never apply the originating node's descriptor to a different target.
          if (!overridden) original(target).set.call(target, value);
        }
      },
    });
    return node;
  };
}
function document() {
  const doc = buildFigmaVariables();
  doc.components.families = buildSearchResultRecipes({ root, ...doc });
  return doc;
}
function resolve(doc, name, mode, seen = new Set()) {
  assert(!seen.has(name));
  seen.add(name);
  const v = doc.variables.find(v => v.name === name);
  assert(v);
  const x = v.values[mode];
  return x?.alias ? resolve(doc, x.alias, mode, seen) : x;
}
const snapshot = env =>
  JSON.stringify({
    nodes: [...env.state.nodes.values()].map(n => [
      n.id,
      n.parent?.id,
      n.type,
      n.x,
      n.y,
      n.width,
      n.height,
      n.layoutMode,
      n.layoutSizingHorizontal,
      n.layoutSizingVertical,
      n.type === 'TEXT'
        ? [
            n.characters,
            n.fontName,
            n.fontSize,
            n.textStyleId,
            n.textAutoResize,
            n.componentPropertyReferences,
          ]
        : null,
      n.explicitVariableModes,
      n.boundVariables,
      n.opacity,
      n.type === 'INSTANCE' ? n.componentProperties : null,
      n.type === 'COMPONENT_SET' ? n.componentPropertyDefinitions : null,
    ]),
    styles: env.state.styles,
    images: [...env.state.images].map(([hash, bytes]) => [hash, bytes.length]),
  });
async function main() {
  const doc = document();
  assert.deepStrictEqual(copy(doc), copy(document()));
  assert.deepStrictEqual(
    doc.components.families.map(f => [f.id, f.variants.length]),
    [
      ['search-result-item', 42],
      ['search-result-fields', 14],
      ['search-result-state', 20],
    ]
  );
  const foundations = copy({ variables: doc.variables, styles: doc.styles });
  assert.deepStrictEqual(
    buildSearchResultRecipes({ root, ...doc }),
    doc.components.families
  );
  assert.deepStrictEqual(
    copy({ variables: doc.variables, styles: doc.styles }),
    foundations
  );
  const fixture = buildSearchResultFixtures({ root });
  assert.strictEqual(
    fixture.original.hits.authoredTeaser._source.teaser.includes('/image.jpg'),
    true
  );
  assert(
    fixture.imageHit._source.teaser.includes('Financing resilient cities')
  );
  assert(
    fixture.imageHit._source.teaser.includes(
      '/styles/por/public/2022-08/Bali.JPG.jpg'
    )
  );
  assert.strictEqual(fixture.provenance.responseCaptured, false);
  for (const family of doc.components.families) {
    const properties = new Map();
    for (const variant of family.variants)
      for (const spec of walk(variant.tree))
        if (spec.textProperty) {
          assert(
            spec.textProperty.startsWith(
              'Text ' +
                variant.id
                  .slice(family.id.length + 1)
                  .replace(/\.(390|1164)$/, '/$1') +
                ' '
            )
          );
          if (properties.has(spec.textProperty))
            assert.strictEqual(
              properties.get(spec.textProperty),
              spec.characters,
              'Different fragments cannot share a set-wide default'
            );
          properties.set(spec.textProperty, spec.characters);
        }
  }
  for (const family of doc.components.families)
    for (const variant of family.variants) {
      const ids = walk(variant.tree).map(n => n.id);
      assert.strictEqual(ids.length, new Set(ids).size);
      for (const mode of doc.modes) {
        assert.strictEqual(
          resolve(doc, variant.tree.layout.width, mode.id),
          Number(variant.properties.Viewport) - 32
        );
        for (const n of walk(variant.tree)) {
          if (n.position) {
            assert(Number.isFinite(n.position.x));
            assert(Number.isFinite(n.position.y));
          }
          if (n.type === 'FRAME')
            for (const field of ['width', 'height']) {
              const value = n.layout[field];
              assert(
                (typeof value === 'string'
                  ? resolve(doc, value, mode.id)
                  : value) > 0
              );
            }
        }
      }
    }
  // Cross-check editable line allocations against independently archived DOM ranges.
  const footprints = JSON.parse(
    fs.readFileSync(
      path.join(
        root,
        'examples/figma-plugin/holistic/assets/search-results/source-footprints.json'
      )
    )
  );
  assert.strictEqual(footprints.sourceContracts.length, 38);
  assert.strictEqual(footprints.captures.length, 10);
  let wrappedSegments = 0;
  for (const capture of footprints.captures) {
    assert.strictEqual(capture.scenes.length, 38);
    for (const scene of capture.scenes) {
      const variant = doc.components.families
        .flatMap(f => f.variants)
        .find(v => v.id.endsWith(scene.id + '.' + capture.viewport));
      assert(variant, scene.id);
      for (const index of scene.nodes) {
        const owner = footprints.nodes[index];
        const ownerSpec = walk(variant.tree).find(
          n => n.id === owner.id.replaceAll('/', '-')
        );
        assert(ownerSpec, owner.id);
        const cssOpacity = Number(footprints.styles[owner.styles].opacity);
        assert(
          Number.isFinite(cssOpacity) && cssOpacity >= 0 && cssOpacity <= 1
        );
        assert.strictEqual(
          resolve(doc, ownerSpec.bindings.opacity, capture.brand),
          cssOpacity * 100,
          'CSS opacity must become a percentage variable'
        );
        for (const text of owner.texts) {
          if (text.lines.length > 1) wrappedSegments++;
          assert.strictEqual(text.lines.map(l => l.text).join(''), text.text);
          let end = 0;
          for (const [lineIndex, line] of text.lines.entries()) {
            assert.strictEqual(line.start, end);
            assert.strictEqual(
              line.text,
              text.text.slice(line.start, line.end)
            );
            end = line.end;
            if (!line.text.trim() || !(line.rect.width > 0)) continue;
            const id =
              owner.id.replaceAll('/', '-') +
              '-' +
              text.id +
              '-line-' +
              lineIndex;
            const slot = walk(variant.tree).find(n => n.id === id + '-slot');
            assert(slot, id);
            assert.strictEqual(slot.position.x, line.rect.x);
            assert.strictEqual(slot.position.y, line.rect.y);
            assert.strictEqual(slot.layout.width, line.rect.width);
            assert.strictEqual(slot.children[0].characters, line.text);
          }
          assert.strictEqual(end, text.text.length);
        }
      }
    }
  }
  assert(wrappedSegments > 0);
  const ids = doc.components.families.map(f => f.id);
  for (const mode of doc.modes) {
    const env = environment(doc, { sharedOnly: true });
    installNativeTextPropertyDefaultFixture(env);
    env.state.modeLimit = 5;
    const imported = await env.call(
      'importVariables',
      doc,
      doc.modes.map(m => m.id),
      false,
      [],
      false
    );
    assert.strictEqual(imported.errors.length, 0);
    const build = () => env.call('buildMangroveComponents', doc, mode.id, ids);
    const first = await build();
    assert.deepStrictEqual(copy(first.errors), []);
    for (const family of doc.components.families)
      for (const variant of family.variants) {
        function inspect(spec, key) {
          const n = [...env.state.nodes.values()].find(
            n => identity(n) === key
          );
          assert(n, key);
          if (spec.textProperty) {
            assert.strictEqual(
              n.characters,
              spec.characters,
              'Each master fragment retains source copy'
            );
            let owner = n.parent;
            while (owner.type !== 'COMPONENT_SET') owner = owner.parent;
            const reference = n.componentPropertyReferences.characters;
            assert.strictEqual(
              owner.componentPropertyDefinitions[reference].defaultValue,
              spec.characters,
              'Native set-wide default matches the fragment context'
            );
          }
          if (spec.type === 'FRAME') {
            if (spec.bindings?.opacity) {
              const value = resolve(doc, spec.bindings.opacity, mode.id);
              const capture = footprints.captures.find(
                c =>
                  c.brand === mode.id &&
                  c.viewport === Number(variant.properties.Viewport)
              );
              const scene = capture.scenes.find(s =>
                variant.id.endsWith(s.id + '.' + capture.viewport)
              );
              const record = scene.nodes
                .map(i => footprints.nodes[i])
                .find(n => n.id.replaceAll('/', '-') === spec.id);
              assert(record, spec.id);
              const sourceOpacity = Number(
                footprints.styles[record.styles].opacity
              );
              assert.strictEqual(
                value,
                sourceOpacity * 100,
                'Source CSS alpha must use percentage binding units'
              );
              assert.strictEqual(
                n.opacity,
                sourceOpacity,
                'Actual builder plus native-percentage mock must preserve source opacity'
              );
            }
            for (const field of ['width', 'height']) {
              const v = spec.layout[field];
              assert.strictEqual(
                n[field],
                typeof v === 'string' ? resolve(doc, v, mode.id) : v,
                key + '/' + field
              );
            }
            if (spec.position) {
              assert.strictEqual(n.x, spec.position.x, key + '/x');
              assert.strictEqual(n.y, spec.position.y, key + '/y');
            }
          }
          for (const child of spec.children || [])
            inspect(child, key + '/' + child.id);
        }
        inspect(variant.tree, 'family/' + family.id + '/variant/' + variant.id);
      }
    assert.strictEqual(env.state.images.size, 2);
    for (const [hash, bytes] of env.state.images)
      assert.strictEqual(
        crypto.createHash('sha256').update(bytes).digest('hex'),
        hash
      );
    const family = doc.components.families[0],
      variant = family.variants.find(v =>
        v.id.includes('authoredFallback-list.390')
      );
    const master = [...env.state.nodes.values()].find(
      n => identity(n) === 'family/' + family.id + '/variant/' + variant.id
    );
    const consumer = master.createInstance();
    env.figma.currentPage.appendChild(consumer);
    consumer.x = 1980;
    consumer.y = 1730;
    const titleNode = master
      .findAllWithCriteria({ types: ['TEXT'] })
      .find(
        n =>
          n.characters === 'Climate Change Report' &&
          n.componentPropertyReferences?.characters
      );
    assert(
      titleNode,
      'Edited property must belong to this actual source variant'
    );
    const property = titleNode.componentPropertyReferences.characters;
    assert.strictEqual(
      consumer.componentProperties[property].value,
      'Climate Change Report'
    );
    const linkedTitle = consumer
      .findAllWithCriteria({ types: ['TEXT'] })
      .find(n => n.componentPropertyReferences?.characters === property);
    assert(linkedTitle);
    // Model instance TEXT inheritance through its actual referenced property, not an unrelated set property.
    const descriptor = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(linkedTitle),
      'characters'
    );
    Object.defineProperty(linkedTitle, 'characters', {
      configurable: true,
      get() {
        return consumer.componentProperties[property].value;
      },
      set(value) {
        descriptor.set.call(this, value);
      },
    });
    consumer.setProperties({ [property]: 'Edited source result title' });
    assert.strictEqual(linkedTitle.characters, 'Edited source result title');
    const main = consumer.main.id,
      before = snapshot(env);
    for (let i = 0; i < 2; i++) {
      const repeat = await build();
      assert.deepStrictEqual(copy(repeat.errors), []);
      assert.strictEqual(repeat.createdNodeIds.length, 0);
      assert.strictEqual(snapshot(env), before);
      assert.strictEqual(consumer.main.id, main);
      assert.strictEqual(linkedTitle.characters, 'Edited source result title');
      assert.strictEqual(
        consumer.componentProperties[property].value,
        'Edited source result title'
      );
    }
    console.log(
      mode.id +
        ': all76 source result variants, source FRAME allocations, two zero-create recorded scene repeats and edited linked consumer retained'
    );
  }
  for (const mutate of [
    d => (d.variables.find(v => v.name === 'spacing/50').values.mcr = 6),
    d =>
      (d.variables.find(v => v.name === 'color/interactive').values.mcr = {
        r: 1,
        g: 0,
        b: 0,
        a: 1,
      }),
    d =>
      (d.variables.find(v => v.name === 'font-family/text').values.irp =
        'Inter'),
    d => (d.variables.find(v => v.name === 'font-size/200').values.delta = 13),
    d => (d.variables.find(v => v.name === 'font-size/200').id = 'foreign'),
    d =>
      (d.variables.find(v => v.name === 'color/text').values.undrr = {
        alias: 'color/text',
      }),
  ]) {
    const d = buildFigmaVariables();
    mutate(d);
    const before = copy({ variables: d.variables, styles: d.styles });
    assert.throws(
      () => buildSearchResultRecipes({ root, ...d }),
      /needs updating/
    );
    assert.deepStrictEqual(
      copy({ variables: d.variables, styles: d.styles }),
      before
    );
  }
  // The old generic DOM-path property name reproduces the demonstrated native repeat collision.
  const collided = copy(doc);
  collided.components.families = collided.components.families.filter(
    f => f.id === 'search-result-state'
  );
  const state = collided.components.families[0];
  state.variants = state.variants.filter(v =>
    ['state-queryEmpty-list.390', 'state-error-list.390'].some(id =>
      v.id.endsWith(id)
    )
  );
  for (const variant of state.variants)
    for (const spec of walk(variant.tree))
      if (spec.textProperty)
        spec.textProperty = spec.textProperty.replace(/^Text [^ ]+ /, 'Text ');
  const collisionEnv = environment(collided, { sharedOnly: true });
  installNativeTextPropertyDefaultFixture(collisionEnv);
  collisionEnv.state.modeLimit = 5;
  await collisionEnv.call(
    'importVariables',
    collided,
    ['undrr'],
    false,
    [],
    false
  );
  for (let i = 0; i < 2; i++)
    assert.deepStrictEqual(
      copy(
        (
          await collisionEnv.call(
            'buildMangroveComponents',
            collided,
            'undrr',
            ['search-result-state']
          )
        ).errors
      ),
      []
    );
  const query = state.variants.find(v => v.id.includes('queryEmpty'));
  const querySpec = walk(query.tree).find(n =>
    n.characters?.startsWith('Try different search terms')
  );
  const queryNative = [...collisionEnv.state.nodes.values()].find(
    n =>
      identity(n).includes('/variant/' + query.id + '/') &&
      identity(n).endsWith('/' + querySpec.id)
  );
  assert(queryNative);
  assert.notStrictEqual(
    queryNative.characters,
    querySpec.characters,
    'Old names must reproduce native property propagation drift'
  );
  assert.strictEqual(
    queryNative.characters,
    'Please try again or use different search terms.'
  );
  const collision = document(),
    v = collision.variables.find(v =>
      v.name.startsWith('component/search-result/')
    );
  v.id = 'foreign';
  assert.throws(
    () => buildSearchResultRecipes({ root, ...collision }),
    /Foreign identity/
  );
  const styleCollision = document();
  styleCollision.styles.text.find(s =>
    s.id.startsWith('component/search-result/')
  ).name = 'Foreign';
  assert.throws(
    () => buildSearchResultRecipes({ root, ...styleCollision }),
    /Foreign identity/
  );
  const noFonts = environment(doc, {
    sharedOnly: true,
    rejectedFonts: [
      'Roboto Bold',
      'Roboto Regular',
      'Roboto Condensed Regular',
    ],
  });
  await noFonts.call('importVariables', doc, ['undrr'], false, [], false);
  const fontBefore = snapshot(noFonts),
    r = await noFonts.call('buildMangroveComponents', doc, 'undrr', ids);
  assert(r.errors.length);
  assert.strictEqual(snapshot(noFonts), fontBefore);
  const duplicate = copy(doc);
  duplicate.components.families[0].variants[0].tree.children[0].id = 'root';
  const env = environment(duplicate, { sharedOnly: true });
  await env.call('importVariables', duplicate, ['undrr'], false, [], false);
  const before = snapshot(env),
    blocked = await env.call('buildMangroveComponents', duplicate, 'undrr', [
      ids[0],
    ]);
  assert(blocked.errors.length);
  assert.strictEqual(snapshot(env), before);
  const tmp = fs.mkdtempSync(
    path.join(os.tmpdir(), 'mangrove-search-result-guards-')
  );
  try {
    const required = {
      ...require('../../../scripts/figma-search-fixtures.cjs').SOURCE_HASHES,
      ...SOURCE_HASHES,
    };
    for (const file of Object.keys(required)) {
      const dest = path.join(tmp, file);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(path.join(root, file), dest);
    }
    for (const file of Object.keys(SOURCE_HASHES)) {
      const dest = path.join(tmp, file),
        bytes = fs.readFileSync(dest);
      fs.appendFileSync(dest, '\nsource mutation');
      assert.throws(
        () => buildSearchResultRecipes({ root: tmp, ...buildFigmaVariables() }),
        /source contract needs updating/
      );
      fs.writeFileSync(dest, bytes);
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log(
    'Source result fixture/font/foundation/identity/anatomy guards passed. TEXT metrics, rendered pixels, hyperlink behavior, native mode changes and publication remain open.'
  );
}
if (require.main === module)
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
module.exports = { document, installNativeTextPropertyDefaultFixture };
