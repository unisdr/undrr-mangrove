"use strict";
const assert = require("assert/strict"),
  { walk, identity } = require("../../../dev/mock-arabic-landing.cjs"),
  copy = (x) => JSON.parse(JSON.stringify(x));
function owning(n) {
  for (let p = n.parent; p; p = p.parent)
    if (p.type === "INSTANCE") return false;
  return true;
}
function consumerEdits(d, env) {
  const f = d.components.families.find(
      (f) => f.id === "arabic-landing-topic-related-card",
    ),
    v = f.variants.find(
      (v) =>
        v.properties.Preset === "Related1" &&
        v.properties.SourceViewport === "390",
    ),
    nodes = [...env.state.nodes.values()],
    main = nodes.find(
      (n) => identity(n) === "family/" + f.id + "/variant/" + v.id,
    ),
    native = (s) =>
      nodes.find(
        (n) =>
          owning(n) &&
          identity(n).includes("/variant/" + v.id + "/") &&
          identity(n).endsWith("/" + s.id),
      ),
    plainSpec = walk(v.tree).find((s) => s.textProperty),
    richSpec = walk(v.tree).find((s) => s.textRuns);
  assert(main && plainSpec && richSpec);
  const consumer = main.createInstance();
  env.figma.currentPage.appendChild(consumer);
  const reference = native(plainSpec).componentPropertyReferences.characters;
  consumer.setProperties({ [reference]: "ملخص عربي محفوظ" });
  const linked = consumer.findAll(
    (n) =>
      n.type === "TEXT" &&
      n.componentPropertyReferences?.characters === reference,
  )[0];
  assert(linked);
  let p = linked,
    descriptor;
  while (p && !descriptor) {
    descriptor = Object.getOwnPropertyDescriptor(p, "characters");
    p = Object.getPrototypeOf(p);
  }
  assert(descriptor?.set);
  Object.defineProperty(linked, "characters", {
    configurable: true,
    get() {
      return consumer.componentProperties[reference].value;
    },
    set(x) {
      descriptor.set.call(this, x);
    },
  });
  const sourceRich = native(richSpec),
    clone = consumer.findAll(
      (n) => n.type === "TEXT" && identity(n) === identity(sourceRich),
    )[0];
  assert(clone);
  const rich = env.attachRichText(clone, sourceRich);
  rich.editRich(0, rich.characters.length, "عنوان عربي محفوظ");
  const fields = [
      "hyperlink",
      "textDecoration",
      "textDecorationOffset",
      "fills",
      "textStyleId",
    ],
    before = copy({
      characters: rich.characters,
      ranges: rich.getStyledTextSegments(fields),
    });
  return async () => {
    assert.equal(linked.characters, "ملخص عربي محفوظ");
    assert.deepEqual(
      copy({
        characters: rich.characters,
        ranges: rich.getStyledTextSegments(fields),
      }),
      before,
    );
    assert.equal((await consumer.getMainComponentAsync()).id, main.id);
  };
}
module.exports = { consumerEdits };
