import { IconCard } from './IconCard';

// Content translations for locale-aware stories
const translations = {
  english: {
    components: {
      title: 'Components',
      summary:
        'Browse all UNDRR components with UX, accessibility, and implementation guidance.',
      linkText: 'Browse components →',
    },
    configuration: {
      title: 'Configuration',
      summary:
        'Learn how to configure and customize components to match your design requirements.',
      linkText: 'View settings →',
    },
    documentation: {
      title: 'Documentation',
      summary:
        'Access comprehensive documentation with examples and best practices.',
      linkText: 'Read docs →',
    },
    getStarted: {
      title: 'Get started',
      summary:
        'Quick start guide to help you begin using the component library.',
      button: 'Start now',
    },
    learnMore: {
      title: 'Learn more',
      summary: 'Dive deep into advanced features and customization options.',
      button: 'Explore',
    },
    latestFeatures: {
      labels: ['New'],
      title: 'Latest features',
      summary:
        'Check out the newest components and improvements to the library.',
      button: 'View features',
    },
    enhanced: {
      labels: ['Updated'],
      title: 'Enhanced performance',
      summary: 'Performance improvements and bug fixes in this release.',
      button: 'Learn more',
    },
  },
  arabic: {
    components: {
      title: 'المكونات',
      summary:
        'تصفح جميع مكونات UNDRR مع إرشادات تجربة المستخدم وإمكانية الوصول والتنفيذ.',
      linkText: '← تصفح المكونات',
    },
    configuration: {
      title: 'الإعدادات',
      summary:
        'تعرف على كيفية تكوين المكونات وتخصيصها لتتوافق مع متطلبات التصميم الخاصة بك.',
      linkText: '← عرض الإعدادات',
    },
    documentation: {
      title: 'التوثيق',
      summary: 'الوصول إلى وثائق شاملة مع أمثلة وأفضل الممارسات.',
      linkText: '← اقرأ الوثائق',
    },
    getStarted: {
      title: 'ابدأ الآن',
      summary: 'دليل البدء السريع لمساعدتك على البدء في استخدام المكتبة.',
      button: 'ابدأ الآن',
    },
    learnMore: {
      title: 'اعرف المزيد',
      summary: 'تعمق في الميزات المتقدمة وخيارات التخصيص.',
      button: 'استكشف',
    },
    latestFeatures: {
      labels: ['جديد'],
      title: 'أحدث الميزات',
      summary: 'اطلع على أحدث المكونات والتحسينات في المكتبة.',
      button: 'عرض الميزات',
    },
    enhanced: {
      labels: ['محدث'],
      title: 'أداء محسن',
      summary: 'تحسينات الأداء وإصلاحات الأخطاء في هذا الإصدار.',
      button: 'اعرف المزيد',
    },
  },
};

// Helper to get translations based on locale
const getContent = locale => translations[locale] || translations.english;

// Icon class names (matches StatsCard approach)
// See stories/Atom/Icons for available icons
const componentIcon = 'mg-icon mg-icon-cubes';
const settingsIcon = 'mg-icon mg-icon-lightbulb';
const bookIcon = 'mg-icon mg-icon-file-alt';

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
    variant: {
      options: ['default', 'negative'],
      control: { type: 'inline-radio' },
      description: 'Visual variant',
      defaultValue: 'default',
    },
  },
};

// Default - Left aligned with text link
export const Default = {
  render: (args, { globals: { locale } }) => {
    const content = getContent(locale);
    return (
      <IconCard
        {...args}
        items={[
          {
            icon: componentIcon,
            imageScale: 'medium',
            title: content.components.title,
            summary: content.components.summary,
            linkText: content.components.linkText,
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

// Centered alignment with button
export const Centered = {
  render: (args, { globals: { locale } }) => {
    const content = getContent(locale);
    return (
      <IconCard
        {...args}
        items={[
          {
            icon: componentIcon,
            imageScale: 'small',
            title: content.getStarted.title,
            summary: content.getStarted.summary,
            button: content.getStarted.button,
            buttonType: 'Primary',
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

// With label/badge
export const WithLabel = {
  render: (args, { globals: { locale } }) => {
    const content = getContent(locale);
    return (
      <IconCard
        {...args}
        items={[
          {
            icon: componentIcon,
            imageScale: 'medium',
            labels: content.latestFeatures.labels,
            title: content.latestFeatures.title,
            summary: content.latestFeatures.summary,
            button: content.latestFeatures.button,
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

// Grid layout example
export const GridLayout = {
  render: (args, { globals: { locale } }) => {
    const content = getContent(locale);
    return (
      <div className="mg-grid mg-grid__col-3">
        <IconCard
          centered
          items={[
            {
              icon: componentIcon,
              imageScale: 'medium',
              title: content.components.title,
              summary: content.components.summary,
              linkText: content.components.linkText,
              link: '#',
            },
          ]}
        />
        <IconCard
          centered
          items={[
            {
              icon: settingsIcon,
              imageScale: 'medium',
              title: content.configuration.title,
              summary: content.configuration.summary,
              linkText: content.configuration.linkText,
              link: '#',
            },
          ]}
        />
        <IconCard
          centered
          items={[
            {
              icon: bookIcon,
              imageScale: 'medium',
              title: content.documentation.title,
              summary: content.documentation.summary,
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
      <div className="mg-grid mg-grid__col-3">
        <IconCard
          {...args}
          items={[
            {
              icon: componentIcon,
              imageScale: 'medium',
              title: content.getStarted.title,
              summary: content.getStarted.summary,
              button: content.getStarted.button,
              buttonType: 'Primary',
              link: '#',
            },
          ]}
        />
        <IconCard
          {...args}
          items={[
            {
              icon: settingsIcon,
              imageScale: 'medium',
              title: content.configuration.title,
              summary: content.configuration.summary,
              linkText: content.configuration.linkText,
              link: '#',
            },
          ]}
        />
        <IconCard
          {...args}
          items={[
            {
              icon: bookIcon,
              imageScale: 'medium',
              title: content.documentation.title,
              summary: content.documentation.summary,
            },
          ]}
        />
      </div>
    );
  },
  args: {
    centered: false,
  },
};

// With logo - title is sr-only for accessibility, logo serves as visual
export const WithLogo = {
  render: args => (
    <div className="mg-grid mg-grid__col-3">
      <IconCard
        {...args}
        items={[
          {
            image: {
              src: 'https://assets.undrr.org/static/logos/undrr/undrr-logo-square-blue.svg',
              alt: 'UNDRR logo',
            },
            imageScale: 'large',
            title: 'UNDRR',
            srOnlyTitle: true,
            summary:
              'The United Nations Office for Disaster Risk Reduction works to reduce disaster losses in lives and assets.',
            link: '#',
          },
        ]}
      />
      <IconCard
        {...args}
        items={[
          {
            image: {
              src: 'https://assets.undrr.org/static/logos/irp/irp-logo.svg',
              alt: 'IRP logo',
            },
            imageScale: 'large',
            title: 'International Recovery Platform',
            srOnlyTitle: true,
            summary:
              'IRP promotes the exchange of knowledge on recovery to strengthen disaster risk reduction.',
            link: '#',
          },
        ]}
      />
      <IconCard
        {...args}
        items={[
          {
            image: {
              src: 'https://assets.undrr.org/static/logos/pw/pw-logo.svg',
              alt: 'PreventionWeb logo',
            },
            imageScale: 'large',
            title: 'PreventionWeb',
            srOnlyTitle: true,
            summary:
              'PreventionWeb is the global knowledge platform for disaster risk reduction and resilience.',
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

// Negative variant (for dark backgrounds)
export const Negative = {
  render: (args, { globals: { locale } }) => {
    const content = getContent(locale);
    return (
      <IconCard
        {...args}
        variant="negative"
        items={[
          {
            icon: componentIcon,
            imageScale: 'medium',
            title: content.components.title,
            summary: content.components.summary,
            linkText: content.components.linkText,
            link: '#',
          },
        ]}
      />
    );
  },
  args: {
    centered: false,
  },
  decorators: [
    Story => (
      <div
        style={{
          backgroundColor: '#1a1a2e',
          padding: '2rem',
          borderRadius: '8px',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

// Real-world examples with actual UNDRR images - using imageScale: 'medium' for consistency
export const RealWorldImages = {
  render: args => (
    <div className="mg-grid mg-grid__col-4">
      <IconCard
        {...args}
        items={[
          {
            image: {
              src: 'https://www.undrr.org/sites/default/files/styles/large_no_crop/public/2021-12/Recovery%20Help%20Desk%20Icon_0.png',
              alt: 'Recovery Help Desk',
            },
            imageScale: 'medium',
            title: 'Recovery Help Desk',
            summary:
              'Access resources and guidance for post-disaster recovery planning.',
            linkText: 'Get support →',
            link: '#',
          },
        ]}
      />
      <IconCard
        {...args}
        items={[
          {
            image: {
              src: 'https://www.undrr.org/sites/default/files/styles/large_no_crop/public/inline-images/e_sdg_icons-15-125.png',
              alt: 'SDG 15 - Life on Land',
            },
            imageScale: 'medium',
            title: 'SDG 15: Life on Land',
            summary:
              'Protect, restore and promote sustainable use of terrestrial ecosystems.',
            linkText: 'Learn more →',
            link: '#',
          },
        ]}
      />
      <IconCard
        {...args}
        items={[
          {
            image: {
              src: 'https://www.undrr.org/sites/default/files/styles/large_no_crop/public/2025-12/partnership_11921003.png',
              alt: 'Partnership',
            },
            imageScale: 'medium',
            title: 'Partnerships',
            summary:
              'Collaborate with organizations worldwide to strengthen resilience.',
            linkText: 'View partners →',
            link: '#',
          },
        ]}
      />
      <IconCard
        {...args}
        items={[
          {
            image: {
              src: 'https://www.undrr.org/sites/default/files/styles/large_no_crop/public/2025-12/earth.png',
              alt: 'Earth',
            },
            imageScale: 'medium',
            title: 'Global Impact',
            summary: 'Disaster risk reduction efforts spanning all continents.',
            linkText: 'Explore →',
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

// Feature cards with colored icon backgrounds (DELTA Resilience pattern)
export const FeatureCards = {
  render: args => (
    <div className="mg-grid mg-grid__col-3">
      <IconCard
        {...args}
        items={[
          {
            icon: 'mg-icon mg-icon-chart-bar',
            iconColor: '#f4b8a8',
            title: 'Analytics',
            summary:
              'From data to decisions - analysis that drives multiple DRR applications, including recovery planning and early warning.',
          },
        ]}
      />
      <IconCard
        {...args}
        items={[
          {
            icon: 'mg-icon mg-icon-globe',
            iconColor: '#f4b8a8',
            title: 'Monitoring',
            summary:
              'Continuous monitoring and tracking of hazardous events and their impacts.',
          },
        ]}
      />
      <IconCard
        {...args}
        items={[
          {
            icon: 'mg-icon mg-icon-file-alt',
            iconColor: '#b5d8d8',
            title: 'Data archiving & integration',
            summary:
              'Preserve, connect and enrich your disaster data leveraging exposure, vulnerability and other relevant baseline information.',
          },
        ]}
      />
      <IconCard
        {...args}
        items={[
          {
            icon: 'mg-icon mg-icon-cubes',
            iconColor: '#b5d8d8',
            title: 'Losses and damages overview',
            summary:
              'Analyze losses and damages data per disaster event, per hazard type, per sector, and per geography.',
          },
        ]}
      />
      <IconCard
        {...args}
        items={[
          {
            icon: 'mg-icon mg-icon-lightbulb',
            iconColor: '#f4b8a8',
            title: 'Multi-sector and multi-level disaster data sharing',
            summary:
              'A tool to support data sharing and application across sectors and levels of government.',
          },
        ]}
      />
      <IconCard
        {...args}
        items={[
          {
            icon: 'mg-icon mg-icon-cubes',
            iconColor: '#c0d8e8',
            title: 'Baseline',
            summary:
              'Exposure & vulnerability statistical and geospatial data enabling post-disaster change and impact analysis.',
          },
        ]}
      />
    </div>
  ),
  args: {
    centered: false,
  },
};

// Mixed: CSS icon classes and images together - using imageScale for consistency
export const MixedIconTypes = {
  render: args => (
    <div className="mg-grid mg-grid__col-3">
      <IconCard
        {...args}
        items={[
          {
            icon: 'mg-icon mg-icon-globe',
            imageScale: 'medium',
            title: 'Global network',
            summary: 'Using a CSS icon class from the Mangrove icon set.',
            linkText: 'View network →',
            link: '#',
          },
        ]}
      />
      <IconCard
        {...args}
        items={[
          {
            image: {
              src: 'https://www.undrr.org/sites/default/files/2025-10/act_icon.svg',
              alt: 'Act icon',
            },
            imageScale: 'medium',
            title: 'Take action',
            summary: 'Using an SVG image URL from the CMS.',
            linkText: 'Act now →',
            link: '#',
          },
        ]}
      />
      <IconCard
        {...args}
        items={[
          {
            image: {
              src: 'https://www.undrr.org/sites/default/files/styles/large_no_crop/public/2025-11/microphone-icon.png',
              alt: 'Microphone',
            },
            imageScale: 'medium',
            title: 'Media resources',
            summary: 'Using a PNG image URL from the CMS.',
            linkText: 'Press center →',
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
