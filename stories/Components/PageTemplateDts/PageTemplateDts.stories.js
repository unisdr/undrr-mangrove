import React from 'react';

// Import your components
import Header from "../Header/Header";
import { Footer } from "../../Organism/Footer/Footer";

// Define the Page Template Example component
const PageTemplateDts = () => {
  return (
      <div className="page-template-example | mg-container mg-container--spacer">
          <Header />
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