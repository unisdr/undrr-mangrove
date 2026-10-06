'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const ASSET = 'examples/figma-plugin/holistic/assets/logo/';
const PROVENANCE =
  'fd081c4c8656f729de2ebea072de3e6af3303eb0a0a0a774a2ed8d068e73ea8c';
function buildLogoRecipes({ root, modes, variables, styles }) {
  const fail = message => {
    throw Error('Logo source changed: ' + message);
  };
  const read = file => fs.readFileSync(path.join(root, file));
  const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
  if (sha(read(ASSET + 'provenance.json')) !== PROVENANCE) fail('provenance');
  const provenance = JSON.parse(read(ASSET + 'provenance.json'));
  for (const [file, hash] of Object.entries(provenance.sourceHashes))
    if (sha(read(file)) !== hash) fail(file);
  for (const [file, hash] of Object.entries(provenance.assets))
    if (sha(read(ASSET + file)) !== hash) fail(file);
  if (
    !Array.isArray(modes) ||
    modes
      .map(m => m.id)
      .sort()
      .join(',') !== 'delta,irp,mcr,preventionweb,undrr'
  )
    fail('five modes');
  if (
    !Array.isArray(variables) ||
    !styles ||
    !Array.isArray(styles.text) ||
    !Array.isArray(styles.effect)
  )
    fail('foundation array shape');
  const rows = zlib
    .gunzipSync(read(ASSET + 'source-footprints.ndjson.gz'))
    .toString()
    .trim()
    .split('\n')
    .map(JSON.parse);
  if (rows.length !== 1050) fail('1050 actual source captures');
  const assets = JSON.parse(read(ASSET + 'http-assets.json'));
  const normal = JSON.parse(read(ASSET + 'normalization-proof.json'));
  const pixel = JSON.parse(read(ASSET + 'pixel-equivalence-receipt.json'));
  if (
    assets.length !== 13 ||
    normal.length !== 9 ||
    pixel.distinctOwningPaintImageProjections !== 110 ||
    !pixel.allOriginalBodyVersusNormalizedPixelsExact ||
    pixel.resourceURLVersusBodyRasterGateOpen !== true
  )
    fail('asset/equivalence contract');
  const assetByURL = new Map(assets.map(a => [a.url, a]));
  const normalByURL = new Map(normal.map(a => [a.url, a]));
  const group = new Map();
  const projection = r => ({
    story: r.story,
    locale: r.locale,
    viewport: r.viewport,
    img: r.img,
  });
  for (const r of rows) {
    const key = [r.story, r.locale, r.viewport.width].join('.');
    if (!group.has(key)) group.set(key, []);
    group.get(key).push(r);
  }
  if (group.size !== 210) fail('210 finite source presets');
  const variants = [];
  for (const [id, captures] of group) {
    if (
      captures
        .map(r => (r.mode === 'mcr2030' ? 'mcr' : r.mode))
        .sort()
        .join(',') !==
      modes
        .map(m => m.id)
        .sort()
        .join(',')
    )
      fail('source mode coverage ' + id);
    const r = captures.find(r => r.mode === 'undrr');
    if (
      captures.some(
        c => JSON.stringify(projection(c)) !== JSON.stringify(projection(r))
      )
    )
      fail('source mode-invariant logo box/ink ' + id);
    const n = r.img,
      a = assetByURL.get(n.currentSrc),
      normalized = normalByURL.get(n.currentSrc);
    if (
      !a ||
      a.status !== 200 ||
      !n.complete ||
      !(n.naturalWidth > 0 && n.naturalHeight > 0)
    )
      fail('actual loaded asset');
    if (
      n.style.opacity !== '1' ||
      !['contain', 'cover'].includes(n.style['object-fit']) ||
      n.style['background-color'] !== 'rgba(0, 0, 0, 0)'
    )
      fail('source paint/fit');
    if (
      ![n.rect.width, n.rect.height].every(
        v => typeof v === 'number' && Number.isFinite(v) && v > 0
      )
    )
      fail('source dimensions');
    const position = n.style['object-position'].split(' ').map(parseFloat);
    if (
      position.length !== 2 ||
      position.some(v => !Number.isFinite(v) || v < 0 || v > 100)
    )
      fail('source object position');
    const suffix = new URL(n.currentSrc).pathname
      .split('/')
      .pop()
      .replace(/[^a-zA-Z0-9.-]/g, '-');
    const tree = {
      id: 'logo',
      type: 'FRAME',
      name: 'Source logo image',
      fill: null,
      opacity: 1,
      layout: {
        mode: 'NONE',
        width: n.rect.width,
        height: n.rect.height,
        clipsContent: true,
      },
      children: [],
    };
    if (normalized) {
      if (
        !normalized.pathDataAndPaintOrderExact ||
        !normalized.inheritedPaintFlattened ||
        normalized.originalSHA256 !== a.sha256
      )
        fail('whole source paths');
      const vb = normalized.viewBox.split(/\s+/).map(Number);
      if (
        vb.length !== 4 ||
        vb.some(v => !Number.isFinite(v)) ||
        vb[2] <= 0 ||
        vb[3] <= 0
      )
        fail('source viewBox');
      const scale =
        n.style['object-fit'] === 'cover'
          ? Math.max(n.rect.width / vb[2], n.rect.height / vb[3])
          : Math.min(n.rect.width / vb[2], n.rect.height / vb[3]);
      const width = vb[2] * scale,
        height = vb[3] * scale;
      for (const [i, chunk] of normalized.chunks.entries()) {
        const markup = read(ASSET + chunk.path).toString();
        if (
          Buffer.byteLength(markup) > 32768 ||
          sha(Buffer.from(markup)) !== chunk.sha256
        )
          fail('exact bounded normalized SVG');
        tree.children.push({
          id: 'source-artwork-chunk-' + i,
          type: 'SVG',
          position: {
            x: ((n.rect.width - width) * position[0]) / 100,
            y: ((n.rect.height - height) * position[1]) / 100,
          },
          layout: { width, height },
          svg: { assetId: 'logo.' + suffix + '.chunk.' + i, markup },
        });
      }
    } else {
      if (!a.path.endsWith('.png') || n.style['object-fit'] !== 'contain')
        fail('actual PNG containment');
      const scale = Math.min(
          n.rect.width / n.naturalWidth,
          n.rect.height / n.naturalHeight
        ),
        width = n.naturalWidth * scale,
        height = n.naturalHeight * scale;
      tree.children.push({
        id: 'source-artwork-image',
        type: 'FRAME',
        fill: null,
        position: {
          x: ((n.rect.width - width) * position[0]) / 100,
          y: ((n.rect.height - height) * position[1]) / 100,
        },
        layout: { mode: 'NONE', width, height },
        image: {
          assetId: 'logo.' + suffix,
          base64: read(ASSET + a.path).toString('base64'),
          scaleMode: 'FILL',
        },
        children: [],
      });
    }
    variants.push({
      id: 'logo.' + id,
      properties: {
        Story: r.story,
        Locale: r.locale,
        SourceViewport: String(r.viewport.width),
      },
      tree,
      sourceSemantics: {
        tag: 'IMG',
        attributes: n.attributes,
        sourceURL: n.currentSrc,
        sourceGlobalRect: n.rect,
        sourceDirection: n.style.direction,
        sourceNaturalSize: { width: n.naturalWidth, height: n.naturalHeight },
        objectFit: n.style['object-fit'],
        objectPosition: n.style['object-position'],
        sourceCaptureModes: captures.map(c => c.mode),
        resourceURLVersusBodyRasterGateOpen: true,
      },
    });
  }
  return [
    {
      id: 'logo',
      name: 'Mangrove/Source Logo',
      kind: 'component-set',
      review: { preserveVariantSizing: true, genericLabels: false },
      sourceRef: { file: 'stories/Atom/Logo/Logo.jsx', line: 1 },
      variants,
      limitations: [
        '210 actual standalone module story/locale/viewport source presets. Logo is not exported from the package entry; these authored stories do not define a generic props or responsive solver.',
        'Source IMG owning box is retained. Normalized SVG chunks preserve exact whole ordered paths and inherited source paint;89 original-body SVG pairs and21 unchanged PNG controls are browser-pixel exact at110 captured owning projections.',
        'One resource URL versus body repaint differs by2 pixels; source URL raster equivalence remains open. Native whole-path chunk overlay/crop/source artwork raster and source float32 geometry remain separate gates.',
        'Authored Autocropped stories disable autocrop for translated Arabic/French/Russian/Spanish/Chinese assets, retaining captured contain fit and natural aspect. English and Japanese fallback cases retain source cover behavior; actual RTL/LTR caller metadata is preserved.',
        'Alt/title/lang are source semantics metadata, not native editable text or accessibility/runtime acceptance. Arbitrary artwork/props/content/locale changes require new source evidence.',
        'No text property is invented for outlined wordmark glyphs. Consumer artwork overrides and arbitrary resizing are unsupported; ordinary source asset restoration and stable linked instances are the bounded lifecycle contract.',
      ],
    },
  ];
}
module.exports = { buildLogoRecipes };
