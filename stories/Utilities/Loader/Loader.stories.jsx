import React, { useEffect, useRef, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Loader } from './Loader';
import { TextInput } from '../../Components/Forms/TextInput/TextInput';

// The visually hidden label in the language picked in the locale toolbar.
// Arabic also sets the direction, so the stories cover right to left. A label
// typed into the controls is shown as entered.
const LOADING_LABELS = {
  arabic: 'جارٍ التحميل',
  french: 'Chargement',
  japanese: '読み込み中',
  russian: 'Загрузка',
  spanish: 'Cargando',
  chinese: '正在加载',
};

const withLocaleLabel = (Story, context) => {
  const { label = 'Loading' } = context.args;
  const translated =
    label === 'Loading' ? LOADING_LABELS[context.globals?.locale] : undefined;
  return (
    <Story
      {...context}
      args={translated ? { ...context.args, label: translated } : context.args}
    />
  );
};

export default {
  title: 'Components/Loader',
  component: Loader,
  decorators: [withLocaleLabel],
  argTypes: {
    size: { control: 'inline-radio', options: ['default', 'inline'] },
  },
};

// Wait this long before showing a spinner or announcing anything, so quick
// responses do not flash a spinner or interrupt the screen reader.
const SHOW_DELAY_MS = 300;

/**
 * Runs a fake request. `phase` is idle, waiting (the show delay), loading or
 * done; `finish` decides how it ends.
 */
function useSimulatedRequest({ duration = 1500, outcome = 'success' } = {}) {
  const [phase, setPhase] = useState('idle');
  const [result, setResult] = useState(null);
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const start = () => {
    timers.current.forEach(clearTimeout);
    setResult(null);
    setPhase('waiting');
    timers.current = [
      setTimeout(() => setPhase('loading'), SHOW_DELAY_MS),
      setTimeout(() => {
        setPhase('done');
        setResult(outcome);
      }, duration),
    ];
  };

  return {
    phase,
    result,
    start,
    busy: phase === 'waiting' || phase === 'loading',
  };
}

export const DefaultLoader = {
  render: args => <Loader {...args} />,
  name: 'Loader',
};

export const Inline = {
  args: { size: 'inline' },
};

export const InlineInText = {
  name: 'Inline, in text',
  render: () => (
    <div>
      <p>
        Body text: fetching the latest figures{' '}
        <Loader size="inline" decorative /> from the Sendai Framework monitor.
      </p>
      <p className="mg-u-font-size-200">
        Small text: fetching the latest figures{' '}
        <Loader size="inline" decorative /> from the monitor.
      </p>
      <h2>
        Heading <Loader size="inline" decorative /> with a spinner
      </h2>
      <p
        style={{
          backgroundColor: 'rgb(var(--mg-color-neutral-800))',
          color: 'rgb(var(--mg-color-neutral-0))',
          padding: 'var(--mg-spacing-100)',
        }}
      >
        On a dark background <Loader size="inline" decorative /> the spinner
        takes the text colour.
      </p>
    </div>
  ),
};

const BUTTON_VARIANTS = [
  { className: 'mg-button-primary', name: 'Primary' },
  { className: 'mg-button-secondary', name: 'Secondary' },
  { className: 'mg-button-primary mg-button-outline', name: 'Primary outline' },
  {
    className: 'mg-button-secondary mg-button-outline',
    name: 'Secondary outline',
  },
  { className: 'mg-button-cta', name: 'CTA' },
];

export const InButtons = {
  name: 'Inline, in buttons',
  render: () => (
    <table className="mg-table">
      <thead>
        <tr>
          <th scope="col">Variant</th>
          <th scope="col">Resting</th>
          <th scope="col">Busy button</th>
          <th scope="col">Busy link</th>
        </tr>
      </thead>
      <tbody>
        {BUTTON_VARIANTS.map(variant => (
          <tr key={variant.name}>
            <th scope="row">{variant.name}</th>
            <td>
              <button
                type="button"
                className={`mg-button ${variant.className}`}
              >
                Save
              </button>
            </td>
            <td>
              <button
                type="button"
                className={`mg-button ${variant.className}`}
                aria-disabled="true"
              >
                <Loader size="inline" decorative />
                Saving…
              </button>
            </td>
            <td>
              <a
                href="#loader-demo"
                className={`mg-button ${variant.className}`}
                aria-disabled="true"
              >
                <Loader size="inline" decorative />
                Loading…
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Each row compares a resting button with the same button while busy, as a `button` and as a link. The spinner is a decorative flex item next to the visible label, so the height does not change. The button stays focusable with `aria-disabled="true"`.',
      },
    },
  },
};

export const NextToField = {
  name: 'Inline, next to a form field',
  render: () => (
    <div>
      <div
        style={{
          alignItems: 'end',
          display: 'flex',
          gap: 'var(--mg-spacing-75)',
        }}
      >
        <TextInput
          id="loader-autocomplete"
          label="Country"
          defaultValue="Indon"
          autoComplete="off"
        />
        <span style={{ paddingBlockEnd: 'var(--mg-spacing-100)' }}>
          <Loader size="inline" decorative />
        </span>
      </div>
      <h3>Drupal AJAX throbber</h3>
      <div className="ajax-progress ajax-progress--throbber">
        <span className="mg-loader mg-loader--inline" aria-hidden="true" />{' '}
        <span className="ajax-progress__message">Please wait…</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The autocomplete and AJAX throbber case. The spinner is decorative; Drupal announces the message with `Drupal.announce()`, and other pages should announce the result (for example the number of suggestions) through a live region that is already in the page.',
      },
    },
  },
};

const ANNOUNCEMENTS = {
  loading: 'Loading results',
  done: 'Showing 12 results',
};

function AnnouncerExample() {
  const { phase, start, busy } = useSimulatedRequest({ duration: 2000 });
  // Derived in the same render as aria-busy, so the outcome is written to the
  // live region at the moment the results stop being busy.
  const message = ANNOUNCEMENTS[phase] || '';

  return (
    <div>
      <div role="status" className="mg-u-sr-only" data-testid="announcer">
        {message}
      </div>
      <button
        type="button"
        className="mg-button mg-button-primary"
        onClick={busy ? undefined : start}
        aria-disabled={busy || undefined}
      >
        Load results
      </button>
      <div
        aria-busy={busy || undefined}
        data-testid="results"
        style={{ minHeight: '7rem', paddingBlock: 'var(--mg-spacing-100)' }}
      >
        {phase === 'loading' && <Loader decorative />}
        {phase === 'done' && <p>12 results.</p>}
      </div>
    </div>
  );
}

export const AnnouncedThroughLiveRegion = {
  name: 'Decorative, announced through a live region',
  render: () => <AnnouncerExample />,
  parameters: {
    docs: {
      description: {
        story:
          'The `role="status"` region is in the page from the start and the spinner is decorative. The spinner and the "Loading results" announcement wait 300ms, so a fast response shows and says nothing; the outcome gets its own message. `aria-busy` is set on the results while they load and cleared at the end.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const results = canvas.getByTestId('results');
    await userEvent.click(canvas.getByRole('button', { name: 'Load results' }));
    await expect(results).toHaveAttribute('aria-busy', 'true');
    await waitFor(
      () =>
        expect(canvas.getByTestId('announcer')).toHaveTextContent(
          'Loading results'
        ),
      { timeout: 1000 }
    );
    await waitFor(() => expect(results).not.toHaveAttribute('aria-busy'), {
      timeout: 3000,
    });
    await expect(canvas.getByTestId('announcer')).toHaveTextContent(
      'Showing 12 results'
    );
  },
};

function InlineLoadingExample({ outcome }) {
  const { phase, result, start, busy } = useSimulatedRequest({ outcome });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (phase === 'loading') setMessage('Saving…');
    if (result === 'success') setMessage('Saved');
    if (result === 'error') setMessage('Could not save. Try again.');
  }, [phase, result]);

  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--mg-spacing-100)',
      }}
    >
      <button
        type="button"
        className="mg-button mg-button-primary"
        onClick={busy ? undefined : start}
        aria-disabled={busy || undefined}
      >
        Save changes
      </button>
      {/* The status region is always rendered, so its changes are announced. */}
      <span role="status">
        {phase === 'loading' && (
          <>
            <Loader size="inline" decorative /> {message}
          </>
        )}
        {phase === 'done' && result === 'error' && (
          <>
            <span
              className="mg-icon mg-icon-exclamation-triangle"
              aria-hidden="true"
            />{' '}
            {message}
          </>
        )}
        {phase === 'done' && result === 'success' && message}
      </span>
    </div>
  );
}

export const InlineLoadingPattern = {
  name: 'Inline loading pattern',
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--mg-spacing-200)' }}>
      <InlineLoadingExample outcome="success" />
      <InlineLoadingExample outcome="error" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'A composed pattern, not a component: an inline spinner with visible status text, ending in a success or an error message. The text sits in a `role="status"` region that is in the page from the start, so each change is announced; the spinner and the icon are decorative. The first example succeeds and the second fails.',
      },
    },
  },
};
