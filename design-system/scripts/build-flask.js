#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Build script for Flask integration
 * Copies Flask-specific files to the distribution directory
 */

const srcDir = path.join(__dirname, '..', 'src', 'flask');
const distDir = path.join(__dirname, '..', 'dist', 'flask');

// Ensure dist/flask directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Create subdirectories
const subdirs = ['css', 'macros', 'templates', 'static'];
subdirs.forEach(dir => {
  const dirPath = path.join(distDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Copy CSS files
const cssFiles = [
  'static/css/design-system-variables.css',
  'static/css/ticketiq-flask.css',
  'static/css/themes.css'
];

cssFiles.forEach(file => {
  const srcPath = path.join(srcDir, file);
  const distPath = path.join(distDir, 'css', path.basename(file));
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, distPath);
    console.log(`✓ Copied ${file} to dist/flask/css/`);
  } else {
    console.warn(`⚠ File not found: ${srcPath}`);
  }
});

// Copy macro files
const macroFiles = [
  'macros/components.html',
  'macros/forms.html',
  'macros/layout.html'
];

macroFiles.forEach(file => {
  const srcPath = path.join(srcDir, file);
  const distPath = path.join(distDir, file);
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, distPath);
    console.log(`✓ Copied ${file} to dist/flask/`);
  } else {
    console.warn(`⚠ File not found: ${srcPath}`);
  }
});

// Copy template examples
const templateFiles = [
  'templates/base.html',
  'templates/dashboard.html',
  'templates/form-example.html'
];

templateFiles.forEach(file => {
  const srcPath = path.join(srcDir, file);
  const distPath = path.join(distDir, file);
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, distPath);
    console.log(`✓ Copied ${file} to dist/flask/`);
  } else {
    console.warn(`⚠ File not found: ${srcPath}`);
  }
});

// Copy SCSS files for advanced users
const scssDir = path.join(distDir, 'scss');
if (!fs.existsSync(scssDir)) {
  fs.mkdirSync(scssDir, { recursive: true });
}

const scssFiles = [
  'bootstrap-overrides/main.scss',
  'bootstrap-overrides/variables.scss',
  'bootstrap-overrides/components.scss',
  'bootstrap-overrides/utilities.scss',
  'tokens/scss-variables.scss'
];

scssFiles.forEach(file => {
  const srcPath = path.join(srcDir, file);
  const distPath = path.join(scssDir, path.basename(file));
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, distPath);
    console.log(`✓ Copied ${file} to dist/flask/scss/`);
  } else {
    console.warn(`⚠ File not found: ${srcPath}`);
  }
});

// Copy documentation
const docFiles = [
  'README.md',
  'FLASK_INTEGRATION_GUIDE.md'
];

docFiles.forEach(file => {
  const srcPath = path.join(srcDir, file);
  const distPath = path.join(distDir, file);
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, distPath);
    console.log(`✓ Copied ${file} to dist/flask/`);
  } else {
    console.warn(`⚠ File not found: ${srcPath}`);
  }
});

// Create Flask package.json for npm distribution
const flaskPackageJson = {
  name: '@ticketiq/design-system-flask',
  version: '1.0.0',
  description: 'TicketIQ Design System - Flask Integration',
  main: 'css/ticketiq-flask.css',
  files: [
    'css/',
    'macros/',
    'templates/',
    'scss/',
    '*.md'
  ],
  keywords: [
    'design-system',
    'flask',
    'jinja2',
    'bootstrap',
    'css',
    'ui-components'
  ],
  author: 'TicketIQ Team',
  license: 'MIT',
  repository: {
    type: 'git',
    url: 'https://github.com/ticketiq/design-system.git',
    directory: 'flask'
  },
  peerDependencies: {
    'bootstrap': '^5.3.0'
  }
};

fs.writeFileSync(
  path.join(distDir, 'package.json'),
  JSON.stringify(flaskPackageJson, null, 2)
);

console.log('✓ Created Flask package.json');

// Create installation instructions
const installInstructions = `# Flask Integration Installation

## Option 1: Copy Files Manually

Copy the following files to your Flask application:

### CSS Files (required)
- \`css/design-system-variables.css\` → \`static/css/\`
- \`css/ticketiq-flask.css\` → \`static/css/\`
- \`css/themes.css\` → \`static/css/\`

### Jinja2 Macros (required)
- \`macros/\` → \`templates/macros/\`

### Example Templates (optional)
- \`templates/\` → \`templates/examples/\`

## Option 2: NPM Package (if published)

\`\`\`bash
npm install @ticketiq/design-system-flask
\`\`\`

## Option 3: SCSS Integration (advanced)

Use the SCSS files in \`scss/\` directory for custom builds with your own Bootstrap setup.

## Quick Start

1. Include Bootstrap 5 CSS
2. Include design system CSS files
3. Import macros in your templates
4. Use design system components

See \`FLASK_INTEGRATION_GUIDE.md\` for detailed instructions.
`;

fs.writeFileSync(path.join(distDir, 'INSTALL.md'), installInstructions);
console.log('✓ Created installation instructions');

console.log('\n🎉 Flask integration build completed successfully!');
console.log(`📁 Files available in: ${distDir}`);
console.log('\nNext steps:');
console.log('1. Test the Flask integration with example templates');
console.log('2. Update main package.json to include Flask build');
console.log('3. Add Flask integration to CI/CD pipeline');