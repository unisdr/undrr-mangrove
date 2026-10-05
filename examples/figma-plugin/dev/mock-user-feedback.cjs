#!/usr/bin/env node
/** UserFeedback source/builder contracts. Does not render browser/native grid. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { environment, importFoundation } = require('./mock-kit.cjs');
const {
  buildUserFeedbackRecipes,
} = require('../../../scripts/figma-user-feedback-recipes.cjs');
const root = path.resolve(__dirname, '../../..');
const copy = v => JSON.parse(JSON.stringify(v));
const identity = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
const identities = env =>
  [...env.state.nodes.values()]
    .filter(identity)
    .map(n => [identity(n), n.id])
    .sort();
function document() {
  const doc = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
  );
  doc.components.families = buildUserFeedbackRecipes({ root, ...doc });
  return doc;
}
function changed(file, transform) {
  const read = fs.readFileSync;
  fs.readFileSync = function (filename, ...args) {
    const text = read.call(this, filename, ...args);
    return typeof filename === 'string' && filename.endsWith(file)
      ? transform(text)
      : text;
  };
  try {
    assert.throws(document, /needs updating/);
  } finally {
    fs.readFileSync = read;
  }
}
async function main() {
  const doc = document(),
    family = doc.components.families[0],
    assets = copy({ variables: doc.variables, styles: doc.styles });
  assert.deepStrictEqual(
    family.variants.map(v => v.properties),
    [
      { State: 'Initial', Viewport: 'Mobile' },
      { State: 'Initial', Viewport: 'Desktop' },
    ]
  );
  assert.deepStrictEqual(buildUserFeedbackRecipes({ root, ...doc }), [family]);
  assert.deepStrictEqual(
    copy({ variables: doc.variables, styles: doc.styles }),
    assets
  );
  for (const [file, transform] of [
    [
      '/stories/Components/UserFeedback/user-feedback.scss',
      s =>
        s.replace('min-block-size: mg-rem(40);', 'min-block-size: mg-rem(36);'),
    ],
    [
      '/stories/Components/UserFeedback/user-feedback.scss',
      s => s.replace('line-height: 1.4;', 'line-height: 1.5;'),
    ],
    [
      '/stories/Components/UserFeedback/UserFeedback.jsx',
      s =>
        s.replace(
          "question: 'Is this page useful?'",
          "question: 'Does this page help?'"
        ),
    ],
    [
      '/stories/Atom/Layout/Grid/grid.scss',
      s => s.replace('repeat(2, 1fr)', 'repeat(2, 2fr)'),
    ],
    [
      '/stories/Atom/Layout/Container/container.scss',
      s => s.replace('padding-left: mg-rem(10);', 'padding-left: mg-rem(12);'),
    ],
    [
      '/stories/Components/Buttons/CtaButton/cta-button.scss',
      s => s.replace('font-weight: 600;', 'font-weight: 500;'),
    ],
    [
      '/stories/assets/scss/_variables.scss',
      s =>
        s.replace(
          '$mg-breakpoint-tablet: 900px;',
          '$mg-breakpoint-tablet: 901px;'
        ),
    ],
    [
      '/stories/assets/fonts/roboto/roboto.scss',
      s => s.replace('@import "sass/Regular";', ''),
    ],
    [
      '/stories/assets/fonts/roboto/sass/_Bold.scss',
      s => s.replace('font-weight: 700;', 'font-weight: 600;'),
    ],
    [
      '/stories/assets/fonts/roboto/sass/_Medium.scss',
      s => s.replace('font-weight: 500;', 'font-weight: 600;'),
    ],
  ])
    changed(file, transform);
  for (const mutate of [
    p => {
      p.variables.find(
        v => v.name === 'component/user-feedback/action-min-height'
      ).id = 'foreign';
    },
    p => {
      p.styles.text.find(
        s => s.id === 'component.user-feedback.question'
      ).name = 'Foreign';
    },
    p => {
      p.variables.push(
        copy(
          p.variables.find(
            v => v.name === 'component/user-feedback/action-min-height'
          )
        )
      );
    },
  ]) {
    const foreign = document();
    mutate(foreign);
    assert.throws(
      () => buildUserFeedbackRecipes({ root, ...foreign }),
      /Foreign or duplicate/
    );
  }
  const value = (name, mode) => {
    const entry = doc.variables.find(v => v.name === name).values[mode.id];
    return entry.alias ? value(entry.alias, mode) : entry;
  };
  for (const mode of doc.modes) {
    const questionStyle = doc.styles.text.find(
      s => s.id === 'component.user-feedback.question'
    );
    assert.strictEqual(
      questionStyle.values[mode.id].fontSize,
      value('font-size/250', mode)
    );
    assert.strictEqual(questionStyle.values[mode.id].lineHeight.value, 140);
    assert.strictEqual(
      value('component/user-feedback/column-width-390', mode),
      370
    );
    assert.strictEqual(
      value('component/user-feedback/column-width-1164', mode),
      (1164 - 20 - value('spacing/200', mode)) / 2
    );
    const env = environment(doc, { sharedOnly: true });
    const imported = await env.call(
      'importVariables',
      doc,
      [mode.id],
      false,
      [],
      true
    );
    assert.deepStrictEqual(copy(imported.errors), []);
    const first = await env.call('buildMangroveComponents', doc, mode.id, [
      'user-feedback',
    ]);
    assert.deepStrictEqual(copy(first.errors), []);
    assert.strictEqual(first.families[0].variantIds.length, 2);
    const vars = new Map(env.state.variables.map(v => [v.name, v.id]));
    const find = (node, name) => node.findAll(n => n.name === name)[0];
    const consumers = [];
    for (const record of first.families[0].variantIds) {
      const master = env.state.nodes.get(record.nodeId),
        recipe = family.variants.find(v => v.id === record.id),
        desktop = recipe.properties.Viewport === 'Desktop';
      assert.strictEqual(master.width, desktop ? 1164 : 390);
      assert.strictEqual(master.minHeight, 72);
      assert.strictEqual(master.paddingLeft, 10);
      assert.strictEqual(master.paddingRight, 10);
      assert.strictEqual(master.paddingTop, value('spacing/100', mode));
      assert.strictEqual(master.itemSpacing, value('spacing/200', mode));
      assert.strictEqual(
        master.layoutMode,
        desktop ? 'HORIZONTAL' : 'VERTICAL'
      );
      const prompt = find(master, 'mg-user-feedback__prompt');
      assert.strictEqual(
        prompt.width,
        value(
          `component/user-feedback/column-width-${desktop ? 1164 : 390}`,
          mode
        )
      );
      assert.strictEqual(prompt.layoutWrap, 'WRAP');
      assert.strictEqual(prompt.counterAxisSpacing, value('spacing/100', mode));
      const question = find(master, 'mg-user-feedback__question');
      assert.strictEqual(question.characters, 'Is this page useful?');
      assert.strictEqual(question.fontSize, value('font-size/250', mode));
      assert.strictEqual(question.fontName.style, 'Bold');
      assert.strictEqual(question.textWrapStyle, 'BALANCE');
      assert.strictEqual(
        question.fills[0].boundVariables.color.id,
        vars.get('color/text')
      );
      const issue = find(master, 'mg-user-feedback__issue');
      assert.strictEqual(issue.textAlignHorizontal, desktop ? 'RIGHT' : 'LEFT');
      assert.strictEqual(issue.textDecoration, 'NONE');
      assert.strictEqual(
        issue.fills[0].boundVariables.color.id,
        vars.get('color/interactive')
      );
      for (const key of ['yes', 'no']) {
        const button = find(master, `mg-button mg-button-secondary (${key})`);
        assert.strictEqual(button.minHeight, 40);
        assert.strictEqual(
          button.boundVariables.minHeight.id,
          vars.get('component/user-feedback/action-min-height')
        );
        assert.strictEqual(
          button.strokeWeight,
          value('border-width/button', mode)
        );
        assert.strictEqual(
          button.fills[0].boundVariables.color.id,
          vars.get('color/button-secondary-background')
        );
        assert.strictEqual(
          button.strokes[0].boundVariables.color.id,
          vars.get('border-color/button-secondary')
        );
        assert.strictEqual(
          button.boundVariables.cornerRadius.id,
          vars.get('radius/button')
        );
        const label = button.children[0];
        assert.strictEqual(label.fontSize, value('font-size/button', mode));
        assert.strictEqual(label.fontName.style, 'Bold');
        assert.strictEqual(
          label.fills[0].boundVariables.color.id,
          vars.get('color/button')
        );
      }
      const instance = master.createInstance();
      instance.x = 111;
      instance.y = 222;
      const property = name =>
        Object.keys(instance.componentProperties).find(
          k => k.replace(/#[^#]+$/, '') === name
        );
      for (const [name, text] of [
        ['Question', 'Useful?'],
        ['Yes', 'Yes please'],
        ['No', 'No thanks'],
        ['Report issue', 'Report issue'],
      ]) {
        assert(property(name));
        instance.setProperties({ [property(name)]: text });
      }
      consumers.push({ instance, property });
    }
    const ids = identities(env);
    for (let i = 0; i < 2; i++) {
      const repeat = await env.call('buildMangroveComponents', doc, mode.id, [
        'user-feedback',
      ]);
      assert.deepStrictEqual(copy(repeat.errors), []);
      assert.strictEqual(repeat.createdNodeIds.length, 0);
      assert.deepStrictEqual(identities(env), ids);
      for (const { instance, property } of consumers) {
        assert.strictEqual(instance.x, 111);
        assert.strictEqual(instance.y, 222);
        for (const [name, text] of [
          ['Question', 'Useful?'],
          ['Yes', 'Yes please'],
          ['No', 'No thanks'],
          ['Report issue', 'Report issue'],
        ])
          assert.strictEqual(
            instance.componentProperties[property(name)].value,
            text
          );
      }
    }
  }
  const blocked = environment(doc, { rejectedFonts: ['Roboto Bold'] });
  await importFoundation(blocked, doc);
  const blockedSnapshot = () =>
    [...blocked.state.nodes.values()].map(n => [n.id, identity(n)]);
  const before = blockedSnapshot();
  const failed = await blocked.call('buildMangroveComponents', doc, 'undrr', [
    'user-feedback',
  ]);
  assert.strictEqual(failed.families.length, 0);
  assert(failed.errors.some(e => e.includes('Roboto Bold')));
  assert.deepStrictEqual(blockedSnapshot(), before);
  console.log(
    'ok  UserFeedback fixed Mobile/Desktop initial source geometry, local40px actions and paints, all-five-brand bindings, two zero-create repeats and all-label retention; source/identity/font refusal'
  );
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
