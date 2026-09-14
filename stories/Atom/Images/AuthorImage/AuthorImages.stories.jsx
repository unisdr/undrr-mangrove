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
  },
  {
    name: 'Mami Mizutori',
    title: 'Director',
    org: 'UNDRR',
    highlight: 'secondary',
  },
  {
    name: 'Julián Harnecker',
    title: 'Communications Lead',
    org: 'Regional office',
    highlight: 'tertiary',
  },
];

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
  },
};

export const DefaultAuthorImage = {
  render: args => (
    <div
      style={{
        display: 'grid',
        gap: 'var(--mg-spacing-150)',
        gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))',
      }}
    >
      {defaultPeople.map(person => (
        <AuthorImage
          key={person.name}
          image={user}
          imageAlt={`${person.name}, ${person.title}, ${person.org}`}
          name={person.name}
          title={person.title}
          org={person.org}
          highlight={person.highlight}
          {...args}
        />
      ))}
    </div>
  ),

  name: 'Author image',
};
