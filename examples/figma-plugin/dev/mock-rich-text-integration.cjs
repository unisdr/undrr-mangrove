#!/usr/bin/env node
/** Actual builder with an isolated range-aware mock adapter. No native rendering claim. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { environment } = require('./mock-kit.cjs');
const copy = value => JSON.parse(JSON.stringify(value));
const source = fs.readFileSync(
  path.join(__dirname, '../kit-rich-text.js'),
  'utf8'
);
const identity = node =>
  node.getSharedPluginData('orgundrrmangrove', 'mgKitId');
function document() {
  const doc = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
  );
  const base = doc.styles.text.find(
    style =>
      style.values.undrr.fontName.family === 'Roboto' &&
      style.values.undrr.fontName.style === 'Regular'
  );
  assert(base);
  const styles = ['body', 'strong'].map((role, index) => ({
    ...copy(base),
    id: `component.rich-test.${role}`,
    name: `Mangrove/rich-test/${role}`,
    values: Object.fromEntries(
      Object.entries(base.values).map(([mode, value]) => [
        mode,
        {
          ...value,
          fontName: { family: 'Roboto', style: index ? 'Bold' : 'Regular' },
        },
      ])
    ),
  }));
  doc.styles.text.push(...styles);
  const characters = 'Thank you. Tell us more about 45 examples.';
  const startLink = characters.indexOf('Tell'),
    endLink = characters.indexOf(' about'),
    startStrong = characters.indexOf('45');
  const runs = [
    [0, startLink, 'body'],
    [
      startLink,
      endLink,
      'body',
      'https://www.undrr.org/contact/website-feedback',
    ],
    [endLink, startStrong, 'body'],
    [startStrong, startStrong + 2, 'strong'],
    [startStrong + 2, characters.length, 'body'],
  ].map(([start, end, role, link], i) => ({
    id: `span-${i}`,
    start,
    end,
    textStyle: `component.rich-test.${role}`,
    fill: link ? 'color/interactive' : 'color/text',
    ...(link
      ? { hyperlink: { type: 'URL', value: link }, textDecoration: 'UNDERLINE' }
      : {}),
  }));
  const family = {
    id: 'rich-test',
    name: 'Mangrove/Rich Test',
    kind: 'component-set',
    review: { genericLabels: false, preserveVariantSizing: true },
    variants: [
      {
        id: 'rich-test.default',
        properties: { State: 'Default' },
        name: 'State=Default',
        tree: {
          id: 'root',
          type: 'FRAME',
          layout: { mode: 'VERTICAL', width: 600, height: 'HUG' },
          children: [
            {
              id: 'body',
              name: 'Mixed body',
              type: 'TEXT',
              characters,
              textRuns: runs,
              layout: { width: 'FILL', height: 'HUG' },
            },
          ],
        },
      },
    ],
  };
  doc.components.families = [family];
  return doc;
}
async function rangeEnvironment(doc, options = {}) {
  const env = environment(doc, { sharedOnly: true, ...options });
  env.figma.getFontFamilyVariationAxes = () =>
    options.nativeVariableFonts || options.nativeInventoryOmitsAxes
      ? ['wght', 'wdth']
      : null;
  if (options.nativeVariableFonts) {
    env.figma.getFontFamilyVariationAxes = family =>
      family === 'Inter' ? ['slnt', 'wght'] : ['wdth', 'wght'];
    const concrete = font => ({
      ...font,
      variationSettings: {
        ...(font.family === 'Inter' ? { slnt: 0 } : { wdth: 100 }),
        wght: font.style === 'Bold' ? 700 : 400,
      },
    });
    const inventory = env.figma.listAvailableFontsAsync;
    env.figma.listAvailableFontsAsync = async () =>
      (await inventory()).map(entry => ({
        fontName: concrete(entry.fontName),
      }));
    function attachFont(object) {
      let font = concrete(object.fontName);
      Object.defineProperty(object, 'fontName', {
        configurable: true,
        get: () => copy(font),
        set: input => {
          font = concrete(input);
        },
      });
      return object;
    }
    const createStyle = env.figma.createTextStyle;
    env.figma.createTextStyle = () => attachFont(createStyle());
    const createText = env.figma.createText;
    env.figma.createText = () => attachFont(createText());
  }
  await env.runCode(source + '\nglobalThis.mgRichText = mgRichText;');
  const original = env.figma.createText;
  function attach(node, sourceNode) {
    const proto = Object.getPrototypeOf(node),
      descriptor = Object.getOwnPropertyDescriptor(proto, 'characters');
    let cells = Array.from({ length: node.characters.length }, () => ({}));
    if (sourceNode)
      for (const segment of sourceNode.getStyledTextSegments([
        'textStyleId',
        'fontName',
        'fills',
        'hyperlink',
        'textDecoration',
        ...(options.richDecorationOffsets ? ['textDecorationOffset'] : []),
      ])) {
        for (let i = segment.start; i < segment.end; i++)
          cells[i] = copy(segment);
      }
    const view = cell => {
      const style = env.state.styles.find(item => item.id === cell.textStyleId);
      return {
        ...copy(cell),
        ...(options.richDecorationOffsets
          ? {
              textDecorationOffset:
                cell.textDecoration === 'UNDERLINE'
                  ? (cell.textDecorationOffset ?? { unit: 'AUTO' })
                  : null,
            }
          : {}),
        fontName: style ? copy(style.fontName) : cell.fontName,
      };
    };
    Object.defineProperty(node, 'characters', {
      configurable: true,
      get: () => descriptor.get.call(node),
      set: value => {
        descriptor.set.call(node, value);
        cells = Array.from({ length: value.length }, () => ({}));
      },
    });
    node.getStyledTextSegments = fields => {
      const result = [];
      for (let i = 0; i < node.characters.length; i++) {
        const current = view(cells[i]);
        const values = Object.fromEntries(
          fields.map(key => [key, current[key]])
        );
        const signature = JSON.stringify(values),
          previous = result[result.length - 1];
        if (previous?.signature === signature) {
          previous.end++;
          previous.characters += node.characters[i];
        } else
          result.push({
            ...copy(values),
            start: i,
            end: i + 1,
            characters: node.characters[i],
            signature,
          });
      }
      return result;
    };
    node.setRangeTextStyleIdAsync = async (start, end, id) => {
      await Promise.resolve();
      const style = env.state.styles.find(
        item => item.id === id && item.type === 'TEXT'
      );
      assert(style);
      assert(
        env.state.loadedFonts.has(
          `${style.fontName.family} ${style.fontName.style}`
        )
      );
      for (let i = start; i < end; i++)
        Object.assign(cells[i], {
          textStyleId: id,
          fontName: copy(style.fontName),
        });
    };
    for (const [method, key] of [
      ['setRangeFills', 'fills'],
      ['setRangeHyperlink', 'hyperlink'],
      ['setRangeTextDecoration', 'textDecoration'],
      ...(options.richDecorationOffsets
        ? [['setRangeTextDecorationOffset', 'textDecorationOffset']]
        : []),
    ])
      node[method] = (start, end, value) => {
        assert(start >= 0 && end <= node.characters.length && start < end);
        for (let i = start; i < end; i++) cells[i][key] = copy(value);
      };
    if (options.richDecorationOffsets) {
      const setOffset = node.setRangeTextDecorationOffset;
      node.setRangeTextDecorationOffset = (start, end, value) => {
        assert(
          value &&
            (value.unit === 'AUTO' ||
              (['PIXELS', 'PERCENT'].includes(value.unit) &&
                Number.isFinite(value.value)))
        );
        for (let i = start; i < end; i++) {
          const current = view(cells[i]);
          assert(current.textDecoration === 'UNDERLINE');
          assert(
            env.state.loadedFonts.has(
              `${current.fontName.family} ${current.fontName.style}`
            )
          );
        }
        setOffset(
          start,
          end,
          value.unit === 'AUTO'
            ? value
            : { ...value, value: Math.fround(value.value) }
        );
      };
      node.getRangeTextDecorationOffset = (start, end) => {
        assert(start >= 0 && start < end && end <= node.characters.length);
        const value = view(cells[start]).textDecorationOffset;
        return cells
          .slice(start, end)
          .every(
            cell =>
              JSON.stringify(view(cell).textDecorationOffset) ===
              JSON.stringify(value)
          )
          ? copy(value)
          : env.figma.mixed;
      };
    }
    node.editRich = (start, end, value) => {
      const retained = copy(cells[start] || cells[start - 1]);
      node._characters =
        node.characters.slice(0, start) + value + node.characters.slice(end);
      cells.splice(
        start,
        end - start,
        ...Array.from({ length: value.length }, () => copy(retained))
      );
    };
    return node;
  }
  env.figma.createText = () => attach(original());
  env.attachRichText = attach;
  return env;
}
const snapshot = env =>
  JSON.stringify({
    nodes: [...env.state.nodes.values()].map(node => [
      node.id,
      identity(node),
      node.characters,
      node.getSharedPluginData('orgundrrmangrove', 'mgRichTextRunsV1'),
    ]),
    styles: env.state.styles.map(style => [
      style.id,
      style.name,
      style.fontName,
    ]),
    images: env.state.images.size,
  });
async function imported(env, doc) {
  const report = await env.call(
    'importVariables',
    doc,
    ['undrr'],
    false,
    [],
    false
  );
  assert.deepStrictEqual(copy(report.errors), []);
}
async function build(env, doc) {
  return env.call('buildMangroveComponents', doc, 'undrr', ['rich-test']);
}
async function main() {
  const unresolvedDoc = document(),
    unresolvedEnv = await rangeEnvironment(unresolvedDoc, {
      nativeInventoryOmitsAxes: true,
    });
  await imported(unresolvedEnv, unresolvedDoc);
  const unresolvedBefore = snapshot(unresolvedEnv);
  const unresolvedReport = await build(unresolvedEnv, unresolvedDoc);
  assert(
    unresolvedReport.errors.some(error =>
      error.includes('default axes are unresolved')
    )
  );
  assert.strictEqual(
    snapshot(unresolvedEnv),
    unresolvedBefore,
    'unresolved native defaults must refuse before style or scene writes'
  );
  const axisDoc = document(),
    axisEnv = await rangeEnvironment(axisDoc, { nativeVariableFonts: true });
  await imported(axisEnv, axisDoc);
  for (let i = 0; i < 3; i++) {
    const axisReport = await build(axisEnv, axisDoc);
    assert.deepStrictEqual(copy(axisReport.errors), []);
    if (i) assert.strictEqual(axisReport.createdNodeIds.length, 0);
  }
  const axisTarget = [...axisEnv.state.nodes.values()].find(
    node => identity(node) === 'family/rich-test/variant/rich-test.default/body'
  );
  assert(
    axisTarget
      .getStyledTextSegments(['fontName'])
      .every(segment => segment.fontName.variationSettings.wdth === 100)
  );
  axisTarget.editRich(0, 5, 'Many thanks');
  const axisText = axisTarget.characters;
  const axisRepeat = await build(axisEnv, axisDoc);
  assert.deepStrictEqual(copy(axisRepeat.errors), []);
  assert.strictEqual(axisRepeat.createdNodeIds.length, 0);
  assert.strictEqual(axisTarget.characters, axisText);
  const doc = document(),
    env = await rangeEnvironment(doc);
  await imported(env, doc);
  assert(
    !env.state.styles.some(style => style.name.startsWith('Mangrove/rich-test'))
  );
  let report = await build(env, doc);
  assert.deepStrictEqual(copy(report.errors), []);
  const target = [...env.state.nodes.values()].find(
    node => identity(node) === 'family/rich-test/variant/rich-test.default/body'
  );
  assert(target);
  const consumer = target.parent.createInstance();
  consumer.x = 217;
  consumer.y = 419;
  const consumerText = env.attachRichText(
    consumer.children.find(node => node.type === 'TEXT'),
    target
  );
  const consumerLinkStart = consumerText.characters.indexOf('Tell us more');
  consumerText.editRich(
    consumerLinkStart,
    consumerLinkStart + 'Tell us more'.length,
    'Consumer linked edit'
  );
  const consumerSnapshot = () =>
    JSON.stringify({
      id: consumer.id,
      textId: consumerText.id,
      x: consumer.x,
      y: consumer.y,
      characters: consumerText.characters,
      runs: consumerText
        .getStyledTextSegments([
          'textStyleId',
          'fills',
          'hyperlink',
          'textDecoration',
        ])
        .map(run => [
          run.start,
          run.end,
          run.textStyleId,
          run.fills,
          run.hyperlink,
          run.textDecoration,
        ]),
      ledger: consumerText.getSharedPluginData(
        'orgundrrmangrove',
        'mgRichTextRunsV1'
      ),
    });
  const consumerBefore = consumerSnapshot();
  const targetId = target.id;
  for (let i = 0; i < 2; i++) {
    report = await build(env, doc);
    assert.deepStrictEqual(copy(report.errors), []);
    assert.strictEqual(report.createdNodeIds.length, 0);
    assert.strictEqual(target.id, targetId);
  }
  let at = target.characters.indexOf('Tell us more');
  target.editRich(at, at + 'Tell us more'.length, 'Share more detail');
  target.editRich(0, 5, 'Many thanks');
  const edited = target.characters;
  for (let i = 0; i < 2; i++) {
    report = await build(env, doc);
    assert.deepStrictEqual(copy(report.errors), []);
    assert.strictEqual(report.createdNodeIds.length, 0);
    assert.strictEqual(target.characters, edited);
  }
  const link = target
    .getStyledTextSegments(['hyperlink'])
    .find(item => item.hyperlink);
  assert.strictEqual(link.characters, 'Share more detail');
  assert.strictEqual(
    consumerSnapshot(),
    consumerBefore,
    'consumer formatted edit and identity changed during master repeats'
  );
  const update = copy(doc);
  const bodyStyle = update.styles.text.find(
    style => style.id === 'component.rich-test.body'
  );
  for (const value of Object.values(bodyStyle.values))
    value.fontName.style = 'Bold';
  report = await build(env, update);
  assert.deepStrictEqual(copy(report.errors), []);
  assert.strictEqual(target.characters, edited);
  assert.strictEqual(
    consumerSnapshot(),
    consumerBefore,
    'shared font update changed consumer text/paint/link identities'
  );
  for (const mutate of [
    tree => tree.textRuns[0].end++,
    tree => (tree.textProperty = 'Body'),
    tree => (tree.bindings = { fontSize: 'font-size/300' }),
    tree => (tree.textRuns[1].fill = 'missing/color'),
    tree => (tree.textRuns[1].hyperlink.value = 'javascript:bad'),
    tree => (tree.textRuns[0].textStyle = 'missing-style'),
  ]) {
    const broken = document();
    mutate(broken.components.families[0].variants[0].tree.children[0]);
    const test = await rangeEnvironment(broken);
    await imported(test, broken);
    const before = snapshot(test);
    const refusal = await build(test, broken);
    assert(refusal.errors.length);
    assert.strictEqual(
      snapshot(test),
      before,
      'invalid recipe touched styles or scene'
    );
  }
  const closureDoc = document();
  closureDoc.components.families.unshift({
    id: 'plain-test',
    name: 'Mangrove/Plain Test',
    kind: 'component-set',
    variants: [
      {
        id: 'plain-test.default',
        name: 'State=Default',
        properties: { State: 'Default' },
        tree: {
          id: 'root',
          type: 'FRAME',
          layout: { mode: 'VERTICAL', width: 200, height: 'HUG' },
          children: [
            {
              id: 'label',
              type: 'TEXT',
              characters: 'Valid plain family',
              textStyle: 'component.rich-test.body',
              fill: 'color/text',
              textProperty: 'Label',
              layout: { width: 'HUG', height: 'HUG' },
            },
          ],
        },
      },
    ],
  });
  closureDoc.components.families[1].variants[0].tree.children[0].textRuns[0]
    .end++;
  const closureEnv = await rangeEnvironment(closureDoc);
  await imported(closureEnv, closureDoc);
  const closureBefore = snapshot(closureEnv);
  const closureReport = await closureEnv.call(
    'buildMangroveComponents',
    closureDoc,
    'undrr',
    ['plain-test', 'rich-test']
  );
  assert(closureReport.errors.length);
  assert.strictEqual(
    snapshot(closureEnv),
    closureBefore,
    'invalid rich dependency closure allowed a valid plain sibling to mutate'
  );
  const failed = await rangeEnvironment(doc);
  await imported(failed, doc);
  const beforeNodes = failed.state.nodes.size;
  const createStyle = failed.figma.createTextStyle;
  failed.figma.createTextStyle = () => {
    const style = createStyle();
    Object.defineProperty(style, 'lineHeight', {
      set() {
        throw new Error('simulated style setter failure');
      },
      get() {
        return { unit: 'PERCENT', value: 150 };
      },
    });
    return style;
  };
  const refusal = await build(failed, doc);
  assert(refusal.errors.length);
  assert.strictEqual(failed.state.nodes.size, beforeNodes);
  assert.strictEqual(refusal.createdNodeIds.length, 0);
  assert(
    refusal.styles.removedStyleIds.length,
    'failed newly created styles must report their cleanup'
  );
  const {
    buildConnector,
  } = require('../../../scripts/build-figma-connector.cjs');
  for (const mutate of [
    d =>
      d.components.families[0].variants[0].tree.children[0].textRuns[0].end++,
    d =>
      (d.components.families[0].variants[0].tree.children[0].textProperty =
        'Unsafe'),
    d =>
      d.styles.text.find(style => style.id === 'component.rich-test.body')
        .values.undrr.fontSize++,
  ]) {
    const invalid = document();
    mutate(invalid);
    await assert.rejects(
      () =>
        buildConnector({
          doc: invalid,
          operation: 'build',
          brandId: 'undrr',
          familyIds: ['rich-test'],
        }),
      /Rich text|source font\/size/
    );
  }
  await assert.rejects(
    () =>
      buildConnector({
        doc,
        operation: 'build',
        brandId: 'undrr',
        familyIds: ['rich-test'],
      }),
    /payload exceeds 50000/
  );
  console.log(
    'Actual rich builder integration passes fresh styles, two zero-create repeats, direct formatted edits, expected shared-style font update, invalid preflight refusal and failed-style no-scene construction. Consumer/native acceptance remains open.'
  );
}
module.exports = { document, rangeEnvironment };
if (require.main === module)
  main().catch(error => {
    console.error(error.stack || error);
    process.exitCode = 1;
  });
