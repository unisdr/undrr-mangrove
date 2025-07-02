import React from 'react';

// Import your components
import MegaMenu from '../MegaMenu/MegaMenu';
import { Hero } from '../Hero/Hero';
import { Tab } from '../Tab/Tab';
import { VerticalCard } from '../Cards/Card/VerticalCard';
import { Footer } from '../Footer/Footer';
import { PageHeader } from '../PageHeader/PageHeader';
import CookieConsentBanner from '../CookieConsentBanner/CookieConsentBanner';

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
  return (
    <>
      <PageHeader />
      <CookieConsentBanner />
      <MegaMenu delay={600} sections={sampleMegaMenuSections} />
      <div className="page-template-example | mg-container mg-container--spacer">
        <Hero data={sampleHeroData} variant="primary" />
        <Tab tabdata={sampleTabData} />
        <section className="mg-grid mg-grid__col-3">
          <VerticalCard data={sampleCardContent} />
          <VerticalCard data={sampleCardContent} />
          <VerticalCard data={sampleCardContent} />
        </section>
        <Tab tabdata={sampleTabDataStacked} variant={'stacked'} />
        {/* <Footer /> */}
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
