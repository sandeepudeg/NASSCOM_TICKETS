/**
 * TicketIQ Design System - Performance Testing
 * Lighthouse Integration for Performance Validation
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  performance: 90,
  accessibility: 95,
  'best-practices': 90,
  seo: 85,
  pwa: 80,
};

// Test URLs
const TEST_URLS = [
  {
    name: 'Component Demo',
    url: 'http://localhost:3000/demo-components.html',
    description: 'Main component showcase page'
  },
  {
    name: 'Layout Demo',
    url: 'http://localhost:3000/demo-layout.html',
    description: 'Responsive layout examples'
  },
  {
    name: 'Animation Demo',
    url: 'http://localhost:3000/demo-animations.html',
    description: 'Animation and transition examples'
  },
  {
    name: 'React Integration',
    url: 'http://localhost:3000/demo-react.html',
    description: 'React component integration'
  }
];

// Lighthouse configuration
const lighthouseConfig = {
  extends: 'lighthouse:default',
  settings: {
    formFactor: 'desktop',
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0
    },
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
    emulatedUserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.109 Safari/537.36'
  }
};

async function runLighthouse(url, options = {}) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  
  try {
    const runnerResult = await lighthouse(url, {
      port: chrome.port,
      ...options
    }, lighthouseConfig);

    return runnerResult;
  } finally {
    await chrome.kill();
  }
}

function analyzeResults(lhr, thresholds = PERFORMANCE_THRESHOLDS) {
  const scores = {
    performance: Math.round(lhr.categories.performance.score * 100),
    accessibility: Math.round(lhr.categories.accessibility.score * 100),
    'best-practices': Math.round(lhr.categories['best-practices'].score * 100),
    seo: Math.round(lhr.categories.seo.score * 100),
  };

  // Add PWA score if available
  if (lhr.categories.pwa) {
    scores.pwa = Math.round(lhr.categories.pwa.score * 100);
  }

  const results = {
    scores,
    passed: true,
    failures: [],
    metrics: {}
  };

  // Check thresholds
  Object.entries(thresholds).forEach(([category, threshold]) => {
    if (scores[category] && scores[category] < threshold) {
      results.passed = false;
      results.failures.push({
        category,
        score: scores[category],
        threshold,
        message: `${category} score ${scores[category]} is below threshold ${threshold}`
      });
    }
  });

  // Extract key metrics
  const audits = lhr.audits;
  results.metrics = {
    'first-contentful-paint': audits['first-contentful-paint']?.numericValue,
    'largest-contentful-paint': audits['largest-contentful-paint']?.numericValue,
    'cumulative-layout-shift': audits['cumulative-layout-shift']?.numericValue,
    'total-blocking-time': audits['total-blocking-time']?.numericValue,
    'speed-index': audits['speed-index']?.numericValue,
    'interactive': audits['interactive']?.numericValue,
  };

  return results;
}

function generateReport(testResults) {
  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    summary: {
      totalTests: testResults.length,
      passed: testResults.filter(r => r.results.passed).length,
      failed: testResults.filter(r => r.results.passed === false).length,
    },
    tests: testResults,
    thresholds: PERFORMANCE_THRESHOLDS
  };

  // Create reports directory
  const reportsDir = path.join(__dirname, '../test-results');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Save detailed report
  const reportPath = path.join(reportsDir, `performance-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Save HTML report
  const htmlReport = generateHtmlReport(report);
  const htmlPath = path.join(reportsDir, `performance-report-${Date.now()}.html`);
  fs.writeFileSync(htmlPath, htmlReport);

  return { report, reportPath, htmlPath };
}

function generateHtmlReport(report) {
  const { summary, tests, thresholds } = report;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TicketIQ Design System - Performance Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 2rem; }
        .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 1rem; margin-bottom: 2rem; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .summary-card { padding: 1rem; border-radius: 8px; border: 1px solid #e5e7eb; }
        .passed { background-color: #f0fdf4; border-color: #22c55e; }
        .failed { background-color: #fef2f2; border-color: #ef4444; }
        .test-result { margin-bottom: 2rem; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 8px; }
        .scores { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin: 1rem 0; }
        .score { text-align: center; padding: 0.5rem; border-radius: 4px; }
        .score.good { background-color: #22c55e; color: white; }
        .score.average { background-color: #f59e0b; color: white; }
        .score.poor { background-color: #ef4444; color: white; }
        .metrics { margin-top: 1rem; }
        .metric { display: flex; justify-content: space-between; padding: 0.25rem 0; }
        .failures { margin-top: 1rem; }
        .failure { padding: 0.5rem; background-color: #fef2f2; border-left: 4px solid #ef4444; margin-bottom: 0.5rem; }
    </style>
</head>
<body>
    <div class="header">
        <h1>TicketIQ Design System - Performance Report</h1>
        <p>Generated: ${report.timestamp}</p>
    </div>
    
    <div class="summary">
        <div class="summary-card ${summary.failed === 0 ? 'passed' : 'failed'}">
            <h3>Overall Status</h3>
            <p>${summary.failed === 0 ? '✅ All tests passed' : `❌ ${summary.failed} tests failed`}</p>
        </div>
        <div class="summary-card">
            <h3>Test Results</h3>
            <p>${summary.passed}/${summary.totalTests} tests passed</p>
        </div>
    </div>

    ${tests.map(test => `
        <div class="test-result">
            <h2>${test.name} ${test.results.passed ? '✅' : '❌'}</h2>
            <p>${test.description}</p>
            <p><strong>URL:</strong> ${test.url}</p>
            
            <div class="scores">
                ${Object.entries(test.results.scores).map(([category, score]) => {
                  const scoreClass = score >= 90 ? 'good' : score >= 70 ? 'average' : 'poor';
                  return `<div class="score ${scoreClass}">
                    <div><strong>${category.toUpperCase()}</strong></div>
                    <div>${score}/100</div>
                  </div>`;
                }).join('')}
            </div>
            
            <div class="metrics">
                <h4>Key Metrics</h4>
                ${Object.entries(test.results.metrics).map(([metric, value]) => `
                    <div class="metric">
                        <span>${metric.replace(/-/g, ' ').toUpperCase()}</span>
                        <span>${value ? Math.round(value) + 'ms' : 'N/A'}</span>
                    </div>
                `).join('')}
            </div>
            
            ${test.results.failures.length > 0 ? `
                <div class="failures">
                    <h4>Failures</h4>
                    ${test.results.failures.map(failure => `
                        <div class="failure">
                            <strong>${failure.category}:</strong> ${failure.message}
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `).join('')}
</body>
</html>`;
}

async function runPerformanceTests() {
  console.log('🚀 Starting performance tests...');
  
  const testResults = [];
  
  for (const testCase of TEST_URLS) {
    console.log(`\n📊 Testing: ${testCase.name}`);
    console.log(`   URL: ${testCase.url}`);
    
    try {
      const runnerResult = await runLighthouse(testCase.url);
      const results = analyzeResults(runnerResult.lhr);
      
      testResults.push({
        ...testCase,
        results,
        timestamp: new Date().toISOString()
      });
      
      console.log(`   Performance: ${results.scores.performance}/100`);
      console.log(`   Accessibility: ${results.scores.accessibility}/100`);
      console.log(`   Best Practices: ${results.scores['best-practices']}/100`);
      console.log(`   SEO: ${results.scores.seo}/100`);
      console.log(`   Status: ${results.passed ? '✅ PASSED' : '❌ FAILED'}`);
      
      if (!results.passed) {
        console.log('   Failures:');
        results.failures.forEach(failure => {
          console.log(`     - ${failure.message}`);
        });
      }
      
    } catch (error) {
      console.error(`   ❌ Error testing ${testCase.name}:`, error.message);
      testResults.push({
        ...testCase,
        results: {
          passed: false,
          error: error.message,
          scores: {},
          metrics: {},
          failures: [{ message: `Test failed: ${error.message}` }]
        },
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // Generate report
  const { report, reportPath, htmlPath } = generateReport(testResults);
  
  console.log('\n📋 Performance Test Summary:');
  console.log(`   Total Tests: ${report.summary.totalTests}`);
  console.log(`   Passed: ${report.summary.passed}`);
  console.log(`   Failed: ${report.summary.failed}`);
  console.log(`   Report saved: ${reportPath}`);
  console.log(`   HTML Report: ${htmlPath}`);
  
  // Exit with error code if any tests failed
  if (report.summary.failed > 0) {
    console.log('\n❌ Some performance tests failed!');
    process.exit(1);
  } else {
    console.log('\n✅ All performance tests passed!');
  }
}

// Run tests if called directly
if (require.main === module) {
  runPerformanceTests().catch(error => {
    console.error('Performance testing failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runPerformanceTests,
  runLighthouse,
  analyzeResults,
  generateReport,
  PERFORMANCE_THRESHOLDS
};