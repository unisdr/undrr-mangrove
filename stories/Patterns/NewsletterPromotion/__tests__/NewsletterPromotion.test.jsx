import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CompactSignup, ServiceError } from '../NewsletterPromotion.stories';

// Play functions run in Storybook; these tests exercise the rendered form.
jest.mock('storybook/test', () => ({}));

const context = { globals: { locale: 'english' } };

test('validates email, simulates confirmation, and restores focus for another address', async () => {
  render(CompactSignup.render({ response: 'success' }, context));
  fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
  expect(screen.getByText('Enter a valid email address.')).toBeVisible();
  const email = screen.getByLabelText('Email address');
  expect(email).toHaveFocus();
  fireEvent.change(email, { target: { value: 'reader@example.org' } });
  fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
  expect(screen.getByRole('button', { name: 'Sending…' })).toHaveAttribute(
    'aria-disabled',
    'true'
  );
  await waitFor(() =>
    expect(
      screen.getByRole('heading', { name: 'Check your inbox' })
    ).toHaveFocus()
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Use another email address' })
  );
  expect(screen.getByLabelText('Email address')).toHaveValue('');
  expect(screen.getByLabelText('Email address')).toHaveFocus();
});

test('preserves address and preferences after a simulated service error', async () => {
  render(ServiceError.render({ response: 'error' }, context));
  fireEvent.change(screen.getByLabelText('Email address'), {
    target: { value: 'reader@example.org' },
  });
  fireEvent.click(screen.getByLabelText('Early warning'));
  fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
  await screen.findByRole('alert');
  expect(screen.getByLabelText('Email address')).toHaveValue(
    'reader@example.org'
  );
  expect(screen.getByLabelText('Early warning')).toBeChecked();
  expect(screen.getByRole('button', { name: 'Subscribe' })).toHaveAttribute(
    'aria-disabled',
    'false'
  );
});
