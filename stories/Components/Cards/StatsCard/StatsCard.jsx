import React from 'react';
import PropTypes from 'prop-types';
import { Heading } from '../../../Atom/Typography/Heading/Heading';
import { StatsCardItem } from './StatsCardItem';

/**
 * StatsCard Component
 *
 * A flexible card component for displaying statistics and key metrics in an engaging,
 * scannable format. Supports grid layout (individual cards) or card layout
 * (grouped in a single container) with optional icons, dual labels, descriptions,
 * and call-to-action links.
 */
export function StatsCard({
  title,
  buttonLabel,
  buttonUrl,
  stats = [],
  variant = 'default',
  layout = 'grid',
  className = '',
  ...props
}) {
  const baseClass = 'mg-stats-card';
  const statsCount = stats.length;

  // Use mg-grid system for grid layout
  const gridClasses = statsCount > 0 ? `mg-grid mg-grid__col-${statsCount}` : 'mg-grid';

  const classes = [
    baseClass,
    variant && `${baseClass}--${variant}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <section className={classes} aria-label={title || 'Statistics'} {...props}>
      {title && <Heading type="2" label={title} />}
      {title && buttonLabel && buttonUrl && (
        <a href={buttonUrl} className={`${baseClass}__link`}>
          {buttonLabel}
        </a>
      )}

      {layout === 'card' ? (
        <div className={`${baseClass}__card`}>
          <div className={`${baseClass}__card-content`}>
            {stats.map((stat, index) => (
              <StatsCardItem
                key={index}
                icon={stat.icon}
                topLabel={stat.topLabel}
                value={stat.value}
                bottomLabel={stat.bottomLabel}
                description={stat.description}
                descriptionLink={stat.descriptionLink}
                link={stat.link}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className={gridClasses}>
          {stats.map((stat, index) => (
            <StatsCardItem
              key={index}
              icon={stat.icon}
              topLabel={stat.topLabel}
              value={stat.value}
              bottomLabel={stat.bottomLabel}
              description={stat.description}
              descriptionLink={stat.descriptionLink}
              link={stat.link}
            />
          ))}
        </div>
      )}

      {!title && buttonLabel && buttonUrl && (
        <a href={buttonUrl} className={`${baseClass}__link`}>
          {buttonLabel}
        </a>
      )}
    </section>
  );
}

StatsCard.propTypes = {
  /** Optional heading for the stats section */
  title: PropTypes.string,
  /** Label for the call-to-action button */
  buttonLabel: PropTypes.string,
  /** URL for the call-to-action button */
  buttonUrl: PropTypes.string,
  /** Array of stat objects to display (1-3 recommended) */
  stats: PropTypes.arrayOf(
    PropTypes.shape({
      /** Icon class name (e.g., "mg-icon fa-globe") */
      icon: PropTypes.string,
      /** Label displayed above the value (e.g., "Target A") */
      topLabel: PropTypes.string,
      /** The main statistic value (e.g., "1,500+", "45%", "$223B") */
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      /** Label displayed below the value */
      bottomLabel: PropTypes.string.isRequired,
      /** Optional descriptive text */
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
    })
  ),
  /** Visual variant: default, compact, or highlighted */
  variant: PropTypes.oneOf(['default', 'compact', 'highlighted']),
  /** Layout mode: grid (separate cards) or card (grouped container) */
  layout: PropTypes.oneOf(['grid', 'card']),
  /** Additional CSS class names */
  className: PropTypes.string,
};

export default StatsCard;
