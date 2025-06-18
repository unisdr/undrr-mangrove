import React from 'react';

export const variant_options = {
  default: '',
  striped: 'striped',
  border: 'border',
};

export const variant_options1 = {
  large: '',
  small: 'small',
};

export const variant_options2 = {
  auto: '',
  stacked: 'stacked',
  scroll: '',
};

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(' ') : null;

export const TableTag = ({
  text,
  tdtext,
  details,
  variant,
  size,
  responsive,
  ...args
}) => {
  let table_type = variant_options[`${variant}`];
  let table_size = variant_options1[`${size}`];
  let table_responsive = variant_options2[`${responsive}`];

  // Build the complete CSS class string
  const tableClasses = [
    'mg-table',
    table_size && `mg-table--${table_size}`,
    table_type && `mg-table--${table_type}`,
    table_responsive &&
      responsive !== 'auto' &&
      `mg-table--${table_responsive}`,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <table
      className={tableClasses}
      tabIndex={responsive === 'scroll' ? '0' : undefined}
    >
      <thead>
        <tr>
          <th>{text}</th>
          <th>{text}</th>
          <th>{text}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{tdtext}</td>
          <td>{tdtext}</td>
          <td>{details}</td>
        </tr>
        <tr>
          <td>{tdtext}</td>
          <td>{tdtext}</td>
          <td>{details}</td>
        </tr>
        <tr>
          <td>{tdtext}</td>
          <td>{tdtext}</td>
          <td>{details}</td>
        </tr>
        <tr>
          <td>{tdtext}</td>
          <td>{tdtext}</td>
          <td>{details}</td>
        </tr>
      </tbody>
    </table>
  );
};

TableTag.defaultProps = {
  variant: 'default',
  size: 'large',
  responsive: 'auto',
};
