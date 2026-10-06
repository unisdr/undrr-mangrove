"use strict";
const fs = require("fs"),
  path = require("path"),
  os = require("os"),
  assert = require("assert/strict"),
  { document, setup } = require("../../../dev/mock-arabic-landing.cjs"),
  recipe = require("../../../../../scripts/figma-arabic-landing-recipes.cjs"),
  copy = (x) => JSON.parse(JSON.stringify(x)),
  root = path.resolve(__dirname, "../../../../..");
async function negatives() {
  let refused = 0;
  for (const mutate of [
    (d) => {
      d.variables.find((v) =>
        v.name.startsWith("component/arabic-landing-"),
      ).type = "COLOR";
    },
    (d) => {
      d.styles.text.find((v) =>
        v.id.startsWith("component.arabic-landing-"),
      ).values.mcr.fontName = "foreign";
    },
    (d) => {
      d.styles.text.find((v) =>
        v.id.startsWith("component.arabic-landing-"),
      ).values.irp.fontName = { family: "", style: "Regular" };
    },
    (d) => {
      const st = d.styles.text.find((v) =>
        v.id.startsWith("component.arabic-landing-"),
      );
      d.styles.effect.push(copy(st));
    },
    (d) => {
      d.modes.pop();
    },
    (d) => {
      const v = d.variables.find((v) =>
        v.name.startsWith("component/arabic-landing-"),
      );
      delete v.values.irp;
    },
  ]) {
    const d = document();
    mutate(d);
    const before = copy(d);
    assert.throws(
      () => recipe.buildArabicLandingRecipes({ root, ...d }),
      /Arabic landing source recipe needs updating/,
    );
    assert.deepEqual(d, before);
    refused++;
  }
  const audit = JSON.parse(fs.readFileSync(__dirname + "/source-audit.json"));
  for (const suffix of [
    "LandingPages.jsx",
    ".woff2",
    "undrr-logo-ar-white.svg",
  ]) {
    const selected = Object.keys(audit.sourcePins).find((f) =>
      f.endsWith(suffix),
    );
    assert(selected);
    const temp = fs.mkdtempSync(
      path.join(os.tmpdir(), "arabic-source-refusal-"),
    );
    try {
      const assetDest = path.join(
        temp,
        "examples/figma-plugin/holistic/assets/arabic-landing",
      );
      fs.mkdirSync(path.dirname(assetDest), { recursive: true });
      fs.symlinkSync(__dirname, assetDest);
      for (const file of Object.keys(audit.sourcePins)) {
        const dest = path.join(temp, file);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.symlinkSync(path.join(root, file), dest);
      }
      fs.unlinkSync(path.join(temp, selected));
      fs.writeFileSync(
        path.join(temp, selected),
        Buffer.concat([
          fs.readFileSync(path.join(root, selected)),
          Buffer.from("\nsource drift"),
        ]),
      );
      const d = document(),
        before = copy(d);
      assert.throws(
        () => recipe.buildArabicLandingRecipes({ root: temp, ...d }),
        /source /,
      );
      assert.deepEqual(d, before);
      refused++;
    } finally {
      fs.rmSync(temp, { recursive: true, force: true });
    }
  }
  const d = document(),
    env = await setup(d);
  const available = env.figma.listAvailableFontsAsync;
  env.figma.listAvailableFontsAsync = async () =>
    (await available()).filter((f) => f.fontName.family !== "Noto Kufi Arabic");
  const imported = await env.call(
    "importVariables",
    d,
    ["undrr"],
    false,
    [],
    false,
  );
  assert.deepEqual(copy(imported.errors), []);
  const before = [...env.state.nodes.keys()],
    built = await env.call(
      "buildMangroveComponents",
      d,
      "undrr",
      d.components.families.map((f) => f.id),
    );
  assert(built.errors.length);
  assert.deepEqual([...env.state.nodes.keys()], before);
  refused++;
  return refused;
}
module.exports = { negatives };
