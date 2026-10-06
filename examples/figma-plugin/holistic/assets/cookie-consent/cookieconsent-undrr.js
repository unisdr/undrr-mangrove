/**
 * UNDRR Cookie Consent - Common Configuration
 * This is the common configuration script for UNDRR cookie consent implementation.
 * Use this script across all UNDRR websites for consistent cookie banner behavior.
 */

// Load and initialize the cookie banner configuration
// Determine the URL of this script so we can load the configuration relative to it
const currentScript = document.currentScript || (function() {
  const scripts = document.getElementsByTagName('script');
  return scripts[scripts.length - 1];
})();

// Build an absolute URL to the config.json that sits in the same directory as this script
const scriptSrc = currentScript ? currentScript.src : window.location.href;
const configUrl = new URL('./config.json', scriptSrc).href;

// Function to add analytics region attribute to the cookie banner
function addAnalyticsRegionAttribute() {
  // Function to check and add attribute
  function checkAndAddAttribute() {
    const ccMainElement = document.getElementById('cc-main');
    if (ccMainElement) {
      ccMainElement.setAttribute('data-vf-google-analytics-region', 'undrr-cookie-banner');
      console.log('Added analytics region attribute to cookie banner');
      return true;
    }
    return false;
  }

  // Try immediately first
  if (checkAndAddAttribute()) {
    return;
  }

  // If not found, use MutationObserver to wait for it
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList') {
        if (checkAndAddAttribute()) {
          observer.disconnect();
        }
      }
    });
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Fallback: stop observing after 10 seconds
  setTimeout(() => {
    observer.disconnect();
  }, 10000);
}

async function initializeCookieBanner() {
  try {
    // Load the configuration from the JSON file
    const response = await fetch(configUrl);
    const config = await response.json();

    // Check if CookieConsent is available
    if (typeof window.CookieConsent !== 'undefined') {
      // Initialize the cookie banner with the loaded configuration
      window.CookieConsent.run(config);

      // Add analytics region attribute when the cookie banner element is available
      addAnalyticsRegionAttribute();

      console.log('Cookie banner initialized successfully');
    } else {
      console.error('CookieConsent library not found. Make sure it is loaded before this script.');
    }
  } catch (error) {
    console.error('Failed to load cookie banner configuration:', error);
  }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', initializeCookieBanner);

// Example: Check consent status
function checkConsentStatus() {
  if (typeof window.CookieConsent !== 'undefined') {
    const analyticsAccepted = CookieConsent.acceptedCategory('analytics');
    console.log('Analytics cookies accepted:', analyticsAccepted);

    // Example: Load analytics script only if consent is given
    if (analyticsAccepted) {
      // Load Google Analytics or other tracking scripts here
      console.log('Loading analytics scripts...');
    }
  }
}

// Listen for consent changes
document.addEventListener('cc:onConsent', function(event) {
  console.log('Consent given for categories:', event.detail.acceptedCategories);
  checkConsentStatus();
});

document.addEventListener('cc:onChange', function(event) {
  console.log('Consent changed for categories:', event.detail.acceptedCategories);
  checkConsentStatus();
});