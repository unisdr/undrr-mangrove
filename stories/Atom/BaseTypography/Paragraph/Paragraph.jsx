import React from 'react';
// import '../../../assets/scss/_typography.scss';

export const P = ({ detail, className, tabIndex }) => (
  <p className={className} tabIndex={tabIndex}>
    {detail}
  </p>
);
