import React from 'react';

export const variant_options = {
  default: '',
};

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(' ') : null;

export function Link({ label, variant = 'default', ...args }) {
  let variant_link = variant_options[variant];
  return (
    <a href="#" title={label} className={cls(`${variant_link}`)}>
      {label}
    </a>
  );
}
