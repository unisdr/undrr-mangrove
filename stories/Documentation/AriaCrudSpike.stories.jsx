/*
 * React Aria CRUD proof using in-memory hazardous-event fixtures.
 * It exercises the table-heavy interactions DELTA needs without becoming a
 * reusable Mangrove component API or adding any production data integration.
 */
import React, { useEffect, useMemo, useState } from 'react';
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
  ComboBox,
  Column,
  ColumnResizer,
  DateInput,
  DatePicker,
  DateSegment,
  Dialog,
  DialogTrigger,
  DropZone,
  FieldError,
  Form,
  Group,
  GridList,
  GridListItem,
  Heading,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Menu,
  MenuItem,
  MenuTrigger,
  Modal,
  ModalOverlay,
  Popover,
  Row,
  SearchField,
  Select,
  SelectValue,
  SubmenuTrigger,
  Tag,
  TagGroup,
  TagList,
  Table,
  TableBody,
  TableHeader,
  TextField,
  ResizableTableContainer,
  ToggleButton,
  Tooltip,
  TooltipTrigger,
  isFileDropItem,
} from 'react-aria-components';
import Pager from '../Components/Pager/Pager';
// Spike-demo composition styles. Imported here rather than in the theme
// rollup so these fixtures are not shipped in every consumer's stylesheet.
import '../assets/scss/aria/_spike-demo.scss';

const initialEvents = [
  {
    id: 'cyclone',
    hazard: 'Tropical Cyclone',
    status: 'Waiting for information',
    cycle: 'Rapid onset',
    sunlight: 'High',
    watering: 'Average',
    favorite: false,
    image: 'icons/ocha/cyclone.svg',
    note: 'HIPS-001',
    updated: '2026-05-02',
  },
  {
    id: 'cholera',
    hazard: 'Cholera',
    status: 'Published',
    cycle: 'Slow onset',
    sunlight: 'Low',
    watering: 'Minimum',
    favorite: false,
    image: 'icons/ocha/epidemic.svg',
    note: 'HIPS-002',
    updated: '2026-05-02',
  },
  {
    id: 'drought',
    hazard: 'Drought',
    status: 'Draft',
    cycle: 'Slow onset',
    sunlight: 'High',
    watering: 'Minimum',
    favorite: false,
    image: 'icons/ocha/drought.svg',
    note: 'HIPS-003',
    updated: '2026-05-02',
  },
  {
    id: 'heatwave',
    hazard: 'Heatwave',
    status: 'Draft',
    cycle: 'Rapid onset',
    sunlight: 'High',
    watering: 'Average',
    favorite: false,
    image: 'icons/ocha/heatwave.svg',
    note: 'HIPS-004',
    updated: '2026-05-02',
  },
  {
    id: 'flood',
    hazard: 'Riverine Flood',
    status: 'Waiting for validation',
    cycle: 'Rapid onset',
    sunlight: 'Medium',
    watering: 'Frequent',
    favorite: false,
    image: 'icons/ocha/flood.svg',
    note: 'HIPS-005',
    updated: '2026-05-01',
  },
];
/* The four states come from DELTA's "Status Labels for Records and Events"
   board, which is what the mg-status-label component implements. Keeping the
   demo on that vocabulary means the swatch on screen is the real one. */
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

/* UN Editorial Manual style: day, month name, year, no ordinal and no comma.
   Dates are held as ISO 8601 so they sort, and so the value a DatePicker writes
   back matches the seed data; the ISO form stays in the datetime attribute for
   machines while people read the unambiguous spelled-out month. */
const UN_DATE = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

function formatUnDate(iso) {
  const parsed = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? iso : UN_DATE.format(parsed);
}

// Default widths are sized from the label, not from the data. A sortable
// header spends roughly 80px on chrome before the label gets any room: the
// column's own padding, the lane the stylesheet reserves for the sort
// indicator, and the ColumnResizer's WCAG 2.5.8 hit area. `Exposure` at 130px
// left the label 48px and broke it mid-word as `Exposur / e`. Each width below
// clears its label by ~20-30px, so English sits on one line and a longer
// translated string wraps between words instead of inside one.
const allColumns = [
  { id: 'hazard', label: 'Hazard type', width: 220 },
  { id: 'cycle', label: 'Onset', width: 150 },
  { id: 'sunlight', label: 'Exposure', width: 170 },
  { id: 'watering', label: 'Severity', width: 170 },
  { id: 'status', label: 'Record status', width: 200 },
  { id: 'updated', label: 'Updated', width: 160 },
];

function EventEditor({ item, onClose, onSave }) {
  const [draft, setDraft] = useState(
    item || {
      hazard: '',
      status: 'Draft',
      cycle: 'Rapid onset',
      sunlight: 'High',
      watering: 'Average',
    }
  );
  const [showValidation, setShowValidation] = useState(false);
  const [droppedImage, setDroppedImage] = useState(item?.image);
  const set = (key, value) =>
    setDraft(current => ({ ...current, [key]: value }));
  const submit = event => {
    event.preventDefault();
    if (!draft.hazard.trim() || !draft.note?.trim()) {
      setShowValidation(true);
      return;
    }
    onSave({
      ...draft,
      image: droppedImage,
      id: item?.id || crypto.randomUUID(),
      favorite: item?.favorite || false,
      updated: draft.updated || '2026-08-26',
    });
  };
  return (
    <ModalOverlay isOpen onOpenChange={open => !open && onClose()}>
      <Modal>
        {/* The default class is re-added by hand: React Aria replaces
            `react-aria-Dialog` when a className is supplied, and the
            stylesheet keys the outline treatment for slot="close" off
            it. Same pattern as the Column and Cell overrides below. */}
        <Dialog className="react-aria-Dialog aria-crud-editor">
          {() => (
            <Form
              noValidate
              onSubmit={submit}
              className="react-aria-Form aria-crud-editor"
            >
              <Heading
                slot="title"
                className="react-aria-Heading aria-crud-editor__title"
              >
                {item ? 'Edit hazardous event' : 'Add hazardous event'}
              </Heading>
              <div className="mg-grid mg-grid__col-2 aria-crud-editor__identity">
                <DropZone
                  aria-label="Attach event evidence"
                  getDropOperation={types =>
                    types.has('image/jpeg') || types.has('image/png')
                      ? 'copy'
                      : 'cancel'
                  }
                  onDrop={async event => {
                    const image = event.items
                      .filter(isFileDropItem)
                      .find(
                        dropItem =>
                          dropItem.type === 'image/jpeg' ||
                          dropItem.type === 'image/png'
                      );
                    if (image) {
                      setDroppedImage(
                        URL.createObjectURL(await image.getFile())
                      );
                    }
                  }}
                >
                  {droppedImage ? (
                    <img alt="" src={droppedImage} />
                  ) : (
                    <>
                      <span aria-hidden="true">⇧</span>
                      <span>Drop or paste an image here</span>
                    </>
                  )}
                </DropZone>
                <ComboBox
                  allowsCustomValue
                  isRequired
                  inputValue={draft.hazard}
                  onInputChange={value => set('hazard', value)}
                  onSelectionChange={key => set('hazard', String(key))}
                  isInvalid={showValidation && !draft.hazard.trim()}
                >
                  <Label className="mg-form-label">Hazard type</Label>
                  <Group>
                    <Input
                      className="mg-form-input"
                      placeholder="Enter hazard type"
                    />
                    <Button
                      className="mg-button mg-button-primary mg-button-outline"
                      aria-label="Show suggested hazards"
                    >
                      ▾
                    </Button>
                  </Group>
                  <Popover>
                    <ListBox items={initialEvents}>
                      {event => (
                        <ListBoxItem id={event.hazard} textValue={event.hazard}>
                          {event.hazard}
                        </ListBoxItem>
                      )}
                    </ListBox>
                  </Popover>
                  <FieldError>A hazard type is required.</FieldError>
                </ComboBox>
              </div>
              <div className="aria-crud-editor__fields">
                <TextField
                  className="mg-form-field"
                  isRequired
                  value={draft.note || ''}
                  onChange={value => set('note', value)}
                  isInvalid={showValidation && !draft.note?.trim()}
                >
                  <Label className="mg-form-label">Event reference</Label>
                  <Input
                    className="mg-form-input"
                    placeholder="Enter reference"
                  />
                  <FieldError>An event reference is required.</FieldError>
                </TextField>
                <Select
                  className="mg-form-field"
                  selectedKey={draft.status}
                  onSelectionChange={key => set('status', String(key))}
                >
                  <Label className="mg-form-label">Record status</Label>
                  <Button className="mg-form-select">
                    <SelectValue />
                    <span aria-hidden="true">▾</span>
                  </Button>
                  <Popover>
                    <ListBox
                      items={[
                        'Draft',
                        'Waiting for validation',
                        'Waiting for information',
                        'Published',
                      ]}
                    >
                      {value => <ListBoxItem id={value}>{value}</ListBoxItem>}
                    </ListBox>
                  </Popover>
                </Select>
                <DatePicker
                  className="mg-form-field"
                  onChange={value =>
                    set('updated', value?.toString() || draft.updated)
                  }
                >
                  <Label className="mg-form-label">Date recorded</Label>
                  <Group>
                    <DateInput className="mg-form-input">
                      {segment => <DateSegment segment={segment} />}
                    </DateInput>
                    <Button
                      className="mg-button mg-button-primary mg-button-outline"
                      aria-label="Choose date"
                    >
                      ▾
                    </Button>
                  </Group>
                  <Popover>
                    <Dialog>
                      <Calendar aria-label="Date recorded">
                        <header className="aria-calendar-header">
                          <Button
                            slot="previous"
                            className="mg-button mg-button-primary mg-button-outline"
                          >
                            ‹
                          </Button>
                          <Heading />
                          <Button
                            slot="next"
                            className="mg-button mg-button-primary mg-button-outline"
                          >
                            ›
                          </Button>
                        </header>
                        <CalendarGrid>
                          <CalendarGridHeader>
                            {day => (
                              <CalendarHeaderCell>{day}</CalendarHeaderCell>
                            )}
                          </CalendarGridHeader>
                          <CalendarGridBody>
                            {date => <CalendarCell date={date} />}
                          </CalendarGridBody>
                        </CalendarGrid>
                      </Calendar>
                    </Dialog>
                  </Popover>
                </DatePicker>
                <Select
                  className="mg-form-field"
                  selectedKey={draft.cycle}
                  onSelectionChange={key => set('cycle', String(key))}
                >
                  <Label className="mg-form-label">Onset</Label>
                  <Button className="mg-form-select">
                    <SelectValue />
                    <span aria-hidden="true">▾</span>
                  </Button>
                  <Popover>
                    <ListBox items={['Rapid onset', 'Slow onset']}>
                      {value => <ListBoxItem id={value}>{value}</ListBoxItem>}
                    </ListBox>
                  </Popover>
                </Select>
                <Select
                  className="mg-form-field"
                  selectedKey={draft.sunlight}
                  onSelectionChange={key => set('sunlight', String(key))}
                >
                  <Label className="mg-form-label">Exposure</Label>
                  <Button className="mg-form-select">
                    <SelectValue />
                    <span aria-hidden="true">▾</span>
                  </Button>
                  <Popover>
                    <ListBox items={['Low', 'Medium', 'High']}>
                      {value => <ListBoxItem id={value}>{value}</ListBoxItem>}
                    </ListBox>
                  </Popover>
                </Select>
                <Select
                  className="mg-form-field"
                  selectedKey={draft.watering}
                  onSelectionChange={key => set('watering', String(key))}
                >
                  <Label className="mg-form-label">Severity</Label>
                  <Button className="mg-form-select">
                    <SelectValue />
                    <span aria-hidden="true">▾</span>
                  </Button>
                  <Popover>
                    <ListBox items={['Minimum', 'Average', 'Frequent']}>
                      {value => <ListBoxItem id={value}>{value}</ListBoxItem>}
                    </ListBox>
                  </Popover>
                </Select>
              </div>
              <div className="aria-crud-actions">
                {/* slot="close" now gets Mangrove's real outline button from
                    the React Aria stylesheet, so the legacy .mg-button classes
                    that used to stand in for a missing quiet variant are gone.
                    onPress is kept because this dialog owns the editing state
                    and has to discard the draft, not just close. */}
                <Button slot="close" onPress={onClose} type="button">
                  Cancel
                </Button>
                <Button type="submit">{item ? 'Save' : 'Add'}</Button>
              </div>
            </Form>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

function DeleteDialog({ item, onClose, onDelete }) {
  return (
    <ModalOverlay isOpen onOpenChange={open => !open && onClose()}>
      <Modal>
        <Dialog>
          {() => (
            <>
              <Heading slot="title">Delete event?</Heading>
              <p>
                Delete {item.hazard}? This only changes the in-memory spike
                data.
              </p>
              <div className="aria-crud-actions">
                <Button slot="close" onPress={onClose}>
                  Cancel
                </Button>
                <Button onPress={() => onDelete(item.id)}>Delete</Button>
              </div>
            </>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

function FilterTags({ label, items, selectedKeys, onSelectionChange }) {
  return (
    <TagGroup
      selectionMode="multiple"
      selectedKeys={selectedKeys}
      onSelectionChange={onSelectionChange}
    >
      <Label className="mg-form-label">{label}</Label>
      <TagList className="mg-tag-container" items={items}>
        {value => (
          <Tag
            id={value}
            className={({ isSelected }) =>
              `mg-tag${isSelected ? '' : ' mg-tag--outline'}`
            }
          >
            {value}
          </Tag>
        )}
      </TagList>
    </TagGroup>
  );
}

function CrudDemo() {
  const [items, setItems] = useState(initialEvents);
  const [search, setSearch] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [statuses, setStatuses] = useState(new Set());
  const [cycles, setCycles] = useState(new Set());
  const [exposures, setExposures] = useState(new Set());
  const [severities, setSeverities] = useState(new Set());
  const [visibleColumns, setVisibleColumns] = useState(
    new Set(allColumns.map(column => column.id))
  );
  const [selected, setSelected] = useState(new Set());
  const [sort, setSort] = useState({
    column: 'hazard',
    direction: 'ascending',
  });
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const columns = allColumns.filter(column => visibleColumns.has(column.id));
  const filtered = useMemo(
    () =>
      items
        .filter(
          item =>
            item.hazard.toLowerCase().includes(search.toLowerCase()) &&
            (!favoritesOnly || item.favorite) &&
            (!statuses.size || statuses.has(item.status)) &&
            (!cycles.size || cycles.has(item.cycle)) &&
            (!exposures.size || exposures.has(item.sunlight)) &&
            (!severities.size || severities.has(item.watering))
        )
        .sort(
          (a, b) =>
            a[sort.column].localeCompare(b[sort.column]) *
            (sort.direction === 'ascending' ? 1 : -1)
        ),
    [
      items,
      search,
      favoritesOnly,
      statuses,
      cycles,
      exposures,
      severities,
      sort,
    ]
  );
  const pageSize = 3,
    pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
  const save = item => {
    setItems(current => {
      const index = current.findIndex(entry => entry.id === item.id);
      return index < 0
        ? [...current, item]
        : current.map(entry => (entry.id === item.id ? item : entry));
    });
    setEditing(null);
  };
  const deleteItem = id => {
    setItems(current => current.filter(item => item.id !== id));
    setSelected(current => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
    setDeleting(null);
  };
  const toggleFavorite = id =>
    setItems(current =>
      current.map(item =>
        item.id === id ? { ...item, favorite: !item.favorite } : item
      )
    );
  const filterCount =
    Number(favoritesOnly) +
    statuses.size +
    cycles.size +
    exposures.size +
    severities.size;
  const clearFilters = () => {
    setFavoritesOnly(false);
    setStatuses(new Set());
    setCycles(new Set());
    setExposures(new Set());
    setSeverities(new Set());
    setPage(1);
  };
  return (
    <div className="aria-crud-demo">
      {/* The toolbar deliberately keeps Mangrove's legacy .mg-button classes on
          React Aria triggers: the point of the spike is that the two surfaces
          coexist in one page, and a Drupal site adopting React Aria will have
          exactly this mix for a while. The dialog action rows below do not -
          there the React Aria stylesheet now supplies both the primary and the
          outline treatment, so reaching for .mg-button would only be a
          leftover. */}
      <div className="aria-crud-toolbar">
        {/* SearchField provides GroupContext, so the Group inherits the
            field's invalid and disabled state and the input plus its clear
            button read as one joined control - the same shape as the
            ComboBox and DatePicker below. The legacy mg-search__* wrapper
            classes were a workaround for the React Aria surface having no
            joined-field treatment; it has one now, so the demo shows the
            React Aria field as it actually ships. */}
        <SearchField
          className="react-aria-SearchField aria-crud-search"
          aria-label="Search events"
          value={search}
          onChange={value => {
            setSearch(value);
            setPage(1);
          }}
        >
          <Group>
            <Input placeholder="Search hazardous events" />
            {search && (
              <Button slot="clear" aria-label="Clear search">
                ×
              </Button>
            )}
          </Group>
        </SearchField>
        <DialogTrigger>
          <TooltipTrigger>
            <Button className="mg-button mg-button-primary mg-button-outline">
              Filters{filterCount ? ` (${filterCount})` : ''}
            </Button>
            <Tooltip>Filters</Tooltip>
          </TooltipTrigger>
          <Popover>
            <Dialog>
              <Heading slot="title">Filters</Heading>
              {filterCount > 0 && (
                <Button
                  className="mg-button mg-button-primary mg-button-outline"
                  onPress={clearFilters}
                >
                  Clear filters
                </Button>
              )}
              <Checkbox
                isSelected={favoritesOnly}
                onChange={value => {
                  setFavoritesOnly(value);
                  setPage(1);
                }}
              >
                Favorites
              </Checkbox>
              <FilterTags
                label="Record status"
                items={[
                  'Draft',
                  'Waiting for validation',
                  'Waiting for information',
                  'Published',
                ]}
                selectedKeys={statuses}
                onSelectionChange={keys => {
                  setStatuses(new Set(keys));
                  setPage(1);
                }}
              />
              <FilterTags
                label="Onset"
                items={['Rapid onset', 'Slow onset']}
                selectedKeys={cycles}
                onSelectionChange={keys => {
                  setCycles(new Set(keys));
                  setPage(1);
                }}
              />
              <FilterTags
                label="Exposure"
                items={['Low', 'Medium', 'High']}
                selectedKeys={exposures}
                onSelectionChange={keys => {
                  setExposures(new Set(keys));
                  setPage(1);
                }}
              />
              <FilterTags
                label="Severity"
                items={['Minimum', 'Average', 'Frequent']}
                selectedKeys={severities}
                onSelectionChange={keys => {
                  setSeverities(new Set(keys));
                  setPage(1);
                }}
              />
            </Dialog>
          </Popover>
        </DialogTrigger>
        <MenuTrigger>
          <TooltipTrigger>
            <Button
              className="mg-button mg-button-primary mg-button-outline"
              aria-label="Columns"
            >
              Columns
            </Button>
            <Tooltip>Choose visible columns</Tooltip>
          </TooltipTrigger>
          <Popover>
            <Menu
              aria-label="Visible columns"
              selectionMode="multiple"
              selectedKeys={visibleColumns}
              onSelectionChange={keys => setVisibleColumns(new Set(keys))}
            >
              {allColumns.map(column => (
                <MenuItem key={column.id} id={column.id}>
                  {column.label}
                </MenuItem>
              ))}
            </Menu>
          </Popover>
        </MenuTrigger>
        <Button
          className="mg-button mg-button-primary"
          onPress={() => setEditing({})}
        >
          Add event
        </Button>
      </div>
      <ResizableTableContainer className="react-aria-ResizableTableContainer aria-spike-table-scroll mg-u-responsive--show-large">
        <Table
          aria-label="Hazardous events"
          selectionMode="multiple"
          selectedKeys={selected}
          onSelectionChange={keys =>
            setSelected(
              keys === 'all' ? new Set(pageItems.map(item => item.id)) : keys
            )
          }
          sortDescriptor={sort}
          onSortChange={descriptor => {
            setSort(descriptor);
            setPage(1);
          }}
        >
          <TableHeader>
            <Column
              id="selection"
              width={40}
              minWidth={40}
              maxWidth={40}
              className="react-aria-Column aria-crud-selection-column"
            >
              <Checkbox slot="selection" aria-label="Select all" />
            </Column>
            <Column
              id="favorite"
              width={40}
              minWidth={40}
              maxWidth={40}
              aria-label="Favorite"
              className="react-aria-Column aria-crud-favorite-column"
            />
            {columns.map(column => (
              <Column
                key={column.id}
                id={column.id}
                isRowHeader={column.id === 'hazard'}
                allowsSorting
                defaultWidth={column.width}
              >
                {/* No hand-rolled sort arrow here. The distributed
                    stylesheet draws the indicator from React Aria's own
                    data-sort-direction attribute, and React Aria sets
                    aria-sort for assistive technology, so a second glyph in
                    story code only duplicated it - and in RTL sat next to the
                    neighbouring column's label. */}
                <div className="aria-spike-column-header">
                  <span>{column.label}</span>
                  <ColumnResizer />
                </div>
              </Column>
            ))}
            <Column id="actions" width={64} aria-label="Actions" />
          </TableHeader>
          <TableBody
            items={pageItems}
            dependencies={[visibleColumns]}
            renderEmptyState={() => 'No results. Try changing the filters.'}
          >
            {item => (
              <Row>
                <Cell className="react-aria-Cell aria-crud-selection-cell">
                  <Checkbox
                    slot="selection"
                    aria-label={`Select ${item.hazard}`}
                  />
                </Cell>
                <Cell className="react-aria-Cell aria-crud-favorite-cell">
                  <ToggleButton
                    className="mg-button mg-button-primary mg-button-outline aria-crud-favorite-button"
                    aria-label={`Favorite ${item.hazard}`}
                    isSelected={item.favorite}
                    onChange={() => toggleFavorite(item.id)}
                  >
                    {item.favorite ? '★' : '☆'}
                  </ToggleButton>
                </Cell>
                {columns.map(column => (
                  <Cell key={column.id}>
                    {column.id === 'hazard' ? (
                      <div className="aria-crud-event-identity">
                        {item.image && <img alt="" src={item.image} />}
                        <span>
                          <strong>{item.hazard}</strong>
                          {item.note && <small>{item.note}</small>}
                        </span>
                      </div>
                    ) : column.id === 'status' ? (
                      <StatusLabel status={item.status} />
                    ) : column.id === 'updated' ? (
                      <time
                        // A UN-style date opens with a weak-direction
                        // numeral, which an RTL base direction reorders
                        // to "May 2026 2". dir="auto" isolates the run.
                        dir="auto"
                        dateTime={item.updated}
                      >
                        {formatUnDate(item.updated)}
                      </time>
                    ) : (
                      item[column.id]
                    )}
                  </Cell>
                ))}
                <Cell>
                  <MenuTrigger>
                    <Button
                      className="mg-button mg-button-primary mg-button-outline"
                      aria-label={`Actions for ${item.hazard}`}
                    >
                      •••
                    </Button>
                    <Popover>
                      <Menu aria-label={`Actions for ${item.hazard}`}>
                        <MenuItem
                          id="favorite"
                          onAction={() => toggleFavorite(item.id)}
                        >
                          {item.favorite ? 'Unfavorite' : 'Favorite'}
                        </MenuItem>
                        <MenuItem id="edit" onAction={() => setEditing(item)}>
                          Edit…
                        </MenuItem>
                        <MenuItem
                          id="delete"
                          onAction={() => setDeleting(item)}
                        >
                          Delete…
                        </MenuItem>
                        <SubmenuTrigger>
                          <MenuItem id="share">Share</MenuItem>
                          <Popover>
                            <Menu aria-label={`Share ${item.hazard}`}>
                              <MenuItem
                                id="copy-link"
                                onAction={() =>
                                  navigator.clipboard?.writeText(item.hazard)
                                }
                              >
                                Copy reference
                              </MenuItem>
                              <MenuItem
                                id="email"
                                href={`mailto:?subject=${encodeURIComponent(item.hazard)}`}
                              >
                                Email
                              </MenuItem>
                            </Menu>
                          </Popover>
                        </SubmenuTrigger>
                      </Menu>
                    </Popover>
                  </MenuTrigger>
                </Cell>
              </Row>
            )}
          </TableBody>
        </Table>
      </ResizableTableContainer>
      <GridList
        className="react-aria-GridList mg-u-responsive--show-small aria-crud-list"
        aria-label="Hazardous events"
        items={pageItems}
      >
        {item => (
          <GridListItem className="aria-crud-card" textValue={item.hazard}>
            <div className="aria-crud-card__header">
              <div className="aria-crud-event-identity">
                {item.image && <img alt="" src={item.image} />}
                <span>
                  <strong>{item.hazard}</strong>
                  {item.note && <small>{item.note}</small>}
                  <small>{item.status}</small>
                </span>
              </div>
              <div className="aria-crud-actions">
                <ToggleButton
                  className="mg-button mg-button-primary mg-button-outline aria-crud-favorite-button"
                  aria-label={`Favorite ${item.hazard}`}
                  isSelected={item.favorite}
                  onChange={() => toggleFavorite(item.id)}
                >
                  {item.favorite ? '★' : '☆'}
                </ToggleButton>
                <MenuTrigger>
                  <Button
                    className="mg-button mg-button-primary mg-button-outline"
                    aria-label={`Actions for ${item.hazard}`}
                  >
                    •••
                  </Button>
                  <Popover>
                    <Menu aria-label={`Actions for ${item.hazard}`}>
                      <MenuItem
                        id="favorite"
                        onAction={() => toggleFavorite(item.id)}
                      >
                        {item.favorite ? 'Unfavorite' : 'Favorite'}
                      </MenuItem>
                      <MenuItem id="edit" onAction={() => setEditing(item)}>
                        Edit…
                      </MenuItem>
                      <MenuItem id="delete" onAction={() => setDeleting(item)}>
                        Delete…
                      </MenuItem>
                      <SubmenuTrigger>
                        <MenuItem id="share">Share</MenuItem>
                        <Popover>
                          <Menu aria-label={`Share ${item.hazard}`}>
                            <MenuItem
                              id="copy-link"
                              onAction={() =>
                                navigator.clipboard?.writeText(item.hazard)
                              }
                            >
                              Copy reference
                            </MenuItem>
                            <MenuItem
                              id="email"
                              href={`mailto:?subject=${encodeURIComponent(item.hazard)}`}
                            >
                              Email
                            </MenuItem>
                          </Menu>
                        </Popover>
                      </SubmenuTrigger>
                    </Menu>
                  </Popover>
                </MenuTrigger>
              </div>
            </div>
            <div className="aria-crud-card__meta">
              <span className="mg-tag mg-tag--outline">{item.cycle}</span>
              <span className="mg-tag mg-tag--outline">{item.sunlight}</span>
            </div>
          </GridListItem>
        )}
      </GridList>
      <Pager
        layout="bar"
        page={page}
        totalPages={pageCount}
        onPageChange={setPage}
        range={{
          start: filtered.length ? (page - 1) * pageSize + 1 : 0,
          end: Math.min(page * pageSize, filtered.length),
        }}
      />
      {editing && (
        <EventEditor
          item={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
      {deleting && (
        <DeleteDialog
          item={deleting}
          onClose={() => setDeleting(null)}
          onDelete={deleteItem}
        />
      )}
    </div>
  );
}

export default {
  title: 'Spike/React Aria CRUD',
  component: CrudDemo,
  parameters: {
    docs: {
      description: {
        component:
          'A complete in-memory CRUD interaction proof: search, filters, column visibility and resizing, selection, menus, responsive list view, and create/edit/delete overlays.',
      },
    },
  },
};
export const CrudExample = {
  name: 'CRUD example',
  render: () => <CrudDemo />,
};
