# Accessibility

> Edits to this file show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/ACCESSIBILITY.md) and in [Storybook](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-accessibility--docs).

Accessible design not only helps users with disabilities; it also provides a better user experience for everyone. All components follow the [WCAG 2.2](https://www.w3.org/TR/WCAG22/) AA standard.

All patterns are perceivable, operable, and understandable to users, even when using a screen reader or other assistive technology. However, how you use these elements also affects the accessibility of a product.

For the full specification, see the [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/).

### 1. Semantic HTML

**Use proper HTML elements**

```html
<!-- Good: Semantic button -->
<button class="mg-cta-button mg-cta-button--primary">
  <span class="mg-cta-button__text">Submit Report</span>
</button>

<!-- Good: Semantic navigation -->
<nav class="mg-breadcrumb" aria-label="Breadcrumb">
  <ol class="mg-breadcrumb__list">
    <li><a href="/">Home</a></li>
    <li><a href="/reports">Reports</a></li>
    <li aria-current="page">Current Report</li>
  </ol>
</nav>
```

**Avoid div-based interactive elements**

```html
<!-- Avoid: Non-semantic clickable div -->
<div class="mg-cta-button" onclick="handleClick()">Submit</div>
```

### 2. ARIA labels and descriptions

**Form fields**

```jsx
<TextInput
  type="email"
  label="Email address"
  helpText="We'll never share your email with anyone"
  error
  errorText="Please enter a valid email address"
  id="email"
  required
/>
```

**Interactive elements**

```jsx
<CtaButton
  label="Download"
  Type="Primary"
  aria-label="Download the Global Assessment Report PDF (2.3MB)"
  onClick={handleDownload}
/>
```

**Loading states**

```jsx
<div aria-live="polite" aria-busy={isLoading}>
  {isLoading ? 'Loading reports...' : `Found ${reports.length} reports`}
</div>
```

### 3. Keyboard navigation

**Focus management**

```jsx
function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <div
      className="mg-modal"
      role="dialog"
      aria-modal="true"
      ref={modalRef}
      tabIndex={-1}
    >
      {children}
    </div>
  );
}
```

**Skip links**

```html
<a href="#main-content" class="mg-skip-link">Skip to main content</a>
<nav class="mg-navigation">...</nav>
<main id="main-content" class="mg-main">...</main>
```

### 4. Color and contrast

**Sufficient contrast**

```scss
// Ensure WCAG AA compliance (4.5:1 for normal text)
$mg-text-color: #212529; // High contrast on white
$mg-text-muted: #6c757d; // 4.5:1 contrast ratio
$mg-link-color: #0066cc; // Accessible blue
$mg-error-color: #dc3545; // High contrast red
```

**Don't rely solely on color**

```jsx
// Good: Color + icon + text
<div className="mg-alert mg-alert--error">
  <span className="mg-icon mg-icon--error" aria-hidden="true">⚠️</span>
  <span className="mg-alert__text">Error: Please check your input</span>
</div>

// Avoid: Color only
<div className="mg-alert mg-alert--error">
  Please check your input
</div>
```

### 5. Focus management for dynamic content

When content appears dynamically (modals, drawers, notification banners), you must move focus so keyboard and screen reader users know something changed. Move focus to the new content when it opens, and return focus to the trigger element when it closes.

For modals, trap focus inside the dialog so Tab and Shift+Tab cycle through only the modal's interactive elements. Use `aria-modal="true"` and `role="dialog"` so screen readers announce the boundary.

```jsx
// Return focus to the trigger when a modal closes
function ModalTrigger() {
  const triggerRef = useRef(null);
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <>
      <button ref={triggerRef} onClick={() => setOpen(true)}>
        Open settings
      </button>
      {open && <Modal onClose={handleClose}>...</Modal>}
    </>
  );
}
```

### 6. Reduced motion

Some users experience motion sickness or distraction from animations. Respect the `prefers-reduced-motion` media query by wrapping transitions and animations so they only run when the user has not requested reduced motion.

```scss
// Only animate when the user allows it
.mg-card__title a::after {
  @media (prefers-reduced-motion: no-preference) {
    transition: translate 200ms ease;
  }
}
```

For JavaScript-driven animations, check the media query before starting:

```js
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)',
).matches;

if (!prefersReducedMotion) {
  element.classList.add('mg-animate-slide-in');
}
```

### 7. Touch target sizes

WCAG 2.2 criterion 2.5.8 requires interactive targets to be at least 24x24 CSS pixels, with 44x44px recommended. This matters for mobile users and people with motor impairments.

```scss
// Ensure minimum touch target size
.mg-icon-button {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

If the visual design requires a smaller target (for example, an inline text link), add padding or an invisible hit area rather than shrinking the interactive region.

### 8. Image alt text

Every `<img>` needs an `alt` attribute, but not every image needs descriptive text. Use empty alt (`alt=""`) for decorative images that add no information — icons next to labels, background flourishes, or purely visual separators. For informative images, describe the content and purpose, not the appearance.

```jsx
// Decorative: icon next to text that already conveys the meaning
<img src="/icons/download.svg" alt="" aria-hidden="true" />
<span>Download report</span>

// Informative: the image carries meaning not available in surrounding text
<img
  src="/photos/sendai-framework.jpg"
  alt="Delegates at the Third UN World Conference adopting the Sendai Framework"
/>
```

Avoid alt text that starts with "Image of" or "Photo of" — screen readers already announce the element as an image.

### 9. Error identification

When form validation fails, tell users what happened, which field has the problem, and how to fix it. Connect error messages to their fields with `aria-describedby` so screen readers announce the error when the field receives focus. Use `aria-invalid="true"` on the field itself.

```jsx
<label htmlFor="email">Email address</label>
<input
  id="email"
  type="email"
  aria-invalid={hasError}
  aria-describedby={hasError ? 'email-error' : undefined}
/>
{hasError && (
  <p id="email-error" className="mg-form__error" role="alert">
    Enter a valid email address, for example name@example.org
  </p>
)}
```

For forms with multiple errors, provide a summary at the top of the form that links to each invalid field. The `FormErrorSummary` component handles this pattern.

## Testing methodology

Automated tests catch roughly 30-40% of accessibility issues. The rest require manual testing with a keyboard and screen reader.

### Automated testing with jest-axe

The `jest-axe` library is globally configured in `jest.setup.js`, so `toHaveNoViolations` is available in every test file without additional imports. You only need to import the `axe` function itself.

```jsx
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { MyComponent } from '../MyComponent';

it('has no accessibility violations', async () => {
  const { container } = render(<MyComponent title="Example" />);
  expect(await axe(container)).toHaveNoViolations();
});
```

Include at least one `axe` test for each component. Test multiple states when the component changes structure significantly (for example, expanded vs. collapsed, loading vs. loaded, error vs. valid).

### Storybook a11y panel

The `@storybook/addon-a11y` addon is installed and runs axe-core checks on every story. Open the "Accessibility" panel in Storybook's addon tabs to see violations, passes, and incomplete checks in real time as you develop. This gives you faster feedback than running the full test suite.

### Manual keyboard testing

Automated tools cannot detect whether focus order makes sense or whether a custom widget is actually operable. Test these keyboard interactions for every interactive component:

| Key | Expected behavior |
|-----|-------------------|
| Tab | Moves focus to the next interactive element in logical order |
| Shift+Tab | Moves focus to the previous interactive element |
| Enter / Space | Activates buttons and links |
| Escape | Closes modals, dropdowns, and popover overlays |
| Arrow keys | Navigates within composite widgets (tabs, menus, radio groups) |

### Screen reader testing

Test with at least one screen reader before shipping a new component.

- **macOS**: VoiceOver (built in). Press Cmd+F5 to toggle. Use VO+Right Arrow to step through content.
- **Windows**: NVDA (free, [download from nvaccess.org](https://www.nvaccess.org/download/)). Pair with Firefox or Chrome.

Verify that the screen reader announces: the element role, name/label, current state (expanded, selected, checked), and any live region updates.

### Multi-theme contrast checking

Mangrove ships four themes (UNDRR, PreventionWeb, IRP, MCR2030), each with different color palettes. A color combination that passes AA contrast in one theme may fail in another. When you add or change colors:

1. Use the Storybook theme switcher toolbar to preview each theme.
2. Check foreground/background contrast with a tool such as the [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/).
3. Verify at least 4.5:1 for normal text, 3:1 for large text (18px+ or 14px+ bold), and 3:1 for UI components and graphical objects.

## Next steps

- [Best practices](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-best-practices--docs) — architecture and styling patterns
- [Component standards](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-component-standards--docs) — accessibility requirements for component authors
- [Testing](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-build-a-component-testing--docs) — jest-axe and manual accessibility testing
