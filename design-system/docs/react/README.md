# React Integration Guide

The TicketIQ Design System provides seamless integration with React applications, including compatibility with existing Ant Design components and modern React patterns.

## Installation

### NPM Package
```bash
npm install @ticketiq/design-system
```

### Peer Dependencies
```bash
npm install react react-dom @types/react @types/react-dom
```

### Optional Dependencies
```bash
# For Ant Design compatibility
npm install antd

# For styled-components support
npm install styled-components @types/styled-components

# For emotion support
npm install @emotion/react @emotion/styled
```

## Setup

### Basic Setup
```jsx
// src/App.jsx
import React from 'react';
import { ThemeProvider } from '@ticketiq/design-system';
import '@ticketiq/design-system/dist/styles.css';

function App() {
  return (
    <ThemeProvider theme="dark">
      <div className="app">
        {/* Your app content */}
      </div>
    </ThemeProvider>
  );
}

export default App;
```

### TypeScript Setup
```typescript
// src/App.tsx
import React from 'react';
import { ThemeProvider, DesignSystemConfig } from '@ticketiq/design-system';
import '@ticketiq/design-system/dist/styles.css';

const config: DesignSystemConfig = {
  theme: 'dark',
  tokens: {
    // Custom token overrides
  }
};

function App(): JSX.Element {
  return (
    <ThemeProvider config={config}>
      <div className="app">
        {/* Your app content */}
      </div>
    </ThemeProvider>
  );
}

export default App;
```

### Ant Design Integration
```jsx
// src/App.jsx
import React from 'react';
import { ConfigProvider } from 'antd';
import { ThemeProvider, getAntdTheme } from '@ticketiq/design-system';
import '@ticketiq/design-system/dist/styles.css';

function App() {
  const antdTheme = getAntdTheme('dark');
  
  return (
    <ThemeProvider theme="dark">
      <ConfigProvider theme={antdTheme}>
        <div className="app">
          {/* Mix Ant Design and Design System components */}
        </div>
      </ConfigProvider>
    </ThemeProvider>
  );
}
```

## Theme Provider

### Basic Usage
```jsx
import { ThemeProvider, useTheme } from '@ticketiq/design-system';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
    </button>
  );
}

function App() {
  return (
    <ThemeProvider theme="dark">
      <ThemeToggle />
    </ThemeProvider>
  );
}
```

### Advanced Configuration
```jsx
import { ThemeProvider } from '@ticketiq/design-system';

const customConfig = {
  theme: 'dark',
  tokens: {
    colors: {
      primary: '#6366f1',      // Custom primary color
      success: '#10b981',      // Custom success color
    },
    spacing: {
      base: '1rem',           // Custom base spacing
    }
  },
  components: {
    Button: {
      defaultVariant: 'primary',
      defaultSize: 'medium'
    }
  }
};

function App() {
  return (
    <ThemeProvider config={customConfig}>
      {/* Your app */}
    </ThemeProvider>
  );
}
```

### System Theme Detection
```jsx
import { ThemeProvider } from '@ticketiq/design-system';

function App() {
  return (
    <ThemeProvider 
      theme="auto"              // Follows system preference
      storageKey="app-theme"    // Persists theme choice
    >
      {/* Your app */}
    </ThemeProvider>
  );
}
```

## Component Usage

### Importing Components
```jsx
// Named imports (recommended for tree-shaking)
import { Button, Input, Card } from '@ticketiq/design-system';

// Individual imports (best for bundle size)
import Button from '@ticketiq/design-system/button';
import Input from '@ticketiq/design-system/input';
import Card from '@ticketiq/design-system/card';

// Avoid default import of entire library
// import DesignSystem from '@ticketiq/design-system'; // ❌
```

### Basic Component Usage
```jsx
import { Button, Input, Card, Stack } from '@ticketiq/design-system';

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
  };
  
  return (
    <Card>
      <h2>Contact Us</h2>
      <form onSubmit={handleSubmit}>
        <Stack spacing="4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          <Input
            label="Message"
            as="textarea"
            rows={4}
            value={formData.message}
            onChange={(e) => setFormData({...formData, message: e.target.value})}
            required
          />
          <Button type="submit" variant="primary" fullWidth>
            Send Message
          </Button>
        </Stack>
      </form>
    </Card>
  );
}
```

### Advanced Component Patterns
```jsx
import { Button, Modal, useModal, Toast, useToast } from '@ticketiq/design-system';

function AdvancedExample() {
  const { isOpen, open, close } = useModal();
  const { showToast } = useToast();
  
  const handleDelete = async () => {
    try {
      await deleteItem();
      close();
      showToast({
        type: 'success',
        message: 'Item deleted successfully'
      });
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Failed to delete item'
      });
    }
  };
  
  return (
    <>
      <Button variant="danger" onClick={open}>
        Delete Item
      </Button>
      
      <Modal
        isOpen={isOpen}
        onClose={close}
        title="Confirm Deletion"
        size="small"
      >
        <p>Are you sure you want to delete this item?</p>
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </>
  );
}
```

## TypeScript Support

### Component Props
```typescript
import { ButtonProps, InputProps, CardProps } from '@ticketiq/design-system';

// Extending component props
interface CustomButtonProps extends ButtonProps {
  customProp?: string;
}

function CustomButton({ customProp, ...props }: CustomButtonProps) {
  return <Button {...props} className={`custom-class ${props.className}`} />;
}

// Using component props in other interfaces
interface FormProps {
  submitButton?: ButtonProps;
  inputs: InputProps[];
}
```

### Theme Types
```typescript
import { Theme, DesignTokens, ComponentTokens } from '@ticketiq/design-system';

// Custom theme configuration
interface CustomThemeConfig {
  theme: Theme;
  tokens: Partial<DesignTokens>;
  components: Partial<ComponentTokens>;
}

// Using theme tokens in styled components
import styled from 'styled-components';
import { useTokens } from '@ticketiq/design-system';

const StyledDiv = styled.div<{ variant: 'primary' | 'secondary' }>`
  background-color: ${({ theme, variant }) => 
    variant === 'primary' ? theme.colors.primary : theme.colors.secondary
  };
  padding: ${({ theme }) => theme.spacing.base};
`;

function ThemedComponent() {
  const tokens = useTokens();
  
  return (
    <StyledDiv variant="primary">
      Themed content
    </StyledDiv>
  );
}
```

### Generic Components
```typescript
import { SelectProps, Option } from '@ticketiq/design-system';

// Generic select component
interface User {
  id: string;
  name: string;
  email: string;
}

interface UserSelectProps extends Omit<SelectProps<User>, 'options'> {
  users: User[];
}

function UserSelect({ users, ...props }: UserSelectProps) {
  const options: Option<User>[] = users.map(user => ({
    value: user,
    label: user.name,
    description: user.email
  }));
  
  return <Select {...props} options={options} />;
}
```

## Styling Integration

### CSS-in-JS with Styled Components
```jsx
import styled from 'styled-components';
import { Button, useTokens } from '@ticketiq/design-system';

const StyledButton = styled(Button)`
  background: linear-gradient(
    45deg, 
    ${({ theme }) => theme.colors.primary}, 
    ${({ theme }) => theme.colors.secondary}
  );
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`;

function GradientButton(props) {
  return <StyledButton {...props} />;
}
```

### CSS-in-JS with Emotion
```jsx
import { css } from '@emotion/react';
import { Button, useTokens } from '@ticketiq/design-system';

function EmotionButton(props) {
  const tokens = useTokens();
  
  const buttonStyles = css`
    background: linear-gradient(45deg, ${tokens.colors.primary}, ${tokens.colors.secondary});
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: ${tokens.shadows.lg};
    }
  `;
  
  return <Button css={buttonStyles} {...props} />;
}
```

### Tailwind CSS Integration
```jsx
// tailwind.config.js
const { createTailwindConfig } = require('@ticketiq/design-system/tailwind');

module.exports = createTailwindConfig({
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  // Additional Tailwind configuration
});
```

```jsx
// Using Tailwind classes with design system
import { Button } from '@ticketiq/design-system';

function TailwindButton() {
  return (
    <Button 
      variant="primary"
      className="transform hover:scale-105 transition-transform duration-200"
    >
      Animated Button
    </Button>
  );
}
```

## Hooks and Utilities

### Theme Hooks
```jsx
import { useTheme, useTokens, useBreakpoint } from '@ticketiq/design-system';

function ResponsiveComponent() {
  const { theme, setTheme } = useTheme();
  const tokens = useTokens();
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  
  return (
    <div style={{ 
      padding: isMobile ? tokens.spacing.sm : tokens.spacing.lg,
      backgroundColor: tokens.colors.background 
    }}>
      <h1>Current theme: {theme}</h1>
      <p>Device: {isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}</p>
      <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
        Toggle Theme
      </button>
    </div>
  );
}
```

### Form Hooks
```jsx
import { useForm, useValidation } from '@ticketiq/design-system';

function FormExample() {
  const { values, errors, handleChange, handleSubmit } = useForm({
    initialValues: { email: '', password: '' },
    validationSchema: {
      email: { required: true, email: true },
      password: { required: true, minLength: 8 }
    },
    onSubmit: async (values) => {
      await submitForm(values);
    }
  });
  
  return (
    <form onSubmit={handleSubmit}>
      <Input
        name="email"
        label="Email"
        value={values.email}
        onChange={handleChange}
        error={errors.email}
      />
      <Input
        name="password"
        label="Password"
        type="password"
        value={values.password}
        onChange={handleChange}
        error={errors.password}
      />
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

### Modal and Toast Hooks
```jsx
import { useModal, useToast } from '@ticketiq/design-system';

function HooksExample() {
  const { isOpen, open, close } = useModal();
  const { showToast, hideToast } = useToast();
  
  const handleAction = () => {
    showToast({
      id: 'action-toast',
      type: 'info',
      message: 'Processing...',
      duration: 0 // Persistent toast
    });
    
    setTimeout(() => {
      hideToast('action-toast');
      showToast({
        type: 'success',
        message: 'Action completed!'
      });
    }, 2000);
  };
  
  return (
    <div>
      <Button onClick={open}>Open Modal</Button>
      <Button onClick={handleAction}>Show Toast</Button>
    </div>
  );
}
```

## Performance Optimization

### Tree Shaking
```jsx
// ✅ Good: Individual imports
import Button from '@ticketiq/design-system/button';
import Input from '@ticketiq/design-system/input';

// ✅ Good: Named imports with tree-shaking
import { Button, Input } from '@ticketiq/design-system';

// ❌ Bad: Imports entire library
import * as DS from '@ticketiq/design-system';
```

### Code Splitting
```jsx
import { lazy, Suspense } from 'react';
import { Loading } from '@ticketiq/design-system';

// Lazy load heavy components
const DataTable = lazy(() => import('@ticketiq/design-system/table'));
const Chart = lazy(() => import('@ticketiq/design-system/chart'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <DataTable />
      <Chart />
    </Suspense>
  );
}
```

### Bundle Analysis
```bash
# Analyze bundle size
npm run build -- --analyze

# Check tree-shaking effectiveness
npm run bundle-analyzer
```

## Testing

### Component Testing
```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, Button } from '@ticketiq/design-system';

function renderWithTheme(component, theme = 'dark') {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
}

test('button renders with correct variant', () => {
  renderWithTheme(<Button variant="primary">Test</Button>);
  
  const button = screen.getByRole('button');
  expect(button).toHaveClass('ds-button--primary');
});

test('button handles click events', () => {
  const handleClick = jest.fn();
  renderWithTheme(<Button onClick={handleClick}>Click me</Button>);
  
  fireEvent.click(screen.getByRole('button'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Theme Testing
```jsx
import { renderHook } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@ticketiq/design-system';

test('useTheme returns correct theme', () => {
  const wrapper = ({ children }) => (
    <ThemeProvider theme="dark">{children}</ThemeProvider>
  );
  
  const { result } = renderHook(() => useTheme(), { wrapper });
  
  expect(result.current.theme).toBe('dark');
});
```

### Accessibility Testing
```jsx
import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/react';
import { Button, ThemeProvider } from '@ticketiq/design-system';

expect.extend(toHaveNoViolations);

test('button has no accessibility violations', async () => {
  const { container } = render(
    <ThemeProvider theme="dark">
      <Button>Accessible Button</Button>
    </ThemeProvider>
  );
  
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Migration from Ant Design

### Component Mapping
```jsx
// Before (Ant Design)
import { Button, Input, Card } from 'antd';

// After (Design System)
import { Button, Input, Card } from '@ticketiq/design-system';

// The API is largely compatible
<Button type="primary">Submit</Button>        // Ant Design
<Button variant="primary">Submit</Button>     // Design System
```

### Gradual Migration
```jsx
// Mix both libraries during migration
import { Button as DSButton } from '@ticketiq/design-system';
import { Button as AntButton } from 'antd';

function MigrationExample() {
  return (
    <div>
      <DSButton variant="primary">New Button</DSButton>
      <AntButton type="primary">Old Button</AntButton>
    </div>
  );
}
```

### Theme Migration
```jsx
// Ant Design theme
const antdTheme = {
  token: {
    colorPrimary: '#1890ff',
  }
};

// Design System equivalent
const dsConfig = {
  tokens: {
    colors: {
      primary: '#1890ff'
    }
  }
};
```