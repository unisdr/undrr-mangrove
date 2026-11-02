/** Runtime UI labels for MegaMenu; shared by production and Storybook. */
import { createLabelResolver } from '../../../src/i18n';

// ---------------------------------------------------------------------------
// Spanish (es)
// ---------------------------------------------------------------------------
export const LABELS_ES = {
  backLabel: 'Atrás',
  menuLabel: 'Menú',
  allSectionsLabel: 'Todas las secciones',
  closeLabel: 'Cerrar',
  overviewLabel: 'Resumen',
  toggleMobileNavLabel: 'Abrir navegación',

  navLabel: 'Navegación principal',
  closeMobileNavLabel: 'Cerrar navegación móvil',
  filterPlaceholder: 'Filtrar elementos del menú...',
  clearFilterLabel: 'Borrar filtro',
  noFilterResultsLabel: 'No se encontraron elementos del menú',
  searchSiteLabel: 'Buscar en todo el sitio "{query}"',
  filterMatchesCount: '{count} elementos encontrados',
};

// ---------------------------------------------------------------------------
// French (fr)
// ---------------------------------------------------------------------------
export const LABELS_FR = {
  backLabel: 'Retour',
  menuLabel: 'Menu',
  allSectionsLabel: 'Toutes les rubriques',
  closeLabel: 'Fermer',
  overviewLabel: 'Présentation',
  toggleMobileNavLabel: 'Ouvrir la navigation',

  navLabel: 'Navigation principale',
  closeMobileNavLabel: 'Fermer la navigation mobile',
  filterPlaceholder: 'Filtrer les éléments du menu...',
  clearFilterLabel: 'Effacer le filtre',
  noFilterResultsLabel: 'Aucun élément ne correspond au filtre',
  searchSiteLabel: 'Rechercher sur tout le site "{query}"',
  filterMatchesCount: '{count} éléments trouvés',
};

// ---------------------------------------------------------------------------
// Japanese (ja)
// ---------------------------------------------------------------------------
export const LABELS_JA = {
  backLabel: '戻る',
  menuLabel: 'メニュー',
  allSectionsLabel: 'すべてのセクション',
  closeLabel: '閉じる',
  overviewLabel: '概要',
  toggleMobileNavLabel: 'ナビゲーションを開く',

  navLabel: 'メインナビゲーション',
  closeMobileNavLabel: 'モバイルナビゲーションを閉じる',
  filterPlaceholder: 'メニュー項目を絞り込む...',
  clearFilterLabel: '絞り込みをクリア',
  noFilterResultsLabel: '一致するメニュー項目がありません',
  searchSiteLabel: 'サイト全体で「{query}」を検索',
  filterMatchesCount: '{count} 件の項目が見つかりました',
};

// ---------------------------------------------------------------------------
// Simplified Chinese (zh)
// ---------------------------------------------------------------------------
export const LABELS_ZH = {
  backLabel: '返回',
  menuLabel: '菜单',
  allSectionsLabel: '所有栏目',
  closeLabel: '关闭',
  overviewLabel: '概览',
  toggleMobileNavLabel: '打开导航',

  navLabel: '主导航',
  closeMobileNavLabel: '关闭移动导航',
  filterPlaceholder: '筛选菜单项...',
  clearFilterLabel: '清除筛选',
  noFilterResultsLabel: '未找到匹配的菜单项',
  searchSiteLabel: '在全站搜索 "{query}"',
  filterMatchesCount: '找到 {count} 个菜单项',
};

// ---------------------------------------------------------------------------
// Arabic (ar) — Modern Standard Arabic
// ---------------------------------------------------------------------------
export const LABELS_AR = {
  backLabel: 'رجوع',
  menuLabel: 'القائمة',
  allSectionsLabel: 'جميع الأقسام',
  closeLabel: 'إغلاق',
  overviewLabel: 'نظرة عامة',
  toggleMobileNavLabel: 'فتح قائمة التنقل',

  navLabel: 'التنقل الرئيسي',
  closeMobileNavLabel: 'إغلاق قائمة التنقل للجوال',
  filterPlaceholder: 'تصفية عناصر القائمة...',
  clearFilterLabel: 'مسح التصفية',
  noFilterResultsLabel: 'لم يتم العثور على عناصر تطابق التصفية',
  searchSiteLabel: 'البحث في كامل الموقع عن "{query}"',
  filterMatchesCount: 'تم العثور على {count} عنصر',
};

// ---------------------------------------------------------------------------
// Russian (ru)
// ---------------------------------------------------------------------------
export const LABELS_RU = {
  backLabel: 'Назад',
  menuLabel: 'Меню',
  allSectionsLabel: 'Все разделы',
  closeLabel: 'Закрыть',
  overviewLabel: 'Обзор',
  toggleMobileNavLabel: 'Открыть навигацию',

  navLabel: 'Основная навигация',
  closeMobileNavLabel: 'Закрыть мобильную навигацию',
  filterPlaceholder: 'Фильтровать меню...',
  clearFilterLabel: 'Очистить фильтр',
  noFilterResultsLabel: 'Элементы меню не найдены',
  searchSiteLabel: 'Искать по всему сайту «{query}»',
  filterMatchesCount: 'Найдено элементов: {count}',
};

export const DEFAULT_MEGAMENU_LABELS = {
  navLabel: 'Main Navigation',
  closeMobileNavLabel: 'Close mobile navigation',
  menuLabel: 'Menu',
  backLabel: 'Back',
  allSectionsLabel: 'All sections',
  closeLabel: 'Close',
  overviewLabel: 'Overview',
  toggleMobileNavLabel: 'Open navigation menu',
  filterPlaceholder: 'Filter menu items...',
  clearFilterLabel: 'Clear filter',
  noFilterResultsLabel: 'No menu items match your filter',
  searchSiteLabel: 'Search entire site for "{query}"',
  filterMatchesCount: '{count} menu items found',
};

export const getMegaMenuLabels = createLabelResolver(DEFAULT_MEGAMENU_LABELS, {
  ar: LABELS_AR,
  es: LABELS_ES,
  fr: LABELS_FR,
  ja: LABELS_JA,
  ru: LABELS_RU,
  zh: LABELS_ZH,
});
