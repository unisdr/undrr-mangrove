import React, { useMemo, useState } from 'react';
import {
  Cell,
  Column,
  Row,
  Table,
  TableBody,
  TableHeader,
} from 'react-aria-components';
import ComboBox from '@undrr/undrr-mangrove/components/ComboBox.js';
import { Drawer } from '@undrr/undrr-mangrove/components/Drawer.js';
import Select from '@undrr/undrr-mangrove/components/Select.js';
import TextInput from '@undrr/undrr-mangrove/components/TextInput.js';

const seedRecords = [
  {
    id: 'record-flood',
    hazardId: 'flood',
    status: 'draft',
    titles: {
      en: 'Riverine flood assessment',
      ar: 'تقييم فيضانات الأنهار',
      fr: 'Évaluation des crues fluviales',
    },
  },
  {
    id: 'record-drought',
    hazardId: 'drought',
    status: 'published',
    titles: {
      en: 'Drought preparedness brief',
      ar: 'موجز التأهب للجفاف',
      fr: 'Note sur la préparation à la sécheresse',
    },
  },
  {
    id: 'record-cyclone',
    hazardId: 'cyclone',
    status: 'draft',
    titles: {
      en: 'Cyclone watch update',
      ar: 'تحديث مراقبة الأعاصير',
      fr: 'Point sur la surveillance des cyclones',
    },
  },
];

const copy = {
  en: {
    heading: 'Try a small record workflow',
    intro:
      'Create, read, update and delete records in memory. React Aria supplies table navigation and sorting; Mangrove supplies the editor controls, buttons, Drawer and theme. Nothing is sent to Drupal.',
    tableLabel: 'Hazard records',
    scrollLabel: 'Scrollable hazard records',
    title: 'Record title',
    hazard: 'Hazard type',
    status: 'Status',
    actions: 'Actions',
    draft: 'Draft',
    published: 'Published',
    add: 'Add record',
    edit: 'Edit',
    delete: 'Delete',
    createTitle: 'Add a record',
    editTitle: 'Edit record',
    deleteTitle: 'Delete record',
    deleteQuestion: 'Delete this record from the local example?',
    save: 'Save record',
    cancel: 'Cancel',
    close: 'Close',
    suggestions: 'Show suggested hazards',
    hazardError: 'Choose a hazard type.',
    empty: 'No records match this hazard. Clear the filter or add a record.',
    count: count => `${count} ${count === 1 ? 'record' : 'records'} shown`,
    created: 'Record added.',
    updated: 'Record updated.',
    deleted: 'Record deleted.',
  },
  ar: {
    heading: 'جرّب إدارة سجلّات صغيرة',
    intro:
      'أنشئ السجلّات واعرضها وعدّلها واحذفها محليًا. توفّر React Aria التنقّل والفرز في الجدول؛ وتوفّر Mangrove حقول التحرير والأزرار والدرج والسمة. لا تُرسل البيانات إلى Drupal.',
    tableLabel: 'سجلّات المخاطر',
    scrollLabel: 'سجلّات مخاطر قابلة للتمرير',
    title: 'عنوان السجل',
    hazard: 'نوع الخطر',
    status: 'الحالة',
    actions: 'الإجراءات',
    draft: 'مسودة',
    published: 'منشور',
    add: 'أضف سجلًا',
    edit: 'عدّل',
    delete: 'احذف',
    createTitle: 'أضف سجلًا',
    editTitle: 'عدّل السجل',
    deleteTitle: 'احذف السجل',
    deleteQuestion: 'هل تريد حذف هذا السجل من المثال المحلي؟',
    save: 'احفظ السجل',
    cancel: 'إلغاء',
    close: 'أغلق',
    suggestions: 'اعرض المخاطر المقترحة',
    hazardError: 'اختر نوع خطر.',
    empty: 'لا توجد سجلّات مطابقة. امسح عامل التصفية أو أضف سجلًا.',
    count: count => `${count} سجلّات معروضة`,
    created: 'أُضيف السجل.',
    updated: 'حُدّث السجل.',
    deleted: 'حُذف السجل.',
  },
  fr: {
    heading: 'Essayer la gestion de fiches',
    intro:
      'Créez, consultez, modifiez et supprimez des fiches en mémoire. React Aria assure la navigation et le tri du tableau ; Mangrove fournit les champs, les boutons, le tiroir et le thème. Rien n’est envoyé à Drupal.',
    tableLabel: 'Fiches sur les aléas',
    scrollLabel: 'Fiches sur les aléas, défilement horizontal',
    title: 'Titre de la fiche',
    hazard: 'Type d’aléa',
    status: 'Statut',
    actions: 'Actions',
    draft: 'Brouillon',
    published: 'Publié',
    add: 'Ajouter une fiche',
    edit: 'Modifier',
    delete: 'Supprimer',
    createTitle: 'Ajouter une fiche',
    editTitle: 'Modifier la fiche',
    deleteTitle: 'Supprimer la fiche',
    deleteQuestion: 'Supprimer cette fiche de l’exemple local ?',
    save: 'Enregistrer la fiche',
    cancel: 'Annuler',
    close: 'Fermer',
    suggestions: 'Afficher les aléas suggérés',
    hazardError: 'Choisissez un type d’aléa.',
    empty:
      'Aucune fiche ne correspond. Effacez le filtre ou ajoutez une fiche.',
    count: count =>
      `${count} ${count === 1 ? 'fiche affichée' : 'fiches affichées'}`,
    created: 'Fiche ajoutée.',
    updated: 'Fiche modifiée.',
    deleted: 'Fiche supprimée.',
  },
};

const titleFor = (record, locale) =>
  record.titles[locale] || record.titles.en || Object.values(record.titles)[0];

export default function CrudDemo({ items, locale, filterHazardId }) {
  const t = copy[locale];
  const [records, setRecords] = useState(seedRecords);
  const [sort, setSort] = useState({
    column: 'title',
    direction: 'ascending',
  });
  const [mode, setMode] = useState(null);
  const [draft, setDraft] = useState(null);
  const [portalHost, setPortalHost] = useState(null);
  const [notice, setNotice] = useState('');
  const hazardNames = useMemo(
    () => Object.fromEntries(items.map(item => [item.id, item.label])),
    [items]
  );
  const visibleRecords = useMemo(() => {
    const collator = new Intl.Collator(locale);
    const valueFor = record => {
      if (sort.column === 'hazard') {
        return hazardNames[record.hazardId] || record.hazardId;
      }
      if (sort.column === 'status') return t[record.status];
      return titleFor(record, locale);
    };
    return records
      .filter(record => !filterHazardId || record.hazardId === filterHazardId)
      .sort(
        (first, second) =>
          collator.compare(valueFor(first), valueFor(second)) *
          (sort.direction === 'descending' ? -1 : 1)
      );
  }, [filterHazardId, hazardNames, locale, records, sort, t]);

  const startCreate = () => {
    setNotice('');
    setDraft({
      id: null,
      title: '',
      hazardId: filterHazardId,
      status: 'draft',
    });
    setMode('create');
  };
  const startEdit = record => {
    setNotice('');
    setDraft({
      id: record.id,
      title: titleFor(record, locale),
      hazardId: record.hazardId,
      status: record.status,
    });
    setMode('edit');
  };
  const save = event => {
    event.preventDefault();
    if (!draft.title.trim() || !draft.hazardId) return;
    setRecords(current => {
      const existing = current.find(record => record.id === draft.id);
      const next = {
        id: draft.id || crypto.randomUUID(),
        hazardId: draft.hazardId,
        status: draft.status,
        titles: { ...existing?.titles, [locale]: draft.title.trim() },
      };
      return existing
        ? current.map(record => (record.id === draft.id ? next : record))
        : [...current, next];
    });
    setNotice(mode === 'create' ? 'created' : 'updated');
    setMode(null);
  };
  const remove = () => {
    setRecords(current => current.filter(record => record.id !== draft.id));
    setNotice('deleted');
    setMode(null);
  };

  return (
    <section className="consumer-crud" aria-labelledby="consumer-crud-title">
      <div className="consumer-crud__heading">
        <div>
          <h2 id="consumer-crud-title">{t.heading}</h2>
          <p>{t.intro}</p>
        </div>
        <button
          type="button"
          className="mg-button mg-button-primary"
          onClick={startCreate}
          disabled={!items.length}
        >
          {t.add}
        </button>
      </div>
      <p className="consumer-crud__count">{t.count(visibleRecords.length)}</p>
      <div
        className="consumer-crud__scroll"
        role="region"
        aria-label={t.scrollLabel}
        tabIndex={0}
      >
        <Table
          className="consumer-crud__table"
          aria-label={t.tableLabel}
          sortDescriptor={sort}
          onSortChange={setSort}
        >
          <TableHeader>
            <Column id="title" isRowHeader allowsSorting>
              {t.title}
            </Column>
            <Column id="hazard" allowsSorting>
              {t.hazard}
            </Column>
            <Column id="status" allowsSorting>
              {t.status}
            </Column>
            <Column id="actions">{t.actions}</Column>
          </TableHeader>
          <TableBody
            items={visibleRecords}
            dependencies={[hazardNames, locale]}
            renderEmptyState={() => (
              <div className="consumer-crud__empty">{t.empty}</div>
            )}
          >
            {record => (
              <Row id={record.id}>
                <Cell>{titleFor(record, locale)}</Cell>
                <Cell>{hazardNames[record.hazardId] || record.hazardId}</Cell>
                <Cell>
                  <span
                    className={`mg-status-label mg-status-label--${record.status}`}
                  >
                    <span className="mg-status-label__indicator" />
                    {t[record.status]}
                  </span>
                </Cell>
                <Cell>
                  <div className="consumer-crud__actions">
                    <button
                      type="button"
                      className="mg-button mg-button-secondary mg-button-outline"
                      aria-label={`${t.edit}: ${titleFor(record, locale)}`}
                      onClick={() => startEdit(record)}
                    >
                      {t.edit}
                    </button>
                    <button
                      type="button"
                      className="mg-button mg-button-secondary mg-button-outline"
                      aria-label={`${t.delete}: ${titleFor(record, locale)}`}
                      onClick={() => {
                        setNotice('');
                        setDraft({
                          id: record.id,
                          title: titleFor(record, locale),
                        });
                        setMode('delete');
                      }}
                    >
                      {t.delete}
                    </button>
                  </div>
                </Cell>
              </Row>
            )}
          </TableBody>
        </Table>
      </div>
      <p className="consumer-crud__notice" role="status">
        {notice && t[notice]}
      </p>
      <Drawer
        isOpen={Boolean(mode)}
        onClose={() => setMode(null)}
        title={
          mode === 'create'
            ? t.createTitle
            : mode === 'edit'
              ? t.editTitle
              : mode === 'delete'
                ? t.deleteTitle
                : ''
        }
        labels={{ closeLabel: t.close }}
      >
        {mode === 'delete' ? (
          <div className="consumer-crud__editor">
            <p>{t.deleteQuestion}</p>
            <strong>{draft?.title}</strong>
            <div className="consumer-crud__actions">
              <button
                type="button"
                className="mg-button mg-button-secondary mg-button-outline"
                onClick={() => setMode(null)}
              >
                {t.cancel}
              </button>
              <button
                type="button"
                className="mg-button mg-button-primary"
                onClick={remove}
              >
                {t.delete}
              </button>
            </div>
          </div>
        ) : mode ? (
          <form className="consumer-crud__editor" onSubmit={save}>
            <TextInput
              id="consumer-record-title"
              label={t.title}
              value={draft?.title || ''}
              onChange={event =>
                setDraft(current => ({ ...current, title: event.target.value }))
              }
              required
            />
            <div ref={setPortalHost}>
              <ComboBox
                key={locale}
                id="consumer-record-hazard"
                label={t.hazard}
                items={items}
                selectedKey={draft?.hazardId || null}
                onSelectionChange={hazardId =>
                  setDraft(current => ({ ...current, hazardId }))
                }
                openButtonLabel={t.suggestions}
                error={draft?.hazardId ? false : undefined}
                errorText={t.hazardError}
                popoverContainer={portalHost}
                required
              />
            </div>
            <Select
              id="consumer-record-status"
              label={t.status}
              value={draft?.status || 'draft'}
              onChange={event =>
                setDraft(current => ({
                  ...current,
                  status: event.target.value,
                }))
              }
              options={[
                { value: 'draft', label: t.draft },
                { value: 'published', label: t.published },
              ]}
            />
            <div className="consumer-crud__actions">
              <button
                type="button"
                className="mg-button mg-button-secondary mg-button-outline"
                onClick={() => setMode(null)}
              >
                {t.cancel}
              </button>
              <button type="submit" className="mg-button mg-button-primary">
                {t.save}
              </button>
            </div>
          </form>
        ) : null}
      </Drawer>
    </section>
  );
}
