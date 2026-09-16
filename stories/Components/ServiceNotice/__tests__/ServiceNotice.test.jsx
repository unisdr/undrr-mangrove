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

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('MapX tile service degraded')).toBeInTheDocument();
    expect(
      screen.getByText('Tiles are taking longer than usual to render.')
    ).toBeInTheDocument();
    expect(screen.getByText('Degraded')).toBeInTheDocument();
  });

  it('renders offline variant with negative status label', () => {
    render(
      <ServiceNotice
        title="Analytics API unreachable"
        description="The remote endpoint returned 503 Service Unavailable."
        status="offline"
      />
    );

    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveClass(
      'mg-service-notice--offline'
    );
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

  it('counts down and triggers onRetry when timer reaches 0', () => {
    jest.useFakeTimers();
    const onRetry = jest.fn();
    render(
      <ServiceNotice
        title="Reconnecting"
        countdownSeconds={3}
        onRetry={onRetry}
      />
    );

    expect(screen.getByText(/Next automatic retry in/i)).toBeInTheDocument();
    expect(screen.getByText('3s')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText('2s')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(onRetry).toHaveBeenCalled();
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
