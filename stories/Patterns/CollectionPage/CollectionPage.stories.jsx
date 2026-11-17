import React from 'react';
import { CollectionPage } from './CollectionPage';
import '../_shared/pattern-demo.scss';

export default {
  id: 'patterns-collection-page',
  title: 'Patterns/Content/Collection/Full page/Curated collection',
  component: CollectionPage,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    collection: { control: false },
    itemCount: { control: false },
    syncUrl: { table: { disable: true } },
    dir: { table: { disable: true } },
    id: { table: { disable: true } },
  },
  // Only the canvas of a single story writes to the URL hash: a docs page
  // holds several examples, and one widget per page may sync.
  render: (args, context) => (
    <CollectionPage
      key={args.collection}
      {...args}
      syncUrl={context.viewMode === 'story'}
      dir={context.globals.locale === 'arabic' ? 'rtl' : undefined}
      id={context.id}
    />
  ),
};

export const Typical = {
  name: 'Collection page',
  args: { collection: 'wildfire' },
};

export const ShortDescription = {
  name: 'Short description',
  args: { collection: 'jasper' },
};

export const LongDescription = {
  name: 'Long description',
  args: { collection: 'japan' },
};

export const NoSummary = {
  name: 'No summary',
  args: { collection: 'planned' },
};

export const NoItemsYet = {
  name: 'No items yet',
  args: { collection: 'empty', itemCount: 0 },
};
