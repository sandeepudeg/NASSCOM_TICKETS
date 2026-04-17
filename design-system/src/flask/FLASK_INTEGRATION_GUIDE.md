# Flask Integration Guide

This guide explains how to integrate the TicketIQ Design System into your Flask application.

## Quick Start

### 1. Include CSS Files

Add the design system CSS files to your Flask application's static directory and include them in your base template:

```html
<!-- In your base template (e.g., base.html) -->
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
    <!-- Bootstrap CSS (required) -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- TicketIQ Design System CSS -->
    <link rel="stylesheet" href="{{ url_for('static', filename='css/design-system-variables.css') }}">
    <link rel="stylesheet" href="{{ url_for('static', filename='css/ticketiq-flask.css') }}">
</head>
```

### 2. Copy Static Files

Copy the CSS files from `design-system/src/flask/static/css/` to your Flask application's `static/css/` directory:

```
your-flask-app/
├── static/
│   └── css/
│       ├── design-system-variables.css
│       ├── ticketiq-flask.css
│       └── themes.css
└── templates/
```

### 3. Copy Template Macros

Copy the macro files from `design-system/src/flask/macros/` to your Flask application's templates directory:

```
your-flask-app/
└── templates/
    ├── macros/
    │   ├── components.html
    │   ├── forms.html
    │   └── layout.html
    └── your-templates.html
```

### 4. Use Components in Templates

Import and use design system components in your templates:

```jinja2
{% from 'macros/components.html' import ds_button, ds_card, ds_alert %}
{% from 'macros/layout.html' import ds_container, ds_row, ds_col %}

{% call ds_container() %}
    {% call ds_row() %}
        {% call ds_col(md='6') %}
            {% call ds_card(title='Welcome') %}
                <p>This is a design system card component.</p>
                {{ ds_button('Get Started', variant='primary') }}
            {% endcall %}
        {% endcall %}
    {% endcall %}
{% endcall %}
```

## Component Reference

### Buttons

```jinja2
{{ ds_button('Primary Button', variant='primary') }}
{{ ds_button('Secondary Button', variant='secondary') }}
{{ ds_button('Outline Button', variant='outline') }}
{{ ds_button('Small Button', variant='primary', size='small') }}
{{ ds_button('Large Button', variant='primary', size='large') }}
```

### Form Components

```jinja2
{{ ds_input(
    name='email',
    type='email',
    label='Email Address',
    placeholder='Enter your email',
    required=true
) }}

{{ ds_select(
    name='department',
    label='Department',
    options=[
        {'value': 'eng', 'label': 'Engineering'},
        {'value': 'sales', 'label': 'Sales'}
    ],
    required=true
) }}

{{ ds_textarea(
    name='message',
    label='Message',
    placeholder='Enter your message...',
    rows=4
) }}
```

### Layout Components

```jinja2
{% call ds_container() %}
    {% call ds_row() %}
        {% call ds_col(md='4') %}
            <p>Column 1</p>
        {% endcall %}
        {% call ds_col(md='8') %}
            <p>Column 2</p>
        {% endcall %}
    {% endcall %}
{% endcall %}

{% call ds_flex(justify='between', align='center') %}
    <h1>Title</h1>
    {{ ds_button('Action', variant='primary') }}
{% endcall %}
```

### Cards and Alerts

```jinja2
{% call ds_card(title='Card Title') %}
    <p>Card content goes here.</p>
{% endcall %}

{{ ds_alert('Success message!', type='success') }}
{{ ds_alert('Warning message!', type='warning', dismissible=true) }}
{{ ds_alert('Error message!', type='danger') }}
```

## Theme System

### Theme Switching

The design system supports automatic theme switching. Include the theme toggle script:

```html
<script>
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Load saved theme
const savedTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);
</script>
```

### Theme Toggle Button

Add a theme toggle button to your navigation:

```jinja2
<button onclick="toggleTheme()" class="theme-toggle" aria-label="Toggle theme">
    🌙 / ☀️
</button>
```

## Bootstrap Integration

The design system provides comprehensive Bootstrap 5 overrides:

### Supported Bootstrap Components

- **Buttons**: All Bootstrap button variants with design system styling
- **Forms**: Form controls, selects, checkboxes, radios with dark theme support
- **Cards**: Enhanced card components with design system colors
- **Alerts**: Alert components with design system color palette
- **Navigation**: Navbar components with dark theme styling
- **Tables**: Table components with design system colors
- **Modals**: Modal components with design system styling
- **Badges**: Badge components with design system colors

### Custom Utility Classes

The design system adds custom utility classes:

```html
<!-- Background utilities -->
<div class="bg-surface">Surface background</div>
<div class="bg-secondary-surface">Secondary surface</div>

<!-- Text utilities -->
<p class="text-primary-custom">Primary text</p>
<p class="text-muted-custom">Muted text</p>

<!-- Spacing utilities -->
<div class="p-xs">Extra small padding</div>
<div class="m-lg">Large margin</div>

<!-- Shadow utilities -->
<div class="shadow-md">Medium shadow</div>
<div class="hover-lift">Hover lift effect</div>
```

## Accessibility

The design system is built with accessibility in mind:

- **WCAG 2.1 AA Compliance**: All components meet accessibility standards
- **Keyboard Navigation**: Full keyboard support for interactive elements
- **Screen Reader Support**: Proper ARIA labels and semantic markup
- **Focus Management**: Visible focus indicators and logical tab order
- **High Contrast Support**: Automatic high contrast mode detection
- **Reduced Motion**: Respects user's motion preferences

## Performance

### Optimization Tips

1. **Use CDN for Bootstrap**: Load Bootstrap from CDN for better caching
2. **Minify CSS**: Use minified versions in production
3. **Critical CSS**: Extract above-the-fold CSS for faster loading
4. **Lazy Loading**: Load non-critical components asynchronously

### Bundle Size

- **Design System Variables**: ~8KB
- **Flask Integration CSS**: ~15KB
- **Theme System**: ~3KB
- **Total**: ~26KB (before gzip)

## Migration from Existing Styles

### Step-by-Step Migration

1. **Audit Current Styles**: Identify existing components and styles
2. **Replace Components**: Gradually replace with design system components
3. **Update Templates**: Use design system macros instead of custom HTML
4. **Test Accessibility**: Ensure all components remain accessible
5. **Optimize Performance**: Remove unused CSS and optimize loading

### Common Migration Patterns

```jinja2
<!-- Before: Custom HTML -->
<div class="custom-card">
    <h3>Title</h3>
    <p>Content</p>
    <button class="custom-btn">Action</button>
</div>

<!-- After: Design System Components -->
{% call ds_card(title='Title') %}
    <p>Content</p>
    {{ ds_button('Action', variant='primary') }}
{% endcall %}
```

## Troubleshooting

### Common Issues

1. **Styles Not Loading**: Check file paths and ensure CSS files are copied correctly
2. **Theme Not Switching**: Verify JavaScript is loaded and `data-theme` attribute is set
3. **Bootstrap Conflicts**: Ensure design system CSS is loaded after Bootstrap
4. **Macro Errors**: Check macro import paths and parameter names

### Debug Mode

Enable debug mode to see component structure:

```html
<style>
[data-debug="true"] * {
    outline: 1px solid red !important;
}
</style>

<html data-debug="true">
```

## Examples

See the example templates in `design-system/src/flask/templates/` for complete implementation examples:

- `base.html`: Base template with navigation and theme support
- `dashboard.html`: Dashboard with cards, tables, and statistics
- `form-example.html`: Comprehensive form component examples

## Support

For questions and support:

1. Check the component documentation in macro files
2. Review example templates for usage patterns
3. Refer to the main design system documentation
4. Test components in isolation to identify issues