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
  menuFilterLabel: 'Buscar en el menú',
  filterPlaceholder: 'Buscar una página en este menú',
  clearFilterLabel: 'Borrar filtro',
  noFilterResultsLabel: 'No hay páginas coincidentes en este menú',
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
  menuFilterLabel: 'Rechercher dans le menu',
  filterPlaceholder: 'Trouver une page dans ce menu',
  clearFilterLabel: 'Effacer le filtre',
  noFilterResultsLabel: 'Aucune page correspondante dans ce menu',
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
  menuFilterLabel: 'メニュー内を探す',
  filterPlaceholder: 'このメニューからページを探す',
  clearFilterLabel: '絞り込みをクリア',
  noFilterResultsLabel: 'このメニューに一致するページはありません',
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
  menuFilterLabel: '在菜单中查找',
  filterPlaceholder: '在此菜单中查找页面',
  clearFilterLabel: '清除筛选',
  noFilterResultsLabel: '此菜单中没有匹配的页面',
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
  menuFilterLabel: 'البحث في القائمة',
  filterPlaceholder: 'العثور على صفحة في هذه القائمة',
  clearFilterLabel: 'مسح التصفية',
  noFilterResultsLabel: 'لا توجد صفحات مطابقة في هذه القائمة',
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
  menuFilterLabel: 'Поиск в меню',
  filterPlaceholder: 'Найти страницу в этом меню',
  clearFilterLabel: 'Очистить фильтр',
  noFilterResultsLabel: 'В этом меню нет подходящих страниц',
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
  menuFilterLabel: 'Find in menu',
  filterPlaceholder: 'Find a page in this menu',
  clearFilterLabel: 'Clear filter',
  noFilterResultsLabel: 'No matching pages in this menu',
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
