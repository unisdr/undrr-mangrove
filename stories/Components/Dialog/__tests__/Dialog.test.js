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
  for (const name of ['overflow', 'overflow-x', 'overflow-y'])
    document.documentElement.style.removeProperty(name);
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

test.each([
  '[data-mg-dialog-close]',
  '[data-mg-dialog-title]',
  '[data-mg-dialog-trigger]',
  '[data-mg-dialog-content]',
  'summary',
])('incomplete %s markup retains disclosure', selector => {
  document.querySelector(selector).remove();
  mgDialog();
  expect(dialog()).toBeNull();
  expect(document.querySelector('details')).not.toHaveAttribute('hidden');
  if (trigger()) expect(trigger()).toHaveAttribute('hidden');
});

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

test('restores independent overflow axes and their priorities after the final close', () => {
  const style = document.documentElement.style;
  style.setProperty('overflow-x', 'scroll', 'important');
  style.setProperty('overflow-y', 'auto');
  mgDialog();
  trigger().click();
  style.setProperty('--host-change', 'retained');
  document.querySelector('[data-mg-dialog-close]').click();
  expect(style.getPropertyValue('--host-change')).toBe('retained');
  style.removeProperty('--host-change');
  expect(style.getPropertyValue('overflow-x')).toBe('scroll');
  expect(style.getPropertyPriority('overflow-x')).toBe('important');
  expect(style.getPropertyValue('overflow-y')).toBe('auto');
  expect(style.getPropertyPriority('overflow-y')).toBe('');
});

test('nested roots retain their authored disclosures rather than borrowing content', () => {
  document.body.innerHTML = `<div data-mg-dialog>${markup('nested')}</div>`;
  mgDialog();
  expect(dialog()).toBeNull();
  expect(document.querySelector('details')).not.toHaveAttribute('hidden');
  expect(trigger()).toHaveAttribute('hidden');
});

test('destroying an active enhancement returns focus to the restored disclosure', () => {
  mgDialog();
  trigger().click();
  mgDialogDestroy();
  expect(document.activeElement).toBe(document.querySelector('summary'));
  expect(trigger()).toHaveAttribute('hidden');
});

test('destroying a closed enhancement does not steal unrelated focus', () => {
  mgDialog();
  const input = document.createElement('input');
  document.body.prepend(input);
  input.focus();
  mgDialogDestroy();
  expect(document.activeElement).toBe(input);
});

test('every authored close control dismisses and retains its hidden state on teardown', () => {
  const footerClose = document.createElement('button');
  footerClose.type = 'button';
  footerClose.setAttribute('data-mg-dialog-close', '');
  footerClose.textContent = 'Return to the page';
  document.querySelector('[data-mg-dialog-content]').append(footerClose);
  const headerClose = document.querySelector('[data-mg-dialog-close]');
  mgDialog();
  expect(footerClose.hidden).toBe(false);
  trigger().click();
  footerClose.click();
  expect(dialog().open).toBe(false);
  expect(document.documentElement.style.overflow).toBe('');
  expect(document.activeElement).toBe(trigger());
  mgDialogDestroy();
  expect(headerClose.hidden).toBe(true);
  expect(footerClose.hidden).toBe(false);
  mgDialog();
  trigger().click();
  footerClose.click();
  expect(document.documentElement.style.overflow).toBe('');
});
