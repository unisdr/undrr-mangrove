#!/usr/bin/env node
'use strict';
// Actual navigation/guidance runtime checks. This mock cannot prove native
// Layers usability, font availability or visual containment.
const assert = require('assert');
const { environment, importFoundation } = require('./mock-kit.cjs');
const {
  buildFigmaVariables,
} = require('../../../scripts/build-figma-tokens.cjs');
const { buildKitGuidance } = require('../../../scripts/figma-kit-guidance.cjs');
const doc = buildFigmaVariables();
doc.kitGuidance ||= buildKitGuidance(doc.components.families);
const copy = value => JSON.parse(JSON.stringify(value));
const own = (node, value) =>
  node.setSharedPluginData('orgundrrmangrove', 'mgKitId', value);
const fields = [
  'id',
  'type',
  'name',
  'description',
  'x',
  'y',
  'width',
  'height',
  'visible',
  'clipsContent',
  'layoutMode',
  'layoutSizingHorizontal',
  'layoutSizingVertical',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'itemSpacing',
  'fontName',
  'fontSize',
  'lineHeight',
  'textStyleId',
  'effectStyleId',
  'characters',
  'textAutoResize',
  'componentPropertyReferences',
  'overrides',
  'boundVariables',
  'fills',
  'strokes',
  'effects',
  'data',
  'sharedData',
  'explicitVariableModes',
];
function snapshot(env, omitDescriptions = false) {
  return copy({
    nodes: [...env.state.nodes.values()].map(node => ({
      ...Object.fromEntries(
        fields
          .filter(field => !omitDescriptions || field !== 'description')
          .map(field => [field, node[field]])
      ),
      parentId: node.parent?.id,
      childIds: node.children.map(child => child.id),
      properties:
        node.type === 'COMPONENT_SET'
          ? node.componentPropertyDefinitions
          : node.type === 'INSTANCE'
            ? node.componentProperties
            : undefined,
      mainId: node.type === 'INSTANCE' ? node.main?.id : undefined,
      rangePaints:
        node.type === 'TEXT' && node.characters.length
          ? node.getRangeFills(0, node.characters.length)
          : undefined,
    })),
    variables: env.state.variables,
    collections: env.state.collections,
    styles: env.state.styles,
  });
}
async function fixture() {
  const env = environment(doc);
  await importFoundation(env, doc);
  await env.figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  const frame = (key, name, parent = env.figma.currentPage) => {
    const node = env.figma.createFrame();
    own(node, key);
    node.name = name;
    parent.appendChild(node);
    return node;
  };
  const main = frame('main', 'Source components, actual name');
  const review = frame('review', 'Usage and states, actual name');
  frame('welcome', '00 Start here, actual name');
  frame('diagnostics.focus-ring', 'Historical focus diagnostics');
  const variants = new Map(),
    sets = new Map();
  for (const family of doc.components.families) {
    const component = env.figma.createComponent();
    component.name = 'State=Default';
    own(component, `family/${family.id}/variant/default`);
    const property = component.addComponentProperty('Label', 'TEXT', 'Source');
    const text = env.figma.createText();
    own(text, `family/${family.id}/variant/default/label`);
    text.characters = 'Source';
    text.componentPropertyReferences = { characters: property };
    text.textStyleId = 'synthetic-source-style';
    text.boundVariables = {
      fontSize: {
        type: 'VARIABLE_ALIAS',
        id: env.state.variables.find(variable =>
          variable.name.startsWith('font-size/')
        ).id,
      },
    };
    component.appendChild(text);
    const set = env.figma.combineAsVariants([component], main);
    own(set, `family/${family.id}`);
    set.name = family.name;
    set.description = component.description =
      'Historical pending acceptance description';
    sets.set(family.id, set);
    variants.set(family.id, component);
    frame(`review/${family.id}`, family.name, review).appendChild(
      component.createInstance()
    );
  }
  const personal = frame('', 'My design');
  const consumer = variants.get('button').createInstance();
  personal.appendChild(consumer);
  const label = Object.keys(consumer.componentProperties).find(key =>
    key.startsWith('Label#')
  );
  consumer.setProperties({ [label]: 'My edited action' });
  const forbidFonts = () => {
    throw new Error('Navigation and description refresh must not load fonts');
  };
  env.figma.loadFontAsync = forbidFonts;
  env.state.loadedFonts.clear();
  return { env, sets, variants, consumer, main, review, personal, frame };
}
async function main() {
  {
    const { env, frame } = await fixture();
    // Fixture preparation may move text; navigation starts with no fonts loaded.
    env.state.loadedFonts.add('Inter Regular');
    const page = env.figma.currentPage;
    const overview = frame('layout/family/table/overview', 'Table');
    const review = page.findAll(
      node =>
        node.getSharedPluginData('orgundrrmangrove', 'mgKitId') ===
        'review/table'
    )[0];
    overview.appendChild(review);
    const heading = env.figma.createText();
    own(heading, 'layout/family/table/overview/title');
    overview.appendChild(heading);
    const box = (node, rect) =>
      Object.defineProperty(node, 'absoluteBoundingBox', {
        configurable: true,
        value: rect,
      });
    box(review, { x: 2000, y: 1200, width: 736, height: 4659 });
    box(heading, { x: 2000, y: 980, width: 2400, height: 42 });
    box(review.children[0], { x: 2032, y: 1240, width: 672, height: 200 });
    const buttonReview = page.findAll(
      node =>
        node.getSharedPluginData('orgundrrmangrove', 'mgKitId') ===
        'review/button'
    )[0];
    box(buttonReview, { x: 2000, y: 2000, width: 736, height: 500 });
    let zoom = 0.27,
      center = { x: 0, y: 0 };
    const screen = { width: 1200, height: 900 };
    env.figma.viewport = {
      get zoom() {
        return zoom;
      },
      set zoom(value) {
        assert(Number.isFinite(value) && value > 0);
        zoom = value;
      },
      get center() {
        return center;
      },
      set center(value) {
        center = copy(value);
      },
      get bounds() {
        return {
          x: center.x - screen.width / (2 * zoom),
          y: center.y - screen.height / (2 * zoom),
          width: screen.width / zoom,
          height: screen.height / zoom,
        };
      },
      scrollAndZoomIntoView() {
        env.state.viewportCalls += 1;
      },
    };
    env.state.loadedFonts.clear();
    const before = snapshot(env);
    const result = await env.call('navigateMangroveInstalled', 'example:table');
    assert.strictEqual(result.viewportMode, 'usage-entry');
    assert.strictEqual(
      zoom,
      1,
      'Tall review opens at normal scale when the first chunk fits'
    );
    assert.strictEqual(
      env.state.viewportCalls,
      0,
      'Tall entry does not fit the entire review catalogue'
    );
    const visible = env.figma.viewport.bounds;
    assert.strictEqual(visible.y, heading.absoluteBoundingBox.y - 48);
    assert(
      visible.y + visible.height >=
        review.children[0].absoluteBoundingBox.y + 200
    );
    assert.strictEqual(page.selection[0].id, review.id);
    const repeat = await env.call('navigateMangroveInstalled', 'example:table');
    assert.strictEqual(repeat.viewportMode, 'usage-entry');
    assert.deepStrictEqual(
      env.figma.viewport.bounds,
      visible,
      'Entry is independent of the preceding zoom'
    );
    screen.width = 480;
    screen.height = 400;
    await env.call('navigateMangroveInstalled', 'example:table');
    assert(zoom <= 1 && zoom > 0);
    const narrow = env.figma.viewport.bounds;
    assert(
      narrow.width >= 736 + 96,
      'Narrow screens fit usage width without overscaling'
    );
    assert(
      narrow.y + narrow.height >= review.children[0].absoluteBoundingBox.y + 200
    );
    screen.width = 1200;
    screen.height = 900;
    const short = await env.call('navigateMangroveInstalled', 'example:button');
    assert.strictEqual(short.viewportMode, 'fit');
    assert.strictEqual(
      env.state.viewportCalls,
      1,
      'Short usage keeps ordinary fit navigation'
    );
    await env.call('navigateMangroveInstalled', 'source:table');
    assert.strictEqual(
      env.state.viewportCalls,
      2,
      'Source navigation retains the whole-set overview'
    );
    await env.call('navigateMangroveInstalled', 'legacy-review');
    assert.strictEqual(
      env.state.viewportCalls,
      3,
      'Root Go retains overview navigation'
    );
    assert.deepStrictEqual(
      snapshot(env),
      before,
      'Top-entry navigation changes no source, guide, consumer, font or binding records'
    );
    assert.strictEqual(env.state.loadedFonts.size, 0);
    console.log(
      'ok tall usage opens its heading and first normal state at capped scale, repeats independently of zoom, and preserves all assets on narrow screens'
    );
  }
  {
    const { env, sets, review } = await fixture();
    const before = snapshot(env);
    const state = copy(await env.call('inspectMangroveNavigation'));
    assert.deepStrictEqual(
      state.destinations.map(item => item.id),
      ['start', 'legacy-review', 'legacy-main', 'legacy-diagnostics']
    );
    assert(state.destinations.some(item => item.label === review.name));
    assert(!state.destinations.some(item => item.id === 'foundations'));
    assert(state.families.some(item => item.id === 'table'));
    for (const id of ['table-row', 'combobox-option', 'tabs', 'editorial-cta'])
      assert(
        !state.families.some(item => item.id === id),
        `${id} is not a primary core browsing entry`
      );
    for (const destination of [
      'start',
      'legacy-review',
      'legacy-main',
      'legacy-diagnostics',
      'example:button',
      'source:table',
    ]) {
      const result = await env.call('navigateMangroveInstalled', destination);
      assert.strictEqual(result.operation, 'kit-navigation');
      assert.strictEqual(result.destination, destination);
      assert.strictEqual(env.figma.currentPage.selection[0].id, result.nodeId);
    }
    assert.strictEqual(
      env.figma.currentPage.selection[0].id,
      sets.get('table').id
    );
    for (const destination of [
      'foundations',
      'example:tabs',
      'source:table-row',
      'example:unknown',
    ])
      await assert.rejects(
        env.call('navigateMangroveInstalled', destination),
        /not.*installed|not an installed/
      );
    assert.deepStrictEqual(
      snapshot(env),
      before,
      'Navigation changes only viewport/selection, not inspected assets'
    );
    assert.strictEqual(env.state.loadedFonts.size, 0);
    console.log(
      'ok installed legacy names, primary widget discovery and exact read-only navigation without fonts'
    );
  }
  {
    const { env, frame } = await fixture();
    for (const id of [
      'start',
      'foundations',
      'components',
      'compositions',
      'patterns',
      'pending',
    ]) {
      const section = env.figma.createSection();
      own(section, `layout/${id}`);
      section.name = `Actual installed ${id}`;
      env.figma.currentPage.appendChild(section);
    }
    const state = copy(await env.call('inspectMangroveNavigation', doc));
    for (const id of [
      'start',
      'foundations',
      'components',
      'compositions',
      'patterns',
      'pending',
    ]) {
      assert(
        state.destinations.some(
          item => item.id === id && item.label === `Actual installed ${id}`
        )
      );
      await env.call('navigateMangroveInstalled', id);
    }
    const duplicate = frame('review/button', 'Conflicting ownership');
    const before = snapshot(env),
      calls = env.state.viewportCalls;
    await assert.rejects(
      env.call('inspectMangroveNavigation'),
      /Duplicate Mangrove ownership/
    );
    await assert.rejects(
      env.call('navigateMangroveInstalled', 'example:button'),
      /Duplicate Mangrove ownership/
    );
    await assert.rejects(
      env.call('refreshMangroveGuidance', doc),
      /Duplicate Mangrove ownership/
    );
    assert.deepStrictEqual(snapshot(env), before);
    assert.strictEqual(
      env.state.viewportCalls,
      calls,
      'Ownership conflict refuses before navigating'
    );
    duplicate.remove();
    console.log(
      'ok installed section labels and duplicate ownership refusal; normal inherited instance identities are ignored'
    );
  }
  {
    const { env, sets, variants, consumer } = await fixture();
    const before = snapshot(env, true);
    const consumerDescription = consumer.description;
    const result = await env.call('refreshMangroveGuidance', doc);
    assert.strictEqual(result.createdNodeIds.length, 0);
    assert.strictEqual(
      result.updatedNodeIds.length,
      doc.components.families.length * 2
    );
    assert.strictEqual(result.errors.length, 0);
    for (const item of doc.kitGuidance.families) {
      assert.strictEqual(sets.get(item.id).description, item.description);
      assert.strictEqual(variants.get(item.id).description, item.description);
    }
    assert.strictEqual(
      consumer.description,
      consumerDescription,
      'Inherited consumer is not adopted for description writes'
    );
    assert.deepStrictEqual(
      snapshot(env, true),
      before,
      'Only canonical descriptions change; geometry, properties, bindings, styles, content and identities remain exact'
    );
    const final = snapshot(env);
    const repeat = await env.call('refreshMangroveGuidance', doc);
    assert.strictEqual(repeat.updatedNodeIds.length, 0);
    assert.strictEqual(repeat.createdNodeIds.length, 0);
    assert.deepStrictEqual(snapshot(env), final);
    const malformed = copy(doc);
    malformed.kitGuidance.families.at(-1).description = '';
    await assert.rejects(
      env.call('refreshMangroveGuidance', malformed),
      /Invalid or incomplete/
    );
    assert.deepStrictEqual(
      snapshot(env),
      final,
      'Full registry validation precedes every description write'
    );
    const incomplete = copy(doc);
    incomplete.components.families.pop();
    await assert.rejects(
      env.call('refreshMangroveGuidance', incomplete),
      /complete current component inventory/
    );
    assert.deepStrictEqual(snapshot(env), final);
    console.log(
      'ok full inventory guidance changes only canonical descriptions, preserves consumers and repeats with zero updates'
    );
  }
  {
    const { env, sets, variants } = await fixture();
    const firstId = doc.kitGuidance.families[0].id;
    const blocked = variants.get(firstId);
    const oldDescription = blocked.description;
    const before = snapshot(env, true);
    Object.defineProperty(blocked, 'description', {
      configurable: true,
      get: () => oldDescription,
      set: () => {
        throw new Error('Synthetic native description write failure');
      },
    });
    const partial = copy(await env.call('refreshMangroveGuidance', doc));
    assert.strictEqual(partial.phase, 'partial');
    assert.deepStrictEqual(partial.createdNodeIds, []);
    assert.deepStrictEqual(partial.updatedNodeIds, [sets.get(firstId).id]);
    assert(
      partial.errors[0].includes('Synthetic native description write failure')
    );
    assert.deepStrictEqual(snapshot(env, true), before);
    Object.defineProperty(blocked, 'description', {
      configurable: true,
      writable: true,
      value: oldDescription,
    });
    const retry = await env.call('refreshMangroveGuidance', doc);
    assert.strictEqual(retry.phase, 'complete');
    assert.strictEqual(
      retry.updatedNodeIds.length,
      doc.components.families.length * 2 - 1
    );
    assert.deepStrictEqual(snapshot(env, true), before);
    const repeat = await env.call('refreshMangroveGuidance', doc);
    assert.strictEqual(repeat.updatedNodeIds.length, 0);
    console.log(
      'ok partial native description failures return exact affected IDs and resume without recreating or rewriting completed assets'
    );
  }
}
main().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
