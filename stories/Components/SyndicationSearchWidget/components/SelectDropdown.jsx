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
import { getOwnerDocument } from '../utils/ownerDocument';

const EMPTY_OPTIONS = [];
const EMPTY_VALUE = [];

/**
 * SelectDropdown component.
 *
 * @param {Object} props - Component props
 * @param {string} props.id - Unique ID for the select
 * @param {string} props.label - Label for the select
 * @param {string} props.placeholder - Placeholder text when nothing selected
 * @param {Array} props.options - Array of { value, label, count, selectionState, description } objects
 * @param {Array|string} props.value - Selected value(s)
 * @param {Function} props.onChange - Callback when selection changes
 * @param {boolean} props.multiple - Enable multi-select mode
 * @param {number} props.searchThreshold - Show search when options exceed this (default: 8)
 */
export function SelectDropdown({
  id,
  label,
  placeholder = 'Select...',
  options = EMPTY_OPTIONS,
  value = EMPTY_VALUE,
  onChange,
  multiple = false,
  searchThreshold = 8,
  searchInputPlaceholder = 'Search...',
  noOptionsText = 'No options found',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedValue, setHighlightedValue] = useState(null);

  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  const generatedId = useId();
  const selectId = id || generatedId;
  const listboxId = `${selectId}-listbox`;

  // Generate option ID for aria-activedescendant
  const getOptionId = useCallback(
    index => `${selectId}-option-${index}`,
    [selectId]
  );

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
    return options.filter(opt => opt.label.toLowerCase().includes(query));
  }, [options, searchQuery]);

  // Track keyboard identity by value so asynchronous count/order changes do
  // not redirect Enter to another option. Removed options have no descendant.
  const highlightedIndex = filteredOptions.findIndex(
    option => option.value === highlightedValue
  );

  // Current active descendant for screen readers
  const activeDescendant =
    isOpen && highlightedIndex >= 0 ? getOptionId(highlightedIndex) : undefined;

  // Decide search availability once per opening. Async aggregation changes
  // must not remove a focused input or leave its query hidden from the user.
  const openDropdown = useCallback(() => {
    setShowSearch(options.length > searchThreshold);
    setIsOpen(true);
  }, [options.length, searchThreshold]);

  // Get display text for trigger button
  const displayText = useMemo(() => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) {
      const selected = options.find(opt => opt.value === selectedValues[0]);
      return selected?.label || selectedValues[0];
    }
    return `${selectedValues.length} selected`;
  }, [selectedValues, options, placeholder]);

  // Handle backdrop click to close dropdown (prevents click-through to elements below)
  const handleBackdropClick = useCallback(e => {
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

  // Handle option selection (declared before handleKeyDown which references it)
  const handleOptionClick = useCallback(
    optionValue => {
      if (multiple) {
        const newValues = selectedValues.includes(optionValue)
          ? selectedValues.filter(v => v !== optionValue)
          : [...selectedValues, optionValue];
        onChange(newValues);
        // Native pointer clicks on non-focusable options can leave focus on
        // body. Keep subsequent keyboard navigation within this dropdown.
        (searchInputRef.current || triggerRef.current)?.focus();
      } else {
        onChange(optionValue);
        setIsOpen(false);
        setSearchQuery('');
        triggerRef.current?.focus();
      }
    },
    [multiple, selectedValues, onChange]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    e => {
      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          openDropdown();
        }
        return;
      }

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          // Dismiss the innermost surface before an enclosing filter drawer.
          e.stopPropagation();
          setIsOpen(false);
          setSearchQuery('');
          triggerRef.current?.focus();
          break;

        case 'ArrowDown':
          e.preventDefault();
          setHighlightedValue(
            filteredOptions[
              highlightedIndex < filteredOptions.length - 1
                ? highlightedIndex + 1
                : 0
            ]?.value ?? null
          );
          break;

        case 'ArrowUp':
          e.preventDefault();
          setHighlightedValue(
            filteredOptions[
              highlightedIndex > 0
                ? highlightedIndex - 1
                : filteredOptions.length - 1
            ]?.value ?? null
          );
          break;

        case 'Enter':
        case ' ':
          // Space edits the searchable input; Enter activates its option.
          if (e.key === ' ' && e.target === searchInputRef.current) return;
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
    [isOpen, highlightedIndex, filteredOptions, handleOptionClick, openDropdown]
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

  // Handle trigger click
  const handleTriggerClick = useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
      setSearchQuery('');
    } else {
      openDropdown();
    }
  }, [isOpen, openDropdown]);

  // Handle search input change
  const handleSearchChange = useCallback(
    e => {
      const query = e.target.value.toLowerCase();
      setSearchQuery(e.target.value);
      setHighlightedValue(
        options.find(option => option.label.toLowerCase().includes(query))
          ?.value ?? null
      );
    },
    [options]
  );

  // Check if option is selected
  const isSelected = useCallback(
    optionValue => selectedValues.includes(optionValue),
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
        aria-activedescendant={showSearch ? undefined : activeDescendant}
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
      {/* Desktop selects escape the sidebar stacking context. In the mobile
          drawer, keep the backdrop inside its stacking context: a body-level
          modal backdrop would sit above the drawer and intercept option taps.
          Both targets belong to the mounted select's document (including
          iframe consumers). */}
      {isOpen &&
        createPortal(
          <div
            className="mg-select__backdrop"
            onClick={handleBackdropClick}
            onMouseDown={handleBackdropClick}
            aria-hidden="true"
          />,
          containerRef.current.closest('.mg-search__drawer') ||
            getOwnerDocument(containerRef.current).body
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
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={isOpen}
                aria-controls={listboxId}
                aria-activedescendant={activeDescendant}
                className="mg-select__search-input"
                placeholder={searchInputPlaceholder}
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
            // Hover is CSS. When the pointer moves over the list, drop the
            // keyboard highlight so two options don't both look current;
            // after that, pointer movement costs no renders.
            onPointerMove={() => {
              if (highlightedIndex !== -1) setHighlightedValue(null);
            }}
          >
            {filteredOptions.length === 0 ? (
              <li className="mg-select__empty">{noOptionsText}</li>
            ) : (
              filteredOptions.map((option, index) => (
                <li
                  key={option.value}
                  id={getOptionId(index)}
                  className={`mg-select__option ${
                    isSelected(option.value)
                      ? 'mg-select__option--selected'
                      : ''
                  } ${index === highlightedIndex ? 'mg-select__option--highlighted' : ''} ${
                    option.isSubtype ? 'mg-select__option--subtype' : ''
                  } ${option.selectionState === 'inherited' ? 'mg-select__option--inherited' : ''} ${option.selectionState === 'partial' ? 'mg-select__option--partial' : ''}`}
                  role="option"
                  aria-selected={isSelected(option.value)}
                  aria-describedby={
                    option.description
                      ? `${getOptionId(index)}-description`
                      : undefined
                  }
                  onClick={() => handleOptionClick(option.value)}
                >
                  {/* Checkbox/Radio indicator */}
                  <span
                    className={`mg-select__indicator ${
                      multiple
                        ? 'mg-select__indicator--checkbox'
                        : 'mg-select__indicator--radio'
                    }`}
                    aria-hidden="true"
                  >
                    {!isSelected(option.value) &&
                      multiple &&
                      option.selectionState && (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="currentColor"
                        >
                          {option.selectionState === 'inherited' ? (
                            <path
                              d="M10 3L4.5 8.5L2 6"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                            />
                          ) : (
                            <path d="M2 5h8v2H2z" />
                          )}
                        </svg>
                      )}
                    {isSelected(option.value) &&
                      (multiple ? (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="currentColor"
                        >
                          <path
                            d="M10 3L4.5 8.5L2 6"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                          />
                        </svg>
                      ) : (
                        <span className="mg-select__indicator-dot" />
                      ))}
                  </span>

                  {/* Label */}
                  <span className="mg-select__option-label">
                    {option.label}
                  </span>

                  {option.description && (
                    <span id={`${getOptionId(index)}-description`} hidden>
                      {option.description}
                    </span>
                  )}

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
