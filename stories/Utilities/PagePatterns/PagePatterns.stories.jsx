import React from 'react';
import { Band, Facts, Reading } from './PagePatterns';

export default {
  title: 'Components/Page composition',
  parameters: { layout: 'fullscreen' },
};

const facts = [
  ['globe', 'The official monitoring system'],
  ['chart-bar', 'Tracking progress in disaster risk reduction'],
  ['tags', 'Based on internationally agreed indicators'],
  ['cubes', 'Connected to the Sustainable Development Goals'],
];

export const TintedBand = {
  render: () => (
    <div className="mg-container">
      <p>Content at container width.</p>
      <Band>
        <h2>Why this matters</h2>
        <p className="mg-u-font-size-500">
          The band bleeds to the viewport edges while its content stays aligned
          with everything above it.
        </p>
        <Facts items={facts} />
      </Band>
      <p>Container width again.</p>
    </div>
  ),
};

export const FeatureBand = {
  render: () => (
    <div className="mg-container">
      <Band feature>
        <h1>Global assessment report</h1>
        <p className="mg-u-font-size-500">
          A band carrying the page title rather than a supporting section.
        </p>
      </Band>
    </div>
  ),
};

export const ReadingColumn = {
  render: () => (
    <div className="mg-container">
      <Reading
        contents={
          <div>
            <section className="mg-table-of-contents">
              <p>On this page</p>
              <ul>
                <li>
                  <a href="#one">First section</a>
                </li>
                <li>
                  <a href="#two">Second section</a>
                </li>
              </ul>
            </section>
          </div>
        }
      >
        <section id="one">
          <h2>First section</h2>
          <p>
            The article is constrained to a readable measure; the contents sit
            in a sticky sidebar from 48rem up, and stack above on narrow
            screens.
          </p>
        </section>
        <section id="two">
          <h2>Second section</h2>
          <p>More body copy.</p>
        </section>
      </Reading>
    </div>
  ),
};
