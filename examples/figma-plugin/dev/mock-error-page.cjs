'use strict';
const fs = require('fs'),
  path = require('path'),
  assert = require('assert');
const root = path.resolve(__dirname, '../../..');
const { buildErrorPageRecipes } = require(
  root + '/scripts/figma-error-page-recipes.cjs'
);
const { rangeEnvironment } = require('./mock-rich-text-integration.cjs');
const {
  installNativeTextPropertyDefaultFixture,
} = require('./mock-search-results.cjs');
const copy = x => JSON.parse(JSON.stringify(x));
const key = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
function walk(t, p = '') {
  return [[t, p], ...(t.children || []).flatMap(c => walk(c, p + '/' + c.id))];
}
function base() {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'))
  );
}
function document() {
  let d = base();
  d.components.families = buildErrorPageRecipes({ root, ...d });
  return d;
}
function resolve(d, x, m) {
  const seen = new Set();
  while (typeof x === 'string') {
    assert(!seen.has(x));
    seen.add(x);
    let v = d.variables.find(v => v.name === x);
    assert(v, x);
    x = v.values[m];
    if (x?.alias) x = x.alias;
  }
  return x;
}
function installErrorPageSvgFixture(env, families) {
  const allowed = new Set(
    families.flatMap(f =>
      f.variants.flatMap(v =>
        walk(v.tree)
          .filter(([t]) => t.type === 'SVG')
          .map(([t]) => t.svg.markup)
      )
    )
  );
  const original = env.figma.createNodeFromSvg.bind(env.figma);
  env.figma.createNodeFromSvg = markup => {
    let raw = markup.replace(/ width="[\d.]+" height="[\d.]+"/, '');
    if (!allowed.has(raw)) return original(markup);
    const v = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(raw);
    assert(v);
    const frame = env.figma.createFrame(),
      vector = env.figma.createVector();
    frame.resize(+v[1], +v[2]);
    vector.resize(+v[1], +v[2]);
    vector.vectorPaths = [
      {
        windingRule: 'NONZERO',
        data: [...raw.matchAll(/\bd="([^"]+)"/g)].map(a => a[1]).join(' '),
      },
    ];
    vector.fills = raw.includes('stroke-dasharray')
      ? []
      : [
          {
            type: 'SOLID',
            color: { r: 0, g: 79 / 255, b: 145 / 255 },
            opacity: 1,
          },
        ];
    vector.strokes = raw.includes('stroke-dasharray')
      ? [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 1 }]
      : [];
    vector.strokeWeight = raw.includes('stroke-dasharray') ? 2 : 0;
    frame.appendChild(vector);
    frame.rescale = s => {
      frame.resizeWithoutConstraints(frame.width * s, frame.height * s);
      vector.resizeWithoutConstraints(vector.width * s, vector.height * s);
      vector.strokeWeight *= s;
    };
    return frame;
  };
}
const permanent = env =>
  JSON.stringify({
    nodes: [...env.state.nodes.values()].map(n => [
      n.id,
      n.type,
      n.characters,
      key(n),
      n.x,
      n.y,
      n.width,
      n.height,
    ]),
    styles: env.state.styles,
    variables: env.state.variables,
    collections: env.state.collections,
    images: env.state.images,
  });
const geometry = env =>
  [...env.state.nodes.values()]
    .filter(n => key(n).startsWith('family/error-page'))
    .map(n => [
      n.id,
      n.parent?.id,
      n.type,
      n.x,
      n.y,
      n.width,
      n.height,
      n.opacity,
      n.type === 'INSTANCE' ? n.mainComponent?.id : null,
    ]);
async function main() {
  const d = document();
  assert.deepStrictEqual(
    d.components.families.map(f => [f.id, f.variants.length]),
    [
      ['error-page-search-input', 2],
      ['error-page-search-action', 2],
      ['error-page-search-form', 2],
      ['error-page', 20],
    ]
  );
  const before = copy({ variables: d.variables, styles: d.styles });
  buildErrorPageRecipes({ root, ...d });
  assert.deepStrictEqual({ variables: d.variables, styles: d.styles }, before);
  assert(
    d.variables
      .filter(v => v.name.startsWith('component/error-page/'))
      .every(v => JSON.stringify(v.scopes) === '["ALL_SCOPES"]')
  );
  for (const mutate of [
    x => (x.variables.find(v => v.name === 'spacing/100').values.irp = 11),
    x =>
      (x.variables.find(v => v.name.startsWith('component/error-page/')).type =
        'BOOLEAN'),
    x =>
      (x.styles.text.find(v => v.id.startsWith('component.error-page.')).type =
        'EFFECT'),
    x =>
      (x.styles.text.find(v =>
        v.id.startsWith('component.error-page.')
      ).values.mcr.fontName = []),
    x =>
      x.styles.effect.push(
        copy(x.styles.text.find(v => v.id.startsWith('component.error-page.')))
      ),
    x =>
      x.variables.push({
        ...copy(x.variables.find(v => v.name === 'font-family/text')),
        id: 'foreign',
      }),
  ]) {
    let x = copy(d);
    mutate(x);
    let b = copy({ variables: x.variables, styles: x.styles });
    assert.throws(
      () => buildErrorPageRecipes({ root, ...x }),
      /ErrorPage source changed/
    );
    assert.deepStrictEqual({ variables: x.variables, styles: x.styles }, b);
  }
  for (const file of [
    'stories/Components/ErrorPages/error-pages.scss',
    'stories/Components/ErrorPages/ErrorPagesContent.js',
    'examples/figma-plugin/holistic/assets/error-page/source-footprints.json',
    'examples/figma-plugin/holistic/assets/error-page/undrr-logo-blue.svg',
    'examples/figma-plugin/holistic/assets/page-patterns/source-fonts/Roboto-Regular.woff2',
  ]) {
    const raw = fs.readFileSync;
    let x = base(),
      b = copy({ variables: x.variables, styles: x.styles });
    fs.readFileSync = function (f, ...args) {
      let r = raw.call(this, f, ...args);
      if (path.resolve(String(f)) === path.resolve(root, file))
        return typeof r === 'string'
          ? r + 'drift'
          : Buffer.concat([r, Buffer.from('drift')]);
      return r;
    };
    try {
      assert.throws(
        () => buildErrorPageRecipes({ root, ...x }),
        /ErrorPage source changed/
      );
      assert.deepStrictEqual({ variables: x.variables, styles: x.styles }, b);
    } finally {
      fs.readFileSync = raw;
    }
  }
  for (const mode of d.modes) {
    const env = await rangeEnvironment(d, { richDecorationOffsets: true });
    installNativeTextPropertyDefaultFixture(env);
    installErrorPageSvgFixture(env, d.components.families);
    assert.deepStrictEqual(
      copy(
        (await env.call('importVariables', d, [mode.id], false, [], true))
          .errors
      ),
      []
    );
    const run = () =>
      env.call(
        'buildMangroveComponents',
        d,
        mode.id,
        d.components.families.map(f => f.id),
        { refreshReview: false }
      );
    let first = await run();
    assert.deepStrictEqual(copy(first.errors), []);
    let edited = [];
    function authored() {
      for (const family of d.components.families)
        for (const v of family.variants) {
          let rootKey = 'family/' + family.id + '/variant/' + v.id,
            master = [...env.state.nodes.values()].find(
              n => key(n) === rootKey
            );
          assert(master, rootKey);
          assert.equal(master.width, resolve(d, v.tree.layout.width, mode.id));
          assert.equal(
            master.height,
            resolve(d, v.tree.layout.height, mode.id)
          );
          for (const [t, p] of walk(v.tree)) {
            if (!p) continue;
            let n = [...env.state.nodes.values()].find(
              n => key(n) === rootKey + p
            );
            assert(n, rootKey + p);
            assert.equal(n.opacity, 1);
            assert.equal(n.width, resolve(d, t.layout.width, mode.id));
            assert.equal(n.height, resolve(d, t.layout.height, mode.id));
            if (t.absolute) {
              assert.equal(n.x, resolve(d, t.absolute.offsetX, mode.id));
              assert.equal(n.y, resolve(d, t.absolute.offsetY, mode.id));
            }
            if (t.fill && t.type !== 'SVG') {
              const color = resolve(d, t.fill, mode.id),
                paint = n.fills[0];
              assert(paint);
              for (const c of ['r', 'g', 'b'])
                assert(Math.abs(paint.color[c] - color[c]) < 1e-9);
              assert.equal(paint.opacity, color.a ?? 1);
            }
            if (t.type === 'TEXT') {
              assert.equal(
                n.characters,
                edited.find(e => e.node === n)?.value || t.characters
              );
              if (t.textProperty) {
                let ref = n.componentPropertyReferences.characters;
                assert(ref);
                assert.equal(
                  master.parent.componentPropertyDefinitions[ref].defaultValue,
                  t.characters
                );
              }
              if (t.textRuns) {
                for (const r of t.textRuns.filter(r => r.textDecorationOffset))
                  assert.deepStrictEqual(
                    copy(n.getRangeTextDecorationOffset(r.start, r.end)),
                    { unit: 'PIXELS', value: Math.fround(2.4) }
                  );
              }
            }
          }
        }
    }
    authored();
    const consumers = [];
    for (const family of d.components.families)
      for (const v of family.variants) {
        let rootKey = 'family/' + family.id + '/variant/' + v.id,
          master = [...env.state.nodes.values()].find(n => key(n) === rootKey),
          instance = master.createInstance();
        env.figma.currentPage.appendChild(instance);
        for (const [t, p] of walk(v.tree).filter(([t]) => t.textProperty)) {
          let n = [...env.state.nodes.values()].find(
              n => key(n) === rootKey + p
            ),
            ref = n.componentPropertyReferences.characters,
            value = 'Edited ' + t.id;
          instance.setProperties({ [ref]: value });
          consumers.push({ instance, ref, value, main: master.id });
        }
        let richSpec = walk(v.tree).find(([t]) => t.textRuns);
        if (richSpec) {
          let [t, p] = richSpec,
            n = [...env.state.nodes.values()].find(n => key(n) === rootKey + p),
            linked = instance
              .findAllWithCriteria({ types: ['TEXT'] })
              .find(a => key(a) === key(n));
          env.attachRichText(linked, n);
          linked.editRich(0, 0, 'Edited ');
          consumers.push({
            linked,
            value: linked.characters,
            main: master.id,
            instance,
          });
        }
      }
    const source = JSON.parse(
      fs.readFileSync(
        root +
          '/examples/figma-plugin/holistic/assets/error-page/source-footprints.json'
      )
    ).cases;
    for (const variant of d.components.families.find(f => f.id === 'error-page')
      .variants) {
      const actual =
          source[mode.id + '-' + variant.id.slice('error-page.'.length)],
        prefix = 'family/error-page/variant/' + variant.id;
      let main = [...env.state.nodes.values()].find(n => key(n) === prefix);
      assert.equal(main.width, actual.tree[0].rect.width);
      assert.equal(main.height, actual.tree[0].rect.height);
      const sourceColor = actual.tree[0].style.backgroundColor
        .match(/[\d.]+/g)
        .map(Number);
      for (const [i, c] of ['r', 'g', 'b'].entries())
        assert.equal(Math.round(main.fills[0].color[c] * 255), sourceColor[i]);
      assert.equal(
        main.cornerRadius,
        parseFloat(actual.tree[0].style.borderRadius)
      );
      for (const sourceNode of actual.tree.filter(
        n => n.tag === 'H1' || n.tag === 'H2' || n.tag === 'P'
      )) {
        const native = [...env.state.nodes.values()].find(
          n =>
            key(n).startsWith(prefix + '/') &&
            key(n).endsWith('/text-' + sourceNode.index)
        );
        assert(native);
        let p = actual.paragraphs.find(p => p.index === sourceNode.index);
        assert.equal(native.characters, p ? p.logicalText : sourceNode.text);
        assert.equal(
          native.width,
          sourceNode.rect.width -
            parseFloat(sourceNode.style.paddingLeft) -
            parseFloat(sourceNode.style.paddingRight)
        );
        assert.equal(
          native.height,
          sourceNode.rect.height -
            parseFloat(sourceNode.style.paddingTop) -
            parseFloat(sourceNode.style.paddingBottom)
        );
      }
      for (const node of actual.tree.filter(
        n => n.tag === 'DIV' && n.classes.startsWith('mg-error-page__container')
      )) {
        const native = [...env.state.nodes.values()].find(
          n => key(n) === prefix + '/box-' + node.index
        );
        assert.equal(native.width, node.rect.width);
        assert.equal(native.height, node.rect.height);
        assert.equal(native.x, node.rect.x - actual.tree[0].rect.x);
        assert.equal(native.y, node.rect.y - actual.tree[0].rect.y);
        if (node.style.boxShadow !== 'none') assert(native.effectStyleId);
      }
    }
    const sourceRich = [...env.state.nodes.values()].find(
      n =>
        n.type === 'TEXT' &&
        key(n).startsWith(
          'family/error-page/variant/error-page.not-found-404-390'
        ) &&
        n.characters.startsWith('If you typed')
    );
    assert(sourceRich);
    sourceRich.editRich(0, 1, 'i');
    edited.push({ node: sourceRich, value: sourceRich.characters });
    const baseline = geometry(env);
    assert(baseline.length > 100);
    for (let i = 0; i < 2; i++) {
      let result = await run();
      assert.deepStrictEqual(copy(result.errors), []);
      assert.equal(result.createdNodeIds.length, 0);
      assert.deepStrictEqual(geometry(env), baseline);
      authored();
      for (const c of consumers) {
        assert.equal((await c.instance.getMainComponentAsync()).id, c.main);
        if (c.ref)
          assert.equal(c.instance.componentProperties[c.ref].value, c.value);
        else assert.equal(c.linked.characters, c.value);
      }
    }
    let rich = [...env.state.nodes.values()].find(
      n =>
        n.type === 'TEXT' &&
        key(n).startsWith(
          'family/error-page/variant/error-page.not-found-404-390'
        ) &&
        n
          .getStyledTextSegments(['textDecoration'])
          .some(r => r.textDecoration === 'UNDERLINE')
    );
    assert(rich);
    let segment = rich
      .getStyledTextSegments(['textDecoration'])
      .find(r => r.textDecoration === 'UNDERLINE');
    rich.setRangeTextDecorationOffset(segment.start, segment.end, {
      unit: 'PIXELS',
      value: 3,
    });
    let snap = permanent(env),
      refused = await run();
    assert(refused.errors.some(e => /ownership/.test(e)));
    assert.equal(permanent(env), snap);
    console.log(
      mode.id +
        ':26 source masters, clean import, defaults/owning edits/two exact zero-create repeats/offset refusal pass'
    );
  }
  {
    let omitted = copy(d),
      v = omitted.variables.find(
        v => v.name.startsWith('component/error-page/') && v.type === 'COLOR'
      );
    delete v.scopes;
    let env = await rangeEnvironment(omitted, { richDecorationOffsets: true });
    let report = await env.call(
      'importVariables',
      omitted,
      ['undrr'],
      false,
      [],
      true
    );
    assert(report.errors.some(e => e.startsWith(v.name + ':')));
  }
  {
    let env = await rangeEnvironment(d, { richDecorationOffsets: true });
    installErrorPageSvgFixture(env, d.components.families);
    assert.deepStrictEqual(
      copy(
        (await env.call('importVariables', d, ['undrr'], false, [], true))
          .errors
      ),
      []
    );
    const load = env.figma.loadFontAsync;
    env.figma.loadFontAsync = async font => {
      if (font.family === 'Menlo') throw Error('Missing native Menlo');
      return load(font);
    };
    let b = permanent(env),
      r = await env.call(
        'buildMangroveComponents',
        d,
        'undrr',
        ['error-page'],
        { refreshReview: false }
      );
    assert(r.errors.some(e => /Menlo/.test(e)));
    assert.equal(permanent(env), b);
  }
  console.log(
    'ErrorPage source26 offline cohort passes; native/runtime gates remain open'
  );
}
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { document, installErrorPageSvgFixture };
