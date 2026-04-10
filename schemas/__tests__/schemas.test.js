import { readdirSync } from 'node:fs';
import path from 'node:path';
import { createAjv } from '../ajv-setup.js';
import cardSchema from '../card.schema.js';
import statisticSchema from '../statistic.schema.js';
import quoteSchema from '../quote.schema.js';
import navigationSchema from '../navigation.schema.js';
import shareActionSchema from '../share-action.schema.js';
import gallerySchema from '../gallery.schema.js';
import textCtaSchema from '../text-cta.schema.js';

const ajv = createAjv();

const schemas = [
  { name: 'card', schema: cardSchema },
  { name: 'statistic', schema: statisticSchema },
  { name: 'quote', schema: quoteSchema },
  { name: 'navigation', schema: navigationSchema },
  { name: 'share-action', schema: shareActionSchema },
  { name: 'gallery', schema: gallerySchema },
  { name: 'text-cta', schema: textCtaSchema },
];

// Derive expected names from *.schema.js files on disk so new schemas can't
// be added without a corresponding test entry.
// __dirname is the schemas/__tests__/ directory; go up one level to schemas/.
const schemaSourceNames = readdirSync(path.join(__dirname, '..'))
  .filter((f) => f.endsWith('.schema.js'))
  .map((f) => f.replace('.schema.js', ''))
  .sort();

describe('Schema coverage', () => {
  it('every *.schema.js source file has an entry in the schemas array', () => {
    const testedNames = schemas.map((s) => s.name).sort();
    expect(testedNames).toEqual(schemaSourceNames);
  });
});

describe('All schemas', () => {
  it.each(schemas)('$name is a valid JSON Schema 2020-12 document', ({ schema }) => {
    expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
    expect(schema.$id).toBeTruthy();
    expect(schema.title).toBeTruthy();
    expect(schema['x-mangrove']).toBeDefined();
    expect(schema['x-mangrove'].implementors).toBeInstanceOf(Array);
    expect(schema['x-mangrove'].implementors.length).toBeGreaterThan(0);
  });

  it.each(schemas)('$name compiles without errors', ({ schema }) => {
    expect(() => ajv.compile(schema)).not.toThrow();
  });
});

describe('Card schema', () => {
  const validate = ajv.compile(cardSchema);

  it('accepts minimal valid card (title only)', () => {
    expect(validate({ items: [{ title: 'Test card' }] })).toBe(true);
  });

  it('accepts full card with all fields', () => {
    const data = {
      items: [
        {
          id: '1',
          image: { src: 'https://example.com/img.jpg', alt: 'Photo' },
          icon: 'mg-icon mg-icon-globe',
          labels: ['News', 'Climate'],
          title: 'Climate action update',
          summary: '<p>Latest developments in DRR.</p>',
          link: 'https://example.com/article',
          button: 'Read more',
          buttonType: 'Primary',
        },
      ],
      variant: 'primary',
    };
    expect(validate(data)).toBe(true);
  });

  it('rejects card without items', () => {
    expect(validate({ variant: 'primary' })).toBe(false);
  });

  it('rejects card with empty items array', () => {
    expect(validate({ items: [] })).toBe(false);
  });

  it('rejects card item without title', () => {
    expect(validate({ items: [{ link: 'https://example.com' }] })).toBe(false);
  });
});

describe('Statistic schema', () => {
  const validate = ajv.compile(statisticSchema);

  it('accepts minimal stat (value only)', () => {
    expect(validate({ stats: [{ value: '42%' }] })).toBe(true);
  });

  it('accepts stat with all fields', () => {
    const data = {
      title: 'Key figures',
      stats: [
        {
          icon: 'mg-icon mg-icon-lightbulb',
          label: 'Target A',
          value: 1500,
          bottomLabel: 'Cities enrolled',
          summary: 'Global participation rate.',
          link: 'https://example.com/stats',
        },
      ],
      variant: 'highlighted',
    };
    expect(validate(data)).toBe(true);
  });

  it('rejects stat without value', () => {
    expect(validate({ stats: [{ label: 'Missing value' }] })).toBe(false);
  });
});

describe('Quote schema', () => {
  const validate = ajv.compile(quoteSchema);

  it('accepts minimal quote', () => {
    expect(validate({ quote: 'Build back better.' })).toBe(true);
  });

  it('accepts quote with all fields', () => {
    const data = {
      quote: '<em>Build back better.</em>',
      attribution: 'Ban Ki-moon',
      attributionTitle: 'Former UN Secretary-General',
      image: { src: 'https://example.com/portrait.jpg', alt: 'Portrait' },
      backgroundColor: 'dark',
      variant: 'image',
      alignment: 'left',
    };
    expect(validate(data)).toBe(true);
  });

  it('rejects quote without quote text', () => {
    expect(validate({ attribution: 'Someone' })).toBe(false);
  });
});

describe('Navigation schema', () => {
  const validate = ajv.compile(navigationSchema);

  it('accepts minimal navigation', () => {
    const data = {
      sections: [{ items: [{ title: 'Home', url: 'https://example.com' }] }],
    };
    expect(validate(data)).toBe(true);
  });

  it('accepts nested 3-level navigation', () => {
    const data = {
      sections: [
        {
          bannerHeading: 'About',
          bannerDescription: '<p>Learn about DRR</p>',
          bannerButton: { label: 'Overview', url: 'https://example.com/about' },
          items: [
            {
              title: 'Our work',
              url: 'https://example.com/work',
              items: [
                {
                  title: 'Programs',
                  items: [{ title: 'MCR2030' }],
                },
              ],
            },
          ],
        },
      ],
    };
    expect(validate(data)).toBe(true);
  });

  it('rejects navigation without sections', () => {
    expect(validate({})).toBe(false);
  });
});

describe('Share action schema', () => {
  const validate = ajv.compile(shareActionSchema);

  it('accepts minimal share config', () => {
    expect(validate({ labels: { mainLabel: 'Share' } })).toBe(true);
  });

  it('rejects missing labels', () => {
    expect(validate({ sharingSubject: 'Subject' })).toBe(false);
  });
});

describe('Gallery schema', () => {
  const validate = ajv.compile(gallerySchema);

  it('accepts minimal gallery with one image', () => {
    expect(validate({ media: [{ id: 'img-1' }] })).toBe(true);
  });

  it('accepts gallery with mixed media types', () => {
    const data = {
      media: [
        { id: 'img-1', type: 'image', src: 'https://example.com/photo.jpg', alt: 'Photo' },
        { id: 'vid-1', type: 'video', src: 'https://example.com/video.mp4', poster: 'https://example.com/poster.jpg' },
        { id: 'embed-1', type: 'embed', embedUrl: 'https://youtube.com/embed/abc' },
      ],
    };
    expect(validate(data)).toBe(true);
  });

  it('rejects gallery without media', () => {
    expect(validate({})).toBe(false);
  });

  it('rejects image-type media item without alt', () => {
    // The if/then conditional requires alt when type is explicitly 'image'.
    expect(validate({ media: [{ id: 'img-1', type: 'image', src: 'https://example.com/photo.jpg' }] })).toBe(false);
  });

  it('accepts image-type media item with alt', () => {
    expect(validate({ media: [{ id: 'img-1', type: 'image', src: 'https://example.com/photo.jpg', alt: 'Photo' }] })).toBe(true);
  });

  it('accepts image-type media item with empty alt (decorative)', () => {
    expect(validate({ media: [{ id: 'img-1', type: 'image', src: 'https://example.com/photo.jpg', alt: '' }] })).toBe(true);
  });
});

describe('Text CTA schema', () => {
  const validate = ajv.compile(textCtaSchema);

  it('accepts empty text-cta (all fields optional)', () => {
    expect(validate({})).toBe(true);
  });

  it('accepts full text-cta', () => {
    const data = {
      headline: 'Take action now',
      headlineLevel: 2,
      text: '<p>Join the global effort.</p>',
      buttons: [
        { label: 'Get involved', url: 'https://example.com/act', type: 'Primary' },
        { label: 'Learn more', url: 'https://example.com/learn', type: 'Secondary' },
      ],
      variant: 'primary',
      image: { src: 'https://example.com/banner.jpg', alt: 'Banner' },
      centered: false,
    };
    expect(validate(data)).toBe(true);
  });

  it('rejects invalid heading level', () => {
    expect(validate({ headlineLevel: 1 })).toBe(false);
    expect(validate({ headlineLevel: 7 })).toBe(false);
  });
});
