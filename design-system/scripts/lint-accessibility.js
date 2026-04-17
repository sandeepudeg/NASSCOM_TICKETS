/**
 * TicketIQ Design System - Accessibility Linting
 * Static analysis for accessibility compliance
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Accessibility rules to check
const ACCESSIBILITY_RULES = {
  // Images must have alt text
  imagesWithoutAlt: {
    selector: 'img:not([alt])',
    message: 'Images must have alt attributes',
    severity: 'error'
  },
  
  // Form inputs must have labels
  inputsWithoutLabels: {
    selector: 'input:not([aria-label]):not([aria-labelledby])',
    message: 'Form inputs must have associated labels',
    severity: 'error',
    check: (element, document) => {
      const id = element.getAttribute('id');
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        return !!label;
      }
      return false;
    }
  },
  
  // Buttons must have accessible names
  buttonsWithoutNames: {
    selector: 'button:not([aria-label]):not([aria-labelledby])',
    message: 'Buttons must have accessible names',
    severity: 'error',
    check: (element) => {
      const textContent = element.textContent.trim();
      return textContent.length > 0;
    }
  },
  
  // Links must have accessible names
  linksWithoutNames: {
    selector: 'a[href]:not([aria-label]):not([aria-labelledby])',
    message: 'Links must have accessible names',
    severity: 'error',
    check: (element) => {
      const textContent = element.textContent.trim();
      return textContent.length > 0;
    }
  },
  
  // Headings should follow hierarchy
  headingHierarchy: {
    selector: 'h1, h2, h3, h4, h5, h6',
    message: 'Heading hierarchy should not skip levels',
    severity: 'warning',
    check: (element, document) => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      const currentIndex = headings.indexOf(element);
      
      if (currentIndex === 0) return true; // First heading is always valid
      
      const currentLevel = parseInt(element.tagName.charAt(1));
      const previousLevel = parseInt(headings[currentIndex - 1].tagName.charAt(1));
      
      // Should not skip more than one level
      return currentLevel <= previousLevel + 1;
    }
  },
  
  // Form fields should have proper ARIA attributes
  formFieldsWithoutAria: {
    selector: 'input[required], select[required], textarea[required]',
    message: 'Required form fields should have aria-required="true"',
    severity: 'warning',
    check: (element) => {
      return element.getAttribute('aria-required') === 'true';
    }
  },
  
  // Interactive elements should be keyboard accessible
  nonKeyboardAccessible: {
    selector: '[onclick]:not(button):not(a):not([tabindex])',
    message: 'Interactive elements should be keyboard accessible',
    severity: 'error'
  },
  
  // ARIA roles should be valid
  invalidAriaRoles: {
    selector: '[role]',
    message: 'ARIA roles should be valid',
    severity: 'error',
    check: (element) => {
      const validRoles = [
        'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
        'cell', 'checkbox', 'columnheader', 'combobox', 'complementary',
        'contentinfo', 'definition', 'dialog', 'directory', 'document',
        'feed', 'figure', 'form', 'grid', 'gridcell', 'group', 'heading',
        'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main',
        'marquee', 'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox',
        'menuitemradio', 'navigation', 'none', 'note', 'option', 'presentation',
        'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup',
        'rowheader', 'scrollbar', 'search', 'searchbox', 'separator',
        'slider', 'spinbutton', 'status', 'switch', 'tab', 'table',
        'tablist', 'tabpanel', 'term', 'textbox', 'timer', 'toolbar',
        'tooltip', 'tree', 'treegrid', 'treeitem'
      ];
      
      const role = element.getAttribute('role');
      return validRoles.includes(role);
    }
  },
  
  // Tables should have proper structure
  tablesWithoutHeaders: {
    selector: 'table:not(:has(th))',
    message: 'Tables should have header cells (th elements)',
    severity: 'warning'
  },
  
  // Color contrast warnings (basic check)
  lowContrastText: {
    selector: '*',
    message: 'Text may have insufficient color contrast',
    severity: 'warning',
    check: (element, document, window) => {
      // This is a simplified check - full contrast checking requires color parsing
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      // Skip if no text content
      if (!element.textContent.trim()) return true;
      
      // Basic check for obvious low contrast combinations
      const isLightText = color.includes('rgb(255') || color.includes('#fff');
      const isLightBackground = backgroundColor.includes('rgb(255') || backgroundColor.includes('#fff');
      
      // Flag potential issues
      return !(isLightText && isLightBackground);
    }
  }
};

function analyzeHtmlFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const dom = new JSDOM(content);
  const document = dom.window.document;
  const window = dom.window;
  
  const issues = [];
  
  Object.entries(ACCESSIBILITY_RULES).forEach(([ruleName, rule]) => {
    const elements = document.querySelectorAll(rule.selector);
    
    elements.forEach(element => {
      let hasIssue = true;
      
      if (rule.check) {
        hasIssue = !rule.check(element, document, window);
      }
      
      if (hasIssue) {
        issues.push({
          rule: ruleName,
          message: rule.message,
          severity: rule.severity,
          element: element.outerHTML.substring(0, 100) + '...',
          file: filePath
        });
      }
    });
  });
  
  return issues;
}

function analyzeCssFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  // Check for accessibility-related CSS issues
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    
    // Check for outline: none without alternative focus indicator
    if (line.includes('outline: none') || line.includes('outline:none')) {
      issues.push({
        rule: 'outline-none-without-alternative',
        message: 'outline: none should be accompanied by alternative focus indicator',
        severity: 'warning',
        line: lineNumber,
        content: line.trim(),
        file: filePath
      });
    }
    
    // Check for fixed font sizes that don't scale
    if (line.match(/font-size:\s*\d+px/) && !line.includes('rem') && !line.includes('em')) {
      issues.push({
        rule: 'fixed-font-size',
        message: 'Consider using relative units (rem, em) for better accessibility',
        severity: 'info',
        line: lineNumber,
        content: line.trim(),
        file: filePath
      });
    }
    
    // Check for insufficient line height
    const lineHeightMatch = line.match(/line-height:\s*([\d.]+)/);
    if (lineHeightMatch && parseFloat(lineHeightMatch[1]) < 1.2) {
      issues.push({
        rule: 'insufficient-line-height',
        message: 'Line height should be at least 1.2 for better readability',
        severity: 'warning',
        line: lineNumber,
        content: line.trim(),
        file: filePath
      });
    }
  });
  
  return issues;
}

function generateReport(allIssues) {
  const timestamp = new Date().toISOString();
  const groupedIssues = {};
  
  // Group issues by severity
  allIssues.forEach(issue => {
    if (!groupedIssues[issue.severity]) {
      groupedIssues[issue.severity] = [];
    }
    groupedIssues[issue.severity].push(issue);
  });
  
  const report = {
    timestamp,
    summary: {
      total: allIssues.length,
      error: (groupedIssues.error || []).length,
      warning: (groupedIssues.warning || []).length,
      info: (groupedIssues.info || []).length
    },
    issues: groupedIssues
  };
  
  return report;
}

function printReport(report) {
  console.log('\n🔍 Accessibility Lint Report');
  console.log('================================');
  console.log(`Generated: ${report.timestamp}`);
  console.log(`Total Issues: ${report.summary.total}`);
  console.log(`  Errors: ${report.summary.error}`);
  console.log(`  Warnings: ${report.summary.warning}`);
  console.log(`  Info: ${report.summary.info}`);
  
  if (report.summary.total === 0) {
    console.log('\n✅ No accessibility issues found!');
    return;
  }
  
  // Print issues by severity
  ['error', 'warning', 'info'].forEach(severity => {
    const issues = report.issues[severity] || [];
    if (issues.length === 0) return;
    
    console.log(`\n${severity.toUpperCase()} (${issues.length}):`);
    console.log('─'.repeat(50));
    
    issues.forEach(issue => {
      console.log(`\n📍 ${issue.rule}`);
      console.log(`   Message: ${issue.message}`);
      console.log(`   File: ${issue.file}`);
      
      if (issue.line) {
        console.log(`   Line: ${issue.line}`);
        console.log(`   Content: ${issue.content}`);
      } else if (issue.element) {
        console.log(`   Element: ${issue.element}`);
      }
    });
  });
}

async function lintAccessibility() {
  console.log('🚀 Starting accessibility linting...');
  
  const allIssues = [];
  
  // Analyze HTML files
  const htmlFiles = [
    'demo.html',
    'demo-components.html',
    'demo-layout.html',
    'demo-animations.html',
    'demo-react.html'
  ];
  
  htmlFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      console.log(`Analyzing HTML: ${file}`);
      const issues = analyzeHtmlFile(filePath);
      allIssues.push(...issues);
    }
  });
  
  // Analyze CSS files
  const cssFiles = [
    'dist/styles.css',
    'src/styles/index.css'
  ];
  
  cssFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      console.log(`Analyzing CSS: ${file}`);
      const issues = analyzeCssFile(filePath);
      allIssues.push(...issues);
    }
  });
  
  // Generate and print report
  const report = generateReport(allIssues);
  printReport(report);
  
  // Save report
  const reportsDir = path.join(__dirname, '../test-results');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  const reportPath = path.join(reportsDir, `accessibility-lint-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📋 Report saved: ${reportPath}`);
  
  // Exit with error code if there are errors
  if (report.summary.error > 0) {
    console.log('\n❌ Accessibility linting found errors!');
    process.exit(1);
  } else {
    console.log('\n✅ Accessibility linting completed successfully!');
  }
}

// Run if called directly
if (require.main === module) {
  // Add jsdom to dependencies if not present
  try {
    require('jsdom');
  } catch (e) {
    console.error('jsdom is required for accessibility linting. Install with: npm install --save-dev jsdom');
    process.exit(1);
  }
  
  lintAccessibility().catch(error => {
    console.error('Accessibility linting failed:', error);
    process.exit(1);
  });
}

module.exports = {
  lintAccessibility,
  analyzeHtmlFile,
  analyzeCssFile,
  generateReport,
  ACCESSIBILITY_RULES
};