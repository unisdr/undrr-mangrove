import React, { useEffect } from 'react';
import { mgShowMore } from '../../assets/js/show-more';

export function ShowMore({ data }) {
  useEffect(() => {
    mgShowMore();
  }, []);
  return (
    <React.Fragment>
      {' '}
      {data.map((item, index) => (
        <React.Fragment>
          <div class={item.collapsable_wrapper_class}>
            {item.collapsable_text}
          </div>
          <a
            href="#"
            class="mg-button mg-button-primary mg-show-more--button"
            data-mg-show-more="true"
            data-mg-show-more-target={`.${item.collapsable_wrapper_class}`}
            data-mg-show-more-label-open="Show less themes"
            data-mg-show-more-label-collapsed="Show more themes"
          >
            {item.button_text}
          </a>
        </React.Fragment>
      ))}
    </React.Fragment>
  );
}
