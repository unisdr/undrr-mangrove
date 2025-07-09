import React, { useState } from 'react';
import { Sidebardata } from '../../Molecules/SidebarData/SidebarData';
import { Heading } from '../../Atom/Typography/Heading/Heading';
// import './sidebar.scss';

/**
 * @deprecated This component was part of the initial import from the UNDP implementation
 * and is likely to be either heavily modified or deleted. It is not part of the current
 * UNDRR distribution.
 */

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(' ') : null;

export function Sidebar({ headerText, label, data, size, Height }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showSmall, setShowSmall] = useState(false);

  const toggleSidebarItem = index => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const toggleSmallMenu = () => {
    setShowSmall(!showSmall);
  };

  let height = '';
  if (Height == 'Narrow') {
    height = 'narrow';
  }

  const sidebarItems = [
    {
      type: 'data',
      component: <Sidebardata data={data} headerText={headerText} />,
    },
    { type: 'link', text: headerText },
    {
      type: 'data',
      component: <Sidebardata data={data} headerText={headerText} />,
    },
    { type: 'link', text: headerText },
    { type: 'link', text: headerText },
  ];

  return (
    <nav
      role="navigation"
      aria-label="Sidebar"
      className={cls(
        'sidebar-accordion',
        `${height}`,
        showSmall ? 'mg-u-responsive--show-small' : ''
      )}
    >
      <div className="grid-x">
        <div className={['cell', `${size}`].join(' ')}>
          <Heading type="6" label={label} onClick={toggleSmallMenu} />
          <ul style={{ display: showSmall ? 'block' : 'block' }}>
            {sidebarItems.map((item, index) => (
              <li
                key={index}
                aria-label="Sidebar heading"
                className={activeIndex === index ? 'active' : ''}
              >
                {item.type === 'data' ? (
                  <>
                    <button onClick={() => toggleSidebarItem(index)}>
                      {headerText}
                    </button>
                    <div
                      className="accordion__panel"
                      style={{
                        display: activeIndex === index ? 'block' : 'none',
                      }}
                    >
                      {item.component}
                    </div>
                  </>
                ) : (
                  <a
                    href="#"
                    onClick={e => {
                      e.preventDefault();
                      toggleSidebarItem(index);
                    }}
                  >
                    {item.text}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
