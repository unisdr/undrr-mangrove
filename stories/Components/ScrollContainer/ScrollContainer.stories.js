import React from 'react';
import ScrollContainer from './ScrollContainer.jsx';

export default {
  title: 'Components/ScrollContainer',
  component: ScrollContainer,
  argTypes: {
    height: { control: 'text' },
    maxHeight: { control: 'text' },
    width: { control: 'text' },
    padding: { control: 'text' },
  },
};

const Template = (args) => (
  <section style={{ maxWidth: '800px', margin: '0 auto' }}>
    <ScrollContainer {...args}>
      {/* Example content to demonstrate horizontal scrolling */}
      {Array(8).fill().map((_, i) => (
      <>
          <article className="mg-card mg-card__vc" style={{ minWidth: '350px', marginRight: '20px', padding: '20px', boxSizing: 'border-box', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div className="mg-card__visual">
              <img
                alt="A person looks on"
                className="mg-card__image"
                src="https://www.undrr.org/sites/default/files/2020-01/Home---about-us_0.jpg" />
            </div>
            <div className="mg-card__content">
              <header className="mg-card__title">
                <a
                  href="https://www.undrr.org"
                >
                  Title in large size with up to two lines of text {i + 1}
                </a>
              </header>
              <p className="mg-card__summary">
                Climate change is a <a className="mg-card__text-link" href="https://www.undrr.org">global health emergency</a>,
                with impacts felt most acutely by vulnerable populations and
                communities. This paper explores health risks from climate change in a
                global context, setting out key risks actions
              </p>
              <a
                className="mg-button mg-button-primary mg-button-arrow"
                role="button"
                href="https://www.undrr.org"
                type="Primary"
              >
                Primary action
              </a>
            </div>
          </article>
      </>
      ))}
    </ScrollContainer>
  </section>
);

export const Default = Template.bind({});


export const CustomHeight = Template.bind({});
CustomHeight.args = {
  height: '100px',
  padding: '1rem',
};

export const WithMinWidth = Template.bind({});
WithMinWidth.args = {
  minWidth: '1500px',
  padding: '1rem',
};

export const WithArrows = Template.bind({});
WithArrows.args = {
  showArrows: true,
  minWidth: '1200px', // Force overflow to ensure arrows are active
  padding: '1rem',
};

export const WithCustomStepSize = Template.bind({});
WithCustomStepSize.args = {
  showArrows: true,
  stepSize: 200, // Will scroll by 200px instead of container width
  minWidth: '1200px', // Force overflow to ensure arrows are active
  padding: '1rem',
};
