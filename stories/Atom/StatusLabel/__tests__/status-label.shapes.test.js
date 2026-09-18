/**
 * Status label — the indicator marks, read off the compiled CSS.
 *
 * Each status carries a shape as well as a colour. jsdom never applies a
 * stylesheet and the component has no React render to test, so the compiled
 * output is the only place the marks exist. What can go wrong is silent: a
 * shape dropped in a refactor, two statuses ending up on the same mark, a rule
 * that paints a clipped shape's fill on the element instead of the ::before
 * (which would swallow the ring), an inner polygon that no longer offsets its
 * edges by the ring width (unisdr/undrr-mangrove#1208), or the forced-colours
 * or print block going missing so the indicators disappear in Windows High
 * Contrast or on paper.
 *
 * The inner polygons are not pinned as strings. They are recomputed here from
 * the outer polygon with the miter formula, independently of the Sass, so a
 * wrong coefficient fails rather than being enshrined.
 *
 * Follows the compiled-CSS pattern in
 * stories/Components/Cards/Card/__tests__/CardWithoutLink.styles.test.js.
 */
const path = require('path');
const sass = require('sass');

const SCSS_DIR = path.resolve(__dirname, '../../../assets/scss');

let css;

beforeAll(() => {
  css = sass.compile(path.join(SCSS_DIR, 'style.scss'), {
    loadPaths: [SCSS_DIR],
    silenceDeprecations: ['import'],
    logger: sass.Logger.silent,
  }).css;
});

/**
 * Every declaration under this exact selector, joined.
 *
 * A shaped indicator is written by a mixin and then given its fill, so its
 * declarations are spread over more than one rule in the output.
 */
const ruleFor = selector => {
  const matches = css.matchAll(
    new RegExp(
      `(?:^|[}\\n])\\s*${selector.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
      )}\\s*\\{([^}]*)\\}`,
      'g'
    )
  );
  return [...matches].map(match => match[1]).join('\n');
};

const indicator = modifier =>
  modifier
    ? `.mg-status-label--${modifier} .mg-status-label__indicator`
    : '.mg-status-label__indicator';

// Five of the seven marks are a rounded rectangle, so they keep a real CSS
// border and their ring is uniform by construction. Only these two need a clip
// path, and each is named rather than merely counted: asserting that a clip
// path exists lets two statuses swap marks unnoticed, and the mapping is the
// point — a triangle means caution and an octagon means stop.
const CLIPPED = {
  warning: {
    name: 'triangle',
    points: [
      [44.63344, 10.73313],
      [55.36656, 10.73313],
      [95.65836, 91.31672],
      [90.2918, 100],
      [9.7082, 100],
      [4.34164, 91.31672],
    ],
  },
  negative: {
    name: 'octagon',
    points: [
      [25, 0],
      [75, 0],
      [100, 25],
      [100, 75],
      [75, 100],
      [25, 100],
      [0, 75],
      [0, 25],
    ],
  },
};

/** The clip-path value declared on this exact selector. */
const clipPathOf = selector => {
  const match = ruleFor(selector).match(/clip-path:\s*([^;]+);/);
  return match ? match[1].replace(/\s+/g, ' ').trim() : null;
};

/** [[x, y], ...] read out of a plain percentage polygon. */
const parsePolygon = value => {
  const points = [...value.matchAll(/(-?[\d.]+)%\s+(-?[\d.]+)%/g)].map(
    ([, x, y]) => [Number(x), Number(y)]
  );
  return points;
};

/**
 * [[x, xCoefficient, y, yCoefficient], ...] read out of a polygon whose
 * coordinates are `calc(<percentage> ± <number> * var(--…-ring))`.
 */
const parseOffsetPolygon = value => {
  const term = String.raw`calc\((-?[\d.]+)% ([+-]) ([\d.]+) \* var\(--mg-status-label-indicator-ring\)\)`;
  return [...value.matchAll(new RegExp(`${term} ${term}`, 'g'))].map(m => [
    Number(m[1]),
    Number(m[3]) * (m[2] === '-' ? -1 : 1),
    Number(m[4]),
    Number(m[6]) * (m[5] === '-' ? -1 : 1),
  ]);
};

/**
 * The inward unit normal of each edge, derived from the winding rather than
 * assumed, so a polygon written the other way round still measures correctly.
 */
const edgeNormals = points => {
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
  const cy = points.reduce((s, p) => s + p[1], 0) / points.length;
  return points.map((p, i) => {
    const q = points[(i + 1) % points.length];
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    const len = Math.hypot(dx, dy);
    let n = [dy / len, -dx / len];
    const mx = (p[0] + q[0]) / 2;
    const my = (p[1] + q[1]) / 2;
    if (n[0] * (cx - mx) + n[1] * (cy - my) < 0) n = [-n[0], -n[1]];
    return n;
  });
};

/**
 * The miter offset at each vertex: the vector that moves it inward so that
 * both of its edges move in by exactly one ring width.
 */
const miterOffsets = points => {
  const normals = edgeNormals(points);
  return points.map((p, i) => {
    const before = normals[(i - 1 + points.length) % points.length];
    const after = normals[i];
    const k = 1 / (1 + (before[0] * after[0] + before[1] * after[1]));
    return [(before[0] + after[0]) * k, (before[1] + after[1]) * k];
  });
};

describe('status label indicator marks', () => {
  test('the base indicator is still a circle from the radius token', () => {
    expect(ruleFor(indicator())).toMatch(
      /border-radius:\s*var\(--mg-status-label-indicator-radius\)/
    );
  });

  test('published keeps the base circle, so only its colour is declared', () => {
    const rule = ruleFor(indicator('published'));

    expect(rule).toMatch(
      /background-color:\s*var\(--mg-status-label-indicator--published\)/
    );
    expect(rule).not.toMatch(/clip-path/);
    expect(rule).not.toMatch(/transform/);
  });

  test('draft is a rounded square', () => {
    const rule = ruleFor(indicator('draft'));

    expect(rule).toMatch(
      /border-radius:\s*calc\(var\(--mg-status-label-indicator-size\) \* 0\.13\)/
    );
    expect(rule).not.toMatch(/transform/);
    expect(rule).toMatch(
      /background-color:\s*var\(--mg-status-label-indicator--draft\)/
    );
  });

  test('waiting for more information is a capsule, wider than it is tall', () => {
    const rule = ruleFor(indicator('waiting-information'));
    const inline = rule.match(
      /inline-size:\s*calc\(var\(--mg-status-label-indicator-size\) \* ([\d.]+)\)/
    );
    const block = rule.match(
      /block-size:\s*calc\(var\(--mg-status-label-indicator-size\) \* ([\d.]+)\)/
    );

    expect(inline).not.toBeNull();
    expect(block).not.toBeNull();
    expect(Number(inline[1])).toBeGreaterThan(Number(block[1]) * 1.4);
    // A radius at least half the block size, so the ends are true half-circles
    // at every indicator size rather than merely rounded corners.
    expect(rule).toMatch(
      /border-radius:\s*var\(--mg-status-label-indicator-size\)/
    );
  });

  test('waiting for validation is the draft square turned on its point', () => {
    const rule = ruleFor(indicator('waiting-validation'));

    expect(rule).toMatch(/transform:\s*rotate\(45deg\)/);
    // The same corner treatment as draft: the relationship between the two
    // marks is the reason this status is a rotation and not its own polygon.
    expect(rule).toMatch(
      /border-radius:\s*calc\(var\(--mg-status-label-indicator-size\) \* 0\.13\)/
    );
    expect(rule).not.toMatch(/clip-path/);
  });

  test.each(Object.entries(CLIPPED))(
    '%s is clipped to the expected polygon',
    (modifier, shape) => {
      const drawn = parsePolygon(clipPathOf(indicator(modifier)));

      expect(drawn).toHaveLength(shape.points.length);
      drawn.forEach(([x, y], i) => {
        expect(x).toBeCloseTo(shape.points[i][0], 4);
        expect(y).toBeCloseTo(shape.points[i][1], 4);
      });
    }
  );

  test.each(Object.entries(CLIPPED))(
    '%s paints the ring, and its fill sits on the ::before',
    modifier => {
      // The clip path cuts through a border, so the ring is the element's own
      // background showing around the ::before. Painting the fill on the
      // element instead would swallow the ring.
      expect(ruleFor(indicator(modifier))).toMatch(
        /background-color:\s*var\(--mg-status-label-indicator-border-color\)/
      );
      expect(ruleFor(`${indicator(modifier)}::before`)).toMatch(
        new RegExp(
          `background-color:\\s*var\\(--mg-status-label-indicator--${modifier}\\)`
        )
      );
    }
  );

  test.each(Object.entries(CLIPPED))(
    'the %s ring is one uniform width on every edge',
    (modifier, shape) => {
      // unisdr/undrr-mangrove#1208. Insetting the ::before box and reusing the
      // outer polygon scales the shape instead of offsetting its edges, which
      // gave a different ring width on every edge. The inner polygon must move
      // each vertex along its own angle bisector by the miter offset, which is
      // recomputed here from the outer polygon rather than copied from the
      // stylesheet.
      const selector = `${indicator(modifier)}::before`;
      const expected = miterOffsets(shape.points);
      const drawn = parseOffsetPolygon(clipPathOf(selector));

      expect(ruleFor(selector)).toMatch(/inset:\s*0/);
      expect(drawn).toHaveLength(shape.points.length);
      drawn.forEach(([x, xCoefficient, y, yCoefficient], i) => {
        expect(x).toBeCloseTo(shape.points[i][0], 4);
        expect(y).toBeCloseTo(shape.points[i][1], 4);
        expect(xCoefficient).toBeCloseTo(expected[i][0], 4);
        expect(yCoefficient).toBeCloseTo(expected[i][1], 4);
      });
    }
  );

  test('the ring width is read through a registered <length> property', () => {
    // --mg-status-label-indicator-border-width: 0 is documented, and a bare 0
    // is a <number> in calc: without the registration every inner polygon
    // would be invalid and both clipped marks would lose their fill entirely.
    const block = css.match(
      /@property\s+--mg-status-label-indicator-ring\s*\{[^}]*\}/
    );

    expect(block).not.toBeNull();
    expect(block[0]).toMatch(/syntax:\s*"<length>"/);
    expect(block[0]).toMatch(/initial-value:/);
    expect(ruleFor(indicator()).replace(/\s+/g, ' ')).toContain(
      '--mg-status-label-indicator-ring: var( --mg-status-label-indicator-border-width )'
    );
  });

  test('no two statuses share a mark', () => {
    // Silhouette, not colour: two statuses drawn the same way is the failure
    // the shapes exist to prevent, and it is invisible to every other test.
    const PROPERTIES = [
      'clip-path',
      'border-radius',
      'transform',
      'inline-size',
      'block-size',
    ];
    const declared = modifier => {
      const rule = ruleFor(indicator(modifier));
      return PROPERTIES.map(
        property => (rule.match(new RegExp(`${property}:[^;]+`)) || [null])[0]
      );
    };
    // A modifier that declares nothing for a property inherits the base rule,
    // so compare the effective geometry rather than what each rule happens to
    // spell out.
    const base = declared('');
    const geometry = [
      '',
      'draft',
      'waiting-information',
      'waiting-validation',
      'published',
      'warning',
      'negative',
    ].map(modifier =>
      declared(modifier)
        .map((value, i) => value || base[i] || '')
        .join('|')
        .replace(/\s+/g, ' ')
    );

    // Published and the base are deliberately the same circle; every other
    // pair has to differ.
    expect(new Set(geometry).size).toBe(geometry.length - 1);
    expect(geometry[0]).toBe(geometry[4]);
  });

  test('every indicator occupies one indicator size of inline space', () => {
    // The marks have different bounding boxes. Without the compensating inline
    // margin a column of statuses loses its text alignment edge, which is the
    // dense-list case the second cue exists for.
    [
      'draft',
      'waiting-information',
      'waiting-validation',
      ...Object.keys(CLIPPED),
    ].forEach(modifier => {
      const rule = ruleFor(indicator(modifier));
      const inline = Number(
        rule.match(
          /inline-size:\s*calc\(var\(--mg-status-label-indicator-size\) \* ([\d.]+)\)/
        )[1]
      );
      const margin = Number(
        rule.match(
          /margin-inline:\s*calc\(var\(--mg-status-label-indicator-size\) \* (-?[\d.]+)\)/
        )[1]
      );

      expect(inline + 2 * margin).toBeCloseTo(1, 5);
    });
  });

  test('every mark scales with the size token', () => {
    // A consumer that sets --mg-status-label-indicator-size still gets a
    // consistent set: the optical correction is a multiplier, not a new value.
    [
      'draft',
      'waiting-information',
      'waiting-validation',
      ...Object.keys(CLIPPED),
    ].forEach(modifier => {
      expect(ruleFor(indicator(modifier))).toMatch(
        /inline-size:\s*calc\(var\(--mg-status-label-indicator-size\)/
      );
    });
  });

  test('forced colours repaint the indicators in system colours', () => {
    // Several components have a forced-colours block; take the one that
    // mentions the status label.
    const block = (
      css.match(/@media\s*\(forced-colors:\s*active\)\s*\{[\s\S]*?\n\}/g) || []
    ).find(candidate => candidate.includes('.mg-status-label__indicator'));

    expect(block).toBeDefined();
    expect(block).toMatch(/forced-color-adjust:\s*none/);
    expect(block).toMatch(/background-color:\s*CanvasText/);
    // The base indicator stays hollow, so it does not become the same solid
    // mark as published once both are painted in one system colour.
    expect(block).toMatch(/background-color:\s*Canvas\b/);

    // Every named status has to be listed, or it keeps its author fill and
    // stops being a solid system-coloured mark.
    [
      'draft',
      'waiting-information',
      'waiting-validation',
      'published',
      ...Object.keys(CLIPPED),
    ].forEach(modifier => {
      expect(block).toContain(indicator(modifier));
    });

    // Each clipped variant also has to name its own ::before. The rule that
    // puts its fill there is as specific as a bare
    // .mg-status-label__indicator::before and comes earlier, so without its own
    // selector the fill keeps its author colour.
    Object.keys(CLIPPED).forEach(modifier => {
      expect(block).toContain(`${indicator(modifier)}::before`);
    });
  });

  test('print keeps the background-drawn marks on the page', () => {
    // The clipped two have border: 0, so their ring and their fill are both
    // background-color — dropped when a browser prints without background
    // graphics, which is Chrome's default. Same failure icons.scss fixes.
    const block = (css.match(/@media\s*print\s*\{[\s\S]*?\n\}/g) || []).find(
      candidate => candidate.includes('.mg-status-label__indicator')
    );

    expect(block).toBeDefined();
    expect(block).toMatch(/print-color-adjust:\s*exact/);
    expect(block).toContain('.mg-status-label__indicator::before');
  });

  test('the group keeps its list semantics without a bullet', () => {
    // unisdr/undrr-mangrove#1209. Safari drops the implicit list role from a
    // <ul> whose list-style is none, so the item count StatusLabel.mdx promises
    // is not announced. An empty string marker is not `none`, renders nothing
    // and reserves no space.
    const rule = ruleFor('.mg-status-label-group');

    expect(rule).toMatch(/list-style-type:\s*""/);
    // Order matters: the shorthand would reset it back to none.
    expect(rule.indexOf('list-style-type')).toBeGreaterThan(
      rule.indexOf('list-style:')
    );
  });
});
