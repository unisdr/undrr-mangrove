import React, { useEffect } from 'react';
import { mgTabs } from '../../assets/js/tabs';

//import { BodyColumnTwo } from '../../../Molecules/BodyColumn/BodyColumn';

export function Tab({ tabdata }) {
  useEffect(() => {
    mgTabs();
  }, []);
  return (
    <div className="mg-tabs">
      <ul className="mg-tabs__list" data-mg-js-tabs>
        {tabdata.map((tab, index) => (
          <li key={index} className="mg-tabs__item">
            <a className="mg-tabs__link" href={`#mg-tabs__section-${tab.text_id}`}>{tab.text}</a>
          </li>
        ))}
      </ul>

      <div className="mg-tabs-content" data-mg-js-tabs-content>
        {tabdata.map((tab, index) => (
          <section className="mg-tabs__section" key={index}  id={`mg-tabs__section-${tab.text_id}`}>
              {tab.data}
          </section>  
        ))}
      </div>
    </div>
  );
}
