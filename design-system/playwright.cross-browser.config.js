/**
 * TicketIQ Design System - Cross-Browser Testing Configuration
 * Extended browser matrix for comprehensive compatibility testing
 */

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/cross-browser',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'test-results/cross-browser-report' }],
    ['json', { outputFile: 'test-results/cross-browser-results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Desktop browsers
    {
      name: 'chrome-latest',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox-latest',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'safari-latest',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'edge-latest',
      use: { ...devices['Desktop Edge'] },
    },

    // Mobile browsers
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'mobile-safari-landscape',
      use: { 
        ...devices['iPhone 12 landscape'],
      },
    },

    // Tablet browsers
    {
      name: 'tablet-chrome',
      use: { ...devices['iPad Pro'] },
    },
    {
      name: 'tablet-safari',
      use: { ...devices['iPad Pro landscape'] },
    },

    // Different screen sizes
    {
      name: 'desktop-1920',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'desktop-1366',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 },
      },
    },
    {
      name: 'mobile-320',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 320, height: 568 },
        isMobile: true,
      },
    },
  ],

  webServer: {
    command: 'npm run serve:test',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },

  expect: {
    threshold: 0.3, // More lenient for cross-browser differences
  },
});