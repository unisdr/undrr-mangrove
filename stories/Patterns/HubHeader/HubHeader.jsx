import React from 'react';
import PropTypes from 'prop-types';
import { CtaButton } from '../../Components/Buttons/CtaButton/CtaButton';

/**
 * Identity and section navigation for a content hub, with an optional
 * expressive treatment for pages that want the weight of a hero.
 *
 * The dependency runs this way deliberately. Identity and navigation are the
 * required parts; hero-like presentation is a variant of this component rather
 * than this component being a variant of `Hero`. A page that should not lead
 * with a photograph — a deep guidance page, say — drops to `compact` and keeps
 * its navigation, which would not be possible if the links lived inside a hero.
 *
 * The navigation keeps its own solid surface above the banner rather than
 * sitting on the image. `mg-hero` forces every descendant anchor to white, so
 * links placed over editor-chosen media have contrast nobody can predict.
 */

// DSFR states its equivalent limit in the type rather than the prose —
// `There should be at most three of them` sits on Header's quickAccessItems.
// Borrowing the discipline, but not the mechanism: React 19 no longer calls
// propTypes at all, so a validator declared there would never run. This is
// checked during render instead, in development only.
const MAX_SECTIONS = 7;

function warnAboutContract({ sections, navLabel, name }) {
  if (process.env.NODE_ENV === 'production') return;
  const complain = message => console.error(`HubHeader: ${message}`);

  if (sections.length > MAX_SECTIONS) {
    complain(
      `${sections.length} sections is past the ${MAX_SECTIONS} this row can carry. ` +
        'Long translated labels push it into scrolling; consider fewer, better-named sections.'
    );
  }
  const marked = sections.filter(section => section.current);
  if (marked.length > 1) {
    complain(
      `${marked.length} sections are marked \`current\`. Only one can be the page the reader is on.`
    );
  }
  const both = sections.find(section => section.current && section.ancestor);
  if (both) {
    complain(
      `"${both.label}" is marked both \`current\` and \`ancestor\`. ` +
        'A page cannot contain itself — use `current` alone.'
    );
  }
  if (name && !navLabel.includes(name)) {
    complain(
      `\`navLabel\` should name the hub, as in "${name} sections". ` +
        'A page can carry several navigation landmarks, and a generic label leaves them indistinguishable.'
    );
  }
}

export function HubHeader({
  name,
  nameHref,
  nameCurrent = false,
  sections,
  navLabel,
  variant = 'compact',
  surface = 'primary',
  title,
  summary,
  media,
  actions,
  headingLevel: Heading = 'h1',
  navRef,
}) {
  const expressive = variant === 'expressive';
  warnAboutContract({ sections, navLabel, name });

  return (
    <div
      className={`mg-hub-header mg-hub-header--${variant} mg-hub-header--surface-${surface}`}
    >
      <div className="mg-hub-header__bar">
        <div className="mg-hub-header__identity | mg-container">
          <a
            className="mg-hub-header__name"
            href={nameHref}
            aria-current={nameCurrent ? 'page' : undefined}
          >
            {name}
          </a>
          <nav
            ref={navRef}
            className="mg-hub-header__nav"
            aria-label={navLabel}
          >
            <ul>
              {sections.map(section => (
                <li
                  key={section.href}
                  className={
                    section.ancestor
                      ? 'mg-hub-header__nav-item--ancestor'
                      : undefined
                  }
                >
                  <a
                    href={section.href}
                    aria-current={section.current ? 'page' : undefined}
                    // Marks both states for the consumer's scroll-into-view,
                    // which must not depend on the ARIA semantics now that an
                    // ancestor is deliberately not announced.
                    data-hub-current={
                      section.current || section.ancestor ? '' : undefined
                    }
                  >
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {expressive && (
        <div className="mg-hub-header__banner">
          <div className="mg-hub-header__banner-inner | mg-container">
            <div className="mg-hub-header__copy">
              <Heading className="mg-hub-header__title">{title}</Heading>
              {summary && <p className="mg-hub-header__summary">{summary}</p>}
              {actions?.length > 0 && (
                <div className="mg-hub-header__actions">
                  {actions.map(action => (
                    <CtaButton
                      key={action.url}
                      Type={action.type || 'Primary'}
                      Variant="CTA"
                      label={action.label}
                      href={action.url}
                    />
                  ))}
                </div>
              )}
            </div>
            {media && (
              <div className="mg-hub-header__media">
                <img src={media.src} alt={media.alt || ''} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

HubHeader.propTypes = {
  /** The hub's own name, shown on every page of the hub. */
  name: PropTypes.string.isRequired,
  /** Where the name links to, normally the hub home. */
  nameHref: PropTypes.string.isRequired,
  /** Mark the name as the current page, on the hub home itself. */
  nameCurrent: PropTypes.bool,
  /**
   * Section links, at most seven. `current` marks the exact page and is
   * announced as `aria-current="page"`. `ancestor` marks a section that merely
   * contains the current page: styled the same, announced not at all, because a
   * second "current" in one landmark tells a screen-reader user they are
   * somewhere they are not. GOV.UK's service navigation draws the line the same
   * way.
   */
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      href: PropTypes.string.isRequired,
      current: PropTypes.bool,
      ancestor: PropTypes.bool,
    })
  ).isRequired,
  /** Accessible name for the navigation landmark. Must name the hub. */
  navLabel: PropTypes.string.isRequired,
  /** `compact` is identity and links only; `expressive` adds the banner. */
  variant: PropTypes.oneOf(['compact', 'expressive']),
  /**
   * Surface for the whole header. Unified by default: the bar shares the
   * banner's colour and bleeds to the viewport edges, so the two read as one
   * block while staying separate containers. `detached` keeps the navigation on
   * the page background instead. The colour values use the same tokens `Hero`
   * does, so a header and a hero set to the same one match in every theme.
   */
  surface: PropTypes.oneOf(['primary', 'secondary', 'tertiary', 'detached']),
  /** Banner heading. Required when `variant` is `expressive`. */
  title: PropTypes.string,
  /** Banner supporting text. */
  summary: PropTypes.string,
  /**
   * Calls to action for the banner, at most two. Uses the same `CtaButton` the
   * hero does, so a hub page's primary action looks like one anywhere else.
   */
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['Primary', 'Secondary']),
    })
  ),
  /** Banner image. Omit for a text-only banner that still carries weight. */
  media: PropTypes.shape({
    src: PropTypes.string.isRequired,
    alt: PropTypes.string,
  }),
  /** Heading level for the banner title. */
  headingLevel: PropTypes.oneOf(['h1', 'h2']),
  /** Ref onto the navigation element, for keeping the active section in view. */
  navRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
};
