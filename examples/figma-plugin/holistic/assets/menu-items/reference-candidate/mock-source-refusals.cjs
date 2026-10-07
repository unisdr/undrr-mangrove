"use strict";
const fs = require("fs"),
  assert = require("node:assert/strict");
const root =
  "/Users/khawkins/Documents/git/drupal-base/.ddev/related-repos/undrr-mangrove";
const base = JSON.parse(
  fs.readFileSync(root + "/examples/figma-plugin/mangrove-variables.json"),
);
const { buildMenuItemsRecipes } = require("./recipes.cjs");
const SOURCE = "/tmp/mangrove-retained-menu-items-preview-context-source-20261006";
const copy = (x) => structuredClone(x);
const results = [];
for (const [name, change] of [
  ["wrong-role-type", (d) => (d.variables[0].type = "UNSUPPORTED")],
  [
    "nonselected-mode-role",
    (d) => {
      const v = d.variables.find(
        (v) => v.type === "FLOAT" && typeof v.values.mcr === "number",
      );
      v.values.mcr = NaN;
    },
  ],
  [
    "alias-cycle",
    (d) => {
      const v = d.variables.find((v) => v.type === "STRING");
      v.values.mcr = { alias: v.name };
    },
  ],
  ["wrong-style-kind", (d) => (d.styles.text[0].type = "EFFECT")],
  ["wrong-mode-font-shape", (d) => (d.styles.text[0].values.mcr.fontName = [])],
  [
    "extra-style-mode",
    (d) =>
      (d.styles.text[0].values.foreign = {
        fontName: { family: "Roboto", style: "Regular" },
      }),
  ],
]) {
  const d = copy(base);
  change(d);
  const before = copy(d);
  assert.throws(() => buildMenuItemsRecipes(d));
  assert.deepEqual(d, before);
  results.push({ name, callerUnchanged: true });
}
for (const [name, target] of [
  ["actual-preview-context-source-drift", root + "/.storybook/preview.js"],
  [
    "raw-capture-corruption",
    SOURCE + "/captures/undrr-english-390-initial.json",
  ],
  [
    "actual-JSX-source-drift",
    root + "/stories/Atom/Navigation/MenuItems/MenuItems.jsx",
  ],
]) {
  const original = fs.readFileSync;
  const d = copy(base),
    before = copy(d);
  fs.readFileSync = function (p, ...args) {
    const b = original.call(this, p, ...args);
    return String(p) === target
      ? Buffer.concat([
          Buffer.isBuffer(b) ? b : Buffer.from(b),
          Buffer.from(" "),
        ])
      : b;
  };
  try {
    assert.throws(
      () => buildMenuItemsRecipes(d),
      /source.*(?:fingerprint|size)/,
    );
    assert.deepEqual(d, before);
    results.push({ name, callerUnchanged: true });
  } finally {
    fs.readFileSync = original;
  }
}
fs.writeFileSync(
  __dirname + "/source-refusal-verdict.json",
  JSON.stringify(
    { results, nativeCalls: false, sourceRawMutated: false },
    null,
    2,
  ) + "\n",
);
console.log(
  "Nine complete source/archive/role/alias/style/font/preview-context refusals preserve caller arrays.",
);
