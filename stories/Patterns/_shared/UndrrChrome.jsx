import React from 'react';
import PropTypes from 'prop-types';
import { PageHeader } from '../../Components/PageHeader/PageHeader';
import MegaMenu, {
  DEFAULT_MEGAMENU_LABELS,
} from '../../Components/MegaMenu/MegaMenu';
import { LABELS_AR } from '../../Components/MegaMenu/_labels';

/**
 * The parent-site chrome every UNDRR page carries: the black brand bar and the
 * global navigation strip. Shared by the pattern examples so they all sit in
 * the same context a production page would.
 */
const MENUS = {
  english: [
    {
      title: 'About UNDRR',
      url: 'https://www.undrr.org/about-undrr',
      summary: 'How the office is organized and where it works.',
      items: [
        ['Who we are', 'https://www.undrr.org/about-undrr/who-we-are'],
        ['Our mandate', 'https://www.undrr.org/about-undrr/our-mandate'],
        ['Where we work', 'https://www.undrr.org/about-undrr/where-we-work'],
        ['Contact us', 'https://www.undrr.org/contact-us'],
      ],
    },
    {
      title: 'Our work',
      url: 'https://www.undrr.org/our-work',
      summary: 'The themes and programmes that reduce disaster risk.',
      items: [
        [
          'Understanding disaster risk',
          'https://www.undrr.org/our-work/understanding-disaster-risk',
        ],
        ['Early warning', 'https://www.undrr.org/our-work/early-warnings-all'],
        [
          'Resilient infrastructure',
          'https://www.undrr.org/our-work/resilient-infrastructure',
        ],
        ['Risk governance', 'https://www.undrr.org/our-work/risk-governance'],
      ],
    },
    {
      title: 'Implementing the Sendai Framework',
      url: 'https://www.undrr.org/implementing-sendai-framework',
      summary: 'Guidance, monitoring and national reporting.',
      items: [
        ['Sendai Framework Monitor', 'https://sendaimonitor.undrr.org/'],
        [
          'National platforms',
          'https://www.undrr.org/implementing-sendai-framework/national-platforms',
        ],
        ['Words into Action', 'https://www.undrr.org/words-into-action'],
        [
          'Midterm review',
          'https://www.undrr.org/implementing-sendai-framework/midterm-review',
        ],
      ],
    },
    {
      title: 'News and media',
      url: 'https://www.undrr.org/news',
      summary: 'Announcements, events and published resources.',
      items: [
        ['News', 'https://www.undrr.org/news'],
        ['Events', 'https://www.undrr.org/events'],
        ['Media centre', 'https://www.undrr.org/media-centre'],
        ['Publications', 'https://www.undrr.org/publications'],
      ],
    },
  ],
  arabic: [
    {
      title: 'عن المكتب',
      url: 'https://www.undrr.org/ar/about-undrr',
      summary: 'كيف يعمل المكتب وأين يعمل.',
      items: [
        ['من نحن', 'https://www.undrr.org/ar/about-undrr/who-we-are'],
        ['ولايتنا', 'https://www.undrr.org/ar/about-undrr/our-mandate'],
        ['أين نعمل', 'https://www.undrr.org/ar/about-undrr/where-we-work'],
        ['اتصل بنا', 'https://www.undrr.org/ar/contact-us'],
      ],
    },
    {
      title: 'عملنا',
      url: 'https://www.undrr.org/ar/our-work',
      summary: 'المجالات والبرامج التي تحد من مخاطر الكوارث.',
      items: [
        [
          'فهم مخاطر الكوارث',
          'https://www.undrr.org/ar/our-work/understanding-disaster-risk',
        ],
        [
          'الإنذار المبكر',
          'https://www.undrr.org/ar/our-work/early-warnings-all',
        ],
        [
          'البنية التحتية القادرة على الصمود',
          'https://www.undrr.org/ar/our-work/resilient-infrastructure',
        ],
        ['حوكمة المخاطر', 'https://www.undrr.org/ar/our-work/risk-governance'],
      ],
    },
    {
      title: 'تنفيذ إطار سنداي',
      url: 'https://www.undrr.org/ar/implementing-sendai-framework',
      summary: 'الإرشادات والرصد وإعداد التقارير الوطنية.',
      items: [
        ['مرصد إطار سنداي', 'https://sendaimonitor.undrr.org/'],
        [
          'المنصات الوطنية',
          'https://www.undrr.org/ar/implementing-sendai-framework/national-platforms',
        ],
        [
          'تحويل الكلمات إلى أفعال',
          'https://www.undrr.org/ar/words-into-action',
        ],
        [
          'استعراض منتصف المدة',
          'https://www.undrr.org/ar/implementing-sendai-framework/midterm-review',
        ],
      ],
    },
    {
      title: 'الأخبار ووسائل الإعلام',
      url: 'https://www.undrr.org/ar/news',
      summary: 'الإعلانات والفعاليات والموارد المنشورة.',
      items: [
        ['الأخبار', 'https://www.undrr.org/ar/news'],
        ['الفعاليات', 'https://www.undrr.org/ar/events'],
        ['المركز الإعلامي', 'https://www.undrr.org/ar/media-centre'],
        ['المنشورات', 'https://www.undrr.org/ar/publications'],
      ],
    },
  ],
};

const WORDS = {
  english: { home: 'UNDRR home', nav: 'UNDRR navigation' },
  arabic: {
    home: 'الصفحة الرئيسية للمكتب',
    nav: 'التنقل في موقع المكتب',
  },
};

/** Shapes the demo menu data into the sections MegaMenu expects. */
export function globalSections(locale) {
  const menu = MENUS[locale] || MENUS.english;
  return menu.map(section => ({
    title: section.title,
    bannerHeading: section.title,
    bannerDescription: `<p>${section.summary}</p>`,
    bannerButton: { label: section.title, url: section.url },
    items: section.items.map(([title, url]) => ({ title, url })),
  }));
}

export function UndrrChrome({ locale = 'english', id }) {
  const arabic = locale === 'arabic';
  const words = WORDS[locale] || WORDS.english;
  return (
    <>
      <PageHeader
        id={id}
        homeUrl={arabic ? 'https://www.undrr.org/ar' : 'https://www.undrr.org/'}
        logoAlt={words.home}
        logoTitle={words.home}
        showAccount={false}
        languages={[
          { value: 'en', label: 'English', selected: !arabic },
          { value: 'ar', label: 'العربية', selected: arabic },
          { value: 'es', label: 'Español' },
          { value: 'fr', label: 'Français' },
        ]}
      />
      <MegaMenu
        sections={globalSections(locale)}
        labels={{
          ...(arabic ? LABELS_AR : DEFAULT_MEGAMENU_LABELS),
          navLabel: words.nav,
        }}
      />
    </>
  );
}

UndrrChrome.propTypes = {
  /** Storybook locale key. `arabic` switches the menu copy and labels. */
  locale: PropTypes.string,
  /** Unique id for the header element, so several examples can share a page. */
  id: PropTypes.string,
};
