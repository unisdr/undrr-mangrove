import React, { useState, useRef, useEffect } from 'react';
// import './language-switcher.scss';

/**
 * @deprecated This component was part of the initial import from the UNDP implementation
 * and is likely to be either heavily modified or deleted. It is not part of the current
 * UNDRR distribution.
 */

export const variant_options = {
  blue: 'blue',
  white: 'white',
};

export function Languageswitcher({ headerText, data, lang, ...args }) {
  const [isActive, setIsActive] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => {
    setIsActive(!isActive);
  };

  const handleClickOutside = event => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsActive(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  let color_variant = variant_options[`${args.variant}`];
  return (
    <div
      ref={dropdownRef}
      className={`dropdown-language ${isActive ? 'active' : ''}`}
    >
      <button
        className={[`${color_variant}`].join(' ')}
        aria-label="English, Select your language"
        aria-expanded={isActive}
        onClick={toggleDropdown}
      >
        {headerText}
      </button>
      <ul role="menu">
        {data.map((item, index) => (
          <li key={index} role="menuitem">
            <a
              href="#"
              lang={item.lang}
              hrefLang={item.lang}
              tabIndex={isActive ? '0' : '-1'}
              onClick={e => {
                e.preventDefault();
                setIsActive(false);
              }}
            >
              {item.descriptionText}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

Languageswitcher.defaultProps = {
  variant: 'blue',
};
