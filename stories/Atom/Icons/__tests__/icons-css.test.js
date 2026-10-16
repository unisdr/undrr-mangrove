/** @jest-environment node */
const path = require('path');
const sass = require('sass');
const postcss = require('postcss');

const css = sass.compile(
  path.resolve(__dirname, '../../../assets/scss/style-all.scss'),
  {
    silenceDeprecations: ['import'],
    logger: sass.Logger.silent,
  }
).css;
const root = postcss.parse(css);

describe('SVG-only icons in the complete theme bundle', () => {
  it('has no font loading or FontAwesome namespace', () => {
    expect(css).not.toMatch(/FontAwesome|mangrove-icon-set/);
    root.walkRules(rule => {
      expect(rule.selector).not.toMatch(
        /\.(?:fa(?:-[\w-]+)?|fas|fab)(?![\w-])/
      );
    });
  });

  it('applies SVG masks to the base pseudo-element without legacy exclusions', () => {
    const base = root.nodes.find(node => node.selector === '.mg-icon::before');
    expect(base).toBeDefined();
    const declarations = Object.fromEntries(
      base.nodes.map(node => [node.prop, node.value])
    );
    expect(declarations).toMatchObject({
      content: '\"\"',
      display: 'inline-block',
      width: '1em',
      height: '1em',
      'background-color': 'currentColor',
      'mask-image': 'var(--mg-icon-svg)',
    });
    expect(css).not.toContain('.mg-icon:not(');
  });
});
