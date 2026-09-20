import React from 'react';
import { expect } from 'storybook/test';

const TypographyIntegrationExample = () => {
  return (
    <section className="sb-unstyled mg-container mg-content">
      <h1>Typography integration</h1>

      <p>
        This page demonstrates common typography elements together, to validate
        spacing, especially list indentation. Tracked in{' '}
        <a href="https://gitlab.com/undrr/web-backlog/-/issues/2444">
          web-backlog#2444
        </a>
        .
      </p>

      <h2>Headings and paragraphs</h2>

      <div>
        <h3>Section heading</h3>
        <p>
          UNDRR (formerly UNISDR) is the United Nations focal point for disaster
          risk reduction. UNDRR oversees the implementation of the Sendai
          Framework for Disaster Risk Reduction 2015–2030, supporting countries
          in its implementation, monitoring, and knowledge sharing. This
          paragraph is long on purpose to verify typographic rhythm, wrapping
          behavior, and spacing to the lists and components below, including
          link styling like <a href="https://example.com">this inline link</a>.
          This paragraph is long on purpose to verify typographic rhythm,
          wrapping behavior, and spacing to the lists and components below,
          including link styling like{' '}
          <a href="https://example.com">this inline link</a>. This paragraph is
          long on purpose to verify typographic rhythm, wrapping behavior, and
          spacing to the lists and components below, including link styling like{' '}
          <a href="https://example.com">this inline link</a>.
        </p>
      </div>

      <h2>Unordered list</h2>

      <section className="mg-grid mg-grid__col-3">
        <div>
          <p>Preceding paragraph</p>
          <ul>
            <li>
              Bullet item one with a little text to wrap and check hanging
              indent one with a little text to wrap and check hanging indent one
              with a little text to wrap and check hanging indent one with a
              little text to wrap and check hanging indent.
            </li>
            <li>Bullet item two</li>
            <li>
              Bullet item three with nested list
              <ul>
                <li>Nested item a</li>
                <li>Nested item b</li>
              </ul>
            </li>
          </ul>
          <p>Trailing paragraph</p>
        </div>
      </section>

      <h2>Abbreviation</h2>

      <p>
        We use{' '}
        <abbr title="United Nations Office for Disaster Risk Reduction">
          UNDRR
        </abbr>{' '}
        to refer to the office. Another common abbreviation is{' '}
        <abbr title="Cascading Style Sheets">CSS</abbr>.
      </p>

      <h2>Blockquote and cite</h2>

      <blockquote>
        “UNDRR oversees the implementation of the Sendai Framework for Disaster
        Risk Reduction 2015–2030.”
      </blockquote>
      <cite>- Firstname Lastname</cite>

      <h2>Code and code block</h2>

      <p>
        Use <code>length()</code> on a <code>String</code> to get the character
        count.
      </p>
      <pre>
        <code>{`const text = 'Mangrove';
const count = text.length;
// count === 8`}</code>
      </pre>

      <h2>Mark</h2>

      <p>
        Highlight <mark>important text</mark> within a sentence to draw
        attention.
      </p>

      <h2>Details</h2>

      <details className="mg-details">
        <summary>The Sendai Framework</summary>
        <p>
          The framework is the global roadmap for reducing human and economic
          loss as a direct result of disasters.
        </p>
        <ul>
          <li>Priority 1: Understanding disaster risk</li>
          <li>Priority 2: Strengthening disaster risk governance</li>
        </ul>
      </details>

      <h2>Figcaption</h2>

      <figure>
        <figcaption>
          As the UN Office for Disaster Risk Reduction, UNDRR convenes partners
          and coordinates activities to create safer, more resilient
          communities.
        </figcaption>
      </figure>

      <h2>Quotation</h2>

      <p>
        As noted,{' '}
        <q>
          The Sendai Framework is the global roadmap for reducing human and
          economic loss as a direct result of disasters.
        </q>
      </p>

      <h2>Small</h2>

      <p>
        <small>© UNDRR</small>
      </p>

      <h2>Description list</h2>

      <dl>
        <dt>UNDRR</dt>
        <dd>
          United Nations Office for Disaster Risk Reduction. Leads on disaster
          risk reduction and supports Sendai Framework implementation.
        </dd>
        <dt>Sendai Framework</dt>
        <dd>
          A 2015–2030 global agreement to reduce disaster risk and loss in
          lives, livelihoods, and health.
        </dd>
      </dl>

      <p>Trailing paragraph</p>

      <h2>Ordered list</h2>

      <section className="mg-grid mg-grid__col-3">
        <div>
          <p>Preceding paragraph</p>
          <ol>
            <li>
              First item with enough text to wrap to the next line with enough
              text to wrap to the next line with enough text to wrap to the next
              line with enough text to wrap to the next line
            </li>
            <li>Second item</li>
            <li>
              Third item with nested
              <ol>
                <li>Nested 1</li>
                <li>Nested 2</li>
              </ol>
            </li>
          </ol>
          <p>Trailing paragraph</p>
        </div>
      </section>

      <h2>Font size utilities</h2>

      <p>
        Utility classes for overriding font size on any element. Each class
        scales responsively from a smaller mobile size to the target size at the
        medium breakpoint (48em).
      </p>

      <p className="mg-u-font-size-150">
        Font size 150: fine print (1.125rem). Terms, conditions, and
        supplementary notes.
      </p>

      <p className="mg-u-font-size-200">
        Font size 200: small text (1.25rem). Captions, metadata, and secondary
        information.
      </p>

      <p className="mg-u-font-size-250">
        Font size 250: intermediate (1.4rem). Bridge between small text and body
        copy.
      </p>

      <p className="mg-u-font-size-300">
        Font size 300: base body size (1.6rem), no responsive scaling. UNDRR
        oversees the implementation of the Sendai Framework for Disaster Risk
        Reduction 2015–2030.
      </p>

      <p className="mg-u-font-size-400">
        Font size 400: slightly larger (1.6rem → 1.8rem). Supporting countries
        in implementation, monitoring, and knowledge sharing.
      </p>

      <p className="mg-u-font-size-500">
        Font size 500: medium emphasis (1.8rem → 2.3rem). Reducing existing risk
        and preventing the creation of new risk.
      </p>

      <p className="mg-u-font-size-600">
        Font size 600: large (2.3rem → 3.2rem). Building resilience.
      </p>

      <p className="mg-u-font-size-800">
        Font size 800: display (3.2rem → 3.6rem). Global targets.
      </p>

      <p className="mg-u-font-size-900">
        Font size 900: hero (3.6rem → 4rem). Sendai.
      </p>

      <h3>Applied to headings</h3>

      <h2 className="mg-u-font-size-900">H2 with font-size-900</h2>
      <h3 className="mg-u-font-size-600">H3 with font-size-600</h3>
      <h4 className="mg-u-font-size-400">H4 with font-size-400</h4>

      <h3>Mixed with other utilities</h3>

      <p className="mg-u-font-size-500 mg-u-color--blue-700">
        Font size 500 combined with blue-700 text color for callout text.
      </p>

      <div
        className="mg-u-background-color--neutral-50"
        style={{ padding: '1.5rem' }}
      >
        <p className="mg-u-font-size-600" style={{ margin: 0 }}>
          Font size 600 on a neutral background (useful for hero sections or
          pull quotes).
        </p>
      </div>

      <h2>RTL list check</h2>

      <div dir="rtl">
        <ul>
          <li>عنصر قائمة</li>
          <li>عنصر قائمة</li>
        </ul>
      </div>
    </section>
  );
};

export default {
  title: 'Components/Typography/Typography integration example',
  component: TypographyIntegrationExample,
};

export const Default = {
  render: () => <TypographyIntegrationExample />,
};

export const ArabicTracking = {
  name: 'Arabic tracking and language islands',
  render: () => (
    <section lang="ar-SA" dir="rtl" className="mg-container">
      <h1 data-tracking>الحد من مخاطر الكوارث</h1>
      <h6 data-tracking>مجتمعات آمنة وقادرة على الصمود</h6>
      <div
        className="mg-hero mg-hero--immersive mg-hero--contained"
        style={{ minHeight: 0, '--mg-hero-banner-block-size': '0px' }}
      >
        <div className="mg-hero__overlay">
          <div className="mg-hero__title" data-tracking>
            العمل معاً لبناء القدرة على الصمود
          </div>
        </div>
      </div>
      <p className="mg-stats-card-item__label" data-tracking>
        البلدان المشاركة
      </p>
      <div className="mg-cta">
        <p className="mg-cta__eyebrow" data-tracking>
          المشاركة في العمل
        </p>
      </div>
      <ul className="menu">
        <li>
          <a href="#tracking" data-tracking>
            معلومات إضافية
          </a>
        </li>
      </ul>
      <ul>
        <li className="mg-mega-content__section-list-item">
          <a
            className="mg-mega-content__section-list-link"
            href="#tracking"
            data-tracking
          >
            مجالات العمل
          </a>
        </li>
      </ul>
      <p className="mg-search__result-type" data-tracking>
        منشور
      </p>
      <p className="mg-search__filter-chip-connector" data-tracking>
        و
      </p>
      <span className="mg-tag mg-tag--code" data-tracking>
        وثيقة
      </span>
      <span className="mg-badge mg-badge--code" data-tracking>
        بيانات
      </span>
      <table className="mg-table mg-table--data">
        <thead>
          <tr>
            <th scope="col" data-tracking>
              المصدر
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>المكتب</td>
          </tr>
        </tbody>
      </table>
      <pre data-language="مثال" data-tracking-pseudo>
        <code>const locale = 'ar';</code>
      </pre>
      <section lang="en" dir="ltr">
        <h1 data-tracking-latin>English inside Arabic</h1>
        <div
          className="mg-hero mg-hero--immersive mg-hero--contained"
          style={{ minHeight: 0, '--mg-hero-banner-block-size': '0px' }}
        >
          <div className="mg-hero__overlay">
            <div className="mg-hero__title" data-tracking-latin>
              Latin display tracking
            </div>
          </div>
        </div>
        <span className="mg-tag mg-tag--code" data-tracking-latin>
          JSON
        </span>
        <h1 lang="ar" dir="rtl" data-tracking>
          العربية داخل النص الإنجليزي
        </h1>
      </section>
    </section>
  ),
  play: async ({ canvasElement }) => {
    for (const element of canvasElement.querySelectorAll('[data-tracking]')) {
      expect(getComputedStyle(element).letterSpacing).toBe('normal');
    }
    expect(
      getComputedStyle(
        canvasElement.querySelector('[data-tracking-pseudo]'),
        '::after'
      ).letterSpacing
    ).toBe('normal');
    for (const element of canvasElement.querySelectorAll(
      '[data-tracking-latin]'
    )) {
      expect(getComputedStyle(element).letterSpacing).not.toBe('normal');
      expect(getComputedStyle(element).letterSpacing).not.toBe('0px');
    }
  },
};
