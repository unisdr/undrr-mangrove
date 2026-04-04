/**
 * Schema helper functions for DRY field definitions.
 *
 * Each function returns a plain JSON Schema fragment. Compose them
 * to build full schema documents without repetition.
 */

/** Plain text string field. */
export function textField(description) {
  return { type: 'string', description };
}

/** HTML-safe string field. Consumers must sanitize before rendering. */
export function htmlField(description) {
  return { type: 'string', format: 'html', description };
}

/** URL string field. */
export function urlField(description) {
  return { type: 'string', format: 'uri', description };
}

/** CSS color value (hex, rgb, named, etc.). */
export function cssColorField(description) {
  return { type: 'string', description: `${description} (CSS color value)` };
}

/**
 * Enum string field with optional default.
 * @param {string[]} values - Allowed values
 * @param {string} description
 * @param {string} [defaultValue]
 */
export function enumField(values, description, defaultValue) {
  const schema = { type: 'string', enum: values, description };
  if (defaultValue !== undefined) schema.default = defaultValue;
  return schema;
}

/**
 * Image object with src and alt.
 * @param {object} [opts]
 * @param {string} [opts.description] - Override description
 */
export function imageObject(opts = {}) {
  return {
    type: 'object',
    description: opts.description || 'Image with source URL and alt text',
    properties: {
      src: urlField('Image URL'),
      alt: textField('Alt text for the image. Use empty string ("") for decorative images that convey no information.'),
    },
    required: ['src', 'alt'],
  };
}

/**
 * Link/button action object.
 * @param {object} [opts]
 * @param {boolean} [opts.withType] - Include a type property (Primary/Secondary)
 */
export function linkAction(opts = {}) {
  const properties = {
    label: textField('Display text for the link or button. Must be descriptive in isolation — avoid generic text like "Read more" or "Click here" without context.'),
    url: urlField('Target URL'),
  };

  if (opts.withType) {
    properties.type = enumField(
      ['Primary', 'Secondary'],
      'Visual style of the button',
    );
  }

  return {
    type: 'object',
    properties,
    required: ['label'],
  };
}

/**
 * Wrap an item schema as a JSON Schema array.
 * @param {object} itemSchema - JSON Schema for each element
 * @param {object} [opts]
 * @param {number} [opts.minItems]
 */
export function arrayOf(itemSchema, opts = {}) {
  const schema = { type: 'array', items: itemSchema };
  if (opts.minItems !== undefined) schema.minItems = opts.minItems;
  return schema;
}

/**
 * Wrap a schema body in a full JSON Schema document with standard metadata.
 * @param {object} opts
 * @param {string} opts.id - Schema identifier (e.g. 'card')
 * @param {string} opts.title - Human-readable title
 * @param {string} opts.description - What this content archetype represents
 * @param {object} opts.schema - The properties/required/type definition
 * @param {object} [opts.meta] - Mangrove-specific metadata (implementors, deviations)
 */
export function schemaDocument({ id, title, description, schema, meta = {} }) {
  // Document-level fields ($schema, $id, title, description) are placed after
  // ...schema so they always win over any accidental top-level keys in schema.
  return {
    ...schema,
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: `https://github.com/unisdr/undrr-mangrove/schemas/${id}`,
    title,
    description,
    'x-mangrove': {
      version: '1.0.0',
      phase: 1,
      ...meta,
    },
  };
}
