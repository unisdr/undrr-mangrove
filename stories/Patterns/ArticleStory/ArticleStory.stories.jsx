import React from 'react';
import { ArticleStory } from './ArticleStory';
import '../_shared/pattern-demo.scss';

export default {
  title: 'Patterns/Article story',
  component: ArticleStory,
  parameters: { layout: 'fullscreen' },
  args: { imageProminence: 'large', heroImage: 'main' },
  argTypes: {
    imageProminence: {
      control: 'inline-radio',
      options: ['large', 'compact', 'split'],
    },
    heroImage: {
      control: 'inline-radio',
      options: ['main', 'alternate', 'none'],
    },
    locale: { table: { disable: true } },
  },
  render: (args, context) => (
    <ArticleStory {...args} locale={context.globals.locale} />
  ),
};

export const LargeImage = {
  name: 'Large, prominent image',
  args: { imageProminence: 'large', heroImage: 'main' },
};

export const CompactImage = {
  name: 'Compact image in the reading column',
  args: { imageProminence: 'compact', heroImage: 'main' },
};

export const NoHeroImage = {
  name: 'No image on the article page',
  args: { imageProminence: 'large', heroImage: 'none' },
};

export const AlternateHeroImage = {
  name: 'Different image than the teaser',
  args: { imageProminence: 'large', heroImage: 'alternate' },
};

export const SplitHero = {
  name: 'Split hero (text and image side by side)',
  args: { imageProminence: 'split', heroImage: 'main' },
};
