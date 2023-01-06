import React from 'react';
import Img from '../../../assets/images/figcaption.jpg';
import './figcaption.scss';

export function Figcaption({ details }) {
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
}
