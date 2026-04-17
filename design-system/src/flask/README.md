# Flask Integration Layer

This directory contains the Flask integration layer for the TicketIQ Design System, providing Bootstrap 5 overrides, Jinja2 macros, and utility classes for server-side rendering.

## Structure

- `bootstrap-overrides/` - CSS overrides for Bootstrap 5 components
- `macros/` - Jinja2 macros for design system components
- `utilities/` - Utility classes for rapid development
- `templates/` - Example templates and layouts
- `static/` - Static assets and compiled CSS

## Usage

### 1. Include CSS in your Flask application

```html
<!-- In your base template -->
<link rel="stylesheet" href="{{ url_for('static', filename='css/bootstrap.min.css') }}">
<link rel="stylesheet" href="{{ url_for('static', filename='css/ticketiq-flask.css') }}">
```

### 2. Import macros in your templates

```jinja2
{% from 'macros/components.html' import ds_button, ds_card, ds_alert %}
```

### 3. Use design system components

```jinja2
{{ ds_button('Save Changes', variant='primary', size='medium') }}
{{ ds_card('Card Title', class='mb-4') }}
{{ ds_alert('Success message', type='success') }}
```

## Features

- Bootstrap 5 compatibility with design system theming
- Server-side rendering support
- Accessibility-first components
- Consistent with React implementation
- Utility classes for rapid development