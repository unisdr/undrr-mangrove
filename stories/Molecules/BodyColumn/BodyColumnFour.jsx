import React from 'react';
import { P } from '../../Atom/BaseTypography/Paragraph/Paragraph';

export function BodyColumnFour({ descriptionText }) {
  return (
    <div className="grid-x grid-margin-x">
      <div className="cell  medium-4 large-3">
        <P label={descriptionText} />
      </div>
      <div className="cell  medium-4 large-3">
        <P label={descriptionText} />
      </div>
      <div className="cell  medium-4 large-3">
        <P label={descriptionText} />
      </div>
      <div className="cell  medium-4 large-3">
        <P label={descriptionText} />
      </div>
    </div>
  );
}
