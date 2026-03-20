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
      <a
        href="#"
        className="mg-button mg-button-primary mg-show-more--button"
        data-mg-show-more="true"
        data-mg-show-more-target=".detached-content"
        data-mg-show-more-label-open="Show less"
        data-mg-show-more-label-collapsed="Show more"
      >
        Show more
      </a>
    </div>
  );
}

export const DetachedButton = {
  render: () => <DetachedShowMore />,
  name: 'Detached button',
};
