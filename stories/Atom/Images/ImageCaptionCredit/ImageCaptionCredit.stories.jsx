import { Images } from "./ImageCaptionCredit";
import sample_imagelg from "../../../assets/images/sample_image-lg.jpg";
import sample_imagemd from "../../../assets/images/sample_image-md.jpg";
import sample_imagesm from "../../../assets/images/sample_image-sm.jpg";

const getCaptionForLocale = (locale) => {
  switch (locale) {
    case "english":
      const engText = {
        label: ["UNDRR/Ghana", <br />, <strong>Alex Mensah Tenkorang</strong>],
        paragraph:
          "This is a sample text to go along with the imagery of the story",
      };
      return engText;
    case "arabic":
      const arabicText = {
        label: [
          "برنامج الأمم المتحدة الإنمائي / أنغولا",
          <br />,
          <strong>جيروم بيل</strong>,
        ],
        paragraph:
          "الألم بحد ذاته يسبب الكثير من الألم ، لكن التركيز الأساسي ينصب على العميل. Morbi lorem tortor، fermentum eu lorem at، venenatis malesuada laughter.",
      };
      return arabicText;
    case "burmese":
      const burmeseText = {
        label: ["UNDRR/အန်ဂိုလာ", <br />, <strong>ဂျရုမ်း ဘဲလ်</strong>],
        paragraph:
          "နာကျင်မှုကိုယ်တိုင်က နာကျင်ပေမယ့် အဓိက အာရုံစိုက်တာက ဖောက်သည်အပေါ်ပါ။ Morbi lorem tortor, fermentum eu lorem at, venenatis malesuada ရယ်မောခြင်း။",
      };
      return burmeseText;
    case "japanese":
      const japaneseText = {
        label: ["UNDRR /アンゴラ", <br />, <strong>ジェロームベル</strong>],
        paragraph:
          "痛み自体は多くの痛みですが、主な焦点は顧客にあります。 Morbi lorem tortor、fermentum eu lorem at、venenatismalesuadaの笑い声。",
      };
      return japaneseText;
    default:
      return {
        label: ["UNDRR/Ghana", <br />, <strong>Alex Mensah Tenkorang</strong>],
        paragraph:
          "This is a sample text to go along with the imagery of the story",
      };
  }
};

export default {
  title: "Components/Images/Image with credit + caption",

  argTypes: {
    size: {
      options: ["wide", "medium", "portrait"],

      control: {
        type: "inline-radio",
      },

      defaultValue: "wide",
    },

    caption: {
      options: ["true", "false"],

      control: {
        type: "inline-radio",
      },

      defaultValue: "true",
    },

    credit: {
      options: ["true", "false"],

      control: {
        type: "inline-radio",
      },

      defaultValue: "true",
    },
  },
};

export const DefaultImageWithCreditCaption = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);

    return (
      <Images
        imagelg={sample_imagelg}
        imagemd={sample_imagemd}
        imagesm={sample_imagesm}
        alt="farmland"
        label={caption.label}
        paragraph={caption.paragraph}
        {...args}
      ></Images>
    );
  },

  name: "Image with credit + caption",

  parameters: {
    docs: {
      source: {
        code: `<div class="grid-x image-section">
    <div class="cell image__cart medium-12">
      <img
        src="static/media/stories/assets/images/farmland-lg.jpg"
        alt="farmland"
      />
    </div>
    <div class="cell image__description medium-7">
      <figcaption class="image__caption">
        <p>
          We provide tools such as the DRR Community site PreventionWeb, publications on good practices, and the Global Assessment Report (GAR)
        </p>
        <div class="image--author">
          <span class="author__caption author--label">UNDRR/Ghana</span>
          <span class="author__caption author--name">Firstname Lastname</span>
        </div>
      </figcaption>
    </div>
    </div>`,
      },
    },
  },
};
