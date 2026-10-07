"use strict";
const fs = require("fs"),
  assert = require("node:assert/strict");
const ROOT =
  "/Users/khawkins/Documents/git/drupal-base/.ddev/related-repos/undrr-mangrove";
const { environment } = require(
  ROOT + "/examples/figma-plugin/dev/mock-kit.cjs",
);
const doc = JSON.parse(fs.readFileSync(__dirname + "/document.json"));
const copy = (x) => JSON.parse(JSON.stringify(x)),
  key = (n) => n.getSharedPluginData("orgundrrmangrove", "mgKitId");
function snap(e) {
  return copy({
    nodes: [...e.state.nodes.values()].map((n) => ({
      id: n.id,
      type: n.type,
      parent: n.parent?.id,
      children: n.children?.map((c) => c.id),
      key: key(n),
      data: n.sharedPluginData,
      width: n.width,
      height: n.height,
      x: n.x,
      y: n.y,
      clips: n.clipsContent,
      mode: n.layoutMode,
      sizingH: n.layoutSizingHorizontal,
      sizingV: n.layoutSizingVertical,
      chars: n.characters,
      font: n.fontName,
      size: n.fontSize,
      line: n.lineHeight,
      tracking: n.letterSpacing,
      deco: n.textDecoration,
      fill: n.fills,
      stroke: n.strokes,
      bindings: n.boundVariables,
      style: n.textStyleId,
      props: n.type === "INSTANCE" ? n.componentProperties : undefined,
      refs: n.componentPropertyReferences,
      explicit: n.explicitVariableModes,
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
      size: s.fontSize,
      line: s.lineHeight,
      tracking: s.letterSpacing,
      bindings: s.boundVariables,
    })),
  });
}
(async () => {
  const results = [];
  for (const mode of doc.modes) {
    const e = environment(doc);
    e.state.modeLimit = 5;
    const imp = await e.call(
      "importVariables",
      doc,
      doc.modes.map((m) => m.id),
      false,
      [],
      true,
    );
    assert.deepEqual(copy(imp.errors), []);
    const build = () =>
      e.call(
        "buildMangroveComponents",
        doc,
        mode.id,
        ["menu-items-controlled-source-candidate"],
        { refreshReview: false },
      );
    const first = await build();
    assert.deepEqual(copy(first.errors), []);
    const masters = [...e.state.nodes.values()].filter(
      (n) =>
        n.type === "COMPONENT" &&
        key(n).startsWith(
          "family/menu-items-controlled-source-candidate/variant/",
        ),
    );
    assert.equal(masters.length, 32);
    const variables = new Map(e.state.variables.map((v) => [v.name, v])),
      sourceVars = new Map(doc.variables.map((v) => [v.name, v]));
    const value = (x) =>
      typeof x === "number" ? x : sourceVars.get(x).values[mode.id];
    for (const v of doc.components.families[0].variants) {
      const k = "family/menu-items-controlled-source-candidate/variant/" + v.id,
        master = masters.find((n) => key(n) === k),
        label = master.findAll((n) => key(n) === k + "/label")[0],
        source = v.sourceContract.modes[mode.id];
      assert(master && label);
      assert.equal(master.width, source.ownerSize.width);
      assert.equal(master.height, source.ownerSize.height);
      assert.equal(master.clipsContent, false);
      assert.equal(label.characters, source.characters);
      assert.equal(
        label.fontName.family,
        source.computed.fontFamily.split(",")[0].replaceAll('"', "").trim(),
      );
      assert.equal(label.fontName.style, "Regular");
      assert.equal(label.fontSize, parseFloat(source.computed.fontSize));
      assert.deepEqual(copy(label.lineHeight), { unit: "PIXELS", value: 24 });
      assert.equal(
        label.textDecoration,
        source.computed.textDecorationLine === "none" ? "NONE" : "UNDERLINE",
      );
      assert.equal(
        label.textStyleId,
        e.state.styles.find(
          (s) =>
            s.getSharedPluginData("orgundrrmangrove", "mgStyleId") ===
            v.tree.children[0].textStyle,
        ).id,
      );
      assert.equal(
        label.fills[0].boundVariables.color.id,
        variables.get(v.tree.children[0].fill).id,
      );
      assert.equal(label.layoutSizingHorizontal, "FILL");
      assert.equal(label.layoutSizingVertical, "HUG");
      for (const child of v.tree.children.slice(1)) {
        const n = master.findAll((n) => key(n) === k + "/" + child.id)[0];
        assert(n);
        assert.equal(n.width, value(child.layout.width));
        assert.equal(n.height, value(child.layout.height));
        assert.equal(n.x, value(child.absolute.offsetX));
        assert.equal(n.y, value(child.absolute.offsetY));
        if (child.id.startsWith("selected-border"))
          assert.equal(
            n.fills[0].boundVariables.color.id,
            variables.get(child.fill).id,
          );
      }
    }
    const before = snap(e);
    for (let i = 0; i < 2; i++) {
      const r = await build();
      assert.deepEqual(copy(r.errors), []);
      assert.deepEqual(copy(r.createdNodeIds), []);
      assert.deepEqual(snap(e), before);
    }
    const consumers = [...e.state.nodes.values()].filter(
      (n) => n.type === "INSTANCE",
    );
    assert.equal(consumers.length, 32);
    const edited = consumers.find((n) =>
      Object.keys(n.componentProperties).some((k) =>
        k.startsWith("english short Label#"),
      ),
    );
    assert(edited);
    const property = Object.keys(edited.componentProperties).find((k) =>
      k.startsWith("english short Label#"),
    );
    edited.setProperties({ [property]: "Owned caller copy" });
    const collection = e.state.collections[0];
    edited.setExplicitVariableModeForCollection(
      collection,
      collection.modes.find(
        (m) => m.name === doc.modes.find((m) => m.id === "mcr").name,
      ).modeId,
    );
    const mainId = (await edited.getMainComponentAsync()).id;
    const editedBefore = snap(e);
    for (let i = 0; i < 2; i++) {
      const r = await build();
      assert.deepEqual(copy(r.errors), []);
      assert.deepEqual(copy(r.createdNodeIds), []);
      assert.deepEqual(snap(e), editedBefore);
      assert.equal((await edited.getMainComponentAsync()).id, mainId);
      assert.equal(
        edited.componentProperties[property].value,
        "Owned caller copy",
      );
    }
    results.push({
      mode: mode.id,
      masters: 32,
      consumerInstances: 32,
      sourceOwnerFields: true,
      wholeCopyStylesBindings: true,
      fragmentFields: true,
      twoExactUnchangedZeroCreate: true,
      twoExactEditedPropertyZeroCreate: true,
      editableProperty:
        "Whole copy property retained; mock does not model visible inline glyph reflow",
      nativeAccepted: false,
    });
    console.log(
      "PASS",
      mode.id,
      "32 master source fields/32 linked review instances/two unchanged+two property-edited zero-create snapshots",
    );
  }
  fs.writeFileSync(
    __dirname + "/builder-verdict.json",
    JSON.stringify(
      {
        results,
        nativeGeometryModelAccepted: false,
        inlineBaselineAccepted: false,
        editedFragmentReflowAccepted: false,
      },
      null,
      2,
    ) + "\n",
  );
})().catch((e) => {
  console.error(e.stack);
  process.exitCode = 1;
});
