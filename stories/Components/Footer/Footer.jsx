import React, { useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * Footer with optional UNDRR syndication. Renders site-specific content
 * (via children or complementaryContent) above a dynamically loaded global
 * UNDRR footer fetched from PreventionWeb.
 */

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(' ') : null;

// Default syndication config — also defined in scripts/ai-manifest/data/constants.js
// for the AI manifest. Keep both in sync if values change.
const defaultSyndicationConfig = {
  contenttype: 'landingpage',
  pageid: '83835',
  includemetatags: false,
  includecss: false,
  suffixID: 'footer',
  activedomain: 'www.undrr.org',
};

export function Footer({
  variant = 'default',
  enableSyndication = true,
  syndicationConfig = {},
  complementaryContent = null,
  children,
  className,
  ...args
}) {
  const syndicationRef = useRef(null);

  // Merge user config with defaults (memoized to prevent unnecessary re-renders)
  const mergedSyndicationConfig = useMemo(
    () => ({
      ...defaultSyndicationConfig,
      ...syndicationConfig,
    }),
    [syndicationConfig]
  );

  useEffect(() => {
    if (!enableSyndication) return;

    // Check if widget script is already loaded globally
    const existingWidgetScript = document.querySelector(
      'script[src*="preventionweb.net/widget.js"]'
    );

    // Always initialize the widget for this specific component instance
    const initializeWidget = () => {
      const initScript = document.createElement('script');
      initScript.type = 'text/javascript';
      initScript.innerHTML = `
        if (window.PW_Widget) {
          new PW_Widget.initialize({
            contenttype: "${mergedSyndicationConfig.contenttype}",
            pageid: "${mergedSyndicationConfig.pageid}",
            includemetatags: ${mergedSyndicationConfig.includemetatags},
            includecss: ${mergedSyndicationConfig.includecss},
            suffixID: "${mergedSyndicationConfig.suffixID}",
            activedomain: "${mergedSyndicationConfig.activedomain}"
          });
        }
      `;
      document.head.appendChild(initScript);
    };

    if (!existingWidgetScript) {
      // Create and inject the widget script (only once globally)
      const widgetScript = document.createElement('script');
      widgetScript.type = 'text/javascript';
      widgetScript.src =
        'https://publish.preventionweb.net/widget.js?rand=3d797b';

      // Add widget script first
      document.head.appendChild(widgetScript);

      // Initialize this specific widget instance after script loads
      widgetScript.onload = () => {
        initializeWidget();
      };

      // Handle script loading errors
      widgetScript.onerror = () => {
        console.warn('Failed to load UNDRR syndication widget');
        if (syndicationRef.current) {
          syndicationRef.current.innerHTML =
            '<p>Unable to load syndicated footer content.</p>';
        }
      };
    } else {
      // Widget script already exists, initialize immediately
      initializeWidget();
    }

    return () => {
      // Cleanup if component unmounts
      if (syndicationRef.current) {
        syndicationRef.current.innerHTML = '';
      }
    };
  }, [enableSyndication, mergedSyndicationConfig]);

  return (
    <footer className={cls('mg-footer', className)} {...args}>
      {/* Site-specific complementary footer content */}
      {(complementaryContent || children) && (
        <>{complementaryContent || children}</>
      )}

      {/* UNDRR Syndicated footer content */}
      {enableSyndication && (
        <div
          className={`pw-widget-${mergedSyndicationConfig.suffixID}`}
          ref={syndicationRef}
        >
          Loading UNDRR footer content...
        </div>
      )}
    </footer>
  );
}

Footer.propTypes = {
  /** Visual variant of the footer. */
  variant: PropTypes.string,
  /** When true, loads the PreventionWeb syndication widget to inject global UNDRR footer content. */
  enableSyndication: PropTypes.bool,
  /** Override defaults for the syndication widget (contenttype, pageid, suffixID, activedomain, includecss, includemetatags). */
  syndicationConfig: PropTypes.shape({
    contenttype: PropTypes.string,
    pageid: PropTypes.string,
    includemetatags: PropTypes.bool,
    includecss: PropTypes.bool,
    suffixID: PropTypes.string,
    activedomain: PropTypes.string,
  }),
  /** Site-specific content rendered above the syndicated footer. Alternative to children. */
  complementaryContent: PropTypes.node,
  /** Site-specific content rendered above the syndicated footer. Alternative to complementaryContent. */
  children: PropTypes.node,
  /** Additional CSS class(es) on the footer element. */
  className: PropTypes.string,
};
