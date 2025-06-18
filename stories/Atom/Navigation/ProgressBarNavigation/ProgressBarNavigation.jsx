import React, { useState, useEffect } from 'react';
// import './progress-bar-navigation.scss';

/**
 * @deprecated This component was part of the initial import from the UNDP implementation
 * and is likely to be either heavily modified or deleted. It is not part of the current
 * UNDRR distribution.
 */

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(' ') : null;

export const ProgressBarNavigation = ({ Type, Colors }) => {
  const [scrollPercent, setScrollPercent] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollAmount = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const scrollPercent =
        (scrollAmount / (documentHeight - windowHeight)) * 100;
      const roundScroll = Math.round(scrollPercent);
      setScrollPercent(roundScroll);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  let type;
  const types = ['Small'];
  type = types.includes(Type) ? Type.toLowerCase() : '';

  return (
    <div className={cls('progress-container', `${type}`, `${Colors}`)}>
      <div
        className={`progress-bar ${scrollPercent > 1 ? 'progress-top' : ''}`}
        style={{ width: `${scrollPercent}%` }}
      />
    </div>
  );
};
