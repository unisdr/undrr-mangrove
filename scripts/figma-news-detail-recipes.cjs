/** Source audit only. Full ArticleStory assembly is blocked on explicit prerequisites. */
'use strict';
const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');
const PROVENANCE =
  'examples/figma-plugin/holistic/assets/news-detail/provenance.json';
const PROVENANCE_HASH =
  '0eaec2f3562697b782bc53b1e222fbd097b4f663a5ddb5816874a3f8a81ff4e4';
const DEPENDENCIES = [
  {
    id: 'page-chrome',
    status: 'bounded-source-contract',
    contract:
      'Closed390/1164; separate open desktop/mobile surfaces must match their own viewport contracts. Source does not import Footer.',
  },
  {
    id: 'news-detail-article-column',
    status: 'requires-section-decomposition',
    contract:
      'Reuse exact three headings/nine HTTPS rich paragraphs, preserving source placement of quote, float and embed. Existing compact slice is not a complete column.',
  },
  {
    id: 'page-bulleted-toc',
    status: 'bounded-source-contract',
    contract:
      'Actual article three internal-anchor labels at390/1164. Scrollspy and anchors remain interaction metadata.',
  },
  {
    id: 'quote-highlight',
    status: 'bounded-source-contract',
    contract:
      'Exact ArticleStory light full quote with32px/116% narrow and40px/115% desktop typography. Native font/paint acceptance open.',
  },
  {
    id: 'article-header',
    status: 'missing-source-specific-composition',
    contract:
      'Tag Update, actual title/summary/date and two linked source names. Five actual image treatments including source Hero split; source image/caption bytes and overrides must be pinned.',
  },
  {
    id: 'share-buttons',
    status: 'missing-family',
    contract:
      'Source native-share capability branch plus LinkedIn/Facebook/X/email/QR actions and own copy button. Actual6-action bar wraps at256 rail; QR/copy/clipboard runtime are separate.',
  },
  {
    id: 'article-float-highlight',
    status: 'missing-rich-float-contract',
    contract:
      'Secondary HighlightBox with inline Bold45 and11, width100% narrow/30% desktop and20px logical margin. Desktop next-section paragraph has variable line widths beside this float.',
  },
  {
    id: 'embed-container',
    status: 'unsupported-live-surface',
    contract:
      'Authored16:9 wrapper and exact YouTubeURL/title. No native iframe or source-authored poster exists in current builder. No blank-frame/media substitute.',
  },
  {
    id: 'article-related-cards',
    status: 'missing-source-specific-data-and-assets',
    contract:
      'Three actual VerticalCards with source title/summary, shared exact relatedImage URL and authored related-story destinations, stacked390/grid368px each at1164.',
  },
  {
    id: 'article-recommendations',
    status: 'missing-list-composition',
    contract:
      'Three authored editors recommendation links as actual UL/LI, no numbered or generic list substitute. Multiline marker baseline must be measured.',
  },
  {
    id: 'article-taxonomy',
    status: 'missing-wrapping-composition',
    contract:
      'Actual Hazards/Themes/Country labels and6 native Tag-compatible links. Narrow Themes group wraps into61px container; requires faithful finite row composition and editable-content bounds.',
  },
  {
    id: 'user-feedback',
    status: 'bounded-source-contract',
    contract:
      'Actual initial feedback after shell; narrow/desktop presets must match observed source allocation. Submission and linked confirmation are separate contracts.',
  },
];
function inspectNewsDetailPrerequisites({ root }) {
  const hash = file =>
    crypto
      .createHash('sha256')
      .update(fs.readFileSync(path.join(root, file)))
      .digest('hex');
  if (hash(PROVENANCE) !== PROVENANCE_HASH)
    throw Error('News detail audit provenance changed');
  const provenance = JSON.parse(
    fs.readFileSync(path.join(root, PROVENANCE), 'utf8')
  );
  for (const [file, expected] of Object.entries(provenance.sourceHashes))
    if (hash(file) !== expected)
      throw Error(`News detail source contract changed: ${file}`);
  const evidence = JSON.parse(
    fs.readFileSync(
      path.join(
        root,
        'examples/figma-plugin/holistic/assets/news-detail/source-footprints.json'
      ),
      'utf8'
    )
  );
  if (
    Object.keys(evidence.scenes).length !== 50 ||
    Object.keys(evidence.floatFragments).length !== 10
  )
    throw Error('News detail source case coverage changed');
  return {
    schema: 'mangrove-news-detail-prerequisites-v1',
    source: provenance.source,
    sourceSceneCount: 50,
    floatDiagnosticCount: 10,
    sourceViewportPresets: [390, 1164],
    locale: 'English',
    families: [],
    assemblyReady: false,
    dependencies: JSON.parse(JSON.stringify(DEPENDENCIES)),
    remainingNativeGates: [
      'native fonts/rich default preparation',
      'native source layout and consumer override retention',
      'publication/composite acceptance',
      'maintenance recovery drift',
      'human novice handoff',
      'reduced merge acceptance',
    ],
  };
}
function buildNewsDetailRecipes(options) {
  const report = inspectNewsDetailPrerequisites(options);
  throw Error(
    'Full authored News detail assembly is blocked: ' +
      report.dependencies
        .filter(
          d =>
            d.status.startsWith('missing') ||
            d.status.startsWith('requires') ||
            d.status.startsWith('unsupported')
        )
        .map(d => d.id)
        .join(', ')
  );
}
module.exports = { inspectNewsDetailPrerequisites, buildNewsDetailRecipes };
