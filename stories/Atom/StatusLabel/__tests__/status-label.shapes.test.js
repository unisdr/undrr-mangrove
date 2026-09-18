/**
 * Status label — the indicator shapes, read off the compiled CSS.
 *
 * Each status carries a shape as well as a colour. jsdom never applies a
 * stylesheet and the component has no React render to test, so the compiled
 * output is the only place the shapes exist. What can go wrong is silent: a
 * clip path dropped in a refactor, two statuses ending up on the same shape,
 * a shape rule that paints the fill on the element instead of the ::before
 * (which would hide the ring), or the forced-colours block going missing so
 * the indicators disappear in Windows High Contrast.
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

// The four statuses whose shape needs a clip path, each with the polygon it
// must resolve to. A square and a circle are drawn with border-radius instead,
// because those keep the real border.
// -
// The polygons are named here, not just counted, because asserting only that a
// clip path exists lets two statuses swap shapes unnoticed — and the mapping is
// the whole point: a triangle means caution and an octagon means stop.
const SHAPES = {
  diamond: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
  triangle: 'polygon(50% 0%, 100% 100%, 0% 100%)',
  plus:
    'polygon(34% 0%, 66% 0%, 66% 34%, 100% 34%, 100% 66%, 66% 66%, ' +
    '66% 100%, 34% 100%, 34% 66%, 0% 66%, 0% 34%, 34% 34%)',
  octagon:
    'polygon(29.3% 0%, 70.7% 0%, 100% 29.3%, 100% 70.7%, 70.7% 100%, ' +
    '29.3% 100%, 0% 70.7%, 0% 29.3%)',
};

const CLIPPED = [
  ['waiting-validation', 'diamond'],
  ['waiting-information', 'plus'],
  ['warning', 'triangle'],
  ['negative', 'octagon'],
];

describe('status label indicator shapes', () => {
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
  });

  test('draft is a square', () => {
    const rule = ruleFor(indicator('draft'));

    expect(rule).toMatch(/border-radius:\s*0/);
    expect(rule).toMatch(
      /background-color:\s*var\(--mg-status-label-indicator--draft\)/
    );
  });

  test.each(CLIPPED)('%s is clipped to a %s', (modifier, shape) => {
    const rule = ruleFor(indicator(modifier));

    expect(rule).toMatch(/clip-path:\s*polygon\(/);
    expect(rule).toContain(`clip-path: ${SHAPES[shape]}`);
  });

  test.each(CLIPPED)(
    '%s paints the ring, and its fill sits on the ::before',
    modifier => {
      // The clip path cuts through a border, so the ring is the element's own
      // background showing around an inset ::before. Painting the fill on the
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

  test.each(CLIPPED)('the %s ::before is inset by the ring width', modifier => {
    const rule = ruleFor(`${indicator(modifier)}::before`);

    expect(rule).toMatch(
      /inset:\s*var\(--mg-status-label-indicator-border-width\)/
    );
    // Same path as the outer shape, so the ring follows the silhouette.
    expect(rule).toMatch(/clip-path:\s*polygon\(/);
  });

  test('no two statuses share a shape, apart from the two circles', () => {
    const shapes = CLIPPED.map(
      ([modifier]) => ruleFor(indicator(modifier)).match(/clip-path:[^;]+/)[0]
    );

    expect(new Set(shapes).size).toBe(shapes.length);
  });

  test('a scaled indicator still occupies one indicator size of inline space', () => {
    // The shapes have different bounding boxes. Without the compensating inline
    // margin a column of statuses loses its text alignment edge, which is the
    // dense-list case the second cue exists for.
    [...CLIPPED.map(([modifier]) => modifier), 'draft'].forEach(modifier => {
      expect(ruleFor(indicator(modifier))).toMatch(
        /margin-inline:\s*calc\(var\(--mg-status-label-indicator-size\)/
      );
    });
  });

  test('a shaped indicator scales with the size token', () => {
    // A consumer that sets --mg-status-label-indicator-size still gets a
    // consistent set: the optical correction is a multiplier, not a new value.
    CLIPPED.forEach(([modifier]) => {
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

    // Each shaped variant has to be named again here. The rule that puts its
    // fill on the ::before is as specific as a bare
    // .mg-status-label__indicator::before and comes earlier, so without its own
    // selector the fill keeps its author colour and the status stops being a
    // solid system-coloured mark. Dropping these four selectors is invisible to
    // every other assertion in this file.
    CLIPPED.forEach(([modifier]) => {
      expect(block).toContain(`${indicator(modifier)}::before`);
    });
  });

  test('print keeps the background-drawn shapes on the page', () => {
    // The clipped four have border: 0, so the ring and the fill are both
    // background-color — dropped when a browser prints without background
    // graphics, which is Chrome's default. Same failure icons.scss fixes.
    const block = (css.match(/@media\s*print\s*\{[\s\S]*?\n\}/g) || []).find(
      candidate => candidate.includes('.mg-status-label__indicator')
    );

    expect(block).toBeDefined();
    expect(block).toMatch(/print-color-adjust:\s*exact/);
    expect(block).toContain('.mg-status-label__indicator::before');
  });
});
