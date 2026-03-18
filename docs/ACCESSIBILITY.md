# Accessibility

> **Single source:** This file is rendered both on [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/ACCESSIBILITY.md) and in the [Storybook docs](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-best-practices-accessibility--docs). Edit this file — changes appear in both places automatically.

Accessible design not only helps users with disabilities; it also provides a better user experience for everyone. All components follow the WCAG 2.1 AA standards.

All patterns are perceivable, operable, and understandable to users, even when using a screen reader or other assistive technology. However, how you use these elements also affects the accessibility of a product.

Please find additional information about accessibility in the links below:
Visit W3C WCAG for more detail https://www.w3.org/TR/WCAG21/

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
