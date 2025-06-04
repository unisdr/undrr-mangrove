import React from 'react';
import './page-header.scss';

const cls = (...classes) => ((classes.filter(Boolean).length > 0) ? classes.filter(Boolean).join(' ') : null);

export function PageHeader({
  variant = 'default',
  className,
  ...args
}) {
  const headerClasses = cls(
    'mg-page-header',
    variant && `mg-page-header--${variant}`,
    className
  );

  return (
    <header id="header" className={headerClasses} {...args}>
      <div className="mg-page-header__decoration">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </header>
  );
}

PageHeader.defaultProps = {
  variant: 'default',
}; 