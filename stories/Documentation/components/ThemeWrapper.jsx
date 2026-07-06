import React, { useEffect } from 'react';

// Import default theme for MDX pages that may not trigger the global decorator
import themeUNDRR from '../../assets/scss/style.scss';

/**
 * Wrapper component for MDX pages that need Mangrove theme CSS.
 *
 * This component ensures the default theme is loaded for MDX documentation pages.
 * Theme switching via the toolbar is handled by the global themeDecorator in
 * .storybook/preview.js when stories are rendered.
 *
 * Note: We cannot use useGlobals() here because Storybook preview hooks
 * can only be called inside decorators and story functions, not regular components.
 */
const ThemeWrapper = ({ children }) => {
  useEffect(() => {
    // Load default theme if not already active
    // The global themeDecorator will override this when themes are switched
    if (themeUNDRR) {
      themeUNDRR.use();
    }

    // Cleanup on unmount
    return () => {
      if (themeUNDRR) {
        themeUNDRR.unuse();
      }
    };
  }, []);

  return <>{children}</>;
};

export default ThemeWrapper;
