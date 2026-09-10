import React, { useId } from 'react';
import PropTypes from 'prop-types';
import { VerticalCard } from '../../Components/Cards/Card/VerticalCard';
import TableOfContents from '../../Components/TableOfContents/TableOfContents';
import { UndrrChrome } from '../_shared/UndrrChrome';
import { SkipLink } from '../../Utilities/SkipLink/SkipLink';

// Reference design for undrr/web-backlog#3060: is the header image full-bleed
// and prominent, or kept inside the reading column? `heroImage` is the
// separate question of whether the image used for teasers and social cards
// also has to be the one shown here, at the top of the article body.
const images = {
  main: {
    src: 'https://www.undrr.org/sites/default/files/2023-11/resilient-infrastructure-pikoso-kz-shutterstock.jpg',
    alt: {
      english: 'Community members receive a flood early warning briefing.',
      arabic: 'يتلقى أفراد المجتمع إحاطة حول الإنذار المبكر بالفيضانات.',
    },
  },
  alternate: {
    src: 'https://www.undrr.org/sites/default/files/2021-04/WiA-childyouthengage.jpg',
    alt: {
      english: 'A meteorologist reviews satellite data in an operations centre.',
      arabic: 'أخصائية أرصاد جوية تراجع بيانات الأقمار الصناعية في غرفة العمليات.',
    },
  },
};

const relatedImage =
  'https://www.undrr.org/sites/default/files/2020-01/Home---about-us_0.jpg';

const words = {
  english: {
    skip: 'Skip to page content',
    label: 'News',
    title: 'Early warning systems reach three more countries',
    lede: 'New coverage brings life-saving alerts to communities most exposed to floods and cyclones, part of the global push for early warning for all.',
    date: '10 September 2026',
    author: 'UNDRR Press Office',
    onPage: 'On this page',
    sections: [
      {
        heading: 'What changed',
        body: 'Three national meteorological services have connected local sirens and mobile alerts to a shared regional forecasting system, closing a gap that left coastal districts without a reliable warning in the final hours before a storm.',
      },
      {
        heading: 'Why it matters',
        body: 'Communities that receive a warning with enough lead time evacuate sooner and lose far less. The new coverage reaches districts that previously relied on word of mouth once a storm was already forming offshore.',
      },
      {
        heading: 'What happens next',
        body: 'The next phase extends the same system to two more countries and adds multilingual alerts, so a warning reaches people in the language they use at home rather than only the national language.',
      },
    ],
    related: 'Related news and events',
    relatedCards: [
      {
        title: 'Regional workshop trains first responders on the new alerts',
        summaryText:
          'Emergency teams from across the region rehearsed the escalation path from forecast to public warning.',
      },
      {
        title: 'How early warning becomes early action',
        summaryText:
          'A warning only saves lives if it reaches someone who knows what to do next.',
      },
      {
        title: 'Upcoming: Early Warnings for All regional review',
        summaryText:
          'Ministers and technical leads meet to review coverage gaps ahead of the next storm season.',
      },
    ],
  },
  arabic: {
    skip: 'انتقل إلى محتوى الصفحة',
    label: 'أخبار',
    title: 'أنظمة الإنذار المبكر تصل إلى ثلاث دول إضافية',
    lede: 'تغطية جديدة توفر إنذارات منقذة للحياة للمجتمعات الأكثر عرضة للفيضانات والأعاصير، في إطار الدفع العالمي نحو الإنذار المبكر للجميع.',
    date: '10 سبتمبر 2026',
    author: 'مكتب الصحافة بمكتب الأمم المتحدة للحد من مخاطر الكوارث',
    onPage: 'في هذه الصفحة',
    sections: [
      {
        heading: 'ما الذي تغيّر',
        body: 'ربطت ثلاث هيئات أرصاد جوية وطنية صافرات الإنذار المحلية والتنبيهات عبر الهاتف المحمول بنظام تنبؤ إقليمي مشترك، لسد الفجوة التي تركت المناطق الساحلية دون إنذار موثوق في الساعات الأخيرة قبل العاصفة.',
      },
      {
        heading: 'لماذا يهم هذا',
        body: 'المجتمعات التي تتلقى إنذاراً بوقت كافٍ تُخلي المنطقة بشكل أسرع وتخسر أقل بكثير. التغطية الجديدة تصل إلى مناطق كانت تعتمد سابقاً على الكلام المتناقل بمجرد تشكل العاصفة قبالة الساحل.',
      },
      {
        heading: 'ماذا يحدث بعد ذلك',
        body: 'تمتد المرحلة القادمة لتشمل نفس النظام في دولتين إضافيتين وتضيف تنبيهات متعددة اللغات، بحيث يصل الإنذار إلى الناس باللغة التي يستخدمونها في المنزل وليس فقط باللغة الوطنية.',
      },
    ],
    related: 'أخبار وفعاليات ذات صلة',
    relatedCards: [
      {
        title: 'ورشة إقليمية لتدريب المستجيبين الأوائل على التنبيهات الجديدة',
        summaryText:
          'تدربت فرق الطوارئ من مختلف أنحاء المنطقة على مسار التصعيد من التنبؤ إلى الإنذار العام.',
      },
      {
        title: 'كيف يتحول الإنذار المبكر إلى عمل مبكر',
        summaryText: 'الإنذار لا ينقذ الأرواح إلا إذا وصل إلى شخص يعرف ما يجب فعله بعد ذلك.',
      },
      {
        title: 'قادم: المراجعة الإقليمية للإنذار المبكر للجميع',
        summaryText: 'يجتمع الوزراء والخبراء الفنيون لمراجعة الثغرات في التغطية قبل موسم العواصف القادم.',
      },
    ],
  },
};

/**
 * Story-only composition: a news/event article page for the layout question
 * in undrr/web-backlog#3060 — how prominent should the header image be, and
 * does the full page have to show the same image used for teasers and social
 * cards?
 */
export function ArticleStory({
  imageProminence = 'large',
  heroImage = 'main',
  locale = 'english',
}) {
  const text = words[locale] || words.english;
  const arabic = locale === 'arabic';
  const instanceId = useId();
  const prefix = `article-${instanceId.replace(/:/g, '')}`;
  const image = heroImage === 'alternate' ? images.alternate : images.main;
  const large = imageProminence === 'large';

  const headerImage =
    heroImage !== 'none' ? (
      <div
        className={large ? 'mg-container-full-width' : 'mg-demo-article-media--compact'}
      >
        <img
          src={image.src}
          alt={image.alt[locale] || image.alt.english}
          className="mg-demo-article-image"
        />
      </div>
    ) : null;

  return (
    <div lang={arabic ? 'ar' : 'en'} dir={arabic ? 'rtl' : undefined}>
      <SkipLink targetId={`${prefix}-content`} label={text.skip} />
      <UndrrChrome locale={locale} id={prefix} />
      <div className="mg-demo-shell | mg-container mg-container--spacer">
        <main
          id={`${prefix}-content`}
          className="mg-page-main"
          tabIndex={-1}
        >
          <header
            className="mg-demo-article-header"
            data-image-prominence={imageProminence}
          >
            {headerImage}
            <div className="mg-demo-intro">
              <p className="mg-u-font-size-250">{text.label}</p>
              <h1>{text.title}</h1>
              <p className="mg-demo-lede | mg-u-font-size-500">{text.lede}</p>
              <p className="mg-u-font-size-250">
                {text.date} · {text.author}
              </p>
            </div>
          </header>
          <div className="mg-reading mg-reading--with-contents">
            <TableOfContents
              key={locale}
              title={text.onPage}
              tocData={text.sections.map((section, index) => ({
                id: `${prefix}/section/${index}`,
                text: section.heading,
              }))}
            />
            <div className="mg-reading__article">
              {text.sections.map((section, index) => (
                <section key={section.heading} id={`${prefix}/section/${index}`}>
                  <h2>{section.heading}</h2>
                  <p>{section.body}</p>
                </section>
              ))}
            </div>
          </div>
          <section>
            <h2>{text.related}</h2>
            <div className="mg-grid mg-grid__col-3">
              <VerticalCard
                data={text.relatedCards.map((card, index) => ({
                  ...card,
                  link: `https://www.undrr.org/news/related-story-${index + 1}`,
                  imgback: relatedImage,
                  imgalt: '',
                }))}
              />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

ArticleStory.propTypes = {
  /**
   * `large` bleeds the header image full width, the way news.un.org, UNESCO
   * and UNDP's story pages do. `compact` keeps it inside the reading column,
   * closer to the current undrr.org treatment.
   */
  imageProminence: PropTypes.oneOf(['large', 'compact']),
  /**
   * Which image the header shows, independent of `imageProminence`. `main`
   * reuses the image a teaser/social card would use for this story. `alternate`
   * shows a different image in that position, so the teaser image and the
   * on-page image can diverge. `none` drops the header image entirely.
   */
  heroImage: PropTypes.oneOf(['main', 'alternate', 'none']),
  /** Storybook locale key. `arabic` switches copy and sets `dir="rtl"`. */
  locale: PropTypes.string,
};
