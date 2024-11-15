import React, { useEffect } from 'react';
import TableOfContents from "./TableOfContents";
import { mgTableOfContents } from './js/TableOfContentsVanillaJs';

const getCaptionForLocale = (locale) => {
  switch (locale) {
    case "english":
      return [
        {
          id: "section-1",
          text: "What is the Global Platform for Disaster Risk Reduction?",
        },
        { id: "section-2", text: "Who organizes the Global Platform for DRR?" },
        {
          id: "section-3",
          text: "What are the objectives of the Global Platform for DRR?",
        },
        {
          id: "section-4",
          text: "How does the Global Platform for DRR link to the Sustainable Development Goals and the Paris Agreement?",
        },
        {
          id: "section-5",
          text: "What are the linkages between the Global Platform and the Regional Platforms?",
        },
        { id: "section-6", text: "What is the Sendai Framework for DRR?" },
      ];
    case "arabic":
      return [
        {
          id: "section-1",
          text: "ما هي المنصة العالمية للحد من مخاطر الكوارث؟",
        },
        {
          id: "section-2",
          text: "من ينظم المنصة العالمية للحد من مخاطر الكوارث؟",
        },
        {
          id: "section-3",
          text: "ما هي أهداف المنصة العالمية للحد من مخاطر الكوارث؟",
        },
        {
          id: "section-4",
          text: "كيف ترتبط المنصة العالمية للحد من مخاطر الكوارث بأهداف التنمية المستدامة واتفاقية باريس؟",
        },
        {
          id: "section-5",
          text: "ما هي الروابط بين المنصة العالمية والمنصات الإقليمية؟",
        },
        { id: "section-6", text: "ما هو إطار سنداي للحد من مخاطر الكوارث؟" },
      ];

    default:
      return [
        {
          id: "section-1",
          text: "What is the Global Platform for Disaster Risk Reduction?",
        },
        { id: "section-2", text: "Who organizes the Global Platform for DRR?" },
        {
          id: "section-3",
          text: "What are the objectives of the Global Platform for DRR?",
        },
        {
          id: "section-4",
          text: "How does the Global Platform for DRR link to the Sustainable Development Goals and the Paris Agreement?",
        },
        {
          id: "section-5",
          text: "What are the linkages between the Global Platform and the Regional Platforms?",
        },
        { id: "section-6", text: "What is the Sendai Framework for DRR?" },
      ];
  }
};

export default {
  title: "Components/Table of Contents",
  component: TableOfContents,
  argTypes: {
    showNumbers: { control: "boolean" },
  },
};

const Template = (args, { globals: { locale } }) => {
  const tocData = getCaptionForLocale(locale);
  return <TableOfContents {...args} tocData={tocData} />;
};

export const List = Template.bind({});
List.args = {
  showNumbers: false,
};

export const Numbered = Template.bind({});
Numbered.args = {
  showNumbers: true,
};

// New story that scrapes content from the page
export const ScrapedContent = () => {
  useEffect(() => {
    // Assuming mgTableOfContents is a function that scrapes the content
    const contentElement = document.querySelector('.mg-content');
    const tocElement = document.querySelector('[data-mg-table-of-contents]');
    if (contentElement && tocElement) {
      mgTableOfContents(contentElement, tocElement);
    }
  }, []);

  return (
    <article className="mg-content">
      <h1 id="section-1">Welcome to the example</h1>
      <p>The above header is excluded as it is the H1</p>
      <h2 class="mg-table-of-contents--exclude">Table of content auto-header is hidden</h2>
      <section data-mg-table-of-contents data-mg-table-of-contents-title="hidden" className="mg-table-of-contents">
      </section>
      <hr></hr>
      <h2 id="section-2">Section 2</h2>
      <p>Content for section 2...</p>
      <h2 id="section-3">Section 3</h2>
      <p>Content for section 3...</p>
      <h2 id="section-4" className="mg-table-of-contents--exclude">Section 4</h2>
      <p>excluded with .mg-table-of-contents--exclude</p>        
      <h3 id="section-5">Sub-section 5</h3>
      <p>Skipped as it is a h3</p>
      <h2 id="section-6">Section 6</h2>
      <p>Content for section 6...</p>
    </article>
  );
};