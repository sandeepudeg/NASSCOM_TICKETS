# Flask Integration Guide

The TicketIQ Design System provides comprehensive Flask integration through CSS overrides, Jinja2 macros, and utility classes that work seamlessly with existing Flask-Admin and Bootstrap components.

## Installation

### CDN Integration (Recommended)
```html
<!-- Include in your base template -->
<link rel="stylesheet" href="https://cdn.ticketiq.com/design-system/latest/ticketiq-design-system.css">
<script src="https://cdn.ticketiq.com/design-system/latest/ticketiq-design-system.js"></script>
```

### Local Installation
```bash
# Download and include in static files
wget https://cdn.ticketiq.com/design-system/latest/ticketiq-design-system.css -O static/css/design-system.css
wget https://cdn.ticketiq.com/design-system/latest/ticketiq-design-system.js -O static/js/design-system.js
```

### Package Installation
```bash
pip install ticketiq-design-system-flask
```

## Setup

### Base Template Setup
```html
<!-- templates/base.html -->
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}TicketIQ{% endblock %}</title>
    
    <!-- Design System CSS -->
    <link rel="stylesheet" href="{{ url_for('static', filename='css/design-system.css') }}">
    
    <!-- Custom CSS -->
    <link rel="stylesheet" href="{{ url_for('static', filename='css/app.css') }}">
    
    {% block head %}{% endblock %}
</head>
<body class="ds-theme-dark">
    <div class="ds-app">
        {% block content %}{% endblock %}
    </div>
    
    <!-- Design System JS -->
    <script src="{{ url_for('static', filename='js/design-system.js') }}"></script>
    
    <!-- Theme initialization -->
    <script>
        // Initialize theme system
        DesignSystem.initTheme({
            storageKey: 'ticketiq-theme',
            defaultTheme: 'dark'
        });
    </script>
    
    {% block scripts %}{% endblock %}
</body>
</html>
```

### Flask Application Configuration
```python
# app.py
from flask import Flask, render_template
from design_system_flask import DesignSystemFlask

app = Flask(__name__)

# Initialize design system
ds = DesignSystemFlask(app)

# Configure design system
app.config['DESIGN_SYSTEM'] = {
    'theme': 'dark',
    'cdn_url': 'https://cdn.ticketiq.com/design-system/latest',
    'include_js': True,
    'include_css': True
}

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
```

### Jinja2 Macros Setup
```python
# design_system_flask/__init__.py
from flask import Blueprint, current_app
from jinja2 import Environment

class DesignSystemFlask:
    def __init__(self, app=None):
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        # Register blueprint for static files
        bp = Blueprint('design_system', __name__, 
                      static_folder='static',
                      template_folder='templates')
        app.register_blueprint(bp)
        
        # Add template globals
        app.jinja_env.globals.update({
            'ds_theme': self.get_theme,
            'ds_tokens': self.get_tokens
        })
        
        # Load macros
        self.load_macros(app)
    
    def load_macros(self, app):
        # Make macros available globally
        with app.app_context():
            app.jinja_env.get_template('design_system/macros.html')
```

## Jinja2 Macros

### Button Macro
```html
<!-- templates/design_system/macros.html -->
{% macro ds_button(
    text, 
    variant='primary', 
    size='medium', 
    type='button',
    disabled=false,
    loading=false,
    full_width=false,
    icon='',
    icon_position='left',
    class='',
    id='',
    onclick='',
    **kwargs
) %}
<button 
    type="{{ type }}"
    class="ds-button ds-button--{{ variant }} ds-button--{{ size }}{% if full_width %} ds-button--full-width{% endif %}{% if loading %} ds-button--loading{% endif %} {{ class }}"
    {% if id %}id="{{ id }}"{% endif %}
    {% if disabled %}disabled{% endif %}
    {% if onclick %}onclick="{{ onclick }}"{% endif %}
    {% for key, value in kwargs.items() %}{{ key }}="{{ value }}"{% endfor %}
>
    {% if loading %}
        <span class="ds-button__spinner" aria-hidden="true"></span>
    {% endif %}
    
    {% if icon and icon_position == 'left' %}
        <span class="ds-button__icon ds-button__icon--left" aria-hidden="true">
            {{ icon|safe }}
        </span>
    {% endif %}
    
    <span class="ds-button__text">{{ text }}</span>
    
    {% if icon and icon_position == 'right' %}
        <span class="ds-button__icon ds-button__icon--right" aria-hidden="true">
            {{ icon|safe }}
        </span>
    {% endif %}
</button>
{% endmacro %}
```

### Input Macro
```html
{% macro ds_input(
    name,
    type='text',
    label='',
    placeholder='',
    value='',
    required=false,
    disabled=false,
    readonly=false,
    error='',
    help_text='',
    size='medium',
    full_width=true,
    class='',
    id='',
    **kwargs
) %}
<div class="ds-form-field{% if full_width %} ds-form-field--full-width{% endif %}">
    {% if label %}
        <label for="{{ id or name }}" class="ds-form-label{% if required %} ds-form-label--required{% endif %}">
            {{ label }}
        </label>
    {% endif %}
    
    <input
        type="{{ type }}"
        name="{{ name }}"
        {% if id %}id="{{ id }}"{% else %}id="{{ name }}"{% endif %}
        class="ds-input ds-input--{{ size }}{% if error %} ds-input--error{% endif %} {{ class }}"
        {% if placeholder %}placeholder="{{ placeholder }}"{% endif %}
        {% if value %}value="{{ value }}"{% endif %}
        {% if required %}required{% endif %}
        {% if disabled %}disabled{% endif %}
        {% if readonly %}readonly{% endif %}
        {% if error %}aria-invalid="true" aria-describedby="{{ name }}-error"{% endif %}
        {% if help_text %}aria-describedby="{{ name }}-help"{% endif %}
        {% for key, value in kwargs.items() %}{{ key }}="{{ value }}"{% endfor %}
    >
    
    {% if help_text %}
        <div id="{{ name }}-help" class="ds-form-help">{{ help_text }}</div>
    {% endif %}
    
    {% if error %}
        <div id="{{ name }}-error" class="ds-form-error" role="alert">{{ error }}</div>
    {% endif %}
</div>
{% endmacro %}
```

### Card Macro
```html
{% macro ds_card(title='', class='', id='') %}
<div class="ds-card {{ class }}"{% if id %} id="{{ id }}"{% endif %}>
    {% if title %}
        <div class="ds-card__header">
            <h3 class="ds-card__title">{{ title }}</h3>
        </div>
    {% endif %}
    <div class="ds-card__content">
        {{ caller() }}
    </div>
</div>
{% endmacro %}
```

### Alert Macro
```html
{% macro ds_alert(message, type='info', dismissible=false, class='', id='') %}
<div 
    class="ds-alert ds-alert--{{ type }}{% if dismissible %} ds-alert--dismissible{% endif %} {{ class }}"
    {% if id %}id="{{ id }}"{% endif %}
    role="alert"
>
    <div class="ds-alert__icon" aria-hidden="true">
        {% if type == 'success' %}✓{% endif %}
        {% if type == 'warning' %}⚠{% endif %}
        {% if type == 'danger' %}✕{% endif %}
        {% if type == 'info' %}ℹ{% endif %}
    </div>
    
    <div class="ds-alert__content">{{ message|safe }}</div>
    
    {% if dismissible %}
        <button class="ds-alert__dismiss" onclick="this.parentElement.remove()" aria-label="Dismiss alert">
            ✕
        </button>
    {% endif %}
</div>
{% endmacro %}
```

## Usage Examples

### Basic Form
```html
<!-- templates/contact.html -->
{% extends "base.html" %}
{% from 'design_system/macros.html' import ds_button, ds_input, ds_card, ds_alert %}

{% block content %}
<div class="container mx-auto px-4 py-8">
    {% if error %}
        {{ ds_alert(error, type='danger', dismissible=true) }}
    {% endif %}
    
    {% if success %}
        {{ ds_alert(success, type='success', dismissible=true) }}
    {% endif %}
    
    {% call ds_card(title="Contact Us") %}
        <form method="POST" class="space-y-4">
            {{ csrf_token() }}
            
            {{ ds_input('name', label='Full Name', placeholder='Enter your name', required=true) }}
            
            {{ ds_input('email', type='email', label='Email Address', placeholder='Enter your email', required=true) }}
            
            {{ ds_input('subject', label='Subject', placeholder='What is this about?', required=true) }}
            
            <div class="ds-form-field">
                <label for="message" class="ds-form-label ds-form-label--required">Message</label>
                <textarea 
                    name="message" 
                    id="message" 
                    class="ds-textarea ds-textarea--medium" 
                    rows="4" 
                    placeholder="Enter your message"
                    required
                ></textarea>
            </div>
            
            <div class="flex justify-end space-x-3">
                {{ ds_button('Cancel', variant='outline', onclick='history.back()') }}
                {{ ds_button('Send Message', variant='primary', type='submit') }}
            </div>
        </form>
    {% endcall %}
</div>
{% endblock %}
```

### Data Table
```html
<!-- templates/users.html -->
{% extends "base.html" %}
{% from 'design_system/macros.html' import ds_button, ds_card, ds_alert %}

{% block content %}
<div class="container mx-auto px-4 py-8">
    {% call ds_card(title="User Management") %}
        <div class="ds-table-container">
            <table class="ds-table">
                <thead class="ds-table__head">
                    <tr class="ds-table__row">
                        <th class="ds-table__header">Name</th>
                        <th class="ds-table__header">Email</th>
                        <th class="ds-table__header">Role</th>
                        <th class="ds-table__header">Status</th>
                        <th class="ds-table__header">Actions</th>
                    </tr>
                </thead>
                <tbody class="ds-table__body">
                    {% for user in users %}
                    <tr class="ds-table__row">
                        <td class="ds-table__cell">{{ user.name }}</td>
                        <td class="ds-table__cell">{{ user.email }}</td>
                        <td class="ds-table__cell">
                            <span class="ds-badge ds-badge--{{ 'primary' if user.role == 'admin' else 'secondary' }}">
                                {{ user.role|title }}
                            </span>
                        </td>
                        <td class="ds-table__cell">
                            <span class="ds-badge ds-badge--{{ 'success' if user.active else 'danger' }}">
                                {{ 'Active' if user.active else 'Inactive' }}
                            </span>
                        </td>
                        <td class="ds-table__cell">
                            <div class="flex space-x-2">
                                {{ ds_button('Edit', variant='ghost', size='small', 
                                    onclick='editUser(' + user.id|string + ')') }}
                                {{ ds_button('Delete', variant='ghost', size='small',
                                    onclick='deleteUser(' + user.id|string + ')') }}
                            </div>
                        </td>
                    </tr>
                    {% endfor %}
                </tbody>
            </table>
        </div>
    {% endcall %}
</div>
{% endblock %}
```

### Navigation Layout
```html
<!-- templates/layout/nav.html -->
{% from 'design_system/macros.html' import ds_button %}

<nav class="ds-nav">
    <div class="ds-nav__container">
        <div class="ds-nav__brand">
            <a href="{{ url_for('index') }}" class="ds-nav__logo">
                <img src="{{ url_for('static', filename='images/logo.svg') }}" alt="TicketIQ">
            </a>
        </div>
        
        <div class="ds-nav__menu">
            <a href="{{ url_for('dashboard') }}" class="ds-nav__link{% if request.endpoint == 'dashboard' %} ds-nav__link--active{% endif %}">
                Dashboard
            </a>
            <a href="{{ url_for('tickets') }}" class="ds-nav__link{% if request.endpoint == 'tickets' %} ds-nav__link--active{% endif %}">
                Tickets
            </a>
            <a href="{{ url_for('users') }}" class="ds-nav__link{% if request.endpoint == 'users' %} ds-nav__link--active{% endif %}">
                Users
            </a>
        </div>
        
        <div class="ds-nav__actions">
            {{ ds_button('Theme', variant='ghost', size='small', id='theme-toggle') }}
            
            <div class="ds-dropdown">
                {{ ds_button(current_user.name, variant='ghost', size='small', class='ds-dropdown__trigger') }}
                <div class="ds-dropdown__menu">
                    <a href="{{ url_for('profile') }}" class="ds-dropdown__item">Profile</a>
                    <a href="{{ url_for('settings') }}" class="ds-dropdown__item">Settings</a>
                    <hr class="ds-dropdown__divider">
                    <a href="{{ url_for('logout') }}" class="ds-dropdown__item">Logout</a>
                </div>
            </div>
        </div>
    </div>
</nav>
```

## Flask-Admin Integration

### Custom Admin Views
```python
# admin.py
from flask_admin import Admin, BaseView, expose
from flask_admin.contrib.sqla import ModelView
from design_system_flask import render_ds_template

class DesignSystemModelView(ModelView):
    """Custom ModelView with design system styling"""
    
    list_template = 'admin/ds_list.html'
    create_template = 'admin/ds_create.html'
    edit_template = 'admin/ds_edit.html'
    
    def __init__(self, model, session, **kwargs):
        super().__init__(model, session, **kwargs)
        
    def render(self, template, **kwargs):
        # Add design system context
        kwargs['ds_theme'] = 'dark'
        kwargs['ds_config'] = current_app.config.get('DESIGN_SYSTEM', {})
        return render_ds_template(template, **kwargs)

class UserAdmin(DesignSystemModelView):
    column_list = ['name', 'email', 'role', 'active']
    column_searchable_list = ['name', 'email']
    column_filters = ['role', 'active']
    
    form_columns = ['name', 'email', 'role', 'active']

# Initialize admin
admin = Admin(app, name='TicketIQ Admin', template_mode='bootstrap4')
admin.add_view(UserAdmin(User, db.session))
```

### Custom Admin Templates
```html
<!-- templates/admin/ds_list.html -->
{% extends 'admin/master.html' %}
{% from 'design_system/macros.html' import ds_button, ds_input, ds_alert %}

{% block head_css %}
    {{ super() }}
    <link rel="stylesheet" href="{{ url_for('static', filename='css/design-system.css') }}">
    <link rel="stylesheet" href="{{ url_for('static', filename='css/admin-overrides.css') }}">
{% endblock %}

{% block body %}
<div class="ds-admin-wrapper">
    <div class="ds-admin-header">
        <h1 class="ds-admin-title">{{ admin_view.name }}</h1>
        <div class="ds-admin-actions">
            {{ ds_button('Add New', variant='primary', onclick='location.href="' + url_for('.create_view') + '"') }}
        </div>
    </div>
    
    <div class="ds-admin-content">
        {% if admin_view.can_create %}
            <div class="ds-admin-toolbar">
                <form method="GET" class="ds-admin-search">
                    {{ ds_input('search', placeholder='Search...', value=search) }}
                    {{ ds_button('Search', variant='outline', type='submit') }}
                </form>
            </div>
        {% endif %}
        
        {{ super() }}
    </div>
</div>
{% endblock %}
```

## Bootstrap Override System

### CSS Override Structure
```css
/* static/css/bootstrap-overrides.css */

/* Button overrides */
.btn {
    @apply ds-button;
}

.btn-primary {
    @apply ds-button--primary;
}

.btn-secondary {
    @apply ds-button--secondary;
}

.btn-outline-primary {
    @apply ds-button--outline;
}

/* Form overrides */
.form-control {
    @apply ds-input;
}

.form-control:focus {
    @apply ds-input--focus;
}

.form-label {
    @apply ds-form-label;
}

/* Card overrides */
.card {
    @apply ds-card;
}

.card-header {
    @apply ds-card__header;
}

.card-body {
    @apply ds-card__content;
}

/* Alert overrides */
.alert {
    @apply ds-alert;
}

.alert-success {
    @apply ds-alert--success;
}

.alert-danger {
    @apply ds-alert--danger;
}

.alert-warning {
    @apply ds-alert--warning;
}

.alert-info {
    @apply ds-alert--info;
}

/* Table overrides */
.table {
    @apply ds-table;
}

.table thead th {
    @apply ds-table__header;
}

.table tbody td {
    @apply ds-table__cell;
}

/* Navigation overrides */
.navbar {
    @apply ds-nav;
}

.navbar-brand {
    @apply ds-nav__brand;
}

.nav-link {
    @apply ds-nav__link;
}

.nav-link.active {
    @apply ds-nav__link--active;
}
```

### Theme Integration
```python
# theme.py
from flask import current_app, request

class ThemeManager:
    def __init__(self, app=None):
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        app.jinja_env.globals['get_theme'] = self.get_theme
        app.jinja_env.globals['theme_class'] = self.get_theme_class
    
    def get_theme(self):
        # Check user preference, cookie, or default
        theme = request.cookies.get('theme', 'dark')
        return theme
    
    def get_theme_class(self):
        theme = self.get_theme()
        return f'ds-theme-{theme}'

# Usage in templates
<body class="{{ theme_class() }}">
```

## Utility Classes

### Layout Utilities
```css
/* Spacing utilities */
.ds-space-1 { margin: 0.25rem; }
.ds-space-2 { margin: 0.5rem; }
.ds-space-4 { margin: 1rem; }
.ds-space-6 { margin: 1.5rem; }

.ds-p-1 { padding: 0.25rem; }
.ds-p-2 { padding: 0.5rem; }
.ds-p-4 { padding: 1rem; }
.ds-p-6 { padding: 1.5rem; }

/* Flexbox utilities */
.ds-flex { display: flex; }
.ds-flex-col { flex-direction: column; }
.ds-justify-center { justify-content: center; }
.ds-items-center { align-items: center; }
.ds-space-x-2 > * + * { margin-left: 0.5rem; }
.ds-space-y-4 > * + * { margin-top: 1rem; }

/* Grid utilities */
.ds-grid { display: grid; }
.ds-grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.ds-grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.ds-gap-4 { gap: 1rem; }

/* Responsive utilities */
.ds-container { 
    max-width: 1200px; 
    margin: 0 auto; 
    padding: 0 1rem; 
}

@media (min-width: 768px) {
    .ds-container { padding: 0 2rem; }
}
```

### Text Utilities
```css
/* Typography utilities */
.ds-text-xs { font-size: 0.75rem; }
.ds-text-sm { font-size: 0.875rem; }
.ds-text-base { font-size: 1rem; }
.ds-text-lg { font-size: 1.125rem; }
.ds-text-xl { font-size: 1.25rem; }

.ds-font-light { font-weight: 300; }
.ds-font-normal { font-weight: 400; }
.ds-font-medium { font-weight: 500; }
.ds-font-semibold { font-weight: 600; }
.ds-font-bold { font-weight: 700; }

.ds-text-center { text-align: center; }
.ds-text-left { text-align: left; }
.ds-text-right { text-align: right; }

/* Color utilities */
.ds-text-primary { color: var(--color-primary); }
.ds-text-muted { color: var(--color-text-muted); }
.ds-text-success { color: var(--color-success); }
.ds-text-danger { color: var(--color-danger); }
```

## JavaScript Integration

### Theme Switching
```javascript
// static/js/theme.js
class ThemeManager {
    constructor(options = {}) {
        this.storageKey = options.storageKey || 'theme';
        this.defaultTheme = options.defaultTheme || 'dark';
        this.init();
    }
    
    init() {
        const savedTheme = localStorage.getItem(this.storageKey);
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const theme = savedTheme || this.defaultTheme || systemTheme;
        
        this.setTheme(theme);
        this.bindEvents();
    }
    
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        document.body.className = document.body.className.replace(/ds-theme-\w+/, '') + ` ds-theme-${theme}`;
        localStorage.setItem(this.storageKey, theme);
        
        // Update cookie for server-side access
        document.cookie = `theme=${theme}; path=/; max-age=31536000`;
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    }
    
    getTheme() {
        return document.documentElement.getAttribute('data-theme');
    }
    
    toggleTheme() {
        const currentTheme = this.getTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }
    
    bindEvents() {
        // Theme toggle button
        const toggleButton = document.getElementById('theme-toggle');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => this.toggleTheme());
        }
        
        // System theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(this.storageKey)) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
}

// Initialize theme manager
window.DesignSystem = window.DesignSystem || {};
window.DesignSystem.ThemeManager = ThemeManager;

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    window.DesignSystem.theme = new ThemeManager();
});
```

### Component Interactions
```javascript
// static/js/components.js
class ComponentManager {
    constructor() {
        this.init();
    }
    
    init() {
        this.initDropdowns();
        this.initModals();
        this.initToasts();
    }
    
    initDropdowns() {
        document.querySelectorAll('.ds-dropdown').forEach(dropdown => {
            const trigger = dropdown.querySelector('.ds-dropdown__trigger');
            const menu = dropdown.querySelector('.ds-dropdown__menu');
            
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                dropdown.classList.toggle('ds-dropdown--open');
            });
            
            // Close on outside click
            document.addEventListener('click', (e) => {
                if (!dropdown.contains(e.target)) {
                    dropdown.classList.remove('ds-dropdown--open');
                }
            });
        });
    }
    
    initModals() {
        // Modal functionality
        window.openModal = (modalId) => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('ds-modal--open');
                document.body.classList.add('ds-modal-open');
            }
        };
        
        window.closeModal = (modalId) => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('ds-modal--open');
                document.body.classList.remove('ds-modal-open');
            }
        };
    }
    
    initToasts() {
        window.showToast = (message, type = 'info', duration = 5000) => {
            const toast = document.createElement('div');
            toast.className = `ds-toast ds-toast--${type}`;
            toast.innerHTML = `
                <div class="ds-toast__content">${message}</div>
                <button class="ds-toast__close" onclick="this.parentElement.remove()">×</button>
            `;
            
            document.body.appendChild(toast);
            
            // Auto-remove after duration
            if (duration > 0) {
                setTimeout(() => {
                    if (toast.parentElement) {
                        toast.remove();
                    }
                }, duration);
            }
        };
    }
}

// Initialize components
document.addEventListener('DOMContentLoaded', () => {
    new ComponentManager();
});
```

## Performance Optimization

### CSS Optimization
```python
# build.py
from flask_assets import Environment, Bundle

def setup_assets(app):
    assets = Environment(app)
    
    # CSS bundle with design system
    css_bundle = Bundle(
        'css/design-system.css',
        'css/bootstrap-overrides.css',
        'css/app.css',
        filters='cssmin',
        output='dist/app.min.css'
    )
    
    # JS bundle
    js_bundle = Bundle(
        'js/design-system.js',
        'js/theme.js',
        'js/components.js',
        'js/app.js',
        filters='jsmin',
        output='dist/app.min.js'
    )
    
    assets.register('css_all', css_bundle)
    assets.register('js_all', js_bundle)
```

### Critical CSS
```html
<!-- Inline critical CSS -->
<style>
    /* Critical design system styles */
    .ds-button { /* essential button styles */ }
    .ds-nav { /* essential navigation styles */ }
    .ds-card { /* essential card styles */ }
</style>

<!-- Load full CSS asynchronously -->
<link rel="preload" href="{{ url_for('static', filename='dist/app.min.css') }}" as="style" onload="this.onload=null;this.rel='stylesheet'">
```

### Lazy Loading
```html
<!-- Lazy load non-critical components -->
<script>
    // Load modal component only when needed
    function loadModal() {
        if (!window.DesignSystem.Modal) {
            import('/static/js/modal.js').then(module => {
                window.DesignSystem.Modal = module.default;
            });
        }
    }
</script>
```