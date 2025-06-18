import React from 'react';

export const variant_options = {
  default: '',
  inverted: 'inverted',
};

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(' ') : null;

export function FooterConditions2({ style, text, footerdata2, ...args }) {
  let screen_variant = variant_options[`${args.variant}`];
  return (
    <ul className={cls('footer-lists', `${screen_variant}`)}>
      {footerdata2.map((item, index) => (
        <li key={index}>
          <a href="#">{item.menu}</a>
        </li>
      ))}
    </ul>
  );
}

FooterConditions2.defaultProps = {
  variant: 'default',
};
