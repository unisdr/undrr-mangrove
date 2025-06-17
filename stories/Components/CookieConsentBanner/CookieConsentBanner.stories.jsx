import React from 'react';
import CookieConsentBanner from './CookieConsentBanner';

export default {
  title: 'Components/CookieConsentBanner',
  component: CookieConsentBanner,
};

const Template = (args) => <CookieConsentBanner {...args} />;

export const Default = Template.bind({});
Default.args = {};

export const WithResetButton = (args) => {
  const handleResetConsent = () => {
    if (window.CookieConsent) {
      window.CookieConsent.reset(true);
      if (typeof window.CookieConsent.showConsentModal === 'function') {
        window.CookieConsent.showConsentModal();
      }   
    } else {
      console.log('CookieConsent library not loaded yet.');
    }
  };

  return (
    <div>
      <p>The CookieConsentBanner is active (or will be loaded) below.</p>
      <CookieConsentBanner {...args} />
      <button onClick={handleResetConsent}>
        Reset Consent
      </button>
    </div>
  );
};
WithResetButton.storyName = 'Reset Banner';