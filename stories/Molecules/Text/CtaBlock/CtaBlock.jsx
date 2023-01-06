import React from 'react';
import './cta-block.scss';
import { Heading } from '../../../Atom/Typography/Heading/Heading';
import { P } from '../../../Atom/BaseTypography/Paragraph/Paragraph';
import { Ctalink } from '../../../Components/UIcomponents/Buttons/CtaLink/CtaLink';

export function CtaBlock({ headerText, descriptionText, ctaText }) {
  return (
    <div className="cta-block">
      <Heading type="4" label={headerText} />
      <P label={descriptionText} />
      <Ctalink label={ctaText} />
    </div>
  );
}
