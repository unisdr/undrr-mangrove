import { getLanguageProps } from '../../../src/i18n';
import { getMegaMenuLabels } from './_labels';
import React, { useState, useEffect, useRef, useId } from 'react';
import PropTypes from 'prop-types';
import { TopBar } from './TopBar/TopBar';
import { Sidebar } from './TopBar/Sidebar';

export { getMegaMenuLabels } from './_labels';
export { DEFAULT_MEGAMENU_LABELS } from './_labels';

/**
 * MegaMenu component. Multi-level navigation with sections and items.
 *
 * Pass `logoSrc` to get the branded variant: the logo sits at inline-start
 * of the nav strip, next to the menu items. Useful for sub-branded sites
 * like PreventionWeb or MCR2030.
 *
 * Language prefixes: this component does not detect `/ar/`, `/fr/`, etc.
 * The wrapper layer (Drupal, Twig, whatever) should pass the right
 * `logoHref`, e.g. `data-mg-mega-menu-logo-href="/ar/"` on Arabic pages.
 *
 * Each section has a top-level menu item label (`title`, required); an
 * optional `icon` class name shown before the title on the desktop topbar
 * (e.g. "mg-icon mg-icon-chart-bar"); `bannerHeading` and
 * `bannerDescription` text for the section banner; an optional
 * `bannerButton` with a `label` and `url`; and `items`, the section's menu
 * items, each with a `title`, a `url` and optional nested `items`.
 * `bannerDescription` is rendered via `dangerouslySetInnerHTML` so authored
 * links and inline markup survive; Mangrove does not sanitise it, so
 * sanitise it where the sections array is built. See "Banner HTML trust
 * contract" in MegaMenu.mdx.
 *
 * @param {Object} props
 * @param {Array<{title: string, icon?: string, bannerHeading?: string, bannerDescription?: string, bannerButton?: {label?: string, url?: string}, items?: Array<{title: string, url?: string, items?: Array}>}>} props.sections Array of section objects containing menu structure (fields above)
 * @param {number} [props.delay]                       Deprecated and ignored since 2.0 (panels no longer close on mouse leave)
 * @param {number} [props.hoverDelay]                  Deprecated and ignored since 2.0 (panels no longer open on hover)
 * @param {string} [props.logoSrc]                     Image URL for a logo at inline-start of the nav strip (enables branded variant)
 * @param {string} [props.logoAlt='']                  Alt text for the logo image
 * @param {string} [props.logoHref='/']                Where the logo links to. Defaults to `/`; on multilingual sites, pass the language-prefixed root from the CMS (e.g. `/ar/`)
 * @param {number} [props.logoWidth]                   Optional explicit width for CLS prevention
 * @param {number} [props.logoHeight]                  Optional explicit height for CLS prevention
 * @param {boolean} [props.enableFilter=false]         Whether to show quick filter input in desktop and mobile navigation
 * @param {boolean} [props.enableSiteSearch=true]      Whether to offer full-site search option when filtering
 * @param {string} [props.searchUrl='/search']         Base URL for full-site search (defaults to syndicated search page /search)
 * @param {Function} [props.onNavigate]                Called with the link's `href` when a visitor follows a quick filter result (including the full-site search link), in place of the browser's own navigation (modified clicks still open normally); for client-side routers
 * @param {string} [props.lang]                        UI language tag; selects the built-in catalogue, with English fallback
 * @param {'ltr'|'rtl'|'auto'} [props.dir]             Explicit text direction; otherwise known catalogue languages select their direction
 * @param {{navLabel?: string, closeMobileNavLabel?: string, menuLabel?: string, backLabel?: string, allSectionsLabel?: string, closeLabel?: string, overviewLabel?: string, toggleMobileNavLabel?: string, menuFilterLabel?: string, filterPlaceholder?: string, clearFilterLabel?: string, noFilterResultsLabel?: string, searchSiteLabel?: string, filterMatchesCount?: string}} [props.labels] Explicit UI label overrides; omitted keys use the selected catalogue, then English
 * @param {string} [props.analyticsRegion='mega-menu'] `data-vf-google-analytics-region` on the root `<nav>`; pass `null` or `''` to inherit the host's region
 * @returns {JSX.Element} Rendered MegaMenu component
 */
const MegaMenu = ({
  sections,
  logoSrc,
  logoAlt = '',
  logoHref = '/',
  logoWidth,
  logoHeight,
  enableFilter = false,
  enableSiteSearch = true,
  searchUrl = '/search',
  onNavigate,
  lang,
  dir,
  labels,
  analyticsRegion = 'mega-menu',
}) => {
  const resolvedLabels = getMegaMenuLabels(lang, labels);
  const { navLabel, closeMobileNavLabel } = resolvedLabels;
  const sidebarId = useId();
  const wrapperRef = useRef(null);
  const [initialSection, setInitialSection] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [retained, setRetained] = useState(false);
  const present = showSidebar || retained;
  const [activeItem, setActiveItem] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [jsActive, setJsActive] = useState(false);

  const itemListRef = useRef([]);
  const sectionListRef = useRef([]);

  // Keep the surface mounted briefly for its exit transition, but release
  // focus/scroll and remove it from interaction immediately when closed.
  useEffect(() => {
    if (showSidebar) {
      setRetained(true);
      return;
    }
    if (!retained) return;
    const surface = wrapperRef.current?.querySelector(
      '.mg-mega-mobile-sidebar'
    );
    // Read the actual CSS timing after closing: tokens can be themed, and
    // reduced motion/forced colours disable the transition entirely.
    const style =
      surface && surface.ownerDocument.defaultView.getComputedStyle(surface);
    const toMilliseconds = time =>
      (parseFloat(time) || 0) * (time.trim().endsWith('ms') ? 1 : 1000);
    const durations = (style?.transitionDuration || '0s')
      .split(',')
      .map(toMilliseconds);
    const delays = (style?.transitionDelay || '0s')
      .split(',')
      .map(toMilliseconds);
    const properties = (style?.transitionProperty || 'all').split(',');
    const exitDuration = Math.max(
      0,
      ...properties.map((property, index) =>
        property.trim() === 'none'
          ? 0
          : durations[index % durations.length] + delays[index % delays.length]
      )
    );
    const timeout = setTimeout(() => setRetained(false), exitDuration);
    return () => clearTimeout(timeout);
  }, [showSidebar, retained]);

  // Signal that JS has mounted and the sidebar is available to handle mobile nav.
  // Retain the enhancement marker for consumers of the navigation markup.
  useEffect(() => {
    setJsActive(true);
  }, []);

  // Move focus from inside a desktop panel to that panel's trigger.
  const focusTriggerOf = element =>
    element
      ?.closest('.mg-mega-content')
      ?.closest('.mg-mega-topbar__item')
      ?.querySelector('.mg-mega-topbar__item-link')
      ?.focus();

  const releaseDesktopFocus = () => {
    const focused = wrapperRef.current?.ownerDocument.activeElement;
    if (wrapperRef.current?.contains(focused)) focusTriggerOf(focused);
  };

  // Desktop panels follow the WAI-ARIA APG disclosure navigation pattern:
  // a panel opens and closes only when its button is activated (click,
  // Enter or Space), never on hover or focus. See "Design principles" in
  // MegaMenu.mdx for the sources and the reasons.
  const toggleItem = item => {
    setActiveItem(current => (current === item ? null : item));
  };

  const handleEscape = e => {
    if (e.key === 'Escape') {
      // Return keyboard focus before the exiting desktop panel becomes inert.
      focusTriggerOf(e.target);
      setActiveItem(null);
    }
  };

  // Close the open panel when keyboard focus moves to something outside the
  // navigation. A null relatedTarget (a click on non-focusable content, or
  // the window losing focus) is left to the outside-click handler, so a
  // Safari click on the trigger, which does not focus it, still toggles.
  const handleFocusOut = e => {
    const next = e.relatedTarget;
    if (next && !wrapperRef.current?.contains(next)) setActiveItem(null);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = e => {
      // Check if click is outside the mega menu wrapper
      const megaWrapper = wrapperRef.current;
      // Mode changes can remove the clicked control before this document
      // listener runs. Its original event path still identifies an inside click.
      const clickedInside =
        megaWrapper?.contains(e.target) ||
        (e.composedPath?.() || []).includes(megaWrapper);
      if (megaWrapper && !clickedInside) {
        releaseDesktopFocus();
        setActiveItem(null);
      }
    };

    // Only add listener when menu is open
    if (activeItem !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [activeItem]);

  useEffect(() => {
    if (!window.matchMedia) return;
    const query = window.matchMedia('(min-width: 900px)');
    const closeOnDesktop = () => {
      setIsMobile(!query.matches);
      if (query.matches) setShowSidebar(false);
    };
    closeOnDesktop();
    query.addEventListener('change', closeOnDesktop);
    return () => query.removeEventListener('change', closeOnDesktop);
  }, []);

  return (
    <nav
      {...getLanguageProps(lang, dir)}
      ref={wrapperRef}
      className={`mg-mega-wrapper${jsActive ? ' mg-mega-wrapper--js-active' : ''}${present ? ' mg-mega-wrapper--mobile-open' : ''}`}
      onKeyDown={handleEscape}
      onBlur={handleFocusOut}
      aria-label={navLabel}
      data-vf-google-analytics-region={analyticsRegion || undefined}
    >
      <TopBar
        isMobile={isMobile}
        openMobileSection={index => {
          setInitialSection(index);
          setShowSidebar(true);
        }}
        sidebarId={sidebarId}
        labels={resolvedLabels}
        sections={sections}
        toggleItem={toggleItem}
        toggleShowSidebar={() => {
          setInitialSection(null);
          setShowSidebar(prev => !prev);
        }}
        showSidebar={showSidebar}
        activeItem={activeItem}
        activateItem={setActiveItem}
        itemListRef={itemListRef}
        sectionListRef={sectionListRef}
        logoSrc={logoSrc}
        logoAlt={logoAlt}
        logoHref={logoHref}
        logoWidth={logoWidth}
        logoHeight={logoHeight}
        enableFilter={enableFilter}
        enableSiteSearch={enableSiteSearch}
        searchUrl={searchUrl}
        onNavigate={onNavigate}
      />

      {/* Backdrop overlay – closes sidebar on click */}
      {present && (
        <button
          className={`mg-mega-mobile-sidebar-overlay${showSidebar ? ' mg-mega-mobile-sidebar-overlay--open' : ''}`}
          aria-hidden={!showSidebar}
          aria-label={closeMobileNavLabel}
          tabIndex={-1}
          data-vf-analytics-label="Mega menu: Close"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Keep the controller mounted so close and reopen reset predictably. */}
      <Sidebar
        initialSection={initialSection}
        id={sidebarId}
        labels={resolvedLabels}
        onClose={() => setShowSidebar(false)}
        present={present}
        open={showSidebar}
        sections={sections}
        enableFilter={enableFilter}
        enableSiteSearch={enableSiteSearch}
        searchUrl={searchUrl}
      />
    </nav>
  );
};

MegaMenu.propTypes = {
  /** Array of section objects containing the menu structure. */
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      icon: PropTypes.string,
      bannerHeading: PropTypes.string,
      /**
       * Banner copy. Rendered as unsanitised HTML so authored links and inline
       * markup survive; see "Banner HTML trust contract" in the MDX
       * documentation.
       */
      bannerDescription: PropTypes.string,
      bannerButton: PropTypes.shape({
        label: PropTypes.string,
        url: PropTypes.string,
      }),
      items: PropTypes.arrayOf(
        PropTypes.shape({
          title: PropTypes.string.isRequired,
          url: PropTypes.string,
          items: PropTypes.array,
        })
      ),
    })
  ).isRequired,
  /**
   * Deprecated and ignored since MegaMenu 2.0: panels no longer close when
   * the pointer leaves. Accepted so existing integrations keep working.
   */
  delay: PropTypes.number,
  /**
   * Deprecated and ignored since MegaMenu 2.0: panels no longer open on
   * hover. Accepted so existing integrations keep working.
   */
  hoverDelay: PropTypes.number,
  /** Logo image URL. Enables the branded nav variant with logo at inline-start. */
  logoSrc: PropTypes.string,
  /** Alt text for the logo. */
  logoAlt: PropTypes.string,
  /** URL the logo links to. On multilingual sites, pass the language-prefixed root. */
  logoHref: PropTypes.string,
  /** Explicit width for the logo (CLS prevention). */
  logoWidth: PropTypes.number,
  /** Explicit height for the logo (CLS prevention). */
  logoHeight: PropTypes.number,
  /** Enable live filtering of navigation items in desktop and mobile menus. */
  enableFilter: PropTypes.bool,
  /** Offer full-site search fallback option when filtering (default: true). */
  enableSiteSearch: PropTypes.bool,
  /** Base URL for full-site search (default: '/search', which routes to syndicated search #query=). */
  searchUrl: PropTypes.string,
  /** UI language tag; selects the built-in catalogue, with English fallback. */
  lang: PropTypes.string,
  /** Explicit text direction; otherwise known catalogue languages select their direction. */
  dir: PropTypes.oneOf(['ltr', 'rtl', 'auto']),
  /** Explicit UI label overrides; omitted keys use the selected catalogue, then English. */
  labels: PropTypes.shape({
    navLabel: PropTypes.string,
    closeMobileNavLabel: PropTypes.string,
    menuLabel: PropTypes.string,
    backLabel: PropTypes.string,
    allSectionsLabel: PropTypes.string,
    closeLabel: PropTypes.string,
    overviewLabel: PropTypes.string,
    toggleMobileNavLabel: PropTypes.string,
    menuFilterLabel: PropTypes.string,
    filterPlaceholder: PropTypes.string,
    clearFilterLabel: PropTypes.string,
    noFilterResultsLabel: PropTypes.string,
    searchSiteLabel: PropTypes.string,
    filterMatchesCount: PropTypes.string,
  }),
  /**
   * Click-tracker region (`data-vf-google-analytics-region`) on the root nav.
   * Pass `null` or an empty string to inherit the host's region.
   */
  analyticsRegion: PropTypes.string,
};

export default MegaMenu;
