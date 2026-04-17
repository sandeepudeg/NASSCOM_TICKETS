/**
 * TicketIQ Design System - Design System Validation
 * Ensures compliance with design system standards and consistency
 */

const fs = require('fs');
const path = require('path');

// Design system validation rules
const VALIDATION_RULES = {
  // Token validation
  tokenConsistency: {
    name: 'Token Consistency',
    description: 'All design tokens should follow naming conventions and be properly structured',
    check: (context) => {
      const issues = [];
      const tokensPath = path.join(context.rootDir, 'dist/json/tokens.json');
      
      if (!fs.existsSync(tokensPath)) {
        issues.push({
          severity: 'error',
          message: 'Design tokens file not found',
          file: tokensPath
        });
        return issues;
      }
      
      const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
      
      // Check color tokens
      if (!tokens.color || !tokens.color.primary) {
        issues.push({
          severity: 'error',
          message: 'Primary color token is missing',
          category: 'color'
        });
      }
      
      // Check spacing tokens follow 4px base unit
      if (tokens.spacing) {
        Object.entries(tokens.spacing).forEach(([key, value]) => {
          if (typeof value === 'string' && value.endsWith('rem')) {
            const remValue = parseFloat(value);
            const pxValue = remValue * 16; // Assuming 1rem = 16px
            
            if (key !== '0' && pxValue % 4 !== 0) {
              issues.push({
                severity: 'warning',
                message: `Spacing token '${key}' (${value}) doesn't follow 4px base unit`,
                category: 'spacing'
              });
            }
          }
        });
      }
      
      // Check typography tokens
      if (!tokens.font || !tokens.font.family || !tokens.font.family.sans) {
        issues.push({
          severity: 'error',
          message: 'Sans-serif font family token is missing',
          category: 'typography'
        });
      }
      
      return issues;
    }
  },
  
  // Component consistency
  componentConsistency: {
    name: 'Component Consistency',
    description: 'Components should follow consistent patterns and naming',
    check: (context) => {
      const issues = [];
      const componentsDir = path.join(context.rootDir, 'src/components');
      
      if (!fs.existsSync(componentsDir)) {
        issues.push({
          severity: 'warning',
          message: 'Components directory not found',
          file: componentsDir
        });
        return issues;
      }
      
      // Check component file structure
      const componentFiles = fs.readdirSync(componentsDir, { withFileTypes: true })
        .filter(dirent => dirent.isFile() && dirent.name.endsWith('.tsx'))
        .map(dirent => dirent.name);
      
      componentFiles.forEach(file => {
        const filePath = path.join(componentsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for proper TypeScript interfaces
        if (!content.includes('interface') && !content.includes('type')) {
          issues.push({
            severity: 'warning',
            message: `Component ${file} should have TypeScript interfaces`,
            file: filePath
          });
        }
        
        // Check for accessibility props
        if (!content.includes('aria-') && !content.includes('role=')) {
          issues.push({
            severity: 'info',
            message: `Component ${file} may be missing accessibility attributes`,
            file: filePath
          });
        }
      });
      
      return issues;
    }
  },
  
  // CSS validation
  cssConsistency: {
    name: 'CSS Consistency',
    description: 'CSS should use design tokens and follow conventions',
    check: (context) => {
      const issues = [];
      const cssFiles = [
        'dist/styles.css',
        'src/styles/index.css'
      ];
      
      cssFiles.forEach(file => {
        const filePath = path.join(context.rootDir, file);
        
        if (!fs.existsSync(filePath)) return;
        
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          const lineNumber = index + 1;
          
          // Check for hardcoded colors
          const colorMatch = line.match(/#[0-9a-f]{6}/gi);
          if (colorMatch) {
            // Allow specific design system colors
            const allowedColors = ['#4f46e5', '#ffffff', '#000000'];
            const hasDisallowedColor = colorMatch.some(color => 
              !allowedColors.includes(color.toLowerCase())
            );
            
            if (hasDisallowedColor) {
              issues.push({
                severity: 'warning',
                message: `Hardcoded color found: ${colorMatch.join(', ')}. Consider using design tokens.`,
                file: filePath,
                line: lineNumber,
                content: line.trim()
              });
            }
          }
          
          // Check for hardcoded spacing
          const spacingMatch = line.match(/(?:margin|padding|gap):\s*\d+px/);
          if (spacingMatch) {
            issues.push({
              severity: 'info',
              message: 'Hardcoded spacing found. Consider using design tokens.',
              file: filePath,
              line: lineNumber,
              content: line.trim()
            });
          }
          
          // Check for !important usage
          if (line.includes('!important')) {
            issues.push({
              severity: 'warning',
              message: 'Avoid using !important. Consider refactoring CSS specificity.',
              file: filePath,
              line: lineNumber,
              content: line.trim()
            });
          }
        });
      });
      
      return issues;
    }
  },
  
  // Documentation validation
  documentationCompleteness: {
    name: 'Documentation Completeness',
    description: 'All components and features should be documented',
    check: (context) => {
      const issues = [];
      const docsDir = path.join(context.rootDir, 'docs');
      
      if (!fs.existsSync(docsDir)) {
        issues.push({
          severity: 'error',
          message: 'Documentation directory not found',
          file: docsDir
        });
        return issues;
      }
      
      // Check for required documentation files
      const requiredDocs = [
        'README.md',
        'GETTING_STARTED.md',
        'COMPONENTS.md',
        'TOKENS.md'
      ];
      
      requiredDocs.forEach(doc => {
        const docPath = path.join(docsDir, doc);
        if (!fs.existsSync(docPath)) {
          issues.push({
            severity: 'warning',
            message: `Required documentation file missing: ${doc}`,
            file: docPath
          });
        }
      });
      
      return issues;
    }
  },
  
  // Build output validation
  buildOutputValidation: {
    name: 'Build Output Validation',
    description: 'Build outputs should be complete and properly structured',
    check: (context) => {
      const issues = [];
      const distDir = path.join(context.rootDir, 'dist');
      
      if (!fs.existsSync(distDir)) {
        issues.push({
          severity: 'error',
          message: 'Distribution directory not found. Run build first.',
          file: distDir
        });
        return issues;
      }
      
      // Check for required build outputs
      const requiredOutputs = [
        'styles.css',
        'styles.min.css',
        'index.js',
        'index.esm.js',
        'json/tokens.json',
        'css/variables.css'
      ];
      
      requiredOutputs.forEach(output => {
        const outputPath = path.join(distDir, output);
        if (!fs.existsSync(outputPath)) {
          issues.push({
            severity: 'error',
            message: `Required build output missing: ${output}`,
            file: outputPath
          });
        } else {
          // Check file size (should not be empty)
          const stats = fs.statSync(outputPath);
          if (stats.size === 0) {
            issues.push({
              severity: 'error',
              message: `Build output is empty: ${output}`,
              file: outputPath
            });
          }
        }
      });
      
      return issues;
    }
  },
  
  // Performance validation
  performanceValidation: {
    name: 'Performance Validation',
    description: 'Build outputs should meet performance requirements',
    check: (context) => {
      const issues = [];
      const distDir = path.join(context.rootDir, 'dist');
      
      if (!fs.existsSync(distDir)) return issues;
      
      // Check CSS file sizes
      const cssPath = path.join(distDir, 'styles.css');
      const minCssPath = path.join(distDir, 'styles.min.css');
      
      if (fs.existsSync(cssPath)) {
        const cssStats = fs.statSync(cssPath);
        const cssSize = cssStats.size / 1024; // KB
        
        if (cssSize > 500) { // 500KB threshold
          issues.push({
            severity: 'warning',
            message: `CSS file is large (${cssSize.toFixed(1)}KB). Consider optimization.`,
            file: cssPath
          });
        }
        
        if (fs.existsSync(minCssPath)) {
          const minCssStats = fs.statSync(minCssPath);
          const minCssSize = minCssStats.size / 1024;
          const compressionRatio = (cssSize - minCssSize) / cssSize;
          
          if (compressionRatio < 0.3) { // Less than 30% compression
            issues.push({
              severity: 'info',
              message: `CSS compression ratio is low (${(compressionRatio * 100).toFixed(1)}%). Check for optimization opportunities.`,
              file: minCssPath
            });
          }
        }
      }
      
      return issues;
    }
  }
};

function validateDesignSystem(rootDir = process.cwd()) {
  console.log('🔍 Validating design system...');
  
  const context = { rootDir };
  const allIssues = [];
  
  Object.entries(VALIDATION_RULES).forEach(([ruleKey, rule]) => {
    console.log(`\nChecking: ${rule.name}`);
    
    try {
      const issues = rule.check(context);
      issues.forEach(issue => {
        issue.rule = ruleKey;
        issue.ruleName = rule.name;
      });
      allIssues.push(...issues);
      
      if (issues.length === 0) {
        console.log('  ✅ Passed');
      } else {
        console.log(`  ⚠️  ${issues.length} issues found`);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      allIssues.push({
        rule: ruleKey,
        ruleName: rule.name,
        severity: 'error',
        message: `Validation error: ${error.message}`
      });
    }
  });
  
  return generateValidationReport(allIssues);
}

function generateValidationReport(issues) {
  const timestamp = new Date().toISOString();
  const groupedIssues = {};
  
  // Group issues by severity
  issues.forEach(issue => {
    if (!groupedIssues[issue.severity]) {
      groupedIssues[issue.severity] = [];
    }
    groupedIssues[issue.severity].push(issue);
  });
  
  const report = {
    timestamp,
    summary: {
      total: issues.length,
      error: (groupedIssues.error || []).length,
      warning: (groupedIssues.warning || []).length,
      info: (groupedIssues.info || []).length
    },
    issues: groupedIssues,
    passed: (groupedIssues.error || []).length === 0
  };
  
  return report;
}

function printValidationReport(report) {
  console.log('\n📋 Design System Validation Report');
  console.log('===================================');
  console.log(`Generated: ${report.timestamp}`);
  console.log(`Total Issues: ${report.summary.total}`);
  console.log(`  Errors: ${report.summary.error}`);
  console.log(`  Warnings: ${report.summary.warning}`);
  console.log(`  Info: ${report.summary.info}`);
  
  if (report.summary.total === 0) {
    console.log('\n✅ Design system validation passed!');
    return;
  }
  
  // Print issues by severity
  ['error', 'warning', 'info'].forEach(severity => {
    const issues = report.issues[severity] || [];
    if (issues.length === 0) return;
    
    console.log(`\n${severity.toUpperCase()} (${issues.length}):`);
    console.log('─'.repeat(50));
    
    issues.forEach(issue => {
      console.log(`\n📍 ${issue.ruleName}`);
      console.log(`   Message: ${issue.message}`);
      
      if (issue.file) {
        console.log(`   File: ${issue.file}`);
      }
      
      if (issue.line) {
        console.log(`   Line: ${issue.line}`);
      }
      
      if (issue.content) {
        console.log(`   Content: ${issue.content}`);
      }
      
      if (issue.category) {
        console.log(`   Category: ${issue.category}`);
      }
    });
  });
}

async function runValidation() {
  const report = validateDesignSystem();
  printValidationReport(report);
  
  // Save report
  const reportsDir = path.join(process.cwd(), 'test-results');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  const reportPath = path.join(reportsDir, `design-system-validation-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📋 Report saved: ${reportPath}`);
  
  // Exit with error code if there are errors
  if (!report.passed) {
    console.log('\n❌ Design system validation failed!');
    process.exit(1);
  } else {
    console.log('\n✅ Design system validation passed!');
  }
}

// Run if called directly
if (require.main === module) {
  runValidation().catch(error => {
    console.error('Design system validation failed:', error);
    process.exit(1);
  });
}

module.exports = {
  validateDesignSystem,
  generateValidationReport,
  printValidationReport,
  VALIDATION_RULES
};