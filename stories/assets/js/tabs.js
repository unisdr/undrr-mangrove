// mg-tabs

// Matches $mg-breakpoint-mobile in _variables.scss
const BREAKPOINT_MOBILE = 480;

/**
 * Determine whether a tab container should behave as stacked (disclosure)
 * rather than horizontal tabs.
 * @param {Element} container - the [data-mg-js-tabs] element
 * @returns {boolean}
 */
function isStacked(container) {
  return (
    container.dataset.mgJsTabsVariant === 'stacked' ||
    window.innerWidth < BREAKPOINT_MOBILE
  );
}

/**
 * Initialize tabs on a page
 * @param {boolean} [activateDeepLinkOnLoad] - if deep linked tabs should be activated on page load, defaults to true
 * @example mgTabs();
 */
export function mgTabs(scope, activateDeepLinkOnLoad = true) {
  const tabContainers = scope || document.querySelectorAll('[data-mg-js-tabs]');
  tabContainers.forEach(container => {
    mgTabsRuntime(container, activateDeepLinkOnLoad);
  });
}

/**
 * Finds all tabs on a page and activates them
 * @param {object} [scope] - the html scope to process, optional, defaults to `document`
 * @param {boolean} [activateDeepLinkOnLoad] - if deep linked tabs should be activated on page load, defaults to true
 * @example mgTabs(document.querySelectorAll('.mg-component__container')[0]);
 */
export function mgTabsRuntime(scope, activateDeepLinkOnLoad) {
  var scope = scope || document;
  var activateDeepLinkOnLoad = activateDeepLinkOnLoad ?? true;

  // Get relevant elements and collections
  if (scope.hasAttribute('data-mg-js-tabs')) {
    var tabsList = scope;
  } else {
    var tabsList =
      scope.querySelectorAll('[data-mg-js-tabs]') || newTab.closest('.mg-tabs'); // compatibility with v1 tabs
  }
  const tabs = scope.querySelectorAll('.mg-tabs__link');
  var panels = scope.querySelectorAll('[id^="mg-tabs__section"]');
  // v1 compatibility
  // If panels is empty, try finding them in data-mg-js-tabs-content
  if (!panels.length) {
    const tabContent = scope
      .closest('.mg-tabs')
      .querySelector('[data-mg-js-tabs-content]');
    if (tabContent) {
      panels = tabContent.querySelectorAll('[id^="mg-tabs__section"]');
    }
  }

  if (!tabsList || !panels || !tabs) {
    // exit: either tabs or tabbed content not found
    return;
  }
  if (tabsList.length == 0 || panels.length == 0 || tabs.length == 0) {
    // exit: either tabs or tabbed content not found
    return;
  }

  // Normalize tabsList to an array so we can iterate uniformly
  // (when scope has [data-mg-js-tabs], tabsList is a single Element)
  const tabsListArray = tabsList.nodeType
    ? [tabsList]
    : Array.from(tabsList);

  // Check if tabs have already been initialized
  if (tabsList.hasAttribute && tabsList.hasAttribute('data-mg-tabs-initialized')) {
    return;
  }
  if (tabsList.hasAttribute) {
    tabsList.setAttribute('data-mg-tabs-initialized', 'true');
  } else if (tabsListArray.length > 0) {
    if (tabsListArray[0].hasAttribute('data-mg-tabs-initialized')) {
      return;
    }
    tabsListArray[0].setAttribute('data-mg-tabs-initialized', 'true');
  }

  // Determine variant from the container element
  const container = tabsListArray[0];
  const stacked = isStacked(container);

  // Add semantics and remove user focusability for each tab
  Array.prototype.forEach.call(tabs, (tab, i) => {
    const tabId = tab.href.split('#')[1];
    tab.setAttribute('id', tabId);
    tab.setAttribute('data-tabs__item', tabId);
    tab.setAttribute('tabindex', '-1');

    if (stacked) {
      // Disclosure pattern: each trigger is a button that toggles its panel
      tab.setAttribute('role', 'button');
      tab.setAttribute('aria-expanded', 'false');
      tab.setAttribute('aria-controls', tabId);
      tab.parentNode.removeAttribute('role');
    } else {
      // Horizontal tabs: standard tablist pattern
      tab.setAttribute('role', 'tab');
      tab.parentNode.setAttribute('role', 'presentation');
    }

    // Reset any active tabs from a previous JS call
    tab.removeAttribute('aria-selected');
    tab.setAttribute('tabindex', '-1');
    tab.classList.remove('is-active');

    // Handle clicking of tabs for mouse users
    tab.addEventListener('click', e => {
      e.preventDefault();
      mgTabsSwitch(e.currentTarget, panels);
    });

    // Handle keydown events for keyboard users
    tab.addEventListener('keydown', e => {
      // Get the index of the current tab in the tabs node list
      const index = Array.prototype.indexOf.call(tabs, e.currentTarget);
      const parentContainer =
        e.currentTarget.closest('[data-mg-js-tabs]') ||
        e.currentTarget.closest('.mg-tabs');
      const currentlyStacked = isStacked(parentContainer);

      // Stacked: Up/Down to navigate triggers, Home/End for first/last
      // Horizontal: Left/Right to navigate tabs, Down to focus panel
      let dir = null;
      if (currentlyStacked) {
        if (e.key === 'ArrowUp') {
          dir = index - 1;
        } else if (e.key === 'ArrowDown') {
          dir = index + 1;
        } else if (e.key === 'Home') {
          dir = 0;
        } else if (e.key === 'End') {
          dir = tabs.length - 1;
        }
      } else {
        if (e.key === 'ArrowLeft') {
          dir = index - 1;
        } else if (e.key === 'ArrowRight') {
          dir = index + 1;
        } else if (e.key === 'ArrowDown') {
          dir = 'down';
        } else if (e.key === 'Home') {
          dir = 0;
        } else if (e.key === 'End') {
          dir = tabs.length - 1;
        }
      }

      if (dir !== null) {
        e.preventDefault();
        if (dir === 'down') {
          panels[i].focus({ preventScroll: true });
        } else if (tabs[dir]) {
          if (currentlyStacked) {
            // In stacked mode, just move focus without switching
            tabs[dir].focus({ preventScroll: true });
          } else {
            mgTabsSwitch(tabs[dir], panels);
          }
        }
      }
    });
  });

  // Add panel semantics and hide them all
  Array.prototype.forEach.call(panels, panel => {
    const panelId = panel.id;
    // Find the corresponding tab trigger
    const correspondingTab = scope.querySelector(`[data-tabs__item="${panelId}"]`);
    const labelId = correspondingTab ? correspondingTab.id : panelId;

    if (stacked) {
      // Disclosure pattern: panels are regions labelled by their trigger
      panel.setAttribute('role', 'region');
      panel.setAttribute('aria-labelledby', labelId);
      panel.setAttribute('hidden', 'until-found');
    } else {
      // Horizontal tabs: standard tabpanel
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', labelId);
      panel.hidden = true;
    }
    panel.setAttribute('tabindex', '-1');
  });

  // Set up container roles and initial state
  tabsListArray.forEach(tabsListset => {
    if (!isStacked(tabsListset)) {
      // Apply role="tablist" to the <ul> so role="tab" children are valid
      const tabListEl = tabsListset.querySelector('.mg-tabs__list') || tabsListset;
      tabListEl.setAttribute('role', 'tablist');

      // All direct <li> children of the tablist need role="presentation"
      // so they don't break the tablist → tab hierarchy
      tabListEl.querySelectorAll(':scope > li').forEach(li => {
        li.setAttribute('role', 'presentation');
      });

      // Initially activate the first tab
      let firstTab = tabsListset.querySelectorAll('.mg-tabs__link')[0];
      firstTab.removeAttribute('tabindex');
      firstTab.setAttribute('aria-selected', 'true');
      firstTab.classList.add('is-active');

      // Initially reveal the first tab panel
      const panelsList = tabsListset.querySelectorAll(
        '[data-mg-js-tabs-content]'
      );
      Array.prototype.forEach.call(panelsList, panel => {
        let firstPanel = tabsListset.querySelectorAll('.mg-tabs__section')[0];
        firstPanel.hidden = false;
      });
    }
  });

  // Activate any deep links to a specific tab
  if (activateDeepLinkOnLoad) {
    mgTabsDeepLinkOnLoad(tabs, panels);
  }

  // When using anchor links after load, activate the corresponding tab
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash
      ? window.location.hash.substring(1)
      : null;
    if (!hash) return;

    // Only act if this tabset contains the target panel id to avoid
    // unintentionally changing other tabsets on the page
    let targetPanelFound = false;
    Array.prototype.forEach.call(panels, panel => {
      if (panel.id === hash) {
        targetPanelFound = true;
      }
    });

    if (targetPanelFound) {
      mgTabsDeepLinkOnLoad(tabs, panels);
    }
  });
}

// The tab switching function
const mgTabsSwitch = (newTab, panels) => {
  // get the parent ul of the clicked tab
  let parentTabContainer =
    newTab.closest('[data-mg-js-tabs]') || newTab.closest('.mg-tabs'); // compatibility with v1 tabs
  const stacked = isStacked(parentTabContainer);
  let oldTab = parentTabContainer.querySelector('[aria-selected]');

  // if stacked, toggle the clicked panel independently
  if (stacked) {
    const singleOpen = parentTabContainer.dataset.mgJsTabsSingleOpen != null;

    for (let item = 0; item < panels.length; item++) {
      const panel = panels[item];
      if (panel.id === newTab.id) {
        const wasHidden = panel.hidden || panel.getAttribute('hidden') === 'until-found';

        // In single-open mode, close all other panels before opening
        if (singleOpen && wasHidden) {
          const allTriggers = parentTabContainer.querySelectorAll('.mg-tabs__link');
          for (let j = 0; j < panels.length; j++) {
            const otherPanel = panels[j];
            if (otherPanel !== panel && !otherPanel.hidden && otherPanel.getAttribute('hidden') !== 'until-found') {
              otherPanel.setAttribute('hidden', 'until-found');
              // Find the corresponding trigger
              for (let k = 0; k < allTriggers.length; k++) {
                if (allTriggers[k].getAttribute('data-tabs__item') === otherPanel.id) {
                  allTriggers[k].setAttribute('aria-expanded', 'false');
                  allTriggers[k].classList.remove('is-active', 'mg-tabs__stacked--open');
                  break;
                }
              }
            }
          }
        }

        if (wasHidden) {
          panel.removeAttribute('hidden');
          newTab.setAttribute('aria-expanded', 'true');
          newTab.classList.add('is-active');
          newTab.classList.add('mg-tabs__stacked--open');
        } else {
          panel.setAttribute('hidden', 'until-found');
          newTab.setAttribute('aria-expanded', 'false');
          newTab.classList.remove('is-active');
          newTab.classList.remove('mg-tabs__stacked--open');
        }
      }
    }
    // In stacked/disclosure mode, we don't deselect other tabs or use aria-selected
    newTab.focus({ preventScroll: true });
    return;
  }

  // --- Horizontal tab behavior below ---

  if (oldTab) {
    oldTab.removeAttribute('aria-selected');
    oldTab.setAttribute('tabindex', '-1');
    oldTab.classList.remove('is-active');

    // normal horizontal tabs
    for (let item = 0; item < panels.length; item++) {
      const panel = panels[item];
      if (panel.id === oldTab.id) {
        panel.hidden = true;
      }
    }
  }

  newTab.focus({ preventScroll: true });
  // Make the active tab focusable by the user (Tab key)
  newTab.removeAttribute('tabindex');
  // Set the selected state
  newTab.setAttribute('aria-selected', 'true');
  newTab.classList.add('is-active');
  newTab.classList.toggle('mg-tabs__stacked--open'); // track open state for potential mobile view switch

  for (let item = 0; item < panels.length; item++) {
    const panel = panels[item];
    if (panel.id === newTab.id) {
      panel.hidden = false;
      break;
    }
  }
};

/**
 * Apply default open/close state for stacked tabs.
 *
 * Priority: per-item `data-mg-js-tabs-default` > container `data-mg-js-tabs-default-open` > open first.
 *
 * @param {Element} container - the [data-mg-js-tabs] element
 * @param {NodeList|Array} tabs - the trigger links
 * @param {NodeList|Array} panels - the section panels
 */
export function mgTabsApplyStackedDefaults(container, tabs, panels) {
  const defaultOpen = container.dataset.mgJsTabsDefaultOpen;

  Array.prototype.forEach.call(tabs, (tab, i) => {
    const tabId = tab.getAttribute('data-tabs__item');
    let matchingPanel = null;
    for (let j = 0; j < panels.length; j++) {
      if (panels[j].id === tabId) {
        matchingPanel = panels[j];
        break;
      }
    }
    if (!matchingPanel) return;

    const perItemDefault = tab.getAttribute('data-mg-js-tabs-default');
    let shouldOpen;

    if (perItemDefault === 'true') {
      shouldOpen = true;
    } else if (perItemDefault === 'false') {
      shouldOpen = false;
    } else if (defaultOpen === 'true') {
      shouldOpen = true;
    } else if (defaultOpen === 'false') {
      shouldOpen = false;
    } else {
      // No container default — preserve existing behavior: open first tab
      shouldOpen = (i === 0);
    }

    if (shouldOpen) {
      matchingPanel.removeAttribute('hidden');
      tab.setAttribute('aria-expanded', 'true');
      tab.classList.add('is-active', 'mg-tabs__stacked--open');
    } else {
      matchingPanel.setAttribute('hidden', 'until-found');
      tab.setAttribute('aria-expanded', 'false');
      tab.classList.remove('is-active', 'mg-tabs__stacked--open');
    }
  });
}

function mgTabsDeepLinkOnLoad(tabs, panels) {
  var mgTabAnchorFound = false;

  if (window.location.hash) {
    // 1. See if there is a `#mg-tabs__section--88888`
    var hash = window.location.hash.substring(1); //Puts hash in variable, and removes the # character

    // 2. loop through all tabs, if a match then activate
    Array.prototype.forEach.call(tabs, tab => {
      let tabId = tab.getAttribute('data-tabs__item');
      if (tabId == hash) {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
        mgTabsSwitch(tab, panels);
        mgTabAnchorFound = true;
        return true;
      }
    });
  }

  if (!mgTabAnchorFound) {
    // Determine the container to check for stacked mode
    const container = tabs.length > 0
      ? (tabs[0].closest('[data-mg-js-tabs]') || tabs[0].closest('.mg-tabs'))
      : null;

    if (container && isStacked(container)) {
      mgTabsApplyStackedDefaults(container, tabs, panels);
    } else {
      // Horizontal tabs: find default or activate first
      let defaultTabFound = false;
      Array.from(tabs).forEach(tab => {
        if (tab.getAttribute('data-mg-js-tabs-default') === 'true') {
          mgTabsSwitch(tab, panels);
          defaultTabFound = true;
        }
      });

      if (!defaultTabFound && tabs.length > 0) {
        mgTabsSwitch(tabs[0], panels);
      }
    }
  }
}
