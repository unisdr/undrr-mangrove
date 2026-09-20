import { expect } from 'storybook/test';

/**
 * Browser-only regression fixture for the shared Arabic script profile.
 * Mounted outside the visible canvas during an existing language-boundary
 * story's play test, then removed even if an assertion fails. It exercises
 * the real compiled component selectors without adding catalogue examples.
 */
export function assertArabicTracking(canvasElement) {
  const fixture = document.createElement('section');
  fixture.lang = 'ar-SA';
  fixture.dir = 'rtl';
  fixture.inert = true;
  fixture.setAttribute('aria-hidden', 'true');
  fixture.dataset.trackingFixture = '';
  Object.assign(fixture.style, {
    position: 'fixed',
    left: '-10000px',
    top: '0',
    width: '400px',
  });
  // Fixed test markup only; no consumer or network input is interpolated.
  fixture.innerHTML = `
    <h1 data-tracking>الحد من مخاطر الكوارث</h1>
    <h6 data-tracking>مجتمعات آمنة وقادرة على الصمود</h6>
    <div class="mg-hero mg-hero--immersive"><div class="mg-hero__title" data-tracking>العمل معاً لبناء القدرة على الصمود</div></div>
    <p class="mg-stats-card-item__label" data-tracking>البلدان المشاركة</p>
    <div class="mg-cta"><p class="mg-cta__eyebrow" data-tracking>المشاركة في العمل</p></div>
    <ul class="menu"><li><a href="#tracking" data-tracking>معلومات إضافية</a></li></ul>
    <ul><li class="mg-mega-content__section-list-item"><a class="mg-mega-content__section-list-link" href="#tracking" data-tracking>مجالات العمل</a></li></ul>
    <p class="mg-search__result-type" data-tracking>منشور</p>
    <p class="mg-search__filter-chip-connector" data-tracking>و</p>
    <span class="mg-tag mg-tag--code" data-tracking>وثيقة</span>
    <span class="mg-badge mg-badge--code" data-tracking>بيانات</span>
    <table class="mg-table mg-table--data"><thead><tr><th scope="col" data-tracking>المصدر</th></tr></thead><tbody><tr><td>المكتب</td></tr></tbody></table>
    <pre data-language="مثال" data-tracking-pseudo><code>const locale = 'ar';</code></pre>
    <section lang="en" dir="ltr">
      <h1 data-tracking-latin>English inside Arabic</h1>
      <div class="mg-hero mg-hero--immersive"><div class="mg-hero__title" data-tracking-latin>Latin display tracking</div></div>
      <span class="mg-tag mg-tag--code" data-tracking-latin>JSON</span>
      <h1 lang="ar" dir="rtl" data-tracking>العربية داخل النص الإنجليزي</h1>
    </section>
  `;
  canvasElement.append(fixture);
  try {
    const arabic = fixture.querySelectorAll('[data-tracking]');
    expect(arabic).toHaveLength(13);
    for (const element of arabic) {
      expect(getComputedStyle(element).letterSpacing).toBe('normal');
    }
    expect(
      getComputedStyle(
        fixture.querySelector('[data-tracking-pseudo]'),
        '::after'
      ).letterSpacing
    ).toBe('normal');
    const latin = fixture.querySelectorAll('[data-tracking-latin]');
    expect(latin).toHaveLength(3);
    for (const element of latin) {
      expect(getComputedStyle(element).letterSpacing).not.toBe('normal');
      expect(getComputedStyle(element).letterSpacing).not.toBe('0px');
    }
  } finally {
    fixture.remove();
  }
}
