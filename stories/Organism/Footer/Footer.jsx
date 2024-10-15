import React, { useEffect } from 'react';
// import './footer.scss';
// import '../../assets/scss/_grid.scss';
import { FooterLogo } from '../../Molecules/FooterNavigation/FooterLogo/FooterLogo';
// import { SignUp } from '../../Components/Forms/NewsLetterSignUp/NewsLetterSignUp';
import { FooterLists } from '../../Molecules/FooterNavigation/FooterLists/FooterLists';
import { FooterConditions } from '../../Molecules/FooterNavigation/FooterConditions/FooterConditions';
import { FooterConditions2 } from '../../Molecules/FooterNavigation/FooterConditions2/FooterConditions2';
import { FooterIcons } from '../../Molecules/FooterNavigation/FooterIcons/FooterIcons';
import { P } from '../../Atom/BaseTypography/Paragraph/Paragraph';
import { accordion } from '../../assets/js/accordion';
import { Icons } from '../../Atom/Icons/Icons';
// import IconsGlobe from '../../assets/icons/globe.svg';
// import IconsGlobeWhite from '../../assets/icons/globe-white.svg';
// import IconsSearch from '../../assets/icons/search.svg';
// import IconsSearchWhite from '../../assets/icons/search-white.svg';

const cls = (...classes) => ((classes.filter(Boolean).length > 0) ? classes.filter(Boolean).join(' ') : null);

export function Footer({
  headerText, headerText2, style, alt, src, srctwo, logolink, element, type, required, mode, label, button, errorText, placeholder, menutitle, copyright, data, menudata, variant, ...args
}) {
  useEffect(() => {
    accordion('[data-accordion="mobile"]', '.footer-panel', 'active');
  }, []);
  return (
    <>
      <p>To be determined...</p>
    </>
  );
}

Footer.defaultProps = {
  color: 'default',
  variant: 'default',
};
