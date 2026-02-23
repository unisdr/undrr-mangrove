import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Radio } from '../Radio';
import { FormGroup } from '../../FormGroup/FormGroup';

describe('Radio', () => {
  it('renders with a label', () => {
    render(<Radio label="Option A" value="a" name="test" />);
    expect(screen.getByLabelText('Option A')).toBeInTheDocument();
  });

  it('renders as a radio input', () => {
    render(<Radio label="Option A" value="a" name="test" />);
    expect(screen.getByRole('radio')).toBeInTheDocument();
  });

  it('associates label with radio via htmlFor', () => {
    render(<Radio label="Option A" value="a" name="test" id="radio-a" />);
    const radio = screen.getByLabelText('Option A');
    expect(radio).toHaveAttribute('id', 'radio-a');
  });

  it('renders label before radio when labelPosition is "before"', () => {
    const { container } = render(
      <Radio label="Option A" value="a" name="test" labelPosition="before" />,
    );
    const wrapper = container.querySelector('.mg-form-check');
    const children = Array.from(wrapper.children);
    expect(children[0].tagName).toBe('LABEL');
    expect(children[1].tagName).toBe('INPUT');
  });

  it('renders label after radio by default', () => {
    const { container } = render(
      <Radio label="Option A" value="a" name="test" />,
    );
    const wrapper = container.querySelector('.mg-form-check');
    const children = Array.from(wrapper.children);
    expect(children[0].tagName).toBe('INPUT');
    expect(children[1].tagName).toBe('LABEL');
  });

  it('renders as disabled', () => {
    render(<Radio label="Option A" value="a" name="test" disabled />);
    expect(screen.getByRole('radio')).toBeDisabled();
  });

  it('can be checked by default', () => {
    render(<Radio label="Option A" value="a" name="test" defaultChecked />);
    expect(screen.getByRole('radio')).toBeChecked();
  });

  it('calls onChange when clicked', () => {
    const handleChange = jest.fn();
    render(
      <Radio label="Option A" value="a" name="test" onChange={handleChange} />,
    );
    fireEvent.click(screen.getByRole('radio'));
    expect(handleChange).toHaveBeenCalled();
  });

  it('uses aria-label from value when no label is provided', () => {
    render(<Radio value="a" name="test" />);
    expect(screen.getByRole('radio')).toHaveAttribute('aria-label', 'a');
  });

  it('applies BEM class names', () => {
    const { container } = render(
      <Radio label="Option A" value="a" name="test" />,
    );
    expect(container.querySelector('.mg-form-check')).toBeInTheDocument();
    expect(
      container.querySelector('.mg-form-check__input--radio'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('.mg-form-check__label'),
    ).toBeInTheDocument();
  });

  it('supports mutual exclusion within a group', () => {
    render(
      <FormGroup legend="Choose">
        <Radio label="A" value="a" name="group" defaultChecked />
        <Radio label="B" value="b" name="group" />
      </FormGroup>,
    );
    const radios = screen.getAllByRole('radio');
    expect(radios[0]).toBeChecked();
    expect(radios[1]).not.toBeChecked();
  });

  it('has no a11y violations', async () => {
    const { container } = render(
      <Radio label="Option A" value="a" name="test" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no a11y violations in a group', async () => {
    const { container } = render(
      <FormGroup legend="Priority">
        <Radio label="Low" value="low" name="priority" />
        <Radio label="High" value="high" name="priority" />
      </FormGroup>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
