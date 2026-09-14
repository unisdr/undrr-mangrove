import React, { useEffect, useState } from 'react';
import { AuthorImage } from './AuthorImages';

const portraitPlaceholder =
  'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22240%22 height=%22240%22 viewBox=%220 0 240 240%22%3E%3Crect width=%22240%22 height=%22240%22 rx=%22120%22 fill=%22%23dfe5ec%22/%3E%3Ccircle cx=%22120%22 cy=%2295%22 r=%2240%22 fill=%22%23b0bcc9%22/%3E%3Cpath d=%22M52 204c12-37 44-56 68-56s56 19 68 56%22 fill=%22%23b0bcc9%22/%3E%3C/svg%3E';

const seededUserPortrait = async seed => {
  const response = await fetch(
    `https://randomuser.me/api/?seed=${seed}&inc=picture`
  );

  if (!response.ok) {
    throw new Error(`Failed to load seeded portrait for ${seed}`);
  }

  const data = await response.json();

  return data.results[0].picture.large;
};

function SeededAuthorImage({ seed, imageAlt, ...props }) {
  const [image, setImage] = useState('');

  useEffect(() => {
    let active = true;

    seededUserPortrait(seed)
      .then(src => {
        if (active) {
          setImage(src);
        }
      })
      .catch(() => {
        if (active) {
          setImage('');
        }
      });

    return () => {
      active = false;
    };
  }, [seed]);

  return (
    <AuthorImage
      image={image || portraitPlaceholder}
      imageAlt={imageAlt}
      {...props}
    />
  );
}

const defaultPeople = [
  {
    name: 'Author One',
    title: 'Special Representative',
    org: 'Example organisation',
    highlight: 'primary',
    layout: 'horizontal',
    seed: 'author-one',
  },
  {
    name: 'Author Two',
    title: 'Director',
    org: 'Example organisation',
    highlight: 'tertiary',
    layout: 'vertical',
    seed: 'author-two',
  },
  {
    name: 'Author Three',
    title: 'Contributor',
    org: 'Example organisation',
    highlight: 'secondary',
    layout: 'vertical',
    noImage: true,
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
      {defaultPeople.map(person =>
        person.noImage ? (
          <AuthorImage
            key={person.name}
            name={person.name}
            title={person.title}
            org={person.org}
            highlight={person.highlight}
            layout={person.layout}
            {...args}
          />
        ) : (
          <SeededAuthorImage
            key={person.name}
            seed={person.seed}
            imageAlt={`${person.name}, ${person.title}, ${person.org}`}
            name={person.name}
            title={person.title}
            org={person.org}
            highlight={person.highlight}
            layout={person.layout}
            {...args}
          />
        )
      )}
    </StoryGrid>
  ),

  name: 'Author image',
};

export const HorizontalAuthorImage = {
  render: args => (
    <SeededAuthorImage
      seed="author-one-horizontal"
      imageAlt="Author One, Special Representative, Example organisation"
      name="Author One"
      title="Special Representative"
      org="Example organisation"
      highlight="primary"
      layout="horizontal"
      href="#author-one"
      {...args}
    />
  ),

  name: 'Horizontal author image',
};

export const VerticalAuthorImage = {
  render: args => (
    <SeededAuthorImage
      seed="author-two-vertical"
      imageAlt="Author Two, Director, Example organisation"
      name="Author Two"
      title="Director"
      org="Example organisation"
      highlight="secondary"
      layout="vertical"
      href="#author-two"
      {...args}
    />
  ),

  name: 'Vertical author image',
};

export const InverseAuthorImage = {
  render: args => (
    <div
      style={{
        background: 'rgb(var(--mg-color-neutral-900))',
        padding: 'var(--mg-spacing-200)',
      }}
    >
      <SeededAuthorImage
        seed="author-one-inverse"
        imageAlt="Author One, Special Representative, Example organisation"
        name="Author One"
        title="Special Representative"
        org="Example organisation"
        highlight="primary"
        layout="horizontal"
        tone="inverse"
        href="#author-one"
        {...args}
      />
    </div>
  ),

  name: 'Inverse author image',
};

export const NoImageAuthorImage = {
  render: args => (
    <AuthorImage
      name="Author Three"
      title="Contributor"
      org="Example organisation"
      highlight="secondary"
      layout="vertical"
      tone="default"
      href="#author-three"
      {...args}
    />
  ),

  name: 'No image author image',
};
