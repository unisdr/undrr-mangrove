import React from 'react';
import { userEvent, within } from 'storybook/test';
import { SkipLink } from './SkipLink';

export default {
  title: 'Components/Skip link',
  component: SkipLink,
  parameters: {
    docs: {
      description: {
        component:
          'The first focusable element on the page. Hidden until it receives keyboard focus, then shown in normal flow above the header.',
      },
    },
  },
};

/**
 * A miniature page: the skip link, a stand-in for the global header a keyboard
 * user would otherwise tab through, and the `<main>` the link targets.
 */
function DemoPage({ id, children, ...args }) {
  return (
    <div>
      <SkipLink targetId={`${id}-content`} {...args} />

      <header
        style={{
          background: 'rgb(var(--mg-color-neutral-100))',
          padding: 'var(--mg-spacing-200)',
        }}
      >
        <nav aria-label="Stand-in for the global navigation">
          <a href="#one">Brand bar link</a> <a href="#two">Menu item</a>{' '}
          <a href="#three">Menu item</a> <a href="#four">Menu item</a>
        </nav>
      </header>

      <main
        id={`${id}-content`}
        tabIndex={-1}
        style={{ padding: 'var(--mg-spacing-200)' }}
      >
        {children}
      </main>
    </div>
  );
}

export const DefaultSkipLink = {
  render: args => (
    <DemoPage id="skip-default" {...args}>
      <h1>Page title</h1>
      <p>
        Click into the story, then press Tab: the skip link is the first thing
        focus reaches, and following it moves focus to this element.
      </p>
    </DemoPage>
  ),
  name: 'Skip link',
};

/**
 * The state worth seeing. Focus is placed on the link when the story loads, so
 * the revealed appearance is visible without a keyboard.
 */
export const Focused = {
  render: args => (
    <DemoPage id="skip-focused" {...args}>
      <h1>Page title</h1>
      <p>The link above is focused, which is the only state that renders.</p>
    </DemoPage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    canvas.getByRole('link', { name: 'Skip to main content' }).focus();
  },
};

/**
 * The label is a prop, so it carries whatever the page language is. Arabic
 * also exercises the right-to-left layout.
 */
export const TranslatedRtl = {
  render: args => (
    <div lang="ar" dir="rtl">
      <DemoPage id="skip-rtl" {...args} label="تخطي إلى المحتوى الرئيسي">
        <h1>عنوان الصفحة</h1>
        <p>الرابط أعلاه يظهر عند التركيز عليه بلوحة المفاتيح.</p>
      </DemoPage>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('link', { name: 'تخطي إلى المحتوى الرئيسي' }).focus();
  },
  name: 'Translated and RTL',
};
