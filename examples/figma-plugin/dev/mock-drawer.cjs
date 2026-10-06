#!/usr/bin/env node
/** Actual source projection and builder lifecycle. No native rendering simulation. */
'use strict';
const fs = require('fs'),
  path = require('path'),
  assert = require('assert');
const root = path.resolve(__dirname, '../../..');
const {
  buildDrawerRecipes,
  buildDrawerCheckboxDependency,
} = require('../../../scripts/figma-drawer-recipes.cjs');
const { environment } = require('./mock-kit.cjs');
const {
  installNativeTextPropertyDefaultFixture,
} = require('./mock-search-results.cjs');
const copy = x => JSON.parse(JSON.stringify(x)),
  walk = n => [n, ...(n.children || []).flatMap(walk)],
  identity = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
function document() {
  const d = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'))
  );
  const expected = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '../holistic/assets/drawer/dependency-contract.json')
    )
  );
  for (const id of ['button', 'checkbox'])
    assert.deepStrictEqual(
      d.components.families.find(f => f.id === id),
      expected[id]
    );
  const button = copy(expected.button);
  button.id = 'page-chrome-button';
  button.name = 'Page chrome source Button dependency';
  button.variants.forEach(
    v => (v.id = v.id.replace(/^button\./, 'page-chrome-button.'))
  );
  if (button.defaultVariantId)
    button.defaultVariantId = button.defaultVariantId.replace(
      /^button\./,
      'page-chrome-button.'
    );
  d.components.families = [
    buildDrawerCheckboxDependency({ root }),
    button,
    ...buildDrawerRecipes({ root, ...d }),
  ];
  return d;
}
function installDrawerSvgFixture(env, families) {
  const specs = families.flatMap(f =>
    f.variants.flatMap(v =>
      walk(v.tree).filter(
        n => n.type === 'SVG' && n.svg.assetId === 'drawer-close-source-mask'
      )
    )
  );
  const previous = env.figma.createNodeFromSvg;
  env.figma.createNodeFromSvg = markup => {
    const normalize = x => x.replace(/\s+(width|height)=['"][^'"]*['"]/g, '');
    if (!specs.some(s => normalize(s.svg.markup) === normalize(markup)))
      return previous.call(env.figma, markup);
    const frame = env.figma.createFrame();
    frame.resize(24, 24);
    const p = env.figma.createRectangle();
    p.resize(24, 24);
    p.fills = [];
    p.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
    frame.appendChild(p);
    frame.rescale = f => {
      frame.resize(frame.width * f, frame.height * f);
      for (const p of frame.children) p.resize(p.width * f, p.height * f);
    };
    frame.name =
      'Bounded exact close-source SVG fixture; path raster unmodeled';
    return frame;
  };
}
function modelDisplayedProperty(node, instance, reference) {
  assert(node.componentPropertyReferences.characters === reference);
  assert(reference in instance.componentProperties);
  let host = node,
    descriptor;
  while (host && !descriptor) {
    descriptor = Object.getOwnPropertyDescriptor(host, 'characters');
    host = Object.getPrototypeOf(host);
  }
  assert(descriptor?.set);
  Object.defineProperty(node, 'characters', {
    configurable: true,
    get() {
      return instance.componentProperties[reference].value;
    },
    set(value) {
      descriptor.set.call(this, value);
    },
  });
}
function snapshot(env) {
  return JSON.stringify(
    [...env.state.nodes.values()]
      .map(n => [
        n.id,
        identity(n),
        n.parent?.id,
        n.type,
        n.x,
        n.y,
        n.width,
        n.height,
        n.opacity,
        n.characters,
        n.textStyleId,
        n.fontName,
        n.textDecoration,
        n.textUnderlineOffset,
        n.fills,
        n.strokes,
        n.strokeTopWeight,
        n.strokeRightWeight,
        n.strokeBottomWeight,
        n.strokeLeftWeight,
        n.cornerRadius,
        n.effectStyleId,
        n.effects,
        n.boundVariables,
        n.componentPropertyReferences,
        n.type === 'COMPONENT_SET' ? n.componentPropertyDefinitions : null,
        n.type === 'INSTANCE' ? n.componentProperties : null,
      ])
      .sort((a, b) => a[0].localeCompare(b[0]))
  );
}
function ancestorInstance(n) {
  let p = n.parent;
  while (p) {
    if (p.type === 'INSTANCE') return true;
    p = p.parent;
  }
  return false;
}
function sourceDefaults(env, d) {
  for (const v of d.components.families.find(f => f.id === 'drawer').variants) {
    const key = 'family/drawer/variant/' + v.id;
    for (const t of walk(v.tree).filter(n => n.type === 'TEXT')) {
      const found = [...env.state.nodes.values()].filter(
        n =>
          n.type === 'TEXT' &&
          !ancestorInstance(n) &&
          identity(n).startsWith(key + '/') &&
          identity(n).endsWith('/' + t.id)
      );
      assert.equal(found.length, 1);
      const n = found[0];
      assert.equal(n.characters, t.characters);
      let owner = n.parent;
      while (owner && owner.type !== 'COMPONENT_SET') owner = owner.parent;
      assert.equal(
        owner.componentPropertyDefinitions[
          n.componentPropertyReferences.characters
        ].defaultValue,
        t.characters
      );
    }
  }
}
async function main() {
  const d = document(),
    family = d.components.families.find(f => f.id === 'drawer');
  assert.equal(family.variants.length, 20);
  assert.deepStrictEqual(document(), d);
  const captured = copy({ variables: d.variables, styles: d.styles });
  buildDrawerRecipes({ root, ...d });
  assert.deepStrictEqual(
    { variables: d.variables, styles: d.styles },
    captured
  );
  const dependency = d.components.families.find(
      f => f.id === 'drawer-checkbox'
    ),
    donor = JSON.parse(
      fs.readFileSync(
        path.join(
          __dirname,
          '../holistic/assets/drawer/dependency-contract.json'
        )
      )
    ).checkbox;
  assert.equal(dependency.variants.length, 2);
  for (const v of dependency.variants) {
    const expected = copy(
      donor.variants.find(
        x => x.id === v.id.replace(/^drawer-checkbox\./, 'checkbox.')
      )
    );
    expected.id = v.id;
    for (const n of walk(expected.tree))
      if (n.type === 'TEXT' && n.textProperty === 'Label')
        n.fill = 'color/neutral-900';
    assert.deepStrictEqual(v, expected);
  }
  const definitions = new Map();
  for (const v of family.variants)
    for (const t of walk(v.tree).filter(n => n.textProperty)) {
      assert(
        !definitions.has(t.textProperty) ||
          definitions.get(t.textProperty) === t.characters
      );
      definitions.set(t.textProperty, t.characters);
    }
  const archive = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '../holistic/assets/drawer/source-footprints.json')
    )
  );
  assert.equal(archive.captures.length, 200);
  const source = archive.captures.map(({ capture }) => {
    const c = copy(capture);
    for (const n of c.nodes)
      for (const k of ['style', 'before', 'after']) n[k] = archive.styles[n[k]];
    if (c.backdrop) c.backdrop.style = archive.styles[c.backdrop.style];
    c.bodyStyle = archive.styles[c.bodyStyle];
    return c;
  });
  for (const c of source.filter(c => c.contract.state.startsWith('closed'))) {
    const n = c.nodes[0];
    assert(n.style.visibility === 'hidden' || n.style.display === 'none');
    assert(!c.backdrop);
  }
  for (const mode of d.modes) {
    const env = await environment(d);
    installNativeTextPropertyDefaultFixture(env);
    installDrawerSvgFixture(env, d.components.families);
    const imported = await env.call(
      'importVariables',
      d,
      [mode.id],
      false,
      [],
      false
    );
    assert.deepStrictEqual(copy(imported.errors), []);
    const build = () =>
      env.call('buildMangroveComponents', d, mode.id, ['drawer']);
    const first = await build();
    assert.deepStrictEqual(copy(first.errors), []);
    assert(first.createdNodeIds.length > 800);
    const resolve = name => {
      if (typeof name === 'number') return name;
      const v = d.variables.find(v => v.name === name);
      assert(v, name);
      const x = v.values[mode.id];
      return x?.alias ? resolve(x.alias) : x;
    };
    async function verify() {
      let instances = 0,
        ownerChecks = 0;
      sourceDefaults(env, d);
      const contextualLabels = [...env.state.nodes.values()].filter(
        n =>
          identity(n).startsWith('family/drawer-checkbox/variant/') &&
          identity(n).endsWith('/Label') &&
          !ancestorInstance(n) &&
          n.type === 'TEXT' &&
          n.componentPropertyReferences?.characters
      );
      assert.equal(contextualLabels.length, 2);
      for (const n of contextualLabels) {
        assert.deepStrictEqual(copy(n.fills[0].color), { r: 0, g: 0, b: 0 });
        assert.equal(n.fills[0].opacity, 1);
        const style = env.state.styles.find(s => s.id === n.textStyleId);
        assert.equal(
          style.name,
          d.styles.text.find(s => s.id === 'component.body').name
        );
      }

      for (const v of family.variants) {
        const base = 'family/drawer/variant/' + v.id,
          scene = source.find(
            c =>
              c.contract.mode === mode.id &&
              c.contract.story === v.sourceContract.story &&
              c.contract.width === v.sourceContract.width &&
              c.contract.state === v.sourceContract.state
          );
        assert(scene);
        const native = [...env.state.nodes.values()].find(
          n => identity(n) === base
        );
        assert(native);
        assert.equal(native.width, v.sourceContract.width);
        assert.equal(native.height, 1000);
        async function visit(s, key) {
          const n = [...env.state.nodes.values()].find(
            n => identity(n) === key
          );
          assert(n, key);
          if (s.type === 'FRAME' || s.type === 'INSTANCE') {
            assert.equal(n.width, resolve(s.layout.width), key + ' width');
            assert.equal(n.height, resolve(s.layout.height), key + ' height');
            if (s.absolute) {
              assert.equal(n.x, resolve(s.absolute.offsetX), key + ' x');
              assert.equal(n.y, resolve(s.absolute.offsetY), key + ' y');
            }
            ownerChecks++;
          }
          if (s.bindings?.opacity) {
            assert.equal(n.opacity, resolve(s.bindings.opacity) / 100);
            const src = scene.nodes.find(x => x.id === s.sourceDrawerNode?.id);
            if (src) assert.equal(n.opacity, +src.style.opacity);
          }
          if (s.sourceDrawerNode?.id) {
            const src = scene.nodes.find(x => x.id === s.sourceDrawerNode.id);
            if (src) {
              assert.equal(n.width, src.rect.width);
              assert.equal(n.height, src.rect.height);
              const parent = scene.nodes.find(x => x.id === src.parentId);
              assert.equal(n.x, src.rect.x - (parent?.rect.x || 0));
              assert.equal(n.y, src.rect.y - (parent?.rect.y || 0));
            }
          }
          if (s.sourceDrawerNode?.normalLeaf === 'drawer-checkbox') {
            const src = scene.nodes.find(x => x.id === s.sourceDrawerNode.id),
              input = scene.nodes.find(
                x => x.parentId === src.id && x.tag === 'INPUT'
              );
            assert.equal(src.rect.height, 40);
            assert.equal(input.rect.width, 24);
            assert.equal(input.rect.height, 24);
          }
          if (s.effectStyle) {
            const style = env.state.styles.find(
              x => x.name === 'Mangrove draft / ' + s.effectStyle
            );
            assert(style);
            assert.equal(n.effectStyleId, style.id);
          }
          if (s.type === 'INSTANCE') {
            assert(n.type === 'INSTANCE');
            const main = await n.getMainComponentAsync();
            assert.equal(
              identity(main),
              'family/' +
                s.family +
                '/variant/' +
                d.components.families
                  .find(f => f.id === s.family)
                  .variants.find(v =>
                    Object.entries(s.variant).every(
                      ([k, value]) => v.properties[k] === value
                    )
                  ).id
            );
            const prop = Object.keys(n.componentProperties).find(k =>
              k.startsWith('Label#')
            );
            assert(prop);
            assert.equal(n.componentProperties[prop].value, s.overrides.Label);
            instances++;
          }
          for (const child of s.children || [])
            await visit(child, key + '/' + child.id);
        }
        await visit(v.tree, base);
      }
      const expectedOwners = family.variants
        .flatMap(v => walk(v.tree))
        .filter(n => ['FRAME', 'INSTANCE'].includes(n.type)).length;
      assert(expectedOwners > 400);
      assert.equal(ownerChecks, expectedOwners);
      assert.equal(instances, 96);
    }
    await verify();
    const master = [...env.state.nodes.values()].find(
      n =>
        n.type === 'COMPONENT' &&
        identity(n) === 'family/drawer/variant/drawer.end-390-open'
    );
    assert(master);
    const consumer = master.createInstance(),
      text = consumer.findAll(
        n =>
          n.type === 'TEXT' &&
          n.characters === 'Country report details (sample data)'
      )[0];
    assert(text);
    const ref = text.componentPropertyReferences.characters;
    modelDisplayedProperty(text, consumer, ref);
    consumer.setProperties({ [ref]: 'Edited report heading' });
    assert.equal(text.characters, 'Edited report heading');
    const filterMaster = [...env.state.nodes.values()].find(
        n =>
          n.type === 'COMPONENT' &&
          identity(n) === 'family/drawer/variant/drawer.default-390-open'
      ),
      filterConsumer = filterMaster.createInstance();
    const nestedEdits = [];
    for (const [oldChars, newChars] of [
      ['Drought', 'Edited hazard'],
      ['Show 128 results', 'Edited action'],
    ]) {
      const owner = filterConsumer.findAll(
        n =>
          n.type === 'INSTANCE' &&
          Object.values(n.componentProperties).some(
            p => p.type === 'TEXT' && p.value === oldChars
          )
      )[0];
      assert(owner && owner !== filterConsumer);
      const property = Object.keys(owner.componentProperties).find(
        k =>
          k.startsWith('Label#') &&
          owner.componentProperties[k].value === oldChars
      );
      assert(property);
      const t = owner.findAll(
        n =>
          n.type === 'TEXT' &&
          n.componentPropertyReferences.characters === property
      )[0];
      assert(t);
      modelDisplayedProperty(t, owner, property);
      owner.setProperties({ [property]: newChars });
      assert.equal(t.characters, newChars);
      nestedEdits.push({
        owner,
        text: t,
        value: newChars,
        main: (await owner.getMainComponentAsync()).id,
      });
    }
    const before = snapshot(env),
      link = (await consumer.getMainComponentAsync()).id,
      images = env.state.images.size;
    for (let i = 0; i < 2; i++) {
      const repeated = await build();
      assert.deepStrictEqual(copy(repeated.errors), []);
      assert.equal(repeated.createdNodeIds.length, 0);
      assert.equal(snapshot(env), before);
      assert.equal((await consumer.getMainComponentAsync()).id, link);
      assert.equal(text.characters, 'Edited report heading');
      for (const edit of nestedEdits) {
        assert.equal(edit.text.characters, edit.value);
        assert.equal((await edit.owner.getMainComponentAsync()).id, edit.main);
      }
      assert.equal(env.state.images.size, images);
      await verify();
    }
    console.log(
      mode.id +
        ': actual20 source owners/defaults/nested leaves/consumer/two exact zero-create repeats passed'
    );
  }
  const pristine = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'))
  );
  for (const mutate of [
    x =>
      (x.variables.find(v => v.name === 'color/form-check').values.mcr = {
        alias: 'color/form-check',
      }),
    x =>
      (x.styles.text.find(
        v => v.id === 'component.button'
      ).values.mcr.fontName.family = ''),
    x =>
      (x.variables.find(v => v.name === 'padding/button/inline').values.mcr +=
        1),
  ]) {
    const bad = copy(pristine);
    mutate(bad);
    const before = copy({ variables: bad.variables, styles: bad.styles });
    assert.throws(
      () => buildDrawerRecipes({ root, ...bad }),
      /Drawer source changed/
    );
    assert.deepStrictEqual(
      { variables: bad.variables, styles: bad.styles },
      before
    );
  }
  for (const mutate of [
    x =>
      (x.variables.find(
        v => v.name.startsWith('component/drawer/') && v.type === 'FLOAT'
      ).type = 'STRING'),
    x =>
      (x.styles.text.find(v => v.id.startsWith('component.drawer.')).type =
        'EFFECT'),
    x =>
      (x.styles.text.find(v =>
        v.id.startsWith('component.drawer.')
      ).values.mcr.fontName = {}),
    x =>
      x.styles.effect.push(
        copy(x.styles.text.find(v => v.id.startsWith('component.drawer.')))
      ),
  ]) {
    const bad = copy(d);
    mutate(bad);
    const before = copy({ variables: bad.variables, styles: bad.styles });
    assert.throws(
      () => buildDrawerRecipes({ root, ...bad }),
      /Drawer source changed/
    );
    assert.deepStrictEqual(
      { variables: bad.variables, styles: bad.styles },
      before
    );
  }
  const env = await environment(d);
  installDrawerSvgFixture(env, d.components.families);
  await env.call('importVariables', d, ['undrr'], false, [], false);
  env.figma.listAvailableFontsAsync = async () => [
    { fontName: { family: 'Roboto', style: 'Regular' } },
  ];
  env.figma.loadFontAsync = async f => {
    if (f.style === 'Bold' || f.family !== 'Roboto')
      throw Error('Unavailable source font');
  };
  const before = {
    nodes: env.state.nodes.size,
    text: env.state.styles.filter(s => s.type === 'TEXT').length,
    effects: env.state.styles.filter(s => s.type === 'EFFECT').length,
    images: env.state.images.size,
  };
  const result = await env.call('buildMangroveComponents', d, 'undrr', [
    'drawer',
  ]);
  assert(result.errors.length);
  assert.deepStrictEqual(
    {
      nodes: env.state.nodes.size,
      text: env.state.styles.filter(s => s.type === 'TEXT').length,
      effects: env.state.styles.filter(s => s.type === 'EFFECT').length,
      images: env.state.images.size,
    },
    before
  );
  console.log('Drawer source guards/atomic helper kinds/missing fonts passed');
}
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { document, installDrawerSvgFixture, main };
