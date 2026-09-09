import React, { useEffect, useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { VerticalCard } from '../../Components/Cards/Card/VerticalCard';
import { TextCta } from '../../Components/TextCta/TextCta';

const words = {
  english: {
    parent: 'UNDRR home',
    site: 'United Nations Office for Disaster Risk Reduction',
    all: 'Explore UNDRR',
    global: ['About UNDRR', 'Our work', 'News'],
    hub: 'Sendai Framework Monitor',
    sections: [
      'Overview',
      'About',
      'Indicators',
      'Reporting',
      'Reports',
      'Data',
    ],
    home: 'Tracking progress towards a more resilient world',
    intro:
      'Understand disaster risk, follow progress and find guidance for reporting against the Sendai Framework.',
    landing: 'Monitoring the Sendai Framework',
    landingIntro:
      'Explore the evidence, guidance and tools that support disaster risk reduction.',
    how: 'How to report',
    validation: 'Validate your data',
    reportingIntro:
      'Find a route through the reporting process, from preparing evidence to reviewing a submission.',
    howIntro:
      'Prepare and review a national report. Work through the guidance with the people who collect and validate your data.',
    validationIntro:
      'Review the evidence behind each indicator before submitting a report.',
    cycle: 'Reporting cycle',
    quality: 'Data validation',
    focal: 'Focal points',
    onPage: 'On this page',
    validationSections: [
      'Check definitions',
      'Review unusual changes',
      'Record revisions',
    ],
    cycleText:
      'Start by agreeing a reporting timetable and identifying the data needed for each indicator. Keep a record of sources, methods and gaps so the next reporting cycle can build on this work.',
    qualityText:
      'Check that figures use consistent definitions and reporting periods. Discuss unexpected changes with the organizations supplying the data and record the reasons for any revisions.',
    focalText:
      'A national focal point coordinates contributions from the institutions involved. Agree who collects the evidence, who reviews it and who approves the final submission.',
    next: 'Continue with data validation',
    related: 'Explore the Monitor',
    open: 'Open the Monitor',
    cards: [
      'Learn how progress is measured and explore the global indicators.',
      'Prepare evidence and work through the reporting guidance.',
      'Find reports and explore what the evidence tells us.',
    ],
    back: 'Back to reporting',
    breadcrumbs: 'Breadcrumbs',
    hubNav: 'Monitor sections',
    parentNav: 'UNDRR navigation',
    skip: 'Skip to page content',
    resources: 'Resources and guidance',
    reportLink: 'Visit the Sendai Framework Monitor',
    reportText: 'Use the reporting platform to work with your national data.',
    sectionIntro:
      'Explore guidance and resources for this part of the Monitor.',
  },
  arabic: {
    parent: 'الصفحة الرئيسية للمكتب',
    site: 'مكتب الأمم المتحدة للحد من مخاطر الكوارث',
    all: 'استكشف موقع المكتب',
    global: ['عن المكتب', 'عملنا', 'الأخبار'],
    hub: 'مرصد إطار سنداي',
    sections: [
      'نظرة عامة',
      'عن المرصد',
      'المؤشرات',
      'إعداد التقارير',
      'التقارير',
      'البيانات',
    ],
    home: 'متابعة التقدم نحو عالم أكثر قدرة على الصمود',
    intro:
      'فهم مخاطر الكوارث ومتابعة التقدم والوصول إلى إرشادات إعداد التقارير بشأن إطار سنداي.',
    landing: 'رصد تنفيذ إطار سنداي',
    landingIntro:
      'استكشف الأدلة والإرشادات والأدوات التي تدعم الحد من مخاطر الكوارث.',
    how: 'كيفية إعداد التقارير',
    validation: 'التحقق من صحة البيانات',
    reportingIntro:
      'تعرّف على خطوات إعداد التقارير، من جمع الأدلة إلى مراجعة التقرير.',
    howIntro:
      'إعداد تقرير وطني ومراجعته بالتعاون مع الأشخاص الذين يجمعون البيانات ويتحققون من صحتها.',
    validationIntro: 'راجع الأدلة المتعلقة بكل مؤشر قبل تقديم التقرير.',
    cycle: 'دورة إعداد التقارير',
    quality: 'التحقق من صحة البيانات',
    focal: 'جهات الاتصال',
    onPage: 'في هذه الصفحة',
    validationSections: [
      'مراجعة التعريفات',
      'مراجعة التغييرات غير المعتادة',
      'تسجيل المراجعات',
    ],
    cycleText:
      'ابدأ بالاتفاق على جدول زمني لإعداد التقارير وتحديد البيانات المطلوبة لكل مؤشر. احتفظ بسجل للمصادر والأساليب والفجوات حتى تستفيد منها دورة إعداد التقارير التالية.',
    qualityText:
      'تحقق من اتساق التعريفات والفترات الزمنية المستخدمة. ناقش التغييرات غير المتوقعة مع المنظمات التي توفر البيانات وسجّل أسباب المراجعات.',
    focalText:
      'تنسق جهة الاتصال الوطنية مساهمات المؤسسات المعنية. اتفق على الجهات المسؤولة عن جمع الأدلة ومراجعتها واعتماد التقرير النهائي.',
    next: 'متابعة التحقق من صحة البيانات',
    related: 'استكشف المرصد',
    open: 'افتح المرصد',
    cards: [
      'تعرّف على كيفية قياس التقدم واستكشف المؤشرات العالمية.',
      'جهّز الأدلة واتبع إرشادات إعداد التقارير.',
      'اطّلع على التقارير واستكشف ما توضحه الأدلة.',
    ],
    back: 'العودة إلى إعداد التقارير',
    breadcrumbs: 'مسار التنقل',
    hubNav: 'أقسام المرصد',
    parentNav: 'التنقل في موقع المكتب',
    skip: 'انتقل إلى محتوى الصفحة',
    resources: 'الموارد والإرشادات',
    reportLink: 'زيارة مرصد إطار سنداي',
    reportText: 'استخدم منصة إعداد التقارير للعمل على بياناتك الوطنية.',
    sectionIntro: 'استكشف الإرشادات والموارد لهذا القسم من المرصد.',
  },
};

const sections = [
  'overview',
  'about',
  'indicators',
  'reporting',
  'reports',
  'data',
];
const routes = ['landing', ...sections, 'how-to-report', 'validate-data'];

/** Story-only composition. Hash routes keep navigation inside each mounted example. */
export function ContentHub({
  initialPage = 'overview',
  parentNavigation = 'compact',
  locale = 'english',
  showOnThisPage = true,
  routePrefix,
}) {
  const text = words[locale] || words.english;
  const instanceId = useId();
  const prefix = routePrefix || `hub-${instanceId.replace(/:/g, '')}`;
  const [page, setPage] = useState(initialPage);
  const heading = useRef(null);
  const navigation = useRef(null);
  const visited = useRef(false);
  const href = route => `#${prefix}/${route}`;
  const detail = page === 'how-to-report' || page === 'validate-data';
  const active = detail ? 'reporting' : page;
  const title =
    page === 'landing'
      ? text.landing
      : page === 'overview'
        ? text.home
        : page === 'how-to-report'
          ? text.how
          : page === 'validate-data'
            ? text.validation
            : text.sections[sections.indexOf(page)];

  useEffect(() => {
    const followLocation = () => {
      const hash = window.location.hash;
      if (!hash && visited.current) {
        setPage(initialPage);
        return;
      }
      if (!hash.startsWith(`#${prefix}/`)) return;
      const route = hash.slice(prefix.length + 2).split('/')[0];
      if (routes.includes(route)) {
        visited.current = true;
        setPage(route);
      }
    };
    followLocation();
    window.addEventListener('hashchange', followLocation);
    return () => window.removeEventListener('hashchange', followLocation);
  }, [prefix, initialPage]);

  useEffect(() => {
    if (visited.current) heading.current?.focus();
  }, [page]);

  useEffect(() => {
    const revealSection = () => {
      const rail = navigation.current;
      const selected = rail?.querySelector('[aria-current]');
      if (!selected || !rail.scrollBy) return;
      const viewport = rail.getBoundingClientRect();
      const item = selected.getBoundingClientRect();
      const offset =
        item.left < viewport.left
          ? item.left - viewport.left
          : item.right > viewport.right
            ? item.right - viewport.right
            : 0;
      if (offset) rail.scrollBy({ left: offset, behavior: 'instant' });
    };
    revealSection();
    // Font and theme changes can resize labels after the first paint.
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(revealSection);
    const rail = navigation.current;
    if (rail) {
      observer?.observe(rail);
      const list = rail.querySelector('ul');
      if (list) observer?.observe(list);
    }
    window.addEventListener('resize', revealSection);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', revealSection);
    };
  }, [page, locale]);

  const articleHeadings =
    page === 'validate-data'
      ? text.validationSections
      : [text.cycle, text.quality, text.focal];
  const groupCards = [2, 3, 4].map((index, i) => ({
    title: text.sections[index],
    summaryText: text.cards[i],
    link: href(sections[index]),
  }));

  return (
    <div
      className="mg-hub-example"
      lang={locale === 'arabic' ? 'ar' : 'en'}
      dir={locale === 'arabic' ? 'rtl' : undefined}
    >
      <a className="mg-hub-example__skip" href={`#${prefix}-content`}>
        {text.skip}
      </a>
      <header className="mg-hub-example__parent">
        <a
          className="mg-hub-example__brand"
          href="https://www.undrr.org/"
          aria-label={text.parent}
        >
          UNDRR
        </a>
        <span className="mg-hub-example__organization">{text.site}</span>
        <a className="mg-hub-example__escape" href="https://www.undrr.org/">
          {text.all}
        </a>
      </header>
      {parentNavigation === 'full' && (
        <nav className="mg-hub-example__global" aria-label={text.parentNav}>
          {text.global.map((label, index) => (
            <a
              key={label}
              href={
                [
                  'https://www.undrr.org/about-undrr',
                  'https://www.undrr.org/our-work',
                  'https://www.undrr.org/news',
                ][index]
              }
            >
              {label}
            </a>
          ))}
        </nav>
      )}
      <div className="mg-hub-example__shell">
        <nav
          className="mg-breadcrumb mg-hub-example__breadcrumbs"
          aria-label={text.breadcrumbs}
        >
          <ul>
            <li>
              <a href="https://www.undrr.org/">UNDRR</a>
            </li>
            {page !== 'landing' && (
              <li>
                <a href={href('landing')}>{text.landing}</a>
              </li>
            )}
            {detail && (
              <li>
                <a href={href('reporting')}>{text.sections[3]}</a>
              </li>
            )}
            {page === 'validate-data' && (
              <li>
                <a href={href('how-to-report')}>{text.how}</a>
              </li>
            )}
            <li aria-current="page">
              {page === 'overview' ? text.sections[0] : title}
            </li>
          </ul>
        </nav>
        {page !== 'landing' && (
          <div className="mg-hub-example__identity">
            <a className="mg-hub-example__name" href={href('overview')}>
              {text.hub}
            </a>
            <nav
              ref={navigation}
              className="mg-hub-example__navigation"
              aria-label={text.hubNav}
            >
              <ul>
                {sections.map((section, index) => (
                  <li key={section}>
                    <a
                      href={href(section)}
                      aria-current={
                        active === section
                          ? detail
                            ? 'location'
                            : 'page'
                          : undefined
                      }
                    >
                      {text.sections[index]}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        )}
        <main
          id={`${prefix}-content`}
          className="mg-hub-example__main"
          tabIndex={-1}
        >
          <div className="mg-hub-example__intro">
            <h1 ref={heading} tabIndex={-1}>
              {title}
            </h1>
            <p>
              {page === 'landing'
                ? text.landingIntro
                : page === 'overview'
                  ? text.intro
                  : page === 'how-to-report'
                    ? text.howIntro
                    : page === 'validate-data'
                      ? text.validationIntro
                      : page === 'reporting'
                        ? text.reportingIntro
                        : text.sectionIntro}
            </p>
          </div>
          {(page === 'landing' || page === 'overview') && (
            <>
              {page === 'landing' && (
                <TextCta
                  tone="soft"
                  centered={false}
                  headline={text.hub}
                  text={text.intro}
                  buttons={[{ label: text.open, url: href('overview') }]}
                />
              )}
              <section className="mg-hub-example__section">
                <h2>{text.related}</h2>
                <div className="mg-hub-example__cards">
                  <VerticalCard data={groupCards} />
                </div>
              </section>
            </>
          )}
          {page === 'reporting' && (
            <div className="mg-hub-example__cards">
              <VerticalCard
                data={[
                  {
                    title: text.how,
                    summaryText: text.howIntro,
                    link: href('how-to-report'),
                  },
                  {
                    title: text.validation,
                    summaryText: text.validationIntro,
                    link: href('validate-data'),
                  },
                ]}
              />
            </div>
          )}
          {detail && (
            <div
              className={`mg-hub-example__reading${showOnThisPage ? ' mg-hub-example__reading--with-contents' : ''}`}
            >
              {showOnThisPage && (
                <nav
                  className="mg-hub-example__contents"
                  aria-label={text.onPage}
                >
                  <p>{text.onPage}</p>
                  <ul>
                    {articleHeadings.map((label, index) => (
                      <li key={label}>
                        <a href={`${href(page)}/${index}`}>{label}</a>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
              <div className="mg-hub-example__article">
                {articleHeadings.map((label, index) => (
                  <section key={label} id={`${prefix}/${page}/${index}`}>
                    <h2>{label}</h2>
                    <p>
                      {
                        [text.cycleText, text.qualityText, text.focalText][
                          index
                        ]
                      }
                    </p>
                  </section>
                ))}
                <a
                  href={href(
                    page === 'how-to-report' ? 'validate-data' : 'reporting'
                  )}
                >
                  {page === 'how-to-report' ? text.next : text.back}
                </a>
              </div>
            </div>
          )}
          {['about', 'indicators', 'reports', 'data'].includes(page) && (
            <section className="mg-hub-example__section">
              <h2>{text.resources}</h2>
              <p>{text.reportText}</p>
              <a href="https://sendaimonitor.undrr.org/">{text.reportLink}</a>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

ContentHub.propTypes = {
  initialPage: PropTypes.oneOf(routes),
  parentNavigation: PropTypes.oneOf(['compact', 'full']),
  locale: PropTypes.string,
  showOnThisPage: PropTypes.bool,
  routePrefix: PropTypes.string,
};
