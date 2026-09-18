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

// minWidth is a floor on the container, and min-width wins over the
// container's own max-width: 100%. A value wider than the parent therefore
// overflows it on purpose. The parent here is deliberately narrower than
// minWidth so the floor is visible, and carries its own overflow-x so the
// demo shows that without scrolling the whole page on a phone.
export const WithMinWidth = {
  render: args => (
    <section style={{ maxWidth: '800px', margin: '0 auto' }}>
      <p style={{ marginBottom: '0.5rem' }}>
        The dashed box below is 240px wide. The scroll container inside it asks
        for a 320px minimum, so it holds 320px and overflows its parent — the
        parent carries the overflow rather than the page.
      </p>
      <div
        style={{
          width: '240px',
          outline: '2px dashed #767676',
          outlineOffset: '2px',
          overflowX: 'auto',
        }}
      >
        <ScrollContainer stretchItems {...args}>
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
      </div>
    </section>
  ),
  args: {
    minWidth: '320px',
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
