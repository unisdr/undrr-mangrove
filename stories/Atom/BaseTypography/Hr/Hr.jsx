import React from 'react';
import { P } from '../Paragraph/Paragraph';
// import '../../../assets/scss/_typography.scss';

export const Hr = ({ detail }) => (
  <>
    <P detail={detail} />
    <hr />
    <P detail={detail} />
    <hr />
  </>
);
