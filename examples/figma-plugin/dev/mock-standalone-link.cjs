'use strict';
const fs = require('fs'),
  assert = require('assert/strict');
const root = require('path').resolve(__dirname, '../../..');
const { rangeEnvironment } = require(
  root + '/examples/figma-plugin/dev/mock-rich-text-integration.cjs'
);
const {
  buildStandaloneLinkRecipes,
} = require('../../../scripts/figma-standalone-link-recipes.cjs');
const clone = x => JSON.parse(JSON.stringify(x));
const richFields = [
  'fontName',
  'textStyleId',
  'fills',
  'textDecoration',
  'textDecorationOffset',
];
const stamp = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
function document() {
  const d = JSON.parse(
    fs.readFileSync(root + '/examples/figma-plugin/mangrove-variables.json')
  );
  d.components.families = buildStandaloneLinkRecipes({ root, ...d });
  return d;
}
async function main() {
  const d = document();
  assert.equal(d.components.families[0].variants.length, 18);
  const original = clone({ variables: d.variables, styles: d.styles });
  buildStandaloneLinkRecipes({ root, ...d });
  assert.deepEqual(
    clone({ variables: d.variables, styles: d.styles }),
    original
  );
  for (const mode of d.modes) {
    const env = await rangeEnvironment(d, { richDecorationOffsets: true });
    const imp = await env.call(
      'importVariables',
      d,
      [mode.id],
      false,
      [],
      true
    );
    assert.deepEqual(clone(imp.errors), []);
    const build = () =>
      env.call('buildMangroveComponents', d, mode.id, ['standalone-link']);
    const first = await build();
    assert.deepEqual(clone(first.errors), []);
    const roots = [...env.state.nodes.values()].filter(
      n =>
        n.type === 'COMPONENT' &&
        stamp(n).startsWith('family/standalone-link/variant/')
    );
    assert.equal(roots.length, 18);
    function verify() {
      for (const variant of d.components.families[0].variants) {
        const node = roots.find(
          n => stamp(n) === 'family/standalone-link/variant/' + variant.id
        );
        assert(node);
        const source = variant.sourceContract.sourceModes[mode.id];
        assert.equal(node.width, source.ownerRect.width);
        assert.equal(node.height, source.ownerRect.height);
        assert.equal(node.clipsContent, false);
        assert.equal(node.opacity, 1);
        const label = [...env.state.nodes.values()].find(
          n =>
            stamp(n) ===
            'family/standalone-link/variant/' + variant.id + '/label'
        );
        assert(label);
        assert.equal(
          label.characters,
          variant.sourceContract.logicalCharacters
        );
        assert.equal(
          label.textAlignHorizontal,
          variant.properties.Locale === 'arabic' ? 'RIGHT' : 'LEFT'
        );
        const spec = variant.tree.children[0].textRuns[0];
        const segments = label.getStyledTextSegments(richFields);
        assert.equal(segments.length, 1);
        const segment = segments[0];
        assert.equal(segment.start, 0);
        assert.equal(segment.end, label.characters.length);
        assert.equal(segment.characters, label.characters);
        const authoredStyle = d.styles.text.find(s => s.id === spec.textStyle);
        assert(authoredStyle);
        const nativeStyle = env.state.styles.find(
          s => s.id === segment.textStyleId
        );
        assert(nativeStyle);
        assert.equal(
          nativeStyle.getSharedPluginData('orgundrrmangrove', 'mgStyleId'),
          spec.textStyle
        );
        assert.equal(nativeStyle.name, authoredStyle.name);
        assert.deepEqual(
          clone(segment.fontName),
          authoredStyle.values[mode.id].fontName
        );
        assert.deepEqual(
          clone(nativeStyle.fontName),
          authoredStyle.values[mode.id].fontName
        );
        // This range fixture models fontName/style ID but not segment fontSize/lineHeight. Verify those through its actual referenced native TEXT style.
        assert.equal(
          nativeStyle.fontSize,
          authoredStyle.values[mode.id].fontSize
        );
        assert.deepEqual(
          clone(nativeStyle.lineHeight),
          authoredStyle.values[mode.id].lineHeight
        );
        assert.equal(segment.textDecoration, spec.textDecoration);
        assert.deepEqual(
          clone(segment.textDecorationOffset),
          spec.textDecorationOffset || null
        );
        const assertAlias = (paint, role) => {
          assert.equal(paint.type, 'SOLID');
          assert.equal(paint.opacity, 1);
          assert.equal(paint.boundVariables.color.type, 'VARIABLE_ALIAS');
          const variable = env.state.variables.find(
            v => v.id === paint.boundVariables.color.id
          );
          assert(variable);
          assert.equal(variable.name, role);
          assert.equal(variable.resolvedType, 'COLOR');
        };
        assert.equal(segment.fills.length, 1);
        assertAlias(segment.fills[0], spec.fill);
        const rings = [...env.state.nodes.values()].filter(
          n =>
            n.parent?.id === node.id &&
            stamp(n).startsWith(
              'family/standalone-link/variant/' + variant.id + '/focus/'
            )
        );
        assert.equal(
          rings.length,
          variant.properties.State === 'focusVisible' ? 2 : 0
        );
        if (rings.length) {
          for (const ring of rings) {
            assert.equal(ring.cornerRadius, 0);
            assert.equal(ring.strokes.length, 1);
            assertAlias(
              ring.strokes[0],
              stamp(ring).endsWith('/outer')
                ? 'color/focus-ring'
                : 'color/neutral-0'
            );
          }
          assert(
            rings.some(
              n =>
                stamp(n).endsWith('/outer') &&
                n.strokeWeight === 2 &&
                n.x === -2
            )
          );
          assert(
            rings.some(
              n =>
                stamp(n).endsWith('/separator') &&
                n.strokeWeight === 2 &&
                n.x === 0
            )
          );
        }
      }
    }
    const snap = () =>
      [...env.state.nodes.values()]
        .filter(n => stamp(n).startsWith('family/standalone-link/'))
        .map(n => ({
          id: n.id,
          parent: n.parent?.id,
          type: n.type,
          key: stamp(n),
          x: n.x,
          y: n.y,
          width: n.width,
          height: n.height,
          chars: n.characters,
          clip: n.clipsContent,
          align: n.textAlignHorizontal,
          stroke: n.strokeWeight,
          radius: n.cornerRadius,
          strokes: n.strokes,
          rich:
            n.type === 'TEXT' ? n.getStyledTextSegments(richFields) : undefined,
          main: n.mainComponent?.id,
        }));
    verify();
    const before = snap();
    assert(before.length > 18);
    for (let i = 0; i < 2; i++) {
      const r = await build();
      assert.deepEqual(clone(r.errors), []);
      assert.equal(r.createdNodeIds.length, 0);
      verify();
      assert.deepEqual(snap(), before);
    }
    const consumer = roots[0].createInstance();
    env.figma.currentPage.appendChild(consumer);
    const text = consumer.findAll(n => n.type === 'TEXT')[0];
    assert(text);
    const copyBefore = text.characters;
    text.characters = 'EDIT' + copyBefore.slice(4);
    const permanent = () =>
      clone({
        nodes: snap(),
        styles: env.state.styles.map(s => ({
          id: s.id,
          name: s.name,
          fontName: s.fontName,
          effects: s.effects,
        })),
        variables: env.state.variables.map(v => ({
          id: v.id,
          values: v.valuesByMode,
        })),
        images: env.state.images,
      });
    const deniedBefore = permanent();
    const denied = await build();
    assert(
      denied.errors.some(e => /reflow-needed/.test(e)),
      JSON.stringify(denied.errors)
    );
    assert.equal(denied.createdNodeIds.length, 0);
    assert.equal(text.characters, 'EDIT' + copyBefore.slice(4));
    assert.deepEqual(permanent(), deniedBefore);
    console.log(
      mode.id,
      '18 source owners/whole logical copy/two focus bands/two exact nonempty zero-create repeats/owning linked-edit refusal'
    );
  }
}
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { document };
