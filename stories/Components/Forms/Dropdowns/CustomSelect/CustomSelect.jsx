import React, { useState, useRef, useEffect } from 'react';
// import './custom-select.scss';
// import '../../../../assets/scss/_typography.scss';

/**
 * @deprecated This component was part of the initial import from the UNDP implementation
 * and is likely to be either heavily modified or deleted. It is not part of the current
 * UNDRR distribution.
 */

function CustomSelect({ text }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedValue, setSelectedValue] = useState('All');
  const selectRef = useRef(null);

  const options = [
    { value: 'default', label: 'All' },
    { value: 'pasto', label: 'Pasto' },
    { value: 'dari', label: 'Dari' },
    { value: 'en', label: 'English' },
    { value: 'albanian', label: 'Albanian' },
    { value: 'arabic', label: 'Arabic' },
    { value: 'portuguese', label: 'Portuguese' },
  ];

  const toggleSelect = () => {
    setIsExpanded(!isExpanded);
  };

  const selectOption = option => {
    setSelectedValue(option.label);
    setIsExpanded(false);
  };

  const handleClickOutside = event => {
    if (selectRef.current && !selectRef.current.contains(event.target)) {
      setIsExpanded(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleClickOutside);
    return () => {
      document.removeEventListener('mouseup', handleClickOutside);
    };
  }, []);

  return (
    <div
      ref={selectRef}
      className={`select-box ${isExpanded ? 'expanded' : ''}`}
      data-select=""
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-label="Select"
        aria-expanded={isExpanded}
        onClick={toggleSelect}
      >
        {selectedValue || text}
      </button>
      <ul role="listbox" className={isExpanded ? 'active' : ''}>
        {options.map(option => (
          <li
            key={option.value}
            role="option"
            tabIndex="0"
            data-value={option.value}
            onClick={() => selectOption(option)}
          >
            <span>{option.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CustomSelect;
