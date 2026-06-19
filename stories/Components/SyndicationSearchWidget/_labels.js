/**
 * @file _labels.js
 * @description Translated label sets for SyndicationSearchWidget.
 *
 * Imported by Translations.stories.jsx (per-language stories) and
 * _storyHelpers.jsx (locale toolbar decorator). Never import from .stories files.
 */

export const LABELS_ES = {
  searchFormLabel: 'Buscar contenido',
  searchLabel: 'Buscar',
  searchPlaceholder: 'Buscar…',
  searchHint: 'Introduzca los términos de búsqueda',
  searchHintMin: 'Introduzca al menos {min} caracteres para buscar',
  clearSearch: 'Borrar búsqueda',
  submitSearch: 'Iniciar búsqueda',
  submitSearchText: 'Buscar',
  initializing: 'Cargando búsqueda…',
  srSearching: 'Buscando…',
  searchError: 'Error de búsqueda:',
  searchErrorRetry: 'Vuelva a intentarlo o refine sus términos de búsqueda.',
  enterSearchTerm:
    'Introduzca un término de búsqueda para encontrar contenido.',
  minimumCharacters: 'Se requieren al menos {min} caracteres.',
  noResults: 'No se encontraron resultados para "{query}".',
  noResultsHint: 'Pruebe términos diferentes o ajuste sus filtros.',
  showingResults: 'Mostrando {start}–{end} de {total} resultados',
  showingResultsApprox: 'Mostrando {start}–{end} de más de {total} resultados',
  forQuery: 'para "{query}"',
  srNoResults: 'No se encontraron resultados',
  srNoResultsForQuery: 'No se encontraron resultados para {query}',
  srResultsFound: 'Se encontró {count} resultado',
  srResultsFoundPlural: 'Se encontraron {count} resultados',
  srResultsFoundForQuery: 'Se encontró {count} resultado para "{query}"',
  srResultsFoundPluralForQuery:
    'Se encontraron {count} resultados para "{query}"',
  srResultsFoundApprox: 'Más de {count} resultados encontrados',
  srResultsFoundApproxForQuery:
    'Más de {count} resultados encontrados para "{query}"',
  filtersButton: 'Filtros',
  filtersButtonActive: 'Filtros activos: {count}',
  searchResultsLabel: 'Resultados de búsqueda',
  searchResultsPaginationLabel: 'Paginación de resultados de búsqueda',
  filteredBy: 'Filtrado por:',
  activeFiltersRegion: 'Filtros activos',
  andConnector: 'y',
  removeFilter: 'Eliminar filtro: {field} es {value}',
  clearAllFilters: 'Borrar todos los filtros',
  clearAllFiltersLabel: 'Borrar todos los {count} filtros activos',
  activeFiltersCount: '{count} filtro activo',
  activeFiltersCountPlural: '{count} filtros activos',
  drawerTitle: 'Filtros',
  closeFilters: 'Cerrar filtros',
  viewResults: 'Ver resultados',
  filtersApplied: '({count} filtro aplicado)',
  filtersAppliedPlural: '({count} filtros aplicados)',
  selectPlaceholder: 'Seleccionar {label}',
  matchModeLabel: 'Modo de coincidencia para {label}',
  matchModeGroupLabel: 'Coincidencia:',
  matchModeAny: 'Cualquiera de estos',
  matchModeAll: 'Todos estos',
  dropdownSearchPlaceholder: 'Buscar…',
  dropdownNoOptions: 'No se encontraron opciones',
  sortLegend: 'Ordenar',
  sortPlaceholder: 'Ordenar por',
  sortRelevance: 'Relevancia',
  sortNewest: 'Más reciente',
  sortOldest: 'Más antiguo',
  loadingFilters: 'Cargando filtros…',
  pagerPrevious: 'Anterior',
  pagerNext: 'Siguiente',
  pagerGoToPrevious: 'Ir a la página anterior',
  pagerGoToNext: 'Ir a la página siguiente',
  pagerPage: 'Página {page}',
  pagerCurrentPage: 'Página {page}, página actual',
  pagerPageOf: 'Página {page} de {total}',
  domainAccessError: 'Este contenido no está disponible en este momento.',
  reportErrorLink: 'Notificar este error',
};

// ---------------------------------------------------------------------------
// French (fr) — standard international French, UN register
// ---------------------------------------------------------------------------
export const LABELS_FR = {
  searchFormLabel: 'Rechercher du contenu',
  searchLabel: 'Rechercher',
  searchPlaceholder: 'Rechercher…',
  searchHint: 'Saisissez des termes de recherche',
  searchHintMin: 'Saisissez au moins {min} caractères pour lancer la recherche',
  clearSearch: 'Effacer la recherche',
  submitSearch: 'Lancer la recherche',
  submitSearchText: 'Rechercher',
  initializing: 'Chargement de la recherche…',
  srSearching: 'Recherche en cours…',
  searchError: 'Erreur de recherche :',
  searchErrorRetry: 'Veuillez réessayer ou affiner vos termes de recherche.',
  enterSearchTerm: 'Saisissez un terme de recherche pour trouver du contenu.',
  minimumCharacters: 'Minimum {min} caractères requis.',
  noResults: 'Aucun résultat trouvé pour « {query} ».',
  noResultsHint: 'Essayez d’autres termes ou ajustez vos filtres.',
  showingResults: 'Affichage de {start}–{end} sur {total} résultats',
  showingResultsApprox:
    'Affichage de {start}–{end} sur plus de {total} résultats',
  forQuery: 'pour « {query} »',
  srNoResults: 'Aucun résultat trouvé',
  srNoResultsForQuery: 'Aucun résultat trouvé pour {query}',
  srResultsFound: '{count} résultat trouvé',
  srResultsFoundPlural: '{count} résultats trouvés',
  srResultsFoundForQuery: '{count} résultat trouvé pour « {query} »',
  srResultsFoundPluralForQuery: '{count} résultats trouvés pour « {query} »',
  srResultsFoundApprox: 'Plus de {count} résultats trouvés',
  srResultsFoundApproxForQuery:
    'Plus de {count} résultats trouvés pour « {query} »',
  filtersButton: 'Filtres',
  filtersButtonActive: ({ count }) =>
    count === 1 ? 'Filtres, 1 actif' : `Filtres, ${count} actifs`,
  searchResultsLabel: 'Résultats de recherche',
  searchResultsPaginationLabel: 'Pagination des résultats de recherche',
  filteredBy: 'Filtré par :',
  activeFiltersRegion: 'Filtres actifs',
  andConnector: 'et',
  removeFilter: 'Supprimer le filtre : {field} est {value}',
  clearAllFilters: 'Effacer tous les filtres',
  clearAllFiltersLabel: 'Effacer les {count} filtres actifs',
  activeFiltersCount: '{count} filtre actif',
  activeFiltersCountPlural: '{count} filtres actifs',
  drawerTitle: 'Filtres',
  closeFilters: 'Fermer les filtres',
  viewResults: 'Voir les résultats',
  filtersApplied: '({count} filtre appliqué)',
  filtersAppliedPlural: '({count} filtres appliqués)',
  selectPlaceholder: 'Sélectionner {label}',
  matchModeLabel: 'Mode de correspondance pour {label}',
  matchModeGroupLabel: 'Correspondance :',
  matchModeAny: 'L’un de ces éléments',
  matchModeAll: 'Tous ces éléments',
  dropdownSearchPlaceholder: 'Rechercher…',
  dropdownNoOptions: 'Aucune option trouvée',
  sortLegend: 'Trier',
  sortPlaceholder: 'Trier par',
  sortRelevance: 'Pertinence',
  sortNewest: 'Le plus récent',
  sortOldest: 'Le plus ancien',
  loadingFilters: 'Chargement des filtres…',
  pagerPrevious: 'Précédent',
  pagerNext: 'Suivant',
  pagerGoToPrevious: 'Aller à la page précédente',
  pagerGoToNext: 'Aller à la page suivante',
  pagerPage: 'Page {page}',
  pagerCurrentPage: 'Page {page}, page actuelle',
  pagerPageOf: 'Page {page} sur {total}',
  domainAccessError: 'Ce contenu est actuellement indisponible.',
  reportErrorLink: 'Signaler cette erreur',
};

// ---------------------------------------------------------------------------
// Japanese (ja) — polite register (丁寧語); no singular/plural distinction
// ---------------------------------------------------------------------------
export const LABELS_JA = {
  searchFormLabel: 'コンテンツを検索',
  searchLabel: '検索',
  searchPlaceholder: '検索…',
  searchHint: '検索キーワードを入力してください',
  searchHintMin: '検索するには{min}文字以上入力してください',
  clearSearch: '検索をクリア',
  submitSearch: '検索を実行',
  submitSearchText: '検索',
  initializing: '検索を読み込んでいます…',
  srSearching: '検索中…',
  searchError: '検索エラー：',
  searchErrorRetry:
    'もう一度お試しいただくか、検索キーワードを変更してください。',
  enterSearchTerm: 'コンテンツを検索するにはキーワードを入力してください。',
  minimumCharacters: '{min}文字以上必要です。',
  noResults: '「{query}」に一致する結果が見つかりませんでした。',
  noResultsHint: '別のキーワードを試すか、フィルターを調整してください。',
  showingResults: '{total}件中{start}〜{end}件を表示',
  showingResultsApprox: '{total}件以上の結果のうち{start}〜{end}件を表示',
  forQuery: '「{query}」の',
  srNoResults: '結果が見つかりませんでした',
  srNoResultsForQuery: '「{query}」に一致する結果が見つかりませんでした',
  srResultsFound: '{count}件の結果が見つかりました',
  srResultsFoundPlural: '{count}件の結果が見つかりました',
  srResultsFoundForQuery: '「{query}」の検索結果が{count}件見つかりました',
  srResultsFoundPluralForQuery:
    '「{query}」の検索結果が{count}件見つかりました',
  srResultsFoundApprox: '{count}件以上の検索結果が見つかりました',
  srResultsFoundApproxForQuery:
    '「{query}」の検索結果が{count}件以上見つかりました',
  filtersButton: 'フィルター',
  filtersButtonActive: 'フィルター（{count}件有効）',
  searchResultsLabel: '検索結果',
  searchResultsPaginationLabel: '検索結果のページ送り',
  filteredBy: '絞り込み条件：',
  activeFiltersRegion: '有効なフィルター',
  andConnector: 'かつ',
  removeFilter: 'フィルターを削除：{field}が「{value}」',
  clearAllFilters: 'すべてのフィルターをクリア',
  clearAllFiltersLabel: '{count}件の有効なフィルターをすべてクリア',
  activeFiltersCount: '{count}件のフィルターが有効',
  activeFiltersCountPlural: '{count}件のフィルターが有効',
  drawerTitle: 'フィルター',
  closeFilters: 'フィルターを閉じる',
  viewResults: '結果を表示',
  filtersApplied: '（{count}件のフィルターを適用中）',
  filtersAppliedPlural: '（{count}件のフィルターを適用中）',
  selectPlaceholder: '{label}を選択',
  matchModeLabel: '{label}の一致モード',
  matchModeGroupLabel: '一致：',
  matchModeAny: 'いずれか',
  matchModeAll: 'すべて',
  dropdownSearchPlaceholder: '検索…',
  dropdownNoOptions: '該当する選択肢がありません',
  sortLegend: '並び替え',
  sortPlaceholder: '並び替え',
  sortRelevance: '関連度',
  sortNewest: '新しい順',
  sortOldest: '古い順',
  loadingFilters: 'フィルターを読み込んでいます…',
  pagerPrevious: '前へ',
  pagerNext: '次へ',
  pagerGoToPrevious: '前のページへ移動',
  pagerGoToNext: '次のページへ移動',
  pagerPage: '{page}ページ',
  pagerCurrentPage: '{page}ページ（現在のページ）',
  pagerPageOf: '{total}ページ中{page}ページ',
  domainAccessError: 'このコンテンツは現在ご利用いただけません。',
  reportErrorLink: 'このエラーを報告する',
};

// ---------------------------------------------------------------------------
// Simplified Chinese (zh-Hans) — no singular/plural distinction
// ---------------------------------------------------------------------------
export const LABELS_ZH = {
  searchFormLabel: '搜索内容',
  searchLabel: '搜索',
  searchPlaceholder: '搜索…',
  searchHint: '请输入搜索词',
  searchHintMin: '请至少输入 {min} 个字符进行搜索',
  clearSearch: '清除搜索',
  submitSearch: '提交搜索',
  submitSearchText: '搜索',
  initializing: '正在加载搜索…',
  srSearching: '正在搜索…',
  searchError: '搜索错误：',
  searchErrorRetry: '请重试或修改您的搜索词。',
  enterSearchTerm: '请输入搜索词以查找内容。',
  minimumCharacters: '至少需要 {min} 个字符。',
  noResults: '未找到「{query}」的相关结果。',
  noResultsHint: '请尝试其他搜索词或调整筛选条件。',
  showingResults: '显示第 {start}–{end} 条，共 {total} 条结果',
  showingResultsApprox: '显示第 {start}–{end} 条，共超过 {total} 条结果',
  forQuery: '关于「{query}」',
  srNoResults: '未找到结果',
  srNoResultsForQuery: '未找到「{query}」的相关结果',
  srResultsFound: '找到 {count} 条结果',
  srResultsFoundPlural: '找到 {count} 条结果',
  srResultsFoundForQuery: '找到 {count} 条关于「{query}」的结果',
  srResultsFoundPluralForQuery: '找到 {count} 条关于「{query}」的结果',
  srResultsFoundApprox: '找到超过 {count} 条结果',
  srResultsFoundApproxForQuery: '找到超过 {count} 条关于"{query}"的结果',
  filtersButton: '筛选',
  filtersButtonActive: '筛选，{count} 个已启用',
  searchResultsLabel: '搜索结果',
  searchResultsPaginationLabel: '搜索结果分页',
  filteredBy: '筛选条件：',
  activeFiltersRegion: '当前筛选条件',
  andConnector: '和',
  removeFilter: '移除筛选：{field} 为 {value}',
  clearAllFilters: '清除所有筛选',
  clearAllFiltersLabel: '清除全部 {count} 个已启用筛选',
  activeFiltersCount: '{count} 个已启用筛选',
  activeFiltersCountPlural: '{count} 个已启用筛选',
  drawerTitle: '筛选',
  closeFilters: '关闭筛选',
  viewResults: '查看结果',
  filtersApplied: '（已应用 {count} 个筛选）',
  filtersAppliedPlural: '（已应用 {count} 个筛选）',
  selectPlaceholder: '选择{label}',
  matchModeLabel: '{label}的匹配模式',
  matchModeGroupLabel: '匹配方式：',
  matchModeAny: '以下任意一项',
  matchModeAll: '以下全部项目',
  dropdownSearchPlaceholder: '搜索…',
  dropdownNoOptions: '未找到选项',
  sortLegend: '排序',
  sortPlaceholder: '排序方式',
  sortRelevance: '相关性',
  sortNewest: '最新',
  sortOldest: '最早',
  loadingFilters: '正在加载筛选条件…',
  pagerPrevious: '上一页',
  pagerNext: '下一页',
  pagerGoToPrevious: '转到上一页',
  pagerGoToNext: '转到下一页',
  pagerPage: '第 {page} 页',
  pagerCurrentPage: '第 {page} 页（当前页）',
  pagerPageOf: '第 {page} 页，共 {total} 页',
  domainAccessError: '此内容暂时无法访问。',
  reportErrorLink: '报告此错误',
};

// ---------------------------------------------------------------------------
// Arabic (ar) — Modern Standard Arabic (MSA), UN register; RTL script
// Arabic has 6 CLDR plural forms selected by Intl.PluralRules('ar'):
//   zero  → 0
//   one   → 1
//   two   → 2
//   few   → 3–10
//   many  → 11–99
//   other → 100+
// Count-based keys use functions to cover all forms correctly.
// ---------------------------------------------------------------------------

const arPlural = new Intl.PluralRules('ar');

const AR_RESULT_FORMS = {
  zero: 'نتائج',
  one: 'نتيجة',
  two: 'نتيجتان',
  few: 'نتائج',
  many: 'نتائج',
  other: 'نتيجة',
};

const AR_FILTER_FORMS = {
  zero: 'عوامل تصفية',
  one: 'عامل تصفية',
  two: 'عاملا تصفية',
  few: 'عوامل تصفية',
  many: 'عامل تصفية',
  other: 'عامل تصفية',
};

export const LABELS_AR = {
  searchFormLabel: 'البحث في المحتوى',
  searchLabel: 'بحث',
  searchPlaceholder: 'بحث…',
  searchHint: 'أدخل مصطلحات البحث',
  searchHintMin: 'أدخل ما لا يقل عن {min} أحرف للبحث',
  clearSearch: 'مسح البحث',
  submitSearch: 'إرسال البحث',
  submitSearchText: 'بحث',
  initializing: 'جارٍ تحميل البحث…',
  srSearching: 'جارٍ البحث…',
  searchError: 'خطأ في البحث:',
  searchErrorRetry: 'يُرجى المحاولة مرة أخرى أو تعديل مصطلحات البحث.',
  enterSearchTerm: 'أدخل مصطلح بحث للعثور على المحتوى.',
  minimumCharacters: 'الحد الأدنى المطلوب {min} أحرف.',
  noResults: 'لم يتم العثور على نتائج لـ "{query}".',
  noResultsHint: 'جرّب مصطلحات بحث مختلفة أو عدّل عوامل التصفية.',
  showingResults: 'عرض {start}–{end} من أصل {total} نتيجة',
  showingResultsApprox: 'عرض {start}–{end} من أكثر من {total} نتيجة',
  forQuery: 'لـ "{query}"',
  srNoResults: 'لم يتم العثور على نتائج',
  srNoResultsForQuery: 'لم يتم العثور على نتائج لـ {query}',
  srResultsFound: ({ count }) =>
    `تم العثور على ${count} ${AR_RESULT_FORMS[arPlural.select(count)] ?? AR_RESULT_FORMS.other}`,
  srResultsFoundPlural: ({ count }) =>
    `تم العثور على ${count} ${AR_RESULT_FORMS[arPlural.select(count)] ?? AR_RESULT_FORMS.other}`,
  srResultsFoundForQuery: ({ count, query }) =>
    `تم العثور على ${count} ${AR_RESULT_FORMS[arPlural.select(count)] ?? AR_RESULT_FORMS.other} لـ "${query}"`,
  srResultsFoundPluralForQuery: ({ count, query }) =>
    `تم العثور على ${count} ${AR_RESULT_FORMS[arPlural.select(count)] ?? AR_RESULT_FORMS.other} لـ "${query}"`,
  srResultsFoundApprox: ({ count }) =>
    `أكثر من ${count} ${AR_RESULT_FORMS[arPlural.select(count)] ?? AR_RESULT_FORMS.other}`,
  srResultsFoundApproxForQuery: ({ count, query }) =>
    `أكثر من ${count} ${AR_RESULT_FORMS[arPlural.select(count)] ?? AR_RESULT_FORMS.other} لـ "${query}"`,
  filtersButton: 'عوامل التصفية',
  filtersButtonActive: ({ count }) => {
    const form = arPlural.select(count);
    const adj = form === 'zero' || form === 'few' ? 'نشطة' : 'نشط';
    return `عوامل التصفية، ${count} ${AR_FILTER_FORMS[form] ?? AR_FILTER_FORMS.other} ${adj}`;
  },
  searchResultsLabel: 'نتائج البحث',
  searchResultsPaginationLabel: 'ترقيم صفحات نتائج البحث',
  filteredBy: 'مُصفَّى حسب:',
  activeFiltersRegion: 'عوامل التصفية النشطة',
  andConnector: 'و',
  removeFilter: 'إزالة عامل التصفية: {field} هو {value}',
  clearAllFilters: 'مسح جميع عوامل التصفية',
  clearAllFiltersLabel: ({ count }) =>
    `مسح جميع عوامل التصفية النشطة (${count})`,
  activeFiltersCount: ({ count }) => {
    const form = arPlural.select(count);
    const adj = form === 'two' ? 'نشطان' : 'نشط';
    return `${count} ${AR_FILTER_FORMS[form] ?? AR_FILTER_FORMS.other} ${adj}`;
  },
  activeFiltersCountPlural: ({ count }) => {
    const form = arPlural.select(count);
    const adj = form === 'zero' || form === 'few' ? 'نشطة' : 'نشط';
    return `${count} ${AR_FILTER_FORMS[form] ?? AR_FILTER_FORMS.other} ${adj}`;
  },
  drawerTitle: 'عوامل التصفية',
  closeFilters: 'إغلاق عوامل التصفية',
  viewResults: 'عرض النتائج',
  filtersApplied: ({ count }) =>
    `(تم تطبيق ${count} ${AR_FILTER_FORMS[arPlural.select(count)] ?? AR_FILTER_FORMS.other})`,
  filtersAppliedPlural: ({ count }) =>
    `(تم تطبيق ${count} ${AR_FILTER_FORMS[arPlural.select(count)] ?? AR_FILTER_FORMS.other})`,
  selectPlaceholder: 'اختر {label}',
  matchModeLabel: 'وضع المطابقة لـ {label}',
  matchModeGroupLabel: 'مطابقة:',
  matchModeAny: 'أي من هذه',
  matchModeAll: 'جميع هذه',
  dropdownSearchPlaceholder: 'بحث…',
  dropdownNoOptions: 'لم يتم العثور على خيارات',
  sortLegend: 'ترتيب',
  sortPlaceholder: 'الترتيب حسب',
  sortRelevance: 'الصلة',
  sortNewest: 'الأحدث',
  sortOldest: 'الأقدم',
  loadingFilters: 'جارٍ تحميل عوامل التصفية…',
  pagerPrevious: 'السابق',
  pagerNext: 'التالي',
  pagerGoToPrevious: 'الانتقال إلى الصفحة السابقة',
  pagerGoToNext: 'الانتقال إلى الصفحة التالية',
  pagerPage: 'صفحة {page}',
  pagerCurrentPage: 'صفحة {page}، الصفحة الحالية',
  pagerPageOf: 'صفحة {page} من {total}',
  domainAccessError: 'هذا المحتوى غير متاح حالياً.',
  reportErrorLink: 'الإبلاغ عن هذا الخطأ',
};

// ---------------------------------------------------------------------------
// Russian (ru)
// Russian has three plural forms selected by Intl.PluralRules('ru'):
//   one  → 1, 21, 31 … (nominative singular)
//   few  → 2–4, 22–24 … (genitive singular)
//   many → 5–20, 25–30 … (genitive plural)
// Count-based keys use functions so all three forms render correctly.
// ---------------------------------------------------------------------------

const ruResults = new Intl.PluralRules('ru');
const ruFilters = new Intl.PluralRules('ru');

const RU_RESULT_FORMS = {
  one: 'результат',
  few: 'результата',
  many: 'результатов',
  other: 'результатов',
};
const RU_FILTER_FORMS = {
  one: 'фильтр',
  few: 'фильтра',
  many: 'фильтров',
  other: 'фильтров',
};
const RU_ACTIVE_FORMS = {
  one: 'активный',
  few: 'активных',
  many: 'активных',
  other: 'активных',
};

export const LABELS_RU = {
  searchFormLabel: 'Поиск по содержимому',
  searchLabel: 'Поиск',
  searchPlaceholder: 'Поиск…',
  searchHint: 'Введите поисковый запрос',
  searchHintMin: 'Введите не менее {min} символов для поиска',
  clearSearch: 'Очистить поиск',
  submitSearch: 'Выполнить поиск',
  submitSearchText: 'Найти',
  initializing: 'Загрузка поиска…',
  srSearching: 'Выполняется поиск…',
  searchError: 'Ошибка поиска:',
  searchErrorRetry: 'Попробуйте ещё раз или уточните поисковый запрос.',
  enterSearchTerm: 'Введите поисковый запрос для поиска материалов.',
  minimumCharacters: 'Требуется не менее {min} символов.',
  noResults: 'По запросу «{query}» ничего не найдено.',
  noResultsHint: 'Попробуйте другие слова или измените фильтры.',
  showingResults: 'Показано {start}–{end} из {total} результатов',
  showingResultsApprox:
    'Показано {start}–{end} из более чем {total} результатов',
  forQuery: 'по запросу «{query}»',
  srNoResults: 'Результаты не найдены',
  srNoResultsForQuery: 'По запросу «{query}» результатов не найдено',
  // srResultsFound is only called when count === 1; hard-coded singular form is correct here
  srResultsFound: ({ count }) => `Найден ${count} результат`,
  srResultsFoundPlural: ({ count }) => {
    const form = ruResults.select(count);
    return `Найдено ${count} ${RU_RESULT_FORMS[form] ?? RU_RESULT_FORMS.other}`;
  },
  srResultsFoundForQuery: ({ count, query }) =>
    `По запросу «${query}» найден ${count} результат`,
  srResultsFoundPluralForQuery: ({ count, query }) => {
    const form = ruResults.select(count);
    return `По запросу «${query}» найдено ${count} ${RU_RESULT_FORMS[form] ?? RU_RESULT_FORMS.other}`;
  },
  srResultsFoundApprox: ({ count }) => {
    const form = ruResults.select(count);
    return `Более ${count} ${RU_RESULT_FORMS[form] ?? RU_RESULT_FORMS.other}`;
  },
  srResultsFoundApproxForQuery: ({ count, query }) => {
    const form = ruResults.select(count);
    return `По запросу «${query}» найдено более ${count} ${RU_RESULT_FORMS[form] ?? RU_RESULT_FORMS.other}`;
  },
  filtersButton: 'Фильтры',
  filtersButtonActive: ({ count }) => {
    const form = ruFilters.select(count);
    return `Фильтры, активно: ${count} ${RU_FILTER_FORMS[form] ?? RU_FILTER_FORMS.other}`;
  },
  searchResultsLabel: 'Результаты поиска',
  searchResultsPaginationLabel: 'Постраничная навигация результатов поиска',
  filteredBy: 'Отфильтровано по:',
  activeFiltersRegion: 'Активные фильтры',
  andConnector: 'и',
  removeFilter: 'Удалить фильтр: {field}, {value}',
  clearAllFilters: 'Сбросить все фильтры',
  clearAllFiltersLabel: ({ count }) =>
    `Сбросить все активные фильтры (${count})`,
  activeFiltersCount: ({ count }) =>
    `${count} ${RU_ACTIVE_FORMS[ruFilters.select(count)] ?? 'активный'} ${RU_FILTER_FORMS[ruFilters.select(count)] ?? 'фильтр'}`,
  activeFiltersCountPlural: ({ count }) => {
    const form = ruFilters.select(count);
    return `${count} ${RU_ACTIVE_FORMS[form] ?? 'активных'} ${RU_FILTER_FORMS[form] ?? 'фильтров'}`;
  },
  drawerTitle: 'Фильтры',
  closeFilters: 'Закрыть фильтры',
  viewResults: 'Показать результаты',
  filtersApplied: ({ count }) => `(применён ${count} фильтр)`,
  filtersAppliedPlural: ({ count }) => {
    const form = ruFilters.select(count);
    return `(применено ${count} ${RU_FILTER_FORMS[form] ?? RU_FILTER_FORMS.other})`;
  },
  selectPlaceholder: 'Выберите {label}',
  matchModeLabel: 'Режим совпадения для {label}',
  matchModeGroupLabel: 'Совпадение:',
  matchModeAny: 'Любое из',
  matchModeAll: 'Все из',
  dropdownSearchPlaceholder: 'Поиск…',
  dropdownNoOptions: 'Варианты не найдены',
  sortLegend: 'Сортировка',
  sortPlaceholder: 'Сортировать по',
  sortRelevance: 'Релевантности',
  sortNewest: 'Сначала новые',
  sortOldest: 'Сначала старые',
  loadingFilters: 'Загрузка фильтров…',
  pagerPrevious: 'Предыдущая',
  pagerNext: 'Следующая',
  pagerGoToPrevious: 'Перейти на предыдущую страницу',
  pagerGoToNext: 'Перейти на следующую страницу',
  pagerPage: 'Страница {page}',
  pagerCurrentPage: 'Страница {page}, текущая страница',
  pagerPageOf: 'Страница {page} из {total}',
  domainAccessError: 'Данный материал временно недоступен.',
  reportErrorLink: 'Сообщить об ошибке',
};
