# Button Component

The Button component is a fundamental interactive element used for actions, navigation, and form submissions. It supports multiple variants, sizes, and states while maintaining accessibility and consistent styling.

## Usage

### React

#### Basic Usage
```jsx
import { Button } from '@ticketiq/design-system';

function BasicExample() {
  return (
    <div className="space-x-4">
      <Button variant="primary">Primary Action</Button>
      <Button variant="secondary">Secondary Action</Button>
      <Button variant="outline">Outline Button</Button>
    </div>
  );
}
```

#### With Icons
```jsx
import { Button } from '@ticketiq/design-system';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

function IconExample() {
  return (
    <div className="space-x-4">
      <Button variant="primary" icon={<PlusIcon />}>
        Add Item
      </Button>
      <Button variant="danger" icon={<TrashIcon />} iconPosition="right">
        Delete
      </Button>
      <Button variant="ghost" icon={<PlusIcon />} iconOnly aria-label="Add item" />
    </div>
  );
}
```

#### Loading State
```jsx
import { Button } from '@ticketiq/design-system';

function LoadingExample() {
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async () => {
    setLoading(true);
    await submitForm();
    setLoading(false);
  };
  
  return (
    <Button 
      variant="primary" 
      loading={loading}
      onClick={handleSubmit}
    >
      {loading ? 'Saving...' : 'Save Changes'}
    </Button>
  );
}
```

### Flask

#### Basic Usage
```html
{% from 'design_system/macros.html' import ds_button %}

<!-- Primary button -->
{{ ds_button('Primary Action', variant='primary') }}

<!-- Secondary button -->
{{ ds_button('Secondary Action', variant='secondary') }}

<!-- Outline button -->
{{ ds_button('Outline Button', variant='outline') }}
```

#### Form Integration
```html
{% from 'design_system/macros.html' import ds_button %}

<form method="POST">
  {{ csrf_token() }}
  
  <div class="form-actions">
    {{ ds_button('Save Changes', variant='primary', type='submit') }}
    {{ ds_button('Cancel', variant='outline', onclick='history.back()') }}
  </div>
</form>
```

#### Conditional States
```html
{% from 'design_system/macros.html' import ds_button %}

<!-- Disabled state based on condition -->
{{ ds_button('Delete User', 
    variant='danger', 
    disabled=not current_user.can_delete_users,
    title='You do not have permission to delete users' if not current_user.can_delete_users
) }}

<!-- Loading state -->
{{ ds_button('Processing...', 
    variant='primary', 
    loading=true,
    disabled=true
) }}
```

## API Reference

### React Props

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button content */
  children: React.ReactNode;
  
  /** Visual variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'success' | 'warning' | 'danger';
  
  /** Button size */
  size?: 'small' | 'medium' | 'large';
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Loading state with spinner */
  loading?: boolean;
  
  /** Full width button */
  fullWidth?: boolean;
  
  /** Icon element */
  icon?: React.ReactNode;
  
  /** Icon position */
  iconPosition?: 'left' | 'right';
  
  /** Icon-only button (hides text) */
  iconOnly?: boolean;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Click handler */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  
  /** Button type for forms */
  type?: 'button' | 'submit' | 'reset';
  
  /** Test ID for testing */
  testId?: string;
}
```

### Flask Macro Parameters

```jinja2
{% macro ds_button(
  text,                    {# Button text content #}
  variant='primary',       {# Visual variant #}
  size='medium',          {# Button size #}
  type='button',          {# Button type (button, submit, reset) #}
  disabled=false,         {# Disabled state #}
  loading=false,          {# Loading state #}
  full_width=false,       {# Full width styling #}
  class='',               {# Additional CSS classes #}
  id='',                  {# HTML id attribute #}
  onclick='',             {# JavaScript onclick handler #}
  title='',               {# Tooltip text #}
  icon='',                {# Icon class or HTML #}
  icon_position='left',   {# Icon position (left, right) #}
  icon_only=false,        {# Icon-only button #}
  **kwargs                {# Additional HTML attributes #}
) %}
```

## Variants

### Primary Variants

#### Primary
The main call-to-action button with high visual prominence.

```jsx
<Button variant="primary">Save Changes</Button>
```

```html
{{ ds_button('Save Changes', variant='primary') }}
```

**Use cases:**
- Form submissions
- Primary actions in dialogs
- Main navigation actions

#### Secondary  
Secondary actions with medium visual prominence.

```jsx
<Button variant="secondary">View Details</Button>
```

```html
{{ ds_button('View Details', variant='secondary') }}
```

**Use cases:**
- Secondary actions in forms
- Navigation between steps
- Alternative actions

#### Outline
Outlined buttons with transparent background.

```jsx
<Button variant="outline">Cancel</Button>
```

```html
{{ ds_button('Cancel', variant='outline') }}
```

**Use cases:**
- Cancel actions
- Secondary navigation
- Filter toggles

#### Ghost
Minimal styling with hover effects.

```jsx
<Button variant="ghost">Edit</Button>
```

```html
{{ ds_button('Edit', variant='ghost') }}
```

**Use cases:**
- Inline actions
- Table row actions
- Subtle interactions

#### Link
Text-only styling for inline actions.

```jsx
<Button variant="link">Learn more</Button>
```

```html
{{ ds_button('Learn more', variant='link') }}
```

**Use cases:**
- Inline text actions
- Navigation links
- Help text actions

### Status Variants

#### Success
Positive actions and confirmations.

```jsx
<Button variant="success">Approve</Button>
```

```html
{{ ds_button('Approve', variant='success') }}
```

#### Warning
Caution and attention-required actions.

```jsx
<Button variant="warning">Archive</Button>
```

```html
{{ ds_button('Archive', variant='warning') }}
```

#### Danger
Destructive and error actions.

```jsx
<Button variant="danger">Delete</Button>
```

```html
{{ ds_button('Delete', variant='danger') }}
```

## Sizes

### Small
Compact sizing for dense interfaces.

```jsx
<Button size="small">Small Button</Button>
```

```html
{{ ds_button('Small Button', size='small') }}
```

**Specifications:**
- Height: 32px
- Padding: 8px 12px
- Font size: 14px

### Medium (Default)
Standard sizing for most use cases.

```jsx
<Button size="medium">Medium Button</Button>
```

```html
{{ ds_button('Medium Button', size='medium') }}
```

**Specifications:**
- Height: 40px
- Padding: 12px 16px
- Font size: 16px

### Large
Prominent sizing for important actions.

```jsx
<Button size="large">Large Button</Button>
```

```html
{{ ds_button('Large Button', size='large') }}
```

**Specifications:**
- Height: 48px
- Padding: 16px 24px
- Font size: 16px

## States

### Default State
Normal interactive state with hover and focus effects.

```css
.ds-button {
  background-color: var(--color-primary);
  color: var(--color-white);
  border: 1px solid var(--color-primary);
  transition: all 150ms ease;
}

.ds-button:hover {
  background-color: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

.ds-button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Disabled State
Non-interactive state with reduced opacity.

```jsx
<Button disabled>Disabled Button</Button>
```

```html
{{ ds_button('Disabled Button', disabled=true) }}
```

```css
.ds-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
```

### Loading State
Shows spinner and prevents interaction.

```jsx
<Button loading>Loading...</Button>
```

```html
{{ ds_button('Loading...', loading=true) }}
```

```css
.ds-button.loading {
  position: relative;
  pointer-events: none;
}

.ds-button.loading::before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
```

## Accessibility

### Keyboard Navigation
- **Tab** - Focus the button
- **Enter/Space** - Activate the button
- **Escape** - Remove focus (when appropriate)

### Screen Reader Support
```jsx
// Icon-only button with accessible label
<Button 
  variant="ghost" 
  icon={<EditIcon />} 
  iconOnly 
  aria-label="Edit user profile"
/>

// Button with description
<Button 
  variant="danger"
  aria-describedby="delete-warning"
>
  Delete Account
</Button>
<div id="delete-warning" className="sr-only">
  This action cannot be undone
</div>
```

### Focus Management
```css
/* High contrast focus indicator */
.ds-button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Ensure focus is visible in high contrast mode */
@media (prefers-contrast: high) {
  .ds-button:focus-visible {
    outline: 3px solid;
  }
}
```

### ARIA Attributes
```html
<!-- Loading button -->
<button 
  class="ds-button ds-button--primary"
  aria-busy="true"
  aria-describedby="loading-text"
>
  <span class="ds-button__spinner" aria-hidden="true"></span>
  <span id="loading-text">Saving changes...</span>
</button>

<!-- Toggle button -->
<button 
  class="ds-button ds-button--outline"
  aria-pressed="false"
  aria-label="Toggle dark mode"
>
  <span class="ds-button__icon" aria-hidden="true">🌙</span>
</button>
```

## Examples

### Form Actions
```jsx
function FormActions({ onSave, onCancel, saving }) {
  return (
    <div className="flex justify-end space-x-3">
      <Button 
        variant="outline" 
        onClick={onCancel}
        disabled={saving}
      >
        Cancel
      </Button>
      <Button 
        variant="primary" 
        onClick={onSave}
        loading={saving}
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  );
}
```

### Confirmation Dialog
```jsx
function DeleteConfirmation({ onConfirm, onCancel }) {
  return (
    <Modal title="Confirm Deletion">
      <p>Are you sure you want to delete this item? This action cannot be undone.</p>
      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          Delete
        </Button>
      </div>
    </Modal>
  );
}
```

### Navigation Actions
```jsx
function NavigationExample() {
  return (
    <div className="flex items-center justify-between">
      <Button variant="outline" icon={<ArrowLeftIcon />}>
        Back
      </Button>
      <div className="space-x-2">
        <Button variant="ghost">Skip</Button>
        <Button variant="primary" icon={<ArrowRightIcon />} iconPosition="right">
          Continue
        </Button>
      </div>
    </div>
  );
}
```

## Best Practices

### Do's
- Use primary buttons for the main action on a page
- Provide clear, action-oriented button text
- Use loading states for async operations
- Include proper ARIA labels for icon-only buttons
- Maintain consistent button hierarchy

### Don'ts
- Don't use multiple primary buttons in the same context
- Don't use vague text like "Click here" or "Submit"
- Don't disable buttons without explanation
- Don't use buttons for navigation (use links instead)
- Don't make buttons too small for touch targets

### Button Hierarchy
```jsx
// Good: Clear hierarchy
<div className="space-x-3">
  <Button variant="primary">Save</Button>      {/* Primary action */}
  <Button variant="outline">Cancel</Button>    {/* Secondary action */}
  <Button variant="ghost">Preview</Button>     {/* Tertiary action */}
</div>

// Bad: Competing primary actions
<div className="space-x-3">
  <Button variant="primary">Save</Button>
  <Button variant="primary">Publish</Button>   {/* Confusing hierarchy */}
</div>
```

### Responsive Considerations
```jsx
// Mobile-friendly button sizing
<Button 
  size="large"           // Larger touch targets on mobile
  fullWidth             // Full width on small screens
  className="md:w-auto md:size-medium" // Responsive sizing
>
  Submit Form
</Button>
```