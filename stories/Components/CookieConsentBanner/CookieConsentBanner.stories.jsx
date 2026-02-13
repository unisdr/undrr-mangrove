import React from 'react';
import CookieConsentBanner from './CookieConsentBanner';

export default {
  title: 'Components/CookieConsentBanner',
  component: CookieConsentBanner,
  argTypes: {
    config: {
      control: 'object',
      description:
        'Custom configuration to override the default CDN configuration',
    },
    debug: {
      control: 'boolean',
      description: 'Enable debug logging for troubleshooting',
    },
    forceFallback: {
      control: 'boolean',
      description:
        'Force the component to use local fallback configuration instead of CDN',
    },
    cdnBaseUrl: {
      control: 'text',
      description: 'Base URL for the CDN resources (defaults to UNDRR CDN)',
      defaultValue: 'https://assets.undrr.org/static/cookie-banner/v1',
    },
  },
};

export const Default = {
  args: {},
};

export const WithResetButton = {
  name: 'Reset Banner',
  render: args => {
    const handleResetConsent = () => {
      if (window.CookieConsent) {
        window.CookieConsent.reset(true);
        if (typeof window.CookieConsent.showConsentModal === 'function') {
          window.CookieConsent.showConsentModal();
        }
      } else {
        console.log('CookieConsent library not loaded yet from UNDRR CDN.');
      }
    };

    return (
      <div>
        <p>
          The CookieConsentBanner loads from the UNDRR CDN and will initialize
          below.
        </p>
        <p>
          <small>CDN: https://assets.undrr.org/static/cookie-banner/v1/</small>
        </p>
        <CookieConsentBanner {...args} />
        <button onClick={handleResetConsent}>Reset Consent</button>
      </div>
    );
  },
};

export const FallbackDemo = {
  name: 'Fallback (Local Config)',
  render: args => (
    <div>
      <p>
        This story forces fallback configuration to demonstrate local config
        loading when the CDN is unavailable.
      </p>
      <CookieConsentBanner {...args} forceFallback debug />
    </div>
  ),
};

export const CustomConfigDemo = {
  name: 'Custom Config',
  render: args => {
    const myCustomConfig = {
      guiOptions: {
        consentModal: {
          layout: 'bar inline',
          position: 'bottom',
        },
        preferencesModal: {
          layout: 'box',
          position: 'left',
        },
      },
      categories: {
        necessary: { readOnly: true },
        analytics: {},
        marketing: {},
      },
      language: {
        default: 'en',
        translations: {
          en: {
            consentModal: {
              title: 'Demo – Custom cookie banner',
              description:
                'This banner uses a custom configuration passed via props.',
              acceptAllBtn: 'Accept everything',
              acceptNecessaryBtn: 'Reject non-essential',
              showPreferencesBtn: 'Preferences',
            },
          },
        },
      },
    };

    return (
      <div>
        <p>
          This story passes a <code>config</code> prop to override the default
          or CDN configuration.
        </p>
        <CookieConsentBanner {...args} config={myCustomConfig} debug />
      </div>
    );
  },
};

export const CustomCDNDemo = {
  name: 'Custom CDN URL',
  render: args => {
    const customCDNUrl = 'https://example.com/custom-cookie-banner';

    return (
      <div>
        <p>
          This story demonstrates how to use a custom CDN URL for loading cookie
          banner resources.
        </p>
        <p>
          <strong>Custom CDN URL:</strong> <code>{customCDNUrl}</code>
        </p>
        <p>
          <small>
            Note: This example uses a non-existent CDN URL for demonstration
            purposes. The component will fall back to local configuration when
            the CDN fails.
          </small>
        </p>
        <CookieConsentBanner {...args} cdnBaseUrl={customCDNUrl} debug />
      </div>
    );
  },
};
