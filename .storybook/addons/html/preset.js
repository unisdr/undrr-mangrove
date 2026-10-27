import { fileURLToPath } from 'node:url';

export const managerEntries = (entries = []) => [
  ...entries,
  fileURLToPath(new URL('./manager.jsx', import.meta.url)),
];
export const previewAnnotations = (entries = []) => [
  ...entries,
  fileURLToPath(new URL('./preview.js', import.meta.url)),
];
