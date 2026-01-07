import { IconCard } from './IconCard';

// Content translations for locale-aware stories
const translations = {
  english: {
    components: {
      title: 'Components',
      summaryText:
        'Browse all UNDRR components with UX, accessibility, and implementation guidance.',
      linkText: 'Browse components →',
    },
    configuration: {
      title: 'Configuration',
      summaryText:
        'Learn how to configure and customize components to match your design requirements.',
      linkText: 'View settings →',
    },
    documentation: {
      title: 'Documentation',
      summaryText:
        'Access comprehensive documentation with examples and best practices.',
      linkText: 'Read docs →',
    },
    getStarted: {
      title: 'Get started',
      summaryText:
        'Quick start guide to help you begin using the component library.',
      button: 'Start now',
    },
    learnMore: {
      title: 'Learn more',
      summaryText:
        'Dive deep into advanced features and customization options.',
      button: 'Explore',
    },
    latestFeatures: {
      label: 'NEW',
      title: 'Latest features',
      summaryText:
        'Check out the newest components and improvements to the library.',
      button: 'View features',
    },
    enhanced: {
      label: 'UPDATED',
      title: 'Enhanced performance',
      summaryText: 'Performance improvements and bug fixes in this release.',
      button: 'Learn more',
    },
  },
  arabic: {
    components: {
      title: 'المكونات',
      summaryText:
        'تصفح جميع مكونات UNDRR مع إرشادات تجربة المستخدم وإمكانية الوصول والتنفيذ.',
      linkText: '← تصفح المكونات',
    },
    configuration: {
      title: 'الإعدادات',
      summaryText:
        'تعرف على كيفية تكوين المكونات وتخصيصها لتتوافق مع متطلبات التصميم الخاصة بك.',
      linkText: '← عرض الإعدادات',
    },
    documentation: {
      title: 'التوثيق',
      summaryText: 'الوصول إلى وثائق شاملة مع أمثلة وأفضل الممارسات.',
      linkText: '← اقرأ الوثائق',
    },
    getStarted: {
      title: 'ابدأ الآن',
      summaryText: 'دليل البدء السريع لمساعدتك على البدء في استخدام المكتبة.',
      button: 'ابدأ الآن',
    },
    learnMore: {
      title: 'اعرف المزيد',
      summaryText: 'تعمق في الميزات المتقدمة وخيارات التخصيص.',
      button: 'استكشف',
    },
    latestFeatures: {
      label: 'جديد',
      title: 'أحدث الميزات',
      summaryText: 'اطلع على أحدث المكونات والتحسينات في المكتبة.',
      button: 'عرض الميزات',
    },
    enhanced: {
      label: 'محدث',
      title: 'أداء محسن',
      summaryText: 'تحسينات الأداء وإصلاحات الأخطاء في هذا الإصدار.',
      button: 'اعرف المزيد',
    },
  },
};

// Helper to get translations based on locale
const getContent = locale => translations[locale] || translations.english;

// Sample SVG icons
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

export default {
  title: 'Components/Cards/Icon card',
  component: IconCard,
  parameters: {
    docs: {
      description: {
        component:
          'Icon Card is a flexible card variant featuring an icon or image, followed by content and a call-to-action. RTL layout is automatic when you select Arabic in the locale toolbar.',
      },
    },
  },
  argTypes: {
    centered: {
      control: 'boolean',
      description: 'Center-align content',
      defaultValue: false,
    },
  },
};

// Default - Left aligned with text links (locale-aware)
export const Default = {
  render: (args, { globals: { locale } }) => {
    const content = getContent(locale);
    return (
      <IconCard
        {...args}
        data={[
          {
            icon: componentIcon,
            title: content.components.title,
            summaryText: content.components.summaryText,
            linkText: content.components.linkText,
            link: '#',
          },
          {
            icon: settingsIcon,
            title: content.configuration.title,
            summaryText: content.configuration.summaryText,
            linkText: content.configuration.linkText,
            link: '#',
          },
          {
            icon: bookIcon,
            title: content.documentation.title,
            summaryText: content.documentation.summaryText,
            linkText: content.documentation.linkText,
            link: '#',
          },
        ]}
      />
    );
  },
  args: {
    centered: false,
  },
};

// Centered alignment with buttons (locale-aware)
export const Centered = {
  render: (args, { globals: { locale } }) => {
    const content = getContent(locale);
    return (
      <IconCard
        {...args}
        data={[
          {
            icon: componentIcon,
            title: content.getStarted.title,
            summaryText: content.getStarted.summaryText,
            button: content.getStarted.button,
            buttonType: 'Primary',
            link: '#',
          },
          {
            icon: settingsIcon,
            title: content.learnMore.title,
            summaryText: content.learnMore.summaryText,
            button: content.learnMore.button,
            buttonType: 'Secondary',
            link: '#',
          },
        ]}
      />
    );
  },
  args: {
    centered: true,
  },
};

// With labels/badges (locale-aware)
export const WithLabels = {
  render: (args, { globals: { locale } }) => {
    const content = getContent(locale);
    return (
      <IconCard
        {...args}
        data={[
          {
            icon: componentIcon,
            label: content.latestFeatures.label,
            title: content.latestFeatures.title,
            summaryText: content.latestFeatures.summaryText,
            button: content.latestFeatures.button,
            link: '#',
          },
          {
            icon: settingsIcon,
            label: content.enhanced.label,
            title: content.enhanced.title,
            summaryText: content.enhanced.summaryText,
            button: content.enhanced.button,
            link: '#',
          },
        ]}
      />
    );
  },
  args: {
    centered: false,
  },
};

// Grid layout example (locale-aware)
export const GridLayout = {
  render: (args, { globals: { locale } }) => {
    const content = getContent(locale);
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem',
        }}
      >
        <IconCard
          centered
          data={[
            {
              icon: componentIcon,
              title: content.components.title,
              summaryText: content.components.summaryText,
              linkText: content.components.linkText,
              link: '#',
            },
          ]}
        />
        <IconCard
          centered
          data={[
            {
              icon: settingsIcon,
              title: content.configuration.title,
              summaryText: content.configuration.summaryText,
              linkText: content.configuration.linkText,
              link: '#',
            },
          ]}
        />
        <IconCard
          centered
          data={[
            {
              icon: bookIcon,
              title: content.documentation.title,
              summaryText: content.documentation.summaryText,
              linkText: content.documentation.linkText,
              link: '#',
            },
          ]}
        />
      </div>
    );
  },
};

// Mixed content - demonstrating different CTA options
export const MixedContent = {
  render: (args, { globals: { locale } }) => {
    const content = getContent(locale);
    return (
      <IconCard
        {...args}
        data={[
          {
            icon: componentIcon,
            title: content.getStarted.title,
            summaryText: content.getStarted.summaryText,
            button: content.getStarted.button,
            buttonType: 'Primary',
            link: '#',
          },
          {
            icon: settingsIcon,
            title: content.configuration.title,
            summaryText: content.configuration.summaryText,
            linkText: content.configuration.linkText,
            link: '#',
          },
          {
            icon: bookIcon,
            title: content.documentation.title,
            summaryText: content.documentation.summaryText,
          },
        ]}
      />
    );
  },
  args: {
    centered: false,
  },
};

// With image instead of icon
export const WithImage = {
  render: args => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '2rem',
      }}
    >
      <IconCard
        {...args}
        data={[
          {
            imgback:
              'https://assets.undrr.org/static/logos/undrr/undrr-logo-square-blue.svg',
            imgalt: 'UNDRR logo',
            iconSize: 96,
            title: 'UNDRR',
            summaryText:
              'The United Nations Office for Disaster Risk Reduction works to reduce disaster losses in lives and assets.',
            linkText: 'Visit UNDRR →',
            link: '#',
          },
        ]}
      />
      <IconCard
        {...args}
        data={[
          {
            imgback: 'https://assets.undrr.org/static/logos/irp/irp-logo.svg',
            imgalt: 'IRP logo',
            iconSize: 96,
            title: 'International Recovery Platform',
            summaryText:
              'IRP promotes the exchange of knowledge on recovery to strengthen disaster risk reduction.',
            linkText: 'Visit IRP →',
            link: '#',
          },
        ]}
      />
      <IconCard
        {...args}
        data={[
          {
            imgback: 'https://assets.undrr.org/static/logos/pw/pw-logo.svg',
            imgalt: 'PreventionWeb logo',
            iconSize: 96,
            title: 'PreventionWeb',
            summaryText:
              'PreventionWeb is the global knowledge platform for disaster risk reduction and resilience.',
            linkText: 'Visit PreventionWeb →',
            link: '#',
          },
        ]}
      />
    </div>
  ),
  args: {
    centered: true,
  },
};
