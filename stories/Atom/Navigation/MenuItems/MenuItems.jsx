import React from 'react';
import './menu-items.scss';

export function MenuItems({ active, text }) {
  return <a href="#" tabIndex="0" className={active !== 'default' ? active : ''}>{text}</a>;
}
