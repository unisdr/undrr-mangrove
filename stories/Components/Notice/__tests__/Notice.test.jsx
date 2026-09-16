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

  it('renders negative variant with alert role and no redundant aria-live', () => {
    render(
      <Notice
        variant="negative"
        isProminent
        title="Flash flood warning"
        description="Immediate evacuation ordered."
      />
    );

    const alertElement = screen.getByRole('alert');
    expect(alertElement).toHaveClass('mg-notice--negative');
    expect(alertElement).toHaveClass('mg-notice--prominent');
    expect(alertElement).not.toHaveAttribute('aria-live');
  });

  it('falls back to info for unknown variants', () => {
    render(<Notice variant="emergency" title="Unknown" />);
    expect(screen.getByRole('status')).toHaveClass('mg-notice--info');
  });

  it('renders no live region when role is null', () => {
    const { container } = render(<Notice role={null} title="Static" />);
    expect(container.firstChild).not.toHaveAttribute('role');
  });

  it('renders string descriptions as text, not HTML', () => {
    const { container } = render(
      <Notice
        title="Injected"
        description={'<img src=x onerror="alert(1)">Hello'}
      />
    );

    expect(container.querySelector('img')).toBeNull();
    expect(
      screen.getByText('<img src=x onerror="alert(1)">Hello')
    ).toBeInTheDocument();
  });

  it('uses the requested heading level', () => {
    render(<Notice title="Section notice" headingLevel="h2" />);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Section notice' })
    ).toBeInTheDocument();
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
    expect(screen.queryByText('Dismissible notice')).not.toBeInTheDocument();
  });

  it('shows a working dismiss button without onDismiss', () => {
    render(<Notice title="Self-managed" isDismissible />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Dismiss notification' })
    );
    expect(screen.queryByText('Self-managed')).not.toBeInTheDocument();
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
