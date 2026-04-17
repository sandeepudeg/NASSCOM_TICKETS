# TicketIQ Design System - Accessibility Guide

## WCAG 2.1 AA Compliance

The TicketIQ Design System is built with accessibility as a core principle, ensuring WCAG 2.1 AA compliance across all components and interfaces.

## Table of Contents

1. [Accessibility Features](#accessibility-features)
2. [Component Guidelines](#component-guidelines)
3. [Testing](#testing)
4. [Implementation Guide](#implementation-guide)
5. [Common Patterns](#common-patterns)
6. [Troubleshooting](#troubleshooting)

## Accessibility Features

### ✅ Focus Management
- **Visible Focus Indicators**: 3px outline with 2px offset for all interactive elements
- **Focus Trapping**: Automatic focus management for modals and dropdowns
- **Skip Navigation**: Skip links for keyboard users
- **Logical Tab Order**: Proper tabindex management

### ✅ Keyboard Navigation
- **Arrow Key Navigation**: Full support for menus, tabs, and lists
- **Enter/Space Activation**: Consistent activation patterns
- **Escape Key Handling**: Close modals and dropdowns
- **Home/End Navigation**: Jump to first/last items

### ✅ Screen Reader Support
- **Semantic HTML**: Proper use of headings, landmarks, and form elements
- **ARIA Labels**: Comprehensive labeling for all interactive elements
- **Live Regions**: Dynamic content announcements
- **Screen Reader Only Text**: Hidden descriptive text

### ✅ Color and Contrast
- **WCAG AA Compliance**: 4.5:1 contrast ratio for normal text, 3:1 for large text
- **High Contrast Mode**: Enhanced visibility for users with visual impairments
- **Forced Colors Support**: Windows High Contrast mode compatibility
- **Color Independence**: Information not conveyed by color alone

### ✅ Motion and Animation
- **Reduced Motion Support**: Respects `prefers-reduced-motion` setting
- **Essential Animations Only**: Loading indicators remain functional
- **Vestibular Safety**: No parallax or excessive motion effects

### ✅ Touch and Mobile
- **Minimum Touch Targets**: 44x44px minimum size (32x32px for small variants)
- **Adequate Spacing**: 8px minimum between touch targets
- **Responsive Design**: Usable from 320px to 2560px width
- **Zoom Support**: Content remains usable at 200% zoom

## Component Guidelines

### Buttons

```tsx
// ✅ Good - Accessible button
<AccessibleButton
  variant="primary"
  ariaLabel="Save document"
  ariaDescribedBy="save-help"
>
  Save
</AccessibleButton>

// ❌ Bad - Missing accessibility features
<button className="btn-primary">Save</button>
```

**Requirements:**
- Always provide accessible names via `aria-label` or visible text
- Use `aria-describedby` for additional context
- Implement proper loading states with `aria-busy`
- Ensure minimum 44x44px touch target size

### Forms

```tsx
// ✅ Good - Accessible form field
<AccessibleInput
  label="Email Address"
  type="email"
  required
  error={errors.email}
  helpText="We'll never share your email"
  ariaDescribedBy="email-help"
/>

// ❌ Bad - Missing label association
<input type="email" placeholder="Email" />
```

**Requirements:**
- Always associate labels with form controls
- Provide error messages with `role="alert"`
- Use `aria-invalid` for validation states
- Group related controls with `fieldset` and `legend`

### Navigation

```tsx
// ✅ Good - Accessible navigation
<AccessibleSkipLink href="#main-content">
  Skip to main content
</AccessibleSkipLink>

<nav aria-label="Main navigation">
  <AccessibleNavItem href="/home" current>Home</AccessibleNavItem>
  <AccessibleNavItem href="/about">About</AccessibleNavItem>
</nav>

// ❌ Bad - Missing navigation landmarks
<div className="nav">
  <a href="/home">Home</a>
</div>
```

**Requirements:**
- Provide skip links for keyboard users
- Use semantic navigation elements
- Indicate current page with `aria-current="page"`
- Implement proper heading hierarchy

### Modals and Dialogs

```tsx
// ✅ Good - Accessible modal
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Confirm Action"
  aria-describedby="modal-description"
>
  <p id="modal-description">Are you sure you want to delete this item?</p>
</Modal>

// ❌ Bad - Missing ARIA attributes
<div className="modal">
  <h2>Confirm Action</h2>
  <p>Are you sure?</p>
</div>
```

**Requirements:**
- Use `role="dialog"` and `aria-modal="true"`
- Provide accessible names with `aria-labelledby`
- Trap focus within the modal
- Return focus to trigger element on close

## Testing

### Automated Testing

The design system includes comprehensive accessibility tests:

```bash
# Run accessibility tests
npm run test:accessibility

# Run with coverage
npm run test:accessibility -- --coverage

# Run specific test suite
npm run test -- accessibility.test.js
```

### Manual Testing Checklist

#### Keyboard Navigation
- [ ] All interactive elements are focusable
- [ ] Focus indicators are clearly visible
- [ ] Tab order is logical
- [ ] All functionality available via keyboard
- [ ] No keyboard traps (except intentional focus trapping)

#### Screen Reader Testing
- [ ] Content is announced in logical order
- [ ] All images have appropriate alt text
- [ ] Form fields have proper labels
- [ ] Error messages are announced
- [ ] Dynamic content changes are announced

#### Color and Contrast
- [ ] Text meets WCAG AA contrast requirements
- [ ] Interactive elements have sufficient contrast
- [ ] Information is not conveyed by color alone
- [ ] High contrast mode works properly

#### Zoom and Responsive
- [ ] Content is usable at 200% zoom
- [ ] No horizontal scrolling at standard zoom levels
- [ ] Touch targets are adequately sized
- [ ] Content reflows properly on mobile

### Testing Tools

#### Browser Extensions
- **axe DevTools**: Automated accessibility scanning
- **WAVE**: Web accessibility evaluation
- **Lighthouse**: Accessibility audit included

#### Screen Readers
- **NVDA** (Windows): Free screen reader for testing
- **JAWS** (Windows): Professional screen reader
- **VoiceOver** (macOS): Built-in screen reader
- **Orca** (Linux): Open source screen reader

#### Color Tools
- **Colour Contrast Analyser**: Check contrast ratios
- **Sim Daltonism**: Color blindness simulator
- **Stark**: Design tool accessibility plugin

## Implementation Guide

### React Components

```tsx
import { 
  AccessibleButton, 
  AccessibleForm, 
  AccessibleInput,
  FocusManager,
  ScreenReaderAnnouncer 
} from '@ticketiq/design-system';

function MyForm() {
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate form
    if (Object.keys(errors).length > 0) {
      ScreenReaderAnnouncer.announceFormErrors(
        Object.values(errors)
      );
    }
  };

  return (
    <AccessibleForm onSubmit={handleSubmit} errors={errors}>
      <AccessibleInput
        label="Full Name"
        name="name"
        required
        error={errors.name}
      />
      
      <AccessibleButton type="submit">
        Submit Form
      </AccessibleButton>
    </AccessibleForm>
  );
}
```

### Flask Templates

```jinja2
{% from 'accessibility.html' import 
  ds_skip_nav, 
  ds_accessible_button, 
  ds_accessible_input,
  ds_accessible_form_group 
%}

{{ ds_skip_nav('#main-content', 'Skip to main content') }}

<main id="main-content">
  <form method="post">
    {{ ds_accessible_input(
      name='email',
      type='email',
      label='Email Address',
      required=true,
      error=errors.email if errors else '',
      help_text='We will never share your email address'
    ) }}
    
    {{ ds_accessible_button(
      text='Submit',
      type='submit',
      variant='primary'
    ) }}
  </form>
</main>
```

### CSS Utilities

```css
/* Focus management */
.focus-visible {
  outline: 3px solid var(--color-theme-primary);
  outline-offset: 2px;
}

/* Screen reader only content */
.sr-only {
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

/* High contrast support */
@media (prefers-contrast: high) {
  .btn {
    border: 2px solid currentColor;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Common Patterns

### Form Validation

```tsx
// Accessible form validation
const validateField = (field, value) => {
  const isValid = value.length > 0;
  
  // Update ARIA attributes
  field.setAttribute('aria-invalid', isValid ? 'false' : 'true');
  
  // Announce errors to screen readers
  if (!isValid) {
    ScreenReaderAnnouncer.announce(
      `Error: ${field.name} is required`, 
      'assertive'
    );
  }
  
  return isValid;
};
```

### Dynamic Content Updates

```tsx
// Announce dynamic content changes
const updateContent = (newContent) => {
  setContent(newContent);
  
  // Announce change to screen readers
  ScreenReaderAnnouncer.announce(
    'Content has been updated',
    'polite'
  );
};
```

### Focus Management

```tsx
// Modal focus management
const openModal = () => {
  setIsOpen(true);
  
  // Trap focus in modal
  const cleanup = FocusManager.trapFocus(
    modalRef.current,
    firstButtonRef.current
  );
  
  // Store cleanup function
  setFocusCleanup(() => cleanup);
};

const closeModal = () => {
  setIsOpen(false);
  
  // Restore focus to trigger
  FocusManager.restoreFocus(triggerRef.current);
  
  // Clean up focus trap
  focusCleanup?.();
};
```

## Troubleshooting

### Common Issues

#### Focus Not Visible
**Problem**: Focus indicators not showing up
**Solution**: Ensure `:focus-visible` styles are properly implemented

```css
/* Fix focus visibility */
.btn:focus-visible {
  outline: 3px solid var(--color-theme-primary);
  outline-offset: 2px;
}
```

#### Screen Reader Not Announcing
**Problem**: Dynamic content changes not announced
**Solution**: Use proper ARIA live regions

```tsx
// Add live region for announcements
<div aria-live="polite" className="sr-only" id="announcements">
  {announcement}
</div>
```

#### Form Validation Issues
**Problem**: Error messages not associated with fields
**Solution**: Use `aria-describedby` to link errors

```tsx
<input
  aria-describedby="field-error field-help"
  aria-invalid={hasError ? 'true' : 'false'}
/>
<div id="field-error" role="alert">
  {errorMessage}
</div>
```

#### Keyboard Navigation Problems
**Problem**: Arrow keys not working in custom components
**Solution**: Implement proper keyboard event handlers

```tsx
const handleKeyDown = (e) => {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      focusNextItem();
      break;
    case 'ArrowUp':
      e.preventDefault();
      focusPreviousItem();
      break;
  }
};
```

### Performance Considerations

- Use `will-change` sparingly to avoid performance issues
- Implement virtual scrolling for large lists
- Debounce live region announcements
- Cache focus trap calculations

### Browser Support

The accessibility features support:
- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+
- iOS Safari 14+
- Chrome Android 88+

## Resources

### WCAG Guidelines
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/?levels=aa)
- [WebAIM WCAG Checklist](https://webaim.org/standards/wcag/checklist)

### Testing Resources
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [Screen Reader Testing Guide](https://webaim.org/articles/screenreader_testing/)

### ARIA Patterns
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [ARIA Examples](https://www.w3.org/WAI/ARIA/apg/example-index/)

## Support

For accessibility questions or issues:
- Create an issue in the design system repository
- Contact the accessibility team
- Review the component documentation
- Check the testing guidelines

Remember: Accessibility is not a feature to be added later—it's a fundamental requirement that should be considered from the beginning of every design and development decision.