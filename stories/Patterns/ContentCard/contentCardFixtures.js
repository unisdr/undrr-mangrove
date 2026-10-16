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
  event: { ...teaserFixtures.event, image: photo },
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
