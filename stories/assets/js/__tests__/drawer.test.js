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

  // The name the module gives an unnamed dialog is a loan, not a repair: it is
  // handed back on destroy along with everything else, so markup that carries
  // role="dialog" with nothing naming it fails aria-dialog-name again once the
  // module is gone. That is the correct trade — a destroy that kept the name
  // would leave a minted id behind — but it means the page is only named while
  // the module is running. Naming the dialog in the markup is the real fix.
  it('hands the borrowed dialog name back on destroy, gap and all', async () => {
    expect.extend(toHaveNoViolations);
    const { container } = build();

    const before = await axe(document.body);
    expect(before.violations.map(violation => violation.id)).toContain(
      'aria-dialog-name'
    );

    mgDrawer(document);
    expect(await axe(document.body)).toHaveNoViolations();

    mgDrawerDestroy(document);
    const after = await axe(document.body);
    expect(after.violations.map(violation => violation.id)).toContain(
      'aria-dialog-name'
    );
    expect(container.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('has no axe violations for an open non-modal floating panel', async () => {
    expect.extend(toHaveNoViolations);
    const { trigger } = build({ id: 'layers', panel: true });
    mgDrawer(document);
    trigger.click();

    expect(await axe(document.body)).toHaveNoViolations();
  });

  // Each of these was a real escape or a real jam, reproduced in Chrome before
  // it was fixed. A trap that only looks at `a[href], button, input, select,
  // textarea, [tabindex]` and only listens on the container gets every one of
  // them wrong.
  describe('focus trap edge cases', () => {
    const tabKey = (target, shiftKey = false) => {
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey,
        bubbles: true,
        cancelable: true,
      });
      target.dispatchEvent(event);
      return event;
    };

    it('ignores an unrendered element rather than making it the wrap target', () => {
      const { container, trigger, closeButton, link } = build();
      const hidden = document.createElement('button');
      hidden.style.display = 'none';
      hidden.textContent = 'hidden';
      container.querySelector('.mg-drawer__body').append(hidden);
      mgDrawer(document);
      trigger.click();

      // Forward from the real last tabbable wraps to the first, instead of
      // walking past a display:none element and out of the drawer.
      link.focus();
      expect(tabKey(link).defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(closeButton);

      // Backwards from the first lands on the real last tabbable, instead of
      // calling focus() on something that cannot take it and jamming.
      expect(tabKey(closeButton, true).defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(link);
    });

    it('counts an iframe and a contenteditable as tabbable', () => {
      const { container, trigger, closeButton } = build();
      container.querySelector('.mg-drawer__body').innerHTML =
        '<div contenteditable="true" id="ce">edit</div><iframe id="frame" title="f"></iframe>';
      mgDrawer(document);
      trigger.click();

      // The iframe is the last tabbable, so forward from it wraps. Before,
      // neither it nor the contenteditable was reachable at all.
      const frame = document.getElementById('frame');
      frame.focus();
      expect(tabKey(frame).defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(closeButton);

      expect(tabKey(closeButton, true).defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(frame);
    });

    it('stops on one radio per group, the checked one', () => {
      const { container, trigger, closeButton } = build();
      container.querySelector('.mg-drawer__body').innerHTML = `
        <input type="radio" name="r" id="r1">
        <input type="radio" name="r" id="r2" checked>
        <input type="radio" name="r" id="r3">`;
      mgDrawer(document);
      trigger.click();

      // r3 is not a tab stop, so treating it as the last one let Tab leave.
      const checked = document.getElementById('r2');
      checked.focus();
      expect(tabKey(checked).defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(closeButton);
    });

    it('pulls focus back when it has escaped the drawer', () => {
      const { trigger, closeButton } = build();
      const outside = document.createElement('button');
      document.body.append(outside);
      mgDrawer(document);
      trigger.click();

      // Something moved focus out from under the trap. The next Tab recovers
      // it rather than leaving the user loose behind the backdrop.
      outside.focus();
      expect(tabKey(outside).defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(closeButton);
    });

    it('wraps Shift+Tab from the container itself', () => {
      const { container, trigger, link } = build();
      container.querySelector('.mg-drawer__close').remove();
      mgDrawer(document);
      trigger.click();

      // With no close button, open() focuses the container. Shift+Tab from a
      // tabindex="-1" element used to walk straight out of the drawer.
      expect(document.activeElement).toBe(container);
      expect(tabKey(container, true).defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(link);
    });

    it('holds focus on the dialog when nothing inside is tabbable', () => {
      const { container, trigger } = build();
      container.querySelector('.mg-drawer__close').remove();
      container.querySelector('.mg-drawer__body').innerHTML = 'just text';
      mgDrawer(document);
      trigger.click();

      expect(tabKey(container).defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(container);
    });
  });

  describe('Escape', () => {
    it('closes only the innermost open drawer', () => {
      const { container: outer } = build({ id: 'outer' });
      const { container: inner } = build({ id: 'inner' });
      const [outerHandle, innerHandle] = mgDrawer(document);
      outerHandle.open();
      innerHandle.open();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(inner.classList.contains('is-open')).toBe(false);
      expect(outer.classList.contains('is-open')).toBe(true);
    });

    it('leaves an Escape another handler already answered alone', () => {
      const { container, trigger } = build();
      mgDrawer(document);
      trigger.click();

      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      event.preventDefault();
      document.dispatchEvent(event);

      expect(container.classList.contains('is-open')).toBe(true);
    });

    it('lets a nested open dialog answer Escape first', () => {
      const { container, trigger } = build();
      container.querySelector('.mg-drawer__body').innerHTML =
        '<dialog open id="nested"><button>ok</button></dialog>';
      mgDrawer(document);
      trigger.click();

      document
        .getElementById('nested')
        .querySelector('button')
        .dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
        );

      expect(container.classList.contains('is-open')).toBe(true);
    });

    it('does not close a non-modal panel from elsewhere on the page', () => {
      const { container, trigger } = build({ id: 'layers', panel: true });
      const elsewhere = document.createElement('input');
      document.body.append(elsewhere);
      mgDrawer(document);
      trigger.click();

      // The page behind a floating panel stays usable, so Escape there belongs
      // to whatever the user is in — not to the panel.
      elsewhere.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
      );
      expect(container.classList.contains('is-open')).toBe(true);

      // From inside the panel it still closes.
      container.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
      );
      expect(container.classList.contains('is-open')).toBe(false);
    });
  });

  describe('focus restoration', () => {
    it('falls back to a trigger when the opener has gone', () => {
      const { trigger, closeButton } = build();
      mgDrawer(document);
      const opener = document.createElement('button');
      document.body.append(opener);
      opener.focus();
      opener.click();
      trigger.click();
      opener.remove();

      closeButton.click();

      // Never the control inside the drawer that has just been made inert.
      expect(document.activeElement).toBe(trigger);
    });

    it('parks focus on the body when nothing is left to return to', () => {
      const { container, closeButton } = build();
      mgDrawer(document);
      container.dispatchEvent(new CustomEvent('mg-drawer:open'));
      expect(document.activeElement).toBe(closeButton);

      document.querySelector('[data-mg-drawer-trigger]').remove();
      container.dispatchEvent(new CustomEvent('mg-drawer:close'));

      expect(container.contains(document.activeElement)).toBe(false);
      expect(document.body.hasAttribute('tabindex')).toBe(false);
    });
  });

  it('does not let a nested drawer command reach the drawer around it', () => {
    const { container: outer } = build({ id: 'outer' });
    const { container: inner } = build({ id: 'inner' });
    outer.querySelector('.mg-drawer__body').append(inner);
    mgDrawer(document);

    inner.dispatchEvent(new CustomEvent('mg-drawer:open', { bubbles: true }));

    expect(inner.classList.contains('is-open')).toBe(true);
    expect(outer.classList.contains('is-open')).toBe(false);
  });

  it('destroy leaves the markup exactly as it found it', () => {
    const { container, trigger } = build();
    // A page that wired its own trigger state, which destroy used to delete.
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', 'filters');
    const before = document.body.innerHTML;

    mgDrawer(document);
    trigger.click();
    mgDrawerDestroy(document);

    expect(document.body.innerHTML).toBe(before);
    expect(container.classList.contains('is-open')).toBe(false);
  });

  it('refuses a container that also carries the hydration marker', () => {
    const { container, trigger } = build();
    container.setAttribute('data-mg-drawer', '');
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    expect(mgDrawer(document)).toHaveLength(0);
    expect(warn).toHaveBeenCalled();
    expect(container.hasAttribute('data-mg-js-drawer-initialized')).toBe(false);

    trigger.click();
    expect(container.classList.contains('is-open')).toBe(false);
    warn.mockRestore();
  });

  it('skips a container marked data-mg-js-drawer-skip-auto-init only on auto-init', () => {
    const { container } = build();
    container.setAttribute('data-mg-js-drawer-skip-auto-init', '');
    // An explicit call still enhances it; auto-init is exercised on load.
    expect(mgDrawer(document)).toHaveLength(1);
  });
});
