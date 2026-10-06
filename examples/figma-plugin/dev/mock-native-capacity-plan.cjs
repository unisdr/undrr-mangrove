#!/usr/bin/env node
'use strict';
const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const {
  buildNativeCapacityProposal,
  evaluateCapacityInventory,
  PLAN_ID,
} = require('../../../scripts/figma-native-capacity-plan.cjs');
const copy = x => JSON.parse(JSON.stringify(x));
const sha = x =>
  crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
function fixture() {
  const modes = ['undrr', 'delta', 'irp', 'mcr', 'preventionweb'].map(id => ({
    id,
    name: id,
  }));
  const values = x =>
    Object.fromEntries(
      modes.map((m, i) => [m.id, typeof x === 'function' ? x(i) : copy(x)])
    );
  const variable = (id, name, type, value) => ({
    id,
    name,
    type,
    values: values(value),
  });
  const foundation = {
    modes,
    variables: [
      variable('base.width', 'width/core', 'FLOAT', i => 100 + i),
      variable('base.color', 'color/core', 'COLOR', { r: 0, g: 0, b: 0, a: 1 }),
      variable('base.font', 'font-family/text', 'STRING', 'Roboto'),
    ],
    styles: {
      text: [
        {
          id: 'base.text',
          name: 'Base text',
          bindings: { fontFamily: 'font-family/text' },
          values: values({
            fontName: { family: 'Roboto', style: 'Regular' },
            fontSize: 16,
          }),
        },
      ],
      effect: [],
    },
  };
  const cat = copy(foundation);
  cat.variables.push(
    variable('range.width', 'component/range/width', 'FLOAT', i => 20 + i),
    variable('range.alias', 'component/range/alias', 'FLOAT', {
      alias: 'width/core',
    }),
    variable(
      'gallery.width',
      'component/gallery-image/basic-gallery-0-390/root-width',
      'FLOAT',
      358
    ),
    variable(
      'hub.size',
      'component/content-hub/type/header/390/font-size',
      'FLOAT',
      16
    ),
    variable('unused', 'component/copy-cite/retained', 'FLOAT', 0)
  );
  cat.styles.text.push({
    id: 'gallery.text',
    name: 'Gallery text',
    bindings: {
      fontSize: 'component/content-hub/type/header/390/font-size',
      fontFamily: 'font-family/text',
    },
    values: values({
      fontName: { family: 'Roboto', style: 'Regular' },
      fontSize: 16,
    }),
  });
  const packet = {
    kind: 'mangrove-component-source-drafts',
    schemaVersion: 1,
    source: { revision: 'fixture', workingInputs: 'historical candidate' },
    baseContract: {
      variables: 3,
      textDefinitions: 1,
      effects: 0,
      assetsSha256: sha({
        variables: foundation.variables,
        styles: foundation.styles,
      }),
    },
    foundationCatalogue: cat,
    draftFamilies: [
      {
        id: 'range',
        variants: [
          {
            id: 'range.default',
            tree: {
              type: 'FRAME',
              layout: { width: 'component/range/width' },
              children: [
                {
                  type: 'INSTANCE',
                  family: 'gallery-image',
                  variant: 'gallery-image.basic-gallery-0-390',
                },
              ],
            },
          },
        ],
        review: { specimens: [{ instanceWidth: 'component/range/alias' }] },
      },
      {
        id: 'gallery-image',
        variants: [
          {
            id: 'gallery-image.basic-gallery-0-390',
            sourceContract: {
              story: 'basic-gallery',
              viewport: 390,
              selectedIndex: 0,
            },
            tree: {
              type: 'TEXT',
              layout: {
                width: 'component/gallery-image/basic-gallery-0-390/root-width',
              },
              textStyle: 'gallery.text',
            },
          },
        ],
      },
    ],
    draftDependencies: [],
  };
  return { packet, foundation };
}
function rejected(mutate, expression) {
  const f = fixture();
  mutate(f);
  const before = structuredClone(f);
  assert.throws(() => buildNativeCapacityProposal(f), expression);
  assert.deepStrictEqual(f, before, 'Refusal changed caller source');
}
function inventory(extra = 0) {
  const variables = Array.from({ length: extra }, (_, i) => ({
    id: 'old-' + i,
    sourceId: 'stale-' + i,
    variableCollectionId: 'native-foundation',
    remote: false,
  }));
  return {
    scope: 'all-local-collections-and-variables',
    complete: true,
    provenance: { kind: 'offline capacity projection' },
    collections: [
      {
        id: 'native-foundation',
        remote: false,
        ledger: { version: 1, planId: PLAN_ID, collectionId: 'foundation' },
        variableIds: variables.map(v => v.id),
      },
    ],
    variables,
  };
}
function main() {
  const f = fixture(),
    before = copy(f),
    p = buildNativeCapacityProposal(f);
  assert.deepStrictEqual(buildNativeCapacityProposal(f), p);
  assert.deepStrictEqual(f, before);
  assert.equal(p.collectionProposal.length, 59);
  assert.equal(
    p.assignments.length,
    f.packet.foundationCatalogue.variables.length
  );
  assert.equal(p.nativeOccupancy, 'unverified');
  assert.equal(p.nativeAcceptance, false);
  for (const key of [
    'collection',
    'modes',
    'variables',
    'styles',
    'components',
    'nativeCollections',
  ])
    assert(!Object.hasOwn(p, key));
  assert(p.retainedWithoutExactNameReferences.includes('unused'));
  assert.equal(p.aliasEdges.length, 5);
  assert(
    p.aliasEdges.every(
      e => e.sourceOwner === 'source-range' && e.targetOwner === 'foundation'
    )
  );
  const r = p.familyReferences.find(x => x.familyId === 'range');
  assert(
    r.conservativeRoleClosure.includes('range.alias'),
    'Review width omitted'
  );
  assert(
    r.conservativeRoleClosure.includes('gallery.width'),
    'INSTANCE dependency omitted'
  );
  assert(
    r.conservativeRoleClosure.includes('hub.size'),
    'Nested style role omitted'
  );
  assert(
    r.conservativeRoleClosure.includes('base.width'),
    'Alias closure omitted'
  );
  const reordered = copy(f);
  reordered.packet.foundationCatalogue.variables.reverse();
  assert.deepStrictEqual(
    buildNativeCapacityProposal(reordered).assignments,
    p.assignments
  );
  const maintained = copy(f);
  maintained.packet.foundationCatalogue.variables.find(
    v => v.id === 'range.width'
  ).values.mcr = 155;
  assert.deepStrictEqual(
    buildNativeCapacityProposal(maintained).assignments,
    p.assignments,
    'Values changed ownership'
  );
  const growth = copy(f);
  const added = copy(
    growth.packet.foundationCatalogue.variables.find(
      v => v.id === 'range.width'
    )
  );
  added.id = 'range.more';
  added.name = 'component/range/more';
  growth.packet.foundationCatalogue.variables.push(added);
  const g = buildNativeCapacityProposal(growth);
  assert(
    g.assignments.some(
      x => x.sourceId === 'range.more' && x.ownerId === 'source-range'
    )
  );
  assert(
    p.assignments.every(x =>
      g.assignments.some(
        y => y.sourceId === x.sourceId && y.ownerId === x.ownerId
      )
    )
  );
  rejected(
    x => (x.packet.foundationCatalogue.variables[0].values.mcr = 0),
    /Normal variable changed/
  );
  rejected(
    x => (x.foundation.variables[0].values.mcr = 0),
    /foundation digest/
  );
  rejected(
    x =>
      x.packet.foundationCatalogue.variables.push(
        copy(x.packet.foundationCatalogue.variables[0])
      ),
    /duplicate/
  );
  rejected(
    x =>
      (x.packet.foundationCatalogue.variables[3].name =
        'component/unknown/width'),
    /unknown producer/
  );
  rejected(
    x =>
      (x.packet.draftFamilies[1].variants[0].sourceContract.story = 'invented'),
    /Gallery/
  );
  rejected(
    x =>
      (x.packet.foundationCatalogue.variables[5].name =
        'component/gallery-image/missing-0-390/width'),
    /Gallery context/
  );
  rejected(
    x =>
      (x.packet.foundationCatalogue.variables[6].name =
        'component/content-hub/unknown/size'),
    /ContentHub/
  );
  rejected(
    x => delete x.packet.foundationCatalogue.variables[3].values.mcr,
    /all-mode/
  );
  rejected(
    x => (x.packet.foundationCatalogue.variables[3].values.mcr = NaN),
    /typed literal/
  );
  rejected(
    x =>
      (x.packet.foundationCatalogue.variables[4].values.mcr = {
        alias: 'missing',
      }),
    /alias/
  );
  rejected(
    x =>
      (x.packet.foundationCatalogue.variables[4].values.mcr = {
        alias: 'color/core',
      }),
    /alias/
  );
  rejected(
    x =>
      (x.packet.foundationCatalogue.variables[4].values.mcr = {
        alias: 'width/core',
        extra: true,
      }),
    /alias/
  );
  rejected(
    x =>
      (x.packet.foundationCatalogue.variables[4].values.mcr = {
        alias: 'component/range/alias',
      }),
    /cycle/
  );
  rejected(
    x =>
      x.packet.foundationCatalogue.styles.effect.push(
        copy(x.packet.foundationCatalogue.styles.text[1])
      ),
    /cross-kind/
  );
  rejected(x => {
    const sample = x.packet.foundationCatalogue.variables[3];
    for (let i = 0; i < 5000; i++)
      x.packet.foundationCatalogue.variables.push({
        ...copy(sample),
        id: 'more-' + i,
        name: 'component/range/more-' + i,
      });
  }, /exceeds5000/);
  const empty = {
    scope: 'all-local-collections-and-variables',
    complete: true,
    collections: [],
    variables: [],
  };
  const e = evaluateCapacityInventory(p, empty);
  assert.equal(e.rows.find(r => r.ownerId === 'foundation').resulting, 3);
  for (const mutate of [
    x => x.assignments.push(copy(x.assignments[0])),
    x => x.collectionProposal[0].variableIds.push('missing'),
    x => x.collectionProposal.pop(),
    x => {
      x.assignments[0].ownerId = 'unknown';
    },
  ]) {
    const bad = copy(p);
    mutate(bad);
    assert.throws(() => evaluateCapacityInventory(bad, empty));
  }
  const atLimit = inventory(4997),
    snap = copy(atLimit);
  const v = evaluateCapacityInventory(p, atLimit);
  assert.equal(v.rows.find(r => r.ownerId === 'foundation').resulting, 5000);
  assert.deepStrictEqual(atLimit, snap);
  assert.throws(
    () => evaluateCapacityInventory(p, inventory(4998)),
    /occupancy exceeds5000/
  );
  const reuse = inventory();
  reuse.variables.push({
    id: 'known',
    sourceId: 'base.width',
    variableCollectionId: 'native-foundation',
    remote: false,
  });
  reuse.collections[0].variableIds.push('known');
  assert.equal(
    evaluateCapacityInventory(p, reuse).rows.find(
      r => r.ownerId === 'foundation'
    ).missing,
    2
  );
  for (const mutate of [
    s => {
      s.complete = false;
    },
    s => {
      s.collections[0].remote = true;
    },
    s => {
      s.variables[0].sourceId = null;
    },
    s => {
      s.variables[0].remote = true;
    },
    s => {
      s.variables[0].sourceId = 'range.width';
    },
    s => {
      s.variables.push({ ...copy(s.variables[0]), id: 'duplicate' });
      s.collections[0].variableIds.push('duplicate');
    },
    s => {
      s.collections[0].variableIds.push('missing');
    },
    s => {
      s.variables[0].variableCollectionId = 'other';
    },
    s => {
      s.collections.push({
        ...copy(s.collections[0]),
        id: 'duplicate-col',
        variableIds: [],
      });
    },
  ]) {
    const s = inventory(1);
    mutate(s);
    const original = copy(s);
    assert.throws(() => evaluateCapacityInventory(p, s));
    assert.deepStrictEqual(s, original);
  }
  const temp = fs.mkdtempSync(
    path.join(os.tmpdir(), 'mangrove-capacity-test-')
  );
  try {
    const input = path.join(temp, 'packet.json'),
      base = path.join(temp, 'foundation.json'),
      out = path.join(temp, 'proposal.json');
    fs.writeFileSync(input, JSON.stringify(f.packet));
    fs.writeFileSync(base, JSON.stringify(f.foundation));
    const command = path.resolve(
      __dirname,
      '../../../scripts/figma-native-capacity-plan.cjs'
    );
    execFileSync(process.execPath, [
      command,
      '--packet',
      input,
      '--foundation',
      base,
      '--output',
      out,
    ]);
    const cli = JSON.parse(fs.readFileSync(out));
    assert.deepStrictEqual(cli.assignments, p.assignments);
    assert.equal(
      spawnSync(process.execPath, [
        command,
        '--packet',
        input,
        '--foundation',
        base,
        '--output',
        out,
      ]).status,
      1
    );
    assert.equal(
      spawnSync(process.execPath, [
        command,
        '--packet',
        input,
        '--foundation',
        base,
        '--output',
        input,
      ]).status,
      1
    );
    assert.equal(
      spawnSync(process.execPath, [command, '--unknown', input]).status,
      1
    );
    assert.deepStrictEqual(JSON.parse(fs.readFileSync(input)), f.packet);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
  console.log(
    'Read-only fixed59-owner proposal: stable identities, complete aliases/styles/review/INSTANCE closure, retained roles, source refusals and exact5000/stale occupancy/foreign identity gates pass. No native acceptance.'
  );
}
if (require.main === module) main();
module.exports = { fixture };
