import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import TableOfContents from '../TableOfContents';

test.each([true, false])(
  'anchor scrolling respects reduced motion: %s',
  reduced => {
    const original = window.matchMedia;
    window.matchMedia = jest.fn(() => ({ matches: reduced }));
    const target = document.createElement('h2');
    target.id = 'motion-target';
    target.scrollIntoView = jest.fn();
    document.body.appendChild(target);
    try {
      render(
        <TableOfContents
          tocData={[{ id: target.id, text: 'Target section' }]}
        />
      );
      fireEvent.click(screen.getByRole('link', { name: 'Target section' }));
      expect(target.scrollIntoView).toHaveBeenCalledWith({
        behavior: reduced ? 'auto' : 'smooth',
        block: 'start',
      });
    } finally {
      target.remove();
      window.matchMedia = original;
    }
  }
);
