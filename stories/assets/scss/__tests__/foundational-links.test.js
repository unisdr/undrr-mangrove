const sass = require('sass');
const path = require('path');

// jsdom does not load the compiled Sass bundle, so inspect each themed entry
// point. A foundation-level rule is the only way to protect prose links that
// are not owned by a component (WCAG 1.4.1 Use of Colour).
const compiled = {};
const entries = [
  'style.scss',
  'style-delta.scss',
  'style-irp.scss',
  'style-mcr.scss',
  'style-preventionweb.scss',
];

const css = entry => {
  if (compiled[entry] === undefined) {
    compiled[entry] = sass.compile(path.resolve(__dirname, '..', entry), {
      loadPaths: [path.resolve(__dirname, '..')],
      logger: sass.Logger.silent,
    }).css;
  }
  return compiled[entry];
};

const ruleFor = (entry, selector) => {
  const match = css(entry).match(
    new RegExp(
      `(?:^|})\\s*${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`
    )
  );
  return match ? match[1] : '';
};

describe.each(entries)('foundational prose links in %s', entry => {
  test('remain underlined before hover or focus', () => {
    expect(ruleFor(entry, '.mg-content p a')).toMatch(
      /text-decoration:\s*underline/
    );
  });

  test('do not impose an underline on navigation or button links', () => {
    expect(ruleFor(entry, 'a')).toMatch(/text-decoration:\s*none/);
  });
});
