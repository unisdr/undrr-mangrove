import React, { useEffect, useRef, useState } from 'react';
import { Loader } from './Loader';

export default {
  title: 'Components/Loader',
  component: Loader,
  argTypes: {
    size: { control: 'inline-radio', options: ['default', 'small'] },
    as: { control: 'inline-radio', options: ['div', 'span'] },
  },
};

export const DefaultLoader = {
  render: () => <Loader />,
  name: 'Loader',
};

export const Small = {
  args: { size: 'small' },
};

export const InlineInText = {
  name: 'Small, inline in text',
  render: () => (
    <div>
      <p>
        Fetching the latest figures <Loader size="small" announce={false} />{' '}
        from the Sendai Framework monitor.
      </p>
      <p className="mg-u-font-size-600">
        Larger text <Loader size="small" announce={false} /> gets a larger
        spinner.
      </p>
      <p
        style={{
          backgroundColor: 'rgb(var(--mg-color-neutral-800))',
          color: 'rgb(var(--mg-color-neutral-0))',
          padding: 'var(--mg-spacing-100)',
        }}
      >
        On a dark background <Loader size="small" announce={false} /> the
        spinner takes the text colour.
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
];

export const InButtons = {
  name: 'Small, in buttons',
  render: () => (
    <div className="mg-buttons">
      {BUTTON_VARIANTS.map(variant => (
        <button
          key={variant.name}
          type="button"
          className={`mg-button ${variant.className}`}
          aria-disabled="true"
        >
          <Loader size="small" announce={false} />
          Saving…
        </button>
      ))}
      <button type="button" className="mg-button mg-button-primary">
        Save
      </button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The spinner is a decorative flex item next to the visible label, so the button keeps its height. The last button shows the resting height for comparison.',
      },
    },
  },
};

export const NextToField = {
  name: 'Small, next to a form field',
  render: () => (
    <div className="mg-form-field">
      <label className="mg-form-label" htmlFor="loader-autocomplete">
        Country
      </label>
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: 'var(--mg-spacing-50)',
        }}
      >
        <input
          className="mg-form-input"
          id="loader-autocomplete"
          type="text"
          defaultValue="Indon"
          autoComplete="off"
        />
        <Loader size="small" announce={false} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The case of an autocomplete or AJAX throbber. The spinner is decorative; announce the result (for example the number of suggestions) through a live region that is already in the page.',
      },
    },
  },
};

export const WithVisibleLabel = {
  name: 'Small, with a visible label',
  args: { size: 'small', showLabel: true, label: 'Loading results…' },
};

function LiveRegionExample() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const start = () => {
    setLoading(true);
    setMessage('Loading results');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setLoading(false);
      setMessage('12 results loaded');
    }, 3000);
  };

  return (
    <div>
      <div role="status" className="mg-u-sr-only">
        {message}
      </div>
      <button
        type="button"
        className="mg-button mg-button-primary"
        onClick={start}
        aria-disabled={loading || undefined}
      >
        {loading && <Loader size="small" announce={false} />}
        {loading ? 'Loading…' : 'Load results'}
      </button>
      <div aria-busy={loading || undefined} style={{ minHeight: '6rem' }}>
        {loading ? <Loader announce={false} /> : <p>{message}</p>}
      </div>
    </div>
  );
}

export const AnnouncedThroughLiveRegion = {
  name: 'Announced through a live region',
  render: () => <LiveRegionExample />,
  parameters: {
    docs: {
      description: {
        story:
          'The `role="status"` region is in the page from the start and the spinners are decorative, so the start and the end of loading are announced even though the spinners are inserted by script.',
      },
    },
  },
};
