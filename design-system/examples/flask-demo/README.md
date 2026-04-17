# Flask Demo Application

This is a demonstration Flask application showing how to integrate the TicketIQ Design System with Flask and Jinja2 templates.

## Features Demonstrated

- **Bootstrap 5 Integration**: Complete Bootstrap override system
- **Jinja2 Macros**: Reusable component macros for forms, layouts, and UI elements
- **Theme System**: Dark/light theme switching with localStorage persistence
- **Server-Side Rendering**: All components work without JavaScript
- **Accessibility**: WCAG 2.1 AA compliant components
- **Responsive Design**: Mobile-first responsive layout system

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run the Application

```bash
python app.py
```

### 3. Open in Browser

Navigate to `http://localhost:5000` to see the demo.

## Application Structure

```
flask-demo/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── static/
│   └── css/              # Design system CSS files
│       ├── design-system-variables.css
│       ├── ticketiq-flask.css
│       └── themes.css
└── templates/
    ├── base.html         # Base template with navigation
    ├── dashboard.html    # Dashboard with stats and tables
    ├── macros/           # Design system component macros
    │   ├── components.html
    │   ├── forms.html
    │   └── layout.html
    └── [other templates]
```

## Design System Components Used

### Layout Components
- `ds_container()` - Responsive container
- `ds_row()` - Bootstrap grid row
- `ds_col()` - Bootstrap grid column
- `ds_section()` - Page sections with titles

### UI Components
- `ds_card()` - Card containers
- `ds_button()` - Styled buttons with variants
- `ds_badge()` - Status badges
- `ds_alert()` - Alert messages
- `ds_navbar()` - Navigation bar

### Form Components
- `ds_input()` - Text inputs with labels
- `ds_select()` - Select dropdowns
- `ds_textarea()` - Multi-line text areas
- `ds_checkbox()` - Checkboxes
- `ds_radio_group()` - Radio button groups

## Theme System

The application supports automatic theme switching:

- **Dark Theme**: Default theme with dark backgrounds
- **Light Theme**: Light backgrounds for better readability
- **Auto Detection**: Respects system preference
- **Persistence**: Theme choice saved in localStorage

### Theme Toggle

```javascript
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}
```

## Component Examples

### Using Cards and Buttons

```jinja2
{% call ds_card(title='Statistics') %}
    <p>Total tickets: {{ stats.total }}</p>
    {{ ds_button('View Details', variant='primary') }}
{% endcall %}
```

### Creating Forms

```jinja2
{{ ds_input(
    name='subject',
    label='Ticket Subject',
    placeholder='Enter ticket subject',
    required=true
) }}

{{ ds_select(
    name='priority',
    label='Priority',
    options=[
        {'value': 'low', 'label': 'Low'},
        {'value': 'high', 'label': 'High'}
    ]
) }}
```

### Layout with Grid

```jinja2
{% call ds_container() %}
    {% call ds_row() %}
        {% call ds_col(md='6') %}
            <p>Left column</p>
        {% endcall %}
        {% call ds_col(md='6') %}
            <p>Right column</p>
        {% endcall %}
    {% endcall %}
{% endcall %}
```

## Customization

### Adding Custom Styles

Create additional CSS files and include them after the design system CSS:

```html
<link rel="stylesheet" href="{{ url_for('static', filename='css/ticketiq-flask.css') }}">
<link rel="stylesheet" href="{{ url_for('static', filename='css/custom.css') }}">
```

### Creating Custom Macros

Extend the design system by creating custom macros:

```jinja2
{# In templates/macros/custom.html #}
{% macro custom_component(title, content) %}
    {% call ds_card(title=title, class='custom-component') %}
        {{ content }}
    {% endcall %}
{% endmacro %}
```

## Production Deployment

### Optimizations for Production

1. **Minify CSS**: Use minified versions of CSS files
2. **CDN**: Serve static assets from CDN
3. **Caching**: Enable browser caching for static files
4. **Compression**: Enable gzip compression

### Security Considerations

1. **Secret Key**: Use a secure secret key for sessions
2. **CSRF Protection**: Enable CSRF protection for forms
3. **Content Security Policy**: Implement CSP headers
4. **HTTPS**: Always use HTTPS in production

## Integration with Existing Flask Apps

### Step 1: Copy Files

Copy the design system files to your existing Flask application:

```bash
cp -r static/css/* your-app/static/css/
cp -r templates/macros/* your-app/templates/macros/
```

### Step 2: Update Base Template

Include the design system CSS in your base template:

```html
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" href="{{ url_for('static', filename='css/design-system-variables.css') }}">
<link rel="stylesheet" href="{{ url_for('static', filename='css/ticketiq-flask.css') }}">
```

### Step 3: Import Macros

Import design system macros in your templates:

```jinja2
{% from 'macros/components.html' import ds_button, ds_card %}
{% from 'macros/layout.html' import ds_container, ds_row, ds_col %}
```

### Step 4: Replace Components

Gradually replace existing HTML with design system components:

```jinja2
<!-- Before -->
<div class="card">
    <div class="card-body">
        <h5>Title</h5>
        <button class="btn btn-primary">Action</button>
    </div>
</div>

<!-- After -->
{% call ds_card(title='Title') %}
    {{ ds_button('Action', variant='primary') }}
{% endcall %}
```

## Troubleshooting

### Common Issues

1. **Styles not loading**: Check file paths and ensure CSS files are copied
2. **Macros not found**: Verify macro files are in `templates/macros/`
3. **Theme not switching**: Check JavaScript console for errors
4. **Bootstrap conflicts**: Ensure design system CSS loads after Bootstrap

### Debug Mode

Enable Flask debug mode to see detailed error messages:

```python
app.run(debug=True)
```

## Further Reading

- [Flask Documentation](https://flask.palletsprojects.com/)
- [Jinja2 Template Documentation](https://jinja.palletsprojects.com/)
- [Bootstrap 5 Documentation](https://getbootstrap.com/docs/5.3/)
- [TicketIQ Design System Guide](../FLASK_INTEGRATION_GUIDE.md)