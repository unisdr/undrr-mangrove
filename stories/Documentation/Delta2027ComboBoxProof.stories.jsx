import React, { useState } from 'react';
import { I18nProvider } from 'react-aria-components';
import ComboBox from '../Components/Forms/ComboBox/ComboBox';
import UpstreamPilot from './fixtures/ComboBoxPilotReference';
import allThemeStyles from '../assets/scss/style-all.scss?inline';
import proofStyles from '../assets/scss/aria/_delta-2027-combobox-proof.scss?inline';

const ITEMS = [
  { id: 'flood', label: 'Flood' },
  { id: 'storm', label: 'Storm' },
  { id: 'drought', label: 'Drought' },
];

function Proof({ wrapper = false, reference = false, dir = 'ltr' }) {
  const Widget = reference ? UpstreamPilot : ComboBox;
  const [container, setContainer] = useState(null);
  const [selected, setSelected] = useState('flood');
  return (
    <I18nProvider locale={dir === 'rtl' ? 'ar' : 'en'}>
      <style>{allThemeStyles + proofStyles}</style>
      <main dir={dir} lang="en" style={{ padding: 24, maxWidth: 700 }}>
        <h1>Delta 2027 and the React Aria ComboBox pilot</h1>
        <p>
          This isolated branch combines the public ComboBox pilot from #1088
          with Delta 2027. It does not retarget that PR or publish the wider
          research skin.
        </p>
        {reference && (
          <p>
            Accessibility reference: this uses the unmodified ComboBox source
            from #1088 and its normal body portal.
          </p>
        )}
        <p data-proof-mode>
          {wrapper
            ? 'Wrapper theme: the surrounding body uses UNDRR. The popup is explicitly portalled into the themed wrapper.'
            : 'Body theme: the popup uses its normal document-body portal and inherits Delta 2027 there.'}
        </p>
        <section
          ref={wrapper ? setContainer : undefined}
          className={wrapper ? 'mg-theme-delta-2027' : undefined}
          data-proof-wrapper={wrapper || undefined}
          style={{ padding: 16 }}
        >
          <Widget
            label="Hazard type"
            items={ITEMS}
            selectedKey={selected}
            onSelectionChange={setSelected}
            openButtonLabel="Show hazards"
            popoverContainer={wrapper ? container : undefined}
            popoverOffset={4}
            helpText={
              reference
                ? 'Unmodified pilot used for the accessibility comparison.'
                : 'Choose a hazard. Selection uses a checkmark, without a selected fill.'
            }
          />
          <p role="status">Selected hazard: {selected || 'none'}</p>
          <Widget
            label="Disabled hazard"
            items={ITEMS}
            defaultSelectedKey="flood"
            openButtonLabel="Show disabled hazards"
            disabled
          />
          <Widget
            label="Invalid hazard"
            items={ITEMS}
            openButtonLabel="Show invalid hazards"
            error
            errorText="Choose a hazard before publishing."
          />
          <p>
            The wrapper example passes an explicit portal container. A theme on
            a wrapper does not automatically travel to the body portal.
          </p>
        </section>
      </main>
    </I18nProvider>
  );
}

export default {
  title: 'Example/Delta 2027 ComboBox proof',
  parameters: { layout: 'fullscreen' },
  tags: ['!autodocs'],
};

export const BodyTheme = {
  globals: { theme: 'Delta 2027 Theme' },
  render: (_args, { globals }) => (
    <Proof dir={globals.addonRtl === 'rtl' ? 'rtl' : 'ltr'} />
  ),
};

export const WrapperTheme = {
  globals: { theme: 'Global UNDRR Theme' },
  render: (_args, { globals }) => (
    <Proof wrapper dir={globals.addonRtl === 'rtl' ? 'rtl' : 'ltr'} />
  ),
};

export const PilotReference = {
  globals: { theme: 'Delta 2027 Theme' },
  render: () => <Proof reference />,
};
