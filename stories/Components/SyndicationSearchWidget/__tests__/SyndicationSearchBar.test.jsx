/**
 * @file SyndicationSearchBar.test.jsx
 * @description Tests for the standalone search bar that pairs with a
 * SyndicationSearchWidget via URL hash.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SyndicationSearchBar } from '../SyndicationSearchBar';
import syndicationSearchBarFromElement from '../SyndicationSearchBar.fromElement';

describe('SyndicationSearchBar', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  describe('rendering', () => {
    it('renders an input and a submit button', () => {
      render(<SyndicationSearchBar />);
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit search/i })).toBeInTheDocument();
    });

    it('uses the configured placeholder', () => {
      render(<SyndicationSearchBar placeholder="Find disasters..." />);
      expect(screen.getByRole('searchbox')).toHaveAttribute(
        'placeholder',
        'Find disasters...'
      );
    });

    it('pre-fills with defaultQuery', () => {
      render(<SyndicationSearchBar defaultQuery="climate" />);
      expect(screen.getByRole('searchbox')).toHaveValue('climate');
    });

    it('uses the configured submit label', () => {
      render(<SyndicationSearchBar submitLabel="Go" />);
      expect(
        screen.getByRole('button', { name: /submit search/i })
      ).toHaveTextContent('Go');
    });

    it('shows the clear button only when input has a value', () => {
      render(<SyndicationSearchBar />);
      expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument();

      fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'foo' } });
      expect(screen.getByRole('button', { name: /clear search/i })).toBeInTheDocument();
    });

    it('uses standard mg-button + mg-icon-search primitives', () => {
      const { container } = render(<SyndicationSearchBar />);
      const submit = container.querySelector('button[type="submit"]');
      expect(submit).toHaveClass('mg-button');
      expect(submit).toHaveClass('mg-button-primary');
      expect(submit.querySelector('.mg-icon-search')).toBeInTheDocument();
    });
  });

  describe('submit (same-page)', () => {
    it('writes #query=<encoded> to window.location.hash on submit', () => {
      render(<SyndicationSearchBar />);
      fireEvent.change(screen.getByRole('searchbox'), {
        target: { value: 'risk reduction' },
      });
      fireEvent.submit(screen.getByRole('search'));

      expect(window.location.hash).toBe('#query=risk%20reduction');
    });

    it('honors a custom paramName', () => {
      render(<SyndicationSearchBar paramName="text" />);
      fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'flood' } });
      fireEvent.submit(screen.getByRole('search'));

      expect(window.location.hash).toBe('#text=flood');
    });

    it('clears the hash when submitted with an empty query', () => {
      window.history.pushState({}, '', '/#query=stale');
      render(<SyndicationSearchBar defaultQuery="stale" />);

      fireEvent.click(screen.getByRole('button', { name: /clear search/i }));
      fireEvent.submit(screen.getByRole('search'));

      expect(window.location.hash).toBe('');
    });

    it('still ends up at the right hash when submitted with the same value', () => {
      // If the hash is already #query=foo and the user submits "foo" again,
      // the bar momentarily clears the hash and re-sets it so any
      // hashchange listener gets a chance to fire. The final hash is what
      // matters for the contract with useHashSync.
      window.history.pushState({}, '', '/#query=foo');
      render(<SyndicationSearchBar defaultQuery="foo" />);

      fireEvent.submit(screen.getByRole('search'));
      expect(window.location.hash).toBe('#query=foo');
    });
  });

  describe('submit (cross-page)', () => {
    // The bar takes a `navigate` prop for cross-page navigation. The default
    // (`window.location.assign`) cannot be spied on in JSDOM, but injecting
    // a jest.fn() here keeps the contract clear and the test self-contained.
    it('calls navigate with searchTargetUrl + hash on submit', () => {
      const navigate = jest.fn();
      render(
        <SyndicationSearchBar
          searchTargetUrl="https://example.org/search"
          navigate={navigate}
        />
      );
      fireEvent.change(screen.getByRole('searchbox'), {
        target: { value: 'resilience' },
      });
      fireEvent.submit(screen.getByRole('search'));

      expect(navigate).toHaveBeenCalledWith(
        'https://example.org/search#query=resilience'
      );
    });

    it('calls navigate with no hash when query is empty', () => {
      const navigate = jest.fn();
      render(
        <SyndicationSearchBar
          searchTargetUrl="https://example.org/search"
          navigate={navigate}
        />
      );
      fireEvent.submit(screen.getByRole('search'));
      expect(navigate).toHaveBeenCalledWith('https://example.org/search');
    });
  });

  describe('fromElement', () => {
    function makeContainer(attrs = {}) {
      const div = document.createElement('div');
      Object.entries(attrs).forEach(([k, v]) => {
        div.setAttribute(`data-${k}`, v);
      });
      return div;
    }

    it('returns an empty object when no data attributes are set', () => {
      expect(syndicationSearchBarFromElement(makeContainer())).toEqual({});
    });

    it('extracts each supported prop from data-* attributes', () => {
      const props = syndicationSearchBarFromElement(
        makeContainer({
          placeholder: 'Search the site',
          'default-query': 'flood',
          'search-target-url': '/search',
          'param-name': 'text',
          'submit-label': 'Go',
          'aria-label': 'Site search',
        })
      );
      expect(props).toEqual({
        placeholder: 'Search the site',
        defaultQuery: 'flood',
        searchTargetUrl: '/search',
        paramName: 'text',
        submitLabel: 'Go',
        ariaLabel: 'Site search',
      });
    });
  });
});
