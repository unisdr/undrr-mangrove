/**
 * Every var(--mg-*) Mangrove reads must be defined.
 *
 * A reference to a custom property that nothing defines is not an error in
 * CSS: the declaration is dropped (or its fallback used) and the build stays
 * green. That is how `var(--mg-font-size-200)`, `--mg-color-background` and
 * `--mg-radius-default` shipped unnoticed before the type scale became public.
 * See unisdr/undrr-mangrove#1167.
 *
 * Checked two ways:
 *   1. Each compiled bundle only reads properties that bundle defines.
 *   2. JS, JSX and plain CSS under stories/ (inline styles, examples) only
 *      read properties some bundle defines.
 *
 * INPUT_HOOKS lists the properties that are deliberately undefined in the
 * stylesheet because a component prop, inline style or consuming page sets
 * them. Add to it only with a reason, and document the hook in the
 * component's MDX.
 */
const fs = require('fs');
const path = require('path');
const sass = require('sass');

const SCSS_DIR = path.resolve(__dirname, '..');
const STORIES_DIR = path.resolve(__dirname, '../../..');

const BUNDLES = [
  'style',
  'style-preventionweb',
  'style-irp',
  'style-mcr',
  'style-delta',
  'style-all',
  'style-gutenberg',
];

const INPUT_HOOKS = {
  '--mg-card-border':
    'IconCard borderColor prop, set inline; .mg-card__icon--bordered falls back to rgb(var(--mg-color-interactive)) so the public class is never an invisible border',
  '--mg-card-icon-size': 'IconCard icon size override, set inline',
  '--mg-cta-bg': 'TextCta backgroundColor prop, set inline',
  '--mg-icon-bg': 'IconCard iconColor prop, set inline',
  '--mg-icon-fg': 'IconCard iconFgColor prop, set inline',
  '--mg-legend-tick-pos': 'Legend tick position, set inline per tick',
  '--mg-on-this-page-nav-offset':
    'Page-level docking offset for fixed headers, set by the consuming page',
  // Only the radius is genuinely undefined in the stylesheet. The height hook
  // is read with its default where it is used, but .mg-segmented-control--small
  // does declare it, so the bundle defines it and it needs no entry here —
  // listing it would claim a hook is undefined when it is not.
  '--mg-segmented-control-radius':
    'Segmented control end radius, set by a wrapper',
  // The switch reads each hook with its default where it is used, so a
  // wrapper or theme can set it; declaring it on .mg-switch would shadow that.
  // Geometry hooks. --mg-switch-size is the one a consumer usually sets; the
  // other three override a single derived part. .mg-switch--small sets
  // --mg-switch-size, which is why it is read but never declared at rest.
  '--mg-switch-size': 'Switch size hook, set by a wrapper or --small',
  '--mg-switch-thumb-size': 'Switch size hook, set by a wrapper',
  '--mg-switch-track-block-size': 'Switch size hook, set by a wrapper',
  '--mg-switch-track-border-color--error':
    'Switch theming hook, set by a wrapper',
  '--mg-switch-track-inline-size': 'Switch size hook, set by a wrapper',
  '--mg-switch-track-inset': 'Switch size hook, set by a wrapper',
  '--mg-switch-pending-ring-color': 'Switch theming hook, set by a wrapper',
  '--mg-switch-pending-ring-gap-color': 'Switch theming hook, set by a wrapper',
  '--mg-switch-thumb-background': 'Switch theming hook, set by a wrapper',
  '--mg-switch-track-background': 'Switch theming hook, set by a wrapper',
  '--mg-switch-track-background--checked':
    'Switch theming hook, set by a wrapper',
  '--mg-switch-track-overlay--disabled':
    'Switch theming hook, set by a wrapper',
  '--mg-switch-track-overlay--pending': 'Switch theming hook, set by a wrapper',
};

const withoutComments = css => css.replace(/\/\*[\s\S]*?\*\//g, '');

const definedIn = css =>
  new Set(
    [...css.matchAll(/(--mg-[A-Za-z0-9_-]+)\s*:/g)].map(match => match[1])
  );

const readIn = text =>
  new Set(
    [...text.matchAll(/var\(\s*(--mg-[A-Za-z0-9_-]+)/g)].map(match => match[1])
  );

const compiled = Object.fromEntries(
  BUNDLES.map(entry => [
    entry,
    withoutComments(
      sass.compile(path.join(SCSS_DIR, `${entry}.scss`), {
        loadPaths: [SCSS_DIR],
        silenceDeprecations: ['import'],
        logger: sass.Logger.silent,
      }).css
    ),
  ])
);

const undefinedRefs = (reads, defined) =>
  [...reads]
    .filter(name => !defined.has(name) && !(name in INPUT_HOOKS))
    .sort();

describe('custom properties read by Mangrove are defined', () => {
  test.each(BUNDLES)('%s.css reads no undefined --mg-* property', entry => {
    const css = compiled[entry];
    expect(undefinedRefs(readIn(css), definedIn(css))).toEqual([]);
  });

  test('stories JS, JSX and CSS read no undefined --mg-* property', () => {
    const allDefined = new Set(
      Object.values(compiled).flatMap(css => [...definedIn(css)])
    );
    const offenders = [];

    const walk = dir => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (['node_modules', '__tests__'].includes(entry.name)) continue;
          if (full === path.join(STORIES_DIR, 'assets', 'css')) continue;
          walk(full);
        } else if (/\.(jsx?|css)$/.test(entry.name)) {
          const text = fs.readFileSync(full, 'utf8');
          const missing = undefinedRefs(readIn(text), allDefined);
          if (missing.length) {
            offenders.push(`${path.relative(STORIES_DIR, full)}: ${missing}`);
          }
        }
      }
    };
    walk(STORIES_DIR);

    expect(offenders).toEqual([]);
  });

  test('every input hook is actually read somewhere', () => {
    const allRead = new Set(
      Object.values(compiled).flatMap(css => [...readIn(css)])
    );
    expect(Object.keys(INPUT_HOOKS).filter(name => !allRead.has(name))).toEqual(
      []
    );
  });
});
