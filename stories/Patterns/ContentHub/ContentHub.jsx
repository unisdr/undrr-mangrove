import React, { useEffect, useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { VerticalCard } from '../../Components/Cards/Card/VerticalCard';
import { IconCard } from '../../Components/Cards/IconCard/IconCard';
import { TextCta } from '../../Components/TextCta/TextCta';
import TableOfContents from '../../Components/TableOfContents/TableOfContents';
import { Hero } from '../../Components/Hero/Hero';
import { HubHeader } from '../HubHeader/HubHeader';
import { UndrrChrome } from '../_shared/UndrrChrome';

const words = {
  english: {
    hub: 'Sendai Framework Monitor',
    sections: ['About', 'Indicators', 'Reporting', 'Reports', 'Data'],
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
    related: 'What would you like to do?',
    relatedIntro:
      'Three routes into the Monitor, whether you want to understand what is measured, prepare a report, or look at what countries have reported.',
    aboutHeading: 'What is the Sendai Framework Monitor?',
    aboutText:
      'The Sendai Framework Monitor is the official reporting system for disaster risk reduction. Member States use it to record progress against the seven global targets of the Sendai Framework, using a set of 38 internationally agreed indicators.',
    facts: [
      'The official monitoring system for the Sendai Framework',
      'Tracking progress in disaster risk reduction',
      'Based on internationally agreed indicators',
      'Connected to the Sustainable Development Goals',
      'Country-owned and country-reported data',
      'Open, transparent and publicly accessible',
    ],
    open: 'Open the Monitor',
    startReport: 'Start a report',
    reportingGuidance: 'Reporting guidance',
    cards: [
      'Learn how progress is measured and explore the global indicators.',
      'Prepare evidence and work through the reporting guidance.',
      'Find reports and explore what the evidence tells us.',
    ],
    back: 'Back to reporting',
    breadcrumbs: 'Breadcrumbs',
    hubNav: 'Sendai Framework Monitor sections',
    skip: 'Skip to page content',
    resources: 'Resources and guidance',
    reportLink: 'Visit the Sendai Framework Monitor',
    reportText: 'Use the reporting platform to work with your national data.',
    sectionIntro:
      'Explore guidance and resources for this part of the Monitor.',
  },
  arabic: {
    hub: 'مرصد إطار سنداي',
    sections: [
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
    related: 'ماذا تريد أن تفعل؟',
    relatedIntro:
      'ثلاثة مسارات للدخول إلى المرصد، سواء أردت فهم ما يُقاس أو إعداد تقرير أو الاطلاع على ما أبلغت عنه الدول.',
    aboutHeading: 'ما هو مرصد إطار سنداي؟',
    aboutText:
      'مرصد إطار سنداي هو النظام الرسمي للإبلاغ عن الحد من مخاطر الكوارث. تستخدمه الدول الأعضاء لتسجيل التقدم المحرز نحو الغايات العالمية السبع لإطار سنداي، باستخدام مجموعة من 38 مؤشراً متفقاً عليها دولياً.',
    facts: [
      'النظام الرسمي لرصد إطار سنداي',
      'متابعة التقدم في الحد من مخاطر الكوارث',
      'يستند إلى مؤشرات متفق عليها دولياً',
      'مرتبط بأهداف التنمية المستدامة',
      'بيانات مملوكة للدول ومقدمة منها',
      'مفتوح وشفاف ومتاح للجميع',
    ],
    open: 'افتح المرصد',
    startReport: 'ابدأ تقريراً',
    reportingGuidance: 'إرشادات إعداد التقارير',
    cards: [
      'تعرّف على كيفية قياس التقدم واستكشف المؤشرات العالمية.',
      'جهّز الأدلة واتبع إرشادات إعداد التقارير.',
      'اطّلع على التقارير واستكشف ما توضحه الأدلة.',
    ],
    back: 'العودة إلى إعداد التقارير',
    breadcrumbs: 'مسار التنقل',
    hubNav: 'أقسام مرصد إطار سنداي',
    skip: 'انتقل إلى محتوى الصفحة',
    resources: 'الموارد والإرشادات',
    reportLink: 'زيارة مرصد إطار سنداي',
    reportText: 'استخدم منصة إعداد التقارير للعمل على بياناتك الوطنية.',
    sectionIntro: 'استكشف الإرشادات والموارد لهذا القسم من المرصد.',
  },
};

// Same demonstration media the Hero stories use.
const heroVideo = {
  type: 'video',
  src: 'https://www.youtube.com/embed/lJWNmqYmKEQ',
  title: 'This is how timely early warnings save lives — UNDRR',
};

const heroImage =
  'https://www.undrr.org/sites/default/files/2023-11/resilient-infrastructure-pikoso-kz-shutterstock.jpg';

const sections = ['about', 'indicators', 'reporting', 'reports', 'data'];
const routes = [
  'landing',
  'overview',
  ...sections,
  'how-to-report',
  'validate-data',
];

/** Story-only composition. Hash routes keep navigation inside each mounted example. */
export function ContentHub({
  initialPage = 'overview',
  locale = 'english',
  showOnThisPage = true,
  withHero = false,
  heroSource = 'header',
  pageHeroMedia = 'image',
  headerSurface = 'primary',
  routeCards = 'icon',
  routePrefix,
}) {
  const text = words[locale] || words.english;
  const arabic = locale === 'arabic';
  const instanceId = useId();
  const prefix = routePrefix || `hub-${instanceId.replace(/:/g, '')}`;
  const [page, setPage] = useState(initialPage);
  const content = useRef(null);
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
    if (visited.current) content.current?.focus();
  }, [page]);

  useEffect(() => {
    const nav = navigation.current;
    const rail = nav?.querySelector('ul');
    const revealSection = () => {
      if (!rail) return;
      const selected = rail.querySelector('[data-hub-current]');
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
    // Drives the edge fades: CSS cannot detect overflow on its own.
    const markOverflow = () => {
      if (!nav || !rail) return;
      const start = Math.abs(rail.scrollLeft) > 1;
      const end =
        Math.abs(rail.scrollLeft) + rail.clientWidth < rail.scrollWidth - 1;
      nav.toggleAttribute('data-overflow-start', start);
      nav.toggleAttribute('data-overflow-end', end);
    };
    const update = () => {
      revealSection();
      markOverflow();
    };
    update();
    // Font and theme changes can resize labels after the first paint.
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    if (nav) {
      observer?.observe(nav);
      if (rail) observer?.observe(rail);
    }
    rail?.addEventListener('scroll', markOverflow, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      observer?.disconnect();
      rail?.removeEventListener('scroll', markOverflow);
      window.removeEventListener('resize', update);
    };
  }, [page, locale]);

  const intro =
    page === 'landing'
      ? text.landingIntro
      : page === 'overview'
        ? text.intro
        : page === 'how-to-report'
          ? text.howIntro
          : page === 'validate-data'
            ? text.validationIntro
            : page === 'reporting'
              ? text.reportingIntro
              : text.sectionIntro;
  // Ancestry is only worth a row when it says something the identity row and the
  // page heading do not. On the hub home, a section page or a first-level detail
  // page the trail merely repeats them. It earns its place on the landing page,
  // which has no hub navigation, and on pages deep enough to have an
  // intermediate parent that the section strip cannot show.
  const showBreadcrumbs = page === 'landing' || page === 'validate-data';
  // Not every hero earns a call to action: an overview page routes into the
  // tool, a reporting page starts the task, and a deeper reference page has no
  // single next step worth a button.
  const actions =
    page === 'overview'
      ? [{ label: text.open, url: 'https://sendaimonitor.undrr.org/' }]
      : page === 'how-to-report'
        ? [
            {
              label: text.startReport,
              url: 'https://sendaimonitor.undrr.org/',
            },
            {
              label: text.reportingGuidance,
              url: href('reporting'),
              type: 'Secondary',
            },
          ]
        : undefined;
  // A hero is only offered on the pages that would carry one in production.
  const hero = withHero && (page === 'overview' || detail);
  const headerHero = hero && heroSource === 'header';
  const pageHero = hero && heroSource === 'page';
  const articleHeadings =
    page === 'validate-data'
      ? text.validationSections
      : [text.cycle, text.quality, text.focal];
  const routeIcons = ['tags', 'file-alt', 'chart-bar'];
  const factIcons = [
    'globe',
    'chart-bar',
    'tags',
    'cubes',
    'lightbulb',
    'info-circle',
  ];
  const groupCards = [1, 2, 3].map((index, i) => ({
    title: text.sections[index],
    summaryText: text.cards[i],
    link: href(sections[index]),
    ...(routeCards === 'icon' && {
      icon: `mg-icon mg-icon-${routeIcons[i]}`,
    }),
  }));
  const RouteCards = routeCards === 'icon' ? IconCard : VerticalCard;

  return (
    <div lang={arabic ? 'ar' : 'en'} dir={arabic ? 'rtl' : undefined}>
      <a className="mg-demo-skip-link" href={`#${prefix}-content`}>
        {text.skip}
      </a>
      <UndrrChrome locale={locale} id={`${prefix}-header`} />
      <div className="mg-demo-shell | mg-container">
        {showBreadcrumbs && (
          <nav
            className="mg-breadcrumb | mg-u-font-size-250"
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
                  <a href={href('reporting')}>{text.sections[2]}</a>
                </li>
              )}
              {page === 'validate-data' && (
                <li>
                  <a href={href('how-to-report')}>{text.how}</a>
                </li>
              )}
              <li aria-current="page">
                {page === 'overview' ? text.hub : title}
              </li>
            </ul>
          </nav>
        )}
        {page !== 'landing' && (
          <HubHeader
            navRef={navigation}
            name={text.hub}
            nameHref={href('overview')}
            nameCurrent={page === 'overview'}
            navLabel={text.hubNav}
            variant={headerHero ? 'expressive' : 'compact'}
            actions={headerHero ? actions : undefined}
            surface={headerSurface}
            title={title}
            summary={intro}
            media={{ src: heroImage, alt: '' }}
            sections={sections.map((section, index) => ({
              label: text.sections[index],
              href: href(section),
              current: active === section && !detail,
              ancestor: active === section && detail,
            }))}
          />
        )}
        <main
          ref={content}
          id={`${prefix}-content`}
          className="mg-page-main | mg-container--spacer"
          tabIndex={-1}
        >
          {pageHero && (
            <Hero
              layout="split"
              split="2/3"
              headingLevel="h1"
              data={[
                {
                  title,
                  summaryText: intro,
                  buttons: actions?.map(a => ({
                    label: a.label,
                    url: a.url,
                    type: a.type || 'Primary',
                  })),
                  media:
                    pageHeroMedia === 'video'
                      ? heroVideo
                      : { type: 'image', src: heroImage, alt: '' },
                },
              ]}
            />
          )}
          {!hero && (
            <div className="mg-demo-intro">
              <h1>{title}</h1>
              <p>{intro}</p>
            </div>
          )}
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
              <section>
                <h2>{text.related}</h2>
                <p className="mg-demo-lede | mg-u-font-size-500">
                  {text.relatedIntro}
                </p>
                <div className={`mg-grid mg-grid__col-3`}>
                  <RouteCards
                    data={groupCards}
                    {...(routeCards === 'icon' && {
                      orientation: 'horizontal',
                    })}
                  />
                </div>
              </section>
              {page === 'overview' && (
                // Full-width tinted band, the alternating rhythm real UNDRR
                // landing pages are built from.
                <section className="mg-demo-band | mg-container-full-width mg-u-background-color--neutral-50">
                  <div>
                    <h2>{text.aboutHeading}</h2>
                    <p className="mg-demo-lede | mg-u-font-size-500">
                      {text.aboutText}
                    </p>
                    <div className="mg-grid mg-grid__col-3">
                      <IconCard
                        orientation="horizontal"
                        data={text.facts.map((fact, index) => ({
                          title: fact,
                          icon: `mg-icon mg-icon-${factIcons[index]}`,
                        }))}
                      />
                    </div>
                  </div>
                </section>
              )}
            </>
          )}
          {page === 'reporting' && (
            <div className="mg-grid mg-grid__col-2">
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
              className={`mg-reading${showOnThisPage ? ' mg-reading--with-contents' : ''}`}
            >
              {showOnThisPage && (
                <TableOfContents
                  key={`${page}-${locale}`}
                  title={text.onPage}
                  tocData={articleHeadings.map((label, index) => ({
                    id: `${prefix}/${page}/${index}`,
                    text: label,
                  }))}
                />
              )}
              <div className="mg-reading__article">
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
            <section>
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
  /** Page to render first, and the page the demo returns to on browser Back. */
  initialPage: PropTypes.oneOf(routes),
  /** Storybook locale key. `arabic` switches copy and sets `dir="rtl"`. */
  locale: PropTypes.string,
  /** Give the page a hero that carries the `h1` instead of a plain intro. */
  withHero: PropTypes.bool,
  /**
   * Where that hero comes from. `header` lets the hub header's banner be the
   * hero, so it is chrome. `page` keeps the header compact and places a separate
   * `Hero` block below it, the way body content would.
   */
  heroSource: PropTypes.oneOf(['header', 'page']),
  /**
   * Media for a `page` hero. `video` is the point of the comparison: it is
   * something a chrome-owned banner cannot be, so it makes the trade concrete.
   */
  pageHeroMedia: PropTypes.oneOf(['image', 'video']),
  /** Surface for the hub header. `detached` separates it from the banner below. */
  headerSurface: PropTypes.oneOf([
    'primary',
    'secondary',
    'tertiary',
    'detached',
  ]),
  /** Presentation for the route card group. Destinations are identical either way. */
  routeCards: PropTypes.oneOf(['vertical', 'icon']),
  /** Render the On this page sidebar on detail pages. */
  showOnThisPage: PropTypes.bool,
  /** Namespace for the demo's hash routes, so several examples can share a page. */
  routePrefix: PropTypes.string,
};
