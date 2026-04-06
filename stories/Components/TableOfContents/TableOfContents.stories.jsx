import React, { useEffect } from 'react';
import TableOfContents from './TableOfContents';
import { mgTableOfContents } from './js/TableOfContentsVanillaJs';

const getCaptionForLocale = locale => {
  switch (locale) {
    case 'english':
      return [
        {
          id: 'section-1',
          text: 'What is the Global Platform for Disaster Risk Reduction?',
        },
        { id: 'section-2', text: 'Who organizes the Global Platform for DRR?' },
        {
          id: 'section-3',
          text: 'What are the objectives of the Global Platform for DRR?',
        },
        {
          id: 'section-4',
          text: 'How does the Global Platform for DRR link to the Sustainable Development Goals and the Paris Agreement?',
        },
        {
          id: 'section-5',
          text: 'What are the linkages between the Global Platform and the Regional Platforms?',
        },
        { id: 'section-6', text: 'What is the Sendai Framework for DRR?' },
      ];
    case 'arabic':
      return [
        {
          id: 'section-1',
          text: 'ما هي المنصة العالمية للحد من مخاطر الكوارث؟',
        },
        {
          id: 'section-2',
          text: 'من ينظم المنصة العالمية للحد من مخاطر الكوارث؟',
        },
        {
          id: 'section-3',
          text: 'ما هي أهداف المنصة العالمية للحد من مخاطر الكوارث؟',
        },
        {
          id: 'section-4',
          text: 'كيف ترتبط المنصة العالمية للحد من مخاطر الكوارث بأهداف التنمية المستدامة واتفاقية باريس؟',
        },
        {
          id: 'section-5',
          text: 'ما هي الروابط بين المنصة العالمية والمنصات الإقليمية؟',
        },
        { id: 'section-6', text: 'ما هو إطار سنداي للحد من مخاطر الكوارث؟' },
      ];

    default:
      return [
        {
          id: 'section-1',
          text: 'What is the Global Platform for Disaster Risk Reduction?',
        },
        { id: 'section-2', text: 'Who organizes the Global Platform for DRR?' },
        {
          id: 'section-3',
          text: 'What are the objectives of the Global Platform for DRR?',
        },
        {
          id: 'section-4',
          text: 'How does the Global Platform for DRR link to the Sustainable Development Goals and the Paris Agreement?',
        },
        {
          id: 'section-5',
          text: 'What are the linkages between the Global Platform and the Regional Platforms?',
        },
        { id: 'section-6', text: 'What is the Sendai Framework for DRR?' },
      ];
  }
};

export default {
  title: 'Components/Table of Contents',
  component: TableOfContents,
  argTypes: {
    showNumbers: { control: 'boolean' },
  },
};

export const List = {
  args: {
    showNumbers: false,
  },
  render: (args, { globals: { locale } }) => {
    const tocData = getCaptionForLocale(locale);
    return <TableOfContents {...args} tocData={tocData} />;
  },
};

export const Numbered = {
  args: {
    showNumbers: true,
  },
  render: (args, { globals: { locale } }) => {
    const tocData = getCaptionForLocale(locale);
    return <TableOfContents {...args} tocData={tocData} />;
  },
};

// Story that scrapes content from the page
export const ScrapedContent = {
  render: () => {
    useEffect(() => {
      const contentElement = document.querySelector('.mg-content');
      const tocElement = document.querySelector('[data-mg-table-of-contents]');
      if (contentElement && tocElement) {
        mgTableOfContents(contentElement, tocElement);
      }
    }, []);

    return (
      <article className="mg-content">
        <h1 id="page-title">Global Platform for Disaster Risk Reduction</h1>
        <p>
          The Global Platform is the world's foremost gathering on reducing
          disaster risk and building the resilience of communities and nations.
        </p>
        <h2 className="mg-table-of-contents--exclude">
          Table of content auto-header is hidden
        </h2>
        <section
          data-mg-table-of-contents
          data-mg-table-of-contents-title="hidden"
          className="mg-table-of-contents"
        ></section>
        <hr />

        <h2 id="about">About the Global Platform</h2>
        <p>
          The Global Platform for Disaster Risk Reduction is a biennial
          multi-stakeholder forum established by the UN General Assembly to
          review progress, share knowledge and discuss the latest developments
          and trends in reducing disaster risk.
        </p>
        <p>
          It was established in 2006 and is convened by the United Nations
          Office for Disaster Risk Reduction (UNDRR). The Global Platform brings
          together governments, UN agencies, international organizations, the
          private sector, civil society and other stakeholders.
        </p>
        <p>
          Participants share experiences and expertise, review the
          implementation of international agreements on disaster risk reduction,
          and identify priorities for action at all levels.
        </p>

        <h2 id="sendai-framework">The Sendai Framework</h2>
        <p>
          The Sendai Framework for Disaster Risk Reduction 2015-2030 was adopted
          at the Third UN World Conference on Disaster Risk Reduction in Sendai,
          Japan, in March 2015. It is the successor instrument to the Hyogo
          Framework for Action 2005-2015.
        </p>
        <p>
          The Framework outlines seven clear targets and four priorities for
          action to prevent new and reduce existing disaster risks. It aims to
          achieve a substantial reduction of disaster risk and losses in lives,
          livelihoods and health.
        </p>
        <p>
          The four priorities are: understanding disaster risk; strengthening
          disaster risk governance; investing in disaster risk reduction for
          resilience; and enhancing disaster preparedness for effective response
          and to build back better in recovery, rehabilitation and
          reconstruction.
        </p>

        <h2 id="climate-link">Climate change and disaster risk reduction</h2>
        <p>
          Climate change is a key driver of disaster risk. Rising temperatures,
          changing precipitation patterns, and more frequent extreme weather
          events are increasing the vulnerability of communities worldwide.
          Integrating climate change adaptation with disaster risk reduction is
          essential for building resilience.
        </p>
        <p>
          The Paris Agreement and the Sendai Framework share common goals in
          reducing vulnerability and building adaptive capacity. Coherent
          implementation of both frameworks can lead to more effective outcomes
          for communities at risk.
        </p>

        <h2 id="excluded-section" className="mg-table-of-contents--exclude">
          Internal notes
        </h2>
        <p>
          This section is excluded from the table of contents with{' '}
          <code>.mg-table-of-contents--exclude</code>.
        </p>

        <h3 id="sub-section">Regional platforms</h3>
        <p>
          This is an H3 heading and is skipped by the table of contents, which
          only collects H2 headings.
        </p>

        <h2 id="sdg-integration">Sustainable Development Goals</h2>
        <p>
          Disaster risk reduction is integral to achieving the Sustainable
          Development Goals. The SDGs recognize that building resilience and
          reducing disaster risk are essential for sustainable development.
          Multiple SDGs reference disaster risk reduction, particularly SDG 1
          (No Poverty), SDG 11 (Sustainable Cities and Communities), and SDG 13
          (Climate Action).
        </p>
        <p>
          Countries are encouraged to align their national disaster risk
          reduction strategies with their SDG implementation plans to ensure
          coherence and maximize the impact of their efforts.
        </p>

        <h2 id="looking-ahead">Looking ahead</h2>
        <p>
          As the world faces increasingly complex and interconnected risks, the
          importance of disaster risk reduction continues to grow. The midterm
          review of the Sendai Framework highlighted both progress made and
          remaining challenges.
        </p>
        <p>
          Future efforts must focus on addressing systemic risk, strengthening
          local-level resilience, leveraging technology and innovation, and
          ensuring that no one is left behind in disaster risk reduction
          efforts.
        </p>
      </article>
    );
  },
};
