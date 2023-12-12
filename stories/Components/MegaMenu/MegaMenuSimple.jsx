import { useState } from "react";
import { CtaButton } from "../Buttons/CtaButton/CtaButton";
import "./megamenu.scss"
import { RecursiveListMenu } from "./RecursiveMegaMenuItem/RecursiveMegaMenuItem";

export function MegaMenuSimple() {
  const sections = [
    {
      title: 'Highlights',
      bannerHeading: 'Highlights',
      bannerDescription: 'Gaze upon statistics in wonder...',
      items: [
        {
          title: 'Item 1',
          url: '#',
          items: [
            {
              title: 'Sub-item 1',
              url: '#'
            },
            {
              title: 'Sub-item 2',
              url: '#',
              items: [
                {
                  title: 'Sub-item 3',
                  url: '#'
                },
                {
                  title: 'Sub-item 4',
                  url: '#'
                },  
              ]
            },
          ]
        },
        {
          title: 'Item 1',
          url: '#',
          items: [
            {
              title: 'Sub-item 1',
              url: '#'
            },
            {
              title: 'Sub-item 2',
              url: '#',
              items: [
                {
                  title: 'Sub-item 3',
                  url: '#'
                },
                {
                  title: 'Sub-item 4',
                  url: '#'
                },  
              ]
            },
          ]
        },
      ]
    },
  ]

  const [section, setSection] = useState(null)

  return (
    <div 
      className="mg-mega-wrapper"
    >
      {/* Topbar */}
      <div className="mg-mega-topbar">
        {
          sections.map((item, index) => (
            <div 
              key={index}
              className="mg-mega-topbar__item"
              onMouseEnter={() => setSection(item)}
            > 
              { item.title }
            </div>
          ))
        }
      </div>
      {/* Content */}
      {
        section && (
          <div className="mg-mega-content">
          <div className="mg-mega-content__left">
            <div className="mg-mega-content__banner">
              <h1>{section.bannerHeading}</h1>
              <p>{section.bannerDescription}</p>
              <CtaButton label="Learn more" className="button" />
            </div>
          </div>
          <div className="mg-mega-content__right">
            <RecursiveListMenu items={section.items} />
          </div>
        </div>
        )
      }
    </div>
  )
}
