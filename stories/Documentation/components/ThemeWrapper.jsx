import React from 'react';

/**
 * Compatibility wrapper for existing MDX imports.
 *
 * The shared preview owns theme loading and toolbar updates for stories and
 * docs-only pages. Keep this wrapper free of stylesheet effects so mounting
 * or unmounting it cannot override or remove the active preview theme.
 */
const ThemeWrapper = ({ children }) => <>{children}</>;

export default ThemeWrapper;
