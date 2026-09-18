import { axe, toHaveNoViolations } from 'jest-axe';
import {
  mgDrawer,
  mgDrawerDestroy,
  mgDrawerInstance,
  OPEN_EVENT,
  CLOSE_EVENT,
  TOGGLE_EVENT,
  OPENED_EVENT,
  CLOSED_EVENT,
} from '../drawer';

function build({ id = 'filters', panel = false, backdrop = null } = {}) {
  const base = panel ? 'mg-floating-panel' : 'mg-drawer';
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <button type="button" data-mg-drawer-trigger="${id}">Filters</button>
    <div
      id="${id}"
      class="${base}${panel ? '' : ' mg-drawer--start'}"
      data-mg-js-drawer
      ${backdrop === null ? '' : `data-backdrop="${backdrop}"`}
      role="dialog"
      tabindex="-1"
    >
      <div class="${base}__header">
        <h2 class="${base}__title">Filter publications</h2>
        <button type="button" class="${base}__close" aria-label="Close">×</button>
      </div>
      <div class="${base}__body"><a href="/hazards">Hazards</a></div>
    </div>
  `;
  document.body.appendChild(wrapper);
  return {
    trigger: wrapper.querySelector('[data-mg-drawer-trigger]'),
    container: wrapper.querySelector(`#${id}`),
    closeButton: wrapper.querySelector(`.${base}__close`),
    link: wrapper.querySelector('a'),
  };
}

describe('mgDrawer (vanilla lifecycle)', () => {
  afterEach(() => {
    mgDrawerDestroy(document);
    document.body.innerHTML = '';
  });

  it('starts closed, inert and hidden from assistive technology', () => {
    const { container, trigger } = build();
    mgDrawer(document);

    expect(container.classList.contains('is-open')).toBe(false);
    expect(container.inert).toBe(true);
    expect(container.getAttribute('aria-hidden')).toBe('true');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-controls')).toBe('filters');
  });

  it('opens from its trigger, moves focus to the close button and announces itself as modal', () => {
    const { container, trigger, closeButton } = build();
    mgDrawer(document);

    trigger.click();

    expect(container.classList.contains('is-open')).toBe(true);
    expect(container.inert).toBe(false);
    expect(container.hasAttribute('aria-hidden')).toBe(false);
    expect(container.getAttribute('aria-modal')).toBe('true');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(closeButton);
    expect(document.querySelector('.mg-drawer__backdrop')).not.toBeNull();
  });

  it('closes on Escape and returns focus to the trigger', () => {
    const { container, trigger } = build();
    mgDrawer(document);
    trigger.focus();
    trigger.click();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(container.classList.contains('is-open')).toBe(false);
    expect(container.getAttribute('aria-hidden')).toBe('true');
    expect(container.hasAttribute('aria-modal')).toBe(false);
    expect(document.activeElement).toBe(trigger);
    expect(document.querySelector('.mg-drawer__backdrop')).toBeNull();
  });

  it('closes from the close button and from a backdrop click', () => {
    const { container, trigger, closeButton } = build();
    mgDrawer(document);

    trigger.click();
    closeButton.click();
    expect(container.classList.contains('is-open')).toBe(false);

    trigger.click();
    document.querySelector('.mg-drawer__backdrop').click();
    expect(container.classList.contains('is-open')).toBe(false);
  });

  it('wraps Tab inside a modal drawer', () => {
    const { container, trigger, closeButton, link } = build();
    mgDrawer(document);
    trigger.click();

    link.focus();
    const forward = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    link.dispatchEvent(forward);
    expect(forward.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(closeButton);

    const backward = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    closeButton.dispatchEvent(backward);
    expect(backward.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(link);
    expect(container.classList.contains('is-open')).toBe(true);
  });

  it('does not trap Tab or add a backdrop for a floating panel', () => {
    const { trigger, link, container } = build({ id: 'layers', panel: true });
    mgDrawer(document);
    trigger.click();

    expect(document.querySelector('.mg-drawer__backdrop')).toBeNull();
    expect(container.hasAttribute('aria-modal')).toBe(false);

    link.focus();
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('treats data-backdrop="false" as a non-modal edge drawer', () => {
    const { trigger, container } = build({ id: 'notes', backdrop: 'false' });
    mgDrawer(document);
    trigger.click();

    expect(document.querySelector('.mg-drawer__backdrop')).toBeNull();
    expect(container.hasAttribute('aria-modal')).toBe(false);
  });

  it('responds to the open, close and toggle command events and emits opened and closed', () => {
    const { container } = build();
    mgDrawer(document);
    const opened = jest.fn();
    const closed = jest.fn();
    container.addEventListener(OPENED_EVENT, opened);
    container.addEventListener(CLOSED_EVENT, closed);

    container.dispatchEvent(new CustomEvent(OPEN_EVENT));
    expect(container.classList.contains('is-open')).toBe(true);
    expect(opened).toHaveBeenCalledTimes(1);

    container.dispatchEvent(new CustomEvent(CLOSE_EVENT));
    expect(container.classList.contains('is-open')).toBe(false);
    expect(closed).toHaveBeenCalledTimes(1);

    container.dispatchEvent(new CustomEvent(TOGGLE_EVENT));
    expect(container.classList.contains('is-open')).toBe(true);
    expect(opened).toHaveBeenCalledTimes(2);
  });

  it('honours markup that is already open', () => {
    const { container, trigger } = build();
    container.classList.add('is-open');
    mgDrawer(document);

    expect(container.inert).toBe(false);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(document.querySelector('.mg-drawer__backdrop')).not.toBeNull();
  });

  it('is idempotent: a second init does not enhance the same drawer twice', () => {
    const { container, trigger } = build();
    const first = mgDrawer(document);
    const second = mgDrawer(document);

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(0);
    expect(container.getAttribute('data-mg-js-drawer-initialized')).toBe(
      'true'
    );

    // Two listeners would toggle twice and leave it closed.
    trigger.click();
    expect(container.classList.contains('is-open')).toBe(true);
  });

  it('adds role and tabindex when the markup omits them, and removes them again on destroy', () => {
    const { container } = build();
    container.removeAttribute('role');
    container.removeAttribute('tabindex');
    mgDrawer(document);

    expect(container.getAttribute('role')).toBe('dialog');
    expect(container.getAttribute('tabindex')).toBe('-1');

    mgDrawerDestroy(document);
    expect(container.hasAttribute('role')).toBe(false);
    expect(container.hasAttribute('tabindex')).toBe(false);
  });

  it('destroy removes the backdrop, the trigger wiring and the listeners', () => {
    const { container, trigger } = build();
    mgDrawer(document);
    trigger.click();

    mgDrawerDestroy(document);

    expect(document.querySelector('.mg-drawer__backdrop')).toBeNull();
    expect(container.hasAttribute('data-mg-js-drawer-initialized')).toBe(false);
    expect(trigger.hasAttribute('aria-expanded')).toBe(false);
    expect(mgDrawerInstance(container)).toBeNull();

    // A click after destroy does nothing.
    const wasOpen = container.classList.contains('is-open');
    trigger.click();
    expect(container.classList.contains('is-open')).toBe(wasOpen);
  });

  it('re-initialises after destroy', () => {
    const { container, trigger } = build();
    mgDrawer(document);
    mgDrawerDestroy(document);
    expect(mgDrawer(document)).toHaveLength(1);

    trigger.click();
    expect(container.classList.contains('is-open')).toBe(true);
  });

  it('names the dialog from its title when the markup gives it no name', () => {
    const { container } = build();
    const title = container.querySelector('.mg-drawer__title');
    mgDrawer(document);

    expect(title.id).toMatch(/^mg-drawer-title-\d+$/);
    expect(container.getAttribute('aria-labelledby')).toBe(title.id);

    mgDrawerDestroy(document);
    expect(container.hasAttribute('aria-labelledby')).toBe(false);
    expect(title.hasAttribute('id')).toBe(false);
  });

  it('leaves an existing name and an existing title id alone', () => {
    const { container } = build();
    const title = container.querySelector('.mg-drawer__title');
    title.id = 'my-title';
    container.setAttribute('aria-label', 'Publication filters');
    mgDrawer(document);

    expect(container.hasAttribute('aria-labelledby')).toBe(false);
    expect(container.getAttribute('aria-label')).toBe('Publication filters');
    expect(title.id).toBe('my-title');
  });

  it('has no axe violations closed or open', async () => {
    expect.extend(toHaveNoViolations);
    const { trigger } = build();
    mgDrawer(document);

    expect(await axe(document.body)).toHaveNoViolations();

    trigger.click();
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('skips a container marked data-mg-js-drawer-skip-auto-init only on auto-init', () => {
    const { container } = build();
    container.setAttribute('data-mg-js-drawer-skip-auto-init', '');
    // An explicit call still enhances it; auto-init is exercised on load.
    expect(mgDrawer(document)).toHaveLength(1);
  });
});
