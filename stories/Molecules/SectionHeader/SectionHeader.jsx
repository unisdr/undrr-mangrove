import React from 'react';
// import './sectionheader.scss';
import { Heading } from '../../Atom/Typography/Heading/Heading';

export function SectionHeader({ headerText, descriptionText }) {
  return (
    <div className="header__wrapper">
      <Heading type="2">{headerText}</Heading>
      <Heading type="4">{descriptionText}</Heading>
    </div>
  );
}
