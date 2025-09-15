import React from 'react';

const TypographyIntegrationExample = () => {
  return (
    <section className="sb-unstyled mg-container">
      <h1>Typography integration</h1>

      <p>
        This page demonstrates common typography elements together, to validate
        spacing, especially list indentation. Tracked in{' '}
        <a href="https://gitlab.com/undrr/web-backlog/-/issues/2444">
          web-backlog#2444
        </a>
        .
      </p>

      <h2>Headings and paragraphs</h2>

      <div>
        <h3>Section heading</h3>
        <p>
          UNDRR (formerly UNISDR) is the United Nations focal point for disaster
          risk reduction. UNDRR oversees the implementation of the Sendai
          Framework for Disaster Risk Reduction 2015–2030, supporting countries
          in its implementation, monitoring, and knowledge sharing. This
          paragraph is long on purpose to verify typographic rhythm, wrapping
          behavior, and spacing to the lists and components below, including
          link styling like <a href="https://example.com">this inline link</a>.
          This paragraph is long on purpose to verify typographic rhythm,
          wrapping behavior, and spacing to the lists and components below,
          including link styling like{' '}
          <a href="https://example.com">this inline link</a>. This paragraph is
          long on purpose to verify typographic rhythm, wrapping behavior, and
          spacing to the lists and components below, including link styling like{' '}
          <a href="https://example.com">this inline link</a>.
        </p>
      </div>

      <h2>Unordered list</h2>

      <section className="mg-grid mg-grid__col-3">
        <div>
          <p>Preceding paragraph</p>
          <ul>
            <li>
              Bullet item one with a little text to wrap and check hanging
              indent one with a little text to wrap and check hanging indent one
              with a little text to wrap and check hanging indent one with a
              little text to wrap and check hanging indent.
            </li>
            <li>Bullet item two</li>
            <li>
              Bullet item three with nested list
              <ul>
                <li>Nested item a</li>
                <li>Nested item b</li>
              </ul>
            </li>
          </ul>
          <p>Trailing paragraph</p>
        </div>
      </section>

      <h2>Abbreviation</h2>

      <p>
        We use{' '}
        <abbr title="United Nations Office for Disaster Risk Reduction">
          UNDRR
        </abbr>{' '}
        to refer to the office. Another common abbreviation is{' '}
        <abbr title="Cascading Style Sheets">CSS</abbr>.
      </p>

      <h2>Blockquote and cite</h2>

      <blockquote>
        “UNDRR oversees the implementation of the Sendai Framework for Disaster
        Risk Reduction 2015–2030.”
      </blockquote>
      <cite>- Firstname Lastname</cite>

      <h2>Code and code block</h2>

      <p>
        Use <code>length()</code> on a <code>String</code> to get the character
        count.
      </p>
      <pre>
        <code>{`const text = 'Mangrove';
const count = text.length;
// count === 8`}</code>
      </pre>

      <h2>Mark</h2>

      <p>
        Highlight <mark>important text</mark> within a sentence to draw
        attention.
      </p>

      <h2>Details</h2>

      <details>
        <summary>The Sendai Framework</summary>
        <p>
          The framework is the global roadmap for reducing human and economic
          loss as a direct result of disasters.
        </p>
        <ul>
          <li>Priority 1: Understanding disaster risk</li>
          <li>Priority 2: Strengthening disaster risk governance</li>
        </ul>
      </details>

      <h2>Figcaption</h2>

      <figure>
        <figcaption>
          As the UN Office for Disaster Risk Reduction, UNDRR convenes partners
          and coordinates activities to create safer, more resilient
          communities.
        </figcaption>
      </figure>

      <h2>Quotation</h2>

      <p>
        As noted,{' '}
        <q>
          The Sendai Framework is the global roadmap for reducing human and
          economic loss as a direct result of disasters.
        </q>
      </p>

      <h2>Small</h2>

      <p>
        <small>© UNDRR</small>
      </p>

      <h2>Description list</h2>

      <dl>
        <dt>UNDRR</dt>
        <dd>
          United Nations Office for Disaster Risk Reduction. Leads on disaster
          risk reduction and supports Sendai Framework implementation.
        </dd>
        <dt>Sendai Framework</dt>
        <dd>
          A 2015–2030 global agreement to reduce disaster risk and loss in
          lives, livelihoods, and health.
        </dd>
      </dl>

      <p>Trailing paragraph</p>

      <h2>Ordered list</h2>

      <section className="mg-grid mg-grid__col-3">
        <div>
          <p>Preceding paragraph</p>
          <ol>
            <li>
              First item with enough text to wrap to the next line with enough
              text to wrap to the next line with enough text to wrap to the next
              line with enough text to wrap to the next line
            </li>
            <li>Second item</li>
            <li>
              Third item with nested
              <ol>
                <li>Nested 1</li>
                <li>Nested 2</li>
              </ol>
            </li>
          </ol>
          <p>Trailing paragraph</p>
        </div>
      </section>

      <h2>RTL list check</h2>

      <div dir="rtl">
        <ul>
          <li>عنصر قائمة</li>
          <li>عنصر قائمة</li>
        </ul>
      </div>
    </section>
  );
};

export default {
  title: 'Components/Typography/Typography integration example',
  component: TypographyIntegrationExample,
  tags: ['hidden'],
};

export const Default = {
  render: () => <TypographyIntegrationExample />,
};
