import MegaMenu from './MegaMenu';

export default {
  title: 'Components/MegaMenu',
  component: MegaMenu,
  parameters: {
    layout: 'fullscreen',
  },
};

const sections = [
  {
    title: 'Knowledge Hub',
    bannerHeading: 'Knowledge Hub',
    bannerDescription:
      "<p>Access resources and <strong>insights</strong> on <a href='/knowledge-hub'>disaster risk reduction</a>.</p>",
    items: [
      {
        title: 'Publications',
        url: '/knowledge-hub/publications',
        items: [
          {
            title: 'Global Assessment Report',
            url: '/knowledge-hub/publications/global-assessment-report',
          },
          {
            title: 'Policy Briefs',
            url: '/knowledge-hub/publications/policy-briefs',
            items: [
              {
                title: 'Words into Action Guidelines',
                url: '/knowledge-hub/publications/words-into-action',
              },
              {
                title: 'Annual Reports',
                url: '/knowledge-hub/publications/annual-reports',
              },
            ],
          },
          {
            title: 'Technical Reports',
            url: '/knowledge-hub/publications/technical-reports',
          },
          {
            title: 'Case Studies',
            url: '/knowledge-hub/publications/case-studies',
          },
          {
            title: 'Research Papers',
            url: '/knowledge-hub/publications/research-papers',
          },
          {
            title: 'Best Practices',
            url: '/knowledge-hub/publications/best-practices',
          },
          {
            title: 'Working Papers',
            url: '/knowledge-hub/publications/working-papers',
            items: [
              {
                title: 'Words into Action Guidelines',
                url: '/knowledge-hub/publications/words-into-action',
              },
              {
                title: 'Annual Reports',
                url: '/knowledge-hub/publications/annual-reports',
              },
            ],
          },
          {
            title: 'Country Reports',
            url: '/knowledge-hub/publications/country-reports',
          },
          {
            title: 'Regional Assessments',
            url: '/knowledge-hub/publications/regional-assessments',
          },
          {
            title: 'Special Reports',
            url: '/knowledge-hub/publications/special-reports',
          },
          {
            title: 'Methodology Guides',
            url: '/knowledge-hub/publications/methodology-guides',
          },
          {
            title: 'Conference Proceedings',
            url: '/knowledge-hub/publications/conference-proceedings',
          },
          {
            title: 'Training Materials',
            url: '/knowledge-hub/publications/training-materials',
          },
          {
            title: 'Impact Studies',
            url: '/knowledge-hub/publications/impact-studies',
          },
          {
            title: 'Risk Analysis Reports',
            url: '/knowledge-hub/publications/risk-analysis',
            items: [
              {
                title: 'Words into Action Guidelines',
                url: '/knowledge-hub/publications/words-into-action',
              },
              {
                title: 'Annual Reports',
                url: '/knowledge-hub/publications/annual-reports',
              },
            ],
          },
          {
            title: 'Statistical Yearbooks',
            url: '/knowledge-hub/publications/statistical-yearbooks',
          },
          {
            title: 'Policy Frameworks',
            url: '/knowledge-hub/publications/policy-frameworks',
          },
        ],
      },
      {
        title: 'Risk Information',
        url: '/knowledge-hub/risk-information',
        items: [
          {
            title: 'PreventionWeb',
            url: 'https://www.preventionweb.net',
          },
          {
            title: 'Disaster Data & Statistics',
            url: '/knowledge-hub/disaster-data',
            items: [
              {
                title: 'DesInventar Sendai',
                url: 'https://www.desinventar.net',
              },
              {
                title: 'Sendai Framework Monitor',
                url: 'https://sendaimonitor.undrr.org',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    title: 'About Us',
    bannerHeading: 'About Us',
    bannerDescription:
      'UNDRR helps decision makers across the globe better understand and change their attitude to risk.',
    bannerButton: {
      label: 'Learn More About Us',
      url: '/about',
    },
    items: [
      {
        title: 'Our Mission',
        url: '/about/mission',
        items: [
          {
            title: 'Vision & Values',
            url: '/about/mission/vision',
          },
          {
            title: 'Strategic Plan',
            url: '/about/mission/strategic-plan',
            items: [
              {
                title: 'Current Initiatives',
                url: '/about/mission/initiatives',
              },
              {
                title: 'Success Stories',
                url: '/about/mission/success-stories',
              },
            ],
          },
        ],
      },
      {
        title: 'Our Team',
        url: '/about/team',
        items: [
          {
            title: 'Leadership',
            url: '/about/team/leadership',
          },
          {
            title: 'Regional Offices',
            url: '/about/team/regional-offices',
            items: [
              {
                title: 'Global Network',
                url: '/about/team/network',
              },
              {
                title: 'Partners',
                url: '/about/team/partners',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    title: 'News & Events',
    bannerHeading: 'News & Events',
    bannerDescription:
      "Stay updated with our latest news, press releases, blog posts and upcoming events. Find out what's happening in our community and join us at our next gathering.",
    bannerButton: {
      label: 'View All News',
      url: '/news-and-events',
    },
    items: [
      {
        title: 'Latest News',
        url: '/news',
      },
      {
        title: 'Press Releases',
        url: '/news/press-releases',
      },
      {
        title: 'Blog Posts',
        url: '/news/blog',
      },
      {
        title: 'Media Coverage',
        url: '/news/media',
      },
      {
        title: 'Events Calendar',
        url: '/events',
      },
      {
        title: 'Upcoming Conferences',
        url: '/events/conferences',
      },
      {
        title: 'Workshops',
        url: '/events/workshops',
      },
      {
        title: 'Webinars',
        url: '/events/webinars',
      },
    ],
  },
  {
    title: 'Directory',
    bannerButton: {
      url: '/directory',
    },
    items: [
      {
        title: 'Latest News',
        url: '/news',
      },
      {
        title: 'Press Releases',
        url: '/news/press-releases',
      },
      {
        title: 'Blog Posts',
        url: '/news/blog',
      },
      {
        title: 'Media Coverage',
        url: '/news/media',
      },
      {
        title: 'Events Calendar',
        url: '/events',
      },
      {
        title: 'Upcoming Conferences',
        url: '/events/conferences',
      },
      {
        title: 'Workshops',
        url: '/events/workshops',
      },
      {
        title: 'Webinars',
        url: '/events/webinars',
      },
    ],
  },
  {
    title: 'Search',
    bannerButton: {
      url: '/search',
    },
  },
  {
    title: 'Promo box',
    bannerDescription: `<div style="padding: 1rem; background: pink; flex: 1; height: 100%;"><h2>Hello world</h2><p>I'm a bunch of rich text call to action</p><a href="#" class="mg-button mg-button-primary">Click me</a></div>`,
  },
];

export const Default = {
  render: (args, { globals: { locale } }) => {
    return <MegaMenu {...args} />;
  },

  args: {
    delay: 5000,
    sections: sections,
  },
};

export const WithCustomDelay = {
  args: {
    delay: 800000,
    sections: sections,
  },
};

export const RTL = {
  render: args => (
    <div dir="rtl">
      <MegaMenu {...args} />
    </div>
  ),
  args: {
    delay: 5000,
    sections: sections,
  },
  parameters: {
    docs: {
      description: {
        story:
          'MegaMenu with RTL (Right-to-Left) support. The menu layout, chevrons, borders, and sidebar positions are automatically flipped for RTL languages.',
      },
    },
  },
};

const brandLogos = {
  PreventionWeb: {
    logoSrc: 'https://assets.undrr.org/static/logos/pw/pw-logo.svg',
    logoAlt: 'PreventionWeb',
  },
  IRP: {
    logoSrc: 'https://assets.undrr.org/static/logos/irp/irp-logo.svg',
    logoAlt: 'International Recovery Platform',
  },
  MCR2030: {
    logoSrc:
      'https://mcr2030.undrr.org/sites/default/files/2020-10/MCR---Main-Logo---Color.png',
    logoAlt: 'Making Cities Resilient 2030',
  },
  'Global Platform 2025': {
    logoSrc:
      'https://assets.undrr.org/static/logos/gp/2025/GP_2025_logo_web.svg',
    logoAlt: 'Global Platform for Disaster Risk Reduction 2025',
  },
};

const brandArgType = {
  brand: {
    control: 'select',
    options: Object.keys(brandLogos),
    description: 'Sub-brand logo to display',
  },
};

export const WithLogo = {
  render: ({ brand, ...args }) => <MegaMenu {...args} {...brandLogos[brand]} />,
  args: {
    delay: 5000,
    sections: sections,
    brand: 'PreventionWeb',
  },
  argTypes: brandArgType,
  parameters: {
    docs: {
      description: {
        story:
          'Logo sits inline with the nav items. Pick a different sub-brand from the **brand** control to see how each logo fits.',
      },
    },
  },
};
