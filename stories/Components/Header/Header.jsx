import MegaMenuDts from "../MegaMenuDts/MegaMenuDts";
import { Container } from "../../Atom/Layout/Container/Container";

const Header = ({ sections }) => {
  return (
    <header>
      <div className='mg-undrr-header'>Global header TBD</div>
      <Container>
        <div className='dts-header'>
          <div className='dts-header__logo'>
            <img src='images/dldt-logo-mark.svg' alt='DLDT logo mark'></img>
            <img src='images/dldt-logo-text.svg' alt='DLDT logo text' className='dts-header__logo-text'></img>
          </div>
          <div className='dts-header__main-menu'>
            <MegaMenuDts sections={sections} />
          </div>
        </div>
      </Container>
    </header>
  );
};

export default Header;