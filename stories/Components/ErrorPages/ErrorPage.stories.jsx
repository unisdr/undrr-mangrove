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
    showSearch: { control: 'boolean' },
    showRequestDetails: { control: 'boolean' },
  },
};

const Template = args => <ErrorPage {...args} />;

export const NotFound404 = Template.bind({});
NotFound404.args = { code: 404, showSearch: true, showRequestDetails: true };

export const Forbidden403 = Template.bind({});
Forbidden403.args = { code: 403, showRequestDetails: true };

export const TooManyRequests429 = Template.bind({});
TooManyRequests429.args = { code: 429, showRequestDetails: true };

export const BadGateway502 = Template.bind({});
BadGateway502.args = { code: 502, showRequestDetails: true };

export const ServiceUnavailable503 = Template.bind({});
ServiceUnavailable503.args = { code: 503, showRequestDetails: true };

export const InternalServerError500 = Template.bind({});
InternalServerError500.args = { code: 500, showRequestDetails: true };

export const GatewayTimeout504 = Template.bind({});
GatewayTimeout504.args = { code: 504, showRequestDetails: true };

export const Unauthorized401 = Template.bind({});
Unauthorized401.args = { code: 401, showRequestDetails: true };
