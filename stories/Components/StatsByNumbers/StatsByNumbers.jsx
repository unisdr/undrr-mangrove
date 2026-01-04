import React from 'react';
import { Heading } from '../../Atom/Typography/Heading/Heading';
import { Ctalink } from '../Buttons/CtaLink/CtaLink';
import { StatItem } from './StatItem';
// import './stats-by-numbers.scss';

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(' ') : null;

export function StatsByNumbers({
  title,
  buttonLabel,
  buttonUrl,
  stats = [],
  variant = 'default',
  layout = 'grid'
}) {
  const statsCount = stats.length;
  const statsLayoutClass = layout === 'grid' ? `stats-by-numbers__grid--${statsCount}` : '';

  return (
    <div className={cls('stats-by-numbers', variant && `stats-by-numbers--${variant}`)}>
      {title && (
        <div className="stats-by-numbers__header">
          <Heading type="2" label={title} />
          {buttonLabel && buttonUrl && (
            <div className="stats-by-numbers__button">
              <a href={buttonUrl} className="cta__link cta--arrow">
                {buttonLabel} <i />
              </a>
            </div>
          )}
        </div>
      )}

      {layout === 'card' ? (
        <div className="stats-by-numbers__card">
          <div className="stats-by-numbers__card-content">
            {stats.map((stat, index) => (
              <StatItem
                key={index}
                icon={stat.icon}
                topLabel={stat.topLabel}
                value={stat.value}
                bottomLabel={stat.bottomLabel}
                description={stat.description}
                descriptionLink={stat.descriptionLink}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className={cls('stats-by-numbers__grid', statsLayoutClass)}>
          {stats.map((stat, index) => (
            <StatItem
              key={index}
              icon={stat.icon}
              topLabel={stat.topLabel}
              value={stat.value}
              bottomLabel={stat.bottomLabel}
              description={stat.description}
              descriptionLink={stat.descriptionLink}
            />
          ))}
        </div>
      )}

      {!title && buttonLabel && buttonUrl && (
        <div className="stats-by-numbers__footer">
          <a href={buttonUrl} className="cta__link cta--arrow">
            {buttonLabel} <i />
          </a>
        </div>
      )}
    </div>
  );
}
