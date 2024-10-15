import MegaMenu from "../MegaMenu/MegaMenu";
import { Container } from "../../Atom/Layout/Container/Container";

const Header = ({ sections }) => {
  return (
    <header>
      <div className='mg-undrr-header'>Global header TBD</div>
      <Container>
        <div className='mg-dldt-header'>
          <div className='mg-dldt-header__logo'>
            <img src='images/dldt-logo-mark.svg' alt='DLDT logo mark'></img>
            <img src='images/dldt-logo-text.svg' alt='DLDT logo text' className='mg-dldt-header__logo-text'></img>
          </div>
          <div className='mg-dldt-header__menu'>
            <MegaMenu sections={sections} />
          </div>
        </div>
      </Container>
    </header>
  );
};

export default Header;