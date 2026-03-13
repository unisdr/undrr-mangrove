import React from 'react';
import { PageHeader } from '../PageHeader/PageHeader';
import { Hero } from '../Hero/Hero';
import { IconCard } from '../Cards/IconCard/IconCard';
import { VerticalCard } from '../Cards/Card/VerticalCard';
import { Footer } from '../Footer/Footer';

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

const blogCards = [
  {
    contenttile: 'Blog',
    title: "From vision to reality: making early warnings 'truly' multi-hazard",
    imgback:
      'https://www.undrr.org/sites/default/files/2020-01/Home---about-us_0.jpg',
    imgalt: 'Early warning systems',
    link: '#',
  },
  {
    contenttile: 'Blog',
    title: "Women's financial empowerment builds climate resilience",
    imgback:
      'https://www.undrr.org/sites/default/files/2020-02/Ecosystems_sm.jpg',
    imgalt: 'Climate resilience',
    link: '#',
  },
  {
    contenttile: 'Blog',
    title: 'The Common Alerting Protocol (CAP)',
    imgback:
      'https://www.undrr.org/sites/default/files/2020-01/Home---PreventionWeb702702702702.jpg',
    imgalt: 'Common Alerting Protocol',
    link: '#',
  },
];

const ctaHeroData = [
  {
    title: 'Learn more about the system',
    primary_button: 'View Documentation',
    link: '#',
    imgback: '',
  },
];

const DeltaLandingPage = () => (
  <>
    <PageHeader />

    {/* DELTA sub-navigation */}
    <nav
      className="mg-container mg-container--spacer"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1.5rem',
        borderBottom: '1px solid #e6e6e6',
      }}
    >
      <strong>DELTA</strong>
      <div style={{ display: 'flex', gap: '2rem', fontSize: '1.4rem' }}>
        <a href="#" style={{ fontWeight: 'bold' }}>
          HOME
        </a>
        <a href="#">DATA</a>
        <a href="#">ANALYTICS</a>
      </div>
    </nav>

    {/* Hero */}
    <Hero data={heroData} variant="primary" />

    {/* How it works */}
    <div className="mg-container mg-container--spacer">
      <section style={{ padding: '3rem 0' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
          }}
        >
          <h2 style={{ margin: 0 }}>How it works</h2>
          <a href="#" className="mg-button mg-button-primary">
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
      <section style={{ padding: '3rem 0' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
          }}
        >
          <h2 style={{ margin: 0 }}>Key Features</h2>
          <a href="#" className="mg-button mg-button-primary">
            Learn More
          </a>
        </div>
        <div className="mg-grid mg-grid__col-3">
          {featureCards.map((card, i) => (
            <IconCard key={i} data={[card]} />
          ))}
        </div>
      </section>

      {/* More from UNDRR */}
      <section style={{ padding: '3rem 0' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
          }}
        >
          <h2 style={{ margin: 0 }}>More from UNDRR</h2>
          <a href="#" className="mg-button mg-button-primary">
            Explore Research
          </a>
        </div>
        <section className="mg-grid mg-grid__col-3">
          {blogCards.map((card, i) => (
            <VerticalCard key={i} data={[card]} />
          ))}
        </section>
      </section>
    </div>

    {/* CTA Banner */}
    <Hero data={ctaHeroData} variant="tertiary" />

    {/* Footer */}
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
