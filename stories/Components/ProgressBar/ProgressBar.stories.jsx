import React, { useEffect, useRef, useState } from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { ProgressBar } from './ProgressBar';

export default {
  title: 'Components/Progress bar',
  component: ProgressBar,
  args: {
    label: 'Uploading report.pdf',
    value: 45,
    max: 100,
    showValue: true,
    hideLabel: false,
    variant: 'default',
  },
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    max: { control: { type: 'number', min: 1 } },
    variant: { control: 'inline-radio', options: ['default', 'flush'] },
    helpText: { control: 'text' },
    valueText: { control: 'text' },
  },
};

/** Clears every timer it was given when the story unmounts. */
function useTimers() {
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  return {
    after: (ms, fn) => {
      timers.current.push(setTimeout(fn, ms));
    },
    clear: () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    },
  };
}

export const Determinate = {};

export const WithHelpText = {
  name: 'With help text and value text',
  args: {
    label: 'Uploading files',
    value: 3,
    max: 12,
    valueText: '3 of 12 files',
    helpText: 'You can keep working while the files upload.',
  },
};

export const Indeterminate = {
  args: { label: 'Loading results', value: undefined, showValue: false },
};

const RESULTS = ['Early warning systems', 'Flood risk', 'Drought resilience'];

function RegionExample() {
  const timers = useTimers();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadNext = () => {
    if (loading) return;
    const next = page + 1;
    setLoading(true);
    setMessage('');
    timers.clear();
    timers.after(2000, () => {
      setPage(next);
      setLoading(false);
      setMessage(`Showing page ${next}`);
    });
  };

  return (
    <div>
      <div role="status" className="mg-u-sr-only">
        {message}
      </div>
      <section
        aria-labelledby="pb-region-heading"
        aria-busy={loading || undefined}
        style={{
          border: '1px solid rgb(var(--mg-color-neutral-100))',
          padding: 'var(--mg-spacing-200)',
          position: 'relative',
        }}
      >
        {loading && (
          <div
            style={{
              insetBlockStart: 0,
              insetInline: 0,
              position: 'absolute',
            }}
          >
            <ProgressBar label="Loading results" variant="flush" />
          </div>
        )}
        <h3 id="pb-region-heading">Results, page {page}</h3>
        <ul style={{ opacity: loading ? 0.5 : 1 }}>
          {RESULTS.map(item => (
            <li key={item}>
              {item} (page {page})
            </li>
          ))}
        </ul>
      </section>
      <button
        type="button"
        className="mg-button mg-button-primary"
        onClick={loadNext}
        aria-disabled={loading || undefined}
        style={{ marginBlockStart: 'var(--mg-spacing-100)' }}
      >
        Next page
      </button>
    </div>
  );
}

export const PinnedToRegion = {
  name: 'Flush, pinned to a region',
  render: () => <RegionExample />,
  parameters: {
    docs: {
      description: {
        story:
          "Paging through results without hiding them. The flush bar is pinned to the top of the region by the page's own CSS (the region is `position: relative`, the bar `position: absolute`), the stale results are dimmed, `aria-busy` is set on the region while it loads, and the outcome is announced through a live region that is already in the page.",
      },
    },
  },
};

function ViewportExample() {
  const timers = useTimers();
  const [loading, setLoading] = useState(false);

  const start = () => {
    if (loading) return;
    setLoading(true);
    timers.after(3000, () => setLoading(false));
  };

  return (
    // In Storybook a transform makes this box the containing block for the
    // fixed bar, so the demo stays inside the canvas. A real page has no such
    // wrapper and the bar pins to the viewport.
    <div
      style={{
        border: '1px dashed rgb(var(--mg-color-neutral-300))',
        minHeight: '8rem',
        padding: 'var(--mg-spacing-200)',
        transform: 'translateZ(0)',
      }}
    >
      {loading && (
        <div
          style={{
            insetBlockStart: 0,
            insetInline: 0,
            position: 'fixed',
            zIndex: 'calc(var(--mg-z-index-header) + 1)',
          }}
        >
          <ProgressBar label="Loading page" variant="flush" />
        </div>
      )}
      <button
        type="button"
        className="mg-button mg-button-primary"
        onClick={start}
        aria-disabled={loading || undefined}
      >
        Load page
      </button>
    </div>
  );
}

export const PinnedToViewport = {
  name: 'Flush, pinned to the viewport',
  render: () => <ViewportExample />,
};

const SWITCH_STEPS = [
  [1000, 0],
  [1500, 20],
  [2000, 45],
  [2500, 70],
  [3000, 100],
];

function SwitchingExample() {
  const [value, setValue] = useState(undefined);

  useEffect(() => {
    const timers = SWITCH_STEPS.map(([ms, step]) =>
      setTimeout(() => setValue(step), ms)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <ProgressBar
      label="Preparing your download"
      value={value}
      showValue
      helpText={
        value === undefined ? 'Working out the size of the file…' : undefined
      }
    />
  );
}

export const IndeterminateToDeterminate = {
  name: 'Indeterminate, then determinate',
  render: () => <SwitchingExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvas.getByRole('progressbar', {
      name: 'Preparing your download',
    });
    await expect(bar).not.toHaveAttribute('value');
    await waitFor(() => expect(bar).toHaveAttribute('value'), {
      timeout: 2000,
    });
  },
};

const MILESTONES = [25, 50, 75];

function UploadExample() {
  const timers = useTimers();
  const [value, setValue] = useState(null);
  const [message, setMessage] = useState('');

  const start = () => {
    timers.clear();
    setValue(0);
    setMessage('Upload started');
    for (let step = 5; step <= 100; step += 5) {
      timers.after(step * 40, () => {
        setValue(step);
        if (MILESTONES.includes(step)) setMessage(`${step}% uploaded`);
        if (step === 100) setMessage('Upload complete');
      });
    }
  };

  return (
    <div style={{ display: 'grid', gap: 'var(--mg-spacing-100)' }}>
      <div role="status" className="mg-u-sr-only" data-testid="announcer">
        {message}
      </div>
      <div>
        <button
          type="button"
          className="mg-button mg-button-primary"
          onClick={start}
          aria-disabled={(value !== null && value < 100) || undefined}
        >
          Upload report.pdf
        </button>
      </div>
      {value !== null && (
        <ProgressBar label="Uploading report.pdf" value={value} showValue />
      )}
      {value === 100 && <p>Upload complete.</p>}
    </div>
  );
}

export const SimulatedUpload = {
  name: 'Upload with announced milestones',
  render: () => <UploadExample />,
  parameters: {
    docs: {
      description: {
        story:
          'Screen readers do not reliably announce changes to the value, so the start, 25%, 50%, 75% and completion are written to a live region that is already in the page. Completion has its own message.',
      },
    },
  },
};

export const DrupalBatch = {
  name: 'Drupal batch markup',
  render: () => (
    <div className="mg-progress-bar" data-drupal-progress="">
      <div className="mg-progress-bar__label" id="batch-label">
        Updating content
      </div>
      <div className="mg-progress-bar__track">
        <progress
          className="mg-progress-bar__native"
          max="100"
          value="40"
          aria-labelledby="batch-label"
          aria-describedby="batch-help"
        >
          40%
        </progress>
      </div>
      <div className="mg-progress-bar__value" aria-hidden="true">
        40%
      </div>
      <div className="mg-progress-bar__help" id="batch-help">
        Completed 2 of 5.
      </div>
    </div>
  ),
  parameters: {
    docs: {
      source: { language: 'html' },
      description: {
        story:
          "The markup a `progress-bar.html.twig` override renders. The elements follow core's order: `progress__label`, `progress__track` and `progress__bar`, `progress__percentage`, `progress__description`.",
      },
    },
  },
};

export const Rtl = {
  name: 'Right to left',
  render: () => (
    <div
      dir="rtl"
      lang="ar"
      style={{ display: 'grid', gap: 'var(--mg-spacing-300)' }}
    >
      <ProgressBar label="جارٍ رفع الملف" value={60} showValue />
      <ProgressBar label="جارٍ تحميل النتائج" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The determinate fill starts at the inline-start edge, which is the right in Arabic, and the scanner sweeps from right to left.',
      },
    },
  },
};

export const LongLabels = {
  name: 'Long labels',
  render: () => (
    <div
      style={{
        display: 'grid',
        gap: 'var(--mg-spacing-300)',
        maxWidth: '24rem',
      }}
    >
      <div lang="de">
        <ProgressBar
          label="Katastrophenrisikoreduzierungsdatenbankaktualisierung wird durchgeführt"
          value={72}
          showValue
        />
      </div>
      <div lang="fr">
        <ProgressBar
          label="Téléversement du rapport d’évaluation mondiale sur la réduction des risques de catastrophe"
          value={18}
          showValue
          helpText="Vous pouvez continuer à travailler pendant le téléversement."
        />
      </div>
    </div>
  ),
};
