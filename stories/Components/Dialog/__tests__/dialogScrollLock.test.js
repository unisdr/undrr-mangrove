import { lockDialogScroll } from '../../../assets/js/dialog-scroll-lock';

test('concurrent dialog locks are reference counted and release is idempotent', () => {
  const doc = document.implementation.createHTMLDocument();
  doc.documentElement.style.setProperty('overflow-x', 'clip', 'important');
  doc.documentElement.style.setProperty('overflow-y', 'scroll');
  const first = lockDialogScroll(doc);
  const second = lockDialogScroll(doc);
  first();
  first();
  expect(doc.documentElement.style.getPropertyValue('overflow')).toBe('hidden');
  second();
  expect(doc.documentElement.style.getPropertyValue('overflow-x')).toBe('clip');
  expect(doc.documentElement.style.getPropertyPriority('overflow-x')).toBe(
    'important'
  );
  expect(doc.documentElement.style.getPropertyValue('overflow-y')).toBe(
    'scroll'
  );
  second();
  expect(doc.documentElement.style.getPropertyValue('overflow-y')).toBe(
    'scroll'
  );
});
