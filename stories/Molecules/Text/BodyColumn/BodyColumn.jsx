import React from 'react';
import '../../../assets/scss/_grid.scss';
import { P } from '../../../Atom/BaseTypography/Paragraph/Paragraph';

export function BodyColumnTwo({ descriptionText }) {
  return (
    <div className="grid-x grid-margin-x">
      <div className="cell medium-4 large-4">
        <P label={descriptionText} />
      </div>
      <div className="cell medium-4 large-4">
        <P label={descriptionText} />
      </div>
    </div>
  );
}
