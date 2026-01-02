/**
 * @file SelectDropdown.jsx
 * @description Lightweight custom select dropdown with Chosen-like functionality.
 *
 * A self-contained, accessible dropdown that provides Chosen.js-style features
 * without requiring the Chosen.js library. This allows the component to work
 * in any environment (Drupal, Storybook, standalone) without external dependencies.
 *
 * **Why not Chosen.js?**
 * - Chosen.js is ~30KB and requires jQuery
 * - Host pages may have conflicting Chosen instances
 * - This component is ~3KB and has zero dependencies
 *
 * **Features (Chosen-like):**
 * - Searchable filter input (shown when options > threshold)
 * - Single-select with radio button indicators
 * - Multi-select with checkbox indicators
 * - Keyboard navigation (↑↓ arrows, Enter to select, Escape to close)
 * - Click outside to close
 * - Doc count badges on options
 *
 * **Accessibility:**
 * - ARIA listbox pattern
 * - Focus management
 * - Screen reader announcements
 * - Touch-friendly sizing (44px trigger, 40px options)
 *
 * @module SearchWidget/components/SelectDropdown
 */

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useId,
} from 'react';
import { createPortal } from 'react-dom';

/**
 * SelectDropdown component.
 *
 * @param {Object} props - Component props
 * @param {string} props.id - Unique ID for the select
 * @param {string} props.label - Label for the select
 * @param {string} props.placeholder - Placeholder text when nothing selected
 * @param {Array} props.options - Array of { value, label, count } objects
 * @param {Array|string} props.value - Selected value(s)
 * @param {Function} props.onChange - Callback when selection changes
 * @param {boolean} props.multiple - Enable multi-select mode
 * @param {number} props.searchThreshold - Show search when options exceed this (default: 8)
 */
export function SelectDropdown({
  id,
  label,
  placeholder = 'Select...',
  options = [],
  value = [],
  onChange,
  multiple = false,
  searchThreshold = 8,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  const generatedId = useId();
  const selectId = id || generatedId;
  const listboxId = `${selectId}-listbox`;

  // Generate option ID for aria-activedescendant
  const getOptionId = useCallback(
    (index) => `${selectId}-option-${index}`,
    [selectId]
  );

  // Current active descendant for screen readers
  const activeDescendant =
    isOpen && highlightedIndex >= 0 ? getOptionId(highlightedIndex) : undefined;

  // Normalize value to array for consistent handling
  const selectedValues = useMemo(() => {
    if (Array.isArray(value)) return value;
    if (value === null || value === undefined || value === '') return [];
    return [value];
  }, [value]);

  // Filter options by search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  // Show search input when we have many options
  const showSearch = options.length > searchThreshold;

  // Get display text for trigger button
  const displayText = useMemo(() => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) {
      const selected = options.find((opt) => opt.value === selectedValues[0]);
      return selected?.label || selectedValues[0];
    }
    return `${selectedValues.length} selected`;
  }, [selectedValues, options, placeholder]);

  // Handle backdrop click to close dropdown (prevents click-through to elements below)
  const handleBackdropClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
    setSearchQuery('');
    triggerRef.current?.focus();
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, showSearch]);

  // Reset highlighted index when options change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [filteredOptions.length]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setSearchQuery('');
          triggerRef.current?.focus();
          break;

        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
          break;

        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            handleOptionClick(filteredOptions[highlightedIndex].value);
          }
          break;

        case 'Tab':
          setIsOpen(false);
          setSearchQuery('');
          break;

        default:
          break;
      }
    },
    [isOpen, highlightedIndex, filteredOptions, handleOptionClick]
  );

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex];
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  // Handle option selection
  const handleOptionClick = useCallback(
    (optionValue) => {
      if (multiple) {
        const newValues = selectedValues.includes(optionValue)
          ? selectedValues.filter((v) => v !== optionValue)
          : [...selectedValues, optionValue];
        onChange(newValues);
      } else {
        onChange(optionValue);
        setIsOpen(false);
        setSearchQuery('');
        triggerRef.current?.focus();
      }
    },
    [multiple, selectedValues, onChange]
  );

  // Handle trigger click
  const handleTriggerClick = useCallback(() => {
    setIsOpen((prev) => !prev);
    if (isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Handle search input change
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
    setHighlightedIndex(0);
  }, []);

  // Check if option is selected
  const isSelected = useCallback(
    (optionValue) => selectedValues.includes(optionValue),
    [selectedValues]
  );

  return (
    <div
      ref={containerRef}
      className={`mg-select ${isOpen ? 'mg-select--open' : ''}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        id={selectId}
        className="mg-select__trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={`${selectId}-label`}
        aria-controls={listboxId}
        aria-activedescendant={activeDescendant}
        onClick={handleTriggerClick}
      >
        <span className="mg-select__trigger-text">{displayText}</span>
        <span className="mg-select__trigger-icon" aria-hidden="true">
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 4.5L6 7.5L9 4.5" />
          </svg>
        </span>
      </button>

      {/* Invisible backdrop to capture clicks outside (prevents click-through) */}
      {/* Rendered via portal to escape sidebar stacking context */}
      {isOpen &&
        createPortal(
          <div
            className="mg-select__backdrop"
            onClick={handleBackdropClick}
            onMouseDown={handleBackdropClick}
            aria-hidden="true"
          />,
          document.body
        )}

      {/* Dropdown panel */}
      {isOpen && (
        <div className="mg-select__dropdown" role="presentation">
          {/* Search input */}
          {showSearch && (
            <div className="mg-select__search">
              <input
                ref={searchInputRef}
                type="text"
                className="mg-select__search-input"
                placeholder="Search..."
                value={searchQuery}
                onChange={handleSearchChange}
                aria-label={`Search ${label}`}
                autoComplete="off"
              />
            </div>
          )}

          {/* Options list */}
          <ul
            ref={listRef}
            id={listboxId}
            className="mg-select__list"
            role="listbox"
            aria-label={label}
            aria-multiselectable={multiple}
          >
            {filteredOptions.length === 0 ? (
              <li className="mg-select__empty">No options found</li>
            ) : (
              filteredOptions.map((option, index) => (
                <li
                  key={option.value}
                  id={getOptionId(index)}
                  className={`mg-select__option ${
                    isSelected(option.value) ? 'mg-select__option--selected' : ''
                  } ${index === highlightedIndex ? 'mg-select__option--highlighted' : ''} ${
                    option.isSubtype && !isSelected(option.value) ? 'mg-select__option--subtype' : ''
                  }`}
                  role="option"
                  aria-selected={isSelected(option.value)}
                  onClick={() => handleOptionClick(option.value)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {/* Checkbox/Radio indicator */}
                  <span
                    className={`mg-select__indicator ${
                      multiple ? 'mg-select__indicator--checkbox' : 'mg-select__indicator--radio'
                    }`}
                    aria-hidden="true"
                  >
                    {isSelected(option.value) && (
                      multiple ? (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                          <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" />
                        </svg>
                      ) : (
                        <span className="mg-select__indicator-dot" />
                      )
                    )}
                  </span>

                  {/* Label */}
                  <span className="mg-select__option-label">{option.label}</span>

                  {/* Count badge */}
                  {option.count !== undefined && (
                    <span className="mg-select__option-count">
                      {option.count.toLocaleString()}
                    </span>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
