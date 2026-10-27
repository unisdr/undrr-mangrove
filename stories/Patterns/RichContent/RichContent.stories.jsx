import React from 'react';
import { RichContent } from './RichContent';
import { VerticalCard } from '../../Components/Cards/Card/VerticalCard';
import { Tab } from '../../Components/Tab/Tab';
import { CLASSED_PROSE_HTML } from './rich-content-fixtures';

export default {
  title: 'Patterns/Rich content',
  component: RichContent,
  parameters: { docs: { source: { html: true } } },
  decorators: [
    Story => (
      <div style={{ maxWidth: '68ch', marginInline: 'auto' }}>
        <Story />
      </div>
    ),
  ],
};

export const Editorial = {
  render: (args, context) => (
    <RichContent
      {...args}
      dir={context.globals?.locale === 'arabic' ? 'rtl' : 'ltr'}
    />
  ),
};

export const Boundaries = {
  render: () => (
    <>
      <h1>Editorial and component boundaries</h1>
      <div className="mg-content" id="rich-boundaries">
        {/* eslint-disable-next-line react/no-danger -- constant authored compatibility specimen */}
        <div dangerouslySetInnerHTML={{ __html: CLASSED_PROSE_HTML }} />
        <p>
          <a className="mg-button mg-button-primary" href="#outside-prose">
            Paragraph-wrapped action
          </a>
        </p>
        <nav className="mg-breadcrumb" aria-label="Example breadcrumb">
          <ul>
            <li>
              <a href="#outside-prose">Component navigation</a>
            </li>
          </ul>
        </nav>
        <VerticalCard
          data={[
            {
              title: 'Component card title',
              link: '#outside-prose',
              summaryText: 'A component-owned summary paragraph.',
              button: 'Read more',
            },
          ]}
        />
        <div className="third-party-widget">
          <h2>Component heading</h2>
          <p>Component paragraph.</p>
          <ul>
            <li>
              <a href="#outside-prose">Component list link</a>
            </li>
          </ul>
          <blockquote>Component quote</blockquote>
          <label>
            Component field <input type="text" />
          </label>
        </div>
      </div>
      <div className="mg-content">
        <blockquote id="ckeditor-callout">
          <p className="mg-highlight-box">
            An existing CKEditor callout wrapper.
          </p>
        </blockquote>
      </div>
      <div id="outside-prose">
        <h3>Outside heading</h3>
        <nav id="outside-navigation" aria-label="Outside navigation">
          <ul>
            <li>
              <a href="#rich-boundaries">Outside navigation link</a>
            </li>
          </ul>
        </nav>
        <p>
          <a href="#rich-boundaries">Outside editorial content</a>
        </p>
        <blockquote>Outside quote</blockquote>
      </div>
      <div className="mg-body" id="legacy-body">
        <blockquote>Legacy quote</blockquote>
        <cite>Legacy citation</cite>
      </div>
      <div className="mg-body mg-content" id="both-boundaries">
        <blockquote>Explicit rich-content quote</blockquote>
        <cite>Work title</cite>
      </div>
      <Tab
        tabdata={[
          {
            text_id: 'rich-panel',
            text: 'Editorial panel',
            data: '<div><h2>Panel heading</h2><p>Panel <a href="#outside-prose">prose link</a>.</p><nav aria-label="Panel navigation"><ul><li><a href="#outside-prose">Panel navigation link</a></li></ul></nav><form aria-label="Panel form"><fieldset><legend>Example form controls</legend><h3>Form heading</h3><p>Form introduction.</p><label>Classless form field <input type="text"></label><ul><li>Form list</li></ul></fieldset></form><div class="component-island"><label>Panel field <input type="text"></label><p>Owned component paragraph.</p></div></div>',
          },
        ]}
      />
    </>
  ),
};
