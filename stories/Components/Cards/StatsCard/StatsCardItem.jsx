import React from 'react';
import PropTypes from 'prop-types';

/**
 * StatsCardItem Component
 *
 * Displays an individual statistic with optional icon, labels, description,
 * and link. Used as a child component within StatsCard.
 *
 * When a `link` prop is provided, the entire stat item becomes clickable
 * while still allowing additional links (like descriptionLink) to work independently.
 */
export function StatsCardItem({
  icon,
  topLabel,
  value,
  bottomLabel,
  description,
  descriptionLink,
  link,
  className = '',
  ...props
}) {
  const baseClass = 'mg-stats-card-item';

  const classes = [
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
      {topLabel && (
        <span className={`${baseClass}__top-label`}>
          {topLabel}
        </span>
      )}
      {valueContent}
      <strong className={`${baseClass}__bottom-label`}>
        {bottomLabel}
      </strong>
      {description && (
        <p className={`${baseClass}__description`}>
          {description}
          {descriptionLink && (
            <>
              {' '}
              <a
                href={descriptionLink.url}
                className={`${baseClass}__link`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {descriptionLink.text}
                <span className="mg-u-sr-only"> (opens in new tab)</span>
              </a>
            </>
          )}
        </p>
      )}
    </article>
  );
}

StatsCardItem.propTypes = {
  /** Icon class name (e.g., "mg-icon fa-globe") */
  icon: PropTypes.string,
  /** Label displayed above the value (e.g., "Target A", "Priority 1") */
  topLabel: PropTypes.string,
  /** The main statistic value (e.g., "1,500+", "45%", "$223B") */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  /** Label displayed below the value */
  bottomLabel: PropTypes.string.isRequired,
  /** Optional descriptive text providing context */
  description: PropTypes.string,
  /** Optional link within the description (remains clickable independently) */
  descriptionLink: PropTypes.shape({
    /** Link text */
    text: PropTypes.string.isRequired,
    /** Link URL */
    url: PropTypes.string.isRequired,
  }),
  /** URL to make the entire stat item clickable */
  link: PropTypes.string,
  /** Additional CSS class names */
  className: PropTypes.string,
};

export default StatsCardItem;
