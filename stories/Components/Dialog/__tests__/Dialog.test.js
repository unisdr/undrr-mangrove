import { axe } from 'jest-axe';
import { mgDialog, mgDialogDestroy } from '../../../assets/js/dialog';

function markup(id = 'one') {
  return `<div data-mg-dialog><button type="button" data-mg-dialog-trigger hidden>Read</button><details data-mg-dialog-fallback><summary>Read</summary><div data-mg-dialog-content><header class="mg-dialog__header"><h2 id="${id}" tabindex="-1" data-mg-dialog-title data-mg-dialog-initial-focus>Case study</h2><button type="button" data-mg-dialog-close hidden>Close</button></header><p>Optional reading</p><input aria-label="Notes" value="original"></div></details></div>`;
}
let show;
let close;
beforeEach(() => {
  document.body.innerHTML = markup();
  show = HTMLDialogElement.prototype.showModal;
  close = HTMLDialogElement.prototype.close;
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
});
afterEach(() => {
  mgDialogDestroy();
  HTMLDialogElement.prototype.showModal = show;
  HTMLDialogElement.prototype.close = close;
  document.documentElement.style.removeProperty('overflow');
});
const trigger = () => document.querySelector('[data-mg-dialog-trigger]');
const dialog = () => document.querySelector('dialog');

test('fallback remains usable without native support or complete markup', () => {
  HTMLDialogElement.prototype.showModal = undefined;
  mgDialog();
  expect(dialog()).toBeNull();
  expect(document.querySelector('details')).not.toHaveAttribute('hidden');
  HTMLDialogElement.prototype.showModal = show;
});

test('enhancement is idempotent and moves and restores the same content/state', () => {
  const input = document.querySelector('input');
  input.value = 'edited';
  mgDialog();
  mgDialog();
  expect(document.querySelectorAll('dialog')).toHaveLength(1);
  expect(dialog().querySelector('input')).toBe(input);
  mgDialogDestroy();
  expect(document.querySelector('details input')).toBe(input);
  expect(input.value).toBe('edited');
  expect(trigger()).toHaveAttribute('hidden');
  mgDialog();
  expect(dialog()).not.toBeNull();
});

test('names modal, focuses reading heading, restores opener and overflow priority', () => {
  document.documentElement.style.setProperty('overflow', 'scroll', 'important');
  mgDialog();
  trigger().focus();
  trigger().click();
  expect(dialog()).toHaveAttribute('aria-labelledby', 'one');
  expect(document.activeElement).toBe(document.getElementById('one'));
  expect(document.documentElement.style.overflow).toBe('hidden');
  document.querySelector('[data-mg-dialog-close]').click();
  expect(document.activeElement).toBe(trigger());
  expect(document.documentElement.style.overflow).toBe('scroll');
  expect(document.documentElement.style.getPropertyPriority('overflow')).toBe(
    'important'
  );
});

test('native close and destroying an open instance release the scroll lock', () => {
  mgDialog();
  trigger().click();
  dialog().close();
  expect(document.documentElement.style.overflow).toBe('');
  trigger().click();
  mgDialogDestroy();
  expect(document.documentElement.style.overflow).toBe('');
  expect(dialog()).toBeNull();
});

test('multiple instances hold the lock until the final close', () => {
  document.body.innerHTML += markup('two');
  mgDialog();
  const triggers = document.querySelectorAll('[data-mg-dialog-trigger]');
  triggers[0].click();
  triggers[1].click();
  const dialogs = document.querySelectorAll('dialog');
  dialogs[0].close();
  expect(document.documentElement.style.overflow).toBe('hidden');
  dialogs[1].close();
  expect(document.documentElement.style.overflow).toBe('');
});

test('backdrop click requires both press and release outside the surface', () => {
  mgDialog();
  trigger().click();
  dialog().getBoundingClientRect = () => ({
    left: 10,
    top: 10,
    right: 100,
    bottom: 100,
  });
  const event = (type, x) =>
    new MouseEvent(type, { bubbles: true, clientX: x, clientY: x });
  dialog().dispatchEvent(event('pointerdown', 50));
  dialog().dispatchEvent(event('click', 0));
  expect(dialog().open).toBe(true);
  dialog().dispatchEvent(event('pointerdown', 0));
  dialog().dispatchEvent(event('click', 0));
  expect(dialog().open).toBe(false);
});

test('showModal failure restores an open readable disclosure', () => {
  HTMLDialogElement.prototype.showModal = () => {
    throw new Error('inactive');
  };
  mgDialog();
  trigger().click();
  expect(dialog()).toBeNull();
  expect(document.querySelector('details').open).toBe(true);
  expect(document.querySelector('details')).not.toHaveAttribute('hidden');
});

test('authored dialog has no axe violations', async () => {
  mgDialog();
  trigger().click();
  expect(await axe(dialog())).toHaveNoViolations();
});

test.each(['[data-mg-dialog-close]', '[data-mg-dialog-title]'])(
  'incomplete %s markup retains disclosure',
  selector => {
    document.querySelector(selector).remove();
    mgDialog();
    expect(dialog()).toBeNull();
    expect(document.querySelector('details')).not.toHaveAttribute('hidden');
    expect(trigger()).toHaveAttribute('hidden');
  }
);

test('missing title id retains disclosure and omitted initial focus chooses Close', () => {
  document.querySelector('h2').removeAttribute('id');
  mgDialog();
  expect(dialog()).toBeNull();
  document.querySelector('h2').id = 'restored';
  document.querySelector('h2').removeAttribute('data-mg-dialog-initial-focus');
  mgDialog();
  trigger().click();
  expect(document.activeElement).toBe(
    document.querySelector('[data-mg-dialog-close]')
  );
});

test('queued native close followed by immediate reopen does not leak its lock', () => {
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  mgDialog();
  trigger().click();
  dialog().close();
  trigger().click();
  dialog().dispatchEvent(new Event('close'));
  expect(document.documentElement.style.overflow).toBe('hidden');
  dialog().close();
  dialog().dispatchEvent(new Event('close'));
  expect(document.documentElement.style.overflow).toBe('');
});

test('pointer activation returns to the trigger even when it did not take focus', () => {
  mgDialog();
  const unrelated = document.createElement('input');
  document.body.prepend(unrelated);
  unrelated.focus();
  trigger().click();
  dialog().close();
  expect(document.activeElement).toBe(trigger());
});
