// Non-English strings are draft translations and need review by native
// speakers before release. "Degraded" is rendered as "reduced performance"
// in every language so the badge reads the same across locales.
export const DEFAULT_SERVICE_NOTICE_LABELS = {
  retryLabel: 'Retry connection',
  statusUrlLabel: 'View status page',
  opensInNewTab: '(opens in a new tab)',
  statusDegraded: 'Degraded',
  statusOffline: 'Offline',
  countdownPrefix: 'Next automatic retry in',
  countdownAnnouncement: 'Retrying automatically in {seconds} seconds',
  autoRetryStopped:
    'Automatic retries stopped. Use the retry button to try again',
};

export const LABELS_ES = {
  retryLabel: 'Reintentar conexión',
  statusUrlLabel: 'Ver página de estado',
  opensInNewTab: '(se abre en una pestaña nueva)',
  statusDegraded: 'Rendimiento reducido',
  statusOffline: 'Fuera de servicio',
  countdownPrefix: 'Próximo reintento automático en',
  countdownAnnouncement: 'Reintento automático en {seconds} segundos',
  autoRetryStopped:
    'Se detuvieron los reintentos automáticos. Use el botón de reintento para volver a intentarlo',
};

export const LABELS_FR = {
  retryLabel: 'Réessayer la connexion',
  statusUrlLabel: 'Voir la page de statut',
  opensInNewTab: "(s'ouvre dans un nouvel onglet)",
  statusDegraded: 'Performances réduites',
  statusOffline: 'Hors ligne',
  countdownPrefix: 'Prochaine tentative automatique dans',
  countdownAnnouncement:
    'Nouvelle tentative automatique dans {seconds} secondes',
  autoRetryStopped:
    'Tentatives automatiques arrêtées. Utilisez le bouton pour réessayer',
};

export const LABELS_JA = {
  retryLabel: '接続を再試行',
  statusUrlLabel: 'ステータスページを表示',
  opensInNewTab: '（新しいタブで開きます）',
  statusDegraded: 'パフォーマンス低下',
  statusOffline: 'オフライン',
  countdownPrefix: '次の自動再試行まで',
  countdownAnnouncement: '{seconds}秒後に自動的に再試行します',
  autoRetryStopped: '自動再試行を停止しました。再試行ボタンを使用してください',
};

export const LABELS_ZH = {
  retryLabel: '重试连接',
  statusUrlLabel: '查看状态页面',
  opensInNewTab: '（在新标签页中打开）',
  statusDegraded: '性能下降',
  statusOffline: '离线',
  countdownPrefix: '距下次自动重试',
  countdownAnnouncement: '将在 {seconds} 秒后自动重试',
  autoRetryStopped: '已停止自动重试。请使用重试按钮再次尝试',
};

export const LABELS_AR = {
  retryLabel: 'إعادة محاولة الاتصال',
  statusUrlLabel: 'عرض صفحة الحالة',
  opensInNewTab: '(يفتح في علامة تبويب جديدة)',
  statusDegraded: 'أداء منخفض',
  statusOffline: 'غير متصل',
  countdownPrefix: 'المحاولة التلقائية التالية خلال',
  countdownAnnouncement: 'إعادة المحاولة تلقائيًا خلال {seconds} ثانية',
  autoRetryStopped:
    'توقفت المحاولات التلقائية. استخدم زر إعادة المحاولة للمحاولة مرة أخرى',
};

export const LABELS_RU = {
  retryLabel: 'Повторить подключение',
  statusUrlLabel: 'Страница статуса',
  opensInNewTab: '(откроется в новой вкладке)',
  statusDegraded: 'Снижена производительность',
  statusOffline: 'Офлайн',
  countdownPrefix: 'Следующая автоматическая попытка через',
  countdownAnnouncement: 'Автоматическая повторная попытка через {seconds} с',
  autoRetryStopped:
    'Автоматические попытки остановлены. Используйте кнопку повтора',
};
