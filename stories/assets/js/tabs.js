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
 * Set the open/close state of a stacked disclosure panel.
 * @param {Element} trigger - the tab link acting as disclosure trigger
 * @param {Element} panel - the section panel
 * @param {boolean} open - true to open, false to close
 */
export function setDisclosureState(trigger, panel, open) {
  if (open) {
    panel.removeAttribute('hidden');
    trigger.setAttribute('aria-expanded', 'true');
    trigger.classList.add('is-active', 'mg-tabs__stacked--open');
  } else {
    panel.setAttribute('hidden', 'until-found');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.classList.remove('is-active', 'mg-tabs__stacked--open');
  }
}

/**
 * Find the next visible tab index, skipping items hidden by filtering.
 * @param {NodeList} tabs - all tab trigger elements
 * @param {number} fromIndex - current index to start searching from
 * @param {number} step - direction: +1 for forward, -1 for backward
 * @returns {number} index of the next visible tab, or -1 if all hidden
 */
function findVisibleTab(tabs, fromIndex, step) {
  const len = tabs.length;
  let idx = fromIndex;
  for (let i = 0; i < len; i++) {
    idx = (idx + step + len) % len;
    if (!tabs[idx].closest('.mg-tabs__item--hidden')) return idx;
  }
  return -1;
}

/**
 * Normalize text for filter matching: collapse smart quotes, dashes,
 * and other typographic punctuation to their plain ASCII equivalents.
 * @param {string} text
 * @returns {string}
 */
function normalizeText(text) {
  return text
    .replace(/[\u2018\u2019\u201A\u2032]/g, "'")   // smart single quotes, prime
    .replace(/[\u201C\u201D\u201E\u2033]/g, '"')    // smart double quotes, double prime
    .replace(/[\u2013\u2014\u2015]/g, '-')           // en dash, em dash, horizontal bar
    .replace(/\u2026/g, '...')                       // ellipsis
    .replace(/[\u00A0]/g, ' ');                      // non-breaking space
}

/**
 * Initialize tabs on a page.
 *
 * @param {NodeList|HTMLElement[]|HTMLElement} [scope] - Elements to init.
 *   Accepts a NodeList, array, or a single HTMLElement.
 *   Defaults to all [data-mg-js-tabs] in the document.
 * @param {boolean} [activateDeepLinkOnLoad] - if deep linked tabs should be activated on page load, defaults to true
 * @example mgTabs();
 */
export function mgTabs(scope, activateDeepLinkOnLoad = true) {
  const tabContainers = scope
    ? (scope.forEach ? scope : [scope])
    : document.querySelectorAll('[data-mg-js-tabs]');
  tabContainers.forEach(container => {
    // Skip auto-init if the element opts out
    if (!scope && container.hasAttribute('data-mg-js-tabs-skip-auto-init')) return;
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
  var panels = scope.querySelectorAll('[id^="mg-tabs__section"]:not(a)');
  // v1 compatibility
  // If panels is empty, try finding them in data-mg-js-tabs-content
  if (!panels.length) {
    const tabContent = scope
      .closest('.mg-tabs')
      .querySelector('[data-mg-js-tabs-content]');
    if (tabContent) {
      panels = tabContent.querySelectorAll('[id^="mg-tabs__section"]:not(a)');
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
  // Supports both the new dataset property and the legacy attribute for backward compat
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

  // Add semantics and focusability for each tab
  Array.prototype.forEach.call(tabs, (tab, i) => {
    const panelId = tab.href.split('#')[1];
    tab.setAttribute('data-tabs__item', panelId);

    // Give trigger a distinct ID so it doesn't collide with the panel's ID
    tab.setAttribute('id', panelId + '--trigger');

    if (stacked) {
      // Disclosure pattern: each trigger is a button that toggles its panel
      tab.setAttribute('role', 'button');
      tab.setAttribute('aria-expanded', 'false');
      tab.setAttribute('aria-controls', panelId);
      tab.parentNode.removeAttribute('role');
      // Stacked triggers must be in the Tab order (disclosure buttons)
      tab.removeAttribute('tabindex');
    } else {
      // Horizontal tabs: standard tablist pattern (roving tabindex)
      tab.setAttribute('role', 'tab');
      tab.parentNode.setAttribute('role', 'presentation');
      tab.setAttribute('tabindex', '-1');
    }

    // Reset any active tabs from a previous JS call
    tab.removeAttribute('aria-selected');
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

      // Stacked: Space/Enter to toggle, Up/Down to navigate, Home/End for first/last
      // Horizontal: Left/Right to navigate tabs, Down to focus panel
      if (currentlyStacked && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        mgTabsSwitch(e.currentTarget, panels);
        return;
      }

      const prevKey = currentlyStacked ? 'ArrowUp' : 'ArrowLeft';
      const nextKey = currentlyStacked ? 'ArrowDown' : 'ArrowRight';
      let dir = null;

      if (e.key === prevKey) {
        dir = findVisibleTab(tabs, index, -1);
      } else if (e.key === nextKey) {
        dir = findVisibleTab(tabs, index, 1);
      } else if (!currentlyStacked && e.key === 'ArrowDown') {
        dir = 'down';
      } else if (e.key === 'Home') {
        dir = findVisibleTab(tabs, -1, 1);
      } else if (e.key === 'End') {
        dir = findVisibleTab(tabs, tabs.length, -1);
      }

      if (dir !== null && dir !== -1) {
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
    if (!stacked) {
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

  // Initialize filter if the container has the filterable attribute
  if (stacked && container.dataset.mgJsTabsFilterable != null) {
    mgTabsInitFilter(container, tabs, panels);
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
  const targetPanelId = newTab.getAttribute('data-tabs__item');
  let oldTab = parentTabContainer.querySelector('[aria-selected]');

  // if stacked, toggle the clicked panel independently
  if (stacked) {
    const isSingleOpen = parentTabContainer.dataset.mgJsTabsSingleOpen != null;

    for (let item = 0; item < panels.length; item++) {
      const panel = panels[item];
      if (panel.id === targetPanelId) {
        const wasHidden = panel.hidden || panel.getAttribute('hidden') === 'until-found';

        // In single-open mode, close all other panels before opening
        if (isSingleOpen && wasHidden) {
          for (let j = 0; j < panels.length; j++) {
            const otherPanel = panels[j];
            if (otherPanel !== panel && !otherPanel.hidden && otherPanel.getAttribute('hidden') !== 'until-found') {
              const otherTrigger = parentTabContainer.querySelector(
                `[data-tabs__item="${otherPanel.id}"]`
              );
              if (otherTrigger) {
                setDisclosureState(otherTrigger, otherPanel, false);
              }
            }
          }
        }

        setDisclosureState(newTab, panel, wasHidden);
        break;
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

    const oldPanelId = oldTab.getAttribute('data-tabs__item');
    for (let item = 0; item < panels.length; item++) {
      const panel = panels[item];
      if (panel.id === oldPanelId) {
        panel.hidden = true;
        break;
      }
    }
  }

  newTab.focus({ preventScroll: true });
  // Make the active tab focusable by the user (Tab key)
  newTab.removeAttribute('tabindex');
  // Set the selected state
  newTab.setAttribute('aria-selected', 'true');
  newTab.classList.add('is-active');
  newTab.classList.add('mg-tabs__stacked--open'); // track open state for potential mobile view switch

  for (let item = 0; item < panels.length; item++) {
    const panel = panels[item];
    if (panel.id === targetPanelId) {
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

    setDisclosureState(tab, matchingPanel, shouldOpen);
  });
}

/**
 * Initialize filter input for stacked tabs.
 * Injects a search input, sr-only hint, and status region before the tab list.
 * Handles debounced filtering, show/hide via CSS classes, panel expand/collapse,
 * focus rescue, and live region announcements.
 *
 * @param {Element} container - the [data-mg-js-tabs] element
 * @param {NodeList} tabs - the trigger links
 * @param {NodeList} panels - the section panels
 */
function mgTabsInitFilter(container, tabs, panels) {
  const placeholder = container.dataset.mgJsTabsFilterPlaceholder || 'Filter sections\u2026';
  const ariaLabel = placeholder.replace(/\u2026$/, '').trim();
  const totalCount = tabs.length;

  // Build filter DOM
  const filterWrapper = document.createElement('div');
  filterWrapper.className = 'mg-tabs__filter';

  const input = document.createElement('input');
  input.type = 'search';
  input.className = 'mg-form-input mg-tabs__filter-input';
  input.placeholder = placeholder;
  input.setAttribute('aria-label', ariaLabel);

  const hintId = 'mg-tabs-filter-hint-' + Math.random().toString(36).slice(2, 8);
  input.setAttribute('aria-describedby', hintId);

  const hint = document.createElement('span');
  hint.id = hintId;
  hint.className = 'mg-u-sr-only';
  hint.textContent = 'Results will filter as you type';

  filterWrapper.appendChild(input);
  filterWrapper.appendChild(hint);

  // Status region for screen reader announcements
  const status = document.createElement('p');
  status.className = 'mg-u-sr-only';
  status.setAttribute('role', 'status');

  // Insert before the tab list
  const tabList = container.querySelector('.mg-tabs__list');
  container.insertBefore(filterWrapper, tabList);

  // No-results element (hidden by default, shown when matchCount === 0)
  // No role="status" here — the sr-only status element handles announcements
  const noResults = document.createElement('p');
  noResults.className = 'mg-tabs__no-results mg-tabs__no-results--hidden';
  noResults.textContent = 'No matching sections found.';
  if (tabList.nextSibling) {
    container.insertBefore(noResults, tabList.nextSibling);
  } else {
    container.appendChild(noResults);
  }
  container.appendChild(status);

  let hasFiltered = false;
  let debounceTimer = null;

  function applyFilter() {
    const query = input.value.toLowerCase().trim();

    if (!query) {
      if (!hasFiltered) return;
      // Restore: show all items, reset to default state
      const items = container.querySelectorAll('.mg-tabs__item');
      items.forEach(item => {
        item.classList.remove('mg-tabs__item--hidden');
        const contentLi = item.nextElementSibling;
        if (contentLi?.classList.contains('mg-tabs-content')) {
          contentLi.classList.remove('mg-tabs-content--hidden');
        }
      });
      mgTabsApplyStackedDefaults(container, tabs, panels);
      noResults.classList.add('mg-tabs__no-results--hidden');
      status.textContent = '';
      return;
    }

    hasFiltered = true;
    const items = container.querySelectorAll('.mg-tabs__item');
    const words = normalizeText(query).split(/\s+/).filter(Boolean);
    if (words.length === 0) return;
    let matches = 0;

    items.forEach(item => {
      const trigger = item.querySelector('.mg-tabs__link');
      const contentLi = item.nextElementSibling;
      const panel = contentLi?.querySelector('.mg-tabs__section');

      const triggerText = trigger?.textContent?.toLowerCase() || '';
      const panelText = panel?.textContent?.toLowerCase() || '';
      const combinedText = normalizeText(triggerText + ' ' + panelText);
      const isMatch = words.every(word => combinedText.includes(word));

      item.classList.toggle('mg-tabs__item--hidden', !isMatch);
      if (contentLi?.classList.contains('mg-tabs-content')) {
        contentLi.classList.toggle('mg-tabs-content--hidden', !isMatch);
      }

      if (panel && trigger) {
        setDisclosureState(trigger, panel, isMatch);
      }
      if (isMatch) matches++;
    });

    // Focus rescue: if active element is now hidden, move to filter input
    const active = document.activeElement;
    if (active && active.closest && active.closest('.mg-tabs__item--hidden')) {
      input.focus();
    }

    // Update live regions
    if (matches === 0) {
      noResults.classList.remove('mg-tabs__no-results--hidden');
      status.textContent = 'No matching sections found.';
    } else {
      noResults.classList.add('mg-tabs__no-results--hidden');
      status.textContent = matches + ' of ' + totalCount + ' sections match.';
    }
  }

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(applyFilter, 150);
  });

  // Also handle the native search clear button (fires 'search' event in some browsers)
  input.addEventListener('search', () => {
    clearTimeout(debounceTimer);
    applyFilter();
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

// Auto-wrap so the browser Event object is not passed as scope
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => mgTabs(), false);
} else {
  mgTabs();
}
