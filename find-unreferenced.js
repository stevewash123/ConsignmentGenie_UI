#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get all component files
function getComponentFiles() {
  const components = [];

  function walk(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        walk(filePath);
      } else if (file.endsWith('.component.ts')) {
        components.push(filePath);
      }
    }
  }

  walk('src/app');
  return components;
}

// Get all HTML template files content
function getAllHtmlContent() {
  const htmlContent = [];

  function walk(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        walk(filePath);
      } else if (file.endsWith('.html')) {
        htmlContent.push(fs.readFileSync(filePath, 'utf8'));
      }
    }
  }

  walk('src/app');
  return htmlContent.join('\n');
}

// Get all route files content
function getAllRouteContent() {
  const routeContent = [];

  function walk(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        walk(filePath);
      } else if (file.includes('route') || file.includes('routing')) {
        routeContent.push(fs.readFileSync(filePath, 'utf8'));
      }
    }
  }

  walk('src/app');
  return routeContent.join('\n');
}

console.log('🔍 Finding unreferenced components...\n');

const components = getComponentFiles();
const allHtmlContent = getAllHtmlContent();
const allRouteContent = getAllRouteContent();

console.log(`Analyzing ${components.length} components...\n`);

const unreferenced = [];

for (const componentFile of components) {
  const content = fs.readFileSync(componentFile, 'utf8');

  // Extract selector
  const selectorMatch = content.match(/selector:\s*['"`]([^'"`]+)['"`]/);
  const selector = selectorMatch ? selectorMatch[1] : null;

  // Extract class name
  const classMatch = content.match(/export\s+class\s+(\w+Component)/);
  const className = classMatch ? classMatch[1] : null;

  if (!selector) continue;

  // Check if selector is used in HTML templates
  const selectorRegex = new RegExp(`<${selector}[\\s>]`, 'g');
  const selectorUsed = selectorRegex.test(allHtmlContent);

  // Check if class is referenced in route files
  const classUsed = className ? allRouteContent.includes(className) : false;

  // If neither selector nor class is used
  if (!selectorUsed && !classUsed) {
    unreferenced.push({
      file: componentFile,
      selector,
      className
    });
  }
}

console.log(`📊 Found ${unreferenced.length} unreferenced components:\n`);

if (unreferenced.length > 0) {
  unreferenced.forEach((comp, index) => {
    console.log(`${index + 1}. ${path.basename(comp.file)}`);
    console.log(`   Path: ${comp.file}`);
    console.log(`   Selector: ${comp.selector}`);
    console.log(`   Class: ${comp.className || 'Not found'}`);
    console.log('');
  });

  console.log('⚠️  These components have:');
  console.log('   - No selector usage in HTML templates');
  console.log('   - No class references in routing files');
  console.log('\n🗑️  Safe to delete after manual verification');
} else {
  console.log('✅ No unreferenced components found!');
}