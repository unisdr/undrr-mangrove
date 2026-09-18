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

// The four statuses whose shape needs a clip path. A square and a circle are
// drawn with border-radius instead, because those keep the real border.
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

  test.each(CLIPPED)('%s is clipped to a %s', modifier => {
    expect(ruleFor(indicator(modifier))).toMatch(/clip-path:\s*polygon\(/);
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
  });
});
