export function searchRequestKey(endpoint, body) {
  return JSON.stringify({ endpoint, body }, (key, value) =>
    key === 'now' ? undefined : value
  );
}
