# Design system research

Research notes on how other organizations approach the same multi-site, multi-brand design system challenge that Mangrove addresses. Compiled March 2026.

## UN system design systems

At least 8 UN agencies have independently built design systems. Each faces the same problem: multiple web properties that need shared content patterns with per-property visual identity.

### OCHA Common Design (closest parallel to Mangrove)

- **URL**: https://github.com/UN-OCHA/common_design_system
- **Drupal theme**: https://github.com/UN-OCHA/common_design
- **WordPress port**: https://github.com/UN-OCHA/common-design-wordpress
- **Approach**: Drupal base theme with ~40 components using `cd-` BEM prefix. Sites (ReliefWeb, GHO, ODSG, IASC) use child themes for per-site customization. No React dependency -- pure Drupal/Twig.
- **Starter kit**: https://github.com/UN-OCHA/drupal-starterkit
- **Relevance**: Same architecture as Mangrove (shared base + per-site theming) but Drupal-native. Demonstrates the pattern works at scale for humanitarian sites.

### UNDP Design System

- **URL**: https://design.undp.org/
- **GitHub**: https://github.com/undp/design-system
- **React docs**: https://react.design.undp.org/
- **npm**: @undp/design-system-react
- **Approach**: Uses ShadCN UI, Tailwind CSS, React. Figma design tokens synced to code automatically. 5,483 commits, 52 releases (v1.7.0). MIT licensed. Uses Chromatic for visual regression testing.
- **Note**: UNDP chose Tailwind (utility-first) because they don't syndicate rendered HTML across differently-themed sites. Different constraint than UNDRR, different solution.

### UNICEF Design System

- **URL**: https://unicef.github.io/design-system/
- **GitHub**: https://github.com/unicef/design-system
- **npm**: @unicef/design-system
- **Approach**: Bootstrap 4.3+ with SCSS variable overrides. Technology-agnostic (works with React, Angular, vanilla JS). Alpha stage.
- **Design principles** (quotable):
  1. "Lean design for slow Internet connections"
  2. "Design for all, regardless of tech savviness"
  3. "Accessibility for all -- in UNICEF every single person is important"
  4. "Minimal but effective design"
  5. "Consistent design -- so teams don't reinvent the wheel"

### WFP Bridge

- **URL**: https://designsystem.wfp.org/
- **GitHub**: https://github.com/wfp/designsystem
- **npm**: @wfp/ui, @wfp/react
- **Approach**: Three-layer token system (global → alias → component). React Storybook. "Consistency, Scalability and Continuous Improvement for all Organization Products."

### FAO Design System

- **URL**: https://design-system.fao.org/
- **Approach**: Bootstrap-based. Tested across 30+ screen sizes, orientations, and language combinations.

### ILO Design System

- **GitHub**: https://github.com/international-labour-organization/designsystem
- **Drupal theme**: https://github.com/international-labour-organization/ilo_base_theme
- **Approach**: Monorepo with npm packages. Drupal base theme exposes components as Drupal patterns.

### WIPO Universal Design System (ULF)

- **URL**: https://ulf.wipo.int/
- **Approach**: "An ever-evolving set of principles, web best practices, templates, components, and resources."

### WHO Data Design Language

- **URL**: https://apps.who.int/gho/data/design-language/
- **Approach**: Data visualization focused. Chart library, colour specs, typography for health reporting. Not a full component library.

## European Commission Europa Component Library (ECL)

The closest architectural match to Mangrove outside the UN system.

- **URL**: https://ec.europa.eu/component-library/
- **GitHub**: https://github.com/ec-europa/europa-component-library
- **License**: European Union Public Licence (EUPL)
- **Started**: January 2017
- **Current version**: v4 (v5 in alpha as of Feb 2026)
- **Releases**: 204 across all versions
- **Commits**: 3,490

### Architecture

- **BEM naming** with `ecl-` prefix (like Mangrove's `mg-`)
- **Two CSS distributions** for EC and EU -- same HTML markup, different CSS
- **SCSS with stylelint** validation
- **Twig templating** for multi-language support
- **npm/yarn distribution** as preset packages
- **Maintained by**: Digital Transformation team (DTT), cross-Commission team led by DGs COMM, DIGIT, and DTT
- **Presented at**: DIGITEC 2018 by Wesley Deglise

### Why this matters for Mangrove

The EC solved exactly the problem Mangrove faces: multiple web properties (ec.europa.eu and europa.eu domains) with distinct but related visual identities. Their solution -- keep component markup identical, switch CSS distributions -- is the same architecture Mangrove uses with its four theme files. At a much larger scale (all EU institution websites).

## GOV.UK Design System

- **URL**: https://design-system.service.gov.uk/
- **GitHub**: https://github.com/alphagov/govuk-frontend
- **CSS standards**: https://github.com/alphagov/govuk-frontend/blob/main/docs/contributing/coding-standards/css.md
- **Approach**: BEM naming with `govuk-` prefix across hundreds of government services. Created because "we had teams across government building services and often duplicating work."
- **Community principles**: "Start with what exists. Reuse as much as possible and iterate based on user needs." / "Contribute back: design solutions that are scalable, reusable and can evolve over time."

## US Web Design System (USWDS)

- **URL**: https://designsystem.digital.gov/
- **GitHub**: https://github.com/uswds/uswds
- **Approach**: BEM with `usa-` prefix. Serves all US federal agencies. Two-level nesting max, mobile-first, accessibility-first (WCAG 2.1 AA, working toward 2.2).

## Industry design systems

### Shopify Polaris (multi-brand context)

- **URL**: https://polaris.shopify.com/
- **Approach**: Semantic tokens for the multi-brand admin ecosystem. Polaris uses tokens like `--p-color-text-subdued` instead of hex codes.
- **Key insight**: Shopify uses Polaris (semantic) for their admin where multiple brands need consistency, but recommends Tailwind for individual storefronts where speed matters more than portability. This validates the "different tools for different constraints" argument.

### IBM Carbon Design System

- **URL**: https://carbondesignsystem.com/
- **Themes**: https://carbondesignsystem.com/elements/themes/code/
- **Approach**: 52 universal color variables per theme. "Altering one, some, or all of the default token values will result in a new theme." Role-based color system (brand, text, UI with numbered variants).

### GitHub Primer

- **URL**: https://primer.style/
- **Approach**: Three-tier tokens (base → functional → component). Inverted neutral scales so functional tokens work across light/dark/high-contrast without overrides.

## Key references

### People and voices

- **Brad Frost** (Atomic Design): "a library of aesthetic-and-technology-agnostic UI components that provides sturdy semantics and functionality while also providing a ton of aesthetic flexibility" -- [The many faces of themeable design systems](https://bradfrost.com/blog/post/the-many-faces-of-themeable-design-systems/)
- **Martin Fowler**: [Design token-based UI architecture](https://martinfowler.com/articles/design-token-based-ui-architecture.html)
- **Jina Anne** (coined "design tokens" at Salesforce): "We had customers that wanted to brand their UI. We had certain variables as constants and colors meant to be configurable." -- [Smashing Podcast Episode 3](https://www.smashingmagazine.com/2019/11/smashing-podcast-episode-3/)
- **Harry Roberts** (CSS Wizardry): "writing CSS is easy; looking after it is not" -- [cssguidelin.es](https://cssguidelin.es/)
- **Nicolas Gallagher** (SUIT CSS): A component "neither relies on existing within a certain part of the DOM tree, nor requires the use of specific element types. It should be able to adapt to different containers and be easily themed." -- [nicolasgallagher.com](https://nicolasgallagher.com/about-html-semantics-front-end-architecture/)

### Standards

- **W3C Design Tokens Community Group**: First stable spec published October 2025. Editors from Adobe, Amazon, Google, Microsoft, Meta, Figma, Salesforce, Shopify, Disney. [w3.org/community/design-tokens](https://www.w3.org/community/design-tokens/)
- **BEM methodology**: Created by Yandex for "over 100 services sharing the same corporate style." [en.bem.info/methodology/history](https://en.bem.info/methodology/history/)

### The utility-first vs. semantic debate

- "Theming is impossible with utility-first approaches like Tailwind because the design is tightly coupled to the markup" -- [nuejs.org](https://nuejs.org/blog/tailwind-vs-semantic-css/)
- "Dynamic styling for design system components is hard to achieve with Tailwind" -- [sancho.dev](https://sancho.dev/blog/tailwind-and-design-systems)
- "Engineers building with Tailwind CSS were briefly glancing at designs for 'inspiration'... so designers' tokens or docs were useless to them" -- [stevekinney.com](https://stevekinney.com/writing/tailwind-and-design-systems)
- CSS-Tricks: "the conceptual structure of components and the page will not be reflected" -- [css-tricks.com](https://css-tricks.com/if-were-gonna-criticize-utility-class-frameworks-lets-be-fair-about-it/)

### UN institutional backing

- Secretary-General's Roadmap for Digital Cooperation (2020)
- UN Department of Global Communications mandates uniform web standards -- [un.org/styleguide](https://www.un.org/styleguide/)
- UNCT standardized 100+ country team websites on a single codebase
- Contact for UN web standards: dgc-unwebstandards@un.org
