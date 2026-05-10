import React from 'react';

export const variant_options = {
  default: '',
  inverted: 'inverted',
};

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(' ') : null;

export function FooterConditions({
  style,
  footerdata,
  variant = 'default',
  ...args
}) {
  let screen_variant = variant_options[variant];
  return (
    <ul className={cls('footer-links', `${screen_variant}`)}>
      {footerdata.map((item, index) => (
        <li key={index}>
          <a href="#">{item.menu}</a>
        </li>
      ))}
    </ul>
  );
}
