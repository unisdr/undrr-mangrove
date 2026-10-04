/** Actual source/builder inherited-data regression, not manual Figma Assets or propagation acceptance. */
'use strict';
const assert = require('assert');
const path = require('path');
const root = path.resolve(__dirname, '../../..');
const { environment, importFoundation } = require(
  path.join(root, 'examples/figma-plugin/dev/mock-kit.cjs')
);
const { buildFigmaVariables } = require(
  path.join(root, 'scripts/build-figma-tokens.cjs')
);
const doc = buildFigmaVariables();
const copy = x => JSON.parse(JSON.stringify(x));
const identity = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
const setIdentity = (n, key) =>
  n.setSharedPluginData('orgundrrmangrove', 'mgKitId', key);
const snapshot = env =>
  JSON.stringify({
    nodes: [...env.state.nodes.values()].map(n => ({
      id: n.id,
      type: n.type,
      key: identity(n),
      parent: n.parent?.id,
      children: n.children?.map(c => c.id),
      name: n.name,
      width: n.width,
      height: n.height,
      characters: n.characters,
      overrides: n.overrides,
    })),
    variables: env.state.variables.map(v => v.id),
    styles: env.state.styles.map(s => s.id),
  });
const run = env =>
  env.call('buildMangroveComponents', doc, 'undrr', ['button']);
async function setup() {
  const env = environment(doc);
  await importFoundation(env, doc);
  const built = await env.call('buildMangroveComponents', doc, 'undrr', [
    'button',
  ]);
  assert.deepStrictEqual(copy(built.errors), []);
  const set = env.state.nodes.get(built.families[0].setId);
  return { env, set };
}
async function main() {
  {
    const { env, set } = await setup();
    const master = set.children[0],
      consumer = master.createInstance();
    env.figma.currentPage.appendChild(consumer);
    assert.strictEqual(
      identity(consumer),
      identity(master),
      'Mock must faithfully inherit root metadata'
    );
    const key = Object.keys(consumer.componentProperties).find(
      k => k.split('#')[0] === 'Label'
    );
    consumer.setProperties({ [key]: 'Independent edited consumer label' });
    consumer.resize(240, consumer.height);
    consumer.children.find(n => n.type === 'TEXT').textAlignHorizontal =
      'RIGHT';
    const consumerBaseline = JSON.stringify({
      ids: [consumer.id, ...consumer.children.map(n => n.id)],
      props: consumer.componentProperties,
      width: consumer.width,
      align: consumer.children.find(n => n.type === 'TEXT').textAlignHorizontal,
      sourceKey: identity(consumer),
    });
    const ownedIds = [...env.state.nodes.values()]
      .filter(n => identity(n))
      .map(n => n.id)
      .sort();
    for (let pass = 0; pass < 2; pass++) {
      const report = await run(env);
      assert.deepStrictEqual(copy(report.errors), []);
      assert.strictEqual(report.createdNodeIds.length, 0);
      assert.deepStrictEqual(
        [...env.state.nodes.values()]
          .filter(n => identity(n))
          .map(n => n.id)
          .sort(),
        ownedIds
      );
      assert(
        !report.updatedNodeIds.includes(consumer.id),
        'Inherited consumer must not be adopted'
      );
      assert(
        report.updatedNodeIds.some(id =>
          identity(env.state.nodes.get(id))?.startsWith('review/')
        ),
        'Owned review instances must still be indexed/updated'
      );
      assert.strictEqual(
        JSON.stringify({
          ids: [consumer.id, ...consumer.children.map(n => n.id)],
          props: consumer.componentProperties,
          width: consumer.width,
          align: consumer.children.find(n => n.type === 'TEXT')
            .textAlignHorizontal,
          sourceKey: identity(consumer),
        }),
        consumerBaseline
      );
    }
    console.log(
      'ok actual source exporter and ordinary zero-create repeats preserve canonical/review IDs and unadopted inherited-root consumer overrides/metadata'
    );
  }
  for (const fault of [
    'wrong-main',
    'missing-main',
    'conflicting-root',
    'duplicate-component',
  ]) {
    const { env, set } = await setup();
    if (fault === 'duplicate-component') {
      const duplicate = env.figma.createComponent();
      setIdentity(duplicate, identity(set.children[0]));
      env.figma.currentPage.appendChild(duplicate);
    } else {
      const consumer = set.children[1].createInstance();
      env.figma.currentPage.appendChild(consumer);
      setIdentity(consumer, identity(set.children[0]));
      if (fault === 'missing-main')
        consumer.getMainComponentAsync = async () => null;
      if (fault === 'conflicting-root')
        consumer.setPluginData('mgKitId', 'conflicting-private-source');
    }
    const before = snapshot(env);
    await assert.rejects(
      () => run(env),
      fault === 'duplicate-component'
        ? /Duplicate Mangrove ownership key/
        : fault === 'conflicting-root'
          ? /conflict/i
          : /does not match its actual main/
    );
    assert.strictEqual(snapshot(env), before);
  }
  console.log(
    'ok wrong/missing actual main, conflicting identity and duplicate canonical COMPONENT identities refuse before mutations'
  );
}
main().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
