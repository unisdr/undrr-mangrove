const sass = require('sass');
const path = require('path');

// jsdom never loads the compiled stylesheet, so rules that only CSS can
// enforce are checked in the compiled bundle: they protect markup that Drupal
// or a hand-written page emits without React.
const css = sass
  .compile(path.resolve(__dirname, '..', 'style.scss'), {
    loadPaths: [path.resolve(__dirname, '..')],
    silenceDeprecations: ['import'],
    logger: sass.Logger.silent,
  })
  .css.replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/,\s+/g, ', ');

// The declarations of the first rule whose selector list is exactly this.
const ruleFor = selector => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(
    new RegExp(`(?:^|[}\\s])${escaped}\\s*\\{([^}]*)\\}`)
  );
  return match ? match[1] : '';
};

describe('neutral hero', () => {
  test('sizes away an inline background image in the background layout', () => {
    const rule = ruleFor('.mg-hero.mg-hero--neutral:not(.mg-hero--split)');
    expect(rule).toMatch(/background-size:\s*0 0/);
    expect(rule).toMatch(/--mg-hero-banner-block-size:\s*0px/);
    expect(
      ruleFor('.mg-hero.mg-hero--neutral:not(.mg-hero--split)::after')
    ).toMatch(/content:\s*none/);
  });

  test('underlines links in the eyebrow, facts line and summary', () => {
    expect(
      ruleFor(
        '.mg-hero.mg-hero--neutral .mg-hero__label a, .mg-hero.mg-hero--neutral .mg-hero__summaryText a'
      )
    ).toMatch(/text-decoration:\s*underline/);
  });
});

describe('hero tags', () => {
  test('are outline tags in the hero ink on every variant', () => {
    const rule = ruleFor('.mg-hero__tags .mg-tag:not([class*=mg-tag--])');
    expect(rule).toMatch(/background-color:\s*transparent/);
    expect(rule).toMatch(/color:\s*rgb\(var\(--mg-hero-tag-color\)\)/);
    expect(css).toMatch(
      /\.mg-hero\s*\{\s*--mg-hero-tag-color:\s*var\(--mg-color-neutral-0\)/
    );
  });
});

describe('on this page nav', () => {
  test('pads page scrolling below the docked bar, giving way to the site', () => {
    const rule = ruleFor(
      ':where(html:has(.mg-on-this-page-nav:not(.mg-on-this-page-nav--hidden)))'
    );
    expect(rule).toMatch(
      /scroll-padding-top:\s*var\(--mg-on-this-page-nav-scroll-padding\)/
    );
    expect(rule).toMatch(
      /var\(--mg-on-this-page-nav-scroll-padding-base, 0px\)/
    );
  });

  // A fade belongs only on a side with links hidden behind it. Each RTL rule
  // has to outrank the direction-neutral has-left-overflow rule.
  test.each([
    [
      'nothing hidden or left only',
      '[dir=rtl] .mg-on-this-page-nav__list, [dir=rtl] .mg-on-this-page-nav--has-left-overflow .mg-on-this-page-nav__list',
      /mask-image:\s*linear-gradient\(to left, #000 calc/,
    ],
    [
      'right only',
      '[dir=rtl] .mg-on-this-page-nav--has-right-overflow .mg-on-this-page-nav__list',
      /mask-image:\s*linear-gradient\(to right, #000 calc/,
    ],
    [
      'both sides',
      '[dir=rtl] .mg-on-this-page-nav--has-left-overflow.mg-on-this-page-nav--has-right-overflow .mg-on-this-page-nav__list',
      /mask-image:\s*linear-gradient\(to right, transparent, #000 var/,
    ],
  ])('RTL fade: %s', (_name, selector, gradient) => {
    expect(ruleFor(selector)).toMatch(gradient);
  });
});

// In RTL the prose list indent used to outrank component list resets, so
// unmarked component lists sat 9-22px inside their content edge.
describe('RTL list indentation', () => {
  test('carries the specificity of the LTR list rules it mirrors', () => {
    expect(css).not.toMatch(/(^|[}\s])\[dir=rtl\] ul/);
    expect(ruleFor(':where([dir=rtl]) ul, :where([dir=rtl]) ol')).toMatch(
      /padding-right:/
    );
  });

  test('indents items through a hook that unmarked lists set to 0', () => {
    expect(ruleFor(':where([dir=rtl]) ul li, :where([dir=rtl]) ol li')).toMatch(
      /padding-right:\s*var\(--mg-list-item-indent-rtl\)/
    );
    for (const list of [
      '.mg-on-this-page-nav__list',
      '.mg-hero__tags',
      '.mg-pager__list',
    ]) {
      const declarations = [
        ...css.matchAll(
          new RegExp(
            `(?:^|})\\s*${list.replace('.', '\\.')}\\s*\\{([^}]*)\\}`,
            'g'
          )
        ),
      ]
        .map(match => match[1])
        .join('');
      expect(declarations).toMatch(/--mg-list-item-indent-rtl:\s*0/);
    }
  });
});
