import React from 'react';
import { FeaturePromo } from './FeaturePromo';

const SAMPLE_IMAGE = 'https://picsum.photos/1200/800';

export default {
  title: 'Components/FeaturePromo',
  component: FeaturePromo,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'quaternary'],
    },
    headlineLevel: {
      control: 'select',
      options: [2, 3, 4, 5, 6],
    },
  },
};

const baseArgs = {
  image: SAMPLE_IMAGE,
  imageAlt:
    'Scientists examine flood damage data on a laptop in a field setting',
  heading: 'Global Assessment Report on Disaster Risk Reduction 2024',
  summary:
    'Early warning systems are one of the most effective tools for reducing disaster risk. Countries with such systems experience eight times fewer deaths from disasters.',
  ctaLabel: 'Read the report',
  ctaUrl: '/publications/global-assessment-report',
};

export const Primary = {
  args: {
    ...baseArgs,
    variant: 'primary',
  },
};

export const Secondary = {
  args: {
    ...baseArgs,
    variant: 'secondary',
    heading: 'Sendai Framework Progress Report',
    summary:
      'Tracking implementation of the Sendai Framework for Disaster Risk Reduction across 195 member states.',
    ctaLabel: 'View the progress',
    ctaUrl: '/sendai-framework/progress',
  },
};

export const Tertiary = {
  args: {
    ...baseArgs,
    variant: 'tertiary',
    heading: 'Making Cities Resilient 2030',
    summary:
      'A global initiative supporting local governments in reducing urban disaster risk and building resilient communities.',
    ctaLabel: 'Join the initiative',
    ctaUrl: '/mcr2030',
  },
};

export const Quaternary = {
  args: {
    ...baseArgs,
    variant: 'quaternary',
    heading: 'World Tsunami Awareness Day',
    summary:
      'Each year on 5 November, the international community raises awareness of tsunami risk and best practices for preparedness.',
    ctaLabel: 'Learn more',
    ctaUrl: '/world-tsunami-awareness-day',
  },
};

export const ImageRight = {
  name: 'Image right (reverse)',
  args: {
    ...baseArgs,
    variant: 'primary',
    reverse: true,
  },
};

export const NoSummary = {
  name: 'Without summary',
  args: {
    image: SAMPLE_IMAGE,
    imageAlt: 'An aerial view of a coastal town recovering after a cyclone',
    heading: 'Resilience in the Pacific',
    ctaLabel: 'Explore the region',
    ctaUrl: '/regions/pacific',
    variant: 'primary',
  },
};

export const NoCta = {
  name: 'Without CTA',
  args: {
    image: SAMPLE_IMAGE,
    imageAlt: 'Volunteers distributing relief supplies after a flood',
    heading: 'Community-led Disaster Response',
    summary:
      'Local communities are often the first and most effective responders when disaster strikes.',
    variant: 'secondary',
  },
};

export const ExternalLink = {
  name: 'External CTA link',
  args: {
    ...baseArgs,
    ctaUrl: 'https://www.undrr.org/publications',
    ctaExternal: true,
    variant: 'primary',
  },
};
