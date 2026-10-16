import React from 'react';
import PropTypes from 'prop-types';
import LinkTo from '@storybook/addon-links/react';

function Presentation({ name, presentation }) {
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
  reference: PropTypes.shape({
    id: PropTypes.string.isRequired,
    kind: PropTypes.string.isRequired,
    story: PropTypes.string.isRequired,
  }),
});
Presentation.propTypes = {
  name: PropTypes.string.isRequired,
  presentation: presentationType.isRequired,
};

/** Documentation-only guide; no stub is exported as a usable UI component. */
export function ContentFamilyGuide({ family }) {
  return (
    <div>
      <p>{family.model.intent}</p>
      <p>
        The canonical content model is provisional. A full page, a teaser and a
        card select different information from that model. The current teaser
        input is a presentation projection, not the complete domain record.
      </p>
      <Presentation
        name="Full page"
        presentation={family.presentations.fullPage}
      />
      <Presentation name="Teaser" presentation={family.presentations.teaser} />
      <Presentation name="Card" presentation={family.presentations.card} />
      <p>
        <LinkTo kind="Patterns/Content/Overview" story="docs">
          Browse all content families and their presentation status
        </LinkTo>
      </p>
    </div>
  );
}
ContentFamilyGuide.propTypes = {
  family: PropTypes.shape({
    model: PropTypes.shape({
      status: PropTypes.string.isRequired,
      intent: PropTypes.string.isRequired,
    }).isRequired,
    presentations: PropTypes.shape({
      fullPage: presentationType.isRequired,
      teaser: presentationType.isRequired,
      card: presentationType.isRequired,
    }).isRequired,
  }).isRequired,
};
