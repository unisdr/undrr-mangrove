import React from 'react';
import ScrollContainer from './ScrollContainer';

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
  <ScrollContainer {...args}>
    {/* className='mg-grid mg-grid--cols-3' */}
    {/* Example content to demonstrate horizontal scrolling */}
    {Array(5).fill().map((_, i) => (
      <>
        <article className="mg-card mg-card__vc">
          <div className="mg-card__visual">
            <img
              alt="A person looks on"
              className="mg-card__image"
              src="https://www.undrr.org/sites/default/files/2020-01/Home---about-us_0.jpg" />
          </div>
          <div className="mg-card__content undefined">
            <header className="mg-card__title">
              <a
                href="#{i+1}"
              >
                Title in large size with up to two lines of text {i + 1}
              </a>
            </header>
            <p className="mg-card__summary">
              Climate change is a
              <a className="mg-card__text-link" href="#{i+1}">global health emergency</a>
              , with impacts felt most acutely by vulnerable populations and
              communities. This paper explores health risks from climate change in a
              global context, setting out key risks actions
            </p>
            <a
              className="mg-button mg-button-primary mg-button-arrow"
              role="button"
              href="#{i+1}"
              type="Primary"
            >
              Primary action
            </a>
          </div>
        </article>
        <article className="mg-card mg-card__vc mg-card__book" style={{width: 200 + 'px'}}>
          <div className="mg-card__visual">
            <img alt="A publication cover" className="mg-card__image" src="https://www.undrr.org/sites/default/files/styles/por/public/2022-08/Bali.JPG.jpg" />
          </div>
          <div className="mg-card__content undefined">
            <header className="mg-card__title"><a href="#{i+1}">Book title in normal header size with up to three lines of text {i+1}</a></header>
          </div>
        </article>
      </>
    ))}
  </ScrollContainer>
);

export const Default = Template.bind({});


export const TallContent = Template.bind({});
TallContent.args = {
  height: '700px',
  padding: '1rem',
  itemWidth: '150px',
};

export const WithMinWidth = Template.bind({});
WithMinWidth.args = {
  minWidth: '1500px',
  padding: '1rem',
};

export const WithArrows = Template.bind({});
WithArrows.args = {
  showArrows: true,
};

export const WithCustomStepSize = Template.bind({});
WithCustomStepSize.args = {
  showArrows: true,
  stepSize: 200, // Will scroll by 200px instead of container width
};
