# Design system research

Research on multi-site, multi-brand design system approaches. Compiled March 2026.

## UN system design systems

Eight UN agencies have independently built design systems for shared content patterns with per-property visual identity.

### OCHA Common Design (closest parallel to Mangrove)

- **Brand docs**: https://brand.unocha.org/document/281801#/web-design/common-design
- **GitHub (Drupal theme)**: https://github.com/UN-OCHA/common_design
- **GitHub (component library, archived)**: https://github.com/UN-OCHA/common_design_system
- **WordPress port**: https://github.com/UN-OCHA/common-design-wordpress
- **Approach**: Drupal base theme with ~40 `cd-` BEM components. Sites (ReliefWeb, GHO, ODSG, IASC) use child themes for customization. Pure Drupal/Twig, no React.
- **Starter kit**: https://github.com/UN-OCHA/drupal-starterkit
- **Relevance**: Identical architecture to Mangrove (shared base + per-site themes) at scale for humanitarian sites.

### UNDP Design System

- **URL**: https://design.undp.org/
- **GitHub**: https://github.com/undp/design-system
- **React docs**: https://react.design.undp.org/
- **npm**: @undp/design-system-react
- **Approach**: ShadCN UI + Tailwind CSS + React. Figma tokens synced automatically. 52 releases (v1.7.0), MIT licensed. Chromatic for visual regression testing.
- **Key difference**: Tailwind (utility-first) viable because UNDP doesn't syndicate HTML across themes. Different constraint than UNDRR, different solution.

### UNICEF Design System

- **URL**: https://unicef.github.io/design-system/
- **GitHub**: https://github.com/unicef/design-system
- **npm**: @unicef/design-system
- **Approach**: Bootstrap 4.3+ with SCSS variable overrides. Technology-agnostic (React, Angular, vanilla JS). Alpha stage.
- **Design principles**: Lean for slow connections, design for all tech levels, accessibility for all, minimal but effective, consistent to reduce reinvention.

### WFP Bridge

- **URL**: https://designsystem.wfp.org/
- **GitHub**: https://github.com/wfp/designsystem
- **npm**: @wfp/ui, @wfp/react
- **Approach**: Three-layer tokens (global → alias → component). React Storybook.

### FAO Design System

- **URL**: https://design-system.fao.org/
- **Approach**: Bootstrap-based. Tested across 30+ screen sizes, orientations, and language combinations.

### ILO Design System

- **GitHub**: https://github.com/international-labour-organization/designsystem
- **Drupal theme**: https://github.com/international-labour-organization/ilo_base_theme
- **Approach**: Monorepo with npm packages. Drupal base theme exposes components as Drupal patterns.

### WIPO Universal Design System (ULF)

- **URL**: https://ulf.wipo.int/
- **Approach**: Principles, web best practices, templates, components, and resources.

### WHO Data Design Language

- **URL**: https://apps.who.int/gho/data/design-language/
- **Approach**: Data visualization focused. Chart library, colour specs, typography for health reporting. Not a full component library.

## European Commission Europa Component Library (ECL)

Closest architectural match to Mangrove outside the UN system.

- **URL**: https://ec.europa.eu/component-library/
- **GitHub**: https://github.com/ec-europa/europa-component-library
- **License**: European Union Public Licence (EUPL)
- **Version**: v4 (v5 in alpha as of Feb 2026)
- **Architecture**: BEM naming (`ecl-` prefix, like Mangrove's `mg-`). Two CSS distributions for EC and EU domains -- identical HTML, different CSS. SCSS + stylelint, Twig templates for multi-language support. npm/yarn distribution as preset packages.
- **Why relevant**: Solves identical problem (multiple web properties with distinct but related identities). Solution matches Mangrove's architecture (identical markup, switched CSS per theme) at scale across all EU institution websites.

## GOV.UK Design System

- **URL**: https://design-system.service.gov.uk/
- **GitHub**: https://github.com/alphagov/govuk-frontend
- **CSS standards**: https://github.com/alphagov/govuk-frontend/blob/main/docs/contributing/coding-standards/css.md
- **Approach**: BEM (`govuk-` prefix) across hundreds of services. Principles: start with what exists, reuse and iterate, contribute back scalable solutions.

## US Web Design System (USWDS)

- **URL**: https://designsystem.digital.gov/
- **GitHub**: https://github.com/uswds/uswds
- **Approach**: BEM (`usa-` prefix) for all US federal agencies. Two-level nesting max, mobile-first, WCAG 2.1 AA (working toward 2.2).

## Industry design systems

### Shopify Polaris (multi-brand context)

- **URL**: https://polaris.shopify.com/
- **Approach**: Semantic tokens (`--p-color-text-subdued` instead of hex codes) for multi-brand admin ecosystem.
- **Key insight**: Polaris (semantic) for admin consistency; Tailwind for storefronts where speed > portability. Validates "different tools for different constraints" principle.

### IBM Carbon Design System

- **URL**: https://carbondesignsystem.com/
- **Themes**: https://carbondesignsystem.com/elements/themes/code/
- **Approach**: 52 universal color variables per theme. Role-based system (brand, text, UI with numbered variants).

### GitHub Primer

- **URL**: https://primer.style/
- **Approach**: Three-tier tokens (base → functional → component). Inverted neutral scales for light/dark/high-contrast without overrides.

## Key references

### People and voices

- **Brad Frost** (Atomic Design): Semantic, technology-agnostic components with functional flexibility -- [The many faces of themeable design systems](https://bradfrost.com/blog/post/the-many-faces-of-themeable-design-systems/)
- **Martin Fowler**: [Design token-based UI architecture](https://martinfowler.com/articles/design-token-based-ui-architecture.html)
- **Jina Anne** (Salesforce, coined "design tokens"): [Smashing Podcast Episode 3](https://www.smashingmagazine.com/2019/11/smashing-podcast-episode-3/)
- **Harry Roberts** (CSS Wizardry): [cssguidelin.es](https://cssguidelin.es/)
- **Nicolas Gallagher** (SUIT CSS): Components must adapt to containers and themes without DOM or element constraints -- [nicolasgallagher.com](https://nicolasgallagher.com/about-html-semantics-front-end-architecture/)

### Standards

- **W3C Design Tokens Community Group**: Stable spec published October 2025. Editors from Adobe, Amazon, Google, Microsoft, Meta, Figma, Salesforce, Shopify, Disney. [w3.org/community/design-tokens](https://www.w3.org/community/design-tokens/)
- **BEM methodology**: Created by Yandex for "over 100 services sharing the same corporate style." [en.bem.info/methodology/history](https://en.bem.info/methodology/history/)

### Utility-first vs. semantic debate

- Theming is impossible with Tailwind because design couples to markup -- [nuejs.org](https://nuejs.org/blog/tailwind-vs-semantic-css/)
- Dynamic styling for components is hard with Tailwind -- [sancho.dev](https://sancho.dev/blog/tailwind-and-design-systems)
- Engineers with Tailwind skip design docs for "inspiration" -- [stevekinney.com](https://stevekinney.com/writing/tailwind-and-design-systems)
- CSS-Tricks: component structure not reflected in utility approach -- [css-tricks.com](https://css-tricks.com/if-were-gonna-criticize-utility-class-frameworks-lets-be-fair-about-it/)

### UN institutional backing

- Secretary-General's Roadmap for Digital Cooperation (2020)
- UN Department of Global Communications mandates uniform web standards -- [un.org/styleguide](https://www.un.org/styleguide/)
- UNCT standardized 100+ country team websites on single codebase
- UN web standards contact: dgc-unwebstandards@un.org
