#!/usr/bin/env node
/** Read-only ownership proposal. This never produces an importer DTO. */
'use strict';
const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const PLAN_ID = 'mangrove-source93-capacity-v1';
const LIMIT = 5000;
const STORIES = Object.freeze([
  'basic-gallery',
  'corner-navigation',
  'infinite-loop',
  'many-images',
  'minimal',
  'mixed-aspect-ratios',
  'start-at-second-image',
  'thumbnails-bottom',
  'without-arrows',
  'without-descriptions',
  'without-thumbnails',
]);
// Explicit source producer boundaries. New producers require a reviewed manifest.
const PRODUCERS = Object.freeze([
  'range',
  'notice',
  'breadcrumbs',
  'skip-link',
  'highlight-box',
  'accordion',
  'pager',
  'user-feedback',
  'editorial',
  'card-content',
  'search-control',
  'page-pattern',
  'page-chrome',
  'page-reading',
  'page-chrome-open',
  'landing-report',
  'news-dependency',
  'news-related',
  'news-editorial',
  'news-contextual-highlight',
  'copy-cite',
  'news-image-header',
  'search-widget',
  'form-composition',
  'news-source-exclusion',
  'news-article-scene',
  'legend',
  'stats-card',
  'tree',
  'code-block',
  'show-more',
  'scroll-container-hydrated',
  'scroll-container-photo',
  'error-page',
  'preview-access-static',
  'preview-access-live',
  'gallery-html',
  'gallery-mixed-media-image',
  'news-image-article-scene',
  'service-notice',
  'snackbar',
  'user-feedback-confirmation',
  'search-result',
]);
const TAG_NAMES = Object.freeze([
  'tag/min-height',
  'tag/min-width',
  'tag/border-width',
  'tag/accent-edge-width',
  'tag/transparent',
]);
const COLLECTION_IDS = Object.freeze(
  [
    'foundation',
    'source-tag',
    ...PRODUCERS.map(p => 'source-' + p),
    ...STORIES.map(s => 'gallery-image-story-' + s),
    'content-hub-geometry',
    'content-hub-paint',
    'content-hub-type',
  ].sort()
);
const copy = x => JSON.parse(JSON.stringify(x));
const digest = x =>
  crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const fail = s => {
  throw Error('Native capacity proposal: ' + s);
};
const nonempty = x => typeof x === 'string' && x.trim().length > 0;
function index(list, key, label) {
  if (!Array.isArray(list)) fail(label + ' array required');
  const map = new Map();
  for (const x of list) {
    if (!x || !nonempty(x[key]) || map.has(x[key]))
      fail(label + ' duplicate/missing ' + key);
    map.set(x[key], x);
  }
  return map;
}
function walk(x, visit) {
  if (typeof x === 'string') visit(x);
  else if (Array.isArray(x)) for (const v of x) walk(v, visit);
  else if (x && typeof x === 'object')
    for (const v of Object.values(x)) walk(v, visit);
}
function buildNativeCapacityProposal({ packet, foundation }) {
  if (
    packet?.kind !== 'mangrove-component-source-drafts' ||
    packet.schemaVersion !== 1
  )
    fail('source-only packet required');
  const cat = packet.foundationCatalogue;
  if (!cat || !foundation || !packet.baseContract)
    fail('catalogue/foundation required');
  const modes = index(cat.modes, 'id', 'source modes');
  index(cat.modes, 'name', 'source modes');
  if (
    [...modes.keys()].sort().join(',') !== 'delta,irp,mcr,preventionweb,undrr'
  )
    fail('exact five source brands required');
  assert.deepStrictEqual(
    cat.modes,
    foundation.modes,
    'Normal foundation modes changed'
  );
  const variables = index(cat.variables, 'id', 'variables');
  const names = index(cat.variables, 'name', 'variable names');
  const base = index(foundation.variables, 'id', 'foundation');
  if (
    digest({ variables: foundation.variables, styles: foundation.styles }) !==
    packet.baseContract.assetsSha256
  )
    fail('normal foundation digest mismatch');
  if (packet.baseContract.variables !== base.size)
    fail('normal foundation count mismatch');
  for (const [id, v] of base)
    assert.deepStrictEqual(
      variables.get(id),
      v,
      'Normal variable changed: ' + id
    );
  const styleLists = {};
  const styleIds = new Map();
  for (const kind of ['text', 'effect']) {
    styleLists[kind] = index(cat.styles?.[kind], 'id', kind + ' styles');
    index(cat.styles[kind], 'name', kind + ' style names');
    for (const [id, s] of styleLists[kind]) {
      if (styleIds.has(id)) fail('cross-kind style identity');
      styleIds.set(id, s);
    }
    const originals = index(foundation.styles?.[kind], 'id', 'normal ' + kind);
    for (const [id, s] of originals)
      assert.deepStrictEqual(
        styleLists[kind].get(id),
        s,
        'Normal style changed: ' + id
      );
  }
  const families = [
    ...(packet.draftFamilies || []),
    ...(packet.draftDependencies || []),
  ];
  const familyIds = index(families, 'id', 'families/dependencies');
  const gallery = familyIds.get('gallery-image');
  const galleryContexts = new Map();
  for (const v of gallery?.variants || []) {
    const c = v.sourceContract;
    if (
      !c ||
      !STORIES.includes(c.story) ||
      ![390, 767, 768, 1164].includes(c.viewport) ||
      !Number.isInteger(c.selectedIndex) ||
      c.selectedIndex < 0 ||
      v.id !==
        'gallery-image.' + c.story + '-' + c.selectedIndex + '-' + c.viewport
    )
      fail('authored Gallery story context mismatch');
    const key = v.id.slice('gallery-image.'.length);
    if (galleryContexts.has(key)) fail('duplicate Gallery context');
    galleryContexts.set(key, c.story);
  }
  const ownerById = new Map();
  function owner(v) {
    if (base.has(v.id)) return 'foundation';
    if (TAG_NAMES.includes(v.name)) return 'source-tag';
    const p = v.name.split('/');
    if (p[0] !== 'component') fail('unknown producer ' + v.name);
    if (p[1] === 'gallery-image') {
      if (!galleryContexts.has(p[2]))
        fail('unregistered Gallery context ' + v.name);
      return 'gallery-image-story-' + galleryContexts.get(p[2]);
    }
    if (p[1] === 'content-hub') {
      if (!['geometry', 'paint', 'type'].includes(p[2]))
        fail('unknown ContentHub role constructor');
      return 'content-hub-' + p[2];
    }
    if (!PRODUCERS.includes(p[1])) fail('unknown producer ' + v.name);
    return 'source-' + p[1];
  }
  for (const v of variables.values()) ownerById.set(v.id, owner(v));
  const aliasEdges = [];
  function literal(v, x) {
    const valid =
      v.type === 'FLOAT'
        ? typeof x === 'number' && Number.isFinite(x)
        : v.type === 'STRING'
          ? typeof x === 'string'
          : v.type === 'BOOLEAN'
            ? typeof x === 'boolean'
            : v.type === 'COLOR'
              ? x &&
                typeof x === 'object' &&
                !Array.isArray(x) &&
                ['r', 'g', 'b'].every(
                  k =>
                    typeof x[k] === 'number' &&
                    Number.isFinite(x[k]) &&
                    x[k] >= 0 &&
                    x[k] <= 1
                ) &&
                (x.a === undefined ||
                  (typeof x.a === 'number' &&
                    Number.isFinite(x.a) &&
                    x.a >= 0 &&
                    x.a <= 1))
              : false;
    if (!valid) fail('invalid typed literal ' + v.name);
  }
  for (const v of variables.values()) {
    if (
      !v.values ||
      Object.keys(v.values).sort().join(',') !==
        [...modes.keys()].sort().join(',')
    )
      fail('all-mode values missing/extra ' + v.name);
    for (const m of modes.keys()) {
      const x = v.values[m];
      if (x && typeof x === 'object' && Object.hasOwn(x, 'alias')) {
        if (Object.keys(x).length !== 1 || !nonempty(x.alias))
          fail('malformed alias ' + v.name);
        const target = names.get(x.alias);
        if (!target || target.type !== v.type)
          fail('missing/type-changing alias ' + v.name);
        aliasEdges.push({
          sourceId: v.id,
          targetId: target.id,
          modeId: m,
          sourceOwner: ownerById.get(v.id),
          targetOwner: ownerById.get(target.id),
        });
      } else literal(v, x);
    }
  }
  for (const mode of modes.keys()) {
    const done = new Set();
    function resolve(v, stack) {
      if (done.has(v.id)) return;
      if (stack.has(v.id)) fail('alias cycle ' + v.name);
      const x = v.values[mode];
      if (x && Object.hasOwn(x, 'alias'))
        resolve(names.get(x.alias), new Set([...stack, v.id]));
      done.add(v.id);
    }
    for (const v of variables.values()) resolve(v, new Set());
  }
  const direct = x => {
    const roles = new Set(),
      styles = new Set(),
      deps = new Set();
    walk(x, s => {
      if (names.has(s)) roles.add(names.get(s).id);
      if (styleIds.has(s)) styles.add(s);
      if (familyIds.has(s)) deps.add(s);
    });
    return { roles, styles, deps };
  };
  const styleRoles = new Map(
    [...styleIds].map(([id, s]) => [id, direct(s).roles])
  );
  const familyReferences = [];
  const allReferenced = new Set();
  for (const [id, f] of familyIds) {
    const visited = new Set(),
      roles = new Set();
    function addFamily(fid) {
      if (visited.has(fid)) return;
      visited.add(fid);
      const r = direct(familyIds.get(fid));
      for (const role of r.roles) roles.add(role);
      for (const sid of r.styles)
        for (const role of styleRoles.get(sid)) roles.add(role);
      for (const dependency of r.deps) addFamily(dependency);
    }
    addFamily(id);
    function aliases(role) {
      const v = variables.get(role);
      for (const mode of modes.keys()) {
        const x = v.values[mode];
        if (x && Object.hasOwn(x, 'alias')) {
          const target = names.get(x.alias).id;
          if (!roles.has(target)) {
            roles.add(target);
            aliases(target);
          }
        }
      }
    }
    for (const role of [...roles]) aliases(role);
    for (const role of roles) allReferenced.add(role);
    familyReferences.push({
      familyId: id,
      referencedOwners: [
        ...new Set([...roles].map(r => ownerById.get(r))),
      ].sort(),
      conservativeRoleClosure: [...roles].sort(),
      conservativeFamilyClosure: [...visited].sort(),
    });
  }
  for (const roles of styleRoles.values())
    for (const role of roles) allReferenced.add(role);
  for (const e of aliasEdges) allReferenced.add(e.targetId);
  const collectionProposal = COLLECTION_IDS.map(id => {
    const own = [...variables.values()].filter(v => ownerById.get(v.id) === id);
    if (own.length > LIMIT)
      fail('owner exceeds5000 without rebucketing: ' + id);
    return {
      id,
      variableIds: own.map(v => v.id).sort(),
      requested: own.length,
      freshTargetHeadroom: LIMIT - own.length,
      sourceFiles: [
        ...new Set(own.map(v => v.sourceRef?.file).filter(Boolean)),
      ].sort(),
    };
  });
  return {
    kind: 'mangrove-native-capacity-proposal',
    schemaVersion: 1,
    planId: PLAN_ID,
    source: copy(packet.source),
    sourceContentSha256: digest(cat),
    sourceCounts: {
      families: packet.draftFamilies.length,
      variants: packet.draftFamilies.reduce((n, f) => n + f.variants.length, 0),
      variables: variables.size,
      textStyles: styleLists.text.size,
      effectStyles: styleLists.effect.size,
    },
    collectionProposal,
    modeIds: [...modes.keys()],
    assignments: [...ownerById]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([sourceId, ownerId]) => ({ sourceId, ownerId })),
    aliasEdges: aliasEdges.sort((a, b) =>
      JSON.stringify(a).localeCompare(JSON.stringify(b))
    ),
    familyReferences: familyReferences.sort((a, b) =>
      a.familyId.localeCompare(b.familyId)
    ),
    retainedWithoutExactNameReferences: [...variables.keys()]
      .filter(id => !allReferenced.has(id))
      .sort(),
    nativeOccupancy: 'unverified',
    nativeAcceptance: false,
    limitations: [
      'Read-only ownership proposal; no nativeCollections or importer DTO is produced.',
      'All source records, IDs, five mode values, aliases, styles and review consumers retained; no equality deduplication or allocation specialization.',
      'Reference closure conservatively includes exact names/IDs in complete family metadata, reviews, styles and dependency families. Unclassified metadata is not discarded.',
      'Fresh counts exclude no stale native occupant. Actual owned inventory and target plan/collection-count feasibility are separate gates.',
      'Current native V1 FRAME-only empty-style capability refuses this advanced catalogue; compiled50,000 ceiling, pixels, publication and ordinary desktop remain separate.',
      'Captured allocation and equal-value paint aliases are not proof of semantic maintenance relationships; original alias graph is preserved for separate fidelity review.',
    ],
  };
}
function evaluateCapacityInventory(proposal, snapshot) {
  if (
    proposal?.kind !== 'mangrove-native-capacity-proposal' ||
    proposal.planId !== PLAN_ID
  )
    fail('known proposal required');
  if (
    snapshot?.scope !== 'all-local-collections-and-variables' ||
    snapshot.complete !== true
  )
    fail('complete caller-supplied local inventory required');
  const collections = index(
    snapshot.collections,
    'id',
    'inventory collections'
  );
  const vars = index(snapshot.variables, 'id', 'inventory variables');
  const assignments = index(
    proposal.assignments,
    'sourceId',
    'proposal assignments'
  );
  const proposedOwners = index(
    proposal.collectionProposal,
    'id',
    'proposal owners'
  );
  if ([...proposedOwners.keys()].sort().join(',') !== COLLECTION_IDS.join(','))
    fail('fixed proposal owner set changed');
  const requested = new Map(
    [...assignments].map(([id, row]) => [id, row.ownerId])
  );
  const partition = new Set();
  for (const p of proposedOwners.values()) {
    if (
      !Array.isArray(p.variableIds) ||
      p.requested !== p.variableIds.length ||
      p.variableIds.length > LIMIT
    )
      fail('proposal owner capacity/count changed');
    for (const id of p.variableIds) {
      if (!nonempty(id) || partition.has(id) || requested.get(id) !== p.id)
        fail('proposal partition changed');
      partition.add(id);
    }
  }
  if (partition.size !== requested.size) fail('proposal assignment omitted');
  const owned = new Map(),
    seenSource = new Map();
  for (const c of collections.values()) {
    if (
      !Array.isArray(c.variableIds) ||
      new Set(c.variableIds).size !== c.variableIds.length
    )
      fail('invalid inventory membership');
    if (c.ledger?.planId === PLAN_ID) {
      if (
        c.remote !== false ||
        c.ledger.version !== 1 ||
        !COLLECTION_IDS.includes(c.ledger.collectionId) ||
        owned.has(c.ledger.collectionId)
      )
        fail('foreign/duplicate owned collection');
      owned.set(c.ledger.collectionId, c);
    }
    for (const id of c.variableIds) {
      const v = vars.get(id);
      if (!v || v.variableCollectionId !== c.id)
        fail('incomplete/wrong inventory membership');
    }
  }
  for (const v of vars.values()) {
    const c = collections.get(v.variableCollectionId);
    if (!c || !c.variableIds.includes(v.id)) fail('orphan inventory variable');
    if (nonempty(v.sourceId)) {
      if (seenSource.has(v.sourceId))
        fail('duplicate global native source identity');
      seenSource.set(v.sourceId, v);
      if (
        requested.has(v.sourceId) &&
        (v.remote !== false ||
          c.ledger?.planId !== PLAN_ID ||
          c.ledger.collectionId !== requested.get(v.sourceId))
      )
        fail('requested variable moved/foreign owner');
    }
    if (
      c.ledger?.planId === PLAN_ID &&
      (!nonempty(v.sourceId) || v.remote !== false)
    )
      fail('foreign occupant in owned collection');
  }
  const rows = proposal.collectionProposal.map(p => {
    const c = owned.get(p.id),
      existing = c?.variableIds.length || 0;
    const missing = p.variableIds.filter(id => !seenSource.has(id));
    const resulting = existing + missing.length;
    if (resulting > LIMIT)
      fail('actual retained occupancy exceeds5000: ' + p.id);
    return {
      ownerId: p.id,
      nativeCollectionId: c?.id || null,
      existing,
      missing: missing.length,
      resulting,
      headroom: LIMIT - resulting,
    };
  });
  return {
    status: 'Capacity passes for the supplied inventory projection only',
    inventoryProvenance: copy(snapshot.provenance || null),
    nativeAcceptance: false,
    collectionCountFeasibility: 'unverified',
    rows,
  };
}
function cli(args) {
  const allowed = new Set([
    '--packet',
    '--foundation',
    '--output',
    '--inventory',
  ]);
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    if (
      !allowed.has(args[i]) ||
      !args[i + 1] ||
      Object.hasOwn(options, args[i])
    )
      fail('CLI arguments');
    options[args[i]] = args[i + 1];
  }
  if (!options['--packet'] || !options['--foundation'])
    fail('--packet and --foundation required');
  const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
  const result = buildNativeCapacityProposal({
    packet: read(options['--packet']),
    foundation: read(options['--foundation']),
  });
  result.packetBytesSha256 = crypto
    .createHash('sha256')
    .update(fs.readFileSync(options['--packet']))
    .digest('hex');
  if (options['--inventory'])
    result.capacityInventory = evaluateCapacityInventory(
      result,
      read(options['--inventory'])
    );
  const out = JSON.stringify(result, null, 2) + '\n';
  if (options['--output']) {
    const paths = ['--packet', '--foundation', '--inventory']
      .filter(k => options[k])
      .map(k => fs.realpathSync(options[k]));
    const path = require('path');
    if (paths.includes(path.resolve(options['--output'])))
      fail('output cannot overwrite an input');
    fs.writeFileSync(options['--output'], out, { flag: 'wx' });
  } else process.stdout.write(out);
}
if (require.main === module) {
  try {
    cli(process.argv.slice(2));
  } catch (e) {
    process.stderr.write(e.message + '\n');
    process.exitCode = 1;
  }
}
module.exports = {
  buildNativeCapacityProposal,
  evaluateCapacityInventory,
  COLLECTION_IDS,
  PLAN_ID,
};
