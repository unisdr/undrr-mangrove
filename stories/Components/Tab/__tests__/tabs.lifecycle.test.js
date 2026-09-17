import { fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import { mgTabs, mgTabsRuntime, mgTabsDestroy } from '../../../assets/js/tabs';

// Lifecycle of vanilla tab sets: AbortSignal teardown and automatic cleanup
// when a container leaves the document without mgTabsDestroy().

const GLOBAL_EVENTS = ['resize', 'orientationchange', 'hashchange'];

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

function mount(html) {
  const host = document.createElement('div');
  host.innerHTML = html;
  document.body.append(host);
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
    global.ResizeObserver = class {
      constructor(callback) {
        this.callback = callback;
        this.observe = jest.fn();
        this.disconnect = jest.fn();
        observers.push(this);
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
      expect(windowListeners()).toEqual({
        resize: 2,
        orientationchange: 2,
        hashchange: 1,
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

  describe('automatic cleanup after removal', () => {
    it('releases listeners on the next resize after the container is removed', async () => {
      const windowListeners = trackListeners(window, GLOBAL_EVENTS);
      const fontListeners = trackListeners(fonts, ['loadingdone']);
      const { host, container } = mount(
        horizontalMarkup('removed', 'data-mg-js-tabs-stack-on-mobile')
      );
      mgTabsRuntime(container, false);
      expect(windowListeners().resize).toBe(2);

      host.remove();
      fireEvent.resize(window);

      expect(windowListeners()).toEqual(baseline(GLOBAL_EVENTS));
      expect(fontListeners()).toEqual(baseline(['loadingdone']));
      expect(observers[0].disconnect).toHaveBeenCalledTimes(1);
      expect(container).not.toHaveAttribute('data-mg-tabs-initialized');
      expect(container.querySelector('.mg-tabs__mobile-item')).toBeNull();
      // Restored markup is plain, readable content.
      const main = document.createElement('main');
      document.body.append(main);
      main.append(host);
      expect(await axe(main)).toHaveNoViolations();
    });

    it('releases a stacked tab set on the next hashchange after removal', () => {
      const windowListeners = trackListeners(window, GLOBAL_EVENTS);
      const { host, container } = mount(stackedMarkup('hash'));
      mgTabsRuntime(container, false);
      expect(windowListeners().hashchange).toBe(1);

      host.remove();
      window.history.replaceState(null, '', '#hash-2');
      fireEvent(window, new HashChangeEvent('hashchange'));

      expect(windowListeners()).toEqual(baseline(GLOBAL_EVENTS));
      expect(container).not.toHaveAttribute('data-mg-tabs-initialized');
      expect(container.querySelector('#hash-2')).not.toHaveAttribute('hidden');
    });

    it('cleans up from font and resize observer callbacks', () => {
      const fontListeners = trackListeners(fonts, ['loadingdone']);
      const first = mount(horizontalMarkup('fonts'));
      const second = mount(horizontalMarkup('observed'));
      mgTabsRuntime(document, false);

      first.host.remove();
      fonts.dispatchEvent(new Event('loadingdone'));
      expect(first.container).not.toHaveAttribute('data-mg-tabs-initialized');
      expect(fontListeners()).toEqual({ loadingdone: 1 });

      second.host.remove();
      observers[1].callback([]);
      expect(second.container).not.toHaveAttribute('data-mg-tabs-initialized');
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

    it('does not destroy a container that is moved before any event', () => {
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

    it('does not destroy a tab set initialised before it is attached', () => {
      const container = document
        .createRange()
        .createContextualFragment(horizontalMarkup('offscreen'))
        .querySelector('[data-mg-js-tabs]');
      mgTabsRuntime(container, false);
      fireEvent.resize(window);
      observers[0].callback([]);
      expect(container).toHaveAttribute('data-mg-tabs-initialized', 'true');

      document.body.append(container);
      fireEvent.resize(window);
      container.remove();
      fireEvent.resize(window);
      expect(container).not.toHaveAttribute('data-mg-tabs-initialized');
    });

    it('keeps the selection for a tab set that is re-attached and initialised again', () => {
      const { host, container } = mount(horizontalMarkup('reattach'));
      mgTabsRuntime(container, false);
      fireEvent.click(container.querySelectorAll('[role="tab"]')[1]);

      host.remove();
      fireEvent.resize(window);
      expect(container).not.toHaveAttribute('data-mg-tabs-initialized');

      document.body.append(host);
      mgTabsRuntime(container, false);
      expect(container.querySelectorAll('[role="tab"]')[1]).toHaveAttribute(
        'aria-selected',
        'true'
      );
    });

    it('makes mgTabsDestroy and abort no-ops after automatic cleanup', () => {
      const { host, container } = mount(horizontalMarkup('idempotent'));
      const controller = new AbortController();
      const removeSpy = jest.spyOn(controller.signal, 'removeEventListener');
      mgTabsRuntime(container, false, { signal: controller.signal });

      host.remove();
      fireEvent.resize(window);
      expect(removeSpy).toHaveBeenCalledWith('abort', expect.any(Function));
      const restored = container.outerHTML;

      expect(() => controller.abort()).not.toThrow();
      expect(() => mgTabsDestroy(container)).not.toThrow();
      expect(() => mgTabsDestroy(container, true)).not.toThrow();
      expect(container.outerHTML).toBe(restored);
      expect(observers[0].disconnect).toHaveBeenCalledTimes(1);
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
});
