import React from 'react';
import PropTypes from 'prop-types';

export const Legend = ({
  type = 'continuous',
  orientation = 'horizontal',
  layout = 'default',
  rampClass = '',
  customRamp = '',
  ticks = [],
  items = [],
  title = '',
  className = '',
  ...props
}) => {
  const baseClass = 'mg-legend';
  const typeClass = `${baseClass}--${type}`;
  const orientationClass =
    orientation === 'vertical' ? `${baseClass}--vertical` : '';
  const layoutClass = layout !== 'default' ? `${baseClass}--${layout}` : '';

  const classes = [
    baseClass,
    typeClass,
    orientationClass,
    layoutClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const renderContinuous = () => (
    <div className={`${baseClass}__bar-wrapper`}>
      <div
        className={`${baseClass}__bar ${rampClass}`}
        style={customRamp ? { background: customRamp } : {}}
      />
      {ticks.length > 0 && (
        <div className={`${baseClass}__ticks`}>
          {ticks.map((tick, index) => (
            <div
              key={index}
              className={`${baseClass}__tick`}
              style={{
                '--mg-legend-tick-pos':
                  tick.position || `${(index / (ticks.length - 1)) * 100}%`,
              }}
            >
              <span className={`${baseClass}__tick-label`}>{tick.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStepped = () => (
    <div className={`${baseClass}__bar-wrapper`}>
      <div
        className={`${baseClass}__bar ${baseClass}__bar--stepped ${rampClass}`}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className={`${baseClass}__step`}
            style={item.color ? { backgroundColor: item.color } : {}}
          ></div>
        ))}
      </div>
      {ticks.length > 0 && (
        <div className={`${baseClass}__ticks`}>
          {ticks.map((tick, index) => (
            <div
              key={index}
              className={`${baseClass}__tick`}
              style={{
                '--mg-legend-tick-pos':
                  tick.position || `${(index / (ticks.length - 1)) * 100}%`,
              }}
            >
              <span className={`${baseClass}__tick-label`}>{tick.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCategorical = () => (
    <ul className={`${baseClass}__list`}>
      {items.map((item, index) => (
        <li key={index} className={`${baseClass}__item`}>
          <span
            className={`${baseClass}__swatch`}
            style={item.color ? { backgroundColor: item.color } : {}}
          />
          <span className={`${baseClass}__label`}>{item.label}</span>
          {item.value && (
            <span className={`${baseClass}__value`}>{item.value}</span>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <div className={classes} {...props}>
      {title && <div className={`${baseClass}__title`}>{title}</div>}
      {type === 'continuous' && renderContinuous()}
      {type === 'stepped' && renderStepped()}
      {type === 'categorical' && renderCategorical()}
    </div>
  );
};

Legend.propTypes = {
  type: PropTypes.oneOf(['continuous', 'categorical', 'stepped']),
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  layout: PropTypes.oneOf(['default', 'inline', 'grid']),
  rampClass: PropTypes.string,
  customRamp: PropTypes.string,
  ticks: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.node.isRequired,
      position: PropTypes.string,
    })
  ),
  items: PropTypes.arrayOf(
    PropTypes.shape({
      color: PropTypes.string,
      label: PropTypes.node.isRequired,
      value: PropTypes.node,
    })
  ),
  title: PropTypes.node,
  className: PropTypes.string,
};
