import React, { useEffect, useRef } from "react";
import "./footer.scss";

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
  syndicationConfig = {
    contenttype: "landingpage",
    pageid: "83835",
    includemetatags: false,
    includecss: false,
    suffixID: "footer",
    activedomain: "www.undrr.org",
  },
  complementaryContent = null,
  children,
  className,
  ...args
}) {
  const syndicationRef = useRef(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (!enableSyndication || scriptLoadedRef.current) return;

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

    // Load UNDRR common theme stylesheets (temporary until https://gitlab.com/undrr/web-backlog/-/issues/2233 is fixed)
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

    // Load the PW Widget script if not already loaded
    const existingScript = document.querySelector(
      'script[src*="preventionweb.net/widget.js"]',
    );

    if (!existingScript) {
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.src = `https://publish.preventionweb.net/widget.js?rand=${Math.random().toString(36).substring(7)}`;
      script.onload = () => {
        initializeSyndication();
      };
      document.head.appendChild(script);
    } else {
      // Script already exists, initialize directly
      initializeSyndication();
    }

    scriptLoadedRef.current = true;

    return () => {
      // Cleanup if component unmounts
      if (syndicationRef.current) {
        syndicationRef.current.innerHTML = "";
      }
    };
  }, [enableSyndication, syndicationConfig]);

  const initializeSyndication = () => {
    if (window.PW_Widget && syndicationRef.current) {
      try {
        new window.PW_Widget.initialize({
          ...syndicationConfig,
          suffixID: `${syndicationConfig.suffixID}-${Math.random().toString(36).substring(7)}`,
        });
      } catch (error) {
        console.warn("Failed to initialize UNDRR syndication:", error);
        if (syndicationRef.current) {
          syndicationRef.current.innerHTML =
            "<p>Unable to load syndicated footer content.</p>";
        }
      }
    }
  };

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
            className={`pw-widget-${syndicationConfig.suffixID}`}
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
