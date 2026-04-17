/**
 * TicketIQ Design System - Visual Regression Tests
 * Component Consistency Testing
 */

const { test, expect } = require('@playwright/test');

test.describe('Component Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to component demo page
    await page.goto('/demo-components.html');
    
    // Wait for fonts to load
    await page.waitForLoadState('networkidle');
    
    // Disable animations for consistent screenshots
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    });
  });

  test('Button variants should render consistently', async ({ page }) => {
    const buttonSection = page.locator('[data-testid="button-variants"]');
    await expect(buttonSection).toHaveScreenshot('button-variants.png');
  });

  test('Input components should render consistently', async ({ page }) => {
    const inputSection = page.locator('[data-testid="input-components"]');
    await expect(inputSection).toHaveScreenshot('input-components.png');
  });

  test('Card components should render consistently', async ({ page }) => {
    const cardSection = page.locator('[data-testid="card-components"]');
    await expect(cardSection).toHaveScreenshot('card-components.png');
  });

  test('Navigation components should render consistently', async ({ page }) => {
    const navSection = page.locator('[data-testid="navigation-components"]');
    await expect(navSection).toHaveScreenshot('navigation-components.png');
  });

  test('Form components should render consistently', async ({ page }) => {
    const formSection = page.locator('[data-testid="form-components"]');
    await expect(formSection).toHaveScreenshot('form-components.png');
  });

  test('Feedback components should render consistently', async ({ page }) => {
    const feedbackSection = page.locator('[data-testid="feedback-components"]');
    await expect(feedbackSection).toHaveScreenshot('feedback-components.png');
  });

  test('Layout components should render consistently', async ({ page }) => {
    const layoutSection = page.locator('[data-testid="layout-components"]');
    await expect(layoutSection).toHaveScreenshot('layout-components.png');
  });

  test('Badge and status components should render consistently', async ({ page }) => {
    const badgeSection = page.locator('[data-testid="badge-components"]');
    await expect(badgeSection).toHaveScreenshot('badge-components.png');
  });
});

test.describe('Theme Visual Regression', () => {
  test('Dark theme should render consistently', async ({ page }) => {
    await page.goto('/demo-components.html');
    await page.waitForLoadState('networkidle');
    
    // Switch to dark theme
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    
    // Wait for theme transition
    await page.waitForTimeout(100);
    
    const mainContent = page.locator('main');
    await expect(mainContent).toHaveScreenshot('dark-theme-components.png');
  });

  test('Light theme should render consistently', async ({ page }) => {
    await page.goto('/demo-components.html');
    await page.waitForLoadState('networkidle');
    
    // Switch to light theme
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
    });
    
    // Wait for theme transition
    await page.waitForTimeout(100);
    
    const mainContent = page.locator('main');
    await expect(mainContent).toHaveScreenshot('light-theme-components.png');
  });
});

test.describe('Responsive Visual Regression', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1200, height: 800 },
    { name: 'wide', width: 1920, height: 1080 },
  ];

  viewports.forEach(({ name, width, height }) => {
    test(`Components should render consistently on ${name}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/demo-layout.html');
      await page.waitForLoadState('networkidle');
      
      const mainContent = page.locator('main');
      await expect(mainContent).toHaveScreenshot(`${name}-layout.png`);
    });
  });
});

test.describe('Interactive State Visual Regression', () => {
  test('Button hover states should render consistently', async ({ page }) => {
    await page.goto('/demo-components.html');
    await page.waitForLoadState('networkidle');
    
    const primaryButton = page.locator('[data-testid="primary-button"]').first();
    await primaryButton.hover();
    
    const buttonSection = page.locator('[data-testid="button-variants"]');
    await expect(buttonSection).toHaveScreenshot('button-hover-state.png');
  });

  test('Input focus states should render consistently', async ({ page }) => {
    await page.goto('/demo-components.html');
    await page.waitForLoadState('networkidle');
    
    const textInput = page.locator('[data-testid="text-input"]').first();
    await textInput.focus();
    
    const inputSection = page.locator('[data-testid="input-components"]');
    await expect(inputSection).toHaveScreenshot('input-focus-state.png');
  });

  test('Form validation states should render consistently', async ({ page }) => {
    await page.goto('/demo-components.html');
    await page.waitForLoadState('networkidle');
    
    // Trigger validation by submitting empty form
    const submitButton = page.locator('[data-testid="form-submit"]');
    await submitButton.click();
    
    const formSection = page.locator('[data-testid="form-components"]');
    await expect(formSection).toHaveScreenshot('form-validation-state.png');
  });
});

test.describe('Animation Visual Regression', () => {
  test('Loading states should render consistently', async ({ page }) => {
    await page.goto('/demo-animations.html');
    await page.waitForLoadState('networkidle');
    
    // Trigger loading state
    await page.evaluate(() => {
      document.querySelectorAll('[data-testid*="loading"]').forEach(el => {
        el.classList.add('loading');
      });
    });
    
    const loadingSection = page.locator('[data-testid="loading-states"]');
    await expect(loadingSection).toHaveScreenshot('loading-states.png');
  });

  test('Transition states should render consistently', async ({ page }) => {
    await page.goto('/demo-animations.html');
    await page.waitForLoadState('networkidle');
    
    const transitionSection = page.locator('[data-testid="transition-examples"]');
    await expect(transitionSection).toHaveScreenshot('transition-states.png');
  });
});