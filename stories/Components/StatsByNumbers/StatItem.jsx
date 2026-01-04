import React from 'react';

export function StatItem({
  icon,
  topLabel,
  value,
  bottomLabel,
  description,
  descriptionLink
}) {
  return (
    <div className="stat-item">
      {icon && (
        <div className="stat-item__icon" aria-hidden="true">
          <span className={icon}></span>
        </div>
      )}
      {topLabel && (
        <div className="stat-item__top-label">
          {topLabel}
        </div>
      )}
      <div className="stat-item__value">
        {value}
      </div>
      <div className="stat-item__bottom-label">
        {bottomLabel}
      </div>
      {description && (
        <div className="stat-item__description">
          <p>
            {description}
            {descriptionLink && (
              <>
                {' '}
                <a
                  href={descriptionLink.url}
                  className="stat-item__link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {descriptionLink.text}
                </a>
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
