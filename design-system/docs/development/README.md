# Development Guide

This guide covers the development workflow, contribution guidelines, and technical details for working with the TicketIQ Design System codebase.

## Getting Started

### Prerequisites
- **Node.js**: 16.x or higher
- **npm**: 8.x or higher
- **Python**: 3.8+ (for Flask integration)
- **Git**: Latest version

### Development Environment Setup

#### Clone and Install
```bash
# Clone the repository
git clone https://github.com/ticketiq/design-system.git
cd design-system

# Install dependencies
npm install

# Install Python dependencies (for Flask integration)
pip install -r requirements-dev.txt

# Set up pre-commit hooks
npm run setup:hooks
```

#### Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Configure environment variables
DESIGN_SYSTEM_ENV=development
STORYBOOK_PORT=6006
BUILD_ANALYZE=false
ENABLE_SOURCE_MAPS=true
```

### Project Structure
```
design-system/
├── src/                          # Source code
│   ├── components/              # React components
│   ├── flask/                   # Flask integration
│   ├── styles/                  # CSS and styling
│   ├── tokens/                  # Design tokens
│   ├── types/                   # TypeScript definitions
│   └── utils/                   # Utility functions
├── docs/                        # Documentation
├── examples/                    # Usage examples
├── tests/                       # Test files
├── tools/                       # Build and development tools
├── dist/                        # Built files (generated)
└── storybook/                   # Storybook configuration
```

## Development Workflow

### Available Scripts
```bash
# Development
npm run dev              # Start development server
npm run storybook        # Start Storybook
npm run tokens:watch     # Watch token changes

# Building
npm run build            # Build for production
npm run build:tokens     # Build design tokens
npm run build:components # Build components only
npm run build:docs       # Build documentation

# Testing
npm run test             # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
npm run test:a11y        # Run accessibility tests
npm run test:visual      # Run visual regression tests

# Linting and Formatting
npm run lint             # Lint code
npm run lint:fix         # Fix linting issues
npm run format           # Format code with Prettier
npm run typecheck        # TypeScript type checking

# Quality Assurance
npm run validate         # Run all quality checks
npm run analyze          # Analyze bundle size
npm run audit            # Security audit
```

### Development Server
```bash
# Start development environment
npm run dev

# This starts:
# - Webpack dev server (localhost:3000)
# - Storybook (localhost:6006)
# - Token watcher
# - Flask dev server (localhost:5000)
```

## Design Token Development

### Token Structure
```json
// tokens/global.json
{
  "color": {
    "blue": {
      "50": { "value": "#eff6ff" },
      "100": { "value": "#dbeafe" },
      "500": { "value": "#3b82f6" },
      "900": { "value": "#1e3a8a" }
    }
  },
  "spacing": {
    "1": { "value": "0.25rem" },
    "2": { "value": "0.5rem" },
    "4": { "value": "1rem" }
  }
}
```

```json
// tokens/semantic.json
{
  "color": {
    "primary": { "value": "{color.blue.500}" },
    "text": { "value": "{color.slate.900}" },
    "background": { "value": "{color.white}" }
  }
}
```

### Token Development Workflow
```bash
# 1. Edit token files
vim tokens/global.json

# 2. Build tokens (automatic with watcher)
npm run tokens:build

# 3. Test in Storybook
npm run storybook

# 4. Validate token changes
npm run tokens:validate
```

### Style Dictionary Configuration
```javascript
// style-dictionary.config.js
const StyleDictionary = require('style-dictionary');

module.exports = {
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'dist/css/',
      files: [{
        destination: 'tokens.css',
        format: 'css/variables'
      }]
    },
    js: {
      transformGroup: 'js',
      buildPath: 'dist/js/',
      files: [{
        destination: 'tokens.js',
        format: 'javascript/es6'
      }]
    },
    json: {
      transformGroup: 'js',
      buildPath: 'dist/json/',
      files: [{
        destination: 'tokens.json',
        format: 'json/flat'
      }]
    }
  }
};
```

## Component Development

### Component Template
```typescript
// src/components/Button/Button.tsx
import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { ButtonProps } from './Button.types';
import './Button.css';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  children,
  className,
  ...props
}, ref) => {
  const buttonClass = clsx(
    'ds-button',
    `ds-button--${variant}`,
    `ds-button--${size}`,
    {
      'ds-button--loading': loading,
      'ds-button--disabled': disabled,
    },
    className
  );

  return (
    <button
      ref={ref}
      className={buttonClass}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && <span className="ds-button__spinner" aria-hidden="true" />}
      <span className="ds-button__content">{children}</span>
    </button>
  );
});

Button.displayName = 'Button';
```

### Component Types
```typescript
// src/components/Button/Button.types.ts
import { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button content */
  children: ReactNode;
  
  /** Visual variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'success' | 'warning' | 'danger';
  
  /** Button size */
  size?: 'small' | 'medium' | 'large';
  
  /** Loading state */
  loading?: boolean;
  
  /** Full width button */
  fullWidth?: boolean;
  
  /** Additional CSS classes */
  className?: string;
}
```

### Component Styles
```css
/* src/components/Button/Button.css */
.ds-button {
  /* Base styles */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: var(--border-radius-md);
  font-family: var(--font-family-sans);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  cursor: pointer;
  transition: all var(--transition-fast) ease;
  
  /* Focus styles */
  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
  
  /* Disabled styles */
  &:disabled,
  &.ds-button--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
}

/* Variants */
.ds-button--primary {
  background-color: var(--color-primary);
  color: var(--color-white);
  border-color: var(--color-primary);
  
  &:hover:not(:disabled) {
    background-color: var(--color-primary-hover);
    border-color: var(--color-primary-hover);
  }
}

.ds-button--secondary {
  background-color: var(--color-secondary);
  color: var(--color-white);
  border-color: var(--color-secondary);
  
  &:hover:not(:disabled) {
    background-color: var(--color-secondary-hover);
    border-color: var(--color-secondary-hover);
  }
}

/* Sizes */
.ds-button--small {
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--font-size-sm);
  min-height: 32px;
}

.ds-button--medium {
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-base);
  min-height: 40px;
}

.ds-button--large {
  padding: var(--spacing-4) var(--spacing-6);
  font-size: var(--font-size-lg);
  min-height: 48px;
}

/* Loading state */
.ds-button--loading {
  position: relative;
  pointer-events: none;
  
  .ds-button__content {
    opacity: 0.7;
  }
}

.ds-button__spinner {
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

### Component Stories
```typescript
// src/components/Button/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Button component for actions and navigation.'
      }
    }
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'link', 'success', 'warning', 'danger']
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large']
    },
    loading: {
      control: 'boolean'
    },
    disabled: {
      control: 'boolean'
    }
  }
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Button'
  }
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="success">Success</Button>
      <Button variant="warning">Warning</Button>
      <Button variant="danger">Danger</Button>
    </div>
  )
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Button size="small">Small</Button>
      <Button size="medium">Medium</Button>
      <Button size="large">Large</Button>
    </div>
  )
};

export const LoadingState: Story = {
  args: {
    variant: 'primary',
    loading: true,
    children: 'Loading...'
  }
};
```

### Component Tests
```typescript
// src/components/Button/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from './Button';

expect.extend(toHaveNoViolations);

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Test Button</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Test Button')).toBeInTheDocument();
  });

  it('applies correct variant class', () => {
    render(<Button variant="secondary">Test</Button>);
    expect(screen.getByRole('button')).toHaveClass('ds-button--secondary');
  });

  it('applies correct size class', () => {
    render(<Button size="large">Test</Button>);
    expect(screen.getByRole('button')).toHaveClass('ds-button--large');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Test</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('prevents click when disabled', () => {
    const handleClick = jest.fn();
    render(<Button disabled onClick={handleClick}>Test</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('shows loading state correctly', () => {
    render(<Button loading>Loading</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Button>Accessible Button</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('supports keyboard navigation', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Test</Button>);
    
    const button = screen.getByRole('button');
    button.focus();
    
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(1);
    
    fireEvent.keyDown(button, { key: ' ' });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });
});
```

## Flask Integration Development

### Jinja2 Macro Development
```html
<!-- src/flask/templates/macros/button.html -->
{% macro ds_button(
    text, 
    variant='primary', 
    size='medium', 
    type='button',
    disabled=false,
    loading=false,
    full_width=false,
    class='',
    id='',
    onclick='',
    **kwargs
) %}
{%- set button_classes = [
    'ds-button',
    'ds-button--' + variant,
    'ds-button--' + size
] -%}

{%- if full_width -%}
    {%- set _ = button_classes.append('ds-button--full-width') -%}
{%- endif -%}

{%- if loading -%}
    {%- set _ = button_classes.append('ds-button--loading') -%}
{%- endif -%}

{%- if class -%}
    {%- set _ = button_classes.append(class) -%}
{%- endif -%}

<button 
    type="{{ type }}"
    class="{{ button_classes | join(' ') }}"
    {% if id %}id="{{ id }}"{% endif %}
    {% if disabled or loading %}disabled{% endif %}
    {% if loading %}aria-busy="true"{% endif %}
    {% if onclick %}onclick="{{ onclick }}"{% endif %}
    {% for key, value in kwargs.items() %}{{ key }}="{{ value }}"{% endfor %}
>
    {% if loading %}
        <span class="ds-button__spinner" aria-hidden="true"></span>
    {% endif %}
    <span class="ds-button__content">{{ text }}</span>
</button>
{% endmacro %}
```

### Flask Integration Tests
```python
# tests/flask/test_macros.py
import pytest
from flask import Flask, render_template_string
from design_system_flask import DesignSystemFlask

@pytest.fixture
def app():
    app = Flask(__name__)
    app.config['TESTING'] = True
    DesignSystemFlask(app)
    return app

@pytest.fixture
def client(app):
    return app.test_client()

def test_button_macro_basic(app):
    with app.app_context():
        template = """
        {% from 'design_system/macros.html' import ds_button %}
        {{ ds_button('Test Button') }}
        """
        result = render_template_string(template)
        
        assert 'ds-button' in result
        assert 'ds-button--primary' in result
        assert 'ds-button--medium' in result
        assert 'Test Button' in result

def test_button_macro_variants(app):
    with app.app_context():
        template = """
        {% from 'design_system/macros.html' import ds_button %}
        {{ ds_button('Secondary', variant='secondary') }}
        """
        result = render_template_string(template)
        
        assert 'ds-button--secondary' in result

def test_button_macro_loading_state(app):
    with app.app_context():
        template = """
        {% from 'design_system/macros.html' import ds_button %}
        {{ ds_button('Loading', loading=true) }}
        """
        result = render_template_string(template)
        
        assert 'ds-button--loading' in result
        assert 'aria-busy="true"' in result
        assert 'disabled' in result
```

## Testing Strategy

### Unit Testing
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Visual Regression Testing
```javascript
// .storybook/test-runner.js
const { injectAxe, checkA11y } = require('axe-playwright');

module.exports = {
  async preRender(page, context) {
    await injectAxe(page);
  },
  async postRender(page, context) {
    // Accessibility testing
    await checkA11y(page, '#root', {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
    });

    // Visual regression testing
    await page.screenshot({
      path: `screenshots/${context.id}.png`,
      fullPage: true,
    });
  },
};
```

### Property-Based Testing
```javascript
// tests/properties/button.test.js
import fc from 'fast-check';
import { render } from '@testing-library/react';
import { Button } from '../src/components/Button';

describe('Button Properties', () => {
  it('should always render a button element', () => {
    fc.assert(fc.property(
      fc.record({
        variant: fc.constantFrom('primary', 'secondary', 'outline'),
        size: fc.constantFrom('small', 'medium', 'large'),
        disabled: fc.boolean(),
        children: fc.string({ minLength: 1 })
      }),
      (props) => {
        const { container } = render(<Button {...props} />);
        const button = container.querySelector('button');
        
        expect(button).toBeInTheDocument();
        expect(button).toHaveClass('ds-button');
        expect(button).toHaveClass(`ds-button--${props.variant}`);
        expect(button).toHaveClass(`ds-button--${props.size}`);
        
        if (props.disabled) {
          expect(button).toBeDisabled();
        }
      }
    ));
  });
});
```

## Build System

### Webpack Configuration
```javascript
// webpack.config.js
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: {
      'design-system': './src/index.ts',
      'design-system.min': './src/index.ts'
    },
    
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      library: 'DesignSystem',
      libraryTarget: 'umd',
      clean: true
    },
    
    externals: {
      react: 'react',
      'react-dom': 'react-dom'
    },
    
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
            'postcss-loader'
          ]
        }
      ]
    },
    
    plugins: [
      new MiniCssExtractPlugin({
        filename: '[name].css'
      }),
      
      ...(process.env.ANALYZE ? [new BundleAnalyzerPlugin()] : [])
    ],
    
    optimization: {
      minimize: isProduction,
      sideEffects: false
    }
  };
};
```

### PostCSS Configuration
```javascript
// postcss.config.js
module.exports = {
  plugins: [
    require('postcss-import'),
    require('postcss-custom-properties'),
    require('autoprefixer'),
    ...(process.env.NODE_ENV === 'production' ? [
      require('cssnano')({
        preset: ['default', {
          discardComments: { removeAll: true }
        }]
      })
    ] : [])
  ]
};
```

## Release Process

### Semantic Versioning
```json
// package.json
{
  "scripts": {
    "release": "semantic-release",
    "release:dry": "semantic-release --dry-run"
  },
  "release": {
    "branches": ["main"],
    "plugins": [
      "@semantic-release/commit-analyzer",
      "@semantic-release/release-notes-generator",
      "@semantic-release/changelog",
      "@semantic-release/npm",
      "@semantic-release/github"
    ]
  }
}
```

### Commit Convention
```
feat: add new Button component
fix: resolve accessibility issue in Modal
docs: update component documentation
style: format code with prettier
refactor: simplify theme provider logic
test: add unit tests for Input component
chore: update dependencies

BREAKING CHANGE: remove deprecated prop from Button
```

### GitHub Actions Workflow
```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:ci
      
      - name: Build
        run: npm run build
      
      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: npm run release
```

## Contributing Guidelines

### Code Style
- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Write comprehensive tests for new features
- Include Storybook stories for components
- Update documentation for changes

### Pull Request Process
1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Update documentation
5. Submit pull request
6. Address review feedback
7. Merge after approval

### Issue Templates
```markdown
<!-- Bug Report Template -->
## Bug Description
A clear description of the bug.

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. See error

## Expected Behavior
What you expected to happen.

## Screenshots
If applicable, add screenshots.

## Environment
- OS: [e.g. iOS]
- Browser: [e.g. chrome, safari]
- Version: [e.g. 22]
```