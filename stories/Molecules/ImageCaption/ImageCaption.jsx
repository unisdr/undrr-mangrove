import React from 'react';
// import './image-caption.scss';
import { Imagecredit } from '../../Atom/Images/ImageCredit/ImageCredit';
import { P } from '../../Atom/BaseTypography/Paragraph/Paragraph';

export function Imagecaption({ label, paragraph, caption = true, credit = true }) {
  if (!caption && !credit) return null;

  return (
    <figcaption className="mg-image-caption">
      {caption && <P label={paragraph} />}
      {credit && <Imagecredit label={label} />}
    </figcaption>
  );
}
