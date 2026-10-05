#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const capabilityContext = { module: { exports: {} } };
vm.runInNewContext(
  fs.readFileSync(path.join(__dirname, '../kit-rich-text.js'), 'utf8'),
  capabilityContext
);
const rich = capabilityContext.module.exports;
const clone = value => JSON.parse(JSON.stringify(value));
const font = style => ({ family: 'Roboto', style });
function environment() {
  const state = {
    created: 0,
    mutations: 0,
    loaded: new Set(),
    nodes: [],
    refuseFont: null,
  };
  const styles = new Map([
    [
      'body',
      {
        key: 'body',
        style: { type: 'TEXT', id: 'style-body', fontName: font('Regular') },
      },
    ],
    [
      'strong',
      {
        key: 'strong',
        style: { type: 'TEXT', id: 'style-strong', fontName: font('Bold') },
      },
    ],
  ]);
  const colors = new Map(
    ['text', 'link'].map((key, index) => [
      key,
      {
        key,
        variable: { id: `color-${key}`, resolvedType: 'COLOR' },
        values: Object.fromEntries(
          ['UNDRR', 'DELTA', 'IRP', 'MCR', 'PW'].map((mode, i) => [
            mode,
            { r: index ? i / 10 : 0, g: index ? 0.2 : 0, b: index ? 0.7 : 0 },
          ])
        ),
      },
    ])
  );
  const ctx = {
    modeIds: ['UNDRR', 'DELTA', 'IRP', 'MCR', 'PW'],
    creationFont: font('Regular'),
    resolveStyle: key => styles.get(key),
    resolveColor: key => colors.get(key),
    readState: node => node.ledger,
    writeState: (node, value) => {
      state.mutations++;
      node.ledger = value;
    },
    figma: {
      loadFontAsync: async value => {
        await Promise.resolve();
        if (value.style === state.refuseFont) throw new Error('missing font');
        state.loaded.add(JSON.stringify(value));
      },
      variables: {
        setBoundVariableForPaint: (paint, field, variable) => ({
          ...clone(paint),
          boundVariables: {
            [field]: { type: 'VARIABLE_ALIAS', id: variable.id },
          },
        }),
      },
    },
  };
  function node() {
    const result = {
      type: 'TEXT',
      id: `native-${++state.created}`,
      fontName: font('Regular'),
      componentPropertyReferences: {},
      ledger: '',
      cells: [],
      value: '',
      get characters() {
        return this.value;
      },
      set characters(value) {
        loaded(this.fontName);
        state.mutations++;
        this.value = value;
        this.cells = Array.from({ length: value.length }, () => ({}));
      },
      getStyledTextSegments(fields) {
        const segments = [];
        for (let i = 0; i < this.value.length; i++) {
          const value = Object.fromEntries(
            fields.map(field => [field, this.cells[i][field]])
          );
          const key = JSON.stringify(value),
            previous = segments[segments.length - 1];
          if (previous?.key === key) {
            previous.end++;
            previous.characters += this.value[i];
          } else
            segments.push({
              ...clone(value),
              start: i,
              end: i + 1,
              characters: this.value[i],
              key,
            });
        }
        return segments;
      },
      async setRangeTextStyleIdAsync(start, end, id) {
        await Promise.resolve();
        const item = [...styles.values()].find(v => v.style.id === id);
        loaded(item.style.fontName);
        mutate(this, start, end, {
          textStyleId: id,
          fontName: item.style.fontName,
        });
      },
      setRangeFills(start, end, fills) {
        mutate(this, start, end, { fills });
      },
      setRangeTextDecoration(start, end, textDecoration) {
        mutate(this, start, end, { textDecoration });
      },
      setRangeHyperlink(start, end, hyperlink) {
        mutate(this, start, end, { hyperlink });
      },
      edit(start, end, text) {
        const exemplar = clone(this.cells[start] || this.cells[start - 1]);
        this.value = this.value.slice(0, start) + text + this.value.slice(end);
        this.cells.splice(
          start,
          end - start,
          ...Array.from({ length: text.length }, () => clone(exemplar))
        );
      },
    };
    state.nodes.push(result);
    return result;
  }
  function loaded(value) {
    assert(
      state.loaded.has(JSON.stringify(value)),
      'font was not awaited before mutation'
    );
  }
  function mutate(target, start, end, values) {
    assert(start >= 0 && end <= target.characters.length && start < end);
    state.mutations++;
    for (let i = start; i < end; i++)
      Object.assign(target.cells[i], clone(values));
  }
  const snapshot = () =>
    JSON.stringify({
      created: state.created,
      mutations: state.mutations,
      nodes: state.nodes.map(n => ({
        id: n.id,
        value: n.value,
        cells: n.cells,
        ledger: n.ledger,
        refs: n.componentPropertyReferences,
      })),
    });
  return { ctx, state, styles, colors, node, snapshot };
}
function spec(parts, id = 'confirmation') {
  let start = 0;
  return {
    type: 'TEXT',
    id,
    characters: parts.map(p => p.text).join(''),
    textRuns: parts.map((part, index) => {
      const run = {
        id: `run-${index}`,
        start,
        end: start + part.text.length,
        textStyle: part.style || 'body',
        fill: part.link ? 'link' : 'text',
        ...(part.link
          ? {
              hyperlink: { type: 'URL', value: part.link },
              textDecoration: 'UNDERLINE',
            }
          : {}),
      };
      start = run.end;
      return run;
    }),
  };
}
async function rebuild(env, recipe, existing) {
  const plan = await rich.prepare(recipe, env.ctx, existing);
  const target = existing || env.node();
  await rich.apply(plan, target);
  return target;
}
async function refuses(env, recipe, node, pattern = /Rich text/) {
  const before = env.snapshot();
  await assert.rejects(() => rich.prepare(recipe, env.ctx, node), pattern);
  assert.strictEqual(env.snapshot(), before, 'preflight refusal mutated nodes');
}
async function main() {
  const source = fs.readFileSync(
    path.resolve(
      __dirname,
      '../../../stories/Components/UserFeedback/UserFeedback.jsx'
    ),
    'utf8'
  );
  const labels = key => {
    const match = source.match(new RegExp(`${key}:\\s*'([^']*)'`));
    assert(match, key);
    return match[1];
  };
  const recipe = spec([
    {
      text: labels('confirmationBeforeLink') + labels('confirmationSeparator'),
    },
    {
      text: labels('confirmationLink'),
      link: 'https://www.undrr.org/contact/website-feedback',
    },
    { text: labels('confirmationAfterLink') },
  ]);
  assert(
    source.includes(
      "feedbackUrl = 'https://www.undrr.org/contact/website-feedback'"
    )
  );
  const env = environment();
  const target = await rebuild(env, recipe);
  const id = target.id;
  for (let i = 0; i < 2; i++) {
    const created = env.state.created;
    await rebuild(env, recipe, target);
    assert.strictEqual(env.state.created, created);
    assert.strictEqual(target.id, id);
  }
  const linkStart = target.characters.indexOf('tell us more');
  target.edit(
    linkStart,
    linkStart + 'tell us more'.length,
    'share additional details'
  );
  target.edit(0, 5, 'Many thanks');
  const edited = target.characters;
  for (let i = 0; i < 2; i++) {
    await rebuild(env, recipe, target);
    assert.strictEqual(target.characters, edited);
    assert.strictEqual(target.id, id);
  }
  const links = target
    .getStyledTextSegments(['hyperlink'])
    .filter(s => s.hyperlink);
  assert.strictEqual(links.length, 1);
  assert.strictEqual(links[0].characters, 'share additional details');
  const migration = clone(recipe);
  migration.textRuns[1].hyperlink.value = 'https://www.undrr.org/contact-us';
  await rebuild(env, migration, target);
  assert.strictEqual(
    target.getStyledTextSegments(['hyperlink']).find(s => s.hyperlink).hyperlink
      .value,
    migration.textRuns[1].hyperlink.value
  );
  const articleSource = fs.readFileSync(
    path.resolve(
      __dirname,
      '../../../stories/Patterns/ArticleStory/ArticleStory.jsx'
    ),
    'utf8'
  );
  assert(
    articleSource.includes('<strong>45</strong>') &&
      articleSource.includes('<strong>11</strong>')
  );
  const article = spec(
    [
      { text: '45', style: 'strong' },
      { text: ' participants from Indigenous communities across ' },
      { text: '11', style: 'strong' },
      { text: ' countries.' },
    ],
    'article-highlight'
  );
  const articleNode = await rebuild(env, article);
  articleNode.edit(0, 2, '50');
  const articleEdit = articleNode.characters;
  await rebuild(env, article, articleNode);
  await rebuild(env, article, articleNode);
  assert.strictEqual(articleNode.characters, articleEdit);
  assert(env.state.loaded.has(JSON.stringify(font('Bold'))));
  const linkedArticle = spec(
    [
      { text: 'For more information, read ' },
      {
        text: 'Words into Action',
        link: 'https://www.undrr.org/words-into-action',
      },
      { text: '.' },
    ],
    'article-link'
  );
  assert(articleSource.includes('https://www.undrr.org/words-into-action'));
  await rebuild(env, linkedArticle);
  for (const mutate of [
    s => s.textRuns[1].start--,
    s => s.textRuns[0].end++,
    s => (s.textRuns[1].id = s.textRuns[0].id),
    s => (s.textRuns[0].textStyle = 'missing'),
    s => (s.textRuns[0].fill = 'missing'),
    s => (s.textRuns[1].hyperlink.value = 'javascript:alert(1)'),
    s => (s.textProperty = 'Body'),
    s => (s.textRuns[1].unexpected = true),
  ]) {
    const bad = clone(recipe);
    mutate(bad);
    await refuses(env, bad, null);
  }
  const utf = spec([
    { text: 'A😀', style: 'body' },
    { text: 'B', style: 'strong' },
  ]);
  utf.textRuns[0].end = utf.textRuns[1].start = 2;
  await refuses(env, utf, null);
  const same = spec([{ text: 'one' }, { text: 'two' }]);
  await refuses(env, same, null, /indistinguishable/);
  const goodStyle = env.styles.get('body');
  env.styles.set('body', { ...goodStyle, key: 'foreign' });
  await refuses(env, recipe, null);
  env.styles.set('body', goodStyle);
  const goodColor = env.colors.get('text');
  env.colors.set('text', {
    ...goodColor,
    variable: { id: 'foreign', resolvedType: 'FLOAT' },
  });
  await refuses(env, recipe, null);
  env.colors.set('text', goodColor);
  const modeColor = clone(goodColor);
  delete modeColor.values.IRP;
  env.colors.set('text', modeColor);
  await refuses(env, recipe, null);
  env.colors.set('text', goodColor);
  env.state.refuseFont = 'Bold';
  await refuses(env, article, articleNode, /missing font/);
  env.state.refuseFont = null;
  target.componentPropertyReferences.characters = 'Body#1';
  await refuses(env, migration, target, /property resets/);
  target.componentPropertyReferences = {};
  const unsafe = environment(),
    unsafeNode = await rebuild(unsafe, recipe);
  unsafeNode.edit(recipe.textRuns[1].start, recipe.textRuns[1].end, '');
  await refuses(unsafe, recipe, unsafeNode, /ownership/);
  const changed = environment(),
    changedNode = await rebuild(changed, recipe);
  const plan = await rich.prepare(recipe, changed.ctx, changedNode);
  changedNode.edit(0, 1, 'X');
  const after = changed.snapshot();
  await assert.rejects(() => rich.apply(plan, changedNode), /changed after/);
  assert.strictEqual(changed.snapshot(), after);
  const formatting = environment(),
    formatted = await rebuild(formatting, recipe);
  formatted.cells[0].textStyleId = 'foreign';
  await refuses(formatting, recipe, formatted, /ownership/);
  const reset = environment(),
    resetNode = await rebuild(reset, recipe);
  resetNode.characters = 'A plain reset';
  await refuses(reset, recipe, resetNode, /unsupported|identity|paint/);
  const dependency = environment(),
    dependencyNode = await rebuild(dependency, recipe);
  const dependencyPlan = await rich.prepare(
    recipe,
    dependency.ctx,
    dependencyNode
  );
  dependency.styles.get('body').style.fontName = font('Foreign');
  const dependencySnapshot = dependency.snapshot();
  await assert.rejects(
    () => rich.apply(dependencyPlan, dependencyNode),
    /dependencies changed/
  );
  assert.strictEqual(dependency.snapshot(), dependencySnapshot);
  const property = environment(),
    propertyNode = await rebuild(property, recipe);
  const propertyPlan = await rich.prepare(recipe, property.ctx, propertyNode);
  propertyNode.componentPropertyReferences.characters = 'Body#changed';
  const propertySnapshot = property.snapshot();
  await assert.rejects(
    () => rich.apply(propertyPlan, propertyNode),
    /unsafe component property/
  );
  assert.strictEqual(property.snapshot(), propertySnapshot);
  const pending = environment();
  const projectedBody = {
    key: 'body',
    pending: true,
    style: { type: 'TEXT', id: null, fontName: font('Regular') },
  };
  const projectedCtx = {
    ...pending.ctx,
    deferredStyles: true,
    resolveStyle: key =>
      key === 'body' ? projectedBody : pending.ctx.resolveStyle(key),
  };
  const pendingPlan = await rich.prepare(recipe, projectedCtx);
  const pendingTarget = pending.node();
  const pendingBaseline = pending.snapshot();
  await assert.rejects(
    () => rich.apply(pendingPlan, pendingTarget),
    /must be finalized/
  );
  assert.strictEqual(pending.snapshot(), pendingBaseline);
  rich.finalize(pendingPlan, pending.ctx);
  await rich.apply(pendingPlan, pendingTarget);
  assert.strictEqual(pendingTarget.characters, recipe.characters);
  const upgraded = environment(),
    upgradedNode = await rebuild(upgraded, recipe);
  upgradedNode.edit(0, 5, 'Many thanks');
  const desired = {
    ...upgraded.ctx,
    deferredStyles: true,
    resolveStyle: key => ({
      ...upgraded.ctx.resolveStyle(key),
      style: {
        ...upgraded.ctx.resolveStyle(key).style,
        fontName: font('Bold'),
      },
    }),
  };
  const upgradePlan = await rich.prepare(recipe, desired, upgradedNode);
  for (const entry of upgraded.styles.values())
    entry.style.fontName = font('Bold');
  for (const cell of upgradedNode.cells) cell.fontName = font('Bold');
  const retained = upgradedNode.characters;
  rich.finalize(upgradePlan, upgraded.ctx);
  await rich.apply(upgradePlan, upgradedNode);
  assert.strictEqual(upgradedNode.characters, retained);
  const unexpected = environment(),
    unexpectedNode = await rebuild(unexpected, recipe);
  const unexpectedPlan = await rich.prepare(
    recipe,
    { ...unexpected.ctx, deferredStyles: true },
    unexpectedNode
  );
  unexpectedNode.cells[recipe.textRuns[1].start].hyperlink.value =
    'https://foreign.example/';
  const unexpectedBaseline = unexpected.snapshot();
  assert.throws(
    () => rich.finalize(unexpectedPlan, unexpected.ctx),
    /range change|target changed/
  );
  assert.strictEqual(unexpected.snapshot(), unexpectedBaseline);
  // Real FontName reads include all variable axes. Named source inputs must
  // resolve through the native inventory, while every axis remains owned.
  const inventory = [
    {
      fontName: {
        family: 'Roboto',
        style: 'Regular',
        variationSettings: { wdth: 100, wght: 400 },
      },
    },
    {
      fontName: {
        family: 'Roboto',
        style: 'Bold',
        variationSettings: { wdth: 100, wght: 700 },
      },
    },
  ];
  const concrete = rich.resolveFontInput(font('Regular'), inventory);
  assert.throws(
    () =>
      rich.resolveFontInput(
        font('Regular'),
        [{ fontName: font('Regular') }],
        ['wght']
      ),
    /default axes are unresolved/
  );
  assert.throws(
    () => rich.resolveFontInput(font('Regular'), inventory, null),
    /default axes are unresolved/
  );
  assert.throws(
    () => rich.resolveFontInput(font('Regular'), inventory, ['wght']),
    /default axes are unresolved/
  );
  rich.resolveFontInput(font('Regular'), inventory, ['wght', 'wdth']);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(concrete)), {
    family: 'Roboto',
    style: 'Regular',
    variationSettings: { wdth: 100, wght: 400 },
  });
  assert.throws(
    () =>
      rich.resolveFontInput(
        { ...font('Regular'), variationSettings: { wght: 450 } },
        inventory
      ),
    /axes disagree/
  );
  assert.throws(
    () =>
      rich.resolveFontInput(font('Regular'), [
        ...inventory,
        { fontName: { ...font('Regular'), variationSettings: { wght: 450 } } },
      ]),
    /ambiguous/
  );
  assert.throws(
    () => rich.resolveFontInput(font('Foreign'), inventory),
    /inventory/
  );
  assert.throws(
    () =>
      rich.resolveFontInput(
        { ...font('Regular'), variationSettings: { wght: NaN } },
        inventory
      ),
    /unsupported/
  );
  const variable = environment();
  variable.ctx.creationFont = concrete;
  for (const entry of variable.styles.values())
    entry.style.fontName = rich.resolveFontInput(
      entry.style.fontName,
      inventory
    );
  const variablePlan = await rich.prepare(recipe, variable.ctx);
  const variableNode = variable.node();
  variableNode.fontName = concrete;
  await rich.apply(variablePlan, variableNode);
  for (let i = 0; i < 2; i++) await rebuild(variable, recipe, variableNode);
  assert.strictEqual(variable.state.created, 1);
  variableNode.cells[0].fontName.variationSettings.wght = 450;
  await refuses(variable, recipe, variableNode, /ownership/);
  const variablePending = environment();
  variablePending.ctx.creationFont = concrete;
  for (const entry of variablePending.styles.values())
    entry.style.fontName = rich.resolveFontInput(
      entry.style.fontName,
      inventory
    );
  const concreteProjected = { ...variablePending.ctx, deferredStyles: true };
  const variablePendingPlan = await rich.prepare(recipe, concreteProjected);
  rich.finalize(variablePendingPlan, variablePending.ctx);
  const variablePendingNode = variablePending.node();
  variablePendingNode.fontName = concrete;
  await rich.apply(variablePendingPlan, variablePendingNode);
  const axisPlan = await rich.prepare(
    recipe,
    { ...variablePending.ctx, deferredStyles: true },
    variablePendingNode
  );
  variablePending.styles.get('body').style.fontName.variationSettings.wght =
    450;
  const axisBefore = variablePending.snapshot();
  assert.throws(
    () => rich.finalize(axisPlan, variablePending.ctx),
    /dependencies changed/
  );
  assert.strictEqual(variablePending.snapshot(), axisBefore);
  console.log(
    'Rich TEXT isolated harness passes: source linked/strong fixtures, identity, two zero-create repeats, edited run boundaries, dependency/font/property/ownership refusal. Native integration remains unverified.'
  );
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
