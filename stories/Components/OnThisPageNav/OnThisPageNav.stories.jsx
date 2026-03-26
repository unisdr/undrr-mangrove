import React, { useEffect, useRef } from 'react';
import OnThisPageNav from './OnThisPageNav';
import { mgOnThisPageNav } from '../../assets/js/on-this-page-nav';

export default {
  title: 'Components/On this page nav',
  component: OnThisPageNav,
  parameters: {
    docs: {
      description: {
        component:
          'A sticky horizontal navigation bar that links to page sections with scroll-spy highlighting. Supports auto-detected headings or explicit author-provided links, with optional CTA button.',
      },
    },
  },
};

/**
 * Helper: generates placeholder paragraph content for scroll demos.
 */
const SectionContent = () => (
  <>
    <p>
      Disaster risk reduction is the concept and practice of reducing disaster
      risks through systematic efforts to analyse and reduce the causal factors
      of disasters. Reducing exposure to hazards, lessening vulnerability of
      people and property, wise management of land and the environment, and
      improving preparedness and early warning for adverse events are all
      examples of disaster risk reduction.
    </p>
    <p>
      The Sendai Framework for Disaster Risk Reduction 2015-2030 outlines seven
      clear targets and four priorities for action to prevent new and reduce
      existing disaster risks. It aims to achieve the substantial reduction of
      disaster risk and losses in lives, livelihoods and health. The framework
      was adopted at the Third United Nations World Conference on Disaster Risk
      Reduction, held in Sendai, Japan, in March 2015.
    </p>
    <p>
      Building resilience to disasters requires an understanding of risk in all
      its dimensions of vulnerability, capacity, exposure of persons and assets,
      hazard characteristics and the environment. Such knowledge can be
      leveraged for the purpose of pre-disaster risk assessment, for prevention
      and mitigation, and for the development and implementation of appropriate
      preparedness and effective response to disasters.
    </p>
  </>
);

/**
 * Hook: initializes the vanilla JS on a scoped container ref.
 * Avoids the querySelector scoping bug where only the first nav inits
 * when multiple stories render on the Docs page.
 */
function useOnThisPageNav(wrapperRef) {
  useEffect(() => {
    if (!wrapperRef.current) return;
    const nav = wrapperRef.current.querySelector('[data-mg-on-this-page-nav]');
    if (nav) {
      delete nav.dataset.mgOnThisPageNavInitialized;
      mgOnThisPageNav([nav]);
    }
  }, []);
}

/**
 * Auto-detect mode: the nav is placed below introductory content inside
 * a container. As you scroll past, it docks to the top of the viewport
 * and spans full width. The nav scans h2 headings and highlights the
 * active section as you scroll.
 */
export const AutoDetect = {
  render: () => {
    const ref = useRef(null);
    useOnThisPageNav(ref);

    return (
      <div ref={ref}>
        <div
          style={{
            background: 'linear-gradient(135deg, #004f91 0%, #00afae 100%)',
            color: 'white',
            padding: '3rem 2rem',
          }}
        >
          <h1 style={{ margin: '0 0 1rem', fontSize: '2rem' }}>
            Global assessment report on disaster risk reduction
          </h1>
          <p style={{ margin: 0, maxWidth: '700px', opacity: 0.9 }}>
            The GAR is the flagship report of the United Nations on worldwide
            efforts to reduce disaster risk. This edition examines how
            cascading and systemic risks are reshaping the disaster landscape.
          </p>
        </div>

        <div
          className="mg-container"
          style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem 1rem 0' }}
        >
          <p>
            This report presents findings from a two-year consultation process
            involving national governments, regional organizations, the
            private sector, civil society, and academia.
          </p>
        </div>

        <article className="mg-auto-detect-demo">
          <nav
            data-mg-on-this-page-nav
            data-mg-on-this-page-nav-content=".mg-auto-detect-demo"
            className="mg-on-this-page-nav"
          />

          <div
            className="mg-container"
            style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1rem' }}
          >
            <h2 id="overview">Overview</h2>
            <SectionContent />

            <h2 id="sendai-framework">Sendai Framework</h2>
            <SectionContent />

            <h2 id="targets-and-indicators">Targets and indicators</h2>
            <SectionContent />

            <h2 id="implementation">Implementation</h2>
            <SectionContent />

            <h2 id="monitoring-and-review">Monitoring and review</h2>
            <SectionContent />

            <h2 id="stakeholder-engagement">Stakeholder engagement</h2>
            <SectionContent />
          </div>
        </article>
      </div>
    );
  },
};

/**
 * Auto-detect with H3 headings: set depth to "3" to include both h2 and
 * h3 headings in the navigation.
 */
export const WithNestedHeadings = {
  render: () => {
    const ref = useRef(null);
    useOnThisPageNav(ref);

    return (
      <article className="mg-nested-demo" ref={ref}>
        <nav
          data-mg-on-this-page-nav
          data-mg-on-this-page-nav-depth="3"
          data-mg-on-this-page-nav-content=".mg-nested-demo"
          className="mg-on-this-page-nav"
        />

        <div style={{ padding: '0 1rem' }}>
          <h2 id="introduction">Introduction</h2>
          <SectionContent />

          <h3 id="background">Background</h3>
          <SectionContent />

          <h3 id="scope">Scope</h3>
          <SectionContent />

          <h2 id="methodology">Methodology</h2>
          <SectionContent />

          <h3 id="data-collection">Data collection</h3>
          <SectionContent />

          <h2 id="findings">Findings</h2>
          <SectionContent />
        </div>
      </article>
    );
  },
  name: 'With nested headings (H2 + H3)',
};

/**
 * Explicit mode: author-provided links rather than auto-detection.
 * The nav items and CTA are defined directly.
 */
export const ExplicitLinks = {
  render: () => {
    const ref = useRef(null);
    useOnThisPageNav(ref);

    return (
      <article ref={ref}>
        <nav data-mg-on-this-page-nav className="mg-on-this-page-nav">
          <ul className="mg-on-this-page-nav__list">
            <li className="mg-on-this-page-nav__item">
              <a href="#about" className="mg-on-this-page-nav__link">
                About
              </a>
            </li>
            <li className="mg-on-this-page-nav__item">
              <a href="#team" className="mg-on-this-page-nav__link">
                Team
              </a>
            </li>
            <li className="mg-on-this-page-nav__item">
              <a href="#contact" className="mg-on-this-page-nav__link">
                Contact
              </a>
            </li>
          </ul>
        </nav>

        <div style={{ padding: '0 1rem' }}>
          <h2 id="about">About</h2>
          <SectionContent />

          <h2 id="team">Team</h2>
          <SectionContent />

          <h2 id="contact">Contact</h2>
          <SectionContent />
        </div>
      </article>
    );
  },
  name: 'Explicit links',
};

/**
 * Auto-detect mode with a CTA button pinned to the right.
 * The CTA is preserved when the nav generates its links.
 */
export const WithCTA = {
  render: () => {
    const ref = useRef(null);
    useOnThisPageNav(ref);

    return (
      <article className="mg-cta-demo" ref={ref}>
        <nav
          data-mg-on-this-page-nav
          data-mg-on-this-page-nav-content=".mg-cta-demo"
          className="mg-on-this-page-nav"
        >
          <a href="#subscribe" className="mg-on-this-page-nav__cta">
            Subscribe to updates
          </a>
        </nav>

        <div style={{ padding: '0 1rem' }}>
          <h2 id="latest-news">Latest news</h2>
          <SectionContent />

          <h2 id="publications">Publications</h2>
          <SectionContent />

          <h2 id="events">Events</h2>
          <SectionContent />

          <h2 id="resources">Resources</h2>
          <SectionContent />
        </div>
      </article>
    );
  },
  name: 'With CTA button',
};

/**
 * Demonstrates heading exclusion. The "Internal notes" heading has the
 * mg-on-this-page-nav--exclude class and does not appear in the nav.
 */
export const WithExcludedHeading = {
  render: () => {
    const ref = useRef(null);
    useOnThisPageNav(ref);

    return (
      <article className="mg-exclude-demo" ref={ref}>
        <nav
          data-mg-on-this-page-nav
          data-mg-on-this-page-nav-content=".mg-exclude-demo"
          className="mg-on-this-page-nav"
        />

        <div style={{ padding: '0 1rem' }}>
          <h2 id="section-a">Section A</h2>
          <SectionContent />

          <h2 id="internal-notes" className="mg-on-this-page-nav--exclude">
            Internal notes (excluded)
          </h2>
          <SectionContent />

          <h2 id="section-b">Section B</h2>
          <SectionContent />
        </div>
      </article>
    );
  },
  name: 'With excluded heading',
};

/**
 * Demonstrates horizontal overflow with many nav items. On narrow
 * viewports the list scrolls horizontally, with the active link
 * auto-scrolled into view.
 */
export const ManyItems = {
  render: () => {
    const ref = useRef(null);
    useOnThisPageNav(ref);

    const sections = [
      'Executive summary',
      'Background and context',
      'Methodology and approach',
      'Risk assessment findings',
      'Vulnerability analysis',
      'Capacity and resources',
      'Recommendations',
      'Implementation roadmap',
      'Monitoring framework',
      'Annexes and references',
    ];

    return (
      <article className="mg-many-demo" ref={ref}>
        <nav
          data-mg-on-this-page-nav
          data-mg-on-this-page-nav-content=".mg-many-demo"
          className="mg-on-this-page-nav"
        >
          <a href="#download" className="mg-on-this-page-nav__cta">
            Download report
          </a>
        </nav>

        <div style={{ padding: '0 1rem' }}>
          {sections.map((title, i) => {
            const id = title.toLowerCase().replace(/\s+/g, '-');
            return (
              <React.Fragment key={i}>
                <h2 id={id}>{title}</h2>
                <SectionContent />
              </React.Fragment>
            );
          })}
        </div>
      </article>
    );
  },
  name: 'Many items (horizontal overflow)',
};

/**
 * Demonstrates the offset custom property for pages with a fixed header
 * above the sticky nav. Set --mg-on-this-page-nav-offset to the header
 * height so the nav docks below it.
 */
export const WithOffset = {
  render: () => {
    const ref = useRef(null);
    useOnThisPageNav(ref);

    return (
      <article className="mg-offset-demo" ref={ref}>
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 12,
            background: '#004f91',
            color: 'white',
            padding: '1rem',
            fontWeight: 600,
          }}
        >
          Simulated fixed header (80px)
        </div>

        <nav
          data-mg-on-this-page-nav
          data-mg-on-this-page-nav-content=".mg-offset-demo"
          className="mg-on-this-page-nav"
          style={{ '--mg-on-this-page-nav-offset': '80px' }}
        />

        <div style={{ padding: '0 1rem' }}>
          <h2 id="offset-section-1">First section</h2>
          <SectionContent />

          <h2 id="offset-section-2">Second section</h2>
          <SectionContent />

          <h2 id="offset-section-3">Third section</h2>
          <SectionContent />
        </div>
      </article>
    );
  },
  name: 'With scroll offset',
};

/**
 * RTL layout: the nav list flows right-to-left and the CTA pins
 * to the left (logical end). Uses Arabic heading text.
 */
export const RTL = {
  render: () => {
    const ref = useRef(null);
    useOnThisPageNav(ref);

    return (
      <div dir="rtl" lang="ar" ref={ref}>
        <article className="mg-rtl-demo">
          <nav
            data-mg-on-this-page-nav
            data-mg-on-this-page-nav-content=".mg-rtl-demo"
            data-mg-on-this-page-nav-label="في هذه الصفحة"
            className="mg-on-this-page-nav"
          >
            <a href="#subscribe-ar" className="mg-on-this-page-nav__cta">
              اشترك
            </a>
          </nav>

          <div style={{ padding: '0 1rem' }}>
            <h2 id="overview-ar">نظرة عامة</h2>
            <SectionContent />

            <h2 id="framework-ar">إطار سنداي</h2>
            <SectionContent />

            <h2 id="implementation-ar">التنفيذ</h2>
            <SectionContent />

            <h2 id="monitoring-ar">الرصد والاستعراض</h2>
            <SectionContent />
          </div>
        </article>
      </div>
    );
  },
};
