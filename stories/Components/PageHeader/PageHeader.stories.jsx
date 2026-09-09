import React from 'react';
import { PageHeader } from './PageHeader';

export default {
  title: 'Components/PageHeader',
  component: PageHeader,
  argTypes: {
    variant: {
      options: ['default', 'decoration-only'],
      control: { type: 'radio' },
    },
    logoUrl: { control: 'text' },
    logoAlt: { control: 'text' },
    logoTitle: { control: 'text' },
    homeUrl: { control: 'text' },
    languages: { control: 'object' },
  },
};

export const Default = {
  args: {
    variant: 'default',
  },
};

export const DecorationOnly = {
  args: {
    variant: 'decoration-only',
  },
};

export const WithCustomLanguages = {
  args: {
    variant: 'default',
    languages: [
      { value: 'ch', label: 'Cheese speak', selected: true },
      { value: 'es', label: 'Español' },
      { value: 'fr', label: 'Français' },
      { value: 'ar', label: 'العربية' },
    ],
  },
};

export const WithCustomClass = {
  args: {
    variant: 'default',
    className: 'custom-header-class',
  },
};

export const NarrowHeader = {
  name: 'Narrow header',
  render: args => (
    <div style={{ width: '320px', maxWidth: '100%' }}>
      <PageHeader {...args} />
    </div>
  ),
  args: {
    languages: [
      { value: 'en', label: 'English', selected: true },
      { value: 'ar', label: 'العربية' },
    ],
  },
};
