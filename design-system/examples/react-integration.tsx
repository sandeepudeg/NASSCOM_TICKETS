import React from 'react';
import { 
  DesignSystemThemeProvider, 
  useTheme, 
  useThemeMode,
  Button, 
  Input, 
  Card,
  designSystemStyled,
  colors,
  spacing,
  borderRadius
} from '@ticketiq/design-system';

// Example of using styled components with design tokens
const CustomContainer = designSystemStyled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${spacing.lg};
  background-color: ${colors.background};
  border-radius: ${borderRadius.lg};
`;

const StyledHeader = designSystemStyled.header`
  text-align: center;
  margin-bottom: ${spacing.xl};
  
  h1 {
    color: ${colors.text};
    margin-bottom: ${spacing.sm};
  }
  
  p {
    color: ${colors.textMuted};
  }
`;

// Example component using theme hooks
function ThemeControls() {
  const { currentTheme, toggleTheme, setLightTheme, setDarkTheme, setAutoTheme } = useThemeMode();
  
  return (
    <Card title="Theme Controls" style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Button 
          variant={currentTheme === 'light' ? 'primary' : 'secondary'}
          onClick={setLightTheme}
        >
          Light Theme
        </Button>
        <Button 
          variant={currentTheme === 'dark' ? 'primary' : 'secondary'}
          onClick={setDarkTheme}
        >
          Dark Theme
        </Button>
        <Button 
          variant={currentTheme === 'auto' ? 'primary' : 'secondary'}
          onClick={setAutoTheme}
        >
          Auto Theme
        </Button>
        <Button variant="outline" onClick={toggleTheme}>
          Toggle Theme
        </Button>
      </div>
      <p style={{ marginTop: 16, color: 'var(--color-theme-text-muted)' }}>
        Current theme: <strong>{currentTheme}</strong>
      </p>
    </Card>
  );
}

// Example component using design tokens
function ComponentShowcase() {
  const { tokens } = useTheme();
  
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
      <Card title="Buttons" size="medium">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Button variant="primary" size="large">Primary Button</Button>
          <Button variant="secondary" size="medium">Secondary Button</Button>
          <Button variant="outline" size="small">Outline Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="danger">Danger Button</Button>
        </div>
      </Card>
      
      <Card title="Inputs" size="medium">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input placeholder="Default input" />
          <Input placeholder="Large input" size="large" />
          <Input placeholder="Small input" size="small" />
          <Input placeholder="Error state" error />
          <Input placeholder="Success state" success />
        </div>
      </Card>
      
      <Card title="Design Tokens" size="medium">
        <div style={{ fontSize: 14, lineHeight: 1.6 }}>
          <p><strong>Primary Color:</strong> {tokens.color?.theme?.primary}</p>
          <p><strong>Font Family:</strong> {tokens.typography?.fontFamily?.sans}</p>
          <p><strong>Base Spacing:</strong> {tokens.spacing?.base}</p>
          <p><strong>Border Radius:</strong> {tokens.borderRadius?.base}</p>
        </div>
      </Card>
    </div>
  );
}

// Main application component
function ExampleApp() {
  return (
    <CustomContainer>
      <StyledHeader>
        <h1>TicketIQ Design System</h1>
        <p>React Integration Example</p>
      </StyledHeader>
      
      <ThemeControls />
      <ComponentShowcase />
      
      <Card 
        title="Usage Instructions" 
        style={{ marginTop: 24 }}
        variant="filled"
      >
        <div style={{ lineHeight: 1.6 }}>
          <h3>Getting Started</h3>
          <ol>
            <li>Install the design system: <code>npm install @ticketiq/design-system</code></li>
            <li>Wrap your app with <code>DesignSystemThemeProvider</code></li>
            <li>Use design system components and hooks</li>
            <li>Access design tokens through the <code>useTheme</code> hook</li>
          </ol>
          
          <h3>Key Features</h3>
          <ul>
            <li>🎨 Design token-driven theming</li>
            <li>🌙 Dark/light theme support with auto-detection</li>
            <li>🧩 Extended Ant Design components</li>
            <li>💅 CSS-in-JS integration with Emotion</li>
            <li>📱 Responsive design utilities</li>
            <li>♿ Built-in accessibility features</li>
            <li>🌳 Tree-shaking support for optimal bundle size</li>
          </ul>
        </div>
      </Card>
    </CustomContainer>
  );
}

// Example of how to use the design system in your app
export default function App() {
  return (
    <DesignSystemThemeProvider 
      theme="auto" 
      config={{
        persistPreference: true,
        autoDetect: true
      }}
    >
      <ExampleApp />
    </DesignSystemThemeProvider>
  );
}

// Example of creating custom styled components
export const CustomButton = designSystemStyled(Button)`
  background: linear-gradient(45deg, ${colors.primary}, ${colors.secondary});
  border: none;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${colors.primary}40;
  }
`;

// Example of using the withDesignSystem HOC
import { withDesignSystem } from '@ticketiq/design-system';

const MyComponent = ({ title }: { title: string }) => (
  <div>{title}</div>
);

export const MyComponentWithTheme = withDesignSystem(MyComponent, {
  theme: 'dark'
});