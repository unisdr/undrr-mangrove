# Cascade layers

This document records cascade findings from the Storybook React Aria research
skin. That broad stylesheet is no longer published. The supported ComboBox
ships scoped CSS and documents an app-level layer import in its component page.

The research stylesheet was **unlayered**, and there is
currently no layered flavour of it. This page explains how it interacts with
layered application CSS and what a future layered build would require.

## Why the current surface is unlayered

An unlayered rule beats a layered rule, always, no matter the specificity. That
is the whole point of cascade layers: unlayered CSS sits at the top of the layer
order.

That affects consumers who combine the optional, unlayered React Aria surface
with layered application utilities:

- **It hurts you.** If you use Tailwind 4 — which puts its utilities in
  `@layer utilities` — and you load Mangrove, **your utility classes cannot
  override Mangrove**, because Mangrove is unlayered and therefore above every
  layer you declare.
- **A layered build would help.** The React Aria surface is no longer compiled
  into normal Mangrove theme sheets. A future layered Aria file could therefore
  sit below application utilities, provided the consuming application declares
  its layer order before loading either stylesheet.

A layered Aria file is not yet built or shipped. The current optional file
remains unlayered for compatibility with existing unlayered application CSS.

```html
<link rel="stylesheet" href="aria/react-aria.css" />
<!-- .react-aria-Button { display: inline-flex }, unlayered -->
<style>
  @layer utilities {
    .u-block {
      display: block;
    }
  }
</style>
<button class="react-aria-Button u-block">…</button>
<!-- computed display: inline-flex — Mangrove wins, the utility loses -->
```

## Why a layered build is now possible

The React Aria surface is opt-in rather than compiled into every theme
stylesheet. Because `style.css` no longer carries an unlayered copy of the same
rules, a future layered build can now provide a genuinely lower-priority entry
point. Mangrove does not build that additional flavour yet; see
[React Aria architecture notes](ARIA-ARCHITECTURE-NOTES.md).

## If you need a layered build today

You can produce one yourself in a few lines; `postcss` is already a Mangrove
dependency. Parse the built CSS, hoist `@charset` / `@import` / `@namespace`
above the wrapper (they are illegal inside `@layer`), and wrap the rest in
`@layer mangrove { … }`.

Read the rest of this page first, though — the ordering rules and the toolchain
failures below apply to any layered stylesheet, yours included, and they are the
part that actually bites.

## What a consumer must do with any layered stylesheet

### 1. Declare the layer order first, before any stylesheet loads

**This is the one thing that must be right.** Layer order is set by first
appearance. Put the order statement in an inline `<style>` in `<head>`, above
every `<link>` and every bundler-injected stylesheet:

```html
<head>
  <style>
    @layer legacy, mangrove, utilities;
  </style>
  <link rel="stylesheet" href="/path/to/your-layered.css" />
  <link rel="stylesheet" href="/path/to/your-utilities.css" />
</head>
```

In a bundled app, the equivalent is a stylesheet imported before all others:

```css
/* layers.css — imported first in your entry point */
@layer legacy, mangrove, utilities;
```

Get this wrong and the order silently inverts. If `@layer mangrove { … }`
appears before the order statement, `mangrove` registers as the *first* layer
and everything named after it in the statement — including `legacy` — ends up
*above* Mangrove:

```css
@layer mangrove {
  .x {
    color: rgb(1, 1, 1);
  }
}
@layer legacy, mangrove, utilities; /* too late */
@layer legacy {
  .x {
    color: rgb(2, 2, 2);
  }
}
/* computed: rgb(2,2,2) — legacy beats mangrove, which is backwards */
```

There is no warning and no console error. The page just looks wrong.

### 2. Put your unlayered legacy CSS into a layer — the one-line change

This is the trap that made Mangrove ship unlayered in the first place. Layered
Mangrove versus **unlayered** legacy CSS means legacy wins every rule, even a
low-specificity one:

```html
<link rel="stylesheet" href="your-layered-mangrove.css" />
<style>
  .legacy button {
    display: grid;
  }
</style>
<!-- computed display: grid — legacy beats Mangrove -->
```

The fix is one line at each `<link>` for a legacy stylesheet you do not want
outranking Mangrove — wrap it at import time:

```css
/* in the stylesheet that loads your legacy CSS */
@import url('./legacy.css') layer(legacy);
```

Or, if that stylesheet is yours to edit, wrap its contents directly:

```css
@layer legacy {
  /* … all of your existing legacy CSS, unchanged … */
}
```

**Prefer wrapping the contents over `@import … layer()`.** See the toolchain
warnings below — `@import … layer()` is the part that breaks in build tools.

### 3. Do not double-wrap

Import an already-layered file plainly. Doing
`@import url('layered.css') layer(vendor)` nests it as `vendor.mangrove`, so
`@layer legacy, mangrove, utilities` no longer refers to it and your ordering
silently stops applying.

## What breaks if you get it wrong

| Mistake                                        | Symptom                                                                    |
| ---------------------------------------------- | -------------------------------------------------------------------------- |
| Unlayered Aria surface + layered Tailwind utilities | The surface wins over utilities on the same element.                   |
| Layered stylesheet, no order statement         | Order falls back to first appearance; usually still fine, but not stated.   |
| Order statement after the first `@layer` block | Order silently inverts; legacy CSS outranks Mangrove.                       |
| Layered Mangrove + unlayered legacy CSS        | Legacy CSS wins every conflict, including single-class selectors.           |
| A layered copy loaded alongside a brand sheet  | No conflicting Aria copy exists in the brand sheet; declared layer order applies. |

## Toolchain warnings — measured, not assumed

These were tested in this repository on 2026-09-02.

### Sass preserves everything (verified)

`sass` 1.103.1 passes `@layer` blocks, bare `@layer a, b, c;` order statements
and `@import url("x.css") layer(name)` through untouched, in both expanded and
`--style=compressed` output. Sass is not a risk.

### webpack + css-loader reorders `@import … layer()` (verified, and it breaks ordering)

Compiling through this repo's own webpack stack (`css-loader` 7,
`sass-loader` 17, `mini-css-extract-plugin`, `css-minimizer-webpack-plugin`),
this input:

```css
@import url('./plain.css') layer(mangrove);
@layer legacy, mangrove, utilities;
@layer mangrove {
  .a {
    color: red;
  }
}
```

produced this output:

```css
@layer mangrove{.imported{color:#639}.a{color:red}}@layer legacy, mangrove, utilities;@layer mangrove{}.c{color:#000}
```

css-loader inlined the import correctly, but **hoisted the resulting
`@layer mangrove` block above the order statement.** Loading that artifact in a
browser confirmed the consequence: a consumer's `@layer legacy` rule then beat
Mangrove, the exact inverse of the intent.

Do not rely on `@import … layer()` surviving a bundler. Wrap layer contents
directly instead.

### Drupal's CSS aggregator does not understand `@import … layer()` (researched)

Drupal core's `CssOptimizer` inlines local `@import` statements during
aggregation using a regex that has no accommodation for a trailing `layer(…)`:

```
/@import\s*(?:url\(\s*)?['"]?(?![a-z]+:)(?!\/\/)([^'"\()]+)['"]?\s*\)?\s*;/
```

An `@import url('x.css') layer(y);` does not match, so it is left in place
rather than inlined — it still works in the browser, but it is excluded from the
aggregate and costs an extra request. This is a known, still-open core issue:
[#3470829 "Support for CSS Cascade Layer import in CssOptimizer"](https://www.drupal.org/project/drupal/issues/3470829)
(opened Aug 2024, MR
[!9361](https://git.drupalcode.org/project/drupal/-/merge_requests/9361) not
merged as of Sept 2026). `@import` handling in `CssOptimizer` has a long history
of edge-case breakage generally — see
[#2936067](https://www.drupal.org/project/drupal/issues/2936067),
[#413296](https://www.drupal.org/project/drupal/issues/413296),
[#3133572](https://www.drupal.org/project/drupal/issues/3133572).

**What we could not confirm:** whether Drupal aggregation preserves plain
`@layer name { … }` *blocks*. Nothing in `CssOptimizer` is `@layer`-aware and
its transformations are comment stripping, whitespace minification and `url()`
rewriting, none of which should touch an at-rule block — but we found no
drupal.org issue or test that states this either way, and we did not run a live
Drupal aggregation. If you are the first Drupal site to ship a layered
stylesheet, verify with aggregation switched on before trusting it in
production.

Note also that aggregation strips comments and rewrites relative `url()` paths.
Neither affects layering.

### Browser support (researched)

Both features are Baseline "widely available":

| Feature                 | Chrome/Edge | Firefox | Safari / iOS | Shipped     |
| ----------------------- | ----------- | ------- | ------------ | ----------- |
| `@layer` block          | 99          | 97      | 15.4         | ~March 2022 |
| `@import … layer(name)` | 99          | 97      | 15.4         | ~March 2022 |

They are tracked as separate compatibility entries but shipped together in every
engine, so there is no browser-side reason to prefer one over the other. The
risk with `@import … layer()` is entirely in build tooling, above.

Browsers that predate `@layer` ignore the whole `@layer { … }` block, so an old
browser loading a layered stylesheet gets **none of its rules at all**. If you
still support pre-2022 browsers, ship unlayered CSS.

## Design tokens stay unlayered

The supported `css/tokens/*.css` files are deliberately **not**
layered. They only declare custom properties, and keeping them out of a layer
means a consumer can override a token from anywhere without thinking about layer
order. Import them alongside a supported scoped component stylesheet however
you load it.
