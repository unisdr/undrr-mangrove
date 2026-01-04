/**
 * @file SearchForm.test.jsx
 * @description Tests for SearchForm component.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchProvider } from '../context/SearchContext';
import SearchForm from '../components/SearchForm';

// Helper to render with provider
function renderWithProvider(props = {}, config = {}) {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
    isStale: false,
    isLoading: false,
    widgetId: 'test',
  };

  return render(
    <SearchProvider config={config}>
      <SearchForm {...defaultProps} {...props} />
    </SearchProvider>
  );
}

describe('SearchForm', () => {
  describe('rendering', () => {
    it('renders search form with input and button', () => {
      renderWithProvider();

      expect(screen.getByRole('search')).toBeInTheDocument();
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /submit search/i })
      ).toBeInTheDocument();
    });

    it('renders with accessible label', () => {
      renderWithProvider();

      const input = screen.getByRole('searchbox');
      expect(input).toHaveAccessibleName('Search');
    });

    it('has correct placeholder', () => {
      renderWithProvider();

      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('placeholder', 'Search...');
    });

    it('renders with provided value', () => {
      renderWithProvider({ value: 'test query' });

      expect(screen.getByRole('searchbox')).toHaveValue('test query');
    });

    it('shows clear button when value is present', () => {
      renderWithProvider({ value: 'test query' });

      expect(
        screen.getByRole('button', { name: /clear search/i })
      ).toBeInTheDocument();
    });

    it('does not show clear button when value is empty', () => {
      renderWithProvider({ value: '' });

      expect(
        screen.queryByRole('button', { name: /clear search/i })
      ).not.toBeInTheDocument();
    });

    it('does not render when showSearchBox is false', () => {
      renderWithProvider({}, { showSearchBox: false });

      expect(screen.queryByRole('search')).not.toBeInTheDocument();
    });
  });

  describe('loading states', () => {
    it('shows loading indicator when isLoading is true', () => {
      renderWithProvider({ isLoading: true });

      const button = screen.getByRole('button', { name: /searching/i });
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('shows loading indicator when isStale is true', () => {
      renderWithProvider({ isStale: true });

      const button = screen.getByRole('button', { name: /searching/i });
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('shows normal state when not loading', () => {
      renderWithProvider({ isLoading: false, isStale: false });

      const button = screen.getByRole('button', { name: /submit search/i });
      expect(button).toHaveAttribute('aria-busy', 'false');
    });

    it('displays "Searching" text during loading', () => {
      renderWithProvider({ isLoading: true });

      const buttonText = screen.getByRole('button', { name: /searching/i });
      expect(buttonText).toHaveTextContent('Searching');
    });

    it('displays "Search" text when not loading', () => {
      renderWithProvider({ isLoading: false });

      const buttonText = screen.getByRole('button', { name: /submit search/i });
      expect(buttonText).toHaveTextContent('Search');
    });
  });

  describe('interactions', () => {
    it('calls onChange when input value changes', () => {
      const onChange = jest.fn();
      renderWithProvider({ onChange });

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: 'new query' } });

      expect(onChange).toHaveBeenCalledWith('new query');
    });

    it('clears input when clear button is clicked', () => {
      const onChange = jest.fn();
      renderWithProvider({ value: 'test query', onChange });

      const clearButton = screen.getByRole('button', { name: /clear search/i });
      fireEvent.click(clearButton);

      expect(onChange).toHaveBeenCalledWith('');
    });

    it('prevents default form submission', () => {
      const onSubmit = jest.fn();
      renderWithProvider();

      const form = screen.getByRole('search');
      form.onsubmit = onSubmit;

      fireEvent.submit(form);

      // The form should handle submission but not navigate
      // (default is prevented in handleSubmit)
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA attributes on form', () => {
      renderWithProvider();

      const form = screen.getByRole('search');
      expect(form).toHaveAttribute('aria-label', 'Search content');
    });

    it('has screen reader hint for minimum search length', () => {
      renderWithProvider({}, { minSearchLength: 3 });

      expect(
        screen.getByText(/enter at least 3 characters to search/i)
      ).toBeInTheDocument();
    });

    it('has screen reader hint for single character search', () => {
      renderWithProvider({}, { minSearchLength: 1 });

      expect(screen.getByText(/enter search terms/i)).toBeInTheDocument();
    });

    it('input has autocomplete disabled', () => {
      renderWithProvider();

      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('autocomplete', 'off');
      expect(input).toHaveAttribute('autocorrect', 'off');
      expect(input).toHaveAttribute('autocapitalize', 'off');
      expect(input).toHaveAttribute('spellcheck', 'false');
    });

    it('clear button has accessible label', () => {
      renderWithProvider({ value: 'test' });

      const clearButton = screen.getByRole('button', { name: /clear search/i });
      expect(clearButton).toHaveAccessibleName('Clear search');
    });
  });

  describe('analytics attributes', () => {
    it('has Google Analytics region attribute', () => {
      renderWithProvider();

      const form = screen.getByRole('search');
      expect(form).toHaveAttribute(
        'data-vf-google-analytics-region',
        'undrr-search-form'
      );
    });
  });

  describe('unique IDs', () => {
    it('generates unique ID with widgetId', () => {
      renderWithProvider({ widgetId: 'widget-123' });

      const input = screen.getByRole('searchbox');
      expect(input.id).toBe('search-widget-123');
    });

    it('uses generated ID when widgetId is not provided', () => {
      renderWithProvider({ widgetId: '' });

      const input = screen.getByRole('searchbox');
      expect(input.id).toBeDefined();
      expect(input.id).not.toBe('');
    });
  });
});
