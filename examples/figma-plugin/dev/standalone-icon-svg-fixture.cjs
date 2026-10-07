'use strict';
const assert = require('assert/strict');
function install(env) {
  const colour = s => {
    if (s === 'none') return [];
    s ??= '#000000';
    const m = /^#([a-f\d]{6}|[a-f\d]{3})$/i.exec(s);
    assert(m, 'Fixture paint ' + s);
    let h = m[1];
    if (h.length === 3) h = [...h].map(x => x + x).join('');
    return [
      {
        type: 'SOLID',
        visible: true,
        opacity: 1,
        color: {
          r: parseInt(h.slice(0, 2), 16) / 255,
          g: parseInt(h.slice(2, 4), 16) / 255,
          b: parseInt(h.slice(4, 6), 16) / 255,
        },
      },
    ];
  };
  env.state.importedIconMarkup = [];
  env.figma.createNodeFromSvg = markup => {
    env.state.importedIconMarkup.push(markup);
    const attrs = s =>
      Object.fromEntries(
        [...s.matchAll(/([\w:-]+)\s*=\s*(['"])([^]*?)\2/g)].map(m => [
          m[1],
          m[3],
        ])
      );
    const rootAttrs = attrs(/^<svg\b([^>]*?)>/.exec(markup)[1]),
      frame = env.figma.createFrame();
    frame.resize(+rootAttrs.width, +rootAttrs.height);
    frame.fills = [];
    const stack = [{ node: frame, ...rootAttrs }];
    for (const match of markup.matchAll(/<(\/?)(\w+)\b([^>]*?)(\/?)>/g)) {
      const [, close, tag, text, self] = match;
      if (tag === 'svg') continue;
      if (close) {
        stack.pop();
        continue;
      }
      const a = attrs(text),
        parent = stack.at(-1),
        data = { ...parent, ...a };
      if (tag === 'g') {
        const group = env.figma.createFrame();
        group.fills = [];
        group.resize(frame.width, frame.height);
        group.sourceTransform = a.transform || null;
        parent.node.appendChild(group);
        stack.push({ ...data, node: group });
        if (self) stack.pop();
        continue;
      }
      assert(
        [
          'path',
          'rect',
          'circle',
          'ellipse',
          'line',
          'polygon',
          'polyline',
        ].includes(tag)
      );
      const n = env.figma.createVector();
      n.resize(frame.width, frame.height);
      n.vectorPaths = [
        {
          windingRule: data['fill-rule'] === 'evenodd' ? 'EVENODD' : 'NONZERO',
          data: match[0],
        },
      ];
      n.fills = colour(data.fill);
      n.strokes = colour(data.stroke ?? 'none');
      n.strokeWeight = +(data['stroke-width'] ?? 1);
      n.strokeAlign = 'CENTER';
      n.opacity = +(data.opacity ?? 1);
      n.constraints = { horizontal: 'MIN', vertical: 'MIN' };
      parent.node.appendChild(n);
    }
    frame.rescale = function (scale) {
      function resize(n) {
        n.resizeWithoutConstraints(n.width * scale, n.height * scale);
        if (n.type === 'VECTOR') n.strokeWeight *= scale;
        for (const c of n.children || []) resize(c);
      }
      resize(this);
    };
    return frame;
  };
}
module.exports = { install };
