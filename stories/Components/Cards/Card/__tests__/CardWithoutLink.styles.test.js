const sass = require('sass');
const path = require('path');

// The Gutenberg repair lives entirely in CSS. Content already published with
// `<a href="">` cannot be re-rendered, so the stylesheet has to neutralise the
// link affordances itself — and it has to do so in the Gutenberg bundle, which
// is the one Drupal loads in the editor and on the rendered page. jsdom never
// applies a stylesheet, so the component tests cannot see any of this; guard
// the compiled output instead.
const compiled = {};

/** Compiled once per entry point: sass compilation is the slow part. */
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
  'unlinked card title affordances in %s',
  entry => {
    test('strips the interactive colour, cursor and underline', () => {
      const rule = ruleFor(entry, '.mg-card__title a[href=""]');

      expect(rule).toMatch(/color:\s*rgb\(var\(--mg-color-text\)\)/);
      expect(rule).toMatch(/cursor:\s*default/);
      expect(rule).toMatch(/text-decoration:\s*none/);
    });

    test('drops the stretched overlay that swallows clicks aimed at the button', () => {
      const rule = ruleFor(entry, '.mg-card__title a[href=""]::before');

      expect(rule).toMatch(/content:\s*none/);
    });

    test('drops the chevron, because there is nowhere to go', () => {
      const rule = ruleFor(entry, '.mg-card__title a[href=""]::after');

      expect(rule).toMatch(/content:\s*none/);
    });

    test('leaves an unlinked label as metadata rather than a control', () => {
      const rule = ruleFor(entry, 'span.mg-card__label');

      expect(rule).toMatch(/cursor:\s*auto/);
    });
  }
);
