import React from 'react';
// import './image-caption.scss';
import { Imagecredit } from '../../Atom/Images/ImageCredit/ImageCredit';
import { P } from '../../Atom/BaseTypography/Paragraph/Paragraph';

export const caption_options = {
  true: '',
  false: '',
};

export const credit_options = {
  true: '',
  false: '',
};

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(' ') : null;

export function Imagecaption({ label, paragraph, caption = 'true', credit = 'true' }) {
  const caption_variant = caption_options[caption];
  const credit_variant = credit_options[credit];

  return (
    <>
      {caption === 'false' && credit === 'false' ? (
        <></>
      ) : (
        <figcaption
          className={cls(
            'mg-image-caption',
            caption_variant,
            credit_variant
          )}
        >
          {caption === 'true' && <P label={paragraph} />}
          {credit === 'true' && <Imagecredit label={label} name={name} />}
        </figcaption>
      )}
    </>
  );
}
