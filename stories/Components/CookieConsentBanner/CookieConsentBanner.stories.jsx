import React from 'react';
import CookieConsentBanner from './CookieConsentBanner';

export default {
  title: 'Components/CookieConsentBanner',
  component: CookieConsentBanner,
};

const Template = args => <CookieConsentBanner {...args} />;

export const Default = Template.bind({});
Default.args = {};

export const WithResetButton = args => {
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
};
WithResetButton.storyName = 'Reset Banner';

export const FallbackDemo = args => (
  <div>
    <p>
      This story forces fallback configuration to demonstrate local config
      loading when the CDN is unavailable.
    </p>
    <CookieConsentBanner {...args} forceFallback debug />
  </div>
);
FallbackDemo.storyName = 'Fallback (Local Config)';

export const CustomConfigDemo = args => {
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
        This story passes a <code>config</code> prop to override the default or
        CDN configuration.
      </p>
      <CookieConsentBanner {...args} config={myCustomConfig} debug />
    </div>
  );
};
CustomConfigDemo.storyName = 'Custom Config';
