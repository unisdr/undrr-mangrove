// import { Icons } from "./Icons";
import data from "./Icons.json";

export default {
  title: "Components/Icons",
  parameters: {
    viewMode: "docs",
    previewTabs: {
      canvas: {
        hidden: true,
      },
    },
  },
};

// Define a Template function to streamline icon rendering
const Template = (args) => (
  <div className="icons-container">
    {args.icons.map((item, index) => {
      let content;
      // content = <span class="`fa-${item.name}`" alt={item.label} />;
      let classNames =
        "mg-icon fa-" + item.name 
        // + (item.name.includes("animated") ? " animated" : "");
      content = (
        <span className={classNames}></span>
      ); // Assuming that icons use <i> for CSS-based icons
      return (
        <p key={index}>
          {content}
            &nbsp;<span>{item.label} <code>{classNames}</code></span>
        </p>
      );
    })}
  </div>
);

export const DefaultIcons = {
  render: Template,
  args: {
    icons: data.icons,
  },
  name: "Icons",
  parameters: {
    docs: {
      source: {
        code: data.icons
          .map((item) => {
            return `<span class="mg-icon fa-${item.name}${item.name.includes("animated") ? " animated" : ""}"></span>\n`;
          })
          .join(""),
      },
    },
  },
};
