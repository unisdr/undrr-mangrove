import React from 'react';
import PropTypes from 'prop-types';
import { CtaButton } from '../../Components/Buttons/CtaButton/CtaButton';
import { VerticalCard } from '../../Components/Cards/Card/VerticalCard';
import { FormAction } from '../../Components/Forms/FormAction/FormAction';
import './experience-principle-examples.css';

const CARD_DATA = [
  {
    title: 'Plan services around local risk',
    summaryText:
      'Use a clear heading, concise evidence and one predictable next step.',
    button: 'Read the guidance',
    link: '#change-evidence',
    label1: 'Practice note',
  },
];

function ExamplePanel({ verdict, title, children }) {
  const isRecommended = verdict === 'Do';

  return (
    <article
      className={`mg-principle-example mg-principle-example--${isRecommended ? 'do' : 'dont'}`}
      aria-label={`${verdict}: ${title}`}
    >
      <header className="mg-principle-example__header">
        <span className="mg-card__label">{verdict}</span>
        <h5>{title}</h5>
      </header>
      <div className="mg-principle-example__canvas">{children}</div>
    </article>
  );
}

function Comparison({ title, summary, children }) {
  const headingId = `${title.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}-title`;

  return (
    <section className="mg-principle-demo" aria-labelledby={headingId}>
      <h4 id={headingId}>{title}</h4>
      <p>{summary}</p>
      <div className="mg-grid mg-grid__col-2 mg-principle-demo__grid">
        {children}
      </div>
    </section>
  );
}

export default function ExperiencePrincipleExamples({ example }) {
  return (
    <>
      {example === 'softness' && (
        <Comparison
          title="Softness with structure"
          summary="Reduce visual weight while keeping the boundary and hierarchy easy to find."
        >
          <ExamplePanel
            verdict="Do"
            title="Use sentence case on a quiet, visible surface"
          >
            <div className="mg-principle-surface">
              <p className="mg-principle-surface__eyebrow">Early warning</p>
              <h6>Act before hazards become disasters</h6>
              <p>
                Light separation supports the content without competing with it.
              </p>
            </div>
          </ExamplePanel>
          <ExamplePanel
            verdict="Don't"
            title="Avoid hard boxes and all-caps labels"
          >
            <div className="mg-principle-hard-box">
              <p className="mg-principle-hard-box__label">Early warning</p>
              <h6>Act before hazards become disasters</h6>
              <p>
                Multiple heavy outlines make the structure feel harder to scan.
              </p>
            </div>
          </ExamplePanel>
        </Comparison>
      )}

      {example === 'actions' && (
        <Comparison
          title="Clear, stable actions"
          summary="Use shared variants and consistent targets. Emphasis should describe priority, not alter the layout."
        >
          <ExamplePanel verdict="Do" title="Use the shared button system">
            <div className="mg-buttons">
              <CtaButton label="Continue" href="#acceptance-checks" />
              <CtaButton label="Review guidance" href="#principles" Outline />
            </div>
          </ExamplePanel>
          <ExamplePanel verdict="Don't" title="Invent a new action treatment">
            <div className="mg-principle-mixed-actions" aria-hidden="true">
              <span className="mg-principle-mixed-actions__block">
                Continue
              </span>
              <span className="mg-principle-mixed-actions__pill">
                Maybe later
              </span>
              <span className="mg-principle-mixed-actions__link">More →</span>
            </div>
            <p className="mg-principle-example__note">
              Competing shapes and weights obscure which action matters.
              All-caps labels would add noise rather than hierarchy.
            </p>
          </ExamplePanel>
        </Comparison>
      )}

      {example === 'forms' && (
        <Comparison
          title="Related form actions"
          summary="Join a field and its action only when their relationship is direct and their semantics remain intact."
        >
          <ExamplePanel verdict="Do" title="Compose the shared form controls">
            <FormAction
              label="Email address"
              helpText="Receive monthly updates."
              stackOnMobile
              control={
                <input
                  className="mg-form-input"
                  type="email"
                  name="principle-email"
                  autoComplete="email"
                  placeholder="name@example.org"
                />
              }
              action={
                <button className="mg-button mg-button-primary" type="button">
                  Subscribe
                </button>
              }
            />
          </ExamplePanel>
          <ExamplePanel verdict="Don't" title="Remove the field boundary">
            <div className="mg-principle-vague-form" aria-hidden="true">
              <span>name@example.org</span>
              <span>Subscribe</span>
            </div>
            <p className="mg-principle-example__note">
              Tint alone can look inactive and leaves the relationship unclear.
            </p>
          </ExamplePanel>
        </Comparison>
      )}

      {example === 'content' && (
        <Comparison
          title="Content-led cards"
          summary="Use hierarchy and one clear next step instead of turning every fragment into a competing surface."
        >
          <ExamplePanel verdict="Do" title="Let the card structure do the work">
            <VerticalCard data={CARD_DATA} />
          </ExamplePanel>
          <ExamplePanel verdict="Don't" title="Flatten the hierarchy">
            <div className="mg-principle-vague-card">
              <span>Update</span>
              <p>Risk</p>
              <p>Planning</p>
              <p>Evidence</p>
              <span>Open item</span>
            </div>
            <p className="mg-principle-example__note">
              Similar weights and decorative containers make scanning slower.
            </p>
          </ExamplePanel>
        </Comparison>
      )}

      {example === 'density' && (
        <Comparison
          title="Dense but clear"
          summary="Dense information is welcome when alignment, labels and boundaries make comparison efficient."
        >
          <ExamplePanel verdict="Do" title="Keep data aligned and labelled">
            <div className="mg-principle-table-wrap">
              <table className="mg-table">
                <caption className="mg-u-sr-only">
                  Reporting status by region
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Region</th>
                    <th scope="col">Reports</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Africa</th>
                    <td>18</td>
                    <td>On track</td>
                  </tr>
                  <tr>
                    <th scope="row">Asia-Pacific</th>
                    <td>24</td>
                    <td>Review</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ExamplePanel>
          <ExamplePanel verdict="Don't" title="Make information soft but vague">
            <div className="mg-principle-vague-data" aria-hidden="true">
              <span>Africa</span>
              <span>18</span>
              <span>On track</span>
              <span>Asia-Pacific</span>
              <span>24</span>
              <span>Review</span>
            </div>
            <p className="mg-principle-example__note">
              Floating values lose their column meaning and comparison rhythm.
            </p>
          </ExamplePanel>
        </Comparison>
      )}
    </>
  );
}

ExperiencePrincipleExamples.propTypes = {
  example: PropTypes.oneOf([
    'softness',
    'actions',
    'forms',
    'content',
    'density',
  ]).isRequired,
};
