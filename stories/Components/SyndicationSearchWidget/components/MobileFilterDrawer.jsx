/**
 * @file MobileFilterDrawer.jsx
 * @description Mobile-friendly left-side slide-in drawer for filter facets.
 *
 * Implements a slide-in drawer pattern (Amazon-style) with:
 * - Left-side slide-in animation
 * - Backdrop overlay with click-to-close
 * - Focus trapping for accessibility
 * - Scroll lock on body when open
 * - Sticky footer with "View Results" button
 *
 * UX patterns informed by:
 * @see https://www.pencilandpaper.io/articles/ux-pattern-analysis-mobile-filters
 *
 * Key UX decisions:
 * - Sidebar overlay: Maintains left-side visibility for context, feels safer
 * - Batch filtering: Users refine filters then apply once (vs live filtering)
 * - Sticky Apply button: Always visible, no scrolling required
 * - Progressive disclosure: Collapsible sections avoid overwhelm
 * - Generous touch targets: 44px minimum for finger interaction
 *
 * @module SearchWidget/components/MobileFilterDrawer
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { useSearchState } from '../context/SearchContext';
import FacetsSidebar from './FacetsSidebar';

/**
 * MobileFilterDrawer component.
 * A left-side slide-in drawer containing filter facets for mobile devices.
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
      const originalPaddingRight = document.body.style.paddingRight;

      // Prevent layout shift from scrollbar removal
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [isOpen]);

  // Focus management - focus close button when opened
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      // Small delay to ensure animation has started
      requestAnimationFrame(() => {
        closeButtonRef.current?.focus();
      });
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

  // Focus trap - keep focus within drawer
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

  // Handle backdrop click - closes drawer
  const handleBackdropClick = useCallback((e) => {
    // Only close if clicking the backdrop itself, not the drawer
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
      role="presentation"
    >
      <div
        ref={drawerRef}
        className="mg-search__drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${widgetId}-drawer-title`}
        onKeyDown={handleKeyDown}
      >
        {/* Drawer header - sticky */}
        <header className="mg-search__drawer-header">
          <h2 id={`${widgetId}-drawer-title`} className="mg-search__drawer-title">
            Filters
            {activeFilterCount > 0 && (
              <span className="mg-search__drawer-count">
                {activeFilterCount}
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        {/* Drawer content - scrollable area */}
        <div className="mg-search__drawer-content">
          <FacetsSidebar widgetId={widgetId} />
        </div>

        {/* Drawer footer - sticky, always visible per UX best practice */}
        <footer className="mg-search__drawer-footer">
          <button
            type="button"
            className="mg-search__drawer-apply"
            onClick={onClose}
          >
            View results
            {activeFilterCount > 0 && (
              <span className="mg-search__drawer-apply-count">
                ({activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} applied)
              </span>
            )}
          </button>
        </footer>
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
