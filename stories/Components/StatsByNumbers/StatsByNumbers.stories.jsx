import { StatsByNumbers } from './StatsByNumbers';

export default {
  title: 'Components/Stats By Numbers',
  component: StatsByNumbers,
  argTypes: {
    variant: {
      options: ['default', 'compact', 'highlighted'],
      control: {
        type: 'inline-radio',
      },
      defaultValue: 'default',
    },
    layout: {
      options: ['grid', 'card'],
      control: {
        type: 'inline-radio',
      },
      defaultValue: 'grid',
    },
  },
};

// Single stat
export const SingleStat = {
  args: {
    title: 'Global Impact',
    buttonLabel: 'Learn more',
    buttonUrl: '#',
    stats: [
      {
        icon: 'mg-icon fa-globe',
        topLabel: 'Countries',
        value: '193',
        bottomLabel: 'Member States',
        description: 'Countries participating in disaster risk reduction efforts worldwide.',
      },
    ],
  },
  name: 'Single Stat',
};

// Two stats
export const TwoStats = {
  args: {
    title: 'MCR2030 Progress',
    buttonLabel: 'View dashboard',
    buttonUrl: '#',
    stats: [
      {
        value: '1,500+',
        bottomLabel: 'Cities enrolled',
        description: 'Local governments committed to resilience.',
        descriptionLink: {
          text: 'Join MCR2030',
          url: 'https://mcr2030.undrr.org',
        },
      },
      {
        value: '85%',
        bottomLabel: 'Progress rate',
        description: 'Cities making measurable progress on resilience targets.',
      },
    ],
  },
  name: 'Two Stats',
};

// Three stats
export const ThreeStats = {
  args: {
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
        description: 'Reduction in number of affected people per 100,000.',
      },
      {
        topLabel: 'Target C',
        value: '$120B',
        bottomLabel: 'Economic losses',
        description: 'Reduction in direct economic loss relative to GDP.',
      },
    ],
  },
  name: 'Three Stats',
};

// With icons
export const WithIcons = {
  args: {
    title: 'Disaster Statistics 2023',
    buttonLabel: 'Full report',
    buttonUrl: '#',
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
  name: 'With Icons',
};

// Dual labels
export const DualLabels = {
  args: {
    stats: [
      {
        topLabel: 'Sendai Target A',
        value: '45%',
        bottomLabel: 'Substantial reduction achieved',
        description: 'Global disaster mortality substantially reduced compared to 2005-2015.',
      },
      {
        topLabel: 'Sendai Target D',
        value: '$120B',
        bottomLabel: 'Infrastructure losses prevented',
        description: 'Damage to critical infrastructure and disruption of basic services reduced.',
      },
      {
        topLabel: 'Sendai Target G',
        value: '89',
        bottomLabel: 'Countries with DRR strategies',
        description: 'National and local disaster risk reduction strategies adopted.',
      },
    ],
  },
  name: 'Dual Labels',
};

// With description links (MCR2030 use case)
export const WithDescriptionLinks = {
  args: {
    title: 'Making Cities Resilient 2030',
    buttonLabel: 'Explore MCR2030',
    buttonUrl: 'https://mcr2030.undrr.org',
    stats: [
      {
        value: '1,500+',
        bottomLabel: 'Enrolled cities',
        description: 'Cities committed to building urban resilience.',
        descriptionLink: {
          text: 'View city list',
          url: 'https://mcr2030.undrr.org/cities',
        },
      },
      {
        value: '120+',
        bottomLabel: 'Partner organizations',
        description: 'Supporting implementation and capacity building.',
        descriptionLink: {
          text: 'Become a partner',
          url: 'https://mcr2030.undrr.org/partners',
        },
      },
      {
        value: '5',
        bottomLabel: 'Resilience stages',
        description: 'Roadmap for cities to assess and improve resilience.',
        descriptionLink: {
          text: 'Learn about stages',
          url: 'https://mcr2030.undrr.org/roadmap',
        },
      },
    ],
  },
  name: 'With Description Links (MCR2030)',
};

// Compact variant
export const CompactVariant = {
  args: {
    title: 'Quick Stats',
    variant: 'compact',
    stats: [
      {
        value: '193',
        bottomLabel: 'Member States',
      },
      {
        value: '1,500+',
        bottomLabel: 'Cities in MCR2030',
      },
      {
        value: '$223B',
        bottomLabel: '2023 Losses',
      },
    ],
  },
  name: 'Compact Variant',
};

// Highlighted variant
export const HighlightedVariant = {
  args: {
    title: 'Key Achievements',
    variant: 'highlighted',
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
        description: 'Population covered by multi-hazard early warning systems.',
      },
    ],
  },
  name: 'Highlighted Variant',
};

// Minimal - no title, button at bottom
export const MinimalLayout = {
  args: {
    buttonLabel: 'See full statistics',
    buttonUrl: '#',
    stats: [
      {
        value: '387',
        bottomLabel: 'Natural disasters in 2023',
      },
      {
        value: '86.3M',
        bottomLabel: 'People affected',
      },
    ],
  },
  name: 'Minimal Layout',
};

// Single stat with all features
export const CompleteExample = {
  args: {
    title: 'MCR2030 Impact',
    buttonLabel: 'Join the initiative',
    buttonUrl: 'https://mcr2030.undrr.org',
    stats: [
      {
        icon: 'mg-icon fa-building',
        topLabel: 'Global Initiative',
        value: '1,500+',
        bottomLabel: 'Cities building resilience',
        description: 'Local governments committed to the Making Cities Resilient campaign.',
        descriptionLink: {
          text: 'Explore participating cities',
          url: 'https://mcr2030.undrr.org/cities',
        },
      },
    ],
  },
  name: 'Complete Example',
};

// Card Layout - Two stats in one card
export const CardLayoutTwo = {
  args: {
    title: 'MCR2030 Progress',
    layout: 'card',
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
    ],
  },
  name: 'Card Layout - Two Stats',
};

// Card Layout - Three stats in one card
export const CardLayoutThree = {
  args: {
    title: 'Sendai Framework Progress',
    layout: 'card',
    stats: [
      {
        topLabel: 'Target A',
        value: '45%',
        bottomLabel: 'Mortality reduction',
        description: 'Decrease in disaster mortality rates.',
      },
      {
        topLabel: 'Target B',
        value: '2.3M',
        bottomLabel: 'People affected',
        description: 'Reduction in affected people per 100,000.',
      },
      {
        topLabel: 'Target C',
        value: '$120B',
        bottomLabel: 'Economic losses',
        description: 'Reduction in direct economic loss.',
      },
    ],
  },
  name: 'Card Layout - Three Stats',
};

// Card Layout - Four stats (will wrap)
export const CardLayoutFour = {
  args: {
    title: 'Global Disaster Statistics 2023',
    buttonLabel: 'View full report',
    buttonUrl: '#',
    layout: 'card',
    stats: [
      {
        value: '387',
        bottomLabel: 'Natural disasters',
      },
      {
        value: '86.3M',
        bottomLabel: 'People affected',
      },
      {
        value: '$223B',
        bottomLabel: 'Economic losses',
      },
      {
        value: '193',
        bottomLabel: 'Countries impacted',
      },
    ],
  },
  name: 'Card Layout - Four Stats (Wrapping)',
};

// Card Layout with icons
export const CardLayoutWithIcons = {
  args: {
    title: 'Disaster Statistics 2023',
    buttonLabel: 'Full report',
    buttonUrl: '#',
    layout: 'card',
    stats: [
      {
        icon: 'mg-icon fa-lightbulb',
        value: '387',
        bottomLabel: 'Natural disasters',
        description: 'Recorded events worldwide.',
      },
      {
        icon: 'mg-icon fa-user',
        value: '86.3M',
        bottomLabel: 'People affected',
        description: 'Individuals impacted.',
      },
      {
        icon: 'mg-icon fa-chart-bar',
        value: '$223B',
        bottomLabel: 'Economic losses',
        description: 'Total estimated damages.',
      },
    ],
  },
  name: 'Card Layout - With Icons',
};
