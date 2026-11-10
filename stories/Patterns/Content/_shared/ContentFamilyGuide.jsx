import React from 'react';
import PropTypes from 'prop-types';
import LinkTo from '@storybook/addon-links/react';
import { linkTo } from '@storybook/addon-links';

/** The registry ID owns navigation; display labels and CSF titles can change. */
function StoryReferenceLink({ reference, children }) {
  const separator = reference.id.indexOf('--');
  const kind = reference.id.slice(0, separator);
  const story = reference.id.slice(separator + 2);
  const handleClick = event => {
    if (
      event.button !== 0 ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    )
      return;
    event.preventDefault();
    linkTo(reference.id)();
  };
  // LinkTo derives the native/new-tab href from the stable ID parts. Its
  // ordinary click uses the addon's explicit storyId path, preserving the shell.
  return (
    <LinkTo kind={kind} story={story} onClick={handleClick}>
      {children}
    </LinkTo>
  );
}
StoryReferenceLink.propTypes = {
  reference: PropTypes.shape({ id: PropTypes.string.isRequired }).isRequired,
  children: PropTypes.node.isRequired,
};

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
          <StoryReferenceLink reference={presentation.reference}>
            Open {name.toLowerCase()} reference
          </StoryReferenceLink>
        </p>
      )}
      {presentation.additionalReferences?.map(reference => (
        <p key={reference.id}>
          <StoryReferenceLink reference={reference}>
            {reference.story}
          </StoryReferenceLink>
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
              <StoryReferenceLink
                reference={profile.presentations.teaser.reference}
              >
                Open teaser
              </StoryReferenceLink>
              {profile.presentations.card?.reference && (
                <>
                  {' · '}
                  <StoryReferenceLink
                    reference={profile.presentations.card.reference}
                  >
                    Open card
                  </StoryReferenceLink>
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
