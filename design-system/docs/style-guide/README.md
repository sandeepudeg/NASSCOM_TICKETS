# Visual Style Guide

The TicketIQ Design System visual foundation is built on the sophisticated dark theme from our demo page, creating a modern, professional aesthetic that works across all interfaces.

## Color System

### Primary Palette

Our color system is built around semantic tokens that adapt to different themes while maintaining proper contrast ratios.

#### Dark Theme (Primary)
```css
/* Primary Colors */
--color-primary: #4f46e5;
--color-primary-hover: #4338ca;
--color-primary-active: #3730a3;

/* Background Colors */
--color-bg: #0f172a;
--color-bg-2: #1e293b;
--color-bg-3: #334155;

/* Text Colors */
--color-text: #f8fafc;
--color-text-muted: #94a3b8;

/* Border Colors */
--color-border: #475569;
--color-border-light: #64748b;
```

#### Light Theme (Alternative)
```css
/* Primary Colors */
--color-primary: #4f46e5;
--color-primary-hover: #4338ca;
--color-primary-active: #3730a3;

/* Background Colors */
--color-bg: #ffffff;
--color-bg-2: #f8fafc;
--color-bg-3: #f1f5f9;

/* Text Colors */
--color-text: #0f172a;
--color-text-muted: #64748b;

/* Border Colors */
--color-border: #e2e8f0;
--color-border-light: #cbd5e1;
```

### Semantic Colors

#### Status Colors
- **Success**: `#10b981` - Confirmations, completed states
- **Warning**: `#f59e0b` - Cautions, pending states  
- **Danger**: `#ef4444` - Errors, destructive actions
- **Info**: `#3b82f6` - Information, neutral notifications

#### Interactive Colors
- **Focus**: `#4f46e5` with 20% opacity ring
- **Hover**: Primary color with 10% darker shade
- **Active**: Primary color with 20% darker shade
- **Disabled**: 40% opacity of base color

### Color Usage Guidelines

#### Contrast Requirements
All color combinations meet WCAG 2.1 AA standards:
- **Normal text**: 4.5:1 contrast ratio minimum
- **Large text**: 3:1 contrast ratio minimum
- **Interactive elements**: 3:1 contrast ratio for focus indicators

#### Color Accessibility
```html
<!-- Good: High contrast text -->
<div class="bg-slate-900 text-slate-100">
  High contrast content
</div>

<!-- Bad: Low contrast text -->
<div class="bg-slate-700 text-slate-600">
  Low contrast content
</div>
```

## Typography

### Font Family
Primary font stack with system fallbacks for optimal performance:
```css
font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, 
             'Helvetica Neue', Arial, sans-serif;
```

### Type Scale

#### Headings
```css
/* H1 - Page titles */
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; font-weight: 700; }

/* H2 - Section titles */
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; font-weight: 600; }

/* H3 - Subsection titles */
.text-2xl { font-size: 1.5rem; line-height: 2rem; font-weight: 600; }

/* H4 - Component titles */
.text-xl { font-size: 1.25rem; line-height: 1.75rem; font-weight: 500; }

/* H5 - Small headings */
.text-lg { font-size: 1.125rem; line-height: 1.75rem; font-weight: 500; }

/* H6 - Micro headings */
.text-base { font-size: 1rem; line-height: 1.5rem; font-weight: 500; }
```

#### Body Text
```css
/* Large body text */
.text-lg { font-size: 1.125rem; line-height: 1.75rem; font-weight: 400; }

/* Normal body text */
.text-base { font-size: 1rem; line-height: 1.5rem; font-weight: 400; }

/* Small body text */
.text-sm { font-size: 0.875rem; line-height: 1.25rem; font-weight: 400; }

/* Extra small text */
.text-xs { font-size: 0.75rem; line-height: 1rem; font-weight: 400; }
```

#### Font Weights
```css
.font-light { font-weight: 300; }
.font-normal { font-weight: 400; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
```

### Typography Guidelines

#### Hierarchy
- Use consistent heading levels to create clear information hierarchy
- Maintain proper contrast between heading and body text weights
- Limit to 2-3 font weights per interface to avoid visual noise

#### Line Height
- **Headings**: 1.2-1.4 ratio for tight, impactful text
- **Body text**: 1.5-1.6 ratio for optimal readability
- **UI text**: 1.25-1.5 ratio for compact interfaces

#### Letter Spacing
```css
.tracking-tight { letter-spacing: -0.025em; } /* Large headings */
.tracking-normal { letter-spacing: 0em; }     /* Body text */
.tracking-wide { letter-spacing: 0.025em; }   /* Small caps, buttons */
```

## Spacing System

### Base Unit System
Built on a 4px base unit for mathematical consistency:

```css
/* Spacing scale */
.space-1 { margin/padding: 0.25rem; }  /* 4px */
.space-2 { margin/padding: 0.5rem; }   /* 8px */
.space-3 { margin/padding: 0.75rem; }  /* 12px */
.space-4 { margin/padding: 1rem; }     /* 16px */
.space-5 { margin/padding: 1.25rem; }  /* 20px */
.space-6 { margin/padding: 1.5rem; }   /* 24px */
.space-8 { margin/padding: 2rem; }     /* 32px */
.space-10 { margin/padding: 2.5rem; }  /* 40px */
.space-12 { margin/padding: 3rem; }    /* 48px */
.space-16 { margin/padding: 4rem; }    /* 64px */
.space-20 { margin/padding: 5rem; }    /* 80px */
.space-24 { margin/padding: 6rem; }    /* 96px */
```

### Spacing Guidelines

#### Component Spacing
- **Buttons**: 12px vertical, 16px horizontal padding
- **Cards**: 24px internal padding, 16px between cards
- **Forms**: 16px between form fields, 8px for labels
- **Navigation**: 12px vertical, 16px horizontal for nav items

#### Layout Spacing
- **Sections**: 48px-64px vertical spacing between major sections
- **Containers**: 24px horizontal padding on mobile, 32px on desktop
- **Grid gaps**: 16px-24px between grid items

## Shadows and Elevation

### Shadow System
```css
/* No shadow */
.shadow-none { box-shadow: none; }

/* Small shadow - Cards, buttons */
.shadow-sm { 
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

/* Medium shadow - Dropdowns, popovers */
.shadow-md { 
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 
              0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* Large shadow - Modals, drawers */
.shadow-lg { 
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 
              0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Extra large shadow - Full-screen overlays */
.shadow-xl { 
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 
              0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
```

### Elevation Guidelines
- **Level 0**: Base surface (no shadow)
- **Level 1**: Slightly raised elements (cards, buttons)
- **Level 2**: Floating elements (dropdowns, tooltips)
- **Level 3**: Modal dialogs and overlays
- **Level 4**: Full-screen overlays and drawers

## Border Radius

### Radius Scale
```css
.rounded-none { border-radius: 0; }
.rounded-sm { border-radius: 0.125rem; }  /* 2px */
.rounded { border-radius: 0.25rem; }      /* 4px */
.rounded-md { border-radius: 0.375rem; }  /* 6px */
.rounded-lg { border-radius: 0.5rem; }    /* 8px */
.rounded-xl { border-radius: 0.75rem; }   /* 12px */
.rounded-2xl { border-radius: 1rem; }     /* 16px */
.rounded-full { border-radius: 9999px; }  /* Circular */
```

### Border Radius Usage
- **Buttons**: 6px (rounded-md) for balanced appearance
- **Cards**: 8px (rounded-lg) for modern feel
- **Inputs**: 6px (rounded-md) for consistency with buttons
- **Avatars**: Full rounding (rounded-full) for circular shape
- **Badges**: 12px (rounded-xl) for pill shape

## Interactive Examples

### Color Palette Demo
```html
<div class="color-palette-demo">
  <div class="color-swatch bg-primary">
    <span class="color-name">Primary</span>
    <span class="color-value">#4f46e5</span>
  </div>
  <div class="color-swatch bg-success">
    <span class="color-name">Success</span>
    <span class="color-value">#10b981</span>
  </div>
  <!-- Additional swatches... -->
</div>
```

### Typography Scale Demo
```html
<div class="typography-demo">
  <h1 class="text-4xl font-bold">Heading 1 - Page Title</h1>
  <h2 class="text-3xl font-semibold">Heading 2 - Section Title</h2>
  <h3 class="text-2xl font-semibold">Heading 3 - Subsection</h3>
  <p class="text-base">Body text with optimal readability and line height for comfortable reading across all devices.</p>
  <p class="text-sm text-muted">Small text for secondary information and captions.</p>
</div>
```

### Spacing Demo
```html
<div class="spacing-demo">
  <div class="p-4 bg-bg-2 rounded-lg mb-4">
    <h4 class="text-lg font-medium mb-2">Card with 16px padding</h4>
    <p class="text-sm text-muted">Content with proper spacing relationships</p>
  </div>
</div>
```

## Design Tokens Reference

All visual properties are available as CSS custom properties, JavaScript modules, and JSON files:

### CSS Custom Properties
```css
:root {
  /* Colors */
  --color-primary: #4f46e5;
  --color-bg: #0f172a;
  
  /* Typography */
  --font-family-sans: 'Segoe UI', system-ui, sans-serif;
  --font-size-base: 1rem;
  
  /* Spacing */
  --space-4: 1rem;
  --space-6: 1.5rem;
  
  /* Shadows */
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
```

### JavaScript Tokens
```javascript
import { tokens } from '@ticketiq/design-system/tokens';

const primaryColor = tokens.colors.primary;
const baseSpacing = tokens.spacing.base;
```

### JSON Tokens
```json
{
  "colors": {
    "primary": "#4f46e5",
    "bg": "#0f172a"
  },
  "spacing": {
    "base": "1rem",
    "large": "1.5rem"
  }
}
```