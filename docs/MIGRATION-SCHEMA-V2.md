# Draft migration: schema-aligned props

This unmerged Phase 2 proposal renames inputs on selected legacy components to match the proposed contracts in `schemas/`. It has not shipped in Mangrove 2.3.0 and has no assigned release version. The filename is historical; the examples compare the current main API with this draft API. These component contracts do not replace the separate ContentCard/ContentTeaser projections or approve canonical editorial content models.

If you are consuming Mangrove components via npm (`import { VerticalCard } from '@undrr/undrr-mangrove/components/VerticalCard.js'`), update your JSX props. If you are consuming components via Drupal data attributes, see [Drupal data attribute changes](#drupal-data-attribute-changes).

For this branch’s proposal and schema background, see:
- [Schema phase 2 proposal](?path=/docs/design-decisions-schema-phase-2-proposal--docs) in Storybook (or [source proposal](PROPOSAL-SCHEMA-PHASE-2.md))
- [Design decisions / Content architecture](?path=/docs/design-decisions-content-architecture--docs) — schema inventory and authoring guide

---

## Card components

Applies to: VerticalCard, HorizontalCard, BookCard, HorizontalBookCard, IconCard.

| Old prop | New prop | Notes |
|----------|----------|-------|
| `data` | `items` | Top-level array renamed for schema alignment |
| `data[].imgback` | `items[].image.src` | Flat URL moved into nested image object |
| `data[].imgalt` | `items[].image.alt` | Flat alt moved into nested image object |
| `data[].label1` | `items[].labels[0]` | First label; separate props merged into array (VerticalCard, HorizontalCard, HorizontalBookCard) |
| `data[].label2` | `items[].labels[1]` | Second label; separate props merged into array (VerticalCard, HorizontalCard, HorizontalBookCard) |
| `data[].label` | `items[].labels[0]` | Single label moved into array (IconCard only) |
| `data[].summaryText` | `items[].summary` | Renamed for schema alignment |

```jsx
// Before (current main)
<VerticalCard data={[{
  imgback: '/img.jpg',
  imgalt: 'Description',
  label1: 'Category',
  label2: 'Tag',
  title: 'Card title',
  summaryText: 'Body text',
  link: '/page',
}]} />

// After (draft)
<VerticalCard items={[{
  image: { src: '/img.jpg', alt: 'Description' },
  labels: ['Category', 'Tag'],
  title: 'Card title',
  summary: 'Body text',
  link: '/page',
}]} />
```

---

## StatsCard and StatsCardItem

| Old prop | New prop |
|----------|----------|
| `stats[].summaryText` | `stats[].summary` |

```jsx
// Before (current main)
<StatsCard stats={[{
  value: '1,500+',
  label: 'Disasters recorded',
  summaryText: 'In the reporting period',
}]} />

// After (draft)
<StatsCard stats={[{
  value: '1,500+',
  label: 'Disasters recorded',
  summary: 'In the reporting period',
}]} />
```

---

## QuoteHighlight

| Old prop | New prop |
|----------|----------|
| `imageSrc` | `image.src` |
| `imageAlt` | `image.alt` |

```jsx
// Before (current main)
<QuoteHighlight
  quote="Risk reduction is everyone's responsibility."
  attribution="António Guterres"
  imageSrc="/portraits/guterres.jpg"
  imageAlt="Portrait of António Guterres"
/>

// After (draft)
<QuoteHighlight
  quote="Risk reduction is everyone's responsibility."
  attribution="António Guterres"
  image={{ src: '/portraits/guterres.jpg', alt: 'Portrait of António Guterres' }}
/>
```

---

## ShareButtons

| Old prop | New prop |
|----------|----------|
| `SharingSubject` | `sharingSubject` |
| `SharingTextBody` | `sharingBody` |

```jsx
// Before (current main)
<ShareButtons
  labels={{ mainLabel: 'Share this', onCopy: 'Copied' }}
  SharingSubject="Read this report"
  SharingTextBody="Check out this resource: "
/>

// After (draft)
<ShareButtons
  labels={{ mainLabel: 'Share this', onCopy: 'Copied' }}
  sharingSubject="Read this report"
  sharingBody="Check out this resource: "
/>
```

---

## TextCta

| Old prop | New prop |
|----------|----------|
| `image` (URL string) | `image.src` |
| `imageAlt` | `image.alt` |

```jsx
// Before (current main)
<TextCta
  headline="Join the global effort"
  text="Disaster risk reduction starts with you."
  image="/banners/drr-banner.jpg"
  imageAlt="People collaborating around a table"
/>

// After (draft)
<TextCta
  headline="Join the global effort"
  text="Disaster risk reduction starts with you."
  image={{ src: '/banners/drr-banner.jpg', alt: 'People collaborating around a table' }}
/>
```

---

## MegaMenu

The draft adds optional `ariaLabel` for the navigation landmark. When omitted, MegaMenu keeps the resolved `labels.navLabel` from its current runtime language catalogue. Explicit `ariaLabel` takes precedence; existing label and direction overrides remain supported.

```jsx
// Optional — only needed when the default label doesn't fit
<MegaMenu
  sections={sections}
  ariaLabel="Site navigation"
/>
```

---

## Gallery

No changes. Gallery was already fully schema-aligned and requires no migration.

---

## Drupal data attribute changes

Components with `fromElement` hydration functions translate DOM data attributes into React props. For most components, existing Drupal Twig templates require no changes.

**VerticalCard, HorizontalCard, BookCard, and HorizontalBookCard** have no Drupal React hydration at all — there are no wrapper scripts or `fromElement` functions for these components. If your site renders them as server-side HTML only, no action is needed. If you render them via direct React imports (e.g., in a custom JS build), update the props at the call site.

### No Drupal changes required

**QuoteHighlight** — `fromElement` reads `data-image-src` and `data-image-alt` and maps them to the `image` object. Your Twig templates are unchanged:

```html
<div data-mg-quote-highlight
     data-quote="..."
     data-image-src="/portraits/guterres.jpg"
     data-image-alt="Portrait of António Guterres">
</div>
```

**TextCta** — `fromElement` reads `data-image` and `data-image-alt` and maps them to the `image` object. Your Twig templates are unchanged:

```html
<div data-mg-text-cta
     data-headline="..."
     data-image="/banners/drr-banner.jpg"
     data-image-alt="People collaborating">
</div>
```

**ShareButtons** — Data attributes `data-sharing-subject` and `data-sharing-body` map directly to the new camelCase props. Your Twig templates are unchanged:

```html
<section data-mg-share-buttons
         data-main-label="Share this"
         data-sharing-subject="Read this report"
         data-sharing-body="Check out this resource: ">
</section>
```

### Drupal changes required

**IconCard** — The `data-items` attribute accepts a JSON array. Update Gutenberg block output to use schema-aligned field names inside each item:

```json
// Before (current main JSON in data-items)
[{
  "imgback": "/img.jpg",
  "imgalt": "Description",
  "label": "Category",
  "title": "Card title",
  "summaryText": "Body text"
}]

// After (draft JSON in data-items)
[{
  "image": { "src": "/img.jpg", "alt": "Description" },
  "labels": ["Category"],
  "title": "Card title",
  "summary": "Body text"
}]
```

**StatsCard** — The `data-stats` attribute accepts a JSON array. Update Gutenberg block output to use `summary` instead of `summaryText` in each stat item:

```json
// Before (current main JSON in data-stats)
[{ "value": "1,500+", "label": "Disasters", "summaryText": "In the period" }]

// After (draft JSON in data-stats)
[{ "value": "1,500+", "label": "Disasters", "summary": "In the period" }]
```

---

## Contract tests

Phase 2 introduces contract tests alongside existing component tests. A contract test (`ComponentName.contract.test.jsx`) validates two things in sequence:

1. A schema-valid fixture passes AJV validation against the component's JSON Schema.
2. The same fixture renders correctly in the component — key content appears in the output.

This catches regressions where a component silently ignores a required field, and ensures that schema-valid data always produces a renderable result. Contract tests live in each component's `__tests__/` directory alongside existing `.test.jsx` files.

To build the proposed schemas and run the tests in this branch:

```bash
yarn build:schemas && yarn test
```

Run `yarn build:schemas` after changing a schema source: contract tests import the compiled JSON in `schemas/dist/`, and this draft versions those seven files alongside their sources. Regenerate them rather than editing the JSON by hand.
