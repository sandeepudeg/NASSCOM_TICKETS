# React Integration Guide

The TicketIQ Design System provides a comprehensive React integration layer that extends Ant Design with our design tokens and custom components.

## Installation

```bash
npm install @ticketiq/design-system
```

## Peer Dependencies

Make sure you have the required peer dependencies installed:

```bash
npm install react react-dom antd @emotion/react @emotion/styled
```

## Quick Start

### 1. Wrap your app with the theme provider

```tsx
import React from 'react';
import { DesignSystemThemeProvider } from '@ticketiq/design-system';
import App from './App';

function Root() {
  return (
    <DesignSystemThemeProvider theme="auto">
      <App />
    </DesignSystemThemeProvider>
  );
}

export default Root;
```

### 2. Use design system components

```tsx
import React from 'react';
import { Button, Input, Card } from '@ticketiq/design-system';

function MyComponent() {
  return (
    <Card title="Example Card">
      <Input placeholder="Enter your name" />
      <Button variant="primary" size="large">
        Submit
      </Button>
    </Card>
  );
}
```

### 3. Access design tokens

```tsx
import React from 'react';
import { useTheme, designSystemStyled, colors, spacing } from '@ticketiq/design-system';

const StyledContainer = designSystemStyled.div`
  padding: ${spacing.lg};
  background-color: ${colors.surface};
  border-radius: 8px;
`;

function TokenExample() {
  const { tokens } = useTheme();
  
  return (
    <StyledContainer>
      <p>Primary color: {tokens.color.theme.primary}</p>
    </StyledContainer>
  );
}
```

## Theme Provider

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `theme` | `'light' \| 'dark' \| 'auto'` | `'dark'` | Initial theme mode |
| `config` | `Partial<ThemeConfig>` | `{}` | Theme configuration options |
| `antdConfig` | `Partial<AntdThemeConfig>` | `{}` | Additional Ant Design theme config |

### Theme Configuration

```tsx
<DesignSystemThemeProvider
  theme="auto"
  config={{
    autoDetect: true,
    persistPreference: true,
    storageKey: 'my-app-theme'
  }}
  antdConfig={{
    token: {
      colorPrimary: '#custom-color'
    }
  }}
>
  <App />
</DesignSystemThemeProvider>
```

## Hooks

### useTheme

Access the current theme context:

```tsx
import { useTheme } from '@ticketiq/design-system';

function MyComponent() {
  const { currentTheme, setTheme, toggleTheme, tokens } = useTheme();
  
  return (
    <div>
      <p>Current theme: {currentTheme}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}
```

### useThemeMode

Convenient theme mode management:

```tsx
import { useThemeMode } from '@ticketiq/design-system';

function ThemeControls() {
  const { 
    currentTheme, 
    setLightTheme, 
    setDarkTheme, 
    setAutoTheme,
    isLight,
    isDark,
    isAuto
  } = useThemeMode();
  
  return (
    <div>
      <button onClick={setLightTheme} disabled={isLight}>Light</button>
      <button onClick={setDarkTheme} disabled={isDark}>Dark</button>
      <button onClick={setAutoTheme} disabled={isAuto}>Auto</button>
    </div>
  );
}
```

### useDesignTokens

Direct access to design tokens:

```tsx
import { useDesignTokens } from '@ticketiq/design-system';

function TokenDisplay() {
  const tokens = useDesignTokens();
  
  return (
    <div style={{ color: tokens.color.theme.primary }}>
      Styled with design tokens
    </div>
  );
}
```

### useResponsive

Responsive breakpoint detection:

```tsx
import { useResponsive } from '@ticketiq/design-system';

function ResponsiveComponent() {
  const { xs, sm, md, lg, xl, xxl, current } = useResponsive();
  
  return (
    <div>
      <p>Current breakpoint: {current}</p>
      <p>Is mobile: {!md}</p>
    </div>
  );
}
```

## Components

### Button

Extended Ant Design Button with design system variants:

```tsx
import { Button } from '@ticketiq/design-system';

<Button variant="primary" size="large" fullWidth>
  Primary Button
</Button>

<Button variant="outline" size="small">
  Outline Button
</Button>

<Button variant="ghost" isLoading>
  Loading Button
</Button>
```

**Props:**
- `variant`: `'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'`
- `size`: `'small' | 'medium' | 'large'`
- `fullWidth`: `boolean`
- `isLoading`: `boolean`

### Input

Enhanced Input component with design system styling:

```tsx
import { Input } from '@ticketiq/design-system';

<Input 
  placeholder="Enter text" 
  size="large" 
  variant="filled"
  error={hasError}
  success={isValid}
/>

<Input.TextArea 
  placeholder="Multi-line input"
  rows={4}
/>
```

**Props:**
- `size`: `'small' | 'medium' | 'large'`
- `variant`: `'default' | 'filled' | 'borderless'`
- `error`: `boolean`
- `success`: `boolean`

### Card

Flexible Card component with multiple variants:

```tsx
import { Card } from '@ticketiq/design-system';

<Card 
  variant="elevated" 
  size="large"
  interactive
  header="Custom Header"
  footer="Custom Footer"
>
  Card content
</Card>
```

**Props:**
- `variant`: `'default' | 'outlined' | 'filled' | 'elevated'`
- `size`: `'small' | 'medium' | 'large'`
- `interactive`: `boolean`
- `padding`: `'none' | 'small' | 'medium' | 'large'`

## CSS-in-JS Integration

### Styled Components

Use the design system styled function:

```tsx
import { designSystemStyled, colors, spacing, borderRadius } from '@ticketiq/design-system';

const CustomCard = designSystemStyled.div`
  padding: ${spacing.lg};
  background-color: ${colors.surface};
  border-radius: ${borderRadius.lg};
  border: 1px solid ${colors.border};
  
  &:hover {
    border-color: ${colors.primary};
  }
`;
```

### Token Utilities

Access design tokens in styled components:

```tsx
import { getToken, spacing, colors } from '@ticketiq/design-system';

const StyledComponent = designSystemStyled.div`
  /* Using utility functions */
  padding: ${spacing.lg};
  color: ${colors.text};
  
  /* Using getToken for custom paths */
  font-size: ${getToken('typography.fontSize.lg')};
  
  /* Responsive utilities */
  @media (min-width: 768px) {
    padding: ${spacing.xl};
  }
`;
```

### Theme-aware Components

Create components that respond to theme changes:

```tsx
const ThemedButton = designSystemStyled.button`
  background-color: ${props => 
    props.theme.mode === 'dark' 
      ? colors.primary(props) 
      : colors.secondary(props)
  };
  
  color: ${props => colors.text(props)};
  transition: all 250ms ease-in-out;
`;
```

## Utilities

### withDesignSystem HOC

Wrap components with the design system theme:

```tsx
import { withDesignSystem } from '@ticketiq/design-system';

const MyComponent = ({ title }) => <h1>{title}</h1>;

export default withDesignSystem(MyComponent, {
  theme: 'dark'
});
```

### createStyledComponent

Create typed styled components:

```tsx
import { createStyledComponent } from '@ticketiq/design-system';

const StyledDiv = createStyledComponent('div')`
  padding: 16px;
`;

const StyledButton = createStyledComponent(Button)`
  margin-top: 8px;
`;
```

## Tree Shaking

The design system supports tree shaking for optimal bundle size:

```tsx
// Import only what you need
import { Button, Input } from '@ticketiq/design-system';

// Or import from specific modules
import { DesignSystemThemeProvider } from '@ticketiq/design-system/react';
import { colors, spacing } from '@ticketiq/design-system/styled';
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```tsx
import type { 
  ButtonProps, 
  InputProps, 
  CardProps,
  ThemeMode,
  DesignSystemTheme 
} from '@ticketiq/design-system';

interface MyComponentProps {
  theme: ThemeMode;
  buttonProps: ButtonProps;
}
```

## Migration from Ant Design

The design system maintains full compatibility with Ant Design:

```tsx
// Before
import { Button, Input, Card } from 'antd';

// After - drop-in replacement
import { Button, Input, Card } from '@ticketiq/design-system';

// All Ant Design props still work
<Button type="primary" size="large" loading>
  Click me
</Button>
```

## Performance Considerations

1. **Bundle Size**: Use tree shaking to import only needed components
2. **Theme Changes**: Theme switching is optimized with CSS custom properties
3. **Re-renders**: Theme context uses React.memo and useMemo for optimization
4. **CSS-in-JS**: Emotion provides efficient runtime styling

## Best Practices

1. **Use the theme provider**: Always wrap your app with `DesignSystemThemeProvider`
2. **Leverage design tokens**: Use token utilities instead of hardcoded values
3. **Responsive design**: Use the `useResponsive` hook for breakpoint detection
4. **Accessibility**: All components include built-in accessibility features
5. **Performance**: Import components individually for better tree shaking

## Examples

See the `/examples` directory for complete implementation examples:

- `react-integration.tsx` - Comprehensive usage example
- `demo-react.html` - Browser-ready demo

## Troubleshooting

### Common Issues

1. **Theme not applying**: Ensure `DesignSystemThemeProvider` wraps your app
2. **TypeScript errors**: Check that peer dependencies are installed
3. **Bundle size**: Use tree shaking imports
4. **Styling conflicts**: Ensure CSS order (design system CSS should come after Ant Design CSS)

### Debug Mode

Enable debug logging:

```tsx
<DesignSystemThemeProvider 
  config={{ debug: true }}
>
  <App />
</DesignSystemThemeProvider>
```