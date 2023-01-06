import React from 'react';
import '../../../assets/scss/_typography.scss';

export function P({ label, className, tabIndex }) {
  return (
    <p className={className} tabIndex={tabIndex}>
      { label }
    </p>
  );
}
