import React from 'react';

// Import your components
import Header from "../Header/Header";
import { Footer } from "../../Organism/Footer/Footer";

// Define the Page Template Example component
const PageTemplateDts = () => {
  return (
    <div className="page-template-example | mg-container mg-container--spacer">
      {/* <Header title="Page Title" /> */}
      <Header title="Page Title" sections={[
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
        }
      ]} />
      <Footer />
    </div>
  );
};

// Define the default export for the story
export default {
  title: 'Page Template Example',
  component: PageTemplateDts,
};

// Define the story
export const Default = () => <PageTemplateDts />;