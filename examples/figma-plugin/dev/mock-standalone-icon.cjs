'use strict';
const fs = require('fs'),
  assert = require('assert/strict');
const path = require('path');
const root =
  process.env.MANGROVE_REPO_ROOT || path.resolve(__dirname, '../../..');
const { environment } = require(
    root + '/examples/figma-plugin/dev/mock-kit.cjs'
  ),
  { install } = require('./standalone-icon-svg-fixture.cjs');
const copy = x => JSON.parse(JSON.stringify(x)),
  stamp = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
function document() {
  const d = JSON.parse(
    fs.readFileSync(root + '/examples/figma-plugin/mangrove-variables.json')
  );
  const { buildStandaloneIconRecipes } = require(
    path.resolve(
      __dirname,
      '../../../scripts/figma-standalone-icon-recipes.cjs'
    )
  );
  d.components.families = buildStandaloneIconRecipes({
    root,
    modes: d.modes,
    variables: d.variables,
    styles: d.styles,
  });
  return d;
}
async function main() {
  const d = document();
  for (const mode of d.modes) {
    const env = environment(d);
    install(env);
    const imp = await env.call(
      'importVariables',
      d,
      [mode.id],
      false,
      [],
      true
    );
    assert.deepEqual(copy(imp.errors), []);
    const build = () =>
      env.call(
        'buildMangroveComponents',
        d,
        mode.id,
        ['standalone-icon-source-candidate'],
        { refreshReview: false }
      );
    const first = await build();
    assert.deepEqual(copy(first.errors), []);
    const roots = [...env.state.nodes.values()].filter(
      n =>
        n.type === 'COMPONENT' &&
        stamp(n).startsWith('family/standalone-icon-source-candidate/variant/')
    );
    assert.equal(roots.length, 131);
    const verify = () => {
      for (const v of d.components.families[0].variants) {
        const key = 'family/standalone-icon-source-candidate/variant/' + v.id,
          n = roots.find(n => stamp(n) === key),
          leaf = [...env.state.nodes.values()].find(
            n => stamp(n) === key + '/artwork'
          );
        assert.equal(n.width, v.tree.layout.width);
        assert.equal(n.height, v.tree.layout.height);
        assert.equal(n.clipsContent, false);
        assert.equal(leaf.width, v.tree.children[0].layout.width);
        assert.equal(leaf.height, v.tree.children[0].layout.height);
        assert.equal(leaf.x, v.tree.children[0].position.x);
        assert.equal(leaf.y, v.tree.children[0].position.y);
        const vectors = leaf.findAll(n => n.type === 'VECTOR');
        assert(vectors.length);
        if (v.sourceContract.multicolorOriginalPaint) {
          const colors = new Set(
            vectors.flatMap(n => n.fills.map(p => JSON.stringify(p.color)))
          );
          assert(colors.size >= 17);
          assert(!v.tree.children[0].svg.monochrome);
        } else {
          for (const field of Object.keys(v.tree.children[0].svg.monochrome)) {
            for (const vector of vectors)
              for (const paint of vector[field]) {
                const alias = paint.boundVariables?.color;
                assert(alias?.id);
                assert.equal(
                  env.state.variables.find(v => v.id === alias.id)?.name,
                  v.tree.children[0].svg.monochrome[field]
                );
              }
          }
        }
      }
    };
    verify();
    const consumers = roots.map(n => {
      const c = n.createInstance();
      env.figma.currentPage.appendChild(c);
      return c;
    });
    consumers[0].opacity = 0.55;
    consumers[0].name = 'Icon owning consumer edited label';
    const snap = () =>
      copy({
        variables: env.state.variables.map(v => ({
          id: v.id,
          name: v.name,
          type: v.resolvedType,
          values: v.valuesByMode,
        })),
        styles: env.state.styles.map(s => ({
          id: s.id,
          name: s.name,
          type: s.type,
          fontName: s.fontName,
          bindings: s.boundVariables,
          effects: s.effects,
        })),
        nodes: [...env.state.nodes.values()].map(n => ({
          id: n.id,
          parent: n.parent?.id,
          type: n.type,
          key: stamp(n),
          name: n.name,
          children: n.children?.map(x => x.id),
          x: n.x,
          y: n.y,
          width: n.width,
          height: n.height,
          clip: n.clipsContent,
          opacity: n.opacity,
          fills: n.fills,
          strokes: n.strokes,
          paths: n.vectorPaths,
          props: n.type === 'INSTANCE' ? n.componentProperties : undefined,
          main: n.type === 'INSTANCE' ? n.mainComponent?.id : undefined,
        })),
      });
    const before = snap();
    assert(before.nodes.length > 131);
    for (let i = 0; i < 2; i++) {
      const r = await build();
      assert.deepEqual(copy(r.errors), []);
      assert.equal(r.createdNodeIds.length, 0);
      verify();
      assert.deepEqual(snap(), before);
      assert.equal(consumers[0].opacity, 0.55);
      assert.equal(consumers[0].name, 'Icon owning consumer edited label');
    }
    console.log(
      mode.id,
      '131masters/131genuine consumers/allsource allocation-paint fields/two nonempty zero-create repeats/ownopacity-name edit',
      before.nodes.length
    );
  }
}
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { document };
