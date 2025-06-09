import React, { useEffect, useRef, useMemo } from "react";

/**
 * Footer component with UNDRR Syndication support
 *
 * This component provides a standardized footer that can include:
 * 1. Site-specific complementary content (passed as children)
 * 2. Global UNDRR syndicated footer content loaded dynamically
 */

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(" ") : null;

export function Footer({
  variant = "default",
  enableSyndication = true,
  syndicationConfig = {},
  complementaryContent = null,
  children,
  className,
  ...args
}) {
  const syndicationRef = useRef(null);

  // Default syndication configuration
  const defaultSyndicationConfig = {
    contenttype: "landingpage",
    pageid: "83835",
    includemetatags: false,
    includecss: false,
    suffixID: "footer",
    activedomain: "www.undrr.org",
  };

  // Merge user config with defaults (memoized to prevent unnecessary re-renders)
  const mergedSyndicationConfig = useMemo(() => ({
    ...defaultSyndicationConfig,
    ...syndicationConfig,
  }), [syndicationConfig]);

  useEffect(() => {
    if (!enableSyndication) return;



    // todo: make this loading optional and only run once
    // Load UNDRR common theme stylesheets (temporary until https://gitlab.com/undrr/web-backlog/-/issues/2233 is fixed)
    // Load required stylesheets for syndicated content (temporary measure)
    const loadStylesheet = (href, id) => {
      if (
        !document.querySelector(`link[href*="${href}"]`) &&
        !document.getElementById(id)
      ) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        link.id = id;
        document.head.appendChild(link);
      }
    };

    const cacheBuster = new Date().getTime();
    loadStylesheet(
      `https://www.preventionweb.net/modules/contrib/gutenberg/js/vendor/gutenberg/block-library/style.css?cacheBuster=${cacheBuster}`,
      "pw-gutenberg-styles",
    );

    // Load UNDRR Mangrove styles
    loadStylesheet(
      "https://www.preventionweb.net/themes/custom/pw/css/mangrove/mangrove.css",
      "undrr-mangrove-styles",
    );

    loadStylesheet(
      `https://www.preventionweb.net/themes/custom/undrr_common/css/base.css?cacheBuster=${cacheBuster}`,
      "undrr-common-base",
    );

    loadStylesheet(
      `https://www.preventionweb.net/themes/custom/undrr_common/css/layout.css?cacheBuster=${cacheBuster}`,
      "undrr-common-layout",
    );

    loadStylesheet(
      `https://www.preventionweb.net/themes/custom/undrr_common/css/components/colors.css?cacheBuster=${cacheBuster}`,
      "undrr-common-colors",
    );

    loadStylesheet(
      `https://www.preventionweb.net/themes/custom/undrr_common/css/components/footer.css?cacheBuster=${cacheBuster}`,
      "undrr-common-footer",
    );

    // Check if widget script is already loaded globally
    const existingWidgetScript = document.querySelector(
      'script[src*="preventionweb.net/widget.js"]',
    );

    // Always initialize the widget for this specific component instance
    const initializeWidget = () => {
      const initScript = document.createElement("script");
      initScript.type = "text/javascript";
      console.log("mergedSyndicationConfig", mergedSyndicationConfig.suffixID);
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
      const widgetScript = document.createElement("script");
      widgetScript.type = "text/javascript";
      widgetScript.src =
        "https://publish.preventionweb.net/widget.js?rand=3d797b";

      // Add widget script first
      document.head.appendChild(widgetScript);

      // Initialize this specific widget instance after script loads
      widgetScript.onload = () => {
        initializeWidget();
      };

      // Handle script loading errors
      widgetScript.onerror = () => {
        console.warn("Failed to load UNDRR syndication widget");
        if (syndicationRef.current) {
          syndicationRef.current.innerHTML =
            "<p>Unable to load syndicated footer content.</p>";
        }
      };
    } else {
      // Widget script already exists, initialize immediately
      initializeWidget();
    }

    return () => {
      // Cleanup if component unmounts
      if (syndicationRef.current) {
        syndicationRef.current.innerHTML = "";
      }
    };
      }, [enableSyndication, mergedSyndicationConfig]);

  const footerClasses = cls(
    "mangrove-footer",
    variant && `mangrove-footer--${variant}`,
    className,
  );

  return (
    <footer className={footerClasses} {...args}>
      {/* Site-specific complementary footer content */}
      {(complementaryContent || children) && (
        <section className="mangrove-footer__complementary">
          {complementaryContent || children}
        </section>
      )}

      {/* UNDRR Syndicated footer content */}
      {enableSyndication && (
        <section className="mangrove-footer__syndicated">
          <div
            className={`pw-widget-${mergedSyndicationConfig.suffixID}`}
            ref={syndicationRef}
          >
            Loading UNDRR footer content...
          </div>
        </section>
      )}
    </footer>
  );
}

Footer.defaultProps = {
  variant: "default",
  enableSyndication: true,
};
