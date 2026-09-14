import React from 'react';
import { expect } from 'storybook/test';
import { PageHeader } from './PageHeader';

export default {
  title: 'Components/PageHeader',
  component: PageHeader,
  // Every story below follows Storybook's Locale toolbar for the logo,
  // matching the active page language a real site would render with —
  // unless a story sets its own `locale` arg (e.g. LocaleDrivenLogo below),
  // which always wins over the toolbar.
  render: (args, { globals }) => (
    <PageHeader {...args} locale={args.locale ?? globals.locale} />
  ),
  parameters: {
    // Full-bleed site chrome, same as MegaMenu — the default padded docs
    // canvas puts a visible margin around it that isn't part of the design.
    layout: 'fullscreen',
  },
  argTypes: {
    variant: {
      options: ['default', 'decoration-only'],
      control: { type: 'radio' },
    },
    logoUrl: { control: 'text' },
    logoAlt: { control: 'text' },
    logoTitle: { control: 'text' },
    locale: {
      options: [
        'english',
        'arabic',
        'french',
        'japanese',
        'russian',
        'spanish',
        'chinese',
      ],
      control: { type: 'select' },
    },
    homeUrl: { control: 'text' },
    languageDisplay: {
      options: ['dropdown', 'links'],
      control: { type: 'radio' },
    },
    languages: { control: 'object' },
  },
};

export const Default = {
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector('.mg-page-header__container');
    const style = getComputedStyle(container);
    expect(parseFloat(style.paddingInlineStart)).toBeGreaterThanOrEqual(10);
    expect(parseFloat(style.paddingInlineEnd)).toBeGreaterThanOrEqual(10);
  },
  args: {
    variant: 'default',
  },
};

export const DecorationOnly = {
  args: {
    variant: 'decoration-only',
  },
};

export const WithCustomLanguages = {
  args: {
    variant: 'default',
    languages: [
      { value: 'ch', label: 'Cheese speak', selected: true },
      { value: 'es', label: 'Español' },
      { value: 'fr', label: 'Français' },
      { value: 'ar', label: 'العربية' },
    ],
  },
};

export const WithLanguageLinks = {
  name: 'With language links',
  args: {
    variant: 'default',
    languageDisplay: 'links',
    languages: [
      { value: 'en', label: 'English', selected: true },
      { value: 'ar', label: 'العربية' },
      { value: 'es', label: 'Español' },
      { value: 'fr', label: 'Français' },
    ],
  },
};

export const WithCustomClass = {
  args: {
    variant: 'default',
    className: 'custom-header-class',
  },
};

export const LocaleDrivenLogo = {
  name: 'Locale-driven logo',
  args: {
    variant: 'default',
    locale: 'spanish',
    homeUrl: 'https://www.undrr.org/es',
  },
  parameters: {
    docs: {
      description: {
        story:
          "Pins `locale` to Spanish (overriding the Locale toolbar) for a stable demo — but every story on this page actually follows the toolbar the same way by default (see this file's meta-level `render`), since a real page passes its active language the same way. No `logoUrl` is set here — the header resolves the translated Spanish logo automatically (the only locale with a published white asset today; every other locale falls back to the English default rather than risk a low-contrast logo).",
      },
    },
  },
};
