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
    surface: {
      control: 'inline-radio',
      options: ['primary', 'secondary', 'tertiary', 'detached'],
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
    actions: [
      { label: 'Open the Monitor', url: 'https://sendaimonitor.undrr.org/' },
      { label: 'Reporting guidance', url: '#reporting', type: 'Secondary' },
    ],
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
      s.label === 'Reporting' ? { ...s, ancestor: true } : s
    ),
  },
};

export const Detached = {
  args: {
    variant: 'expressive',
    surface: 'detached',
    title: 'How to report',
    summary:
      'Prepare and review a national report. Work through the guidance with the people who collect and validate your data.',
    media: {
      src: 'https://www.undrr.org/sites/default/files/2023-11/resilient-infrastructure-pikoso-kz-shutterstock.jpg',
      alt: '',
    },
    sections: sections.map(s =>
      s.label === 'Reporting' ? { ...s, ancestor: true } : s
    ),
  },
};

export const SecondarySurface = {
  name: 'Secondary surface',
  args: {
    variant: 'expressive',
    surface: 'secondary',
    title: 'How to report',
    summary:
      'Prepare and review a national report. Work through the guidance with the people who collect and validate your data.',
    sections: sections.map(s =>
      s.label === 'Reporting' ? { ...s, ancestor: true } : s
    ),
  },
};

export const Compact = {
  args: {
    variant: 'compact',
    sections: sections.map(s =>
      s.label === 'Reporting' ? { ...s, ancestor: true } : s
    ),
  },
};
