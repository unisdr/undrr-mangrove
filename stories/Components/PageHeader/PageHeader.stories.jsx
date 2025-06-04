import React from 'react';
import { PageHeader } from './PageHeader';

export default {
  title: 'Components/PageHeader',
  component: PageHeader,
  argTypes: {
    variant: {
      options: ['default', 'decoration-only'],
      control: { type: 'radio' }
    },
    logoUrl: { control: 'text' },
    logoAlt: { control: 'text' },
    logoTitle: { control: 'text' },
    homeUrl: { control: 'text' },
    languages: { control: 'object' }
  },
};

const Template = (args) => <PageHeader {...args} />;

export const Default = Template.bind({});
Default.args = {
  variant: 'default',
};

export const DecorationOnly = Template.bind({});
DecorationOnly.args = {
  variant: 'decoration-only',
};

export const WithCustomLanguages = Template.bind({});
WithCustomLanguages.args = {
  variant: 'default',
  languages: [
    { value: 'ch', label: 'Cheese speak', selected: true },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'ar', label: 'العربية' }
  ]
};

export const WithCustomClass = Template.bind({});
WithCustomClass.args = {
  variant: 'default',
  className: 'custom-header-class',
}; 