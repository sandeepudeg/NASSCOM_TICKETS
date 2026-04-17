# Migration Guide

This guide provides step-by-step instructions for migrating from existing implementations to the TicketIQ Unified Design System. The migration approach is designed to be gradual and non-breaking, allowing teams to adopt the design system incrementally.

## Migration Overview

### Current State Analysis
Before starting migration, assess your current implementation:

#### React Frontend (Ant Design)
- **Components**: Button, Input, Card, Table, Modal, Form components
- **Styling**: Ant Design default theme with custom overrides
- **Bundle size**: ~500KB (Ant Design + custom CSS)
- **Accessibility**: Basic Ant Design accessibility features

#### Flask Admin (Bootstrap 5)
- **Components**: Bootstrap components with custom styling
- **Templates**: Jinja2 templates with Bootstrap classes
- **Styling**: Bootstrap CSS with custom overrides
- **Accessibility**: Basic Bootstrap accessibility features

#### Demo Page
- **Styling**: Custom CSS with sophisticated dark theme
- **Components**: Custom-built components
- **Design language**: Modern, professional aesthetic
- **Performance**: Optimized custom implementation

### Migration Goals
- **Unified experience** across all interfaces
- **Improved accessibility** with WCAG 2.1 AA compliance
- **Better performance** through optimized design system
- **Maintainability** with centralized design tokens
- **Developer experience** with comprehensive documentation

## Migration Strategies

### Strategy 1: Gradual Component Migration (Recommended)
Migrate components incrementally while maintaining existing functionality.

**Timeline**: 4-6 weeks
**Risk**: Low
**Effort**: Medium

### Strategy 2: Page-by-Page Migration
Migrate entire pages or sections at once.

**Timeline**: 6-8 weeks
**Risk**: Medium
**Effort**: High

### Strategy 3: Parallel Implementation
Build new interfaces alongside existing ones.

**Timeline**: 8-12 weeks
**Risk**: Low
**Effort**: High

## React Migration

### Phase 1: Setup and Foundation (Week 1)

#### Install Design System
```bash
# Install the design system package
npm install @ticketiq/design-system

# Install peer dependencies if not already present
npm install react react-dom @types/react @types/react-dom
```

#### Update Package.json
```json
{
  "dependencies": {
    "@ticketiq/design-system": "^1.0.0",
    "antd": "^5.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0"
  }
}
```

#### Setup Theme Provider
```jsx
// src/App.tsx - Before
import { ConfigProvider } from 'antd';
import { BrowserRouter } from 'react-router-dom';

function App() {
  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#1890ff' } }}>
      <BrowserRouter>
        {/* App content */}
      </BrowserRouter>
    </ConfigProvider>
  );
}

// src/App.tsx - After
import { ConfigProvider } from 'antd';
import { ThemeProvider, getAntdTheme } from '@ticketiq/design-system';
import { BrowserRouter } from 'react-router-dom';
import '@ticketiq/design-system/dist/styles.css';

function App() {
  const antdTheme = getAntdTheme('dark');
  
  return (
    <ThemeProvider theme="dark">
      <ConfigProvider theme={antdTheme}>
        <BrowserRouter>
          {/* App content */}
        </BrowserRouter>
      </ConfigProvider>
    </ThemeProvider>
  );
}
```

#### Update CSS Imports
```css
/* src/index.css - Before */
@import 'antd/dist/reset.css';
@import './custom-styles.css';

/* src/index.css - After */
@import '@ticketiq/design-system/dist/styles.css';
@import 'antd/dist/reset.css';
@import './custom-styles.css';
```

### Phase 2: Component Migration (Weeks 2-4)

#### Button Migration
```jsx
// Before - Ant Design Button
import { Button } from 'antd';

function LoginForm() {
  return (
    <div>
      <Button type="primary" size="large">
        Sign In
      </Button>
      <Button type="default">
        Cancel
      </Button>
    </div>
  );
}

// After - Design System Button
import { Button } from '@ticketiq/design-system';
// Keep Ant Design for non-migrated components
import { Button as AntButton } from 'antd';

function LoginForm() {
  return (
    <div>
      <Button variant="primary" size="large">
        Sign In
      </Button>
      <Button variant="outline">
        Cancel
      </Button>
    </div>
  );
}
```

#### Input Migration
```jsx
// Before - Ant Design Input
import { Input, Form } from 'antd';

function ContactForm() {
  return (
    <Form>
      <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
        <Input placeholder="Enter your email" />
      </Form.Item>
      <Form.Item label="Message" name="message" rules={[{ required: true }]}>
        <Input.TextArea rows={4} placeholder="Enter your message" />
      </Form.Item>
    </Form>
  );
}

// After - Design System Input
import { Input, Stack } from '@ticketiq/design-system';
import { useForm } from '@ticketiq/design-system/hooks';

function ContactForm() {
  const { values, errors, handleChange, handleSubmit } = useForm({
    initialValues: { email: '', message: '' },
    validationSchema: {
      email: { required: true, email: true },
      message: { required: true }
    }
  });
  
  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing="4">
        <Input
          name="email"
          label="Email"
          type="email"
          placeholder="Enter your email"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
          required
        />
        <Input
          name="message"
          label="Message"
          as="textarea"
          rows={4}
          placeholder="Enter your message"
          value={values.message}
          onChange={handleChange}
          error={errors.message}
          required
        />
      </Stack>
    </form>
  );
}
```

#### Card Migration
```jsx
// Before - Ant Design Card
import { Card } from 'antd';

function UserCard({ user }) {
  return (
    <Card 
      title={user.name}
      extra={<Button type="link">Edit</Button>}
      actions={[
        <Button key="view">View</Button>,
        <Button key="delete" danger>Delete</Button>
      ]}
    >
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
    </Card>
  );
}

// After - Design System Card
import { Card, Button, Stack } from '@ticketiq/design-system';

function UserCard({ user }) {
  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{user.name}</h3>
        <Button variant="link" size="small">Edit</Button>
      </div>
      
      <Stack spacing="2">
        <p>Email: {user.email}</p>
        <p>Role: {user.role}</p>
      </Stack>
      
      <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-200">
        <Button variant="outline" size="small">View</Button>
        <Button variant="danger" size="small">Delete</Button>
      </div>
    </Card>
  );
}
```

### Phase 3: Layout and Navigation (Week 5)

#### Navigation Migration
```jsx
// Before - Ant Design Layout
import { Layout, Menu } from 'antd';
const { Header, Sider, Content } = Layout;

function AppLayout({ children }) {
  return (
    <Layout>
      <Header>
        <div className="logo" />
        <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['1']}>
          <Menu.Item key="1">Dashboard</Menu.Item>
          <Menu.Item key="2">Users</Menu.Item>
          <Menu.Item key="3">Settings</Menu.Item>
        </Menu>
      </Header>
      <Layout>
        <Sider>
          <Menu mode="inline" defaultSelectedKeys={['1']}>
            <Menu.Item key="1">Overview</Menu.Item>
            <Menu.Item key="2">Analytics</Menu.Item>
          </Menu>
        </Sider>
        <Content>{children}</Content>
      </Layout>
    </Layout>
  );
}

// After - Design System Layout
import { Header, Sidebar, Container } from '@ticketiq/design-system';

function AppLayout({ children }) {
  return (
    <div className="ds-app-layout">
      <Header>
        <Header.Brand>
          <img src="/logo.svg" alt="TicketIQ" />
        </Header.Brand>
        <Header.Nav>
          <Header.Link href="/dashboard" active>Dashboard</Header.Link>
          <Header.Link href="/users">Users</Header.Link>
          <Header.Link href="/settings">Settings</Header.Link>
        </Header.Nav>
      </Header>
      
      <div className="ds-app-body">
        <Sidebar>
          <Sidebar.Nav>
            <Sidebar.Link href="/dashboard" active>Overview</Sidebar.Link>
            <Sidebar.Link href="/analytics">Analytics</Sidebar.Link>
          </Sidebar.Nav>
        </Sidebar>
        
        <main className="ds-main-content">
          <Container>
            {children}
          </Container>
        </main>
      </div>
    </div>
  );
}
```

### Phase 4: Advanced Components (Week 6)

#### Table Migration
```jsx
// Before - Ant Design Table
import { Table, Button, Space } from 'antd';

const columns = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Email', dataIndex: 'email', key: 'email' },
  {
    title: 'Action',
    key: 'action',
    render: (_, record) => (
      <Space size="middle">
        <Button type="link">Edit</Button>
        <Button type="link" danger>Delete</Button>
      </Space>
    ),
  },
];

function UserTable({ users }) {
  return <Table columns={columns} dataSource={users} />;
}

// After - Design System Table
import { Table, Button } from '@ticketiq/design-system';

function UserTable({ users }) {
  const columns = [
    { key: 'name', header: 'Name', accessor: 'name' },
    { key: 'email', header: 'Email', accessor: 'email' },
    {
      key: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="small">Edit</Button>
          <Button variant="ghost" size="small">Delete</Button>
        </div>
      )
    }
  ];
  
  return <Table columns={columns} data={users} />;
}
```

## Flask Migration

### Phase 1: CSS Integration (Week 1)

#### Update Base Template
```html
<!-- templates/base.html - Before -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}TicketIQ Admin{% endblock %}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="{{ url_for('static', filename='css/admin.css') }}" rel="stylesheet">
</head>
<body>
    {% block content %}{% endblock %}
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>

<!-- templates/base.html - After -->
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}TicketIQ Admin{% endblock %}</title>
    
    <!-- Design System CSS -->
    <link href="https://cdn.ticketiq.com/design-system/latest/ticketiq-design-system.css" rel="stylesheet">
    
    <!-- Bootstrap (for compatibility during migration) -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Custom overrides -->
    <link href="{{ url_for('static', filename='css/bootstrap-overrides.css') }}" rel="stylesheet">
    <link href="{{ url_for('static', filename='css/admin.css') }}" rel="stylesheet">
</head>
<body class="ds-theme-dark">
    <div class="ds-app">
        {% block content %}{% endblock %}
    </div>
    
    <!-- Design System JS -->
    <script src="https://cdn.ticketiq.com/design-system/latest/ticketiq-design-system.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    
    <script>
        // Initialize design system
        DesignSystem.initTheme({ defaultTheme: 'dark' });
    </script>
</body>
</html>
```

#### Create Bootstrap Overrides
```css
/* static/css/bootstrap-overrides.css */

/* Button overrides to use design system styles */
.btn {
    @apply ds-button;
    border: none;
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

.btn-sm {
    @apply ds-button--small;
}

.btn-lg {
    @apply ds-button--large;
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

.form-text {
    @apply ds-form-help;
}

.invalid-feedback {
    @apply ds-form-error;
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

.card-title {
    @apply ds-card__title;
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

### Phase 2: Macro Integration (Week 2)

#### Install Design System Macros
```python
# requirements.txt
flask-design-system>=1.0.0

# app.py
from flask import Flask
from flask_design_system import DesignSystemFlask

app = Flask(__name__)
ds = DesignSystemFlask(app)
```

#### Create Macro Templates
```html
<!-- templates/design_system/macros.html -->
{% macro ds_button(text, variant='primary', size='medium', **kwargs) %}
<button 
    class="ds-button ds-button--{{ variant }} ds-button--{{ size }} {{ kwargs.get('class', '') }}"
    type="{{ kwargs.get('type', 'button') }}"
    {% if kwargs.get('disabled') %}disabled{% endif %}
    {% if kwargs.get('id') %}id="{{ kwargs.id }}"{% endif %}
    {% if kwargs.get('onclick') %}onclick="{{ kwargs.onclick }}"{% endif %}
>
    {{ text }}
</button>
{% endmacro %}

{% macro ds_input(name, label='', type='text', **kwargs) %}
<div class="ds-form-field">
    {% if label %}
        <label for="{{ name }}" class="ds-form-label">{{ label }}</label>
    {% endif %}
    <input 
        type="{{ type }}"
        name="{{ name }}"
        id="{{ name }}"
        class="ds-input {{ kwargs.get('class', '') }}"
        {% if kwargs.get('placeholder') %}placeholder="{{ kwargs.placeholder }}"{% endif %}
        {% if kwargs.get('value') %}value="{{ kwargs.value }}"{% endif %}
        {% if kwargs.get('required') %}required{% endif %}
        {% if kwargs.get('disabled') %}disabled{% endif %}
    >
    {% if kwargs.get('help_text') %}
        <div class="ds-form-help">{{ kwargs.help_text }}</div>
    {% endif %}
</div>
{% endmacro %}
```

### Phase 3: Template Migration (Weeks 3-4)

#### Form Migration
```html
<!-- templates/user_form.html - Before -->
{% extends "base.html" %}

{% block content %}
<div class="container mt-4">
    <div class="card">
        <div class="card-header">
            <h3>{{ 'Edit User' if user else 'Add User' }}</h3>
        </div>
        <div class="card-body">
            <form method="POST">
                {{ csrf_token() }}
                
                <div class="mb-3">
                    <label for="name" class="form-label">Name</label>
                    <input type="text" class="form-control" id="name" name="name" 
                           value="{{ user.name if user else '' }}" required>
                </div>
                
                <div class="mb-3">
                    <label for="email" class="form-label">Email</label>
                    <input type="email" class="form-control" id="email" name="email" 
                           value="{{ user.email if user else '' }}" required>
                </div>
                
                <div class="mb-3">
                    <label for="role" class="form-label">Role</label>
                    <select class="form-select" id="role" name="role">
                        <option value="user" {{ 'selected' if user and user.role == 'user' else '' }}>User</option>
                        <option value="admin" {{ 'selected' if user and user.role == 'admin' else '' }}>Admin</option>
                    </select>
                </div>
                
                <div class="d-flex justify-content-end">
                    <button type="button" class="btn btn-secondary me-2" onclick="history.back()">Cancel</button>
                    <button type="submit" class="btn btn-primary">{{ 'Update' if user else 'Create' }}</button>
                </div>
            </form>
        </div>
    </div>
</div>
{% endblock %}

<!-- templates/user_form.html - After -->
{% extends "base.html" %}
{% from 'design_system/macros.html' import ds_button, ds_input, ds_select, ds_card %}

{% block content %}
<div class="ds-container ds-py-8">
    {% call ds_card(title='Edit User' if user else 'Add User') %}
        <form method="POST" class="ds-space-y-4">
            {{ csrf_token() }}
            
            {{ ds_input('name', 
                label='Name', 
                value=user.name if user else '', 
                required=true,
                placeholder='Enter full name'
            ) }}
            
            {{ ds_input('email', 
                type='email',
                label='Email', 
                value=user.email if user else '', 
                required=true,
                placeholder='Enter email address'
            ) }}
            
            {{ ds_select('role',
                label='Role',
                options=[
                    {'value': 'user', 'label': 'User', 'selected': user and user.role == 'user'},
                    {'value': 'admin', 'label': 'Admin', 'selected': user and user.role == 'admin'}
                ]
            ) }}
            
            <div class="ds-flex ds-justify-end ds-space-x-3 ds-pt-4">
                {{ ds_button('Cancel', variant='outline', onclick='history.back()') }}
                {{ ds_button('Update' if user else 'Create', variant='primary', type='submit') }}
            </div>
        </form>
    {% endcall %}
</div>
{% endblock %}
```

#### List View Migration
```html
<!-- templates/user_list.html - Before -->
{% extends "base.html" %}

{% block content %}
<div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>Users</h2>
        <a href="{{ url_for('add_user') }}" class="btn btn-primary">Add User</a>
    </div>
    
    <div class="card">
        <div class="card-body">
            <table class="table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {% for user in users %}
                    <tr>
                        <td>{{ user.name }}</td>
                        <td>{{ user.email }}</td>
                        <td>
                            <span class="badge bg-{{ 'primary' if user.role == 'admin' else 'secondary' }}">
                                {{ user.role|title }}
                            </span>
                        </td>
                        <td>
                            <a href="{{ url_for('edit_user', id=user.id) }}" class="btn btn-sm btn-outline-primary">Edit</a>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteUser({{ user.id }})">Delete</button>
                        </td>
                    </tr>
                    {% endfor %}
                </tbody>
            </table>
        </div>
    </div>
</div>
{% endblock %}

<!-- templates/user_list.html - After -->
{% extends "base.html" %}
{% from 'design_system/macros.html' import ds_button, ds_card, ds_badge %}

{% block content %}
<div class="ds-container ds-py-8">
    <div class="ds-flex ds-justify-between ds-items-center ds-mb-6">
        <h2 class="ds-text-2xl ds-font-semibold">Users</h2>
        {{ ds_button('Add User', variant='primary', onclick='location.href="' + url_for('add_user') + '"') }}
    </div>
    
    {% call ds_card() %}
        <div class="ds-table-container">
            <table class="ds-table">
                <thead class="ds-table__head">
                    <tr class="ds-table__row">
                        <th class="ds-table__header">Name</th>
                        <th class="ds-table__header">Email</th>
                        <th class="ds-table__header">Role</th>
                        <th class="ds-table__header">Actions</th>
                    </tr>
                </thead>
                <tbody class="ds-table__body">
                    {% for user in users %}
                    <tr class="ds-table__row">
                        <td class="ds-table__cell">{{ user.name }}</td>
                        <td class="ds-table__cell">{{ user.email }}</td>
                        <td class="ds-table__cell">
                            {{ ds_badge(user.role|title, 
                                variant='primary' if user.role == 'admin' else 'secondary'
                            ) }}
                        </td>
                        <td class="ds-table__cell">
                            <div class="ds-flex ds-space-x-2">
                                {{ ds_button('Edit', 
                                    variant='ghost', 
                                    size='small',
                                    onclick='location.href="' + url_for('edit_user', id=user.id) + '"'
                                ) }}
                                {{ ds_button('Delete', 
                                    variant='ghost', 
                                    size='small',
                                    onclick='deleteUser(' + user.id|string + ')'
                                ) }}
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

### Phase 4: Flask-Admin Integration (Week 5)

#### Custom Admin Views
```python
# admin.py - Before
from flask_admin import Admin, BaseView
from flask_admin.contrib.sqla import ModelView

class UserAdmin(ModelView):
    column_list = ['name', 'email', 'role']
    form_columns = ['name', 'email', 'role']

admin = Admin(app, name='TicketIQ Admin')
admin.add_view(UserAdmin(User, db.session))

# admin.py - After
from flask_admin import Admin, BaseView
from flask_admin.contrib.sqla import ModelView
from design_system_flask import DesignSystemModelView

class UserAdmin(DesignSystemModelView):
    list_template = 'admin/ds_list.html'
    create_template = 'admin/ds_create.html'
    edit_template = 'admin/ds_edit.html'
    
    column_list = ['name', 'email', 'role']
    form_columns = ['name', 'email', 'role']
    
    # Design system specific configurations
    ds_config = {
        'theme': 'dark',
        'card_layout': True,
        'enhanced_forms': True
    }

admin = Admin(app, name='TicketIQ Admin', template_mode='bootstrap4')
admin.add_view(UserAdmin(User, db.session))
```

## Migration Checklist

### Pre-Migration
- [ ] Audit current components and their usage
- [ ] Identify custom styling that needs to be preserved
- [ ] Set up development environment with design system
- [ ] Create migration timeline and assign responsibilities
- [ ] Set up testing environment for both old and new implementations

### During Migration
- [ ] Install design system packages
- [ ] Set up theme providers and configuration
- [ ] Migrate components incrementally
- [ ] Update templates and styling
- [ ] Test accessibility improvements
- [ ] Validate visual consistency
- [ ] Update documentation and guides

### Post-Migration
- [ ] Remove old dependencies (Ant Design, Bootstrap overrides)
- [ ] Clean up unused CSS and JavaScript
- [ ] Update build processes and CI/CD
- [ ] Train team on new design system
- [ ] Monitor performance improvements
- [ ] Gather feedback and iterate

## Testing Strategy

### Visual Regression Testing
```javascript
// Visual testing with Chromatic
import { chromatic } from '@storybook/addon-chromatic';

// Test before and after migration
export const BeforeMigration = () => <AntButton type="primary">Button</AntButton>;
export const AfterMigration = () => <DSButton variant="primary">Button</DSButton>;
```

### Accessibility Testing
```bash
# Run accessibility audits
npm run test:a11y

# Compare accessibility scores
lighthouse --only-categories=accessibility http://localhost:3000/before
lighthouse --only-categories=accessibility http://localhost:3000/after
```

### Performance Testing
```bash
# Bundle size analysis
npm run analyze

# Performance comparison
lighthouse --only-categories=performance http://localhost:3000/before
lighthouse --only-categories=performance http://localhost:3000/after
```

## Rollback Plan

### React Rollback
```jsx
// Keep both implementations during migration
import { Button as DSButton } from '@ticketiq/design-system';
import { Button as AntButton } from 'antd';

function MigrationButton({ useDesignSystem = true, ...props }) {
  if (useDesignSystem) {
    return <DSButton variant="primary" {...props} />;
  }
  return <AntButton type="primary" {...props} />;
}

// Feature flag for rollback
const USE_DESIGN_SYSTEM = process.env.REACT_APP_USE_DESIGN_SYSTEM === 'true';
```

### Flask Rollback
```html
<!-- Conditional CSS loading -->
{% if config.USE_DESIGN_SYSTEM %}
    <link href="https://cdn.ticketiq.com/design-system/latest/ticketiq-design-system.css" rel="stylesheet">
{% else %}
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
{% endif %}
```

## Support and Resources

### Migration Support
- **Slack Channel**: #design-system-migration
- **Office Hours**: Tuesdays 2-3 PM EST
- **Documentation**: https://design-system.ticketiq.com
- **Issue Tracking**: GitHub Issues

### Training Resources
- **Component Workshop**: Interactive component examples
- **Video Tutorials**: Step-by-step migration guides
- **Best Practices Guide**: Design system usage patterns
- **Troubleshooting Guide**: Common issues and solutions

### Success Metrics
- **Bundle Size Reduction**: Target 30% reduction
- **Accessibility Score**: Target 95+ Lighthouse score
- **Performance Improvement**: Target 20% faster load times
- **Developer Satisfaction**: Target 4.5/5 satisfaction score
- **Design Consistency**: 100% component compliance