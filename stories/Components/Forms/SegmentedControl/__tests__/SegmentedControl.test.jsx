import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import { SegmentedControl } from '../SegmentedControl';

const options = [
  { label: 'Depth', value: 'depth' },
  { label: 'Frequency', value: 'frequency' },
  { label: 'Exposure', value: 'exposure' },
];

const renderControl = (props = {}) =>
  render(
    <SegmentedControl
      legend="Map layer"
      name="layer"
      options={options}
      {...props}
    />
  );

describe('SegmentedControl', () => {
  it('renders a radio group named by its legend', () => {
    renderControl();
    expect(
      screen.getByRole('group', { name: 'Map layer' })
    ).toBeInTheDocument();
  });

  it('renders one radio per option', () => {
    renderControl();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByRole('radio', { name: 'Depth' })).toBeInTheDocument();
  });

  it('shares one name across the radios, so the choice is exclusive', () => {
    renderControl();
    screen.getAllByRole('radio').forEach(radio => {
      expect(radio).toHaveAttribute('name', 'layer');
    });
  });

  it('keeps each label as the immediate next sibling of its input', () => {
    const { container } = renderControl();
    const children = Array.from(
      container.querySelector('.mg-segmented-control__group').children
    );
    expect(children.map(child => child.tagName)).toEqual([
      'INPUT',
      'LABEL',
      'INPUT',
      'LABEL',
      'INPUT',
      'LABEL',
    ]);
  });

  it('associates every label with its input', () => {
    const { container } = renderControl();
    container
      .querySelectorAll('.mg-segmented-control__label')
      .forEach(label => {
        expect(document.getElementById(label.htmlFor)).toHaveAttribute(
          'type',
          'radio'
        );
      });
  });

  it('selects defaultValue without controlling the group', () => {
    renderControl({ defaultValue: 'frequency' });
    expect(screen.getByRole('radio', { name: 'Frequency' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Depth' })).not.toBeChecked();
  });

  it('honours a controlled value', () => {
    renderControl({ value: 'exposure', onChange: () => {} });
    expect(screen.getByRole('radio', { name: 'Exposure' })).toBeChecked();
  });

  it('calls onChange with the selected value', () => {
    const handleChange = jest.fn();
    renderControl({ defaultValue: 'depth', onChange: handleChange });
    fireEvent.click(screen.getByRole('radio', { name: 'Exposure' }));
    expect(handleChange).toHaveBeenCalled();
    expect(handleChange.mock.calls[0][0].target.value).toBe('exposure');
  });

  it('disables only the option marked disabled', () => {
    renderControl({
      options: [...options.slice(0, 2), { ...options[2], disabled: true }],
    });
    expect(screen.getByRole('radio', { name: 'Exposure' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'Depth' })).toBeEnabled();
  });

  it('keeps the legend in the accessibility tree when hidden visually', () => {
    const { container } = renderControl({ hideLegend: true });
    const legend = container.querySelector('.mg-segmented-control__legend');
    expect(legend).toHaveClass('mg-u-sr-only');
    expect(legend).not.toHaveAttribute('hidden');
    expect(
      screen.getByRole('group', { name: 'Map layer' })
    ).toBeInTheDocument();
  });

  it('applies the size and width modifiers', () => {
    const { container } = renderControl({ size: 'small', fullWidth: true });
    const fieldset = container.querySelector('.mg-segmented-control');
    expect(fieldset).toHaveClass('mg-segmented-control--small');
    expect(fieldset).toHaveClass('mg-segmented-control--full-width');
  });

  it('adds a consumer className without dropping its own', () => {
    const { container } = renderControl({ className: 'map-panel__layers' });
    const fieldset = container.querySelector('.mg-segmented-control');
    expect(fieldset).toHaveClass('map-panel__layers');
  });

  it('gives each option a unique id', () => {
    renderControl();
    const ids = screen.getAllByRole('radio').map(radio => radio.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // A view switcher is often rendered before anything is chosen. The stories
  // all pass a defaultValue, so nothing else covers this shape.
  it('leaves every segment unselected when no value is given', () => {
    renderControl();
    screen.getAllByRole('radio').forEach(radio => {
      expect(radio).not.toBeChecked();
    });
  });

  it('keeps every segment reachable when nothing is selected', () => {
    renderControl();
    // A radio group with no selection puts the group's single tab stop on the
    // first radio, and arriving there selects nothing. Neither is Mangrove's
    // code, so this asserts the shape the browser needs: enabled radios, no
    // tabindex of our own, and no checked attribute.
    screen.getAllByRole('radio').forEach(radio => {
      expect(radio).toBeEnabled();
      expect(radio).not.toHaveAttribute('tabindex');
    });
  });

  it('disables every segment when the fieldset is disabled', () => {
    const { container } = renderControl({
      defaultValue: 'depth',
      disabled: true,
    });
    expect(container.querySelector('fieldset')).toBeDisabled();
    screen.getAllByRole('radio').forEach(radio => {
      expect(radio).toBeDisabled();
    });
  });

  it('carries no tablist or tab roles', () => {
    renderControl();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.queryAllByRole('tab')).toHaveLength(0);
  });

  // --------------------------------------------------
  // Accessibility
  // --------------------------------------------------

  it('has no a11y violations', async () => {
    const { container } = renderControl({ defaultValue: 'depth' });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no a11y violations with a hidden legend', async () => {
    const { container } = renderControl({
      defaultValue: 'depth',
      hideLegend: true,
    });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no a11y violations with a disabled segment', async () => {
    const { container } = renderControl({
      defaultValue: 'depth',
      options: [...options.slice(0, 2), { ...options[2], disabled: true }],
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});
