import React, { useId } from 'react';
import PropTypes from 'prop-types';

// Evenly space ticks without a position; a single tick sits at the start.
const tickPosition = (tick, index, count) =>
  tick.position || (count > 1 ? `${(index / (count - 1)) * 100}%` : '0%');

/**
 * @typedef {{label: React.ReactNode, position?: string}} LegendTick
 * @typedef {{color?: string, label: React.ReactNode, value?: React.ReactNode}} LegendItem
 */

/**
 * Legend for continuous, categorical and stepped data.
 *
 * @param {object} props
 * @param {'continuous'|'categorical'|'stepped'} [props.type='continuous'] Legend treatment.
 * @param {'horizontal'|'vertical'} [props.orientation='horizontal'] Direction of the legend.
 * @param {'default'|'inline'|'grid'} [props.layout='default'] Layout of the legend items.
 * @param {string} [props.rampClass=''] CSS class for the ramp.
 * @param {string} [props.customRamp=''] CSS background for a continuous ramp.
 * @param {LegendTick[]} [props.ticks=[]] Labels on continuous or stepped ramps. Supply CSS positions or let the legend space them evenly.
 * @param {LegendItem[]} [props.items=[]] Categories or steps. Values appear in the categorical layout.
 * @param {React.ReactNode} [props.title=''] Visible title for the legend.
 * @param {string} [props.className=''] Additional CSS classes.
 */
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
  const titleId = useId();
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
        aria-hidden="true"
      />
      {ticks.length > 0 && (
        <div className={`${baseClass}__ticks`}>
          {ticks.map((tick, index) => (
            <div
              key={index}
              className={`${baseClass}__tick`}
              style={{
                '--mg-legend-tick-pos': tickPosition(tick, index, ticks.length),
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
          >
            <span className="mg-u-sr-only">{item.label}</span>
          </div>
        ))}
      </div>
      {ticks.length > 0 && (
        <div className={`${baseClass}__ticks`}>
          {ticks.map((tick, index) => (
            <div
              key={index}
              className={`${baseClass}__tick`}
              style={{
                '--mg-legend-tick-pos': tickPosition(tick, index, ticks.length),
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
    <div
      className={classes}
      role="group"
      aria-labelledby={title ? titleId : undefined}
      {...props}
    >
      {title && (
        <p id={titleId} className={`${baseClass}__title`}>
          {title}
        </p>
      )}
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
