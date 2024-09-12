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

export const DefaultIcons = {
  render: () => (
    <div className="icons-container">
      {data.icons.map((item, index) => {
        if (item.type == "img") {
          return (
            <div key={index}>
              <img src={`icons/${item.name}.svg`} alt="icon" />
              <p>{`${item.label}`}</p>
            </div>
          );
        }

        if ((item.name == "download-animated", "chevron-right-animated")) {
          return (
            <div key={index}>
              <span className={`${item.name}`}>
                <i></i>
              </span>
              <p>{`${item.label}`}</p>
            </div>
          );
        } else {
          return (
            <div key={index}>
              <span className={`${item.name}`}></span>
              <p>{`${item.label}`}</p>
            </div>
          );
        }
      })}
    </div>
  ),

  name: "Icons",

  parameters: {
    docs: {
      source: {
        code: data.icons
          .map((item) => {
            if (item.type == "img") {
              return `<img src="icons/${item.name}.svg" alt="icon"/>\n`;
            } else {
              return `<span class="${item.name}"></span>\n`;
            }
          })
          .join(""),
      },
    },
  },
};
