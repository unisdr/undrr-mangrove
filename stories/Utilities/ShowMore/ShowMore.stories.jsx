import React, { useEffect } from 'react';
import { ShowMore } from './ShowMore';
import { mgShowMore } from '../../assets/js/show-more';

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
        <ShowMore data={caption}></ShowMore>
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
