export default {
  'components-images-author-image': {
    vanillaHtml: true,
    description: 'Circular author portrait with optional hover color accent (yellow, green, red, blue) and size variant.',
    cssClasses: ['author__img'],
    examples: [
      {
        name: 'Author image',
        html: `<div class="author__img large blue">
  <img src="https://picsum.photos/150/150" alt="Author name" title="Author name" />
</div>`,
      },
    ],
  },

  'components-images-image-with-credit-caption': {
    vanillaHtml: true,
    description: 'Figure element with image, caption, and photo credit.',
    cssClasses: ['image-figcaption', 'image-figcaption__cart', 'scale-up'],
    examples: [
      {
        name: 'Image with caption and credit',
        html: `<figure class="image-figcaption">
  <div class="image-figcaption__cart">
    <img src="https://picsum.photos/800/450" alt="Disaster preparedness training exercise" />
  </div>
  <figcaption>
    Disaster preparedness training in the Philippines.
    <span class="image-credit">Photo: UNDRR / John Smith</span>
  </figcaption>
</figure>`,
      },
    ],
  },
};
