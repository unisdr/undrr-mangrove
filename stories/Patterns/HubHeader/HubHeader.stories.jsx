import React from 'react';
import { HubHeader } from './HubHeader';
import './hub-header.scss';

const sections = [
  { label: 'About', href: '#about' },
  { label: 'Indicators', href: '#indicators' },
  { label: 'Reporting', href: '#reporting' },
  { label: 'Reports', href: '#reports' },
  { label: 'Data', href: '#data' },
];

export default {
  title: 'Example/Hub header',
  component: HubHeader,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    background: {
      control: 'inline-radio',
      options: ['none', 'primary', 'secondary', 'tertiary'],
    },
  },
  args: {
    name: 'Sendai Framework Monitor',
    nameHref: '#overview',
    navLabel: 'Sendai Framework Monitor sections',
    sections,
  },
  render: args => (
    <div className="mg-container">
      <HubHeader {...args} />
    </div>
  ),
};

export const Expressive = {
  args: {
    variant: 'expressive',
    nameCurrent: true,
    title: 'Tracking progress towards a more resilient world',
    summary:
      'Understand disaster risk, follow progress and find guidance for reporting against the Sendai Framework.',
    media: {
      src: 'https://www.undrr.org/sites/default/files/2023-11/resilient-infrastructure-pikoso-kz-shutterstock.jpg',
      alt: '',
    },
  },
};

export const ExpressiveWithoutMedia = {
  name: 'Expressive without media',
  args: {
    variant: 'expressive',
    title: 'How to report',
    summary:
      'Prepare and review a national report. Work through the guidance with the people who collect and validate your data.',
    sections: sections.map(s =>
      s.label === 'Reporting' ? { ...s, current: 'location' } : s
    ),
  },
};

export const UnifiedWithBanner = {
  name: 'Unified with the banner',
  args: {
    variant: 'expressive',
    background: 'primary',
    nameCurrent: true,
    title: 'Tracking progress towards a more resilient world',
    summary:
      'Understand disaster risk, follow progress and find guidance for reporting against the Sendai Framework.',
    media: {
      src: 'https://www.undrr.org/sites/default/files/2023-11/resilient-infrastructure-pikoso-kz-shutterstock.jpg',
      alt: '',
    },
  },
};

export const CompactOnColour = {
  name: 'Compact on a colour',
  args: {
    variant: 'compact',
    background: 'secondary',
    sections: sections.map(s =>
      s.label === 'Reporting' ? { ...s, current: 'location' } : s
    ),
  },
};

export const Compact = {
  args: {
    variant: 'compact',
    sections: sections.map(s =>
      s.label === 'Reporting' ? { ...s, current: 'location' } : s
    ),
  },
};
