/**
 * TicketIQ Design System - Automated Accessibility Testing
 * axe-core Integration for WCAG 2.1 AA Compliance
 */

const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

test.describe('Accessibility Testing with axe-core', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to component demo page
    await page.goto('/demo-components.html');
    await page.waitForLoadState('networkidle');
  });

  test('Component demo page should pass accessibility audit', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Button components should pass accessibility audit', async ({ page }) => {
    const buttonSection = page.locator('[data-testid="button-variants"]');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="button-variants"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Form components should pass accessibility audit', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="form-components"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Navigation components should pass accessibility audit', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="navigation-components"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Modal components should pass accessibility audit', async ({ page }) => {
    // Open modal
    await page.click('[data-testid="open-modal"]');
    await page.waitForSelector('[role="dialog"]');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Table components should pass accessibility audit', async ({ page }) => {
    await page.goto('/demo-components.html#tables');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="table-components"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.describe('Theme Accessibility Testing', () => {
  test('Dark theme should pass accessibility audit', async ({ page }) => {
    await page.goto('/demo-components.html');
    await page.waitForLoadState('networkidle');
    
    // Switch to dark theme
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    
    await page.waitForTimeout(100);
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Light theme should pass accessibility audit', async ({ page }) => {
    await page.goto('/demo-components.html');
    await page.waitForLoadState('networkidle');
    
    // Switch to light theme
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
    });
    
    await page.waitForTimeout(100);
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.describe('Responsive Accessibility Testing', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1200, height: 800 },
  ];

  viewports.forEach(({ name, width, height }) => {
    test(`${name} viewport should pass accessibility audit`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/demo-components.html');
      await page.waitForLoadState('networkidle');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });
});

test.describe('Interactive Accessibility Testing', () => {
  test('Keyboard navigation should be accessible', async ({ page }) => {
    await page.goto('/demo-components.html');
    await page.waitForLoadState('networkidle');
    
    // Test tab navigation through interactive elements
    const focusableElements = await page.locator('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])').all();
    
    for (let i = 0; i < Math.min(focusableElements.length, 10); i++) {
      await page.keyboard.press('Tab');
      
      // Check that focus is visible
      const focusedElement = await page.locator(':focus').first();
      const focusStyles = await focusedElement.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
          outlineStyle: styles.outlineStyle,
          boxShadow: styles.boxShadow,
        };
      });
      
      // Ensure focus is visible (either outline or box-shadow)
      const hasFocusIndicator = 
        focusStyles.outline !== 'none' || 
        focusStyles.outlineWidth !== '0px' ||
        focusStyles.boxShadow !== 'none';
      
      expect(hasFocusIndicator).toBe(true);
    }
  });

  test('Screen reader announcements should work', async ({ page }) => {
    await page.goto('/demo-components.html');
    await page.waitForLoadState('networkidle');
    
    // Check for live regions
    const liveRegions = await page.locator('[aria-live]').all();
    expect(liveRegions.length).toBeGreaterThan(0);
    
    // Test form validation announcements
    const form = page.locator('[data-testid="test-form"]');
    if (await form.count() > 0) {
      await page.click('[data-testid="form-submit"]');
      
      // Check that error messages are announced
      const errorMessages = await page.locator('[role="alert"], [aria-live="assertive"]').all();
      expect(errorMessages.length).toBeGreaterThan(0);
    }
  });

  test('Color contrast should meet WCAG AA standards', async ({ page }) => {
    await page.goto('/demo-components.html');
    await page.waitForLoadState('networkidle');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .withRules(['color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});