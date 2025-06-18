import React, { useState, useRef, useEffect } from 'react';
// import './multi-select.scss';
import { Checkbox } from '../../Checkbox/Checkbox';
import { Radio } from '../../Radio/Radio';

/**
 * @deprecated This component was part of the initial import from the UNDP implementation
 * and is likely to be either heavily modified or deleted. It is not part of the current
 * UNDRR distribution.
 */

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(' ') : null;

function SelectTag({ text, eleId, locale, ...args }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [openSubmenus, setOpenSubmenus] = useState({});
  const selectRef = useRef(null);

  const toggleSelect = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleSubmenu = index => {
    setOpenSubmenus(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleCheckboxChange = checked => {
    setSelectedCount(prev => (checked ? prev + 1 : prev - 1));
  };

  const handleClickOutside = event => {
    if (selectRef.current && !selectRef.current.contains(event.target)) {
      setIsExpanded(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  let ElementTag = args.variant === 'Radio' ? Radio : Checkbox;

  return (
    <div
      ref={selectRef}
      className={`multi-select ${isExpanded ? 'open' : ''}`}
      data-multi-select=""
    >
      <button
        aria-label="Region"
        aria-expanded={isExpanded}
        data-id={`filter${eleId}`}
        onClick={toggleSelect}
      >
        {text} {selectedCount > 0 && <span> ({selectedCount}) </span>}
      </button>
      <ul
        className={cls(`${args.Height === 'Fix height' ? 'fix-height' : ''}`)}
        data-type="region"
        role="listbox"
        aria-multiselectable="true"
        aria-hidden={!isExpanded}
        aria-modal="true"
        style={{ display: isExpanded ? 'block' : 'none' }}
      >
        <li role="option">
          <ElementTag
            label={`${text}`}
            value="category1"
            id={`category1${eleId}`}
            label_pos="before"
            name={`filter${eleId}`}
            onChange={handleCheckboxChange}
          />
        </li>
        <li role="option">
          <ElementTag
            label={`${text}`}
            value="category2"
            id={`category2${eleId}`}
            label_pos="before"
            name={`filter${eleId}`}
            onChange={handleCheckboxChange}
          />
        </li>
        <li role="option">
          <ElementTag
            label={`${text}`}
            value="category3"
            id={`category3${eleId}`}
            label_pos="before"
            name={`filter${eleId}`}
            onChange={handleCheckboxChange}
          />
        </li>
        <li role="option">
          <ElementTag
            label={`${text}`}
            value="category4"
            id={`category4${eleId}`}
            label_pos="before"
            name={`filter${eleId}`}
            onChange={handleCheckboxChange}
          />
        </li>
        <li role="option">
          <ElementTag
            label={`${text}`}
            value="category5"
            id={`category5${eleId}`}
            label_pos="before"
            name={`filter${eleId}`}
            onChange={handleCheckboxChange}
          />
        </li>
        <li
          role="option"
          className={`has-submenu ${openSubmenus[5] ? 'open' : ''}`}
        >
          <button className="checkbox-item" onClick={() => toggleSubmenu(5)}>
            {text}
          </button>
          <ul
            role="listbox"
            className="sub-menu"
            style={{ display: openSubmenus[5] ? 'block' : 'none' }}
          >
            <li role="option">
              <ElementTag
                label={`${text}`}
                value="subcategory1"
                id={`subcategory1${eleId}`}
                label_pos="before"
                name={`filter${eleId}`}
                onChange={handleCheckboxChange}
              />
            </li>
            <li role="option">
              <ElementTag
                label={`${text}`}
                value="subcategory2"
                id={`subcategory2${eleId}`}
                label_pos="before"
                name={`filter${eleId}`}
                onChange={handleCheckboxChange}
              />
            </li>
          </ul>
        </li>
      </ul>
    </div>
  );
}

export default SelectTag;
