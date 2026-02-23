import React from 'react';
import { Boilerplate } from './Boilerplate';

export default {
  title: 'Example/Boilerplate component',
  component: Boilerplate,
  argTypes: {
    title: { control: 'text' },
    variant: {
      control: { type: 'radio' },
      options: ['primary', 'secondary'],
    },
  },
};

export const Default = {
  args: {
    title: 'Boilerplate component',
    children: (
      <p>
        This is an example boilerplate component. Clone this directory and
        replace the content with your own.
      </p>
    ),
  },
};

export const Secondary = {
  args: {
    ...Default.args,
    variant: 'secondary',
  },
};
