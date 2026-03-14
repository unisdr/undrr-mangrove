import React from 'react';
import { PageHeader } from '../PageHeader/PageHeader';
import MegaMenu from '../MegaMenu/MegaMenu';
import { Hero } from '../Hero/Hero';
import { SectionHeader } from '../../Molecules/SectionHeader/SectionHeader';
import { IconCard } from '../Cards/IconCard/IconCard';
import { SyndicationSearchWidget } from '../SyndicationSearchWidget/SyndicationSearchWidget';
import { Footer } from '../Footer/Footer';
import deltaLogo from '../../assets/images/delta-logo-placeholder.svg';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const deltaSections = [
  {
    title: 'DATA',
    icon: 'mg-icon mg-icon-cubes',
    bannerHeading: 'Data management',
    bannerDescription:
      'Collect, manage and share disaster losses and damages data. Track hazardous events and their impacts across sectors and geographic areas.',
    items: [
      {
        title: 'Events and records',
        items: [
          { title: 'Hazardous events', url: '#' },
          { title: 'Disaster events', url: '#' },
          { title: 'Disaster records', url: '#' },
        ],
      },
    ],
  },
  {
    title: 'ANALYSIS',
    icon: 'mg-icon mg-icon-chart-bar',
    bannerHeading: 'Analysis',
    bannerDescription:
      'Explore analytical outputs across sectors, hazards and disaster events to support evidence-based decision-making for risk reduction.',
    items: [
      {
        title: 'Analysis',
        items: [
          { title: 'Sectors', url: '#' },
          { title: 'Hazards', url: '#' },
          { title: 'Disaster events', url: '#' },
        ],
      },
    ],
  },
  {
    title: 'ABOUT',
    icon: 'mg-icon mg-icon-life-ring',
    bannerHeading: 'About us',
    bannerDescription:
      'Learn about the DELTA Resilience system, its methodology, technical specifications and the partners behind the platform.',
    items: [
      {
        title: 'General',
        items: [
          { title: 'About the system', url: '#' },
          { title: 'Technical specifications', url: '#' },
          { title: 'Partners', url: '#' },
          { title: 'Methodologies', url: '#' },
          { title: 'Support', url: '#' },
        ],
      },
    ],
  },
  {
    title: 'SIGN IN',
    icon: 'mg-icon mg-icon-user',
    bannerButton: { url: '#' },
  },
];

const heroData = [
  {
    title:
      'Disaster & Hazardous Events, Losses and Damages Tracking & Analysis',
    summaryText:
      'DELTA Resilience - A toolkit to collect, manage and analyze hazardous event and disaster losses and damages data to support disaster risk reduction.',
    primary_button: 'Log in',
    secondary_button: 'View documentation',
    link: '#',
    imgback:
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1600&q=80',
  },
];

const howItWorksCards = [
  {
    imgback:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80',
    imgalt: 'Data collection',
    imageScale: 'medium',
    title: 'Collect',
    label: 'Data',
    summaryText:
      'Record and link hazardous events with disaster losses and damages data. Systematically track disaster effects across sectors and geographic areas.',
  },
  {
    imgback:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80',
    imgalt: 'Data analysis',
    imageScale: 'medium',
    title: 'Analyze',
    label: 'Analysis',
    summaryText:
      'Record and link hazardous events with disaster losses and damages data. Systematically track disaster effects across sectors and geographic areas.',
  },
  {
    imgback:
      'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=400&q=80',
    imgalt: 'Insights for action',
    imageScale: 'medium',
    title: 'Insights for action',
    label: 'Insights for action',
    summaryText:
      'Produce analytical outputs to support decision-making for prevention, risk reduction, and loss-and-damage actions.',
  },
];

const featureCards = [
  {
    icon: 'mg-icon mg-icon-chart-bar',
    iconColor: '#f4b8a8',
    title: 'Analytics',
    summaryText:
      'From data to decisions - analysis that drives multiple DRR applications, including recovery planning and early warning.',
  },
  {
    icon: 'mg-icon mg-icon-globe',
    iconColor: '#f4b8a8',
    title: 'Monitoring',
    summaryText:
      'Continuous monitoring and tracking of hazardous events and disaster events and their impacts.',
  },
  {
    icon: 'mg-icon mg-icon-file-alt',
    iconColor: '#c0d8e8',
    title: 'Data archiving & integration',
    summaryText:
      'Preserve, connect and enrich your disaster data leveraging exposure, vulnerability and other relevant baseline information.',
  },
  {
    icon: 'mg-icon mg-icon-cubes',
    iconColor: '#b5d8d8',
    title: 'Losses and damages overview',
    summaryText:
      'Analyze losses and damages data per disaster event, per hazard type, per sector, and per geography (coming soon).',
  },
  {
    icon: 'mg-icon mg-icon-lightbulb',
    iconColor: '#f4b8a8',
    title: 'Multi-sector and multi-level disaster data sharing',
    summaryText:
      'A tool to support data sharing and application across sectors and levels of government.',
  },
  {
    icon: 'mg-icon mg-icon-cubes',
    iconColor: '#c0d8e8',
    title: 'Baseline',
    summaryText:
      'Exposure & vulnerability statistical and geospatial data enabling post-disaster change and impact analysis (coming soon).',
  },
];

const syndicationConfig = {
  searchEndpoint: 'https://www.undrr.org/search-endpoint',
  displayMode: 'card',
  resultsPerPage: 3,
  gridColumns: 3,
  defaultQuery: '"DELTA Resilience"',
  defaultSort: 'newest',
  requireImage: true,
  // longevityTiers: ['year', 'longtime', 'always'],
  customFilters: ['type:news'],
  showSearchBox: false,
  showFacets: false,
  showActiveFilters: false,
  showResultsCount: false,
  showSearchTimer: false,
  showPager: false,
};

const ctaHeroData = [
  {
    title: 'Learn more about the system',
    primary_button: 'View Documentation',
    link: '#',
    imgback: '',
  },
];

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

const DeltaLandingPage = () => (
  <>
    <PageHeader showLogo={true} showAccount={false} showLanguage={false} />

    {/* DELTA sub-navigation — MegaMenu branded with mega menu sections */}
    <MegaMenu
      logoSrc={deltaLogo}
      logoAlt="DELTA Resilience"
      logoHref="#"
      sections={deltaSections}
    />

    {/* Hero */}
    <Hero data={heroData} variant="primary" />

    {/* How it works */}
    <div className="mg-container mg-container--spacer">
      <section className="mg-container--padded">
        <div className="mg-u-flex mg-u-align-items-center">
          <SectionHeader headerText="How it works" />
          <a href="#" className="mg-button mg-button-primary mg-u-push-end">
            Learn More
          </a>
        </div>
        <div className="mg-grid mg-grid__col-3">
          {howItWorksCards.map((card, i) => (
            <IconCard key={i} data={[card]} />
          ))}
        </div>
      </section>

      {/* Key Features */}
      <section className="mg-container--padded">
        <div className="mg-u-flex mg-u-align-items-center">
          <SectionHeader headerText="Key Features" />
          <a href="#" className="mg-button mg-button-primary mg-u-push-end">
            Learn More
          </a>
        </div>
        <div className="mg-grid mg-grid__col-3">
          {featureCards.map((card, i) => (
            <IconCard key={i} data={[card]} />
          ))}
        </div>
      </section>

      {/* More from UNDRR — syndicated search cards */}
      <section className="mg-container--padded">
        <div className="mg-u-flex mg-u-align-items-center">
          <SectionHeader headerText="More from UNDRR" />
          <a href="#" className="mg-button mg-button-primary mg-u-push-end">
            Explore Research
          </a>
        </div>
        <SyndicationSearchWidget config={syndicationConfig} />
      </section>
    </div>

    {/* CTA Banner */}
    <Hero data={ctaHeroData} variant="tertiary" />

    {/* DELTA utility footer bar — above the global UNDRR footer */}
    <footer className="mg-footer-bar">
      <div className="mg-container">
        <div className="mg-footer-bar__row">
          <div className="mg-footer-bar__links">
            <strong>DELTA</strong>
            <a href="#">How do I use this data?</a>
            <a href="#">Help</a>
            <a href="#">Report a bug</a>
            <a href="#">Suggest an improvement</a>
            <a href="#">Submit new data</a>
          </div>
        </div>
        <hr className="mg-footer-bar__divider" />
        <div className="mg-footer-bar__row">
          <p className="mg-footer-bar__text">
            Tracking the costs of disasters is a vital step toward risk-informed
            development, and investing in disaster risk reduction.
          </p>
          <div className="mg-footer-bar__links">
            <a href="#">Privacy policy</a>
            <a href="#">Terms and conditions</a>
          </div>
        </div>
      </div>
    </footer>

    {/* UNDRR global footer */}
    <Footer />
  </>
);

export default {
  title: 'Example/DELTA landing page',
  component: DeltaLandingPage,
};

export const Default = {
  render: () => <DeltaLandingPage />,
  parameters: {
    layout: 'fullscreen',
  },
};
