import React, { useId } from 'react';
import PropTypes from 'prop-types';
import { VerticalCard } from '../../Components/Cards/Card/VerticalCard';
import TableOfContents from '../../Components/TableOfContents/TableOfContents';
import ShareButtons from '../../Components/Buttons/ShareButtons/ShareButtons';
import { LABELS_AR as SHARE_LABELS_AR } from '../../Components/Buttons/ShareButtons/_labels';
import UserFeedback from '../../Components/UserFeedback/UserFeedback';
import { LABELS_AR as FEEDBACK_LABELS_AR } from '../../Components/UserFeedback/_labels';
import { UndrrChrome } from '../_shared/UndrrChrome';
import { SkipLink } from '../../Utilities/SkipLink/SkipLink';

// Reference design for undrr/web-backlog#3060: is the header image full-bleed
// and prominent, or kept inside the reading column? `heroImage` is the
// separate question of whether the image used for teasers and social cards
// also has to be the one shown here. The label, title, lede and byline always
// sit above the image, matching undrr.org and the comparison sites in the
// ticket — the image is not what carries the reader into the story.
//
// Content is drawn from a real undrr.org story (see the mdx doc for the
// source URL) so reviewers are judging the layout against a real case, not a
// synthetic one. The page itself returns a bot-check 403 to automated
// fetches, so the copy below is taken from screenshots of the live page
// rather than scraped — the headline, date, image, editors' recommendations
// and taxonomy tags are reproduced verbatim; the body paragraphs are a short,
// factual summary of the consultation rather than a full reproduction of the
// article text.
const images = {
  main: {
    src: 'https://www.undrr.org/sites/default/files/2026-09/Group_photo_IMG_2626.jpg',
    alt: {
      english:
        'Group photo from the non-economic losses consultation with Pacific Indigenous Peoples and local communities, Nadi, Fiji.',
      arabic:
        'صورة جماعية من مشاورة الخسائر غير الاقتصادية مع الشعوب الأصلية والمجتمعات المحلية في المحيط الهادئ، نادي، فيجي.',
    },
    caption: {
      english: 'Group photo from NELs Consultation/UNDRR',
      arabic: 'صورة جماعية من مشاورة الخسائر غير الاقتصادية/مكتب الأمم المتحدة للحد من مخاطر الكوارث',
    },
  },
  alternate: {
    src: 'https://www.undrr.org/sites/default/files/2021-04/WiA-childyouthengage.jpg',
    alt: {
      english: 'A community engagement session on traditional knowledge and risk.',
      arabic: 'جلسة إشراك مجتمعي حول المعرفة التقليدية والمخاطر.',
    },
    caption: {
      english: 'Illustrative image only — not the teaser image for this story.',
      arabic: 'صورة توضيحية فقط — ليست صورة العرض المصغر لهذا الخبر.',
    },
  },
};

const relatedImage =
  'https://www.undrr.org/sites/default/files/2020-01/Home---about-us_0.jpg';

const words = {
  english: {
    skip: 'Skip to page content',
    label: 'Update',
    title:
      'Towards knowledge, action and resolve to address non-economic losses in the Pacific Indigenous Communities Nadi, Fiji',
    quote: '"Know your history and know what you have lost."',
    quoteAttribution: '— Mr. Joeli Ditoka',
    date: '8 September 2026',
    author:
      'Source(s): United Nations Office for Disaster Risk Reduction (UNDRR), Santiago Network',
    onPage: 'On this page',
    sections: [
      {
        heading: 'About the consultation',
        body: 'The consultation on non-economic losses (NELs) brought together Pacific Indigenous Peoples and local communities in Nadi, Fiji, on 20 August 2026, held in conjunction with the Local Communities and Indigenous Peoples Platform (LCIPP) Regional Gathering for the Pacific, in partnership between UNDRR and the Santiago Network.',
      },
      {
        heading: 'Non-economic losses',
        body: 'Non-economic losses are the impacts of disasters and climate change that cannot be replaced or compensated financially: loss of cultural heritage, ancestral knowledge, community cohesion and connection to land. Participants shared how these losses are already being felt across the Pacific.',
      },
      {
        heading: 'What happens next',
        body: 'Findings from the consultation feed into regional guidance on integrating Indigenous and traditional knowledge into disaster risk reduction planning across the Pacific, alongside the resources listed under editors’ recommendations below.',
      },
    ],
    related: 'Related news and events',
    relatedCards: [
      {
        title: 'Santiago Network expands support for loss and damage in the Pacific',
        summaryText:
          'New technical assistance helps Pacific communities document and respond to non-economic losses.',
      },
      {
        title: 'How traditional knowledge strengthens community-based DRR',
        summaryText:
          'Local and Indigenous knowledge systems are shaping how Pacific communities plan for disaster risk.',
      },
      {
        title: 'Upcoming: LCIPP Pacific Regional Gathering follow-up',
        summaryText:
          'Indigenous leaders and technical partners meet to carry the Nadi consultation’s findings forward.',
      },
    ],
    editorsRecommendations: "Editors' recommendations",
    editorsRecommendationsLinks: [
      'NELs consultation with Indigenous Peoples and local communities during the Local Communities and Indigenous Peoples Platform (LCIPP) Pacific Regional Gathering',
      'Thematic report on local, Indigenous and traditional knowledge for disaster risk reduction in the Pacific',
      'Words into Action guidelines: Using traditional and indigenous knowledges for disaster risk reduction',
    ],
    exploreFurther: 'Explore further',
    exploreGroups: [
      {
        label: 'Hazards',
        tags: ['Cyclone, Hurricane and Typhoon', 'Sea level rise'],
      },
      {
        label: 'Themes',
        tags: [
          'Climate change',
          'Community-based DRR',
          'Traditional and Indigenous knowledges',
        ],
      },
      { label: 'Country and region', tags: ['Fiji'] },
    ],
  },
  arabic: {
    skip: 'انتقل إلى محتوى الصفحة',
    label: 'تحديث',
    title:
      'نحو المعرفة والعمل والعزم لمعالجة الخسائر غير الاقتصادية لدى المجتمعات الأصلية في المحيط الهادئ، نادي، فيجي',
    quote: '"اعرف تاريخك واعرف ما فقدته."',
    quoteAttribution: '— السيد جويلي ديتوكا',
    date: '8 سبتمبر 2026',
    author:
      'المصدر: مكتب الأمم المتحدة للحد من مخاطر الكوارث (UNDRR)، وشبكة سانتياغو',
    onPage: 'في هذه الصفحة',
    sections: [
      {
        heading: 'عن المشاورة',
        body: 'جمعت مشاورة الخسائر غير الاقتصادية الشعوب الأصلية والمجتمعات المحلية في المحيط الهادئ في نادي، فيجي، في 20 أغسطس 2026، بالتزامن مع اللقاء الإقليمي لمنصة المجتمعات المحلية والشعوب الأصلية (LCIPP) للمحيط الهادئ، بشراكة بين مكتب الأمم المتحدة للحد من مخاطر الكوارث وشبكة سانتياغو.',
      },
      {
        heading: 'الخسائر غير الاقتصادية',
        body: 'الخسائر غير الاقتصادية هي آثار الكوارث وتغير المناخ التي لا يمكن تعويضها مالياً: فقدان التراث الثقافي والمعرفة الموروثة والتماسك المجتمعي والارتباط بالأرض. شارك الحاضرون تجاربهم حول هذه الخسائر التي باتت محسوسة بالفعل في أنحاء المحيط الهادئ.',
      },
      {
        heading: 'ماذا يحدث بعد ذلك',
        body: 'تُغذّي نتائج المشاورة الإرشادات الإقليمية بشأن دمج معارف الشعوب الأصلية والمعرفة التقليدية في تخطيط الحد من مخاطر الكوارث في أنحاء المحيط الهادئ، إلى جانب الموارد المدرجة ضمن توصيات المحررين أدناه.',
      },
    ],
    related: 'أخبار وفعاليات ذات صلة',
    relatedCards: [
      {
        title: 'شبكة سانتياغو توسّع الدعم للخسائر والأضرار في المحيط الهادئ',
        summaryText:
          'مساعدة تقنية جديدة تساعد مجتمعات المحيط الهادئ على توثيق الخسائر غير الاقتصادية والاستجابة لها.',
      },
      {
        title: 'كيف تعزز المعرفة التقليدية الحد من مخاطر الكوارث المرتكز على المجتمع',
        summaryText:
          'تُشكّل أنظمة المعرفة المحلية والأصلية طريقة تخطيط مجتمعات المحيط الهادئ لمخاطر الكوارث.',
      },
      {
        title: 'قادم: متابعة اللقاء الإقليمي لمنصة LCIPP في المحيط الهادئ',
        summaryText:
          'يجتمع قادة الشعوب الأصلية والشركاء التقنيون لمواصلة نتائج مشاورة نادي.',
      },
    ],
    editorsRecommendations: 'توصيات المحررين',
    editorsRecommendationsLinks: [
      'مشاورة الخسائر غير الاقتصادية مع الشعوب الأصلية والمجتمعات المحلية خلال اللقاء الإقليمي لمنصة المجتمعات المحلية والشعوب الأصلية (LCIPP) للمحيط الهادئ',
      'تقرير مواضيعي عن المعرفة المحلية والأصلية والتقليدية للحد من مخاطر الكوارث في المحيط الهادئ',
      'إرشادات تحويل الكلمات إلى أفعال: استخدام المعارف التقليدية والأصلية للحد من مخاطر الكوارث',
    ],
    exploreFurther: 'استكشف المزيد',
    exploreGroups: [
      {
        label: 'الأخطار',
        tags: ['إعصار مداري', 'ارتفاع مستوى سطح البحر'],
      },
      {
        label: 'المواضيع',
        tags: [
          'تغير المناخ',
          'الحد من مخاطر الكوارث المرتكز على المجتمع',
          'المعارف التقليدية والأصلية',
        ],
      },
      { label: 'الدولة والمنطقة', tags: ['فيجي'] },
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
      <figure
        className={large ? 'mg-container-full-width' : 'mg-demo-article-media--compact'}
      >
        <img
          src={image.src}
          alt={image.alt[locale] || image.alt.english}
          className="mg-demo-article-image"
        />
        <figcaption className="mg-u-font-size-250">
          {image.caption[locale] || image.caption.english}
        </figcaption>
      </figure>
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
            <div className="mg-demo-intro">
              <p className="mg-u-font-size-250">{text.label}</p>
              <h1>{text.title}</h1>
              <blockquote className="mg-demo-lede | mg-u-font-size-500">
                <p>{text.quote}</p>
                <cite>{text.quoteAttribution}</cite>
              </blockquote>
              <p className="mg-u-font-size-250">
                {text.date} · {text.author}
              </p>
              <ShareButtons
                SharingSubject={text.title}
                labels={arabic ? SHARE_LABELS_AR : undefined}
              />
            </div>
            {headerImage}
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
          <section>
            <h2>{text.editorsRecommendations}</h2>
            <ul>
              {text.editorsRecommendationsLinks.map(link => (
                <li key={link}>
                  <a href="https://www.undrr.org/words-into-action">{link}</a>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2>{text.exploreFurther}</h2>
            {text.exploreGroups.map(group => (
              <p key={group.label}>
                <strong>{group.label}</strong>{' '}
                <span className="mg-tag-container">
                  {group.tags.map(tag => (
                    <a key={tag} href="https://www.undrr.org/taxonomy">
                      {tag}
                    </a>
                  ))}
                </span>
              </p>
            ))}
          </section>
        </main>
      </div>
      <UserFeedback labels={arabic ? FEEDBACK_LABELS_AR : undefined} />
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
