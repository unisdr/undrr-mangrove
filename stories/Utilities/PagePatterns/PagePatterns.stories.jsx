import React from 'react';
import { Reading } from './PagePatterns';

export default {
  title: 'Components/Reading column',
  parameters: { layout: 'fullscreen' },
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
