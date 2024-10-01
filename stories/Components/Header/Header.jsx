// import React from 'react';

// export function Header() {
//   return (
//     <div>Header</div>
//   );
// }

import React from 'react';
import PropTypes from 'prop-types';
// import './Header.scss'; // This should be imported in components.scss instead

// Functional component definition using arrow function syntax
// Props are destructured in the function parameters
const Header = ({ title, children, variant }) => {
  // The component returns JSX, which is a syntax extension for JavaScript
  // It allows us to write HTML-like code in our JavaScript
  return (
    // We use the 'mg-' prefix for our CSS classes to namespace them
    // This helps avoid conflicts with other styles and clearly identifies our components
    <div className={`mg-boilerplate mg-boilerplate--${variant}`}>
      {/* The title prop is rendered inside an h2 element */}
      <h2 className="mg-boilerplate__title">{title}</h2>
      {/* The children prop allows for nested content to be passed to this component */}
      <div className="mg-boilerplate__content">
        {children}
      </div>
    </div>
  );
};

// PropTypes are used for type-checking the props passed to the component
// This helps catch errors early and serves as documentation
Header.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary']),
};

// Default props are used when a prop is not provided by the parent component
Header.defaultProps = {
  variant: 'primary',
};

export default Header;