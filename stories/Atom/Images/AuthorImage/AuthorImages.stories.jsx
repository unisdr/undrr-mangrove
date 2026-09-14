import React from 'react';
import { AuthorImage } from './AuthorImages';

const user =
  'https://www.undrr.org/sites/default/files/styles/por/public/2024-05/Kamal-Kishore_UNDRR-SRSG-C-A.Tardy_min.jpg';

const defaultPeople = [
  {
    name: 'Kamal Kishore',
    title: 'Special Representative',
    org: 'UNDRR',
    highlight: 'primary',
    layout: 'horizontal',
  },
  {
    name: 'Mami Mizutori',
    title: 'Director',
    org: 'UNDRR',
    highlight: 'tertiary',
    layout: 'vertical',
  },
];

const StoryGrid = ({ children }) => (
  <div
    style={{
      display: 'grid',
      gap: 'var(--mg-spacing-200)',
      gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))',
    }}
  >
    {children}
  </div>
);

export default {
  title: 'Components/Images/Author image',
  component: AuthorImage,

  argTypes: {
    variant: {
      options: ['Large', 'Small'],
      control: {
        type: 'inline-radio',
      },
      defaultValue: 'Large',
    },
    highlight: {
      options: ['primary', 'secondary', 'tertiary'],
      control: {
        type: 'inline-radio',
      },
      defaultValue: 'primary',
    },
    layout: {
      options: ['horizontal', 'vertical'],
      control: {
        type: 'inline-radio',
      },
      defaultValue: 'vertical',
    },
  },
};

export const DefaultAuthorImage = {
  render: args => (
    <StoryGrid>
      {defaultPeople.map(person => (
        <AuthorImage
          key={person.name}
          image={user}
          imageAlt={`${person.name}, ${person.title}, ${person.org}`}
          name={person.name}
          title={person.title}
          org={person.org}
          highlight={person.highlight}
          layout={person.layout}
          {...args}
        />
      ))}
    </StoryGrid>
  ),

  name: 'Author image',
};

export const HorizontalAuthorImage = {
  render: args => (
    <AuthorImage
      image={user}
      imageAlt="Kamal Kishore, Special Representative, UNDRR"
      name="Kamal Kishore"
      title="Special Representative"
      org="UNDRR"
      highlight="primary"
      layout="horizontal"
      {...args}
    />
  ),

  name: 'Horizontal author image',
};

export const VerticalAuthorImage = {
  render: args => (
    <AuthorImage
      image={user}
      imageAlt="Mami Mizutori, Director, UNDRR"
      name="Mami Mizutori"
      title="Director"
      org="UNDRR"
      highlight="secondary"
      layout="vertical"
      {...args}
    />
  ),

  name: 'Vertical author image',
};
