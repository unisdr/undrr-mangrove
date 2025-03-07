// mg-tabs
/**
 * Initialize tabs on a page
 * @param {boolean} [activateDeepLinkOnLoad] - if deep linked tabs should be activated on page load, defaults to true
 * @example mgTabs();
 */
export function mgTabs(scope, activateDeepLinkOnLoad = true) {
  const tabContainers = scope || document.querySelectorAll("[data-mg-js-tabs]");
  tabContainers.forEach((container) => {
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
  var activateDeepLinkOnLoad = activateDeepLinkOnLoad || true;

  // Get relevant elements and collections
  if (scope.hasAttribute("data-mg-js-tabs")) {
    var tabsList = scope;
  } else {
    var tabsList =
      scope.querySelectorAll("[data-mg-js-tabs]") || newTab.closest(".mg-tabs"); // compatibility with v1 tabs
  }
  const tabs = scope.querySelectorAll(".mg-tabs__link");
  const panels = scope.querySelectorAll('[id^="mg-tabs__section"]');
  // v1 compatibility
  // If panels is empty, try finding them in data-mg-js-tabs-content
  if (!panels.length) {
    const tabContent = scope
      .closest(".mg-tabs")
      .querySelector("[data-mg-js-tabs-content]");
    console.log(tabsList, tabContent);
    if (tabContent) {
      panels = tabContent.querySelectorAll('[id^="mg-tabs__section"]');
    }
  }

  // console.log("debug: All panels");
  // console.log("Tab list: " , tabsList);
  // console.log("Panel List: ", panelsList);
  // console.log("Panels: ", panels);
  // console.log("Tabs: ", tabs);
  // console.log("End Debug: All panels");

  if (!tabsList || !panels || !tabs) {
    // exit: either tabs or tabbed content not found
    return;
  }
  if (tabsList.length == 0 || panels.length == 0 || tabs.length == 0) {
    // exit: either tabs or tabbed content not found
    return;
  }

  // Check if tabs have already been initialized
  if (tabsList.hasAttribute("data-mg-tabs-initialized")) {
    return;
  }
  tabsList.setAttribute("data-mg-tabs-initialized", "true");
  
  // Add semantics are remove user focusability for each tab
  Array.prototype.forEach.call(tabs, (tab, i) => {
    const tabId = tab.href.split("#")[1]; // calculate an ID based off the tab href (todo: add support for a data-vf-js-tab-id, and if set use that)
    tab.setAttribute("role", "tab");
    tab.setAttribute("id", tabId);
    tab.setAttribute("data-tabs__item", tabId);
    tab.setAttribute("tabindex", "-1");
    tab.parentNode.setAttribute("role", "presentation");

    // Reset any active tabs from a previous JS call
    tab.removeAttribute("aria-selected");
    tab.setAttribute("tabindex", "-1");
    tab.classList.remove("is-active");

    // Handle clicking of tabs for mouse users
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      mgTabsSwitch(e.currentTarget, panels);
    });

    // Handle keydown events for keyboard users
    tab.addEventListener("keydown", (e) => {
      // Get the index of the current tab in the tabs node list
      let index = Array.prototype.indexOf.call(tabs, e.currentTarget);
      // Work out which key the user is pressing and
      // Calculate the new tab's index where appropriate
      let dir =
        e.which === 37
          ? index - 1
          : e.which === 39
            ? index + 1
            : e.which === 40
              ? "down"
              : null;
      if (dir !== null) {
        e.preventDefault();
        // If the down key is pressed, move focus to the open panel,
        // otherwise switch to the adjacent tab
        dir === "down"
          ? panels[i].focus({ preventScroll: true })
          : tabs[dir]
            ? mgTabsSwitch(tabs[dir], panels)
            : void 0;
      }
    });
  });

  // Add tab panel semantics and hide them all
  Array.prototype.forEach.call(panels, (panel) => {
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("tabindex", "-1");
    // let id = panel.getAttribute("id");
    panel.setAttribute("aria-labelledby", panel.id);
    panel.hidden = true;
  });

  // Add the tabsList role to the first <ul> in the .tabbed container
  Array.prototype.forEach.call(tabsList, (tabsListset) => {
    tabsListset.setAttribute("role", "tablist");
    // Show the first tab (if the parent tabset is not stacked and screen is not narrow)
    if (
      tabsListset.dataset.mgJsTabsVariant != "stacked" &&
      window.innerWidth >= 600
    ) {
      // Initially activate the first tab
      let firstTab = tabsListset.querySelectorAll(".mg-tabs__link")[0];
      firstTab.removeAttribute("tabindex");
      firstTab.setAttribute("aria-selected", "true");
      firstTab.classList.add("is-active");

      // Initially reveal the first tab panel
      const panelsList = tabsListset.querySelectorAll(
        "[data-mg-js-tabs-content]",
      );
      Array.prototype.forEach.call(panelsList, (panel) => {
        let firstPanel = tabsListset.querySelectorAll(".mg-tabs__section")[0];
        firstPanel.hidden = false;
      });
    }
  });

  // Activate any deep links to a specific tab
  if (activateDeepLinkOnLoad) {
    mgTabsDeepLinkOnLoad(tabs, panels);
  }
}

// The tab switching function
const mgTabsSwitch = (newTab, panels) => {
  // get the parent ul of the clicked tab
  let parentTabContainer =
    newTab.closest("[data-mg-js-tabs]") || newTab.closest(".mg-tabs"); // compatibility with v1 tabs
  let oldTab = parentTabContainer.querySelector("[aria-selected]");
  const behaveAsHorizontalTabs =
    parentTabContainer.dataset.mgJsTabsVariant != "stacked" &&
    window.innerWidth >= 600;

  // if it is marked as stacked or small screen (this is not an inverse of behaveAsHorizontalTabs)
  if (
    parentTabContainer.dataset.mgJsTabsVariant == "stacked" ||
    window.innerWidth <= 600
  ) {
    for (let item = 0; item < panels.length; item++) {
      const panel = panels[item];
      if (panel.id === newTab.id) {
        panel.hidden = !panel.hidden;
      }
    }
  }

  if (oldTab) {
    oldTab.removeAttribute("aria-selected");
    oldTab.setAttribute("tabindex", "-1");
    oldTab.classList.remove("is-active");

    if (behaveAsHorizontalTabs) {
      // normal horizontal tabs
      for (let item = 0; item < panels.length; item++) {
        const panel = panels[item];
        if (panel.id === oldTab.id) {
          panel.hidden = true;
        }
      }
    }
  }

  newTab.focus({ preventScroll: true });
  // Make the active tab focusable by the user (Tab key)
  newTab.removeAttribute("tabindex");
  // Set the selected state
  newTab.setAttribute("aria-selected", "true");
  newTab.classList.add("is-active");
  newTab.classList.toggle("mg-tabs__stacked--open"); // we always track the user's open state, even if not stacked as we may switch to mobile view  // Get the indices of the new tab to find the correct tab panel to show
  if (behaveAsHorizontalTabs) {
    for (let item = 0; item < panels.length; item++) {
      const panel = panels[item];
      if (panel.id === newTab.id) {
        panel.hidden = false;
        break;
      }
    }
  }
};

function mgTabsDeepLinkOnLoad(tabs, panels) {
  var mgTabAnchorFound = false;

  if (window.location.hash) {
    // 1. See if there is a `#mg-tabs__section--88888`
    var hash = window.location.hash.substring(1); //Puts hash in variable, and removes the # character

    // 2. loop through all tabs, if a match then activate
    Array.prototype.forEach.call(tabs, (tab) => {
      let tabId = tab.getAttribute("data-tabs__item");
      if (tabId == hash) {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
        mgTabsSwitch(tab, panels);
        mgTabAnchorFound = true;
        return true;
      }
    });
  }

  if (!mgTabAnchorFound) {
    // No hash found - look for default tab
    let defaultTabFound = false;
    Array.from(tabs).forEach((tab) => {
      if (tab.getAttribute("data-mg-js-tabs-default") === "true") {
        mgTabsSwitch(tab, panels);
        defaultTabFound = true;
      }
    });
    
    // If no default tab is found, activate the first tab
    if (!defaultTabFound && tabs.length > 0) {
      mgTabsSwitch(tabs[0], panels);
    }
  }
}
