import React, { useEffect, useRef } from 'react';
import createHydrator from '../../../src/hydrate';
import ScrollContainer from './ScrollContainer.jsx';
import scrollContainerFromElement from './ScrollContainer.fromElement.js';
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

const hydrationRow = (rowLabel, itemLabel) => `
  <h3 class="mg-heading-300">${rowLabel}</h3>
  <div data-mg-scroll-container data-show-arrows="true" data-item-width="240px" data-padding="16" data-aria-label="${rowLabel}">
    <div class="mg-scroll__content">
      ${[1, 2, 3, 4, 5, 6]
        .map(
          card => `<div style="padding:1rem;min-width:220px;border:1px solid #767676">
            <p><strong>${itemLabel} ${card}</strong></p>
            <p>Server-rendered card, hydrated in place.</p>
          </div>`
        )
        .join('')}
    </div>
  </div>`;

const HYDRATION_MARKUP =
  hydrationRow('Row one', 'First row card') +
  hydrationRow('Row two', 'Second row card');

const TwoOnOnePageDemo = () => {
  const ref = useRef(null);

  useEffect(() => {
    const host = ref.current;
    host.innerHTML = HYDRATION_MARKUP;
    const hydrator = createHydrator({
      selector: '[data-mg-scroll-container]',
      component: ScrollContainer,
      fromElement: scrollContainerFromElement,
    });
    return () => {
      // Unmount outside React's commit phase to avoid unmounting one root
      // while another is still rendering.
      setTimeout(() => {
        hydrator.unmountAll();
        host.innerHTML = '';
      });
    };
  }, []);

  return <div ref={ref} />;
};

export const TwoHydratedOnOnePage = {
  name: 'Two hydrated on one page',
  render: () => <TwoOnOnePageDemo />,
  parameters: {
    docs: {
      description: {
        story:
          'Two server-rendered scroll containers hydrated with `createHydrator`. Each row keeps its own cards: the content lookup reads only the container it is hydrating.',
      },
    },
  },
};
