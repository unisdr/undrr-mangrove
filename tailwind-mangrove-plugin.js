const plugin = require('tailwindcss/plugin');

module.exports = plugin(function ({ addUtilities, theme }) {
  // Generate Mangrove-style margin utilities
  // Example: .mg-u-margin-top-100 → margin-top: 1rem
  const spacing = theme('spacing');
  const marginUtilities = {};

  Object.keys(spacing).forEach(key => {
    const value = spacing[key];
    const sides = {
      top: 'margin-top',
      right: 'margin-right',
      bottom: 'margin-bottom',
      left: 'margin-left',
    };

    Object.entries(sides).forEach(([side, property]) => {
      marginUtilities[`.mg-u-margin-${side}-${key}`] = {
        [property]: value,
      };
    });

    // All sides
    marginUtilities[`.mg-u-margin-${key}`] = {
      margin: value,
    };
  });

  // X and Y axis utilities
  Object.keys(spacing).forEach(key => {
    const value = spacing[key];
    marginUtilities[`.mg-u-margin-x-${key}`] = {
      'margin-left': value,
      'margin-right': value,
    };
    marginUtilities[`.mg-u-margin-y-${key}`] = {
      'margin-top': value,
      'margin-bottom': value,
    };
  });

  // Auto margin
  marginUtilities['.mg-u-margin-x-auto'] = {
    'margin-left': 'auto',
    'margin-right': 'auto',
  };

  // Generate Mangrove-style padding utilities
  const paddingUtilities = {};

  Object.keys(spacing).forEach(key => {
    const value = spacing[key];
    const sides = {
      top: 'padding-top',
      right: 'padding-right',
      bottom: 'padding-bottom',
      left: 'padding-left',
    };

    Object.entries(sides).forEach(([side, property]) => {
      paddingUtilities[`.mg-u-padding-${side}-${key}`] = {
        [property]: value,
      };
    });

    paddingUtilities[`.mg-u-padding-${key}`] = {
      padding: value,
    };
  });

  // X and Y axis utilities
  Object.keys(spacing).forEach(key => {
    const value = spacing[key];
    paddingUtilities[`.mg-u-padding-x-${key}`] = {
      'padding-left': value,
      'padding-right': value,
    };
    paddingUtilities[`.mg-u-padding-y-${key}`] = {
      'padding-top': value,
      'padding-bottom': value,
    };
  });

  // Display utilities with Mangrove naming
  const displayUtilities = {
    '.mg-u-display--block': { display: 'block' },
    '.mg-u-display--inline-block': { display: 'inline-block' },
    '.mg-u-display--inline': { display: 'inline' },
    '.mg-u-display--flex': { display: 'flex' },
    '.mg-u-display--inline-flex': { display: 'inline-flex' },
    '.mg-u-display--grid': { display: 'grid' },
    '.mg-u-display--none': { display: 'none' },
  };

  // Flexbox utilities with Mangrove naming
  const flexUtilities = {
    '.mg-u-flex-direction--row': { 'flex-direction': 'row' },
    '.mg-u-flex-direction--row-reverse': { 'flex-direction': 'row-reverse' },
    '.mg-u-flex-direction--column': { 'flex-direction': 'column' },
    '.mg-u-flex-direction--column-reverse': {
      'flex-direction': 'column-reverse',
    },

    '.mg-u-flex-wrap--wrap': { 'flex-wrap': 'wrap' },
    '.mg-u-flex-wrap--nowrap': { 'flex-wrap': 'nowrap' },
    '.mg-u-flex-wrap--wrap-reverse': { 'flex-wrap': 'wrap-reverse' },

    '.mg-u-justify-content--start': { 'justify-content': 'flex-start' },
    '.mg-u-justify-content--end': { 'justify-content': 'flex-end' },
    '.mg-u-justify-content--center': { 'justify-content': 'center' },
    '.mg-u-justify-content--between': { 'justify-content': 'space-between' },
    '.mg-u-justify-content--around': { 'justify-content': 'space-around' },
    '.mg-u-justify-content--evenly': { 'justify-content': 'space-evenly' },

    '.mg-u-align-items--start': { 'align-items': 'flex-start' },
    '.mg-u-align-items--end': { 'align-items': 'flex-end' },
    '.mg-u-align-items--center': { 'align-items': 'center' },
    '.mg-u-align-items--baseline': { 'align-items': 'baseline' },
    '.mg-u-align-items--stretch': { 'align-items': 'stretch' },

    '.mg-u-align-self--start': { 'align-self': 'flex-start' },
    '.mg-u-align-self--end': { 'align-self': 'flex-end' },
    '.mg-u-align-self--center': { 'align-self': 'center' },
    '.mg-u-align-self--baseline': { 'align-self': 'baseline' },
    '.mg-u-align-self--stretch': { 'align-self': 'stretch' },

    '.mg-u-flex--1': { flex: '1 1 0%' },
    '.mg-u-flex--auto': { flex: '1 1 auto' },
    '.mg-u-flex--none': { flex: 'none' },
    '.mg-u-flex-grow--0': { 'flex-grow': '0' },
    '.mg-u-flex-grow--1': { 'flex-grow': '1' },
    '.mg-u-flex-shrink--0': { 'flex-shrink': '0' },
    '.mg-u-flex-shrink--1': { 'flex-shrink': '1' },
  };

  // Gap utilities (using spacing tokens)
  const gapUtilities = {};
  Object.keys(spacing).forEach(key => {
    const value = spacing[key];
    gapUtilities[`.mg-u-gap-${key}`] = { gap: value };
    gapUtilities[`.mg-u-gap-x-${key}`] = { 'column-gap': value };
    gapUtilities[`.mg-u-gap-y-${key}`] = { 'row-gap': value };
  });

  // Typography utilities
  const typographyUtilities = {
    '.mg-u-text-align--left': { 'text-align': 'left' },
    '.mg-u-text-align--center': { 'text-align': 'center' },
    '.mg-u-text-align--right': { 'text-align': 'right' },
    '.mg-u-text-align--justify': { 'text-align': 'justify' },

    '.mg-u-text-transform--uppercase': { 'text-transform': 'uppercase' },
    '.mg-u-text-transform--lowercase': { 'text-transform': 'lowercase' },
    '.mg-u-text-transform--capitalize': { 'text-transform': 'capitalize' },
    '.mg-u-text-transform--none': { 'text-transform': 'none' },

    '.mg-u-text-decoration--underline': { 'text-decoration': 'underline' },
    '.mg-u-text-decoration--none': { 'text-decoration': 'none' },
    '.mg-u-text-decoration--line-through': {
      'text-decoration': 'line-through',
    },

    '.mg-u-white-space--normal': { 'white-space': 'normal' },
    '.mg-u-white-space--nowrap': { 'white-space': 'nowrap' },
    '.mg-u-white-space--pre': { 'white-space': 'pre' },
    '.mg-u-white-space--pre-wrap': { 'white-space': 'pre-wrap' },

    '.mg-u-text-overflow--truncate': {
      overflow: 'hidden',
      'text-overflow': 'ellipsis',
      'white-space': 'nowrap',
    },

    '.mg-u-vertical-align--baseline': { 'vertical-align': 'baseline' },
    '.mg-u-vertical-align--top': { 'vertical-align': 'top' },
    '.mg-u-vertical-align--middle': { 'vertical-align': 'middle' },
    '.mg-u-vertical-align--bottom': { 'vertical-align': 'bottom' },
  };

  // Font size utilities with Mangrove naming
  const fontSizeUtilities = {};
  const fontSizes = theme('fontSize');
  Object.keys(fontSizes).forEach(key => {
    fontSizeUtilities[`.mg-u-font-size--${key}`] = {
      'font-size': fontSizes[key],
    };
  });

  // Font weight utilities
  const fontWeightUtilities = {};
  const fontWeights = theme('fontWeight');
  Object.keys(fontWeights).forEach(key => {
    fontWeightUtilities[`.mg-u-font-weight--${key}`] = {
      'font-weight': fontWeights[key],
    };
  });

  // Line height utilities
  const lineHeightUtilities = {};
  const lineHeights = theme('lineHeight');
  Object.keys(lineHeights).forEach(key => {
    lineHeightUtilities[`.mg-u-line-height--${key}`] = {
      'line-height': lineHeights[key],
    };
  });

  // Additional line height options
  lineHeightUtilities['.mg-u-line-height--none'] = { 'line-height': '1' };
  lineHeightUtilities['.mg-u-line-height--tight'] = { 'line-height': '1.25' };
  lineHeightUtilities['.mg-u-line-height--normal'] = { 'line-height': '1.5' };
  lineHeightUtilities['.mg-u-line-height--relaxed'] = {
    'line-height': '1.75',
  };

  // Border utilities
  const borderUtilities = {
    '.mg-u-border': { border: '1px solid #999999' },
    '.mg-u-border--none': { border: '0' },
    '.mg-u-border-top': { 'border-top': '1px solid #999999' },
    '.mg-u-border-right': { 'border-right': '1px solid #999999' },
    '.mg-u-border-bottom': { 'border-bottom': '1px solid #999999' },
    '.mg-u-border-left': { 'border-left': '1px solid #999999' },

    '.mg-u-border-width--0': { 'border-width': '0' },
    '.mg-u-border-width--1': { 'border-width': '1px' },
    '.mg-u-border-width--2': { 'border-width': '2px' },
    '.mg-u-border-width--4': { 'border-width': '4px' },

    '.mg-u-border-style--solid': { 'border-style': 'solid' },
    '.mg-u-border-style--dashed': { 'border-style': 'dashed' },
    '.mg-u-border-style--dotted': { 'border-style': 'dotted' },
    '.mg-u-border-style--none': { 'border-style': 'none' },
  };

  // Border radius utilities
  const borderRadiusUtilities = {};
  const borderRadii = theme('borderRadius');
  Object.keys(borderRadii).forEach(key => {
    const className =
      key === 'DEFAULT' ? '.mg-u-border-radius' : `.mg-u-border-radius--${key}`;
    borderRadiusUtilities[className] = { 'border-radius': borderRadii[key] };
  });

  // Box shadow utilities
  const boxShadowUtilities = {};
  const boxShadows = theme('boxShadow');
  Object.keys(boxShadows).forEach(key => {
    const className =
      key === 'DEFAULT' ? '.mg-u-box-shadow' : `.mg-u-box-shadow--${key}`;
    boxShadowUtilities[className] = { 'box-shadow': boxShadows[key] };
  });

  // Position utilities
  const positionUtilities = {
    '.mg-u-position--static': { position: 'static' },
    '.mg-u-position--relative': { position: 'relative' },
    '.mg-u-position--absolute': { position: 'absolute' },
    '.mg-u-position--fixed': { position: 'fixed' },
    '.mg-u-position--sticky': { position: 'sticky' },

    '.mg-u-inset-0': { top: '0', right: '0', bottom: '0', left: '0' },
    '.mg-u-top-0': { top: '0' },
    '.mg-u-right-0': { right: '0' },
    '.mg-u-bottom-0': { bottom: '0' },
    '.mg-u-left-0': { left: '0' },
  };

  // Z-index utilities
  const zIndexUtilities = {
    '.mg-u-z-index--0': { 'z-index': '0' },
    '.mg-u-z-index--10': { 'z-index': '10' },
    '.mg-u-z-index--20': { 'z-index': '20' },
    '.mg-u-z-index--30': { 'z-index': '30' },
    '.mg-u-z-index--40': { 'z-index': '40' },
    '.mg-u-z-index--50': { 'z-index': '50' },
    '.mg-u-z-index--auto': { 'z-index': 'auto' },
  };

  // Width/height utilities
  const sizingUtilities = {
    '.mg-u-width--auto': { width: 'auto' },
    '.mg-u-width--full': { width: '100%' },
    '.mg-u-width--screen': { width: '100vw' },
    '.mg-u-width--half': { width: '50%' },
    '.mg-u-width--third': { width: '33.333333%' },
    '.mg-u-width--quarter': { width: '25%' },

    '.mg-u-height--auto': { height: 'auto' },
    '.mg-u-height--full': { height: '100%' },
    '.mg-u-height--screen': { height: '100vh' },

    '.mg-u-max-width--none': { 'max-width': 'none' },
    '.mg-u-max-width--full': { 'max-width': '100%' },
    '.mg-u-max-width--prose': { 'max-width': '65ch' },

    '.mg-u-min-height--0': { 'min-height': '0' },
    '.mg-u-min-height--full': { 'min-height': '100%' },
    '.mg-u-min-height--screen': { 'min-height': '100vh' },

    '.mg-u-min-width--0': { 'min-width': '0' },
    '.mg-u-min-width--full': { 'min-width': '100%' },
  };

  // Overflow utilities
  const overflowUtilities = {
    '.mg-u-overflow--auto': { overflow: 'auto' },
    '.mg-u-overflow--hidden': { overflow: 'hidden' },
    '.mg-u-overflow--visible': { overflow: 'visible' },
    '.mg-u-overflow--scroll': { overflow: 'scroll' },
    '.mg-u-overflow-x--auto': { 'overflow-x': 'auto' },
    '.mg-u-overflow-x--hidden': { 'overflow-x': 'hidden' },
    '.mg-u-overflow-y--auto': { 'overflow-y': 'auto' },
    '.mg-u-overflow-y--hidden': { 'overflow-y': 'hidden' },
  };

  // Add all utilities
  addUtilities(marginUtilities);
  addUtilities(paddingUtilities);
  addUtilities(displayUtilities);
  addUtilities(flexUtilities);
  addUtilities(gapUtilities);
  addUtilities(typographyUtilities);
  addUtilities(fontSizeUtilities);
  addUtilities(fontWeightUtilities);
  addUtilities(lineHeightUtilities);
  addUtilities(borderUtilities);
  addUtilities(borderRadiusUtilities);
  addUtilities(boxShadowUtilities);
  addUtilities(positionUtilities);
  addUtilities(zIndexUtilities);
  addUtilities(sizingUtilities);
  addUtilities(overflowUtilities);
});
