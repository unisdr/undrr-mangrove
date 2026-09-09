import React from 'react';
import ScrollContainer from './ScrollContainer.jsx';
import {
  ScrollExampleCard,
  scrollCardExamples,
} from './ScrollContainerExamples';
import {
  LABELS_AR,
  LABELS_ES,
  LABELS_FR,
  LABELS_JA,
  LABELS_RU,
  LABELS_ZH,
} from './_labels';

const LOCALE_LABELS = {
  spanish: LABELS_ES,
  french: LABELS_FR,
  japanese: LABELS_JA,
  chinese: LABELS_ZH,
  arabic: LABELS_AR,
  russian: LABELS_RU,
};

const withLocaleLabels = (Story, context) => {
  const labels = LOCALE_LABELS[context.globals?.locale];
  if (!labels) return <Story />;
  return <Story {...context} args={{ ...context.args, labels }} />;
};

export default {
  title: 'Components/ScrollContainer',
  component: ScrollContainer,
  decorators: [withLocaleLabels],
  argTypes: {
    height: { control: 'text' },
    maxHeight: { control: 'text' },
    width: { control: 'text' },
    padding: { control: 'text' },
  },
};

const Template = args => (
  <section style={{ maxWidth: '800px', margin: '0 auto' }}>
    <ScrollContainer stretchItems {...args}>
      {/* Example content to demonstrate horizontal scrolling */}
      {[...scrollCardExamples, ...scrollCardExamples.slice(0, 3)].map(
        (card, i) => (
          <ScrollExampleCard
            card={card}
            index={i}
            key={`${card.title}-${i}`}
            showAction
          />
        )
      )}
    </ScrollContainer>
  </section>
);

export const Default = {
  render: Template,
};

export const CustomHeight = {
  render: Template,
  args: {
    height: '100px',
    padding: '1rem',
  },
};

export const WithMinWidth = {
  render: Template,
  args: {
    minWidth: '1500px',
    padding: '1rem',
  },
};

export const WithArrows = {
  render: Template,
  args: {
    showArrows: true,
    itemWidth: '350px',
  },
};

export const WithCustomStepSize = {
  render: Template,
  args: {
    showArrows: true,
    stepSize: 200,
    itemWidth: '350px',
  },
};
