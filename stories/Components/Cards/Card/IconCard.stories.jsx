import { IconCard } from './IconCard';
//import './card.scss';

export default {
  title: 'Components/Cards/Icon card',
  component: IconCard,
  parameters: {
    docs: {
      description: {
        component:
          'Icon Card is a flexible card variant featuring an icon or image at the top, followed by content and a call-to-action (link or button) at the bottom. Supports left-aligned (LTR), right-aligned (RTL), and centered layouts.',
      },
    },
  },
  argTypes: {
    alignment: {
      control: 'select',
      options: ['left', 'center', 'right'],
      description: 'Content alignment - use "right" for RTL languages',
      defaultValue: 'left',
    },
    stackedLayout: {
      control: 'boolean',
      description: 'Force vertical/stacked layout at all breakpoints',
      defaultValue: false,
    },
  },
};

// Sample SVG icon as inline string
const componentIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="6" y="6" width="60" height="60" rx="4"/>
  <path d="M6 22h60M22 6v60"/>
</svg>`;

const settingsIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="36" cy="36" r="10"/>
  <path d="M36 6v8m0 44v8M6 36h8m44 0h8m-53-21l5.66 5.66m31.68 31.68l5.66 5.66m0-42.6l-5.66 5.66M17.66 47.34l-5.66 5.66"/>
</svg>`;

const bookIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M12 6h48c2.2 0 4 1.8 4 4v48c0 2.2-1.8 4-4 4H12c-2.2 0-4-1.8-4-4V10c0-2.2 1.8-4 4-4z"/>
  <path d="M36 6v60M20 24h12M20 36h12M20 48h12"/>
</svg>`;

const Template = args => <IconCard {...args} />;

// Default - Left aligned with link
export const LeftAlignedWithLink = Template.bind({});
LeftAlignedWithLink.args = {
  alignment: 'left',
  stackedLayout: true,
  data: [
    {
      icon: componentIcon,
      title: 'Components',
      description:
        'Browse all USWDS components, and get UX, accessibility, and implementation guidance.',
      linkText: 'Browse components →',
      link: '#',
    },
    {
      icon: settingsIcon,
      title: 'Configuration',
      description:
        'Learn how to configure and customize components to match your design requirements.',
      linkText: 'View settings →',
      link: '#',
    },
    {
      icon: bookIcon,
      title: 'Documentation',
      description:
        'Access comprehensive documentation with examples and best practices.',
      linkText: 'Read docs →',
      link: '#',
    },
  ],
};

// Centered alignment with buttons
export const CenteredWithButton = Template.bind({});
CenteredWithButton.args = {
  alignment: 'center',
  stackedLayout: true,
  data: [
    {
      icon: componentIcon,
      title: 'Get Started',
      description:
        'Quick start guide to help you begin using the component library.',
      button: 'Start Now',
      buttonType: 'Primary',
      link: '#',
    },
    {
      icon: settingsIcon,
      title: 'Learn More',
      description:
        'Dive deep into advanced features and customization options.',
      button: 'Explore',
      buttonType: 'Secondary',
      link: '#',
    },
  ],
};

// Right aligned (RTL support)
export const RightAlignedRTL = Template.bind({});
RightAlignedRTL.args = {
  alignment: 'right',
  stackedLayout: true,
  data: [
    {
      icon: componentIcon,
      title: 'المكونات',
      description:
        'تصفح جميع مكونات USWDS والحصول على UX وإمكانية الوصول وإرشادات التنفيذ.',
      linkText: 'تصفح المكونات ←',
      link: '#',
    },
  ],
};

// With labels/badges
export const WithLabels = Template.bind({});
WithLabels.args = {
  alignment: 'left',
  stackedLayout: true,
  data: [
    {
      icon: componentIcon,
      label: 'NEW',
      title: 'Latest Features',
      description:
        'Check out the newest components and improvements to the library.',
      button: 'View Features',
      link: '#',
    },
    {
      icon: settingsIcon,
      label: 'UPDATED',
      title: 'Enhanced Performance',
      description: 'Performance improvements and bug fixes in this release.',
      button: 'Learn More',
      link: '#',
    },
  ],
};

// Grid layout example (use with grid container)
export const GridLayout = () => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '2rem',
    }}
  >
    <IconCard
      alignment="center"
      stackedLayout={true}
      data={[
        {
          icon: componentIcon,
          title: 'Components',
          description: 'Browse all components and get implementation guidance.',
          linkText: 'Browse →',
          link: '#',
        },
      ]}
    />
    <IconCard
      alignment="center"
      stackedLayout={true}
      data={[
        {
          icon: settingsIcon,
          title: 'Settings',
          description: 'Configure and customize your components.',
          linkText: 'Configure →',
          link: '#',
        },
      ]}
    />
    <IconCard
      alignment="center"
      stackedLayout={true}
      data={[
        {
          icon: bookIcon,
          title: 'Documentation',
          description: 'Access comprehensive documentation and examples.',
          linkText: 'Read docs →',
          link: '#',
        },
      ]}
    />
  </div>
);

// Mixed content (some with buttons, some with links)
export const MixedContent = Template.bind({});
MixedContent.args = {
  alignment: 'left',
  stackedLayout: true,
  data: [
    {
      icon: componentIcon,
      title: 'Primary Action',
      description: 'This card uses a button for the call-to-action.',
      button: 'Get Started',
      buttonType: 'Primary',
      link: '#',
    },
    {
      icon: settingsIcon,
      title: 'Secondary Link',
      description: 'This card uses a simple text link instead.',
      linkText: 'Learn more →',
      link: '#',
    },
    {
      icon: bookIcon,
      title: 'Just a Title',
      description: 'This card has content but no CTA button or link.',
    },
  ],
};
