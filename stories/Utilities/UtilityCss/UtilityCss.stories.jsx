import React from 'react';

export default {
  title: 'Components/Utility CSS',
  parameters: {
    docs: {
      description: {
        component: 'Interactive examples of all Mangrove utility CSS classes.',
      },
    },
  },
};

// Screen reader only utility
export const ScreenReaderOnly = () => (
  <div>
    <p>
      This paragraph has visible text and{' '}
      <span className="mg-u-sr-only">hidden text for screen readers only</span>.
    </p>
    <p>
      <em>Try using a screen reader to hear the hidden text!</em>
    </p>
  </div>
);

ScreenReaderOnly.storyName = 'Screen reader only (.mg-u-sr-only)';

// Text wrapping utilities
export const TextWrapping = () => (
  <div
    style={{
      display: 'grid',
      gap: '2rem',
      gridTemplateColumns: '1fr 1fr',
      maxWidth: '600px',
    }}
  >
    <div>
      <div
        className="mg-u-text-wrap-balanced"
        style={{ width: '300px', border: '1px solid #ccc', padding: '1rem' }}
      >
        <h4>Balanced text wrap</h4>
        This is a longer sentence that will demonstrate balanced text wrapping
        for better typography.
      </div>
    </div>
    <div>
      <div
        className="mg-u-text-wrap-pretty"
        style={{ width: '300px', border: '1px solid #ccc', padding: '1rem' }}
      >
        <h4>Pretty text wrap</h4>
        This is a longer sentence that will demonstrate pretty text wrapping for
        improved readability.
      </div>
    </div>
    <div>
      <div
        style={{ width: '300px', border: '1px solid #ccc', padding: '1rem' }}
      >
        <h4>No text wrap</h4>
        This is a longer sentence that will demonstrate no special text wrapping
        for default behaviour.
      </div>
    </div>
  </div>
);

TextWrapping.storyName = 'Text wrapping utilities';

// Comma separator utility
export const CommaSeparator = () => (
  <div>
    <h4>Comma between child elements</h4>
    <div className="mg-u-comma-between" style={{ fontSize: '1.2rem' }}>
      <span>Apple</span>
      <span>Banana</span>
      <span>Cherry</span>
      <span>Date</span>
    </div>
    <p>
      <em>
        Commas are automatically added between elements, but not after the last
        one.
      </em>
    </p>
  </div>
);

CommaSeparator.storyName = 'Comma separator (.mg-u-comma-between)';

// Background color utilities
export const BackgroundColors = () => (
  <div>
    <h4>Background color utilities</h4>

    <h5>Basic colors</h5>
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
      <div
        className="mg-u-background-color--white"
        style={{
          width: '80px',
          height: '40px',
          border: '1px solid #ccc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.8rem',
        }}
      >
        White
      </div>
      <div
        className="mg-u-background-color--black mg-u-color--white"
        style={{
          width: '80px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.8rem',
        }}
      >
        Black
      </div>
    </div>

    <h5>Blue shades</h5>
    <div
      style={{
        display: 'flex',
        gap: '0.25rem',
        marginBottom: '1rem',
        flexWrap: 'wrap',
      }}
    >
      {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map(shade => (
        <div
          key={shade}
          className={`mg-u-background-color--blue-${shade} ${shade > 500 ? 'mg-u-color--white' : ''}`}
          style={{
            width: '60px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.7rem',
          }}
        >
          {shade}
        </div>
      ))}
    </div>

    <h5>Orange shades</h5>
    <div
      style={{
        display: 'flex',
        gap: '0.25rem',
        marginBottom: '1rem',
        flexWrap: 'wrap',
      }}
    >
      {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map(shade => (
        <div
          key={shade}
          className={`mg-u-background-color--orange-${shade} ${shade > 500 ? 'mg-u-color--white' : ''}`}
          style={{
            width: '60px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.7rem',
          }}
        >
          {shade}
        </div>
      ))}
    </div>

    <h5>Red shades</h5>
    <div
      style={{
        display: 'flex',
        gap: '0.25rem',
        marginBottom: '1rem',
        flexWrap: 'wrap',
      }}
    >
      {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map(shade => (
        <div
          key={shade}
          className={`mg-u-background-color--red-${shade} ${shade > 500 ? 'mg-u-color--white' : ''}`}
          style={{
            width: '60px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.7rem',
          }}
        >
          {shade}
        </div>
      ))}
    </div>

    <h5>Neutral shades</h5>
    <div
      style={{
        display: 'flex',
        gap: '0.25rem',
        marginBottom: '1rem',
        flexWrap: 'wrap',
      }}
    >
      {[0, 25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map(shade => (
        <div
          key={shade}
          className={`mg-u-background-color--neutral-${shade} ${shade > 500 ? 'mg-u-color--white' : ''}`}
          style={{
            width: '60px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.7rem',
          }}
        >
          {shade}
        </div>
      ))}
    </div>

    <h5>Accent colors</h5>
    <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem' }}>
      {[100, 200, 300, 400].map(shade => (
        <div
          key={shade}
          className={`mg-u-background-color--accent-${shade}`}
          style={{
            width: '80px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8rem',
          }}
        >
          {shade}
        </div>
      ))}
    </div>

    <h5>Sendai framework colors</h5>
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
      {['red', 'orange', 'purple', 'turquoise'].map(color => (
        <div
          key={color}
          className={`mg-u-background-color--sendai-${color} mg-u-color--white`}
          style={{
            width: '80px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8rem',
            textTransform: 'capitalize',
          }}
        >
          {color}
        </div>
      ))}
    </div>

    <h5>Interactive colors</h5>
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <div
        className="mg-u-background-color--interactive mg-u-color--white"
        style={{
          width: '100px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.8rem',
        }}
      >
        Interactive
      </div>
      <div
        className="mg-u-background-color--interactive-active mg-u-color--white"
        style={{
          width: '100px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.8rem',
        }}
      >
        Active
      </div>
    </div>
  </div>
);

BackgroundColors.storyName = 'Background color utilities';

// Text color utilities
export const TextColors = () => (
  <div>
    <h4>Text color utilities</h4>

    <h5>Basic colors</h5>
    <div style={{ marginBottom: '1rem' }}>
      <p className="mg-u-color--black">This text is black</p>
      <p
        className="mg-u-color--white"
        style={{ backgroundColor: '#333', padding: '0.5rem' }}
      >
        This text is white (on dark background)
      </p>
    </div>

    <h5>Blue text colors</h5>
    <div style={{ marginBottom: '1rem' }}>
      <p className="mg-u-color--blue-300">This is blue-300 text</p>
      <p className="mg-u-color--blue-600">This is blue-600 text</p>
      <p className="mg-u-color--blue-900">This is blue-900 text</p>
    </div>

    <h5>Orange text colors</h5>
    <div style={{ marginBottom: '1rem' }}>
      <p className="mg-u-color--orange-400">This is orange-400 text</p>
      <p className="mg-u-color--orange-700">This is orange-700 text</p>
    </div>

    <h5>Red text colors</h5>
    <div style={{ marginBottom: '1rem' }}>
      <p className="mg-u-color--red-400">This is red-400 text</p>
      <p className="mg-u-color--red-700">This is red-700 text</p>
    </div>

    <h5>Neutral text colors</h5>
    <div style={{ marginBottom: '1rem' }}>
      <p className="mg-u-color--neutral-400">This is neutral-400 text</p>
      <p className="mg-u-color--neutral-600">This is neutral-600 text</p>
      <p className="mg-u-color--neutral-900">This is neutral-900 text</p>
    </div>

    <h5>Accent text colors</h5>
    <div style={{ marginBottom: '1rem' }}>
      <p className="mg-u-color--accent-200">This is accent-200 text</p>
      <p className="mg-u-color--accent-400">This is accent-400 text</p>
    </div>

    <h5>Sendai framework text colors</h5>
    <div style={{ marginBottom: '1rem' }}>
      <p className="mg-u-color--sendai-red">Sendai red text</p>
      <p className="mg-u-color--sendai-orange">Sendai orange text</p>
      <p className="mg-u-color--sendai-purple">Sendai purple text</p>
      <p className="mg-u-color--sendai-turquoise">Sendai turquoise text</p>
    </div>

    <h5>Interactive text colors</h5>
    <div>
      <p className="mg-u-color--interactive">Interactive text color</p>
      <p className="mg-u-color--interactive-active">
        Interactive active text color
      </p>
    </div>
  </div>
);

TextColors.storyName = 'Text color utilities';

// Display utilities
export const DisplayUtilities = () => (
  <div>
    <h4>Responsive display utilities</h4>
    <div
      className="mg-u-responsive--show-large"
      style={{
        padding: '1rem',
        backgroundColor: '#e3f2fd',
        border: '1px solid #2196f3',
        marginBottom: '1rem',
      }}
    >
      <strong>Large screens only:</strong> This content is hidden on small
      screens and visible on medium screens and up.
    </div>
    <div
      className="mg-u-responsive--show-small"
      style={{
        padding: '1rem',
        backgroundColor: '#fff3e0',
        border: '1px solid #ff9800',
        marginBottom: '1rem',
      }}
    >
      <strong>Small screens only:</strong> This content is visible on small
      screens and hidden on medium screens and up.
    </div>
    <p>
      <em>Resize your browser window to see the responsive behavior!</em>
    </p>
  </div>
);

DisplayUtilities.storyName = 'Responsive display utilities';

// Layout utilities
export const LayoutUtilities = () => (
  <div>
    <h4>Layout utilities</h4>

    <h5>.mg-u-expand-to-size</h5>
    <div
      className="mg-u-expand-to-size"
      style={{
        backgroundColor: '#f5f5f5',
        padding: '1rem',
        border: '1px solid #ccc',
        marginBottom: '1rem',
      }}
    >
      This container expands to calc(100% - 1rem) on small screens and calc(100%
      - 3rem) on medium screens and up.
    </div>

    <h5>.mg-u-overflow-hidden</h5>
    <div
      className="mg-u-overflow-hidden"
      style={{
        width: '200px',
        height: '80px',
        border: '1px solid #ccc',
        padding: '1rem',
        backgroundColor: '#f9f9f9',
      }}
    >
      This container has overflow hidden, so this very long text that would
      normally wrap and extend beyond the container boundaries will be clipped
      instead of showing scrollbars.
    </div>
  </div>
);

LayoutUtilities.storyName = 'Layout utilities';

// Combined example
export const CombinedExample = () => (
  <div>
    <h4>Combined utility classes example</h4>

    <div
      className="mg-u-background-color--blue-100"
      style={{ padding: '2rem', marginBottom: '1rem' }}
    >
      <h5 className="mg-u-color--blue-900">Newsletter signup</h5>
      <p className="mg-u-color--blue-800 mg-u-text-wrap-pretty">
        Join our newsletter to receive updates about disaster risk reduction
        initiatives and the latest developments in the Sendai Framework
        implementation.
      </p>

      <div
        className="mg-u-comma-between mg-u-color--blue-700"
        style={{ marginBottom: '1rem' }}
      >
        <span>Weekly updates</span>
        <span>Special reports</span>
        <span>Event notifications</span>
        <span>Research findings</span>
      </div>

      <button
        className="mg-u-background-color--sendai-red mg-u-color--white"
        style={{
          padding: '0.75rem 1.5rem',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Subscribe now
      </button>

      <p
        className="mg-u-color--neutral-600"
        style={{ fontSize: '0.9rem', marginTop: '1rem' }}
      >
        <span className="mg-u-sr-only">Privacy notice: </span>
        We respect your privacy and will never share your information.
      </p>
    </div>

    <div
      className="mg-u-expand-to-size mg-u-background-color--accent-100"
      style={{ padding: '1.5rem' }}
    >
      <h5 className="mg-u-color--neutral-900">Statistics dashboard</h5>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem',
          marginTop: '1rem',
        }}
      >
        <div
          className="mg-u-background-color--sendai-turquoise mg-u-color--white"
          style={{ padding: '1rem', textAlign: 'center', borderRadius: '4px' }}
        >
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>127</div>
          <div className="mg-u-text-wrap-balanced">Countries participating</div>
        </div>
        <div
          className="mg-u-background-color--sendai-orange mg-u-color--white"
          style={{ padding: '1rem', textAlign: 'center', borderRadius: '4px' }}
        >
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>45%</div>
          <div className="mg-u-text-wrap-balanced">Risk reduction achieved</div>
        </div>
        <div
          className="mg-u-background-color--sendai-purple mg-u-color--white"
          style={{ padding: '1rem', textAlign: 'center', borderRadius: '4px' }}
        >
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>892</div>
          <div className="mg-u-text-wrap-balanced">
            Active monitoring systems
          </div>
        </div>
      </div>
    </div>
  </div>
);

CombinedExample.storyName = 'Combined utilities example';
