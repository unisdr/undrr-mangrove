import React from 'react';
import PropTypes from 'prop-types';
import { ContentCard } from './ContentCard';
import {
  cardFixtures,
  mixedLanguageCards,
  cardsWithPublishedDates,
  datedCardStates,
} from './contentCardFixtures';

export default {
  title: 'Patterns/Content card',
  component: ContentCard,
  args: { layout: 'vertical' },
  parameters: { layout: 'padded', docs: { source: { html: true } } },
  argTypes: {
    layout: { control: 'inline-radio', options: ['vertical', 'book'] },
  },
  decorators: [
    (Story, context) => (
      <div
        style={{ maxWidth: context.parameters.cardGrid ? '70rem' : '20rem' }}
      >
        <Story />
      </div>
    ),
  ],
};
export const News = { args: { content: cardFixtures['news'] } };
export const NewsBook = {
  name: 'News book',
  args: { content: cardFixtures['news'], layout: 'book' },
};
export const Commentary = {
  args: { content: cardFixtures['blog'] },
};
export const CommentaryBook = {
  name: 'Commentary book',
  args: { content: cardFixtures['blog'], layout: 'book' },
};
export const Publication = {
  args: { content: cardFixtures['publication'] },
};
export const PublicationBook = {
  name: 'Publication book',
  args: { content: cardFixtures['publication'], layout: 'book' },
};
export const Resource = {
  args: { content: cardFixtures['resource'] },
};
export const ResourceBook = {
  name: 'Resource book',
  args: { content: cardFixtures['resource'], layout: 'book' },
};
export const Event = {
  args: { content: cardFixtures['event'] },
};
export const EventBook = {
  name: 'Event book',
  args: { content: cardFixtures['event'], layout: 'book' },
};
export const ProgrammeSession = {
  name: 'Programme session',
  args: { content: cardFixtures['conference-session'] },
};
export const ProgrammeSessionBook = {
  name: 'Programme session book',
  args: { content: cardFixtures['conference-session'], layout: 'book' },
};
export const Organization = {
  args: { content: cardFixtures['organization'] },
};
export const OrganizationBook = {
  name: 'Organization book',
  args: { content: cardFixtures['organization'], layout: 'book' },
};
export const Collection = {
  args: { content: cardFixtures['collection'] },
};
export const CollectionBook = {
  name: 'Collection book',
  args: { content: cardFixtures['collection'], layout: 'book' },
};
export const Job = { args: { content: cardFixtures['vacancy'] } };
export const JobBook = {
  name: 'Job book',
  args: { content: cardFixtures['vacancy'], layout: 'book' },
};
export const HazardProfile = {
  name: 'Hazard profile',
  args: { content: cardFixtures['hazard-profile'] },
};
export const HazardProfileBook = {
  name: 'Hazard profile book',
  args: { content: cardFixtures['hazard-profile'], layout: 'book' },
};
export const Commitment = {
  args: { content: cardFixtures['commitment'] },
};
export const CommitmentBook = {
  name: 'Commitment book',
  args: { content: cardFixtures['commitment'], layout: 'book' },
};
export const LandingPage = {
  name: 'Landing page',
  args: { content: cardFixtures['landing-page'] },
};
export const LandingPageBook = {
  name: 'Landing page book',
  args: { content: cardFixtures['landing-page'], layout: 'book' },
};
export const CoordinationPlatform = {
  name: 'Coordination platform',
  args: { content: cardFixtures['national-platform'] },
};
export const CoordinationPlatformBook = {
  name: 'Coordination platform book',
  args: { content: cardFixtures['national-platform'], layout: 'book' },
};
export const Definition = {
  args: { content: cardFixtures['terminology'] },
};
export const DefinitionBook = {
  name: 'Definition book',
  args: { content: cardFixtures['terminology'], layout: 'book' },
};
export const Person = {
  args: { content: cardFixtures['person'] },
};
export const PersonBook = {
  name: 'Person book',
  args: { content: cardFixtures['person'], layout: 'book' },
};

const Grid = ({ records, layout }) => (
  <ul className="mg-content-card-grid">
    {records.map(content => (
      <li key={content.link}>
        <ContentCard content={content} layout={layout} />
      </li>
    ))}
  </ul>
);
Grid.propTypes = {
  records: PropTypes.array.isRequired,
  layout: PropTypes.oneOf(['vertical', 'book']).isRequired,
};
export const AllProfiles = {
  name: 'All profiles',
  parameters: { cardGrid: true },
  render: () => (
    <Grid records={Object.values(cardFixtures)} layout="vertical" />
  ),
};
export const AllProfilesBook = {
  name: 'All profiles, book layout',
  parameters: { cardGrid: true },
  render: () => <Grid records={Object.values(cardFixtures)} layout="book" />,
};
export const MissingMedia = {
  name: 'Missing media',
  parameters: { cardGrid: true },
  render: () => (
    <Grid
      records={Object.values(cardFixtures).map(content => ({
        ...content,
        image: undefined,
      }))}
      layout="book"
    />
  ),
};
export const MixedLanguage = {
  name: 'Mixed languages',
  parameters: { cardGrid: true },
  render: () => (
    <div lang="en" dir="ltr">
      <Grid records={mixedLanguageCards} layout="vertical" />
    </div>
  ),
};
export const Unlabelled = {
  args: {
    content: {
      ...cardFixtures.news,
      typeLabel: undefined,
      labels: [],
      shortTitle: 'A card without labels',
    },
  },
};

export const ResourceCover = {
  name: 'Resource with a complete cover',
  args: {
    layout: 'book',
    content: {
      ...cardFixtures.resource,
      image: { ...cardFixtures.publication.image, kind: 'cover' },
    },
  },
};

export const DatesWithPublished = {
  name: 'Decision dates and publication dates',
  parameters: { cardGrid: true },
  render: ({ layout }) => (
    <Grid records={cardsWithPublishedDates} layout={layout} />
  ),
};
export const DatesWithPublishedBook = {
  ...DatesWithPublished,
  name: 'Decision dates and publication dates, book layout',
  args: { layout: 'book' },
};
export const DateStates = {
  name: 'Open, closed and past dates',
  parameters: { cardGrid: true },
  render: ({ layout }) => <Grid records={datedCardStates} layout={layout} />,
};

export const EventWithPublished = {
  name: 'Event with publication date',
  args: { content: cardsWithPublishedDates[0] },
};
export const JobWithPublished = {
  name: 'Job with publication date',
  args: { content: cardsWithPublishedDates[2] },
};
