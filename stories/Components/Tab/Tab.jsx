import React, { useEffect } from 'react';
import { mgTabs } from '../../assets/js/tabs';

export function Tab({ tabdata, variant }) {
  console.log(tabdata);
  useEffect(() => {
    mgTabs();
  }, []);
  return (
    <div className={`mg-tabs ${variant === 'stacked' ? 'mg-tabs--stacked' : 'mg-tabs--horizontal'}`}>
      <ul className="mg-tabs__list" data-mg-js-tabs>
        {tabdata.map((tab, index) => (
          <>
            <li key={index} className="mg-tabs__item">
              <a className="mg-tabs__link" href={`#mg-tabs__section-${tab.text_id}`}>{tab.text}</a>
            </li>
            <li className="mg-tabs-content" data-mg-js-tabs-content>
              <section className="mg-tabs__section" id={`mg-tabs__section-${tab.text_id}`}>
                {tab.data}
              </section>
            </li>
          </>
        ))}
      </ul>
    </div>
  );
}
