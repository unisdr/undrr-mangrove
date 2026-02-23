/* eslint-disable react/no-danger */
import React from 'react';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';

/**
 * StatsCardItem Component
 *
 * Displays an individual statistic with optional icon, labels, description,
 * and link. Used as a child component within StatsCard.
 *
 * When a `link` prop is provided, the entire stat item becomes clickable
 * while still allowing inline links in the description to work independently.
 */
export function StatsCardItem({
  icon,
  label,
  value,
  bottomLabel,
  summaryText,
  link,
  className = '',
  ...props
}) {
  const baseClass = 'mg-stats-card-item';

  const classes = [
    'mg-card',
    baseClass,
    link && `${baseClass}--linked`,
    className,
  ].filter(Boolean).join(' ');

  // Render value as link or data element
  const valueContent = link ? (
    <a href={link} className={`${baseClass}__value`}>
      {value}
    </a>
  ) : (
    <data className={`${baseClass}__value`} value={value}>
      {value}
    </data>
  );

  return (
    <article className={classes} {...props}>
      {icon && (
        <span className={`${baseClass}__icon`} aria-hidden="true">
          <span className={icon}></span>
        </span>
      )}
      {label && (
        <span className={`${baseClass}__label`}>
          {label}
        </span>
      )}
      {valueContent}
      {bottomLabel && (
        <strong className={`${baseClass}__bottom-label`}>
          {bottomLabel}
        </strong>
      )}
      {summaryText && (
        <p
          className={`${baseClass}__summary`}
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(summaryText),
          }}
        />
      )}
    </article>
  );
}

StatsCardItem.propTypes = {
  /** Icon class name (e.g., "mg-icon mg-icon-globe") */
  icon: PropTypes.string,
  /** Label displayed above the value (e.g., "Target A", "Priority 1") */
  label: PropTypes.string,
  /** The main statistic value (e.g., "1,500+", "45%", "$223B") */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  /** Label displayed below the value */
  bottomLabel: PropTypes.string,
  /** Optional descriptive text (supports inline HTML links) */
  summaryText: PropTypes.string,
  /** URL to make the entire stat item clickable */
  link: PropTypes.string,
  /** Additional CSS class names */
  className: PropTypes.string,
};

export default StatsCardItem;
