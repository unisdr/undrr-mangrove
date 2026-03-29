# Migrating to schema-aligned props (v2)

Phase 2 aligns all component props with the canonical content schemas defined in `schemas/`. These are breaking changes to prop names. This guide covers every changed prop and shows before/after examples so you can update your integrations.

If you are consuming Mangrove components via npm (`import { VerticalCard } from '@undrr/undrr-mangrove'`), update your JSX props. If you are consuming components via Drupal data attributes, see [Drupal data attribute changes](#drupal-data-attribute-changes).

For background on the schema layer, see [Design decisions / Content architecture](https://unisdr.github.io/undrr-mangrove/?path=/docs/design-decisions-content-architecture--docs) in Storybook.

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
// Before (v1)
<VerticalCard data={[{
  imgback: '/img.jpg',
  imgalt: 'Description',
  label1: 'Category',
  label2: 'Tag',
  title: 'Card title',
  summaryText: 'Body text',
  link: '/page',
}]} />

// After (v2)
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
// Before (v1)
<StatsCard stats={[{
  value: '1,500+',
  label: 'Disasters recorded',
  summaryText: 'In the reporting period',
}]} />

// After (v2)
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
// Before (v1)
<QuoteHighlight
  quote="Risk reduction is everyone's responsibility."
  attribution="António Guterres"
  imageSrc="/portraits/guterres.jpg"
  imageAlt="Portrait of António Guterres"
/>

// After (v2)
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
// Before (v1)
<ShareButtons
  labels={{ mainLabel: 'Share this', onCopy: 'Copied' }}
  SharingSubject="Read this report"
  SharingTextBody="Check out this resource: "
/>

// After (v2)
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
// Before (v1)
<TextCta
  headline="Join the global effort"
  text="Disaster risk reduction starts with you."
  image="/banners/drr-banner.jpg"
  imageAlt="People collaborating around a table"
/>

// After (v2)
<TextCta
  headline="Join the global effort"
  text="Disaster risk reduction starts with you."
  image={{ src: '/banners/drr-banner.jpg', alt: 'People collaborating around a table' }}
/>
```

---

## MegaMenu

No breaking changes. A new optional `ariaLabel` prop is available to set the accessible name for the navigation landmark. The default value is `'Main Navigation'`.

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
// Before (v1 JSON in data-items)
[{
  "imgback": "/img.jpg",
  "imgalt": "Description",
  "label": "Category",
  "title": "Card title",
  "summaryText": "Body text"
}]

// After (v2 JSON in data-items)
[{
  "image": { "src": "/img.jpg", "alt": "Description" },
  "labels": ["Category"],
  "title": "Card title",
  "summary": "Body text"
}]
```

**StatsCard** — The `data-stats` attribute accepts a JSON array. Update Gutenberg block output to use `summary` instead of `summaryText` in each stat item:

```json
// Before (v1 JSON in data-stats)
[{ "value": "1,500+", "label": "Disasters", "summaryText": "In the period" }]

// After (v2 JSON in data-stats)
[{ "value": "1,500+", "label": "Disasters", "summary": "In the period" }]
```

---

## Contract tests

Phase 2 introduces contract tests alongside existing component tests. A contract test (`ComponentName.contract.test.jsx`) validates two things in sequence:

1. A schema-valid fixture passes AJV validation against the component's JSON Schema.
2. The same fixture renders correctly in the component — key content appears in the output.

This catches regressions where a component silently ignores a required field, and ensures that schema-valid data always produces a renderable result. Contract tests live in each component's `__tests__/` directory alongside existing `.test.jsx` files.

To run all tests including contract tests:

```bash
yarn build:schemas && yarn test
```

The `yarn build:schemas` step is required first because contract tests import from `schemas/dist/`, which is gitignored and must be built locally.
