const LOCK = Symbol.for('@undrr/mangrove/dialog-scroll');

export function lockDialogScroll(doc) {
  const root = doc.documentElement;
  const state = (doc[LOCK] ||= {
    count: 0,
    // A shorthand can serialize to an empty string when axes have different
    // priorities. Save the actual declarations, without touching other styles.
    properties: Array.from(root.style)
      .filter(name => ['overflow', 'overflow-x', 'overflow-y'].includes(name))
      .map(name => [
        name,
        root.style.getPropertyValue(name),
        root.style.getPropertyPriority(name),
      ]),
  });
  state.count += 1;
  root.style.setProperty('overflow', 'hidden', 'important');
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--state.count) return;
    for (const name of ['overflow', 'overflow-x', 'overflow-y'])
      root.style.removeProperty(name);
    for (const [name, value, priority] of state.properties)
      root.style.setProperty(name, value, priority);
    delete doc[LOCK];
  };
}
