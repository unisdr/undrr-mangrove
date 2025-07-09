import React from 'react';

export const Abbreviation = ({ detail1, detail2, text1, text2 }) => (
  <p>
    {text1} <abbr title={detail1}>HTML</abbr> {text2} <abbr title={detail2}>CSS</abbr>.
  </p>
);
