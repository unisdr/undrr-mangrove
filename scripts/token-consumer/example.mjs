import { deltaStyles } from './delta-consumer.mjs';
try {
  const file = document.body.dataset.document;
  const response = await fetch(file);
  if (!response.ok)
    throw new Error(`Could not load ${file}: ${response.status}`);
  const styles = deltaStyles(await response.json());
  for (const [name, value] of Object.entries(styles))
    document.documentElement.style.setProperty(name, value);
  document.querySelector('#values').textContent = JSON.stringify(
    styles,
    null,
    2
  );
  document.body.dataset.ready = 'true';
  document.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    document.querySelector('[role="status"]').textContent =
      'Draft saved in this example.';
  });
} catch (error) {
  document.querySelector('[role="status"]').textContent = error.message;
  document.body.dataset.error = error.message;
  throw error;
}
