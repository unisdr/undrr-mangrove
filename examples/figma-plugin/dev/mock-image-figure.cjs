'use strict';
const fs = require('fs'),
  path = require('path'),
  zlib = require('zlib'),
  assert = require('assert');
const root = path.resolve(__dirname, '../../..');
const { buildImageFigureRecipes } = require(
  root + '/scripts/figma-image-figure-recipes.cjs'
);
const { rangeEnvironment } = require('./mock-rich-text-integration.cjs');
const {
  installNativeTextPropertyDefaultFixture,
} = require('./mock-search-results.cjs');
const copy = x => JSON.parse(JSON.stringify(x)),
  key = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
const ASSET = root + '/examples/figma-plugin/holistic/assets/image-figure/';
function base() {
  return JSON.parse(
    fs.readFileSync(root + '/examples/figma-plugin/mangrove-variables.json')
  );
}
function document() {
  const d = base();
  d.components.families = buildImageFigureRecipes({ root, ...d });
  return d;
}
function walk(t, p = '') {
  return [[t, p], ...(t.children || []).flatMap(c => walk(c, p + '/' + c.id))];
}
function resolve(d, x, m) {
  const seen = new Set();
  while (typeof x === 'string') {
    assert(!seen.has(x));
    seen.add(x);
    const v = d.variables.find(v => v.name === x);
    assert(v, x);
    x = v.values[m];
    if (x?.alias) x = x.alias;
  }
  return x;
}
const permanent = e =>
  JSON.stringify({
    nodes: [...e.state.nodes.values()].map(n => [
      n.id,
      n.type,
      key(n),
      n.characters,
      n.x,
      n.y,
      n.width,
      n.height,
    ]),
    styles: e.state.styles,
    variables: e.state.variables,
    images: e.state.images,
  });
const geometry = e =>
  [...e.state.nodes.values()]
    .filter(n => key(n).startsWith('family/image-figure/'))
    .map(n => [
      n.id,
      n.parent?.id,
      n.type,
      n.x,
      n.y,
      n.width,
      n.height,
      n.opacity,
      n.effectStyleId,
      n.type === 'TEXT' ? n.characters : null,
    ]);
const archive = JSON.parse(
  zlib.gunzipSync(fs.readFileSync(ASSET + 'source-footprints.json.gz'))
);
function restore(x) {
  if (Array.isArray(x)) return x.map(restore);
  if (x && typeof x === 'object') {
    if (Object.keys(x).join(',') === '$sourceStyle')
      return copy(archive.styles[x.$sourceStyle]);
    return Object.fromEntries(
      Object.entries(x).map(([k, v]) => [k, restore(v)])
    );
  }
  return x;
}
const source = restore(archive.data).cases,
  proof = JSON.parse(fs.readFileSync(ASSET + 'credit-flex-proof.json')).cases;
async function main() {
  const d = document();
  assert.deepStrictEqual(
    d.components.families.map(f => [f.id, f.variants.length]),
    [['image-figure', 72]]
  );
  assert.equal(Object.keys(source).length, 360);
  assert.equal(Object.keys(proof).length, 90);
  for (const mutate of [
    x =>
      (x.variables.find(v => v.name === 'color/neutral-600').values.mcr = {
        r: 0,
        g: 0,
        b: 0,
        a: 1,
      }),
    x =>
      (x.variables.find(v =>
        v.name.startsWith('component/image-figure/')
      ).type = 'BOOLEAN'),
    x =>
      (x.styles.text.find(v =>
        v.id.startsWith('component.image-figure.')
      ).type = 'EFFECT'),
    x =>
      (x.styles.text.find(v =>
        v.id.startsWith('component.image-figure.')
      ).values.irp.fontName = []),
    x =>
      x.styles.effect.push(
        copy(
          x.styles.text.find(v => v.id.startsWith('component.image-figure.'))
        )
      ),
    x =>
      (x.variables.find(v => v.name === 'font-size/200').values.mcr = {
        alias: 'font-size/200',
      }),
  ]) {
    const x = copy(d);
    mutate(x);
    const snap = copy({ variables: x.variables, styles: x.styles });
    assert.throws(
      () => buildImageFigureRecipes({ root, ...x }),
      /Image figure source changed/
    );
    assert.deepStrictEqual({ variables: x.variables, styles: x.styles }, snap);
  }
  const provenance = JSON.parse(fs.readFileSync(ASSET + 'provenance.json'));
  for (const file of [
    ...Object.keys(provenance.sourceHashes),
    ...Object.keys(provenance.assets).map(
      f => 'examples/figma-plugin/holistic/assets/image-figure/' + f
    ),
  ]) {
    const x = base(),
      snap = copy({ variables: x.variables, styles: x.styles }),
      read = fs.readFileSync;
    fs.readFileSync = function (f, ...args) {
      const result = read.call(this, f, ...args);
      return path.resolve(String(f)) === path.resolve(root, file)
        ? typeof result === 'string'
          ? result + 'drift'
          : Buffer.concat([result, Buffer.from('drift')])
        : result;
    };
    try {
      assert.throws(
        () => buildImageFigureRecipes({ root, ...x }),
        /Image figure source changed/
      );
      assert.deepStrictEqual(
        { variables: x.variables, styles: x.styles },
        snap
      );
    } finally {
      fs.readFileSync = read;
    }
  }
  const stable = copy({ variables: d.variables, styles: d.styles });
  assert.deepStrictEqual(
    buildImageFigureRecipes({ root, ...d }),
    d.components.families
  );
  assert.deepStrictEqual({ variables: d.variables, styles: d.styles }, stable);
  for (const mode of d.modes) {
    const env = await rangeEnvironment(d);
    installNativeTextPropertyDefaultFixture(env);
    assert.deepStrictEqual(
      copy(
        (await env.call('importVariables', d, [mode.id], false, [], true))
          .errors
      ),
      []
    );
    const build = () =>
      env.call('buildMangroveComponents', d, mode.id, ['image-figure'], {
        refreshReview: false,
      });
    let result = await build();
    assert.deepStrictEqual(copy(result.errors), []);
    const editedMain = new Map();
    async function authored() {
      for (const v of d.components.families[0].variants) {
        const prefix = 'family/image-figure/variant/' + v.id;
        for (const [t, p] of walk(v.tree)) {
          const n = [...env.state.nodes.values()].find(
            n => key(n) === prefix + p
          );
          assert(n, prefix + p);
          assert.equal(n.width, resolve(d, t.layout.width, mode.id));
          assert.equal(n.height, resolve(d, t.layout.height, mode.id));
          assert.equal(n.opacity, 1);
          if (t.absolute) {
            assert.equal(n.x, resolve(d, t.absolute.offsetX, mode.id));
            assert.equal(n.y, resolve(d, t.absolute.offsetY, mode.id));
          }
          if (t.type === 'TEXT') {
            assert.equal(
              n.characters,
              editedMain.get(n.id)?.characters ?? t.characters
            );
            assert.equal(n.textAlignHorizontal, t.textAlign);
            assert.equal(n.textWrapStyle, t.textWrap);
            if (t.textProperty) {
              const ref = n.componentPropertyReferences.characters;
              assert(ref);
              let owner = n.parent;
              while (owner && owner.type !== 'COMPONENT_SET')
                owner = owner.parent;
              assert.equal(
                owner.componentPropertyDefinitions[ref].defaultValue,
                t.characters
              );
            }
            if (t.textRuns) {
              const segments = n.getStyledTextSegments([
                'textStyleId',
                'fontName',
                'fills',
              ]);
              assert.equal(segments.length, 2);
              assert.equal(segments[0].fontName.style, 'Regular');
              assert.equal(segments[1].fontName.style, 'Bold');
              assert(n.characters.includes('\n'));
            }
          }
          if (t.fill) {
            const color = resolve(d, t.fill, mode.id);
            assert(n.fills.length);
            for (const k of ['r', 'g', 'b'])
              assert.equal(
                Math.round(n.fills[0].color[k] * 255),
                Math.round(color[k] * 255)
              );
            assert.equal(n.fills[0].opacity, color.a ?? 1);
          } else if (!t.image && !t.textRuns) assert.equal(n.fills.length, 0);
          if (t.image) {
            assert.equal(n.fills[0].type, 'IMAGE');
            assert.equal(n.fills[0].scaleMode, 'FILL');
            assert.equal(
              n.fills[0].imageHash,
              require('crypto')
                .createHash('sha256')
                .update(Buffer.from(t.image.base64, 'base64'))
                .digest('hex')
            );
          }
        }
        const c = source[mode.id + '-' + v.id.slice('image-figure.'.length)],
          srcById = {
            root: c.tree[0],
            'media-cart': c.tree.find(
              n => n.classes === 'mg-image-figcaption__cart'
            ),
            media: c.tree.find(n => n.image),
            caption: c.tree.find(n => n.tag === 'FIGCAPTION'),
            'caption-text': c.tree.find(n => n.tag === 'P'),
            credit: c.tree.find(n => n.classes === 'mg-credits'),
            author: c.tree.find(n => n.tag === 'STRONG'),
          };
        if (
          v.properties.SourceViewport === '390' &&
          v.properties.Content !== 'caption' &&
          v.properties.Content !== 'media-only'
        )
          srcById.organization =
            proof[
              mode.id + '-' + v.id.slice('image-figure.'.length)
            ].organization;
        for (const [t, p] of walk(v.tree)) {
          const src = srcById[t.id];
          if (!src) continue;
          const n = [...env.state.nodes.values()].find(
            n => key(n) === prefix + p
          );
          assert.equal(n.width, src.rect.width);
          assert.equal(n.height, src.rect.height);
          if (t.id !== 'root') {
            const parent =
              t.id === 'organization' || t.id === 'author'
                ? srcById.credit
                : t.id === 'credit' || t.id === 'caption-text'
                  ? srcById.caption
                  : t.id === 'media'
                    ? srcById['media-cart']
                    : srcById.root;
            assert.equal(n.x, src.rect.x - parent.rect.x);
            assert.equal(n.y, src.rect.y - parent.rect.y);
          }
        }
      }
    }
    await authored();
    assert.equal(env.state.images.size, 3);
    const consumers = [];
    for (const v of d.components.families[0].variants) {
      const prefix = 'family/image-figure/variant/' + v.id,
        master = [...env.state.nodes.values()].find(n => key(n) === prefix),
        instance = master.createInstance();
      env.figma.currentPage.appendChild(instance);
      for (const [t, p] of walk(v.tree)) {
        if (t.textProperty) {
          const n = [...env.state.nodes.values()].find(
              n => key(n) === prefix + p
            ),
            ref = n.componentPropertyReferences.characters,
            linked = instance
              .findAllWithCriteria({ types: ['TEXT'] })
              .find(n => n.componentPropertyReferences?.characters === ref);
          assert(linked);
          let proto = linked,
            desc;
          while (proto && !desc) {
            desc = Object.getOwnPropertyDescriptor(proto, 'characters');
            proto = Object.getPrototypeOf(proto);
          }
          assert(desc?.set);
          Object.defineProperty(linked, 'characters', {
            configurable: true,
            get() {
              return instance.componentProperties[ref].value;
            },
            set(value) {
              desc.set.call(this, value);
            },
          });
          instance.setProperties({ [ref]: 'Updated' });
          consumers.push({
            instance,
            linked,
            value: 'Updated',
            main: master.id,
          });
        } else if (t.textRuns) {
          const n = [...env.state.nodes.values()].find(
              n => key(n) === prefix + p
            ),
            linked = instance
              .findAllWithCriteria({ types: ['TEXT'] })
              .find(a => key(a) === key(n));
          env.attachRichText(linked, n);
          linked.editRich(
            linked.characters.length,
            linked.characters.length,
            '!'
          );
          const signature = copy(
            linked.getStyledTextSegments(['textStyleId', 'fontName', 'fills'])
          );
          consumers.push({
            instance,
            linked,
            value: linked.characters,
            signature,
            main: master.id,
          });
          n.editRich(0, 0, 'New ');
          editedMain.set(n.id, {
            characters: n.characters,
            signature: copy(
              n.getStyledTextSegments(['textStyleId', 'fontName', 'fills'])
            ),
          });
        }
      }
    }
    const baseline = geometry(env);
    assert(baseline.length > 500);
    for (let i = 0; i < 2; i++) {
      result = await build();
      assert.deepStrictEqual(copy(result.errors), []);
      assert.equal(result.createdNodeIds.length, 0);
      await authored();
      assert.deepStrictEqual(geometry(env), baseline);
      assert.equal(env.state.images.size, 3);
      for (const c of consumers) {
        assert.equal((await c.instance.getMainComponentAsync()).id, c.main);
        assert.equal(c.linked.characters, c.value);
        if (c.signature)
          assert.deepStrictEqual(
            copy(
              c.linked.getStyledTextSegments([
                'textStyleId',
                'fontName',
                'fills',
              ])
            ),
            c.signature
          );
      }
      for (const [id, e] of editedMain)
        assert.deepStrictEqual(
          copy(
            env.state.nodes
              .get(id)
              .getStyledTextSegments(['textStyleId', 'fontName', 'fills'])
          ),
          e.signature
        );
    }
    console.log(
      mode.id +
        ' ImageFigure72 actual source ownership/media/paint/defaults and plain+rich main/consumer BR/Strong edits, two nonempty zero-create repeats pass'
    );
  }
  for (const family of ['Noto Sans Arabic', 'Roboto']) {
    const env = await rangeEnvironment(d);
    assert.deepStrictEqual(
      copy(
        (await env.call('importVariables', d, ['undrr'], false, [], true))
          .errors
      ),
      []
    );
    const load = env.figma.loadFontAsync;
    env.figma.loadFontAsync = async f => {
      if (f.family === family && f.style === 'Bold')
        throw Error('Missing required ' + family + ' Bold');
      return load(f);
    };
    const before = permanent(env),
      r = await env.call(
        'buildMangroveComponents',
        d,
        'undrr',
        ['image-figure'],
        { refreshReview: false }
      );
    assert(r.errors.some(e => e.includes(family)));
    assert.equal(permanent(env), before);
  }
  console.log(
    'Image figure source/artifact/all-mode typed collision/script-font premutation refusals pass'
  );
}
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { document };
