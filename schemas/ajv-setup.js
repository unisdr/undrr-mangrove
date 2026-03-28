/**
 * Shared AJV configuration for schema validation.
 *
 * Used by both the build script (schemas/build.js) and the test suite
 * (schemas/__tests__/schemas.test.js) to guarantee identical validator
 * behaviour in both contexts.
 *
 * strict: false is required because x-mangrove is an unrecognised keyword.
 * allErrors: true collects every validation failure rather than stopping at
 * the first, which makes error output more useful during development.
 */

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

export function createAjv() {
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  addFormats(ajv);
  // 'html' signals that a string field accepts sanitized HTML.
  // AJV validates it as a plain string; sanitization is the consumer's responsibility.
  ajv.addFormat('html', true);
  return ajv;
}
