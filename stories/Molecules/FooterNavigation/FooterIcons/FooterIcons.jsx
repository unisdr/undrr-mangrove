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
  { key: 'instagram', label: 'Instagram', icon: 'share', isFallbackIcon: true },
  { key: 'twitter', label: 'X (Twitter)', icon: 'x-social' },
  { key: 'youtube', label: 'YouTube', icon: 'youtube' },
];

export function FooterIcons({ variant = 'default', ...args }) {
  let screen_variant = variant_options[variant];
  return (
    <ul className={cls('mg-footer--social-links', screen_variant || undefined)}>
      {SOCIAL_LINKS.map(({ key, label, icon, isFallbackIcon }) => (
        <li key={key}>
          <a href="#" aria-label={label}>
            <Icon name={icon} />
            {isFallbackIcon && <span className="mg-u-sr-only">{label}</span>}
          </a>
        </li>
      ))}
    </ul>
  );
}
