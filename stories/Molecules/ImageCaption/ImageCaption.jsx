import React from 'react';
// import './image-caption.scss';
import { Imagecredit } from '../../Atom/Images/ImageCredit/ImageCredit';
import { P } from '../../Atom/BaseTypography/Paragraph/Paragraph';

// A text caption renders as a single <p>. Element or array content (for
// example several <p> elements) goes in .mg-image-caption__text instead, so
// it lays out as one caption block next to the credit.
function CaptionText({ paragraph }) {
  if (React.isValidElement(paragraph) || Array.isArray(paragraph)) {
    return <div className="mg-image-caption__text">{paragraph}</div>;
  }
  return <P label={paragraph} />;
}

export function Imagecaption({
  label,
  paragraph,
  caption = true,
  credit = true,
}) {
  if (!caption && !credit) return null;

  return (
    <figcaption className="mg-image-caption">
      {caption && <CaptionText paragraph={paragraph} />}
      {credit && <Imagecredit label={label} />}
    </figcaption>
  );
}
