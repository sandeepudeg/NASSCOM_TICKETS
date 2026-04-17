#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const versionType = process.argv[2] || 'patch';
const validTypes = ['patch', 'minor', 'major', 'prerelease'];

if (!validTypes.includes(versionType)) {
  console.error(`❌ Invalid version type: ${versionType}`);
  console.error(`Valid types: ${validTypes.join(', ')}`);
  process.exit(1);
}

console.log(`🔄 Preparing ${versionType} version release...\n`);

try {
  // Step 1: Run tests and linting
  console.log('🧪 Running tests...');
  execSync('npm test', { stdio: 'inherit' });
  
  console.log('🔍 Running linting...');
  execSync('npm run lint', { stdio: 'inherit' });
  
  // Step 2: Build the project
  console.log('🏗️  Building project...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Step 3: Update version
  console.log(`📈 Bumping ${versionType} version...`);
  const versionOutput = execSync(`npm version ${versionType} --no-git-tag-version`, { encoding: 'utf8' });
  const newVersion = versionOutput.trim();
  
  // Step 4: Update changelog
  console.log('📝 Updating changelog...');
  updateChangelog(newVersion);
  
  // Step 5: Update version in source files
  console.log('🔄 Updating version references...');
  updateVersionReferences(newVersion);
  
  // Step 6: Commit changes
  console.log('💾 Committing changes...');
  execSync('git add -A', { stdio: 'inherit' });
  execSync(`git commit -m "chore: release ${newVersion}"`, { stdio: 'inherit' });
  execSync(`git tag ${newVersion}`, { stdio: 'inherit' });
  
  console.log(`\n✅ Version ${newVersion} prepared successfully!`);
  console.log('\n📋 Next steps:');
  console.log('  1. Review the changes');
  console.log('  2. Push to repository: git push && git push --tags');
  console.log('  3. Publish to npm: npm publish');
  
} catch (error) {
  console.error('\n❌ Version preparation failed:', error.message);
  process.exit(1);
}

function updateChangelog(version) {
  const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
  const changelog = fs.readFileSync(changelogPath, 'utf8');
  
  const today = new Date().toISOString().split('T')[0];
  const versionHeader = `## [${version.replace('v', '')}] - ${today}`;
  
  // Replace [Unreleased] with the new version
  const updatedChangelog = changelog.replace(
    '## [Unreleased]',
    `## [Unreleased]\n\n${versionHeader}`
  );
  
  fs.writeFileSync(changelogPath, updatedChangelog);
}

function updateVersionReferences(version) {
  // Update version in src/index.ts
  const indexPath = path.join(__dirname, '..', 'src', 'index.ts');
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  const updatedIndexContent = indexContent.replace(
    /export const VERSION = '[^']+';/,
    `export const VERSION = '${version.replace('v', '')}';`
  );
  fs.writeFileSync(indexPath, updatedIndexContent);
  
  // Rebuild to update dist files
  execSync('npm run build:js', { stdio: 'inherit' });
}