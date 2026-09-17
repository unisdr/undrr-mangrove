import { fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import { mgTabs, mgTabsRuntime, mgTabsDestroy } from '../../../assets/js/tabs';

// Lifecycle of vanilla tab sets: AbortSignal teardown, and automatic
// suspension when a container leaves the document without mgTabsDestroy().

const GLOBAL_EVENTS = ['resize', 'orientationchange', 'hashchange'];
const RESUME_EVENTS = ['pointerdown', 'focusin', 'keydown', 'click'];

function horizontalMarkup(prefix, extra = '') {
  return `
    <article class="mg-tabs mg-tabs--horizontal" data-mg-js-tabs data-mg-js-tabs-variant="horizontal" ${extra}>
      <div class="mg-tabs__rail">
        <div class="mg-tabs__scroll">
          <ul class="mg-tabs__list">
            <li class="mg-tabs__item"><a class="mg-tabs__link" href="#${prefix}-1">One</a></li>
            <li class="mg-tabs__item"><a class="mg-tabs__link" href="#${prefix}-2">Two</a></li>
          </ul>
        </div>
      </div>
      <div class="mg-tabs__panels">
        <div class="mg-tabs-content" data-mg-js-tabs-content>
          <section class="mg-tabs__section" id="${prefix}-1"><p>First</p></section>
        </div>
        <div class="mg-tabs-content" data-mg-js-tabs-content>
          <section class="mg-tabs__section" id="${prefix}-2"><p>Second</p></section>
        </div>
      </div>
    </article>`;
}

function stackedMarkup(prefix) {
  return `
    <article class="mg-tabs mg-tabs--stacked" data-mg-js-tabs data-mg-js-tabs-variant="stacked">
      <ul class="mg-tabs__list">
        <li class="mg-tabs__item"><a class="mg-tabs__link" href="#${prefix}-1">One</a></li>
        <li class="mg-tabs-content" data-mg-js-tabs-content>
          <section class="mg-tabs__section" id="${prefix}-1"><p>First</p></section>
        </li>
        <li class="mg-tabs__item"><a class="mg-tabs__link" href="#${prefix}-2">Two</a></li>
        <li class="mg-tabs-content" data-mg-js-tabs-content>
          <section class="mg-tabs__section" id="${prefix}-2"><p>Second</p></section>
        </li>
      </ul>
    </article>`;
}

// Every container a test creates, so afterEach can destroy detached ones too
// and each test starts with an empty registry.
const created = [];

function mount(html) {
  const host = document.createElement('div');
  host.innerHTML = html;
  document.body.append(host);
  created.push(host);
  return { host, container: host.querySelector('[data-mg-js-tabs]') };
}

// Counts listeners currently registered on a target, per event type.
function trackListeners(target, types) {
  const active = new Map(types.map(type => [type, new Set()]));
  const add = target.addEventListener;
  const remove = target.removeEventListener;
  jest
    .spyOn(target, 'addEventListener')
    .mockImplementation(function (type, handler, options) {
      active.get(type)?.add(handler);
      return add.call(this, type, handler, options);
    });
  jest
    .spyOn(target, 'removeEventListener')
    .mockImplementation(function (type, handler, options) {
      active.get(type)?.delete(handler);
      return remove.call(this, type, handler, options);
    });
  return () =>
    Object.fromEntries(types.map(type => [type, active.get(type).size]));
}

const baseline = types => Object.fromEntries(types.map(type => [type, 0]));
// The runtime's single page-wide sweep listener, registered while any tab set
// is tracked (including suspended ones).
const SWEEP_ONLY = { resize: 1, orientationchange: 0, hashchange: 1 };

describe('tabs lifecycle', () => {
  let observers;
  let fonts;
  const OriginalResizeObserver = global.ResizeObserver;

  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    observers = [];
    // Fires its callback like a browser would, but only while observing.
    global.ResizeObserver = class {
      constructor(callback) {
        this.callback = callback;
        this.observing = false;
        this.observe = jest.fn(() => {
          this.observing = true;
        });
        this.disconnect = jest.fn(() => {
          this.observing = false;
        });
        observers.push(this);
      }

      trigger() {
        if (this.observing) this.callback([], this);
      }
    };
    fonts = new EventTarget();
    fonts.ready = new Promise(() => {});
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: fonts,
    });
    HTMLElement.prototype.scrollBy = jest.fn();
  });

  afterEach(() => {
    mgTabsDestroy(created.splice(0));
    mgTabsDestroy(document);
    document.body.innerHTML = '';
    window.history.replaceState(null, '', window.location.pathname);
    global.ResizeObserver = OriginalResizeObserver;
    delete document.fonts;
    delete HTMLElement.prototype.scrollBy;
    jest.restoreAllMocks();
  });

  describe('signal option', () => {
    it('removes window and document.fonts listeners when the signal aborts', () => {
      const windowListeners = trackListeners(window, GLOBAL_EVENTS);
      const fontListeners = trackListeners(fonts, ['loadingdone']);
      const { container } = mount(
        horizontalMarkup('abort', 'data-mg-js-tabs-stack-on-mobile')
      );
      const controller = new AbortController();

      mgTabs([container], false, { signal: controller.signal });
      expect(container).toHaveAttribute('data-mg-tabs-initialized', 'true');
      // Responsive and rail listeners, plus the page-wide sweep listener.
      expect(windowListeners()).toEqual({
        resize: 3,
        orientationchange: 2,
        hashchange: 2,
      });
      expect(fontListeners()).toEqual({ loadingdone: 1 });

      controller.abort();
      expect(windowListeners()).toEqual(baseline(GLOBAL_EVENTS));
      expect(fontListeners()).toEqual(baseline(['loadingdone']));
      expect(container).not.toHaveAttribute('data-mg-tabs-initialized');
      expect(container.querySelector('[role="tab"]')).toBeNull();
    });

    it('disconnects resize observers when the signal aborts', () => {
      const { container } = mount(horizontalMarkup('observer'));
      const controller = new AbortController();
      mgTabsRuntime(container, false, { signal: controller.signal });
      expect(observers).toHaveLength(1);
      expect(observers[0].disconnect).not.toHaveBeenCalled();

      controller.abort();
      expect(observers[0].disconnect).toHaveBeenCalledTimes(1);
    });

    it('destroys every tab set initialised by the call', () => {
      const first = mount(horizontalMarkup('many-a')).container;
      const second = mount(stackedMarkup('many-b')).container;
      const controller = new AbortController();
      mgTabsRuntime(document, false, { signal: controller.signal });
      expect(first).toHaveAttribute('data-mg-tabs-initialized');
      expect(second).toHaveAttribute('data-mg-tabs-initialized');

      controller.abort();
      expect(first).not.toHaveAttribute('data-mg-tabs-initialized');
      expect(second).not.toHaveAttribute('data-mg-tabs-initialized');
    });

    it('does not initialise when the signal is already aborted', () => {
      const windowListeners = trackListeners(window, GLOBAL_EVENTS);
      const { container } = mount(horizontalMarkup('aborted'));
      const before = container.innerHTML;
      const controller = new AbortController();
      controller.abort();

      mgTabs([container], true, { signal: controller.signal });
      mgTabsRuntime(container, true, { signal: controller.signal });
      expect(container).not.toHaveAttribute('data-mg-tabs-initialized');
      expect(container.innerHTML).toBe(before);
      expect(windowListeners()).toEqual(baseline(GLOBAL_EVENTS));
      expect(observers).toHaveLength(0);
    });

    it('does not bind the signal to a tab set that was already initialised', () => {
      const { container } = mount(horizontalMarkup('existing'));
      mgTabsRuntime(container, false);
      const controller = new AbortController();
      mgTabsRuntime(container, false, { signal: controller.signal });

      controller.abort();
      expect(container).toHaveAttribute('data-mg-tabs-initialized', 'true');
    });

    it('releases the abort listener when destroyed another way', () => {
      const { container } = mount(horizontalMarkup('release'));
      const controller = new AbortController();
      const removeSpy = jest.spyOn(controller.signal, 'removeEventListener');
      mgTabsRuntime(container, false, { signal: controller.signal });

      mgTabsDestroy(container);
      expect(removeSpy).toHaveBeenCalledWith('abort', expect.any(Function));

      // A later init without the signal must not be torn down by it.
      mgTabsRuntime(container, false);
      controller.abort();
      expect(container).toHaveAttribute('data-mg-tabs-initialized', 'true');
    });

    it('makes mgTabsDestroy a no-op after abort', () => {
      const { container } = mount(horizontalMarkup('after-abort'));
      const controller = new AbortController();
      mgTabsRuntime(container, false, { signal: controller.signal });
      controller.abort();
      const restored = container.outerHTML;

      expect(() => mgTabsDestroy(container)).not.toThrow();
      expect(() => mgTabsDestroy(container, true)).not.toThrow();
      expect(container.outerHTML).toBe(restored);
    });
  });

  describe('automatic suspension after removal', () => {
    it('releases outside listeners on the next resize and keeps the markup enhanced', () => {
      const windowListeners = trackListeners(window, GLOBAL_EVENTS);
      const fontListeners = trackListeners(fonts, ['loadingdone']);
      const { host, container } = mount(
        horizontalMarkup('removed', 'data-mg-js-tabs-stack-on-mobile')
      );
      const resumeListeners = trackListeners(container, RESUME_EVENTS);
      mgTabsRuntime(container, false);
      expect(windowListeners().resize).toBe(3);

      host.remove();
      fireEvent.resize(window);

      expect(windowListeners()).toEqual(SWEEP_ONLY);
      expect(fontListeners()).toEqual(baseline(['loadingdone']));
      expect(observers[0].disconnect).toHaveBeenCalledTimes(1);
      expect(container).toHaveAttribute('data-mg-tabs-initialized', 'true');
      expect(container.querySelectorAll('[role="tab"]')).toHaveLength(2);
      expect(resumeListeners()).toEqual(
        Object.fromEntries(RESUME_EVENTS.map(type => [type, 1]))
      );
    });

    it('keeps working when re-attached after a resize observer notification', () => {
      const windowListeners = trackListeners(window, GLOBAL_EVENTS);
      const fontListeners = trackListeners(fonts, ['loadingdone']);
      const { host, container } = mount(horizontalMarkup('return'));
      const resumeListeners = trackListeners(container, RESUME_EVENTS);
      mgTabsRuntime(container, false);
      const active = windowListeners();

      host.remove();
      observers[0].trigger();
      expect(windowListeners()).toEqual(SWEEP_ONLY);

      document.body.append(host);
      const second = container.querySelectorAll('.mg-tabs__link')[1];
      fireEvent.pointerDown(second);
      fireEvent.click(second);

      expect(second).toHaveAttribute('aria-selected', 'true');
      expect(window.location.hash).toBe('');
      expect(container.querySelector('#return-1')).not.toBeVisible();
      expect(container.querySelector('#return-2')).toBeVisible();
      expect(windowListeners()).toEqual(active);
      expect(fontListeners()).toEqual({ loadingdone: 1 });
      expect(resumeListeners()).toEqual(baseline(RESUME_EVENTS));
      expect(observers).toHaveLength(2);
      expect(observers[1].observing).toBe(true);

      // Resuming twice registers nothing more.
      mgTabsRuntime(container, false);
      fireEvent.click(second);
      expect(windowListeners()).toEqual(active);
      expect(observers).toHaveLength(2);
    });

    it('resumes a suspended tab set when mgTabsRuntime is called again', () => {
      const windowListeners = trackListeners(window, GLOBAL_EVENTS);
      const { host, container } = mount(horizontalMarkup('reinit'));
      mgTabsRuntime(container, false);
      fireEvent.click(container.querySelectorAll('[role="tab"]')[1]);
      const active = windowListeners();

      host.remove();
      fireEvent.resize(window);
      document.body.append(host);
      mgTabsRuntime(container, false);

      expect(windowListeners()).toEqual(active);
      expect(container.querySelectorAll('[role="tab"]')[1]).toHaveAttribute(
        'aria-selected',
        'true'
      );
    });

    it('suspends a removed stacked tab set on the next hashchange', () => {
      const windowListeners = trackListeners(window, GLOBAL_EVENTS);
      const { host, container } = mount(stackedMarkup('hash'));
      mgTabsRuntime(container, false);
      expect(windowListeners().hashchange).toBe(2);

      host.remove();
      window.history.replaceState(null, '', '#hash-2');
      fireEvent(window, new HashChangeEvent('hashchange'));

      expect(windowListeners()).toEqual(SWEEP_ONLY);
      expect(container).toHaveAttribute('data-mg-tabs-initialized', 'true');
    });

    it('suspends a removed stacked tab set when another tab set is initialised', () => {
      const windowListeners = trackListeners(window, GLOBAL_EVENTS);
      const stacked = mount(stackedMarkup('swept'));
      mgTabsRuntime(stacked.container, false);
      expect(windowListeners().hashchange).toBe(2);

      stacked.host.remove();
      const other = mount(horizontalMarkup('other'));
      mgTabsRuntime(other.container, false);
      // Only the new horizontal set and the sweep listener are listening.
      expect(windowListeners()).toEqual({
        resize: 2,
        orientationchange: 1,
        hashchange: 2,
      });

      document.body.append(stacked.host);
      mgTabsRuntime(other.container, false);
      expect(windowListeners().hashchange).toBe(3);
      window.history.replaceState(null, '', '#swept-2');
      fireEvent(window, new HashChangeEvent('hashchange'));
      expect(
        stacked.container.querySelectorAll('[role="button"]')[1]
      ).toHaveAttribute('aria-expanded', 'true');
    });

    it('suspends from font and resize observer callbacks', () => {
      const fontListeners = trackListeners(fonts, ['loadingdone']);
      const first = mount(horizontalMarkup('fonts'));
      const second = mount(horizontalMarkup('observed'));
      mgTabsRuntime(document, false);

      first.host.remove();
      fonts.dispatchEvent(new Event('loadingdone'));
      expect(observers[0].disconnect).toHaveBeenCalledTimes(1);
      expect(fontListeners()).toEqual({ loadingdone: 1 });

      second.host.remove();
      observers[1].trigger();
      expect(observers[1].disconnect).toHaveBeenCalledTimes(1);
      expect(fontListeners()).toEqual(baseline(['loadingdone']));
    });

    it('leaves other tab sets running', () => {
      const kept = mount(horizontalMarkup('kept')).container;
      const { host } = mount(horizontalMarkup('gone'));
      mgTabsRuntime(document, false);

      host.remove();
      fireEvent.resize(window);
      window.history.replaceState(null, '', '#kept-2');
      fireEvent(window, new HashChangeEvent('hashchange'));
      expect(kept.querySelectorAll('[role="tab"]')[1]).toHaveAttribute(
        'aria-selected',
        'true'
      );
    });

    it('does not suspend a container that is moved before any event', () => {
      const windowListeners = trackListeners(window, GLOBAL_EVENTS);
      const { host, container } = mount(horizontalMarkup('moved'));
      const target = document.createElement('div');
      document.body.append(target);
      mgTabsRuntime(container, false);
      const active = windowListeners();

      host.remove();
      target.append(container);
      fireEvent.resize(window);
      window.history.replaceState(null, '', '#moved-2');
      fireEvent(window, new HashChangeEvent('hashchange'));

      expect(container).toHaveAttribute('data-mg-tabs-initialized', 'true');
      expect(windowListeners()).toEqual(active);
      expect(container.querySelectorAll('[role="tab"]')[1]).toHaveAttribute(
        'aria-selected',
        'true'
      );
    });

    it('does not suspend a tab set initialised before it is attached', () => {
      const windowListeners = trackListeners(window, GLOBAL_EVENTS);
      const container = document
        .createRange()
        .createContextualFragment(horizontalMarkup('offscreen'))
        .querySelector('[data-mg-js-tabs]');
      created.push(container);
      mgTabsRuntime(container, false);
      const active = windowListeners();
      fireEvent.resize(window);
      observers[0].trigger();
      mgTabsRuntime(document, false);
      expect(windowListeners()).toEqual(active);

      document.body.append(container);
      fireEvent.resize(window);
      container.remove();
      fireEvent.resize(window);
      expect(windowListeners()).toEqual(SWEEP_ONLY);
      expect(container).toHaveAttribute('data-mg-tabs-initialized', 'true');
    });

    it('fully destroys a suspended tab set when its signal aborts', () => {
      const windowListeners = trackListeners(window, GLOBAL_EVENTS);
      const { host, container } = mount(horizontalMarkup('abort-suspended'));
      const before = container.outerHTML;
      const resumeListeners = trackListeners(container, RESUME_EVENTS);
      const controller = new AbortController();
      const removeSpy = jest.spyOn(controller.signal, 'removeEventListener');
      mgTabsRuntime(container, false, { signal: controller.signal });

      host.remove();
      fireEvent.resize(window);
      expect(removeSpy).not.toHaveBeenCalled();
      controller.abort();

      expect(windowListeners()).toEqual(baseline(GLOBAL_EVENTS));
      expect(resumeListeners()).toEqual(baseline(RESUME_EVENTS));
      expect(container).not.toHaveAttribute('data-mg-tabs-initialized');
      expect(container.outerHTML).toBe(before);
      expect(observers[0].disconnect).toHaveBeenCalledTimes(1);
      expect(() => mgTabsDestroy(container)).not.toThrow();
    });

    it('keeps a responsive tab set and its signal across suspension and a breakpoint change', () => {
      const windowListeners = trackListeners(window, GLOBAL_EVENTS);
      const { host, container } = mount(
        horizontalMarkup('responsive', 'data-mg-js-tabs-stack-on-mobile')
      );
      const controller = new AbortController();
      mgTabsRuntime(container, false, { signal: controller.signal });
      fireEvent.click(container.querySelectorAll('[role="tab"]')[1]);

      host.remove();
      fireEvent.resize(window);
      window.innerWidth = 400;
      document.body.append(host);
      // The layout switches once the press has been handled.
      fireEvent.pointerDown(container);
      fireEvent.click(container);

      const triggers = container.querySelectorAll('.mg-tabs__mobile-link');
      expect(triggers[1]).toHaveAttribute('role', 'button');
      expect(triggers[1]).toHaveAttribute('aria-expanded', 'true');
      // Stacked on mobile: the responsive, hash and sweep listeners remain.
      expect(windowListeners()).toEqual({
        resize: 2,
        orientationchange: 1,
        hashchange: 2,
      });

      controller.abort();
      expect(windowListeners()).toEqual(baseline(GLOBAL_EVENTS));
      expect(container).not.toHaveAttribute('data-mg-tabs-initialized');
      expect(container.querySelector('.mg-tabs__mobile-item')).toBeNull();
    });

    it('releases a tab set that was dropped entirely', () => {
      const windowListeners = trackListeners(window, GLOBAL_EVENTS);
      const fontListeners = trackListeners(fonts, ['loadingdone']);
      const { host } = mount(horizontalMarkup('dropped'));
      mgTabsRuntime(document, false);
      host.remove();
      mgTabsRuntime(document, false);
      // The sweep listener refers to no container; it stays until the dropped
      // node is collected and pruned from the registry.
      expect(windowListeners()).toEqual(SWEEP_ONLY);
      expect(fontListeners()).toEqual(baseline(['loadingdone']));
    });
  });

  describe('failure handling', () => {
    it('destroys instead of tracking when the signal aborts during initialisation', () => {
      const windowListeners = trackListeners(window, GLOBAL_EVENTS);
      const { container } = mount(horizontalMarkup('abort-init'));
      const controller = new AbortController();
      HTMLElement.prototype.scrollBy = jest.fn(() => controller.abort());

      mgTabsRuntime(container, false, { signal: controller.signal });

      expect(container).not.toHaveAttribute('data-mg-tabs-initialized');
      expect(container.querySelector('[role="tab"]')).toBeNull();
      expect(windowListeners()).toEqual(baseline(GLOBAL_EVENTS));
    });

    it('still releases listeners and allows re-initialisation when destroy throws', () => {
      const windowListeners = trackListeners(window, GLOBAL_EVENTS);
      const { container } = mount(horizontalMarkup('throws'));
      const controller = new AbortController();
      mgTabsRuntime(container, false, { signal: controller.signal });
      observers[0].disconnect.mockImplementationOnce(() => {
        throw new Error('disconnect failed');
      });

      expect(() => mgTabsDestroy(container)).toThrow('disconnect failed');
      expect(windowListeners()).toEqual(baseline(GLOBAL_EVENTS));
      expect(container).not.toHaveAttribute('data-mg-tabs-initialized');

      mgTabsRuntime(container, false);
      expect(container).toHaveAttribute('data-mg-tabs-initialized', 'true');
      mgTabsDestroy(container);
      expect(windowListeners()).toEqual(baseline(GLOBAL_EVENTS));
    });

    it('keeps a tab set suspendable and destroyable when suspend throws', () => {
      const windowListeners = trackListeners(window, GLOBAL_EVENTS);
      const { host, container } = mount(horizontalMarkup('suspend-throws'));
      const controller = new AbortController();
      mgTabsRuntime(container, false, { signal: controller.signal });
      observers[0].disconnect.mockImplementationOnce(() => {
        throw new Error('disconnect failed');
      });

      host.remove();
      expect(() => observers[0].trigger()).toThrow('disconnect failed');
      expect(windowListeners()).toEqual(SWEEP_ONLY);

      controller.abort();
      expect(container).not.toHaveAttribute('data-mg-tabs-initialized');
    });
  });

  describe('deep links and retained state', () => {
    it('lets a changed hash win over retained selection', () => {
      const { container } = mount(horizontalMarkup('deeplink'));
      mgTabsRuntime(container, true);
      fireEvent.click(container.querySelectorAll('[role="tab"]')[1]);

      mgTabsDestroy(container, true);
      window.history.replaceState(null, '', '#deeplink-1');
      mgTabsRuntime(container, true);
      expect(container.querySelectorAll('[role="tab"]')[0]).toHaveAttribute(
        'aria-selected',
        'true'
      );
    });

    it('keeps retained selection when the hash has not changed', () => {
      window.history.replaceState(null, '', '#same-1');
      const { container } = mount(horizontalMarkup('same'));
      mgTabsRuntime(container, true);
      fireEvent.click(container.querySelectorAll('[role="tab"]')[1]);

      mgTabsDestroy(container, true);
      mgTabsRuntime(container, true);
      expect(container.querySelectorAll('[role="tab"]')[1]).toHaveAttribute(
        'aria-selected',
        'true'
      );
    });

    it('keeps retained state when preserveState destroy runs without an instance', () => {
      const { container } = mount(horizontalMarkup('twice'));
      mgTabsRuntime(container, false);
      fireEvent.click(container.querySelectorAll('[role="tab"]')[1]);

      mgTabsDestroy(container, true);
      mgTabsDestroy(container, true);
      mgTabsRuntime(container, false);
      expect(container.querySelectorAll('[role="tab"]')[1]).toHaveAttribute(
        'aria-selected',
        'true'
      );
    });
  });

  describe('preserveState', () => {
    it('round-trips selection through destroy and re-initialisation', () => {
      const { container } = mount(horizontalMarkup('preserve'));
      mgTabsRuntime(container, false);
      fireEvent.click(container.querySelectorAll('[role="tab"]')[1]);

      mgTabsDestroy(container, true);
      expect(container).not.toHaveAttribute('data-mg-tabs-initialized');
      mgTabsRuntime(container, false);
      expect(container.querySelectorAll('[role="tab"]')[1]).toHaveAttribute(
        'aria-selected',
        'true'
      );

      mgTabsDestroy(container);
      mgTabsRuntime(container, false);
      expect(container.querySelectorAll('[role="tab"]')[0]).toHaveAttribute(
        'aria-selected',
        'true'
      );
    });
  });
  describe('hash changes while suspended', () => {
    const tabsOf = container => container.querySelectorAll('[role="tab"]');
    const suspend = host => {
      host.remove();
      observers.forEach(observer => observer.trigger());
    };
    const navigate = hash => {
      const oldURL = window.location.href;
      window.history.replaceState(null, '', hash);
      fireEvent(
        window,
        new HashChangeEvent('hashchange', {
          oldURL,
          newURL: window.location.href,
        })
      );
    };

    it('selects the hash tab when re-initialised with retained state', () => {
      const { host, container } = mount(horizontalMarkup('missed'));
      mgTabsRuntime(container, true);

      suspend(host);
      navigate('#missed-2');
      document.body.append(host);
      mgTabsDestroy(container, true);
      mgTabsRuntime(container, true);

      expect(tabsOf(container)[1]).toHaveAttribute('aria-selected', 'true');
    });

    it('selects the hash tab when a sweep resumes the set', () => {
      const { host, container } = mount(stackedMarkup('swept-hash'));
      const resumeListeners = trackListeners(container, RESUME_EVENTS);
      mgTabsRuntime(container, true);

      host.remove();
      navigate('#swept-hash-2');
      expect(resumeListeners().click).toBe(1);
      document.body.append(host);
      fireEvent.resize(window);

      expect(resumeListeners()).toEqual(baseline(RESUME_EVENTS));
      expect(container.querySelectorAll('[role="button"]')[1]).toHaveAttribute(
        'aria-expanded',
        'true'
      );
    });

    it('lets the clicked tab win over a missed hash change, without scrolling first', () => {
      const { host, container } = mount(horizontalMarkup('press'));
      mgTabsRuntime(container, true);

      suspend(host);
      navigate('#press-2');
      document.body.append(host);
      HTMLElement.prototype.scrollBy.mockClear();
      const first = tabsOf(container)[0];
      fireEvent.pointerDown(first);
      expect(HTMLElement.prototype.scrollBy).not.toHaveBeenCalled();
      expect(first).toHaveAttribute('aria-selected', 'true');
      fireEvent.click(first);

      expect(first).toHaveAttribute('aria-selected', 'true');
      expect(tabsOf(container)[1]).toHaveAttribute('aria-selected', 'false');
    });

    it('applies a missed hash change after a press that selects nothing', () => {
      const { host, container } = mount(horizontalMarkup('elsewhere'));
      mgTabsRuntime(container, true);

      suspend(host);
      navigate('#elsewhere-2');
      document.body.append(host);
      fireEvent.pointerDown(container);
      expect(tabsOf(container)[0]).toHaveAttribute('aria-selected', 'true');
      fireEvent.click(container);

      expect(tabsOf(container)[1]).toHaveAttribute('aria-selected', 'true');
    });

    it('keeps the selection when the hash did not change', () => {
      const { host, container } = mount(horizontalMarkup('unchanged'));
      mgTabsRuntime(container, true);
      fireEvent.click(tabsOf(container)[1]);

      suspend(host);
      document.body.append(host);
      mgTabsDestroy(container, true);
      mgTabsRuntime(container, true);

      expect(tabsOf(container)[1]).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('breakpoint crossed while suspended', () => {
    it('acts on the tapped tab before switching to the mobile layout', () => {
      const { host, container } = mount(
        horizontalMarkup('tap', 'data-mg-js-tabs-stack-on-mobile')
      );
      mgTabsRuntime(container, false);

      host.remove();
      fireEvent.resize(window);
      window.innerWidth = 400;
      document.body.append(host);
      const second = container.querySelectorAll('[role="tab"]')[1];
      fireEvent.pointerDown(second);
      // Still the layout the press started on.
      expect(second).toHaveAttribute('role', 'tab');
      expect(second.closest('.mg-tabs__item')).not.toHaveAttribute('hidden');
      fireEvent.click(second);

      const triggers = container.querySelectorAll('.mg-tabs__mobile-link');
      expect(triggers[0]).toHaveAttribute('aria-expanded', 'false');
      expect(triggers[1]).toHaveAttribute('aria-expanded', 'true');
      expect(container.querySelector('#tap-2')).toBeVisible();
    });

    it('does not scroll on the first observer notification after a rebuild', () => {
      window.innerWidth = 400;
      const { host, container } = mount(
        horizontalMarkup('settle', 'data-mg-js-tabs-stack-on-mobile')
      );
      mgTabsRuntime(container, false);
      host.remove();
      fireEvent.resize(window);

      window.innerWidth = 1024;
      document.body.append(host);
      mgTabsRuntime(container, false);
      expect(container.querySelectorAll('[role="tab"]')).toHaveLength(2);
      HTMLElement.prototype.scrollBy.mockClear();
      observers[observers.length - 1].trigger();

      expect(HTMLElement.prototype.scrollBy).not.toHaveBeenCalled();
    });
  });

  describe('sweeping', () => {
    it('resumes a nested tab set after an interaction with the outer set', () => {
      const windowListeners = trackListeners(window, GLOBAL_EVENTS);
      const { host, container } = mount(horizontalMarkup('outer'));
      container
        .querySelector('#outer-1')
        .insertAdjacentHTML('beforeend', stackedMarkup('inner'));
      const inner = container.querySelector('#outer-1 [data-mg-js-tabs]');
      const innerResume = trackListeners(inner, RESUME_EVENTS);
      mgTabsRuntime(document, false);
      const active = windowListeners();

      host.remove();
      fireEvent.resize(window);
      expect(innerResume().click).toBe(1);
      document.body.append(host);
      const second = container.querySelectorAll('[role="tab"]')[1];
      fireEvent.pointerDown(second);
      fireEvent.click(second);

      expect(innerResume()).toEqual(baseline(RESUME_EVENTS));
      expect(windowListeners()).toEqual(active);
    });

    it.each([
      [
        'hashchange',
        () => fireEvent(window, new HashChangeEvent('hashchange')),
      ],
      ['resize', () => fireEvent.resize(window)],
    ])(
      'suspends a stacked set attached and removed between sweeps on the next %s',
      (name, dispatch) => {
        const windowListeners = trackListeners(window, GLOBAL_EVENTS);
        const container = document
          .createRange()
          .createContextualFragment(stackedMarkup(`between-${name}`))
          .querySelector('[data-mg-js-tabs]');
        created.push(container);
        const resumeListeners = trackListeners(container, RESUME_EVENTS);
        mgTabsRuntime(container, false);
        document.body.append(container);
        container.remove();

        dispatch();
        expect(resumeListeners().click).toBe(1);
        expect(windowListeners()).toEqual(SWEEP_ONLY);
      }
    );

    it('removes the sweep listener when the registry empties', () => {
      const windowListeners = trackListeners(window, GLOBAL_EVENTS);
      const first = mount(stackedMarkup('empty-a')).container;
      const second = mount(stackedMarkup('empty-b')).container;
      mgTabsRuntime(first, false);
      expect(windowListeners()).toEqual({ ...SWEEP_ONLY, hashchange: 2 });
      mgTabsRuntime(second, false);
      expect(windowListeners()).toEqual({ ...SWEEP_ONLY, hashchange: 3 });

      mgTabsDestroy(first);
      expect(windowListeners()).toEqual({ ...SWEEP_ONLY, hashchange: 2 });
      mgTabsDestroy(second);
      expect(windowListeners()).toEqual(baseline(GLOBAL_EVENTS));
    });

    it('reports an error in one set and still initialises another', () => {
      const reportError = jest.fn();
      window.reportError = reportError;
      try {
        const a = mount(horizontalMarkup('sweep-a'));
        mgTabsRuntime(a.container, false);
        observers[0].disconnect.mockImplementationOnce(() => {
          throw new Error('disconnect failed');
        });
        a.host.remove();

        const b = mount(horizontalMarkup('sweep-b')).container;
        expect(() => mgTabsRuntime(b, false)).not.toThrow();
        expect(b).toHaveAttribute('data-mg-tabs-initialized', 'true');
        expect(reportError).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'disconnect failed' })
        );
      } finally {
        delete window.reportError;
      }
    });
  });

  describe('mgTabsDestroy with several sets', () => {
    it('destroys every set when one throws, then rethrows', () => {
      const windowListeners = trackListeners(window, GLOBAL_EVENTS);
      const first = mount(horizontalMarkup('destroy-a')).container;
      const second = mount(horizontalMarkup('destroy-b')).container;
      mgTabsRuntime(document, false);
      observers[1].disconnect.mockImplementationOnce(() => {
        throw new Error('disconnect failed');
      });

      expect(() => mgTabsDestroy(document)).toThrow('disconnect failed');
      expect(first).not.toHaveAttribute('data-mg-tabs-initialized');
      expect(second).not.toHaveAttribute('data-mg-tabs-initialized');
      expect(windowListeners()).toEqual(baseline(GLOBAL_EVENTS));
    });
  });
});
