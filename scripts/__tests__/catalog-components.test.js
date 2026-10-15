/** @jest-environment node */
import {
  selectPublishedComponents,
  propTypesCoverage,
} from '../ai-manifest/catalog-components.js';

// Shape from Storybook's real Quality/Motion manifest entry: a story-only
// group has no component docgen and carries a generated, invalid root import.
// Publishing it would invent a vanilla HTML component and dilute coverage.
const qualityMotion = {
  id: 'quality-motion',
  name: 'Motion',
  path: './stories/Quality/Motion/Motion.stories.jsx',
  jsDocTags: {},
  error: {
    name: 'No component found',
    message: 'We could not detect the component from your story file.',
  },
  stories: [
    { id: 'quality-motion--loading', name: 'Loading' },
    { id: 'quality-motion--gallery-loading', name: 'Gallery Loading' },
  ],
  import:
    "import { Gallery, Loader, ProgressBar } from '@undrr/undrr-mangrove';",
};
const loader = {
  id: 'components-loader',
  name: 'Loader',
  path: './stories/Utilities/Loader/Loader.stories.jsx',
  reactDocgen: { props: { label: { type: { name: 'string' } } } },
};
const tag = {
  id: 'components-tag',
  name: 'Tag',
  path: './stories/Components/Tag/Tag.stories.jsx',
};

test('QA routes stay in raw metadata but cannot enter catalog output or coverage', () => {
  const raw = { 'quality-motion': qualityMotion, loader, tag };
  const selected = selectPublishedComponents(raw);

  expect(selected).toEqual({ loader, tag });
  expect(propTypesCoverage(selected)).toEqual({
    total: 2,
    documented: 1,
    percent: 50,
  });
  // Selection does not erase the Storybook-only routes or mutate source data.
  expect(raw['quality-motion']).toBe(qualityMotion);
  expect(raw['quality-motion'].stories).toHaveLength(2);
  expect(selected.loader).toBe(loader);
});

test('the source namespace, rather than a display name, identifies QA fixtures', () => {
  const ordinary = {
    ...tag,
    id: 'components-quality-label',
    name: 'Quality label',
  };
  const fixture = {
    ...qualityMotion,
    id: 'regression-loading',
    path: 'stories/Quality/Motion/Motion.stories.jsx',
  };
  expect(selectPublishedComponents({ ordinary, fixture })).toEqual({
    ordinary,
  });
});

test('ordinary story-only documentation and missing paths keep existing classification', () => {
  const documentation = {
    id: 'example-page-template-example',
    name: 'Page template',
  };
  expect(selectPublishedComponents({ documentation })).toEqual({
    documentation,
  });
  expect(propTypesCoverage({})).toEqual({
    total: 0,
    documented: 0,
    percent: 0,
  });
});
