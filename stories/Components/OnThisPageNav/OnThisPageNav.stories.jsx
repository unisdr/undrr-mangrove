import React, { useEffect } from 'react';
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
 * Auto-detect mode: the nav scans h2 headings from the content and
 * generates links automatically. Scroll down to see the active state
 * update as each section enters the viewport.
 */
export const AutoDetect = {
  render: () => {
    useEffect(() => {
      const nav = document.querySelector('[data-mg-on-this-page-nav]');
      if (nav) {
        delete nav.dataset.mgOnThisPageNavInitialized;
        mgOnThisPageNav([nav]);
      }
    }, []);

    return (
      <article className="mg-auto-detect-demo">
        <nav
          data-mg-on-this-page-nav
          data-mg-on-this-page-nav-content=".mg-auto-detect-demo"
          className="mg-on-this-page-nav"
        />

        <div style={{ padding: '0 1rem' }}>
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
    );
  },
};

/**
 * Auto-detect with H3 headings: set depth to "3" to include both h2 and
 * h3 headings in the navigation.
 */
export const WithNestedHeadings = {
  render: () => {
    useEffect(() => {
      const nav = document.querySelector('[data-mg-on-this-page-nav]');
      if (nav) {
        delete nav.dataset.mgOnThisPageNavInitialized;
        mgOnThisPageNav([nav]);
      }
    }, []);

    return (
      <article className="mg-nested-demo">
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
    useEffect(() => {
      const nav = document.querySelector('[data-mg-on-this-page-nav]');
      if (nav) {
        delete nav.dataset.mgOnThisPageNavInitialized;
        mgOnThisPageNav([nav]);
      }
    }, []);

    return (
      <article>
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
    useEffect(() => {
      const nav = document.querySelector('[data-mg-on-this-page-nav]');
      if (nav) {
        delete nav.dataset.mgOnThisPageNavInitialized;
        mgOnThisPageNav([nav]);
      }
    }, []);

    return (
      <article className="mg-cta-demo">
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
    useEffect(() => {
      const nav = document.querySelector('[data-mg-on-this-page-nav]');
      if (nav) {
        delete nav.dataset.mgOnThisPageNavInitialized;
        mgOnThisPageNav([nav]);
      }
    }, []);

    return (
      <article className="mg-exclude-demo">
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
