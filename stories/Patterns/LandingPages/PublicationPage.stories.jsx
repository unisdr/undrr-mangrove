import React from 'react';
import { LandingPage } from './LandingPages';
import { Hero } from '../../Components/Hero/Hero';
import { StatsCard } from '../../Components/Cards/StatsCard/StatsCard';
import './publication-example.scss';
import '../_shared/pattern-demo.scss';

export default {
  id: 'patterns-landing-pages',
  title: 'Patterns/Content/Publication/Full page',
  component: LandingPage,
  tags: ['!autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    archetype: { control: false },
    locale: { table: { disable: true } },
    id: { table: { disable: true } },
  },
  render: (args, context) => (
    <LandingPage
      key={`${args.archetype}-${context.globals.locale}`}
      {...args}
      locale={context.globals.locale}
      id={context.id}
    />
  ),
};

export const ReportLanding = {
  name: 'Report or publication',
  args: { archetype: 'report' },
};

// Illustrative publication content, not reported disaster-risk statistics.
const publicationHero = overviewId => [
  {
    label: 'Example publication · 2026',
    title: 'Investing in resilient futures',
    summaryText:
      'An example report landing page: keep the evidence readable, the actions clear and the publication identity within the site theme.',
    buttons: [
      { label: 'Read the overview', type: 'Primary', url: `#${overviewId}` },
      {
        label: 'Browse publications',
        type: 'Secondary',
        url: 'https://www.undrr.org/publications',
      },
    ],
  },
];

const publicationStats = [
  { value: '2026', bottomLabel: 'Example edition' },
  { value: '4', bottomLabel: 'Reading sections' },
  { value: 'HTML', bottomLabel: 'Web reading format' },
];

const renderPublication = (reportBrand, id) => {
  const overviewId = `${id}-overview`;
  const statsHeadingId = `${id}-at-a-glance`;
  return (
    <main
      className={`mg-publication-example${reportBrand ? ' mg-publication-example--branded' : ''}`}
    >
      <Hero data={publicationHero(overviewId)} />
      <div className="mg-container mg-demo-shell">
        <section className="mg-demo-band" id={overviewId}>
          <div className="mg-publication-example__intro mg-demo-lede mg-content">
            <h2>Overview</h2>
            <p>
              This is illustrative publication content. In a real report,
              preserve the approved findings, qualifications and sources before
              refining their visual presentation.
            </p>
          </div>
        </section>
        <section className="mg-demo-band" aria-labelledby={statsHeadingId}>
          <h2 id={statsHeadingId}>At a glance</h2>
          <StatsCard
            aria-label="Example publication details"
            variant="compact"
            stats={publicationStats}
          />
        </section>
        <section className="mg-demo-band mg-demo-lede mg-content">
          <h2>Methods and qualifications</h2>
          <p>
            Keep methods, uncertainty and limitations next to the findings they
            qualify. These example details describe the page, not research
            results.
          </p>
        </section>
        <section className="mg-demo-band mg-demo-lede mg-content">
          <h2>Further reading</h2>
          <p>
            <a href="https://www.undrr.org/publications">
              Find UNDRR publications
            </a>{' '}
            for published reports and their source material.
          </p>
        </section>
      </div>
    </main>
  );
};

export const PublicationThemeDefaults = {
  name: 'Publication with theme defaults',
  render: (_args, context) => renderPublication(false, context.id),
};

export const BrandedPublication = {
  name: 'Publication with scoped report branding',
  render: (_args, context) => renderPublication(true, context.id),
};
