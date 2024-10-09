import React from 'react';
import { Grid } from './Grid';

export default {
  title: 'Design decisions/Grid layout',
  component: Grid,
};

const Template = (args) => <Grid {...args} />;

export const DefaultGrid = Template.bind({});
DefaultGrid.args = {};
