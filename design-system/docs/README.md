# Unified Design System Documentation

Welcome to the comprehensive documentation for the TicketIQ Unified Design System. This design system establishes consistent visual language and user experience across all interfaces, based on the sophisticated dark theme from our demo page.

## Quick Start

### For React Developers
```bash
npm install @ticketiq/design-system
```

```jsx
import { ThemeProvider, Button } from '@ticketiq/design-system';

function App() {
  return (
    <ThemeProvider theme="dark">
      <Button variant="primary">Get Started</Button>
    </ThemeProvider>
  );
}
```

### For Flask Developers
```html
<!-- Include CSS -->
<link rel="stylesheet" href="https://cdn.ticketiq.com/design-system/latest/ticketiq-design-system.css">

<!-- Use Jinja2 macros -->
{% from 'design_system/macros.html' import ds_button %}
{{ ds_button('Get Started', variant='primary') }}
```

## Documentation Structure

### 📚 [Style Guide](./style-guide/README.md)
Visual foundations including colors, typography, spacing, and design principles

### 🧩 [Components](./components/README.md)
Complete component library with interactive examples and API documentation

### ⚛️ [React Integration](./react/README.md)
React-specific implementation guidelines, theme provider setup, and TypeScript definitions

### 🌶️ [Flask Integration](./flask/README.md)
Flask integration with Jinja2 macros, Bootstrap overrides, and server-side rendering

### ♿ [Accessibility](./accessibility/README.md)
WCAG 2.1 AA compliance guidelines, testing procedures, and best practices

### 📱 [Responsive Design](./responsive/README.md)
Layout system, grid, breakpoints, and mobile-first design patterns

### 🎨 [Animation System](./animations/README.md)
Motion design standards, transition guidelines, and performance considerations

### 🚀 [Performance](./performance/README.md)
Optimization strategies, bundle analysis, and performance monitoring

### 🔄 [Migration Guide](./migration/README.md)
Step-by-step guides for migrating from existing implementations

### 🛠️ [Development](./development/README.md)
Contributing guidelines, build system, and development workflow

## Design Principles

### 1. Token-Driven Consistency
All visual properties are defined as semantic design tokens, ensuring consistency across platforms and enabling systematic updates.

### 2. Progressive Enhancement
The design system integrates gradually with existing codebases without breaking functionality, allowing incremental adoption.

### 3. Platform Agnostic
Components work seamlessly across React, Flask, and future frameworks while maintaining visual and functional consistency.

### 4. Accessibility First
WCAG 2.1 AA compliance is built into every component, with keyboard navigation, screen reader support, and proper contrast ratios.

### 5. Performance Optimized
Tree-shaking, critical CSS extraction, and optimized font loading ensure the design system enhances rather than degrades performance.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License - see [LICENSE](../LICENSE) for details.

## Support

- 📖 [Documentation Issues](https://github.com/ticketiq/design-system/issues)
- 💬 [Slack Channel](https://ticketiq.slack.com/channels/design-system)
- 📧 [Email Support](mailto:design-system@ticketiq.com)