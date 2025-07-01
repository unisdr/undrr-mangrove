import React from 'react';
// import './blockquote.scss';

export const Blockquote = ({ detail, citeText }) => (
  <>
    <blockquote>
      {detail}
      <cite>{citeText}</cite>
    </blockquote>
  </>
);
