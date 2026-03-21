import React from 'react';

/**
 * Heading Component
 *
 * Renders a semantic heading element (h1-h6).
 *
 * @param {string|number} type - Heading level: "1"-"6" or 1-6 (default: 2)
 * @param {React.ReactNode} children - The heading content
 * @param {string} className - Additional CSS classes
 * @param {number} tabIndex - Tab index for accessibility
 */
export const Heading = ({
  type = 2,
  children,
  className,
  tabIndex,
  ...props
}) => {
  const level = Math.min(Math.max(parseInt(type, 10) || 2, 1), 6);
  const Tag = `h${level}`;

  return (
    <Tag className={className} tabIndex={tabIndex} {...props}>
      {children}
    </Tag>
  );
};
