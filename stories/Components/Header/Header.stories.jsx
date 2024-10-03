import React from "react";
import Header from "./Header";

// Mock Data for Menu Sections
const sections = [
  {
    bannerHeading: "Section 1",
    bannerDescription: "Description for section 1",
    items: [
      {
        title: "Item 1",
        url: "#",
        subItems: [
          { title: "Sub Item 1.1", url: "#" },
          { title: "Sub Item 1.2", url: "#" },
        ],
      },
      {
        title: "Item 2",
        url: "#",
        subItems: [
          { title: "Sub Item 2.1", url: "#" },
          { title: "Sub Item 2.2", url: "#" },
        ],
      },
    ],
  },
  {
    bannerHeading: "Section 2",
    bannerDescription: "Description for section 2",
    items: [
      {
        title: "Item 3",
        url: "#",
        subItems: [
          { title: "Sub Item 3.1", url: "#" },
          { title: "Sub Item 3.2", url: "#" },
        ],
      },
      {
        title: "Item 4",
        url: "#",
        subItems: [
          { title: "Sub Item 4.1", url: "#" },
          { title: "Sub Item 4.2", url: "#" },
        ],
      },
    ],
  },
];

export default {
  title: "Components/Header",
  component: Header,
  argTypes: {
    title: {
      control: {
        type: "text",
      },
      description: "Title text displayed in the header",
      defaultValue: "Website Title",
    },
    sections: {
      control: "object",
      description: "The sections and items to be displayed in the MegaMenu",
    },
  },
};

const Template = (args) => <Header {...args} />;

// Default Story (with mocked data)
export const Default = Template.bind({});
Default.args = {
  title: "Website Title",
  sections,
};

// Story with Custom Title
// export const CustomTitle = Template.bind({});
// CustomTitle.args = {
//   title: "Custom Website Title",
//   sections,
// };

// Story with Single Section
// export const SingleSection = Template.bind({});
// SingleSection.args = {
//   title: "Single Section Site",
//   sections: [sections[0]],
// };
