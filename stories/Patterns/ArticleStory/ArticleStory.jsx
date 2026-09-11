import React, { useId } from 'react';
import PropTypes from 'prop-types';
import { VerticalCard } from '../../Components/Cards/Card/VerticalCard';
import { Hero } from '../../Components/Hero/Hero';
import TableOfContents from '../../Components/TableOfContents/TableOfContents';
import ShareButtons from '../../Components/Buttons/ShareButtons/ShareButtons';
import { LABELS_AR as SHARE_LABELS_AR } from '../../Components/Buttons/ShareButtons/_labels';
import UserFeedback from '../../Components/UserFeedback/UserFeedback';
import { LABELS_AR as FEEDBACK_LABELS_AR } from '../../Components/UserFeedback/_labels';
import { Imagecaption } from '../../Molecules/ImageCaption/ImageCaption';
import { HighlightBox } from '../../Components/HighlightBox/HighlightBox';
import QuoteHighlight from '../../Components/QuoteHighlight/QuoteHighlight';
import { EmbedContainer } from '../../Utilities/EmbedContainer/EmbedContainer';
import { UndrrChrome } from '../_shared/UndrrChrome';
import { SkipLink } from '../../Utilities/SkipLink/SkipLink';

// Story fixture for undrr/web-backlog#3060, based on real article metadata.
const images = {
  main: {
    src: 'https://www.undrr.org/sites/default/files/2026-09/Group_photo_IMG_2626.jpg',
    // Keep alt text distinct from visible caption text.
    alt: {
      english:
        'Group photo from the non-economic losses consultation with Pacific Indigenous Peoples and local communities, Nadi, Fiji.',
      arabic:
        'صورة جماعية من مشاورة الخسائر غير الاقتصادية مع الشعوب الأصلية والمجتمعات المحلية في المحيط الهادئ، نادي، فيجي.',
    },
    // Caption and credit are rendered separately.
    caption: {
      english: 'Group photo from NELs Consultation',
      arabic: 'صورة جماعية من مشاورة الخسائر غير الاقتصادية',
    },
    credit: {
      english: 'UNDRR',
      arabic: 'مكتب الأمم المتحدة للحد من مخاطر الكوارث',
    },
  },
  alternate: {
    // Alternate image for testing header/teaser image divergence.
    src: 'https://www.undrr.org/sites/default/files/2026-09/rsz_2rsz_11rsz_nel_pic_2.jpg',
    alt: {
      english: 'Discussions during the NELs Consultation/UNDRR',
      arabic: 'نقاشات خلال مشاورة الخسائر غير الاقتصادية/مكتب الأمم المتحدة للحد من مخاطر الكوارث',
    },
    // Placeholder caption/credit for layout testing.
    caption: {
      english: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      arabic: 'لوريم إيبسوم دولور سيت أميت، كونسيكتيتور أديبيسكينغ إيليت.',
    },
    credit: {
      english: 'Placeholder Photography Credit and Licensing Collective',
      arabic: 'مجموعة توضيحية لحقوق التصوير الفوتوغرافي والترخيص',
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
    summary:
      'The consultation reaffirmed growing climate risks and deep concerns among Indigenous Peoples. Around 45 participants from Indigenous communities across 11 countries shared experiences of the non-economic losses affecting their communities.',
    date: '8 September 2026',
    sourceLabel: 'Source(s):',
    sources: [
      {
        name: 'United Nations Office for Disaster Risk Reduction (UNDRR)',
        href: 'https://www.undrr.org/organization/united-nations-office-disaster-risk-reduction-undrr',
      },
      {
        name: 'Santiago Network',
        href: 'https://www.undrr.org/organization/santiago-network',
      },
    ],
    onPage: 'On this page',
    sections: [
      {
        heading: 'About the consultation',
        // Placeholder body copy for reading-length layout checks.
        paragraphs: [
          <>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.{' '}
            <a href="https://www.undrr.org/words-into-action">
              Ut enim ad minim veniam
            </a>
            , quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
            commodo consequat. Duis aute irure dolor in reprehenderit in
            voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui
            officia deserunt mollit anim id est laborum.
          </>,
          <>
            Curabitur pretium tincidunt lacus, nulla gravida orci a odio.
            Nullam varius, turpis et commodo pharetra,{' '}
            <a href="https://www.undrr.org/publication/thematic-report-local-indigenous-and-traditional-knowledge-disaster-risk-reduction">
              est eros bibendum elit
            </a>
            , nec luctus magna felis sollicitudin mauris. Integer in mauris eu
            nibh euismod gravida. Duis ac tellus et risus vulputate vehicula.
            Donec lobortis risus a elit. Ut ullamcorper, ligula eu tempor
            congue, eros est euismod turpis, id tincidunt sapien risus a quam.
          </>,
          <>
            Maecenas fermentum consequat mi. Pellentesque malesuada nulla a
            mi. Duis sapien sem, aliquet nec, commodo eget, consequat quis,
            neque. Aliquam faucibus, elit ut dictum aliquet,{' '}
            <a href="https://www.undrr.org/taxonomy">
              felis nisl adipiscing sapien
            </a>
            , sed malesuada diam lacus eget erat. Cras mollis scelerisque
            nunc. Nullam arcu. Aliquam consequat. Curabitur augue lorem,
            dapibus quis, laoreet et, pretium ac, nisi.
          </>,
        ],
      },
      {
        heading: 'Non-economic losses',
        paragraphs: [
          <>
            Aliquam eget maximus est, id dignissim quam. Proin gravida nibh
            vel velit auctor aliquet.{' '}
            <a href="https://www.undrr.org/words-into-action">
              Aenean sollicitudin, lorem quis bibendum auctor
            </a>
            , nisi elit consequat ipsum, nec sagittis sem nibh id elit. Duis
            sed odio sit amet nibh vulputate cursus a sit amet mauris. Morbi
            accumsan ipsum velit.
          </>,
          <>
            Nam nec tellus a odio tincidunt auctor a ornare odio. Sed non
            mauris vitae erat consequat auctor eu in elit. Mauris in erat
            justo.{' '}
            <a href="https://www.undrr.org/publication/thematic-report-local-indigenous-and-traditional-knowledge-disaster-risk-reduction">
              Nullam ac urna eu felis dapibus condimentum
            </a>{' '}
            sit amet a augue. Sed non neque elit. Sed ut imperdiet nisi. Proin
            condimentum fermentum nunc.
          </>,
          <>
            Etiam pharetra, erat sed fermentum feugiat, velit mauris egestas
            quam, ut aliquam massa nisl quis neque. Suspendisse in orci enim.
            Nunc semper augue nec diam vestibulum, non vulputate purus
            fermentum. Integer eget augue sed lacus lobortis suscipit.{' '}
            <a href="https://www.undrr.org/taxonomy">
              Nam nec ligula fringilla, feugiat metus vitae
            </a>
            , sagittis tortor. Vestibulum in massa nec turpis facilisis
            facilisis.
          </>,
        ],
      },
      {
        heading: 'What happens next',
        paragraphs: [
          <>
            Sed vel lectus sed nunc consequat feugiat. Integer imperdiet
            lectus quam, ut porttitor lectus lacinia consectetur.{' '}
            <a href="https://www.undrr.org/words-into-action">
              Donec ut libero sed arcu vehicula ultricies
            </a>{' '}
            a non tortor. Vestibulum ante ipsum primis in faucibus orci luctus
            et ultrices posuere cubilia curae. In hac habitasse platea
            dictumst.
          </>,
          <>
            Suspendisse potenti. Nullam eget mi in purus lobortis eleifend.
            Sed nec ante dictum sem condimentum ullamcorper quis venenatis
            nisi.{' '}
            <a href="https://www.undrr.org/publication/thematic-report-local-indigenous-and-traditional-knowledge-disaster-risk-reduction">
              Duis aute irure dolor in reprehenderit
            </a>{' '}
            in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            Vivamus quis mi ex. Nulla facilisi.
          </>,
          <>
            Quisque euismod, urna eu tincidunt consectetur, nisi nisl aliquam
            enim, nec fringilla justo nisl eget arcu. Aliquam erat volutpat.
            Class aptent taciti sociosqu ad litora torquent per conubia
            nostra, per inceptos himenaeos.{' '}
            <a href="https://www.undrr.org/taxonomy">
              Nam nec ligula fringilla
            </a>
            , feugiat metus vitae, sagittis tortor congue.
          </>,
        ],
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
    summary:
      'أكدت المشاورة تزايد المخاطر المناخية والقلق العميق لدى الشعوب الأصلية. شارك نحو 45 مشاركاً من مجتمعات الشعوب الأصلية من 11 دولة تجاربهم مع الخسائر غير الاقتصادية التي تؤثر على مجتمعاتهم.',
    date: '8 سبتمبر 2026',
    sourceLabel: 'المصدر:',
    sources: [
      {
        name: 'مكتب الأمم المتحدة للحد من مخاطر الكوارث (UNDRR)',
        href: 'https://www.undrr.org/organization/united-nations-office-disaster-risk-reduction-undrr',
      },
      {
        name: 'شبكة سانتياغو',
        href: 'https://www.undrr.org/organization/santiago-network',
      },
    ],
    onPage: 'في هذه الصفحة',
    sections: [
      {
        heading: 'عن المشاورة',
        // نص تجريبي لاختبار طول عمود القراءة.
        paragraphs: [
          <>
            هذا النص هو مثال لنص يمكن أن يستبدل في نفس المساحة، لقد تم توليد
            هذا النص من{' '}
            <a href="https://www.undrr.org/words-into-action">
              مولد النص العربى
            </a>
            ، حيث يمكنك أن تولد مثل هذا النص أو العديد من النصوص الأخرى إضافة
            إلى زيادة عدد الحروف التى يولدها التطبيق.
          </>,
          <>
            إذا كنت تحتاج إلى عدد أكبر من الفقرات يتيح لك مولد النص العربى
            زيادة عدد الفقرات كما تريد،{' '}
            <a href="https://www.undrr.org/publication/thematic-report-local-indigenous-and-traditional-knowledge-disaster-risk-reduction">
              النص لن يبدو مقسما ولا يحوي أخطاء لغوية
            </a>
            ، مولد النص العربى مفيد لمصممي المواقع على وجه الخصوص.
          </>,
          <>
            حيث يحتاج العميل فى كثير من الأحيان أن يطلع على صورة حقيقية
            لتصميم الموقع، ويستخدم{' '}
            <a href="https://www.undrr.org/taxonomy">مولد النص العربى</a>{' '}
            لتوليد جمل تشبه الجمل الحقيقية من حيث طول الفقرة وعدد الكلمات.
          </>,
        ],
      },
      {
        heading: 'الخسائر غير الاقتصادية',
        paragraphs: [
          <>
            فيصعب على المصمم أن يجد نصوصاً واقعية من خلال جمل عربية أو حتى
            انجليزية غير مفهومة المعنى، لذلك يتم استخدام{' '}
            <a href="https://www.undrr.org/words-into-action">
              مولد النص العربى
            </a>{' '}
            لتوليد جمل تشبه الجمل الحقيقية من حيث طول الفقرة وعدد الكلمات.
          </>,
          <>
            فيبدو التصميم مألوفاً وواضحاً للعميل بشكل أفضل من الاعتماد على
            نصوص لا تشبه في شكلها النص الطبيعي.{' '}
            <a href="https://www.undrr.org/publication/thematic-report-local-indigenous-and-traditional-knowledge-disaster-risk-reduction">
              يمكن أن تجد العديد من الأدوات الحرة
            </a>{' '}
            على شبكة الإنترنت لتوليد نصوص تجريبية بأطوال مختلفة.
          </>,
          <>
            وتُستخدم هذه النصوص عادة في مراحل التصميم الأولى قبل توفر المحتوى
            الفعلي، مما يتيح للمصممين والمطورين{' '}
            <a href="https://www.undrr.org/taxonomy">
              تقييم شكل الصفحة وتوزيع العناصر عليها
            </a>{' '}
            بشكل واقعي دون الانتظار حتى اكتمال كتابة المحتوى النهائي.
          </>,
        ],
      },
      {
        heading: 'ماذا يحدث بعد ذلك',
        paragraphs: [
          <>
            يمكن أن تجد العديد من الأدوات الحرة على شبكة الإنترنت لتوليد
            نصوص تجريبية بأطوال مختلفة، وتُستخدم هذه النصوص عادة في{' '}
            <a href="https://www.undrr.org/words-into-action">
              مراحل التصميم الأولى
            </a>{' '}
            قبل توفر المحتوى الفعلي.
          </>,
          <>
            مما يتيح للمصممين والمطورين تقييم شكل الصفحة وتوزيع العناصر
            عليها بشكل واقعي دون الانتظار حتى اكتمال كتابة المحتوى النهائي،
            وهذا ما تتيحه{' '}
            <a href="https://www.undrr.org/publication/thematic-report-local-indigenous-and-traditional-knowledge-disaster-risk-reduction">
              الأدوات الحرة المتاحة على الإنترنت
            </a>
            .
          </>,
          <>
            وبذلك يمكن تقييم عمود القراءة بطول واقعي قبل توفر النص النهائي
            للمقال، وهو ما يخدم هدف هذا التصميم المرجعي في{' '}
            <a href="https://www.undrr.org/taxonomy">هذه المرحلة</a> من العمل.
          </>,
        ],
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

/** Story-only article layout fixture for undrr/web-backlog#3060. */
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
  const split = imageProminence === 'split';

  const shareButtons = (
    <ShareButtons
      SharingSubject={text.title}
      labels={arabic ? SHARE_LABELS_AR : undefined}
    />
  );

  // Non-split layouts render the standalone header figure.
  const headerImage =
    !split && heroImage !== 'none' ? (
      <figure
        className={
          large
            ? 'mg-container-full-width'
            : 'mg-demo-article-media--compact | mg-container'
        }
      >
        <img
          src={image.src}
          alt={image.alt[locale] || image.alt.english}
          className="mg-demo-article-image"
        />
        <Imagecaption
          paragraph={image.caption[locale] || image.caption.english}
          label={image.credit[locale] || image.credit.english}
        />
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
            {split ? (
              <Hero
                headingLevel="h1"
                layout="split"
                split="2/3"
                data={[
                  {
                    label: text.label,
                    title: text.title,
                    summaryText: text.summary,
                    // Hero detail is plain text; links are shown in non-split layout.
                    detail: `${text.date} · ${text.sourceLabel} ${text.sources.map(source => source.name).join(', ')}`,
                    media:
                      heroImage !== 'none'
                        ? {
                            type: 'image',
                            src: image.src,
                            alt: image.alt[locale] || image.alt.english,
                          }
                        : undefined,
                  },
                ]}
              />
            ) : (
              <>
                <div className="mg-demo-intro | mg-container">
                  <p>
                    <a href="https://www.undrr.org/news" className="mg-tag">
                      {text.label}
                    </a>
                  </p>
                  <h1 className="mg-u-font-size-900">{text.title}</h1>
                  <p className="mg-demo-lede | mg-u-font-size-500">
                    {text.summary}
                  </p>
                  <p className="mg-u-font-size-250">
                    {text.date} · {text.sourceLabel}{' '}
                    {text.sources.map((source, index) => (
                      <React.Fragment key={source.name}>
                        {index > 0 && ', '}
                        <a href={source.href}>{source.name}</a>
                      </React.Fragment>
                    ))}
                  </p>
                </div>
                {headerImage}
              </>
            )}
          </header>
          <div className="mg-reading mg-reading--with-contents | mg-container mg-grid mg-grid--article">
            <div className="mg-u-flex mg-u-flex-column mg-u-gap-200">
              {/* Keep share controls in the side rail. */}
              {shareButtons}
              <TableOfContents
                key={locale}
                title={text.onPage}
                tocData={text.sections.map((section, index) => ({
                  id: `${prefix}/section/${index}`,
                  text: section.heading,
                }))}
              />
            </div>
            <div className="mg-reading__article">
              {text.sections.map((section, index) => (
                <section key={section.heading} id={`${prefix}/section/${index}`}>
                  <h2>{section.heading}</h2>
                  {section.paragraphs.map((paragraph, paragraphIndex) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <p key={paragraphIndex}>{paragraph}</p>
                  ))}
                  {/* Story-only content-placement samples (English only). */}
                  {!arabic && index === 0 && (
                    <QuoteHighlight
                      quote="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore."
                      attribution="Placeholder attribution"
                      attributionTitle="Role or title"
                      variant="line"
                      alignment="full"
                    />
                  )}
                  {!arabic && index === 1 && (
                    <HighlightBox variant="secondary" float="end">
                      <p>
                        <strong>45</strong> participants from Indigenous
                        communities across <strong>11</strong> countries.
                      </p>
                    </HighlightBox>
                  )}
                  {!arabic && index === 2 && (
                    <EmbedContainer aspectRatio="16x9">
                      <iframe
                        src="https://www.youtube.com/embed/lJWNmqYmKEQ"
                        title="This is how timely early warnings save lives — UNDRR"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </EmbedContainer>
                  )}
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
  /** Header treatment variant. */
  imageProminence: PropTypes.oneOf(['large', 'compact', 'split']),
  /** Header image selector, independent of prominence mode. */
  heroImage: PropTypes.oneOf(['main', 'alternate', 'none']),
  /** Storybook locale key. `arabic` switches copy and sets `dir="rtl"`. */
  locale: PropTypes.string,
};
