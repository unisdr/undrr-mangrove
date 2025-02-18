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
  <div style={{ 
    width: '500px', 
    border: '2px solid #333', 
    margin: '2rem',
    padding: '1rem',
    paddingTop: '4rem', // Add space for arrows
  }}>
    <p style={{ marginBottom: '1rem' }}>Parent Container</p>
    <ScrollContainer {...args}>
      {/* Example content to demonstrate horizontal scrolling */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        {Array(10).fill().map((_, i) => (
          <div 
            key={i} 
            style={{ 
              padding: '1rem',
              background: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '4px',
              minWidth: '200px',
              textAlign: 'center',
              flex: '0 0 auto'
            }}
          >
            Scroll Item {i + 1}
          </div>
        ))}
      </div>
    </ScrollContainer>
  </div>
);

export const Default = Template.bind({});
Default.args = {
  height: '100px',
  padding: '1rem',
};

export const TallContent = Template.bind({});
TallContent.args = {
  height: '200px',
  padding: '1rem',
};

export const WithMinWidth = Template.bind({});
WithMinWidth.args = {
  height: '100px',
  minWidth: '800px',
  padding: '1rem',
};

export const WithArrows = Template.bind({});
WithArrows.args = {
  height: '100px',
  padding: '1rem',
  showArrows: true,
};

export const WithCustomStepSize = Template.bind({});
WithCustomStepSize.args = {
  height: '100px',
  padding: '1rem',
  showArrows: true,
  stepSize: 200, // Will scroll by 200px instead of container width
};
