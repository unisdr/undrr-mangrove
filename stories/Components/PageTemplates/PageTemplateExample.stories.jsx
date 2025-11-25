import React, { useEffect } from 'react';

/**
 * UNDRR Required Scripts
 *
 * All UNDRR production pages should include these scripts before </body>:
 *
 * <!-- UNDRR Analytics - GA4 bootstrap and enhancements -->
 * <script
 *   src="https://assets.undrr.org/static/analytics/v1.0.0/google_analytics_enhancements.js"
 *   defer
 * ></script>
 *
 * <!-- UNDRR Critical Messaging - emergency broadcasts -->
 * <script src="https://messaging.undrr.org/src/undrr-messaging.js" defer></script>
 *
 * Optional: Add a container for message placement:
 * <div class="mg-critical-messaging"></div>
 *
 * See documentation:
 * - Analytics: /?path=/docs/getting-started-analytics-enhancements--docs
 * - Messaging: /?path=/docs/getting-started-critical-messaging--docs
 */

// Import your components
import MegaMenu from '../MegaMenu/MegaMenu';
import { Hero } from '../Hero/Hero';
import { Tab } from '../Tab/Tab';
import { VerticalCard } from '../Cards/Card/VerticalCard';
import { Footer } from '../Footer/Footer';
import { PageHeader } from '../PageHeader/PageHeader';
import CookieConsentBanner from '../CookieConsentBanner/CookieConsentBanner';
import { mgTableOfContents } from '../TableOfContents/js/TableOfContentsVanillaJs';

const sampleHeroData = [
  {
    title: 'Custom title<br>with&nbsp;line breaks and spaces',
    summaryText: 'This is custom summary text.<br>&nbsp;Another line.',
    label: 'Custom Label',
    detail: 'Custom Detail',
    primary_button: 'Custom primary',
    secondary_button: 'Custom secondary',
    link: '/#',
    imgback:
      'https://www.undrr.org/sites/default/files/2020-01/Home---about-us_0.jpg',
  },
];

const sampleTabData = [
  {
    text: 'Tab title 1',
    text_id: 'tab-1',
    data: 'As the UN Office for Disaster Risk Reduction, UNDRR convenes partners and coordinates activities to create safer, more resilient communities.',
  },
  {
    text: 'Tab title 2',
    text_id: 'tab-2',
    data: 'The Sendai Framework is the global roadmap for reducing human and economic loss as a direct result of disasters.',
    is_default: 'true',
  },
  {
    text: 'Tab title 3 i am a bit longer and on and on',
    text_id: 'tab-3',
    data: 'Midterm Review of the Sendai Framework - Register your interest for consultations on the Political Declaration.',
  },
];

const sampleTabDataStacked = [
  {
    text: 'Stacked title 1',
    text_id: 'tab-1-stacked',
    data: 'As the UN Office for Disaster Risk Reduction, UNDRR convenes partners and coordinates activities to create safer, more resilient communities.',
  },
  {
    text: 'Tab title 2',
    text_id: 'tab-2-stacked',
    data: 'The Sendai Framework is the global roadmap for reducing human and economic loss as a direct result of disasters.',
    is_default: 'true',
  },
  {
    text: 'Tab title 3 i am a bit longer and on and on',
    text_id: 'tab-3-stacked',
    data: 'Midterm Review of the Sendai Framework - Register your interest for consultations on the Political Declaration.',
  },
];

const sampleCardContent = [
  {
    contenttile: 'CONTENT TAG',
    title: 'Title in large size',
    summaryText: `Climate change is a <a href="#" class="mg-card__text-link">global health emergency</a>, with impacts felt most acutely
  by vulnerable populations and communities.This paper explores health risks from climate change in a global context, setting out key risks actions`,
    label1: 'Label 1',
    label2: 'Label 2',
    button: 'Primary action',
    link: 'javascript:void(0)',
    imgalt: 'A person looks on',
    imgback:
      'https://www.undrr.org/sites/default/files/2020-01/Home---about-us_0.jpg',
  },
];

const sampleMegaMenuSections = [
  {
    title: 'Section 1',
    bannerHeading: 'Analytics by country',
    bannerDescription: 'Gaze upon statistics in wonder...',
    items: [
      {
        title: 'Item 1',
        items: Array(30).fill({ title: 'Sub-item 1', url: '#' }),
      },
      {
        title: 'Item 2',
        items: Array(20).fill({ title: 'Sub-item 2', url: '#' }),
      },
    ],
  },
  {
    title: 'Section 2',
    bannerHeading: 'Analytics by region',
    bannerDescription: 'Gaze upon statistics in wonder...',
    items: [
      {
        title: 'Item 1',
        items: Array(20).fill({ title: 'Sub-item 1', url: '#' }),
      },
      {
        title: 'Item 2',
        items: Array(15).fill({ title: 'Sub-item 2', url: '#' }),
      },
    ],
  },
];

// Define the Page Template Example component
const PageTemplateExample = () => {
  useEffect(() => {
    // Initialize table of contents
    const contentElement = document.querySelector('.page-template-example');
    const tocElement = document.querySelector('[data-mg-table-of-contents]');
    if (contentElement && tocElement) {
      mgTableOfContents(contentElement, tocElement);
    }

    // Load UNDRR Analytics script
    const analyticsScript = document.createElement('script');
    analyticsScript.src =
      'https://assets.undrr.org/static/analytics/v1.0.0/google_analytics_enhancements.js';
    analyticsScript.defer = true;
    document.body.appendChild(analyticsScript);

    // Load UNDRR Critical Messaging script
    const messagingScript = document.createElement('script');
    messagingScript.src = 'https://messaging.undrr.org/src/undrr-messaging.js';
    messagingScript.defer = true;
    document.body.appendChild(messagingScript);

    // Cleanup on unmount
    return () => {
      if (analyticsScript.parentNode) {
        analyticsScript.parentNode.removeChild(analyticsScript);
      }
      if (messagingScript.parentNode) {
        messagingScript.parentNode.removeChild(messagingScript);
      }
    };
  }, []);
  return (
    <>
      <PageHeader />
      {/* Critical messaging container - messages will appear here */}
      <div className="mg-critical-messaging"></div>
      <CookieConsentBanner />
      <MegaMenu delay={600} sections={sampleMegaMenuSections} />
      <div className="page-template-example | mg-container mg-container--spacer">
        <Hero data={sampleHeroData} variant="primary" />
        <div className="mg-container-full-width mg-container--padded mg-u-background-color--neutral-25">
          <section className="mg-grid mg-grid__col-3">
            <VerticalCard data={sampleCardContent} />
            <VerticalCard data={sampleCardContent} />
            <VerticalCard data={sampleCardContent} />
          </section>
        </div>
        <section className="content-section">
          <section className="mg-grid mg-grid__col-3">
            <div className="mg-grid__col--span-2">
              <h2>Understanding the importance of data</h2>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus
                lacinia odio vitae vestibulum vestibulum. Cras venenatis euismod
                malesuada.{' '}
                <a href="#mg-tabs__section-tab-3">Deep link to a tab</a>
              </p>
              <h3 id="section-benefits">Key benefits of data analysis</h3>
              <ul>
                <li>Improved decision-making</li>
                <li>Increased efficiency</li>
                <li>Enhanced customer insights</li>
              </ul>
            </div>
            <aside>
              <section
                data-mg-table-of-contents
                data-mg-table-of-contents-title="On this page"
                className="mg-table-of-contents"
              ></section>
            </aside>
          </section>
          <hr />
          <h4>Further reading</h4>
          <p>
            For more information, visit our{' '}
            <a href="https://example.com">detailed guide on data analysis</a>.
          </p>
          <h3 id="challenges-in-data-management">
            Challenges in data management
          </h3>
          <p>
            Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
            nisi ut aliquip ex ea commodo consequat.
          </p>
          <ol>
            <li>Data privacy concerns</li>
            <li>Integration of diverse data sources</li>
            <li>Ensuring data quality</li>
          </ol>
        </section>
        <Tab tabdata={sampleTabData} />
        <Tab tabdata={sampleTabDataStacked} variant={'stacked'} />
        <h2>Sample header</h2>
        <p>Sample paragraph</p>
        <Footer />
      </div>
    </>
  );
};

// Define the default export for the story
export default {
  title: 'Example/Page Template Example',
  component: PageTemplateExample,
};

// Define the story
export const Default = {
  render: () => <PageTemplateExample />,
  parameters: {
    layout: 'fullscreen',
  },
};
