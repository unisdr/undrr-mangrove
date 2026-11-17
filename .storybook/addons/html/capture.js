/** Serialize the live canvas without changing its nodes or generated IDs. */
export const readHtml = (canvas, { root, removeComments = true } = {}) => {
  const source = root
    ? canvas.matches(root)
      ? canvas
      : canvas.querySelector(root)
    : canvas;
  if (!source) throw new Error(`HTML root not found: ${root}`);
  const clone = source.cloneNode(true);
  if (removeComments) {
    const walker = document.createTreeWalker(clone, NodeFilter.SHOW_COMMENT);
    const comments = [];
    while (walker.nextNode()) comments.push(walker.currentNode);
    comments.forEach(comment => comment.remove());
  }
  return clone.innerHTML;
};

/** Observe only while requested; invalidate in-flight formatting on every edit. */
export const observeHtml = (
  canvas,
  options,
  publish,
  load = () => import('../../formatHtml.js')
) => {
  let disposed = false;
  let revision = 0;
  let timer;
  const schedule = () => {
    revision += 1;
    publish({ status: 'loading', code: '' });
    if (timer !== undefined) return;
    timer = setTimeout(async () => {
      timer = undefined;
      const current = revision;
      let code;
      let result;
      try {
        code = readHtml(canvas, options);
        try {
          const { formatHtml } = await load();
          result = { status: 'ready', code: await formatHtml(code) };
        } catch {
          result = {
            status: 'ready',
            code,
            warning: 'Formatting unavailable. Showing unformatted live HTML.',
          };
        }
      } catch (error) {
        result = { status: 'error', code: '', warning: error.message };
      }
      if (!disposed && current === revision) publish(result);
    }, 80);
  };
  const observer = new MutationObserver(schedule);
  observer.observe(canvas, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
  });
  schedule();
  return () => {
    disposed = true;
    clearTimeout(timer);
    observer.disconnect();
  };
};
