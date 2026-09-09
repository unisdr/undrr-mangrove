import React, { useEffect, useState } from 'react';

/**
 * UNDRR Required Scripts
 *
 * All UNDRR production pages should include these scripts before </body>:
 *
 * <!-- UNDRR Analytics - GA4 bootstrap and enhancements -->
 * <script
 *   src="https://assets.undrr.org/analytics/v1.0.0/google_analytics_enhancements.js"
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
 * - Analytics: /?path=/docs/platform-services-analytics-enhancements--docs
 * - Messaging: /?path=/docs/platform-services-critical-messaging--docs
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
import { SectionHeader } from '../../Molecules/SectionHeader/SectionHeader';
import { IconCard } from '../Cards/IconCard/IconCard';
import { TextCta } from '../TextCta/TextCta';
import ScrollContainer from '../ScrollContainer/ScrollContainer';
import { TableTag } from '../../Atom/Table/Table';
import { TextInput } from '../Forms/TextInput/TextInput';
import { Select } from '../Forms/Select/Select';
import { Checkbox } from '../Forms/Checkbox/Checkbox';
import { Radio } from '../Forms/Radio/Radio';
import { Textarea } from '../Forms/Textarea/Textarea';
import { FormErrorSummary } from '../Forms/FormErrorSummary/FormErrorSummary';
import { FormAction } from '../Forms/FormAction/FormAction';
import { FormGroup } from '../Forms/FormGroup/FormGroup';
import { Pager } from '../Pager/Pager';
import { SyndicationSearchWidget } from '../SyndicationSearchWidget/SyndicationSearchWidget';
import { defaultConfig as searchShowcaseConfig } from '../SyndicationSearchWidget/_storyHelpers';
import deltaLogo from '../../assets/images/delta-logo-placeholder.svg';

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
    media: {
      type: 'image',
      src: 'https://www.undrr.org/sites/default/files/2020-01/Home---about-us_0.jpg',
      alt: 'Dry grassland landscape',
    },
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

const insightCards = [
  {
    contenttile: 'Research brief',
    title: 'Financing resilience before disasters strike',
    summaryText:
      'Explore practical approaches for moving investment from response towards prevention and anticipatory action.',
    label1: '28 August 2026',
    button: 'Read the brief',
    link: '#',
    imgalt: 'A coastal city viewed from above',
    imgback:
      'https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=900&q=80',
  },
  {
    contenttile: 'Data insight',
    title: 'Tracking disaster losses across regions',
    summaryText:
      'Comparable data helps governments identify risk patterns and direct resources.',
    label1: '24 August 2026',
    button: 'Explore the data',
    link: '#',
    imgalt: 'Aerial landscape showing a river and settlements',
    imgback:
      'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=900&q=80',
  },
  {
    contenttile: 'Guidance',
    title: 'Building inclusive early warning systems',
    summaryText:
      'A people-centred approach makes warnings understandable, actionable and accessible to everyone at risk.',
    label1: '18 August 2026',
    button: 'View the guidance',
    link: '#',
    imgalt: 'Community members meeting outdoors',
    imgback:
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&q=80',
  },
  {
    contenttile: 'Case study',
    title: 'Local leadership for heat resilience',
    summaryText:
      'Cities are combining climate information, public health planning and community networks to reduce extreme heat impacts.',
    label1: '12 August 2026',
    button: 'Read the case study',
    link: '#',
    imgalt: 'Dense city buildings seen in warm light',
    imgback:
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=900&q=80',
  },
  {
    contenttile: 'Policy update',
    title: 'Strengthening resilience through national planning',
    summaryText:
      'New policy approaches connect risk reduction targets with climate adaptation, public investment and local delivery.',
    label1: '6 August 2026',
    button: 'Read the update',
    link: '#',
    imgalt: 'People collaborating around a meeting table',
    imgback:
      'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=900&q=80',
  },
];

const topicOptions = [
  { value: 'risk-knowledge', label: 'Risk knowledge' },
  { value: 'early-warning', label: 'Early warning systems' },
  { value: 'resilient-investment', label: 'Resilient investment' },
];

const searchFixture = {
  hits: {
    hits: [
      {
        _id: 'showcase-result-1',
        _source: {
          title: 'Financing resilience before disasters strike',
          url: '#search-result-1',
          type: 'publication',
          field_domain_access: ['www_undrr_org'],
        },
        highlight: {
          body: [
            'Practical approaches for moving investment towards prevention and anticipatory action.',
          ],
        },
      },
      {
        _id: 'showcase-result-2',
        _source: {
          title: 'Tracking disaster losses across regions',
          url: '#search-result-2',
          type: 'data',
          field_domain_access: ['www_undrr_org'],
        },
        highlight: {
          body: [
            'Comparable data helps governments direct resources towards communities most exposed.',
          ],
        },
      },
      {
        _id: 'showcase-result-3',
        _source: {
          title: 'Building inclusive early warning systems',
          url: '#search-result-3',
          type: 'guidance',
          field_domain_access: ['www_undrr_org'],
        },
        highlight: {
          body: [
            'People-centred guidance for warnings that are understandable and actionable.',
          ],
        },
      },
    ],
    total: { value: 24, relation: 'eq' },
  },
  aggregations: {},
  took: 18,
};

const MockedSearchShowcase = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = url =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(
            String(url).includes('preventionweb.net/api')
              ? { results: [] }
              : searchFixture
          ),
      });
    setReady(true);

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  if (!ready) {
    return <p>Preparing search fixture…</p>;
  }

  return (
    <SyndicationSearchWidget
      config={{
        ...searchShowcaseConfig,
        defaultQuery: 'resilience',
        resultsPerPage: 3,
        debounceDelay: 0,
      }}
    />
  );
};

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
  const [showcasePage, setShowcasePage] = useState(3);
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
      'https://assets.undrr.org/analytics/v1.0.0/google_analytics_enhancements.js';
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
        <Hero
          data={sampleHeroData}
          variant="primary"
          layout="split"
          split="1/2"
        />
        <div className="mg-container-full-width mg-container--padded mg-u-background-color--neutral-25">
          <section className="mg-grid mg-grid__col-3">
            {insightCards.slice(0, 3).map(card => (
              <VerticalCard key={card.title} data={[card]} />
            ))}
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
        <section className="mg-container--spacer">
          <SectionHeader
            headerText="Frequently asked questions"
            descriptionText="Native disclosure elements share the same calm plus and minus treatment as stacked tabs."
          />
          <details className="mg-details" open>
            <summary>How does Mangrove support accessible services?</summary>
            <div className="mg-details__content">
              <p>
                Components include semantic markup, keyboard interaction,
                visible focus states and documented accessibility contracts.
              </p>
            </div>
          </details>
          <details className="mg-details">
            <summary>Can components be used without React?</summary>
            <div className="mg-details__content">
              <p>
                Core styles and documented HTML patterns can be used directly,
                with hydration added only where richer behaviour is needed.
              </p>
            </div>
          </details>
          <details className="mg-details">
            <summary>How are themes and languages supported?</summary>
            <div className="mg-details__content">
              <p>
                Shared tokens provide theme adaptation, while logical CSS
                properties and Arabic font routing support RTL interfaces.
              </p>
            </div>
          </details>
        </section>
        <section className="mg-container--spacer">
          <SectionHeader
            headerText="Latest insights"
            descriptionText="Research, data and guidance from across the UNDRR network"
          />
          <ScrollContainer showArrows itemWidth="300px" stepSize={324}>
            {insightCards.map(card => (
              <VerticalCard key={card.title} data={[card]} />
            ))}
          </ScrollContainer>
        </section>
        <section className="mg-container--spacer">
          <SectionHeader headerText="Explore disaster risk knowledge" />
          <form
            role="search"
            aria-label="Search disaster risk knowledge"
            onSubmit={event => event.preventDefault()}
          >
            <FormAction
              label="Search disaster risk knowledge"
              hideLabel
              control={
                <input
                  className="mg-form-input"
                  id="showcase-search"
                  name="query"
                  type="search"
                  placeholder="Search reports, data and guidance"
                  defaultValue="resilience"
                />
              }
              action={
                <button className="mg-button mg-button-primary" type="submit">
                  Search
                </button>
              }
            />
          </form>
          <p className="mg-form-help">
            The full syndicated search stories demonstrate live results, facets,
            filters, sorting and pagination against the UNDRR search endpoint.
          </p>
        </section>
        <section className="mg-container--spacer">
          <SectionHeader headerText="Progress at a glance" />
          <p>
            A responsive, striped table demonstrates how structured evidence
            sits alongside editorial content in a real page composition.
          </p>
          <TableTag
            text="Reporting cycle"
            tdtext="2025–2026"
            details="National reporting and validation in progress"
            variant="striped"
            responsive="scroll"
          />
          <Pager
            page={showcasePage}
            totalPages={20}
            onPageChange={setShowcasePage}
            layout="bar"
            range={{
              start: (showcasePage - 1) * 10 + 1,
              end: showcasePage * 10,
            }}
            rangeLabel="Showing {start}–{end} of 200 records"
            showJumpTo
          />
        </section>
        <section className="mg-container--spacer mg-grid mg-grid__col-2">
          <div>
            <SectionHeader headerText="Stay informed" />
            <p>
              Subscribe for selected updates on risk knowledge, policy and
              practice. Required fields are clearly identified.
            </p>
          </div>
          <form onSubmit={event => event.preventDefault()}>
            <FormAction
              label="Email address"
              helpText="We will only use this address for your selected updates."
              stackOnMobile
              control={
                <input
                  className="mg-form-input"
                  id="showcase-email"
                  name="email"
                  type="email"
                  placeholder="name@example.org"
                  required
                />
              }
              action={
                <button className="mg-button mg-button-primary" type="submit">
                  Subscribe
                </button>
              }
            />
            <Select
              id="showcase-topic"
              name="topic"
              label="Topic"
              options={topicOptions}
              placeholder="Choose a topic"
              required
            />
            <Checkbox
              id="showcase-consent"
              name="consent"
              label="I agree to receive email updates"
              value="yes"
            />
            <Textarea
              id="showcase-interests"
              name="interests"
              label="What would you like to hear about?"
              placeholder="Tell us about your areas of interest"
              helpText="Optional. Use up to 300 characters."
              rows={3}
            />
          </form>
        </section>
        <TextCta
          headline="Put risk knowledge into action"
          text="Use Mangrove components to create accessible, evidence-led services across the UNDRR digital ecosystem."
          buttons={[
            {
              label: 'Read the implementation guide',
              url: '#',
              type: 'Primary',
            },
          ]}
        />
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

const ComponentLaboratoryExample = () => {
  const [page, setPage] = useState(4);
  const errors = [
    { id: 'lab-email', message: 'Enter a valid email address' },
    { id: 'lab-purpose', message: 'Describe how you plan to use the data' },
  ];

  return (
    <main className="mg-container mg-container--spacer">
      <SectionHeader
        headerText="Component laboratory"
        descriptionText="A dense integration canvas for search, data display, disclosures, form states and navigation."
      />
      <section
        className="mg-container--spacer"
        aria-labelledby="lab-search-title"
      >
        <h2 id="lab-search-title">Syndicated search</h2>
        <MockedSearchShowcase />
      </section>
      <section className="mg-container--spacer mg-grid mg-grid__col-2">
        <div>
          <h2>Disclosure and structured data</h2>
          <details className="mg-details" open>
            <summary>About these reporting figures</summary>
            <div className="mg-details__content">
              <p>
                Figures combine validated national reporting with regional
                quality assurance and publication status.
              </p>
            </div>
          </details>
          <TableTag
            text="Reporting status"
            tdtext="Validated"
            details="Published with supporting methodology"
            variant="striped"
            responsive="scroll"
          />
        </div>
        <form onSubmit={event => event.preventDefault()} noValidate>
          <h2>Validation states</h2>
          <FormErrorSummary errors={errors} />
          <TextInput
            id="lab-email"
            name="email"
            type="email"
            label="Email address"
            defaultValue="not-an-email"
            error
            errorText="Enter a valid email address"
            required
          />
          <Textarea
            id="lab-purpose"
            name="purpose"
            label="How will you use the data?"
            error
            errorText="Describe how you plan to use the data"
            required
          />
          <FormGroup legend="Preferred format">
            <Radio name="format" value="csv" label="CSV" defaultChecked />
            <Radio name="format" value="json" label="JSON" />
          </FormGroup>
          <div className="mg-buttons">
            <button className="mg-button mg-button-primary" type="submit">
              Submit request
            </button>
            <button
              className="mg-button mg-button-primary mg-button-outline"
              type="reset"
            >
              Reset form
            </button>
          </div>
        </form>
      </section>
      <Pager
        page={page}
        totalPages={24}
        onPageChange={setPage}
        layout="bar"
        range={{ start: (page - 1) * 10 + 1, end: page * 10 }}
        rangeLabel="Showing {start}–{end} of 240 components"
        showJumpTo
      />
    </main>
  );
};

export const ComponentLaboratory = {
  render: () => <ComponentLaboratoryExample />,
  name: 'Component laboratory',
  parameters: {
    layout: 'fullscreen',
  },
};

/* ------------------------------------------------------------------ */
/*  DELTA Resilience landing page                                      */
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

const deltaHeroData = [
  {
    label: 'DELTA Resilience',
    title:
      'Disaster & Hazardous Events, Losses and Damages Tracking & Analysis',
    summaryText:
      'A toolkit to collect, manage and analyze hazardous event and disaster losses and damages data to support disaster risk reduction.',
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
      'https://dts-testing.undrr.org/assets/images/how-it-works-collect.png',
    imgalt: 'Collect — record and link hazardous events with disaster data',
    imageScale: 'large',
    title: 'Collect',
    visualLabel: 'Data',
    summaryText:
      'Record and link hazardous events with disaster losses and damages data. Systematically track disaster effects across sectors, social groups and geographic areas.',
  },
  {
    imgback:
      'https://dts-testing.undrr.org/assets/images/how-it-works-analyze.png',
    imgalt: 'Analyze — reveal patterns, trends and hotspots',
    imageScale: 'large',
    title: 'Analyze',
    visualLabel: 'Analysis',
    summaryText:
      'Analyze links between hazardous events and losses and damages to reveal patterns, trends, and hotspots. Compare across hazards, sectors, events, and locations.',
  },
  {
    imgback:
      'https://dts-testing.undrr.org/assets/images/how-it-works-insights-for-action.png',
    imgalt: 'Insights for action — turn raw data into insight',
    imageScale: 'large',
    title: 'Insights for action',
    visualLabel: 'Insights for action',
    summaryText:
      'Turn raw data into insight. Produce analytical outputs to support decision-making for prevention, risk reduction, preparedness, recovery, financing and adaptation.',
  },
];

const featureCards = [
  {
    iconColor: '#f4c8a8',
    borderColor: '#e8963a',
    imageScale: 'small',
    title: 'Analytics',
    summaryText:
      'From data to decisions - analysis that drives multiple DRR applications including recovery planning, financing, early warning and risk-informed planning.',
  },
  {
    iconColor: '#d8b4e8',
    borderColor: '#007a8a',
    imageScale: 'small',
    title: 'Monitoring',
    summaryText:
      'Continuous monitoring and tracking of hazardous events and disaster events and their effects across human, socio-economic and ecosystem dimensions.',
  },
  {
    iconColor: '#a8e0c8',
    borderColor: '#00a89a',
    imageScale: 'small',
    title: 'Data management & integration',
    summaryText:
      'Preserve, connect and enrich disaster impact data using exposure, vulnerability and baseline information.',
  },
  {
    iconColor: '#a8d0e8',
    borderColor: '#4d9fd8',
    imageScale: 'small',
    title: 'Losses and damages overview',
    summaryText:
      'Analyze losses and damages through interactive dashboards per disaster event, hazard type, sector and geography.',
  },
  {
    iconColor: '#e8a8a8',
    borderColor: '#b52a32',
    imageScale: 'small',
    title: 'Connected disaster data',
    summaryText:
      'Support data sharing and application across sectors and multiple levels of government.',
  },
  {
    iconColor: '#c8ccd0',
    borderColor: '#d4a020',
    imageScale: 'small',
    title: 'Baseline & contextual data integration',
    summaryText:
      'Integrate exposure, vulnerability, statistical and geospatial data enabling post-disaster change and impact analysis.',
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
  customFilters: ['type:news'],
  showSearchBox: false,
  showFacets: false,
  showActiveFilters: false,
  showResultsCount: false,
  showSearchTimer: false,
  showPager: false,
  visibleTeaserFields: {
    contentType: false,
    date: false,
    siteName: false,
  },
};

const DeltaLandingPage = () => (
  <>
    {/* Temporary: hide .st-tag--spl until fixed upstream in Drupal search */}
    <style>{'.st-tag--spl { display: none; }'}</style>

    <PageHeader showLogo={true} showAccount={false} showLanguage={false} />

    <MegaMenu
      logoSrc={deltaLogo}
      logoAlt="DELTA Resilience"
      logoHref="#"
      sections={deltaSections}
    />

    <section className="mg-container mg-container--spacer">
      <Hero data={deltaHeroData} variant="primary" />

      <section className="mg-container--padded">
        <div className="mg-u-flex mg-u-align-items-center">
          <SectionHeader headerText="How it works" />
          <a href="#" className="mg-button mg-button-primary mg-u-push-end">
            How it works
          </a>
        </div>
        <div className="mg-container">
          <div className="mg-grid mg-grid__col-3">
            {howItWorksCards.map((card, i) => (
              <IconCard key={i} data={[card]} />
            ))}
          </div>
        </div>
      </section>

      <section
        className="mg-container-full-width mg-container--padded"
        style={{ backgroundColor: '#f0f4f8' }}
      >
        <div className="mg-u-flex mg-u-align-items-center">
          <SectionHeader headerText="Key features" />
          <a href="#" className="mg-button mg-button-primary mg-u-push-end">
            View all features
          </a>
        </div>
        <section className="mg-container--padded">
          <div className="mg-grid mg-grid__col-3">
            {featureCards.map((card, i) => (
              <IconCard key={i} data={[card]} />
            ))}
          </div>
        </section>
      </section>

      <section className="mg-container--padded">
        <div className="mg-u-flex mg-u-align-items-center">
          <SectionHeader headerText="More from UNDRR" />
          <a href="#" className="mg-button mg-button-primary mg-u-push-end">
            Explore research
          </a>
        </div>
        <SyndicationSearchWidget config={syndicationConfig} />
      </section>
    </section>

    <TextCta
      headline="Learn more about the system"
      headlineSize="800"
      buttons={[{ label: 'View documentation', url: '#' }]}
      variant="primary"
      padding="10rem 0"
    />

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

    <Footer />
  </>
);

export const DeltaResilience = {
  render: () => <DeltaLandingPage />,
  parameters: {
    layout: 'fullscreen',
  },
};
