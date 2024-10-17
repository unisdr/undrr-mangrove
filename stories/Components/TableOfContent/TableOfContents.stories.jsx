import TableOfContents from "./TableOfContents";

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
  title: "Components/TableOfContents",
  component: TableOfContents,
  argTypes: {
    showNumbers: { control: "boolean" },
  },
};

const Template = (args, { globals: { locale } }) => {
  const tocData = getCaptionForLocale(locale);
  return <TableOfContents {...args} tocData={tocData} />;
};

export const Default = Template.bind({});
Default.args = {
  showNumbers: false,
};

export const Numbered = Template.bind({});
Numbered.args = {
  showNumbers: true,
};
