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
    accessLink: 'Access {title}',
    watchLink: 'Watch {title}',
    opensInNewTab: 'opens in new tab',
    backupLink: 'Download a backup copy hosted by this site',
    backupHelp: 'What is a backup copy?',
    backupExplanation:
      'We keep a copy of many documents to improve long-term access. Use this if the publisher’s site is slow or unavailable.',
    problems: 'Problems?',
    contactUs: 'Contact us',
    added: 'Added {date}',
  },
  french: {
    publication: 'Publication',
    skip: 'Aller à la publication',
    authors: 'Auteurs',
    sources: 'Sources / organismes émetteurs',
    year: 'Année de publication',
    access: 'Lire ou consulter cette publication',
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
    accessLink: 'Accéder à {title}',
    watchLink: 'Regarder {title}',
    opensInNewTab: "s'ouvre dans un nouvel onglet",
    backupLink: 'Télécharger une copie de sauvegarde hébergée sur ce site',
    backupHelp: "Qu'est-ce qu'une copie de sauvegarde ?",
    backupExplanation:
      "Nous conservons une copie de nombreux documents afin d'en faciliter l'accès à long terme. Utilisez cette option si le site de l'éditeur est lent ou inaccessible.",
    problems: 'Des problèmes ?',
    contactUs: 'Nous contacter',
    added: 'Ajouté le {date}',
  },
  arabic: {
    publication: 'منشور',
    skip: 'انتقل إلى المنشور',
    authors: 'المؤلفون',
    sources: 'المصادر / الجهات المصدرة',
    year: 'سنة النشر',
    access: 'قراءة هذا المنشور أو الوصول إليه',
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
    accessLink: 'الوصول إلى {title}',
    watchLink: 'مشاهدة {title}',
    opensInNewTab: 'يفتح في علامة تبويب جديدة',
    backupLink: 'تنزيل نسخة احتياطية مستضافة على هذا الموقع',
    backupHelp: 'ما هي النسخة الاحتياطية؟',
    backupExplanation:
      'نحتفظ بنسخة من كثير من الوثائق لتحسين إمكانية الوصول على المدى البعيد. استخدم هذا الخيار إذا كان موقع الناشر بطيئاً أو غير متاح.',
    problems: 'هل تواجه مشكلة؟',
    contactUs: 'اتصل بنا',
    added: 'تاريخ الإضافة: {date}',
  },
  spanish: {
    publication: 'Publicación',
    skip: 'Ir a la publicación',
    authors: 'Autores',
    sources: 'Fuentes / organizaciones emisoras',
    year: 'Año de publicación',
    access: 'Leer o consultar esta publicación',
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
    accessLink: 'Acceder a {title}',
    watchLink: 'Ver {title}',
    opensInNewTab: 'se abre en una nueva pestaña',
    backupLink: 'Descargar una copia de respaldo alojada en este sitio',
    backupHelp: '¿Qué es una copia de respaldo?',
    backupExplanation:
      'Conservamos una copia de muchos documentos para facilitar el acceso a largo plazo. Use esta opción si el sitio del editor es lento o no está disponible.',
    problems: '¿Problemas?',
    contactUs: 'Contáctenos',
    added: 'Añadido el {date}',
  },
  russian: {
    publication: 'Публикация',
    skip: 'Перейти к публикации',
    authors: 'Авторы',
    sources: 'Источники / выпускающие организации',
    year: 'Год публикации',
    access: 'Читать или открыть публикацию',
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
    accessLink: 'Открыть: {title}',
    watchLink: 'Смотреть: {title}',
    opensInNewTab: 'откроется в новой вкладке',
    backupLink: 'Скачать резервную копию, размещённую на этом сайте',
    backupHelp: 'Что такое резервная копия?',
    backupExplanation:
      'Мы храним копии многих документов, чтобы обеспечить долгосрочный доступ к ним. Воспользуйтесь этой копией, если сайт издателя работает медленно или недоступен.',
    problems: 'Возникли проблемы?',
    contactUs: 'Свяжитесь с нами',
    added: 'Добавлено {date}',
  },
  japanese: {
    publication: '刊行物',
    skip: '刊行物へ移動',
    authors: '著者',
    sources: '情報源・発行機関',
    year: '発行年',
    access: 'この刊行物を読む・アクセスする',
    description: '概要',
    details: '書誌情報',
    identifiers: '識別子',
    edition: '版',
    pages: 'ページ数',
    citation: '引用と書誌レコードへのリンク',
    recordLink: '承認済みレコードを開く',
    related: '関連資料',
    allDownloads: { other: 'すべてのダウンロード ({count})' },
    accessLink: '{title}にアクセス',
    watchLink: '{title}を視聴する',
    opensInNewTab: '新しいタブで開きます',
    backupLink: 'このサイトが保管するバックアップコピーをダウンロード',
    backupHelp: 'バックアップコピーとは？',
    backupExplanation:
      '長期的なアクセスを確保するため、多くの文書のコピーを保管しています。出版元のサイトが遅い場合や利用できない場合にご利用ください。',
    problems: '問題がありますか？',
    contactUs: 'お問い合わせ',
    added: '{date}に追加',
  },
  chinese: {
    publication: '出版物',
    skip: '跳至出版物',
    authors: '作者',
    sources: '来源／发布机构',
    year: '出版年份',
    access: '阅读或访问本出版物',
    description: '说明',
    details: '书目信息',
    identifiers: '标识符',
    edition: '版本',
    pages: '页数',
    citation: '引文和记录链接',
    recordLink: '打开经批准的记录',
    related: '相关资源',
    allDownloads: { other: '所有下载文件 ({count})' },
    accessLink: '访问{title}',
    watchLink: '观看{title}',
    opensInNewTab: '在新标签页中打开',
    backupLink: '下载本站托管的备份副本',
    backupHelp: '什么是备份副本？',
    backupExplanation:
      '我们保存了许多文件的副本，以便长期获取。如发布网站访问缓慢或无法访问，请使用此副本。',
    problems: '遇到问题？',
    contactUs: '联系我们',
    added: '添加于{date}',
  },
};

// Entirely synthetic editorial fixture. The hosted copies are checked-in demo
// files, not real report downloads; example.org is a reserved documentation
// domain standing in for the publisher's site.
const report = {
  label: 'Understanding disaster risk',
  href: 'https://example.org/understanding-disaster-risk',
  origin: 'publisher',
  language: 'English',
  lang: 'en',
  backup: {
    href: '/publication-record/reading-en-backup.html',
    format: 'HTML',
    size: '360 bytes',
    lang: 'en',
  },
};

// Report plus supporting files, each in the shape Drupal uses.
export const severalFiles = [
  report,
  {
    label: 'Comprendre les risques de catastrophe : résumé',
    href: '/publication-record/reading-fr.html',
    origin: 'hosted',
    language: 'Français',
    labelLang: 'fr',
    lang: 'fr',
    format: 'HTML',
    size: '422 bytes',
  },
  {
    label: 'Understanding disaster risk: plain-text edition',
    href: '/publication-record/reading-en.txt',
    origin: 'hosted',
    language: 'English',
    lang: 'en',
    format: 'Plain text',
    size: '162 bytes',
  },
];

// The standard case: the publisher's original plus a backup hosted here.
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
  resources: [report],
  resourcesAdded: '2026-03-15',
  contactHref: 'https://www.undrr.org/contact-us',
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
