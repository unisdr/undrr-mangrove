import { Icons } from "./Icons";
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
      if (item.type === "img") {
        content = <img src={`icons/${item.name}.svg`} alt={item.label} />;
      } else {
        // For animated or other special icons, additional class names can be conditionally added
        let classNames =
          item.name + (item.name.includes("animated") ? " animated" : "");
        content = (
          <span className={classNames}>
            <i></i>
          </span>
        ); // Assuming that icons use <i> for CSS-based icons
      }
      return (
        <div key={index}>
          {content}
          <p>{item.label}</p>
        </div>
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
            if (item.type === "img") {
              return `<img src="icons/${item.name}.svg" alt="${item.label}" />\n`;
            }
            return `<span class="${item.name}${item.name.includes("animated") ? " animated" : ""}"><i></i></span>\n`;
          })
          .join(""),
      },
    },
  },
};
