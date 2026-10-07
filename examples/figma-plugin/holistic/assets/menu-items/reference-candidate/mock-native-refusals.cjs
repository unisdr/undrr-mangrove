"use strict";
const fs = require("fs"),
  assert = require("node:assert/strict"),
  copy = (x) => JSON.parse(JSON.stringify(x));
const root =
  "/Users/khawkins/Documents/git/drupal-base/.ddev/related-repos/undrr-mangrove";
const { environment } = require(
  root + "/examples/figma-plugin/dev/mock-kit.cjs",
);
const doc = JSON.parse(fs.readFileSync(__dirname + "/document.json"));
const snapshot = (e) =>
  copy({
    nodes: [...e.state.nodes.values()].map((n) => ({
      id: n.id,
      type: n.type,
      parent: n.parent?.id,
      children: n.children?.map((c) => c.id),
      data: n.sharedPluginData,
    })),
    vars: e.state.variables.map((v) => ({
      id: v.id,
      name: v.name,
      values: v.valuesByMode,
    })),
    styles: e.state.styles.map((s) => ({
      id: s.id,
      name: s.name,
      font: s.fontName,
      effects: s.effects,
      bindings: s.boundVariables,
    })),
  });
(async () => {
  const results = [];
  for (const face of ["Roboto Regular", "Noto Sans Arabic Regular"]) {
    const e = environment(doc);
    e.state.modeLimit = 5;
    const imported = await e.call(
      "importVariables",
      doc,
      doc.modes.map((m) => m.id),
      false,
      [],
      true,
    );
    assert.deepEqual(copy(imported.errors), []);
    e.state.rejectedFonts.add(face);
    const before = snapshot(e),
      result = await e.call(
        "buildMangroveComponents",
        doc,
        "undrr",
        ["menu-items-controlled-source-candidate"],
        { refreshReview: false },
      );
    assert(result.errors.length);
    assert.deepEqual(copy(result.createdNodeIds), []);
    assert.deepEqual(snapshot(e), before);
    results.push({
      face,
      errors: copy(result.errors),
      exactPermanentSnapshotUnchanged: true,
    });
  }
  fs.writeFileSync(
    __dirname + "/native-refusal-verdict.json",
    JSON.stringify(
      { results, offlineFixtureOnly: true, nativeCalls: false },
      null,
      2,
    ) + "\n",
  );
  console.log(
    "Two exact Latin/Arabic named-font load failures refuse before permanent style/scene mutation; original imported assets preserved.",
  );
})().catch((e) => {
  console.error(e.stack);
  process.exitCode = 1;
});
