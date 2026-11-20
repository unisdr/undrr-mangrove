import React, { useEffect } from 'react';
import { ShowMore } from './ShowMore';
import { mgShowMore } from '../../assets/js/show-more';
import { expect, waitFor } from 'storybook/test';

const getCaptionForLocale = locale => {
  switch (locale) {
    case 'english':
      const engText = {
        showMoreData: [
          {
            button_text: 'Show more button text',
            collapsable_wrapper_class: 'show-more-wrapper-class',
            collapsable_text:
              'As the UN Office for Disaster Risk Reduction, UNDRR convenes partners and coordinates activities to create safer, more resilient communities. As the UN Office for Disaster Risk Reduction, UNDRR convenes partners and coordinates activities to create safer, more resilient communities. As the UN Office for Disaster Risk Reduction, UNDRR convenes partners and coordinates activities to create safer, more resilient communities. ',
          },
        ],
      };
      return engText.showMoreData;
    case 'arabic':
      const arabicText = {
        showMoreData: [
          {
            button_text: 'عرض المزيد',
            collapsable_wrapper_class: 'show-more-wrapper-class',
            collapsable_text:
              'بصفته مكتب الأمم المتحدة للحد من مخاطر الكوارث، يجمع المكتب الشركاء وينسق الأنشطة لإنشاء مجتمعات أكثر أمانًا ومرونة. بصفته مكتب الأمم المتحدة للحد من مخاطر الكوارث، يجمع المكتب الشركاء وينسق الأنشطة لإنشاء مجتمعات أكثر أمانًا ومرونة.',
          },
        ],
      };
      return arabicText.showMoreData;
    case 'japanese':
      const japaneseText = {
        showMoreData: [
          {
            button_text: 'Needs translation',
            collapsable_wrapper_class: 'show-more-wrapper-class',
            collapsable_text:
              'ダミーテキストとは、Webサイトのモックアップを埋めるために使用されるコンテンツの一部を指します。このテキストは、WebデザイナーがWebサイトが完成品としてどのように見えるかをよりよく想像するのに役立ちます。ダミーテキストには何の意味もないことを理解することが重要です。その唯一の目的は、著作権を侵害することなく、「単語のような」コンテンツで空白を埋めることです。',
          },
        ],
      };
      return japaneseText.showMoreData;
    default:
      const dummy = {
        showMoreData: [
          {
            button_text: 'Show more button text',
            collapsable_wrapper_class: 'show-more-wrapper-class',
            collapsable_text:
              'As the UN Office for Disaster Risk Reduction, UNDRR convenes partners and coordinates activities to create safer, more resilient communities. As the UN Office for Disaster Risk Reduction, UNDRR convenes partners and coordinates activities to create safer, more resilient communities. As the UN Office for Disaster Risk Reduction, UNDRR convenes partners and coordinates activities to create safer, more resilient communities. ',
          },
        ],
      };
      return dummy.showMoreData;
  }
};

export default {
  title: 'Components/ShowMore',
  component: ShowMore,
};

export const DefaultShowMore = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);

    return (
      <div
        style={{
          maxWidth: '250px',
          backgroundColor: '#f0e6d3',
          padding: '1rem',
        }}
      >
        <ShowMore
          data={caption}
          {...(locale === 'arabic'
            ? { labelCollapsed: 'عرض المزيد', labelOpen: 'عرض أقل' }
            : locale === 'japanese'
              ? { labelCollapsed: 'もっと見る', labelOpen: '表示を減らす' }
              : {})}
        />
      </div>
    );
  },

  name: 'ShowMore',
};

function DetachedShowMore() {
  useEffect(() => {
    mgShowMore();
  }, []);

  return (
    <div style={{ maxWidth: '400px' }}>
      <div
        className="detached-content"
        style={{
          backgroundColor: '#f0e6d3',
          padding: '1rem',
          marginBottom: '1rem',
        }}
      >
        <p>
          As the UN Office for Disaster Risk Reduction, UNDRR convenes partners
          and coordinates activities to create safer, more resilient
          communities. As the UN Office for Disaster Risk Reduction, UNDRR
          convenes partners and coordinates activities to create safer, more
          resilient communities. As the UN Office for Disaster Risk Reduction,
          UNDRR convenes partners and coordinates activities to create safer,
          more resilient communities.
        </p>
      </div>
      <p style={{ marginBottom: '1rem', fontStyle: 'italic' }}>
        The button below is outside the content container. It targets the
        content using <code>data-mg-show-more-target</code>.
      </p>
      <button
        type="button"
        className="mg-button mg-button-primary mg-show-more--button"
        data-mg-show-more="true"
        data-mg-show-more-target=".detached-content"
        data-mg-show-more-label-open="Show less"
        data-mg-show-more-label-collapsed="Show more"
      >
        Show more
      </button>
    </div>
  );
}

export const DetachedButton = {
  render: () => <DetachedShowMore />,
  name: 'Detached button',
};

const blockText =
  'As the UN Office for Disaster Risk Reduction, UNDRR convenes partners and coordinates activities to create safer, more resilient communities. As the UN Office for Disaster Risk Reduction, UNDRR convenes partners and coordinates activities to create safer, more resilient communities.';

const twoOnOnePageData = [
  {
    button_text: 'Show more',
    collapsable_wrapper_class: 'show-more-wrapper-class',
    collapsable_text: `First React block. ${blockText}`,
  },
  {
    button_text: 'Show more',
    collapsable_wrapper_class: 'show-more-wrapper-class',
    collapsable_text: `Second React block. ${blockText}`,
  },
];

function VanillaPair() {
  useEffect(() => {
    mgShowMore();
  }, []);

  return (
    <React.Fragment>
      {['First', 'Second'].map(label => (
        <section key={label} style={{ marginBottom: '1rem' }}>
          <div
            className="mg-show-more--container"
            style={{ backgroundColor: '#f0e6d3', padding: '1rem' }}
          >
            <p>
              {label} vanilla block. {blockText}
            </p>
          </div>
          <button
            type="button"
            className="mg-button mg-button-primary mg-show-more--button"
            data-mg-show-more="true"
            data-mg-show-more-label-open="Show less"
            data-mg-show-more-label-collapsed="Show more"
          >
            Show more
          </button>
        </section>
      ))}
    </React.Fragment>
  );
}

export const TwoOnOnePage = {
  name: 'Two on one page',
  render: () => (
    <div style={{ maxWidth: '400px' }}>
      <h3 className="mg-heading-300">Two vanilla toggles</h3>
      <p>
        Neither toggle names a target, so both fall back to the default{' '}
        <code>.mg-show-more--container</code> selector. Each pair sits in its
        own <code>&lt;section&gt;</code>, which is what lets each toggle resolve
        the block beside it rather than the first one on the page.
      </p>
      <VanillaPair />
      <h3 className="mg-heading-300">Two React items</h3>
      <p>
        Both items share one <code>collapsable_wrapper_class</code>. Each toggle
        still reveals its own content.
      </p>
      <ShowMore data={twoOnOnePageData} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Two instances of each path on one page. The vanilla toggles resolve their target nearest-ancestor first — each pair is wrapped in its own section, which is what separates them — and each React item carries a minted id, so neither pair collides.',
      },
    },
  },
};

const shortText =
  'This collection brings together key articles on the 2024 wildfire season in Canada.';

export const OnlyWhenLong = {
  name: 'Only when long',
  render: () => (
    // Collapse to eight lines of the content's own line height.
    <div style={{ maxWidth: '400px', '--mg-show-more-height': '8lh' }}>
      <h3 className="mg-heading-300">Short content</h3>
      <ShowMore
        minHiddenLines={6}
        data={[
          {
            collapsable_wrapper_class: 'show-more-wrapper-class',
            collapsable_text: shortText,
          },
        ]}
      />
      <h3 className="mg-heading-300">Long content</h3>
      <ShowMore
        minHiddenLines={6}
        data={[
          {
            collapsable_wrapper_class: 'show-more-wrapper-class',
            collapsable_text: `${blockText} ${blockText} ${blockText}`,
          },
        ]}
      />
    </div>
  ),
};

// Items mode: a true disclosure over whole list items.
const reports = [
  'Global Assessment Report 2025',
  'Words into Action: nature-based solutions',
  'Early warnings for all: progress report',
  'Sendai Framework midterm review',
  'Scaling up disaster risk reduction in humanitarian action',
  'Gender action plan to support the Sendai Framework',
];

export const ItemsMode = {
  name: 'Items mode (true disclosure)',
  // Hidden items must stay searchable: normalize's [hidden] { display: none }
  // once hid them from find-in-page, so beforematch never fired.
  play: async ({ canvasElement }) => {
    const toggle = canvasElement.querySelector('[data-mg-show-more-mode]');
    await waitFor(() => expect(toggle.hidden).toBe(false));
    const hiddenItem = canvasElement.querySelector('[data-mg-show-more-item]');
    expect(hiddenItem.getAttribute('hidden')).toBe('until-found');
    const view = canvasElement.ownerDocument.defaultView;
    expect(view.getComputedStyle(hiddenItem).display).not.toBe('none');
    expect(hiddenItem.getBoundingClientRect().height).toBe(0);
    // Searchable while hidden. window.find() doesn't fire beforematch the
    // way the browser's find bar does, so dispatch it for the open path.
    view.getSelection().removeAllRanges();
    expect(view.find(hiddenItem.textContent)).toBe(true);
    view.getSelection().removeAllRanges();
    hiddenItem.dispatchEvent(new Event('beforematch', { bubbles: true }));
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    toggle.click(); // Leave it collapsed, as it loads.
  },
  render: () => (
    <div style={{ maxWidth: '480px' }}>
      <h3 className="mg-heading-300">Related reports</h3>
      <ShowMore
        mode="items"
        visibleItems={3}
        labelCollapsed="Show all 6 reports"
        labelOpen="Show fewer reports"
        data={[
          {
            collapsable_wrapper_class: 'show-more-items-list',
            collapsable_items: reports,
          },
        ]}
      />
    </div>
  ),
};
