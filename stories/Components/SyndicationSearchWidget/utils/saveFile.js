export function saveFile(document, contents, format) {
  const view = document.defaultView;
  const file = new view.Blob([contents], {
    type:
      format === 'csv'
        ? 'text/csv;charset=utf-8'
        : 'application/json;charset=utf-8',
  });
  const url = view.URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = `search-results-${new Date().toISOString().slice(0, 10)}.${format}`;
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    link.remove();
    view.setTimeout(() => view.URL.revokeObjectURL(url), 1000);
  }
}
