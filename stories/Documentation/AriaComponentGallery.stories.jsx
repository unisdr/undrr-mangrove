/*
 * A theming gallery for the React Aria components Mangrove is bringing into the
 * v2 token system. Every specimen renders with React Aria's stock class names
 * (no `className` is passed to a React Aria component) so that the styling in
 * `stories/assets/scss/aria/_react-aria.scss` is what you see here.
 *
 * Layout scaffolding uses plain elements with `aria-gallery-` class names.
 * Two inner elements follow React Aria's own documented anatomy rather than the
 * gallery prefix, because the library has no element of its own to style there:
 * `.bar` / `.fill` inside ProgressBar and Meter.
 */
import React, { useState } from 'react';
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Disclosure,
  DisclosureGroup,
  DisclosurePanel,
  FieldError,
  Form,
  Group,
  Heading,
  Input,
  Label,
  Link,
  Meter,
  NumberField,
  ProgressBar,
  Radio,
  RadioGroup,
  Separator,
  Slider,
  SliderFill,
  SliderOutput,
  SliderThumb,
  SliderTrack,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Tag,
  TagGroup,
  TagList,
  Text,
  TextArea,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from 'react-aria-components';

// Storybook-only specimen scaffolding. Not part of the distributed CSS.
import '../assets/scss/aria/_spike-demo.scss';

// Hoisted so identity is stable across renders.
const DEFAULT_EXPANDED_KEYS = ['early-warning'];
const DEFAULT_VIEW_KEYS = ['map'];
const DEFAULT_LAYER_KEYS = ['flood', 'exposure'];
const DEFAULT_HAZARD_TAGS = ['cyclone', 'flood'];
const NO_SELECTED_KEYS = [];
const DISABLED_HAZARD_TAGS = ['drought'];
const COVERAGE_PERCENTAGE = 68;
const READINESS_PERCENTAGE = 41;

function Section({ title, description, children }) {
  return (
    <section className="aria-gallery-section">
      <h3 className="aria-gallery-section-title">{title}</h3>
      {description ? (
        <p className="aria-gallery-section-note">{description}</p>
      ) : null}
      <div className="aria-gallery-row">{children}</div>
    </section>
  );
}

function Specimen({ label, children }) {
  return (
    <div className="aria-gallery-specimen">
      <span className="aria-gallery-specimen-label">{label}</span>
      <div className="aria-gallery-specimen-body">{children}</div>
    </div>
  );
}

function Bar({ percentage }) {
  return (
    <div className="bar">
      <div className="fill" style={{ width: `${percentage}%` }} />
    </div>
  );
}

function PhaseTabs({ isDisabled }) {
  return (
    <Tabs isDisabled={isDisabled}>
      <TabList aria-label="Disaster risk management phases">
        <Tab id="preparedness">Preparedness</Tab>
        <Tab id="response">Response</Tab>
        <Tab id="recovery">Recovery</Tab>
        <Tab id="archive" isDisabled>
          Archived cycle
        </Tab>
      </TabList>
      <TabPanel id="preparedness">
        Multi-hazard early warning systems now reach 68 per cent of coastal
        districts, up from 54 per cent at the last Sendai Framework review.
      </TabPanel>
      <TabPanel id="response">
        Anticipatory action triggers released contingency finance to 12
        municipalities ahead of the last cyclone landfall.
      </TabPanel>
      <TabPanel id="recovery">
        Build back better assessments are complete for schools and health
        facilities in the three worst affected provinces.
      </TabPanel>
      <TabPanel id="archive">
        This planning cycle is closed and kept for reference only.
      </TabPanel>
    </Tabs>
  );
}

function ResilienceDisclosureGroup() {
  return (
    <DisclosureGroup
      allowsMultipleExpanded
      defaultExpandedKeys={DEFAULT_EXPANDED_KEYS}
    >
      <Disclosure id="early-warning">
        <Heading>
          <Button slot="trigger">Early warning and early action</Button>
        </Heading>
        <DisclosurePanel>
          <p>
            Impact based forecasting is issued for cyclone, riverine flood and
            heatwave, with dissemination through community radio and SMS
            cascades.
          </p>
        </DisclosurePanel>
      </Disclosure>
      <Disclosure id="risk-governance">
        <Heading>
          <Button slot="trigger">Risk governance</Button>
        </Heading>
        <DisclosurePanel>
          <p>
            National and local disaster risk reduction strategies are aligned to
            the Sendai Framework targets and reviewed every two years.
          </p>
        </DisclosurePanel>
      </Disclosure>
      <Disclosure id="financing" isDisabled>
        <Heading>
          <Button slot="trigger">
            Resilience financing (not yet reported)
          </Button>
        </Heading>
        <DisclosurePanel>
          <p>This section opens once the finance return has been submitted.</p>
        </DisclosurePanel>
      </Disclosure>
    </DisclosureGroup>
  );
}

function HazardTagGroup({ selectionMode, defaultSelectedKeys, disabledKeys }) {
  return (
    <TagGroup
      selectionMode={selectionMode}
      defaultSelectedKeys={defaultSelectedKeys}
      disabledKeys={disabledKeys}
    >
      <Label>Hazards in scope</Label>
      <TagList>
        <Tag id="cyclone">Tropical cyclone</Tag>
        <Tag id="flood">Riverine flood</Tag>
        <Tag id="drought">Drought</Tag>
        <Tag id="heatwave">Heatwave</Tag>
      </TagList>
      <Text slot="description">
        Selected hazards drive the risk profile shown to national focal points.
      </Text>
    </TagGroup>
  );
}

function ExposureSlider({ isDisabled, defaultValue }) {
  return (
    <Slider
      defaultValue={defaultValue}
      maxValue={100}
      isDisabled={isDisabled}
      aria-label="Population exposure threshold"
    >
      <Label>Population exposure threshold</Label>
      <SliderOutput />
      <SliderTrack>
        <SliderFill />
        <SliderThumb />
      </SliderTrack>
    </Slider>
  );
}

function LeadTimeField({ isDisabled, isInvalid }) {
  return (
    <NumberField
      defaultValue={72}
      minValue={0}
      maxValue={168}
      isDisabled={isDisabled}
      isInvalid={isInvalid}
    >
      <Label>Warning lead time (hours)</Label>
      <Group>
        <Button slot="decrement">−</Button>
        <Input />
        <Button slot="increment">+</Button>
      </Group>
      <Text slot="description">
        Hours between the forecast trigger and expected impact.
      </Text>
      <FieldError>Lead time must be between 0 and 168 hours.</FieldError>
    </NumberField>
  );
}

function AlertLevelRadioGroup({ isDisabled, isInvalid, defaultValue }) {
  return (
    <RadioGroup
      defaultValue={defaultValue}
      isDisabled={isDisabled}
      isInvalid={isInvalid}
    >
      <Label>Alert level</Label>
      <Radio value="advisory">Advisory</Radio>
      <Radio value="watch">Watch</Radio>
      <Radio value="warning">Warning</Radio>
      <Radio value="withdrawn" isDisabled>
        Withdrawn
      </Radio>
      <Text slot="description">
        Levels follow the common alerting protocol used by the national
        meteorological service.
      </Text>
      <FieldError>Choose an alert level before publishing.</FieldError>
    </RadioGroup>
  );
}

function SituationNotesField({ isDisabled, isInvalid }) {
  return (
    <TextField isDisabled={isDisabled} isInvalid={isInvalid}>
      <Label>Situation notes</Label>
      <TextArea
        rows={4}
        placeholder="Summarise observed impacts, affected populations and immediate needs"
      />
      <Text slot="description">
        Shared with the national platform for disaster risk reduction.
      </Text>
      <FieldError>Situation notes are required before validation.</FieldError>
    </TextField>
  );
}

function MapViewToggles() {
  return (
    <ToggleButtonGroup
      selectionMode="single"
      defaultSelectedKeys={DEFAULT_VIEW_KEYS}
    >
      <ToggleButton id="map">Map</ToggleButton>
      <ToggleButton id="table">Table</ToggleButton>
      <ToggleButton id="timeline">Timeline</ToggleButton>
    </ToggleButtonGroup>
  );
}

function MapLayerToggles() {
  return (
    <ToggleButtonGroup
      selectionMode="multiple"
      defaultSelectedKeys={DEFAULT_LAYER_KEYS}
    >
      <ToggleButton id="flood">Flood extent</ToggleButton>
      <ToggleButton id="exposure">Exposed population</ToggleButton>
      <ToggleButton id="assets">Critical assets</ToggleButton>
      <ToggleButton id="draft" isDisabled>
        Draft layer
      </ToggleButton>
    </ToggleButtonGroup>
  );
}

function HazardReportForm() {
  const [reference, setReference] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const isReferenceInvalid = submitted && reference.trim().length === 0;

  const handleSubmit = event => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <TextField
        isRequired
        value={reference}
        onChange={setReference}
        isInvalid={isReferenceInvalid}
      >
        <Label>Event reference</Label>
        <Input placeholder="For example HIPS-2026-014" />
        <Text slot="description">
          Use the reference issued by the national disaster management agency.
        </Text>
        <FieldError>An event reference is required.</FieldError>
      </TextField>
      <LeadTimeField />
      <Switch defaultSelected>Notify subscribed focal points</Switch>
      <Button type="submit">Submit hazard report</Button>
    </Form>
  );
}

function NavigationSpecimens() {
  return (
    <Section
      title="Breadcrumbs, Link and Separator"
      description="Wayfinding and inline navigation used across hazard and country pages."
    >
      <Specimen label="Breadcrumbs">
        <Breadcrumbs>
          <Breadcrumb>
            <Link href="https://www.undrr.org/">UNDRR</Link>
          </Breadcrumb>
          <Breadcrumb>
            <Link href="https://www.undrr.org/">
              Hazard information profiles
            </Link>
          </Breadcrumb>
          <Breadcrumb>Tropical cyclone</Breadcrumb>
        </Breadcrumbs>
      </Specimen>
      <Specimen label="Link: default and disabled">
        <div className="aria-gallery-stack">
          <Link href="https://www.preventionweb.net/">
            Read the Sendai Framework midterm review
          </Link>
          <Link isDisabled>Country profile not yet published</Link>
        </div>
      </Specimen>
      <Specimen label="Separator">
        <div className="aria-gallery-stack">
          <p>Regional platform outcomes</p>
          <Separator />
          <p>National platform commitments</p>
        </div>
      </Specimen>
    </Section>
  );
}

function ProgressSpecimens() {
  return (
    <Section
      title="ProgressBar and Meter"
      description="Determinate and indeterminate progress plus threshold reporting."
    >
      <Specimen label="ProgressBar: determinate">
        <ProgressBar value={COVERAGE_PERCENTAGE}>
          <Label>Early warning coverage</Label>
          <span className="aria-gallery-value">{COVERAGE_PERCENTAGE}%</span>
          <Bar percentage={COVERAGE_PERCENTAGE} />
        </ProgressBar>
      </Specimen>
      <Specimen label="ProgressBar: indeterminate">
        <ProgressBar isIndeterminate>
          <Label>Loading national loss data</Label>
          <Bar percentage={100} />
        </ProgressBar>
      </Specimen>
      <Specimen label="Meter: below threshold">
        <Meter value={READINESS_PERCENTAGE}>
          <Label>Contingency fund readiness</Label>
          <span className="aria-gallery-value">{READINESS_PERCENTAGE}%</span>
          <Bar percentage={READINESS_PERCENTAGE} />
        </Meter>
      </Specimen>
      <Specimen label="Meter: at target">
        <Meter value={92}>
          <Label>Local strategies aligned to Sendai</Label>
          <span className="aria-gallery-value">92%</span>
          <Bar percentage={92} />
        </Meter>
      </Specimen>
    </Section>
  );
}

function GalleryIntro() {
  return (
    <header className="aria-gallery-intro">
      <h2>React Aria component gallery</h2>
      <p>
        Every component below renders with React Aria stock class names so that
        Mangrove token styling can be reviewed at a glance. Switch sub-brands
        with the Storybook theme toolbar to compare brand treatments.
      </p>
    </header>
  );
}

function AllComponentsGallery() {
  return (
    <div className="aria-gallery">
      <GalleryIntro />
      <NavigationSpecimens />

      <Section
        title="Tabs"
        description="Phase navigation for a country resilience workspace."
      >
        <Specimen label="Default">
          <PhaseTabs />
        </Specimen>
        <Specimen label="Disabled tab list">
          <PhaseTabs isDisabled />
        </Specimen>
      </Section>

      <Section
        title="Disclosure and DisclosureGroup"
        description="Accordion sections, including an expanded and a disabled panel."
      >
        <Specimen label="Group with multiple expanded">
          <ResilienceDisclosureGroup />
        </Specimen>
        <Specimen label="Standalone disclosure">
          <Disclosure>
            <Heading>
              <Button slot="trigger">Data sources and methodology</Button>
            </Heading>
            <DisclosurePanel>
              <p>
                Loss and damage figures come from the national DesInventar
                database, reconciled with post disaster needs assessments.
              </p>
            </DisclosurePanel>
          </Disclosure>
        </Specimen>
      </Section>

      <Section
        title="Switch, ToggleButton and ToggleButtonGroup"
        description="Binary and grouped toggles used in dashboards and map controls."
      >
        <Specimen label="Switch: off, on, disabled">
          <div className="aria-gallery-stack">
            <Switch>Show only validated events</Switch>
            <Switch defaultSelected>Send anticipatory action alerts</Switch>
            <Switch isDisabled>Publish to the open data portal</Switch>
            <Switch isDisabled defaultSelected>
              Archive after the response phase
            </Switch>
          </div>
        </Specimen>
        <Specimen label="ToggleButton: default, selected, disabled">
          <div className="aria-gallery-inline">
            <ToggleButton>Pin hazard</ToggleButton>
            <ToggleButton defaultSelected>Pinned</ToggleButton>
            <ToggleButton isDisabled>Unavailable</ToggleButton>
          </div>
        </Specimen>
        <Specimen label="ToggleButtonGroup: single selection">
          <MapViewToggles />
        </Specimen>
        <Specimen label="ToggleButtonGroup: multiple selection">
          <MapLayerToggles />
        </Specimen>
      </Section>

      <Section
        title="RadioGroup"
        description="Alert level selection with description and error message."
      >
        <Specimen label="Default">
          <AlertLevelRadioGroup defaultValue="watch" />
        </Specimen>
        <Specimen label="Invalid">
          <AlertLevelRadioGroup isInvalid />
        </Specimen>
        <Specimen label="Disabled">
          <AlertLevelRadioGroup defaultValue="advisory" isDisabled />
        </Specimen>
      </Section>

      <Section
        title="NumberField and TextArea"
        description="Numeric stepper and multi line text, both inside a TextField shell."
      >
        <Specimen label="NumberField: default">
          <LeadTimeField />
        </Specimen>
        <Specimen label="NumberField: invalid">
          <LeadTimeField isInvalid />
        </Specimen>
        <Specimen label="NumberField: disabled">
          <LeadTimeField isDisabled />
        </Specimen>
        <Specimen label="TextArea: default">
          <SituationNotesField />
        </Specimen>
        <Specimen label="TextArea: invalid">
          <SituationNotesField isInvalid />
        </Specimen>
        <Specimen label="TextArea: disabled">
          <SituationNotesField isDisabled />
        </Specimen>
      </Section>

      <Section
        title="TagGroup"
        description="Hazard filters with selectable and disabled tags."
      >
        <Specimen label="Multiple selection">
          <HazardTagGroup
            selectionMode="multiple"
            defaultSelectedKeys={DEFAULT_HAZARD_TAGS}
          />
        </Specimen>
        <Specimen label="Single selection with disabled tags">
          <HazardTagGroup
            selectionMode="single"
            defaultSelectedKeys={NO_SELECTED_KEYS}
            disabledKeys={DISABLED_HAZARD_TAGS}
          />
        </Specimen>
      </Section>

      <Section
        title="Slider"
        description="Track, fill, thumb and live output for threshold setting."
      >
        <Specimen label="Default">
          <ExposureSlider defaultValue={45} />
        </Specimen>
        <Specimen label="High value">
          <ExposureSlider defaultValue={88} />
        </Specimen>
        <Specimen label="Disabled">
          <ExposureSlider defaultValue={20} isDisabled />
        </Specimen>
      </Section>

      <ProgressSpecimens />

      <Section
        title="Form and FieldError"
        description="Submit the form with an empty reference to reveal the error styling."
      >
        <Specimen label="Hazard report">
          <HazardReportForm />
        </Specimen>
      </Section>
    </div>
  );
}

function StatesMatrix() {
  return (
    <div className="aria-gallery">
      <header className="aria-gallery-intro">
        <h2>Interactive control states</h2>
        <p>
          The same controls in their default, selected, disabled and invalid
          states, so token gaps show up as a broken column rather than a
          one-off.
        </p>
      </header>

      <Section title="Switch">
        <Specimen label="Default">
          <Switch>Notify focal points</Switch>
        </Specimen>
        <Specimen label="Selected">
          <Switch defaultSelected>Notify focal points</Switch>
        </Specimen>
        <Specimen label="Disabled">
          <Switch isDisabled>Notify focal points</Switch>
        </Specimen>
        <Specimen label="Disabled and selected">
          <Switch isDisabled defaultSelected>
            Notify focal points
          </Switch>
        </Specimen>
      </Section>

      <Section title="ToggleButton">
        <Specimen label="Default">
          <ToggleButton>Flood extent</ToggleButton>
        </Specimen>
        <Specimen label="Selected">
          <ToggleButton defaultSelected>Flood extent</ToggleButton>
        </Specimen>
        <Specimen label="Disabled">
          <ToggleButton isDisabled>Flood extent</ToggleButton>
        </Specimen>
      </Section>

      <Section title="RadioGroup">
        <Specimen label="Default">
          <AlertLevelRadioGroup />
        </Specimen>
        <Specimen label="Selected">
          <AlertLevelRadioGroup defaultValue="warning" />
        </Specimen>
        <Specimen label="Disabled">
          <AlertLevelRadioGroup defaultValue="warning" isDisabled />
        </Specimen>
        <Specimen label="Invalid">
          <AlertLevelRadioGroup isInvalid />
        </Specimen>
      </Section>

      <Section title="NumberField">
        <Specimen label="Default">
          <LeadTimeField />
        </Specimen>
        <Specimen label="Disabled">
          <LeadTimeField isDisabled />
        </Specimen>
        <Specimen label="Invalid">
          <LeadTimeField isInvalid />
        </Specimen>
      </Section>

      <Section title="TextArea">
        <Specimen label="Default">
          <SituationNotesField />
        </Specimen>
        <Specimen label="Disabled">
          <SituationNotesField isDisabled />
        </Specimen>
        <Specimen label="Invalid">
          <SituationNotesField isInvalid />
        </Specimen>
      </Section>

      <Section title="Slider">
        <Specimen label="Default">
          <ExposureSlider defaultValue={45} />
        </Specimen>
        <Specimen label="Disabled">
          <ExposureSlider defaultValue={45} isDisabled />
        </Specimen>
      </Section>

      <Section title="TagGroup">
        <Specimen label="Nothing selected">
          <HazardTagGroup
            selectionMode="multiple"
            defaultSelectedKeys={NO_SELECTED_KEYS}
          />
        </Specimen>
        <Specimen label="Selected">
          <HazardTagGroup
            selectionMode="multiple"
            defaultSelectedKeys={DEFAULT_HAZARD_TAGS}
          />
        </Specimen>
        <Specimen label="With disabled tags">
          <HazardTagGroup
            selectionMode="multiple"
            defaultSelectedKeys={NO_SELECTED_KEYS}
            disabledKeys={DISABLED_HAZARD_TAGS}
          />
        </Specimen>
      </Section>
    </div>
  );
}

export default {
  title: 'Spike/React Aria gallery',
  component: AllComponentsGallery,
  parameters: {
    docs: {
      description: {
        component:
          'A theming gallery for the React Aria components Mangrove is newly styling: tabs, disclosures, toggles, tags, sliders, meters, progress bars, number and text area fields, breadcrumbs, links, separators and form validation. Nothing here passes a className to a React Aria component, so what renders is exactly what the Mangrove React Aria stylesheet produces.',
      },
    },
  },
};

export const AllComponents = {
  name: 'All components',
  render: () => <AllComponentsGallery />,
};

export const States = {
  name: 'States matrix',
  render: () => <StatesMatrix />,
};
