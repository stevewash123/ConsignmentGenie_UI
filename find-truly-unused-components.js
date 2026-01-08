#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get all component files
function getComponentFiles() {
  const result = require('child_process').execSync(
    'find src/app -name "*.component.ts" -type f',
    { encoding: 'utf8' }
  );
  return result.trim().split('\n').filter(Boolean);
}

// Extract component selector and class name
function getComponentInfo(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const selectorMatch = content.match(/selector:\s*['"`]([^'"`]+)['"`]/);
  const classMatch = content.match(/export\s+class\s+(\w+Component)/);

  return {
    filePath,
    selector: selectorMatch ? selectorMatch[1] : null,
    className: classMatch ? classMatch[1] : null,
    fileName: path.basename(filePath, '.ts')
  };
}

// Check if selector is used in any template
function isSelectorUsed(selector) {
  if (!selector) return false;

  try {
    const result = require('child_process').execSync(
      `rg -q "<${selector}[\\s>]" src/app --type html`,
      { encoding: 'utf8', stdio: 'pipe' }
    );
    return true;
  } catch {
    return false;
  }
}

// Check if component class is imported/referenced
function isClassReferenced(className, excludeFile) {
  if (!className) return false;

  try {
    const result = require('child_process').execSync(
      `rg -q "\\b${className}\\b" src/app --type ts`,
      { encoding: 'utf8', stdio: 'pipe' }
    );

    // Check if it's referenced in files other than itself
    const references = require('child_process').execSync(
      `rg "\\b${className}\\b" src/app --type ts -l`,
      { encoding: 'utf8' }
    ).trim().split('\n').filter(f => f !== excludeFile);

    return references.length > 0;
  } catch {
    return false;
  }
}

// Get all route definitions
function getRouteDefinitions() {
  const routes = new Set();

  try {
    // Find routing files
    const routeFiles = require('child_process').execSync(
      'find src/app -name "*.routes.ts" -o -name "*.routing.ts" -o -name "*-routing.module.ts"',
      { encoding: 'utf8' }
    ).trim().split('\n').filter(Boolean);

    routeFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        // Extract path definitions
        const pathMatches = content.match(/path:\s*['"`]([^'"`]*)['"`]/g);
        if (pathMatches) {
          pathMatches.forEach(match => {
            const path = match.match(/path:\s*['"`]([^'"`]*)['"`]/)[1];
            if (path && path !== '**' && path !== '') {
              routes.add(path);
            }
          });
        }
      }
    });
  } catch (error) {
    console.log('⚠️  Could not parse route files:', error.message);
  }

  return Array.from(routes);
}

// Check if route path is reachable through navigation
function isRouteReachable(routePath) {
  if (!routePath) return false;

  try {
    // Look for routerLink references
    const result = require('child_process').execSync(
      `rg -q 'routerLink.*${routePath}|href.*${routePath}' src/app --type html --type ts`,
      { encoding: 'utf8', stdio: 'pipe' }
    );
    return true;
  } catch {
    return false;
  }
}

// Check if component might be a route component
function isLikelyRouteComponent(component) {
  const { fileName, filePath } = component;

  // Check if it's referenced in route files
  try {
    const result = require('child_process').execSync(
      `rg "${component.className}" src/app --type ts -l | grep -E "(routes|routing)"`,
      { encoding: 'utf8' }
    );
    return result.trim().length > 0;
  } catch {
    return false;
  }
}

// Main analysis
console.log('🔍 Analyzing components for actual usage...\n');

const components = getComponentFiles().map(getComponentInfo);
const routes = getRouteDefinitions();
const unusedComponents = [];

console.log(`Found ${components.length} components and ${routes.length} route paths\n`);

for (const component of components) {
  const selectorUsed = isSelectorUsed(component.selector);
  const classReferenced = isClassReferenced(component.className, component.filePath);
  const isRouteComp = isLikelyRouteComponent(component);

  // If selector is used OR class is referenced, it's used
  if (selectorUsed || classReferenced) {
    continue;
  }

  // If it's a route component, check if the route is reachable
  if (isRouteComp) {
    // Try to find corresponding route
    const possiblePaths = [
      component.fileName.replace('.component', ''),
      component.fileName.replace('-component', ''),
      component.fileName.replace('.component', '').replace('-', '/')
    ];

    const hasReachableRoute = possiblePaths.some(path =>
      routes.includes(path) && isRouteReachable(path)
    );

    if (!hasReachableRoute) {
      unusedComponents.push({
        ...component,
        reason: 'Route component with no reachable navigation path',
        type: 'route'
      });
    }
  } else {
    unusedComponents.push({
      ...component,
      reason: 'No selector usage and no class references found',
      type: 'component'
    });
  }
}

// Results
console.log(`📊 Analysis complete: ${unusedComponents.length} potentially unused components\n`);

if (unusedComponents.length > 0) {
  console.log('⚠️  Potentially unused components:');
  console.log('=====================================\n');

  const regularComponents = unusedComponents.filter(c => c.type === 'component');
  const routeComponents = unusedComponents.filter(c => c.type === 'route');

  if (regularComponents.length > 0) {
    console.log('🔸 Unused Components:');
    regularComponents.forEach((comp, i) => {
      console.log(`${i + 1}. ${path.relative('.', comp.filePath)}`);
      console.log(`   Selector: ${comp.selector || 'N/A'}`);
      console.log(`   Class: ${comp.className}\n`);
    });
  }

  if (routeComponents.length > 0) {
    console.log('🔸 Route Components (no reachable navigation):');
    routeComponents.forEach((comp, i) => {
      console.log(`${i + 1}. ${path.relative('.', comp.filePath)}`);
      console.log(`   Class: ${comp.className}\n`);
    });
  }

  console.log('⚠️  Recommendations:');
  console.log('   1. Manually verify each component before deletion');
  console.log('   2. Check for dynamic imports or lazy loading');
  console.log('   3. Verify route components are truly unreachable');
  console.log('   4. Check if components are used in tests only');

} else {
  console.log('✅ No unused components detected!');
}