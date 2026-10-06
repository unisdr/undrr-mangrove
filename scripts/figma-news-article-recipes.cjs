'use strict';
const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');
/** Actual initialized external-player captures. No native media/playback claim. */
function buildNewsArticleMediaRecipes({ root, modes }) {
  const fail = s => {
    throw Error('News article media source changed: ' + s);
  };
  const sha = b => crypto.createHash('sha256').update(b).digest('hex');
  const base = path.join(
    root,
    'examples/figma-plugin/holistic/assets/news-article'
  );
  const bytes = fs.readFileSync(path.join(base, 'provenance.json'));
  if (
    sha(bytes) !==
    '7b92433429fc1b1d4b8ba07504e1c308f5c45b744e149811f91ba587496d9801'
  )
    fail('provenance');
  const prov = JSON.parse(bytes);
  for (const [file, hash] of Object.entries(prov.sourceHashes))
    if (sha(fs.readFileSync(path.join(root, file))) !== hash) fail(file);
  for (const [file, hash] of Object.entries(prov.assets))
    if (sha(fs.readFileSync(path.join(base, file))) !== hash) fail(file);
  if (
    modes
      .map(m => m.id)
      .sort()
      .join(',') !== 'delta,irp,mcr,preventionweb,undrr'
  )
    fail('five modes');
  const cases = JSON.parse(
    fs.readFileSync(path.join(base, 'source-footprints.json'))
  ).cases;
  if (cases.length !== 10) fail('ten source cases');
  const seen = new Set();
  const variants = cases.map(c => {
    const mode = c.sourceKey.replace(/-\d+$/, ''),
      viewport = c.viewport.width,
      key = mode + '-' + viewport,
      media = c.media,
      shot = media.initialPlayerScreenshot;
    if (
      !modes.some(m => m.id === mode) ||
      ![390, 1164].includes(viewport) ||
      seen.has(key)
    )
      fail('source context');
    seen.add(key);
    if (
      media.src !== prov.sourceUrl ||
      media.title !== 'This is how timely early warnings save lives, UNDRR' ||
      media.contentAccess !== 'Cross-origin opaque external player'
    )
      fail('actual media metadata');
    const snapshot = fs.readFileSync(
      path.join(base, key + '-snapshot.txt'),
      'utf8'
    );
    if (
      !snapshot.includes('Play video') ||
      !snapshot.includes('Watch on YouTube')
    )
      fail('actual initialized player state');
    const png = fs.readFileSync(path.join(base, shot.crop));
    if (
      png.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' ||
      sha(png) !== shot.sha256 ||
      png.readUInt32BE(16) !== shot.decodedSize[0] ||
      png.readUInt32BE(20) !== shot.decodedSize[1]
    )
      fail('actual PNG bytes/dimensions');
    const w = media.wrapperRect.width,
      h = media.wrapperRect.height;
    if (
      !Number.isFinite(w) ||
      !Number.isFinite(h) ||
      w <= 0 ||
      h <= 0 ||
      Math.abs(h - (w * 9) / 16) > 1e-6 ||
      media.rect.width !== w ||
      media.rect.height !== h ||
      media.wrapperStyle.opacity !== '1'
    )
      fail('authored 16:9 allocation');
    return {
      id: 'news-article-initial-media.' + key,
      name: 'CaptureTheme=' + mode + ', SourceViewport=' + viewport,
      properties: {
        CaptureTheme: mode,
        SourceViewport: String(viewport),
        State: 'InitialOpaque',
      },
      sourceMedia: {
        src: media.src,
        title: media.title,
        allow: media.allow,
        allowFullscreen: media.allowFullscreen,
        attribution: prov.attribution,
        timestamp: c.timestamp,
        captureTheme: mode,
        sourceViewport: viewport,
        cropBounds: shot.cropBounds,
        decodedSize: shot.decodedSize,
        quantization: shot.quantization,
        opaqueContent: true,
        playable: false,
        editablePlayer: false,
      },
      tree: {
        id: 'root',
        type: 'FRAME',
        fill: null,
        layout: { mode: 'VERTICAL', width: w, height: h, clipsContent: true },
        children: [
          {
            id: 'initialized-player-capture',
            type: 'FRAME',
            image: {
              assetId: 'news-article-initial-player-' + key,
              base64: png.toString('base64'),
              scaleMode: 'FILL',
            },
            layout: { mode: 'NONE', width: w, height: h, clipsContent: true },
            children: [],
          },
        ],
      },
    };
  });
  return [
    {
      id: 'news-article-initial-media',
      name: 'Mangrove/Source Article/Initialized opaque media',
      kind: 'component-set',
      review: { genericLabels: false, preserveVariantSizing: true },
      sourceRef: {
        file: 'stories/Patterns/ArticleStory/ArticleStory.jsx',
        line: 553,
      },
      description:
        'Actual source initial external-player browser capture inside exact source 16:9 wrapper. IMAGE preserves captured state, not editable or playable media.',
      variantProperties: {
        CaptureTheme: modes.map(m => m.id),
        SourceViewport: ['390', '1164'],
        State: ['InitialOpaque'],
      },
      limitations: [
        'Each CaptureTheme is an immutable captured image context, not a variable-mode image binding.',
        'External YouTube state, native embed/playback and attribution permissions remain separate from this source appearance.',
        'Integer source PNG crop bounds differ from floating wrapper allocation. Native crop, raster, fonts and full Article composition remain open.',
      ],
      variants,
    },
  ];
}
module.exports = { buildNewsArticleMediaRecipes };
