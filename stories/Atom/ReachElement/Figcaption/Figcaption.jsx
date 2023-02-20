import React from 'react';
import Img from '../../../assets/images/figcaption.png';
// import './figcaption.scss';

export const Figcaption = ({ details }) => {
  const image = {
    src: Img,
    alt: 'icon',
  };
  return (
    <figure>
      <img src={image.src} alt={image.alt} className="figcaption--img" />
      <figcaption>{details}</figcaption>
    </figure>
  );
};
