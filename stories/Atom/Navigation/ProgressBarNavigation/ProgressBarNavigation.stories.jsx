import { ProgressBarNavigation } from "./ProgressBarNavigation";

export default {
  title: "Components/Navigation/Progress bar",

  argTypes: {
    Type: {
      options: ["Large", "Small"],

      control: {
        type: "inline-radio",
      },

      defaultValue: "Large",
    },

    Colors: {
      options: ["yellow", "red", "green", "blue"],

      control: {
        type: "inline-radio",
      },

      defaultValue: "yellow",
    },
  },
};

export const DefaultProgressBar = {
  render: (args) => {
    return <ProgressBarNavigation {...args}></ProgressBarNavigation>;
  },

  name: "Progress bar",

  parameters: {
    layout: "fullscreen",

    docs: {
      inlineStories: false,
    },
  },
};
