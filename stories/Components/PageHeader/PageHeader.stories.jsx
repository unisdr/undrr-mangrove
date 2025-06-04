import React from 'react';
import { PageHeader } from './PageHeader';

export default {
  title: 'Components/PageHeader',
  component: PageHeader,
  argTypes: {
    variant: {
      options: ['default'],
      control: { type: 'radio' }
    }
  },
};

const Template = (args) => <PageHeader {...args} />;

export const Default = Template.bind({});
Default.args = {
  variant: 'default',
};

export const WithCustomClass = Template.bind({});
WithCustomClass.args = {
  variant: 'default',
  className: 'custom-header-class',
}; 