import React from 'react';
import Boilerplate from './Boilerplate.jsx';

// This default export determines where your story goes in the story list
export default {
  /* 👇 The title prop is optional.
  * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
  * to learn how to generate automatic titles
  */
  title: 'Example/Boilerplate component',
  component: Boilerplate,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    title: { control: 'text' },
  },
};

// This is a Storybook template function that returns a component story
const Template = (args) => <Boilerplate {...args} />;

// Each story then reuses that template
export const Default = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Default.args = {
  title: 'Boilerplate Component',
  children: <p>This is an example boilerplate component. Need to make a new component? Clone this and replace this content with your own.</p>,
};

// You can add more stories here, each representing a different state or variant of your component
// For example:
// export const Secondary = Template.bind({});
// Secondary.args = {
//   ...Default.args,
//   variant: 'secondary',
// };
