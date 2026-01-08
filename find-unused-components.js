#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Find all component files
function findComponentFiles(dir) {
  const components = [];

  function walk(currentDir) {
    const files = fs.readdirSync(currentDir);

    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        walk(filePath);
      } else if (file.endsWith('.component.ts')) {
        components.push(filePath);
      }
    }
  }

  walk(dir);
  return components;
}

// Extract component metadata
function getComponentInfo(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const selectorMatch = content.match(/selector:\s*['"`]([^'"`]+)['"`]/);
  const classMatch = content.match(/export\s+class\s+(\w+)/);

  return {
    filePath,
    selector: selectorMatch ? selectorMatch[1] : null,
    className: classMatch ? classMatch[1] : null
  };
}

// Check if component is used
function isComponentUsed(component, srcDir) {
  const { selector, className } = component;

  // Check for selector usage in HTML templates
  if (selector) {
    const selectorRegex = new RegExp(`<${selector}[\\s>]`, 'g');
    const htmlFiles = getAllFiles(srcDir, '.html');

    for (const htmlFile of htmlFiles) {
      const content = fs.readFileSync(htmlFile, 'utf8');
      if (selectorRegex.test(content)) {
        return { used: true, reason: `Selector used in ${htmlFile}` };
      }
    }
  }

  // Check for class imports/usage in TypeScript files
  if (className) {
    const classRegex = new RegExp(`\\b${className}\\b`, 'g');
    const tsFiles = getAllFiles(srcDir, '.ts').filter(f => f !== component.filePath);

    for (const tsFile of tsFiles) {
      const content = fs.readFileSync(tsFile, 'utf8');
      if (classRegex.test(content)) {
        return { used: true, reason: `Class referenced in ${tsFile}` };
      }
    }
  }

  return { used: false, reason: 'No usage found' };
}

function getAllFiles(dir, extension) {
  const files = [];

  function walk(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        walk(fullPath);
      } else if (item.endsWith(extension)) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

// Main execution
const srcDir = './src/app';
console.log('🔍 Scanning for unused components...\n');

const componentFiles = findComponentFiles(srcDir);
const unusedComponents = [];

for (const componentFile of componentFiles) {
  const component = getComponentInfo(componentFile);
  const usage = isComponentUsed(component, srcDir);

  if (!usage.used) {
    unusedComponents.push({
      ...component,
      reason: usage.reason
    });
  }
}

console.log(`📊 Results: ${unusedComponents.length} potentially unused components found out of ${componentFiles.length} total\n`);

if (unusedComponents.length > 0) {
  console.log('⚠️  Potentially unused components:');
  console.log('=====================================');

  unusedComponents.forEach((component, index) => {
    console.log(`${index + 1}. ${path.relative('.', component.filePath)}`);
    console.log(`   Class: ${component.className}`);
    console.log(`   Selector: ${component.selector}`);
    console.log(`   Reason: ${component.reason}\n`);
  });

  console.log('⚠️  Note: Manual verification recommended - this tool may have false positives for:');
  console.log('   - Dynamic component loading');
  console.log('   - Route components');
  console.log('   - Components used in tests');
  console.log('   - Lazy-loaded modules');
} else {
  console.log('✅ No unused components detected!');
}