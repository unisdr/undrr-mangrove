/**
 * @file MobileFilterDrawer.jsx
 * @description Mobile-friendly bottom sheet drawer for filter facets.
 *
 * Implements a slide-up drawer pattern with:
 * - Backdrop overlay
 * - Focus trapping for accessibility
 * - Scroll lock on body when open
 * - Touch-friendly close gesture support
 *
 * @module SearchWidget/components/MobileFilterDrawer
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { useSearchState } from '../context/SearchContext';
import FacetsSidebar from './FacetsSidebar';

/**
 * MobileFilterDrawer component.
 * A slide-up bottom sheet containing filter facets for mobile devices.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the drawer is open
 * @param {Function} props.onClose - Callback to close the drawer
 * @param {string} props.widgetId - Unique widget ID for accessibility
 */
export function MobileFilterDrawer({ isOpen, onClose, widgetId = 'search' }) {
  const drawerRef = useRef(null);
  const closeButtonRef = useRef(null);
  const state = useSearchState();

  // Count active filters for the header
  const activeFilterCount = countActiveFilters(state);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Focus management
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap
  const handleKeyDown = useCallback((e) => {
    if (e.key !== 'Tab' || !drawerRef.current) return;

    const focusableElements = drawerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement?.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement?.focus();
    }
  }, []);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="mg-search__drawer-backdrop"
      onClick={handleBackdropClick}
      aria-hidden="true"
    >
      <div
        ref={drawerRef}
        className="mg-search__drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${widgetId}-drawer-title`}
        onKeyDown={handleKeyDown}
      >
        {/* Drawer header */}
        <div className="mg-search__drawer-header">
          <h2 id={`${widgetId}-drawer-title`} className="mg-search__drawer-title">
            Filters
            {activeFilterCount > 0 && (
              <span className="mg-search__drawer-count">
                {activeFilterCount} active
              </span>
            )}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            className="mg-search__drawer-close"
            onClick={onClose}
            aria-label="Close filters"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        {/* Drawer content - scrollable area */}
        <div className="mg-search__drawer-content">
          <FacetsSidebar widgetId={widgetId} />
        </div>

        {/* Drawer footer */}
        <div className="mg-search__drawer-footer">
          <button
            type="button"
            className="mg-search__drawer-apply"
            onClick={onClose}
          >
            View results
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Count total active filters (facets + custom facets).
 * @param {Object} state - Search state
 * @returns {number} Count of active filters
 */
function countActiveFilters(state) {
  let count = 0;

  // Count standard facets
  if (state.facets) {
    for (const values of Object.values(state.facets)) {
      if (Array.isArray(values)) {
        count += values.length;
      }
    }
  }

  // Count custom facets
  if (state.customFacets) {
    for (const values of Object.values(state.customFacets)) {
      if (Array.isArray(values)) {
        count += values.length;
      }
    }
  }

  return count;
}

export default MobileFilterDrawer;
