'use strict';
const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto'),
  zlib = require('zlib');
const ASSET = 'examples/figma-plugin/holistic/assets/semantic-inline/';
const PROVENANCE =
  '178b2a469ad943362b0264ea1293da18591134f837aabd4395fd94c1254a9e29';
const TREATMENTS = [
  'cite',
  'quotation',
  'list-ordered',
  'list-unordered',
  'code',
  'abbreviation',
];
function buildSemanticInlineSourceContracts({ root, modes }) {
  const fail = s => {
    throw Error('Semantic inline source changed: ' + s);
  };
  const read = p => fs.readFileSync(path.join(root, p));
  const sha = b => crypto.createHash('sha256').update(b).digest('hex');
  if (sha(read(ASSET + 'provenance.json')) !== PROVENANCE) fail('provenance');
  const p = JSON.parse(read(ASSET + 'provenance.json'));
  for (const [file, hash] of Object.entries(p.sourceHashes))
    if (sha(read(file)) !== hash) fail(file);
  for (const [file, hash] of Object.entries(p.assets))
    if (sha(read(ASSET + file)) !== hash) fail(file);
  if (
    !Array.isArray(modes) ||
    modes
      .map(m => m.id)
      .sort()
      .join(',') !== 'delta,irp,mcr,preventionweb,undrr'
  )
    fail('five modes');
  const archive = JSON.parse(
    zlib.gunzipSync(read(ASSET + 'source-footprints.json.gz'))
  );
  if (archive.format !== 'lossless-css-intern-v1') fail('archive');
  function restore(x) {
    return Array.isArray(x)
      ? x.map(restore)
      : x && typeof x === 'object'
        ? Object.keys(x).join(',') === '$sourceStyle'
          ? archive.styles[x.$sourceStyle]
          : Object.fromEntries(
              Object.entries(x).map(([k, v]) => [k, restore(v)])
            )
        : x;
  }
  const cases = restore(archive.data).cases;
  if (Object.keys(cases).length !== 180) fail('180 source cases');
  const fields = [
    'font-family',
    'font-size',
    'font-style',
    'font-weight',
    'font-synthesis-style',
    'line-height',
    'direction',
    'unicode-bidi',
    'white-space-collapse',
    'text-wrap-mode',
    'text-wrap-style',
    'color',
    'background-color',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
    'border-bottom-style',
    'border-bottom-width',
    'border-bottom-color',
    'list-style-type',
    'list-style-position',
    'quotes',
  ];
  const pick = s => Object.fromEntries(fields.map(k => [k, s[k]]));
  const contracts = [];
  for (const treatment of TREATMENTS)
    for (const locale of ['english', 'arabic', 'japanese'])
      for (const width of [390, 1164]) {
        const byMode = {};
        for (const m of modes) {
          const sourceKey = [m.id, locale, treatment, width].join('-'),
            c = cases[sourceKey];
          if (
            !c ||
            c.viewport.width !== width ||
            c.rootLanguage.lang !==
              { english: 'en', arabic: 'ar', japanese: 'ja' }[locale] ||
            c.rootLanguage.dir !== (locale === 'arabic' ? 'rtl' : 'ltr')
          )
            fail('source context');
          for (const n of c.tree) {
            if (
              !n.style ||
              !n.rect ||
              ['x', 'y', 'width', 'height'].some(
                k => !Number.isFinite(n.rect[k])
              ) ||
              n.rect.width <= 0 ||
              n.rect.height <= 0 ||
              +n.style.opacity !== 1
            )
              fail('source allocation');
          }
          const logical = c.tree.filter(n =>
            treatment === 'cite'
              ? n.tag === 'CITE'
              : treatment.startsWith('list-')
                ? n.tag === 'LI'
                : n.tag === 'P'
          );
          if (logical.length !== (treatment.startsWith('list-') ? 3 : 1))
            fail('logical text owners');
          const paragraphs = logical.map(owner => {
            const spans = [];
            let cursor = 0;
            for (const child of c.tree.filter(
              n => n.parentIndex === owner.index
            )) {
              const range = child.logicalRange;
              if (
                !range ||
                range.ownerIndex !== owner.index ||
                range.ownerCharacters !== owner.text ||
                range.characters !== child.text ||
                !Number.isInteger(range.start) ||
                !Number.isInteger(range.end) ||
                range.start < cursor ||
                range.end < range.start ||
                owner.text.slice(range.start, range.end) !== child.text
              )
                fail('source DOM inline range');
              const start = range.start;
              spans.push({
                id: 'source-node-' + child.index,
                tag: child.tag,
                start,
                end: range.end,
                emptySourceBox: !child.text,
                characters: child.text,
                style: pick(child.style),
                rect: child.rect,
                attributes: child.attributes ?? null,
                pseudo: {
                  before: child.pseudoBefore?.content,
                  after: child.pseudoAfter?.content,
                  marker: child.pseudoMarker?.content,
                },
              });
              cursor = range.end;
            }
            return {
              id: 'source-owner-' + owner.index,
              characters: owner.text,
              rect: owner.rect,
              style: pick(owner.style),
              spans,
              marker: owner.pseudoMarker?.content,
            };
          });
          if (
            treatment === 'quotation' &&
            (paragraphs[0].spans[0]?.pseudo.before !== 'open-quote' ||
              paragraphs[0].spans[0]?.pseudo.after !== 'close-quote')
          )
            fail('UA generated quotation');
          if (
            treatment.startsWith('list-') &&
            paragraphs.some(
              x =>
                x.style['list-style-position'] !== 'outside' ||
                x.style['list-style-type'] !==
                  (treatment === 'list-ordered' ? 'decimal' : 'disc') ||
                x.spans.length !== 1 ||
                x.spans[0].tag !== 'STRONG'
            )
          )
            fail('UA list and rich Strong');
          if (
            treatment === 'code' &&
            (paragraphs[0].spans.length !== 2 ||
              paragraphs[0].spans.some(
                x =>
                  x.tag !== 'CODE' ||
                  x.style['padding-left'] !== '5px' ||
                  x.style['padding-right'] !== '5px' ||
                  x.style['font-weight'] !== '500'
              ))
          )
            fail('inline code box');
          if (
            treatment === 'abbreviation' &&
            (paragraphs[0].spans.length !== 2 ||
              paragraphs[0].spans.some(
                x =>
                  x.tag !== 'ABBR' ||
                  x.style['border-bottom-style'] !== 'dashed' ||
                  x.style['border-bottom-width'] !== '2px'
              ))
          )
            fail('inline abbreviation box');
          byMode[m.id] = {
            sourceKey,
            html: c.html,
            rootRect: c.tree[0].rect,
            rootLanguage: c.rootLanguage,
            paragraphs,
            textAtoms: c.text.map(x => ({
              parentIndex: x.parentIndex,
              characters: x.text,
              rects: x.rects,
              style: pick(x.style),
            })),
          };
        }
        const required = {
          cite:
            locale === 'arabic'
              ? ['verified-source-synthesized-italic']
              : ['verified-source-italic-face'],
          quotation: [
            'locale-UA-open-close-quote-flow',
            'whole-logical-italic-text',
            ...(locale === 'arabic'
              ? ['verified-source-synthesized-italic']
              : []),
          ],
          'list-ordered': [
            'native-outside-decimal-marker-flow',
            'whole-logical-rich-Strong-list-items',
          ],
          'list-unordered': [
            'native-outside-disc-marker-flow',
            'whole-logical-rich-Strong-list-items',
          ],
          code: [
            'rich-inline-background-and-padding',
            'verified-system-mono-weight500',
            'whole-logical-paragraph-with-inline-boxes',
          ],
          abbreviation: [
            'rich-inline-wrapping-box-and-dashed-border',
            'source-title-tooltip-metadata',
            'whole-logical-paragraph-with-inline-boxes',
          ],
        }[treatment];
        contracts.push({
          id: 'semantic-inline-' + treatment + '-' + locale + '-' + width,
          treatment,
          locale,
          sourceViewport: width,
          byMode,
          requiredCapabilities: required,
          buildable: false,
          consumerEditContract:
            'Whole logical copy only after validated inline ownership and measured reflow support. No independent sentence fragments.',
          nativeAccepted: false,
        });
      }
  return {
    sourceOnly: true,
    sourceCases: 180,
    requiredFiniteSpecimens: 36,
    families: [],
    contracts,
    sourceRecipeReady: false,
    nativeAccepted: false,
  };
}
module.exports = { buildSemanticInlineSourceContracts };
