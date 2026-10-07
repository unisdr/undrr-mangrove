"use strict";
const fs = require("fs"),
  path = require("path"),
  crypto = require("crypto"),
  assert = require("node:assert/strict");
const SOURCE = "/tmp/mangrove-retained-menu-items-preview-context-source-20261006";
const READY =
  "a804d0ce6f88cedb6fefc755dc4aed3502cde6cc08614f6f88df931458567bed";
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex"),
  copy = (v) => structuredClone(v);
function verifiedInputs({ captureRoot = SOURCE, repositoryRoot } = {}) {
  const readyBytes = fs.readFileSync(
    path.join(captureRoot, "ready-receipt.json"),
  );
  assert.equal(sha(readyBytes), READY, "Menu source receipt changed");
  const receipt = JSON.parse(readyBytes);
  for (const [name, pin] of Object.entries(receipt.files)) {
    const b = fs.readFileSync(path.join(captureRoot, name));
    assert.equal(b.length, pin.bytes, "Menu source size " + name);
    assert.equal(sha(b), pin.sha256, "Menu source fingerprint " + name);
  }
  const provenance = JSON.parse(
      fs.readFileSync(path.join(captureRoot, "provenance.json")),
    ),
    root = repositoryRoot || provenance.root;
  const pins = new Map(Object.entries(provenance.sourcePins));
  for (const entry of Object.values(provenance.compiledActualEntryPoints))
    for (const [name, pin] of Object.entries(entry.loadedSourcePins)) {
      if (pins.has(name)) assert.deepEqual(pins.get(name), pin);
      pins.set(name, pin);
    }
  for (const [name, pin] of pins) {
    const b = fs.readFileSync(path.join(root, name));
    assert.equal(b.length, pin.bytes, "Menu source module size " + name);
    assert.equal(sha(b), pin.sha256, "Menu source module fingerprint " + name);
  }
  const rows = JSON.parse(
    fs.readFileSync(path.join(captureRoot, "source-contracts.json")),
  );
  return { rows, receipt, provenance, root, pins, captureRoot };
}
function sourcePlan(options = {}) {
  const input = verifiedInputs(options),
    groups = new Map(),
    references = [];
  for (const r of input.rows) {
    const raw = JSON.parse(
      fs.readFileSync(
        path.join(input.captureRoot, "captures", r.case + ".json"),
      ),
    );
    assert.equal(raw.anchors.length, 2);
    assert.equal(raw.arguments.text, r.arguments.text);
    assert.deepEqual(raw.previewContext.bodyClasses, r.brand === "undrr" ? [] : ["mg-theme-" + r.brand]);
    assert.equal(raw.previewContext.i18n.locale, r.script === "arabic" ? "ar" : "en");
    assert.equal(raw.previewContext.i18n.direction, r.script === "arabic" ? "rtl" : "ltr");
    assert.equal(raw.previewContext.canvasLang, r.script === "arabic" ? "ar" : "en");
    assert.equal(raw.previewContext.canvasDir, r.script === "arabic" ? "rtl" : "ltr");
    assert.equal(raw.lang, r.script === "arabic" ? "ar" : "en");
    assert.equal(raw.dir, r.script === "arabic" ? "rtl" : "ltr");
    for (const a of raw.anchors) {
      const state = a.hover ? "hover" : a.focusVisible ? "focus" : "normal",
        copyKind = r.state === "caller-copy-update" ? "long" : "short";
      const id = [r.script, r.width, a.owner, state, copyKind].join(".");
      assert.equal(a.tag, "A");
      assert.equal(a.href, "#");
      assert.equal(a.tabIndex, "0");
      assert.equal(a.class, a.owner === "selected" ? "selected" : "");
      assert.equal(a.text, r.arguments.text);
      assert.equal(a.computed.display, "inline");
      assert.equal(a.computed.fontWeight, "400");
      assert.equal(a.computed.fontStyle, "normal");
      assert.equal(a.computed.whiteSpace, "normal");
      assert.equal(a.computed.overflow, "visible");
      assert.equal(a.computed.lineHeight, "24px");
      assert.equal(a.computed.direction, r.script === "arabic" ? "rtl" : "ltr");
      if (r.script === "arabic")
        assert.equal(a.computed.letterSpacing, "normal");
      else
        assert.equal(
          parseFloat(a.computed.letterSpacing),
          parseFloat(a.computed.fontSize) * 0.03,
        );
      assert.equal(
        a.computed.textDecorationLine,
        state === "normal" ? "none" : "underline",
      );
      if (a.owner === "selected") {
        assert.equal(a.computed.borderBottomStyle, "solid");
        assert.equal(a.computed.borderBottomWidth, "2px");
        assert.equal(a.computed.paddingBottom, "2.5px");
      } else {
        assert.equal(a.computed.borderBottomStyle, "none");
        assert.equal(a.computed.borderBottomWidth, "0px");
        assert.equal(a.computed.paddingBottom, "0px");
      }
      if (state === "focus") {
        assert.equal(a.computed.outlineWidth, "2px");
        assert.equal(a.computed.outlineOffset, "2px");
        assert.equal(a.computed.outlineStyle, "solid");
        assert.equal(
          a.computed.boxShadow,
          "rgb(255, 255, 255) 0px 0px 0px 2px",
        );
      } else {
        assert.equal(a.computed.outlineStyle, "none");
        assert.equal(a.computed.boxShadow, "none");
      }
      const relative = (list) =>
        list.map((f) => ({
          width: f.width,
          height: f.height,
          x: f.x - a.box.x,
          y: f.y - a.box.y,
        }));
      const appearance = {
        characters: a.text,
        className: a.class,
        href: a.href,
        tabIndex: a.tabIndex,
        computed: copy(a.computed),
        hover: a.hover,
        focusVisible: a.focusVisible,
        ownerSize: { width: a.box.width, height: a.box.height },
        inlineFragments: relative(a.fragments),
        textFragments: relative(a.textFragments),
      };
      for (const f of [
        ...appearance.inlineFragments,
        ...appearance.textFragments,
      ])
        for (const [k, v] of Object.entries(f))
          assert(
            Number.isFinite(v) && (k === "x" || k === "y" || v > 0),
            "Invalid source fragment " + id + "/" + k,
          );
      let g = groups.get(id);
      if (!g) {
        g = {
          id,
          script: r.script,
          viewport: r.width,
          active: a.owner,
          state,
          copyKind,
          modes: {},
          sourceReferences: [],
        };
        groups.set(id, g);
      }
      if (g.modes[r.brand])
        assert.deepEqual(
          g.modes[r.brand],
          appearance,
          "Unchanged owner not equivalent " + id + "/" + r.brand,
        );
      else g.modes[r.brand] = appearance;
      g.sourceReferences.push({ case: r.case, owner: a.owner });
      references.push({ case: r.case, owner: a.owner, appearanceId: id });
    }
  }
  const appearances = [...groups.values()];
  assert.equal(appearances.length, 32);
  assert.equal(references.length, 240);
  for (const a of appearances) {
    assert.equal(Object.keys(a.modes).length, 5);
    assert.equal(
      new Set(Object.values(a.modes).map((x) => x.inlineFragments.length)).size,
      1,
      "Mode-varying inline topology",
    );
    assert.equal(
      new Set(Object.values(a.modes).map((x) => x.characters)).size,
      1,
    );
  }
  return {
    version: 1,
    sourceKind:
      "controlled actual MenuItems JSX with external UL.menu LI fixture and matching preview theme/I18n/lang/dir contexts",
    authoredStory: false,
    packageExport: false,
    sourceReceiptSHA256: READY,
    sourceAppearances: appearances,
    references,
    sourceOnly: true,
    nativeAccepted: false,
  };
}
module.exports = { sourcePlan, verifiedInputs };
if (require.main === module) {
  const p = sourcePlan();
  fs.writeFileSync(
    path.join(__dirname, "source-plan.json"),
    JSON.stringify(p, null, 2) + "\n",
  );
  console.log(
    "MenuItems32 exact all-five appearances;240 owners losslessly referenced; repeated inactive owners deduplicated without merging source semantics.",
  );
}
