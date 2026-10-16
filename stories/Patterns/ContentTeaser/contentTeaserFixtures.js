// Illustrative normalised records, not a claim about the live Drupal API.
const photo = {
  src: '/images/sample_image-md.jpg',
  alt: 'A farmer seated beside a harvested field',
};
const cover = { src: '/images/teaser-publication-cover.svg', alt: '' };
export const teaserFixtures = {
  news: {
    type: 'news',
    typeLabel: 'Update',
    title: 'Communities strengthen resilience to floods',
    link: 'https://www.undrr.org/news',
    image: photo,
    published: { dateTime: '2026-10-13', text: '13 October 2026' },
    summary:
      'Local knowledge and shared planning help communities prepare for changing risks.',
    source: 'UNDRR',
  },
  publication: {
    type: 'publication',
    typeLabel: 'Report',
    title: 'Understanding disaster risk',
    link: 'https://www.undrr.org/publications',
    image: cover,
    published: { dateTime: '2026', text: '2026' },
    identifier: 'UNDRR/2026/1',
    summary: 'Evidence and practical guidance for resilient development.',
    source: 'UNDRR',
    language: 'English',
    lang: 'en',
  },
  resource: {
    type: 'resource',
    title: 'A practical guide to local risk assessment',
    link: 'https://www.preventionweb.net/knowledge-base',
    resourceType: 'Training toolkit',
    location: 'Global',
    delivery: 'Online',
    summary: 'Tools for identifying hazards, exposure and vulnerability.',
    source: 'PreventionWeb',
  },
  event: {
    type: 'event',
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
