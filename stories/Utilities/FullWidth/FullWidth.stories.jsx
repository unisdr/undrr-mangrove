import React from 'react';
import { FullWidth } from './FullWidth';

export default {
  title: 'Components/FullWidth',
  component: FullWidth,
};

export const DefaultFullWidth = {
  render: args => (
    <div style={{ maxWidth: '500px' }}>
      <FullWidth {...args} />
    </div>
  ),
  args: {
    children: "I'll be made full width",
  },
  name: 'FullWidth',
};
