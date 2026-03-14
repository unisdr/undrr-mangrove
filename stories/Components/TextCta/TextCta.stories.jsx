import { TextCta } from './TextCta';

export default {
  title: 'Components/CTA',
  component: TextCta,
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = {
  args: {
    headline: 'United Nations Office for Disaster Risk Reduction',
    text: '<p>Together, we can achieve the global goal set by the UN Secretary-General that every person on the planet is covered by an early warning system within the next 5 years.</p>',
    buttons: [{ label: 'Read more', url: '#' }],
  },
};

export const Secondary = {
  args: {
    headline: 'Join the global platform',
    text: '<p>Register now for the Global Platform for Disaster Risk Reduction 2025.</p>',
    buttons: [
      { label: 'Register', url: '#' },
      { label: 'Learn more', url: '#', type: 'Secondary' },
    ],
    variant: 'secondary',
  },
};

export const Tertiary = {
  args: {
    headline: 'Learn more about the system',
    buttons: [{ label: 'View Documentation', url: '#' }],
    variant: 'tertiary',
  },
};

export const CustomColor = {
  args: {
    headline: 'Custom branded banner',
    text: '<p>Use <code>backgroundColor</code> for any CSS color value.</p>',
    buttons: [{ label: 'Get started', url: '#' }],
    backgroundColor: '#2c5f2d',
  },
};

export const LeftAligned = {
  args: {
    headline: 'Left-aligned CTA',
    text: '<p>Set <code>centered={false}</code> for left-aligned content.</p>',
    buttons: [{ label: 'Take action', url: '#' }],
    centered: false,
  },
};

export const WithImage = {
  args: {
    headline:
      'Recovery Help Desk: A service of the IRP, responding to requests for support with building back better in recovery from disasters.',
    buttons: [{ label: 'Learn more about the Recovery Help Desk', url: '#' }],
    image:
      'https://recovery.preventionweb.net/sites/default/files/2021-12/Recovery%20Help%20Desk%20Icon%20Background%20White_1.png',
    imageAlt: 'Recovery Help Desk',
    backgroundColor: '#1671cc',
  },
};

export const HeadlineOnly = {
  args: {
    headline: 'A simple call to action with just a headline and button',
    buttons: [{ label: 'Learn more', url: '#' }],
  },
};
