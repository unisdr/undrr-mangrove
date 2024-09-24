import React from "react";
import { CtaButton } from "../Buttons/CtaButton/CtaButton";

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(" ") : null;

export const variantOptions = {
  primary: "",
  secondary: "secondary",
  tertiary: "tertiary",
  quaternary: "quaternary",
};

export function Hero({ data, variant }) {
  let variantActive = variantOptions[`${variant}`];
  return (
    <>
      {data.map((item, index) => (
        <section
          key={index}
          className={cls("mg-hero", "mg-hero--" + `${variantActive}`)}
          style={{ backgroundImage: `url(${item.imgback})` }}
        >
          <div className="mg-hero__overlay">
            <article className="mg-hero__content">
              <div className="mg-hero__meta">
                {item.label && (
                  <a href={item.link || "#"} className="mg-hero__label">
                    {item.label}
                  </a>
                )}
              </div>

              <header className="mg-hero__title">
                {item.link ? (
                  <a href={item.link} className="text-xxl">
                    <span dangerouslySetInnerHTML={{ __html: item.title }} />
                  </a>
                ) : (
                  <h1 className="text-xxl">
                    <span dangerouslySetInnerHTML={{ __html: item.title }} />
                  </h1>
                )}
              </header>

              <div className="mg-hero__summaryText">
                <span dangerouslySetInnerHTML={{ __html: item.summaryText }} />
              </div>

              <div className="mg-hero__meta meta-detail">
                {item.detail && (
                  <a href={item.link || "#"} className="mg-hero__label detail">
                    {item.detail}
                  </a>
                )}
              </div>

              <div className="mg-hero__buttons">
                <CtaButton Type="Primary" label={item.primary_button} />
                <CtaButton Type="Secondary" label={item.secondary_button} />
              </div>
            </article>
          </div>
        </section>
      ))}
    </>
  );
}

Hero.defaultParameters = {
  variant: "primary",
};
