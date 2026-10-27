const sass = require('sass');
const path = require('path');

// A link inside a card summary sits in running text. The interactive blue is
// only 2.09:1 against the body colour, so colour alone cannot distinguish it
// (WCAG 1.4.1 Use of Colour) and the underline has to be there at rest, not
// only on hover. jsdom applies no stylesheet, so assert on the compiled CSS.
const compiled = {};

const css = entry => {
  if (compiled[entry] === undefined) {
    compiled[entry] = sass.compile(
      path.resolve(__dirname, '../../../../assets/scss', entry),
      {
        loadPaths: [path.resolve(__dirname, '../../../../assets/scss')],
        logger: sass.Logger.silent,
      }
    ).css;
  }
  return compiled[entry];
};

const ruleFor = (entry, selector) => {
  const match = css(entry).match(
    new RegExp(
      `${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`
    )
  );
  return match ? match[1] : '';
};

describe.each(['style.scss', 'style-gutenberg.scss'])(
  'card in-text links in %s',
  entry => {
    test('underlines summary links at rest, not only on hover', () => {
      const rule = ruleFor(entry, '.mg-card__text-link:not(.mg-button)');
      expect(rule).toMatch(/text-decoration:\s*underline/);
    });

    test('leaves button-styled links alone, on both selectors', () => {
      // An anchor can carry .mg-card__text-link and .mg-button at once. Both
      // halves of the rule need the guard, or it gets the in-text underline
      // on top of its button treatment.
      expect(css(entry)).toContain('.mg-card__summary a:not(.mg-button)');
      expect(css(entry)).toContain('.mg-card__text-link:not(.mg-button)');
      expect(css(entry)).not.toMatch(
        /\.mg-card__text-link\s*\{[^}]*text-decoration:\s*underline/
      );
      expect(css(entry)).not.toMatch(/\.mg-card__text-link:hover\s*\{/);
    });

    test('leaves the plain-title and unlinked-title opt-outs intact', () => {
      // These deliberately remove the underline; the summary rule must not
      // start re-adding it to card titles.
      expect(
        ruleFor(entry, '.mg-card.mg-card--plain-title .mg-card__title a')
      ).toMatch(/text-decoration:\s*none/);
      expect(ruleFor(entry, '.mg-card__title a[href=""]')).toMatch(
        /text-decoration:\s*none/
      );
    });
  }
);
