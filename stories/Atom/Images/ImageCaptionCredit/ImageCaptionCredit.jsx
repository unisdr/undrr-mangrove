import React from 'react';
// import './image-caption-credit.scss';
import { Imagecaption } from '../../../Molecules/ImageCaption/ImageCaption';

export const Images = ({
  imagelg,
  imagemd,
  imagesm,
  alt,
  label,
  paragraph,
  size: sizeProp = 'wide',
  caption = 'true',
  credit = 'true',
}) => {
  const sizeModifiers = { medium: 'mg-image-figcaption--medium', portrait: 'mg-image-figcaption--portrait' };
  const size = sizeModifiers[sizeProp] || '';

  const cls = (...classes) =>
    classes.filter(Boolean).length > 0
      ? classes.filter(Boolean).join(' ')
      : null;

  return (
    <figure className={cls('mg-image-figcaption', `${size}`)}>
      <div className="mg-image-figcaption__cart">
        {sizeProp === 'wide' && <img src={imagelg} alt={alt} />}
        {sizeProp === 'medium' && <img src={imagemd} alt={alt} />}
        {sizeProp === 'portrait' && <img src={imagesm} alt={alt} />}
      </div>

      {caption === 'false' && credit === 'false' ? (
        <></>
      ) : (
        <Imagecaption
          label={label}
          paragraph={paragraph}
          caption={caption}
          credit={credit}
        />
      )}
    </figure>
  );
};
