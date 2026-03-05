import React from 'react';
// import '../../../assets/scss/_typography.scss';

export const P = ({ detail, className, tabIndex, size }) => {
  const sizeClass = size ? `mg-u-font-size-${size}` : '';
  const classes = [className, sizeClass].filter(Boolean).join(' ');
  return (
    <p className={classes || undefined} tabIndex={tabIndex}>
      {detail}
    </p>
  );
};
