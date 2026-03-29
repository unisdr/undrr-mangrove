import { StatsCard } from './StatsCard';

const getCaptionForLocale = locale => {
  switch (locale) {
    case 'arabic':
      return {
        default: {
          title: 'التقدم المحرز في إطار سنداي ٢٠١٥-٢٠٢٣',
          stats: [
            {
              label: 'الهدف أ',
              value: '٤٥٪',
              bottomLabel: 'الحد من الوفيات',
              summary:
                'انخفاض في معدلات الوفيات الناجمة عن الكوارث على مستوى العالم.',
            },
            {
              label: 'الهدف ب',
              value: '٢.٣ مليون',
              bottomLabel: 'المتضررون',
              summary: 'انخفاض في عدد المتضررين لكل ١٠٠,٠٠٠ نسمة.',
            },
            {
              label: 'الهدف ج',
              value: '١٢٠ مليار$',
              bottomLabel: 'الخسائر الاقتصادية',
              summary:
                'انخفاض في الخسائر الاقتصادية المباشرة نسبة إلى الناتج المحلي الإجمالي.',
            },
          ],
        },
        withIcons: {
          title: 'إحصائيات الكوارث ٢٠٢٣',
          stats: [
            {
              icon: 'mg-icon mg-icon-lightbulb',
              value: '٣٨٧',
              bottomLabel: 'الكوارث الطبيعية',
              summary: 'الأحداث المسجلة في جميع أنحاء العالم في عام ٢٠٢٣.',
            },
            {
              icon: 'mg-icon mg-icon-user',
              value: '٨٦.٣ مليون',
              bottomLabel: 'المتضررون',
              summary: 'الأفراد المتأثرون بالكوارث.',
            },
            {
              icon: 'mg-icon mg-icon-chart-bar',
              value: '٢٢٣ مليار$',
              bottomLabel: 'الخسائر الاقتصادية',
              summary: 'إجمالي الأضرار المقدرة عالميًا.',
            },
            {
              icon: 'mg-icon mg-icon-globe',
              value: '١١٨',
              bottomLabel: 'الدول المتضررة',
              summary: 'الدول التي أبلغت عن أحداث كوارث.',
            },
          ],
        },
        compact: {
          title: 'إحصائيات سريعة',
          stats: [
            { value: '١٩٣', bottomLabel: 'الدول الأعضاء' },
            { value: '+١٬٥٠٠', bottomLabel: 'المدن في MCR2030' },
            { value: '٢٢٣ مليار$', bottomLabel: 'خسائر ٢٠٢٣' },
          ],
        },
        highlighted: {
          title: 'الإنجازات الرئيسية',
          stats: [
            {
              label: 'الأولوية ١',
              value: '٨٩',
              bottomLabel: 'دولة لديها استراتيجيات للحد من مخاطر الكوارث',
              summary: 'استراتيجيات وطنية متوافقة مع إطار سنداي.',
            },
            {
              label: 'الأولوية ٢',
              value: '٤٥٪',
              bottomLabel: 'تغطية تقييم المخاطر',
              summary: 'السكان المشمولون بأنظمة الإنذار المبكر متعددة الأخطار.',
            },
          ],
        },
        linked: {
          title: 'بطاقات إحصائية قابلة للنقر',
          stats: [
            {
              icon: 'mg-icon mg-icon-building',
              value: '+١٬٥٠٠',
              bottomLabel: 'المدن المسجلة',
              summary: 'انقر في أي مكان على هذه البطاقة لعرض جميع المدن.',
              link: 'https://mcr2030.undrr.org/cities',
            },
            {
              icon: 'mg-icon fa-handshake',
              value: '١٢٠+',
              bottomLabel: 'المنظمات الشريكة',
              summary: 'دعم التنفيذ في جميع أنحاء العالم.',
              link: 'https://mcr2030.undrr.org/partners',
            },
            {
              icon: 'mg-icon fa-map',
              value: '٥',
              summary: 'خارطة طريق منظمة لمراحل المرونة للمدن.',
              link: 'https://mcr2030.undrr.org/roadmap',
            },
          ],
        },
      };
    default:
      return {
        default: {
          title: 'Sendai Framework Progress 2015-2023',
          stats: [
            {
              label: 'Target A',
              value: '45%',
              bottomLabel: 'Mortality reduction',
              summary: 'Decrease in disaster mortality rates globally.',
            },
            {
              label: 'Target B',
              value: '2.3M',
              bottomLabel: 'People affected',
              summary:
                'Reduction in <a href="https://www.undrr.org/terminology/affected">number of affected people</a> per 100,000.',
            },
            {
              label: 'Target C',
              value: '$120B',
              bottomLabel: 'Economic losses',
              summary: 'Reduction in direct economic loss relative to GDP.',
            },
          ],
        },
        withIcons: {
          title: 'Disaster Statistics 2023',
          stats: [
            {
              icon: 'mg-icon mg-icon-lightbulb',
              value: '387',
              bottomLabel: 'Natural disasters',
              summary: 'Recorded events worldwide in 2023.',
            },
            {
              icon: 'mg-icon mg-icon-user',
              value: '86.3M',
              bottomLabel: 'People affected',
              summary: 'Individuals impacted by disasters.',
            },
            {
              icon: 'mg-icon mg-icon-chart-bar',
              value: '$223B',
              bottomLabel: 'Economic losses',
              summary:
                'Total estimated <a href="https://www.undrr.org/gar">damages globally</a>.',
              link: 'https://www.undrr.org/gar',
            },
            {
              icon: 'mg-icon mg-icon-globe',
              value: '118',
              bottomLabel: 'Countries affected',
              summary: 'Nations reporting disaster events.',
            },
          ],
        },
        compact: {
          title: 'Quick Stats',
          stats: [
            { value: '193', bottomLabel: 'Member States' },
            { value: '1,500+', bottomLabel: 'Cities in MCR2030' },
            { value: '$223B', bottomLabel: '2023 Losses' },
          ],
        },
        highlighted: {
          title: 'Key Achievements',
          stats: [
            {
              label: 'Priority 1',
              value: '89',
              bottomLabel: 'Countries with DRR strategies',
              summary: 'National strategies aligned with Sendai Framework.',
            },
            {
              label: 'Priority 2',
              value: '45%',
              bottomLabel: 'Risk assessment coverage',
              summary:
                'Population covered by multi-hazard early warning systems.',
            },
          ],
        },
        linked: {
          title: 'Clickable stat cards',
          stats: [
            {
              icon: 'mg-icon mg-icon-building',
              value: '1,500+',
              bottomLabel: 'Cities enrolled',
              summary: 'Click anywhere on this card to view all cities.',
              link: 'https://mcr2030.undrr.org/cities',
            },
            {
              icon: 'mg-icon fa-handshake',
              value: '120+',
              bottomLabel: 'Partner organizations',
              summary: 'Supporting implementation worldwide.',
              link: 'https://mcr2030.undrr.org/partners',
            },
            {
              icon: 'mg-icon fa-map',
              value: '5',
              summary:
                '<a href="https://mcr2030.undrr.org/roadmap">The roadmap</a> guides cities through resilience stages.',
              link: 'https://mcr2030.undrr.org/roadmap-overview',
            },
          ],
        },
      };
  }
};

export default {
  title: 'Components/Cards/Stats card',
  component: StatsCard,
  argTypes: {
    variant: {
      options: ['default', 'compact', 'highlighted', 'negative'],
      control: { type: 'inline-radio' },
      defaultValue: 'default',
    },
  },
  decorators: [
    (Story, context) => {
      const isRtl = context.globals.locale === 'arabic';
      return (
        <div dir={isRtl ? 'rtl' : 'ltr'} lang={isRtl ? 'ar' : 'en'}>
          <Story />
        </div>
      );
    },
  ],
};

// Default - shows dual labels with three stats
export const Default = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <StatsCard
        title={caption.default.title}
        stats={caption.default.stats}
        {...args}
      />
    );
  },
};

// With icons
export const WithIcons = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <StatsCard
        title={caption.withIcons.title}
        stats={caption.withIcons.stats}
        {...args}
      />
    );
  },
};

// Compact variant
export const Compact = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <StatsCard
        title={caption.compact.title}
        variant="compact"
        stats={caption.compact.stats}
        {...args}
      />
    );
  },
};

// Highlighted variant
export const Highlighted = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <StatsCard
        title={caption.highlighted.title}
        variant="highlighted"
        stats={caption.highlighted.stats}
        {...args}
      />
    );
  },
};

// Negative variant (for dark backgrounds)
export const Negative = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <StatsCard
        title={caption.withIcons.title}
        variant="negative"
        stats={caption.withIcons.stats}
        {...args}
      />
    );
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

// Linked stats - entire card is clickable
export const Linked = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <StatsCard
        title={caption.linked.title}
        stats={caption.linked.stats}
        {...args}
      />
    );
  },
};
