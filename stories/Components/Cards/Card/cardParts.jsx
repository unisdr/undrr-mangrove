import React from 'react';
import PropTypes from 'prop-types';

/**
 * Normalise a card destination, returning null when there isn't a usable one.
 *
 * Cards should almost always be links, but editors and upstream systems
 * produce unlinked ones. Drupal Gutenberg in particular emits `href=""`, which
 * resolves to the current page: the browser treats it as a real link, so it
 * takes focus, and the stretched overlay on the title swallows clicks aimed at
 * the card's own button. An empty or whitespace-only value therefore counts as
 * no link at all rather than as a link to nowhere.
 *
 * @param {unknown} value Candidate destination.
 * @returns {string|null} The destination, or null when the card is unlinked.
 */
export function resolveCardLink(value) {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

/**
 * Card title. Renders an anchor when the card has a destination and plain text
 * when it does not, so an unlinked card carries none of the link affordances —
 * no chevron, no stretched click target, no interactive colour.
 */
export function CardTitle({ title, link = null, target, rel }) {
  const text = title?.trim();

  return (
    <header className="mg-card__title">
      {link ? (
        <a href={link} target={target} rel={rel}>
          {text}
        </a>
      ) : (
        text
      )}
    </header>
  );
}

CardTitle.propTypes = {
  /** Title text. */
  title: PropTypes.string,
  /** Resolved card destination, or null when the card is unlinked. */
  link: PropTypes.string,
  /** Anchor target, applied only to linked titles. */
  target: PropTypes.string,
  /** Anchor rel, applied only to linked titles. */
  rel: PropTypes.string,
};

/**
 * Card metadata label. Stays visible on an unlinked card, but drops the
 * interactive modifier so it doesn't invite a click it can't answer.
 */
export function CardLabel({ label, link = null }) {
  if (!label) {
    return null;
  }

  return link ? (
    <a href={link} className="mg-card__label mg-card__label--active">
      {label}
    </a>
  ) : (
    <span className="mg-card__label">{label}</span>
  );
}

CardLabel.propTypes = {
  /** Label text. Nothing renders without it. */
  label: PropTypes.string,
  /** Resolved card destination, or null when the card is unlinked. */
  link: PropTypes.string,
};
