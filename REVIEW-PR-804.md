# Architectural Review: Should This Complexity Live in the Component Library?

**PR #804 — feat: prototype layered hydration for ScrollContainer and ShareButtons**

I've done a thorough review of the code, the parent issue (#803), and the discussion. Here's my assessment of the central question: **does it make sense to introduce this hydration complexity at the component library level, or should it remain at the application layer?**

## Short answer: The core pattern is justified, but set strict boundaries.

---

## What works well

### 1. The `fromElement` functions are a genuine improvement.

The prop extraction contract — "given this DOM element with `data-mg-*` attributes, here are the React props" — is fundamentally a **component concern**. The component knows what props it needs and what types they should be. Having each consumer (Drupal, Phyte, Delta) independently reinvent this mapping is where bugs live. When a component's prop interface changes, you'd need to update N consumers in lockstep. The `fromElement` functions create a single source of truth that's testable at CI time. That's the real payoff of this PR, and it's worth keeping.

### 2. The `createHydrator` runtime is appropriately small.

At 74 lines, `src/hydrate.js` is a focused utility, not a framework. It handles exactly what every consumer would otherwise duplicate: DOM querying, React root lifecycle, error isolation, and the `update(context)` pattern critical for Drupal's `behaviors.attach`. This is well within the scope of a component library's responsibility.

### 3. The test coverage is solid.

The 17 tests on `createHydrator` and the per-component `fromElement` tests catch the things that actually break in production: prop drift, double-mounting, error cascading, dynamic DOM. These tests justify their existence.

---

## Where to be cautious

### 1. ScrollContainer's `fromElement` pushes the pattern to its limit.

ShareButtons' `fromElement` is 26 lines of clean data-attribute-to-props mapping. ScrollContainer's `fromElement` is 49 lines that instantiate a `DOMParser`, parse innerHTML, and extract child elements as HTML strings. This then requires the *component itself* to gain polymorphic children handling (`dangerouslySetInnerHTML` vs `React.Children.map`). That's complexity bleeding *into* the component to support the hydration layer — the tail wagging the dog.

This is the pattern to watch. If adding `fromElement` to a component means the component itself needs to change to accommodate two rendering modes (React children vs HTML strings), that's a signal you've crossed the line from "library concern" to "application concern."

### 2. Complex components won't benefit, and the PR acknowledges this.

MegaMenu and SyndicationSearchWidget are called out as retaining substantial consumer-side code (API fetching, tree building, hooks). If the pattern only cleanly applies to simple/medium components, the total surface area of benefit is limited. Be honest about that when evaluating the ongoing maintenance cost of the pattern (3 extra files + webpack entry per component).

### 3. The risk is scope creep, not the current scope.

Right now `createHydrator` is 74 lines. The danger is that real-world consumer integration reveals edge cases that gradually bloat it: custom mounting strategies, framework-specific lifecycle hooks, SSR rehydration vs cold mounting, etc. If you find yourself adding `if (isDrupal)` or `if (isAstro)` branches, stop — that complexity belongs in Layer 3.

---

## Recommendation

**Keep the work, but apply these constraints:**

1. **`fromElement` should only map data attributes to props.** If a component needs HTML child extraction (like ScrollContainer), that parsing logic should stay at the application layer. A `fromElement` that needs `DOMParser` is doing too much.

2. **Don't modify components to support hydration.** If a component needs a new code path (like `dangerouslySetInnerHTML`) just to work with `fromElement`, the hydration concern has leaked into the component. Keep components pure; let consumers handle HTML-to-React conversion.

3. **Cap `createHydrator` at its current scope.** It handles DOM querying, error isolation, `update(context)`, and hydration markers. That's sufficient. Resist adding consumer-specific logic.

4. **Roll out selectively.** Only add `fromElement` to components where the mapping is genuinely simple (ShareButtons, QuoteHighlight, StatsCard-type components). For complex components, the application layer is the right home for the integration logic.

5. **Treat the `data-mg-*` attribute schema as a versioned contract.** Since `fromElement` functions now codify these attributes as a formal API surface, changes to them are breaking changes. Document this expectation.

If you stay within these boundaries, the ~1,200 lines added here earn their keep by preventing duplicated, untested prop-extraction code across every consumer. If you find yourself stretching beyond them, that's the signal to stop and leave the remaining complexity at the application layer.

---

*Review generated from analysis of the full PR diff, issue #803 research, and the commit history.*
