import React from 'react';
import { Grid } from './Grid';
import { checkArticleGridGeometry } from './gridGeometryChecks';

export default {
  title: 'Design decisions/Grid layout',
  component: Grid,
};

export const DefaultGrid = {
  args: {},
};

export const ArticleGrid = {
  name: 'Article layout variant',
  render: () => (
    <div className="mg-container">
      <div className="mg-grid mg-grid--article">
        <div className="mg-reading__article">
          <h3>Main Reading Column</h3>
          <p>Flexible column constrained by available space and rail width.</p>
        </div>
        <div>
          <h3>Rail</h3>
          <p>16rem rail for metadata or navigation.</p>
        </div>
      </div>
    </div>
  ),
  play: checkArticleGridGeometry,
};
