import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import meta, { ExpandedCloseLabel, LongTitle } from '../Dialog.stories';
import { renderStoryToHtml } from '../../../../.storybook/docsSourceRender';
import { LANGUAGE_CODES } from '../../../../.storybook/language';

let showModal;
let close;
beforeEach(() => {
  showModal = HTMLDialogElement.prototype.showModal;
  close = HTMLDialogElement.prototype.close;
  HTMLDialogElement.prototype.showModal = function showModalMock() {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function closeMock() {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
});
afterEach(() => {
  cleanup();
  HTMLDialogElement.prototype.showModal = showModal;
  HTMLDialogElement.prototype.close = close;
});

const example = (locale, args = {}, addonRtl = 'ltr') =>
  meta.render(args, { globals: { locale, addonRtl } });

test('changing the authored locale tears down an open enhancement and renders correctly named controls', () => {
  const { container, rerender } = render(example('arabic'));
  const trigger = container.querySelector('[data-mg-dialog-trigger]');
  expect(trigger).toHaveTextContent('إتاحة الموارد');
  fireEvent.click(trigger);
  expect(document.documentElement.style.overflow).toBe('hidden');
  expect(container.querySelector('dialog')).toHaveAccessibleName(
    'إتاحة الموارد'
  );
  expect(container.querySelector('[data-mg-dialog]')).toHaveAttribute(
    'lang',
    'ar'
  );
  expect(container.querySelector('[data-mg-dialog]')).toHaveAttribute(
    'dir',
    'rtl'
  );
  expect(container.querySelector('[data-mg-dialog-close]')).toHaveTextContent(
    'إغلاق'
  );

  rerender(example('french'));
  expect(document.documentElement.style.overflow).toBe('');
  expect(container.querySelectorAll('dialog')).toHaveLength(1);
  expect(container.querySelector('dialog').open).toBe(false);
  expect(container.querySelector('[data-mg-dialog]')).toHaveAttribute(
    'lang',
    'fr'
  );
  expect(container.querySelector('[data-mg-dialog-close]')).toHaveTextContent(
    'Fermer'
  );
  fireEvent.click(container.querySelector('[data-mg-dialog-trigger]'));
  expect(container.querySelector('dialog')).toHaveAccessibleName(
    'Disponibilité des ressources'
  );
});

test.each(Object.entries(LANGUAGE_CODES))(
  'the %s fixture renders with its language and preserves an explicit RTL story direction',
  (locale, lang) => {
    const { container } = render(example(locale, {}, 'rtl'));
    expect(container.querySelector('[data-mg-dialog]')).toHaveAttribute(
      'lang',
      lang
    );
    expect(container.querySelector('[data-mg-dialog]')).toHaveAttribute(
      'dir',
      'rtl'
    );
    expect(
      container.querySelector('[data-mg-dialog-close]').textContent.trim()
    ).not.toBe('');
    if (lang !== 'en')
      expect(
        container.querySelector('[data-mg-dialog-close]')
      ).not.toHaveTextContent(/^Close$/);
  }
);

test('the deliberately German compound-title fixture keeps its own language inside an Arabic example', () => {
  const { container } = render(example('arabic', LongTitle.args));
  expect(container.querySelector('[data-mg-dialog]')).toHaveAttribute(
    'lang',
    'ar'
  );
  expect(container.querySelector('[data-mg-dialog-title]')).toHaveAttribute(
    'lang',
    'de'
  );
  expect(container.querySelector('[data-mg-dialog-title]')).toHaveAttribute(
    'dir',
    'ltr'
  );
});

test('HTML source mode emits reusable authored fallback markup and stable IDs for a translated expanded-label example', async () => {
  expect(meta.parameters.docs.source.html).toBe(true);
  const html = await renderStoryToHtml({
    originalStoryFn: meta.render,
    args: ExpandedCloseLabel.args,
    globals: { locale: 'french' },
    title: 'Components/Dialog',
  });
  const source = document.createElement('div');
  source.innerHTML = html;
  expect(html).not.toContain('DialogExample');
  expect(html).not.toContain('mgdocsid');
  expect(source.querySelector('[data-mg-dialog]')).toHaveAttribute(
    'lang',
    'fr'
  );
  expect(source.querySelector('summary')).toHaveTextContent(
    'Lire l’étude de cas'
  );
  expect(source.querySelector('[data-mg-dialog-title]').id).toMatch(
    /^dialog-\d+$/
  );
  expect(source.querySelector('[data-mg-dialog-trigger]')).toHaveAttribute(
    'hidden'
  );
  expect(source.querySelector('[data-mg-dialog-close]')).toHaveAttribute(
    'hidden'
  );
  expect(source.querySelector('[data-mg-dialog-close]')).toHaveTextContent(
    'Fermer la fenêtre de dialogue'
  );
  expect(source.querySelector('dialog')).toBeNull();
});
