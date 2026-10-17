import React from 'react';
import PropTypes from 'prop-types';
import LinkTo from '@storybook/addon-links/react';

function Presentation({ name, presentation, children }) {
  return (
    <section>
      <h2>{name}</h2>
      <p>
        <strong>
          {presentation.status === 'stub'
            ? 'Stub: not designed or implemented.'
            : presentation.status === 'reference'
              ? 'Existing reference: contract alignment remains provisional.'
              : 'Experimental implementation.'}
        </strong>
      </p>
      <p>{presentation.intent}</p>
      {presentation.reference && (
        <p>
          <LinkTo
            kind={presentation.reference.kind}
            story={presentation.reference.story}
          >
            Open {name.toLowerCase()} reference
          </LinkTo>
        </p>
      )}
      {presentation.additionalReferences?.map(reference => (
        <p key={reference.id}>
          <LinkTo kind={reference.kind} story={reference.story}>
            {reference.story}
          </LinkTo>
          : {reference.intent}
        </p>
      ))}
      {children}
      {presentation.status === 'stub' && (
        <p>
          This reserves a place for future work. It has no component, rendering
          function or published import.
        </p>
      )}
    </section>
  );
}
const presentationType = PropTypes.shape({
  status: PropTypes.oneOf(['stub', 'reference', 'experimental']).isRequired,
  intent: PropTypes.string.isRequired,
  additionalReferences: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      kind: PropTypes.string.isRequired,
      story: PropTypes.string.isRequired,
      intent: PropTypes.string.isRequired,
    })
  ),
  reference: PropTypes.shape({
    id: PropTypes.string.isRequired,
    kind: PropTypes.string.isRequired,
    story: PropTypes.string.isRequired,
  }),
});
Presentation.propTypes = {
  children: PropTypes.node,
  name: PropTypes.string.isRequired,
  presentation: presentationType.isRequired,
};

/** Documentation-only guide; no stub is exported as a usable UI component. */
export function ContentFamilyGuide({ family, children, cardExamples }) {
  return (
    <div>
      <p>{family.model.intent}</p>
      <p>
        The canonical content model is provisional. A full page, a teaser and a
        card select different information from that model. The current teaser
        input is a presentation projection, not the complete domain record.
      </p>
      <section>
        <h2>Reader and functional needs</h2>
        <p>
          Provisional design requirements informed by Drupal content definitions
          and field configuration. These guide future presentations; they are
          not a required field list or a claim that every function is
          implemented.
        </p>
        <ul>
          {family.model.readerNeeds.map(need => (
            <li key={need}>{need}</li>
          ))}
        </ul>
      </section>
      <section>
        <h2>Editorial profiles</h2>
        <p>
          Profiles select meaning and metadata within this archetype. They are
          independent of presentation (page, teaser, card) and layout. The
          implemented teaser profiles are experimental; their contracts remain
          provisional. Card presentations select their own fields; vertical and
          book layouts share that selection. Neither establishes a working full
          page.
        </p>
        <ul>
          {Object.entries(family.profiles).map(([id, profile]) => (
            <li key={id}>
              <strong>{profile.name}</strong> ({id}
              {id === family.defaultProfile ? '; default' : ''}):{' '}
              {profile.intent}{' '}
              <LinkTo
                kind={profile.presentations.teaser.reference.kind}
                story={profile.presentations.teaser.reference.story}
              >
                Open teaser
              </LinkTo>
              {profile.presentations.card?.reference && (
                <>
                  {' · '}
                  <LinkTo
                    kind={profile.presentations.card.reference.kind}
                    story={profile.presentations.card.reference.story}
                  >
                    Open card
                  </LinkTo>
                  {profile.presentations.card.basis ===
                    'proposed-card-selection' && ' (proposed card selection)'}
                </>
              )}
            </li>
          ))}
        </ul>
      </section>
      <Presentation
        name="Full page"
        presentation={family.presentations.fullPage}
      />
      <Presentation name="Teaser" presentation={family.presentations.teaser}>
        {children}
      </Presentation>
      <Presentation name="Card" presentation={family.presentations.card}>
        {cardExamples}
      </Presentation>
      <p>
        <LinkTo kind="Patterns/Content/Overview" story="docs">
          Browse all content families and their presentation status
        </LinkTo>
      </p>
    </div>
  );
}
ContentFamilyGuide.propTypes = {
  /** Live teaser previews appear with their presentation status and references. */
  children: PropTypes.node,
  cardExamples: PropTypes.node,
  family: PropTypes.shape({
    defaultProfile: PropTypes.string.isRequired,
    profiles: PropTypes.object.isRequired,
    model: PropTypes.shape({
      status: PropTypes.string.isRequired,
      intent: PropTypes.string.isRequired,
      readerNeeds: PropTypes.arrayOf(PropTypes.string).isRequired,
    }).isRequired,
    presentations: PropTypes.shape({
      fullPage: presentationType.isRequired,
      teaser: presentationType.isRequired,
      card: presentationType.isRequired,
    }).isRequired,
  }).isRequired,
};
