import { teaserFixtures } from '../ContentTeaser/contentTeaserFixtures';
const photo = teaserFixtures.news.image;
export const cardFixtures = Object.fromEntries(
  Object.entries(teaserFixtures).map(([id, content]) => [id, { ...content }])
);
Object.assign(cardFixtures, {
  publication: { ...teaserFixtures.publication, labels: ['Guidance'] },
  resource: {
    ...teaserFixtures.resource,
    image: photo,
    resourceType: {
      label: 'Training toolkit',
      link: '/resource-types/training-toolkit',
    },
  },
  event: {
    ...teaserFixtures.event,
    image: photo,
    event: { ...teaserFixtures.event.event, label: 'Event dates:' },
  },
  'conference-session': {
    ...teaserFixtures['conference-session'],
    session: {
      ...teaserFixtures['conference-session'].session,
      bucket: 'Session',
      types: [
        { label: 'Technical session', link: '/programme/technical-sessions' },
      ],
    },
  },
});
export const mixedLanguageCards = [
  cardFixtures.news,
  {
    type: 'article',
    profile: 'news',
    lang: 'ar',
    title: 'مجتمعات أكثر قدرة على الصمود أمام الكوارث',
    typeLabel: 'أخبار',
    link: '/ar/news',
    image: photo,
  },
  cardFixtures.publication,
];

// Optional publication date: the same editorial profiles and card layouts.
export const cardsWithPublishedDates = [
  cardFixtures.event,
  cardFixtures['conference-session'],
  cardFixtures.vacancy,
].map(content => ({
  ...content,
  published: {
    label: 'Published on:',
    dateTime: '2026-10-13',
    text: '13 October 2026',
  },
}));

// Explicit source-supplied states, never inferred from the rendering clock.
export const datedCardStates = [
  { ...cardFixtures.vacancy, status: 'Applications open' },
  {
    ...cardFixtures.vacancy,
    deadline: {
      label: 'Closing date:',
      dateTime: '2026-09-30',
      text: '30 September 2026',
    },
    status: 'Applications closed',
  },
  {
    ...cardFixtures.event,
    event: {
      label: 'Event date:',
      start: { dateTime: '2026-09-15', text: '15 September 2026' },
    },
    status: 'Event ended',
  },
];
