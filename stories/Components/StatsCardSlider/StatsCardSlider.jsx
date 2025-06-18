import React from 'react';
// import './stats-card-slider.scss';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Scrollbar } from 'swiper/modules';
import { StatsCards } from '../../Components/Cards/StatsCards/StatsCards';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/scrollbar';

/**
 * @deprecated This component was part of the initial import from the UNDP implementation
 * and is likely to be either heavily modified or deleted. It is not part of the current
 * UNDRR distribution.
 */

// RTL Fix for Storybook.
let rtl = document.dir || undefined;
if (window.location.href.indexOf('direction=rtl') > -1) {
  rtl = 'rtl';
}

export function Statscardslider({ data }) {
  return (
    <div className="stats-slider" dir={rtl}>
      <Swiper
        modules={[Scrollbar]}
        spaceBetween={50}
        slidesPerView={1}
        scrollbar={{ draggable: true }}
        breakpoints={{
          768: {
            slidesPerView: 2,
          },
          1024: {
            slidesPerView: 4,
          },
        }}
      >
        {data.map((item, index) => (
          <SwiperSlide key={index}>
            <StatsCards
              number={item.numbername}
              percent={item.percentname}
              content={item.text}
              Size="Small"
              Hovercolors="yellow"
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
