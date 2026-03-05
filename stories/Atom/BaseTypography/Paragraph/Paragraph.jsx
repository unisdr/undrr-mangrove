import React from 'react';
// import '../../../assets/scss/_typography.scss';

const ALLOWED_SIZES = new Set([
  '150',
  '200',
  '300',
  '400',
  '500',
  '600',
  '800',
  '900',
]);

export const P = ({ detail, label, className, tabIndex, size }) => {
  const normalizedSize = size != null ? String(size) : null;
  const sizeClass =
    normalizedSize && ALLOWED_SIZES.has(normalizedSize)
      ? `mg-u-font-size-${normalizedSize}`
      : '';
  const classes = [className, sizeClass].filter(Boolean).join(' ');
  return (
    <p className={classes || undefined} tabIndex={tabIndex}>
      {detail ?? label}
    </p>
  );
};
