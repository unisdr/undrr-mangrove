# Highlight Box Component

A flexible container component for highlighting important content, including text, images, and video embeds.

## Features

- **Tone Variants**: Default (light), Primary (blue), Secondary (purple)
- **Layout Variants**: Full width, Centered (80%), Float start/end (30%)
- **Responsive**: Float variants stack on mobile
- **RTL Support**: Uses logical properties (inline-start/end, block)
- **Video Support**: Automatic 16:9 aspect ratio for iframes
- **Nested Content**: Supports any content including paragraphs, headings, images, videos

## Usage

### CSS Classes

```html
<!-- Default -->
<div class="mg-highlight-box">
  <h3>Title</h3>
  <p>Content</p>
</div>

<!-- Primary tone -->
<div class="mg-highlight-box mg-highlight-box--primary">
  <p>Blue background with white text</p>
</div>

<!-- Centered layout -->
<div class="mg-highlight-box mg-highlight-box--centered">
  <p>80% width, horizontally centered</p>
</div>

<!-- Float start (responsive) -->
<div class="mg-highlight-box mg-highlight-box--float-start">
  <p>Floats left on desktop, stacks on mobile</p>
</div>

<!-- Combining variants -->
<div class="mg-highlight-box mg-highlight-box--secondary mg-highlight-box--centered">
  <p>Purple background, centered layout</p>
</div>
```

### Gutenberg Block

The Highlight Box is available as a Gutenberg block under "UNDRR" category:

1. Add "Highlight Box" block to your content
2. Configure tone (Default/Primary/Secondary) in sidebar
3. Configure layout (Full/Centered/Float Start/Float End) in sidebar
4. Add nested content using InnerBlocks

## Variants

### Tone Variants

- **Default**: Light background with dark border and shadow
- **Primary**: Corporate blue background with white text and light shadow
- **Secondary**: Sendai purple background with white text and light shadow

### Layout Variants

- **Full**: 100% width (default)
- **Centered**: 80% width, horizontally centered
- **Float Start**: 30% width, floats to inline-start (left in LTR, right in RTL)
- **Float End**: 30% width, floats to inline-end (right in LTR, left in RTL)

### Responsive Behavior

Float variants automatically stack to full width on screens below the mobile breakpoint for better readability.

## Styling

- **Padding**: 1rem block, 1.5rem inline, 2rem bottom
- **Border**: 1px solid rgba(0, 0, 0, 0.3) for default tone
- **Shadow**: Inset bottom shadow for depth effect
- **Video**: Automatic 16:9 aspect ratio for embedded iframes

## Browser Support

- Modern browsers with CSS logical properties support
- `:has()` selector for video detection (graceful degradation)

## Migration from CKEditor

Existing CKEditor content using `.mg-highlight-box` classes will continue to work. The styles are now part of the Mangrove component library for better maintainability.

## Accessibility

- Uses semantic HTML elements
- Color contrast meets WCAG AA standards for colored variants
- Works without JavaScript (pure CSS component)
- Screen reader friendly with proper heading hierarchy
