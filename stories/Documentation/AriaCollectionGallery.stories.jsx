/*
 * State specimens for the React Aria collection, overlay and date components.
 *
 * The CRUD spike renders each of these once, inside a working demo. That proves
 * they function but hides the themed states an accessibility audit cares about:
 * table row and column focus rings, resizer affordances, DropZone focus, and
 * calendar cell target sizes. Every specimen below forces a state statically so
 * a theming defect is visible without anyone interacting with the page.
 *
 * No `className` is passed to a React Aria component, so what renders is exactly
 * what the Mangrove React Aria stylesheet produces. Layout scaffolding uses
 * plain elements with `aria-collection-` class names.
 */
import React, { useState } from 'react';
import {
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  Cell,
  Checkbox,
  Column,
  ColumnResizer,
  ComboBox,
  DateField,
  DateInput,
  DatePicker,
  DateRangePicker,
  DateSegment,
  Dialog,
  DropZone,
  FieldError,
  GridList,
  GridListItem,
  Group,
  Header,
  Heading,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  ListBoxSection,
  Menu,
  MenuItem,
  MenuSection,
  MenuTrigger,
  Modal,
  ModalOverlay,
  Popover,
  RangeCalendar,
  ResizableTableContainer,
  Row,
  SearchField,
  Select,
  SelectValue,
  Separator,
  Table,
  TableBody,
  TableHeader,
  Tag,
  TagGroup,
  TagList,
  Text,
  Tooltip,
  TooltipTrigger,
} from 'react-aria-components';

// Storybook-only specimen scaffolding. Not part of the distributed CSS.
import '../assets/scss/aria/_spike-demo.scss';
import { CalendarDate } from '@internationalized/date';

// Hoisted so identity is stable across renders.
const SELECTED_EVENT_ROWS = ['flood'];
const DISABLED_EVENT_ROWS = ['drought'];
const SELECTED_HAZARD_KEYS = ['cyclone', 'flood'];
const DISABLED_HAZARD_KEYS = ['landslide'];
const SELECTED_STATION_KEYS = ['coastal-gauge'];
const DISABLED_STATION_KEYS = ['decommissioned-buoy'];
const DEFAULT_SORT_DESCRIPTOR = { column: 'hazard', direction: 'ascending' };
const REMOVABLE_HAZARD_TAGS = [
  { id: 'cyclone', label: 'Tropical cyclone' },
  { id: 'flood', label: 'Riverine flood' },
  { id: 'heatwave', label: 'Heatwave' },
];

// A fixed month keeps the specimens stable: the review window runs from the 6th
// to the 26th, and the validation blackout falls on the 20th to the 22nd.
/* DELTA's four record states, as implemented by mg-status-label. */
const STATUS_MODIFIER = {
  Draft: 'draft',
  'Waiting for validation': 'waiting-validation',
  'Waiting for information': 'waiting-information',
  Published: 'published',
};

function StatusLabel({ status }) {
  const modifier = STATUS_MODIFIER[status];
  return (
    <span
      className={
        modifier
          ? `mg-status-label mg-status-label--${modifier}`
          : 'mg-status-label'
      }
    >
      <span className="mg-status-label__indicator" />
      {status}
    </span>
  );
}

const VISIBLE_MONTH = new CalendarDate(2026, 5, 1);
const SELECTED_DAY = new CalendarDate(2026, 5, 14);
const REVIEW_WINDOW_START = new CalendarDate(2026, 5, 6);
const REVIEW_WINDOW_END = new CalendarDate(2026, 5, 26);
const SELECTED_RANGE = {
  start: new CalendarDate(2026, 5, 11),
  end: new CalendarDate(2026, 5, 18),
};
const RECORDED_DATE = new CalendarDate(2026, 5, 14);
const RESPONSE_RANGE = {
  start: new CalendarDate(2026, 5, 4),
  end: new CalendarDate(2026, 5, 8),
};

function isValidationBlackout(date) {
  return date.day >= 20 && date.day <= 22;
}

// Collection render props are hoisted rather than written inline at the call site.
const renderCalendarCell = date => <CalendarCell date={date} />;
const renderCalendarHeaderCell = day => (
  <CalendarHeaderCell>{day}</CalendarHeaderCell>
);
const renderDateSegment = segment => <DateSegment segment={segment} />;
const renderEmptyEventState = () =>
  'No hazardous events match the current filters.';

function CollectionSection({ title, description, children }) {
  return (
    <section className="aria-collection-section">
      <h3 className="aria-collection-section-title">{title}</h3>
      {description ? (
        <p className="aria-collection-section-note">{description}</p>
      ) : null}
      <div className="aria-collection-row">{children}</div>
    </section>
  );
}

function Specimen({ label, caption, children }) {
  return (
    <div className="aria-collection-specimen">
      <span className="aria-collection-specimen-label">{label}</span>
      <div className="aria-collection-specimen-body">{children}</div>
      {caption ? (
        <p className="aria-collection-specimen-caption">{caption}</p>
      ) : null}
    </div>
  );
}

function EventTableHeader() {
  return (
    <TableHeader>
      <Column id="selection" width={44} minWidth={44} maxWidth={44}>
        <Checkbox slot="selection" aria-label="Select all hazardous events" />
      </Column>
      <Column id="hazard" isRowHeader allowsSorting defaultWidth={220}>
        <div className="aria-collection-column-header">
          <span>Hazard type</span>
          <ColumnResizer />
        </div>
      </Column>
      <Column id="onset" allowsSorting defaultWidth={150}>
        <div className="aria-collection-column-header">
          <span>Onset</span>
          <ColumnResizer />
        </div>
      </Column>
      <Column id="status" defaultWidth={180}>
        <div className="aria-collection-column-header">
          <span>Record status</span>
          <ColumnResizer />
        </div>
      </Column>
      <Column id="updated" defaultWidth={140}>
        Updated
      </Column>
    </TableHeader>
  );
}

function HazardEventTable() {
  return (
    <ResizableTableContainer>
      <Table
        aria-label="Hazardous events with a selected and a disabled row"
        selectionMode="multiple"
        defaultSelectedKeys={SELECTED_EVENT_ROWS}
        disabledKeys={DISABLED_EVENT_ROWS}
        sortDescriptor={DEFAULT_SORT_DESCRIPTOR}
      >
        <EventTableHeader />
        <TableBody>
          <Row id="cyclone">
            <Cell>
              <Checkbox slot="selection" aria-label="Select tropical cyclone" />
            </Cell>
            <Cell>Tropical cyclone</Cell>
            <Cell>Rapid onset</Cell>
            <Cell>
              <StatusLabel status="Published" />
            </Cell>
            <Cell>
              <time dir="auto" dateTime="2026-05-14">
                14 May 2026
              </time>
            </Cell>
          </Row>
          <Row id="flood">
            <Cell>
              <Checkbox slot="selection" aria-label="Select riverine flood" />
            </Cell>
            <Cell>Riverine flood</Cell>
            <Cell>Rapid onset</Cell>
            <Cell>
              <StatusLabel status="Waiting for validation" />
            </Cell>
            <Cell>
              <time dir="auto" dateTime="2026-05-12">
                12 May 2026
              </time>
            </Cell>
          </Row>
          <Row id="drought">
            <Cell>
              <Checkbox slot="selection" aria-label="Select drought" />
            </Cell>
            <Cell>Drought</Cell>
            <Cell>Slow onset</Cell>
            <Cell>
              <StatusLabel status="Draft" />
            </Cell>
            <Cell>
              <time dir="auto" dateTime="2026-05-02">
                2 May 2026
              </time>
            </Cell>
          </Row>
        </TableBody>
      </Table>
    </ResizableTableContainer>
  );
}

function EmptyEventTable() {
  return (
    <Table aria-label="Hazardous events with no results">
      <TableHeader>
        <Column id="hazard" isRowHeader>
          Hazard type
        </Column>
        <Column id="onset">Onset</Column>
        <Column id="status">Record status</Column>
      </TableHeader>
      <TableBody renderEmptyState={renderEmptyEventState} />
    </Table>
  );
}

function HazardListBox() {
  return (
    <ListBox
      aria-label="Hazards in scope"
      selectionMode="multiple"
      defaultSelectedKeys={SELECTED_HAZARD_KEYS}
      disabledKeys={DISABLED_HAZARD_KEYS}
    >
      <ListBoxSection>
        <Header>Hydrometeorological</Header>
        <ListBoxItem id="cyclone">Tropical cyclone</ListBoxItem>
        <ListBoxItem id="flood">Riverine flood</ListBoxItem>
        <ListBoxItem id="heatwave">Heatwave</ListBoxItem>
      </ListBoxSection>
      <ListBoxSection>
        <Header>Geological</Header>
        <ListBoxItem id="earthquake">Earthquake</ListBoxItem>
        <ListBoxItem id="landslide">
          Landslide (no national data return)
        </ListBoxItem>
      </ListBoxSection>
    </ListBox>
  );
}

function StationGridList() {
  return (
    <GridList
      aria-label="Early warning observation stations"
      selectionMode="multiple"
      defaultSelectedKeys={SELECTED_STATION_KEYS}
      disabledKeys={DISABLED_STATION_KEYS}
    >
      <GridListItem id="coastal-gauge" textValue="Coastal tide gauge">
        Coastal tide gauge, Bay district
      </GridListItem>
      <GridListItem id="river-gauge" textValue="Upper river gauge">
        Upper river gauge, Highland province
      </GridListItem>
      <GridListItem id="rain-radar" textValue="Rainfall radar">
        Rainfall radar, National meteorological service
      </GridListItem>
      <GridListItem
        id="decommissioned-buoy"
        textValue="Decommissioned offshore buoy"
      >
        Offshore buoy (decommissioned)
      </GridListItem>
    </GridList>
  );
}

function AlertActionsMenu() {
  return (
    <MenuTrigger defaultOpen>
      <Button>Alert actions</Button>
      {/* Open on mount, so React Aria's overlay entry motion would replay on
          every story load and a screenshot runner would catch a mid-transition
          frame. shouldSkipAnimation is React Aria's own opt-out for overlays
          that are open before the user does anything. */}
      <Popover placement="bottom start" shouldSkipAnimation>
        <Menu aria-label="Alert actions">
          <MenuSection>
            <Header>Dissemination</Header>
            <MenuItem id="broadcast">Broadcast to community radio</MenuItem>
            <MenuItem id="sms">Send SMS cascade</MenuItem>
          </MenuSection>
          <MenuSection>
            <Header>Record</Header>
            <MenuItem id="validate">Mark as validated</MenuItem>
            <MenuItem id="archive" isDisabled>
              Archive (locked until the response phase closes)
            </MenuItem>
          </MenuSection>
        </Menu>
      </Popover>
    </MenuTrigger>
  );
}

function ReviewCalendar() {
  return (
    <Calendar
      aria-label="Validation review window"
      defaultValue={SELECTED_DAY}
      defaultFocusedValue={VISIBLE_MONTH}
      minValue={REVIEW_WINDOW_START}
      maxValue={REVIEW_WINDOW_END}
      isDateUnavailable={isValidationBlackout}
    >
      <header className="aria-collection-calendar-header">
        <Button slot="previous">Previous</Button>
        <Heading />
        <Button slot="next">Next</Button>
      </header>
      <CalendarGrid>
        <CalendarGridHeader>{renderCalendarHeaderCell}</CalendarGridHeader>
        <CalendarGridBody>{renderCalendarCell}</CalendarGridBody>
      </CalendarGrid>
    </Calendar>
  );
}

function ResponseRangeCalendar() {
  return (
    <RangeCalendar
      aria-label="Response period"
      defaultValue={SELECTED_RANGE}
      defaultFocusedValue={VISIBLE_MONTH}
    >
      <header className="aria-collection-calendar-header">
        <Button slot="previous">Previous</Button>
        <Heading />
        <Button slot="next">Next</Button>
      </header>
      <CalendarGrid>
        <CalendarGridHeader>{renderCalendarHeaderCell}</CalendarGridHeader>
        <CalendarGridBody>{renderCalendarCell}</CalendarGridBody>
      </CalendarGrid>
    </RangeCalendar>
  );
}

function RecordedDateField({ defaultValue, isInvalid }) {
  return (
    <DateField defaultValue={defaultValue} isInvalid={isInvalid}>
      <Label>Date recorded</Label>
      <DateInput>{renderDateSegment}</DateInput>
      <Text slot="description">
        Use the date the national focal point logged the event.
      </Text>
      <FieldError>
        The recorded date must fall inside the reporting period.
      </FieldError>
    </DateField>
  );
}

function RecordedDatePicker() {
  return (
    <DatePicker defaultValue={RECORDED_DATE}>
      <Label>Date recorded</Label>
      <Group>
        <DateInput>{renderDateSegment}</DateInput>
        <Button aria-label="Choose date recorded">Calendar</Button>
      </Group>
      <Popover>
        <Dialog>
          <Calendar aria-label="Date recorded">
            <header className="aria-collection-calendar-header">
              <Button slot="previous">Previous</Button>
              <Heading />
              <Button slot="next">Next</Button>
            </header>
            <CalendarGrid>
              <CalendarGridHeader>
                {renderCalendarHeaderCell}
              </CalendarGridHeader>
              <CalendarGridBody>{renderCalendarCell}</CalendarGridBody>
            </CalendarGrid>
          </Calendar>
        </Dialog>
      </Popover>
    </DatePicker>
  );
}

function ResponsePeriodRangePicker() {
  return (
    <DateRangePicker defaultValue={RESPONSE_RANGE}>
      <Label>Response period</Label>
      <Group>
        <DateInput slot="start">{renderDateSegment}</DateInput>
        <span aria-hidden="true"> to </span>
        <DateInput slot="end">{renderDateSegment}</DateInput>
        <Button aria-label="Choose response period">Calendar</Button>
      </Group>
      <Popover>
        <Dialog>
          <RangeCalendar aria-label="Response period">
            <header className="aria-collection-calendar-header">
              <Button slot="previous">Previous</Button>
              <Heading />
              <Button slot="next">Next</Button>
            </header>
            <CalendarGrid>
              <CalendarGridHeader>
                {renderCalendarHeaderCell}
              </CalendarGridHeader>
              <CalendarGridBody>{renderCalendarCell}</CalendarGridBody>
            </CalendarGrid>
          </RangeCalendar>
        </Dialog>
      </Popover>
    </DateRangePicker>
  );
}

function RecordStatusSelect({ defaultOpen }) {
  return (
    <Select defaultOpen={defaultOpen} defaultSelectedKey="validated">
      <Label>Record status</Label>
      <Button>
        <SelectValue />
        <span aria-hidden="true">▾</span>
      </Button>
      {/* Only the open-on-mount specimen skips the entry motion; the closed
          Select in the main gallery keeps it, so opening it by hand still
          shows the real transition. */}
      <Popover placement="bottom start" shouldSkipAnimation={defaultOpen}>
        <ListBox>
          <ListBoxItem id="draft">Draft</ListBoxItem>
          <ListBoxItem id="waiting">Waiting for validation</ListBoxItem>
          <ListBoxItem id="waiting-information">
            Waiting for information
          </ListBoxItem>
          <ListBoxItem id="published">Published</ListBoxItem>
        </ListBox>
      </Popover>
    </Select>
  );
}

function HazardComboBox() {
  return (
    <ComboBox defaultSelectedKey="cyclone">
      <Label>Hazard type</Label>
      <Group>
        <Input />
        <Button aria-label="Show suggested hazards">▾</Button>
      </Group>
      <Popover placement="bottom start">
        <ListBox>
          <ListBoxItem id="cyclone">Tropical cyclone</ListBoxItem>
          <ListBoxItem id="flood">Riverine flood</ListBoxItem>
          <ListBoxItem id="drought">Drought</ListBoxItem>
          <ListBoxItem id="heatwave">Heatwave</ListBoxItem>
        </ListBox>
      </Popover>
    </ComboBox>
  );
}

function EventSearchField({ defaultValue }) {
  return (
    <SearchField defaultValue={defaultValue}>
      <Label>Search hazardous events</Label>
      {/* SearchField provides GroupContext, so the Group inherits the field's
          invalid and disabled state. Grouping the input with its clear button
          matches NumberField, ComboBox, DatePicker and DateRangePicker, and
          lets the field and its button read as one joined control rather than
          two adjacent boxes. */}
      <Group>
        <Input placeholder="Search hazardous events" />
        <Button slot="clear" aria-label="Clear search">
          ×
        </Button>
      </Group>
    </SearchField>
  );
}

function EvidenceDropZone() {
  return (
    <DropZone aria-label="Attach event evidence">
      <Text slot="label">Drop or paste evidence here</Text>
    </DropZone>
  );
}

function RemovableHazardTags() {
  const [removedKeys, setRemovedKeys] = useState(new Set());
  const handleRemove = keys =>
    setRemovedKeys(current => {
      const next = new Set(current);
      keys.forEach(key => next.add(key));
      return next;
    });
  const visibleTags = REMOVABLE_HAZARD_TAGS.filter(
    tag => !removedKeys.has(tag.id)
  );

  return (
    <TagGroup onRemove={handleRemove}>
      <Label>Hazards in scope</Label>
      <TagList>
        {visibleTags.map(tag => (
          <Tag key={tag.id} id={tag.id} textValue={tag.label}>
            {tag.label}
            <Button slot="remove" aria-label={`Remove ${tag.label}`}>
              ×
            </Button>
          </Tag>
        ))}
      </TagList>
    </TagGroup>
  );
}

function GalleryIntro() {
  return (
    <header className="aria-collection-intro">
      <h2>React Aria collection, overlay and date states</h2>
      <p>
        Each specimen forces a state that the CRUD spike only reaches through
        interaction: selected and disabled rows, empty collections, open
        overlays, and calendar cells that are selected, disabled, unavailable or
        outside the visible month. Focus states are the exception and are called
        out where they apply.
      </p>
    </header>
  );
}

function TableSpecimens() {
  return (
    <CollectionSection
      title="Table, Row, Column and ColumnResizer"
      description="A sortable, resizable table with a selected row and a disabled row, plus the empty state."
    >
      <Specimen
        label="Selected row, disabled row, sortable column, resizer"
        caption="Riverine flood is selected and drought is disabled. Focus rings on Row, Column and ColumnResizer cannot be forced statically: tab into the table and then across the header to check them."
      >
        <HazardEventTable />
      </Specimen>
      <Specimen label="Empty table body">
        <EmptyEventTable />
      </Specimen>
    </CollectionSection>
  );
}

function ListSpecimens() {
  return (
    <CollectionSection
      title="ListBox, ListBoxSection and GridList"
      description="Multiple selection is set statically so selected, unselected and disabled items appear together."
    >
      <Specimen label="ListBox: sections, selected and disabled items">
        <HazardListBox />
      </Specimen>
      <Specimen label="GridList: selected and disabled items">
        <StationGridList />
      </Specimen>
    </CollectionSection>
  );
}

function OverlaySpecimens() {
  return (
    <CollectionSection
      title="Tooltip, and where the open overlays live"
      description="Overlays that open on mount cannot share a story: React Aria dismisses all but the last popover, and an open Menu, Select or Modal marks the rest of the page aria-hidden, which would make this gallery unreadable to a screen reader and unusable for an automated audit."
    >
      <Specimen
        label="Tooltip: open on mount"
        caption="A tooltip does not hide the rest of the page, so it can stay open here."
      >
        <TooltipTrigger isOpen>
          <Button>Sendai Framework target G</Button>
          <Tooltip>
            Substantially increase the availability of multi-hazard early
            warning systems.
          </Tooltip>
        </TooltipTrigger>
      </Specimen>
      <Specimen
        label="Menu, Popover, Select and Modal"
        caption="Each open overlay surface has its own story: Open Menu popover for Menu, MenuSection and a disabled MenuItem, Open Select popover for the Select listbox, and Modal surface for Modal, ModalOverlay and Dialog."
      >
        <div className="aria-collection-stack">
          <p>
            Open the Open Menu popover, Open Select popover and Modal surface
            stories to review those surfaces.
          </p>
        </div>
      </Specimen>
    </CollectionSection>
  );
}

function CalendarSpecimens() {
  return (
    <CollectionSection
      title="Calendar and RangeCalendar"
      description="Real disabled and unavailable cells, produced by minValue, maxValue and isDateUnavailable rather than faked attributes."
    >
      <Specimen
        label="Calendar: selected, disabled, unavailable and outside month"
        caption="The review window runs 6 to 26 May 2026, so days 1 to 5 and 27 to 31 are disabled. The 20th to the 22nd are unavailable but still focusable, so they need a 4.5:1 contrast ratio. Cells from the neighbouring months carry data-outside-month and may be hidden by the stylesheet."
      >
        <ReviewCalendar />
      </Specimen>
      <Specimen label="RangeCalendar: selected range">
        <ResponseRangeCalendar />
      </Specimen>
    </CollectionSection>
  );
}

function DateFieldSpecimens() {
  return (
    <CollectionSection
      title="DateField, DatePicker and DateRangePicker"
      description="Filled segments, placeholder segments and an invalid field."
    >
      <Specimen label="DateField: filled">
        <RecordedDateField defaultValue={RECORDED_DATE} />
      </Specimen>
      <Specimen
        label="DateField: placeholder segments"
        caption="With no value, every DateSegment carries data-placeholder."
      >
        <RecordedDateField />
      </Specimen>
      <Specimen label="DateField: invalid">
        <RecordedDateField defaultValue={RECORDED_DATE} isInvalid />
      </Specimen>
      <Specimen label="DatePicker: closed">
        <RecordedDatePicker />
      </Specimen>
      <Specimen label="DateRangePicker: closed, with a range">
        <ResponsePeriodRangePicker />
      </Specimen>
    </CollectionSection>
  );
}

function PickerSpecimens() {
  return (
    <CollectionSection
      title="Select, ComboBox and SearchField"
      description="Closed pickers plus one Select whose listbox popover opens on mount."
    >
      <Specimen
        label="Select: closed"
        caption="The same Select with its listbox popover open on mount is in the Open Select popover story, because only one popover can be open at a time."
      >
        <RecordStatusSelect />
      </Specimen>
      <Specimen label="ComboBox: closed">
        <HazardComboBox />
      </Specimen>
      <Specimen label="SearchField: empty">
        <EventSearchField />
      </Specimen>
      <Specimen label="SearchField: with a query">
        <EventSearchField defaultValue="cyclone" />
      </Specimen>
    </CollectionSection>
  );
}

function MiscSpecimens() {
  return (
    <CollectionSection
      title="DropZone, Tag removal, Separator and Header"
      description="The remaining surfaces the audit flagged."
    >
      <Specimen
        label="DropZone: resting"
        caption="Drop target styling cannot be forced statically: React Aria sets data-drop-target from a live drag operation, and faking the attribute would not prove the stylesheet reads it. Drag a file over the zone to check it, and tab to it to check the focus ring."
      >
        <EvidenceDropZone />
      </Specimen>
      <Specimen label="Tag with a remove button">
        <RemovableHazardTags />
      </Specimen>
      <Specimen label="Separator and standalone Header">
        <div className="aria-collection-stack">
          <Header>Regional platform outcomes</Header>
          <Separator />
          <Header>National platform commitments</Header>
        </div>
      </Specimen>
    </CollectionSection>
  );
}

function CollectionGallery() {
  return (
    <div className="aria-collection-gallery">
      <GalleryIntro />
      <TableSpecimens />
      <ListSpecimens />
      <OverlaySpecimens />
      <CalendarSpecimens />
      <DateFieldSpecimens />
      <PickerSpecimens />
      <MiscSpecimens />
    </div>
  );
}

function MenuPopoverSurface() {
  return (
    <div className="aria-collection-gallery">
      <header className="aria-collection-intro">
        <h2>Menu with its popover open</h2>
        <p>
          The menu opens on mount so the popover surface, the section headers,
          the normal items and the disabled item are visible without
          interaction. It has its own story because an open menu marks
          everything outside it aria-hidden.
        </p>
      </header>
      <AlertActionsMenu />
    </div>
  );
}

function SelectPopoverSurface() {
  return (
    <div className="aria-collection-gallery">
      <header className="aria-collection-intro">
        <h2>Select with its popover open</h2>
        <p>
          React Aria dismisses every popover but the last one when several open
          at the same time, so this Select gets its own story. The listbox
          surface, the selected option and the unselected options are all
          visible without interaction.
        </p>
      </header>
      <RecordStatusSelect defaultOpen />
    </div>
  );
}

function ModalSurface() {
  /* The overlay renders into this element instead of document.body, so the
     specimen stays inside its own frame on the Docs page. The stage is held in
     state rather than a ref because UNSTABLE_portalContainer must be a real
     node on the render that mounts the overlay. */
  const [stage, setStage] = useState(null);
  return (
    <div className="aria-collection-gallery">
      <header className="aria-collection-intro">
        <h2>Modal, ModalOverlay and Dialog</h2>
        <p>
          The modal opens on mount and has no close control, so the overlay
          scrim, the modal surface and its shadow are visible without
          interaction. It is portalled into the stage below rather than the
          document body: .react-aria-ModalOverlay is position: fixed, so an
          always-open specimen would otherwise cover the whole Docs page, which
          renders every story inline.
        </p>
      </header>
      <div className="aria-collection-modal-stage" ref={setStage}>
        {stage ? (
          <ModalOverlay isOpen UNSTABLE_portalContainer={stage}>
            <Modal>
              <Dialog>
                <Heading slot="title">Confirm event deletion</Heading>
                <p>
                  Deleting the riverine flood record removes it from the
                  national loss database and from the Sendai Framework monitor
                  return.
                </p>
                <div className="aria-collection-dialog-actions">
                  <Button slot="close">Cancel</Button>
                  <Button>Delete event</Button>
                </div>
              </Dialog>
            </Modal>
          </ModalOverlay>
        ) : null}
      </div>
    </div>
  );
}

export default {
  title: 'Spike/React Aria collection states',
  component: CollectionGallery,
  parameters: {
    docs: {
      description: {
        component:
          'State specimens for the React Aria collection, overlay and date components: tables with selected, disabled and empty states plus a column resizer, list boxes and grid lists with selection, overlays that open on mount, calendars with disabled and unavailable cells, and date fields in placeholder and invalid states. Nothing here passes a className to a React Aria component.',
      },
    },
  },
};

export const CollectionStates = {
  name: 'Collection, overlay and date states',
  render: () => <CollectionGallery />,
};

export const OpenMenuPopover = {
  name: 'Open Menu popover',
  render: () => <MenuPopoverSurface />,
};

export const OpenSelectPopover = {
  name: 'Open Select popover',
  render: () => <SelectPopoverSurface />,
};

export const ModalOverlaySurface = {
  name: 'Modal surface',
  render: () => <ModalSurface />,
};
