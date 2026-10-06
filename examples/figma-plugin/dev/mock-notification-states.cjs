#!/usr/bin/env node
/** Source and actual builder contracts. SVG viewport fixtures are not native rendering. */
'use strict';
const fs = require('fs'),
  path = require('path'),
  assert = require('assert');
const root = path.resolve(__dirname, '../../..');
const recipes = require('../../../scripts/figma-notification-state-recipes.cjs');
const { rangeEnvironment } = require('./mock-rich-text-integration.cjs');
const {
  installNativeTextPropertyDefaultFixture,
} = require('./mock-search-results.cjs');
const copy = x => JSON.parse(JSON.stringify(x));
const walk = n => [n, ...(n.children || []).flatMap(walk)];
const identity = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
const original = () =>
  JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
  );
function document() {
  const d = original();
  const dependency = recipes.buildNotificationStatusDependency({ root, ...d });
  const families = [
    'buildServiceNoticeRecipes',
    'buildSnackbarRecipes',
    'buildUserFeedbackConfirmationRecipes',
  ].flatMap(k => recipes[k]({ root, ...d }));
  d.components.families = [dependency, ...families];
  return d;
}
function installNotificationSvgFixture(env, families) {
  const exact = new Map(
    families
      .flatMap(f => f.variants.flatMap(v => walk(v.tree)))
      .filter(n => n.svg)
      .map(n => [n.svg.assetId, n.svg])
  );
  const previous = env.figma.createNodeFromSvg.bind(env.figma);
  env.figma.createNodeFromSvg = markup => {
    const clean = s => s.replace(/\s+(?:width|height)="[^"]*"/g, '');
    const svg = [...exact.values()].find(
      s => clean(s.markup) === clean(markup)
    );
    if (!svg) return previous(markup);
    const source = svg.markup;
    const box = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(source);
    assert(box);
    const f = env.figma.createFrame();
    f.resize(+box[1], +box[2]);
    const paths = [...source.matchAll(/<path\b[^>]*\bd="([^"]+)"/g)].map(
      m => m[1]
    );
    // Status polygons/rounded rects use a precisely whitelisted source viewport
    // and paint fixture. No contour, antialiasing or native SVG import inference.
    for (const data of paths.length ? paths : ['M0 0']) {
      const v = env.figma.createVector();
      v.resize(+box[1], +box[2]);
      v.vectorPaths = [{ windingRule: 'NONZERO', data }];
      const outlined = !!svg.monochrome?.strokes;
      v.fills = !svg.monochrome?.fills
        ? []
        : [
            {
              type: 'SOLID',
              color: { r: 0, g: 0, b: 0 },
              opacity: 1,
              visible: true,
            },
          ];
      v.strokes = outlined
        ? [
            {
              type: 'SOLID',
              color: { r: 0, g: 0, b: 0 },
              opacity: 1,
              visible: true,
            },
          ]
        : [];
      v.strokeWeight = outlined ? 2 : 1;
      v.strokeAlign = 'CENTER';
      v.constraints = { horizontal: 'MIN', vertical: 'MIN' };
      f.appendChild(v);
    }
    f.rescale = scale => {
      f.resizeWithoutConstraints(f.width * scale, f.height * scale);
      for (const v of f.children) {
        v.resizeWithoutConstraints(v.width * scale, v.height * scale);
        v.strokeWeight *= scale;
      }
    };
    return f;
  };
}
const master = n => {
  for (let p = n.parent; p; p = p.parent)
    if (p.type === 'INSTANCE') return false;
  return true;
};
const snapshot = env =>
  copy(
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
        n.layoutMode,
        n.primaryAxisSizingMode,
        n.counterAxisSizingMode,
        n.characters,
        n.componentPropertyReferences,
        n.type === 'INSTANCE' ? n.componentProperties : null,
        n.boundVariables,
        n.fills,
        n.strokes,
        n.effects,
        n.explicitVariableModes,
      ])
      .sort((a, b) => a[0].localeCompare(b[0]))
  );
function installBackgroundBlurFixture(env) {
  const create = env.figma.createEffectStyle.bind(env.figma);
  env.figma.createEffectStyle = () => {
    const style = create();
    let proto = style,
      descriptor;
    while (proto && !descriptor) {
      descriptor = Object.getOwnPropertyDescriptor(proto, 'effects');
      proto = Object.getPrototypeOf(proto);
    }
    assert(descriptor?.set);
    Object.defineProperty(style, 'effects', {
      configurable: true,
      get() {
        return style.effectList;
      },
      set(values) {
        if (values.some(e => e.type === 'BACKGROUND_BLUR')) {
          assert.strictEqual(values.length, 1);
          assert.strictEqual(values[0].radius, 2);
          assert.strictEqual(values[0].visible, true);
          style.effectList = copy(values);
        } else descriptor.set.call(style, values);
      },
    });
    return style;
  };
}
async function main() {
  const doc = document();
  assert.deepStrictEqual(
    doc.components.families.map(f => [f.id, f.variants.length]),
    [
      ['notification-status-label', 7],
      ['service-notice', 6],
      ['snackbar', 8],
      ['user-feedback-confirmation', 4],
    ]
  );
  assert.deepStrictEqual(document(), doc);
  const status =
    require('../../../scripts/figma-status-label-recipes.cjs').buildStatusLabelRecipes(
      { root, ...original() }
    )[0];
  const expected = copy(status);
  expected.id = 'notification-status-label';
  expected.name = 'Mangrove draft / Notification status';
  for (const v of expected.variants)
    v.id = v.id.replace(/^status-label\./, 'notification-status-label.');
  assert.deepStrictEqual(
    doc.components.families[0],
    expected,
    'Exact normal source dependency clone'
  );
  const source = recipes.inspectNotificationSource({ root }).source;
  const resolve = (name, mode) => {
    const v = doc.variables.find(v => v.name === name);
    assert(v, name);
    const value = v.values[mode];
    return value?.alias ? resolve(value.alias, mode) : value;
  };
  for (const mode of doc.modes) {
    const env = await rangeEnvironment(doc);
    installNativeTextPropertyDefaultFixture(env);
    installBackgroundBlurFixture(env);
    installNotificationSvgFixture(env, doc.components.families);
    await env.runCode(
      fs.readFileSync(path.join(__dirname, '../kit-svg-sizing.js'), 'utf8') +
        '\nObject.assign(globalThis,{mgSvgSizingPlan,mgSvgSizingDocumentValues,mgSvgSizingSourceValues,mgSvgSizingNativeValues,mgSvgSizingNativePlan,mgApplySvgSizing});'
    );
    const imported = await env.call(
      'importVariables',
      doc,
      [mode.id],
      false,
      [],
      false
    );
    assert.deepStrictEqual(copy(imported.errors), []);
    const ids = doc.components.families.map(f => f.id);
    const first = await env.call('buildMangroveComponents', doc, mode.id, ids);
    assert.deepStrictEqual(copy(first.errors), []);
    assert(first.createdNodeIds.length);
    const actual = (family, variant, spec) =>
      [...env.state.nodes.values()].find(
        n =>
          master(n) &&
          (spec === variant.tree
            ? identity(n) === 'family/' + family.id + '/variant/' + variant.id
            : identity(n).includes('/variant/' + variant.id + '/') &&
              identity(n).endsWith('/' + spec.id))
      );
    function defaults() {
      for (const f of doc.components.families.slice(1))
        for (const v of f.variants)
          for (const t of walk(v.tree).filter(n => n.textProperty)) {
            const n = actual(f, v, t);
            assert(n, t.id);
            assert.strictEqual(n.characters, t.characters);
            assert(n.componentPropertyReferences.characters);
          }
    }
    defaults();
    for (const f of doc.components.families.slice(1))
      for (const v of f.variants)
        for (const spec of walk(v.tree)) {
          const n = actual(f, v, spec);
          assert(n, spec.id);
          if (spec.type === 'FRAME' || spec.type === 'INSTANCE')
            for (const key of ['width', 'height']) {
              const value = spec.layout[key];
              if (typeof value === 'string' && !['HUG', 'FILL'].includes(value))
                assert.strictEqual(
                  n[key],
                  resolve(value, mode.id),
                  spec.id + ' ' + key
                );
            }
          if (spec.absolute) {
            assert.strictEqual(n.x, resolve(spec.absolute.offsetX, mode.id));
            assert.strictEqual(n.y, resolve(spec.absolute.offsetY, mode.id));
          }
          if (spec.bindings?.opacity)
            assert.strictEqual(
              n.opacity,
              resolve(spec.bindings.opacity, mode.id) / 100
            );
          const captured = source.captures.find(
            c =>
              c.file ===
              mode.id +
                '-' +
                v.properties.Viewport +
                '-' +
                v.properties.Preset +
                '.json'
          )?.capture;
          const owning = captured?.nodes.find(c => c.id === spec.id);
          if (owning && spec.type === 'FRAME') {
            assert.strictEqual(
              n.width,
              owning.rect.width,
              'Actual DOM owner capacity'
            );
            assert.strictEqual(
              n.height,
              owning.rect.height,
              'Actual DOM owner height'
            );
            assert.strictEqual(
              n.opacity,
              Number(owning.style.opacity),
              'CSS opacity versus native percentage'
            );
            if (spec.absolute) {
              const parent = captured.nodes.find(c => c.id === owning.parentId);
              if (parent) {
                assert.strictEqual(n.x, owning.rect.x - parent.rect.x);
                assert.strictEqual(n.y, owning.rect.y - parent.rect.y);
              }
            }
          }
        }
    const svc = doc.components.families.find(f => f.id === 'service-notice');
    const offline = svc.variants.find(
      v =>
        v.properties.Preset === 'service-offline' &&
        v.properties.Viewport === '390'
    );
    assert(
      walk(offline.tree).some(t => t.textRuns && t.characters.endsWith('15s'))
    );
    for (const v of svc.variants) {
      const links = walk(v.tree).filter(
        n => n.sourceHref === 'https://messaging.undrr.org/'
      );
      assert.strictEqual(links.length, 1);
      for (const link of links) {
        assert.strictEqual(link.sourceTarget, '_blank');
        assert.strictEqual(link.sourceRel, 'noopener noreferrer');
        assert(
          walk(link).some(n =>
            n.textRuns?.some(r => r.hyperlink?.value === link.sourceHref)
          )
        );
      }
    }
    const feedback = doc.components.families.find(
      f => f.id === 'user-feedback-confirmation'
    );
    for (const v of feedback.variants) {
      const texts = walk(v.tree).filter(n => n.textRuns);
      assert.strictEqual(texts.length, 1);
      assert.strictEqual(texts[0].textRuns.length, 4);
      assert.strictEqual(
        texts[0].characters,
        'Thank you for your feedback. If you would like, you can also tell us more.'
      );
      assert(
        texts[0].textRuns.some(
          r =>
            r.hyperlink?.value ===
            'https://www.undrr.org/contact/website-feedback'
        )
      );
    }
    const selected = svc.variants[0],
      m = actual(svc, selected, selected.tree);
    const consumer = m.createInstance();
    env.figma.currentPage.appendChild(consumer);
    const label = consumer
      .findAllWithCriteria({ types: ['TEXT'] })
      .find(n => n.componentPropertyReferences?.characters);
    assert(label);
    const key = label.componentPropertyReferences.characters;
    const descriptor = Object.getOwnPropertyDescriptor(label, 'characters');
    Object.defineProperty(label, 'characters', {
      configurable: true,
      get() {
        return consumer.componentProperties[key].value;
      },
      set(x) {
        descriptor.set.call(this, x);
      },
    });
    consumer.setProperties({ [key]: 'Reviewed service title' });
    assert.strictEqual(label.characters, 'Reviewed service title');
    const richVariant = feedback.variants[0],
      richMaster = actual(feedback, richVariant, richVariant.tree);
    const richConsumer = richMaster.createInstance();
    env.figma.currentPage.appendChild(richConsumer);
    const sourceRich = richMaster
      .findAllWithCriteria({ types: ['TEXT'] })
      .find(n =>
        n
          .getStyledTextSegments?.(['hyperlink'])
          .some(r => r.hyperlink?.type === 'URL')
      );
    assert(sourceRich);
    const clone = richConsumer
      .findAllWithCriteria({ types: ['TEXT'] })
      .find(n => identity(n) === identity(sourceRich));
    assert(clone);
    const rich = env.attachRichText(clone, sourceRich);
    const link = rich
      .getStyledTextSegments(['hyperlink'])
      .find(r => r.hyperlink?.type === 'URL');
    rich.editRich(link.start, link.end, 'Reviewed linked copy');
    const richBefore = copy({
      characters: rich.characters,
      runs: rich.getStyledTextSegments([
        'textStyleId',
        'fills',
        'hyperlink',
        'textDecoration',
      ]),
    });
    const baseline = snapshot(env);
    for (let i = 0; i < 2; i++) {
      const repeat = await env.call(
        'buildMangroveComponents',
        doc,
        mode.id,
        ids
      );
      assert.deepStrictEqual(copy(repeat.errors), []);
      assert.strictEqual(repeat.createdNodeIds.length, 0);
      defaults();
      assert.deepStrictEqual(snapshot(env), baseline);
      assert.strictEqual(label.characters, 'Reviewed service title');
      assert.deepStrictEqual(
        copy({
          characters: rich.characters,
          runs: rich.getStyledTextSegments([
            'textStyleId',
            'fills',
            'hyperlink',
            'textDecoration',
          ]),
        }),
        richBefore
      );
    }
    console.log(
      mode.id +
        ': 18 notification source variants +7 exact dependency, two zero-create repeats'
    );
  }
  for (const family of ['Roboto', 'Roboto Condensed']) {
    const env = await rangeEnvironment(doc);
    await env.runCode(
      fs.readFileSync(path.join(__dirname, '../kit-svg-sizing.js'), 'utf8') +
        '\nObject.assign(globalThis,{mgSvgSizingPlan,mgSvgSizingDocumentValues,mgSvgSizingSourceValues,mgSvgSizingNativeValues,mgSvgSizingNativePlan,mgApplySvgSizing});'
    );
    env.state.fonts = env.state.fonts.filter(f => f.fontName.family !== family);
    await env.call('importVariables', doc, ['undrr'], false, [], false);
    const before = copy({
      nodes: snapshot(env),
      styles: env.state.styles,
      variables: env.state.variables.length,
      collections: env.state.collections.length,
    });
    const result = await env.call(
      'buildMangroveComponents',
      doc,
      'undrr',
      doc.components.families.map(f => f.id)
    );
    assert(result.errors.some(e => e.includes('unavailable')));
    assert.strictEqual(result.createdNodeIds.length, 0);
    assert.deepStrictEqual(
      copy({
        nodes: snapshot(env),
        styles: env.state.styles,
        variables: env.state.variables.length,
        collections: env.state.collections.length,
      }),
      before,
      'Missing required source font before permanent writes'
    );
  }
  for (const mutate of [
    ...[
      'foreign',
      {},
      [],
      { family: '', style: 'Regular' },
      { family: 'Roboto', style: '' },
    ].map(font => d => {
      const style = d.styles.text.find(s =>
        s.id.startsWith('component.service-notice.')
      );
      delete style.type;
      style.values.undrr.fontName = font;
    }),
    d => {
      d.variables.find(v => v.name === 'font-family/text').values.mcr = 'Other';
    },
    d => {
      d.variables.push(copy(d.variables[0]));
    },
    d => {
      d.variables.find(v =>
        v.name.startsWith('component/service-notice/')
      ).type = 'STRING';
    },
    d => {
      const s = d.styles.text.find(s =>
        s.id.startsWith('component.service-notice.')
      );
      s.values.undrr = [];
    },
    d => {
      const s = copy(
        d.styles.text.find(s => s.id.startsWith('component.service-notice.'))
      );
      d.styles.effect.push(s);
    },
  ]) {
    const d = copy(doc);
    mutate(d);
    const before = copy(d);
    assert.throws(
      () => recipes.buildServiceNoticeRecipes({ root, ...d }),
      /needs updating/
    );
    assert.deepStrictEqual(
      d,
      before,
      'Source refusal retains all caller arrays'
    );
  }
  const read = fs.readFileSync;
  for (const file of [
    'stories/Components/Snackbar/snackbar.scss',
    'stories/Components/UserFeedback/_labels.js',
    'examples/figma-plugin/holistic/assets/notification-states/overlay-host-footprints.json',
    'examples/figma-plugin/holistic/assets/content-hub/source-fonts/RobotoCondensed-Regular.woff2',
  ]) {
    let hit = false;
    fs.readFileSync = function (p, ...a) {
      const value = read.call(this, p, ...a);
      if (typeof p === 'string' && p.endsWith(file)) {
        hit = true;
        return typeof value === 'string'
          ? value + ' '
          : Buffer.concat([value, Buffer.from(' ')]);
      }
      return value;
    };
    try {
      assert.throws(document, /needs updating/);
      assert(hit);
    } finally {
      fs.readFileSync = read;
    }
  }
  console.log(
    'Notification source guards and caller collision refusals pass; native rendering remains open.'
  );
}
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = {
  document,
  installNotificationSvgFixture,
  installBackgroundBlurFixture,
};
