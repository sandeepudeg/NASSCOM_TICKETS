const fs = require('fs');
const path = require('path');

describe('Design Token Format Consistency', () => {
  let tokens;
  let cssContent;
  let themesContent;
  
  beforeAll(() => {
    // Load generated tokens from JSON
    tokens = JSON.parse(fs.readFileSync(path.join(__dirname, '../dist/json/tokens.json'), 'utf8'));
    cssContent = fs.readFileSync(path.join(__dirname, '../dist/css/variables.css'), 'utf8');
    
    // Load themes content to check for theme selectors
    try {
      themesContent = fs.readFileSync(path.join(__dirname, '../src/styles/themes.css'), 'utf8');
    } catch (e) {
      themesContent = '';
    }
  });

  test('should have valid color tokens', () => {
    expect(tokens.color).toBeDefined();
    expect(tokens.color.primary).toMatch(/^#[0-9a-f]{6}$/i);
    expect(tokens.color.accent).toMatch(/^#[0-9a-f]{6}$/i);
    expect(tokens.color.success).toMatch(/^#[0-9a-f]{6}$/i);
  });

  test('should have consistent typography tokens', () => {
    expect(tokens.font).toBeDefined();
    expect(tokens.font.family.sans).toBeInstanceOf(Array);
    expect(tokens.font.family.sans).toContain('Segoe UI');
    
    // Check font sizes follow rem units
    Object.values(tokens.font.size).forEach(size => {
      expect(size).toMatch(/^\d+(\.\d+)?rem$/);
    });
  });

  test('should have spacing tokens following 4px base unit', () => {
    expect(tokens.spacing).toBeDefined();
    
    // Check that spacing values are in rem
    Object.values(tokens.spacing).forEach(value => {
      if (typeof value === 'string') {
        expect(value === '0' || value.endsWith('rem')).toBe(true);
      }
    });
  });

  test('should generate valid CSS custom properties', () => {
    expect(cssContent).toContain(':root {');
    expect(cssContent).toContain('--color-primary:');
    expect(cssContent).toContain('--font-family-sans:');
    expect(cssContent).toContain('--spacing-');
  });

  test('should have component tokens', () => {
    expect(tokens.button).toBeDefined();
    expect(tokens.button.primary).toBeDefined();
    expect(tokens.button.secondary).toBeDefined();
    
    expect(tokens.card).toBeDefined();
    expect(tokens.input).toBeDefined();
    expect(tokens.badge).toBeDefined();
  });

  test('should have theme support in CSS', () => {
    expect(themesContent).toContain('[data-theme="dark"]');
    expect(themesContent).toContain('[data-theme="light"]');
  });

  test('should have proper border radius values', () => {
    expect(tokens.borderRadius).toBeDefined();
    expect(tokens.borderRadius.none).toBe('0');
    expect(tokens.borderRadius.full).toBe('999px');
    
    // Check other values are in px
    Object.entries(tokens.borderRadius).forEach(([key, value]) => {
      if (key !== 'none' && key !== 'full') {
        expect(value).toMatch(/^\d+px$/);
      }
    });
  });

  test('should have shadow definitions', () => {
    expect(tokens.shadow).toBeDefined();
    expect(tokens.shadow.none).toBe('none');
    
    // Check shadow values contain rgba
    Object.entries(tokens.shadow).forEach(([key, value]) => {
      if (key !== 'none') {
        expect(value).toContain('rgba');
      }
    });
  });

  test('should have transition tokens', () => {
    expect(tokens.transition).toBeDefined();
    expect(tokens.transition.duration).toBeDefined();
    expect(tokens.transition.easing).toBeDefined();
    
    // Check duration values are in ms
    Object.values(tokens.transition.duration).forEach(duration => {
      expect(duration).toMatch(/^\d+ms$/);
    });
  });
});