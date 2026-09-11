import React from 'react';
import PropTypes from 'prop-types';
import { UndrrChrome } from '../_shared/UndrrChrome';
import { SkipLink } from '../../Utilities/SkipLink/SkipLink';
import { Hero } from '../../Components/Hero/Hero';
import { VerticalCard } from '../../Components/Cards/Card/VerticalCard';
import { IconCard } from '../../Components/Cards/IconCard/IconCard';
import { BookCard } from '../../Components/Cards/Card/BookCard';
import TableOfContents from '../../Components/TableOfContents/TableOfContents';
import { TextCta } from '../../Components/TextCta/TextCta';

const heroImage =
  'https://www.undrr.org/sites/default/files/2023-11/resilient-infrastructure-pikoso-kz-shutterstock.jpg';

// Real destinations, so nothing in these examples is a link that does nothing.
const links = {
  trail: 'https://www.undrr.org/our-work',
  routes: [
    'https://www.undrr.org/our-work/early-warnings-all',
    'https://sendaimonitor.undrr.org/',
    'https://www.undrr.org/publications',
  ],
  related: 'https://www.undrr.org/news',
  collection: 'https://www.undrr.org/publications',
  publication: 'https://www.undrr.org/gar',
};

const words = {
  english: {
    breadcrumbs: 'Breadcrumbs',
    home: 'UNDRR',
    skip: 'Skip to page content',
    onPage: 'On this page',

    topic: {
      trail: ['Our work'],
      title: 'Early warnings for all',
      intro:
        'Every person on Earth should be protected by an early warning system by the end of 2027. This page brings together the guidance, evidence and partners behind that goal.',
      routesHeading: 'What would you like to do?',
      routesIntro:
        'Three routes into the initiative, whether you are building a system, funding one, or reporting on progress.',
      routes: [
        [
          'Understand the four pillars',
          'How risk knowledge, detection, dissemination and response fit together.',
          'cubes',
        ],
        [
          'See country progress',
          'Where coverage stands today, and which gaps remain.',
          'chart-bar',
        ],
        [
          'Find implementation guidance',
          'Practical material for national meteorological and disaster agencies.',
          'file-alt',
        ],
      ],
      bandHeading: 'Why early warnings matter',
      bandText:
        'Early warning systems are among the most effective ways to reduce disaster losses. Twenty-four hours of warning ahead of a hazard can cut the resulting damage substantially, and coverage remains uneven between countries.',
      facts: [
        'Coverage is a Sendai Framework global target',
        'Four pillars, from risk knowledge to response',
        'Delivered with WMO, ITU and IFRC',
        'Focused on least developed countries',
      ],
      relatedHeading: 'Latest from this initiative',
      related: [
        [
          'A new baseline for warning coverage',
          'What the latest national reports show about who is protected today.',
        ],
        [
          'Financing the last mile',
          'How countries are paying for dissemination in remote communities.',
        ],
        [
          'Working with communities',
          'Designing warnings people act on, not only warnings that arrive.',
        ],
      ],
      ctaHeadline: 'Report on your national system',
      ctaText:
        'National focal points record coverage and capability through the Sendai Framework Monitor.',
      ctaButton: 'Open the Monitor',
    },

    report: {
      trail: ['Research and publications'],
      title: 'Global assessment report on disaster risk reduction',
      intro:
        'The flagship report on how disaster risk is changing worldwide, and what reduces it.',
      sections: [
        [
          'What the report covers',
          'The assessment draws on national reporting, scientific literature and country consultations to describe how risk is accumulating and where reduction efforts are working. It is written for policymakers rather than specialists, and each chapter opens with its practical implications.',
        ],
        [
          'Key findings',
          'Losses continue to concentrate in countries with the least capacity to absorb them. Where governments have invested in risk governance and early warning, the same hazards produce measurably smaller losses. The gap between those two groups is widening rather than closing.',
        ],
        [
          'How to use the evidence',
          'Chapters are designed to be cited independently. National planners can take the country annexes directly into planning cycles; researchers will find the underlying datasets published alongside the report.',
        ],
        [
          'Download and cite',
          'The full report, chapter extracts and the underlying data are published together. Please cite the report rather than this page when referencing findings.',
        ],
      ],
    },

    index: {
      trail: [],
      title: 'Publications',
      intro:
        'Reports, guidance and technical material from UNDRR and its partners.',
      groups: [
        [
          'Flagship reports',
          [
            'Global assessment report 2025',
            'Midterm review of the Sendai Framework',
            'Global assessment report 2023',
          ],
        ],
        [
          'Guidance and practical tools',
          [
            'Words into Action: national disaster risk assessment',
            'Words into Action: engaging children and youth',
            'Principles for resilient infrastructure',
          ],
        ],
        [
          'Regional assessments',
          ['Africa', 'Americas and the Caribbean', 'Asia-Pacific'],
        ],
      ],
      groupLink: 'View all in this collection',
    },
  },

  arabic: {
    breadcrumbs: 'مسار التنقل',
    home: 'المكتب',
    skip: 'انتقل إلى محتوى الصفحة',
    onPage: 'في هذه الصفحة',

    topic: {
      trail: ['عملنا'],
      title: 'الإنذار المبكر للجميع',
      intro:
        'ينبغي أن يكون كل شخص على وجه الأرض محمياً بنظام إنذار مبكر بحلول نهاية عام 2027. تجمع هذه الصفحة الإرشادات والأدلة والشركاء وراء هذا الهدف.',
      routesHeading: 'ماذا تريد أن تفعل؟',
      routesIntro:
        'ثلاثة مسارات للدخول إلى المبادرة، سواء كنت تبني نظاماً أو تموّله أو تعدّ تقريراً عن التقدم المحرز.',
      routes: [
        [
          'فهم الركائز الأربع',
          'كيف تترابط معرفة المخاطر والرصد والنشر والاستجابة.',
          'cubes',
        ],
        [
          'الاطلاع على تقدم الدول',
          'أين تقف التغطية اليوم، وما الفجوات المتبقية.',
          'chart-bar',
        ],
        [
          'إرشادات التنفيذ',
          'مواد عملية للأجهزة الوطنية للأرصاد الجوية وإدارة الكوارث.',
          'file-alt',
        ],
      ],
      bandHeading: 'لماذا يهم الإنذار المبكر',
      bandText:
        'تُعد أنظمة الإنذار المبكر من أكثر الوسائل فعالية للحد من خسائر الكوارث. فالإنذار قبل أربع وعشرين ساعة من وقوع الخطر يمكن أن يقلل الأضرار الناتجة بدرجة كبيرة، ولا تزال التغطية متفاوتة بين الدول.',
      facts: [
        'التغطية غاية عالمية في إطار سنداي',
        'أربع ركائز، من معرفة المخاطر إلى الاستجابة',
        'بالتعاون مع المنظمة العالمية للأرصاد الجوية وشركاء آخرين',
        'التركيز على أقل البلدان نمواً',
      ],
      relatedHeading: 'أحدث ما في هذه المبادرة',
      related: [
        [
          'خط أساس جديد لتغطية الإنذار',
          'ما تظهره أحدث التقارير الوطنية عمّن يتمتع بالحماية اليوم.',
        ],
        [
          'تمويل الميل الأخير',
          'كيف تموّل الدول إيصال الإنذارات إلى المجتمعات النائية.',
        ],
        [
          'العمل مع المجتمعات المحلية',
          'تصميم إنذارات يتصرف الناس بناءً عليها، لا إنذارات تصل فحسب.',
        ],
      ],
      ctaHeadline: 'أبلغ عن نظامك الوطني',
      ctaText:
        'تسجّل جهات الاتصال الوطنية التغطية والقدرات من خلال مرصد إطار سنداي.',
      ctaButton: 'افتح المرصد',
    },

    report: {
      trail: ['البحوث والمنشورات'],
      title: 'التقرير التقييمي العالمي عن الحد من مخاطر الكوارث',
      intro:
        'التقرير الرئيسي عن كيفية تغيّر مخاطر الكوارث عالمياً، وما الذي يحد منها.',
      sections: [
        [
          'ما يغطيه التقرير',
          'يستند التقييم إلى التقارير الوطنية والأدبيات العلمية والمشاورات القُطرية لوصف كيفية تراكم المخاطر وأين تنجح جهود الحد منها. وهو موجّه إلى صانعي السياسات لا إلى المتخصصين، ويبدأ كل فصل بآثاره العملية.',
        ],
        [
          'أبرز النتائج',
          'لا تزال الخسائر تتركز في الدول الأقل قدرة على استيعابها. وحيث استثمرت الحكومات في حوكمة المخاطر والإنذار المبكر، تنتج المخاطر نفسها خسائر أقل بشكل ملموس. والفجوة بين المجموعتين تتسع بدل أن تضيق.',
        ],
        [
          'كيفية استخدام الأدلة',
          'صُممت الفصول بحيث يمكن الاستشهاد بكل منها على حدة. ويمكن للمخططين الوطنيين إدراج المرفقات القُطرية مباشرة في دورات التخطيط، بينما يجد الباحثون مجموعات البيانات الأساسية منشورة مع التقرير.',
        ],
        [
          'التنزيل والاستشهاد',
          'يُنشر التقرير الكامل ومقتطفات الفصول والبيانات الأساسية معاً. يُرجى الاستشهاد بالتقرير لا بهذه الصفحة عند الإشارة إلى النتائج.',
        ],
      ],
    },

    index: {
      trail: [],
      title: 'المنشورات',
      intro: 'تقارير وإرشادات ومواد فنية من المكتب وشركائه.',
      groups: [
        [
          'التقارير الرئيسية',
          [
            'التقرير التقييمي العالمي 2025',
            'استعراض منتصف المدة لإطار سنداي',
            'التقرير التقييمي العالمي 2023',
          ],
        ],
        [
          'الإرشادات والأدوات العملية',
          [
            'تحويل الكلمات إلى أفعال: التقييم الوطني لمخاطر الكوارث',
            'تحويل الكلمات إلى أفعال: إشراك الأطفال والشباب',
            'مبادئ البنية التحتية القادرة على الصمود',
          ],
        ],
        [
          'التقييمات الإقليمية',
          ['أفريقيا', 'الأمريكتان والكاريبي', 'آسيا والمحيط الهادئ'],
        ],
      ],
      groupLink: 'عرض كل ما في هذه المجموعة',
    },
  },
};

const factIcons = ['globe', 'cubes', 'tags', 'chart-bar'];
function Breadcrumbs({ label, home, trail, current }) {
  return (
    <nav className="mg-breadcrumb | mg-u-font-size-250" aria-label={label}>
      <ul>
        <li>
          <a href="https://www.undrr.org/">{home}</a>
        </li>
        {trail.map(step => (
          <li key={step}>
            <a href={links.trail}>{step}</a>
          </li>
        ))}
        <li aria-current="page">{current}</li>
      </ul>
    </nav>
  );
}

Breadcrumbs.propTypes = {
  label: PropTypes.string,
  home: PropTypes.string,
  trail: PropTypes.arrayOf(PropTypes.string),
  current: PropTypes.string,
};

/**
 * Story-only compositions of three landing page shapes UNDRR publishes today.
 * They exist so higher-level page structure can be discussed and compared, not
 * as components: no exports, hydration API or distributed CSS classes.
 */
export function LandingPage({ archetype = 'topic', locale = 'english', id }) {
  const text = words[locale] || words.english;
  const arabic = locale === 'arabic';
  const page = text[archetype];

  return (
    <div lang={arabic ? 'ar' : 'en'} dir={arabic ? 'rtl' : undefined}>
      <SkipLink targetId={`${id}-content`} label={text.skip} />
      <UndrrChrome locale={locale} id={id} />

      <div className="mg-demo-shell | mg-container">
        <Breadcrumbs
          label={text.breadcrumbs}
          home={text.home}
          trail={page.trail}
          current={page.title}
        />

        <main
          id={`${id}-content`}
          className="mg-page-main | mg-container--spacer"
          tabIndex={-1}
        >
          {archetype === 'topic' && (
            <>
              <Hero
                layout="split"
                split="2/3"
                headingLevel="h1"
                data={[
                  {
                    title: page.title,
                    summaryText: page.intro,
                    media: { type: 'image', src: heroImage, alt: '' },
                  },
                ]}
              />

              <section>
                <h2>{page.routesHeading}</h2>
                <p className="mg-demo-lede | mg-u-font-size-500">
                  {page.routesIntro}
                </p>
                <div className="mg-grid mg-grid__col-3">
                  <IconCard
                    orientation="horizontal"
                    data={page.routes.map(([title, summaryText, icon], i) => ({
                      title,
                      summaryText,
                      link: links.routes[i],
                      icon: `mg-icon mg-icon-${icon}`,
                    }))}
                  />
                </div>
              </section>

              <section className="mg-demo-band | mg-container-full-width mg-u-background-color--neutral-50">
                <div>
                  <h2>{page.bandHeading}</h2>
                  <p className="mg-demo-lede | mg-u-font-size-500">
                    {page.bandText}
                  </p>
                  <div className="mg-grid mg-grid__col-2">
                    <IconCard
                      orientation="horizontal"
                      data={page.facts.map((fact, index) => ({
                        title: fact,
                        icon: `mg-icon mg-icon-${factIcons[index]}`,
                      }))}
                    />
                  </div>
                </div>
              </section>

              <section>
                <h2>{page.relatedHeading}</h2>
                <div className="mg-grid mg-grid__col-3">
                  <VerticalCard
                    data={page.related.map(([title, summaryText]) => ({
                      title,
                      summaryText,
                      link: links.related,
                    }))}
                  />
                </div>
              </section>

              <TextCta
                tone="soft"
                centered={false}
                headline={page.ctaHeadline}
                text={page.ctaText}
                buttons={[
                  {
                    label: page.ctaButton,
                    url: 'https://sendaimonitor.undrr.org/',
                  },
                ]}
              />
            </>
          )}

          {archetype === 'report' && (
            <>
              <div className="mg-demo-band mg-demo-band--feature | mg-container-full-width mg-u-background-color--interactive mg-u-color--white">
                <div>
                  <h1>{page.title}</h1>
                  <p className="mg-demo-lede | mg-u-font-size-500">
                    {page.intro}
                  </p>
                </div>
              </div>
              <div className="mg-reading mg-reading--with-contents mg-grid mg-grid--article">
                <TableOfContents
                  key={locale}
                  title={text.onPage}
                  tocData={page.sections.map(([heading], index) => ({
                    id: `${id}-section-${index}`,
                    text: heading,
                  }))}
                />
                <div className="mg-reading__article">
                  {page.sections.map(([heading, body], index) => (
                    <section key={heading} id={`${id}-section-${index}`}>
                      <h2>{heading}</h2>
                      <p>{body}</p>
                    </section>
                  ))}
                </div>
              </div>
            </>
          )}

          {archetype === 'index' && (
            <>
              <div className="mg-demo-intro">
                <h1>{page.title}</h1>
                <p className="mg-demo-lede | mg-u-font-size-500">
                  {page.intro}
                </p>
              </div>
              {page.groups.map(([heading, titles]) => (
                <section key={heading}>
                  <h2>{heading}</h2>
                  <p>
                    <a href={links.collection}>{page.groupLink}</a>
                  </p>
                  <div className="mg-grid mg-grid__col-3">
                    <BookCard
                      data={titles.map(title => ({
                        title,
                        link: links.publication,
                        imgback: heroImage,
                        imgalt: '',
                      }))}
                    />
                  </div>
                </section>
              ))}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

LandingPage.propTypes = {
  /** Which landing page shape to render. */
  archetype: PropTypes.oneOf(['topic', 'report', 'index']),
  /** Storybook locale key. `arabic` switches copy and sets `dir="rtl"`. */
  locale: PropTypes.string,
  /** Unique prefix for ids, so several examples can share a page. */
  id: PropTypes.string,
};
