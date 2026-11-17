import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { linkTo } from '@storybook/addon-links';
import { ContentFamilyGuide } from '../_shared/ContentFamilyGuide';
import { publicationPatterns } from '../Publication/patterns';

jest.mock('@storybook/addon-links', () => ({
  linkTo: jest.fn(() => jest.fn()),
}));

// The installed React adapter is ESM-only. Exercise the guide's event/identity
// contract here; the real adapter href and keyboard navigation are browser-checked.
jest.mock('@storybook/addon-links/react', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockLinkTo({ children, onClick }) {
      return React.createElement('a', { href: '#', onClick }, children);
    },
  };
});

beforeEach(() => linkTo.mockClear());

test('full-page navigation dispatches the pinned story ID independently of renamed labels and categories', () => {
  const family = {
    ...publicationPatterns,
    presentations: {
      ...publicationPatterns.presentations,
      fullPage: {
        ...publicationPatterns.presentations.fullPage,
        reference: {
          ...publicationPatterns.presentations.fullPage.reference,
          kind: 'A renamed category',
          story: 'A renamed display label',
        },
      },
    },
  };
  render(<ContentFamilyGuide family={family} />);
  const reference = screen.getByRole('link', {
    name: 'Open full page reference',
  });
  fireEvent.click(reference, { button: 0 });
  expect(linkTo).toHaveBeenCalledWith('patterns-landing-pages--report-landing');
  expect(linkTo.mock.results[0].value).toHaveBeenCalledTimes(1);
});

test.each(['ctrlKey', 'metaKey'])(
  '%s modified activation keeps native link behaviour instead of dispatching Storybook navigation',
  modifier => {
    render(<ContentFamilyGuide family={publicationPatterns} />);
    const reference = screen.getByRole('link', {
      name: 'Open full page reference',
    });
    // Stop jsdom's unimplemented page navigation after checking the actual
    // modified-click handler; this listener is not part of the component.
    reference.addEventListener('click', event => event.preventDefault());
    fireEvent.click(reference, { button: 0, [modifier]: true });
    expect(linkTo).not.toHaveBeenCalled();
  }
);
