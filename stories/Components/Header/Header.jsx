import MegaMenuDts from "../MegaMenuDts/MegaMenuDts";
import { Container } from "../../Atom/Layout/Container/Container";

const Header = ({ sections }) => {
  return (
    <header>
      <div className='mg-undrr-header'>
        <div className="mg-undrr-header__decoration">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>

        <div className="mg-undrr-header__toolbar">
          <Container>
            <div className='mg-undrr-header__toolbar-container'>
              <a href="//www.undrr.org" rel="me" title="UNDRR Homepage">
                <img src='images/UNDRR-Logo-horizontal.svg' alt='UNDRR logo' height='32'></img>
              </a>
              <form action="" method="post">
                <select id="edit-lang-dropdown-select" name="" aria-label="Select your language">
                  <option value="en" selected="selected">English</option>
                  <option value="es">Spanish</option>
                </select>
              </form>
            </div>
          </Container>
        </div>
      </div>
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
      <div>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</div>
    </header>
  );
};

export default Header;