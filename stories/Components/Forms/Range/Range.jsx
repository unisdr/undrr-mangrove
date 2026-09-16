import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const Range = ({
  id,
  name,
  min = 0,
  max = 100,
  step,
  value,
  defaultValue,
  disabled = false,
  onChange,
  className,
  ticks,
  ...props
}) => {
  const isStepped = ticks && ticks.length > 0;
  // Announce the tick label (for example "+2°C") rather than the raw number.
  const current = value ?? defaultValue;
  const currentTick =
    isStepped && current !== undefined
      ? ticks.find(tick => String(tick.value) === String(current))
      : undefined;

  return (
    <div className={classNames('mg-range-wrapper', className)}>
      <input
        type="range"
        id={id}
        name={name}
        min={min}
        max={max}
        step={step}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        onChange={onChange}
        className={classNames('mg-range', {
          'mg-range--stepped': isStepped,
        })}
        list={isStepped ? `${id}-ticks` : undefined}
        aria-valuetext={currentTick?.label}
        {...props}
      />

      {isStepped && (
        <>
          <datalist id={`${id}-ticks`}>
            {ticks.map((tick, index) => (
              <option
                key={index}
                value={tick.value}
                label={tick.label}
              ></option>
            ))}
          </datalist>

          <div className="mg-range__ticks" aria-hidden="true">
            {ticks.map((tick, index) => (
              <span key={index}>{tick.label}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

Range.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string,
  min: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  max: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  step: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  defaultValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
  className: PropTypes.string,
  ticks: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
        .isRequired,
      label: PropTypes.string,
    })
  ),
};
