import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Notice } from '../Notice';

expect.extend(toHaveNoViolations);

describe('Notice', () => {
  it('renders default info notice with title and description', () => {
    render(
      <Notice
        title="System maintenance"
        description="The service will undergo scheduled maintenance tonight."
      />
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('System maintenance')).toBeInTheDocument();
    expect(
      screen.getByText(
        'The service will undergo scheduled maintenance tonight.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveClass('mg-notice--info');
  });

  it('renders negative/emergency variant with alert role', () => {
    render(
      <Notice
        variant="emergency"
        title="Flash flood warning"
        description="Immediate evacuation ordered."
      />
    );

    const alertElement = screen.getByRole('alert');
    expect(alertElement).toBeInTheDocument();
    expect(alertElement).toHaveClass('mg-notice--emergency');
    expect(alertElement).toHaveAttribute('aria-live', 'assertive');
  });

  it('handles dismiss button click', () => {
    const onDismiss = jest.fn();
    render(
      <Notice
        title="Dismissible notice"
        isDismissible
        onDismiss={onDismiss}
        dismissLabel="Close notice"
      />
    );

    const dismissButton = screen.getByRole('button', { name: 'Close notice' });
    expect(dismissButton).toBeInTheDocument();

    fireEvent.click(dismissButton);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders actions and children properly', () => {
    render(
      <Notice
        title="Action required"
        actions={<button type="button">Confirm</button>}
      >
        <p>Please confirm your email address.</p>
      </Notice>
    );

    expect(
      screen.getByText('Please confirm your email address.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });

  it('has no automated accessibility violations', async () => {
    const { container } = render(
      <Notice
        variant="warning"
        title="Advisory"
        description="High latency on data feeds."
        isDismissible
        onDismiss={() => {}}
        actions={<button type="button">Retry</button>}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
