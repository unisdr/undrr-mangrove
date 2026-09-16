import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ServiceNotice } from '../ServiceNotice';

expect.extend(toHaveNoViolations);

describe('ServiceNotice', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders default degraded service notice with title and description', () => {
    render(
      <ServiceNotice
        title="MapX tile service degraded"
        description="Tiles are taking longer than usual to render."
      />
    );

    expect(screen.getByText('MapX tile service degraded')).toBeInTheDocument();
    expect(
      screen.getByText('Tiles are taking longer than usual to render.')
    ).toBeInTheDocument();
    expect(screen.getByText('Degraded')).toBeInTheDocument();
  });

  it('announces status and title through a live region after mount', () => {
    render(<ServiceNotice title="Map offline" status="offline" />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'Offline. Map offline'
    );
  });

  it('renders string descriptions as text, not HTML', () => {
    const { container } = render(
      <ServiceNotice title="X" description={'<img src=x onerror="alert(1)">'} />
    );

    expect(container.querySelector('img')).toBeNull();
  });

  it('renders offline variant with negative status label', () => {
    render(
      <ServiceNotice
        title="Analytics API unreachable"
        description="The remote endpoint returned 503 Service Unavailable."
        status="offline"
      />
    );

    expect(screen.getAllByText('Offline').length).toBeGreaterThan(0);
    const { container } = render(<ServiceNotice status="offline" />);
    expect(container.firstChild).toHaveClass('mg-notice--negative');
    expect(container.firstChild).not.toHaveClass('mg-notice--warning');
    expect(container.querySelector('.mg-icon-power-off')).not.toBeNull();
  });

  it('calls onRetry callback when retry button is clicked', () => {
    const onRetry = jest.fn();
    render(<ServiceNotice title="Connection timeout" onRetry={onRetry} />);

    const retryBtn = screen.getByRole('button', { name: /Retry connection/i });
    fireEvent.click(retryBtn);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders external status page link with security attributes', () => {
    render(
      <ServiceNotice
        title="Service degraded"
        statusUrl="https://status.example.org"
      />
    );

    const link = screen.getByRole('link', { name: /View status page/i });
    expect(link).toHaveAttribute('href', 'https://status.example.org');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('counts down, retries, and backs off between automatic attempts', () => {
    jest.useFakeTimers();
    const onRetry = jest.fn();
    render(
      <ServiceNotice
        title="Reconnecting"
        countdownSeconds={2}
        maxAutoRetries={2}
        onRetry={onRetry}
      />
    );

    expect(screen.getByText('2s')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Retrying automatically in 2 seconds'
    );

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByText('4s')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Retrying automatically in 4 seconds'
    );

    act(() => {
      jest.advanceTimersByTime(4000);
    });
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(screen.queryByText(/Next automatic retry in/i)).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Automatic retries stopped'
    );

    act(() => {
      jest.advanceTimersByTime(60000);
    });
    expect(onRetry).toHaveBeenCalledTimes(2);
  });

  it('does not keep retrying when the parent re-renders', () => {
    jest.useFakeTimers();
    const onRetry = jest.fn();
    const { rerender } = render(
      <ServiceNotice
        countdownSeconds={1}
        maxAutoRetries={1}
        onRetry={onRetry}
      />
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    rerender(
      <ServiceNotice
        countdownSeconds={1}
        maxAutoRetries={1}
        onRetry={() => onRetry()}
      />
    );
    act(() => {
      jest.advanceTimersByTime(10000);
    });
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('ignores countdownSeconds without onRetry', () => {
    jest.useFakeTimers();
    render(<ServiceNotice title="No retry" countdownSeconds={5} />);
    expect(screen.queryByText(/Next automatic retry in/i)).toBeNull();
  });

  it('does not render non-http status links', () => {
    render(
      <ServiceNotice
        title="Unsafe"
        statusUrl="javascript:alert(1)" // eslint-disable-line no-script-url
      />
    );
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('restarts the retry cycle when countdownSeconds changes', () => {
    jest.useFakeTimers();
    const onRetry = jest.fn();
    const { rerender } = render(
      <ServiceNotice
        countdownSeconds={1}
        maxAutoRetries={1}
        onRetry={onRetry}
      />
    );
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/Next automatic retry in/i)).toBeNull();

    rerender(
      <ServiceNotice
        countdownSeconds={5}
        maxAutoRetries={1}
        onRetry={onRetry}
      />
    );
    expect(screen.getByText('5s')).toBeInTheDocument();
  });

  it('supports localized labels', () => {
    render(
      <ServiceNotice
        title="Service dégradé"
        status="offline"
        labels={{
          statusOffline: 'Hors ligne',
          retryLabel: 'Réessayer',
          statusUrlLabel: 'Statut du service',
        }}
        statusUrl="https://status.example.org"
        onRetry={() => {}}
      />
    );

    expect(screen.getByText('Hors ligne')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Réessayer/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Statut du service/i })
    ).toBeInTheDocument();
  });

  it('has no automated accessibility violations', async () => {
    const { container } = render(
      <ServiceNotice
        title="Layer service notice"
        description="The remote data source is temporarily responding slowly."
        status="degraded"
        statusUrl="https://status.example.org"
        onRetry={() => {}}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
