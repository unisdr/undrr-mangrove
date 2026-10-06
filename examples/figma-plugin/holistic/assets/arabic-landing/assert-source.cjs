"use strict";
const fs = require("fs"),
  assert = require("assert/strict"),
  { walk, identity } = require("../../../dev/mock-arabic-landing.cjs"),
  copy = (x) => JSON.parse(JSON.stringify(x));
function master(n) {
  for (let p = n.parent; p; p = p.parent)
    if (p.type === "INSTANCE") return false;
  return true;
}
async function assertSource(d, env, mode) {
  let frames = 0,
    texts = 0,
    instances = 0,
    rich = 0;
  const role = (name) => {
      const v = d.variables.find((v) => v.name === name);
      assert(v, name);
      return v.values[mode];
    },
    nativeStyle = (id) => {
      const st = env.state.styles.find(
        (st) => st.getSharedPluginData("orgundrrmangrove", "mgStyleId") === id,
      );
      assert(st, "exact owned style " + id);
      return st;
    },
    nativeVariable = (name) => env.state.variables.find((v) => v.name === name),
    actual = (f, v, s) =>
      [...env.state.nodes.values()].find(
        (n) =>
          master(n) &&
          (s === v.tree
            ? identity(n) === "family/" + f.id + "/variant/" + v.id
            : identity(n).includes("/variant/" + v.id + "/") &&
              identity(n).endsWith("/" + s.id)),
      );
  for (const f of d.components.families)
    for (const v of f.variants) {
      const c = JSON.parse(
        require("zlib").gunzipSync(
          fs.readFileSync(
            __dirname +
              "/source-derived/" +
              (mode === "mcr" ? "mcr2030" : mode) +
              "-" +
              v.sourceContext.archetype +
              "-" +
              v.sourceContext.viewport +
              ".json.gz",
          ),
        ),
      );
      for (const s of walk(v.tree)) {
        const n = actual(f, v, s);
        assert(n, f.id + "/" + v.id + "/" + s.id);
        if (s.type === "FRAME") {
          frames++;
          assert.equal(
            n.width,
            typeof s.layout.width === "number"
              ? s.layout.width
              : role(s.layout.width),
          );
          assert.equal(
            n.height,
            typeof s.layout.height === "number"
              ? s.layout.height
              : role(s.layout.height),
          );
          assert.equal(n.clipsContent, !!s.layout.clipsContent);
        }
        if (s.absolute) {
          assert.equal(n.x, role(s.absolute.offsetX));
          assert.equal(n.y, role(s.absolute.offsetY));
        }
        if (s.sourceLandingNode) {
          const own = c.nodes.find((k) => k.id === s.sourceLandingNode.id);
          assert(own);
          assert.equal(n.width, own.rect.width);
          assert.equal(n.height, own.rect.height);
          assert.equal(n.opacity, +own.style.opacity);
          if (s.fill)
            assert.deepEqual(role(s.fill), rgba(own.style.backgroundColor));
        }
        for (const [field, native] of [
          ["fill", "fills"],
          ["stroke", "strokes"],
        ])
          if (s[field]) {
            const p = n[native].find((p) => p.type === "SOLID"),
              expected = role(s[field]);
            assert(p, s.id + "/" + field);
            assert.deepEqual(copy(p.color), {
              r: expected.r,
              g: expected.g,
              b: expected.b,
            });
            assert.equal(p.opacity, expected.a);
            assert.equal(
              p.boundVariables.color.id,
              nativeVariable(s[field]).id,
            );
          }
        for (const field of [
          "topLeftRadius",
          "topRightRadius",
          "bottomLeftRadius",
          "bottomRightRadius",
          "strokeTopWeight",
          "strokeRightWeight",
          "strokeBottomWeight",
          "strokeLeftWeight",
        ])
          if (s.bindings?.[field])
            assert.equal(n[field], role(s.bindings[field]), s.id + "/" + field);
        if (s.effectStyle) {
          const st = nativeStyle(s.effectStyle);
          assert.equal(n.effectStyleId, st.id);
          const expected = d.styles.effect.find((e) => e.id === s.effectStyle)
            .values[mode];
          assert.equal(n.effects.length, expected.length);
          expected.forEach((e, i) => {
            for (const field of [
              "type",
              "radius",
              "spread",
              "visible",
              "blendMode",
            ])
              assert.equal(n.effects[i][field], e.effect[field]);
            assert.deepEqual(copy(n.effects[i].offset), e.effect.offset);
            assert.deepEqual(copy(n.effects[i].color), e.effect.color);
          });
        }
        if (s.type === "TEXT") {
          texts++;
          assert.equal(n.characters, s.characters);
          assert.equal(n.layoutSizingHorizontal, "FILL");
          assert(n.width > 0);
          if (s.textProperty) assert(n.componentPropertyReferences.characters);
          const st =
            s.textStyle && d.styles.text.find((st) => st.id === s.textStyle);
          if (st) {
            assert.equal(n.textStyleId, nativeStyle(st.id).id);
            assert.equal(
              n.textDecoration,
              s.textDecoration ?? st.values[mode].textDecoration ?? "NONE",
            );
            assert.equal(n.fontName.family, st.values[mode].fontName.family);
            assert.equal(n.fontName.style, st.values[mode].fontName.style);
            assert.equal(n.fontSize, st.values[mode].fontSize);
            assert.deepEqual(copy(n.lineHeight), st.values[mode].lineHeight);
          }
          if (s.textRuns) {
            rich++;
            const ranges = n.getStyledTextSegments([
              "hyperlink",
              "textDecoration",
              "textDecorationOffset",
              "textStyleId",
              "fills",
            ]);
            for (const run of s.textRuns) {
              const covered = ranges.filter(
                (r) => r.start < run.end && r.end > run.start,
              );
              assert(covered.length);
              const expectedStyle = nativeStyle(run.textStyle);
              assert(covered.every((r) => r.textStyleId === expectedStyle.id));
              const expectedPaint = role(run.fill);
              for (const segment of covered) {
                const p = segment.fills.find((p) => p.type === "SOLID");
                assert(p);
                assert.deepEqual(copy(p.color), {
                  r: expectedPaint.r,
                  g: expectedPaint.g,
                  b: expectedPaint.b,
                });
                assert.equal(p.opacity, expectedPaint.a);
                assert.equal(
                  p.boundVariables.color.id,
                  nativeVariable(run.fill).id,
                );
              }
              assert(
                covered.every((r) => r.textDecoration === run.textDecoration),
              );
              if (run.hyperlink)
                assert(
                  covered.every(
                    (r) => r.hyperlink?.value === run.hyperlink.value,
                  ),
                );
              if (run.textDecorationOffset)
                assert(
                  covered.every(
                    (r) =>
                      r.textDecorationOffset?.value ===
                      Math.fround(run.textDecorationOffset.value),
                  ),
                );
            }
            assert.equal(s.textRuns.at(-1).end, s.characters.length);
          }
        }
        if (s.type === "INSTANCE") {
          instances++;
          assert.equal(
            identity(await n.getMainComponentAsync()).split("/")[1],
            s.family,
          );
        }
      }
    }
  assert(frames > 100 && texts > 100 && instances > 40 && rich > 10);
  return { frames, texts, instances, rich };
}
function rgba(s) {
  const m = /^rgba?\(([^)]+)\)$/.exec(s)[1].split(",").map(Number);
  return { r: m[0] / 255, g: m[1] / 255, b: m[2] / 255, a: m[3] ?? 1 };
}
module.exports = { assertSource, master };
