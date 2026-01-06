import { StatsCard } from './StatsCard';

const getCaptionForLocale = locale => {
  switch (locale) {
    case 'arabic':
      return {
        default: {
          title: 'التقدم المحرز في إطار سنداي ٢٠١٥-٢٠٢٣',
          stats: [
            {
              topLabel: 'الهدف أ',
              value: '٤٥٪',
              bottomLabel: 'الحد من الوفيات',
              description:
                'انخفاض في معدلات الوفيات الناجمة عن الكوارث على مستوى العالم.',
            },
            {
              topLabel: 'الهدف ب',
              value: '٢.٣ مليون',
              bottomLabel: 'المتضررون',
              description: 'انخفاض في عدد المتضررين لكل ١٠٠,٠٠٠ نسمة.',
            },
            {
              topLabel: 'الهدف ج',
              value: '١٢٠ مليار$',
              bottomLabel: 'الخسائر الاقتصادية',
              description:
                'انخفاض في الخسائر الاقتصادية المباشرة نسبة إلى الناتج المحلي الإجمالي.',
            },
          ],
        },
        withIcons: {
          title: 'إحصائيات الكوارث ٢٠٢٣',
          stats: [
            {
              icon: 'mg-icon fa-lightbulb',
              value: '٣٨٧',
              bottomLabel: 'الكوارث الطبيعية',
              description: 'الأحداث المسجلة في جميع أنحاء العالم في عام ٢٠٢٣.',
            },
            {
              icon: 'mg-icon fa-user',
              value: '٨٦.٣ مليون',
              bottomLabel: 'المتضررون',
              description: 'الأفراد المتأثرون بالكوارث.',
            },
            {
              icon: 'mg-icon fa-chart-bar',
              value: '٢٢٣ مليار$',
              bottomLabel: 'الخسائر الاقتصادية',
              description: 'إجمالي الأضرار المقدرة عالميًا.',
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
              topLabel: 'الأولوية ١',
              value: '٨٩',
              bottomLabel: 'دولة لديها استراتيجيات للحد من مخاطر الكوارث',
              description: 'استراتيجيات وطنية متوافقة مع إطار سنداي.',
            },
            {
              topLabel: 'الأولوية ٢',
              value: '٤٥٪',
              bottomLabel: 'تغطية تقييم المخاطر',
              description:
                'السكان المشمولون بأنظمة الإنذار المبكر متعددة الأخطار.',
            },
          ],
        },
        cardLayout: {
          title: 'تقدم MCR2030',
          stats: [
            {
              value: '+١٬٥٠٠',
              bottomLabel: 'المدن المسجلة',
              description: 'الحكومات المحلية الملتزمة بالمرونة.',
            },
            {
              value: '٨٥٪',
              bottomLabel: 'معدل التقدم',
              description: 'المدن التي تحقق تقدمًا ملموسًا في أهداف المرونة.',
            },
            {
              value: '١٢٠+',
              bottomLabel: 'المنظمات الشريكة',
              description: 'دعم التنفيذ وبناء القدرات.',
            },
          ],
        },
        linked: {
          title: 'بطاقات إحصائية قابلة للنقر',
          stats: [
            {
              icon: 'mg-icon fa-building',
              value: '+١٬٥٠٠',
              bottomLabel: 'المدن المسجلة',
              description: 'انقر في أي مكان على هذه البطاقة لعرض جميع المدن.',
              link: 'https://mcr2030.undrr.org/cities',
            },
            {
              icon: 'mg-icon fa-handshake',
              value: '١٢٠+',
              bottomLabel: 'المنظمات الشريكة',
              description: 'دعم التنفيذ في جميع أنحاء العالم.',
              link: 'https://mcr2030.undrr.org/partners',
            },
            {
              icon: 'mg-icon fa-map',
              value: '٥',
              bottomLabel: 'مراحل المرونة',
              description: 'خارطة طريق منظمة للمدن.',
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
              topLabel: 'Target A',
              value: '45%',
              bottomLabel: 'Mortality reduction',
              description: 'Decrease in disaster mortality rates globally.',
            },
            {
              topLabel: 'Target B',
              value: '2.3M',
              bottomLabel: 'People affected',
              description:
                'Reduction in number of affected people per 100,000.',
            },
            {
              topLabel: 'Target C',
              value: '$120B',
              bottomLabel: 'Economic losses',
              description: 'Reduction in direct economic loss relative to GDP.',
            },
          ],
        },
        withIcons: {
          title: 'Disaster Statistics 2023',
          stats: [
            {
              icon: 'mg-icon fa-lightbulb',
              value: '387',
              bottomLabel: 'Natural disasters',
              description: 'Recorded events worldwide in 2023.',
            },
            {
              icon: 'mg-icon fa-user',
              value: '86.3M',
              bottomLabel: 'People affected',
              description: 'Individuals impacted by disasters.',
            },
            {
              icon: 'mg-icon fa-chart-bar',
              value: '$223B',
              bottomLabel: 'Economic losses',
              description: 'Total estimated damages globally.',
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
              topLabel: 'Priority 1',
              value: '89',
              bottomLabel: 'Countries with DRR strategies',
              description: 'National strategies aligned with Sendai Framework.',
            },
            {
              topLabel: 'Priority 2',
              value: '45%',
              bottomLabel: 'Risk assessment coverage',
              description:
                'Population covered by multi-hazard early warning systems.',
            },
          ],
        },
        cardLayout: {
          title: 'MCR2030 Progress',
          stats: [
            {
              value: '1,500+',
              bottomLabel: 'Cities enrolled',
              description: 'Local governments committed to resilience.',
            },
            {
              value: '85%',
              bottomLabel: 'Progress rate',
              description: 'Cities making measurable progress.',
            },
            {
              value: '120+',
              bottomLabel: 'Partner organizations',
              description: 'Supporting implementation and capacity building.',
            },
          ],
        },
        linked: {
          title: 'Clickable stat cards',
          stats: [
            {
              icon: 'mg-icon fa-building',
              value: '1,500+',
              bottomLabel: 'Cities enrolled',
              description: 'Click anywhere on this card to view all cities.',
              link: 'https://mcr2030.undrr.org/cities',
            },
            {
              icon: 'mg-icon fa-handshake',
              value: '120+',
              bottomLabel: 'Partner organizations',
              description: 'Supporting implementation worldwide.',
              link: 'https://mcr2030.undrr.org/partners',
            },
            {
              icon: 'mg-icon fa-map',
              value: '5',
              bottomLabel: 'Resilience stages',
              description: 'Structured roadmap for cities.',
              link: 'https://mcr2030.undrr.org/roadmap',
            },
          ],
        },
      };
  }
};

export default {
  title: 'Components/Stats by numbers',
  component: StatsCard,
  argTypes: {
    variant: {
      options: ['default', 'compact', 'highlighted'],
      control: { type: 'inline-radio' },
      defaultValue: 'default',
    },
    layout: {
      options: ['grid', 'card'],
      control: { type: 'inline-radio' },
      defaultValue: 'grid',
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

// Card layout - all stats grouped in one card
export const CardLayout = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <StatsCard
        title={caption.cardLayout.title}
        layout="card"
        stats={caption.cardLayout.stats}
        {...args}
      />
    );
  },
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
