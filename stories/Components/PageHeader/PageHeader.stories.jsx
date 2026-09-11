import React from 'react';
import { expect } from 'storybook/test';
import { PageHeader } from './PageHeader';

export default {
  title: 'Components/PageHeader',
  component: PageHeader,
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
