import React from 'react';
// import './code.scss';

export const Code = ({ detail1, detail2, detail3, detail4, detail5 }) => (
  <p>
    {detail1} <code>{detail2}</code> {detail3} <code>{detail4}</code> {detail5}
  </p>
);
