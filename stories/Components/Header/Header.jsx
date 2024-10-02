import MegaMenu from "../MegaMenu/MegaMenu";
import "./Header.scss";

const Header = ({ title, sections }) => {
  return (
    <div class="mg-header-wrapper">
      <div>{title}</div>
      <div>
        <MegaMenu sections={sections} />
      </div>
    </div>
  );
};

export default Header;
