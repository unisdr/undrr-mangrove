import React, { Fragment } from "react";
// import './hero.scss';
// import '../../../assets/scss/_grid.scss';
import { CtaButton } from "../Buttons/CtaButton/CtaButton";
// import imgPath from '../../../assets/images/hero_background.png';

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(" ") : null;

export const variantOptions = {
  primary: "",
  secondary: "secondary",
  tertiary: "tertiary",
  quaternary: "quaternary",
};

export function ChildHero({ data, variant }) {
  let variantActive = variantOptions[`${variant}`];
  return (
    <>
      {data.map((item, index) => (
        <section
          key={index}
          className={cls(
            "mg-hero",
            "mg-hero--child",
            "mg-hero--" + `${variantActive}`,
          )}
          style={{ backgroundImage: `url(${item.imgback})` }}
        >
          <div key={index} className="mg-hero__overlay">
            <article className="mg-hero__content">
              <div className="mg-hero__meta">
                <a href={item.link} className="mg-hero__label">
                  {item.label}
                </a>
              </div>

              <header className="mg-hero__title">
                <a href="#" className="text-xxl">
                  {item.title}
                </a>
              </header>

              <div className="mg-hero__summaryText">{item.summaryText}</div>

              <div className="mg-hero__buttons">
                <CtaButton type="Primary" label={item.primary_button} />
                {/* <a href={item.link} className="mg-hero__button mg-hero__button-primary">{item.primary_button}</a> */}
              </div>
            </article>
          </div>
        </section>
      ))}
    </>
  );
}

ChildHero.defaultParameters = {
  variant: "primary",
};
