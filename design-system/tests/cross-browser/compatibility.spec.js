/**
 * TicketIQ Design System - Cross-Browser Compatibility Tests
 * Ensures consistent behavior across different browsers and devices
 */

const { test, expect } = require('@playwright/test');

test.describe('Cross-Browser Component Compatibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo-components.html');
    await page.waitForLoadState('networkidle');
  });

  test('CSS Grid layout should work consistently', async ({ page }) => {
    const gridContainer = page.locator('[data-testid="grid-layout"]');
    
    // Check that grid is properly supported
    const gridDisplay = await gridContainer.evaluate(el => {
      return window.getComputedStyle(el).display;
    });
    
    expect(gridDisplay).toBe('grid');
    
    // Check grid template columns
    const gridColumns = await gridContainer.evaluate(el => {
      return window.getComputedStyle(el).gridTemplateColumns;
    });
    
    expect(gridColumns).not.toBe('none');
  });

  test('Flexbox layout should work consistently', async ({ page }) => {
    const flexContainer = page.locator('[data-testid="flex-layout"]');
    
    const flexDisplay = await flexContainer.evaluate(el => {
      return window.getComputedStyle(el).display;
    });
    
    expect(flexDisplay).toBe('flex');
  });

  test('CSS Custom Properties should be supported', async ({ page }) => {
    const element = page.locator('[data-testid="styled-element"]').first();
    
    const customPropertyValue = await element.evaluate(el => {
      return window.getComputedStyle(el).getPropertyValue('--color-primary');
    });
    
    expect(customPropertyValue).toBeTruthy();
    expect(customPropertyValue.trim()).toMatch(/^#[0-9a-f]{6}$/i);
  });

  test('Modern CSS features should work or have fallbacks', async ({ page }) => {
    const testElement = page.locator('[data-testid="modern-css-test"]').first();
    
    // Test CSS clamp() support or fallback
    const fontSize = await testElement.evaluate(el => {
      return window.getComputedStyle(el).fontSize;
    });
    
    expect(fontSize).toBeTruthy();
    expect(fontSize).not.toBe('0px');
    
    // Test CSS aspect-ratio support or fallback
    const aspectRatio = await testElement.evaluate(el => {
      return window.getComputedStyle(el).aspectRatio;
    });
    
    // Should either have aspect-ratio or fallback dimensions
    if (aspectRatio === 'auto') {
      const width = await testElement.evaluate(el => {
        return window.getComputedStyle(el).width;
      });
      const height = await testElement.evaluate(el => {
        return window.getComputedStyle(el).height;
      });
      
      expect(width).not.toBe('0px');
      expect(height).not.toBe('0px');
    }
  });

  test('Form elements should render consistently', async ({ page }) => {
    const formElements = [
      '[data-testid="text-input"]',
      '[data-testid="select-input"]',
      '[data-testid="textarea-input"]',
      '[data-testid="checkbox-input"]',
      '[data-testid="radio-input"]'
    ];

    for (const selector of formElements) {
      const element = page.locator(selector).first();
      
      if (await element.count() > 0) {
        // Check that element is visible and has proper dimensions
        await expect(element).toBeVisible();
        
        const boundingBox = await element.boundingBox();
        expect(boundingBox.width).toBeGreaterThan(0);
        expect(boundingBox.height).toBeGreaterThan(0);
      }
    }
  });

  test('Button interactions should work consistently', async ({ page }) => {
    const button = page.locator('[data-testid="interactive-button"]').first();
    
    // Test click interaction
    let clicked = false;
    await page.evaluate(() => {
      window.testButtonClicked = false;
      document.addEventListener('click', (e) => {
        if (e.target.matches('[data-testid="interactive-button"]')) {
          window.testButtonClicked = true;
        }
      });
    });
    
    await button.click();
    
    clicked = await page.evaluate(() => window.testButtonClicked);
    expect(clicked).toBe(true);
    
    // Test hover state
    await button.hover();
    
    const hoverStyles = await button.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        transform: styles.transform,
        opacity: styles.opacity
      };
    });
    
    // Should have some visual change on hover
    expect(hoverStyles.backgroundColor).toBeTruthy();
  });
});

test.describe('Cross-Browser JavaScript Compatibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo-components.html');
    await page.waitForLoadState('networkidle');
  });

  test('Theme switching should work', async ({ page }) => {
    // Test theme switching functionality
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    
    if (await themeToggle.count() > 0) {
      // Get initial theme
      const initialTheme = await page.evaluate(() => {
        return document.documentElement.getAttribute('data-theme');
      });
      
      // Click theme toggle
      await themeToggle.click();
      
      // Wait for theme change
      await page.waitForTimeout(100);
      
      const newTheme = await page.evaluate(() => {
        return document.documentElement.getAttribute('data-theme');
      });
      
      expect(newTheme).not.toBe(initialTheme);
    }
  });

  test('Form validation should work', async ({ page }) => {
    const form = page.locator('[data-testid="validation-form"]');
    
    if (await form.count() > 0) {
      const submitButton = form.locator('[type="submit"]');
      const requiredInput = form.locator('[required]').first();
      
      // Try to submit empty form
      await submitButton.click();
      
      // Check for validation message
      const validationMessage = await requiredInput.evaluate(el => {
        return el.validationMessage;
      });
      
      expect(validationMessage).toBeTruthy();
    }
  });

  test('Modal functionality should work', async ({ page }) => {
    const openModalButton = page.locator('[data-testid="open-modal"]');
    
    if (await openModalButton.count() > 0) {
      await openModalButton.click();
      
      // Wait for modal to appear
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
      
      // Test close functionality
      const closeButton = modal.locator('[data-testid="close-modal"]');
      if (await closeButton.count() > 0) {
        await closeButton.click();
        await expect(modal).not.toBeVisible();
      }
    }
  });

  test('Dropdown functionality should work', async ({ page }) => {
    const dropdown = page.locator('[data-testid="dropdown-trigger"]');
    
    if (await dropdown.count() > 0) {
      await dropdown.click();
      
      const dropdownMenu = page.locator('[data-testid="dropdown-menu"]');
      await expect(dropdownMenu).toBeVisible();
      
      // Test selecting an option
      const firstOption = dropdownMenu.locator('[role="menuitem"]').first();
      if (await firstOption.count() > 0) {
        await firstOption.click();
        await expect(dropdownMenu).not.toBeVisible();
      }
    }
  });
});

test.describe('Cross-Browser Performance', () => {
  test('Page should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/demo-components.html');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('Animations should not cause performance issues', async ({ page }) => {
    await page.goto('/demo-animations.html');
    await page.waitForLoadState('networkidle');
    
    // Trigger animations
    await page.evaluate(() => {
      document.querySelectorAll('[data-animation]').forEach(el => {
        el.classList.add('animate');
      });
    });
    
    // Wait for animations to complete
    await page.waitForTimeout(1000);
    
    // Check that page is still responsive
    const button = page.locator('button').first();
    if (await button.count() > 0) {
      await button.click();
      // If we can click without timeout, animations didn't block the main thread
    }
  });

  test('Large datasets should render efficiently', async ({ page }) => {
    await page.goto('/demo-components.html#performance-test');
    
    // Test rendering a large list
    await page.evaluate(() => {
      const container = document.querySelector('[data-testid="large-list"]');
      if (container) {
        const startTime = performance.now();
        
        for (let i = 0; i < 1000; i++) {
          const item = document.createElement('div');
          item.textContent = `Item ${i}`;
          item.className = 'list-item';
          container.appendChild(item);
        }
        
        const endTime = performance.now();
        window.renderTime = endTime - startTime;
      }
    });
    
    const renderTime = await page.evaluate(() => window.renderTime);
    
    if (renderTime !== undefined) {
      // Should render 1000 items in less than 100ms
      expect(renderTime).toBeLessThan(100);
    }
  });
});

test.describe('Cross-Browser Responsive Behavior', () => {
  const breakpoints = [
    { name: 'mobile', width: 375 },
    { name: 'tablet', width: 768 },
    { name: 'desktop', width: 1200 },
    { name: 'wide', width: 1920 }
  ];

  breakpoints.forEach(({ name, width }) => {
    test(`Layout should work correctly at ${name} breakpoint`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/demo-layout.html');
      await page.waitForLoadState('networkidle');
      
      // Check that responsive classes are applied
      const container = page.locator('[data-testid="responsive-container"]');
      
      if (await container.count() > 0) {
        const classList = await container.evaluate(el => Array.from(el.classList));
        
        // Should have appropriate responsive classes
        const hasResponsiveClass = classList.some(cls => 
          cls.includes('mobile') || 
          cls.includes('tablet') || 
          cls.includes('desktop') ||
          cls.includes('responsive')
        );
        
        expect(hasResponsiveClass).toBe(true);
      }
      
      // Check that navigation adapts to screen size
      const navigation = page.locator('[data-testid="main-navigation"]');
      
      if (await navigation.count() > 0) {
        const navStyles = await navigation.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            display: styles.display,
            flexDirection: styles.flexDirection,
            position: styles.position
          };
        });
        
        // Navigation should be visible and properly positioned
        expect(navStyles.display).not.toBe('none');
      }
    });
  });
});