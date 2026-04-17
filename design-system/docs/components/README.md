# Component Library

The TicketIQ Design System provides a comprehensive set of components that work seamlessly across React and Flask applications. All components follow consistent design patterns and accessibility standards.

## Component Categories

### Foundation Components
Core interactive elements that form the basis of user interfaces.

- **[Button](./Button.md)** - Primary actions and navigation
- **[Input](./Input.md)** - Text input, textarea, and form controls
- **[Select](./Select.md)** - Dropdown selection components
- **[Checkbox](./Checkbox.md)** - Boolean input controls
- **[Radio](./Radio.md)** - Single selection from multiple options

### Layout Components
Structural elements for organizing content and creating responsive layouts.

- **[Container](./Container.md)** - Responsive width constraints
- **[Grid](./Grid.md)** - 12-column responsive grid system
- **[Stack](./Stack.md)** - Vertical and horizontal spacing
- **[Flex](./Flex.md)** - Flexbox layout utilities
- **[Card](./Card.md)** - Content containers with consistent styling

### Navigation Components
Elements for site navigation and user wayfinding.

- **[Header](./Header.md)** - Top navigation and branding
- **[Sidebar](./Sidebar.md)** - Side navigation panels
- **[Breadcrumb](./Breadcrumb.md)** - Hierarchical navigation
- **[Tabs](./Tabs.md)** - Content organization and switching
- **[Pagination](./Pagination.md)** - Large dataset navigation

### Feedback Components
Elements that provide user feedback and system status.

- **[Alert](./Alert.md)** - Important messages and notifications
- **[Toast](./Toast.md)** - Temporary notifications
- **[Modal](./Modal.md)** - Overlay dialogs and confirmations
- **[Loading](./Loading.md)** - Progress indicators and spinners
- **[Badge](./Badge.md)** - Status indicators and counts

### Data Display Components
Elements for presenting information and data.

- **[Table](./Table.md)** - Structured data presentation
- **[List](./List.md)** - Ordered and unordered content lists
- **[Avatar](./Avatar.md)** - User profile images and initials
- **[Tooltip](./Tooltip.md)** - Contextual help and information
- **[Popover](./Popover.md)** - Rich contextual overlays

## Usage Patterns

### React Components

#### Basic Usage
```jsx
import { Button, Card, Input } from '@ticketiq/design-system';

function LoginForm() {
  return (
    <Card>
      <h2>Sign In</h2>
      <Input 
        label="Email" 
        type="email" 
        placeholder="Enter your email"
        required 
      />
      <Input 
        label="Password" 
        type="password" 
        placeholder="Enter your password"
        required 
      />
      <Button variant="primary" size="large" fullWidth>
        Sign In
      </Button>
    </Card>
  );
}
```

#### Advanced Usage with Theme
```jsx
import { ThemeProvider, Button, useTheme } from '@ticketiq/design-system';

function ThemedButton() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <Button 
      variant="outline" 
      onClick={toggleTheme}
      icon={theme === 'dark' ? 'sun' : 'moon'}
    >
      Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
    </Button>
  );
}

function App() {
  return (
    <ThemeProvider theme="dark">
      <ThemedButton />
    </ThemeProvider>
  );
}
```

### Flask Templates

#### Basic Usage
```html
{% from 'design_system/macros.html' import ds_button, ds_card, ds_input %}

<form class="login-form">
  {% call ds_card(title="Sign In") %}
    {{ ds_input('email', type='email', label='Email', placeholder='Enter your email', required=true) }}
    {{ ds_input('password', type='password', label='Password', placeholder='Enter your password', required=true) }}
    {{ ds_button('Sign In', variant='primary', size='large', type='submit', class='w-full') }}
  {% endcall %}
</form>
```

#### Advanced Usage with Conditional Styling
```html
{% from 'design_system/macros.html' import ds_alert, ds_button %}

{% if error_message %}
  {{ ds_alert(error_message, type='danger', dismissible=true) }}
{% endif %}

{% if success_message %}
  {{ ds_alert(success_message, type='success', dismissible=true) }}
{% endif %}

<div class="action-buttons">
  {{ ds_button('Save', variant='primary', disabled=not form.validate()) }}
  {{ ds_button('Cancel', variant='outline', onclick='history.back()') }}
</div>
```

## Component API Patterns

### Common Props

All components share these common properties:

#### React Props
```typescript
interface BaseComponentProps {
  className?: string;           // Additional CSS classes
  id?: string;                 // HTML id attribute
  testId?: string;             // data-testid for testing
  children?: ReactNode;        // Child elements
  variant?: string;            // Component variant (primary, secondary, etc.)
  size?: 'small' | 'medium' | 'large'; // Component size
  disabled?: boolean;          // Disabled state
  loading?: boolean;           // Loading state
  fullWidth?: boolean;         // Full width styling
}
```

#### Flask Macro Parameters
```jinja2
{# Common macro parameters #}
{% macro component_base(
  class='',              {# Additional CSS classes #}
  id='',                 {# HTML id attribute #}
  variant='primary',     {# Component variant #}
  size='medium',         {# Component size #}
  disabled=false,        {# Disabled state #}
  loading=false,         {# Loading state #}
  full_width=false       {# Full width styling #}
) %}
```

### Variant System

Components support consistent variant patterns:

#### Primary Variants
- **primary** - Main call-to-action styling
- **secondary** - Secondary actions
- **outline** - Outlined styling with transparent background
- **ghost** - Minimal styling with hover effects
- **link** - Text-only styling for inline actions

#### Status Variants
- **success** - Positive actions and confirmations
- **warning** - Caution and attention-required actions
- **danger** - Destructive and error actions
- **info** - Informational and neutral actions

#### Size Variants
- **small** - Compact sizing for dense interfaces
- **medium** - Default sizing for most use cases
- **large** - Prominent sizing for important actions

### State Management

#### Interactive States
All interactive components support these states:

```css
/* Default state */
.component { /* base styles */ }

/* Hover state */
.component:hover { /* hover styles */ }

/* Focus state */
.component:focus { 
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Active state */
.component:active { /* active styles */ }

/* Disabled state */
.component:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Loading state */
.component.loading {
  position: relative;
  pointer-events: none;
}
```

#### Form States
Form components include validation states:

```css
/* Valid state */
.form-control.valid {
  border-color: var(--color-success);
}

/* Invalid state */
.form-control.invalid {
  border-color: var(--color-danger);
}

/* Required indicator */
.form-label.required::after {
  content: ' *';
  color: var(--color-danger);
}
```

## Accessibility Features

### Keyboard Navigation
All interactive components support keyboard navigation:

- **Tab/Shift+Tab** - Navigate between focusable elements
- **Enter/Space** - Activate buttons and controls
- **Arrow keys** - Navigate within component groups
- **Escape** - Close modals, dropdowns, and overlays

### Screen Reader Support
Components include proper ARIA attributes:

```html
<!-- Button with accessible label -->
<button 
  class="ds-button ds-button--primary"
  aria-label="Save document"
  aria-describedby="save-help"
>
  Save
</button>
<div id="save-help" class="sr-only">
  Saves the current document to your account
</div>

<!-- Form input with validation -->
<input 
  class="ds-input"
  aria-label="Email address"
  aria-required="true"
  aria-invalid="false"
  aria-describedby="email-error"
>
<div id="email-error" class="ds-error" aria-live="polite">
  <!-- Error message appears here -->
</div>
```

### Focus Management
Proper focus indicators and management:

```css
/* Visible focus indicators */
.ds-button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Focus trap for modals */
.ds-modal[aria-hidden="false"] {
  /* Focus is trapped within modal */
}
```

## Testing Components

### Unit Testing
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@ticketiq/design-system';

test('button handles click events', () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click me</Button>);
  
  fireEvent.click(screen.getByRole('button'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});

test('button supports disabled state', () => {
  render(<Button disabled>Disabled</Button>);
  
  const button = screen.getByRole('button');
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute('aria-disabled', 'true');
});
```

### Accessibility Testing
```javascript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('button has no accessibility violations', async () => {
  const { container } = render(<Button>Accessible Button</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Visual Regression Testing
```javascript
import { chromatic } from '@storybook/addon-chromatic';

// Storybook stories for visual testing
export default {
  title: 'Components/Button',
  component: Button,
  parameters: {
    chromatic: { 
      viewports: [320, 768, 1200] // Test multiple viewports
    }
  }
};

export const AllVariants = () => (
  <div className="space-y-4">
    <Button variant="primary">Primary</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="ghost">Ghost</Button>
  </div>
);
```

## Performance Considerations

### Bundle Size Optimization
```javascript
// Tree-shaking friendly imports
import { Button } from '@ticketiq/design-system/button';
import { Input } from '@ticketiq/design-system/input';

// Avoid importing entire library
// import * from '@ticketiq/design-system'; // ❌ Don't do this
```

### Lazy Loading
```javascript
// Lazy load heavy components
const Modal = lazy(() => import('@ticketiq/design-system/modal'));
const DataTable = lazy(() => import('@ticketiq/design-system/table'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Modal />
      <DataTable />
    </Suspense>
  );
}
```

### CSS Optimization
```css
/* Critical CSS - inline in head */
.ds-button { /* essential button styles */ }
.ds-input { /* essential input styles */ }

/* Non-critical CSS - load asynchronously */
.ds-modal { /* modal styles */ }
.ds-table { /* table styles */ }
```