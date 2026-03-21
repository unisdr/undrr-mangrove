import React from 'react';
// import './author-image.scss';

export const size_options = {
  Large: 'mg-author-image--large',
  Small: '',
};

export const hover_color_options = {
  yellow: 'mg-author-image--yellow',
  green: 'mg-author-image--green',
  red: 'mg-author-image--red',
  blue: 'mg-author-image--blue',
};

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(' ') : null;

export function Authorimg({ image, alt, variant = 'Large', hovercolor = 'yellow' }) {
  const size_variant = size_options[variant];
  const Hovercolors = hover_color_options[hovercolor];
  return (
    <div className={cls('mg-author-image', size_variant, Hovercolors)}>
      <img src={image} alt={alt} title={alt} />
    </div>
  );
}
