import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import {
  getSwitchCaptionForLocale,
  PendingSwitchDemo,
  PendingSwitchRow,
  simulateSave,
  STILL_SAVING_INTERVAL_MS,
} from '../_switchPending';

const caption = getSwitchCaptionForLocale('english');

/** A save whose requests the test settles by hand. */
const controlledSave = () => {
  const requests = [];
  const save = jest.fn(
    (requested, signal) =>
      new Promise((resolve, reject) => {
        requests.push({ requested, signal, resolve, reject });
      })
  );
  return { save, requests };
};

const renderDemo = props => {
  const { container } = render(
    <PendingSwitchDemo caption={caption} timeoutMs={5000} {...props} />
  );
  return {
    container,
    control: screen.getByRole('switch', { name: caption.alertsLabel }),
    status: screen.getByRole('status'),
  };
};

const nextFrame = () =>
  act(() => {
    jest.advanceTimersByTime(20);
  });

describe('PendingSwitchDemo', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('moves at once, announces saving, and sets aria-busy a frame later', () => {
    const { save } = controlledSave();
    const { control, status } = renderDemo({ save });

    fireEvent.click(control);
    expect(control).toBeChecked();
    expect(status).toHaveTextContent(caption.saving);
    // Busy after the checked change, so the new state is announced first.
    expect(control).toHaveAttribute('aria-busy', 'false');

    nextFrame();
    expect(control).toHaveAttribute('aria-busy', 'true');
    // Pending never disables the input.
    expect(control).toBeEnabled();
  });

  it('ignores presses while pending and announces "still saving" at most once per interval', () => {
    const { save } = controlledSave();
    const { control, status } = renderDemo({ save });

    fireEvent.click(control);
    nextFrame();
    fireEvent.click(control);
    fireEvent.click(control);

    expect(save).toHaveBeenCalledTimes(1);
    expect(control).toBeChecked();
    expect(status).toHaveTextContent(caption.stillSaving);
    const firstNudge = status.firstChild;

    // A press inside the interval does not re-announce.
    fireEvent.click(control);
    expect(status.firstChild).toBe(firstNudge);

    act(() => {
      jest.advanceTimersByTime(STILL_SAVING_INTERVAL_MS);
    });
    fireEvent.click(control);
    // Same text: cleared, then written again, so a live region re-announces it.
    expect(status).toHaveTextContent('');
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(status.firstChild).not.toBe(firstNudge);
    expect(status).toHaveTextContent(caption.stillSaving);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('announces the outcome and clears busy when the save succeeds', async () => {
    const { save, requests } = controlledSave();
    const { control, status } = renderDemo({ save });

    fireEvent.click(control);
    nextFrame();
    await act(async () => requests[0].resolve());

    expect(control).toBeChecked();
    expect(control).toHaveAttribute('aria-busy', 'false');
    expect(status).toHaveTextContent(caption.enabled);
  });

  it('reverts and announces the error when the save fails', async () => {
    const { save, requests } = controlledSave();
    const { control, status } = renderDemo({ save });

    fireEvent.click(control);
    nextFrame();
    await act(async () => requests[0].reject(new Error('nope')));

    expect(control).not.toBeChecked();
    expect(control).toHaveAttribute('aria-busy', 'false');
    expect(status).toHaveTextContent(caption.failed);
  });

  it('times out, aborts and reverts a request that never settles', () => {
    const { save, requests } = controlledSave();
    const { control, status } = renderDemo({ save });

    fireEvent.click(control);
    nextFrame();
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(requests[0].signal.aborted).toBe(true);
    expect(control).not.toBeChecked();
    expect(control).toHaveAttribute('aria-busy', 'false');
    expect(status).toHaveTextContent(caption.failed);
  });

  it('ignores a late response from a request that already timed out', async () => {
    const { save, requests } = controlledSave();
    const { control, status } = renderDemo({ save });

    fireEvent.click(control);
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    // A new request is in flight when the first one finally answers.
    fireEvent.click(control);
    nextFrame();
    await act(async () => requests[0].resolve());

    expect(save).toHaveBeenCalledTimes(2);
    expect(control).toBeChecked();
    expect(control).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveTextContent(caption.saving);

    await act(async () => requests[1].reject(new Error('nope')));
    expect(control).not.toBeChecked();
    expect(status).toHaveTextContent(caption.failed);
  });

  it('runs the story simulation through to a timeout', async () => {
    const { control, status } = renderDemo({ save: simulateSave('timeout') });

    fireEvent.click(control);
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(control).not.toBeChecked();
    expect(status).toHaveTextContent(caption.failed);
  });

  it('has no a11y violations while pending', async () => {
    jest.useRealTimers();
    const { save } = controlledSave();
    const { container, control } = renderDemo({ save });
    fireEvent.click(control);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('PendingSwitchRow', () => {
  it('describes the switch with its note', async () => {
    const { container } = render(
      <PendingSwitchRow label="Active map layer" note="Turning on" checked />
    );
    const control = screen.getByRole('switch', { name: 'Active map layer' });

    expect(control).toHaveAccessibleDescription('Turning on');
    expect(control).toHaveAttribute('aria-busy', 'true');
    expect(control).toBeChecked();
    expect(await axe(container)).toHaveNoViolations();
  });
});
