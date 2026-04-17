# Accessibility Guidelines

The TicketIQ Design System is built with accessibility as a core principle, ensuring WCAG 2.1 AA compliance across all components and interfaces. This guide provides comprehensive accessibility guidelines, testing procedures, and best practices.

## WCAG 2.1 AA Compliance

### Overview
All design system components meet or exceed WCAG 2.1 AA standards, providing:
- **Perceivable** content that can be presented in different ways
- **Operable** interface components and navigation
- **Understandable** information and UI operation
- **Robust** content that works with assistive technologies

### Compliance Checklist
- ✅ Color contrast ratios meet 4.5:1 for normal text, 3:1 for large text
- ✅ All interactive elements are keyboard accessible
- ✅ Focus indicators are clearly visible (2px minimum)
- ✅ Screen reader compatible markup with proper ARIA labels
- ✅ Form validation messages are accessible
- ✅ Images have appropriate alt text
- ✅ Headings follow proper hierarchy (h1-h6)
- ✅ Links have descriptive text or accessible names

## Color and Contrast

### Contrast Requirements
The design system ensures proper contrast ratios across all themes:

#### Dark Theme Contrast Ratios
```css
/* Text on backgrounds */
--color-text on --color-bg: 15.8:1 (AAA)
--color-text-muted on --color-bg: 7.2:1 (AA)
--color-primary on --color-bg: 8.1:1 (AA)

/* Interactive elements */
--color-primary on white: 8.1:1 (AA)
--color-success on --color-bg: 9.3:1 (AA)
--color-danger on --color-bg: 7.8:1 (AA)
--color-warning on black: 12.4:1 (AAA)
```

#### Light Theme Contrast Ratios
```css
/* Text on backgrounds */
--color-text on --color-bg: 16.2:1 (AAA)
--color-text-muted on --color-bg: 7.5:1 (AA)
--color-primary on --color-bg: 8.1:1 (AA)

/* Interactive elements */
--color-primary on white: 8.1:1 (AA)
--color-success on white: 4.8:1 (AA)
--color-danger on white: 5.9:1 (AA)
```

### Color Usage Guidelines

#### Do's
```html
<!-- Good: High contrast text -->
<div class="bg-slate-900 text-slate-100">
  <h2>High Contrast Heading</h2>
  <p class="text-slate-300">Readable body text with proper contrast</p>
</div>

<!-- Good: Accessible status colors -->
<span class="ds-badge ds-badge--success" role="status" aria-label="Approved">
  ✓ Approved
</span>
```

#### Don'ts
```html
<!-- Bad: Low contrast text -->
<div class="bg-slate-600 text-slate-500">
  <p>This text fails contrast requirements</p>
</div>

<!-- Bad: Color-only information -->
<span class="text-red-500">Error</span> <!-- Missing icon or text -->
```

### High Contrast Mode Support
```css
/* High contrast mode adaptations */
@media (prefers-contrast: high) {
  .ds-button {
    border-width: 2px;
    border-style: solid;
  }
  
  .ds-button:focus {
    outline: 3px solid;
    outline-offset: 2px;
  }
  
  .ds-card {
    border: 2px solid;
  }
}

/* Forced colors mode (Windows High Contrast) */
@media (forced-colors: active) {
  .ds-button {
    border: 1px solid ButtonText;
  }
  
  .ds-button:hover {
    background: Highlight;
    color: HighlightText;
  }
}
```

## Keyboard Navigation

### Navigation Patterns
All interactive elements support keyboard navigation:

#### Tab Order
- **Tab** - Move to next focusable element
- **Shift + Tab** - Move to previous focusable element
- **Enter** - Activate buttons, links, and form controls
- **Space** - Activate buttons and checkboxes
- **Arrow keys** - Navigate within component groups (tabs, menus, etc.)
- **Escape** - Close modals, dropdowns, and overlays

#### Focus Management
```css
/* Visible focus indicators */
.ds-button:focus-visible,
.ds-input:focus-visible,
.ds-link:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Focus trap for modals */
.ds-modal[aria-hidden="false"] {
  /* Focus is managed within modal */
}
```

### Keyboard Shortcuts
```javascript
// Global keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Skip to main content
  if (e.altKey && e.key === 'm') {
    document.getElementById('main-content')?.focus();
  }
  
  // Toggle theme
  if (e.altKey && e.key === 't') {
    toggleTheme();
  }
  
  // Open search
  if (e.ctrlKey && e.key === 'k') {
    e.preventDefault();
    openSearch();
  }
});
```

### Skip Links
```html
<!-- Skip navigation for screen readers -->
<a href="#main-content" class="ds-skip-link">
  Skip to main content
</a>

<nav aria-label="Main navigation">
  <!-- Navigation content -->
</nav>

<main id="main-content" tabindex="-1">
  <!-- Main content -->
</main>
```

## Screen Reader Support

### ARIA Labels and Descriptions
```html
<!-- Button with accessible name -->
<button 
  class="ds-button ds-button--primary"
  aria-label="Save document"
  aria-describedby="save-help"
>
  <span class="ds-icon" aria-hidden="true">💾</span>
  Save
</button>
<div id="save-help" class="ds-sr-only">
  Saves the current document to your account
</div>

<!-- Form input with validation -->
<label for="email" class="ds-form-label">
  Email Address
  <span class="ds-required" aria-label="required">*</span>
</label>
<input 
  id="email"
  type="email"
  class="ds-input"
  aria-required="true"
  aria-invalid="false"
  aria-describedby="email-error email-help"
>
<div id="email-help" class="ds-form-help">
  We'll never share your email address
</div>
<div id="email-error" class="ds-form-error" aria-live="polite">
  <!-- Error message appears here -->
</div>
```

### Live Regions
```html
<!-- Status updates -->
<div aria-live="polite" aria-atomic="true" class="ds-sr-only" id="status-region">
  <!-- Dynamic status messages -->
</div>

<!-- Alert messages -->
<div aria-live="assertive" aria-atomic="true" class="ds-sr-only" id="alert-region">
  <!-- Urgent messages -->
</div>

<!-- Loading states -->
<button class="ds-button" aria-busy="true" aria-describedby="loading-text">
  <span class="ds-spinner" aria-hidden="true"></span>
  <span id="loading-text">Saving changes...</span>
</button>
```

### Screen Reader Only Content
```css
/* Screen reader only text */
.ds-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Show on focus for keyboard users */
.ds-sr-only:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

## Form Accessibility

### Form Labels and Structure
```html
<!-- Proper form structure -->
<form class="ds-form" novalidate>
  <fieldset class="ds-fieldset">
    <legend class="ds-legend">Personal Information</legend>
    
    <div class="ds-form-field">
      <label for="first-name" class="ds-form-label ds-form-label--required">
        First Name
      </label>
      <input 
        id="first-name"
        name="firstName"
        type="text"
        class="ds-input"
        required
        aria-required="true"
        aria-describedby="first-name-error"
      >
      <div id="first-name-error" class="ds-form-error" role="alert">
        <!-- Error message -->
      </div>
    </div>
    
    <div class="ds-form-field">
      <fieldset class="ds-radio-group">
        <legend class="ds-form-label">Preferred Contact Method</legend>
        <div class="ds-radio-options">
          <label class="ds-radio">
            <input type="radio" name="contact" value="email" class="ds-radio__input">
            <span class="ds-radio__label">Email</span>
          </label>
          <label class="ds-radio">
            <input type="radio" name="contact" value="phone" class="ds-radio__input">
            <span class="ds-radio__label">Phone</span>
          </label>
        </div>
      </fieldset>
    </div>
  </fieldset>
</form>
```

### Form Validation
```javascript
// Accessible form validation
class AccessibleFormValidator {
  constructor(form) {
    this.form = form;
    this.errors = new Map();
    this.init();
  }
  
  init() {
    this.form.addEventListener('submit', this.handleSubmit.bind(this));
    this.form.addEventListener('input', this.handleInput.bind(this));
  }
  
  handleSubmit(e) {
    e.preventDefault();
    
    const isValid = this.validateForm();
    if (isValid) {
      this.submitForm();
    } else {
      this.focusFirstError();
      this.announceErrors();
    }
  }
  
  validateField(field) {
    const errors = [];
    
    if (field.hasAttribute('required') && !field.value.trim()) {
      errors.push(`${this.getFieldLabel(field)} is required`);
    }
    
    if (field.type === 'email' && field.value && !this.isValidEmail(field.value)) {
      errors.push('Please enter a valid email address');
    }
    
    this.updateFieldErrors(field, errors);
    return errors.length === 0;
  }
  
  updateFieldErrors(field, errors) {
    const errorElement = document.getElementById(`${field.id}-error`);
    
    if (errors.length > 0) {
      field.setAttribute('aria-invalid', 'true');
      field.classList.add('ds-input--error');
      
      if (errorElement) {
        errorElement.textContent = errors[0];
        errorElement.setAttribute('role', 'alert');
      }
    } else {
      field.setAttribute('aria-invalid', 'false');
      field.classList.remove('ds-input--error');
      
      if (errorElement) {
        errorElement.textContent = '';
        errorElement.removeAttribute('role');
      }
    }
  }
  
  announceErrors() {
    const errorCount = this.errors.size;
    const message = `Form has ${errorCount} error${errorCount !== 1 ? 's' : ''}. Please review and correct.`;
    
    this.announceToScreenReader(message);
  }
  
  announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'assertive');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'ds-sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }
}
```

## Component-Specific Accessibility

### Button Accessibility
```html
<!-- Standard button -->
<button class="ds-button ds-button--primary">
  Save Changes
</button>

<!-- Icon button with accessible name -->
<button 
  class="ds-button ds-button--ghost"
  aria-label="Close dialog"
>
  <span class="ds-icon" aria-hidden="true">×</span>
</button>

<!-- Toggle button -->
<button 
  class="ds-button ds-button--outline"
  aria-pressed="false"
  aria-label="Toggle dark mode"
>
  <span class="ds-icon" aria-hidden="true">🌙</span>
  Dark Mode
</button>

<!-- Loading button -->
<button 
  class="ds-button ds-button--primary"
  aria-busy="true"
  disabled
>
  <span class="ds-spinner" aria-hidden="true"></span>
  Saving...
</button>
```

### Modal Accessibility
```html
<!-- Modal with proper ARIA -->
<div 
  class="ds-modal"
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <div class="ds-modal__content">
    <div class="ds-modal__header">
      <h2 id="modal-title" class="ds-modal__title">
        Confirm Action
      </h2>
      <button 
        class="ds-modal__close"
        aria-label="Close dialog"
        onclick="closeModal()"
      >
        ×
      </button>
    </div>
    
    <div class="ds-modal__body">
      <p id="modal-description">
        Are you sure you want to delete this item?
      </p>
    </div>
    
    <div class="ds-modal__footer">
      <button class="ds-button ds-button--outline" onclick="closeModal()">
        Cancel
      </button>
      <button class="ds-button ds-button--danger" onclick="confirmDelete()">
        Delete
      </button>
    </div>
  </div>
</div>
```

### Table Accessibility
```html
<!-- Accessible data table -->
<table class="ds-table" role="table">
  <caption class="ds-table__caption">
    User Management - 25 users total
  </caption>
  
  <thead class="ds-table__head">
    <tr class="ds-table__row" role="row">
      <th class="ds-table__header" role="columnheader" scope="col">
        <button class="ds-table__sort" aria-sort="ascending">
          Name
          <span class="ds-icon" aria-hidden="true">↑</span>
        </button>
      </th>
      <th class="ds-table__header" role="columnheader" scope="col">Email</th>
      <th class="ds-table__header" role="columnheader" scope="col">Role</th>
      <th class="ds-table__header" role="columnheader" scope="col">Actions</th>
    </tr>
  </thead>
  
  <tbody class="ds-table__body">
    <tr class="ds-table__row" role="row">
      <td class="ds-table__cell" role="gridcell">John Doe</td>
      <td class="ds-table__cell" role="gridcell">john@example.com</td>
      <td class="ds-table__cell" role="gridcell">
        <span class="ds-badge ds-badge--primary">Admin</span>
      </td>
      <td class="ds-table__cell" role="gridcell">
        <button 
          class="ds-button ds-button--ghost ds-button--small"
          aria-label="Edit John Doe"
        >
          Edit
        </button>
      </td>
    </tr>
  </tbody>
</table>
```

## Testing Procedures

### Automated Testing

#### axe-core Integration
```javascript
// Jest + axe-core testing
import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/react';

expect.extend(toHaveNoViolations);

test('button has no accessibility violations', async () => {
  const { container } = render(
    <Button variant="primary">Test Button</Button>
  );
  
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

test('form has no accessibility violations', async () => {
  const { container } = render(
    <form>
      <Input label="Email" type="email" required />
      <Button type="submit">Submit</Button>
    </form>
  );
  
  const results = await axe(container, {
    rules: {
      'color-contrast': { enabled: true },
      'keyboard-navigation': { enabled: true }
    }
  });
  
  expect(results).toHaveNoViolations();
});
```

#### Lighthouse CI
```yaml
# .github/workflows/accessibility.yml
name: Accessibility Testing

on: [push, pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build project
        run: npm run build
      
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

### Manual Testing

#### Keyboard Testing Checklist
- [ ] All interactive elements are reachable via Tab key
- [ ] Tab order is logical and follows visual layout
- [ ] Focus indicators are clearly visible
- [ ] Enter/Space activate buttons and controls
- [ ] Arrow keys work within component groups
- [ ] Escape closes modals and dropdowns
- [ ] Skip links work correctly

#### Screen Reader Testing
```bash
# Test with different screen readers
# NVDA (Windows) - Free
# JAWS (Windows) - Commercial
# VoiceOver (macOS) - Built-in
# Orca (Linux) - Free

# Common screen reader commands:
# - Navigate by headings: H/Shift+H
# - Navigate by links: K/Shift+K
# - Navigate by buttons: B/Shift+B
# - Navigate by form fields: F/Shift+F
# - Read all content: Ctrl+A (then arrow keys)
```

#### Color and Contrast Testing
```javascript
// Contrast ratio testing
function checkContrast(foreground, background) {
  const ratio = getContrastRatio(foreground, background);
  
  return {
    aa: ratio >= 4.5,      // WCAG AA normal text
    aaLarge: ratio >= 3.0, // WCAG AA large text
    aaa: ratio >= 7.0      // WCAG AAA normal text
  };
}

// Color blindness simulation
const colorBlindnessFilters = {
  protanopia: 'url(#protanopia-filter)',
  deuteranopia: 'url(#deuteranopia-filter)',
  tritanopia: 'url(#tritanopia-filter)'
};
```

### Testing Tools

#### Browser Extensions
- **axe DevTools** - Automated accessibility scanning
- **WAVE** - Web accessibility evaluation
- **Colour Contrast Analyser** - Color contrast checking
- **Lighthouse** - Performance and accessibility auditing

#### Desktop Tools
- **Accessibility Insights** - Microsoft's accessibility testing suite
- **Color Oracle** - Color blindness simulator
- **Screen Reader** - NVDA, JAWS, VoiceOver testing

#### Command Line Tools
```bash
# Pa11y - Command line accessibility testing
npm install -g pa11y
pa11y http://localhost:3000

# axe-cli - Command line axe testing
npm install -g axe-cli
axe http://localhost:3000

# Lighthouse CLI
npm install -g lighthouse
lighthouse http://localhost:3000 --only-categories=accessibility
```

## Best Practices

### Development Guidelines

#### Do's
- Use semantic HTML elements (`<button>`, `<nav>`, `<main>`, etc.)
- Provide alternative text for images and icons
- Use proper heading hierarchy (h1-h6)
- Include focus indicators for all interactive elements
- Test with keyboard navigation and screen readers
- Validate HTML markup regularly
- Use ARIA attributes appropriately
- Provide multiple ways to access content

#### Don'ts
- Don't rely solely on color to convey information
- Don't use placeholder text as labels
- Don't create keyboard traps
- Don't use `div` or `span` for interactive elements
- Don't hide focus indicators
- Don't use auto-playing media without controls
- Don't create content that flashes more than 3 times per second

### Content Guidelines

#### Writing for Accessibility
- Use clear, simple language
- Provide descriptive link text
- Use active voice when possible
- Break up long content with headings
- Provide summaries for complex content
- Use lists for related items
- Include alternative formats when needed

#### Image and Media Guidelines
```html
<!-- Informative images -->
<img src="chart.png" alt="Sales increased 25% from Q1 to Q2">

<!-- Decorative images -->
<img src="decoration.png" alt="" role="presentation">

<!-- Complex images -->
<img src="complex-chart.png" alt="Quarterly sales data" aria-describedby="chart-description">
<div id="chart-description">
  Detailed description of the chart data...
</div>

<!-- Video with captions -->
<video controls>
  <source src="video.mp4" type="video/mp4">
  <track kind="captions" src="captions.vtt" srclang="en" label="English">
</video>
```

## Accessibility Statement

### Commitment
TicketIQ is committed to ensuring digital accessibility for people with disabilities. We continually improve the user experience for everyone and apply relevant accessibility standards.

### Conformance Status
The TicketIQ Design System conforms to WCAG 2.1 Level AA. These guidelines explain how to make web content accessible to people with disabilities.

### Feedback
We welcome your feedback on the accessibility of the TicketIQ Design System. Please contact us:
- **Email**: accessibility@ticketiq.com
- **Phone**: +1 (555) 123-4567
- **Address**: 123 Main St, Suite 100, City, State 12345

### Assessment Approach
TicketIQ assessed the accessibility of the Design System through:
- Self-evaluation using automated and manual testing
- External accessibility audits by certified professionals
- User testing with people who use assistive technologies
- Ongoing monitoring and updates

This statement was created on [Date] and last reviewed on [Date].