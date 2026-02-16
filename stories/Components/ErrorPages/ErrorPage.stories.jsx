import React from 'react';
import ErrorPage from './ErrorPage.jsx';
import { DEFAULT_COPY } from './ErrorPagesContent.js';

export default {
  title: 'Components/Error pages',
  component: ErrorPage,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    code: {
      control: { type: 'select' },
      options: Object.keys(DEFAULT_COPY).map(Number),
    },
    variant: {
      control: { type: 'select' },
      options: ['error', 'challenge'],
    },
    challengeType: {
      control: { type: 'select' },
      options: ['challenge', 'managed-challenge'],
      if: { arg: 'variant', eq: 'challenge' },
    },
    showSearch: { control: 'boolean' },
    showRequestDetails: { control: 'boolean' },
  },
};

export const NotFound404 = {
  args: { code: 404, showSearch: true, showRequestDetails: true },
};

export const Forbidden403 = {
  args: { code: 403, showRequestDetails: true },
};

export const TooManyRequests429 = {
  args: { code: 429, showRequestDetails: true },
};

export const BadGateway502 = {
  args: { code: 502, showRequestDetails: true },
};

export const ServiceUnavailable503 = {
  args: { code: 503, showRequestDetails: true },
};

export const InternalServerError500 = {
  args: { code: 500, showRequestDetails: true },
};

export const GatewayTimeout504 = {
  args: { code: 504, showRequestDetails: true },
};

export const Unauthorized401 = {
  args: { code: 401, showRequestDetails: true },
};

export const InteractiveChallenge = {
  args: {
    variant: 'challenge',
    challengeType: 'challenge',
  },
};

export const ManagedChallenge = {
  args: {
    variant: 'challenge',
    challengeType: 'managed-challenge',
  },
};
