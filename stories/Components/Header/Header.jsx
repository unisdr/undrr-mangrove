import MegaMenu from "../MegaMenu/MegaMenu";

const Header = ({ title, sections }) => {
  return (
    <header>
      <div>Global header</div>
      <div className='mg-'>
        <div>
          {/* <img src='static/media/stories/assets/images/farmland-lg.jpg' alt='DLDT logo mark'></img> */}
        </div>
        <MegaMenu sections={sections} />
      </div>
    </header>
  );
};

export default Header;