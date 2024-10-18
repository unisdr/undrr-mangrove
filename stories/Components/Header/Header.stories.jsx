import React from "react";
import Header from "./Header";

// Mock Data for Menu Sections
const sections = [
  {
    title: 'Data',
    bannerHeading: 'Data management',
    bannerDescription: '',
    classes: '',
    icon: 'icons/information_outline.svg#information',
    items: [
      {
        title: "Records",
        url: "#",
        icon: '',
        subItems: [
          {
            title: "View records",
            url: "#",
            subsubItems: [
              {
                title: "View all records",
                url: "#",
              },
              {
                title: "Add record",
                url: "#",
              },
              {
                title: "Import record",
                url: "#",
              },
              {
                title: "View imported records",
                url: "#",
              },
              {
                title: "[Instance-name] created records",
                url: "#",
              },
              {
                title: "Records for hydro-met events",
                url: "#",
              },
            ],
          },
          {
            title: "Manage records",
            url: "#",
            subsubItems: [
              {
                title: "Edit record",
                url: "#",
              },
              {
                title: "Import records",
                url: "#",
              },
              {
                title: "Validate record",
                url: "#",
              },
              {
                title: "Publish record",
                url: "#",
              },
            ],
          },
          {
            title: "Understanding Records",
            url: "#",
            subsubItems: [
              {
                title: "What are records?",
                url: "#",
              },
              {
                title: "About the DLDT methodology",
                url: "#",
              },
            ],
          },
          {
            title: "Help and how-to",
            url: "#",
            subsubItems: [
              {
                title: "Adding and editing records help",
                url: "#",
              },
              {
                title: "How to import records",
                url: "#",
              },
            ],
          },
        ],
      },
      {
        title: "Events",
        url: "#",
        icon: '',
        subItems: [
          {
            title: "View all events",
            url: "#",
            subsubItems: [
              {
                title: "Add event",
                url: "#",
              },
              {
                title: "Import event",
                url: "#",
              },
              {
                title: "Hydrological events",
                url: "#",
              },
              {
                title: "Meteorological events",
                url: "#",
              },
              {
                title: "Hydro-met events (combined list)",
                url: "#",
              },
              {
                title: "Climatological events",
                url: "#",
              },
              {
                title: "Biological events",
                url: "#",
              },
              {
                title: "Extraterrestrial events",
                url: "#",
              },
              {
                title: "Geophysical events",
                url: "#",
              },
            ],
          },
          {
            title: "Understanding events",
            url: "#",
            subsubItems: [
              {
                title: "What are events?",
                url: "#",
              },
              {
                title: "What are hazards?",
                url: "#",
              },
              {
                title: "Hydro-met events and WMO-CHE ID numbers",
                url: "#",
              },
            ],
          },
          {
            title: "Help and how-to",
            url: "#",
            subsubItems: [
              {
                title: "Adding and editing events help",
                url: "#",
              },
              {
                title: "Preventing duplicate events",
                url: "#",
              },
              {
                title: "How to import events",
                url: "#",
              },
            ],
          },
        ],
      },
      {
        title: "Exports",
        url: "#",
        icon: '',
        subItems: [
          {
            title: "Exports",
            url: "#",
            subsubItems: [
              {
                title: "Create export",
                url: "#",
              },
            ],
          },
          {
            title: "Help and how-to",
            url: "#",
            subsubItems: [
              {
                title: "Adding and editing baseline data",
                url: "#",
              },
              {
                title: "How to import baseline data",
                url: "#",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    title: 'Analysis',
    bannerHeading: 'Analysis',
    bannerDescription: '',
    classes: '',
    icon: 'icons/eye-show-password.svg#eye-show',
    items: [
      {
        title: "Impact by hazard type",
        url: "#",
        icon: '',
        subItems: [
          {
            title: "Hazards",
            url: "#",
            subsubItems: [
              {
                title: "View all hazards",
                url: "#",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    title: 'About',
    bannerHeading: 'About',
    bannerDescription: '',
    classes: '',
    icon: 'icons/help-outline.svg#help-outline',
    items: [
      {
        title: "General",
        url: "#",
        icon: '',
        subItems: [
          {
            title: "General",
            url: "#",
            subsubItems: [
              {
                title: "General about",
                url: "#",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    title: 'Settings',
    bannerHeading: 'Settings',
    bannerDescription: '',
    classes: '',
    icon: 'icons/settings.svg#settings',
    items: [
      {
        title: "Access management",
        url: "#",
        icon: '',
        subItems: [
          {
            title: "Users",
            url: "#",
            subsubItems: [
              {
                title: "View all users",
                url: "#",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    title: 'Log in',
    bannerHeading: '',
    bannerDescription: '',
    classes: 'dts-log-in',
    icon: 'icons/user-profile.svg#user',
  },
  {
    title: '',
    bannerHeading: '',
    bannerDescription: '',
    classes: 'dts-user-menu',
    icon: 'icons/user-profile.svg#user',
    items: [
      {
        title: "My account",
        url: "#",
        icon: 'icons/user-profile.svg#user',
        subItems: [
          {
            title: "",
            url: "#",
            subsubItems: [
              {
                title: "",
                url: "#",
              },
            ],
          },
        ],
      },
      {
        title: "Log out",
        url: "#",
        icon: 'icons/logout.svg#logout',
        subItems: [
          {
            title: "",
            url: "#",
            subsubItems: [
              {
                title: "",
                url: "#",
              },
            ],
          },
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
