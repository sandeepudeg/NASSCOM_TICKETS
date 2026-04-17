# TicketIQ Design System - Testing & Validation Guide

This document outlines the comprehensive testing and validation setup for the TicketIQ Design System, ensuring quality, consistency, and compliance across all components and platforms.

## Overview

The testing strategy includes five main areas:

1. **Visual Regression Testing** - Component consistency across browsers and devices
2. **Accessibility Testing** - WCAG 2.1 AA compliance validation
3. **Performance Testing** - Lighthouse-based performance validation
4. **Cross-Browser Testing** - Compatibility across different browsers and devices
5. **Design System Validation** - Compliance with design system standards

## Quick Start

```bash
# Install dependencies
npm install

# Build the design system
npm run build

# Run all tests
npm run test:all

# Run specific test suites
npm run test:visual
npm run test:accessibility
npm run test:performance
npm run test:cross-browser

# Run linting and validation
npm run lint:all
```

## Test Suites

### 1. Visual Regression Testing

**Purpose**: Ensures visual consistency of components across different browsers and screen sizes.

**Technology**: Playwright with screenshot comparison

**Configuration**: `playwright.config.js`

```bash
# Run visual tests
npm run test:visual

# Update visual baselines
npm run test:visual:update

# Start test server (required for visual tests)
npm run serve:test
```

**Test Coverage**:
- Component variants (buttons, inputs, cards, navigation)
- Theme switching (dark/light themes)
- Responsive layouts (mobile, tablet, desktop, wide)
- Interactive states (hover, focus, validation)
- Animation states

**Test Files**:
- `tests/visual/components.spec.js` - Main visual regression tests

### 2. Accessibility Testing

**Purpose**: Validates WCAG 2.1 AA compliance and accessibility best practices.

**Technology**: axe-core with Playwright integration + custom accessibility utilities

**Configuration**: Built into Jest and Playwright test suites

```bash
# Run accessibility tests
npm run test:accessibility

# Run accessibility linting
npm run lint:accessibility
```

**Test Coverage**:
- Automated axe-core scanning for WCAG violations
- Keyboard navigation testing
- Screen reader compatibility
- Color contrast validation
- Focus management
- ARIA attributes validation
- Form accessibility

**Test Files**:
- `tests/accessibility-axe.test.js` - axe-core integration tests
- `tests/accessibility.test.ts` - Custom accessibility utilities tests
- `scripts/lint-accessibility.js` - Static accessibility analysis

### 3. Performance Testing

**Purpose**: Ensures the design system meets performance requirements and doesn't degrade application performance.

**Technology**: Lighthouse with custom performance analysis

**Configuration**: `scripts/test-performance.js`

```bash
# Run performance tests
npm run test:performance
```

**Performance Thresholds**:
- Performance Score: ≥90
- Accessibility Score: ≥95
- Best Practices Score: ≥90
- SEO Score: ≥85

**Test Coverage**:
- Page load performance
- Bundle size analysis
- Critical CSS extraction validation
- Font loading optimization
- Layout shift measurement
- JavaScript execution time

**Test Pages**:
- Component demo page
- Layout examples
- Animation demonstrations
- React integration examples

### 4. Cross-Browser Testing

**Purpose**: Ensures consistent behavior across different browsers, devices, and screen sizes.

**Technology**: Playwright with extended browser matrix

**Configuration**: `playwright.cross-browser.config.js`

```bash
# Run cross-browser tests
npm run test:cross-browser
```

**Browser Matrix**:
- **Desktop**: Chrome, Firefox, Safari, Edge
- **Mobile**: Chrome Mobile, Safari Mobile
- **Tablet**: iPad Pro (portrait/landscape)
- **Screen Sizes**: 320px, 768px, 1200px, 1920px

**Test Coverage**:
- CSS Grid and Flexbox compatibility
- CSS Custom Properties support
- Modern CSS features with fallbacks
- Form element rendering
- JavaScript functionality
- Responsive behavior

**Test Files**:
- `tests/cross-browser/compatibility.spec.js` - Cross-browser compatibility tests

### 5. Design System Validation

**Purpose**: Ensures compliance with design system standards and consistency rules.

**Technology**: Custom validation scripts + Stylelint

**Configuration**: `.stylelintrc.js`, `scripts/validate-design-system.js`

```bash
# Run design system validation
npm run lint:design-system

# Run CSS linting
npm run lint:css

# Run all linting
npm run lint:all
```

**Validation Rules**:
- **Token Consistency**: Design tokens follow naming conventions
- **Component Consistency**: Components follow consistent patterns
- **CSS Compliance**: CSS uses design tokens and follows conventions
- **Documentation Completeness**: All components are documented
- **Build Output Validation**: Build outputs are complete and valid
- **Performance Validation**: Build outputs meet size requirements

## Configuration Files

### Playwright Configuration

```javascript
// playwright.config.js - Visual regression testing
module.exports = defineConfig({
  testDir: './tests/visual',
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 12'] } },
  ],
  webServer: {
    command: 'npm run serve:test',
    port: 3000,
  },
});
```

### Jest Configuration

```javascript
// jest.config.js - Unit and accessibility testing
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testMatch: ['<rootDir>/tests/**/*.(test|spec).(js|ts)'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
};
```

### Stylelint Configuration

```javascript
// .stylelintrc.js - CSS linting and design system compliance
module.exports = {
  extends: ['stylelint-config-standard'],
  rules: {
    // Design token compliance rules
    'declaration-property-value-allowed-list': {
      'color': ['/^var\\(--color-/', 'transparent', 'inherit'],
      'margin': ['/^var\\(--spacing-/', '0', 'auto'],
      'padding': ['/^var\\(--spacing-/', '0'],
    },
    // Custom property naming convention
    'custom-property-pattern': '^(color|font|spacing|border-radius|shadow|transition)-.+',
  },
};
```

## Test Data and Fixtures

### Test Server

The design system includes a built-in test server for running visual and performance tests:

```bash
# Start test server
npm run serve:test

# Server runs at http://localhost:3000
# Serves demo pages for testing
```

### Demo Pages

- `demo.html` - Main design system showcase
- `demo-components.html` - Individual component examples
- `demo-layout.html` - Layout and grid examples
- `demo-animations.html` - Animation and transition examples
- `demo-react.html` - React integration examples

## Continuous Integration

### GitHub Actions Integration

```yaml
# .github/workflows/test.yml
name: Test Design System
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run test:all
      - run: npm run lint:all
```

### Pre-commit Hooks

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint:all && npm run test",
      "pre-push": "npm run test:all"
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **Visual tests failing**: Update baselines with `npm run test:visual:update`
2. **Performance tests timing out**: Ensure test server is running with `npm run serve:test`
3. **Cross-browser tests failing**: Check browser compatibility for CSS features
4. **Accessibility tests failing**: Review WCAG guidelines and fix violations

### Debug Mode

```bash
# Run tests in debug mode
DEBUG=1 npm run test:visual

# Run with headed browser (visible)
npm run test:visual -- --headed

# Run specific test file
npx playwright test tests/visual/components.spec.js
```

### Test Reports

All test suites generate detailed reports in the `test-results/` directory:

- `visual-report/` - Visual regression test results with screenshots
- `cross-browser-report/` - Cross-browser compatibility results
- `performance-report-*.json` - Performance test results
- `accessibility-lint-*.json` - Accessibility analysis results
- `design-system-validation-*.json` - Design system validation results

## Best Practices

### Writing Tests

1. **Visual Tests**: Use data-testid attributes for reliable element selection
2. **Accessibility Tests**: Test with real user interactions, not just automated scans
3. **Performance Tests**: Test realistic scenarios with actual content
4. **Cross-browser Tests**: Focus on critical functionality and layout

### Maintaining Tests

1. **Regular Updates**: Update visual baselines when design changes are intentional
2. **Threshold Tuning**: Adjust performance thresholds based on real-world requirements
3. **Browser Matrix**: Update browser versions and add new devices as needed
4. **Documentation**: Keep test documentation up-to-date with changes

### Performance Optimization

1. **Parallel Execution**: Tests run in parallel for faster feedback
2. **Selective Testing**: Use test patterns to run specific test suites
3. **Caching**: Leverage CI caching for node_modules and Playwright browsers
4. **Resource Management**: Clean up test artifacts and manage disk space

## Integration with Development Workflow

### Local Development

```bash
# Watch mode for rapid development
npm run test:watch

# Quick validation during development
npm run lint && npm run test

# Full validation before commit
npm run test:all && npm run lint:all
```

### Code Review Process

1. All tests must pass before merge
2. Visual changes require updated baselines
3. Performance regressions must be justified
4. Accessibility violations must be fixed
5. Design system compliance is enforced

This comprehensive testing setup ensures the TicketIQ Design System maintains high quality, accessibility, and performance standards across all supported platforms and browsers.