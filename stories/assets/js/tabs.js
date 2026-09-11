// Shared horizontal tabs and explicit stacked disclosures.
const instances = new WeakMap();
const responsiveInstances = new WeakMap();
const pendingStates = new WeakMap();
const MOBILE_BREAKPOINT = 480;
const isStacked = container => container.dataset.mgJsTabsVariant === 'stacked';

export function setDisclosureState(trigger, panel, open) {
  if (open) panel.removeAttribute('hidden');
  else panel.setAttribute('hidden', 'until-found');
  trigger.setAttribute('aria-expanded', String(open));
  trigger.classList.toggle('is-active', open);
  trigger.classList.toggle('mg-tabs__stacked--open', open);
}

function findVisibleTab(tabs, fromIndex, step) {
  for (let i = 0; i < tabs.length; i++) {
    fromIndex = (fromIndex + step + tabs.length) % tabs.length;
    if (!tabs[fromIndex].closest('.mg-tabs__item--hidden')) return fromIndex;
  }
  return -1;
}

function normalizeText(text) {
  return text
    .replace(/[\u2018\u2019\u201A\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201E\u2033]/g, '"')
    .replace(/[\u2013\u2014\u2015]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u00A0/g, ' ');
}

function containersIn(scope = document) {
  if (!scope.querySelectorAll) return Array.from(scope).flatMap(containersIn);
  return [
    ...(scope.matches?.('[data-mg-js-tabs]') ? [scope] : []),
    ...scope.querySelectorAll('[data-mg-js-tabs]'),
  ];
}

export function mgTabs(scope, activateDeepLinkOnLoad = true) {
  containersIn(scope).forEach(container => {
    if (!scope && container.hasAttribute('data-mg-js-tabs-skip-auto-init'))
      return;
    const retained = pendingStates.get(container);
    const requestedVariant = isStacked(container) ? 'stacked' : 'horizontal';
    const initialState =
      retained?.requestedVariant === requestedVariant ? retained : undefined;
    pendingStates.delete(container);
    initContainer(container, activateDeepLinkOnLoad, { initialState });
  });
}

export function mgTabsRuntime(scope = document, activateDeepLinkOnLoad = true) {
  mgTabs(scope, activateDeepLinkOnLoad);
}

/**
 * Remove enhancement, listeners and observers so a container can be initialised again.
 * Set preserveState for a same-layout refresh; unmounting or an explicit reset
 * should use the default. Retained state is keyed weakly and consumed once.
 */
export function mgTabsDestroy(scope = document, preserveState = false) {
  containersIn(scope)
    .reverse()
    .forEach(container => {
      const state = preserveState ? mgTabsGetState(container) : undefined;
      if (state)
        pendingStates.set(container, { ...state, restoreOpenPanels: true });
      else pendingStates.delete(container);
      (
        responsiveInstances.get(container) || instances.get(container)
      )?.destroy();
    });
}

/** Capture selection and focus before replacing a responsive layout. */
function mgTabsGetState(container) {
  return instances.get(container)?.getState();
}

function initResponsiveContainer(
  container,
  activateDeepLinkOnLoad,
  initialState
) {
  const root = container.closest('.mg-tabs') || container;
  const originalVariant = container.getAttribute('data-mg-js-tabs-variant');
  const wasHorizontal = root.classList.contains('mg-tabs--horizontal');
  const wasStacked = root.classList.contains('mg-tabs--stacked');
  const owned = selector =>
    Array.from(container.querySelectorAll(selector)).filter(
      element => element.closest('[data-mg-js-tabs]') === container
    );
  const tabs = owned('.mg-tabs__link:not(.mg-tabs__mobile-link)');
  const generated = [];
  const mobileItems = tabs
    .map(tab => {
      const id = tab.getAttribute('href')?.split('#')[1];
      const panel = Array.from(root.querySelectorAll('[id]')).find(
        element => element.id === id
      );
      if (!panel) return null;
      let item = panel.previousElementSibling;
      if (!item?.classList.contains('mg-tabs__mobile-item')) {
        item = document.createElement('div');
        item.className = 'mg-tabs__mobile-item';
        const trigger = tab.cloneNode(true);
        trigger.removeAttribute('id');
        trigger.classList.add('mg-tabs__mobile-link');
        item.append(trigger);
        panel.before(item);
        generated.push(item);
      }
      return item;
    })
    .filter(Boolean);
  const visibility = new Map();
  const hide = (element, hidden) => {
    if (!element) return;
    if (!visibility.has(element))
      visibility.set(element, element.getAttribute('hidden'));
    element.hidden = hidden;
  };
  const restoreVisibility = () => {
    visibility.forEach((value, element) => {
      if (value === null) element.removeAttribute('hidden');
      else element.setAttribute('hidden', value);
    });
    visibility.clear();
  };
  let mobile;
  const restoreVariant = () => {
    const variantChanged =
      container.getAttribute('data-mg-js-tabs-variant') !== originalVariant;
    root.classList.toggle(
      'mg-tabs--horizontal',
      variantChanged ? !isStacked(container) : wasHorizontal
    );
    root.classList.toggle(
      'mg-tabs--stacked',
      variantChanged ? isStacked(container) : wasStacked
    );
    root.classList.remove('mg-tabs--responsive-stacked');
  };
  const update = () => {
    const nextMobile = window.innerWidth < MOBILE_BREAKPOINT;
    if (nextMobile === mobile) return;
    const state = mgTabsGetState(container) || initialState;
    initialState = undefined;
    instances.get(container)?.destroy();
    restoreVisibility();
    restoreVariant();
    mobile = nextMobile;
    if (mobile) {
      root.classList.remove('mg-tabs--horizontal');
      root.classList.add('mg-tabs--stacked', 'mg-tabs--responsive-stacked');
    }
    tabs.forEach(tab => hide(tab.closest('.mg-tabs__item'), mobile));
    mobileItems.forEach(item => hide(item, !mobile));
    // Canonical React rail stays mounted. Legacy markup remains interleaved on mobile.
    hide(owned('.mg-tabs__rail')[0], mobile);
    initContainer(container, activateDeepLinkOnLoad, {
      responsive: false,
      responsiveMobile: mobile,
      initialState: state,
    });
  };
  responsiveInstances.set(container, {
    destroy() {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      instances.get(container)?.destroy();
      restoreVisibility();
      generated.forEach(item => item.remove());
      restoreVariant();
      responsiveInstances.delete(container);
    },
  });
  update();
  window.addEventListener('resize', update);
  window.addEventListener('orientationchange', update);
}

function initContainer(container, activateDeepLinkOnLoad, options = {}) {
  if (instances.has(container)) return;
  if (
    options.responsive !== false &&
    container.hasAttribute('data-mg-js-tabs-stack-on-mobile') &&
    !isStacked(container)
  ) {
    if (!responsiveInstances.has(container))
      initResponsiveContainer(
        container,
        activateDeepLinkOnLoad,
        options.initialState
      );
    return;
  }
  const root = container.closest('.mg-tabs') || container;
  const owned = selector =>
    Array.from(
      (options.responsiveMobile ? root : container).querySelectorAll(selector)
    ).filter(element => {
      const owner = element.closest('[data-mg-js-tabs]');
      return owner === container || (options.responsiveMobile && !owner);
    });
  const tabs = owned(
    options.responsiveMobile
      ? '.mg-tabs__mobile-link'
      : '.mg-tabs__link:not(.mg-tabs__mobile-link)'
  );
  const panels = tabs.map(tab => {
    const id = tab.getAttribute('href')?.split('#')[1];
    return Array.from(root.querySelectorAll('[id]')).find(element => {
      const owner = element.closest('[data-mg-js-tabs]');
      return element.id === id && (!owner || owner === container);
    });
  });
  if (!tabs.length || panels.some(panel => !panel)) return;
  const requestedVariant = isStacked(container) ? 'stacked' : 'horizontal';
  const stacked = options.responsiveMobile || isStacked(container);
  const cleanups = [];
  const snapshots = new Map();
  const remember = element => {
    if (!snapshots.has(element)) {
      const names = [
        'role',
        'aria-controls',
        'aria-selected',
        'aria-expanded',
        'aria-labelledby',
        'aria-label',
        'aria-orientation',
        'tabindex',
        'hidden',
        'data-tabs__item',
        'data-mg-tabs-initialized',
        'data-mg-tabs-overflow-start',
        'data-mg-tabs-overflow-end',
      ];
      if (tabs.includes(element)) names.push('id');
      snapshots.set(
        element,
        names.map(name => [name, element.getAttribute(name)])
      );
    }
  };
  const listen = (element, event, handler, options) => {
    element.addEventListener(event, handler, options);
    cleanups.push(() => element.removeEventListener(event, handler, options));
  };
  [
    container,
    ...tabs,
    ...panels,
    ...tabs.map(tab => tab.parentElement),
  ].forEach(remember);
  let list = owned('.mg-tabs__list')[0] || container;
  remember(list);
  let rail;
  let scroller;
  if (!stacked) {
    if (!root.classList.contains('mg-tabs--horizontal')) {
      root.classList.add('mg-tabs--horizontal');
      cleanups.push(() => root.classList.remove('mg-tabs--horizontal'));
    }
    rail = owned('.mg-tabs__rail')[0];
    if (!rail) {
      // Upgrade interleaved plain HTML without replacing triggers or panel content.
      rail = document.createElement('div');
      rail.className = 'mg-tabs__rail';
      scroller = document.createElement('div');
      scroller.className = 'mg-tabs__scroll';
      const panelGroup = document.createElement('div');
      panelGroup.className = 'mg-tabs__panels';
      const listMarker = document.createComment('mg-tabs list');
      list.before(listMarker, rail);
      rail.append(scroller);
      scroller.append(list);
      rail.after(panelGroup);
      // Determine ownership before moving anything: a shared legacy wrapper
      // must remain shared while all of its individual panels are relocated.
      const originals = panels.map(panel => {
        const wrapper = panel.closest('.mg-tabs-content');
        return wrapper &&
          wrapper !== root &&
          panels.filter(item => wrapper.contains(item)).length === 1
          ? wrapper
          : panel;
      });
      const moved = panels.map((panel, index) => {
        const original = originals[index];
        const marker = document.createComment('mg-tabs panel');
        original.before(marker);
        const replacement = document.createElement('div');
        replacement.className = 'mg-tabs-content';
        replacement.setAttribute('data-mg-js-tabs-content', '');
        panelGroup.append(replacement);
        if (original === panel) replacement.append(panel);
        else {
          while (original.firstChild) replacement.append(original.firstChild);
          original.remove();
        }
        return { original, marker, replacement, panel };
      });
      cleanups.push(() => {
        moved.forEach(({ original, marker, replacement, panel }) => {
          if (original === panel) marker.replaceWith(panel);
          else {
            while (replacement.firstChild)
              original.append(replacement.firstChild);
            marker.replaceWith(original);
          }
        });
        listMarker.replaceWith(list);
        rail.remove();
        panelGroup.remove();
      });
    } else scroller = owned('.mg-tabs__scroll')[0];
    remember(rail);
    list.setAttribute('role', 'tablist');
    list.setAttribute(
      'aria-label',
      container.dataset.mgJsTabsLabel ||
        list.getAttribute('aria-label') ||
        'Sections'
    );
    list.setAttribute('aria-orientation', 'horizontal');
  }

  const rtl = () => getComputedStyle(container).direction === 'rtl';
  const updateOverflow = () => {
    if (!scroller) return;
    const view = scroller.getBoundingClientRect();
    const content = list.getBoundingClientRect();
    const overflows = scroller.scrollWidth > scroller.clientWidth + 1;
    rail.toggleAttribute(
      'data-mg-tabs-overflow-start',
      overflows &&
        (rtl() ? content.right > view.right + 1 : content.left < view.left - 1)
    );
    rail.toggleAttribute(
      'data-mg-tabs-overflow-end',
      overflows &&
        (rtl() ? content.left < view.left - 1 : content.right > view.right + 1)
    );
  };
  let activeTab;
  let lastInteracted;
  const reveal = (tab, animate = false) => {
    if (!scroller || !tab) return;
    const view = scroller.getBoundingClientRect();
    const target = tab.getBoundingClientRect();
    // Physical geometry also works with negative RTL scrollLeft. Native scrolling clamps at either end.
    const listStyle = getComputedStyle(list);
    const gutter =
      parseFloat(
        listStyle.paddingInlineStart ||
          (rtl() ? listStyle.paddingRight : listStyle.paddingLeft)
      ) || 0;
    const left =
      target.width > view.width - gutter * 2
        ? rtl()
          ? target.right - view.right + gutter
          : target.left - view.left - gutter
        : (target.left + target.right - view.left - view.right) / 2;
    const reduced = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    scroller.scrollBy?.({
      left,
      behavior: animate && !reduced ? 'smooth' : 'instant',
    });
    updateOverflow();
  };
  const activate = (
    tab,
    { focus = false, toggle = false, animate = false } = {}
  ) => {
    const index = tabs.indexOf(tab);
    lastInteracted = tab;
    if (stacked) {
      const open = toggle ? panels[index].hasAttribute('hidden') : true;
      if (
        open &&
        !options.responsiveMobile &&
        container.hasAttribute('data-mg-js-tabs-single-open')
      ) {
        tabs.forEach((other, i) => setDisclosureState(other, panels[i], false));
      }
      setDisclosureState(tab, panels[index], open);
    } else {
      activeTab = tab;
      tabs.forEach((other, i) => {
        const selected = other === tab;
        other.setAttribute('aria-selected', String(selected));
        other.setAttribute('tabindex', selected ? '0' : '-1');
        other.classList.toggle('is-active', selected);
        panels[i].hidden = !selected;
      });
      reveal(tab, animate);
    }
    if (focus) tab.focus({ preventScroll: true });
  };

  tabs.forEach((tab, i) => {
    const panel = panels[i];
    tab.id =
      tab.id ||
      panel.id + (options.responsiveMobile ? '--mobile-trigger' : '--trigger');
    tab.setAttribute('data-tabs__item', panel.id);
    tab.setAttribute('aria-controls', panel.id);
    tab.setAttribute('role', stacked ? 'button' : 'tab');
    tab.removeAttribute('aria-selected');
    if (stacked) tab.removeAttribute('tabindex');
    else tab.parentElement.setAttribute('role', 'presentation');
    panel.setAttribute('role', stacked ? 'region' : 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.setAttribute('tabindex', '-1');
    listen(tab, 'click', event => {
      event.preventDefault();
      activate(tab, { focus: true, toggle: true, animate: true });
    });
    listen(tab, 'keydown', event => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        activate(tab, { focus: true, toggle: true, animate: true });
        return;
      }
      if (!stacked && event.key === 'ArrowDown') {
        event.preventDefault();
        panel.focus({ preventScroll: true });
        return;
      }
      const prevKey = stacked ? 'ArrowUp' : rtl() ? 'ArrowRight' : 'ArrowLeft';
      const nextKey = stacked
        ? 'ArrowDown'
        : rtl()
          ? 'ArrowLeft'
          : 'ArrowRight';
      let next = -1;
      if (event.key === prevKey) next = findVisibleTab(tabs, i, -1);
      else if (event.key === nextKey) next = findVisibleTab(tabs, i, 1);
      else if (event.key === 'Home') next = findVisibleTab(tabs, -1, 1);
      else if (event.key === 'End')
        next = findVisibleTab(tabs, tabs.length, -1);
      if (next < 0) return;
      event.preventDefault();
      if (stacked) tabs[next].focus({ preventScroll: true });
      else activate(tabs[next], { focus: true, animate: true });
    });
    if (stacked) listen(panel, 'beforematch', () => activate(tab));
  });

  const activateHash = () => {
    let hash = window.location.hash.slice(1);
    try {
      hash = decodeURIComponent(hash);
    } catch {
      /* Keep malformed fragments literal. */
    }
    const index = panels.findIndex(panel => panel.id === hash);
    if (index < 0) return false;
    activate(tabs[index]);
    return true;
  };
  if (stacked) mgTabsApplyStackedDefaults(container, tabs, panels);
  else
    activate(
      tabs.find(tab => tab.dataset.mgJsTabsDefault === 'true') || tabs[0]
    );
  if (options.responsiveMobile && !options.initialState) {
    tabs.forEach((tab, index) => setDisclosureState(tab, panels[index], false));
    activate(
      tabs.find(tab => tab.dataset.mgJsTabsDefault === 'true') || tabs[0]
    );
  }
  if (activateDeepLinkOnLoad) activateHash();
  if (options.initialState) {
    const { panelId, focus } = options.initialState;
    const index = panels.findIndex(panel => panel.id === panelId);
    if (index >= 0) {
      if (stacked)
        tabs.forEach((tab, i) => setDisclosureState(tab, panels[i], false));
      activate(tabs[index]);
      if (focus) {
        let target = focus.trigger ? tabs[index] : panels[index];
        if (!focus.trigger)
          focus.path.forEach(childIndex => {
            target = target?.children[childIndex];
          });
        target?.focus({ preventScroll: true });
      }
    }
  }
  if (
    stacked &&
    options.initialState?.stacked &&
    options.initialState.restoreOpenPanels
  ) {
    const openIds = new Set(options.initialState.openPanelIds);
    tabs.forEach((tab, index) =>
      setDisclosureState(tab, panels[index], openIds.has(panels[index].id))
    );
  }
  listen(window, 'hashchange', activateHash);
  if (
    stacked &&
    !options.responsiveMobile &&
    container.hasAttribute('data-mg-js-tabs-filterable')
  )
    cleanups.push(
      mgTabsInitFilter(container, tabs, panels, options.initialState?.filter)
    );
  let alive = true;
  if (scroller) {
    listen(scroller, 'scroll', updateOverflow, { passive: true });
    const refresh = () => {
      if (alive) reveal(activeTab);
    };
    listen(window, 'resize', refresh);
    listen(window, 'orientationchange', refresh);
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(refresh);
      observer.observe(scroller);
      observer.observe(list);
      cleanups.push(() => observer.disconnect());
    }
    if (document.fonts) {
      document.fonts.ready.then(refresh);
      listen(document.fonts, 'loadingdone', refresh);
    }
  }
  container.setAttribute('data-mg-tabs-initialized', 'true');
  instances.set(container, {
    getState() {
      const focused = document.activeElement;
      const triggerIndex = tabs.indexOf(focused);
      const panelIndex = panels.findIndex(panel => panel.contains(focused));
      const focusedIndex = panelIndex >= 0 ? panelIndex : triggerIndex;
      const selected =
        lastInteracted ||
        activeTab ||
        tabs.find(tab => tab.getAttribute('aria-expanded') === 'true') ||
        tabs[0];
      const index = focusedIndex >= 0 ? focusedIndex : tabs.indexOf(selected);
      let focus;
      if (focusedIndex >= 0) {
        const path = [];
        if (panelIndex >= 0) {
          let child = focused;
          while (child !== panels[panelIndex]) {
            path.unshift(
              Array.from(child.parentElement.children).indexOf(child)
            );
            child = child.parentElement;
          }
        }
        focus = { trigger: triggerIndex >= 0, path };
      }
      const filterInput = container.querySelector(
        ':scope > .mg-tabs__filter > .mg-tabs__filter-input'
      );
      return {
        filter: filterInput
          ? { query: filterInput.value, focused: filterInput === focused }
          : undefined,
        panelId: panels[index].id,
        requestedVariant,
        focus,
        stacked,
        openPanelIds: panels
          .filter(panel => !panel.hasAttribute('hidden'))
          .map(panel => panel.id),
      };
    },
    destroy() {
      alive = false;
      cleanups.reverse().forEach(cleanup => cleanup());
      snapshots.forEach((attributes, element) => {
        attributes.forEach(([name, value]) => {
          if (value === null) element.removeAttribute(name);
          else element.setAttribute(name, value);
        });
        element.classList.remove('is-active', 'mg-tabs__stacked--open');
      });
      instances.delete(container);
    },
  });
}
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
      shouldOpen = i === 0;
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
function mgTabsInitFilter(container, tabs, panels, initialFilter) {
  const placeholder =
    container.dataset.mgJsTabsFilterPlaceholder || 'Filter sections\u2026';
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

  const hintId =
    'mg-tabs-filter-hint-' + Math.random().toString(36).slice(2, 8);
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
      const items = tabs.map(tab => tab.closest('.mg-tabs__item'));
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
    const items = tabs.map(tab => tab.closest('.mg-tabs__item'));
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

  const onInput = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(applyFilter, 150);
  };

  // Also handle the native search clear button (fires 'search' event in some browsers)
  const onSearch = () => {
    clearTimeout(debounceTimer);
    applyFilter();
  };
  input.addEventListener('input', onInput);
  input.addEventListener('search', onSearch);
  if (initialFilter) {
    input.value = initialFilter.query;
    if (input.value) applyFilter();
    if (initialFilter.focused) input.focus({ preventScroll: true });
  }
  return () => {
    clearTimeout(debounceTimer);
    input.removeEventListener('input', onInput);
    input.removeEventListener('search', onSearch);
    tabs.forEach(tab => {
      const item = tab.closest('.mg-tabs__item');
      item.classList.remove('mg-tabs__item--hidden');
      item.nextElementSibling?.classList.remove('mg-tabs-content--hidden');
    });
    filterWrapper.remove();
    noResults.remove();
    status.remove();
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => mgTabs(), { once: true });
} else {
  mgTabs();
}
