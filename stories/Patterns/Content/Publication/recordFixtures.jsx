import React from 'react';

// Authored demo labels: native-speaker review remains required before adoption.
// allDownloads holds CLDR plural forms. The en, ar, es, fr, ja and zh strings
// copy the Drupal "All downloads (@count)" translations from
// https://gitlab.com/undrr/drupal-base/-/merge_requests/268; Russian is a
// draft. The cue only shows for two or more resources.
export const RECORD_LABELS = {
  english: {
    publication: 'Publication',
    skip: 'Skip to publication',
    authors: 'Authors',
    sources: 'Sources / issuing organizations',
    year: 'Publication year',
    access: 'Read or access this publication',
    backup: 'Local backup',
    description: 'Description',
    details: 'Bibliographic details',
    identifiers: 'Identifiers',
    edition: 'Edition',
    pages: 'Pages',
    citation: 'Citation and record link',
    recordLink: 'Open the approved record',
    related: 'Related resources',
    allDownloads: {
      one: 'All downloads ({count})',
      other: 'All downloads ({count})',
    },
  },
  french: {
    publication: 'Publication',
    skip: 'Aller à la publication',
    authors: 'Auteurs',
    sources: 'Sources / organismes émetteurs',
    year: 'Année de publication',
    access: 'Lire ou consulter cette publication',
    backup: 'Copie locale de secours',
    description: 'Description',
    details: 'Données bibliographiques',
    identifiers: 'Identifiants',
    edition: 'Édition',
    pages: 'Pages',
    citation: 'Citation et lien vers la notice',
    recordLink: 'Ouvrir la notice approuvée',
    related: 'Ressources connexes',
    allDownloads: {
      one: 'Téléchargement ({count})',
      other: 'Tous les téléchargements ({count})',
    },
  },
  arabic: {
    publication: 'منشور',
    skip: 'انتقل إلى المنشور',
    authors: 'المؤلفون',
    sources: 'المصادر / الجهات المصدرة',
    year: 'سنة النشر',
    access: 'قراءة هذا المنشور أو الوصول إليه',
    backup: 'نسخة احتياطية محلية',
    description: 'الوصف',
    details: 'البيانات الببليوغرافية',
    identifiers: 'المعرّفات',
    edition: 'الطبعة',
    pages: 'الصفحات',
    citation: 'الاستشهاد ورابط السجل',
    recordLink: 'فتح السجل المعتمد',
    related: 'موارد ذات صلة',
    allDownloads: {
      zero: 'جميع التنزيلات ({count})',
      one: 'التنزيل ({count})',
      two: 'كلا التنزيلين ({count})',
      few: 'جميع التنزيلات ({count})',
      many: 'جميع التنزيلات ({count})',
      other: 'جميع التنزيلات ({count})',
    },
  },
  spanish: {
    publication: 'Publicación',
    skip: 'Ir a la publicación',
    authors: 'Autores',
    sources: 'Fuentes / organizaciones emisoras',
    year: 'Año de publicación',
    access: 'Leer o consultar esta publicación',
    backup: 'Copia de seguridad local',
    description: 'Descripción',
    details: 'Datos bibliográficos',
    identifiers: 'Identificadores',
    edition: 'Edición',
    pages: 'Páginas',
    citation: 'Cita y enlace al registro',
    recordLink: 'Abrir el registro aprobado',
    related: 'Recursos relacionados',
    allDownloads: {
      one: 'Descarga ({count})',
      other: 'Todas las descargas ({count})',
    },
  },
  russian: {
    publication: 'Публикация',
    skip: 'Перейти к публикации',
    authors: 'Авторы',
    sources: 'Источники / выпускающие организации',
    year: 'Год публикации',
    access: 'Читать или открыть публикацию',
    backup: 'Локальная резервная копия',
    description: 'Описание',
    details: 'Библиографические сведения',
    identifiers: 'Идентификаторы',
    edition: 'Издание',
    pages: 'Страницы',
    citation: 'Цитата и ссылка на запись',
    recordLink: 'Открыть утверждённую запись',
    related: 'Связанные материалы',
    // Draft, not a live site string: needs native-speaker review.
    allDownloads: {
      one: 'Все файлы для скачивания ({count})',
      few: 'Все файлы для скачивания ({count})',
      many: 'Все файлы для скачивания ({count})',
      other: 'Все файлы для скачивания ({count})',
    },
  },
  japanese: {
    publication: '刊行物',
    skip: '刊行物へ移動',
    authors: '著者',
    sources: '情報源・発行機関',
    year: '発行年',
    access: 'この刊行物を読む・アクセスする',
    backup: 'ローカルの予備コピー',
    description: '概要',
    details: '書誌情報',
    identifiers: '識別子',
    edition: '版',
    pages: 'ページ数',
    citation: '引用と書誌レコードへのリンク',
    recordLink: '承認済みレコードを開く',
    related: '関連資料',
    allDownloads: { other: 'すべてのダウンロード ({count})' },
  },
  chinese: {
    publication: '出版物',
    skip: '跳至出版物',
    authors: '作者',
    sources: '来源／发布机构',
    year: '出版年份',
    access: '阅读或访问本出版物',
    backup: '本地备份',
    description: '说明',
    details: '书目信息',
    identifiers: '标识符',
    edition: '版本',
    pages: '页数',
    citation: '引文和记录链接',
    recordLink: '打开经批准的记录',
    related: '相关资源',
    allDownloads: { other: '所有下载文件 ({count})' },
  },
};

// Entirely synthetic editorial fixture. Local readers are checked in, not real report downloads.
export const exampleRecord = {
  title: 'Understanding disaster risk',
  lang: 'en',
  publicationYear: 2026,
  summary:
    'An introduction to understanding disaster risk, interpreting evidence and using risk information in decisions.',
  authors: ['Editorial working group', 'Research working group'],
  sources: [{ label: 'Publication example team' }],
  cover: { src: '/images/teaser-publication-cover.svg', alt: '' },
  edition: 'Demonstration edition',
  identifiers: ['EXAMPLE / 2026 / 01'],
  resources: [
    {
      label: 'Read Understanding disaster risk',
      href: '/publication-record/reading-en.html',
      language: 'English',
      lang: 'en',
      format: 'HTML',
      origin: 'hosted',
    },
    {
      label: 'Lire Comprendre les risques de catastrophe',
      href: '/publication-record/reading-fr.html',
      language: 'Français',
      labelLang: 'fr',
      lang: 'fr',
      format: 'HTML',
      origin: 'hosted',
    },
    {
      label: 'Read the plain-text edition',
      href: '/publication-record/reading-en.txt',
      language: 'English',
      lang: 'en',
      format: 'Plain text',
      origin: 'hosted',
    },
  ],
  related: [
    {
      label: 'Explore UNDRR publications',
      href: 'https://www.undrr.org/publications',
    },
  ],
  citation:
    'Editorial working group; Research working group (2026). Understanding disaster risk. Demonstration edition. Publication example team.',
};

export const exampleBody = (
  <>
    <p>
      Risk information is most useful when readers can understand what it
      describes, how it was produced and where uncertainty remains. This
      introduction considers those questions before exploring how information
      can support decisions.
    </p>
    <h3>Using the information</h3>
    <p>
      Keep evidence, methods and uncertainty together. Consider the needs of the
      people using the information and retain the qualifications that affect
      interpretation.
    </p>
    <ul>
      <li>Identify the subject and intended audience.</li>
      <li>Read the methods alongside the findings.</li>
      <li>Consult the available language and format that suits your needs.</li>
    </ul>
  </>
);
