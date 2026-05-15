import React from 'react';
import { Icon } from '../../../Atom/Icons/Icon';

export const variant_options = {
  default: '',
  inverted: 'inverted',
};

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(' ') : null;

const SOCIAL_LINKS = [
  { key: 'facebook', label: 'Facebook', icon: 'facebook' },
  { key: 'linkedin', label: 'LinkedIn', icon: 'linkedin' },
  // TODO: add mg-icon-instagram when an icon is available
  { key: 'instagram', label: 'Instagram', icon: null },
  { key: 'twitter', label: 'X (Twitter)', icon: 'x-social' },
  { key: 'youtube', label: 'YouTube', icon: 'youtube' },
];

export function FooterIcons({ variant = 'default', ...args }) {
  let screen_variant = variant_options[variant];
  return (
    <ul className={cls('footer-icons', screen_variant || undefined)}>
      {SOCIAL_LINKS.map(({ key, label, icon }) => (
        <li key={key}>
          <a href="#" className={key} aria-label={label}>
            {icon ? (
              <Icon name={icon} />
            ) : (
              <span>{label}</span>
            )}
          </a>
        </li>
      ))}
    </ul>
  );
}
