import React from 'react';
import PropTypes from 'prop-types';
import { Heading } from '../../../Atom/Typography/Heading/Heading';
import { StatsCardItem } from './StatsCardItem';

/**
 * StatsCard Component
 *
 * A flexible card component for displaying statistics and key metrics in an engaging,
 * scannable format. Displays individual stat cards in a grid layout with optional
 * icons, dual labels, descriptions, and call-to-action links.
 */
export function StatsCard({
  title,
  stats = [],
  variant = 'default',
  className = '',
  ...props
}) {
  const baseClass = 'mg-stats-card';
  const statsCount = stats.length;

  // Use mg-grid system for layout
  const gridClasses = statsCount > 0 ? `mg-grid mg-grid__col-${statsCount}` : 'mg-grid';

  const classes = [
    baseClass,
    variant && `${baseClass}--${variant}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <section className={classes} aria-label={title || 'Statistics'} {...props}>
      {title && <Heading type="2" label={title} />}

      <div className={gridClasses}>
        {stats.map((stat, index) => (
          <StatsCardItem
            key={index}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            bottomLabel={stat.bottomLabel}
            summaryText={stat.summaryText}
            link={stat.link}
          />
        ))}
      </div>
    </section>
  );
}

StatsCard.propTypes = {
  /** Optional heading for the stats section */
  title: PropTypes.string,
  /** Array of stat objects to display (1-3 recommended) */
  stats: PropTypes.arrayOf(
    PropTypes.shape({
      /** Icon class name (e.g., "mg-icon fa-globe") */
      icon: PropTypes.string,
      /** Label displayed above the value (e.g., "Target A") */
      label: PropTypes.string,
      /** The main statistic value (e.g., "1,500+", "45%", "$223B") */
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      /** Label displayed below the value */
      bottomLabel: PropTypes.string,
      /** Optional descriptive text (supports inline HTML links) */
      summaryText: PropTypes.string,
      /** URL to make the entire stat item clickable */
      link: PropTypes.string,
    })
  ),
  /** Visual variant: default, compact, highlighted, or negative */
  variant: PropTypes.oneOf(['default', 'compact', 'highlighted', 'negative']),
  /** Additional CSS class names */
  className: PropTypes.string,
};

export default StatsCard;
