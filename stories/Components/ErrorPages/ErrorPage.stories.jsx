import React from 'react';
import ErrorPage from './ErrorPage.jsx';

export default {
  title: 'Components/Error pages/ErrorPage',
  component: ErrorPage,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    code: {
      control: { type: 'select' },
      options: [401, 403, 404, 429, 500, 502, 503, 504],
    },
    showSearch: { control: 'boolean' },
  },
};

const Template = args => <ErrorPage {...args} />;

export const NotFound404 = Template.bind({});
NotFound404.args = { code: 404, showSearch: true };

export const Forbidden403 = Template.bind({});
Forbidden403.args = { code: 403 };

export const TooManyRequests429 = Template.bind({});
TooManyRequests429.args = { code: 429 };

export const ServiceUnavailable503 = Template.bind({});
ServiceUnavailable503.args = {
  code: 503,
  actionsHtml:
    'If this continues, please check the <a href="https://messaging.undrr.org/">UNDRR status page</a>.',
  details:
    'Error code: 503 Service Unavailable\nRequest ID: abc123-example\nError URL: https://example.org/varnish-error/503',
};

export const InternalServerError500 = Template.bind({});
InternalServerError500.args = {
  code: 500,
  details:
    'Error code: 500 Service Unavailable\nRequest ID: abc123-example\nError URL: https://example.org/varnish-error/503',
};