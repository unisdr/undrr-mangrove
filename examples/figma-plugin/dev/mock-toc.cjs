#!/usr/bin/env node
/** TOC source/identity/API contracts. This mock does not render or compute text flow. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { environment, importFoundation } = require('./mock-kit.cjs');
const { buildTocRecipes } = require('../../../scripts/figma-toc-recipes.cjs');
const {
  buildFigmaVariables,
} = require('../../../scripts/build-figma-tokens.cjs');
const root = path.resolve(__dirname, '../../..');
const copy = value => JSON.parse(JSON.stringify(value));
const id = (node, key = 'mgKitId') =>
  node.getSharedPluginData('orgundrrmangrove', key);
function document() {
  const doc = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
  );
  const families = buildTocRecipes({ root, ...doc });
  doc.components.families = [
    ...doc.components.families.filter(
      f => !families.some(next => next.id === f.id)
    ),
    ...families,
  ];
  return doc;
}
function create(doc, options) {
  const env = environment(doc, options);
  const createText = env.figma.createText;
  env.figma.createText = () => {
    const text = createText(),
      bind = text.setBoundVariable;
    text.setBoundVariable = function (field, variable) {
      if (field === 'maxWidth')
        throw new Error("invalid field for text node: 'maxWidth'");
      return bind.call(this, field, variable);
    };
    return text;
  };
  return env;
}
function changed(file, before, after, check) {
  const read = fs.readFileSync;
  let matched = false;
  fs.readFileSync = function (filename, ...args) {
    const result = read.call(this, filename, ...args);
    if (typeof filename !== 'string' || !filename.endsWith(file)) return result;
    const next = result.replace(before, after);
    matched = next !== result;
    return next;
  };
  try {
    check();
    assert(matched, `Mutation did not match ${file}`);
  } finally {
    fs.readFileSync = read;
  }
}
const find = (node, name) => node.findAll(n => n.name === name)[0];
function property(node, name) {
  const key = Object.keys(node.componentProperties).find(
    k => k.replace(/#[^#]+$/, '') === name
  );
  assert(key, `Missing property ${name}`);
  return key;
}
function identities(env) {
  return [...env.state.nodes.values()]
    .filter(n => id(n))
    .map(n => [id(n), n.id])
    .sort((a, b) => a[0].localeCompare(b[0]));
}
async function main() {
  const doc = document(),
    families = doc.components.families.filter(f =>
      ['toc-link', 'table-of-contents'].includes(f.id)
    );
  const links = families.find(f => f.id === 'toc-link'),
    toc = families.find(f => f.id === 'table-of-contents');
  assert.strictEqual(links.variants.length, 12);
  assert.strictEqual(links.review.width, 900);
  assert.strictEqual(toc.variants.length, 3);
  assert(toc.variants.every(v => v.properties.ListStyle === 'Numbered'));
  assert(toc.coverage.pending.some(s => s.includes('Bulleted')));
  assert(toc.description.includes('unsupported'));
  const assetIds = {
    variables: doc.variables.map(v => v.id),
    styles: doc.styles.text.map(s => s.id),
  };
  assert.deepStrictEqual(buildTocRecipes({ root, ...doc }), families);
  assert.deepStrictEqual(
    {
      variables: doc.variables.map(v => v.id),
      styles: doc.styles.text.map(s => s.id),
    },
    assetIds
  );
  assert.strictEqual(
    doc.variables.filter(v => v.name.startsWith('component/table-of-contents/'))
      .length,
    4
  );
  assert.strictEqual(
    doc.styles.text.filter(s => s.id.startsWith('component.table-of-contents.'))
      .length,
    3
  );
  for (const [file, before, after] of [
    [
      '/stories/Components/TableOfContents/table-of-contents.scss',
      'border-inline-start: 2px',
      'border-inline-start: 3px',
    ],
    [
      '/stories/Components/TableOfContents/table-of-contents.scss',
      'display: inline-block;',
      'display: block;',
    ],
    [
      '/stories/Components/TableOfContents/table-of-contents.scss',
      'text-underline-offset: 0.15em;',
      'text-underline-offset: 0.2em;',
    ],
    [
      '/stories/Components/TableOfContents/table-of-contents.scss',
      '@include mg-focus-ring;',
      '@include mg-focus-ring-inset;',
    ],
    [
      '/stories/Components/TableOfContents/table-of-contents.scss',
      'var(--mg-color-interactive-active)',
      'var(--mg-color-text)',
    ],
    [
      '/stories/Components/TableOfContents/TableOfContents.jsx',
      'showNumbers = false',
      'showNumbers = true',
    ],
    [
      '/stories/Components/TableOfContents/TableOfContents.jsx',
      '{item.text}',
      '{item.title}',
    ],
    [
      '/stories/Components/TableOfContents/TableOfContents.stories.jsx',
      'What is the Sendai Framework for DRR?',
      'Another link',
    ],
    [
      '/stories/assets/js/table-of-contents.js',
      "querySelectorAll('h2')",
      "querySelectorAll('h2, h3')",
    ],
    [
      '/stories/assets/scss/_foundational.scss',
      'text-wrap: balance;',
      'text-wrap: pretty;',
    ],
    [
      '/stories/assets/scss/_foundational.scss',
      'line-height: 1.1;',
      'line-height: 1.2;',
    ],
    [
      '/stories/assets/scss/_mixins.scss',
      'outline-offset: var(--mg-focus-ring-offset);',
      'outline-offset: 0;',
    ],
    ['/tokens/mangrove.yaml', "$value: '1.5em'", "$value: '1.6em'"],
    [
      '/stories/assets/fonts/roboto/sass/_Regular.scss',
      'font-weight: 400;',
      'font-weight: 500;',
    ],
  ])
    changed(file, before, after, () =>
      assert.throws(document, /TOC recipe needs updating/)
    );
  const wrong = copy(doc);
  wrong.variables.find(v => v.name === 'spacing/25').values.undrr = 3;
  assert.throws(
    () => buildTocRecipes({ root, ...wrong }),
    /Measured Latin source role/
  );
  console.log(
    'ok  idempotent12-link/3-numbered inventory, exact source guards, role checks and honest unsupported coverage'
  );

  const names = new Map(doc.variables.map(v => [v.name, v]));
  const value = (name, mode) => {
    const v = names.get(name).values[mode];
    return v.alias ? value(v.alias, mode) : v;
  };
  for (const mode of doc.modes)
    for (const width of [240, 390, 900]) {
      assert.strictEqual(
        value(`component/table-of-contents/link-cap-${width}`, mode.id),
        width - 44.5
      );
    }
  for (const recipe of links.variants) {
    const tree = recipe.tree;
    assert.strictEqual(tree.layout.width, 'HUG');
    assert.strictEqual(
      tree.layout.maxWidth,
      `component/table-of-contents/link-cap-${recipe.properties.MeasuredWidth}`
    );
    assert.strictEqual(tree.children[0].layout.width, 'FILL');
    assert.strictEqual(tree.children[0].textStyleApplication, 'DIRECT');
    assert.strictEqual(tree.children[0].textDecoration, 'UNDERLINE');
    assert.deepStrictEqual(tree.children[0].textDecorationOffset, {
      unit: 'PERCENT',
      value: 15,
    });
    if (recipe.properties.State.includes('Focus')) {
      assert.strictEqual(tree.focusRing.radius, 'spacing/0');
      assert.strictEqual(tree.focusRing.outerRadius, 'spacing/0');
    } else assert.strictEqual(tree.focusRing, undefined);
  }
  function staleHoverRange(env, node) {
    if (node.name !== 'Link label') return null;
    const hover = env.state.variables.find(
      v => v.name === 'color/interactive-active'
    );
    const rgba = hover.resolveForConsumer(node).value;
    return [
      env.figma.variables.setBoundVariableForPaint(
        {
          type: 'SOLID',
          color: { r: rgba.r, g: rgba.g, b: rgba.b },
          opacity: rgba.a ?? 1,
        },
        'color',
        hover
      ),
    ];
  }
  const env = create(doc, {
    rejectedFonts: ['Roboto Condensed Regular', 'Roboto Condensed Bold'],
    staleTextRangeFillsAfterStyle: node => staleHoverRange(env, node),
  });
  await importFoundation(env, doc);
  const built = await env.call('buildMangroveComponents', doc, 'undrr', [
    'table-of-contents',
  ]);
  assert.deepStrictEqual(copy(built.errors), []);
  assert.deepStrictEqual(
    copy(built.families.map(f => [f.id, f.variantIds.length])),
    [
      ['toc-link', 12],
      ['table-of-contents', 3],
    ]
  );
  const variables = new Map(env.state.variables.map(v => [v.name, v]));
  const localStyles = new Map(
    env.state.styles.map(s => [id(s, 'mgStyleId'), s])
  );
  const linkResult = built.families.find(f => f.id === 'toc-link'),
    tocResult = built.families.find(f => f.id === 'table-of-contents');
  for (const variant of linkResult.variantIds) {
    const node = env.state.nodes.get(variant.nodeId),
      spec = links.variants.find(v => v.id === variant.id),
      label = find(node, 'Link label');
    assert.strictEqual(node.layoutSizingHorizontal, 'HUG');
    assert.strictEqual(node.layoutSizingVertical, 'HUG');
    assert.strictEqual(
      node.maxWidth,
      Number(spec.properties.MeasuredWidth) - 44.5
    );
    assert.strictEqual(
      node.boundVariables.maxWidth.id,
      variables.get(spec.tree.layout.maxWidth).id
    );
    assert.strictEqual(node.paddingTop, 2.5);
    assert.strictEqual(node.paddingBottom, 2.5);
    assert.strictEqual(node.clipsContent, false);
    assert.deepStrictEqual(copy(node.fills), []);
    assert.strictEqual(label.textAutoResize, 'HEIGHT');
    assert.strictEqual(label.layoutSizingHorizontal, 'FILL');
    assert.strictEqual(label.boundVariables.maxWidth, undefined);
    assert.strictEqual(label.textStyleId, '');
    assert(
      localStyles.get('component.table-of-contents.link'),
      'Required source template remains imported'
    );
    for (const [field, role] of [
      ['fontFamily', 'font-family/text'],
      ['fontSize', 'font-size/300'],
    ])
      assert.strictEqual(
        label.boundVariables[field].id,
        variables.get(role).id
      );
    assert.strictEqual(label.fontSize, 16);
    assert.strictEqual(label.textDecoration, 'UNDERLINE');
    assert.deepStrictEqual(copy(label.textDecorationOffset), {
      unit: 'PERCENT',
      value: 15,
    });
    assert.deepStrictEqual(copy(label.fontName), {
      family: 'Roboto',
      style: 'Regular',
    });
    assert.deepStrictEqual(copy(label.lineHeight), {
      unit: 'PERCENT',
      value: 150,
    });
    const color = spec.properties.State.includes('Hover')
      ? 'color/interactive-active'
      : 'color/interactive';
    assert.strictEqual(
      label.fills[0].boundVariables.color.id,
      variables.get(color).id
    );
    assert.deepStrictEqual(
      label.getRangeFills(0, label.characters.length),
      copy(label.fills),
      `Effective range paint differs for ${variant.id}`
    );
    const rings = node.children.filter(child => id(child).includes('/focus/'));
    assert.strictEqual(
      rings.length,
      spec.properties.State.includes('Focus') ? 2 : 0
    );
    for (const ring of rings) assert.strictEqual(ring.cornerRadius, 0);
  }
  for (const variant of tocResult.variantIds) {
    const node = env.state.nodes.get(variant.nodeId),
      spec = toc.variants.find(v => v.id === variant.id),
      width = Number(spec.properties.MeasuredWidth);
    assert.strictEqual(node.width, width);
    assert.strictEqual(node.layoutSizingVertical, 'HUG');
    assert.strictEqual(node.strokeLeftWeight, 2);
    for (const field of [
      'strokeTopWeight',
      'strokeRightWeight',
      'strokeBottomWeight',
    ])
      assert.strictEqual(node[field], 0);
    assert.strictEqual(node.strokesIncludedInLayout, true);
    assert.strictEqual(node.paddingLeft, 20);
    assert.strictEqual(node.itemSpacing, 10);
    assert.strictEqual(node.clipsContent, false);
    const title = find(node, 'On this page heading'),
      list = find(node, 'ol / six source links');
    assert.strictEqual(title.characters, 'On this page');
    assert.strictEqual(
      title.textStyleId,
      localStyles.get('component.table-of-contents.title').id
    );
    assert.strictEqual(title.textWrapStyle, 'BALANCE');
    assert.deepStrictEqual(copy(title.fontName), {
      family: 'Roboto',
      style: 'Bold',
    });
    assert.strictEqual(title.fontSize, 18);
    assert.deepStrictEqual(copy(title.lineHeight), {
      unit: 'PERCENT',
      value: 110,
    });
    assert.strictEqual(list.children.length, 6);
    assert.strictEqual(list.itemSpacing, 5);
    for (const [i, row] of list.children.entries()) {
      assert.strictEqual(row.counterAxisAlignItems, 'MAX');
      assert.strictEqual(row.itemSpacing, 2.5);
      const marker = row.children[0],
        number = marker.children[0],
        link = row.children[1];
      assert.strictEqual(marker.width, 20);
      assert.strictEqual(marker.paddingBottom, 2.5);
      assert.strictEqual(marker.layoutSizingVertical, 'HUG');
      assert.strictEqual(number.characters, `${i + 1}.`);
      assert.strictEqual(number.textAlignHorizontal, 'RIGHT');
      assert.deepStrictEqual(copy(number.lineHeight), {
        unit: 'PERCENT',
        value: 150,
      });
      assert.strictEqual(number.textDecoration, 'NONE');
      assert.strictEqual(link.type, 'INSTANCE');
      assert.strictEqual(link.isExposedInstance, true);
      assert.strictEqual(
        link.componentProperties[property(link, 'Label')].value,
        spec.tree.children[1].children[i].children[1].overrides.Label
      );
      const main = await link.getMainComponentAsync();
      assert.strictEqual(
        id(main),
        `family/toc-link/variant/toc-link.${width}.default`
      );
      const label = find(link, 'Link label');
      assert.strictEqual(
        label.getRangeFills(0, label.characters.length)[0].boundVariables.color
          .id,
        variables.get('color/interactive').id,
        'Composed unedited text inherits current Default master range paint'
      );
    }
  }
  console.log(
    'ok  FRAME-only cap binding, loaded typography, square focus, last-line marker anatomy and6editable exposed native links'
  );

  // Existing review consumers are intentional user edits; normal repeats preserve them.
  const review = [...env.state.nodes.values()].find(
    n =>
      id(n) ===
      'review/table-of-contents/specimen/table-of-contents.numbered.240/instance'
  );
  assert(review, 'Missing exact-owned240review specimen');
  review.setProperties({
    [property(review, 'Title')]: 'Edited long title retained',
  });
  const nested = find(review, 'Link 1'),
    text = find(nested, 'Link label');
  nested.setProperties({
    [property(nested, 'Label')]: 'Edited French consumer link',
  });
  await env.figma.loadFontAsync(text.fontName);
  text.textAlignHorizontal = 'RIGHT';
  const editedRange = [
    { type: 'SOLID', color: { r: 0.2, g: 0.3, b: 0.4 }, opacity: 1 },
  ];
  text.setRangeFills(0, text.characters.length, editedRange);
  const unedited = find(review, 'Link 2'),
    uneditedText = find(unedited, 'Link label');
  review.setBoundVariable('width', null);
  review.resize(250, review.height);
  // Simulate an existing associated master with the observed independent stale
  // range. The mock does not reproduce cross-variant native cache coupling.
  const transition = find(
    env.state.nodes.get(
      linkResult.variantIds.find(v => v.id === 'toc-link.240.default').nodeId
    ),
    'Link label'
  );
  await transition.setTextStyleIdAsync(
    localStyles.get('component.table-of-contents.link').id
  );
  assert.strictEqual(
    transition.getRangeFills(0, transition.characters.length)[0].boundVariables
      .color.id,
    variables.get('color/interactive-active').id
  );
  const before = identities(env),
    setDefinitions = [linkResult, tocResult].map(r =>
      copy(env.state.nodes.get(r.setId).componentPropertyDefinitions)
    );
  const repeat = await env.call('buildMangroveComponents', doc, 'undrr', [
    'table-of-contents',
  ]);
  assert.deepStrictEqual(copy(repeat.errors), []);
  assert.strictEqual(repeat.createdNodeIds.length, 0);
  assert.strictEqual(transition.textStyleId, '');
  assert.strictEqual(
    transition.getRangeFills(0, transition.characters.length)[0].boundVariables
      .color.id,
    variables.get('color/interactive').id
  );
  for (const [field, role] of [
    ['fontFamily', 'font-family/text'],
    ['fontSize', 'font-size/300'],
  ])
    assert.strictEqual(
      transition.boundVariables[field].id,
      variables.get(role).id
    );
  assert.deepStrictEqual(identities(env), before);
  assert.deepStrictEqual(
    [linkResult, tocResult].map(r =>
      copy(env.state.nodes.get(r.setId).componentPropertyDefinitions)
    ),
    setDefinitions
  );
  assert.strictEqual(
    review.componentProperties[property(review, 'Title')].value,
    'Edited long title retained'
  );
  assert.strictEqual(
    nested.componentProperties[property(nested, 'Label')].value,
    'Edited French consumer link'
  );
  assert.strictEqual(text.textAlignHorizontal, 'RIGHT');
  assert.deepStrictEqual(
    text.getRangeFills(0, text.characters.length),
    editedRange,
    'An explicit consumer range override survives the modelled repeat'
  );
  assert.strictEqual(text.boundVariables.textRangeFills, undefined);
  assert.strictEqual(
    uneditedText.getRangeFills(0, uneditedText.characters.length)[0]
      .boundVariables.color.id,
    variables.get('color/interactive').id,
    'An unedited consumer inherits the modelled master range'
  );
  assert.strictEqual(review.width, 250);
  assert.strictEqual(find(nested, 'Link label').id, text.id);
  console.log(
    'ok  modelled repeat preserves IDs, edited text, width and direct consumer paint/alignment; native range coupling is tested separately'
  );

  // Negative control: node.fills alone cannot prove the native range fix.
  const associated = copy(doc);
  associated.components.families
    .find(f => f.id === 'toc-link')
    .variants.forEach(v => {
      delete v.tree.children[0].textStyleApplication;
    });
  const withoutReset = create(associated, {
    staleTextRangeFillsAfterStyle: node => staleHoverRange(withoutReset, node),
  });
  await importFoundation(withoutReset, associated);
  const unfixed = await withoutReset.call(
    'buildMangroveComponents',
    associated,
    'undrr',
    ['toc-link']
  );
  assert.deepStrictEqual(copy(unfixed.errors), []);
  const missingReset = find(
    withoutReset.state.nodes.get(
      unfixed.families[0].variantIds.find(v => v.id === 'toc-link.240.default')
        .nodeId
    ),
    'Link label'
  );
  assert.notStrictEqual(
    missingReset.getRangeFills(0, missingReset.characters.length)[0]
      .boundVariables.color.id,
    missingReset.fills[0].boundVariables.color.id,
    'Injected independent range state can differ from node fills'
  );
  const unloaded = create(doc),
    probe = unloaded.figma.createText();
  assert.deepStrictEqual(probe.getRangeFills(0, 0), []);
  assert.throws(() => probe.setRangeFills(0, 0, []), /unloaded Inter Regular/);
  await unloaded.figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  probe.characters = 'Range API probe';
  assert.throws(
    () => probe.setRangeFills(0, probe.characters.length - 1, []),
    /complete text range/
  );
  probe.setRangeFills(0, probe.characters.length, editedRange);
  assert.deepStrictEqual(
    probe.getRangeFills(0, probe.characters.length),
    editedRange
  );
  console.log(
    'ok  negative control reproduces stale Hover despite correct node fills; range setter requires loaded fonts and complete ranges'
  );

  const failures = [
    [
      'unknown enum',
      bad => {
        bad.components.families.find(
          f => f.id === 'toc-link'
        ).variants[0].tree.children[0].textStyleApplication = 'STYLE';
      },
    ],
    [
      'other family',
      bad => {
        bad.components.families.find(
          f => f.id === 'table-of-contents'
        ).variants[0].tree.children[0].textStyleApplication = 'DIRECT';
      },
    ],
    [
      'non TEXT',
      bad => {
        bad.components.families.find(
          f => f.id === 'toc-link'
        ).variants[0].tree.textStyleApplication = 'DIRECT';
      },
    ],
    [
      'other anatomy',
      bad => {
        bad.components.families.find(
          f => f.id === 'toc-link'
        ).variants[0].tree.children[0].id = 'another-label';
      },
    ],
    [
      'wrong template role',
      bad => {
        bad.styles.text.find(
          s => s.id === 'component.table-of-contents.link'
        ).bindings.fontSize = 'font-size/400';
      },
    ],
    [
      'missing brand',
      bad => {
        delete bad.styles.text.find(
          s => s.id === 'component.table-of-contents.link'
        ).values.undrr;
      },
    ],
    [
      'wrong template font',
      bad => {
        bad.styles.text.find(
          s => s.id === 'component.table-of-contents.link'
        ).values.undrr.fontName.style = 'Bold';
      },
    ],
    [
      'duplicate template',
      bad => {
        bad.styles.text.push(
          copy(
            bad.styles.text.find(
              s => s.id === 'component.table-of-contents.link'
            )
          )
        );
      },
    ],
    [
      'wrong source role type',
      bad => {
        bad.variables.find(v => v.name === 'font-family/text').type = 'FLOAT';
      },
    ],
    [
      'wrong native role type',
      () => {},
      e => {
        e.state.variables.find(
          v => v.name === 'font-family/text'
        ).resolvedType = 'FLOAT';
      },
    ],
    [
      'wrong native identity',
      () => {},
      e => {
        e.state.variables
          .find(v => v.name === 'font-family/text')
          .setSharedPluginData('orgundrrmangrove', 'mgId', 'foreign');
      },
    ],
    [
      'wrong native brand value',
      () => {},
      e => {
        const role = e.state.variables.find(v => v.name === 'font-size/300');
        role.valuesByMode[e.state.collections[0].modes[0].modeId] = 18;
      },
    ],
  ];
  for (const [name, change, nativeChange] of failures) {
    const bad = copy(doc),
      e = create(bad);
    await importFoundation(e, doc);
    change(bad);
    nativeChange?.(e);
    const nodesBefore = [...e.state.nodes.keys()],
      stylesBefore = copy(e.state.styles);
    const refused = await e.call('buildMangroveComponents', bad, 'undrr', [
      'table-of-contents',
      'button',
    ]);
    assert(refused.errors.length, name);
    assert.strictEqual(
      refused.styles,
      undefined,
      `${name}: no style import before refusal`
    );
    assert.deepStrictEqual(
      [...e.state.nodes.keys()],
      nodesBefore,
      `${name}: no canvas writes`
    );
    assert.deepStrictEqual(
      copy(e.state.styles),
      stylesBefore,
      `${name}: no template writes`
    );
  }
  console.log(
    'ok  DIRECT scope, template/brand/anatomy/typed identity guards reject before all selected style/canvas writes'
  );

  const rejected = create(doc, { rejectedFonts: ['Roboto Regular'] });
  await importFoundation(rejected, doc);
  const failed = await rejected.call('buildMangroveComponents', doc, 'undrr', [
    'table-of-contents',
  ]);
  assert(failed.errors.length);
  assert(
    ![...rejected.state.nodes.values()].some(
      n =>
        id(n).startsWith('family/toc-link') ||
        id(n).startsWith('family/table-of-contents')
    )
  );
  const malformed = copy(doc);
  malformed.variables.find(
    v => v.name === 'component/table-of-contents/link-cap-240'
  ).type = 'STRING';
  const invalid = create(malformed);
  // Import valid foundations, then prove recipe preflight refuses mismatched native role types.
  await importFoundation(invalid, doc);
  const cap = invalid.state.variables.find(
    v => v.name === 'component/table-of-contents/link-cap-240'
  );
  cap.resolvedType = 'STRING';
  const blocked = await invalid.call(
    'buildMangroveComponents',
    malformed,
    'undrr',
    ['table-of-contents']
  );
  assert(blocked.errors.length);
  assert(
    ![...invalid.state.nodes.values()].some(
      n =>
        id(n).startsWith('family/toc-link') ||
        id(n).startsWith('family/table-of-contents')
    )
  );
  console.log(
    'ok  exact Regular font and FLOAT cap failure block dependent families without partial canonical trees'
  );
  // Keep exporter-normalized families intact. Raw module fixtures above test
  // source guards but cannot establish the actual plugin transport contract.
  const exported = buildFigmaVariables(),
    integration = create(exported);
  const normalized = exported.components.families.find(
    f => f.id === 'toc-link'
  );
  assert.strictEqual(normalized.variants.length, 12);
  assert(
    normalized.variants.every(
      v =>
        v.tree.id === 'mg-table-of-contents / a' &&
        v.tree.children[0].id === 'mg-table-of-contents / a/Link label'
    )
  );
  await importFoundation(integration, exported);
  const all = await integration.call(
    'buildMangroveComponents',
    exported,
    'undrr'
  );
  assert.deepStrictEqual(copy(all.errors), []);
  assert.strictEqual(all.families.length, exported.components.families.length);
  const normalizedResult = all.families.find(f => f.id === 'toc-link');
  for (const variant of normalizedResult.variantIds) {
    const component = integration.state.nodes.get(variant.nodeId),
      text = find(component, 'Link label');
    assert.strictEqual(text.textStyleId, '');
    assert.strictEqual(
      id(text),
      `${id(component)}/mg-table-of-contents / a/Link label`
    );
    assert(text.componentPropertyReferences.characters.startsWith('Label#'));
    for (const [field, role] of [
      ['fontFamily', 'font-family/text'],
      ['fontSize', 'font-size/300'],
    ])
      assert.strictEqual(
        text.boundVariables[field].id,
        integration.state.variables.find(v => v.name === role).id
      );
  }
  const actualIds = identities(integration),
    actualDefinitions = copy(
      integration.state.nodes.get(normalizedResult.setId)
        .componentPropertyDefinitions
    );
  const actualRepeat = await integration.call(
    'buildMangroveComponents',
    exported,
    'undrr',
    ['table-of-contents']
  );
  assert.deepStrictEqual(copy(actualRepeat.errors), []);
  assert.strictEqual(actualRepeat.createdNodeIds.length, 0);
  assert.deepStrictEqual(identities(integration), actualIds);
  assert.deepStrictEqual(
    copy(
      integration.state.nodes.get(normalizedResult.setId)
        .componentPropertyDefinitions
    ),
    actualDefinitions
  );
  const malformedNormalized = copy(exported);
  malformedNormalized.components.families.find(
    f => f.id === 'toc-link'
  ).variants[0].tree.children[0].id += '/foreign';
  const refusedNormalized = await integration.call(
    'buildMangroveComponents',
    malformedNormalized,
    'undrr',
    ['table-of-contents']
  );
  assert(refusedNormalized.errors.length);
  assert.strictEqual(refusedNormalized.styles, undefined);
  assert.deepStrictEqual(identities(integration), actualIds);
  console.log(
    'ok  actual complete exporter registry builds unchanged normalized anatomy; DIRECT repeat preserves exact owned IDs/Label keys and refuses foreign normalized paths'
  );
  console.log(
    'TOC mock passed 7 groups. Text flow, number glyph pixels/baselines, source font equivalence and native edited consumers remain separate acceptance.'
  );
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
