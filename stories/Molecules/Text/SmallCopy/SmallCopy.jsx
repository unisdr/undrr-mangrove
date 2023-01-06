import React from 'react';
import './smallcopy.scss';

export function Smallcopy({
  locationName, phoneName, phonenumber, emailName, emailid,
}) {
  return (
    <>
      <div className="smallcopy__box-locale">
        {locationName}
      </div>
      <div className="smallcopy__box">
        {phoneName}
        <a href={[`tel:${phonenumber}`]} type="tel">{phonenumber}</a>
      </div>
      <div className="smallcopy__box">
        {emailName}
        <a href={[`mailto:${emailid}`]}>{emailid}</a>
      </div>
    </>
  );
}
