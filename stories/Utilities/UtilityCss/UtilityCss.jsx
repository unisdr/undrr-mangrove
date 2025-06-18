import React from 'react';

export function Utility() {
  return (
    <div className="utility-examples">
      {/* Screen Reader Only Example */}
      <p>
        <code>.mg-u-sr-only</code>
      </p>
      <p>
        <span className="mg-u-sr-only">
          This text is only visible to screen readers
        </span>
        <span>This text is visible to everyone</span>
      </p>

      <hr />

      {/* Text Wrap Examples */}
      <p>
        <code>.mg-u-text-wrap-balanced</code>
      </p>
      <p className="mg-u-text-wrap-balanced">
        <h2>
          This is an example of balanced text wrapping for pleasing line breaks
        </h2>
      </p>

      <hr />

      <p>
        <code>.mg-u-text-wrap-pretty</code>
      </p>
      <p className="mg-u-text-wrap-pretty">
        This is an example of pretty text wrapping that optimizes readability.
        This is an example of pretty text wrapping that optimizes readability.
        This is an example of pretty text wrapping that optimizes readability.
      </p>

      <hr />

      <p>
        <code>.mg-u-comma-between</code>
      </p>
      {/* Comma Separator Example */}
      <p className="mg-u-comma-between">
        <span>Item 1</span>
        <span>Item 2</span>
        <span>Item 3</span>
      </p>
    </div>
  );
}
