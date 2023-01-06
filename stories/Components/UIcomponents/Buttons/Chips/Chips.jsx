import React from 'react';
import './chips.scss';

export function Chips({ label, Type }) {
  return (
    <a className={['chip', `${(Type == 'With X' ? ' chip__cross' : '')}`].join('')} href="#" role="button">
      {label}
    </a>
  );
}
