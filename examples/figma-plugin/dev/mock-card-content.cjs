#!/usr/bin/env node
/** Actual builder source contracts with exact bounded SVG API fixtures. */
'use strict';
const assert = require('assert'),
  fs = require('fs'),
  path = require('path');
const { rangeEnvironment } = require('./mock-rich-text-integration.cjs');
const {
  buildCardContentRecipes,
} = require('../../../scripts/figma-card-content-recipes.cjs');
const root = path.resolve(__dirname, '../../..'),
  copy = x => JSON.parse(JSON.stringify(x)),
  identity = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
function document() {
  const doc = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
  );
  const dependency = doc.components.families.find(
    f => f.id === 'editorial-cta'
  );
  doc.components.families = [
    dependency,
    ...buildCardContentRecipes({ root, ...doc }),
  ];
  return doc;
}
function installCardContentSvgFixture(env, families) {
  const specs = [];
  const walk = n => {
    if (n.type === 'SVG') specs.push(n);
    for (const c of n.children || []) walk(c);
  };
  for (const f of families) for (const v of f.variants) walk(v.tree);
  const previous = env.figma.createNodeFromSvg;
  env.state.cardSvgCalls = [];
  env.figma.createNodeFromSvg = markup => {
    const normalized = markup.replace(/ width="[\d.]+" height="[\d.]+"/, '');
    const spec = specs.find(s => s.svg.markup === normalized);
    if (!spec) return previous(markup);
    env.state.cardSvgCalls.push(spec.svg.assetId);
    const frame = env.figma.createFrame();
    const view = /viewBox=['"]0 0 ([\d.]+) ([\d.]+)['"]/.exec(normalized);
    assert(view);
    frame.resize(+view[1], +view[2]);
    Object.getPrototypeOf(frame).rescale = function (scale) {
      this.resizeWithoutConstraints(this.width * scale, this.height * scale);
      for (const c of this.children || [])
        c.resizeWithoutConstraints(c.width * scale, c.height * scale);
    };
    const vector = new frame.constructor('VECTOR');
    vector.resize(+view[1], +view[2]);
    vector.vectorPaths = [{ windingRule: 'NONZERO', data: 'M0 0' }];
    vector.fills = spec.svg.monochrome.fills
      ? [
          {
            type: 'SOLID',
            color: { r: 0, g: 0, b: 0 },
            opacity: 1,
            visible: true,
          },
        ]
      : [];
    vector.strokes = spec.svg.monochrome.strokes
      ? [
          {
            type: 'SOLID',
            color: { r: 0, g: 0, b: 0 },
            opacity: 1,
            visible: true,
          },
        ]
      : [];
    vector.strokeWeight = 2;
    frame.appendChild(vector);
    return frame;
  };
}

// Native-observed setter propagation is modeled separately from rich formatting.
const {
  installNativeTextPropertyDefaultFixture,
} = require('./mock-search-results.cjs');
const sourceWalk = n => [n, ...(n.children || []).flatMap(sourceWalk)];
function assertSourceDefaults(env, families) {
  for (const family of families)
    for (const variant of family.variants)
      for (const spec of sourceWalk(variant.tree).filter(n => n.textProperty)) {
        const matches = [...env.state.nodes.values()].filter(n => {
          if (
            n.type !== 'TEXT' ||
            !identity(n).includes('/variant/' + variant.id + '/') ||
            !identity(n).endsWith('/' + spec.id)
          )
            return false;
          for (let p = n.parent; p; p = p.parent)
            if (p.type === 'INSTANCE') return false;
          return true;
        });
        assert.strictEqual(matches.length, 1, variant.id + '/' + spec.id);
        const node = matches[0],
          reference = node.componentPropertyReferences.characters;
        assert.strictEqual(
          node.characters,
          spec.characters,
          variant.id + '/' + spec.id + ' source copy'
        );
        let owner = node.parent;
        while (owner && owner.type !== 'COMPONENT_SET') owner = owner.parent;
        assert(owner && reference);
        assert.strictEqual(
          owner.componentPropertyDefinitions[reference].defaultValue,
          spec.characters,
          variant.id + '/' + spec.id + ' default'
        );
      }
}
function editReferencedText(instance) {
  const fields = sourceWalk(instance).filter(
      n =>
        n.type === 'TEXT' &&
        n.componentPropertyReferences?.characters &&
        Object.hasOwn(
          instance.componentProperties,
          n.componentPropertyReferences.characters
        )
    ),
    keys = [
      ...new Set(fields.map(n => n.componentPropertyReferences.characters)),
    ];
  for (const node of fields) {
    const original = Object.getOwnPropertyDescriptor(node, 'characters'),
      reference = node.componentPropertyReferences.characters;
    Object.defineProperty(node, 'characters', {
      configurable: true,
      get() {
        return (
          instance.componentProperties[reference]?.value ??
          original.get.call(this)
        );
      },
      set(value) {
        original.set.call(this, value);
      },
    });
  }
  for (const key of keys)
    instance.setProperties({ [key]: `Edited ${key.replace(/#[^#]+$/, '')}` });
  return keys;
}
function assertDisplayedEdits(instance, keys) {
  for (const node of sourceWalk(instance).filter(
    n =>
      n.type === 'TEXT' &&
      keys.includes(n.componentPropertyReferences?.characters)
  ))
    assert.strictEqual(
      node.characters,
      `Edited ${node.componentPropertyReferences.characters.replace(/#[^#]+$/, '')}`
    );
}
function assertHorizontalActionSizing(env, families) {
  const horizontal = families.find(f => f.id === 'horizontal-book-card');
  for (const variant of horizontal.variants) {
    if (variant.properties.Preset === 'NoLink') continue;
    const matches = [...env.state.nodes.values()].filter(node => {
      if (
        node.type !== 'INSTANCE' ||
        !identity(node).includes('/variant/' + variant.id + '/') ||
        !identity(node).endsWith('/cta')
      )
        return false;
      for (let parent = node.parent; parent; parent = parent.parent)
        if (parent.type === 'INSTANCE') return false;
      return true;
    });
    assert.strictEqual(matches.length, 1, 'Unique owning CTA ' + variant.id);
    // Actual source mobile callers span their content allocation; desktop is inline.
    assert.strictEqual(
      matches[0].layoutSizingHorizontal,
      variant.properties.Width === '390' ? 'FILL' : 'HUG',
      'Owning CTA source allocation ' + variant.id
    );
  }
}
function defaultSnapshot(env) {
  return [...env.state.nodes.values()]
    .filter(n => n.type === 'COMPONENT_SET')
    .map(n => [n.id, copy(n.componentPropertyDefinitions)]);
}

async function main() {
  const doc = document(),
    families = doc.components.families.filter(f => f.id !== 'editorial-cta'),
    ids = families.map(f => f.id),
    assets = copy({ variables: doc.variables, styles: doc.styles });
  assert.deepStrictEqual(buildCardContentRecipes({ root, ...doc }), families);
  assert.deepStrictEqual(
    copy({ variables: doc.variables, styles: doc.styles }),
    assets
  );
  assert.deepStrictEqual(
    families.map(f => f.variants.length),
    [2, 8, 9]
  );
  for (const m of doc.modes) {
    const env = await rangeEnvironment(doc);
    installNativeTextPropertyDefaultFixture(env);
    installCardContentSvgFixture(env, families);
    const imported = await env.call(
      'importVariables',
      doc,
      [m.id],
      false,
      [],
      true
    );
    assert.deepStrictEqual(copy(imported.errors), []);
    const first = await env.call('buildMangroveComponents', doc, m.id, ids);
    assert.deepStrictEqual(copy(first.errors), []);
    assertSourceDefaults(env, doc.components.families);
    assertHorizontalActionSizing(env, families);
    const instances = [],
      richTargets = [];
    for (const report of first.families) {
      if (report.id === 'editorial-cta') continue;
      for (const record of report.variantIds) {
        const main = env.state.nodes.get(record.nodeId),
          spec = families
            .find(f => f.id === report.id)
            .variants.find(v => v.id === record.id);
        assert.strictEqual(main.width, Number(spec.properties.Width));
        assert.strictEqual(main.paddingLeft, 15);
        if (report.id === 'book-card') assert.strictEqual(main.itemSpacing, 5);
        if (
          report.id === 'icon-card' &&
          spec.properties.Preset === 'Centered'
        ) {
          const content = main.children[1],
            title = content.children.find(n =>
              identity(n).endsWith('/title-box')
            ),
            summary = content.children.find(n =>
              identity(n).endsWith('/summary-box')
            ),
            action = content.children.find(n =>
              identity(n).endsWith('/action-box')
            );
          assert.strictEqual(title.layoutSizingHorizontal, 'HUG');
          assert.strictEqual(title.children[0].textAlignHorizontal, 'CENTER');
          assert.strictEqual(summary.children[0].textAlignHorizontal, 'CENTER');
          assert.strictEqual(action.layoutSizingHorizontal, 'HUG');
        }

        if (report.id === 'horizontal-book-card') {
          assert.strictEqual(
            main.layoutMode,
            spec.properties.Width === '640' ? 'HORIZONTAL' : 'VERTICAL'
          );
          const rich = [...env.state.nodes.values()].find(
            n => n.parent?.parent === main && identity(n).includes('/summary')
          );
          assert(
            rich ||
              [...env.state.nodes.values()].some(
                n =>
                  n.characters ===
                  families[1].variants[0].tree.children.at(-1).children[2]
                    .children[0].characters
              )
          );
        }
        const instance = main.createInstance();
        instance.x = 144;
        instance.y = 277;
        const keys = editReferencedText(instance);
        if (report.id === 'horizontal-book-card') {
          const find = node =>
            node.type === 'TEXT' &&
            node.characters.includes('global health emergency')
              ? node
              : (node.children || []).map(find).find(Boolean);
          const mainText = find(main),
            consumerText = env.attachRichText(find(instance), mainText);
          for (const node of [mainText, consumerText]) {
            const start = node.characters.indexOf('global health emergency');
            node.editRich(
              start,
              start + 'global health emergency'.length,
              'Edited linked phrase'
            );
            richTargets.push(node);
          }
        }
        instances.push({ instance, keys });
      }
    }
    const richSnapshot = () =>
      JSON.stringify(
        richTargets.map(n => [
          n.id,
          n.characters,
          n
            .getStyledTextSegments([
              'textStyleId',
              'fills',
              'hyperlink',
              'textDecoration',
            ])
            .map(r => [
              r.start,
              r.end,
              r.textStyleId,
              r.fills,
              r.hyperlink,
              r.textDecoration,
            ]),
        ])
      );
    const beforeRich = richSnapshot();
    const owned = () =>
        [...env.state.nodes.values()]
          .filter(n => identity(n))
          .map(n => [n.id, identity(n)]),
      before = owned(),
      svgCount = env.state.cardSvgCalls.length,
      imageCount = env.state.images.size;
    const beforeDefaults = defaultSnapshot(env);
    for (let i = 0; i < 2; i++) {
      const repeat = await env.call('buildMangroveComponents', doc, m.id, ids);
      assert.deepStrictEqual(copy(repeat.errors), []);
      assert.strictEqual(repeat.createdNodeIds.length, 0);
      assertSourceDefaults(env, doc.components.families);
      assertHorizontalActionSizing(env, families);
      assert.deepStrictEqual(defaultSnapshot(env), beforeDefaults);
      assert.deepStrictEqual(owned(), before);
      assert.strictEqual(env.state.cardSvgCalls.length, svgCount);
      assert.strictEqual(env.state.images.size, imageCount);
      assert.strictEqual(richSnapshot(), beforeRich);
      for (const { instance, keys } of instances) {
        assert(!instance.removed);
        assertDisplayedEdits(instance, keys);
        assert.strictEqual(instance.x, 144);
        assert.strictEqual(instance.y, 277);
        for (const key of keys)
          assert.strictEqual(
            instance.componentProperties[key].value,
            `Edited ${key.replace(/#[^#]+$/, '')}`
          );
      }
    }
  }
  console.log(
    'ok  nineteen source Card presets, all-five-brand actual builder and two zero-create repeats retaining supported text; exact bounded SVG API fixtures'
  );
  // Restore the old component-set names deliberately: the observed setter model
  // must reproduce authored-copy corruption, rather than merely inspect names.
  for (const familyId of ['icon-card']) {
    const legacy = document();
    const family = legacy.components.families.find(f => f.id === familyId);
    legacy.components.families = legacy.components.families.filter(
      f => f.id === familyId || f.id === 'editorial-cta'
    );
    for (const variant of family.variants)
      for (const node of sourceWalk(variant.tree))
        if (node.textProperty?.startsWith(familyId + '/'))
          node.textProperty = node.textProperty.split(' ').at(-1);
    const legacyEnv = await rangeEnvironment(legacy);
    installNativeTextPropertyDefaultFixture(legacyEnv);
    installCardContentSvgFixture(legacyEnv, [family]);
    assert.deepStrictEqual(
      copy(
        (
          await legacyEnv.call(
            'importVariables',
            legacy,
            ['undrr'],
            false,
            [],
            true
          )
        ).errors
      ),
      []
    );
    for (let i = 0; i < 2; i++)
      assert.deepStrictEqual(
        copy(
          (
            await legacyEnv.call(
              'buildMangroveComponents',
              legacy,
              'undrr',
              legacy.components.families.map(f => f.id)
            )
          ).errors
        ),
        []
      );
    assert.throws(
      () => assertSourceDefaults(legacyEnv, [family]),
      /source copy|default/
    );
  }
  const read = fs.readFileSync;
  for (const [suffix, from, to] of [
    ['card.scss', 'aspect-ratio: 3/4', 'aspect-ratio: 2/4'],
    ['BookCard.jsx', 'mg-card__book', 'mg-card__novel'],
    ['HorizontalBookCard.jsx', 'DOMPurify.sanitize', 'DOMPurify.clean'],
    ['IconCard.jsx', "variant = 'default'", "variant = 'negative'"],
    ['_icon-definitions.scss', "stroke-width='2'", "stroke-width='3'"],
  ]) {
    fs.readFileSync = function (file, ...args) {
      const value = read.call(this, file, ...args);
      if (typeof file === 'string' && file.endsWith(suffix))
        return Buffer.isBuffer(value)
          ? Buffer.from(value.toString().replace(from, to))
          : value.replace(from, to);
      return value;
    };
    try {
      assert.throws(document, /recipe needs updating/);
    } finally {
      fs.readFileSync = read;
    }
  }
  const foreign = document();
  foreign.variables.find(v => v.name === 'component/card-content/one').name =
    'Foreign owner';
  assert.throws(
    () => buildCardContentRecipes({ root, ...foreign }),
    /Foreign identity/
  );
  const absent = await rangeEnvironment(doc, {
    rejectedFonts: ['Roboto Condensed Bold'],
  });
  installCardContentSvgFixture(absent, families);
  const imported = await absent.call(
    'importVariables',
    doc,
    ['undrr'],
    false,
    [],
    true
  );
  assert.strictEqual(imported.errors.length, 0);
  const snapshot = () =>
      [...absent.state.nodes.values()].map(n => [n.id, identity(n)]),
    before = snapshot();
  const refused = await absent.call('buildMangroveComponents', doc, 'undrr', [
    'book-card',
  ]);
  assert(refused.errors.length);
  assert.deepStrictEqual(snapshot(), before);
  console.log(
    'ok  source anatomy/cascade/icon mutations, foreign helper identities and missing exact font fail closed; formatted source-run and consumer edits retained; native pixels remain a separate gate'
  );
}
module.exports = { document, installCardContentSvgFixture };
if (require.main === module)
  main().catch(e => {
    console.error(e.stack || e);
    process.exitCode = 1;
  });
