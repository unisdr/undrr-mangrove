import MegaMenu from "../MegaMenu/MegaMenu";

const Header = ({ sections }) => {
  return (
    <header>
      <div className='mg-undrr-header'>Global header TBD</div>
      <div className='mg-dldt-header'>
        <div className='mg-dldt-header__logo'>
          <img src='images/dldt-logo-mark.svg' alt='DLDT logo mark'></img>
        </div>
        <div className='mg-dldt-header__menu'>
          <MegaMenu sections={sections} />
        </div>
      </div>
    </header>
  );
};

export default Header;