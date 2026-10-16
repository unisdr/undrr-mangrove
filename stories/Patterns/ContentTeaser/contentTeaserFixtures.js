// Illustrative normalized records, not a claim about the live Drupal API.
const photo = {
  src: '/images/sample_image-md.jpg',
  alt: 'A farmer seated beside a harvested field',
};
const cover = { src: '/images/teaser-publication-cover.svg', alt: '' };
export const teaserFixtures = {
  news: {
    type: 'article',
    profile: 'news',
    typeLabel: 'Update',
    title: 'Communities strengthen resilience to floods',
    link: 'https://www.undrr.org/news',
    image: photo,
    published: { dateTime: '2026-10-13', text: '13 October 2026' },
    summary:
      'Local knowledge and shared planning help communities prepare for changing risks.',
    sources: ['UNDRR'],
  },
  publication: {
    type: 'publication',
    profile: 'default',
    typeLabel: 'Report',
    title: 'Understanding disaster risk',
    link: 'https://www.undrr.org/publications',
    image: cover,
    published: { dateTime: '2026', text: '2026' },
    identifier: 'UNDRR/2026/1',
    labels: [{ label: 'Guidance', link: '/publications/guidance' }],
    summary: 'Evidence and practical guidance for resilient development.',
    sources: ['UNDRR', 'Partner organization'],
    language: 'English',
    lang: 'en',
  },
  resource: {
    type: 'resource',
    profile: 'default',
    title: 'A practical guide to local risk assessment',
    link: 'https://www.preventionweb.net/knowledge-base',
    resourceType: 'Training toolkit',
    location: ['Global', 'Africa'],
    delivery: 'Online',
    summary: 'Tools for identifying hazards, exposure and vulnerability.',
    sources: ['PreventionWeb'],
  },
  event: {
    type: 'event',
    profile: 'general',
    typeLabel: 'Workshop',
    title: 'Building resilient cities together',
    link: 'https://www.undrr.org/events',
    delivery: 'Online',
    event: {
      start: {
        dateTime: '2026-11-04T09:00:00+01:00',
        text: '4 November 2026, 09:00',
      },
      end: {
        dateTime: '2026-11-05T17:00:00+01:00',
        text: '5 November 2026, 17:00',
      },
      timeZone: 'Europe/Geneva (UTC+01:00)',
      location: 'Geneva, Switzerland',
    },
    summary: 'Exchange practical approaches to reducing disaster risk.',
  },
};

Object.assign(teaserFixtures, {
  blog: {
    type: 'article',
    profile: 'commentary',
    title: 'Why local knowledge belongs in risk planning',
    link: '/blog/local-knowledge',
    image: photo,
    labels: [{ label: 'Opinion', link: '/blogs/opinion' }],
    published: { dateTime: '2026-10-12', text: '12 Oct 2026' },
    authors: ['Amira Khan', 'Daniel Okoro'],
    summary:
      'Practitioners reflect on the role of community experience in disaster risk reduction.',
  },
  organization: {
    type: 'organization',
    profile: 'general',
    title: 'United Nations Office for Disaster Risk Reduction',
    link: 'https://www.undrr.org/about-undrr',
    image: { src: '/images/undrr-logo-blue.svg', alt: '' },
    location: { label: 'Switzerland', link: '/countries/switzerland' },
    organizationType: [
      'United Nations and international organizations',
      'Regional organizations',
    ],
    summary:
      'Supporting countries and communities to understand and reduce disaster risk.',
  },
  collection: {
    type: 'collection',
    profile: 'default',
    typeLabel: 'Collection',
    title: 'Knowledge for resilient cities',
    link: '/collections/resilient-cities',
    image: photo,
    freshness: {
      kind: 'updated',
      date: {
        label: 'Last updated',
        dateTime: '2026-10-13',
        text: '13 Oct 2026',
      },
    },
    summary:
      'A curated collection of research, tools and experiences in urban resilience.',
  },
  vacancy: {
    type: 'opportunity',
    profile: 'job',
    typeLabel: 'Vacancy',
    title: 'Programme management officer',
    link: '/vacancies/programme-officer',
    location: 'Geneva, Switzerland',
    deadline: {
      label: 'Closing date:',
      dateTime: '2026-11-30',
      text: '30 Nov 2026',
    },
    summary:
      'Contribute to programmes supporting disaster risk reduction and resilient development.',
  },
  'hazard-profile': {
    type: 'reference-entry',
    profile: 'hazard-profile',
    title: 'Example flood hazard profile',
    link: '/hazards/example-flood',
    classification: [{ label: 'Hydrological', link: '/hazards/hydrological' }],
    identifier: 'EX-001',
    summary:
      'A reference definition describing the hazard, its drivers and associated impacts.',
  },
  'conference-session': {
    type: 'event',
    profile: 'programme-session',
    title: 'From risk knowledge to local action',
    link: '/programme/local-action',
    image: photo,
    session: {
      bucket: 'Technical session',
      schedule: [
        {
          label: 'Session:',
          start: {
            dateTime: '2026-11-04T09:00:00+01:00',
            text: '4 Nov 2026, 09:00',
          },
          end: { dateTime: '2026-11-04T10:30:00+01:00', text: '10:30' },
          timeZone: 'Europe/Geneva (UTC+01:00)',
        },
      ],
      exhibitions: [
        {
          label: 'Exhibition:',
          start: {
            dateTime: '2026-11-05T10:00:00+01:00',
            text: '5 Nov 2026, 10:00',
          },
          end: { dateTime: '2026-11-05T16:00:00+01:00', text: '16:00' },
          timeZone: 'Europe/Geneva (UTC+01:00)',
        },
      ],
      room: 'Conference centre / Level 1 / Room A',
      format: 'Onsite & Online',
    },
    summary: 'A practical exchange between local leaders and risk specialists.',
    topics: [
      { label: 'Risk governance', link: '/programme/themes/risk-governance' },
      { label: 'Local action', link: '/programme/themes/local-action' },
    ],
  },
  commitment: {
    type: 'commitment',
    profile: 'default',
    title: 'Strengthening community preparedness',
    link: '/commitments/community-preparedness',
    image: photo,
    scope: 'National',
    status: ['In progress', 'Ongoing'],
    published: { dateTime: '2026-09-01', text: '1 September 2026' },
    summary:
      'A voluntary commitment to strengthen local capacity and preparedness.',
  },
  'landing-page': {
    type: 'landing-page',
    profile: 'default',
    typeLabel: 'Landing',
    title: 'Understanding disaster risk',
    link: '/understanding-risk',
    image: photo,
    summary:
      'Explore the evidence, approaches and tools for reducing disaster risk.',
  },
  'national-platform': {
    type: 'organization',
    profile: 'coordination-platform',
    typeLabel: 'National platform',
    title: 'A national platform for disaster risk reduction',
    link: '/national-platforms/example',
    summary:
      'A national coordination mechanism bringing partners together to reduce disaster risk.',
  },
  terminology: {
    type: 'reference-entry',
    profile: 'definition',
    typeLabel: 'Terminology',
    title: 'Disaster risk',
    link: '/terminology/disaster-risk',
    summary:
      'A shared reference term for understanding potential losses and their underlying conditions.',
  },
  person: {
    type: 'person',
    profile: 'default',
    title: 'Amira Khan',
    link: '/people/example-profile',
    summary:
      'A contributor working on disaster risk reduction and community resilience.',
  },
});
